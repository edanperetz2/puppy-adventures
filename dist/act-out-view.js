import { art, uiIcon } from './art.js?v=2.6.1-animal-stories';
import { CLIPS, COLORS, WORDS } from './content.js?v=2.6.1-animal-stories';
import { paintedReadingObject } from './reading-scenes.js?v=2.6.1-animal-stories';
import { actOutMatches, actOutPlan, actOutPrompt } from './act-out.js?v=2.6.1-animal-stories';

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
  const animal = spec.kind === 'action';
  const jumping = animal && spec.action === 'jump';
  const feeding = animal && spec.action === 'eat';
  const lane = destination => travelPoints[plan.destinations.indexOf(destination)][0];
  const stopPoint = destination => {
    if (feeding) return [lane(destination), 70];
    if (travel) return travelPoints[plan.destinations.indexOf(destination)];
    return points[spec.anchor][destination];
  };
  const label = text => nikud ? text : text.replace(/[\u0591-\u05bd\u05bf-\u05c7]/gu, '');
  let selected = null, drag = null, suppressClick = null;
  let flight = null;
  const played = [...moves];
  const container = spec.anchor === 'box' || spec.anchor === 'basket';
  const decorations = animal ? '' : travel
    ? plan.destinations.map((id, index) => `<span class="act-landmark" style="--x:${travelPoints[index][0]}%">${art(id)}</span>`).join('')
    : `<span class="act-anchor act-anchor-${spec.anchor}">${container ? '' : art(spec.anchor)}</span>${container ? '<span class="act-container-rim"></span>' : ''}`;
  const animalStops = () => plan.destinations.map(destination => {
    const id = spec.size ? spec.object : destination;
    const name = `${names.get(id)}${spec.size ? destination === 'small' ? ' קטן' : ' גדול' : ''}`;
    const action = jumping ? 'jump' : 'place';
    return `<button type="button" class="act-animal${destination === 'small' ? ' act-animal-small' : ''}" data-act-${action}="${destination}" style="--x:${lane(destination)}%" aria-label="${jumping ? 'קפיצה' : 'האכלה'} · ${name}">
      <span class="act-animal-picture">${art(id)}</span>${feeding ? `<span class="act-animal-plate">${art('plate')}</span>` : ''}<span class="act-animal-check" hidden>${uiIcon('check')}</span>
    </button>`;
  }).join('');
  const placesMarkup = () => plan.destinations.map(destination => {
    const [x, y] = stopPoint(destination);
    const title = travel ? `ליד ${names.get(destination)}` : placeNames[spec.anchor][destination];
    return `<button type="button" class="act-place" data-act-place="${destination}" style="--x:${x}%;--y:${y}%" aria-label="${title}"></button>`;
  }).join('');
  const piecesMarkup = () => plan.pieces.map((piece, i) => {
    const id = feeding ? piece.food : spec.object;
    const name = `${names.get(id)}${piece.color ? ` · ${names.get(piece.color)}` : piece.size ? piece.size === 'small' ? ' · קטן' : ' · גדול' : group ? ` ${i + 1}` : ''}`;
    return `<button type="button" class="act-piece" data-act-piece="${i}" aria-pressed="false" aria-label="${name}">
        ${paintedReadingObject(id, piece.color, art(id, piece.size === 'small' ? 'act-small' : ''))}
      </button>`;
  }).join('');

  root.innerHTML = `<p class="act-instruction" id="act-instruction">${label(CLIPS[actOutPrompt(word)].text)}${jumping ? '' : ` <span>${label('אֶפְשָׁר לִגְרֹר, אוֹ לָגַעַת בַּחֵפֶץ וְאָז בַּמָּקוֹם.')}</span>`}</p>
    <div class="act-playfield" data-scene="${spec.anchor || spec.action}" data-kind="${spec.kind}" aria-describedby="act-instruction" role="group" aria-label="תמונת הסיפור">
      <div class="act-scenery" aria-hidden="true">${decorations}</div>
      ${animal ? animalStops() : placesMarkup()}
      <div class="act-landed" aria-hidden="true"></div>
      ${jumping ? '' : `<div class="act-tray" role="group" aria-label="חלקים להזזה">${piecesMarkup()}</div>`}
    </div>`;
  const field = root.querySelector('.act-playfield');
  const landed = root.querySelector('.act-landed');
  const pieces = [...root.querySelectorAll('.act-piece')];
  const places = [...root.querySelectorAll('[data-act-place]')];
  const jumpers = [...root.querySelectorAll('[data-act-jump]')];
  const tray = root.querySelector('.act-tray');
  const animalButton = animal ? (jumping ? jumpers : places)[plan.destinations.indexOf(plan.target)] : null;
  const canAnimate = node => motion() && !matchMedia('(prefers-reduced-motion: reduce)').matches && typeof node.animate === 'function';
  let complete = resolved;
  let preview = null;
  let placementTap = null;

  function showMoves() {
    for (const [index, button] of pieces.entries()) {
      button.disabled = complete || played.includes(index);
      button.classList.toggle('act-used', played.includes(index));
      button.setAttribute('aria-pressed', String(selected === index));
    }
    if (tray) tray.hidden = complete;
    for (const button of places) {
      button.disabled = complete || (!feeding && selected === null && !drag?.active);
      button.classList.toggle('act-over', preview === button.dataset.actPlace);
    }
    for (const button of jumpers) button.disabled = complete;
    if (animalButton && complete) animalButton.querySelector('.act-animal-check').hidden = false;
    field.classList.toggle('act-active', selected !== null || Boolean(drag?.active));
    field.classList.toggle('act-finished', complete);
  }

  function land(index, origin) {
    if (jumping) {
      const jumper = animalButton.querySelector('.act-animal-picture');
      animalButton.classList.add('act-jumped');
      if (!origin || !canAnimate(jumper)) return null;
      return jumper.animate([
        { transform: 'translateY(22px) scaleY(.86)' },
        { transform: `translateY(${spec.object === 'cat' ? -36 : -26}px) rotate(-6deg)`, offset: .50 },
        { transform: 'none' },
      ], { duration: 480, easing: 'ease-out' });
    }
    const [x, y] = stopPoint(plan.target);
    const [dx, dy] = group ? groupOffsets[plan.count - 2][played.indexOf(index)] : [0, 0];
    const item = document.createElement('span');
    item.className = `act-placed${group || feeding ? ' act-placed-small' : ''}`;
    item.dataset.actLanded = index;
    item.style.left = `${x + dx}%`;
    item.style.top = `${y + dy}%`;
    item.innerHTML = pieces[index].innerHTML;
    landed.append(item);
    if (!origin || !canAnimate(item)) {
      if (feeding) item.hidden = true;
      return null;
    }
    const bounds = item.getBoundingClientRect();
    const dxFrom = origin.x - bounds.left - bounds.width / 2;
    const dyFrom = origin.y - bounds.top - bounds.height / 2;
    const from = `translate(-50%, -50%) translate(${dxFrom}px, ${dyFrom}px)`;
    const scale = `scale(${origin.width / bounds.width})`;
    const arrive = [{ transform: `${from} ${scale}` }, { transform: 'translate(-50%, -50%)' }];
    if (!feeding) return item.animate(arrive, { duration: 320, easing: 'ease-out' });
    const eater = animalButton.querySelector('.act-animal-picture');
    eater.animate([{ transform: 'none' }, { transform: 'translateY(9px) rotate(7deg)' }, { transform: 'none' }], { delay: 140, duration: 420 });
    const bite = item.animate([
      arrive[0], { ...arrive[1], offset: .56 }, { opacity: 1, transform: 'translate(-50%, -50%) scale(.8)', offset: .79 },
      { opacity: 0, transform: 'translate(-50%, -90%) scale(.35)' },
    ], { duration: 540, easing: 'ease-out', fill: 'forwards' });
    return bite;
  }

  function move(index, destination, origin) {
    if (complete || played.includes(index)) return;
    if (!actOutMatches(word, plan, index, destination)) {
      selected = jumping ? null : index;
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
      if (!animation) onFinish();
      else void animation.finished.then(() => {
        if (feeding && landed.lastElementChild) {
          landed.lastElementChild.hidden = true;
          animation.cancel();
        }
        onFinish();
      }, () => {});
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
      if (button === suppressClick && event.detail) return;
      if (feeding && selected === null) pieces.find(piece => !piece.disabled)?.focus({ preventScroll: true });
      else place(button);
    } else if (button.hasAttribute('data-act-jump')) {
      move(0, button.dataset.actJump, true);
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
