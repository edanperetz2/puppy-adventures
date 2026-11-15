const instructions = [
  ['welcome', 'בּוֹבִּי יוֹצֵא עִם הַסִּירָה. בּוֹאִי נַעֲזֹר לוֹ.', 'bˈobi jotsˈe ʔˈim hasiʁˈa. boˈi naʔazˈoʁ lˈo.'],
  ['aboard', 'הַקְשִׁיבִי. הַעֲלִי אֶת הַחַיָּה לַסִּירָה.', 'hakʃˈivi. haʔalˈi ʔˈet haχajˈa lasiʁˈa.'],
  ['pack', 'הַקְשִׁיבִי. שִׂימִי בַּסַּל אֶת מָה שֶׁמַּתְאִים.', 'hakʃˈivi. sˈimi basˈal ʔˈet mˈa ʃematʔˈim.'],
  ['route', 'לְמִי נָבִיא אֶת הַחֲבִילָה? הַקְשִׁיבִי.', 'lemˈi navˈi ʔˈet haχavilˈa? hakʃˈivi.'],
  ['finish', 'כָּל הַמִּשְׁלוֹחִים הִגִּיעוּ. תּוֹדָה עַל הָעֶזְרָה!', 'kˈol hamiʃloχˈim hiɡˈiʔu. todˈa ʔal haʔezʁˈa!'],
  ['pair', 'עַכְשָׁו נִשְׁמַע שְׁתֵּי מִלִּים. מָה מַתְאִים?', 'aχʃˈav niʃmˈa ʃtˈej milˈim. mˈa matʔˈim?'],
];

export const DELIVERY_CLIPS = Object.fromEntries(instructions.map(([key, text, speech]) => [
  `delivery-${key}`, { lang: 'he-IL', text, speech },
]));

Object.assign(DELIVERY_CLIPS, {
  'delivery-en-boat': { lang: 'en-US', text: 'boat' },
  'delivery-en-blue-boat': { lang: 'en-US', text: 'blue boat' },
});
