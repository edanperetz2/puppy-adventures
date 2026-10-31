import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { CHARACTERS, CHARACTER_ART, CHARACTER_LEVELS, CHARACTER_MODES, characterPool, characterPortrait, createCharacterSession, sanitizeCharacterPractice, finishCharacterPractice, nextCharacterLevel } from '../dist/characters.js';
import { characterMenu, characterQuestion, characterAnswer, characterName } from '../dist/characters-view.js';
import { CLIPS, MISSION_IDS, MISSIONS } from '../dist/content.js';
import { createSession, DEFAULT_SETTINGS, freshProgress, finishSession, sanitizeProgress, sanitizeSettings } from '../dist/engine.js';
import { compactContribution, withPending } from '../dist/sync.js';

function seeded(seed) { return () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; }; }
const plain = text => text.normalize('NFC').replace(/[\u0591-\u05bd\u05bf-\u05c7]/gu, '');

test('Seven familiar characters have consistent pointed Hebrew names, portraits and recorded pronunciation', async () => {
  assert.deepEqual(CHARACTERS.map(c => c.he), ['ראבל', 'מיקס', 'צ׳ארג׳ר', 'ווילר', 'מוטור', 'דודה קריין', 'סבא גראבל']);
  assert.deepEqual(Object.keys(CHARACTER_LEVELS).map(level => characterPool(level).length), [3, 5, 7]);
  assert.equal(new Set(CHARACTERS.map(c => c.id)).size, 7);
  for (const c of CHARACTERS) {
    assert.equal(plain(c.pointed), c.he);
    assert.equal(CLIPS[c.clip].lang, 'he-IL'); assert.match(CLIPS[c.clip].speech, /haʃˈem/u);
    const [x, y, width, height] = c.portrait;
    assert.ok(x >= 0 && y >= 0 && x + width <= CHARACTER_ART.width && y + height <= CHARACTER_ART.height);
    assert.match(characterPortrait(c), /href="\.\/assets\/crew-family.webp"/u);
    assert.match(characterPortrait(c), /preserveAspectRatio="xMidYMid slice"/u, 'A wide answer card must never reveal neighbouring faces outside its portrait window');
  }
  const source = JSON.parse(await readFile(new URL('../scripts/character-art-source.json', import.meta.url), 'utf8'));
  const bytes = await readFile(new URL('../dist/assets/crew-family.webp', import.meta.url));
  assert.equal(bytes.subarray(0, 4).toString(), 'RIFF');
  assert.equal(bytes.subarray(8, 12).toString(), 'WEBP');
  assert.equal(createHash('sha256').update(bytes).digest('hex'), source.sha256, 'The credited artwork must remain unmodified');
});

test('Every character level and direction has ten unambiguous steps, expanding the cast and choices in order', () => {
  for (const characterLevel of Object.keys(CHARACTER_LEVELS)) for (const characterMode of Object.keys(CHARACTER_MODES)) for (let seed = 0; seed < 100; seed++) {
    const questions = createSession('characters', { characterLevel, characterMode }, seeded(seed));
    assert.equal(questions.length, 10);
    const cast = characterPool(characterLevel);
    assert.deepEqual(new Set(questions.map(q => q.character.id)), new Set(cast.map(c => c.id)), 'Every selected friend is a target, not only a distractor');
    let previousTier = 0;
    for (const [index, q] of questions.entries()) {
      assert.equal(q.type, 'character');
      assert.equal(q.options.length, index < 3 ? 2 : 3);
      assert.equal(new Set(q.options.map(c => c.id)).size, q.options.length);
      assert.equal(q.options.filter(c => c.id === q.answer).length, 1);
      assert.equal(q.answer, q.character.id);
      assert.ok(q.tier >= previousTier); previousTier = q.tier;
      assert.ok(q.options.every(c => cast.includes(c) && c.tier <= q.tier));
      assert.equal(q.phase, index < 3 ? 'warmup' : index < 7 ? 'practice' : 'challenge');
      if (index) assert.notEqual(q.character.id, questions[index - 1].character.id);
      assert.ok(CLIPS[q.prompt]); assert.ok(CLIPS[q.hint]);
      assert.equal(q.targetClip, undefined, 'The answer name must not be automatically read before a hint or success');
      assert.equal(q.direction, characterMode === 'mixed' ? index % 2 ? 'name-picture' : 'picture-name' : characterMode);
    }
  }
});

