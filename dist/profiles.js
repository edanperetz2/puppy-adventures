import { findVoiceName, VOICE_NAMES } from './profile-content.js';

export const PROFILE_KEY = 'puppy-adventures-children-v1';
export const GAME_KEY = 'puppy-adventures-v1';
export const FAMILY_KEY = 'puppy-adventures-family-v1';
export const LEGACY_PROFILE_ID = 'ariel-legacy';
const allowedId = id => id === LEGACY_PROFILE_ID || /^[0-9a-f]{8}-[0-9a-f-]{27}$/u.test(id || '');
const allowedKey = key => [GAME_KEY, FAMILY_KEY, `${FAMILY_KEY}-check`, 'name-recording'].includes(key);

function profileId() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = bytes[6] & 15 | 64; bytes[8] = bytes[8] & 63 | 128;
  const hex = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}

export function cleanName(value) {
  if (typeof value !== 'string') return null;
  const name = value.normalize('NFC').trim().replace(/\s+/gu, ' ');
  return /\p{L}/u.test(name) && [...name].length <= 30 && /^[\p{L}\p{M} '’׳־-]+$/u.test(name) ? name : null;
}

export function escapeHtml(text) {
  return String(text).replace(/[&<>"']/gu, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

export function cleanProfile(input) {
  if (!input || !allowedId(input.id) || !cleanName(input.name)) return null;
  const voice = VOICE_NAMES.some(item => item.id === input.voice) ? input.voice : findVoiceName(input.name)?.id || null;
  const pendingAlbum = input.id !== LEGACY_PROFILE_ID && /^[0-9A-HJKMNP-TV-Z]{24}$/u.test(input.pendingAlbum || '') ? input.pendingAlbum : null;
  return { id: input.id, name: cleanName(input.name), address: input.address === 'male' ? 'male' : 'female', voice, pendingAlbum };
}

export function recordingData(value) {
  return typeof value === 'string' && value.length <= 700000 && /^data:audio\/(webm|mp4|ogg|mpeg|wav|x-m4a)(?:;codecs=[a-z0-9.,-]+)?;base64,[A-Za-z0-9+/]+={0,2}$/iu.test(value) ? value : null;
}

export class ChildProfiles {
  constructor(storage) {
    this.storage = storage;
    this.error = false;
    this.profiles = [];
    this.activeId = null;
    try {
      storage ||= globalThis.localStorage;
      this.storage = storage;
      const raw = storage.getItem(PROFILE_KEY);
      try { if (raw) {
        const saved = JSON.parse(raw);
        const ids = new Set();
        this.profiles = (Array.isArray(saved.profiles) ? saved.profiles : []).map(cleanProfile).filter(profile => profile && !ids.has(profile.id) && ids.add(profile.id)).slice(0, 20);
        this.activeId = this.profiles.some(profile => profile.id === saved.activeId) ? saved.activeId : this.profiles[0]?.id || null;
      } } catch { this.error = true; }
      // The original save and pairing stay at their exact original keys. This
      // is a label around Ariel's existing data, with no progress migration.
      if (!this.profiles.some(profile => profile.id === LEGACY_PROFILE_ID) && (storage.getItem(GAME_KEY) || storage.getItem(FAMILY_KEY))) {
        this.profiles.unshift({ id: LEGACY_PROFILE_ID, name: 'אריאל', address: 'female', voice: 'ariel' });
        this.activeId ||= LEGACY_PROFILE_ID;
      }
      if (this.profiles.length) this.persist();
    } catch { this.error = true; }
  }

  get active() { return this.profiles.find(profile => profile.id === this.activeId) || null; }
  persist() { this.storage.setItem(PROFILE_KEY, JSON.stringify({ version: 1, activeId: this.activeId, profiles: this.profiles })); }

  add(details, recording = null) {
    if (this.profiles.length >= 20) throw new Error('profile_limit');
    const profile = cleanProfile({ ...details, id: profileId() });
    if (!profile) throw new Error('invalid_name');
    const before = { profiles: this.profiles, activeId: this.activeId };
    this.profiles = [...this.profiles, profile];
    this.activeId = profile.id;
    try {
      if (recording) {
        if (!recordingData(recording)) throw new Error('invalid_recording');
        this.storageFor(profile.id).setItem('name-recording', recording);
      }
      this.persist();
    } catch (error) {
      try { this.storageFor(profile.id).removeItem('name-recording'); } catch { /* New isolated key only. */ }
      Object.assign(this, before); throw new Error('storage_unavailable', { cause: error });
    }
    return profile;
  }

  select(id) {
    if (!this.profiles.some(profile => profile.id === id)) throw new Error('unknown_profile');
    const before = this.activeId;
    this.activeId = id;
    try { this.persist(); } catch (error) { this.activeId = before; throw new Error('storage_unavailable', { cause: error }); }
  }

  update(id, details, recording = undefined) {
    const current = this.profiles.find(profile => profile.id === id);
    const profile = cleanProfile({ ...current, ...details, id });
    if (!current || !profile) throw new Error('invalid_name');
    const before = this.profiles;
    const store = this.storageFor(id), oldRecording = store.getItem('name-recording');
    this.profiles = this.profiles.map(item => item.id === id ? profile : item);
    try {
      if (recording !== undefined) {
        if (recording && !recordingData(recording)) throw new Error('invalid_recording');
        if (recording) store.setItem('name-recording', recording); else store.removeItem('name-recording');
      }
      this.persist();
    } catch (error) {
      this.profiles = before;
      try { if (oldRecording) store.setItem('name-recording', oldRecording); else store.removeItem('name-recording'); } catch { /* Keep progress independent of voice storage. */ }
      throw new Error('storage_unavailable', { cause: error });
    }
    return profile;
  }

  storageFor(id = this.activeId) {
    if (!this.profiles.some(profile => profile.id === id)) throw new Error('unknown_profile');
    const storage = this.storage;
    const keyFor = key => {
      if (!allowedKey(key)) throw new Error('unknown_profile_key');
      return id === LEGACY_PROFILE_ID && key !== 'name-recording' ? key : `puppy-child-${id}:${key}`;
    };
    // Capture the immutable ID. An upload in flight when another tab switches
    // children still writes only to the child who made that contribution.
    return { getItem: key => storage.getItem(keyFor(key)), setItem: (key, value) => storage.setItem(keyFor(key), value), removeItem: key => storage.removeItem(keyFor(key)) };
  }

  albumCode(id = this.activeId) {
    try { return JSON.parse(this.storageFor(id).getItem(FAMILY_KEY))?.code || null; }
    catch { return null; }
  }

  findAlbum(code) { return this.profiles.find(profile => this.albumCode(profile.id) === code) || null; }
}

export function readInvitation(hash) {
  const query = new URLSearchParams(hash.replace(/^#/u, ''));
  const code = String(query.get('album') || '').toUpperCase().replace(/[\s-]/gu, '');
  if (!/^[0-9A-HJKMNP-TV-Z]{24}$/u.test(code)) return null;
  const voice = VOICE_NAMES.some(name => name.id === query.get('voice')) ? query.get('voice') : null;
  return { code, name: cleanName(query.get('child')), address: query.get('address') === 'male' ? 'male' : 'female', voice };
}

export function invitationNeedsNewProfile(profiles, invitation) {
  if (!invitation || !profiles.active || profiles.albumCode() === invitation.code) return false;
  return Boolean(profiles.albumCode() || profiles.active.pendingAlbum !== invitation.code);
}

export function invitationLink(origin, pathname, code, profile) {
  const url = new URL(pathname, origin);
  const query = new URLSearchParams({ album: code });
  if (profile) { query.set('child', profile.name); query.set('address', profile.address); if (profile.voice) query.set('voice', profile.voice); }
  url.hash = query.toString();
  return url.href;
}
