const clues = [
  ['place', 'איפה זה נמצא?', 'אֵיפֹה זֶה נִמְצָא?', 'ʔˈejfo zˈe nimtsˈa?'],
  ['color', 'איזה צבע כתוב?', 'אֵיזֶה צֶבַע כָּתוּב?', 'ʔˈejze tsˈeva katˈuv?'],
  ['count', 'קראי שוב את המספר.', 'קִרְאִי שׁוּב אֶת הַמִּסְפָּר.', 'kiʁʔˈi ʃˈuv ʔˈet hamispˈaʁ.'],
  ['action', 'מה קורה במשפט?', 'מָה קוֹרֶה בַּמִּשְׁפָּט?', 'mˈa koʁˈe bamiʃpˈat?'],
  ['detail', 'שימי לב לחלק המודגש.', 'שִׂימִי לֵב לַחֵלֶק הַמֻּדְגָּשׁ.', 'sˈimi lˈev laχˈelek hamudɡˈaʃ.'],
];

export const STORY_CLUE_CLIPS = Object.fromEntries(clues.map(([name, plain, text, speech]) => [
  `story-clue-${name}`, { lang: 'he-IL', plain, text, speech },
]));
