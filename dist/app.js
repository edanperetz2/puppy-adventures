import { LearningStore } from './learning-sync.js?v=2.2.2-six';
import { questionLearning, learningSummary } from './learning.js';
import { packRound, unpackRound, cleanDrafts, roundKey } from './session-state.js?v=2.2.2-six';
import { JOURNEYS, newJourney, cleanJourney, resumeJourney, englishPairsReady, journeyLength } from './journey.js?v=2.2.5-practice';
import { STORIES } from './journey-content.js';
import { mountJourney } from './journey-view.js?v=2.2.5-practice';
import { mountPark } from './park.js';
import { mountFreeWriting, WRITING_STEPS } from './free-writing.js';
import { parentLearning, learningStatus } from './learning-parent.js?v=2.1.3-sync';
import { MISSIONS, MISSION_IDS, STICKERS, WORDS, READING_LEVELS } from './content.js?v=2.2.0-voices';
import { DEFAULT_SETTINGS, SESSION_LENGTH, createSession, freshProgress, finishSession, sanitizeSettings, sanitizeProgress } from './engine.js?v=2.2.4-practice';
import { ADVENTURE_PHASES, adventurePhase } from './adventure.js?v=2.2.2-six';
import { art, pup, scene, uiIcon } from './art.js';
import { Narrator } from './audio.js?v=2.2.0-voices';
import { GameAnnouncements } from './announcements.js';
import { SharedAlbum, normalizeCode } from './sync.js?v=2.2.2-six';
import { SYNC_CONFIG } from './sync-config.js';
import { mountFamilyPanel, updateFamilyStatus } from './family-ui.js?v=2.2.3-ariel';
import { analogClock, CLOCK_LEVELS } from './clock.js';
import { mountClockSchool } from './clock-school.js?v=2.2.4-practice';
import { sanitizeClockPosition, recordClockLesson } from './clock-learning.js?v=2.2.4-practice';
import { LETTERS, WRITING_FORMS, writingLetter, writingMode, writingPositionKey, letterGroup, letterShape } from './letters.js';
import { mountLetterPad } from './letter-pad.js';
import { nextReadingStage, sanitizeReadingPractice, finishReadingPractice } from './reading.js?v=2.2.2-six';
import { stickerPage, stickerDefinition } from './stickers.js';
import { suggestedLetters, practicedLetterCount, recordLetters, recognitionTargets } from './letter-progress.js';
import { CHARACTERS, CHARACTER_COLLECTIONS, CHARACTER_LEVELS, CHARACTER_MODES, characterCollection, selectCharacterLevel, sanitizeCharacterPractice, finishCharacterPractice, nextCharacterLevel } from './characters.js?v=2.2.2-six';
import { characterMenu, characterQuestion, characterAnswer, characterAnswerLabel, characterMissionArt, characterName } from './characters-view.js?v=2.2.2-six';
import { letterExampleCards } from './letter-examples.js';
import { ARIEL, openAriel, readArielInvitation, GAME_KEY } from './profiles.js?v=2.2.3-ariel';
import { profileSpeech } from './profile-speech.js?v=2.2.0-voices';
import { openGameGuide, GUIDE_ICON } from './guide.js?v=2.2.3-ariel';

const gameStorage = openAriel();
let pendingJoinCode = null;

const app = document.querySelector('#app');
const dialog = document.querySelector('#parent-dialog');
const STORAGE_KEY = GAME_KEY;
let settings = sanitizeSettings(null);
let progress = freshProgress();
let storageAvailable = true;
let view = 'home';
let round = null;
let audioStatus = 'idle';
let dialogOpener = null;
let clockSchool = null;
let clockSchoolPosition = sanitizeClockPosition(null);
let clockReturn = false;
let letterDemo = { language: 'hebrew', form: 'alternate', index: 0, recorded: false };
let recognitionChoice = null;
let letterPad = null;
let lastTraceHint = 0;
let readingPractice = sanitizeReadingPractice(null);
let albumPageIndex = null;
let characterPractice = sanitizeCharacterPractice(null);
let drafts = {}, journeyDrafts = {}, awardedRounds = [], writingPractice = { mode:'trace', drafts:{} };
let learner = null, journeyController = null, journeyPlan = null, parkController = null, freeWriting = null, hub = 'hebrew';

try {
  const saved = JSON.parse(gameStorage.getItem(STORAGE_KEY) || 'null');
  if (saved) {
    // Restore the established album before any optional adventure draft.
    settings=sanitizeSettings(saved.settings);progress=sanitizeProgress(saved.progress);
    readingPractice=sanitizeReadingPractice(saved.readingPractice);clockSchoolPosition=sanitizeClockPosition(saved.clockSchoolPosition);characterPractice=sanitizeCharacterPractice(saved.characterPractice);
    drafts=cleanDrafts(saved.drafts);
    journeyDrafts=Object.fromEntries(Object.values(saved.journeyDrafts||{}).slice(0,40).map(cleanJourney).filter(Boolean).map(p=>[`${p.mode}:${p.level}`,p]));
    awardedRounds=(Array.isArray(saved.awardedRounds)?saved.awardedRounds:[]).filter(id=>/^[0-9a-f-]{36}$/i.test(id)).slice(-10000);
    if(Object.hasOwn(WRITING_STEPS,saved.writingPractice?.mode))writingPractice={mode:saved.writingPractice.mode,drafts:saved.writingPractice.drafts&&typeof saved.writingPractice.drafts==='object'&&!Array.isArray(saved.writingPractice.drafts)?saved.writingPractice.drafts:{}};
  }
} catch { /* A corrupt or unavailable save must never prevent play. */ }

const album = new SharedAlbum({ config: SYNC_CONFIG, storage: gameStorage, onChange: source => {
  void learner?.flush();
  if (!source.linked) return;
  const updated = source.progress;
  const changed = JSON.stringify(progress) !== JSON.stringify(updated);
  progress = updated;
  save();
  updateFamilyStatus(source);
  updateParentProgress();
  const reset = dialog.querySelector('[data-dialog="reset"]');
  if (reset) reset.textContent = 'ניתוק מהאלבום ואיפוס המכשיר הזה';
  if (changed && !dialog.open && ['home', 'album', 'letters-menu', 'letters-writing', 'letters-recognition', 'characters-menu'].includes(view)) render();
  if (view === 'letters-lesson') updateWritingStatus();
  if (changed && view === 'clock-school') clockSchool?.updateProgress();
} });
if (album.linked) progress = album.progress;
learner = new LearningStore({ storage:gameStorage, config:SYNC_CONFIG, getCode:()=>album.code, onChange:()=>{
  const status=dialog.querySelector('.learning-sync-status');if(status)status.textContent=learningStatus(learner);
  if(view==='park')parkController?.update();
  if(view==='letters-lesson')updateWritingStatus();
} });

const narrator = new Narrator(status => {
  audioStatus = status;
  for (const replay of document.querySelectorAll('[data-action="replay"], [data-action="welcome"]')) replay.classList.toggle('is-speaking', status === 'speaking');
  const notice = document.querySelector('#audio-notice');
  if (notice) { notice.hidden = status !== 'unavailable'; notice.textContent = 'הקול לא נשמע? לחצי שוב על הרמקול. אפשר גם להיעזר בהורה.'; }
});
narrator.enabled = settings.sound;
narrator.resolveKey = profileSpeech(ARIEL);
const announcements = new GameAnnouncements(narrator);
let welcomeAttempted = false;

function startOpeningWelcome() {
  if (welcomeAttempted || document.hidden || dialog.open || view !== 'home') return;
  welcomeAttempted = true;
  void announcements.start();
}

function welcome() {
  if (!settings.sound) { settings.sound = true; narrator.enabled = true; save(); renderSoundButton(); }
  void announcements.say(['welcome', 'meet-friends']);
}

function save() {
  try {
    gameStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, progress, readingPractice, clockSchoolPosition, characterPractice, drafts, journeyDrafts, awardedRounds, writingPractice }));
    storageAvailable = true;
  } catch { storageAvailable = false; }
}

function openAlbumInvite() {
  const invite = new URLSearchParams(location.hash.slice(1));
  if (!['album', 'child', 'voice', 'address', 'profile'].some(key => invite.has(key))) return;
  const code = readArielInvitation(invite);
  history.replaceState(null, '', location.pathname + location.search);
  if (code && !album.linked) {
    pendingJoinCode = code;
    parentGate();
  }
}

function applyPreferences() {
  document.documentElement.classList.toggle('still', !settings.motion);
  narrator.enabled = settings.sound;
}

function header() {
  return `<header class="topbar">
    <button class="brand" data-action="home" aria-label="חבורת ההרפתקאות — הביתה"><span class="brand-mark">${art('paw')}</span><span>חבורת<br><strong>ההרפתקאות</strong></span></button>
    <nav class="top-actions" aria-label="ניווט ראשי">
      <button class="nav-button guide-nav" data-action="guide" aria-label="מדריך המשחק בעברית ובאנגלית">${GUIDE_ICON}<span>מדריך</span></button>
      <button class="nav-button album-nav" data-action="album" aria-label="המדבקות שלי${progress.stickers.length ? ` ${progress.stickers.length}` : ''}">${uiIcon('album')}<span>המדבקות שלי</span>${progress.stickers.length ? `<b class="nav-count">${progress.stickers.length}</b>` : ''}</button>
      <button class="circle-button sound-toggle" data-action="sound" aria-label="${settings.sound ? 'כיבוי הקול' : 'הפעלת הקול'}" aria-pressed="${settings.sound}">${uiIcon(settings.sound ? 'sound' : 'muted')}</button>
      <button class="parent-button" data-action="parents" aria-label="להורים">${uiIcon('settings')}<span>להורים</span></button>
    </nav>
  </header>`;
}

function footer() {
  return `<footer class="footer"><span>${art('paw')} הרפתקה קטנה. גילוי גדול.</span><span>משחקות בקצב שלך ♡</span></footer>`;
}

function demoLetter() { return writingLetter(letterDemo.language, letterDemo.index, letterDemo.form); }
function letterNarration() {
  const letter = demoLetter();
  return [`letters-intro-${letterDemo.language}${letterDemo.form === 'main' ? '-main' : ''}`, letter.clip, ...(letter.final ? ['letters-final'] : [])];
}

function letterFormName(language, form) { return language === 'hebrew' ? form === 'main' ? 'דפוס' : 'כתב יד' : form === 'main' ? 'אותיות גדולות' : 'אותיות קטנות'; }

function letterFormTabs() {
  return `<div class="letter-language-tabs letter-form-tabs" role="group" aria-label="צורת האותיות לכתיבה">${WRITING_FORMS.map(form => `<button data-action="letter-form" data-form="${form}" aria-pressed="${letterDemo.form === form}">${letterFormName(letterDemo.language, form)}${letterDemo.language === 'english' ? ` · <bdi dir="ltr">${form === 'main' ? 'ABC' : 'abc'}</bdi>` : ''}</button>`).join('')}</div>`;
}

function recognitionGroup() {
  const language = settings.letterLanguage;
  return recognitionChoice ? recognitionChoice.map(id => LETTERS[language].find(letter => letter.id === id)) : recognitionTargets(progress.letterPractice, language, learner.items);
}

function letterGroupPreview(group, language) {
  return `<bdi class="letter-group-preview" dir="${language === 'hebrew' ? 'rtl' : 'ltr'}">${group.map(item => `<span>${item.familiar}</span>`).join('<span class="letter-group-dot" aria-hidden="true">·</span>')}</bdi>`;
}

function letterNavigation(mode = null) {
  const language = settings.letterLanguage;
  return `<div class="letter-lesson-topline"><button class="text-button" data-action="${mode ? 'letters-menu' : 'home'}">${uiIcon('home')} ${mode ? 'למסלולי האותיות' : 'לבית החברים'}</button><div class="letter-language-tabs" role="group" aria-label="שפת האותיות"><button data-action="letter-language" data-language="hebrew" aria-pressed="${language === 'hebrew'}">עברית · א</button><button data-action="letter-language" data-language="english" aria-pressed="${language === 'english'}"><bdi>English · A a</bdi></button></div></div>${mode ? `<div class="letter-language-tabs letter-mode-tabs" role="group" aria-label="דרך הלמידה"><button data-action="letter-mode" data-mode="recognition" aria-pressed="${mode === 'recognition'}">מזהות אותיות</button><button data-action="letter-mode" data-mode="writing" aria-pressed="${mode === 'writing'}">כותבות אותיות</button></div>` : ''}`;
}

