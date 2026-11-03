// Additional finite, reviewed picture-language sets for the existing ten stages.
// No new scene kind is introduced. Each target carries explicit spoken IPA.
// Plural color targets show four objects; numbered color sentences use two/three.
const lexicon = {};
const form = source => {
  const [he, pointed, ipa] = source.split('|');
  const tokens = pointed.match(/[\u0590-\u05ff]+/gu) || [];
  const sounds = ipa.split(' ');
  if (tokens.length !== sounds.length) throw new Error(`Unaligned reading pronunciation: ${he}`);
  tokens.forEach((token, index) => { lexicon[token.normalize('NFC')] = sounds[index]; });
  return Object.freeze({ he, pointed, ipa });
};
const phrases = [];
const add = (id, parts, level, family, scene, sentence = false) => {
  const suffix = sentence ? '.' : '';
  phrases.push(Object.freeze({
    id: `expanded-${id}`, he: parts.map(p => p.he).join(' ') + suffix,
    pointed: parts.map(p => p.pointed).join(' ') + suffix,
    spoken: parts.map(p => p.ipa).join(' ') + suffix,
    level, family, scene: Object.freeze(scene),
  }));
};
const colors = {
  red: ['אדום|אָדֹם|ʔadˈom', 'אדומה|אֲדֻמָּה|ʔadumˈa', 'אדומים|אֲדֻמִּים|ʔadumˈim', 'אדומות|אֲדֻמּוֹת|ʔadumˈot'],
  blue: ['כחול|כָּחֹל|kaχˈol', 'כחולה|כְּחֻלָּה|kχulˈa', 'כחולים|כְּחֻלִּים|kχulˈim', 'כחולות|כְּחֻלּוֹת|kχulˈot'],
  green: ['ירוק|יָרֹק|jaʁˈok', 'ירוקה|יְרֻקָּה|jeʁukˈa', 'ירוקים|יְרֻקִּים|jeʁukˈim', 'ירוקות|יְרֻקּוֹת|jeʁukˈot'],
  pink: ['ורוד|וָרֹד|vaʁˈod', 'ורודה|וְרֻדָּה|veʁudˈa', 'ורודים|וְרֻדִּים|veʁudˈim', 'ורודות|וְרֻדּוֹת|veʁudˈot'],
  purple: ['סגול|סָגֹל|saɡˈol', 'סגולה|סְגֻלָּה|sɡulˈa', 'סגולים|סְגֻלִּים|sɡulˈim', 'סגולות|סְגֻלּוֹת|sɡulˈot'],
  yellow: ['צהוב|צָהֹב|tsahˈov', 'צהובה|צְהֻבָּה|tsehubˈa', 'צהובים|צְהֻבִּים|tsehubˈim', 'צהובות|צְהֻבּוֹת|tsehubˈot'],
};
Object.keys(colors).forEach(key => { colors[key] = colors[key].map(form); });
const coloredObjects = [
  ['ball', 'כדור|כַּדּוּר|kadˈuʁ', 'כדורים|כַּדּוּרִים|kaduʁˈim', false],
  ['flower', 'פרח|פֶּרַח|pˈeʁaχ', 'פרחים|פְּרָחִים|pʁaχˈim', false],
  ['car', 'מכונית|מְכוֹנִית|meχonˈit', 'מכוניות|מְכוֹנִיּוֹת|meχonijˈot', true],
  ['butterfly', 'פרפר|פַּרְפַּר|paʁpˈaʁ', 'פרפרים|פַּרְפָּרִים|paʁpaʁˈim', false],
  ['bird', 'ציפור|צִפּוֹר|tsipˈoʁ', 'ציפורים|צִפּוֹרִים|tsipoʁˈim', true],
  ['star', 'כוכב|כּוֹכָב|koχˈav', 'כוכבים|כּוֹכָבִים|koχavˈim', false],
  ['heart', 'לב|לֵב|lˈev', 'לבבות|לְבָבוֹת|levavˈot', false],
  ['balloon', 'בלון|בַּלּוֹן|balˈon', 'בלונים|בַּלּוֹנִים|balonˈim', false],
].map(([object, single, plural, feminine]) => ({ object, single: form(single), plural: form(plural), feminine }));
const missingSingleColors = {
  bird: ['pink', 'purple', 'yellow'], star: ['red', 'green', 'pink'],
  heart: ['blue', 'green', 'yellow'], balloon: Object.keys(colors),
};
for (const { object, single, plural, feminine } of coloredObjects) {
  for (const color of missingSingleColors[object] || []) {
    add(`color-${object}-${color}`, [single, colors[color][feminine ? 1 : 0]], 6, `color-${object}`, { kind: 'color', object, color });
  }
  for (const color of Object.keys(colors)) {
    add(`color-plural-${object}-${color}`, [plural, colors[color][feminine ? 3 : 2]], 6, `expanded-color-plural-${object}`, { kind: 'count', object, count: 4, color });
  }
}

