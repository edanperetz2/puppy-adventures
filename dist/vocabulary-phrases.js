// Picture facts and language stay together, including feminine number/verb forms.
const entry = (id, he, pointed, level, family, scene) => ({ id, he, pointed, level, family, scene });
export const EXTRA_READING_WORDS = [];
const colors = {
  red: ['אדום', 'אָדֹם', 'אדומה', 'אֲדֻמָּה'],
  blue: ['כחול', 'כָּחֹל', 'כחולה', 'כְּחֻלָּה'],
  green: ['ירוק', 'יָרֹק', 'ירוקה', 'יְרֻקָּה'],
  pink: ['ורוד', 'וָרֹד', 'ורודה', 'וְרֻדָּה'],
  purple: ['סגול', 'סָגֹל', 'סגולה', 'סְגֻלָּה'],
  yellow: ['צהוב', 'צָהֹב', 'צהובה', 'צְהֻבָּה'],
};
for (const [object, he, pointed, feminine, added] of [
  ['ball', 'כדור', 'כַּדּוּר', false, ['pink', 'purple', 'yellow']],
  ['flower', 'פרח', 'פֶּרַח', false, ['blue', 'green', 'yellow']],
  ['car', 'מכונית', 'מְכוֹנִית', true, ['pink', 'purple', 'yellow']],
  ['butterfly', 'פרפר', 'פַּרְפַּר', false, ['red', 'green', 'pink']],
  ['bird', 'ציפור', 'צִפּוֹר', true, ['red', 'blue', 'green']],
  ['star', 'כוכב', 'כּוֹכָב', false, ['blue', 'yellow', 'purple']],
  ['heart', 'לב', 'לֵב', false, ['red', 'pink', 'purple']],
]) for (const color of added) {
  const adjective = colors[color], n = feminine ? 2 : 0;
  EXTRA_READING_WORDS.push(entry(`color-${object}-${color}`, `${he} ${adjective[n]}`, `${pointed} ${adjective[n + 1]}`, 6, `color-${object}`, { kind: 'color', object, color }));
}

for (const [object, he, pointed, feminine] of [
  ['star', 'כוכבים', 'כּוֹכָבִים', false], ['heart', 'לבבות', 'לְבָבוֹת', false],
  ['banana', 'בננות', 'בָּנָנוֹת', true], ['pear', 'אגסים', 'אַגָּסִים', false],
  ['tree', 'עצים', 'עֵצִים', false], ['cat', 'חתולים', 'חֲתוּלִים', false],
  ['cookie', 'עוגיות', 'עוּגִיּוֹת', true], ['balloon', 'בלונים', 'בַּלּוֹנִים', false],
]) for (const [count, masculine, masculinePointed, female, femalePointed] of [
  [2, 'שני', 'שְׁנֵי', 'שתי', 'שְׁתֵּי'],
  [3, 'שלושה', 'שְׁלוֹשָׁה', 'שלוש', 'שָׁלוֹשׁ'],
  [4, 'ארבעה', 'אַרְבָּעָה', 'ארבע', 'אַרְבַּע'],
]) {
  const number = feminine ? female : masculine, spoken = feminine ? femalePointed : masculinePointed;
  EXTRA_READING_WORDS.push(entry(`count-${object}-${count}`, `${number} ${he}`, `${spoken} ${pointed}`, 7, `count-${object}`, { kind: 'count', object, count }));
}

const tablePlaces = [['on', 'על השולחן', 'עַל הַשֻּׁלְחָן'], ['under', 'מתחת לשולחן', 'מִתַּחַת לַשֻּׁלְחָן'], ['near', 'ליד השולחן', 'לְיַד הַשֻּׁלְחָן']];
const boxPlaces = [['in', 'בתוך הקופסה', 'בְּתוֹךְ הַקֻּפְסָה'], ['on', 'על הקופסה', 'עַל הַקֻּפְסָה'], ['near', 'ליד הקופסה', 'לְיַד הַקֻּפְסָה']];
for (const [object, anchor, he, pointed, places] of [
  ['book', 'table', 'הספר', 'הַסֵּפֶר', tablePlaces],
  ['mug', 'table', 'הספל', 'הַסֵּפֶל', tablePlaces],
  ['pencil', 'box', 'העיפרון', 'הָעִפָּרוֹן', boxPlaces],
  ['apple', 'box', 'התפוח', 'הַתַּפּוּחַ', boxPlaces],
  ['bee', 'flower', 'הדבורה', 'הַדְּבוֹרָה', [['above', 'מעל הפרח', 'מֵעַל הַפֶּרַח'], ['on', 'על הפרח', 'עַל הַפֶּרַח'], ['near', 'ליד הפרח', 'לְיַד הַפֶּרַח']]],
]) for (const [position, hePlace, pointedPlace] of places) {
  EXTRA_READING_WORDS.push(entry(`place-${object}-${position}`, `${he} ${hePlace}`, `${pointed} ${pointedPlace}`, 8, `place-${object}`, { kind: 'position', object, anchor, position }));
}

