import { SESSION_LENGTH, choiceCount } from './adventure.js?v=2.2.2-six';
import { answerShuffler } from './answer-order.js';
import { choosePractice } from './learning.js';

export const NUMBER_PATHS = Object.freeze({
  count: { title: 'סוֹפְרוֹת', icon: 'apple' },
  add: { title: 'מְחַבְּרוֹת', icon: 'flower' },
  left: { title: 'כַּמָּה נִשְׁאֲרוּ?', icon: 'pear' },
  tens: { title: 'עֲשָׂרוֹת וִיחִידוֹת', icon: 'star' },
});
export const numberClip = key => `number-workshop-${key}`;
export const numberQuestionClip = path => numberClip(path === 'left' || path === 'add' ? path : 'count');

const itemsForCounting = ['apple', 'flower', 'berry', 'ball', 'star', 'heart'];
const supportedCaps = [5, 10, 20];
const uuidPattern = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const range = (low, high) => Array.from({ length: high - low + 1 }, (_, i) => low + i);
const keyFor = (path, { total, part }) => {
  if (path === 'count') return `math:count:${total}:0`;
  if (path === 'add') return `math:add:${part}:${total - part}`;
  if (path === 'left') return `objects:takeaway:${total}:${part}`;
  return `objects:tens:${total}:${total - part}`;
};

function numberCases(path, cap) {
  if (path === 'tens') {
    return range(10, 100).map(total => {
      const part = total % 10;
      // Start with whole tens, then build teen numbers and larger numbers.
      const level = total <= 30 && part === 0 ? 0 : total < 20 ? 1 : total < 60 ? 2 : 3;
      return { total, part, level };
    });
  }
  if (path === 'count') return range(0, cap).map(total => ({ total, part: 0, level: 0 }));
  if (path === 'add') {
    return range(2, cap).flatMap(total => range(1, Math.floor(total / 2)).map(part => ({ total, part, level: 0 })));
  }
  // A few actual objects to take away, even when larger additions are enabled.
  return range(1, Math.min(cap, 8)).flatMap(total => range(1, Math.min(total, 3)).map(part => ({
    total, part, level: part === total ? 0 : part === 1 ? 1 : 2,
  })));
}

const byDifficulty = (a, b) => a.level - b.level || a.total - b.total || a.part - b.part;
const correctNumber = (path, { total, part }) => path === 'left' ? total - part : total;

export function spokenNumber(number) {
  if (number <= 20) return [`number-${number}`];
  const ones = number % 10;
  const tens = number - ones;
  return [tens === 20 ? 'number-20' : numberClip(tens), ...(ones ? [numberClip(`and-${ones}`)] : [])];
}

export function numberPrompt(path, task, index) {
  return [
    ...(path === 'left' ? [numberClip(`take-${task.part}`)] : path === 'tens' ? [numberClip('ten')] : []),
    numberQuestionClip(path),
    ...(index === 0 ? [numberClip('choose')] : []),
  ];
}

function getChoices(path, task, cap, count, order, rng, previousChoices) {
  const answer = correctNumber(path, task);
  const high = path === 'tens' ? 100 : path === 'left' ? Math.min(cap, 8) : cap;
  const low = path === 'tens' ? 10 : 0;
  const candidates = [
    ...(path === 'tens' ? [answer + 10, answer - 10, answer + 1, answer - 1] : []),
    ...[-2, -1, 1, 2, -3, 3].map(offset => answer + offset),
    ...range(low, high),
  ];
  const pool = [...new Set(candidates)].filter(n => n !== answer && n >= low && n <= high);
  if (path !== 'tens') pool.sort((a, b) => Math.abs(a - answer) - Math.abs(b - answer));
  const lead = pool.splice(path === 'tens' ? 0 : Math.floor(rng() * Math.min(pool.length, 3)), 1)[0];
  const options = [answer, lead, ...pool.slice(0, count - 2)];
  if (options.length === previousChoices?.length && options.every(n => previousChoices.includes(n))) {
    options[count - 1] = pool.find(n => !previousChoices.includes(n));
  }
  return order(options, answer);
}

