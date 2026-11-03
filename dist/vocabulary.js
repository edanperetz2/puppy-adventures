// Each new reading word keeps its pointed spelling, explicit spoken sounds and
// picture identity together. No device has to guess a Hebrew pronunciation.
// Fields: id | ordinary spelling | pointed spelling | IPA | picture | theme | optional stage.
const source = `
lion|אריה|אַרְיֵה|ʔaʁjˈe|1f981|animals
elephant|פיל|פִּיל|pˈil|1f418|animals
giraffe|ג׳ירפה|גִּ׳ירָפָה|dʒiʁˈafa|1f992|animals
monkey|קוף|קוֹף|kˈof|1f412|animals
mouse|עכבר|עַכְבָּר|ʔaχbˈaʁ|1f401|animals
fox|שועל|שׁוּעָל|ʃuʔˈal|1f98a|animals
kangaroo|קנגורו|קֶנְגּוּרוּ|kenɡˈuʁu|1f998|animals|5
koala|קואלה|קוֹאָלָה|koʔˈala|1f428|animals
panda|פנדה|פַּנְדָּה|pˈanda|1f43c|animals
tiger|טיגריס|טִיגְרִיס|tˈiɡʁis|1f405|animals|5
leopard|נמר|נָמֵר|namˈeʁ|1f406|animals
cow|פרה|פָּרָה|paʁˈa|1f404|animals
pig|חזיר|חֲזִיר|χazˈiʁ|1f416|animals
sheep|כבשה|כִּבְשָׂה|kivsˈa|1f411|animals
goat|עז|עֵז|ʔˈez|1f410|animals
camel|גמל|גָּמָל|ɡamˈal|1f42a|animals
zebra|זברה|זֶבְּרָה|zˈebʁa|1f993|animals
deer|אייל|אַיָּל|ʔajˈal|1f98c|animals
owl|ינשוף|יַנְשׁוּף|janʃˈuf|1f989|animals
penguin|פינגווין|פִּינְגְּוִין|pinɡvˈin|1f427|animals|5
parrot|תוכי|תֻּכִּי|tˈuki|1f99c|animals
flamingo|פלמינגו|פְלָמִינְגּוֹ|flamˈinɡo|1f9a9|animals|5
eagle|נשר|נֶשֶׁר|nˈeʃeʁ|1f985|animals
peacock|טווס|טַוָּס|tavˈas|1f99a|animals
swan|ברבור|בַּרְבּוּר|baʁbˈuʁ|1f9a2|animals
rooster|תרנגול|תַּרְנְגוֹל|taʁneɡˈol|1f413|animals
chick|אפרוח|אֶפְרוֹחַ|ʔefʁˈoaχ|1f425|animals
bat|עטלף|עֲטַלֵּף|ʔatalˈef|1f987|animals
turtle|צב|צָב|tsˈav|1f422|animals
crocodile|תנין|תַּנִּין|tanˈin|1f40a|animals
frog|צפרדע|צְפַרְדֵּעַ|tsfaʁdˈea|1f438|animals|5
snake|נחש|נָחָשׁ|naχˈaʃ|1f40d|animals
lizard|לטאה|לְטָאָה|letaʔˈa|1f98e|animals
whale|לווייתן|לִוְיָתָן|livjatˈan|1f40b|animals|5
dolphin|דולפין|דּוֹלְפִין|dolfˈin|1f42c|animals
shark|כריש|כָּרִישׁ|kaʁˈiʃ|1f988|animals
octopus|תמנון|תְּמָנוּן|tmanˈun|1f419|animals
crab|סרטן|סַרְטָן|saʁtˈan|1f980|animals
bee|דבורה|דְּבוֹרָה|dvoʁˈa|1f41d|animals
ant|נמלה|נְמָלָה|nemalˈa|1f41c|animals
spider|עכביש|עַכָּבִישׁ|ʔakavˈiʃ|1f577|animals
worm|תולעת|תּוֹלַעַת|tolˈaʔat|1fab1|animals
mosquito|יתוש|יַתּוּשׁ|jatˈuʃ|1f99f|animals
fly|זבוב|זְבוּב|zvˈuv|1fab0|animals
bird|ציפור|צִפּוֹר|tsipˈoʁ|original|animals
banana|בננה|בָּנָנָה|banˈana|1f34c|food
pear|אגס|אַגָּס|ʔaɡˈas|1f350|food
peach|אפרסק|אֲפַרְסֵק|ʔafaʁsˈek|1f351|food
strawberry|תות|תּוּת|tˈut|1f353|food
cherries|דובדבנים|דֻּבְדְּבָנִים|duvdevanˈim|1f352|food|5
orange-fruit|תפוז|תַּפּוּז|tapˈuz|1f34a|food
lemon|לימון|לִימוֹן|limˈon|1f34b|food
mango|מנגו|מַנְגּוֹ|mˈanɡo|1f96d|food
kiwi|קיווי|קִיוִי|kˈivi|1f95d|food
melon|מלון|מֵלוֹן|melˈon|1f348|food
blueberries|אוכמניות|אוּכְמָנִיּוֹת|ʔuχmanijˈot|1fad0|food|5
coconut|קוקוס|קוֹקוֹס|kˈokos|1f965|food
avocado|אבוקדו|אָבוֹקָדוֹ|ʔavokˈado|1f951|food
olive|זית|זַיִת|zˈajit|1fad2|food
tomato|עגבנייה|עַגְבָנִיָּה|ʔaɡvanijˈa|1f345|food
carrot|גזר|גֶּזֶר|ɡˈezeʁ|1f955|food
corn|תירס|תִּירָס|tiʁˈas|1f33d|food
pepper|פלפל|פִּלְפֵּל|pilpˈel|1fad1|food
eggplant|חציל|חֲצִיל|χatsˈil|1f346|food
onion|בצל|בָּצָל|batsˈal|1f9c5|food
garlic|שום|שׁוּם|ʃˈum|1f9c4|food
broccoli|ברוקולי|בְּרוֹקוֹלִי|bʁˈokoli|1f966|food|5
lettuce|חסה|חַסָּה|χasˈa|1f96c|food
mushroom|פטרייה|פִּטְרִיָּה|pitʁijˈa|1f344|food
bread|לחם|לֶחֶם|lˈeχem|1f35e|food
pretzel|כעך|כַּעַךְ|kˈaʔaχ|1f968|food
croissant|קרואסון|קְרוּאָסוֹן|kʁuasˈon|1f950|food|5
egg|ביצה|בֵּיצָה|betsˈa|1f95a|food
cheese|גבינה|גְּבִינָה|ɡvinˈa|1f9c0|food
milk|חלב|חָלָב|χalˈav|custom|food
cookie|עוגייה|עוּגִיָּה|ʔuɡijˈa|1f36a|food
cake|עוגה|עוּגָה|ʔuɡˈa|1f382|food
candy|סוכרייה|סֻכָּרִיָּה|sukaʁijˈa|1f36c|food
ice-cream|גלידה|גְּלִידָה|ɡlidˈa|1f368|food
popsicle|ארטיק|אַרְטִיק|ʔaʁtˈik|custom|food
pizza|פיצה|פִּיצָה|pˈitsa|1f355|food
burger|המבורגר|הַמְבּוּרְגֶּר|hambˈuʁɡeʁ|1f354|food|5
fries|טוגנים|טוּגָנִים|tuɡanˈim|1f35f|food
hotdog|נקניקייה|נַקְנִיקִיָּה|naknikijˈa|1f32d|food|5
spaghetti|ספגטי|סְפַּגֶּטִי|spaɡˈeti|1f35d|food|5
rice|אורז|אֹרֶז|ʔˈoʁez|1f35a|food
soup|מרק|מָרָק|maʁˈak|1f372|food
salad|סלט|סָלָט|salˈat|1f957|food
salt|מלח|מֶלַח|mˈelaχ|1f9c2|food
honey|דבש|דְּבַשׁ|dvˈaʃ|1f36f|food
door|דלת|דֶּלֶת|dˈelet|1f6aa|home
bed|מיטה|מִטָּה|mitˈa|1f6cf|home
chair|כיסא|כִּסֵּא|kisˈe|1fa91|home
couch|ספה|סַפָּה|sapˈa|custom|home
mirror|מראה|מַרְאָה|maʁʔˈa|1fa9e|home
bathtub|אמבטיה|אַמְבַּטְיָה|ʔambˈatja|1f6c1|home|5
toilet|אסלה|אַסְלָה|ʔaslˈa|1f6bd|home
soap|סבון|סַבּוֹן|sabˈon|1f9fc|home
sponge|ספוג|סְפוֹג|sfˈoɡ|1f9fd|home
broom|מטאטא|מַטְאֲטֵא|matʔatˈe|1f9f9|home
bucket|דלי|דְּלִי|dlˈi|1faa3|home
basket|סל|סַל|sˈal|1f9fa|home
mug|ספל|סֵפֶל|sˈefel|1f375|home
plate|צלחת|צַלַּחַת|tsalˈaχat|custom|home
bowl|קערה|קְעָרָה|keʔaʁˈa|custom|home
spoon|כף|כַּף|kˈaf|1f944|home
fork|מזלג|מַזְלֵג|mazlˈeɡ|custom|home
knife|סכין|סַכִּין|sakˈin|1f52a|home
teapot|קומקום|קוּמְקוּם|kumkˈum|1fad6|home
pot|סיר|סִיר|sˈiʁ|custom|home
pan|מחבת|מַחֲבַת|maχavˈat|custom|home
key|מפתח|מַפְתֵּחַ|maftˈeaχ|1f511|home
lock|מנעול|מַנְעוּל|manʔˈul|1f512|home
bell|פעמון|פַּעֲמוֹן|paʔamˈon|1f514|home
candle|נר|נֵר|nˈeʁ|1f56f|home
lamp|מנורה|מְנוֹרָה|menoʁˈa|custom|home
flashlight|פנס|פָּנָס|panˈas|1f526|home
battery|סוללה|סוֹלְלָה|solelˈa|1f50b|home
plug|תקע|תֶּקַע|tˈeka|1f50c|home
magnet|מגנט|מַגְנֵט|maɡnˈet|1f9f2|home
ladder|סולם|סֻלָּם|sulˈam|1fa9c|home
hammer|פטיש|פַּטִּישׁ|patˈiʃ|1f528|home
screwdriver|מברג|מַבְרֵג|mavʁˈeɡ|1fa9b|home
refrigerator|מקרר|מְקָרֵר|mekaʁˈeʁ|custom|home
clock|שעון|שָׁעוֹן|ʃaʔˈon|original|home
tent|אוהל|אֹהֶל|ʔˈohel|26fa|home
brick|לבנה|לְבֵנָה|levenˈa|1f9f1|home
moon|ירח|יָרֵחַ|jaʁˈeaχ|1f319|nature
star|כוכב|כּוֹכָב|koχˈav|original|nature
cloud|ענן|עָנָן|ʔanˈan|2601|nature
rain|גשם|גֶּשֶׁם|ɡˈeʃem|1f327|nature
snow|שלג|שֶׁלֶג|ʃˈeleɡ|2744|nature
rainbow|קשת|קֶשֶׁת|kˈeʃet|1f308|nature
lightning|ברק|בָּרָק|baʁˈak|26a1|nature
wind|רוח|רוּחַ|ʁˈuaχ|1f32c|nature
fire|אש|אֵשׁ|ʔˈeʃ|1f525|nature
mountain|הר|הַר|hˈaʁ|26f0|nature
rock|סלע|סֶלַע|sˈela|1faa8|nature
leaf|עלה|עָלֶה|ʔalˈe|1f343|nature
seedling|שתיל|שְׁתִיל|ʃtˈil|1f331|nature
cactus|קקטוס|קַקְטוּס|kˈaktus|1f335|nature
shell|צדף|צֶדֶף|tsˈedef|1f41a|nature
shirt|חולצה|חֻלְצָה|χultsˈa|1f455|clothing
pants|מכנסיים|מִכְנָסַיִם|miχnasˈajim|1f456|clothing
dress|שמלה|שִׂמְלָה|simlˈa|1f457|clothing
skirt|חצאית|חֲצָאִית|χatsaʔˈit|custom|clothing
coat|מעיל|מְעִיל|meʔˈil|1f9e5|clothing
scarf|צעיף|צָעִיף|tsaʔˈif|1f9e3|clothing
gloves|כפפות|כְּפָפוֹת|kfafˈot|1f9e4|clothing
socks|גרביים|גַּרְבַּיִם|ɡaʁbˈajim|1f9e6|clothing
shoe|נעל|נַעַל|nˈaʔal|1f45f|clothing
boot|מגף|מַגָּף|maɡˈaf|1f462|clothing
sandal|סנדל|סַנְדָּל|sandˈal|1f461|clothing
hat|כובע|כּוֹבַע|kˈova|1f9e2|clothing
crown|כתר|כֶּתֶר|kˈeteʁ|1f451|clothing
helmet|קסדה|קַסְדָּה|kasdˈa|custom|clothing
ring|טבעת|טַבַּעַת|tabˈaʔat|1f48d|clothing
necklace|שרשרת|שַׁרְשֶׁרֶת|ʃaʁʃˈeʁet|custom|clothing
ribbon|סרט|סֶרֶט|sˈeʁet|1f380|clothing
handbag|תיק|תִּיק|tˈik|1f45c|clothing
wallet|ארנק|אַרְנָק|ʔaʁnˈak|custom|clothing
hand|יד|יָד|jˈad|270b|body
foot|רגל|רֶגֶל|ʁˈeɡel|1f9b6|body
eye|עין|עַיִן|ʔˈajin|1f441|body
ear|אוזן|אֹזֶן|ʔˈozen|1f442|body
nose|אף|אַף|ʔˈaf|1f443|body
mouth|פה|פֶּה|pˈe|1f444|body
tooth|שן|שֵׁן|ʃˈen|1f9b7|body
tongue|לשון|לָשׁוֹן|laʃˈon|1f445|body
bone|עצם|עֶצֶם|ʔˈetsem|1f9b4|body
brain|מוח|מֹחַ|mˈoaχ|1f9e0|body
heart|לב|לֵב|lˈev|original|body
muscle|שריר|שְׁרִיר|ʃʁˈiʁ|1f4aa|body
book|ספר|סֵפֶר|sˈefeʁ|1f4d6|school
notebook|מחברת|מַחְבֶּרֶת|maχbˈeʁet|1f4d3|school
pencil|עיפרון|עִפָּרוֹן|ʔipaʁˈon|270f|school
pen|עט|עֵט|ʔˈet|1f58a|school
paintbrush|מכחול|מִכְחוֹל|miχˈol|1f58c|school
ruler|סרגל|סַרְגֵּל|saʁɡˈel|1f4cf|school
triangle|משולש|מְשֻׁלָּשׁ|meʃulˈaʃ|custom|school
square|ריבוע|רִבּוּעַ|ʁibˈua|custom|school
circle|עיגול|עִגּוּל|ʔiɡˈul|custom|school
diamond|מעוין|מְעֻיָּן|meʔujˈan|custom|school
eraser|מחק|מַחַק|mˈaχak|custom|school
glue|דבק|דֶּבֶק|dˈevek|custom|school
violin|כינור|כִּנּוֹר|kinˈoʁ|1f3bb|hobbies
drum|תוף|תֹּף|tˈof|1f941|hobbies
piano|פסנתר|פְּסַנְתֵּר|psantˈeʁ|1f3b9|hobbies
flute|חליל|חָלִיל|χalˈil|1fa88|hobbies
saxophone|סקסופון|סַקְסוֹפוֹן|saksofˈon|1f3b7|hobbies|5
accordion|אקורדיון|אַקוֹרְדְּיוֹן|ʔakoʁdjˈon|1fa97|hobbies|5
microphone|מיקרופון|מִיקְרוֹפוֹן|mikʁofˈon|1f3a4|hobbies|5
headphones|אוזניות|אָזְנִיּוֹת|ʔoznijˈot|1f3a7|hobbies
camera|מצלמה|מַצְלֵמָה|matslemˈa|1f4f7|hobbies
computer|מחשב|מַחְשֵׁב|maχʃˈev|1f4bb|hobbies
phone|טלפון|טֵלֵפוֹן|tˈelefon|260e|hobbies
television|טלוויזיה|טֵלֵוִיזְיָה|televˈizja|1f4fa|hobbies|5
radio|רדיו|רַדְיוֹ|ʁˈadjo|1f4fb|hobbies
balloon|בלון|בַּלּוֹן|balˈon|1f388|hobbies
kite|עפיפון|עֲפִיפוֹן|ʔafifˈon|1fa81|hobbies
puzzle|פאזל|פָּאזֶל|pˈazel|1f9e9|hobbies
robot|רובוט|רוֹבּוֹט|ʁˈobot|1f916|hobbies
yoyo|יויו|יוֹיוֹ|jˈojo|1fa80|hobbies
cube|קובייה|קֻבִּיָּה|kubijˈa|1f3b2|hobbies|5
gift|מתנה|מַתָּנָה|matanˈa|1f381|hobbies
trophy|גביע|גָּבִיעַ|ɡavˈia|1f3c6|hobbies
medal|מדליה|מֵדַלְיָה|medˈalja|1f3c5|hobbies
mask|מסכה|מַסֵּכָה|maseχˈa|custom|hobbies
train|רכבת|רַכֶּבֶת|ʁakˈevet|1f682|transport
ship|אונייה|אֳנִיָּה|ʔonijˈa|1f6a2|transport|5
boat|סירה|סִירָה|siʁˈa|1f6f6|transport
truck|משאית|מַשָּׂאִית|masaʔˈit|1f69a|transport
motorcycle|אופנוע|אוֹפַנּוֹעַ|ʔofanˈoa|1f3cd|transport
scooter|קורקינט|קוֹרְקִינֵט|koʁkinˈet|1f6f4|transport|5
spaceship|חללית|חֲלָלִית|χalalˈit|1f680|transport
satellite|לוויין|לַוְיָן|lavjˈan|1f6f0|transport|5
submarine|צוללת|צוֹלֶלֶת|tsolelˈet|custom|transport
police-car|ניידת|נַיֶּדֶת|najˈedet|1f693|transport
taxi|מונית|מוֹנִית|monˈit|1f695|transport
road-sign|תמרור|תַּמְרוּר|tamʁˈuʁ|1f6d1|transport
bridge|גשר|גֶּשֶׁר|ɡˈeʃeʁ|1f309|places
palace|ארמון|אַרְמוֹן|ʔaʁmˈon|1f3f0|places
suitcase|מזוודה|מִזְוָדָה|mizvadˈa|1f9f3|transport
ticket|כרטיס|כַּרְטִיס|kaʁtˈis|1f3ab|transport
anchor|עוגן|עֹגֶן|ʔˈoɡen|2693|transport
wheel|גלגל|גַּלְגַּל|ɡalɡˈal|1f6de|transport
parachute|מצנח|מַצְנֵחַ|matsnˈeaχ|1fa82|transport
compass|מצפן|מַצְפֵּן|matspˈen|1f9ed|transport
`.trim();

