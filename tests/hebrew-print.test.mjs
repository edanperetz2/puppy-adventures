import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { LETTERS, writingLetter, letterShape, advanceTrace } from '../dist/letters.js';
import { MAIN_LETTER_STROKES } from '../dist/letter-main-forms.js';

const form = char => writingLetter('hebrew', LETTERS.hebrew.findIndex(l => l.familiar === char), 'main');

// Independent geometry sampling makes the regressions about the taught shapes,
// joins and trace behavior, rather than checking exact SVG strings.
function sample(d) {
  const tokens = d.match(/[MLHVQ]|-?\d+(?:\.\d+)?/gu), points = [];
  let index = 0, current = { x: 0, y: 0 };
  while (index < tokens.length) {
    const command = tokens[index++];
    const n = command === 'Q' ? 4 : ['H', 'V'].includes(command) ? 1 : 2;
    const values = tokens.slice(index, index += n).map(Number);
    const end = command === 'H' ? { x: values[0], y: current.y } : command === 'V' ? { x: current.x, y: values[0] } : { x: values.at(-2), y: values.at(-1) };
    if (command === 'M') points.push(end);
    else {
      const estimate = command === 'Q' ? Math.hypot(values[0] - current.x, values[1] - current.y) + Math.hypot(end.x - values[0], end.y - values[1]) : Math.hypot(end.x - current.x, end.y - current.y);
      const steps = Math.max(1, Math.ceil(estimate / 2));
      for (let i = 1; i <= steps; i++) {
        const t = i / steps, u = 1 - t;
        points.push(command === 'Q' ? { x: u*u*current.x + 2*u*t*values[0] + t*t*end.x, y: u*u*current.y + 2*u*t*values[1] + t*t*end.y } : { x: u*current.x + t*end.x, y: u*current.y + t*end.y });
      }
    }
    current = end;
  }
  return points;
}
const closeToPath = (point, points) => Math.min(...points.map(p => Math.hypot(point.x-p.x, point.y-p.y))) < 2;

test('Alef has separate curved upper and lower branches joined at different heights, never an X', () => {
  const [diagonal, lower, upper] = form('א').strokes.map(sample);
  assert.equal(form('א').strokes.length, 3);
  assert.ok(closeToPath(lower[0], diagonal)); assert.ok(closeToPath(upper.at(-1), diagonal));
  assert.ok(upper.at(-1).y - lower[0].y >= 15, 'Branches must not collapse into one central crossing');
  assert.equal(lower.at(-1).y, 190); assert.equal(upper[0].y, 96);
  assert.ok(lower.slice(-10).every(p => Math.abs(p.x - lower.at(-1).x) < .1), 'Lower branch ends in an upright leg');
  assert.ok(upper.slice(0, 10).every(p => Math.abs(p.x - upper[0].x) < .1), 'Upper branch starts down its upright');
});

test('Vav, yud and final nun share a narrow rounded head and have distinct stem lengths', () => {
  const [vav, yud, nun] = ['ו', 'י', 'ן'].map(char => sample(form(char).strokes[0]));
  assert.equal(vav.length > yud.length, true); assert.ok(nun.length > vav.length);
  for (const points of [vav, yud, nun]) {
    const width = Math.max(...points.map(p => p.x)) - Math.min(...points.map(p => p.x));
    assert.ok(width <= 18, 'The small head must not become a dalet-like roof');
    assert.ok(points.every((p, i) => !i || p.y >= points[i - 1].y), 'The head turns into a downward stem');
    assert.equal(points.at(-1).x, 130);
  }
  assert.equal(vav.at(-1).y, 190); assert.equal(yud.at(-1).y, 124); assert.equal(nun.at(-1).y, 224);
  assert.deepEqual(vav.slice(0, 10), yud.slice(0, 10)); assert.deepEqual(vav.slice(0, 10), nun.slice(0, 10));
  const zayin = form('ז').strokes.map(sample);
  assert.ok(zayin[0].at(-1).x - zayin[0][0].x >= 40, 'Zayin retains an overhanging cap');
});

test('Shin starts all three uprights at the top and print badges leave the writing line visible', () => {
  const strokes = form('ש').strokes.map(sample);
  assert.equal(strokes.length, 3);
  assert.deepEqual(strokes.map(points => points[0].x), [77, 121, 164]);
  for (const points of strokes) {
    assert.equal(points[0].y, 96); assert.ok(points[8].y > points[0].y + 10);
    assert.ok(points.at(-1).y >= 170);
  }
  const pad = letterShape(form('ו'), { guide: true, pad: true });
  assert.match(pad, /print-start/u); assert.match(pad, /letter-start-anchor" r="4"/u);
  assert.match(pad, /cx="-21" cy="-22"/u, 'The number sits beside the stroke, not on the head');
  assert.doesNotMatch(letterShape(LETTERS.hebrew[5], { pad: true }), /print-start/u, 'Existing handwriting keeps its controls');
});

test('Every print stroke fits the pad and can be traced completely across bends and joins', () => {
  for (const familiar of LETTERS.hebrew) for (const d of form(familiar.familiar).strokes) {
    const points = sample(d); let progress = 0, previous = points[0];
    for (const p of points) {
      assert.ok(p.x >= 30 && p.x <= 210 && p.y >= 40 && p.y <= 225);
      progress = advanceTrace(points, progress, p, 25, previous); previous = p;
    }
    assert.equal(progress, points.length - 1, `${familiar.id}: tracing reaches the end`);
  }
});

test('Hebrew print corrections retain all existing English capital stroke models', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(MAIN_LETTER_STROKES.english)).digest('hex'), 'd93df47f1815d0d850c71bafd9243a64a68c5d0f541536c50123fa39ef10111a');
});
