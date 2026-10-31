import { HEBREW_HANDWRITING } from './hebrew-handwriting.js';
import { MAIN_LETTER_STROKES } from './letter-main-forms.js';

// Each path is one ordered pen stroke. Models, demonstrations and tracing all
// use these same paths, so the pencil never follows a different font outline.
// The legacy outlines remain available for older cached clients.
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
  ['alef','א','אָלֶף','אלף',["M110 66 L66 185", "M167 102 C111 119 104 161 149 180"]],
  ['bet','ב','בֵּית','בית',["M83 111 C119 93 170 96 169 125 C165 154 122 168 106 145 L78 185"]],
  ['gimel','ג','גִּימֶל','גימל',["M114 99 C117 113 130 121 146 118 C111 123 88 158 120 185"]],
  ['dalet','ד','דָּלֶת','דלת',["M92 105 C150 84 181 108 139 134 L88 146 C147 135 143 165 124 185"]],
  ['he','ה','הֵא','הא',["M83 110 C146 75 184 114 146 155 L112 185", "M100 133 C97 156 88 170 79 179"]],
  ['vav','ו','וָו','וו',["M145 99 L111 187"]],
  ['zayin','ז','זַיִן','זין',["M143 87 L108 129 C163 95 180 130 143 160 C124 175 108 185 88 185"]],
  ['het','ח','חֵית','חית',["M86 125 C176 84 181 112 130 181", "M116 94 L76 183"]],
  ['tet','ט','טֵית','טית',["M150 154 C146 173 111 209 91 170 C73 137 114 96 173 97"]],
  ['yud','י','יוּד','יוד',["M139 114 L127 145"]],
  ['kaf','כ','כַּף','כף',["M103 109 C183 105 176 199 90 180"]],
  ['lamed','ל','לָמֶד','למד',["M96 168 C88 186 104 187 109 165 C116 119 137 42 173 76"]],
  ['mem','מ','מֵם','מם',["M155 97 L109 181 L105 121 L72 188"]],
  ['nun','נ','נוּן','נון',["M147 100 C141 162 122 202 77 186"]],
  ['samekh','ס','סָמֶךְ','סמך',["M96 108 C141 84 179 108 166 149 C154 191 103 204 85 173 C69 146 78 119 96 108"]],
  ['ayin','ע','עַיִן','עין',["M174 118 C153 118 132 126 113 140 C76 167 108 210 131 182 C147 164 133 122 122 93"]],
  ['pe','פ','פֵּא','פא',["M97 112 C154 73 191 116 160 160 C133 199 76 201 84 162 C89 138 124 132 126 148 C126 158 113 169 111 162"]],
  ['tsadi','צ','צָדִי','צדי',["M90 108 C123 83 175 103 153 127 L122 144 C174 140 184 187 94 186"]],
  ['kof','ק','קוֹף','קוף',["M101 108 C160 88 188 124 132 169", "M107 139 L73 223"]],
  ['resh','ר','רֵישׁ','ריש',["M88 111 C154 84 169 125 119 185"]],
  ['shin','ש','שִׁין','שין',["M166 177 C125 205 76 182 78 144 C78 98 111 86 142 86 C183 86 181 132 149 141 L81 155"]],
  ['tav','ת','תָּו','תו',["M82 113 C79 82 152 79 158 116 L158 185", "M82 113 L82 185 L64 185"]],
  ['kaf-final','ך','כַּף סוֹפִית','כף סופית',["M108 102 C168 94 148 157 92 222"]],
  ['mem-final','ם','מֵם סוֹפִית','מם סופית',["M115 119 C143 75 185 118 163 151 C140 183 107 142 115 119 L80 186"]],
  ['nun-final','ן','נוּן סוֹפִית','נון סופית',["M145 98 L101 225"]],
  ['pe-final','ף','פֵּא סוֹפִית','פא סופית',["M103 197 C78 198 79 221 103 224 C122 225 115 201 115 182 L115 104 C115 67 147 54 166 72 C196 100 166 128 126 127 L81 139"]],
  ['tsadi-final','ץ','צָדִי סוֹפִית','צדי סופית',["M103 197 C78 198 79 221 103 224 C122 225 115 201 115 182 L115 104 C115 67 147 54 166 72 C196 100 166 128 126 127 C99 126 85 109 85 75"]],
];