function letterLibrary(language, mode) {
  let visits = progress.letterPractice[language][mode];
  const writing = mode !== 'recognition';
  if(writing)visits=writingVisits(language,mode==='writingMain'?'main':'alternate');
  return `<details class="letter-library"><summary>כל האותיות · בוחרות מה לתרגל</summary><div class="letter-library-grid" dir="${language === 'hebrew' ? 'rtl' : 'ltr'}">${LETTERS[language].map((item, index) => `<button data-action="letter-select" data-index="${index}" data-mode="${mode}" class="${visits[index] ? 'practiced' : ''}" aria-pressed="${writing ? index === letterDemo.index : recognitionChoice?.[0] === item.id}" aria-label="תרגול ${writing ? 'כתיבת' : 'זיהוי'} האות ${item.name}${visits[index] ? ' · כבר תרגלת' : ''}">${item.familiar}${visits[index] ? '<span class="letter-practiced" aria-hidden="true">✓</span>' : ''}${item.final ? '<small>סופית</small>' : ''}</button>`).join('')}</div></details>`;
}

function openLetterMenu() {
  narrator.stop(); round = null; recognitionChoice = null; view = 'letters-menu'; render(); focusTitle(); announcements.say('letters-paths');
}

function openLetterMode(mode) {
  narrator.stop(); round = null; recognitionChoice = null;
  if (mode === 'writing') { view = 'letters-writing'; render(); focusTitle(); announcements.say(`letters-writing-forms-${settings.letterLanguage}`); return; }
  view = 'letters-recognition'; render(); focusTitle(); announcements.say('letters-recognition');
}

function renderLetterMenu() {
  const language = settings.letterLanguage, letters = LETTERS[language];
  const next = suggestedLetters(progress.letterPractice, language);
  const writing = suggestedLetters(progress.letterPractice, language, 'writing', 1, settings.letterWriting[language])[0];
  const mainWriting = writingLetter(language, LETTERS[language].indexOf(suggestedLetters(progress.letterPractice, language, 'writingMain', 1, settings.letterMainWriting[language])[0]), 'main');
  app.innerHTML = `${header()}<main id="main" class="letter-lesson-page letter-menu-page" dir="rtl" lang="he">${letterNavigation()}
    <section class="letter-path-heading"><span class="section-kicker">סטודיו האותיות · לולי לומדת איתך</span><h1 tabindex="-1">מה נרצה לגלות?</h1><p>${language === 'hebrew' ? 'דפוס וכתב יד · מזהות וגם כותבות' : 'אותיות גדולות וקטנות · מזהות וגם כותבות'}</p></section>
    <div class="letter-path-grid"><button class="letter-path-card recognition-path" data-action="letter-mode" data-mode="recognition"><div class="letter-path-picture" dir="${language === 'hebrew' ? 'rtl' : 'ltr'}"><bdi>${next[0].familiar}</bdi><span aria-hidden="true">${language === 'hebrew' ? '←' : '→'}</span>${letterShape(next[0])}</div><h2>מזהות אותיות</h2><p>מוצאות את הצורה שמתאימה לאות המוכרת</p><small>תרגלת ${practicedLetterCount(progress.letterPractice, language, 'recognition')} מתוך ${letters.length} אותיות</small><span class="letter-path-go">בואי נשחק ${uiIcon('arrow')}</span></button>
    <button class="letter-path-card writing-path" data-action="letter-mode" data-mode="writing"><div class="letter-path-picture letter-writing-preview">${letterShape(mainWriting)}${letterShape(writing)}${uiIcon('pencil')}</div><h2>כותבות אותיות</h2><p>${language === 'hebrew' ? 'בוחרות דפוס או כתב יד, ורואות איך כותבים' : 'בוחרות אותיות גדולות או קטנות, ורואות איך כותבים'}</p><small>כתבת ${writingCount(language,'alternate','all') + writingCount(language,'main','all')} מתוך ${letters.length * 2} צורות של אותיות</small><span class="letter-path-go">בואי נכתוב ${uiIcon('arrow')}</span></button></div>
    <p class="letter-path-note">כל מסלול זוכר את ההתקדמות שלך ♡</p></main>${footer()}`;
}

function renderLetterWriting() {
  const language = settings.letterLanguage, letters = LETTERS[language];
  app.innerHTML = `${header()}<main id="main" class="letter-lesson-page letter-writing-menu" dir="rtl" lang="he">${letterNavigation('writing')}
    <section class="letter-path-heading"><span class="section-kicker">העיפרון של לולי מחכה לך</span><h1 tabindex="-1">מה נרצה לכתוב?</h1><p>${language === 'hebrew' ? 'גם את אותיות הדפוס שאת מכירה אפשר ללמוד לכתוב!' : 'גם את האותיות הגדולות שאת מכירה אפשר ללמוד לכתוב!'}</p></section>
    <div class="letter-path-grid">${WRITING_FORMS.map(form => {
      const mode = writingMode(form), position = settings[writingPositionKey(form)][language];
      const next = nextWriting(language,form,position);
      const model = writingLetter(language, letters.indexOf(next), form);
      return `<button class="letter-path-card writing-form-card ${form === 'main' ? 'writing-path' : ''}" data-action="letter-form" data-form="${form}"><div class="letter-path-picture">${letterShape(model)}${uiIcon('pencil')}</div><h2>${letterFormName(language, form)}</h2><p>${language === 'english' ? `<bdi class="letter-form-example" dir="ltr" lang="en">${form === 'main' ? 'A B C' : 'a b c'}</bdi>` : form === 'main' ? 'האותיות המוכרות מהספרים' : 'אותן אותיות בצורה של כתב יד'}</p><small>תרגלנו ${writingCount(language,form,'all')} מתוך ${letters.length} אותיות</small><span class="letter-path-go">בואי נכתוב ${uiIcon('arrow')}</span></button>`;
    }).join('')}</div><p class="letter-path-note">לכל צורה יש התקדמות משלה ♡</p><p id="audio-notice" class="audio-notice" role="status" hidden></p></main>${footer()}`;
}

function renderLetterRecognition() {
  const language = settings.letterLanguage, letters = LETTERS[language], group = recognitionGroup();
  app.innerHTML = `${header()}<main id="main" class="letter-lesson-page letter-recognition-page" dir="rtl" lang="he">${letterNavigation('recognition')}
    <section class="letter-lesson-card"><div class="question-heading"><div><span class="section-kicker">משחק הזיהוי שלך</span><h1 tabindex="-1">מזהות אותיות</h1></div><button class="circle-button" data-action="replay" aria-label="שמיעת ההסבר שוב">${uiIcon('sound')}</button></div>
    <p class="letter-route-description">מסתכלות על האות המוכרת, ומוצאות את אותה אות ${language === 'hebrew' ? 'בכתב יד' : 'קטנה באנגלית'}.</p>
    <p class="letter-route-progress">תרגלת ${practicedLetterCount(progress.letterPractice, language, 'recognition')} מתוך ${letters.length} אותיות</p>
    <div class="letter-recognition-preview" dir="${language === 'hebrew' ? 'rtl' : 'ltr'}">${group.map(letter => `<div><bdi class="letter-familiar">${letter.familiar}</bdi>${letterShape(letter)}</div>`).join('')}</div>
    <div class="letter-recognition-start"><span class="section-kicker">${recognitionChoice ? 'האותיות שבחרת' : 'ממשיכות עם האותיות הבאות'}</span>${letterGroupPreview(group, language)}<small>${SESSION_LENGTH} צעדים קטנים · מדוגמה מוכרת לאתגר חדש</small><button class="primary-button" data-action="letter-practice">בואי נשחק ${uiIcon('arrow')}</button>${recognitionChoice ? '<button class="text-button" data-action="letter-recognition-auto">ממשיכות במסלול שלי</button>' : ''}</div>
    ${letterLibrary(language, 'recognition')}<p id="audio-notice" class="audio-notice" role="status" hidden></p></section></main>${footer()}`;
}

function openLetterLesson(form = settings.letterWritingForm[settings.letterLanguage]) {
  narrator.stop(); round = null;
  const language = settings.letterLanguage;
  if (!WRITING_FORMS.includes(form)) form = 'alternate';
  const positionKey = writingPositionKey(form);
  const next = nextWriting(language,form,settings[positionKey][language]);
  letterDemo = { language, form, index: LETTERS[language].indexOf(next), recorded: false };
  settings.letterWritingForm[language] = form;
  settings[positionKey][language] = letterDemo.index; save();
  view = 'letters-lesson'; render(); focusTitle(); announcements.say(letterNarration());
}

function renderLetterLesson() {
  const letter = demoLetter(), language = letterDemo.language, letters = LETTERS[language];
  const mode = writingMode(letterDemo.form), main = letterDemo.form === 'main';
  const direction = language === 'hebrew' ? 'rtl' : 'ltr';
  app.innerHTML = `${header()}<main id="main" class="letter-lesson-page" dir="rtl" lang="he" data-letter-language="${language}" data-writing-form="${letterDemo.form}">${letterNavigation('writing')}${letterFormTabs()}<div class="writing-steps" role="group" aria-label="דרך תרגול הכתיבה">${Object.entries(WRITING_STEPS).map(([id,label])=>`<button data-action="writing-step" data-step="${id}" aria-pressed="${writingPractice.mode===id}">${label}</button>`).join('')}</div><div class="name-writing"><span>אוֹתִיּוֹת הַשֵּׁם שֶׁלִּי:</span>${nameLetterButtons(language)}</div>
    <section class="letter-lesson-card"><div class="question-heading"><div><span class="section-kicker">לולי מגלה איתך איך כותבים</span><h1 tabindex="-1">${language === 'hebrew' ? `כותבות ${main ? 'בדפוס' : 'בכתב יד'}` : `כותבות אותיות ${main ? 'גדולות' : 'קטנות'}`}</h1></div><button class="circle-button" data-action="replay" aria-label="שמיעת ההסבר שוב">${uiIcon('sound')}</button></div>
      <p class="letter-route-progress" id="letter-writing-progress">כתבת ${writingCount(language,letterDemo.form)} מתוך ${letters.length} אותיות</p>
      <div class="letter-lesson-layout" dir="rtl"><div><div class="letter-pair" dir="${direction}"><div class="letter-form-card"><small dir="rtl">${language === 'hebrew' ? 'האות שאת מכירה · דפוס' : 'האות שאת מכירה · גדולה'}</small><bdi class="letter-familiar" dir="${direction}" lang="${language === 'hebrew' ? 'he' : 'en'}">${letter.familiar}</bdi></div><span class="letter-pair-arrow" dir="ltr" aria-hidden="true">${language === 'hebrew' ? '←' : '→'}</span><div class="letter-form-card new-form"><small dir="rtl">${main ? language === 'hebrew' ? 'כך כותבים · דפוס' : 'כך כותבים · גדולה' : language === 'hebrew' ? 'אותה אות · כתב יד' : 'אותה אות · קטנה'}</small>${letterShape(letter)}</div></div>
      <div class="letter-name-row"><span>${language === 'hebrew' ? letter.name : `<bdi>${letter.familiar}</bdi>`}</span><button class="circle-button" data-action="letter-sound" aria-label="שמיעת שם האות">${uiIcon('sound')}</button></div>
      ${!main && language === 'english' && ['a', 'g'].includes(letter.small) ? `<p class="letter-book-note">בספרים אפשר לראות גם כך: <bdi class="letter-book-form">${letter.small}</bdi></p>` : ''}
      ${letter.final ? '<p class="letter-final-note">אות סופית · מופיעה בסוף מילה</p>' : ''}
      <p class="letter-copy">${writingPractice.mode==='trace'?'לחצי על העיפרון כדי לראות איך כותבים, ואז נסי בעצמך.':'נכתוב בקצב שלנו. בסיום נבחר סיימנו לתרגל.'}<br>לכל דרך תרגול יש התקדמות משלה.</p>
      <div class="letter-navigate" dir="${direction}"><button data-action="letter-previous" aria-label="האות הקודמת"><span aria-hidden="true">${language === 'hebrew' ? '→' : '←'}</span><span dir="rtl">הקודמת</span></button><span dir="ltr">${letterDemo.index + 1} / ${letters.length}</span><button data-action="letter-next" aria-label="האות הבאה"><span dir="rtl">הבאה</span><span aria-hidden="true">${language === 'hebrew' ? '←' : '→'}</span></button></div>
      </div><section class="letter-pad-card"><h2>מגלות איך כותבים</h2><div id="letter-writing-pad">${letterShape(letter, { guide: true, pad: true })}<p class="letter-pad-caption" role="status" aria-live="polite"></p></div><div class="letter-pad-controls"><button data-action="letter-demo">${uiIcon('pencil')} הראי לי איך</button><button data-action="letter-step">קו־קו</button><button data-action="letter-reset">${uiIcon('again')} מנסה בעצמי</button></div></section></div>
      <div class="letter-writing-continue"><button class="primary-button" data-action="letter-writing-continue" ${letterDemo.recorded ? '' : 'disabled'}>ממשיכות לאות הבאה ${uiIcon('arrow')}</button><small>אפשר גם לבחור כל אות מהאלפבית</small></div>
      ${letterExampleCards(letter,settings.nikud)}${letterLibrary(language, mode)}<p id="audio-notice" class="audio-notice" role="status" hidden></p>
    </section></main>${footer()}`;
  if (writingPractice.mode !== 'trace') {
    const host=document.querySelector('#letter-writing-pad'), key=writingKey();
    if(writingPractice.drafts[key]?.done)letterDemo.recorded=true;
    document.querySelector('.letter-pad-controls').hidden=true;
    freeWriting=mountFreeWriting(host,{letter,mode:writingPractice.mode,saved:writingPractice.drafts[key],speak:keys=>announcements.say(keys),
      onSave:draft=>{writingPractice.drafts[key]={...draft,at:Date.now()};const inks=Object.entries(writingPractice.drafts).filter(([,v])=>v.lines?.length).sort((a,b)=>(b[1].at||0)-(a[1].at||0));for(const [oldKey]of inks.slice(8))writingPractice.drafts[oldKey].lines=[];save();},
      onComplete:method=>{letterDemo.recorded=true;learner.record({item:`letter:${language}:${letter.id}:${letterDemo.form}:${method}`,domain:'letters',eventId:`write:${key}:${Date.now()}`},'practice',method);save();updateWritingStatus();}
    });
    updateWritingStatus();return;
  }
  letterPad = mountLetterPad(document.querySelector('#letter-writing-pad'), {
    motion: settings.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches,
    onComplete: () => {
      if (!letterDemo.recorded) {
        letterDemo.recorded = true;
        learner.record({item:`letter:${language}:${letter.id}:${letterDemo.form}:trace`,domain:'letters'},'practice','trace');
        if (album.linked) progress = album.recordWriting(language, letter.id, mode);
        else progress.letterPractice = recordLetters(progress.letterPractice, language, mode, [letter.id]);
        save(); updateWritingStatus();
      }
      announcements.say('letters-trace-done'); narrator.chime(); celebrate(12);
    },
    onStartNeeded: () => { if (Date.now() - lastTraceHint > 5000) { lastTraceHint = Date.now(); announcements.say('letters-trace-start'); } },
  });
}

