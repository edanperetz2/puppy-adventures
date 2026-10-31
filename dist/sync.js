import { finishSession, freshProgress, sanitizeProgress } from './engine.js';
import { STICKERS, MISSION_IDS } from './content.js';
import { recordLetters, pendingLetterPractice } from './letter-progress.js';

const KEY = 'puppy-adventures-family-v1';
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

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
    const extra = Math.max(0, own.missions[mission] - confirmed.missions[mission]);
    next.missions[mission] += extra;
    next.skills[mission].correct += extra * 6;
    next.skills[mission].assisted += Math.max(0, own.skills[mission].assisted - confirmed.skills[mission].assisted);
  }
  next.sessions = Object.values(next.missions).reduce((sum, n) => sum + n, 0);
  next.stars = next.sessions * 6;
  next.stickers = STICKERS.slice(0, Math.min(next.sessions, STICKERS.length));
  next.letterPractice = pendingLetterPractice(next.letterPractice, own.letterPractice, confirmed.letterPractice);
  return next;
}

function sameContribution(a, b) {
  return MISSION_IDS.every(m => a.missions[m] === b.missions[m] && a.skills[m].assisted === b.skills[m].assisted) && JSON.stringify(a.letterPractice) === JSON.stringify(b.letterPractice);
}

export function compactContribution(progress) {
  const safe = sanitizeProgress(progress);
  // The RPC needs counters only; a 1,000-item sticker list exceeds its size cap.
  return { missions: safe.missions, skills: Object.fromEntries(MISSION_IDS.map(id => [id, { assisted: safe.skills[id].assisted }])), letterPractice: safe.letterPractice };
}

export class SharedAlbum {
  constructor({ config, storage, fetcher = globalThis.fetch.bind(globalThis), onChange = () => {} }) {
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
        this.state = { code: normalizeCode(saved.code), device: saved.device, own: sanitizeProgress(saved.own), confirmed: sanitizeProgress(saved.confirmed), remote: sanitizeProgress(saved.remote) };
        this.status = this.pending ? 'pending' : 'synced';
      }
    } catch { /* Browser restrictions must never block the local game. */ }
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
      const value = await response.json();
      if (!response.ok) {
        const message = value.message === 'album_not_found' ? 'album_not_found' : 'sync_unavailable';
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
    const candidate = { code: valid, device: deviceId(), own: sanitizeProgress(local), confirmed: freshProgress(), remote: freshProgress() };
    // Verify that the pairing can survive closing the browser before joining.
    try { this.storage.setItem(`${KEY}-check`, '1'); this.storage.removeItem(`${KEY}-check`); }
    catch { throw new Error('storage_unavailable'); }
    candidate.remote = await this.request(candidate, candidate.own, create);
    candidate.confirmed = sanitizeProgress(candidate.own);
    this.state = candidate;
    this.generation++;
    this.status = 'synced';
    this.persist();
    this.notify();
    return this.progress;
  }

  complete(mission, assisted, letterRound = null) {
    if (!this.linked) throw new Error('not_linked');
    const before = this.progress;
    this.state.own = finishSession(this.state.own, mission, assisted, letterRound).progress;
    this.status = 'pending';
    try { this.persist(); } catch { this.status = 'storage-error'; }
    const progress = this.progress;
    const sticker = progress.stickers.find(id => !before.stickers.includes(id)) || null;
    this.notify();
    void this.flush();
    return { progress, sticker };
  }

  recordWriting(language, id) {
    if (!this.linked) throw new Error('not_linked');
    this.state.own.letterPractice = recordLetters(this.state.own.letterPractice, language, 'writing', [id]);
    this.status = 'pending';
    try { this.persist(); } catch { this.status = 'storage-error'; }
    this.notify(); void this.flush();
    return this.progress;
  }

  flush() {
    if (!this.linked) return Promise.resolve();
    if (this.inflight) { this.again = true; return this.inflight; }
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
      this.state.remote = remote;
      this.state.confirmed = captured;
      this.status = this.pending ? 'pending' : 'synced';
      try { this.persist(); } catch { this.status = 'storage-error'; }
    } catch {
      if (generation !== this.generation) return;
      this.status = this.pending ? 'pending' : 'offline';
    }
    this.notify();
  }

  disconnect() {
    this.generation++;
    this.state = null;
    this.again = false;
    this.status = 'local';
    this.persist();
    this.notify();
  }
}
