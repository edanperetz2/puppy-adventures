import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS, letterGroup, letterShape, advanceTrace } from '../dist/letters.js';
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

test('Every starting letter gets a focused six-question game with three genuine choices', () => {
  for (const language of Object.keys(LETTERS)) for (let start = 0; start < LETTERS[language].length; start++) for (let seed = 0; seed < 12; seed++) {
    const group = letterGroup(language, start);
    const questions = createSession('letters', { ...DEFAULT_SETTINGS, letterLanguage: language, letterStart: start }, seeded(seed));
    assert.equal(questions.length, 6);
    assert.equal(questions[0].letter.id, LETTERS[language][start].id);
    for (const letter of group) assert.equal(questions.filter(q => q.answer === letter.id).length, 2);
    for (const q of questions) {
      assert.equal(q.type, 'letter');
      assert.equal(q.letter.language, language);
      assert.equal(new Set(q.options.map(o => o.id)).size, 3);
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
