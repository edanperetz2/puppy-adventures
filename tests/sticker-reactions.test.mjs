import test from 'node:test';
import assert from 'node:assert/strict';
import { STICKERS, STICKER_MOTIFS, stickerDefinition } from '../dist/stickers.js';
import { stickerReactions } from '../dist/sticker-reactions.js';
import { art } from '../dist/art.js';

test('every earned picture has a response and a Hebrew caption in both spelling settings', () => {
  assert.deepEqual(Object.keys(stickerReactions).sort(), STICKER_MOTIFS.map(([id]) => id).sort());
  for (const id of STICKERS) {
    const { motif } = stickerDefinition(id);
    const reaction = stickerReactions[motif];
    assert.ok(reaction.motion);
    assert.match(reaction.caption, /[\u05b0-\u05bc]/u);
    assert.match(reaction.plain, /^[א-ת !]+$/u);
  }
  assert.equal(stickerReactions.dog.sound, 'bark');
  assert.equal(stickerReactions.cat.sound, 'meow');
  assert.equal(stickerReactions.bird.sound, 'tweet');
  assert.equal(stickerReactions.sun.motion, 'shine');
  assert.equal(stickerReactions.bird.plain, 'הציפור עפה ומצייצת!');
});

test('themed stickers retain one independently movable foreground within their static frame', () => {
  for (const id of STICKERS) {
    const { original, motif } = stickerDefinition(id);
    const drawing = art(id);
    if (original) assert.doesNotMatch(drawing, /class="sticker-subject"/u);
    else {
      assert.equal(drawing.match(/class="sticker-subject"/gu)?.length, 1);
      assert.ok(drawing.includes('<clipPath'));
      assert.equal(drawing.includes('class="sticker-slide-rider"'), motif === 'slide');
    }
  }
  assert.ok(art('bird').includes('class="sticker-wing"'));
  assert.ok(art('sticker-0014').includes('class="sticker-wing"'));
});
