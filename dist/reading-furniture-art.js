// A side view leaves the floor between the legs visible. All three surfaces
// sit at y=109 so an object placed on them actually touches the seat or quilt.
const furnitureArt = {
  chair: '<g stroke="#966849" stroke-width="7" stroke-linecap="round"><path d="M85 109l-4 70m73-70 7 70M91 104V42m60 62V42"/></g>'
    + '<rect x="84" y="37" width="74" height="31" rx="9" fill="#daa377" stroke="#a87452" stroke-width="3"/><path d="M95 48q25-3 52 0" fill="none" stroke="#edbd94" stroke-width="3" stroke-linecap="round"/>'
    + '<path d="M87 99h66l15 11H76Z" fill="#efbd85"/><rect x="76" y="108" width="92" height="9" rx="4" fill="#bd8459"/>',
  bench: '<g stroke="#416f71" stroke-width="7" stroke-linecap="round"><path d="M68 108l-4 70m111-70 5 70M74 103V55m95 48V55"/></g>'
    + '<g fill="#78b9a5" stroke="#4d8c82" stroke-width="2.5"><rect x="57" y="51" width="129" height="14" rx="4"/><rect x="57" y="71" width="129" height="14" rx="4"/></g>'
    + '<path d="M64 97h114l13 12H53Z" fill="#99cbbb"/><rect x="53" y="108" width="138" height="9" rx="4" fill="#55968a"/>',
  bed: '<path d="M65 108v69m112-69v69" fill="none" stroke="#917463" stroke-width="9" stroke-linecap="round"/>'
    + '<rect x="56" y="67" width="11" height="49" rx="5" fill="#ac886f"/><rect x="60" y="95" width="126" height="20" rx="7" fill="#f4e6ce"/>'
    + '<path d="M66 95q1-16 13-16h11q11 0 15 16Z" fill="#fff8e8" stroke="#dbbea7" stroke-width="2"/>'
    + '<path d="M97 95q8-5 15-2l68 10q5 2 5 6v11H99q-4-14-2-25Z" fill="#ae92cc"/><path d="m106 99 67 10" fill="none" stroke="#d6bde8" stroke-width="3"/>'
    + '<rect x="55" y="117" width="136" height="8" rx="4" fill="#a8846e"/>',
};

// The original artwork has different amounts of transparent margin. Framing
// the visible shapes keeps a narrow balloon and a wide shoe equally legible.
const objectBounds = {
  balloon: '60 13 94 174', ball: '24 24 152 152', hat: '16 32 169 150',
  flower: '31 14 140 172', shirt: '13 23 174 155', shoe: '15 24 171 162',
  backpack: '35 20 136 164', gift: '13 17 174 165',
};

export function furnitureScene({ anchor, position, object }, objectArt) {
  const frame = furnitureArt[anchor];
  if (!frame) return null;
  const [x, bottom, width, height] = {
    on: [97, anchor === 'bed' ? 100 : 107, 61, 69],
    under: [94, 177, 60, 48],
    near: [1, 177, 49, 57],
  }[position];
  return frame + `<svg x="${x}" y="${bottom - height}" width="${width}" height="${height}" viewBox="${objectBounds[object]}" preserveAspectRatio="xMidYMax meet">${objectArt}</svg>`;
}
