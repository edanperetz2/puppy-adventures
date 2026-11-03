// Single spoken words, illustrated by the same local pictures used in Hebrew.
// New vocabulary is introduced one word per supported adventure.
export const MORE_ANIMALS = [
 ['lion','LION','אריה'],['elephant','ELEPHANT','פיל'],['giraffe','GIRAFFE','ג׳ירפה'],
 ['monkey','MONKEY','קוף'],['mouse','MOUSE','עכבר'],['fox','FOX','שועל'],
 ['tiger','TIGER','טיגריס'],['cow','COW','פרה'],['pig','PIG','חזיר'],
 ['sheep','SHEEP','כבשה'],['goat','GOAT','עז'],['camel','CAMEL','גמל'],
 ['zebra','ZEBRA','זברה'],['owl','OWL','ינשוף'],['penguin','PENGUIN','פינגווין'],
 ['parrot','PARROT','תוכי'],['chick','CHICK','אפרוח'],['turtle','TURTLE','צב'],
 ['frog','FROG','צפרדע'],['snake','SNAKE','נחש'],['whale','WHALE','לווייתן'],
 ['dolphin','DOLPHIN','דולפין'],['bee','BEE','דבורה'],['ant','ANT','נמלה'],['spider','SPIDER','עכביש'],
].map(([id,en,he])=>({id,en,he}));
export const MORE_COLORS = [
 {id:'white',en:'WHITE',he:'לבן',hex:'#ffffff'},
 {id:'black',en:'BLACK',he:'שחור',hex:'#273342'},
 {id:'brown',en:'BROWN',he:'חום',hex:'#9a633e'},
];
export const ENGLISH_OBJECTS = [
 ['apple','APPLE','תפוח'],['banana','BANANA','בננה'],['orange-fruit','ORANGE','תפוז'],
 ['pear','PEAR','אגס'],['bread','BREAD','לחם'],['egg','EGG','ביצה'],['milk','MILK','חלב'],
 ['book','BOOK','ספר'],['pencil','PENCIL','עיפרון'],['chair','CHAIR','כיסא'],
 ['bed','BED','מיטה'],['house','HOUSE','בית'],['flower','FLOWER','פרח'],['tree','TREE','עץ'],
 ['sun','SUN','שמש'],['moon','MOON','ירח'],['star','STAR','כוכב'],['ball','BALL','כדור'],
 ['car','CAR','מכונית'],['bus','BUS','אוטובוס'],['train','TRAIN','רכבת'],
 ['kite','KITE','עפיפון'],['hat','HAT','כובע'],['shoe','SHOE','נעל'],
].map(([id,en,he])=>({id,en,he}));
// Whole words model their initial sound; no isolated synthetic consonants.
export const MORE_PHONICS = [
 ['b','ball'],['c','cat'],['d','dog'],['e','egg'],['h','hat'],['o','octopus'],
 ['p','pig'],['r','rabbit'],['t','turtle'],['u','umbrella'],['g','goat'],['l','lion'],['v','violin'],['w','whale'],
].map(([id,word])=>({id,capital:id.toUpperCase(),small:id,word}));
export const BLEND_GROUPS = [
 ['fan','man','fin'],['cat','hat','bat'],['dog','log','fog'],['pig','dig','fig'],
 ['sun','run','fun'],['pan','can','van'],['map','cap','tap'],['sit','hit','bit'],
 ['bed','red','fed'],['hen','pen','ten'],
];
