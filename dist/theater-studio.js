import { art, uiIcon } from './art.js';
import { shuffle } from './answer-order.js';
import { choosePractice } from './learning.js';
import {
  THEATER_ACTORS, THEATER_ACTIONS, THEATER_SETS, SHADOW_ACTORS, editTheaterScript, initialStage,
  newTheaterShow, performStage, saveTheaterShow,
} from './theater.js';
import {
  actorArt, bindTheaterInputs, playButton, scriptIntent, scriptPanel, stageBoard, stagePlayback, theaterNote, theaterText,
} from './theater-ui.js';

export function castingWord(items, prior = '', rng = Math.random) {
  const practice = SHADOW_ACTORS.filter(word => [`english:single:${word}`, `daily:english:${word}`, `delivery:aboard:${word}`]
    .some(key => items[key]?.independent || items[key]?.helped));
  const itemFor = word => `english:single:${word}`;
  if (practice.length) return choosePractice(practice.length > 1 ? practice.filter(word => word !== prior) : practice, items, itemFor, 1, Date.now(), rng)[0];
  return 'duck';
}

function showChoices(draft, expandable, label) {
  return `<div class="th-studio-chooser">
    <button class="secondary-button" data-th-action="set-options" aria-expanded="${expandable === 'set'}">${art(THEATER_SETS[draft.set].icon)} ${label(THEATER_SETS[draft.set].name)} ${uiIcon('settings')}</button>
    <button class="secondary-button" data-th-action="actor-options" aria-expanded="${expandable === 'actor'}">${actorArt(draft.actor)} ${label(THEATER_ACTORS[draft.actor])} ${uiIcon('settings')}</button>
  </div>`;
}

function showMenu(type, draft, label, cast) {
  if (type === 'set') return `<div class="th-pick-grid" role="group" aria-label="בחירת במה">
    ${Object.entries(THEATER_SETS).map(([key, set]) => `<button type="button" class="th-action-card" data-th-action="set" data-value="${key}" aria-pressed="${key === draft.set}">
      ${art(set.icon)}<span>${label(set.name)}</span></button>`).join('')}</div>`;
  if (type !== 'actor') return '';
  return `<div class="th-pick-grid" role="group" aria-label="בחירת בובה">
    ${Object.entries(THEATER_ACTORS).map(([key, name]) => `<button type="button" class="th-action-card" data-th-action="actor" data-value="${key}" aria-pressed="${key === draft.actor}">
      ${actorArt(key)}<span>${label(name)}</span></button>`).join('')}</div>
    <div class="th-casting"><button class="text-button" data-th-action="cast" aria-expanded="${Boolean(cast)}">${uiIcon('sound')} ${label('מִלָּה בְּאַנְגְּלִית')}</button>
    ${cast ? `<div class="th-cast-panel" aria-label="בחירה לפי מילה באנגלית"><button class="secondary-button" data-th-action="listen" aria-busy="${cast.speaking}">${uiIcon('sound')} ${label('שִׁמְעִי אֶת הַמִּלָּה')}</button>
      <div class="th-cast-choices">${cast.choices.map(id => `<button class="th-action-card" data-th-action="choose-cast" data-value="${id}" aria-label="${label(THEATER_ACTORS[id])}">${actorArt(id)}</button>`).join('')}</div>
    </div>` : ''}</div>`;
}

function showLibrary(studio, label, locked) {
  if (!studio.shows.length) return '';
  return `<section class="th-saved-shows" aria-labelledby="th-shows-title"><h2 id="th-shows-title">${label('הַצָּגוֹת שֶׁשָּׁמַרְתִּי')}</h2><ul>
    ${studio.shows.map(show => `<li><button type="button" data-th-action="load" data-value="${show.id}" ${locked ? 'disabled' : ''}>
      <span class="th-saved-art" aria-hidden="true">${actorArt(show.actor)}</span>
      <span>${label(THEATER_SETS[show.set].name)} · ${label(THEATER_ACTORS[show.actor])}</span><span class="th-play-icon" aria-hidden="true">▶</span></button></li>`).join('')}</ul></section>`;
}

