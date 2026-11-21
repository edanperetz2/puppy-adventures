// Each experiment keeps the same apparatus on screen. Its controls are the
// tools and specimens themselves, including when the child answers a question.
const names = {
  cork: 'פְּקָק שַׁעַם', rock: 'אֶבֶן', wood: 'חֲתִיכַת עֵץ', top: 'לְמַעְלָה', bottom: 'לְמַטָּה',
  oil: 'שֶׁמֶן', stir: 'כַּף', a: 'כּוֹס אַחַת', b: 'הַכּוֹס הַשְּׁנִיָּה',
  plain: 'בְּלִי סַבּוֹן', soapy: 'עִם סַבּוֹן', pepper: 'פִּלְפֵּל', soap: 'טִפַּת סַבּוֹן', water: 'טִפַּת מַיִם',
  moves: 'יָזוּז לַצְּדָדִים', stays: 'יִשָּׁאֵר בַּמָּקוֹם', sideA: 'כָּאן', sideB: 'כָּאן',
  ice: 'שְׁתֵּי קֻבִּיּוֹת קֶרַח', wait: 'נַעֲבִיר קְצָת זְמַן', warm: 'מַיִם חַמִּים', cold: 'מַיִם קָרִים',
  lamp: 'מְנוֹרָה', near: 'לְיַד הַמְּנוֹרָה', far: 'לְיַד הַמָּסָךְ', cat: 'חָתוּל', rabbit: 'אַרְנָב',
};

function experiment(id, title, icon, draw, steps) {
  return { id, title, icon, steps: steps.map(([prompt, ids, correct, result], index) => ({
    prompt, choices: ids.map(id => ({ id, label: names[id] })), ...(correct ? {correct} : {}),
    result, direct: true, scene: (answers, selected, roundId) => draw(index, answers, selected, ids, roundId),
  })) };
}

