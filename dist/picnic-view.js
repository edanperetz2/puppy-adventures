import { rewardSticker } from './playable-stickers.js';
import { AVAILABLE_PICNIC_MISSIONS, MY_JOURNEY, PICNIC, PICNIC_MISSIONS, isPicnicReady } from './activities.js';
import { CLOCK_ACTIVITIES_ENABLED } from './availability.js';
import { art, pup, uiIcon } from './art.js';
import { mountActOut } from './act-out-view.js?v=2.7.1-pepper';
import { mountClockDial } from './clock-dial.js?v=2.2.4-practice';
import { learningTime } from './clock-learning.js?v=2.2.4-practice';
import { CLIPS } from './content.js';
import { nextPicnicStep, picnicClockCorrect, picnicReadingModel, picnicWord } from './picnic.js';
import { storyClue } from './story-practice.js';
import { mountDrag } from './drag.js';
import { chapterMissions, chapterText } from './chapter-ui.js';

const labels = chapterText;
const clipText = key => CLIPS[key].text;
const time = total => learningTime(total).digital;
const foodNames = { apple: ['תַּפּוּחַ', 'תַּפּוּחִים'], cookie: ['עוּגִיָּה', 'עוּגִיּוֹת'], bone: ['עֶצֶם', 'עֲצָמוֹת'] };

export function picnicScene(finished = []) {
  const friendsArrived = CLOCK_ACTIVITIES_ENABLED ? finished.includes('clock') : isPicnicReady(finished);
  return `<div class="picnic-landscape" aria-hidden="true">
    <span class="picnic-sun"></span><span class="picnic-hill"></span>
    ${art('tree', 'picnic-tree')}<div class="picnic-rug"></div>
    ${art('basket', 'picnic-basket')}${pup('luli', 'picnic-luli')}
    ${finished.includes('reading') ? art('star', 'picnic-decoration') : ''}
    ${finished.includes('addition') ? art('apple', 'picnic-fruit') : ''}
    ${friendsArrived ? pup('bobi', 'picnic-friend') + pup('tofi', 'picnic-tofi') : ''}
  </div>`;
}

export function picnicMap({ drafts, finished }, nikud) {
  const label = labels(nikud);
  const ready = isPicnicReady(finished);
  return `<main id="main" class="picnic-page">
    <button class="text-button back-button" data-action="${MY_JOURNEY.route.action}">${uiIcon('arrow')} ${label('לַמַּסָּע שֶׁלִּי')}</button>
    <section class="picnic-map-hero">${picnicScene(finished)}<div class="picnic-map-title">
      <p>${label(MY_JOURNEY.he[0])}</p><h1 tabindex="-1">${label(PICNIC.chapter)}</h1>
      <p>${label(ready ? 'הַפִּיקְנִיק מוּכָן!' : 'בַּחֲרִי אֵיךְ לַעֲזֹר לַחֲבֵרִים.')}</p>
    </div></section>
    ${chapterMissions(AVAILABLE_PICNIC_MISSIONS, { drafts, finished }, 'picnic-start', 'picnic', label)}
  </main>`;
}

export function picnicComplete(round, sticker, finished, nikud) {
  const label = labels(nikud);
  const ready = isPicnicReady(finished);
  const message = sticker ? 'מַדְבֵּקָה חֲדָשָׁה הִצְטָרְפָה לָאַלְבּוֹם.' : 'הַמְּשִׂימָה נִשְׁמְרָה.';
  return `<main id="main" class="picnic-page picnic-result">
    ${picnicScene(finished)}${rewardSticker(sticker, PICNIC_MISSIONS[round.path].icon, 'picnic-sticker')}
    <h1 tabindex="-1">${label(ready ? 'הַפִּיקְנִיק מוּכָן!' : 'כָּל הַכָּבוֹד, הִשְׁלַמְתְּ אֶת הַמְּשִׂימָה!')}</h1><p>${label(message)}</p>
    <div class="picnic-result-actions"><button class="primary-button" data-action="${PICNIC.route.action}">${label('לְמַפַּת הַמַּסָּע')} ${uiIcon('arrow')}</button>
      <button class="secondary-button" data-action="album">${label('לָאַלְבּוֹם שֶׁלִּי')}</button></div>
  </main>`;
}

