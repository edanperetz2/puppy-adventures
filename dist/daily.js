import { SESSION_LENGTH } from './adventure.js?v=2.2.2-six';
import { answerShuffler, shuffle } from './answer-order.js';
import { CLOCK_ACTIVITIES_ENABLED, isPracticeAvailable } from './availability.js';
import { clockTotal } from './clock-learning.js?v=2.2.4-practice';
import { choosePractice, learningStage } from './learning.js';

export const DAILY_PATHS = Object.freeze({
  clock: { title: 'מָתַי הָרַכֶּבֶת יוֹצֵאת?', icon: 'train' },
  english: { title: 'הַחֲבֵרִים לְיַד הַבְּרֵכָה', icon: 'duck' },
});
export const DAILY_ANIMALS = ['dog', 'cat', 'duck', 'bird', 'fish', 'rabbit', 'frog', 'turtle', 'mouse'];
export const CLOCK_TRANSFER = 'daily:clock:past-hour';
export const CLOCK_MINUTES = 'daily:clock:minutes';
const englishKey = word => `daily:english:${word}`;
const legacyEnglishKey = word => `english:single:${word}`;
const experience = item => item?.last > 0 && (item.helped || item.independent);
const validId = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const stamp = value => Number.isSafeInteger(value) && value > 0 ? value : 0;
const timeId = ({ start, duration }) => `${start}/${duration}`;

function animalHistory(items) {
  const known = {};
  for (const word of DAILY_ANIMALS) {
    const a = items[englishKey(word)], b = items[legacyEnglishKey(word)];
    const record = (a?.last || 0) > (b?.last || 0) ? a : b;
    if (experience(record)) known[word] = record;
  }
  return known;
}

export function dailySuggestion(items, finished, progress, { clockEnabled = CLOCK_ACTIVITIES_ENABLED } = {}) {
  if (!clockEnabled) return 'english';
  const elapsed = Object.entries(items).filter(([key, item]) => experience(item)
    && (/^picnic:clock:elapsed:/u.test(key) || /^clock:/u.test(key) || key === CLOCK_TRANSFER || key === CLOCK_MINUTES));
  const clock = elapsed.length || progress?.missions?.clock || progress?.clockLessons;
  if (!clock) return 'english';
  const animals = Object.values(animalHistory(items));
  if (!animals.length && !progress?.missions?.english) return 'clock';
  if (finished.clock !== finished.english) return finished.clock < finished.english ? 'clock' : 'english';
  const lastClock = Math.max(0, ...elapsed.map(([, item]) => item.last));
  return lastClock <= Math.max(0, ...animals.map(item => item.last)) ? 'clock' : 'english';
}

const pairs = (minutes, durations, valid = () => true) => minutes.flatMap(minute =>
  durations.filter(duration => valid(minute, duration)).map(duration => [minute, duration]));
const timeBands = [
  pairs([9, 14, 21, 32, 43, 49], [1, 2]),
  pairs([6, 18, 24, 35, 41, 51], [3, 4]),
  pairs([55, 56, 57, 58, 59], [1, 2, 3, 4, 5], (minute, duration) => minute + duration === 60),
  pairs([56, 57, 58, 59], [4, 5, 6], (minute, duration) => minute + duration > 60),
  pairs([53, 54, 55, 56, 57, 58], [6, 7, 8], (minute, duration) => minute + duration > 60),
  pairs([52, 53, 54, 55, 56, 57, 58], [8, 9, 10], (minute, duration) => minute + duration > 60),
];

function trainQuestions(recent, rng) {
  const used = new Set(recent), answers = new Set();
  return timeBands.map((band, index) => {
    const pool = shuffle(Array.from({ length: 12 }, (_, h) => band.map(([minute, duration]) =>
      ({ start: clockTotal(h + 1, minute), duration }))).flat(), rng);
    return [0, 1].map(variant => {
      const available = pool.filter(q => !used.has(timeId(q)));
      const q = available.find(q => !answers.has((q.start + q.duration) % 720)) || available[0];
      used.add(timeId(q)); answers.add((q.start + q.duration) % 720);
      return { ...q, scene: (index + variant) % 3 };
    });
  });
}

