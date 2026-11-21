import test from 'node:test';
import assert from 'node:assert/strict';
import { albumSticker, createStickerPlayer, rewardSticker } from '../dist/playable-stickers.js';
import { stickerPage } from '../dist/stickers.js';

test('only collected entries and actual rewards become sticker buttons', () => {
  const page = stickerPage(['flower'], 0);
  assert.match(albumSticker(page.entries[0]), /<button[^>]+data-action="sticker-play" data-sticker="flower"/);
  const locked = albumSticker(page.entries[1]);
  assert.match(locked, /class="sticker locked" role="img"/);
  assert.doesNotMatch(locked, /<button|data-action|tabindex/);
  assert.match(rewardSticker('sticker-0014', 'star', 'reward-art'), /data-sticker="sticker-0014" data-motion="fly"/);
  assert.doesNotMatch(rewardSticker(null, 'star', 'reward-art'), /<button|data-sticker/);
});

function tile(sticker) {
  const caption = { textContent: '' };
  const classes = new Set();
  return {
    dataset: { sticker }, caption, classes, querySelector: () => caption,
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
  };
}

test('repeated taps restart one effect and clearing it leaves later narration alone', t => {
  const previous = globalThis.document;
  globalThis.document = { baseURI: 'https://example.org/game/' };
  const status = { textContent: '' }, plays = [], pauses = [];
  const audio = {
    src: '', play() { plays.push(this.src); return Promise.resolve(); }, pause() { pauses.push(this.src); },
  };
  let interrupts = 0;
  const player = createStickerPlayer({ audio, status, interrupt: () => { interrupts++; } });
  t.after(() => {
    player.stop();
    if (previous === undefined) delete globalThis.document;
    else globalThis.document = previous;
  });
  const dog = tile('dog'), cat = tile('cat');
  const settings = { nikud: true, sound: true };
  player.play(dog, settings);
  player.play(dog, settings);
  player.play(cat, settings);
  assert.equal(interrupts, 3);
  assert.deepEqual(plays.map(s => new URL(s).pathname), ['/game/assets/sticker-bark.wav', '/game/assets/sticker-bark.wav', '/game/assets/sticker-meow.wav']);
  assert.deepEqual(pauses, plays.slice(0, 2));
  assert.equal(dog.classes.size, 0);
  assert.equal(dog.caption.textContent, '');
  assert.ok(cat.classes.has('is-reacting'));
  assert.equal(status.textContent, cat.caption.textContent);
  audio.src = 'https://example.org/game/assets/audio/welcome.mp3';
  player.stop();
  assert.equal(pauses.length, 2);
  player.play(cat, { nikud: false, sound: false });
  assert.equal(interrupts, 3);
  assert.equal(plays.length, 3);
  assert.equal(cat.caption.textContent, 'החתול מיילל!');
  player.stop();
  assert.equal(status.textContent, '');
  assert.equal(cat.classes.size, 0);
});
