import { art, pup, uiIcon } from './art.js';
import { WORDS, ANIMALS, COLORS } from './content.js';
import { JOURNEYS, PHONICS, journeyQuestions, soundExample } from './journey.js';
import { escapeHtml as esc } from './profiles.js';
import { chunkClip } from './journey-audio.js';
import { STORIES } from './journey-content.js';

const color = id => COLORS.find(c=>c.id===id)?.hex || '#7baebc';
export function pairPicture(pair) {
  const paint=color(pair.color);
  if(pair.object==='ball')return `<svg viewBox="0 0 200 160" aria-hidden="true"><circle cx="100" cy="80" r="64" fill="${paint}" stroke="#8a98a7" stroke-width="2"/><path d="M49 43Q100 90 151 43M40 108Q100 75 148 116" fill="none" stroke="white" stroke-opacity=".65" stroke-width="9"/><path d="M64 52L78 42" stroke="white" stroke-width="10" stroke-linecap="round"/></svg>`;
  return `<svg viewBox="0 0 200 160" aria-hidden="true"><path d="M22 79L48 73L68 40H130L154 73L179 86V118H22Z" fill="${paint}"/><path d="M72 48H94V73H57ZM104 48H127L143 73H104Z" fill="#e5f8ff"/><circle cx="57" cy="119" r="19" fill="#354558"/><circle cx="149" cy="119" r="19" fill="#354558"/><circle cx="57" cy="119" r="8" fill="#fff"/><circle cx="149" cy="119" r="8" fill="#fff"/></svg>`;
}
export function learningPicture(id) {
  if(COLORS.some(c=>c.id===id))return `<span class="journey-color" style="--paint:${color(id)}"></span>`;
  return art(id);
}
// Pointer events cover touch, pen and mouse. Every drop also has a tap button.
export function mountDrops(root, selector, targetSelector, onDrop, signal) {
  let dragging=null,ghost=null,moved=false,start=null;
  const clear=()=>{ghost?.remove();ghost=null;dragging=null;start=null;};
  root.addEventListener('pointerdown',e=>{
    const source=e.target.closest(selector);if(!source||source.disabled||e.button!==0)return;
    dragging=source;start={x:e.clientX,y:e.clientY};moved=false;source.setPointerCapture(e.pointerId);
  },{signal});
  root.addEventListener('pointermove',e=>{
    if(!dragging)return;if(!moved&&Math.hypot(e.clientX-start.x,e.clientY-start.y)<8)return;
    e.preventDefault();moved=true;
    if(!ghost){ghost=dragging.cloneNode(true);ghost.classList.add('drag-ghost');ghost.removeAttribute('id');ghost.setAttribute('aria-hidden','true');document.body.append(ghost);}
    ghost.style.left=`${e.clientX}px`;ghost.style.top=`${e.clientY}px`;
  },{signal});
  root.addEventListener('pointerup',e=>{
    if(!dragging)return;const source=dragging;
    if(moved){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest(targetSelector);source.dataset.suppressClick='yes';setTimeout(()=>delete source.dataset.suppressClick,0);if(target)onDrop(source,target);}
    clear();
  },{signal});
  root.addEventListener('pointercancel',clear,{signal});signal.addEventListener('abort',clear,{once:true});
}

function storyMemory(story,index,resolved){
  const state={props:[],placements:{},groups:{}};
  for(const p of story.pages.slice(0,index+(resolved?1:0))){
    if(p.task==='place'){state.placements[p.target]=p.relation;delete state.groups[p.target];}
    else if(p.task==='count')state.groups[p.target]=p.count;
    else if(['read','choose','english'].includes(p.task)&&!['table','tree','red','blue'].includes(p.target)){
      if(p.target.startsWith('color-ball')){delete state.groups.ball;state.props=state.props.filter(id=>!id.includes('ball'));}
      if(!state.props.includes(p.target))state.props.push(p.target);
    }
  }
  return state;
}
function storyProps(memory,page){
  const props=memory.props.filter(id=>!['apple','ball'].includes(id)).slice(-3);
  return '<div class="story-props">'+props.map(id=>'<span>'+learningPicture(id)+'</span>').join('')+'</div>'+
    Object.entries(memory.placements).filter(([id])=>!(page.task==='place'&&id===page.target)).map(([id,rel])=>'<div class="story-placed '+rel+'">'+art(id)+'</div>').join('')+
    Object.entries(memory.groups).filter(([id])=>!(page.task==='count'&&id===page.target)).map(([id,n])=>'<div class="story-past-group">'+Array.from({length:n},()=>art(id)).join('')+'</div>').join('');
}

