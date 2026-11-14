import { art, uiIcon } from './art.js';
import { shuffle } from './answer-order.js';
import { numberClip } from './number-workshop.js?v=2.3.0-numbers';
import { NUMBER_WORKSHOP_CLIPS } from './number-workshop-content.js?v=2.5.0-play';

export const FRUIT_CUTTING_TITLE = 'חוֹתְכוֹת פֵּרוֹת';

const fruits = { apple: 'תפוח', 'orange-fruit': 'תפוז', peach: 'אפרסק', strawberry: 'תות' };
const stages = [
  { prompt: 'intro', fruits: 1, goal: 2, outcome: 'half' },
  { prompt: 'two', fruits: 2, goal: 4, outcome: 'four-made' },
  { prompt: 'four', fruits: 4, goal: 4 },
  { prompt: 'six', fruits: 4, goal: 6 },
  { prompt: 'eight', fruits: 5, goal: 8 },
  { prompt: 'ten', fruits: 6, goal: 10, startCut: true },
];

export function mountFruitCutting(root, { nikud, speak }) {
  const events = new AbortController();
  const label = text => nikud ? text : text.replace(/[\u0591-\u05bd\u05bf-\u05c7]/gu, '');
  let index = 0, halves = 0, finished = false, swipe = null;
  const stage = () => stages[index];

  root.innerHTML = `<div class="number-round-top">
    <button type="button" class="text-button" data-action="number-menu">${uiIcon('arrow')} לְסַדְנַת הַמִּסְפָּרִים</button>
    <span class="fruit-step"></span>
  </div>
  <div class="step-track fruit-progress" aria-hidden="true"></div>
  <section class="number-board fruit-board" aria-labelledby="fruit-title">
    <div class="number-question-heading">
      <h1 id="fruit-title" tabindex="-1">${label(FRUIT_CUTTING_TITLE)}</h1>
      <button type="button" class="circle-button" data-action="replay" aria-label="שמיעת ההוראות שוב">${uiIcon('sound')}</button>
    </div>
    <p id="fruit-prompt" class="fruit-prompt"></p>
    <div class="fruit-tray" role="group" aria-labelledby="fruit-prompt"></div>
    <p class="fruit-counter" role="status"></p>
    <div class="fruit-actions">
      <button type="button" class="primary-button" data-fruit-action="next" hidden></button>
      <button type="button" class="primary-button" data-fruit-action="again" hidden>${label('עוֹד סִיבּוּב')} ${uiIcon('again')}</button>
    </div>
    <p id="audio-notice" class="audio-notice" role="status" hidden></p>
  </section>`;

  const title = root.querySelector('h1');
  const step = root.querySelector('.fruit-step');
  const track = root.querySelector('.fruit-progress');
  const replayButton = root.querySelector('[data-action="replay"]');
  const prompt = root.querySelector('.fruit-prompt');
  const tray = root.querySelector('.fruit-tray');
  const counter = root.querySelector('.fruit-counter');
  const next = root.querySelector('[data-fruit-action="next"]');
  const again = root.querySelector('[data-fruit-action="again"]');

  const clip = key => numberClip(`fruit-${key}`);
  const reachedGoal = () => halves === stage().goal;
  const promptClip = () => {
    if (!reachedGoal()) return clip(stage().prompt);
    return stage().outcome ? clip(stage().outcome) : 'correct-1';
  };

  function replay() {
    if (!finished) void speak(promptClip());
  }

  function update() {
    const solved = reachedGoal();
    prompt.textContent = label(NUMBER_WORKSHOP_CLIPS[promptClip()]?.text || 'כָּל הַכָּבוֹד! הִצְלַחְתְּ!');
    next.hidden = !solved || finished;
    track.innerHTML = stages.map((_, i) => `<span class="step-dot${finished || i < index || i === index && solved ? ' done' : i === index ? ' current' : ''}">${i + 1}</span>`).join('');
    if (finished) return;
    const count = index >= 2 ? `${halves} / ${stage().goal}` : halves;
    counter.innerHTML = `<b dir="ltr">${count}</b> ${label('חֲצָאִים')}`;
    counter.classList.toggle('fruit-goal-met', solved);
  }

  function showStage() {
    const task = stage(), order = shuffle(Object.keys(fruits));
    halves = task.startCut ? 2 : 0;
    swipe = null;
    title.textContent = label(FRUIT_CUTTING_TITLE);
    step.textContent = `${index + 1} / ${stages.length}`;
    next.innerHTML = `${label(index === stages.length - 1 ? 'לַסִּיּוּם' : 'לַצַּעַד הַבָּא')} ${uiIcon('arrow')}`;
    prompt.hidden = tray.hidden = counter.hidden = replayButton.hidden = false;
    again.hidden = true;
    tray.innerHTML = Array.from({ length: task.fruits }, (_, i) => {
      const id = order[i % order.length], picture = art(id), cut = task.startCut && i === 0;
      return `<button type="button" class="fruit-piece${cut ? ' fruit-cut' : ''}" data-fruit="${id}" aria-label="${cut ? `שני חצאים של ${fruits[id]}` : `לחיתוך ${fruits[id]}`}" ${cut ? 'disabled' : ''}>
        <span class="fruit-picture" aria-hidden="true">
          <span class="fruit-half fruit-left">${picture}</span><span class="fruit-half fruit-right">${picture}</span>
          <span class="fruit-cut-line"></span>
          <span class="fruit-fraction fruit-fraction-left">½</span><span class="fruit-fraction fruit-fraction-right">½</span>
        </span>
      </button>`;
    }).join('');
    update();
  }

  function cut(button) {
    if (button.disabled || finished) return;
    const focused = document.activeElement === button;
    button.classList.add('fruit-cut', 'fruit-sliced');
    button.setAttribute('aria-label', `שני חצאים של ${fruits[button.dataset.fruit]}`);
    button.disabled = true;
    halves += 2;
    update();
    if (reachedGoal()) {
      for (const fruit of tray.querySelectorAll('[data-fruit]')) fruit.disabled = true;
      if (focused) next.focus({ preventScroll: true });
      replay();
    } else if (focused) {
      tray.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
    }
  }

  tray.addEventListener('pointerdown', event => {
    const button = event.target.closest('[data-fruit]');
    if (!button || button.disabled || !event.isPrimary || event.button !== 0) return;
    swipe = { pointer: event.pointerId, x: event.clientX, y: event.clientY, button };
    button.setPointerCapture(event.pointerId);
  }, { signal: events.signal });

  tray.addEventListener('touchmove', event => {
    // Keep a fruit swipe from consuming the next tap as part of the gesture.
    if (swipe) event.preventDefault();
  }, { signal: events.signal, passive: false });

  tray.addEventListener('pointerup', event => {
    if (swipe?.pointer !== event.pointerId) return;
    const { x, y, button } = swipe;
    swipe = null;
    if (Math.hypot(event.clientX - x, event.clientY - y) >= 20) cut(button);
  }, { signal: events.signal });

  tray.addEventListener('lostpointercapture', event => {
    if (swipe?.pointer === event.pointerId) swipe = null;
  }, { signal: events.signal });

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.hasAttribute('data-fruit')) cut(button);
    else if (button === next && reachedGoal() && !finished) {
      if (index === stages.length - 1) {
        finished = true;
        title.textContent = label('כָּל הַכָּבוֹד! חָתַכְתְּ אֶת הַפֵּרוֹת');
        step.textContent = '';
        prompt.hidden = tray.hidden = counter.hidden = replayButton.hidden = true;
        again.hidden = false;
        update();
        again.focus({ preventScroll: true });
      } else {
        index++;
        showStage();
        tray.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
        replay();
      }
    } else if (button === again && finished) {
      index = 0;
      finished = false;
      showStage();
      tray.querySelector('button').focus({ preventScroll: true });
      replay();
    }
  }, { signal: events.signal });

  showStage();
  return { replay, destroy() { events.abort(); } };
}
