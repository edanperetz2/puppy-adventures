import assert from 'node:assert/strict';
import test from 'node:test';
import { createCompanionGreetings } from '../dist/companion-stickers.js';

function fixture(t) {
  const page = { hidden: false, querySelector: () => null };
  Object.defineProperty(globalThis, 'document', { configurable: true, value: page });
  const audio = new EventTarget();
  const played = [];
  audio.play = async () => { played.push(new URL(audio.src).pathname.split('/').at(-1)); };
  audio.pause = () => {};
  const settings = { sound: true };
  const controller = createCompanionGreetings(audio, () => settings.sound);
  t.after(() => { controller.stop(); delete globalThis.document; });
  const button = () => {
    const classes = new Set();
    return { isConnected: true, closest: () => null, classes,
      classList: { add: name => classes.add(name), remove: name => classes.delete(name) } };
  };
  return { controller, page, settings, played, pika: button(), stitch: button() };
}

test('a tap reacts during a lesson and only the last greeting plays after all instructions finish', async t => {
  const { controller, played, pika, stitch } = fixture(t);
  controller.narrationStatus('speaking');
  controller.greet('pikachu', pika);
  assert.ok(pika.classes.has('is-greeting'));
  controller.greet('stitch', stitch);
  controller.narrationStatus('idle');
  controller.narrationStatus('speaking');
  await Promise.resolve();
  assert.deepEqual(played, []);
  controller.narrationStatus('idle');
  await Promise.resolve();
  assert.deepEqual(played, ['stitch-ukulele.wav']);
  controller.greet('pikachu', pika);
  assert.deepEqual(played, ['stitch-ukulele.wav', 'pikachu-greeting.mp3']);
});

test('a deferred greeting belongs to the visible screen, respects mute, and can be cancelled', async t => {
  const { controller, page, settings, played, pika } = fixture(t);
  async function tryGreeting(change) {
    controller.narrationStatus('speaking');
    controller.greet('pikachu', pika);
    assert.ok(pika.classes.has('is-greeting'));
    change();
    controller.narrationStatus('idle');
    await Promise.resolve();
    assert.deepEqual(played, []);
  }
  await tryGreeting(() => controller.stop());
  await tryGreeting(() => { pika.isConnected = false; });
  pika.isConnected = true;
  await tryGreeting(() => { page.hidden = true; });
  page.hidden = false;
  await tryGreeting(() => { page.querySelector = () => ({}); });
  page.querySelector = () => null;
  await tryGreeting(() => { settings.sound = false; });
  controller.greet('pikachu', pika);
  assert.ok(pika.classes.has('is-greeting'));
  assert.deepEqual(played, []);
});
