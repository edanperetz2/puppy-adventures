import { VOICE_NAMES, findVoiceName, addressText } from './profile-content.js';
import { cleanName, escapeHtml as esc, recordingData } from './profiles.js';
import { profileSpeech } from './profile-speech.js';
import { Narrator } from './audio.js';
import { pup, uiIcon } from './art.js';

export function profilePanel(profiles) {
  return `<section class="child-panel"><h3>ההרפתקה של ${esc(profiles.active.name)}</h3><p>לכל ילד וילדה יש מדבקות, תרגול וקוד שיתוף משלהם. הוספת ילד או ילדה פותחת התחלה חדשה ונפרדת.</p><div class="child-list">${profiles.profiles.map((profile, i) => `<button type="button" class="child-card ${profile.id === profiles.activeId ? 'selected' : ''}" data-child-select="${profile.id}" ${profile.id === profiles.activeId ? 'aria-current="true"' : ''}>${pup(['luli', 'bobi', 'tofi'][i % 3])}<span>${esc(profile.name)}</span><small>${profile.id === profiles.activeId ? 'משחקים עכשיו' : 'מעבר להרפתקה'}</small></button>`).join('')}</div><div class="child-panel-actions"><button type="button" class="secondary-button" data-child-edit>${uiIcon('pencil')} שינוי שם וקול</button><button type="button" class="primary-button" data-child-add>הוספת ילד או ילדה ${uiIcon('plus')}</button></div><p class="parent-note">משתפים עם חברים את כתובת המשחק הרגילה. את קוד האלבום משתפים רק בין המכשירים של אותו ילד או ילדה.</p></section>`;
}

