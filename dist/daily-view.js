import { art, uiIcon } from './art.js';
import { DAILY_ACTIVITY } from './activities.js';
import { chapterText } from './chapter-ui.js';
import { mountClockDial } from './clock-dial.js?v=2.2.4-practice';
import { learningTime } from './clock-learning.js?v=2.2.4-practice';
import { ANIMALS, CLIPS } from './content.js';
import {
  DAILY_PATHS, attemptDaily, dailyQuestion, moveDailyClock, nextDailyStep, renewDailyStep, showDailyExample,
} from './daily.js';
import { mountDrag, mountTouchControls } from './drag.js';
import { recordingPreloader } from './offline-audio.js';

const animals = Object.fromEntries(ANIMALS.map(({ id, he }) => [id, he]));
const swimmers = ['duck', 'fish', 'frog', 'turtle'];
const durationKey = q => `school-minutes-${q.duration}`;
const targetClip = q => `en-${q.word}`;
const trainCue = q => ['daily-start', ...learningTime(q.start).clips, 'daily-train', durationKey(q), 'picnic-clock-elapsed'];
const stance = round => round.state.example ? 'example' : round.resolved ? 'done' : 'try';
const dailyText = nikud => nikud ? chapterText(true) : text => chapterText(false)(text).replaceAll('הברכה', 'הבריכה');

let audioId, prepareRoundAudio;
export function prepareDailyAudio(round) {
  if (round.id !== audioId) {
    audioId = round.id;
    const clock = round.path === 'clock';
    const prompts = round.questions.flat().flatMap(q => clock ? trainCue(q) : [targetClip(q)]);
    const cues = clock ? ['picnic-clock-model', 'daily-train-go'] : ['daily-pond'];
    const keys = new Set(['daily-example', 'daily-fresh', ...cues, ...prompts]);
    prepareRoundAudio = recordingPreloader([...keys]);
  }
  prepareRoundAudio();
}

export function dailyHome(path, draft, nikud) {
  const label = dailyText(nikud), { title, icon } = DAILY_PATHS[path];
  const detail = draft ? `${label('מַמְשִׁיכוֹת מִצַּעַד')} ${draft.index + 1}` : label(title);
  return `<div class="daily-home-art" aria-hidden="true">${art(icon)}</div>
    <div class="daily-home-copy"><h2 id="daily-home-title">${label(DAILY_ACTIVITY.he[0])}</h2><p id="daily-home-detail">${detail}</p></div>
    <button class="primary-button" data-action="daily-start" data-path="${path}" aria-describedby="daily-home-title daily-home-detail">
      ${label(draft ? 'מַמְשִׁיכוֹת' : 'לַמְּשִׂימָה')} ${uiIcon('arrow')}</button>`;
}

const rails = (scene, departed = false) => `<div class="daily-rail scene-${scene}${departed ? ' departed' : ''}" aria-hidden="true">
  <span class="daily-hills"></span>${art('tree', 'daily-tree')}<span class="daily-platform"></span>
  <span class="daily-track"></span>${art('train', 'daily-engine')}</div>`;

const shore = (q, placed) => `<div class="daily-pond scene-${q.scene}" role="group" aria-label="ליד הבריכה">
  <span class="daily-bank" aria-hidden="true"></span><span class="daily-water" aria-hidden="true"></span>
  ${art(q.scene === 1 ? 'tree' : 'flower', 'daily-pond-plant')}
  ${placed ? `<span class="daily-placed${swimmers.includes(q.word) ? ' swims' : ''}">${art(q.word)}</span>` : ''}
</div>`;

