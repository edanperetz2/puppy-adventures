import test from 'node:test';
import assert from 'node:assert/strict';
import { ChildProfiles, PROFILE_KEY, GAME_KEY, FAMILY_KEY, LEGACY_PROFILE_ID, cleanName, recordingData, readInvitation, invitationNeedsNewProfile, invitationLink, escapeHtml } from '../dist/profiles.js';
import { CLIPS } from '../dist/content.js';
import { profileSpeech } from '../dist/profile-speech.js';
import { findVoiceName, addressText } from '../dist/profile-content.js';
import { MALE_CLIPS } from '../dist/profile-content.js?v=2.2.0-voices';
import { freshProgress, finishSession } from '../dist/engine.js';
import { SharedAlbum, newCode } from '../dist/sync.js';
import { Narrator } from '../dist/audio.js';
import { GameAnnouncements } from '../dist/announcements.js';

function storage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return { map, getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value), removeItem: key => map.delete(key) };
}
function legacySave() {
  let progress = freshProgress();
  for (let i = 0; i < 26; i++) progress = finishSession(progress, 'hebrew', i % 3).progress;
  progress.clockLessons = 7;
  progress.letterPractice.hebrew.writingMain[0] = 3;
  return JSON.stringify({ settings: { nikud: true, reading: 'sentences' }, progress, readingPractice: { recent: { short: ['fish'] } }, preserveUnknownField: 'legacy-data' });
}
const ariel = { name: 'אריאל', voice: 'ariel', address: 'female' };
const yuli = { name: 'יולי', address: 'female' };
const dvir = { name: 'דביר', address: 'male' };
const recorded = 'data:audio/webm;codecs=opus;base64,TmFtZQ==';

test('The upgrade keeps Ariel’s 26 stickers, letter practice, settings and pairing byte-for-byte', () => {
  const code = newCode(), before = legacySave();
  const family = JSON.stringify({ code, device: crypto.randomUUID(), own: freshProgress(), remote: JSON.parse(before).progress, confirmed: freshProgress() });
  const saved = storage({ [GAME_KEY]: before, [FAMILY_KEY]: family });
  const profiles = new ChildProfiles(saved);
  assert.equal(profiles.active.id, LEGACY_PROFILE_ID);
  assert.equal(saved.getItem(GAME_KEY), before);
  assert.equal(saved.getItem(FAMILY_KEY), family);
  const child = profiles.add(yuli);
  const childStore = profiles.storageFor(child.id);
  assert.equal(childStore.getItem(GAME_KEY), null);
  assert.equal(childStore.getItem(FAMILY_KEY), null);
  childStore.setItem(GAME_KEY, JSON.stringify({ progress: finishSession(freshProgress(), 'math').progress }));
  childStore.setItem(FAMILY_KEY, JSON.stringify({ code: newCode() }));
  profiles.select(LEGACY_PROFILE_ID);
  assert.equal(saved.getItem(GAME_KEY), before);
  assert.equal(saved.getItem(FAMILY_KEY), family);
  const reloaded = new ChildProfiles(saved);
  assert.equal(reloaded.active.id, LEGACY_PROFILE_ID);
  assert.equal(JSON.parse(reloaded.storageFor().getItem(GAME_KEY)).progress.stickers.length, 26);
  assert.equal(JSON.parse(reloaded.storageFor(child.id).getItem(GAME_KEY)).progress.sessions, 1);
});

test('New visitors choose their own name; duplicate names have separate identities and audio', () => {
  const saved = storage(), profiles = new ChildProfiles(saved);
  assert.equal(profiles.active, null);
  assert.equal(saved.getItem(GAME_KEY), null);
  const first = profiles.add(yuli, recorded), second = profiles.add(yuli);
  assert.notEqual(first.id, second.id);
  assert.equal(profiles.storageFor(first.id).getItem('name-recording'), recorded);
  assert.equal(profiles.storageFor(second.id).getItem('name-recording'), null);
  assert.equal(saved.getItem(GAME_KEY), null);
  profiles.update(first.id, { name: 'Yuli', voice: 'yuli' }, null);
  assert.equal(profiles.storageFor(first.id).getItem('name-recording'), null);
  assert.equal(new ChildProfiles(saved).profiles.length, 2);
  assert.throws(() => profiles.storageFor('../../ariel'), /unknown_profile/);
  assert.throws(() => profiles.storageFor(first.id).setItem(PROFILE_KEY, 'bad'), /unknown_profile_key/);
});

