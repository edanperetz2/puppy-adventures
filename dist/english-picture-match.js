import { choosePractice } from './learning.js';
import { shuffle, answerShuffler } from './answer-order.js';
import { distinctWordPictures } from './vocabulary.js';
import {
  EXTRA_PICTURE_NOUNS, nounLabel, extraNounClip, PAINTED_NOUNS, MATCH_COLORS,
  colorClip, COUNTED_NOUNS, countSentence, countClip, colorSentence, colorSentenceClip, ANIMAL_ACTIONS,
} from './english-picture-content.js';

export const MATCH_LEVELS = {
  'word-pictures': { title: 'מֵאַנְגְּלִית לִתְמוּנָה', description: 'שׁוֹמְעוֹת וְקוֹרְאוֹת בְּאַנְגְּלִית, וּבוֹחֲרוֹת תְּמוּנָה.', icon: 'door' },
  'picture-words': { title: 'מִתְּמוּנָה לְאַנְגְּלִית', description: 'מִסְתַּכְּלוֹת וּבוֹחֲרוֹת מָה מַתְאִים בְּאַנְגְּלִית.', icon: 'ball' },
};
const keyFor = (level, id) => `english:${level}:${id}`;
const starterNouns = new Set(['dog','cat','ball','door','duck','apple','car','bird','star','flower','hat','tree']);
const shapes = new Set(['circle', 'square', 'triangle']);
// A named object can be a visible part of another illustration. Keep those
// pictures apart even when their English labels are different.
const visibleIn = {
  bread: ['burger'], sandwich: ['burger'], melon: ['watermelon'],
  egg: ['nest'], jar: ['honey'], fork: ['spaghetti'], ladder: ['slide'],
  chair: ['couch'], heart: ['necklace'], candle: ['cake'], eraser: ['pencil'],
  plate: ['spaghetti', 'pancake', 'cake', 'butter'], box: ['juice', 'milk', 'popcorn'],
  bowl: ['spaghetti'], wheel: ['bicycle', 'car', 'truck', 'bus', 'taxi', 'firetruck', 'ambulance', 'train', 'motorcycle', 'scooter', 'tractor'],
};
export function distinctMatchPictures(left, right) {
  return shapes.has(left) === shapes.has(right) && !visibleIn[left]?.includes(right) && !visibleIn[right]?.includes(left)
    && distinctWordPictures({ id: left }, { id: right });
}

export function makeEnglishPictureBank(listeningWords, words, colors) {
  const known = new Map(listeningWords.map(word => [word.id, word]));
  const nouns = new Map(words.filter(word => !word.scene).map(word => [word.id, word]));
  const swatches = new Map(colors.map(color => [color.id, color.he]));
  const word = [...known.keys(), ...EXTRA_PICTURE_NOUNS].filter(id => !swatches.has(id)).map(noun => ({
    id: noun, noun, kind: 'word', text: known.get(noun)?.en.toLowerCase() || nounLabel(noun),
    he: nouns.get(noun)?.he || known.get(noun).he,
    clip: known.has(noun) ? known.get(noun).clip || `en-${noun}` : extraNounClip(noun),
  }));
  const phrase = PAINTED_NOUNS.flatMap(noun => MATCH_COLORS.map(color => ({
    id: `${color}-${noun}`, noun, color, kind: 'phrase', text: `${color} ${noun}`,
    he: `${nouns.get(noun).he}, צבע ${swatches.get(color)}`, clip: colorClip(color, noun),
  })));
  const counted = Object.keys(COUNTED_NOUNS).flatMap(noun => [1, 2, 3].map(count => ({
    id: `see-${count}-${noun}`, noun, count, kind: 'sentence', family: 'count', text: countSentence(count, noun),
    he: `${nouns.get(noun).he}, כמות ${count}`, clip: countClip(count, noun),
  })));
  const colored = phrase.map(entry => ({
    ...entry, id: 'is-' + entry.id, kind: 'sentence', family: 'color',
    text: colorSentence(entry.color, entry.noun), clip: colorSentenceClip(entry.color, entry.noun),
  }));
  const actionScenes = new Map(words.filter(word => word.scene?.kind === 'action').map(word => [word.id, word.he]));
  const actions = ANIMAL_ACTIONS.map(entry => ({
    ...entry, kind: 'sentence', family: 'action', he: actionScenes.get(entry.scene),
  }));
  const sentence = [...counted, ...colored, ...actions];
  const byId = new Map([...word, ...phrase, ...sentence].map(entry => [entry.id, entry]));
  return { word, phrase, sentence, byId };
}