const numberForms = {
  2: [form('שני|שְׁנֵי|ʃnˈej'), form('שתי|שְׁתֵּי|ʃtˈej')],
  3: [form('שלושה|שְׁלוֹשָׁה|ʃloʃˈa'), form('שלוש|שָׁלוֹשׁ|ʃalˈoʃ')],
  4: [form('ארבעה|אַרְבָּעָה|ʔaʁbaʔˈa'), form('ארבע|אַרְבַּע|ʔˈaʁba')],
};
const countObjects = [
  ['dog', 'כלבים|כְּלָבִים|klavˈim', false],
  ['rabbit', 'ארנבים|אַרְנָבִים|ʔaʁnavˈim', false],
  ['bird', 'ציפורים|צִפּוֹרִים|tsipoʁˈim', true],
  ['duck', 'ברווזים|בַּרְוָזִים|baʁvazˈim', false],
  ['fish', 'דגים|דָּגִים|daɡˈim', false],
  ['horse', 'סוסים|סוּסִים|susˈim', false],
  ['bear', 'דובים|דֻּבִּים|dubˈim', false],
  ['lion', 'אריות|אֲרָיוֹת|ʔaʁajˈot', false],
  ['elephant', 'פילים|פִּילִים|pilˈim', false],
  ['monkey', 'קופים|קוֹפִים|kofˈim', false],
  ['mouse', 'עכברים|עַכְבָּרִים|ʔaχbaʁˈim', false],
  ['fox', 'שועלים|שׁוּעָלִים|ʃuʔalˈim', false],
  ['cow', 'פרות|פָּרוֹת|paʁˈot', true],
  ['goat', 'עזים|עִזִּים|ʔizˈim', true],
  ['camel', 'גמלים|גְּמַלִּים|ɡmalˈim', false],
  ['owl', 'ינשופים|יַנְשׁוּפִים|janʃufˈim', false],
  ['turtle', 'צבים|צַבִּים|tsabˈim', false],
  ['snake', 'נחשים|נְחָשִׁים|neχaʃˈim', false],
  ['bee', 'דבורים|דְּבוֹרִים|dvoʁˈim', true],
  ['ant', 'נמלים|נְמָלִים|nemalˈim', true],
  ['strawberry', 'תותים|תּוּתִים|tutˈim', false],
  ['orange-fruit', 'תפוזים|תַּפּוּזִים|tapuzˈim', false],
  ['lemon', 'לימונים|לִימוֹנִים|limonˈim', false],
  ['carrot', 'גזרים|גְּזָרִים|ɡzaʁˈim', false],
  ['onion', 'בצלים|בְּצָלִים|btsalˈim', false],
  ['tomato', 'עגבניות|עַגְבָנִיּוֹת|ʔaɡvanijˈot', true],
  ['egg', 'ביצים|בֵּיצִים|betsˈim', true],
  ['cake', 'עוגות|עוּגוֹת|ʔuɡˈot', true],
  ['candy', 'סוכריות|סֻכָּרִיּוֹת|sukaʁijˈot', true],
  ['mug', 'ספלים|סְפָלִים|sfalˈim', false],
  ['plate', 'צלחות|צַלָּחוֹת|tsalaχˈot', true],
  ['spoon', 'כפות|כַּפּוֹת|kapˈot', true],
  ['key', 'מפתחות|מַפְתְּחוֹת|mafteχˈot', false],
  ['bell', 'פעמונים|פַּעֲמוֹנִים|paʔamonˈim', false],
  ['hat', 'כובעים|כּוֹבָעִים|kovaʔˈim', false],
  ['shoe', 'נעליים|נַעֲלַיִם|naʔalˈajim', true],
  ['pencil', 'עפרונות|עֶפְרוֹנוֹת|ʔefʁonˈot', false],
  ['notebook', 'מחברות|מַחְבָּרוֹת|maχbaʁˈot', true],
  ['robot', 'רובוטים|רוֹבּוֹטִים|ʁobotˈim', false],
  ['chair', 'כיסאות|כִּסְאוֹת|kisʔˈot', false],
].map(([object, plural, feminine]) => ({ object, plural: form(plural), feminine }));
for (const { object, plural, feminine } of countObjects) for (const count of [2, 3, 4]) {
  add(`count-${object}-${count}`, [numberForms[count][feminine ? 1 : 0], plural], 7, `expanded-count-${object}`, { kind: 'count', object, count });
}

