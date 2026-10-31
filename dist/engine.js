import { ANIMALS, COLORS, NUMBERS, STICKERS, MISSION_IDS } from './content.js';
import { CLOCK_LEVELS, clockTime, clockConceptRank } from './clock.js';
import { LETTERS, letterGroup } from './letters.js';
import { READING_LEVELS, readingWords, readingTargets } from './reading.js';
import { isSticker } from './stickers.js';
import { sanitizeLetterPractice, recordLetters, suggestedLetters } from './letter-progress.js';
import { distinctWordPictures } from './vocabulary.js';
import { SESSION_LENGTH, adventurePhase, choiceCount } from './adventure.js';
import { sanitizeClockLessons } from './clock-learning.js';
export { SESSION_LENGTH } from './adventure.js';

export const DEFAULT_SETTINGS = Object.freeze({ nikud: true, reading: 'short', mathMax: 10, englishMax: 10, clockLevel: 'hours', letterLanguage: 'hebrew', letterWriting: Object.freeze({ hebrew: 0, english: 0 }), sound: true, motion: true });

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

export function numberOptions(answer, max, rng = Math.random, count = 3) {
  const candidates = Array.from({ length: max + 1 }, (_, n) => n).filter(n => n !== answer);
  // Nearby alternatives make the choice useful without following a predictable pattern.
  const neighbors = shuffle(candidates.filter(n => Math.abs(n - answer) <= 3), rng);
  const others = shuffle(candidates.filter(n => Math.abs(n - answer) > 3), rng);
  return shuffle([answer, ...[...neighbors, ...others].slice(0, count - 1)], rng).map(n => ({ id: String(n), number: n }));
}

const readingSize = word => [...word.pointed.matchAll(/[א-ת]/gu)].length;
function readingOrder(a, b) {
  return a.level - b.level || (a.scene?.count || 0) - (b.scene?.count || 0) || a.he.split(' ').length - b.he.split(' ').length || readingSize(a) - readingSize(b);
}

