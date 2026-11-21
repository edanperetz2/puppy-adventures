import { art, pup, uiIcon } from './art.js';

const actions = {
  dance: { label: 'רִקּוּד', spoken: 'הַבּוּבָּה רוֹקֶדֶת.' },
  jump: { label: 'קְפִיצָה', spoken: 'הַבּוּבָּה קוֹפֶצֶת.' },
  bow: { label: 'קִדָּה', spoken: 'הַבּוּבָּה מִשְׁתַּחֲוָה.' },
  wave: { label: 'נִפְנוּף', spoken: 'הַבּוּבָּה מְנוֹפֶפֶת לְשָׁלוֹם.' },
};

const studioWords = {
  pick: 'בַּחֲרִי בּוּבָּה לַהַצָּגָה שֶׁלָּךְ.',
  add: 'מָה הַבּוּבָּה תַּעֲשֶׂה?',
  again: 'מָה יִקְרֶה אַחַר כָּךְ?',
  ready: 'הַהַצָּגָה מוּכָנָה!',
  saved: 'הַהַצָּגָה שֶׁלָּךְ נִשְׁמְרָה.',
  unsaved: 'הַשְּׁמִירָה לֹא הִצְלִיחָה. אֶפְשָׁר לְנַסּוֹת שׁוּב.',
  swap: 'בַּחֲרִי תְּמוּנָה לְהַחְלָפָה.',
  other: 'עַכְשָׁו בַּחֲרִי עוֹד תְּמוּנָה.',
  swapped: 'הַתְּמוּנוֹת הֶחְלִיפוּ מְקוֹמוֹת!',
  end: 'מְחִיאוֹת כַּפַּיִם!',
};
export const studioSpeech = [...Object.values(studioWords), ...Object.values(actions).map(a => a.spoken)];

const choice = (id, label, image = id) => ({ id, label, art: image });
const moveChoice = id => choice(id, actions[id].label, actionPicture(id, 'bobi'));

function guided(set, index, options) {
  return { ...options, scene: (answers, selected) => guidedStage(set, index, answers, selected) };
}

