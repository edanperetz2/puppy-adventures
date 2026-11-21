import { rewardSticker } from './playable-stickers.js';
import { BOATYARD, BOATYARD_MISSIONS, MY_JOURNEY } from './activities.js';
import { art, pup, uiIcon } from './art.js';
import { chapterMissions, chapterText } from './chapter-ui.js';
import {
  boatyardMove, boatyardOutcome, canLaunch, canPredict, canToggleParcel, comparisonAnswer,
  HULLS, nextBoatyardStep, waterTrial,
} from './boatyard.js';
import { CLIPS } from './content.js';
import { mountDrag } from './drag.js';
import { recordingPreloader } from './offline-audio.js';
import { BOATYARD_CLIPS } from './boatyard-content.js';

const artwork = './assets/boatyard-harbor.webp';
const clipText = key => CLIPS[key].text;
const outcomeClip = result => ({
  float: 'boatyard-floats', sink: 'boatyard-ball-sank', flooded: 'boatyard-flooded',
})[result];
const guess = (value, ball) => value === 'float'
  ? (ball ? 'יָצוּף' : 'תָּצוּף') : (ball ? 'יִשְׁקַע' : 'תִּשְׁקַע');
const parcelLabel = mass => mass === 5 ? 'חֲבִילָה קַלָּה' : 'חֲבִילָה כְּבֵדָה';
const boatSizes = { ball: 53, narrow: 78, wide: 78, roomy: 78 };
export const prepareBoatyardAudio = recordingPreloader(Object.keys(BOATYARD_CLIPS));

export function boatyardScene(finished = []) {
  return `<div class="yard-landscape" aria-hidden="true">
    <img src="${artwork}" alt="" width="1120" height="630" loading="lazy" decoding="async">
    <span class="yard-luli">${pup('luli')}</span>
    ${finished.includes('shape') || finished.includes('crossing') ? `<span class="yard-scene-boat">${art('boat')}</span>` : ''}
    ${finished.includes('cargo') ? `<span class="yard-scene-gift">${art('gift')}</span>` : ''}
  </div>`;
}

export function boatyardMap(progress, nikud) {
  const label = chapterText(nikud), ready = progress.finished.length === Object.keys(BOATYARD_MISSIONS).length;
  return `<main id="main" class="picnic-page yard-page">
    <button class="text-button back-button" data-action="${MY_JOURNEY.route.action}">${uiIcon('arrow')} ${label('לַמַּסָּע שֶׁלִּי')}</button>
    <section class="picnic-map-hero yard-map-hero">
      ${boatyardScene(progress.finished)}
      <div class="picnic-map-title"><p>${label(MY_JOURNEY.he[0])}</p><h1 tabindex="-1">${label(BOATYARD.chapter)}</h1>
      <p>${label(ready ? 'הַסִּירָה מוּכָנָה לְעוֹד מִשְׁלוֹחַ!' : BOATYARD.detail)}</p></div>
    </section>
    ${chapterMissions(BOATYARD_MISSIONS, progress, 'boatyard-start', 'yard', label)}
  </main>`;
}

export function boatyardComplete(round, sticker, finished, nikud) {
  const label = chapterText(nikud);
  const ready = finished.length === Object.keys(BOATYARD_MISSIONS).length;
  return `<main id="main" class="picnic-page picnic-result yard-page">
    ${boatyardScene(finished)}${rewardSticker(sticker, BOATYARD_MISSIONS[round.path].icon, 'picnic-sticker')}
    <h1 tabindex="-1">${label(ready ? 'סִיַּמְתְּ אֶת מְשִׂימוֹת הַסִּירָה!' : 'כָּל הַכָּבוֹד, הִשְׁלַמְתְּ אֶת הַמְּשִׂימָה!')}</h1>
    <p>${label(sticker ? 'מַדְבֵּקָה חֲדָשָׁה הִצְטָרְפָה לָאַלְבּוֹם.' : 'הַמְּשִׂימָה נִשְׁמְרָה.')}</p>
    <div class="picnic-result-actions">
      <button class="primary-button" data-action="${BOATYARD.route.action}">${label('לְמַפַּת הַסִּירוֹת')} ${uiIcon('arrow')}</button>
      <button class="secondary-button" data-action="album">${label('לָאַלְבּוֹם שֶׁלִּי')}</button></div>
  </main>`;
}

