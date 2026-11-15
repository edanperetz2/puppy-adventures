import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BOATYARD, BOATYARD_MISSIONS } from '../dist/activities.js';
import {
  boatyardMove, boatyardOutcome, boatyardRound, CLAY_MASS, cleanBoatyard, cleanBoatyardRound,
  comparisonAnswer, nextBoatyardStep, packBoatyardRound, waterTrial,
} from '../dist/boatyard.js';
import { boatyardPrompt } from '../dist/boatyard-view.js';
import { CLIPS } from '../dist/content.js';
import { latestPlayedDraft } from '../dist/home-adventure.js';

const q = round => round.questions[round.index];
const move = (round, action, value) => assert.equal(boatyardMove(round, action, value), true, action);

test('the boat model holds the clay mass fixed and displaces more water as cargo is added', () => {
  for (const shape of ['ball', 'narrow', 'wide', 'roomy']) assert.equal(waterTrial(shape).mass, CLAY_MASS);
  assert.equal(waterTrial('ball').result, 'sink');
  assert.equal(waterTrial('wide').result, 'float');
  const empty = waterTrial('narrow'), loaded = waterTrial('narrow', [5, 5]);
  assert.equal(loaded.result, 'float');
  assert.ok(loaded.draft > empty.draft);
  assert.equal(waterTrial('narrow', [5, 5, 5]).result, 'flooded');
  assert.equal(waterTrial('wide', [5, 5, 5]).result, 'float');
  assert.ok(waterTrial('wide', [10]).draft > waterTrial('wide', [5]).draft);
  assert.equal(waterTrial('wide', [10, 10, 10]).result, 'flooded');
});

test('either prediction leads to the same observed test and compare tasks keep both results', () => {
  const round = boatyardRound('shape');
  assert.equal(boatyardMove(round, 'launch'), false);
  move(round, 'predict', 'float');
  move(round, 'launch');
  assert.equal(boatyardOutcome(q(round), round.state).result, 'sink');
  assert.equal(round.resolved, true);
  assert.ok(nextBoatyardStep(round));
  move(round, 'hull', 'wide');
  move(round, 'predict', 'sink');
  move(round, 'launch');
  assert.equal(boatyardOutcome(q(round), round.state).result, 'float');
  assert.ok(nextBoatyardStep(round));
  assert.equal(q(round).type, 'compare');
  move(round, 'test', 1);
  assert.equal(round.resolved, false);
  round.at = 34;
  const resumed = cleanBoatyardRound('shape', JSON.parse(JSON.stringify(packBoatyardRound(round))));
  assert.deepEqual(resumed, round);
  assert.equal(boatyardMove(resumed, 'test', 1), false);
  move(resumed, 'test', 0);
  assert.equal(resumed.state.tested, 3);
  assert.equal(resumed.resolved, true);
});

test('the flooded boat must be lifted and unloaded before a dry relaunch', () => {
  const round = boatyardRound('cargo');
  round.index = 3;
  const test = cleanBoatyardRound('cargo', { ...packBoatyardRound(round), state: null });
  assert.equal(boatyardOutcome(q(test), test.state).result, 'flooded');
  assert.equal(boatyardMove(test, 'parcel', 2), false);
  move(test, 'lift');
  assert.equal(boatyardMove(test, 'launch'), false);
  move(test, 'parcel', 2);
  assert.equal(test.state.wet, false);
  move(test, 'launch');
  assert.equal(boatyardOutcome(q(test), test.state).result, 'float');
  assert.equal(test.resolved, true);
  assert.ok(cleanBoatyardRound('cargo', packBoatyardRound(test)).resolved);
});

test('each mission has six playable steps and each crossing has a hull that can carry the full load', () => {
  assert.equal(BOATYARD.steps, 6);
  for (const path of Object.keys(BOATYARD_MISSIONS)) {
    const round = boatyardRound(path);
    assert.equal(round.questions.length, 6);
    while (true) {
      const task = q(round);
      assert.ok(CLIPS[boatyardPrompt(round)]);
      if (task.type === 'load') {
        if (task.predict) move(round, 'predict', 'sink');
        move(round, 'parcel', task.parcels.length - 1);
      } else if (task.type === 'recover') {
        move(round, 'lift'); move(round, 'parcel', 0); move(round, 'launch');
      } else if (task.type === 'compare') {
        move(round, 'test', 0); move(round, 'test', 1);
        if (task.measure !== 'shape') move(round, 'compare', comparisonAnswer(task));
      } else {
        if (task.type === 'mold') move(round, 'hull', task.options.at(-1));
        if (task.type === 'carry') {
          assert.equal(boatyardMove(round, 'sail'), false);
          const safe = task.options.find(hull => waterTrial(hull, task.parcels).result === 'float');
          assert.ok(safe);
          if (round.state.hull !== safe) move(round, 'hull', safe);
          for (let i = 0; i < task.parcels.length; i++) move(round, 'parcel', i);
        }
        move(round, 'predict', 'float'); move(round, 'launch');
        if (task.type === 'carry') move(round, 'sail');
      }
      assert.ok(CLIPS[boatyardPrompt(round)]);
      assert.equal(round.resolved, true);
      assert.deepEqual(cleanBoatyardRound(path, packBoatyardRound(round)), round);
      if (!nextBoatyardStep(round)) break;
    }
    assert.equal(round.index, 5);
  }
  assert.deepEqual(cleanBoatyard(undefined), { drafts: {}, finished: [] });
  const current = latestPlayedDraft({ drafts: {}, journeyDrafts: {}, numberDrafts: {}, scienceDrafts: {},
    boatyardDrafts: { cargo: { at: 30 } }, deliveryDrafts: { route: { at: 20 } }, picnicDrafts: { reading: { at: 10 } } });
  assert.equal(current.kind, 'boatyard');
  assert.equal(current.path, 'cargo');
});
