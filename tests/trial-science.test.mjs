import test from 'node:test';
import assert from 'node:assert/strict';
import { scienceGames } from '../dist/trial-science.js';
import { art } from '../dist/art.js';

const choicesOnScene = html => [...html.matchAll(/data-trial-choice="([^"]+)"/gu)].map(match => match[1]);

test('all predictions, both comparison layouts and all valid science histories remain playable', () => {
  assert.deepEqual(scienceGames.map(game => game.id).sort(), ['floating','liquids','melting','pepper','shadow']);
  for (const game of scienceGames) {
    assert.notEqual(art(game.icon), art('unknown-trial-icon'));
    assert.equal(game.steps.length, 6);
    let histories = [[]];
    for (const step of game.steps) {
      const next = [];
      assert.ok(step.prompt && step.result && step.direct);
      const ids = step.choices.map(choice => choice.id);
      assert.equal(new Set(ids).size, ids.length);
      for (const history of histories) {
        for (const seed of [0, 1]) {
          const html = step.scene(history, null, seed);
          assert.deepEqual(choicesOnScene(html).sort(), ids.slice().sort(), step.prompt);
          assert.doesNotMatch(html, /undefined|aria-label=""|NaN/u);
          for (const tag of html.match(/<button\b[^>]*data-trial-drag[^>]*>/gu) || []) {
            const id = choicesOnScene(tag)[0];
            assert.ok(html.includes('data-trial-drop="'+id+'"'), 'drag has a matching destination');
          }
          for (const choice of step.correct || ids) {
            assert.ok(ids.includes(choice));
            const result = step.scene(history, choice, seed);
            assert.doesNotMatch(result, /undefined|NaN/u);
            for (const tag of result.match(/<button\b[^>]*>/gu) || []) assert.match(tag, /disabled/u);
            if (seed === 0) next.push([...history,choice]);
          }
        }
      }
      histories = next;
    }
  }
});

test('the physical effects remain visible and respond to the actual choices', () => {
  const game = id => scienceGames.find(entry => entry.id === id);
  const oil = game('liquids').steps[4];
  for (const slot of ['a','b']) {
    const compared = oil.scene(['oil','stir',slot,'stir'], null, 42);
    assert.match(compared, /data-trial-choice="soapy"[^]*?data-state="mixed"/u);
    assert.match(compared, /data-trial-choice="plain"[^]*?data-state="layer"/u);
    assert.equal(choicesOnScene(compared)[0], slot === 'a' ? 'soapy' : 'plain');
  }
  const pepper = game('pepper').steps[5];
  const left = pepper.scene([], 'sideA', 0), right = pepper.scene([], 'sideB', 0);
  assert.match(left, /--touch:32%/u);
  assert.match(right, /--touch:68%/u);
  assert.notEqual(left.match(/--ex:[^;]+/u)[0], right.match(/--ex:[^;]+/u)[0]);
  const shadow = game('shadow').steps[5];
  const cat = ['lamp','near','far','near','cat'], rabbit = [...cat.slice(0,4),'rabbit'];
  assert.match(shadow.scene(cat, null, 0), /data-range="near"/u);
  assert.match(shadow.scene(cat, 'far', 0), /data-range="far"/u);
  assert.notEqual(shadow.scene(cat, 'far', 0), shadow.scene(rabbit, 'far', 0));
});
