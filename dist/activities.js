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

export const MY_JOURNEY = Object.freeze({
  id: 'my-journey',
  route: Object.freeze({ action: 'chapters' }),
  he: Object.freeze(['הַמַּסָּע שֶׁלִּי', 'פִּיקְנִיק לִקְרִיאָה, חִבּוּר וּשְׁעוֹן. מִשְׁלוֹחִים לְתִרְגּוּל הַקְשָׁבָה בְּאַנְגְּלִית.']),
  en: Object.freeze(['My Journey', 'Read clues, add, and set the clock at the picnic. Listen to English words to help Bobi make deliveries.']),
  icon: 'boat',
});

export const PICNIC = Object.freeze({
  id: 'picnic',
  route: Object.freeze({ action: 'picnic' }),
  chapter: 'הַפִּיקְנִיק שֶׁל הַחֲבֵרִים',
  detail: 'קוֹרְאוֹת רְמָזִים, מְחַבְּרוֹת וּמְכַוְּנוֹת אֶת הַשָּׁעוֹן.',
  intro: 'picnic-welcome',
  steps: SESSION_LENGTH,
});

export const PICNIC_MISSIONS = Object.freeze({
  reading: { domain: 'hebrew', title: 'מְסַדְּרוֹת אֶת הַמָּקוֹם', description: 'קִרְאִי וְהַזִּיזִי דְּבָרִים לַמָּקוֹם הַנָּכוֹן.', icon: 'star' },
  addition: { domain: 'math', title: 'מְכִינוֹת אֶת הַכִּבּוּד', description: 'חַבְּרִי שְׁתֵּי קְבוּצוֹת וּמִצְאִי כַּמָּה יֵשׁ בְּיַחַד.', icon: 'apple' },
  clock: { domain: 'clock', title: 'מָתַי הַחֲבֵרִים מַגִּיעִים?', description: 'הַזִּיזִי אֶת הַמְּחוֹגִים וּסְפְרִי דַּקּוֹת.', icon: 'clock' },
});

export const DELIVERY = Object.freeze({
  id: 'delivery',
  route: Object.freeze({ action: 'delivery' }),
  chapter: 'הַמִּשְׁלוֹחַ שֶׁל בּוֹבִּי',
  detail: 'מַקְשִׁיבוֹת לְמִלָּה בְּאַנְגְּלִית וְעוֹזְרוֹת לְבּוֹבִּי בַּמַּסָּע.',
  icon: 'boat',
  intro: 'delivery-welcome',
  steps: SESSION_LENGTH,
});

export const DELIVERY_MISSIONS = Object.freeze({
  aboard: { title: 'מִי עוֹלֶה לַסִּירָה?', description: 'מַקְשִׁיבוֹת וּמַעֲלוֹת חַיּוֹת לַסִּירָה.', icon: 'duck', prompt: 'delivery-aboard' },
  cargo: { title: 'אוֹסְפוֹת צִיּוּד', description: 'מַקְשִׁיבוֹת וְאוֹרְזוֹת אֶת הַצִּיּוּד בַּסַּל.', icon: 'basket', prompt: 'delivery-pack' },
  route: { title: 'מַגִּיעוֹת לַחֲבֵרִים', description: 'מַקְשִׁיבוֹת וּמְבִיאוֹת חֲבִילָה לַחָבֵר הַנָּכוֹן.', icon: 'gift', prompt: 'delivery-route' },
});