const tank = index => `<div class="yard-tank" data-yard-tank="${index}" data-yard-zone="boat" role="group">
  <div class="yard-sky"></div><div class="yard-water"></div><div class="yard-craft"></div>
  <div class="yard-glass"></div><div class="yard-waterline"></div><div class="yard-ripple"></div>
</div>`;

function parcelButton(i, mass, direction, enabled, label) {
  const verb = direction === 'in' ? 'הַעֲלָאָה לַסִּירָה' : 'הוֹצָאָה מֵהַסִּירָה';
  return `<button class="yard-parcel" data-yard-source data-yard-action="parcel" data-value="${i}" data-direction="${direction}"
    aria-label="${label(verb)} · ${label(parcelLabel(mass))} ${i + 1}" ${enabled ? '' : 'disabled'}>
    <span aria-hidden="true" class="yard-weight ${mass === 5 ? 'light' : 'heavy'}">${art('gift')}<i></i><i></i></span>
  </button>`;
}

export function boatyardPrompt(round) {
  const q = round.questions[round.index], s = round.state, resolved = round.resolved;
  if (q.type === 'compare') {
    if (resolved && q.measure === 'shape') return 'boatyard-shape';
    return s.tested !== 3 ? 'boatyard-launch' : q.measure === 'floats' ? 'boatyard-which-floats' : 'boatyard-higher';
  }
  if (s.sailed) return 'boatyard-arrived';
  const { result } = boatyardOutcome(q, s);
  if (q.type === 'recover') {
    if (resolved) return 'boatyard-floats';
    return s.wet ? 'boatyard-lift' : canLaunch(q, s) ? 'boatyard-launch' : 'boatyard-remove';
  }
  if (q.type === 'load') {
    if (resolved) return result === 'float' ? 'boatyard-lower' : outcomeClip(result);
    return q.predict && !s.prediction ? 'boatyard-predict-load' : 'boatyard-add';
  }
  if (s.wet) return resolved ? outcomeClip(result) : result === 'float' ? 'boatyard-sail' : 'boatyard-lift';
  if (q.type === 'mold' && s.hull === 'ball') return 'boatyard-mold';
  if (q.type === 'carry' && s.cargo.length < q.parcels.length) return 'boatyard-choose';
  return s.prediction ? 'boatyard-launch' : s.hull === 'ball' ? 'boatyard-predict-ball' : 'boatyard-predict-boat';
}

