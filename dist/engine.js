import { choosePractice } from './learning.js';
import { ANIMALS, COLORS, NUMBERS, STICKERS, MISSIONS, MISSION_IDS } from './content.js';
import { CLOCK_LEVELS, clockTime, clockConceptRank } from './clock.js';
import { LETTERS, letterGroup } from './letters.js';
import { READING_LEVELS, mixedReadingTargets, readingWords, readingTargets } from './reading.js?v=2.2.2-six';
import { isSticker } from './stickers.js';
import { sanitizeLetterPractice, recordLetters, recognitionTargets } from './letter-progress.js';
import { distinctWordPictures } from './vocabulary.js';
import { SESSION_LENGTH, adventurePhase, choiceCount } from './adventure.js?v=2.2.2-six';
import { sanitizeClockLessons } from './clock-learning.js?v=2.2.4-practice';
import { CHARACTER_MODES, createCharacterSession, sanitizeCharacterSelection } from './characters.js?v=2.2.2-six';
import { answerShuffler, shuffle } from './answer-order.js';
export { SESSION_LENGTH } from './adventure.js?v=2.2.2-six';
export { shuffle };

export const DEFAULT_SETTINGS = Object.freeze({ nikud: true, reading: 'short', mathMax: 10, englishMax: 10, clockLevel: 'hours', letterLanguage: 'hebrew', letterWriting: Object.freeze({ hebrew: 0, english: 0 }), letterMainWriting: Object.freeze({ hebrew: 0, english: 0 }), letterWritingForm: Object.freeze({ hebrew: 'alternate', english: 'alternate' }), characterLevel: 'friends', characterCollectionLevels: Object.freeze({ crew: 'friends', paw: 'paw-friends' }), characterMode: 'mixed', sound: true, motion: true });

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
  const orderAnswers = answerShuffler(rng);
  return buildSession(mission, rawSettings, rng).map(question => ({
    ...question,
    options: orderAnswers(question.options, question.answer),
  }));
}

