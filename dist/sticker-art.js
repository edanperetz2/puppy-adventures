import { stickerDefinition } from './stickers.js';

const star = (x, y, size, color) => `<path d="M0 -10L3 -3L10 -3L5 2L6 9L0 5L-6 9L-5 2L-10 -3L-3 -3Z" transform="translate(${x} ${y}) scale(${size / 10})" fill="${color}"/>`;
const flower = (x, y, color) => `<g fill="${color}"><circle cx="${x - 5}" cy="${y}" r="5"/><circle cx="${x + 5}" cy="${y}" r="5"/><circle cx="${x}" cy="${y - 5}" r="5"/><circle cx="${x}" cy="${y + 5}" r="5"/></g><circle cx="${x}" cy="${y}" r="3" fill="#f5cf6c"/>`;
const cloud = (x, y) => `<path d="M0 0Q-12 -15 4 -21Q8 -40 26 -26Q44 -29 45 -12Q60 0 45 5H1Z" transform="translate(${x} ${y}) scale(.55)" fill="#fffdf5"/>`;
const heart = (x, y, color) => `<path d="M0 4Q-19 -8 -12 -17Q-6 -24 0 -16Q6 -24 12 -17Q19 -8 0 4Z" transform="translate(${x} ${y}) scale(.6)" fill="${color}"/>`;
const palettes = [
  ['#e6efdc','#a8c69b'], ['#def1f3','#e9d5a8'], ['#e3dcf1','#b0a1cf'], ['#dcebe0','#85ad91'], ['#e3eef7','#b3d5e7'],
  ['#f7e4e6','#e7adc2'], ['#d9eef0','#80bfcc'], ['#f6edd6','#e0bf7e'], ['#eaeedc','#a6bc8b'], ['#e5e8f1','#aab3ca'],
  ['#f5e8df','#d6b3d9'], ['#f6e8cc','#ddb886'], ['#e4edd5','#a3bd7a'], ['#eee0ee','#c5a3cf'], ['#dfe0f0','#969bc2'],
  ['#e4edf1','#9fb8ad'], ['#e0eeec','#91bdbb'], ['#e5eff8','#b3c7e2'], ['#f5e7cf','#dfbb7c'], ['#fae4e9','#e4a4ba'],
];

