export function syncClock() {
  let stamp = Date.UTC(2026, 10, 8, 10), nextId = 0;
  const timers = new Map();
  return {
    options: {
      now: () => stamp,
      setTimer: (callback, delay) => { const id = ++nextId; timers.set(id, { callback, at: stamp + delay }); return id; },
      clearTimer: id => timers.delete(id),
    },
    close: () => timers.clear(),
    async advance(ms) {
      const target = stamp + ms;
      for (;;) {
        const due = [...timers].filter(([, t]) => t.at <= target).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        stamp = due[1].at; timers.delete(due[0]); due[1].callback();
        await new Promise(resolve => setImmediate(resolve));
      }
      stamp = target;
    },
  };
}
