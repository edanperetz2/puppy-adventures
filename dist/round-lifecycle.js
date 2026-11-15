import { finishSession } from './engine.js?v=2.7.1-pepper';

export function checkpointScoredRound(round, drafts, key, encode = value => value) {
  if (round.awarded) return;
  round.at = Date.now();
  drafts[key] = encode(round);
}

export function finishScoredRound(round, drafts, key, award) {
  if (round.awarded || !round.resolved || round.index !== round.questions.length - 1) return null;
  const reward = award(round.id, round.questions.length);
  round.awarded = true;
  // A callback from an earlier round must never remove a newer draft.
  if (drafts[key]?.id === round.id) delete drafts[key];
  return reward;
}

export function awardLocalRound(progress, awarded, mission, assisted, letters, id, length) {
  if (awarded.includes(id)) return { progress, sticker: null, awarded };
  return { ...finishSession(progress, mission, assisted, letters, length), awarded: [...awarded, id].slice(-10000) };
}
