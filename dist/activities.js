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

export const PICNIC = Object.freeze({
  id: 'picnic',
  route: Object.freeze({ action: 'picnic' }),
  he: Object.freeze(['הַמַּסָּע שֶׁלִּי', 'פִּיקְנִיק בְּשָׁלוֹשׁ מְשִׂימוֹת שֶׁל שִׁשָּׁה צְעָדִים. קְרִיאָה, חִבּוּר וּשְׁעוֹן.']),
  en: Object.freeze(['My Journey', 'Get a picnic ready in three six-step missions. Read clues, add groups, and move clock hands.']),
  chapter: 'הַפִּיקְנִיק שֶׁל הַחֲבֵרִים',
  icon: 'basket',
  intro: 'picnic-welcome',
  steps: SESSION_LENGTH,
});

export const PICNIC_MISSIONS = Object.freeze({
  reading: { domain: 'hebrew', title: 'מְסַדְּרוֹת אֶת הַמָּקוֹם', description: 'קִרְאִי וְהַזִּיזִי דְּבָרִים לַמָּקוֹם הַנָּכוֹן.', icon: 'star' },
  addition: { domain: 'math', title: 'מְכִינוֹת אֶת הַכִּבּוּד', description: 'חַבְּרִי שְׁתֵּי קְבוּצוֹת וּמִצְאִי כַּמָּה יֵשׁ בְּיַחַד.', icon: 'apple' },
  clock: { domain: 'clock', title: 'מָתַי הַחֲבֵרִים מַגִּיעִים?', description: 'הַזִּיזִי אֶת הַמְּחוֹגִים וּסְפְרִי דַּקּוֹת.', icon: 'clock' },
});
