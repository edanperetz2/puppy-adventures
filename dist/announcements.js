// The welcome belongs to this opening of the game, never to saved progress.
export class GameAnnouncements {
  constructor(narrator) {
    this.narrator = narrator;
    this.welcomePending = true;
  }

  start() {
    // Browsers may refuse audio until a tap. Keep the greeting pending so the
    // first spoken interaction can play it before its own instructions.
    return this.say('welcome', { quietFailure: true });
  }

  say(keys, options = {}) {
    const playlist = Array.isArray(keys) ? [...keys] : [keys];
    if (this.welcomePending && playlist[0] !== 'welcome') playlist.unshift('welcome');
    return this.narrator.say(playlist, {
      ...options,
      onClipEnd: key => {
        if (key === 'welcome') this.welcomePending = false;
        options.onClipEnd?.(key);
      },
    });
  }
}
