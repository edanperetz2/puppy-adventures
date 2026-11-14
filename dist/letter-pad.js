import { advanceTrace } from './letters.js';

export const PEN_LIFT_MS = 650;
export function writingDuration(length) { return Math.max(650, Math.min(6500, length * 12)); }

export function mountLetterPad(container, {
  motion = true, completeMessage = 'כל הכבוד! כתבת את האות!',
  onComplete = () => {}, onStartNeeded = () => {}, onDemoComplete = () => {},
} = {}) {
  const svg = container.querySelector('svg');
  const guides = [...svg.querySelectorAll('[data-stroke]')];
  const layer = svg.querySelector('.letter-ink');
  const marker = svg.querySelector('.letter-start');
  const direction = svg.querySelector('.letter-direction');
  const pencil = svg.querySelector('.writing-pencil');
  const caption = container.querySelector('[role="status"]');
  const events = new AbortController();
  let animation = 0, destroyed = false, mode = 'trace', stroke = 0, progress = 0, pointer = null, shown = 0, previousTracePoint = null;
  const lengths = guides.map(path => path.getTotalLength());
  const points = guides.map((path, i) => {
    const count = Math.max(2, Math.ceil(lengths[i] / 4));
    return Array.from({ length: count }, (_, n) => path.getPointAtLength(lengths[i] * n / (count - 1)));
  });
  const ink = guides.map(path => {
    const copy = path.cloneNode();
    copy.removeAttribute('data-stroke'); copy.setAttribute('pathLength', '1');
    copy.style.strokeDasharray = '1'; copy.style.strokeDashoffset = '1'; copy.style.opacity = '0'; layer.append(copy);
    return copy;
  });
  function cancel() { cancelAnimationFrame(animation); animation = 0; pencil.setAttribute('hidden', ''); }
  function startMarker(index, offset = 0) {
    const point = points[index][offset];
    marker.removeAttribute('hidden'); marker.setAttribute('transform', `translate(${point.x} ${point.y})`);
    marker.querySelector('text').textContent = index + 1;
    const trail = points[index].slice(offset, offset + 9);
    const end = trail.at(-1), before = trail.at(-2) || point;
    const angle = Math.atan2(end.y - before.y, end.x - before.x);
    direction.removeAttribute('hidden');
    direction.querySelector('.letter-direction-line').setAttribute('d', trail.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' '));
    direction.querySelector('.letter-direction-tip').setAttribute('d', `M${end.x - 7 * Math.cos(angle - .55)} ${end.y - 7 * Math.sin(angle - .55)}L${end.x} ${end.y}L${end.x - 7 * Math.cos(angle + .55)} ${end.y - 7 * Math.sin(angle + .55)}`);
  }
  function reset() {
    cancel(); mode = 'trace'; stroke = 0; progress = 0; shown = 0; pointer = null; previousTracePoint = null;
    for (const path of ink) { path.style.strokeDashoffset = '1'; path.style.opacity = '0'; }
    startMarker(0); caption.textContent = 'מתחילות בנקודה הירוקה · אפשר באצבע או בעכבר';
  }
  function step() {
    if (destroyed) return;
    if (mode !== 'steps' || shown === guides.length) reset();
    cancel(); mode = 'steps';
    ink[shown].style.strokeDashoffset = '0'; ink[shown].style.opacity = '1'; startMarker(shown);
    caption.textContent = `קו ${shown + 1} מתוך ${guides.length}`;
    shown++;
  }
  function demo() {
    if (destroyed) return;
    if (!motion) { step(); return; }
    reset(); mode = 'demo'; marker.setAttribute('hidden', ''); direction.setAttribute('hidden', '');
    let index = 0, beginning = null, pauseUntil = 0;
    function frame(now) {
      if (destroyed || mode !== 'demo') return;
      if (now < pauseUntil) { animation = requestAnimationFrame(frame); return; }
      if (beginning === null) {
        beginning = now; marker.setAttribute('hidden', ''); direction.setAttribute('hidden', ''); pencil.removeAttribute('hidden');
        caption.textContent = `קו ${index + 1} מתוך ${guides.length} · עוקבות אחרי העיפרון`;
      }
      const duration = writingDuration(lengths[index]);
      const fraction = Math.min(1, (now - beginning) / duration);
      ink[index].style.strokeDashoffset = String(1 - fraction);
      ink[index].style.opacity = '1';
      const point = guides[index].getPointAtLength(lengths[index] * fraction);
      pencil.setAttribute('cx', point.x); pencil.setAttribute('cy', point.y);
      if (fraction === 1) {
        index++; beginning = null;
        pencil.setAttribute('hidden', '');
        if (index === guides.length) {
          pencil.setAttribute('hidden', ''); startMarker(0);
          caption.textContent = 'עכשיו תורך! התחילי בנקודה הירוקה';
          onDemoComplete();
          return;
        }
        startMarker(index); pauseUntil = now + PEN_LIFT_MS;
        caption.textContent = `מרימות את העיפרון · ממשיכות לנקודה ${index + 1}`;
      }
      animation = requestAnimationFrame(frame);
    }
    animation = requestAnimationFrame(frame);
  }
  function pointAt(event) {
    const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
    const matrix = svg.getScreenCTM();
    return matrix ? point.matrixTransform(matrix.inverse()) : null;
  }
  function move(event) {
    if (pointer !== event.pointerId || destroyed) return;
    event.preventDefault();
    const point = pointAt(event); if (!point) return;
    progress = advanceTrace(points[stroke], progress, point, 25, previousTracePoint || points[stroke][progress]);
    previousTracePoint = point;
    ink[stroke].style.strokeDashoffset = String(1 - progress / (points[stroke].length - 1));
    ink[stroke].style.opacity = progress > 0 ? '1' : '0';
  }
  svg.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer !== null || destroyed) return;
    if (mode !== 'trace' || stroke === guides.length) reset();
    const point = pointAt(event); if (!point) return;
    const start = points[stroke][progress];
    if (Math.hypot(point.x - start.x, point.y - start.y) > 30) {
      caption.textContent = 'מתחילות בנקודה הירוקה, וממשיכות על הקו'; onStartNeeded(); return;
    }
    event.preventDefault(); pointer = event.pointerId; previousTracePoint = null; direction.setAttribute('hidden', ''); svg.setPointerCapture(event.pointerId);
    if (lengths[stroke] < 8) progress = points[stroke].length - 1;
    move(event);
  }, { signal: events.signal });
  svg.addEventListener('pointermove', move, { signal: events.signal });
  svg.addEventListener('pointerup', event => {
    if (pointer !== event.pointerId) return;
    move(event); pointer = null;
    if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
    if (progress < points[stroke].length - 3) { startMarker(stroke, progress); caption.textContent = 'אפשר להמשיך מהנקודה הירוקה'; return; }
    ink[stroke].style.strokeDashoffset = '0'; ink[stroke].style.opacity = '1'; stroke++; progress = 0; previousTracePoint = null;
    if (stroke === guides.length) {
      marker.setAttribute('hidden', ''); direction.setAttribute('hidden', ''); caption.textContent = completeMessage; onComplete();
    } else { startMarker(stroke); caption.textContent = `נהדר! עכשיו קו ${stroke + 1} מתוך ${guides.length}`; }
  }, { signal: events.signal });
  function releasePointer() {
    pointer = null; previousTracePoint = null;
    if (mode === 'trace' && stroke < guides.length) startMarker(stroke, progress);
  }
  svg.addEventListener('pointercancel', releasePointer, { signal: events.signal });
  svg.addEventListener('lostpointercapture', releasePointer, { signal: events.signal });
  reset();
  return { demo, step, reset, destroy() { destroyed = true; cancel(); events.abort(); } };
}
