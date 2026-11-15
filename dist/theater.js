import { SESSION_LENGTH } from './adventure.js?v=2.2.2-six';
import { THEATER_SHOWS } from './activities.js';
import { shuffle } from './answer-order.js';
import { seeded } from './journey.js';

export const THEATER_SETS = {
  room: { name: 'הַבַּיִת', icon: 'house', prop: 'ball', gate: 'door' },
  garden: { name: 'הַגִּנָּה', icon: 'tree', prop: 'flower', gate: 'gate' },
  pond: { name: 'הַבְּרֵכָה', icon: 'duck', prop: 'apple', gate: 'gate' },
};
export const THEATER_ACTORS = {
  bobi: 'בּוֹבִּי', luli: 'לוּלִי', tofi: 'טוֹפִי', duck: 'בַּרְוָז', rabbit: 'אַרְנָב', bird: 'צִפּוֹר',
  frog: 'צְפַרְדֵּעַ', turtle: 'צָב',
};
export const THEATER_PROPS = { ball: 'כַּדּוּר', apple: 'תַּפּוּחַ', flower: 'פֶּרַח' };
export const THEATER_ACTIONS = ['open', 'enter', 'carry', 'bow', 'jump'];
export const SHADOW_ACTORS = ['duck', 'rabbit', 'bird'];
export const SHADOW_SPOTS = [44, 59, 75];
export const SHADOW_LAMP = 11, SHADOW_SCREEN = 86;
export const shadowScale = spot => (SHADOW_SCREEN - SHADOW_LAMP) / (SHADOW_SPOTS[spot] - SHADOW_LAMP);
const sets = Object.keys(THEATER_SETS), props = Object.keys(THEATER_PROPS), actors = Object.keys(THEATER_ACTORS);
const uuid = value => typeof value === 'string' && /^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/iu.test(value);
const isSpot = n => Number.isInteger(n) && n >= 0 && n < SHADOW_SPOTS.length;
const stamp = n => Number.isSafeInteger(n) && n > 0 && n < 9999999999999 ? n : 0;
const after = (values, current) => values[(values.indexOf(current) + 1) % values.length];

// The same state changes drive the guided checks and the studio playback.
export const initialStage = () => ({ open: false, inside: false, carrying: false });
export function performStage(set, script) {
  const state = initialStage(), frames = [];
  let reason = '';
  for (const action of script) {
    if (action === 'enter' && !state.open) reason = `theater-closed-${THEATER_SETS[set].gate}`;
    if (action === 'carry' && state.inside && !state.carrying) reason = 'theater-prop-missing';
    if (reason) {
      frames.push({ ...state, action, stopped: true });
      break;
    }
    if (action === 'open') state.open = true;
    if (action === 'enter') state.inside = true;
    if (action === 'carry') state.carrying = true;
    frames.push({ ...state, action, stopped: false });
  }
  return { frames, state, reason };
}

export function editTheaterScript(script, action, value, choices, limit, slot = script.length) {
  if (action === 'add' && script.length < limit && choices.includes(value) && !script.includes(value)) {
    if (!Number.isInteger(slot) || slot < 0 || slot > script.length) return null;
    const next = [...script];
    next.splice(slot, 0, value);
    return next;
  }
  if (!Number.isInteger(value) || value < 0 || value >= script.length) return null;
  if (action === 'remove') return script.filter((_, i) => i !== value);
  if (action === 'move' && Number.isInteger(slot) && slot >= 0 && slot < script.length && slot !== value) {
    const next = [...script];
    next.splice(slot, 0, next.splice(value, 1)[0]);
    return next;
  }
  return null;
}

