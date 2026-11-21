import { rewardSticker } from './playable-stickers.js';
import { MY_JOURNEY, THEATER, THEATER_SHOWS } from './activities.js';
import { art, pup, uiIcon } from './art.js';
import { chapterMissions, chapterText } from './chapter-ui.js';
import { CLIPS } from './content.js';
import { mountDrag, mountTouchControls } from './drag.js';
import { recordingPreloader } from './offline-audio.js';
import { THEATER_ACTORS, THEATER_PROPS, THEATER_SETS, initialStage } from './theater.js';
import { THEATER_CLIPS } from './theater-content.js';

const backdrop = './assets/theater-stage.webp';
const theaterKeys = Object.keys(THEATER_CLIPS);
const basicFeedback = ['daily-example', 'daily-fresh', 'try-again', 'correct-1'];
const preloads = {
  map: recordingPreloader([THEATER.intro]),
  backstage: recordingPreloader([...theaterKeys.filter(key => !/^theater-(?:party-|shadow-|studio|cast|welcome)/u.test(key)), ...basicFeedback]),
  party: recordingPreloader([...theaterKeys.filter(key => key.startsWith('theater-party-')), ...basicFeedback]),
  shadow: recordingPreloader([...theaterKeys.filter(key => key.startsWith('theater-shadow-')), ...basicFeedback]),
  studio: recordingPreloader(['theater-studio', 'theater-cast', 'en-duck', 'en-bird', 'en-rabbit', 'theater-closed-door', 'theater-closed-gate', 'theater-prop-missing', 'try-again', 'correct-1']),
};
export const prepareTheaterAudio = path => preloads[path]?.();
const clip = key => CLIPS[key].text;
const name = id => THEATER_ACTORS[id];

const unpointed = chapterText(false);
export const theaterText = nikud => nikud ? chapterText(true) : text => unpointed(text)
  .replaceAll('ברכה', 'בריכה').replaceAll('הפעלות', 'הפעולות');

export const actorArt = (id, css) => ['bobi', 'luli', 'tofi'].includes(id) ? pup(id, css) : art(id, css);
const play = '<span class="th-play-icon" aria-hidden="true">▶</span>';
export const playButton = (label, { action = 'play', disabled = false, text = 'הַצָּגָה!' } = {}) =>
  `<button type="button" class="primary-button th-play" data-th-action="${action}" ${disabled ? 'disabled' : ''}>${play} ${label(text)}</button>`;

export function theaterPreview() {
  return `<span class="th-chapter-preview" aria-hidden="true">${actorArt('luli')}${art('star', 'th-preview-star')}</span>`;
}

export const stagePicture = () => `<img class="th-backdrop" src="${backdrop}" width="1120" height="630" alt="" decoding="async">`;

export function theaterMap(memory, nikud) {
  const label = theaterText(nikud);
  return `<main id="main" class="picnic-page theater-page th-menu">
    <button class="text-button back-button" data-action="${MY_JOURNEY.route.action}">${uiIcon('arrow')} ${label('לַמַּסָּע שֶׁלִּי')}</button>
    <section class="th-map-hero">
      <div class="th-map-art" aria-hidden="true">${stagePicture()}${actorArt('bobi', 'th-map-bobi')}${actorArt('luli', 'th-map-luli')}${actorArt('tofi', 'th-map-tofi')}</div>
      <div class="th-map-copy"><div class="picnic-task-title"><h1 tabindex="-1">${label(THEATER.chapter)}</h1>
        <button class="circle-button" data-action="replay" aria-label="השמעת ההוראה">${uiIcon('sound')}</button></div><p>${label(THEATER.detail)}</p></div>
    </section>
    ${chapterMissions(THEATER_SHOWS, memory, 'theater-start', 'th-show', label)}
    <section class="th-studio-entry"><span aria-hidden="true">${art('star')}</span><div><h2>${label('הַהַצָּגוֹת שֶׁלִּי')}</h2>
      <p>${label('בּוֹחֲרוֹת בָּמָה וּבּוּבָה וּמַמְצִיאוֹת הַצָּגָה.')}</p></div>
      <button class="primary-button" data-action="theater-studio">${label('לַבָּמָה שֶׁלִּי')} ${uiIcon('arrow')}</button></section>
  </main>`;
}