export function mountTheaterStudio(root, { studio, items, nikud, motion, play, onSave, focusTitle }) {
  const label = theaterText(nikud), events = new AbortController();
  const find = selector => root.querySelector(selector);
  let selection = -1, picker = '', cast = null, lastWord = '', playing = false, finalFrame;
  let feedback = '', cancel, castSerial = 0, destroyed = false;

  function draw() {
    const draft = studio.draft, finishedFrame = finalFrame || initialStage();
    root.dataset.thPlaying = String(playing);
    root.dataset.thSaved = String(Boolean(draft.id));
    root.innerHTML = `<div class="picnic-topline"><button class="text-button back-button" data-action="theater">${uiIcon('arrow')} ${label('לַתֵּאַטְרוֹן')}</button>
      ${draft.script.length ? `<button class="text-button" data-th-action="new" ${playing ? 'disabled' : ''}>${uiIcon('plus')} ${label('הַצָּגָה חֲדָשָׁה')}</button>` : ''}</div>
      <section class="picnic-step-card th-round-card"><div class="picnic-task-title"><h1 tabindex="-1">${label('הַהַצָּגוֹת שֶׁלִּי')}</h1>
        <button class="circle-button" data-th-action="replay" aria-label="השמעת ההוראה">${uiIcon('sound')}</button></div>
      ${stageBoard(draft, label, { frame: finishedFrame })}
      ${scriptPanel(draft, draft.script, THEATER_ACTIONS, 3, label, { selected: selection, locked: playing })}
      <div class="th-studio-buttons">${playButton(label, { disabled: playing || !draft.script.length })}
        <button class="secondary-button" data-th-action="save" ${playing || !draft.script.length ? 'disabled' : ''}>${uiIcon('check')} ${label('שִׁמְרִי אֶת הַהַצָּגָה')}</button></div>
      <p class="th-feedback" role="status">${feedback}</p>
      ${playing ? '' : showChoices(draft, picker, label) + showMenu(picker, draft, label, cast)}</section>
      ${showLibrary(studio, label, playing)}`;
  }

  function focus(action, value) {
    find(`[data-th-action="${action}"]${value === undefined ? '' : `[data-value="${value}"]`}`)?.focus({ preventScroll: true });
  }

  function closeCast() { cast = null; castSerial++; }

  function listen(first = false) {
    if (!cast) return;
    const tag = ++castSerial, word = cast.word;
    cast.speaking = true; draw(); focus('listen');
    const keys = [...(first ? ['theater-cast'] : []), `en-${word}`];
    void Promise.resolve(play(keys, true)).then(played => {
      if (destroyed || tag !== castSerial || !cast) return;
      cast.speaking = false;
      cast.heard ||= played === true;
      if (!cast.heard) feedback = label('לִחְצִי שׁוּב עַל הָרַמְקוֹל.');
      const active = root.contains(document.activeElement);
      draw(); if (active) focus('listen');
    });
  }

  function perform() {
    const { script, set } = studio.draft;
    if (!script.length) return;
    const run = performStage(set, script);
    playing = true; feedback = ''; finalFrame = null; closeCast(); draw();
    cancel = stagePlayback(find('[data-th-visual]'), run, motion(), index => {
      for (const slot of root.querySelectorAll('[data-th-slot]')) slot.classList.toggle('th-in-play', Number(slot.dataset.thSlot) === index);
    }, () => {
      playing = false; finalFrame = run.frames.at(-1);
      feedback = run.reason ? theaterNote(run.reason, label) : label('הַהַצָּגָה הִסְתַּיְּמָה!');
      draw(); if (run.reason) void play(run.reason); focus('play');
    });
  }

  function edited() { finalFrame = null; feedback = ''; onSave(); draw(); }

  function activate(control, target) {
    const { thAction: action, value } = control.dataset;
    if (action === 'replay') { void play('theater-studio', true); return; }
    if (playing) return;
    const { draft } = studio;
    if (action.startsWith('script-')) {
      const intent = scriptIntent(control, target, selection, draft.script.length);
      if (!intent) return;
      if (intent.select !== undefined) {
        selection = intent.select; draw();
        find(`[data-th-action="script-slot"][data-index="${control.dataset.index}"]`)?.focus({ preventScroll: true });
      } else {
        const script = editTheaterScript(draft.script, intent.action, intent.value, THEATER_ACTIONS, 3, intent.slot);
        if (!script) return;
        draft.script = script; selection = -1; edited(); focus('play');
      }
      return;
    }
    if (action === 'play') { perform(); return; }
    if (action === 'set-options' || action === 'actor-options') {
      const option = action.split('-')[0];
      picker = picker === option ? '' : option;
      if (picker !== 'actor') closeCast();
      draw(); focus(action); return;
    }
    if ((action === 'set' && Object.hasOwn(THEATER_SETS, value)) || (action === 'actor' && Object.hasOwn(THEATER_ACTORS, value))) {
      draft[action] = value; closeCast(); edited(); focus(action, value); return;
    }
    if (action === 'cast') {
      if (cast) { closeCast(); draw(); focus('cast'); return; }
      const word = castingWord(items, lastWord);
      cast = { word, choices: shuffle(SHADOW_ACTORS), heard: false, speaking: false };
      lastWord = word; feedback = ''; listen(true); return;
    }
    if (action === 'listen') { listen(); return; }
    if (action === 'choose-cast' && cast?.choices.includes(value)) {
      if (!cast.heard) { if (!cast.speaking) listen(true); return; }
      if (value !== cast.word) { feedback = theaterNote('try-again', label); listen(); return; }
      draft.actor = value; closeCast(); edited(); void play('correct-1'); focus('actor', value); return;
    }
    if (action === 'save') {
      const { id } = draft, previous = studio.shows;
      if (!saveTheaterShow(studio)) return;
      if (onSave()) feedback = label('הַהַצָּגָה שֶׁלָּךְ נִשְׁמְרָה!');
      else {
        draft.id = id; studio.shows = previous;
        feedback = label('הַשְּׁמִירָה לֹא הִצְלִיחָה. נַסִּי שׁוּב.');
      }
      draw(); focus('save'); return;
    }
    if (action === 'load') {
      const show = studio.shows.find(saved => saved.id === value);
      if (!show) return;
      studio.draft = { id: show.id, set: show.set, actor: show.actor, script: [...show.script] };
      selection = -1; picker = ''; closeCast(); onSave(); perform(); focusTitle(); return;
    }
    if (action === 'new') {
      studio.draft = newTheaterShow(); selection = -1; picker = 'set'; closeCast(); edited(); focus('set-options');
    }
  }

  bindTheaterInputs(root, events.signal, activate);
  draw();
  return {
    start: () => void play('theater-studio'), replay: () => void play('theater-studio', true),
    destroy() { destroyed = true; cancel?.(); events.abort(); },
  };
}
