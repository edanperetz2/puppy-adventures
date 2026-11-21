import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasArt } from '../dist/art.js';
import { CLOCK_ACTIVITIES_ENABLED } from '../dist/availability.js';
import { CLIPS } from '../dist/content.js';
import { learningTime } from '../dist/clock-learning.js';
import {
  CLOCK_MINUTES, CLOCK_TRANSFER, DAILY_ANIMALS, attemptDaily, availableDailyDraft, cleanDaily, cleanDailyRound, createDailyRound,
  dailyEvidence, dailyQuestion, dailyRecall, dailySuggestion, finishDailyMemory, moveDailyClock,
  nextDailyStep, renewDailyStep, showDailyExample,
} from '../dist/daily.js';
import { applyObservations, DAY } from '../dist/learning.js';
import { seeded } from '../dist/journey.js';
import { parentLearning } from '../dist/learning-parent.js';

const now = Date.UTC(2026, 10, 1, 12);
const fixture = (item, domain, at = now, kind = 'independent') => ({ item, domain, at, kind });
const restored = round => cleanDailyRound(JSON.parse(JSON.stringify(round)));
const timeCase = q => `${q.start}/${q.duration}`;

test('daily suggestions use existing practice, with a gentle English start for a new player', () => {
  const state = cleanDaily();
  const enabled = { clockEnabled: true };
  assert.equal(dailySuggestion({}, state.finished, {}), 'english');
  const items = applyObservations({}, [fixture('picnic:clock:elapsed:two', 'clock')]);
  assert.equal(dailySuggestion(items, state.finished, {}), CLOCK_ACTIVITIES_ENABLED ? 'clock' : 'english');
  assert.equal(dailySuggestion(items, state.finished, {}, enabled), 'clock');
  assert.equal(dailySuggestion({}, state.finished, { missions: { clock: 4 } }, enabled), 'clock');
  assert.equal(dailySuggestion(items, { clock: now, english: 0 }, {}, enabled), 'clock');
  const both = applyObservations(items, [fixture('english:single:duck', 'english', now - DAY)]);
  assert.equal(dailySuggestion(both, { clock: 0, english: 0 }, {}, enabled), 'english');
  assert.equal(dailySuggestion(both, { clock: 0, english: now }, {}, enabled), 'clock');
  assert.equal(dailySuggestion(both, { clock: now, english: 0 }, {}, enabled), 'english');
});

test('a saved train round can stay in its original slot alongside a resumable pond round', () => {
  const clock = createDailyRound('clock', {}, []);
  const english = createDailyRound('english', {}, []);
  assert.ok(moveDailyClock(clock, clock.state.total + 1));
  clock.at = now; english.at = now - 1;
  const parked = cleanDaily({ drafts: { today: clock }, finished: { clock: now - DAY } });
  assert.deepEqual(parked.drafts.today, clock);
  assert.equal(availableDailyDraft(parked.drafts)?.draft.path, CLOCK_ACTIVITIES_ENABLED ? 'clock' : undefined);
  const both = cleanDaily({ ...parked, drafts: { ...parked.drafts, english } });
  assert.deepEqual(both.drafts, { today: clock, english });
  assert.equal(availableDailyDraft(both.drafts).key, CLOCK_ACTIVITIES_ENABLED ? 'today' : 'english');
  assert.equal(both.finished.clock, now - DAY);
});

test('the train progresses from counting minutes to reaching and crossing a new hour', () => {
  const daily = cleanDaily();
  for (let run = 0; run < 12; run++) {
    const round = createDailyRound('clock', {}, daily.recent, { rng: () => 0.45 });
    assert.equal(round.questions.length, 6);
    const cases = round.questions.flat();
    assert.equal(new Set(cases.map(timeCase)).size, 12);
    assert.equal(new Set(cases.map(q => (q.start + q.duration) % 720)).size, 12);
    assert.ok(cases.every(q => !daily.recent.includes(timeCase(q))));
    for (const [i, pair] of round.questions.entries()) {
      for (const q of pair) {
        const minute = q.start % 60;
        assert.ok(i < 2 ? minute + q.duration < 60 : i === 2 ? minute + q.duration === 60 : minute + q.duration > 60);
        assert.ok(learningTime(q.start).clips.every(key => CLIPS[key]), timeCase(q));
        assert.equal(CLIPS[`school-minutes-${q.duration}`]?.lang, 'he-IL');
      }
      const q = dailyQuestion(round);
      assert.ok(moveDailyClock(round, q.start + q.duration));
      assert.equal(attemptDaily(round), 'resolved');
      assert.equal(dailyEvidence(round).item, i < 3 ? CLOCK_MINUTES : CLOCK_TRANSFER);
      assert.equal(nextDailyStep(round), i !== 5);
    }
    finishDailyMemory(daily, round, now + run);
    assert.equal(daily.finished.clock, now + run);
    assert.ok(daily.recent.length <= 24);
  }
});

