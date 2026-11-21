import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { MPEGDecoder } from 'mpg123-decoder';
import { measureOnset } from '../scripts/narration-onsets.mjs';

const base = new URL('../dist/', import.meta.url);
const readMaster = id => readFile(new URL(`assets/audio/${id}.mp3`, base));
const peak = pcm => pcm.reduce((maximum, sample) => Math.max(maximum, Math.abs(sample)), 0);

test('the audible K in cat is lifted while its vowel, final T, silent lead and total duration are preserved', async t => {
  const decoder = new MPEGDecoder();
  t.after(() => decoder.free());
  await decoder.ready;
  const master = await readMaster('en-cat');
  const plan = await measureOnset(decoder, master);
  const { onsets } = JSON.parse(await readFile(new URL('offline-audio.json', base), 'utf8'));
  assert.deepEqual(plan, onsets['en-cat']);
  assert.ok(plan);
  const decode = async plan => {
    await decoder.reset();
    return decoder.decode(globalThis.prepareNarrationMp3(master, plan)).channelData[0];
  };
  const before = await decode(), after = await decode(plan);
  // Windows in the released 24 kHz cat recording, independently aligned with
  // K / AE / T. Compare the K burst and the whole remainder of the word.
  const burst = pcm => pcm.subarray(440 * 24, 480 * 24);
  assert.equal(after.length, before.length);
  assert.deepEqual(after.subarray(0, 192 * 24), before.subarray(0, 192 * 24));
  assert.ok(peak(burst(after)) > peak(burst(before)) * 2);
  assert.deepEqual(after.subarray(500 * 24), before.subarray(500 * 24));
  assert.equal(peak(before), peak(after));
});

test('the same analysis selects a quiet Hebrew opening and leaves a clearly voiced start alone', async t => {
  const decoder = new MPEGDecoder();
  t.after(() => decoder.free());
  await decoder.ready;
  const plan = await measureOnset(decoder, await readMaster('he-shirt'));
  const { onsets } = JSON.parse(await readFile(new URL('offline-audio.json', base), 'utf8'));
  assert.ok(plan);
  assert.deepEqual(plan, onsets['he-shirt']);
  assert.equal(await measureOnset(decoder, await readMaster('en-dog')), undefined);
});
