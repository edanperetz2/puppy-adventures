import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MY_JOURNEY, PICNIC, PICNIC_MISSIONS, isPicnicReady } from '../dist/activities.js';
import { CLOCK_ACTIVITIES_ENABLED, isChapterAvailable } from '../dist/availability.js';
import { chapterMap } from '../dist/chapter-map.js';
import { actOutMatches, actOutPlan, canActOut } from '../dist/act-out.js?v=2.7.0-science';
import { clockParts, clockTotal } from '../dist/clock-learning.js?v=2.2.4-practice';
import { CLIPS } from '../dist/content.js';
import { GUIDE_ITEMS } from '../dist/guide-content.js';
import { latestPlayedDraft } from '../dist/home-adventure.js';
import {
  cleanPicnic, cleanPicnicRound, createPicnicRound, nextPicnicStep, packPicnicRound, picnicClockCorrect, picnicReadingModel, picnicWord,
} from '../dist/picnic.js';
import { picnicMap, picnicPrompt } from '../dist/picnic-view.js';
import { spokenNumber } from '../dist/number-workshop.js';

test('fresh picnic readings vary the object and destination, while old bookmarks keep their exact sentences', () => {
  const bookmark = { id: '12345678-1111-4111-b111-000000000000', path: 'reading', revision: 1, cap: 5, index: 1 };
  const old = cleanPicnicRound('reading', bookmark);
  assert.deepEqual(old.questions.map(q => q.word), [
    'picture-place-star-table-on-red', 'picture-place-ball-box-in-blue', 'picture-place-heart-table-under-pink',
    'picture-place-flower-box-near-yellow', 'picture-place-balloon-table-near-yellow', 'picture-place-butterfly-tree-near-yellow',
  ]);
  assert.deepEqual(cleanPicnicRound('reading', packPicnicRound(old)), old);
  const objects = Array.from({ length: 6 }, () => new Set()), places = objects.map(() => new Set());
  const start = packPicnicRound(createPicnicRound('reading'));
  for (let n = 1; n <= 40; n++) {
    const prefix = (Math.imul(n, 2654435761) >>> 0).toString(16).padStart(8, '0');
    const round = cleanPicnicRound('reading', { ...start, id: prefix + bookmark.id.slice(8) });
    const scenes = round.questions.map(q => picnicWord(q).scene);
    assert.equal(new Set(scenes.map(s => s.object)).size, 6);
    assert.ok(['in', 'on'].includes(scenes[0].position));
    scenes.forEach((scene, i) => { objects[i].add(scene.object); places[i].add(scene.position); });
    assert.deepEqual(cleanPicnicRound('reading', packPicnicRound(round)), round);
  }
  assert.ok(objects.every(atStep => atStep.size > 1));
  assert.ok(places.every(atStep => atStep.size > 1));
});

test('the guide and chapter share a six-step curriculum with distinct, solvable challenges and recorded prompts', () => {
  assert.ok(GUIDE_ITEMS.some(item => item.he === MY_JOURNEY.he && item.en === MY_JOURNEY.en));
  assert.equal(PICNIC.steps, 6);
  for (const path of Object.keys(PICNIC_MISSIONS)) {
    const start = packPicnicRound(createPicnicRound(path));
    for (const cap of [5, 10, 20]) {
      for (let n = 0; n < 32; n++) {
        const prefix = Math.imul(n + 1, 2654435761) >>> 0;
        const plan = cleanPicnicRound(path, { ...start, cap, id: `${prefix.toString(16).padStart(8, '0')}-baba-42ee-b38e-ceafeedadbee` });
        assert.equal(plan.questions.length, PICNIC.steps);
        const problem = new Set();
        for (const [index, q] of plan.questions.entries()) {
          const step = { ...plan, index };
          for (const key of picnicPrompt(step)) assert.ok(CLIPS[key], key);
          if (path === 'reading') {
            const word = picnicWord(q);
            assert.ok(canActOut(word));
            const structure = actOutPlan(word, plan.id);
            const [{ index: piece, target }] = picnicReadingModel(q, plan.id);
            assert.ok(actOutMatches(word, structure, piece, target));
            assert.ok(CLIPS[`he-${word.id}`]);
            assert.deepEqual(picnicPrompt(step, true), [`he-${word.id}`]);
            assert.equal(picnicPrompt(step).includes(`he-${word.id}`), index === 0);
            problem.add(word.he);
          } else if (path === 'addition') {
            assert.ok(q.a + q.b <= cap);
            assert.equal(q.move, index < 4);
            const result = spokenNumber(q.a + q.b);
            assert.deepEqual(picnicPrompt({ ...step, resolved: true }, true), result);
            assert.deepEqual(picnicPrompt({ ...step, resolved: true }), index === 0 ? ['picnic-add-model'] : result);
            assert.ok(!picnicPrompt(step, true).some(clip => result.includes(clip)));
            if (q.move) {
              assert.equal(q.item, 'apple');
              assert.deepEqual(picnicPrompt(step), ['picnic-tap-apples']);
              assert.deepEqual(picnicPrompt({ ...step, state: { groups: [1] } }), ['picnic-tap-next']);
            }
            if (index) {
              assert.equal(q.choices.filter(number => number === q.a + q.b).length, 1);
              assert.equal(q.choices.length, new Set(q.choices).size);
            }
            problem.add(`${Math.min(q.a, q.b)} + ${Math.max(q.a, q.b)}`);
          } else {
            assert.ok(picnicClockCorrect(q, q.target));
            assert.ok(!picnicClockCorrect(q, q.start));
            problem.add(`${q.start}:${q.target}`);
          }
        }
        assert.equal(problem.size, PICNIC.steps);
        if (path === 'clock') {
          const last = plan.questions.at(-1);
          assert.equal(last.duration, 7);
          assert.equal(clockParts(last.start).minute, 56);
          assert.equal(clockParts(last.target).minute, 3);
        }
      }
    }
  }
});

