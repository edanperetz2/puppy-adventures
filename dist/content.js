import { clockTime } from './clock.js';

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
];

export const ANIMALS = [
  { id: 'dog', en: 'DOG', he: 'כלב' },
  { id: 'cat', en: 'CAT', he: 'חתול' },
  { id: 'fish', en: 'FISH', he: 'דג' },
  { id: 'bird', en: 'BIRD', he: 'ציפור' },
  { id: 'rabbit', en: 'RABBIT', he: 'ארנב' },
  { id: 'horse', en: 'HORSE', he: 'סוס' },
  { id: 'bear', en: 'BEAR', he: 'דוב' },
  { id: 'duck', en: 'DUCK', he: 'ברווז' },
];

export const COLORS = [
  { id: 'red', en: 'RED', he: 'אדום', hex: '#ed6465' },
  { id: 'blue', en: 'BLUE', he: 'כחול', hex: '#4b9cdb' },
  { id: 'yellow', en: 'YELLOW', he: 'צהוב', hex: '#f5c747' },
  { id: 'green', en: 'GREEN', he: 'ירוק', hex: '#53a978' },
  { id: 'purple', en: 'PURPLE', he: 'סגול', hex: '#9c7bce' },
  { id: 'orange', en: 'ORANGE', he: 'כתום', hex: '#ef984d' },
  { id: 'pink', en: 'PINK', he: 'ורוד', hex: '#e88eb2' },
];

