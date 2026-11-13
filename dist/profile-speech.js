import { MALE_CLIPS, VOICE_NAMES } from './profile-content.js?v=2.2.0-voices';

export function profileSpeech(profile, personalized = null) {
  const address = profile?.address === 'male' ? 'male' : 'female';
  const prepared = VOICE_NAMES.some(item => item.id === profile?.voice) ? profile.voice : null;
  const originalAriel = prepared === 'ariel' && address === 'female';
  const generated = value => typeof value === 'string' && value.startsWith('blob:') ? [{ source: value, lang: 'he-IL' }] : null;
  return key => {
    if (key === 'welcome') return generated(personalized?.welcome) || (originalAriel ? ['welcome'] : prepared ? [`profile-welcome-${address}-${prepared}`] : [`profile-welcome-${address}`]);
    if (key === 'good-luck') return generated(personalized?.goodLuck) || [prepared ? `profile-good-luck-${prepared}` : 'profile-good-luck'];
    if (!originalAriel && key === 'try-again') return [`profile-try-${address}`, `profile-here-${address}`];
    if (!originalAriel && key === 'correct-2') return ['profile-great', `profile-found-${address}`];
    if (!originalAriel && key === 'school-finish') return [`profile-school-finish-${address}`];
    return [address === 'male' && MALE_CLIPS[key] ? MALE_CLIPS[key] : key];
  };
}
