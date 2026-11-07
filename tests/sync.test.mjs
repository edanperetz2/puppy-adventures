import test from 'node:test';
import assert from 'node:assert/strict';
import { SharedAlbum, newCode, normalizeCode, formatCode, withPending, compactContribution } from '../dist/sync.js';
import { finishSession, freshProgress } from '../dist/engine.js';
import { MISSION_IDS } from '../dist/content.js';
import { STICKERS, LEGACY_STICKERS } from '../dist/stickers.js';
import { LETTERS } from '../dist/letters.js';
import { LETTER_MODES, sanitizeLetterPractice, suggestedLetters } from '../dist/letter-progress.js';
import { syncClock } from './helpers/sync-clock.mjs';

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
    if (Buffer.byteLength(JSON.stringify(request.device_totals)) > 4096) return Response.json({ message: 'invalid_progress' }, { status: 400 });
    if (!albums.has(request.access_code)) {
      if (!request.create_album) return Response.json({ message: 'album_not_found' }, { status: 400 });
      albums.set(request.access_code, new Map());
    }
    const devices = albums.get(request.access_code);
    const old = devices.get(request.device_key) || freshProgress();
    const next = request.device_totals;
    old.clockLessons |= next.clockLessons || 0;
    for (const mission of MISSION_IDS) {
      const previousCount = old.missions[mission];
      old.missions[mission] = Math.max(old.missions[mission], next.missions[mission]);
      old.skills[mission].correct = Math.max(old.skills[mission].correct + Math.max(0, next.missions[mission] - previousCount) * 6, next.skills?.[mission]?.correct || 0);
      old.skills[mission].assisted = Math.max(old.skills[mission].assisted, next.skills[mission].assisted);
    }
    const letters = sanitizeLetterPractice(next.letterPractice);
    for (const language of Object.keys(LETTERS)) {
      old.letterPractice[language].start = Math.max(old.letterPractice[language].start, letters[language].start);
      for (const mode of LETTER_MODES) old.letterPractice[language][mode] = old.letterPractice[language][mode].map((n, i) => Math.max(n, letters[language][mode][i]));
    }
    devices.set(request.device_key, old);
    const combined = freshProgress();
    for (const value of devices.values()) combined.clockLessons |= value.clockLessons;
    for (const value of devices.values()) for (const mission of MISSION_IDS) {
      combined.missions[mission] += value.missions[mission];
      combined.skills[mission].correct += value.skills[mission].correct;
      combined.skills[mission].assisted += value.skills[mission].assisted;
    }
    for (const value of devices.values()) for (const language of Object.keys(LETTERS)) {
      combined.letterPractice[language].start = Math.max(combined.letterPractice[language].start, value.letterPractice[language].start);
      for (const mode of LETTER_MODES) combined.letterPractice[language][mode] = combined.letterPractice[language][mode].map((n, i) => n + value.letterPractice[language][mode][i]);
    }
    const response = withPending(combined, freshProgress(), freshProgress());
    // The deployed RPC returns the original twelve IDs plus uncapped totals.
    response.stickers = LEGACY_STICKERS.slice(0, response.sessions);
    return Response.json(response);
  };
  return { fetcher, online: value => { online = value; } };
}

const config = { url: 'https://test.example', key: 'public-test-key' };

test('A throttled album keeps old and new stickers and writing after reopening, then retries automatically once', async () => {
  const api = server(), clock = syncClock(), saved = storage(), code = newCode();
  let limited = false, calls = 0;
  const fetcher = (...args) => {
    calls++;
    return limited ? Promise.resolve(new Response('Busy', { status: 429, headers: { 'Retry-After': '60' } })) : api.fetcher(...args);
  };
  let album = new SharedAlbum({ config, storage: saved, fetcher, retryOptions: clock.options });
  await album.link(code, legacyProgress(26), { create: true });
  limited = true;
  album.complete('math', 0); album.recordWriting('hebrew', 'he-vav', 'writingMain'); album.recordClockLesson(6);
  await album.flush();
  assert.equal(album.status, 'throttled');
  const before = calls;
  album.complete('english', 0);
  await Promise.all(Array.from({ length: 20 }, () => album.flush()));
  assert.equal(calls, before, 'Focus, polling and continued play cannot bypass Retry-After');
  clock.close(); // Closing the browser removes timers, but retains its saved state.
  album = new SharedAlbum({ config, storage: saved, fetcher, retryOptions: clock.options });
  assert.equal(album.progress.stickers.length, 28);
  assert.equal(album.progress.letterPractice.hebrew.writingMain[5], 1);
  assert.equal(album.progress.clockLessons & 64, 64);
  await album.flush(); await clock.advance(60000);
  assert.equal(calls, before, 'Reopening also respects the stored wait');
  limited = false; await clock.advance(251);
  assert.equal(calls, before + 1);
  assert.equal(album.pending, false); assert.equal(album.status, 'synced');
  const other = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  await other.link(code, freshProgress());
  assert.equal(other.progress.stickers.length, 28);
  assert.equal(other.progress.letterPractice.hebrew.writingMain[5], 1);
  assert.equal(other.progress.clockLessons & 64, 64);
});

