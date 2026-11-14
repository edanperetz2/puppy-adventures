import { uiIcon } from './art.js';
import { mountLetterPad } from './letter-pad.js?v=2.3.1-number-writing';
import { numberClip, spokenNumber } from './number-workshop.js?v=2.3.0-numbers';

export const NUMBER_WRITING_TITLE = 'כּוֹתְבוֹת מִסְפָּרִים';
export const MAX_WRITING_NUMBER = 100;
export const WRITING_NUMBERS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 0,
  ...Array.from({ length: MAX_WRITING_NUMBER - 9 }, (_, index) => index + 10),
]);

// Keep the shape of each single digit and move only each stroke's starting point.
const DIGIT_STROKES = [
  [[120, 46, 'c-31 0 -44 29 -44 71 c0 45 14 73 44 73 c30 0 44 -28 44 -73 c0 -42 -13 -71 -44 -71']],
  [[96, 76, 'l28 -30 v144']],
  [[77, 75, 'c10 -28 50 -39 71 -20 c26 21 12 47 -9 70 l-62 65 h86']],
  [[81, 60, 'c38 -27 79 -13 79 22 c0 19 -17 32 -42 32 c30 0 48 15 47 39 c0 27 -29 44 -54 37 c-13 -2 -26 -7 -35 -14']],
  [[134, 46, 'l-62 93 h99'], [145, 46, 'v144']],
  [[157, 46, 'h-69 l-7 66 c25 -16 55 -12 70 3 c23 23 13 55 -5 67 c-23 16 -51 8 -68 -6']],
  [[150, 51, 'c-37 -11 -68 25 -72 75 c-5 42 13 64 42 64 c27 0 41 -19 41 -41 c0 -25 -16 -41 -39 -41 c-22 0 -36 10 -44 28']],
  [[76, 46, 'h88 l-66 144']],
  [[143, 52, 'c-20 -14 -60 -7 -60 25 c0 25 25 35 44 46 c28 17 37 28 36 40 c0 20 -18 27 -43 27 c-27 0 -44 -12 -43 -32 c1 -20 24 -34 43 -45 c23 -13 39 -24 38 -40 c-1 -10 -8 -17 -15 -21']],
  [[160, 94, 'c0 -26 -12 -48 -39 -48 c-26 0 -42 18 -42 45 c0 28 17 46 41 46 c24 0 40 -18 40 -43 c0 44 -11 77 -37 96']],
];

export const numberWritingKey = number => `math:write:${number}`;
const wasPracticed = (items, number) => (items[numberWritingKey(number)]?.practice ?? 0) > 0;
const groupFor = number => number - number % 10;
const groupEnd = start => Math.min(start + 9, MAX_WRITING_NUMBER);

export function nextWritingNumber(items, after = null) {
  const start = WRITING_NUMBERS.indexOf(after) + 1;
  const order = [...WRITING_NUMBERS.slice(start), ...WRITING_NUMBERS.slice(0, start)];
  return order.find(number => !wasPracticed(items, number)) ?? order[0];
}

export function numberWritingPad(number) {
  const digits = Array.from(String(number), Number);
  const digitSpacing = 116;
  const inset = 54;
  const width = 240 + (digits.length - 1) * digitSpacing - 2 * inset;
  const lineEnd = width - 15;
  const strokes = digits.flatMap((digit, column) => DIGIT_STROKES[digit].map(([x, y, path]) => ({
    d: `M${x - inset + column * digitSpacing} ${y} ${path}`, column,
  })));
  return `<svg class="letter-shape letter-pad number-writing-pad" viewBox="0 0 ${width} 216" lang="he" dir="ltr"
    role="img" aria-label="משטח כתיבה של המספר ${number}">
    <g class="writing-lines" aria-hidden="true"><path d="M15 46H${lineEnd}M15 118H${lineEnd}M15 190H${lineEnd}"/></g>
    <g class="letter-guide" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
      ${strokes.map(({ d, column }, index) => `<path d="${d}" data-stroke="${index}" data-digit-column="${column}"/>`).join('')}
    </g>
    <g class="letter-ink" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"></g>
    <g class="letter-direction" aria-hidden="true"><path class="letter-direction-line"/><path class="letter-direction-tip"/></g>
    <g class="letter-start" aria-hidden="true"><circle r="13"/><text text-anchor="middle" dy="4"></text></g>
    <circle class="writing-pencil" r="8" hidden aria-hidden="true"/>
  </svg>`;
}