export const scienceGames = [
  experiment('floating', 'צָף אוֹ שׁוֹקֵעַ?', 'rock', tankScene, [
    ['הַכְנִיסִי אֶת הַפְּקָק לַמַּיִם.', ['cork'], null, 'הַפְּקָק צָף עַל הַמַּיִם.'],
    ['מָה דַּעְתֵּךְ, לְאָן תַּגִּיעַ הָאֶבֶן?', ['top','bottom'], null, 'בּוֹאִי נִבְדֹּק!'],
    ['הַכְנִיסִי אֶת הָאֶבֶן לַמַּיִם.', ['rock'], null, 'הָאֶבֶן שָׁקְעָה לַתַּחְתִּית.'],
    ['מָה שָׁקַע?', ['cork','rock'], ['rock'], 'הָאֶבֶן לְמַטָּה. הַפְּקָק לְמַעְלָה.'],
    ['נַסִּי גַּם חֲתִיכַת עֵץ.', ['wood'], null, 'חֲתִיכַת הָעֵץ צָפָה.'],
    ['מָה עוֹד צָף כְּמוֹ הַפְּקָק?', ['wood','rock'], ['wood'], 'גַּם הָעֵץ וְגַם הַפְּקָק צָפִים.'],
  ]),
  experiment('liquids', 'מַיִם, שֶׁמֶן וְסַבּוֹן', 'cup', oilScene, [
    ['מִזְגִי שֶׁמֶן לִשְׁתֵּי הַכּוֹסוֹת.', ['oil'], null, 'הַשֶּׁמֶן צָף מֵעַל הַמַּיִם.'],
    ['עַרְבְּבִי בִּשְׁתֵּי הַכּוֹסוֹת.', ['stir'], null, 'הַשֶּׁמֶן חָזַר לְמַעְלָה.'],
    ['בַּחֲרִי כּוֹס לְטִפַּת סַבּוֹן.', ['a','b'], null, 'רַק בְּכוֹס אַחַת יֵשׁ סַבּוֹן.'],
    ['עַרְבְּבִי שׁוּב. מָה הִשְׁתַּנָּה?', ['stir'], null, 'עִם סַבּוֹן, הַשֶּׁמֶן מִתְפַּזֵּר לְטִפּוֹת קְטַנּוֹת.'],
    ['אֵיפֹה הַשֶּׁמֶן צָף בְּשִׁכְבָה?', ['plain','soapy'], ['plain'], 'כָּאן רוֹאִים שִׁכְבָה שֶׁל שֶׁמֶן.'],
    ['אֵיפֹה רוֹאִים טִפּוֹת קְטַנּוֹת שֶׁל שֶׁמֶן?', ['plain','soapy'], ['soapy'], 'כָּאן הוֹסַפְנוּ סַבּוֹן וְעִרְבַּבְנוּ.'],
  ]),
  experiment('pepper', 'פִּלְפֵּל וְסַבּוֹן', 'spoon', pepperScene, [
    ['פַּזְּרִי פִּלְפֵּל עַל הַמַּיִם.', ['pepper'], null, 'הַפִּלְפֵּל צָף עַל הַמַּיִם.'],
    ['הוֹסִיפִי טִפַּת מַיִם.', ['water'], null, 'הַפִּלְפֵּל עוֹד מְפֻזָּר.'],
    ['מָה יִקְרֶה לַפִּלְפֵּל עִם טִפַּת סַבּוֹן?', ['moves','stays'], null, 'בּוֹאִי נִבְדֹּק!'],
    ['הוֹסִיפִי טִפָּה שֶׁל סַבּוֹן כֵּלִים.', ['soap'], null, 'תִּרְאִי! הַפִּלְפֵּל זָז לַצְּדָדִים.'],
    ['אֵיפֹה הַפִּלְפֵּל זָז לַצְּדָדִים?', ['plain','soapy'], ['soapy'], 'הַמַּיִם נָעוּ וְלָקְחוּ אִתָּם אֶת הַפִּלְפֵּל.'],
    ['הִנֵּה צַלַּחַת חֲדָשָׁה. אֵיפֹה תָּשִׂימִי סַבּוֹן?', ['sideA','sideB'], null, 'הַפִּלְפֵּל הִתְרַחֵק מִטִּפַּת הַסַּבּוֹן.'],
  ]),
  experiment('melting', 'קֶרַח הוֹפֵךְ לְמַיִם', 'ice', iceScene, [
    ['הוֹסִיפִי קֶרַח לִשְׁתֵּי הַכּוֹסוֹת.', ['ice'], null, 'יֵשׁ קֶרַח בִּשְׁתֵּי הַכּוֹסוֹת.'],
    ['אֵיפֹה הַקֶּרַח יִמֵּס קֹדֶם?', ['cold','warm'], null, 'בּוֹאִי נִבְדֹּק!'],
    ['נַעֲבִיר קְצָת זְמַן.', ['wait'], null, 'בַּמַּיִם הַחַמִּים הַקֶּרַח נָמֵס מַהֵר יוֹתֵר.'],
    ['אֵיפֹה עוֹד יֵשׁ קֶרַח?', ['warm','cold'], ['cold'], 'בַּכּוֹס הַקָּרָה עוֹד יֵשׁ קֶרַח.'],
    ['נַעֲבִיר עוֹד קְצָת זְמַן.', ['wait'], null, 'גַּם בַּמַּיִם הַקָּרִים הַקֶּרַח נָמֵס.'],
    ['אֵיפֹה תָּשִׂימִי קֶרַח כְּדֵי שֶׁיִּמֵּס מַהֵר יוֹתֵר?', ['cold','warm'], ['warm'], 'בַּמַּיִם הַחַמִּים הַקֶּרַח נָמֵס מַהֵר יוֹתֵר.'],
  ]),
  experiment('shadow', 'גָּדוֹל וְקָטָן בְּאוֹר וּבְצֵל', 'lamp', shadowScene, [
    ['הַדְלִיקִי אֶת הַמְּנוֹרָה.', ['lamp'], null, 'הַבֻּבָּה מַסְתִּירָה אוֹר. רוֹאִים צֵל עַל הַמָּסָךְ.'],
    ['קָרְבִי אֶת הַבֻּבָּה לַמְּנוֹרָה.', ['near'], null, 'הַצֵּל גָּדַל.'],
    ['קָרְבִי אֶת הַבֻּבָּה לַמָּסָךְ.', ['far'], null, 'הַצֵּל קָטַן.'],
    ['אֵיפֹה תָּשִׂימִי אֶת הַבֻּבָּה לְצֵל גָּדוֹל?', ['near','far'], ['near'], 'קָרוֹב לַמְּנוֹרָה, הַצֵּל גָּדוֹל יוֹתֵר.'],
    ['בַּחֲרִי בֻּבָּה חֲדָשָׁה.', ['cat','rabbit'], null, 'גַּם לַבֻּבָּה הַזֹּאת יֵשׁ צֵל.'],
    ['אֵיפֹה תָּשִׂימִי אֶת הַבֻּבָּה לְצֵל קָטָן?', ['near','far'], ['far'], 'קָרוֹב לַמָּסָךְ, הַצֵּל קָטָן יוֹתֵר.'],
  ]),
];

