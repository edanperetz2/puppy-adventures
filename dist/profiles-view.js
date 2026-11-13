import { VOICE_NAMES, findVoiceName, addressText } from './profile-content.js?v=2.2.0-voices';
import { cleanName, escapeHtml as esc, recordingData } from './profiles.js?v=2.2.0-voices';
import { profileSpeech } from './profile-speech.js?v=2.2.0-voices';
import { Narrator } from './audio.js?v=2.2.0-voices';
import { pup, uiIcon } from './art.js';
import { namePhonemes } from './name-voice-phones.js?v=2.2.0-voices';
import { savedNameVoice, stageNameVoice, discardNameVoice, usableNameVoice, nameVoicePlayback, recordingSamples, runNameVoice } from './name-voice.js?v=2.2.0-voices';

export function profilePanel(profiles) {
  return `<section class="child-panel"><h3>ההרפתקה של ${esc(profiles.active.name)}</h3><p>לכל ילד וילדה יש מדבקות, תרגול וקוד שיתוף משלהם. הוספת ילד או ילדה פותחת התחלה חדשה ונפרדת.</p><div class="child-list">${profiles.profiles.map((profile, i) => `<button type="button" class="child-card ${profile.id === profiles.activeId ? 'selected' : ''}" data-child-select="${profile.id}" ${profile.id === profiles.activeId ? 'aria-current="true"' : ''}>${pup(['luli', 'bobi', 'tofi'][i % 3])}<span>${esc(profile.name)}</span><small>${profile.id === profiles.activeId ? 'משחקים עכשיו' : 'מעבר להרפתקה'}</small></button>`).join('')}</div><div class="child-panel-actions"><button type="button" class="secondary-button" data-child-edit>${uiIcon('pencil')} שינוי שם וקול</button><button type="button" class="primary-button" data-child-add>הוספת ילד או ילדה ${uiIcon('plus')}</button></div><p class="parent-note">משתפים עם חברים את כתובת המשחק הרגילה. את קוד האלבום משתפים רק בין המכשירים של אותו ילד או ילדה.</p></section>`;
}

