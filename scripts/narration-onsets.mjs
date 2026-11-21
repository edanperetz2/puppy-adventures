import { readFile } from 'node:fs/promises';
import { MPEGDecoder } from 'mpg123-decoder';
import '../dist/narration-mp3.js';

const rate = 24000, frame = 576, lead = 8 * frame;
const hop = 120; // five milliseconds

function peak(pcm, start, end) {
  let value = 0;
  for (let i = start; i < Math.min(end, pcm.length); i++) value = Math.max(value, Math.abs(pcm[i]));
  return value;
}

function periodic(pcm, start) {
  // Voiced speech has repeating cycles. Compare 15 ms against plausible
  // voice periods of 2.5–10 ms, independent of the speaker's language.
  const length = 360;
  for (let lag = 60; lag <= 240; lag += 4) {
    let dot = 0, left = 0, right = 0;
    for (let i = start; i < start + length; i += 3) {
      const a = pcm[i], b = pcm[i + lag];
      dot += a * b; left += a * a; right += b * b;
    }
    if (dot > 0 && dot * dot > 0.67 * left * right) return true;
  }
  return false;
}

function attack(pcm) {
  const first = pcm.findIndex(sample => Math.abs(sample) > 0.003);
  if (first < 0) return;
  const limit = Math.min(pcm.length - 600, first + rate * 0.32);
  for (let i = first; i < limit; i += hop) {
    if (peak(pcm, i, i + 360) < 0.024 || !periodic(pcm, i) || !periodic(pcm, i + hop)) continue;
    const vowelPeak = peak(pcm, i, i + rate * 0.11);
    // Regular pitch may be detectable only after several vowel cycles. Walk
    // back to the quiet side of its first sustained rise, protecting that rise.
    let rise = first;
    while (rise < i && peak(pcm, rise, rise + hop) < vowelPeak * 0.12) rise += hop;
    const voice = Math.max(first, rise - 2 * hop);
    if (voice - first < rate * 0.025) return;
    const onsetPeak = peak(pcm, first, voice);
    if (onsetPeak < 0.006 || vowelPeak < 0.07) return;
    // Preserve natural dynamics. Lift only a consonant at least 19.5 dB
    // below its own vowel, aiming for a 16.5 dB contrast and at most 9 dB.
    const steps = Math.min(6, Math.floor((-16.5 - 20 * Math.log10(onsetPeak / vowelPeak)) / 1.505));
    if (steps >= 2) return { first, voice, onsetPeak, steps };
    return;
  }
}

// Screen for unvoiced starts before looking for acoustic evidence. Hebrew
// has reviewed IPA. The English spelling filter excludes silent-letter starts.
function possibleAttack(clip) {
  if (clip.lang === 'he-IL') return /^[ˈ]*(?:p|t|k|f|s|ʃ|χ)/u.test(clip.speech);
  return /^(?!kn|ps|pn|pt|the\b|that\b|this\b|these\b|those\b)[cfkpqst]/iu.test(clip.text);
}

export async function measureOnset(decoder, source) {
  async function opening(plan) {
    const bytes = globalThis.prepareNarrationMp3(source, plan);
    const frameBytes = bytes[2] === 0x64 ? 144 : 192;
    // Raw CBR frames with no seek tag expose the same decoder delay in both
    // readings. Analyze enough of the real opening to encompass every voice.
    await decoder.reset();
    return decoder.decode(bytes.subarray(0, 52 * frameBytes)).channelData[0];
  }
  const plain = await opening();
  const region = attack(plain);
  if (!region) return;
  const { first, voice, onsetPeak, steps } = region;
  // A Layer III granule overlaps the next granule during synthesis. Check its
  // actual decoded effect and retreat a frame if it would change the vowel.
  const start = Math.max(0, Math.floor((first - lead) / frame) - 3);
  for (let end = Math.floor((voice - lead) / frame) - 1; end >= start; end--) {
    const plan = [start, end, steps];
    const lifted = await opening(plan);
    let changedAfter = 0;
    for (let i = voice; i < Math.min(lifted.length, voice + 4 * frame); i++) {
      changedAfter = Math.max(changedAfter, Math.abs(lifted[i] - plain[i]));
    }
    if (changedAfter > 0.001) continue;
    const newPeak = peak(lifted, first, voice);
    if (newPeak < onsetPeak * 1.20 || newPeak > 0.55) return;
    return plan;
  }
}

export async function narrationOnsets(root, clips, recordings) {
  const decoder = new MPEGDecoder();
  const byHash = new Map(), onsets = {};
  try {
    await decoder.ready;
    for (const [id, clip] of Object.entries(clips)) {
      if (!possibleAttack(clip)) continue;
      const sha = recordings[id].sha256;
      if (!byHash.has(sha)) {
        const source = await readFile(new URL(`assets/audio/${id}.mp3`, root));
        byHash.set(sha, await measureOnset(decoder, source));
      }
      if (byHash.get(sha)) onsets[id] = byHash.get(sha);
    }
    return onsets;
  } finally {
    decoder.free();
  }
}
