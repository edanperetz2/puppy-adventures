export function shuffle(values, rng = Math.random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
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