const nouns = Object.fromEntries([
  ['apple', 'תפוח|תַּפּוּחַ|tapˈuaχ'], ['banana', 'בננה|בָּנָנָה|banˈana'],
  ['pear', 'אגס|אַגָּס|ʔaɡˈas'], ['orange-fruit', 'תפוז|תַּפּוּז|tapˈuz'],
  ['lemon', 'לימון|לִימוֹן|limˈon'], ['strawberry', 'תות|תּוּת|tˈut'],
  ['carrot', 'גזר|גֶּזֶר|ɡˈezeʁ'], ['cucumber', 'מלפפון|מְלָפְפוֹן|melafefˈon'],
  ['tomato', 'עגבנייה|עַגְבָנִיָּה|ʔaɡvanijˈa'], ['onion', 'בצל|בָּצָל|batsˈal'],
  ['egg', 'ביצה|בֵּיצָה|betsˈa'], ['cookie', 'עוגייה|עוּגִיָּה|ʔuɡijˈa'],
  ['cake', 'עוגה|עוּגָה|ʔuɡˈa'], ['candy', 'סוכרייה|סֻכָּרִיָּה|sukaʁijˈa'],
  ['plate', 'צלחת|צַלַּחַת|tsalˈaχat'], ['bowl', 'קערה|קְעָרָה|keʔaʁˈa'],
  ['spoon', 'כף|כַּף|kˈaf'], ['fork', 'מזלג|מַזְלֵג|mazlˈeɡ'],
  ['key', 'מפתח|מַפְתֵּחַ|maftˈeaχ'], ['bell', 'פעמון|פַּעֲמוֹן|paʔamˈon'],
  ['hat', 'כובע|כּוֹבַע|kˈova'], ['shoe', 'נעל|נַעַל|nˈaʔal'],
  ['notebook', 'מחברת|מַחְבֶּרֶת|maχbˈeʁet'], ['pen', 'עט|עֵט|ʔˈet'],
  ['paintbrush', 'מכחול|מִכְחוֹל|miχˈol'], ['ruler', 'סרגל|סַרְגֵּל|saʁɡˈel'],
  ['eraser', 'מחק|מַחַק|mˈaχak'], ['robot', 'רובוט|רוֹבּוֹט|ʁˈobot'],
  ['dog', 'כלב|כֶּלֶב|kˈelev'], ['cat', 'חתול|חָתוּל|χatˈul'],
  ['rabbit', 'ארנב|אַרְנָב|ʔaʁnˈav'], ['bird', 'ציפור|צִפּוֹר|tsipˈoʁ'],
  ['bee', 'דבורה|דְּבוֹרָה|dvoʁˈa'], ['butterfly', 'פרפר|פַּרְפַּר|paʁpˈaʁ'],
  ['owl', 'ינשוף|יַנְשׁוּף|janʃˈuf'], ['parrot', 'תוכי|תֻּכִּי|tukˈi'],
  ['eagle', 'נשר|נֶשֶׁר|nˈeʃeʁ'], ['flower', 'פרח|פֶּרַח|pˈeʁaχ'],
  ['ball', 'כדור|כַּדּוּר|kadˈuʁ'], ['mug', 'ספל|סֵפֶל|sˈefel'],
].map(([id, source]) => [id, form(source)]));
const places = {
  table: [['on', 'על השולחן|עַל הַשֻּׁלְחָן|ʔˈal haʃulχˈan'], ['under', 'מתחת לשולחן|מִתַּחַת לַשֻּׁלְחָן|mitˈaχat laʃulχˈan'], ['near', 'ליד השולחן|לְיַד הַשֻּׁלְחָן|lejˈad haʃulχˈan']],
  box: [['in', 'בתוך הקופסה|בְּתוֹךְ הַקֻּפְסָה|betˈoχ hakufsˈa'], ['on', 'על הקופסה|עַל הַקֻּפְסָה|ʔˈal hakufsˈa'], ['near', 'ליד הקופסה|לְיַד הַקֻּפְסָה|lejˈad hakufsˈa']],
  tree: [['above', 'מעל העץ|מֵעַל הָעֵץ|meʔˈal haʔˈets'], ['on', 'על העץ|עַל הָעֵץ|ʔˈal haʔˈets'], ['near', 'ליד העץ|לְיַד הָעֵץ|lejˈad haʔˈets']],
  flower: [['above', 'מעל הפרח|מֵעַל הַפֶּרַח|meʔˈal hapˈeʁaχ'], ['on', 'על הפרח|עַל הַפֶּרַח|ʔˈal hapˈeʁaχ'], ['near', 'ליד הפרח|לְיַד הַפֶּרַח|lejˈad hapˈeʁaχ']],
};
Object.keys(places).forEach(anchor => { places[anchor] = places[anchor].map(([position, source]) => [position, form(source)]); });
const positionSets = {
  table: ['apple', 'banana', 'pear', 'orange-fruit', 'lemon', 'strawberry', 'carrot', 'cucumber', 'tomato', 'onion', 'egg', 'cookie', 'cake', 'candy', 'plate', 'bowl', 'spoon', 'fork'],
  box: ['key', 'bell', 'hat', 'shoe', 'notebook', 'pen', 'paintbrush', 'ruler', 'eraser', 'robot', 'ball', 'rabbit'],
  tree: ['owl', 'parrot', 'eagle'],
  flower: ['bird'],
};
for (const [anchor, objects] of Object.entries(positionSets)) for (const object of objects) for (const [position, tail] of places[anchor]) {
  add(`place-${object}-${anchor}-${position}`, [nouns[object], tail], 8, `expanded-place-${object}-${anchor}`, { kind: 'position', object, anchor, position });
}

