import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { WORDS, CLIPS } from '../dist/content.js';
import { PICTURE_PLACE_PASSAGES } from '../dist/reading-picture-places.js';
import { PICTURE_SCENE_PASSAGES } from '../dist/reading-picture-scenes.js';
import { readingWords, readingTargets, sanitizeReadingPractice, finishReadingPractice } from '../dist/reading.js';
import { createSession, DEFAULT_SETTINGS } from '../dist/engine.js';
import { art } from '../dist/art.js';
import { actOutMatches, actOutPlan, actOutSteps, canActOut } from '../dist/act-out.js';
import { packRound, unpackRound } from '../dist/session-state.js';
const additions=[...PICTURE_PLACE_PASSAGES,...PICTURE_SCENE_PASSAGES];
const ids=new Set(additions.map(word=>word.id));
const hash=value=>createHash('sha256').update(JSON.stringify(value)).digest('hex');
const rng=seed=>()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);

test('Short picture stories more than double at the same reading level and length',()=>{
  assert.equal(additions.length,360);
  assert.equal(readingWords('sentences').length,647);
  assert.equal(WORDS.length,1458);
  assert.equal(new Set(WORDS.map(word=>word.he)).size,WORDS.length);
  assert.equal(new Set(WORDS.map(word=>art(word.id))).size,WORDS.length);
  for(const word of additions){
    assert.equal(word.level,10);
    assert.ok(word.he.split(' ').length>=4&&word.he.split(' ').length<=5);
    assert.equal(CLIPS[`he-${word.id}`].speech,word.spoken);
    assert.ok(!/[א-ת]/u.test(word.spoken));
    assert.ok(readingWords('sentences').filter(other=>other.family===word.family).length>=3);
  }
  for(const object of ['banana','egg','cookie'])for(const count of [2,3,4]){
    const word=additions.find(w=>w.scene.object===object&&w.scene.count===count);
    assert.ok(word.pointed.startsWith({2:'שְׁתֵּי',3:'שָׁלוֹשׁ',4:'אַרְבַּע'}[count]));
  }
  assert.equal(new Set(additions.filter(w=>w.scene.kind==='travel').map(w=>w.scene.anchor)).size,12);
});

test('A practiced sentence bank keeps its history and offers the new passages before review',()=>{
  const original=readingWords('sentences').filter(word=>!ids.has(word.id));
  const saved={recent:{sentences:original.map(word=>word.id)}};
  let practice=sanitizeReadingPractice(saved),seen=new Set();
  assert.deepEqual(practice.recent.sentences,saved.recent.sentences);
  for(let visit=0;visit<36;visit++){
    const targets=readingTargets(readingWords('sentences'),practice.recent.sentences,10,rng(visit+1));
    assert.ok(targets.every(word=>ids.has(word.id)&&!seen.has(word.id)));
    targets.forEach(word=>seen.add(word.id));
    practice=sanitizeReadingPractice(JSON.parse(JSON.stringify(finishReadingPractice(practice,'sentences',targets))));
  }
  assert.equal(seen.size,360);
  for(let seed=0;seed<50;seed++){
    const round=createSession('hebrew',{...DEFAULT_SETTINGS,reading:'sentences',readingRecent:saved.recent.sentences},rng(seed+1));
    assert.equal(round.length,6);
    assert.ok(round.every(q=>ids.has(q.answer)&&q.options.every(o=>o.family===q.word.family)));
    for(const q of round)assert.equal(q.options.filter(o=>o.id===q.answer).length,1);
    for(let i=1;i<round.length;i++)assert.ok((round[i].word.scene.count||0)>=(round[i-1].word.scene.count||0));
  }
});

test('Every previous reading target and all 2114 original voice records remain unchanged',async()=>{
  const baseline=JSON.parse(await readFile(new URL('./fixtures/release-2.1-reading.json',import.meta.url),'utf8'));
  const originalWords=WORDS.filter(word=>!ids.has(word.id));
  assert.equal(originalWords.length,baseline.wordCount);
  assert.equal(hash(originalWords),baseline.wordDigest);
  const previouslyReleased = ([key]) => !/^(?:he-picture-|profile-good-luck|journey-give-|journey-apples-left$|number-workshop-|act-out$)/u.test(key);
  const originalClips=Object.fromEntries(Object.entries(CLIPS).filter(previouslyReleased));
  assert.equal(Object.keys(originalClips).length,baseline.clipCount);
  assert.equal(hash(originalClips),baseline.clipDigest);
  const recordings=JSON.parse(await readFile(new URL('../dist/assets/audio/manifest.json',import.meta.url),'utf8')).clips;
  assert.equal(hash(Object.fromEntries(Object.entries(recordings).filter(previouslyReleased))),baseline.recordingsDigest);
});

test('Acting out a sentence tests the correct object detail and its destination', () => {
  const ready = readingWords('sentences').filter(canActOut);
  const roundId = '02968f01-5fbd-4ecb-96dc-8d98339db381';
  assert.deepEqual(new Set(ready.map(word => word.scene.kind)), new Set(['position', 'arrangement', 'travel']));
  for (const word of ready) {
    const plan = actOutPlan(word, roundId);
    assert.deepEqual(actOutPlan(word, roundId), plan);
    assert.ok(plan.destinations.includes(plan.target));
    assert.ok(new Set(plan.destinations).size >= 2);
    if (word.scene.kind === 'travel') assert.equal(plan.target, word.scene.anchor);
    else assert.equal(plan.target, word.scene.position);
    if (word.scene.count) assert.equal(plan.pieces.length, word.scene.count + 1);
    const matching = plan.pieces.flatMap((_, index) => plan.destinations.filter(place => actOutMatches(word, plan, index, place)));
    assert.deepEqual(matching, Array(word.scene.count ? word.scene.count + 1 : 1).fill(plan.target), word.id);
  }
  for (let seed = 1; seed <= 40; seed++) {
    const questions = createSession('hebrew', { ...DEFAULT_SETTINGS, reading: 'sentences' }, rng(seed));
    const active = actOutSteps(questions);
    assert.ok(active.length <= 2 && active.every(index => canActOut(questions[index].word)));
    assert.ok(active.length < 2 || active[1] > active[0] + 1);
  }
});

test('Saved short stories keep the same props and only valid, distinct placements', () => {
  const questions = createSession('hebrew', { ...DEFAULT_SETTINGS, reading: 'sentences' }, rng(3));
  const word = additions.find(word => word.scene.kind === 'arrangement' && word.scene.count === 3);
  const index = 4;
  const id = '2ac22275-6605-4c48-a858-53e6a49c26ee';
  const alternatives = additions.filter(option => option.family === word.family && option !== word).slice(0, 2);
  questions[index] = { ...questions[index], word, options: [word, ...alternatives] };
  const raw = packRound({ id, mission: 'hebrew', reading: 'sentences', questions, index, attempted: [], helped: [], counted: [], actOutMoves: [0, 0, 2, 3, 99, '1'] });
  assert.equal(unpackRound(raw).questions[index].actOut, undefined);
  raw.questions[index].actOut = true;
  const restored = unpackRound(raw);
  assert.equal(restored.questions[index].actOut, true);
  assert.equal(restored.questions[index].prompt, 'act-out');
  assert.deepEqual(restored.actOutMoves, [0, 2]);
  assert.deepEqual(unpackRound({ ...raw, resolved: true, actOutMoves: [2] }).actOutMoves, [2, 0, 1]);
});
