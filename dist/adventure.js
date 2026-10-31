export const SESSION_LENGTH = 10;
export const MAX_ASSISTED_TO_ADVANCE = 2;
export const ADVENTURE_PHASES = Object.freeze({
  warmup: 'מתחממות ביחד', practice: 'מגלות עוד קצת', challenge: 'אתגר קטן לסיום',
});
export const adventurePhase = index => index < 3 ? 'warmup' : index < 7 ? 'practice' : 'challenge';
export const choiceCount = index => index < 3 ? 2 : 3;
