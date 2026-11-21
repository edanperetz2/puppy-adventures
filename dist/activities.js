import { SESSION_LENGTH } from './adventure.js?v=2.2.2-six';
import { CLOCK_ACTIVITIES_ENABLED, isChapterAvailable, isPracticeAvailable } from './availability.js';

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

export const LISTEN_AND_CHOOSE_ANIMAL = 'listen-pick-animal';

export const DAILY_ACTIVITY = Object.freeze({
  icon: CLOCK_ACTIVITIES_ENABLED ? 'train' : 'duck',
  he: Object.freeze(['מְשִׂימָה קְטַנָּה לְהַיּוֹם', CLOCK_ACTIVITIES_ENABLED
    ? 'חוֹזְרוֹת עַל דַּקּוֹת בַּשָּׁעוֹן אוֹ עַל מִלִּים בְּאַנְגְּלִית בְּסִפּוּר חָדָשׁ.'
    : 'מַקְשִׁיבוֹת לְשֵׁמוֹת שֶׁל חַיּוֹת בְּאַנְגְּלִית וּמַעֲבִירוֹת אוֹתָן לַבְּרֵכָה.']),
  en: Object.freeze(['A Little Mission Today', CLOCK_ACTIVITIES_ENABLED
    ? 'Revisit telling time or listening to English in a fresh six-step scene.'
    : 'Listen for animal names in English and move the animals to the pond.']),
});

export const MY_JOURNEY = Object.freeze({
  id: 'my-journey',
  route: Object.freeze({ action: 'chapters' }),
  he: Object.freeze(['הַמַּסָּע שֶׁלִּי', [
    CLOCK_ACTIVITIES_ENABLED ? 'קוֹרְאוֹת, מְחַבְּרוֹת וּמְכַוְּנוֹת שָׁעוֹן בַּפִּיקְנִיק.' : 'קוֹרְאוֹת וּמְחַבְּרוֹת בַּפִּיקְנִיק.',
    'מַקְשִׁיבוֹת לְמִלִּים בְּאַנְגְּלִית עִם בּוֹבִּי.',
    isChapterAvailable('boatyard') && 'בּוֹנוֹת סִירוֹת עִם לוּלִי.',
    isChapterAvailable('theater') && 'מַעֲלוֹת הַצָּגָה בַּתֵּאַטְרוֹן.',
  ].filter(Boolean).join(' ')]),
  en: Object.freeze(['My Journey', [
    CLOCK_ACTIVITIES_ENABLED ? 'Read, add, and set the clock at the picnic.' : 'Read and add at the picnic.',
    'Listen for English words on Bobi’s delivery trip.',
    isChapterAvailable('boatyard') && 'Build boats with Luli.',
    isChapterAvailable('theater') && 'Direct a show.',
  ].filter(Boolean).join(' ')]),
  icon: 'boat',
});

export const PICNIC = Object.freeze({
  id: 'picnic',
  route: Object.freeze({ action: 'picnic' }),
  chapter: 'הַפִּיקְנִיק שֶׁל הַחֲבֵרִים',
  detail: CLOCK_ACTIVITIES_ENABLED ? 'קוֹרְאוֹת רְמָזִים, מְחַבְּרוֹת וּמְכַוְּנוֹת אֶת הַשָּׁעוֹן.' : 'קוֹרְאוֹת רְמָזִים וּמְחַבְּרוֹת כַּמּוּיוֹת.',
  intro: 'picnic-welcome',
  steps: SESSION_LENGTH,
});

export const PICNIC_MISSIONS = Object.freeze({
  reading: { domain: 'hebrew', title: 'מְסַדְּרוֹת אֶת הַמָּקוֹם', description: 'קִרְאִי וְהַזִּיזִי דְּבָרִים לַמָּקוֹם הַנָּכוֹן.', icon: 'star' },
  addition: { domain: 'math', title: 'מְכִינוֹת אֶת הַכִּבּוּד', description: 'חַבְּרִי שְׁתֵּי קְבוּצוֹת וּמִצְאִי כַּמָּה יֵשׁ בְּיַחַד.', icon: 'apple' },
  clock: { domain: 'clock', title: 'מָתַי הַחֲבֵרִים מַגִּיעִים?', description: 'הַזִּיזִי אֶת הַמְּחוֹגִים וּסְפְרִי דַּקּוֹת.', icon: 'clock' },
});

