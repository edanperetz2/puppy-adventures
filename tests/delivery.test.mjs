import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DELIVERY, DELIVERY_MISSIONS, MY_JOURNEY } from '../dist/activities.js';
import { hasArt } from '../dist/art.js';
import { CLIPS } from '../dist/content.js';
import { GUIDE_ITEMS } from '../dist/guide-content.js';
import { applyObservations, DAY } from '../dist/learning.js';
import {
  advanceDelivery, cleanDelivery, cleanDeliveryRound, createDeliveryBonus, createDeliveryRound,
  deliveryEvidence, deliveryPairReady, DELIVERY_AUDIO, packDeliveryRound,
} from '../dist/delivery.js';
import { latestPlayedDraft } from '../dist/home-adventure.js';

const now = Date.parse('2026-11-12T10:00:00Z');
const event = (word, at, mode = 'bobi-harbor', kind = 'independent') => ({ item: `english:single:${word}`, domain: 'english', kind, at, mode });

test('Bobi has three six-step listening missions with a guided first step and known pictures and recordings', () => {
  assert.equal(DELIVERY.steps, 6);
  assert.equal(Object.keys(DELIVERY_MISSIONS).length, 3);
  assert.ok(GUIDE_ITEMS.some(item => item.en === MY_JOURNEY.en));
  assert.ok(DELIVERY_AUDIO.every(clip => CLIPS[clip]));
  for (const path of Object.keys(DELIVERY_MISSIONS)) {
    assert.equal(CLIPS[DELIVERY_MISSIONS[path].prompt].lang, 'he-IL');
    const positions = new Set();
    for (let version = 0; version < 24; version++) {
      const plan = createDeliveryRound(path, {}, { rng: () => (version / 24 + .01), now });
      const prefix = (Math.imul(version + 1, 2654435761) >>> 0).toString(16).padStart(8, '0');
      plan.id = `${prefix}-aa11-4231-bc54-123456789123`;
      const round = cleanDeliveryRound(path, packDeliveryRound(plan));
      assert.deepEqual(round.helped, [0]);
      assert.equal(round.questions.length, 6);
      assert.equal(new Set(round.questions.map(q => q.clip)).size, 6);
      assert.equal(new Set(round.questions.map(q => q.scene)).size, 3);
      for (const [i, q] of round.questions.entries()) {
        assert.equal(CLIPS[q.clip].lang, 'en-US');
        assert.equal(q.choices.length, i < 3 ? 2 : 3);
        assert.equal(new Set(q.choices).size, q.choices.length);
        assert.ok(q.choices.includes(q.answer));
        if (q.kind !== 'color') assert.ok(q.choices.every(hasArt));
      }
      positions.add(round.questions[3].choices.indexOf(round.questions[3].answer));
      if (path === 'cargo') {
        assert.ok(round.questions.slice(1).some(q => q.answer === 'blue'));
        assert.equal(round.questions[5].answer, 'boat');
      }
    }
    assert.equal(positions.size, 3);
  }
});

test('Bobi reviews a remembered word in a different scene and restores choices, help and retry state', () => {
  const items = applyObservations({}, [event('boat', now - DAY), event('blue', now - DAY)]);
  const round = createDeliveryRound('cargo', items, { rng: () => .04, now });
  for (const word of ['boat', 'blue']) assert.notEqual(round.questions.find(q => q.answer === word).scene, 'harbor');
  assert.equal(advanceDelivery(round), false);
  round.resolved = true;
  assert.ok(advanceDelivery(round));
  const q = round.questions[round.index];
  round.state.attempted = q.choices.filter(value => value !== q.answer);
  round.state.hint = true; round.helped.push(1); round.at = now;
  const snapshot = JSON.parse(JSON.stringify(packDeliveryRound(round)));
  const restored = cleanDeliveryRound('cargo', snapshot);
  assert.deepEqual(restored, round);
  assert.equal(packDeliveryRound(round).questions, undefined);
  assert.deepEqual(cleanDelivery(null), { drafts: {}, finished: [] });
  assert.equal(cleanDeliveryRound('route', snapshot), null);
  const malformed = { ...snapshot, targets: ['blue'] };
  assert.equal(cleanDeliveryRound('cargo', malformed), null);
  const latest = latestPlayedDraft({ drafts: {}, numberDrafts: {}, journeyDrafts: {}, scienceDrafts: {},
    deliveryDrafts: { cargo: snapshot }, picnicDrafts: { clock: { at: now - 1 } } });
  assert.equal(latest.kind, 'delivery');
  assert.equal(latest.path, 'cargo');
  assert.equal(deliveryEvidence(restored).mode, `bobi-${q.scene}`);
});

test('a familiar boat or animal moves between review slots on fresh trips and stays put on resume', () => {
  for (const [path, word] of [['cargo', 'boat'], ['aboard', 'frog']]) {
    const items = applyObservations({}, [event(word, now)]);
    const slots = new Set();
    for (let i = 1; i <= 30; i++) {
      let seed = i * 104729;
      const rng = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 2 ** 32);
      const round = createDeliveryRound(path, items, { rng, now });
      slots.add(round.targets.indexOf(word));
      assert.deepEqual(cleanDeliveryRound(path, packDeliveryRound(round)).questions, round.questions);
    }
    assert.deepEqual([...slots].sort(), [3, 4, 5]);
  }
});

test('the optional blue boat prompt requires separate-day independent results for both words', () => {
  const items = applyObservations({}, [
    event('blue', now - DAY), event('blue', now), event('boat', now - DAY),
    event('boat', now - DAY + 3600000), event('boat', now, 'bobi-river', 'helped'),
  ]);
  assert.equal(deliveryPairReady(items), false);
  assert.equal(deliveryPairReady(applyObservations(items, [event('boat', now)])), true);
  assert.equal(deliveryPairReady(), false);
  const bonus = createDeliveryBonus(() => .5);
  assert.equal(bonus.questions.length, 1);
  assert.equal(CLIPS[bonus.questions[0].clip].text, 'blue boat');
  assert.ok(bonus.questions[0].choices.includes('blue-ball'));
  assert.ok(bonus.questions[0].choices.some(choice => !choice.startsWith('blue-') && choice.endsWith('-boat')));
  assert.equal(deliveryEvidence(bonus).item, 'english:pair:blue-boat');
});
