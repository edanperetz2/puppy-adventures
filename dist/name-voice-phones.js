const spelling = {
  sh: 'ʃ', zh: 'ʒ', kh: 'χ', ch: 'tʃ', ts: 'ts', dj: 'dʒ',
  ee: 'i', oo: 'u', ai: 'aj', ay: 'aj', ey: 'ej',
  g: 'ɡ', r: 'ʁ', y: 'j', j: 'dʒ', w: 'w', c: 'k', q: 'k', x: 'ks', "'": 'ʔ',
};

export function namePhonemes(value) {
  const words = value?.trim().replace(/[’׳]/gu, "'");
  if (!words || words.length > 56 || !/^[a-z '–-]+$/iu.test(words)) return null;
  const pronunciation = words.replace(/[–-]/gu, '').replace(/sh|zh|kh|ch|ts|dj|ee|oo|ai|ay|ey|[a-z']/giu, token => {
    const lower = token.toLowerCase();
    const sound = spelling[lower] || lower;
    return /[AEIOU]/u.test(token) ? sound.replace(/[aeiou]/u, vowel => `ˈ${vowel}`) : sound;
  });
  return /[aeiou]/u.test(pronunciation) ? pronunciation : null;
}

const phonesToSpelling = {
  a: 'a', 'æ': 'a', 'ɑ': 'a', 'ɐ': 'a', 'ʌ': 'a', e: 'e', 'ɛ': 'e', 'ə': 'e', 'ɜ': 'e', 'ɘ': 'e',
  i: 'i', 'ɪ': 'i', 'ɨ': 'i', o: 'o', 'ɔ': 'o', 'ɒ': 'o', 'ɵ': 'o', u: 'u', 'ʊ': 'u', 'ɯ': 'u',
  b: 'b', p: 'p', 'ɓ': 'b', d: 'd', t: 't', 'ɗ': 'd', k: 'k', q: 'k', 'ɡ': 'g', g: 'g',
  f: 'f', v: 'v', 'ɸ': 'f', 'β': 'v', 'ʋ': 'v', m: 'm', n: 'n', 'ŋ': 'n', 'ɲ': 'ny', l: 'l', 'ɫ': 'l',
  s: 's', z: 'z', 'ʃ': 'sh', 'ʂ': 'sh', 'ɕ': 'sh', 'ʒ': 'zh', 'ʐ': 'zh', 'ʑ': 'zh',
  h: 'h', 'ɦ': 'h', 'ʕ': "'", 'ʔ': "'", x: 'kh', 'χ': 'kh', 'ħ': 'kh', 'ɣ': 'kh',
  'ʁ': 'r', r: 'r', 'ɹ': 'r', 'ɾ': 'r', 'ʀ': 'r', 'ɻ': 'r', j: 'y', w: 'w',
  ts: 'ts', tʃ: 'ch', tʂ: 'ch', tɕ: 'ch', dʒ: 'dj', dʑ: 'dj', dz: 'dz', ij: 'iy', uə: 'u',
};

function spellingForPhone(phone) {
  const base = phone.replace(/[\p{M}ːʰʲʷʼ]/gu, '');
  return phonesToSpelling[base];
}

// The written name constrains the consonants. The recording supplies vowels
// and distinguishes letters with more than one pronunciation.
const hebrewConsonants = {
  א: ["'", ''], ב: ['b', 'v'], ג: ['g', 'dj'], ד: ['d'], ה: ['h', ''], ו: ['v', 'w', ''], ז: ['z', 'zh'],
  ח: ['kh'], ט: ['t'], י: ['y', ''], כ: ['k', 'kh'], ך: ['k', 'kh'], ל: ['l'], מ: ['m'], ם: ['m'],
  נ: ['n'], ן: ['n'], ס: ['s'], ע: ["'", ''], פ: ['p', 'f'], ף: ['p', 'f'], צ: ['ts', 'ch'], ץ: ['ts'],
  ק: ['k'], ר: ['r'], ש: ['sh', 's'], ת: ['t'],
};
const vowels = ['a', 'e', 'i', 'o', 'u'];

function frameScores(logits, vocabulary) {
  const sounds = Object.entries(vocabulary).map(([phone, id]) => [id, spellingForPhone(phone)]).filter(([, symbol]) => symbol);
  const width = Object.keys(vocabulary).length;
  const frames = [];
  for (let offset = 0; offset < logits.length; offset += width) {
    const scores = new Map([['', logits[offset]]]);
    for (const [id, sound] of sounds) scores.set(sound, Math.max(scores.get(sound) ?? -Infinity, logits[offset + id]));
    frames.push(scores);
  }
  return frames;
}

function fromWrittenName(frames, name) {
  const letters = [...name].map(letter => hebrewConsonants[letter]).filter(Boolean);
  if (!letters.some(options => !options.includes('')) || letters.length > 14) return '';
  const nextLetters = Array.from({ length: letters.length + 1 }, (_, start) => {
    const allowed = [];
    for (let i = start; i < letters.length; i++) {
      for (const sound of letters[i]) if (sound) allowed.push([sound, i + 1]);
      if (!letters[i].includes('')) break;
    }
    return allowed;
  });

  let paths = [{ next: 0, last: '', text: '', score: 0, vowel: false }];
  for (const frame of frames) {
    const best = new Map();
    for (const path of paths) {
      const offer = (sound, next, append, cost = 0) => {
        const score = path.score + (frame.get(sound) ?? -Infinity) - cost;
        const vowel = path.vowel || vowels.includes(sound);
        const key = `${next}:${sound}:${vowel}`;
        if (score <= (best.get(key)?.score ?? -Infinity)) return;
        best.set(key, { next, last: sound, text: append ? path.text + sound : path.text, score, vowel });
      };
      offer('', path.next, false);
      if (path.last) offer(path.last, path.next, false);
      for (const vowel of vowels) if (vowel !== path.last) offer(vowel, path.next, true, 1.6);
      for (const [sound, next] of nextLetters[path.next]) if (sound !== path.last) offer(sound, next, true, 1);
    }
    paths = [...best.values()].sort((a, b) => b.score - a.score).slice(0, 72);
  }
  return paths.find(path => path.vowel && letters.slice(path.next).every(options => options.includes('')))?.text || '';
}

export function readNamePhones(logits, vocabulary, writtenName = '') {
  const frames = frameScores(logits, vocabulary);
  let result = fromWrittenName(frames, writtenName);
  if (!result) {
    let previous = '';
    for (const frame of frames) {
      let best = '', score = frame.get('');
      for (const [sound, value] of frame) if (value > score) { score = value; best = sound; }
      if (best !== previous) result += best;
      previous = best;
    }
  }
  result = result.replace(/^'+|'+$/gu, '');
  if (!namePhonemes(result)) throw new Error('name_not_recognized');
  return result;
}
