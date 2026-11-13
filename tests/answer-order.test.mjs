import test from 'node:test';
import assert from 'node:assert/strict';
import { answerShuffler } from '../dist/answer-order.js';
import { createSession } from '../dist/engine.js';
import { packRound, unpackRound } from '../dist/session-state.js';
import { cleanJourney, journeyQuestions, newJourney, seeded, STORY_RELATIONS } from '../dist/journey.js';
import { STORIES } from '../dist/journey-content.js';
import { clockLessonTasks, sanitizeClockPosition } from '../dist/clock-learning.js';

test('Mixing answers gives long runs a second draw while still allowing repeated positions', () => {
  const draws = [0.9, 0.9, 0.9, 0.1, 0.1, 0.1, 0.9, 0.9, 0.1];
  const order = answerShuffler(() => draws.shift());
  const choices = ['right', 'wrong'];
  const slots = Array.from({ length: 7 }, () => order(choices, 'right').indexOf('right'));
  assert.deepEqual(slots, [0, 0, 1, 1, 1, 0, 1]);
  assert.equal(draws.length, 0);
  assert.deepEqual(choices, ['right', 'wrong']);
});

test('Every classic mission varies its correct positions and keeps the same options when resumed', () => {
  const paths = [
    ['hebrew', { reading: 'all' }], ['english', {}], ['math', {}], ['clock', { clockLevel: 'minutes' }],
    ['letters', { letterLanguage: 'hebrew' }], ['letters', { letterLanguage: 'english' }],
    ['characters', { characterLevel: 'family' }], ['characters', { characterLevel: 'paw-all' }],
  ];
  for (const [mission, settings] of paths) {
    const firstSlots = new Set(), laterSlots = new Set();
    for (let visit = 0; visit < 24; visit++) {
      const questions = createSession(mission, settings, seeded(123457 * visit));
      const slot = question => question.options.findIndex(option => option.id === question.answer);
      firstSlots.add(slot(questions[0]));
      laterSlots.add(slot(questions.at(-1)));
      assert.ok(questions.every(question => slot(question) >= 0));
    }
    assert.equal(firstSlots.size, 2, mission);
    assert.equal(laterSlots.size, 3, mission);

    const questions = createSession(mission, settings, seeded(42));
    const wrong = questions[4].options.find(option => option.id !== questions[4].answer).id;
    const draft = {
      id: '96c0212e-fe83-46c1-9e83-d05ce042d6c7',
      mission, questions, index: 4, attempted: [wrong], counted: [], helped: [4], ...settings,
    };
    const resumed = unpackRound(JSON.parse(JSON.stringify(packRound(draft))));
    assert.deepEqual(resumed.questions.map(q => q.options.map(o => o.id)), questions.map(q => q.options.map(o => o.id)));
    assert.deepEqual([...resumed.attempted], [wrong]);
  }
});

test('Journey choices, tile identities, and story actions survive a saved round', () => {
  const paths = [
    ['workshop', 4], ...STORIES.map(story => ['stories', story.id]),
    ['english', 'single'], ['english', 'pairs'], ['english', 'cars'],
    ['sounds', 'sounds'], ['sounds', 'blend'],
    ['objects', 'quantity'], ['objects', 'bonds'], ['objects', 'tens'], ['objects', 'takeaway'],
  ];
  for (const [mode, level] of paths) {
    const plan = newJourney(mode, level, {}, { rng: seeded(65) });
    const questions = journeyQuestions(plan);
    plan.state = { chosen: [1], tokens: [0] };
    const restored = cleanJourney(JSON.parse(JSON.stringify(plan)));
    assert.deepEqual(journeyQuestions(restored), questions, `${mode} ${level}`);
    assert.deepEqual(restored.state.chosen, [1]);
    assert.deepEqual(restored.state.tokens, [0]);
    assert.deepEqual(questions.map(q => q.key), journeyQuestions({ ...plan, shuffleAnswers: false }).map(q => q.key));

    for (const q of questions) {
      if (q.tiles) {
        for (const tile of q.tiles) assert.equal(tile.text, q.pieces[tile.id]);
      }
      if (!q.choices?.length) continue;
      if (q.page?.task === 'place') {
        assert.deepEqual([...q.choices].sort(), [...STORY_RELATIONS].sort());
      } else {
        const ids = q.choices.map(choice => q.kind === 'pair' ? `${choice.color}-${choice.object}` : choice.id ?? choice);
        assert.ok(ids.includes(q.answer), q.key);
        assert.equal(new Set(ids).size, ids.length, q.key);
      }
    }
  }
});

test('On replays of the same story the correct placement can be in any slot', () => {
  const story = STORIES.find(story => story.pages.some(page => page.task === 'place'));
  const step = story.pages.findIndex(page => page.task === 'place');
  const correct = story.pages[step].relation, slots = new Set();
  for (let visit = 0; visit < 24; visit++) {
    const plan = newJourney('stories', story.id, {}, { rng: seeded(123457 * visit) });
    slots.add(journeyQuestions(plan)[step].choices.indexOf(correct));
  }
  assert.deepEqual([...slots].sort(), [0, 1, 2]);
});

test('Subtraction varies the nearby distractors so the middle value is no longer a shortcut', () => {
  const ranks = new Set();
  const plan = newJourney('objects', 'takeaway', {}, { rng: seeded(45) });
  const examples = Array.from({ length: 10 }, () => ({ total: 6, known: 3 }));
  for (let seed = 0; seed < 24; seed++) {
    for (const task of journeyQuestions({ ...plan, seed, examples })) {
      assert.equal(task.choices.length, 3);
      assert.ok(task.choices.every(choice => choice >= 0 && choice <= task.total));
      ranks.add([...task.choices].sort((a, b) => a - b).indexOf(task.answer));
    }
  }
  assert.deepEqual([...ranks].sort(), [0, 1, 2]);
});

test('Clock School varies the numbers it asks for and restores the order from a saved seed', () => {
  const first = new Set();
  for (let seed = 1; seed <= 24; seed++) {
    const tasks = clockLessonTasks(1, seed, true);
    first.add(tasks[0].number);
    assert.equal(new Set(tasks.map(task => task.number)).size, 10);
    const saved = sanitizeClockPosition({ lesson: 1, index: 4, seed, shufflePractice: true });
    assert.equal(saved.index, 4);
    assert.equal(saved.shufflePractice, true);
    assert.deepEqual(clockLessonTasks(saved.lesson, saved.seed, saved.shufflePractice), tasks);
    assert.equal(clockLessonTasks(1, seed)[0].number, 3);
  }
  assert.ok(first.size > 6);
});
