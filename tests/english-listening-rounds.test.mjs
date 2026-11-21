import assert from 'node:assert/strict';
import test from 'node:test';
import { CLIPS } from '../dist/content.js';
import { createSession } from '../dist/engine.js';
import { distinctSpokenWords } from '../dist/english-listening-contrast.js';
import { STORIES } from '../dist/journey-content.js';
import { ENGLISH_WORDS, journeyQuestions, newJourney, resumeJourney, seeded } from '../dist/journey.js';
import { cleanItem } from '../dist/learning.js';
import { packRound, unpackRound } from '../dist/session-state.js';

function assertClear(words) {
  assert.ok(words.length >= 2, 'provide at least two choices');
  for (const [index, word] of words.entries()) {
    for (const other of words.slice(0, index)) assert.ok(distinctSpokenWords(word, other), `${word} beside ${other}`);
  }
}

const choiceId = choice => choice.id ?? `${choice.color}-${choice.object}`;
const known = Object.fromEntries(ENGLISH_WORDS.map(({ id }) => [`english:single:${id}`, cleanItem({ seen: 4, independent: 2 })]));

test('English listening presents distinct spoken choices in quick play and all beginner journeys', () => {
  for (const learning of [{}, known]) for (let seed = 1; seed <= 64; seed++) {
    const rng = seeded(seed * 104729);
    const classic = createSession('english', { englishMax: 20, learning }, rng);
    for (const q of classic) {
      assertClear(q.options.map(choice => choice.en ?? choice.id));
      assert.ok(q.options.some(choice => choice.id === q.answer));
      assert.equal(CLIPS[q.targetClip].lang, 'en-US');
    }
    for (const level of ['single', 'pairs', 'cars']) {
      const plan = newJourney('english', level, learning, { rng });
      const questions = journeyQuestions(plan);
      for (const q of questions) {
        assert.ok(q.choices.some(choice => choiceId(choice) === q.answer));
        assert.equal(CLIPS[q.clip].lang, 'en-US');
        if (q.kind === 'pair') {
          assert.ok(q.choices.every(choice => choice.object === q.target.object));
          assertClear(q.choices.map(choice => choice.color));
        } else {
          assertClear(q.choices.map(choice => choice.en));
        }
      }
      assert.deepEqual(journeyQuestions(resumeJourney(plan)), questions);
    }
  }
});

test('safe classic listening drafts keep their options; older confusing animal, color and numeral rows keep their correct slot', () => {
  const base = packRound({ id: '07ed2cf5-f3e3-44e2-a68f-1e03491f38cc', mission: 'english', index: 4,
    questions: createSession('english', { englishMax: 20 }, seeded(91)), helped: [4], counted: [], attempted: [], observed: [0, 1, 2, 3] });
  for (const [kind, unsafe, target, clear] of [['animal', 'duck', 'dog', 'rabbit'], ['color', 'pink', 'purple', 'red'], ['number', '4', '14', '9']]) {
    const old = structuredClone(base);
    Object.assign(old.questions[4], { kind, target, options: [unsafe, clear, target] });
    old.attempted = [unsafe, clear];
    const resumed = unpackRound(old);
    const q = resumed.questions[4];
    assert.equal(q.answer, target);
    assert.equal(q.targetClip, `en-${target}`);
    assert.deepEqual(q.options.slice(1).map(choice => choice.id), [clear, target]);
    assertClear(q.options.map(choice => choice.en ?? choice.id));
    assert.deepEqual([...resumed.attempted], [clear]);
    assert.deepEqual([...resumed.helped], [4]);
    assert.deepEqual([...resumed.observed], old.observed);
    assert.deepEqual(unpackRound(packRound(resumed)), resumed);
  }
});

function oldJourney(level, index, attempted) {
  return { ...newJourney('english', level, {}, { rng: seeded(42) }), seed: 5321, index,
    english: ['dog', 'cat', 'red', 'blue', 'pink', 'purple', 'duck'], pairColors: ['pink', 'purple'],
    state: { showModel: true, attempted }, helped: [index], observed: [0] };
}

test('saved two-word journeys keep both original pink/purple targets and slots while changing their competing color', () => {
  for (const [level, object] of [['pairs', 'ball'], ['cars', 'car']]) {
    const old = oldJourney(level, 3, [`purple-${object}`]);
    const resumed = resumeJourney(old);
    assert.deepEqual(resumed.pairColors, old.pairColors);
    assert.deepEqual(resumed.state.attempted, []);
    assert.ok(resumed.state.showModel);
    assert.deepEqual(resumed.helped, [3]);
    assert.deepEqual(resumed.observed, [0]);
    const qs = journeyQuestions(resumed);
    assert.deepEqual(qs.map(q => q.answer), [object, 'pink', 'purple', `pink-${object}`, `purple-${object}`, `pink-${object}`]);
    assert.deepEqual(qs.map(q => q.choices.findIndex(option => choiceId(option) === q.answer)), [1, 0, 1, 1, 1, 1]);
    assert.ok(qs.slice(3).every(q => q.choices.every(choice => choice.object === object)));
    for (const q of qs.slice(3)) assertClear(q.choices.map(choice => choice.color));
    assert.deepEqual(journeyQuestions(resumeJourney(resumed)), qs);
  }
});

test('restoring old single-word listening keeps safe rows and attempts independently of audio help', () => {
  const old = oldJourney('single', 4, ['red', 'pink']);
  const resumed = resumeJourney(old);
  const qs = journeyQuestions(resumed);
  assert.deepEqual(qs.slice(0, 4).map(q => q.choices.map(choiceId)), [
    ['dog', 'cat'], ['cat', 'dog'], ['duck', 'cat'], ['red', 'pink'],
  ]);
  assert.deepEqual(qs[4].choices.slice(1).map(choiceId), ['red', 'purple']);
  assert.deepEqual(resumed.state.attempted, ['red']);
  assert.ok(resumed.state.showModel);
  assert.deepEqual(resumed.helped, old.helped);
  assert.equal(qs[5].answer, 'duck');
  assert.equal(qs[5].choices.length, 3);
  assert.equal(qs[5].choices[0].id, 'cat');
  assert.equal(qs[5].choices[1].id, 'duck');
  assert.ok(old.english.includes(qs[5].choices[2].id), 'the replacement comes from this saved listening vocabulary');
  assertClear(qs[5].choices.map(choice => choice.en));
});

test('every authored English listening page in the Hebrew storybooks has distinct spoken picture labels', () => {
  let reviewed = 0;
  for (const story of STORIES) for (const page of story.pages.filter(p => p.english)) {
    const label = id => id.replace(/^color-ball-/u, '');
    assertClear(page.choices.map(label));
    assert.ok(page.choices.includes(page.target));
    assert.equal(label(page.target), page.english);
    reviewed++;
  }
  assert.ok(reviewed > 0);
});
