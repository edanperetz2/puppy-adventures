// Tap and drag share the same placement action. Some touch browsers omit the
// compatibility click immediately after a drag.
export function mountDrag(root, { sources, targets, signal, onDrop, onTouchTap }) {
  let drag, suppressed;
  root.addEventListener('pointerdown', event => {
    const button = event.target.closest(sources);
    if (!button || button.disabled || drag || event.button !== 0 || !event.isPrimary) return;
    suppressed = null;
    drag = { button, id: event.pointerId, x: event.clientX, y: event.clientY, active: false };
    button.setPointerCapture(drag.id);
  }, { signal });

  const targetAt = (x, y) => [...root.querySelectorAll(targets)].find(target => {
    const box = target.getBoundingClientRect();
    return x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
  });
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
    highlight(null);
    drag = null;
    const tapped = !active && event.pointerType === 'touch';
    if (active || tapped) suppressed = button;
    if (event.type === 'pointerup') {
      const target = active && targetAt(event.clientX, event.clientY);
      if (target) onDrop(button, target);
      else if (tapped) onTouchTap(button);
    }
    button.classList.remove('is-dragging');
    button.style.translate = '';
  }
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) root.addEventListener(type, finish, { signal });
  return (event, button) => button !== suppressed || !event.detail;
}