function writingVisits(language,form,step=writingPractice.mode){
 const legacy=progress.letterPractice[language][writingMode(form)];
 const items=learner.items;
 return LETTERS[language].map((letter,i)=>step==='trace'?legacy[i]:step==='all'?legacy[i]+['copy','memory','paper'].reduce((sum,method)=>sum+(items[`letter:${language}:${letter.id}:${form}:${method}`]?.practice||0),0):items[`letter:${language}:${letter.id}:${form}:${step}`]?.practice||0);
}
function writingCount(language,form,step=writingPractice.mode){return writingVisits(language,form,step).filter(n=>n>0).length;}
function nextWriting(language, form, start = 0, skip = -1) {
  const visits = writingVisits(language, form), letters = LETTERS[language];
  return letters.map((letter, index) => ({ letter, index, count: visits[index], order: (index - start + letters.length) % letters.length }))
    .filter(item => item.index !== skip).sort((a, b) => a.count - b.count || a.order - b.order)[0].letter;
}

function writingKey(){return `${letterDemo.language}:${letterDemo.form}:${letterDemo.index}:${writingPractice.mode}`;}
function nameLetterButtons(language) {
  const name = language === 'english' ? 'ARIEL' : ARIEL.name;
  return [...new Set(name)].map(char => {
    const index = LETTERS[language].findIndex(letter => letter.familiar === char);
    return `<button data-action="name-letter" data-index="${index}">${char}</button>`;
  }).join('');
}
function updateWritingStatus() {
  const language = letterDemo.language, mode = writingMode(letterDemo.form);
  const status = document.querySelector('#letter-writing-progress');
  if (status) status.textContent = `${WRITING_STEPS[writingPractice.mode]} · תרגלנו ${writingCount(language,letterDemo.form)} מתוך ${LETTERS[language].length} אותיות`;
  const next = document.querySelector('[data-action="letter-writing-continue"]');
  if (next) next.disabled = !letterDemo.recorded;
  for (const button of document.querySelectorAll(`[data-action="letter-select"][data-mode="${mode}"]`)) {
    const practiced = writingVisits(language,letterDemo.form)[Number(button.dataset.index)] > 0;
    button.classList.toggle('practiced', practiced);
    if (practiced && !button.querySelector('.letter-practiced')) button.insertAdjacentHTML('beforeend', '<span class="letter-practiced" aria-hidden="true">✓</span>');
  }
}

function selectLetter(index) {
  const language = settings.letterLanguage, length = LETTERS[language].length;
  if (view === 'letters-recognition') {
    recognitionChoice = letterGroup(language, index).map(letter => letter.id); render(); focusTitle(); return;
  }
  letterDemo = { language, form: letterDemo.form, index: (index + length) % length, recorded: false };
  settings[writingPositionKey(letterDemo.form)][language] = letterDemo.index; save(); render();
  document.querySelector('[data-action="letter-sound"]')?.focus({ preventScroll: true });
  announcements.say([demoLetter().clip, ...(demoLetter().final ? ['letters-final'] : [])]);
}


function renderClockSchool() {
  app.innerHTML = `${header()}<main id="main" class="clock-school-page"><div id="clock-school-root"></div></main>${footer()}`;
  clockSchool = mountClockSchool(document.querySelector('#clock-school-root'), {
    getProgress: () => progress.clockLessons,
    position: clockSchoolPosition,
    onPosition: position => { clockSchoolPosition = position; save(); },
    onRecord: index => {
      if (album.linked) progress = album.recordClockLesson(index);
      else progress.clockLessons = recordClockLesson(progress.clockLessons, index);
      save();
    },
    speak: (keys, explicit = false) => explicit ? clockSpeak(keys) : announcements.say(keys),
    onPractice: () => {
      if (clockReturn && round) { view = 'game'; render(); focusTitle(); const q = current(); announcements.say([q.prompt, ...(q.targetClip ? [q.targetClip] : [])]); }
      else startMission('clock', true);
    },
    returnToGame: clockReturn, practiceName: CLOCK_LEVELS[settings.clockLevel].name, motion: settings.motion,
  });
}

function openClockLesson(returnToGame = false) {
  narrator.stop(); clockReturn = returnToGame;
  if (returnToGame) { round.helped.add(round.index);checkpoint(); }
  else round = null;
  view = 'clock-school'; render(); focusTitle(); clockSchool.replay();
}

function clockSpeak(keys) {
  if (!settings.sound) { settings.sound = true; narrator.enabled = true; save(); renderSoundButton(); }
  announcements.say(keys);
}

function openCharacters() {
  narrator.stop(); round = null; view = 'characters-menu'; render(); focusTitle(); announcements.say(characterMenuClip());
}
function characterMenuClip() { return CHARACTER_COLLECTIONS[characterCollection(settings.characterLevel)].menuClip; }

function activityCount(id) { return id === 'characters' ? Object.values(characterPractice.completed).reduce((sum, count) => sum + count, 0) : progress.missions[id]; }

function renderHome() {
  app.innerHTML = `${header()}<main id="main" class="home-page">${resumeCard()}
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy"><div class="eyebrow"><span class="tiny-sun">✦</span><span>שלום <bdi>${ARIEL.name}</bdi>!</span></div>
        <h1 id="hero-title" tabindex="-1">הרפתקה קטנה,<br><span>מגלות עולם!</span></h1>
        <p class="hero-description">לולי, בובי וטופי מחכים לך.<br>בואי נשחק, נגלה ונלמד ביחד.</p>
        <button class="primary-button hero-start" data-action="recommended">יוצאות להרפתקה ${uiIcon('arrow')}</button>
        <button class="text-button welcome-listen" data-action="welcome">${uiIcon('sound')} לחצי ונכיר את החברים</button>
        <p id="audio-notice" class="audio-notice" role="status" hidden></p>
      </div><div class="hero-world">${scene()}<img class="home-pikachu" src="./assets/home-pikachu.png" alt="פיקאצ׳ו" width="68" height="68"><div class="world-caption"><span class="status-dot"></span> בית החברים · תמיד שמחים לראות אותך</div></div>
    </section>
    <section class="missions" aria-labelledby="missions-title"><div class="section-heading"><div><span class="section-kicker">כל פעם מגלות משהו חדש</span><h2 id="missions-title">לאן נצא היום?</h2></div><span class="rounds-note">${SESSION_LENGTH} צעדים · מתחילות בקל ומתקדמות ${art('paw')}</span></div>
      <div class="mission-grid">${Object.values(MISSIONS).map(m => `<button class="mission-card ${m.color}" data-action="mission" data-mission="${m.id}" aria-label="${m.name} — ${m.description}">
        <div class="mission-art"><span class="art-orbit"></span>${m.id === 'characters' ? characterMissionArt() : art(m.icon, 'mission-object') + pup(m.pup, 'mission-pup')}<span class="mini-sparkle">✦</span></div>
        <div class="mission-body"><span class="subject-tag" ${m.id === 'english' ? 'lang="en" dir="ltr"' : ''}>${m.subject}</span><h3>${m.name}</h3><p>${m.subtitle}</p><span class="mission-go">בואי נשחק ${uiIcon('arrow')}</span></div>
        ${activityCount(m.id) ? `<span class="mission-done" aria-label="כבר סיימת ${activityCount(m.id)} הרפתקאות">${uiIcon('check')}</span>` : ''}
      </button>`).join('')}</div>
    </section>
    <section class="home-feature-card park-feature"><div>${pup('tofi')}</div><span><h3>הַפָּארְק שֶׁלִּי</h3><p>קִשּׁוּטִים, חֲבֵרִים וּמָקוֹם לַדִּמְיוֹן</p></span><button class="primary-button" data-action="park">בּוֹנִים וּמְשַׂחֲקִים ${uiIcon('arrow')}</button></section>
    <section class="home-feature-card album-feature"><div>${art(progress.stickers.at(-1) || 'star')}</div><span><h3>הָאַלְבּוֹם שֶׁלִּי</h3><p>${progress.stickers.length ? `${progress.stickers.length} מדבקות מחכות לך באלבום` : 'בכל הרפתקה שלמה מגלות מדבקה חדשה'}</p></span><button class="primary-button" data-action="album">לאלבום שלי ${uiIcon('arrow')}</button></section>
  </main>${footer()}`;
}

function current() { return round?.questions[round.index]; }
function lastQuestion() { return round.index === round.questions.length - 1; }
function wordText(word) { return settings.nikud ? word.pointed : word.he; }
function tallyGroup(n, offset, item) {
  return `<div class="object-group ${n > 10 ? 'many' : ''}" role="group" aria-label="קבוצה לספירה">${Array.from({ length: n }, (_, i) => `<button class="count-object" data-action="tally" data-token="${offset + i}" aria-label="ספירת פריט ${offset + i + 1}">${art(item)}<span class="count-bubble" aria-hidden="true"></span></button>`).join('')}</div>`;
}

