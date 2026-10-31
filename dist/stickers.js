// Stable order: the original twelve rewards keep their IDs and pictures.
export const LEGACY_STICKERS = Object.freeze(['flower', 'boat', 'star', 'dog', 'butterfly', 'rocket', 'rainbow', 'ball', 'cat', 'sun', 'house', 'heart']);
export const STICKER_COUNT = 1000;
export const STICKERS_PER_PAGE = 20;
export const STICKERS = Object.freeze(Array.from({ length: STICKER_COUNT }, (_, i) => LEGACY_STICKERS[i] || `sticker-${String(i + 1).padStart(4, '0')}`));
const indices = new Map(STICKERS.map((id, i) => [id, i]));

// Fifty familiar illustrations visit twenty different places.
export const STICKER_MOTIFS = Object.freeze([
  ['flower', 'פרח'], ['boat', 'סירה'], ['star', 'כוכב'], ['dog', 'לולי'], ['butterfly', 'פרפר'], ['rocket', 'חללית'], ['rainbow', 'קשת'], ['ball', 'כדור'], ['cat', 'חתול'], ['sun', 'שמש'], ['house', 'בית'], ['heart', 'לב'],
  ['fish', 'דג'], ['bird', 'ציפור'], ['rabbit', 'ארנב'], ['horse', 'סוס'], ['bear', 'דוב'], ['duck', 'ברווז'], ['tree', 'עץ'], ['apple', 'תפוח'], ['berry', 'תות'], ['sea', 'גלים'],
  ['grapes', 'ענבים'], ['watermelon', 'אבטיח'], ['pineapple', 'אננס'], ['airplane', 'מטוס'], ['helicopter', 'מסוק'], ['snail', 'חילזון'], ['guitar', 'גיטרה'], ['car', 'מכונית'], ['bicycle', 'אופניים'], ['umbrella', 'מטרייה'],
  ['tractor', 'טרקטור'], ['bulldozer', 'בולדוזר'], ['dinosaur', 'דינוזאור'], ['chocolate', 'שוקולד'], ['trumpet', 'חצוצרה'], ['clock', 'שעון'], ['firetruck', 'כבאית'], ['ambulance', 'אמבולנס'], ['bus', 'אוטובוס'], ['backhoe', 'מחפרון'],
  ['hedgehog', 'קיפוד'], ['hen', 'תרנגולת'], ['ladybug', 'חיפושית'], ['toys', 'צעצועים'], ['slide', 'מגלשה'], ['swing', 'נדנדה'], ['backpack', 'תרמיל'], ['telescope', 'טלסקופ'],
].map(Object.freeze));

export const STICKER_THEMES = Object.freeze([
  'בגינת הפרחים', 'בחוף הים', 'בין הכוכבים', 'ביער', 'בשלג', 'במסיבה', 'מתחת לים', 'בגן המשחקים', 'בפיקניק', 'בעיר',
  'ליד הקשת', 'במדבר', 'במטע', 'ליד הטירה', 'בלילה', 'בהרים', 'ליד האגם', 'בין העננים', 'באתר הבנייה', 'בחגיגת לבבות',
]);

export function isSticker(id) { return indices.has(id); }

export function stickerDefinition(id) {
  const index = indices.get(id);
  if (index === undefined) return null;
  const [motif, name] = STICKER_MOTIFS[index % STICKER_MOTIFS.length];
  const theme = Math.floor(index / STICKER_MOTIFS.length);
  return { index, motif, theme, name: `${name} ${STICKER_THEMES[theme]}`, original: index < LEGACY_STICKERS.length };
}

export function stickerPage(earnedIds, requestedPage) {
  const earned = new Set(Array.isArray(earnedIds) ? earnedIds.filter(isSticker) : []);
  const latest = Math.max(0, ...Array.from(earned, id => indices.get(id)));
  const pageCount = Math.ceil(STICKERS.length / STICKERS_PER_PAGE);
  const preferred = Number.isSafeInteger(requestedPage) ? requestedPage : Math.floor(latest / STICKERS_PER_PAGE);
  const index = Math.max(0, Math.min(pageCount - 1, preferred));
  const start = index * STICKERS_PER_PAGE;
  return {
    index, pageCount, start, end: Math.min(STICKERS.length, start + STICKERS_PER_PAGE), collected: earned.size,
    entries: STICKERS.slice(start, start + STICKERS_PER_PAGE).map((id, offset) => ({ id, number: start + offset + 1, unlocked: earned.has(id) })),
  };
}
