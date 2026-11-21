import { PICNIC, PICNIC_MISSIONS } from './activities.js';
import { actOutPlan, cleanActOutMoves } from './act-out.js?v=2.7.0-science';
import { answerShuffler } from './answer-order.js';
import { clockParts, clockTotal } from './clock-learning.js?v=2.2.4-practice';
import { numberOptions } from './engine.js?v=2.7.1-pepper';
import { PICTURE_PLACE_PASSAGES } from './reading-picture-places.js';

const revision = 2;
const paths = Object.keys(PICNIC_MISSIONS);
const capValues = [5, 10, 20];
const colors = ['red', 'blue', 'green', 'pink', 'purple', 'yellow'];
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const wordById = new Map(PICTURE_PLACE_PASSAGES.map(word => [word.id, word]));

export const picnicWord = ({ word }) => wordById.get(word);
const choose = (values, rng) => values[Math.floor(rng() * values.length)];

function originalReadingQuestions(rng) {
  const families = [
    'star-table-on',
    'ball-box-in',
    'heart-table-under',
    'flower-box-near',
    choose(['balloon-table-on', 'balloon-table-near', 'balloon-table-under'], rng),
    choose(['butterfly-tree-above', 'butterfly-tree-on', 'butterfly-tree-near'], rng),
  ];
  return families.map(family => ({ word: `picture-place-${family}-${choose(colors, rng)}` }));
}

function readingQuestions(rng) {
  const objects = new Set(), positions = new Set();
  return Array.from({ length: PICNIC.steps }, (_, index) => {
    const pool = PICTURE_PLACE_PASSAGES.filter(({ scene }) => {
      if (objects.has(scene.object)) return false;
      const flying = scene.object === 'bird' || scene.object === 'butterfly';
      if (index === 0) return !flying && ['in', 'on'].includes(scene.position);
      return index < 4 ? !flying : flying;
    });
    // Either flying animal can introduce "above"; it mustn't always be step five.
    const newPositions = pool.filter(({ scene }) => !positions.has(scene.position));
    const picked = choose(index !== 4 && newPositions.length ? newPositions : pool, rng);
    objects.add(picked.scene.object);
    positions.add(picked.scene.position);
    return { word: picked.id };
  });
}

function additionQuestions(cap, rng) {
  const bands = cap === 5
    ? [[[1, 1]], [[2, 2]], [[3, 1]], [[3, 2]], [[4, 1]]]
    : [[[2, 2], [3, 1]], [[3, 2], [4, 1]], [[4, 2], [3, 3]], [[4, 3], [5, 2]], [[4, 4], [5, 3], [6, 3]]];
  const order = answerShuffler(rng);
  const pairs = [[2, 1], ...bands.map(band => choose(band, rng))];
  return pairs.map(([a, b], index) => {
    // Vary which group comes first, including on transfer to a new setting.
    if (index > 0 && rng() < .5) [a, b] = [b, a];
    const choices = index === 0 ? [] : order(numberOptions(a + b, cap, rng, index === 1 ? 2 : 3).map(o => o.number), a + b);
    return { a, b, choices, move: index < 4, item: index === 5 ? 'bone' : index === 4 ? 'cookie' : 'apple' };
  });
}

function clockQuestions(rng) {
  const make = (start, target, duration = 0) => ({ start, target, duration });
  const arrival = choose([3, 4, 5, 6, 7, 8, 9, 11], rng);
  const earlier = choose([2, 3, 4, 5, 6, 7, 8, 9].filter(hour => hour !== arrival), rng);
  const exact = choose([7, 8, 11, 12, 13], rng);
  return [
    make(clockTotal(3), clockTotal(3, 1)),
    make(clockTotal(arrival - 1), clockTotal(arrival)),
    make(clockTotal(earlier), clockTotal(earlier, 5)),
    make(clockTotal(earlier + 1, 5), clockTotal(earlier + 1, exact)),
    make(clockTotal(arrival, 18), clockTotal(arrival, 21), 3),
    make(clockTotal(arrival, 56), clockTotal(arrival, 56) + 7, 7),
  ];
}

