import { clockTime } from './clock.js';
import { HEBREW_NARRATION, HEBREW_NUMBERS, clockSpeech } from './speech.js';
import { hebrewSpeech } from './hebrew-pronunciation.js';
import { LETTERS } from './letters.js';
import { WORDS } from './reading.js';
import { CLOCK_SCHOOL_SCRIPTS } from './clock-school-content.js';
import { LETTER_WRITING_SCRIPTS } from './letter-writing-content.js';
import { CHARACTER_SCRIPTS } from './characters-content.js';
export { WORDS, READING_LEVELS } from './reading.js';

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
  characters: { id: 'characters', name: 'חברים מהמסך', subtitle: 'מזהות תמונות וקוראות שמות', description: 'פוגשות את ראבל והחברים וקוראות את השמות שלהם', pup: 'luli', icon: 'paw', subject: 'שמות וחברים', color: 'peach', intro: 'characters-intro', sticker: 'dog', progressMission: 'hebrew' },
  letters: { id: 'letters', name: 'סטודיו האותיות', subtitle: 'מכירות, כותבות ומחברות', description: 'מגלות עם לולי דפוס, כתב יד, אותיות גדולות וקטנות', pup: 'luli', icon: 'letters', subject: 'אותיות', color: 'lavender', intro: 'letter-match-hebrew', sticker: 'butterfly' },
  english: { id: 'english', name: 'מפרץ האנגלית', subtitle: 'מקשיבות ומגלות', description: 'מגלות עם בובי מילים באנגלית', pup: 'bobi', icon: 'boat', subject: 'ENGLISH', color: 'blue', intro: 'intro-english', sticker: 'boat' },
  math: { id: 'math', name: 'סדנת המספרים', subtitle: 'סופרות ומחברות', description: 'עוזרות לטופי להכין את הפיקניק', pup: 'tofi', icon: 'apple', subject: 'חשבון', color: 'yellow', intro: 'intro-math', sticker: 'star' },
  clock: { id: 'clock', name: 'גן השעונים', subtitle: 'מגלות מה השעה', description: 'לומדות עם בובי לקרוא שעון', pup: 'bobi', icon: 'clock', subject: 'מה השעה?', color: 'lavender', intro: 'clock-read', sticker: 'clock' },
};

// Character names practice Hebrew reading. Keep the established shared subject
// counters so a device on an older game version still sees every earned sticker.
export const MISSION_IDS = [...new Set(Object.values(MISSIONS).map(m => m.progressMission || m.id))];

export { STICKERS } from './stickers.js';

