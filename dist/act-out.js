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

export function canActOut(word) {
  const scene = word?.scene;
  if (word?.level !== 10 || !scene) return false;
  if (scene.kind === 'travel') return scene.object === 'car' && landmarks.includes(scene.anchor) && playColors.includes(scene.color);
  if (scene.kind === 'position') return Object.hasOwn(regions, scene.anchor) && regions[scene.anchor].includes(scene.position);
  return scene.kind === 'arrangement' && ['basket', 'box'].includes(scene.anchor) && ['in', 'near'].includes(scene.position) && scene.count >= 2 && scene.count <= 4;
}

export function actOutSteps(questions) {
  if (questions.length !== SESSION_LENGTH) return [];
  const eligible = questions.flatMap((q, index) => q.type === 'read' && canActOut(q.word) ? [index] : []);
  const first = eligible[0];
  const remaining = eligible.filter(index => index > first + 1);
  const second = remaining.find(index => questions[index].word.scene.kind !== questions[first].word.scene.kind) ?? remaining[0];
  return [first, second].filter(index => index !== undefined);
}

// The round ID keeps the piece order and scenery stable when a story resumes.
export function actOutPlan(word, roundId) {
  const scene = word.scene;
  let seed = parseInt(roundId.slice(0, 8), 16) ^ word.id.split('').reduce((hash, char) => Math.imul(hash, 31) + char.charCodeAt(0), 0);
  const rng = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 2 ** 32);
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
  return Boolean(piece && destination === plan.target && (!word.scene.color || word.scene.color === piece.color) && (!word.scene.size || word.scene.size === piece.size));
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
