import { EXTRA_READING_WORDS } from './vocabulary-phrases.js';

// Curated language and scene facts stay together so every picture has one meaning.
const entry = (id, he, pointed, level, family, scene) => ({ id, he, pointed, level, ...(family ? { family, scene } : {}) });

export const ADVANCED_WORDS = [
  entry('firetruck', 'כבאית', 'כַּבָּאִית', 5),
  entry('ambulance', 'אמבולנס', 'אַמְבּוּלַנְס', 5),
  entry('bus', 'אוטובוס', 'אוֹטוֹבּוּס', 5),
  entry('backhoe', 'מחפרון', 'מַחְפֵּרוֹן', 5),
  entry('traffic-light', 'רמזור', 'רַמְזוֹר', 5),
  entry('hedgehog', 'קיפוד', 'קִפּוֹד', 5),
  entry('hen', 'תרנגולת', 'תַּרְנְגֹלֶת', 5),
  entry('ladybug', 'חיפושית', 'חִפּוּשִׁית', 5),
  entry('toys', 'צעצועים', 'צַעֲצוּעִים', 5),
  entry('slide', 'מגלשה', 'מַגְלֵשָׁה', 5),
  entry('swing', 'נדנדה', 'נַדְנֵדָה', 5),
  entry('backpack', 'תרמיל', 'תַּרְמִיל', 5),
];

const colors = {
  red: ['אדום', 'אָדֹם', 'אדומה', 'אֲדֻמָּה'],
  blue: ['כחול', 'כָּחֹל', 'כחולה', 'כְּחֻלָּה'],
  green: ['ירוק', 'יָרֹק', 'ירוקה', 'יְרֻקָּה'],
  pink: ['ורוד', 'וָרֹד', 'ורודה', 'וְרֻדָּה'],
  purple: ['סגול', 'סָגֹל', 'סגולה', 'סְגֻלָּה'],
  yellow: ['צהוב', 'צָהֹב', 'צהובה', 'צְהֻבָּה'],
};

for (const [object, he, pointed, feminine, palette] of [
  ['ball', 'כדור', 'כַּדּוּר', false, ['red', 'blue', 'green']],
  ['flower', 'פרח', 'פֶּרַח', false, ['red', 'pink', 'purple']],
  ['car', 'מכונית', 'מְכוֹנִית', true, ['red', 'blue', 'green']],
  ['butterfly', 'פרפר', 'פַּרְפַּר', false, ['blue', 'yellow', 'purple']],
]) for (const color of palette) {
  const adjective = colors[color], n = feminine ? 2 : 0;
  ADVANCED_WORDS.push(entry(`color-${object}-${color}`, `${he} ${adjective[n]}`, `${pointed} ${adjective[n + 1]}`, 6, `color-${object}`, { kind: 'color', object, color }));
}

for (const [object, he, pointed] of [
  ['ball', 'כדורים', 'כַּדּוּרִים'], ['flower', 'פרחים', 'פְּרָחִים'],
  ['butterfly', 'פרפרים', 'פַּרְפָּרִים'], ['apple', 'תפוחים', 'תַּפּוּחִים'],
]) for (const [count, number, spoken] of [[2, 'שני', 'שְׁנֵי'], [3, 'שלושה', 'שְׁלוֹשָׁה'], [4, 'ארבעה', 'אַרְבָּעָה']]) {
  ADVANCED_WORDS.push(entry(`count-${object}-${count}`, `${number} ${he}`, `${spoken} ${pointed}`, 7, `count-${object}`, { kind: 'count', object, count }));
}

for (const [object, anchor, he, pointed, positions] of [
  ['ball', 'table', 'הכדור', 'הַכַּדּוּר', [['on', 'על השולחן', 'עַל הַשֻּׁלְחָן'], ['under', 'מתחת לשולחן', 'מִתַּחַת לַשֻּׁלְחָן'], ['near', 'ליד השולחן', 'לְיַד הַשֻּׁלְחָן']]],
  ['cat', 'box', 'החתול', 'הֶחָתוּל', [['in', 'בתוך הקופסה', 'בְּתוֹךְ הַקֻּפְסָה'], ['on', 'על הקופסה', 'עַל הַקֻּפְסָה'], ['near', 'ליד הקופסה', 'לְיַד הַקֻּפְסָה']]],
  ['butterfly', 'flower', 'הפרפר', 'הַפַּרְפַּר', [['above', 'מעל הפרח', 'מֵעַל הַפֶּרַח'], ['on', 'על הפרח', 'עַל הַפֶּרַח'], ['near', 'ליד הפרח', 'לְיַד הַפֶּרַח']]],
  ['bird', 'tree', 'הציפור', 'הַצִּפּוֹר', [['above', 'מעל העץ', 'מֵעַל הָעֵץ'], ['on', 'על העץ', 'עַל הָעֵץ'], ['near', 'ליד העץ', 'לְיַד הָעֵץ']]],
]) for (const [position, tail, spokenTail] of positions) {
  ADVANCED_WORDS.push(entry(`place-${object}-${position}`, `${he} ${tail}`, `${pointed} ${spokenTail}`, 8, `place-${object}`, { kind: 'position', object, anchor, position }));
}

