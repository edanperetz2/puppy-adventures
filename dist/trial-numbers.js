import { art, pup } from './art.js';

const apples = ['אֶפֶס תַּפּוּחִים', 'תַּפּוּחַ אֶחָד', 'שְׁנֵי תַּפּוּחִים', 'שְׁלוֹשָׁה תַּפּוּחִים',
  'אַרְבָּעָה תַּפּוּחִים', 'חֲמִשָּׁה תַּפּוּחִים', 'שִׁשָּׁה תַּפּוּחִים', 'שִׁבְעָה תַּפּוּחִים', 'שְׁמוֹנָה תַּפּוּחִים'];
const spokenCounts = ['אֶפֶס', 'אַחַת', 'שְׁתַּיִם', 'שָׁלוֹשׁ', 'אַרְבַּע', 'חָמֵשׁ', 'שֵׁשׁ', 'שֶׁבַע', 'שְׁמוֹנֶה'];
const repeat = (n, render) => Array.from({ length: n }, (_, i) => render(i)).join('');
const choicesFor = (n, others) => [n, ...others].map(value => ({ id: String(value), label: String(value) }));

function frame(contents, description, type) {
  return `<div class="tw-number-world tw-world-${type}" role="img" aria-label="${description}">${contents}</div>`;
}

function tokens(type, count) {
  return `<span class="tw-tokens" aria-hidden="true">${repeat(count, () => art(type))}</span>`;
}

// Each setting has a visible well. A missing object leaves a countable empty
// place; filled wells stay in their original locations after the choice.
function missingStep(total, present, kind, offset, distractors, model = false) {
  const plates = kind === 'plate', needed = total - present;
  const noun = plates ? 'צַלָּחוֹת' : 'בֵּיצִים';
  const goal = plates ? 'צַלַּחַת לְכָל חָבֵר' : 'בֵּיצָה בְּכָל שֶׁקַע';
  const prompt = model ? 'חֲסֵרָה צַלַּחַת אַחַת. בַּחֲרִי אוֹתָהּ.' :
    plates ? 'כַּמָּה צַלָּחוֹת חֲסֵרוֹת?' : 'כַּמָּה בֵּיצִים חֲסֵרוֹת בַּתַּבְנִית?';
  const object = plates ? '<i class="tw-plate"></i>' : '<i class="tw-egg"></i>';
  return {
    prompt, correct: [String(needed)],
    choices: choicesFor(needed, distractors).map(({ id }) => ({
      id, label: '', ariaLabel: `${noun}, ${spokenCounts[Number(id)]}`,
      art: `<span class="tw-small-tray" aria-hidden="true">${repeat(Number(id), () => object)}</span>`,
    })),
    hint: 'חַפְּשִׂי אֶת הַמְּקוֹמוֹת הָרֵיקִים.',
    result: `עַכְשָׁו יֵשׁ ${goal}.`,
    scene: (_answers, selected, seed = 0) => {
      const shift = (Number(seed) % total + offset) % total;
      const wells = repeat(total, i => {
        // Rotate an evenly distributed set of gaps to avoid teaching a location.
        const position = (i + shift) % total;
        const originallyFilled = Math.floor((position + 1) * needed / total) === Math.floor(position * needed / total);
        return `<span class="tw-well${originallyFilled ? '' : ' tw-open-place'}${!originallyFilled && selected ? ' tw-filled-now' : ''}">
          ${plates ? '<i class="tw-fork"></i><i class="tw-napkin"></i>' : ''}
          ${originallyFilled || selected ? object : '<i class="tw-empty-ring"></i>'}
        </span>`;
      });
      const description = plates ? `שולחן עם ${total} מקומות ו-${selected ? total : present} צלחות` :
        `תבנית עם ${total} מקומות ו-${selected ? total : present} ביצים`;
      return frame(`<div class="tw-setting tw-setting-${kind}" style="--tw-cols:${Math.min(total, total > 5 ? Math.ceil(total / 2) : 5)}">${wells}</div>`, description, kind);
    },
  };
}

