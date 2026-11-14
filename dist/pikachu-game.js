import { choiceCount, SESSION_LENGTH } from './adventure.js?v=2.2.2-six';
import { answerShuffler, shuffle } from './answer-order.js';
import { art, uiIcon } from './art.js';
import { WORDS } from './reading.js';

export const PIKACHU_CALL_URL = new URL('./assets/audio/pikachu-call.mp3', import.meta.url);

export const PIKACHU_TITLE = 'מְחַפְּשׂוֹת עִם פִּיקָאצ׳וּ';
const FINISH = 'כָּל הַכָּבוֹד! מָצָאתְ אֶת כָּל הַתְּמוּנוֹת';
const words = new Map(WORDS.map(word => [word.id, word]));
const objects = ['ball', 'tree', 'fish', 'flower', 'apple', 'dog', 'sun', 'duck', 'rabbit', 'butterfly', 'cat', 'grapes'];
const colors = ['ball', 'flower', 'butterfly', 'car'].map(item => ['red', 'blue', 'yellow', 'green'].map(color => `color-${item}-${color}`));
const quantities = ['apple', 'star', 'ball', 'flower', 'butterfly', 'heart'].map(item => [2, 3, 4].map(count => `count-${item}-${count}`));
const positions = [
  ...['ball', 'book', 'mug'].map(item => ['on', 'under', 'near'].map(place => `place-${item}-${place}`)),
  ...['apple', 'pencil'].map(item => ['in', 'on', 'near'].map(place => `place-${item}-${place}`)),
];

export function pikachuQuestions(rng = Math.random, previous = []) {
  const used = new Set();
  const order = answerShuffler(rng);
  const recentlyUsed = new Set(previous.map(question => question.target));
  const pick = (pool, eligible) => {
    const choices = shuffle(pool.filter(id => !used.has(id) && eligible.has(id)), rng);
    return choices.find(id => !recentlyUsed.has(id)) || choices[0];
  };
  return [objects, objects, objects, shuffle(colors, rng)[0], shuffle(quantities, rng)[0], shuffle(positions, rng)[0]].map((pool, index) => {
    const first = index === 0;
    const eligible = new Set(first ? objects.slice(0, 4) : pool);
    const target = pick(pool, eligible);
    used.add(target);
    const distractors = shuffle(pool.filter(id => id !== target), rng).slice(0, choiceCount(index) - 1);
    return { target, choices: order([target, ...distractors], target, id => id) };
  });
}

export function pikachuImage(className) {
  return `<img class="${className}" src="./assets/home-pikachu.png" alt="" width="215" height="215" draggable="false">`;
}

