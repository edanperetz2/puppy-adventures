// Each fragment has its usual unpointed spelling, its reading with nikud, and
// its Modern Hebrew pronunciation. Compose the three versions in lockstep.
function sentence(id, family, scene, fragments, details = {}) {
  const join = column => fragments.map(fragment => fragment[column]).join(' ') + '.';
  return { id: 'picture-world-' + id, family, level: 10, scene,
    he: join(0), pointed: join(1), spoken: join(2), ...details };
}

const things = [
  ['balloon', 'm', 'בלון', 'בָּלוֹן', 'balˈon'],
  ['ball', 'm', 'כדור', 'כַּדּוּר', 'kadˈuʁ'],
  ['hat', 'm', 'כובע', 'כּוֹבַע', 'kˈova'],
  ['flower', 'm', 'פרח', 'פֶּרַח', 'pˈeʁaχ'],
  ['shirt', 'f', 'חולצה', 'חֻלְצָה', 'χultsˈa'],
  ['shoe', 'f', 'נעל', 'נַעַל', 'nˈaʔal'],
  ['backpack', 'm', 'תיק', 'תִּיק', 'tˈik'],
  ['gift', 'f', 'מתנה', 'מַתָּנָה', 'matanˈa'],
];
const colors = {
  red:    { m: ['אדום', 'אָדֹם', 'ʔadˈom'], f: ['אדומה', 'אֲדֻמָּה', 'ʔadumˈa'] },
  blue:   { m: ['כחול', 'כָּחֹל', 'kaχˈol'], f: ['כחולה', 'כְּחֻלָּה', 'kχulˈa'] },
  green:  { m: ['ירוק', 'יָרֹק', 'jaʁˈok'], f: ['ירוקה', 'יְרֻקָּה', 'jeʁukˈa'] },
  yellow: { m: ['צהוב', 'צָהֹב', 'tsahˈov'], f: ['צהובה', 'צְהֻבָּה', 'tsehubˈa'] },
  pink:   { m: ['ורוד', 'וָרֹד', 'vaʁˈod'], f: ['ורודה', 'וְרֻדָּה', 'vʁudˈa'] },
  purple: { m: ['סגול', 'סָגֹל', 'saɡˈol'], f: ['סגולה', 'סְגֻלָּה', 'sɡulˈa'] },
};
const furniture = {
  chair: {
    on: ['על הכיסא', 'עַל הַכִּסֵּא', 'ʔˈal hakisˈe'],
    under: ['מתחת לכיסא', 'מִתַּחַת לַכִּסֵּא', 'mitˈaχat lakisˈe'],
    near: ['ליד הכיסא', 'לְיַד הַכִּסֵּא', 'lejˈad hakisˈe'],
  },
  bench: {
    on: ['על הספסל', 'עַל הַסַּפְסָל', 'ʔˈal hasafsˈal'],
    under: ['מתחת לספסל', 'מִתַּחַת לַסַּפְסָל', 'mitˈaχat lasafsˈal'],
    near: ['ליד הספסל', 'לְיַד הַסַּפְסָל', 'lejˈad hasafsˈal'],
  },
  bed: {
    on: ['על המיטה', 'עַל הַמִּטָּה', 'ʔˈal hamitˈa'],
    under: ['מתחת למיטה', 'מִתַּחַת לַמִּטָּה', 'mitˈaχat lamitˈa'],
    near: ['ליד המיטה', 'לְיַד הַמִּטָּה', 'lejˈad hamitˈa'],
  },
};

const places = [];
for (const [object, gender, ...name] of things) {
  for (const [anchor, relations] of Object.entries(furniture)) {
    for (const [position, location] of Object.entries(relations)) {
      for (const [color, adjective] of Object.entries(colors)) {
        places.push(sentence(`${object}-${color}-${position}-${anchor}`, `world-home-${object}`,
          { kind: 'position', object, anchor, position, color }, [name, adjective[gender], location]));
      }
    }
  }
}

