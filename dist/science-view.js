import { art, uiIcon } from './art.js?v=2.7.0-science';
import { shuffle } from './answer-order.js';
import { dropTargetAt } from './drag.js';
import { SCIENCE_TITLE, SCIENCE_EXPERIMENTS, SCIENCE_ACTIONS, SCIENCE_CLIPS, scienceClip } from './science-content.js?v=2.7.1-pepper';

const localText = (text, nikud) => nikud ? text : text.replace(/[\u0591-\u05bd\u05bf-\u05c7]/gu, '');
const clipText = key => SCIENCE_CLIPS[scienceClip(key)].text;
const pictures = {
  layers: '<i class="lab-layer-symbol"></i>',
  mix: '<i class="lab-layer-symbol mixed"></i>',
  float: '<i class="lab-float-symbol"></i>',
  sink: '<i class="lab-float-symbol sunk"></i>',
  'pepper-moves': '<i class="lab-pepper-choice lab-pepper-choice-spread"></i>',
  'pepper-stays': '<i class="lab-pepper-choice"></i>',
};
const toolEffects = new Set(['water', 'oil', 'spoon', 'soap', 'cork', 'wood', 'rock', 'cold-ice', 'warm-ice', 'pepper', 'water-drop']);
const cold = 'מַיִם קָרִים';
const warm = 'מַיִם חַמִּים';

export function scienceArt(name) {
  if (name === 'look') return uiIcon('hint');
  if (pictures[name]) return pictures[name];
  if (['water', 'oil', 'soap', 'cork', 'wood', 'pepper'].includes(name)) return `<i class="lab-prop lab-prop-${name}"></i>`;
  return art({ warm: 'sun', cold: 'ice', timer: 'clock' }[name] || name);
}

export function scienceMenu(saved, nikud) {
  return `<main class="lab-page" id="main">
    <button class="text-button back-button" data-action="home">${uiIcon('home')} לַבַּיִת</button>
    <div class="lab-heading"><h1 tabindex="-1">${localText(SCIENCE_TITLE, nikud)}</h1><button class="circle-button" data-action="replay" aria-label="שמיעת ההוראות שוב">${uiIcon('sound')}</button></div>
    <div class="lab-paths">${Object.entries(SCIENCE_EXPERIMENTS).map(([path, { title, icon }]) => `
      <button class="lab-path lab-path-${path}" data-action="science-start" data-path="${path}">
        <span class="lab-picture" aria-hidden="true">${scienceArt(icon)}</span><strong>${localText(title, nikud)}</strong>
        ${saved[path] ? `<small>${saved[path].complete ? uiIcon('check') + ' סִיַּמְנוּ' : 'מַמְשִׁיכוֹת'}</small>` : ''}
      </button>`).join('')}</div>
    <p id="audio-notice" class="audio-notice" role="status" hidden></p>
  </main>`;
}

function glass({ water = true, contents = '', label = '', state = '', drop = 'main', css = '' }) {
  return `<div class="lab-glass-case ${css}" data-lab-drop="${drop}" data-liquid="${state}">
    <div class="lab-glass">
      <div class="lab-cup-fill"><i class="lab-water"${water ? '' : ' hidden'}></i>${contents}</div>
      <i class="lab-glass-rim"></i>
    </div>${label ? `<span class="lab-cup-label">${label}</span>` : ''}</div>`;
}

function liquidGlass(state, label = '', drop = 'main') {
  const band = ['layers', 'soapy-layers'].includes(state);
  const contents = `${band ? '<i class="lab-oil-layer"></i>' : ''}
    ${state === 'soapy-layers' ? '<i class="lab-soap-drop"></i>' : ''}
    ${band || state === 'droplets' ? '<i class="lab-oil-dots"></i>' : ''}`;
  return glass({ water: state !== 'empty', contents, state, label, drop });
}

