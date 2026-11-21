export function mountTouchControls(root, selector, onTap, signal) {
  let touch, used = false;
  root.addEventListener('pointerdown', event => {
    used = false;
    const button = event.target.closest(selector);
    if (event.pointerType === 'touch' && event.isPrimary && button && !button.disabled) {
      touch = { button, id: event.pointerId, x: event.clientX, y: event.clientY };
    }
  }, { signal });
  root.addEventListener('pointerup', event => {
    if (touch?.id !== event.pointerId) return;
    const { button, x, y } = touch;
    touch = null;
    if (event.target.closest(selector) === button && Math.hypot(event.clientX - x, event.clientY - y) < 12) {
      used = true;
      onTap(button);
    }
  }, { signal });
  root.addEventListener('pointercancel', event => {
    if (touch?.id === event.pointerId) touch = null;
  }, { signal });
  return { suppress() { used = true; }, accepts: event => !used || !event.detail };
}

// Allow a finger-width of imprecision around a landing place. A direct hit
// always wins. Between nearby places, follow the nearest visible edge.
export function dropTargetAt(targets, x, y, margin = 24) {
  let closest = null;
  let edgeDistance = margin ** 2;
  let centerDistance = Infinity;
  for (const target of targets) {
    if (target.disabled || target.hidden) continue;
    const box = target.getBoundingClientRect();
    if (box.width <= 0 || box.height <= 0) continue;
    const dx = Math.max(box.left - x, x - box.right, 0);
    const dy = Math.max(box.top - y, y - box.bottom, 0);
    const edge = dx * dx + dy * dy;
    if (edge > edgeDistance) continue;
    const center = (x - box.left - box.width / 2) ** 2 + (y - box.top - box.height / 2) ** 2;
    if (edge < edgeDistance || center < centerDistance) {
      closest = target;
      edgeDistance = edge;
      centerDistance = center;
    } else if (center === centerDistance) {
      closest = null;
    }
  }
  return closest;
}

// Tap and drag share the same placement action. Some touch browsers omit the
// compatibility click immediately after a drag.
export function mountDrag(root, { sources, targets, signal, onDrop, onTouchTap }) {
  let drag, suppressed;
  root.addEventListener('pointerdown', event => {
    const button = event.target.closest(sources);
    if (!button || button.disabled || drag || event.button !== 0 || !event.isPrimary) return;
    suppressed = null;
    const box = button.getBoundingClientRect();
    drag = { button, id: event.pointerId, x: event.clientX, y: event.clientY, active: false,
      offsetX: box.left + box.width / 2 - event.clientX, offsetY: box.top + box.height / 2 - event.clientY };
    button.setPointerCapture(drag.id);
  }, { signal });

  const targetAt = (x, y) => {
    const zones = root.querySelectorAll(targets);
    // This controller moves the actual button, so a child can also place its
    // centre over a destination while holding a far corner of the picture.
    return dropTargetAt(zones, x, y, 0) || dropTargetAt(zones, x + drag.offsetX, y + drag.offsetY, 0) ||
      dropTargetAt(zones, x, y);
  };
  function highlight(target) {
    if (target === drag.target) return;
    drag.target?.classList.remove('is-drop-target');
    drag.target = target;
    target?.classList.add('is-drop-target');
  }
  root.addEventListener('pointermove', event => {
    if (drag?.id !== event.pointerId) return;
    const dx = event.clientX - drag.x, dy = event.clientY - drag.y;
    if (!drag.active && Math.hypot(dx, dy) < 8) return;
    drag.active = true;
    drag.button.classList.add('is-dragging');
    drag.button.style.translate = `${dx}px ${dy}px`;
    highlight(targetAt(event.clientX, event.clientY));
  }, { signal });

  function finish(event) {
    if (drag?.id !== event.pointerId) return;
    const { button, active } = drag;
    const target = event.type === 'pointerup' && active && targetAt(event.clientX, event.clientY);
    highlight(null);
    drag = null;
    const tapped = !active && event.pointerType === 'touch';
    if (active || tapped) suppressed = button;
    if (event.type === 'pointerup') {
      if (target) onDrop(button, target);
      else if (tapped) onTouchTap(button);
    }
    button.classList.remove('is-dragging');
    button.style.translate = '';
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) root.addEventListener(type, finish, { signal });
  return (event, button) => button !== suppressed || !event.detail;
}
