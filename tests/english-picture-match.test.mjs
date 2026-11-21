import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { CLIPS } from '../dist/content.js';
import { hasArt } from '../dist/art.js';
import { ENGLISH_PICTURES, cleanJourney, journeyQuestions, newJourney, seeded } from '../dist/journey.js';
import { distinctMatchPictures, MATCH_LEVELS } from '../dist/english-picture-match.js';
import { ANIMAL_ACTIONS, COUNTED_NOUNS, ENGLISH_PICTURE_CLIPS, MATCH_COLORS, PAINTED_NOUNS } from '../dist/english-picture-content.js';
import { englishMatchPicture, englishPictureView } from '../dist/english-picture-view.js';
import { mountJourney } from '../dist/journey-view.js';

test('each English picture has an unambiguous label and a whole recording that says the displayed English', () => {
  const bank = ENGLISH_PICTURES;
  assert.ok(bank.word.length >= 270);
  assert.equal(bank.phrase.length, PAINTED_NOUNS.length * MATCH_COLORS.length);
  assert.equal(bank.sentence.length, Object.keys(COUNTED_NOUNS).length * 3 + bank.phrase.length + ANIMAL_ACTIONS.length);
  const entries = [...bank.word, ...bank.phrase, ...bank.sentence];
  assert.equal(entries.length, bank.byId.size);
  assert.equal(new Set(entries.map(e => e.text)).size, entries.length);
  for (const entry of entries) {
    assert.ok(hasArt(entry.noun), entry.id);
    assert.equal(CLIPS[entry.clip]?.lang, 'en-US', entry.id);
    assert.equal(CLIPS[entry.clip].text.toLowerCase(), entry.text.toLowerCase(), entry.id);
  }
  for (const [a, b] of [['burger', 'sandwich'], ['wheel', 'bicycle'], ['fork', 'spaghetti'], ['melon', 'watermelon'],
                         ['honey', 'jar'], ['slide', 'ladder'], ['egg', 'nest'], ['circle', 'ball']]) {
    assert.equal(distinctMatchPictures(a, b), false);
    assert.equal(distinctMatchPictures(b, a), false);
  }
  assert.equal(bank.byId.get('green-door').text, 'green door');
  assert.equal(bank.byId.get('yellow-ball').text, 'yellow ball');
  assert.equal(bank.byId.get('is-green-door').text, 'The door is green.');
  assert.equal(bank.byId.get('does-rabbit-jump').text, 'The rabbit jumps.');
  assert.equal(bank.byId.get('does-dog-sleep').text, 'The dog sleeps.');
  for (const noun of PAINTED_NOUNS) {
    assert.equal(new Set(MATCH_COLORS.map(color => englishMatchPicture(bank.byId.get(`${color}-${noun}`)))).size, MATCH_COLORS.length, noun);
  }
  for (const entry of bank.sentence.filter(e => e.count)) {
    assert.equal(englishMatchPicture(entry).match(/<svg\b/gu).length, entry.count, entry.id);
  }
  for (const entry of ANIMAL_ACTIONS) assert.ok(hasArt(entry.scene), entry.id);
});

test('the new English vocabulary and whole sentences use their reviewed Ava voice and pace', async () => {
  const { clips } = JSON.parse(await readFile(new URL('../dist/assets/audio/manifest.json', import.meta.url), 'utf8'));
  const settings = JSON.parse(await readFile(new URL('../scripts/english-voice-settings.json', import.meta.url), 'utf8'));
  for (const id of Object.keys(settings.voiceByClip)) assert.equal(CLIPS[id]?.lang, 'en-US', id);
  for (const [id, entry] of Object.entries(ENGLISH_PICTURE_CLIPS)) {
    if (entry.lang !== 'en-US') continue;
    assert.equal(clips[id]?.voice, settings.voiceByClip[id] || settings.voice, id);
    const word = entry.text.trim().toLowerCase().replace(/[.!?]+$/u, '');
    assert.equal(clips[id].rate, settings.words.includes(word) ? settings.rate : '+0%', id);
    assert.equal(clips[id].speech, entry.text, id);
  }
});

