const rows = [
  ['rabbit', 'jump', null, 'הארנב קופץ.', 'הָאַרְנָב קוֹפֵץ.', 'haʔaʁnˈav kofˈets.'],
  ['rabbit', 'eat', 'carrot', 'הארנב אוכל גזר.', 'הָאַרְנָב אוֹכֵל גֶּזֶר.', 'haʔaʁnˈav ʔoχˈel ɡˈezeʁ.'],
  ['rabbit', 'eat', 'lettuce', 'הארנב אוכל חסה.', 'הָאַרְנָב אוֹכֵל חַסָּה.', 'haʔaʁnˈav ʔoχˈel χasˈa.'],
  ['dog', 'jump', null, 'הכלב קופץ.', 'הַכֶּלֶב קוֹפֵץ.', 'hakˈelev kofˈets.'],
  ['dog', 'eat', 'meat', 'הכלב אוכל בשר.', 'הַכֶּלֶב אוֹכֵל בָּשָׂר.', 'hakˈelev ʔoχˈel basˈaʁ.'],
  ['dog', 'eat', 'chicken-leg', 'הכלב אוכל שוק עוף.', 'הַכֶּלֶב אוֹכֵל שׁוֹק עוֹף.', 'hakˈelev ʔoχˈel ʃˈok ʔˈof.'],
  ['cat', 'jump', null, 'חתול קופץ גבוה.', 'חָתוּל קוֹפֵץ גָּבוֹהַּ.', 'χatˈul kofˈets ɡavˈoaχ.'],
  ['cat', 'eat', 'fish', 'חתול אוכל דג.', 'חָתוּל אוֹכֵל דָּג.', 'χatˈul ʔoχˈel dˈaɡ.'],
  ['cat', 'eat', 'meat', 'חתול אוכל בשר.', 'חָתוּל אוֹכֵל בָּשָׂר.', 'χatˈul ʔoχˈel basˈaʁ.'],
  ['duck', 'swim', null, 'הברווז שוחה במים.', 'הַבַּרְוָז שׂוֹחֶה בַּמַּיִם.', 'habaʁvˈaz soχˈe bamˈajim.', 'pond'],
  ['cat', 'sleep', null, 'חתול ישן במיטה.', 'חָתוּל יָשֵׁן בַּמִּטָּה.', 'χatˈul jaʃˈen bamitˈa.', 'bed'],
  ['dog', 'swim', null, 'הכלב שוחה במים.', 'הַכֶּלֶב שׂוֹחֶה בְּמַיִם.', 'hakˈelev soχˈe bemˈajim.', 'pond'],
  ['rabbit', 'sleep', null, 'הארנב ישן בסל.', 'הָאַרְנָב יָשֵׁן בַּסַּל.', 'haʔaʁnˈav jaʃˈen basˈal.', 'basket'],
  ['duck', 'sleep', null, 'הברווז ישן בקן.', 'הַבַּרְוָז יָשֵׁן בַּקֵּן.', 'habaʁvˈaz jaʃˈen bakˈen.', 'nest'],
  ['duck', 'jump', null, 'הברווז קופץ.', 'הַבַּרְוָז קוֹפֵץ.', 'habaʁvˈaz kofˈets.'],
];

export const ANIMAL_STORIES = rows.map(([object, action, food, he, pointed, spoken, anchor]) => ({
  id: `story-animal-${object}-${food || action}`,
  he, pointed, spoken, level: 10, family: `story-animal-${object}`,
  scene: { kind: 'action', object, action, ...(food ? { food } : {}), ...(anchor ? { anchor } : {}) },
}));

export const ANIMAL_STORY_INSTRUCTIONS = {
  'act-out-jump': { text: 'לִחְצִי עַל הַחַיָּה שֶׁקּוֹפֶצֶת.', speech: 'liχtsˈi ʔˈal haχajˈa ʃekofˈetset.' },
  'act-out-feed': { text: 'הַעֲבִירִי אֶת הָאֹכֶל לַחַיָּה שֶׁבַּסִּפּוּר.', speech: 'haʔavˈiʁi ʔˈet haʔˈoχel laχajˈa ʃebasipˈuʁ.' },
  'act-out-move-animal': { text: 'הַעֲבִירִי אֶת הַחַיָּה לַמָּקוֹם שֶׁבַּסִּפּוּר.', speech: 'haʔavˈiʁi ʔˈet haχajˈa lamakˈom ʃebasipˈuʁ.' },
};
