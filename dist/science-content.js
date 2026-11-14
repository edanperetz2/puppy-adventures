export const SCIENCE_TITLE = 'מַעְבֶּדֶת הַמַּדָּע';

export const SCIENCE_EXPERIMENTS = {
  liquids: {
    title: 'מַיִם, שֶׁמֶן וְסַבּוֹן', icon: 'oil',
    steps: [
      { before: 'empty', prompt: 'water-pour', actions: ['water'], after: 'water', result: 'water-ready' },
      { before: 'water', prompt: 'oil-guess', actions: ['layers', 'mix'], after: 'water', result: 'test-idea' },
      { before: 'water', prompt: 'oil-pour', actions: ['oil'], after: 'layers', result: 'oil-top', observes: 1 },
      { before: 'layers', prompt: 'stir', actions: ['spoon'], after: 'layers', result: 'oil-back' },
      { before: 'layers', prompt: 'soap-add', actions: ['soap'], after: 'soapy-layers', result: 'soap-ready' },
      { before: 'soapy-layers', prompt: 'stir-again', actions: ['spoon'], after: 'droplets', result: 'oil-droplets' },
    ],
  },
  floating: {
    title: 'צָף אוֹ שׁוֹקֵעַ?', icon: 'cork',
    steps: [
      { before: 'empty', prompt: 'cork-guess', actions: ['float', 'sink'], after: 'empty', result: 'test-idea', sample: 'cork' },
      { before: 'empty', prompt: 'cork-drop', actions: ['cork'], after: 'cork', result: 'cork-floats', observes: 0 },
      { before: 'cork', prompt: 'rock-guess', actions: ['float', 'sink'], after: 'cork', result: 'test-idea', sample: 'rock' },
      { before: 'cork', prompt: 'rock-drop', actions: ['rock'], after: 'both', result: 'rock-sinks', observes: 2 },
      { before: 'both', prompt: 'wood-drop', actions: ['wood'], after: 'three', result: 'wood-floats' },
      { before: 'three', prompt: 'float-look', actions: ['look'], after: 'three', result: 'float-compare' },
    ],
  },
  melting: {
    title: 'קֶרַח הוֹפֵךְ לְמַיִם', icon: 'ice',
    steps: [
      { before: 'empty', prompt: 'ice-cold', actions: ['cold-ice'], after: 'cold', result: 'cold-ready' },
      { before: 'cold', prompt: 'ice-warm', actions: ['warm-ice'], after: 'both', result: 'both-ready' },
      { before: 'both', prompt: 'ice-guess', actions: ['warm', 'cold'], after: 'both', result: 'test-idea' },
      { before: 'both', prompt: 'time-turn', actions: ['time'], after: 'melted-warm', result: 'warm-melts', observes: 2 },
      { before: 'melted-warm', prompt: 'ice-look', actions: ['look'], after: 'melted-warm', result: 'ice-compare' },
      { before: 'melted-warm', prompt: 'time-more', actions: ['time'], after: 'melted-both', result: 'both-melt' },
    ],
  },
};

export const SCIENCE_ACTIONS = {
  water: { icon: 'water', label: 'מִזְגִי מַיִם' },
  oil: { icon: 'oil', label: 'מִזְגִי שֶׁמֶן' },
  layers: { icon: 'layers', label: 'מֵעַל לַמַּיִם' },
  mix: { icon: 'mix', label: 'יִתְעַרְבֵּב' },
  spoon: { icon: 'spoon', label: 'עַרְבְּבִי' },
  soap: { icon: 'soap', label: 'הוֹסִיפִי סַבּוֹן' },
  float: { icon: 'float', label: 'יָצוּף', feminine: 'תָּצוּף' },
  sink: { icon: 'sink', label: 'יִשְׁקַע', feminine: 'תִּשְׁקַע' },
  cork: { icon: 'cork', label: 'פְּקַק שַׁעַם' },
  rock: { icon: 'rock', label: 'אֶבֶן' },
  wood: { icon: 'wood', label: 'חֲתִיכַת עֵץ' },
  'cold-ice': { icon: 'ice', label: 'קֶרַח לַכּוֹס הַקָּרָה' },
  'warm-ice': { icon: 'ice', label: 'קֶרַח לַכּוֹס הַחַמָּה' },
  warm: { icon: 'warm', label: 'בַּכּוֹס הַחַמָּה' },
  cold: { icon: 'cold', label: 'בַּכּוֹס הַקָּרָה' },
  time: { icon: 'timer', label: 'הַעֲבִירִי זְמַן' },
  look: { icon: 'look', label: 'בּוֹאִי נִסְתַּכֵּל' },
};

