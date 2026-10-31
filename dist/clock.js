import { CLOCK_MINUTE_LABELS } from './clock-school-content.js';
export const HOUR_NAMES = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש', 'שש', 'שבע', 'שמונה', 'תשע', 'עשר', 'אחת עשרה', 'שתים עשרה'];
export const CLOCK_LEVELS = {
  hours: { name: 'שעות עגולות', minutes: [0] },
  halves: { name: 'שעות וחצאי שעות', minutes: [0, 30] },
  quarters: { name: 'גם רבעים', minutes: [0, 15, 30, 45] },
  minutes: { name: 'כל הדקות · דקה אחרי דקה', minutes: Array.from({length:60},(_,i)=>i) },
};

export function clockTime(hour, minute = 0) {
  if (!Number.isInteger(hour) || hour < 1 || hour > 12 || !Number.isInteger(minute) || minute < 0 || minute > 59) throw new RangeError('Invalid learning-clock time');
  const next = hour % 12 + 1;
  const familiar = [0,15,30,45].includes(minute);
  const quantity = CLOCK_MINUTE_LABELS[minute];
  const he = minute === 0 ? HOUR_NAMES[hour] : minute === 15 ? `${HOUR_NAMES[hour]} ורבע` : minute === 30 ? `${HOUR_NAMES[hour]} וחצי` : minute === 45 ? `רבע ל${HOUR_NAMES[next]}` : `${quantity} אחרי השעה ${HOUR_NAMES[hour]}`;
  const clip = familiar ? `clock-time-${hour}-${minute}` : null;
  return { id: `${hour}-${minute}`, hour, minute, he, digital: `${hour}:${String(minute).padStart(2, '0')}`, clip, clips: familiar ? [clip] : [`school-minutes-${minute}`,'school-after-hour',`number-${hour}`] };
}

export const clockConceptRank = minute => minute === 0 ? 0 : minute === 30 ? 1 : minute === 15 ? 2 : minute === 45 ? 3 : minute % 5 === 0 ? 4 : minute < 10 ? 5 : 6;

export function clockAngles(hour, minute) {
  return { hour: (hour % 12) * 30 + minute / 2, minute: minute * 6 };
}

export function analogClock(hour, minute, { className = '', highlight = '', interactive = false } = {}) {
  const angle = clockAngles(hour, minute);
  const marks = Array.from({ length: 60 }, (_, i) => `<line x1="140" y1="${i % 5 ? 22 : 19}" x2="140" y2="${i % 5 ? 26 : 29}" transform="rotate(${i * 6} 140 140)" stroke="${i % 5 ? '#ded4df' : '#b9a8bb'}" stroke-width="${i % 5 ? 1.5 : 2.5}" stroke-linecap="round"/>`).join('');
  const numbers = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const a = n * Math.PI / 6;
    return `<text x="${(140 + 94 * Math.sin(a)).toFixed(3)}" y="${(140 - 94 * Math.cos(a) + 7).toFixed(3)}" text-anchor="middle" direction="ltr" font-family="Rubik,Arial,sans-serif" font-size="22" font-weight="600" fill="#66536f">${n}</text>`;
  }).join('');
  const face = `<svg class="analog-clock ${className} ${highlight ? `highlight-${highlight}` : ''}" viewBox="0 0 280 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="שעון עם מחוג שעות קצר וסגול ומחוג דקות ארוך וירוק">
    <circle cx="140" cy="144" r="133" fill="#e8deea"/>
    <circle cx="140" cy="140" r="130" fill="#c8b3d7"/>
    <circle cx="140" cy="140" r="120" fill="#fffcf4"/>
    ${marks}${numbers}<circle cx="140" cy="140" r="62" fill="#f4eef1" opacity=".5"/>
    <g class="clock-minute-hand" transform="rotate(${angle.minute} 140 140)"><path d="M140 153V53" stroke="#368b7d" stroke-width="7" stroke-linecap="round"/><circle cx="140" cy="60" r="3" fill="#8fc5a9"/></g>
    <g class="clock-hour-hand" transform="rotate(${angle.hour} 140 140)"><path d="M140 151V84" stroke="#9066b1" stroke-width="11" stroke-linecap="round"/><path d="M140 87V101" stroke="#cdb0e1" stroke-width="3" stroke-linecap="round"/></g>
    <circle cx="140" cy="140" r="10" fill="#fffcf4"/><circle cx="140" cy="140" r="6" fill="#b49ac4"/>
  </svg>`;
  if (!interactive) return face;
  const buttons = Array.from({ length: 12 }, (_, i) => {
    const n = i + 1;
    const a = n * Math.PI / 6;
    return `<button class="dial-hour ${n === hour ? 'selected' : ''}" data-action="clock-set-hour" data-hour="${n}" style="left:${50 + 94 / 280 * 100 * Math.sin(a)}%;top:${50 - 94 / 280 * 100 * Math.cos(a)}%" aria-label="בחירת השעה ${HOUR_NAMES[n]}" aria-pressed="${n === hour}"></button>`;
  }).join('');
  return `<div class="explorable-clock">${face}<div class="dial-buttons" role="group" aria-label="בחירת שעה על השעון">${buttons}</div></div>`;
}
