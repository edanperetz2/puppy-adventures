import { WORDS, ANIMALS, COLORS, ENGLISH_OBJECTS } from './content.js?v=2.2.0-voices';
import { MORE_PHONICS, BLEND_GROUPS } from './english-expansion.js';
import { distinctWordPictures } from './vocabulary.js';
import { WORKSHOP_WORDS, STORIES } from './journey-content.js';
import { WORD_CONTEXTS } from './word-contexts.js';
import { choosePractice, englishPairsReady } from './learning.js';
import { GIVING_CLIPS } from './journey-audio.js?v=2.2.0-voices';
import { LETTER_EXAMPLES } from './word-practice-expansion.js';
import { answerShuffler, shuffle as mix } from './answer-order.js';
import { SESSION_LENGTH, LEGACY_SESSION_LENGTH, adventurePhase } from './adventure.js?v=2.2.2-six';

export const JOURNEYS = {
 workshop:{title:'סדנת המילים',domain:'hebrew',intro:'journey-workshop-intro',description:'שומעות, מחברות ובונות מילים',icon:'pencil'},
 stories:{title:'סיפור שמשחקים',domain:'hebrew',intro:'journey-story-intro',description:'קוראות, מזיזות ועוזרות לחברים',icon:'house'},
 english:{title:'אנגלית בצעדים קטנים',domain:'english',intro:'journey-english-one',description:'מילה מוכרת, הצלחה קטנה, ועוד מילה',icon:'dog'},
 objects:{title:'מעבדת המספרים',domain:'math',intro:'journey-count-all',description:'בונות כמויות, מחברות ומגלות מה חסר',icon:'apple'},
 sounds:{title:'מגלים צלילים באנגלית',domain:'english',intro:'journey-phonics-intro',description:'מסלול בחירה · אות, צליל, מילה',icon:'bird'},
};
export const PHONICS = [
 {id:'f',capital:'F',small:'f',word:'fish'}, {id:'s',capital:'S',small:'s',word:'sun'},
 {id:'m',capital:'M',small:'m',word:'mouse'}, {id:'a',capital:'A',small:'a',word:'apple'},
 {id:'n',capital:'N',small:'n',word:'nose'}, {id:'i',capital:'I',small:'i',word:'insect'},
 ...MORE_PHONICS,
];
export const soundExample = letter => {const word=PHONICS.find(p=>p.id===letter)?.word;return word==='fish'?'en-fish':`journey-en-${word}`;};
// The review word starts with the same sound as the model. A vowel or a
// letter like C or G can be pronounced differently in other words.
const soundReviewWords = {
  f: ['fox', 'frog'], s: ['star', 'snail'], m: ['moon', 'milk', 'monkey'], a: ['ant', 'anchor'],
  n: ['necklace', 'notebook'], b: ['bear', 'bird', 'banana'], c: ['cow', 'cake', 'car'],
  d: ['duck', 'door', 'drum'], e: ['elephant'], h: ['house', 'heart'], p: ['panda', 'penguin', 'pizza'],
  r: ['rainbow', 'robot', 'rose'], t: ['tiger', 'tree', 'train'], g: ['guitar', 'grapes'],
  l: ['leaf', 'lamp', 'lemon'], v: ['vase'], w: ['window', 'worm'],
};
export const ENGLISH_PAIRS = ['ball','car'].flatMap(object=>COLORS.map(c=>({color:c.id,object})));
export const ENGLISH_WORDS = [...ANIMALS,...COLORS,...ENGLISH_OBJECTS];
export const STORY_RELATIONS = ['on', 'under', 'beside'];
// Each route has the same opening and ending. Its middle pages keep related
// events together and give the other illustrated pages a turn on later visits.
const STORY_ROUTES = {
  picnic: [[1, 2, 5, 8], [3, 4, 6, 7]],
  'lost-ball': [[1, 3, 7, 8], [2, 5, 6, 8], [2, 3, 4, 8]],
  garden: [[1, 2, 4, 6], [1, 3, 6, 7], [1, 5, 6, 8]],
  'shared-book': [[2, 3, 4, 6], [1, 4, 7, 8], [1, 3, 4, 5]],
  'toy-workshop': [[1, 2, 4, 5], [1, 3, 6, 7], [1, 2, 6, 8]],
  'fruit-stand': [[1, 2, 3, 7], [1, 4, 5, 6], [1, 3, 6, 8]],
  'after-rain': [[1, 3, 4, 7], [2, 3, 5, 8], [1, 3, 4, 6], [1, 3, 7, 8]],
  'little-party': [[1, 2, 4, 6], [2, 3, 4, 8], [1, 4, 6, 7], [1, 2, 4, 5]],
};
export const journeyLength = plan => plan.length === SESSION_LENGTH ? SESSION_LENGTH : LEGACY_SESSION_LENGTH;
export function seeded(seed) { let n=seed>>>0;return()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;}; }

