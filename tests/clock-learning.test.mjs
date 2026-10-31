import test from 'node:test';
import assert from 'node:assert/strict';
import { CLOCK_LESSONS,clockParts,clockTotal,angleDelta,pointAngle,dragMinute,dragHour,setClockHour,learningTime,taskClips,taskSucceeded,sanitizeClockLessons,recordClockLesson,hasClockLesson,clockLessonCount,nextClockLesson,sanitizeClockPosition,journeyMinutes,realMinuteSeconds } from '../dist/clock-learning.js';
import { clockAngles } from '../dist/clock.js';
import { CLIPS } from '../dist/content.js';
import { freshProgress,sanitizeProgress,finishSession } from '../dist/engine.js';

test('Ten lessons start with concrete time quantities, then numbers, hands, hours, fractions and minutes',()=>{
  assert.equal(CLOCK_LESSONS.length,10);
  assert.equal(CLOCK_LESSONS[0].journey,true);
  assert.deepEqual(CLOCK_LESSONS.slice(0,4).map(l=>l.hand),['minute','face','hour','both']);
  assert.equal(CLOCK_LESSONS[4].turn,true);
  assert.deepEqual(CLOCK_LESSONS.slice(5,8).map(l=>clockParts(l.tasks[0].total).minute),[30,15,45]);
  assert.equal(CLOCK_LESSONS[8].minutes,true);
  for(const lesson of CLOCK_LESSONS){
    assert.ok(lesson.tasks.length>=2);
    for(const clip of lesson.intro)assert.equal(CLIPS[clip]?.lang,'he-IL');
    for(const task of lesson.tasks){
      for(const clip of taskClips(lesson,task))assert.equal(CLIPS[clip]?.lang,'he-IL');
      if(lesson.hand!=='face'){
        assert.notEqual(task.start,task.total);
        assert.equal(taskSucceeded(lesson,task,task.start,false),false);
        assert.equal(taskSucceeded(lesson,task,task.total,false),false,'A demonstration cannot count as her own attempt');
        assert.equal(taskSucceeded(lesson,task,task.total,true),true);
      }
    }
  }
});
test('Minute dragging crosses twelve in either direction and a full circle advances one hour',()=>{
  assert.equal(angleDelta(350,10),20);assert.equal(angleDelta(10,350),-20);
  assert.deepEqual(clockParts(dragMinute(11*60+55,30)),{hour:12,minute:0});
  assert.deepEqual(clockParts(dragMinute(0,-30)),{hour:11,minute:55});
  assert.equal(dragMinute(180,360),240);
  assert.deepEqual(clockParts(dragMinute(690,360)),{hour:12,minute:30});
  for(const [x,y,angle] of [[0,-10,0],[10,0,90],[0,10,180],[-10,0,270]])assert.equal(pointAngle(x,y),angle);
});
test('The hour hand advances between numbers and hour adjustment keeps the chosen minutes',()=>{
  const total=dragMinute(180,180),parts=clockParts(total);
  assert.deepEqual(parts,{hour:3,minute:30});assert.equal(clockAngles(parts.hour,parts.minute).hour,105);
  assert.equal(dragHour(total,165),330);assert.deepEqual(clockParts(setClockHour(210,7)),{hour:7,minute:30});
  assert.deepEqual(clockParts(dragHour(690,15)),{hour:12,minute:30});
});
test('Full-turn tasks require a real clockwise circuit, not the same minute-hand position',()=>{
  const lesson=CLOCK_LESSONS[4],task=lesson.tasks[0];
  for(const total of [task.start,task.start-60,task.start+120])assert.equal(taskSucceeded(lesson,task,total,true),false);
  assert.equal(taskSucceeded(lesson,task,task.start+60,true),true);
});
test('All 720 minute positions have exact Hebrew narration, including twelve and quarter to',()=>{
  for(let total=0;total<720;total++){const t=learningTime(total);assert.ok(t.he);assert.match(t.digital,/^(?:[1-9]|1[0-2]):[0-5][0-9]$/);for(const clip of t.clips)assert.equal(CLIPS[clip]?.lang,'he-IL');}
  assert.equal(learningTime(clockTotal(12,45)).he,'רבע לאחת');
  assert.deepEqual(learningTime(125).clips,['school-minutes-5','school-after-hour','number-2']);
  assert.equal(learningTime(181).he,'דקה אחת אחרי השעה שלוש');
  assert.equal(learningTime(182).he,'שתי דקות אחרי השעה שלוש');
  assert.equal(learningTime(193).he,'שלוש עשרה דקות אחרי השעה שלוש');
  assert.equal(learningTime(212).he,'שלושים ושתיים דקות אחרי השעה שלוש');
  assert.equal(learningTime(235).he,'חמישים וחמש דקות אחרי השעה שלוש');
});
test('Lesson milestones survive old saves and do not mint stickers or invent old learning',()=>{
  let mask=0;
  for(let i=0;i<10;i++){assert.equal(nextClockLesson(mask),i);mask=recordClockLesson(mask,i);assert.equal(clockLessonCount(mask),i+1);assert.equal(recordClockLesson(mask,i),mask);assert.equal(hasClockLesson(mask,i),true);}
  assert.equal(mask,1023);for(const value of [1024,-1,1.5,'1',NaN,null])assert.equal(sanitizeClockLessons(value),0);
  assert.equal(recordClockLesson(1,20),1);
  const old=finishSession(freshProgress(),'clock').progress;
  assert.equal(old.clockLessons,0,'An older clock quiz says nothing about completed teaching lessons');
  old.clockLessons=mask;const restored=sanitizeProgress(JSON.parse(JSON.stringify(old)));
  assert.equal(restored.clockLessons,1023);assert.equal(restored.sessions,1);assert.equal(restored.stickers.length,1);
});
test('Partial lesson positions are bounded and survive reopening without marking completion',()=>{
  const saved={lesson:5,index:1,total:327};assert.deepEqual(sanitizeClockPosition(JSON.parse(JSON.stringify(saved))),saved);
  assert.deepEqual(sanitizeClockPosition({lesson:100,index:-1,total:NaN}),{lesson:0,index:0,total:0});
  assert.equal(sanitizeClockPosition({lesson:5,index:90,total:8.5}).total,CLOCK_LESSONS[5].tasks[0].start);
});

test('Both draggable hands can select individual minutes and half-turns have predictable direction',()=>{
  assert.equal(dragMinute(180,6),181);
  assert.equal(dragMinute(180,138),203);
  assert.equal(dragHour(180,93.5),187);
  assert.equal(dragHour(180,101.5),203);
  assert.equal(dragHour(180,93.5,60),180,'The first hour-only lesson retains a forgiving hour snap');
  assert.equal(angleDelta(0,180),180);assert.equal(angleDelta(180,0),-180);
});

test('Sixty minute quantities make one hour, and a real minute measures sixty actual seconds',()=>{
  assert.deepEqual([0,1,5,30,59,60,61].map(n=>journeyMinutes(180,180+n)),[0,1,5,30,59,60,60]);
  const lesson=CLOCK_LESSONS[0],task=lesson.tasks[1];
  assert.equal(task.duration,60);assert.equal(taskSucceeded(lesson,task,59,true),false);assert.equal(taskSucceeded(lesson,task,60,true),true);
  assert.deepEqual([0,999,1000,59999,60000,90000].map(ms=>realMinuteSeconds(1000,1000+ms)),[0,0,1,59,60,60]);
  assert.equal(realMinuteSeconds(1000,500),0);
});
