import assert from 'node:assert/strict';
import test from 'node:test';
import { hasArt } from '../dist/art.js';
import { waterTrial } from '../dist/boatyard.js';
import { boatyardGames } from '../dist/trial-boatyard.js';
import { numberGames } from '../dist/trial-numbers.js';

const games = [...boatyardGames, ...numberGames];
const sets = game => [game.steps, ...(game.variants || [])];
const game = id => games.find(entry => entry.id === id);
const count = (html, token) => html.split(token).length - 1;

test('workshops have six renderable steps, accessible choices and working touch targets', () => {
  assert.equal(new Set(games.map(entry => entry.id)).size, 7);
  for (const entry of games) {
    assert.ok(hasArt(entry.icon), entry.icon);
    for (const steps of sets(entry)) {
      assert.equal(steps.length, 6, entry.id);
      const answers = [];
      for (const step of steps) {
        assert.match(step.prompt, /[\u05b0-\u05bd]/u);
        assert.match(step.result, /[\u05b0-\u05bd]/u);
        const ids = step.choices.map(choice => choice.id);
        assert.equal(new Set(ids).size, ids.length);
        for (const { label, ariaLabel, art } of step.choices) {
          assert.ok(label || ariaLabel, entry.id);
          assert.ok(!art || art.startsWith('<') || hasArt(art), art);
        }
        for (const id of step.correct || []) assert.ok(ids.includes(id));
        for (const id of [null, ...(step.correct || ids)]) {
          const html = step.scene(answers, id, 17);
          assert.doesNotMatch(html, /undefined|NaN|\[object Object\]/u);
          if (step.direct && !id) for (const option of ids) assert.ok(html.includes(`data-trial-choice="${option}"`));
          if (step.direct && id) assert.ok(!html.includes('data-trial-choice'));
        }
        answers.push((step.correct || ids)[0]);
      }
    }
  }
});

test('on replay, the missing objects in each setting exactly match the correct pictured tray', () => {
  for (const steps of sets(game('number-missing'))) {
    for (const step of steps) {
      const correct = Number(step.correct[0]);
      for (const seed of [0, 1, 3, 8, 788119]) {
        const before = step.scene([], null, seed), after = step.scene([], String(correct), seed);
        assert.equal(count(before, 'class="tw-empty-ring"'), correct);
        assert.equal(count(after, 'class="tw-empty-ring"'), 0);
        assert.equal(count(after, 'tw-filled-now'), correct);
        assert.equal(count(before, 'class="tw-well'), count(after, 'class="tw-well'));
      }
      for (const choice of step.choices) {
        assert.equal(count(choice.art, '<i '), Number(choice.id));
        assert.equal(choice.label, '', 'the child counts the pictures on the tray');
      }
    }
  }
  assert.notEqual(game('number-missing').steps[2].scene([], null, 0), game('number-missing').steps[2].scene([], null, 1));
});

test('whole requested groups, giving and tens all show the exact quantity they teach', () => {
  for (const steps of sets(game('number-groups'))) for (const step of steps) {
    for (const choice of step.choices) assert.equal(count(choice.art,'<svg'), Number(choice.id));
    assert.equal(count(step.scene([], step.correct[0]), '<svg'), Number(step.correct[0]));
  }
  for (const steps of sets(game('number-giving'))) for (const step of steps) {
    const html = step.scene([], null), left = Number(step.correct[0]);
    const basket = html.slice(html.indexOf('class="tw-basket"'), html.indexOf('class="tw-recipient"'));
    assert.equal(count(basket, '<svg'), left);
    const [, total, given] = html.match(/היו בסל (\d+) תפוחים. לולי לקחה (\d+)/u);
    assert.equal(Number(total) - Number(given), left);
    assert.equal(count(html.slice(html.indexOf('class="tw-given"')), '<svg'), Number(given));
  }
  for (const steps of sets(game('number-ten'))) for (const [index, step] of steps.entries()) {
    const html = step.scene([], step.correct[0]);
    assert.equal(count(html, '<i></i>'), index < 2 ? 10 : Number(step.correct[0]));
  }
});

test('the same clay sinks as a ball and floats as the hollow hull; a waterlogged boat is emptied before recovery', () => {
  assert.equal(waterTrial('ball', []).result, 'sink');
  assert.equal(waterTrial('wide', []).result, 'float');
  const shape = game('boat-shape').steps;
  assert.match(shape[0].scene([], 'drop'), /tw-ball-drops/u);
  assert.match(shape[2].scene([], 'mold'), /tw-molding/u);
  assert.equal(shape[3].correct, undefined);
  assert.equal(shape[3].scene([], 'flood'), shape[3].scene([], 'float'));
  const load = game('boat-load').steps;
  assert.equal(waterTrial('narrow', [5,5,5]).result, 'flooded');
  assert.equal(waterTrial('narrow', [5,5]).result, 'float');
  assert.match(load[2].scene([], 'float'), /מים בתוך הסירה/u);
  assert.match(load[3].scene([], 'lift'), /מחוץ למים, עם 3 חבילות/u);
  assert.match(load[4].scene([], 'remove'), /מחוץ למים, עם 2 חבילות/u);
  assert.match(load[5].scene([], 'launch'), /שפת הסירה מעל המים/u);
});

test('a prediction is open; either prediction leads to a fair test, then a successful choice automatically docks the cargo', () => {
  const steps = game('boat-delivery').steps;
  for (const [offset, size] of [[0,3], [3,6]]) {
    const [predict, experiment, deliver] = steps.slice(offset, offset + 3);
    assert.equal(predict.correct, undefined);
    const outcomes = predict.choices.map(c => waterTrial(c.id, Array(size).fill(5)).result);
    assert.deepEqual(outcomes, ['flooded', 'float']);
    const wet = experiment.scene([], experiment.correct[0], 0);
    assert.match(wet, /מים בתוך הסירה/u);
    assert.match(wet, /שפת הסירה מעל המים/u);
    assert.equal(count(wet, `עם ${size} חבילות`), 2);
    const docked = deliver.scene([], deliver.correct[0], 0);
    assert.match(docked, /tw-cross/u);
    assert.match(docked, /translate\(431 [\d.]+\)/u);
    assert.ok(!docked.includes('data-trial-choice'), 'no second press required to sail');
  }
});