export const VOCABULARY = Object.freeze(source.split('\n').map(line => {
  const [id, he, pointed, ipa, picture, theme, selectedStage] = line.split('|');
  const length = Math.max(...[he, pointed].map(text => [...text.matchAll(/[א-ת]/gu)].length));
  const level = selectedStage ? Number(selectedStage) : length <= 3 ? 1 : length === 4 ? 2 : length === 5 ? 3 : length <= 8 ? 4 : 5;
  return Object.freeze({ id, he, pointed, ipa, picture, theme, level });
}));

// Audio review found these isolated words lose sounds. A brief, grammatical
// carrier keeps Ava's complete pronunciation; the reading prompt stays unchanged.
const contextualWords = new Set(['panda', 'banana', 'strawberry', 'pretzel', 'shoe', 'drum', 'yoyo','parrot']);
export const VOCABULARY_WORDS = Object.freeze(VOCABULARY.map(({ id, he, pointed, level, theme }) => Object.freeze({ id, he, pointed, level, theme, ...(contextualWords.has(id) ? { spoken: `הַמִּלָּה הִיא ${pointed}.` } : {}) })));
export const VOCABULARY_LEXICON = Object.freeze(Object.fromEntries(VOCABULARY.map(word => [word.pointed.normalize('NFC'), word.ipa])));

