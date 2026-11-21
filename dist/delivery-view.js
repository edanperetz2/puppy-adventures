import { rewardSticker } from './playable-stickers.js';
import { DELIVERY, DELIVERY_MISSIONS, MY_JOURNEY } from './activities.js';
import { art, pup, uiIcon } from './art.js';
import { chapterMissions, chapterText } from './chapter-ui.js';
import { ANIMALS, CLIPS, COLORS } from './content.js';
import { advanceDelivery, DELIVERY_AUDIO } from './delivery.js';
import { mountDrag } from './drag.js';
import { recordingPreloader } from './offline-audio.js';

const pairTitle = 'מַקְשִׁיבוֹת לִשְׁתֵּי מִלִּים';
const palette = { blue: '#3685ca', red: '#d75758', yellow: '#f4c73f', green: '#43a16a', pink: '#ed83a6', purple: '#a47aca', orange: '#ed913f' };
const objects = { parcel: 'חבילה', bucket: 'דלי', ball: 'כדור', boat: 'סירה', gift: 'מתנה' };
const names = Object.fromEntries([...ANIMALS, ...COLORS].map(({ id, he }) => [id, he]));
const clipLabel = key => CLIPS[key].text;

function coloredObject(object, color) {
  const paint = palette[color];
  const shapes = {
    boat: `<path d="M39 133h137l-24 38H68z" fill="#ae7449"/><path d="M103 39v95" stroke="#7b6048" stroke-width="7" stroke-linecap="round"/><path d="M94 44v81H41z" fill="${paint}" stroke="#355966" stroke-width="3"/><path d="M112 59l40 65h-40z" fill="#f9f2db"/><path d="M28 178q22-12 44 0t44 0t44 0t44 0" fill="none" stroke="#62acbd" stroke-width="7" stroke-linecap="round"/>`,
    ball: `<circle cx="110" cy="110" r="69" fill="${paint}" stroke="#355966" stroke-width="4"/><path d="M61 101c7-22 31-42 52-38M108 169c31 2 57-18 61-45" fill="none" stroke="#fff" stroke-opacity=".54" stroke-width="8" stroke-linecap="round"/>`,
    bucket: `<path d="M59 93a51 51 0 0 1 102 0" fill="none" stroke="#547077" stroke-width="10"/><path d="M53 91h114l-14 87H67z" fill="${paint}" stroke="#355966" stroke-width="4" stroke-linejoin="round"/><rect x="49" y="81" width="122" height="20" rx="9" fill="${paint}" stroke="#355966" stroke-width="4"/><path d="m75 117 7 42" stroke="#fff" stroke-opacity=".48" stroke-width="7" stroke-linecap="round"/>`,
    parcel: `<rect x="41" y="62" width="138" height="103" rx="15" fill="${paint}" stroke="#355966" stroke-width="4"/><path d="M42 98h136M108 62v102" stroke="#fff5dc" stroke-width="12"/><path d="M109 69c-48 0-42-43-10-26l10 18 12-18c29-17 37 26-12 26z" fill="#fff5dc"/>`,
  };
  return `<svg viewBox="20 27 181 163" aria-hidden="true">${shapes[object]}</svg>`;
}

function choicePicture(q, value) {
  if (q.kind === 'color') return coloredObject(q.art, value);
  if (q.kind === 'pair') {
    const [color, object] = value.split('-');
    return coloredObject(object, color);
  }
  return art(value);
}

function choiceLabel(q, value) {
  const colorOf = (object, color) => `${objects[object]}, צבע ${names[color]}`;
  if (q.kind === 'color') return colorOf(q.art, value);
  if (q.kind === 'pair') {
    const [color, object] = value.split('-');
    return colorOf(object, color);
  }
  return names[value] || objects[value];
}

export function deliveryScene(finished = []) {
  return `<div class="delivery-landscape" aria-hidden="true">
    <span class="delivery-sun"></span><span class="delivery-island"></span><span class="delivery-ripple"></span>
    ${art('tree', 'delivery-land-tree')}${art('boat', 'delivery-land-boat')}${pup('bobi', 'delivery-land-bobi')}
    ${finished.includes('cargo') ? art('gift', 'delivery-land-gift') : ''}
    ${finished.includes('aboard') ? art('duck', 'delivery-land-duck') : ''}
    ${finished.includes('route') ? art('cat', 'delivery-land-cat') : ''}
  </div>`;
}