function numberChoices(answer, min, max, count, rng) {
  const nearby = [-2, -1, 1, 2].map(offset => answer + offset).filter(n => n >= min && n <= max);
  return [answer, ...mix(nearby, rng).slice(0, count - 1)];
}
// Enumerated cases give the saved learning history many real combinations to
// choose from, rather than repeating one fixed split for each total.
export function objectCases(kind,max=10) {
  if (kind === 'quantity' && max === 5) return Array.from({ length: 6 }, (_, total) => ({ total, known: 0 }));
  const cap=kind==='takeaway'?Math.min(8,max):kind==='tens'?100:max;
  return Array.from({length:cap},(_,i)=>i+1).filter(total=>kind==='tens'?total>=10:kind==='quantity'||total>=2).flatMap(total=>{
    const parts=kind==='bonds'||kind==='takeaway'?Array.from({length:total-1},(_,i)=>i+1):[kind==='tens'?Math.floor(total/10)*10:0];
    return parts.filter(known=>kind!=='takeaway'||known<=3).map(known=>({total,known}));
  });
}
function objectExamples(kind,max,items,rng) {
  const pool=objectCases(kind,max),cap=kind==='tens'?100:kind==='takeaway'?Math.min(8,max):max;
  if(kind==='tens'){
    const sample=(low,high,count)=>choosePractice(pool.filter(p=>p.total>=low&&p.total<=high),items,p=>`objects:tens:${p.total}:${p.known}`,count,Date.now(),rng);
    return [pool.find(p=>p.total===10),...sample(11,20,1),...sample(21,30,1),...sample(31,65,2),...sample(66,100,1)].sort((a,b)=>a.total-b.total);
  }
  const cuts=[Math.min(4,Math.max(3,Math.ceil(cap*.4))),Math.max(4,Math.ceil(cap*.7))];
  const selected=[];
  const key = p => `objects:${kind}:${p.total}:${p.known}`;
  for(const [low,high] of [[-1,cuts[0]],[cuts[0],cuts[1]],[cuts[1],cap]]) {
    const band=pool.filter(p=>p.total>low&&p.total<=high);
    selected.push(...choosePractice(band, items, key, 2, Date.now(), rng));
  }
  if (selected.length < SESSION_LENGTH) {
    const remaining = pool.filter(example => !selected.includes(example));
    selected.push(...choosePractice(remaining, items, key, SESSION_LENGTH - selected.length, Date.now(), rng));
  }
  return selected.sort((a,b)=>a.total-b.total||Math.min(a.known,a.total-a.known)-Math.min(b.known,b.total-b.known));
}
export const graphemes = text => [...text.normalize('NFC').matchAll(/[א-ת][\u0591-\u05c7]*/gu)].map(x=>x[0]);
export function newJourney(mode,level,items={},options={}) {
  if(!JOURNEYS[mode])throw Error('unknown_journey');
  const rng=options.rng||Math.random, seed=Math.floor(rng()*0x100000000);
  const cleanLevel=mode==='stories' ? STORIES.some(s=>s.id===level)?level:STORIES[0].id : mode==='english' ? ['single','pairs','cars'].includes(level)?level:'single' : mode==='objects' ? ['quantity','bonds','tens','takeaway'].includes(level)?level:'quantity' : mode==='sounds' ? ['sounds','blend'].includes(level)?level:'sounds' : Math.max(1,Math.min(4,Number(level)||1));
  const selected=mode==='workshop'?choosePractice(WORKSHOP_WORDS.filter(w=>w.level<=cleanLevel),items,w=>`workshop:${w.id}`,SESSION_LENGTH,Date.now(),rng):[];
  const words=selected.length?Array.from({length:SESSION_LENGTH},(_,i)=>selected[i%selected.length]).sort((a,b)=>a.level-b.level).map(w=>w.id):[];
  const familiar=['dog','cat','red','blue'];
  const known=Object.keys(items).filter(id=>id.startsWith('english:single:')&&items[id].independent>0).map(id=>id.split(':').at(-1)).filter(id=>ENGLISH_WORDS.some(x=>x.id===id));
  const newWord = ENGLISH_WORDS.find(word => !familiar.includes(word.id) && !known.includes(word.id));
  const reviewPool = ENGLISH_WORDS.filter(word => !familiar.includes(word.id));
  const fresh = (newWord || choosePractice(reviewPool, items, word => `english:single:${word.id}`, 1, Date.now(), rng)[0]).id;
  const review=choosePractice(ENGLISH_WORDS.filter(w=>known.includes(w.id)&&!familiar.includes(w.id)&&w.id!==fresh),items,w=>`english:single:${w.id}`,8,Date.now(),rng).map(w=>w.id);
  const knownColors=COLORS.filter(c=>['red','blue',...known].includes(c.id));
  const pairColors=choosePractice(knownColors,items,c=>`english:pair:${c.id}-${cleanLevel==='cars'?'car':'ball'}`,2,Date.now(),rng).map(c=>c.id);
  const introduced=PHONICS.filter(p=>items[`phonics:sound:${p.id}`]?.seen).length;
  const blendWords=choosePractice(BLEND_GROUPS,items,g=>`phonics:blend:${g[0]}`,1,Date.now(),rng)[0];
  const soundIds=mode==='sounds'?cleanLevel==='blend'?[...new Set(blendWords.join(''))].slice(0,3):choosePractice(PHONICS.slice(0,Math.min(PHONICS.length,Math.max(3,introduced+1))),items,p=>`phonics:sound:${p.id}`,3,Date.now(),rng).sort((a,b)=>PHONICS.indexOf(a)-PHONICS.indexOf(b)).map(p=>p.id):[];
  const max=[5,10,20].includes(options.mathMax)?options.mathMax:10;
  const distinctReview = mode === 'english' && cleanLevel === 'single' && !newWord;
  return {id:globalThis.crypto.randomUUID(),revision:2,length:SESSION_LENGTH,shuffleAnswers:true,varietyFrom:0,...(distinctReview ? { distinctReview } : {}),introducing:Boolean(newWord),mode,level:cleanLevel,seed,words,soundIds,blendWords,pairColors,examples:mode==='objects'?objectExamples(cleanLevel,max,items,rng):[],english:[...new Set([...familiar,...review])].concat(fresh),max,index:0,state:{},helped:[],observed:[],at:Date.now()};
}
export function cleanJourney(raw) {
  if(!raw||!Object.hasOwn(JOURNEYS,raw.mode)||!/^[0-9a-f-]{36}$/i.test(raw.id)||!Number.isInteger(raw.seed))return null;
  const length = journeyLength(raw);
  if (!Number.isInteger(raw.index) || raw.index < 0 || raw.index >= length) return null;
  const allowed=raw.mode==='workshop'?[1,2,3,4]:raw.mode==='stories'?STORIES.map(s=>s.id):raw.mode==='english'?['single','pairs','cars']:raw.mode==='objects'?['quantity','bonds','tens','takeaway']:['sounds','blend'];
  if(!allowed.includes(raw.level))return null;
  const words=(Array.isArray(raw.words)?raw.words:[]).filter(id=>WORKSHOP_WORDS.some(w=>w.id===id)).slice(0,length);
  if(raw.mode==='workshop'&&!words.length)return null;
  const english=(Array.isArray(raw.english)?raw.english:[]).filter(id=>ENGLISH_WORDS.some(x=>x.id===id)).slice(0,13);
  if(raw.mode==='english'&&english.length<(length===SESSION_LENGTH?5:4))return null;
  const state=raw.state&&typeof raw.state==='object'?raw.state:{};
  const distinctReview = raw.mode === 'english' && raw.level === 'single' && raw.distinctReview === true;
  const soundIds=[...new Set((Array.isArray(raw.soundIds)?raw.soundIds:['f','s','m']).filter(id=>PHONICS.some(p=>p.id===id)))].slice(0,3);
  const revision=raw.revision===2?2:1,max=[5,10,20].includes(raw.max)?raw.max:10;
  const blendWords=BLEND_GROUPS.find(g=>JSON.stringify(g)===JSON.stringify(raw.blendWords))||BLEND_GROUPS[0];
  const pairColors=[...new Set((Array.isArray(raw.pairColors)?raw.pairColors:[]).filter(id=>COLORS.some(c=>c.id===id)))].slice(0,2);
  const cases = raw.mode === 'objects' ? objectCases(raw.level, max) : [];
  const examples=(Array.isArray(raw.examples)?raw.examples:[]).filter(p=>cases.some(c=>c.total===p?.total&&c.known===p?.known)).slice(0,length).map(({total,known})=>({total,known}));
  if(revision===2&&raw.mode==='objects'&&examples.length!==length)return null;
  const steps = value => [...new Set((Array.isArray(value) ? value : []).filter(n => Number.isInteger(n) && n >= 0 && n < length))];
  const varietyFrom = Number.isInteger(raw.varietyFrom) && raw.varietyFrom >= 0 && raw.varietyFrom < length ? raw.varietyFrom : undefined;
  return {id:raw.id,revision,length,shuffleAnswers:raw.shuffleAnswers===true,varietyFrom,...(distinctReview ? { distinctReview } : {}),introducing:raw.introducing!==false,mode:raw.mode,level:raw.level,seed:raw.seed>>>0,words,soundIds,blendWords,pairColors,examples,english,max,index:raw.index,state:{chosen:Array.isArray(state.chosen)?state.chosen.filter(n=>Number.isInteger(n)&&n>=0&&n<24).slice(0,24):[],tokens:Array.isArray(state.tokens)?[...new Set(state.tokens.filter(n=>Number.isInteger(n)&&n>=0&&n<100))].slice(0,100):[],quantity:Math.max(0,Math.min(100,Math.floor(state.quantity)||0)),resolved:state.resolved===true,placed:state.placed===true,showModel:state.showModel===true,attempted:Array.isArray(state.attempted)?state.attempted.filter(id=>typeof id==='string'&&/^[a-z0-9-]{1,40}$/.test(id)).slice(0,4):[]},helped:steps(raw.helped),observed:steps(raw.observed),at:Number.isSafeInteger(raw.at)?raw.at:Date.now()};
}