test('Reading targets and choices do not reveal the other half of the matching task', () => {
  for (const q of createCharacterSession({ characterLevel: 'family' }, seeded(35))) {
    const question = characterQuestion(q, true);
    if (q.direction === 'picture-name') {
      assert.ok(!question.includes(q.character.he) && !question.includes(q.character.pointed));
      assert.match(question, /<svg/u);
      for (const option of q.options) { const html = characterAnswer(q, option, true); assert.ok(html.includes(option.pointed)); assert.doesNotMatch(html, /<svg|<img|href=/u); }
    } else {
      assert.ok(question.includes(q.character.pointed)); assert.doesNotMatch(question, /<svg|<img/u);
      for (const option of q.options) { const html = characterAnswer(q, option, true); assert.match(html, /<svg/u); assert.ok(!html.includes(option.he) && !html.includes(option.pointed)); }
    }
  }
  const menu = characterMenu(sanitizeSettings(null), sanitizeCharacterPractice(null));
  assert.equal((menu.match(/data-action="character-level"/gu) || []).length, 3);
  assert.equal((menu.match(/data-action="character-mode"/gu) || []).length, 3);
  assert.match(menu, /character-family-art/u, 'The full original artwork remains visible in the menu');
  assert.equal(characterName(CHARACTERS[2], false), 'צ׳ארג׳ר');
});

test('Names count as Hebrew reading, preserving the established family protocol and every previous reward', () => {
  assert.deepEqual(MISSION_IDS, ['hebrew', 'letters', 'english', 'math', 'clock']);
  assert.equal(MISSIONS.characters.progressMission, 'hebrew');
  const old = freshProgress(); old.sessions = 26; old.stars = 156; old.missions.hebrew = 26; old.skills.hebrew.correct = 156;
  old.clockLessons = 35; old.letterPractice.hebrew.writingMain[5] = 2;
  const result = finishSession(old, 'characters', 2).progress;
  assert.equal(result.sessions, 27); assert.equal(result.stickers.length, 27);
  assert.equal(result.missions.hebrew, 27); assert.equal(result.skills.hebrew.correct, 166); assert.equal(result.skills.hebrew.assisted, 2);
  assert.equal(result.clockLessons, 35); assert.equal(result.letterPractice.hebrew.writingMain[5], 2);
  assert.equal(old.sessions, 26);
  const contribution = compactContribution(result);
  assert.deepEqual(Object.keys(contribution.missions), MISSION_IDS);
  assert.equal(contribution.missions.characters, undefined);
  assert.ok(Buffer.byteLength(JSON.stringify(contribution)) < 4096);
  assert.deepEqual(withPending(result, freshProgress(), freshProgress()).stickers, result.stickers);
});

test('Saved character choices and full-round practice survive reopening without inventing unfinished rewards', () => {
  const settings = sanitizeSettings({ characterLevel: 'family', characterMode: 'name-picture' });
  assert.equal(settings.characterLevel, 'family'); assert.equal(settings.characterMode, 'name-picture');
  assert.equal(sanitizeSettings({ characterLevel: '__proto__', characterMode: 'invalid' }).characterLevel, 'friends');
  assert.equal(sanitizeSettings({ characterMode: 'invalid' }).characterMode, 'mixed');
  const questions = createCharacterSession(settings, seeded(10)), initial = sanitizeCharacterPractice(null);
  assert.deepEqual(finishCharacterPractice(initial, 'family', questions.slice(0, 9)), initial);
  const saved = finishCharacterPractice(initial, 'family', questions);
  assert.equal(saved.completed.family, 1); assert.equal(initial.completed.family, 0);
  assert.equal(Object.values(saved.seen['name-picture']).reduce((sum, n) => sum + n, 0), 10);
  assert.equal(Object.values(saved.seen['picture-name']).reduce((sum, n) => sum + n, 0), 0);
  assert.deepEqual(sanitizeCharacterPractice(JSON.parse(JSON.stringify(saved))), saved);
  const corrupt = sanitizeCharacterPractice({ completed: { friends: -1, family: Infinity }, seen: { 'picture-name': { rubble: '2', mix: 1000001, charger: 2 } } });
  assert.equal(corrupt.completed.family, 0); assert.equal(corrupt.seen['picture-name'].mix, 0); assert.equal(corrupt.seen['picture-name'].charger, 2);
  assert.equal(sanitizeProgress({ version: 1, sessions: 26, stars: 156 }).stickers.length, 26);
});

test('Less-practiced names are offered first, while advancement keeps eight independent answers as the threshold', () => {
  const practice = sanitizeCharacterPractice(null); practice.seen['picture-name'].rubble = 99;
  for (let seed = 0; seed < 40; seed++) assert.notEqual(createCharacterSession({ characterPractice: practice }, seeded(seed))[0].answer, 'rubble');
  assert.equal(nextCharacterLevel('friends', 0), 'crew'); assert.equal(nextCharacterLevel('friends', 2), 'crew');
  assert.equal(nextCharacterLevel('crew', 1), 'family');
  assert.equal(nextCharacterLevel('friends', 3), null); assert.equal(nextCharacterLevel('friends', -1), null);
  assert.equal(nextCharacterLevel('family', 0), null); assert.equal(nextCharacterLevel('__proto__', 0), null);
});
