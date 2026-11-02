import { newCode, normalizeCode, formatCode } from './sync.js';
import { invitationLink, escapeHtml } from './profiles.js';

const STATUS = {
  local: 'האלבום נשמר במכשיר הזה',
  synced: 'האלבום אישר את השמירה · מכשירים נוספים יתעדכנו בחיבור הבא',
  syncing: 'מעדכנים את האלבום…',
  pending: 'ההתקדמות שמורה כאן ותתעדכן כשיהיה חיבור',
  offline: 'מוצג האלבום האחרון שנשמר. נעדכן כשיהיה חיבור',
  'storage-error': 'הדפדפן לא מאפשר שמירה. השאירו את המשחק פתוח עד לסנכרון',
};

export function updateFamilyStatus(album) {
  const element = document.querySelector('#sync-status');
  if (!element) return;
  element.textContent = STATUS[album.status] || STATUS.pending;
  element.classList.toggle('pending', ['pending', 'offline', 'storage-error'].includes(album.status));
}

export function mountFamilyPanel(element, { album, getLocalProgress, pendingCode, profile }) {
  if (!element) return;
  element.className = 'album-sync';
  element.innerHTML = `<h3>האלבום של ${escapeHtml(profile?.name || 'הילד או הילדה')} בכל המכשירים</h3><p>אותן מדבקות ואותה התקדמות בטלפון, בטאבלט ובמחשב. לכל ילד וילדה קוד נפרד. מחברים כל מכשיר פעם אחת, בעזרת הקוד המשפחתי.</p><p class="sync-install-note"><b>באייפד: Safari והקיצור במסך הבית מתחברים בנפרד.</b> מתחילים בגרסה שבה המדבקות כבר מופיעות, יוצרים שם אלבום משפחתי, ומעתיקים את הקוד. אחר כך פותחים את הקיצור במסך הבית ומחברים אותו לאותו קוד. המדבקות הקיימות נשמרות ומצטרפות לאלבום.</p>
    ${album.linked ? `<p id="sync-status" class="sync-status" role="status"></p><label for="family-code" class="section-kicker">הקוד המשפחתי שלכם</label><input id="family-code" class="pair-input" type="password" readonly autocomplete="off" aria-label="הקוד המשפחתי שלכם"><div class="sync-actions"><button type="button" class="secondary-button" data-sync="copy-code">העתקת הקוד</button><button type="button" class="secondary-button" data-sync="copy-link">העתקת קישור למכשיר נוסף</button><button type="button" class="text-button" data-sync="show-code">הצגת הקוד</button><button type="button" class="text-button" data-sync="refresh">עדכון עכשיו</button></div><p class="sync-note">שמרו את הקוד בתוך המשפחה. הקוד מאפשר גישה לאלבום. כשחוזרים למשחק או מסיימים הרפתקה, האלבום מתעדכן אוטומטית. הגדרות הקול והקושי נשארות נפרדות בכל מכשיר.</p>`
    : `<div class="sync-actions"><button type="button" class="primary-button" data-sync="create">יצירת אלבום משפחתי</button></div><form id="join-album"><label class="section-kicker" for="join-code">כבר יש אלבום במכשיר אחר? הזינו את הקוד</label><input id="join-code" name="code" class="pair-input" type="text" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" required aria-label="קוד לחיבור לאלבום"><div class="sync-actions"><button type="submit" class="secondary-button">חיבור לאלבום הקיים</button></div></form><p class="sync-note">ההתקדמות של הפרופיל הזה תצטרף לאלבום. ודאו שזה הקוד של אותו ילד או ילדה. אין צורך באימייל או בחשבון לילדים.</p>`}
    <p id="pair-message" role="status" class="sync-status"></p>`;
  updateFamilyStatus(album);

  async function pair(code, create) {
    const buttons = [...element.querySelectorAll('button')];
    const message = element.querySelector('#pair-message');
    buttons.forEach(button => { button.disabled = true; });
    message.classList.remove('pair-error');
    message.textContent = 'מחברים את האלבום…';
    try {
      await album.link(code, getLocalProgress(), { create });
      mountFamilyPanel(element, { album, getLocalProgress, profile });
      element.querySelector('#pair-message').textContent = 'האלבום מחובר! אפשר להמשיך לשחק.';
    } catch (error) {
      console.warn('Family album connection:', error.name, error.message);
      message.classList.add('pair-error');
      message.textContent = error.message === 'invalid_code' ? 'הקוד לא שלם. העתיקו את כל הקוד מהמכשיר הראשון.' : error.message === 'album_not_found' ? 'לא מצאנו את האלבום. בדקו שהקוד הועתק נכון.' : error.message === 'storage_unavailable' ? 'הדפדפן לא מאפשר שמירה. נסו לפתוח את המשחק בחלון רגיל.' : 'לא הצלחנו להתחבר כרגע. ההתקדמות כאן שמורה, ואפשר לנסות שוב כשיהיה חיבור.';
      buttons.forEach(button => { button.disabled = false; });
    }
  }

  if (!album.linked) {
    if (pendingCode) element.querySelector('#join-code').value = formatCode(pendingCode);
    element.querySelector('[data-sync="create"]').onclick = () => pair(newCode(), true);
    element.querySelector('#join-album').onsubmit = event => { event.preventDefault(); void pair(normalizeCode(new FormData(event.target).get('code')), false); };
    return;
  }

  const input = element.querySelector('#family-code');
  input.value = formatCode(album.code);
  element.querySelector('[data-sync="copy-code"]').onclick = async () => {
    try {
      await navigator.clipboard.writeText(formatCode(album.code));
      element.querySelector('#pair-message').textContent = 'הקוד הועתק. פתחו את המשחק ממסך הבית, היכנסו לפינת ההורים והדביקו אותו בחיבור לאלבום הקיים.';
    } catch {
      input.type = 'text'; input.focus(); input.select();
      element.querySelector('#pair-message').textContent = 'הקוד מסומן. אפשר להעתיק אותו ידנית ולחבר את המשחק ממסך הבית.';
    }
  };
  element.querySelector('[data-sync="show-code"]').onclick = event => {
    input.type = input.type === 'password' ? 'text' : 'password';
    event.target.textContent = input.type === 'password' ? 'הצגת הקוד' : 'הסתרת הקוד';
  };
  element.querySelector('[data-sync="refresh"]').onclick = () => album.flush();
  element.querySelector('[data-sync="copy-link"]').onclick = async () => {
    const url = invitationLink(location.origin, location.pathname, album.code, profile);
    try {
      await navigator.clipboard.writeText(url);
      element.querySelector('#pair-message').textContent = 'הקישור הועתק. פתחו אותו במכשיר הבא וחברו את האלבום בפינת ההורים.';
    } catch {
      input.type = 'text'; input.focus(); input.select();
      element.querySelector('#pair-message').textContent = 'אפשר להעתיק ידנית את הקוד המסומן ולהזין אותו במכשיר הבא.';
    }
  };
}
