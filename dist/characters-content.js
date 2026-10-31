import { CHARACTERS } from './characters.js';

export const CHARACTER_SCRIPTS = Object.freeze({
  'characters-menu': 'רַאבֶּל וְהַחֲבֵרִים מְחַכִּים לָךְ! נִקְרָא שֵׁמוֹת וְנִמְצָא תְּמוּנוֹת. בַּחֲרִי שָׁלָב וְנַתְחִיל.',
  'characters-menu-paw': 'בְּמִפְרַץ הַהַרְפַּתְקָאוֹת הַחֲבֵרִים מְחַכִּים לָךְ! נִקְרָא שֵׁמוֹת וְנִמְצָא תְּמוּנוֹת. בַּחֲרִי שָׁלָב וְנַתְחִיל.',
  'characters-intro': 'בּוֹאִי נַכִּיר אֶת הַשֵּׁמוֹת שֶׁל הַחֲבֵרִים. פַּעַם נַבִּיט בַּתְּמוּנָה וְנִמְצָא שֵׁם. וּפַעַם נִקְרָא שֵׁם וְנִמְצָא תְּמוּנָה. אִם תִּרְצִי עֶזְרָה, לִחְצִי עַל הַנּוּרָה.',
  'characters-picture-name': 'מַה הַשֵּׁם שֶׁל הַדְּמוּת? מִצְאִי אֶת הַשֵּׁם שֶׁמַּתְאִים לַתְּמוּנָה.',
  'characters-name-picture': 'קִרְאִי אֶת הַשֵּׁם, וּבַחֲרִי אֶת הַתְּמוּנָה הַמַּתְאִימָה.',
  'characters-hint': 'נִשְׁמַע אֶת הַשֵּׁם בְּיַחַד, וְנַמְשִׁיךְ לְנַסּוֹת.',
  'characters-level-friends': 'שָׁלָב רִאשׁוֹן. רַאבֶּל, מִיקְס וְצַ׳ארְגֶ׳ר.',
  'characters-level-crew': 'שָׁלָב שֵׁנִי. גַּם ווִילֶר וּמוֹטוֹר מִצְטָרְפִים.',
  'characters-level-family': 'שָׁלָב שְׁלִישִׁי. כָּל הַמִּשְׁפָּחָה! גַּם דּוֹדָה קְרֵיין וְסַבָּא גְרַאבֶּל.',
  'characters-level-paw-friends': 'שָׁלָב רִאשׁוֹן. צֵ׳ייס, מַרְשַׁל וּסְקַיי.',
  'characters-level-paw-team': 'שָׁלָב שֵׁנִי. גַּם רַאבֶּל, רוֹקִי וְזוּמָה מִצְטָרְפִים.',
  'characters-level-paw-all': 'שָׁלָב שְׁלִישִׁי. כָּל הַחֲבוּרָה! גַּם אֶוֶורֶסְט, לִיבֶּרְטִי וְרַייְדֶר.',
  ...Object.fromEntries(CHARACTERS.map(character => [character.clip, `הַשֵּׁם הוּא ${character.pointed}.`])),
  'character-auntie': 'הַשֵּׁם הוּא דּוֹדָה, קְרֵיין.',
});

// Proper names and prefixed forms are explicit, so Hebrew spelling never has
// to guess the foreign sounds (especially the two different geresh sounds).
export const CHARACTER_LEXICON = Object.freeze({
  'רַאבֶּל': 'ʁˈabel', 'מִיקְס': 'mˈiks', 'צַ׳ארְגֶ׳ר': 'tʃˈaʁdʒeʁ', 'וְצַ׳ארְגֶ׳ר': 'vetʃˈaʁdʒeʁ',
  'ווִילֶר': 'wˈileʁ', 'מוֹטוֹר': 'mˈotoʁ', 'וּמוֹטוֹר': 'umˈotoʁ',
  'דּוֹדָה': 'dodˈa', 'קְרֵיין': 'kʁˈejn', 'סַבָּא': 'sˈaba', 'וְסַבָּא': 'vesˈaba', 'גְרַאבֶּל': 'ɡʁˈabel',
  'שֵׁמוֹת': 'ʃemˈot', 'הַשֵּׁמוֹת': 'haʃemˈot', 'שֵׁם': 'ʃˈem', 'הַשֵּׁם': 'haʃˈem',
  'וְנִמְצָא': 'venimtsˈa', 'תְּמוּנוֹת': 'tmunˈot', 'הַדְּמוּת': 'hadmˈut',
  'וּפַעַם': 'ufˈaʔam', 'מִצְטָרְפִים': 'mitstaʁfˈim', 'הַמִּשְׁפָּחָה': 'hamiʃpaχˈa',
  'לְנַסּוֹת': 'lenasˈot',
  'וְנַתְחִיל': 'venatχˈil', 'תְּמוּנָה': 'tmunˈa', 'שֶׁמַּתְאִים': 'ʃematʔˈim', 'לַתְּמוּנָה': 'latmunˈa',
  'צֵ׳ייס': 'tʃˈejs', 'מַרְשַׁל': 'mˈaʁʃal', 'סְקַיי': 'skˈaj', 'וּסְקַיי': 'uskˈaj',
  'רוֹקִי': 'ʁˈoki', 'זוּמָה': 'zˈuma', 'וְזוּמָה': 'vezˈuma',
  'אֶוֶורֶסְט': 'ˈeveʁest', 'לִיבֶּרְטִי': 'lˈibeʁti', 'רַייְדֶר': 'ʁˈajdeʁ', 'וְרַייְדֶר': 'veʁˈajdeʁ',
  'בְּמִפְרַץ': 'bemifʁˈats', 'הַהַרְפַּתְקָאוֹת': 'hahaʁpatkaʔˈot', 'הַחֲבוּרָה': 'haχavuʁˈa',
});