test('Repeated creation attempts wait without changing the local game or creating an accidental album', async () => {
  const api = server(), clock = syncClock(), saved = storage(), local = legacyProgress(26);
  const before = structuredClone(local);
  const existing = newCode(), other = new SharedAlbum({config,storage:storage(),fetcher:api.fetcher});
  await other.link(existing,freshProgress(),{create:true});
  let limited = true, calls = 0;
  const album = new SharedAlbum({ config, storage: saved, retryOptions: clock.options, fetcher: (...args) => {
    calls++;
    return limited && JSON.parse(args[1].body).create_album ? Promise.resolve(Response.json({message:'album_creation_limited'}, { status: 429, headers: { 'Retry-After': '120' } })) : api.fetcher(...args);
  } });
  await assert.rejects(album.link(newCode(), local, { create: true }), /album_creation_limited/);
  await assert.rejects(album.link(newCode(), local, { create: true }), /album_creation_limited/);
  assert.equal(calls, 1); assert.equal(album.linked, false); assert.deepEqual(local, before);
  await album.link(existing,local);
  assert.equal(album.progress.stickers.length,26,'An existing album can be joined during a creation cooldown');
  album.disconnect();
  await assert.rejects(album.link(newCode(),local,{create:true}),/album_creation_limited/);
  assert.equal(calls,2);
  await clock.advance(120251); limited = false;
  await album.link(newCode(), local, { create: true });
  assert.equal(album.progress.stickers.length, 26);
});

test('A late throttled response from a disconnected album cannot delay a different child', async () => {
  const api = server(), clock = syncClock();
  let release, delay = false;
  const album = new SharedAlbum({ config, storage: storage(), retryOptions: clock.options, fetcher: (...args) => delay ? new Promise(resolve => { release = () => resolve(Response.json({}, { status: 429 })); }) : api.fetcher(...args) });
  await album.link(newCode(), legacyProgress(26), { create: true });
  delay = true; const request = album.flush(); album.disconnect(); release(); await request;
  delay = false; await album.link(newCode(), freshProgress(), { create: true });
  assert.equal(album.progress.stickers.length, 0); assert.equal(album.status, 'synced');
});

test('A character adventure earns one shared sticker and ten Hebrew answers, including offline reopening on another device', async () => {
  const api = server(), code = newCode(), saved = storage();
  const safari = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  let tablet = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  await safari.link(code, legacyProgress(26), { create: true }); await tablet.link(code, freshProgress());
  api.online(false); tablet.complete('characters', 2); await tablet.flush();
  tablet = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  assert.equal(tablet.progress.stickers.length, 27); assert.equal(tablet.progress.stars, 166);
  api.online(true); await tablet.flush(); await safari.flush(); await tablet.flush();
  assert.equal(safari.progress.sessions, 27); assert.equal(safari.progress.stickers.length, 27);
  assert.equal(safari.progress.skills.hebrew.correct, 166); assert.equal(safari.progress.skills.hebrew.assisted, 2);
  assert.equal(safari.progress.missions.characters, undefined, 'Older clients need only the existing Hebrew subject');
  await tablet.flush(); await safari.flush(); assert.equal(safari.progress.sessions, 27);
});

test('Print and capitals sync independently of handwriting and lowercase, retain offline practice and preserve the album', async () => {
  const api = server(), saved = storage(), code = newCode();
  const first = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  let second = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  const old = legacyProgress(26); old.clockLessons = 35; old.letterPractice.hebrew.writing[5] = 3;
  await first.link(code, old, { create: true }); await second.link(code, freshProgress());
  first.recordWriting('hebrew', 'he-vav', 'writingMain'); await first.flush();
  api.online(false);
  second.recordWriting('english', 'en-l', 'writingMain');
  second.recordWriting('english', 'en-l');
  second.recordWriting('hebrew', 'he-vav', 'writingMain');
  await second.flush();
  second = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  assert.equal(second.progress.letterPractice.english.writingMain[11], 1);
  assert.equal(second.progress.letterPractice.english.writing[11], 1);
  api.online(true); await second.flush(); await first.flush(); await second.flush();
  for (const device of [first, second]) {
    assert.equal(device.progress.letterPractice.hebrew.writingMain[5], 2);
    assert.equal(device.progress.letterPractice.hebrew.writing[5], 3);
    assert.equal(device.progress.letterPractice.english.writingMain[11], 1);
    assert.equal(device.progress.letterPractice.english.writing[11], 1);
    assert.ok(device.progress.letterPractice.english.recognition.every(n => n === 0));
    assert.equal(device.progress.stickers.length, 26); assert.equal(device.progress.stars, 156);
    assert.equal(device.progress.clockLessons, 35);
  }
  assert.equal(suggestedLetters(second.progress.letterPractice, 'english', 'writingMain', 1, 11)[0].familiar, 'M');
  assert.throws(() => first.recordWriting('english', 'en-l', 'recognition'), /invalid_writing_mode/);
});

