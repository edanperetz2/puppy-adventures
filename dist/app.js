import { MISSIONS, STICKERS, WORDS, READING_LEVELS } from './content.js';
import { DEFAULT_SETTINGS, SESSION_LENGTH, createSession, freshProgress, finishSession, sanitizeSettings, sanitizeProgress } from './engine.js';
import { ADVENTURE_PHASES } from './adventure.js';
import { art, pup, scene, uiIcon } from './art.js';
import { Narrator } from './audio.js';
import { GameAnnouncements } from './announcements.js';
import { SharedAlbum, normalizeCode } from './sync.js';
import { SYNC_CONFIG } from './sync-config.js';
import { mountFamilyPanel, updateFamilyStatus } from './family-ui.js';
import { analogClock, CLOCK_LEVELS } from './clock.js';
import { mountClockSchool } from './clock-school.js';
import { sanitizeClockPosition, recordClockLesson } from './clock-learning.js';
import { LETTERS, letterGroup, letterShape } from './letters.js';
import { mountLetterPad } from './letter-pad.js';
import { nextReadingStage, sanitizeReadingPractice, finishReadingPractice } from './reading.js';
import { stickerPage, stickerDefinition } from './stickers.js';
import { suggestedLetters, practicedLetterCount, recordLetters } from './letter-progress.js';

const app = document.querySelector('#app');
const dialog = document.querySelector('#parent-dialog');
const STORAGE_KEY = 'puppy-adventures-v1';
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
let letterDemo = { language: 'hebrew', index: 0, recorded: false };
let recognitionChoice = null;
let letterPad = null;
let lastTraceHint = 0;
let readingPractice = sanitizeReadingPractice(null);
let albumPageIndex = null;

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (saved) { settings = sanitizeSettings(saved.settings); progress = sanitizeProgress(saved.progress); readingPractice = sanitizeReadingPractice(saved.readingPractice); clockSchoolPosition = sanitizeClockPosition(saved.clockSchoolPosition); }
} catch { /* A corrupt or unavailable save must never prevent play. */ }

const pendingJoinCode = normalizeCode(new URLSearchParams(location.hash.slice(1)).get('album'));
if (pendingJoinCode) history.replaceState(null, '', location.pathname + location.search);
const album = new SharedAlbum({ config: SYNC_CONFIG, onChange: source => {
  if (!source.linked) return;
  const updated = source.progress;
  const changed = JSON.stringify(progress) !== JSON.stringify(updated);
  progress = updated;
  save();
  updateFamilyStatus(source);
  updateParentProgress();
  const reset = dialog.querySelector('[data-dialog="reset"]');
  if (reset) reset.textContent = 'ניתוק מהאלבום ואיפוס המכשיר הזה';
  if (changed && !dialog.open && ['home', 'album', 'letters-menu', 'letters-recognition'].includes(view)) render();
  if (view === 'letters-lesson') updateWritingStatus();
  if (changed && view === 'clock-school') clockSchool?.updateProgress();
} });
if (album.linked) progress = album.progress;

const narrator = new Narrator(status => {
  audioStatus = status;
  for (const replay of document.querySelectorAll('[data-action="replay"], [data-action="welcome"]')) replay.classList.toggle('is-speaking', status === 'speaking');
  const notice = document.querySelector('#audio-notice');
  if (notice) { notice.hidden = status !== 'unavailable'; notice.textContent = 'הקול לא נשמע? לחצי שוב על הרמקול. אפשר גם להיעזר בהורה.'; }
});
narrator.enabled = settings.sound;
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, progress, readingPractice, clockSchoolPosition }));
    storageAvailable = true;
  } catch { storageAvailable = false; }
}

function applyPreferences() {
  document.documentElement.classList.toggle('still', !settings.motion);
  narrator.enabled = settings.sound;
}

function header() {
  return `<header class="topbar">
    <button class="brand" data-action="home" aria-label="חבורת ההרפתקאות — הביתה"><span class="brand-mark">${art('paw')}</span><span>חבורת<br><strong>ההרפתקאות</strong></span></button>
    <nav class="top-actions" aria-label="ניווט ראשי">
      <button class="nav-button album-nav" data-action="album" aria-label="המדבקות שלי${progress.stickers.length ? ` ${progress.stickers.length}` : ''}">${uiIcon('album')}<span>המדבקות שלי</span>${progress.stickers.length ? `<b class="nav-count">${progress.stickers.length}</b>` : ''}</button>
      <button class="circle-button sound-toggle" data-action="sound" aria-label="${settings.sound ? 'כיבוי הקול' : 'הפעלת הקול'}" aria-pressed="${settings.sound}">${uiIcon(settings.sound ? 'sound' : 'muted')}</button>
      <button class="parent-button" data-action="parents" aria-label="להורים">${uiIcon('settings')}<span>להורים</span></button>
    </nav>
  </header>`;
}

function footer() {
  return `<footer class="footer"><span>${art('paw')} הרפתקה קטנה. גילוי גדול.</span><span>משחקות בקצב שלך ♡</span></footer>`;
}

function demoLetter() { return LETTERS[letterDemo.language][letterDemo.index]; }
function letterNarration() {
  const letter = demoLetter();
  return [`letters-intro-${letterDemo.language}`, letter.clip, ...(letter.final ? ['letters-final'] : [])];
}

function recognitionGroup() {
  const language = settings.letterLanguage;
  return recognitionChoice ? recognitionChoice.map(id => LETTERS[language].find(letter => letter.id === id)) : suggestedLetters(progress.letterPractice, language);
}

function letterGroupPreview(group, language) {
  return `<bdi class="letter-group-preview" dir="${language === 'hebrew' ? 'rtl' : 'ltr'}">${group.map(item => `<span>${item.familiar}</span>`).join('<span class="letter-group-dot" aria-hidden="true">·</span>')}</bdi>`;
}

