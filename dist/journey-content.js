// Curriculum data only. Speech is reviewed, explicit Hebrew IPA for the local
// Ava-reference pipeline; it must not be guessed from the displayed Hebrew.
// Chunk text joins back to the existing pointed word, with graphemes intact.
export const WORKSHOP_WORDS = [
  { id: 'dog', level: 1, chunks: [{ text: 'כֶּ', speech: 'kˈe' }, { text: 'לֶב', speech: 'lˈev' }] },
  { id: 'sun', level: 1, chunks: [{ text: 'שֶׁ', speech: 'ʃˈe' }, { text: 'מֶשׁ', speech: 'mˈeʃ' }] },
  { id: 'cat', level: 1, chunks: [{ text: 'חָ', speech: 'χˈa' }, { text: 'תוּל', speech: 'tˈul' }] },
  { id: 'ball', level: 1, chunks: [{ text: 'כַּ', speech: 'kˈa' }, { text: 'דּוּר', speech: 'dˈuʁ' }] },
  { id: 'butterfly', level: 2, chunks: [{ text: 'פַּרְ', speech: 'pˈaʁ' }, { text: 'פַּר', speech: 'pˈaʁ' }] },
  { id: 'rabbit', level: 2, chunks: [{ text: 'אַרְ', speech: 'ʔˈaʁ' }, { text: 'נָב', speech: 'nˈav' }] },
  { id: 'window', level: 2, chunks: [{ text: 'חַ', speech: 'χˈa' }, { text: 'לּוֹן', speech: 'lˈon' }] },
  { id: 'airplane', level: 2, chunks: [{ text: 'מָ', speech: 'mˈa' }, { text: 'טוֹס', speech: 'tˈos' }] },
  { id: 'table', level: 3, chunks: [{ text: 'שֻׁלְ', speech: 'ʃˈul' }, { text: 'חָן', speech: 'χˈan' }] },
  { id: 'snail', level: 3, chunks: [{ text: 'שַׁבְּ', speech: 'ʃˈab' }, { text: 'לוּל', speech: 'lˈul' }] },
  { id: 'guitar', level: 3, chunks: [{ text: 'גִּי', speech: 'ɡˈi' }, { text: 'טָ', speech: 'tˈa' }, { text: 'רָה', speech: 'ʁˈa' }] },
  { id: 'banana', level: 3, chunks: [{ text: 'בָּ', speech: 'bˈa' }, { text: 'נָ', speech: 'nˈa' }, { text: 'נָה', speech: 'nˈa' }] },
  { id: 'car', level: 4, chunks: [{ text: 'מְ', speech: 'mˈe' }, { text: 'כוֹ', speech: 'χˈo' }, { text: 'נִית', speech: 'nˈit' }] },
  { id: 'chocolate', level: 4, chunks: [{ text: 'שׁוֹ', speech: 'ʃˈo' }, { text: 'קוֹ', speech: 'kˈo' }, { text: 'לָד', speech: 'lˈad' }] },
  { id: 'bicycle', level: 4, chunks: [{ text: 'אוֹ', speech: 'ʔˈo' }, { text: 'פַ', speech: 'fˈa' }, { text: 'נַּ', speech: 'nˈa' }, { text: 'יִם', speech: 'jˈim' }] },
  { id: 'glasses', level: 4, chunks: [{ text: 'מִשְׁ', speech: 'mˈiʃ' }, { text: 'קָ', speech: 'kˈa' }, { text: 'פַ', speech: 'fˈa' }, { text: 'יִם', speech: 'jˈim' }] },
];

