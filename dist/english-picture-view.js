import { art, uiIcon } from './art.js';
import { paintedReadingObject } from './reading-scenes.js?v=2.7.0-science';

export function englishMatchPicture(entry) {
  if (entry.scene) return art(entry.scene);
  if (entry.count) {
    const object = art(entry.noun);
    return `<span class="match-count" data-count="${entry.count}">${object.repeat(entry.count)}</span>`;
  }
  return paintedReadingObject(entry.noun, entry.color, art(entry.noun));
}

export function englishPictureView(task, state) {
  const reverse = task.level === 'picture-words';
  const disabled = state.resolved ? 'disabled' : '';
  const label = entry => `<b lang="en" dir="ltr">${entry.text.toUpperCase()}</b>`;
  const audioButton = (action, entry, description) => `<button class="match-sound" data-j="${action}" data-voice="${entry.id}" aria-label="${description}">${uiIcon('sound')}</button>`;
  const prompt = reverse
    ? `<div class="match-model" role="img" aria-label="${task.target.he}">${englishMatchPicture(task.target)}</div>`
    : `<div class="match-word">${label(task.target)}${audioButton('listen', task.target, 'שמיעה באנגלית')}</div>`;
  const hint = state.showModel && !state.resolved
    ? `<div class="match-hint">${reverse ? label(task.target) : englishMatchPicture(task.target)}</div>` : '';
  const choices = task.choices.map((entry, index) => {
    if (!reverse) return `<button data-j="answer" data-answer="${entry.id}" aria-label="${entry.he}" ${disabled}>${englishMatchPicture(entry)}</button>`;
    return `<div class="match-option"><button data-j="answer" data-answer="${entry.id}" ${disabled}>${label(entry)}</button>
      ${audioButton('match-option-voice', entry, `שמיעת אפשרות ${index + 1} באנגלית`)}</div>`;
  }).join('');
  return `<p class="journey-instruction">${reverse ? 'מָה רוֹאִים בַּתְּמוּנָה?' : 'אֵיזוֹ תְּמוּנָה מַתְאִימָה?'}</p>
    ${prompt}${hint}<div class="${reverse ? 'match-labels' : 'journey-choices match-pictures'}" role="group" aria-label="בחירת תשובה">${choices}</div>`;
}
