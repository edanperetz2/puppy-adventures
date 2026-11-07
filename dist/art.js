import { READING_ART } from './reading-art.js';
import { MORE_READING_ART } from './reading-more-art.js';
import { VOCABULARY_ART } from './vocabulary-art.js';
import { EXPANDED_ART } from './expanded-art.js';
import { PRACTICE_EXTRA_ART } from './practice-extra-art.js';
import { readingScene, hasReadingScene } from './reading-scenes.js';
import { stickerScene } from './sticker-art.js';
import { stickerDefinition } from './stickers.js';

const svg = (body, cls = '', viewBox = '0 0 200 200') => `<svg class="${cls}" viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${body}</svg>`;
const eye = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="7" fill="#343247"/><circle cx="${x + 1.5}" cy="${y - 2}" r="1.8" fill="white"/>`;

export function pup(name = 'luli', cls = '') {
  const p = { luli: ['#d89561', '#ae6c47', '#f9d9ad', '#9e84c5'], bobi: ['#899ab2', '#647891', '#e0e6e9', '#64b6bf'], tofi: ['#dbaf67', '#b28648', '#f9dfaa', '#efae47'] }[name] || ['#d89561', '#ae6c47', '#f9d9ad', '#9e84c5'];
  return svg(`<ellipse cx="101" cy="187" rx="63" ry="8" fill="#383a4f" opacity=".1"/>
    <path class="pup-tail" d="M144 144Q184 154 175 117Q168 132 150 126" fill="${p[1]}"/>
    <path d="M59 149Q44 154 40 140Q43 126 64 126M139 149Q158 156 161 138Q157 125 137 126" fill="${p[0]}"/>
    <path d="M64 127Q100 107 137 127L145 170Q125 181 101 179Q77 181 56 170Z" fill="${p[3]}"/>
    <path d="M79 123L100 148L122 123" fill="#fff3dc"/><path d="M85 174L84 184Q74 193 60 185L63 172M116 174L117 185Q132 193 142 184L137 171" fill="${p[0]}"/>
    <path d="M56 53Q17 23 22 81Q20 110 51 115L70 67" fill="${p[1]}"/><path d="M143 52Q185 26 179 81Q180 111 149 115L133 68" fill="${p[1]}"/>
    <path d="M47 73Q45 31 99 29Q156 28 154 78L151 102Q143 135 100 139Q56 134 48 106Z" fill="${p[0]}"/>
    <path d="M87 34Q89 62 104 69Q116 52 113 31" fill="${p[2]}"/>
    <ellipse cx="100" cy="107" rx="40" ry="26" fill="${p[2]}"/>
    ${eye(76, 82)}${eye(126, 82)}<ellipse cx="63" cy="103" rx="8" ry="4" fill="#e89591" opacity=".7"/><ellipse cx="139" cy="103" rx="8" ry="4" fill="#e89591" opacity=".7"/>
    <path d="M89 99Q100 93 111 99Q111 110 100 113Q89 110 89 99" fill="#343247"/><path d="M100 112V119Q88 128 81 116M100 119Q113 127 120 116" stroke="#343247" stroke-width="3" stroke-linecap="round"/>
    ${name === 'luli' ? '<path d="M137 44Q130 20 148 27L151 36Q170 20 172 41L156 48Z" fill="#9e84c5"/><circle cx="150" cy="42" r="6" fill="#d8c9ee"/>' : name === 'tofi' ? '<path d="M49 57Q52 12 101 15Q148 13 153 57Z" fill="#f5bd52"/><path d="M100 15V49M64 54H144" stroke="#d59630" stroke-width="7" stroke-linecap="round"/><rect x="37" y="53" width="128" height="11" rx="5" fill="#ffce70"/>' : '<path d="M58 52Q73 20 101 21Q134 20 148 51Z" fill="#64b6bf"/><path d="M140 48Q162 39 171 53L141 61" fill="#398f9e"/><path d="M82 31L78 47" stroke="#caeef0" stroke-width="7" stroke-linecap="round"/>'}
    <circle cx="101" cy="157" r="11" fill="#fff4d9"/><path d="M101 149L103 154L109 155L105 159L106 165L101 162L96 165L97 159L93 155L99 154Z" fill="${p[3]}"/>`, `pup ${cls}`);
}

const drawings = {
  ...READING_ART,
  ...MORE_READING_ART,
  ...VOCABULARY_ART,
  ...EXPANDED_ART,
  ...PRACTICE_EXTRA_ART,
  clock: '<circle cx="100" cy="105" r="81" fill="#e4d8e9"/><circle cx="100" cy="100" r="80" fill="#bda3d0"/><circle cx="100" cy="100" r="70" fill="#fffcf4"/><g fill="#8e7898"><circle cx="100" cy="43" r="4"/><circle cx="157" cy="100" r="4"/><circle cx="100" cy="157" r="4"/><circle cx="43" cy="100" r="4"/></g><path d="M100 109V57" stroke="#368b7d" stroke-width="7" stroke-linecap="round"/><path d="M94 100H131" stroke="#9066b1" stroke-width="10" stroke-linecap="round"/><circle cx="100" cy="100" r="7" fill="#d0badc"/>',
  star: '<path d="M100 20L122 69L177 75L136 113L147 169L100 141L52 169L63 113L22 75L77 69Z" fill="#f3c65c" stroke="#e5aa3b" stroke-width="5" stroke-linejoin="round"/><path d="M73 73L89 46" stroke="#ffedaa" stroke-width="8" stroke-linecap="round"/>',
  heart: '<path d="M100 166Q7 107 28 57Q51 15 100 57Q149 14 174 57Q196 107 100 166" fill="#ec859c"/><path d="M51 64Q62 44 78 62" stroke="#ffc0ce" stroke-width="9" stroke-linecap="round"/>',
  fish: '<path d="M54 99L17 57V142Z" fill="#70bdd0"/><ellipse cx="111" cy="99" rx="65" ry="47" fill="#f2ae67"/><path d="M98 56L120 29L141 63M103 141L129 166L144 134" fill="#df8c4a"/><circle cx="148" cy="86" r="7" fill="#38374a"/><circle cx="150" cy="84" r="2" fill="white"/><path d="M151 112Q159 119 168 110" stroke="#a5673c" stroke-width="4" stroke-linecap="round"/><path d="M96 79Q74 99 96 121" stroke="#ffd59b" stroke-width="6" stroke-linecap="round"/><circle cx="29" cy="28" r="9" stroke="#a5dce4" stroke-width="4"/>',
  sea: '<circle cx="143" cy="50" r="27" fill="#f7c95b"/><path d="M15 109Q37 79 61 107T107 107T153 107T195 105V166H15Z" fill="#66b4cf"/><path d="M8 141Q32 112 57 139T104 139T151 139T198 137V181H8Z" fill="#4399bd"/><path d="M28 123Q39 116 48 124M115 154Q125 146 137 154" stroke="#b4e5ed" stroke-width="5" stroke-linecap="round"/>',
  tree: '<path d="M88 98H113L122 177H80Z" fill="#b47f59"/><path d="M98 132L70 112M107 118L130 95" stroke="#986445" stroke-width="7" stroke-linecap="round"/><path d="M43 110Q10 88 40 61Q32 27 75 30Q101 -1 124 29Q167 21 163 58Q198 91 165 112Z" fill="#67ad83"/><circle cx="67" cy="68" r="28" fill="#84c398"/><circle cx="133" cy="78" r="31" fill="#78bb8c"/>',
  bear: '<circle cx="47" cy="49" r="29" fill="#b68760"/><circle cx="151" cy="49" r="29" fill="#b68760"/><circle cx="47" cy="49" r="17" fill="#e8bd93"/><circle cx="151" cy="49" r="17" fill="#e8bd93"/><ellipse cx="100" cy="105" rx="75" ry="69" fill="#c99970"/><ellipse cx="100" cy="127" rx="38" ry="28" fill="#f2d6ad"/>'+eye(70,98)+eye(130,98)+'<ellipse cx="100" cy="118" rx="13" ry="9" fill="#413a37"/><path d="M100 126V138M100 138Q91 146 83 137M100 138Q110 146 117 137" stroke="#413a37" stroke-width="4" stroke-linecap="round"/>',
  horse: '<path d="M64 149L49 187H71L90 150M124 149L126 188H148L145 137" fill="#ad7553"/><ellipse cx="104" cy="131" rx="57" ry="31" fill="#cc986d"/><path d="M126 123L120 52L147 36L169 85L153 118" fill="#cc986d"/><path d="M123 78L99 87L112 34L142 22L144 43" fill="#81573f"/><path d="M146 39L143 13L160 31M122 43L116 18L135 31" fill="#cc986d"/><ellipse cx="157" cy="83" rx="24" ry="18" fill="#edd1aa"/><circle cx="144" cy="58" r="5" fill="#393645"/><path d="M52 119Q13 93 22 154" stroke="#81573f" stroke-width="14" stroke-linecap="round"/>',
  ball: '<circle cx="100" cy="100" r="74" fill="#f0b15f"/><path d="M44 50Q110 108 153 47M27 111Q97 99 109 174M163 143Q123 94 170 76" stroke="#fbf2d9" stroke-width="18"/><path d="M44 50Q110 108 153 47M27 111Q97 99 109 174M163 143Q123 94 170 76" stroke="#6aafa9" stroke-width="10"/><path d="M48 72Q52 52 73 43" stroke="white" stroke-opacity=".5" stroke-width="9" stroke-linecap="round"/>',
  house: '<path d="M41 87H159V177H41Z" fill="#f6d09a"/><path d="M20 90L100 22L181 90Z" fill="#d97c75" stroke="#c56b66" stroke-width="5" stroke-linejoin="round"/><rect x="85" y="119" width="36" height="58" rx="17" fill="#73a9a9"/><rect x="52" y="108" width="26" height="27" rx="5" fill="#fff8e9"/><path d="M65 109V134M53 122H77" stroke="#d9ac78" stroke-width="3"/><circle cx="112" cy="151" r="3" fill="#f3d799"/><path d="M141 56V24H157V69" fill="#b87360"/>',
  sun: '<g stroke="#f5c55c" stroke-width="10" stroke-linecap="round"><path d="M100 12V26M100 174V188M12 100H26M174 100H188M38 38L48 48M152 152L162 162M38 162L48 152M152 48L162 38"/></g><circle cx="100" cy="100" r="55" fill="#f8d477"/>'+eye(83,96)+eye(119,96)+'<path d="M85 117Q101 135 119 116" stroke="#a47b42" stroke-width="4" stroke-linecap="round"/>',
  flower: '<path d="M102 109V184" stroke="#74a77b" stroke-width="10" stroke-linecap="round"/><path d="M101 165Q48 173 53 137Q84 127 101 165M104 147Q151 150 154 116Q124 111 104 147" fill="#91bf8b"/><g fill="#e7a4ac"><ellipse cx="100" cy="48" rx="25" ry="33"/><ellipse cx="65" cy="78" rx="32" ry="26"/><ellipse cx="137" cy="78" rx="32" ry="26"/><ellipse cx="78" cy="115" rx="27" ry="30"/><ellipse cx="122" cy="115" rx="27" ry="30"/></g><circle cx="101" cy="84" r="25" fill="#f8d47e"/><circle cx="94" cy="82" r="3" fill="#756046"/><circle cx="109" cy="82" r="3" fill="#756046"/><path d="M94 94Q102 101 110 94" stroke="#756046" stroke-width="3" stroke-linecap="round"/>',
  butterfly: '<path d="M91 91Q48 4 20 48Q1 84 72 110Q5 112 32 158Q67 187 94 124M109 91Q152 4 180 48Q199 84 128 110Q195 112 168 158Q133 187 106 124" fill="#b49ace"/><path d="M89 90Q55 34 38 58Q28 76 79 99M111 90Q145 34 162 58Q172 76 121 99" fill="#edb4c1"/><path d="M86 132Q53 122 49 145M114 132Q147 122 151 145" stroke="#f2c976" stroke-width="12" stroke-linecap="round"/><path d="M100 83V139" stroke="#665775" stroke-width="12" stroke-linecap="round"/><path d="M100 84L87 61M100 84L114 61" stroke="#665775" stroke-width="4" stroke-linecap="round"/>',
  cat: '<path d="M40 83L37 21L84 52M116 52L163 21L161 86" fill="#dda875"/><path d="M49 58L48 37L69 54M131 54L153 37L151 63" fill="#eabbab"/><ellipse cx="100" cy="110" rx="73" ry="64" fill="#e9bb85"/><path d="M92 49L92 72M110 49L110 72" stroke="#c99160" stroke-width="8" stroke-linecap="round"/>'+eye(72,103)+eye(130,103)+'<path d="M91 123L109 123L100 134Z" fill="#c88083"/><path d="M100 134Q89 146 80 136M100 134Q113 146 122 136M48 119L15 111M48 132L12 136M151 119L184 111M151 132L188 136" stroke="#9d775b" stroke-width="3" stroke-linecap="round"/>',
  bird: '<path d="M60 132L31 140L51 112" fill="#6ca7c2"/><ellipse cx="104" cy="104" rx="60" ry="52" fill="#85b8cd"/><circle cx="139" cy="68" r="37" fill="#85b8cd"/><path d="M173 69L194 81L169 88" fill="#efb95f"/><circle cx="151" cy="64" r="5" fill="#38374a"/><path d="M83 94Q139 94 105 136Q75 138 73 110" fill="#c0dce5"/><path d="M98 151L95 176M122 149L127 173M85 176H104M118 175H138" stroke="#c18e55" stroke-width="5" stroke-linecap="round"/>',
  rabbit: '<ellipse cx="69" cy="51" rx="22" ry="48" transform="rotate(-12 69 51)" fill="#e5d9d1"/><ellipse cx="130" cy="51" rx="22" ry="48" transform="rotate(12 130 51)" fill="#e5d9d1"/><ellipse cx="69" cy="49" rx="10" ry="31" transform="rotate(-12 69 49)" fill="#ecc1c4"/><ellipse cx="130" cy="49" rx="10" ry="31" transform="rotate(12 130 49)" fill="#ecc1c4"/><ellipse cx="100" cy="123" rx="65" ry="58" fill="#e5d9d1"/>'+eye(74,116)+eye(126,116)+'<path d="M91 136Q100 130 109 136L100 145Z" fill="#d49b9f"/><path d="M100 145Q91 155 83 146M100 145Q111 155 118 146" stroke="#8f8080" stroke-width="3" stroke-linecap="round"/>',
  duck: '<path d="M47 99Q21 115 44 151Q68 180 126 161Q173 142 159 109L140 94" fill="#f1cd74"/><circle cx="134" cy="69" r="39" fill="#f4d782"/><path d="M165 68L195 77L163 88" fill="#e9a05e"/><circle cx="145" cy="62" r="5" fill="#423a37"/><path d="M59 113Q121 91 110 143Q84 155 61 135" fill="#e4b858"/><path d="M44 104L14 82L23 122" fill="#f1cd74"/>',
  apple: '<path d="M103 54Q132 19 159 33Q144 66 110 63" fill="#80b48b"/><path d="M102 65Q99 39 90 26" stroke="#94724e" stroke-width="9" stroke-linecap="round"/><path d="M100 67Q44 37 26 90Q15 138 61 175Q79 186 101 173Q125 187 145 173Q190 130 174 87Q156 40 100 67" fill="#e9817c"/><path d="M49 92Q54 78 69 78" stroke="#ffc5b2" stroke-width="9" stroke-linecap="round"/>',
  berry: '<path d="M44 65Q37 120 100 183Q163 120 156 65Z" fill="#db7b8d"/><path d="M42 68L70 49L73 25L103 47L133 29L134 52L160 67L124 77L104 65L79 79Z" fill="#80ae82"/><g fill="#f8d28a"><ellipse cx="70" cy="100" rx="3" ry="5"/><ellipse cx="103" cy="100" rx="3" ry="5"/><ellipse cx="132" cy="100" rx="3" ry="5"/><ellipse cx="87" cy="128" rx="3" ry="5"/><ellipse cx="116" cy="128" rx="3" ry="5"/><ellipse cx="101" cy="151" rx="3" ry="5"/></g>',
  boat: '<path d="M28 133H177L153 171H54Z" fill="#e6a267"/><path d="M97 31V134" stroke="#a17954" stroke-width="7" stroke-linecap="round"/><path d="M88 36L36 120H88Z" fill="#c7b5dd"/><path d="M108 45L158 119H108Z" fill="#fff2d8"/><path d="M14 176Q32 158 51 176T91 176T131 176T171 176T204 176" stroke="#78bacd" stroke-width="8"/>',
  rocket: '<path d="M67 124L37 159L69 155M132 124L162 159L131 155" fill="#aa8ec7"/><path d="M74 150Q66 75 100 18Q135 77 126 150Z" fill="#e5dfe9"/><path d="M82 47Q100 9 118 47" fill="#e99594"/><circle cx="100" cy="91" r="21" fill="#81bac7" stroke="#fbf0dc" stroke-width="7"/><path d="M84 159L100 195L116 159" fill="#f4ca6b"/>',
  rainbow: '<path d="M24 165V114A76 76 0 0 1 176 114V165" stroke="#e5a1a5" stroke-width="18"/><path d="M43 165V114A57 57 0 0 1 157 114V165" stroke="#f2cd7e" stroke-width="18"/><path d="M62 165V114A38 38 0 0 1 138 114V165" stroke="#8fbdad" stroke-width="18"/><path d="M81 165V114A19 19 0 0 1 119 114V165" stroke="#b7a5d0" stroke-width="18"/>',
  letters: '<rect x="27" y="42" width="138" height="126" rx="22" fill="#e8dcef" transform="rotate(-8 96 105)"/><path d="M50 129L73 71L97 129M59 110H88" stroke="#a18abb" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M143 110C119 93 104 112 110 131C118 152 143 141 143 119M143 104V142" stroke="#7ba99a" stroke-width="8" stroke-linecap="round"/><path d="M148 165L172 80L186 85L163 170L151 181Z" fill="#e6b86d"/><path d="M151 181L163 170L150 166Z" fill="#a7896c"/>',
  paw: '<g fill="currentColor"><ellipse cx="101" cy="134" rx="48" ry="36"/><ellipse cx="39" cy="91" rx="19" ry="27" transform="rotate(-30 39 91)"/><ellipse cx="80" cy="57" rx="18" ry="26" transform="rotate(-10 80 57)"/><ellipse cx="124" cy="57" rx="18" ry="26" transform="rotate(10 124 57)"/><ellipse cx="163" cy="91" rx="19" ry="27" transform="rotate(30 163 91)"/></g>',
};

export function art(name, cls = '') {
  const sticker = stickerScene(name, object => art(object));
  if (sticker !== null) return svg(sticker, `art sticker-scene ${cls}`);
  const scene = readingScene(name, object => art(object));
  if (scene !== null) return svg(scene, `art reading-scene ${cls}`);
  if (name === 'dog') return pup('luli', cls);
  return svg(drawings[name] || drawings.star, `art ${cls}`);
}

export function hasArt(name) { return name === 'dog' || Object.hasOwn(drawings, name) || hasReadingScene(name) || stickerDefinition(name) !== null; }

export function uiIcon(name) {
  const paths = {
    pencil: '<path d="M4 16L16 4L20 8L8 20L3 21ZM13 7L17 11"/>',
    again: '<path d="M20 8A8 8 0 1 0 20 16M20 3V9H14"/>',
    sound: '<path d="M11 5L6 9H3V15H6L11 19Z"/><path d="M15 8Q19 12 15 16M18 5Q25 12 18 19"/>',
    muted: '<path d="M11 5L6 9H3V15H6L11 19Z"/><path d="M16 9L22 15M22 9L16 15"/>',
    arrow: '<path d="M18 12H5M10 6L4 12L10 18"/>',
    home: '<path d="M3 11L12 3L21 11M5 10V21H10V15H14V21H19V10"/>',
    hint: '<path d="M9 18H15M10 21H14M8 15Q1 7 8 4Q12 1 17 5Q22 10 16 15V17H8Z"/>',
    check: '<path d="M5 12L10 17L20 6"/>',
    plus: '<path d="M12 5V19M5 12H19"/>',
    close: '<path d="M6 6L18 18M18 6L6 18"/>',
    settings: '<circle cx="12" cy="8" r="4"/><path d="M4 22V20Q4 14 12 14Q20 14 20 20V22"/>',
    album: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 3V21M12 9L14 7L16 9L18 7V14L14 17L11 14"/>',
  };
  return svg(`<g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${paths[name] || paths.check}</g>`, 'ui-icon', '0 0 24 24');
}

export function scene() {
  return `<div class="world-scene" aria-label="לולי, בובי וטופי ליד בית החברים בגבעות ירוקות" role="img">
    ${svg(`<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#e9f2eb"/><stop offset="1" stop-color="#f7edd9"/></linearGradient></defs>
      <rect x="0" y="0" width="680" height="420" rx="60" fill="url(#sky)"/>
      <g fill="#fffdf3" opacity=".9"><path d="M45 83Q29 56 63 52Q67 16 103 39Q133 23 142 54Q169 58 158 82Z"/><path d="M467 89Q452 67 480 59Q482 29 514 44Q537 34 546 58Q577 67 563 89Z"/></g>
      <circle cx="559" cy="133" r="40" fill="#f7d58a"/><path d="M0 263Q145 122 338 258Q510 118 680 228V420H0Z" fill="#c3d6ab"/>
      <path d="M0 323Q151 209 340 306Q512 217 680 301V420H0Z" fill="#9cbd96"/>
      <path d="M305 420Q243 365 333 291L375 284Q308 356 421 420" fill="#f6dfb7"/>
      <path d="M205 153H391V289H205Z" fill="#f4d9af"/><path d="M183 159L296 64L413 159Z" fill="#cf8880"/><path d="M188 159L296 72L407 159" stroke="#b96f6b" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="273" y="205" width="48" height="84" rx="24" fill="#6b9f98"/><circle cx="308" cy="250" r="4" fill="#f3d48a"/>
      <rect x="221" y="185" width="34" height="38" rx="8" fill="#fff7e4"/><rect x="340" y="185" width="34" height="38" rx="8" fill="#fff7e4"/>
      <path d="M238 185V223M221 204H255M357 185V223M340 204H374" stroke="#c49b73" stroke-width="3"/>
      <circle cx="296" cy="145" r="27" fill="#fff3d9"/><path d="M296 127L301 139L314 140L304 149L307 163L296 156L284 163L287 149L277 140L291 139Z" fill="#d3a457"/>
      <path d="M57 257V185M592 274V193" stroke="#a58c61" stroke-width="14" stroke-linecap="round"/><g fill="#80a98a"><circle cx="54" cy="174" r="46"/><circle cx="35" cy="199" r="34"/><circle cx="85" cy="198" r="37"/><circle cx="590" cy="183" r="45"/><circle cx="560" cy="208" r="33"/><circle cx="620" cy="212" r="31"/></g>
      <g fill="#f5e8c9"><path d="M458 300V249H502V305M462 250L480 228L499 250"/><path d="M509 303V256H549V308M512 256L529 233L546 256"/></g>
      <g fill="#f4d787"><circle cx="48" cy="349" r="5"/><circle cx="60" cy="337" r="5"/><circle cx="549" cy="342" r="5"/><circle cx="563" cy="354" r="5"/><circle cx="614" cy="375" r="6"/></g>
      <g fill="#d5a3b3"><circle cx="133" cy="302" r="5"/><circle cx="146" cy="308" r="5"/><circle cx="524" cy="387" r="5"/></g>`, 'landscape', '0 0 680 420')}
    <div class="scene-pup scene-luli">${pup('luli')}</div><div class="scene-pup scene-bobi">${pup('bobi')}</div><div class="scene-pup scene-tofi">${pup('tofi')}</div>
    <span class="scene-butterfly">${art('butterfly')}</span><span class="scene-sparkle sparkle-one">✦</span><span class="scene-sparkle sparkle-two">✧</span>
  </div>`;
}
