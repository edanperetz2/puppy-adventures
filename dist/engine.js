import { ANIMALS, COLORS, NUMBERS, STICKERS, MISSION_IDS } from './content.js';
import { CLOCK_LEVELS, clockTime } from './clock.js';
import { LETTERS, letterGroup } from './letters.js';
import { READING_LEVELS, readingWords, readingTargets } from './reading.js';
import { isSticker } from './stickers.js';
import { sanitizeLetterPractice, recordLetters, suggestedLetters } from './letter-progress.js';
import { distinctWordPictures } from './vocabulary.js';

export const DEFAULT_SETTINGS = Object.freeze({ nikud: true, reading: 'short', mathMax: 10, englishMax: 10, clockLevel: 'hours', letterLanguage: 'hebrew', letterWriting: Object.freeze({ hebrew: 0, english: 0 }), sound: true, motion: true });
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
  if (mission === 'letters') {
    const language = Object.hasOwn(LETTERS, settings.letterLanguage) ? settings.letterLanguage : 'hebrew';
    const selected = Array.isArray(settings.letterIds) ? [...new Set(settings.letterIds)].map(id => LETTERS[language].find(letter => letter.id === id)).filter(Boolean) : [];
    const group = selected.length === 3 ? selected : Number.isInteger(settings.letterStart) ? letterGroup(language, settings.letterStart) : suggestedLetters(settings.letterPractice, language);
    const targets = [group[0], ...shuffle([group[1], group[2], ...group], rng)];
    return targets.map((letter, i) => ({ id: `letters-${i}`, type: 'letter', letter, answer: letter.id, options: shuffle(group, rng), prompt: `letter-match-${language}`, targetClip: letter.clip, hint: 'letters-recognition-hint' }));
  }
  if (mission === 'hebrew') {
    const pool = readingWords(settings.reading);
    const targets = readingTargets(pool, settings.readingRecent, SESSION_LENGTH, rng);
    // Prefer unseen reading targets before reviewing the oldest practiced ones.
    return Array.from({ length: SESSION_LENGTH }, (_, i) => {
      const word = targets[i % targets.length];
      const choices = word.family ? pool.filter(item => item.family === word.family) : pool.filter(item => !item.family && distinctWordPictures(word, item));
      return { id: `he-${i}`, type: 'read', word, answer: word.id, options: optionsFrom(choices, word, rng), prompt: word.scene ? 'reading-phrase' : 'read', hint: word.scene ? 'reading-phrase-hint' : 'read-hint' };
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
  if (mission === 'clock') {
    const level = CLOCK_LEVELS[settings.clockLevel] || CLOCK_LEVELS.hours;
    const hours = shuffle(Array.from({ length: 12 }, (_, i) => i + 1), rng);
    const minutes = level.minutes.length === 1 ? [0, 0, 0, 0, 0, 0] : level.minutes.length === 2 ? shuffle([0, 30, 0, 30, 0, 30], rng) : shuffle([0, 15, 30, 45, 15, 45], rng);
    return hours.slice(0, SESSION_LENGTH).map((hour, i) => {
      const time = clockTime(hour, minutes[i]);
      const next = hour % 12 + 1;
      const alternatives = level.minutes.filter(n => n !== time.minute);
      const otherMinute = alternatives.length ? alternatives[Math.floor(rng() * alternatives.length)] : 0;
      const other = alternatives.length ? clockTime(hour, otherMinute) : clockTime((hour + 10) % 12 + 1, 0);
      return { id: `clock-${i}`, type: 'clock', time, answer: time.id, options: shuffle([time, other, clockTime(next, time.minute === 45 ? 0 : time.minute)], rng), prompt: 'clock-read', hint: `clock-tip-${time.minute}` };
    });
  }
  throw new Error(`Unknown mission: ${mission}`);
}

export function freshProgress() {
  return { version: 1, stars: 0, sessions: 0, stickers: [], missions: Object.fromEntries(MISSION_IDS.map(id => [id, 0])), skills: Object.fromEntries(MISSION_IDS.map(id => [id, { correct: 0, assisted: 0 }])), letterPractice: sanitizeLetterPractice(null) };
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
  return result;
}
