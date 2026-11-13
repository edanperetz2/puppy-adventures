import * as ort from './voice-runtime/ort.wasm.min.mjs';
import { phoneFeatures } from './name-voice-features.js?v=2.2.0-voices';
import { namePhonemes, readNamePhones } from './name-voice-phones.js?v=2.2.0-voices';

const blue = 'https://huggingface.co/notmax123/bluev2-onnx-int8/resolve/b43c225c3578b4d50f2c38d0380e4a199a9ce711/';
const files = {
  wasm: ['https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/ort-wasm-simd-threaded.wasm', '4b884c203b0fa48d057be3332c65513ff85aa3c5bddd6946acc0fab7ecda001d'],
  phones: ['https://huggingface.co/KitsuMate/uni2005-onnx/resolve/004577e41ea954fa6cfe9d8f209447780af104ca/onnx/model_uint8.onnx?download=true', '2a5fad69d2bf112b4ef2ca510ef17d8c2d134f5e7ab2b1ae505ac51ffaea0d04'],
  duration: [`${blue}duration_predictor.onnx?download=true`, 'e751ef9f96fdaf25d5c6249614414cb62667b7f2ddd9daa6f551658af137d8f7'],
  text: [`${blue}text_encoder.onnx?download=true`, '4cf8228a029d6d7e1512176e3146200bec1643ef8f1c21693053fed19c56ffec'],
  flow: [`${blue}vector_estimator.onnx?download=true`, 'ab9c7b577c101719f39fe2ae9103595b9cd18cbd300524949dd95cd863b56093'],
  waveform: [`${blue}vocoder.onnx?download=true`, '846d13fa9f45bbba17ed503608b80b88753942f556e65bf83e436ae87a5a4f6a'],
};

async function modelBytes(key) {
  const [url, expected] = files[key];
  const cache = await globalThis.caches?.open('puppy-name-voice-models-v1').catch(() => null);
  for (let attempt = 0; attempt < 2; attempt++) {
    const saved = await cache?.match(url).catch(() => null);
    try {
      const response = saved || await fetch(url, { credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error('voice_download');
      const bytes = await response.arrayBuffer();
      const digest = await crypto.subtle.digest('SHA-256', bytes);
      const actual = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
      if (actual !== expected) throw new Error('voice_download');
      if (cache && !saved) await cache.put(url, new Response(bytes)).catch(() => {});
      return new Uint8Array(bytes);
    } catch {
      if (saved) await cache.delete(url).catch(() => false);
    }
  }
  throw new Error('voice_download');
}

function initializeRuntime(wasmBinary) {
  ort.env.wasm.numThreads = 1;
  ort.env.wasm.wasmPaths = { mjs: new URL('./voice-runtime/ort-wasm-simd-threaded.mjs', import.meta.url).href };
  ort.env.wasm.wasmBinary = wasmBinary;
}

const sampleRate = 44100;
const frameSamples = 3072;
const latentChannels = 144;
const totalSteps = 16;
const tensor = (data, dims) => new ort.Tensor('float32', Float32Array.from(data), dims);
const scalar = value => tensor([value], [1]);
const createSession = bytes => ort.InferenceSession.create(bytes, { executionProviders: ['wasm'] });

async function recognize(session, samples, vocabulary, writtenName) {
  const { input, length } = phoneFeatures(samples);
  const { logits } = await session.run({ mfcc: new ort.Tensor('float32', input, [1, length, 120]) });
  return readNamePhones(logits.data, vocabulary, writtenName);
}

function initialNoise(size, phrase) {
  let seed = 2166136261;
  for (const char of phrase) seed = Math.imul(seed ^ char.codePointAt(0), 16777619);
  const uniform = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) + 1) / 4294967297;
  return Float32Array.from({ length: size }, () => Math.sqrt(-2 * Math.log(uniform())) * Math.cos(2 * Math.PI * uniform()));
}