function missingSet(alternate) {
  return [
    missingStep(2, 1, 'plate', 0, [2], true),
    missingStep(3, alternate ? 2 : 1, 'plate', 1, alternate ? [2] : [1]),
    missingStep(4, alternate ? 1 : 3, 'plate', 2, alternate ? [1, 2] : [2, 3]),
    missingStep(5, alternate ? 3 : 2, 'plate', 0, alternate ? [1, 3] : [1, 2]),
    missingStep(6, alternate ? 4 : 5, 'egg', 0, alternate ? [1, 3] : [2, 3]),
    missingStep(6, alternate ? 3 : 4, 'egg', 2, alternate ? [2, 4] : [1, 3]),
  ];
}

function quantityStep(count, distractors) {
  return {
    prompt: `בַּחֲרִי מַגָּשׁ עִם ${apples[count]}.`,
    choices: choicesFor(count, distractors).map(({ id }) => ({
      id, label: '', ariaLabel: apples[Number(id)], art: `<span class="tw-fruit-tray">${tokens('apple', Number(id))}</span>`,
    })),
    correct: [String(count)], hint: 'סִפְרִי אֶת הַתַּפּוּחִים בְּכָל מַגָּשׁ.',
    result: `בַּסַּל יֵשׁ ${apples[count]}.`,
    scene: (_answers, selected) => frame(
      `<div class="tw-target-number" aria-hidden="true">${count}</div>
       <div class="tw-basket${selected ? ' tw-filled-now' : ''}">${selected ? tokens('apple', count) : ''}</div>`,
      selected ? `בסל ${apples[count]}` : `הסל ריק. לולי ביקשה ${apples[count]}`, 'quantity'),
  };
}

function groupsSet(alternate) {
  return (alternate ? [[1, 2], [3, 2], [2, 1, 3], [5, 4, 3], [4, 3, 5], [7, 5, 6]]
    : [[2, 1], [1, 3], [3, 2, 4], [4, 5, 3], [6, 4, 5], [5, 6, 7]])
    .map(([count, ...others]) => quantityStep(count, others));
}

function givingStep(total, given, others) {
  const left = total - given;
  const form = ['','תַּפּוּחַ אֶחָד','שְׁנֵי תַּפּוּחִים','שְׁלוֹשָׁה תַּפּוּחִים'][given];
  return {
    prompt: `לוּלִי לָקְחָה ${form}. כַּמָּה נִשְׁאֲרוּ בַּסַּל?`,
    choices: choicesFor(left, others), correct: [String(left)],
    hint: 'נִסְפֹּר רַק אֶת מַה שֶׁנִּשְׁאַר בַּסַּל.',
    result: left === 0 ? 'הַסַּל רֵיק.' : `בַּסַּל יֵשׁ ${apples[left]}.`,
    scene: (_answers, selected) => frame(
      `<div class="tw-giving ${selected ? 'tw-giving-done' : ''}" dir="ltr">
        <div class="tw-basket">${tokens('apple', left)}</div>
        <div class="tw-recipient">${pup('luli')}<div class="tw-given">${tokens('apple', given)}</div></div>
      </div>`, `היו בסל ${total} תפוחים. לולי לקחה ${given}. עכשיו יש בסל ${left} ואצל לולי ${given}.`, 'giving'),
  };
}

function givingSet(alternate) {
  return (alternate ? [[1, 1, 1], [3, 1, 3], [3, 2, 2, 3], [5, 2, 2, 5], [6, 2, 3, 5], [8, 3, 4, 6]] :
    [[2, 1, 2], [2, 2, 2], [4, 1, 2, 4], [4, 2, 1, 4], [6, 1, 4, 6], [7, 3, 3, 5]])
    .map(([total, given, ...others]) => givingStep(total, given, others));
}

const tenStrip = () => `<span class="tw-ten-strip" aria-hidden="true">${repeat(10, () => '<i></i>')}</span>`;
function blocks(amount, loose = false) {
  const rods = loose ? 0 : Math.floor(amount / 10);
  const singles = loose ? amount : amount % 10;
  return `<div class="tw-blocks" dir="ltr">${rods ? `<div class="tw-rods">${repeat(rods, tenStrip)}</div>` : ''}
   ${singles ? `<div class="tw-singles${loose ? ' tw-many-singles' : ''}">${repeat(singles, () => '<i></i>')}</div>` : ''}</div>`;
}

