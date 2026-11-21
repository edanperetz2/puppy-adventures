// Each sentence works on its own. Pictures in the same family show the same
// character, so finding the character alone cannot answer the question.
const actors = {
  dog: ['לולי', 'לוּלִי', 'lˈuli'],
  fox: ['השועל', 'הַשּׁוּעָל', 'haʃuʔˈal'],
  bird: ['הציפור', 'הַצִּפּוֹר', 'hatsipˈoʁ'],
  rabbit: ['הארנב', 'הָאַרְנָב', 'haʔaʁnˈav'],
  bear: ['הדוב', 'הַדֹּב', 'hadˈov'],
  monkey: ['הקוף', 'הַקּוֹף', 'hakˈof'],
  cat: ['החתלתול', 'הַחֲתַלְתּוּל', 'haχataltˈul'],
  mouse: ['העכבר', 'הָעַכְבָּר', 'haʔaχbˈaʁ'],
};

// Store the conventional unpointed spelling as well as nikud and spoken IPA.
const moments = {
  dog: [
    ['draw', 'boat', 'מציירת סירה', 'מְצַיֶּרֶת סִירָה', 'metsajˈeʁet siʁˈa'],
    ['draw', 'rainbow', 'מציירת קשת בענן', 'מְצַיֶּרֶת קֶשֶׁת בֶּעָנָן', 'metsajˈeʁet kˈeʃet beʔanˈan', [2, 4]],
    ['photo', 'butterfly', 'מצלמת פרפר', 'מְצַלֶּמֶת פַּרְפַּר', 'metsalˈemet paʁpˈaʁ'],
    ['wrap', 'book', 'עוטפת את הספר בנייר', 'עוֹטֶפֶת אֶת הַסֵּפֶר בִּנְיָר', 'ʔotˈefet ʔˈet hasˈefeʁ binjˈaʁ', [3, 4]],
    ['pack', 'hat', 'אורזת את הכובע לטיול', 'אוֹרֶזֶת אֶת הַכּוֹבַע לְטִיּוּל', 'ʔoʁˈezet ʔˈet hakˈova letijˈul', [3, 4]],
    ['music', 'guitar', 'מנגנת בגיטרה', 'מְנַגֶּנֶת בְּגִיטָרָה', 'menaɡˈenet beɡitˈaʁa'],
  ],
  fox: [
    ['pack', 'map', 'אורז מפה לטיול', 'אוֹרֵז מַפָּה לְטִיּוּל', 'ʔoʁˈez mapˈa letijˈul'],
    ['pack', 'apple', 'אורז תפוח לדרך', 'אוֹרֵז תַּפּוּחַ לַדֶּרֶךְ', 'ʔoʁˈez tapˈuaχ ladˈeʁeχ'],
    ['photo', 'mountain', 'מצלם הר גבוה', 'מְצַלֵּם הַר גָּבוֹהַּ', 'metsalˈem hˈaʁ ɡavˈoa', [2, 4]],
    ['kite', 'kite', 'מעיף עפיפון ברוח', 'מֵעִיף עֲפִיפוֹן בָּרוּחַ', 'meʔˈif ʔafifˈon baʁˈuaχ'],
    ['draw', 'mountain', 'מצייר הר גבוה', 'מְצַיֵּר הַר גָּבוֹהַּ', 'metsajˈeʁ hˈaʁ ɡavˈoa', [2, 4]],
    ['carry', 'flashlight', 'סוחב פנס בלילה', 'סוֹחֵב פָּנָס בַּלַּיְלָה', 'soχˈev panˈas balˈajla'],
  ],
  bird: [
    ['carry', 'leaf', 'מחזיקה עלה במקור', 'מַחֲזִיקָה עָלֶה בַּמַּקּוֹר', 'maχzikˈa ʔalˈe bamakˈoʁ'],
    ['carry', 'feather', 'מחזיקה נוצה במקור', 'מַחֲזִיקָה נוֹצָה בַּמַּקּוֹר', 'maχzikˈa notsˈa bamakˈoʁ'],
    ['hide', 'flower', 'מציצה מאחורי פרח', 'מְצִיצָה מֵאֲחוֹרֵי פֶּרַח', 'metsitsˈa meʔaχoʁˈej pˈeʁaχ', [3, 4]],
    ['peck', 'apple', 'מנקרת תפוח', 'מְנַקֶּרֶת תַּפּוּחַ', 'menakˈeʁet tapˈuaχ'],
    ['peck', 'strawberry', 'מנקרת את התות', 'מְנַקֶּרֶת אֶת הַתּוּת', 'menakˈeʁet ʔˈet hatˈut', [3, 4]],
    ['rest', 'rock', 'נחה על סלע', 'נָחָה עַל סֶלַע', 'nˈaχa ʔˈal sˈela', [3, 4]],
  ],
  rabbit: [
    ['wash', 'carrot', 'שוטף גזר במים', 'שׁוֹטֵף גֶּזֶר בְּמַיִם', 'ʃotˈef ɡˈezeʁ bemˈajim'],
    ['wrap', 'flower', 'עוטף פרח בנייר', 'עוֹטֵף פֶּרַח בִּנְיָר', 'ʔotˈef pˈeʁaχ binjˈaʁ'],
    ['pack', 'carrot', 'אורז גזר לדרך', 'אוֹרֵז גֶּזֶר לַדֶּרֶךְ', 'ʔoʁˈez ɡˈezeʁ ladˈeʁeχ'],
    ['hide', 'basket', 'מציץ מאחורי סל', 'מֵצִיץ מֵאֲחוֹרֵי סַל', 'metsˈits meʔaχoʁˈej sˈal', [3, 4]],
    ['carry', 'basket', 'סוחב את הסל', 'סוֹחֵב אֶת הַסַּל', 'soχˈev ʔˈet hasˈal', [3, 4]],
    ['dream', 'carrot', 'חולם על גזר', 'חוֹלֵם עַל גֶּזֶר', 'χolˈem ʔˈal ɡˈezeʁ', [3, 4]],
  ],
  bear: [
    ['wash', 'pear', 'שוטף אגס בכיור', 'שׁוֹטֵף אַגָּס בַּכִּיּוֹר', 'ʃotˈef ʔaɡˈas bakijˈoʁ'],
    ['wash', 'apple', 'שוטף תפוח בכיור', 'שׁוֹטֵף תַּפּוּחַ בַּכִּיּוֹר', 'ʃotˈef tapˈuaχ bakijˈoʁ'],
    ['wrap', 'honey', 'עוטף צנצנת דבש', 'עוֹטֵף צִנְצֶנֶת דְּבַשׁ', 'ʔotˈef tsintsˈenet dvˈaʃ', [2, 4]],
    ['carry', 'cake', 'סוחב את העוגה', 'סוֹחֵב אֶת הָעוּגָה', 'soχˈev ʔˈet haʔuɡˈa', [3, 4]],
    ['draw', 'apple', 'מצייר תפוח על הדף', 'מְצַיֵּר תַּפּוּחַ עַל הַדַּף', 'metsajˈeʁ tapˈuaχ ʔˈal hadˈaf'],
    ['dream', 'honey', 'חולם על דבש', 'חוֹלֵם עַל דְּבַשׁ', 'χolˈem ʔˈal dvˈaʃ', [3, 4]],
  ],
  monkey: [
    ['music', 'drum', 'מתופף בתוף', 'מְתוֹפֵף בְּתֹף', 'metofˈef betˈof'],
    ['music', 'flute', 'מנגן בחליל', 'מְנַגֵּן בְּחָלִיל', 'menaɡˈen beχalˈil'],
    ['music', 'guitar', 'מנגן בגיטרה', 'מְנַגֵּן בְּגִיטָרָה', 'menaɡˈen beɡitˈaʁa'],
    ['photo', 'guitar', 'מצלם את הגיטרה', 'מְצַלֵּם אֶת הַגִּיטָרָה', 'metsalˈem ʔˈet haɡitˈaʁa', [3, 4]],
    ['wrap', 'drum', 'עוטף תוף בנייר', 'עוֹטֵף תֹּף בִּנְיָר', 'ʔotˈef tˈof binjˈaʁ'],
    ['draw', 'flute', 'מצייר חליל על הדף', 'מְצַיֵּר חָלִיל עַל הַדַּף', 'metsajˈeʁ χalˈil ʔˈal hadˈaf'],
  ],
  cat: [
    ['draw', 'shell', 'מצייר צדף', 'מְצַיֵּר צֶדֶף', 'metsajˈeʁ tsˈedef'],
    ['find', 'shell', 'מוצא צדף בחול', 'מוֹצֵא צֶדֶף בַּחוֹל', 'motsˈe tsˈedef baχˈol'],
    ['photo', 'dolphin', 'מצלם דולפין בים', 'מְצַלֵּם דּוֹלְפִין בַּיָּם', 'metsalˈem dolfˈin bajˈam'],
    ['kite', 'kite', 'מעיף עפיפון בחוף', 'מֵעִיף עֲפִיפוֹן בַּחוֹף', 'meʔˈif ʔafifˈon baχˈof'],
    ['pack', 'bucket', 'אורז את הדלי', 'אוֹרֵז אֶת הַדְּלִי', 'ʔoʁˈez ʔˈet hadlˈi', [3, 4]],
    ['dream', 'boat', 'חולם על סירה', 'חוֹלֵם עַל סִירָה', 'χolˈem ʔˈal siʁˈa', [3, 4]],
  ],
  mouse: [
    ['wrap', 'drum', 'עוטף את התוף', 'עוֹטֵף אֶת הַתֹּף', 'ʔotˈef ʔˈet hatˈof', [3, 4]],
    ['draw', 'cake', 'מצייר עוגת יום הולדת', 'מְצַיֵּר עוּגַת יוֹם הֻלֶּדֶת', 'metsajˈeʁ ʔuɡˈat jˈom hulˈedet', [2, 5]],
    ['music', 'trumpet', 'מרים חצוצרה. הוא מנגן', 'מֵרִים חֲצוֹצְרָה. הוּא מְנַגֵּן', 'meʁˈim χatsotsʁˈa. hˈu menaɡˈen', [2, 3], 4],
    ['carry', 'cheese', 'סוחב חתיכת גבינה', 'סוֹחֵב חֲתִיכַת גְּבִינָה', 'soχˈev χatiχˈat ɡvinˈa', [2, 4]],
    ['hide', 'cheese', 'מציץ מאחורי הגבינה', 'מֵצִיץ מֵאֲחוֹרֵי הַגְּבִינָה', 'metsˈits meʔaχoʁˈej haɡvinˈa', [3, 4]],
    ['pack', 'cherries', 'אורז דובדבנים למסיבה', 'אוֹרֵז דֻּבְדְּבָנִים לַמְּסִבָּה', 'ʔoʁˈez duvdevanˈim lamesibˈa'],
  ],
};

export const STORY_MOMENTS = Object.entries(moments).flatMap(([object, scenes]) => {
  const [name, pointedName, spokenName] = actors[object];
  return scenes.map(([action, prop, text, pointed, speech, propRange = [2, 3], actionIndex = 1]) => ({
    id: `moment-${object}-${action}-${prop}`, level: 10, family: `moment-${object}`,
    he: `${name} ${text}.`, pointed: `${pointedName} ${pointed}.`, spoken: `${spokenName} ${speech}.`,
    scene: { kind: 'moment', object, action, prop }, propRange, actionIndex,
  }));
});
