import { art, uiIcon } from './art.js';
import { LETTERS, letterShape, writingLetter } from './letters.js';
import { mountLetterPad } from './letter-pad.js?v=2.3.1-number-writing';
import { WORDS } from './reading.js';
import { LETTER_EXAMPLES } from './word-practice-expansion.js';

const dictionary = new Map(WORDS.map(word => [word.id, word]));
const menus = new Map();
export const WRITING_WORDS = { hebrew: [], english: [] };
for (const [language, alphabet] of Object.entries(LETTERS)) {
  const bank = WRITING_WORDS[language];
  for (const letter of alphabet) {
    const choices = [];
    for (const example of LETTER_EXAMPLES[letter.id]) {
      const plain = example.text.replace(/\p{M}/gu, '');
      if (plain.length < 2 || plain.length > 6) continue;
      // Keep the printed clue and the letters Ariel traces in exact agreement,
      // including when she switches off vowel marks.
      if (language === 'hebrew' && plain !== dictionary.get(example.id)?.he) continue;
      const indices = [...plain].map(character => alphabet.findIndex(entry => entry.familiar === character));
      if (indices.includes(-1)) continue;
      let word = bank.find(entry => entry.id === example.id);
      if (word && word.plain !== plain) continue;
      if (!word) {
        word = { ...example, plain, indices };
        bank.push(word);
      }
      choices.push(word);
    }
    menus.set(letter.id, choices);
  }
  for (const [index, letter] of alphabet.entries()) {
    const choices = menus.get(letter.id);
    // Some English letters appear inside familiar short words (U in SUN, X in FOX).
    for (const word of bank) {
      if (choices.length >= 3) break;
      if (!choices.includes(word) && word.indices.includes(index)) choices.push(word);
    }
    choices.sort((a, b) => a.indices.length - b.indices.length);
  }
}

export function writingWordChoices(letter) {
  return menus.get(letter.id) || [];
}

export function wordLabel(word, language, form, nikud) {
  if (language === 'hebrew') return nikud ? word.text : word.plain;
  return form === 'main' ? word.plain : word.plain.toLowerCase();
}

export function savedWritingWord(drafts, language, form) {
  const saved = drafts?.[`${language}:${form}`];
  const word = WRITING_WORDS[language].find(entry => entry.id === saved?.id);
  if (!word || !Number.isInteger(saved.index) || saved.index < 0 || saved.index >= word.indices.length) return null;
  return { word, index: saved.index };
}

export function wordPicker(letter, form, nikud, drafts) {
  const language = letter.language, he = language === 'hebrew';
  const resume = savedWritingWord(drafts, language, form);
  const choose = word => `<button type="button" data-action="write-word" data-word="${word.id}">${art(word.id)}<bdi dir="${he ? 'rtl' : 'ltr'}">${wordLabel(word, language, form, nikud)}</bdi></button>`;
  return `<details class="letter-word-picker"><summary>${uiIcon('pencil')} נכתוב מילה שלמה</summary>
    ${resume ? `<button type="button" class="secondary-button" data-action="write-word" data-word="${resume.word.id}">נמשיך לכתוב · <bdi>${wordLabel(resume.word, language, form, nikud)}</bdi></button>` : ''}
    <div class="letter-word-choices">${writingWordChoices(letter).filter(word => word !== resume?.word).map(choose).join('')}</div></details>`;
}

export function mountWritingWord(root, { language, form, word, index, nikud, motion, speak, onTraced, onBack }) {
  const he = language === 'hebrew', dir = he ? 'rtl' : 'ltr';
  const text = wordLabel(word, language, form, nikud);
  const models = word.indices.map(i => writingLetter(language, i, form));
  const events = new AbortController();
  let pad, traced = false;
  const currentClip = () => models[index]?.clip;
  function replay() { speak([word.clip, ...(currentClip() ? [currentClip(), 'letters-trace'] : [])]); }
  function draw() {
    pad?.destroy();
    const finished = index === models.length;
    const forms = models.map((letter, i) => `<span class="word-glyph ${i < index ? 'written' : ''}" ${i === index ? 'aria-current="step"' : ''}>${letterShape(letter)}</span>`).join('');
    root.innerHTML = `<button type="button" class="text-button" data-word-button="back">${uiIcon('arrow')} בחזרה לאותיות</button>
      <section class="letter-lesson-card word-trace-card"><div class="word-trace-title">${art(word.id)}
        <div><h1 tabindex="-1">${finished ? 'כָּתַבְתְּ אֶת הַמִּלָּה!' : 'כּוֹתְבוֹת מִלָּה'}</h1><bdi dir="${dir}" lang="${he ? 'he' : 'en'}">${text}</bdi></div>
        <button class="circle-button" type="button" data-word-button="sound" aria-label="שמיעת המילה">${uiIcon('sound')}</button></div>
        <div class="written-word" dir="${dir}" aria-label="${text}">${forms}</div>
        ${finished ? `<button type="button" class="primary-button" data-word-button="back">נבחר מילה נוספת ${uiIcon('arrow')}</button>` :
          `<p class="word-letter-count">אוֹת ${index + 1} מִתּוֹךְ ${models.length}</p>
          <div class="letter-pad-card"><div class="word-tracing-pad">${letterShape(models[index], { guide: true, pad: true })}<p class="letter-pad-caption" role="status" aria-live="polite"></p></div>
          <div class="letter-pad-controls"><button type="button" data-word-button="demo">${uiIcon('pencil')} הראי לי איך</button></div></div>
          <button class="primary-button" type="button" data-word-button="next" disabled>${index === models.length - 1 ? 'לַמִּלָּה הַשְּׁלֵמָה' : 'לָאוֹת הַבָּאָה'} ${uiIcon('arrow')}</button>`}</section>`;
    if (finished) return;
    pad = mountLetterPad(root.querySelector('.word-tracing-pad'), { motion, onComplete() {
      if (traced) return;
      traced = true;
      onTraced(models[index], index + 1);
      const next = root.querySelector('[data-word-button=next]');
      next.disabled = false;
      next.focus({ preventScroll: true });
      speak('letters-trace-done');
    } });
  }
  root.addEventListener('click', e => {
    const action = e.target.closest('[data-word-button]')?.dataset.wordButton;
    if (action === 'back') onBack();
    if (action === 'sound') speak(word.clip, true);
    if (action === 'demo') { pad.demo(); speak('letters-demo'); }
    if (action !== 'next' || !traced) return;
    index++; traced = false; draw();
    root.querySelector('h1').focus({ preventScroll: true });
    speak(currentClip() || ['correct-1', word.clip]);
  }, { signal: events.signal });
  draw();
  return { replay, destroy() { events.abort(); pad?.destroy(); } };
}
