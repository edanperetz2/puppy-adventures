import { HEBREW_HANDWRITING } from './hebrew-handwriting.js';

// Each centerline is a pen stroke, not the outline of a glyph.
// Hebrew uses the original Gveret Levin outlines for consistent, native forms.
const EN = [
  ['a','M158 110 C123 82 76 104 76 148 C76 195 131 201 157 165','M158 103 L158 188'],
  ['b','M82 46 L82 188','M83 124 C112 83 163 103 163 147 C163 189 110 204 83 168'],
  ['c','M163 116 C133 84 78 104 78 148 C78 192 132 204 163 174'],
  ['d','M157 112 C126 87 77 104 77 148 C77 192 129 202 157 165','M158 46 L158 188'],
  ['e','M79 143 L165 143 C166 98 105 87 83 124 C59 165 104 213 161 177'],
  ['f','M157 51 C118 28 103 58 103 96 L103 188','M77 110 L151 110'],
  ['g','M157 113 C126 86 77 104 77 148 C77 192 131 201 157 164','M158 103 L158 195 C158 231 111 239 87 217'],
  ['h','M82 46 L82 188','M83 130 C104 90 159 94 159 139 L159 188'],
  ['i','M120 106 L120 188','M120 72 L120 73'],
  ['j','M139 106 L139 198 C139 226 110 237 88 219','M139 72 L139 73'],
  ['k','M85 46 L85 188','M162 104 L86 151','M118 133 L168 188'],
  ['l','M119 46 L119 188'],
  ['m','M58 106 L58 188','M58 132 C68 93 115 92 115 137 L115 188','M115 131 C128 93 176 94 176 138 L176 188'],
  ['n','M82 106 L82 188','M82 131 C100 92 159 93 159 139 L159 188'],
  ['o','M121 102 C64 102 64 191 121 191 C178 191 178 102 121 102'],
  ['p','M82 106 L82 226','M83 124 C111 84 163 103 163 147 C163 189 109 204 83 168'],
  ['q','M157 113 C126 87 77 103 77 147 C77 191 131 202 157 165','M158 106 L158 226'],
  ['r','M90 106 L90 188','M90 131 C104 102 131 93 154 108'],
  ['s','M160 115 C135 92 87 97 87 123 C87 151 159 138 159 166 C159 193 109 204 80 177'],
  ['t','M111 65 L111 164 C111 191 134 198 155 180','M78 108 L153 108'],
  ['u','M82 106 L82 158 C82 204 144 202 158 162','M158 106 L158 188'],
  ['v','M77 106 L120 188 L164 106'],
  ['w','M49 106 L82 188 L119 116 L156 188 L190 106'],
  ['x','M80 106 L161 188','M161 106 L80 188'],
  ['y','M78 106 L121 184','M163 106 L103 226'],
  ['z','M80 106 L161 106 L80 188 L161 188'],
];

const HE = [
  ['alef','א','אָלֶף','אלף',['M110 66 L66 185','M167 102 C111 119 104 161 149 180']],
  ['bet','ב','בֵּית','בית',['M83 111 C119 93 170 96 169 125 C165 154 122 168 106 145 L78 185']],
  ['gimel','ג','גִּימֶל','גימל',['M114 99 C117 116 134 122 157 118 C119 121 78 157 120 185']],
  ['dalet','ד','דָּלֶת','דלת',['M92 105 C150 84 181 108 139 134 L88 146 C147 135 143 165 124 185']],
  ['he','ה','הֵא','הא',['M83 110 C146 75 184 114 146 155 L112 185','M100 133 C97 156 88 170 79 179']],
  ['vav','ו','וָו','וו',['M145 99 L111 187']],
  ['zayin','ז','זַיִן','זין',['M143 87 L108 129 C163 95 180 130 143 160 C124 175 108 185 88 185']],
  ['het','ח','חֵית','חית',['M116 94 L76 183','M86 125 C176 84 181 112 130 181']],
  ['tet','ט','טֵית','טית',['M173 97 C114 96 73 137 91 170 C111 209 146 173 150 154']],
  ['yud','י','יוּד','יוד',['M139 114 L127 145']],
  ['kaf','כ','כַּף','כף',['M103 109 C183 105 176 199 90 180']],
  ['lamed','ל','לָמֶד','למד',['M173 76 C137 42 116 119 109 165 C104 187 88 186 96 168']],
  ['mem','מ','מֵם','מם',['M72 188 L105 121 L109 181 L155 97']],
  ['nun','נ','נוּן','נון',['M147 100 C141 162 122 202 77 186']],
  ['samekh','ס','סָמֶךְ','סמך',['M125 117 C78 111 70 195 120 186 C164 180 180 94 128 108 L112 112']],
  ['ayin','ע','עַיִן','עין',['M122 93 C133 122 147 164 131 182 C108 210 76 167 113 140 C132 126 153 118 174 118']],
  ['pe','פ','פֵּא','פא',['M97 112 C154 73 191 116 160 160 C133 199 76 201 84 162 C89 138 124 132 126 148 C126 158 113 169 111 162']],
  ['tsadi','צ','צָדִי','צדי',['M108 104 C165 89 181 113 126 140 C185 134 188 185 95 181']],
  ['kof','ק','קוֹף','קוף',['M101 108 C160 88 188 124 132 169','M107 139 L73 223']],
  ['resh','ר','רֵישׁ','ריש',['M88 111 C154 84 169 125 119 185']],
  ['shin','ש','שִׁין','שין',['M88 171 C119 155 182 116 158 98 C131 87 87 159 111 184 C131 205 154 184 160 157']],
  ['tav','ת','תָּו','תו',['M164 146 C164 112 146 91 140 109 C132 135 140 191 78 189']],
  ['kaf-final','ך','כַּף סוֹפִית','כף סופית',['M108 102 C168 94 148 157 92 222']],
  ['mem-final','ם','מֵם סוֹפִית','מם סופית',['M80 186 L115 119 C143 75 185 118 163 151 C140 183 107 142 115 119']],
  ['nun-final','ן','נוּן סוֹפִית','נון סופית',['M145 98 L101 225']],
  ['pe-final','ף','פֵּא סוֹפִית','פא סופית',['M87 137 C104 104 182 108 175 75 C165 41 134 73 132 105 L111 184 C108 200 86 196 95 186']],
  ['tsadi-final','ץ','צָדִי סוֹפִית','צדי סופית',['M88 69 C82 106 100 118 126 118','M126 118 C202 99 179 40 147 77 C130 97 113 164 96 198 C88 212 78 203 94 192']],
];

