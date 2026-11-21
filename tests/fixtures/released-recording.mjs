import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const retakes = JSON.parse(readFileSync(new URL('./reviewed-audio-retakes.json', import.meta.url), 'utf8'));
const englishRetakes = JSON.parse(readFileSync(new URL('./reviewed-english-retakes.json', import.meta.url), 'utf8'));

// Reconstruct only the fields a reviewed retake replaces. Historical
// digests still cover every other field and every untouched recording.
export function releasedRecording([id, recording]) {
  if (englishRetakes[id]) {
    const [sha256, reviewedHash] = englishRetakes[id];
    assert.equal(recording.sha256, reviewedHash, id);
    assert.equal(recording.voice, 'en-US-AvaNeural', id);
    assert.equal(recording.rate, '-8%', id);
    return [id, { ...recording, sha256, voice: 'en-US-AvaMultilingualNeural', rate: '+0%' }];
  }
  const retake = retakes[id];
  if (!retake) return [id, recording];
  const [take, sha256, reviewedHash, originalFields] = retake;
  assert.equal(recording.sha256, reviewedHash, id);
  return [id, { ...recording, take, sha256, ...originalFields }];
}