test('A damaged profile index still exposes Ariel’s untouched original save and pairing', () => {
  const original = legacySave(), family = JSON.stringify({ code: newCode() });
  const saved = storage({ [PROFILE_KEY]: '{broken', [GAME_KEY]: original, [FAMILY_KEY]: family });
  const profiles = new ChildProfiles(saved);
  assert.equal(profiles.active.id, LEGACY_PROFILE_ID);
  assert.equal(profiles.storageFor().getItem(GAME_KEY), original);
  assert.equal(profiles.storageFor().getItem(FAMILY_KEY), family);
  assert.equal(JSON.parse(saved.getItem(PROFILE_KEY)).profiles[0].name, 'אריאל');
});

test('Failed profile or recording saves leave the previous active child and legacy data intact', () => {
  const saved = storage({ [GAME_KEY]: legacySave() }), profiles = new ChildProfiles(saved);
  const before = saved.getItem(GAME_KEY), registry = saved.getItem(PROFILE_KEY), set = saved.setItem;
  saved.setItem = (key, value) => { if (key === PROFILE_KEY) throw new Error('full'); set(key, value); };
  assert.throws(() => profiles.add(dvir, recorded), /storage_unavailable/);
  assert.equal(profiles.active.id, LEGACY_PROFILE_ID);
  assert.equal(saved.getItem(GAME_KEY), before);
  assert.equal(saved.getItem(PROFILE_KEY), registry);
  assert.equal([...saved.map.keys()].filter(key => key.startsWith('puppy-child-')).length, 0);
  assert.throws(() => profiles.update(LEGACY_PROFILE_ID, { name: 'אריאלה' }, recorded), /storage_unavailable/);
  assert.equal(profiles.active.name, 'אריאל');
  assert.equal(profiles.storageFor().getItem('name-recording'), null);
});

test('Names and recording sources cannot inject markup, external audio or an album capability', () => {
  for (const name of ['יולי', 'Yuli', 'דְּבִיר', 'לי-ים', 'אן מארי', 'אריאלה']) assert.ok(cleanName(name));
  for (const name of ['<img src=x>', 'Ariel<script>', 'a'.repeat(31), 'יולי\u202e', 'https://bad.example', '', null]) assert.equal(cleanName(name), null);
  assert.equal(recordingData(recorded), recorded);
  for (const value of ['https://bad.example/name.mp3', 'data:text/html;base64,SGk=', 'data:audio/svg+xml;base64,SGk=', 'data:audio/mp4;base64,' + 'a'.repeat(700000)]) assert.equal(recordingData(value), null);
  assert.equal(escapeHtml('<"יולי">'), '&lt;&quot;יולי&quot;&gt;');
});

test('Pairing links carry only a fragment and resolve an already connected album without renaming a child', () => {
  const saved = storage({ [GAME_KEY]: legacySave() }), profiles = new ChildProfiles(saved), code = newCode();
  const first = profiles.add(dvir);
  profiles.storageFor(first.id).setItem(FAMILY_KEY, JSON.stringify({ code }));
  profiles.select(LEGACY_PROFILE_ID);
  const url = new URL(invitationLink('https://game.example', '/', code, first));
  assert.equal(url.search, '');
  assert.equal(url.pathname, '/');
  const invitation = readInvitation(url.hash);
  assert.equal(invitation.name, 'דביר');
  assert.equal(invitation.address, 'male');
  assert.equal(profiles.findAlbum(invitation.code).id, first.id);
  assert.equal(profiles.active.id, LEGACY_PROFILE_ID);
  assert.equal(profiles.findAlbum(newCode()), null);
  assert.equal(readInvitation('#album=short'), null);
  const unknown = readInvitation(`#album=${newCode()}&child=Yuli&profile=ariel-legacy`);
  assert.equal(invitationNeedsNewProfile(profiles, unknown), true, 'A URL cannot nominate Ariel as the upload source');
  const newChild = profiles.add({ ...yuli, pendingAlbum: unknown.code });
  assert.equal(invitationNeedsNewProfile(profiles, unknown), false);
  profiles.storageFor(newChild.id).setItem(FAMILY_KEY, JSON.stringify({ code: newCode() }));
  assert.equal(invitationNeedsNewProfile(profiles, unknown), true, 'A stale pending invitation cannot replace a later album connection');
  profiles.select(LEGACY_PROFILE_ID);
  assert.equal(invitationNeedsNewProfile(profiles, unknown), true);
  assert.notEqual(newChild.id, LEGACY_PROFILE_ID);
});

