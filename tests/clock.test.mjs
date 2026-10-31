import test from 'node:test';
import assert from 'node:assert/strict';
import { clockAngles, clockTime, CLOCK_LEVELS, analogClock } from '../dist/clock.js';
import { CLIPS } from '../dist/content.js';
import { createSession, DEFAULT_SETTINGS, sanitizeSettings, sanitizeProgress, finishSession } from '../dist/engine.js';

function seeded(seed) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }

test('Both hands show real analog positions, including the moving hour hand', () => {
  for (const [h, m, hours, minutes] of [[12,0,0,0],[3,0,90,0],[3,30,105,180],[11,15,337.5,90],[12,45,22.5,270],[6,45,202.5,270]]) {
    assert.deepEqual(clockAngles(h,m), { hour:hours, minute:minutes });
    const rendered = analogClock(h,m);
    assert.ok(rendered.includes(`class="clock-hour-hand" transform="rotate(${hours} 140 140)"`));
    assert.ok(rendered.includes(`class="clock-minute-hand" transform="rotate(${minutes} 140 140)"`));
    assert.equal((rendered.match(/<text /g)||[]).length,12);
  }
});

test('Hebrew quarter-to phrases wrap correctly at twelve, with no digital reversal', () => {
  assert.equal(clockTime(3,30).he,'שלוש וחצי');
  assert.equal(clockTime(3,15).he,'שלוש ורבע');
  assert.equal(clockTime(3,45).he,'רבע לארבע');
  assert.equal(clockTime(12,45).he,'רבע לאחת');
  assert.equal(clockTime(12,45).digital,'12:45');
  assert.throws(()=>clockTime(0,0),RangeError);
  assert.throws(()=>clockTime(3,17),RangeError);
});

test('All three clock levels have ten distinct, solvable questions with Hebrew recordings', () => {
  for (const clockLevel of Object.keys(CLOCK_LEVELS)) for(let seed=0;seed<200;seed++) {
    const questions=createSession('clock',{...DEFAULT_SETTINGS,clockLevel},seeded(seed));
    assert.equal(questions.length,10);
    assert.equal(new Set(questions.map(q=>q.time.hour)).size,10);
    for(const [index,q] of questions.entries()){
      assert.equal(q.options.length,index<3?2:3);
      assert.equal(new Set(q.options.map(o=>o.id)).size,q.options.length);
      assert.equal(q.options.filter(o=>o.id===q.answer).length,1);
      assert.ok(CLOCK_LEVELS[clockLevel].minutes.includes(q.time.minute));
      assert.ok(CLIPS[q.prompt]); assert.ok(CLIPS[q.hint]);
      assert.equal(q.targetClip,undefined,'The prompt must not speak the correct answer');
      for(const option of q.options) assert.equal(CLIPS[option.clip]?.lang,'he-IL');
    }
    if(clockLevel==='hours')assert.ok(questions.every(q=>q.time.minute===0));
    if(clockLevel==='halves')assert.equal(questions.filter(q=>q.time.minute===30).length,6);
    if(clockLevel==='quarters')assert.deepEqual([...new Set(questions.map(q=>q.time.minute))].sort((a,b)=>a-b),[0,15,30,45]);
  }
});

test('Adding the clock preserves previous albums and defaults safely to whole hours', () => {
  const old={version:1,sessions:3,stars:18,stickers:['flower','boat','star'],missions:{hebrew:1,english:1,math:1},skills:{hebrew:{correct:6,assisted:1},english:{correct:6,assisted:2},math:{correct:6,assisted:0}}};
  const restored=sanitizeProgress(old);
  assert.equal(restored.sessions,3);assert.equal(restored.stars,18);
  assert.deepEqual(restored.stickers,old.stickers);assert.equal(restored.missions.clock,0);
  assert.deepEqual(restored.skills.clock,{correct:0,assisted:0});
  const result=finishSession(old,'clock',1).progress;
  assert.equal(result.sessions,4);assert.equal(result.stars,28);
  assert.equal(result.missions.clock,1);assert.equal(result.missions.hebrew,1);
  assert.equal(result.skills.english.assisted,2);
  assert.equal(sanitizeSettings({}).clockLevel,'hours');
  assert.equal(sanitizeSettings({clockLevel:'invalid'}).clockLevel,'hours');
  assert.equal(sanitizeSettings({clockLevel:'quarters'}).clockLevel,'quarters');
});
