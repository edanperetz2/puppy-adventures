import { SESSION_LENGTH } from './adventure.js?v=2.2.2-six';
import { actOutDetails, actOutPrompt, canActOut } from './act-out.js?v=2.7.0-science';
import { shuffle } from './answer-order.js';
import { LITTLE_STORIES } from './activities.js';
import { readingWords } from './reading.js?v=2.7.0-science';

const fields = ['position', 'color', 'count', 'action', 'anchor', 'food', 'prop', 'size', 'object'];
const clips = { position: 'place', anchor: 'place', color: 'color', count: 'count', action: 'action' };
const stories = readingWords(LITTLE_STORIES.route.level);
const families = new Map();
for (const word of stories) {
  if (!families.has(word.family)) families.set(word.family, []);
  families.get(word.family).push(word);
}

export function storyClue(word, field) {
  const scene = word?.scene;
  if (word?.level !== 10 || !fields.includes(field) || scene?.[field] === undefined) return null;
  const length = word.he.split(' ').length;
  if (scene.kind === 'nature' && scene.action === 'crawl') {
    const [start, end] = { anchor: [0, 2], action: [2, 3], object: [3, 4] }[field];
    return { start, end, clip: `story-clue-${clips[field] || 'detail'}` };
  }
  // Level 10 has fixed sentence forms. Use word positions so the same clue
  // works for both the pointed and unpointed versions of the sentence.
  let start, end;
  switch (field) {
    case 'position': start = length - 2; end = length; break;
    case 'anchor': start = scene.kind === 'action' ? length - 1 : length - 2; end = length; break;
    case 'count': start = 0; break;
    case 'color': start = scene.kind === 'count' ? 2 : 1; break;
    case 'action': start = word.actionIndex ?? (scene.size ? 2 : 1); break;
    case 'food': start = 2; end = length; break;
    case 'prop': [start, end] = word.propRange; break;
    case 'size': start = 1; break;
    case 'object': start = scene.action === 'water' ? length - 1 : scene.count ? 1 : 0; break;
  }
  return { start, end: end ?? start + 1, clip: `story-clue-${clips[field] || 'detail'}` };
}

const differences = (word, other) => fields.filter(field => word.scene[field] !== other.scene[field]);

export function pictureClue(word, wrong) {
  return wrong?.scene && differences(word, wrong).find(field => storyClue(word, field));
}

export function firstStoryClue(question) {
  if (question.actOut) return actOutDetails(question.word)[0];
  return question.options
    .filter(word => word !== question.word && word.id !== question.answer)
    .map(word => pictureClue(question.word, word))
    .find(Boolean);
}

function reviewChoices(word, field, count, acting, rng) {
  const family = families.get(word.family);
  if (acting) {
    if (!canActOut(word) || !actOutDetails(word).includes(field)) return null;
  } else if (word.playOnly) return null;
  const alternatives = shuffle(family.filter(other => other !== word && (acting || !other.playOnly)), rng);
  if (!acting) {
    const clueChoice = alternatives.find(other => pictureClue(word, other) === field);
    if (!clueChoice) return null;
    alternatives.splice(alternatives.indexOf(clueChoice), 1);
    alternatives.unshift(clueChoice);
  }
  if (alternatives.length < count - 1) return null;
  return shuffle([word, ...alternatives.slice(0, count - 1)], rng);
}

export function storyReviewQuestion(questions, index, field, rng = Math.random) {
  if (questions.length !== SESSION_LENGTH || index >= questions.length - 1) return null;
  const source = questions[index].word;
  if (!storyClue(source, field)) return null;
  const unshown = questions
    .map((question, slot) => ({ question, slot }))
    .filter(({ slot }) => slot > index)
    .reverse()
    .sort((a, b) => Number(Boolean(a.question.actOut)) - Number(Boolean(b.question.actOut)));
  const acts = questions.filter(question => question.actOut).length;
  const slots = unshown.map(slot => ({ ...slot, actOut: Boolean(slot.question.actOut) }));
  // A missing detail can need a different interaction. Keep one or two
  // acted scenes in the round when switching a future question's format.
  slots.push(...unshown.filter(({ question }) => question.actOut ? acts > 1 : acts < 2)
    .map(slot => ({ ...slot, actOut: !slot.question.actOut })));
  const existing = new Set(questions.map(q => q.word.id));
  const shownChoices = new Set(questions.slice(0, index + 1).flatMap(q => q.options.map(word => word.id)));
  const candidates = shuffle(stories.filter(word => !existing.has(word.id) && !shownChoices.has(word.id)
    && storyClue(word, field)), rng);

  // Try the same detail in a new setting first. Some action and object clues
  // have very few exact examples, so a different example of that skill works too.
  for (const sameDetail of [true, false]) for (const { question, slot, actOut } of slots) {
    const matching = candidates.filter(word => (word.scene[field] === source.scene[field]) === sameDetail);
    const length = question.word.he.split(' ').length;
    matching.sort((a, b) => Math.abs(a.he.split(' ').length - length) - Math.abs(b.he.split(' ').length - length)
      || Number(a.family === source.family) - Number(b.family === source.family));
    for (const word of matching) {
      const options = reviewChoices(word, field, question.options.length, actOut, rng);
      if (options) return { slot, question: { ...question, word, options, answer: word.id, actOut,
        prompt: actOut ? actOutPrompt(word) : 'reading-phrase' } };
    }
  }
  return null;
}