test('An old child’s upload in flight stays in that child’s namespace after another child is selected', async () => {
  const saved = storage({ [GAME_KEY]: legacySave() }), profiles = new ChildProfiles(saved);
  const oldStore = profiles.storageFor(), code = newCode();
  let release, delayed = false, uploaded = false;
  const fetcher = async (_url, request) => {
    const payload = JSON.parse(request.body);
    assert.equal(payload.access_code, code);
    const answer = { version: 1, ...freshProgress(), ...JSON.parse(legacySave()).progress };
    if (delayed || uploaded) { answer.missions.math = 1; answer.sessions++; answer.skills.math.correct = 10; }
    if (delayed) { delayed = false; uploaded = true; await new Promise(resolve => { release = resolve; }); }
    return Response.json(answer);
  };
  const album = new SharedAlbum({ config: { url: 'https://test.example', key: 'public-test' }, storage: oldStore, fetcher });
  await album.link(code, freshProgress(), { create: true });
  delayed = true;
  album.complete('math', 0);
  const pending = album.flush();
  const next = profiles.add(yuli), nextStore = profiles.storageFor(next.id);
  nextStore.setItem(GAME_KEY, JSON.stringify({ progress: freshProgress() }));
  release(); await pending;
  assert.equal(JSON.parse(oldStore.getItem(FAMILY_KEY)).code, code);
  assert.equal(album.progress.sessions, 27);
  assert.equal(nextStore.getItem(FAMILY_KEY), null);
  assert.equal(JSON.parse(nextStore.getItem(GAME_KEY)).progress.sessions, 0);
  assert.equal(JSON.parse(saved.getItem(GAME_KEY)).progress.sessions, 26);
});

test('Ava names and all gendered instructions resolve without changing reading targets or Ariel’s voice', () => {
  assert.equal(findVoiceName('Yuli').id, 'yuli');
  assert.equal(findVoiceName('דְּבִיר').id, 'dvir');
  const boy = profileSpeech({ ...dvir, voice: 'dvir' }), girl = profileSpeech({ ...yuli, voice: 'yuli' });
  assert.deepEqual(boy('welcome'), ['profile-welcome-male-dvir']);
  assert.deepEqual(girl('welcome'), ['profile-welcome-female-yuli']);
  assert.deepEqual(boy('good-luck'), ['profile-good-luck-dvir']);
  assert.deepEqual(girl('good-luck'), ['profile-good-luck-yuli']);
  for (const key of ['welcome', 'try-again', 'correct-2', 'school-finish']) for (const resolve of [boy, girl]) {
    for (const clip of resolve(key)) assert.doesNotMatch(CLIPS[clip].speech, /ʔaʁiʔˈel/u);
    assert.deepEqual(profileSpeech(ariel)(key), [key]);
  }
  assert.match(CLIPS[boy('correct-1')[0]].speech, /hitslˈaχta/u);
  assert.match(CLIPS[boy('letters-trace')[0]].speech, /toʁχˈa/u);
  assert.match(CLIPS[boy('school-final')[0]].speech, /ʔatˈa.*makˈiʁ/u);
  for (const key of ['he-action-cat-sleep', 'number-2', 'clock-time-3-45', 'letter-he-alef']) assert.deepEqual(boy(key), [key]);
  assert.ok(Object.keys(MALE_CLIPS).length >= 55);
  assert.equal(addressText('בואי נשחק. בחרי אות. את כבר מכירה.', 'male'), 'בוא נשחק. בחר אות. אתה כבר מכיר.');
  assert.equal(addressText('לִחְצִי עַל הַכַּפְתּוֹר', 'male'), 'לחץ עַל הַכַּפְתּוֹר');
  assert.equal(addressText('מקשיבות ומגלות, סופרות ומחברות, מתחילות ומתקדמות', 'male'),'מקשיבים ומגלים, סופרים ומחברים, מתחילים ומתקדמים');
});

test('A custom voice plays whole local phrases and never splices in an older raw recording', async () => {
  const original = { Audio: globalThis.Audio, window: globalThis.window }, requests = [];
  try {
    globalThis.window = {};
    globalThis.Audio = class {
      pause() {}
      play() { requests.push(this.src); queueMicrotask(() => this.onended?.()); return Promise.resolve(); }
    };
    const narrator = new Narrator();
    const child = { name: 'שם חדש', address: 'male' };
    assert.deepEqual(profileSpeech(child, recorded)('welcome'), ['profile-welcome-male']);
    assert.deepEqual(profileSpeech(child, { welcome: 'https://other.example/welcome.wav' })('welcome'), ['profile-welcome-male']);
    narrator.resolveKey = profileSpeech(child, { welcome: 'blob:welcome', goodLuck: 'blob:good-luck' });
    const announcements = new GameAnnouncements(narrator);
    assert.equal(await announcements.start(), true);
    assert.equal(announcements.welcomePending, false);
    assert.equal(await announcements.say(['good-luck', 'read']), true);
    assert.deepEqual(requests, ['blob:welcome', 'blob:good-luck', './assets/audio/address-male-read.mp3']);
  } finally {
    for (const [key, value] of Object.entries(original)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; }
  }
});
