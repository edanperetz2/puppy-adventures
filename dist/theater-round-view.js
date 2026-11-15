import { THEATER_SHOWS } from './activities.js';
import { art, uiIcon } from './art.js';
import {
  THEATER_ACTORS, SHADOW_LAMP, SHADOW_SCREEN, SHADOW_SPOTS, exampleTheaterTask, freshTheaterTry,
  initialStage, moveTheater, nextTheaterStep, performStage, shadowScale, solutionScript, theaterExample, theaterTask,
} from './theater.js';
import {
  actorArt, bindTheaterInputs, playButton, propChoices, scriptIntent, scriptPanel, stageBoard, stagePicture,
  stagePlayback, theaterNote, theaterText,
} from './theater-ui.js';

const shadowLabels = ['לְיַד הַמְּנוֹרָה', 'בָּאֶמְצַע', 'לְיַד הַמָּסָךְ'];
const modelOrder = ['open', 'enter'];

export function theaterPrompt(q, s) {
  switch (q.kind) {
    case 'curtain': return ['theater-curtain'];
    case 'prop': return [`theater-put-${q.prop}`];
    case 'model': return ['theater-model'];
    case 'order': return [q.count === 2 ? 'theater-enter' : `theater-carry-${q.prop}`, 'theater-order'];
    case 'serve': return ['theater-party-cup'];
    case 'sum': return [s.arrived ? 'theater-party-tray' : 'theater-party-invite'];
    case 'explore': return [s.lit ? 'theater-shadow-play' : 'theater-shadow-light'];
    case 'predict': {
      const direction = q.target === 0 ? 'near' : 'far';
      return [`theater-shadow-${s.prediction ? direction : `guess-${direction}`}`];
    }
    default: return ['theater-shadow-fit'];
  }
}

function button(action, text, label, { value, icon, main = false, disabled = false } = {}) {
  return `<button type="button" class="${main ? 'primary' : 'secondary'}-button" data-th-action="${action}"
    ${value === undefined ? '' : `data-value="${value}"`} ${disabled ? 'disabled' : ''}>${icon ? uiIcon(icon) : ''}${label(text)}</button>`;
}

function partyBoard(q, s, label, { locked, selected, arriving }) {
  const serve = q.kind === 'serve', total = q.first + q.extra;
  const group = (start, count, extra) => `<div class="th-guests${extra ? ' th-guests-extra' : ''}${extra && arriving ? ' th-arriving' : ''}">
    ${!serve ? `<span class="th-group-count" aria-hidden="true">${count}</span>` : ''}
    ${Array.from({ length: count }, (_, i) => {
      const index = start + i, actor = q.guests[index];
      const hasCup = serve ? s.served.includes(index) : s.checked && index < s.cups;
      const caption = `${label(THEATER_ACTORS[actor])} · ${label(hasCup ? 'יֵשׁ כּוֹס' : 'צָרִיךְ כּוֹס')}`;
      return `<${serve && !locked ? `button type="button" data-th-action="guest" data-th-drop="guest" data-value="${index}"` : 'span'}
        class="th-guest${hasCup ? ' th-has-cup' : ''}" aria-label="${caption}">${actorArt(actor)}
        <span class="th-cup-spot" aria-hidden="true">${hasCup ? art('cup') : ''}</span></${serve && !locked ? 'button' : 'span'}>`;
    }).join('')}</div>`;
  const guests = `${group(0, q.first, false)}${s.arrived ? group(q.first, q.extra, true) : ''}`;
  const cup = `<button type="button" class="th-action-card th-cup-stock" data-th-action="cup" data-th-source
    aria-pressed="${serve ? selected : false}" ${locked || (!serve && s.cups >= total + 2) ? 'disabled' : ''}>
    ${art('cup')}<span>${label(serve ? 'כּוֹס' : 'עוֹד כּוֹס')}</span></button>`;
  const stage = `<div class="th-stage th-party-stage">${stagePicture()}<div class="th-party-table">${guests}</div></div>`;
  if (serve) return stage + (locked ? '' : `<div class="th-party-controls">${cup}</div>`);
  const trayCups = s.checked ? Math.max(0, s.cups - total) : s.cups;
  const tray = `<div class="th-cup-tray" data-th-drop="tray" role="group" aria-label="${label('כּוֹסוֹת בַּמַּגָּשׁ')}">
    <span class="th-tray-items" aria-hidden="true">${art('cup').repeat(trayCups)}</span>
    <b class="th-tray-number" aria-label="${label('כּוֹסוֹת שֶׁהֵכַנוּ')}">${s.cups}</b></div>`;
  const equation = `<p class="th-equation" dir="ltr" aria-label="${label('הַחֲבֵרִים שֶׁהִגִּיעוּ')}"><span>${q.first}</span>${s.arrived
    ? ` + <span>${q.extra}</span> = <strong>${locked && s.checked ? total : '?'}</strong>` : ''}</p>`;
  if (!s.arrived) return `${stage}${equation}<div class="th-party-controls">${button('arrive', 'לַחֲבֵרִים', label, { main: true, icon: 'arrow' })}</div>`;
  return `${stage}${equation}<div class="th-tray-board">${locked ? '' : cup}${tray}</div>${locked ? '' : `<div class="th-party-controls">
    ${button('remove-cup', 'כּוֹס אַחַת פָּחוֹת', label, { disabled: s.cups === 0 })}
    ${button('check', 'בִּדְקִי', label, { main: true, icon: 'check' })}</div>`}`;
}

