import { READING_SCENES } from './reading-advanced.js';

const palette = {
  red: ['#e47176', '#f5bec1'], blue: ['#579dce', '#badced'], green: ['#65a575', '#c3dfb9'],
  pink: ['#e9a2c5', '#f7d8e5'], purple: ['#9d75c3', '#d9c5eb'], yellow: ['#edc85b', '#fff0b3'],
};
const ground = '<ellipse cx="101" cy="185" rx="87" ry="7" fill="#e9e5d9"/>';
const moon = '<path d="M34 25A19 19 0 1 0 59 50A19 19 0 0 1 34 25" fill="#dfc98d"/>';

export function hasReadingScene(id) { return Object.hasOwn(READING_SCENES, id); }

export function readingScene(id, baseArt) {
  if (!hasReadingScene(id)) return null;
  const spec = READING_SCENES[id];
  const raw = (object, color) => {
    let body = baseArt(object).replace(/^<svg\b[^>]*>/u, '').replace(/<\/svg>$/u, '');
    if (object === 'pencil' && spec.kind === 'position' && spec.position === 'on') body = `<g transform="rotate(-45 100 100)">${body}</g>`;
    if (color && palette[color]) {
      const [tone, light] = palette[color];
      const replacements = { ball: { '#f0b15f': tone, '#6aafa9': light }, flower: { '#e7a4ac': tone }, car: { '#82b5ad': tone }, butterfly: { '#b49ace': tone, '#edb4c1': light, '#f2c976': light }, bird: { '#85b8cd': tone, '#6ca7c2': tone, '#c0dce5': light }, star: { '#f3c65c': tone, '#e5aa3b': tone, '#ffedaa': light }, heart: { '#ec859c': tone, '#ffc0ce': light }, balloon: { '#BB1A34': tone } }[object] || {};
      for (const [from, to] of Object.entries(replacements)) body = body.replaceAll(from, to);
    }
    return body;
  };
  const place = (body, x, y, size, cls = '') => `<g transform="translate(${x} ${y}) scale(${size / 200})"><g class="${cls}">${body}</g></g>`;
  const at = (object, x, y, size, color, cls) => place(raw(object, color), x, y, size, cls);
  const sleepEyes = body => body.replace(/<ellipse cx="(\d+)" cy="(\d+)" rx="5" ry="7" fill="#343247"\/><circle[^>]*\/>/gu, (_, x, y) => `<path d="M${Number(x)-7} ${y}q7 7 14 0" stroke="#625664" stroke-width="4" stroke-linecap="round"/>`).replace(/<circle cx="151" cy="64" r="5"[^>]*\/>/u, '<path d="M144 63q7 8 14 0" stroke="#625664" stroke-width="4" stroke-linecap="round"/>').replaceAll('class="pup-tail"', '');
  const actor = (object, asleep) => {
    if (object === 'cat' || object === 'rabbit') {
      const color = object === 'cat' ? '#dfb381' : '#d9cec6';
      return `<path d="M139 139q35-4 28-31" stroke="${color}" stroke-width="14" stroke-linecap="round"/><ellipse cx="111" cy="137" rx="49" ry="28" fill="${color}"/><path d="M89 151l-18 25m56-24 18 24" stroke="${color}" stroke-width="14" stroke-linecap="round"/>${place(asleep ? sleepEyes(raw(object)) : raw(object), 7, 6, 128)}`;
    }
    let body = raw(object);
    if (object === 'bird' && spec.action === 'fly') body = body.replace('M83 94Q139 94 105 136Q75 138 73 110', 'M81 104Q35 68 52 30Q93 46 112 103Q120 126 101 134Z');
    return asleep ? sleepEyes(body) : body;
  };
  let body = '';
  if (spec.kind === 'color') body = at(spec.object, 14, 12, 172, spec.color);
  if (spec.kind === 'count') {
    const positions = spec.count === 2 ? [[13, 56], [105, 56]] : spec.count === 3 ? [[58, 9], [13, 104], [105, 104]] : [[13, 9], [105, 9], [13, 104], [105, 104]];
    body = positions.map(([x, y]) => at(spec.object, x, y, 82, spec.color, spec.flying ? 'scene-flying' : '')).join('');
  }
  if (spec.kind === 'position') {
    body = ground;
    if (spec.anchor === 'table') {
      body += at('table', 43, 64, 148);
      const pos = { on: [84, 40, 58], under: [85, 131, 58], near: [0, 131, 58] }[spec.position];
      body += at(spec.object, ...pos, spec.color);
    } else if (spec.anchor === 'box') {
      body += '<path d="M76 112L94 99H169L183 112V183H76Z" fill="#d7b387"/><path d="M85 113H174V131H85Z" fill="#b78c68"/>';
      const pos = { in: [82, 80, 91], on: [82, 28, 91], near: [0, 110, 83] }[spec.position];
      if (spec.object === 'pencil' && spec.position === 'on') pos[1] = 68;
      body += at(spec.object, ...pos, spec.color);
      if (spec.position === 'in') body += '<path d="M76 131H183V183H76Z" fill="#dab88c"/><path d="M126 136V179" stroke="#c9a37d" stroke-width="3"/>';
      body += '<path d="M76 112L61 125L110 133L126 115M182 112L196 125L150 134L129 115" fill="#e6c69c"/>';
    } else if (spec.anchor === 'flower') {
      body += at('flower', 62, 68, 128);
      const pos = { above: [95, 0, 61], on: [95, 55, 61], near: [0, 120, 61] }[spec.position];
      if (spec.size) { pos[2] = spec.size === 'small' ? 43 : 83; if (spec.position !== 'near') pos[0] = 125 - pos[2] / 2; }
      body += at(spec.object, ...pos, spec.color);
    } else if (spec.anchor === 'tree') {
      body += at('tree', 61, 74, 133);
      if (spec.position === 'on') body += '<path d="M118 100H171" stroke="#a47e5c" stroke-width="5" stroke-linecap="round"/>';
      const pos = { above: [111, 0, 66], on: [105, 41, 68], near: [0, 126, 68] }[spec.position];
      body += at(spec.object, ...pos, spec.color);
    }
  }
  if (spec.kind === 'arrangement') {
    if (spec.anchor === 'table') {
      body = ground + at('table', 10, 30, 180);
      const y = spec.position === 'on' ? 47 : 135;
      const xs = spec.count === 2 ? [56, 108] : [34, 82, 130];
      body += xs.map(x => at(spec.object, x, y, 38)).join('');
    } else if (spec.anchor === 'plate') {
      body = at('plate', 66, 55, 130);
      const positions = spec.position === 'near' ? [[2, 55], [3, 105], [10, 151]] : spec.count === 2 ? [[87, 89], [134, 89]] : [[111, 72], [88, 111], [136, 111]];
      body += positions.map(([x, y]) => at(spec.object, x, y, 37)).join('');
    }
  }
  if (spec.kind === 'travel') {
    body = `${at(spec.anchor, 10, 8, 105)}<path d="M5 182H195" stroke="#c8c1ba" stroke-width="17"/><path d="M8 182H192" stroke="#faf4dc" stroke-width="3" stroke-dasharray="12 12"/>${at('car', 80, 87, 114, spec.color, 'scene-driving')}<path d="M57 143H73M48 154H72" stroke="#d8c9b5" stroke-width="4" stroke-linecap="round"/>`;
  }
  if (spec.kind === 'action') {
    body = ground;
    if (spec.reference) body += at('flower', 127, 112, 76);
    const size = spec.size === 'small' ? 104 : spec.size === 'big' ? 165 : 164;
    const x = spec.reference ? 3 : 19;
    const lift = spec.action === 'jump' || spec.action === 'fly' ? 30 : 0;
    const y = 185 - size * .88 - lift;
    if (spec.action === 'eat' || spec.action === 'drink') {
      body += place(actor(spec.object, false), 20, 18, 147, 'scene-feeding');
      body += '<path d="M57 153H144L135 181H67Z" fill="#8bb8c5"/><ellipse cx="100" cy="153" rx="43" ry="12" fill="#c6dfe6"/>';
      if (spec.action === 'drink') {
        body += '<ellipse cx="100" cy="153" rx="34" ry="8" fill="#65b6df"/><path d="M89 117q-11 13-4 17q7 3 7-5M114 115q-11 13-4 17q7 3 7-5" fill="#65b6df"/>';
      } else {
        body += '<g fill="#ac825c"><circle cx="76" cy="153" r="5"/><circle cx="91" cy="150" r="5"/><circle cx="108" cy="153" r="5"/><circle cx="123" cy="150" r="5"/></g>';
        const food = spec.object === 'rabbit' ? 'carrot' : spec.object === 'bird' ? 'apple' : 'bone';
        body += at(food, 86, 116, 31);
      }
    } else if (spec.action === 'sleep') {
      body += '<ellipse cx="102" cy="168" rx="78" ry="17" fill="#d8e4e6"/>' + moon;
      const pose = spec.object === 'dog' ? `<g transform="rotate(-75 100 103)">${actor(spec.object, true)}</g>` : actor(spec.object, true);
      body += place(pose, x, 185 - size * .78, size, 'scene-sleeping');
    } else {
      if (spec.action === 'run') body += '<path d="M8 103H26M2 117H23M8 133H27" stroke="#c9b7cc" stroke-width="5" stroke-linecap="round"/>';
      if (spec.action === 'jump') body += '<path d="M14 151q-4-33 13-53M17 165v-7" stroke="#cbb9d1" stroke-width="4" stroke-linecap="round" stroke-dasharray="5 6"/>';
      if (spec.action === 'fly') body += '<path d="M27 79q24-42 58-19M125 39q28-12 53 20" stroke="#d5d7df" stroke-width="4" stroke-linecap="round"/>';
      const tilt = spec.action === 'run' ? `<g transform="rotate(-13 100 130)">${actor(spec.object, false)}</g>` : actor(spec.object, false);
      body += place(tilt, x, y, size, `scene-${spec.action}`);
    }
  }
  return body;
}
