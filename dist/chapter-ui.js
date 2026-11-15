import { art, uiIcon } from './art.js';

export const chapterText = nikud => text => nikud ? text : text.replace(/\p{M}/gu, '');

export function chapterMissions(missions, { drafts, finished }, action, theme, label) {
  const cards = Object.entries(missions).map(([path, mission]) => {
    const saved = drafts[path], done = finished.includes(path);
    const status = saved ? `מַמְשִׁיכוֹת מִצַּעַד ${saved.index + 1}` : done ? 'מְשַׂחֲקוֹת שׁוּב' : 'מַתְחִילוֹת';
    return `<button class="picnic-mission ${theme}-${path}" data-action="${action}" data-path="${path}">
      <span class="picnic-mission-art" aria-hidden="true">${art(mission.icon)}</span>
      <span class="picnic-mission-title">${label(mission.title)}</span><span class="picnic-mission-detail">${label(mission.description)}</span>
      <span class="picnic-mission-go">${label(status)} ${uiIcon('arrow')}</span>
      ${done ? `<span class="picnic-done" aria-label="${label('הֻשְׁלַם')}">${uiIcon('check')}</span>` : ''}
    </button>`;
  }).join('');
  return `<div class="picnic-missions" role="group" aria-label="${label('מְשִׂימוֹת הַפֶּרֶק')}">${cards}</div>`;
}
