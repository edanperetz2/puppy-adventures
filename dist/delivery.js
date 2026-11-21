import { DELIVERY, DELIVERY_MISSIONS } from './activities.js';
import { answerShuffler, shuffle } from './answer-order.js';
import { choosePractice, learningStage } from './learning.js';

const animals = ['duck', 'dog', 'cat', 'rabbit', 'bird', 'turtle', 'frog', 'mouse'];
const colors = ['blue', 'red', 'yellow', 'green', 'pink', 'purple', 'orange'];
const scenes = ['harbor', 'river', 'cove'];
const cargoObjects = { harbor: 'parcel', river: 'bucket', cove: 'ball' };
const pathNames = Object.keys(DELIVERY_MISSIONS);
const version = 1;
const validId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const pick = (list, rng) => list[Math.floor(rng() * list.length)];
const key = id => `english:single:${id}`;
const wordClip = id => id === 'boat' ? 'delivery-en-boat' : `en-${id}`;

export const DELIVERY_AUDIO = [...animals.map(wordClip), ...colors.map(wordClip), wordClip('boat'),
  'delivery-welcome', ...new Set(Object.values(DELIVERY_MISSIONS).map(mission => mission.prompt)),
  'delivery-finish', 'delivery-pair', 'delivery-en-blue-boat'];

export function deliveryPairReady(items = {}) {
  return ['blue', 'boat'].every(word => items[key(word)]?.independent >= 2 && learningStage(items[key(word)]) === 'remembered');
}

function deliveryTargets(path, items, rng, now) {
  const cargo = path === 'cargo';
  const bank = cargo ? colors : animals;
  const early = cargo ? colors.slice(0, 4) : animals.slice(0, 4);
  const model = pick(cargo ? ['red', 'yellow', 'green'] : early, rng);
  const starters = [model, ...shuffle(early.filter(word => word !== model), rng).slice(0, 2)];
  const rest = bank.filter(word => !starters.includes(word));
  // Give an already understood word a place later in the round so it can be
  // recognized in a fresh illustration, using the existing review priorities.
  const [review] = choosePractice(rest.filter(word => items[key(word)]?.independent), items, key, 1, now, rng);
  const later = shuffle(rest.filter(word => word !== review), rng);
  const count = cargo ? 2 : 3;
  const practice = review ? [review, ...later.slice(0, count - 1)] : later.slice(0, count);
  if (cargo) {
    if (rest.includes('blue') && !practice.includes('blue')) practice[practice.length - 1] = 'blue';
    // Introduce “boat” at the end once. After Ariel recognizes it independently,
    // it can appear alongside the other words in any of the three review slots.
    if (!items[key('boat')]?.independent) return [...starters, ...shuffle(practice, rng), 'boat'];
    practice.push('boat');
  }
  return [...starters, ...shuffle(practice, rng)];
}

function questionsFor({ id, path, targets, settings }) {
  let seed = parseInt(id.slice(0, 8), 16);
  const rng = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 2 ** 32);
  const order = answerShuffler(rng);
  return targets.map((answer, i) => {
    const scene = settings[i];
    const cargo = path === 'cargo', noun = answer === 'boat';
    const distractors = cargo ? noun ? ['ball', 'gift', 'bucket'] : colors.filter(color => color !== answer)
      : animals.filter(animal => animal !== answer);
    const simpler = cargo && !noun ? distractors.filter(color => colors.indexOf(color) < 4) : distractors.slice(0, 4);
    const pool = i < 3 && simpler.length >= 2 ? simpler : distractors;
    const choices = order([answer, ...shuffle(pool, rng).slice(0, i < 3 ? 1 : 2)], answer);
    return { answer, choices, scene, clip: wordClip(answer), kind: cargo && !noun ? 'color' : cargo ? 'object' : 'animal',
      art: cargo && !noun ? cargoObjects[scene] : null };
  });
}

