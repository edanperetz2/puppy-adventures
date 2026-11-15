import { MAX_ASSISTED_TO_ADVANCE, SESSION_LENGTH } from './adventure.js?v=2.2.2-six';
import { ENGLISH_LISTENING, LITTLE_STORIES } from './activities.js';
import { DAY } from './learning.js';
import { NUMBER_PATHS } from './number-workshop.js?v=2.3.0-numbers';
import { nextReadingStage, READING_LEVELS, WORDS } from './reading.js?v=2.7.0-science';

const stages = Object.entries(READING_LEVELS).filter(([, stage]) => stage.number);
const levelKeys = new Map(stages.map(([key, stage]) => [stage.level, key]));
const wordLevels = new Map(WORDS.map(word => [word.id, levelKeys.get(word.level)]));
const supportedPeriod = 7 * DAY;

export function readingActivity(key) {
  if (key === LITTLE_STORIES.route.level) return LITTLE_STORIES;
  const stage = READING_LEVELS[key];
  return { id: `reading-${key}`, route: { action: 'reading-level', level: key }, he: [stage.name, stage.description], icon: stage.art || 'flower' };
}

function numberActivity(path, description) {
  const { title, icon } = NUMBER_PATHS[path];
  return { id: `numbers-${path}`, route: { action: 'number-start', path }, he: [title, description], icon };
}

const COUNTING = numberActivity('count', 'סוֹפְרוֹת וּבוֹחֲרוֹת מִסְפָּר.');
const ADDING = numberActivity('add', 'מְחַבְּרוֹת שְׁתֵּי קְבוּצוֹת.');

function collectAnswers(items) {
  const reading = new Map(stages.map(([key]) => [key, []]));
  const english = [], count = [], add = [];
  for (const [key, item] of Object.entries(items)) {
    if (!(item.last > 0 && (item.independent || item.helped))) continue;
    if (key.startsWith('read:')) reading.get(wordLevels.get(key.slice(5)))?.push(item);
    else if (key.startsWith('english:single:')) english.push(item);
    else if (key.startsWith('math:count:')) count.push(item);
    else if (key.startsWith('math:add:')) add.push(item);
  }
  for (const answers of [english, count, add, ...reading.values()]) answers.sort((a, b) => b.last - a.last);
  return { reading, english, count, add };
}

function currentReadingLevel(selected, reading) {
  const chosen = reading.get(selected);
  // A paired browser can have reading history before a stage is chosen here.
  if (chosen && (selected !== 'short' || chosen.length)) return selected;
  return [...reading].filter(([, answers]) => answers.length >= 2)
    .sort((a, b) => b[1][0].last - a[1][0].last)[0]?.[0] ?? 'short';
}

function readingAdvancement(level, items, practice, reading, since) {
  const recent = practice?.recent?.[level]?.slice(-SESSION_LENGTH) ?? [];
  if (recent.length !== SESSION_LENGTH) return null;
  const answers = recent.map(id => items[`read:${id}`]);
  if (answers.some(item => !item || item.last < since || !(item.independent || item.helped))) return null;
  const helped = answers.filter(item => item.last !== item.success || !item.independent).length;
  if (helped > MAX_ASSISTED_TO_ADVANCE) return null;
  const next = nextReadingStage(level, helped);
  return next && !practice?.recent?.[next]?.length && !reading.get(next).length ? next : null;
}

export function recommendAdventure({ items = {}, reading: selected, readingPractice, now = Date.now() } = {}) {
  const answers = collectAnswers(items);
  const level = currentReadingLevel(selected, answers.reading);
  const choices = [
    { activity: ENGLISH_LISTENING, answers: answers.english },
    { activity: COUNTING, answers: answers.count },
    { activity: readingActivity(level), answers: answers.reading.get(level) },
  ];
  if (answers.add.length || answers.count.filter(item => item.independent).length >= 4) {
    choices.push({ activity: ADDING, answers: answers.add });
  }

  const since = now - supportedPeriod;
  const supported = choices.filter(({ answers }) => {
    const recent = answers.slice(0, SESSION_LENGTH).filter(item => item.last >= since);
    const withHelp = recent.filter(item => item.helped && !item.independent).length;
    return withHelp >= 2 && withHelp * 2 >= recent.length;
  }).sort((a, b) => b.answers[0].last - a.answers[0].last)[0];
  if (supported) return { activity: supported.activity, reason: 'נְתַרְגֵּל עוֹד קְצָת בְּיַחַד.' };

  const next = readingAdvancement(level, items, readingPractice, answers.reading, since);
  if (next) return { activity: readingActivity(next), reason: 'מֻכָנָה לַשָּׁלָב הַבָּא.' };

  const lastPlayed = choice => choice.answers[0]?.last ?? 0;
  const { activity } = choices.reduce((oldest, choice) => lastPlayed(choice) < lastPlayed(oldest) ? choice : oldest);
  return { activity, reason: activity.he[1] };
}

export function latestPlayedDraft({ drafts, journeyDrafts, numberDrafts, scienceDrafts, picnicDrafts = {} }) {
  const activeClassic = d => d.index || d.resolved || d.attempted.length || d.counted.length || d.actOutMoves?.length
    || (d.helped.includes(d.index) && !d.questions[d.index].showModel);
  const activeJourney = ({ index, state }) => index || state.resolved || state.showModel || state.placed
    || state.chosen?.length || state.tokens?.length || state.attempted?.length || state.quantity;
  return [
    ...Object.values(drafts).filter(d => d.mission !== 'math' && activeClassic(d)).map(value => ({ kind: 'classic', value })),
    ...Object.values(journeyDrafts).filter(d => d.mode !== 'objects' && activeJourney(d)).map(value => ({ kind: 'journey', value })),
    ...Object.values(numberDrafts).filter(d => d.index || d.resolved || d.hint || d.attempted.length).map(value => ({ kind: 'numbers', value })),
    ...Object.entries(scienceDrafts).filter(([, d]) => !d.complete && d.actions.length)
      .map(([path, value]) => ({ kind: 'science', path, value })),
    ...Object.entries(picnicDrafts).filter(([, d]) => d.at > 0).map(([path, value]) => ({ kind: 'picnic', path, value })),
  ].sort((a, b) => b.value.at - a.value.at)[0];
}
