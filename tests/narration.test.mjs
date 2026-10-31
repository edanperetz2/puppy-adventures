import test from 'node:test';
import assert from 'node:assert/strict';
import { CLIPS } from '../dist/content.js';
import { Narrator } from '../dist/audio.js';
import { hebrewSpeech, HEBREW_LEXICON } from '../dist/hebrew-pronunciation.js';

test('Hebrew narration disambiguates the reported feminine verbs and numbers', () => {
  for (const [key, clip] of Object.entries(CLIPS).filter(([, clip]) => clip.lang === 'he-IL')) {
    assert.ok(clip.speech, `Missing pronunciation guide: ${key}`);
    assert.match(clip.speech, /ˈ/u, `Missing reviewed stress: ${key}`);
    assert.doesNotMatch(clip.speech, /[\u0590-\u05ff]/u, `Uncompiled Hebrew spelling: ${key}`);
    assert.doesNotMatch(clip.speech, /\d/, `Speak an explicit Hebrew number: ${key}`);
  }
  assert.match(CLIPS['intro-hebrew'].speech, /liχtsˈi/);
  assert.match(CLIPS.read.speech, /kiʁʔˈi/);
  assert.match(CLIPS.add.speech, /sifʁˈi/);
  assert.equal(CLIPS['correct-1'].speech, 'kˈol hakavˈod! hitslˈaχt!');
  assert.match(CLIPS.complete.speech, /sijˈamt .* ʃeʔazˈaʁt .* kibˈalt/u);
  assert.equal(CLIPS['number-1'].speech, 'ʔaχˈat');
  assert.equal(CLIPS['number-2'].speech, 'ʃtˈajim');
  assert.equal(CLIPS['number-12'].speech, 'ʃtˈem ʔesʁˈe');
  assert.equal(CLIPS['number-20'].speech, 'ʔesʁˈim');
  assert.equal(CLIPS['clock-time-12-45'].speech, 'haʃaʔˈa ʁˈeva leʔaχˈat.');
  assert.equal(CLIPS['clock-time-1-45'].speech, 'haʃaʔˈa ʁˈeva liʃtˈajim.');
  assert.equal(CLIPS['he-dog'].speech, 'kˈelev');
  assert.equal(CLIPS['he-house'].speech, 'bˈajit');
  assert.equal(CLIPS['he-flower'].speech, 'pˈeʁaχ');
  assert.equal(CLIPS['he-sun'].speech, 'ʃˈemeʃ');
});

test('The shared pronunciation lexicon covers the whole curriculum and rejects unreviewed words', () => {
  for (const [word, pronunciation] of Object.entries(HEBREW_LEXICON)) {
    assert.equal(hebrewSpeech(word), pronunciation);
    assert.doesNotMatch(pronunciation, /[\u0590-\u05ff]/u);
    // This synthesizer's IPA vocabulary marks stress immediately before a vowel.
    assert.match(pronunciation, /ˈ[aeiou]/u, `Unresolved stress: ${word}`);
    assert.doesNotMatch(pronunciation, /ˈ[^aeiou]/u, `Misplaced stress: ${word}`);
  }
  assert.equal(hebrewSpeech('לִחְצִי עַל הַתְּמוּנָה.'), 'liχtsˈi ʔˈal hatmunˈa.');
  assert.equal(hebrewSpeech('מְחַכִּים בְּיַחַד'), 'meχakˈim bejˈaχad');
  assert.equal(hebrewSpeech('סִיַּמְתְּ! שֶׁעָזַרְתְּ'), 'sijˈamt! ʃeʔazˈaʁt');
  assert.throws(() => hebrewSpeech('מִלָּה חֲדָשָׁה'), /pronunciation review/);
  // Canonical-equivalent combining marks must get the same reviewed reading.
  assert.equal(hebrewSpeech('לִחְצִי'.normalize('NFD')), hebrewSpeech('לִחְצִי'.normalize('NFC')));
});

test('Hebrew never falls back to a device voice; English requires an English voice', async () => {
  const original = { Audio: globalThis.Audio, window: globalThis.window, SpeechSynthesisUtterance: globalThis.SpeechSynthesisUtterance };
  let spoken;
  try {
    globalThis.Audio = class {};
    globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
    globalThis.window = { speechSynthesis: {
      getVoices: () => [{ lang: 'he-IL' }, { lang: 'en-US' }],
      speak: utterance => { spoken = utterance; queueMicrotask(() => utterance.onend()); },
    } };
    const narrator = new Narrator();
    assert.equal(await narrator.deviceVoice('intro-hebrew', false, narrator.sequence), false);
    assert.equal(spoken, undefined);
    assert.equal(await narrator.deviceVoice('en-dog', false, narrator.sequence), true);
    assert.equal(spoken.text, 'dog');
    assert.equal(spoken.lang, 'en-US');
    assert.equal(spoken.rate, 0.85);
    window.speechSynthesis.getVoices = () => [{ lang: 'he-IL' }];
    spoken = undefined;
    assert.equal(await narrator.deviceVoice('en-dog', false, narrator.sequence), false);
    assert.equal(spoken, undefined);
  } finally {
    for (const [key, value] of Object.entries(original)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  }
});
