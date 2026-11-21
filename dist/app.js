import { LearningStore } from './learning-sync.js?v=2.2.2-six';
import { questionLearning } from './learning.js';
import { packRound, unpackRound, cleanDrafts, roundKey } from './session-state.js?v=2.7.1-pepper';
import { JOURNEYS, newJourney, cleanJourney, resumeJourney, englishPairsReady, journeyLength } from './journey.js?v=2.2.5-practice';
import { MATCH_LEVELS } from './english-picture-match.js';
import { STORIES } from './journey-content.js';
import { mountJourney } from './journey-view.js?v=2.2.5-practice';
import { mountPark } from './park.js';
import { mountFreeWriting, WRITING_STEPS } from './free-writing.js?v=2.3.3-dictation';
import { parentLearning, learningStatus } from './learning-parent.js?v=2.3.3-dictation';
import { CLIPS, MISSIONS, MISSION_IDS, STICKERS, WORDS, READING_LEVELS } from './content.js?v=2.7.1-pepper';
import { DEFAULT_SETTINGS, SESSION_LENGTH, createSession, freshProgress, sanitizeSettings, sanitizeProgress } from './engine.js?v=2.7.1-pepper';
import { ADVENTURE_PHASES, adventurePhase } from './adventure.js?v=2.2.2-six';
import { art, pup, scene, uiIcon } from './art.js?v=2.7.0-science';
import { Narrator } from './audio.js?v=2.20.1';
import { GameAnnouncements } from './announcements.js';
import { SharedAlbum, normalizeCode } from './sync.js?v=2.2.6-album';
import { SYNC_CONFIG } from './sync-config.js';
import { mountFamilyPanel, updateFamilyStatus } from './family-ui.js?v=2.2.6-album';
import { analogClock, CLOCK_LEVELS } from './clock.js';
import { mountClockSchool } from './clock-school.js?v=2.2.4-practice';
import { sanitizeClockPosition, recordClockLesson } from './clock-learning.js?v=2.2.4-practice';
import { LETTERS, WRITING_FORMS, writingLetter, writingMode, writingPositionKey, letterGroup, letterShape, familiarGlyph, letterHeading } from './letters.js';
import { mountLetterPad } from './letter-pad.js?v=2.3.1-number-writing';
import { nextReadingStage, sanitizeReadingPractice, finishReadingPractice } from './reading.js?v=2.7.0-science';
import { stickerPage } from './stickers.js';
import { albumSticker, rewardSticker, createStickerPlayer } from './playable-stickers.js';
import { suggestedLetters, practicedLetterCount, recordLetters, recognitionTargets } from './letter-progress.js';
import { CHARACTERS, CHARACTER_COLLECTIONS, CHARACTER_LEVELS, CHARACTER_MODES, characterCollection, selectCharacterLevel, sanitizeCharacterPractice, finishCharacterPractice, nextCharacterLevel } from './characters.js?v=2.2.2-six';
import { characterMenu, characterPictureQuestion, characterAnswer, characterAnswerLabel, characterMissionArt, characterName } from './characters-view.js?v=2.2.2-six';
import { classicReadingHeading } from './classic-reading-heading.js';
import { letterExampleCards } from './letter-examples.js';
import { WRITING_WORDS, mountWritingWord, savedWritingWord, wordPicker } from './letter-words.js';
import { wordFormMenuArt, wordFormOption } from './word-form-view.js';
import { ARIEL, openAriel, readArielInvitation, GAME_KEY, STITCH_KEY } from './profiles.js?v=2.2.3-ariel';
import { profileSpeech } from './profile-speech.js?v=2.2.0-voices';
import { openGameGuide, GUIDE_ICON } from './guide.js?v=2.2.3-ariel';
import { NUMBER_PATHS, cleanNumberRound, newNumberRound, numberClip } from './number-workshop.js?v=2.3.0-numbers';
import { numberMenu, mountNumberRound, numberComplete } from './number-workshop-view.js?v=2.5.0-play';
import { numberWritingKey, mountNumberWriting } from './number-writing.js?v=2.3.3-dictation';
import { mountNumberDictation, numberDictationKey } from './number-dictation.js?v=2.3.3-dictation';
import { mountFruitCutting } from './fruit-cutting.js?v=2.5.0-play';
import { mountPictureMatch, PIKACHU_TITLE, STITCH_TITLE } from './pikachu-game.js';
import { companionStickers, createCompanionGreetings, pikachuImage, stitchImage } from './companion-stickers.js';
import { actOutDetails, actOutPrompt, actOutSteps } from './act-out.js?v=2.7.0-science';
import { mountActOut } from './act-out-view.js?v=2.7.1-pepper';
import { SCIENCE_TITLE, SCIENCE_EXPERIMENTS, cleanScienceRound, scienceClip } from './science-content.js?v=2.7.1-pepper';
import { mountScience, scienceArt, scienceMenu } from './science-view.js?v=2.7.1-pepper';
import { mountOfflineAudio, registerOffline } from './offline-audio.js';
import { AVAILABLE_PICNIC_MISSIONS, BOATYARD, BOATYARD_MISSIONS, DELIVERY, DELIVERY_MISSIONS, ENGLISH_LISTENING, LITTLE_STORIES, PICNIC, PICNIC_MISSIONS, THEATER, THEATER_SHOWS, isPicnicReady } from './activities.js';
import { CLOCK_ACTIVITIES_ENABLED, isChapterAvailable, isPracticeAvailable } from './availability.js';
import { latestPlayedDraft, readingActivity, recommendAdventure } from './home-adventure.js';
import { firstStoryClue, pictureClue, storyClue, storyReviewQuestion } from './story-practice.js';
import { awardLocalRound, checkpointScoredRound, finishScoredRound } from './round-lifecycle.js';
import { cleanPicnic, cleanPicnicRound, createPicnicRound, packPicnicRound, picnicItem } from './picnic.js';
import { mountPicnicRound, picnicComplete, picnicMap, picnicPrompt } from './picnic-view.js';
import { chapterEntry, chapterMap } from './chapter-map.js';
import { cleanDelivery, cleanDeliveryRound, createDeliveryBonus, createDeliveryRound, deliveryEvidence, deliveryPairReady, packDeliveryRound } from './delivery.js';
import { deliveryComplete, deliveryMap, mountDeliveryRound, prepareDeliveryAudio } from './delivery-view.js';
import { boatyardRound, cleanBoatyard, cleanBoatyardRound, packBoatyardRound } from './boatyard.js';
import { boatyardComplete, boatyardMap, boatyardPrompt, mountBoatyardRound, prepareBoatyardAudio } from './boatyard-view.js';
import { availableDailyDraft, cleanDaily, cleanDailyRound, createDailyRound, DAILY_PATHS, dailyEvidence, dailySuggestion, finishDailyMemory } from './daily.js';
import { dailyComplete, dailyHome, mountDaily, prepareDailyAudio } from './daily-view.js';
import { cleanTheater, cleanTheaterRound, createTheaterRound, packTheaterRound, theaterEvidence } from './theater.js';
import { prepareTheaterAudio, theaterComplete, theaterMap } from './theater-ui.js';
import { mountTheaterRound } from './theater-round-view.js';
import { mountTheaterStudio } from './theater-studio.js';

const gameStorage = openAriel();
let pendingJoinCode = null;

const app = document.querySelector('#app');
const dialog = document.querySelector('#parent-dialog');
const STORAGE_KEY = GAME_KEY;
let settings = sanitizeSettings(null);
let progress = freshProgress();
let storageAvailable = true;
let refreshAfterDialog = false;
let view = 'home';
let round = null;
let audioStatus = 'idle';
let dialogOpener = null;
let clockSchool = null;
let clockSchoolPosition = sanitizeClockPosition(null);
let clockReturn = false;
let letterDemo = { language: 'hebrew', form: 'alternate', index: 0, recorded: false };
let recognitionChoice = null;
let recognitionPreview = null;
let letterPad = null;
let writingWord = null, wordPad = null;
let lastTraceHint = 0;
let readingPractice = sanitizeReadingPractice(null);
let albumPageIndex = null;
let characterPractice = sanitizeCharacterPractice(null);
let drafts = {}, journeyDrafts = {}, awardedRounds = [], writingPractice = { mode:'trace', drafts:{} };
let learner = null, journeyController = null, journeyPlan = null, parkController = null, freeWriting = null, hub = 'hebrew';
let numberRound = null, numberDrafts = {}, numberController = null, numberSticker = null;
let companionController = null;
let actOutController = null;
let sciencePath = null, scienceDrafts = {}, scienceController = null;
let picnic = cleanPicnic(null), picnicRound = null, picnicController = null, picnicSticker = null;
let delivery = cleanDelivery(null), deliveryRound = null, deliveryController = null, deliverySticker = null;
let boatyard = cleanBoatyard(null), boatRound = null, boatController = null, boatSticker = null;
let daily = cleanDaily(null), dailyRound = null, dailyController = null, dailySticker = null, homeDailyItems = null;
let dailyDraftKey = 'today';
let theater = cleanTheater(null), theaterRound = null, theaterController = null, theaterSticker = null;
let homeItems = null;
const progressScreens = ['home', 'album', 'letters-menu', 'letters-writing', 'letters-recognition', 'characters-menu'];
const availableMissionIds = MISSION_IDS.filter(isPracticeAvailable);
const preferenceScreens = [...progressScreens, 'learning-hub', 'reading-levels', 'science-menu', 'number-menu', 'theater-map', 'theater-round', 'theater-studio', 'theater-complete'];

try {
  const saved = JSON.parse(gameStorage.getItem(STORAGE_KEY) || 'null');
  if (saved) {
    // Restore the established album before any optional adventure draft.
    settings=sanitizeSettings(saved.settings);progress=sanitizeProgress(saved.progress);
    readingPractice=sanitizeReadingPractice(saved.readingPractice);clockSchoolPosition=sanitizeClockPosition(saved.clockSchoolPosition);characterPractice=sanitizeCharacterPractice(saved.characterPractice);
    drafts=cleanDrafts(saved.drafts);
    journeyDrafts=Object.fromEntries(Object.values(saved.journeyDrafts||{}).slice(0,40).map(cleanJourney).filter(Boolean).map(p=>[`${p.mode}:${p.level}`,p]));
    numberDrafts = Object.fromEntries(Object.keys(NUMBER_PATHS).flatMap(path => {
      const savedRound = cleanNumberRound(saved.numberDrafts?.[path]);
      return savedRound?.path === path ? [[path, savedRound]] : [];
    }));
    for (const path of Object.keys(SCIENCE_EXPERIMENTS)) {
      const draft = cleanScienceRound(path, saved.scienceDrafts?.[path]);
      if (draft) scienceDrafts[path] = draft;
    }
    awardedRounds=(Array.isArray(saved.awardedRounds)?saved.awardedRounds:[]).filter(id=>/^[0-9a-f-]{36}$/i.test(id)).slice(-10000);
    if(Object.hasOwn(WRITING_STEPS,saved.writingPractice?.mode)){
      writingPractice={mode:saved.writingPractice.mode,drafts:saved.writingPractice.drafts&&typeof saved.writingPractice.drafts==='object'&&!Array.isArray(saved.writingPractice.drafts)?saved.writingPractice.drafts:{}};
      for (const language of Object.keys(LETTERS)) for (const form of WRITING_FORMS) {
        const draft = savedWritingWord(saved.writingPractice.words, language, form);
        if (draft) (writingPractice.words ??= {})[`${language}:${form}`] = { id: draft.word.id, index: draft.index };
      }
    }
    picnic = cleanPicnic(saved.picnic);
    delivery = cleanDelivery(saved.delivery);
    boatyard = cleanBoatyard(saved.boatyard);
    daily = cleanDaily(saved.daily);
    theater = cleanTheater(saved.theater);
  }
} catch { /* A corrupt or unavailable save must never prevent play. */ }

const album = new SharedAlbum({ config: SYNC_CONFIG, storage: gameStorage, localProgress: progress, onChange: source => {
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
  if (changed && progressScreens.includes(view)) {
    if (dialog.open) refreshAfterDialog = true;
    else render();
  }
  if (view === 'letters-lesson') updateWritingStatus();
  if (changed && view === 'clock-school') clockSchool?.updateProgress();
} });
if (album.linked) progress = album.progress;
learner = new LearningStore({ storage:gameStorage, config:SYNC_CONFIG, getCode:()=>album.code, onChange:()=>{
  const status=dialog.querySelector('.learning-sync-status');if(status)status.textContent=learningStatus(learner);
  if(view==='park')parkController?.update();
  if(view==='letters-lesson')updateWritingStatus();
  if (view === 'number-writing') numberController?.updateProgress();
  if (view === 'home' && homeItems && !dialog.open && learner.items !== homeItems) {
    const card = app.querySelector('#home-adventure');
    if (card && !card.contains(document.activeElement)) card.innerHTML = homeAdventureContent();
  }
  if (view === 'home' && !dialog.open && learner.items !== homeDailyItems) {
    const dailyCard = app.querySelector('#home-daily');
    if (dailyCard && !dailyCard.contains(document.activeElement)) dailyCard.innerHTML = homeDailyContent();
  }
} });

const narrator = new Narrator(status => {
  audioStatus = status;
  companions.narrationStatus(status);
  for (const replay of document.querySelectorAll('[data-action="replay"], [data-action="welcome"]')) replay.classList.toggle('is-speaking', status === 'speaking');
  const notice = document.querySelector('#audio-notice');
  if (notice) { notice.hidden = status !== 'unavailable'; notice.textContent = 'הקול לא נשמע? לחצי שוב על הרמקול. אפשר גם להיעזר בהורה.'; }
});
const companions = createCompanionGreetings(narrator.audio, () => settings.sound);
const stickerPlayer = createStickerPlayer({
  audio: narrator.audio,
  interrupt: () => { companions.stop(); narrator.stop(); },
  status: document.querySelector('#sticker-announcement'),
});
function stopStickerPlayback() {
  companions.stop();
  stickerPlayer.stop();
}
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
    const picnicSave = picnic.finished.length || Object.keys(picnic.drafts).length ? { picnic } : {};
    const deliverySave = delivery.finished.length || Object.keys(delivery.drafts).length ? { delivery } : {};
    const boatyardSave = boatyard.finished.length || Object.keys(boatyard.drafts).length ? { boatyard } : {};
    const dailySave = Object.keys(daily.drafts).length || daily.finished.clock || daily.finished.english ? { daily } : {};
    const studio = theater.studio;
    const theaterSave = theater.finished.length || Object.keys(theater.drafts).length || studio.shows.length || studio.draft.script.length
      || studio.draft.actor !== 'bobi' || studio.draft.set !== 'room' ? { theater } : {};
    gameStorage.setItem(STORAGE_KEY, JSON.stringify({ settings, progress, readingPractice, clockSchoolPosition, characterPractice, drafts, journeyDrafts, awardedRounds, writingPractice, ...(Object.keys(numberDrafts).length ? { numberDrafts } : {}), ...(Object.keys(scienceDrafts).length ? { scienceDrafts } : {}), ...picnicSave, ...deliverySave, ...boatyardSave, ...dailySave, ...theaterSave }));
    storageAvailable = true;
  } catch { storageAvailable = false; }
  return storageAvailable;
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
  if (!settings.sound) stopStickerPlayback();
}