const sizes = [
  ['small', [form('קטן|קָטָן|katˈan'), form('קטנה|קְטַנָּה|ktanˈa')]],
  ['big', [form('גדול|גָּדוֹל|ɡadˈol'), form('גדולה|גְּדוֹלָה|ɡdolˈa')]],
];
const actions = {
  sleep: [form('ישן|יָשֵׁן|jaʃˈen'), form('ישנה|יְשֵׁנָה|jeʃenˈa')],
  run: [form('רץ|רָץ|ʁˈats'), form('רצה|רָצָה|ʁatsˈa')],
  jump: [form('קופץ|קוֹפֵץ|kofˈets'), form('קופצת|קוֹפֶצֶת|kofˈetset')],
  fly: [form('עף|עָף|ʔˈaf'), form('עפה|עָפָה|ʔafˈa')],
  stand: [form('עומד|עוֹמֵד|ʔomˈed'), form('עומדת|עוֹמֶדֶת|ʔomˈedet')],
};
for (const object of ['dog', 'cat', 'rabbit', 'bird']) {
  const feminine = object === 'bird';
  for (const action of feminine ? ['sleep', 'fly', 'stand'] : ['sleep', 'run', 'jump']) for (const [size, adjectives] of sizes) {
    // These three exact scenes already appear in the original sentence stage.
    if (object === 'rabbit' && (action === 'jump' || (action === 'sleep' && size === 'small'))) continue;
    add(`action-${object}-${size}-${action}`, [nouns[object], adjectives[feminine ? 1 : 0], actions[action][feminine ? 1 : 0]], 9, `expanded-action-size-${object}`, { kind: 'action', object, action, size, reference: true });
  }
}

