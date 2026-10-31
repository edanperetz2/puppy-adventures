import { ADVANCED_WORDS } from './reading-advanced.js';
import { VOCABULARY_WORDS } from './vocabulary.js';

// Reading stages are independent choices, never locked behind a score.
export const READING_LEVELS = Object.freeze({
  short: { number: 1, name: 'ניצנים', description: 'מילים קצרות ומוכרות', range: '\u20662–3\u2069 אותיות', level: 1, samples: ['fish', 'tree', 'horse'], art: 'flower', color: 'peach', clip: 'reading-short' },
  familiar: { number: 2, name: 'קוראות בביטחון', description: 'עוד מילים מהעולם שלנו', range: '\u20663–4\u2069 אותיות', level: 2, samples: ['house', 'cat', 'butterfly'], art: 'butterfly', color: 'blue', clip: 'reading-familiar' },
  long: { number: 3, name: 'מגלות מילים ארוכות', description: 'פירות, חיות ודברים חדשים', range: '\u20664–5\u2069 אותיות', level: 3, samples: ['watermelon', 'helicopter', 'table'], art: 'helicopter', color: 'yellow', clip: 'reading-long' },
  challenge: { number: 4, name: 'אתגר המילים', description: 'מוכנה למילים ממש ארוכות?', range: '\u20665–8\u2069 אותיות', level: 4, samples: ['dinosaur', 'bulldozer', 'glasses'], art: 'dinosaur', color: 'lavender', clip: 'reading-challenge' },
  explorers: { number: 5, name: 'מילים של חוקרות', description: 'רכבי הצלה, חיות וגן משחקים', range: 'אוצר מילים חדש', level: 5, samples: ['firetruck', 'hedgehog'], art: 'firetruck', color: 'peach', clip: 'reading-explorers', fresh: true },
  colors: { number: 6, name: 'קוראות גם את הצבע', description: 'אותו דבר, צבע אחר', range: 'שם וצבע', level: 6, samples: ['color-ball-red', 'color-car-blue'], art: 'color-ball-red', color: 'blue', clip: 'reading-colors', fresh: true },
  quantities: { number: 7, name: 'כמה כתוב כאן?', description: 'קוראות מספרים במילים', range: 'כמות ושם', level: 7, samples: ['count-butterfly-2', 'count-flower-3'], art: 'count-butterfly-2', color: 'yellow', clip: 'reading-quantities', fresh: true },
  positions: { number: 8, name: 'איפה החברים?', description: 'מעל, מתחת, בתוך וליד', range: 'קוראות מיקום', level: 8, samples: ['place-ball-under', 'place-cat-in'], art: 'place-cat-in', color: 'lavender', clip: 'reading-positions', fresh: true },
  actions: { number: 9, name: 'מה הם עושים?', description: 'ישנים, רצים, קופצים ועפים', range: 'שם ופעולה', level: 9, samples: ['action-dog-jump', 'action-bird-fly'], art: 'action-dog-jump', color: 'peach', clip: 'reading-actions', fresh: true },
  sentences: { number: 10, name: 'סיפורים קטנים', description: 'מגלות כמה פרטים במשפט', range: 'משפטים קצרים', level: 10, samples: ['facts-car-red-house', 'facts-butterflies-two-blue'], art: 'facts-car-red-house', color: 'blue', clip: 'reading-sentences', fresh: true },
  all: { name: 'מכל הגינה', description: 'מערבבות מילים מכל השלבים', range: 'כל המילים', level: null, clip: 'reading-all' },
});