export function mountJourney(root,{plan,nikud=true,speak,onSave,onObservation,onComplete,onHome}) {
  const events=new AbortController(), questions=journeyQuestions(plan);let message='',celebrating=false;
  const q=()=>questions[plan.index],s=()=>plan.state;
  const say=(keys,explicit=false)=>speak(keys,explicit);
  function persist(){plan.at=Date.now();onSave(plan);}
  function help(){if(!plan.helped.includes(plan.index))plan.helped.push(plan.index);persist();}
  function prepare(){const task=q();if(task.kind==='story'&&task.page.english)say([task.prompt,`en-${task.page.english}`]);onObservation({item:task.key,domain:JOURNEYS[plan.mode].domain,exposure:true},'seen');if(task.model || task.kind==='story'&&plan.index<3){help();}plan.state={chosen:[],tokens:[],quantity:0,attempted:[],...plan.state};if(task.tiles)plan.state.chosen=[...new Set(plan.state.chosen.filter(id=>task.tiles.some(t=>t.id===id)))].slice(0,task.pieces.length);plan.state.tokens=plan.state.tokens.filter(n=>n<(task.page?.count||task.total||100));plan.state.quantity=Math.min(plan.state.quantity,task.operation==='tens'?100:plan.max);persist();}
  function replay(explicit=false){const task=q();if(task.kind==='story') {help();say([`journey-story-${task.story.id}-${plan.index}`,task.prompt,...(task.page.english?[`en-${task.page.english}`]:[])],explicit);}
    else say([task.prompt,...(task.extraClips||[]),...(task.kind==='context'?[]:task.clip?[task.clip]:task.word?[`he-${task.word.id}`]:[])],explicit);}
  function resolved(){
    if(s().resolved)return;s().resolved=true;
    if(!plan.observed.includes(plan.index)){plan.observed.push(plan.index);onObservation({item:q().key,domain:JOURNEYS[plan.mode].domain},plan.helped.includes(plan.index)?'helped':'independent');}
    message='כָּל הַכָּבוֹד! הִצְלַחְנוּ בְּיַחַד!';persist();celebrating=true;render();say(['journey-success',...(q().kind==='context'?[`journey-context-${q().word.id}`]:q().word?.id?[`he-${q().word.id}`]:q().clip?[q().clip]:[])]);root.querySelector('[data-j="next"]')?.focus({preventScroll:false});
  }
  function retry(){help();message='נַנְסֶה שׁוּב. אֶפְשָׁר לְקַבֵּל רֶמֶז ♡';persist();render();say('try-again');}
  function wordView(task){
    if(task.kind==='context')return `<div class="workshop-model">${art(task.word.id)}</div><p class="journey-instruction">מַשְׁלִימִים מִשְׁפָּט קָטָן. אֵיזוֹ מִלָּה מַתְאִימָה לַתְּמוּנָה?</p><div class="context-sentence" dir="rtl">${task.context.before} <b>${s().resolved||s().showModel?task.word.pointed:'____'}</b> ${task.context.after}</div><div class="context-choices">${task.choices.map(w=>`<button data-j="answer" data-answer="${w.id}" ${s().resolved?'disabled':''}>${nikud?w.pointed:w.he}</button>`).join('')}</div>`;
    const pieces=task.pieces,selected=s().chosen||[],missing=task.kind==='missing';
    const text=nikud?task.word.pointed:task.word.he;
    return `<div class="workshop-model">${art(task.word.id)}<button class="circle-button" data-j="word" aria-label="שמיעת המילה">${uiIcon('sound')}</button>${(task.model||s().showModel)?`<strong lang="he" dir="rtl">${text}</strong>`:''}</div>
      <p class="journey-instruction">${missing?'אֵיזוֹ אוֹת חֲסֵרָה?':'נִגַּע בַּחֲלָקִים לְפִי הַסֵּדֶר. אֶפְשָׁר גַּם לִגְרֹר.'}</p>
      <div class="word-slots" dir="rtl" data-word-drop>${pieces.map((p,i)=>`<span class="word-slot ${missing&&i===task.missing?'missing-slot':''}">${missing?i===task.missing?(selected.length?task.tiles.find(t=>t.id===selected[0]).text:'?'):p:selected[i]!==undefined?task.tiles.find(t=>t.id===selected[i]).text:''}</span>`).join('')}</div>
      <div class="word-tiles" dir="rtl" role="group" aria-label="חלקי המילה">${task.tiles.map(t=>`<button data-j="tile" data-tile="${t.id}" ${selected.includes(t.id)||s().resolved?'disabled':''}>${t.text}${task.kind==='chunks'?'<span aria-hidden="true">♪</span>':''}</button>`).join('')}</div>
      <div class="journey-controls"><button class="secondary-button" data-j="undo" ${!selected.length||s().resolved?'disabled':''}>${uiIcon('again')} מְנַסִּים אַחֶרֶת</button>${!missing?`<button class="primary-button" data-j="check" ${selected.length!==pieces.length||s().resolved?'disabled':''}>בּוֹדְקִים ${uiIcon('check')}</button>`:''}</div>`;
  }
  function storyView(task){
    const p=task.page,table=art('table'),rel={on:'עַל הַשֻּׁלְחָן',under:'מִתַּחַת לַשֻּׁלְחָן',beside:'לְיַד הַשֻּׁלְחָן'};
    const memory=storyMemory(task.story,plan.index,s().resolved);
    const scene=`<div class="story-scene ${s().placed?'story-changed':''}"><div class="story-tree">${art('tree')}</div><div class="story-pup">${pup(task.story.pup)}</div><div class="story-table">${table}</div>${storyProps(memory,p)}${p.task==='count'?`<div class="story-counted" style="--count-columns:${Math.min(4,p.count)}">${Array.from({length:p.count},(_,i)=>`<button data-j="count" data-token="${i}" aria-label="ספירת פריט ${i+1}" class="${s().tokens.includes(i)?'counted':''}">${learningPicture(p.target)}${s().tokens.includes(i)?`<b>${s().tokens.indexOf(i)+1}</b>`:''}</button>`).join('')}</div>`:s().placed?`<div class="story-placed ${p.relation}">${art(p.target)}</div>`:''}
      ${p.task==='place'?`<div class="story-drop-zones">${['on','under','beside'].map(r=>`<button data-j="place" data-place="${r}" class="story-drop ${r}" ${s().resolved?'disabled':''}>${rel[r]}</button>`).join('')}</div>`:''}</div>`;
    return `<div class="story-reading"><span>סִפּוּר ${STORIES.findIndex(story=>story.id===plan.level)+1} · עַמּוּד ${plan.index+1}</span><p dir="rtl" lang="he">${nikud?p.text:p.text.replace(/[\u0591-\u05c7]/gu,'')}</p><button data-j="read-story" class="text-button">${uiIcon('sound')} קוֹרְאִים יַחַד</button></div>${scene}<p class="journey-instruction">${p.prompt}</p>${p.task==='place'?`<div class="story-source"><button data-j="source" aria-label="גרירת ${WORDS.find(word=>word.id===p.target)?.he||p.target} למקום המתאים">${art(p.target)}</button><span>גוֹרְרִים לַמָּקוֹם. אֶפְשָׁר גַּם לִבְחֹר בִּנְגִיעָה.</span></div>`:`<div class="journey-choices">${task.choices.map(id=>`<button data-j="answer" data-answer="${id}" aria-label="${p.task==='count'?id:WORDS.find(w=>w.id===id)?.he||ANIMALS.find(w=>w.id===id)?.he||COLORS.find(w=>w.id===id)?.he||id}" ${s().resolved?'disabled':''}>${p.task==='count'?`<b class="quantity-number">${id}</b>`:learningPicture(id)}</button>`).join('')}</div>`}`;
  }
  function englishView(task){
    if(task.kind==='sound'||task.kind==='blend') {
      const letters=task.kind==='sound'?`<bdi class="sound-letters" dir="ltr">${task.phoneme.capital} <span>${task.phoneme.small}</span></bdi>`:`<div class="blend-pieces" dir="ltr">${task.word.split('').map(l=>`<button data-j="phoneme" data-phoneme="${l}" aria-label="דוגמה למילה שמתחילה בצליל ${l.toUpperCase()}">${l.toUpperCase()}<small>${l}</small>${uiIcon('sound')}</button>`).join('')}</div>`;
      return `<p class="journey-instruction">${task.kind==='sound'?'מַקְשִׁיבִים לַמִּלָּה וּמְחַפְּשִׂים אֶת הַצְּלִיל הָרִאשׁוֹן.':'מַקְשִׁיבִים לַמִּלָּה וּבוֹחֲרִים אֵיךְ הִיא כְּתוּבָה. בִּנְגִיעָה בָּאוֹת נִשְׁמַע מִלַּת דֻּגְמָה.'}</p>${(task.model||s().showModel)?letters:''}${task.kind==='sound'?`<div class="phonics-example">${learningPicture(task.phoneme.word==='insect'?'butterfly':task.phoneme.word)}${task.model||s().showModel?`<bdi dir="ltr" lang="en">${task.phoneme.word.toUpperCase()}</bdi>`:''}</div>`:''}<button class="listen-orb" data-j="listen" aria-label="שמיעת מילת הדוגמה">${uiIcon('sound')}</button><div class="journey-choices">${task.choices.map(c=>`<button data-j="answer" data-answer="${task.kind==='sound'?c.id:c}" ${s().resolved?'disabled':''} dir="ltr">${task.kind==='sound'?`<b class="sound-choice">${c.capital}<small>${c.small}</small></b>`:`<b class="sound-choice">${c.toUpperCase()}</b>`}</button>`).join('')}</div><p class="parent-note">${task.kind==='sound'?'מקשיבים לצליל בתחילת מילת דוגמה שלמה. אין צורך לקרוא את המילה.':'אפשר לחזור למסלול הצלילים בכל זמן.'}</p>`;
    }
    const pair=task.kind==='pair';
    return `<p class="journey-instruction">${task.newWord?'מִלָּה חֲדָשָׁה אַחַת! נַכִּיר אוֹתָה יַחַד.':pair?'כְּבָר מַכִּירִים אֶת הַצֶּבַע וְאֶת הַחֵפֶץ. נַקְשִׁיב לִשְׁתֵּי מִלִּים.':'מַקְשִׁיבִים לְמִלָּה אַחַת וּבוֹחֲרִים תְּמוּנָה.'}</p>
      ${(task.model||s().showModel)?`<div class="english-model">${pair?pairPicture(task.target):learningPicture(task.target.id)}<span>מַכִּירִים יַחַד</span>${pair?`<div><button data-j="pair-color">${uiIcon('sound')} הַצֶּבַע</button><button data-j="pair-object">${uiIcon('sound')} הַחֵפֶץ</button></div>`:''}</div>`:''}
      <button class="listen-orb" data-j="listen" aria-label="שמיעת המילה באנגלית">${uiIcon('sound')}<span>עוֹד פַּעַם? בְּשִׂמְחָה!</span></button><div class="journey-choices">${task.choices.map(c=>`<button data-j="answer" data-answer="${pair?`${c.color}-${c.object}`:c.id}" aria-label="${pair?`${COLORS.find(x=>x.id===c.color).he} ${c.object==='ball'?'כדור':'מכונית'}`:c.he}" ${s().resolved?'disabled':''}>${pair?pairPicture(c):learningPicture(c.id)}</button>`).join('')}</div>`;
  }
  function objectsView(task){
    const take=task.operation==='takeaway',tens=task.operation==='tens',bond=task.operation==='bonds',quantity=s().quantity||0;
    const target=take?task.total:task.answer,capacity=tens?100:plan.max<=10?10:20;
    return `<div class="quantity-goal">${take?`לַחֲבֵרִים יֵשׁ <b>${task.total}</b> תַּפּוּחִים. נִתֵּן <b>${task.known}</b> מֵהֶם לְלוּלִי. כַּמָּה יִשָּׁאֲרוּ?`:bond?`נַשְׁלִים לְ־<b>${task.total}</b>. כְּבָר יֵשׁ <b>${task.known}</b>. כַּמָּה חֲסֵרִים?`:`נִבְנֶה כַּמּוּת שֶׁל <b>${task.total}</b>`}</div>
    ${tens?`<p class="journey-instruction">כָּל מוֹט = 10 יְחִידוֹת. עֲשָׂרָה מוֹטוֹת = 100.</p><div class="tens-workbench" dir="ltr">${Array.from({length:Math.floor(quantity/10)},()=>`<div class="ten-rod" aria-label="עשר יחידות">${'<i></i>'.repeat(10)}</div>`).join('')}<div class="one-units">${'<i></i>'.repeat(quantity%10)}</div></div><p class="quantity-readout" dir="rtl">${Math.floor(quantity/10)} ${Math.floor(quantity/10)===1?'עֲשֶׂרֶת':'עֲשָׂרוֹת'} וְ־${quantity%10} ${quantity%10===1?'יְחִידָה':'יְחִידוֹת'} <b dir="ltr">= ${quantity}</b></p>`:
      `<div class="ten-frames ${take?'takeaway-frame':''}" dir="ltr">${Array.from({length:take?Math.ceil(task.total/10)*10:capacity},(_,i)=>{
        const fixed=bond&&i<task.known,filled=take?i<task.total:fixed||i<task.known+quantity,removed=s().tokens.includes(i);
        return `<button class="frame-cell ${fixed?'fixed':''} ${filled?'filled':''} ${removed?'removed':''} ${(task.model||s().showModel)&&i<target+(bond?task.known:0)?'ghost-target':''}" data-j="${take?'remove':'frame'}" data-token="${i}" aria-label="${take?'תפוח':'משבצת'} ${i+1}${removed?' ניתן ללולי':''}" ${s().resolved||fixed||take&&(i>=task.total||removed)?'disabled':''}>${filled?art('apple'):''}${removed?'<b>✓</b>':''}</button>`;
      }).join('')}</div>`}
    ${take?`<p class="journey-instruction">נָתַנּוּ ${s().tokens.length} מִתּוֹךְ ${task.known}. נִגַּע בַּתַּפּוּחִים כְּדֵי לָתֵת אוֹתָם.</p><div class="journey-choices">${[task.answer,...[task.answer-1,task.answer+1].filter(n=>n>=0)].map(n=>`<button data-j="answer" data-answer="${n}" ${s().tokens.length!==task.known||s().resolved?'disabled':''}><b class="quantity-number">${n}</b></button>`).join('')}</div>`:
      `<div class="quantity-tools"><button class="object-source" data-j="add" data-amount="${tens?10:1}" ${s().resolved?'disabled':''}>${tens?'<b>10</b>':art('apple')} ${uiIcon('plus')} ${tens?'מוֹט שֶׁל עֶשֶׂר':'מוֹסִיפִים אֶחָד'}</button>${tens?`<button data-j="add" data-amount="1" ${s().resolved?'disabled':''}>+1 יְחִידָה</button>`:''}<button data-j="less" data-amount="${tens?10:1}" ${!quantity||s().resolved?'disabled':''}>−${tens?'10':'1'}</button>${tens?`<button data-j="less" data-amount="1" ${!quantity||s().resolved?'disabled':''}>−1</button>`:''}</div><p class="quantity-readout">${bond?'הוֹסַפְנוּ':'בָּנִינוּ'} <b>${quantity}</b></p><button class="primary-button" data-j="check" ${s().resolved?'disabled':''}>בּוֹדְקִים ${uiIcon('check')}</button>`}`;
  }
  function render(){
    const task=q(),done=s().resolved;
    root.innerHTML=`<div class="journey-top"><button class="text-button" data-j="home">${uiIcon('home')} הַהַרְפַּתְקָה נִשְׁמֶרֶת</button><span>צַעַד ${plan.index+1} מִתּוֹךְ 10</span></div><div class="step-track">${questions.map((_,i)=>`<span class="step-dot ${i<plan.index?'done':i===plan.index?'current':''}">${i<plan.index?'✓':i+1}</span>`).join('')}</div>
      <section class="journey-board ${done?'journey-done':''} ${celebrating?'journey-celebrate':''}"><div class="question-heading"><div><span class="section-kicker">${plan.index<3?'מַתְחִילִים יַחַד':plan.index<7?'מְתַרְגְּלִים בְּנַחַת':'עוֹד צַעַד קָטָן'}</span><h1 tabindex="-1">${plan.mode==='stories'?task.story.title:JOURNEYS[plan.mode].title}</h1></div><button data-j="replay" class="circle-button" aria-label="שמיעת ההוראות">${uiIcon('sound')}</button></div>
      ${plan.mode==='workshop'?wordView(task):plan.mode==='stories'?storyView(task):plan.mode==='objects'?objectsView(task):englishView(task)}
      <div class="journey-feedback" role="status" aria-live="polite">${message|| (done?'כָּל הַכָּבוֹד! אֶפְשָׁר לְהַמְשִׁיךְ.':'אֶפְשָׁר לְנַסּוֹת וּלְבַקֵּשׁ עֶזְרָה. אֲנַחְנוּ כָּאן בְּיַחַד ♡')}</div><div class="journey-controls">${done?`<button class="primary-button" data-j="next">${plan.index===9?'לַמַּדְבֵּקָה שֶׁלִּי':'מַמְשִׁיכִים'} ${uiIcon('arrow')}</button>`:`<button class="hint-button" data-j="hint">${uiIcon('hint')} רֶמֶז קָטָן</button>`}</div></section>`;
  }
  function tile(id){if(s().resolved)return;const task=q();if(s().chosen.includes(id))return;s().chosen.push(id);persist();if(task.kind==='chunks')say(chunkClip(task.word.id,id));
    if(task.kind==='missing'){const value=task.tiles.find(t=>t.id===id).text;if(value===task.pieces[task.missing])resolved();else{s().chosen=[];retry();}}else render();}
  function place(relation){if(s().resolved)return;if(relation===q().page.relation){s().placed=true;resolved();}else retry();}
  root.addEventListener('click',e=>{
    const b=e.target.closest('[data-j]');if(!b||b.disabled||b.dataset.suppressClick)return;const task=q(),action=b.dataset.j;
    if(action==='home'){persist();onHome();return;}
    if(action==='replay'){replay(true);return;}
    if(action==='listen'){say(task.clip,true);return;}
    if(action==='word'){say(`he-${task.word.id}`,true);return;}
    if(action==='read-story'){help();replay(true);return;}
    if(action==='pair-color'){say(`en-${task.target.color}`,true);return;}
    if(action==='pair-object'){say(`journey-en-${task.target.object}`,true);return;}
    if(action==='phoneme'){say(soundExample(b.dataset.phoneme),true);return;}
    if(action==='next'&&s().resolved){if(plan.index===9){onComplete(plan);return;}plan.index++;plan.state={};message='';celebrating=false;prepare();render();window.scrollTo({top:0,behavior:'auto'});root.querySelector('h1').focus({preventScroll:true});if(q().kind!=='story'||plan.index<3)replay();return;}
    if(s().resolved)return;
    if(action==='hint'){help();s().showModel=true;message=task.kind==='objects'?`נִבְנֶה יַחַד: ${task.answer}`:'נִסְתַּכֵּל בַּדֻּגְמָה וְנַקְשִׁיב שׁוּב.';persist();render();if(task.word?.id)say([task.prompt,task.kind==='context'?`journey-context-${task.word.id}`:`he-${task.word.id}`]);else replay();return;}
    if(action==='tile'){tile(Number(b.dataset.tile));return;}
    if(action==='undo'){s().chosen.pop();persist();render();return;}
    if(action==='check'){
      const right=task.kind==='objects'?s().quantity===task.answer:s().chosen.map(id=>task.tiles.find(t=>t.id===id)?.text).join('').normalize('NFC')===task.word.pointed.normalize('NFC');
      if(right)resolved();else retry();return;
    }
    if(action==='answer'){if(b.dataset.answer===String(task.answer))resolved();else retry();return;}
    if(action==='place'){place(b.dataset.place);return;}
    if(action==='count'){const token=Number(b.dataset.token);if(!s().tokens.includes(token)){s().tokens.push(token);persist();render();say(`number-${s().tokens.length}`);}return;}
    if(action==='frame'&&Number(b.dataset.token)<task.known+s().quantity){s().quantity=Math.max(0,s().quantity-1);persist();render();return;}
    if(action==='add'||action==='frame'){s().quantity=Math.min(task.operation==='tens'?100:plan.max,s().quantity+(Number(b.dataset.amount)||1));persist();render();if(s().quantity<=20)say(`number-${s().quantity}`);return;}
    if(action==='less'){s().quantity=Math.max(0,s().quantity-Number(b.dataset.amount));persist();render();return;}
    if(action==='remove'){const n=Number(b.dataset.token);if(s().tokens.length<task.known&&!s().tokens.includes(n)){s().tokens.push(n);persist();render();say(`number-${task.total-s().tokens.length}`);}return;}
  },{signal:events.signal});
  mountDrops(root,'[data-j="tile"]','[data-word-drop]',source=>tile(Number(source.dataset.tile)),events.signal);
  mountDrops(root,'[data-j="source"]','[data-place]',(_,target)=>place(target.dataset.place),events.signal);
  mountDrops(root,'[data-j="add"]','[data-j="frame"]',source=>{if(!s().resolved){s().quantity=Math.min(plan.max,s().quantity+(Number(source.dataset.amount)||1));persist();render();}},events.signal);
  prepare();render();return {replay,destroy:()=>events.abort()};
}
