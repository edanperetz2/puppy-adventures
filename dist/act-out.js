import { SESSION_LENGTH } from './adventure.js?v=2.2.2-six';
import { shuffle } from './answer-order.js';

export const ACT_OUT_PROMPT = 'act-out';
export const ACT_OUT_INSTRUCTION = 'קִרְאִי אֶת הַמִּשְׁפָּט. הַזִּיזִי אֶת מָה שֶׁמַּתְאִים.';

const regions = {
  box: ['on', 'in', 'near'],
  table: ['on', 'under', 'near'],
  flower: ['above', 'on', 'near'],
  tree: ['above', 'on', 'near'],
};
const landmarks = ['house', 'tree', 'tent', 'rock', 'mountain', 'cactus', 'palace', 'bridge', 'slide', 'swing', 'traffic-light', 'firetruck'];
const playColors = ['red', 'blue', 'yellow', 'green', 'pink', 'purple'];
const landmarkGroup = { house: 'building', palace: 'building', rock: 'stone', mountain: 'stone' };
const landmarkKind = id => landmarkGroup[id] || id;
const animals = ['rabbit', 'dog', 'cat'];
const foods = ['meat', 'chicken-leg', 'fish', 'carrot', 'lettuce'];

export function actOutPrompt(word) {
  if (word.scene.kind !== 'action') return ACT_OUT_PROMPT;
  return word.scene.action === 'jump' ? 'act-out-jump' : 'act-out-feed';
}

export function canActOut(word) {
  const scene = word?.scene;
  if (word?.level !== 10 || !scene) return false;
  if (scene.kind === 'action') return animals.includes(scene.object) && (scene.action === 'jump' || scene.action === 'eat' && foods.includes(scene.food));
  if (scene.kind === 'travel') return scene.object === 'car' && landmarks.includes(scene.anchor) && playColors.includes(scene.color);
  if (scene.kind === 'position') return Object.hasOwn(regions, scene.anchor) && regions[scene.anchor].includes(scene.position);
  return scene.kind === 'arrangement' && ['basket', 'box'].includes(scene.anchor) && ['in', 'near'].includes(scene.position) && scene.count >= 2 && scene.count <= 4;
}

export function actOutSteps(questions) {
  if (questions.length !== SESSION_LENGTH) return [];
  const eligible = questions.flatMap((q, index) => q.type === 'read' && canActOut(q.word) ? [index] : []);
  const kind = index => questions[index].word.scene.kind;
  const animal = eligible.find(index => kind(index) === 'action');
  const first = animal ?? eligible[0];
  const spaced = eligible.filter(index => Math.abs(index - first) > 1);
  const second = spaced.find(index => kind(index) !== kind(first)) ?? spaced[0];
  return [first, second].filter(index => index !== undefined).sort((a, b) => a - b);
}

// The round ID keeps the piece order and scenery stable when a story resumes.
export function actOutPlan(word, roundId) {
  const scene = word.scene;
  let seed = parseInt(roundId.slice(0, 8), 16) ^ word.id.split('').reduce((hash, char) => Math.imul(hash, 31) + char.charCodeAt(0), 0);
  const rng = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 2 ** 32);
  if (scene.kind === 'action') {
    const [other] = shuffle(animals.filter(animal => animal !== scene.object), rng);
    const destinations = scene.size ? shuffle(['small', 'big'], rng) : shuffle([scene.object, other], rng);
    const pieces = scene.action === 'eat'
      ? shuffle([scene.food, ...shuffle(foods.filter(food => food !== scene.food), rng).slice(0, 2)], rng).map(food => ({ food }))
      : [{}];
    return { pieces, destinations, target: scene.size || scene.object, count: 1 };
  }
  const colors = scene.color ? shuffle([scene.color, ...shuffle(playColors.filter(color => color !== scene.color), rng).slice(0, 1)], rng) : [''];
  const pieces = scene.kind === 'arrangement'
    ? Array.from({ length: scene.count + 1 }, () => ({ color: '' }))
    : scene.size ? shuffle([{ size: 'small', color: '' }, { size: 'big', color: '' }], rng) : colors.map(color => ({ color }));
  let destinations = scene.kind === 'arrangement' ? ['in', 'near'] : regions[scene.anchor];
  if (scene.kind === 'travel') {
    const [other] = shuffle(landmarks.filter(landmark => landmarkKind(landmark) !== landmarkKind(scene.anchor)), rng);
    destinations = shuffle([scene.anchor, other], rng);
  }
  return { pieces, destinations, target: scene.kind === 'travel' ? scene.anchor : scene.position, count: scene.count || 1 };
}

export function actOutMatches(word, plan, pieceIndex, destination) {
  const piece = plan.pieces[pieceIndex];
  if (!piece || destination !== plan.target) return false;
  const { kind, food, size, color } = word.scene;
  if (kind === 'action') return food === piece.food;
  return (!color || color === piece.color) && (!size || size === piece.size);
}

export function cleanActOutMoves(word, roundId, value, resolved = false) {
  const plan = actOutPlan(word, roundId);
  const moves = (Array.isArray(value) ? [...new Set(value)] : [])
    .filter(index => Number.isInteger(index) && actOutMatches(word, plan, index, plan.target));
  if (!resolved) return moves.slice(0, plan.count - 1);
  for (const index of plan.pieces.keys()) {
    if (!moves.includes(index) && actOutMatches(word, plan, index, plan.target)) moves.push(index);
  }
  return moves.slice(0, plan.count);
}