function questionsFor({ id, path, cap, revision }) {
  let seed = parseInt(id.slice(0, 8), 16);
  const rng = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 2 ** 32);
  if (path === 'reading') return revision === 1 ? originalReadingQuestions(rng) : readingQuestions(rng);
  if (path === 'addition') return additionQuestions(cap, rng);
  return clockQuestions(rng);
}

const startState = question => ({ moves: [], groups: [], attempted: [], total: question.start ?? 0, clue: '' });

export function createPicnicRound(path, cap) {
  if (!paths.includes(path)) throw new RangeError('Unknown picnic mission');
  const plan = { revision, id: crypto.randomUUID(), path, cap: capValues.includes(cap) ? cap : 10 };
  const questions = questionsFor(plan);
  return { ...plan, questions, index: 0, state: startState(questions[0]), helped: [0], resolved: false, at: 0 };
}

export function nextPicnicStep(round) {
  if (!round.resolved || round.index >= round.questions.length - 1) return false;
  round.index += 1;
  round.resolved = false;
  round.state = startState(round.questions[round.index]);
  return true;
}

export function picnicClockCorrect(question, total) {
  if (question.duration) return total - question.start === question.duration;
  const { hour, minute } = clockParts(total);
  const target = clockParts(question.target);
  return hour === target.hour && minute === target.minute;
}

export function picnicReadingModel(question, id) {
  const word = picnicWord(question);
  const { target } = actOutPlan(word, id);
  return cleanActOutMoves(word, id, [], true).map(index => ({ index, target }));
}

export function picnicItem(round) {
  const q = round.questions[round.index];
  if (round.path === 'reading') return `read:${q.word}`;
  if (round.path === 'addition') return `math:add:${q.a}:${q.b}`;
  const { hour, minute } = clockParts(q.target);
  return q.duration ? `picnic:clock:elapsed:${q.start}:${q.duration}` : `clock:${hour}:${minute}`;
}

export function packPicnicRound({ questions, ...saved }) { return saved; }

export function cleanPicnicRound(path, saved) {
  if (!saved || ![1, revision].includes(saved.revision) || saved.path !== path || !paths.includes(path) || typeof saved.id !== 'string' || !uuid.test(saved.id)
    || !capValues.includes(saved.cap) || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= PICNIC.steps) return null;
  const { id, cap, index, revision: savedRevision } = saved;
  const questions = questionsFor(saved);
  const q = questions[index], state = startState(q);
  const raw = saved.state;
  let resolved = saved.resolved === true;
  const numbers = array => Array.isArray(array) ? [...new Set(array.filter(Number.isInteger))] : [];
  const clues = path === 'reading' ? ['position', 'color', 'listen'] : ['model'];
  if (clues.includes(raw?.clue)) state.clue = raw.clue;
  if (path === 'reading') state.moves = cleanActOutMoves(picnicWord(q), id, raw?.moves, resolved);
  if (path === 'addition') {
    state.groups = q.move ? numbers(raw?.groups).filter(n => n === 0 || n === 1) : [];
    state.attempted = numbers(raw?.attempted).filter(n => q.choices.includes(n) && n !== q.a + q.b);
    if (q.move && state.groups.length < 2) resolved = false;
  }
  if (path === 'clock') {
    if (Number.isInteger(raw?.total) && raw.total >= -7200 && raw.total <= 7200) state.total = raw.total;
    if (resolved && !picnicClockCorrect(q, state.total)) resolved = false;
  }
  const helped = numbers(saved.helped).filter(n => n > 0 && n <= index);
  if (state.clue || state.attempted.length) helped.push(index);
  const at = Number.isSafeInteger(saved.at) && saved.at > 0 ? saved.at : 0;
  return { revision: savedRevision, id, path, cap, questions, index, state, resolved, helped: [...new Set([0, ...helped])], at };
}

export function cleanPicnic(input) {
  const finished = Array.isArray(input?.finished) ? paths.filter(path => input.finished.includes(path)) : [];
  const drafts = Object.fromEntries(paths.flatMap(path => {
    const round = cleanPicnicRound(path, input?.drafts?.[path]);
    return round ? [[path, packPicnicRound(round)]] : [];
  }));
  return { finished, drafts };
}
