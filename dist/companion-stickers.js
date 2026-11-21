export const PIKACHU_CALL_URL = new URL('./assets/audio/pikachu-greeting.mp3', import.meta.url);
const greetings = {
  pikachu: PIKACHU_CALL_URL,
  stitch: new URL('./assets/stitch-ukulele.wav', import.meta.url),
};

export function pikachuImage(className) {
  return `<img class="${className}" src="./assets/home-pikachu.png" alt="" width="215" height="215" draggable="false">`;
}

export function stitchImage(className) {
  return `<img class="${className}" src="./assets/home-stitch.webp" alt="" width="215" height="215" draggable="false">`;
}

export function companionStickers() {
  return `<div class="companion-stickers" role="group" aria-label="החברים של אריאל">
    <button type="button" class="companion-sticker" data-action="companion-greet" data-companion="pikachu" aria-label="להגיד שלום לפיקאצ׳ו">${pikachuImage('companion-portrait')}</button>
    <button type="button" class="companion-sticker" data-action="companion-greet" data-companion="stitch" aria-label="לנגן עם סטיץ׳">${stitchImage('companion-portrait')}</button>
  </div>`;
}

// Share Ava's already unlocked media element so a greeting can follow a lesson on iOS.
export function createCompanionGreetings(audio, soundEnabled) {
  let speaking = false;
  let pending = null;
  let playing = null;
  let highlighted = null;
  let highlightTimer;

  function clearHighlight() {
    clearTimeout(highlightTimer);
    highlighted?.classList.remove('is-greeting');
    highlighted = null;
  }

  function finish() {
    playing?.button.classList.remove('pika-talking');
    playing = null;
  }

  function stop() {
    pending = null;
    if (playing) audio.pause();
    finish();
    clearHighlight();
  }

  audio.addEventListener('ended', () => { if (audio.ended) finish(); });
  audio.addEventListener('pause', () => { if (audio.paused) finish(); });
  audio.addEventListener('error', () => { if (audio.error) finish(); });

  function playPending() {
    if (!pending || speaking) return;
    const request = pending;
    pending = null;
    const { character, button } = request;
    if (!soundEnabled() || document.hidden || !button.isConnected ||
        button.closest('dialog') !== document.querySelector('dialog[open]')) return;
    finish();
    playing = request;
    audio.src = greetings[character].href;
    audio.playbackRate = 1;
    void audio.play().then(() => {
      if (playing === request) button.classList.add('pika-talking');
    }).catch(() => { if (playing === request) finish(); });
  }

  function greet(character, button) {
    clearHighlight();
    highlighted = button;
    // Restart a hop even when the same character gets two quick taps.
    void button.offsetWidth;
    button.classList.add('is-greeting');
    highlightTimer = setTimeout(clearHighlight, 650);
    if (!soundEnabled()) return;
    pending = { character, button };
    playPending();
  }

  function narrationStatus(status) {
    speaking = status === 'speaking';
    if (speaking) {
      // Narrator has already paused the media element and is about to start its clip.
      finish();
    } else if (pending) {
      // say() briefly emits idle while switching from one instruction to the next.
      queueMicrotask(playPending);
    }
  }
  return { greet, stop, narrationStatus };
}
