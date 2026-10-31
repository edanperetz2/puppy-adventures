import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS, WRITING_FORMS, writingLetter, writingMode, writingPositionKey, letterShape } from '../dist/letters.js';
import { MAIN_LETTER_STROKES } from '../dist/letter-main-forms.js';
import { CLIPS } from '../dist/content.js';
import { freshProgress, sanitizeProgress, sanitizeSettings } from '../dist/engine.js';
import { LETTER_MODES, recordLetters, practicedLetterCount, suggestedLetters, pendingLetterPractice } from '../dist/letter-progress.js';

test('All 53 familiar forms have ordered writing models, matching demos, and the existing recorded names', () => {
  for (const [language, letters] of Object.entries(LETTERS)) {
    assert.equal(MAIN_LETTER_STROKES[language].length, letters.length);
    assert.equal(new Set(MAIN_LETTER_STROKES[language].map(strokes => strokes.join('|'))).size, letters.length);
    for (const [index, familiar] of letters.entries()) {
      const main = writingLetter(language, index, 'main');
      assert.equal(main.id, familiar.id); assert.equal(main.clip, familiar.clip);
      assert.ok(CLIPS[main.clip]); assert.notDeepEqual(main.strokes, familiar.strokes);
      assert.ok(main.strokes.length >= 1 && main.strokes.length <= 4);
      const pad = letterShape(main, { guide: true, pad: true }), model = letterShape(main);
      assert.equal((pad.match(/data-stroke=/gu) || []).length, main.strokes.length);
      assert.match(pad, /data-letter-form="main"/u);
      assert.match(pad, language === 'hebrew' ? /lang="he" dir="rtl"/u : /lang="en" dir="ltr"/u);
      assert.match(model, language === 'hebrew' ? /בדפוס/u : /הגדולה/u);
      assert.doesNotMatch(pad, /clipPath|clip-path|<text[^>]*>[A-Za-zא-ת]/u);
      for (const d of main.strokes) {
        assert.match(d, /^M\d+ \d+/u);
        assert.equal((d.match(/M/gu) || []).length, 1, 'A numbered stroke must never teleport to a detached part');
        assert.ok(model.includes(`d="${d}"`) && pad.includes(`d="${d}"`));
        for (const n of d.match(/\d+/gu).map(Number)) assert.ok(n >= 30 && n <= 225, `${main.id}: every stroke fits within the pad`);
      }
      assert.equal(writingLetter(language, index), familiar, 'Existing recognition and alternate models stay identical');
    }
  }
});

test('Print landmarks distinguish easily confused Hebrew letters and keep final tails below the line', () => {
  const form = char => writingLetter('hebrew', LETTERS.hebrew.findIndex(l => l.familiar === char), 'main');
  assert.equal(form('א').strokes.length, 3);
  assert.match(form('ב').strokes[1], /L179 190/u, 'Bet has a base extending past its right stem');
  assert.match(form('ד').strokes[0], /L175 96/u, 'Dalet has a roof overhang');
  assert.match(form('ר').strokes[0], /Q/u, 'Resh turns smoothly into its stem');
  assert.match(form('ה').strokes[1], /^M77 133/u, 'He has an open gap above the left leg');
  assert.match(form('ח').strokes[1], /^M77 96/u, 'Het joins the roof');
  assert.match(form('ת').strokes[1], /57 190/u, 'Tav has a distinct left foot');
  assert.match(form('י').strokes[0], /V124$/u);
  assert.match(form('ו').strokes[0], /V190$/u);
  for (const char of ['ך', 'ן', 'ף', 'ץ']) assert.ok(form(char).strokes.some(d => /V224/u.test(d)), `${char} must descend`);
  assert.ok(form('ם').strokes.every(d => !/22[0-9]/u.test(d)), 'Final mem stays on the baseline');
  assert.notDeepEqual(form('ף').strokes, form('ץ').strokes);
});

