import { uiIcon } from './art.js';
import { shuffle } from './answer-order.js';
import { mountInkPad } from './ink-pad.js?v=2.3.3-dictation';
import { WRITING_NUMBERS } from './number-writing.js?v=2.3.3-dictation';
import { numberClip, spokenNumber } from './number-workshop.js?v=2.3.0-numbers';

export const NUMBER_DICTATION_TITLE = 'מַקְשִׁיבוֹת וְכוֹתְבוֹת';
export const numberDictationKey = number => `math:dictation:${number}`;

const dictationRanges = {
  all: { label: 'כָּל הַמִּסְפָּרִים', numbers: WRITING_NUMBERS },
  digits: { label: 'סִפְרָה אַחַת', numbers: WRITING_NUMBERS.filter(n => n < 10) },
  teens: { label: 'מֵעֶשֶׂר עַד תְּשַׁע עֶשְׂרֵה', numbers: WRITING_NUMBERS.filter(n => n >= 10 && n < 20) },
  tens: { label: 'עֲשָׂרוֹת שְׁלֵמוֹת', numbers: WRITING_NUMBERS.filter(n => n > 0 && n % 10 === 0) },
};

export function dictationNumberClips(number) {
  return number === 8 ? [numberClip('dictation-8')] : spokenNumber(number);
}

export function numberDictationDraw(rng = Math.random, range = 'all', getItems = () => ({})) {
  let queue = [], previous;
  return () => {
    if (!queue.length) {
      const items = getItems();
      const practice = n => items[numberDictationKey(n)]?.practice || 0;
      const last = n => items[numberDictationKey(n)]?.last || 0;
      queue = shuffle(dictationRanges[range].numbers, rng)
        .sort((a, b) => practice(a) - practice(b) || last(a) - last(b));
      if (queue[0] === previous) [queue[0], queue[1]] = [queue[1], queue[0]];
    }
    previous = queue.shift();
    return previous;
  };
}

export function mountNumberDictation(root, { speak, getItems, onPractice }) {
  const events = new AbortController();
  let drawNumber = numberDictationDraw(Math.random, 'all', getItems);
  let number = drawNumber(), revealed = false;

  root.innerHTML = `<div class="number-round-top">
    <button type="button" class="text-button" data-action="number-menu">${uiIcon('arrow')} לַסַּדְנָה</button>
  </div>
  <section class="number-board number-dictation-board" aria-labelledby="number-dictation-title">
    <div class="number-question-heading">
      <h1 id="number-dictation-title" tabindex="-1">${NUMBER_DICTATION_TITLE}</h1>
    </div>
    <div class="number-dictation-layout">
      <label class="number-writing-picker"><span>טְוַח הַמִּסְפָּרִים</span>
        <select data-dictation="range">${Object.entries(dictationRanges).map(([id, { label }]) =>
          `<option value="${id}">${label}</option>`).join('')}</select>
      </label>
      <button type="button" class="secondary-button number-dictation-listen" data-action="replay">${uiIcon('sound')} שׁוֹמְעוֹת שׁוּב</button>
      <svg class="free-writing-pad number-dictation-pad" viewBox="0 0 380 230" role="img" aria-label="משטח כתיבה חופשית למספר ששמעת" dir="ltr">
        <g class="writing-lines" aria-hidden="true"><path d="M18 124H362M18 190H362"/></g>
        <g class="free-ink" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"></g>
      </svg>
      <div class="number-dictation-answer" tabindex="-1" hidden>
        <span>הַמִּסְפָּר שֶׁשָּׁמַעְתְּ</span>
        <bdi dir="ltr"></bdi>
      </div>
      <div class="number-dictation-controls">
        <button type="button" class="text-button" data-dictation="clear" disabled>${uiIcon('again')} מוֹחֲקוֹת</button>
        <button type="button" class="primary-button" data-dictation="reveal" disabled>בּוֹדְקוֹת ${uiIcon('check')}</button>
        <button type="button" class="primary-button" data-dictation="next" hidden>מִסְפָּר חָדָשׁ ${uiIcon('arrow')}</button>
      </div>
    </div>
    <p id="audio-notice" class="audio-notice" role="status" hidden></p>
  </section>`;

  const svg = root.querySelector('.number-dictation-pad');
  const range = root.querySelector('[data-dictation="range"]');
  const listen = root.querySelector('[data-action="replay"]');
  const clear = root.querySelector('[data-dictation="clear"]');
  const reveal = root.querySelector('[data-dictation="reveal"]');
  const next = root.querySelector('[data-dictation="next"]');
  const answer = root.querySelector('.number-dictation-answer');
  const answerNumber = answer.querySelector('bdi');
  const pad = mountInkPad(svg, { canDraw: () => !revealed, onChange: updateControls });
  const numberAudio = () => dictationNumberClips(number);
  const replay = () => speak(numberAudio());

  function updateControls() {
    clear.disabled = !pad.hasMarks();
    range.disabled = pad.hasMarks() && !revealed;
    reveal.disabled = !pad.hasInk();
    clear.hidden = revealed;
    reveal.hidden = revealed;
    next.hidden = !revealed;
    answer.hidden = !revealed;
    svg.classList.toggle('is-locked', revealed);
  }

  function newNumber() {
    number = drawNumber();
    revealed = false;
    answerNumber.textContent = '';
    pad.clear();
    listen.focus();
    void replay();
  }

  range.addEventListener('change', () => {
    drawNumber = numberDictationDraw(Math.random, range.value, getItems);
    newNumber();
  }, { signal: events.signal });
  clear.addEventListener('click', () => {
    if (revealed) return;
    pad.clear();
    listen.focus({ preventScroll: true });
  }, { signal: events.signal });
  reveal.addEventListener('click', () => {
    if (revealed || !pad.hasInk()) return;
    revealed = true;
    answerNumber.textContent = number;
    updateControls();
    answer.focus();
    onPractice(number);
    void speak([numberClip('dictation-compare'), ...numberAudio()]);
  }, { signal: events.signal });
  next.addEventListener('click', () => {
    if (!revealed) return;
    newNumber();
  }, { signal: events.signal });

  return {
    start: () => speak([numberClip('dictation-intro'), ...numberAudio()]),
    replay,
    destroy() { events.abort(); pad.destroy(); },
  };
}