export function picnicPrompt(round, readAloud = false) {
  const q = round.questions[round.index];
  if (round.path === 'reading') {
    if (readAloud || round.resolved) return [`he-${q.word}`];
    if (round.index === 0) return ['act-out', `he-${q.word}`];
    return ['act-out'];
  }
  if (round.path === 'addition') {
    if (round.index === 0 && round.resolved) return ['picnic-add-model'];
    if (q.move && round.state.groups.length < 2) return [round.state.groups.length ? 'picnic-tap-next' : 'picnic-tap-apples'];
    return ['picnic-add-choose', 'number-workshop-choose'];
  }
  if (round.index === 0) return ['picnic-clock-model'];
  if (q.duration) return ['picnic-clock-elapsed', `school-minutes-${q.duration}`];
  return ['picnic-clock-set', ...learningTime(q.target).clips];
}

export function mountPicnicRound(root, {
  round, nikud, motion, speak, replay, onSave, onSuccess, onComplete, focusTitle,
}) {
  const label = labels(nikud), mission = PICNIC_MISSIONS[round.path];
  const isReading = round.path === 'reading', isAddition = round.path === 'addition';
  const last = () => round.index === round.questions.length - 1;
  const q = () => round.questions[round.index];
  const model = () => round.index === 0;
  const state = () => round.state;
  const events = new AbortController(), listeners = { signal: events.signal };
  let dial, acts, timer, modelTimer;
  const find = selector => root.querySelector(selector);
  const note = (message, success = false) => {
    const feedback = find('.picnic-feedback');
    feedback.textContent = label(message);
    feedback.classList.toggle('is-correct', success);
  };
  const flush = () => {
    if (timer === undefined) return;
    clearTimeout(timer); timer = undefined;
    onSave(round);
  };
  const saveClock = () => { timer ??= setTimeout(flush, 180); };
  const markHelped = () => { if (!round.helped.includes(round.index)) round.helped.push(round.index); };

  function showSuccess(audio = true) {
    find('.picnic-step-card').classList.add('is-resolved');
    const next = find('[data-picnic-action="next"]');
    next.hidden = false;
    find('[data-picnic-action="hint"]').hidden = true;
    const modelButton = find('[data-picnic-action="model"]');
    if (modelButton) modelButton.hidden = true;
    note(model() ? 'הִצְלַחְנוּ!' : 'כָּל הַכָּבוֹד, הִצְלַחְתְּ!', true);
    if (audio) {
      speak(model() ? (isReading || isAddition ? picnicPrompt(round) : 'school-one-minute') : 'correct-1');
      next.focus({ preventScroll: true });
    }
  }

  function resolve() {
    if (round.resolved) return;
    clearTimeout(modelTimer);
    round.resolved = true;
    onSave(round); onSuccess(round);
  }

  function paintReadingClue() {
    const word = picnicWord(q());
    const field = model() && round.resolved || state().clue === 'listen' ? 'position' : state().clue;
    const clue = storyClue(word, field);
    const parts = (nikud ? word.pointed : word.he).split(' ');
    find('.picnic-cue').innerHTML = clue ? [
      parts.slice(0, clue.start).join(' '), `<mark>${parts.slice(clue.start, clue.end).join(' ')}</mark>`, parts.slice(clue.end).join(' '),
    ].filter(Boolean).join(' ') : parts.join(' ');
  }

  function paintReading() {
    const word = picnicWord(q());
    paintReadingClue();
    acts = mountActOut(find('.picnic-stage'), {
      word, roundId: round.id, moves: state().moves, resolved: round.resolved, nikud, motion,
      onMove: (moves, done) => {
        state().moves = moves;
        if (done) resolve();
        else onSave(round);
      },
      onRetry: wrongPlace => {
        markHelped();
        state().clue = wrongPlace ? 'position' : 'color';
        paintReadingClue(); onSave(round);
        const { clip } = storyClue(word, state().clue);
        note(clipText(clip)); speak(clip);
      },
      onFinish: () => { paintReadingClue(); showSuccess(); },
    });
  }

  function additionGroups(task, amount, group) {
    const { item } = task;
    const picture = `<span class="picnic-food" aria-hidden="true">${art(item).repeat(amount)}</span>`;
    const name = `${amount} ${label(foodNames[item][amount === 1 ? 0 : 1])}`;
    if (!task.move) return `<div class="picnic-group" role="img" aria-label="${name}">${picture}</div>`;
    if (state().groups.includes(group)) return '<span class="picnic-group-placeholder" aria-hidden="true"></span>';
    return `<button class="picnic-group" data-picnic-group="${group}" aria-label="${label('הַעֲבָרָה לַשְּׂמִיכָה')} · ${name}">${picture}</button>`;
  }

  function paintAddition() {
    const task = q(), { a, b, choices, move, item } = task;
    const joined = move && state().groups.length === 2;
    const total = round.resolved ? a + b : '?';
    const cue = picnicPrompt(round).map(clipText).join(' ');
    find('.picnic-cue').textContent = label(cue);
    const groups = [a, b].map((amount, group) => additionGroups(task, amount, group)).join('<span class="picnic-plus" aria-hidden="true">+</span>');
    const landed = [a, b].map((amount, group) => state().groups.includes(group)
      ? `<span class="picnic-food" data-picnic-landed="${group}" role="img" aria-label="${amount} ${label(foodNames[item][amount === 1 ? 0 : 1])}">${art(item).repeat(amount)}</span>` : '').join('');
    find('.picnic-stage').innerHTML = `<div class="picnic-food-board${move ? '' : ' picnic-transfer'}" data-picnic-item="${item}">
      <div class="picnic-equation" dir="ltr" aria-label="${a} ועוד ${b}${round.resolved ? ` שווה ${total}` : ''}">${a} + ${b} = <b>${total}</b></div>
      ${joined ? '' : `<div class="picnic-group-row" dir="ltr">${groups}</div>`}
      ${move ? `<div class="picnic-blanket" role="group" aria-label="שמיכת הפיקניק">${landed || `<span>${label('לַשְּׂמִיכָה')}</span>`}</div>` : ''}
    </div>${!model() && (!move || joined) ? `<div class="picnic-answers" role="group" aria-label="בחירת מספר">
      ${choices.map(n => `<button class="picnic-answer${round.resolved && n === total ? ' correct' : ''}" data-picnic-answer="${n}"
        ${round.resolved || state().attempted.includes(n) ? 'disabled' : ''}>${n}</button>`).join('')}
    </div>` : ''}`;
  }

  function moveGroup(group, explainNext = true) {
    if (round.resolved || state().groups.includes(group) || ![0, 1].includes(group)) return;
    const origin = find(`[data-picnic-group="${group}"]`)?.getBoundingClientRect();
    state().groups.push(group);
    const joined = state().groups.length === 2;
    if (joined && model()) resolve();
    else onSave(round);
    paintAddition();
    const placed = find(`[data-picnic-landed="${group}"]`);
    if (origin && placed && motion()) {
      const to = placed.getBoundingClientRect();
      const x = origin.left + origin.width / 2 - to.left - to.width / 2;
      const y = origin.top + origin.height / 2 - to.top - to.height / 2;
      placed.animate([{ transform: `translate(${x}px, ${y}px) scale(.94)` }, { transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.23,.82,.35,1)' });
    }
    if (!joined) {
      find('[data-picnic-group]')?.focus({ preventScroll: true });
      if (explainNext) speak(picnicPrompt(round));
      return;
    }
    if (model()) showSuccess();
    else { find('[data-picnic-answer]')?.focus({ preventScroll: true }); speak(picnicPrompt(round)); }
  }

  function answer(number) {
    if (round.resolved || !q().choices.includes(number) || state().attempted.includes(number)
      || (q().move && state().groups.length < 2)) return;
    if (number === q().a + q().b) { resolve(); paintAddition(); showSuccess(); return; }
    state().attempted.push(number); markHelped(); onSave(round); paintAddition();
    note('נַסִּי שׁוּב. כַּמָּה יֵשׁ בְּיַחַד?'); speak(['try-again', 'picnic-add-choose']);
    find('[data-picnic-answer]:not(:disabled)')?.focus({ preventScroll: true });
  }

  function lockClock() {
    for (const button of root.querySelectorAll('.picnic-clock-side button, .picnic-dial button')) button.disabled = true;
  }

  function paintClock() {
    const { start, target, duration } = q();
    find('.picnic-cue').innerHTML = model() ? label(clipText('picnic-clock-model'))
      : duration ? label(`הַחֲבֵרִים יַגִּיעוּ בְּעוֹד ${clipText(`school-minutes-${duration}`)}.`)
      : `${label('הַפִּיקְנִיק מַתְחִיל בְּ־')}<bdi dir="ltr">${time(target)}</bdi>${label('. הַזִּיזִי אֶת הַמְּחוֹגִים.')}`;
    const steps = (kind, text) => `<div class="picnic-clock-steps picnic-${kind}"><span>${label(text)}</span>
      <div dir="ltr"><button class="secondary-button" data-picnic-clock="${kind}:-1" aria-label="${kind === 'hour' ? 'שעה אחת אחורה' : 'דקה אחת אחורה'}">−</button>
      <button class="secondary-button" data-picnic-clock="${kind}:1" aria-label="${kind === 'hour' ? 'שעה אחת קדימה' : 'דקה אחת קדימה'}">+</button></div></div>`;
    find('.picnic-stage').innerHTML = `<div class="picnic-clock-board${model() ? ' picnic-clock-model' : ''}">
      <div class="picnic-dial" data-picnic-dial></div><div class="picnic-clock-side">
        ${duration ? `<div class="picnic-start-time">${label('מַתְחִילוֹת בְּ־')} <bdi dir="ltr">${time(start)}</bdi></div>` : ''}
        <output class="picnic-time" dir="ltr" aria-label="השעה בשעון" aria-live="off"></output>
        <p class="picnic-minute-progress" hidden></p>
        ${duration ? `<div class="picnic-minute-marks" aria-hidden="true" hidden>${Array.from({ length: duration }, () => '<span></span>').join('')}</div>` : ''}
        ${model() ? `<p class="picnic-start-time" data-picnic-model-note>${label(round.resolved ? 'עָבְרָה דַּקָּה אַחַת.' : 'נַזִּיז אֶת הַמָּחוֹג הָאָרֹךְ קַו אֶחָד.')}</p>`
          : `${duration ? '' : steps('hour', 'הַמָּחוֹג הַקָּצָר')}${steps('minute', 'הַמָּחוֹג הָאָרֹךְ')}
          <div class="picnic-clock-actions"><button class="secondary-button" data-picnic-action="check-clock">${label('בִּדְקִי')}</button>
          ${duration ? `<button class="text-button" data-picnic-action="restart-clock">${label('מֵהַהַתְחָלָה')}</button>` : ''}</div>`}
      </div></div>`;
    dial = mountClockDial(find('[data-picnic-dial]'), {
      total: state().total, hand: model() || round.resolved ? 'face' : duration ? 'minute' : 'both', minutes: true,
      onPaint: total => {
        const output = find('.picnic-time'), check = find('[data-picnic-action="check-clock"]');
        output.textContent = time(total);
        if (check) check.disabled = round.resolved || start === total;
        const elapsed = find('.picnic-minute-progress');
        const counting = duration && (round.index === 4 || state().clue);
        elapsed.hidden = !counting;
        if (duration) {
          const marks = find('.picnic-minute-marks'), moved = Math.max(0, total - start);
          marks.hidden = !counting;
          if (counting) {
            elapsed.textContent = label(moved === 1 ? 'דַּקָּה אַחַת קָדִימָה' : `${moved} דַּקּוֹת קָדִימָה`);
            for (const [i, mark] of [...marks.children].entries()) mark.classList.toggle('passed', i < moved);
          }
        }
      },
      onChange: total => {
        if (round.resolved || total === state().total) return;
        state().total = total; note(''); saveClock();
      },
    });
    if (model() || duration) for (const button of root.querySelectorAll('[data-dial-number]')) button.disabled = true;
    if (round.resolved) lockClock();
  }

  function paint() {
    dial?.destroy(); acts?.destroy();
    root.innerHTML = `<div class="picnic-topline"><button class="text-button back-button" data-action="${PICNIC.route.action}">
        ${uiIcon('arrow')} ${label('לְמַפַּת הַמַּסָּע')}</button>
      <span>${label(`צַעַד ${round.index + 1} מִתּוֹךְ ${round.questions.length}`)}</span></div>
      <div class="picnic-track" aria-hidden="true">${round.questions.map((_, i) => `<span class="${i < round.index ? 'passed' : i === round.index ? 'current' : ''}"></span>`).join('')}</div>
      <section class="picnic-step-card picnic-${round.path}">
        <div class="picnic-task-title">
          ${isReading ? '<h1 class="picnic-cue" lang="he" dir="rtl" tabindex="-1"></h1>' : `<h1 tabindex="-1">${label(mission.title)}</h1>`}
          <button class="circle-button" data-picnic-action="replay" aria-label="${isReading ? 'השמעת המשפט' : 'השמעת ההוראה'}">${uiIcon('sound')}</button></div>
        ${isReading ? '' : '<p class="picnic-cue"></p>'}
        <div class="picnic-stage"></div>
        <p class="picnic-feedback" role="status"></p>
        <div class="picnic-controls">
          ${model() ? `<button class="secondary-button" data-picnic-action="model" ${round.resolved ? 'hidden' : ''}>${label('הַרְאִי לִי')}</button>` : ''}
          <button class="text-button" data-picnic-action="hint" ${model() || round.resolved ? 'hidden' : ''}>${uiIcon('hint')} ${label('רֶמֶז')}</button>
          <button class="primary-button" data-picnic-action="next" ${round.resolved ? '' : 'hidden'}>${label(last() ? 'לַמַּדְבֵּקָה שֶׁלִּי' : 'לַצַּעַד הַבָּא')} ${uiIcon('arrow')}</button>
        </div>
      </section>`;
    if (isReading) paintReading();
    else if (isAddition) paintAddition();
    else paintClock();
    if (round.resolved) showSuccess(false);
    else if (state().clue === 'model') note(hintText());
  }

  function playModel() {
    if (round.resolved) return;
    if (isReading) {
      const [{ index, target }] = picnicReadingModel(q(), round.id);
      find(`[data-act-piece="${index}"]`).click();
      find(`[data-act-place="${target}"]`).click();
    } else if (isAddition) {
      const remaining = [0, 1].filter(group => !state().groups.includes(group));
      moveGroup(remaining[0], false);
      if (remaining.length === 2 && motion()) modelTimer = setTimeout(() => moveGroup(1), 285);
      else if (remaining.length === 2) moveGroup(1);
    } else {
      state().total = q().target; dial.set(state().total);
      find('[data-picnic-model-note]').textContent = label('עָבְרָה דַּקָּה אַחַת.');
      resolve(); showSuccess();
    }
  }

  function hintText() {
    if (isAddition) return q().move && state().groups.length < 2 ? clipText(picnicPrompt(round)[0]) : 'סִפְרִי אֶת כָּל מָה שֶׁיֵּשׁ בִּשְׁתֵּי הַקְּבוּצוֹת.';
    return q().duration ? 'מִקַּו לְקַו עוֹבֶרֶת דַּקָּה אַחַת. אֶפְשָׁר לְהַתְחִיל שׁוּב.' : 'הַמָּחוֹג הַקָּצָר מַרְאֶה שָׁעוֹת. הַמָּחוֹג הָאָרֹךְ מַרְאֶה דַּקּוֹת.';
  }

  function hint() {
    markHelped();
    if (isReading) {
      if (state().clue) { state().clue = 'listen'; replay(`he-${q().word}`); }
      else {
        state().clue = 'position';
        const { clip } = storyClue(picnicWord(q()), state().clue);
        note(clipText(clip)); replay(clip);
      }
      paintReadingClue();
    } else {
      state().clue = 'model';
      if (!isAddition) dial.set(state().total);
      note(hintText());
      replay(isAddition ? picnicPrompt(round) : q().duration ? 'picnic-clock-model' : 'school-controls');
    }
    onSave(round);
  }

  function repeatInstruction() {
    if (isReading && !round.resolved && !model()) { markHelped(); onSave(round); }
    return replay(picnicPrompt(round, true));
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || !root.contains(button) || button.disabled) return;
    const { picnicAction, picnicAnswer, picnicGroup, picnicClock } = button.dataset;
    if (picnicClock && !round.resolved) {
      const [kind, direction] = picnicClock.split(':');
      dial.step(kind, Number(direction));
    }
    if (picnicGroup !== undefined && tapAllowed(event, button)) moveGroup(Number(picnicGroup));
    if (picnicAnswer !== undefined) answer(Number(picnicAnswer));
    if (picnicAction === 'replay') repeatInstruction();
    if (picnicAction === 'model') { button.hidden = true; playModel(); }
    if (picnicAction === 'hint' && !round.resolved) hint();
    if (picnicAction === 'restart-clock' && !round.resolved) {
      flush(); state().total = q().start; dial.set(state().total); onSave(round); note('');
    }
    if (picnicAction === 'check-clock' && !round.resolved) {
      flush();
      if (picnicClockCorrect(q(), state().total)) { lockClock(); resolve(); showSuccess(); }
      else { markHelped(); onSave(round); note('נַסִּי שׁוּב. הִסְתַּכְּלִי עַל הַמְּחוֹגִים.'); speak('try-again'); }
    }
    if (picnicAction === 'next' && round.resolved) {
      if (last()) { onComplete(round); return; }
      if (nextPicnicStep(round)) { onSave(round); paint(); focusTitle(); speak(picnicPrompt(round)); }
    }
  }, listeners);

  const move = button => moveGroup(Number(button.dataset.picnicGroup));
  const tapAllowed = isAddition ? mountDrag(root, { sources: '[data-picnic-group]', targets: '.picnic-blanket',
    signal: events.signal, onTouchTap: move, onDrop: move }) : () => true;

  paint();
  return {
    replay: repeatInstruction,
    flush,
    destroy({ discard = false } = {}) {
      if (discard) clearTimeout(timer);
      else flush();
      clearTimeout(modelTimer); events.abort(); dial?.destroy(); acts?.destroy();
    },
  };
}
