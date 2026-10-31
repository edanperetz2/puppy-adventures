import { analogClock } from './clock.js';
import { clockParts, pointAngle, angleDelta, dragMinute, dragHour, setClockHour, learningTime } from './clock-learning.js';

// A single time drives both hands. Pointer capture keeps a finger attached to
// its hand outside the circle; only the handles suppress page scrolling.
export function mountClockDial(root, { total = 0, hand = 'both', minutes = false, sector = false, onChange = () => {}, onNumber = () => {}, onSelect = () => {}, onPaint = () => {} } = {}) {
  let selected = hand === 'minute' ? 'minute' : 'hour', drag = null, animation = null, destroyed = false;
  const enabled = kind => hand === 'both' || hand === kind;
  root.innerHTML = `<div class="teaching-clock" dir="ltr">${analogClock(12,0)}<div class="teaching-numbers">${Array.from({length:12},(_,i)=>{
    const n=i+1,a=n*Math.PI/6;return `<button type="button" data-dial-number="${n}" style="left:${50+94/280*100*Math.sin(a)}%;top:${50-94/280*100*Math.cos(a)}%" aria-label="המספר ${n}"></button>`;
  }).join('')}</div>${['hour','minute'].map(kind=>`<button type="button" class="clock-grip ${kind}-grip" role="slider" aria-label="${kind==='hour'?'המחוג הקצר — שעות':'המחוג הארוך — דקות'}" aria-valuemin="${kind==='hour'?1:0}" aria-valuemax="${kind==='hour'?12:59}" aria-orientation="horizontal" data-clock-grip="${kind}" ${enabled(kind)?'':'disabled'}></button>`).join('')}</div>`;
  const stage = root.querySelector('.teaching-clock'), svg = root.querySelector('svg');
  stage.insertAdjacentHTML('beforeend','<span class="clockwise-cue" aria-label="מסובבות בכיוון השעון">↻</span>');
  const sectorNode = document.createElementNS('http://www.w3.org/2000/svg','path');
  sectorNode.setAttribute('class','clock-learning-sector');
  svg.querySelector('circle:nth-child(3)').after(sectorNode);
  if(minutes) svg.insertAdjacentHTML('beforeend', `<g class="clock-minute-labels">${Array.from({length:12},(_,i)=>{const a=(i+1)*Math.PI/6;return `<text x="${140+115*Math.sin(a)}" y="${144-115*Math.cos(a)}" text-anchor="middle" direction="ltr">${(i+1)*5}</text>`;}).join('')}</g>`);
  const abort = new AbortController(), options = { signal:abort.signal };
  function paint() {
    const parts=clockParts(total), angle={hour:total/2,minute:total*6};
    for(const kind of ['hour','minute']) {
      svg.querySelector(`.clock-${kind}-hand`).setAttribute('transform',`rotate(${angle[kind]} 140 140)`);
      const grip=root.querySelector(`[data-clock-grip=${kind}]`), a=angle[kind]*Math.PI/180, r=kind==='hour'?56:87;
      grip.style.left=`${50+r/280*100*Math.sin(a)}%`;grip.style.top=`${50-r/280*100*Math.cos(a)}%`;
      grip.setAttribute('aria-valuenow',String(parts[kind]));grip.setAttribute('aria-valuetext',`${kind==='hour'?'שעה':'דקות'} ${parts[kind]}`);
      grip.classList.toggle('selected',kind===selected);
    }
    const m=((total%60)+60)%60, a=m*Math.PI/30;
    sectorNode.setAttribute('d',sector&&m>0?`M140 140 L140 34 A106 106 0 ${m>30?1:0} 1 ${140+106*Math.sin(a)} ${140-106*Math.cos(a)} Z`:'');
    for(const button of root.querySelectorAll('[data-dial-number]')) button.classList.toggle('dial-selected',Number(button.dataset.dialNumber)===(selected==='hour'?parts.hour:parts.minute/5||12));
    onPaint(total);
  }
  function set(value, commit = true) { total=value;paint(); if(commit)onChange(total); }
  function select(kind) { if(enabled(kind)){selected=kind;paint();onSelect(kind);} }
  function angle(event) {const r=stage.getBoundingClientRect(),x=event.clientX-r.left-r.width/2,y=event.clientY-r.top-r.height/2;return Math.hypot(x,y)<r.width*.08?null:pointAngle(x,y);}
  root.addEventListener('pointerdown',event=>{
    const grip=event.target.closest('[data-clock-grip]');if(!grip||grip.disabled||drag||event.button!==0)return;
    const a=angle(event);if(a===null)return;cancelDemo();select(grip.dataset.clockGrip);
    drag={id:event.pointerId,kind:selected,start:total,last:a,degrees:0,grip};grip.setPointerCapture(event.pointerId);stage.classList.add('dragging');event.preventDefault();
  },options);
  root.addEventListener('pointermove',event=>{
    if(!drag||drag.id!==event.pointerId)return;const a=angle(event);if(a===null)return;
    drag.degrees+=angleDelta(drag.last,a);drag.last=a;
    set(drag.kind==='minute'?dragMinute(drag.start,drag.degrees):dragHour(total,a,hand==='hour'?60:1));event.preventDefault();
  },options);
  const release=event=>{if(!drag||drag.id!==event.pointerId)return; const grip=drag.grip;drag=null;stage.classList.remove('dragging');if(grip.hasPointerCapture(event.pointerId))grip.releasePointerCapture(event.pointerId);};
  root.addEventListener('pointerup',release,options);root.addEventListener('pointercancel',release,options);root.addEventListener('lostpointercapture',release,options);
  root.addEventListener('click',event=>{
    const button=event.target.closest('[data-dial-number]');if(!button)return;cancelDemo();const n=Number(button.dataset.dialNumber);
    if(hand==='face'){onNumber(n);return;}
    set(selected==='hour'?setClockHour(total,n):Math.floor(total/60)*60+(n%12)*5);
  },options);
  root.addEventListener('keydown',event=>{
    const grip=event.target.closest('[data-clock-grip]');if(!grip||grip.disabled)return;
    const kind=grip.dataset.clockGrip, step=kind==='hour'?60:1;
    if(['ArrowRight','ArrowUp','ArrowLeft','ArrowDown','Home','End'].includes(event.key)){
      event.preventDefault();cancelDemo();select(kind);
      if(event.key==='Home'||event.key==='End')set(kind==='hour'?setClockHour(total,event.key==='Home'?1:12):Math.floor(total/60)*60+(event.key==='Home'?0:59));
      else set(total+(['ArrowRight','ArrowUp'].includes(event.key)?step:-step));
    }
  },options);
  function cancelDemo(){if(animation){cancelAnimationFrame(animation.frame);clearTimeout(animation.timer);animation=null;}stage.classList.remove('demonstrating');}
  function demo(from,to,motion=true,onEnd=()=>{}){
    cancelDemo();const before=total;stage.classList.add('demonstrating');const start=performance.now();animation={frame:0,timer:0};
    const finish=()=>{if(destroyed||!animation)return;animation.timer=setTimeout(()=>{if(destroyed)return;animation=null;set(before,false);stage.classList.remove('demonstrating');onEnd();},motion?900:4500);};
    const tick=now=>{if(destroyed||!animation)return;const t=Math.min(1,(now-start)/3600);set(from+(to-from)*t,false);if(t<1)animation.frame=requestAnimationFrame(tick);else finish();};
    if(motion)animation.frame=requestAnimationFrame(tick);else{set(to,false);finish();}
  }
  paint();
  return {get total(){return total;},set:(n)=>set(n,false),select,step:(kind,direction)=>{if(enabled(kind)){cancelDemo();select(kind);set(total+(kind==='hour'?60:1)*direction);}},demo,cancelDemo,destroy(){destroyed=true;cancelDemo();if(drag){const d=drag;drag=null;if(d.grip.hasPointerCapture(d.id))d.grip.releasePointerCapture(d.id);}abort.abort();},time:()=>learningTime(total)};
}
