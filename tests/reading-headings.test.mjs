import test from 'node:test';
import assert from 'node:assert/strict';
import { journeyQuestions, newJourney, seeded } from '../dist/journey.js';
import { journeyReadingText } from '../dist/journey-content.js';
import { PICTURE_BLEND_GROUPS } from '../dist/english-expansion.js';
import { mountJourney } from '../dist/journey-view.js';

function openPage(plan, index, nikud, state = {}) {
  let click;
  const heard = [];
  const host = { addEventListener(type, listener) { if (type === 'click') click = listener; } };
  const controller = mountJourney(host, {
    plan: { ...plan, index, state }, nikud, speak: keys => heard.push(keys), onSave() {}, onObservation() {},
  });
  const [heading] = host.innerHTML.match(/<h1\b[^>]*>.*?<\/h1>/gu);
  return { heading, html: host.innerHTML, heard, destroy: controller.destroy,
    tap: action => click({ target: { closest: () => ({ dataset: { j: action } }) } }),
  };
}

test('each storybook page titles the scene with its own Hebrew sentence and the speaker reads that page', () => {
  const plan = newJourney('stories', 'picnic');
  for (const [index, task] of journeyQuestions(plan).entries()) {
    for (const nikud of [true, false]) {
      const page = openPage(plan, index, nikud);
      const sentence = journeyReadingText(task.page.text, nikud);
      assert.ok(page.heading.includes(`lang="he" dir="rtl">${sentence}</h1>`));
      assert.equal(page.html.split(`>${sentence}<`).length, 2);
      page.tap('read-story');
      assert.equal(page.heard.at(-1), task.prompt.replace(/-prompt$/u, ''));
      page.destroy();
    }
  }
});

test('the word workshop titles its final picture with the unfinished sentence until a hint or answer fills the blank', () => {
  const plan = newJourney('workshop', 4, {}, { rng: seeded(51) });
  const index = journeyQuestions(plan).findIndex(task => task.kind === 'context');
  const task = journeyQuestions(plan)[index];
  for (const nikud of [true, false]) {
    for (const state of [{}, { showModel: true }, { resolved: true }]) {
      const page = openPage(plan, index, nikud, state);
      const target = state.showModel || state.resolved ? (nikud ? task.word.pointed : task.word.he) : '____';
      assert.ok(page.heading.includes(`<b>${target}</b>`));
      assert.ok(page.heading.includes(journeyReadingText(task.context.before, nikud)));
      assert.ok(page.heading.includes(journeyReadingText(task.context.after, nikud)));
      if (!nikud) assert.doesNotMatch(page.heading, /\p{M}/u);
      page.tap('replay');
      assert.deepEqual(page.heard.at(-1), [state.showModel || state.resolved ? `journey-context-${task.word.id}` : task.prompt]);
      page.destroy();
    }
  }
});

test('unpointed story text uses everyday full spelling and distinguishes words with the same consonants', () => {
  assert.equal(journeyReadingText('עַל הַשֻּׁלְחָן שֶׁלִּי יֵשׁ יָרָק יָרֹק.', false), 'על השולחן שלי יש ירק ירוק.');
  assert.equal(journeyReadingText('הַכַּדּוּר שֶׁל לוּלִי כָּחֹל, לֹא אָדֹם.', false), 'הכדור של לולי כחול, לא אדום.');
  assert.equal(journeyReadingText('מַנִּיחִים אֹכֶל עַל', false), 'מניחים אוכל על');
});

test('Hebrew word building puts a displayed model in the heading and keeps independent spelling hidden until a hint or success', () => {
  const plan = newJourney('workshop', 3, {}, { rng: seeded(18) });
  for (const [index, task] of journeyQuestions(plan).entries()) {
    if (task.kind === 'context') continue;
    for (const nikud of [false, true]) for (const state of [{}, { showModel: true }, { resolved: true }]) {
      const page = openPage(plan, index, nikud, state);
      const word = nikud ? task.word.pointed : task.word.he;
      const showsWord = Boolean(task.model || state.showModel || state.resolved);
      assert.equal(page.heading.endsWith(`lang="he" dir="rtl">${word}</h1>`), showsWord);
      assert.equal(page.html.match(/data-j="word"/gu).length, 1);
      const model = page.html.split('class="workshop-model">')[1].split('</div>')[0];
      assert.equal(model.includes('data-j="word"'), !showsWord);
      assert.ok(!model.includes('<strong'));
      page.tap('word');
      assert.equal(page.heard.at(-1), `he-${task.word.id}`);
      page.destroy();
    }
  }
});

test('English phonics uses a word heading only for reading a word and choosing its picture', () => {
  for (const trio of PICTURE_BLEND_GROUPS) {
    const plan = { ...newJourney('sounds', 'blend'), blendWords: trio };
    for (const [index, task] of journeyQuestions(plan).entries()) {
      const page = openPage(plan, index, true);
      if (task.readPicture) {
        assert.ok(page.heading.endsWith(`lang="en" dir="ltr">${task.word.toUpperCase()}</h1>`));
        assert.ok(page.html.includes(`class="blend-lowercase" lang="en" dir="ltr">${task.word}</span>`));
        assert.equal(page.html.match(/data-j="listen"/gu).length, 1);
        page.tap('listen');
        assert.equal(page.heard.at(-1), task.clip);
      } else {
        assert.match(page.heading, /lang="he" dir="rtl"/u);
        assert.ok(!page.heading.includes(task.word.toUpperCase()));
      }
      page.destroy();
    }
  }
});