const clips = [
  ['menu', 'בְּרוּכָה הַבָּאָה לְמַעְבֶּדֶת הַמַּדָּע! בּוֹאִי נַעֲשֶׂה נִסּוּי.', 'bʁuχˈa habaʔˈa lemaʔabˈedet hamadˈa! bˈoʔi naʔasˈe nisˈuj.'],
  ['done', 'כָּל הַכָּבוֹד, סִיַּמְתְּ אֶת הַנִּסּוּי!', 'kˈol hakavˈod, sijˈamt ʔˈet hanisˈuj!'],
  ['test-idea', 'בּוֹאִי נִבְדֹּק!', 'bˈoʔi nivdˈok!'],
  ['water-pour', 'מִזְגִי מַיִם לַכּוֹס.', 'mizɡˈi mˈajim lakˈos.'],
  ['water-ready', 'יֵשׁ מַיִם בַּכּוֹס.', 'jˈeʃ mˈajim bakˈos.'],
  ['oil-guess', 'הַשֶּׁמֶן יָצוּף אוֹ יִתְעַרְבֵּב?', 'haʃˈemen jatsˈuf ʔˈo jitaʁbˈev?'],
  ['oil-pour', 'עַכְשָׁו מִזְגִי שֶׁמֶן.', 'ʔaχʃˈav mizɡˈi ʃˈemen.'],
  ['oil-top', 'הַשֶּׁמֶן צָף מֵעַל הַמַּיִם.', 'haʃˈemen tsˈaf meʔˈal hamˈajim.'],
  ['stir', 'עַרְבְּבִי עִם הַכַּף. מָה קוֹרֶה?', 'ʔaʁbevˈi ʔˈim hakˈaf. mˈa koʁˈe?'],
  ['oil-back', 'הַשֶּׁמֶן חָזַר לְמַעְלָה.', 'haʃˈemen χazˈaʁ lemˈala.'],
  ['soap-add', 'הוֹסִיפִי טִפָּה שֶׁל סַבּוֹן כֵּלִים.', 'hosˈifi tipˈa ʃˈel sabˈon kelˈim.'],
  ['soap-ready', 'רַק בְּכוֹס אַחַת יֵשׁ סַבּוֹן.', 'ʁˈak bekˈos ʔaχˈat jˈeʃ sabˈon.'],
  ['stir-again', 'עַרְבְּבִי שׁוּב. מָה הִשְׁתַּנָּה?', 'ʔaʁbevˈi ʃˈuv. mˈa hiʃtanˈa?'],
  ['oil-droplets', 'עִם סַבּוֹן, הַשֶּׁמֶן מִתְפַּזֵּר לְטִפּוֹת קְטַנּוֹת.', 'ʔˈim sabˈon, haʃˈemen mitpazˈeʁ letipˈot ktanˈot.'],
  ['cork-guess', 'הַפְּקָק יָצוּף אוֹ יִשְׁקַע?', 'hapkˈak jatsˈuf ʔˈo jiʃkˈa?'],
  ['cork-drop', 'הַכְנִיסִי אֶת הַפְּקָק לַמַּיִם.', 'haχnˈisi ʔˈet hapkˈak lamˈajim.'],
  ['cork-floats', 'הַפְּקָק צָף עַל הַמַּיִם.', 'hapkˈak tsˈaf ʔˈal hamˈajim.'],
  ['rock-guess', 'וְהָאֶבֶן? הִיא תָּצוּף אוֹ תִּשְׁקַע?', 'vehaʔˈeven? hˈi tatsˈuf ʔˈo tiʃkˈa?'],
  ['rock-drop', 'הַכְנִיסִי אֶת הָאֶבֶן לַמַּיִם.', 'haχnˈisi ʔˈet haʔˈeven lamˈajim.'],
  ['rock-sinks', 'הָאֶבֶן שָׁקְעָה לַתַּחְתִּית.', 'haʔˈeven ʃakʔˈa lataχtˈit.'],
  ['wood-drop', 'נַסִּי גַּם חֲתִיכַת עֵץ.', 'nasˈi ɡˈam χatiχˈat ʔˈets.'],
  ['wood-floats', 'חֲתִיכַת הָעֵץ צָפָה.', 'χatiχˈat haʔˈets tsafˈa.'],
  ['float-look', 'מָה צָף? מָה שָׁקַע?', 'mˈa tsˈaf? mˈa ʃakˈa?'],
  ['float-compare', 'הַפְּקָק וְהָעֵץ צָפִים. הָאֶבֶן לְמַטָּה.', 'hapkˈak vehaʔˈets tsafˈim. haʔˈeven lemˈata.'],
  ['ice-cold', 'הוֹסִיפִי קֶרַח לַמַּיִם הַקָּרִים.', 'hosˈifi kˈeʁaχ lamˈajim hakaʁˈim.'],
  ['cold-ready', 'יֵשׁ קֶרַח בַּמַּיִם הַקָּרִים.', 'jˈeʃ kˈeʁaχ bamˈajim hakaʁˈim.'],
  ['ice-warm', 'הוֹסִיפִי קֶרַח גַּם לַמַּיִם הַחַמִּים.', 'hosˈifi kˈeʁaχ ɡˈam lamˈajim haχamˈim.'],
  ['both-ready', 'יֵשׁ קֶרַח בִּשְׁתֵּי הַכּוֹסוֹת.', 'jˈeʃ kˈeʁaχ biʃtˈej hakosˈot.'],
  ['ice-guess', 'אֵיפֹה הַקֶּרַח יִמֵּס קֹדֶם?', 'ʔˈejfo hakˈeʁaχ jimˈes kˈodem?'],
  ['time-turn', 'לִחְצִי עַל הַשָּׁעוֹן. הַזְּמַן יַעֲבֹר.', 'liχtsˈi ʔˈal haʃaʔˈon. hazmˈan jaʔavˈoʁ.'],
  ['warm-melts', 'בַּמַּיִם הַחַמִּים הַקֶּרַח נָמֵס מַהֵר יוֹתֵר.', 'bamˈajim haχamˈim hakˈeʁaχ namˈes mahˈeʁ jotˈeʁ.'],
  ['ice-look', 'אֵיפֹה עוֹד יֵשׁ קֶרַח?', 'ʔˈejfo ʔˈod jˈeʃ kˈeʁaχ?'],
  ['ice-compare', 'בַּכּוֹס הַקָּרָה עוֹד יֵשׁ קֶרַח.', 'bakˈos hakaʁˈa ʔˈod jˈeʃ kˈeʁaχ.'],
  ['time-more', 'נַעֲבִיר עוֹד קְצָת זְמַן.', 'naʔavˈiʁ ʔˈod ktsˈat zmˈan.'],
  ['both-melt', 'גַּם בַּמַּיִם הַקָּרִים הַקֶּרַח נָמֵס. הַקֶּרַח הָפַךְ לְמַיִם.', 'ɡˈam bamˈajim hakaʁˈim hakˈeʁaχ namˈes. hakˈeʁaχ hafˈaχ lemˈajim.'],
];

export const scienceClip = key => `science-${key}`;
export const SCIENCE_CLIPS = Object.fromEntries(clips.map(([key, text, speech]) => [
  scienceClip(key), { lang: 'he-IL', text, speech },
]));

export function cleanScienceRound(path, saved) {
  if (!Object.hasOwn(SCIENCE_EXPERIMENTS, path)) return null;
  const { steps } = SCIENCE_EXPERIMENTS[path];
  if (!Number.isInteger(saved?.index) || saved.index < 0 || saved.index >= steps.length || !Array.isArray(saved.actions)) return null;
  const { index } = saved;
  const actions = Array.from(saved.actions.slice(0, index + 1));
  if (actions.length < index || actions.some((action, i) => !steps[i].actions.includes(action))) return null;
  return {
    index, actions,
    complete: saved.complete === true && index === steps.length - 1 && actions.length === steps.length,
    at: Number.isSafeInteger(saved.at) ? saved.at : 0,
  };
}
