import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, READING_LEVELS, readingWords } from '../dist/reading.js';
import { CLIPS } from '../dist/content.js';
import { art, hasArt } from '../dist/art.js';
import { hebrewSpeech } from '../dist/hebrew-pronunciation.js';
import { createSession, DEFAULT_SETTINGS, sanitizeSettings } from '../dist/engine.js';

function seeded(seed) { seed = Math.imul(seed + 1, 0x9e3779b1) >>> 0; return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }
const lettersIn = text => [...text.matchAll(/[א-ת]/gu)].length;

test('Four reading stages include 24 new illustrated words with complete Hebrew pronunciation', () => {
  assert.equal(WORDS.length, 36);
  assert.equal(new Set(WORDS.map(word => word.id)).size, WORDS.length);
  assert.deepEqual(Object.values(READING_LEVELS).filter(stage => stage.number).map(stage => stage.number), [1, 2, 3, 4]);
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
  for (const reading of ['familiar', 'long', 'challenge']) assert.equal(sanitizeSettings({ reading }).reading, reading);
  assert.equal(sanitizeSettings({ reading: '__proto__' }).reading, 'short');
  assert.equal(sanitizeSettings({ reading: 'constructor' }).reading, 'short');
  assert.deepEqual(readingWords('__proto__'), readingWords('short'));
  assert.equal(readingWords('all').length, WORDS.length);
});
