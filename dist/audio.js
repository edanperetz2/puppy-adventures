import { CLIPS } from './content.js?v=2.7.1-pepper';

export class Narrator {
  constructor(onStatus = () => {}) {
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.sequence = 0;
    this.enabled = true;
    this.onStatus = onStatus;
    this.release = null;
    this.context = null;
    this.speaking = false;
    this.pendingChime = null;
    this.chimeOutput = null;
    this.resolveKey = key => [key];
  }

  stop() {
    this.sequence++;
    this.speaking = false;
    this.pendingChime = null;
    this.chimeOutput?.disconnect();
    this.chimeOutput = null;
    this.audio.pause();
    this.audio.onended = null;
    this.audio.onerror = null;
    if (this.release) this.release(false);
    this.release = null;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    this.onStatus('idle');
  }

  async say(keys, { slow = false, quietFailure = false, onClipEnd = () => {} } = {}) {
    // Some activities request their success sound just before starting the praise.
    const sameTurnChime = this.pendingChime?.fresh ? this.pendingChime : null;
    this.stop();
    if (!this.enabled) return false;
    this.pendingChime = sameTurnChime;
    this.speaking = true;
    const sequence = this.sequence;
    this.onStatus('speaking');
    for (const logicalKey of Array.isArray(keys) ? keys : [keys]) {
      for (const key of this.resolveKey(logicalKey)) {
        if (sequence !== this.sequence || !this.enabled) return false;
        const ok = await this.play(key, slow, sequence);
        if (sequence !== this.sequence) return false;
        if (!ok) {
          const fallback = await this.deviceVoice(key, slow, sequence);
          if (sequence !== this.sequence) return false;
          if (!fallback) {
            this.speaking = false;
            this.pendingChime = null;
            this.onStatus(quietFailure ? 'idle' : 'unavailable');
            return false;
          }
        }
      }
      onClipEnd(logicalKey);
    }
    if (sequence !== this.sequence) return false;
    this.speaking = false;
    this.onStatus('idle');
    this.playPendingChime();
    return true;
  }

  play(key, slow, sequence) {
    const clip = typeof key === 'string' ? CLIPS[key] :
      typeof key?.source === 'string' && key.source.startsWith('blob:') ? key : null;
    if (!clip) return Promise.resolve(false);
    return new Promise(resolve => {
      let finished = false;
      let watchdog;
      const finish = value => {
        if (finished) return;
        finished = true;
        clearTimeout(watchdog);
        this.audio.defaultPlaybackRate = 1;
        if (this.release === finish) this.release = null;
        resolve(value);
      };
      this.release = finish;
      this.audio.onended = () => finish(true);
      this.audio.onerror = () => finish(false);
      // Loading a new source resets the playback rate to the element's default.
      this.audio.defaultPlaybackRate = slow ? (clip.lang === 'he-IL' ? 0.92 : 0.82) : 1;
      this.audio.src = clip.source || `./assets/voice/${key}.mp3`;
      this.audio.playbackRate = this.audio.defaultPlaybackRate;
      watchdog = setTimeout(() => {
        if (sequence === this.sequence) this.audio.pause();
        finish(false);
      }, 30000);
      // Invoked immediately from the child's tap; reuse the same media element.
      this.audio.play().catch(() => finish(false));
    });
  }

  deviceVoice(key, slow, sequence) {
    if (!('speechSynthesis' in window) || !CLIPS[key]) return Promise.resolve(false);
    const clip = CLIPS[key];
    // Hebrew uses the reviewed recordings on every device. A device's TTS
    // would guess pronunciation again and could undo the reviewed readings.
    if (clip.lang === 'he-IL') return Promise.resolve(false);
    const voice = window.speechSynthesis.getVoices().find(v => v.lang.toLowerCase().startsWith(clip.lang.slice(0, 2)));
    // Never substitute a voice for another language.
    if (!voice) return Promise.resolve(false);
    return new Promise(resolve => {
      let finished = false;
      let watchdog;
      const finish = value => {
        if (finished) return;
        finished = true;
        clearTimeout(watchdog);
        if (this.release === finish) this.release = null;
        resolve(value);
      };
      const utterance = new SpeechSynthesisUtterance(clip.text);
      utterance.lang = clip.lang;
      utterance.voice = voice;
      utterance.rate = slow ? 0.65 : 0.85;
      utterance.onend = () => finish(true);
      utterance.onerror = () => finish(false);
      this.release = finish;
      watchdog = setTimeout(() => {
        if (sequence === this.sequence) window.speechSynthesis.cancel();
        finish(false);
      }, 30000);
      window.speechSynthesis.speak(utterance);
    });
  }

  chime() {
    if (!this.enabled) return;
    try {
      this.context ||= new (window.AudioContext || window.webkitAudioContext)();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { return; }
    const request = this.pendingChime = { fresh: true };
    queueMicrotask(() => {
      request.fresh = false;
      if (this.pendingChime === request && !this.speaking) this.playPendingChime();
    });
  }

  playPendingChime() {
    if (!this.pendingChime || !this.enabled) return;
    this.pendingChime = null;
    try {
      this.chimeOutput?.disconnect();
      const output = this.chimeOutput = this.context.createGain();
      output.connect(this.context.destination);
      const now = this.context.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, i) => {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        gain.gain.setValueAtTime(0, now + i * 0.1);
        gain.gain.linearRampToValueAtTime(0.07, now + i * 0.1 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.35);
        oscillator.connect(gain).connect(output);
        if (i === 2) oscillator.onended = () => {
          if (this.chimeOutput === output) {
            output.disconnect();
            this.chimeOutput = null;
          }
        };
        oscillator.start(now + i * 0.1);
        oscillator.stop(now + i * 0.1 + 0.4);
      });
    } catch { /* Narration remains available if Web Audio is unavailable. */ }
  }
}