function questionVisual(q) {
  if (q.type === 'character') return characterQuestion(q, settings.nikud);
  if (q.type === 'letter') return `<div class="letter-question-layout" dir="rtl"><div class="letter-question-card"><small>${q.letter.language === 'hebrew' ? 'איזו אות בכתב יד מתאימה?' : 'איזו אות קטנה מתאימה?'}</small><bdi class="letter-familiar" dir="${q.letter.language === 'hebrew' ? 'rtl' : 'ltr'}">${q.letter.familiar}</bdi></div><div id="letter-recognition-model" class="letter-recognition-model" ${q.showModel ? '' : 'hidden'}>${letterShape(q.letter)}<span>זו אותה אות · נסתכל על הצורה</span></div></div>`;
  if (q.type === 'clock') return `<div class="clock-question-clock">${analogClock(q.time.hour, q.time.minute)}</div><button class="text-button clock-learn-link" data-action="clock-learn">${uiIcon('hint')} נזכרות איך קוראים שעון</button>`;
  if (q.type === 'read') return `<div class="word-card ${q.word.scene ? 'phrase-word' : q.word.he.length >= 6 ? 'long-word' : ''}"><span class="card-label">מה כתוב כאן?</span><div class="target-word" lang="he" dir="rtl">${q.word.scene ? wordText(q.word).split(' ').map(word => `<span class="reading-token">${word}</span>`).join(' ') : wordText(q.word)}</div><span class="word-underline"></span></div>`;
  if (q.type === 'listen') return `<button class="listen-orb" data-action="listen-word" aria-label="שמיעת המילה באנגלית">${uiIcon('sound')}<span class="sound-waves"><i></i><i></i><i></i><i></i><i></i></span><span>לחצי ושמעי את המילה</span></button>`;
  if (q.type === 'count') return `<div class="counting-stage">${tallyGroup(q.a, 0, q.item)}<p class="tally-instruction">אפשר לגעת בכל פריט ולספור ביחד</p></div>`;
  return `<div class="addition-stage ${Math.max(q.a, q.b) > 10 ? 'large-add' : ''}" dir="ltr"><div class="add-group">${tallyGroup(q.a, 0, q.item)}<span class="group-number">${q.a}</span></div><span class="plus-sign" aria-label="ועוד">+</span><div class="add-group">${tallyGroup(q.b, q.a, q.item)}<span class="group-number">${q.b}</span></div></div><div class="equation" dir="ltr" aria-label="${q.a} ועוד ${q.b}">${q.a} <span>+</span> ${q.b} <span>=</span> <b>?</b></div>`;
}

function answerVisual(q, option) {
  if (q.type === 'character') return characterAnswer(q, option, settings.nikud);
  if (q.type === 'letter') return letterShape(option);
  if (q.type === 'clock') return `<span class="clock-answer-time" dir="ltr">${option.digital}</span><span class="clock-answer-name">${option.he}</span>`;
  if (q.type === 'read') return art(option.id);
  if (q.kind === 'color') return `<span class="color-balloon" style="--balloon:${option.hex}"><i></i></span>`;
  if (q.type === 'count' || q.type === 'add' || q.kind === 'number') return `<span class="answer-number" dir="ltr">${option.number}</span>`;
  return art(option.id);
}

function answerLabel(q, option) {
  if (q.type === 'character') return characterAnswerLabel(q, option);
  if (q.type === 'letter') return `${option.name} ${option.language === 'hebrew' ? 'בכתב יד' : 'קטנה'}`;
  if (q.type === 'clock') return `השעה ${option.he}, ${option.digital}`;
  if (q.type === 'read') return option.he;
  if (typeof option.number === 'number') return String(option.number);
  return option.he;
}

function renderGame() {
  const mission = MISSIONS[round.mission];
  const q = current();
  const length = round.questions.length;
  learner.record({...questionLearning(q),eventId:`${round.id}:seen:${round.index}`},'seen');
  const title = q.type === 'character' ? q.direction === 'picture-name' ? 'מה השם של הדמות?' : 'איזו דמות מתאימה לשם?' : q.type === 'letter' ? 'איזו אות מתאימה?' : q.type === 'clock' ? 'מה השעה בשעון?' : q.type === 'read' ? q.word.scene ? 'איזו תמונה מתאימה למה שכתוב?' : 'איזו תמונה מתאימה למילה?' : q.type === 'listen' ? 'מה שמעת באנגלית?' : q.type === 'add' ? 'כמה יש ביחד?' : 'כמה יש בסל?';
  const stage = q.type === 'read' ? round.reading === 'all' ? Object.values(READING_LEVELS).find(level => level.level === q.word.level) : READING_LEVELS[round.reading] : null;
  app.innerHTML = `${header()}<main id="main" class="game-page ${mission.color} ${q.type === 'character' ? 'character-game' : q.type === 'clock' ? 'clock-game' : q.type === 'letter' ? 'letter-game' : q.type === 'read' ? 'reading-game' : ''}">
    <div class="game-topline"><button class="text-button back-button" data-action="${q.type === 'character' ? 'characters-menu' : q.type === 'read' ? 'reading-levels' : q.type === 'letter' ? 'letters-menu' : 'home'}">${uiIcon('home')} ${q.type === 'character' ? 'לבחירת חברים' : q.type === 'read' ? 'לבחירת שלב' : q.type === 'letter' ? 'למסלולי האותיות' : 'למפת ההרפתקאות'}</button><span class="mission-label">${mission.name}${q.type === 'character' ? ` · שלב ${CHARACTER_LEVELS[round.characterLevel].number}` : ''}${q.type === 'letter' ? ' · משחק זיהוי' : ''}${stage ? ` · ${stage.number ? `שלב ${stage.number}` : stage.name}` : ''}</span><span class="step-label">צעד ${round.index + 1} מתוך ${length}</span></div>
    <div class="step-track" aria-label="התקדמות: ${round.index} מתוך ${length}">${round.questions.map((_, i) => `<span class="step-dot ${i < round.index ? 'done' : i === round.index ? 'current' : ''}">${i < round.index ? uiIcon('check') : i + 1}</span>`).join('')}</div>
    <section class="game-board"><div class="question-heading"><div><span class="section-kicker">${ADVENTURE_PHASES[q.phase]}</span><h1 id="question-title" tabindex="-1">${title}</h1></div><button class="circle-button replay-button" data-action="replay" aria-label="שמיעת ההוראות שוב">${uiIcon('sound')}</button></div>
      <div class="question-visual">${questionVisual(q)}</div>
      <div class="answer-grid ${q.options.length === 2 ? 'two-options' : ''} ${q.type === 'character' ? q.direction === 'picture-name' ? 'character-names' : 'character-pictures' : ''} ${q.type === 'read' && q.word.scene ? 'scene-options' : ''} ${q.type === 'count' || q.type === 'add' || q.kind === 'number' ? 'numeric-options' : ''}" ${q.type === 'letter' ? `dir="${q.letter.language === 'hebrew' ? 'rtl' : 'ltr'}"` : ''} role="group" aria-label="בחירת תשובה">${q.options.map(option => `${q.type === 'clock' ? '<div class="clock-choice">' : ''}<button class="answer-button ${round.attempted.has(option.id) ? 'try-again' : ''}" data-action="answer" data-answer="${option.id}" aria-label="${answerLabel(q, option)}" ${round.attempted.has(option.id) ? 'disabled' : ''}>${answerVisual(q, option)}<span class="answer-check">${uiIcon('check')}</span></button>${q.type === 'clock' ? `<button class="clock-option-sound" data-action="clock-option-audio" data-clips="${option.clips.join(' ')}" aria-label="שמיעת האפשרות ${option.he}">${uiIcon('sound')}</button></div>` : ''}`).join('')}</div>
      <div class="feedback-row"><div class="feedback" id="feedback" role="status" aria-live="polite">קחי את הזמן. החברים כאן איתך ♡</div><button class="hint-button" data-action="hint">${uiIcon('hint')} רמז קטן</button><button class="primary-button next-button" data-action="next" hidden>ממשיכות ${uiIcon('arrow')}</button></div>
      <div id="letter-success-examples">${round.resolved && q.type==='letter' ? letterExampleCards(q.letter,settings.nikud) : ''}</div><p id="audio-notice" class="audio-notice" role="status" hidden></p>
    </section><div class="buddy-bar">${pup(mission.pup)}<span id="buddy-message">${{ luli: 'לולי', bobi: 'בובי', tofi: 'טופי' }[mission.pup]} כאן לעזור לך!</span><span class="buddy-hearts">♡ ♡ ♡</span></div>
  </main>${footer()}`;
}

function renderComplete() {
  const mission = MISSIONS[round.mission];
  const reading = round.mission === 'hebrew';
  const letters = round.mission === 'letters';
  const characters = round.mission === 'characters';
  const nextCharacters = characters ? nextCharacterLevel(round.characterLevel, round.helped.size) : null;
  const nextLetters = letters ? suggestedLetters(progress.letterPractice, round.letterLanguage) : [];
  const nextKey = reading ? nextReadingStage(round.reading, round.helped.size) : null;
  const nextStage = nextKey ? READING_LEVELS[nextKey] : null;
  app.innerHTML = `${header()}<main id="main" class="completion-page">
    <div class="completion-stars">✦ <span>✧</span> ✦</div><div class="reward-art">${art(round.sticker || mission.sticker)}</div>
    <div class="eyebrow">החברים שמחים כל כך!</div><h1 tabindex="-1">יש! עשית את זה!</h1>
    <p>סיימת את ${mission.name}${characters ? ` · שלב ${CHARACTER_LEVELS[round.characterLevel].number}` : ''}${reading && READING_LEVELS[round.reading]?.number ? ` · שלב ${READING_LEVELS[round.reading].number}` : ''}.</p>
    <p class="reward-caption">${round.sticker ? 'מדבקה חדשה הצטרפה לאלבום שלך' : 'עוד הרפתקה נפלאה עם החברים'}</p>
    ${reading ? `<section class="reading-next-offer"><span class="section-kicker">יש עוד דברים חדשים לגלות!</span>${nextStage ? `<button class="primary-button" data-action="reading-level" data-level="${nextKey}">ממשיכות לשלב ${nextStage.number} ${uiIcon('arrow')}</button><small>${nextStage.name}</small>` : `<button class="primary-button" data-action="reading-level" data-level="${round.reading}">קוראות עוד ביחד ${uiIcon('arrow')}</button>`}</section>` : ''}
    ${letters ? `<section class="letter-next-offer"><span class="section-kicker">תרגלת ${practicedLetterCount(progress.letterPractice, round.letterLanguage, 'recognition')} מתוך ${LETTERS[round.letterLanguage].length} אותיות</span>${letterGroupPreview(nextLetters, round.letterLanguage)}<button class="primary-button" data-action="letter-recognition-next">ממשיכות לאותיות הבאות ${uiIcon('arrow')}</button></section>` : ''}
    ${characters ? `<section class="character-next-offer"><span class="section-kicker">החברים שמחים לפגוש אותך!</span>${nextCharacters ? `<button class="primary-button" data-action="character-advance" data-level="${nextCharacters}">ממשיכות לשלב ${CHARACTER_LEVELS[nextCharacters].number} ${uiIcon('arrow')}</button><small>${CHARACTER_LEVELS[nextCharacters].name}</small>` : `<button class="primary-button" data-action="character-repeat">עוד הרפתקה עם החברים ${uiIcon('arrow')}</button>`}</section>` : ''}
    <div class="completion-pups">${pup('luli')}${pup('bobi')}${pup('tofi')}</div>
    <div class="completion-actions"><button class="${reading || letters || characters ? 'secondary-button' : 'primary-button'}" data-action="album">למדבקות שלי ${uiIcon('album')}</button>
    ${reading ? `${nextStage ? `<button class="secondary-button" data-action="reading-level" data-level="${round.reading}">עוד בשלב הזה</button>` : ''}<button class="text-button" data-action="reading-levels">לכל שלבי הקריאה</button>` : ''}
    ${letters ? '<button class="secondary-button" data-action="letter-recognition-repeat">עוד עם האותיות האלה</button><button class="text-button" data-action="letters-menu">למסלולי האותיות</button>' : ''}
    ${characters ? `${nextCharacters ? '<button class="secondary-button" data-action="character-repeat">עוד בשלב הזה</button>' : ''}<button class="text-button" data-action="characters-menu">לבחירת החברים והמשחק</button>` : ''}
    <button class="secondary-button" data-action="home">עוד הרפתקה ${uiIcon('arrow')}</button><button class="text-button" data-action="break">עכשיו הפסקה קטנה ♡</button></div>
  </main>${footer()}`;
}

