import { art } from './art.js';
import { COLORS, WORDS } from './content.js?v=2.6.0-stories';
import { paintedReadingObject } from './reading-scenes.js?v=2.6.0-stories';
import { ACT_OUT_INSTRUCTION, actOutMatches, actOutPlan } from './act-out.js?v=2.6.0-stories';

const names = new Map([...WORDS, ...COLORS].map(word => [word.id, word.he]));
const points = {
  box: { on: [39, 15], in: [39, 48], near: [77, 55] },
  table: { on: [41, 23], under: [41, 65], near: [78, 63] },
  tree: { above: [42, 11], on: [51, 37], near: [79, 63] },
  flower: { above: [42, 11], on: [42, 36], near: [78, 63] },
  basket: { in: [39, 48], near: [76, 55] },
};
const travelPoints = [[26, 56], [74, 56]];
const groupOffsets = [
  [[-8, 0], [8, 0]],
  [[0, -7], [-8, 5], [8, 5]],
  [[-8, -7], [8, -7], [-8, 5], [8, 5]],
];
const placeNames = {
  box: { on: 'על הקופסה', in: 'בתוך הקופסה', near: 'ליד הקופסה' },
  table: { on: 'על השולחן', under: 'מתחת לשולחן', near: 'ליד השולחן' },
  tree: { above: 'מעל העץ', on: 'על העץ', near: 'ליד העץ' },
  flower: { above: 'מעל הפרח', on: 'על הפרח', near: 'ליד הפרח' },
  basket: { in: 'בתוך הסל', near: 'ליד הסל' },
};