test('paused chapters stay out of the map and resume card, including saved rounds from an earlier release', () => {
  const progress = { finished: [], drafts: {} };
  const map = chapterMap({ picnic: progress, delivery: progress, boatyard: progress, theater: progress }, false);
  const history = { drafts: {}, journeyDrafts: {}, numberDrafts: {}, scienceDrafts: {},
    picnicDrafts: { reading: { at: 2 } }, deliveryDrafts: { cargo: { at: 4 } } };
  for (const [chapter, path] of [['boatyard', 'shape'], ['theater', 'party']]) {
    assert.equal(map.includes(`data-action="${chapter}"`), isChapterAvailable(chapter));
    const saved = { [path]: { at: 6 } };
    const latest = latestPlayedDraft({ ...history, [`${chapter}Drafts`]: saved });
    assert.equal(latest.kind, isChapterAvailable(chapter) ? chapter : 'delivery');
    assert.equal(saved[path].at, 6);
  }
});

test('a picnic draft keeps its problem and choice order as it advances, leaves and resumes', () => {
  const round = createPicnicRound('addition', 5);
  assert.equal(nextPicnicStep(round), false);
  round.resolved = true;
  assert.equal(nextPicnicStep(round), true);
  round.state.groups = [1, 0];
  const [incorrect] = round.questions[1].choices.filter(number => number !== round.questions[1].a + round.questions[1].b);
  round.state.attempted = [incorrect];
  round.helped.push(1);
  round.at = 13;
  const payload = JSON.parse(JSON.stringify(packPicnicRound(round)));
  assert.equal('questions' in payload, false);
  const safe = cleanPicnic({ finished: ['reading', 'reading', 'bogus'], drafts: { addition: payload } });
  assert.deepEqual(safe.finished, ['reading']);
  assert.deepEqual(cleanPicnicRound('addition', safe.drafts.addition), round);
  const latest = latestPlayedDraft({ drafts: {}, scienceDrafts: {}, journeyDrafts: {}, numberDrafts: {}, picnicDrafts: safe.drafts });
  assert.equal(latest.kind, 'picnic');
  assert.equal(latest.path, 'addition');
  const impossible = { ...payload, resolved: true, state: { ...payload.state, groups: [0, 0, 2] } };
  assert.equal(cleanPicnicRound('addition', impossible).resolved, false);
  assert.equal(cleanPicnicRound('addition', { ...payload, index: 6 }), null);
  assert.equal(cleanPicnicRound('clock', payload), null);
  assert.deepEqual(cleanPicnic(undefined), { drafts: {}, finished: [] });
});

test('elapsed time crosses twelve and checks forward minutes rather than matching the hand positions', () => {
  const start = clockTotal(11, 56), target = start + 7;
  const task = { start, target, duration: 7 };
  assert.deepEqual(clockParts(target), { hour: 12, minute: 3 });
  assert.ok(picnicClockCorrect(task, target));
  assert.ok(!picnicClockCorrect(task, target - 720));
  assert.ok(!picnicClockCorrect(task, target + 720));
  assert.ok(!picnicClockCorrect(task, target - 1));
  assert.ok(picnicClockCorrect({ ...task, duration: 0 }, target - 720));
});

test('clock drafts remain in storage while the map, guide, and resume card follow availability', () => {
  const clock = packPicnicRound(createPicnicRound('clock'));
  const finished = ['reading', 'addition', 'clock'];
  const picnic = cleanPicnic({ drafts: { clock: { ...clock, at: 30 } }, finished });
  const empty = { finished: [] };
  assert.deepEqual(picnic.finished, finished);
  assert.equal(picnic.drafts.clock.id, clock.id);
  const map = chapterMap({ picnic, boatyard: empty, delivery: empty, theater: empty }, false);
  const count = CLOCK_ACTIVITIES_ENABLED ? 3 : 2;
  assert.match(map, new RegExp(`${count} מתוך ${count} משימות`, 'u'));
  assert.equal(picnicMap(picnic, false).includes('data-path="clock"'), CLOCK_ACTIVITIES_ENABLED);
  assert.equal(isPicnicReady(['reading', 'addition']), !CLOCK_ACTIVITIES_ENABLED);
  assert.equal(GUIDE_ITEMS.some(item => item.en[0] === 'Clock Garden'), CLOCK_ACTIVITIES_ENABLED);
  const classicClock = { mission: 'clock', index: 1, at: 20 };
  const classicReading = { mission: 'hebrew', index: 1, at: 10 };
  const latest = latestPlayedDraft({ drafts: { classicClock, classicReading }, journeyDrafts: {},
    numberDrafts: {}, scienceDrafts: {}, picnicDrafts: picnic.drafts });
  assert.equal(latest.kind, CLOCK_ACTIVITIES_ENABLED ? 'picnic' : 'classic');
  if (!CLOCK_ACTIVITIES_ENABLED) assert.equal(latest.value, classicReading);
});