function renderReadingLevels() {
  const stages = Object.entries(READING_LEVELS).filter(([, stage]) => stage.number);
  const selected = READING_LEVELS[settings.reading];
  app.innerHTML = `${header()}<main id="main" class="reading-levels-page" dir="rtl" lang="he">
    <div class="reading-levels-topline"><button class="text-button" data-action="home">${uiIcon('home')} לבית החברים</button><span>גינת המילים · כל פעם מגלות עוד</span></div>
    <section class="reading-levels-heading"><div><span class="section-kicker">לולי קוראת איתך</span><h1 tabindex="-1">מה נקרא היום?</h1><p>${WORDS.filter(word => !word.scene).length} מילים ו־${WORDS.filter(word => word.scene).length} צירופים ומשפטים · בכל פעם מגלות עוד ♡</p></div><button class="circle-button" data-action="replay" aria-label="שמיעת ההסבר שוב">${uiIcon('sound')}</button></section>
    <section class="reading-continue"><div class="reading-continue-art">${art(selected.art || 'flower')}</div><div><span class="section-kicker">נמשיך מאיפה שעצרנו?</span><h2>${selected.number ? `שלב ${selected.number} · ` : ''}${selected.name}</h2></div><button class="primary-button" data-action="reading-level" data-level="${settings.reading}">בואי נקרא ${uiIcon('arrow')}</button></section>
    <nav class="reading-path" aria-label="קפיצה לשלבי הקריאה">${stages.map(([key, stage]) => `<a href="#reading-stage-${key}" aria-label="מעבר לשלב ${stage.number}: ${stage.name}" ${settings.reading === key ? 'aria-current="step"' : ''}><bdi dir="ltr">${stage.number}</bdi></a>`).join('')}</nav>
    <div class="reading-stage-grid">${stages.map(([key, stage]) => `<article id="reading-stage-${key}" class="reading-stage ${stage.color} ${stage.number >= 6 ? 'long-samples' : ''} ${settings.reading === key ? 'last-chosen' : ''}">
      <button class="reading-stage-start" data-action="reading-level" data-level="${key}" aria-label="שלב ${stage.number}: ${stage.name}"><span class="reading-stage-number" aria-hidden="true"><bdi dir="ltr">${stage.number}</bdi></span>${stage.fresh ? '<span class="reading-new">חדש בגינה ✦</span>' : ''}
      <div class="reading-stage-art">${art(stage.art)}</div><span class="reading-stage-range">${stage.range}</span><h2>${stage.name}</h2><p>${stage.description}</p>
      <div class="reading-stage-samples">${stage.samples.slice(0, stage.number >= 6 ? 1 : 3).map(id => `<span>${wordText(WORDS.find(word => word.id === id))}</span>`).join('<span aria-hidden="true">·</span>')}</div>
      <span class="reading-stage-count">${WORDS.filter(word => word.level === stage.level).length} ${stage.number <= 5 ? 'מילים לגלות' : 'צירופים ומשפטים'}</span>
      <span class="reading-stage-go">בואי נקרא ${uiIcon('arrow')}</span>${settings.reading === key ? '<span class="reading-last-choice">השלב שבחרת לאחרונה</span>' : ''}</button>
      <button class="circle-button reading-stage-sound" data-action="reading-stage-sound" data-level="${key}" aria-label="שמיעת הסבר על שלב ${stage.number}">${uiIcon('sound')}</button></article>`).join('')}</div>
    <div class="reading-mixed-row"><button class="secondary-button" data-action="reading-level" data-level="all">מכל הגינה · משחק מכל השלבים ${uiIcon('arrow')}</button><button class="circle-button" data-action="reading-stage-sound" data-level="all" aria-label="שמיעת הסבר על משחק מכל השלבים">${uiIcon('sound')}</button></div><p id="audio-notice" class="audio-notice" role="status" hidden></p>
  </main>${footer()}`;
}


function openReadingLevels() {
  narrator.stop(); round = null; view = 'reading-levels'; render(); focusTitle(); announcements.say('reading-levels');
}

function renderAlbum() {
  const page = stickerPage(progress.stickers, albumPageIndex);
  albumPageIndex = page.index;
  const previousButton = `<button class="secondary-button" data-action="album-page" data-page="${page.index - 1}" ${page.index === 0 ? 'disabled' : ''}>לעמוד הקודם</button>`;
  const nextButton = `<button class="secondary-button" data-action="album-page" data-page="${page.index + 1}" ${page.index === page.pageCount - 1 ? 'disabled' : ''}>לעמוד הבא</button>`;
  app.innerHTML = `${header()}<main id="main" class="album-page"><button class="text-button back-button" data-action="home">${uiIcon('home')} לבית החברים</button>
    <div class="album-heading"><span class="eyebrow">מזכרות מההרפתקאות שלנו</span><h1 tabindex="-1">המדבקות שלי</h1><p>כבר גילית <b>${page.collected}</b> מתוך <b>${STICKERS.length.toLocaleString('en-US')}</b> מדבקות!</p><progress class="album-progress" value="${page.collected}" max="${STICKERS.length}" aria-label="${page.collected} מתוך ${STICKERS.length} מדבקות נאספו"></progress><p class="album-next-reward">${page.collected === STICKERS.length ? 'כל המדבקות באלבום שלך! אפשר להמשיך לגלות ולשחק ♡' : 'בכל הרפתקה שלמה מגלות מדבקה חדשה ♡'}</p></div>
    ${!album.linked ? `<aside class="album-connect-note"><p>האלבום שמור כאן במכשיר. כדי לראות את אותן המדבקות גם ב-Safari וגם ממסך הבית, מחברים את שניהם לאותו אלבום משפחתי.</p><button class="text-button" data-action="parents">חיבור האלבום עם הורה ${uiIcon('settings')}</button></aside>` : ''}
    <nav class="album-pagination" aria-label="דפדוף בראש האלבום">${previousButton}<label class="album-page-select"><span>עמוד ${page.index + 1} מתוך ${page.pageCount}</span><select data-album-page aria-label="בחירת עמוד באלבום">${Array.from({ length: page.pageCount }, (_, index) => `<option value="${index}" ${index === page.index ? 'selected' : ''}>עמוד ${index + 1}</option>`).join('')}</select></label>${nextButton}</nav>
    <p class="album-page-range" role="status">מדבקות <bdi dir="ltr">${page.start + 1}–${page.end}</bdi></p>
    ${page.collected ? '<button class="text-button album-latest" data-action="album-latest">למדבקה האחרונה שלי</button>' : ''}
    <div class="sticker-grid">${page.entries.map(({ id, number, unlocked }) => `<div class="sticker ${unlocked ? 'unlocked' : 'locked'}" role="img" aria-label="${unlocked ? `מדבקה ${number} נאספה: ${stickerDefinition(id).name}` : `מדבקה ${number} מחכה להרפתקה הבאה`}">${unlocked ? art(id) : '<span class="sticker-mystery" aria-hidden="true">?</span>'}<span class="sticker-index" aria-hidden="true">${String(number).padStart(3, '0')}</span></div>`).join('')}</div>
    <nav class="album-pagination album-bottom-pages" aria-label="דפדוף בתחתית האלבום">${previousButton}${nextButton}</nav>
    <button class="primary-button" data-action="recommended">יוצאות להרפתקה ${uiIcon('arrow')}</button></main>${footer()}`;
}

function turnAlbumPage(index) {
  albumPageIndex = index;
  render(); focusTitle();
}

function render() {
  freeWriting?.destroy(); freeWriting=null;
  journeyController?.destroy(); journeyController=null;
  parkController?.destroy(); parkController=null;
  letterPad?.destroy(); letterPad = null;
  clockSchool?.destroy(); clockSchool = null;
  applyPreferences();
  document.body.classList.toggle('playing', view === 'game');
  if (view === 'journey') renderJourney();
  else if (view === 'learning-hub') renderLearningHub();
  else if (view === 'park') renderPark();
  else if (view === 'journey-complete') renderJourneyComplete();
  else if (view === 'game') { renderGame(); restoreQuestionState(); }
  else if (view === 'clock-school') renderClockSchool();
  else if (view === 'letters-lesson') renderLetterLesson();
  else if (view === 'letters-menu') renderLetterMenu();
  else if (view === 'letters-writing') renderLetterWriting();
  else if (view === 'letters-recognition') renderLetterRecognition();
  else if (view === 'reading-levels') renderReadingLevels();
  else if (view === 'characters-menu') app.innerHTML = header() + characterMenu(settings, characterPractice) + footer();
  else if (view === 'complete') renderComplete();
  else if (view === 'album') renderAlbum();
  else renderHome();
}

function focusTitle() {
  window.scrollTo({ top: 0, behavior: 'auto' });
  document.querySelector('main h1')?.focus({ preventScroll: true });
}

function startMission(mission, skipLesson = false) {
  if (mission === 'characters' && !skipLesson) { openCharacters(); return; }
  if (['hebrew','english','math'].includes(mission) && !skipLesson) { openLearningHub(mission); return; }
  if (mission === 'clock' && !skipLesson) { openClockLesson(); return; }
  if (mission === 'letters' && !skipLesson) { openLetterMenu(); return; }
  narrator.stop();
  checkpoint();
  const key=roundKey(mission,settings), restored=unpackRound(drafts[key]);
  if(restored){round=restored;view='game';render();focusTitle();return;}
  const letterIds = mission === 'letters' ? recognitionGroup().map(letter => letter.id) : null;
  const questions = createSession(mission, { ...settings, learning:learner.items, readingRecent: readingPractice.recent[settings.reading], letterPractice: progress.letterPractice, letterIds, characterPractice });
  round = { id:crypto.randomUUID(), key, observed:new Set(), mission, questions, letterIds, letterLanguage: settings.letterLanguage, reading: settings.reading, clockLevel: settings.clockLevel, characterLevel: settings.characterLevel, characterMode: settings.characterMode, index: 0, resolved: false, attempted: new Set(), counted: new Set(), helped: new Set(questions.flatMap((q, i) => q.showModel ? [i] : [])), sticker: null, awarded: false };
  view = 'game'; checkpoint();
  render();
  focusTitle();
  const q = current();
  announcements.say(['good-luck', ...(mission === 'characters' ? round.characterMode === 'mixed' ? ['characters-intro', q.prompt] : [q.prompt] : mission === 'hebrew' ? [READING_LEVELS[round.reading].clip, q.prompt] : [mission === 'letters' ? q.prompt : MISSIONS[mission].intro]), ...(q.showModel ? ['letters-recognition-hint'] : []), ...(q.targetClip ? [q.targetClip] : [])]);
}

function recommended() {
  const due=learningSummary(learner.items).review[0];
  if(due){if(due.startsWith('workshop:')){openLearningHub('hebrew');return;}if(due.startsWith('english:')){openLearningHub('english');return;}if(due.startsWith('objects:')){openLearningHub('math');return;}}
  const next = Object.keys(MISSIONS).reduce((a, b) => activityCount(a) <= activityCount(b) ? a : b);
  startMission(next);
}

function leaveTo(destination) {
  narrator.stop();
  checkpoint();
  const leave = () => { journeyPlan=null; round = null; recognitionChoice = null; view = destination; render(); focusTitle(); announcements.say(destination === 'characters-menu' ? characterMenuClip() : destination === 'letters-menu' ? 'letters-paths' : destination === 'reading-levels' ? 'reading-levels' : destination === 'home' ? 'choose-activity' : 'stickers'); };
  if (view !== 'game') { leave(); return; }
  openDialog(`<h2 id="parent-title">${destination === 'characters-menu' ? 'נחזור לבחירת החברים?' : destination === 'letters-menu' ? 'נחזור למסלולי האותיות?' : destination === 'reading-levels' ? 'נבחר שלב אחר?' : 'נחזור לבית החברים?'}</h2><p>ההרפתקה נשמרת. אפשר להמשיך מאותו צעד כשחוזרים, או לבחור משחק אחר.</p><div class="dialog-actions"><button class="primary-button" data-dialog="stay">ממשיכות לשחק</button><button class="secondary-button" data-dialog="leave">${destination === 'characters-menu' ? 'לבחירת החברים' : destination === 'letters-menu' ? 'למסלולי האותיות' : destination === 'reading-levels' ? 'בוחרות שלב' : 'חוזרות הביתה'}</button></div>`);
  dialog.querySelector('[data-dialog="stay"]').onclick = closeDialog;
  dialog.querySelector('[data-dialog="leave"]').onclick = () => { closeDialog(); leave(); };
}

function replay() {
  if (!settings.sound) { settings.sound = true; save(); narrator.enabled = true; renderSoundButton(); }
  if(view==='journey'){journeyController?.replay();return;}
  if(view==='park'){clockSpeak('journey-park-intro');return;}
  if (view === 'clock-school') { clockSchool.replay(true); return; }
  if (view === 'game') {
    const q = current();
    announcements.say([q.prompt, ...(q.targetClip ? [q.targetClip] : [])]);
  } else announcements.say(view === 'characters-menu' ? characterMenuClip() : view === 'reading-levels' ? 'reading-levels' : view === 'letters-menu' ? 'letters-paths' : view === 'letters-writing' ? `letters-writing-forms-${settings.letterLanguage}` : view === 'letters-recognition' ? 'letters-recognition' : view === 'letters-lesson' ? letterNarration() : view === 'clock-lesson' ? 'intro-clock' : view === 'album' ? 'stickers' : 'welcome');
}

