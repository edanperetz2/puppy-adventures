import { SESSION_LENGTH, MAX_ASSISTED_TO_ADVANCE, adventurePhase, choiceCount } from './adventure.js';

// Portrait windows into the unmodified, credited character artwork. These are
// display crops, not newly drawn versions of the familiar characters.
export const CHARACTER_ART = Object.freeze({ src: './assets/crew-family.webp', width: 2500, height: 1167 });
export const CHARACTERS = Object.freeze([
  { id: 'rubble', he: 'ראבל', pointed: 'רַאבֶּל', tier: 1, portrait: [665, 315, 355, 420] },
  { id: 'mix', he: 'מיקס', pointed: 'מִיקְס', tier: 1, portrait: [195, 490, 380, 420] },
  { id: 'charger', he: 'צ׳ארג׳ר', pointed: 'צַ׳ארְגֶ׳ר', tier: 1, portrait: [1240, 245, 425, 475] },
  { id: 'wheeler', he: 'ווילר', pointed: 'ווִילֶר', tier: 2, portrait: [1605, 360, 365, 430] },
  { id: 'motor', he: 'מוטור', pointed: 'מוֹטוֹר', tier: 2, portrait: [965, 140, 290, 325] },
  { id: 'auntie', he: 'דודה קריין', pointed: 'דּוֹדָה קְרֵיין', tier: 3, portrait: [85, 115, 490, 415] },
  { id: 'grandpa', he: 'סבא גראבל', pointed: 'סַבָּא גְרַאבֶּל', tier: 3, portrait: [1960, 140, 455, 535] },
].map(character => Object.freeze({ ...character, portrait: Object.freeze(character.portrait), clip: `character-${character.id}` })));

export const CHARACTER_LEVELS = Object.freeze({
  friends: Object.freeze({ number: 1, tier: 1, name: 'שלושה חברים', description: 'ראבל, מיקס וצ׳ארג׳ר', clip: 'characters-level-friends' }),
  crew: Object.freeze({ number: 2, tier: 2, name: 'כל הגורים', description: 'גם ווילר ומוטור מצטרפים', clip: 'characters-level-crew' }),
  family: Object.freeze({ number: 3, tier: 3, name: 'כל המשפחה', description: 'גם דודה קריין וסבא גראבל', clip: 'characters-level-family' }),
});
export const CHARACTER_MODES = Object.freeze({
  mixed: 'גם תמונה וגם שם',
  'picture-name': 'מתמונה לשם',
  'name-picture': 'משם לתמונה',
});
export const CHARACTER_DIRECTIONS = Object.freeze(['picture-name', 'name-picture']);

export function characterPool(level = 'friends') {
  const tier = Object.hasOwn(CHARACTER_LEVELS, level) ? CHARACTER_LEVELS[level].tier : 1;
  return CHARACTERS.filter(character => character.tier <= tier);
}

export function characterPortrait(character, label = character.he, className = '') {
  return `<svg class="character-portrait ${className}" viewBox="${character.portrait.join(' ')}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" focusable="false"><image href="${CHARACTER_ART.src}" x="0" y="0" width="${CHARACTER_ART.width}" height="${CHARACTER_ART.height}"/></svg>`;
}

const safeCount = n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000 ? n : 0;
export function sanitizeCharacterPractice(input) {
  return {
    completed: Object.fromEntries(Object.keys(CHARACTER_LEVELS).map(key => [key, safeCount(input?.completed?.[key])])),
    seen: Object.fromEntries(CHARACTER_DIRECTIONS.map(direction => [direction, Object.fromEntries(CHARACTERS.map(c => [c.id, safeCount(input?.seen?.[direction]?.[c.id])]))])),
  };
}

export function finishCharacterPractice(input, level, questions) {
  const result = sanitizeCharacterPractice(input);
  if (!Object.hasOwn(CHARACTER_LEVELS, level) || !Array.isArray(questions) || questions.length !== SESSION_LENGTH) return result;
  if (!questions.every(q => q.type === 'character' && CHARACTER_DIRECTIONS.includes(q.direction) && characterPool(level).some(c => c.id === q.character?.id))) return result;
  result.completed[level] = Math.min(1000000, result.completed[level] + 1);
  for (const q of questions) result.seen[q.direction][q.character.id] = Math.min(1000000, result.seen[q.direction][q.character.id] + 1);
  return result;
}

export function nextCharacterLevel(key, assisted) {
  if (!Object.hasOwn(CHARACTER_LEVELS, key) || !Number.isInteger(assisted) || assisted < 0 || assisted > MAX_ASSISTED_TO_ADVANCE) return null;
  return Object.keys(CHARACTER_LEVELS).find(next => CHARACTER_LEVELS[next].number === CHARACTER_LEVELS[key].number + 1) || null;
}

function shuffle(items, rng) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}

function similarity(a, b) {
  const left = [...a.he].filter(c => /[א-ת]/u.test(c)), right = [...b.he].filter(c => /[א-ת]/u.test(c));
  return (left[0] === right[0] ? 5 : 0) + left.filter(c => right.includes(c)).length - Math.abs(left.length - right.length) / 10;
}

export function createCharacterSession(settings = {}, rng = Math.random) {
  const level = Object.hasOwn(CHARACTER_LEVELS, settings.characterLevel) ? settings.characterLevel : 'friends';
  const mode = Object.hasOwn(CHARACTER_MODES, settings.characterMode) ? settings.characterMode : 'mixed';
  const practice = sanitizeCharacterPractice(settings.characterPractice), pool = characterPool(level);
  const recent = Object.fromEntries(CHARACTER_DIRECTIONS.map(direction => [direction, { ...practice.seen[direction] }]));
  const total = Object.fromEntries(CHARACTERS.map(c => [c.id, 0]));
  const levelTier = CHARACTER_LEVELS[level].tier;
  let last = null;
  return Array.from({ length: SESSION_LENGTH }, (_, index) => {
    // Introduce the three known friends, add the younger pups, then the adults.
    // A selected lower level stays within its own familiar cast throughout.
    const tier = Math.min(levelTier, index < 3 ? 1 : index < 7 ? 2 : 3);
    const direction = mode === 'mixed' ? CHARACTER_DIRECTIONS[index % 2] : mode;
    const candidates = pool.filter(c => c.tier === tier && c.id !== last);
    const available = candidates.length ? candidates : pool.filter(c => c.tier === tier);
    const ordered = shuffle(available, rng).sort((a, b) => total[a.id] - total[b.id] || recent[direction][a.id] - recent[direction][b.id]);
    const character = ordered[0];
    total[character.id]++; recent[direction][character.id]++; last = character.id;
    const alternatives = shuffle(pool.filter(c => c.id !== character.id && c.tier <= tier), rng);
    if (index >= 7) alternatives.sort((a, b) => similarity(character, b) - similarity(character, a));
    const options = shuffle([character, ...alternatives.slice(0, choiceCount(index) - 1)], rng);
    return { id: `characters-${index}`, type: 'character', direction, character, answer: character.id, options, phase: adventurePhase(index), tier,
      prompt: `characters-${direction}`, hint: 'characters-hint' };
  });
}
