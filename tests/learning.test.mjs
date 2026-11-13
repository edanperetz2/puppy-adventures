import {recognitionTargets,sanitizeLetterPractice} from '../dist/letter-progress.js';
import{LETTERS}from'../dist/letters.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { applyObservation,learningStage,choosePractice,mergePark,englishPairsReady } from '../dist/learning.js';
import { LearningStore } from '../dist/learning-sync.js';
import { newJourney,journeyQuestions,cleanJourney } from '../dist/journey.js';
import { WORKSHOP_WORDS,STORIES } from '../dist/journey-content.js';
import { CLIPS,WORDS } from '../dist/content.js';
import { packRound,unpackRound,cleanDrafts,roundKey } from '../dist/session-state.js';
import { createSession,DEFAULT_SETTINGS,finishSession,freshProgress } from '../dist/engine.js';
import { SharedAlbum } from '../dist/sync.js';
import { ChildProfiles,GAME_KEY } from '../dist/profiles.js';
import { cleanInk } from '../dist/free-writing.js';
import { syncClock } from './helpers/sync-clock.mjs';

const memory=()=>{const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
const time=Date.UTC(2026,10,1,12);
test('An encounter, supported answer, independent answer and later memory stay distinct',()=>{
 let items=applyObservation({}, {item:'read:dog',domain:'hebrew',kind:'seen',at:time});
 assert.equal(learningStage(items['read:dog']),'seen');
 items=applyObservation(items,{item:'read:dog',domain:'hebrew',kind:'helped',at:time});
 assert.equal(learningStage(items['read:dog']),'supported');assert.equal(items['read:dog'].seen,1);
 items=applyObservation(items,{item:'read:dog',domain:'hebrew',kind:'independent',at:time+1000});assert.equal(learningStage(items['read:dog']),'independent');
 items=applyObservation(items,{item:'read:dog',domain:'hebrew',kind:'independent',at:time+86400000});assert.equal(learningStage(items['read:dog']),'remembered');
 const practice=applyObservation({}, {item:'letter:hebrew:alef:copy',domain:'letters',kind:'practice',mode:'copy',at:time});assert.equal(learningStage(practice['letter:hebrew:alef:copy']),'practice');assert.equal(practice['letter:hebrew:alef:copy'].independent,0);
});
test('Review favours an overdue supported item and never infers knowledge from an old album',()=>{
 const items=applyObservation({}, {item:'read:dog',domain:'hebrew',kind:'helped',at:time-7*86400000});
 assert.deepEqual(choosePractice([{id:'cat'},{id:'dog'}],items,w=>`read:${w.id}`,1,time,()=>.5).map(x=>x.id),['dog']);assert.equal(englishPairsReady({}),false);
});
function service(){const albums=new Map();return async(_url,init)=>{const b=JSON.parse(init.body);let a=albums.get(b.access_code);if(!a){a={items:{},park:{},acks:{}};albums.set(b.access_code,a);}let ack=a.acks[b.writer_key]||0;for(const e of b.observations){if(e.seq<=ack)continue;if(e.seq!==ack+1)return {ok:false,json:async()=>({})};a.items=applyObservation(a.items,e);ack=e.seq;}a.acks[b.writer_key]=ack;a.park=mergePark(a.park,b.park_changes);return {ok:true,json:async()=>({version:1,ack,items:structuredClone(a.items),park:structuredClone(a.park)})};};}
const code='2AB3CD4EF5GH6JK7MN8PQ9RS';

test('Throttled learning preserves a multi-batch backlog and park after reopening, with automatic catch-up and no duplicates',async()=>{
 const api=service(),clock=syncClock(),storage=memory();let limited=true,calls=0;
 const fetcher=(...args)=>{calls++;return limited?Promise.resolve(Response.json({message:'sync_rate_limited',details:'{"retry_after":60}'},{status:429})):api(...args);};
 let store=new LearningStore({storage,config:{url:'https://example.test',key:'public'},getCode:()=>code,fetcher,now:()=>time,retryOptions:clock.options});
 for(let i=0;i<75;i++)store.record({item:`read:word-${i}`,domain:'hebrew'},'independent');
 store.decorate(4,'tree');await store.flush();assert.equal(store.status,'throttled');assert.equal(store.pending,76);
 const before=calls;await Promise.all(Array.from({length:20},()=>store.flush()));assert.equal(calls,before);
 clock.close();store=new LearningStore({storage,config:{url:'https://example.test',key:'public'},getCode:()=>code,fetcher,now:()=>time,retryOptions:clock.options});
 assert.equal(store.items['read:word-74'].independent,1);assert.equal(store.park[4].type,'tree');await store.flush();
 limited=false;await clock.advance(60251);assert.equal(calls,before+3);assert.equal(store.pending,0);assert.equal(store.status,'synced');
 await store.flush();const other=new LearningStore({storage:memory(),config:{url:'https://example.test',key:'public'},getCode:()=>code,fetcher:api,now:()=>time});await other.flush();
 assert.equal(Object.keys(other.items).length,75);assert.equal(other.items['read:word-74'].independent,1);assert.equal(other.park[4].type,'tree');
});

test('Changing family during a cooldown cancels its retry and keeps the next family independent',async()=>{
 const api=service(),clock=syncClock();let link=code,limited=true;
 const store=new LearningStore({storage:memory(),config:{url:'https://example.test',key:'public'},getCode:()=>link,now:()=>time,retryOptions:clock.options,fetcher:(...args)=>limited?Promise.resolve(Response.json({},{status:429})):api(...args)});
 store.record({item:'read:dog',domain:'hebrew'},'independent');await store.flush();assert.equal(store.status,'throttled');
 link='9AB3CD4EF5GH6JK7MN8PQ9RS';limited=false;await store.flush();await clock.advance(60251);
 assert.deepEqual(store.items,{});assert.equal(store.pending,0);assert.equal(store.status,'synced');
});
test('Two devices share learning and park changes, retries and duplicate observations count once',async()=>{
 const fetcher=service(),config={url:'https://example.test',key:'public'},one=memory(),two=memory();
 let link=null;
 const a=new LearningStore({storage:one,config,getCode:()=>link,fetcher,now:()=>time});
 a.record({item:'read:dog',domain:'hebrew',eventId:'round-1:0'},'independent');a.record({item:'read:dog',domain:'hebrew',eventId:'round-1:0'},'independent');assert.equal(a.items['read:dog'].independent,1);
 const reopened=new LearningStore({storage:one,config,getCode:()=>link,fetcher,now:()=>time});assert.equal(reopened.pending,1);
 link=code;await reopened.flush();await reopened.flush();assert.equal(reopened.pending,0);
 const b=new LearningStore({storage:two,config,getCode:()=>code,fetcher,now:()=>time+1000});await b.flush();assert.equal(b.items['read:dog'].independent,1);
 b.record({item:'read:dog',domain:'hebrew'},'helped');b.decorate(4,'tree');await b.flush();await b.flush();await reopened.flush();assert.equal(reopened.items['read:dog'].helped,1);assert.equal(reopened.park[4].type,'tree');
 const before=reopened.state.seq;await reopened.flush();assert.equal(reopened.state.seq,before);assert.equal(reopened.items['read:dog'].seen,1);
});
test('An answer entered during an upload remains pending until the following batch confirms it',async()=>{
 const fetch=service(),storage=memory();let release,first=true;
 const store=new LearningStore({storage,config:{url:'https://example.test',key:'public'},getCode:()=>code,now:()=>time,fetcher:async(...args)=>{if(first){first=false;await new Promise(r=>release=r);}return fetch(...args);}});
 store.record({item:'read:dog',domain:'hebrew'},'independent');store.record({item:'read:cat',domain:'hebrew'},'helped');release();await store.flush();await store.flush();assert.equal(store.pending,0);assert.equal(store.items['read:cat'].helped,1);assert.equal(store.items['read:dog'].independent,1);
});
test('A different family never receives another family’s pending practice',async()=>{
 let link=code;const store=new LearningStore({storage:memory(),config:{url:'https://example.test',key:'public'},getCode:()=>link,fetcher:service(),now:()=>time});await store.flush();link=null;store.record({item:'read:dog',domain:'hebrew'},'helped');link='9AB3CD4EF5GH6JK7MN8PQ9RS';await store.flush();assert.deepEqual(store.items,{});
});
test('Saved adventures resume their exact questions, attempted answers, help and completed step',()=>{
 for(const mission of ['hebrew','english','math','clock','letters','characters']){
   const settings={...DEFAULT_SETTINGS,clockLevel:'minutes'},questions=createSession(mission,settings);
   const original={id:crypto.randomUUID(),key:roundKey(mission,settings),mission,questions,index:4,resolved:true,helped:new Set([1,4]),observed:new Set([0,1,2,3,4]),attempted:new Set([questions[4].options.find(o=>o.id!==questions[4].answer).id]),counted:new Set(['0','2']),reading:settings.reading,letterLanguage:settings.letterLanguage,letterIds:mission==='letters'?[...new Set(questions.map(q=>q.letter.id))]:null,clockLevel:settings.clockLevel,characterLevel:settings.characterLevel,characterMode:settings.characterMode,at:time};
   const packed=JSON.parse(JSON.stringify(packRound(original))),restored=unpackRound(packed);assert.ok(restored,mission);assert.deepEqual(restored.questions.map(q=>[q.type,q.answer,q.options.map(o=>o.id)]),questions.map(q=>[q.type,q.answer,q.options.map(o=>o.id)]));assert.equal(restored.resolved,true);assert.deepEqual([...restored.helped],[1,4]);assert.equal(restored.at,time);assert.equal(cleanDrafts({[original.key]:packed})[original.key].at,time);
 }
 assert.equal(unpackRound({mission:'hebrew',questions:Array(10).fill({word:'<script>'})}),null);
});
test('An unfinished ten-question adventure still resumes at question nine and earns its original score', () => {
  const mission = 'math';
  const questions = [...createSession(mission), ...createSession(mission).slice(0, 4)];
  const saved = packRound({
    id: crypto.randomUUID(), key: 'math:default', mission, questions, index: 8,
    resolved: true, attempted: [], counted: [], helped: [1, 8], observed: [8],
  });
  const resumed = unpackRound(JSON.parse(JSON.stringify(saved)));
  assert.equal(resumed.index, 8);
  assert.equal(resumed.resolved, true);
  assert.equal(resumed.questions.length, 10);
  assert.deepEqual(resumed.questions[8].options.map(option => option.id), saved.questions[8].options);
  assert.deepEqual([...resumed.observed], [8]);
  const original = finishSession(freshProgress(), 'hebrew').progress;
  const { progress } = finishSession(original, mission, resumed.helped.size, null, resumed.questions.length);
  assert.equal(progress.stickers.length, 2);
  assert.equal(progress.stars, 16);
  assert.equal(progress.skills.math.correct, 10);
});
test('A completed round receipt prevents a repeated reward after reopening the shared album',()=>{
 const storage=memory(),album=new SharedAlbum({storage,config:{},fetcher:async()=>{throw Error('offline');}});
 album.state={code,device:crypto.randomUUID(),own:freshProgress(),confirmed:freshProgress(),remote:freshProgress()};
 const id=crypto.randomUUID();album.complete('hebrew',0,null,id);const again=new SharedAlbum({storage,config:{},fetcher:async()=>{throw Error('offline');}});assert.equal(again.complete('hebrew',0,null,id).progress.sessions,1);assert.equal(again.progress.stickers.length,1);
});
test('All new activities have six executable steps and restore without changing their plan',()=>{
 const cases=[...Array.from({length:4},(_,i)=>['workshop',i+1]),...STORIES.map(s=>['stories',s.id]),['english','single'],['english','pairs'],['english','cars'],['objects','quantity'],['objects','bonds'],['objects','tens'],['objects','takeaway'],['sounds','sounds'],['sounds','blend']];
 for(const [mode,level] of cases){const plan=newJourney(mode,level,{}, {mathMax:5,rng:()=>.41}),questions=journeyQuestions(plan);assert.equal(questions.length,6);for(const q of questions){assert.ok(CLIPS[q.prompt]);if(q.clip)assert.ok(CLIPS[q.clip]);if(q.kind==='story'&&q.page.task!=='place')assert.ok(q.choices.includes(q.answer));if(q.kind==='chunks')assert.equal(q.pieces.join('').normalize('NFC'),q.word.pointed.normalize('NFC'));}
   plan.index=5;plan.state={chosen:[0],quantity:2,tokens:[1],resolved:true,showModel:true};const restored=cleanJourney(JSON.parse(JSON.stringify(plan)));assert.ok(restored);assert.deepEqual(journeyQuestions(restored),questions);assert.equal(restored.state.resolved,true);assert.equal(restored.state.showModel,true);const odd=cleanJourney({...plan,helped:3,observed:'bad'});assert.ok(odd);assert.deepEqual(odd.helped,[]);assert.deepEqual(odd.observed,[]);
   if(mode==='objects')for(let i=1;i<questions.length;i++)assert.ok(questions[i].total>=questions[i-1].total);
   if(mode==='workshop')for(let i=1;i<questions.length;i++)assert.ok(questions[i].entry.level>=questions[i-1].entry.level);
 }
});
test('English starts with familiar words, introduces one new word, and pairs use only two familiar words',()=>{
 const plan=newJourney('english','single',{}, {rng:()=>.5}),qs=journeyQuestions(plan);assert.deepEqual(qs.slice(0,3).map(q=>q.kind),['single','single','single']);assert.equal(qs.filter(q=>q.newWord).length,1);assert.ok(qs.slice(0,3).every(q=>q.choices.length===2));assert.ok(qs.every(q=>q.clip.startsWith('en-')));
 const pairs=journeyQuestions(newJourney('english','pairs',{}, {rng:()=>.5}));assert.ok(pairs.slice(0,3).every(q=>q.kind==='single'));assert.equal(pairs[0].target.id,'ball');assert.equal(pairs[0].model,true);assert.ok(pairs.slice(3).every(q=>q.target.object==='ball'));assert.ok(pairs.slice(3).every(q=>q.kind==='pair'&&q.clip.slice('journey-en-'.length).split('-').length===2));
});
test('Six-step stories preserve the original ending, recordings and access to every middle page', () => {
  for (const story of STORIES) {
    const seen = new Set();
    const plan = newJourney('stories', story.id);
    for (let seed = 0; seed < 12; seed++) {
      const questions = journeyQuestions({ ...plan, seed });
      const pageIds = questions.map(task => story.pages.indexOf(task.page));
      assert.equal(pageIds.length, 6);
      assert.equal(pageIds[0], 0);
      assert.equal(pageIds.at(-1), story.pages.length - 1);
      assert.deepEqual(pageIds, [...new Set(pageIds)].sort((a, b) => a - b));
      for (const [index, task] of questions.entries()) {
        const clip = `journey-story-${story.id}-${pageIds[index]}`;
        assert.equal(CLIPS[clip].text, task.page.text);
        assert.equal(CLIPS[task.prompt].text, task.page.prompt);
        seen.add(pageIds[index]);
      }
    }
    assert.equal(seen.size, story.pages.length, story.id);
  }
});
test('Workshop syllables, reading text, name namespaces and ink remain bounded and separate',()=>{
 for(const entry of WORKSHOP_WORDS)assert.equal(entry.chunks.map(c=>c.text).join('').normalize('NFC'),WORDS.find(w=>w.id===entry.id).pointed.normalize('NFC'));
 const storage=memory();storage.setItem(GAME_KEY,JSON.stringify({progress:{sessions:26}}));const profiles=new ChildProfiles(storage);const ariel=profiles.active,yuli=profiles.add({name:'יולי',address:'female'});profiles.storageFor(ariel.id).setItem('learning-state','ariel');profiles.storageFor(yuli.id).setItem('learning-state','yuli');assert.equal(profiles.storageFor(ariel.id).getItem('learning-state'),'ariel');assert.equal(JSON.parse(storage.getItem(GAME_KEY)).progress.sessions,26);
 assert.deepEqual(cleanInk([[[0,0],[12,30],[-1,300],[Infinity,40]]]),[[[0,0],[12,30]]]);
});

test('Recognition continues across devices after partial practice without fabricating mastery',()=>{const practice=sanitizeLetterPractice(null),first=LETTERS.hebrew[0],second=LETTERS.hebrew[1];practice.hebrew.recognition[0]=2;const observed=applyObservation({}, {item:`letter:hebrew:${second.id}:recognition`,domain:'letters',kind:'helped',at:time});const next=recognitionTargets(practice,'hebrew',observed,time);assert.ok(!next.includes(first));assert.ok(!next.includes(second));const review=recognitionTargets(practice,'hebrew',observed,time+3*86400000);assert.ok(review.includes(second));});
