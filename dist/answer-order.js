export function shuffle(values, rng = Math.random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// Keep a saved answer and all its usable distractors in their original slots.
// A replacement must also be distinguishable from every other choice on the board.
export function repairListeningChoices(choices, target, alternatives, distinct) {
  const kept = [target];
  const fits = candidate => kept.every(choice => distinct(choice, candidate));
  const safe = choices.map(choice => {
    if (choice === target) return true;
    if (!fits(choice)) return false;
    kept.push(choice);
    return true;
  });
  if (safe.every(Boolean)) return choices;
  return choices.flatMap((choice, i) => {
    if (safe[i]) return [choice];
    const pool = typeof alternatives === 'function' ? alternatives(choice) : alternatives;
    const replacement = pool.find(fits);
    if (replacement === undefined) return [];
    kept.push(replacement);
    return [replacement];
  });
}

export function answerShuffler(rng = Math.random) {
  let lastSlot = -1, lastSize = 0, streak = 0;

  return (choices, answer, identify = choice => choice.id ?? choice) => {
    let ordered = shuffle(choices, rng);
    const isCorrect = choice => identify(choice) === answer;
    let slot = ordered.findIndex(isCorrect);
    if (slot < 0 || ordered.length < 2) {
      streak = 0;
      return ordered;
    }

    // Give a long run one more chance to break without making alternation predictable.
    const repeats = () => slot === lastSlot && ordered.length === lastSize;
    if (repeats() && streak >= 2) {
      ordered = shuffle(ordered, rng);
      slot = ordered.findIndex(isCorrect);
    }
    streak = repeats() ? streak + 1 : 1;
    lastSlot = slot;
    lastSize = ordered.length;
    return ordered;
  };
}