const startState = () => ({ attempted: [], hint: false });

export function createDeliveryRound(path, items = {}, { rng = Math.random, now = Date.now() } = {}) {
  if (!pathNames.includes(path)) throw new RangeError('Unknown delivery mission');
  const targets = deliveryTargets(path, items, rng, now);
  const offset = Math.floor(rng() * scenes.length);
  const settings = targets.map((word, index) => {
    const scene = (offset + Math.floor(index / 2)) % scenes.length;
    return items[key(word)]?.mode === `bobi-${scenes[scene]}` ? scenes[(scene + 1) % scenes.length] : scenes[scene];
  });
  const plan = { version, id: crypto.randomUUID(), path, targets, settings };
  return { ...plan, questions: questionsFor(plan), index: 0, state: startState(), resolved: false, helped: [0], at: 0 };
}

export function createDeliveryBonus(rng = Math.random) {
  const answer = 'blue-boat';
  const choices = shuffle([answer, 'blue-ball', `${pick(['red', 'yellow', 'green'], rng)}-boat`], rng);
  return { id: crypto.randomUUID(), path: 'pair', index: 0, helped: [], resolved: false, state: startState(),
    questions: [{ answer, choices, scene: 'cove', clip: 'delivery-en-blue-boat', kind: 'pair' }] };
}

export function advanceDelivery(round) {
  if (!round.resolved || round.index >= round.questions.length - 1) return false;
  round.index += 1;
  round.resolved = false;
  round.state = startState();
  return true;
}

export function deliveryEvidence(round) {
  const q = round.questions[round.index];
  return { item: round.path === 'pair' ? `english:pair:${q.answer}` : key(q.answer), domain: 'english',
    eventId: `delivery:${round.id}:${round.index}`, mode: `bobi-${q.scene}` };
}

export function packDeliveryRound({ questions, ...saved }) { return saved; }

export function cleanDeliveryRound(path, saved) {
  if (!saved || saved.version !== version || !pathNames.includes(path) || saved.path !== path
    || typeof saved.id !== 'string' || !validId.test(saved.id) || !Number.isInteger(saved.index)
    || saved.index < 0 || saved.index >= DELIVERY.steps) return null;
  const { id, index, targets, settings } = saved;
  const cargo = path === 'cargo';
  if (!Array.isArray(targets) || targets.length !== DELIVERY.steps || new Set(targets).size !== targets.length
    || !Array.isArray(settings) || settings.length !== DELIVERY.steps || settings.some(scene => !scenes.includes(scene))) return null;
  if (cargo && targets.indexOf('boat') < 3) return null;
  if (!targets.every(word => cargo ? word === 'boat' || colors.includes(word) : animals.includes(word))) return null;
  const questions = questionsFor({ id, path, targets, settings });
  const question = questions[index];
  const attempts = Array.isArray(saved.state?.attempted) ? saved.state.attempted : [];
  const attempted = [...new Set(attempts)].filter(value => value !== question.answer && question.choices.includes(value));
  const hint = saved.state?.hint === true;
  const helped = [0, ...Array.from({ length: index }, (_, i) => i + 1).filter(i =>
    (Array.isArray(saved.helped) && saved.helped.includes(i)) || (i === index && (hint || attempted.length)))];
  const at = Number.isSafeInteger(saved.at) && saved.at > 0 ? saved.at : 0;
  return { id, version, path, targets, settings, questions, index, state: { attempted, hint }, helped, resolved: saved.resolved === true, at };
}

export function cleanDelivery(input) {
  const finished = Array.isArray(input?.finished) ? pathNames.filter(path => input.finished.includes(path)) : [];
  const drafts = Object.fromEntries(pathNames.flatMap(path => {
    const round = cleanDeliveryRound(path, input?.drafts?.[path]);
    return round ? [[path, packDeliveryRound(round)]] : [];
  }));
  return { drafts, finished };
}
