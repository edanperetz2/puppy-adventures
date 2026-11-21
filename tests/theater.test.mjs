import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { THEATER, THEATER_SHOWS } from '../dist/activities.js';
import { CLIPS } from '../dist/content.js';
import { hasArt } from '../dist/art.js';
import { applyObservations, DAY } from '../dist/learning.js';
import { parentLearning } from '../dist/learning-parent.js';
import {
  THEATER_ACTORS, THEATER_ACTIONS, THEATER_SETS, SHADOW_LAMP, SHADOW_SCREEN, SHADOW_SPOTS, cleanTheater,
  cleanTheaterRound, createTheaterRound, editTheaterScript, exampleTheaterTask, freshTheaterTry, moveTheater,
  newTheaterShow, nextTheaterStep, packTheaterRound, performStage, saveTheaterShow, shadowScale,
  solutionScript, theaterEvidence, theaterExample, theaterRecall, theaterTask,
} from '../dist/theater.js';
import { theaterPrompt } from '../dist/theater-round-view.js';
import { castingWord } from '../dist/theater-studio.js';

const apply = (round, action, value, slot) => {
  const result = moveTheater(round, action, value, slot);
  assert.ok(result, action);
  return result;
};
const restore = round => cleanTheaterRound(round.path, JSON.parse(JSON.stringify(packTheaterRound(round))));

function solve(round, q) {
  if (q.kind === 'curtain') apply(round, 'curtain');
  if (q.kind === 'prop') apply(round, 'place', q.prop);
  if (q.kind === 'model') apply(round, 'play');
  if (q.kind === 'order') {
    for (const card of solutionScript(q)) apply(round, 'add', card);
    apply(round, 'play');
  }
  if (q.kind === 'serve') for (let i = 0; i < q.first; i++) apply(round, 'serve', i);
  if (q.kind === 'sum') {
    apply(round, 'arrive');
    while (round.state.cups < q.first + q.extra) apply(round, 'cup', 1);
    apply(round, 'check');
  }
  if (q.kind === 'explore') {
    apply(round, 'light'); apply(round, 'slide', 0); apply(round, 'slide', 2);
  }
  if (q.kind === 'predict') {
    // The experiment proceeds even if the prediction differs from the outcome.
    apply(round, 'predict', q.target === 0 ? 'smaller' : 'larger');
    apply(round, 'slide', q.target);
  }
  if (q.kind === 'fit') { apply(round, 'slide', q.target); apply(round, 'check'); }
}

test('all three six-step shows advance, save and restore real solutions across seeds', () => {
  assert.equal(THEATER.steps, 6);
  for (const path of Object.keys(THEATER_SHOWS)) {
    for (const seed of [1, 42, 0xabcdef12, 4294967295]) {
      const round = createTheaterRound(path, seed);
      for (let i = 0; i < 6; i++) {
        const q = theaterTask(round);
        assert.equal(round.index, i);
        for (const prompt of theaterPrompt(q, round.state)) assert.equal(CLIPS[prompt]?.lang, 'he-IL', prompt);
        if (q.guests) assert.equal(new Set(q.guests.slice(0, q.first + q.extra)).size, q.first + q.extra);
        solve(round, q);
        assert.equal(round.resolved, true, `${path}/${q.kind}/${seed}`);
        assert.deepEqual(restore(round), round);
        assert.equal(nextTheaterStep(round), i < 5);
      }
    }
  }
  for (const id of Object.keys(THEATER_ACTORS).slice(3)) assert.ok(hasArt(id), id);
});

test('a closed door stops playback and either valid packing order can solve a delivery scene', () => {
  const bad = performStage('room', ['enter', 'open']);
  assert.deepEqual(bad.state, { open: false, inside: false, carrying: false });
  assert.equal(bad.reason, 'theater-closed-door');
  assert.equal(bad.frames.length, 1);
  assert.equal(bad.frames[0].stopped, true);
  for (const set of Object.keys(THEATER_SETS)) {
    for (const moves of [['carry', 'open', 'enter'], ['open', 'carry', 'enter']]) {
      assert.deepEqual(performStage(set, moves).state, { open: true, inside: true, carrying: true });
    }
    assert.equal(performStage(set, ['open', 'enter', 'carry']).reason, 'theater-prop-missing');
  }
});

test('an order example can resume and leads to a new set with the same difficulty and help recorded', () => {
  let round = createTheaterRound('backstage', 161);
  for (let i = 0; i < 3; i++) { solve(round, theaterTask(round)); nextTheaterStep(round); }
  const original = theaterTask(round);
  apply(round, 'add', 'enter'); apply(round, 'add', 'open');
  assert.equal(apply(round, 'play').status, 'retry');
  assert.equal(apply(round, 'play').status, 'example');
  round = restore(round);
  assert.ok(round.example);
  assert.notEqual(exampleTheaterTask(original).set, original.set);
  assert.ok(freshTheaterTry(round));
  const fresh = theaterTask(round);
  assert.notEqual(fresh.set, original.set);
  assert.notEqual(fresh.actor, original.actor);
  assert.equal(fresh.count, original.count);
  assert.equal(round.index, 3);
  solve(round, fresh);
  assert.ok(round.helped.includes(3));
  assert.match(theaterEvidence(round).item, /^theater:order:[a-z]+:2$/u);
  assert.equal(theaterExample(round), false);
});

