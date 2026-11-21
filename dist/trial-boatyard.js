import { waterTrial } from './boatyard.js';

const hullName = { ball: 'כַּדּוּר', narrow: 'סִירָה צָרָה', wide: 'סִירָה רְחָבָה', roomy: 'סִירָה גְּדוֹלָה' };
const halfWidth = { narrow: 46, wide: 70, roomy: 92 };
const cargo = count => Array(count).fill(5);
const shore = '<path d="M0 79Q37 60 55 68T100 64Q145 38 187 62T268 61Q312 59 342 69T420 66Q457 53 502 64T560 65V105H0Z" fill="#b1c7b6"/><path d="M0 77Q64 61 111 77T217 72Q255 57 311 73T419 75Q486 57 560 70V101H0Z" fill="#87ad9c"/><path d="M0 86Q90 75 162 87T289 83T422 87Q492 75 560 80V113H0Z" fill="#6d9d95"/>';
const dock = '<g fill="#976346"><rect x="462" y="91" width="11" height="75" rx="4"/><rect x="519" y="91" width="11" height="81" rx="4"/></g><path d="M447 83H560V97H447Q440 91 447 83" fill="#c08b5e"/><path d="M447 84H560" stroke="#efc698" stroke-width="5" stroke-linecap="round"/>';
const riverbed = '<path d="M0 190Q60 179 111 196T215 195T337 192T449 194T560 185V232H0Z" fill="#96beb0"/><path d="M0 208Q60 191 120 207T240 204T351 202T459 206T560 201V232H0Z" fill="#a1b8a3"/><g fill="#698f8b" opacity=".65"><ellipse cx="66" cy="205" rx="10" ry="4"/><ellipse cx="192" cy="217" rx="8" ry="3"/><ellipse cx="388" cy="207" rx="14" ry="4"/></g>';
const shine = '<g fill="none" stroke="#d7ffff" stroke-width="2.5" stroke-linecap="round"><path d="M18 136q17 2 32 0m40 15q10 2 18 0m257 -16q12 2 26 0m56 15q15 2 27 0"/></g>';
const waveLine = '<path d="M0 122Q35 117 70 122T140 122T210 122T280 122T350 122T420 122T490 122T560 122" stroke="#daffff" stroke-width="3" fill="none"/>';
const labels = { wet: 'במים', shore: 'מחוץ למים' };

function parcel(x, y, size = 20) {
  return `<g transform="translate(${x} ${y}) scale(${size / 20})"><path d="m-10 -6 10 -5 10 5 -10 6Z" fill="#ffdc91"/><path d="m-10 -6 10 6v12l-10 -6Z" fill="#d18a44"/><path d="m10 -6 -10 6v12l10 -6Z" fill="#efa658"/><path d="m-6 -8 10 6v10" stroke="#fae4a7" stroke-width="3.4" fill="none"/></g>`;
}

function clay(shape, count = 0, flooded = false) {
  if (shape === 'ball') return '<g><circle r="18" fill="#b95842" stroke="#8a4339" stroke-width="2.5"/><circle cx="-3" cy="-4" r="12" fill="#d77556"/><path d="M-11 -4q2 -8 9 -8" fill="none" stroke="#f3b191" stroke-linecap="round" stroke-width="3.2"/></g>';
  const w = halfWidth[shape];
  const first = Math.min(count, 4);
  const boxes = Array.from({ length: count }, (_, i) => {
    const upper = i >= first, inRow = upper ? count - first : first;
    return parcel(((upper ? i - first : i) - (inRow - 1) / 2) * 17, upper ? -17 : -2);
  }).join('');
  return `<g>
    <path d="M${-w} -7Q0 14 ${w} -7Q${w - 8} 38 19 42Q0 45 -19 42Q${-w + 8} 38 ${-w} -7Z" fill="#bb6047" stroke="#874538" stroke-width="3"/>
    <ellipse cy="-7" rx="${w}" ry="11" fill="#a25141" stroke="#e49574" stroke-width="5"/>
    <ellipse cy="-6" rx="${w - 8}" ry="6" fill="${flooded ? '#79c5cf' : '#8e4437'}"/>
    <path d="M${-w + 8} 5Q${-w + 1} 10 ${-w + 18} 22" stroke="#ed9d78" stroke-width="4" stroke-linecap="round" fill="none"/>
    <path d="M${-w + 18} 20Q0 39 ${w - 16} 18" stroke="#a24e3e" stroke-width="2.5" fill="none"/>
    ${boxes}</g>`;
}