export function createSession(mission, rawSettings = DEFAULT_SETTINGS, rng = Math.random) {
  const settings = { ...DEFAULT_SETTINGS, ...rawSettings };
  if (mission === 'letters') {
    const language = Object.hasOwn(LETTERS, settings.letterLanguage) ? settings.letterLanguage : 'hebrew';
    const selected = Array.isArray(settings.letterIds) ? [...new Set(settings.letterIds)].map(id => LETTERS[language].find(letter => letter.id === id)).filter(Boolean) : [];
    const group = selected.length === 3 ? selected : Number.isInteger(settings.letterStart) ? letterGroup(language, settings.letterStart) : suggestedLetters(settings.letterPractice, language);
    const targets = [...shuffle(group, rng), ...shuffle([...group, group[Math.floor(rng() * group.length)]], rng), ...shuffle(group, rng)];
    return targets.map((letter, i) => ({ id: `letters-${i}`, type: 'letter', letter, answer: letter.id, phase: adventurePhase(i), showModel: i < 3, options: optionsFrom(group, letter, rng, i < 7 ? 2 : 3), prompt: `letter-match-${language}`, targetClip: letter.clip, hint: 'letters-recognition-hint' }));
  }
  if (mission === 'hebrew') {
    const pool = readingWords(settings.reading);
    const targets = settings.reading === 'all'
      ? Object.values(READING_LEVELS).filter(stage => stage.number).sort((a, b) => a.number - b.number).flatMap(stage => readingTargets(pool.filter(word => word.level === stage.level), settings.readingRecent, 1, rng))
      : readingTargets(pool, settings.readingRecent, SESSION_LENGTH, rng).sort(readingOrder);
    // Prefer unseen reading targets before reviewing the oldest practiced ones.
    return Array.from({ length: SESSION_LENGTH }, (_, i) => {
      const word = targets[i % targets.length];
      const choices = word.family ? pool.filter(item => item.family === word.family) : pool.filter(item => !item.family && distinctWordPictures(word, item));
      return { id: `he-${i}`, type: 'read', word, answer: word.id, phase: adventurePhase(i), options: optionsFrom(choices, word, rng, choiceCount(i)), prompt: word.scene ? 'reading-phrase' : 'read', hint: word.scene ? 'reading-phrase-hint' : 'read-hint' };
    });
  }
  if (mission === 'english') {
    const max = [10, 20].includes(settings.englishMax) ? settings.englishMax : 10;
    const select = (pool, ids) => shuffle(pool.filter(item => ids.includes(item.id)), rng);
    const animals = [...select(ANIMALS, ['dog', 'cat', 'fish']).slice(0, 1), ...select(ANIMALS, ['bird', 'duck', 'bear']).slice(0, 2), ...select(ANIMALS, ['horse', 'rabbit']).slice(0, 1)];
    const colors = [select(COLORS, ['red', 'blue', 'yellow'])[0], select(COLORS, ['green', 'pink'])[0], select(COLORS, ['purple', 'orange'])[0]];
    const numbers = [1 + Math.floor(rng() * 3), 4 + Math.floor(rng() * 3), 7 + Math.floor(rng() * (max - 6))];
    let animal = 0, color = 0, number = 0;
    return ['animal', 'color', 'number', 'animal', 'color', 'number', 'animal', 'animal', 'color', 'number'].map((kind, i) => {
      const n = kind === 'number' ? numbers[number++] : null;
      const target = kind === 'animal' ? animals[animal++] : kind === 'color' ? colors[color++] : { id: String(n), number: n, en: NUMBERS[n] };
      const options = kind === 'number' ? numberOptions(n, max, rng, choiceCount(i)) : optionsFrom(kind === 'animal' ? ANIMALS : COLORS, target, rng, choiceCount(i));
      return { id: `en-${i}`, type: 'listen', kind, target, answer: target.id, options, phase: adventurePhase(i), prompt: 'listen', targetClip: `en-${target.id}`, hint: 'english-hint' };
    });
  }
  if (mission === 'math') {
    const max = [5, 10, 20].includes(settings.mathMax) ? settings.mathMax : 10;
    const sums = Array.from({ length: SESSION_LENGTH - 3 }, (_, i) => Math.round(4 + (max - 4) * i / (SESSION_LENGTH - 4)));
    const additions = [];
    for (const total of [...new Set(sums)]) {
      const count = sums.filter(n => n === total).length;
      const pairs = shuffle(Array.from({ length: total - 1 }, (_, i) => [i + 1, total - i - 1]), rng).sort((a, b) => Math.min(...a) - Math.min(...b));
      for (let i = 0; i < count; i++) {
        const fraction = count === 1 ? sums.indexOf(total) / (sums.length - 1) : i / (count - 1);
        const [a, b] = pairs[Math.round(fraction * (pairs.length - 1))];
        additions.push({ total, a, b });
      }
    }
    return Array.from({ length: SESSION_LENGTH }, (_, i) => {
      const add = i >= 3;
      const { total, a, b } = add ? additions[i - 3] : { total: i + 2, a: i + 2, b: 0 };
      return { id: `math-${i}`, type: add ? 'add' : 'count', a, b, answer: String(total), total, phase: adventurePhase(i), item: i % 3 === 0 ? 'apple' : i % 3 === 1 ? 'flower' : 'berry', options: numberOptions(total, max, rng, choiceCount(i)), prompt: add ? 'add' : 'count', hint: add ? 'add-hint' : 'count-hint' };
    });
  }
  if (mission === 'clock') {
    const level = CLOCK_LEVELS[settings.clockLevel] || CLOCK_LEVELS.hours;
    const hours = shuffle(Array.from({ length: 12 }, (_, i) => i + 1), rng).slice(0, SESSION_LENGTH).sort((a, b) => a - b);
    const sample = pool => shuffle(pool,rng).slice(0,2).sort((a,b)=>a-b);
    const minutes = settings.clockLevel === 'minutes'
      ? [0,30,15,45,...sample([5,10,20,25,35,40,50,55]),...sample([1,2,3,4,6,7,8,9]),...sample(Array.from({length:49},(_,i)=>i+11).filter(n=>n%5))]
      : level.minutes.length === 1 ? Array(SESSION_LENGTH).fill(0) : level.minutes.length === 2 ? [0, 0, 0, 0, 30, 30, 30, 30, 30, 30] : [0, 0, 30, 30, 15, 15, 15, 45, 45, 45];
    return hours.map((hour, i) => {
      const time = clockTime(hour, minutes[i]);
      const next = hour % 12 + 1;
      const alternatives = level.minutes.filter(n => n !== time.minute && clockConceptRank(n) <= clockConceptRank(time.minute));
      const otherMinute = alternatives.length ? alternatives[Math.floor(rng() * alternatives.length)] : 0;
      const other = alternatives.length ? clockTime(hour, otherMinute) : clockTime((hour + 10) % 12 + 1, 0);
      return { id: `clock-${i}`, type: 'clock', time, answer: time.id, phase: adventurePhase(i), options: shuffle([time, other, clockTime(next, time.minute === 45 ? 0 : time.minute)].slice(0, choiceCount(i)), rng), prompt: 'clock-read', hint: [0,15,30,45].includes(time.minute) ? `clock-tip-${time.minute}` : time.minute%5===0 ? 'school-fives' : 'school-minutes' };
    });
  }
  throw new Error(`Unknown mission: ${mission}`);
}

