// Each object below has a named illustration in the reading vocabulary.
// Use everyday English labels when the artwork identifier is more technical.
export const EXTRA_PICTURE_NOUNS = `
butterfly pineapple helicopter table bicycle glasses scissors tractor dinosaur chocolate
cucumber koala leopard deer flamingo eagle peacock swan rooster bat crocodile lizard
shark crab peach strawberry cherries mango melon blueberries coconut avocado tomato carrot
corn pepper broccoli lettuce mushroom pretzel cheese cookie candy ice-cream popsicle
burger fries spaghetti rice soup salad honey couch mirror bathtub soap sponge broom
bucket basket plate bowl spoon fork teapot pan lock bell candle flashlight ladder
hammer clock tent brick cloud rain snow fire mountain rock cactus shell shirt pants
dress skirt coat scarf gloves socks boot sandal crown helmet ring ribbon wallet hand
foot ear mouth tooth tongue pen paintbrush ruler triangle square circle eraser piano
flute microphone headphones camera computer phone television radio balloon puzzle
yoyo gift trophy medal mask ship boat truck motorcycle scooter spaceship submarine
taxi bridge suitcase ticket wheel compass firetruck ambulance hedgehog hen ladybug
slide swing backpack hamster donkey goose seal beaver otter raccoon sloth potato
peanut peas pancake waffle sandwich taco juice popcorn butter cup box envelope
map flag toothbrush comb crayon feather sunflower nest island
`.trim().split(/\s+/u);

const labels = { 'ice-cream': 'ice cream', yoyo: 'yo-yo', firetruck: 'fire truck' };
export const nounLabel = id => labels[id] || id;
const existingNouns = {
  eagle: 'letter-example-en-eagle', 'ice-cream': 'letter-example-en-ice-cream',
  yoyo: 'letter-example-en-yoyo', boat: 'delivery-en-boat',
  bat: 'journey-en-bat', pan: 'journey-en-pan', map: 'journey-en-map',
  hen: 'journey-en-hen', pen: 'journey-en-pen',
};
export const extraNounClip = id => existingNouns[id] || `picture-en-${id}`;
export const MATCH_COLORS = ['red', 'blue', 'yellow', 'green', 'pink', 'purple'];
export const PAINTED_NOUNS = [
  'ball', 'car', 'door', 'hat', 'shoe', 'kite', 'umbrella', 'bucket', 'chair',
  'star', 'heart', 'balloon', 'butterfly', 'flower', 'bus', 'cup', 'pencil', 'drum',
];
export const colorClip = (color, noun) => {
  if (noun === 'ball' || noun === 'car') return `journey-en-${color}-${noun}`;
  if (noun === 'butterfly' && color === 'yellow') return 'letter-example-en-color-butterfly-yellow';
  return `picture-en-${color}-${noun}`;
};
// Plurals are explicit. Every counted item has a naturally singular picture.
export const COUNTED_NOUNS = {
  cat: 'cats', dog: 'dogs', ball: 'balls', duck: 'ducks', bird: 'birds', apple: 'apples',
  car: 'cars', star: 'stars', flower: 'flowers', chair: 'chairs', hat: 'hats', egg: 'eggs',
  train: 'trains', tree: 'trees', rabbit: 'rabbits', kite: 'kites', spoon: 'spoons',
  boat: 'boats', door: 'doors', drum: 'drums', balloon: 'balloons', shoe: 'shoes',
  cup: 'cups', pencil: 'pencils',
};
export const countSentence = (count, noun) =>
  `I see ${['', 'one', 'two', 'three'][count]} ${count === 1 ? noun : COUNTED_NOUNS[noun]}.`;
export const countClip = (count, noun) => `picture-en-see-${count}-${noun}`;
export const colorSentence = (color, noun) => `The ${noun} is ${color}.`;
export const colorSentenceClip = (color, noun) => `picture-en-is-${color}-${noun}`;

const verbs = { sleep: 'sleeps', eat: 'eats', drink: 'drinks', jump: 'jumps', run: 'runs', swim: 'swims' };
export const ANIMAL_ACTIONS = [
  ...['dog', 'cat', 'rabbit'].flatMap(noun => ['sleep', 'eat', 'drink', 'jump', 'run'].map(action => [noun, action, `action-${noun}-${action}`])),
  ...['sleep', 'eat', 'drink'].map(action => ['bird', action, `action-bird-${action}`]),
  ['duck', 'swim', 'story-animal-duck-swim'], ['dog', 'swim', 'story-animal-dog-swim'],
  ['duck', 'sleep', 'story-animal-duck-sleep'], ['duck', 'jump', 'story-animal-duck-jump'],
].map(([noun, action, scene]) => ({
  id: `does-${noun}-${action}`, noun, action, scene, text: `The ${noun} ${verbs[action]}.`, clip: `picture-en-does-${noun}-${action}`,
}));

export const ENGLISH_PICTURE_CLIPS = {
  'picture-en-choose-picture': { lang: 'he-IL', text: 'נַקְשִׁיב לָאַנְגְּלִית וְנִבְחַר תְּמוּנָה.', speech: 'nakʃˈiv laʔanɡlˈit venivχˈaʁ tmunˈa.' },
  'picture-en-choose-words': { lang: 'he-IL', text: 'מָה רוֹאִים בַּתְּמוּנָה? אֶפְשָׁר לִשְׁמֹעַ כָּל אֶפְשָׁרוּת.', speech: 'mˈa ʁoʔˈim batmunˈa? ʔefʃˈaʁ liʃmˈoʔa kˈol ʔefʃaʁˈut.' },
};
for (const id of EXTRA_PICTURE_NOUNS) {
  if (!existingNouns[id]) ENGLISH_PICTURE_CLIPS[extraNounClip(id)] = { lang: 'en-US', text: nounLabel(id) };
}
for (const noun of PAINTED_NOUNS) {
  for (const color of MATCH_COLORS) {
    const clip = colorClip(color, noun);
    if (clip.startsWith('picture-en-')) ENGLISH_PICTURE_CLIPS[clip] = { lang: 'en-US', text: `${color} ${noun}` };
    ENGLISH_PICTURE_CLIPS[colorSentenceClip(color, noun)] = { lang: 'en-US', text: colorSentence(color, noun) };
  }
}
for (const entry of ANIMAL_ACTIONS) ENGLISH_PICTURE_CLIPS[entry.clip] = { lang: 'en-US', text: entry.text };
for (const noun of Object.keys(COUNTED_NOUNS)) {
  for (const count of [1, 2, 3]) {
    ENGLISH_PICTURE_CLIPS[countClip(count, noun)] = { lang: 'en-US', text: countSentence(count, noun) };
  }
}