function tankScene(index, answers, selected, choices, seed) {
  const water = '<div class="tsc-aquarium-water"></div><i class="tsc-tank-line"></i>';
  const specimens = [
    ['cork', 0, 28, 37], ['rock', 2, 58, 86], ['wood', 4, 71, 38],
  ].map(([id, introduced, x, y]) => {
    if (index < introduced || (index === introduced && !selected)) return '';
    const active = index > introduced && choices.includes(id);
    const side = mirrored(seed) ? 100 - x : x;
    const location = `style="left:${side}%;top:${y}%"`;
    const css = `tsc-specimen tsc-specimen-${id} ${index === introduced && selected ? 'tsc-landing' : ''}`;
    return active ? button(id, icon(id), css, location, selected)
      : `<span class="${css}" ${location}>${icon(id)}</span>`;
  }).join('');
  const introducing = [0,2,4].includes(index);
  const display = `<div class="tsc-aquarium" ${introducing && !selected ? 'data-trial-drop="'+choices[0]+'"' : ''}>${water}${specimens}</div>`;
  const controls = index === 1 ? tools(choices, selected, seed)
    : [0,2,4].includes(index) ? tools(choices, selected) : '';
  return room('river', display, controls);
}

function oilScene(index, answers, selected, choices, seed) {
  const soapCup = index === 2 ? selected : answers[2];
  const hasOil = index > 0 || Boolean(selected);
  const stirs = (index === 1 || index === 3) && selected;
  const mixed = index > 3 || (index === 3 && selected);
  const cups = ['a','b'].map(slot => {
    const soapy = slot === soapCup;
    const choice = index === 2 ? slot : index > 3 ? (soapy ? 'soapy' : 'plain') : '';
    const label = soapCup ? names[soapy ? 'soapy' : 'plain'] : '';
    const state = !hasOil ? '' : mixed && soapy ? 'mixed' : 'layer';
    const aria = index === 2 ? ((slot === 'a') !== mirrored(seed) ? 'הַכּוֹס הַשְּׂמָאלִית' : 'הַכּוֹס הַיְּמָנִית') : undefined;
    return vessel({ choice, selected, label, aria, state, pouring: index === 0 && selected,
      stir: stirs, mark: index === 2 && selected === slot ? 'soap' : '', soap: soapy });
  });
  return room('honey', pair(cups, seed, [0,1,3].includes(index) && !selected ? choices[0] : ''),
    [0,1,3].includes(index) ? tools(choices, selected) : '');
}

function pepperScene(index, answers, selected, choices, seed) {
  const scattered = index > 3 || (index === 3 && Boolean(selected));
  if (index === 5) {
    const sourceX = selected === 'sideA' ? 32 : 68;
    const spots = choices.map((id,i) => button(id, icon('soap'), 'tsc-spot', `style="left:${i ? 68 : 32}%"`, selected,
      i ? 'טִפַּת סַבּוֹן בַּצַּד הַיְמָנִי' : 'טִפַּת סַבּוֹן בַּצַּד הַשְּׂמָאלִי')).join('');
    return room('lavender', `<div class="tsc-solo-dish">${dishSurface(true, Boolean(selected), sourceX, Boolean(selected))}${!selected ? spots : ''}</div>`, '');
  }
  const bowls = ['plain', 'soapy'].map(id => {
    const choice = index === 1 && id === 'plain' ? 'water' : index === 3 && id === 'soapy' ? 'soap' : index === 4 ? id : '';
    const touched = selected === choice && [1,3].includes(index);
    const known = (id === 'plain' && (index > 1 || (index === 1 && selected))) ||
      (id === 'soapy' && scattered);
    const activeDrop = [1,3].includes(index) && choice && !selected;
    const surface = dishSurface(index > 0 || Boolean(selected), id === 'soapy' && scattered, 50, Boolean(touched));
    const insides = `${surface}${activeDrop ? `<span class="tsc-dropper-tip">${icon(choice)}</span>` : ''}
      ${known ? `<span class="tsc-vessel-label">${names[id === 'plain' ? 'water' : 'soap']}</span>` : ''}`;
    return choice ? button(choice, insides, 'tsc-dish-unit tsc-target', '', selected)
      : `<div class="tsc-dish-unit">${insides}</div>`;
  });
  return room('lavender', pair(bowls, seed, index === 0 && !selected ? 'pepper' : ''), [0,2].includes(index) ? tools(choices, selected, seed) : '');
}