export const WORDS = [
  { id: 'fish', he: 'דג', pointed: 'דָּג', level: 1 },
  { id: 'sea', he: 'ים', pointed: 'יָם', level: 1 },
  { id: 'tree', he: 'עץ', pointed: 'עֵץ', level: 1 },
  { id: 'bear', he: 'דוב', pointed: 'דֹּב', level: 1 },
  { id: 'horse', he: 'סוס', pointed: 'סוּס', level: 1 },
  { id: 'ball', he: 'כדור', pointed: 'כַּדּוּר', level: 2 },
  { id: 'house', he: 'בית', pointed: 'בַּיִת', level: 2 },
  { id: 'sun', he: 'שמש', pointed: 'שֶׁמֶשׁ', level: 2 },
  { id: 'dog', he: 'כלב', pointed: 'כֶּלֶב', level: 2 },
  { id: 'cat', he: 'חתול', pointed: 'חָתוּל', level: 2 },
  { id: 'flower', he: 'פרח', pointed: 'פֶּרַח', level: 2 },
  { id: 'butterfly', he: 'פרפר', pointed: 'פַּרְפַּר', level: 2 },
  { id: 'rabbit', he: 'ארנב', pointed: 'אַרְנָב', level: 3 },
  { id: 'duck', he: 'ברווז', pointed: 'בַּרְוָז', level: 3 },
  { id: 'apple', he: 'תפוח', pointed: 'תַּפּוּחַ', level: 3 },
  { id: 'grapes', he: 'ענבים', pointed: 'עֲנָבִים', level: 3 },
  { id: 'watermelon', he: 'אבטיח', pointed: 'אַבְטִיחַ', level: 3 },
  { id: 'pineapple', he: 'אננס', pointed: 'אֲנָנָס', level: 3 },
  { id: 'airplane', he: 'מטוס', pointed: 'מָטוֹס', level: 3 },
  { id: 'helicopter', he: 'מסוק', pointed: 'מַסּוֹק', level: 3 },
  { id: 'window', he: 'חלון', pointed: 'חַלּוֹן', level: 3 },
  { id: 'table', he: 'שולחן', pointed: 'שֻׁלְחָן', level: 3 },
  { id: 'snail', he: 'שבלול', pointed: 'שַׁבְּלוּל', level: 3 },
  { id: 'guitar', he: 'גיטרה', pointed: 'גִּיטָרָה', level: 3 },
  { id: 'car', he: 'מכונית', pointed: 'מְכוֹנִית', level: 4 },
  { id: 'bicycle', he: 'אופניים', pointed: 'אוֹפַנַּיִם', level: 4 },
  { id: 'glasses', he: 'משקפיים', pointed: 'מִשְׁקָפַיִם', level: 4 },
  { id: 'scissors', he: 'מספריים', pointed: 'מִסְפָּרַיִם', level: 4 },
  { id: 'umbrella', he: 'מטרייה', pointed: 'מִטְרִיָּה', level: 4 },
  { id: 'telescope', he: 'טלסקופ', pointed: 'טֵלֶסְקוֹפּ', level: 4 },
  { id: 'tractor', he: 'טרקטור', pointed: 'טְרַקְטוֹר', level: 4 },
  { id: 'bulldozer', he: 'בולדוזר', pointed: 'בּוּלְדּוֹזֶר', level: 4 },
  { id: 'dinosaur', he: 'דינוזאור', pointed: 'דִּינוֹזָאוּר', level: 4 },
  { id: 'chocolate', he: 'שוקולד', pointed: 'שׁוֹקוֹלָד', level: 4 },
  { id: 'trumpet', he: 'חצוצרה', pointed: 'חֲצוֹצְרָה', level: 4 },
  { id: 'cucumber', he: 'מלפפון', pointed: 'מְלָפְפוֹן', level: 4 },
  ...VOCABULARY_WORDS,
  ...ADVANCED_WORDS,
];

export function readingWords(key = 'short') {
  const stage = Object.hasOwn(READING_LEVELS, key) ? READING_LEVELS[key] : READING_LEVELS.short;
  return WORDS.filter(word => stage.level === null || word.level === stage.level);
}

export function nextReadingStage(key, assisted) {
  const stage = Object.hasOwn(READING_LEVELS, key) ? READING_LEVELS[key] : null;
  if (!stage?.number || !Number.isInteger(assisted) || assisted < 0 || assisted > 1) return null;
  return Object.keys(READING_LEVELS).find(next => READING_LEVELS[next].number === stage.number + 1) || null;
}

export function readingTargets(pool, recent, count, rng = Math.random) {
  if (!pool.length || count <= 0) return [];
  const ids = new Set(pool.map(word => word.id));
  const order = [...new Set((Array.isArray(recent) ? recent : []).filter(id => ids.has(id)))];
  const newWords = pool.filter(word => !order.includes(word.id));
  for (let i = newWords.length - 1; i > 0; i--) { const n = Math.floor(rng() * (i + 1)); [newWords[i], newWords[n]] = [newWords[n], newWords[i]]; }
  const queue = [...newWords, ...order.map(id => pool.find(word => word.id === id))].slice(0, count);
  for (let i = queue.length - 1; i > 0; i--) { const n = Math.floor(rng() * (i + 1)); [queue[i], queue[n]] = [queue[n], queue[i]]; }
  return Array.from({ length: count }, (_, i) => queue[i % queue.length]);
}

export function sanitizeReadingPractice(input) {
  const recent = {};
  for (const key of Object.keys(READING_LEVELS)) {
    const ids = new Set(readingWords(key).map(word => word.id));
    const saved = input && typeof input === 'object' && Array.isArray(input.recent?.[key]) ? input.recent[key] : [];
    recent[key] = [...new Set(saved.filter(id => ids.has(id)))].slice(-ids.size);
  }
  return { recent };
}

export function finishReadingPractice(input, key, words) {
  const result = sanitizeReadingPractice(input);
  if (!Object.hasOwn(READING_LEVELS, key)) return result;
  const allowed = new Set(readingWords(key).map(word => word.id));
  const played = [...new Set(words.map(word => word.id).filter(id => allowed.has(id)))];
  result.recent[key] = [...result.recent[key].filter(id => !played.includes(id)), ...played];
  return result;
}
