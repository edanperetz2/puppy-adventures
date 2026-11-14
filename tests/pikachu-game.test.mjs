import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { hasArt } from '../dist/art.js';
import { WORDS } from '../dist/content.js';
import { PIKACHU_CALL_URL, pikachuQuestions } from '../dist/pikachu-game.js';

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

test('The Pokémon Yellow character sound is bundled for offline play', async () => {
  const offline = JSON.parse(await readFile(new URL('../dist/offline.json', import.meta.url), 'utf8'));
  assert.ok(offline.includes('./assets/audio/pikachu-call.mp3'));
  const bytes = await readFile(PIKACHU_CALL_URL);
  assert.equal(createHash('sha256').update(bytes).digest('hex'), '93489c8e64b379282340f486c80c704efb65ae9fd4dc97fcf3cbf41de1aad347');
});
