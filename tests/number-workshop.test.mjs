import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIPS } from '../dist/content.js';
import { NUMBER_PATHS, cleanNumberRound, newNumberRound, numberModel, numberPrompt, numberQuestion, numberQuestionClip, spokenNumber } from '../dist/number-workshop.js';
import { SESSION_LENGTH } from '../dist/adventure.js';

function seeded(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test('Each Number Workshop path gives six distinct, progressively harder questions and shuffled choices', () => {
  for (const path of Object.keys(NUMBER_PATHS)) {
    for (const cap of [5, 10, 20]) {
      const openingPositions = new Set();
      const examples = new Set();
      for (let seed = 1; seed <= 160; seed++) {
        const round = newNumberRound(path, cap, {}, seeded(seed * 15485863));
        assert.equal(round.questions.length, SESSION_LENGTH);
        assert.deepEqual(cleanNumberRound(JSON.parse(JSON.stringify(round))), round);
        const questions = round.questions.map((_, index) => numberQuestion({ ...round, index }));
        assert.equal(new Set(questions.map(q => q.itemKey)).size, SESSION_LENGTH);
        if (path === 'add' && cap > 5) assert.equal(new Set(questions.map(q => q.answer)).size, SESSION_LENGTH);
        for (const [index, q] of questions.entries()) {
          assert.equal(q.choices.length, index < 2 ? 2 : 3);
          assert.equal(new Set(q.choices).size, q.choices.length);
          assert.ok(q.choices.includes(q.answer));
          const previous = questions[index - 1];
          if (previous && q.choices.length === previous.choices.length) {
            assert.ok(q.choices.some(answer => !previous.choices.includes(answer)));
          }
          if (path === 'count' || path === 'add') {
            assert.ok(q.total <= cap && (!previous || q.total >= previous.total));
            if (path === 'add') assert.ok(q.part > 0 && q.part <= q.total - q.part);
          } else if (path === 'left') {
            assert.ok(q.total <= Math.min(cap, 8) && q.part <= 3 && q.item === 'apple');
            assert.equal(q.answer, q.total - q.part);
            if (previous) assert.notEqual(q.answer, previous.answer);
            if (index === 0) assert.equal(q.answer, 0);
            else assert.ok(q.answer > 0);
            if (index >= 4) assert.ok(q.part > 1);
          } else {
            if (index < 2) assert.equal(q.part, 0);
            else if (index < 4) assert.ok(q.total > 10 && q.total < 20);
            else assert.ok(q.total >= 20 && q.total <= 100);
          }
          if (index === 0) openingPositions.add(q.choices.indexOf(q.answer));
          examples.add(q.itemKey);
        }
      }
      assert.equal(openingPositions.size, 2);
      assert.ok(examples.size >= SESSION_LENGTH);
    }
  }
});

test('Every prompt and hint has Hebrew narration and each hint arrives at the right number', () => {
  for (const path of Object.keys(NUMBER_PATHS)) {
    for (let seed = 1; seed <= 32; seed++) {
      const round = newNumberRound(path, 20, {}, seeded(seed * 65413));
      for (const [index, task] of round.questions.entries()) {
        const q = numberQuestion({ ...round, index });
        const model = numberModel(path, q);
        const ask = numberPrompt(path, task, index);
        assert.ok(ask.includes(numberQuestionClip(path)));
        if (path === 'left') assert.equal(ask[0], `number-workshop-take-${q.part}`);
        assert.equal(model.steps.at(-1).number, q.answer);
        assert.equal(new Set(model.steps.map(step => step.index)).size, model.steps.length);
        if (path === 'add') assert.deepEqual(model.steps[0], { index: 'large', number: q.total - q.part });
        for (const key of [...ask, model.intro, ...model.steps.flatMap(step => spokenNumber(step.number))]) {
          assert.equal(CLIPS[key]?.lang, 'he-IL', key);
        }
      }
    }
  }
  for (let n = 0; n <= 100; n++) {
    for (const key of spokenNumber(n)) assert.equal(CLIPS[key]?.lang, 'he-IL', key);
  }
  assert.deepEqual(spokenNumber(42), ['number-workshop-40', 'number-workshop-and-2']);
  assert.deepEqual(spokenNumber(100), ['number-workshop-100']);
});

test('Unfinished Number Workshop rounds retain their current pictures, options and help on reload', () => {
  const round = newNumberRound('left', 10, {}, seeded(8));
  round.index = 3;
  round.hint = true;
  round.helped = [1, 3];
  const { answer, choices } = numberQuestion(round);
  round.attempted = [choices.find(n => n !== answer)];
  const copy = JSON.parse(JSON.stringify(round));
  assert.deepEqual(cleanNumberRound(copy), round);
  copy.resolved = true;
  assert.equal(cleanNumberRound(copy).resolved, true);
  copy.questions[0].item = 'flower';
  assert.equal(cleanNumberRound(copy), null);
  copy.questions[0].item = 'apple';
  copy.questions[1].choices = [999, 999, 1];
  assert.equal(cleanNumberRound(copy), null);
});