test('Capitals have full-height forms, separate crossbars and pen lifts', () => {
  const form = char => writingLetter('english', char.charCodeAt(0) - 65, 'main');
  assert.equal(form('A').strokes.length, 3); assert.match(form('A').strokes[2], /139/u);
  assert.equal(form('H').strokes.length, 3); assert.match(form('H').strokes[2], /118/u);
  assert.equal(form('I').strokes.length, 3);
  assert.equal(form('L').strokes.length, 2);
  assert.equal(form('M').strokes.length, 4);
  assert.equal(form('O').strokes.length, 1);
  assert.equal(form('Q').strokes.length, 2);
  assert.equal(form('Y').strokes.length, 3);
  for (const char of 'ABDEFHIJKLMNOPQRTUVWXYZ') assert.ok(form(char).strokes.some(d => /\b46\b/u.test(d)), `${char} reaches the capital line`);
});

test('Every writing form gets its own full alphabet before reviewing, with no recognition or reward credit', () => {
  for (const language of Object.keys(LETTERS)) for (const form of WRITING_FORMS) {
    const mode = writingMode(form); let progress = freshProgress(); const seen = new Set();
    for (let i = 0; i < LETTERS[language].length; i++) {
      const letter = suggestedLetters(progress.letterPractice, language, mode, 1, i)[0];
      assert.ok(!seen.has(letter.id)); seen.add(letter.id);
      progress.letterPractice = recordLetters(progress.letterPractice, language, mode, [letter.id]);
      progress = sanitizeProgress(JSON.parse(JSON.stringify(progress)));
    }
    assert.equal(practicedLetterCount(progress.letterPractice, language, mode), LETTERS[language].length);
    for (const other of LETTER_MODES.filter(m => m !== mode)) assert.equal(practicedLetterCount(progress.letterPractice, language, other), 0);
    assert.equal(progress.sessions, 0); assert.equal(progress.stickers.length, 0);
  }
});

test('Old saves retain all previous writing, while each new form and its last position start independently', () => {
  const old = freshProgress();
  old.sessions = 26; old.missions.letters = 26; old.skills.letters.correct = 156;
  old.letterPractice.hebrew.writing[5] = 9; delete old.letterPractice.hebrew.writingMain;
  delete old.letterPractice.english.writingMain;
  const migrated = sanitizeProgress(old);
  assert.equal(migrated.stickers.length, 26);
  assert.equal(migrated.letterPractice.hebrew.writing[5], 9);
  assert.ok(migrated.letterPractice.hebrew.writingMain.every(n => n === 0));
  const saved = sanitizeSettings({ letterWriting: { hebrew: 5, english: 17 }, letterMainWriting: { hebrew: 26, english: 25 }, letterWritingForm: { hebrew: 'main', english: 'invalid' } });
  assert.deepEqual(saved.letterWriting, { hebrew: 5, english: 17 });
  assert.deepEqual(saved.letterMainWriting, { hebrew: 26, english: 25 });
  assert.deepEqual(saved.letterWritingForm, { hebrew: 'main', english: 'alternate' });
  saved.letterMainWriting.hebrew = 9; saved.letterWritingForm.english = 'main';
  assert.equal(sanitizeSettings(null).letterMainWriting.hebrew, 0);
  assert.equal(sanitizeSettings(null).letterWritingForm.english, 'alternate');
  assert.equal(writingPositionKey('main'), 'letterMainWriting');
  assert.equal(writingPositionKey('alternate'), 'letterWriting');
});

test('Pending capital and print writing is added once without duplicating confirmed work', () => {
  const remote = freshProgress(), own = freshProgress(), confirmed = freshProgress();
  remote.letterPractice.hebrew.writingMain[26] = 4;
  own.letterPractice.hebrew.writingMain[26] = 2; confirmed.letterPractice.hebrew.writingMain[26] = 1;
  own.letterPractice.english.writingMain[11] = 1;
  const pending = pendingLetterPractice(remote.letterPractice, own.letterPractice, confirmed.letterPractice);
  assert.equal(pending.hebrew.writingMain[26], 5); assert.equal(pending.english.writingMain[11], 1);
  assert.deepEqual(pendingLetterPractice(pending, own.letterPractice, own.letterPractice), pending);
  assert.equal(pending.hebrew.writing[26], 0); assert.equal(pending.english.recognition[11], 0);
});
