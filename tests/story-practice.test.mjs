import test from 'node:test';
import assert from 'node:assert/strict';
import { actOutDetails, actOutSteps } from '../dist/act-out.js';
import { LITTLE_STORIES } from '../dist/activities.js';
import { CLIPS } from '../dist/content.js';
import { createSession, finishSession, freshProgress, SESSION_LENGTH } from '../dist/engine.js';
import { readingWords } from '../dist/reading.js';
import { awardLocalRound, checkpointScoredRound, finishScoredRound } from '../dist/round-lifecycle.js';
import { packRound, unpackRound } from '../dist/session-state.js';
import { firstStoryClue, pictureClue, storyClue, storyReviewQuestion } from '../dist/story-practice.js';
import { seeded } from '../dist/journey.js';

const level = LITTLE_STORIES.route.level;
const stories = readingWords(level);
const find = facts => stories.find(word => Object.entries(facts).every(([field, value]) => word.scene[field] === value));
const target = find({ object: 'ball', anchor: 'table', position: 'under', color: 'red' });
const byTheTable = find({ object: 'ball', anchor: 'table', position: 'near', color: 'red' });
const otherColor = find({ object: 'ball', anchor: 'table', position: 'under', color: 'blue' });
const selectedText = (word, field, script = 'he') => {
  const { start, end } = storyClue(word, field);
  return word[script].split(' ').slice(start, end).join(' ').replace(/[.!?]$/u, '');
};

test('both reading directions bring unfamiliar everyday stories into six-step rounds', () => {
  for (const reading of [level, 'captions']) {
    const recent = [];
    const seen = new Set();
    let lastMoment;
    for (let i = 0; i < 12; i++) {
      const round = createSession('hebrew', { reading, readingRecent: recent }, seeded(i));
      assert.equal(round.length, 6);
      assert.ok(new Set(round.map(q => q.word.scene.kind)).size >= 4);
      const moment = round.find(q => q.word.scene.kind === 'moment').word;
      assert.ok(!seen.has(moment.id));
      assert.notEqual(moment.scene.object, lastMoment?.scene.object);
      assert.notEqual(moment.scene.action, lastMoment?.scene.action);
      seen.add(moment.id);
      recent.push(...round.map(q => q.word.id));
      lastMoment = moment;
    }
  }
});

test('Story clues point at the detail that differs and preserve Hebrew pointing', () => {
  assert.equal(pictureClue(target, byTheTable), 'position');
  assert.equal(selectedText(target, 'position'), 'מתחת לשולחן');
  assert.equal(selectedText(target, 'position', 'pointed'), 'מִתַּחַת לַשֻּׁלְחָן');
  assert.equal(pictureClue(target, otherColor), 'color');
  assert.equal(selectedText(target, 'color'), 'אדום');
  const four = find({ object: 'pear', kind: 'arrangement', anchor: 'basket', position: 'in', count: 4 });
  const two = find({ object: 'pear', kind: 'arrangement', anchor: 'basket', position: 'in', count: 2 });
  assert.equal(pictureClue(four, two), 'count');
  assert.equal(selectedText(four, 'count'), 'ארבעה');
  assert.equal(selectedText(find({ food: 'chicken-leg' }), 'food'), 'שוק עוף');
  assert.equal(selectedText(find({ action: 'water', object: 'flower' }), 'object'), 'פרח');
  assert.equal(selectedText(find({ action: 'jump', size: 'big' }), 'action'), 'קופץ');
  assert.equal(selectedText(find({ action: 'sleep', anchor: 'bed' }), 'anchor'), 'במיטה');
  assert.equal(storyClue(target, 'food'), null);
});

test('The full Little Stories bank points to real words using recorded clue categories', () => {
  const position = { under: 'מתחת', on: 'על', near: 'ליד', above: 'מעל', in: 'בתוך' };
  const colors = {
    red: ['אדום', 'אדומה', 'אדומים', 'אדומות'], blue: ['כחול', 'כחולה', 'כחולים', 'כחולות'],
    green: ['ירוק', 'ירוקה', 'ירוקים', 'ירוקות'], pink: ['ורוד', 'ורודה', 'ורודים', 'ורודות'],
    purple: ['סגול', 'סגולה', 'סגולים', 'סגולות'], yellow: ['צהוב', 'צהובה', 'צהובים', 'צהובות'],
  };
  for (const word of stories) {
    if (word.scene.position) assert.equal(selectedText(word, 'position').split(' ')[0], position[word.scene.position]);
    if (word.scene.count) assert.match(selectedText(word, 'count'), /^(שני|שתי|שלושה|שלוש|ארבעה|ארבע)$/u);
    if (word.scene.size) assert.match(selectedText(word, 'size'), /^(קטן|גדול|קטנה|גדולה)$/u);
    if (word.scene.color) assert.ok(colors[word.scene.color].includes(selectedText(word, 'color')), word.id);
    for (const field of Object.keys(word.scene)) {
      const clue = storyClue(word, field);
      if (!clue) continue;
      assert.ok(clue.start >= 0 && clue.end <= word.pointed.split(' ').length);
      assert.equal(CLIPS[clue.clip].lang, 'he-IL');
    }
  }
});