export function chooseEnglishPictureTargets(bank, level, items, rng) {
  const prefix = keyFor(level, '');
  const independent = Object.entries(items).filter(([key, value]) => key.startsWith(prefix) && value.independent > 0).length;
  const stages = independent < 4 ? ['word','word','word','phrase','phrase','sentence'] : ['word','word','phrase','phrase','sentence','sentence'];
  // Give each sentence pattern its own turn. Choosing from one flat list
  // would show the many color combinations much more often than the actions.
  const familyVisits = { count: 0, color: 0, action: 0 };
  for (const entry of bank.sentence) familyVisits[entry.family] += items[keyFor(level, entry.id)]?.seen || 0;
  const usedFamilies = new Set();
  const chosenNouns = new Set();
  return stages.map((kind, index) => {
    let pool = bank[kind].filter(entry => !chosenNouns.has(entry.noun));
    if (index === 0 || (independent < 4 && index === 1)) {
      pool = pool.filter(entry => starterNouns.has(entry.noun) || items[`english:single:${entry.noun}`]?.independent);
    }
    if (independent < 4 && kind === 'phrase') pool = pool.filter(entry => starterNouns.has(entry.noun));
    if (kind === 'sentence') {
      const [family] = shuffle(Object.keys(familyVisits).filter(id => !usedFamilies.has(id)), rng).sort((a, b) => familyVisits[a] - familyVisits[b]);
      usedFamilies.add(family);
      pool = pool.filter(entry => entry.family === family);
      if (independent < 4) pool = pool.filter(entry => (!entry.count || entry.count <= 2) && starterNouns.has(entry.noun));
    }
    const [pick] = choosePractice(pool, items, entry => keyFor(level, entry.id), 1, Date.now(), rng);
    chosenNouns.add(pick.noun);
    return pick.id;
  });
}

export function englishPictureChoices(bank, targets, rng) {
  const order = answerShuffler(rng);
  return targets.map((id, index) => {
    const target = bank.byId.get(id);
    const alternatives = bank[target.kind].filter(other => other.id !== id && other.family === target.family);
    let wrong;
    if (target.kind === 'word') {
      const pool = shuffle(alternatives.filter(other => distinctMatchPictures(target.noun, other.noun)), rng);
      wrong = [pool[0], pool.find(other => other !== pool[0] && distinctMatchPictures(other.noun, pool[0].noun))];
    } else {
      wrong = [
        shuffle(alternatives.filter(other => other.noun === target.noun), rng)[0],
        shuffle(alternatives.filter(other => other.noun !== target.noun && other.color === target.color && other.count === target.count && other.action === target.action &&
          distinctWordPictures({ id: target.noun }, { id: other.noun })), rng)[0],
      ];
    }
    return order([target, ...wrong.slice(0, index < 2 ? 1 : 2)], id).map(entry => entry.id);
  });
}

export function validEnglishPictureChoices(bank, targets, choices) {
  return Array.isArray(choices) && choices.length === targets.length && choices.every((row, i) => {
    const target = bank.byId.get(targets[i]);
    return Array.isArray(row) && row.length === (i < 2 ? 2 : 3) && new Set(row).size === row.length &&
      row.includes(target.id) && row.every(id => bank.byId.get(id)?.kind === target.kind && bank.byId.get(id).family === target.family);
  });
}

export function englishPictureQuestions(bank, plan) {
  return plan.pictureTargets.map((id, index) => {
    const target = bank.byId.get(id);
    return {
      kind: 'english-picture', level: plan.level, target, answer: id,
      choices: plan.pictureChoices[index].map(choice => bank.byId.get(choice)),
      key: keyFor(plan.level, id), clip: target.clip,
      prompt: plan.level === 'picture-words' ? 'picture-en-choose-words' : 'picture-en-choose-picture',
    };
  });
}
