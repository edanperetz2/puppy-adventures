import { WORDS, ANIMALS, COLORS, NUMBERS, STICKERS } from './content.js';

export const DEFAULT_SETTINGS = Object.freeze({ nikud: true, reading: 'short', mathMax: 10, englishMax: 10, sound: true, motion: true });
export const SESSION_LENGTH = 6;

export function shuffle(values, rng = Math.random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function optionsFrom(pool, correct, rng, count = 3) {
  return shuffle([correct, ...shuffle(pool.filter(x => x.id !== correct.id), rng).slice(0, count - 1)], rng);
}

export function numberOptions(answer, max, rng = Math.random) {
  const candidates = Array.from({ length: max + 1 }, (_, n) => n).filter(n => n !== answer);
  // Nearby alternatives make the choice useful without following a predictable pattern.
  const neighbors = shuffle(candidates.filter(n => Math.abs(n - answer) <= 3), rng);
  const others = shuffle(candidates.filter(n => Math.abs(n - answer) > 3), rng);
  return shuffle([answer, ...[...neighbors, ...others].slice(0, 2)], rng).map(n => ({ id: String(n), number: n }));
}

export function createSession(mission, rawSettings = DEFAULT_SETTINGS, rng = Math.random) {
  const settings = { ...DEFAULT_SETTINGS, ...rawSettings };
  if (mission === 'hebrew') {
    const pool = WORDS.filter(w => settings.reading === 'all' || w.level === 1);
    const targets = shuffle(pool, rng);
    // The short pool has five entries; repeat only after all five were encountered.
    return Array.from({ length: SESSION_LENGTH }, (_, i) => {
      const word = targets[i % targets.length];
      return { id: `he-${i}`, type: 'read', word, answer: word.id, options: optionsFrom(WORDS, word, rng), prompt: 'read', hint: 'read-hint' };
    });
  }
  if (mission === 'english') {
    const animals = shuffle(ANIMALS, rng);
    const colors = shuffle(COLORS, rng);
    const numbers = shuffle(Array.from({ length: settings.englishMax }, (_, i) => i + 1), rng);
    return shuffle(Array.from({ length: SESSION_LENGTH }, (_, i) => {
      const kind = ['animal', 'color', 'number'][i % 3];
      const target = kind === 'animal' ? animals[Math.floor(i / 3)] : kind === 'color' ? colors[Math.floor(i / 3)] : { id: String(numbers[Math.floor(i / 3)]), number: numbers[Math.floor(i / 3)], en: NUMBERS[numbers[Math.floor(i / 3)]] };
      const options = kind === 'number' ? numberOptions(target.number, settings.englishMax, rng) : optionsFrom(kind === 'animal' ? ANIMALS : COLORS, target, rng);
      return { id: `en-${i}`, type: 'listen', kind, target, answer: target.id, options, prompt: 'listen', targetClip: `en-${target.id}`, hint: 'english-hint' };
    }), rng);
  }
  if (mission === 'math') {
    const max = [5, 10, 20].includes(settings.mathMax) ? settings.mathMax : 10;
    const totals = shuffle(Array.from({ length: max - 1 }, (_, i) => i + 2), rng);
    return Array.from({ length: SESSION_LENGTH }, (_, i) => {
      const total = totals[i % totals.length];
      const add = i % 2 === 1;
      const a = add ? 1 + Math.floor(rng() * (total - 1)) : total;
      return { id: `math-${i}`, type: add ? 'add' : 'count', a, b: add ? total - a : 0, answer: String(total), total, item: i % 3 === 0 ? 'apple' : i % 3 === 1 ? 'flower' : 'berry', options: numberOptions(total, max, rng), prompt: add ? 'add' : 'count', hint: add ? 'add-hint' : 'count-hint' };
    });
  }
  throw new Error(`Unknown mission: ${mission}`);
}

export function freshProgress() {
  return { version: 1, stars: 0, sessions: 0, stickers: [], missions: { hebrew: 0, english: 0, math: 0 }, skills: { hebrew: { correct: 0, assisted: 0 }, english: { correct: 0, assisted: 0 }, math: { correct: 0, assisted: 0 } } };
}

export function finishSession(progress, mission, assisted = 0) {
  const next = structuredClone(progress);
  next.stars += SESSION_LENGTH;
  next.sessions += 1;
  next.missions[mission] += 1;
  next.skills[mission].correct += SESSION_LENGTH;
  next.skills[mission].assisted += assisted;
  const sticker = STICKERS.find(id => !next.stickers.includes(id));
  if (sticker) next.stickers.push(sticker);
  return { progress: next, sticker: sticker || null };
}

export function sanitizeSettings(input) {
  const result = { ...DEFAULT_SETTINGS };
  if (!input || typeof input !== 'object') return result;
  for (const key of ['nikud', 'sound', 'motion']) if (typeof input[key] === 'boolean') result[key] = input[key];
  if (['short', 'all'].includes(input.reading)) result.reading = input.reading;
  if ([5, 10, 20].includes(input.mathMax)) result.mathMax = input.mathMax;
  if ([10, 20].includes(input.englishMax)) result.englishMax = input.englishMax;
  return result;
}

export function sanitizeProgress(input) {
  const result = freshProgress();
  if (!input || input.version !== 1) return result;
  const nonnegative = x => Number.isSafeInteger(x) && x >= 0 ? x : 0;
  result.stars = nonnegative(input.stars);
  result.sessions = nonnegative(input.sessions);
  result.stickers = [...new Set(Array.isArray(input.stickers) ? input.stickers.filter(id => STICKERS.includes(id)) : [])];
  for (const key of Object.keys(result.missions)) {
    result.missions[key] = nonnegative(input.missions?.[key]);
    result.skills[key].correct = nonnegative(input.skills?.[key]?.correct);
    result.skills[key].assisted = Math.min(result.skills[key].correct, nonnegative(input.skills?.[key]?.assisted));
  }
  return result;
}