// Broader nouns could otherwise have more than one valid picture among choices.
const overlappingPictures = [
  ['bear', 'panda'], ['hat', 'helmet'], ['handbag', 'backpack', 'suitcase'],
  ['shoe', 'boot', 'sandal'], ['car', 'taxi', 'police-car'],
  ['ice-cream', 'popsicle'], ['book', 'notebook'], ['lamp', 'flashlight', 'candle'],
  ['ship', 'boat'], ['toy', 'toys', 'robot', 'cube', 'yoyo', 'puzzle'],
  ['fish', 'shark'], ['truck', 'firetruck'], ['tree', 'seedling'],
  ['hen', 'rooster'], ['mouth', 'tongue'], ['hand', 'muscle'],
  ['cloud', 'rain', 'wind'], ['wind', 'leaf'], ['bowl', 'soup', 'rice', 'salad', 'ice-cream'],
  ['pig','boar'], ['flower','rose','tulip','sunflower','bouquet'], ['tree','palm'],
  ['bread','baguette','sandwich'], ['mug','cup','milk','coffee','juice'],
  ['mouse','hamster','computer-mouse'], ['chair','wheelchair'], ['key','wrench'],
  ['wheel','gear'], ['mountain','volcano'], ['sea','island'], ['box','gift'],
  ['thread','yarn','knot'], ['meat','chicken-leg'], ['amphora','vase'],
  ['crown','king','queen'], ['book','scroll','newspaper'], ['shell','oyster'],
  ['necklace','link'], ['cube','ice'],
];
const birdPictures = ['duck', 'hen', 'rooster', 'chick', 'parrot', 'owl', 'eagle', 'peacock', 'swan', 'flamingo', 'penguin','goose','turkey'];
export function distinctWordPictures(left, right) {
  if ((left.id === 'bird' && birdPictures.includes(right.id)) || (right.id === 'bird' && birdPictures.includes(left.id))) return false;
  return !overlappingPictures.some(group => group.includes(left.id) && group.includes(right.id));
}
