const lines = [
  ['start', 'מַתְחִילוֹת עַכְשָׁו.', 'matχilˈot aχʃˈav.'],
  ['train', 'הָרַכֶּבֶת תֵּצֵא בְּעוֹד', 'haʁakˈevet tetsˈe beʔˈod'],
  ['pond', 'הַקְשִׁיבִי. הַזִּיזִי אֶת הַחַיָּה אֶל הַבְּרֵכָה.', 'hakʃˈivi. hazˈizi ʔˈet haχajˈa ʔˈel habʁeχˈa.'],
  ['example', 'בּוֹאִי נִרְאֶה דֻּגְמָה.', 'boˈi niʁʔˈe duɡmˈa.'],
  ['fresh', 'עַכְשָׁו נְנַסֶּה דֻּגְמָה חֲדָשָׁה.', 'aχʃˈav nenasˈe duɡmˈa χadaʃˈa.'],
  ['train-go', 'הִנֵּה הָרַכֶּבֶת יוֹצֵאת!', 'hinˈe haʁakˈevet jotsˈet!'],
];

export const DAILY_CLIPS = Object.fromEntries(lines.map(([key, text, speech]) => [
  `daily-${key}`, { lang: 'he-IL', text, speech },
]));