export function mountProfileForm(root, { profiles, editing = null, invitation = null, onDone, onCancel }) {
  const original = editing || { name: invitation?.name || '', address: invitation?.address || 'female', voice: invitation?.voice || null };
  const lifetime = new AbortController();
  let recorder, stream, timer, custom, playback, previousRecording;
  let disposed = false, saved = false;
  let busy = false;
  try {
    if (editing) previousRecording = recordingData(profiles.storageFor(editing.id).getItem('name-recording'));
  } catch { /* The editor also works without an older recording. */ }

  root.innerHTML = `<section class="profile-editor">
    <div class="profile-editor-pup">${pup('luli')}</div><span class="section-kicker">הרפתקה אישית לכל אחד ואחת</span>
    <h${editing ? '3' : '2'} id="profile-title">${editing ? `השם והקול של ${esc(editing.name)}` : 'למי נכין הרפתקה?'}</h${editing ? '3' : '2'}>
    <form id="child-form">
      <label class="profile-field" for="child-name"><span>שם פרטי</span><input id="child-name" name="name" dir="auto" type="text" maxlength="45" autocomplete="off" placeholder="למשל: יולי או דביר" required value="${esc(original.name)}"></label>
      <label class="profile-field" for="child-address"><span>איך פונים במשחק?</span><select id="child-address" name="address"><option value="female" ${original.address === 'female' ? 'selected' : ''}>בלשון נקבה · בואי נשחק</option><option value="male" ${original.address === 'male' ? 'selected' : ''}>בלשון זכר · בוא נשחק</option></select></label>
      <label class="profile-field" for="child-voice"><span>הגיית השם בקול</span><select id="child-voice" name="voice"><option value="auto">לפי השם שהוזן</option>${VOICE_NAMES.map(name => `<option value="${name.id}">${name.name}</option>`).join('')}</select></label>
      <p id="name-voice-note" class="profile-voice-note"></p>
      <div class="profile-voice-buttons">
        <button type="button" class="secondary-button" data-name-preview>${uiIcon('sound')} שמיעת הברכה</button>
        <button type="button" class="secondary-button" data-name-luck hidden>${uiIcon('sound')} שמיעת ״בהצלחה״</button>
        <button type="button" class="secondary-button" data-name-record>הקלטת הגיית השם</button>
        <button type="button" class="secondary-button" data-old-recording hidden>המרת ההקלטה הקיימת</button>
        <button type="button" class="text-button" data-name-manual>כתיבת ההגייה</button>
      </div>
      <p class="profile-record-note">אמרו את השם בלבד, עד ארבע שניות. המשחק מכין את הברכות במכשיר הזה ושומר רק את הברכות של Ava. בפעם הראשונה נדרשת הורדה של עד כ־105 מ״ב.</p>
      <section class="profile-pronunciation" hidden>
        <label class="profile-field" for="name-phonetics"><span>איך אומרים את השם?</span>
          <input id="name-phonetics" type="text" dir="ltr" autocomplete="off" spellcheck="false" maxlength="56" placeholder="sha-kEd" aria-describedby="name-phonetics-help">
        </label>
        <p id="name-phonetics-help" class="profile-record-note">כתבו לפי הצליל באותיות לטיניות. אות גדולה מסמנת את המקום שמדגישים, למשל sha-kEd.</p>
        <div class="profile-voice-buttons"><button type="button" class="secondary-button" data-name-generate>הכנת הברכות בקול של Ava</button><button type="button" class="text-button" data-name-clear>חזרה להגייה הרגילה</button></div>
      </section>
      <p id="profile-message" role="status" class="profile-message"></p>
      <div class="profile-submit"><button type="submit" class="primary-button">${editing ? 'שמירת השם והקול' : invitation ? 'יצירת פרופיל לחיבור האלבום' : 'מתחילים לשחק'} ${uiIcon('arrow')}</button>${onCancel ? '<button type="button" class="text-button" data-child-cancel>ביטול וחזרה</button>' : ''}</div>
    </form></section>`;

  const form = root.querySelector('form');
  const recordButton = form.querySelector('[data-name-record]');
  const transferButton = form.querySelector('[data-old-recording]');
  const previewButton = form.querySelector('[data-name-preview]');
  const luckButton = form.querySelector('[data-name-luck]');
  const submitButton = form.querySelector('[type=submit]');
  const pronunciation = form.querySelector('.profile-pronunciation');
  const phonetics = form.querySelector('#name-phonetics');
  const feedback = form.querySelector('#profile-message');
  const message = text => { if (!disposed) feedback.textContent = text; };
  const preview = new Narrator(status => {
    if (status === 'unavailable') message('הברכה לא נשמעה. אפשר לנסות שוב בלחיצה על הרמקול.');
  });
  if (original.voice && original.voice !== findVoiceName(original.name)?.id) form.elements.voice.value = original.voice;

  function candidate() {
    const name = cleanName(form.elements.name.value);
    const voice = form.elements.voice.value === 'auto' ? findVoiceName(name)?.id || null : form.elements.voice.value;
    return { name, address: form.elements.address.value, voice };
  }

  function voiceNote() {
    const current = candidate();
    const prepared = VOICE_NAMES.find(name => name.id === current.voice);
    const generated = usableNameVoice(current, custom);
    form.querySelector('#name-voice-note').textContent = generated
      ? 'שתי הברכות מוכנות בקול של Ava. אפשר להקשיב להן לפני השמירה.'
      : prepared ? `Ava תגיד את השם ${prepared.name}. אפשר להקשיב ולבדוק את ההגייה.`
        : 'אפשר להקליט את ההגייה או לכתוב אותה כדי להכין ברכה עם השם. בינתיים תושמע ברכה כללית.';
    luckButton.hidden = !generated && !prepared;
    transferButton.hidden = !previousRecording || current.name !== original.name || generated;
  }

  function controls(pending, recording = false) {
    busy = pending;
    for (const control of form.querySelectorAll('input, select, button')) {
      if (control.matches('[data-child-cancel]')) continue;
      control.disabled = pending && !(recording && control === recordButton);
    }
  }

  function stopTracks() {
    stream?.getTracks().forEach(track => track.stop());
    stream = null;
  }

  function stopPreview() {
    preview.stop();
    playback?.release();
    playback = null;
  }

  function destroy() {
    if (disposed) return;
    disposed = true;
    lifetime.abort();
    clearTimeout(timer);
    stopPreview();
    if (recorder?.state === 'recording') recorder.stop();
    stopTracks();
  }

  function phases(phase) {
    message({
      loading: 'טוענים את קובצי הקול. בפעם הראשונה זה יכול לקחת כמה רגעים…',
      recognizing: 'מקשיבים להגיית השם…',
      welcome: 'מכינים את ברכת הפתיחה בקול של Ava…',
      'good-luck': 'מכינים את ברכת ההצלחה בקול של Ava…',
    }[phase]);
  }

  function voiceFailure(error) {
    const reason = error?.message;
    message(reason === 'name_silence' || reason === 'name_not_recognized'
      ? 'לא הצלחנו לזהות את השם. אפשר להקליט שוב במקום שקט או לכתוב את ההגייה.'
      : 'לא הצלחנו להכין את הקול כרגע. אפשר לנסות שוב בחיבור לאינטרנט או להשתמש בברכה המוכנה.');
  }

  async function generate(current) {
    const pronunciationText = phonetics.value.trim();
    const result = await runNameVoice(
      { action: 'synthesize', phonetics: pronunciationText, address: current.address },
      { signal: lifetime.signal, onPhase: phases },
    );
    if (disposed) return;
    custom = { ...result, name: current.name, address: current.address, phonetics: pronunciationText };
    voiceNote();
    message('הקשיבו לשתי הברכות. אם ההגייה לא מדויקת, אפשר לתקן אותה ולהכין שוב.');
  }

  async function fromRecording(blob) {
    const current = candidate();
    controls(true);
    try {
      message('קוראים את ההקלטה…');
      const samples = await recordingSamples(blob);
      if (disposed) return;
      const result = await runNameVoice({ action: 'recognize', samples, writtenName: current.name }, { signal: lifetime.signal, onPhase: phases });
      if (disposed) return;
      phonetics.value = result.phonetics;
      pronunciation.hidden = false;
      message('בדקו את ההגייה שהמשחק שמע. אפשר לתקן אותה ואז להכין את הברכות בקול של Ava.');
    } catch (error) {
      if (disposed) return;
      pronunciation.hidden = false;
      voiceFailure(error);
    } finally {
      if (!disposed) { controls(false); phonetics.focus(); }
    }
  }

  for (const input of [form.elements.name, form.elements.voice, form.elements.address]) {
    input.addEventListener('input', () => {
      stopPreview();
      if (!usableNameVoice(candidate(), custom) || input === form.elements.voice) custom = null;
      if (input === form.elements.name) { phonetics.value = ''; pronunciation.hidden = true; }
      message('');
      voiceNote();
    });
  }
  phonetics.addEventListener('input', () => {
    stopPreview();
    custom = null;
    message('');
    voiceNote();
  });

  function play(key) {
    const current = candidate();
    if (!current.name) { message('הזינו שם פרטי כדי לשמוע את הברכה.'); return; }
    stopPreview();
    playback = nameVoicePlayback(usableNameVoice(current, custom) ? custom : null);
    preview.resolveKey = profileSpeech(current, playback.urls);
    message('');
    void preview.say(key);
  }
  previewButton.onclick = () => play('welcome');
  luckButton.onclick = () => play('good-luck');

  form.querySelector('[data-name-manual]').onclick = () => {
    pronunciation.hidden = false;
    phonetics.focus();
  };
  form.querySelector('[data-name-clear]').onclick = () => {
    stopPreview();
    custom = null;
    pronunciation.hidden = true;
    voiceNote();
    message('');
  };
  form.querySelector('[data-name-generate]').onclick = async () => {
    const current = candidate();
    if (!current.name || !namePhonemes(phonetics.value)) { message('הזינו שם פרטי והגייה באותיות לטיניות, עם תנועות.'); return; }
    stopPreview();
    controls(true);
    try { await generate(current); } catch (error) { if (!disposed) voiceFailure(error); }
    finally { if (!disposed) controls(false); }
  };
  transferButton.onclick = () => {
    stopPreview();
    const [header, encoded] = previousRecording.split(',');
    const blob = new Blob([Uint8Array.from(atob(encoded), char => char.charCodeAt(0))], { type: header.slice(5).split(';')[0] });
    void fromRecording(blob);
  };

  recordButton.onclick = async () => {
    if (recorder?.state === 'recording') { recorder.stop(); return; }
    if (busy || saved) return;
    stopPreview();
    if (!candidate().name) { message('קודם הזינו שם, ואז הקליטו אותו.'); return; }
    if (!navigator.mediaDevices?.getUserMedia || !globalThis.MediaRecorder) {
      message('הקלטה זמינה בדפדפן שתומך במיקרופון. אפשר לכתוב את ההגייה כאן.');
      pronunciation.hidden = false;
      return;
    }
    controls(true);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (disposed) { stopTracks(); return; }
      const mimeType = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg;codecs=opus'].find(type => MediaRecorder.isTypeSupported(type));
      recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      const parts = [];
      let failed = false;
      recorder.ondataavailable = event => { if (event.data.size) parts.push(event.data); };
      recorder.onerror = () => {
        failed = true;
        clearTimeout(timer);
        stopTracks();
        if (disposed) return;
        controls(false);
        recordButton.textContent = 'הקלטת הגיית השם';
        message('לא הצלחנו להקליט. אפשר לנסות שוב או לכתוב את ההגייה.');
      };
      recorder.onstop = () => {
        clearTimeout(timer);
        stopTracks();
        if (disposed || failed) return;
        recordButton.textContent = 'הקלטת הגיית השם';
        void fromRecording(new Blob(parts, { type: recorder.mimeType || mimeType || 'audio/webm' }));
      };
      recorder.start();
      controls(true, true);
      recordButton.textContent = 'סיום ההקלטה';
      message('מקליטים עכשיו. אמרו רק את השם.');
      timer = setTimeout(() => { if (recorder?.state === 'recording') recorder.stop(); }, 4000);
    } catch {
      stopTracks();
      if (disposed) return;
      controls(false);
      pronunciation.hidden = false;
      message('המיקרופון לא נפתח. אפשר לאפשר אותו בהגדרות הדפדפן או לכתוב את ההגייה.');
    }
  };

  form.onsubmit = async event => {
    event.preventDefault();
    if (busy || saved) return;
    const details = candidate();
    if (!details.name) { message('הזינו שם פרטי בעברית או באנגלית, עד 30 תווים.'); return; }
    const voice = usableNameVoice(details, custom) ? custom : null;
    let voiceId = null;
    controls(true);
    try {
      if (voice) voiceId = await stageNameVoice(details, voice);
      if (disposed) { await discardNameVoice(voiceId); return; }
      const fields = { ...details, voiceId };
      const result = editing
        ? profiles.update(editing.id, fields, voice || details.name !== original.name ? null : undefined)
        : profiles.add({ ...fields, pendingAlbum: invitation?.code });
      saved = true;
      void discardNameVoice(editing?.voiceId);
      destroy();
      onDone(result);
    } catch (error) {
      if (!saved) await discardNameVoice(voiceId);
      if (disposed) return;
      controls(false);
      message(error.message === 'profile_limit' ? 'אפשר לשמור עד 20 ילדים במכשיר הזה.' : 'הדפדפן לא הצליח לשמור את הפרטים. נסו שוב בחלון רגיל.');
    }
  };

  root.querySelector('[data-child-cancel]')?.addEventListener('click', () => { destroy(); onCancel(); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    stopPreview();
    if (recorder?.state === 'recording') recorder.stop();
  }, { signal: lifetime.signal });
  voiceNote();
  if (original.voiceId) {
    controls(true);
    void savedNameVoice(original).then(voice => {
      if (disposed) return;
      custom = voice;
      if (voice) { phonetics.value = voice.phonetics; pronunciation.hidden = false; }
      controls(false);
      voiceNote();
    });
  }
  return { destroy };
}

const protectedText = '.target-word,.reading-stage-samples,.character-name,.character-word,.letter-familiar,.letter-book-form,.story-reading p,.context-sentence,.context-choices,.word-tiles,.word-slots,[data-learning-text],.profile-editor,.child-panel,#family-panel h3';
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
