import test from 'node:test';
import assert from 'node:assert/strict';
import { SESSION_LENGTH } from '../dist/adventure.js';
import { CLIPS } from '../dist/content.js';
import { SCIENCE_EXPERIMENTS, SCIENCE_ACTIONS, cleanScienceRound, scienceClip } from '../dist/science-content.js';

test('Science experiments have six connected steps, with Hebrew instructions and observations', () => {
  for (const { steps } of Object.values(SCIENCE_EXPERIMENTS)) {
    assert.equal(steps.length, SESSION_LENGTH);
    for (const [index, step] of steps.entries()) {
      assert.ok(step.actions.length && step.actions.every(id => SCIENCE_ACTIONS[id]));
      assert.equal(CLIPS[scienceClip(step.prompt)].lang, 'he-IL');
      assert.equal(CLIPS[scienceClip(step.result)].lang, 'he-IL');
      if (index) assert.equal(step.before, steps[index - 1].after);
      if (step.observes !== undefined) {
        assert.ok(step.observes < index);
        assert.equal(steps[step.observes].actions.length, 2);
      }
    }
  }
  assert.equal(SCIENCE_EXPERIMENTS.liquids.steps.at(-1).after, 'droplets');
  assert.equal(SCIENCE_EXPERIMENTS.floating.steps.at(-1).after, 'three');
  assert.equal(SCIENCE_EXPERIMENTS.melting.steps.at(-1).after, 'melted-both');
});

test('An experiment resumes after either prediction and rejects invalid saves', () => {
  const { steps } = SCIENCE_EXPERIMENTS.liquids;
  for (const guess of steps[1].actions) {
    const saved = { index: 2, actions: ['water', guess, 'oil'], complete: false, at: 25 };
    assert.deepEqual(cleanScienceRound('liquids', JSON.parse(JSON.stringify(saved))), saved);
  }
  const completed = { index: 5, actions: ['water', 'mix', 'oil', 'spoon', 'soap', 'spoon'], complete: true, at: 38 };
  assert.deepEqual(cleanScienceRound('liquids', completed), completed);
  assert.equal(cleanScienceRound('unknown', completed), null);
  assert.equal(cleanScienceRound('liquids', { ...completed, index: 6 }), null);
  assert.equal(cleanScienceRound('liquids', { ...completed, actions: ['water', 'soap'] }), null);
  assert.equal(cleanScienceRound('liquids', { index: 1, actions: [undefined, 'mix'] }), null);
  const unfinished = cleanScienceRound('liquids', { ...completed, actions: completed.actions.slice(0, 5) });
  assert.equal(unfinished.complete, false);
});