export function deliveryMap(progress, pairReady, nikud) {
  const label = chapterText(nikud);
  const ready = progress.finished.length === Object.keys(DELIVERY_MISSIONS).length;
  return `<main id="main" class="picnic-page delivery-page">
    <button class="text-button back-button" data-action="${MY_JOURNEY.route.action}">${uiIcon('arrow')} ${label('לַמַּסָּע שֶׁלִּי')}</button>
    <section class="picnic-map-hero">
      ${deliveryScene(progress.finished)}
      <div class="picnic-map-title"><p>${label(MY_JOURNEY.he[0])}</p><h1 tabindex="-1">${label(DELIVERY.chapter)}</h1>
        <p>${label(ready ? 'כָּל הַמִּשְׁלוֹחִים הִגִּיעוּ!' : DELIVERY.detail)}</p></div>
    </section>
    ${chapterMissions(DELIVERY_MISSIONS, progress, 'delivery-start', 'delivery', label)}
    ${pairReady ? `<button class="secondary-button delivery-bonus" data-action="delivery-bonus">${uiIcon('sound')} ${label(pairTitle)} ${uiIcon('arrow')}</button>` : ''}
  </main>`;
}

export function deliveryComplete(round, sticker, finished, nikud) {
  const label = chapterText(nikud);
  const ready = finished.length === Object.keys(DELIVERY_MISSIONS).length;
  return `<main id="main" class="picnic-page picnic-result delivery-page">
    ${deliveryScene(finished)}${rewardSticker(sticker, DELIVERY_MISSIONS[round.path].icon, 'picnic-sticker')}
    <h1 tabindex="-1">${label(ready ? 'כָּל הַמִּשְׁלוֹחִים הִגִּיעוּ!' : 'כָּל הַכָּבוֹד, הִשְׁלַמְתְּ אֶת הַמְּשִׂימָה!')}</h1>
    <p>${label(sticker ? 'מַדְבֵּקָה חֲדָשָׁה הִצְטָרְפָה לָאַלְבּוֹם.' : 'הַמְּשִׂימָה נִשְׁמְרָה.')}</p>
    <div class="picnic-result-actions">
      <button class="primary-button" data-action="${DELIVERY.route.action}">${label('לְמַפַּת הַמִּשְׁלוֹחִים')} ${uiIcon('arrow')}</button>
      <button class="secondary-button" data-action="album">${label('לָאַלְבּוֹם שֶׁלִּי')}</button></div>
  </main>`;
}

export const prepareDeliveryAudio = recordingPreloader(DELIVERY_AUDIO);