for (const [object, he, pointed, feminine] of [
  ['dog', 'כלב', 'כֶּלֶב', false], ['cat', 'חתול', 'חָתוּל', false],
  ['rabbit', 'ארנב', 'אַרְנָב', false], ['bird', 'ציפור', 'צִפּוֹר', true],
]) for (const [action, masculine, masculinePointed, female, femalePointed] of [
  ['eat', 'אוכל', 'אוֹכֵל', 'אוכלת', 'אוֹכֶלֶת'],
  ['drink', 'שותה', 'שׁוֹתֶה', 'שותה', 'שׁוֹתָה'],
]) {
  EXTRA_READING_WORDS.push(entry(`action-${object}-${action}`, `${he} ${feminine ? female : masculine}`, `${pointed} ${feminine ? femalePointed : masculinePointed}`, 9, `action-${object}`, { kind: 'action', object, action }));
}

for (const [id, he, pointed, family, scene] of [
  ['books-two-on', 'שני ספרים על השולחן.', 'שְׁנֵי סְפָרִים עַל הַשֻּׁלְחָן.', 'facts-books', { kind: 'arrangement', object: 'book', count: 2, anchor: 'table', position: 'on' }],
  ['books-three-on', 'שלושה ספרים על השולחן.', 'שְׁלוֹשָׁה סְפָרִים עַל הַשֻּׁלְחָן.', 'facts-books', { kind: 'arrangement', object: 'book', count: 3, anchor: 'table', position: 'on' }],
  ['books-two-under', 'שני ספרים מתחת לשולחן.', 'שְׁנֵי סְפָרִים מִתַּחַת לַשֻּׁלְחָן.', 'facts-books', { kind: 'arrangement', object: 'book', count: 2, anchor: 'table', position: 'under' }],
  ['cookies-three-on', 'שלוש עוגיות על הצלחת.', 'שָׁלוֹשׁ עוּגִיּוֹת עַל הַצַּלַּחַת.', 'facts-cookies', { kind: 'arrangement', object: 'cookie', count: 3, anchor: 'plate', position: 'on' }],
  ['cookies-two-on', 'שתי עוגיות על הצלחת.', 'שְׁתֵּי עוּגִיּוֹת עַל הַצַּלַּחַת.', 'facts-cookies', { kind: 'arrangement', object: 'cookie', count: 2, anchor: 'plate', position: 'on' }],
  ['cookies-three-near', 'שלוש עוגיות ליד הצלחת.', 'שָׁלוֹשׁ עוּגִיּוֹת לְיַד הַצַּלַּחַת.', 'facts-cookies', { kind: 'arrangement', object: 'cookie', count: 3, anchor: 'plate', position: 'near' }],
  ['balloons-three-red', 'שלושה בלונים אדומים.', 'שְׁלוֹשָׁה בַּלּוֹנִים אֲדֻמִּים.', 'facts-balloons', { kind: 'count', object: 'balloon', count: 3, color: 'red' }],
  ['balloons-two-red', 'שני בלונים אדומים.', 'שְׁנֵי בַּלּוֹנִים אֲדֻמִּים.', 'facts-balloons', { kind: 'count', object: 'balloon', count: 2, color: 'red' }],
  ['balloons-three-blue', 'שלושה בלונים כחולים.', 'שְׁלוֹשָׁה בַּלּוֹנִים כְּחֻלִּים.', 'facts-balloons', { kind: 'count', object: 'balloon', count: 3, color: 'blue' }],
  ['bee-small-above', 'דבורה קטנה מעל הפרח.', 'דְּבוֹרָה קְטַנָּה מֵעַל הַפֶּרַח.', 'facts-bee', { kind: 'position', object: 'bee', anchor: 'flower', position: 'above', size: 'small' }],
  ['bee-big-above', 'דבורה גדולה מעל הפרח.', 'דְּבוֹרָה גְּדוֹלָה מֵעַל הַפֶּרַח.', 'facts-bee', { kind: 'position', object: 'bee', anchor: 'flower', position: 'above', size: 'big' }],
  ['bee-small-near', 'דבורה קטנה ליד הפרח.', 'דְּבוֹרָה קְטַנָּה לְיַד הַפֶּרַח.', 'facts-bee', { kind: 'position', object: 'bee', anchor: 'flower', position: 'near', size: 'small' }],
]) EXTRA_READING_WORDS.push(entry(`facts-${id}`, he, pointed, 10, family, scene));

export const EXTRA_READING_LEXICON = Object.freeze({
  'כּוֹכָבִים': 'koχavˈim', 'לְבָבוֹת': 'levavˈot', 'בָּנָנוֹת': 'bananˈot',
  'אַגָּסִים': 'ʔaɡasˈim', 'עֵצִים': 'ʔetsˈim', 'חֲתוּלִים': 'χatulˈim',
  'עוּגִיּוֹת': 'ʔuɡijˈot', 'בַּלּוֹנִים': 'balonˈim', 'סְפָרִים': 'sfaʁˈim',
  'הַסֵּפֶר': 'hasˈefeʁ', 'הַסֵּפֶל': 'hasˈefel', 'הַתַּפּוּחַ': 'hatapˈuaχ',
  'הַדְּבוֹרָה': 'hadvoʁˈa', 'אוֹכֵל': 'ʔoχˈel', 'שׁוֹתֶה': 'ʃotˈe',
  'אוֹכֶלֶת': 'ʔoχˈelet', 'שׁוֹתָה': 'ʃotˈa', 'אֲדֻמִּים': 'ʔadumˈim',
  'הַצַּלַּחַת': 'hatsalˈaχat', 'גְּדוֹלָה': 'ɡdolˈa',
});
