import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, READING_LEVELS, readingWords, readingTargets, nextReadingStage, sanitizeReadingPractice, finishReadingPractice } from '../dist/reading.js';
import { CLIPS } from '../dist/content.js';
import { art, hasArt } from '../dist/art.js';
import { hebrewSpeech } from '../dist/hebrew-pronunciation.js';
import { createSession, DEFAULT_SETTINGS, sanitizeSettings } from '../dist/engine.js';

function seeded(seed) { seed = Math.imul(seed + 1, 0x9e3779b1) >>> 0; return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }
const lettersIn = text => [...text.matchAll(/[א-ת]/gu)].length;

test('Ten reading stages have illustrated words, phrases and sentences with complete Hebrew pronunciation', () => {
  assert.equal(WORDS.length, 108);
  assert.equal(new Set(WORDS.map(word => word.id)).size, WORDS.length);
  assert.deepEqual(Object.values(READING_LEVELS).filter(stage => stage.number).map(stage => stage.number), Array.from({ length: 10 }, (_, i) => i + 1));
  for (const key of ['long', 'challenge']) {
    const pool = readingWords(key);
    assert.equal(pool.length, 12);
    for (const word of pool) {
      assert.ok(lettersIn(word.pointed) >= (key === 'long' ? 4 : 5), `${word.pointed} must be longer than beginner words`);
      assert.ok(lettersIn(word.he) <= (key === 'long' ? 5 : 8));
    }
  }
  assert.equal(new Set(WORDS.map(word => art(word.id))).size, WORDS.length, 'Every answer needs its own recognizable drawing');
  for (const word of WORDS) {
    assert.ok(hasArt(word.id), `Missing illustration: ${word.id}`);
    assert.match(word.pointed, /[\u05b0-\u05bd]/u);
    assert.equal(CLIPS[`he-${word.id}`]?.lang, 'he-IL');
    assert.equal(CLIPS[`he-${word.id}`]?.speech, hebrewSpeech(word.pointed));
  }
  for (const stage of Object.values(READING_LEVELS)) {
    assert.equal(CLIPS[stage.clip]?.lang, 'he-IL');
    for (const id of stage.samples || []) assert.ok(readingWords(Object.keys(READING_LEVELS).find(key => READING_LEVELS[key] === stage)).some(word => word.id === id));
  }
});

test('Phrase choices require the color, quantity, position or action, with no noun-only shortcuts', () => {
  for (const key of ['colors', 'quantities', 'positions', 'actions', 'sentences']) {
    const pool = readingWords(key);
    assert.equal(pool.length, 12);
    assert.equal(new Set(pool.map(word => word.family)).size, 4);
    for (const word of pool) {
      const family = pool.filter(item => item.family === word.family);
      assert.equal(family.length, 3);
      assert.ok(family.every(item => item.scene.object === word.scene.object));
      assert.equal(new Set(family.map(item => JSON.stringify(item.scene))).size, 3);
    }
    for (let seed = 0; seed < 40; seed++) for (const q of createSession('hebrew', { ...DEFAULT_SETTINGS, reading: key }, seeded(seed))) {
      assert.equal(q.prompt, 'reading-phrase');
      assert.equal(q.hint, 'reading-phrase-hint');
      assert.ok(q.options.every(option => option.family === q.word.family));
    }
  }
  assert.deepEqual(WORDS.find(word => word.id === 'facts-butterflies-two-blue').scene, { kind: 'count', object: 'butterfly', count: 2, color: 'blue', flying: true });
  assert.equal(WORDS.find(word => word.id === 'place-ball-under').scene.position, 'under');
  assert.equal(WORDS.find(word => word.id === 'action-bird-sleep').pointed, 'צִפּוֹר יְשֵׁנָה');
  assert.equal(WORDS.find(word => word.id === 'action-dog-sleep').pointed, 'כֶּלֶב יָשֵׁן');
  assert.match(CLIPS['he-place-ball-under'].speech, /mitˈaχat/u);
  // A single-word "dog" question must not also offer a valid sleeping-dog picture.
  for (let seed = 0; seed < 120; seed++) for (const q of createSession('hebrew', { ...DEFAULT_SETTINGS, reading: 'all' }, seeded(seed))) {
    if (q.word.scene) assert.ok(q.options.every(option => option.family === q.word.family));
    else assert.ok(q.options.every(option => !option.scene));
  }
});