// Side-on waterline and identical parcels are kept fixed between trials.
// The old chapter's displacement model also powers its replacement drawings.
function height(hull, count, wet) {
  if (!wet) return hull === 'ball' ? 65 : 64;
  if (hull === 'ball') return 175;
  const outcome = waterTrial(hull, cargo(count));
  return outcome.result === 'float' ? 123 - (1 - outcome.draft) * 65 : 150;
}

function waterWorld({ hull, count = 0, wet = true, motion = '', beforeCount, sent = false, onShore = false, hideHull = false }) {
  const outcome = wet ? waterTrial(hull, cargo(count)).result : 'dry';
  const y = height(hull, count, wet);
  const x = sent ? 431 : 254;
  const dy = beforeCount === undefined ? 0 : height(hull, beforeCount, wet) - y;
  const object = `<g transform="translate(${x} ${y})"><g class="tw-hull ${motion}" style="--tw-start-y:${dy}px">
    ${motion === 'tw-molding' ? '<g class="tw-old-clay">' + clay('ball') + '</g>' : ''}
    <g class="${motion === 'tw-molding' ? 'tw-new-clay' : ''}">${clay(hull, count, outcome === 'flooded')}</g>
  </g></g>`;
  const desc = hull === 'ball' ? (wet ? 'כדור החומר בתחתית המים' : 'כדור חומר מעל המים') :
    `${hullName[hull]} ${wet ? labels.wet : labels.shore}, עם ${count} חבילות${wet ? outcome === 'float' ? ', שפת הסירה מעל המים' : ', מים בתוך הסירה' : ''}`;
  return `<svg class="tw-harbor" viewBox="0 0 560 230" role="img" aria-label="${desc}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="446" cy="38" r="23" fill="#ffedb4"/>${shore}
    <path d="M0 96Q160 86 278 96T560 96V230H0Z" fill="#8bc9c8"/>${riverbed}${dock}
    ${onShore ? '<g><path d="M149 101H350V109H149Z" fill="#bb9778"/><path d="M157 107v12m185 -12v12" stroke="#876946" stroke-width="6"/></g>' : ''}
    ${hideHull ? '' : object}
    <path d="M0 122Q35 117 70 122T140 122T210 122T280 122T350 122T420 122T490 122T560 122V230H0Z" fill="#2999aa" fill-opacity=".23"/>
    ${waveLine}${shine}
    ${(!wet && !onShore) ? '<path d="m241 101 13 8 13 -8" fill="none" stroke="#fff5d6" stroke-width="4" stroke-linecap="round"/>' : ''}
  </svg>`;
}

function tank(options) {
  return `<div class="tw-boat-world">${waterWorld(options)}</div>`;
}

function boatArt(hull, count, wet) {
  // Close-up for choice cards. The lip and surface must be legible on phones.
  const liquid = wet ? '<path d="M1 37Q16 34 32 37T63 37T96 37T127 37V70H1Z" fill="#84d0d0"/>' : '';
  const outcome = wet && waterTrial(hull, cargo(count)).result;
  const hullY = wet ? outcome === 'float' ? 36 - (1 - waterTrial(hull,cargo(count)).draft) * 30 : 48 : 28;
  return `<svg class="tw-hull-icon" viewBox="0 0 128 72" aria-hidden="true">${liquid}
    <g transform="translate(64 ${hullY}) scale(.6)">${clay(hull,count,outcome === 'flooded')}</g>
    ${wet ? '<path d="M1 37Q16 34 32 37T63 37T96 37T127 37V70H1Z" fill="#3aa0b5" opacity=".23"/><path d="M1 37Q16 34 32 37T63 37T96 37T127 37" fill="none" stroke="#efffff" stroke-width="2"/>' : ''}
  </svg>`;
}

