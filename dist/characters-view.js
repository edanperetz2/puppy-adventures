import { CHARACTERS, CHARACTER_ART, CHARACTER_COLLECTIONS, CHARACTER_LEVELS, CHARACTER_MODES, characterPool, characterPortrait, characterCollection } from './characters.js?v=2.2.2-six';
import { SESSION_LENGTH } from './adventure.js?v=2.2.2-six';
import { uiIcon } from './art.js';

export const CHARACTER_DESCRIPTIONS = Object.freeze({
  rubble: 'גור בולדוג עם קסדה צהובה', mix: 'גורה עם קסדה סגולה',
  charger: 'גור אפור עם אוזניים זקופות וקסדה אדומה', wheeler: 'גור עם אוזניים חומות וקסדה כחולה',
  motor: 'גורה קטנה ואפורה עם קסדה בצבע תכלת', auntie: 'כלבה בהירה עם קסדה לבנה',
  grandpa: 'כלב גדול עם קסדה ירוקה',
  chase: 'גור רועה גרמני עם כובע שוטר כחול', marshall: 'גור לבן עם כתמים שחורים וקסדת כבאי אדומה',
  skye: 'גורה חומה עם אוזניים גדולות ומשקפי טיסה ורודים', rocky: 'גור אפור עם כובע ירוק',
  zuma: 'גור חום עם קסדה כתומה', everest: 'גורת האסקי עם כובע חורף ובגדים בצבע טורקיז',
  liberty: 'גורה חומה עם קסדה ורודה ואוזניים מתנופפות', ryder: 'ילד עם שיער חום ואפודה אדומה ולבנה',
});
const descriptions = CHARACTER_DESCRIPTIONS;
export const characterName = (character, nikud) => nikud ? character.pointed : character.he;

export function characterMenu(settings, practice) {
  const stage = CHARACTER_LEVELS[settings.characterLevel], cast = characterPool(settings.characterLevel);
  const collection = characterCollection(settings.characterLevel), series = CHARACTER_COLLECTIONS[collection];
  const faces = key => CHARACTER_COLLECTIONS[key].faces.map(id => characterPortrait(CHARACTERS.find(c => c.id === id), '', '', key)).join('');
  return `<main id="main" class="character-menu-page" dir="rtl" lang="he"><button class="text-button" data-action="home">${uiIcon('home')} לבית החברים</button>
    <section class="character-welcome"><div><span class="section-kicker">${series.name} · קוראות שמות</span><h1 tabindex="-1">חברים מהמסך</h1><p>את החברים את כבר מכירה.<br>עכשיו נגלה איך קוראים את השמות שלהם!</p><button class="text-button" data-action="replay">${uiIcon('sound')} בואי נשמע איך משחקים</button></div>${collection === 'crew' ? `<img src="${CHARACTER_ART.src}" width="${CHARACTER_ART.width}" height="${CHARACTER_ART.height}" alt="ראבל, מיקס, צ׳ארג׳ר וכל משפחת הבנאים" class="character-family-art">` : `<div class="character-paw-hero" aria-label="החברים ממפרץ ההרפתקאות">${characterPool('paw-team').map(c => characterPortrait(c, c.he, '', 'paw')).join('')}</div>`}</section>
    <section class="character-collection-section" aria-labelledby="character-collection-title"><h2 id="character-collection-title">עם מי נשחק?</h2><div class="character-collection-tabs" role="group" aria-label="בחירת סדרה">${Object.entries(CHARACTER_COLLECTIONS).map(([key, item]) => `<button data-action="character-collection" data-collection="${key}" aria-pressed="${key === collection}"><span class="character-collection-faces" aria-hidden="true">${faces(key)}</span><b>${item.name}</b></button>`).join('')}</div></section>
    <section class="character-mode-section" aria-labelledby="character-mode-title"><h2 id="character-mode-title">איך נשחק?</h2><div class="character-mode-tabs" role="group" aria-label="דרך המשחק">${Object.entries(CHARACTER_MODES).map(([key, label]) => `<button data-action="character-mode" data-mode="${key}" aria-pressed="${settings.characterMode === key}"><span class="character-mode-symbol" aria-hidden="true">${key === 'mixed' ? '↔' : key === 'picture-name' ? 'א ← 🖼️' : '🖼️ ← א'}</span>${label}</button>`).join('')}</div></section>
    <section aria-labelledby="character-level-title"><div class="character-section-title"><h2 id="character-level-title">מי מצטרף למשחק?</h2><span>מתחילות במוכר ומגלות עוד</span></div><div class="character-level-grid">${Object.entries(CHARACTER_LEVELS).filter(([, level]) => level.collection === collection).map(([key, level]) => {
      const members = characterPool(key);
      return `<button class="character-level-card" data-action="character-level" data-level="${key}" aria-pressed="${settings.characterLevel === key}"><span class="character-level-number">שלב ${level.number}</span><div class="character-level-portraits" aria-hidden="true">${members.slice(-3).map(c => characterPortrait(c, '', '', collection)).join('')}</div><h3>${level.name}</h3><p>${level.description}</p><small>${members.length} חברים${practice.completed[key] ? ` · הרפתקאות שהשלמת: ${practice.completed[key]} ${uiIcon('check')}` : ''}</small></button>`;
    }).join('')}</div></section>
    <section class="character-start"><div><span class="section-kicker">${stage.name} · ${CHARACTER_MODES[settings.characterMode]}</span><p>${SESSION_LENGTH} צעדים קטנים · בכל הרפתקה שלמה מקבלות מדבקה</p></div><button class="primary-button" data-action="character-start">בואי נשחק ${uiIcon('arrow')}</button></section>
    <details class="character-roster"><summary>נכיר את החברים ואת השמות שלהם ${uiIcon('sound')}</summary><div class="character-roster-grid">${cast.map(c => `<button data-action="character-sound" data-character="${c.id}" aria-label="שמיעת השם ${c.he}">${characterPortrait(c, descriptions[c.id], '', collection)}<b lang="he" dir="rtl">${characterName(c, settings.nikud)}</b>${uiIcon('sound')}</button>`).join('')}</div></details><p id="audio-notice" class="audio-notice" role="status" hidden></p></main>`;
}

export function characterQuestion(q, nikud) {
  if (q.direction === 'picture-name') return `<div class="character-target"><span class="character-picture-halo" aria-hidden="true"></span>${characterPortrait(q.character, descriptions[q.character.id], '', q.collection)}<p>נמצא את השם שמתאים לתמונה</p></div>`;
  return `<div class="word-card character-word-card"><span class="card-label">מה כתוב כאן?</span><div class="target-word" lang="he" dir="rtl">${characterName(q.character, nikud)}</div><span class="word-underline"></span></div>`;
}

export function characterAnswer(q, option, nikud) {
  return q.direction === 'picture-name'
    ? `<span class="character-answer-name ${option.he.length > 6 ? 'long-character-name' : ''}" lang="he" dir="rtl">${characterName(option, nikud)}</span>`
    : characterPortrait(option, descriptions[option.id], '', q.collection);
}

export function characterAnswerLabel(q, option) { return q.direction === 'picture-name' ? option.he : descriptions[option.id]; }
export function characterMissionArt() { return `<div class="character-mission-faces" aria-hidden="true">${['rubble', 'mix', 'chase'].map(id => characterPortrait(CHARACTERS.find(c => c.id === id), '')).join('')}</div>`; }
