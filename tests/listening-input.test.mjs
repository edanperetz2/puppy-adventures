import assert from 'node:assert/strict';
import test from 'node:test';
import { createDeliveryBonus, createDeliveryRound } from '../dist/delivery.js';
import { mountDeliveryRound } from '../dist/delivery-view.js';
import { createDailyRound, dailyQuestion } from '../dist/daily.js';
import { mountDaily } from '../dist/daily-view.js';
import { newTheaterShow } from '../dist/theater.js';
import { mountTheaterStudio } from '../dist/theater-studio.js';

// Hold playback open while sending input through each controller's click handler.
function activity() {
  const elements = new Map(), recordings = [];
  let handleClick, successes = 0;
  function element(selector) {
    if (!elements.has(selector)) elements.set(selector, {
      dataset: {}, classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      setAttribute() {}, removeAttribute() {}, focus() {}, getBoundingClientRect() { return {}; },
      querySelector: element, closest() { return this; },
    });
    return elements.get(selector);
  }
  const root = Object.assign(element('main'), {
    addEventListener(type, handler) { if (type === 'click') handleClick = handler; },
    querySelectorAll: () => [], contains: () => true,
  });
  return {
    root, element, recordings,
    options: {
      nikud: true, motion: () => false, onSave() {}, focusTitle() {},
      play: () => new Promise(resolve => recordings.push(resolve)),
      onSuccess() { successes++; },
    },
    get successes() { return successes; },
    click(dataset) {
      const button = Object.assign(element(JSON.stringify(dataset)), { dataset });
      handleClick({ target: button, detail: 1 });
    },
  };
}

for (const path of ['cargo', 'aboard', 'route', 'pair']) {
  test(`Bobi accepts the first answer during narration in ${path}`, async () => {
    const a = activity(), round = path === 'pair' ? createDeliveryBonus() : createDeliveryRound(path);
    const view = mountDeliveryRound(a.root, { ...a.options, round });
    view.start();
    const q = round.questions[0], wrong = q.choices.find(id => id !== q.answer);
    assert.doesNotMatch(a.element('.delivery-board-slot').innerHTML, /data-delivery-choice=[^>]*\bdisabled\b/u);
    a.click({ deliveryChoice: wrong });
    assert.deepEqual(round.state.attempted, [wrong]);
    a.click({ deliveryChoice: q.answer });
    a.click({ deliveryChoice: q.answer });
    assert.equal(a.successes, 1);
    assert.ok(round.resolved);
    const feedback = a.element('.picnic-feedback').textContent;
    for (const resolve of a.recordings) resolve(false);
    await Promise.resolve();
    assert.equal(a.element('.picnic-feedback').textContent, feedback);
    view.destroy();
  });
}

test('daily animal choices work while the first clue and retry are still playing', async () => {
  const a = activity(), round = createDailyRound('english', {}, []);
  const view = mountDaily(a.root, { ...a.options, round });
  view.start();
  assert.doesNotMatch(a.element('.daily-stage').innerHTML, /data-daily-piece=[^>]*\bdisabled\b/u);
  const q = dailyQuestion(round);
  a.click({ dailyPiece: q.choices.find(word => word !== q.word) });
  assert.equal(round.state.mistakes, 1);
  a.click({ dailyPiece: q.word });
  assert.equal(a.successes, 1);
  const result = a.element('.daily-feedback').textContent;
  for (const resolve of a.recordings) resolve(false);
  await Promise.resolve();
  assert.equal(a.element('.daily-feedback').textContent, result);
  view.destroy();
});

test('theater casting accepts an actor immediately during its listening prompt', async () => {
  const a = activity(), studio = { shows: [], draft: newTheaterShow() };
  const view = mountTheaterStudio(a.root, { ...a.options, studio, items: {} });
  a.click({ thAction: 'actor-options' });
  a.click({ thAction: 'cast' });
  a.click({ thAction: 'choose-cast', value: 'duck' });
  assert.equal(studio.draft.actor, 'duck');
  const stage = a.root.innerHTML;
  for (const resolve of a.recordings) resolve(false);
  await Promise.resolve();
  assert.equal(a.root.innerHTML, stage);
  view.destroy();
});