export const LETTERS = Object.freeze({
  english: EN.map(([small, ...strokes]) => Object.freeze({ id: `en-${small}`, familiar: small.toUpperCase(), small, name: small.toUpperCase(), spoken: `The letter ${small.toUpperCase()}.`, clip: `letter-en-${small}`, language: 'english', strokes })),
  hebrew: HE.map(([id, familiar, spoken, name, strokes]) => Object.freeze({ id: `he-${id}`, familiar, small: familiar, spoken, name, clip: `letter-he-${id}`, language: 'hebrew', final: id.endsWith('-final'), outline: HEBREW_HANDWRITING[familiar], strokes })),
});

export const WRITING_FORMS = Object.freeze(['main', 'alternate']);
export const writingMode = form => form === 'main' ? 'writingMain' : 'writing';
export const writingPositionKey = form => form === 'main' ? 'letterMainWriting' : 'letterWriting';
const MAIN_LETTERS = Object.freeze(Object.fromEntries(Object.entries(LETTERS).map(([language, letters]) => [language,
  Object.freeze(letters.map((letter, index) => Object.freeze({ ...letter, form: 'main', strokes: MAIN_LETTER_STROKES[language][index] }))),
])));

export function writingLetter(language, index, form = 'alternate') {
  if (!Object.hasOwn(LETTERS, language)) language = 'hebrew';
  if (!Number.isInteger(index) || index < 0 || index >= LETTERS[language].length) index = 0;
  return (form === 'main' ? MAIN_LETTERS : LETTERS)[language][index];
}

export function letterGroup(language, start = 0) {
  const letters = Object.hasOwn(LETTERS, language) ? LETTERS[language] : LETTERS.hebrew;
  const index = Number.isInteger(start) && start >= 0 && start < letters.length ? start : 0;
  return Array.from({ length: 3 }, (_, offset) => letters[(index + offset) % letters.length]);
}

export function letterShape(letter, { guide = false, pad = false } = {}) {
  const hebrew = letter.language === 'hebrew';
  const main = letter.form === 'main';
  return `<svg class="letter-shape ${pad ? 'letter-pad' : ''} ${hebrew ? main ? 'hebrew-print' : 'hebrew-handwriting' : main ? 'english-capital' : ''}" data-letter-form="${main ? 'main' : 'alternate'}" lang="${hebrew ? 'he' : 'en'}" dir="${hebrew ? 'rtl' : 'ltr'}" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${hebrew ? `האות ${letter.name} ${main ? 'בדפוס' : 'בכתב יד'}` : `האות ${letter.familiar} ${main ? 'הגדולה' : 'הקטנה'}`}">
    ${guide ? `<g class="writing-lines" aria-hidden="true"><path d="M15 46H225M15 ${hebrew && main ? 96 : 104}H225M15 190H225M15 225H225"/></g>` : ''}
    <g class="letter-guide" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">${letter.strokes.map((d, i) => `<path d="${d}" ${pad ? `data-stroke="${i}"` : ''}/>`).join('')}</g>
    ${pad ? '<g class="letter-ink" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"></g><g class="letter-direction" aria-hidden="true"><path class="letter-direction-line"/><path class="letter-direction-tip"/></g><g class="letter-start" aria-hidden="true"><circle r="13"/><text text-anchor="middle" dy="4"></text></g><circle class="writing-pencil" r="8" hidden aria-hidden="true"/>' : ''}
  </svg>`;
}

// Follow nearby points in order, tolerating a small child's finger movements.
export function advanceTrace(points, progress, point, tolerance = 25, previousPoint = points[progress]) {
  let best = progress, distance = tolerance;
  const travel = Math.hypot(point.x - previousPoint.x, point.y - previousPoint.y);
  const maxAdvance = travel * 1.25 + 3;
  let arc = 0;
  for (let i = progress; i < Math.min(points.length, progress + 14); i++) {
    if (i > progress) arc += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    if (arc > maxAdvance) break;
    const candidate = Math.hypot(points[i].x - point.x, points[i].y - point.y);
    if (candidate < distance) { distance = candidate; best = i; }
  }
  return best;
}
