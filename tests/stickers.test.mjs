import test from 'node:test';
import assert from 'node:assert/strict';
import { STICKERS, LEGACY_STICKERS, STICKER_MOTIFS, STICKER_THEMES, stickerDefinition, stickerPage } from '../dist/stickers.js';
import { art, hasArt } from '../dist/art.js';
import { freshProgress, finishSession, sanitizeProgress } from '../dist/engine.js';

function oldAlbum(sessions) {
  const progress = freshProgress();
  progress.sessions = sessions;
  progress.stars = sessions * 6;
  progress.missions.hebrew = sessions;
  progress.skills.hebrew.correct = sessions * 6;
  progress.stickers = LEGACY_STICKERS.slice(0, sessions);
  return progress;
}

test('One thousand stable rewards retain the original twelve IDs and add distinct illustrated scenes', () => {
  assert.equal(STICKERS.length, 1000);
  assert.equal(new Set(STICKERS).size, 1000);
  assert.deepEqual(STICKERS.slice(0, 12), ['flower', 'boat', 'star', 'dog', 'butterfly', 'rocket', 'rainbow', 'ball', 'cat', 'sun', 'house', 'heart']);
  assert.equal(STICKERS[12], 'sticker-0013');
  assert.equal(STICKERS.at(-1), 'sticker-1000');
  assert.equal(STICKER_MOTIFS.length, 50);
  assert.equal(STICKER_THEMES.length, 20);
  assert.ok(STICKER_MOTIFS.every(([id]) => hasArt(id)));
  const drawings = STICKERS.map(id => {
    assert.ok(hasArt(id), id);
    assert.ok(stickerDefinition(id)?.name, id);
    const drawing = art(id);
    assert.match(drawing, /^<svg\b/);
    assert.doesNotMatch(drawing, /undefined|NaN/);
    return drawing;
  });
  assert.equal(new Set(drawings).size, 1000);
  for (const id of LEGACY_STICKERS) assert.doesNotMatch(art(id), /sticker-scene/);
  for (const invalid of ['__proto__', '<script>', 'sticker-0001', 'sticker-1001', null]) assert.equal(stickerDefinition(invalid), null);
});

test('Older capped albums receive rewards for past completions without losing collected stickers or totals', () => {
  const old = oldAlbum(17);
  const upgraded = sanitizeProgress(JSON.parse(JSON.stringify(old)));
  assert.deepEqual(upgraded.stickers, STICKERS.slice(0, 17));
  assert.equal(old.stickers.length, 12);
  assert.equal(upgraded.sessions, 17);
  assert.deepEqual(upgraded.skills, old.skills);
  const next = finishSession(upgraded, 'math', 1);
  assert.equal(next.sticker, STICKERS[17]);
  assert.equal(next.progress.stickers.length, 18);
  assert.equal(next.progress.missions.hebrew, 17);
  assert.equal(next.progress.missions.math, 1);
  assert.deepEqual(sanitizeProgress(next.progress), next.progress);
});

test('The last sticker unlocks once and further adventures continue recording progress', () => {
  const last = finishSession(oldAlbum(999), 'clock');
  assert.equal(last.sticker, 'sticker-1000');
  assert.equal(last.progress.stickers.length, 1000);
  const again = finishSession(last.progress, 'letters');
  assert.equal(again.sticker, null);
  assert.equal(again.progress.sessions, 1001);
  assert.equal(again.progress.stickers.length, 1000);
  assert.deepEqual(again.progress.stickers, STICKERS);
});

test('Album pages cover all rewards with twenty slots, safe boundaries and a latest-sticker shortcut', () => {
  const pages = Array.from({ length: 50 }, (_, index) => stickerPage(STICKERS, index));
  assert.deepEqual(pages.flatMap(page => page.entries.map(entry => entry.id)), STICKERS);
  for (const page of pages) {
    assert.equal(page.entries.length, 20);
    assert.equal(page.pageCount, 50);
    assert.ok(page.entries.every(entry => entry.unlocked));
  }
  assert.equal(stickerPage([], null).index, 0);
  assert.equal(stickerPage(STICKERS.slice(0, 20), null).index, 0);
  assert.equal(stickerPage(STICKERS.slice(0, 21), null).index, 1);
  assert.equal(stickerPage(STICKERS, null).index, 49);
  assert.equal(stickerPage([], -99).index, 0);
  assert.equal(stickerPage([], 1000).index, 49);
  assert.equal(stickerPage([], 'wrong').index, 0);
  const partial = stickerPage([...STICKERS.slice(0, 23), 'bad', STICKERS[0]], null);
  assert.equal(partial.collected, 23);
  assert.deepEqual(partial.entries.filter(entry => entry.unlocked).map(entry => entry.number), [21, 22, 23]);
  assert.deepEqual(stickerPage(['bad'], 49).entries.map(entry => entry.number), Array.from({ length: 20 }, (_, n) => n + 981));
});