function pondQuestions(items, rng, now) {
  const history = animalHistory(items);
  const known = choosePractice(Object.keys(history), history, word => word, SESSION_LENGTH, now, rng);
  const starters = DAILY_ANIMALS.slice(0, 6).filter(word => !known.includes(word));
  const words = [...known, ...shuffle(starters, rng)].slice(0, SESSION_LENGTH);
  const order = answerShuffler(rng);
  return words.map((word, index) => {
    const wrong = shuffle(DAILY_ANIMALS.filter(animal => animal !== word), rng);
    const count = index < 3 ? 1 : 2;
    const first = order([word, ...wrong.slice(0, count)], word);
    const second = shuffle(wrong.slice(count, count * 2), rng);
    second.splice((first.indexOf(word) + 1) % first.length, 0, word);
    return [{ word, choices: first, scene: index % 3 },
      { word, choices: second, scene: (index + 1) % 3 }];
  });
}

const startState = q => ({ total: q.start ?? 0, attempted: [], mistakes: 0, example: false, renewed: false });

export function createDailyRound(path, items, recent, { rng = Math.random, now = Date.now() } = {}) {
  if (!Object.hasOwn(DAILY_PATHS, path)) throw new RangeError('Unknown daily mission');
  const questions = path === 'clock' ? trainQuestions(recent, rng) : pondQuestions(items, rng, now);
  return { version: 1, id: crypto.randomUUID(), path, questions, index: 0,
    state: startState(questions[0][0]), helped: [], resolved: false, at: 0 };
}

export const dailyQuestion = round => round.questions[round.index][round.state.renewed ? 1 : 0];

function markHelped(round) {
  if (!round.helped.includes(round.index)) round.helped.push(round.index);
}

export function showDailyExample(round) {
  if (round.resolved || round.state.example || round.state.renewed) return false;
  round.state.example = true;
  markHelped(round);
  return true;
}

export function renewDailyStep(round) {
  if (!round.state.example) return false;
  round.state = { ...startState(round.questions[round.index][1]), renewed: true };
  return true;
}

export function moveDailyClock(round, total) {
  const q = dailyQuestion(round);
  if (round.path !== 'clock' || round.resolved || round.state.example || !Number.isInteger(total) || total === round.state.total
    || Math.abs(total - q.start) > 720) return false;
  round.state.total = total;
  return true;
}

export function attemptDaily(round, answer) {
  if (round.resolved || round.state.example) return 'ignored';
  const q = dailyQuestion(round), s = round.state;
  let correct;
  if (round.path === 'clock') {
    if (s.total === q.start) return 'ignored';
    correct = s.total - q.start === q.duration;
  } else {
    if (!q.choices.includes(answer) || s.attempted.includes(answer)) return 'ignored';
    correct = answer === q.word;
    if (!correct) s.attempted.push(answer);
  }
  if (correct) { round.resolved = true; return 'resolved'; }
  markHelped(round);
  s.mistakes += 1;
  return s.mistakes >= 2 && showDailyExample(round) ? 'example' : 'retry';
}

export function nextDailyStep(round) {
  if (!round.resolved || round.index >= round.questions.length - 1) return false;
  round.index++;
  round.state = startState(round.questions[round.index][0]);
  round.resolved = false;
  return true;
}

export function dailyEvidence(round) {
  const q = dailyQuestion(round);
  let item;
  if (round.path === 'clock') {
    const end = q.start + q.duration;
    item = Math.floor(end / 60) > Math.floor(q.start / 60) && end % 60 !== 0 ? CLOCK_TRANSFER : CLOCK_MINUTES;
  } else item = englishKey(q.word);
  return { item, domain: round.path, eventId: `daily:${round.id}:${round.index}` };
}