for (const { object, plural, feminine } of coloredObjects) for (const count of [2, 3]) for (const color of Object.keys(colors)) {
  if (object === 'balloon' && ((color === 'red') || (count === 3 && color === 'blue'))) continue;
  add(`facts-${object}-${count}-${color}`, [numberForms[count][feminine ? 1 : 0], plural, colors[color][feminine ? 3 : 2]], 10, `expanded-facts-count-${object}`, { kind: 'count', object, count, color }, true);
}
for (const [object, anchor] of [['ball', 'table'], ['flower', 'table'], ['butterfly', 'flower'], ['bird', 'tree']]) {
  const item = coloredObjects.find(value => value.object === object);
  for (const [position, tail] of places[anchor]) for (const color of Object.keys(colors)) {
    if (object === 'bird' && ((position === 'on' && ['red', 'blue'].includes(color)) || (position === 'near' && color === 'red'))) continue;
    add(`facts-${object}-${color}-${anchor}-${position}`, [item.single, colors[color][item.feminine ? 1 : 0], tail], 10, `expanded-facts-place-${object}-${anchor}`, { kind: 'position', object, anchor, position, color }, true);
  }
}
const travelAnchors = [
  ['house', 'בית|בַּיִת|bˈajit'], ['tree', 'עץ|עֵץ|ʔˈets'],
  ['tent', 'אוהל|אֹהֶל|ʔˈohel'], ['mountain', 'הר|הַר|hˈaʁ'],
  ['rock', 'סלע|סֶלַע|sˈela'], ['cactus', 'קקטוס|קַקְטוּס|kˈaktus'],
  ['palace', 'ארמון|אַרְמוֹן|ʔaʁmˈon'], ['bridge', 'גשר|גֶּשֶׁר|ɡˈeʃeʁ'],
  ['firetruck', 'כבאית|כַּבָּאִית|kabaʔˈit'], ['ambulance', 'אמבולנס|אַמְבּוּלַנְס|ʔambulˈans'],
].map(([anchor, source]) => [anchor, form(source)]);
const driving = form('נוסעת ליד|נוֹסַעַת לְיַד|nosˈaʔat lejˈad');
const carNoun = coloredObjects.find(item => item.object === 'car').single;
for (const [anchor, tail] of travelAnchors) for (const color of Object.keys(colors)) {
  if ((anchor === 'house' && ['red', 'blue'].includes(color)) || (anchor === 'tree' && color === 'red')) continue;
  add(`facts-car-${color}-${anchor}`, [carNoun, colors[color][1], driving, tail], 10, 'facts-car', { kind: 'travel', object: 'car', color, anchor }, true);
}
const arrangementObjects = [
  ['apple', 'תפוחים|תַּפּוּחִים|tapuχˈim', false], ['banana', 'בננות|בָּנָנוֹת|bananˈot', true],
  ['pear', 'אגסים|אַגָּסִים|ʔaɡasˈim', false], ['orange-fruit', 'תפוזים|תַּפּוּזִים|tapuzˈim', false],
  ['lemon', 'לימונים|לִימוֹנִים|limonˈim', false], ['mug', 'ספלים|סְפָלִים|sfalˈim', false],
  ['robot', 'רובוטים|רוֹבּוֹטִים|ʁobotˈim', false], ['notebook', 'מחברות|מַחְבָּרוֹת|maχbaʁˈot', true],
].map(([object, source, feminine]) => ({ object, plural: form(source), feminine }));
for (const { object, plural, feminine } of arrangementObjects) for (const count of [2, 3]) for (const position of ['on', 'under']) {
  const tail = places.table.find(([value]) => value === position)[1];
  add(`facts-arrange-${object}-${count}-table-${position}`, [numberForms[count][feminine ? 1 : 0], plural, tail], 10, `expanded-facts-arrange-${object}`, { kind: 'arrangement', object, count, anchor: 'table', position }, true);
}
const platePlaces = {
  on: form('על הצלחת|עַל הַצַּלַּחַת|ʔˈal hatsalˈaχat'),
  near: form('ליד הצלחת|לְיַד הַצַּלַּחַת|lejˈad hatsalˈaχat'),
};
for (const [object, plural, feminine] of [
  ['strawberry', form('תותים|תּוּתִים|tutˈim'), false],
  ['carrot', form('גזרים|גְּזָרִים|ɡzaʁˈim'), false],
  ['egg', form('ביצים|בֵּיצִים|betsˈim'), true],
  ['candy', form('סוכריות|סֻכָּרִיּוֹת|sukaʁijˈot'), true],
]) for (const [count, position] of [[2, 'on'], [3, 'on'], [3, 'near']]) {
  // The existing plate renderer deliberately places three objects for 'near'.
  add(`facts-arrange-${object}-${count}-plate-${position}`, [numberForms[count][feminine ? 1 : 0], plural, platePlaces[position]], 10, `expanded-facts-plate-${object}`, { kind: 'arrangement', object, count, anchor: 'plate', position }, true);
}