function iceScene(index, answers, selected, choices, seed) {
  const firstWait = index > 2 || (index === 2 && selected);
  const secondWait = index > 4 || (index === 4 && selected);
  const cups = ['cold','warm'].map(id => {
    const added = index === 5 ? id === selected : index > 0 || Boolean(selected);
    const size = !added ? 'none' : index === 5 ? 'new-melt' : secondWait ? 'none'
      : !firstWait ? 'full' : id === 'cold' ? 'small' : 'none';
    const thaw = selected && (index === 2 || (index === 4 && id === 'cold'));
    const cue = id === 'cold' ? 'cold' : 'warm';
    return vessel({choice: choices.includes(id) ? id : '', selected, label: names[id], cue,
      state: 'ice', size, thaw: thaw ? (index === 4 ? 'small' : 'full') : '', pouring: index === 0 && selected });
  });
  return room('frost', pair(cups, seed, index === 0 && !selected ? 'ice' : ''), [0,2,4].includes(index) ? tools(choices, selected) : '');
}

function shadowScene(index, answers, selected, choices, seed) {
  const position = index === 0 ? 'middle' : index === 1 ? selected || 'middle' : index === 2 ? selected || 'near'
    : index === 3 ? selected || 'far' : index === 5 ? selected || 'near' : 'near';
  const actor = index === 4 ? selected || 'duck' : index === 5 ? answers[4] || 'duck' : 'duck';
  const lit = index !== 0 || Boolean(selected);
  const controls = choices.filter(id => id === 'near' || id === 'far').map(id =>
    button(id, `<span>${icon('position')}</span>`, `tsc-mark tsc-mark-${id}`, '', selected)).join('');
  const lamp = choices.includes('lamp') ? button('lamp', icon('lamp'), 'tsc-lamp tsc-target', '', selected)
    : `<span class="tsc-lamp">${icon('lamp')}</span>`;
  const before = index === 1 ? 'middle' : index === 2 ? 'near' : index === 3 ? 'far' : 'near';
  const moving = selected && (choices.includes('near') || choices.includes('far'));
  const stage = `<div class="tsc-rig ${mirrored(seed) ? 'tsc-flipped' : ''}" data-range="${position}" data-from="${before}" data-lit="${lit}" data-moving="${Boolean(moving)}">
    <div class="tsc-screen">${puppet(actor, true)}</div><div class="tsc-beam"></div>
    ${lamp}<div class="tsc-puppet">${puppet(actor)}</div><div class="tsc-rail"></div>${controls}
  </div>`;
  return room('night', stage, index === 4 ? tools(choices, selected, seed) : '');
}

function mirrored(seed) { return (Number(seed) >>> 0) % 2 === 1; }

function room(theme, scene, tray) {
  return `<div class="tsc-room tsc-room-${theme}"><div class="tsc-display">${scene}</div>${tray}</div>`;
}

function pair(cups, seed, drop) {
  return `<div class="tsc-pair" ${drop ? 'data-trial-drop="'+drop+'"' : ''}>${(mirrored(seed) ? cups.slice().reverse() : cups).join('')}</div>`;
}

function button(id, inside, css, attrs, selected, label = names[id]) {
  return `<button type="button" data-trial-choice="${id}" class="tsc-hit ${css}${selected === id ? ' tsc-picked' : ''}" aria-label="${label}" ${selected ? 'disabled' : ''} ${attrs}>${inside}</button>`;
}

