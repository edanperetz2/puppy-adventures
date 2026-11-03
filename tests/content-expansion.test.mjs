import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { CLIPS,WORDS,COLORS } from '../dist/content.js';
import { createSession,freshProgress,sanitizeProgress } from '../dist/engine.js';
import { newJourney,cleanJourney,journeyQuestions,seeded,ENGLISH_WORDS,ENGLISH_PAIRS,PHONICS,objectCases } from '../dist/journey.js';
import { STORIES,WORKSHOP_WORDS } from '../dist/journey-content.js';
import { BLEND_GROUPS } from '../dist/english-expansion.js';
import { CLOCK_LESSONS,clockLessonTasks,sanitizeClockPosition } from '../dist/clock-learning.js';
import { LETTERS } from '../dist/letters.js';
import { LETTER_EXAMPLES } from '../dist/word-practice-expansion.js';
import { letterExampleCards } from '../dist/letter-examples.js';
import { hasArt } from '../dist/art.js';
import { cleanItem,cleanItems,applyObservation,MAX_LEARNING_ITEMS } from '../dist/learning.js';
import { createCharacterSession } from '../dist/characters.js';
import { profileSpeech } from '../dist/profile-speech.js';
import { chunkClip } from '../dist/journey-audio.js';
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
const hash=value=>createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
const baseline=JSON.parse(await readFile(new URL('./fixtures/release-2.0.1.json',import.meta.url),'utf8'));

test('Original recordings and unfinished journeys are preserved, with two explicit pronunciation corrections',async()=>{
  assert.equal(baseline.ids.length,1020);assert.deepEqual(baseline.corrected,['he-parrot','he-pineapple']);
  assert.equal(CLIPS['he-parrot'].speech,'hamilˈa hˈi tˈuki.');
  assert.equal(CLIPS['he-pineapple'].speech,'hamilˈa hˈi ʔananˈas.');
  assert.equal(WORDS.find(w=>w.id==='pineapple').pointed,'אָנָנָס');
  assert.equal(hash(baseline.ids.map(id=>[id,CLIPS[id]])),baseline.scripts);
  const recordings=JSON.parse(await readFile(new URL('../dist/assets/audio/manifest.json',import.meta.url),'utf8')).clips;
  assert.equal(hash(baseline.ids.map(id=>[id,recordings[id]])),baseline.recordings);
  for(const fixture of baseline.journeys)assert.equal(hash(journeyQuestions(cleanJourney(fixture.plan))),fixture.questions,`${fixture.plan.mode}:${fixture.plan.level}`);
  for(let i=0;i<10;i++)assert.deepEqual(CLOCK_LESSONS[i].tasks.slice(0,baseline.clockTasks[i].length),baseline.clockTasks[i]);
  const progress=freshProgress();progress.sessions=27;progress.stickers=Array.from({length:27},(_,i)=>i);
  // The established sanitizer still derives the stable earned album by count.
  assert.equal(sanitizeProgress(progress).sessions,27);assert.equal(sanitizeProgress(progress).stickers.length,27);
});

test('Every existing content bank is substantially larger, without adding a new alphabet or cast',()=>{
  assert.ok(WORDS.length>=416*2);assert.equal(WORKSHOP_WORDS.length,64);
  assert.equal(STORIES.length,8);assert.ok(ENGLISH_WORDS.length>=15*4);
  assert.equal(ENGLISH_PAIRS.length,20);assert.equal(PHONICS.length,20);
  assert.equal(new Set(BLEND_GROUPS.flat()).size,30);
  assert.equal(new Set(WORDS.map(w=>w.id)).size,WORDS.length);
  for(const word of WORKSHOP_WORDS)word.chunks.forEach((_,index)=>assert.ok(CLIPS[chunkClip(word.id,index)]));
  for(const [stage,previous]of [[6,33],[7,36],[8,27],[9,20],[10,24]])assert.ok(WORDS.filter(w=>w.level===stage).length>=previous*2);
  for(const story of STORIES){assert.equal(story.pages.length,10);for(const page of story.pages){assert.ok(hasArt(page.target)||COLORS.some(c=>c.id===page.target));assert.ok(page.speech&&!/[א-ת]/u.test(page.speech));if(page.choices){assert.equal(new Set(page.choices).size,page.choices.length);assert.equal(page.choices.filter(c=>c===page.target).length,1);}}}
});

test('All 53 letters have at least two truthful illustrated and spoken examples',()=>{
  for(const [language,letters]of Object.entries(LETTERS))for(const letter of letters){
    const examples=LETTER_EXAMPLES[letter.id];assert.ok(examples.length>=2);
    for(const example of examples){
      assert.ok(hasArt(example.id));assert.ok(CLIPS[example.clip],example.clip);
      const plain=example.text.replace(/[\u0591-\u05c7]/gu,'');
      assert.equal(example.position==='end'?plain.at(-1):plain[0],letter.familiar);
    }
    const html=letterExampleCards(letter);assert.equal((html.match(/<mark>/gu)||[]).length,examples.length);
    assert.ok(html.includes(`dir="${language==='hebrew'?'rtl':'ltr'}"`));
  }
});

test('Child address never changes the gender or wording of a story or a word model',()=>{
  const boy=profileSpeech({address:'male',voice:'dvir'}),girl=profileSpeech({address:'female',voice:'ariel'});
  for(const key of Object.keys(CLIPS).filter(k=>/^(journey-story-|journey-context-|journey-chunk-)/u.test(k))){assert.deepEqual(boy(key),[key]);assert.deepEqual(girl(key),[key]);}
  assert.match(CLIPS['journey-story-garden-9'].speech,/muχanˈa/u);
  assert.match(CLIPS['journey-story-little-party-8'].speech,/muχanˈa/u);
  assert.ok(letterExampleCards(LETTERS.hebrew[0]).includes('data-learning-text'));
});