function exampleQuestions() {
  const questions = createSession('hebrew', { reading: level });
  for (const index of actOutSteps(questions)) questions[index].actOut = true;
  questions[0] = { ...questions[0], word: target, answer: target.id, options: [target, byTheTable], actOut: false };
  return questions;
}

test('A retry can schedule a fresh example with the same detail in an unshown step', () => {
  const questions = exampleQuestions();
  const review = storyReviewQuestion(questions, 0, 'position', () => .48);
  assert.ok(review && review.slot > 0);
  const { question, slot } = review;
  assert.equal(question.word.scene.position, 'under');
  assert.ok(questions.every(old => old.word.he !== question.word.he));
  assert.equal(question.phase, questions[slot].phase);
  assert.equal(Boolean(question.actOut), Boolean(questions[slot].actOut));
  assert.equal(question.options.length, questions[slot].options.length);
  if (question.actOut) assert.ok(actOutDetails(question.word).includes('position'));
  else assert.ok(question.options.some(option => pictureClue(question.word, option) === 'position'));
  assert.equal(questions.length, SESSION_LENGTH);
  assert.equal(questions[0].word, target);
  assert.equal(storyReviewQuestion(questions, questions.length - 1, 'position'), null);
  assert.equal(storyReviewQuestion([...questions, ...questions.slice(0, 4)], 0, 'position'), null);
});

test('A clue, a first attempt, and the planned review survive a saved round with identical choices', () => {
  const questions = exampleQuestions();
  const clue = firstStoryClue(questions[0]);
  assert.equal(clue, 'position');
  const review = storyReviewQuestion(questions, 0, clue, () => .51);
  questions[review.slot] = review.question;
  const round = {
    id: crypto.randomUUID(), mission: 'hebrew', reading: level, key: `hebrew:${level}`,
    questions, index: 0, attempted: [byTheTable.id], counted: [], helped: [0], observed: [],
    storyClue: clue, storyReview: review.slot,
  };
  const raw = JSON.parse(JSON.stringify(packRound(round)));
  const restored = unpackRound(raw);
  assert.equal(restored.storyClue, clue);
  assert.equal(restored.storyReview, review.slot);
  assert.deepEqual([...restored.attempted], [byTheTable.id]);
  assert.deepEqual(restored.questions.map(q => [q.answer, ...q.options.map(option => option.id)]),
    questions.map(q => [q.answer, ...q.options.map(option => option.id)]));
  assert.equal(unpackRound({ ...raw, storyClue: 'absent' }).storyClue, undefined);
});

test('A noun in an acted story can be practiced through another action', () => {
  const questions = exampleQuestions().map(question => ({ ...question, actOut: false }));
  const flower = find({ action: 'water', object: 'flower' });
  const tree = find({ action: 'water', object: 'tree' });
  Object.assign(questions[0], { word: flower, answer: flower.id, options: [flower, tree], actOut: true });
  const review = storyReviewQuestion(questions, 0, 'object', () => .61);
  assert.ok(review && review.slot > 0 && review.question.actOut);
  assert.ok(actOutDetails(review.question.word).includes('object'));
  assert.ok(questions.every(question => question.word.id !== review.question.word.id));
});

test('Both scored round formats checkpoint and finish once, only after the last answer', () => {
  for (const [mission, length] of [['hebrew', 10], ['math', 6]]) {
    const round = { id: crypto.randomUUID(), resolved: true, index: length - 2, questions: Array(length).fill({}) };
    const drafts = {};
    checkpointScoredRound(round, drafts, 'test');
    let progress = freshProgress();
    let receipts = [];
    for (let i = 0; i < 26; i++) progress = finishSession(progress, 'hebrew').progress;
    const earned = progress.stickers;
    const award = (id, count) => {
      const result = awardLocalRound(progress, receipts, mission, 1, null, id, count);
      progress = result.progress;
      receipts = result.awarded;
      return result;
    };
    assert.equal(finishScoredRound(round, drafts, 'test', award), null);
    round.index++;
    assert.ok(finishScoredRound(round, drafts, 'test', award).sticker);
    assert.equal(drafts.test, undefined);
    assert.equal(finishScoredRound(round, drafts, 'test', award), null);
    checkpointScoredRound(round, drafts, 'test');
    assert.equal(drafts.test, undefined);
    // A persisted receipt can be read again even when an old draft remains.
    assert.equal(finishScoredRound({ ...round, awarded: false }, drafts, 'test', award).sticker, null);
    assert.equal(progress.stickers.length, 27);
    assert.deepEqual(progress.stickers.slice(0, 26), earned);
  }
});

test('A failed award keeps the draft available for retry and an old callback leaves a newer draft intact', () => {
  const round = { id: 'old', resolved: true, index: 5, questions: Array(6).fill({}) };
  const drafts = { test: round };
  assert.throws(() => finishScoredRound(round, drafts, 'test', () => { throw new Error('offline'); }), /offline/);
  assert.equal(drafts.test, round);
  assert.equal(round.awarded, undefined);
  const newer = { id: 'replacement' };
  drafts.test = newer;
  finishScoredRound(round, drafts, 'test', () => ({ sticker: 'star' }));
  assert.equal(drafts.test, newer);
});
