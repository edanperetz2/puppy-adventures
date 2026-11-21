import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { hasArt } from '../dist/art.js';
import { WORDS } from '../dist/content.js';
import { openStitchRound, PIKACHU_CALL_URL, pikachuQuestions, stitchQuestions } from '../dist/pikachu-game.js';
import { FAMILY_KEY, GAME_KEY, openAriel, STITCH_KEY } from '../dist/profiles.js';

const readingWords = new Map(WORDS.map(word => [word.id, word.pointed]));

function seeded(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test('Pikachu has six varied picture clues that progress from objects to details', () => {
  const correctSlots = Array.from({ length: 6 }, () => new Set());
  const seen = new Set();
  for (let seed = 1; seed <= 60; seed++) {
    const questions = pikachuQuestions(seeded(seed));
    assert.deepEqual(questions.map(q => q.choices.length), [2, 2, 3, 3, 3, 3]);
    assert.deepEqual(questions.map(q => q.animal), [false, false, true, false, false, false]);
    assert.ok(questions[2].choices.every(id => ['rabbit', 'frog', 'duck', 'dog', 'cat', 'bird'].includes(id)));
    assert.equal(new Set(questions.map(q => q.target)).size, 6);
    for (const [index, { target, choices }] of questions.entries()) {
      assert.equal(new Set(choices).size, choices.length);
      assert.ok(choices.includes(target));
      for (const id of choices) {
        assert.ok(hasArt(id), id);
        assert.ok(readingWords.get(id), id);
      }
      correctSlots[index].add(choices.indexOf(target));
      seen.add(target);
    }
    assert.ok(questions[3].choices.every(id => id.startsWith(questions[3].target.replace(/[^-]+$/u, ''))));
    assert.ok(questions[4].choices.every(id => id.startsWith(questions[4].target.replace(/[^-]+$/u, ''))));
    assert.ok(questions[5].choices.every(id => id.startsWith(questions[5].target.replace(/[^-]+$/u, ''))));
    const newRound = pikachuQuestions(seeded(seed), questions);
    assert.ok(newRound.every(q => questions.every(old => old.target !== q.target)));
  }
  assert.ok(correctSlots.every(set => set.size > 1));
  assert.ok(seen.size > 30);
});

test('The gentle Pikachu greeting replaces the Game Boy sound for offline play', async () => {
  const offline = JSON.parse(await readFile(new URL('../dist/offline.json', import.meta.url), 'utf8'));
  assert.ok(offline.includes('./assets/audio/pikachu-greeting.mp3'));
  assert.ok(!offline.includes('./assets/audio/pikachu-call.mp3'));
  const bytes = await readFile(PIKACHU_CALL_URL);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), '4894d1325344bcc37467a48b2a42e43498593ed09a07c14e1c8b5572a139af9a');
});

test('Stitch starts with clear beach pictures and builds to a color, a quantity and a position', () => {
  const slots = Array.from({ length: 6 }, () => new Set());
  const seen = new Set();
  for (let seed = 1; seed < 100; seed++) {
    const questions = stitchQuestions(seeded(seed));
    assert.equal(new Set(questions.map(q => q.target)).size, 6);
    assert.deepEqual(questions.map(q => q.choices.length), [2, 2, 3, 3, 3, 3]);
    assert.ok(questions.every(q => !q.animal), 'Six matching steps with no extra gestures required');
    for (const [i, { target, choices }] of questions.entries()) {
      seen.add(target);
      slots[i].add(choices.indexOf(target));
      assert.ok(choices.includes(target));
      assert.equal(new Set(choices).size, choices.length);
      assert.ok(choices.every(id => hasArt(id) && readingWords.has(id)));
      if (i >= 3) assert.ok(choices.every(id => id.startsWith(target.slice(0, target.lastIndexOf('-') + 1))));
    }
    assert.match(questions[3].target, /^color-/);
    assert.match(questions[4].target, /^count-/);
    assert.match(questions[5].target, /^place-/);
    const next = stitchQuestions(seeded(seed), questions);
    assert.ok(next.every(q => questions.every(old => q.target !== old.target)));
  }
  assert.ok(slots.every(set => set.size > 1));
  assert.ok(seen.size > 40);
});

test('Stitch can return to a solved clue and replay a new round without touching the album or the Pikachu game', () => {
  const keys = new Map([[GAME_KEY, '{"progress":{"stickers":["star"]}}'], [FAMILY_KEY, '{"code":"fixture"}']]);
  const storage = openAriel({
    getItem: key => keys.get(key) ?? null,
    setItem: (key, value) => keys.set(key, value),
    removeItem: key => keys.delete(key),
  });
  const original = new Map(keys);
  const first = openStitchRound(storage);
  first.save(3, true);
  pikachuQuestions(seeded(5));
  const resumed = openStitchRound(storage);
  assert.deepEqual(resumed.questions, first.questions);
  assert.equal(resumed.index, 3);
  assert.equal(resumed.solved, true);
  resumed.save(6, false);
  const fresh = openStitchRound(storage);
  assert.equal(fresh.index, 0);
  assert.equal(fresh.solved, false);
  assert.ok(fresh.questions.every(q => first.questions.every(old => q.target !== old.target)));
  assert.deepEqual(new Map([...keys].filter(([key]) => key !== STITCH_KEY)), original);
  storage.setItem(STITCH_KEY, '{"seed":-1,"index":99}');
  assert.equal(openStitchRound(storage).index, 0);
});
