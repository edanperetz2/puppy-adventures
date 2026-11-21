import test from 'node:test';
import assert from 'node:assert/strict';
import { TRIAL_AREAS, TRIAL_CUES, clearTrialSaves, newTrialRound, restoreTrialRound, trialChoices } from '../dist/trial-path.js';
import { trialRecording } from '../dist/trial-voice.js';
import { studioSpeech } from '../dist/trial-theater.js';
import { CLIPS } from '../dist/content.js';
import { openAriel, GAME_KEY, FAMILY_KEY } from '../dist/profiles.js';
import { isChapterAvailable, isPracticeAvailable } from '../dist/availability.js';

test('each trial instruction, observation, hint, and studio line has a Hebrew Ava cue',()=>{
  const lines = [...Object.values(TRIAL_CUES),...studioSpeech];
  for(const area of TRIAL_AREAS) {
    lines.push(area.title);
    for(const game of area.games){
      lines.push(game.title);
      if(game.studio)continue;
      for(const steps of [game.steps,...game.variants||[]]){
        assert.equal(steps.length,6);
        for(const step of steps) {
          lines.push(step.prompt,step.result);
          if(step.hint)lines.push(step.hint);
          const ids=step.choices.map(c=>c.id);
          assert.ok(ids.length>0);
          assert.equal(new Set(ids).size,ids.length);
          for(const id of step.correct||[])assert.ok(ids.includes(id));
        }
      }
    }
  }
  for(const line of lines) {
    const clip=CLIPS[trialRecording(line)];
    assert.equal(clip?.lang,'he-IL',line);
    assert.ok(clip.speech,line);
  }
  assert.equal(isPracticeAvailable('clock'),false);
  assert.equal(isPracticeAvailable('science'),false);
  assert.equal(isChapterAvailable('boatyard'),false);
  assert.equal(isChapterAvailable('theater'),false);
});

test('trial saves keep predictions, current results, and choice order through reload',()=>{
  for(const area of TRIAL_AREAS) for(const game of area.games.filter(g=>!g.studio)){
    let previous;
    for(let n=0;n<2;n++){
      const round=newTrialRound(game,previous,740+n);
      if(previous&&game.variants?.length)assert.notEqual(round.variant,previous.variant);
      const steps=(round.variant?game.variants[round.variant-1]:game.steps);
      for(const [index,step] of steps.entries()){
        const order=trialChoices(step.choices,round.seed,index);
        assert.deepEqual(order.map(c=>c.id).sort(),step.choices.map(c=>c.id).sort());
        round.selected=step.correct?.[0]||step.choices.at(-1).id;
        const saved=restoreTrialRound(game,JSON.parse(JSON.stringify(round)));
        assert.deepEqual(saved,round);
        assert.deepEqual(trialChoices(step.choices,saved.seed,index),order);
        round.answers.push(round.selected);round.selected=null;
      }
      round.finished=true;
      assert.deepEqual(restoreTrialRound(game,round),round);
      assert.equal(restoreTrialRound(game,{...round,answers:['invalid']}),null);
      previous=round;
    }
  }
});

test('resetting trial storage addresses only its own per-activity keys',()=>{
  const backing=new Map();
  const storage=openAriel({getItem:key=>backing.get(key)??null,setItem:(k,v)=>backing.set(k,v),removeItem:k=>backing.delete(k)});
  storage.setItem(GAME_KEY,'existing album, 100 stickers');
  storage.setItem(FAMILY_KEY,'existing pairing');
  storage.setItem('learning-state','existing learning history');
  for(const area of TRIAL_AREAS) for(const g of area.games)storage.setItem('puppy-trial-v1:'+area.id+':'+g.id,'trial state');
  clearTrialSaves(storage);
  assert.deepEqual([...backing.keys()],[GAME_KEY,FAMILY_KEY,'learning-state']);
});
