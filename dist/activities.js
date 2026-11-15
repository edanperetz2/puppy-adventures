import { SESSION_LENGTH } from './adventure.js?v=2.2.2-six';

export const LITTLE_STORIES = Object.freeze({
  id: 'little-stories',
  route: Object.freeze({ action: 'reading-level', level: 'sentences' }),
  he: Object.freeze(['סִפּוּרִים קְטַנִּים', 'קוֹרְאוֹת מִשְׁפָּט, בּוֹחֲרוֹת תְּמוּנָה אוֹ מַמְחִיזוֹת.']),
  en: Object.freeze(['Little Stories', 'Read a short sentence, match it to a picture, or act it out.']),
  icon: 'story-action-luli-waters-flower',
  intro: 'reading-sentences',
  steps: SESSION_LENGTH,
});

export const ENGLISH_LISTENING = Object.freeze({
  id: 'english-listening',
  route: Object.freeze({ action: 'journey-start', mode: 'english', level: 'single' }),
  he: Object.freeze(['מִלָּה אַחַת בְּכָל פַּעַם', 'מַקְשִׁיבוֹת בְּאַנְגְּלִית וּבוֹחֲרוֹת תְּמוּנָה.']),
  icon: 'dog',
});
