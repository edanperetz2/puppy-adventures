import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS } from '../dist/letters.js';
import { sanitizeLetterPractice, recordLetters, suggestedLetters, practicedLetterCount, pendingLetterPractice } from '../dist/letter-progress.js';
import { freshProgress, finishSession, sanitizeProgress, sanitizeSettings, createSession } from '../dist/engine.js';

test('Recognition introduces every Hebrew and English letter before reviewing previously practiced letters', () => {
  for (const language of Object.keys(LETTERS)) {
    let progress = freshProgress();
    const encountered = new Set();
    for (let round = 0; encountered.size < LETTERS[language].length; round++) {
      assert.ok(round < 12);
      const group = suggestedLetters(progress.letterPractice, language);
      const remaining = LETTERS[language].length - encountered.size;
      assert.equal(group.filter(letter => !encountered.has(letter.id)).length, Math.min(3, remaining));
      const questions = createSession('letters', { letterLanguage: language, letterPractice: progress.letterPractice });
      assert.deepEqual(new Set(questions.map(q => q.answer)), new Set(group.map(letter => letter.id)));
      for (const letter of group) assert.equal(questions.filter(q => q.answer === letter.id).length, 2);
      progress = finishSession(progress, 'letters', 1, { language, ids: questions.map(q => q.answer) }).progress;
      for (const letter of group) encountered.add(letter.id);
      assert.equal(practicedLetterCount(progress.letterPractice, language, 'recognition'), encountered.size);
      assert.equal(practicedLetterCount(progress.letterPractice, language, 'writing'), 0);
      progress = sanitizeProgress(JSON.parse(JSON.stringify(progress)));
    }
    assert.equal(encountered.size, LETTERS[language].length);
    const next = suggestedLetters(progress.letterPractice, language);
    const min = Math.min(...progress.letterPractice[language].recognition);
    assert.ok(next.every(letter => progress.letterPractice[language].recognition[LETTERS[language].indexOf(letter)] === min));
  }
});

test('Old repeated rounds move beyond aleph without inventing historical letter mastery', () => {
  const old = { version: 1, sessions: 7, missions: { letters: 7 }, skills: { letters: { correct: 42, assisted: 3 } } };
  const restored = sanitizeProgress(old);
  assert.equal(practicedLetterCount(restored.letterPractice, 'hebrew', 'recognition'), 0);
  const group = suggestedLetters(restored.letterPractice, 'hebrew');
  assert.deepEqual(group.map(letter => letter.familiar), ['ד', 'ה', 'ו']);
  assert.deepEqual(suggestedLetters(restored.letterPractice, 'english').map(letter => letter.familiar), ['A', 'B', 'C']);
  const completed = finishSession(restored, 'letters', 0, { language: 'hebrew', ids: group.map(letter => letter.id) }).progress;
  const loaded = sanitizeProgress(JSON.parse(JSON.stringify(completed)));
  assert.deepEqual(suggestedLetters(loaded.letterPractice, 'hebrew').map(letter => letter.familiar), ['ז', 'ח', 'ט']);
  assert.equal(restored.sessions, 7);
  assert.equal(completed.sessions, 8);
});

test('Writing progress, recognition progress and the two languages stay independent', () => {
  const initial = sanitizeLetterPractice(null);
  const writing = recordLetters(initial, 'english', 'writing', ['en-l', 'en-l', 'bad']);
  assert.equal(writing.english.writing[11], 1);
  assert.equal(practicedLetterCount(writing, 'english', 'writing'), 1);
  assert.equal(practicedLetterCount(writing, 'english', 'recognition'), 0);
  assert.equal(practicedLetterCount(writing, 'hebrew', 'writing'), 0);
  assert.equal(initial.english.writing[11], 0);
  assert.equal(suggestedLetters(writing, 'english', 'writing', 1, 11)[0].familiar, 'M');
  assert.equal(suggestedLetters(writing, 'english', 'writing', 1, 20)[0].familiar, 'U');
  assert.equal(suggestedLetters(writing, 'english')[0].familiar, 'A');
  assert.deepEqual(recordLetters(writing, '__proto__', 'writing', ['en-a']), writing);
});

test('Per-letter saves are bounded, sanitized and preserve valid writing positions', () => {
  const corrupt = { hebrew: { start: 900, recognition: [-1, '1', NaN, Infinity, 32000001, 2], writing: [1] }, english: { start: 2, recognition: Array(4000).fill(3) }, extra: { writing: [99] } };
  const clean = sanitizeLetterPractice(corrupt);
  assert.equal(clean.hebrew.start, 0);
  assert.deepEqual(clean.hebrew.recognition.slice(0, 6), [0, 0, 0, 0, 0, 2]);
  assert.equal(clean.hebrew.writing.length, 27);
  assert.equal(clean.english.recognition.length, 26);
  assert.deepEqual(Object.keys(clean), ['english', 'hebrew']);
  assert.deepEqual(sanitizeLetterPractice(JSON.parse(JSON.stringify(clean))), clean);
  const settings = sanitizeSettings({ letterWriting: { hebrew: 5, english: 11 } });
  assert.deepEqual(settings.letterWriting, { english: 11, hebrew: 5 });
  assert.deepEqual(sanitizeSettings({ letterWriting: { hebrew: -2, english: 200 } }).letterWriting, { english: 0, hebrew: 0 });
  const defaults = sanitizeSettings(null);
  defaults.letterWriting.hebrew = 6;
  assert.equal(sanitizeSettings(null).letterWriting.hebrew, 0);
});

test('Shared letter counters include only pending device changes and retain the review order', () => {
  const remote = sanitizeLetterPractice(null), own = sanitizeLetterPractice(null), confirmed = sanitizeLetterPractice(null);
  remote.hebrew.recognition[3] = 10;
  own.hebrew.recognition[3] = 4;
  confirmed.hebrew.recognition[3] = 2;
  own.hebrew.start = 3;
  own.english.writing[11] = 1;
  const pending = pendingLetterPractice(remote, own, confirmed);
  assert.equal(pending.hebrew.recognition[3], 12);
  assert.equal(pending.hebrew.start, 3);
  assert.equal(pending.english.writing[11], 1);
  assert.equal(remote.hebrew.recognition[3], 10);
  assert.deepEqual(pendingLetterPractice(pending, own, own), pending);
});