function shadowSize(spot) { return (shadowScale(spot) * 35).toFixed(3); }

function paintShadow(root, spot) {
  const model = root.querySelector('.th-light-table');
  model.style.setProperty('--spot', `${SHADOW_SPOTS[spot]}%`);
  model.style.setProperty('--shadow', `${shadowSize(spot)}%`);
  model.dataset.position = String(spot);
  for (const button of model.querySelectorAll('[data-th-action="slide"]')) button.setAttribute('aria-pressed', String(Number(button.dataset.value) === spot));
}

function shadowBoard(q, s, label, locked) {
  const canMove = !locked && s.lit && (q.kind !== 'predict' || s.prediction);
  const target = q.kind === 'fit' ? `<span class="th-shadow-target" style="--fit:${shadowSize(q.target)}%" aria-hidden="true"></span>` : '';
  const result = s.lit ? `<span class="th-shadow-shape" aria-hidden="true">${actorArt(q.actor)}</span>` : '';
  const relative = s.position === 0 ? 'גָּדוֹל' : s.position === 1 ? 'בֵּינוֹנִי' : 'קָטָן';
  const puppet = canMove ? `<button type="button" class="th-light-puppet" data-th-action="puppet" data-th-source aria-label="${label('בּוּבָה לְהַזָּזָה')}">${actorArt(q.actor)}</button>`
    : `<span class="th-light-puppet" aria-hidden="true">${actorArt(q.actor)}</span>`;
  const guess = q.kind === 'predict' && !s.prediction && !locked;
  return `<div class="th-light-table" data-lit="${s.lit}" data-position="${s.position}"
    style="--spot:${SHADOW_SPOTS[s.position]}%;--shadow:${shadowSize(s.position)}%;--lamp:${SHADOW_LAMP}%;--screen:${SHADOW_SCREEN}%">
    <div class="th-light-diagram" dir="ltr" role="group" aria-label="${label('מְנוֹרָה, בּוּבָה וּמָסָךְ')}">
      <div class="th-light-bench" aria-hidden="true"></div><div class="th-light-rays" aria-hidden="true"></div>
      <div class="th-lamp" aria-hidden="true"><i></i></div><div class="th-screen-edge" aria-hidden="true"></div>${puppet}
      <span class="th-lamp-word">${label('מְנוֹרָה')}</span><span class="th-screen-word">${label('מָסָךְ')}</span>
      <div class="th-shadow-stops">${SHADOW_SPOTS.map((_, i) => `${canMove ? `<button type="button" data-th-action="slide" data-th-drop="shadow" data-value="${i}" aria-pressed="${s.position === i}" aria-label="${label(shadowLabels[i])}">${i + 1}</button>`
        : `<span class="th-stop-readonly${s.position === i ? ' current' : ''}">${i + 1}</span>`}`).join('')}</div></div>
    <div class="th-lit-screen" dir="rtl" role="img" aria-label="${label(s.lit ? `צֵל ${relative}` : 'הַמְּנוֹרָה כְּבוּיָה')}">
      <div class="th-screen-face">${target}${result}</div><span>${label('הַצֵּל עַל הַמָּסָךְ')}</span></div></div>
    ${canMove ? `<div class="th-ramp"><input type="range" min="0" max="2" step="1" value="${s.position}" dir="ltr" data-th-ramp
      aria-label="${label('מֶרְחַק הַבּוּבָה מֵהַמְּנוֹרָה')}" aria-valuetext="${label(shadowLabels[s.position])}"></div>` : ''}
    ${q.kind === 'predict' && s.prediction ? `<p class="th-prediction">${label(s.prediction === 'larger' ? 'הַנִּחוּשׁ שֶׁלָּךְ: יִגְדַּל' : 'הַנִּחוּשׁ שֶׁלָּךְ: יִקְטַן')}</p>` : ''}
    ${locked ? '' : `<div class="th-party-controls">${!s.lit ? button('light', 'לְהַדְלִיק', label, { main: true }) : ''}
      ${guess ? button('predict', 'יִגְדַּל', label, { value: 'larger' }) + button('predict', 'יִקְטַן', label, { value: 'smaller' }) : ''}
      ${q.kind === 'fit' ? button('check', 'בִּדְקִי', label, { main: true, icon: 'check' }) : ''}</div>`}`;
}

