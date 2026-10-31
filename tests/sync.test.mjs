import test from 'node:test';
import assert from 'node:assert/strict';
import { SharedAlbum, newCode, normalizeCode, formatCode, withPending } from '../dist/sync.js';
import { finishSession, freshProgress } from '../dist/engine.js';
import { MISSION_IDS } from '../dist/content.js';
import { STICKERS, LEGACY_STICKERS } from '../dist/stickers.js';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}

function server() {
  const albums = new Map();
  let online = true;
  const fetcher = async (_url, options) => {
    if (!online) throw new Error('offline');
    const request = JSON.parse(options.body);
    if (!albums.has(request.access_code)) {
      if (!request.create_album) return Response.json({ message: 'album_not_found' }, { status: 400 });
      albums.set(request.access_code, new Map());
    }
    const devices = albums.get(request.access_code);
    const old = devices.get(request.device_key) || freshProgress();
    const next = request.device_totals;
    for (const mission of MISSION_IDS) {
      old.missions[mission] = Math.max(old.missions[mission], next.missions[mission]);
      old.skills[mission].correct = old.missions[mission] * 6;
      old.skills[mission].assisted = Math.max(old.skills[mission].assisted, next.skills[mission].assisted);
    }
    devices.set(request.device_key, old);
    const combined = freshProgress();
    for (const value of devices.values()) for (const mission of MISSION_IDS) {
      combined.missions[mission] += value.missions[mission];
      combined.skills[mission].correct += value.skills[mission].correct;
      combined.skills[mission].assisted += value.skills[mission].assisted;
    }
    const response = withPending(combined, freshProgress(), freshProgress());
    // The deployed RPC returns the original twelve IDs plus uncapped totals.
    response.stickers = LEGACY_STICKERS.slice(0, response.sessions);
    return Response.json(response);
  };
  return { fetcher, online: value => { online = value; } };
}

const config = { url: 'https://test.example', key: 'public-test-key' };

function legacyProgress(sessions) {
  const progress = freshProgress();
  progress.sessions = sessions;
  progress.stars = sessions * 6;
  progress.missions.hebrew = sessions;
  progress.skills.hebrew.correct = sessions * 6;
  progress.stickers = [...LEGACY_STICKERS];
  return progress;
}

test('Expanded rewards derive from shared totals and survive offline progress beyond the old limit', async () => {
  const api = server();
  const saved = storage();
  const first = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  let second = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  const code = newCode();
  await first.link(code, legacyProgress(15), { create: true });
  await second.link(code, freshProgress());
  assert.deepEqual(first.progress.stickers, STICKERS.slice(0, 15));
  assert.deepEqual(second.progress.stickers, first.progress.stickers);
  api.online(false);
  const earned = second.complete('clock', 1);
  assert.equal(earned.sticker, STICKERS[15]);
  await second.flush();
  second = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  assert.equal(second.progress.stickers.length, 16);
  api.online(true);
  await second.flush(); await first.flush(); await second.flush();
  assert.equal(first.progress.sessions, 16);
  assert.deepEqual(first.progress.stickers, STICKERS.slice(0, 16));
  assert.deepEqual(second.progress.stickers, first.progress.stickers);
});

test('The thousandth shared reward is stable across devices and repeated uploads', async () => {
  const api = server();
  const first = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  const second = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  const code = newCode();
  await first.link(code, legacyProgress(999), { create: true });
  await second.link(code, freshProgress());
  const result = second.complete('math', 0);
  assert.equal(result.sticker, 'sticker-1000');
  await second.flush(); await first.flush(); await second.flush();
  assert.equal(first.progress.sessions, 1000);
  assert.deepEqual(first.progress.stickers, STICKERS);
  assert.deepEqual(second.progress.stickers, STICKERS);
  assert.equal(first.complete('letters', 0).sticker, null);
  await first.flush(); await second.flush();
  assert.equal(second.progress.sessions, 1001);
  assert.equal(second.progress.stickers.length, 1000);
});