// Official Twemoji asset names; image import is performed by the main build.
// The reserved letter-example nouns are intentionally authored elsewhere.
const vocabularySource = `
hamster|אוגר|אוֹגֵר|ʔoɡˈeʁ|1f439|animals
rhinoceros|קרנף|קַרְנַף|kaʁnˈaf|1f98f|animals
buffalo|תאו|תְּאוֹ|teʔˈo|1f403|animals
donkey|חמור|חֲמוֹר|χamˈoʁ|1facf|animals
goose|אווז|אַוָּז|ʔavˈaz|1fabf|animals
turkey|תרנגול הודו|תַּרְנְגוֹל הוֹדּוּ|taʁneɡˈol hˈodu|1f983|animals|5
seal|כלב ים|כֶּלֶב יָם|kˈelev jˈam|1f9ad|animals|5
beaver|בונה|בּוֹנֶה|bonˈe|1f9ab|animals
otter|לוטרה|לוּטְרָה|lˈutʁa|1f9a6|animals
raccoon|דביבון|דַּבִּיבוֹן|dabivˈon|1f99d|animals
skunk|בואש|בּוֹאֵשׁ|boʔˈeʃ|1f9a8|animals
sloth|עצלן|עַצְלָן|ʔatslˈan|1f9a5|animals
boar|חזיר בר|חֲזִיר בַּר|χazˈiʁ bˈaʁ|1f417|animals|5
lobster|לובסטר|לוֹבְּסְטֶר|lˈobsteʁ|1f99e|animals
shrimp|חסילון|חֲסִילוֹן|χasilˈon|1f990|animals
squid|דיונון|דְּיוֹנוּן|djonˈun|1f991|animals
oyster|צדפה|צִדְפָּה|tsidpˈa|1f9aa|animals
cricket|צרצר|צְרָצַר|tsʁatsˈaʁ|1f997|animals
cockroach|תיקן|תִּיקָן|tikˈan|1fab3|animals
scorpion|עקרב|עַקְרָב|ʔakʁˈav|1f982|animals
potato|תפוח אדמה|תַּפּוּחַ אֲדָמָה|tapˈuaχ ʔadamˈa|1f954|food|5
sweet-potato|בטטה|בַּטָּטָה|batˈata|1f360|food
peanut|בוטן|בֹּטֶן|bˈoten|1f95c|food
chestnut|ערמון|עַרְמוֹן|ʔaʁmˈon|1f330|food
beans|שעועית|שְׁעוּעִית|ʃeʔuʔˈit|1fad8|food
peas|אפונה|אֲפוּנָה|ʔafunˈa|1fadb|food
ginger|ג׳ינג׳ר|גִּ׳ינְגֵּ׳ר|dʒˈindʒeʁ|1fada|food|5
pancake|פנקייק|פַּנְקֵייק|pˈankejk|1f95e|food
waffle|ופל|וָפֶל|vˈafel|1f9c7|food
dumpling|כיסון|כִּיסוֹן|kisˈon|1f95f|food
sushi|סושי|סוּשִׁי|sˈuʃi|1f363|food
falafel|פלאפל|פָלָאפֶל|falˈafel|1f9c6|food
baguette|בגט|בָּגֵט|baɡˈet|1f956|food
sandwich|כריך|כָּרִיךְ|kaʁˈiχ|1f96a|food
meat|בשר|בָּשָׂר|basˈaʁ|1f969|food
chicken-leg|שוק עוף|שׁוֹק עוֹף|ʃˈok ʔˈof|1f357|food|5
canned-food|שימורים|שִׁמּוּרִים|ʃimuʁˈim|1f96b|food
taco|טאקו|טָאקוֹ|tˈako|1f32e|food
burrito|בוריטו|בּוּרִיטוֹ|buʁˈito|1f32f|food
coffee|קפה|קָפֶה|kafˈe|2615|food
juice|מיץ|מִיץ|mˈits|1f9c3|food
ice|קרח|קֶרַח|kˈeʁaχ|1f9ca|food
popcorn|פופקורן|פּוֹפְּקוֹרְן|pˈopkoʁn|1f37f|food
doughnut|סופגנייה|סֻפְגָּנִיָּה|sufɡanijˈa|1f369|food
butter|חמאה|חֶמְאָה|χemʔˈa|1f9c8|food
cup|כוס|כּוֹס|kˈos|1f95b|home
box|קופסה|קֻפְסָה|kufsˈa|1f4e6|home
envelope|מעטפה|מַעֲטָפָה|maʔatafˈa|2709|home
newspaper|עיתון|עִתּוֹן|ʔitˈon|1f4f0|home
map|מפה|מַפָּה|mapˈa|1f5fa|home
flag|דגל|דֶּגֶל|dˈeɡel|1f3f3|home
trash-can|פח|פַּח|pˈaχ|1f5d1|home
toothbrush|מברשת שיניים|מִבְרֶשֶׁת שִׁנַּיִם|mivʁˈeʃet ʃinˈajim|1faa5|home|5
comb|מסרק|מַסְרֵק|masʁˈek|1faae|home
safety-pin|סיכת ביטחון|סִכַּת בִּטָּחוֹן|sikˈat bitaχˈon|1f9f7|home|5
needle|מחט|מַחַט|mˈaχat|1faa1|home
thread|חוט|חוּט|χˈut|1f9f5|home
yarn|צמר|צֶמֶר|tsˈemeʁ|1f9f6|home
knot|קשר|קֶשֶׁר|kˈeʃeʁ|1faa2|home
axe|גרזן|גַּרְזֶן|ɡaʁzˈen|1fa93|home
saw|מסור|מַסּוֹר|masˈoʁ|1fa9a|home
bolt|בורג|בֹּרֶג|bˈoʁeɡ|1f529|home
wrench|מפתח ברגים|מַפְתֵּחַ בְּרָגִים|maftˈeaχ bʁaɡˈim|1f527|home|5
gear|גלגל שיניים|גַּלְגַּל שִׁנַּיִם|ɡalɡˈal ʃinˈajim|2699|home|5
hook|וו|וָו|vˈav|1fa9d|home
link|חוליה|חֻלְיָה|χuljˈa|1f517|home
crutch|קב|קַב|kˈav|1fa7c|body
bandage|תחבושת|תַּחְבֹּשֶׁת|taχbˈoʃet|1fa79|body
stethoscope|מסכת|מַסְכֵּת|maskˈet|1fa7a|body
thermometer|מדחום|מַדְחֹם|madχˈom|1f321|body
medicine|תרופה|תְּרוּפָה|tʁufˈa|1f48a|body
wheelchair|כיסא גלגלים|כִּסֵּא גַּלְגַּלִּים|kisˈe ɡalɡalˈim|1f9bd|body|5
magnifying-glass|זכוכית מגדלת|זְכוּכִית מַגְדֶּלֶת|zχuχˈit maɡdˈelet|1f50d|school|5
syringe|מזרק|מַזְרֵק|mazʁˈek|1f489|body
plunger|פומפה|פּוּמְפָּה|pˈumpa|1faa0|home
folding-fan|מניפה|מְנִיפָה|menifˈa|1faad|home
abacus|חשבונייה|חֶשְׁבּוֹנִיָּה|χeʃbonijˈa|1f9ee|school|5
calculator|מחשבון|מַחְשְׁבוֹן|maχʃevˈon|1f5a9|school
printer|מדפסת|מַדְפֶּסֶת|madpˈeset|1f5a8|school
keyboard|מקלדת|מִקְלֶדֶת|miklˈedet|2328|school
computer-mouse|עכבר מחשב|עַכְבַּר מַחְשֵׁב|ʔaχbˈaʁ maχʃˈev|1f5b1|school|5
gamepad|שלט משחק|שַׁלַּט מִשְׂחָק|ʃalˈat misχˈak|1f3ae|hobbies|5
disc|תקליטור|תַּקְלִיטוֹר|taklitˈoʁ|1f4bf|hobbies
crayon|צבע שעווה|צֶבַע שַׁעֲוָה|tsˈeva ʃaʔavˈa|1f58d|school|5
scroll|מגילה|מְגִלָּה|meɡilˈa|1f4dc|school
paperclip|אטב|אֶטֶב|ʔˈetev|1f4ce|school
pushpin|נעץ|נַעַץ|nˈaʔats|1f4cc|school
calendar|לוח שנה|לוּחַ שָׁנָה|lˈuaχ ʃanˈa|1f4c5|school|5
amphora|כד|כַּד|kˈad|1f3fa|home
bouquet|זר|זֵר|zˈeʁ|1f490|nature
tulip|צבעוני|צִבְעוֹנִי|tsivʔonˈi|1f337|nature
sunflower|חמנייה|חַמָּנִיָּה|χamanijˈa|1f33b|nature
palm|דקל|דֶּקֶל|dˈekel|1f334|nature
grain|שיבולת|שִׁבֹּלֶת|ʃibˈolet|1f33e|nature|5
clover|תלתן|תִּלְתָּן|tiltˈan|2618|nature
nest|קן|קֵן|kˈen|1fab9|nature
feather|נוצה|נוֹצָה|notsˈa|1fab6|nature
volcano|הר געש|הַר גַּעַשׁ|hˈaʁ ɡˈaʔaʃ|1f30b|nature|5
desert|מדבר|מִדְבָּר|midbˈaʁ|1f3dc|nature
island|אי|אִי|ʔˈi|1f3dd|nature
`.trim();
export const EXPANDED_VOCABULARY = Object.freeze(vocabularySource.split('\n').map(line => {
  const [id, he, pointed, ipa, picture, theme, selectedStage] = line.split('|');
  form(`${he}|${pointed}|${ipa}`);
  const length = Math.max(...[he, pointed].map(value => [...value.matchAll(/[א-ת]/gu)].length));
  const level = selectedStage ? Number(selectedStage) : length <= 3 ? 1 : length === 4 ? 2 : length === 5 ? 3 : length <= 8 ? 4 : 5;
  return Object.freeze({ id, he, pointed, ipa, picture, theme, level });
}));
export const EXPANDED_READING_WORDS = Object.freeze([
  ...EXPANDED_VOCABULARY.map(({ id, he, pointed, ipa, level, theme }) => Object.freeze({ id, he, pointed, spoken: ipa, level, theme })),
  ...phrases,
]);
export const EXPANDED_READING_LEXICON = Object.freeze(lexicon);