function scenes(rng) {
  const picked = shuffle(sets, rng), cast = shuffle(actors, rng), found = shuffle(props, rng);
  const layout = Number(rng() > .5);
  const scene = (set, actor, prop, mirror) => ({ set, actor, prop, mirror });
  const alternate = q => ({ ...q, set: after(sets, q.set), actor: after(actors, q.actor),
    prop: after(props, q.prop), mirror: 1 - q.mirror });
  const order = (set, actor, prop, mirror, count, hard = false) => [0, 1].map(variant => {
    const q = { ...scene(set, actor, prop, mirror), kind: 'order', count,
      choices: shuffle(['open', 'enter', ...(count === 3 ? ['carry'] : []), ...(hard ? ['bow'] : [])], rng) };
    if (variant && hard) q.choices[q.choices.indexOf('bow')] = 'jump';
    return variant ? alternate(q) : q;
  });
  const curtain = { ...scene('room', cast[0], found[0], layout), kind: 'curtain' };
  const prop = (target, set, actor, mirror) => ({ ...scene(set, actor, target, mirror), kind: 'prop',
    choices: shuffle([target, after(props, target)], rng) });
  const example = { ...scene(picked[1], cast[2], found[1], layout), kind: 'model' };
  return [
    [curtain, alternate(curtain)],
    [prop(found[0], picked[0], cast[1], layout), prop(found[1], picked[1], cast[2], 1 - layout)],
    [example, alternate(example)],
    order(picked[2], cast[3], found[1], 1 - layout, 2),
    order(picked[0], cast[4], found[2], layout, 3),
    order(picked[1], cast[5], found[0], 1 - layout, 3, true),
  ];
}

function guests(rng) {
  const group = (kind, first, extra = 0, supplied = 0) => ({ kind, first, extra, supplied, guests: shuffle(actors, rng) });
  const serve = [1, 2, 3].map(first => [group('serve', first), group('serve', first)]);
  const sizes = [[[2, 1], [1, 2], [2, 2]], [[2, 2], [3, 2], [2, 3]], [[3, 3], [4, 2], [3, 4], [4, 3]]];
  return [...serve, ...sizes.map((band, i) => shuffle(band, rng).slice(0, 2).map(([first, extra]) =>
    group('sum', first, extra, i === 0 ? first : 0)))];
}

function shadow(rng) {
  const characters = shuffle(SHADOW_ACTORS, rng);
  const fit = shuffle([0, 1, 2], rng);
  return Array.from({ length: SESSION_LENGTH }, (_, index) => [0, 1].map(variant => {
    const actor = characters[(index + variant) % characters.length];
    if (!index) return { kind: 'explore', actor, start: 1 };
    if (index < 3) return { kind: 'predict', actor, start: 1, target: 2 * (index - 1) };
    const target = (fit[index - 3] + variant) % SHADOW_SPOTS.length;
    return { kind: 'fit', actor, target, start: (target + 1 + Number(rng() > .5)) % SHADOW_SPOTS.length };
  }));
}

function taskList(path, seed) {
  return { backstage: scenes, party: guests, shadow }[path](seeded(seed));
}

function stepState(q) {
  if (q.kind === 'curtain' || q.kind === 'model') return { played: false };
  if (q.kind === 'prop') return { placed: '' };
  if (q.kind === 'order') return { script: [], played: false };
  if (q.kind === 'serve') return { served: [] };
  if (q.kind === 'sum') return { arrived: false, cups: q.supplied, checked: false };
  return { lit: q.kind !== 'explore', position: q.start, visited: 0, prediction: '', tested: false };
}

export function createTheaterRound(path, seed = Math.floor(Math.random() * 0x100000000)) {
  if (!Object.hasOwn(THEATER_SHOWS, path)) throw new RangeError('Unknown theater show');
  const questions = taskList(path, seed);
  return { version: 1, id: crypto.randomUUID(), path, seed, index: 0, questions,
    helped: [], example: false, fresh: false, mistakes: 0, state: stepState(questions[0][0]), resolved: false, at: 0 };
}

