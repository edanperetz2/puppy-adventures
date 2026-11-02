import { learningSummary, learningStage, reviewPriority } from './learning.js';
import { WORDS, ANIMALS, COLORS, MISSIONS } from './content.js';
import { LETTERS } from './letters.js';
import { CHARACTERS } from './characters.js';
import { escapeHtml as esc } from './profiles.js';
export function itemLabel(id){
  const parts=id.split(':'),last=parts.at(-1);
  if(['read','workshop'].includes(parts[0]))return `${parts[0]==='workshop'?'בניית מילה':'קריאה'} · ${WORDS.find(w=>w.id===parts[1])?.pointed||parts[1]}`;
  if(parts[0]==='character')return `שמות · ${CHARACTERS.find(c=>c.id===parts[1])?.he||parts[1]}`;
  if(parts[0]==='letter'){const letter=LETTERS[parts[1]]?.find(l=>l.id===parts[2]);return `אות ${letter?.familiar||parts[2]} · ${last==='recognition'?'זיהוי':parts.includes('main')?'כתיבת דפוס / גדולה':'כתיבה'}`;}
  if(parts[0]==='english')return `אנגלית · ${parts[1]==='single'?[...ANIMALS,...COLORS].find(w=>w.id===last)?.en||last:last.replaceAll('-',' ')}`;
  if(parts[0]==='clock')return `שעון · ${parts[1]}:${parts[2].padStart(2,'0')}`;
  if(parts[0]==='objects')return `כמויות · ${parts[1]==='tens'?'עשרות':parts[1]==='bonds'?'מה חסר':parts[1]==='takeaway'?'נותנים ונשאר':'בונים'} · ${parts[2]}`;
  if(parts[0]==='math')return `חשבון · ${parts[1]==='count'?'ספירה':`${parts[2]} + ${parts[3]}`}`;
  if(parts[0]==='story')return `סיפור ${parts[1]==='picnic'?'הפיקניק':'הכדור'} · צעד ${Number(parts[2])+1}`;
  if(parts[0]==='phonics')return `צלילי אנגלית · ${last.toUpperCase()}`;
  return id;
}
export function learningStatus(learner){
  if(learner.status==='storage-error')return 'השמירה במכשיר לא הצליחה. השאירו את המשחק פתוח ונסו שוב.';
  if(!learner.getCode())return 'היסטוריית הלמידה והפארק שמורים במכשיר הזה. חברו אלבום לשיתוף בין המכשירים.';
  const receipt=learner.state.receipt?new Date(learner.state.receipt).toLocaleString('he-IL',{day:'numeric',month:'numeric',hour:'2-digit',minute:'2-digit'}):'';
  return learner.pending?`${learner.pending} עדכוני למידה / פארק שמורים כאן ומחכים לאישור האלבום.${receipt?` אישור אחרון: ${receipt}.`:''}`:learner.status==='syncing'?'בודקים עדכונים באלבום…':receipt?`האלבום אישר את השמירה ב־${receipt}. מכשירים נוספים יקבלו אותה בחיבור הבא.`:'ההיסטוריה שמורה כאן. ממתינים לחיבור לאלבום.';
}
export function parentLearning(learner){
  const items=learner.items,total=learningSummary(items);
  const review=Object.entries(items).filter(([,v])=>learningStage(v)!=='practice'&&reviewPriority(v)>=1).sort((a,b)=>reviewPriority(b[1])-reviewPriority(a[1])).slice(0,4);
  const recently=Object.entries(items).sort((a,b)=>b[1].last-a[1].last).slice(0,8);
  return `<section class="learning-parent"><h3>הצעדים הקטנים של הלמידה</h3><p class="learning-sync-status" role="status">${esc(learningStatus(learner))}</p><div class="learning-stat-grid"><div><b>${total.seen}</b><span>פריטים שפגשנו</span></div><div><b>${total.supported}</b><span>עדיין עם תמיכה</span></div><div><b>${total.independent}</b><span>הצלחה ללא רמז</span></div><div><b>${total.remembered}</b><span>הצלחה גם ביום אחר</span></div></div><p class="parent-note">התיעוד מתחיל מהעדכון הזה. ההרפתקאות והמדבקות הקודמות נשמרו, ואין הסקה של הצלחה בפריט מסוים מהמספר הכולל. ״ביום אחר״ דורש שתי הצלחות בימים נפרדים ובמרחק של 20 שעות לפחות.</p>
    ${review.length?`<h4>מה כדאי לפגוש שוב?</h4><ul>${review.map(([id,v])=>`<li>${esc(itemLabel(id))} <small>· ${v.helped>=v.independent?'חיזוק בעזרת דוגמה':'חזרה קצרה כדי לזכור'}</small></li>`).join('')}</ul>`:'<p>כמה משחקים קצרים יתחילו לבנות המלצות אישיות. אין צורך למהר.</p>'}
    ${recently.length?`<details><summary>מה תרגלנו לאחרונה?</summary><ul>${recently.map(([id,v])=>`<li>${esc(itemLabel(id))} · ${v.independent} ללא רמז, ${v.helped} עם עזרה${v.practice?`, ${v.practice} תרגולי כתיבה`:''}</li>`).join('')}</ul></details>`:''}
    <p class="parent-note">כתיבה חופשית ועל נייר נרשמת כהתנסות בלבד; צורת הציור אינה נבדקת. אפשר להסתכל יחד על האות ולבחור צעד קטן נוסף. ההרפתקה האחרונה נשמרת להמשך באותו מכשיר.</p><button class="secondary-button" type="button" data-learning-refresh>בדיקת שמירה ועדכונים</button></section>`;
}