for (const [object, he, pointed, actions] of [
  ['dog', 'כלב', 'כֶּלֶב', [['sleep', 'ישן', 'יָשֵׁן'], ['run', 'רץ', 'רָץ'], ['jump', 'קופץ', 'קוֹפֵץ']]],
  ['cat', 'חתול', 'חָתוּל', [['sleep', 'ישן', 'יָשֵׁן'], ['run', 'רץ', 'רָץ'], ['jump', 'קופץ', 'קוֹפֵץ']]],
  ['rabbit', 'ארנב', 'אַרְנָב', [['sleep', 'ישן', 'יָשֵׁן'], ['run', 'רץ', 'רָץ'], ['jump', 'קופץ', 'קוֹפֵץ']]],
  ['bird', 'ציפור', 'צִפּוֹר', [['sleep', 'ישנה', 'יְשֵׁנָה'], ['fly', 'עפה', 'עָפָה'], ['stand', 'עומדת', 'עוֹמֶדֶת']]],
]) for (const [action, verb, spokenVerb] of actions) {
  ADVANCED_WORDS.push(entry(`action-${object}-${action}`, `${he} ${verb}`, `${pointed} ${spokenVerb}`, 9, `action-${object}`, { kind: 'action', object, action }));
}

for (const [id, he, pointed, family, scene] of [
  ['butterflies-two-blue', 'שני פרפרים כחולים עפים.', 'שְׁנֵי פַּרְפָּרִים כְּחֻלִּים עָפִים.', 'facts-butterflies', { kind: 'count', object: 'butterfly', count: 2, color: 'blue', flying: true }],
  ['butterflies-three-blue', 'שלושה פרפרים כחולים עפים.', 'שְׁלוֹשָׁה פַּרְפָּרִים כְּחֻלִּים עָפִים.', 'facts-butterflies', { kind: 'count', object: 'butterfly', count: 3, color: 'blue', flying: true }],
  ['butterflies-two-yellow', 'שני פרפרים צהובים עפים.', 'שְׁנֵי פַּרְפָּרִים צְהֻבִּים עָפִים.', 'facts-butterflies', { kind: 'count', object: 'butterfly', count: 2, color: 'yellow', flying: true }],
  ['car-red-house', 'מכונית אדומה נוסעת ליד בית.', 'מְכוֹנִית אֲדֻמָּה נוֹסַעַת לְיַד בַּיִת.', 'facts-car', { kind: 'travel', object: 'car', color: 'red', anchor: 'house' }],
  ['car-blue-house', 'מכונית כחולה נוסעת ליד בית.', 'מְכוֹנִית כְּחֻלָּה נוֹסַעַת לְיַד בַּיִת.', 'facts-car', { kind: 'travel', object: 'car', color: 'blue', anchor: 'house' }],
  ['car-red-tree', 'מכונית אדומה נוסעת ליד עץ.', 'מְכוֹנִית אֲדֻמָּה נוֹסַעַת לְיַד עֵץ.', 'facts-car', { kind: 'travel', object: 'car', color: 'red', anchor: 'tree' }],
  ['rabbit-small-jump', 'ארנב קטן קופץ.', 'אַרְנָב קָטָן קוֹפֵץ.', 'facts-rabbit', { kind: 'action', object: 'rabbit', action: 'jump', size: 'small', reference: true }],
  ['rabbit-big-jump', 'ארנב גדול קופץ.', 'אַרְנָב גָּדוֹל קוֹפֵץ.', 'facts-rabbit', { kind: 'action', object: 'rabbit', action: 'jump', size: 'big', reference: true }],
  ['rabbit-small-sleep', 'ארנב קטן ישן.', 'אַרְנָב קָטָן יָשֵׁן.', 'facts-rabbit', { kind: 'action', object: 'rabbit', action: 'sleep', size: 'small', reference: true }],
  ['bird-red-on', 'ציפור אדומה עומדת על עץ.', 'צִפּוֹר אֲדֻמָּה עוֹמֶדֶת עַל עֵץ.', 'facts-bird', { kind: 'position', object: 'bird', color: 'red', anchor: 'tree', position: 'on' }],
  ['bird-blue-on', 'ציפור כחולה עומדת על עץ.', 'צִפּוֹר כְּחֻלָּה עוֹמֶדֶת עַל עֵץ.', 'facts-bird', { kind: 'position', object: 'bird', color: 'blue', anchor: 'tree', position: 'on' }],
  ['bird-red-near', 'ציפור אדומה עומדת ליד עץ.', 'צִפּוֹר אֲדֻמָּה עוֹמֶדֶת לְיַד עֵץ.', 'facts-bird', { kind: 'position', object: 'bird', color: 'red', anchor: 'tree', position: 'near' }],
]) ADVANCED_WORDS.push(entry(`facts-${id}`, he, pointed, 10, family, scene));

ADVANCED_WORDS.push(...EXTRA_READING_WORDS);

export const READING_SCENES = Object.freeze(Object.fromEntries(ADVANCED_WORDS.filter(word => word.scene).map(word => [word.id, Object.freeze(word.scene)])));