function bundleAction(unpack) {
  const id = unpack ? 'apart' : 'bundle';
  const label = unpack ? 'נְפָרֵק' : 'נְחַבֵּר';
  return {
    prompt: unpack ? 'גְּעִי בַּמּוֹט וְנִרְאֶה מָה יֵשׁ בְּתוֹכוֹ.' : 'גְּעִי בַּקֻּבִּיּוֹת וּנְחַבֵּר אוֹתָן לְמוֹט.',
    choices: [{ id, label }], direct: true, correct: [id],
    result: unpack ? 'בַּמּוֹט יֵשׁ עֶשֶׂר קֻבִּיּוֹת.' : 'עֶשֶׂר קֻבִּיּוֹת יוֹצְרוֹת מוֹט אֶחָד.',
    scene: (_answers, selected) => {
      const content = blocks(10, unpack ? Boolean(selected) : !selected);
      return `<div class="tw-number-world tw-world-blocks">${selected ?
        `<div class="tw-block-action tw-block-result" role="img" aria-label="${unpack ? 'עשר קוביות נפרדות' : 'מוט של עשר קוביות'}">${content}</div>` :
        `<button type="button" class="tw-block-action" data-trial-choice="${id}" aria-label="${label}">${content}</button>`}</div>`;
    },
  };
}

function tenStep(count, others) {
  const result = {
    10: 'בַּמּוֹט יֵשׁ עֶשֶׂר קֻבִּיּוֹת.',
    12: 'עֶשֶׂר וְעוֹד שְׁתַּיִם. שְׁתֵּים עֶשְׂרֵה!',
    13: 'עֶשֶׂר וְעוֹד שָׁלוֹשׁ. שְׁלוֹשׁ עֶשְׂרֵה!',
    20: 'שְׁנֵי מוֹטוֹת שֶׁל עֶשֶׂר. עֶשְׂרִים!',
    22: 'עֶשְׂרִים וְעוֹד שְׁתַּיִם. עֶשְׂרִים וּשְׁתַּיִם!',
    23: 'עֶשְׂרִים וְעוֹד שָׁלוֹשׁ. עֶשְׂרִים וְשָׁלוֹשׁ!',
  }[count];
  return {
    prompt: 'כַּמָּה קֻבִּיּוֹת יֵשׁ בְּיַחַד?',
    choices: choicesFor(count, others), correct: [String(count)],
    hint: 'כָּל מוֹט שָׁוֶה עֶשֶׂר.', result,
    scene: (_answers, selected) => frame(`${blocks(count)}${selected ? `<b class="tw-block-total">${count}</b>` : ''}`,
      `${Math.floor(count / 10)} מוטות של עשר ועוד ${count % 10} קוביות בודדות`, 'blocks'),
  };
}

function tensSet(alternate) {
  return [bundleAction(false), bundleAction(true), tenStep(10, [1, 9]),
    alternate ? tenStep(13, [3, 16]) : tenStep(12, [2, 14]), tenStep(20, [2, 10]),
    alternate ? tenStep(23, [13, 32]) : tenStep(22, [12, 24])];
}

export const numberGames = [
  { id: 'number-missing', title: 'כַּמָּה חֲסֵרוֹת?', icon: 'plate', steps: missingSet(false), variants: [missingSet(true)] },
  { id: 'number-groups', title: 'הַמַּגָּשׁ הַמַּתְאִים', icon: 'apple', steps: groupsSet(false), variants: [groupsSet(true)] },
  { id: 'number-giving', title: 'תַּפּוּחִים לְלוּלִי', icon: 'basket', steps: givingSet(false), variants: [givingSet(true)] },
  { id: 'number-ten', title: 'מֵעֶשֶׂר קֻבִּיּוֹת לְמוֹט', icon: 'brick', steps: tensSet(false), variants: [tensSet(true)] },
];
