// Rate limits pause uploads only. Progress continues to be saved by each store.
const MAX_WAIT = 86400000;

export function rateLimitError(response, value, now = Date.now()) {
  if (response.status !== 429) return null;
  let details = value?.details;
  try { if (typeof details === 'string') details = JSON.parse(details); } catch { details = null; }
  const header = response.headers?.get?.('Retry-After');
  let seconds = header && /^\d+(\.\d+)?$/.test(header.trim()) ? Number(header) : NaN;
  if (!Number.isFinite(seconds) && header) seconds = (Date.parse(header) - now) / 1000;
  if (!Number.isFinite(seconds)) seconds = Number(details?.retry_after);
  if (!Number.isFinite(seconds) || seconds <= 0) seconds = 60;
  const error = new Error(value?.message === 'album_creation_limited' ? 'album_creation_limited' : 'rate_limited');
  error.retryAfterMs = Math.min(MAX_WAIT, Math.max(1000, Math.ceil(seconds * 1000)));
  return error;
}

export class SyncRetry {
  constructor({ storage, key, now = Date.now, setTimer = setTimeout, clearTimer = clearTimeout }) {
    Object.assign(this, { storage, key, now, setTimer, clearTimer });
    this.timer = null;
    this.until = 0;
    try {
      const saved = Number(storage?.getItem(key));
      if (Number.isFinite(saved) && saved > now()) this.until = Math.min(saved, now() + MAX_WAIT + 1000);
    } catch { /* A retry timestamp must never prevent local play. */ }
  }

  get blocked() { return this.until > this.now(); }

  error(reason = 'rate_limited') {
    const error = new Error(reason);
    error.retryAfterMs = Math.max(1000, this.until - this.now());
    return error;
  }

  pause(error) {
    // Wait just beyond the server boundary to avoid an early retry.
    this.until = this.now() + Math.min(MAX_WAIT, error.retryAfterMs || 60000) + 250;
    this.cancelTimer();
    try { this.storage?.setItem(this.key, String(this.until)); } catch { /* The pending progress has its own durable save. */ }
  }

  schedule(callback) {
    if (this.timer !== null) return;
    this.timer = this.setTimer(() => { this.timer = null; callback(); }, Math.max(0, this.until - this.now()));
    this.timer?.unref?.();
  }

  cancelTimer() {
    if (this.timer !== null) this.clearTimer(this.timer);
    this.timer = null;
  }

  clear() {
    this.cancelTimer();
    this.until = 0;
    try { this.storage?.removeItem(this.key); } catch { /* Optional retry metadata only. */ }
  }
}
