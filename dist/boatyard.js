import { BOATYARD, BOATYARD_MISSIONS } from './activities.js';
import { shuffle } from './answer-order.js';

export const CLAY_MASS = 24;
export const HULLS = Object.freeze({
  ball: { volume: 12, name: 'כַּדּוּר חֹמֶר' },
  narrow: { volume: 36, name: 'סִירָה צָרָה' },
  wide: { volume: 50, name: 'סִירָה רְחָבָה' },
  roomy: { volume: 68, name: 'סִירָה גְּדוֹלָה' },
});
const light = 5;
const heavy = 10;
const paths = Object.keys(BOATYARD_MISSIONS);
const validId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;

// Our boats have a constant cross-section from keel to rim. Masses are
// expressed in units of freshwater volume. The same clay makes all shapes.
// A floating boat displaces its own weight before water reaches the rim.
export function waterTrial(hull, cargo = []) {
  const mass = CLAY_MASS + cargo.reduce((sum, parcel) => sum + parcel, 0);
  const capacity = HULLS[hull].volume;
  const result = mass < capacity ? 'float' : hull === 'ball' ? 'sink' : 'flooded';
  return { mass, capacity, result, draft: Math.min(1, mass / capacity) };
}

const trial = hull => ({ type: 'trial', hull });
const mold = (...options) => ({ type: 'mold', hull: 'ball', options });
const sample = (hull, ...parcels) => ({ hull, parcels });
const compare = (measure, ...samples) => ({ type: 'compare', measure, samples });
const loading = (hull, count, predict = false) => ({
  type: 'load', hull, parcels: Array(count).fill(light), loaded: count - 1, predict,
});

function questionsFor(path, id) {
  let seed = parseInt(id.slice(0, 8), 16);
  const rng = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 2 ** 32);
  const testPair = (measure, ...samples) => compare(measure, ...shuffle(samples, rng));
  if (path === 'shape') return [
    trial('ball'),
    mold('wide'),
    testPair('shape', sample('ball'), sample('wide')),
    trial('narrow'),
    testPair('higher', sample('narrow'), sample('wide')),
    mold('narrow', 'roomy'),
  ];
  if (path === 'cargo') return [
    loading('wide', 1),
    loading('wide', 2),
    loading('narrow', 3, true),
    { type: 'recover', hull: 'narrow', parcels: [light, light, light], loaded: 3 },
    testPair('higher', sample('narrow', light), sample('narrow', heavy)),
    testPair('floats', sample('narrow', light, light, light), sample('wide', light, light, light)),
  ];
  const goals = [
    [[light, light], ['narrow', 'wide']],
    [[heavy, light], ['narrow', 'wide']],
    [[heavy, light, light], ['narrow', 'wide']],
    [[light, light, light, light, light], ['wide', 'roomy']],
    [[heavy, heavy, light, light], ['wide', 'roomy']],
    [[heavy, heavy, heavy, light, light], ['narrow', 'wide', 'roomy']],
  ];
  return goals.map(([parcels, options]) => ({
    type: 'carry', hull: options[0], options: shuffle(options, rng), parcels: shuffle(parcels, rng),
  }));
}

const predictChoices = ['float', 'sink'];
const initialState = q => ({
  hull: q.hull ?? 'ball', cargo: Array.from({ length: q.loaded || 0 }, (_, i) => i),
  prediction: '', wet: ['load', 'recover'].includes(q.type), tested: 0, compared: false, sailed: false,
});

export function boatyardRound(path) {
  if (!paths.includes(path)) throw new RangeError('Unknown boat mission');
  const id = crypto.randomUUID(), questions = questionsFor(path, id);
  return { id, version: 1, path, index: 0, questions, state: initialState(questions[0]), resolved: false, at: 0 };
}

export function boatyardOutcome(q, state) {
  return waterTrial(state.hull, state.cargo.map(i => q.parcels?.[i] ?? 0));
}

export function comparisonAnswer(q) {
  const [left, right] = q.samples.map(sample => waterTrial(sample.hull, sample.parcels));
  if (q.measure === 'shape') return null;
  if (q.measure === 'floats') return left.result === 'float' ? 0 : 1;
  return left.draft < right.draft ? 0 : 1;
}