export function mountBoatyardRound(root, { round, nikud, motion, play, onSave, onComplete, focusTitle }) {
  const label = chapterText(nikud), mission = BOATYARD_MISSIONS[round.path];
  const controls = new AbortController();
  const q = () => round.questions[round.index], state = () => round.state;
  const find = selector => root.querySelector(selector);
  const last = () => round.index === round.questions.length - 1;
  const sound = (...keys) => void play(keys);
  const resultLabel = result => label(clipText(outcomeClip(result)));

  function paintTank(element, { hull, cargo, wet, launchable = false, adjustable = false, sailed = false, ids = [] }) {
    const outcome = waterTrial(hull, cargo);
    const scale = element.closest('.yard-sample') ? .72 : 1;
    const size = boatSizes[hull] * scale;
    const offset = !wet ? -size - 12 : outcome.result === 'float' ? -(1 - outcome.draft) * size
      : (outcome.result === 'sink' ? 59 : 31) * scale;
    element.dataset.water = !wet ? 'dry' : outcome.result;
    element.dataset.hull = hull;
    element.dataset.draft = wet ? outcome.draft.toFixed(3) : '0';
    element.classList.toggle('sailed', sailed);
    element.style.setProperty('--depth', `${size}px`);
    element.style.setProperty('--offset', `${offset}px`);
    element.setAttribute('aria-label', `${label(HULLS[hull].name)}${wet ? ' · ' + resultLabel(outcome.result) : ''}`);
    const cargoArt = cargo.map((mass, i) => Number.isInteger(ids[i])
      ? parcelButton(ids[i], mass, 'out', adjustable && canToggleParcel(q(), state(), ids[i]), label)
      : `<span class="yard-weight ${mass === 5 ? 'light' : 'heavy'}" aria-hidden="true">${art('gift')}<i></i><i></i></span>`).join('');
    const parts = hull === 'ball' ? '<span class="yard-ball"></span>'
      : '<span class="yard-hull"></span><span class="yard-rim"></span><span class="yard-flood"></span>';
    const craft = element.querySelector('.yard-craft');
    craft.innerHTML = `${launchable ? `<button class="yard-craft-handle" data-yard-source data-yard-action="launch"
        aria-label="${label('לַמַּיִם')}">${parts}</button>` : parts}
      <div class="yard-onboard">${cargoArt}</div>`;
  }

  function paintComparison() {
    for (const [index, sample] of q().samples.entries()) {
      const wet = Boolean(state().tested & (1 << index));
      const slot = find(`[data-yard-sample="${index}"]`);
      paintTank(slot.querySelector('.yard-tank'), { hull: sample.hull, cargo: sample.parcels, wet });
      slot.querySelector('.yard-sample-result').textContent = wet ? resultLabel(waterTrial(sample.hull, sample.parcels).result) : '';
      const button = slot.querySelector('[data-yard-action]');
      const compare = state().tested === 3 && !round.resolved && q().measure !== 'shape';
      button.hidden = wet && !compare;
      button.dataset.yardAction = compare ? 'compare' : 'test';
      button.textContent = label(compare ? 'זוֹ הַסִּירָה' : 'לַמַּיִם');
    }
  }

  function drawBoard() {
    const task = q(), s = state(), current = boatyardOutcome(task, s);
    if (task.type === 'compare') { paintComparison(); return; }
    const parcels = task.parcels ?? [];
    paintTank(find('.yard-tank'), {
      hull: s.hull, wet: s.wet, cargo: s.cargo.map(i => parcels[i]), ids: s.cargo,
      adjustable: !round.resolved, launchable: !round.resolved && canLaunch(task, s), sailed: s.sailed,
    });
    const badge = find('.yard-tank-status');
    badge.hidden = s.wet && boatyardPrompt(round) === outcomeClip(current.result);
    badge.textContent = !s.wet ? label('בַּמִּזְחֶה') : resultLabel(current.result);
    const inYard = parcels.flatMap((mass, i) => s.cargo.includes(i) ? []
      : [parcelButton(i, mass, 'in', !round.resolved && canToggleParcel(task, s, i), label)]);
    const shore = find('.yard-shore');
    shore.hidden = !parcels.length;
    shore.classList.toggle('empty', inYard.length === 0);
    shore.innerHTML = parcels.length ? `<span class="yard-counter">${label('חֲבִילוֹת בַּסִּירָה')} <bdi dir="ltr">${s.cargo.length} / ${parcels.length}</bdi></span>
      <div class="yard-stock">${inYard.join('')}</div>` : '';
  }

  function renderControls() {
    const task = q(), s = state();
    const buttons = [];
    if (!round.resolved && task.options && !s.wet) {
      buttons.push(`<div class="yard-hull-options" role="group" aria-label="${label('בְּחִירַת צוּרָה')}">
        ${task.options.map(hull => `<button class="secondary-button" data-yard-action="hull" data-value="${hull}" aria-pressed="${s.hull === hull}"><span class="yard-hull-icon ${hull}" aria-hidden="true"></span>${label(HULLS[hull].name)}</button>`).join('')}
      </div>`);
    }
    if (!round.resolved && canPredict(task, s)) {
      buttons.push(`<div class="yard-guess" role="group" aria-label="${label('מָה יִקְרֶה?')}">
        ${['float', 'sink'].map(value => `<button class="secondary-button" data-yard-action="predict" data-value="${value}" aria-pressed="${s.prediction === value}"><span class="yard-guess-icon ${value}" aria-hidden="true"></span>${label(guess(value, s.hull === 'ball'))}</button>`).join('')}
      </div>`);
    }
    if (!round.resolved && canLaunch(task, s)) buttons.push(actionButton('launch', 'לַמַּיִם'));
    if (!round.resolved && s.wet && (task.type === 'recover' || task.type === 'carry')) {
      buttons.push(actionButton('lift', 'נָרִים אֶת הַסִּירָה', 'secondary'));
      if (task.type === 'carry' && boatyardOutcome(task, s).result === 'float') buttons.push(actionButton('sail', 'לְהַשִּׁיט אֶת הַסִּירָה'));
    }
    find('.yard-actions').innerHTML = buttons.join('');
    find('[data-yard-action="next"]').hidden = !round.resolved;
  }

  const actionButton = (action, title, kind = 'primary') =>
    `<button class="${kind}-button" data-yard-action="${action}">${label(title)} ${kind === 'primary' ? uiIcon('arrow') : ''}</button>`;

  function update() {
    const prompt = boatyardPrompt(round), s = state(), task = q();
    find('.yard-cue').textContent = label(clipText(prompt));
    drawBoard();
    renderControls();
    const feedback = find('.yard-observation');
    const showPrediction = s.prediction && s.wet && (round.resolved || task.type === 'carry');
    feedback.hidden = !showPrediction;
    if (showPrediction) {
      const mark = guess(s.prediction, s.hull === 'ball');
      feedback.textContent = label(`הַנִּחוּשׁ שֶׁלָּךְ · ${mark}`);
    }
  }

  function draw() {
    const task = q();
    root.innerHTML = `<div class="picnic-topline"><button class="text-button back-button" data-action="${BOATYARD.route.action}">
      ${uiIcon('arrow')} ${label('לְמַפַּת הַסִּירוֹת')}</button><span>${label(`צַעַד ${round.index + 1} מִתּוֹךְ ${round.questions.length}`)}</span></div>
      <div class="picnic-track" aria-hidden="true">${round.questions.map((_, i) =>
        `<span class="${i < round.index ? 'passed' : i === round.index ? 'current' : ''}"></span>`).join('')}</div>
      <section class="picnic-step-card yard-step">
        <div class="picnic-task-title"><h1 tabindex="-1">${label(mission.title)}</h1>
          <button class="circle-button" data-yard-action="replay" aria-label="השמעת ההוראה">${uiIcon('sound')}</button></div>
        <p class="yard-cue" role="status"></p>
        ${round.path === 'shape' ? `<p class="yard-clay"><span aria-hidden="true"></span>${label('חֲתִיכַת חֹמֶר אַחַת')}</p>` : ''}
        ${task.type === 'compare' ? `<div class="yard-samples">
          ${task.samples.map((sample, i) => `<section class="yard-sample" data-yard-sample="${i}">
            <p class="yard-sample-label">${label(HULLS[sample.hull].name)}
              ${sample.parcels.length === 1 ? `<small>${label(parcelLabel(sample.parcels[0]))}</small>` : ''}</p>
            ${tank(i)}<p class="yard-sample-result" role="status"></p>
            <button class="secondary-button" data-yard-action="test" data-value="${i}" aria-label="${label(HULLS[sample.hull].name)} · ${i + 1}"></button>
          </section>`).join('')}</div>` : `<div class="yard-board${task.parcels ? ' with-cargo' : ''}">
          <div class="yard-pond">${tank(0)}<span class="yard-water-tag">${label('קַו הַמַּיִם')}</span><p class="yard-tank-status" role="status"></p>
            ${task.type === 'carry' ? `<span class="yard-destination" aria-hidden="true">${pup('bobi')}</span>` : ''}</div>
          <div class="yard-shore" data-yard-zone="shore"></div></div>`}
        <p class="yard-observation" hidden></p><div class="yard-actions"></div>
        <div class="picnic-controls"><span class="yard-review" role="status"></span>
          <button class="primary-button" data-yard-action="next" hidden>${label(last() ? 'לַמַּדְבֵּקָה שֶׁלִּי' : 'לַצַּעַד הַבָּא')} ${uiIcon('arrow')}</button>
        </div>
      </section>`;
    update();
  }

  function ripple(index) {
    const element = find(`[data-yard-tank="${index}"] .yard-ripple`);
    if (motion() && element) element.animate([
      { opacity: 0, transform: 'translateX(-50%) scale(.45)' }, { opacity: .8, offset: .25 },
      { opacity: 0, transform: 'translateX(-50%) scale(1.3)' },
    ], { duration: 650, easing: 'ease-out' });
  }

  function handle(action, value) {
    const task = q();
    const interpreted = ['parcel', 'test', 'compare'].includes(action) ? Number(value) : value;
    if (!boatyardMove(round, action, interpreted)) {
      if (action === 'compare' && state().tested === 3 && !round.resolved) {
        const answer = comparisonAnswer(task);
        find(`[data-yard-sample="${answer}"]`)?.classList.add('has-clue');
        find('.yard-review').textContent = label('הִסְתַּכְּלִי שׁוּב עַל קַו הַמַּיִם.');
        sound(boatyardPrompt(round));
      }
      return;
    }
    onSave(round);
    update();
    find('.yard-review').textContent = '';
    if (action === 'test') {
      const sample = task.samples[interpreted];
      ripple(interpreted);
      const result = outcomeClip(waterTrial(sample.hull, sample.parcels).result);
      sound(result, ...(state().tested === 3 ? [boatyardPrompt(round)] : []));
    } else if (action === 'launch') {
      ripple(0);
      const result = outcomeClip(boatyardOutcome(task, state()).result);
      sound(result, ...(task.type === 'carry' ? [boatyardPrompt(round)] : []));
    } else if (action === 'parcel' && task.type === 'load') {
      ripple(0); sound(boatyardPrompt(round));
    } else if (action !== 'parcel' || state().cargo.length === task.parcels?.length || task.type === 'recover') {
      sound(action === 'compare' ? 'correct-1' : boatyardPrompt(round));
    }
    if (round.resolved) find('[data-yard-action="next"]').focus({ preventScroll: true });
    else if (action === 'predict' && task.type === 'load') find('.yard-stock button:not(:disabled)')?.focus({ preventScroll: true });
    else if (action === 'predict') find('.yard-actions [data-yard-action="launch"]')?.focus({ preventScroll: true });
    else if (action === 'test') find('.yard-sample button:not([hidden])')?.focus({ preventScroll: true });
  }

  let touch, suppressClick = false;
  const activate = button => handle(button.dataset.yardAction, button.dataset.value);
  const activateGesture = button => { suppressClick = true; activate(button); };
  const acceptsClick = mountDrag(root, {
    sources: '[data-yard-source]:not(:disabled)',
    targets: '[data-yard-zone]',
    signal: controls.signal,
    onTouchTap: activateGesture,
    onDrop: (source, target) => {
      const accepted = source.dataset.direction === 'out' ? target.dataset.yardZone === 'shore' : target.dataset.yardZone === 'boat';
      if (accepted) activateGesture(source);
    },
  });
  function runControl(button) {
    const { yardAction } = button.dataset;
    if (yardAction === 'replay') { void play(boatyardPrompt(round), true); return; }
    if (yardAction === 'next') {
      if (!round.resolved) return;
      if (last()) onComplete(round);
      else if (nextBoatyardStep(round)) {
        onSave(round); draw(); focusTitle(); sound(boatyardPrompt(round));
      }
      return;
    }
    activate(button);
  }

  // A touch tap after dragging a parcel may arrive without a compatibility click.
  const plainControl = event => event.target.closest('button[data-yard-action]:not([data-yard-source])');
  root.addEventListener('pointerdown', event => {
    suppressClick = false;
    const button = plainControl(event);
    if (event.pointerType === 'touch' && event.isPrimary && button && !button.disabled) {
      touch = { button, id: event.pointerId, x: event.clientX, y: event.clientY };
    }
  }, { signal: controls.signal });
  root.addEventListener('pointerup', event => {
    if (touch?.id !== event.pointerId) return;
    const { button, x, y } = touch;
    touch = null;
    if (plainControl(event) === button && Math.hypot(event.clientX - x, event.clientY - y) < 12) {
      suppressClick = true;
      runControl(button);
    }
  }, { signal: controls.signal });
  root.addEventListener('pointercancel', event => {
    if (touch?.id === event.pointerId) touch = null;
  }, { signal: controls.signal });
  root.addEventListener('click', event => {
    const button = event.target.closest('button[data-yard-action]');
    if (!button || button.disabled || !root.contains(button) || !acceptsClick(event, button)) return;
    if (!suppressClick || !event.detail) runControl(button);
  }, { signal: controls.signal });

  draw();
  return {
    replay: () => play(boatyardPrompt(round), true),
    destroy() { controls.abort(); },
  };
}
