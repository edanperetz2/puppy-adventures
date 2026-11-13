import { CLIPS } from './content.js';
import { pup, uiIcon } from './art.js';
import { mountClockDial } from './clock-dial.js?v=2.2.4-practice';
import { CLOCK_LESSONS, clockLessonTasks, clockParts, clockTotal, learningTime, taskClips, taskSucceeded, isFullTurn, sanitizeClockPosition, hasClockLesson, clockLessonCount, nextClockLesson, journeyMinutes, realMinuteSeconds } from './clock-learning.js?v=2.2.4-practice';
import { CLOCK_MINUTE_LABELS } from './clock-school-content.js';
import { LEGACY_SESSION_LENGTH, SESSION_LENGTH } from './adventure.js?v=2.2.2-six';

export function mountClockSchool(root, { getProgress, position, onPosition, onRecord, speak, onPractice, practiceName, returnToGame = false, motion = true } ) {
  let screen='map', lessonIndex=0, taskIndex=0, dial=null, moved=false, result=false, feedback='', demonstrating=false, selected='hour', saveTimer=null, realTimer=null, realRestore=[];
  let saved=sanitizeClockPosition(position);
  let practiceSeed, shufflePractice, practiceLength, variedPractice, practiceLessons;
  function prepareExamples(seed, shuffled, length, varied) {
    practiceSeed = seed;
    shufflePractice = shuffled;
    practiceLength = length;
    variedPractice = varied;
    practiceLessons = CLOCK_LESSONS.map((lesson, index) => ({ ...lesson, tasks: clockLessonTasks(index, seed, shuffled, length, varied) }));
  }
  prepareExamples(saved.seed || 1, saved.shufflePractice === true, saved.length ?? LEGACY_SESSION_LENGTH, saved.variedPractice === true);
  const abort=new AbortController();
  const lesson=()=>practiceLessons[lessonIndex], task=()=>lesson().tasks[taskIndex];
  const fullTurn = () => isFullTurn(lesson(), task());
  const demonstration = () => lesson().demo || CLOCK_LESSONS[lessonIndex].tasks[0];
  const activeHand=()=>task().hand||lesson().hand;
  const button=(action,label,cls='secondary-button',extra='')=>`<button type="button" class="${cls}" data-school="${action}" ${extra}>${label}</button>`;
  const replayButton=()=>button('speak',uiIcon('sound'),'circle-button','aria-label="שמיעת ההסבר שוב"');
  const introText=()=>lesson().intro.map(key=>CLIPS[key].text).join(' ');
  function taskPosition(lesson, index, total = practiceLessons[lesson].tasks[index].start) {
    return { lesson, index, total, seed: practiceSeed, length: practiceLength, ...(shufflePractice ? { shufflePractice } : {}), ...(variedPractice ? { variedPractice } : {}) };
  }
  function persist() {
    if(screen!=='try'||!dial)return;
    const { hour, minute } = clockParts(dial.total);
    saved=taskPosition(lessonIndex, taskIndex, clockTotal(hour, minute));
    onPosition(saved);
  }
  function titleFocus(){root.querySelector('h1')?.focus({preventScroll:true});}
  function controls(hand){return `<div class="school-hand-controls" role="group" aria-label="הזזת המחוגים">${['hour','minute'].map(kind=>{
    const allowed=hand==='both'||hand===kind;
    return `<div class="school-hand-row ${kind}">${button('select',`<span class="hand-swatch ${kind==='hour'?'short':'long'}"></span><span>${kind==='hour'?'הקצר · שעות':'הארוך · דקות'}</span>`,'school-hand-select',`data-hand="${kind}" aria-pressed="${selected===kind}" ${allowed?'':'disabled'}`)}<div dir="ltr">${button('step','−','school-step',`data-hand="${kind}" data-direction="-1" aria-label="${kind==='hour'?'שעה אחורה':'דקה אחורה'}" ${allowed?'':'disabled'}`)}${button('step','+','school-step',`data-hand="${kind}" data-direction="1" aria-label="${kind==='hour'?'שעה קדימה':'דקה קדימה'}" ${allowed?'':'disabled'}`)}</div></div>`;
  }).join('')}</div>`;}
  function timeCard(){return `<button type="button" class="school-time" data-school="time" aria-label="שמיעת השעה שבנית"><b dir="ltr" data-school-digital></b><span data-school-time></span>${uiIcon('sound')}</button>`;}
  function taskText(){
    if (lesson().journey) {
      const { duration } = task();
      if (duration === 60) return 'נאסוף 60 דקות ונגלה שעה אחת';
      return `נוסיף ${CLOCK_MINUTE_LABELS[duration]} לטיול של בובי`;
    }
    if(lesson().hand==='face')return `מצאי את המספר ${task().number}`;
    if(fullTurn())return 'סיבוב שלם של הארוך, בכיוון החץ';
    if(activeHand()==='hour')return `גררי את הקצר למספר ${clockParts(task().total).hour}`;
    if(activeHand()==='minute'&&!lesson().minutes)return 'גררי את הארוך אל 12 למעלה';
    const time=learningTime(task().total);return `בונות שעון שמראה ${time.he}`;
  }
  function updateReadout(total){
    if(total===undefined&&!dial)return;const time=total===undefined?dial.time():learningTime(total);const digital=root.querySelector('[data-school-digital]'),caption=root.querySelector('[data-school-time]');
    if(digital)digital.textContent=time.digital;if(caption)caption.textContent=time.he;
    const detail=root.querySelector('[data-school-detail]');if(detail){const next=time.hour%12+1;detail.textContent=`הקצר ${time.minute===0?'על '+time.hour:'בין '+time.hour+' ל־'+next} · הארוך ${time.minute===0?'על 12':time.minute%5===0?`על ${time.minute/5} · ${time.minute} דקות`:`על סימון הדקה ${time.minute}`}`;}
    updateJourney(total===undefined?dial.total:total);
  }
  function journey(){
    if (screen === 'free' || !(lesson().journey || (screen === 'explain' ? lesson().turn : fullTurn()))) return '';
    return `<section class="minute-journey" aria-label="טיול הדקות של בובי"><h2>טיול הדקות של בובי</h2><p>כל נקודה היא דקה. כל קבוצה היא 5 דקות.</p><div class="journey-track" aria-hidden="true"><span class="journey-dog">${pup('bobi')}</span><span class="journey-finish">✦</span></div><div class="minute-bundles" aria-hidden="true">${Array.from({length:12},(_,group)=>`<div class="minute-bundle"><div>${Array.from({length:5},()=>'<i data-minute-bead></i>').join('')}</div><small>${(group+1)*5}</small></div>`).join('')}</div><div class="journey-quantity"><b data-journey-count>0 דקות</b><span class="hour-bundle"><strong>1</strong> שעה = 60 דקות</span></div><p class="journey-speed">זה טיול בדמיון — הדקות במשחק עוברות מהר.</p>${screen==='try'?`<div class="journey-add-buttons">${button('one-minute','עוד דקה','primary-button')}${!lesson().journey||task().duration!==1?button('five-minutes','עוד 5 דקות','secondary-button'):''}</div>`:''}${lesson().journey&&(screen==='explain'||task().duration===1)?`<div class="real-minute">${button('real-minute','נרגיש דקה אמיתית','text-button')}<p data-real-status role="status">כאן הדקה תעבור בקצב אמיתי.</p><progress data-real-progress max="60" value="0" aria-label="הזמן שעבר בדקה אמיתית"></progress><small data-real-count aria-hidden="true">0 / 60 שניות</small></div>`:''}</section>`;
  }
  function updateJourney(total){
    const node=root.querySelector('.minute-journey');if(!node)return;
    const start=screen==='explain'?demonstration().start:task().start,n=journeyMinutes(start,total);
    node.querySelectorAll('[data-minute-bead]').forEach((bead,i)=>bead.classList.toggle('filled',i<n));
    node.querySelector('[data-journey-count]').textContent=n===1?'דקה אחת':`${n} דקות`;
    node.classList.toggle('whole-hour',n===60);node.querySelector('.journey-dog').style.right=`${n/60*85}%`;
  }
  function stopRealMinute(){
    if(!realTimer)return;clearInterval(realTimer);realTimer=null;
    for(const [node,disabled] of realRestore)if(node.isConnected)node.disabled=disabled;realRestore=[];
    const button=root.querySelector('[data-school=real-minute]');if(button)button.textContent='נרגיש דקה אמיתית';
  }
  function realMinute(){
    const status=root.querySelector('[data-real-status]');if(realTimer){stopRealMinute();status.textContent='עצרנו. אפשר לנסות שוב כשתרצי.';return;}
    const start=performance.now(),base=screen==='try'?task().start:0;
    realRestore=[...root.querySelectorAll('[data-school=demo],[data-school=try],[data-school=check],[data-school=select],[data-school=step],[data-school=five-minutes],[data-school=one-minute],.clock-grip,[data-dial-number]')].map(node=>[node,node.disabled]);
    for(const[node]of realRestore)node.disabled=true;
    root.querySelector('[data-school=real-minute]').textContent='נעצור את הדקה';status.textContent='נרגיש יחד איך דקה עוברת. אפשר לעצור.';dial.set(base);speak('school-real-minute');
    realTimer=setInterval(()=>{
      const seconds=realMinuteSeconds(start,performance.now());root.querySelector('[data-real-progress]').value=seconds;root.querySelector('[data-real-count]').textContent=`${seconds} / 60 שניות`;
      if(seconds===60){stopRealMinute();dial.set(base+1);if(screen==='try'){moved=true;root.querySelector('[data-school=check]').disabled=false;persist();}status.textContent='עברה דקה אמיתית אחת!';speak('school-one-minute');}
    },200);
  }
  function attachDial(total,hand){
    dial=mountClockDial(root.querySelector('[data-school-dial]'),{total,hand,minutes:screen==='free'||lesson().minutes,sector:screen==='free'||lesson().sector,
      onPaint:total=>updateReadout(total),
      onSelect(kind){selected=kind;for(const x of root.querySelectorAll('.school-hand-select'))x.setAttribute('aria-pressed',String(x.dataset.hand===kind));},
      onChange(value){if(screen==='try'&&!result){if(lesson().journey||fullTurn())dial.set(Math.max(task().start,Math.min(task().start+60,value)));moved=true;feedback='';root.querySelector('[data-school-feedback]').textContent='';root.querySelector('[data-school=check]').disabled=false;clearTimeout(saveTimer);saveTimer=setTimeout(persist,180);}updateReadout();},
      onNumber(n){if(screen!=='try'||lesson().hand!=='face'||result)return;if(n===task().number){moved=true;success();}else{feedback='בואי נחפש שוב את המספר '+task().number;updateFeedback();speak(taskClips(lesson(),task()));}}
    });dial.select(selected);updateReadout();
  }
  function render(){
    stopRealMinute();clearTimeout(saveTimer);dial?.destroy();dial=null;demonstrating=false;
    const count=clockLessonCount(getProgress());
    if(screen==='map'){
      const resume=!hasClockLesson(getProgress(),saved.lesson)?saved.lesson:nextClockLesson(getProgress());
      root.innerHTML=`<div class="school-top"><span>גן השעונים · בובי לומד איתך</span>${returnToGame?button('practice','חוזרות למשחק','text-button'):''}</div><section class="school-welcome"><div><span class="section-kicker">מגלות, מזיזות ומבינות</span><h1 tabindex="-1">לומדות לקרוא שעון</h1><p>כל פעם רעיון קטן. קודם הסבר והדגמה, ואז תורך לנסות.</p><div class="school-welcome-actions">${button('continue',count===10?'חוזרות לגלות ביחד':'בואי נמשיך ביחד','primary-button',`data-lesson="${resume}"`)}${button('speak',uiIcon('sound'),'circle-button','aria-label="שמיעת ההסבר על הלמידה"')}</div></div><div class="school-mascot">${pup('bobi')}<span>בקצב שלך ♡</span></div></section>
      <div class="school-map-heading"><h2>עשרה גילויים קטנים</h2><span>${count} מתוך 10 גילויים${count?' · נשמרו בשבילך':''}</span></div><div class="school-lesson-map">${CLOCK_LESSONS.map((item,i)=>`<button type="button" class="school-lesson ${hasClockLesson(getProgress(),i)?'learned':''}" data-school="lesson" data-lesson="${i}" aria-label="גילוי ${i+1}: ${item.title}${hasClockLesson(getProgress(),i)?' · כבר גילינו':''}"><span class="school-lesson-number">${hasClockLesson(getProgress(),i)?'✓':i+1}</span><span><b>${item.title}</b><small>${item.subtitle}</small></span>${uiIcon('arrow')}</button>`).join('')}</div><div class="school-other-paths">${button('free',`<b>השעון שלי</b><span>גוררות את שני המחוגים ומקשיבות לשעה</span>`,'school-free-card')}${button('practice',`<b>${returnToGame?'חוזרות למשחק':'משחק הקריאה'}</b><span>${returnToGame?'ממשיכות מהמקום שבו עצרנו':`${SESSION_LENGTH} צעדים · ${practiceName}`}</span>`,'school-practice-card')}</div><p class="school-footnote">אפשר לחזור לכל גילוי כמה פעמים שרוצים. המדבקות מחכות בסיום משחק הקריאה.</p><p id="audio-notice" class="audio-notice" role="status" hidden></p>`;
    }else if(screen==='done'){
      root.innerHTML=`${button('map','לכל הגילויים','text-button')}<section class="school-done">${pup('bobi')}<span class="school-done-star" aria-hidden="true">✦</span><h1 tabindex="-1">איזה יופי! גילינו עוד משהו</h1><p>סיימת את ״${lesson().title}״</p><p>${count} מתוך 10 גילויים · ההתקדמות שלך נשמרת</p>${count===10?'<p>אפשר לחזור לכל הסבר, או לנסות את משחק הקריאה.</p>':''}<div class="school-done-actions">${button('next-lesson',lessonIndex===9?'לכל הגילויים':'לגילוי הבא','primary-button')}${button('repeat','עוד פעם ביחד')}${button('free','לשעון שלי')}${count===10?button('practice',returnToGame?'חוזרות למשחק':'למשחק הקריאה'):''}</div></section>`;
    }else{
      const free=screen==='free',explain=screen==='explain',l=lesson();selected=!free&&activeHand()==='minute'?'minute':'hour';
      root.innerHTML=`<div class="school-top">${button('map','לכל הגילויים','text-button')}<span>${free?'מגלות בקצב שלך':`גילוי ${lessonIndex+1} מתוך 10`}</span>${returnToGame?button('practice','חוזרות למשחק','text-button'):''}</div><section class="school-board ${free?'school-free':explain?'school-explain':'school-try'} ${l.hand==='face'&&!free?'face-lesson':''} ${l.journey&&!free?'duration-lesson':''}"><div class="school-board-heading"><div><span class="section-kicker">${free?'מזיזות, מקשיבות ומגלות':explain?'קודם מגלות ביחד':`עכשיו תורך · ניסיון ${taskIndex+1} מתוך ${l.tasks.length}`}</span><h1 tabindex="-1">${free?'השעון שלי':l.title}</h1></div>${replayButton()}</div><div class="school-board-layout"><div class="school-clock-column"><div data-school-dial></div>${timeCard()}<p class="school-clock-detail" data-school-detail></p><p class="school-touch-note">${explain?'בובי מסביר ומדגים. אחר כך תורך':!free&&l.hand==='face'?'לחצי על המספר שעל השעון':'גררי את העיגולים שעל המחוגים'}</p></div><div class="school-guide-column">${free?`<div class="school-explanation"><p>הקצר והסגול מראה את השעה.<br>הארוך והירוק מראה את הדקות.</p><p>כשהארוך משלים סיבוב, הקצר מתקדם שעה אחת.</p></div>${controls('both')}${button('controls','איך מזיזים את המחוגים?','text-button')}`:explain?`<div class="school-explanation"><span class="school-bobi-label">בובי מסביר ${uiIcon('sound')}</span><p>${introText()}</p></div>${journey()}<p class="school-demo-status" role="status" data-demo-status>נסתכל, נקשיב ונגלה</p><div class="school-learning-actions">${button('demo','בובי מדגים','secondary-button')}${button('try','עכשיו תורי','primary-button')}</div>`:`<div class="school-goal"><span>השעון שנבנה עכשיו</span><h2>${taskText()}</h2>${button('target',`${uiIcon('sound')} נשמע שוב`,'text-button')}</div>${journey()}${l.hand==='face'?'':controls(activeHand())}<div class="school-feedback" role="status" data-school-feedback></div><div class="school-learning-actions">${button('check','בדקי את השעון','primary-button',`${moved?'':'disabled'}`)}${button('demo','בובי מדגים','secondary-button')}${button('next-task',taskIndex===l.tasks.length-1?'גילינו! ממשיכות':'ננסה עוד פעם','primary-button','hidden')}</div>${button('explain','בחזרה להסבר','text-button')}`}</div></div><p id="audio-notice" class="audio-notice" role="status" hidden></p></section>`;
      const total=free?clockTotal(3,0):explain?demonstration().total:saved.lesson===lessonIndex&&saved.index===taskIndex?saved.total:task().start;
      attachDial(total,free?'both':explain?'face':activeHand());
      if(!explain&&!free&&l.hand==='face')root.querySelector('[data-school=check]').hidden=true;
      if(result)updateFeedback();
    }
  }
  function openLesson(index,resume=false){
    persist();
    const continuing = resume && saved.lesson === index && !hasClockLesson(getProgress(), index)
      && (saved.index > 0 || saved.length === SESSION_LENGTH);
    if (!continuing) {
      prepareExamples(1 + Math.floor(Math.random() * 0xffffffff), true, SESSION_LENGTH, true);
      saved = taskPosition(index, 0);
    }
    lessonIndex = index;
    taskIndex = saved.index;
    screen = continuing ? 'try' : 'explain';
    moved = false;
    result = false;
    feedback = '';
    render();
    titleFocus();
    speak(continuing ? taskClips(lesson(), task()) : lesson().intro);
  }
  function updateFeedback(){const node=root.querySelector('[data-school-feedback]');if(!node)return;node.textContent=feedback;node.classList.toggle('success',result);root.querySelector('[data-school=check]').hidden=result||lesson().hand==='face';root.querySelector('[data-school=next-task]').hidden=!result;root.querySelector('[data-school=demo]').disabled=result;}
  function success(){
    result=true;feedback='כל הכבוד! הצלחת!';updateFeedback();
    for(const b of root.querySelectorAll('.school-hand-controls button,.clock-grip,[data-dial-number],[data-school=five-minutes],[data-school=one-minute],[data-school=real-minute]'))b.disabled=true;
    const duration = task().duration;
    const clips = fullTurn() || duration === 60 ? ['school-one-hour']
      : duration === 1 ? ['school-one-minute']
      : duration || lesson().hand === 'face' ? [] : dial.time().clips;
    speak(['correct-1', ...clips]);
    root.querySelector('[data-school=next-task]').focus({preventScroll:true});
  }
  function showDemo(){
    if(demonstrating||result)return;demonstrating=true;
    const t=screen==='explain'?demonstration():task();speak(['school-demo']);
    const status=root.querySelector('[data-demo-status]')||root.querySelector('[data-school-feedback]');status.textContent='עכשיו בובי מדגים. אחר כך תורך ♡';
    const disabledBefore=[...root.querySelectorAll('[data-school=check],[data-school=try],[data-school=demo],[data-school=step],[data-school=select],[data-school=real-minute],[data-school=five-minutes],[data-school=one-minute]')].map(b=>[b,b.disabled]);
    for(const [b] of disabledBefore)b.disabled=true;
    if(lesson().hand==='face'){
      root.querySelector(`[data-dial-number="${t.number}"]`).classList.add('number-example');
      dial.demo(0,0,motion,finishDemo);
    }else dial.demo(t.start,t.total,motion,finishDemo);
    function finishDemo(){demonstrating=false;status.textContent='עכשיו תורך לנסות';root.querySelector('.number-example')?.classList.remove('number-example');for(const [b,disabled] of disabledBefore)b.disabled=disabled;const check=root.querySelector('[data-school=check]');if(check)check.disabled=!moved;if(screen==='try')speak(taskClips(lesson(),task()));}
  }
  root.addEventListener('click',event=>{
    const b=event.target.closest('[data-school]');if(!b||b.disabled)return;
    switch(b.dataset.school){
      case 'map':persist();screen='map';render();titleFocus();break;
      case 'continue':openLesson(Number(b.dataset.lesson),true);break;
      case 'lesson':openLesson(Number(b.dataset.lesson));break;
      case 'repeat':openLesson(lessonIndex);break;
      case 'next-lesson':if(lessonIndex===9){screen='map';render();titleFocus();}else openLesson(lessonIndex+1);break;
      case 'free':persist();screen='free';render();titleFocus();speak('school-free');break;
      case 'practice':persist();onPractice();break;
      case 'speak':replay(true);break;
      case 'controls':speak('school-controls',true);break;
      case 'time':speak(dial.time().clips,true);break;
      case 'select':selected=b.dataset.hand;dial.select(selected);for(const x of root.querySelectorAll('.school-hand-select'))x.setAttribute('aria-pressed',String(x.dataset.hand===selected));break;
      case 'step':dial.step(b.dataset.hand,Number(b.dataset.direction));break;
      case 'one-minute':dial.step('minute',1);break;
      case 'five-minutes':dial.step('minute',5);break;
      case 'real-minute':realMinute();break;
      case 'try':screen='try';result=false;moved=false;feedback='';saved=taskPosition(lessonIndex,taskIndex);render();onPosition(saved);titleFocus();speak(taskClips(lesson(),task()));break;
      case 'explain':persist();screen='explain';render();titleFocus();speak(lesson().intro);break;
      case 'demo':showDemo();break;
      case 'target':speak(taskClips(lesson(),task()),true);break;
      case 'check':if(taskSucceeded(lesson(),task(),dial.total,moved))success();else{feedback=fullTurn()?'הארוך צריך להשלים סיבוב שלם בכיוון החץ. אפשר להיעזר בכפתור +.':lesson().journey?'נבדוק כמה דקות כבר אספנו. אפשר לראות שוב את ההדגמה.':'נבדוק את שני המחוגים. אפשר לראות שוב את ההדגמה.';updateFeedback();speak(lesson().journey?['try-again',...taskClips(lesson(),task())]:['school-try-again',...taskClips(lesson(),task())]);}break;
      case 'next-task': {
        if (!result) break;
        if (taskIndex === lesson().tasks.length - 1) {
          onRecord(lessonIndex);
          screen = 'done';
          const next = Math.min(CLOCK_LESSONS.length - 1, lessonIndex + 1);
          saved = sanitizeClockPosition({ lesson: next });
          onPosition(saved);
          render();
          titleFocus();
          speak(clockLessonCount(getProgress()) === CLOCK_LESSONS.length ? 'school-finish' : 'school-lesson-done');
        } else {
          taskIndex++;
          saved = taskPosition(lessonIndex, taskIndex);
          onPosition(saved);
          result = false;
          moved = false;
          feedback = '';
          render();
          titleFocus();
          speak(taskClips(lesson(), task()));
        }
        break;
      }
    }
  },{signal:abort.signal});
  function replay(explicit=false){speak(screen==='map'?'school-welcome':screen==='free'?'school-free':screen==='done'?'school-lesson-done':screen==='explain'?lesson().intro:taskClips(lesson(),task()),explicit);}
  render();
  return {replay,destroy(){persist();stopRealMinute();clearTimeout(saveTimer);dial?.destroy();abort.abort();},updateProgress(){if(screen==='map')render();}};
}
