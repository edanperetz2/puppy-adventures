import { LETTER_EXAMPLES } from './word-practice-expansion.js';
import { art,uiIcon } from './art.js';
import { escapeHtml } from './profiles.js';
export function letterExampleCards(letter,nikud=true) {
  const examples=LETTER_EXAMPLES[letter.id]||[],hebrew=letter.language==='hebrew';
  return `<div class="letter-word-examples" data-learning-text dir="${hebrew?'rtl':'ltr'}" aria-label="דוגמאות לאות בתוך מילים">${examples.map(example=>{
    const text=hebrew&&!nikud?example.text.replace(/[\u0591-\u05c7]/gu,''):example.text;
    const letters=hebrew?[...text.matchAll(/[א-ת][\u0591-\u05c7]*|[^א-ת]/gu)].map(m=>m[0]):[...text];
    const highlight=example.position==='end'?letters.length-1:0;
    const word=letters.map((char,i)=>i===highlight?`<mark>${escapeHtml(char)}</mark>`:escapeHtml(char)).join('');
    return `<button type="button" class="${example.text.length>8?'wide-word-example':''}" data-action="letter-example" data-clip="${example.clip}" aria-label="שמיעת ${escapeHtml(example.text)}">${art(example.id)}<bdi lang="${hebrew?'he':'en'}" dir="${hebrew?'rtl':'ltr'}">${word}</bdi>${uiIcon('sound')}</button>`;
  }).join('')}</div>`;
}
