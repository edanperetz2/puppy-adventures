// Short picture-matching sentences for the existing level 10. The finite banks
// below contain reviewed pointed Hebrew and explicit IPA, never inferred speech.
// Travel: 12 distinct existing anchors x 6 colors = 72 five-word sentences.
// Arrangements: 9 objects x 3 counts x 2 anchors x 2 positions = 108
// four-word sentences. Banana, egg and cookie take feminine number forms.
const phrase = (he, pointed, ipa) => Object.freeze({ he, pointed, ipa });
const passages = [];
const add = (id, parts, family, scene) => passages.push(Object.freeze({
  id: `picture-${id}`,
  he: `${parts.map(part => part.he).join(' ')}.`,
  pointed: `${parts.map(part => part.pointed).join(' ')}.`,
  spoken: `${parts.map(part => part.ipa).join(' ')}.`,
  level: 10,
  family,
  scene: Object.freeze(scene),
}));

const car = phrase('מכונית', 'מְכוֹנִית', 'meχonˈit');
const drivingNear = phrase('נוסעת ליד', 'נוֹסַעַת לְיַד', 'nosˈaʔat lejˈad');
const carColors = [
  ['red', phrase('אדומה', 'אֲדֻמָּה', 'ʔadumˈa')],
  ['blue', phrase('כחולה', 'כְּחֻלָּה', 'kχulˈa')],
  ['green', phrase('ירוקה', 'יְרֻקָּה', 'jeʁukˈa')],
  ['pink', phrase('ורודה', 'וְרֻדָּה', 'veʁudˈa')],
  ['purple', phrase('סגולה', 'סְגֻלָּה', 'sɡulˈa')],
  ['yellow', phrase('צהובה', 'צְהֻבָּה', 'tsehubˈa')],
];
// Every anchor has an existing word and picture. Vehicles and playground
// objects replace candidate landmarks that do not yet have dedicated pictures.
const travelAnchors = [
  ['bus', phrase('אוטובוס', 'אוֹטוֹבּוּס', 'ʔotobˈus')],
  ['tractor', phrase('טרקטור', 'טְרַקְטוֹר', 'tʁˈaktoʁ')],
  ['bicycle', phrase('אופניים', 'אוֹפַנַּיִם', 'ʔofanˈajim')],
  ['slide', phrase('מגלשה', 'מַגְלֵשָׁה', 'maɡleʃˈa')],
  ['swing', phrase('נדנדה', 'נַדְנֵדָה', 'nadnedˈa')],
  ['boat', phrase('סירה', 'סִירָה', 'siʁˈa')],
  ['train', phrase('רכבת', 'רַכֶּבֶת', 'ʁakˈevet')],
  ['truck', phrase('משאית', 'מַשָּׂאִית', 'masaʔˈit')],
  ['police-car', phrase('ניידת', 'נַיֶּדֶת', 'najˈedet')],
  ['motorcycle', phrase('אופנוע', 'אוֹפַנּוֹעַ', 'ʔofanˈoa')],
  ['scooter', phrase('קורקינט', 'קוֹרְקִינֵט', 'koʁkinˈet')],
  ['traffic-light', phrase('רמזור', 'רַמְזוֹר', 'ʁamzˈoʁ')],
];
for (const [anchor, noun] of travelAnchors) for (const [color, adjective] of carColors) {
  add(`car-${color}-${anchor}`, [car, adjective, drivingNear, noun], 'facts-car', {
    kind: 'travel', object: 'car', color, anchor,
  });
}

// Entries keep the singular picture identity separate from the spoken plural.
const arrangementObjects = [
  ['apple', phrase('תפוחים', 'תַּפּוּחִים', 'tapuχˈim'), false],
  ['banana', phrase('בננות', 'בָּנָנוֹת', 'bananˈot'), true],
  ['pear', phrase('אגסים', 'אַגָּסִים', 'ʔaɡasˈim'), false],
  ['orange-fruit', phrase('תפוזים', 'תַּפּוּזִים', 'tapuzˈim'), false],
  ['lemon', phrase('לימונים', 'לִימוֹנִים', 'limonˈim'), false],
  ['strawberry', phrase('תותים', 'תּוּתִים', 'tutˈim'), false],
  ['carrot', phrase('גזרים', 'גְּזָרִים', 'ɡzaʁˈim'), false],
  ['egg', phrase('ביצים', 'בֵּיצִים', 'betsˈim'), true],
  ['cookie', phrase('עוגיות', 'עוּגִיּוֹת', 'ʔuɡijˈot'), true],
];
const numbers = [
  [2, phrase('שני', 'שְׁנֵי', 'ʃnˈej'), phrase('שתי', 'שְׁתֵּי', 'ʃtˈej')],
  [3, phrase('שלושה', 'שְׁלוֹשָׁה', 'ʃloʃˈa'), phrase('שלוש', 'שָׁלוֹשׁ', 'ʃalˈoʃ')],
  [4, phrase('ארבעה', 'אַרְבָּעָה', 'ʔaʁbaʔˈa'), phrase('ארבע', 'אַרְבַּע', 'ʔˈaʁba')],
];
const arrangementPlaces = [
  ['basket', 'in', phrase('בתוך הסל', 'בְּתוֹךְ הַסַּל', 'betˈoχ hasˈal')],
  ['basket', 'near', phrase('ליד הסל', 'לְיַד הַסַּל', 'lejˈad hasˈal')],
  ['box', 'in', phrase('בתוך הקופסה', 'בְּתוֹךְ הַקֻּפְסָה', 'betˈoχ hakufsˈa')],
  ['box', 'near', phrase('ליד הקופסה', 'לְיַד הַקֻּפְסָה', 'lejˈad hakufsˈa')],
];
for (const [object, plural, feminine] of arrangementObjects) {
  for (const [count, masculineNumber, feminineNumber] of numbers) {
    for (const [anchor, position, location] of arrangementPlaces) {
      add(`arrange-${object}-${count}-${anchor}-${position}`, [
        feminine ? feminineNumber : masculineNumber, plural, location,
      ], `picture-arrange-${object}-${anchor}`, {
        kind: 'arrangement', object, count, anchor, position,
      });
    }
  }
}

export const PICTURE_SCENE_PASSAGES = Object.freeze(passages);
