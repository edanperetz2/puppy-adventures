import { escapeHtml } from './profiles.js';
import { characterName } from './characters-view.js?v=2.2.2-six';
import { letterHeading } from './letters.js';

function heading(text, lang, clip, speakerLabel, sentence = false) {
  const content = sentence ? text.split(' ').map(token => `<span class="reading-token">${escapeHtml(token)}</span>`).join(' ') : escapeHtml(text);
  const dir = lang === 'en' ? 'ltr' : 'rtl';
  return {
    html: `<h1 id="question-title" tabindex="-1" class="${sentence ? 'reading-sentence' : 'reading-word'}" lang="${lang}" dir="${dir}">${content}</h1>`,
    clip, speakerLabel,
  };
}

export function classicReadingHeading(q, nikud) {
  if (q.type === 'letter') {
    const toMain = q.direction === 'to-main';
    const form = q.letter.language === 'hebrew'
      ? (toMain ? 'בִּדְפוּס' : 'בִּכְתַב יָד')
      : (toMain ? 'גְּדוֹלָה' : 'קְטַנָּה');
    const instruction = `אֵיזוֹ אוֹת ${form} מַתְאִימָה?`;
    return {
      html: letterHeading(q.letter, { familiar: !toMain, id: 'question-title' }),
      clip: q.letter.clip,
      speakerLabel: 'השמעת שם האות',
      instruction: nikud ? instruction : instruction.replace(/\p{M}/gu, ''),
    };
  }
  if (q.type === 'read' && q.direction !== 'picture-sentence') {
    const sentence = Boolean(q.word.scene || q.word.he.includes(' '));
    return heading(nikud ? q.word.pointed : q.word.he, 'he', `he-${q.word.id}`, sentence ? 'השמעת המשפט' : 'השמעת המילה', sentence);
  }
  if (q.type === 'word-form') {
    const hebrew = q.word.language === 'hebrew';
    return heading(hebrew && nikud ? q.word.pointed : q.word.plain, hebrew ? 'he' : 'en', q.word.clip, 'השמעת המילה');
  }
  if (q.type === 'character' && q.direction === 'name-picture') {
    return heading(characterName(q.character, nikud), 'he', q.character.clip, 'השמעת השם');
  }
  return null;
}
