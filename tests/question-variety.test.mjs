import test from 'node:test';
import assert from 'node:assert/strict';
import { hasArt } from '../dist/art.js';
import { CHARACTER_LEVELS, CHARACTER_MODES } from '../dist/characters.js';
import { CLOCK_LEVELS } from '../dist/clock.js';
import { CLOCK_LESSONS, clockLessonTasks, isFullTurn, sanitizeClockPosition, taskClips, taskSucceeded } from '../dist/clock-learning.js';
import { CLIPS, READING_LEVELS } from '../dist/content.js';
import { createSession } from '../dist/engine.js';
import { cleanJourney, ENGLISH_WORDS, journeyQuestions, newJourney, PHONICS, resumeJourney, seeded } from '../dist/journey.js';
import { STORIES } from '../dist/journey-content.js';
import { cleanItem } from '../dist/learning.js';

function distinctNeighbors(targets, path) {
  for (let i = 1; i < targets.length; i++) {
    assert.notEqual(targets[i], targets[i - 1], `${path}, questions ${i} and ${i + 1}`);
  }
}

test('Sound practice teaches three distinct sounds and reviews M with another word', () => {
  const learned = Object.fromEntries(PHONICS.map(({ id }) => [`phonics:sound:${id}`, cleanItem({ seen: 1 })]));
  const covered = new Set();
  for (let seed = 0; seed < 100; seed++) {
    for (const items of [{}, learned]) {
      const plan = newJourney('sounds', 'sounds', items, { rng: seeded(seed * 15485863) });
      const questions = journeyQuestions(plan);
      const targets = questions.map(q => q.answer);
      distinctNeighbors(targets, 'first sounds');
      assert.deepEqual(questions.map(q => q.model), [true, true, true, false, false, false]);
      assert.equal(new Set(targets.slice(0, 3)).size, 3);
      assert.deepEqual(targets.slice(0, 3).sort(), targets.slice(3).sort());
      if (targets.includes('m')) {
        const [model, review] = questions.filter(q => q.answer === 'm');
        assert.equal(model.clip, 'journey-en-mouse');
        assert.ok(['moon', 'milk', 'monkey'].includes(review.example.id));
      }
      for (const { clip, example, phoneme } of questions) {
        covered.add(phoneme.id);
        assert.equal(CLIPS[clip]?.text, example?.text.toLowerCase() || phoneme.word);
        assert.ok(hasArt(example?.id || (phoneme.word === 'insect' ? 'butterfly' : phoneme.word)), clip);
      }
    }
  }
  assert.deepEqual([...covered].sort(), PHONICS.map(p => p.id).sort());
});

test('Resuming either old sounds round preserves the current prompt and changes the later sequence', () => {
  for (const length of [6, 10]) for (const index of [0, 1, length - 2]) {
    const plan = newJourney('sounds', 'sounds', {}, { rng: seeded(71) });
    const old = {
      ...plan, length, varietyFrom: undefined, soundIds: ['m', 'a', 't'], index,
      state: { attempted: ['a'], showModel: true }, helped: [0, index], observed: [0],
    };
    const original = journeyQuestions(cleanJourney(old));
    const resumed = resumeJourney(old);
    const questions = journeyQuestions(resumed);
    assert.equal(original[0].clip, 'journey-en-mouse');
    assert.equal(original[1].clip, 'journey-en-mouse', 'The previous generator repeated the complete prompt');
    assert.deepEqual(questions.slice(0, index + 1), original.slice(0, index + 1));
    distinctNeighbors(questions.slice(index).map(q => q.answer), `resumed sounds (${length} steps)`);
    assert.deepEqual(resumed.state.attempted, old.state.attempted);
    assert.deepEqual(resumed.observed, old.observed);
    assert.deepEqual(journeyQuestions(resumeJourney(JSON.parse(JSON.stringify(resumed)))), questions);
  }
});

test('Reading, listening and clock quizzes choose distinct prompts and recognition spaces its reviews', () => {
  for (let seed = 0; seed < 32; seed++) {
    const settingsSeed = () => seeded(seed * 15485863);
    for (const reading of Object.keys(READING_LEVELS)) {
      const questions = createSession('hebrew', { reading }, settingsSeed());
      assert.equal(new Set(questions.map(q => q.word.he)).size, 6, reading);
    }
    for (const englishMax of [10, 20]) {
      const questions = createSession('english', { englishMax }, settingsSeed());
      assert.equal(new Set(questions.map(q => CLIPS[q.targetClip].text)).size, 6);
    }
    for (const clockLevel of Object.keys(CLOCK_LEVELS)) {
      const questions = createSession('clock', { clockLevel }, settingsSeed());
      assert.equal(new Set(questions.map(q => q.time.digital)).size, 6, clockLevel);
    }
    for (const letterLanguage of ['hebrew', 'english']) {
      const questions = createSession('letters', { letterLanguage }, settingsSeed());
      const targets = questions.map(q => q.letter.familiar);
      distinctNeighbors(targets, letterLanguage);
      assert.equal(new Set(targets.slice(0, 3)).size, 3);
      assert.deepEqual(targets.slice(0, 3).sort(), targets.slice(3).sort());
    }
    for (const characterLevel of Object.keys(CHARACTER_LEVELS)) {
      for (const characterMode of Object.keys(CHARACTER_MODES)) {
        const questions = createSession('characters', { characterLevel, characterMode }, settingsSeed());
        distinctNeighbors(questions.map(q => q.character.he), `${characterLevel} ${characterMode}`);
      }
    }
  }
});