function tools(choices, selected, seed) {
  const ordered = mirrored(seed) ? choices.slice().reverse() : choices;
  const draggable = ['cork','rock','wood','oil','stir','pepper','ice'];
  return `<div class="tsc-tray" dir="rtl">${ordered.map(id => button(id,
    `${['cat','rabbit'].includes(id) ? puppet(id) : icon(id)}<b>${names[id]}</b>`,
    'tsc-tool', !selected && draggable.includes(id) ? 'data-trial-drag' : '', selected)).join('')}</div>`;
}

// The apparatus stays the same size between steps. Both cups contain equal
// amounts of the same water and receive equal amounts of oil or equal ice cubes.
function vessel({choice, selected, label, aria, cue, state, size, thaw, pouring, stir, mark, soap}) {
  const oil = ['layer','mixed'].includes(state);
  const drops = oil ? `<svg class="tsc-beads" viewBox="0 0 100 82" preserveAspectRatio="none" aria-hidden="true">
    <g fill="#f8bf30" stroke="#c18c24" stroke-width="1">
      <circle cx="17" cy="12" r="3"/><circle cx="42" cy="18" r="2"/><circle cx="67" cy="9" r="2.5"/>
      <circle cx="83" cy="29" r="3.5"/><circle cx="26" cy="35" r="2.5"/><circle cx="58" cy="36" r="3"/>
      <circle cx="12" cy="52" r="2"/><circle cx="42" cy="48" r="3.5"/><circle cx="70" cy="57" r="2.5"/>
      <circle cx="29" cy="65" r="3"/><circle cx="87" cy="68" r="2"/><circle cx="52" cy="73" r="2.5"/>
    </g></svg>` : '';
  const cube = state === 'ice' && (size !== 'none' || thaw)
    ? `<i class="tsc-cube" data-size="${size}" data-from="${thaw || ''}">${icon('cube')}</i>` : '';
  const head = `${pouring && oil ? '<i class="tsc-pour"></i>' : ''}
    ${mark ? `<span class="tsc-applied">${icon(mark)}</span>` : ''}
    ${stir ? `<span class="tsc-stirring">${icon('stir')}</span>` : ''}`;
  const caption = label ? `<span class="tsc-vessel-label">${cue ? icon(cue) : soap ? icon('soap') : ''}${label}</span>` : '';
  const content = `<div class="tsc-glass-face">${head}<div class="tsc-glass" data-state="${state}" data-stir="${Boolean(stir)}"><div class="tsc-liquid"></div>${drops}${oil && state === 'layer' ? '<i class="tsc-oil-band"></i>' : ''}${cube}<i class="tsc-shine"></i></div></div>${caption}`;
  return choice ? button(choice, content, 'tsc-glass-unit tsc-target', '', selected, aria)
    : `<div class="tsc-glass-unit">${content}</div>`;
}

// Move each visible grain along a ray from the contact point to the rim.
// A clean touch can ripple the surface while leaving the grains distributed.
function dishSurface(sprinkled, scattered, touchX, animated) {
  const grains = [];
  if (sprinkled) for (let i = 0; i < 39; i++) {
    const angle = i * 2.39996 + 0.3;
    const radius = 42 * Math.sqrt((i + 0.4) / 39);
    const x = 50 + radius * Math.cos(angle), y = 50 + radius * Math.sin(angle);
    const dx = x - touchX, dy = y - 50, length = Math.hypot(dx,dy) || 1;
    const ux = dx / length, uy = dy / length;
    const fromCenter = touchX - 50, rim = 40 + i % 6;
    const ray = Math.sqrt(rim * rim - fromCenter * fromCenter * uy * uy) - fromCenter * ux;
    const endX = scattered ? touchX + ray * ux : x, endY = scattered ? 50 + ray * uy : y;
    grains.push(`<i style="--gx:${x.toFixed(2)}%;--gy:${y.toFixed(2)}%;--ex:${endX.toFixed(2)}%;--ey:${endY.toFixed(2)}%;--r:${i * 31}deg;--s:${2.9 + i % 3}px"></i>`);
  }
  return `<div class="tsc-dish" data-wave="${animated}" data-move="${animated && scattered}" style="--touch:${touchX}%"><div class="tsc-surface">${grains.join('')}${animated ? '<span class="tsc-ripple"></span>' : ''}</div></div>`;
}