test('A Safari album with 26 stickers pairs to an empty Home Screen app and survives reopening', async () => {
  const api = server(), safariStore = storage(), homeStore = storage();
  let safari = new SharedAlbum({ config, storage: safariStore, fetcher: api.fetcher });
  let home = new SharedAlbum({ config, storage: homeStore, fetcher: api.fetcher });
  const original = legacyProgress(26), code = newCode();
  await safari.link(code, original, { create: true });
  await home.link(code, freshProgress());
  assert.equal(home.progress.stickers.length, 26);
  assert.equal(safari.progress.stickers.length, 26);
  assert.equal(original.sessions, 26);
  safari = new SharedAlbum({ config, storage: safariStore, fetcher: api.fetcher });
  home = new SharedAlbum({ config, storage: homeStore, fetcher: api.fetcher });
  assert.equal(home.progress.stickers.length, 26);
  assert.equal(safari.progress.stickers.length, 26);
  home.complete('math', 0);
  await home.flush(); await safari.flush();
  assert.equal(home.progress.stickers.length, 27);
  assert.equal(safari.progress.stickers.length, 27);
  assert.equal(safari.progress.stars, 166, 'The existing 26 six-step rounds keep their original 156 answers');
  assert.equal(safari.progress.skills.hebrew.correct, 156);
  assert.equal(safari.progress.skills.math.correct, 10);
  await home.flush(); await safari.flush();
  assert.equal(home.progress.sessions, 27);
  home = new SharedAlbum({ config, storage: homeStore, fetcher: api.fetcher });
  assert.equal(home.progress.stars, 166);
  assert.equal(home.progress.stickers.length, 27);
});

test('Full albums send compact counters within the real RPC payload limit', () => {
  const progress = legacyProgress(1000);
  progress.stickers = [...STICKERS];
  for (const language of Object.keys(LETTERS)) for (const mode of LETTER_MODES) progress.letterPractice[language][mode].fill(1000000);
  const body = compactContribution(progress);
  assert.ok(Buffer.byteLength(JSON.stringify(body)) < 4096);
  assert.equal(body.stickers, undefined);
  assert.equal(body.missions.hebrew, 1000);
  assert.equal(body.letterPractice.hebrew.writing[26], 1000000);
});

test('Both letter paths sync across devices and offline writing survives reopening without awarding adventures', async () => {
  const api = server(), saved = storage();
  const first = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  let second = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  const code = newCode();
  await first.link(code, freshProgress(), { create: true });
  await second.link(code, freshProgress());
  first.complete('letters', 1, { language: 'hebrew', ids: LETTERS.hebrew.slice(0, 3).map(letter => letter.id) });
  await first.flush(); await second.flush();
  assert.deepEqual(suggestedLetters(second.progress.letterPractice, 'hebrew').map(letter => letter.familiar), ['ד','ה','ו']);
  api.online(false);
  second.recordWriting('english', 'en-l');
  await second.flush();
  second = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  assert.equal(second.progress.letterPractice.english.writing[11], 1);
  assert.equal(second.progress.sessions, 1);
  assert.equal(second.pending, true);
  api.online(true);
  await second.flush(); await first.flush(); await second.flush();
  assert.equal(first.progress.letterPractice.english.writing[11], 1);
  assert.equal(first.progress.letterPractice.english.recognition[11], 0);
  assert.equal(first.progress.sessions, 1);
  assert.equal(first.progress.stickers.length, 1);
  assert.deepEqual(first.progress.letterPractice, second.progress.letterPractice);
});

