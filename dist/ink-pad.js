const MAX_STROKES = 40;
const MAX_POINTS_PER_STROKE = 150;
const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function cleanInk(raw, width = 320, height = width) {
  return (Array.isArray(raw) ? raw : []).slice(0, MAX_STROKES).filter(Array.isArray)
    .map(line => line.slice(0, MAX_POINTS_PER_STROKE).filter(point =>
      Array.isArray(point) && point.length === 2 && point.every(Number.isFinite) &&
      point[0] >= 0 && point[0] <= width && point[1] >= 0 && point[1] <= height,
    ).map(point => point.map(Math.round))).filter(line => line.length);
}

export function mountInkPad(svg, { saved = [], onChange = () => {}, canDraw = () => true } = {}) {
  const events = new AbortController();
  const { width, height } = svg.viewBox.baseVal;
  const layer = svg.querySelector('.free-ink');
  let lines = cleanInk(saved, width, height), pointer = null;

  const hasInk = () => lines.reduce((sum, line) =>
    sum + line.slice(1).reduce((length, point, i) => length + distance(point, line[i]), 0), 0,
  ) >= 35;
  const render = () => {
    layer.innerHTML = lines.map(line =>
      `<path d="${line.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ')}"/>`,
    ).join('');
  };
  const changed = () => { render(); onChange(lines); };

  function pointAt(event) {
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const point = svg.createSVGPoint();
    point.x = event.clientX; point.y = event.clientY;
    const { x, y } = point.matrixTransform(matrix.inverse());
    return [Math.max(0, Math.min(width, x)), Math.max(0, Math.min(height, y))];
  }
  function appendPoint(event) {
    const point = pointAt(event), line = lines.at(-1);
    if (point && line.length < MAX_POINTS_PER_STROKE && distance(point, line.at(-1)) > 2) {
      line.push(point);
      changed();
    }
  }

  svg.addEventListener('pointerdown', event => {
    if (pointer !== null || event.button !== 0 || !canDraw() || lines.length >= MAX_STROKES) return;
    const point = pointAt(event);
    if (!point) return;
    event.preventDefault();
    pointer = event.pointerId;
    svg.setPointerCapture(pointer);
    lines.push([point]);
    changed();
  }, { signal: events.signal });
  svg.addEventListener('pointermove', event => {
    if (pointer !== event.pointerId) return;
    event.preventDefault();
    appendPoint(event);
  }, { signal: events.signal });
  svg.addEventListener('pointerup', event => {
    if (pointer !== event.pointerId) return;
    appendPoint(event);
    pointer = null;
  }, { signal: events.signal });
  for (const name of ['pointercancel', 'lostpointercapture']) {
    svg.addEventListener(name, event => {
      if (pointer === event.pointerId) pointer = null;
    }, { signal: events.signal });
  }

  render();
  return {
    hasInk,
    hasMarks: () => lines.length > 0,
    clear() {
      if (pointer !== null && svg.hasPointerCapture(pointer)) svg.releasePointerCapture(pointer);
      pointer = null;
      lines = [];
      changed();
    },
    destroy() { events.abort(); pointer = null; },
  };
}