export const theaterGames = [
  { id: 'visit', title: 'הַבִּקּוּר שֶׁל בּוֹבִּי', icon: 'door', steps: [
    guided('visit', 0, { prompt: 'בּוֹבִּי בָּא לְבַקֵּר. דִּפְקִי בַּדֶּלֶת.',
      direct: true, choices: [choice('knock', 'דְּפִיקָה בַּדֶּלֶת', 'door')], result: 'לוּלִי שׁוֹמַעַת דְּפִיקָה.' }),
    guided('visit', 1, { prompt: 'אֵיךְ לוּלִי תַּכְנִיס אֶת בּוֹבִּי?',
      choices: [choice('open', 'לִפְתֹּחַ אֶת הַדֶּלֶת', 'door'), choice('sleep', 'לָלֶכֶת לִישֹׁן', 'bed')],
      correct: ['open'], hint: 'הַדֶּלֶת עוֹד סְגוּרָה.', result: 'לוּלִי פָּתְחָה אֶת הַדֶּלֶת.' }),
    guided('visit', 2, { prompt: 'הַדֶּלֶת פְּתוּחָה. הַכְנִיסִי אֶת בּוֹבִּי.',
      direct: true, choices: [choice('enter', 'לְהַכְנִיס אֶת בּוֹבִּי', 'door')], result: 'בּוֹבִּי נִכְנַס. שָׁלוֹם, לוּלִי!' }),
    guided('visit', 3, { prompt: 'בּוֹבִּי רוֹצֶה לִמְסֹר כַּדּוּר. מָה חָסֵר לוֹ?',
      choices: [choice('ball', 'כַּדּוּר'), choice('apple', 'תַּפּוּחַ')], correct: ['ball'],
      hint: 'הֵם רוֹצִים לְשַׂחֵק בְּכַדּוּר.', result: 'הַכַּדּוּר אֵצֶל בּוֹבִּי.' }),
    guided('visit', 4, { prompt: 'מִסְרִי אֶת הַכַּדּוּר לְלוּלִי.',
      direct: true, choices: [choice('pass', 'לִמְסֹר אֶת הַכַּדּוּר', 'ball')], result: 'לוּלִי קִבְּלָה אֶת הַכַּדּוּר!' }),
    guided('visit', 5, { prompt: 'אֵיךְ יִגָּמֵר הַבִּקּוּר?', choices: ['jump', 'dance'].map(moveChoice),
      result: 'זֶה הַסּוֹף שֶׁבָּחַרְתְּ!' }),
  ] },
  { id: 'concert', title: 'הַהוֹפָעָה שֶׁל טוֹפִי', icon: 'guitar', steps: [
    guided('concert', 0, { prompt: 'הַבָּמָה חֲשׁוּכָה. הַדְלִיקִי אוֹר.',
      direct: true, choices: [choice('light', 'לְהַדְלִיק אוֹר', 'lamp')], result: 'עַכְשָׁו רוֹאִים אֶת טוֹפִי!' }),
    guided('concert', 1, { prompt: 'טוֹפִי רוֹצֶה לְנַגֵּן. מָה יַעֲזֹר לוֹ?',
      choices: [choice('guitar', 'גִּיטָרָה'), choice('hat', 'כּוֹבַע')], correct: ['guitar'],
      hint: 'חַפְּשִׂי כְּלִי נְגִינָה.', result: 'לְטוֹפִי יֵשׁ גִּיטָרָה.' }),
    guided('concert', 2, { prompt: 'לִחְצִי עַל הַגִּיטָרָה.',
      soundEffect: './assets/sticker-pluck.wav',
      direct: true, choices: [choice('strum', 'לְנַגֵּן בַּגִּיטָרָה', 'guitar')], result: 'טוֹפִי מְנַגֵּן!' }),
    guided('concert', 3, { prompt: 'מִי יָבוֹא לִשְׁמֹעַ אֶת טוֹפִי?',
      choices: [choice('rabbit', 'אַרְנָב'), choice('duck', 'בַּרְוָז')], result: 'יֵשׁ לְטוֹפִי קָהָל!' }),
    guided('concert', 4, { prompt: 'טוֹפִי סִיֵּם לְנַגֵּן. מַחֲאִי כַּפַּיִם!',
      direct: true, choices: [choice('clap', 'מְחִיאוֹת כַּפַּיִם', 'heart')], result: 'אֵילוּ מְחִיאוֹת כַּפַּיִם!' }),
    guided('concert', 5, { prompt: 'אֵיךְ טוֹפִי יִפָּרֵד מֵהַקָּהָל?',
      choices: ['wave', 'bow'].map(id => choice(id, actions[id].label, actionPicture(id, 'tofi'))),
      result: 'הַקָּהָל שָׂמֵחַ!' }),
  ] },
  { id: 'studio', title: 'הַהַצָּגָה שֶׁלִּי', icon: 'star', studio: true },
];

function mark(id) {
  const paths = {
    dance: '<path d="M17 35V13l20-5v22M17 18l20-5"/><ellipse cx="12" cy="36" rx="6" ry="4"/><ellipse cx="32" cy="31" rx="6" ry="4"/>',
    jump: '<path d="M24 34V8M14 18L24 8l10 10M9 39q14 8 29 0"/>',
    bow: '<path d="M11 10q23-1 23 25M25 27l9 10 8-11"/>',
    wave: '<path d="M9 23q-4-6-1-8 2-2 5 2l4 5-1-14q1-4 4-2l2 13 1-15q2-3 5 0l-1 15 4-11q2-2 4 1l-3 14 5-5q3-1 4 2c-3 8-7 17-15 18-9 1-13-6-17-15Z"/>',
    clap: '<path d="m9 29 6-14q2-3 4 0l-2 9 6-11q3-3 5 1l-5 11 7-8q3-2 4 1l-8 12 6-4q4-1 3 3l-10 9q-8 6-14 1-4-3-2-10Z"/><path d="m32 9 1-5m4 10 6-3m-4 9 5 1"/>',
    knock: '<path d="M17 12v-5m-7 10-5-3m21-2 4-5"/><path d="M12 26q-1-4 3-5l11-2q4-1 5 3l1 4 7 3-6 12-13-4-9-5q-4-4 1-6Z"/>',
  };
  return `<svg aria-hidden="true" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round">${paths[id] || ''}</svg>`;
}

