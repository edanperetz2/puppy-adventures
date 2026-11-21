import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { createSession, freshProgress } from '../dist/engine.js';
import { seeded } from '../dist/journey.js';
import { itemLabel } from '../dist/learning-parent.js';
import { applyObservations, questionLearning } from '../dist/learning.js';
import { awardLocalRound, checkpointScoredRound, finishScoredRound } from '../dist/round-lifecycle.js';
import { cleanDrafts, packRound, roundKey, unpackRound } from '../dist/session-state.js';
import { STICKERS } from '../dist/stickers.js';
import { WORD_FORM_WORDS } from '../dist/word-form-match.js';

const languages = ['english', 'hebrew'];
const start = Date.UTC(2026, 10, 21, 8);
const settings = (language, mode, learning = {}) => ({ letterLanguage: language, letterMode: mode, learning });

function play(language, mode, learning = {}) {
  return createSession('letters', settings(language, mode, learning), seeded(461));
}

function learn(questions) {
  return applyObservations({}, questions.map((question, index) => ({
    ...questionLearning(question), kind: 'independent', at: start + index,
  })));
}

function sampleRound(language, mode = 'words') {
  const questions = play(language, mode);
  const index = 2;
  const wrong = questions[index].options.find(option => option.id !== questions[index].answer);
  return {
    mission: 'letters', id: randomUUID(), key: roundKey('letters', settings(language, mode)), letterLanguage: language,
    letterIds: mode === 'words' ? null : [...new Set(questions.map(question => question.answer))],
    questions, index, resolved: false, attempted: new Set([wrong.id]), counted: new Set(),
    helped: new Set([index]), observed: new Set([0, 1, index]), at: start,
  };
}

const toStorage = round => JSON.parse(JSON.stringify(packRound(round)));

test('real learning observations rotate whole words within their own language and keep recognition independent', () => {
  for (const language of languages) {
    const other = languages.find(value => value !== language);
    const first = play(language, 'words');
    const learning = learn(first);
    for (const q of first) {
      const { item, domain } = questionLearning(q);
      assert.equal(item, `word-form:${language}:${q.answer}`);
      assert.equal(domain, 'letters');
      assert.equal(learning[item].independent, 1);
      assert.ok(itemLabel(item).endsWith(q.word.plain));
    }
    const next = play(language, 'words', learning);
    const used = new Set(first.map(q => q.answer));
    assert.ok(next.every(q => !used.has(q.answer)));
    assert.deepEqual(play(other, 'words', learning), play(other, 'words'));
    const letters = play(language, 'recognition');
    assert.ok(letters.every(q => q.type === 'letter'));
    assert.deepEqual(play(language, 'recognition', learning), letters);
    assert.deepEqual(play(language, 'words', learn(letters)), first);

    // A merged learning ledger can have a different insertion order on each device.
    // With identical history and randomness, both devices should draw the same
    // review. Changing the random seed should vary even a fully practised deck.
    const oldest = first.slice(0, 2).map(q => q.answer);
    const events = WORD_FORM_WORDS[language].map((word, i) => {
      const order = oldest.indexOf(word.id);
      return { item: `word-form:${language}:${word.id}`, domain: 'letters', kind: 'independent',
        at: start + (order < 0 ? i + 2 : order) };
    });
    const items = applyObservations({}, events);
    assert.deepEqual(play(language, 'words', items), play(language, 'words', applyObservations({}, [...events].reverse())));
    const recent = events.toSorted((a, b) => a.at - b.at).slice(-6).map(e => e.item.split(':').at(-1));
    const starts = new Set(), sets = new Set();
    for (let seed = 1; seed <= 32; seed++) {
      const ids = createSession('letters', settings(language, 'words', items), seeded(seed)).map(q => q.answer);
      assert.ok(ids.every(id => !recent.includes(id)));
      starts.add(ids[0]);
      sets.add([...ids].sort().join(','));
    }
    assert.ok(starts.size > 1 && sets.size > 1);
  }
});