test('each guest gets one cup and a combined tray can be corrected without discarding its state', () => {
  let round = createTheaterRound('party', 371);
  for (let i = 0; i < 3; i++) { solve(round, theaterTask(round)); nextTheaterStep(round); }
  const { first, extra } = theaterTask(round);
  assert.equal(round.state.cups, first);
  assert.equal(moveTheater(round, 'cup', 1), null);
  apply(round, 'arrive');
  assert.equal(apply(round, 'check').reason, 'theater-party-missing');
  round = restore(round);
  assert.ok(round.state.arrived && round.state.checked);
  for (let i = 0; i <= extra; i++) apply(round, 'cup', 1);
  assert.equal(round.state.checked, false);
  apply(round, 'cup', -1);
  assert.equal(apply(round, 'check').status, 'solved');
  assert.equal(round.state.cups, first + extra);
  assert.equal(theaterEvidence(round).item, 'theater:party:combine');
});

test('fixed lamp geometry yields a larger shadow near the lamp, and fit checks use the projection', () => {
  for (const [i, x] of SHADOW_SPOTS.entries()) {
    assert.equal(shadowScale(i), (SHADOW_SCREEN - SHADOW_LAMP) / (x - SHADOW_LAMP));
    if (i) assert.ok(shadowScale(i - 1) > shadowScale(i));
  }
  const round = createTheaterRound('shadow', 289);
  for (let i = 0; i < 3; i++) { solve(round, theaterTask(round)); nextTheaterStep(round); }
  assert.equal(new Set(round.questions.slice(3).map(([q]) => q.target)).size, 3);
  const q = theaterTask(round);
  const result = apply(round, 'check');
  assert.equal(result.reason, q.start > q.target ? 'theater-shadow-small' : 'theater-shadow-large');
  solve(round, q);
  assert.equal(round.resolved, true);
  assert.equal(theaterEvidence(round).item, 'theater:shadow:fit');
});

test('story edits, playback and multiple local saves keep the exact actor, stage and action order', () => {
  const studio = cleanTheater().studio;
  const draft = studio.draft;
  draft.actor = 'duck'; draft.set = 'pond';
  draft.script = editTheaterScript(['enter', 'open'], 'move', 1, THEATER_ACTIONS, 3, 0);
  assert.equal(editTheaterScript(draft.script, 'add', 'open', THEATER_ACTIONS, 3), null);
  draft.script = editTheaterScript(draft.script, 'add', 'bow', THEATER_ACTIONS, 3);
  assert.ok(saveTheaterShow(studio, 430));
  const first = studio.draft.id;
  assert.ok(saveTheaterShow(studio, 1100));
  assert.equal(studio.shows.length, 1);
  assert.equal(studio.shows[0].at, 430);
  studio.draft = { ...newTheaterShow(), script: ['jump'] };
  assert.ok(saveTheaterShow(studio));
  const reopened = cleanTheater(JSON.parse(JSON.stringify({ studio }))).studio;
  const saved = reopened.shows.find(s => s.id === first);
  assert.equal(reopened.shows.length, 2);
  assert.deepEqual({ script: saved.script, actor: saved.actor, set: saved.set }, { script: ['open', 'enter', 'bow'], actor: 'duck', set: 'pond' });
  assert.ok(performStage(saved.set, saved.script).state.inside);
  assert.equal(castingWord({}), 'duck');
  assert.equal(castingWord({ 'daily:english:bird': { independent: 1 } }, 'bird'), 'bird');
});

test('parent milestones require independent sequencing across distinct scenes on separate days', () => {
  const start = Date.UTC(2026, 10, 1, 12);
  const evidence = (set, at, kind = 'independent', n = 2) => ({ item: `theater:order:${set}:${n}`, at, kind, domain: 'hebrew' });
  let items = applyObservations({}, [evidence('room', start), evidence('room', start + DAY), evidence('garden', start + DAY, 'helped')]);
  const learner = { getCode: () => null, items };
  assert.equal(theaterRecall(items), false);
  assert.doesNotMatch(parentLearning(learner), /בשתי סצנות/);
  items = applyObservations(items, [evidence('pond', start + DAY, 'independent', 3)]);
  assert.equal(theaterRecall(items), true);
  assert.match(parentLearning({ ...learner, items }), /בשתי סצנות ובימים שונים/);
  assert.equal(theaterRecall(applyObservations({}, [evidence('room', start), evidence('garden', start + 16 * 3600000)])), false);
});

test('the trial menu and puppet shows have their backdrop on the first offline visit', async () => {
  const read = path => readFile(new URL(`../dist/${path}`, import.meta.url), 'utf8').then(JSON.parse);
  const [core, all] = await Promise.all([read('offline-core.json'), read('offline.json')]);
  assert.ok(core.includes('./assets/theater-stage.webp'));
  assert.ok(all.includes('./assets/theater-stage.webp'));
});
