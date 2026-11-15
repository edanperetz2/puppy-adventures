import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MY_JOURNEY, PICNIC, PICNIC_MISSIONS } from '../dist/activities.js';
import { actOutMatches, actOutPlan, canActOut } from '../dist/act-out.js?v=2.7.0-science';
import { clockParts, clockTotal } from '../dist/clock-learning.js?v=2.2.4-practice';
import { CLIPS } from '../dist/content.js';
import { GUIDE_ITEMS } from '../dist/guide-content.js';
import { latestPlayedDraft } from '../dist/home-adventure.js';
import {
  cleanPicnic, cleanPicnicRound, createPicnicRound, nextPicnicStep, packPicnicRound, picnicClockCorrect, picnicReadingModel, picnicWord,
} from '../dist/picnic.js';
import { picnicPrompt } from '../dist/picnic-view.js';

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
            problem.add(word.he);
          } else if (path === 'addition') {
            assert.ok(q.a + q.b <= cap);
            assert.equal(q.move, index < 4);
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