export function dailyComplete(round, sticker, nikud) {
  const label = chapterText(nikud), q = dailyQuestion(round);
  return `<main id="main" class="picnic-page picnic-result daily-page daily-result">
    ${round.path === 'clock' ? rails(q.scene) : shore(q, true)}
    <div class="picnic-sticker" aria-hidden="true">${art(sticker || DAILY_PATHS[round.path].icon)}</div>
    <h1 tabindex="-1">${label('כָּל הַכָּבוֹד, הַמְּשִׂימָה הֻשְׁלְמָה!')}</h1>
    <p>${label(sticker ? 'מַדְבֵּקָה חֲדָשָׁה הִצְטָרְפָה לָאַלְבּוֹם.' : 'הַמְּשִׂימָה נִשְׁמְרָה.')}</p>
    <div class="picnic-result-actions"><button class="primary-button" data-action="home">${label('לְבֵית הַחֲבֵרִים')} ${uiIcon('arrow')}</button>
      <button class="secondary-button" data-action="album">${label('לָאַלְבּוֹם שֶׁלִּי')}</button></div>
  </main>`;
}

export function mountDaily(root, { round, nikud, motion, play, onSave, onSuccess, onFinish, focusTitle }) {
  const label = dailyText(nikud), clock = round.path === 'clock', path = DAILY_PATHS[round.path];
  const events = new AbortController();
  const find = selector => root.querySelector(selector), task = () => dailyQuestion(round);
  let dial, saveTimer, exampleTimer, sequence = 0, heard = false, speaking = false, alive = true;
  const last = () => round.index === round.questions.length - 1;

  function note(text, good = false) {
    const feedback = find('.daily-feedback');
    feedback.textContent = label(text);
    feedback.classList.toggle('is-correct', good);
  }

  function flush() {
    if (saveTimer === undefined) return;
    clearTimeout(saveTimer); saveTimer = undefined; onSave(round);
  }

  function prompt({ manual = false, first = false, prefix = [] } = {}) {
    const q = task();
    if (round.state.example) {
      return play(['daily-example', ...(clock ? ['picnic-clock-model'] : [targetClip(q)])], manual);
    }
    if (clock) return play([...prefix, ...trainCue(q)], manual);
    const tag = ++sequence;
    const listen = find('[data-daily-action=listen]');
    speaking = true;
    listen?.setAttribute('aria-busy', 'true');
    return Promise.resolve(play([...prefix, ...(first ? ['daily-pond'] : []), targetClip(q)], manual)).then(played => {
      if (!alive || tag !== sequence) return false;
      speaking = false;
      heard ||= played === true;
      root.dataset.dailyAudio = heard ? 'ready' : 'waiting';
      listen?.removeAttribute('aria-busy');
      if (manual && !heard && !round.resolved) note('לִחְצִי שׁוּב עַל הָרַמְקוֹל.');
      return heard;
    });
  }

  function drawClock() {
    const q = task(), example = round.state.example;
    const count = example || round.index < 2;
    find('.daily-stage').innerHTML = `${rails(q.scene, round.resolved)}
      <div class="daily-clock-board">
        <div class="picnic-dial" data-daily-dial></div>
        <div class="daily-clock-panel">
          <p>${label('מַתְחִילוֹת בְּ־')}<bdi dir="ltr">${learningTime(q.start).digital}</bdi></p>
          <output class="daily-time" dir="ltr" aria-label="השעה בשעון" aria-live="off"></output>
          ${count ? `<p class="daily-elapsed"></p><div class="daily-ticks" aria-hidden="true">
            ${Array.from({ length: q.duration }, () => '<span></span>').join('')}</div>` : ''}
          ${example || round.resolved ? '' : `<div class="daily-minute-row"><span>${label('הַמָּחוֹג הָאָרֹךְ')}</span>
            <div dir="ltr"><button class="secondary-button" data-daily-action="minute" data-value="-1" aria-label="דקה אחת אחורה">−</button>
            <button class="secondary-button" data-daily-action="minute" data-value="1" aria-label="דקה אחת קדימה">+</button></div></div>
            <div class="daily-clock-buttons"><button class="secondary-button" data-daily-action="check">${label('בִּדְקִי')}</button>
            <button class="text-button" data-daily-action="reset">${label('מֵהַהַתְחָלָה')}</button></div>`}
        </div>
      </div>`;
    const display = find('.daily-time'), elapsed = find('.daily-elapsed'), check = find('[data-daily-action=check]');
    const ticks = [...root.querySelectorAll('.daily-ticks span')];
    dial = mountClockDial(find('[data-daily-dial]'), {
      total: example ? q.start : round.state.total, hand: example || round.resolved ? 'face' : 'minute', minutes: true,
      onPaint: total => {
        display.textContent = learningTime(total).digital;
        if (check) check.disabled = total === q.start;
        if (elapsed) {
          const minutes = Math.max(0, total - q.start);
          elapsed.textContent = label(minutes === 1 ? 'עָבְרָה דַּקָּה אַחַת' : `עָבְרוּ ${minutes} דַּקּוֹת`);
          for (const [i, tick] of ticks.entries()) tick.classList.toggle('passed', i < minutes);
        }
      },
      onChange: total => {
        if (moveDailyClock(round, total)) {
          note('');
          saveTimer ??= setTimeout(flush, 160);
        } else if (total !== round.state.total) dial.set(round.state.total);
      },
    });
    for (const button of root.querySelectorAll('[data-dial-number]')) button.disabled = true;
    if (example) {
      let moved = 0;
      const tick = () => {
        moved++;
        dial.set(q.start + moved);
        if (moved < q.duration) exampleTimer = setTimeout(tick, 170);
        else find('.daily-rail')?.classList.add('departed');
      };
      if (motion()) exampleTimer = setTimeout(tick, 300);
      else { dial.set(q.start + q.duration); find('.daily-rail').classList.add('departed'); }
    }
  }

  function drawPond() {
    const q = task(), placed = round.resolved || round.state.example;
    find('.daily-stage').innerHTML = `<button class="primary-button daily-listen" data-daily-action="listen">${uiIcon('sound')} ${label('שִׁמְעִי אֶת הַמִּלָּה')}</button>
      <div class="daily-animal-board"><div class="daily-animal-choices" role="group" aria-label="בחירת חיה">
        ${q.choices.map(word => `<button class="delivery-piece${placed && word === q.word ? ' daily-placed-choice' : ''}"
          data-daily-piece="${word}" aria-label="${animals[word]}" ${placed || round.state.attempted.includes(word) ? 'disabled' : ''}>
          <span class="delivery-picture">${art(word)}</span></button>`).join('')}</div>${shore(q, placed)}</div>`;
  }

  function draw() {
    clearTimeout(exampleTimer); dial?.destroy(); dial = null;
    sequence++; heard = false; speaking = false;
    root.dataset.dailyAudio = 'waiting';
    root.dataset.dailyPhase = stance(round);
    root.dataset.dailyVariant = round.state.renewed ? 'fresh' : 'first';
    const q = task(), example = round.state.example;
    const cue = example ? CLIPS['daily-example'].text : clock
      ? `${CLIPS['daily-train'].text} ${CLIPS[durationKey(q)].text}.` : CLIPS['daily-pond'].text;
    root.innerHTML = `<div class="picnic-topline"><button class="text-button back-button" data-action="home">
      ${uiIcon('home')} ${label('לְבֵית הַחֲבֵרִים')}</button><span>${label(`צַעַד ${round.index + 1} מִתּוֹךְ ${round.questions.length}`)}</span></div>
    <div class="picnic-track" aria-hidden="true">${round.questions.map((_, i) =>
      `<span class="${i < round.index ? 'passed' : i === round.index ? 'current' : ''}"></span>`).join('')}</div>
    <section class="picnic-step-card daily-step">
      <div class="picnic-task-title"><h1 tabindex="-1">${label(path.title)}</h1>
        <button class="circle-button" data-daily-action="replay" aria-label="השמעת ההוראה">${uiIcon('sound')}</button></div>
      <p class="daily-cue">${label(cue)}</p><div class="daily-stage"></div>
      <p class="picnic-feedback daily-feedback" role="status"></p>
      <div class="picnic-controls">
        ${!round.resolved && !example && !round.state.renewed ? `<button class="text-button" data-daily-action="example">${uiIcon('hint')} ${label('הַרְאִי לִי דֻּגְמָה')}</button>` : ''}
        ${example ? `<button class="primary-button" data-daily-action="fresh">${label('נְנַסֶּה דֻּגְמָה חֲדָשָׁה')} ${uiIcon('arrow')}</button>` : ''}
        ${round.resolved ? `<button class="primary-button" data-daily-action="next">
          ${label(last() ? 'לַמַּדְבֵּקָה שֶׁלִּי' : 'לַצַּעַד הַבָּא')} ${uiIcon('arrow')}</button>` : ''}
      </div>
    </section>`;
    if (clock) drawClock();
    else drawPond();
    if (round.resolved) note(clock ? CLIPS['daily-train-go'].text : 'כָּל הַכָּבוֹד, הִצְלַחְתְּ!', true);
  }

  function runExample() {
    draw();
    void prompt();
    find('[data-daily-action=fresh]').focus({ preventScroll: true });
  }

  function check(answer, button = null) {
    if (!clock && !heard) {
      if (!speaking) void prompt({ manual: true });
      return;
    }
    flush();
    const from = button?.getBoundingClientRect();
    const result = attemptDaily(round, answer);
    if (result === 'ignored') return;
    onSave(round);
    if (result === 'example') { runExample(); return; }
    if (result === 'retry') {
      if (button) button.disabled = true;
      note(clock ? 'נַסִּי שׁוּב. כַּמָּה דַּקּוֹת צְרִיכוֹת לַעֲבוֹר?' : 'נַסִּי שׁוּב. הַקְשִׁיבִי לַמִּלָּה.');
      void prompt({ prefix: ['try-again'] });
      if (button) find('[data-daily-piece]:not(:disabled)')?.focus({ preventScroll: true });
      return;
    }
    onSuccess(round);
    draw();
    const landed = find('.daily-placed');
    if (from && landed && motion()) {
      const to = landed.getBoundingClientRect();
      const x = from.left + from.width / 2 - to.left - to.width / 2;
      const y = from.top + from.height / 2 - to.top - to.height / 2;
      landed.animate([{ transform: `translate(${x}px,${y}px) scale(.83)` }, { transform: 'none' }],
        { duration: 340, easing: 'cubic-bezier(.2,.7,.25,1)' });
    }
    void play(clock ? 'daily-train-go' : 'correct-1');
    find('[data-daily-action=next]').focus({ preventScroll: true });
  }

  function action(button) {
    const { dailyAction, value } = button.dataset;
    if (dailyAction === 'replay' || dailyAction === 'listen') {
      void prompt({ manual: true, first: dailyAction === 'replay' }); return;
    }
    if (dailyAction === 'minute') dial.step('minute', Number(value));
    if (dailyAction === 'reset' && moveDailyClock(round, task().start)) { dial.set(task().start); onSave(round); note(''); }
    if (dailyAction === 'check') check();
    if (dailyAction === 'example' && showDailyExample(round)) { flush(); onSave(round); runExample(); }
    if (dailyAction === 'fresh' && renewDailyStep(round)) {
      onSave(round); draw(); focusTitle(); void prompt({ prefix: ['daily-fresh'] });
    }
    if (dailyAction === 'next' && round.resolved) {
      if (last()) onFinish(round);
      else if (nextDailyStep(round)) { onSave(round); draw(); focusTitle(); void prompt(); }
    }
  }

  const tap = mountTouchControls(root, 'button[data-daily-action]', action, events.signal);
  const placeAnimal = button => { tap.suppress(); check(button.dataset.dailyPiece, button); };
  const acceptsDrag = mountDrag(root, { sources: '[data-daily-piece]', targets: '.daily-pond',
    signal: events.signal, onDrop: placeAnimal, onTouchTap: placeAnimal });
  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled || !root.contains(button) || !tap.accepts(event) || !acceptsDrag(event, button)) return;
    if (button.dataset.dailyAction) action(button);
    if (button.dataset.dailyPiece) check(button.dataset.dailyPiece, button);
  }, { signal: events.signal });

  draw();
  return {
    start() { if (!round.resolved) void prompt({ first: true }); },
    replay: () => prompt({ manual: true, first: true }),
    flush,
    destroy({ discard = false } = {}) {
      if (discard) clearTimeout(saveTimer);
      else flush();
      alive = false; clearTimeout(exampleTimer); dial?.destroy(); events.abort();
    },
  };
}
