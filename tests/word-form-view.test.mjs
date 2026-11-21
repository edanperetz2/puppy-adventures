import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS } from '../dist/letters.js';
import { wordFormOption } from '../dist/word-form-view.js';
import { classicReadingHeading } from '../dist/classic-reading-heading.js';

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
  const fish = { type: 'word-form', word: { language: 'hebrew', plain: 'דג', pointed: 'דָּג', clip: 'he-fish' } };
  assert.match(classicReadingHeading(fish, true).html, /^<h1\b[^>]*lang="he" dir="rtl">דָּג<\/h1>$/u);
  assert.match(classicReadingHeading(fish, false).html, /dir="rtl">דג<\/h1>$/u);
  assert.equal(classicReadingHeading(fish, false).clip, fish.word.clip);
  const cat = { type: 'word-form', word: { language: 'english', plain: 'CAT', clip: 'en-cat' } };
  assert.match(classicReadingHeading(cat, true).html, /^<h1\b[^>]*lang="en" dir="ltr">CAT<\/h1>$/u);
  assert.equal(classicReadingHeading(cat, true).clip, cat.word.clip);
  assert.match(wordFormOption(cat.word, 'english'), /dir="ltr">cat</u);
});