export function mountPikachu(root, { nikud, motion, sound }) {
  const events = new AbortController();
  const animations = new Set();
  const call = new Audio();
  call.preload = 'none';
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const allowMotion = () => motion() && !reducedMotion.matches && typeof Element.prototype.animate === 'function';
  let questions = pikachuQuestions(), index = 0, finished = false, solved = false, feedback = '';
  const tried = new Set();
  const question = () => questions[index];
  const label = text => nikud() ? text : text.replace(/[\u0591-\u05bd\u05bf-\u05c7]/gu, '');

  root.innerHTML = `<div class="pika-top">
    <button type="button" class="text-button" data-action="home">${uiIcon('home')} לַבַּיִת</button>
    <span class="pika-step"></span>
  </div>
  <section class="pika-board" aria-labelledby="pika-title">
    <div class="pika-heading">
      <h1 id="pika-title" tabindex="-1">${PIKACHU_TITLE}</h1>
    </div>
    <div class="pika-stage">
      <span class="pika-shadow" aria-hidden="true"></span>
      <button type="button" class="pika-character" data-pika="greet" aria-label="פיקאצ׳ו">${pikachuImage('pika-face')}${uiIcon('sound')}</button>
      <span class="pika-cheer" aria-hidden="true" hidden>✦</span>
      <span class="pika-cheer pika-cheer-second" aria-hidden="true" hidden>✦</span>
      <div class="pika-flying" aria-hidden="true"></div>
    </div>
    <p class="pika-word pika-clue" id="pika-word" tabindex="-1"></p>
    <div class="step-track pika-progress" aria-hidden="true"></div>
    <div class="pika-choices" role="group" aria-labelledby="pika-word"></div>
    <p class="pika-feedback" role="status"></p>
    <div class="pika-actions">
      <button type="button" class="primary-button" data-pika="next" hidden></button>
      <button type="button" class="primary-button" data-pika="again" hidden>עוֹד סִיבּוּב ${uiIcon('again')}</button>
      <button type="button" class="text-button" data-action="home" hidden>לְבֵית הַחֲבֵרִים</button>
    </div>
  </section>`;

  const step = root.querySelector('.pika-step');
  const stage = root.querySelector('.pika-stage');
  const title = root.querySelector('#pika-title');
  const character = root.querySelector('.pika-character');
  const face = character.querySelector('img');
  const word = root.querySelector('.pika-word');
  const track = root.querySelector('.pika-progress');
  const choices = root.querySelector('.pika-choices');
  const message = root.querySelector('.pika-feedback');
  const next = root.querySelector('[data-pika="next"]');
  const again = root.querySelector('[data-pika="again"]');
  const home = root.querySelector('.pika-actions [data-action="home"]');
  const cheers = [...root.querySelectorAll('.pika-cheer')];
  const flyer = root.querySelector('.pika-flying');
  const soundIcon = character.querySelector('.ui-icon');

  function playMotion(element, frames, options) {
    const animation = element.animate(frames, options);
    animations.add(animation);
    animation.finished.then(() => animations.delete(animation), () => animations.delete(animation));
    return animation.finished.catch(() => {});
  }

  function clearMotion() {
    for (const animation of animations) animation.cancel();
    animations.clear();
    flyer.replaceChildren();
  }

  function hop(big = false) {
    if (!allowMotion()) return;
    const height = big ? 32 : 17;
    for (const animation of face.getAnimations()) animation.cancel();
    void playMotion(face, [
      { transform: 'none' }, { transform: 'scale(1.04, .94)', offset: .14 },
      { transform: `translateY(-${height}px) rotate(-7deg)`, offset: .44 },
      { transform: 'translateY(-6px) rotate(3deg)', offset: .74 }, { transform: 'none' },
    ], { duration: big ? 590 : 370, easing: 'ease-out' });
  }

  function flyPicture(button, id) {
    if (!allowMotion()) return;
    const scene = stage.getBoundingClientRect(), picture = button.getBoundingClientRect(), target = face.getBoundingClientRect();
    const x = picture.left + picture.width / 2 - scene.left, y = picture.top + picture.height / 2 - scene.top;
    const toX = target.left + target.width / 2 - scene.left, toY = target.top + target.height / 2 - scene.top;
    const piece = document.createElement('span');
    piece.innerHTML = art(id);
    flyer.append(piece);
    const at = (left, top, scale) => `translate(${left - 24}px, ${top - 24}px) scale(${scale})`;
    void playMotion(piece, [
      { transform: at(x, y, 1), opacity: .85 },
      { transform: at((x + toX) / 2, Math.min(y, toY) - 12, 1.18), opacity: 1, offset: .6 },
      { transform: at(toX, toY, .38), opacity: 0 },
    ], { duration: 490, easing: 'ease-in-out' }).then(() => piece.remove());
  }

  function greet() {
    hop();
    if (!sound()) return;
    if (!call.src) call.src = PIKACHU_CALL_URL.href;
    else call.currentTime = 0;
    void call.play().catch(() => {});
  }
  const stopped = () => character.classList.remove('pika-talking');
  call.addEventListener('playing', () => character.classList.add('pika-talking'), { signal: events.signal });
  for (const event of ['ended', 'pause', 'error']) call.addEventListener(event, stopped, { signal: events.signal });
  document.addEventListener('visibilitychange', () => { if (document.hidden) call.pause(); }, { signal: events.signal });

  function updateSound() {
    const enabled = sound();
    soundIcon.toggleAttribute('hidden', !enabled);
    character.setAttribute('aria-label', enabled ? 'לשמוע את פיקאצ׳ו' : 'פיקאצ׳ו');
    if (!enabled) call.pause();
  }

  function render() {
    const q = question();
    root.classList.toggle('pika-motion', allowMotion());
    title.textContent = label(finished ? FINISH : PIKACHU_TITLE);
    step.textContent = finished ? '' : `צַעַד ${index + 1} מִתּוֹךְ ${SESSION_LENGTH}`;
    word.hidden = finished;
    word.textContent = label(words.get(q.target).pointed);
    track.innerHTML = questions.map((_, i) => `<span class="step-dot ${finished || i < index || i === index && solved ? 'done' : i === index ? 'current' : ''}">${i + 1}</span>`).join('');
    for (const cheer of cheers) cheer.hidden = !solved && !finished;
    choices.hidden = finished;
    choices.innerHTML = finished ? '' : q.choices.map(id => `<button type="button" data-pika-choice="${id}"
      class="pika-choice${solved && id === q.target ? ' pika-found' : ''}" aria-label="${words.get(id).he}" ${solved || tried.has(id) ? 'disabled' : ''}>
      ${art(id)}${solved && id === q.target ? `<span class="pika-check">${uiIcon('check')}</span>` : ''}
    </button>`).join('');
    const feedbackText = label(feedback);
    if (message.textContent !== feedbackText) message.textContent = feedbackText;
    message.hidden = finished;
    next.hidden = !solved || finished;
    next.innerHTML = `${index === SESSION_LENGTH - 1 ? 'לַסִּיּוּם' : 'הָרֶמֶז הַבָּא'} ${uiIcon('arrow')}`;
    again.hidden = home.hidden = !finished;
  }

  root.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (Object.hasOwn(button.dataset, 'pikaChoice') && !solved && !finished) {
      const id = button.dataset.pikaChoice;
      if (id !== question().target) {
        tried.add(id);
        feedback = 'נַסִּי שׁוּב';
        render();
        choices.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
        return;
      }
      flyPicture(button, id);
      solved = true; feedback = 'כָּל הַכָּבוֹד!';
      render(); hop(true);
      next.focus({ preventScroll: true });
      return;
    }

    if (button.dataset.pika === 'greet') {
      greet();
    } else if (button.dataset.pika === 'next' && solved && !finished) {
      clearMotion();
      if (index === SESSION_LENGTH - 1) {
        finished = true;
        render(); hop(true);
        title.focus({ preventScroll: true });
      } else {
        index++; solved = false; feedback = ''; tried.clear();
        render();
        word.focus({ preventScroll: true });
      }
    } else if (button.dataset.pika === 'again' && finished) {
      clearMotion();
      questions = pikachuQuestions(Math.random, questions);
      index = 0; finished = solved = false; feedback = ''; tried.clear();
      render();
      title.focus({ preventScroll: true });
    }
  }, { signal: events.signal });
  reducedMotion.addEventListener('change', () => { clearMotion(); root.classList.toggle('pika-motion', allowMotion()); }, { signal: events.signal });

  render();
  updateSound();
  return {
    greet, updateSound,
    update() { if (!allowMotion()) clearMotion(); updateSound(); render(); },
    destroy() {
      events.abort(); clearMotion(); call.pause();
      if (call.src) { call.removeAttribute('src'); call.load(); }
    },
  };
}