const walkers = [
  ['rabbit', 'jump', 'הארנב קופץ', 'הָאַרְנָב קוֹפֵץ', 'haʔaʁnˈav kofˈets'],
  ['frog', 'jump', 'הצפרדע קופצת', 'הַצְּפַרְדֵּעַ קוֹפֶצֶת', 'hatsfaʁdˈeʔa kofˈetset'],
  ['bird', 'fly', 'הציפור עפה', 'הַצִּפּוֹר עָפָה', 'hatsipˈoʁ ʔafˈa'],
  ['butterfly', 'fly', 'הפרפר עף', 'הַפַּרְפַּר עָף', 'hapaʁpˈaʁ ʔˈaf'],
  ['parrot', 'fly', 'התוכי עף', 'הַתֻּכִּי עָף', 'hatˈuki ʔˈaf'],
  ['dog', 'walk', 'הכלב הולך', 'הַכֶּלֶב הוֹלֵךְ', 'hakˈelev holˈeχ'],
  ['turtle', 'crawl', 'זוחל צב', 'זוֹחֵל צָב', 'zoχˈel tsˈav'],
  ['snail', 'crawl', 'זוחל שבלול', 'זוֹחֵל שַׁבְּלוּל', 'zoχˈel ʃablˈul'],
];
const landmarks = [
  ['tent', 'האוהל', 'הָאֹהֶל', 'haʔˈohel'],
  ['bridge', 'הגשר', 'הַגֶּשֶׁר', 'haɡˈeʃeʁ'],
  ['swing', 'הנדנדה', 'הַנַּדְנֵדָה', 'hanadnedˈa'],
  ['slide', 'המגלשה', 'הַמַּגְלֵשָׁה', 'hamaɡleʃˈa'],
  ['boat', 'הסירה', 'הַסִּירָה', 'hasiʁˈa'],
  ['cactus', 'הקקטוס', 'הַקַּקְטוּס', 'hakˈaktus'],
  ['house', 'הבית', 'הַבַּיִת', 'habˈajit'],
  ['bicycle', 'האופניים', 'הָאוֹפַנַּיִם', 'haʔofanˈajim'],
  ['sunflower', 'החמנייה', 'הַחַמָּנִיָּה', 'haχamanijˈa'],
  ['palm', 'הדקל', 'הַדֶּקֶל', 'hadˈekel'],
];
const outings = [];
const nextTo = ['ליד', 'לְיַד', 'lejˈad'];
for (const [object, action, ...actor] of walkers) {
  for (const [anchor, ...landmark] of landmarks) {
    const fragments = action === 'crawl' ? [nextTo, landmark, actor] : [actor, nextTo, landmark];
    outings.push(sentence(`outside-${object}-${anchor}`, `world-outside-${object}`,
      { kind: 'nature', object, action, anchor }, fragments));
  }
}

const actors = [
  ['hedgehog', 'm', 'הקיפוד', 'הַקִּפּוֹד', 'hakipˈod'],
  ['turtle', 'm', 'הצב', 'הַצָּב', 'hatsˈav'],
  ['elephant', 'm', 'הפיל', 'הַפִּיל', 'hapˈil'],
  ['lion', 'm', 'האריה', 'הָאַרְיֵה', 'haʔaʁjˈe'],
  ['penguin', 'm', 'הפינגווין', 'הַפִּינְגְּוִין', 'hapinɡvˈin'],
  ['sheep', 'f', 'הכבשה', 'הַכִּבְשָׂה', 'hakivsˈa'],
  ['cow', 'f', 'הפרה', 'הַפָּרָה', 'hapaʁˈa'],
  ['giraffe', 'f', 'הג׳ירפה', 'הַגִּ׳ירָפָה', 'hadʒiʁˈafa'],
];

