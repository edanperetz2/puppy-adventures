import { repairListeningChoices } from './answer-order.js';
import { distinctWordPictures } from './vocabulary.js';

const numberNames = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split(' ');
const labels = {
  'orange-fruit': 'orange', firetruck: 'fire truck', yoyo: 'yo yo',
  sleeps: 'sleep', eats: 'eat', drinks: 'drink', jumps: 'jump', runs: 'run', swims: 'swim',
};

function spokenLabel(value) {
  const id = String(value ?? '').trim().toLowerCase();
  if (/^\d+$/u.test(id)) return numberNames[Number(id)] ?? id;
  return (Object.hasOwn(labels, id) ? labels[id] : id).replace(/-/gu, ' ');
}

// English spelling alone misses rhymes such as bear/pear and similar vowels
// such as ship/sheep. These are contrasts in the game's recorded vocabulary.
// Membership is pairwise: sharing different groups through a third word does
// not make two otherwise clear words sound alike.
const families = [
  'bat cat hat', 'bear chair pear square', 'bed bread red', 'bee key three tree', 'bell shell',
  'blue shoe two', 'boat coat goat', 'boot flute', 'box fox socks', 'brick chick', 'brown crown',
  'cake snake', 'car jar star', 'cheese peas', 'clock lock rock', 'door four', 'drink pink',
  'duck truck', 'eight plate', 'goose juice', 'green queen', 'hen pen ten', 'house mouse',
  'kite white', 'moon spoon', 'nose rose', 'one run sun', 'rain train', 'ring swing',
  'seal wheel', 'sheep sleep', 'shirt skirt', 'snail whale',
  // Close sounds across accents, compounds and longer words the child hears.
  'dog frog', 'ball bowl bell balloon', 'soup soap', 'sheep ship', 'mouse mouth',
  'fox fork', 'pan pen', 'horse house', 'ear deer', 'ear eat', 'eat eight', 'two tooth',
  'bee peas', 'parrot carrot', 'potato tomato', 'hammer hamster', 'candle candy', 'candle sandal',
  'basket bucket', 'donkey monkey', 'lemon melon', 'rabbit ribbon', 'burger butter',
  'pineapple apple', 'watermelon melon', 'sunflower flower', 'sunflower sun',
  'jellyfish fish', 'butterfly butter', 'pancake cake', 'pancake pan',
  'toothbrush tooth', 'notebook book', 'spaceship ship', 'firetruck truck',
  'blue black brown', 'pink purple',
  'two twelve twenty', 'three thirteen', 'four fourteen', 'five fifteen', 'six sixteen',
  'seven seventeen', 'seven eleven', 'eight eighteen', 'nine nineteen', 'ten tent',
  'thirteen fourteen fifteen sixteen seventeen eighteen nineteen',
];
const near = new Map();
for (const family of families) {
  const words = family.split(' ');
  for (const word of words) {
    const label = spokenLabel(word);
    if (!near.has(label)) near.set(label, new Set());
    for (const other of words) near.get(label).add(spokenLabel(other));
  }
}

// Use the opening sound, including consonant clusters, for short words. This
// also protects newly added labels such as another B-word beside "boat".
function onset(word) {
  const spelling = word.replace(/^wh(?=o)/u, 'h').replace(/^wh/u, 'w')
    .replace(/^ph/u, 'f').replace(/^kn/u, 'n').replace(/^wr/u, 'r')
    .replace(/^sci/u, 'si').replace(/^c(?=[eiy])/u, 's').replace(/^c(?!h)/u, 'k')
    .replace(/^g(?=iraffe)/u, 'j');
  return /^(?:str|skr|shr|thr|spl|spr|skw|squ|sh|ch|th|bl|br|kl|kr|dr|fl|fr|gl|gr|pl|pr|sk|sl|sm|sn|sp|st|sw|tr|tw|qu|[bcdfghjklmnpqrstvwxyz])/u.exec(spelling)?.[0];
}

// Compare the words that differ (boat/ball in "blue boat"/"blue ball").
export function distinctSpokenWords(left, right) {
  const a = spokenLabel(left), b = spokenLabel(right);
  if (!a || !b || a === b || near.get(a)?.has(b)) return false;
  if (Math.min(a.length, b.length) <= 5) {
    const first = onset(a);
    if (first && first === onset(b)) return false;
  }
  return true;
}

export function clearListeningOptions(choices, target, pool) {
  const correct = choices.find(word => word.id === target.id);
  return repairListeningChoices(choices, correct, pool, (a, b) =>
    distinctWordPictures(a, b) && distinctSpokenWords(a.en ?? a.id, b.en ?? b.id));
}
