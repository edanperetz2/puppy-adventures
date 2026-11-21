import { DAILY_ACTIVITY, LITTLE_STORIES, MY_JOURNEY, THEATER } from './activities.js';
import { CLOCK_ACTIVITIES_ENABLED, isChapterAvailable, isPracticeAvailable } from './availability.js';

export const GUIDE_ITEMS = [
  { icon: MY_JOURNEY.icon, he: MY_JOURNEY.he, en: MY_JOURNEY.en },
  DAILY_ACTIVITY,
  ...(isChapterAvailable('theater') ? [{
    icon: THEATER.icon, he: [THEATER.chapter, 'מְסַדְּרוֹת פְּעֻלּוֹת, מְכִינוֹת כּוֹסוֹת, מְשַׂחֲקוֹת בְּצֵל וְשׁוֹמְרוֹת הַצָּגוֹת.'],
    en: ['Friends’ Theater', 'Put actions in order, serve guests, change a shadow, and save a show of your own.'],
  }] : []),
  { icon: 'flower', he: ['גִּנַּת הַמִּלִּים', `עֲשָׂרָה שְׁלָבִים עַד ״${LITTLE_STORIES.he[0]}״. ${LITTLE_STORIES.he[1]} גַּם מִתְּמוּנָה לְמִשְׁפָּט.`],
    en: ['Word Garden', `Ten stages up to ${LITTLE_STORIES.en[0]}. ${LITTLE_STORIES.en[1]} Or pick a sentence for a picture.`] },
  { icon: 'pencil', he: ['סַדְנַת הַמִּלִּים', 'בּוֹנוֹת מִלִּים מֵחֲלָקִים וּמַשְׁלִימוֹת אוֹתִיּוֹת וּמִשְׁפָּטִים.'],
    en: ['Word Workshop', 'Build Hebrew words from smaller pieces, fill in a missing letter, and find the word that fits a sentence.'] },
  { icon: 'book', he: ['סִפּוּר שֶׁמְּשַׂחֲקִים', 'בּוֹחֲרוֹת סִפּוּר. עוֹזְרוֹת לְלוּלִי לְצַיֵּר לְסָבְתָא אוֹ לְטוֹפִי לִמְצֹא אוֹצָר.'],
    en: ['Playable Stories', 'Choose a story. Help Luli draw a picture for Grandma or follow Tofi’s treasure map.'] },
  { icon: 'letters', he: ['סְטוּדְיוֹ הָאוֹתִיּוֹת', 'מְזַהוֹת אוֹתִיּוֹת וּמְתַרְגְּלוֹת כְּתִיבָה. מַתְאִימוֹת מִלִּים מִדְּפוּס לִכְתַב יָד, וּבְאַנְגְּלִית מֵאוֹתִיּוֹת גְּדוֹלוֹת לִקְטַנּוֹת.'],
    en: ['Letter Studio', 'Match letters and practice writing. Match whole words from Hebrew print to handwriting or English capitals to lowercase.'] },
  { icon: 'boat', he: ['מִפְרַץ הָאַנְגְּלִית', 'מַקְשִׁיבוֹת לְמִלָּה אַחַת. אֶפְשָׁר לְהַמְשִׁיךְ לְצֵרוּפִים, לִצְלִילִים וְלִקְרִיאָה.'],
    en: ['English Bay', 'Hear one word and choose its picture. Try pairs, first sounds and short written words when ready.'] },
  { icon: 'apple', he: ['סַדְנַת הַמִּסְפָּרִים', 'סְפִירָה, חִבּוּר, כַּמָּה נִשְׁאֲרוּ, עֲשָׂרוֹת וִיחִידוֹת. כּוֹתְבוֹת מֵ־0 עַד 100 גַּם מִשְּׁמִיעָה, וְחוֹתְכוֹת פֵּרוֹת.'],
    en: ['Number Workshop', 'Count in frames, add, find what is left, and practise tens and ones. Write 0–100 by sight or dictation. Slice fruit into halves.'] },
  ...(CLOCK_ACTIVITIES_ENABLED ? [
    { icon: 'clock', he: ['גַּן הַשְּׁעוֹנִים', 'עֲשָׂרָה שִׁעוּרִים. מְזִיזוֹת אֶת שְׁנֵי הַמְּחוֹגִים וּמְתַרְגְּלוֹת קְרִיאַת שָׁעוֹת וְדַקּוֹת.'],
      en: ['Clock Garden', 'Ten lessons from minutes and hours to exact times. Move both hands and practise reading the clock.'] },
  ] : []),
  ...(isPracticeAvailable('science') ? [{
    icon: 'lab', he: ['מַעְבֶּדֶת הַמַּדָּע', 'מְנַסּוֹת עִם מַיִם, שֶׁמֶן, סַבּוֹן וּפִלְפֵּל. בּוֹדְקוֹת מָה צָף וְאֵיךְ קֶרַח נָמֵס.'],
    en: ['Science Lab', 'Try oil and water with soap, float or sink, melting ice, and pepper with a drop of soap.'],
  }] : []),
  { icon: 'dog', he: ['חֲבֵרִים מֵהַמָּסָךְ', 'מִשֵּׁם לִתְמוּנָה וּמִתְּמוּנָה לְשֵׁם. נְשַׂחֵק עִם רַאבֶּל וְהַבַּנָּאִים, מִפְרַץ הַהַרְפַּתְקָאוֹת, פִּיקָאצ׳וּ וְסְטִיץ׳.'],
    en: ['Screen Friends', 'Match names and pictures both ways. Play with either puppy crew or choose All Together to include Pikachu and Stitch.'] },
  { icon: 'pikachu', he: ['מְחַפְּשׂוֹת עִם פִּיקָאצ׳וּ', 'מַתְאִימוֹת מִלִּים וּתְמוּנוֹת, מַקְפִּיצוֹת חַיּוֹת וְשׁוֹמְעוֹת אֶת פִּיקָאצ׳וּ.'],
    en: ['Searching with Pikachu', 'Match Hebrew words to pictures, make animals hop, and tap Pikachu to hear his greeting.'] },
  { icon: 'stitch', he: ['מְחַפְּשׂוֹת עִם סְטִיץ׳', 'קוֹרְאוֹת רֶמֶז קָצָר וּבוֹחֲרוֹת אֶת הַתְּמוּנָה הַמַּתְאִימָה. נוֹגְעוֹת בִּסְטִיץ׳ וְהוּא רוֹקֵד.'],
    en: ['Searching with Stitch', 'Read a short Hebrew clue and choose the matching picture. Tap Stitch to make him dance.'] },
];

export const GUIDE_EXTRAS = [
  { icon: 'star', he: ['הָאַלְבּוֹם וְהַפָּארְק שֶׁלִּי', 'מְסַיְּמוֹת הַרְפַּתְקַת תִּרְגּוּל, אוֹסְפוֹת מַדְבֵּקוֹת וּפוֹתְחוֹת קִשּׁוּטִים לַפָּארְק.'],
    en: ['Sticker Album & Puppy Park', 'Finish practice adventures to collect stickers and unlock park decorations.'] },
  { icon: 'paw', he: ['לַהוֹרִים', 'הַקּוֹל שֶׁל אווה מְלַוֶּה אֶת הַמִּשְׂחָק בְּעִבְרִית. קוֹד שֶׁל מִשְׁפָּחָה מְשַׁתֵּף אֶת הָאַלְבּוֹם. הוֹרִידוּ הַקְלָטוֹת בַּהַגְדָּרוֹת לְמִשְׂחָק בְּלִי אִינְטֶרְנֶט.'],
    en: ['For parents', 'Ava guides play in Hebrew. A family code pairs albums. Download recordings in Settings for full offline narration.'] },
];
