import { SESSION_LENGTH, isSessionLength, MAX_ASSISTED_TO_ADVANCE, adventurePhase, choiceCount } from './adventure.js?v=2.2.2-six';
import { shuffle } from './answer-order.js';

// Portrait windows into the unmodified, credited character artwork. These are
// display crops, not newly drawn versions of the familiar characters.
export const CHARACTER_ART = Object.freeze({ src: './assets/crew-family.webp', width: 2500, height: 1167 });
const fullPortrait = (src, width, height) => Object.freeze({ src, width, height, portrait: Object.freeze([0, 0, width, height]) });
const pawArt = id => fullPortrait(`./assets/paw-${id}.jpg`, 830, 830);
export const CHARACTERS = Object.freeze([
  { id: 'rubble', he: 'ראבל', pointed: 'רַאבֶּל', tiers: { crew: 1, paw: 2, together: 1 }, portrait: [665, 315, 355, 420], pawArt: pawArt('rubble') },
  { id: 'mix', he: 'מיקס', pointed: 'מִיקְס', tiers: { crew: 1, together: 2 }, portrait: [1605, 360, 365, 430] },
  { id: 'charger', he: 'צ׳ארג׳ר', pointed: 'צַ׳ארְגֶ׳ר', tiers: { crew: 1, together: 2 }, portrait: [1240, 245, 425, 475] },
  { id: 'wheeler', he: 'ווילר', pointed: 'ווִילֶר', tiers: { crew: 2, together: 2 }, portrait: [195, 490, 380, 420] },
  { id: 'motor', he: 'מוטור', pointed: 'מוֹטוֹר', tiers: { crew: 2, together: 2 }, portrait: [965, 140, 290, 325] },
  { id: 'auntie', he: 'דודה קריין', pointed: 'דּוֹדָה קְרֵיין', tiers: { crew: 3, together: 3 }, portrait: [85, 115, 490, 415] },
  { id: 'grandpa', he: 'סבא גראבל', pointed: 'סַבָּא גְרַאבֶּל', tiers: { crew: 3, together: 3 }, portrait: [1960, 140, 455, 535] },
  { id: 'chase', he: 'צ׳ייס', pointed: 'צֵ׳ייס', tiers: { paw: 1, together: 2 }, pawArt: pawArt('chase') },
  { id: 'marshall', he: 'מרשל', pointed: 'מַרְשַׁל', tiers: { paw: 1, together: 2 }, pawArt: pawArt('marshall') },
  { id: 'skye', he: 'סקיי', pointed: 'סְקַיי', tiers: { paw: 1, together: 2 }, pawArt: pawArt('skye') },
  { id: 'rocky', he: 'רוקי', pointed: 'רוֹקִי', tiers: { paw: 2, together: 2 }, pawArt: pawArt('rocky') },
  { id: 'zuma', he: 'זומה', pointed: 'זוּמָה', tiers: { paw: 2, together: 2 }, pawArt: pawArt('zuma') },
  { id: 'everest', he: 'אוורסט', pointed: 'אֶוֶורֶסְט', tiers: { paw: 3, together: 3 }, pawArt: pawArt('everest') },
  { id: 'liberty', he: 'ליברטי', pointed: 'לִיבֶּרְטִי', tiers: { paw: 3, together: 3 }, pawArt: pawArt('liberty') },
  { id: 'ryder', he: 'ריידר', pointed: 'רַייְדֶר', tiers: { paw: 3, together: 3 }, pawArt: pawArt('ryder') },
  { id: 'pikachu', he: 'פיקאצ׳ו', pointed: 'פִּיקָאצ׳וּ', tiers: { together: 1 }, homeArt: fullPortrait('./assets/home-pikachu.png', 215, 215) },
  { id: 'stitch', he: 'סטיץ׳', pointed: 'סְטִיץ׳', tiers: { together: 1 }, homeArt: fullPortrait('./assets/home-stitch.webp', 384, 381) },
].map(character => Object.freeze({ ...character, tiers: Object.freeze(character.tiers), ...(character.portrait ? { portrait: Object.freeze(character.portrait) } : {}), clip: `character-${character.id}` })));