export const LETTERS = Object.freeze({
  english: EN.map(([small, ...strokes]) => Object.freeze({ id: `en-${small}`, familiar: small.toUpperCase(), small, name: small.toUpperCase(), spoken: `The letter ${small.toUpperCase()}.`, clip: `letter-en-${small}`, language: 'english', strokes })),
  hebrew: HE.map(([id, familiar, spoken, name, strokes]) => Object.freeze({ id: `he-${id}`, familiar, small: familiar, spoken, name, clip: `letter-he-${id}`, language: 'hebrew', final: id.endsWith('-final'), outline: HEBREW_HANDWRITING[familiar], strokes })),
});

export function letterGroup(language, start = 0) {
  const letters = Object.hasOwn(LETTERS, language) ? LETTERS[language] : LETTERS.hebrew;
  const index = Number.isInteger(start) && start >= 0 && start < letters.length ? start : 0;
  return Array.from({ length: 3 }, (_, offset) => letters[(index + offset) % letters.length]);
}

let shapeId = 0;

export function letterShape(letter, { guide = false, pad = false } = {}) {
  const hebrew = letter.language === 'hebrew';
  const clip = hebrew && pad ? `hebrew-ink-${++shapeId}` : '';
  return `<svg class="letter-shape ${pad ? 'letter-pad' : ''} ${hebrew ? 'hebrew-handwriting' : ''}" lang="${hebrew ? 'he' : 'en'}" dir="${hebrew ? 'rtl' : 'ltr'}" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${hebrew ? `האות ${letter.name} בכתב יד` : `האות ${letter.familiar} הקטנה`}">
    ${guide ? '<g class="writing-lines" aria-hidden="true"><path d="M15 46H225M15 104H225M15 190H225M15 225H225"/></g>' : ''}
    ${hebrew ? `<path class="letter-model" d="${letter.outline}" fill="currentColor"/>` : ''}
    ${!hebrew || pad ? `<g class="letter-guide" fill="none" stroke="currentColor" stroke-width="${hebrew ? '2' : '11'}" stroke-linecap="round" stroke-linejoin="round" ${hebrew ? 'aria-hidden="true"' : ''}>${letter.strokes.map((d, i) => `<path d="${d}" data-stroke="${i}"/>`).join('')}</g>` : ''}
    ${pad ? `${hebrew ? `<defs><clipPath id="${clip}" clipPathUnits="userSpaceOnUse"><path d="${letter.outline}"/></clipPath></defs>` : ''}<g class="letter-ink" ${clip ? `clip-path="url(#${clip})"` : ''} fill="none" stroke="currentColor" stroke-width="${hebrew ? '32' : '11'}" stroke-linecap="round" stroke-linejoin="round"></g><g class="letter-start" aria-hidden="true"><circle r="13"/><text text-anchor="middle" dy="4"></text></g><circle class="writing-pencil" r="8" hidden aria-hidden="true"/>` : ''}
  </svg>`;
}

// Follow nearby points in order, tolerating a small child's finger movements.
export function advanceTrace(points, progress, point, tolerance = 25) {
  let best = progress, distance = tolerance;
  for (let i = progress; i < Math.min(points.length, progress + 14); i++) {
    const candidate = Math.hypot(points[i].x - point.x, points[i].y - point.y);
    if (candidate < distance) { distance = candidate; best = i; }
  }
  return best;
}