// Each placement uses the table as its anchor. Counts describe the complete
// visible group on that page. Choice lists contain the target exactly once.
// English tasks play only en-<english>, never a phrase or an English sentence.
export const STORIES = [
  {
    id: 'picnic', title: 'הַפִּיקְנִיק שֶׁל טוֹפִי',
    description: 'מְכִינִים פִּיקְנִיק קָטָן, עוֹזְרִים וְסוֹפְרִים בְּיַחַד.',
    pup: 'tofi', theme: 'picnic', pages: [
      {
        text: 'לְטוֹפִי יֵשׁ שֻׁלְחָן.', speech: 'letˈofi jˈeʃ ʃulχˈan.',
        task: 'read', target: 'table', choices: ['table', 'tree'],
        prompt: 'נִקְרָא וְנִבְחַר אֶת הַשֻּׁלְחָן.', promptSpeech: 'nikʁˈa venivχˈaʁ ʔˈet haʃulχˈan.',
      },
      {
        text: 'עַל הַשֻּׁלְחָן יֵשׁ תַּפּוּחַ.', speech: 'ʔˈal haʃulχˈan jˈeʃ tapˈuaχ.',
        task: 'place', target: 'apple', relation: 'on',
        prompt: 'נָשִׂים אֶת הַתַּפּוּחַ עַל הַשֻּׁלְחָן.', promptSpeech: 'nasˈim ʔˈet hatapˈuaχ ʔˈal haʃulχˈan.',
      },
      {
        text: 'עַכְשָׁו יֵשׁ שְׁנֵי תַּפּוּחִים.', speech: 'ʔaχʃˈav jˈeʃ ʃnˈej tapuχˈim.',
        task: 'count', target: 'apple', count: 2,
        prompt: 'נִסְפֹּר אֶת הַתַּפּוּחִים.', promptSpeech: 'nispˈoʁ ʔˈet hatapuχˈim.',
      },
      {
        text: 'לוּלִי מֵבִיאָה לֶחֶם לַפִּיקְנִיק.', speech: 'lˈuli meviʔˈa lˈeχem lapˈiknik.',
        task: 'read', target: 'bread', choices: ['bread', 'ball'],
        prompt: 'נִבְחַר מָה לוּלִי הֵבִיאָה.', promptSpeech: 'nivχˈaʁ mˈa lˈuli heviʔˈa.',
      },
      {
        text: 'בּוֹבִּי רוֹאֶה חָתוּל לְיַד הָעֵץ.', speech: 'bˈobi ʁoʔˈe χatˈul lejˈad haʔˈets.',
        task: 'english', target: 'cat', english: 'cat', choices: ['dog', 'cat'],
        prompt: 'נַקְשִׁיב לְמִלָּה אַחַת בְּאַנְגְּלִית.', promptSpeech: 'nakʃˈiv lemilˈa ʔaχˈat beʔanɡlˈit.',
      },
      {
        text: 'הַכַּדּוּר מִתַּחַת לַשֻּׁלְחָן; יֵשׁ מָקוֹם לָאֹכֶל.', speech: 'hakadˈuʁ mitˈaχat laʃulχˈan, jˈeʃ makˈom laʔˈoχel.',
        task: 'place', target: 'ball', relation: 'under',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר מִתַּחַת לַשֻּׁלְחָן.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ mitˈaχat laʃulχˈan.',
      },
      {
        text: 'לוּלִי מוֹסִיפָה תַּפּוּחַ לַחֲבֵרִים.', speech: 'lˈuli mosifˈa tapˈuaχ laχaveʁˈim.',
        task: 'count', target: 'apple', count: 3,
        prompt: 'נִסְפֹּר כַּמָּה תַּפּוּחִים יֵשׁ עַכְשָׁו.', promptSpeech: 'nispˈoʁ kˈama tapuχˈim jˈeʃ ʔaχʃˈav.',
      },
      {
        text: 'בּוֹבִּי שׁוֹמֵר כַּדּוּר כָּחֹל לַמִּשְׂחָק.', speech: 'bˈobi ʃomˈeʁ kadˈuʁ kaχˈol lamisχˈak.',
        task: 'choose', target: 'color-ball-blue', choices: ['color-ball-red', 'color-ball-blue', 'color-car-blue'],
        prompt: 'נִבְחַר אֶת הַכַּדּוּר שֶׁבַּסִּפּוּר.', promptSpeech: 'nivχˈaʁ ʔˈet hakadˈuʁ ʃebasipˈuʁ.',
      },
      {
        text: 'טוֹפִי מוֹסִיף תַּפּוּחַ רְבִיעִי לַשֻּׁלְחָן.', speech: 'tˈofi mosˈif tapˈuaχ ʁeviʔˈi laʃulχˈan.',
        task: 'count', target: 'apple', count: 4,
        prompt: 'נִסְפֹּר אֶת כָּל הַתַּפּוּחִים שֶׁהֵכַנּוּ.', promptSpeech: 'nispˈoʁ ʔˈet kˈol hatapuχˈim ʃeheχˈanu.',
      },
      {
        text: 'הַפִּיקְנִיק מוּכָן; הַכַּדּוּר לְיַד הַשֻּׁלְחָן.', speech: 'hapˈiknik muχˈan, hakadˈuʁ lejˈad haʃulχˈan.',
        task: 'place', target: 'ball', relation: 'beside',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר בַּמָּקוֹם שֶׁכָּתוּב.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ bamakˈom ʃekatˈuv.',
      },
    ],
  },
  {
    id: 'lost-ball', title: 'לוּלִי וְהַכַּדּוּר שֶׁנֶּעֱלַם',
    description: 'מְחַפְּשִׂים כַּדּוּר, שָׂמִים לֵב לַצֶּבַע וְחוֹזְרִים לְשַׂחֵק.',
    pup: 'luli', theme: 'lost-ball', pages: [
      {
        text: 'לְלוּלִי יֵשׁ כַּדּוּר.', speech: 'lelˈuli jˈeʃ kadˈuʁ.',
        task: 'read', target: 'ball', choices: ['ball', 'apple'],
        prompt: 'נִקְרָא וְנִבְחַר אֶת הַכַּדּוּר.', promptSpeech: 'nikʁˈa venivχˈaʁ ʔˈet hakadˈuʁ.',
      },
      {
        text: 'הַכַּדּוּר נָח עַל הַשֻּׁלְחָן.', speech: 'hakadˈuʁ nˈaχ ʔˈal haʃulχˈan.',
        task: 'place', target: 'ball', relation: 'on',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר עַל הַשֻּׁלְחָן.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ ʔˈal haʃulχˈan.',
      },
      {
        text: 'לוּלִי רוֹאָה כֶּלֶב.', speech: 'lˈuli ʁoʔˈa kˈelev.',
        task: 'english', target: 'dog', english: 'dog', choices: ['dog', 'cat'],
        prompt: 'נַקְשִׁיב לְמִלָּה אַחַת בְּאַנְגְּלִית.', promptSpeech: 'nakʃˈiv lemilˈa ʔaχˈat beʔanɡlˈit.',
      },
      {
        text: 'הַכַּדּוּר נָפַל, וְלוּלִי מְחַפֶּשֶׂת אוֹתוֹ.', speech: 'hakadˈuʁ nafˈal, velˈuli meχapˈeset ʔotˈo.',
        task: 'choose', target: 'ball', choices: ['sun', 'ball'],
        prompt: 'נִבְחַר מָה לוּלִי מְחַפֶּשֶׂת.', promptSpeech: 'nivχˈaʁ mˈa lˈuli meχapˈeset.',
      },
      {
        text: 'בּוֹבִּי מוֹצֵא פֶּרַח לְיַד הָעֵץ.', speech: 'bˈobi motsˈe pˈeʁaχ lejˈad haʔˈets.',
        task: 'read', target: 'flower', choices: ['flower', 'ball'],
        prompt: 'נִבְחַר מָה בּוֹבִּי מוֹצֵא.', promptSpeech: 'nivχˈaʁ mˈa bˈobi motsˈe.',
      },
      {
        text: 'טוֹפִי רוֹאֶה שְׁנֵי כַּדּוּרִים.', speech: 'tˈofi ʁoʔˈe ʃnˈej kaduʁˈim.',
        task: 'count', target: 'ball', count: 2,
        prompt: 'נִסְפֹּר אֶת הַכַּדּוּרִים.', promptSpeech: 'nispˈoʁ ʔˈet hakaduʁˈim.',
      },
      {
        text: 'אֶחָד אָדֹם, וְאֶחָד כָּחֹל.', speech: 'ʔeχˈad ʔadˈom, veʔeχˈad kaχˈol.',
        task: 'english', target: 'color-ball-red', english: 'red', choices: ['color-ball-blue', 'color-ball-red'],
        prompt: 'נַקְשִׁיב לְמִלָּה אַחַת בְּאַנְגְּלִית.', promptSpeech: 'nakʃˈiv lemilˈa ʔaχˈat beʔanɡlˈit.',
      },
      {
        text: 'הַכַּדּוּר שֶׁל לוּלִי כָּחֹל, לֹא אָדֹם.', speech: 'hakadˈuʁ ʃˈel lˈuli kaχˈol, lˈo ʔadˈom.',
        task: 'choose', target: 'color-ball-blue', choices: ['color-car-blue', 'color-ball-red', 'color-ball-blue'],
        prompt: 'נִבְחַר אֶת הַכַּדּוּר שֶׁל לוּלִי.', promptSpeech: 'nivχˈaʁ ʔˈet hakadˈuʁ ʃˈel lˈuli.',
      },
      {
        text: 'לוּלִי מוֹצֵאת אוֹתוֹ מִתַּחַת לַשֻּׁלְחָן.', speech: 'lˈuli motsˈet ʔotˈo mitˈaχat laʃulχˈan.',
        task: 'place', target: 'ball', relation: 'under',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר בַּמָּקוֹם שֶׁכָּתוּב.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ bamakˈom ʃekatˈuv.',
      },
      {
        text: 'הַכַּדּוּר לְיַד הַשֻּׁלְחָן, וְכֻלָּם חוֹזְרִים לְשַׂחֵק.', speech: 'hakadˈuʁ lejˈad haʃulχˈan, veχulˈam χozʁˈim lesaχˈek.',
        task: 'place', target: 'ball', relation: 'beside',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר בַּמָּקוֹם שֶׁכָּתוּב.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ bamakˈom ʃekatˈuv.',
      },
    ],
  },
];