export function freshProgress() {
  return { version: 1, stars: 0, sessions: 0, stickers: [], missions: Object.fromEntries(MISSION_IDS.map(id => [id, 0])), skills: Object.fromEntries(MISSION_IDS.map(id => [id, { correct: 0, assisted: 0 }])), letterPractice: sanitizeLetterPractice(null), clockLessons: 0 };
}

export function finishSession(progress, mission, assisted = 0, letterRound = null) {
  const next = sanitizeProgress(progress);
  if (!MISSION_IDS.includes(mission)) throw new Error(`Unknown mission: ${mission}`);
  next.stars += SESSION_LENGTH;
  next.sessions += 1;
  next.missions[mission] += 1;
  next.skills[mission].correct += SESSION_LENGTH;
  next.skills[mission].assisted += assisted;
  if (mission === 'letters' && letterRound) next.letterPractice = recordLetters(next.letterPractice, letterRound.language, 'recognition', letterRound.ids);
  const sticker = STICKERS.find(id => !next.stickers.includes(id));
  if (sticker) next.stickers.push(sticker);
  return { progress: next, sticker: sticker || null };
}

export function sanitizeSettings(input) {
  const result = { ...DEFAULT_SETTINGS, letterWriting: { ...DEFAULT_SETTINGS.letterWriting } };
  if (!input || typeof input !== 'object') return result;
  for (const key of ['nikud', 'sound', 'motion']) if (typeof input[key] === 'boolean') result[key] = input[key];
  if (Object.hasOwn(READING_LEVELS, input.reading)) result.reading = input.reading;
  if ([5, 10, 20].includes(input.mathMax)) result.mathMax = input.mathMax;
  if ([10, 20].includes(input.englishMax)) result.englishMax = input.englishMax;
  if (Object.hasOwn(CLOCK_LEVELS, input.clockLevel)) result.clockLevel = input.clockLevel;
  if (Object.hasOwn(LETTERS, input.letterLanguage)) result.letterLanguage = input.letterLanguage;
  result.letterWriting = Object.fromEntries(Object.entries(LETTERS).map(([language, letters]) => [language, Number.isInteger(input.letterWriting?.[language]) && input.letterWriting[language] >= 0 && input.letterWriting[language] < letters.length ? input.letterWriting[language] : 0]));
  return result;
}

export function sanitizeProgress(input) {
  const result = freshProgress();
  if (!input || input.version !== 1) return result;
  const nonnegative = x => Number.isSafeInteger(x) && x >= 0 ? x : 0;
  result.stars = nonnegative(input.stars);
  result.sessions = nonnegative(input.sessions);
  const savedStickers = new Set(Array.isArray(input.stickers) ? input.stickers.filter(isSticker) : []);
  // Older albums stopped at twelve; completed adventures still earned rewards.
  result.stickers = STICKERS.filter((id, index) => index < result.sessions || savedStickers.has(id));
  for (const key of Object.keys(result.missions)) {
    result.missions[key] = nonnegative(input.missions?.[key]);
    result.skills[key].correct = nonnegative(input.skills?.[key]?.correct);
    result.skills[key].assisted = Math.min(result.skills[key].correct, nonnegative(input.skills?.[key]?.assisted));
  }
  result.letterPractice = sanitizeLetterPractice(input.letterPractice, !input.letterPractice && result.missions.letters > 0);
  result.clockLessons = sanitizeClockLessons(input.clockLessons);
  return result;
}