export const AVAILABLE_PICNIC_MISSIONS = Object.freeze(Object.fromEntries(
  Object.entries(PICNIC_MISSIONS).filter(([, mission]) => isPracticeAvailable(mission.domain)),
));
export const isPicnicReady = finished => Object.keys(AVAILABLE_PICNIC_MISSIONS).every(path => finished.includes(path));

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
  aboard: { title: 'מִי עוֹלֶה לַסִּירָה?', description: 'בּוֹחֲרוֹת חַיָּה שֶׁתַּעֲלֶה לַסִּירָה.', icon: 'duck', prompt: LISTEN_AND_CHOOSE_ANIMAL },
  cargo: { title: 'מָה נָשִׂים בַּסַּל?', description: 'מַקְשִׁיבוֹת וּבוֹחֲרוֹת מָה לֶאֱרֹז.', icon: 'basket', prompt: 'journey-english-one' },
  route: { title: 'מִי יְקַבֵּל חֲבִילָה?', description: 'בּוֹחֲרוֹת חַיָּה שֶׁתְּקַבֵּל חֲבִילָה.', icon: 'gift', prompt: LISTEN_AND_CHOOSE_ANIMAL },
});

export const BOATYARD = Object.freeze({
  id: 'boatyard',
  route: Object.freeze({ action: 'boatyard' }),
  chapter: 'בּוֹנוֹת סִירָה עִם לוּלִי',
  detail: 'מְעַצְּבוֹת סִירָה, בּוֹדְקוֹת מָה צָף וּמַשִּׁיטוֹת חֲבִילוֹת.',
  intro: 'boatyard-welcome',
  icon: 'boat',
  steps: SESSION_LENGTH,
});

export const BOATYARD_MISSIONS = Object.freeze({
  shape: { title: 'מְשַׁנּוֹת צוּרָה', description: 'מֵאוֹתוֹ חֹמֶר נַעֲשֶׂה כַּדּוּר וְסִירָה. מָה יִקְרֶה בַּמַּיִם?', icon: 'boat' },
  cargo: { title: 'מַעֲמִיסוֹת חֲבִילוֹת', description: 'כַּמָּה הַסִּירָה יְכוֹלָה לָשֵׂאת? נוֹסִיף חֲבִילָה וְנִבְדֹּק.', icon: 'gift' },
  crossing: { title: 'מַשִּׁיטוֹת אֶת הַמִּשְׁלוֹחַ', description: 'בּוֹחֲרוֹת סִירָה שֶׁתּוּכַל לְהָבִיא אֶת כָּל הַחֲבִילוֹת.', icon: 'basket' },
});

export const THEATER = Object.freeze({
  id: 'theater',
  route: Object.freeze({ action: 'theater' }),
  chapter: 'תֵּאַטְרוֹן הַחֲבֵרִים',
  detail: 'מְסַדְּרוֹת אֶת הַבָּמָה וּמַעֲלוֹת הַצָּגָה.',
  icon: 'door',
  intro: 'theater-welcome',
  steps: SESSION_LENGTH,
});

export const THEATER_SHOWS = Object.freeze({
  backstage: { title: 'מֵאֲחוֹרֵי הַקְּלָעִים', description: 'פּוֹתְחוֹת וִילוֹן וּמְסַדְּרוֹת מָה קוֹרֶה קֹדֶם.', icon: 'door', domain: 'hebrew' },
  party: { title: 'הַמְּסִבָּה', description: 'מְכִינוֹת כּוֹסוֹת לְכָל הַחֲבֵרִים.', icon: 'cup', domain: 'math' },
  shadow: { title: 'הַצֵּל עַל הַבָּמָה', description: 'מַדְלִיקוֹת מְנוֹרָה וּמְשַׁנּוֹת אֶת גֹּדֶל הַצֵּל.', icon: 'moon', domain: 'math' },
});