export const NUMBERS = ['ZERO', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN', 'TWENTY'];

export const MISSIONS = {
  hebrew: { id: 'hebrew', name: 'גינת המילים', subtitle: 'קוראות ומגלות', description: 'עוזרות ללולי למצוא את התמונות', pup: 'luli', icon: 'flower', subject: 'עברית', color: 'peach', intro: 'intro-hebrew', sticker: 'flower' },
  english: { id: 'english', name: 'מפרץ האנגלית', subtitle: 'מקשיבות ומגלות', description: 'מגלות עם בובי מילים באנגלית', pup: 'bobi', icon: 'boat', subject: 'ENGLISH', color: 'blue', intro: 'intro-english', sticker: 'boat' },
  math: { id: 'math', name: 'סדנת המספרים', subtitle: 'סופרות ומחברות', description: 'עוזרות לטופי להכין את הפיקניק', pup: 'tofi', icon: 'apple', subject: 'חשבון', color: 'yellow', intro: 'intro-math', sticker: 'star' },
  clock: { id: 'clock', name: 'גן השעונים', subtitle: 'מגלות מה השעה', description: 'לומדות עם בובי לקרוא שעון', pup: 'bobi', icon: 'clock', subject: 'מה השעה?', color: 'lavender', intro: 'clock-read', sticker: 'clock' },
};

export const MISSION_IDS = Object.keys(MISSIONS);

export const STICKERS = ['flower', 'boat', 'star', 'dog', 'butterfly', 'rocket', 'rainbow', 'ball', 'cat', 'sun', 'house', 'heart'];

// Explicit clips are bundled at build time: no speech subscription or runtime API.
export const CLIPS = {
  welcome: { lang: 'he-IL', text: 'ברוכה הבאה לחבורת ההרפתקאות! החברים שלנו מחכים לך. בחרי הרפתקה, ובואי נשחק יחד!' },
  'intro-hebrew': { lang: 'he-IL', text: 'לולי מסדרת את גינת המילים. קראי את המילה, ובחרי את התמונה המתאימה. אם תרצי עזרה, לחצי על הנורה.' },
  'intro-english': { lang: 'he-IL', text: 'בובי יוצא למפרץ האנגלית. הקשיבי למילה באנגלית, ואז בחרי את התמונה המתאימה.' },
  'intro-math': { lang: 'he-IL', text: 'טופי מכין פיקניק לחברים! בואי נספור, ונחבר דברים טעימים.' },
  'intro-clock': { lang: 'he-IL', text: 'ברוכה הבאה לגן השעונים! בובי רוצה לדעת מתי מתחיל הפיקניק. המחוג הקצר והסגול מראה את השעה. המחוג הארוך והירוק מראה את הדקות. לחצי על מספר בשעון, ונגלה מה השעה!' },
  'clock-read': { lang: 'he-IL', text: 'מה השעה בשעון? הסתכלי על המחוגים ובחרי את השעה המתאימה. אפשר ללחוץ על הרמקולים הקטנים כדי לשמוע את האפשרויות.' },
  'clock-hour-hand': { lang: 'he-IL', text: 'זה מחוג השעות. הוא קצר וסגול, ומראה לנו את השעה. לחצי על מספר בשעון, וראי איך הוא זז.' },
  'clock-minute-hand': { lang: 'he-IL', text: 'זה מחוג הדקות. הוא ארוך וירוק. כשהוא מצביע על שתים עשרה, זאת שעה עגולה.' },
  'clock-tip-0': { lang: 'he-IL', text: 'המחוג הארוך והירוק מצביע על שתים עשרה. זאת שעה עגולה! עכשיו מצאי את המספר שאליו מצביע המחוג הקצר והסגול.' },
  'clock-tip-15': { lang: 'he-IL', text: 'כשהמחוג הארוך והירוק מצביע על שלוש, עברה רבע שעה. מסתכלים על השעה שהמחוג הקצר כבר עבר, ומוסיפים: ורבע.' },
  'clock-tip-30': { lang: 'he-IL', text: 'כשהמחוג הארוך והירוק מצביע על שש, עברה חצי שעה. המחוג הקצר נמצא באמצע בין שתי שעות. מתחילים מהשעה שכבר עברנו, ומוסיפים: וחצי.' },
  'clock-tip-45': { lang: 'he-IL', text: 'כשהמחוג הארוך והירוק מצביע על תשע, אומרים: רבע לשעה הבאה. המחוג הקצר עוד לא הגיע למספר הבא, אבל הוא כבר קרוב אליו.' },
  read: { lang: 'he-IL', text: 'קראי את המילה ובחרי את התמונה המתאימה.' },
  listen: { lang: 'he-IL', text: 'הקשיבי למילה באנגלית. מה מתאים?' },
  count: { lang: 'he-IL', text: 'כמה יש בסל? געי בכל פריט כדי לספור, ואז בחרי את המספר המתאים.' },
  add: { lang: 'he-IL', text: 'כמה יש ביחד? ספרי את שתי הקבוצות ובחרי את התשובה המתאימה.' },
  'count-hint': { lang: 'he-IL', text: 'געי בכל פריט פעם אחת. אחר כך בחרי את המספר שהגעת אליו.' },
  'add-hint': { lang: 'he-IL', text: 'התחילי לספור בקבוצה הראשונה, והמשיכי לספור בקבוצה השנייה. כמה יש ביחד?' },
  'english-hint': { lang: 'he-IL', text: 'נקשיב שוב, קצת יותר לאט.' },
  'read-hint': { lang: 'he-IL', text: 'בואי נשמע את המילה יחד.' },
  'try-again': { lang: 'he-IL', text: 'כמעט! קחי את הזמן, ונסי שוב. אני כאן איתך.' },
  'correct-1': { lang: 'he-IL', text: 'כל הכבוד! הצלחת!' },
  'correct-2': { lang: 'he-IL', text: 'איזה יופי! מצאת!' },
  'correct-3': { lang: 'he-IL', text: 'נהדר! עשית את זה!' },
  complete: { lang: 'he-IL', text: 'יש! סיימת את ההרפתקה! החברים כל כך שמחים שעזרת להם. קיבלת מדבקה חדשה!' },
  'complete-all': { lang: 'he-IL', text: 'איזה יופי! סיימת עוד הרפתקה עם החברים. כל הכבוד על ההתמדה!' },
  stickers: { lang: 'he-IL', text: 'זה אלבום המדבקות שלך! בכל הרפתקה שלמה תגלי מדבקה חדשה.' },
  break: { lang: 'he-IL', text: 'איזה כיף שיחקנו יחד! אפשר לצאת להפסקה, והחברים יחכו לך כאן.' },
};

for (const w of WORDS) CLIPS[`he-${w.id}`] = { lang: 'he-IL', text: w.pointed };
for (const a of ANIMALS) CLIPS[`en-${a.id}`] = { lang: 'en-US', text: a.en.toLowerCase() };
for (const c of COLORS) CLIPS[`en-${c.id}`] = { lang: 'en-US', text: c.en.toLowerCase() };
for (let n = 0; n <= 20; n++) {
  CLIPS[`en-${n}`] = { lang: 'en-US', text: NUMBERS[n].toLowerCase() };
  CLIPS[`number-${n}`] = { lang: 'he-IL', text: String(n) };
}

for (let hour = 1; hour <= 12; hour++) for (const minute of [0, 15, 30, 45]) {
  const time = clockTime(hour, minute);
  CLIPS[time.clip] = { lang: 'he-IL', text: `השעה ${time.he}.` };
}
