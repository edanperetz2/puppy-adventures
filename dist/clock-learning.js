import { clockTime } from './clock.js';

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

export function taskClips(lesson, task) {
  if (lesson.journey) return [task.duration===1?'school-minute-task':'school-duration-task'];
  const hand = task.hand || lesson.hand;
  if (hand === 'face') return ['school-find-number', `number-${task.number}`];
  if (lesson.turn) return ['school-turn-task'];
  if (hand === 'hour') return ['school-drag-hour', `number-${clockParts(task.total).hour}`];
  if (hand === 'minute' && !lesson.minutes) return ['school-drag-minute','number-12'];
  return ['school-set-time', ...learningTime(task.total).clips];
}

export function taskSucceeded(lesson, task, total, moved) {
  if (!moved || !Number.isFinite(total)) return false;
  if (lesson.journey) return Math.abs(total - task.start - task.duration) < .5;
  if (lesson.turn) return Math.abs(total - task.start - 60) < 1;
  return clockTotal(clockParts(total).hour, clockParts(total).minute) === task.total;
}

export function sanitizeClockPosition(value) {
  const lesson = Number.isInteger(value?.lesson) && value.lesson >= 0 && value.lesson < 10 ? value.lesson : 0;
  const index = Number.isInteger(value?.index) && value.index >= 0 && value.index < CLOCK_LESSONS[lesson].tasks.length ? value.index : 0;
  const total = Number.isInteger(value?.total) && value.total >= 0 && value.total < 720 ? value.total : CLOCK_LESSONS[lesson].tasks[index].start;
  return { lesson, index, total };
}