export const CHARACTER_COLLECTIONS = Object.freeze({
  crew: Object.freeze({ name: 'ראבל והבנאים', first: 'friends', menuClip: 'characters-menu', faces: ['rubble', 'mix', 'charger'] }),
  paw: Object.freeze({ name: 'מפרץ ההרפתקאות', first: 'paw-friends', menuClip: 'characters-menu-paw', faces: ['chase', 'marshall', 'skye'] }),
  together: Object.freeze({ name: 'כולם יחד', first: 'together-friends', menuClip: 'characters-menu-together', faces: ['pikachu', 'stitch', 'rubble'] }),
});

export const CHARACTER_LEVELS = Object.freeze({
  friends: Object.freeze({ collection: 'crew', number: 1, tier: 1, name: 'שלושה חברים', description: 'ראבל, מיקס וצ׳ארג׳ר', clip: 'characters-level-friends' }),
  crew: Object.freeze({ collection: 'crew', number: 2, tier: 2, name: 'כל הגורים', description: 'גם ווילר ומוטור מצטרפים', clip: 'characters-level-crew' }),
  family: Object.freeze({ collection: 'crew', number: 3, tier: 3, name: 'כל המשפחה', description: 'גם דודה קריין וסבא גראבל', clip: 'characters-level-family' }),
  'paw-friends': Object.freeze({ collection: 'paw', number: 1, tier: 1, name: 'יוצאות לחילוץ', description: 'צ׳ייס, מרשל וסקיי', clip: 'characters-level-paw-friends' }),
  'paw-team': Object.freeze({ collection: 'paw', number: 2, tier: 2, name: 'ששת הגורים', description: 'גם ראבל, רוקי וזומה מצטרפים', clip: 'characters-level-paw-team' }),
  'paw-all': Object.freeze({ collection: 'paw', number: 3, tier: 3, name: 'כל החבורה', description: 'גם אוורסט, ליברטי וריידר', clip: 'characters-level-paw-all' }),
  'together-friends': Object.freeze({ collection: 'together', number: 1, tier: 1, name: 'שלושה כוכבים', description: 'פיקאצ׳ו, סטיץ׳ וראבל', clip: 'characters-level-together-friends' }),
  'together-pups': Object.freeze({ collection: 'together', number: 2, tier: 2, name: 'גם הגורים כאן', description: 'מצטרפים גורים משתי החבורות', clip: 'characters-level-together-pups' }),
  'together-all': Object.freeze({ collection: 'together', number: 3, tier: 3, name: 'כולם בתמונה', description: 'כל שבע עשרה הדמויות', clip: 'characters-level-together-all' }),
});
export const CHARACTER_MODES = Object.freeze({
  mixed: 'גם תמונה וגם שם',
  'picture-name': 'מתמונה לשם',
  'name-picture': 'משם לתמונה',
});
export const CHARACTER_DIRECTIONS = Object.freeze(['picture-name', 'name-picture']);

export function characterCollection(level) { return Object.hasOwn(CHARACTER_LEVELS, level) ? CHARACTER_LEVELS[level].collection : 'crew'; }
export function characterTier(character, collection) { return character.tiers[collection] || Infinity; }
export function sanitizeCharacterSelection(input) {
  const characterLevel = Object.hasOwn(CHARACTER_LEVELS, input?.characterLevel) ? input.characterLevel : 'friends';
  const characterCollectionLevels = Object.fromEntries(Object.entries(CHARACTER_COLLECTIONS).map(([key, collection]) => {
    const saved = input?.characterCollectionLevels?.[key];
    return [key, Object.hasOwn(CHARACTER_LEVELS, saved) && characterCollection(saved) === key ? saved : collection.first];
  }));
  characterCollectionLevels[characterCollection(characterLevel)] = characterLevel;
  return { characterLevel, characterCollectionLevels };
}
export function selectCharacterLevel(settings, level) {
  return sanitizeCharacterSelection({ ...settings, characterLevel: level });
}
export function characterPool(level = 'friends') {
  const stage = CHARACTER_LEVELS[Object.hasOwn(CHARACTER_LEVELS, level) ? level : 'friends'];
  return CHARACTERS.filter(character => characterTier(character, stage.collection) <= stage.tier);
}

