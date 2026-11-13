import { finishSession, freshProgress, sanitizeProgress } from './engine.js?v=2.2.2-six';
import { STICKERS, MISSION_IDS } from './content.js';
import { recordLetters, pendingLetterPractice } from './letter-progress.js';
import { recordClockLesson } from './clock-learning.js';
import { SyncRetry, rateLimitError } from './sync-retry.js';

const KEY = 'puppy-adventures-family-v1';
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const keepStickers = (progress, saved) => {
  const earned = new Set([...progress.stickers, ...saved.stickers]);
  return STICKERS.filter((id, index) => index < progress.sessions || earned.has(id));
};

export function normalizeCode(value) {
  const code = String(value || '').toUpperCase().replace(/[\s-]/g, '');
  return /^[0-9A-HJKMNP-TV-Z]{24}$/.test(code) ? code : null;
}

export function formatCode(code) { return code.match(/.{1,4}/g).join('-'); }

export function newCode() {
  return Array.from(crypto.getRandomValues(new Uint8Array(24)), n => ALPHABET[n & 31]).join('');
}

function deviceId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = Array.from(bytes, n => n.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export function withPending(remote, own, confirmed) {
  const next = sanitizeProgress(remote);
  for (const mission of MISSION_IDS) {
    const sessions = Math.max(0, own.missions[mission] - confirmed.missions[mission]);
    const stars = Math.max(0, own.skills[mission].correct - confirmed.skills[mission].correct);
    next.sessions += sessions;
    next.stars += stars;
    next.missions[mission] += sessions;
    next.skills[mission].correct += stars;
    next.skills[mission].assisted += Math.max(0, own.skills[mission].assisted - confirmed.skills[mission].assisted);
  }
  next.sessions = Math.max(next.sessions, Object.values(next.missions).reduce((sum, n) => sum + n, 0));
  next.stars = Math.max(next.stars, Object.values(next.skills).reduce((sum, skill) => sum + skill.correct, 0));
  next.stickers = keepStickers(next, own);
  next.letterPractice = pendingLetterPractice(next.letterPractice, own.letterPractice, confirmed.letterPractice);
  next.clockLessons |= own.clockLessons;
  return next;
}

function sameContribution(a, b) {
  return a.clockLessons === b.clockLessons && MISSION_IDS.every(m => a.missions[m] === b.missions[m] && a.skills[m].correct === b.skills[m].correct && a.skills[m].assisted === b.skills[m].assisted) && JSON.stringify(a.letterPractice) === JSON.stringify(b.letterPractice);
}

export function compactContribution(progress) {
  const safe = sanitizeProgress(progress);
  // The RPC needs counters only; a 1,000-item sticker list exceeds its size cap.
  return { missions: safe.missions, skills: Object.fromEntries(MISSION_IDS.map(id => [id, { correct: Math.max(safe.skills[id].correct, safe.missions[id] * 6), assisted: safe.skills[id].assisted }])), letterPractice: safe.letterPractice, clockLessons: safe.clockLessons };
}

export class SharedAlbum {
  constructor({ config, storage, localProgress, fetcher = globalThis.fetch.bind(globalThis), onChange = () => {}, retryOptions = {} }) {
    this.config = config;
    this.fetcher = fetcher;
    this.onChange = onChange;
    this.storage = storage;
    this.status = 'local';
    this.generation = 0;
    this.inflight = null;
    this.again = false;
    this.state = null;
    try {
      this.storage ||= globalThis.localStorage;
      const saved = JSON.parse(this.storage.getItem(KEY) || 'null');
      if (normalizeCode(saved?.code) && /^[0-9a-f-]{36}$/i.test(saved.device)) {
        this.state = { code: normalizeCode(saved.code), device: saved.device, own: sanitizeProgress(saved.own), confirmed: sanitizeProgress(saved.confirmed), remote: sanitizeProgress(saved.remote), completedIds: (Array.isArray(saved.completedIds) ? saved.completedIds : []).filter(id => /^[0-9a-f-]{36}$/i.test(id)).slice(-10000) };
        // The game also saves the last album it showed. Use that copy to
        // recover earned sticker IDs if the browser saved one key late.
        if (localProgress) this.state.remote.stickers = keepStickers(this.state.remote, sanitizeProgress(localProgress));
        this.status = this.pending ? 'pending' : 'synced';
      }
    } catch { /* Browser restrictions must never block the local game. */ }
    this.retry = new SyncRetry({ ...retryOptions, storage: this.storage, key: `${KEY}-retry` });
    this.creationRetry = new SyncRetry({ ...retryOptions, storage: this.storage, key: `${KEY}-creation-retry` });
  }

  get linked() { return Boolean(this.state); }
  get pending() { return this.linked && !sameContribution(this.state.own, this.state.confirmed); }
  get progress() { return this.linked ? withPending(this.state.remote, this.state.own, this.state.confirmed) : null; }
  get code() { return this.state?.code || null; }

  persist() {
    if (!this.storage) throw new Error('storage_unavailable');
    if (this.state) this.storage.setItem(KEY, JSON.stringify(this.state));
    else this.storage.removeItem(KEY);
  }

  notify() { this.onChange(this); }

  async request(state, own, create = false) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await this.fetcher(`${this.config.url}/rest/v1/rpc/puppy_sync_album`, {
        method: 'POST',
        headers: { apikey: this.config.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_code: state.code, device_key: state.device, device_totals: compactContribution(own), create_album: create }),
        signal: controller.signal,
      });
      const value = await response.json().catch(() => null);
      const limited = rateLimitError(response, value, this.retry.now());
      if (limited) throw limited;
      if (!response.ok) {
        const message = value?.message === 'album_not_found' ? 'album_not_found' : 'sync_unavailable';
        throw new Error(message);
      }
      if (value?.version !== 1 || !Number.isSafeInteger(value.sessions)) throw new Error('sync_unavailable');
      return sanitizeProgress(value);
    } finally { clearTimeout(timeout); }
  }

  async link(code, local, { create = false } = {}) {
    const valid = normalizeCode(code);
    if (!valid) throw new Error('invalid_code');
    if (this.linked) throw new Error('already_linked');
    if (create && this.creationRetry.blocked) throw this.creationRetry.error('album_creation_limited');
    if (this.retry.blocked) throw this.retry.error();
    const candidate = { code: valid, device: deviceId(), own: sanitizeProgress(local), confirmed: freshProgress(), remote: freshProgress() };
    // Verify that the pairing can survive closing the browser before joining.
    try { this.storage.setItem(`${KEY}-check`, '1'); this.storage.removeItem(`${KEY}-check`); }
    catch { throw new Error('storage_unavailable'); }
    const generation = this.generation;
    try { candidate.remote = await this.request(candidate, candidate.own, create); }
    catch (error) {
      if (generation === this.generation && error.retryAfterMs) {
        (error.message === 'album_creation_limited' ? this.creationRetry : this.retry).pause(error);
      }
      throw error;
    }
    if (generation !== this.generation) throw new Error('sync_unavailable');
    candidate.confirmed = sanitizeProgress(candidate.own);
    this.state = candidate;
    this.generation++;
    this.status = 'synced';
    this.retry.clear();
    this.persist();
    this.notify();
    return this.progress;
  }

  complete(mission, assisted, letterRound = null, roundId = null, questionCount) {
    if (!this.linked) throw new Error('not_linked');
    this.state.completedIds ||= [];
    if (roundId && this.state.completedIds.includes(roundId)) return { progress: this.progress, sticker: null };
    if (roundId) this.state.completedIds = [...this.state.completedIds, roundId].slice(-10000);
    const before = this.progress;
    this.state.own = finishSession(this.state.own, mission, assisted, letterRound, questionCount).progress;
    this.status = 'pending';
    try { this.persist(); } catch { this.status = 'storage-error'; }
    const progress = this.progress;
    const sticker = progress.stickers.find(id => !before.stickers.includes(id)) || null;
    this.notify();
    void this.flush();
    return { progress, sticker };
  }

  recordWriting(language, id, mode = 'writing') {
    if (!this.linked) throw new Error('not_linked');
    if (!['writing', 'writingMain'].includes(mode)) throw new Error('invalid_writing_mode');
    this.state.own.letterPractice = recordLetters(this.state.own.letterPractice, language, mode, [id]);
    this.status = 'pending';
    try { this.persist(); } catch { this.status = 'storage-error'; }
    this.notify(); void this.flush();
    return this.progress;
  }

  recordClockLesson(index) {
    if (!this.linked) throw new Error('not_linked');
    const mask = recordClockLesson(this.state.own.clockLessons, index);
    if (mask === this.state.own.clockLessons) return this.progress;
    this.state.own.clockLessons = mask;
    this.status = 'pending';
    try { this.persist(); } catch { this.status = 'storage-error'; }
    this.notify(); void this.flush();
    return this.progress;
  }

  flush() {
    if (!this.linked) return Promise.resolve();
    if (this.inflight) { this.again = true; return this.inflight; }
    if (this.retry.blocked) {
      this.status = 'throttled';
      const generation = this.generation;
      this.retry.schedule(() => { if (generation === this.generation) void this.flush(); });
      this.notify();
      return Promise.resolve();
    }
    this.inflight = this.performFlush().finally(() => {
      this.inflight = null;
      if (this.again && this.linked) { this.again = false; void this.flush(); }
    });
    return this.inflight;
  }

  async performFlush() {
    const generation = this.generation;
    const captured = sanitizeProgress(this.state.own);
    const state = this.state;
    this.status = 'syncing';
    this.notify();
    try {
      const remote = await this.request(state, captured);
      if (generation !== this.generation) return;
      // A family's confirmed totals only grow. Keep the last valid album if
      // a response is missing some of the progress this device already saw.
      if (remote.sessions < state.remote.sessions || remote.stars < state.remote.stars
          || MISSION_IDS.some(mission => remote.missions[mission] < state.remote.missions[mission])) {
        throw new Error('sync_unavailable');
      }
      remote.stickers = keepStickers(remote, state.remote);
      this.state.remote = remote;
      this.state.confirmed = captured;
      this.retry.clear();
      this.status = this.pending ? 'pending' : 'synced';
      try { this.persist(); } catch { this.status = 'storage-error'; }
    } catch (error) {
      if (generation !== this.generation) return;
      this.again = false;
      if (error.retryAfterMs) {
        this.retry.pause(error);
        this.retry.schedule(() => { if (generation === this.generation) void this.flush(); });
        this.status = 'throttled';
      } else this.status = this.pending ? 'pending' : 'offline';
    }
    this.notify();
  }

  disconnect() {
    this.generation++;
    this.state = null;
    this.again = false;
    this.retry.clear();
    this.status = 'local';
    this.persist();
    this.notify();
  }
}
