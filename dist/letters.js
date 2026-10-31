// Single-line teaching forms: English manuscript and Israeli Hebrew cursive.
// Each path is one pen stroke, in demonstration order. See README for references.
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
  ['alef','א','אָלֶף','אלף',['M105 63 L62 187','M174 119 C112 119 91 177 169 184']],
  ['bet','ב','בֵּית','בית',['M79 108 C119 86 179 92 177 124 C173 156 122 172 106 143 L77 189']],
  ['gimel','ג','גִּימֶל','גימל',['M105 87 C117 123 137 125 160 117 C118 119 79 150 107 180 L124 192']],
  ['dalet','ד','דָּלֶת','דלת',['M82 104 C152 75 189 110 133 134 L86 144 C152 123 155 163 128 189']],
  ['he','ה','הֵא','הא',['M79 107 C154 66 193 112 149 157 L112 190','M100 133 C97 156 88 170 75 182']],
  ['vav','ו','וָו','וו',['M145 99 L111 187']],
  ['zayin','ז','זַיִן','זין',['M142 86 L107 124 C174 89 185 126 155 153 C132 175 109 183 82 188']],
  ['het','ח','חֵית','חית',['M108 94 L73 187','M95 124 C168 76 191 115 137 187']],
  ['tet','ט','טֵית','טית',['M175 96 C112 94 73 135 91 170 C109 210 161 181 157 141']],
  ['yud','י','יוּד','יוד',['M139 114 L127 145']],
  ['kaf','כ','כַּף','כף',['M85 107 C189 80 191 202 79 182']],
  ['lamed','ל','לָמֶד','למד',['M173 62 C137 31 128 116 115 163 C101 206 81 193 91 176']],
  ['mem','מ','מֵם','מם',['M72 188 L105 121 L109 181 L155 97']],
  ['nun','נ','נוּן','נון',['M147 100 C141 162 122 202 77 186']],
  ['samekh','ס','סָמֶךְ','סמך',['M126 104 C72 99 66 196 118 188 C166 184 181 94 126 104']],
  ['ayin','ע','עַיִן','עין',['M105 88 L128 158 C143 210 80 197 96 158 C110 131 142 119 174 119']],
  ['pe','פ','פֵּא','פא',['M84 111 C145 75 188 109 163 156 C140 201 77 203 78 165 C79 133 125 127 128 146 C130 166 105 176 104 158']],
  ['tsadi','צ','צָדִי','צדי',['M84 104 C164 78 184 116 113 141 C198 117 191 190 82 182']],
  ['kof','ק','קוֹף','קוף',['M89 108 C158 81 185 128 143 157','M107 132 L68 223']],
  ['resh','ר','רֵישׁ','ריש',['M84 109 C164 79 177 127 121 189']],
  ['shin','ש','שִׁין','שין',['M82 154 C113 148 177 98 160 96 C128 91 88 163 113 185 C137 207 170 176 173 154']],
  ['tav','ת','תָּו','תו',['M175 161 C174 111 153 88 139 104 C122 124 136 193 71 191']],
  ['kaf-final','ך','כַּף סוֹפִית','כף סופית',['M82 103 C174 78 170 132 119 222']],
  ['mem-final','ם','מֵם סוֹפִית','מם סופית',['M79 188 L117 107 C136 80 184 110 166 138 C147 164 110 131 117 107']],
  ['nun-final','ן','נוּן סוֹפִית','נון סופית',['M145 98 L101 225']],
  ['pe-final','ף','פֵּא סוֹפִית','פא סופית',['M83 143 C116 112 189 115 178 77 C168 44 134 72 133 106 L111 191 C108 204 91 205 88 196']],
  ['tsadi-final','ץ','צָדִי סוֹפִית','צדי סופית',['M81 101 C80 136 101 157 122 144','M86 147 C123 118 190 115 178 77 C168 44 134 72 133 106 L110 215']],
];

export const LETTERS = Object.freeze({
  english: EN.map(([small, ...strokes]) => Object.freeze({ id: `en-${small}`, familiar: small.toUpperCase(), small, name: small.toUpperCase(), spoken: `The letter ${small.toUpperCase()}.`, clip: `letter-en-${small}`, language: 'english', strokes })),
  hebrew: HE.map(([id, familiar, spoken, name, strokes]) => Object.freeze({ id: `he-${id}`, familiar, small: familiar, spoken, name, clip: `letter-he-${id}`, language: 'hebrew', final: id.endsWith('-final'), strokes })),
});

export function letterGroup(language, start = 0) {
  const letters = Object.hasOwn(LETTERS, language) ? LETTERS[language] : LETTERS.hebrew;
  const index = Number.isInteger(start) && start >= 0 && start < letters.length ? start : 0;
  return Array.from({ length: 3 }, (_, offset) => letters[(index + offset) % letters.length]);
}

export function letterShape(letter, { guide = false, pad = false } = {}) {
  return `<svg class="letter-shape ${pad ? 'letter-pad' : ''}" viewBox="0 0 240 240" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${letter.language === 'english' ? `האות ${letter.familiar} הקטנה` : `האות ${letter.name} בכתב יד`}">
    ${guide ? '<g class="writing-lines" aria-hidden="true"><path d="M15 46H225M15 104H225M15 190H225M15 225H225"/></g>' : ''}
    <g class="letter-guide" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round">${letter.strokes.map((d, i) => `<path d="${d}" data-stroke="${i}"/>`).join('')}</g>
    ${pad ? '<g class="letter-ink" fill="none" stroke="currentColor" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"></g><g class="letter-start" aria-hidden="true"><circle r="13"/><text text-anchor="middle" dy="4"></text></g><circle class="writing-pencil" r="8" hidden aria-hidden="true"/>' : ''}
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