function actionPicture(id, actor) {
  return `<span class="tt-action-picture tt-act-${id}" aria-hidden="true">${pup(actor)}<b>${mark(id)}</b></span>`;
}

function stageItem(css, html, control) {
  if (control) {
    return `<button type="button" class="tt-piece tt-control ${css}" data-trial-choice="${control.id}" aria-label="${control.label}">${html}<span class="tt-touch" aria-hidden="true">☝</span></button>`;
  }
  return `<span class="tt-piece ${css}" aria-hidden="true">${html}</span>`;
}

function stageShell(type, decor, body, description) {
  return `<div class="tt-stage tt-set-${type} ${decor}" role="group" aria-label="${description}">
    <img class="tt-backdrop" aria-hidden="true" alt="" src="./assets/theater-stage.webp" width="1120" height="630">
    <span class="tt-floor" aria-hidden="true"></span>${body}</div>`;
}

function storyTrace(items) {
  return items.length ? `<ol class="tt-trace" dir="rtl" aria-label="רגעים מההצגה">${items.map(item =>
    `<li><span role="img" aria-label="${item[1]}">${item[0]}</span></li>`).join('')}</ol>` : '';
}

function guidedStage(set, index, answers = [], selected) {
  const done = Boolean(selected);
  const after = index + Number(done);
  const step = theaterGames.find(game => game.id === set).steps[index];
  const control = id => step.direct && !done ? step.choices.find(item => item.id === id) : null;
  const body = [], trace = [];
  if (set === 'visit') {
    const open = after >= 2, inside = after >= 3;
    const pose = index === 5 && done ? selected : '';
    body.push('<span class="tt-rug" aria-hidden="true"></span>');
    body.push(stageItem('tt-window', art('window')));
    const door = `<span class="tt-door-frame ${open ? 'tt-open' : ''}"><i class="tt-door-light"></i><i class="tt-door-leaf"><b></b></i></span>`;
    body.push(stageItem('tt-door', door, control('knock')));
    if (after === 1) body.push(stageItem('tt-knock', mark('knock')));
    if (open) body.push(stageItem(`tt-luli ${!inside ? 'tt-at-door' : ''}`, pup('luli')));
    body.push(stageItem(`tt-bobi ${inside ? 'tt-inside' : ''} tt-pose-${pose}`,
      pup('bobi') + (pose ? `<i class="tt-bubble">${mark(pose)}</i>` : ''), control('enter')));
    if (after >= 4) body.push(stageItem(`tt-ball ${after >= 5 ? 'tt-passed' : ''}`, art('ball'), control('pass')));
    if (after >= 1) trace.push([mark('knock'), 'דפיקה בדלת']);
    if (after >= 2) trace.push([door, 'הדלת נפתחה']);
    if (after >= 3) trace.push([pup('bobi'), 'בובי נכנס']);
    if (after >= 5) trace.push([art('ball'), 'מסירת כדור']);
    if (pose) trace.push([mark(pose), actions[pose].label]);
    return stageShell('visit', inside ? 'tt-in-room' : '', body.join(''), inside ? 'בובי ולולי בתוך הבית' : 'בובי ליד הדלת של לולי') + storyTrace(trace);
  }

  const guest = index === 3 && done ? selected : answers[3];
  const pose = index === 5 && done ? selected : '';
  body.push('<span class="tt-light-beam" aria-hidden="true"></span>');
  body.push(stageItem('tt-light', art('lamp'), control('light')));
  body.push(stageItem(`tt-tofi tt-pose-${pose}`, pup('tofi') + (pose ? `<i class="tt-bubble">${mark(pose)}</i>` : '')));
  if (after >= 2 && !pose) body.push(stageItem('tt-guitar', art('guitar'), control('strum')));
  if (after >= 3 && after < 5) body.push(stageItem('tt-notes', mark('dance')));
  if (guest === 'rabbit' || guest === 'duck') body.push(stageItem('tt-guest', art(guest)));
  if (index === 4 && !done || after >= 5) body.push(stageItem('tt-applause', mark('clap'), control('clap')));
  if (after >= 1) trace.push([art('lamp'), 'האור נדלק']);
  if (after >= 3) trace.push([art('guitar'), 'טופי ניגן']);
  if (guest === 'rabbit' || guest === 'duck') trace.push([art(guest), 'הגיע קהל']);
  if (after >= 5) trace.push([mark('clap'), 'מחיאות כפיים']);
  if (pose) trace.push([mark(pose), actions[pose].label]);
  return stageShell('concert', after ? 'tt-lit' : 'tt-dark', body.join(''), after ? 'טופי על הבמה המוארת' : 'מנורה לצד במה חשוכה') + storyTrace(trace);
}

