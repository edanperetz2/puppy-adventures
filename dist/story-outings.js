export const STORY_OUTINGS = [
  {
    id: 'grandma-letter', title: 'צִיּוּר לְסָבְתָא', icon: 'envelope', featured: true,
    routes: [[1, 2, 5, 6], [3, 4, 7, 8]],
    description: 'מְצַיְּרוֹת עִם לוּלִי וּמְבִיאוֹת לְסָבְתָא הַפְתָּעָה.',
    pup: 'luli', theme: 'picnic', pages: [
      {
        text: 'לוּלִי לוֹקַחַת עִפָּרוֹן.', speech: 'lˈuli lokˈaχat ʔipaʁˈon.',
        task: 'read', target: 'pencil', choices: ['pencil', 'spoon'],
        prompt: 'מָה לוּלִי לוֹקַחַת?', promptSpeech: 'mˈa lˈuli lokˈaχat?',
      },
      {
        text: 'לוּלִי מְצַיֶּרֶת שֶׁמֶשׁ לְסָבְתָא.', speech: 'lˈuli metsajˈeʁet ʃˈemeʃ lesˈavta.',
        task: 'read', target: 'sun', choices: ['moon', 'sun'],
        prompt: 'מָה לוּלִי מְצַיֶּרֶת?', promptSpeech: 'mˈa lˈuli metsajˈeʁet?',
      },
      {
        text: 'לְיַד הַשֶּׁמֶשׁ יֵשׁ שְׁנֵי עֲנָנִים.', speech: 'lejˈad haʃˈemeʃ jˈeʃ ʃnˈej ʔananˈim.',
        task: 'count', target: 'cloud', count: 2,
        prompt: 'כַּמָּה עֲנָנִים יֵשׁ בַּצִּיּוּר?', promptSpeech: 'kˈama ʔananˈim jˈeʃ batsijˈuʁ?',
      },
      {
        text: 'טוֹפִי מְצַיֵּר לֵב אָדֹם.', speech: 'tˈofi metsajˈeʁ lˈev ʔadˈom.',
        task: 'choose', target: 'color-heart-red', choices: ['color-heart-red', 'color-ball-red'],
        prompt: 'מָה טוֹפִי מְצַיֵּר?', promptSpeech: 'mˈa tˈofi metsajˈeʁ?',
      },
      {
        text: 'לוּלִי מוֹסִיפָה שְׁלוֹשָׁה פְּרָחִים.', speech: 'lˈuli mosifˈa ʃloʃˈa pʁaχˈim.',
        task: 'count', target: 'flower', count: 3,
        prompt: 'כַּמָּה פְּרָחִים יֵשׁ בַּצִּיּוּר?', promptSpeech: 'kˈama pʁaχˈim jˈeʃ batsijˈuʁ?',
      },
      {
        text: 'בּוֹבִּי מְצַיֵּר פַּרְפַּר כָּחֹל.', speech: 'bˈobi metsajˈeʁ paʁpˈaʁ kaχˈol.',
        task: 'choose', target: 'color-butterfly-blue', choices: ['color-butterfly-red', 'color-flower-blue', 'color-butterfly-blue'],
        prompt: 'אֵיזֶה פַּרְפַּר בַּצִּיּוּר?', promptSpeech: 'ʔˈejze paʁpˈaʁ batsijˈuʁ?',
      },
      {
        text: 'הַצִּיּוּר מוּכָן. הַמַּעֲטָפָה עַל הַשֻּׁלְחָן.', speech: 'hatsijˈuʁ muχˈan. hamaʔatafˈa ʔˈal haʃulχˈan.',
        task: 'place', target: 'envelope', relation: 'on',
        prompt: 'אֵיפֹה נָשִׂים אֶת הַמַּעֲטָפָה?', promptSpeech: 'ʔˈejfo nasˈim ʔˈet hamaʔatafˈa?',
      },
      {
        text: 'לוּלִי קוֹשֶׁרֶת סֶרֶט סְבִיב הַמַּעֲטָפָה.', speech: 'lˈuli koʃˈeʁet sˈeʁet svˈiv hamaʔatafˈa.',
        task: 'read', target: 'ribbon', choices: ['necklace', 'ribbon', 'feather'],
        prompt: 'מָה לוּלִי קוֹשֶׁרֶת?', promptSpeech: 'mˈa lˈuli koʃˈeʁet?',
      },
      {
        text: 'הַתִּיק לְיַד הַשֻּׁלְחָן. הַצִּיּוּר בִּפְנִים.', speech: 'hatˈik lejˈad haʃulχˈan. hatsijˈuʁ bifnˈim.',
        task: 'place', target: 'backpack', relation: 'beside',
        prompt: 'אֵיפֹה נָשִׂים אֶת הַתִּיק?', promptSpeech: 'ʔˈejfo nasˈim ʔˈet hatˈik?',
      },
      {
        text: 'סָבְתָא פּוֹתַחַת אֶת הַמַּעֲטָפָה וּמְצַיֶּרֶת כּוֹכָב לְלוּלִי.', speech: 'sˈavta potˈaχat ʔˈet hamaʔatafˈa umetsajˈeʁet koχˈav lelˈuli.',
        task: 'choose', target: 'star', choices: ['sun', 'star', 'heart'],
        prompt: 'מָה סָבְתָא מְצַיֶּרֶת לְלוּלִי?', promptSpeech: 'mˈa sˈavta metsajˈeʁet lelˈuli?',
      },
    ],
  },
  {
    id: 'garden-concert', title: 'הַהוֹפָעָה בַּגִּנָּה', icon: 'drum', featured: true,
    routes: [[1, 2, 5, 6], [3, 4, 7, 8]],
    description: 'מְכִינוֹת בָּמָה עִם בּוֹבִּי וּמְגַלּוֹת מִי בָּא לִשְׁמֹעַ.',
    pup: 'bobi', theme: 'picnic', pages: [
      {
        text: 'בּוֹבִּי מוֹצִיא אֶת הַתֹּף.', speech: 'bˈobi motsˈi ʔˈet hatˈof.',
        task: 'read', target: 'drum', choices: ['drum', 'piano'],
        prompt: 'מָה בּוֹבִּי מוֹצִיא?', promptSpeech: 'mˈa bˈobi motsˈi?',
      },
      {
        text: 'לוּלִי מֵבִיאָה חָלִיל.', speech: 'lˈuli meviʔˈa χalˈil.',
        task: 'read', target: 'flute', choices: ['flute', 'guitar'],
        prompt: 'מָה לוּלִי מֵבִיאָה?', promptSpeech: 'mˈa lˈuli meviʔˈa?',
      },
      {
        text: 'מוּל הַנַּגָּנִים יֵשׁ שְׁלוֹשָׁה כִּסְאוֹת.', speech: 'mˈul hanaɡanˈim jˈeʃ ʃloʃˈa kisʔˈot.',
        task: 'count', target: 'chair', count: 3,
        prompt: 'כַּמָּה כִּסְאוֹת יֵשׁ?', promptSpeech: 'kˈama kisʔˈot jˈeʃ?',
      },
      {
        text: 'טוֹפִי בּוֹחֵר גִּיטָרָה.', speech: 'tˈofi boχˈeʁ ɡitˈaʁa.',
        task: 'read', target: 'guitar', choices: ['trumpet', 'guitar'],
        prompt: 'מָה טוֹפִי בּוֹחֵר?', promptSpeech: 'mˈa tˈofi boχˈeʁ?',
      },
      {
        text: 'בּוֹבִּי מְסַדֵּר אַרְבָּעָה כִּסְאוֹת.', speech: 'bˈobi mesadˈeʁ ʔaʁbaʔˈa kisʔˈot.',
        task: 'count', target: 'chair', count: 4,
        prompt: 'כַּמָּה כִּסְאוֹת יֵשׁ?', promptSpeech: 'kˈama kisʔˈot jˈeʃ?',
      },
      {
        text: 'הַמִּיקְרוֹפוֹן עַל הַשֻּׁלְחָן.', speech: 'hamikʁofˈon ʔˈal haʃulχˈan.',
        task: 'place', target: 'microphone', relation: 'on',
        prompt: 'אֵיפֹה נָשִׂים אֶת הַמִּיקְרוֹפוֹן?', promptSpeech: 'ʔˈejfo nasˈim ʔˈet hamikʁofˈon?',
      },
      {
        text: 'לוּלִי מְנַגֶּנֶת וְצִפּוֹר שָׁרָה אִתָּהּ.', speech: 'lˈuli menaɡˈenet vetsipˈoʁ ʃˈaʁa ʔitˈa.',
        task: 'choose', target: 'bird', choices: ['rabbit', 'bird', 'frog'],
        prompt: 'מִי שָׁרָה עִם לוּלִי?', promptSpeech: 'mˈi ʃˈaʁa ʔim lˈuli?',
      },
      {
        text: 'הַחֲצוֹצְרָה עַל הַשֻּׁלְחָן. תֵּכֶף מַתְחִילִים.', speech: 'haχatsotsʁˈa ʔˈal haʃulχˈan. tˈeχef matχilˈim.',
        task: 'place', target: 'trumpet', relation: 'on',
        prompt: 'אֵיפֹה נָשִׂים אֶת הַחֲצוֹצְרָה?', promptSpeech: 'ʔˈejfo nasˈim ʔˈet haχatsotsʁˈa?',
      },
      {
        text: 'צְפַרְדֵּעַ שׁוֹמַעַת אֶת הַנְּגִינָה וְקוֹפֶצֶת.', speech: 'tsfaʁdˈea ʃomˈaʔat ʔˈet haneɡinˈa vekofˈetset.',
        task: 'choose', target: 'frog', choices: ['frog', 'turtle', 'cat'],
        prompt: 'מִי קוֹפֶצֶת בַּהוֹפָעָה?', promptSpeech: 'mˈi kofˈetset bahofaʔˈa?',
      },
      {
        text: 'הַשִּׁיר נִגְמַר. לוּלִי מְקַבֶּלֶת זֵר פְּרָחִים.', speech: 'haʃˈiʁ niɡmˈaʁ. lˈuli mekabˈelet zˈeʁ pʁaχˈim.',
        task: 'choose', target: 'bouquet', choices: ['bouquet', 'balloon', 'crown'],
        prompt: 'מָה לוּלִי מְקַבֶּלֶת?', promptSpeech: 'mˈa lˈuli mekabˈelet?',
      },
    ],
  },
  {
    id: 'treasure-map', title: 'מַפַּת הָאוֹצָר שֶׁל טוֹפִי', icon: 'map', featured: true,
    routes: [[1, 2, 5, 6], [3, 4, 7, 8]],
    description: 'עוֹקְבוֹת אַחֲרֵי הָרְמָזִים וּמְגַלּוֹת מָה מֻחְבָּא בַּקֻּפְסָה.',
    pup: 'tofi', theme: 'lost-ball', pages: [
      {
        text: 'טוֹפִי פּוֹתֵחַ מַפָּה.', speech: 'tˈofi potˈeaχ mapˈa.',
        task: 'read', target: 'map', choices: ['map', 'book'],
        prompt: 'מָה טוֹפִי פּוֹתֵחַ?', promptSpeech: 'mˈa tˈofi potˈeaχ?',
      },
      {
        text: 'בַּמַּפָּה מְצֻיָּר עֵץ.', speech: 'bamapˈa metsujˈaʁ ʔˈets.',
        task: 'read', target: 'tree', choices: ['house', 'tree'],
        prompt: 'מָה מְצֻיָּר בַּמַּפָּה?', promptSpeech: 'mˈa metsujˈaʁ bamapˈa?',
      },
      {
        text: 'לְיַד הָעֵץ יֵשׁ שָׁלוֹשׁ נוֹצוֹת.', speech: 'lejˈad haʔˈets jˈeʃ ʃalˈoʃ notsˈot.',
        task: 'count', target: 'feather', count: 3,
        prompt: 'כַּמָּה נוֹצוֹת יֵשׁ?', promptSpeech: 'kˈama notsˈot jˈeʃ?',
      },
      {
        text: 'בַּמַּפָּה מְצֻיָּר גֶּשֶׁר.', speech: 'bamapˈa metsujˈaʁ ɡˈeʃeʁ.',
        task: 'read', target: 'bridge', choices: ['bridge', 'house'],
        prompt: 'מָה מְצֻיָּר בַּמַּפָּה?', promptSpeech: 'mˈa metsujˈaʁ bamapˈa?',
      },
      {
        text: 'עַל הַשְּׁבִיל יֵשׁ שְׁנֵי צְדָפִים.', speech: 'ʔˈal haʃvˈil jˈeʃ ʃnˈej tsdafˈim.',
        task: 'count', target: 'shell', count: 2,
        prompt: 'כַּמָּה צְדָפִים טוֹפִי מוֹצֵא?', promptSpeech: 'kˈama tsdafˈim tˈofi motsˈe?',
      },
      {
        text: 'אַרְנָב שׁוֹמֵר עַל הַמַּפְתֵּחַ.', speech: 'ʔaʁnˈav ʃomˈeʁ ʔˈal hamaftˈeaχ.',
        task: 'choose', target: 'rabbit', choices: ['fox', 'rabbit', 'mouse'],
        prompt: 'מִי שׁוֹמֵר עַל הַמַּפְתֵּחַ?', promptSpeech: 'mˈi ʃomˈeʁ ʔˈal hamaftˈeaχ?',
      },
      {
        text: 'טוֹפִי מוֹצֵא קֻפְסָה מִתַּחַת לַשֻּׁלְחָן.', speech: 'tˈofi motsˈe kufsˈa mitˈaχat laʃulχˈan.',
        task: 'place', target: 'box', relation: 'under',
        prompt: 'אֵיפֹה נָשִׂים אֶת הַקֻּפְסָה?', promptSpeech: 'ʔˈejfo nasˈim ʔˈet hakufsˈa?',
      },
      {
        text: 'צָב מַרְאֶה לְטוֹפִי אֶת הַדֶּרֶךְ.', speech: 'tsˈav maʁʔˈe letˈofi ʔˈet hadˈeʁeχ.',
        task: 'choose', target: 'turtle', choices: ['snail', 'rabbit', 'turtle'],
        prompt: 'מִי מַרְאֶה לְטוֹפִי אֶת הַדֶּרֶךְ?', promptSpeech: 'mˈi maʁʔˈe letˈofi ʔˈet hadˈeʁeχ?',
      },
      {
        text: 'טוֹפִי מוֹצֵא קֻפְסָה לְיַד הַשֻּׁלְחָן.', speech: 'tˈofi motsˈe kufsˈa lejˈad haʃulχˈan.',
        task: 'place', target: 'box', relation: 'beside',
        prompt: 'אֵיפֹה נָשִׂים אֶת הַקֻּפְסָה?', promptSpeech: 'ʔˈejfo nasˈim ʔˈet hakufsˈa?',
      },
      {
        text: 'טוֹפִי פּוֹתֵחַ אֶת הַקֻּפְסָה. יֵשׁ בָּהּ כֶּתֶר!', speech: 'tˈofi potˈeaχ ʔˈet hakufsˈa. jˈeʃ bˈa kˈeteʁ!',
        task: 'choose', target: 'crown', choices: ['ring', 'crown', 'necklace'],
        prompt: 'מָה טוֹפִי מוֹצֵא בַּקֻּפְסָה?', promptSpeech: 'mˈa tˈofi motsˈe bakufsˈa?',
      },
    ],
  },
];