export const theaterTask = round => round.questions[round.index][Number(round.fresh)];
export const solutionScript = q => q.count === 3 ? ['carry', 'open', 'enter'] : ['open', 'enter'];
const success = reason => ({ status: 'solved', reason });
const changed = (reason = '') => ({ status: 'changed', reason });
const solvedOrder = (q, run) => !run.reason && run.state.inside && (q.count === 2 || run.state.carrying);

function support(round) {
  if (!round.helped.includes(round.index)) round.helped.push(round.index);
}

export function theaterExample(round) {
  if (round.resolved || round.example || ['curtain', 'model'].includes(theaterTask(round).kind)) return false;
  support(round);
  round.example = true;
  return true;
}

export function freshTheaterTry(round) {
  if (!round.example) return false;
  round.example = false;
  round.fresh = true;
  round.mistakes = 0;
  round.state = stepState(theaterTask(round));
  return true;
}

export function exampleTheaterTask(q) {
  if (q.kind === 'order' || q.kind === 'prop') return { ...q, set: after(sets, after(sets, q.set)),
    actor: after(actors, q.actor), prop: after(props, after(props, q.prop)), mirror: 1 - q.mirror };
  if (q.kind === 'serve' || q.kind === 'sum') return { ...q, first: 1, extra: Number(q.kind === 'sum'), supplied: 0 };
  return { ...q, actor: after(SHADOW_ACTORS, after(SHADOW_ACTORS, q.actor)), start: 1, target: 0 };
}

function miss(round, reason) {
  support(round);
  round.mistakes++;
  if (round.mistakes === 2 && !round.fresh && theaterExample(round)) return { status: 'example', reason };
  return { status: 'retry', reason };
}

function storyMove(round, q, s, action, value, slot) {
  if (q.kind === 'curtain' && action === 'curtain') { s.played = true; return success(); }
  if (q.kind === 'model' && action === 'play') { s.played = true; support(round); return success(); }
  if (q.kind === 'prop' && action === 'place' && q.choices.includes(value)) {
    if (value !== q.prop) return miss(round, 'theater-prop-clue');
    s.placed = value;
    return success();
  }
  if (q.kind !== 'order') return null;
  if (action === 'play' && s.script.length === q.count) {
    s.played = true;
    const run = performStage(q.set, s.script);
    return solvedOrder(q, run) ? success() : miss(round, run.reason || 'theater-prop-missing');
  }
  const script = editTheaterScript(s.script, action, value, q.choices, q.count, slot);
  if (!script) return null;
  s.script = script; s.played = false;
  return changed();
}

function partyMove(round, q, s, action, value) {
  const total = q.first + q.extra;
  if (q.kind === 'serve' && Number.isInteger(value) && value >= 0 && value < q.first) {
    if (action === 'serve' && !s.served.includes(value)) s.served.push(value);
    else if (action === 'return' && s.served.includes(value)) s.served = s.served.filter(id => id !== value);
    else return null;
    return s.served.length === q.first ? success() : changed();
  }
  if (q.kind !== 'sum') return null;
  if (action === 'arrive' && !s.arrived) { s.arrived = true; return changed('theater-party-tray'); }
  if (!s.arrived) return null;
  if (action === 'cup' && (value === 1 || value === -1) && s.cups + value >= 0 && s.cups + value <= total + 2) {
    s.cups += value; s.checked = false; return changed();
  }
  if (action === 'check') {
    s.checked = true;
    if (s.cups === total) return success();
    return miss(round, s.cups < total ? 'theater-party-missing' : 'theater-party-extra');
  }
  return null;
}