export function mountActOut(root, { word, roundId, moves, resolved, nikud, motion, onMove, onRetry, onFinish }) {
  const events = new AbortController();
  const spec = word.scene;
  const plan = actOutPlan(word, roundId);
  const travel = spec.kind === 'travel';
  const group = spec.kind === 'arrangement';
  const stopPoint = destination => travel ? travelPoints[plan.destinations.indexOf(destination)] : points[spec.anchor][destination];
  const label = text => nikud ? text : text.replace(/[\u0591-\u05bd\u05bf-\u05c7]/gu, '');
  let selected = null, drag = null, suppressClick = null;
  let flight = null;
  const played = [...moves];
  const container = spec.anchor === 'box' || spec.anchor === 'basket';
  const decorations = travel
    ? plan.destinations.map((id, index) => `<span class="act-landmark" style="--x:${travelPoints[index][0]}%">${art(id)}</span>`).join('')
    : `<span class="act-anchor act-anchor-${spec.anchor}">${container ? '' : art(spec.anchor)}</span>${container ? '<span class="act-container-rim"></span>' : ''}`;

  root.innerHTML = `<p class="act-instruction" id="act-instruction">${label(ACT_OUT_INSTRUCTION)} <span>${label('אֶפְשָׁר לִגְרֹר, אוֹ לָגַעַת בַּחֵפֶץ וְאָז בַּמָּקוֹם.')}</span></p>
    <div class="act-playfield" data-scene="${spec.anchor}" data-kind="${spec.kind}" aria-describedby="act-instruction" role="group" aria-label="תמונת הסיפור">
      <div class="act-scenery" aria-hidden="true">${decorations}</div>
      ${plan.destinations.map(destination => {
        const [x, y] = stopPoint(destination);
        const title = travel ? `ליד ${names.get(destination)}` : placeNames[spec.anchor][destination];
        return `<button type="button" class="act-place" data-act-place="${destination}" style="--x:${x}%;--y:${y}%" aria-label="${title}"></button>`;
      }).join('')}
      <div class="act-landed" aria-hidden="true"></div>
      <div class="act-tray" role="group" aria-label="חלקים להזזה">
        ${plan.pieces.map((piece, i) => `<button type="button" class="act-piece" data-act-piece="${i}" aria-pressed="false" aria-label="${names.get(spec.object)}${piece.color ? ` · ${names.get(piece.color)}` : piece.size ? piece.size === 'small' ? ' · קטן' : ' · גדול' : ` ${i + 1}`}">
          ${paintedReadingObject(spec.object, piece.color, art(spec.object, piece.size === 'small' ? 'act-small' : ''))}
        </button>`).join('')}
      </div>
    </div>`;
  const field = root.querySelector('.act-playfield');
  const landed = root.querySelector('.act-landed');
  const pieces = [...root.querySelectorAll('.act-piece')];
  const places = [...root.querySelectorAll('.act-place')];
  const tray = root.querySelector('.act-tray');
  let complete = resolved;
  let preview = null;
  let placementTap = null;

  function showMoves() {
    for (const [index, button] of pieces.entries()) {
      button.disabled = complete || played.includes(index);
      button.classList.toggle('act-used', played.includes(index));
      button.setAttribute('aria-pressed', String(selected === index));
    }
    tray.hidden = complete;
    for (const button of places) {
      button.disabled = complete || (selected === null && !drag?.active);
      button.classList.toggle('act-over', preview === button.dataset.actPlace);
    }
    field.classList.toggle('act-active', selected !== null || Boolean(drag?.active));
    field.classList.toggle('act-finished', complete);
  }

  function land(index, origin) {
    const [x, y] = stopPoint(plan.target);
    const [dx, dy] = group ? groupOffsets[plan.count - 2][played.indexOf(index)] : [0, 0];
    const item = document.createElement('span');
    item.className = `act-placed${group ? ' act-placed-small' : ''}`;
    item.dataset.actLanded = index;
    item.style.left = `${x + dx}%`;
    item.style.top = `${y + dy}%`;
    item.innerHTML = pieces[index].innerHTML;
    landed.append(item);
    if (!origin || !motion() || matchMedia('(prefers-reduced-motion: reduce)').matches || typeof item.animate !== 'function') return null;
    const bounds = item.getBoundingClientRect();
    const dxFrom = origin.x - bounds.left - bounds.width / 2;
    const dyFrom = origin.y - bounds.top - bounds.height / 2;
    const from = `translate(-50%, -50%) translate(${dxFrom}px, ${dyFrom}px)`;
    const scale = `scale(${origin.width / bounds.width})`;
    return item.animate([{ transform: `${from} ${scale}` }, { transform: 'translate(-50%, -50%)' }], { duration: 320, easing: 'ease-out' });
  }

  function move(index, destination, origin) {
    if (complete || played.includes(index)) return;
    if (!actOutMatches(word, plan, index, destination)) {
      selected = index;
      showMoves();
      onRetry();
      return;
    }
    const hadFocus = root.contains(document.activeElement);
    selected = null;
    played.push(index);
    complete = played.length === plan.count;
    showMoves();
    const animation = land(index, origin);
    if (hadFocus && !complete) pieces.find(piece => !piece.disabled)?.focus({ preventScroll: true });
    onMove([...played], complete);
    if (complete) {
      flight = animation;
      if (animation) void animation.finished.then(onFinish, () => {});
      else onFinish();
    }
  }

  function place(button) {
    if (selected === null || button.disabled) return;
    const bounds = pieces[selected].getBoundingClientRect();
    move(selected, button.dataset.actPlace, { x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2, width: bounds.width });
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled || complete) return;
    if (button.hasAttribute('data-act-piece')) {
      if (button === suppressClick && event.detail) return;
      suppressClick = null;
      const index = Number(button.dataset.actPiece);
      selected = selected === index ? null : index;
      showMoves();
      if (selected !== null && !event.detail) places[0].focus({ preventScroll: true });
    } else if (button.hasAttribute('data-act-place')) {
      if (button !== suppressClick || !event.detail) place(button);
    }
  }, { signal: events.signal });

  function hoverAt(event) {
    const target = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-act-place]');
    return target && root.contains(target) ? target.dataset.actPlace : null;
  }

  function clearDrag() {
    drag?.ghost?.remove();
    drag = null;
    preview = null;
    showMoves();
  }

  root.addEventListener('pointerdown', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled || event.button !== 0 || !event.isPrimary) return;
    suppressClick = null;
    placementTap = null;
    if (button.hasAttribute('data-act-place') && event.pointerType === 'touch') {
      placementTap = { button, pointer: event.pointerId, x: event.clientX, y: event.clientY };
      return;
    }
    if (!button.hasAttribute('data-act-piece') || !button.setPointerCapture) return;
    const bounds = button.getBoundingClientRect();
    drag = { button, pointer: event.pointerId, x: event.clientX, y: event.clientY, width: bounds.width, active: false };
    button.setPointerCapture(event.pointerId);
  }, { signal: events.signal });

  root.addEventListener('pointermove', event => {
    if (drag?.pointer !== event.pointerId) return;
    if (!drag.active) {
      if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 8) return;
      drag.active = true;
      drag.ghost = document.createElement('span');
      drag.ghost.className = 'act-drag-preview';
      drag.ghost.setAttribute('aria-hidden', 'true');
      drag.ghost.innerHTML = drag.button.innerHTML;
      drag.ghost.style.width = `${drag.width}px`;
      document.body.append(drag.ghost);
    }
    drag.ghost.style.left = `${event.clientX}px`;
    drag.ghost.style.top = `${event.clientY}px`;
    preview = hoverAt(event);
    showMoves();
  }, { signal: events.signal });

  root.addEventListener('touchmove', event => {
    if (drag) event.preventDefault();
  }, { signal: events.signal, passive: false });

  root.addEventListener('pointerup', event => {
    if (placementTap?.pointer === event.pointerId) {
      const { button, x, y } = placementTap;
      placementTap = null;
      if (Math.hypot(event.clientX - x, event.clientY - y) < 12 && hoverAt(event) === button.dataset.actPlace) {
        // The browser can suppress a compatibility click when a tap follows a drag.
        suppressClick = button;
        place(button);
      }
      return;
    }
    if (drag?.pointer !== event.pointerId) return;
    const { button, active, width } = drag;
    const destination = active && hoverAt(event);
    if (active) suppressClick = button;
    clearDrag();
    if (destination) move(Number(button.dataset.actPiece), destination, { x: event.clientX, y: event.clientY, width });
  }, { signal: events.signal });

  root.addEventListener('lostpointercapture', event => {
    if (drag?.pointer === event.pointerId) clearDrag();
    if (placementTap?.pointer === event.pointerId) placementTap = null;
  }, { signal: events.signal });
  root.addEventListener('pointercancel', event => {
    if (drag?.pointer === event.pointerId) clearDrag();
    if (placementTap?.pointer === event.pointerId) placementTap = null;
  }, { signal: events.signal });

  showMoves();
  for (const index of played) land(index);
  return { destroy() { events.abort(); clearDrag(); flight?.cancel(); } };
}