// Keep each grain visible as it is carried from its original spot toward the rim.
const pepperGrains = Array.from({ length: 32 }, (_, index) => {
  const angle = index * 2.4;
  const radius = 5 + 35 * Math.sqrt(index / 31);
  const edge = 35 + radius * .23 + (index * 7 % 11) * .25;
  const x = Math.cos(angle);
  const y = Math.sin(angle);
  const position = (distance, direction) => (50 + distance * direction).toFixed(2);
  const dx = ((radius - edge) * x).toFixed(2);
  const dy = ((radius - edge) * y).toFixed(2);
  return `<i class="lab-pepper-grain" style="--x:${position(radius, x)}%;--y:${position(radius, y)}%;--edge-x:${position(edge, x)}%;--edge-y:${position(edge, y)}%;--dx:${dx}cqw;--dy:${dy}cqh;--grain:${2 + index % 3}px;--delay:${index * 11 % 215}ms"></i>`;
}).join('');

function pepperDishes(state, step, effect, text) {
  const sprinkled = ['sprinkled', 'water-tested', 'soap-tested'].includes(state);
  const compared = state === 'soap-tested';
  const sharedDrop = step.actions.includes('water') || step.actions.includes('pepper');
  const dishes = [
    { id: 'water-drop', dish: 'צַלַּחַת 1', tested: state === 'water-tested' || compared, label: 'טִפַּת מַיִם' },
    { id: 'soap', dish: 'צַלַּחַת 2', tested: compared, label: 'טִפַּת סַבּוֹן' },
  ];
  return `<div class="lab-pepper-pair">${dishes.map(({ id, dish, tested, label }) => {
    const active = !tested && step.actions.includes(id);
    const dropping = effect === id;
    return `<div class="lab-pepper-dish" data-dish="${id}" data-tested="${tested}" data-dropping="${dropping}">
      <div class="lab-pepper-bowl${active ? ' lab-pepper-target' : ''}" data-lab-drop="${sharedDrop ? 'main' : id}">
        <div class="lab-pepper-surface${state === 'empty' ? '' : ' lab-pepper-wet'}">
          ${sprinkled ? pepperGrains : ''}${dropping ? '<i class="lab-pepper-ripple"></i>' : ''}
        </div>
        ${dropping ? '<i class="lab-pepper-drop"></i>' : ''}
      </div>
      <span class="lab-cup-label">${text(tested ? label : dish)}</span>
    </div>`;
  }).join('')}</div>`;
}

function experimentScene(path, state, step, effect, text) {
  if (path === 'pepper') return pepperDishes(state, step, effect, text);
  if (path === 'liquids') {
    const compare = state === 'soapy-layers' || state === 'droplets';
    const cups = compare
      ? liquidGlass('layers', text('בְּלִי סַבּוֹן'), 'control') + liquidGlass(state, text('עִם סַבּוֹן'))
      : liquidGlass(state);
    return `<div class="lab-cups">${cups}</div>`;
  }
  if (path === 'floating') {
    const objects = { empty: [], cork: ['cork'], both: ['cork', 'rock'], three: ['cork', 'rock', 'wood'] }[state];
    return `<div class="lab-cups">${glass({ css: 'lab-tank', contents: objects.map(id => `
      <span class="lab-object lab-object-${id}">${scienceArt(id)}</span>`).join('') })}
      ${step.sample && !effect ? `<span class="lab-sample lab-picture">${scienceArt(step.sample)}</span>` : ''}</div>`;
  }
  return `<div class="lab-cups lab-pair">${[['cold', cold, 'cold-ice'], ['warm', warm, 'warm-ice']].map(([id, title, drop]) => {
    const present = state !== 'empty' && (id === 'cold' || state !== 'cold');
    const ice = present ? `<span class="lab-ice">${scienceArt('ice')}</span>` : '';
    return glass({ contents: ice, css: `lab-temperature lab-${id}`, drop, state, label: `${scienceArt(id)}${text(title)}` });
  }).join('')}</div>`;
}