export function theaterComplete(round, sticker, nikud) {
  const label = theaterText(nikud);
  return `<main id="main" class="picnic-page picnic-result theater-page th-result">
    <div class="th-map-art" aria-hidden="true">${stagePicture()}${actorArt('luli', 'th-map-luli')}${actorArt('bobi', 'th-map-bobi')}${actorArt('tofi', 'th-map-tofi')}</div>
    ${rewardSticker(sticker, THEATER_SHOWS[round.path].icon, 'picnic-sticker')}
    <h1 tabindex="-1">${label('כָּל הַכָּבוֹד, הַהַצָּגָה הֻשְׁלְמָה!')}</h1>
    <p>${label(sticker ? 'מַדְבֵּקָה חֲדָשָׁה הִצְטָרְפָה לָאַלְבּוֹם.' : 'הַהַצָּגָה נִשְׁמְרָה.')}</p>
    <div class="picnic-result-actions"><button class="primary-button" data-action="theater">${label('לַתֵּאַטְרוֹן')} ${uiIcon('arrow')}</button>
      <button class="secondary-button" data-action="album">${label('לָאַלְבּוֹם שֶׁלִּי')}</button></div>
  </main>`;
}

export function stageBoard(q, label, { curtain = false, closed = false, basket = false, placed = '', selected = '', frame = initialStage(), interactive = false } = {}) {
  const { set, actor, prop = THEATER_SETS[set].prop, mirror = 0 } = q;
  const gate = THEATER_SETS[set].gate;
  const scenery = set === 'garden' ? art('tree') : set === 'pond' ? `<i class="th-stage-water"></i>${art('flower')}` : art('window');
  return `<div class="th-stage th-set-${set}${mirror ? ' th-mirrored' : ''}" data-th-visual data-door="${frame.open ? 'open' : 'closed'}"
    data-puppet="${frame.inside ? 'inside' : frame.stopped && frame.action === 'enter' ? 'door' : 'start'}" data-carry="${frame.carrying}" data-curtain="${closed ? 'closed' : 'open'}">
    ${stagePicture()}<div class="th-scenery" aria-hidden="true">${scenery}</div>
    ${basket ? `<${interactive ? 'button type="button" data-th-action="basket" data-th-drop="basket"' : 'span'} class="th-basket${selected ? ' th-ready' : ''}" ${interactive ? 'aria-label="הנחה בסל"' : 'aria-hidden="true"'}>
      ${art('basket')}${placed ? `<span class="th-placed">${art(placed)}</span>` : ''}</${interactive ? 'button' : 'span'}>`
    : `<span class="th-stage-door th-${gate}" aria-hidden="true"><i class="th-door-leaf"></i></span><span class="th-stage-prop" aria-hidden="true">${art(prop)}</span>`}
    <span class="th-stage-actor" role="img" aria-label="${label(name(actor))}">${actorArt(actor)}<span class="th-carried" aria-hidden="true">${art(prop)}</span></span>
    ${curtain ? '<div class="th-curtains" aria-hidden="true"><i></i><i></i></div>' : ''}
  </div>`;
}

function paintStage(stage, frame, motion) {
  stage.dataset.door = frame.open ? 'open' : 'closed';
  stage.dataset.puppet = frame.inside ? 'inside' : frame.stopped && frame.action === 'enter' ? 'door' : 'start';
  stage.dataset.carry = String(frame.carrying);
  if (frame.stopped || !motion || !['bow', 'jump'].includes(frame.action)) return;
  const poses = frame.action === 'bow' ? ['rotate(0deg)', 'rotate(-23deg)', 'rotate(0deg)'] : ['translateY(0)', 'translateY(-24%)', 'translateY(0)'];
  stage.querySelector('.th-stage-actor > svg')?.animate(poses.map(transform => ({ transform })), { duration: 510, easing: 'ease-in-out' });
}

export function stagePlayback(stage, run, motion, onFrame, onDone) {
  let timer;
  if (!motion) {
    paintStage(stage, run.frames.at(-1) || run.state, false);
    onDone();
  } else {
    paintStage(stage, initialStage(), false);
    function step(index) {
      const frame = run.frames[index];
      if (!frame) { onDone(); return; }
      paintStage(stage, frame, true);
      onFrame(index);
      timer = setTimeout(() => step(index + 1), frame.stopped ? 440 : 590);
    }
    timer = setTimeout(() => step(0), 120);
  }
  return () => clearTimeout(timer);
}