// Explicit clips are bundled at build time: no speech subscription or runtime API.
export const CLIPS = {
  'letters-paths': { lang: 'he-IL', text: 'בחרי מסלול. אפשר לשחק ולזהות אותיות, ואפשר ללמוד לכתוב.' },
  'letters-recognition': { lang: 'he-IL', text: 'נביט באות שלמעלה. מצאי את האות שמתאימה לה.' },
  'letters-recognition-hint': { lang: 'he-IL', text: 'זו אותה אות. נסתכל על הצורה שלה.' },
  welcome: { lang: 'he-IL', text: 'שלום אריאל, ברוכה הבאה למשחק שלך!' },
  'reading-levels': { lang: 'he-IL', text: 'מה נקרא היום? בחרי שלב. בואי נגלה מילים חדשות!' },
  'reading-short': { lang: 'he-IL', text: 'שלב ראשון. מילים קצרות.' },
  'reading-familiar': { lang: 'he-IL', text: 'שלב שני. מילים מוכרות.' },
  'reading-long': { lang: 'he-IL', text: 'שלב שלישי. מילים ארוכות.' },
  'reading-challenge': { lang: 'he-IL', text: 'שלב רביעי. אתגר המילים.' },
  'reading-all': { lang: 'he-IL', text: 'כל המילים. מילים מכל השלבים.' },
  'reading-explorers': { lang: 'he-IL', text: 'שלב חמישי. מגלות מילים חדשות.' },
  'reading-colors': { lang: 'he-IL', text: 'שלב שישי. נקרא את הצבע.' },
  'reading-quantities': { lang: 'he-IL', text: 'שלב שביעי. נקרא כמה יש בתמונה.' },
  'reading-positions': { lang: 'he-IL', text: 'שלב שמיני. נקרא איפה נמצא כל דבר.' },
  'reading-actions': { lang: 'he-IL', text: 'שלב תשיעי. נקרא מה החיות עושות.' },
  'reading-sentences': { lang: 'he-IL', text: 'שלב עשירי. נקרא משפטים, ונשים לב לכל הפרטים.' },
  'reading-phrase': { lang: 'he-IL', text: 'קראי מה כתוב, ובחרי את התמונה המתאימה.' },
  'reading-phrase-hint': { lang: 'he-IL', text: 'בואי נקרא ביחד.' },
  'reading-next': { lang: 'he-IL', text: 'מוכנה לעוד אתגר? אפשר להמשיך לשלב הבא!' },
  'reading-more': { lang: 'he-IL', text: 'בואי נקרא עוד ביחד!' },
  'meet-friends': { lang: 'he-IL', text: 'ברוכה הבאה לחבורת ההרפתקאות! החברים שלנו מחכים לך. בחרי הרפתקה, ובואי נשחק יחד!' },
  'choose-activity': { lang: 'he-IL', text: 'כל החברים מחכים לך. בחרי הרפתקה חדשה!' },
  'letters-intro-hebrew': { lang: 'he-IL', text: 'בואי נכיר את האותיות בכתב יד. לחצי על אות, וראי איך כותבים אותה.' },
  'letters-intro-english': { lang: 'he-IL', text: 'בואי נכיר את האותיות הקטנות באנגלית. האות הגדולה והאות הקטנה הן אותה אות.' },
  'letters-demo': { lang: 'he-IL', text: 'נסתכל איך כותבים. מתחילים בנקודה הירוקה, וממשיכים עם העיפרון.' },
  'letters-trace': { lang: 'he-IL', text: 'עכשיו תורך! עברי באצבע על הקווים. התחילי בנקודה הירוקה.' },
  'letters-trace-done': { lang: 'he-IL', text: 'כל הכבוד! כתבת את האות!' },
  'letters-trace-start': { lang: 'he-IL', text: 'נתחיל בנקודה הירוקה, ונמשיך על הקו.' },
  'letter-match-hebrew': { lang: 'he-IL', text: 'איזו אות בכתב יד מתאימה לאות שלמעלה?' },
  'letter-match-english': { lang: 'he-IL', text: 'איזו אות קטנה מתאימה לאות הגדולה?' },
  'letters-hint': { lang: 'he-IL', text: 'ניזכר ביחד איך כותבים את האות.' },
  'letters-final': { lang: 'he-IL', text: 'זו אות סופית. כותבים אותה בסוף מילה.' },
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
  count: { lang: 'he-IL', text: 'כמה יש בסל? לחצי על כל פריט כדי לספור, ואז בחרי את המספר המתאים.' },
  add: { lang: 'he-IL', text: 'כמה יש ביחד? ספרי את שתי הקבוצות ובחרי את התשובה המתאימה.' },
  'count-hint': { lang: 'he-IL', text: 'לחצי על כל פריט פעם אחת. אחר כך בחרי את המספר שהגעת אליו.' },
  'add-hint': { lang: 'he-IL', text: 'התחילי לספור בקבוצה הראשונה, והמשיכי לספור בקבוצה השנייה. כמה יש ביחד?' },
  'english-hint': { lang: 'he-IL', text: 'נקשיב שוב, קצת יותר לאט.' },
  'read-hint': { lang: 'he-IL', text: 'בואי נשמע את המילה יחד.' },
  'try-again': { lang: 'he-IL', text: 'נסי שוב, אריאל. אני כאן איתך.' },
  'correct-1': { lang: 'he-IL', text: 'כל הכבוד! הצלחת!' },
  'correct-2': { lang: 'he-IL', text: 'איזה יופי, אריאל! מצאת!' },
  'correct-3': { lang: 'he-IL', text: 'נהדר! עשית את זה!' },
  complete: { lang: 'he-IL', text: 'יש! סיימת את ההרפתקה! החברים כל כך שמחים שעזרת להם. קיבלת מדבקה חדשה!' },
  'complete-all': { lang: 'he-IL', text: 'איזה יופי! סיימת עוד הרפתקה עם החברים. כל הכבוד על ההתמדה!' },
  stickers: { lang: 'he-IL', text: 'זה אלבום המדבקות שלך! בכל הרפתקה שלמה תגלי מדבקה חדשה.' },
  break: { lang: 'he-IL', text: 'איזה כיף שיחקנו יחד! אפשר לצאת להפסקה, והחברים יחכו לך כאן.' },
};

for (const [key, speech] of Object.entries(HEBREW_NARRATION)) CLIPS[key].speech = speech;
for (const w of WORDS) CLIPS[`he-${w.id}`] = { lang: 'he-IL', text: w.pointed, speech: w.spoken || w.pointed };
for (const a of ANIMALS) CLIPS[`en-${a.id}`] = { lang: 'en-US', text: a.en.toLowerCase() };
for (const c of COLORS) CLIPS[`en-${c.id}`] = { lang: 'en-US', text: c.en.toLowerCase() };
for (let n = 0; n <= 20; n++) {
  CLIPS[`en-${n}`] = { lang: 'en-US', text: NUMBERS[n].toLowerCase() };
  CLIPS[`number-${n}`] = { lang: 'he-IL', text: String(n), speech: HEBREW_NUMBERS[n] };
}

for (let hour = 1; hour <= 12; hour++) for (const minute of [0, 15, 30, 45]) {
  const time = clockTime(hour, minute);
  CLIPS[time.clip] = { lang: 'he-IL', text: `השעה ${time.he}.`, speech: clockSpeech(hour, minute) };
}

for (const [key, text] of Object.entries(CLOCK_SCHOOL_SCRIPTS)) CLIPS[key] = { lang: 'he-IL', text, speech: text };
for (const [key, text] of Object.entries(LETTER_WRITING_SCRIPTS)) CLIPS[key] = { lang: 'he-IL', text, speech: text };
for (const [key, text] of Object.entries(CHARACTER_SCRIPTS)) CLIPS[key] = { lang: 'he-IL', text, speech: text };
for (const clip of Object.values(CLIPS)) if (clip.lang === 'he-IL') clip.speech = hebrewSpeech(clip.speech);

for (const letter of LETTERS.hebrew) CLIPS[letter.clip] = { lang: 'he-IL', text: `האות ${letter.name}`, speech: hebrewSpeech(`הָאוֹת ${letter.spoken}`) };
for (const letter of LETTERS.english) CLIPS[letter.clip] = { lang: 'en-US', text: letter.spoken };
