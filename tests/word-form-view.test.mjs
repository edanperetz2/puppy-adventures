import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS } from '../dist/letters.js';
import { wordFormOption, wordFormPrompt } from '../dist/word-form-view.js';

test('a handwritten word draws the taught strokes from right to left, including each final form', () => {
  for (const plain of ['דרך', 'ים', 'גן', 'כף', 'קיץ', 'פרפר']) {
    const html = wordFormOption({ plain }, 'hebrew');
    const groups = [...html.matchAll(/<g transform="translate\((-?\d+) 0\)">([\s\S]*?)<\/g>/gu)];
    assert.equal(groups.length, plain.length);
    assert.ok(html.includes(`aria-label="${plain}"`));
    for (const [index, group] of groups.entries()) {
      if (index > 0) assert.ok(Number(groups[index - 1][1]) > Number(group[1]), plain);
      const strokes = [...group[2].matchAll(/<path d="([^"]+)"/gu)].map(match => match[1]);
      assert.deepEqual(strokes, LETTERS.hebrew.find(letter => letter.familiar === plain[index]).strokes);
    }
  }
});

test('the print prompt respects Hebrew vowel marks and English keeps uppercase and lowercase separate', () => {
  const fish = { plain: 'דג', pointed: 'דָּג' };
  assert.match(wordFormPrompt(fish, 'hebrew', true), /dir="rtl">דָּג</u);
  assert.match(wordFormPrompt(fish, 'hebrew', false), /dir="rtl">דג</u);
  const cat = { plain: 'CAT' };
  assert.match(wordFormPrompt(cat, 'english', true), /dir="ltr">CAT</u);
  assert.match(wordFormOption(cat, 'english'), /dir="ltr">cat</u);
});