test('Completed rounds rotate through the stage before reviewing its oldest items', () => {
  for (const key of ['long', 'challenge', 'explorers', 'colors', 'quantities', 'positions', 'actions', 'sentences', 'all']) {
    const pool = readingWords(key);
    let practice = sanitizeReadingPractice(null), seen = new Set(), previous = new Set();
    const rounds = Math.ceil(pool.length / 6);
    for (let round = 0; round < rounds + 3; round++) {
      const targets = readingTargets(pool, practice.recent[key], 6, seeded(round));
      assert.equal(new Set(targets.map(word => word.id)).size, 6);
      assert.ok(targets.every(word => !previous.has(word.id)), 'A new round should not repeat the previous six');
      if (round < rounds) assert.ok(targets.every(word => !seen.has(word.id)), 'Unseen items come before review');
      for (const word of targets) seen.add(word.id);
      const before = structuredClone(practice);
      const updated = finishReadingPractice(practice, key, targets);
      assert.deepEqual(practice, before, 'Saving history must not mutate an earlier snapshot');
      practice = sanitizeReadingPractice(JSON.parse(JSON.stringify(updated)));
      assert.deepEqual(practice, updated, 'The recent-item queue must survive closing and reopening the game');
      previous = new Set(targets.map(word => word.id));
      assert.ok(practice.recent[key].length <= pool.length);
      if (round === rounds - 1) assert.equal(seen.size, pool.length);
    }
  }
  assert.deepEqual(readingTargets([], [], 6), []);
  assert.deepEqual(sanitizeReadingPractice({ recent: { long: ['missing', 'rabbit', 'rabbit', null] } }).recent.long, ['rabbit']);
  assert.equal(sanitizeReadingPractice({}).recent.sentences.length, 0);
});

test('Advancement offers only the immediately following stage after five independent answers', () => {
  for (const [key, stage] of Object.entries(READING_LEVELS)) {
    const expected = stage.number && stage.number < 10 ? Object.keys(READING_LEVELS).find(next => READING_LEVELS[next].number === stage.number + 1) : null;
    assert.equal(nextReadingStage(key, 0), expected);
    assert.equal(nextReadingStage(key, 1), expected);
    for (const assisted of [2, 3, 6, -1, NaN, undefined, '0']) assert.equal(nextReadingStage(key, assisted), null);
  }
  assert.equal(nextReadingStage('__proto__', 0), null);
});

test('Chosen stages keep targets and distractors at that stage, with six varied questions', () => {
  for (const [key, stage] of Object.entries(READING_LEVELS)) {
    const pool = readingWords(key), seen = new Set();
    for (let seed = 0; seed < 120; seed++) {
      const questions = createSession('hebrew', { ...DEFAULT_SETTINGS, reading: key }, seeded(seed));
      assert.equal(questions.length, 6);
      assert.equal(new Set(questions.map(q => q.answer)).size, Math.min(6, pool.length));
      for (const q of questions) {
        seen.add(q.answer);
        assert.ok(pool.some(word => word.id === q.word.id));
        assert.equal(q.options.length, 3);
        assert.equal(new Set(q.options.map(word => word.id)).size, 3);
        assert.equal(q.options.filter(word => word.id === q.answer).length, 1);
        if (stage.level !== null) assert.ok(q.options.every(word => word.level === stage.level));
        assert.equal(q.targetClip, undefined, 'The opening instruction must let Ariel read before revealing the spoken answer');
      }
    }
    assert.equal(seen.size, pool.length, 'Every word must be reachable across rounds');
  }
});

test('Reading preferences accept new stages and preserve the previous short and mixed choices', () => {
  assert.equal(sanitizeSettings({ reading: 'short' }).reading, 'short');
  assert.equal(sanitizeSettings({ reading: 'all' }).reading, 'all');
  for (const reading of Object.keys(READING_LEVELS)) assert.equal(sanitizeSettings({ reading }).reading, reading);
  assert.equal(sanitizeSettings({ reading: '__proto__' }).reading, 'short');
  assert.equal(sanitizeSettings({ reading: 'constructor' }).reading, 'short');
  assert.deepEqual(readingWords('__proto__'), readingWords('short'));
  assert.equal(readingWords('all').length, WORDS.length);
});