function letterNavigation(mode = null) {
  const language = settings.letterLanguage;
  return `<div class="letter-lesson-topline"><button class="text-button" data-action="${mode ? 'letters-menu' : 'home'}">${uiIcon('home')} ${mode ? 'למסלולי האותיות' : 'לבית החברים'}</button><div class="letter-language-tabs" role="group" aria-label="שפת האותיות"><button data-action="letter-language" data-language="hebrew" aria-pressed="${language === 'hebrew'}">עברית · כתב יד</button><button data-action="letter-language" data-language="english" aria-pressed="${language === 'english'}"><bdi>English · A → a</bdi></button></div></div>${mode ? `<div class="letter-language-tabs letter-mode-tabs" role="group" aria-label="דרך הלמידה"><button data-action="letter-mode" data-mode="recognition" aria-pressed="${mode === 'recognition'}">מזהות אותיות</button><button data-action="letter-mode" data-mode="writing" aria-pressed="${mode === 'writing'}">כותבות אותיות</button></div>` : ''}`;
}

function letterLibrary(language, mode) {
  const visits = progress.letterPractice[language][mode];
  return `<details class="letter-library"><summary>כל האותיות · בוחרות מה לתרגל</summary><div class="letter-library-grid" dir="${language === 'hebrew' ? 'rtl' : 'ltr'}">${LETTERS[language].map((item, index) => `<button data-action="letter-select" data-index="${index}" data-mode="${mode}" class="${visits[index] ? 'practiced' : ''}" aria-pressed="${mode === 'writing' ? index === letterDemo.index : recognitionChoice?.[0] === item.id}" aria-label="תרגול ${mode === 'writing' ? 'כתיבת' : 'זיהוי'} האות ${item.name}${visits[index] ? ' · כבר תרגלת' : ''}">${item.familiar}${visits[index] ? '<span class="letter-practiced" aria-hidden="true">✓</span>' : ''}${item.final ? '<small>סופית</small>' : ''}</button>`).join('')}</div></details>`;
}

function openLetterMenu() {
  narrator.stop(); round = null; recognitionChoice = null; view = 'letters-menu'; render(); focusTitle(); announcements.say('letters-paths');
}

function openLetterMode(mode) {
  narrator.stop(); round = null; recognitionChoice = null;
  if (mode === 'writing') { openLetterLesson(); return; }
  view = 'letters-recognition'; render(); focusTitle(); announcements.say('letters-recognition');
}