export const JOURNEY_HEBREW_CLIPS = {
  'journey-workshop-intro': { text: 'נִבְנֶה מִלִּים מֵחֲלָקִים, בְּקֶצֶב נָעִים.', speech: 'nivnˈe milˈim meχalakˈim, bekˈetsev naʔˈim.' },
  'journey-workshop-build': { text: 'נַקְשִׁיב לַחֲלָקִים וְנַחְבֵּר מִלָּה.', speech: 'nakʃˈiv laχalakˈim venaχbˈeʁ milˈa.' },
  'journey-workshop-missing': { text: 'חָסֵר חֵלֶק אֶחָד. נִבְחַר אֶת הַחֵלֶק הַמַּתְאִים.', speech: 'χasˈeʁ χˈelek ʔeχˈad. nivχˈaʁ ʔˈet haχˈelek hamatʔˈim.' },
  'journey-workshop-listen': { text: 'נַקְשִׁיב לְכָל חֵלֶק בְּנִפְרָד, וְאָז לַמִּלָּה הַשְּׁלֵמָה.', speech: 'nakʃˈiv leχˈol χˈelek benifʁˈad, veʔˈaz lamilˈa haʃlemˈa.' },
  'journey-workshop-word': { text: 'נַקְשִׁיב לַמִּלָּה הַשְּׁלֵמָה.', speech: 'nakʃˈiv lamilˈa haʃlemˈa.' },
  'journey-workshop-complete': { text: 'חִבַּרְנוּ אֶת כָּל הַחֲלָקִים לְמִלָּה אַחַת.', speech: 'χibˈaʁnu ʔˈet kˈol haχalakˈim lemilˈa ʔaχˈat.' },
  'journey-story-intro': { text: 'נִקְרָא סִפּוּר קָצָר, וְנַעֲזֹר לַחֲבֵרִים בְּכָל עַמּוּד.', speech: 'nikʁˈa sipˈuʁ katsˈaʁ, venaʔazˈoʁ laχaveʁˈim beχˈol ʔamˈud.' },
  'journey-story-next': { text: 'נַמְשִׁיךְ לָעַמּוּד הַבָּא.', speech: 'namʃˈiχ laʔamˈud habˈa.' },
  'journey-story-place': { text: 'נִקְרָא אֵיפֹה הַחֵפֶץ צָרִיךְ לִהְיוֹת, וְנָשִׂים אוֹתוֹ שָׁם.', speech: 'nikʁˈa ʔˈefo haχˈefets tsaʁˈiχ lihjˈot, venasˈim ʔotˈo ʃˈam.' },
  'journey-story-placed': { text: 'הַחֵפֶץ בַּמָּקוֹם הַמַּתְאִים.', speech: 'haχˈefets bamakˈom hamatʔˈim.' },
  'journey-story-count': { text: 'נִסְפֹּר אֶת הַחֲפָצִים שֶׁבַּסִּפּוּר.', speech: 'nispˈoʁ ʔˈet haχafatsˈim ʃebasipˈuʁ.' },
  'journey-story-choose': { text: 'נִקְרָא וְנִבְחַר אֶת הַתְּמוּנָה הַמַּתְאִימָה.', speech: 'nikʁˈa venivχˈaʁ ʔˈet hatmunˈa hamatʔimˈa.' },
  'journey-count-all': { text: 'נִגַּע בְּכָל חֵפֶץ פַּעַם אַחַת וְנִסְפֹּר.', speech: 'niɡˈa beχˈol χˈefets pˈaʔam ʔaχˈat venispˈoʁ.' },
  'journey-missing-quantity': { text: 'נִבְדֹּק כַּמָּה יֵשׁ וְכַמָּה עוֹד חָסֵר.', speech: 'nivdˈok kˈama jˈeʃ veχˈama ʔˈod χasˈeʁ.' },
  'journey-take-away': { text: 'נָסִיר אֶת הַכַּמּוּת הַכְּתוּבָה וְנִסְפֹּר מָה נִשְׁאַר.', speech: 'nasˈiʁ ʔˈet hakamˈut haktuvˈa venispˈoʁ mˈa niʃʔˈaʁ.' },
  'journey-tens': { text: 'נֶאֱסֹף עֶשֶׂר יְחִידוֹת לִקְבוּצָה אַחַת.', speech: 'neʔesˈof ʔˈeseʁ jeχidˈot likvutsˈa ʔaχˈat.' },
  'journey-tens-and-ones': { text: 'נִסְפֹּר קְבוּצוֹת שֶׁל עֶשֶׂר, וְאָז אֶת הַיְּחִידוֹת.', speech: 'nispˈoʁ kvutsˈot ʃˈel ʔˈeseʁ, veʔˈaz ʔˈet hajeχidˈot.' },
  'journey-english-one': { text: 'נַקְשִׁיב לְמִלָּה אַחַת בְּאַנְגְּלִית וְנִבְחַר תְּמוּנָה.', speech: 'nakʃˈiv lemilˈa ʔaχˈat beʔanɡlˈit venivχˈaʁ tmunˈa.' },
  'journey-english-two': { text: 'נַתְחִיל בְּמִלָּה אַחַת. אַחַר כָּךְ נְחַבֵּר שְׁתֵּי מִלִּים מֻכָּרוֹת.', speech: 'natχˈil bemilˈa ʔaχˈat. ʔˈaχaʁ kˈaχ neχabˈeʁ ʃtˈej milˈim mukaʁˈot.' },
  'journey-english-listen-again': { text: 'נַקְשִׁיב שׁוּב, בְּקֶצֶב נָעִים.', speech: 'nakʃˈiv ʃˈuv, bekˈetsev naʔˈim.' },
  'journey-success': { text: 'מָצָאנוּ. אֶפְשָׁר לְהַמְשִׁיךְ.', speech: 'matsˈanu. ʔefʃˈaʁ lehamʃˈiχ.' },
  'journey-practice': { text: 'נְתַרְגֵּל עוֹד פַּעַם. אֶפְשָׁר לְהַקְשִׁיב וְלִבְדֹּק.', speech: 'netaʁɡˈel ʔˈod pˈaʔam. ʔefʃˈaʁ lehakʃˈiv velivdˈok.' },
  'journey-copy-letters': { text: 'נַבִּיט בָּאוֹת וְנִכְתֹּב אוֹתָהּ לְיָדָהּ.', speech: 'nabˈit baʔˈot veniχtˈov ʔotˈa lejadˈa.' },
  'journey-memory-letters': { text: 'נַבִּיט בָּאוֹת, נַסְתִּיר אוֹתָהּ, וְנִכְתֹּב מֵהַזִּכָּרוֹן.', speech: 'nabˈit baʔˈot, nastˈiʁ ʔotˈa, veniχtˈov mehazikaʁˈon.' },
  'journey-paper': { text: 'אֶפְשָׁר לְהַדְפִּיס אֶת הַדַּף וּלְתַרְגֵּל בְּעִפָּרוֹן.', speech: 'ʔefʃˈaʁ lehadpˈis ʔˈet hadˈaf uletaʁɡˈel beʔipaʁˈon.' },
  'journey-park-intro': { text: 'נְסַדֵּר אֶת הַגִּנָּה עִם הַחֲבֵרִים.', speech: 'nesadˈeʁ ʔˈet haɡinˈa ʔˈim haχaveʁˈim.' },
  'journey-park-place': { text: 'נִבְחַר חֵפֶץ, וְאָז נִבְחַר לוֹ מָקוֹם.', speech: 'nivχˈaʁ χˈefets, veʔˈaz nivχˈaʁ lˈo makˈom.' },
  'journey-park-check': { text: 'נִבְדֹּק אִם הַגִּנָּה מַתְאִימָה לַמְּשִׂימָה.', speech: 'nivdˈok ʔˈim haɡinˈa matʔimˈa lamesimˈa.' },
  'journey-park-clear': { text: 'אֶפְשָׁר לְפַנּוֹת אֶת הַגִּנָּה וּלְהַתְחִיל מֵחָדָשׁ.', speech: 'ʔefʃˈaʁ lefanˈot ʔˈet haɡinˈa ulehatχˈil meχadˈaʃ.' },
  'journey-park-again': { text: 'נְשַׁנֶּה אֶת הַמָּקוֹם וְנִבְדֹּק שׁוּב.', speech: 'neʃanˈe ʔˈet hamakˈom venivdˈok ʃˈuv.' },
};
