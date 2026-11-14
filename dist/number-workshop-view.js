import { art, pup, uiIcon } from './art.js';
import { CLIPS } from './content.js?v=2.3.0-numbers';
import { NUMBER_PATHS, numberQuestion, numberQuestionClip, numberPrompt, numberModel, spokenNumber } from './number-workshop.js?v=2.3.0-numbers';

export const NUMBER_WORKSHOP_TITLE = 'סַדְנַת הַמִּסְפָּרִים';
const labelFor = (key, nikud) => nikud ? CLIPS[key].text : CLIPS[key].text.replace(/[\u0591-\u05bd\u05bf-\u05c7]/gu, '');
const bestMotion = () => !matchMedia('(prefers-reduced-motion: reduce)').matches;

export function numberMenu(drafts) {
  return `<main id="main" class="number-workshop">
    <button type="button" class="text-button back-button" data-action="home">${uiIcon('home')} לַבַּיִת</button>
    <section class="number-workshop-heading">
      <h1 tabindex="-1">${NUMBER_WORKSHOP_TITLE}</h1>
      <button type="button" class="circle-button" data-action="replay" aria-label="שמיעת ההוראות שוב">${uiIcon('sound')}</button>
    </section>
    <div class="number-paths">
      ${Object.entries(NUMBER_PATHS).map(([path, { title, icon }]) => {
        const draft = drafts[path];
        return `<button type="button" class="number-path number-path-${path}" data-action="number-start" data-path="${path}">
          ${art(icon)}<span>${title}</span>
          ${draft ? '<small>מַמְשִׁיכוֹת</small>' : ''}
        </button>`;
      }).join('')}
    </div>
  </main>`;
}

function groupPicture(count, item, start = 0) {
  if (!count) return '<div class="number-empty" data-model-step="empty"></div>';
  const columns = count <= 3 ? count : count <= 6 ? Math.ceil(count / 2) : 5;
  return `<div class="number-tokens" style="--columns:${columns}">
    ${Array.from({ length: count }, (_, index) => `<span data-model-step="${start + index}">${art(item)}</span>`).join('')}
  </div>`;
}

function tensPicture(count) {
  return `<div class="number-rods" style="--columns:${Math.min(count, 5)}">
    ${Array.from({ length: count }, (_, index) => `<span data-model-step="${index}" class="number-rod">${'<i></i>'.repeat(10)}</span>`).join('')}
  </div>`;
}

function questionPicture(path, task, solved, animate) {
  const { total, part, item, answer } = task;
  if (path === 'count') {
    return `<div class="number-scene number-count-scene" role="img" aria-label="קבוצה של ${total} פריטים">
      <div class="number-tray">${groupPicture(total, item)}</div>
    </div>`;
  }
  if (path === 'add') {
    const larger = total - part;
    return `<div class="number-scene number-add-scene" role="img" aria-label="${larger} ועוד ${part}">
      <div class="number-pair" dir="ltr">
        <div class="number-tray number-tray-first" data-model-step="large"><b>${larger}</b>${groupPicture(larger, item)}</div>
        <span class="number-plus">+</span>
        <div class="number-tray number-tray-second"><b>${part}</b>${groupPicture(part, item, larger)}</div>
      </div>
      <div class="number-equation" dir="ltr">${larger} + ${part} = <strong>${solved ? total : '?'}</strong></div>
    </div>`;
  }
  if (path === 'left') {
    return `<div class="number-scene number-left-scene${animate ? ' number-show-take' : ''}" role="img" aria-label="היו ${total} תפוחים. לולי לקחה ${part}.">
      <div class="number-pair" dir="rtl">
        <div class="number-tray number-basket">
          ${art('basket')}
          <div class="number-basket-items">${groupPicture(answer, item)}</div>
        </div>
        <span class="number-take-arrow">${uiIcon('arrow')}</span>
        <div class="number-tray number-recipient">${pup('luli')}${groupPicture(part, item)}</div>
      </div>
      <div class="number-equation" dir="ltr">${total} − ${part} = <strong>${solved ? answer : '?'}</strong></div>
    </div>`;
  }
  const tens = Math.floor(total / 10);
  return `<div class="number-scene number-tens-scene" role="img" aria-label="${tens} עשרות ו-${part} יחידות">
    <div class="number-pair" dir="rtl">
      <div class="number-tray number-tens-rods">${tensPicture(tens)}</div>
      <span class="number-plus">+</span>
      <div class="number-tray number-tens-ones">${groupPicture(part, item, tens)}</div>
    </div>
    <div class="number-equation" dir="ltr" ${solved ? '' : 'hidden'}>${solved ? `${tens * 10} + ${part} = <strong>${total}</strong>` : ''}</div>
  </div>`;
}

