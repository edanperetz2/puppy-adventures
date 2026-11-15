const lines = [
  ['welcome', 'לוּלִי בּוֹנָה סִירָה לַמִּשְׁלוֹחַ שֶׁל בּוֹבִּי.', 'lˈuli bonˈa siʁˈa lamiʃlˈoaχ ʃˈel bˈobi.'],
  ['predict-ball', 'מָה יִקְרֶה לַכַּדּוּר? הוּא יָצוּף אוֹ יִשְׁקַע?', 'mˈa jikʁˈe lakadˈuʁ? hˈu jatsˈuf ʔˈo jiʃkˈa?'],
  ['predict-boat', 'מָה יִקְרֶה לַסִּירָה?', 'mˈa jikʁˈe lasiʁˈa?'],
  ['predict-load', 'מָה יִקְרֶה כְּשֶׁנּוֹסִיף עוֹד חֲבִילָה?', 'mˈa jikʁˈe kʃenosˈif ʔˈod χavilˈa?'],
  ['mold', 'בּוֹאִי נַעֲשֶׂה סִירָה מֵאוֹתוֹ חֹמֶר.', 'boˈi naʔasˈe siʁˈa meʔotˈo χˈomeʁ.'],
  ['launch', 'עַכְשָׁו נַנִּיחַ בַּמַּיִם וְנִרְאֶה.', 'aχʃˈav nanˈiaχ bamˈajim veniʁʔˈe.'],
  ['ball-sank', 'הַכַּדּוּר שָׁקַע.', 'hakadˈuʁ ʃakˈa.'],
  ['floats', 'הַסִּירָה צָפָה.', 'hasiʁˈa tsafˈa.'],
  ['flooded', 'מַיִם נִכְנְסוּ לַסִּירָה.', 'mˈajim niχnesˈu lasiʁˈa.'],
  ['shape', 'זֶה אוֹתוֹ חֹמֶר. צוּרַת הַסִּירָה עוֹזֶרֶת לָהּ לִדְחֹק יוֹתֵר מַיִם.', 'zˈe ʔotˈo χˈomeʁ. tsuʁˈat hasiʁˈa ʔozˈeʁet lˈa lidχˈok jotˈeʁ mˈajim.'],
  ['add', 'הוֹסִיפִי חֲבִילָה. שִׂימִי לֵב לְקַו הַמַּיִם.', 'hosˈifi χavilˈa. sˈimi lˈev lekˈav hamˈajim.'],
  ['lower', 'הַסִּירָה יָרְדָה עוֹד קְצָת בַּמַּיִם.', 'hasiʁˈa jaʁdˈa ʔˈod ktsˈat bamˈajim.'],
  ['lift', 'נְרוֹקֵן אֶת הַמַּיִם.', 'neʁokˈen ʔˈet hamˈajim.'],
  ['remove', 'הוֹצִיאִי חֲבִילָה אַחַת וְנַסִּי שׁוּב.', 'hotsiʔˈi χavilˈa ʔaχˈat venasˈi ʃˈuv.'],
  ['higher', 'אֵיזוֹ סִירָה יוֹשֶׁבֶת גָּבוֹהַּ יוֹתֵר בַּמַּיִם?', 'ʔˈejzo siʁˈa joʃˈevet ɡavˈoaχ jotˈeʁ bamˈajim?'],
  ['which-floats', 'אֵיזוֹ סִירָה צָפָה עִם הַחֲבִילוֹת?', 'ʔˈejzo siʁˈa tsafˈa ʔˈim haχavilˈot?'],
  ['choose', 'בַּחֲרִי סִירָה. שִׂימִי בָּהּ אֶת כָּל הַחֲבִילוֹת.', 'baχaʁˈi siʁˈa. sˈimi bˈa ʔˈet kˈol haχavilˈot.'],
  ['sail', 'בּוֹאִי נַעֲבֹר לַצַּד הַשֵּׁנִי!', 'boˈi naʔavˈoʁ latsˈad haʃenˈi!'],
  ['arrived', 'הַמִּשְׁלוֹחַ הִגִּיעַ!', 'hamiʃlˈoaχ hiɡˈiaʔ!'],
];

export const BOATYARD_CLIPS = Object.fromEntries(lines.map(([key, text, speech]) => [
  `boatyard-${key}`, { lang: 'he-IL', text, speech },
]));
