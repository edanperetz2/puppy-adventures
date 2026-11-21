import { adventurePhase, choiceCount, SESSION_LENGTH } from './adventure.js?v=2.2.2-six';
import { answerShuffler, shuffle } from './answer-order.js';
import { BLEND_GROUPS, ENGLISH_OBJECTS } from './english-expansion.js';
import { WRITING_WORDS } from './letter-words.js';
import { WORDS } from './reading.js';

// Writing practice already checks that each printed letter has a matching
// handwritten form, including the five Hebrew final letters.
const writingBank = language => WRITING_WORDS[language].map(({ id, plain, text, clip }) =>
  ({ id, language, plain, pointed: text, clip }));

const hebrew = writingBank('hebrew');
// Extend familiar spellings with real neighbours, e.g. ארנב / ארנק and גשר / גזר.
const neighbouringNouns = ['eagle', 'orange-fruit', 'salt', 'honey', 'couch', 'bucket', 'mug',
  'pot', 'rain', 'fire', 'wallet', 'eye', 'pen', 'eraser', 'knot', 'island', 'melon', 'cup'];
for (const word of WORDS.filter(word => neighbouringNouns.includes(word.id))) {
  if (!hebrew.some(other => other.plain === word.he) && word.pointed.replace(/\p{M}/gu, '') === word.he) {
    hebrew.push({ id: word.id, language: 'hebrew', plain: word.he, pointed: word.pointed, clip: `he-${word.id}` });
  }
}

const english = writingBank('english');
function addEnglish(id, plain, clip) {
  if (!english.some(other => other.plain === plain)) english.push({ id, language: 'english', plain, pointed: plain, clip });
}
for (const { id, en } of ENGLISH_OBJECTS) addEnglish(id, en, `en-${id}`);
for (const color of ['red', 'blue', 'pink', 'green', 'black', 'white', 'brown', 'yellow']) {
  addEnglish(color, color.toUpperCase(), `en-${color}`);
}
for (const word of BLEND_GROUPS.flat()) addEnglish(word, word.toUpperCase(), `journey-en-${word}`);

export const WORD_FORM_WORDS = { english, hebrew };

const familiar = {
  english: new Set(['CAT', 'DOG', 'PIG', 'COW', 'FOX', 'SUN', 'ANT', 'OWL', 'HAT', 'RED', 'EGG', 'CAR', 'BUS', 'BED', 'EYE']),
  hebrew: new Set(['דג', 'ים', 'עץ', 'יד', 'הר', 'לב', 'צב', 'אש', 'אף', 'סל', 'עז', 'סוס', 'כלב', 'בית', 'ספר', 'שמש', 'פרה', 'קוף']),
};

function differingLetters(a, b) {
  if (a.length !== b.length) return Infinity;
  let count = 0;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) count++;
  return count;
}

// Build the relationships once, independent of any saved question order.
function makeCatalog(language, words) {
  const neighbours = new Map(words.map(word => [word.id, words.filter(other =>
    word.plain[0] === other.plain[0] && differingLetters(word.plain, other.plain) === 1)]));
  return {
    words, neighbours, byId: new Map(words.map(word => [word.id, word])),
    warmup: words.filter(word => familiar[language].has(word.plain)),
  };
}
const catalogs = { english: makeCatalog('english', english), hebrew: makeCatalog('hebrew', hebrew) };

function distractors(catalog, target, index, rng) {
  if (index < 2) {
    const others = shuffle(catalog.warmup.filter(word => word.plain[0] !== target.plain[0]), rng);
    return [others.find(word => word.plain.length === target.plain.length) || others[0]];
  }
  const others = shuffle(catalog.words.filter(word => word.id !== target.id), rng);
  const sameInitial = word => word.plain[0] === target.plain[0];
  const sameLength = word => word.plain.length === target.plain.length;
  if (index < 4) {
    // Practise a shared initial, with a more distinct third option.
    const similar = others.find(word => sameInitial(word) && sameLength(word)) || others.find(sameInitial) || others[0];
    const distinct = others.find(word => word !== similar && !sameInitial(word) && sameLength(word))
      || others.find(word => word !== similar);
    return [similar, distinct];
  }
  // The last two prompts cannot be solved from the first letter or the word length.
  const twin = shuffle(catalog.neighbours.get(target.id), rng)[0];
  const sameSize = others.filter(word => word !== twin && sameLength(word));
  const other = sameSize.find(word => differingLetters(target.plain, word.plain) === 1)
    || sameSize.find(sameInitial) || sameSize[0];
  return [twin, other];
}

function question(language, index, word, options) {
  return { id: `word-form-${index}`, type: 'word-form', phase: adventurePhase(index), word,
    answer: word.id, options, prompt: `word-form-${language}`, hint: `word-form-${language}-hint` };
}

export function makeWordFormQuestions(language, recentIds = [], rng = Math.random) {
  if (!Object.hasOwn(catalogs, language)) throw new RangeError('Unknown word-matching language');
  const catalog = catalogs[language];
  const recency = new Map(recentIds.map((id, index) => [id, index]));
  const available = shuffle(catalog.words, rng).sort((a, b) =>
    (recency.get(a.id) ?? -1) - (recency.get(b.id) ?? -1));
  const order = answerShuffler(rng);
  const questions = [];
  const endsInFinal = word => /[ךםןףץ]$/u.test(word.plain);
  for (let i = 0; i < SESSION_LENGTH; i++) {
    let eligible = available;
    if (i < 2) eligible = available.filter(word => familiar[language].has(word.plain));
    else if (i >= 4) eligible = available.filter(word => word.plain.length >= 3 && catalog.neighbours.get(word.id).length);
    else if (i === 3 && language === 'hebrew' && !questions.some(q => endsInFinal(q.word))) {
      eligible = available.filter(endsInFinal);
    }
    const word = eligible[0];
    available.splice(available.indexOf(word), 1);
    const options = order([word, ...distractors(catalog, word, i, rng)], word.id);
    questions.push(question(language, i, word, options));
  }
  return questions;
}

// Rebuild from the saved IDs. Re-sampling distractors on resume would forget
// which choices Ariel had already ruled out.
export function restoreWordFormQuestion(language, saved, index) {
  if (!Object.hasOwn(catalogs, language) || !Number.isInteger(index) || index < 0 || index >= SESSION_LENGTH ||
      saved?.type !== 'word-form' || !Array.isArray(saved.options) || saved.options.length !== choiceCount(index) ||
      new Set(saved.options).size !== saved.options.length || !saved.options.includes(saved.word)) return null;
  const { byId } = catalogs[language];
  const options = saved.options.map(id => byId.get(id));
  if (options.some(word => !word)) return null;
  return question(language, index, byId.get(saved.word), options);
}
