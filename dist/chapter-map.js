import { BOATYARD, BOATYARD_MISSIONS, DELIVERY, DELIVERY_MISSIONS, MY_JOURNEY, PICNIC, PICNIC_MISSIONS, THEATER, THEATER_SHOWS } from './activities.js';
import { uiIcon } from './art.js';
import { chapterText } from './chapter-ui.js';
import { deliveryScene } from './delivery-view.js';
import { picnicScene } from './picnic-view.js';
import { boatyardScene } from './boatyard-view.js';
import { theaterPreview } from './theater-ui.js';

export function chapterEntry(nikud) {
  const label = chapterText(nikud);
  return `<section class="picnic-entry chapter-entry" aria-labelledby="chapter-entry-title">
    ${boatyardScene()}<div class="picnic-entry-copy"><h2 id="chapter-entry-title">${label(MY_JOURNEY.he[0])}</h2>
    <p>${label('פִּיקְנִיק, מִשְׁלוֹחִים, סִירוֹת וְהַצָּגוֹת')}</p>
    <button class="primary-button" data-action="${MY_JOURNEY.route.action}">${label('לַמַּסָּע שֶׁלִּי')} ${uiIcon('arrow')}</button></div>
  </section>`;
}

export function chapterMap({ picnic, delivery, boatyard, theater }, nikud) {
  const label = chapterText(nikud);
  const choice = (chapter, renderScene, progress, missions) => `<button class="chapter-choice chapter-${chapter.id}" data-action="${chapter.route.action}">
    ${renderScene(progress.finished)}
    <span class="chapter-choice-copy">
      <span class="chapter-choice-title">${label(chapter.chapter)}</span>
      <span class="chapter-choice-detail">${label(chapter.detail)}</span>
      <span class="chapter-choice-go">${label(progress.finished.length
        ? `${progress.finished.length} מִתּוֹךְ ${Object.keys(missions).length} מְשִׂימוֹת הֻשְׁלְמוּ` : 'לַפֶּרֶק')} ${uiIcon('arrow')}</span>
    </span>
  </button>`;
  return `<main id="main" class="picnic-page chapter-page">
    <button class="text-button back-button" data-action="home">${uiIcon('home')} ${label('לְבֵית הַחֲבֵרִים')}</button>
    <h1 tabindex="-1">${label(MY_JOURNEY.he[0])}</h1><div class="chapter-choices">
      ${choice(PICNIC, picnicScene, picnic, PICNIC_MISSIONS)}
      ${choice(DELIVERY, deliveryScene, delivery, DELIVERY_MISSIONS)}
      ${choice(BOATYARD, boatyardScene, boatyard, BOATYARD_MISSIONS)}
      ${choice(THEATER, theaterPreview, theater, THEATER_SHOWS)}
    </div>
  </main>`;
}
