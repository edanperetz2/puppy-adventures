import { clockTime } from './clock.js';
import { shuffle } from './answer-order.js';
import { LEGACY_SESSION_LENGTH, SESSION_LENGTH } from './adventure.js?v=2.2.2-six';

export const CLOCK_LESSON_COUNT = 10;
export const sanitizeClockLessons = value => Number.isInteger(value) && value >= 0 && value < 1024 ? value : 0;
export const hasClockLesson = (mask, index) => Number.isInteger(index) && index >= 0 && index < 10 && Boolean(sanitizeClockLessons(mask) & (1 << index));
export const recordClockLesson = (mask, index) => sanitizeClockLessons(mask) | (hasClockLesson(1023, index) ? 1 << index : 0);
export const nextClockLesson = mask => Array.from({ length: 10 }, (_, i) => i).find(i => !hasClockLesson(mask, i)) ?? 0;
export const clockLessonCount = mask => Array.from({ length: 10 }, (_, i) => i).filter(i => hasClockLesson(mask, i)).length;
export const journeyMinutes = (start,total) => Math.max(0,Math.min(60,Math.round(total-start)));
export const realMinuteSeconds = (start,now) => Math.max(0,Math.min(60,Math.floor((now-start)/1000)));

export function clockParts(total) {
  const normalized = ((Math.round(total) % 720) + 720) % 720;
  return { hour: Math.floor(normalized / 60) || 12, minute: normalized % 60 };
}
export const clockTotal = (hour, minute = 0) => (hour % 12) * 60 + minute;
export const angleDelta = (before, after) => {const delta=((after-before+540)%360)-180;return delta===-180&&after>before?180:delta;};
export const pointAngle = (x, y) => (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
export const dragMinute = (start, degrees) => Math.round(start + degrees / 6);
export function setClockHour(total, hour) {
  const minute = clockParts(total).minute;
  const base = Math.floor(total / 720) * 720 + (hour % 12) * 60 + minute;
  return [base - 720, base, base + 720].sort((a, b) => Math.abs(a - total) - Math.abs(b - total))[0];
}
export function dragHour(total,angle,step=1){
  const base=Math.floor(total/720)*720+Math.round(angle*2/step)*step;
  return [base-720,base,base+720].sort((a,b)=>Math.abs(a-total)-Math.abs(b-total))[0];
}

export function learningTime(total) {
  const { hour, minute } = clockParts(total);
  return clockTime(hour,minute);
}
const task = (hour, minute, startHour, startMinute = 0) => ({ total:clockTotal(hour, minute), start:clockTotal(startHour, startMinute) });
export const CLOCK_LESSONS = [
  { title:'דקות ושעות', subtitle:'60 דקות קטנות מתחברות לשעה אחת', intro:['school-duration'], hand:'minute', journey:true, demo:{start:0,total:60}, tasks:[{start:0,total:1,duration:1},{start:0,total:60,duration:60}] },
  { title:'המספרים מסביב', subtitle:'מגלות איפה מתחילים ולאיזה כיוון הולכים', intro:['school-face'], hand:'face', tasks:[3,6,9,12].map(number=>({number,start:0,total:0})) },
  { title:'המחוג הקצר', subtitle:'הסגול מספר לנו מה השעה', intro:['clock-hour-hand','school-controls'], hand:'hour', tasks:[task(3,0,12),task(6,0,3)] },
  { title:'הארוך ושעה עגולה', subtitle:'הירוק על 12, הסגול מראה את השעה', intro:['clock-minute-hand','clock-tip-0'], hand:'both', tasks:[{...task(3,0,3,30),hand:'minute'},{...task(6,0,6,15),hand:'minute'},task(5,0,2,15),task(8,0,5,30)] },
  { title:'סיבוב שלם', subtitle:'60 דקות הן שעה אחת', intro:['school-turn'], hand:'minute', turn:true, tasks:[{start:180,total:240},{start:540,total:600}] },
  { title:'חצי שעה', subtitle:'הארוך על 6, הקצר באמצע הדרך', intro:['clock-tip-30'], hand:'both', sector:true, tasks:[task(3,30,3),task(5,30,5)] },
  { title:'רבע אחרי', subtitle:'הארוך על 3 — עברו 15 דקות', intro:['clock-tip-15'], hand:'both', sector:true, tasks:[task(2,15,2),task(6,15,6)] },
  { title:'רבע לפני', subtitle:'הארוך על 9 — מתקרבות לשעה הבאה', intro:['clock-tip-45'], hand:'both', sector:true, tasks:[task(2,45,2,30),task(11,45,11,30)] },
  { title:'סופרות דקות', subtitle:'כל קו קטן הוא דקה אחת', intro:['school-minutes','school-fives'], hand:'minute', minutes:true, tasks:[task(2,1,2),task(2,3,2),task(2,5,2),task(2,10,2)] },
  { title:'אני בונה שעון!', subtitle:'מחברות את כל מה שגילינו', intro:['school-final'], hand:'both', tasks:[task(7,0,4,15),task(7,30,7),task(7,15,7),task(7,45,7,30),task(7,22,7,15)] },
];

const originalTaskCounts=CLOCK_LESSONS.map(lesson=>lesson.tasks.length);
// Keep the original exercise indexes intact for a lesson saved mid-way. New
// examples extend each chapter; completed chapter bits keep their meaning.
CLOCK_LESSONS[0].tasks.push(...[180,360].flatMap(start=>[{start,total:start+1,duration:1},{start,total:start+60,duration:60}]));
CLOCK_LESSONS[1].tasks.push(...[1,2,4,5,7,8,10,11].map(number=>({number,start:0,total:0})));
CLOCK_LESSONS[2].tasks.push(...[1,2,4,5,7,8,9,10,11,12].map(hour=>task(hour,0,hour%12+1)));
CLOCK_LESSONS[3].tasks.push(...[1,2,4,7,9,10,11,12].map(hour=>task(hour,0,(hour+2)%12+1,15)));
CLOCK_LESSONS[4].tasks.push(...[0,60,120,240,360,600].map(start=>({start,total:start+60})));
for(const [index,minute,oldHours] of [[5,30,[3,5]],[6,15,[2,6]],[7,45,[2,11]]]) {
  CLOCK_LESSONS[index].tasks.push(...Array.from({length:12},(_,i)=>i+1).filter(h=>!oldHours.includes(h)).map(hour=>task(hour,minute,hour,minute===45?30:0)));
}
CLOCK_LESSONS[8].tasks.push(...[11,12,13,14,16,17,18,19,21,22,23,24,26,27,28,29,31,33,36,38,41,43,46,48,51,53,57,59].map((minute,i)=>task(i%12+1,minute,i%12+1,Math.max(0,minute-5))));
CLOCK_LESSONS[9].tasks.push(...[23,24,26,27,28,29,31,32,34,36,37,38,41,43,46,48,51,56,59].map((minute,i)=>task(i%12+1,minute,(i+3)%12+1,15)));

// A saved lesson keeps the examples selected by its original seed and length.
export function clockLessonTasks(index,seed=1,shufflePractice=false,length=SESSION_LENGTH,variedPractice=false) {
  const bank=CLOCK_LESSONS[index].tasks,first=originalTaskCounts[index];
  let n=(seed+index*65537)>>>0;
  function draw() {
    n=(n+0x6d2b79f5)>>>0;
    let t=Math.imul(n^(n>>>15),n|1);
    t^=t+Math.imul(t^(t>>>7),t|61);
    return (t^(t>>>14))>>>0;
  }
  if (variedPractice && CLOCK_LESSONS[index].journey) {
    const sample = durations => durations[draw() % durations.length];
    const durations = [1, sample([2, 3, 4]), sample([5, 10, 12]), sample([20, 25, 28]), sample([35, 40, 50, 55]), 60];
    return durations.map(duration => {
      const start = 60 * (draw() % 11);
      return { start, total: start + duration, duration };
    });
  }
  if (variedPractice && CLOCK_LESSONS[index].turn) {
    const turn = bank[draw() % bank.length];
    const hours = Array.from({ length: 12 }, (_, i) => i + 1).filter(hour => clockTotal(hour) !== turn.total);
    const examples = shuffle(hours, () => draw() / 0x100000000).slice(0, length - 1).map((hour, i) => ({
      ...task(hour, 0, (hour + 11 - (i % 3)) % 12 + 1, [5, 10, 15, 20, 35][i]),
      hand: 'both',
    }));
    return [turn, ...examples];
  }
  if (variedPractice && index === 3) {
    const examples = shuffle(bank.slice(2), () => draw() / 0x100000000).slice(0, length - 1);
    return [bank[draw() % 2], ...examples];
  }
  // These lessons practice the same skill at different hours or numerals.
  if (shufflePractice && [1, 2, 5, 6, 7].includes(index)) return shuffle(bank, () => draw() / 0x100000000).slice(0, length);
  const extras=bank.slice(first).map((value,order)=>({value,order,tie:draw()}));
  const chosen=extras.sort((a,b)=>a.tie-b.tie).slice(0,Math.max(0,length-first)).sort((a,b)=>a.order-b.order).map(p=>p.value);
  return [...bank.slice(0,first),...chosen];
}

export function taskClips(lesson, task) {
  if (lesson.journey) {
    if (task.duration === 1) return ['school-minute-task'];
    if (task.duration === 60) return ['school-duration-task'];
    return [`school-minutes-${task.duration}`];
  }
  const hand = task.hand || lesson.hand;
  if (hand === 'face') return ['school-find-number', `number-${task.number}`];
  if (isFullTurn(lesson,task)) return ['school-turn-task'];
  if (hand === 'hour') return ['school-drag-hour', `number-${clockParts(task.total).hour}`];
  if (hand === 'minute' && !lesson.minutes) return ['school-drag-minute','number-12'];
  return ['school-set-time', ...learningTime(task.total).clips];
}

export const isFullTurn = (lesson, task) => Boolean(lesson.turn && task.total === task.start + 60);

export function taskSucceeded(lesson, task, total, moved) {
  if (!moved || !Number.isFinite(total)) return false;
  if (lesson.journey) return Math.abs(total - task.start - task.duration) < .5;
  if (isFullTurn(lesson,task)) return Math.abs(total - task.start - 60) < 1;
  return clockTotal(clockParts(total).hour, clockParts(total).minute) === task.total;
}

export function sanitizeClockPosition(value) {
  const lesson = Number.isInteger(value?.lesson) && value.lesson >= 0 && value.lesson < 10 ? value.lesson : 0;
  const seed=Number.isInteger(value?.seed)&&value.seed>0&&value.seed<=0xffffffff?value.seed:0;
  const shufflePractice=Boolean(seed)&&value?.shufflePractice===true;
  const length = seed && value?.length === SESSION_LENGTH ? SESSION_LENGTH : LEGACY_SESSION_LENGTH;
  const variedPractice = length === SESSION_LENGTH && value?.variedPractice === true;
  const tasks=seed?clockLessonTasks(lesson,seed,shufflePractice,length,variedPractice):CLOCK_LESSONS[lesson].tasks;
  const index = Number.isInteger(value?.index) && value.index >= 0 && value.index < tasks.length ? value.index : 0;
  const total = Number.isInteger(value?.total) && value.total >= 0 && value.total < 720 ? value.total : tasks[index].start;
  return { lesson, index, total,...(seed?{seed}:{}),...(shufflePractice?{shufflePractice}:{}),...(length === SESSION_LENGTH ? {length} : {}),...(variedPractice ? {variedPractice} : {}) };
}
