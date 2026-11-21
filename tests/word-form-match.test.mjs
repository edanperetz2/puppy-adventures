import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIPS } from '../dist/content.js';
import { LETTERS } from '../dist/letters.js';
import { seeded } from '../dist/journey.js';
import { makeWordFormQuestions, restoreWordFormQuestion, WORD_FORM_WORDS } from '../dist/word-form-match.js';

test('the whole-word models agree letter for letter with the approved recordings and handwriting alphabet', () => {
  for (const [language, words] of Object.entries(WORD_FORM_WORDS)) {
    const alphabet = new Set(LETTERS[language].map(letter => letter.familiar));
    assert.ok(words.length >= 90);
    assert.equal(new Set(words.map(word => word.id)).size, words.length);
    assert.equal(new Set(words.map(word => word.plain)).size, words.length);
    for (const word of words) {
      assert.ok([...word.plain].every(letter => alphabet.has(letter)), word.plain);
      assert.equal(word.pointed.replace(/\p{M}/gu, ''), word.plain);
      const clip = CLIPS[word.clip];
      assert.equal(clip.lang, language === 'english' ? 'en-US' : 'he-IL');
      const spokenWord = clip.text.replace(/\p{M}/gu, '').replace(/[.?!]$/u, '').toUpperCase();
      assert.equal(spokenWord, word.plain);
      if (language === 'english') assert.match(word.plain, /^[A-Z]+$/u);
      else {
        assert.match(word.pointed, /\p{M}/u);
        assert.doesNotMatch(word.plain.slice(0,-1), /[ךםןףץ]/u);
      }
    }
  }
});

test('whole-word rounds progress from familiar shapes to single-letter differences and rotate through each language', () => {
  for (const [language, words] of Object.entries(WORD_FORM_WORDS)) {
    const all = new Set(), slots = Array.from({ length: 6 }, () => new Set());
    let recent = [], previous = [];
    for (let round = 0; round < words.length; round++) {
      const questions = makeWordFormQuestions(language, recent, seeded(round));
      const ids = questions.map(q => q.answer);
      assert.equal(new Set(ids).size, 6);
      assert.equal(questions.length, 6);
      assert.ok(ids.every(id => !previous.includes(id)));
      if (language === 'hebrew') assert.ok(questions.some(q => /[ךםןףץ]$/u.test(q.word.plain)));
      for (const [index, q] of questions.entries()) {
        all.add(q.answer);
        assert.equal(q.word.id, q.answer);
        assert.equal(q.type, 'word-form');
        assert.equal(q.prompt, `word-form-${language}`);
        assert.equal(q.hint, `word-form-${language}-hint`);
        assert.equal(q.targetClip, undefined);
        const options = q.options.map(word => word.plain);
        assert.equal(q.options.length, index < 2 ? 2 : 3);
        assert.equal(new Set(options).size, options.length);
        assert.ok(q.options.every(word => word.language === language));
        const position = options.indexOf(q.word.plain);
        assert.ok(position >= 0);
        slots[index].add(position);
        if (index < 2) {
          assert.ok(options.every(word => word.length <= 3));
          assert.notEqual(options[0][0], options[1][0]);
        }
        if (index >= 4) {
          const clue = q.word.plain;
          assert.ok(options.every(word => word.length === clue.length));
          assert.ok(options.some(word => word[0] === clue[0] && [...word].filter((ch, i) => ch !== clue[i]).length === 1));
        }
      }
      recent = [...recent.filter(id => !ids.includes(id)), ...ids];
      previous = ids;
    }
    assert.equal(all.size, words.length);
    assert.deepEqual(slots.map(set => set.size), [2, 2, 3, 3, 3, 3]);
  }
});

test('word-form drafts restore the exact target and answer positions and reject invalid choices', () => {
  for (const language of ['english', 'hebrew']) {
    const questions = makeWordFormQuestions(language, [], seeded(41));
    for (const [index, q] of questions.entries()) {
      const raw = { type: q.type, word: q.answer, options: q.options.map(word => word.id) };
      const restore = change => restoreWordFormQuestion(language, { ...raw, ...change }, index);
      assert.deepEqual(restore({}), q);
      assert.deepEqual(restore({ options: [...raw.options].reverse() }).options, [...q.options].reverse());
      assert.equal(restore({ word: 'missing-word' }), null);
      assert.equal(restore({ options: [q.answer, q.answer] }), null);
      assert.equal(restore({ options: [q.answer, 'missing-word'] }), null);
      assert.equal(restore({ type: 'read' }), null);
      assert.equal(restoreWordFormQuestion('__proto__', raw, index), null);
      assert.equal(restoreWordFormQuestion(language, raw, 6), null);
    }
  }
});