export function characterArtwork(character, collection = 'crew') {
  if (character.homeArt) return character.homeArt;
  return collection === 'paw' || !character.portrait ? character.pawArt : { ...CHARACTER_ART, portrait: character.portrait };
}
export function characterPortrait(character, label = character.he, className = '', collection = 'crew') {
  const art = characterArtwork(character, collection);
  return `<svg class="character-portrait ${className}" viewBox="${art.portrait.join(' ')}" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${label}" focusable="false"><image href="${art.src}" x="0" y="0" width="${art.width}" height="${art.height}"/></svg>`;
}

const safeCount = n => Number.isSafeInteger(n) && n >= 0 && n <= 1000000 ? n : 0;
export function sanitizeCharacterPractice(input) {
  return {
    lastTarget: CHARACTERS.some(character => character.id === input?.lastTarget) ? input.lastTarget : null,
    completed: Object.fromEntries(Object.keys(CHARACTER_LEVELS).map(key => [key, safeCount(input?.completed?.[key])])),
    seen: Object.fromEntries(CHARACTER_DIRECTIONS.map(direction => [direction, Object.fromEntries(CHARACTERS.map(c => [c.id, safeCount(input?.seen?.[direction]?.[c.id])]))])),
  };
}

export function finishCharacterPractice(input, level, questions) {
  const result = sanitizeCharacterPractice(input);
  if (!Object.hasOwn(CHARACTER_LEVELS, level) || !Array.isArray(questions) || !isSessionLength(questions.length)) return result;
  if (!questions.every(q => q.type === 'character' && CHARACTER_DIRECTIONS.includes(q.direction) && characterPool(level).some(c => c.id === q.character?.id))) return result;
  result.completed[level] = Math.min(1000000, result.completed[level] + 1);
  result.lastTarget = questions.at(-1).character.id;
  for (const q of questions) result.seen[q.direction][q.character.id] = Math.min(1000000, result.seen[q.direction][q.character.id] + 1);
  return result;
}

export function nextCharacterLevel(key, assisted) {
  if (!Object.hasOwn(CHARACTER_LEVELS, key) || !Number.isInteger(assisted) || assisted < 0 || assisted > MAX_ASSISTED_TO_ADVANCE) return null;
  return Object.keys(CHARACTER_LEVELS).find(next => characterCollection(next) === characterCollection(key) && CHARACTER_LEVELS[next].number === CHARACTER_LEVELS[key].number + 1) || null;
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
  const collection = characterCollection(level), tierOf = character => characterTier(character, collection);
  let last = practice.lastTarget;
  return Array.from({ length: SESSION_LENGTH }, (_, index) => {
    const phase = adventurePhase(index);
    const tier = Math.min(levelTier, phase === 'warmup' ? 1 : phase === 'practice' ? 2 : 3);
    const direction = mode === 'mixed' ? CHARACTER_DIRECTIONS[(practice.completed[level] + index) % 2] : mode;
    const candidates = pool.filter(c => tierOf(c) === tier && c.id !== last);
    const available = candidates.length ? candidates : pool.filter(c => tierOf(c) === tier);
    const ordered = shuffle(available, rng).sort((a, b) => total[a.id] - total[b.id] || recent[direction][a.id] - recent[direction][b.id]);
    const character = ordered[0];
    total[character.id]++; recent[direction][character.id]++; last = character.id;
    const alternatives = shuffle(pool.filter(c => c.id !== character.id && tierOf(c) <= tier), rng);
    if (phase === 'challenge') {
      alternatives.sort((a, b) => similarity(character, b) - similarity(character, a));
      // Cycle the full set of distractor pairs. A hard round used to always
      // pick the same two similar names, even after many completed visits.
      const pairs=alternatives.flatMap((a,i)=>alternatives.slice(i+1).map(b=>[a,b]));
      const offset=(practice.completed[level]+recent[direction][character.id]+Math.floor(rng()*pairs.length))%pairs.length;
      alternatives.splice(0,alternatives.length,...pairs[offset]);
    }
    const options = shuffle([character, ...alternatives.slice(0, choiceCount(index) - 1)], rng);
    return { id: `characters-${index}`, type: 'character', collection, direction, character, answer: character.id, options, phase, tier,
      prompt: `characters-${direction}`, hint: 'characters-hint' };
  });
}
