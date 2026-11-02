// Name clips are deliberately prepared sounds, never guesses from Hebrew text.
export const VOICE_NAMES = Object.freeze([
  ['ariel', 'אריאל', 'ʔaʁiʔˈel', 'Ariel'],
  ['yuli', 'יולי', 'jˈuli', 'Yuli', 'Juli', 'Julie'],
  ['dvir', 'דביר', 'dvˈiʁ', 'Dvir'],
  ['noa', 'נועה', 'nˈoʔa', 'Noa', 'נעה'],
  ['maya', 'מאיה', 'mˈaja', 'Maya', 'Maia', 'מיה'],
  ['tamar', 'תמר', 'tamˈaʁ', 'Tamar'],
  ['yael', 'יעל', 'jaʔˈel', 'Yael'],
  ['ella', 'אלה', 'ʔˈela', 'Ella', 'Ela'],
  ['libi', 'ליבי', 'lˈibi', 'Libi', 'Libby'],
  ['noya', 'נויה', 'nˈoja', 'Noya'],
  ['shira', 'שירה', 'ʃˈiʁa', 'Shira'],
  ['ori', 'אורי', 'ʔˈoʁi', 'Ori'],
  ['itay', 'איתי', 'ʔitˈaj', 'Itay', 'Itai'],
  ['noam', 'נועם', 'nˈoʔam', 'Noam', 'נעם'],
  ['eitan', 'איתן', 'ʔejtˈan', 'Eitan', 'Eytan'],
  ['daniel', 'דניאל', 'danijˈel', 'Daniel'],
  ['adam', 'אדם', 'ʔadˈam', 'Adam'],
  ['alon', 'אלון', 'ʔalˈon', 'Alon'],
  ['omer', 'עומר', 'ʔˈomeʁ', 'Omer'],
  ['yonatan', 'יונתן', 'jonatˈan', 'Yonatan', 'Jonathan', 'יהונתן'],
  ['ofir', 'אופיר', 'ʔofˈiʁ', 'Ofir', 'Ophir'],
  ['romi', 'רומי', 'ʁˈomi', 'Romi'],
  ['eden', 'עדן', 'ʔˈeden', 'Eden'],
  ['yuval', 'יובל', 'juvˈal', 'Yuval'],
  ['amit', 'עמית', 'ʔamˈit', 'Amit'],
  ['tal', 'טל', 'tˈal', 'Tal'],
  ['liam', 'ליאם', 'liʔˈam', 'Liam'],
  ['hila', 'הילה', 'hilˈa', 'Hila'],
  ['avigayil', 'אביגיל', 'ʔaviɡˈajil', 'Avigayil', 'Abigail'],
  ['lian', 'ליאן', 'liʔˈan', 'Lian'],
  ['mika', 'מיקה', 'mˈika', 'Mika'],
  ['ron', 'רון', 'ʁˈon', 'Ron'],
].map(([id, name, speech, ...aliases]) => Object.freeze({ id, name, speech, aliases: Object.freeze([name, ...aliases]) })));

const nameKey = value => String(value || '').normalize('NFD').replace(/[\u0591-\u05c7]/gu, '').trim().toLowerCase();
export const findVoiceName = name => VOICE_NAMES.find(item => item.aliases.some(alias => nameKey(alias) === nameKey(name))) || null;

// Only direct address changes. Nouns, reading targets, number agreement and
// descriptions of characters retain their original gender.
const WORDS = Object.freeze({
  בואי: 'בוא', ובואי: 'ובוא', בחרי: 'בחר', ובחרי: 'ובחר', מצאי: 'מצא', קראי: 'קרא',
  לחצי: 'לחץ', ולחצי: 'ולחץ', ראי: 'ראה', וראי: 'וראה', הקשיבי: 'הקשב',
  הסתכלי: 'הסתכל', ספרי: 'ספור', התחילי: 'התחל', והמשיכי: 'והמשך',
  עברי: 'עבור', נסי: 'נסה', ונסי: 'ונסה', תרצי: 'תרצה', מוכנה: 'מוכן',
  תגלי: 'תגלה', גררי: 'גרור', הזיזי: 'הזז', וכווני: 'וכוון', וחזרי: 'וחזור',
  שימי: 'שים', תנסי: 'תנסה', בעצמך: 'בעצמך', מכירה: 'מכיר', קחי: 'קח',
  געי: 'גע', ושמעי: 'ושמע', בדקי: 'בדוק', התקדמי: 'התקדם',
  מגלות: 'מגלים', מזהות: 'מזהים', כותבות: 'כותבים',
  יוצאות: 'יוצאים', מתחילות: 'מתחילים', מתקדמות: 'מתקדמים', ממשיכות: 'ממשיכים',
  מתחממות: 'מתחממים', מערבבות: 'מערבבים', בוחרות: 'בוחרים', חוזרות: 'חוזרים',
  נזכרות: 'נזכרים', גוררות: 'גוררים', מקשיבות: 'מקשיבים', מזיזות: 'מזיזים',
  קוראות: 'קוראים', מחברות: 'מחברים', סופרות: 'סופרים', משחקות: 'משחקים', מתאימות: 'מתאימים',
  עוזרות: 'עוזרים', פוגשות: 'פוגשים', מכירות: 'מכירים', לומדות: 'לומדים', חוקרות: 'חוקרים',
});

export function addressText(text, address = 'female') {
  if (address !== 'male') return text;
  return text.replace(/ברוכה הבאה/gu, 'ברוך הבא').replace(/את כבר מכירה/gu, 'אתה כבר מכיר')
    .replace(/[\u0590-\u05ff]+/gu, word => {
      if (word === 'אַתְּ') return 'אַתָּה';
      const plain = word.normalize('NFD').replace(/[\u0591-\u05c7]/gu, '');
      return WORDS[plain] || word;
    });
}

