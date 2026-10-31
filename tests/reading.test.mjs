import test from 'node:test';
import assert from 'node:assert/strict';
import { WORDS, READING_LEVELS, readingWords, readingTargets, nextReadingStage, sanitizeReadingPractice, finishReadingPractice } from '../dist/reading.js';
import { CLIPS } from '../dist/content.js';
import { art, hasArt } from '../dist/art.js';
import { hebrewSpeech } from '../dist/hebrew-pronunciation.js';
import { createSession, DEFAULT_SETTINGS, sanitizeSettings, SESSION_LENGTH } from '../dist/engine.js';
import { VOCABULARY, distinctWordPictures } from '../dist/vocabulary.js';

function seeded(seed) { seed = Math.imul(seed + 1, 0x9e3779b1) >>> 0; return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }
const lettersIn = text => [...text.matchAll(/[א-ת]/gu)].length;

test('Ten reading stages have illustrated words, phrases and sentences with complete Hebrew pronunciation', () => {
  assert.equal(WORDS.length, 416);
  assert.equal(WORDS.filter(word => !word.scene).length, 276);
  assert.equal(new Set(WORDS.map(word => word.he)).size, WORDS.length, 'Repeated spellings must not inflate the vocabulary');
  assert.equal(new Set(WORDS.map(word => word.id)).size, WORDS.length);
  assert.deepEqual(Object.values(READING_LEVELS).filter(stage => stage.number).map(stage => stage.number), Array.from({ length: 10 }, (_, i) => i + 1));
  for (const key of ['long', 'challenge']) {
    const pool = readingWords(key);
    assert.ok(pool.length >= 22);
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
    assert.equal(CLIPS[`he-${word.id}`]?.speech, hebrewSpeech(word.spoken || word.pointed));
  }
  for (const stage of Object.values(READING_LEVELS)) {
    assert.equal(CLIPS[stage.clip]?.lang, 'he-IL');
    for (const id of stage.samples || []) assert.ok(readingWords(Object.keys(READING_LEVELS).find(key => READING_LEVELS[key] === stage)).some(word => word.id === id));
  }
});