export function mountScience(root, { path, saved, nikud, motion, speak, onSave, onFinish, onRestart }) {
  const { title, steps } = SCIENCE_EXPERIMENTS[path];
  const text = value => localText(value, nikud);
  const events = new AbortController();
  const listen = (type, handler) => root.addEventListener(type, handler, { signal: events.signal });
  const ordered = steps.map(step => shuffle(step.actions));
  let state = saved || { index: 0, actions: [], complete: false };
  let drag = null, suppressClick = null;
  const step = () => steps[state.index];
  const selection = () => state.actions[state.index];

  function actionLabel(id, current) {
    const action = SCIENCE_ACTIONS[id];
    return text(current.sample === 'rock' && action.feminine ? action.feminine : action.label);
  }

  function render(effect = '') {
    const current = step(), selected = selection();
    const guess = state.actions[current.observes];
    const observed = !guess ? '' : `<p class="lab-guess-memory"><span>${text('הַנִּחוּשׁ שֶׁלָּךְ')}</span>
      <span class="lab-picture" aria-hidden="true">${scienceArt(SCIENCE_ACTIONS[guess].icon)}</span><b>${actionLabel(guess, steps[current.observes])}</b></p>`;
    const figureLabel = selected && current.actions.length === 1 ? clipText(current.result) : text('שֻׁלְחַן הַנִּסּוּי');
    const scene = selected ? current.after : current.before;
    const field = `<div class="lab-stage lab-stage-${path}" data-effect="${effect}" data-lab-scene="${scene}" role="img" aria-label="${text(figureLabel)}">
      ${experimentScene(path, scene, current, effect, text)}
      ${path !== 'pepper' && ['water', 'oil', 'soap', 'spoon', 'time'].includes(effect) ? `<span class="lab-in-motion lab-picture">${scienceArt(SCIENCE_ACTIONS[effect].icon)}</span>` : ''}
    </div>`;
    const buttons = ordered[state.index].map(id => `<button class="lab-tool${toolEffects.has(id) ? ' lab-draggable' : ''}" data-lab-action="${id}" type="button" ${selected ? ' disabled' : ''}>
      <span class="lab-picture" aria-hidden="true">${scienceArt(SCIENCE_ACTIONS[id].icon)}</span><span>${actionLabel(id, current)}</span></button>`).join('');
    root.innerHTML = `<button class="text-button back-button" data-action="science-menu">${uiIcon('home')} ${text('לַמַּעְבָּדָה')}</button>
      <div class="lab-heading"><h1 tabindex="-1">${text(title)}</h1><button class="circle-button replay-button" data-action="replay" aria-label="שמיעת ההוראות שוב">${uiIcon('sound')}</button></div>
      <div class="lab-progress"><span>${text('צַעַד')} <b>${state.index + 1}</b> ${text('מִתּוֹךְ')} <b>${steps.length}</b></span><progress max="${steps.length}" value="${state.actions.length}" aria-label="התקדמות בניסוי"></progress></div>
      <section class="lab-board">
        <h2 class="lab-prompt" tabindex="-1">${text(clipText(state.complete ? 'done' : current.prompt))}</h2>
        ${field}
        <div class="lab-result" role="status" ${selected ? '' : 'hidden'}><p ${effect ? 'hidden' : ''}>${text(clipText(current.result))}</p>${observed}</div>
        ${state.complete ? `<div class="lab-continue"><button class="primary-button" data-action="science-menu">${text('עוֹד נִסּוּי')} ${uiIcon('arrow')}</button>
          <button class="secondary-button" data-lab-restart>${text('מְנַסּוֹת שׁוּב')} ${uiIcon('again')}</button></div>` :
        `<div class="lab-continue" ${selected && !effect ? '' : 'hidden'}><button class="primary-button" data-lab-next>${text(state.index === steps.length - 1 ? 'סִיַּמְנוּ!' : 'מַמְשִׁיכוֹת')} ${uiIcon('arrow')}</button></div>`}
        ${selected ? '' : `<div class="lab-tools">${buttons}</div>`}
        <p id="audio-notice" class="audio-notice" role="status" hidden></p>
      </section>`;
  }

  function replay() { speak(scienceClip(state.complete ? 'done' : selection() ? step().result : step().prompt)); }
  function save(update) {
    state = { ...state, ...update, at: Date.now() };
    onSave(state);
  }
  function doAction(id) {
    const current = step();
    if (selection() || !current.actions.includes(id)) return;
    save({ actions: [...state.actions, id] });
    const effect = motion() && (toolEffects.has(id) || id === 'time') ? id : '';
    render(effect);
    const reveal = () => {
      root.querySelector('.lab-result > p').hidden = false;
      const button = root.querySelector('[data-lab-next]');
      button.parentElement.hidden = false;
      if (document.activeElement === document.body || root.contains(document.activeElement)) button.focus({ preventScroll: true });
      replay();
    };
    const running = effect ? root.querySelector('.lab-stage').getAnimations?.({ subtree: true }) ?? [] : [];
    if (running.length) {
      void Promise.allSettled(running.map(animation => animation.finished)).then(() => {
        if (!events.signal.aborted) reveal();
      });
    } else reveal();
  }

  listen('click', event => {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.hasAttribute('data-lab-restart')) { onRestart(); return; }
    if (button.hasAttribute('data-lab-next') && selection() && !state.complete && !button.parentElement.hidden) {
      const last = state.index === steps.length - 1;
      save(last ? { complete: true } : { index: state.index + 1 });
      render();
      root.querySelector('.lab-prompt').focus({ preventScroll: true });
      replay();
      if (last) onFinish();
      return;
    }
    if (button.dataset.labAction && (button !== suppressClick || !event.detail)) doAction(button.dataset.labAction);
  });

  function dropAt(event) {
    const zone = dropTargetAt(root.querySelectorAll('[data-lab-drop]'), event.clientX, event.clientY);
    return zone && ['main', drag.id].includes(zone.dataset.labDrop) ? zone : null;
  }
  function clearDrag() {
    drag?.ghost?.remove();
    drag?.zone?.classList.remove('lab-drop-ready');
    drag = null;
  }
  listen('pointerdown', event => {
    suppressClick = null;
    const button = event.target.closest('.lab-draggable');
    if (!button || event.button !== 0 || !event.isPrimary || !button.setPointerCapture) return;
    button.setPointerCapture(event.pointerId);
    drag = { button, x: event.clientX, y: event.clientY, id: button.dataset.labAction, pointer: event.pointerId };
  });
  root.addEventListener('touchmove', event => {
    if (drag) event.preventDefault();
  }, { signal: events.signal, passive: false });
  listen('pointermove', event => {
    if (event.pointerId !== drag?.pointer) return;
    if (!drag.ghost) {
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 8) return;
      drag.ghost = document.createElement('span');
      drag.ghost.className = 'lab-drag-ghost lab-picture';
      drag.ghost.setAttribute('aria-hidden', 'true');
      drag.ghost.innerHTML = scienceArt(SCIENCE_ACTIONS[drag.id].icon);
      document.body.append(drag.ghost);
    }
    drag.ghost.style.left = `${event.clientX}px`;
    drag.ghost.style.top = `${event.clientY}px`;
    drag.zone?.classList.remove('lab-drop-ready');
    drag.zone = dropAt(event);
    drag.zone?.classList.add('lab-drop-ready');
  });
  listen('pointerup', event => {
    if (event.pointerId !== drag?.pointer) return;
    const { id, button, ghost } = drag;
    const landed = ghost && dropAt(event);
    if (ghost) suppressClick = button;
    clearDrag();
    if (landed) doAction(id);
  });
  for (const type of ['pointercancel', 'lostpointercapture']) listen(type, event => {
    if (event.pointerId === drag?.pointer) clearDrag();
  });
  render();
  return { replay, destroy() { events.abort(); clearDrag(); } };
}