test('The browser fetch API keeps its required Window receiver', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = function () {
      assert.equal(this, globalThis);
      return Promise.resolve(Response.json(freshProgress()));
    };
    const device = new SharedAlbum({ config, storage: storage() });
    await device.link(newCode(), freshProgress(), { create: true });
    assert.equal(device.linked, true);
  } finally { globalThis.fetch = original; }
});

test('Family codes are random, losslessly formatted and reject incomplete input', () => {
  const codes = new Set(Array.from({ length: 100 }, newCode));
  assert.equal(codes.size, 100);
  for (const code of codes) {
    assert.equal(code.length, 24);
    assert.equal(normalizeCode(formatCode(code).toLowerCase()), code);
  }
  assert.equal(normalizeCode('123'), null);
  assert.equal(normalizeCode('<script>'), null);
});

test('Different devices share progress and repeated uploads do not duplicate it', async () => {
  const api = server();
  const first = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  const second = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  const code = newCode();
  await first.link(code, finishSession(freshProgress(), 'hebrew', 1).progress, { create: true });
  await second.link(code, freshProgress());
  assert.equal(second.progress.sessions, 1);
  second.complete('english', 2);
  await second.flush();
  await first.flush();
  assert.equal(first.progress.sessions, 2);
  assert.equal(first.progress.skills.english.assisted, 2);
  await Promise.all([first.flush(), second.flush(), first.flush()]);
  assert.equal(first.progress.sessions, 2);
  assert.equal(second.progress.stickers.length, 2);
});

test('Offline completions survive reopening and upload once when reconnected', async () => {
  const api = server();
  const saved = storage();
  let device = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  await device.link(newCode(), freshProgress(), { create: true });
  api.online(false);
  device.complete('math', 0);
  await device.flush();
  assert.equal(device.progress.sessions, 1);
  assert.ok(device.pending);
  device = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  assert.equal(device.progress.sessions, 1);
  api.online(true);
  await device.flush();
  await device.flush();
  assert.equal(device.progress.sessions, 1);
  assert.equal(device.pending, false);
});

test('A rejected join preserves the local game and does not create a family', async () => {
  const api = server();
  const device = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  await assert.rejects(device.link(newCode(), freshProgress()), /album_not_found/);
  assert.equal(device.linked, false);
});

test('Letter adventures merge with previous subjects and upload once after offline play', async () => {
  const api = server(), saved = storage();
  const first = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  let second = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  const code = newCode();
  await first.link(code, finishSession(freshProgress(), 'math', 1).progress, { create: true });
  await second.link(code, freshProgress());
  api.online(false);
  second.complete('letters', 2);
  await second.flush();
  second = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  assert.equal(second.progress.missions.letters, 1);
  api.online(true);
  await second.flush(); await second.flush(); await first.flush();
  assert.equal(first.progress.sessions, 2);
  assert.equal(first.progress.missions.math, 1);
  assert.equal(first.progress.skills.letters.correct, 6);
  assert.equal(first.progress.skills.letters.assisted, 2);
  assert.equal(first.progress.stickers.length, 2);
});

test('Clock practice syncs with the original subjects and survives offline reopening', async () => {
  const api = server();
  const local = storage();
  const first = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  let second = new SharedAlbum({ config, storage: local, fetcher: api.fetcher });
  const code = newCode();
  await first.link(code, finishSession(freshProgress(), 'hebrew', 1).progress, { create: true });
  await second.link(code, freshProgress());
  api.online(false);
  second.complete('clock', 2);
  await second.flush();
  second = new SharedAlbum({ config, storage: local, fetcher: api.fetcher });
  assert.equal(second.progress.missions.clock, 1);
  assert.equal(second.progress.missions.hebrew, 1);
  api.online(true);
  await second.flush(); await first.flush(); await second.flush();
  assert.equal(first.progress.sessions, 2);
  assert.equal(first.progress.missions.clock, 1);
  assert.equal(first.progress.skills.clock.correct, 6);
  assert.equal(first.progress.skills.clock.assisted, 2);
  assert.equal(first.progress.missions.hebrew, 1);
});