test('Phrase choices require the color, quantity, position or action, with no noun-only shortcuts', () => {
  for (const key of ['colors', 'quantities', 'positions', 'actions', 'sentences']) {
    const pool = readingWords(key);
    assert.ok(pool.length >= 20);
    assert.ok(new Set(pool.map(word => word.family)).size >= 4);
    for (const word of pool) {
      const family = pool.filter(item => item.family === word.family);
      assert.ok(family.length >= 3);
      assert.ok(family.every(item => item.scene.object === word.scene.object));
      assert.equal(new Set(family.map(item => JSON.stringify(item.scene))).size, family.length);
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
  for (const key of Object.keys(READING_LEVELS)) {
    const pool = readingWords(key);
    let practice = sanitizeReadingPractice(null), seen = new Set(), previous = new Set();
    const rounds = Math.ceil(pool.length / SESSION_LENGTH);
    for (let round = 0; round < rounds + 3; round++) {
      const targets = readingTargets(pool, practice.recent[key], SESSION_LENGTH, seeded(round));
      assert.equal(new Set(targets.map(word => word.id)).size, SESSION_LENGTH);
      assert.ok(targets.every(word => !previous.has(word.id)), 'A new round should not repeat the previous ten');
      const unseen = pool.filter(word => !seen.has(word.id));
      assert.equal(targets.filter(word => !seen.has(word.id)).length, Math.min(SESSION_LENGTH, unseen.length), 'Every remaining unseen target comes before review');
      const repeated = targets.filter(word => seen.has(word.id));
      const oldest = practice.recent[key].slice(0, repeated.length);
      assert.deepEqual(new Set(repeated.map(word => word.id)), new Set(oldest), 'Review fills a partial round from the oldest practiced targets');
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

test('Advancement offers only the immediately following stage after eight independent answers', () => {
  for (const [key, stage] of Object.entries(READING_LEVELS)) {
    const expected = stage.number && stage.number < 10 ? Object.keys(READING_LEVELS).find(next => READING_LEVELS[next].number === stage.number + 1) : null;
    assert.equal(nextReadingStage(key, 0), expected);
    assert.equal(nextReadingStage(key, 1), expected);
    assert.equal(nextReadingStage(key, 2), expected);
    for (const assisted of [3, 6, 10, -1, NaN, undefined, '0']) assert.equal(nextReadingStage(key, assisted), null);
  }
  assert.equal(nextReadingStage('__proto__', 0), null);
});

test('Chosen stages keep targets and distractors at that stage, with ten varied questions', () => {
  for (const [key, stage] of Object.entries(READING_LEVELS)) {
    const pool = readingWords(key), seen = new Set();
    let practice = sanitizeReadingPractice(null);
    for (let seed = 0; seed < 120; seed++) {
      const questions = createSession('hebrew', { ...DEFAULT_SETTINGS, reading: key, readingRecent: practice.recent[key] }, seeded(seed));
      assert.equal(questions.length, SESSION_LENGTH);
      assert.equal(new Set(questions.map(q => q.answer)).size, Math.min(SESSION_LENGTH, pool.length));
      for (const [index,q] of questions.entries()) {
        seen.add(q.answer);
        assert.ok(pool.some(word => word.id === q.word.id));
        assert.equal(q.options.length, index < 3 ? 2 : 3);
        assert.equal(new Set(q.options.map(word => word.id)).size, q.options.length);
        assert.equal(q.options.filter(word => word.id === q.answer).length, 1);
        if (stage.level !== null) assert.ok(q.options.every(word => word.level === stage.level));
        assert.equal(q.targetClip, undefined, 'The opening instruction must let Ariel read before revealing the spoken answer');
      }
      practice = finishReadingPractice(practice, key, questions.map(q => q.word));
    }
    assert.equal(seen.size, pool.length, 'Every word must be reachable across rounds');
  }
});

test('New vocabulary spans everyday subjects and excludes overlapping picture meanings', () => {
  assert.equal(VOCABULARY.length, 228);
  assert.ok(new Set(VOCABULARY.map(word => word.theme)).size >= 9);
  for (const [broad, specific] of [['bird', 'parrot'], ['fish', 'shark'], ['car', 'taxi'], ['shoe', 'sandal'], ['handbag', 'backpack']]) {
    assert.equal(distinctWordPictures({ id: broad }, { id: specific }), false);
    assert.equal(distinctWordPictures({ id: specific }, { id: broad }), false);
  }
  for (const key of ['short', 'familiar', 'long', 'challenge', 'explorers', 'all']) {
    let practice = sanitizeReadingPractice(null);
    for (let seed = 0; seed < 90; seed++) {
      const questions = createSession('hebrew', { ...DEFAULT_SETTINGS, reading: key, readingRecent: practice.recent[key] }, seeded(seed));
      for (const question of questions.filter(q => !q.word.scene)) for (const option of question.options) {
        if (option.id !== question.answer) assert.ok(distinctWordPictures(question.word, option));
      }
      practice = finishReadingPractice(practice, key, questions.map(q => q.word));
    }
  }
});

test('Expanded phrases use feminine quantities and verbs, and visibly different scene details', () => {
  const find = id => WORDS.find(word => word.id === id);
  assert.equal(find('count-banana-2').pointed, 'שְׁתֵּי בָּנָנוֹת');
  assert.equal(find('count-cookie-3').pointed, 'שָׁלוֹשׁ עוּגִיּוֹת');
  assert.equal(find('action-bird-drink').pointed, 'צִפּוֹר שׁוֹתָה');
  assert.equal(find('action-dog-drink').pointed, 'כֶּלֶב שׁוֹתֶה');
  assert.notEqual(art('facts-balloons-three-red'), art('facts-balloons-three-blue'));
  assert.notEqual(art('facts-bee-small-above'), art('facts-bee-big-above'));
  assert.notEqual(art('action-cat-eat'), art('action-cat-drink'));
  assert.notEqual(art('facts-books-two-on'), art('facts-books-two-under'));
});

test('An older reading history retains its real practice and offers added words before review', () => {
  const old = { recent: { long: ['rabbit', 'duck', 'apple', 'grapes', 'watermelon', 'pineapple', 'airplane', 'helicopter', 'window', 'table', 'snail', 'guitar'] } };
  const saved = sanitizeReadingPractice(old);
  assert.deepEqual(saved.recent.long, old.recent.long);
  const targets = readingTargets(readingWords('long'), saved.recent.long, 6, seeded(19));
  assert.ok(targets.every(word => !old.recent.long.includes(word.id)));
  assert.deepEqual(sanitizeReadingPractice(JSON.parse(JSON.stringify(saved))), saved);
});

test('Short-word audio context retains the target word without adding it to the reading prompt', () => {
  for (const id of ['panda', 'banana', 'strawberry', 'pretzel', 'shoe', 'drum', 'yoyo']) {
    const word = WORDS.find(item => item.id === id);
    assert.equal(word.spoken, `הַמִּלָּה הִיא ${word.pointed}.`);
    assert.equal(CLIPS[`he-${id}`].text, word.pointed);
    assert.doesNotMatch(word.pointed, /הַמִּלָּה/u);
    assert.equal(CLIPS[`he-${id}`].speech, hebrewSpeech(word.spoken));
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