function buildSession(mission, rawSettings, rng) {
  const settings = { ...DEFAULT_SETTINGS, ...rawSettings };
  if (mission === 'characters') return createCharacterSession(settings, rng);
  if (mission === 'letters') {
    const language = Object.hasOwn(LETTERS, settings.letterLanguage) ? settings.letterLanguage : 'hebrew';
    const selected = Array.isArray(settings.letterIds) ? [...new Set(settings.letterIds)].map(id => LETTERS[language].find(letter => letter.id === id)).filter(Boolean) : [];
    const group = selected.length === 3 ? selected : Number.isInteger(settings.letterStart) ? letterGroup(language, settings.letterStart) : recognitionTargets(settings.letterPractice, language, settings.learning);
    const guided = shuffle(group, rng);
    const recall = shuffle(group, rng);
    if (recall[0] === guided.at(-1)) {
      const swap = 1 + Math.floor(rng() * (recall.length - 1));
      [recall[0], recall[swap]] = [recall[swap], recall[0]];
    }
    const targets = [...guided, ...recall];
    return targets.map((letter, i) => ({ id: `letters-${i}`, type: 'letter', letter, answer: letter.id, phase: adventurePhase(i), showModel: i < group.length, options: optionsFrom(group, letter, rng, adventurePhase(i) === 'challenge' ? 3 : 2), prompt: `letter-match-${language}`, targetClip: letter.clip, hint: 'letters-recognition-hint' }));
  }
  if (mission === 'hebrew') {
    const pool = readingWords(settings.reading);
    const targets = settings.reading === 'all'
      ? mixedReadingTargets(pool, settings.readingRecent, rng)
      : (settings.learning && Object.keys(settings.learning).length ? choosePractice(pool, settings.learning, word => `read:${word.id}`, SESSION_LENGTH, Date.now(), rng) : readingTargets(pool, settings.readingRecent, SESSION_LENGTH, rng)).sort(readingOrder);
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
    const knownStarters = ['dog', 'cat', 'fish'];
    const knownAnimals=ANIMALS.filter((a,index)=>index<8||settings.learning?.[`english:single:${a.id}`]?.independent>0);
    const newAnimal=ANIMALS.find(a=>!knownAnimals.includes(a));
    const reviewAnimals = knownAnimals.filter(animal => !knownStarters.includes(animal.id));
    const animalPool = newAnimal ? [...reviewAnimals, newAnimal] : reviewAnimals;
    const animals = [select(ANIMALS, knownStarters)[0],
      choosePractice(animalPool, settings.learning || {}, animal => `english:single:${animal.id}`, 1, Date.now(), rng)[0]];
    const reviewColors=COLORS.filter((c,index)=>index<7||settings.learning?.[`english:single:${c.id}`]?.independent>0);
    const colors = [select(COLORS, ['red', 'blue', 'yellow'])[0], ...choosePractice(reviewColors.filter(c=>!['red','blue','yellow'].includes(c.id)),settings.learning||{},c=>`english:single:${c.id}`,1,Date.now(),rng)];
    const numbers = [1 + Math.floor(rng() * 3), 4 + Math.floor(rng() * (max - 3))];
    let animal = 0, color = 0, number = 0;
    return ['animal', 'color', 'number', 'animal', 'color', 'number'].map((kind, i) => {
      const n = kind === 'number' ? numbers[number++] : null;
      const target = kind === 'animal' ? animals[animal++] : kind === 'color' ? colors[color++] : { id: String(n), number: n, en: NUMBERS[n] };
      const options = kind === 'number' ? numberOptions(n, max, rng, choiceCount(i)) : optionsFrom((kind === 'animal' ? ANIMALS : COLORS).filter(other=>other.id===target.id||distinctWordPictures(target,other)), target, rng, choiceCount(i));
      return { id: `en-${i}`, type: 'listen', kind, target, answer: target.id, options, phase: adventurePhase(i), prompt: 'listen', targetClip: `en-${target.id}`, hint: 'english-hint' };
    });
  }
  if (mission === 'math') {
    const max = [5, 10, 20].includes(settings.mathMax) ? settings.mathMax : 10;
    const counts = shuffle([1, 2, 3, 4], rng).slice(0, 2).sort((a, b) => a - b);
    const first = Math.max(3, counts.at(-1));
    const sumCount = SESSION_LENGTH - counts.length;
    const sums = max === 5
      ? [first, 4, 5, 5]
      : Array.from({ length: sumCount }, (_, i) => i === sumCount - 1 ? max : first + Math.floor((max - first) * (i + rng()) / (sumCount - 1)));
    const additions = [];
    for (const total of [...new Set(sums)]) {
      const count = sums.filter(n => n === total).length;
      const facts = Array.from({ length: total - 1 }, (_, i) => [i + 1, total - i - 1]);
      const ranked = choosePractice(facts, settings.learning || {}, ([a, b]) => `math:add:${a}:${b}`, facts.length, Date.now(), rng);
      const distinct = new Map();
      for (const pair of ranked) {
        const smaller = Math.min(...pair);
        if (!distinct.has(smaller)) distinct.set(smaller, pair);
      }
      const pairs = [...distinct].slice(0, count).sort(([a], [b]) => a - b).map(([, pair]) => pair);
      for (const [a, b] of pairs) additions.push({ total, a, b });
    }
    return Array.from({ length: SESSION_LENGTH }, (_, i) => {
      const add = i >= counts.length;
      const { total, a, b } = add ? additions[i - counts.length] : { total: counts[i], a: counts[i], b: 0 };
      const item=['apple','flower','berry','ball','star','heart'][Math.floor(rng()*6)];
      return { id: `math-${i}`, type: add ? 'add' : 'count', a, b, answer: String(total), total, phase: adventurePhase(i), item, options: numberOptions(total, max, rng, choiceCount(i)), prompt: add ? 'add' : 'count', hint: add ? 'add-hint' : 'count-hint' };
    });
  }
  if (mission === 'clock') {
    const level = CLOCK_LEVELS[settings.clockLevel] || CLOCK_LEVELS.hours;
    const hours = shuffle(Array.from({ length: 12 }, (_, i) => i + 1), rng).slice(0, SESSION_LENGTH).sort((a, b) => a - b);
    const sample = pool => pool[Math.floor(rng() * pool.length)];
    const minutes = settings.clockLevel === 'minutes'
      ? [0, 30, 15, 45, sample([5, 10, 20, 25, 35, 40, 50, 55]), sample(level.minutes.filter(n => n % 5))]
      : level.minutes.length === 1 ? Array(SESSION_LENGTH).fill(0) : level.minutes.length === 2 ? [0, 0, 0, 30, 30, 30] : [0, 0, 30, 15, 15, 45];
    const usedTimes=new Set();
    return hours.map((sampledHour, i) => {
      const hour=settings.learning&&Object.keys(settings.learning).length?choosePractice(Array.from({length:12},(_,h)=>h+1).filter(h=>!usedTimes.has(`${h}:${minutes[i]}`)),settings.learning,h=>`clock:${h}:${minutes[i]}`,1,Date.now(),rng)[0]:sampledHour;
      usedTimes.add(`${hour}:${minutes[i]}`);
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

export function finishSession(progress, mission, assisted = 0, letterRound = null, questionCount = SESSION_LENGTH) {
  const next = sanitizeProgress(progress);
  const skill = Object.hasOwn(MISSIONS, mission) ? MISSIONS[mission].progressMission || mission : null;
  if (!MISSION_IDS.includes(skill)) throw new Error(`Unknown mission: ${mission}`);
  next.stars += questionCount;
  next.sessions += 1;
  next.missions[skill] += 1;
  next.skills[skill].correct += questionCount;
  next.skills[skill].assisted += assisted;
  if (mission === 'letters' && letterRound) next.letterPractice = recordLetters(next.letterPractice, letterRound.language, 'recognition', letterRound.ids);
  const sticker = STICKERS.find(id => !next.stickers.includes(id));
  if (sticker) next.stickers.push(sticker);
  return { progress: next, sticker: sticker || null };
}

export function sanitizeSettings(input) {
  const result = { ...DEFAULT_SETTINGS, ...Object.fromEntries(['letterWriting', 'letterMainWriting', 'letterWritingForm'].map(key => [key, { ...DEFAULT_SETTINGS[key] }])) };
  Object.assign(result, sanitizeCharacterSelection(input));
  if (!input || typeof input !== 'object') return result;
  for (const key of ['nikud', 'sound', 'motion']) if (typeof input[key] === 'boolean') result[key] = input[key];
  if (Object.hasOwn(READING_LEVELS, input.reading)) result.reading = input.reading;
  if ([5, 10, 20].includes(input.mathMax)) result.mathMax = input.mathMax;
  if ([10, 20].includes(input.englishMax)) result.englishMax = input.englishMax;
  if (Object.hasOwn(CLOCK_LEVELS, input.clockLevel)) result.clockLevel = input.clockLevel;
  if (Object.hasOwn(LETTERS, input.letterLanguage)) result.letterLanguage = input.letterLanguage;
  if (Object.hasOwn(CHARACTER_MODES, input.characterMode)) result.characterMode = input.characterMode;
  for (const key of ['letterWriting', 'letterMainWriting']) result[key] = Object.fromEntries(Object.entries(LETTERS).map(([language, letters]) => [language, Number.isInteger(input[key]?.[language]) && input[key][language] >= 0 && input[key][language] < letters.length ? input[key][language] : 0]));
  result.letterWritingForm = Object.fromEntries(Object.keys(LETTERS).map(language => [language, input.letterWritingForm?.[language] === 'main' ? 'main' : 'alternate']));
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
