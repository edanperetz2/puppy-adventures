// Reading stages are independent choices, never locked behind a score.
export const READING_LEVELS = Object.freeze({
  short: { number: 1, name: 'ניצנים', description: 'מילים קצרות ומוכרות', range: '\u20662–3\u2069 אותיות', level: 1, samples: ['fish', 'tree', 'horse'], art: 'flower', color: 'peach', clip: 'reading-short' },
  familiar: { number: 2, name: 'קוראות בביטחון', description: 'עוד מילים מהעולם שלנו', range: '\u20663–4\u2069 אותיות', level: 2, samples: ['house', 'cat', 'butterfly'], art: 'butterfly', color: 'blue', clip: 'reading-familiar' },
  long: { number: 3, name: 'מגלות מילים ארוכות', description: 'פירות, חיות ודברים חדשים', range: '\u20664–5\u2069 אותיות', level: 3, samples: ['watermelon', 'helicopter', 'table'], art: 'helicopter', color: 'yellow', clip: 'reading-long', fresh: true },
  challenge: { number: 4, name: 'אתגר המילים', description: 'מוכנה למילים ממש ארוכות?', range: '\u20665–8\u2069 אותיות', level: 4, samples: ['dinosaur', 'bulldozer', 'glasses'], art: 'dinosaur', color: 'lavender', clip: 'reading-challenge', fresh: true },
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
];

export function readingWords(key = 'short') {
  const stage = Object.hasOwn(READING_LEVELS, key) ? READING_LEVELS[key] : READING_LEVELS.short;
  return WORDS.filter(word => stage.level === null || word.level === stage.level);
}