test('both directions progress in six distinct steps, save the target and choices, and vary on later rounds', () => {
  for (const level of Object.keys(MATCH_LEVELS)) {
    const items = {}, seen = new Set(), slots = new Set();
    for (let seed = 1; seed <= 60; seed++) {
      const plan = newJourney('english', level, items, { rng: seeded(seed) });
      const round = journeyQuestions(plan);
      assert.equal(round.length, 6);
      assert.equal(new Set(round.map(q => q.target.noun)).size, 6);
      const families = round.filter(q => q.target.kind === 'sentence').map(q => q.target.family);
      assert.equal(new Set(families).size, families.length);
      assert.deepEqual(round.map(q => q.target.kind), seed === 1
        ? ['word','word','word','phrase','phrase','sentence'] : ['word','word','phrase','phrase','sentence','sentence']);
      assert.deepEqual(journeyQuestions(cleanJourney({ ...plan, index: 3 })), round);
      assert.equal(cleanJourney({ ...plan, pictureTargets: [...plan.pictureTargets.slice(1), 'invalid'] }), null);
      for (const [index, task] of round.entries()) {
        assert.equal(CLIPS[task.prompt].lang, 'he-IL');
        assert.equal(task.choices.length, index < 2 ? 2 : 3);
        assert.equal(task.choices.filter(c => c.id === task.answer).length, 1);
        assert.equal(new Set(task.choices.map(c => c.text)).size, task.choices.length);
        if (task.target.kind !== 'word') {
          assert.ok(task.choices.some(c => c.id !== task.answer && c.noun === task.target.noun));
          assert.ok(task.choices.every(c => c.family === task.target.family));
          assert.ok(task.choices.some(c => c.noun !== task.target.noun && c.color === task.target.color && c.count === task.target.count && c.action === task.target.action));
        }
        slots.add(task.choices.findIndex(c => c.id === task.answer));
        seen.add(task.answer);
        items[task.key] = { seen: 1, independent: 1, days: [], last: Date.now() };
      }
    }
    assert.deepEqual([...slots].sort(), [0,1,2]);
    assert.ok(seen.size > 215, level);
  }
});

test('the reverse path lets a child listen to every written choice separately, and the forward path shows pictures', () => {
  for (const level of Object.keys(MATCH_LEVELS)) {
    for (const task of journeyQuestions(newJourney('english', level))) {
      const html = englishPictureView(task, {});
      if (level === 'picture-words') {
        assert.equal(html.match(/data-j="match-option-voice"/gu).length, task.choices.length);
        assert.ok(!html.includes('data-j="listen"'));
        for (const entry of task.choices) {
          assert.ok(html.includes(`lang="en" dir="ltr">${entry.text.toUpperCase()}</b>`));
        }
      } else {
        assert.ok(html.includes('data-j="listen"'));
        assert.ok(!html.includes('match-option-voice'));
        for (const entry of task.choices) assert.ok(html.includes(englishMatchPicture(entry)));
      }
    }
  }
});

test('Ava reads the forward prompt, and plays each requested reverse option without answering for the child', () => {
  for (const level of Object.keys(MATCH_LEVELS)) {
    const plan = newJourney('english', level);
    const [task] = journeyQuestions(plan);
    let click;
    const heard = [];
    const host = { addEventListener(type, listener) { if (type === 'click') click = listener; } };
    const controller = mountJourney(host, {
      plan, speak: keys => heard.push(keys), onSave() {}, onObservation() {},
    });
    controller.replay();
    assert.deepEqual(heard.pop(), level === 'word-pictures' ? [task.prompt, task.clip] : [task.prompt]);
    if (level === 'picture-words') {
      for (const choice of task.choices) {
        const button = { dataset: { j: 'match-option-voice', voice: choice.id } };
        click({ target: { closest: () => button } });
        assert.equal(heard.pop(), choice.clip);
        assert.equal(Boolean(plan.state.resolved), false);
        assert.equal(plan.helped.length, 0);
      }
    }
    controller.destroy();
  }
});
