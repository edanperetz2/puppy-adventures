import assert from 'node:assert/strict';
import { test } from 'node:test';
import { hasArt } from '../dist/art.js';
import { readTrialStudio, saveTrialShow, theaterGames } from '../dist/trial-theater.js';

test('both six-step shows depict the chosen action and remove each direct control after the tap', () => {
  for (const game of theaterGames.filter(item => item.steps)) {
    assert.equal(game.steps.length, 6);
    const answers = [];
    for (const step of game.steps) {
      const before = step.scene(answers, null);
      for (const option of step.choices) {
        assert.ok(option.art.startsWith('<') || hasArt(option.art));
        if (step.direct) assert.ok(before.includes(`data-trial-choice="${option.id}"`));
        if (step.correct && !step.correct.includes(option.id)) continue;
        const after = step.scene(answers, option.id);
        assert.notEqual(before, after);
        assert.ok(!after.includes('data-trial-choice'));
      }
      answers.push(step.correct?.[0] || step.choices[0].id);
    }
  }
});

test('the invited guest stays for the rest of the concert, and both chosen endings play', () => {
  const concert = theaterGames.find(game => game.id === 'concert');
  const first = ['light', 'guitar', 'strum'];
  for (const guest of ['rabbit', 'duck']) {
    const chosen = concert.steps[3].scene(first, guest);
    const later = concert.steps[4].scene([...first, guest], null);
    const guestMarkup = html => /<span class="tt-piece tt-guest"[^>]*>(.*?)<\/span>/u.exec(html)[1];
    assert.equal(guestMarkup(chosen), guestMarkup(later));
    for (const end of ['bow', 'wave']) {
      const scene = concert.steps[5].scene([...first, guest, 'clap'], end);
      assert.ok(scene.includes(`tt-pose-${end}`));
      assert.equal(guestMarkup(scene), guestMarkup(chosen));
    }
  }
});

test('playful repetitions, different saved shows, and the draft survive reopening independently', () => {
  const studio = readTrialStudio(null);
  studio.draft = { actor: 'bobi', script: ['dance', 'dance', 'bow'] };
  saveTrialShow(studio);
  const first = studio.draft.id;
  studio.draft = { actor: 'luli', script: ['wave', 'jump'] };
  saveTrialShow(studio);
  assert.notEqual(studio.draft.id, first);
  studio.draft.script.reverse();
  assert.deepEqual(studio.shows[0].script, ['wave', 'jump']);
  saveTrialShow(studio);
  const restored = readTrialStudio(JSON.parse(JSON.stringify(studio)));
  assert.equal(restored.shows.length, 2);
  assert.deepEqual(restored.shows.find(show => show.id === first).script, ['dance', 'dance', 'bow']);
  assert.deepEqual(restored.draft.script, ['jump', 'wave']);
  assert.ok(restored.shows.some(show => show.id === restored.draft.id));
  assert.deepEqual(readTrialStudio({ draft: { actor: 'constructor', script: ['dance'] } }).draft.script, []);
});