function shadowMove(round, q, s, action, value) {
  if (action === 'light' && !s.lit) { s.lit = true; return changed(); }
  if (!s.lit) return null;
  if (q.kind === 'predict' && action === 'predict' && !s.prediction && ['larger', 'smaller'].includes(value)) {
    s.prediction = value;
    return changed(q.target === 0 ? 'theater-shadow-near' : 'theater-shadow-far');
  }
  if (action === 'slide' && isSpot(value) && value !== s.position && (q.kind !== 'predict' || s.prediction)) {
    const observed = value < s.position ? 'theater-shadow-grown' : 'theater-shadow-shrunk';
    s.position = value; s.visited |= 1 << value; s.tested = false;
    if (q.kind === 'explore' && (s.visited & 5) === 5) return success(observed);
    if (q.kind === 'predict' && value === q.target) return success(value < q.start ? 'theater-shadow-grown' : 'theater-shadow-shrunk');
    return changed(q.kind === 'explore' ? observed : '');
  }
  if (q.kind === 'fit' && action === 'check') {
    s.tested = true;
    return s.position === q.target ? success() : miss(round, s.position > q.target ? 'theater-shadow-small' : 'theater-shadow-large');
  }
  return null;
}

export function moveTheater(round, action, value, slot) {
  if (round.example || round.resolved) return null;
  const q = theaterTask(round), s = round.state;
  const result = round.path === 'backstage' ? storyMove(round, q, s, action, value, slot)
    : round.path === 'party' ? partyMove(round, q, s, action, value) : shadowMove(round, q, s, action, value);
  if (result?.status === 'solved') round.resolved = true;
  return result;
}

export function nextTheaterStep(round) {
  if (!round.resolved || round.index >= SESSION_LENGTH - 1) return false;
  round.index++;
  Object.assign(round, { state: stepState(round.questions[round.index][0]), fresh: false, example: false, mistakes: 0, resolved: false });
  return true;
}

export function theaterEvidence(round) {
  const q = theaterTask(round);
  const item = { order: `theater:order:${q.set}:${q.count}`, sum: 'theater:party:combine',
    serve: 'theater:party:serve', fit: 'theater:shadow:fit', prop: `theater:prop:${q.prop}` }[q.kind];
  return item && { item, domain: THEATER_SHOWS[round.path].domain, eventId: `theater:${round.id}:${round.index}` };
}

export function theaterRecall(items) {
  const independent = Object.entries(items).filter(([id, item]) => /^theater:order:(?:room|garden|pond):[23]$/u.test(id)
    && item.independent && stamp(item.firstSuccess) && stamp(item.success));
  const anotherDay = (early, late) => late >= early + 20 * 3600000
    && new Date(early).toISOString().slice(0, 10) !== new Date(late).toISOString().slice(0, 10);
  return independent.some(([id, first]) => independent.some(([other, last]) =>
    id.split(':')[2] !== other.split(':')[2] && anotherDay(first.firstSuccess, last.success)));
}

const bounded = (n, max, fallback = 0) => Number.isInteger(n) && n >= 0 && n <= max ? n : fallback;
const unique = values => [...new Set(Array.isArray(values) ? values : [])];

function readStep(q, raw = {}) {
  const s = stepState(q);
  if (q.kind === 'curtain' || q.kind === 'model') s.played = raw.played === true;
  else if (q.kind === 'prop') s.placed = raw.placed === q.prop ? q.prop : '';
  else if (q.kind === 'order') {
    s.script = unique(raw.script).filter(action => q.choices.includes(action)).slice(0, q.count);
    s.played = raw.played === true && s.script.length === q.count;
  } else if (q.kind === 'serve') {
    s.served = unique(raw.served).filter(id => Number.isInteger(id) && id >= 0 && id < q.first);
  } else if (q.kind === 'sum') {
    s.arrived = raw.arrived === true;
    if (s.arrived) {
      s.cups = bounded(raw.cups, q.first + q.extra + 2, q.supplied);
      s.checked = raw.checked === true;
    }
  } else {
    s.lit = q.kind !== 'explore' || raw.lit === true;
    if (s.lit) {
      s.prediction = q.kind === 'predict' && ['larger', 'smaller'].includes(raw.prediction) ? raw.prediction : '';
      s.position = bounded(raw.position, SHADOW_SPOTS.length - 1, q.start);
      s.visited = bounded(raw.visited, 7);
      s.tested = raw.tested === true;
    }
  }
  return s;
}

