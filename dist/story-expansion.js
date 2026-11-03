// Additional curriculum only; the two original stories stay in journey-content.js.
// Hebrew text and its explicit IPA have been reviewed together. Speech is not
// inferred from the displayed text. Every count is the complete visible group.
// Counted objects are not also introduced as props or placements in their story.
// Placement relations always refer to the existing table. English uses one
// original ANIMALS/COLORS word per task, played through its existing en-<id> clip.
export const EXPANDED_STORIES = [
  {
    id: 'garden', title: 'לוּלִי וְהַגִּנָּה הַקְּטַנָּה',
    description: 'סוֹפְרִים פְּרָחִים, פּוֹגְשִׁים חֲבֵרִים וּמְפַנִּים מָקוֹם לְשַׂחֵק.',
    pup: 'luli', theme: 'picnic', pages: [
      {
        text: 'לוּלִי רוֹאָה עֵץ.', speech: 'lˈuli ʁoʔˈa ʔˈets.',
        task: 'read', target: 'tree', choices: ['tree', 'house'],
        prompt: 'נִקְרָא וְנִבְחַר אֶת הָעֵץ.', promptSpeech: 'nikʁˈa venivχˈaʁ ʔˈet haʔˈets.',
      },
      {
        text: 'הַכַּדּוּר לְיַד הַשֻּׁלְחָן.', speech: 'hakadˈuʁ lejˈad haʃulχˈan.',
        task: 'place', target: 'ball', relation: 'beside',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר לְיַד הַשֻּׁלְחָן.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ lejˈad haʃulχˈan.',
      },
      {
        text: 'בַּגִּנָּה יֵשׁ שְׁנֵי פְּרָחִים.', speech: 'baɡinˈa jˈeʃ ʃnˈej pʁaχˈim.',
        task: 'count', target: 'flower', count: 2,
        prompt: 'נִסְפֹּר אֶת הַפְּרָחִים.', promptSpeech: 'nispˈoʁ ʔˈet hapʁaχˈim.',
      },
      {
        text: 'בּוֹבִּי מוֹצֵא אַרְנָב לְיַד הָעֵץ.', speech: 'bˈobi motsˈe ʔaʁnˈav lejˈad haʔˈets.',
        task: 'english', target: 'rabbit', english: 'rabbit', choices: ['rabbit', 'cat', 'dog'],
        prompt: 'נַקְשִׁיב לְמִלָּה אַחַת בְּאַנְגְּלִית.', promptSpeech: 'nakʃˈiv lemilˈa ʔaχˈat beʔanɡlˈit.',
      },
      {
        text: 'עַכְשָׁו יֵשׁ בַּגִּנָּה אַרְבָּעָה פְּרָחִים.', speech: 'ʔaχʃˈav jˈeʃ baɡinˈa ʔaʁbaʔˈa pʁaχˈim.',
        task: 'count', target: 'flower', count: 4,
        prompt: 'נִסְפֹּר כַּמָּה פְּרָחִים יֵשׁ עַכְשָׁו.', promptSpeech: 'nispˈoʁ kˈama pʁaχˈim jˈeʃ ʔaχʃˈav.',
      },
      {
        text: 'פַּרְפַּר צָהֹב בָּא לַגִּנָּה.', speech: 'paʁpˈaʁ tsahˈov bˈa laɡinˈa.',
        task: 'choose', target: 'color-butterfly-yellow', choices: ['color-butterfly-purple', 'color-butterfly-yellow', 'color-flower-pink'],
        prompt: 'נִבְחַר אֶת הַפַּרְפַּר שֶׁבַּסִּפּוּר.', promptSpeech: 'nivχˈaʁ ʔˈet hapaʁpˈaʁ ʃebasipˈuʁ.',
      },
      {
        text: 'כְּדֵי לְפַנּוֹת מָקוֹם, הַכַּדּוּר עוֹבֵר מִתַּחַת לַשֻּׁלְחָן.', speech: 'kedˈej lefanˈot makˈom, hakadˈuʁ ʔovˈeʁ mitˈaχat laʃulχˈan.',
        task: 'place', target: 'ball', relation: 'under',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר בַּמָּקוֹם שֶׁכָּתוּב.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ bamakˈom ʃekatˈuv.',
      },
      {
        text: 'לוּלִי סוֹפֶרֶת שִׁשָּׁה פְּרָחִים. הַגִּנָּה כְּבָר צִבְעוֹנִית.', speech: 'lˈuli sofˈeʁet ʃiʃˈa pʁaχˈim. haɡinˈa kvˈaʁ tsivʔonˈit.',
        task: 'count', target: 'flower', count: 6,
        prompt: 'נִסְפֹּר אֶת כָּל הַפְּרָחִים.', promptSpeech: 'nispˈoʁ ʔˈet kˈol hapʁaχˈim.',
      },
      {
        text: 'שַׁבְּלוּל קָטָן בָּא לְבַקֵּר בַּגִּנָּה.', speech: 'ʃablˈul katˈan bˈa levakˈeʁ baɡinˈa.',
        task: 'read', target: 'snail', choices: ['snail', 'rabbit', 'duck'],
        prompt: 'נִבְחַר מִי בָּא לְבַקֵּר עַכְשָׁו.', promptSpeech: 'nivχˈaʁ mˈi bˈa levakˈeʁ ʔaχʃˈav.',
      },
      {
        text: 'הַגִּנָּה מוּכָנָה. הַכַּדּוּר חוֹזֵר לְיַד הַשֻּׁלְחָן.', speech: 'haɡinˈa muχanˈa. hakadˈuʁ χozˈeʁ lejˈad haʃulχˈan.',
        task: 'place', target: 'ball', relation: 'beside',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר בַּמָּקוֹם שֶׁכָּתוּב.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ bamakˈom ʃekatˈuv.',
      },
    ],
  },
  {
    id: 'shared-book', title: 'סֵפֶר לַחֲבֵרִים',
    description: 'קוֹרְאִים בְּיַחַד, מְכִינִים הַפְסָקָה קְצָרָה וְסוֹפְרִים עוּגִיּוֹת.',
    pup: 'bobi', theme: 'picnic', pages: [
      {
        text: 'לְבּוֹבִּי יֵשׁ סֵפֶר.', speech: 'lebˈobi jˈeʃ sˈefeʁ.',
        task: 'read', target: 'book', choices: ['book', 'hat'],
        prompt: 'נִקְרָא וְנִבְחַר אֶת הַסֵּפֶר.', promptSpeech: 'nikʁˈa venivχˈaʁ ʔˈet hasˈefeʁ.',
      },
      {
        text: 'הַכַּדּוּר מִתַּחַת לַשֻּׁלְחָן.', speech: 'hakadˈuʁ mitˈaχat laʃulχˈan.',
        task: 'place', target: 'ball', relation: 'under',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר מִתַּחַת לַשֻּׁלְחָן.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ mitˈaχat laʃulχˈan.',
      },
      {
        text: 'בּוֹבִּי רוֹאֶה צִפּוֹר.', speech: 'bˈobi ʁoʔˈe tsipˈoʁ.',
        task: 'english', target: 'bird', english: 'bird', choices: ['bird', 'fish'],
        prompt: 'נַקְשִׁיב לְמִלָּה אַחַת בְּאַנְגְּלִית.', promptSpeech: 'nakʃˈiv lemilˈa ʔaχˈat beʔanɡlˈit.',
      },
      {
        text: 'טוֹפִי מֵבִיא שְׁתֵּי עוּגִיּוֹת לִזְמַן הַקְּרִיאָה.', speech: 'tˈofi mevˈi ʃtˈej ʔuɡijˈot lizmˈan hakʁiʔˈa.',
        task: 'count', target: 'cookie', count: 2,
        prompt: 'נִסְפֹּר אֶת הָעוּגִיּוֹת.', promptSpeech: 'nispˈoʁ ʔˈet haʔuɡijˈot.',
      },
      {
        text: 'לוּלִי מְבַקֶּשֶׁת אֶת הַסֵּפֶר כְּדֵי לִקְרֹא בְּקוֹל.', speech: 'lˈuli mevakˈeʃet ʔˈet hasˈefeʁ kedˈej likʁˈo bekˈol.',
        task: 'read', target: 'book', choices: ['umbrella', 'book', 'guitar'],
        prompt: 'נִבְחַר מָה לוּלִי מְבַקֶּשֶׁת.', promptSpeech: 'nivχˈaʁ mˈa lˈuli mevakˈeʃet.',
      },
      {
        text: 'בּוֹבִּי בּוֹחֵר מְכוֹנִית אֲדֻמָּה לְאַחַר הַקְּרִיאָה.', speech: 'bˈobi boχˈeʁ meχonˈit ʔadumˈa leʔaχˈaʁ hakʁiʔˈa.',
        task: 'choose', target: 'color-car-red', choices: ['color-car-blue', 'color-car-red', 'color-ball-red'],
        prompt: 'נִבְחַר אֶת הַמְּכוֹנִית שֶׁבַּסִּפּוּר.', promptSpeech: 'nivχˈaʁ ʔˈet hameχonˈit ʃebasipˈuʁ.',
      },
      {
        text: 'טוֹפִי מוֹסִיף עוּגִיּוֹת. עַכְשָׁו יֵשׁ אַרְבַּע עוּגִיּוֹת.', speech: 'tˈofi mosˈif ʔuɡijˈot. ʔaχʃˈav jˈeʃ ʔˈaʁba ʔuɡijˈot.',
        task: 'count', target: 'cookie', count: 4,
        prompt: 'נִסְפֹּר כַּמָּה עוּגִיּוֹת יֵשׁ עַכְשָׁו.', promptSpeech: 'nispˈoʁ kˈama ʔuɡijˈot jˈeʃ ʔaχʃˈav.',
      },
      {
        text: 'לוּלִי מַנִּיחָה תַּפּוּחַ עַל הַשֻּׁלְחָן לְהַפְסָקָה קְצָרָה.', speech: 'lˈuli maniχˈa tapˈuaχ ʔˈal haʃulχˈan lehafsakˈa ktsaʁˈa.',
        task: 'place', target: 'apple', relation: 'on',
        prompt: 'נָשִׂים אֶת הַתַּפּוּחַ בַּמָּקוֹם שֶׁכָּתוּב.', promptSpeech: 'nasˈim ʔˈet hatapˈuaχ bamakˈom ʃekatˈuv.',
      },
      {
        text: 'אַחֲרֵי הַהַפְסָקָה בּוֹבִּי מְבַקֵּשׁ שׁוּב אֶת הַסֵּפֶר.', speech: 'ʔaχaʁˈej hahafsakˈa bˈobi mevakˈeʃ ʃˈuv ʔˈet hasˈefeʁ.',
        task: 'choose', target: 'book', choices: ['book', 'umbrella', 'guitar'],
        prompt: 'נִבְחַר מָה בּוֹבִּי מְבַקֵּשׁ.', promptSpeech: 'nivχˈaʁ mˈa bˈobi mevakˈeʃ.',
      },
      {
        text: 'הַסִּפּוּר הִסְתַּיֵּם. סוֹפְרִים שֵׁשׁ עוּגִיּוֹת לַחֲבֵרִים.', speech: 'hasipˈuʁ histajˈem. sofʁˈim ʃˈeʃ ʔuɡijˈot laχaveʁˈim.',
        task: 'count', target: 'cookie', count: 6,
        prompt: 'נִסְפֹּר אֶת כָּל הָעוּגִיּוֹת.', promptSpeech: 'nispˈoʁ ʔˈet kˈol haʔuɡijˈot.',
      },
    ],
  },
  {
    id: 'toy-workshop', title: 'טוֹפִי מְסַדֵּר צַעֲצוּעִים',
    description: 'מְסַדְּרִים מְכוֹנִיּוֹת, בּוֹחֲרִים צַעֲצוּעַ וּמְכִינִים מָקוֹם לְמִשְׂחָק.',
    pup: 'tofi', theme: 'lost-ball', pages: [
      {
        text: 'לְטוֹפִי יֵשׁ רוֹבּוֹט.', speech: 'letˈofi jˈeʃ ʁˈobot.',
        task: 'read', target: 'robot', choices: ['robot', 'bicycle'],
        prompt: 'נִקְרָא וְנִבְחַר אֶת הָרוֹבּוֹט.', promptSpeech: 'nikʁˈa venivχˈaʁ ʔˈet haʁˈobot.',
      },
      {
        text: 'הַכַּדּוּר עַל הַשֻּׁלְחָן.', speech: 'hakadˈuʁ ʔˈal haʃulχˈan.',
        task: 'place', target: 'ball', relation: 'on',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר עַל הַשֻּׁלְחָן.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ ʔˈal haʃulχˈan.',
      },
      {
        text: 'יֵשׁ שְׁתֵּי מְכוֹנִיּוֹת.', speech: 'jˈeʃ ʃtˈej meχonijˈot.',
        task: 'count', target: 'car', count: 2,
        prompt: 'נִסְפֹּר אֶת הַמְּכוֹנִיּוֹת.', promptSpeech: 'nispˈoʁ ʔˈet hameχonijˈot.',
      },
      {
        text: 'בּוֹבִּי מֵבִיא רַכֶּבֶת קְטַנָּה לַחֲבֵרִים.', speech: 'bˈobi mevˈi ʁakˈevet ktanˈa laχaveʁˈim.',
        task: 'read', target: 'train', choices: ['train', 'robot', 'boat'],
        prompt: 'נִבְחַר מָה בּוֹבִּי מֵבִיא.', promptSpeech: 'nivχˈaʁ mˈa bˈobi mevˈi.',
      },
      {
        text: 'הַכַּדּוּר עוֹבֵר מִתַּחַת לַשֻּׁלְחָן, כְּדֵי לְפַנּוֹת מָקוֹם.', speech: 'hakadˈuʁ ʔovˈeʁ mitˈaχat laʃulχˈan, kedˈej lefanˈot makˈom.',
        task: 'place', target: 'ball', relation: 'under',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר בַּמָּקוֹם שֶׁכָּתוּב.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ bamakˈom ʃekatˈuv.',
      },
      {
        text: 'לוּלִי מוֹסִיפָה מְכוֹנִיּוֹת. עַכְשָׁו יֵשׁ אַרְבַּע.', speech: 'lˈuli mosifˈa meχonijˈot. ʔaχʃˈav jˈeʃ ʔˈaʁba.',
        task: 'count', target: 'car', count: 4,
        prompt: 'נִסְפֹּר כַּמָּה מְכוֹנִיּוֹת יֵשׁ עַכְשָׁו.', promptSpeech: 'nispˈoʁ kˈama meχonijˈot jˈeʃ ʔaχʃˈav.',
      },
      {
        text: 'בּוֹבִּי בּוֹחֵר אֶת הַצֶּבַע הַכָּחֹל.', speech: 'bˈobi boχˈeʁ ʔˈet hatsˈeva hakaχˈol.',
        task: 'english', target: 'blue', english: 'blue', choices: ['red', 'blue', 'yellow'],
        prompt: 'נַקְשִׁיב לְמִלָּה אַחַת בְּאַנְגְּלִית.', promptSpeech: 'nakʃˈiv lemilˈa ʔaχˈat beʔanɡlˈit.',
      },
      {
        text: 'טוֹפִי מְחַפֵּשׂ אוֹפַנַּיִם, לֹא רַכֶּבֶת.', speech: 'tˈofi meχapˈes ʔofanˈajim, lˈo ʁakˈevet.',
        task: 'choose', target: 'bicycle', choices: ['bicycle', 'train', 'robot'],
        prompt: 'נִבְחַר מָה טוֹפִי מְחַפֵּשׂ.', promptSpeech: 'nivχˈaʁ mˈa tˈofi meχapˈes.',
      },
      {
        text: 'הַחֲבֵרִים סוֹפְרִים חָמֵשׁ מְכוֹנִיּוֹת לִפְנֵי הַמִּשְׂחָק.', speech: 'haχaveʁˈim sofʁˈim χamˈeʃ meχonijˈot lifnˈej hamisχˈak.',
        task: 'count', target: 'car', count: 5,
        prompt: 'נִסְפֹּר אֶת כָּל הַמְּכוֹנִיּוֹת.', promptSpeech: 'nispˈoʁ ʔˈet kˈol hameχonijˈot.',
      },
      {
        text: 'כָּל הַצַּעֲצוּעִים מוּכָנִים. הַכַּדּוּר לְיַד הַשֻּׁלְחָן.', speech: 'kˈol hatsaʔatsuʔˈim muχanˈim. hakadˈuʁ lejˈad haʃulχˈan.',
        task: 'place', target: 'ball', relation: 'beside',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר בַּמָּקוֹם שֶׁכָּתוּב.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ bamakˈom ʃekatˈuv.',
      },
    ],
  },
  {
    id: 'fruit-stand', title: 'דּוּכַן הַפֵּרוֹת שֶׁל בּוֹבִּי',
    description: 'בּוֹחֲרִים פֵּרוֹת לַחֲבֵרִים וְסוֹפְרִים תַּפּוּזִים עַד שְׁמוֹנָה.',
    pup: 'bobi', theme: 'picnic', pages: [
      {
        text: 'לְבּוֹבִּי יֵשׁ בָּנָנָה.', speech: 'lebˈobi jˈeʃ banˈana.',
        task: 'read', target: 'banana', choices: ['banana', 'watermelon'],
        prompt: 'נִקְרָא וְנִבְחַר אֶת הַבָּנָנָה.', promptSpeech: 'nikʁˈa venivχˈaʁ ʔˈet habanˈana.',
      },
      {
        text: 'הַתַּפּוּחַ עַל הַשֻּׁלְחָן.', speech: 'hatapˈuaχ ʔˈal haʃulχˈan.',
        task: 'place', target: 'apple', relation: 'on',
        prompt: 'נָשִׂים אֶת הַתַּפּוּחַ עַל הַשֻּׁלְחָן.', promptSpeech: 'nasˈim ʔˈet hatapˈuaχ ʔˈal haʃulχˈan.',
      },
      {
        text: 'לוּלִי בּוֹחֶרֶת צֶבַע יָרֹק.', speech: 'lˈuli boχˈeʁet tsˈeva jaʁˈok.',
        task: 'english', target: 'green', english: 'green', choices: ['green', 'red'],
        prompt: 'נַקְשִׁיב לְמִלָּה אַחַת בְּאַנְגְּלִית.', promptSpeech: 'nakʃˈiv lemilˈa ʔaχˈat beʔanɡlˈit.',
      },
      {
        text: 'טוֹפִי מֵבִיא שְׁנֵי תַּפּוּזִים לַדּוּכָן.', speech: 'tˈofi mevˈi ʃnˈej tapuzˈim ladukˈan.',
        task: 'count', target: 'orange-fruit', count: 2,
        prompt: 'נִסְפֹּר אֶת הַתַּפּוּזִים.', promptSpeech: 'nispˈoʁ ʔˈet hatapuzˈim.',
      },
      {
        text: 'לוּלִי מֵבִיאָה סַל כְּדֵי לָקַחַת פֵּרוֹת לַחֲבֵרִים.', speech: 'lˈuli meviʔˈa sˈal kedˈej lakˈaχat peʁˈot laχaveʁˈim.',
        task: 'read', target: 'basket', choices: ['basket', 'bucket', 'hat'],
        prompt: 'נִבְחַר מָה לוּלִי מֵבִיאָה.', promptSpeech: 'nivχˈaʁ mˈa lˈuli meviʔˈa.',
      },
      {
        text: 'בּוֹבִּי מְבַקֵּשׁ אַגָּס, לֹא בָּנָנָה.', speech: 'bˈobi mevakˈeʃ ʔaɡˈas, lˈo banˈana.',
        task: 'choose', target: 'pear', choices: ['banana', 'pear', 'watermelon'],
        prompt: 'נִבְחַר אֶת הַפְּרִי שֶׁבּוֹבִּי מְבַקֵּשׁ.', promptSpeech: 'nivχˈaʁ ʔˈet hapʁˈi ʃebˈobi mevakˈeʃ.',
      },
      {
        text: 'הַתַּפּוּחַ עוֹבֵר לְיַד הַשֻּׁלְחָן, כְּדֵי לְפַנּוֹת מָקוֹם.', speech: 'hatapˈuaχ ʔovˈeʁ lejˈad haʃulχˈan, kedˈej lefanˈot makˈom.',
        task: 'place', target: 'apple', relation: 'beside',
        prompt: 'נָשִׂים אֶת הַתַּפּוּחַ בַּמָּקוֹם שֶׁכָּתוּב.', promptSpeech: 'nasˈim ʔˈet hatapˈuaχ bamakˈom ʃekatˈuv.',
      },
      {
        text: 'עַכְשָׁו יֵשׁ חֲמִשָּׁה תַּפּוּזִים. בּוֹבִּי סוֹפֵר אֶת כֻּלָּם.', speech: 'ʔaχʃˈav jˈeʃ χamiʃˈa tapuzˈim. bˈobi sofˈeʁ ʔˈet kulˈam.',
        task: 'count', target: 'orange-fruit', count: 5,
        prompt: 'נִסְפֹּר אֶת כָּל הַתַּפּוּזִים.', promptSpeech: 'nispˈoʁ ʔˈet kˈol hatapuzˈim.',
      },
      {
        text: 'בּוֹבִּי בּוֹחֵר גַּם צֶבַע כָּתֹם לַדּוּכָן.', speech: 'bˈobi boχˈeʁ ɡˈam tsˈeva katˈom ladukˈan.',
        task: 'english', target: 'orange', english: 'orange', choices: ['purple', 'orange', 'pink'],
        prompt: 'נַקְשִׁיב לְמִלָּה אַחַת בְּאַנְגְּלִית.', promptSpeech: 'nakʃˈiv lemilˈa ʔaχˈat beʔanɡlˈit.',
      },
      {
        text: 'לוּלִי מוֹסִיפָה תַּפּוּזִים לַחֲבֵרִים. יֵשׁ שְׁמוֹנָה תַּפּוּזִים.', speech: 'lˈuli mosifˈa tapuzˈim laχaveʁˈim. jˈeʃ ʃmonˈa tapuzˈim.',
        task: 'count', target: 'orange-fruit', count: 8,
        prompt: 'נִסְפֹּר כַּמָּה תַּפּוּזִים הֵכַנּוּ לַחֲבֵרִים.', promptSpeech: 'nispˈoʁ kˈama tapuzˈim heχˈanu laχaveʁˈim.',
      },
    ],
  },
  {
    id: 'after-rain', title: 'הַמִּשְׂחָק שֶׁאַחֲרֵי הַגֶּשֶׁם',
    description: 'מַחְכִּים לַשֶּׁמֶשׁ, סוֹפְרִים שַׁבְּלוּלִים וְחוֹזְרִים לְשַׂחֵק.',
    pup: 'luli', theme: 'lost-ball', pages: [
      {
        text: 'לְלוּלִי יֵשׁ מִטְרִיָּה.', speech: 'lelˈuli jˈeʃ mitʁijˈa.',
        task: 'read', target: 'umbrella', choices: ['umbrella', 'hat'],
        prompt: 'נִקְרָא וְנִבְחַר אֶת הַמִּטְרִיָּה.', promptSpeech: 'nikʁˈa venivχˈaʁ ʔˈet hamitʁijˈa.',
      },
      {
        text: 'הַכַּדּוּר מִתַּחַת לַשֻּׁלְחָן.', speech: 'hakadˈuʁ mitˈaχat laʃulχˈan.',
        task: 'place', target: 'ball', relation: 'under',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר מִתַּחַת לַשֻּׁלְחָן.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ mitˈaχat laʃulχˈan.',
      },
      {
        text: 'לוּלִי רוֹאָה בַּרְוָז.', speech: 'lˈuli ʁoʔˈa baʁvˈaz.',
        task: 'english', target: 'duck', english: 'duck', choices: ['duck', 'cat'],
        prompt: 'נַקְשִׁיב לְמִלָּה אַחַת בְּאַנְגְּלִית.', promptSpeech: 'nakʃˈiv lemilˈa ʔaχˈat beʔanɡlˈit.',
      },
      {
        text: 'הַגֶּשֶׁם נִפְסַק. יֵשׁ שֶׁמֶשׁ.', speech: 'haɡˈeʃem nifsˈak. jˈeʃ ʃˈemeʃ.',
        task: 'read', target: 'sun', choices: ['sun', 'cloud', 'moon'],
        prompt: 'נִבְחַר מָה מֵאִיר עַכְשָׁו.', promptSpeech: 'nivχˈaʁ mˈa meʔˈiʁ ʔaχʃˈav.',
      },
      {
        text: 'בּוֹבִּי מוֹצֵא שְׁנֵי שַׁבְּלוּלִים בַּגִּנָּה.', speech: 'bˈobi motsˈe ʃnˈej ʃablulˈim baɡinˈa.',
        task: 'count', target: 'snail', count: 2,
        prompt: 'נִסְפֹּר אֶת הַשַּׁבְּלוּלִים.', promptSpeech: 'nispˈoʁ ʔˈet haʃablulˈim.',
      },
      {
        text: 'פַּרְפַּר סָגֹל בָּא לְבַקֵּר אֶת הַחֲבֵרִים.', speech: 'paʁpˈaʁ saɡˈol bˈa levakˈeʁ ʔˈet haχaveʁˈim.',
        task: 'choose', target: 'color-butterfly-purple', choices: ['color-butterfly-yellow', 'color-butterfly-purple', 'color-flower-purple'],
        prompt: 'נִבְחַר אֶת הַפַּרְפַּר שֶׁבַּסִּפּוּר.', promptSpeech: 'nivχˈaʁ ʔˈet hapaʁpˈaʁ ʃebasipˈuʁ.',
      },
      {
        text: 'טוֹפִי מוֹצֵא עוֹד שַׁבְּלוּל. עַכְשָׁו יֵשׁ שְׁלוֹשָׁה.', speech: 'tˈofi motsˈe ʔˈod ʃablˈul. ʔaχʃˈav jˈeʃ ʃloʃˈa.',
        task: 'count', target: 'snail', count: 3,
        prompt: 'נִסְפֹּר כַּמָּה שַׁבְּלוּלִים יֵשׁ עַכְשָׁו.', promptSpeech: 'nispˈoʁ kˈama ʃablulˈim jˈeʃ ʔaχʃˈav.',
      },
      {
        text: 'לוּלִי מוֹצִיאָה אֶת הַכַּדּוּר לְיַד הַשֻּׁלְחָן.', speech: 'lˈuli motsiʔˈa ʔˈet hakadˈuʁ lejˈad haʃulχˈan.',
        task: 'place', target: 'ball', relation: 'beside',
        prompt: 'נָשִׂים אֶת הַכַּדּוּר בַּמָּקוֹם שֶׁכָּתוּב.', promptSpeech: 'nasˈim ʔˈet hakadˈuʁ bamakˈom ʃekatˈuv.',
      },
      {
        text: 'אַרְבָּעָה שַׁבְּלוּלִים נִשְׁאֲרִים בַּגִּנָּה, וְהַחֲבֵרִים מְחַיְּכִים.', speech: 'ʔaʁbaʔˈa ʃablulˈim niʃʔaʁˈim baɡinˈa, vehaχaveʁˈim meχajχˈim.',
        task: 'count', target: 'snail', count: 4,
        prompt: 'נִסְפֹּר אֶת כָּל הַשַּׁבְּלוּלִים.', promptSpeech: 'nispˈoʁ ʔˈet kˈol haʃablulˈim.',
      },
      {
        text: 'כָּעֵת לוּלִי מְבַקֶּשֶׁת אֶת הַכַּדּוּר. אֶפְשָׁר לְשַׂחֵק!', speech: 'kaʔˈet lˈuli mevakˈeʃet ʔˈet hakadˈuʁ. ʔefʃˈaʁ lesaχˈek!',
        task: 'choose', target: 'ball', choices: ['ball', 'umbrella', 'sun'],
        prompt: 'נִבְחַר מָה לוּלִי מְבַקֶּשֶׁת לַמִּשְׂחָק.', promptSpeech: 'nivχˈaʁ mˈa lˈuli mevakˈeʃet lamisχˈak.',
      },
    ],
  },
  {
    id: 'little-party', title: 'הַמְּסִבָּה הַקְּטַנָּה',
    description: 'מְכִינִים מְסִבָּה עִם בַּלּוֹנִים, עוּגָה וּכְלֵי נְגִינָה.',
    pup: 'tofi', theme: 'picnic', pages: [
      {
        text: 'לְטוֹפִי יֵשׁ תֹּף.', speech: 'letˈofi jˈeʃ tˈof.',
        task: 'read', target: 'drum', choices: ['drum', 'guitar'],
        prompt: 'נִקְרָא וְנִבְחַר אֶת הַתֹּף.', promptSpeech: 'nikʁˈa venivχˈaʁ ʔˈet hatˈof.',
      },
      {
        text: 'הַתַּפּוּחַ עַל הַשֻּׁלְחָן.', speech: 'hatapˈuaχ ʔˈal haʃulχˈan.',
        task: 'place', target: 'apple', relation: 'on',
        prompt: 'נָשִׂים אֶת הַתַּפּוּחַ עַל הַשֻּׁלְחָן.', promptSpeech: 'nasˈim ʔˈet hatapˈuaχ ʔˈal haʃulχˈan.',
      },
      {
        text: 'יֵשׁ שְׁנֵי בַּלּוֹנִים.', speech: 'jˈeʃ ʃnˈej balonˈim.',
        task: 'count', target: 'balloon', count: 2,
        prompt: 'נִסְפֹּר אֶת הַבַּלּוֹנִים.', promptSpeech: 'nispˈoʁ ʔˈet habalonˈim.',
      },
      {
        text: 'דֹּב בָּא לַמְּסִבָּה שֶׁל הַחֲבֵרִים.', speech: 'dˈov bˈa lamesibˈa ʃˈel haχaveʁˈim.',
        task: 'english', target: 'bear', english: 'bear', choices: ['bear', 'horse', 'fish'],
        prompt: 'נַקְשִׁיב לְמִלָּה אַחַת בְּאַנְגְּלִית.', promptSpeech: 'nakʃˈiv lemilˈa ʔaχˈat beʔanɡlˈit.',
      },
      {
        text: 'לוּלִי מֵבִיאָה גִּיטָרָה כְּדֵי לְנַגֵּן בַּמְּסִבָּה.', speech: 'lˈuli meviʔˈa ɡitˈaʁa kedˈej lenaɡˈen bamesibˈa.',
        task: 'read', target: 'guitar', choices: ['trumpet', 'guitar', 'drum'],
        prompt: 'נִבְחַר מָה לוּלִי מֵבִיאָה.', promptSpeech: 'nivχˈaʁ mˈa lˈuli meviʔˈa.',
      },
      {
        text: 'בּוֹבִּי מוֹסִיף בַּלּוֹנִים. עַכְשָׁו יֵשׁ אַרְבָּעָה.', speech: 'bˈobi mosˈif balonˈim. ʔaχʃˈav jˈeʃ ʔaʁbaʔˈa.',
        task: 'count', target: 'balloon', count: 4,
        prompt: 'נִסְפֹּר כַּמָּה בַּלּוֹנִים יֵשׁ עַכְשָׁו.', promptSpeech: 'nispˈoʁ kˈama balonˈim jˈeʃ ʔaχʃˈav.',
      },
      {
        text: 'טוֹפִי מֵבִיא עוּגָה לַמְּסִבָּה, לֹא לֶחֶם.', speech: 'tˈofi mevˈi ʔuɡˈa lamesibˈa, lˈo lˈeχem.',
        task: 'choose', target: 'cake', choices: ['bread', 'cake', 'apple'],
        prompt: 'נִבְחַר מָה טוֹפִי מֵבִיא לַמְּסִבָּה.', promptSpeech: 'nivχˈaʁ mˈa tˈofi mevˈi lamesibˈa.',
      },
      {
        text: 'טוֹפִי מַזִּיז אֶת הַתַּפּוּחַ לְיַד הַשֻּׁלְחָן, וּמְפַנֶּה מָקוֹם לָעוּגָה.', speech: 'tˈofi mazˈiz ʔˈet hatapˈuaχ lejˈad haʃulχˈan, umefanˈe makˈom laʔuɡˈa.',
        task: 'place', target: 'apple', relation: 'beside',
        prompt: 'נָשִׂים אֶת הַתַּפּוּחַ בַּמָּקוֹם שֶׁכָּתוּב.', promptSpeech: 'nasˈim ʔˈet hatapˈuaχ bamakˈom ʃekatˈuv.',
      },
      {
        text: 'הַמְּסִבָּה מוּכָנָה. הַחֲבֵרִים סוֹפְרִים שִׁבְעָה בַּלּוֹנִים.', speech: 'hamesibˈa muχanˈa. haχaveʁˈim sofʁˈim ʃivʔˈa balonˈim.',
        task: 'count', target: 'balloon', count: 7,
        prompt: 'נִסְפֹּר אֶת כָּל הַבַּלּוֹנִים.', promptSpeech: 'nispˈoʁ ʔˈet kˈol habalonˈim.',
      },
      {
        text: 'לוּלִי מְבַקֶּשֶׁת אֶת הַגִּיטָרָה לַשִּׁיר הָאַחֲרוֹן.', speech: 'lˈuli mevakˈeʃet ʔˈet haɡitˈaʁa laʃˈiʁ haʔaχaʁˈon.',
        task: 'choose', target: 'guitar', choices: ['guitar', 'drum', 'trumpet'],
        prompt: 'נִבְחַר אֶת כְּלִי הַנְּגִינָה שֶׁלוּלִי מְבַקֶּשֶׁת.', promptSpeech: 'nivχˈaʁ ʔˈet klˈi haneɡinˈa ʃelˈuli mevakˈeʃet.',
      },
    ],
  },
];
