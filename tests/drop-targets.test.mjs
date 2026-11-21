import test from 'node:test';
import assert from 'node:assert/strict';
import { dropTargetAt, mountDrag } from '../dist/drag.js';

function zone(left, top, width, height) {
  return {
    getBoundingClientRect: () => ({ left, top, width, height, right: left + width, bottom: top + height }),
    classList: { add() {}, remove() {} },
  };
}

test('drops a little outside a visible place land inside it, with a bounded circular margin', () => {
  const nearBox = zone(100, 40, 58, 58);
  assert.equal(dropTargetAt([nearBox], 177, 72), nearBox);
  assert.equal(dropTargetAt([nearBox], 157, 121), nearBox);
  assert.equal(dropTargetAt([nearBox], 176, 116), null);
  assert.equal(dropTargetAt([nearBox], 210, 72), null);
  assert.equal(dropTargetAt([nearBox], 177, 72, 0), null);
});

test('nearby places respect a direct or clearly closer choice, independent of DOM order', () => {
  const inside = zone(40, 40, 60, 60), beside = zone(118, 40, 60, 60);
  for (const zones of [[inside, beside], [beside, inside]]) {
    assert.equal(dropTargetAt(zones, 118, 70), beside);
    assert.equal(dropTargetAt(zones, 100, 70), inside);
    assert.equal(dropTargetAt(zones, 107, 70), inside);
    assert.equal(dropTargetAt(zones, 116, 70), beside);
    assert.equal(dropTargetAt(zones, 109, 70), null);
  }
  for (const invalid of [{ ...inside, disabled: true }, { ...inside, hidden: true }, zone(40, 40, 0, 0)]) {
    assert.equal(dropTargetAt([invalid], 45, 45), null);
  }
});

test('the moved picture can land when held at the edge, while a direct choice under the finger wins', () => {
  const listeners = {}, placed = [];
  const source = { ...zone(0, 0, 90, 60), style: {}, setPointerCapture() {} };
  const first = zone(130, 100, 56, 56), second = zone(190, 100, 56, 56);
  const field = {
    querySelectorAll: () => [first, second],
    addEventListener(type, fn) { listeners[type] = fn; },
  };
  mountDrag(field, {
    sources: '.piece', targets: '.place', onDrop: (_, target) => placed.push(target), onTouchTap: assert.fail,
  });
  const pointer = (type, x, y) => listeners[type]({ type, target: { closest: () => source },
    isPrimary: true, button: 0, pointerId: 1, pointerType: 'touch', clientX: x, clientY: y });
  const dragTo = (x, end = 'pointerup') => {
    pointer('pointerdown', 1, 30);
    pointer('pointermove', x, 125);
    pointer(end, x, 125);
  };
  dragTo(91);  // Finger 39px away, but the picture's centre is over the first place.
  dragTo(178); // Finger on first, picture's centre on second.
  dragTo(239, 'pointercancel');
  assert.deepEqual(placed, [first, first]);
});
