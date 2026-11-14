const scripts = [
  ['intro', 'יֵשׁ לִי רֶמֶז. בַּחֲרִי אֶת הַתְּמוּנָה שֶׁמַּתְאִימָה.', 'jˈeʃ lˈi ʁˈemez. baχaʁˈi ʔˈet hatmunˈa ʃematʔimˈa.'],
  ['hello', 'פִּיקָה פִּיקָה! שָׁלוֹם אֲרִיאֵל.', 'pˈika pˈika! ʃalˈom ʔaʁiʔˈel.'],
  ['finish', 'כָּל הַכָּבוֹד, אֲרִיאֵל! כָּל הַתְּמוּנוֹת כָּאן.', 'kˈol hakavˈod, ʔaʁiʔˈel! kˈol hatmunˈot kˈan.'],
];

export const pikaClip = key => `pikachu-${key}`;
export const PIKACHU_CLIPS = Object.fromEntries(scripts.map(([key, text, speech]) =>
  [pikaClip(key), { lang: 'he-IL', text, speech }],
));
