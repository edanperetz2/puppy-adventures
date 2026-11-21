import { art } from './art.js';
import { stickerDefinition } from './stickers.js';
import { stickerReactions } from './sticker-reactions.js';
import { STICKER_SOUNDS } from './sticker-sounds.js';

function stickerButton(id, definition, className, number = null) {
  const { motion } = stickerReactions[definition.motif];
  const label = number ? `הפעלה של מדבקה ${number}, ${definition.name}` : `הפעלה של המדבקה, ${definition.name}`;
  return `<button type="button" class="playable-sticker ${className}" data-action="sticker-play" data-sticker="${id}" data-motion="${motion}" aria-label="${label}">
    <span class="sticker-picture" aria-hidden="true">${art(id)}</span><span class="sticker-effect" aria-hidden="true"></span>
    ${number ? numberLabel(number) : ''}
    <span class="sticker-caption" aria-hidden="true"></span></button>`;
}

function numberLabel(number) {
  return `<span class="sticker-index" aria-hidden="true">${String(number).padStart(3, '0')}</span>`;
}

export function albumSticker({ id, number, unlocked }) {
  if (unlocked) return stickerButton(id, stickerDefinition(id), 'sticker unlocked', number);
  return `<div class="sticker locked" role="img" aria-label="מדבקה ${number} מחכה להרפתקה הבאה"><span class="sticker-mystery" aria-hidden="true">?</span>${numberLabel(number)}</div>`;
}

// Completed albums and repeated rewards can show a decorative illustration
// even when no sticker was awarded for this round.
export function rewardSticker(id, fallback, className = '') {
  const definition = stickerDefinition(id);
  return definition ? stickerButton(id, definition, className)
    : `<div class="${className}" aria-hidden="true">${art(fallback)}</div>`;
}

export function createStickerPlayer({ audio, interrupt, status }) {
  let activeButton = null;
  let soundUrl = null;
  let captionTimer;

  function clearReaction() {
    clearTimeout(captionTimer);
    if (activeButton) {
      activeButton.classList.remove('is-reacting');
      activeButton.querySelector('.sticker-caption').textContent = '';
    }
    activeButton = null;
    status.textContent = '';
  }

  function stop() {
    clearReaction();
    // Narration and companion greetings use this same unlocked media element.
    if (soundUrl && audio.src === soundUrl) audio.pause();
    soundUrl = null;
  }

  function play(button, { sound, nikud }) {
    const definition = stickerDefinition(button.dataset.sticker);
    if (!definition) return;
    stop();
    const reaction = stickerReactions[definition.motif];
    const caption = nikud ? reaction.caption : reaction.plain;
    activeButton = button;
    void button.offsetWidth; // Restart the animation on a second tap.
    button.classList.add('is-reacting');
    button.querySelector('.sticker-caption').textContent = caption;
    status.textContent = caption;
    captionTimer = setTimeout(clearReaction, 1500);
    if (sound && reaction.sound) {
      interrupt();
      soundUrl = new URL(STICKER_SOUNDS[reaction.sound], document.baseURI).href;
      audio.src = soundUrl;
      audio.playbackRate = 1;
      // The visual and caption also work if the browser refuses audio.
      void audio.play().catch(() => {});
    }
  }
  return { play, stop };
}