function touch(prompt, result, id, label, before, after) {
  return { prompt, result, direct: true, choices: [{ id, label }], correct: [id],
    scene: (_answers, selected) => {
      if (selected) return tank(after);
      const hullY = height(before.hull, before.count || 0, before.wet !== false);
      const addParcel = id === 'add';
      const waterDrop = id === 'drop' || id === 'launch';
      const eligible = waterDrop || addParcel;
      // Anchor an untransformed parent; the drag controller can translate the
      // button independently while the broad destination stays in place.
      const y = addParcel ? 28 : Math.round((hullY + (before.hull === 'ball' ? 0 : 9)) / 230 * 100);
      const toolArt = addParcel ? `<svg viewBox="-18 -18 36 36" aria-hidden="true">${parcel(0,0,26)}</svg>` :
        waterDrop ? `<svg viewBox="-100 ${before.hull === 'ball' ? -36 : -26} 200 72" aria-hidden="true">${clay(before.hull, before.count)}</svg>` : '';
      return `<div class="tw-boat-world">${waterWorld({ ...before, hideHull: waterDrop })}
        ${eligible ? `<span class="tw-drop-zone ${addParcel ? 'tw-boat-zone' : 'tw-water-zone'}" data-trial-drop="${id}" aria-hidden="true"></span>` : ''}
        <span class="tw-boat-anchor${addParcel ? ' tw-parcel-anchor' : ''}" style="--tw-y:${y}%">
          <button type="button" class="tw-boat-hit" data-trial-choice="${id}" ${eligible ? 'data-trial-drag' : ''} aria-label="${label}">
            ${toolArt}
          </button></span>
      </div>`;
    },
  };
}

const predictions = [
  { id: 'float', label: 'תָּצוּף', art: boatArt('wide', 0, true) },
  { id: 'flood', label: 'מַיִם יִכָּנְסוּ', art: boatArt('narrow', 3, true) },
];
const compare = (prompt, result, hulls, count, right, overview, after, wet = false) => ({
  prompt, result, correct: [right],
  choices: hulls.map(hull => ({ id: hull, label: hullName[hull], art: boatArt(hull, count, wet) })),
  hint: wet ? 'חַפְּשִׂי שָׂפָה שֶׁל סִירָה מֵעַל לַמַּיִם.' : 'חַפְּשִׂי אֶת הַצּוּרָה שֶׁצָּפָה.',
  scene: (_answers, selected, seed = 0) => {
    if (selected) return tank(after);
    return typeof overview === 'function' ? overview(seed) : tank(overview);
  },
});

function sideBySide(hulls, count, wet, seed, prediction, motion = '') {
  const order = Number(seed) % 2 ? [...hulls].reverse() : hulls;
  return `<div class="tw-twin-tanks">${order.map(hull => `<div class="${prediction === hull ? 'tw-predicted' : ''}">${tank({ hull, count, wet, motion })}</div>`).join('')}</div>`;
}

const shape = [
  touch('גְּעִי בְּכַדּוּר הַחֹמֶר וְנַנִּיחַ אוֹתוֹ בַּמַּיִם.', 'הַכַּדּוּר שָׁקַע.', 'drop', 'לְהַנִּיחַ אֶת הַכַּדּוּר בַּמַּיִם',
    { hull: 'ball', wet: false }, { hull: 'ball', motion: 'tw-ball-drops' }),
  touch('הוֹצִיאִי אֶת הַכַּדּוּר מֵהַמַּיִם.', 'זֶה אוֹתוֹ כַּדּוּר חֹמֶר.', 'lift', 'לְהוֹצִיא אֶת הַכַּדּוּר',
    { hull: 'ball' }, { hull: 'ball', wet: false, onShore: true, motion: 'tw-ball-lifts' }),
  touch('בּוֹאִי נַעֲשֶׂה סִירָה מֵאוֹתוֹ חֹמֶר.', 'עַכְשָׁו יֵשׁ בַּחֹמֶר שֶׁקַע.', 'mold', 'לְשַׁנּוֹת אֶת צוּרַת הַחֹמֶר',
    { hull: 'ball', wet: false, onShore: true }, { hull: 'wide', wet: false, onShore: true, motion: 'tw-molding' }),
  { prompt: 'מָה יִקְרֶה לַסִּירָה?', choices: predictions, result: 'הַסִּירָה צָפָה.',
    scene: (_answers, selected) => tank({ hull: 'wide', wet: Boolean(selected), motion: selected ? 'tw-launch' : '' }) },
  compare('אֵיזוֹ צוּרָה צָפָה?', 'הַסִּירָה צָפָה.', ['ball','wide'], 0, 'wide',
    seed => sideBySide(['ball','wide'],0,true,seed), { hull: 'wide' }),
  compare('בְּאֵיזוֹ צוּרָה יֵשׁ מָקוֹם לַחֲבִילָה?', 'הַסִּירָה צָפָה עִם הַחֲבִילָה.', ['wide','ball'], 0, 'wide',
    { hull: 'ball', wet: false, onShore: true }, { hull: 'wide', count: 1 }),
];

