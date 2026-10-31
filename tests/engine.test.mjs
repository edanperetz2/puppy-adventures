import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, DEFAULT_SETTINGS, SESSION_LENGTH, finishSession, freshProgress, sanitizeSettings, sanitizeProgress } from '../dist/engine.js';
import { CLIPS, STICKERS } from '../dist/content.js';

function seeded(seed) {
  return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
}

test('Every activity has six solvable questions with unique choices and audio', () => {
  for (let seed = 0; seed < 200; seed++) {
    for (const mission of ['hebrew', 'english', 'math']) {
      for (const max of [5, 10, 20]) {
        const settings = { ...DEFAULT_SETTINGS, mathMax: max, englishMax: seed % 2 ? 10 : 20, reading: seed % 2 ? 'short' : 'all' };
        const questions = createSession(mission, settings, seeded(seed));
        assert.equal(questions.length, SESSION_LENGTH);
        for (const q of questions) {
          assert.equal(q.options.length, 3);
          assert.equal(new Set(q.options.map(o => o.id)).size, 3);
          assert.equal(q.options.filter(o => o.id === q.answer).length, 1);
          assert.ok(CLIPS[q.prompt]);
          assert.ok(CLIPS[q.hint]);
          if (q.type === 'listen') { assert.ok(CLIPS[q.targetClip]); assert.equal(q.target.en, q.target.en.toUpperCase()); }
          if (q.type === 'add') { assert.equal(q.a + q.b, Number(q.answer)); assert.ok(q.a >= 1 && q.b >= 1); }
          if (mission === 'math') { assert.ok(q.total <= max); assert.ok(q.total >= 2); assert.ok(q.options.every(o => o.number >= 0 && o.number <= max)); }
          if (q.type === 'read' && settings.reading === 'short') assert.equal(q.word.level, 1);
        }
      }
    }
  }
});

test('English always includes two animal, two color, and two spoken-number questions', () => {
  const questions = createSession('english', DEFAULT_SETTINGS, seeded(42));
  for (const kind of ['animal', 'color', 'number']) assert.equal(questions.filter(q => q.kind === kind).length, 2);
});

test('Math alternates visual counting and addition without subtraction', () => {
  assert.deepEqual(createSession('math').map(q => q.type), ['count', 'add', 'count', 'add', 'count', 'add']);
});

test('Completing adventures preserves previous progress and unlocks stickers once', () => {
  const original = freshProgress();
  let progress = original;
  for (let i = 0; i < 15; i++) {
    const result = finishSession(progress, 'hebrew', 2);
    progress = result.progress;
    assert.equal(result.sticker, STICKERS[i] || null);
  }
  assert.equal(original.sessions, 0);
  assert.equal(progress.sessions, 15);
  assert.equal(progress.stars, 90);
  assert.equal(progress.stickers.length, 15);
  assert.equal(progress.skills.hebrew.correct, 90);
  assert.equal(progress.skills.hebrew.assisted, 30);
  assert.equal(progress.missions.english, 0);
});

test('Malformed saved settings and progress do not corrupt a game', () => {
  assert.deepEqual(sanitizeSettings({ mathMax: -5, englishMax: 300, reading: '<script>', sound: 'false' }), DEFAULT_SETTINGS);
  const result = sanitizeProgress({ version: 1, stars: -2, sessions: 'oops', stickers: ['star', 'star', 'bad'], missions: { math: 2 }, skills: { math: { correct: 3, assisted: 20 } } });
  assert.equal(result.stars, 0);
  assert.equal(result.sessions, 0);
  assert.deepEqual(result.stickers, ['star']);
  assert.equal(result.missions.math, 2);
  assert.equal(result.skills.math.assisted, 3);
});