export function newNumberRound(path, limit, items = {}, rng = Math.random) {
  const cap = supportedCaps.includes(limit) ? limit : 10;
  const order = answerShuffler(rng);
  const now = Date.now();
  const bank = numberCases(path, cap).sort(byDifficulty);
  const groups = path === 'tens' || path === 'left'
    ? Array.from({ length: path === 'tens' ? 4 : 3 }, (_, level) => bank.filter(task => task.level === level))
    : [0, 1, 2].map(i => bank.slice(Math.floor(i * bank.length / 3), Math.floor((i + 1) * bank.length / 3)));
  const slots = path === 'tens' ? [2, 2, 1, 1] : path === 'left' ? [1, 3, 2] : [2, 2, 2];
  const questions = [];
  for (const [i, group] of groups.entries()) {
    const previous = questions.at(-1);
    const available = path === 'left' && previous ? group.filter(task => correctNumber(path, task) !== correctNumber(path, previous)) : group;
    const ranked = choosePractice(available, items, task => keyFor(path, task), available.length, now, rng);
    const answers = new Set();
    const distinct = path === 'left' ? ranked.filter(task => {
      const answer = correctNumber(path, task);
      if (answers.has(answer)) return false;
      answers.add(answer);
      return true;
    }) : ranked;
    const selected = distinct.slice(0, slots[i]).sort(byDifficulty);
    for (const task of selected) {
      const before = questions.at(-1);
      questions.push({
        total: task.total, part: task.part,
        item: path === 'left' ? 'apple' : itemsForCounting[Math.floor(rng() * itemsForCounting.length)],
        choices: getChoices(path, task, cap, choiceCount(questions.length), order, rng, before?.choices),
      });
    }
  }
  return { id: globalThis.crypto.randomUUID(), path, cap, questions, index: 0, attempted: [], helped: [], resolved: false, hint: false, at: now };
}

export function numberQuestion(round) {
  const task = round.questions[round.index];
  return { ...task, answer: correctNumber(round.path, task), itemKey: keyFor(round.path, task) };
}

function trackGroups(...groups) {
  const steps = [];
  let counted = 0;
  for (const group of groups) {
    for (const { index, value } of group) {
      counted += value;
      steps.push({ index, number: counted });
    }
  }
  return steps;
}

export function numberModel(path, task) {
  const tokenSteps = (length, from = 0, value = 1) => range(from, from + length - 1).map(index => ({ index, value }));
  if (path === 'tens') {
    return { intro: numberClip('tens-hint'), steps: trackGroups(tokenSteps(Math.floor(task.total / 10), 0, 10), tokenSteps(task.part, Math.floor(task.total / 10))) };
  }
  if (path === 'add') {
    const large = task.total - task.part;
    return {
      intro: numberClip('add-hint'),
      steps: [
        { index: 'large', number: large },
        ...tokenSteps(task.part, large).map(({ index }, i) => ({ index, number: large + i + 1 })),
      ],
    };
  }
  return {
    intro: numberClip(path === 'left' ? 'left-hint' : 'count-hint'),
    steps: task.answer === 0 ? [{ index: 'empty', number: 0 }] : trackGroups(tokenSteps(task.answer)),
  };
}

export function cleanNumberRound(raw) {
  if (!raw || !Object.hasOwn(NUMBER_PATHS, raw.path) || !uuidPattern.test(raw.id || '')
      || !supportedCaps.includes(raw.cap) || !Array.isArray(raw.questions) || raw.questions.length !== SESSION_LENGTH
      || !Number.isInteger(raw.index) || raw.index < 0 || raw.index >= SESSION_LENGTH) return null;
  const { id, path, cap, index } = raw;
  const valid = new Set(numberCases(path, cap).map(({ total, part }) => `${total}:${part}`));
  const used = new Set();
  const questions = [];
  for (const task of raw.questions) {
    if (!Number.isInteger(task?.total) || !Number.isInteger(task.part) || !itemsForCounting.includes(task.item)) return null;
    if (path === 'left' && task.item !== 'apple') return null;
    const key = `${task.total}:${task.part}`;
    const max = path === 'tens' ? 100 : cap;
    const min = path === 'tens' ? 10 : 0;
    if (!valid.has(key) || used.has(key) || !Array.isArray(task.choices) || ![2, 3].includes(task.choices.length)
        || task.choices.some(n => !Number.isInteger(n) || n < min || n > max)
        || new Set(task.choices).size !== task.choices.length || !task.choices.includes(correctNumber(path, task))) return null;
    used.add(key);
    questions.push({ total: task.total, part: task.part, item: task.item, choices: [...task.choices] });
  }
  const { choices } = questions[index];
  const answer = correctNumber(path, questions[index]);
  return {
    id, path, cap, questions, index, resolved: raw.resolved === true, hint: raw.hint === true,
    attempted: [...new Set((Array.isArray(raw.attempted) ? raw.attempted : []).filter(n => choices.includes(n) && n !== answer))],
    helped: [...new Set((Array.isArray(raw.helped) ? raw.helped : []).filter(n => Number.isInteger(n) && n >= 0 && n <= index))],
    at: Number.isSafeInteger(raw.at) ? raw.at : 0,
  };
}