export function resumeJourney(raw) {
  const plan = cleanJourney(raw);
  if (plan?.mode === 'sounds' && plan.varietyFrom === undefined && plan.index + 1 < plan.length) {
    // Keep the displayed question and its saved attempts intact.
    plan.varietyFrom = plan.index + 1;
  }
  return plan;
}

function soundReview(phoneme, previous, rng) {
  const used = new Set(previous.filter(task => task.kind === 'sound' && task.phoneme.id === phoneme.id)
    .map(task => task.example?.id || phoneme.word));
  const words = (soundReviewWords[phoneme.id] || []).filter(word => !used.has(word));
  const next = words[Math.floor(rng() * words.length)];
  return LETTER_EXAMPLES[`en-${phoneme.id}`]?.find(example => example.id === next);
}

export function journeyQuestions(plan) {
  const rng=seeded(plan.seed),result=[];
  const length = journeyLength(plan), short = length === SESSION_LENGTH;
  let storyPages;
  if (plan.mode === 'stories' && short) {
    const routes = STORY_ROUTES[plan.level], routeIndex = plan.seed % routes.length;
    const middle = plan.level === 'lost-ball' && plan.varietyFrom === undefined && routeIndex === 1
      ? [3, 5, 6, 8]
      : routes[routeIndex];
    storyPages = [0, ...middle, LEGACY_SESSION_LENGTH - 1];
  }
  for(let i=0;i<length;i++) {
    const phase = adventurePhase(i, length);
    const warmup = phase === 'warmup';
    const challenge = phase === 'challenge';
    if(plan.mode==='workshop') {
      const entry=WORKSHOP_WORDS.find(w=>w.id===plan.words[i%plan.words.length]),word=WORDS.find(w=>w.id===entry.id);
      const kind=warmup?'chunks':!challenge?'build':i<length-1?'missing':'context',pieces=kind==='chunks'?entry.chunks.map(c=>c.text):graphemes(word.pointed);
      const missing=Math.floor(rng()*pieces.length),tiles=mix(pieces.map((text,id)=>({text,id})),rng);
      const contextPool=plan.revision===2?WORKSHOP_WORDS:WORKSHOP_WORDS.slice(0,16);
      const choices=kind==='context'?mix([word,...mix(contextPool.filter(w=>w.id!==word.id&&w.level<=plan.level).map(w=>WORDS.find(x=>x.id===w.id)),rng).slice(0,2)],rng):[];
      result.push({kind,word,entry,pieces,tiles,missing,choices,context:WORD_CONTEXTS[word.id],answer:word.id,key:`workshop:${word.id}${kind==='context'?':sentence':''}`,prompt:kind==='context'?'journey-context-intro':kind==='missing'?'journey-workshop-missing':'journey-workshop-build',model:warmup});
    } else if(plan.mode==='stories') {
      const pageIndex = storyPages?.[i] ?? i;
      const story=STORIES.find(s=>s.id===plan.level),page=story.pages[pageIndex];
      const countChoices=plan.revision===2?[page.count-1,page.count+1,page.count-2,page.count+2].filter(n=>n>=1&&n<=10):[1,2,3,4,5].filter(n=>n!==page.count);
      const choices=page.task==='count'?mix([page.count,...countChoices.slice(0,warmup?1:2)],rng).map(String):page.task==='place'?[]:mix(page.choices,rng);
      result.push({kind:'story',story,page,choices,answer:page.task==='count'?String(page.count):page.target,key:`story:${story.id}:${pageIndex}`,prompt:`journey-story-${story.id}-${pageIndex}-prompt`});
    } else if(plan.mode==='english') {
      const pair=plan.level!=='single'&&i>=3, object=plan.level==='cars'?'car':'ball';
      const fresh=plan.english.at(-1),warm=plan.english.slice(0,-1);
      const colors=plan.revision===2&&plan.pairColors?.length===2?plan.pairColors:['red','blue'];
      const targets=colors.map(color=>({color,object}));
      const singlePool=plan.revision===2?ENGLISH_WORDS:[...ANIMALS.slice(0,8),...COLORS.slice(0,7)];
      const introduction = short ? 2 : 4;
      const reviewCount = warm.length - 3;
      const reviewIndex = short ? plan.seed % reviewCount : 0;
      const lastWord = plan.distinctReview && warm.length > 4
        ? warm[3 + (reviewIndex + 1) % reviewCount]
        : fresh;
      const singleWords = short ? [warm[0], warm[1], fresh, warm[2], warm[3 + reviewIndex], lastWord] : null;
      const singleId = short ? singleWords[i] : i===4||i===7?fresh:warm[i%warm.length];
      const target=pair?targets[(i-3)%2]:plan.level!=='single'&&i===0?{id:object,en:object.toUpperCase(),he:object==='ball'?'כדור':'מכונית'}:singlePool.find(x=>x.id===(plan.level!=='single'?['', ...colors][i]:singleId));
      const pool=pair?targets:singlePool.filter(x=>((COLORS.some(c=>c.id===target.id))===COLORS.some(c=>c.id===x.id)) && [...warm,...(i>=introduction?[fresh]:[])].includes(x.id)&&(x.id===target.id||distinctWordPictures(target,x)));
      const id=x=>pair?`${x.color}-${x.object}`:x.id;
      const choices=mix([target,...mix(pool.filter(x=>id(x)!==id(target)),rng).slice(0,challenge?2:1)],rng);
      const newWord=plan.level==='single'?i===introduction&&(plan.revision!==2||plan.introducing!==false):i===0;
      result.push({kind:pair?'pair':'single',target,choices,answer:id(target),key:pair?`english:pair:${id(target)}`:`english:single:${target.id}`,prompt:pair?'journey-english-two':'journey-english-one',clip:pair?`journey-en-${id(target)}`:['ball','car'].includes(target.id)?`journey-en-${target.id}`:`en-${target.id}`,model:newWord||pair&&!challenge,newWord});
    } else if(plan.mode==='objects') {
      const kind=plan.level;
      const cap=kind==='takeaway'?Math.min(8,plan.max):plan.max;
      const total=plan.revision===2?plan.examples[i].total:kind==='tens'?[10,20,30,32,42,52,62,75,86,100][i]:Math.min(cap,2+Math.floor(i*(cap-2)/9));
      const known=plan.revision===2?plan.examples[i].known:kind==='quantity'?0:kind==='tens'?Math.floor(total/10)*10:kind==='takeaway'?Math.min(3,Math.max(1,Math.floor(total/3))):Math.max(1,Math.floor(total/2));
      const answer = kind === 'takeaway' || kind === 'bonds' ? total - known : total;
      result.push({
        kind: 'objects', operation: kind, total, known, answer,
        key: `objects:${kind}:${total}:${known}`,
        prompt: kind === 'takeaway' ? GIVING_CLIPS[known] : kind === 'tens' ? 'journey-ten-model' : kind === 'bonds' ? 'journey-missing-quantity' : 'journey-build-quantity',
        ...(kind === 'takeaway' ? { choices: mix([answer - 1, answer, answer + 1], rng) } : {}),
        extraClips: kind === 'quantity' ? [`number-${total}`] : [], model: warmup,
      });
    } else {
      const group=(plan.soundIds?.length===3?plan.soundIds:['f','s','m']).map(id=>PHONICS.find(p=>p.id===id));
      const blend=plan.level==='blend'&&i>=3;
      const varied = !blend && plan.varietyFrom !== undefined && i >= plan.varietyFrom;
      const counts = candidate => result.filter(task => task.kind === 'sound' && task.phoneme.id === candidate.id).length;
      const phoneme = varied
        ? mix(group.filter(candidate => candidate !== result.at(-1)?.phoneme), rng).sort((a, b) => counts(a) - counts(b))[0]
        : group[short ? plan.level==='blend' ? i%3 : Math.floor(i/2) : i<4?0:i<7?1:2];
      const words=plan.revision===2?plan.blendWords:BLEND_GROUPS[0];const word=words[(i-3+9)%3];
      const choices=blend?mix(words,rng):mix([phoneme,...mix(group.filter(x=>x.id!==phoneme.id),rng).slice(0,challenge?2:1)],rng);
      const model = varied
        ? counts(phoneme) === 0
        : short ? plan.level==='blend' ? i<4 : i%2===0 : i<3||blend&&i<7||!blend&&[4,7].includes(i);
      const example = varied && !model ? soundReview(phoneme, result, rng) : undefined;
      result.push({kind:blend?'blend':'sound',phoneme,word,choices,answer:blend?word:phoneme.id,key:blend?`phonics:blend:${word}`:`phonics:sound:${phoneme.id}`,prompt:'journey-phonics-intro',model,clip:blend?`journey-en-${word}`:example?.clip||soundExample(phoneme.id),...(example ? {example} : {})});
    }
  }
  if (!plan.shuffleAnswers) return result;

  const answerRng = seeded(plan.seed ^ 0x9e3779b9);
  const orderAnswers = answerShuffler(answerRng);
  for (const [index, task] of result.entries()) {
    if (task.kind === 'story' && task.page.task === 'place') {
      task.choices = orderAnswers(STORY_RELATIONS, task.page.relation);
      continue;
    }
    if (task.kind === 'story' && task.page.task === 'count') {
      task.choices = numberChoices(task.page.count, 1, 10, adventurePhase(index, length) === 'warmup' ? 2 : 3, answerRng).map(String);
    }
    if (task.operation === 'takeaway') {
      task.choices = numberChoices(task.answer, 0, task.total, task.total === 2 ? 2 : 3, answerRng);
    }
    if (task.choices?.length) {
      task.choices = task.kind === 'pair'
        ? orderAnswers(task.choices, task.answer, choice => `${choice.color}-${choice.object}`)
        : orderAnswers(task.choices, task.answer);
    } else if (task.tiles) {
      task.tiles = orderAnswers(task.tiles, task.kind === 'missing' ? task.pieces[task.missing] : undefined, tile => tile.text);
    }
  }
  return result;
}

export { englishPairsReady };
