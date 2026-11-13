import { WORDS, ANIMALS, COLORS, NUMBERS, CLIPS, MISSIONS, READING_LEVELS } from './content.js';
import { LETTERS } from './letters.js';
import { clockTime, CLOCK_LEVELS } from './clock.js';
import { CHARACTERS, CHARACTER_LEVELS, CHARACTER_MODES } from './characters.js?v=2.2.2-six';
import { adventurePhase, isSessionLength } from './adventure.js?v=2.2.2-six';

export const roundKey = (mission,settings) => `${mission}:${mission==='hebrew'?settings.reading:mission==='letters'?settings.letterLanguage:mission==='clock'?settings.clockLevel:mission==='characters'?`${settings.characterLevel}:${settings.characterMode}`:'default'}`;
export function packRound(round) {
  if(!round||round.awarded)return null;
  return {...round,questions:round.questions.map(q=>({...q,word:q.word?.id,letter:q.letter?{id:q.letter.id,language:q.letter.language}:undefined,character:q.character?.id,target:q.target?.id,options:q.options.map(o=>o.id),time:q.time?{hour:q.time.hour,minute:q.time.minute}:undefined})),attempted:[...round.attempted],helped:[...round.helped],counted:[...round.counted],observed:[...(round.observed||[])],at:round.at||Date.now()};
}
export function unpackRound(raw) {
  if(!raw || !Object.hasOwn(MISSIONS,raw.mission)||!Array.isArray(raw.questions)||!isSessionLength(raw.questions.length)||!/^[0-9a-f-]{36}$/i.test(raw.id||'')||!Number.isInteger(raw.index)||raw.index<0||raw.index>=raw.questions.length)return null;
  try {
    const questions=raw.questions.map((d,i)=>{
      const q={id:`${raw.mission}-${i}`,type:d.type,phase:adventurePhase(i,raw.questions.length),prompt:d.prompt,hint:d.hint};
      if(!CLIPS[q.prompt]||!CLIPS[q.hint]||!Array.isArray(d.options)||d.options.length<2||d.options.length>3)throw Error();
      let pool;
      if(d.type==='read'){q.word=WORDS.find(w=>w.id===d.word);if(!q.word)throw Error();pool=WORDS;q.answer=q.word.id;}
      else if(d.type==='letter'){q.letter=LETTERS[d.letter?.language]?.find(l=>l.id===d.letter.id);if(!q.letter)throw Error();pool=LETTERS[d.letter.language];q.answer=q.letter.id;q.showModel=d.showModel===true;q.targetClip=q.letter.clip;}
      else if(d.type==='character'){q.character=CHARACTERS.find(c=>c.id===d.character);if(!q.character||!['picture-name','name-picture'].includes(d.direction)||!['crew','paw'].includes(d.collection))throw Error();Object.assign(q,{collection:d.collection,direction:d.direction,tier:Math.min(3,Math.max(1,Number(d.tier)||1)),answer:q.character.id});pool=CHARACTERS;}
      else if(d.type==='clock'){if(!Number.isInteger(d.time?.hour)||d.time.hour<1||d.time.hour>12||!Number.isInteger(d.time.minute)||d.time.minute<0||d.time.minute>59)throw Error();q.time=clockTime(d.time.hour,d.time.minute);q.answer=q.time.id;pool=Array.from({length:12},(_,h)=>Array.from({length:60},(_,m)=>clockTime(h+1,m))).flat();}
      else if(d.type==='listen'){if(!['animal','color','number'].includes(d.kind))throw Error();pool=d.kind==='animal'?ANIMALS:d.kind==='color'?COLORS:Array.from({length:21},(_,number)=>({id:String(number),number,en:NUMBERS[number]}));q.target=pool.find(t=>t.id===d.target);if(!q.target)throw Error();Object.assign(q,{kind:d.kind,answer:q.target.id,targetClip:`en-${q.target.id}`});}
      else if(['count','add'].includes(d.type)){if(![d.a,d.b,d.total].every(n=>Number.isInteger(n)&&n>=0&&n<=20)||d.a+d.b!==d.total||!['apple','flower','berry','ball','star','heart'].includes(d.item))throw Error();Object.assign(q,{a:d.a,b:d.b,total:d.total,item:d.item,answer:String(d.total)});pool=Array.from({length:21},(_,number)=>({id:String(number),number}));}
      else throw Error();
      q.options=d.options.map(id=>pool.find(o=>o.id===id));if(q.options.some(o=>!o)||new Set(d.options).size!==d.options.length||!d.options.includes(q.answer))throw Error();return q;
    });
    const ints=value=>new Set((Array.isArray(value)?value:[]).filter(n=>Number.isInteger(n)&&n>=0&&n<questions.length));
    return {id:raw.id,key:typeof raw.key==='string'&&/^[a-z0-9:_-]{1,96}$/.test(raw.key)?raw.key:`${raw.mission}:default`,mission:raw.mission,questions,index:raw.index,resolved:raw.resolved===true,attempted:new Set((raw.attempted||[]).filter(id=>questions[raw.index].options.some(o=>o.id===id))),counted:new Set((raw.counted||[]).filter(n=>/^(\d{1,2})$/.test(String(n))&&Number(n)<40).map(String)),helped:ints(raw.helped),observed:ints(raw.observed),letterIds:Array.isArray(raw.letterIds)?raw.letterIds.filter(id=>LETTERS[raw.letterLanguage]?.some(l=>l.id===id)).slice(0,3):null,letterLanguage:raw.letterLanguage==='english'?'english':'hebrew',reading:Object.hasOwn(READING_LEVELS,raw.reading)?raw.reading:'short',clockLevel:Object.hasOwn(CLOCK_LEVELS,raw.clockLevel)?raw.clockLevel:'hours',characterLevel:Object.hasOwn(CHARACTER_LEVELS,raw.characterLevel)?raw.characterLevel:'friends',characterMode:Object.hasOwn(CHARACTER_MODES,raw.characterMode)?raw.characterMode:'mixed',sticker:null,awarded:false,at:Number.isSafeInteger(raw.at)?raw.at:0};
  }catch{return null;}
}
export function cleanDrafts(raw){return Object.fromEntries(Object.values(raw||{}).slice(0,40).map(unpackRound).filter(Boolean).map(r=>[r.key,packRound(r)]));}
