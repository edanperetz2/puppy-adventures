import { LETTERS } from './letters.js';
import { escapeHtml } from './profiles.js';

// Optical left and right edges of the reviewed handwriting strokes. Measured
// along their common slant (x + 0.25 * (y - 185)), including the pen width.
// Narrow letters such as י and ו keep their own advance within a whole word.
const edges = {
  א: [60, 154], ב: [58, 160], ג: [86, 135], ד: [66, 146], ה: [58, 153], ו: [105, 130],
  ז: [82, 156], ח: [65, 153], ט: [72, 157], י: [111, 127], כ: [78, 156], ל: [85, 152],
  מ: [67, 139], נ: [71, 135], ס: [59, 163], ע: [85, 163], פ: [72, 165], צ: [65, 162],
  ק: [76, 154], ר: [63, 141], ש: [59, 170], ת: [57, 164], ך: [81, 137], ם: [74, 163],
  ן: [105, 129], ף: [63, 163], ץ: [51, 163],
};
const penLetters = new Map(LETTERS.hebrew.map(letter => [letter.familiar, letter.strokes]));

function handwrittenWord(word) {
  // The first logical letter starts at the right edge. Shift each group only
  // horizontally to retain the raised yod and the long final-letter strokes.
  const letters = [...word];
  const gap = 17;
  const rightMargin = 39;
  const leftMargin = 18;
  const width = letters.reduce((total, letter) => total + edges[letter][1] - edges[letter][0] + gap,
    leftMargin + rightMargin - gap);
  let cursor = width - rightMargin;
  const ink = letters.map(letter => {
    const [left, right] = edges[letter];
    const x = cursor - right;
    cursor = x + left - gap;
    return `<g transform="translate(${x} 0)">${penLetters.get(letter).map(path => `<path d="${path}"/>`).join('')}</g>`;
  }).join('');
  return `<svg class="word-handwriting" role="img" aria-label="${escapeHtml(word)}" lang="he" dir="rtl" viewBox="0 46 ${width} 190" xmlns="http://www.w3.org/2000/svg">
    <g stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" fill="none">${ink}</g>
  </svg>`;
}

export function wordFormOption(word, language) {
  return language === 'hebrew' ? handwrittenWord(word.plain)
    : `<bdi class="word-form-lowercase" lang="en" dir="ltr">${escapeHtml(word.plain.toLowerCase())}</bdi>`;
}

export function wordFormMenuArt(language, nikud = true) {
  const hebrew = language === 'hebrew';
  return `<div class="letter-path-picture word-form-menu-art" dir="${hebrew ? 'rtl' : 'ltr'}" aria-hidden="true">
    <span class="word-form-slip print-slip" lang="${hebrew ? 'he' : 'en'}">${hebrew ? nikud ? 'דָּג' : 'דג' : 'CAT'}</span>
    <span class="word-form-slip alternate-slip">${hebrew ? handwrittenWord('דג') : '<bdi lang="en" dir="ltr">cat</bdi>'}</span>
  </div>`;
}