function renderSoundButton() {
  const button = document.querySelector('.sound-toggle');
  if (button) { button.innerHTML = uiIcon(settings.sound ? 'sound' : 'muted'); button.setAttribute('aria-pressed', String(settings.sound)); button.setAttribute('aria-label', settings.sound ? 'כיבוי הקול' : 'הפעלת הקול'); }
}

function hint() {
  if (round.resolved) return;
  const q = current();
  round.helped.add(round.index); checkpoint();
  if (q.type === 'character') {
    document.querySelector('#feedback').textContent = 'נשמע את השם ביחד, ונמשיך לנסות ♡';
    announcements.say([q.hint, q.character.clip]); return;
  }
  if (q.type === 'letter') {
    document.querySelector('#letter-recognition-model').hidden = false;
    document.querySelector('#feedback').textContent = 'זו אותה אות. נסתכל על הצורה שלה ונמצא אותה למטה.';
    announcements.say(['letters-recognition-hint', q.targetClip]); return;
  }
  if (q.type === 'clock') {
    document.querySelector('#feedback').textContent = q.time.minute === 0 ? 'נתחיל מהמחוג הקצר והסגול. על איזה מספר הוא מצביע?' : 'נבדוק את המחוג הארוך, ואז נסתכל על המחוג הקצר.';
    const face = document.querySelector('.clock-question-clock .analog-clock');
    face.classList.remove('highlight-hour', 'highlight-minute'); face.classList.add(q.time.minute === 0 ? 'highlight-hour' : 'highlight-minute');
    announcements.say(q.hint); return;
  }
  document.querySelector('#feedback').textContent = q.type === 'read' ? 'נשמע מה כתוב, ואז נחפש את התמונה.' : q.type === 'listen' ? 'נקשיב שוב לאט. איזו תמונה מתאימה?' : 'געי בפריטים אחד־אחד. נמשיך לספור יחד.';
  announcements.say([q.hint, ...(q.type === 'read' ? [`he-${q.word.id}`] : q.targetClip ? [q.targetClip] : [])], { slow: true });
}

function tally(button) {
  if (round.resolved || round.counted.has(button.dataset.token)) return;
  round.counted.add(button.dataset.token);
  button.classList.add('counted');
  button.querySelector('.count-bubble').textContent = round.counted.size;
  button.setAttribute('aria-label', `נספר: ${round.counted.size}`);
  button.setAttribute('aria-disabled', 'true');
  checkpoint();
  announcements.say(`number-${round.counted.size}`);
}

function answer(button) {
  if (round.resolved || round.attempted.has(button.dataset.answer)) return;
  const q = current();
  const feedback = document.querySelector('#feedback');
  if (button.dataset.answer !== q.answer) {
    round.attempted.add(button.dataset.answer);
    round.helped.add(round.index);
    button.classList.add('try-again');
    button.disabled = true;
    feedback.textContent = 'נסי שוב, אריאל. אני כאן איתך ♡';
    checkpoint(); announcements.say('try-again');
    return;
  }
  round.resolved = true;
  if (!round.observed.has(round.index)) { learner.record({...questionLearning(q),eventId:`${round.id}:${round.index}`},round.helped.has(round.index)?'helped':'independent'); round.observed.add(round.index); }
  checkpoint();
  button.classList.add('correct');
  for (const option of document.querySelectorAll('.answer-button')) option.disabled = true;
  document.querySelector('.hint-button').hidden = true;
  const lessonLink = document.querySelector('[data-action="clock-learn"]');
  if (lessonLink) lessonLink.disabled = true;
  const next = document.querySelector('.next-button');
  next.hidden = false;
  if (lastQuestion()) next.innerHTML = `למדבקה שלי ${uiIcon('arrow')}`;
  const answerText = q.type === 'character' ? characterName(q.character, settings.nikud) : q.type === 'letter' ? q.letter.familiar : q.type === 'clock' ? `השעה ${q.time.he}` : q.type === 'read' ? wordText(q.word) : q.type === 'listen' ? q.target.en : `${q.total}`;
  feedback.innerHTML = `${uiIcon('check')} <span>כל הכבוד! <b ${q.type === 'listen' ? 'lang="en" dir="ltr"' : ''}>${answerText}</b></span>`;
  feedback.classList.add('success');
  if(q.type==='letter')document.querySelector('#letter-success-examples').innerHTML=letterExampleCards(q.letter,settings.nikud);
  document.querySelector('.buddy-bar').classList.add('celebrating');
  document.querySelector('#buddy-message').textContent = 'יש! הצלחת!';
  announcements.say([`correct-${1 + round.index % 3}`, ...(q.type === 'character' ? [q.character.clip] : q.type === 'clock' ? q.time.clips : q.type === 'read' ? [`he-${q.word.id}`] : q.targetClip ? [q.targetClip] : [])]);
  narrator.chime();
  celebrate(16);
  next.focus({ preventScroll: q.type !== 'character' && q.type !== 'clock' && !(q.type === 'read' && q.word.scene) });
}

function nextQuestion() {
  if (!round?.resolved) return;
  if (lastQuestion()) {
    const length = round.questions.length;
    if (!round.awarded) {
      const letterRound = round.mission === 'letters' ? { language: round.letterLanguage, ids: round.letterIds } : null;
      const result = awardRound(round.mission, round.helped.size, letterRound, round.id, length);
      progress = result.progress;
      round.sticker = result.sticker;
      round.awarded = true;
      delete drafts[round.key];
      if (round.mission === 'hebrew') readingPractice = finishReadingPractice(readingPractice, round.reading, round.questions.map(q => q.word));
      if (round.mission === 'characters') characterPractice = finishCharacterPractice(characterPractice, round.characterLevel, round.questions);
      if (round.mission === 'letters') recognitionChoice = null;
      save();
    }
    view = 'complete'; render(); focusTitle(); celebrate(40); announcements.say([round.sticker ? 'complete' : 'complete-all', ...(round.mission === 'hebrew' ? [nextReadingStage(round.reading, round.helped.size) ? 'reading-next' : 'reading-more'] : round.mission === 'characters' && nextCharacterLevel(round.characterLevel, round.helped.size) ? ['reading-next'] : [])]); return;
  }
  round.index++;
  round.resolved = false;
  round.attempted = new Set();
  round.counted = new Set();
  checkpoint(); render(); focusTitle();
  const q = current();
  announcements.say([q.prompt, ...(q.showModel ? ['letters-recognition-hint'] : []), ...(q.targetClip ? [q.targetClip] : [])]);
}