export function mountTheaterRound(root, { round, nikud, motion, play, onSave, onSuccess, onFinish, focusTitle }) {
  const label = theaterText(nikud), title = THEATER_SHOWS[round.path].title, task = () => theaterTask(round);
  const events = new AbortController(), options = { signal: events.signal };
  const find = selector => root.querySelector(selector);
  let selectedProp = '', cupSelected = false, selectedCard = -1, feedback = '', lastAction = '';
  let cancelPlayback, sampleTimer, playing = false, sampleReady = false;
  const last = () => round.index === round.questions.length - 1;
  const speak = (keys, manual = false) => void play(keys, manual);
  const replay = (manual = true) => speak(round.example ? ['daily-example', ...samplePrompt()] : theaterPrompt(task(), round.state), manual);

  function samplePrompt() {
    const q = exampleTheaterTask(task());
    if (q.kind === 'order') return q.count === 2 ? ['theater-model'] : [`theater-carry-${q.prop}`];
    if (q.kind === 'explore' || q.kind === 'predict' || q.kind === 'fit') return ['theater-shadow-near', 'theater-shadow-grown'];
    return theaterPrompt(q, { arrived: true });
  }

  function backstageBoard(q, s) {
    if (q.kind === 'curtain') return `${stageBoard(q, label, { curtain: true, closed: !s.played })}
      ${s.played ? '' : `<div class="th-party-controls">${button('curtain', 'לִפְתֹּחַ אֶת הַוִּילוֹן', label, { main: true })}</div>`}`;
    if (q.kind === 'prop') return `${stageBoard(q, label, { basket: true, placed: s.placed, selected: selectedProp, interactive: !round.resolved })}
      ${s.placed ? '' : propChoices(q, label, selectedProp)}`;
    const model = q.kind === 'model', script = model ? modelOrder : s.script;
    const frames = s.played && !playing ? performStage(q.set, script).frames : [];
    return `${stageBoard(q, label, { frame: frames.at(-1) || initialStage() })}
      ${scriptPanel(q, script, q.choices ?? [], q.count ?? 2, label, { selected: selectedCard, locked: round.resolved || playing, model })}
      ${round.resolved ? '' : `<div class="th-party-controls">${playButton(label, { disabled: playing || (!model && script.length !== q.count), text: model ? 'נִרְאֶה יַחַד' : 'הַצָּגָה!' })}</div>`}`;
  }

  function exampleBoard() {
    const q = exampleTheaterTask(task());
    if (q.kind === 'order') {
      const script = solutionScript(q);
      return `${stageBoard(q, label, { frame: sampleReady ? performStage(q.set, script).state : initialStage() })}
        ${scriptPanel(q, script, [], q.count, label, { model: true })}`;
    }
    if (q.kind === 'prop') return stageBoard(q, label, { basket: true, placed: q.prop });
    if (q.kind === 'serve' || q.kind === 'sum') return partyBoard(q, { served: [0], arrived: q.kind === 'sum', cups: q.first + q.extra, checked: true }, label, { locked: true });
    return shadowBoard(q, { lit: true, position: sampleReady ? 0 : 1, prediction: '' }, label, true);
  }

  function draw() {
    const q = task(), s = round.state;
    root.dataset.thPhase = round.example ? 'example' : round.resolved ? 'done' : 'try';
    root.dataset.thFresh = String(round.fresh);
    root.dataset.thKind = q.kind;
    root.dataset.thPlaying = String(playing);
    const board = round.example ? exampleBoard() : round.path === 'backstage' ? backstageBoard(q, s)
      : round.path === 'party' ? partyBoard(q, s, label, { locked: round.resolved, selected: cupSelected, arriving: lastAction === 'arrive' })
        : shadowBoard(q, s, label, round.resolved);
    const cue = theaterNote(round.example ? 'daily-example' : theaterPrompt(q, s)[0], label);
    root.innerHTML = `<div class="picnic-topline"><button class="text-button back-button" data-action="theater">${uiIcon('arrow')} ${label('לַתֵּאַטְרוֹן')}</button>
      <span>${label(`צַעַד ${round.index + 1} מִתּוֹךְ ${round.questions.length}`)}</span></div>
      <div class="picnic-track" aria-hidden="true">${round.questions.map((_, i) => `<span class="${i < round.index ? 'passed' : i === round.index ? 'current' : ''}"></span>`).join('')}</div>
      <section class="picnic-step-card th-round-card">
        <div class="picnic-task-title"><h1 tabindex="-1">${label(title)}</h1><button class="circle-button" data-th-action="replay" aria-label="השמעת ההוראה">${uiIcon('sound')}</button></div>
        <p class="th-cue">${cue}</p>${board}
        <p class="th-feedback" role="status">${feedback || (round.resolved ? label('כָּל הַכָּבוֹד, הִצְלַחְתְּ!') : '')}</p>
        <div class="picnic-controls">
          ${!round.example && !round.resolved && !playing && !['curtain', 'model'].includes(q.kind) ? `<button class="text-button" data-th-action="example">${uiIcon('hint')} ${label('הַרְאִי לִי דֻּגְמָה')}</button>` : ''}
          ${round.example ? button('fresh', 'נְנַסֶּה סְצֵנָה חֲדָשָׁה', label, { main: true, icon: 'arrow', disabled: !sampleReady }) : ''}
          ${round.resolved ? button('next', last() ? 'לַמַּדְבֵּקָה שֶׁלִּי' : 'לַצַּעַד הַבָּא', label, { main: true, icon: 'arrow' }) : ''}
        </div>
      </section>`;
  }

  function focusControl(action, value) {
    find(`[data-th-action="${action}"]${value === undefined ? '' : `[data-value="${value}"]`}`)?.focus({ preventScroll: true });
  }

  function highlight(index) {
    for (const slot of root.querySelectorAll('[data-th-slot]')) slot.classList.toggle('th-in-play', Number(slot.dataset.thSlot) === index);
  }

  function startSample() {
    cancelPlayback?.(); clearTimeout(sampleTimer);
    const q = exampleTheaterTask(task());
    feedback = ''; sampleReady = false; draw(); replay(false);
    const ready = () => { sampleReady = true; draw(); focusControl('fresh'); };
    if (q.kind === 'order') {
      cancelPlayback = stagePlayback(find('[data-th-visual]'), performStage(q.set, solutionScript(q)), motion(), highlight, ready);
    } else if (motion() && round.path === 'shadow') {
      sampleTimer = setTimeout(() => { paintShadow(root, 0); sampleTimer = setTimeout(ready, 350); }, 420);
    } else ready();
  }

  function apply(action, value, slot) {
    const was = theaterPrompt(task(), round.state)[0];
    const result = moveTheater(round, action, value, slot);
    if (!result) return false;
    lastAction = action;
    onSave(round);
    if (result.status === 'example') { startSample(); return true; }
    if (result.status === 'solved') onSuccess(round);
    feedback = theaterNote(result.reason, label);
    draw();
    if (result.status === 'solved') {
      speak(result.reason ? [result.reason, 'correct-1'] : 'correct-1');
      focusControl('next');
    } else if (result.reason) speak(result.reason);
    else {
      const now = theaterPrompt(task(), round.state)[0];
      if (was !== now) speak(now);
    }
    if (result.status === 'retry' && action === 'play') focusControl('script-slot');
    return true;
  }

  function perform() {
    const q = task(), script = q.kind === 'model' ? modelOrder : round.state.script;
    if (q.kind !== 'model' && (q.kind !== 'order' || script.length !== q.count)) return;
    feedback = ''; playing = true; draw();
    cancelPlayback = stagePlayback(find('[data-th-visual]'), performStage(q.set, script), motion(), highlight, () => {
      playing = false;
      apply('play');
    });
  }

  function slide(position, fromRange = false) {
    if (!apply('slide', position)) return;
    if (!round.resolved) {
      if (fromRange) find('[data-th-ramp]')?.focus({ preventScroll: true });
      else focusControl('slide', position);
    }
  }

  function propPlace(prop) {
    selectedProp = '';
    if (apply('place', prop) && !round.resolved && !round.example) focusControl('prop', prop);
  }

  function activate(control, target) {
    const { thAction: action, value } = control.dataset;
    if (action === 'replay') { replay(); return; }
    if (playing) return;
    if (action === 'next' && round.resolved) {
      if (last()) onFinish(round);
      else if (nextTheaterStep(round)) {
        selectedProp = ''; cupSelected = false; selectedCard = -1; feedback = ''; lastAction = '';
        onSave(round); draw(); focusTitle(); replay(false);
      }
      return;
    }
    if (action === 'example' && theaterExample(round)) { onSave(round); startSample(); return; }
    if (round.example) {
      if (action === 'fresh' && sampleReady && freshTheaterTry(round)) {
        feedback = ''; selectedCard = -1; selectedProp = ''; cupSelected = false; lastAction = '';
        onSave(round); draw(); focusTitle(); speak(['daily-fresh', ...theaterPrompt(task(), round.state)]);
      }
      return;
    }
    if (round.resolved) return;
    if (action === 'play') { perform(); return; }
    if (action.startsWith('script-')) {
      const intent = scriptIntent(control, target, selectedCard, round.state.script.length);
      if (!intent) return;
      if (intent.select !== undefined) {
        selectedCard = intent.select; draw();
        find(`[data-th-action="script-slot"][data-index="${control.dataset.index}"]`)?.focus({ preventScroll: true });
      } else {
        const previous = selectedCard; selectedCard = -1;
        if (apply(intent.action, intent.value, intent.slot)) {
          if (intent.action === 'add' && round.state.script.length === task().count) focusControl('play');
          else find('[data-th-action="script-add"]:not(:disabled)')?.focus({ preventScroll: true });
        } else selectedCard = previous;
      }
      return;
    }
    if (action === 'prop') {
      if (target?.dataset.thDrop === 'basket') propPlace(value);
      else if (!target) { selectedProp = selectedProp === value ? '' : value; draw(); focusControl(selectedProp ? 'basket' : 'prop', selectedProp ? undefined : value); }
      return;
    }
    if (action === 'basket') { if (selectedProp) propPlace(selectedProp); return; }
    if (action === 'cup') {
      if (task().kind === 'serve') {
        if (target?.dataset.thDrop === 'guest') apply('serve', Number(target.dataset.value));
        else if (!target) { cupSelected = !cupSelected; draw(); (cupSelected ? find('.th-guest:not(.th-has-cup)') : find('.th-cup-stock'))?.focus({ preventScroll: true }); }
      } else if (!target || target.dataset.thDrop === 'tray') { apply('cup', 1); focusControl('cup'); }
      return;
    }
    if (action === 'guest') {
      const index = Number(value);
      if (round.state.served.includes(index)) apply('return', index);
      else if (cupSelected) apply('serve', index);
      else { focusControl('cup'); return; }
      if (!round.resolved) find('.th-guest:not(.th-has-cup)')?.focus({ preventScroll: true });
      return;
    }
    if (action === 'remove-cup') { apply('cup', -1); focusControl('remove-cup'); return; }
    if (action === 'puppet') { if (target?.dataset.thDrop === 'shadow') slide(Number(target.dataset.value)); return; }
    if (action === 'slide') { slide(Number(value)); return; }
    if (apply(action, value) && !round.resolved && !round.example) {
      if (action === 'arrive') focusControl('cup');
      else if (action === 'light' || action === 'predict') find('[data-th-ramp]')?.focus({ preventScroll: true });
      else focusControl(action);
    }
  }

  bindTheaterInputs(root, events.signal, activate);
  root.addEventListener('input', event => {
    if (!event.target.matches('[data-th-ramp]')) return;
    const spot = Number(event.target.value);
    paintShadow(root, spot);
    event.target.setAttribute('aria-valuetext', label(shadowLabels[spot]));
  }, options);
  root.addEventListener('change', event => { if (event.target.matches('[data-th-ramp]')) slide(Number(event.target.value), true); }, options);

  draw();
  return {
    start() { if (round.example) startSample(); else if (!round.resolved) replay(false); }, replay,
    destroy() { cancelPlayback?.(); clearTimeout(sampleTimer); events.abort(); },
  };
}