test('storage preserves all answer positions, wrong attempts, hints and observation state across independent drafts', () => {
  const words = languages.map(language => sampleRound(language));
  const recognition = sampleRound('hebrew', 'recognition');
  const legacy = toStorage(recognition);
  // Old single-letter drafts did not save the direction of the comparison.
  for (const q of legacy.questions) delete q.direction;
  const drafts = Object.fromEntries([legacy, ...words.map(toStorage)].map(raw => [raw.key, raw]));
  const clean = cleanDrafts(drafts);
  assert.deepEqual(Object.keys(clean).sort(), ['letters:english:words', 'letters:hebrew', 'letters:hebrew:words']);
  for (const original of words) {
    const resumed = unpackRound(clean[original.key]);
    assert.equal(resumed.id, original.id);
    assert.equal(resumed.index, original.index);
    assert.equal(resumed.resolved, false);
    assert.deepEqual(resumed.questions, original.questions);
    for (const field of ['attempted', 'helped', 'observed']) assert.deepEqual(resumed[field], original[field]);
    assert.equal(resumed.letterIds, null);
  }
  const old = unpackRound(clean[legacy.key]);
  assert.equal(old.id, recognition.id);
  assert.deepEqual(old.letterIds, recognition.letterIds);
  assert.deepEqual(old.questions.map(q => q.options.map(o => o.id)), legacy.questions.map(q => q.options));
  assert.ok(old.questions.every(q => q.type === 'letter' && q.direction === 'to-alternate'));
});

test('mismatched language, wrong mode, foreign options and mixed or repeated questions invalidate only their draft', () => {
  for (const language of languages) {
    const other = languages.find(value => value !== language);
    const original = toStorage(sampleRound(language));
    const unrelated = toStorage(sampleRound(other, 'recognition'));
    const foreign = WORD_FORM_WORDS[other].find(word => !WORD_FORM_WORDS[language].some(w => w.id === word.id));
    const corruptions = [
      raw => { raw.letterLanguage = other; },
      raw => { raw.key = roundKey('letters', settings(language, 'recognition')); },
      raw => { raw.mission = 'english'; },
      raw => { raw.questions[2] = unrelated.questions[2]; },
      raw => { raw.questions[1] = raw.questions[0]; },
      raw => {
        const q = raw.questions[0];
        q.options[q.options.findIndex(id => id !== q.word)] = foreign.id;
      },
      raw => {
        // Most family words use the same durable ID in both languages.
        const shared = WORD_FORM_WORDS[other].filter(otherWord =>
          WORD_FORM_WORDS[language].some(word => word.id === otherWord.id) &&
          !raw.questions.some(q => q.word === otherWord.id));
        const options = shared.slice(0, 2).map(word => word.id);
        raw.questions[0] = { ...raw.questions[0], word: options[0], answer: options[0], options,
          prompt: `word-form-${other}`, hint: `word-form-${other}-hint` };
      },
    ];
    for (const corrupt of corruptions) {
      const raw = structuredClone(original);
      corrupt(raw);
      assert.equal(unpackRound(raw), null);
      assert.deepEqual(Object.keys(cleanDrafts({ broken: raw, valid: unrelated })), [unrelated.key]);
    }
  }
});

test('finishing six word matches awards one sticker while preserving the album and prior single-letter skills', () => {
  const progress = freshProgress();
  progress.stickers = STICKERS.slice(0, 100);
  progress.sessions = 100;
  progress.stars = 600;
  progress.letterPractice.hebrew.recognition[0] = 3;
  progress.letterPractice.english.writing[0] = 1;
  const savedPractice = structuredClone(progress.letterPractice);
  const round = sampleRound('hebrew');
  const drafts = {};
  checkpointScoredRound(round, drafts, round.key, packRound);
  let album = progress, receipts = [];
  const award = (id, length) => {
    const result = awardLocalRound(album, receipts, round.mission, round.helped.size, round.letterIds, id, length);
    album = result.progress;
    receipts = result.awarded;
    return result;
  };
  assert.equal(finishScoredRound(round, drafts, round.key, award), null);
  round.index = 5;
  round.resolved = true;
  checkpointScoredRound(round, drafts, round.key, packRound);
  const replay = unpackRound(structuredClone(drafts[round.key]));
  const reward = finishScoredRound(round, drafts, round.key, award);
  assert.equal(reward.sticker, STICKERS[100]);
  assert.deepEqual(album.stickers, STICKERS.slice(0, 101));
  assert.equal(album.stars, 606);
  assert.equal(album.skills.letters.correct, 6);
  assert.deepEqual(album.letterPractice, savedPractice);
  assert.equal(drafts[round.key], undefined);
  assert.equal(finishScoredRound(replay, drafts, replay.key, award).sticker, null);
  assert.equal(album.sessions, 101);
  assert.deepEqual(receipts, [round.id]);
});