function renderLetterMenu() {
  const language = settings.letterLanguage, letters = LETTERS[language];
  const next = suggestedLetters(progress.letterPractice, language);
  const writing = suggestedLetters(progress.letterPractice, language, 'writing', 1, settings.letterWriting[language])[0];
  app.innerHTML = `${header()}<main id="main" class="letter-lesson-page letter-menu-page" dir="rtl" lang="he">${letterNavigation()}
    <section class="letter-path-heading"><span class="section-kicker">סטודיו האותיות · לולי לומדת איתך</span><h1 tabindex="-1">מה נרצה לגלות?</h1><p>אותיות בכתב יד בעברית, ואותיות קטנות באנגלית.</p></section>
    <div class="letter-path-grid"><button class="letter-path-card recognition-path" data-action="letter-mode" data-mode="recognition"><div class="letter-path-picture" dir="${language === 'hebrew' ? 'rtl' : 'ltr'}"><bdi>${next[0].familiar}</bdi><span aria-hidden="true">${language === 'hebrew' ? '←' : '→'}</span>${letterShape(next[0])}</div><h2>מזהות אותיות</h2><p>מוצאות את הצורה שמתאימה לאות המוכרת</p><small>תרגלת ${practicedLetterCount(progress.letterPractice, language, 'recognition')} מתוך ${letters.length} אותיות</small><span class="letter-path-go">בואי נשחק ${uiIcon('arrow')}</span></button>
    <button class="letter-path-card writing-path" data-action="letter-mode" data-mode="writing"><div class="letter-path-picture">${letterShape(writing)}${uiIcon('pencil')}</div><h2>כותבות אותיות</h2><p>רואות איך כותבים, ומנסות באצבע או בעיפרון</p><small>כתבת ${practicedLetterCount(progress.letterPractice, language, 'writing')} מתוך ${letters.length} אותיות</small><span class="letter-path-go">בואי נכתוב ${uiIcon('arrow')}</span></button></div>
    <p class="letter-path-note">כל מסלול זוכר את ההתקדמות שלך ♡</p></main>${footer()}`;
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

function openLetterLesson() {
  narrator.stop(); round = null;
  const language = settings.letterLanguage;
  const next = suggestedLetters(progress.letterPractice, language, 'writing', 1, settings.letterWriting[language])[0];
  letterDemo = { language, index: LETTERS[language].indexOf(next), recorded: false };
  settings.letterWriting[language] = letterDemo.index; save();
  view = 'letters-lesson'; render(); focusTitle(); announcements.say(letterNarration());
}

function renderLetterLesson() {
  const letter = demoLetter(), language = letterDemo.language, letters = LETTERS[language];
  const direction = language === 'hebrew' ? 'rtl' : 'ltr';
  app.innerHTML = `${header()}<main id="main" class="letter-lesson-page" dir="rtl" lang="he" data-letter-language="${language}">${letterNavigation('writing')}
    <section class="letter-lesson-card"><div class="question-heading"><div><span class="section-kicker">לולי מגלה איתך איך כותבים</span><h1 tabindex="-1">כותבות אותיות</h1></div><button class="circle-button" data-action="replay" aria-label="שמיעת ההסבר שוב">${uiIcon('sound')}</button></div>
      <p class="letter-route-progress" id="letter-writing-progress">כתבת ${practicedLetterCount(progress.letterPractice, language, 'writing')} מתוך ${letters.length} אותיות</p>
      <div class="letter-lesson-layout" dir="rtl"><div><div class="letter-pair" dir="${direction}"><div class="letter-form-card"><small dir="rtl">${language === 'hebrew' ? 'האות שאת מכירה · דפוס' : 'האות שאת מכירה · גדולה'}</small><bdi class="letter-familiar" dir="${direction}" lang="${language === 'hebrew' ? 'he' : 'en'}">${letter.familiar}</bdi></div><span class="letter-pair-arrow" dir="ltr" aria-hidden="true">${language === 'hebrew' ? '←' : '→'}</span><div class="letter-form-card new-form"><small dir="rtl">${language === 'hebrew' ? 'אותה אות · כתב יד' : 'אותה אות · קטנה'}</small>${letterShape(letter)}</div></div>
      <div class="letter-name-row"><span>${language === 'hebrew' ? letter.name : `<bdi>${letter.familiar}</bdi>`}</span><button class="circle-button" data-action="letter-sound" aria-label="שמיעת שם האות">${uiIcon('sound')}</button></div>
      ${language === 'english' && ['a', 'g'].includes(letter.small) ? `<p class="letter-book-note">בספרים אפשר לראות גם כך: <bdi class="letter-book-form">${letter.small}</bdi></p>` : ''}
      ${letter.final ? '<p class="letter-final-note">אות סופית · מופיעה בסוף מילה</p>' : ''}
      <p class="letter-copy">לחצי על העיפרון כדי לראות איך כותבים, ואז נסי בעצמך.<br>ההתקדמות נשמרת אחרי שאת מסיימת לכתוב את האות.</p>
      <div class="letter-navigate" dir="${direction}"><button data-action="letter-previous" aria-label="האות הקודמת"><span aria-hidden="true">${language === 'hebrew' ? '→' : '←'}</span><span dir="rtl">הקודמת</span></button><span dir="ltr">${letterDemo.index + 1} / ${letters.length}</span><button data-action="letter-next" aria-label="האות הבאה"><span dir="rtl">הבאה</span><span aria-hidden="true">${language === 'hebrew' ? '←' : '→'}</span></button></div>
      </div><section class="letter-pad-card"><h2>מגלות איך כותבים</h2><div id="letter-writing-pad">${letterShape(letter, { guide: true, pad: true })}<p class="letter-pad-caption" role="status" aria-live="polite"></p></div><div class="letter-pad-controls"><button data-action="letter-demo">${uiIcon('pencil')} הראי לי איך</button><button data-action="letter-step">קו־קו</button><button data-action="letter-reset">${uiIcon('again')} מנסה בעצמי</button></div></section></div>
      <div class="letter-writing-continue"><button class="primary-button" data-action="letter-writing-continue" ${letterDemo.recorded ? '' : 'disabled'}>ממשיכות לאות הבאה ${uiIcon('arrow')}</button><small>אפשר גם לבחור כל אות מהאלפבית</small></div>
      ${letterLibrary(language, 'writing')}<p id="audio-notice" class="audio-notice" role="status" hidden></p>
    </section></main>${footer()}`;
  letterPad = mountLetterPad(document.querySelector('#letter-writing-pad'), {
    motion: settings.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches,
    onComplete: () => {
      if (!letterDemo.recorded) {
        letterDemo.recorded = true;
        if (album.linked) progress = album.recordWriting(language, letter.id);
        else progress.letterPractice = recordLetters(progress.letterPractice, language, 'writing', [letter.id]);
        save(); updateWritingStatus();
      }
      announcements.say('letters-trace-done'); narrator.chime(); celebrate(12);
    },
    onStartNeeded: () => { if (Date.now() - lastTraceHint > 5000) { lastTraceHint = Date.now(); announcements.say('letters-trace-start'); } },
  });
}

function updateWritingStatus() {
  const language = letterDemo.language;
  const status = document.querySelector('#letter-writing-progress');
  if (status) status.textContent = `כתבת ${practicedLetterCount(progress.letterPractice, language, 'writing')} מתוך ${LETTERS[language].length} אותיות`;
  const next = document.querySelector('[data-action="letter-writing-continue"]');
  if (next) next.disabled = !letterDemo.recorded;
  for (const button of document.querySelectorAll('[data-action="letter-select"][data-mode="writing"]')) {
    const practiced = progress.letterPractice[language].writing[Number(button.dataset.index)] > 0;
    button.classList.toggle('practiced', practiced);
    if (practiced && !button.querySelector('.letter-practiced')) button.insertAdjacentHTML('beforeend', '<span class="letter-practiced" aria-hidden="true">✓</span>');
  }
}

function selectLetter(index) {
  const language = settings.letterLanguage, length = LETTERS[language].length;
  if (view === 'letters-recognition') {
    recognitionChoice = letterGroup(language, index).map(letter => letter.id); render(); focusTitle(); return;
  }
  letterDemo = { language, index: (index + length) % length, recorded: false };
  settings.letterWriting[language] = letterDemo.index; save(); render();
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
  if (returnToGame) round.helped.add(round.index);
  else round = null;
  view = 'clock-school'; render(); focusTitle(); clockSchool.replay();
}

function clockSpeak(keys) {
  if (!settings.sound) { settings.sound = true; narrator.enabled = true; save(); renderSoundButton(); }
  announcements.say(keys);
}

function renderHome() {
  app.innerHTML = `${header()}<main id="main" class="home-page">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy"><div class="eyebrow"><span class="tiny-sun">✦</span> שלום אריאל!</div>
        <h1 id="hero-title" tabindex="-1">הרפתקה קטנה,<br><span>מגלות עולם!</span></h1>
        <p class="hero-description">לולי, בובי וטופי מחכים לך.<br>בואי נשחק, נגלה ונלמד ביחד.</p>
        <button class="primary-button hero-start" data-action="recommended">יוצאות להרפתקה ${uiIcon('arrow')}</button>
        <button class="text-button welcome-listen" data-action="welcome">${uiIcon('sound')} לחצי ונכיר את החברים</button>
        <p id="audio-notice" class="audio-notice" role="status" hidden></p>
      </div><div class="hero-world">${scene()}<div class="world-caption"><span class="status-dot"></span> בית החברים · תמיד שמחים לראות אותך</div></div>
    </section>
    <section class="missions" aria-labelledby="missions-title"><div class="section-heading"><div><span class="section-kicker">כל פעם מגלות משהו חדש</span><h2 id="missions-title">לאן נצא היום?</h2></div><span class="rounds-note">${SESSION_LENGTH} צעדים · מתחילות בקל ומתקדמות ${art('paw')}</span></div>
      <div class="mission-grid">${Object.values(MISSIONS).map(m => `<button class="mission-card ${m.color}" data-action="mission" data-mission="${m.id}" aria-label="${m.name} — ${m.description}">
        <div class="mission-art"><span class="art-orbit"></span>${art(m.icon, 'mission-object')}${pup(m.pup, 'mission-pup')}<span class="mini-sparkle">✦</span></div>
        <div class="mission-body"><span class="subject-tag" ${m.id === 'english' ? 'lang="en" dir="ltr"' : ''}>${m.subject}</span><h3>${m.name}</h3><p>${m.subtitle}</p><span class="mission-go">בואי נשחק ${uiIcon('arrow')}</span></div>
        ${progress.missions[m.id] ? `<span class="mission-done" aria-label="כבר סיימת ${progress.missions[m.id]} הרפתקאות">${uiIcon('check')}</span>` : ''}
      </button>`).join('')}</div>
    </section>
    <section class="album-teaser"><span class="teaser-art">${art(progress.stickers.at(-1) || 'star')}</span><div><h3>${progress.stickers.length ? 'האלבום שלך כבר מתמלא!' : 'כל הרפתקה מתחילה בחיוך'}</h3><p>${progress.stickers.length ? `${progress.stickers.length} מדבקות מחכות לך באלבום` : 'בכל הרפתקה שלמה מגלות מדבקה חדשה'}</p></div><button class="text-button" data-action="album">לאלבום שלי ${uiIcon('arrow')}</button></section>
  </main>${footer()}`;
}

function current() { return round?.questions[round.index]; }
function wordText(word) { return settings.nikud ? word.pointed : word.he; }
function tallyGroup(n, offset, item) {
  return `<div class="object-group ${n > 10 ? 'many' : ''}" role="group" aria-label="קבוצה לספירה">${Array.from({ length: n }, (_, i) => `<button class="count-object" data-action="tally" data-token="${offset + i}" aria-label="ספירת פריט ${offset + i + 1}">${art(item)}<span class="count-bubble" aria-hidden="true"></span></button>`).join('')}</div>`;
}

function questionVisual(q) {
  if (q.type === 'letter') return `<div class="letter-question-layout" dir="rtl"><div class="letter-question-card"><small>${q.letter.language === 'hebrew' ? 'איזו אות בכתב יד מתאימה?' : 'איזו אות קטנה מתאימה?'}</small><bdi class="letter-familiar" dir="${q.letter.language === 'hebrew' ? 'rtl' : 'ltr'}">${q.letter.familiar}</bdi></div><div id="letter-recognition-model" class="letter-recognition-model" ${q.showModel ? '' : 'hidden'}>${letterShape(q.letter)}<span>זו אותה אות · נסתכל על הצורה</span></div></div>`;
  if (q.type === 'clock') return `<div class="clock-question-clock">${analogClock(q.time.hour, q.time.minute)}</div><button class="text-button clock-learn-link" data-action="clock-learn">${uiIcon('hint')} נזכרות איך קוראים שעון</button>`;
  if (q.type === 'read') return `<div class="word-card ${q.word.scene ? 'phrase-word' : q.word.he.length >= 6 ? 'long-word' : ''}"><span class="card-label">מה כתוב כאן?</span><div class="target-word" lang="he" dir="rtl">${q.word.scene ? wordText(q.word).split(' ').map(word => `<span class="reading-token">${word}</span>`).join(' ') : wordText(q.word)}</div><span class="word-underline"></span></div>`;
  if (q.type === 'listen') return `<button class="listen-orb" data-action="listen-word" aria-label="שמיעת המילה באנגלית">${uiIcon('sound')}<span class="sound-waves"><i></i><i></i><i></i><i></i><i></i></span><span>לחצי ושמעי את המילה</span></button>`;
  if (q.type === 'count') return `<div class="counting-stage">${tallyGroup(q.a, 0, q.item)}<p class="tally-instruction">אפשר לגעת בכל פריט ולספור ביחד</p></div>`;
  return `<div class="addition-stage ${Math.max(q.a, q.b) > 10 ? 'large-add' : ''}" dir="ltr"><div class="add-group">${tallyGroup(q.a, 0, q.item)}<span class="group-number">${q.a}</span></div><span class="plus-sign" aria-label="ועוד">+</span><div class="add-group">${tallyGroup(q.b, q.a, q.item)}<span class="group-number">${q.b}</span></div></div><div class="equation" dir="ltr" aria-label="${q.a} ועוד ${q.b}">${q.a} <span>+</span> ${q.b} <span>=</span> <b>?</b></div>`;
}

function answerVisual(q, option) {
  if (q.type === 'letter') return letterShape(option);
  if (q.type === 'clock') return `<span class="clock-answer-time" dir="ltr">${option.digital}</span><span class="clock-answer-name">${option.he}</span>`;
  if (q.type === 'read') return art(option.id);
  if (q.kind === 'color') return `<span class="color-balloon" style="--balloon:${option.hex}"><i></i></span>`;
  if (q.type === 'count' || q.type === 'add' || q.kind === 'number') return `<span class="answer-number" dir="ltr">${option.number}</span>`;
  return art(option.id);
}

function answerLabel(q, option) {
  if (q.type === 'letter') return `${option.name} ${option.language === 'hebrew' ? 'בכתב יד' : 'קטנה'}`;
  if (q.type === 'clock') return `השעה ${option.he}, ${option.digital}`;
  if (q.type === 'read') return option.he;
  if (typeof option.number === 'number') return String(option.number);
  return option.he;
}

function renderGame() {
  const mission = MISSIONS[round.mission];
  const q = current();
  const title = q.type === 'letter' ? 'איזו אות מתאימה?' : q.type === 'clock' ? 'מה השעה בשעון?' : q.type === 'read' ? q.word.scene ? 'איזו תמונה מתאימה למה שכתוב?' : 'איזו תמונה מתאימה למילה?' : q.type === 'listen' ? 'מה שמעת באנגלית?' : q.type === 'add' ? 'כמה יש ביחד?' : 'כמה יש בסל?';
  const stage = q.type === 'read' ? round.reading === 'all' ? Object.values(READING_LEVELS).find(level => level.level === q.word.level) : READING_LEVELS[round.reading] : null;
  app.innerHTML = `${header()}<main id="main" class="game-page ${mission.color} ${q.type === 'clock' ? 'clock-game' : q.type === 'letter' ? 'letter-game' : q.type === 'read' ? 'reading-game' : ''}">
    <div class="game-topline"><button class="text-button back-button" data-action="${q.type === 'read' ? 'reading-levels' : q.type === 'letter' ? 'letters-menu' : 'home'}">${uiIcon('home')} ${q.type === 'read' ? 'לבחירת שלב' : q.type === 'letter' ? 'למסלולי האותיות' : 'למפת ההרפתקאות'}</button><span class="mission-label">${mission.name}${q.type === 'letter' ? ' · משחק זיהוי' : ''}${stage ? ` · ${stage.number ? `שלב ${stage.number}` : stage.name}` : ''}</span><span class="step-label">צעד ${round.index + 1} מתוך ${SESSION_LENGTH}</span></div>
    <div class="step-track" aria-label="התקדמות: ${round.index} מתוך ${SESSION_LENGTH}">${Array.from({ length: SESSION_LENGTH }, (_, i) => `<span class="step-dot ${i < round.index ? 'done' : i === round.index ? 'current' : ''}">${i < round.index ? uiIcon('check') : i + 1}</span>`).join('')}</div>
    <section class="game-board"><div class="question-heading"><div><span class="section-kicker">${ADVENTURE_PHASES[q.phase]}</span><h1 id="question-title" tabindex="-1">${title}</h1></div><button class="circle-button replay-button" data-action="replay" aria-label="שמיעת ההוראות שוב">${uiIcon('sound')}</button></div>
      <div class="question-visual">${questionVisual(q)}</div>
      <div class="answer-grid ${q.options.length === 2 ? 'two-options' : ''} ${q.type === 'read' && q.word.scene ? 'scene-options' : ''} ${q.type === 'count' || q.type === 'add' || q.kind === 'number' ? 'numeric-options' : ''}" ${q.type === 'letter' ? `dir="${q.letter.language === 'hebrew' ? 'rtl' : 'ltr'}"` : ''} role="group" aria-label="בחירת תשובה">${q.options.map(option => `${q.type === 'clock' ? '<div class="clock-choice">' : ''}<button class="answer-button ${round.attempted.has(option.id) ? 'try-again' : ''}" data-action="answer" data-answer="${option.id}" aria-label="${answerLabel(q, option)}" ${round.attempted.has(option.id) ? 'disabled' : ''}>${answerVisual(q, option)}<span class="answer-check">${uiIcon('check')}</span></button>${q.type === 'clock' ? `<button class="clock-option-sound" data-action="clock-option-audio" data-clips="${option.clips.join(' ')}" aria-label="שמיעת האפשרות ${option.he}">${uiIcon('sound')}</button></div>` : ''}`).join('')}</div>
      <div class="feedback-row"><div class="feedback" id="feedback" role="status" aria-live="polite">קחי את הזמן. החברים כאן איתך ♡</div><button class="hint-button" data-action="hint">${uiIcon('hint')} רמז קטן</button><button class="primary-button next-button" data-action="next" hidden>ממשיכות ${uiIcon('arrow')}</button></div>
      <p id="audio-notice" class="audio-notice" role="status" hidden></p>
    </section><div class="buddy-bar">${pup(mission.pup)}<span id="buddy-message">${{ luli: 'לולי', bobi: 'בובי', tofi: 'טופי' }[mission.pup]} כאן לעזור לך!</span><span class="buddy-hearts">♡ ♡ ♡</span></div>
  </main>${footer()}`;
}

function renderComplete() {
  const mission = MISSIONS[round.mission];
  const reading = round.mission === 'hebrew';
  const letters = round.mission === 'letters';
  const nextLetters = letters ? suggestedLetters(progress.letterPractice, round.letterLanguage) : [];
  const nextKey = reading ? nextReadingStage(round.reading, round.helped.size) : null;
  const nextStage = nextKey ? READING_LEVELS[nextKey] : null;
  app.innerHTML = `${header()}<main id="main" class="completion-page">
    <div class="completion-stars">✦ <span>✧</span> ✦</div><div class="reward-art">${art(round.sticker || mission.sticker)}</div>
    <div class="eyebrow">החברים שמחים כל כך!</div><h1 tabindex="-1">יש! עשית את זה!</h1>
    <p>סיימת את ${mission.name}${reading && READING_LEVELS[round.reading]?.number ? ` · שלב ${READING_LEVELS[round.reading].number}` : ''}.</p>
    <p class="reward-caption">${round.sticker ? 'מדבקה חדשה הצטרפה לאלבום שלך' : 'עוד הרפתקה נפלאה עם החברים'}</p>
    ${reading ? `<section class="reading-next-offer"><span class="section-kicker">יש עוד דברים חדשים לגלות!</span>${nextStage ? `<button class="primary-button" data-action="reading-level" data-level="${nextKey}">ממשיכות לשלב ${nextStage.number} ${uiIcon('arrow')}</button><small>${nextStage.name}</small>` : `<button class="primary-button" data-action="reading-level" data-level="${round.reading}">קוראות עוד ביחד ${uiIcon('arrow')}</button>`}</section>` : ''}
    ${letters ? `<section class="letter-next-offer"><span class="section-kicker">תרגלת ${practicedLetterCount(progress.letterPractice, round.letterLanguage, 'recognition')} מתוך ${LETTERS[round.letterLanguage].length} אותיות</span>${letterGroupPreview(nextLetters, round.letterLanguage)}<button class="primary-button" data-action="letter-recognition-next">ממשיכות לאותיות הבאות ${uiIcon('arrow')}</button></section>` : ''}
    <div class="completion-pups">${pup('luli')}${pup('bobi')}${pup('tofi')}</div>
    <div class="completion-actions"><button class="${reading || letters ? 'secondary-button' : 'primary-button'}" data-action="album">למדבקות שלי ${uiIcon('album')}</button>
    ${reading ? `${nextStage ? `<button class="secondary-button" data-action="reading-level" data-level="${round.reading}">עוד בשלב הזה</button>` : ''}<button class="text-button" data-action="reading-levels">לכל שלבי הקריאה</button>` : ''}
    ${letters ? '<button class="secondary-button" data-action="letter-recognition-repeat">עוד עם האותיות האלה</button><button class="text-button" data-action="letters-menu">למסלולי האותיות</button>' : ''}
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
  letterPad?.destroy(); letterPad = null;
  clockSchool?.destroy(); clockSchool = null;
  applyPreferences();
  document.body.classList.toggle('playing', view === 'game');
  if (view === 'game') renderGame();
  else if (view === 'clock-school') renderClockSchool();
  else if (view === 'letters-lesson') renderLetterLesson();
  else if (view === 'letters-menu') renderLetterMenu();
  else if (view === 'letters-recognition') renderLetterRecognition();
  else if (view === 'reading-levels') renderReadingLevels();
  else if (view === 'complete') renderComplete();
  else if (view === 'album') renderAlbum();
  else renderHome();
}

function focusTitle() {
  window.scrollTo({ top: 0, behavior: 'auto' });
  document.querySelector('main h1')?.focus({ preventScroll: true });
}

function startMission(mission, skipLesson = false) {
  if (mission === 'hebrew' && !skipLesson) { openReadingLevels(); return; }
  if (mission === 'clock' && !skipLesson) { openClockLesson(); return; }
  if (mission === 'letters' && !skipLesson) { openLetterMenu(); return; }
  narrator.stop();
  const letterIds = mission === 'letters' ? recognitionGroup().map(letter => letter.id) : null;
  const questions = createSession(mission, { ...settings, readingRecent: readingPractice.recent[settings.reading], letterPractice: progress.letterPractice, letterIds });
  round = { mission, questions, letterIds, letterLanguage: settings.letterLanguage, reading: settings.reading, clockLevel: settings.clockLevel, index: 0, resolved: false, attempted: new Set(), counted: new Set(), helped: new Set(questions.flatMap((q, i) => q.showModel ? [i] : [])), sticker: null, awarded: false };
  view = 'game';
  render();
  focusTitle();
  const q = current();
  announcements.say([...(mission === 'hebrew' ? [READING_LEVELS[round.reading].clip, q.prompt] : [mission === 'letters' ? q.prompt : MISSIONS[mission].intro]), ...(q.showModel ? ['letters-recognition-hint'] : []), ...(q.targetClip ? [q.targetClip] : [])]);
}

function recommended() {
  const next = Object.keys(MISSIONS).reduce((a, b) => progress.missions[a] <= progress.missions[b] ? a : b);
  startMission(next);
}

function leaveTo(destination) {
  narrator.stop();
  const leave = () => { round = null; recognitionChoice = null; view = destination; render(); focusTitle(); announcements.say(destination === 'letters-menu' ? 'letters-paths' : destination === 'reading-levels' ? 'reading-levels' : destination === 'home' ? 'choose-activity' : 'stickers'); };
  if (view !== 'game') { leave(); return; }
  openDialog(`<h2 id="parent-title">${destination === 'letters-menu' ? 'נחזור למסלולי האותיות?' : destination === 'reading-levels' ? 'נבחר שלב אחר?' : 'נחזור לבית החברים?'}</h2><p>אפשר להתחיל הרפתקה חדשה מתי שתרצי.</p><div class="dialog-actions"><button class="primary-button" data-dialog="stay">ממשיכות לשחק</button><button class="secondary-button" data-dialog="leave">${destination === 'letters-menu' ? 'למסלולי האותיות' : destination === 'reading-levels' ? 'בוחרות שלב' : 'חוזרות הביתה'}</button></div>`);
  dialog.querySelector('[data-dialog="stay"]').onclick = closeDialog;
  dialog.querySelector('[data-dialog="leave"]').onclick = () => { closeDialog(); leave(); };
}

function replay() {
  if (!settings.sound) { settings.sound = true; save(); narrator.enabled = true; renderSoundButton(); }
  if (view === 'clock-school') { clockSchool.replay(true); return; }
  if (view === 'game') {
    const q = current();
    announcements.say([q.prompt, ...(q.targetClip ? [q.targetClip] : [])]);
  } else announcements.say(view === 'reading-levels' ? 'reading-levels' : view === 'letters-menu' ? 'letters-paths' : view === 'letters-recognition' ? 'letters-recognition' : view === 'letters-lesson' ? letterNarration() : view === 'clock-lesson' ? 'intro-clock' : view === 'album' ? 'stickers' : 'welcome');
}

function renderSoundButton() {
  const button = document.querySelector('.sound-toggle');
  if (button) { button.innerHTML = uiIcon(settings.sound ? 'sound' : 'muted'); button.setAttribute('aria-pressed', String(settings.sound)); button.setAttribute('aria-label', settings.sound ? 'כיבוי הקול' : 'הפעלת הקול'); }
}

function hint() {
  if (round.resolved) return;
  const q = current();
  round.helped.add(round.index);
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
    announcements.say('try-again');
    return;
  }
  round.resolved = true;
  button.classList.add('correct');
  for (const option of document.querySelectorAll('.answer-button')) option.disabled = true;
  document.querySelector('.hint-button').hidden = true;
  const lessonLink = document.querySelector('[data-action="clock-learn"]');
  if (lessonLink) lessonLink.disabled = true;
  const next = document.querySelector('.next-button');
  next.hidden = false;
  if (round.index === SESSION_LENGTH - 1) next.innerHTML = `למדבקה שלי ${uiIcon('arrow')}`;
  const answerText = q.type === 'letter' ? q.letter.familiar : q.type === 'clock' ? `השעה ${q.time.he}` : q.type === 'read' ? wordText(q.word) : q.type === 'listen' ? q.target.en : `${q.total}`;
  feedback.innerHTML = `${uiIcon('check')} <span>כל הכבוד! <b ${q.type === 'listen' ? 'lang="en" dir="ltr"' : ''}>${answerText}</b></span>`;
  feedback.classList.add('success');
  document.querySelector('.buddy-bar').classList.add('celebrating');
  document.querySelector('#buddy-message').textContent = 'יש! הצלחת!';
  announcements.say([`correct-${1 + round.index % 3}`, ...(q.type === 'clock' ? q.time.clips : q.type === 'read' ? [`he-${q.word.id}`] : q.targetClip ? [q.targetClip] : [])]);
  narrator.chime();
  celebrate(16);
  next.focus({ preventScroll: q.type !== 'clock' && !(q.type === 'read' && q.word.scene) });
}

function nextQuestion() {
  if (!round?.resolved) return;
  if (round.index === SESSION_LENGTH - 1) {
    if (!round.awarded) {
      const letterRound = round.mission === 'letters' ? { language: round.letterLanguage, ids: round.letterIds } : null;
      const result = album.linked ? album.complete(round.mission, round.helped.size, letterRound) : finishSession(progress, round.mission, round.helped.size, letterRound);
      progress = result.progress;
      round.sticker = result.sticker;
      round.awarded = true;
      if (round.mission === 'hebrew') readingPractice = finishReadingPractice(readingPractice, round.reading, round.questions.map(q => q.word));
      if (round.mission === 'letters') recognitionChoice = null;
      save();
    }
    view = 'complete'; render(); focusTitle(); celebrate(40); announcements.say([round.sticker ? 'complete' : 'complete-all', ...(round.mission === 'hebrew' ? [nextReadingStage(round.reading, round.helped.size) ? 'reading-next' : 'reading-more'] : [])]); return;
  }
  round.index++;
  round.resolved = false;
  round.attempted = new Set();
  round.counted = new Set();
  render(); focusTitle();
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
    <section class="parent-progress"><h3>מה כבר גילינו?</h3><p id="parent-progress-summary">${progress.sessions} הרפתקאות שלמות · ${progress.stickers.length} מדבקות</p><table><thead><tr><th>תחום</th><th>תשובות ללא עזרה</th><th>עם הדגמה, רמז או ניסיון נוסף</th></tr></thead><tbody>${Object.values(MISSIONS).map(m => `<tr><th>${m.subject}</th><td data-independent="${m.id}">${progress.skills[m.id].correct - progress.skills[m.id].assisted}</td><td data-assisted="${m.id}">${progress.skills[m.id].assisted}</td></tr>`).join('')}</tbody></table><p class="parent-note">מוצגות רק הרפתקאות שהושלמו. זהו תיעוד משחק, ולא מבחן או הערכת יכולת.</p></section>
    <section id="family-panel"></section>
    <p class="privacy-note">אפשר לשחק ללא חיבור לאלבום משפחתי. בחיבור לאלבום, נשמרים מספר ההרפתקאות והעזרה בכל תחום, והאותיות שתורגלו בכל מסלול. ציורי הכתיבה אינם נשמרים. לא צריך אימייל או חשבון לילדה. אין פרסומות, מעקב או בקשת מיקרופון. שמרו את הקוד המשפחתי כדי לחבר מכשיר חדש.</p>
    <p class="parent-note">איורים נוספים: <a href="assets/Twemoji-LICENSE.txt" target="_blank" rel="noopener">Twemoji · רישיון ושמות היוצרים</a>. כל התמונות שמורות בתוך המשחק.</p>
    <p class="save-notice" ${storageAvailable ? 'hidden' : ''}>הדפדפן לא מאפשר שמירה כרגע. אפשר לשחק, אבל ההתקדמות עלולה להיעלם בסגירה.</p>
    <button class="text-button reset-button" data-dialog="reset">${album.linked ? 'ניתוק מהאלבום ואיפוס המכשיר הזה' : 'איפוס ההתקדמות במכשיר הזה'}</button>`);
  mountFamilyPanel(dialog.querySelector('#family-panel'), { album, getLocalProgress: () => progress, pendingCode: pendingJoinCode });
  dialog.querySelector('#settings-form').onsubmit = event => {
    event.preventDefault();
    const form = new FormData(event.target);
    settings = sanitizeSettings({ nikud: form.has('nikud'), sound: form.has('sound'), motion: form.has('motion'), reading: form.get('reading'), mathMax: Number(form.get('mathMax')), englishMax: Number(form.get('englishMax')), clockLevel: form.get('clockLevel'), letterLanguage: settings.letterLanguage, letterWriting: settings.letterWriting });
    save(); narrator.stop(); applyPreferences(); closeDialog();
    // Keep a running question and its answer state intact until the next round.
    if (view === 'game') renderSoundButton(); else render();
  };
  dialog.querySelector('[data-dialog="reset"]').onclick = () => {
    openDialog(`<h2 id="parent-title">לאפס את המכשיר הזה?</h2><p>המדבקות וההתקדמות בדפדפן הזה יימחקו. הגדרות המשחק יישמרו.${album.linked ? ' החיבור לאלבום המשפחתי יוסר. האלבום שכבר סונכרן יישמר עבור המכשירים האחרים.' : ''}</p><div class="dialog-actions"><button class="secondary-button" data-dialog="cancel-reset">ביטול</button><button class="primary-button" data-dialog="confirm-reset">איפוס ההתקדמות</button></div>`);
    dialog.querySelector('[data-dialog="cancel-reset"]').onclick = renderSettings;
    dialog.querySelector('[data-dialog="confirm-reset"]').onclick = () => { if (album.linked) album.disconnect(); progress = freshProgress(); readingPractice = sanitizeReadingPractice(null); save(); round = null; view = 'home'; render(); renderSettings(); };
  };
}