export function boatyardMove(round, action, value) {
  if (round.resolved) return false;
  const q = round.questions[round.index], state = round.state;
  const parcels = q.parcels ?? [];
  const outcome = boatyardOutcome(q, state);
  if (action === 'hull' && !state.wet && q.options?.includes(value) && value !== state.hull) {
    state.hull = value; state.prediction = ''; return true;
  }
  if (action === 'predict' && predictChoices.includes(value) && canPredict(q, state)) {
    state.prediction = value; return true;
  }
  if (action === 'launch' && canLaunch(q, state)) {
    state.wet = true;
    round.resolved = q.type !== 'carry';
    return true;
  }
  if (action === 'lift' && state.wet && (q.type === 'carry' || q.type === 'recover')) {
    state.wet = false; state.prediction = ''; return true;
  }
  if (action === 'parcel' && Number.isInteger(value) && value >= 0 && value < parcels.length && canToggleParcel(q, state, value)) {
    if (state.cargo.includes(value)) state.cargo = state.cargo.filter(i => i !== value);
    else state.cargo = [...state.cargo, value];
    if (q.type === 'carry') state.prediction = '';
    if (q.type === 'load' && state.cargo.length === parcels.length) round.resolved = true;
    return true;
  }
  if (action === 'test' && q.type === 'compare' && (value === 0 || value === 1) && !(state.tested & (1 << value))) {
    state.tested |= 1 << value;
    if (state.tested === 3 && q.measure === 'shape') { state.compared = true; round.resolved = true; }
    return true;
  }
  if (action === 'compare' && q.type === 'compare' && state.tested === 3 && value === comparisonAnswer(q)) {
    state.compared = true; round.resolved = true; return true;
  }
  if (action === 'sail' && q.type === 'carry' && state.wet && outcome.result === 'float' && state.cargo.length === parcels.length) {
    state.sailed = true; round.resolved = true; return true;
  }
  return false;
}

export function canPredict(q, state) {
  if (q.type === 'load') return q.predict && state.cargo.length < q.parcels.length;
  if (state.wet) return false;
  if (q.type === 'trial') return true;
  if (q.type === 'mold') return state.hull !== 'ball';
  return q.type === 'carry' && state.cargo.length === q.parcels.length;
}

export function canLaunch(q, state) {
  if (q.type === 'load' || state.wet) return false;
  if (q.type === 'recover') return state.cargo.length === q.parcels.length - 1;
  return canPredict(q, state) && Boolean(state.prediction);
}

export function canToggleParcel(q, state, parcel) {
  if (q.type === 'load') return !state.cargo.includes(parcel) && (!q.predict || Boolean(state.prediction));
  if (q.type === 'recover') return !state.wet && state.cargo.length === q.parcels.length && state.cargo.includes(parcel);
  return q.type === 'carry' && !state.wet;
}

export function nextBoatyardStep(round) {
  if (!round.resolved || round.index >= round.questions.length - 1) return false;
  round.index++;
  round.state = initialState(round.questions[round.index]);
  round.resolved = false;
  return true;
}

export function packBoatyardRound({ questions, ...saved }) { return saved; }

export function cleanBoatyardRound(path, saved) {
  if (!saved || saved.version !== 1 || saved.path !== path || !paths.includes(path)
    || typeof saved.id !== 'string' || !validId.test(saved.id)
    || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= BOATYARD.steps) return null;
  const { id, index } = saved;
  const questions = questionsFor(path, id), q = questions[index], state = initialState(q);
  const old = saved.state;
  if (typeof old?.hull === 'string' && (old.hull === q.hull || q.options?.includes(old.hull))) state.hull = old.hull;
  if (q.parcels && Array.isArray(old?.cargo)) {
    const cargo = [...new Set(old.cargo)].filter(n => Number.isInteger(n) && n >= 0 && n < q.parcels.length);
    if (q.type === 'carry' || cargo.length >= q.parcels.length - 1) state.cargo = cargo;
  }
  if (predictChoices.includes(old?.prediction)) state.prediction = old.prediction;
  if (q.type === 'compare') {
    state.tested = [1, 2, 3].includes(old?.tested) ? old.tested : 0;
    state.compared = state.tested === 3 && (q.measure === 'shape' || old?.compared === true);
  } else if (q.type === 'recover') state.wet = old?.wet !== false;
  else if (q.type !== 'load') state.wet = old?.wet === true && canLaunch(q, state);
  if (q.type === 'carry') state.sailed = old?.sailed === true && state.wet && boatyardOutcome(q, state).result === 'float';
  const resolved = {
    trial: state.wet, mold: state.wet, compare: state.compared, carry: state.sailed,
    load: state.cargo.length === q.parcels?.length,
    recover: state.wet && state.cargo.length === q.parcels?.length - 1,
  }[q.type];
  const at = Number.isSafeInteger(saved.at) && saved.at > 0 ? saved.at : 0;
  return { id, version: 1, path, questions, index, state, resolved, at };
}

export function cleanBoatyard(input) {
  const finished = Array.isArray(input?.finished) ? paths.filter(path => input.finished.includes(path)) : [];
  const drafts = Object.fromEntries(paths.flatMap(path => {
    const round = cleanBoatyardRound(path, input?.drafts?.[path]);
    return round ? [[path, packBoatyardRound(round)]] : [];
  }));
  return { drafts, finished };
}