export function mountDeliveryRound(root, { round, nikud, motion, play, onSave, onSuccess, onComplete, focusTitle }) {
  const label = chapterText(nikud);
  const bonus = round.path === 'pair', route = round.path === 'route', aboard = round.path === 'aboard';
  const mission = bonus ? { title: pairTitle, prompt: 'delivery-pair' } : DELIVERY_MISSIONS[round.path];
  const question = () => round.questions[round.index];
  const model = () => !bonus && round.index === 0;
  const last = () => round.index === round.questions.length - 1;
  const find = selector => root.querySelector(selector);
  const controls = new AbortController();
  let alive = true, heard = false, request = 0, loading = false;

  function note(text, success = false) {
    const feedback = find('.picnic-feedback');
    feedback.textContent = label(text);
    feedback.classList.toggle('is-correct', success);
  }

  async function listen({ manual = false, instructions = false, afterRetry = false } = {}) {
    if (round.resolved) {
      if (manual) await play(instructions ? [mission.prompt, question().clip] : question().clip, true);
      return true;
    }
    const attempt = ++request;
    loading = true;
    const button = find('[data-delivery-action="listen"]');
    button.classList.add('is-speaking');
    button.setAttribute('aria-busy', 'true');
    const played = await play([...(instructions ? [mission.prompt] : afterRetry ? ['try-again'] : []), question().clip], manual);
    if (!alive || attempt !== request) return false;
    loading = false;
    heard ||= played === true;
    root.dataset.deliveryAudio = heard ? 'ready' : 'waiting';
    button.classList.remove('is-speaking');
    button.removeAttribute('aria-busy');
    for (const choice of root.querySelectorAll('[data-delivery-choice]')) {
      choice.disabled = !heard || round.resolved || round.state.attempted.includes(choice.dataset.deliveryChoice);
    }
    if (!heard) note(navigator.onLine
      ? 'כְּדֵי לִשְׁמֹעַ, לִחְצִי עַל הָרַמְקוֹל.'
      : 'אֶפְשָׁר לְנַסּוֹת שׁוּב כְּשֶׁיִּהְיֶה אִינְטֶרְנֶט.');
    return heard;
  }

  function showBoard() {
    const q = question(), done = round.resolved;
    const cards = q.choices.map(value => {
      const right = value === q.answer;
      const sent = right && done;
      const disabled = !heard || done || round.state.attempted.includes(value);
      return `<button class="delivery-piece${sent ? ' is-delivered' : ''}${round.state.hint && right && !done ? ' has-clue' : ''}"
        data-delivery-choice="${value}" ${route ? 'data-delivery-target' : 'data-delivery-source'}
        aria-label="${choiceLabel(q, value)}" ${disabled ? 'disabled' : ''}>
        <span class="delivery-picture">${choicePicture(q, value)}</span>
        ${sent && route ? `<span class="delivery-given">${art('gift')}</span>` : ''}
        ${sent ? `<span class="delivery-check" aria-hidden="true">${uiIcon('check')}</span>` : ''}
      </button>`;
    }).join('');
    const dropArt = aboard ? `${art('boat')}${pup('bobi', 'delivery-boat-bobi')}` : art('basket');
    const destination = aboard ? 'סירה' : 'סל';
    find('.delivery-board-slot').innerHTML = `<div class="delivery-board delivery-${q.scene}">
      <div class="delivery-choices" role="group" aria-label="${label('בְּחִירָה')}">${cards}</div>
      ${route ? `<div class="delivery-landing">
        <button class="delivery-parcel" data-delivery-source aria-label="הזזת החבילה" ${done ? 'disabled' : ''}>${art('gift')}</button>
        </div>` : `<div class="delivery-landing"><div class="delivery-drop" data-delivery-target aria-label="${destination}">
        ${dropArt}${done ? `<span class="delivery-given">${choicePicture(q, q.answer)}</span>` : ''}
      </div></div>`}
    </div>`;
  }

  function show(cameBack = false) {
    find('[data-delivery-action="next"]').hidden = false;
    find('[data-delivery-action="hint"]').hidden = true;
    const demonstration = find('[data-delivery-action="model"]');
    if (demonstration) demonstration.hidden = true;
    note(model() ? 'הִצְלַחְנוּ!' : 'כָּל הַכָּבוֹד, הִצְלַחְתְּ!', true);
    if (!cameBack) find('[data-delivery-action="next"]').focus({ preventScroll: true });
  }

  function showStep() {
    heard = false; loading = false; ++request;
    root.dataset.deliveryAudio = 'waiting';
    root.innerHTML = `<div class="picnic-topline">
      <button class="text-button back-button" data-action="${DELIVERY.route.action}">${uiIcon('arrow')} ${label('לְמַפַּת הַמִּשְׁלוֹחִים')}</button>
      ${bonus ? '' : `<span>${label(`צַעַד ${round.index + 1} מִתּוֹךְ ${round.questions.length}`)}</span>`}
    </div>
    ${bonus ? '' : `<div class="picnic-track" aria-hidden="true">${round.questions.map((_, i) =>
      `<span class="${i < round.index ? 'passed' : i === round.index ? 'current' : ''}"></span>`).join('')}</div>`}
    <section class="picnic-step-card delivery-step">
      <div class="picnic-task-title"><h1 tabindex="-1">${label(mission.title)}</h1></div>
      <p class="delivery-cue">${label(clipLabel(mission.prompt))}</p>
      <button class="primary-button delivery-listen" data-delivery-action="listen">${uiIcon('sound')} ${label(bonus ? 'שִׁמְעִי אֶת הַצֵּרוּף' : 'שִׁמְעִי אֶת הַמִּלָּה')}</button>
      <div class="delivery-board-slot"></div>
      <p class="picnic-feedback" role="status"></p>
      <div class="picnic-controls">
        ${model() ? `<button class="secondary-button" data-delivery-action="model">${label('הַרְאִי לִי')}</button>` : ''}
        <button class="text-button" data-delivery-action="hint" ${model() ? 'hidden' : ''}>${uiIcon('hint')} ${label('רֶמֶז')}</button>
        <button class="primary-button" data-delivery-action="next" hidden>${label(bonus ? 'לְמַפַּת הַמִּשְׁלוֹחִים' : last() ? 'לַמַּדְבֵּקָה שֶׁלִּי' : 'לַצַּעַד הַבָּא')} ${uiIcon('arrow')}</button>
      </div>
    </section>`;
    showBoard();
    if (round.resolved) show(true);
    else if (round.state.hint) note('שִׂימִי לֵב לַתְּמוּנָה הַמֻּדְגֶּשֶׁת.');
  }

  function recordHelp() {
    if (!round.helped.includes(round.index)) round.helped.push(round.index);
  }

  function send(value, origin) {
    const q = question();
    if (round.resolved || !q.choices.includes(value) || round.state.attempted.includes(value)) return;
    if (!heard) { if (!loading) void listen({ manual: true }); return; }
    if (value !== q.answer) {
      round.state.attempted.push(value); recordHelp(); onSave(round);
      const failed = find(`[data-delivery-choice="${value}"]`);
      failed.disabled = true;
      failed.classList.add('was-tried');
      if (motion()) failed.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(5px)' },
        { transform: 'translateX(-4px)' }, { transform: 'translateX(0)' }], { duration: 220 });
      note('נַסִּי שׁוּב. הַקְשִׁיבִי.');
      void listen({ afterRetry: true });
      find('[data-delivery-choice]:not(:disabled)')?.focus({ preventScroll: true });
      return;
    }
    round.resolved = true;
    onSave(round); onSuccess(round);
    showBoard(); show();
    const arrived = find('.delivery-given');
    if (origin && arrived && motion()) {
      const target = arrived.getBoundingClientRect();
      const x = origin.left + origin.width / 2 - target.left - target.width / 2;
      const y = origin.top + origin.height / 2 - target.top - target.height / 2;
      arrived.animate([{ transform: `translate(${x}px,${y}px) scale(.84)` }, { transform: 'none' }],
        { duration: 340, easing: 'cubic-bezier(.25,.72,.24,1)' });
    }
    if (!model()) void play('correct-1');
  }

  function choose(button, recipient = button) {
    const value = recipient.dataset.deliveryChoice;
    const source = route ? find('.delivery-parcel') : button.querySelector('.delivery-picture');
    if (value) send(value, source?.getBoundingClientRect());
  }

  function tapPiece(button) {
    if (!route) { choose(button); return; }
    if (!heard && !loading) void listen({ manual: true });
    find('[data-delivery-choice]:not(:disabled)')?.focus({ preventScroll: true });
  }

  async function demonstrate(button) {
    if (button.disabled || round.resolved) return;
    button.disabled = true;
    if (!heard) await listen({ manual: true });
    if (!alive || !button.isConnected || round.resolved) return;
    if (heard) choose(find(`[data-delivery-choice="${question().answer}"]`));
    else button.disabled = false;
  }

  const acceptsClick = mountDrag(root, {
    sources: '[data-delivery-source]', targets: '[data-delivery-target]:not(:disabled)', signal: controls.signal,
    onTouchTap: tapPiece,
    onDrop: (source, target) => route ? choose(source, target) : choose(source),
  });
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled || !root.contains(button)) return;
    if (button.dataset.deliveryChoice && acceptsClick(event, button)) choose(button);
    if (button.classList.contains('delivery-parcel') && acceptsClick(event, button)) tapPiece(button);
    const action = button.dataset.deliveryAction;
    if (action === 'listen' && !round.resolved) note('');
    if (action === 'listen') void listen({ manual: true });
    if (action === 'model') void demonstrate(button);
    if (action === 'hint' && !round.resolved) {
      recordHelp(); round.state.hint = true; onSave(round);
      find(`[data-delivery-choice="${question().answer}"]`).classList.add('has-clue');
      note('שִׂימִי לֵב לַתְּמוּנָה הַמֻּדְגֶּשֶׁת.'); void listen({ manual: true });
    }
    if (action === 'next' && round.resolved) {
      if (last()) onComplete(round);
      else if (advanceDelivery(round)) {
        onSave(round); showStep(); focusTitle(); void listen();
      }
    }
  }, { signal: controls.signal });
  showStep();
  return {
    start: () => { if (!round.resolved) void listen({ instructions: true }); },
    replay: () => listen({ manual: true, instructions: true }),
    destroy() { alive = false; controls.abort(); },
  };
}
