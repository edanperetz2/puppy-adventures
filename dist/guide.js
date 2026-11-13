import { uiIcon } from './art.js';

// The header must also work while an older installed game still serves art.js.
export const GUIDE_ICON = '<svg class="ui-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true"><g stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 6Q7 2 2 5V20Q7 17 12 21Q17 17 22 20V5Q17 2 12 6ZM12 6V21M5 8Q7 7 9 9M15 9Q17 7 19 8M5 12Q7 11 9 13M15 13Q17 11 19 12"/></g></svg>';

export const GUIDE_IMAGE = Object.freeze({ src: './assets/game-guide-six.webp', width: 2172, height: 1448, panelWidth: 1086 });
const gameNames = ['גינת המילים', 'סדנת המילים', 'סיפור שמשחקים', 'חברים מהמסך', 'סטודיו האותיות', 'מפרץ האנגלית', 'אנגלית בצעדים קטנים', 'מגלים צלילים באנגלית', 'סדנת המספרים', 'מעבדת המספרים', 'גן השעונים'];
let guide = null;

function createGuide() {
  const dialog = document.createElement('dialog');
  dialog.id = 'game-guide';
  dialog.className = 'game-guide';
  dialog.dir = 'rtl';
  dialog.setAttribute('aria-labelledby', 'game-guide-title');
  dialog.setAttribute('aria-describedby', 'game-guide-help');
  dialog.innerHTML = `<div class="guide-heading"><div><h2 id="game-guide-title">מדריך המשחק</h2><p id="game-guide-help">עברית מימין, אנגלית משמאל. אפשר להגדיל ולגלול לכל הכיוונים.</p></div><button class="circle-button" data-guide="close" aria-label="סגירת המדריך וחזרה למשחק">${uiIcon('close')}</button></div>
    <div class="guide-tools" aria-label="תצוגת המדריך"><div class="guide-languages"><button data-guide="he">עברית</button><button data-guide="en" lang="en" dir="ltr">English</button><button data-guide="fit">התמונה כולה</button></div><div class="guide-zoom"><button data-guide="out" aria-label="הקטנת התמונה">−</button><output aria-live="polite" aria-label="רמת הגדלה" dir="ltr">100%</output><button data-guide="in" aria-label="הגדלת התמונה">+</button></div></div>
    <div class="guide-viewport" tabindex="0" role="region" aria-label="תמונת המדריך. אפשר לגלול או להשתמש במקשי החצים." dir="ltr"><img class="guide-image" src="${GUIDE_IMAGE.src}" width="${GUIDE_IMAGE.width}" height="${GUIDE_IMAGE.height}" alt="מפת כל משחקי חבורת ההרפתקאות: עברית מימין על רקע קרם, אנגלית משמאל על רקע תכלת. ${gameNames.join(', ')}. כולל אלבום מדבקות, פארק אישי, פרופילי ילדים, הגדרות להורים ושמירת התקדמות."><p class="guide-load-error" hidden>התמונה לא נטענה. אפשר לנסות שוב כשיש חיבור לאינטרנט.</p></div>
    <div class="guide-bottom"><a href="${GUIDE_IMAGE.src}" download="puppy-adventures-guide.webp">להורדת המדריך</a><button data-guide="close">חזרה למשחק</button></div>`;
  document.body.append(dialog);
  const viewport = dialog.querySelector('.guide-viewport');
  const image = dialog.querySelector('.guide-image');
  const zoomReadout = dialog.querySelector('output');
  let scale = 1, opener = null, previousOverflow = '', resizeObserver;

  function setScale(next, keepCentre = true) {
    const centreX = (viewport.scrollLeft + viewport.clientWidth / 2) / scale;
    const centreY = (viewport.scrollTop + viewport.clientHeight / 2) / scale;
    scale = Math.max(0.1, Math.min(3, next));
    image.style.width = `${Math.round(GUIDE_IMAGE.width * scale)}px`;
    image.style.height = `${Math.round(GUIDE_IMAGE.height * scale)}px`;
    zoomReadout.value = `${Math.round(scale * 100)}%`;
    dialog.querySelector('[data-guide="out"]').disabled = scale <= 0.1;
    dialog.querySelector('[data-guide="in"]').disabled = scale >= 3;
    if (keepCentre) {
      viewport.scrollLeft = centreX * scale - viewport.clientWidth / 2;
      viewport.scrollTop = centreY * scale - viewport.clientHeight / 2;
    }
  }

  function showLanguage(language) {
    setScale(Math.max(1, Math.min(1.5, viewport.clientWidth / GUIDE_IMAGE.panelWidth)), false);
    viewport.scrollTop = 0;
    viewport.scrollLeft = language === 'he' ? viewport.scrollWidth - viewport.clientWidth : 0;
  }

  function fit() {
    setScale(Math.min(1, (viewport.clientWidth - 2) / GUIDE_IMAGE.width, (viewport.clientHeight - 2) / GUIDE_IMAGE.height), false);
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;
  }

  dialog.addEventListener('click', event => {
    const action = event.target.closest('[data-guide]')?.dataset.guide;
    if (action === 'close') dialog.close();
    else if (action === 'he' || action === 'en') showLanguage(action);
    else if (action === 'fit') fit();
    else if (action === 'in') setScale(scale * 1.3);
    else if (action === 'out') setScale(scale / 1.3);
    else if (event.target === dialog) {
      const r = dialog.getBoundingClientRect();
      if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
    }
  });
  dialog.addEventListener('close', () => {
    document.body.style.overflow = previousOverflow;
    resizeObserver?.disconnect();
    if (opener?.isConnected) opener.focus({ preventScroll: true });
  });
  image.addEventListener('error', () => { dialog.querySelector('.guide-load-error').hidden = false; });
  image.addEventListener('load', () => { dialog.querySelector('.guide-load-error').hidden = true; });

  return {
    open(button) {
      if (dialog.open) return;
      opener = button || document.activeElement;
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';
      if (viewport.clientWidth < 700) showLanguage('he'); else fit();
      let oldWidth = viewport.clientWidth;
      resizeObserver = new ResizeObserver(() => {
        if (viewport.clientWidth !== oldWidth) {
          oldWidth = viewport.clientWidth;
          // Keep the chosen zoom and let normal scrolling handle rotation/resizing.
          setScale(scale);
        }
      });
      resizeObserver.observe(viewport);
      dialog.querySelector('[data-guide="close"]').focus({ preventScroll: true });
    }
  };
}

export function openGameGuide(opener) {
  guide ||= createGuide();
  guide.open(opener);
}