test('Supported English can reach the full bank while introducing only one fresh word per round',()=>{
  const items=Object.fromEntries(['dog','cat','red','blue'].map(id=>[`english:single:${id}`,cleanItem({independent:1,seen:1})]));
  const seen=new Set(['dog','cat','red','blue']);
  for(let visit=0;visit<ENGLISH_WORDS.length-4;visit++){
    const plan=newJourney('english','single',items,{rng:seeded(visit)}),questions=journeyQuestions(plan);
    const fresh=questions.filter(q=>q.newWord);assert.equal(fresh.length,1);assert.equal(fresh[0].model,true);
    const id=fresh[0].target.id;assert.ok(!seen.has(id));
    for(const q of questions){assert.ok(q.choices.every(c=>seen.has(c.id)||c.id===id));assert.equal(q.choices.filter(c=>c.id===q.answer).length,1);assert.ok(CLIPS[q.clip]);}
    items[`english:single:${id}`]=cleanItem({seen:1,independent:1});seen.add(id);
    assert.deepEqual(journeyQuestions(cleanJourney(JSON.parse(JSON.stringify(plan)))),questions);
  }
  assert.equal(seen.size,ENGLISH_WORDS.length);
  assert.equal(journeyQuestions(newJourney('english','single',items)).filter(q=>q.newWord).length,0);
  for(const group of BLEND_GROUPS)for(const word of group){assert.ok(CLIPS[`journey-en-${word}`]);for(const letter of word)assert.ok(PHONICS.some(p=>p.id===letter));}
});

test('Object work and classic arithmetic cover varied cases and keep parent caps and ascending difficulty',()=>{
  assert.equal(objectCases('bonds',20).length,190);assert.equal(objectCases('tens',20).length,91);
  const seen={quantity:new Set(),bonds:new Set(),tens:new Set(),takeaway:new Set()},additions=new Set(),objects=new Set();
  for(let visit=0;visit<300;visit++){
    const math=createSession('math',{mathMax:20},seeded(visit));
    for(const q of math){objects.add(q.item);if(q.type==='add')additions.add(`${q.a}:${q.b}`);}
    for(const kind of Object.keys(seen)){
      const plan=newJourney('objects',kind,{}, {mathMax:20,rng:seeded(visit)}),questions=journeyQuestions(plan);
      for(let i=0;i<10;i++){const q=questions[i];seen[kind].add(`${q.total}:${q.known}`);assert.ok(q.total<= (kind==='tens'?100:kind==='takeaway'?8:20));assert.ok(q.known>=0&&q.known<=q.total);if(i)assert.ok(q.total>=questions[i-1].total);}
      assert.deepEqual(journeyQuestions(cleanJourney(JSON.parse(JSON.stringify(plan)))),questions);
    }
  }
  assert.ok(additions.size>=150);assert.equal(objects.size,6);
  for(const kind of Object.keys(seen))assert.equal(seen[kind].size,objectCases(kind,20).length,kind);
});

test('Clock chapters draw from larger banks but remain short, reproducible, and resumable',()=>{
  const seen=CLOCK_LESSONS.map(()=>new Set());
  for(let visit=1;visit<=400;visit++)for(let lesson=0;lesson<10;lesson++){
    const tasks=clockLessonTasks(lesson,visit);assert.ok(tasks.length<=10);assert.ok(tasks.length>=baseline.clockTasks[lesson].length*2);
    assert.deepEqual(tasks,clockLessonTasks(lesson,visit));
    tasks.forEach(task=>seen[lesson].add(JSON.stringify(task)));
    const position={lesson,index:tasks.length-1,total:tasks.at(-1).start,seed:visit};
    assert.deepEqual(sanitizeClockPosition(position),position);
  }
  for(let lesson=0;lesson<10;lesson++)assert.equal(seen[lesson].size,new Set(CLOCK_LESSONS[lesson].tasks.map(t=>JSON.stringify(t))).size);
});

test('Character challenges rotate through the full set of distractor pairs',()=>{
  for(const level of ['family','paw-all']){
    const cases=new Map();
    for(let visit=0;visit<600;visit++)for(const q of createCharacterSession({characterLevel:level,characterPractice:{completed:{[level]:visit}}},seeded(visit)).slice(7)){
      const key=q.character.id,choices=q.options.filter(c=>c.id!==key).map(c=>c.id).sort().join(':');
      if(!cases.has(key))cases.set(key,new Set());cases.get(key).add(choices);
    }
    assert.ok([...cases.values()].every(variants=>variants.size>=10));
  }
});

test('Learning history retains items beyond the old limit and enforces the new bounded capacity',()=>{
  const items=Object.fromEntries(Array.from({length:2048},(_,i)=>[`read:existing-${i}`,{seen:1,independent:3}]));
  const expanded=applyObservation(items,{item:'read:expanded-probe',domain:'hebrew',kind:'independent',at:1793680000000});
  assert.equal(Object.keys(cleanItems(expanded)).length,2049);assert.equal(expanded['read:existing-10'].independent,3);
  const full=Object.fromEntries(Array.from({length:MAX_LEARNING_ITEMS},(_,i)=>[`read:item-${i}`,{seen:1}]));
  assert.equal(applyObservation(full,{item:'read:over-limit',domain:'hebrew',kind:'seen',at:1793680000000}),full);
});
