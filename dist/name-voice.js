// Generated phrases are separate from both the microphone recording and album data.
const DB = 'puppy-personal-voices-v1';

function openVoices() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('voices');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('voice_storage'));
  });
}

async function voiceAccess(id, value) {
  const database = await openVoices();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = database.transaction('voices', value === undefined ? 'readonly' : 'readwrite');
      const store = transaction.objectStore('voices');
      const request = value === undefined ? store.get(id) : value === null ? store.delete(id) : store.put(value, id);
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = transaction.onerror = () => reject(transaction.error || new Error('voice_storage'));
    });
  } finally { database.close(); }
}

export async function savedNameVoice(profile) {
  if (!profile?.voiceId) return null;
  try {
    const voice = await voiceAccess(profile.voiceId);
    return usableNameVoice(profile, voice) ? voice : null;
  } catch { return null; }
}

export async function stageNameVoice(profile, voice) {
  if (!usableNameVoice(profile, voice)) throw new Error('voice_storage');
  const id = crypto.randomUUID();
  await voiceAccess(id, voice);
  return id;
}

export const discardNameVoice = id => id ? voiceAccess(id, null).catch(() => {}) : Promise.resolve();

export function usableNameVoice(profile, voice) {
  return voice?.name === profile?.name && voice?.address === profile?.address && typeof voice?.phonetics === 'string' && voice.phonetics.length <= 56 &&
    ['welcome', 'goodLuck'].every(key => voice?.[key] instanceof Blob && voice[key].type === 'audio/wav' && voice[key].size > 4000 && voice[key].size < 750000);
}

export function nameVoicePlayback(voice) {
  const urls = voice ? {
    welcome: URL.createObjectURL(voice.welcome),
    goodLuck: URL.createObjectURL(voice.goodLuck),
  } : null;
  return { urls, release: () => { if (urls) Object.values(urls).forEach(url => URL.revokeObjectURL(url)); } };
}

export async function recordingSamples(recording) {
  const Context = globalThis.AudioContext || globalThis.webkitAudioContext;
  const OfflineContext = globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext;
  if (!Context || !OfflineContext) throw new Error('voice_unsupported');
  const context = new Context();
  try {
    const audio = await context.decodeAudioData(await recording.arrayBuffer());
    if (audio.duration > 5 || audio.duration < 0.15) throw new Error('name_silence');
    const resampler = new OfflineContext(1, Math.ceil(audio.duration * 8000), 8000);
    const source = resampler.createBufferSource();
    source.buffer = audio;
    source.connect(resampler.destination);
    source.start();
    return (await resampler.startRendering()).getChannelData(0);
  } finally { await context.close().catch(() => {}); }
}

export function runNameVoice(input, { signal, onPhase }) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('voice_cancelled')); return; }
    const worker = new Worker(new URL('./name-voice-worker.js?v=2.2.0-voices', import.meta.url), { type: 'module' });
    const finish = (value, error) => {
      clearTimeout(timeout);
      signal.removeEventListener('abort', cancel);
      worker.terminate();
      if (error) reject(error);
      else resolve(value);
    };
    const cancel = () => finish(null, new Error('voice_cancelled'));
    const timeout = setTimeout(() => finish(null, new Error('voice_timeout')), 240000);
    signal.addEventListener('abort', cancel, { once: true });
    worker.onmessage = ({ data }) => {
      if (data.phase) onPhase(data.phase);
      else finish(data.result, data.error ? new Error(data.error) : null);
    };
    worker.onerror = () => finish(null, new Error('voice_unsupported'));
    worker.postMessage(input, input.samples ? [input.samples.buffer] : []);
  });
}
