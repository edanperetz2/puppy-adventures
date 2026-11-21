import assert from 'node:assert/strict';
import test from 'node:test';
import { Narrator } from '../dist/audio.js';

function fixture(t) {
  const original = { Audio: globalThis.Audio, window: globalThis.window };
  const tones = [];
  let bus;
  globalThis.Audio = class {
    pause() {}
    async play() {}
  };
  globalThis.window = { AudioContext: class {
    currentTime = 0;
    destination = {};
    createGain() {
      const gain = {
        gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} },
        connect: target => { if (target === this.destination) bus = gain; return target; },
        disconnect() { this.disconnected = true; },
      };
      return gain;
    }
    createOscillator() {
      return { frequency: {}, connect: target => target, start() { tones.push(this); }, stop() {} };
    }
  } };
  t.after(() => {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  });
  return { narrator: new Narrator(), tones, bus: () => bus };
}

for (const order of ['before', 'after']) {
  test(`a reward requested ${order} praise waits for both the Hebrew and English clips`, async t => {
    const { narrator, tones, bus } = fixture(t);
    if (order === 'before') narrator.chime();
    const praise = narrator.say(['correct-1', 'en-dog']);
    if (order === 'after') narrator.chime();
    await Promise.resolve();
    assert.equal(tones.length, 0);
    narrator.audio.onended();
    await Promise.resolve();
    assert.match(narrator.audio.src, /en-dog\.mp3$/);
    assert.equal(tones.length, 0);
    narrator.audio.onended();
    assert.equal(await praise, true);
    assert.equal(tones.length, 3);
    const next = narrator.say('he-dog');
    assert.equal(bus().disconnected, true, 'replay silences the ringing reward before the word starts');
    narrator.audio.onended();
    await next;
    assert.equal(tones.length, 3);
  });
}

test('navigating or muting drops a queued reward without playing it over the next screen', async t => {
  const { narrator, tones } = fixture(t);
  const praise = narrator.say('correct-1');
  narrator.chime();
  await Promise.resolve();
  const next = narrator.say('welcome');
  assert.equal(await praise, false);
  narrator.audio.onended();
  assert.equal(await next, true);
  assert.equal(tones.length, 0);
  narrator.chime();
  narrator.stop();
  narrator.enabled = false;
  await Promise.resolve();
  assert.equal(tones.length, 0);
});

test('loading a new recording retains the requested hint speed and releases the shared element at normal speed', async t => {
  const { narrator } = fixture(t);
  const rates = [];
  narrator.audio.play = async function () {
    // The browser's resource selection algorithm restores the default on load.
    this.playbackRate = this.defaultPlaybackRate;
    rates.push(this.playbackRate);
  };
  const hint = narrator.say(['he-dog', 'en-dog'], { slow: true });
  narrator.audio.onended();
  await Promise.resolve();
  narrator.audio.onended();
  assert.equal(await hint, true);
  assert.deepEqual(rates, [0.92, 0.82]);
  assert.equal(narrator.audio.defaultPlaybackRate, 1);
  const interrupted = narrator.say('en-dog', { slow: true });
  narrator.stop();
  assert.equal(await interrupted, false);
  assert.equal(narrator.audio.defaultPlaybackRate, 1);
});
