export const SESSION_LENGTH = 6;
export const LEGACY_SESSION_LENGTH = 10;
export const isSessionLength = length => length === SESSION_LENGTH || length === LEGACY_SESSION_LENGTH;
export const MAX_ASSISTED_TO_ADVANCE = 2;
export const ADVENTURE_PHASES = Object.freeze({
  warmup: 'מתחממות ביחד', practice: 'מגלות עוד קצת', challenge: 'אתגר קטן לסיום',
});
export function adventurePhase(index, length = SESSION_LENGTH) {
  const legacy = length === LEGACY_SESSION_LENGTH;
  return index < (legacy ? 3 : 2) ? 'warmup' : index < (legacy ? 7 : 4) ? 'practice' : 'challenge';
}
export const choiceCount = index => adventurePhase(index) === 'warmup' ? 2 : 3;