// Restrict each interaction to things a child could plausibly use that way.
// Endings such as "on the page" and "in the sink" refer to visible scenery.
const activities = {
  draw: {
    m: ['מצייר', 'מְצַיֵּר', 'metsajˈeʁ'], f: ['מציירת', 'מְצַיֶּרֶת', 'metsajˈeʁet'],
    end: ['על הדף', 'עַל הַדַּף', 'ʔˈal hadˈaf'],
    props: [
      ['boat', 'סירה', 'סִירָה', 'siʁˈa'], ['leaf', 'עלה', 'עָלֶה', 'ʔalˈe'],
      ['house', 'בית', 'בַּיִת', 'bˈajit'], ['butterfly', 'פרפר', 'פַּרְפַּר', 'paʁpˈaʁ'],
      ['balloon', 'בלון', 'בָּלוֹן', 'balˈon'], ['sun', 'שמש', 'שֶׁמֶשׁ', 'ʃˈemeʃ'],
      ['flower', 'פרח', 'פֶּרַח', 'pˈeʁaχ'], ['moon', 'ירח', 'יָרֵחַ', 'jaʁˈeaχ'],
    ],
  },
  photo: {
    m: ['מצלם', 'מְצַלֵּם', 'metsalˈem'], f: ['מצלמת', 'מְצַלֶּמֶת', 'metsalˈemet'],
    props: [
      ['frog', 'צפרדע', 'צְפַרְדֵּעַ', 'tsfaʁdˈeʔa'], ['bird', 'ציפור', 'צִפּוֹר', 'tsipˈoʁ'],
      ['kite', 'עפיפון', 'עֲפִיפוֹן', 'ʔafifˈon'], ['sunflower', 'חמנייה', 'חַמָּנִיָּה', 'χamanijˈa'],
      ['flower', 'פרח', 'פֶּרַח', 'pˈeʁaχ'], ['ladybug', 'חיפושית', 'חִפּוּשִׁית', 'χipuʃˈit'],
    ],
  },
  wrap: {
    m: ['עוטף', 'עוֹטֵף', 'ʔotˈef'], f: ['עוטפת', 'עוֹטֶפֶת', 'ʔotˈefet'],
    end: ['בנייר', 'בִּנְיָר', 'binjˈaʁ'],
    props: [
      ['book', 'ספר', 'סֵפֶר', 'sˈefeʁ'], ['hat', 'כובע', 'כּוֹבַע', 'kˈova'],
      ['drum', 'תוף', 'תֹּף', 'tˈof'], ['ball', 'כדור', 'כַּדּוּר', 'kadˈuʁ'],
      ['robot', 'רובוט', 'רוֹבּוֹט', 'ʁˈobot'], ['flute', 'חליל', 'חָלִיל', 'χalˈil'],
    ],
  },
  pack: {
    m: ['אורז', 'אוֹרֵז', 'ʔoʁˈez'], f: ['אורזת', 'אוֹרֶזֶת', 'ʔoʁˈezet'],
    end: ['לטיול', 'לְטִיּוּל', 'letijˈul'],
    props: [
      ['apple', 'תפוח', 'תַּפּוּחַ', 'tapˈuaχ'], ['scarf', 'צעיף', 'צָעִיף', 'tsaʔˈif'],
      ['pencil', 'עיפרון', 'עִפָּרוֹן', 'ʔipaʁˈon'], ['map', 'מפה', 'מַפָּה', 'mapˈa'],
      ['cookie', 'עוגייה', 'עוּגִיָּה', 'ʔuɡijˈa'], ['flashlight', 'פנס', 'פָּנָס', 'panˈas'],
    ],
  },
  wash: {
    m: ['שוטף', 'שׁוֹטֵף', 'ʃotˈef'], f: ['שוטפת', 'שׁוֹטֶפֶת', 'ʃotˈefet'],
    end: ['בכיור', 'בַּכִּיּוֹר', 'bakijˈoʁ'],
    props: [
      ['carrot', 'גזר', 'גֶּזֶר', 'ɡˈezeʁ'], ['pear', 'אגס', 'אַגָּס', 'ʔaɡˈas'],
      ['tomato', 'עגבנייה', 'עַגְבָנִיָּה', 'ʔaɡvanijˈa'], ['cucumber', 'מלפפון', 'מְלָפְפוֹן', 'melafefˈon'],
      ['pepper', 'פלפל', 'פִּלְפֵּל', 'pilpˈel'],
    ],
  },
  music: {
    m: ['מנגן', 'מְנַגֵּן', 'menaɡˈen'], f: ['מנגנת', 'מְנַגֶּנֶת', 'menaɡˈenet'],
    props: [
      ['guitar', 'בגיטרה', 'בְּגִיטָרָה', 'beɡitˈaʁa'], ['flute', 'בחליל', 'בֶּחָלִיל', 'beχalˈil'],
      ['trumpet', 'בחצוצרה', 'בַּחֲצוֹצְרָה', 'baχatsotsʁˈa'], ['drum', 'בתוף', 'בַּתֹּף', 'batˈof'],
    ],
  },
  dream: {
    m: ['חולם על', 'חוֹלֵם עַל', 'χolˈem ʔˈal'], f: ['חולמת על', 'חוֹלֶמֶת עַל', 'χolˈemet ʔˈal'],
    props: [
      ['cake', 'עוגה', 'עוּגָה', 'ʔuɡˈa'], ['moon', 'הירח', 'הַיָּרֵחַ', 'hajaʁˈeaχ'],
      ['boat', 'סירה', 'סִירָה', 'siʁˈa'], ['ball', 'כדור', 'כַּדּוּר', 'kadˈuʁ'],
    ],
  },
};
const moments = [];
for (const [object, gender, ...name] of actors) {
  for (const [action, activity] of Object.entries(activities)) {
    const verb = activity[gender];
    for (const [prop, ...item] of activity.props) {
      const parts = [name, verb, item];
      if (activity.end) parts.push(activity.end);
      const start = 1 + verb[0].split(' ').length;
      moments.push(sentence(`moment-${object}-${action}-${prop}`, `world-moment-${object}`,
        { kind: 'moment', object, action, prop }, parts, { propRange: [start, start + 1], actionIndex: 1 }));
    }
  }
}

export const PICTURE_WORLD_STORIES = [...places, ...outings, ...moments];