function updateParentProgress() {
  const summary = dialog.querySelector('#parent-progress-summary');
  if (summary) summary.textContent = `${progress.sessions} הרפתקאות שלמות · ${progress.stickers.length} מדבקות`;
  for (const mission of Object.keys(MISSIONS)) {
    const independent = dialog.querySelector(`[data-independent="${mission}"]`);
    const assisted = dialog.querySelector(`[data-assisted="${mission}"]`);
    if (independent) independent.textContent = progress.skills[mission].correct - progress.skills[mission].assisted;
    if (assisted) assisted.textContent = progress.skills[mission].assisted;
  }
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
    case 'album': albumPageIndex = null; if (view === 'game') leaveTo('album'); else { narrator.stop(); view = 'album'; render(); focusTitle(); announcements.say('stickers'); } break;
    case 'album-page': turnAlbumPage(Number(button.dataset.page)); break;
    case 'album-latest': turnAlbumPage(null); break;
    case 'mission': startMission(button.dataset.mission); break;
    case 'reading-levels': if (view === 'game') leaveTo('reading-levels'); else openReadingLevels(); break;
    case 'reading-level': if (Object.hasOwn(READING_LEVELS, button.dataset.level)) { settings.reading = button.dataset.level; save(); startMission('hebrew', true); } break;
    case 'reading-stage-sound': if (Object.hasOwn(READING_LEVELS, button.dataset.level)) clockSpeak(READING_LEVELS[button.dataset.level].clip); break;
    case 'recommended': recommended(); break;
    case 'welcome': welcome(); break;
    case 'replay': replay(); break;
    case 'listen-word': if (!settings.sound) { settings.sound = true; narrator.enabled = true; save(); renderSoundButton(); } announcements.say(current().targetClip); break;
    case 'clock-practice': if (clockReturn && round) { view = 'game'; render(); focusTitle(); replay(); } else startMission('clock', true); break;
    case 'clock-learn': if (!round.resolved) openClockLesson(true); break;
    case 'clock-option-audio': clockSpeak(button.dataset.clips.split(' ')); break;
    case 'letters-menu': if (view === 'game') leaveTo('letters-menu'); else openLetterMenu(); break;
    case 'letter-mode': openLetterMode(button.dataset.mode); break;
    case 'letter-language': if (Object.hasOwn(LETTERS, button.dataset.language)) { settings.letterLanguage = button.dataset.language; recognitionChoice = null; save(); if (view === 'letters-lesson') openLetterLesson(); else { render(); announcements.say(view === 'letters-recognition' ? 'letters-recognition' : 'letters-paths'); } } break;
    case 'letter-select': selectLetter(Number(button.dataset.index)); break;
    case 'letter-previous': selectLetter(letterDemo.index - 1); break;
    case 'letter-next': selectLetter(letterDemo.index + 1); break;
    case 'letter-sound': clockSpeak(demoLetter().clip); break;
    case 'letter-demo': letterPad.demo(); announcements.say('letters-demo'); break;
    case 'letter-step': letterPad.step(); break;
    case 'letter-reset': letterPad.reset(); announcements.say('letters-trace'); break;
    case 'letter-practice': startMission('letters', true); break;
    case 'letter-recognition-auto': recognitionChoice = null; render(); focusTitle(); break;
    case 'letter-recognition-next': settings.letterLanguage = round.letterLanguage; recognitionChoice = null; startMission('letters', true); break;
    case 'letter-recognition-repeat': settings.letterLanguage = round.letterLanguage; recognitionChoice = [...round.letterIds]; startMission('letters', true); break;
    case 'letter-writing-continue': { const letter = suggestedLetters(progress.letterPractice, letterDemo.language, 'writing', 1, (letterDemo.index + 1) % LETTERS[letterDemo.language].length)[0]; selectLetter(LETTERS[letterDemo.language].indexOf(letter)); break; }
    case 'hint': hint(); break;
    case 'answer': answer(button); break;
    case 'tally': tally(button); break;
    case 'next': nextQuestion(); break;
    case 'parents': parentGate(); break;
    case 'sound': settings.sound = !settings.sound; narrator.stop(); narrator.enabled = settings.sound; save(); renderSoundButton(); if (settings.sound) replay(); break;
    case 'break': narrator.stop(); round = null; view = 'home'; render(); focusTitle(); announcements.say('break'); break;
  }
});

app.addEventListener('change', event => {
  if (event.target.matches('select[data-album-page]')) turnAlbumPage(Number(event.target.value));
});

dialog.addEventListener('click', event => { if (event.target === dialog && event.offsetX >= 0 && event.offsetX <= dialog.clientWidth && event.offsetY >= 0 && event.offsetY <= dialog.clientHeight) return; if (event.target === dialog) closeDialog(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) narrator.stop(); else { void album.flush(); startOpeningWelcome(); } });
window.addEventListener('online', () => { void album.flush(); });
window.addEventListener('focus', () => { void album.flush(); });
setInterval(() => { if (!document.hidden && album.linked) void album.flush(); }, 15000);
window.addEventListener('pagehide', () => narrator.stop());
render();
if (pendingJoinCode && !album.linked) parentGate();
else startOpeningWelcome();
if (album.linked) void album.flush();

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
  navigator.serviceWorker.register('./sw.js').catch(() => { /* Online play remains available. */ });
}