export function mountNumberWriting(root, { getItems, motion, speak, onPractice }) {
  const events = new AbortController();
  const animate = motion && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  let number = nextWritingNumber(getItems());
  let pad, recorded, showedDemo, lastHint;

  root.innerHTML = `<div class="number-round-top">
    <button type="button" class="text-button" data-action="number-menu">${uiIcon('arrow')} לַסַּדְנָה</button>
  </div>
  <section class="number-board number-writing-board" aria-labelledby="number-writing-title">
    <div class="number-question-heading">
      <h1 id="number-writing-title" tabindex="-1">${NUMBER_WRITING_TITLE}</h1>
      <button type="button" class="circle-button" data-action="replay" aria-label="שמיעת ההסבר שוב">${uiIcon('sound')}</button>
    </div>
    <div class="number-writing-layout">
      <div class="number-writing-tools">
        <bdi class="number-writing-example" dir="ltr"></bdi>
        <div>
          <button type="button" class="secondary-button" data-number-writing="demo">${uiIcon('pencil')} ${animate ? 'הַרְאִי לִי אֵיךְ' : 'קַו אַחַר קַו'}</button>
          <button type="button" class="text-button" data-number-writing="reset">${uiIcon('again')} מֵחָדָשׁ</button>
        </div>
      </div>
      <div class="number-writing-surface"></div>
      <div class="number-writing-navigation">
        <button type="button" class="primary-button" data-number-writing="next" hidden>לַמִּסְפָּר הַבָּא ${uiIcon('arrow')}</button>
        <p class="number-writing-count"></p>
        <label class="number-writing-picker">
          <span>בַּחֲרִי מִסְפָּר</span>
          <select aria-label="בחירת טווח מספרים" dir="ltr">
            ${Array.from({ length: MAX_WRITING_NUMBER / 10 + 1 }, (_, index) => {
              const start = index * 10, end = groupEnd(start);
              return `<option value="${start}">${start === end ? start : `${start}–${end}`}</option>`;
            }).join('')}
          </select>
        </label>
        <div class="number-writing-digits" role="group" aria-label="בחירת מספר לתרגול" dir="ltr"></div>
      </div>
    </div>
    <p id="audio-notice" class="audio-notice" role="status" hidden></p>
  </section>`;

  const surface = root.querySelector('.number-writing-surface');
  const example = root.querySelector('.number-writing-example');
  const next = root.querySelector('[data-number-writing="next"]');
  const count = root.querySelector('.number-writing-count');
  const range = root.querySelector('.number-writing-picker select');
  const choices = root.querySelector('.number-writing-digits');
  const traceCue = () => numberClip(number >= 10 ? 'write-left' : 'write-trace');
  const replay = () => {
    const cue = !next.hidden ? numberClip('write-done') : showedDemo ? traceCue() : numberClip('write-intro');
    return speak([...spokenNumber(number), cue]);
  };

  function showRange(start) {
    if (choices.dataset.start === String(start)) return;
    range.value = String(start);
    choices.dataset.start = String(start);
    choices.innerHTML = Array.from({ length: groupEnd(start) - start + 1 }, (_, index) => {
      const value = start + index;
      return `<button type="button" data-write-number="${value}">${value}<span class="number-writing-check" aria-hidden="true" hidden>${uiIcon('check')}</span></button>`;
    }).join('');
  }

  function updateProgress() {
    const items = getItems();
    const practicedCount = WRITING_NUMBERS.filter(value => wasPracticed(items, value)).length;
    for (const button of choices.children) {
      const value = Number(button.dataset.writeNumber);
      const practiced = wasPracticed(items, value);
      button.setAttribute('aria-pressed', String(value === number));
      button.setAttribute('aria-label', `תרגול המספר ${value}${practiced ? ', כבר תורגל' : ''}`);
      button.querySelector('.number-writing-check').hidden = !practiced;
    }
    count.textContent = `תִּרְגַּלְתְּ ${practicedCount} מִתּוֹךְ ${WRITING_NUMBERS.length} מִסְפָּרִים`;
  }

  function selectNumber(value) {
    pad?.destroy();
    number = value; recorded = false; showedDemo = false; lastHint = 0;
    example.textContent = number;
    surface.dataset.digitCount = String(number).length;
    showRange(groupFor(number));
    next.hidden = true;
    surface.innerHTML = `${numberWritingPad(number)}<p class="letter-pad-caption" role="status"></p>`;
    pad = mountLetterPad(surface, {
      motion: animate,
      completeMessage: 'כָּל הַכָּבוֹד! כָּתַבְתְּ אֶת הַמִּסְפָּר.',
      onDemoComplete: () => { lastHint = Date.now(); void speak(traceCue()); },
      onStartNeeded: () => {
        if (Date.now() - lastHint < 5000) return;
        lastHint = Date.now(); void speak(numberClip('write-trace'));
      },
      onComplete: () => {
        if (!recorded) { recorded = true; onPractice(number); updateProgress(); }
        next.hidden = false;
        void speak(numberClip('write-done'));
      },
    });
    updateProgress();
  }

  range.addEventListener('change', () => {
    showRange(Number(range.value));
    updateProgress();
  }, { signal: events.signal });

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (Object.hasOwn(button.dataset, 'writeNumber')) {
      const value = Number(button.dataset.writeNumber);
      if (value !== number) selectNumber(value);
      surface.scrollIntoView({ block: 'nearest' });
      void replay();
      return;
    }
    switch (button.dataset.numberWriting) {
      case 'demo':
        showedDemo = true;
        next.hidden = true;
        pad.demo();
        if (animate) void speak(spokenNumber(number));
        else void speak(traceCue());
        break;
      case 'reset':
        showedDemo = true;
        next.hidden = true;
        pad.reset();
        void speak(traceCue());
        break;
      case 'next':
        selectNumber(nextWritingNumber(getItems(), number));
        root.querySelector('[data-number-writing="demo"]').focus({ preventScroll: true });
        surface.scrollIntoView({ block: 'nearest' });
        void replay();
        break;
    }
  }, { signal: events.signal });

  selectNumber(number);
  return { replay, updateProgress, destroy() { events.abort(); pad.destroy(); } };
}