function restoredCompletion(q, s) {
  if (q.kind === 'curtain' || q.kind === 'model') return s.played;
  if (q.kind === 'prop') return s.placed === q.prop;
  if (q.kind === 'order') return s.played && solvedOrder(q, performStage(q.set, s.script));
  if (q.kind === 'serve') return s.served.length === q.first;
  if (q.kind === 'sum') return s.arrived && s.checked && s.cups === q.first + q.extra;
  if (q.kind === 'explore') return s.lit && (s.visited & 5) === 5;
  if (q.kind === 'predict') return s.lit && Boolean(s.prediction) && s.position === q.target;
  return s.lit && s.tested && s.position === q.target;
}

export function packTheaterRound({ questions, ...draft }) { return draft; }

export function cleanTheaterRound(path, saved) {
  if (saved?.version !== 1 || saved.path !== path || !Object.hasOwn(THEATER_SHOWS, path) || !uuid(saved.id)
    || bounded(saved.seed, 0xffffffff, -1) < 0 || bounded(saved.index, SESSION_LENGTH - 1, -1) < 0) return null;
  const { id, seed, index } = saved;
  const questions = taskList(path, seed), fresh = saved.fresh === true;
  const q = questions[index][Number(fresh)], state = readStep(q, saved.state || {});
  const example = saved.example === true && !['curtain', 'model'].includes(q.kind);
  const mistakes = bounded(saved.mistakes, 100);
  const helped = unique(saved.helped).filter(n => Number.isInteger(n) && n >= 0 && n <= index);
  if ((fresh || example || mistakes || (q.kind === 'model' && state.played)) && !helped.includes(index)) helped.push(index);
  const resolved = saved.resolved === true && !example && restoredCompletion(q, state);
  return { version: 1, id, path, seed, index, questions, state, fresh, example, mistakes, helped, resolved, at: stamp(saved.at) };
}

export const newTheaterShow = () => ({ id: null, set: 'room', actor: 'bobi', script: [] });
function cleanShow(draft) {
  return { id: uuid(draft?.id) ? draft.id : null,
    set: sets.includes(draft?.set) ? draft.set : 'room', actor: actors.includes(draft?.actor) ? draft.actor : 'bobi',
    script: unique(draft?.script).filter(action => THEATER_ACTIONS.includes(action)).slice(0, 3) };
}

export function saveTheaterShow(studio, now = Date.now()) {
  if (!studio.draft.script.length) return false;
  const id = studio.draft.id ?? crypto.randomUUID();
  const entry = { ...cleanShow({ ...studio.draft, id }), at: now };
  const saved = studio.shows.find(show => show.id === id);
  if (saved?.set === entry.set && saved.actor === entry.actor && saved.script.join() === entry.script.join()) return true;
  studio.shows = [entry, ...studio.shows.filter(show => show.id !== id)];
  studio.draft.id = id;
  return true;
}

export function cleanTheater(input) {
  const drafts = {};
  for (const path of Object.keys(THEATER_SHOWS)) {
    const round = cleanTheaterRound(path, input?.drafts?.[path]);
    if (round) drafts[path] = packTheaterRound(round);
  }
  const seen = new Set();
  const shows = (Array.isArray(input?.studio?.shows) ? input.studio.shows : []).flatMap(raw => {
    const show = cleanShow(raw);
    if (!show.id || seen.has(show.id) || !show.script.length) return [];
    seen.add(show.id);
    return [{ ...show, at: stamp(raw.at) }];
  });
  const draft = cleanShow(input?.studio?.draft);
  if (!seen.has(draft.id)) draft.id = null;
  return { drafts, studio: { draft, shows }, finished: unique(input?.finished).filter(path => Object.hasOwn(THEATER_SHOWS, path)) };
}