test('Story routes, the word workshop and the remaining English paths vary the actual learning targets', () => {
  for (let seed = 0; seed < 36; seed++) {
    const tasks = (mode, level) => journeyQuestions({ ...newJourney(mode, level, {}, { rng: seeded(seed) }), seed });
    for (const story of STORIES) {
      const targets = tasks('stories', story.id).map(({ page }) => {
        if (page.task === 'english') return `listen:${page.english}`;
        if (page.task === 'count') return `count:${page.target}:${page.count}`;
        if (page.task === 'place') return `place:${page.target}:${page.relation}`;
        return `picture:${page.target}`;
      });
      distinctNeighbors(targets, story.id);
    }
    for (const level of [1, 2, 3, 4]) {
      assert.equal(new Set(tasks('workshop', level).map(q => q.word.he)).size, 6);
    }
    for (const level of ['single', 'pairs', 'cars']) {
      distinctNeighbors(tasks('english', level).map(q => CLIPS[q.clip].text), level);
    }
    const [a, b, c, ...words] = tasks('sounds', 'blend');
    assert.equal(new Set([a, b, c].map(q => q.phoneme.id)).size, 3);
    assert.equal(new Set(words.map(q => q.word)).size, 3);
  }
});

test('Object activities use six different exercises even at the lowest cap', () => {
  for (const mathMax of [5, 10, 20]) for (const level of ['quantity', 'bonds', 'tens', 'takeaway']) {
    for (let seed = 0; seed < 40; seed++) {
      const plan = newJourney('objects', level, {}, { mathMax, rng: seeded(seed * 15485863) });
      const questions = journeyQuestions(plan);
      assert.equal(new Set(questions.map(q => `${q.total}:${q.known}`)).size, 6, `${level} to ${mathMax}`);
      const totals = questions.map(q => q.total);
      assert.deepEqual(totals, [...totals].sort((a, b) => a - b));
      if (level === 'quantity' && mathMax === 5) {
        assert.deepEqual(totals, [0, 1, 2, 3, 4, 5]);
        assert.deepEqual(questions[0].extraClips, ['number-0']);
      }
    }
  }
});

test('Fully learned listening vocabulary produces six distinct review words', () => {
  const known = Object.fromEntries(ENGLISH_WORDS.map(({ id }) => [`english:single:${id}`, cleanItem({ seen: 2, independent: 1 })]));
  for (let seed = 0; seed < 100; seed++) {
    const plan = newJourney('english', 'single', known, { rng: seeded(seed * 15485863) });
    const questions = journeyQuestions(plan);
    assert.equal(new Set(questions.map(q => CLIPS[q.clip].text)).size, 6);
    assert.ok(questions.every(q => !q.newWord && q.choices.length >= 2));
    assert.deepEqual(journeyQuestions(resumeJourney(JSON.parse(JSON.stringify(plan)))), questions);

    const previousPlan = { ...plan, index: 5, distinctReview: undefined };
    const oldQuestions = journeyQuestions(previousPlan);
    assert.equal(oldQuestions[5].answer, oldQuestions[2].answer);
    assert.deepEqual(journeyQuestions(resumeJourney(previousPlan)), oldQuestions);
  }
});

test('Each Clock School lesson asks six distinguishable questions with valid audio and saves those examples', () => {
  for (const [lessonIndex, lesson] of CLOCK_LESSONS.entries()) {
    for (let seed = 1; seed <= 30; seed++) {
      const tasks = clockLessonTasks(lessonIndex, seed, true, 6, true);
      const prompts = tasks.map(task => taskClips(lesson, task).map(clip => {
        assert.equal(CLIPS[clip]?.lang, 'he-IL', clip);
        return CLIPS[clip].text;
      }).join(' '));
      assert.equal(new Set(prompts).size, 6, lesson.title);
      if (lesson.journey) {
        const durations = tasks.map(task => task.duration);
        assert.deepEqual(durations, [...durations].sort((a, b) => a - b));
        assert.equal(durations[0], 1);
        assert.equal(durations.at(-1), 60);
        assert.ok(tasks.every(task => task.total < 720));
      }
      if (lesson.turn) assert.deepEqual(tasks.map(task => isFullTurn(lesson, task)), [true, false, false, false, false, false]);
      if (lesson.hand !== 'face') for (const task of tasks) {
        assert.equal(taskSucceeded(lesson, task, task.start, true), false);
        assert.equal(taskSucceeded(lesson, task, task.total, true), true);
      }
      const position = { lesson: lessonIndex, index: 4, total: tasks[4].start, seed, length: 6, shufflePractice: true, variedPractice: true };
      const saved = sanitizeClockPosition(JSON.parse(JSON.stringify(position)));
      assert.deepEqual(saved, position);
      assert.deepEqual(clockLessonTasks(saved.lesson, saved.seed, saved.shufflePractice, saved.length, saved.variedPractice), tasks);
    }
  }
});