test('Writing done during an in-flight upload is retained and concurrent devices add their practice once', async () => {
  const api = server();
  let pause = false, release;
  const fetcher = async (...args) => {
    const response = await api.fetcher(...args);
    if (pause) { pause = false; await new Promise(resolve => { release = resolve; }); }
    return response;
  };
  const first = new SharedAlbum({ config, storage: storage(), fetcher });
  const second = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  const code = newCode();
  await first.link(code, freshProgress(), { create: true });
  await second.link(code, freshProgress());
  pause = true;
  first.recordWriting('english', 'en-l');
  await Promise.resolve();
  first.recordWriting('hebrew', 'he-vav');
  second.recordWriting('english', 'en-l');
  await second.flush();
  release();
  await first.flush(); await first.flush(); await second.flush();
  assert.equal(second.progress.letterPractice.english.writing[11], 2);
  assert.equal(second.progress.letterPractice.hebrew.writing[5], 1);
  assert.equal(second.progress.sessions, 0);
  assert.equal(second.progress.stickers.length, 0);
});

test('Two ten-step completions made during one upload retain all twenty answers and two rewards', async () => {
  const api = server(), saved = storage();
  let pause = false, release;
  const fetcher = async (...args) => {
    const response = await api.fetcher(...args);
    if (pause) { pause = false; await new Promise(resolve => { release = resolve; }); }
    return response;
  };
  const first = new SharedAlbum({ config, storage: saved, fetcher });
  const second = new SharedAlbum({ config, storage: storage(), fetcher: api.fetcher });
  const code = newCode();
  await first.link(code, freshProgress(), { create: true });
  await second.link(code, freshProgress());
  pause = true;
  first.complete('math', 1);
  await Promise.resolve();
  first.complete('math', 2);
  assert.equal(first.progress.stars, 20);
  assert.equal(first.progress.sessions, 2);
  assert.equal(first.progress.stickers.length, 2);
  release();
  await first.flush(); await first.flush(); await second.flush();
  assert.equal(second.progress.skills.math.correct, 20);
  assert.equal(second.progress.skills.math.assisted, 3);
  assert.equal(second.progress.stickers.length, 2);
  const reopened = new SharedAlbum({ config, storage: saved, fetcher: api.fetcher });
  assert.equal(reopened.progress.stars, 20);
  assert.equal(reopened.pending, false);
});

function legacyProgress(sessions) {
  const progress = freshProgress();
  progress.sessions = sessions;
  progress.stars = sessions * 6;
  progress.missions.hebrew = sessions;
  progress.skills.hebrew.correct = sessions * 6;
  progress.stickers = [...LEGACY_STICKERS];
  return progress;
}

test('Clock lessons merge across paired devices, survive offline reopening and keep all earned stickers', async()=>{
  const api=server(),saved=storage(),code=newCode();
  const first=new SharedAlbum({config,storage:storage(),fetcher:api.fetcher});
  let second=new SharedAlbum({config,storage:saved,fetcher:api.fetcher});
  await first.link(code,legacyProgress(26),{create:true});await second.link(code,freshProgress());
  first.recordClockLesson(1);await first.flush();
  api.online(false);second.recordClockLesson(0);second.recordClockLesson(5);await second.flush();
  second=new SharedAlbum({config,storage:saved,fetcher:api.fetcher});
  assert.equal(second.progress.clockLessons,33);assert.equal(second.progress.stickers.length,26);
  api.online(true);await second.flush();await first.flush();await second.flush();
  assert.equal(first.progress.clockLessons,35);assert.equal(second.progress.clockLessons,35);
  assert.equal(first.progress.stars,156);assert.equal(first.progress.sessions,26);
  second.recordClockLesson(5);await second.flush();await first.flush();
  assert.equal(first.progress.clockLessons,35);assert.equal(first.progress.stickers.length,26);
});

test('A lesson completed during an upload is retained alongside the captured lesson', async()=>{
  const api=server();let pause=false,release;
  const fetcher=async(...args)=>{const response=await api.fetcher(...args);if(pause){pause=false;await new Promise(resolve=>{release=resolve;});}return response;};
  const first=new SharedAlbum({config,storage:storage(),fetcher}),second=new SharedAlbum({config,storage:storage(),fetcher:api.fetcher});
  const code=newCode();await first.link(code,freshProgress(),{create:true});await second.link(code,freshProgress());
  pause=true;first.recordClockLesson(0);await Promise.resolve();first.recordClockLesson(1);release();
  await first.flush();await first.flush();await second.flush();
  assert.equal(second.progress.clockLessons,3);assert.equal(second.progress.sessions,0);assert.equal(second.progress.stickers.length,0);
});

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
  assert.equal(first.progress.skills.letters.correct, 10);
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
  assert.equal(first.progress.skills.clock.correct, 10);
  assert.equal(first.progress.skills.clock.assisted, 2);
  assert.equal(first.progress.missions.hebrew, 1);
});