const cast = { bobi: 'בּוֹבִּי', luli: 'לוּלִי', tofi: 'טוֹפִי' };
const showId = id => typeof id === 'string' && /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/iu.test(id);
const newShow = () => ({ id: null, actor: '', script: [] });

function cleanShow(raw) {
  if (!Object.hasOwn(cast, raw?.actor)) return newShow();
  return { id: showId(raw.id) ? raw.id : null, actor: raw.actor,
    script: Array.isArray(raw.script) ? raw.script.filter(key => typeof key === 'string' && Object.hasOwn(actions, key)).slice(0, 3) : [] };
}

export function readTrialStudio(raw) {
  const shows = [], ids = new Set();
  for (const item of Array.isArray(raw?.shows) ? raw.shows : []) {
    const show = cleanShow(item);
    if (show.id && show.script.length && !ids.has(show.id)) {
      shows.push(show);
      ids.add(show.id);
    }
  }
  return { draft: cleanShow(raw?.draft), shows };
}

export function saveTrialShow(memory) {
  if (!memory.draft.script.length) return;
  memory.draft.id ??= crypto.randomUUID();
  const entry = cleanShow(memory.draft);
  memory.shows = [entry, ...memory.shows.filter(show => show.id !== entry.id)];
}

export function mountTrialStudio(root, { state, save, say, exit, nikud = true, motion = true, sound = true, enableSound }) {
  const memory = readTrialStudio(state), events = new AbortController();
  const on = value => typeof value === 'function' ? value() : value;
  const title = text => on(nikud) ? text : text.replace(/[\u0591-\u05bd\u05bf-\u05c7]/gu, '');
  const tell = text => on(sound) ? Promise.resolve(say?.(text)).catch(() => {}) : Promise.resolve();
  let frame = -1, showing = false, reorder = false, firstSlot = -1, speech = '', status = '', timer, generation = 0;
  const draft = () => memory.draft;
  const store = () => save(memory);
  function stopPlayback() { generation++; clearTimeout(timer); showing = false; }
  function button(action, label, value, { picture = '', style = '', pressed, extra = '' } = {}) {
    return `<button type="button" class="tt-button ${style}" data-tt="${action}" ${value === undefined ? '' : `data-value="${value}"`} ${pressed === undefined ? '' : `aria-pressed="${pressed}"`} ${extra}>${picture}<span>${title(label)}</span></button>`;
  }
  function strip() {
    return `<ol class="tt-script" dir="rtl" aria-label="סדר הפעולות בהצגה">${draft().script.map((id, i) =>
      `<li>${button('slot', actions[id].label, i, { picture: actionPicture(id, draft().actor),
        pressed: reorder ? firstSlot === i : frame === i,
        extra: `aria-label="${title(actions[id].label)}, תמונה ${i + 1}"` })}</li>`).join('')}</ol>`;
  }
  function shelf() {
    if (!memory.shows.length || showing || reorder) return '';
    return `<details class="tt-shelf"><summary>${title('הַהַצָּגוֹת שֶׁשָּׁמַרְתִּי')} <b>${memory.shows.length}</b></summary><div>${memory.shows.map((show, i) =>
      button('load', cast[show.actor], show.id, { picture: pup(show.actor) + `<i>${show.script.map(id => mark(id)).join('')}</i>`, extra: `aria-label="הצגה ${memory.shows.length - i}, ${title(cast[show.actor])}, ${show.script.map(id => title(actions[id].label)).join(', ')}"` })).join('')}</div></details>`;
  }
  function draw(focusAction, focusValue) {
    const { actor, script } = draft();
    const pose = script[frame] || '', active = Boolean(actor), room = 3 - script.length;
    const header = !active ? studioWords.pick : showing ? actions[pose]?.spoken : reorder ? (firstSlot === -1 ? studioWords.swap : studioWords.other)
      : !script.length ? studioWords.add : room ? studioWords.again : studioWords.ready;
    speech = header || studioWords.ready;
    const stage = active ? stageShell('studio', '', stageItem(`tt-solo tt-pose-${pose}`, pup(actor) +
      (pose ? `<i class="tt-bubble">${mark(pose)}</i>` : '')), pose ? title(actions[pose].spoken) : title(cast[actor])) : '';
    const chooseActor = Object.entries(cast).map(([id, name]) => button('actor', name, id, { picture: pup(id) })).join('');
    const palette = (!active || !room || showing || reorder) ? '' : `<div class="tt-palette">${(script.length ? Object.keys(actions) : ['jump', 'dance']).map(id =>
      button('add', actions[id].label, id, { picture: actionPicture(id, actor) })).join('')}</div>`;
    const editBar = !active || showing || !script.length ? '' : `<div class="tt-tools">
      ${button('play', 'לַהַצָּגָה!', undefined, { picture: '<b aria-hidden="true">▶</b>', style: 'tt-primary' })}
      ${script.length > 1 ? button('reorder', 'לְהַחְלִיף מָקוֹם', undefined, { pressed: reorder }) : ''}
      ${button('undo', 'לְבַטֵּל פְּעֻלָּה אַחֲרוֹנָה', undefined, { picture: uiIcon('again') })}
      ${button('save', 'לִשְׁמֹר הַצָּגָה', undefined, { picture: uiIcon('album') })}
    </div>`;
    const advancing = !on(motion) && frame < script.length - 1;
    const playback = !showing ? '' : `<div class="tt-tools">
      ${button('next', frame < script.length - 1 ? 'לַתְּמוּנָה הַבָּאָה' : 'סִיּוּם הַהַצָּגָה', undefined, { style: advancing ? 'tt-primary' : '', picture: uiIcon('arrow') })}
      ${button('frame', 'לִרְאוֹת שׁוּב', undefined, { picture: uiIcon('again') })}</div>`;
    root.innerHTML = `<section class="tt-studio" dir="rtl" aria-labelledby="tt-title">
      <header>${button('exit', 'לַתֵּאַטְרוֹן', undefined, { picture: uiIcon('arrow') })}
        ${active && !showing && script.length ? button('new', 'הַצָּגָה חֲדָשָׁה', undefined, { picture: uiIcon('plus') }) : ''}</header>
      <div class="tt-heading"><h1 id="tt-title" tabindex="-1">${title(speech)}</h1>
        ${button('listen', 'שׁוּב', undefined, { style: 'tt-speaker', picture: uiIcon('sound'), extra: 'aria-label="שמיעת ההוראה"' })}</div>
      ${active ? stage + (script.length ? strip() : '') : `<div class="tt-cast">${chooseActor}</div>`}
      ${palette}${editBar}${playback}<p class="tt-status" role="status">${title(status)}</p>${shelf()}
    </section>`;
    if (focusAction) root.querySelector(`[data-tt="${focusAction}"]${focusValue === undefined ? '' : `[data-value="${focusValue}"]`}`)?.focus({ preventScroll: true });
  }
  function finish() {
    stopPlayback(); status = studioWords.end; draw('play'); void tell(status);
  }
  function showFrame(index, auto) {
    if (index >= draft().script.length) { finish(); return; }
    clearTimeout(timer);
    const ticket = ++generation;
    frame = index; showing = true; reorder = false; firstSlot = -1; status = '';
    draw();
    root.querySelector('#tt-title')?.focus({ preventScroll: true });
    const narration = tell(actions[draft().script[index]].spoken);
    if (auto && on(motion)) {
      void narration.then(() => {
        if (ticket !== generation) return;
        timer = setTimeout(() => { if (ticket === generation) showFrame(index + 1, true); }, 1100);
      });
    }
  }
  function edit() {
    stopPlayback(); frame = -1; reorder = false; firstSlot = -1; status = ''; store();
  }
  root.addEventListener('click', event => {
    const item = event.target.closest('[data-tt]');
    if (!item || !root.contains(item)) return;
    const { tt: action, value } = item.dataset;
    const current = draft();
    if (action === 'exit') { stopPlayback(); exit(); return; }
    if (action === 'listen') { enableSound?.(); void tell(speech); return; }
    if (action === 'play' && current.script.length) { showFrame(0, true); return; }
    if (action === 'next' && showing) { showFrame(frame + 1, true); return; }
    if (action === 'frame' && showing) { showFrame(frame, false); return; }
    if (action === 'slot') {
      const slot = Number(value);
      if (!current.script[slot]) return;
      if (!reorder) { showFrame(slot, false); return; }
      if (firstSlot === -1) { firstSlot = slot; draw('slot', slot); void tell(studioWords.other); return; }
      if (firstSlot === slot) { firstSlot = -1; draw('slot', slot); return; }
      [current.script[slot], current.script[firstSlot]] = [current.script[firstSlot], current.script[slot]];
      edit(); status = studioWords.swapped; draw('play'); void tell(status); return;
    }
    if (showing) return;
    if (action === 'actor' && Object.hasOwn(cast, value)) {
      current.actor = value; edit(); draw(); void tell(speech); return;
    }
    if (action === 'add' && current.actor && Object.hasOwn(actions, value) && current.script.length < 3) {
      current.script.push(value); edit(); frame = current.script.length - 1; draw('play'); void tell(actions[value].spoken); return;
    }
    if (action === 'undo' && current.script.length) { current.script.pop(); edit(); draw(); void tell(speech); return; }
    if (action === 'reorder' && current.script.length > 1) {
      reorder = !reorder; firstSlot = -1; status = ''; draw(reorder ? 'slot' : 'reorder', reorder ? 0 : undefined);
      if (reorder) void tell(studioWords.swap);
      return;
    }
    if (action === 'save' && current.script.length) {
      saveTrialShow(memory); status = store() === false ? studioWords.unsaved : studioWords.saved;
      draw('save'); void tell(status); return;
    }
    if (action === 'load' || action === 'new') {
      const previous = action === 'load' ? memory.shows.find(show => show.id === value) : null;
      if (action === 'load' && !previous) return;
      // Preserve a work in progress when opening a different show.
      if (current.script.length && previous?.id !== current.id) saveTrialShow(memory);
      memory.draft = previous ? (previous.id === current.id ? current : cleanShow(previous)) : newShow();
      edit(); draw(); void tell(speech);
    }
  }, { signal: events.signal });
  draw(); void tell(speech);
  return {
    pause() { generation++; clearTimeout(timer); },
    replay() { return tell(speech); },
    destroy() { stopPlayback(); events.abort(); },
  };
}