function celebrate(amount) {
  if (!settings.motion || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const holder = document.querySelector('#confetti');
  const colors = ['#f2c76b', '#a99aca', '#76b8aa', '#e59eaa', '#8fbfda'];
  for (let i = 0; i < amount; i++) {
    const confetto = document.createElement('i');
    confetto.style.cssText = `left:${Math.random() * 100}%;background:${colors[i % colors.length]};--delay:${Math.random() * 0.3}s;--spin:${Math.random() * 720}deg;--drift:${(Math.random() - 0.5) * 220}px;`;
    holder.append(confetto);
    confetto.addEventListener('animationend', () => confetto.remove(), { once: true });
  }
}

function openDialog(content) {
  if (!dialog.open) dialogOpener = document.activeElement;
  dialog.innerHTML = `<button class="dialog-close circle-button" aria-label="סגירה" data-dialog="close">${uiIcon('close')}</button>${content}`;
  dialog.querySelector('[data-dialog="close"]').onclick = closeDialog;
  if (!dialog.open) dialog.showModal();
}

function closeDialog() {
  const action = dialogOpener?.dataset?.action;
  dialog.close();
  if (view !== 'game') {
    render();
    if (action) app.querySelector(`[data-action="${action}"]`)?.focus();
  } else dialogOpener?.focus?.();
}

function parentGate() {
  narrator.stop();
  openDialog(`<span class="section-kicker">רגע קטן להורים</span><h2 id="parent-title">פינת ההורים</h2><p>כדי לפתוח את ההגדרות, מה התוצאה?</p><form id="parent-gate"><label class="gate-label" for="gate-answer"><span dir="ltr">7 × 3 = ?</span></label><input id="gate-answer" name="answer" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-label="תשובה לחידה" required><p id="gate-error" role="status"></p><button class="primary-button" type="submit">כניסה</button></form>`);
  dialog.querySelector('form').onsubmit = event => {
    event.preventDefault();
    if (dialog.querySelector('input').value.trim() === '21') renderSettings();
    else dialog.querySelector('#gate-error').textContent = 'נסו שוב, או בקשו עזרה מהורה.';
  };
  dialog.querySelector('input').focus();
}

function renderSettings() {
  openDialog(`<span class="section-kicker">מתאימות את ההרפתקה</span><h2 id="parent-title">פינת ההורים</h2><form id="settings-form">
    <label class="setting-toggle"><span><b>ניקוד בעברית</b><small>ברירת המחדל: מילים מנוקדות</small></span><input name="nikud" type="checkbox" ${settings.nikud ? 'checked' : ''}></label>
    <label class="setting-row"><span>מילים בעברית</span><select name="reading">${Object.entries(READING_LEVELS).map(([key, stage]) => `<option value="${key}" ${settings.reading === key ? 'selected' : ''}>${stage.number ? `שלב ${stage.number}: ` : ''}${stage.name} · ${stage.range}</option>`).join('')}</select></label>
    <label class="setting-row"><span>ספירה וחיבור עד</span><select name="mathMax">${[5, 10, 20].map(n => `<option value="${n}" ${settings.mathMax === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="setting-row"><span>מספרים באנגלית עד</span><select name="englishMax">${[10, 20].map(n => `<option value="${n}" ${settings.englishMax === n ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
    <label class="setting-row"><span>קריאת שעון</span><select name="clockLevel">${Object.entries(CLOCK_LEVELS).map(([key, level]) => `<option value="${key}" ${settings.clockLevel === key ? 'selected' : ''}>${level.name}</option>`).join('')}</select></label>
    <label class="setting-toggle"><span><b>קול והנחיות</b><small>הקלטות בעברית ובאנגלית</small></span><input name="sound" type="checkbox" ${settings.sound ? 'checked' : ''}></label>
    <label class="setting-toggle"><span><b>תנועה וחגיגות</b><small>כיבוי מצמצם אנימציות</small></span><input name="motion" type="checkbox" ${settings.motion ? 'checked' : ''}></label>
    <p class="parent-note">ההגדרות ייכנסו לתוקף בהרפתקה הבאה. האנגלית מבוססת על הקשבה ותמונות. מילים כתובות מוצגות באותיות גדולות בלבד.</p>
    <button class="primary-button" type="submit">שמירת ההגדרות ${uiIcon('check')}</button></form>
    <section class="parent-progress"><h3>מה כבר גילינו?</h3><p id="parent-progress-summary">${progress.sessions} הרפתקאות שלמות · ${progress.stickers.length} מדבקות</p><table><thead><tr><th>תחום</th><th>תשובות ללא עזרה</th><th>עם הדגמה, רמז או ניסיון נוסף</th></tr></thead><tbody>${MISSION_IDS.map(id => MISSIONS[id]).map(m => `<tr><th>${m.id === 'hebrew' ? 'עברית · מילים ושמות' : m.subject}</th><td data-independent="${m.id}">${progress.skills[m.id].correct - progress.skills[m.id].assisted}</td><td data-assisted="${m.id}">${progress.skills[m.id].assisted}</td></tr>`).join('')}</tbody></table><p class="parent-note">מוצגות רק הרפתקאות שהושלמו. זהו תיעוד משחק, ולא מבחן או הערכת יכולת.</p></section>
    <div id="learning-parent">${parentLearning(learner)}</div>
    <section id="family-panel"></section><p class="parent-note character-art-credit">איורי הדמויות: PAW Patrol / Rubble &amp; Crew © Spin Master Ltd. · <a href="https://dev.pawpatrol.com/character-guide" target="_blank" rel="noopener noreferrer">מדריך הדמויות הרשמי של מפרץ ההרפתקאות</a> · <a href="https://images.squarespace-cdn.com/content/v1/5595e2eee4b0b03840079b28/1685761053151-FY46DCUKCA43ODFF4MKK/image-asset.jpeg" target="_blank" rel="noopener noreferrer">McCown Design Agency</a>. משחק השמות נכלל בתחום עברית.</p>
    <p class="privacy-note">אפשר לשחק במכשיר הזה ולחבר אותו לאלבום המשפחתי של אריאל בכל עת. כשמחברים את האלבום נשמרים בו המדבקות, ההתקדמות, היסטוריית הלמידה והפארק. הרפתקאות פתוחות וציורי תרגול נשמרים במכשיר. שמרו את הקוד כדי לחבר מכשיר נוסף לאותו אלבום.</p>
    <p class="parent-note">איורים נוספים: <a href="assets/Twemoji-LICENSE.txt" target="_blank" rel="noopener">Twemoji · רישיון ושמות היוצרים</a>. כל התמונות שמורות בתוך המשחק.</p>
    <p class="save-notice" ${storageAvailable ? 'hidden' : ''}>הדפדפן לא מאפשר שמירה כרגע. אפשר לשחק, אבל ההתקדמות עלולה להיעלם בסגירה.</p>
    <button class="text-button reset-button" data-dialog="reset">${album.linked ? 'ניתוק מהאלבום ואיפוס המכשיר הזה' : 'איפוס ההתקדמות במכשיר הזה'}</button>`);
  function refreshLearning(){void Promise.all([album.flush(),learner.flush()]).then(()=>{const panel=dialog.querySelector('#learning-parent');if(panel){panel.innerHTML=parentLearning(learner);panel.querySelector('[data-learning-refresh]').onclick=refreshLearning;}});}
  dialog.querySelector('[data-learning-refresh]').onclick=refreshLearning;
  mountFamilyPanel(dialog.querySelector('#family-panel'), {
    album, getLocalProgress: () => progress, pendingCode: pendingJoinCode,
    onPaired: () => { pendingJoinCode = null; },
  });
  dialog.querySelector('#settings-form').onsubmit = event => {
    event.preventDefault();
    const form = new FormData(event.target);
    settings = sanitizeSettings({ ...settings, nikud: form.has('nikud'), sound: form.has('sound'), motion: form.has('motion'), reading: form.get('reading'), mathMax: Number(form.get('mathMax')), englishMax: Number(form.get('englishMax')), clockLevel: form.get('clockLevel'), letterLanguage: settings.letterLanguage, letterWriting: settings.letterWriting });
    save(); narrator.stop(); applyPreferences(); closeDialog();
    // Keep a running question and its answer state intact until the next round.
    if (view === 'game') renderSoundButton(); else render();
  };
  dialog.querySelector('[data-dialog="reset"]').onclick = () => {
    openDialog(`<h2 id="parent-title">לאפס את המכשיר הזה?</h2><p>המדבקות וההתקדמות בדפדפן הזה יימחקו. הגדרות המשחק יישמרו.${album.linked ? ' החיבור לאלבום המשפחתי יוסר. האלבום שכבר סונכרן יישמר עבור המכשירים האחרים.' : ''}</p><div class="dialog-actions"><button class="secondary-button" data-dialog="cancel-reset">ביטול</button><button class="primary-button" data-dialog="confirm-reset">איפוס ההתקדמות</button></div>`);
    dialog.querySelector('[data-dialog="cancel-reset"]').onclick = renderSettings;
    dialog.querySelector('[data-dialog="confirm-reset"]').onclick = () => { if (album.linked) album.disconnect(); learner.reset(); drafts={};journeyDrafts={};awardedRounds=[];writingPractice={mode:'trace',drafts:{}}; progress = freshProgress(); readingPractice = sanitizeReadingPractice(null); characterPractice = sanitizeCharacterPractice(null); save(); round = null; view = 'home'; render(); renderSettings(); };
  };
}

function updateParentProgress() {
  const summary = dialog.querySelector('#parent-progress-summary');
  if (summary) summary.textContent = `${progress.sessions} הרפתקאות שלמות · ${progress.stickers.length} מדבקות`;
  for (const mission of MISSION_IDS) {
    const independent = dialog.querySelector(`[data-independent="${mission}"]`);
    const assisted = dialog.querySelector(`[data-assisted="${mission}"]`);
    if (independent) independent.textContent = progress.skills[mission].correct - progress.skills[mission].assisted;
    if (assisted) assisted.textContent = progress.skills[mission].assisted;
  }
}

function checkpoint(){
  if(view==='game'&&round&&!round.awarded){round.at=Date.now();drafts[round.key]=packRound(round);}
  if(view==='journey'&&journeyPlan)journeyDrafts[`${journeyPlan.mode}:${journeyPlan.level}`]=journeyPlan;
  save();
}
function awardRound(mission,helped,letters,id,length){
  if (album.linked) return album.complete(mission, helped, letters, id, length);
  if(awardedRounds.includes(id))return {progress,sticker:null};
  const result=finishSession(progress,mission,helped,letters,length);awardedRounds=[...awardedRounds,id].slice(-10000);return result;
}
function latestDraft(){return [...Object.values(drafts).map(d=>({kind:'classic',value:d,at:d.at})),...Object.values(journeyDrafts).map(d=>({kind:'journey',value:d,at:d.at}))].sort((a,b)=>b.at-a.at)[0];}
function resumeCard(){
  const draft=latestDraft();if(!draft)return '';
  const name=draft.kind==='journey'?JOURNEYS[draft.value.mode].title:MISSIONS[draft.value.mission].name;
  const length = draft.kind === 'journey' ? journeyLength(draft.value) : draft.value.questions.length;
  return `<section class="resume-card"><span>${uiIcon('again')}</span><div><strong>מַמְשִׁיכִים מֵאֵיפֹה שֶׁעָצַרְנוּ?</strong><small>${name} · צַעַד ${draft.value.index+1} מִתּוֹךְ ${length}</small></div><button class="primary-button" data-action="resume">מַמְשִׁיכִים ${uiIcon('arrow')}</button></section>`;
}
function resumeLatest(){
  const draft=latestDraft();if(!draft)return;
  narrator.stop();
  if(draft.kind==='classic'){const restored=unpackRound(draft.value);if(!restored)return;round=restored;view='game';}
  else {journeyPlan=resumeJourney(draft.value);if(!journeyPlan)return;round=null;view='journey';}
  render();focusTitle();
}
function restoreQuestionState(){
  if(!round)return;
  const q=current();
  for(const b of document.querySelectorAll('[data-action="tally"]')){
    if(round.counted.has(b.dataset.token)){b.classList.add('counted');b.setAttribute('aria-disabled','true');b.querySelector('.count-bubble').textContent=[...round.counted].indexOf(b.dataset.token)+1;}
  }
  if(round.helped.has(round.index)&&q.type==='letter')document.querySelector('#letter-recognition-model').hidden=false;
  if(!round.resolved)return;
  for(const b of document.querySelectorAll('.answer-button')){b.disabled=true;if(b.dataset.answer===q.answer)b.classList.add('correct');}
  document.querySelector('.hint-button').hidden=true;
  const next=document.querySelector('.next-button');next.hidden=false;if(lastQuestion())next.innerHTML=`למדבקה שלי ${uiIcon('arrow')}`;
  const feedback=document.querySelector('#feedback');feedback.classList.add('success');feedback.textContent='כָּל הַכָּבוֹד! הַצַּעַד הַזֶּה כְּבָר הֻשְׁלַם.';
  const clockLink=document.querySelector('[data-action="clock-learn"]');if(clockLink)clockLink.disabled=true;
}
function openLearningHub(subject){checkpoint();narrator.stop();round=null;journeyPlan=null;hub=['hebrew','english','math'].includes(subject)?subject:'hebrew';view='learning-hub';render();focusTitle();announcements.say(hub==='english'?'journey-english-one':hub==='math'?'journey-count-all':'journey-workshop-intro');}
function journeyChoice(mode,level,label,description,icon,tag=''){
  const saved=journeyDrafts[`${mode}:${level}`];
  return `<button class="learning-path-card" data-action="journey-start" data-journey="${mode}" data-level="${level}"><span class="learning-path-art">${art(icon)}</span>${tag?`<small class="learning-path-tag">${tag}</small>`:''}<h2>${label}</h2><p>${description}</p><strong>${saved?`מַמְשִׁיכִים מִצַּעַד ${saved.index+1}`:`${SESSION_LENGTH} צְעָדִים · בַּקֶּצֶב שֶׁלָּנוּ`} ${uiIcon('arrow')}</strong></button>`;
}
function renderLearningHub(){
  const names={hebrew:'מַגְלִים מִלִּים וְסִפּוּרִים',english:'מִלָּה קְטַנָּה, הַצְלָחָה גְּדוֹלָה',math:'מַעְבֶּדֶת הַמִּסְפָּרִים'};
  let cards='';
  if(hub==='hebrew')cards=`<button class="learning-path-card" data-action="garden"><span class="learning-path-art">${art('flower')}</span><h2>גִּנַּת הַמִּלִּים</h2><p>כָּל שִׁלְבֵי הַקְּרִיאָה הַמֻּכָּרִים</p><strong>בּוֹחֲרִים שָׁלָב ${uiIcon('arrow')}</strong></button>`+
    [1,2,3,4].map(level=>journeyChoice('workshop',level,`סַדְנַת מִלִּים · ${level}`,['חֲלָקִים קְטַנִּים וּמִלִּים מֻכָּרוֹת','מִלִּים אֲרֻכּוֹת יוֹתֵר','עוֹד אוֹתִיּוֹת וְצֵרוּפִים','אֶתְגָּר לְבוֹנֵי מִלִּים'][level-1],'pencil',level===1?'מַתְחִילִים כָּאן':'')).join('')+
    STORIES.map(story=>journeyChoice('stories',story.id,story.title,story.description,'house','סִפּוּר שֶׁמְּשַׂחֲקִים')).join('');
  if(hub==='english'){
    const ready=englishPairsReady(learner.items);
    cards=journeyChoice('english','single','מִלָּה אַחַת בְּכָל פַּעַם','תְּמוּנוֹת מֻכָּרוֹת, שְׁתֵּי אֶפְשָׁרֻיּוֹת, וּמִלָּה חֲדָשָׁה אַחַת.','dog','הַמַּסְלוּל הַמֻּמְלָץ עַכְשָׁו')+
      journeyChoice('english','pairs','צֶבַע וְכַדּוּר','קֹדֶם נַכִּיר אֶת הַמִּלָּה כַּדּוּר. נְחַבֵּר לְצֶבַע מֻכָּר בִּצְעָדִים קְטַנִּים.','ball',ready?'מוּכָנִים לְצַעַד הַבָּא':'לְאַחַר הַרְבֵּה הַצְלָחוֹת בְּמִלָּה אַחַת')+
      `<button class="learning-path-card" data-action="mission-direct" data-mission="english"><span class="learning-path-art">${art('star')}</span><h2>מִלִּים, צְבָעִים וּמִסְפָּרִים</h2><p>הַמִּשְׂחָק הַמֻּכָּר שֶׁל הַקְשָׁבָה לְמִלָּה אַחַת</p></button>`+
      journeyChoice('english','cars','צֶבַע וּמְכוֹנִית','עוֹד חֵפֶץ אֶחָד. קֹדֶם מַכִּירִים אוֹתוֹ לְבַד, וְאָז מְחַבְּרִים לְצֶבַע.','car','אַחֲרֵי הַכַּדּוּר · רַק כְּשֶׁמוּכָנִים')+
      journeyChoice('sounds','sounds','מַגְלִים צְלִילִים','אוֹת גְּדוֹלָה, אוֹת קְטַנָּה וְצָלִיל בְּתוֹךְ מִלָּה.','bird','מַסְלוּל בְּחִירָה · בְּעֶזְרַת הוֹרֶה')+
      journeyChoice('sounds','blend','מְחַבְּרִים צְלִילִים','רַק כְּשֶׁמוּכָנִים: מִלִּים קְצָרוֹת מִצְּלִילִים מֻכָּרִים.','fish','לְאַחַר מַסְלוּל הַצְּלִילִים');
  }
  if(hub==='math')cards=journeyChoice('objects','quantity','בּוֹנִים כַּמּוּיוֹת','תַּפּוּחַ אַחַד לְכָל מָקוֹם. מַגְלִים עֶשֶׂרֶת.','apple','מַתְחִילִים בַּמֻּכָּר')+
    journeyChoice('objects','bonds','כַּמָּה חֲסֵרִים?','מַשְׁלִימִים קְבוּצָה וּמְגַלִּים חִבּוּר.','flower')+
    journeyChoice('objects','tens','עֲשָׂרוֹת וִיחִידוֹת','כָּל מוֹט הוּא עֶשֶׂר יְחִידוֹת. בּוֹנִים עַד 100.','house')+
    journeyChoice('objects','takeaway','נוֹתְנִים לַחֲבֵרִים','חִסּוּר רִאשׁוֹן בִּתְמוּנוֹת: כַּמָּה נִשְׁאַר?','berry','מַסְלוּל בְּחִירָה · אֶפְשָׁר לְנַסּוֹת יַחַד')+
    `<button class="learning-path-card" data-action="mission-direct" data-mission="math"><span class="learning-path-art">${art('star')}</span><h2>סוֹפְרִים וּמְחַבְּרִים</h2><p>מַמְשִׁיכִים בַּמִּשְׂחָק הַמֻּכָּר</p></button>`;
  app.innerHTML=`${header()}<main id="main" class="learning-hub"><button class="text-button" data-action="home">${uiIcon('home')} לְבֵית הַחֲבֵרִים</button><section class="learning-hub-heading"><div><span class="section-kicker">בּוֹחֲרִים אֵיךְ לְגַלּוֹת הַיּוֹם</span><h1 tabindex="-1">${names[hub]}</h1><p>${hub==='english'?'לֹא צָרִיךְ לָדַעַת לִקְרֹא בְּאַנְגְּלִית. מַקְשִׁיבִים, נוֹגְעִים וּמַצְלִיחִים.':'כָּל הַדְּרָכִים פְּתוּחוֹת. מַתְחִילִים יַחַד, וּמַמְשִׁיכִים בַּקֶּצֶב שֶׁלָּנוּ.'}</p></div>${pup(hub==='math'?'tofi':hub==='english'?'bobi':'luli')}</section><div class="learning-paths">${cards}</div></main>${footer()}`;
}
function startJourney(mode,level){
  if(!JOURNEYS[mode])return;checkpoint();narrator.stop();round=null;
  const key=`${mode}:${level}`;journeyPlan=resumeJourney(journeyDrafts[key])||newJourney(mode,level,learner.items,{mathMax:settings.mathMax});view='journey';checkpoint();render();focusTitle();
  if(mode!=='stories'||adventurePhase(journeyPlan.index, journeyLength(journeyPlan))==='warmup')journeyController.replay(false, journeyPlan.index === 0);
}
function renderJourney(){
  app.innerHTML=`${header()}<main id="main" class="journey-page"><div id="journey-root"></div></main>${footer()}`;
  journeyController=mountJourney(document.querySelector('#journey-root'),{plan:journeyPlan,nikud:settings.nikud,speak:(keys,explicit=false)=>explicit?clockSpeak(keys):announcements.say(keys),
    onSave:plan=>{journeyDrafts[`${plan.mode}:${plan.level}`]=plan;save();},
    onObservation:(info,kind)=>learner.record({...info,eventId:`${journeyPlan.id}:${info.exposure?'seen:':''}${journeyPlan.index}`},kind),
    onHome:()=>{checkpoint();view='home';journeyPlan=null;render();focusTitle();},
    onComplete:plan=>{
      const result=awardRound(JOURNEYS[plan.mode].domain,plan.helped.length,null,plan.id,journeyLength(plan));
      progress=result.progress;plan.sticker=result.sticker;delete journeyDrafts[`${plan.mode}:${plan.level}`];view='journey-complete';save();render();focusTitle();celebrate(32);announcements.say('complete');
    }
  });
}
function renderJourneyComplete(){
  const plan=journeyPlan;
  app.innerHTML=`${header()}<main id="main" class="journey-complete"><div class="journey-complete-art">${pup('luli')}${art(plan?.sticker||'star')}</div><h1 tabindex="-1">כָּל הַכָּבוֹד! עוֹד הַרְפַּתְקָה שְׁלֵמָה!</h1><p>הַמַּדְבֵּקָה וְהַלְּמִידָה שְׁמוּרוֹת. אֶפְשָׁר לָצֵאת לְהַפְסָקָה אוֹ לְשַׂחֵק בַּפָּארְק.</p><div class="journey-controls"><button class="primary-button" data-action="park">לַפָּארְק שֶׁלִּי ${uiIcon('arrow')}</button><button class="secondary-button" data-action="learning-hub" data-hub="${plan?JOURNEYS[plan.mode].domain:'hebrew'}">עוֹד גִּלּוּי קָטָן</button><button class="text-button" data-action="home">לְבֵית הַחֲבֵרִים</button></div></main>${footer()}`;
}
function renderPark(){
  app.innerHTML=`${header()}<main id="main" class="park-page"><div id="park-root"></div></main>${footer()}`;
  parkController=mountPark(document.querySelector('#park-root'),{learner,stickers:progress.stickers.length,name:ARIEL.name,speak:keys=>announcements.say(keys),onHome:()=>{view='home';render();focusTitle();}});
}


app.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) {
    if (view === 'home' && !dialog.open && announcements.welcomePending && audioStatus !== 'speaking') void announcements.say('welcome');
    return;
  }
  if (button.disabled) return;
  switch (button.dataset.action) {
    case 'home': leaveTo('home'); break;
    case 'guide': narrator.stop(); openGameGuide(button); break;
    case 'learning-hub': openLearningHub(button.dataset.hub); break;
    case 'garden': openReadingLevels(); break;
    case 'mission-direct': startMission(button.dataset.mission,true); break;
    case 'journey-start': startJourney(button.dataset.journey,button.dataset.level); break;
    case 'resume': resumeLatest(); break;
    case 'park': checkpoint();round=null;journeyPlan=null;view='park';render();focusTitle();break;
    case 'writing-step': if(Object.hasOwn(WRITING_STEPS,button.dataset.step)){writingPractice.mode=button.dataset.step;letterDemo.recorded=false;save();render();if(writingPractice.mode!=='trace')announcements.say(writingPractice.mode==='paper'?'journey-paper':writingPractice.mode==='copy'?'journey-copy-letters':'journey-memory-letters');}break;
    case 'name-letter': selectLetter(Number(button.dataset.index));break;
    case 'album': albumPageIndex = null; if (view === 'game') leaveTo('album'); else { narrator.stop(); view = 'album'; render(); focusTitle(); announcements.say('stickers'); } break;
    case 'album-page': turnAlbumPage(Number(button.dataset.page)); break;
    case 'album-latest': turnAlbumPage(null); break;
    case 'mission': startMission(button.dataset.mission); break;
    case 'reading-levels': if (view === 'game') leaveTo('reading-levels'); else openReadingLevels(); break;
    case 'reading-level': if (Object.hasOwn(READING_LEVELS, button.dataset.level)) { settings.reading = button.dataset.level; save(); startMission('hebrew', true); } break;
    case 'reading-stage-sound': if (Object.hasOwn(READING_LEVELS, button.dataset.level)) clockSpeak(READING_LEVELS[button.dataset.level].clip); break;
    case 'characters-menu': if (view === 'game') leaveTo('characters-menu'); else openCharacters(); break;
    case 'character-collection': if (Object.hasOwn(CHARACTER_COLLECTIONS, button.dataset.collection)) { Object.assign(settings, selectCharacterLevel(settings, settings.characterCollectionLevels[button.dataset.collection])); save(); render(); document.querySelector(`[data-action="character-collection"][data-collection="${button.dataset.collection}"]`)?.focus({ preventScroll: true }); announcements.say(characterMenuClip()); } break;
    case 'character-mode': if (Object.hasOwn(CHARACTER_MODES, button.dataset.mode)) { settings.characterMode = button.dataset.mode; save(); render(); document.querySelector(`[data-action="character-mode"][data-mode="${settings.characterMode}"]`)?.focus({ preventScroll: true }); announcements.say(settings.characterMode === 'mixed' ? 'characters-intro' : `characters-${settings.characterMode}`); } break;
    case 'character-level': if (Object.hasOwn(CHARACTER_LEVELS, button.dataset.level)) { Object.assign(settings, selectCharacterLevel(settings, button.dataset.level)); save(); render(); document.querySelector(`[data-action="character-level"][data-level="${settings.characterLevel}"]`)?.focus({ preventScroll: true }); announcements.say(CHARACTER_LEVELS[settings.characterLevel].clip); } break;
    case 'character-start': startMission('characters', true); break;
    case 'character-sound': { const character = CHARACTERS.find(c => c.id === button.dataset.character); if (character) clockSpeak(character.clip); break; }
    case 'character-advance': if (Object.hasOwn(CHARACTER_LEVELS, button.dataset.level)) { Object.assign(settings, selectCharacterLevel(settings, button.dataset.level)); settings.characterMode = round.characterMode; save(); startMission('characters', true); } break;
    case 'character-repeat': Object.assign(settings, selectCharacterLevel(settings, round.characterLevel)); settings.characterMode = round.characterMode; save(); startMission('characters', true); break;
    case 'recommended': recommended(); break;
    case 'welcome': welcome(); break;
    case 'replay': replay(); break;
    case 'listen-word': if (!settings.sound) { settings.sound = true; narrator.enabled = true; save(); renderSoundButton(); } announcements.say(current().targetClip); break;
    case 'clock-practice': if (clockReturn && round) { view = 'game'; render(); focusTitle(); replay(); } else startMission('clock', true); break;
    case 'clock-learn': if (!round.resolved) openClockLesson(true); break;
    case 'clock-option-audio': clockSpeak(button.dataset.clips.split(' ')); break;
    case 'letters-menu': if (view === 'game') leaveTo('letters-menu'); else openLetterMenu(); break;
    case 'letter-mode': openLetterMode(button.dataset.mode); break;
    case 'letter-language': if (Object.hasOwn(LETTERS, button.dataset.language)) { settings.letterLanguage = button.dataset.language; recognitionChoice = null; save(); if (view === 'letters-lesson') openLetterLesson(); else { render(); announcements.say(view === 'letters-writing' ? `letters-writing-forms-${settings.letterLanguage}` : view === 'letters-recognition' ? 'letters-recognition' : 'letters-paths'); } } break;
    case 'letter-form': if (WRITING_FORMS.includes(button.dataset.form)) openLetterLesson(button.dataset.form); break;
    case 'letter-select': selectLetter(Number(button.dataset.index)); break;
    case 'letter-previous': selectLetter(letterDemo.index - 1); break;
    case 'letter-next': selectLetter(letterDemo.index + 1); break;
    case 'letter-example': if(CLIPS[button.dataset.clip]) clockSpeak(button.dataset.clip); break;
    case 'letter-sound': clockSpeak(demoLetter().clip); break;
    case 'letter-demo': letterPad.demo(); announcements.say('letters-demo'); break;
    case 'letter-step': letterPad.step(); break;
    case 'letter-reset': letterPad.reset(); announcements.say('letters-trace'); break;
    case 'letter-practice': startMission('letters', true); break;
    case 'letter-recognition-auto': recognitionChoice = null; render(); focusTitle(); break;
    case 'letter-recognition-next': settings.letterLanguage = round.letterLanguage; recognitionChoice = null; startMission('letters', true); break;
    case 'letter-recognition-repeat': settings.letterLanguage = round.letterLanguage; recognitionChoice = [...round.letterIds]; startMission('letters', true); break;
    case 'letter-writing-continue': { const letter = nextWriting(letterDemo.language, letterDemo.form, letterDemo.index + 1, letterDemo.index); selectLetter(LETTERS[letterDemo.language].indexOf(letter)); break; }
    case 'hint': hint(); break;
    case 'answer': answer(button); break;
    case 'tally': tally(button); break;
    case 'next': nextQuestion(); break;
    case 'parents': parentGate(); break;
    case 'sound': settings.sound = !settings.sound; narrator.stop(); narrator.enabled = settings.sound; save(); renderSoundButton(); if (settings.sound) replay(); break;
    case 'break': checkpoint(); narrator.stop(); round = null; view = 'home'; render(); focusTitle(); announcements.say('break'); break;
  }
});

app.addEventListener('change', event => {
  if (event.target.matches('select[data-album-page]')) turnAlbumPage(Number(event.target.value));
});

dialog.addEventListener('click', event => { if (event.target === dialog && event.offsetX >= 0 && event.offsetX <= dialog.clientWidth && event.offsetY >= 0 && event.offsetY <= dialog.clientHeight) return; if (event.target === dialog) closeDialog(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) narrator.stop(); else { void album.flush();void learner.flush(); startOpeningWelcome(); } });
window.addEventListener('online', () => { void album.flush();void learner.flush(); });
window.addEventListener('hashchange', openAlbumInvite);
window.addEventListener('focus', () => { void album.flush();void learner.flush(); });
setInterval(() => { if (!document.hidden && album.linked) {void album.flush();void learner.flush();} }, 15000);
window.addEventListener('pagehide', () => { checkpoint(); narrator.stop(); });
render();
openAlbumInvite();
startOpeningWelcome();
if (album.linked) {void album.flush();void learner.flush();}

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* Online play remains available. */ });
}