function scenery(theme, accent) {
  switch (theme) {
    case 0: return `<path d="M16 151Q90 126 184 151V184H16Z" fill="${accent}"/>${flower(33,147,'#dfa0b4')}${flower(169,141,'#b49bce')}`;
    case 1: return `<path d="M10 133Q37 122 63 134T115 134T190 133V184H10Z" fill="#8ecbd6"/><path d="M16 165Q106 146 184 168V189H16Z" fill="${accent}"/><path d="M31 158L40 144L48 158Z" fill="#f4a7a1"/>`;
    case 2: return `${star(32,48,10,'#e3bf72')}${star(166,64,7,'#ffedb3')}<ellipse cx="101" cy="165" rx="77" ry="19" stroke="${accent}" stroke-width="6"/><circle cx="162" cy="155" r="12" fill="#e6b3b3"/>`;
    case 3: return `<path d="M15 149Q100 117 185 150V184H15Z" fill="${accent}"/><g fill="#6d9c7c"><path d="M16 118L34 64L52 118ZM149 121L170 58L191 121Z"/></g><path d="M34 117V153M170 119V153" stroke="#b68c69" stroke-width="6"/>`;
    case 4: return `${cloud(23,49)}${cloud(151,65)}<path d="M13 153Q100 128 188 154V185H13Z" fill="#fffefa"/><g stroke="${accent}" stroke-width="3"><path d="M35 69V91M24 80H46M27 72L43 88M27 88L43 72M163 130V152M152 141H174"/></g>`;
    case 5: return `<path d="M17 47Q100 91 184 47" stroke="#c09bb7" stroke-width="3"/><path d="M25 53L31 75L46 64M154 65L170 76L176 54" fill="${accent}"/><path d="M31 131L25 149M162 119L173 135M57 170L70 177M144 174L153 164" stroke="#ddb768" stroke-width="5"/>`;
    case 6: return `<path d="M14 158Q90 134 187 161V184H14Z" fill="#bddecf"/><g stroke="${accent}" stroke-width="7" stroke-linecap="round"><path d="M30 168Q17 142 31 122M166 170Q182 143 168 123"/></g><g fill="none" stroke="#78b2c3" stroke-width="2"><circle cx="34" cy="57" r="8"/><circle cx="165" cy="75" r="11"/><circle cx="151" cy="43" r="5"/></g>`;
    case 7: return `<path d="M18 174V86H53V174M21 89L35 68L50 89" fill="${accent}"/><path d="M155 169V94H183V169M154 94L169 73L185 94" fill="#b2c8a1"/><path d="M148 135L187 165" stroke="#dca1a0" stroke-width="7"/><path d="M12 177H188" stroke="#b4ca91" stroke-width="9"/>`;
    case 8: return `<path d="M19 145H181L171 183H29Z" fill="#e6b0ad"/><path d="M39 148L48 181M69 148L74 183M101 148V183M133 148L129 183M163 148L154 181M24 160H177M27 174H174" stroke="#fff2d6" stroke-width="5"/>${flower(30,69,'#d9bd69')}`;
    case 9: return `<path d="M19 167V91H45V167M154 167V77H180V167" fill="${accent}"/><g fill="#fdf0bd"><path d="M25 104H32V112H25ZM36 123H42V131H36ZM161 92H168V100H161ZM170 113H177V121H170Z"/></g><path d="M13 175H187" stroke="#a7a4b0" stroke-width="13"/><path d="M33 175H53M147 175H167" stroke="#fff3d7" stroke-width="3"/>`;
    case 10: return `<path d="M25 101A75 75 0 0 1 175 101" stroke="#e4aba9" stroke-width="10"/><path d="M35 101A65 65 0 0 1 165 101" stroke="#e9cb82" stroke-width="9"/><path d="M44 101A56 56 0 0 1 156 101" stroke="#acccae" stroke-width="9"/>${cloud(22,110)}${cloud(154,109)}`;
    case 11: return `<circle cx="151" cy="44" r="17" fill="#edc271"/><path d="M14 151Q70 104 124 155Q153 127 188 145V184H14Z" fill="${accent}"/><path d="M32 143V105M32 123Q19 125 21 111M32 133Q44 136 43 118" stroke="#83a77f" stroke-width="7" stroke-linecap="round"/>`;
    case 12: return `<path d="M18 173Q100 145 183 172" stroke="${accent}" stroke-width="18"/><g fill="#91b47d"><circle cx="30" cy="89" r="22"/><circle cx="169" cy="91" r="23"/></g><path d="M30 105V151M169 108V151" stroke="#b18c67" stroke-width="7"/><g fill="#eaa098"><circle cx="22" cy="81" r="5"/><circle cx="39" cy="95" r="5"/><circle cx="163" cy="87" r="5"/></g>`;
    case 13: return `<path d="M19 171V94H49V171M151 171V94H181V171M23 95L34 73L47 95M152 95L166 73L179 95" fill="${accent}"/><path d="M18 105H50M150 105H182" stroke="#f9e3ba" stroke-width="5"/><path d="M35 74V45L57 54L35 62M166 74V45L145 54L166 62" fill="#e6a7ba"/>`;
    case 14: return `<path d="M47 28A23 23 0 1 0 72 56A24 24 0 0 1 47 28" fill="#f5d997"/>${star(157,50,7,'#f7e5ab')}${star(175,95,5,'#f7e5ab')}${star(30,116,4,'#f7e5ab')}<path d="M13 170Q100 144 188 169" stroke="${accent}" stroke-width="15"/>`;
    case 15: return `<path d="M12 154L45 72L94 151L145 67L190 157V185H12Z" fill="${accent}"/><path d="M33 102L45 72L64 104L48 97ZM128 96L145 67L162 102L147 92Z" fill="#fffaf0"/>${cloud(19,58)}`;
    case 16: return `<path d="M12 146Q100 126 189 147V184H12Z" fill="${accent}"/><path d="M22 159H49M146 164H174M78 178H116" stroke="#d3e7de" stroke-width="4" stroke-linecap="round"/><path d="M30 147V117M167 147V111" stroke="#8aaf86" stroke-width="4"/><ellipse cx="167" cy="114" rx="4" ry="10" fill="#b28c6c"/>`;
    case 17: return `${cloud(14,67)}${cloud(145,51)}${cloud(22,165)}${cloud(145,174)}<path d="M21 89Q18 54 39 49" stroke="${accent}" stroke-width="3"/><path d="M178 101Q188 71 172 61" stroke="${accent}" stroke-width="3"/>${star(44,33,5,'#e8c87b')}`;
    case 18: return `<path d="M14 169H187" stroke="${accent}" stroke-width="16"/><path d="M28 148V58H167M28 60L64 34L101 60M147 59V98" stroke="#d4a25a" stroke-width="6"/><path d="M142 97V112Q147 121 154 112" stroke="#9f9588" stroke-width="4"/><path d="M19 166L32 143L45 166M156 166L168 143L182 166" fill="#e4a076"/>`;
    case 19: return `${heart(32,58,accent)}${heart(167,79,'#c4a7d7')}${heart(39,157,'#e7b8c8')}${heart(156,167,accent)}<path d="M18 181Q100 153 183 181" stroke="#f3c7d4" stroke-width="8"/>`;
  }
}

export function stickerScene(id, baseArt) {
  const spec = stickerDefinition(id);
  if (!spec || spec.original) return null;
  const [background, accent] = palettes[spec.theme];
  const picture = baseArt(spec.motif).replace(/^<svg\b[^>]*>/u, '').replace(/<\/svg>$/u, '');
  const clip = `sticker-clip-${spec.index}`;
  return `<defs><clipPath id="${clip}"><circle cx="100" cy="97" r="88"/></clipPath></defs><circle cx="100" cy="101" r="94" fill="#e1d9cb"/><circle cx="100" cy="97" r="92" fill="${background}" stroke="#fffdf6" stroke-width="7"/><g clip-path="url(#${clip})">${scenery(spec.theme, accent)}<ellipse cx="100" cy="160" rx="57" ry="8" fill="${accent}" opacity=".32"/><g transform="translate(35 30) scale(.65)">${picture}</g>${star(165,34,5,'#fffdf6')}</g>`;
}