export function dailyRecall(items) {
  const remembered = key => Boolean(items[key] && learningStage(items[key]) === 'remembered');
  return { clock: remembered(CLOCK_TRANSFER), animals: DAILY_ANIMALS.filter(word => remembered(englishKey(word))) };
}

export function finishDailyMemory(daily, round, now = Date.now()) {
  daily.finished[round.path] = now;
  if (round.path === 'clock') {
    const used = round.questions.flat().map(timeId);
    daily.recent = [...new Set([...daily.recent, ...used])].slice(-24);
  }
}

function validCase(q, path) {
  if (!q || ![0, 1, 2].includes(q.scene)) return false;
  if (path === 'clock') return Number.isInteger(q.start) && q.start >= 0 && q.start < 720
    && Number.isInteger(q.duration) && q.duration >= 1 && q.duration <= 10;
  return DAILY_ANIMALS.includes(q.word) && Array.isArray(q.choices) && [2, 3].includes(q.choices.length)
    && new Set(q.choices).size === q.choices.length && q.choices.includes(q.word)
    && q.choices.every(word => DAILY_ANIMALS.includes(word));
}

export function cleanDailyRound(saved) {
  if (!saved || saved.version !== 1 || !Object.hasOwn(DAILY_PATHS, saved.path) || typeof saved.id !== 'string'
    || !validId.test(saved.id) || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= SESSION_LENGTH
    || !Array.isArray(saved.questions) || saved.questions.length !== SESSION_LENGTH) return null;
  const { id, path, questions, index } = saved;
  if (questions.some(pair => !Array.isArray(pair) || pair.length !== 2 || !pair.every(q => validCase(q, path)))) return null;
  const renewed = saved.state?.renewed === true;
  const q = questions[index][renewed ? 1 : 0], state = { ...startState(q), renewed };
  const raw = saved.state;
  state.example = raw?.example === true && !renewed;
  state.mistakes = Number.isSafeInteger(raw?.mistakes) ? Math.min(99, Math.max(0, raw.mistakes)) : 0;
  if (path === 'clock' && Number.isInteger(raw?.total) && Math.abs(raw.total - q.start) <= 720) state.total = raw.total;
  if (path === 'english' && Array.isArray(raw?.attempted)) state.attempted = [...new Set(raw.attempted)]
    .filter(word => q.choices.includes(word) && word !== q.word);
  const helped = [...new Set((Array.isArray(saved.helped) ? saved.helped : []).filter(n => Number.isInteger(n) && n >= 0 && n <= index))];
  if ((renewed || state.example || state.mistakes || state.attempted.length) && !helped.includes(index)) helped.push(index);
  const resolved = saved.resolved === true && !state.example && (path === 'english' || state.total - q.start === q.duration);
  return { id, version: 1, path, questions, index, state, helped, resolved, at: stamp(saved.at) };
}

export function cleanDaily(input) {
  const drafts = {};
  for (const key of ['today', ...Object.keys(DAILY_PATHS)]) {
    const draft = cleanDailyRound(input?.drafts?.[key]);
    if (draft && (key === 'today' || draft.path === key)) drafts[key] = draft;
  }
  const recent = (Array.isArray(input?.recent) ? input.recent : []).filter(value => typeof value === 'string' && /^\d{1,3}\/(?:[1-9]|10)$/u.test(value)).slice(-24);
  return { drafts, recent,
    finished: { clock: stamp(input?.finished?.clock), english: stamp(input?.finished?.english) } };
}

export function availableDailyDraft(drafts) {
  const [key, draft] = Object.entries(drafts).filter(([, draft]) => isPracticeAvailable(draft.path))
    .sort(([, a], [, b]) => b.at - a.at)[0] || [];
  return draft ? { key, draft } : null;
}