export function mountProfileForm(root, { profiles, editing = null, invitation = null, onDone, onCancel }) {
  const original = editing || { name: invitation?.name || '', address: invitation?.address || 'female', voice: invitation?.voice || null };
  let recording = editing ? recordingData(profiles.storageFor(editing.id).getItem('name-recording')) : null;
  let recordedFor = original.name, recorder = null, stream = null, timer = null, disposed = false, encoding = false;
  const preview = new Narrator(status => {
    if (status === 'unavailable') message('הברכה לא נשמעה. אפשר לנסות שוב בלחיצה על הרמקול.');
  });
  root.innerHTML = `<section class="profile-editor"><div class="profile-editor-pup">${pup('luli')}</div><span class="section-kicker">הרפתקה אישית לכל אחד ואחת</span><h${editing ? '3' : '2'} id="profile-title">${editing ? `השם והקול של ${esc(editing.name)}` : 'למי נכין הרפתקה?'}</h${editing ? '3' : '2'}><p>${editing ? 'שינוי הפרטים שומר על אותו אלבום ועל כל ההתקדמות.' : 'השם יופיע במשחק, והחברים יברכו אותו בקול.'}</p><form id="child-form"><label class="profile-field" for="child-name"><span>שם פרטי</span><input id="child-name" name="name" dir="auto" type="text" maxlength="45" autocomplete="off" placeholder="למשל: יולי או דביר" required value="${esc(original.name)}"></label><label class="profile-field" for="child-address"><span>איך פונים במשחק?</span><select id="child-address" name="address"><option value="female" ${original.address === 'female' ? 'selected' : ''}>בלשון נקבה · בואי נשחק</option><option value="male" ${original.address === 'male' ? 'selected' : ''}>בלשון זכר · בוא נשחק</option></select></label><label class="profile-field" for="child-voice"><span>הגיית השם בקול</span><select id="child-voice" name="voice"><option value="auto">לפי השם שהוזן</option>${VOICE_NAMES.map(name => `<option value="${name.id}" ${editing?.voice === name.id && findVoiceName(editing.name)?.id !== name.id ? 'selected' : ''}>${name.name}</option>`).join('')}</select></label><p id="name-voice-note" class="profile-voice-note" role="status"></p><div class="profile-voice-buttons"><button type="button" class="secondary-button" data-name-preview>${uiIcon('sound')} שמיעת הברכה</button><button type="button" class="secondary-button" data-name-record>הקלטת השם בקול שלכם</button><button type="button" class="text-button" data-name-clear hidden>הסרת ההקלטה</button></div><p class="profile-record-note">אפשר להקליט רק את השם, עד ארבע שניות. המיקרופון נפתח רק בלחיצה שלכם. ההקלטה נשמרת במכשיר הזה בלבד; במכשיר נוסף אפשר להקליט שוב.</p><p id="profile-message" role="status" class="profile-message"></p><div class="profile-submit"><button type="submit" class="primary-button">${editing ? 'שמירת השם והקול' : invitation ? 'יצירת פרופיל לחיבור האלבום' : 'מתחילים לשחק'} ${uiIcon('arrow')}</button>${onCancel ? '<button type="button" class="text-button" data-child-cancel>ביטול וחזרה</button>' : ''}</div></form></section>`;
  const form = root.querySelector('form'), recordButton = root.querySelector('[data-name-record]');
  const lifetime = new AbortController();
  if (original.voice && original.voice !== findVoiceName(original.name)?.id) form.elements.voice.value = original.voice;
  const message = text => { if (!disposed) root.querySelector('#profile-message').textContent = text; };
  function candidate() {
    const name = cleanName(form.elements.name.value);
    const voice = form.elements.voice.value === 'auto' ? findVoiceName(name)?.id || null : form.elements.voice.value;
    return { name, address: form.elements.address.value, voice };
  }
  function voiceNote() {
    const current = candidate();
    root.querySelector('#name-voice-note').textContent = recording ? 'הברכה תשלב את השם בהקלטה שלכם עם הקול של Ava.' : current.voice ? `השם ייקרא בקול של Ava: ${VOICE_NAMES.find(name => name.id === current.voice).name}. מומלץ להקשיב ולוודא שההגייה מתאימה.` : 'אפשר להקליט את השם שלכם כדי לשמוע אותו מיד. עד אז תושמע ברכה כללית.';
    root.querySelector('[data-name-clear]').hidden = !recording;
  }
  function controls(busy) {
    form.querySelector('[type=submit]').disabled = busy;
    root.querySelector('[data-name-preview]').disabled = busy;
    root.querySelector('[data-name-clear]').disabled = busy;
    form.elements.name.disabled = busy;
    form.elements.voice.disabled = busy;
    form.elements.address.disabled = busy;
  }
  function stopTracks() { stream?.getTracks().forEach(track => track.stop()); stream = null; }
  function destroy() {
    disposed = true; lifetime.abort(); clearTimeout(timer); preview.stop();
    if (recorder?.state === 'recording') recorder.stop();
    stopTracks();
  }
  for (const input of form.querySelectorAll('input,select')) input.addEventListener('input', () => {
    preview.stop();
    if (recording && cleanName(form.elements.name.value) !== cleanName(recordedFor)) recording = null;
    voiceNote();
  });
  root.querySelector('[data-name-preview]').onclick = () => {
    const current = candidate();
    if (!current.name) { message('הזינו שם פרטי, בעברית או באנגלית, עד 30 תווים.'); return; }
    preview.resolveKey = profileSpeech(current, recording);
    message('מקשיבים לברכה…');
    void preview.say('welcome');
  };
  root.querySelector('[data-name-clear]').onclick = () => { preview.stop(); recording = null; message('ההקלטה הוסרה מהטופס. השינוי יישמר בלחיצה על שמירה.'); voiceNote(); };
  recordButton.onclick = async () => {
    preview.stop();
    if (recorder?.state === 'recording') { recorder.stop(); return; }
    if (encoding) return;
    if (!candidate().name) { message('קודם הזינו שם, ואז הקליטו אותו.'); return; }
    if (!navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder) { message('הדפדפן הזה אינו תומך בהקלטה. אפשר לבחור הגייה מהרשימה, או לפתוח בדפדפן מעודכן.'); return; }
    controls(true); recordButton.disabled = true;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposed) { stopTracks(); return; }
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const parts = [];
      recorder.ondataavailable = event => { if (event.data.size) parts.push(event.data); };
      recorder.onerror = () => { clearTimeout(timer); stopTracks(); if (disposed) return; controls(false); recordButton.disabled = false; recordButton.textContent = 'הקלטת השם בקול שלכם'; message('לא הצלחנו להקליט. אפשר לנסות שוב.'); };
      recorder.onstop = () => {
        clearTimeout(timer); stopTracks(); if (disposed) return;
        encoding = true; recordButton.disabled = true; recordButton.textContent = 'הקלטת השם בקול שלכם';
        const reader = new FileReader();
        reader.onload = () => {
          if (disposed) return;
          const value = recordingData(reader.result);
          if (value) { recording = value; recordedFor = form.elements.name.value; message('השם הוקלט. הקשיבו לברכה לפני השמירה.'); }
          else message('ההקלטה לא נשמרה. נסו הקלטה קצרה יותר.');
          encoding = false; controls(false); recordButton.disabled = false; voiceNote();
        };
        reader.onerror = () => { if (disposed) return; encoding = false; controls(false); recordButton.disabled = false; message('לא הצלחנו לקרוא את ההקלטה. אפשר לנסות שוב.'); };
        reader.readAsDataURL(new Blob(parts, { type: recorder.mimeType || mimeType || 'audio/webm' }));
      };
      recorder.start(); recordButton.disabled = false; recordButton.textContent = 'סיום ההקלטה'; message('מקליטים עכשיו: אמרו רק את השם…');
      timer = setTimeout(() => { if (recorder?.state === 'recording') recorder.stop(); }, 4000);
    } catch {
      stopTracks(); if (disposed) return; controls(false); recordButton.disabled = false;
      message('המיקרופון לא נפתח. אפשר לאפשר אותו בהגדרות הדפדפן, לבחור שם מהרשימה, או להמשיך עם ברכה כללית.');
    }
  };
  form.onsubmit = event => {
    event.preventDefault();
    if (recorder?.state === 'recording' || encoding) return;
    const details = candidate();
    if (!details.name) { message('הזינו שם פרטי בעברית או באנגלית, עד 30 תווים.'); return; }
    try {
      const result = editing ? profiles.update(editing.id, details, recording) : profiles.add({ ...details, pendingAlbum: invitation?.code }, recording);
      destroy(); onDone(result);
    } catch (error) {
      message(error.message === 'profile_limit' ? 'אפשר לשמור עד 20 ילדים במכשיר הזה.' : 'הדפדפן לא הצליח לשמור את הפרטים. נסו שוב בחלון רגיל. ההתקדמות הקיימת נשמרה.');
    }
  };
  root.querySelector('[data-child-cancel]')?.addEventListener('click', () => { destroy(); onCancel(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    preview.stop();
    if (recorder?.state === 'recording') recorder.stop();
  }, { signal: lifetime.signal });
  voiceNote();
  return { destroy };
}

const protectedText = '.target-word,.reading-stage-samples,.character-name,.character-word,.letter-familiar,.letter-book-form,[data-learning-text],.profile-editor,.child-panel,#family-panel h3';
export function personalizeUi(root, profile) {
  if (!profile) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node.parentElement.closest(protectedText)) continue;
    const before = node.nodeValue;
    // Rendered instructions only; names, inputs and curriculum stay intact.
    const next = addressText(before, profile.address);
    if (next !== before) node.nodeValue = next;
  }
  for (const element of root.querySelectorAll('[aria-label]')) {
    if (!element.closest(protectedText) && !element.matches('.answer-button,.character-roster-item')) {
      const before = element.getAttribute('aria-label'), next = addressText(before, profile.address);
      if (before !== next) element.setAttribute('aria-label', next);
    }
  }
}