const actors = {
  duck: '<path d="M8 35q10 1 15-8-2-5 0-11 3-8 12-8 10 0 12 11l10 4-10 5q0 15-14 19C21 51 8 47 6 40Z"/>',
  rabbit: '<path d="M18 35q-3-11 5-16Q16 3 20 2q6-2 12 14Q32 1 37 2q7 1 3 18 9 4 8 12l6 4-7 4q-4 7-13 7H14q-6 0-5-6-7-1-5-6 2-6 8-2Z"/>',
  cat: '<path d="M17 29Q8 18 13 9l11 5q8-3 13 0l9-9 3 15q4 10-5 17 6 4 4 10H21q-6-1-5-7Q3 41 3 30q-1-7 4-6 3 1 2 5 0 5 8 6Z"/>',
};

function puppet(actor, shade=false) {
  return `<svg aria-hidden="true" viewBox="0 0 60 54" class="tsc-actor ${shade ? 'tsc-shade' : ''}" fill="currentColor">${actors[actor] || actors.duck}
    ${shade ? '' : '<circle cx="38" cy="24" r="2" fill="#333752"/>'}</svg>`;
}

const drawings = {
  cork: '<path fill="#b97945" d="m11 25 37-11 7 26-36 11z"/><ellipse cx="49" cy="27" rx="8" ry="14" transform="rotate(-16 49 27)" fill="#dca36a"/><path d="m18 27 8-2m2-3 4-1m-7 18 6-2m4-6 6-2m7-3 1 4" stroke="#79472d" stroke-width="3" stroke-linecap="round"/>',
  rock: '<path d="m5 39 8-19 15-9 19 2 13 27-11 10-33-1Z" fill="#687789" stroke="#344b5a" stroke-width="2.6"/><path d="m13 21 15-9 19 2-9 10-18 6Z" fill="#afbbc1"/><path d="m20 30 18-6 10 24-32 1Z" fill="#81939d"/>',
  wood: '<path d="m8 25 40-13 7 23-39 16z" fill="#a96939" stroke="#734721" stroke-width="2"/><path d="m8 25 39-13 8 5-40 14Z" fill="#e9b67a"/><path d="M16 38q15-1 20-9m-9 12q10-5 16-5" fill="none" stroke="#d69c5c" stroke-width="2.8"/><path fill="#f1c892" d="m47 18 8-1 5 18-7 3Z"/>',
  top: '<path fill="#74b9cb" d="M4 19q7-4 14 0t14 0 14 0 14 0v32H4Z"/><path d="m20 21 5-9 9-3 7 3 4 11-9 3-13-1Z" fill="#687789" stroke="#405969" stroke-width="2"/>',
  bottom: '<path fill="#74b9cb" d="M4 19q7-4 14 0t14 0 14 0 14 0v32H4Z"/><path d="m20 21 5-9 9-3 7 3 4 11-9 3-13-1Z" transform="translate(0 25)" fill="#687789" stroke="#405969" stroke-width="2"/>',
  oil: '<path d="M24 10h15v10l8 9v21H17V29l7-9Z" fill="#ffe5a1" stroke="#ba8a36" stroke-width="2.4"/><path d="M20 31q10-4 24 0v17H20Z" fill="#efb530"/><rect x="23" y="6" width="17" height="7" rx="2" fill="#49715c"/><path d="m25 24-4 6" stroke="#fff" stroke-width="3.5" stroke-linecap="round"/>',
  stir: '<path d="m14 48 23-25" stroke="#955934" stroke-width="7" stroke-linecap="round"/><ellipse cx="43" cy="18" rx="10" ry="15" transform="rotate(39 43 18)" fill="#d8a474" stroke="#9d663f" stroke-width="2.6"/><path d="M38 20q0-7 7-10" stroke="#efc696" stroke-width="3" fill="none" stroke-linecap="round"/>',
  soap: '<path d="M32 4c-3 12-15 20-15 31a15 15 0 0 0 30 0C47 24 36 14 32 4Z" fill="#b58dde" stroke="#7553a2" stroke-width="2.6"/><path d="M24 33q0 8 6 10" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="49" cy="14" r="5" fill="#dfccef" stroke="#9574b8" stroke-width="2"/>',
  water: '<path d="M32 4c-3 12-15 20-15 31a15 15 0 0 0 30 0C47 24 36 14 32 4Z" fill="#73c5dc" stroke="#4388a2" stroke-width="2.6"/><path d="M24 33q0 8 6 10" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>',
  pepper: '<g transform="rotate(23 32 28)"><path d="M20 18h24l4 32q-16 5-32 0Z" fill="#b48e70" stroke="#805943" stroke-width="2.4"/><path d="M18 24h28v21H18Z" fill="#f5d99d"/><circle cx="27" cy="34" r="2.2" fill="#523831"/><circle cx="33" cy="37" r="2.2" fill="#523831"/><circle cx="37" cy="32" r="2.2" fill="#523831"/><rect x="18" y="8" width="28" height="12" rx="4" fill="#8ea4ac"/><path d="M24 12h2m4 0h2m4 0h2" stroke="#425962" stroke-width="2.4"/></g>',
  lamp: '<path d="M16 48h33M31 46V29" stroke="#775331" stroke-width="5" stroke-linecap="round"/><path d="m18 19 10-11 18 6 9 16-23-1Z" fill="#edbc53" stroke="#986c32" stroke-width="2.4"/><path d="m41 15 12 14 5-5-12-13Z" fill="#fff2ad"/>',
  position: '<path d="M11 39q20 7 41-1" stroke="#178c80" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M32 8v22m-8-8 8 9 8-9" stroke="#245d68" stroke-width="5" fill="none" stroke-linejoin="round" stroke-linecap="round"/>',
  cube: '<path d="m11 16 24-7 18 8-3 26-22 7-20-9Z" fill="#a5e8fc" stroke="#5a9fc0" stroke-width="2.2"/><path d="m11 16 20 8 22-7-18-8Z" fill="#e7fbfe"/><path d="m31 24 22-7-3 26-22 7Z" fill="#75c6e5"/><path d="m15 23-1 10m2 4 0 1" stroke="white" stroke-width="3" stroke-linecap="round"/>',
  ice: '<g transform="translate(-3 0) scale(.8)"><path d="m8 18 17-6 14 5-2 22-16 5L7 36Z" fill="#b1edfb" stroke="#5a9fc0" stroke-width="2.5"/><path d="m24 23 15-6-2 22-16 5Z" fill="#85d4e8"/></g><path d="m27 24 17-6 14 5-2 22-16 5-14-8Z" fill="#b1edfb" stroke="#5a9fc0" stroke-width="2.5"/><path d="m43 29 15-6-2 22-16 5Z" fill="#85d4e8"/>',
  wait: '<path d="M19 8h26m-26 39h26" stroke="#966d3e" stroke-width="5" stroke-linecap="round"/><path d="M21 11h22q-1 11-9 16 8 6 9 17H21q0-10 9-17-8-6-9-16Z" fill="#e2f3ed" stroke="#78968b" stroke-width="2"/><path d="M24 16h16l-8 8Z M24 40l8-7 8 7Z" fill="#e7aa49"/>',
};

function icon(id) {
  let body = drawings[id];
  if (id === 'warm' || id === 'cold') body = `<path d="M27 30V10a5 5 0 0 1 10 0v20a11 11 0 1 1-10 0Z" fill="#fff" stroke="#567579" stroke-width="3"/><path d="M32 38V${id === 'warm' ? 13 : 27}" stroke="${id === 'warm' ? '#df7d53' : '#569fc2'}" stroke-width="5" stroke-linecap="round"/><circle cx="32" cy="39" r="7" fill="${id === 'warm' ? '#df7d53' : '#569fc2'}"/>`;
  if (id === 'moves' || id === 'stays') {
    const pts = id === 'moves' ? [[17,15],[30,10],[45,15],[50,29],[43,40],[29,43],[16,36],[13,25]]
      : [[19,18],[30,12],[41,21],[32,29],[47,33],[24,38],[17,31],[31,41]];
    body = '<ellipse cx="32" cy="27" rx="25" ry="22" fill="#a6dadd" stroke="#7aa7aa" stroke-width="2"/>' +
      pts.map(([x,y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#51403a"/>`).join('');
  }
  return `<svg aria-hidden="true" viewBox="0 0 64 56" class="tsc-icon">${body || ''}</svg>`;
}
