import { LETTERS } from './letters.js';

// The existing writing counters remain handwriting/lowercase; print/capitals
// get their own counters, so an older save never claims the new skill is done.
export const LETTER_MODES = Object.freeze(['recognition', 'writing', 'writingMain']);
const validCount = n => Number.isSafeInteger(n) && n >= 0 && n <= 32000000 ? n : 0;

export function sanitizeLetterPractice(input, legacy = false) {
  return Object.fromEntries(Object.entries(LETTERS).map(([language, letters]) => {
    const source = input?.[language];
    const start = Number.isInteger(source?.start) && source.start >= 0 && source.start < letters.length ? source.start : legacy && language === 'hebrew' ? 3 : 0;
    return [language, { start, ...Object.fromEntries(LETTER_MODES.map(mode => [mode, letters.map((_, index) => validCount(source?.[mode]?.[index]))])) }];
  }));
}

export function recordLetters(input, language, mode, ids) {
  const result = sanitizeLetterPractice(input);
  if (!Object.hasOwn(LETTERS, language) || !LETTER_MODES.includes(mode)) return result;
  const recorded = new Set(Array.isArray(ids) ? ids : []);
  for (const [index, letter] of LETTERS[language].entries()) if (recorded.has(letter.id)) result[language][mode][index] = Math.min(1000000, result[language][mode][index] + 1);
  return result;
}

export function suggestedLetters(input, language, mode = 'recognition', count = 3, preferredIndex = null) {
  if (!Object.hasOwn(LETTERS, language)) language = 'hebrew';
  if (!LETTER_MODES.includes(mode)) mode = 'recognition';
  const practice = sanitizeLetterPractice(input)[language];
  const letters = LETTERS[language];
  const start = Number.isInteger(preferredIndex) && preferredIndex >= 0 && preferredIndex < letters.length ? preferredIndex : mode === 'recognition' ? practice.start : 0;
  return letters.map((letter, index) => ({ letter, visits: practice[mode][index], order: (index - start + letters.length) % letters.length }))
    .sort((a, b) => a.visits - b.visits || a.order - b.order).slice(0, Math.max(1, Math.min(letters.length, count))).map(item => item.letter);
}

export function practicedLetterCount(input, language, mode) {
  if (!Object.hasOwn(LETTERS, language) || !LETTER_MODES.includes(mode)) return 0;
  return sanitizeLetterPractice(input)[language][mode].filter(n => n > 0).length;
}

export function pendingLetterPractice(remote, own, confirmed) {
  const result = sanitizeLetterPractice(remote), local = sanitizeLetterPractice(own), uploaded = sanitizeLetterPractice(confirmed);
  for (const language of Object.keys(LETTERS)) {
    result[language].start = Math.max(result[language].start, local[language].start);
    for (const mode of LETTER_MODES) result[language][mode] = result[language][mode].map((n, i) => n + Math.max(0, local[language][mode][i] - uploaded[language][mode][i]));
  }
  return result;
}
