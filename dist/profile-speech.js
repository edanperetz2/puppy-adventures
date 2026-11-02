import { MALE_CLIPS, VOICE_NAMES } from './profile-content.js';
import { recordingData } from './profiles.js';

export function profileSpeech(profile, recordedName = null) {
  const address = profile?.address === 'male' ? 'male' : 'female';
  const recording = recordingData(recordedName);
  const name = recording ? [{ recording, lang: 'he-IL' }] : [];
  const prepared = !recording && VOICE_NAMES.some(item => item.id === profile?.voice) ? profile.voice : null;
  const originalAriel = profile?.voice === 'ariel' && address === 'female' && !recording;
  return key => {
    if (key === 'welcome') return originalAriel ? ['welcome'] : prepared ? [`profile-welcome-${address}-${prepared}`] : ['profile-hello', ...name, `profile-welcome-${address}`];
    if (!originalAriel && key === 'try-again') return [`profile-try-${address}`, `profile-here-${address}`];
    if (!originalAriel && key === 'correct-2') return ['profile-great', `profile-found-${address}`];
    if (!originalAriel && key === 'school-finish') return [`profile-school-finish-${address}`];
    return [address === 'male' && MALE_CLIPS[key] ? MALE_CLIPS[key] : key];
  };
}
