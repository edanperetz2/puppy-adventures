import test from 'node:test';
import assert from 'node:assert/strict';
import { ENGLISH_LISTENING, LITTLE_STORIES } from '../dist/activities.js';
import { CLIPS, READING_LEVELS } from '../dist/content.js';
import { GUIDE_ITEMS } from '../dist/guide-content.js';
import { latestPlayedDraft, readingActivity, recommendAdventure } from '../dist/home-adventure.js';
import { readingWords } from '../dist/reading.js';
import { DAY } from '../dist/learning.js';
import { createSession, SESSION_LENGTH } from '../dist/engine.js';
import { actOutSteps } from '../dist/act-out.js';

const now = Date.UTC(2026, 9, 31, 17);
const independent = (age = 0) => ({ independent: 1, helped: 0, last: now - age, success: now - age });
const supported = (age = 0) => ({ independent: 0, helped: 1, last: now - age, success: 0 });
const recommend = state => recommendAdventure({ now, ...state });

test('The first suggestion opens one-word listening and varies practice as answers are recorded', () => {
  assert.equal(recommend().activity, ENGLISH_LISTENING);
  const exposed = { 'english:single:dog': { independent: 0, helped: 0, last: now } };
  assert.equal(recommend({ items: exposed }).activity, ENGLISH_LISTENING);
  const listened = { 'english:single:dog': independent() };
  assert.deepEqual(recommend({ items: listened }).activity.route, { action: 'number-start', path: 'count' });
  assert.equal(recommend({ items: { ...listened, 'math:count:3:0': independent() } }).activity.route.level, 'short');
});

test('Recent supported answers can repeat a specific activity and old help gives way to variety', () => {
  const items = { 'english:single:dog': supported(), 'english:single:blue': supported() };
  assert.equal(recommend({ items }).activity, ENGLISH_LISTENING);
  assert.notEqual(recommend({ items }).reason, ENGLISH_LISTENING.he[1]);
  assert.equal(recommendAdventure({ items, now: now + 8 * DAY }).activity.route.path, 'count');
  const adding = { 'math:add:1:1': supported(), 'math:add:1:2': supported() };
  assert.equal(recommend({ items: adding }).activity.route.path, 'add');
});

test('Completed, mostly independent Hebrew practice can suggest Little Stories directly', () => {
  const ids = readingWords('actions').slice(0, SESSION_LENGTH).map(word => word.id);
  const items = Object.fromEntries(ids.map((id, i) => [`read:${id}`, i < 4 ? independent() : supported()]));
  const readingPractice = { recent: { actions: ids } };
  assert.equal(recommend({ reading: 'actions', items, readingPractice }).activity, LITTLE_STORIES);
  assert.equal(recommend({ reading: 'short', items, readingPractice }).activity, LITTLE_STORIES);
  assert.notEqual(recommend({ reading: 'actions', items }).activity, LITTLE_STORIES);
  items[`read:${ids[3]}`] = supported();
  assert.equal(recommend({ reading: 'actions', items, readingPractice }).activity.route.level, 'actions');
});

test('Synced answers can suggest review at a practiced reading stage on a fresh device', () => {
  const words = readingWords('sentences').slice(0, 3);
  const items = Object.fromEntries(words.map(word => [`read:${word.id}`, supported()]));
  assert.equal(recommend({ reading: 'short', items }).activity, LITTLE_STORIES);
  assert.equal(recommend({ reading: 'all', items }).activity, LITTLE_STORIES);
});

test('Little Stories shares its start path, copy, narration and six-step expectation', () => {
  const { level, action } = LITTLE_STORIES.route;
  assert.equal(action, 'reading-level');
  assert.equal(readingActivity(level), LITTLE_STORIES);
  const stage = READING_LEVELS[level];
  assert.equal(stage.name, LITTLE_STORIES.he[0].replace(/\p{M}/gu, ''));
  assert.equal(stage.description, LITTLE_STORIES.he[1]);
  assert.equal(stage.clip, LITTLE_STORIES.intro);
  assert.equal(CLIPS[stage.clip].lang, 'he-IL');
  const wordGarden = GUIDE_ITEMS.find(entry => entry.en[0] === 'Word Garden');
  for (const locale of ['he', 'en']) {
    for (const copy of LITTLE_STORIES[locale]) assert.ok(wordGarden[locale][1].includes(copy));
  }
  const questions = createSession('hebrew', { reading: level });
  assert.equal(questions.length, LITTLE_STORIES.steps);
  assert.ok(questions.every(q => q.word.level === stage.level));
  assert.ok(actOutSteps(questions).length > 0);
});

test('The home resume selects played work across existing saves and skips completed science', () => {
  const classic = { mission: 'hebrew', at: 1, index: 3, questions: Array(10).fill({}), helped: [], counted: [], attempted: [] };
  const onlyOpened = { mission: 'letters', at: 7, index: 0, questions: [{ showModel: true }], helped: [0], counted: [], attempted: [] };
  const journey = { mode: 'english', at: 4, index: 0, state: {} };
  const numbers = { at: 5, index: 0, attempted: [] };
  const science = { at: 6, actions: ['water'], complete: true };
  const saves = {
    drafts: { classic, onlyOpened }, journeyDrafts: { journey }, numberDrafts: { numbers },
    scienceDrafts: { pepper: science },
  };
  assert.equal(latestPlayedDraft(saves).value, classic);
  assert.equal(latestPlayedDraft(saves).value.questions.length, 10);
  journey.state.attempted = ['dog'];
  assert.equal(latestPlayedDraft(saves).kind, 'journey');
  numbers.hint = true;
  assert.equal(latestPlayedDraft(saves).kind, 'numbers');
  science.complete = false;
  assert.equal(latestPlayedDraft(saves).path, 'pepper');
});