function actionCard(action, q, label) {
  const gate = THEATER_SETS[q.set].gate, prop = q.prop || THEATER_SETS[q.set].prop;
  const [icon, text] = {
    open: ['door', gate === 'door' ? 'פּוֹתְחוֹת דֶּלֶת' : 'פּוֹתְחוֹת שַׁעַר'],
    enter: ['paw', 'נִכְנָסוֹת'], carry: [prop, 'לוֹקְחוֹת חֵפֶץ'], bow: ['star', 'מִשְׁתַּחֲווֹת'], jump: ['rabbit', 'קוֹפְצוֹת'],
  }[action];
  return `<span class="th-card-pict" aria-hidden="true">${art(icon)}</span><span>${label(text)}</span>`;
}

export function scriptPanel(q, script, choices, limit, label, { selected = -1, locked = false, model = false } = {}) {
  const slots = Array.from({ length: limit }, (_, i) => {
    const action = script[i];
    const glyph = action ? actionCard(action, q, label) : '<span class="th-empty" aria-hidden="true">+</span>';
    const tile = action && !locked && !model ? `<button type="button" class="th-slot-button" data-th-action="script-slot" data-index="${i}"
      data-th-source aria-pressed="${selected === i}">${glyph}</button>` : `<span class="th-slot-button">${glyph}</span>`;
    return `<li class="th-slot${action ? ' filled' : ''}" data-th-slot="${i}" data-th-drop="slot"><b class="th-slot-index">${i + 1}</b>${tile}</li>`;
  }).join('');
  return `<ol class="th-script" dir="rtl" aria-label="${label('סֵדֶר הַפְּעֻלּוֹת')}">${slots}</ol>
    ${!model && !locked ? `<div class="th-edit-tools" ${selected < 0 ? 'hidden' : ''}>
      <button type="button" class="secondary-button" data-th-action="script-before" ${selected < 1 ? 'disabled' : ''}>${label('קֹדֶם')} →</button>
      <button type="button" class="secondary-button" data-th-action="script-after" ${selected >= script.length - 1 ? 'disabled' : ''}>${label('אַחַר כָּךְ')} ←</button>
      <button type="button" class="text-button" data-th-action="script-remove">${uiIcon('close')} ${label('הֲסָרָה')}</button></div>
    <div class="th-action-tray" role="group" aria-label="בחירת פעולה">${choices.map(action => `<button type="button" class="th-action-card" data-th-action="script-add" data-value="${action}" data-th-source
      ${script.includes(action) || script.length === limit ? 'disabled' : ''}>${actionCard(action, q, label)}</button>`).join('')}</div>` : ''}`;
}

export function scriptIntent(button, target, selected, length) {
  const { thAction, index, value } = button.dataset;
  const destination = target?.dataset.thSlot;
  if (thAction === 'script-add') {
    if (target && destination === undefined) return null;
    return { action: 'add', value, slot: destination === undefined ? length : Math.min(Number(destination), length) };
  }
  if (thAction === 'script-slot') {
    if (target && destination === undefined) return null;
    const from = Number(index);
    if (destination !== undefined) return { action: 'move', value: from, slot: Math.min(Number(destination), length - 1) };
    if (selected >= 0 && from !== selected) return { action: 'move', value: selected, slot: from };
    return { select: selected === from ? -1 : from };
  }
  if (selected < 0) return null;
  if (thAction === 'script-remove') return { action: 'remove', value: selected };
  const offset = thAction === 'script-before' ? -1 : 1;
  return { action: 'move', value: selected, slot: selected + offset };
}

export function bindTheaterInputs(root, signal, activate) {
  const selector = 'button[data-th-action]';
  const tap = mountTouchControls(root, `${selector}:not([data-th-source])`, activate, signal);
  const gesture = (button, target) => { tap.suppress(); activate(button, target); };
  const acceptsDrag = mountDrag(root, {
    sources: `${selector}[data-th-source]`, targets: '[data-th-drop]', signal, onDrop: gesture, onTouchTap: gesture,
  });
  root.addEventListener('click', event => {
    const button = event.target.closest(selector);
    if (button && !button.disabled && root.contains(button) && tap.accepts(event) && acceptsDrag(event, button)) activate(button);
  }, { signal });
}

export function theaterNote(key, label) {
  return key && CLIPS[key] ? label(clip(key)) : '';
}

export function propChoices(q, label, selected) {
  return `<div class="th-action-tray" role="group" aria-label="בחירת חפץ">${q.choices.map(prop => `<button class="th-action-card th-prop-card" type="button" data-th-action="prop" data-th-source data-value="${prop}" aria-pressed="${prop === selected}">
    ${art(prop)}<span>${label(THEATER_PROPS[prop])}</span></button>`).join('')}</div>`;
}
