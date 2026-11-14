import { uiIcon } from './art.js';
import { mountLetterPad } from './letter-pad.js?v=2.3.1-number-writing';
import { numberClip } from './number-workshop.js?v=2.3.0-numbers';

export const NUMBER_WRITING_TITLE = 'כּוֹתְבוֹת מִסְפָּרִים';
export const WRITING_DIGITS = Object.freeze([1, 2, 3, 4, 5, 6, 7, 8, 9, 0]);

const DIGIT_STROKES = [
  ['M120 46 C89 46 76 75 76 117 C76 162 90 190 120 190 C150 190 164 162 164 117 C164 75 151 46 120 46'],
  ['M96 76 L124 46 V190'],
  ['M77 75 C87 47 127 36 148 55 C174 76 160 102 139 125 L77 190 H163'],
  ['M81 60 C119 33 160 47 160 82 C160 101 143 114 118 114 C148 114 166 129 165 153 C165 180 136 197 111 190 C98 188 85 183 76 176'],
  ['M134 46 L72 139 H171', 'M145 46 V190'],
  ['M157 46 H88 L81 112 C106 96 136 100 151 115 C174 138 164 170 146 182 C123 198 95 190 78 176'],
  ['M150 51 C113 40 82 76 78 126 C73 168 91 190 120 190 C147 190 161 171 161 149 C161 124 145 108 122 108 C100 108 86 118 78 136'],
  ['M76 46 H164 L98 190'],
  ['M143 52 C123 38 83 45 83 77 C83 102 108 112 127 123 C155 140 164 151 163 163 C163 183 145 190 120 190 C93 190 76 178 77 158 C78 138 101 124 120 113 C143 100 159 89 158 73 C157 63 150 56 143 52'],
  ['M160 94 C160 68 148 46 121 46 C95 46 79 64 79 91 C79 119 96 137 120 137 C144 137 160 119 160 94 C160 138 149 171 123 190'],
];

export const digitWritingKey = digit => `math:write:${digit}`;
const wasPracticed = (items, digit) => (items[digitWritingKey(digit)]?.practice ?? 0) > 0;

export function nextWritingDigit(items, after = null) {
  const start = WRITING_DIGITS.indexOf(after) + 1;
  const order = [...WRITING_DIGITS.slice(start), ...WRITING_DIGITS.slice(0, start)];
  return order.find(digit => !wasPracticed(items, digit)) ?? order[0];
}

export function digitWritingPad(digit) {
  return `<svg class="letter-shape letter-pad number-writing-pad" viewBox="0 0 240 240" lang="he" dir="ltr"
    role="img" aria-label="משטח כתיבה של הספרה ${digit}">
    <g class="writing-lines" aria-hidden="true"><path d="M15 46H225M15 118H225M15 190H225"/></g>
    <g class="letter-guide" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">
      ${DIGIT_STROKES[digit].map((d, index) => `<path d="${d}" data-stroke="${index}"/>`).join('')}
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
  let digit = nextWritingDigit(getItems());
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
        <div class="number-writing-digits" role="group" aria-label="בחירת ספרה לתרגול" dir="ltr">
          ${WRITING_DIGITS.map(value => `<button type="button" data-write-digit="${value}" aria-pressed="false">${value}<span class="number-writing-check" aria-hidden="true" hidden>${uiIcon('check')}</span></button>`).join('')}
        </div>
      </div>
    </div>
    <p id="audio-notice" class="audio-notice" role="status" hidden></p>
  </section>`;

  const surface = root.querySelector('.number-writing-surface');
  const example = root.querySelector('.number-writing-example');
  const next = root.querySelector('[data-number-writing="next"]');
  const count = root.querySelector('.number-writing-count');
  const choices = [...root.querySelectorAll('[data-write-digit]')];
  const replay = () => {
    const cue = !next.hidden ? 'write-done' : showedDemo ? 'write-trace' : 'write-intro';
    return speak([`number-${digit}`, numberClip(cue)]);
  };

  function updateProgress() {
    const items = getItems();
    let practicedCount = 0;
    for (const button of choices) {
      const value = Number(button.dataset.writeDigit);
      const practiced = wasPracticed(items, value);
      if (practiced) practicedCount++;
      button.setAttribute('aria-pressed', String(value === digit));
      button.setAttribute('aria-label', `תרגול הספרה ${value}${practiced ? ', כבר תורגל' : ''}`);
      button.querySelector('.number-writing-check').hidden = !practiced;
    }
    count.textContent = `תִּרְגַּלְתְּ ${practicedCount} מִתּוֹךְ ${WRITING_DIGITS.length} סְפָרוֹת`;
  }

  function selectDigit(value) {
    pad?.destroy();
    digit = value; recorded = false; showedDemo = false; lastHint = 0;
    example.textContent = digit;
    next.hidden = true;
    surface.innerHTML = `${digitWritingPad(digit)}<p class="letter-pad-caption" role="status"></p>`;
    pad = mountLetterPad(surface, {
      motion: animate,
      completeMessage: 'כָּל הַכָּבוֹד! כָּתַבְתְּ אֶת הַמִּסְפָּר.',
      onDemoComplete: () => { lastHint = Date.now(); void speak(numberClip('write-trace')); },
      onStartNeeded: () => {
        if (Date.now() - lastHint < 5000) return;
        lastHint = Date.now(); void speak(numberClip('write-trace'));
      },
      onComplete: () => {
        if (!recorded) { recorded = true; onPractice(digit); updateProgress(); }
        next.hidden = false;
        void speak(numberClip('write-done'));
      },
    });
    updateProgress();
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (Object.hasOwn(button.dataset, 'writeDigit')) {
      const value = Number(button.dataset.writeDigit);
      if (value !== digit) selectDigit(value);
      void replay();
      return;
    }
    switch (button.dataset.numberWriting) {
      case 'demo':
        showedDemo = true;
        next.hidden = true;
        pad.demo();
        if (animate) void speak(`number-${digit}`);
        else void speak(numberClip('write-trace'));
        break;
      case 'reset':
        showedDemo = true;
        next.hidden = true;
        pad.reset();
        void speak(numberClip('write-trace'));
        break;
      case 'next':
        selectDigit(nextWritingDigit(getItems(), digit));
        root.querySelector('[data-number-writing="demo"]').focus({ preventScroll: true });
        surface.scrollIntoView({ block: 'nearest' });
        void replay();
        break;
    }
  }, { signal: events.signal });

  selectDigit(digit);
  return { replay, updateProgress, destroy() { events.abort(); pad.destroy(); } };
}