test('a worked clock example resumes at the same step, with a fresh time and support recorded', () => {
  let round = createDailyRound('clock', {}, []);
  const first = dailyQuestion(round);
  assert.equal(attemptDaily(round), 'ignored');
  assert.ok(moveDailyClock(round, first.start + 720));
  assert.equal(attemptDaily(round), 'retry');
  assert.ok(moveDailyClock(round, first.start - 1));
  assert.equal(attemptDaily(round), 'example');
  round = restored(round);
  assert.equal(round.state.example, true);
  assert.deepEqual(round.helped, [0]);
  assert.equal(nextDailyStep(round), false);
  assert.equal(attemptDaily(round), 'ignored');
  const receipt = dailyEvidence(round).eventId;
  assert.ok(renewDailyStep(round));
  round = restored(round);
  const fresh = dailyQuestion(round);
  assert.notEqual(timeCase(fresh), timeCase(first));
  assert.equal(round.state.total, fresh.start);
  assert.equal(round.index, 0);
  assert.equal(dailyEvidence(round).eventId, receipt);
  assert.equal(showDailyExample(round), false);
  assert.ok(moveDailyClock(round, fresh.start + fresh.duration));
  assert.equal(attemptDaily(round), 'resolved');
  assert.deepEqual(restored(round), round);
  assert.ok(nextDailyStep(round));
  assert.equal(round.state.renewed, false);
  assert.deepEqual(round.helped, [0]);
});

test('the pond revisits familiar single words with distinct animals and a changed choice after help', () => {
  const known = applyObservations({}, [fixture('english:single:duck', 'english'), fixture('daily:english:frog', 'english')]);
  const round = createDailyRound('english', known, [], { rng: () => 0.45, now });
  assert.deepEqual(new Set(round.questions.slice(0, 2).map(([q]) => q.word)), new Set(['duck', 'frog']));
  assert.equal(new Set(round.questions.map(([q]) => q.word)).size, 6);
  for (const word of DAILY_ANIMALS) {
    assert.ok(hasArt(word), word);
    assert.equal(CLIPS[`en-${word}`]?.lang, 'en-US', word);
  }
  assert.ok(hasArt('train'));
  for (const [i, [first, fresh]] of round.questions.entries()) {
    assert.equal(first.choices.length, i < 3 ? 2 : 3);
    assert.equal(fresh.word, first.word);
    assert.notEqual(fresh.scene, first.scene);
    assert.notEqual(fresh.choices.indexOf(fresh.word), first.choices.indexOf(first.word));
    assert.deepEqual(fresh.choices.filter(word => first.choices.includes(word)), [first.word]);
    if (i === 3) {
      const misses = first.choices.filter(w => w !== first.word);
      assert.equal(attemptDaily(round, misses[0]), 'retry');
      assert.equal(attemptDaily(round, misses[0]), 'ignored');
      assert.equal(attemptDaily(round, misses[1]), 'example');
      assert.ok(renewDailyStep(round));
    }
    assert.equal(attemptDaily(round, first.word), 'resolved');
    assert.equal(dailyEvidence(round).item, `daily:english:${first.word}`);
    assert.equal(nextDailyStep(round), i !== 5);
  }
  assert.deepEqual(round.helped, [3]);
});

test('the pond varies the selection and presentation of equal-level animals across fresh visits', () => {
  const familiar = DAILY_ANIMALS.slice(0, 6);
  const learned = applyObservations({}, DAILY_ANIMALS.map((word, i) => fixture('daily:english:' + word, 'english', now - 3600000 + i * 1000)));
  for (const items of [{}, learned]) {
    const sets = new Set(), secondSlots = new Set(), reached = new Set();
    for (let seed = 1; seed <= 50; seed++) {
      const round = createDailyRound('english', items, [], { now, rng: seeded(seed * 7919) });
      const words = round.questions.map(([q]) => q.word);
      if (items !== learned) {
        assert.ok(words.slice(0, 2).every(word => familiar.includes(word)));
        assert.equal(words.filter(word => !familiar.includes(word)).length, 1);
      }
      words.forEach(word => reached.add(word));
      sets.add([...words].sort().join(','));
      for (const [first, second] of round.questions.slice(3)) {
        secondSlots.add((second.choices.indexOf(first.word) - first.choices.indexOf(first.word) + 3) % 3);
      }
      assert.deepEqual(restored(round), round);
    }
    assert.equal(reached.size, DAILY_ANIMALS.length);
    assert.ok(sets.size > 2);
    assert.deepEqual(secondSlots, new Set([1, 2]));
  }
});

test('the parent view describes independent recall only after success on another day', () => {
  const duck = 'daily:english:duck';
  const learner = { getCode: () => null };
  learner.items = applyObservations({}, [
    fixture(CLOCK_TRANSFER, 'clock', now), fixture(CLOCK_TRANSFER, 'clock', now + 1000),
    fixture(duck, 'english', now, 'helped'), fixture(duck, 'english', now + DAY),
  ]);
  assert.deepEqual(dailyRecall(learner.items), { clock: false, animals: [] });
  assert.doesNotMatch(parentLearning(learner), /daily-recall/);
  learner.items = applyObservations(learner.items, [
    fixture(CLOCK_TRANSFER, 'clock', now + DAY), fixture(duck, 'english', now + 2 * DAY),
  ]);
  assert.deepEqual(dailyRecall(learner.items), { clock: true, animals: ['duck'] });
  const parent = parentLearning(learner);
  assert.equal(parent.includes('הזיזה את מחוג הדקות אל מעבר לשעה'), CLOCK_ACTIVITIES_ENABLED);
  assert.equal(parent.includes('דקות מעבר לשעה'), CLOCK_ACTIVITIES_ENABLED);
  assert.match(parent, /<bdi lang="en" dir="ltr">duck<\/bdi>/);
});
