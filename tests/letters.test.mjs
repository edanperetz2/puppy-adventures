import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS, letterGroup, letterShape, advanceTrace } from '../dist/letters.js';
import { HEBREW_HANDWRITING } from '../dist/hebrew-handwriting.js';
import { writingDuration, PEN_LIFT_MS } from '../dist/letter-pad.js';
import { CLIPS } from '../dist/content.js';
import { createSession, DEFAULT_SETTINGS, sanitizeSettings, sanitizeProgress, finishSession } from '../dist/engine.js';

function seeded(seed) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }

test('Both alphabets have complete, distinct teaching forms and recorded names', () => {
  assert.equal(LETTERS.english.map(l => l.familiar).join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
  assert.equal(LETTERS.english.map(l => l.small).join(''), 'abcdefghijklmnopqrstuvwxyz');
  assert.equal(LETTERS.hebrew.map(l => l.familiar).join(''), 'אבגדהוזחטיכלמנסעפצקרשתךםןףץ');
  assert.equal(LETTERS.hebrew.filter(l => l.final).map(l => l.familiar).join(''), 'ךםןףץ');
  const all = [...LETTERS.english, ...LETTERS.hebrew];
  assert.equal(new Set(all.map(l => l.id)).size, 53);
  assert.equal(new Set(all.map(l => l.strokes.join('|'))).size, 53, 'Every form must remain visually distinct');
  for (const letter of all) {
    assert.ok(letter.strokes.length >= 1);
    for (const path of letter.strokes) assert.match(path, /^M\d+(?:\.\d+)? \d+/u);
    assert.equal(CLIPS[letter.clip]?.lang, letter.language === 'hebrew' ? 'he-IL' : 'en-US');
    assert.equal((letterShape(letter, { pad: true }).match(/data-stroke=/gu) || []).length, letter.strokes.length);
  }
});

test('Hebrew models and writing pads use the same pen paths, with isolated RTL direction and no font clipping', () => {
  assert.equal(Object.keys(HEBREW_HANDWRITING).length, 27);
  assert.equal(new Set(Object.values(HEBREW_HANDWRITING)).size, 27);
  for (const letter of LETTERS.hebrew) {
    assert.equal(letter.outline, HEBREW_HANDWRITING[letter.familiar]);
    assert.ok(letter.outline.length > 100);
    const display = letterShape(letter);
    assert.match(display, /lang="he" dir="rtl"/u);
    for (const stroke of letter.strokes) assert.ok(display.includes(`d="${stroke}"`));
    assert.doesNotMatch(display, /data-stroke=/u, 'Matching choices must show the typeface, without construction lines');
    for (let copy = 0; copy < 2; copy++) {
      const pad = letterShape(letter, { pad: true });
      assert.doesNotMatch(pad, /clipPath|clip-path|letter-model/u, 'A wide clipped brush must not fill future parts of crossing strokes');
      assert.match(pad, /stroke-width="11"/u);
      assert.match(pad, /class="letter-direction"/u);
      for (const stroke of letter.strokes) assert.ok(pad.includes(`d="${stroke}"`));
      assert.equal((pad.match(/data-stroke=/gu) || []).length, letter.strokes.length);
    }
  }
  for (const letter of LETTERS.english) {
    const svg = letterShape(letter);
    assert.match(svg, /lang="en" dir="ltr"/u);
    assert.doesNotMatch(svg, /letter-model|clipPath/u);
  }
});

test('Reported Hebrew loops begin below the body and remain one continuous pen stroke', () => {
  for (const id of ['he-shin', 'he-pe-final', 'he-tsadi-final']) {
    const letter = LETTERS.hebrew.find(item => item.id === id);
    assert.equal(letter.strokes.length, 1);
    const [x, y] = letter.strokes[0].match(/^M([\d.]+) ([\d.]+)/u).slice(1).map(Number);
    assert.ok(y >= 170, `${id} must start at the lower entry, not across the upper loop`);
    assert.ok(x > 90 && x < 180);
    assert.equal((letter.strokes[0].match(/M/gu) || []).length, 1);
  }
  const tav = LETTERS.hebrew.find(item => item.id === 'he-tav');
  assert.equal(tav.strokes.length, 2, 'The arch and the left stem are separate strokes');
});

test('Tracing a small loop cannot jump ahead at its crossing or complete from a stationary finger', () => {
  const loop = Array.from({ length: 14 }, (_, i) => ({ x: 110 - 10 * Math.cos(i * Math.PI * 2 / 13), y: 100 + 10 * Math.sin(i * Math.PI * 2 / 13) }));
  assert.ok(advanceTrace(loop, 0, { x: 100, y: 99 }, 25, loop[0]) <= 1);
  let progress = 0, previous = loop[0];
  for (const point of loop.slice(1)) { progress = advanceTrace(loop, progress, point, 25, previous); previous = point; }
  assert.equal(progress, loop.length - 1);
  assert.equal(advanceTrace(loop, 0, loop[0], 25, loop[0]), 0);
});

test('Long writing loops have time to unfold and separate strokes have a visible pen lift', () => {
  assert.ok(writingDuration(380) >= 4000);
  assert.ok(writingDuration(380) > writingDuration(100) * 2);
  assert.ok(writingDuration(1) >= 650);
  assert.ok(PEN_LIFT_MS >= 500);
});

test('Every starting letter gets six questions that move from a shown model to recall', () => {
  for (const language of Object.keys(LETTERS)) for (let start = 0; start < LETTERS[language].length; start++) for (let seed = 0; seed < 12; seed++) {
    const group = letterGroup(language, start);
    const questions = createSession('letters', { ...DEFAULT_SETTINGS, letterLanguage: language, letterStart: start }, seeded(seed));
    assert.equal(questions.length, 6);
    assert.deepEqual(new Set(questions.slice(0, 3).map(q => q.answer)), new Set(group.map(letter => letter.id)));
    assert.deepEqual(group.map(letter => questions.filter(q => q.answer === letter.id).length).sort(), [2, 2, 2]);
    for (const [index, q] of questions.entries()) {
      assert.equal(q.type, 'letter');
      assert.equal(q.letter.language, language);
      assert.equal(new Set(q.options.map(o => o.id)).size, index < 4 ? 2 : 3);
      assert.equal(q.showModel, index < 3);
      assert.equal(q.options.filter(o => o.id === q.answer).length, 1);
      assert.equal(q.prompt, `letter-match-${language}`);
      assert.ok(CLIPS[q.prompt]); assert.ok(CLIPS[q.targetClip]); assert.ok(CLIPS[q.hint]);
    }
  }
});

test('Tracing accepts a shaky finger, preserves progress and rejects distant jumps', () => {
  const points = Array.from({ length: 51 }, (_, i) => ({ x: i * 4, y: 100 }));
  assert.equal(advanceTrace(points, 0, { x: 24, y: 110 }), 6);
  assert.equal(advanceTrace(points, 6, { x: 40, y: 90 }), 10);
  assert.equal(advanceTrace(points, 6, { x: 24, y: 180 }), 6);
  assert.equal(advanceTrace(points, 6, { x: 195, y: 100 }), 6);
  assert.equal(advanceTrace(points, 20, { x: 0, y: 100 }), 20);
});

test('Letter progress extends an older album and language defaults safely', () => {
  assert.deepEqual(letterGroup('__proto__'), LETTERS.hebrew.slice(0, 3));
  const old = { version: 1, sessions: 2, stars: 12, stickers: ['flower', 'boat'], missions: { hebrew: 1, clock: 1 }, skills: { hebrew: { correct: 6, assisted: 1 }, clock: { correct: 6, assisted: 2 } } };
  const restored = sanitizeProgress(old);
  assert.equal(restored.sessions, 2); assert.equal(restored.missions.letters, 0);
  const completed = finishSession(restored, 'letters', 2).progress;
  assert.equal(completed.sessions, 3); assert.equal(completed.missions.letters, 1);
  assert.equal(completed.missions.clock, 1); assert.equal(completed.skills.letters.assisted, 2);
  assert.deepEqual(completed.stickers, ['flower', 'boat', 'star']);
  assert.equal(sanitizeSettings({}).letterLanguage, 'hebrew');
  assert.equal(sanitizeSettings({ letterLanguage: 'english' }).letterLanguage, 'english');
  assert.equal(sanitizeSettings({ letterLanguage: '__proto__' }).letterLanguage, 'hebrew');
});