const SOUNDS = Object.freeze({
  'baχaʁˈi': 'bχˈaʁ', 'vevaχaʁˈi': 'uvχˈaʁ', 'bˈoʔi': 'bˈo', 'vebˈoʔi': 'uvˈo',
  'mitsʔˈi': 'metsˈa', 'kiʁʔˈi': 'kʁˈa', 'muχanˈa': 'muχˈan',
  'lˈaχ': 'leχˈa', 'ʃelˈaχ': 'ʃelχˈa',
  'toʁˈeχ': 'toʁχˈa', 'liχtsˈi': 'leχˈats', 'veʁeʔˈi': 'uʁʔˈe', 'ʔivʁˈi': 'ʔavˈoʁ',
  'hatχilˈi': 'hatχˈel', 'tiʁtsˈi': 'tiʁtsˈe', 'hakʃivˈi': 'hakʃˈev', 'histaklˈi': 'histakˈel',
  'sifʁˈi': 'sfˈoʁ', 'ʃehiɡˈaʔat': 'ʃehiɡˈata', 'vehamʃiχˈi': 'vehamʃˈeχ',
  'nasˈi': 'nasˈe', 'venasˈi': 'venasˈe', 'ʔitˈaχ': 'ʔitχˈa',
  'hitslˈaχt': 'hitslˈaχta', 'matsˈat': 'matsˈata', 'ʔasˈit': 'ʔasˈita', 'katˈavt': 'katˈavta',
  'sijˈamt': 'sijˈamta', 'ʃeʔazˈaʁt': 'ʃeʔazˈaʁta', 'kibˈalt': 'kibˈalta', 'teɡalˈi': 'teɡalˈe',
  'ɡiʁʁˈi': 'ɡʁˈoʁ', 'hazˈizi': 'hazˈez', 'veχavnˈi': 'veχavˈen', 'veχizʁˈi': 'vaχazˈoʁ',
  'sˈimi': 'sˈim', 'ʔˈat': 'ʔatˈa', 'makiʁˈa': 'makˈiʁ', 'ʃebanˈit': 'ʃebanˈita',
  'tenasˈi': 'tenasˈe', 'beʔatsmˈeχ': 'beʔatsmeχˈa', 'ɡilˈit': 'ɡilˈita', 'hikˈaʁt': 'hikˈaʁta',
  'meɡalˈot': 'meɡalˈim',
});

export const MALE_CLIPS = {};
export function installProfileClips(clips) {
  const extra = (key, text, speech) => { clips[key] = { lang: 'he-IL', text, speech }; };
  for (const [key, clip] of Object.entries(clips)) {
    if (clip.lang !== 'he-IL' || /^(he-|letter-he-|number-|character-|clock-\d)/u.test(key)) continue;
    // Word boundaries here are phonetic tokens, including punctuation. Do not
    // replace a feminine suffix inside an unrelated word.
    const speech = clip.speech.replace(/bʁuχˈa habaʔˈa/gu, 'baʁˈuχ habˈa').replace(/[^\s.,!?;:]+/gu, word => SOUNDS[word] || word);
    if (speech !== clip.speech) {
      MALE_CLIPS[key] = `address-male-${key}`;
      extra(MALE_CLIPS[key], addressText(clip.text.normalize('NFD').replace(/[\u0591-\u05c7]/gu, ''), 'male'), speech);
    }
  }
  for (const name of VOICE_NAMES) {
    // A name in a complete phrase sounds more natural and is less vulnerable
    // to artifacts than an isolated syllable stitched between recordings.
    extra(`profile-welcome-female-${name.id}`, `שלום ${name.name}, ברוכה הבאה למשחק שלך!`, `ʃalˈom ${name.speech}, bʁuχˈa habaʔˈa lamisχˈak ʃelˈaχ!`);
    extra(`profile-welcome-male-${name.id}`, `שלום ${name.name}, ברוך הבא למשחק שלך!`, `ʃalˈom ${name.speech}, baʁˈuχ habˈa lamisχˈak ʃelχˈa!`);
  }
  extra('profile-hello', 'שלום!', 'ʃalˈom!');
  extra('profile-welcome-female', 'ברוכה הבאה למשחק שלך!', 'bʁuχˈa habaʔˈa lamisχˈak ʃelˈaχ!');
  extra('profile-welcome-male', 'ברוך הבא למשחק שלך!', 'baʁˈuχ habˈa lamisχˈak ʃelχˈa!');
  extra('profile-try-female', 'נסי שוב.', 'nasˈi ʃˈuv.');
  extra('profile-try-male', 'נסה שוב.', 'nasˈe ʃˈuv.');
  extra('profile-here-female', 'אני כאן איתך.', 'ʔanˈi kˈan ʔitˈaχ.');
  extra('profile-here-male', 'אני כאן איתך.', 'ʔanˈi kˈan ʔitχˈa.');
  extra('profile-great', 'איזה יופי!', 'ʔˈejze jˈofi!');
  extra('profile-found-female', 'מצאת!', 'matsˈat!');
  extra('profile-found-male', 'מצאת!', 'matsˈata!');
  const finish = clips['school-finish'];
  for (const gender of ['female', 'male']) {
    const source = gender === 'male' ? clips[MALE_CLIPS['school-finish']] : finish;
    extra(`profile-school-finish-${gender}`, source.text.replace(/(?:אַרִיאֵל|אריאל)[,!]?\s*/u, ''), source.speech.replace(/ʔaʁiʔˈel[,!]?\s*/u, ''));
  }
}