function motionEnabled() {
  return settings.motion && !matchMedia('(prefers-reduced-motion: reduce)').matches;
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
  </header>${companionStickers()}`;
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

function recognitionGroup(language = settings.letterLanguage) {
  if (recognitionChoice) return recognitionChoice.map(id => LETTERS[language].find(letter => letter.id === id));
  if (recognitionPreview?.[0].language !== language) {
    recognitionPreview = recognitionTargets(progress.letterPractice, language, learner.items);
  }
  return recognitionPreview;
}

function letterGroupPreview(group, language) {
  return `<bdi class="letter-group-preview" dir="${language === 'hebrew' ? 'rtl' : 'ltr'}">${group.map(item => `<span>${item.familiar}</span>`).join('<span class="letter-group-dot" aria-hidden="true">·</span>')}</bdi>`;
}

function letterNavigation(mode = null) {
  const language = settings.letterLanguage;
  return `<div class="letter-lesson-topline"><button class="text-button" data-action="${mode ? 'letters-menu' : 'home'}">${uiIcon('home')} ${mode ? 'למסלולי האותיות' : 'לבית החברים'}</button><div class="letter-language-tabs" role="group" aria-label="שפת האותיות"><button data-action="letter-language" data-language="hebrew" aria-pressed="${language === 'hebrew'}">עברית · א</button><button data-action="letter-language" data-language="english" aria-pressed="${language === 'english'}"><bdi>English · A a</bdi></button></div></div>${mode ? `<div class="letter-language-tabs letter-mode-tabs" role="group" aria-label="דרך הלמידה"><button data-action="letter-mode" data-mode="recognition" aria-pressed="${mode === 'recognition'}">מזהות אותיות</button><button data-action="letter-mode" data-mode="writing" aria-pressed="${mode === 'writing'}">כותבות אותיות</button><button data-action="word-form-start">מתאימות מילים</button></div>` : ''}`;
}

function letterLibrary(language, mode) {
  let visits = progress.letterPractice[language][mode];
  const writing = mode !== 'recognition';
  if(writing)visits=writingVisits(language,mode==='writingMain'?'main':'alternate');
  return `<details class="letter-library"><summary>כל האותיות · בוחרות מה לתרגל</summary><div class="letter-library-grid" dir="${language === 'hebrew' ? 'rtl' : 'ltr'}">${LETTERS[language].map((item, index) => `<button data-action="letter-select" data-index="${index}" data-mode="${mode}" class="${visits[index] ? 'practiced' : ''}" aria-pressed="${writing ? index === letterDemo.index : recognitionChoice?.[0] === item.id}" aria-label="תרגול ${writing ? 'כתיבת' : 'זיהוי'} האות ${item.name}${visits[index] ? ' · כבר תרגלת' : ''}">${item.familiar}${visits[index] ? '<span class="letter-practiced" aria-hidden="true">✓</span>' : ''}${item.final ? '<small>סופית</small>' : ''}</button>`).join('')}</div></details>`;
}

function openLetterMenu() {
  narrator.stop(); round = null; recognitionChoice = null; view = 'letters-menu'; render(); focusTitle(); announcements.say('letters-paths-words');
}

function openLetterMode(mode) {
  narrator.stop(); round = null; recognitionChoice = null;
  recognitionPreview = null;
  if (mode === 'writing') { view = 'letters-writing'; render(); focusTitle(); announcements.say(`letters-writing-forms-${settings.letterLanguage}`); return; }
  view = 'letters-recognition'; render(); focusTitle(); announcements.say('letters-recognition');
}

function renderLetterMenu() {
  const language = settings.letterLanguage, letters = LETTERS[language];
  const wordDraft = drafts[roundKey('letters', { letterLanguage: language, letterMode: 'words' })];
  const matchWords = `<button class="letter-path-card word-form-path" data-action="word-form-start">${wordFormMenuArt(language, settings.nikud)}
    <h2>${settings.nikud ? 'מַתְאִימוֹת מִלִּים' : 'מתאימות מילים'}</h2><p>${language === 'hebrew' ? 'מוצאות את אותה מילה בכתב יד' : 'מוצאות את אותה מילה באותיות קטנות'}</p>
    <span class="letter-path-go">${wordDraft ? `ממשיכות מצעד ${wordDraft.index + 1}` : 'בואי נשחק'} ${uiIcon('arrow')}</span></button>`;
  const next = suggestedLetters(progress.letterPractice, language);
  const writing = suggestedLetters(progress.letterPractice, language, 'writing', 1, settings.letterWriting[language])[0];
  const mainWriting = writingLetter(language, LETTERS[language].indexOf(suggestedLetters(progress.letterPractice, language, 'writingMain', 1, settings.letterMainWriting[language])[0]), 'main');
  app.innerHTML = `${header()}<main id="main" class="letter-lesson-page letter-menu-page" dir="rtl" lang="he">${letterNavigation()}
    <section class="letter-path-heading"><span class="section-kicker">סטודיו האותיות · לולי לומדת איתך</span><h1 tabindex="-1">מה נרצה לגלות?</h1><p>${language === 'hebrew' ? 'דפוס וכתב יד · מזהות וגם כותבות' : 'אותיות גדולות וקטנות · מזהות וגם כותבות'}</p></section>
    <div class="letter-path-grid word-form-menu-grid"><button class="letter-path-card recognition-path" data-action="letter-mode" data-mode="recognition"><div class="letter-path-picture" dir="${language === 'hebrew' ? 'rtl' : 'ltr'}"><bdi>${next[0].familiar}</bdi><span aria-hidden="true">${language === 'hebrew' ? '←' : '→'}</span>${letterShape(next[0])}</div><h2>מזהות אותיות</h2><p>מוצאות את הצורה שמתאימה לאות המוכרת</p><small>תרגלת ${practicedLetterCount(progress.letterPractice, language, 'recognition')} מתוך ${letters.length} אותיות</small><span class="letter-path-go">בואי נשחק ${uiIcon('arrow')}</span></button>
    ${matchWords}<button class="letter-path-card writing-path" data-action="letter-mode" data-mode="writing"><div class="letter-path-picture letter-writing-preview">${letterShape(mainWriting)}${letterShape(writing)}${uiIcon('pencil')}</div><h2>כותבות אותיות</h2><p>${language === 'hebrew' ? 'בוחרות דפוס או כתב יד, ורואות איך כותבים' : 'בוחרות אותיות גדולות או קטנות, ורואות איך כותבים'}</p><small>כתבת ${writingCount(language,'alternate','all') + writingCount(language,'main','all')} מתוך ${letters.length * 2} צורות של אותיות</small><span class="letter-path-go">בואי נכתוב ${uiIcon('arrow')}</span></button></div>
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
    <p class="letter-route-description">${language === 'hebrew' ? 'מתאימות אות דפוס לאות בכתב יד. אחר כך מחפשות את אות הדפוס.' : 'מתאימות אות גדולה לאות קטנה. אחר כך מחפשות את האות הגדולה.'}</p>
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

function openWritingWord(id) {
  const { language, form } = letterDemo;
  const word = WRITING_WORDS[language].find(entry => entry.id === id);
  if (!word) return;
  const key = `${language}:${form}`;
  const draft = savedWritingWord(writingPractice.words, language, form);
  writingWord = { language, form, word, index: draft?.word === word ? draft.index : 0 };
  (writingPractice.words ??= {})[key] = { id, index: writingWord.index };
  save(); view = 'letters-word'; render(); focusTitle();
  wordPad.replay();
}

function renderWritingWord() {
  const { language, form, word } = writingWord;
  app.innerHTML = `${header()}<main id="main" class="letter-lesson-page letter-word-page" dir="rtl" lang="he"></main>${footer()}`;
  wordPad = mountWritingWord(document.querySelector('#main'), { ...writingWord, nikud: settings.nikud, motion: motionEnabled,
    speak: (clips, manual) => manual ? clockSpeak(clips) : announcements.say(clips),
    onTraced(letter, index) {
      const key = `${language}:${form}`;
      writingWord.index = index;
      if (index === word.indices.length) delete writingPractice.words[key];
      else writingPractice.words[key] = { id: word.id, index };
      const mode = writingMode(form);
      learner.record({item:`letter:${language}:${letter.id}:${form}:trace`,domain:'letters'},'practice','trace');
      if (album.linked) progress = album.recordWriting(language, letter.id, mode);
      else progress.letterPractice = recordLetters(progress.letterPractice, language, mode, [letter.id]);
      save();
    },
    onBack() {
      narrator.stop(); view = 'letters-lesson'; render();
      const picker = document.querySelector('.letter-word-picker');
      picker.open = true; picker.querySelector('summary').focus();
    },
  });
}

function renderLetterLesson() {
  const letter = demoLetter(), language = letterDemo.language, letters = LETTERS[language];
  const mode = writingMode(letterDemo.form), main = letterDemo.form === 'main';
  const direction = language === 'hebrew' ? 'rtl' : 'ltr';
  const draft = writingPractice.drafts[writingKey()];
  const covered = writingPractice.mode === 'memory' && draft?.hidden === true;
  const title = hiddenModel => letterHeading(letter, { id: 'writing-letter-title', hiddenModel });
  app.innerHTML = `${header()}<main id="main" class="letter-lesson-page" dir="rtl" lang="he" data-letter-language="${language}" data-writing-form="${letterDemo.form}">${letterNavigation('writing')}
    <section class="letter-lesson-card${covered ? ' memory-model-hidden' : ''}"><div class="question-heading"><div><span class="section-kicker">${language === 'hebrew' ? `כותבות ${main ? 'בדפוס' : 'בכתב יד'}` : `כותבות אותיות ${main ? 'גדולות' : 'קטנות'}`}</span>${title(covered)}</div><button class="circle-button" data-action="letter-sound" aria-label="שמיעת שם האות">${uiIcon('sound')}</button></div>
      ${letterFormTabs()}<div class="writing-steps" role="group" aria-label="דרך תרגול הכתיבה">${Object.entries(WRITING_STEPS).map(([id,label])=>`<button data-action="writing-step" data-step="${id}" aria-pressed="${writingPractice.mode===id}">${label}</button>`).join('')}</div>
      <p class="letter-route-progress" id="letter-writing-progress">כתבת ${writingCount(language,letterDemo.form)} מתוך ${letters.length} אותיות</p>
      <div class="letter-lesson-layout" dir="rtl"><div><div class="letter-pair" dir="${direction}"><div class="letter-form-card"><small dir="rtl">${language === 'hebrew' ? 'האות שאת מכירה · דפוס' : 'האות שאת מכירה · גדולה'}</small>${familiarGlyph(letter)}</div><span class="letter-pair-arrow" dir="ltr" aria-hidden="true">${language === 'hebrew' ? '←' : '→'}</span><div class="letter-form-card new-form"><small dir="rtl">${main ? language === 'hebrew' ? 'כך כותבים · דפוס' : 'כך כותבים · גדולה' : language === 'hebrew' ? 'אותה אות · כתב יד' : 'אותה אות · קטנה'}</small>${letterShape(letter)}</div></div>
      ${language === 'hebrew' ? `<div class="letter-name-row"><span>${letter.name}</span></div>` : ''}
      ${!main && language === 'english' && ['a', 'g'].includes(letter.small) ? `<p class="letter-book-note">בספרים אפשר לראות גם כך: <bdi class="letter-book-form">${letter.small}</bdi></p>` : ''}
      ${letter.final ? '<p class="letter-final-note">אות סופית · מופיעה בסוף מילה</p>' : ''}
      <p class="letter-copy">${writingPractice.mode==='trace'?'לחצי על העיפרון כדי לראות איך כותבים, ואז נסי בעצמך.':'נכתוב בקצב שלנו. בסיום נבחר סיימנו לתרגל.'}<br>לכל דרך תרגול יש התקדמות משלה.</p>
      <button class="text-button" data-action="replay" aria-label="שמיעת ההסבר שוב">${uiIcon('sound')} שמיעת ההסבר</button>
      <div class="letter-navigate" dir="${direction}"><button data-action="letter-previous" aria-label="האות הקודמת"><span aria-hidden="true">${language === 'hebrew' ? '→' : '←'}</span><span dir="rtl">הקודמת</span></button><span dir="ltr">${letterDemo.index + 1} / ${letters.length}</span><button data-action="letter-next" aria-label="האות הבאה"><span dir="rtl">הבאה</span><span aria-hidden="true">${language === 'hebrew' ? '←' : '→'}</span></button></div>
      </div><section class="letter-pad-card"><h2>מגלות איך כותבים</h2><div id="letter-writing-pad">${letterShape(letter, { guide: true, pad: true })}<p class="letter-pad-caption" role="status" aria-live="polite"></p></div><div class="letter-pad-controls"><button data-action="letter-demo">${uiIcon('pencil')} הראי לי איך</button><button data-action="letter-step">קו־קו</button><button data-action="letter-reset">${uiIcon('again')} מנסה בעצמי</button></div></section></div>
      <div class="letter-writing-continue"><button class="primary-button" data-action="letter-writing-continue" ${letterDemo.recorded ? '' : 'disabled'}>ממשיכות לאות הבאה ${uiIcon('arrow')}</button><small>אפשר גם לבחור כל אות מהאלפבית</small></div>
      <div class="name-writing"><span>אוֹתִיּוֹת הַשֵּׁם שֶׁלִּי:</span>${nameLetterButtons(language)}</div>${wordPicker(letter, letterDemo.form, settings.nikud, writingPractice.words)}
      ${letterExampleCards(letter,settings.nikud)}${letterLibrary(language, mode)}<p id="audio-notice" class="audio-notice" role="status" hidden></p>
    </section></main>${footer()}`;
  if (writingPractice.mode !== 'trace') {
    const host=document.querySelector('#letter-writing-pad'), key=writingKey();
    if(writingPractice.drafts[key]?.done)letterDemo.recorded=true;
    document.querySelector('.letter-pad-controls').hidden=true;
    freeWriting=mountFreeWriting(host,{letter,mode:writingPractice.mode,saved:draft,speak:keys=>announcements.say(keys),
      onCoverChange:hidden=>{
        document.getElementById('writing-letter-title').outerHTML = title(hidden);
        host.closest('.letter-lesson-card').classList.toggle('memory-model-hidden', hidden);
      },
      onSave:draft=>{writingPractice.drafts[key]={...draft,at:Date.now()};const inks=Object.entries(writingPractice.drafts).filter(([,v])=>v.lines?.length).sort((a,b)=>(b[1].at||0)-(a[1].at||0));for(const [oldKey]of inks.slice(8))writingPractice.drafts[oldKey].lines=[];save();},
      onComplete:method=>{letterDemo.recorded=true;learner.record({item:`letter:${language}:${letter.id}:${letterDemo.form}:${method}`,domain:'letters',eventId:`write:${key}:${Date.now()}`},'practice',method);save();updateWritingStatus();}
    });
    updateWritingStatus();return;
  }
  letterPad = mountLetterPad(document.querySelector('#letter-writing-pad'), {
    motion: motionEnabled,
    onComplete: () => {
      if (!letterDemo.recorded) {
        letterDemo.recorded = true;
        learner.record({item:`letter:${language}:${letter.id}:${letterDemo.form}:trace`,domain:'letters'},'practice','trace');
        if (album.linked) progress = album.recordWriting(language, letter.id, mode);
        else progress.letterPractice = recordLetters(progress.letterPractice, language, mode, [letter.id]);
        save(); updateWritingStatus();
      }
      announcements.say('letters-trace-done'); narrator.chime(); revealWin('.letter-pad-caption');
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
  focusTitle();
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
    returnToGame: clockReturn, practiceName: () => CLOCK_LEVELS[settings.clockLevel].name, motion: motionEnabled,
  });
}

function openClockLesson(returnToGame = false) {
  if (!CLOCK_ACTIVITIES_ENABLED) return;
  narrator.stop(); clockReturn = returnToGame;
  if (returnToGame) { round.helped.add(round.index);checkpoint(); }
  else round = null;
  view = 'clock-school'; render(); focusTitle(); clockSchool.replay();
}

function clockSpeak(keys) {
  if (!settings.sound) { settings.sound = true; narrator.enabled = true; save(); renderSoundButton(); }
  return announcements.say(keys);
}

function openCharacters() {
  narrator.stop(); round = null; view = 'characters-menu'; render(); focusTitle(); announcements.say(characterMenuClip());
}
function characterMenuClip() { return CHARACTER_COLLECTIONS[characterCollection(settings.characterLevel)].menuClip; }

function activityCount(id) { return id === 'characters' ? Object.values(characterPractice.completed).reduce((sum, count) => sum + count, 0) : progress.missions[id]; }

function activityButton({ action, level, mode, path }) {
  return `data-action="${action}"${level ? ` data-level="${level}"` : ''}${mode ? ` data-journey="${mode}"` : ''}${path ? ` data-path="${path}"` : ''}`;
}

function homeSuggestion() {
  return recommendAdventure({ items: learner.items, reading: settings.reading, readingPractice });
}

function homeAdventureContent() {
  const draft = currentDraft();
  homeItems = draft ? null : learner.items;
  const choice = draft ? describeDraft(draft) : homeSuggestion();
  const { activity, reason } = choice;
  const text = value => settings.nikud ? value : value.replace(/\p{M}/gu, '');
  return `<div class="home-adventure-copy">
    <p class="home-adventure-label">${text(draft ? 'הַהַרְפַּתְקָה שֶׁלָּךְ' : 'הַהַרְפַּתְקָה הַבָּאָה')}</p>
    <h2 id="home-adventure-title">${text(activity.he[0])}</h2><p id="home-adventure-detail">${text(reason)}</p>
    <button class="primary-button hero-start" ${activityButton(draft ? { action: 'resume' } : activity.route)} aria-describedby="home-adventure-title home-adventure-detail">${text(draft ? 'מַמְשִׁיכוֹת' : 'יוֹצְאוֹת לְהַרְפַּתְקָה')} ${uiIcon('arrow')}</button>
  </div>`;
}

function homeDailyContent() {
  homeDailyItems = learner.items;
  const saved = availableDailyDraft(daily.drafts)?.draft;
  const path = saved?.path || dailySuggestion(homeDailyItems, daily.finished, progress);
  return dailyHome(path, saved, settings.nikud);
}

function renderHome() {
  const cards = Object.values(MISSIONS).filter(m => isPracticeAvailable(m.id)).map(m => `<button class="mission-card ${m.color}" data-action="mission" data-mission="${m.id}" aria-label="${m.name} — ${m.description}">
    <div class="mission-art" aria-hidden="true">${m.id === 'characters' ? characterMissionArt() : ['hebrew', 'english', 'letters', 'math'].includes(m.id) ? '<span class="location-picture"></span>' : art(m.icon, 'mission-object') + pup(m.pup, 'mission-pup')}</div>
    <div class="mission-body"><span class="subject-tag" ${m.id === 'english' ? 'lang="en" dir="ltr"' : ''}>${m.subject}</span><h3>${m.name}</h3><p>${m.subtitle}</p><span class="mission-go" aria-hidden="true">${uiIcon('arrow')}</span></div>
    ${activityCount(m.id) ? `<span class="mission-done" aria-label="כבר סיימת ${activityCount(m.id)} הרפתקאות">${uiIcon('check')}</span>` : ''}
  </button>`);
  const science = isPracticeAvailable('science') ? `<button class="mission-card science-card" data-action="science-menu">
    <div class="mission-art" aria-hidden="true"><span class="art-orbit"></span><span class="lab-picture mission-object">${scienceArt('pepper')}</span>${pup('tofi', 'mission-pup')}</div>
    <div class="mission-body"><span class="subject-tag">מדע</span><h3>${SCIENCE_TITLE}</h3><p>מְנַסּוֹת וּמְגַלּוֹת מָה קוֹרֶה</p><span class="mission-go" aria-hidden="true">${uiIcon('arrow')}</span></div>
  </button>` : '';
  app.innerHTML = `${header()}<main id="main" class="home-page">
    <section class="hero" aria-labelledby="hero-title">
      <div class="hero-copy">
        <div class="hero-greeting">
          <h1 id="hero-title" tabindex="-1">שלום <bdi>${ARIEL.name}</bdi>!</h1>
        </div>
        <section class="home-adventure" id="home-adventure" aria-labelledby="home-adventure-title">${homeAdventureContent()}</section>
        <p id="audio-notice" class="audio-notice" role="status" hidden></p>
      </div>
      <div class="hero-world">${scene()}<button class="text-button welcome-listen" data-action="welcome">${uiIcon('sound')} לחצי ונכיר את החברים</button></div>
    </section>
    <div class="home-shortcuts">
      <div class="home-companions">
        <button type="button" class="home-pika-link home-pika-start companion-entry" data-action="pikachu">${pikachuImage('home-pikachu')}<span>${settings.nikud ? PIKACHU_TITLE : 'מחפשות עם פיקאצ׳ו'}</span>${uiIcon('arrow')}</button>
        <button type="button" class="home-stitch-link companion-entry" data-action="stitch">${stitchImage('home-stitch')}<span>${settings.nikud ? STITCH_TITLE : 'מחפשות עם סטיץ׳'}</span>${uiIcon('arrow')}</button>
      </div>
      <section class="daily-home" id="home-daily" aria-labelledby="daily-home-title">${homeDailyContent()}</section>
    </div>
    <section class="missions" aria-labelledby="missions-title"><div class="section-heading"><h2 id="missions-title">לאן נצא היום?</h2></div>
      <div class="mission-grid">${[...cards.slice(0, 2), science, ...cards.slice(2)].join('')}</div>
    </section>
    ${chapterEntry(settings.nikud)}
    <div class="home-collection">
    <section class="home-feature-card park-feature"><div>${pup('tofi')}</div><span><h3>הַפָּארְק שֶׁלִּי</h3><p>קִשּׁוּטִים, חֲבֵרִים וּמָקוֹם לַדִּמְיוֹן</p></span><button class="primary-button" data-action="park">בּוֹנִים וּמְשַׂחֲקִים ${uiIcon('arrow')}</button></section>
    <section class="home-feature-card album-feature"><div>${rewardSticker(progress.stickers.at(-1), 'star', 'home-album-sticker')}</div><span><h3>הָאַלְבּוֹם שֶׁלִּי</h3><p>${progress.stickers.length ? `${progress.stickers.length} מדבקות מחכות לך באלבום` : 'בכל הרפתקה שלמה מגלות מדבקה חדשה'}</p></span><button class="primary-button" data-action="album">לאלבום שלי ${uiIcon('arrow')}</button></section>
    </div>
  </main>${footer()}`;
}

function current() { return round?.questions[round.index]; }
function lastQuestion() { return round.index === round.questions.length - 1; }
function wordText(word) { return settings.nikud ? word.pointed : word.he; }
function tallyGroup(n, offset, item) {
  return `<div class="object-group ${n > 10 ? 'many' : ''}" role="group" aria-label="קבוצה לספירה">${Array.from({ length: n }, (_, i) => `<button class="count-object" data-action="tally" data-token="${offset + i}" aria-label="ספירת פריט ${offset + i + 1}">${art(item)}<span class="count-bubble" aria-hidden="true"></span></button>`).join('')}</div>`;
}

function letterRecognitionModel(q) {
  const model = q.direction === 'to-main' ? familiarGlyph(q.letter) : letterShape(q.letter);
  return `<div id="letter-recognition-model" class="letter-recognition-model" ${q.showModel || q.visualHintShown ? '' : 'hidden'}>${model}<span>זו אותה אות · נסתכל על הצורה</span></div>`;
}

function questionVisual(q) {
  if (q.type === 'character') return characterPictureQuestion(q);
  if (q.type === 'clock') return `<div class="clock-question-clock">${analogClock(q.time.hour, q.time.minute)}</div><button class="text-button clock-learn-link" data-action="clock-learn">${uiIcon('hint')} נזכרות איך קוראים שעון</button>`;
  if (q.direction === 'picture-sentence') return `<div class="caption-picture" role="img" aria-label="${q.word.he}">${art(q.word.id)}</div>`;
  if (q.type === 'listen') return `<button class="listen-orb" data-action="listen-word" aria-label="שמיעת המילה באנגלית">${uiIcon('sound')}<span class="sound-waves"><i></i><i></i><i></i><i></i><i></i></span><span>לחצי ושמעי את המילה</span></button>`;
  if (q.type === 'count') return `<div class="counting-stage">${tallyGroup(q.a, 0, q.item)}<p class="tally-instruction">אפשר לגעת בכל פריט ולספור ביחד</p></div>`;
  return `<div class="addition-stage ${Math.max(q.a, q.b) > 10 ? 'large-add' : ''}" dir="ltr"><div class="add-group">${tallyGroup(q.a, 0, q.item)}<span class="group-number">${q.a}</span></div><span class="plus-sign" aria-label="ועוד">+</span><div class="add-group">${tallyGroup(q.b, q.a, q.item)}<span class="group-number">${q.b}</span></div></div><div class="equation" dir="ltr" aria-label="${q.a} ועוד ${q.b}">${q.a} <span>+</span> ${q.b} <span>=</span> <b>?</b></div>`;
}

function answerVisual(q, option) {
  if (q.type === 'word-form') return wordFormOption(option, q.word.language);
  if (q.type === 'character') return characterAnswer(q, option, settings.nikud);
  if (q.type === 'letter') return q.direction === 'to-main' ? familiarGlyph(option) : letterShape(option);
  if (q.type === 'clock') return `<span class="clock-answer-time" dir="ltr">${option.digital}</span><span class="clock-answer-name">${option.he}</span>`;
  if (q.direction === 'picture-sentence') return `<span class="caption-text" lang="he" dir="rtl">${wordText(option)}</span>`;
  if (q.type === 'read') return art(option.id);
  if (q.kind === 'color') return `<span class="color-balloon" style="--balloon:${option.hex}"><i></i></span>`;
  if (q.type === 'count' || q.type === 'add' || q.kind === 'number') return `<span class="answer-number" dir="ltr">${option.number}</span>`;
  return art(option.id);
}

function answerLabel(q, option) {
  if (q.type === 'word-form') return q.word.language === 'english' ? option.plain.toLowerCase() : option.plain;
  if (q.type === 'character') return characterAnswerLabel(q, option);
  if (q.type === 'letter') return `${option.name} ${letterFormName(option.language, q.direction === 'to-main' ? 'main' : 'alternate')}`;
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
  const readingHeading = classicReadingHeading(q, settings.nikud);
  const wordMatch = q.type === 'word-form';
  const wordQuestion = q.word?.language === 'english'
    ? (settings.nikud ? 'אֵיפֹה אוֹתָהּ מִלָּה בְּאוֹתִיּוֹת קְטַנּוֹת?' : 'איפה אותה מילה באותיות קטנות?')
    : (settings.nikud ? 'אֵיפֹה אוֹתָהּ מִלָּה בִּכְתַב יָד?' : 'איפה אותה מילה בכתב יד?');
  const kicker = wordMatch ? wordQuestion : readingHeading?.instruction ?? ADVENTURE_PHASES[q.phase];
  const title = q.direction === 'picture-sentence' ? (settings.nikud ? CLIPS[q.prompt].text : 'איזה משפט מתאים לתמונה?') : q.type === 'character' ? 'מה השם של הדמות?' : q.type === 'clock' ? 'מה השעה בשעון?' : q.type === 'listen' ? 'מה שמעת באנגלית?' : q.type === 'add' ? 'כמה יש ביחד?' : 'כמה יש בסל?';
  const stage = q.type === 'read' ? round.reading === 'all' ? Object.values(READING_LEVELS).find(level => level.level === q.word.level) : READING_LEVELS[round.reading] : null;
  app.innerHTML = `${header()}<main id="main" class="game-page ${mission.color} ${wordMatch ? 'word-form-game' : q.type === 'character' ? 'character-game' : q.type === 'clock' ? 'clock-game' : q.type === 'letter' ? 'letter-game' : q.type === 'read' ? 'reading-game' : ''}${q.actOut ? ' act-out-game' : ''}">
    <div class="game-topline"><button class="text-button back-button" data-action="${q.type === 'character' ? 'characters-menu' : q.type === 'read' ? 'reading-levels' : (q.type === 'letter' || wordMatch) ? 'letters-menu' : 'home'}">${uiIcon('home')} ${q.type === 'character' ? 'לבחירת חברים' : q.type === 'read' ? 'לבחירת שלב' : (q.type === 'letter' || wordMatch) ? 'למסלולי האותיות' : 'למפת ההרפתקאות'}</button><span class="mission-label">${mission.name}${q.type === 'character' ? ` · שלב ${CHARACTER_LEVELS[round.characterLevel].number}` : ''}${wordMatch ? ' · מתאימות מילים' : q.type === 'letter' ? ' · משחק זיהוי' : ''}${stage ? ` · ${stage.number ? `שלב ${stage.number}` : stage.name}` : ''}</span><span class="step-label">צעד ${round.index + 1} מתוך ${length}</span></div>
    <div class="step-track" aria-label="התקדמות: ${round.index} מתוך ${length}">${round.questions.map((_, i) => `<span class="step-dot ${i < round.index ? 'done' : i === round.index ? 'current' : ''}">${i < round.index ? uiIcon('check') : i + 1}</span>`).join('')}</div>
    <section class="game-board${readingHeading ? ' reading-prompt' : ''}"><div class="question-heading"><div><span class="section-kicker">${kicker}</span>
      ${readingHeading?.html ?? `<h1 id="question-title" tabindex="-1">${title}</h1>`}</div>
      <button class="circle-button replay-button" ${readingHeading ? `data-action="read-prompt" data-clip="${readingHeading.clip}" aria-label="${readingHeading.speakerLabel}"` : 'data-action="replay" aria-label="שמיעת ההוראות שוב"'}>${uiIcon('sound')}</button></div>
      ${q.type === 'letter' ? letterRecognitionModel(q) : readingHeading ? '' : `<div class="question-visual">${questionVisual(q)}</div>`}
      ${q.actOut ? '<div id="act-out-root"></div>' : `<div class="answer-grid ${q.options.length === 2 ? 'two-options' : ''} ${q.type === 'character' ? q.direction === 'picture-name' ? 'character-names' : 'character-pictures' : ''} ${q.direction === 'picture-sentence' ? 'caption-options' : q.type === 'read' && q.word.scene ? 'scene-options' : ''} ${q.type === 'count' || q.type === 'add' || q.kind === 'number' ? 'numeric-options' : ''}" ${wordMatch ? `dir="${q.word.language === 'hebrew' ? 'rtl' : 'ltr'}"` : q.type === 'letter' ? `dir="${q.letter.language === 'hebrew' ? 'rtl' : 'ltr'}"` : ''} role="group" aria-label="בחירת תשובה">${q.options.map(option => `${q.type === 'clock' ? '<div class="clock-choice">' : ''}<button class="answer-button ${round.attempted.has(option.id) ? 'try-again' : ''}" data-action="answer" data-answer="${option.id}" ${wordMatch ? `lang="${q.word.language === 'english' ? 'en' : 'he'}"` : ''} aria-label="${answerLabel(q, option)}" ${round.attempted.has(option.id) ? 'disabled' : ''}>${answerVisual(q, option)}<span class="answer-check">${uiIcon('check')}</span></button>${q.type === 'clock' ? `<button class="clock-option-sound" data-action="clock-option-audio" data-clips="${option.clips.join(' ')}" aria-label="שמיעת האפשרות ${option.he}">${uiIcon('sound')}</button></div>` : ''}`).join('')}</div>`}
      <div class="feedback-row"><div class="feedback" id="feedback" role="status" aria-live="polite">קחי את הזמן. החברים כאן איתך ♡</div><button class="hint-button" data-action="hint">${uiIcon('hint')} רמז קטן</button><button class="primary-button next-button" data-action="next" hidden>ממשיכות ${uiIcon('arrow')}</button></div>
      <div id="letter-success-examples">${round.resolved && q.type==='letter' ? letterExampleCards(q.letter,settings.nikud) : ''}</div><p id="audio-notice" class="audio-notice" role="status" hidden></p>
    </section><div class="buddy-bar">${pup(mission.pup)}<span id="buddy-message">${{ luli: 'לולי', bobi: 'בובי', tofi: 'טופי' }[mission.pup]} כאן לעזור לך!</span><span class="buddy-hearts">♡ ♡ ♡</span></div>
  </main>${footer()}`;
  if (q.actOut) actOutController = mountActOut(document.querySelector('#act-out-root'), {
    word: q.word, roundId: round.id, moves: round.actOutMoves || [], resolved: round.resolved,
    nikud: settings.nikud, motion: () => settings.motion,
    onMove: (moves, complete) => {
      round.actOutMoves = moves;
      if (complete) resolveAnswer(q);
      else {
        checkpoint();
        document.querySelector('#feedback').textContent = settings.nikud ? `הֻנְּחוּ ${moves.length}. הַמְשִׁיכִי לְפִי הַמִּשְׁפָּט.` : `הונחו ${moves.length}. המשיכי לפי המשפט.`;
      }
    },
    onFinish: () => {
      const next = document.querySelector('.next-button');
      next.hidden = false;
      next.focus({ preventScroll: true });
    },
    onRetry: wrongPlace => {
      const [place, piece] = actOutDetails(q.word);
      if (guideStory(wrongPlace ? place : piece)) return;
      round.helped.add(round.index);
      document.querySelector('#feedback').textContent = settings.nikud ? 'נַסִּי שׁוּב. אֶפְשָׁר לִקְרֹא עוֹד פַּעַם.' : 'נסי שוב. אפשר לקרוא עוד פעם.';
      checkpoint();
      announcements.say('try-again');
    },
  });
}

function renderComplete() {
  const mission = MISSIONS[round.mission];
  const reading = round.mission === 'hebrew';
  const wordMatch = round.questions[0].type === 'word-form';
  const letters = round.mission === 'letters' && !wordMatch;
  const characters = round.mission === 'characters';
  const nextCharacters = characters ? nextCharacterLevel(round.characterLevel, round.helped.size) : null;
  const nextLetters = letters ? recognitionGroup(round.letterLanguage) : [];
  const nextKey = reading ? nextReadingStage(round.reading, round.helped.size) : null;
  const nextStage = nextKey ? READING_LEVELS[nextKey] : null;
  app.innerHTML = `${header()}<main id="main" class="completion-page">
    <div class="completion-stars">✦ <span>✧</span> ✦</div>${rewardSticker(round.sticker, mission.sticker, 'reward-art')}
    <div class="eyebrow">החברים שמחים כל כך!</div><h1 tabindex="-1">יש! עשית את זה!</h1>
    <p>סיימת את ${mission.name}${wordMatch ? ` · התאמת מילים ב${round.letterLanguage === 'english' ? 'אנגלית' : 'עברית'}` : ''}${characters ? ` · שלב ${CHARACTER_LEVELS[round.characterLevel].number}` : ''}${reading && READING_LEVELS[round.reading]?.number ? ` · שלב ${READING_LEVELS[round.reading].number}` : ''}.</p>
    <p class="reward-caption">${round.sticker ? 'מדבקה חדשה הצטרפה לאלבום שלך' : 'עוד הרפתקה נפלאה עם החברים'}</p>
    ${reading ? `<section class="reading-next-offer"><span class="section-kicker">יש עוד דברים חדשים לגלות!</span>${nextStage ? `<button class="primary-button" data-action="reading-level" data-level="${nextKey}">ממשיכות לשלב ${nextStage.number} ${uiIcon('arrow')}</button><small>${nextStage.name}</small>` : `<button class="primary-button" data-action="reading-level" data-level="${round.reading}">קוראות עוד ביחד ${uiIcon('arrow')}</button>`}</section>` : ''}
    ${wordMatch ? `<button class="primary-button" data-action="word-form-start">עוד שש מילים ${uiIcon('arrow')}</button>` : ''}
    ${letters ? `<section class="letter-next-offer"><span class="section-kicker">תרגלת ${practicedLetterCount(progress.letterPractice, round.letterLanguage, 'recognition')} מתוך ${LETTERS[round.letterLanguage].length} אותיות</span>${letterGroupPreview(nextLetters, round.letterLanguage)}<button class="primary-button" data-action="letter-recognition-next">ממשיכות לאותיות הבאות ${uiIcon('arrow')}</button></section>` : ''}
    ${characters ? `<section class="character-next-offer"><span class="section-kicker">החברים שמחים לפגוש אותך!</span>${nextCharacters ? `<button class="primary-button" data-action="character-advance" data-level="${nextCharacters}">ממשיכות לשלב ${CHARACTER_LEVELS[nextCharacters].number} ${uiIcon('arrow')}</button><small>${CHARACTER_LEVELS[nextCharacters].name}</small>` : `<button class="primary-button" data-action="character-repeat">עוד הרפתקה עם החברים ${uiIcon('arrow')}</button>`}</section>` : ''}
    <div class="completion-pups">${pup('luli')}${pup('bobi')}${pup('tofi')}</div>
    <div class="completion-actions"><button class="${reading || letters || wordMatch || characters ? 'secondary-button' : 'primary-button'}" data-action="album">למדבקות שלי ${uiIcon('album')}</button>
    ${reading ? `${nextStage ? `<button class="secondary-button" data-action="reading-level" data-level="${round.reading}">עוד בשלב הזה</button>` : ''}<button class="text-button" data-action="reading-levels">לכל שלבי הקריאה</button>` : ''}
    ${wordMatch ? '<button class="text-button" data-action="letters-menu">למסלולי האותיות</button>' : ''}
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
    <button class="secondary-button reading-caption-entry" data-action="reading-level" data-level="captions">${settings.nikud ? 'מִתְּמוּנָה לְמִשְׁפָּט' : 'מתמונה למשפט'} ${uiIcon('arrow')}</button>
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
    ${!album.linked ? `<aside class="album-connect-note"><p>המדבקות שמורות בדפדפן הזה. כדי לראות את אותו האלבום בדפדפן או במכשיר נוסף, מחברים אותם לאותו קוד משפחתי.</p><button class="text-button" data-action="parents">חיבור האלבום עם הורה ${uiIcon('settings')}</button></aside>` : ''}
    <nav class="album-pagination" aria-label="דפדוף בראש האלבום">${previousButton}<label class="album-page-select"><span>עמוד ${page.index + 1} מתוך ${page.pageCount}</span><select data-album-page aria-label="בחירת עמוד באלבום">${Array.from({ length: page.pageCount }, (_, index) => `<option value="${index}" ${index === page.index ? 'selected' : ''}>עמוד ${index + 1}</option>`).join('')}</select></label>${nextButton}</nav>
    <p class="album-page-range" role="status">מדבקות <bdi dir="ltr">${page.start + 1}–${page.end}</bdi></p>
    ${page.collected ? '<button class="text-button album-latest" data-action="album-latest">למדבקה האחרונה שלי</button>' : ''}
    ${page.entries.some(entry => entry.unlocked) ? `<p class="album-play-hint">${settings.nikud ? 'גְּעִי בְּמַדְבֵּקָה וּגְלִי מָה קוֹרֶה!' : 'געי במדבקה וגלי מה קורה!'}</p>` : ''}
    <div class="sticker-grid">${page.entries.map(albumSticker).join('')}</div>
    <nav class="album-pagination album-bottom-pages" aria-label="דפדוף בתחתית האלבום">${previousButton}${nextButton}</nav>
    <button class="primary-button" ${activityButton(homeSuggestion().activity.route)}>יוצאות להרפתקה ${uiIcon('arrow')}</button></main>${footer()}`;
}

function turnAlbumPage(index) {
  albumPageIndex = index;
  render(); focusTitle();
}

function render() {
  stopStickerPlayback();
  freeWriting?.destroy(); freeWriting=null;
  journeyController?.destroy(); journeyController=null;
  numberController?.destroy(); numberController=null;
  parkController?.destroy(); parkController=null;
  companionController?.destroy(); companionController=null;
  actOutController?.destroy(); actOutController=null;
  scienceController?.destroy(); scienceController=null;
  picnicController?.destroy(); picnicController=null;
  deliveryController?.destroy(); deliveryController=null;
  boatController?.destroy(); boatController=null;
  dailyController?.destroy(); dailyController=null;
  theaterController?.destroy(); theaterController=null;
  letterPad?.destroy(); letterPad = null;
  wordPad?.destroy(); wordPad = null;
  clockSchool?.destroy(); clockSchool = null;
  applyPreferences();
  document.body.classList.toggle('playing', view === 'game');
  if (view === 'journey') renderJourney();
  else if (view === 'learning-hub') renderLearningHub();
  else if (view === 'number-menu') app.innerHTML = header() + numberMenu(numberDrafts) + footer();
  else if (view === 'number-round') renderNumberRound();
  else if (view === 'number-writing') renderNumberWriting();
  else if (view === 'number-dictation') renderNumberDictation();
  else if (view === 'fruit-cutting') renderFruitCutting();
  else if (view === 'number-complete') app.innerHTML = header() + numberComplete(numberRound, numberSticker) + footer();
  else if (view === 'pikachu' || view === 'stitch') renderCompanion();
  else if (view === 'science-menu') app.innerHTML = header() + scienceMenu(scienceDrafts, settings.nikud) + footer();
  else if (view === 'science-round') renderScience();
  else if (view === 'chapters') app.innerHTML = header() + chapterMap({ picnic, delivery, boatyard, theater }, settings.nikud) + footer();
  else if (view === 'picnic-map') app.innerHTML = header() + picnicMap(picnic, settings.nikud) + footer();
  else if (view === 'picnic-round') renderPicnicRound();
  else if (view === 'picnic-complete') app.innerHTML = header() + picnicComplete(picnicRound, picnicSticker, picnic.finished, settings.nikud) + footer();
  else if (view === 'delivery-map') app.innerHTML = header() + deliveryMap(delivery, deliveryPairReady(learner.items), settings.nikud) + footer();
  else if (view === 'delivery-round') renderDeliveryRound();
  else if (view === 'delivery-complete') app.innerHTML = header() + deliveryComplete(deliveryRound, deliverySticker, delivery.finished, settings.nikud) + footer();
  else if (view === 'boatyard-map') app.innerHTML = header() + boatyardMap(boatyard, settings.nikud) + footer();
  else if (view === 'boatyard-round') renderBoatyardRound();
  else if (view === 'boatyard-complete') app.innerHTML = header() + boatyardComplete(boatRound, boatSticker, boatyard.finished, settings.nikud) + footer();
  else if (view === 'daily-round') renderDailyRound();
  else if (view === 'daily-complete') app.innerHTML = header() + dailyComplete(dailyRound, dailySticker, settings.nikud) + footer();
  else if (view === 'theater-map') app.innerHTML = header() + theaterMap(theater, settings.nikud) + footer();
  else if (view === 'theater-round' || view === 'theater-studio') renderTheater();
  else if (view === 'theater-complete') app.innerHTML = header() + theaterComplete(theaterRound, theaterSticker, settings.nikud) + footer();
  else if (view === 'park') renderPark();
  else if (view === 'journey-complete') renderJourneyComplete();
  else if (view === 'game') { renderGame(); restoreQuestionState(); }
  else if (view === 'clock-school') renderClockSchool();
  else if (view === 'letters-lesson') renderLetterLesson();
  else if (view === 'letters-word') renderWritingWord();
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

function startMission(mission, skipLesson = false, letterMode = 'recognition') {
  if (!isPracticeAvailable(mission)) return;
  if (mission === 'characters' && !skipLesson) { openCharacters(); return; }
  if (mission === 'math') { openNumberMenu(); return; }
  if (['hebrew','english'].includes(mission) && !skipLesson) { openLearningHub(mission); return; }
  if (mission === 'clock' && !skipLesson) { openClockLesson(); return; }
  if (mission === 'letters' && !skipLesson) { openLetterMenu(); return; }
  narrator.stop();
  checkpoint();
  const key=roundKey(mission,{ ...settings, letterMode }), restored=unpackRound(drafts[key]);
  if(restored){
    round=restored;view='game';render();focusTitle();
    if (current().type === 'word-form' && !round.resolved) announcements.say(current().prompt);
    return;
  }
  const letterIds = mission === 'letters' && letterMode !== 'words' ? recognitionGroup().map(letter => letter.id) : null;
  if (letterIds) recognitionPreview = null;
  const questions = createSession(mission, { ...settings, letterMode, learning:learner.items, readingRecent: readingPractice.recent[settings.reading], letterPractice: progress.letterPractice, letterIds, characterPractice });
  if (mission === 'hebrew' && settings.reading === LITTLE_STORIES.route.level) {
    for (const index of actOutSteps(questions)) {
      const question = questions[index];
      Object.assign(question, { actOut: true, prompt: actOutPrompt(question.word) });
    }
  }
  round = { id:crypto.randomUUID(), key, observed:new Set(), mission, questions, letterIds, letterLanguage: settings.letterLanguage, reading: settings.reading, clockLevel: settings.clockLevel, characterLevel: settings.characterLevel, characterMode: settings.characterMode, index: 0, resolved: false, attempted: new Set(), counted: new Set(), helped: new Set(questions.flatMap((q, i) => q.showModel ? [i] : [])), sticker: null, awarded: false };
  view = 'game'; checkpoint();
  render();
  focusTitle();
  const q = current();
  announcements.say(['good-luck', ...(mission === 'characters' ? round.characterMode === 'mixed' ? ['characters-intro', q.prompt] : [q.prompt] : mission === 'hebrew' ? [...new Set([READING_LEVELS[round.reading].clip, q.prompt])] : [mission === 'letters' ? q.prompt : MISSIONS[mission].intro]), ...(q.showModel ? ['letters-recognition-hint'] : []), ...(q.targetClip ? [q.targetClip] : [])]);
}

function startReadingLevel(level) {
  if (!Object.hasOwn(READING_LEVELS, level)) return;
  settings.reading = level;
  startMission('hebrew', true);
}

function leaveTo(destination) {
  narrator.stop();
  checkpoint();
  const leave = () => { journeyPlan=null; round = null; recognitionChoice = null; view = destination; render(); focusTitle(); announcements.say(destination === 'characters-menu' ? characterMenuClip() : destination === 'letters-menu' ? 'letters-paths-words' : destination === 'reading-levels' ? 'reading-levels' : destination === 'home' ? 'choose-activity' : 'stickers'); };
  if (view !== 'game') { leave(); return; }
  openDialog(`<h2 id="parent-title">${destination === 'characters-menu' ? 'נחזור לבחירת החברים?' : destination === 'letters-menu' ? 'נחזור למסלולי האותיות?' : destination === 'reading-levels' ? 'נבחר שלב אחר?' : 'נחזור לבית החברים?'}</h2><p>ההרפתקה נשמרת. אפשר להמשיך מאותו צעד כשחוזרים, או לבחור משחק אחר.</p><div class="dialog-actions"><button class="primary-button" data-dialog="stay">ממשיכות לשחק</button><button class="secondary-button" data-dialog="leave">${destination === 'characters-menu' ? 'לבחירת החברים' : destination === 'letters-menu' ? 'למסלולי האותיות' : destination === 'reading-levels' ? 'בוחרות שלב' : 'חוזרות הביתה'}</button></div>`);
  dialog.querySelector('[data-dialog="stay"]').onclick = closeDialog;
  dialog.querySelector('[data-dialog="leave"]').onclick = () => { closeDialog(); leave(); };
}

function replay() {
  if (view === 'letters-word') { wordPad.replay(); return; }
  if (!settings.sound) { settings.sound = true; save(); narrator.enabled = true; renderSoundButton(); }
  if(view==='journey'){journeyController?.replay();return;}
  if (['number-round', 'number-writing', 'number-dictation', 'fruit-cutting'].includes(view)) { numberController?.replay(); return; }
  if (view === 'number-menu') { announcements.say(numberClip('menu')); return; }
  if (view === 'science-menu') { announcements.say(scienceClip('menu')); return; }
  if (view === 'science-round') { scienceController.replay(); return; }
  if (view === 'picnic-map') { announcements.say(PICNIC.intro); return; }
  if (view === 'picnic-round') { picnicController?.replay(); return; }
  if (view === 'picnic-complete') { announcements.say(completionClip(picnicSticker)); return; }
  if (view === 'delivery-map') { announcements.say(DELIVERY.intro); return; }
  if (view === 'delivery-round') { deliveryController?.replay(); return; }
  if (view === 'delivery-complete') { announcements.say(completionClip(deliverySticker)); return; }
  if (view === 'boatyard-map') { announcements.say(BOATYARD.intro); return; }
  if (view === 'boatyard-round') { boatController?.replay(); return; }
  if (view === 'boatyard-complete') { announcements.say(completionClip(boatSticker)); return; }
  if (view === 'daily-round') { dailyController?.replay(); return; }
  if (view === 'daily-complete') { announcements.say(completionClip(dailySticker)); return; }
  if (view === 'theater-map') { clockSpeak(THEATER.intro); return; }
  if (view === 'theater-round' || view === 'theater-studio') { theaterController?.replay(); return; }
  if (view === 'theater-complete') { announcements.say(completionClip(theaterSticker)); return; }
  if(view==='park'){clockSpeak('journey-park-intro');return;}
  if (view === 'clock-school') { clockSchool.replay(true); return; }
  if (view === 'game') {
    const q = current();
    announcements.say([q.prompt, ...(q.targetClip ? [q.targetClip] : [])]);
  } else announcements.say(view === 'characters-menu' ? characterMenuClip() : view === 'reading-levels' ? 'reading-levels' : view === 'letters-menu' ? 'letters-paths-words' : view === 'letters-writing' ? `letters-writing-forms-${settings.letterLanguage}` : view === 'letters-recognition' ? 'letters-recognition' : view === 'letters-lesson' ? letterNarration() : view === 'clock-lesson' ? 'intro-clock' : view === 'album' ? 'stickers' : 'welcome');
}

function renderSoundButton() {
  const button = document.querySelector('.sound-toggle');
  if (button) { button.innerHTML = uiIcon(settings.sound ? 'sound' : 'muted'); button.setAttribute('aria-pressed', String(settings.sound)); button.setAttribute('aria-label', settings.sound ? 'כיבוי הקול' : 'הפעלת הקול'); }
}

function inLittleStories() {
  return round?.mission === 'hebrew' && round.reading === LITTLE_STORIES.route.level;
}

function paintStoryClue() {
  const clue = storyClue(current().word, round.storyClue);
  if (!clue) return;
  document.querySelectorAll('#question-title .reading-token').forEach((token, index) => {
    token.classList.toggle('story-clue-token', index >= clue.start && index < clue.end);
  });
  const { text, plain } = CLIPS[clue.clip];
  const feedback = document.querySelector('#feedback');
  feedback.textContent = settings.nikud ? text : plain;
  feedback.classList.add('story-clue-feedback');
  document.querySelector('.hint-button').innerHTML = `${uiIcon('sound')} שמיעת המשפט`;
}

function guideStory(field) {
  if (!inLittleStories()) return false;
  const clue = storyClue(current().word, field);
  if (!clue) return false;
  round.storyClue = field;
  round.helped.add(round.index);
  if (round.storyReview === undefined) {
    const review = storyReviewQuestion(round.questions, round.index, field);
    if (review) {
      round.questions[review.slot] = review.question;
      round.storyReview = review.slot;
    }
  }
  checkpoint();
  paintStoryClue();
  document.querySelector('.story-clue-token')?.scrollIntoView({ block: 'nearest' });
  announcements.say(clue.clip);
  return true;
}

function hint() {
  if (round.resolved) return;
  const q = current();
  if (inLittleStories()) {
    if (round.storyClue) {
      announcements.say(`he-${q.word.id}`, { slow: true });
      return;
    }
    if (guideStory(firstStoryClue(q))) return;
  }
  if (q.type === 'letter') q.visualHintShown = true;
  round.helped.add(round.index); checkpoint();
  if (q.type === 'word-form') {
    document.querySelector('#feedback').textContent = settings.nikud ? CLIPS[q.hint].text : CLIPS[q.hint].text.replace(/\p{M}/gu, '');
    announcements.say(q.hint, { slow: true });
    return;
  }
  if (q.direction === 'picture-sentence') {
    document.querySelector('#feedback').textContent = settings.nikud ? CLIPS[q.hint].text : 'בואי נשמע מה רואים בתמונה.';
    announcements.say([q.hint, `he-${q.word.id}`], { slow: true });
    return;
  }
  if (q.type === 'character') {
    document.querySelector('#feedback').textContent = 'נשמע את השם ביחד, ונמשיך לנסות ♡';
    announcements.say([q.hint, q.character.clip]); return;
  }
  if (q.type === 'letter') {
    document.querySelector('#letter-recognition-model').hidden = false;
    document.querySelector('#feedback').textContent = 'זו אותה אות. נסתכל על הצורה שלה ונמצא אותה למטה.';
    announcements.say(['letters-recognition-hint', q.letter.clip]); return;
  }
  if (q.type === 'clock') {
    document.querySelector('#feedback').textContent = q.time.minute === 0 ? 'נתחיל מהמחוג הקצר והסגול. על איזה מספר הוא מצביע?' : 'נבדוק את המחוג הארוך, ואז נסתכל על המחוג הקצר.';
    const face = document.querySelector('.clock-question-clock .analog-clock');
    face.classList.remove('highlight-hour', 'highlight-minute'); face.classList.add(q.time.minute === 0 ? 'highlight-hour' : 'highlight-minute');
    announcements.say(q.hint); return;
  }
  document.querySelector('#feedback').textContent = q.actOut ? 'נקשיב למשפט ונשחק את מה שקורה בו.' : q.type === 'read' ? 'נשמע מה כתוב, ואז נחפש את התמונה.' : q.type === 'listen' ? 'נקשיב שוב לאט. איזו תמונה מתאימה?' : 'געי בפריטים אחד־אחד. נמשיך לספור יחד.';
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
  if (button.dataset.answer !== q.answer) {
    round.attempted.add(button.dataset.answer);
    round.helped.add(round.index);
    button.classList.add('try-again');
    button.disabled = true;
    if (inLittleStories() && guideStory(pictureClue(q.word, q.options.find(option => option.id === button.dataset.answer)))) return;
    document.querySelector('#feedback').textContent = 'נסי שוב, אריאל. אני כאן איתך ♡';
    checkpoint(); announcements.say('try-again');
    return;
  }
  resolveAnswer(q, button);
}

function resolveAnswer(q, button = null) {
  const feedback = document.querySelector('#feedback');
  round.resolved = true;
  if (!round.observed.has(round.index)) { learner.record({...questionLearning(q),eventId:`${round.id}:${round.index}`},round.helped.has(round.index)?'helped':'independent'); round.observed.add(round.index); }
  checkpoint();
  button?.classList.add('correct');
  for (const option of document.querySelectorAll('.answer-button')) option.disabled = true;
  document.querySelector('.hint-button').hidden = true;
  const lessonLink = document.querySelector('[data-action="clock-learn"]');
  if (lessonLink) lessonLink.disabled = true;
  const next = document.querySelector('.next-button');
  next.hidden = false;
  if (lastQuestion()) next.innerHTML = `למדבקה שלי ${uiIcon('arrow')}`;
  const answerText = q.type === 'word-form' ? answerLabel(q, q.word) : q.type === 'character' ? characterName(q.character, settings.nikud) : q.type === 'letter' ? q.letter.familiar : q.type === 'clock' ? `השעה ${q.time.he}` : q.type === 'read' ? wordText(q.word) : q.type === 'listen' ? q.target.en : `${q.total}`;
  feedback.innerHTML = `${uiIcon('check')} <span>כל הכבוד! <b ${q.type === 'listen' || (q.type === 'word-form' && q.word.language === 'english') ? 'lang="en" dir="ltr"' : ''}>${answerText}</b></span>`;
  feedback.classList.remove('story-clue-feedback');
  feedback.classList.add('success');
  if(q.type==='letter')document.querySelector('#letter-success-examples').innerHTML=letterExampleCards(q.letter,settings.nikud);
  document.querySelector('.buddy-bar').classList.add('celebrating');
  document.querySelector('#buddy-message').textContent = 'יש! הצלחת!';
  announcements.say([`correct-${1 + round.index % 3}`, ...(q.type === 'word-form' ? [q.word.clip] : q.type === 'character' ? [q.character.clip] : q.type === 'clock' ? q.time.clips : q.type === 'read' ? [`he-${q.word.id}`] : q.targetClip ? [q.targetClip] : [])]);
  narrator.chime();
  feedback.classList.add('feedback-reveal');
  if (!q.actOut) next.focus({ preventScroll: q.type !== 'character' && q.type !== 'clock' && !(q.type === 'read' && q.word.scene) });
}

function nextQuestion() {
  if (!round?.resolved) return;
  if (lastQuestion()) {
    finishClassicRound();
    return;
  }
  round.index++;
  round.resolved = false;
  round.attempted = new Set();
  round.counted = new Set();
  delete round.actOutMoves;
  delete round.storyClue;
  checkpoint(); render(); focusTitle();
  document.querySelector('.game-board')?.classList.add('step-enter');
  const q = current();
  announcements.say([q.prompt, ...(q.showModel ? ['letters-recognition-hint'] : []), ...(q.targetClip ? [q.targetClip] : [])]);
}

function finishClassicRound() {
  const mission = round.mission;
  const letters = mission === 'letters' && round.questions[0].type === 'letter' ? { language: round.letterLanguage, ids: round.letterIds } : null;
  const reward = finishScoredRound(round, drafts, round.key,
    (id, length) => awardRound(mission, round.helped.size, letters, id, length));
  if (!reward) return;
  progress = reward.progress;
  round.sticker = reward.sticker;
  if (mission === 'hebrew') readingPractice = finishReadingPractice(readingPractice, round.reading, round.questions.map(q => q.word));
  if (mission === 'characters') characterPractice = finishCharacterPractice(characterPractice, round.characterLevel, round.questions);
  if (letters) { recognitionChoice = null; recognitionPreview = null; }
  view = 'complete'; save(); render(); focusTitle(); revealWin('.reward-art');
  const nextReading = mission === 'hebrew' && nextReadingStage(round.reading, round.helped.size);
  const nextCharacter = mission === 'characters' && nextCharacterLevel(round.characterLevel, round.helped.size);
  announcements.say([completionClip(round.sticker), ...(nextReading || nextCharacter ? ['reading-next']
    : mission === 'hebrew' ? ['reading-more'] : [])]);
}

function completionClip(sticker) {
  return sticker ? 'complete' : progress.stickers.length === STICKERS.length ? 'complete-all' : 'correct-1';
}

function revealWin(selector) {
  document.querySelector(selector)?.classList.add('reward-reveal');
}

function openDialog(content) {
  stopStickerPlayback();
  if (!dialog.open) dialogOpener = document.activeElement;
  dialog.innerHTML = `<button class="dialog-close circle-button" aria-label="סגירה" data-dialog="close">${uiIcon('close')}</button>${companionStickers()}${content}`;
  dialog.querySelector('[data-dialog="close"]').onclick = closeDialog;
  if (!dialog.open) dialog.showModal();
}

function closeDialog(updatePreferences = false) {
  stopStickerPlayback();
  const action = dialogOpener?.dataset.action;
  dialog.close();
  const refresh = refreshAfterDialog && progressScreens.includes(view) || updatePreferences === true && preferenceScreens.includes(view);
  refreshAfterDialog = false;
  if (refresh) render();
  const opener = dialogOpener?.isConnected ? dialogOpener : action && app.querySelector(`[data-action="${action}"]`);
  opener?.focus({ preventScroll: true });
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
    ${CLOCK_ACTIVITIES_ENABLED ? `<label class="setting-row"><span>קריאת שעון</span><select name="clockLevel">${Object.entries(CLOCK_LEVELS).map(([key, level]) => `<option value="${key}" ${settings.clockLevel === key ? 'selected' : ''}>${level.name}</option>`).join('')}</select></label>` : ''}
    <label class="setting-toggle"><span><b>קול והנחיות</b><small>הקלטות בעברית ובאנגלית</small></span><input name="sound" type="checkbox" ${settings.sound ? 'checked' : ''}></label>
    <label class="setting-toggle"><span><b>תנועה וחגיגות</b><small>כיבוי מצמצם אנימציות</small></span><input name="motion" type="checkbox" ${settings.motion ? 'checked' : ''}></label>
    <p class="parent-note">בהרפתקה הבאה יופעלו הגדרות התרגול שבחרתם. באנגלית מתחילים בהקשבה. תרגול קריאה וכתיבה מופיע במסלולים משלו.</p>
    <button class="primary-button" type="submit">שמירת ההגדרות ${uiIcon('check')}</button></form>
    <section class="parent-progress"><h3>מה כבר גילינו?</h3><p id="parent-progress-summary">${progress.sessions} הרפתקאות שלמות · ${progress.stickers.length} מדבקות</p><table><thead><tr><th>תחום</th><th>תשובות ללא עזרה</th><th>עם הדגמה, רמז או ניסיון נוסף</th></tr></thead><tbody>${availableMissionIds.map(id => MISSIONS[id]).map(m => `<tr><th>${m.id === 'hebrew' ? 'עברית · מילים ושמות' : m.subject}</th><td data-independent="${m.id}">${progress.skills[m.id].correct - progress.skills[m.id].assisted}</td><td data-assisted="${m.id}">${progress.skills[m.id].assisted}</td></tr>`).join('')}</tbody></table><p class="parent-note">מוצגות רק הרפתקאות שהושלמו. זהו תיעוד משחק, ולא מבחן או הערכת יכולת.</p></section>
    <div id="learning-parent">${parentLearning(learner)}</div>
    <section id="family-panel"></section>
    <section class="offline-panel"><h3>משחק בלי אינטרנט</h3><p role="status">מכינות את המשחק לשימוש בלי אינטרנט…</p><button class="secondary-button" type="button" disabled>הורדת ההקלטות</button></section>
    <p class="parent-note character-art-credit">איורי הדמויות: PAW Patrol / Rubble &amp; Crew © Spin Master Ltd. · <a href="https://dev.pawpatrol.com/character-guide" target="_blank" rel="noopener noreferrer">מדריך הדמויות הרשמי של מפרץ ההרפתקאות</a> · <a href="https://images.squarespace-cdn.com/content/v1/5595e2eee4b0b03840079b28/1685761053151-FY46DCUKCA43ODFF4MKK/image-asset.jpeg" target="_blank" rel="noopener noreferrer">McCown Design Agency</a>. משחק השמות נכלל בתחום עברית.</p>
    <p class="privacy-note">האלבום המשפחתי משתף מדבקות, התקדמות, היסטוריית למידה ופארק עם המכשירים שחוברו אליו בקוד. הרפתקאות פתוחות נשמרות בדפדפן שבו התחילו, וציורי הכתיבה נשארים במכשיר.</p>
    <p class="parent-note">הדמות סטיץ׳ שייכת לדיסני. האיור באדיבות <a href="https://www.disneyclips.com/images/lilostitch.html" target="_blank" rel="noopener noreferrer">Disneyclips.com</a>.</p>
    <p class="parent-note">איורים נוספים: <a href="assets/Twemoji-LICENSE.txt" target="_blank" rel="noopener">Twemoji · רישיון ושמות היוצרים</a>. כל התמונות שמורות בתוך המשחק.</p>
    <p class="save-notice" ${storageAvailable ? 'hidden' : ''}>הדפדפן לא מאפשר שמירה כרגע. אפשר לשחק, אבל ההתקדמות עלולה להיעלם בסגירה.</p>
    <button class="text-button reset-button" data-dialog="reset">${album.linked ? 'ניתוק מהאלבום ואיפוס המכשיר הזה' : 'איפוס ההתקדמות במכשיר הזה'}</button>`);
  function refreshLearning(){void Promise.all([album.flush(),learner.flush()]).then(()=>{const panel=dialog.querySelector('#learning-parent');if(panel){panel.innerHTML=parentLearning(learner);panel.querySelector('[data-learning-refresh]').onclick=refreshLearning;}});}
  dialog.querySelector('[data-learning-refresh]').onclick=refreshLearning;
  mountFamilyPanel(dialog.querySelector('#family-panel'), {
    album, getLocalProgress: () => progress, pendingCode: pendingJoinCode,
    onPaired: () => { pendingJoinCode = null; },
  });
  mountOfflineAudio(dialog.querySelector('.offline-panel'));
  dialog.querySelector('#settings-form').onsubmit = event => {
    event.preventDefault();
    const form = new FormData(event.target);
    settings = sanitizeSettings({ ...settings, nikud: form.has('nikud'), sound: form.has('sound'), motion: form.has('motion'), reading: form.get('reading'), mathMax: Number(form.get('mathMax')), englishMax: Number(form.get('englishMax')), clockLevel: form.get('clockLevel') ?? settings.clockLevel, letterLanguage: settings.letterLanguage, letterWriting: settings.letterWriting });
    save(); narrator.stop(); applyPreferences(); closeDialog(true);
    renderSoundButton();
    clockSchool?.updateProgress();
    numberController?.updateMotion?.();
    companionController?.update();
  };
  dialog.querySelector('[data-dialog="reset"]').onclick = () => {
    openDialog(`<h2 id="parent-title">לאפס את המכשיר הזה?</h2><p>המדבקות וההתקדמות בדפדפן הזה יימחקו. הגדרות המשחק יישמרו.${album.linked ? ' החיבור לאלבום המשפחתי יוסר. האלבום שכבר סונכרן יישמר עבור המכשירים האחרים.' : ''}</p><div class="dialog-actions"><button class="secondary-button" data-dialog="cancel-reset">ביטול</button><button class="primary-button" data-dialog="confirm-reset">איפוס ההתקדמות</button></div>`);
    dialog.querySelector('[data-dialog="cancel-reset"]').onclick = renderSettings;
    dialog.querySelector('[data-dialog="confirm-reset"]').onclick = () => {
      try { gameStorage.removeItem(STITCH_KEY); } catch { /* Storage may be unavailable. */ }
      if (album.linked) album.disconnect(); learner.reset(); drafts={};journeyDrafts={};numberDrafts={};numberRound=null;scienceDrafts={};picnicController?.destroy({discard:true});picnicController=null;picnic=cleanPicnic(null);picnicRound=null;delivery=cleanDelivery(null);deliveryRound=null;boatyard=cleanBoatyard(null);boatRound=null;dailyController?.destroy({discard:true});dailyController=null;daily=cleanDaily(null);dailyRound=null;theater=cleanTheater(null);theaterRound=null;awardedRounds=[];writingPractice={mode:'trace',drafts:{}}; progress = freshProgress(); readingPractice = sanitizeReadingPractice(null); characterPractice = sanitizeCharacterPractice(null); save(); round = null; view = 'home'; render(); renderSettings(); };
  };
}

function updateParentProgress() {
  const summary = dialog.querySelector('#parent-progress-summary');
  if (summary) summary.textContent = `${progress.sessions} הרפתקאות שלמות · ${progress.stickers.length} מדבקות`;
  for (const mission of availableMissionIds) {
    const independent = dialog.querySelector(`[data-independent="${mission}"]`);
    const assisted = dialog.querySelector(`[data-assisted="${mission}"]`);
    if (independent) independent.textContent = progress.skills[mission].correct - progress.skills[mission].assisted;
    if (assisted) assisted.textContent = progress.skills[mission].assisted;
  }
}

function checkpoint(){
  if (view === 'game' && round) checkpointScoredRound(round, drafts, round.key, packRound);
  if(view==='journey'&&journeyPlan)journeyDrafts[`${journeyPlan.mode}:${journeyPlan.level}`]=journeyPlan;
  picnicController?.flush();
  dailyController?.flush();
  save();
}
function awardRound(mission,helped,letters,id,length){
  if (album.linked) return album.complete(mission, helped, letters, id, length);
  const result = awardLocalRound(progress, awardedRounds, mission, helped, letters, id, length);
  awardedRounds = result.awarded;
  return result;
}
function describeDraft({ kind, path, value }) {
  let title, icon, length;
  if (kind === 'classic') {
    const mission = MISSIONS[value.mission];
    const reading = value.mission === 'hebrew' && readingActivity(value.reading);
    title = value.questions[0].type === 'word-form' ? `מתאימות מילים · ${value.letterLanguage === 'english' ? 'אנגלית' : 'עברית'}` : reading ? reading.he[0] : mission.name;
    icon = reading ? reading.icon : mission.icon;
    length = value.questions.length;
  } else if (kind === 'journey') {
    const journey = JOURNEYS[value.mode];
    title = value.mode === 'stories' ? STORIES.find(story => story.id === value.level).title
      : value.mode === 'english' && value.level === 'single' ? ENGLISH_LISTENING.he[0]
      : value.mode === 'english' && Object.hasOwn(MATCH_LEVELS, value.level) ? MATCH_LEVELS[value.level].title : journey.title;
    icon = journey.icon;
    length = journeyLength(value);
  } else if (kind === 'numbers') {
    ({ title, icon } = NUMBER_PATHS[value.path]);
    length = value.questions.length;
  } else if (kind === 'picnic') {
    ({ title, icon } = PICNIC_MISSIONS[path]);
    length = PICNIC.steps;
  } else if (kind === 'delivery') {
    ({ title, icon } = DELIVERY_MISSIONS[path]);
    length = DELIVERY.steps;
  } else if (kind === 'boatyard') {
    ({ title, icon } = BOATYARD_MISSIONS[path]);
    length = BOATYARD.steps;
  } else if (kind === 'theater') {
    ({ title, icon } = THEATER_SHOWS[path]);
    length = THEATER.steps;
  } else {
    const experiment = SCIENCE_EXPERIMENTS[path];
    title = experiment.title;
    icon = 'clock';
    length = experiment.steps.length;
  }
  return { activity: { he: [title], icon }, reason: `צַעַד ${value.index + 1} מִתּוֹךְ ${length}` };
}
function currentDraft() {
  return latestPlayedDraft({ drafts, journeyDrafts, numberDrafts, scienceDrafts,
    picnicDrafts: picnic.drafts, deliveryDrafts: delivery.drafts, boatyardDrafts: boatyard.drafts, theaterDrafts: theater.drafts });
}

function resumeLatest(){
  const draft = currentDraft();
  if (!draft) return;
  if (draft.kind === 'numbers') { startNumberRound(draft.value.path); return; }
  if (draft.kind === 'science') { startScience(draft.path); return; }
  if (draft.kind === 'picnic') { startPicnicRound(draft.path); return; }
  if (draft.kind === 'delivery') { startDeliveryRound(draft.path); return; }
  if (draft.kind === 'boatyard') { startBoatyard(draft.path); return; }
  if (draft.kind === 'theater') { startTheater(draft.path); return; }
  narrator.stop();
  if(draft.kind==='classic'){const restored=unpackRound(draft.value);if(!restored)return;round=restored;view='game';}
  else {journeyPlan=resumeJourney(draft.value);if(!journeyPlan)return;round=null;view='journey';}
  render();focusTitle();
  if (view === 'game' && current().type === 'word-form') {
    settings.letterLanguage = round.letterLanguage;
    if (!round.resolved) announcements.say(current().prompt);
  }
}
function restoreQuestionState(){
  if(!round)return;
  const q=current();
  for(const b of document.querySelectorAll('[data-action="tally"]')){
    if(round.counted.has(b.dataset.token)){b.classList.add('counted');b.setAttribute('aria-disabled','true');b.querySelector('.count-bubble').textContent=[...round.counted].indexOf(b.dataset.token)+1;}
  }
  if (!round.resolved) {
    if (inLittleStories() && round.storyClue) paintStoryClue();
    return;
  }
  for(const b of document.querySelectorAll('.answer-button')){b.disabled=true;if(b.dataset.answer===q.answer)b.classList.add('correct');}
  document.querySelector('.hint-button').hidden=true;
  const next=document.querySelector('.next-button');next.hidden=false;if(lastQuestion())next.innerHTML=`למדבקה שלי ${uiIcon('arrow')}`;
  const feedback=document.querySelector('#feedback');feedback.classList.add('success');feedback.textContent='כָּל הַכָּבוֹד! הַצַּעַד הַזֶּה כְּבָר הֻשְׁלַם.';
  const clockLink=document.querySelector('[data-action="clock-learn"]');if(clockLink)clockLink.disabled=true;
}
function openNumberMenu() {
  checkpoint(); narrator.stop(); round = null; journeyPlan = null; numberRound = null;
  view = 'number-menu'; render(); focusTitle();
  announcements.say(numberClip('menu'));
}

function startNumberRound(path) {
  if (!Object.hasOwn(NUMBER_PATHS, path)) return;
  checkpoint(); narrator.stop(); round = null; journeyPlan = null;
  numberRound = numberDrafts[path] || newNumberRound(path, settings.mathMax, learner.items);
  view = 'number-round'; render(); focusTitle();
  numberController.replay();
}

function openNumberWriting() {
  narrator.stop();
  view = 'number-writing'; render(); focusTitle();
  numberController.replay();
}

function renderNumberWriting() {
  app.innerHTML = `${header()}<main id="main" class="number-workshop"><div id="number-writing-root"></div></main>${footer()}`;
  numberController = mountNumberWriting(document.querySelector('#number-writing-root'), {
    getItems: () => learner.items, motion: motionEnabled, speak: clips => announcements.say(clips),
    onPractice: number => {
      learner.record({ item: numberWritingKey(number), domain: 'math' }, 'practice', 'trace');
      revealWin('.number-writing-count');
    },
  });
}

function openNumberDictation() {
  narrator.stop();
  view = 'number-dictation'; render(); focusTitle();
  void numberController.start();
}

function renderNumberDictation() {
  app.innerHTML = `${header()}<main id="main" class="number-workshop"><div id="number-dictation-root"></div></main>${footer()}`;
  numberController = mountNumberDictation(document.querySelector('#number-dictation-root'), {
    getItems: () => learner.items, speak: clips => announcements.say(clips),
    onPractice: number => learner.record({ item: numberDictationKey(number), domain: 'math' }, 'practice', 'dictation'),
  });
}

function openFruitCutting() {
  narrator.stop();
  view = 'fruit-cutting'; render(); focusTitle();
  numberController.replay();
}

function renderFruitCutting() {
  app.innerHTML = `${header()}<main id="main" class="number-workshop"><div id="fruit-root"></div></main>${footer()}`;
  numberController = mountFruitCutting(document.querySelector('#fruit-root'), {
    nikud: settings.nikud, speak: clips => announcements.say(clips),
  });
}

function openCompanion(id) {
  narrator.stop();
  view = id; render(); focusTitle();
  companionController.hop();
}

function renderCompanion() {
  app.innerHTML = `${header()}<main id="main" class="pikachu-page ${view}-match"><div id="${view}-root"></div></main>${footer()}`;
  companionController = mountPictureMatch(document.getElementById(`${view}-root`), {
    companion: view, storage: gameStorage,
    greet: companions.greet,
    nikud: () => settings.nikud, motion: () => settings.motion,
    sound: () => settings.sound,
  });
}

function openScienceMenu() {
  if (!isPracticeAvailable('science')) return;
  narrator.stop();
  checkpoint();
  round = null;
  view = 'science-menu'; render(); focusTitle();
  announcements.say(scienceClip('menu'));
}

function startScience(path, restart = false) {
  if (!isPracticeAvailable('science') || !Object.hasOwn(SCIENCE_EXPERIMENTS, path)) return;
  narrator.stop();
  sciencePath = path;
  if (restart || !scienceDrafts[path]) scienceDrafts[path] = { index: 0, actions: [], complete: false, at: Date.now() };
  save();
  view = 'science-round'; render(); focusTitle();
  scienceController.replay();
}

function renderScience() {
  app.innerHTML = `${header()}<main id="main" class="lab-page"><div id="science-root"></div></main>${footer()}`;
  scienceController = mountScience(document.querySelector('#science-root'), {
    path: sciencePath, saved: scienceDrafts[sciencePath], nikud: settings.nikud, motion: motionEnabled,
    speak: key => announcements.say(key),
    onSave: draft => { scienceDrafts[sciencePath] = draft; save(); },
    onFinish: () => revealWin('.lab-prompt'),
    onRestart: () => startScience(sciencePath, true),
  });
}

function openChapters() {
  checkpoint(); narrator.stop(); round = null; journeyPlan = null;
  view = 'chapters'; render(); focusTitle();
}

function openPicnic() {
  checkpoint(); narrator.stop(); round = null; journeyPlan = null; picnicRound = null;
  view = 'picnic-map'; render(); focusTitle();
  if (!picnic.finished.length) announcements.say(PICNIC.intro);
}

function openDelivery() {
  checkpoint(); narrator.stop(); round = null; journeyPlan = null; deliveryRound = null;
  view = 'delivery-map'; render(); focusTitle();
  if (!delivery.finished.length) announcements.say(DELIVERY.intro);
  prepareDeliveryAudio();
}

function startDeliveryRound(path) {
  const bonus = path === 'pair';
  if (bonus ? !deliveryPairReady(learner.items) : !Object.hasOwn(DELIVERY_MISSIONS, path)) return;
  checkpoint(); narrator.stop(); round = null; journeyPlan = null;
  deliveryRound = bonus ? createDeliveryBonus() : cleanDeliveryRound(path, delivery.drafts[path]) || createDeliveryRound(path, learner.items);
  view = 'delivery-round'; render(); focusTitle();
  prepareDeliveryAudio();
}

function renderDeliveryRound() {
  app.innerHTML = header() + '<main id="main" class="picnic-page picnic-play delivery-page delivery-play"></main>' + footer();
  deliveryController = mountDeliveryRound(app.querySelector('#main'), {
    round: deliveryRound, nikud: settings.nikud, motion: motionEnabled,
    play: (keys, manual) => manual ? clockSpeak(keys) : announcements.say(keys), focusTitle,
    onSave: draft => {
      if (draft.path === 'pair') return;
      checkpointScoredRound(draft, delivery.drafts, draft.path, packDeliveryRound); save();
    },
    onSuccess: draft => {
      const { mode, ...evidence } = deliveryEvidence(draft);
      learner.record(evidence, draft.helped.includes(draft.index) ? 'helped' : 'independent', mode);
      narrator.chime();
    },
    onComplete: draft => {
      if (draft.path === 'pair') { openDelivery(); return; }
      const result = finishScoredRound(draft, delivery.drafts, draft.path,
        (id, length) => awardRound('english', draft.helped.length, null, id, length));
      if (!result) return;
      const newlyFinished = !delivery.finished.includes(draft.path);
      if (newlyFinished) delivery.finished.push(draft.path);
      progress = result.progress; deliverySticker = result.sticker;
      view = 'delivery-complete'; save(); render(); focusTitle();
      revealWin('.picnic-sticker');
      const chapterReady = newlyFinished && delivery.finished.length === Object.keys(DELIVERY_MISSIONS).length;
      announcements.say([completionClip(deliverySticker), ...(chapterReady ? ['delivery-finish'] : [])]);
    },
  });
  deliveryController.start();
}

function openBoatyard() {
  if (!isChapterAvailable('boatyard')) return;
  checkpoint(); narrator.stop(); round = null; journeyPlan = null; boatRound = null;
  view = 'boatyard-map'; render(); focusTitle();
  if (!boatyard.finished.length) announcements.say(BOATYARD.intro);
  prepareBoatyardAudio();
}

function startBoatyard(path) {
  if (!isChapterAvailable('boatyard') || !Object.hasOwn(BOATYARD_MISSIONS, path)) return;
  checkpoint(); narrator.stop(); round = null; journeyPlan = null;
  boatRound = cleanBoatyardRound(path, boatyard.drafts[path]) || boatyardRound(path);
  view = 'boatyard-round'; render(); focusTitle();
  announcements.say(boatyardPrompt(boatRound));
  prepareBoatyardAudio();
}

function renderBoatyardRound() {
  app.innerHTML = header() + '<main id="main" class="picnic-page picnic-play yard-page"></main>' + footer();
  boatController = mountBoatyardRound(app.querySelector('#main'), {
    round: boatRound, nikud: settings.nikud, motion: motionEnabled, focusTitle,
    play: (keys, manual) => manual ? clockSpeak(keys) : announcements.say(keys),
    onSave: draft => { checkpointScoredRound(draft, boatyard.drafts, draft.path, packBoatyardRound); save(); },
    onComplete: draft => {
      const result = finishScoredRound(draft, boatyard.drafts, draft.path,
        // The album uses its existing measurement category for these experiments.
        (id, length) => awardRound('math', 0, null, id, length));
      if (!result) return;
      if (!boatyard.finished.includes(draft.path)) boatyard.finished.push(draft.path);
      progress = result.progress; boatSticker = result.sticker;
      view = 'boatyard-complete'; save(); render(); focusTitle();
      revealWin('.picnic-sticker');
      announcements.say(completionClip(boatSticker));
    },
  });
}

function openTheater() {
  if (!isChapterAvailable('theater')) return;
  checkpoint(); narrator.stop(); round = null; journeyPlan = null; theaterRound = null;
  view = 'theater-map'; render(); focusTitle();
  prepareTheaterAudio('map');
  if (!theater.finished.length) announcements.say(THEATER.intro);
}

function startTheater(path) {
  if (!isChapterAvailable('theater') || !Object.hasOwn(THEATER_SHOWS, path)) return;
  checkpoint(); narrator.stop(); round = null; journeyPlan = null;
  theaterRound = cleanTheaterRound(path, theater.drafts[path]);
  if (!theaterRound) {
    theaterRound = createTheaterRound(path);
    checkpointScoredRound(theaterRound, theater.drafts, path, packTheaterRound);
    save();
  }
  view = 'theater-round'; prepareTheaterAudio(path); render(); focusTitle();
}

function openTheaterStudio() {
  if (!isChapterAvailable('theater')) return;
  checkpoint(); narrator.stop(); round = null; journeyPlan = null;
  view = 'theater-studio'; prepareTheaterAudio('studio'); render(); focusTitle();
}

function renderTheater() {
  app.innerHTML = header() + '<main id="main" class="picnic-page picnic-play theater-page"></main>' + footer();
  const root = app.querySelector('#main');
  const options = { nikud: settings.nikud, motion: motionEnabled, focusTitle,
    play: (keys, manual) => manual ? clockSpeak(keys) : announcements.say(keys) };
  if (view === 'theater-studio') {
    theaterController = mountTheaterStudio(root, { ...options, studio: theater.studio, items: learner.items, onSave: save });
  } else {
    theaterController = mountTheaterRound(root, {
      ...options, round: theaterRound,
      onSave: draft => { checkpointScoredRound(draft, theater.drafts, draft.path, packTheaterRound); save(); },
      onSuccess: draft => {
        const evidence = theaterEvidence(draft);
        if (evidence) learner.record(evidence, draft.helped.includes(draft.index) ? 'helped' : 'independent');
        narrator.chime();
      },
      onFinish: draft => {
        const result = finishScoredRound(draft, theater.drafts, draft.path,
          (id, length) => awardRound(THEATER_SHOWS[draft.path].domain, draft.helped.length, null, id, length));
        if (!result) return;
        if (!theater.finished.includes(draft.path)) theater.finished.push(draft.path);
        progress = result.progress; theaterSticker = result.sticker;
        view = 'theater-complete'; save(); render(); focusTitle();
        revealWin('.picnic-sticker'); announcements.say(completionClip(theaterSticker));
      },
    });
  }
  theaterController.start();
}

function startDaily(path) {
  if (!Object.hasOwn(DAILY_PATHS, path) || !isPracticeAvailable(path)) return;
  checkpoint(); narrator.stop(); round = null; journeyPlan = null;
  const saved = availableDailyDraft(daily.drafts);
  // Leave an existing hidden round in the original slot for a future release.
  dailyDraftKey = saved?.key ?? (daily.drafts.today ? path : 'today');
  dailyRound = cleanDailyRound(saved?.draft);
  if (!dailyRound) {
    dailyRound = createDailyRound(path, learner.items, daily.recent);
    checkpointScoredRound(dailyRound, daily.drafts, dailyDraftKey);
    save();
  }
  view = 'daily-round'; render(); focusTitle();
  prepareDailyAudio(dailyRound);
}

function renderDailyRound() {
  const key = dailyDraftKey;
  app.innerHTML = header() + '<main id="main" class="picnic-page picnic-play daily-page"></main>' + footer();
  dailyController = mountDaily(app.querySelector('#main'), {
    round: dailyRound, nikud: settings.nikud, motion: motionEnabled, focusTitle,
    play: (keys, manual) => manual ? clockSpeak(keys) : announcements.say(keys),
    onSave: draft => { checkpointScoredRound(draft, daily.drafts, key); save(); },
    onSuccess: draft => {
      learner.record(dailyEvidence(draft), draft.helped.includes(draft.index) ? 'helped' : 'independent');
      narrator.chime();
    },
    onFinish: draft => {
      const result = finishScoredRound(draft, daily.drafts, key,
        (id, length) => awardRound(draft.path, draft.helped.length, null, id, length));
      if (!result) return;
      finishDailyMemory(daily, draft);
      progress = result.progress; dailySticker = result.sticker;
      view = 'daily-complete'; save(); render(); focusTitle();
      revealWin('.picnic-sticker');
      announcements.say(completionClip(dailySticker));
    },
  });
  dailyController.start();
}

function startPicnicRound(path) {
  if (!Object.hasOwn(AVAILABLE_PICNIC_MISSIONS, path)) return;
  checkpoint(); narrator.stop(); round = null; journeyPlan = null;
  picnicRound = cleanPicnicRound(path, picnic.drafts[path]) || createPicnicRound(path, settings.mathMax);
  view = 'picnic-round'; render(); focusTitle();
  if (!picnicRound.resolved) announcements.say(picnicPrompt(picnicRound));
}

function renderPicnicRound() {
  app.innerHTML = header() + '<main id="main" class="picnic-page picnic-play"></main>' + footer();
  const { domain } = PICNIC_MISSIONS[picnicRound.path];
  picnicController = mountPicnicRound(app.querySelector('#main'), {
    round: picnicRound, nikud: settings.nikud, motion: motionEnabled,
    speak: keys => announcements.say(keys), replay: clockSpeak, focusTitle,
    onSave: draft => { checkpointScoredRound(draft, picnic.drafts, draft.path, packPicnicRound); save(); },
    onSuccess: draft => {
      learner.record({ item: picnicItem(draft), domain, eventId: `picnic:${draft.id}:${draft.index}` },
        draft.helped.includes(draft.index) ? 'helped' : 'independent');
      narrator.chime();
    },
    onComplete: draft => {
      const result = finishScoredRound(draft, picnic.drafts, draft.path,
        (id, length) => awardRound(domain, draft.helped.length, null, id, length));
      if (!result) return;
      const newlyFinished = !picnic.finished.includes(draft.path);
      if (newlyFinished) picnic.finished.push(draft.path);
      progress = result.progress; picnicSticker = result.sticker;
      view = 'picnic-complete'; save(); render(); focusTitle();
      revealWin('.picnic-sticker');
      const picnicReady = newlyFinished && isPicnicReady(picnic.finished);
      announcements.say([completionClip(picnicSticker), ...(picnicReady ? ['picnic-finish'] : [])]);
    },
  });
}

function renderNumberRound() {
  app.innerHTML = `${header()}<main id="main" class="number-workshop"><div id="number-root"></div></main>${footer()}`;
  const active = numberRound;
  numberController = mountNumberRound(document.querySelector('#number-root'), {
    round: active, nikud: settings.nikud, motion: motionEnabled, speak: clips => announcements.say(clips),
    audioEnabled: () => settings.sound, stopSpeaking: () => narrator.stop(),
    onSave: draft => { checkpointScoredRound(draft, numberDrafts, draft.path); save(); },
    onObservation: (item, kind, index) => learner.record({ item, domain: 'math', eventId: `${active.id}:${kind === 'seen' ? 'seen:' : ''}${index}` }, kind),
    onSuccess: () => narrator.chime(),
    onComplete: draft => {
      const result = finishScoredRound(draft, numberDrafts, draft.path,
        (id, length) => awardRound('math', draft.helped.length, null, id, length));
      if (!result) return;
      progress = result.progress; numberSticker = result.sticker;
      view = 'number-complete'; save(); render(); focusTitle();
      revealWin('.journey-complete-art'); announcements.say(completionClip(numberSticker));
    },
  });
}

function openLearningHub(subject) {
  checkpoint(); narrator.stop(); round = null; journeyPlan = null;
  hub = subject === 'english' ? 'english' : 'hebrew';
  view = 'learning-hub'; render(); focusTitle();
  announcements.say('choose-activity');
}
function journeyChoice(mode,level,label,description,icon,tag=''){
  const saved=journeyDrafts[`${mode}:${level}`];
  return `<button class="learning-path-card" data-action="journey-start" data-journey="${mode}" data-level="${level}"><span class="learning-path-art">${art(icon)}</span>${tag?`<small class="learning-path-tag">${tag}</small>`:''}<h3>${label}</h3><p>${description}</p>${saved ? `<strong>מַמְשִׁיכוֹת מִצַּעַד ${saved.index+1} ${uiIcon('arrow')}</strong>` : ''}</button>`;
}
function renderLearningHub(){
  const group = (title, cards) => `<section class="learning-group"><h2 class="learning-group-title">${title}</h2><div class="learning-paths">${cards}</div></section>`;
  const card = (action, extra, title, description, icon) => `<button class="learning-path-card" data-action="${action}" ${extra}><span class="learning-path-art">${art(icon)}</span><h3>${title}</h3><p>${description}</p></button>`;
  const hebrew = hub === 'hebrew';
  let sections;
  if (hebrew) {
    const captionStage = READING_LEVELS.captions;
    const reading = card('garden', '', 'כָּל שְׁלָבֵי הַקְּרִיאָה', 'מִמִּלִּים קְצָרוֹת וְעַד מִשְׁפָּטִים.', 'flower')
      + card(LITTLE_STORIES.route.action, `data-level="${LITTLE_STORIES.route.level}"`, ...LITTLE_STORIES.he, LITTLE_STORIES.icon)
      + card('reading-level', 'data-level="captions"', 'מִתְּמוּנָה לְמִשְׁפָּט', captionStage.description, captionStage.art);
    const workshop = ['חֲלָקִים קְטַנִּים וּמִלִּים מֻכָּרוֹת', 'מִלִּים אֲרֻכּוֹת יוֹתֵר', 'עוֹד אוֹתִיּוֹת וְצֵרוּפִים', 'אֶתְגָּר לְבִנְיַן מִלִּים']
      .map((description, i) => journeyChoice('workshop', i + 1, `שָׁלָב ${i + 1}`, description, 'pencil')).join('');
    const shelf = [...STORIES].sort((a, b) => Number(!!b.featured) - Number(!!a.featured));
    sections = group('קוֹרְאוֹת וּמְשַׂחֲקוֹת', reading) + group('סַדְנַת הַמִּלִּים', workshop)
      + group('סִפּוּרִים שֶׁמְּשַׂחֲקִים', shelf.map(story => journeyChoice('stories', story.id, story.title, story.description, story.icon || 'house')).join(''));
  } else {
    const listening = journeyChoice(ENGLISH_LISTENING.route.mode, ENGLISH_LISTENING.route.level, ...ENGLISH_LISTENING.he, ENGLISH_LISTENING.icon)
      + card('mission-direct', 'data-mission="english"', 'מִלִּים, צְבָעִים וּמִסְפָּרִים', 'מַקְשִׁיבוֹת לְמִלִּים מֵהַמִּשְׂחָק הַמֻּכָּר.', 'star');
    const pairs = journeyChoice('english', 'pairs', 'צֶבַע וְכַדּוּר', 'מַכִּירוֹת אֶת הַכַּדּוּר וּמְחַבְּרוֹת לוֹ צֶבַע.', 'ball', englishPairsReady(learner.items) ? 'מוּכָנָה לַצַּעַד הַבָּא' : '')
      + journeyChoice('english', 'cars', 'צֶבַע וּמְכוֹנִית', 'מַכִּירוֹת אֶת הַמְּכוֹנִית וּמְחַבְּרוֹת לָהּ צֶבַע.', 'car');
    const sounds = journeyChoice('sounds', 'sounds', 'מְגַלּוֹת צְלִילִים', 'אוֹת גְּדוֹלָה, אוֹת קְטַנָּה וְצָלִיל בִּתְחִלַּת מִלָּה.', 'bird')
      + journeyChoice('sounds', 'blend', 'מְחַבְּרוֹת צְלִילִים', 'קוֹרְאוֹת מִלִּים קְצָרוֹת מִצְּלִילִים מֻכָּרִים.', 'fish');
    const matching = Object.entries(MATCH_LEVELS).map(([level, path]) => journeyChoice('english', level, path.title, path.description, path.icon)).join('');
    sections = group('מַתְחִילוֹת בְּהַקְשָׁבָה', listening) + group('מִלִּים וּתְמוּנוֹת', matching)
      + group('שְׁתֵּי מִלִּים בְּיַחַד', pairs) + group('צְלִילִים וּקְרִיאָה', sounds);
  }
  app.innerHTML = `${header()}<main id="main" class="learning-hub" data-hub="${hub}"><button class="text-button back-button" data-action="home">${uiIcon('home')} לְבֵית הַחֲבֵרִים</button><section class="learning-hub-heading"><h1 tabindex="-1">${hebrew ? 'עִבְרִית' : 'מִפְרַץ הָאַנְגְּלִית'}</h1>${pup(hebrew ? 'luli' : 'bobi')}</section>${sections}</main>${footer()}`;
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
      progress=result.progress;plan.sticker=result.sticker;delete journeyDrafts[`${plan.mode}:${plan.level}`];view='journey-complete';save();render();focusTitle();revealWin('.journey-complete-art');announcements.say(plan.sticker ? 'complete' : 'complete-all');
    }
  });
}
function renderJourneyComplete(){
  const plan=journeyPlan;
  app.innerHTML=`${header()}<main id="main" class="journey-complete"><div class="journey-complete-art">${pup('luli')}${rewardSticker(plan?.sticker, 'star', 'reward-inline')}</div><h1 tabindex="-1">כָּל הַכָּבוֹד! עוֹד הַרְפַּתְקָה שְׁלֵמָה!</h1><p>${plan?.sticker ? 'מַדְבֵּקָה חֲדָשָׁה הִצְטָרְפָה לָאַלְבּוֹם.' : 'הַהַרְפַּתְקָה נִשְׁמְרָה.'}</p><div class="journey-controls"><button class="primary-button" data-action="park">לַפָּארְק שֶׁלִּי ${uiIcon('arrow')}</button><button class="secondary-button" data-action="learning-hub" data-hub="${plan?JOURNEYS[plan.mode].domain:'hebrew'}">עוֹד גִּלּוּי קָטָן</button><button class="text-button" data-action="home">לְבֵית הַחֲבֵרִים</button></div></main>${footer()}`;
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
    case 'guide': stopStickerPlayback(); narrator.stop(); openGameGuide(button, stopStickerPlayback); break;
    case 'learning-hub': openLearningHub(button.dataset.hub); break;
    case 'number-menu': openNumberMenu(); break;
    case 'number-start': startNumberRound(button.dataset.path); break;
    case 'number-write': openNumberWriting(); break;
    case 'number-dictation': openNumberDictation(); break;
    case 'fruit-cutting': openFruitCutting(); break;
    case 'pikachu':
    case 'stitch': openCompanion(button.dataset.action); break;
    case 'science-menu': openScienceMenu(); break;
    case 'science-start': startScience(button.dataset.path, scienceDrafts[button.dataset.path]?.complete); break;
    case 'chapters': openChapters(); break;
    case 'picnic': openPicnic(); break;
    case 'picnic-start': startPicnicRound(button.dataset.path); break;
    case 'delivery': openDelivery(); break;
    case 'delivery-start': startDeliveryRound(button.dataset.path); break;
    case 'delivery-bonus': startDeliveryRound('pair'); break;
    case 'boatyard': openBoatyard(); break;
    case 'boatyard-start': startBoatyard(button.dataset.path); break;
    case 'daily-start': startDaily(button.dataset.path); break;
    case 'theater': openTheater(); break;
    case 'theater-start': startTheater(button.dataset.path); break;
    case 'theater-studio': openTheaterStudio(); break;
    case 'garden': openReadingLevels(); break;
    case 'mission-direct': startMission(button.dataset.mission,true); break;
    case 'journey-start': startJourney(button.dataset.journey,button.dataset.level); break;
    case 'resume': resumeLatest(); break;
    case 'park': checkpoint();round=null;journeyPlan=null;view='park';render();focusTitle();break;
    case 'writing-step': if(Object.hasOwn(WRITING_STEPS,button.dataset.step)){writingPractice.mode=button.dataset.step;letterDemo.recorded=false;save();render();if(writingPractice.mode!=='trace')announcements.say(writingPractice.mode==='paper'?'journey-paper':writingPractice.mode==='copy'?'journey-copy-letters':'journey-memory-letters');}break;
    case 'name-letter': selectLetter(Number(button.dataset.index));break;
    case 'album': albumPageIndex = null; if (view === 'game') leaveTo('album'); else { narrator.stop(); view = 'album'; render(); focusTitle(); announcements.say('stickers'); } break;
    case 'sticker-play':
      if (progress.stickers.includes(button.dataset.sticker)) stickerPlayer.play(button, settings);
      break;
    case 'album-page': turnAlbumPage(Number(button.dataset.page)); break;
    case 'album-latest': turnAlbumPage(null); break;
    case 'mission': startMission(button.dataset.mission); break;
    case 'reading-levels': if (view === 'game') leaveTo('reading-levels'); else openReadingLevels(); break;
    case 'reading-level': startReadingLevel(button.dataset.level); break;
    case 'reading-stage-sound': if (Object.hasOwn(READING_LEVELS, button.dataset.level)) clockSpeak(READING_LEVELS[button.dataset.level].clip); break;
    case 'characters-menu': if (view === 'game') leaveTo('characters-menu'); else openCharacters(); break;
    case 'character-collection': if (Object.hasOwn(CHARACTER_COLLECTIONS, button.dataset.collection)) { Object.assign(settings, selectCharacterLevel(settings, settings.characterCollectionLevels[button.dataset.collection])); save(); render(); document.querySelector(`[data-action="character-collection"][data-collection="${button.dataset.collection}"]`)?.focus({ preventScroll: true }); announcements.say(characterMenuClip()); } break;
    case 'character-mode': if (Object.hasOwn(CHARACTER_MODES, button.dataset.mode)) { settings.characterMode = button.dataset.mode; save(); render(); document.querySelector(`[data-action="character-mode"][data-mode="${settings.characterMode}"]`)?.focus({ preventScroll: true }); announcements.say(settings.characterMode === 'mixed' ? 'characters-intro' : `characters-${settings.characterMode}`); } break;
    case 'character-level': if (Object.hasOwn(CHARACTER_LEVELS, button.dataset.level)) { Object.assign(settings, selectCharacterLevel(settings, button.dataset.level)); save(); render(); document.querySelector(`[data-action="character-level"][data-level="${settings.characterLevel}"]`)?.focus({ preventScroll: true }); announcements.say(CHARACTER_LEVELS[settings.characterLevel].clip); } break;
    case 'character-start': startMission('characters', true); break;
    case 'character-sound': { const character = CHARACTERS.find(c => c.id === button.dataset.character); if (character) clockSpeak(character.clip); break; }
    case 'character-advance': if (Object.hasOwn(CHARACTER_LEVELS, button.dataset.level)) { Object.assign(settings, selectCharacterLevel(settings, button.dataset.level)); settings.characterMode = round.characterMode; save(); startMission('characters', true); } break;
    case 'character-repeat': Object.assign(settings, selectCharacterLevel(settings, round.characterLevel)); settings.characterMode = round.characterMode; save(); startMission('characters', true); break;
    case 'welcome': welcome(); break;
    case 'replay': replay(); break;
    case 'read-prompt':
      if (!round.resolved) { round.helped.add(round.index); checkpoint(); }
      clockSpeak(button.dataset.clip);
      break;
    case 'listen-word': if (!settings.sound) { settings.sound = true; narrator.enabled = true; save(); renderSoundButton(); } announcements.say(current().targetClip); break;
    case 'clock-practice':
      if (CLOCK_ACTIVITIES_ENABLED) {
        if (clockReturn && round) { view = 'game'; render(); focusTitle(); replay(); }
        else startMission('clock', true);
      }
      break;
    case 'clock-learn': if (round && !round.resolved) openClockLesson(true); break;
    case 'clock-option-audio': if (CLOCK_ACTIVITIES_ENABLED) clockSpeak(button.dataset.clips.split(' ')); break;
    case 'letters-menu': if (view === 'game') leaveTo('letters-menu'); else openLetterMenu(); break;
    case 'letter-mode': openLetterMode(button.dataset.mode); break;
    case 'letter-language': if (Object.hasOwn(LETTERS, button.dataset.language)) { settings.letterLanguage = button.dataset.language; recognitionChoice = null; save(); if (view === 'letters-lesson') openLetterLesson(); else { render(); announcements.say(view === 'letters-writing' ? `letters-writing-forms-${settings.letterLanguage}` : view === 'letters-recognition' ? 'letters-recognition' : 'letters-paths-words'); } } break;
    case 'letter-form': if (WRITING_FORMS.includes(button.dataset.form)) openLetterLesson(button.dataset.form); break;
    case 'letter-select': selectLetter(Number(button.dataset.index)); break;
    case 'letter-previous': selectLetter(letterDemo.index - 1); break;
    case 'letter-next': selectLetter(letterDemo.index + 1); break;
    case 'letter-example': if(CLIPS[button.dataset.clip]) clockSpeak(button.dataset.clip); break;
    case 'write-word': if (view === 'letters-lesson') openWritingWord(button.dataset.word); break;
    case 'letter-sound': clockSpeak(demoLetter().clip); break;
    case 'letter-demo': letterPad.demo(); announcements.say('letters-demo'); break;
    case 'letter-step': letterPad.step(); break;
    case 'letter-reset': letterPad.reset(); announcements.say('letters-trace'); break;
    case 'letter-practice': startMission('letters', true); break;
    case 'word-form-start': startMission('letters', true, 'words'); break;
    case 'letter-recognition-auto': recognitionChoice = null; render(); focusTitle(); break;
    case 'letter-recognition-next': settings.letterLanguage = round.letterLanguage; recognitionChoice = null; startMission('letters', true); break;
    case 'letter-recognition-repeat': settings.letterLanguage = round.letterLanguage; recognitionChoice = [...round.letterIds]; startMission('letters', true); break;
    case 'letter-writing-continue': { const letter = nextWriting(letterDemo.language, letterDemo.form, letterDemo.index + 1, letterDemo.index); selectLetter(LETTERS[letterDemo.language].indexOf(letter)); break; }
    case 'hint': hint(); break;
    case 'answer': answer(button); break;
    case 'tally': tally(button); break;
    case 'next': nextQuestion(); break;
    case 'parents': parentGate(); break;
    case 'sound':
      stopStickerPlayback();
      settings.sound = !settings.sound; narrator.stop(); narrator.enabled = settings.sound; save(); renderSoundButton();
      if (companionController) companionController.updateSound();
      else if (settings.sound) replay();
      break;
    case 'break': checkpoint(); narrator.stop(); round = null; view = 'home'; render(); focusTitle(); announcements.say('break'); break;
  }
});

document.addEventListener('click', event => {
  const sticker = event.target.closest('button[data-companion]');
  if (sticker) {
    stickerPlayer.stop();
    companions.greet(sticker.dataset.companion, sticker);
  }
});

app.addEventListener('change', event => {
  if (event.target.matches('select[data-album-page]')) turnAlbumPage(Number(event.target.value));
});

dialog.addEventListener('click', event => { if (event.target === dialog && event.offsetX >= 0 && event.offsetX <= dialog.clientWidth && event.offsetY >= 0 && event.offsetY <= dialog.clientHeight) return; if (event.target === dialog) closeDialog(); });
dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(); });
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopStickerPlayback(); picnicController?.flush(); dailyController?.flush(); narrator.stop(); } else { void album.flush();void learner.flush(); startOpeningWelcome(); } });
window.addEventListener('online', () => {
  void album.flush(); void learner.flush();
  if (view === 'delivery-map' || view === 'delivery-round') prepareDeliveryAudio();
  if (view === 'boatyard-map' || view === 'boatyard-round') prepareBoatyardAudio();
  if (view === 'daily-round') prepareDailyAudio(dailyRound);
  if (view === 'theater-map') prepareTheaterAudio('map');
  if (view === 'theater-round') prepareTheaterAudio(theaterRound.path);
  if (view === 'theater-studio') prepareTheaterAudio('studio');
});
window.addEventListener('hashchange', openAlbumInvite);
window.addEventListener('focus', () => { void album.flush();void learner.flush(); });
setInterval(() => { if (!document.hidden && album.linked) {void album.flush();void learner.flush();} }, 15000);
window.addEventListener('pagehide', () => { stopStickerPlayback(); checkpoint(); narrator.stop(); });
render();
openAlbumInvite();
startOpeningWelcome();
if (album.linked) {void album.flush();void learner.flush();}

registerOffline();