export function mountNumberRound(root, {
  round, nikud, motion, speak, audioEnabled, stopSpeaking, onSave, onObservation, onSuccess, onComplete,
}) {
  const events = new AbortController();
  let demonstration = 0;
  let showing = false;
  let feedback = '';
  let animate = false;
  const task = () => numberQuestion(round);
  const last = () => round.index === round.questions.length - 1;
  const prompt = () => numberPrompt(round.path, task(), round.index);
  const persist = () => { round.at = Date.now(); onSave(round); };
  const observe = (kind, index) => onObservation(task().itemKey, kind, index);
  const focus = selector => root.querySelector(selector)?.focus({ preventScroll: true });
  const markHelp = () => { if (!round.helped.includes(round.index)) round.helped.push(round.index); };

  function prepare() {
    observe('seen', round.index);
    persist();
  }

  function render() {
    const q = task();
    root.innerHTML = `<div class="number-round-top">
      <button type="button" class="text-button" data-action="number-menu">${uiIcon('arrow')} לַסַּדְנָה</button>
      <span aria-label="צעד ${round.index + 1} מתוך ${round.questions.length}">${round.index + 1} / ${round.questions.length}</span>
    </div>
    <div class="step-track" aria-hidden="true">${round.questions.map((_, i) => `<span class="step-dot ${i < round.index || i === round.index && round.resolved ? 'done' : i === round.index ? 'current' : ''}">${i + 1}</span>`).join('')}</div>
    <section class="number-board" aria-labelledby="number-question">
      <div class="number-question-heading">
        <h1 id="number-question" tabindex="-1">${labelFor(numberQuestionClip(round.path), nikud)}</h1>
        <button type="button" class="circle-button" data-action="replay" aria-label="שמיעת השאלה שוב">${uiIcon('sound')}</button>
      </div>
      ${questionPicture(round.path, q, round.resolved, animate && motion && bestMotion())}
      <div class="number-model-total" hidden dir="ltr" aria-live="off"></div>
      <div class="number-choices" role="group" aria-label="בחירת מספר">
        ${q.choices.map(n => {
          const correct = round.resolved && n === q.answer;
          const wrong = round.attempted.includes(n);
          return `<button type="button" class="number-answer${correct ? ' number-correct' : ''}${wrong ? ' number-wrong' : ''}"
            data-number-answer="${n}" dir="ltr" ${round.resolved || wrong ? 'disabled' : ''}>
            ${n}${correct ? uiIcon('check') : ''}
          </button>`;
        }).join('')}
      </div>
      <p class="number-feedback" role="status">${feedback || (round.resolved ? 'כָּל הַכָּבוֹד!' : '')}</p>
      <div class="number-round-actions">
        ${round.resolved ? `<button type="button" class="primary-button" data-number-step="next">${last() ? 'לַמַּדְבֵּקָה שֶׁלִּי' : 'מַמְשִׁיכוֹת'} ${uiIcon('arrow')}</button>`
          : `<button type="button" class="hint-button" data-number-step="hint">${uiIcon('hint')} רֶמֶז</button>`}
      </div>
      <p id="audio-notice" class="audio-notice" role="status" hidden></p>
    </section>`;
    animate = false;
  }

  function modelStep(step) {
    const group = root.querySelector(round.path === 'left' ? '.number-basket-items' : '.number-scene');
    group?.querySelector(`[data-model-step="${step.index}"]`)?.classList.add('number-counted');
    const readout = root.querySelector('.number-model-total');
    if (readout) { readout.textContent = step.number; readout.hidden = false; }
  }

  function cancelModel() {
    if (!showing) return;
    showing = false;
    demonstration++;
    const hint = root.querySelector('[data-number-step="hint"]');
    if (hint) hint.disabled = false;
  }

  async function showModel() {
    markHelp(); round.hint = true; persist();
    const id = ++demonstration;
    showing = true;
    const q = task(), model = numberModel(round.path, q);
    root.querySelector('[data-number-step="hint"]').disabled = true;
    root.querySelectorAll('.number-counted').forEach(node => node.classList.remove('number-counted'));
    root.querySelector('.number-model-total').hidden = true;
    const stillShowing = () => id === demonstration && !events.signal.aborted;
    if (audioEnabled()) await speak(model.intro);
    if (!stillShowing()) return;
    for (const step of model.steps) {
      modelStep(step);
      if (audioEnabled()) await speak(spokenNumber(step.number));
      else if (motion && bestMotion()) await new Promise(resolve => setTimeout(resolve, 270));
      if (!stillShowing()) return;
    }
    cancelModel();
    focus('[data-number-answer]:not(:disabled)');
  }

  function replay() {
    cancelModel();
    if (round.resolved) return speak(spokenNumber(task().answer));
    return speak(prompt());
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.numberStep === 'hint') { void showModel(); return; }
    if (button.dataset.numberStep === 'next' && round.resolved) {
      if (last()) { cancelModel(); onComplete(round); return; }
      round.index++;
      round.resolved = false; round.hint = false; round.attempted = []; feedback = '';
      animate = round.path === 'left';
      prepare(); render(); focus('#number-question');
      window.scrollTo({ top: 0, behavior: 'auto' });
      void replay();
      return;
    }
    if (!Object.hasOwn(button.dataset, 'numberAnswer') || round.resolved) return;
    cancelModel();
    const choice = Number(button.dataset.numberAnswer);
    const q = task();
    if (choice === q.answer) {
      round.resolved = true;
      feedback = 'כָּל הַכָּבוֹד!';
      observe(round.helped.includes(round.index) ? 'helped' : 'independent', round.index);
      persist(); render(); focus('[data-number-step="next"]');
      onSuccess();
      void speak([`correct-${1 + round.index % 3}`, ...spokenNumber(q.answer)]);
    } else {
      round.attempted.push(choice);
      markHelp(); persist(); feedback = 'נַסִּי שׁוּב.'; render();
      focus('[data-number-answer]:not(:disabled)');
      void speak(['try-again', ...prompt()]);
    }
  }, { signal: events.signal });

  animate = round.path === 'left' && !round.resolved && !round.attempted.length && !round.hint;
  prepare(); render();
  return {
    replay,
    destroy() {
      if (showing) { cancelModel(); stopSpeaking(); }
      events.abort();
    },
  };
}

export function numberComplete(round, sticker) {
  return `<main id="main" class="journey-complete number-workshop">
    <div class="journey-complete-art">${pup('tofi')}${art(sticker || 'star')}</div>
    <h1 tabindex="-1">כָּל הַכָּבוֹד!</h1>
    <div class="journey-controls">
      <button type="button" class="primary-button" data-action="album">לָאַלְבּוֹם שֶׁלִּי ${uiIcon('arrow')}</button>
      <button type="button" class="secondary-button" data-action="number-start" data-path="${round.path}">עוֹד סִיבּוּב</button>
      <button type="button" class="text-button" data-action="number-menu">לַסַּדְנָה</button>
    </div>
  </main>`;
}
