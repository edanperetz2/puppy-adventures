const lines = [
  ['welcome', 'בּוֹאִי נָכִין פִּיקְנִיק לַחֲבֵרִים.', 'boˈi naχˈin pˈiknik laχaveʁˈim.'],
  ['read-model', 'הִנֵּה הַכּוֹכָב, עַל הַשֻּׁלְחָן.', 'hinˈe hakoχˈav ʔˈal haʃulχˈan.'],
  ['add-model', 'שְׁנַיִם וְעוֹד אֶחָד הֵם שְׁלוֹשָׁה.', 'ʃnˈajim veʔˈod ʔeχˈad hˈem ʃloʃˈa.'],
  ['add-move', 'הַזִּיזִי אֶת שְׁתֵּי הַקְּבוּצוֹת לַשְּׂמִיכָה.', 'hazˈizi ʔˈet ʃtˈej hakvutsˈot lasmiχˈa.'],
  ['tap-apples', 'לִחְצִי עַל שְׁתֵּי קְבוּצוֹת הַתַּפּוּחִים.', 'liχtsˈi ʔˈal ʃtˈej kvutsˈot hatapuχˈim.'],
  ['tap-next', 'עַכְשָׁו לִחְצִי עַל הַקְּבוּצָה הַשְּׁנִיָּה.', 'ʔaχʃˈav liχtsˈi ʔˈal hakvutsˈa haʃnijˈa.'],
  ['add-choose', 'כַּמָּה יֵשׁ בְּיַחַד?', 'kˈama jˈeʃ bejˈaχad?'],
  ['clock-model', 'מִקַּו לְקַו עוֹבֶרֶת דַּקָּה אַחַת. בְּשָׁעָה יֵשׁ שִׁשִּׁים דַּקּוֹת.', 'mikˈav lekˈav ʔovˈeʁet dakˈa ʔaχˈat. beʃaʔˈa jˈeʃ ʃiʃˈim dakˈot.'],
  ['clock-set', 'בּוֹאִי נְכַוֵּן אֶת הַשָּׁעוֹן.', 'boˈi neχavˈen ʔˈet haʃaʔˈon.'],
  ['clock-elapsed', 'הַזִּיזִי אֶת הַמָּחוֹג הָאָרֹךְ קָדִימָה.', 'hazˈizi ʔˈet hamaχˈoɡ haʔaʁˈoχ kadˈima.'],
  ['finish', 'הַפִּיקְנִיק מוּכָן. כָּל הַחֲבֵרִים כָּאן!', 'hapˈiknik muχˈan. kˈol haχaveʁˈim kˈan!'],
];

export const PICNIC_CLIPS = Object.fromEntries(lines.map(([key, text, speech]) => [
  `picnic-${key}`, { lang: 'he-IL', text, speech },
]));