const loading = [
  touch('הוֹסִיפִי חֲבִילָה אַחַת לַסִּירָה.', 'הַסִּירָה יָרְדָה עוֹד קְצָת בַּמַּיִם.', 'add', 'לְהוֹסִיף חֲבִילָה',
    { hull: 'narrow' }, { hull: 'narrow', count: 1, beforeCount: 0, motion: 'tw-load-changes' }),
  touch('הוֹסִיפִי עוֹד חֲבִילָה.', 'הַסִּירָה עֲדַיִן צָפָה.', 'add', 'לְהוֹסִיף חֲבִילָה',
    { hull: 'narrow', count: 1 }, { hull: 'narrow', count: 2, beforeCount: 1, motion: 'tw-load-changes' }),
  { prompt: 'מָה יִקְרֶה כְּשֶׁנּוֹסִיף עוֹד חֲבִילָה?', choices: predictions, result: 'מַיִם נִכְנְסוּ לַסִּירָה.',
    scene: (_answers, selected) => tank({ hull: 'narrow', count: selected ? 3 : 2, beforeCount: 2, motion: selected ? 'tw-load-changes' : '' }) },
  touch('נוֹצִיא אֶת הַסִּירָה וּנְרוֹקֵן אֶת הַמַּיִם.', 'הַסִּירָה רֵיקָה מִמַּיִם.', 'lift', 'לְרוֹקֵן אֶת הַמַּיִם',
    { hull: 'narrow', count: 3 }, { hull: 'narrow', count: 3, wet: false, onShore: true, motion: 'tw-lift' }),
  touch('הוֹצִיאִי חֲבִילָה אַחַת וְנַסִּי שׁוּב.', 'נִשְׁאֲרוּ שְׁתֵּי חֲבִילוֹת.', 'remove', 'לְהוֹצִיא חֲבִילָה',
    { hull: 'narrow', count: 3, wet: false, onShore: true }, { hull: 'narrow', count: 2, wet: false, onShore: true }),
  touch('עַכְשָׁו נַנִּיחַ בַּמַּיִם וְנִרְאֶה.', 'עִם פָּחוֹת חֲבִילוֹת הַסִּירָה שׁוּב צָפָה.', 'launch', 'לְהַחֲזִיר לַמַּיִם',
    { hull: 'narrow', count: 2, wet: false, onShore: true }, { hull: 'narrow', count: 2, motion: 'tw-launch' }),
];

function deliverySteps(hulls, count, extended) {
  const [small, large] = hulls;
  const id = 'try-boats';
  return [
    { prompt: 'אֵיזוֹ סִירָה תָּצוּף?',
      result: 'עַכְשָׁו נַנִּיחַ בַּמַּיִם וְנִרְאֶה.',
      choices: hulls.map(hull => ({ id: hull, label: hullName[hull], art: boatArt(hull, count, false) })),
      scene: (_answers, selected, seed = 0) => sideBySide(hulls, count, false, seed, selected) },
    { prompt: extended ? 'הַפַּעַם יֵשׁ יוֹתֵר חֲבִילוֹת. נִבְדֹּק אֶת שְׁתֵּי הַסִּירוֹת.' : 'נִבְדֹּק אֶת שְׁתֵּי הַסִּירוֹת עִם אוֹתָן חֲבִילוֹת.',
      result: 'לְאַחַת הַסִּירוֹת נִכְנְסוּ מַיִם.', choices: [{ id, label: 'נִבְדֹּק בַּמַּיִם', art: 'boat' }], correct: [id],
      scene: (_answers, selected, seed = 0) => sideBySide(hulls, count, Boolean(selected), seed, null, selected ? 'tw-launch' : '') },
    compare('אֵיזוֹ סִירָה צָפָה עִם הַחֲבִילוֹת?', 'הַמִּשְׁלוֹחַ הִגִּיעַ!',
      [small, large], count, large, seed => sideBySide(hulls, count, true, seed),
      { hull: large, count, sent: true, motion: 'tw-cross' }, true),
  ];
}

export const boatyardGames = [
  { id: 'boat-shape', title: 'מִכַּדּוּר לְסִירָה', icon: 'boat', steps: shape },
  { id: 'boat-load', title: 'מַעֲמִיסוֹת וּבוֹדְקוֹת', icon: 'gift', steps: loading },
  { id: 'boat-delivery', title: 'מַשִּׁיטוֹת מִשְׁלוֹחַ', icon: 'basket', steps: [
    ...deliverySteps(['narrow','wide'], 3, false), ...deliverySteps(['wide','roomy'], 6, true),
  ] },
];