async function synthesize(phrase, sessions, style, vocabulary) {
  const characters = [...phrase.normalize('NFKD')];
  const ids = characters.map(char => vocabulary.char_to_id[char]);
  if (ids.some(id => id === undefined)) throw new Error('name_phonetics');
  const textIds = new ort.Tensor('int64', BigInt64Array.from(ids, id => BigInt(id)), [1, ids.length]);
  const textMask = tensor(new Float32Array(ids.length).fill(1), [1, 1, ids.length]);
  const styleTtl = tensor(style.style_ttl.data.flat(2), style.style_ttl.dims);
  const styleDp = tensor(style.style_dp.data.flat(2), style.style_dp.dims);
  const { duration } = await sessions.duration.run({ text_ids: textIds, style_dp: styleDp, text_mask: textMask });
  const seconds = duration.data[0] / 0.95;
  if (!Number.isFinite(seconds) || seconds < 0.2 || seconds > 15) throw new Error('voice_synthesis');
  const frames = Math.ceil(Math.floor(seconds * sampleRate) / frameSamples);
  const { text_emb: embedding } = await sessions.text.run({ text_ids: textIds, style_ttl: styleTtl, text_mask: textMask });
  const latentMask = tensor(new Float32Array(frames).fill(1), [1, 1, frames]);
  let latent = new ort.Tensor('float32', initialNoise(latentChannels * frames, phrase), [1, latentChannels, frames]);
  for (let step = 0; step < totalSteps; step++) {
    const result = await sessions.flow.run({
      noisy_latent: latent, text_emb: embedding, style_ttl: styleTtl,
      text_mask: textMask, latent_mask: latentMask,
      current_step: scalar(step), total_step: scalar(totalSteps), cfg_scale: scalar(4),
    });
    latent = result.denoised_latent;
  }
  const { waveform } = await sessions.waveform.run({ latent });
  const data = waveform.data.subarray(frameSamples, waveform.data.length - frameSamples);
  return waveFile(data);
}

function waveFile(samples) {
  const peak = samples.reduce((max, value) => Math.max(max, Math.abs(value)), 0);
  if (!Number.isFinite(peak) || peak < 0.001) throw new Error('voice_synthesis');
  const rate = sampleRate / 2;
  const before = Math.round(rate * 0.06), after = Math.round(rate * 0.14);
  const length = Math.floor(samples.length / 2);
  const size = (before + length + after) * 2;
  const buffer = new ArrayBuffer(44 + size);
  const wav = new DataView(buffer);
  const tag = (offset, value) => [...value].forEach((char, i) => wav.setUint8(offset + i, char.charCodeAt(0)));
  tag(0, 'RIFF'); wav.setUint32(4, 36 + size, true); tag(8, 'WAVE'); tag(12, 'fmt ');
  wav.setUint32(16, 16, true); wav.setUint16(20, 1, true); wav.setUint16(22, 1, true);
  wav.setUint32(24, rate, true); wav.setUint32(28, rate * 2, true);
  wav.setUint16(32, 2, true); wav.setUint16(34, 16, true); tag(36, 'data'); wav.setUint32(40, size, true);
  const scale = 32767 * Math.min(1, 0.94 / peak);
  for (let i = 0; i < length; i++) {
    const value = (samples[i * 2] + samples[i * 2 + 1]) / 2;
    wav.setInt16(44 + (before + i) * 2, Math.round(value * scale), true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

function namePhrases(phonetics, address) {
  const name = namePhonemes(phonetics);
  if (!name) throw new Error('name_phonetics');
  const welcome = address === 'male' ? 'baʁˈuχ habˈa lamisχˈak ʃelχˈa' : 'bʁuχˈa habaʔˈa lamisχˈak ʃelˈaχ';
  return [`ʃalˈom ${name}, ${welcome}!`, `${name}, behatslaχˈa!`];
}

async function readConfig(name) {
  const response = await fetch(new URL(`./voice-runtime/${name}.json`, import.meta.url));
  if (!response.ok) throw new Error('voice_download');
  return response.json();
}

export async function processNameVoice({ action, samples, phonetics, address, writtenName }, update, getBytes = modelBytes, config = readConfig) {
  update('loading');
  // Keep this in a short-lived worker. Its memory can be reclaimed after setup.
  const wasm = await getBytes('wasm');
  initializeRuntime(wasm);
  if (action === 'recognize') {
    const vocabulary = await config('phone-vocabulary');
    const session = await createSession(await getBytes('phones'));
    try { update('recognizing'); return { phonetics: await recognize(session, samples, vocabulary, writtenName) }; }
    finally { await session.release(); }
  }
  const phrases = namePhrases(phonetics, address);
  const [style, vocabulary] = await Promise.all([config('ava-style'), config('blue-vocabulary')]);
  const sessions = {};
  try {
    for (const key of ['duration', 'text', 'flow', 'waveform']) sessions[key] = await createSession(await getBytes(key));
    update('welcome');
    const welcome = await synthesize(phrases[0], sessions, style, vocabulary);
    update('good-luck');
    const goodLuck = await synthesize(phrases[1], sessions, style, vocabulary);
    return { welcome, goodLuck };
  } finally { await Promise.all(Object.values(sessions).map(session => session.release())); }
}

if (typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  self.onmessage = async ({ data }) => {
    try {
      const result = await processNameVoice(data, phase => self.postMessage({ phase }));
      self.postMessage({ result });
    } catch (error) { self.postMessage({ error: error.message }); }
  };
}
