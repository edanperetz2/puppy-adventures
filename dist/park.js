import { art, pup, uiIcon } from './art.js';
import { unlockedPark } from './learning.js';
import { escapeHtml as esc } from './profiles.js';
const names={tree:'עֵץ',flower:'פֶּרַח',bench:'סַפְסָל',ball:'כַּדּוּר',pond:'בְּרֵכָה',house:'בַּיִת',flag:'דֶּגֶל',slide:'מַגְלֵשָׁה',picnic:'פִּיקְנִיק',rainbow:'קֶשֶׁת',rocket:'חֲלָלִית',sign:'שֶׁלֶט'};
const parkSvg=body=>`<svg viewBox="0 0 120 120" aria-hidden="true">${body}</svg>`;
const decorations={
 bench:parkSvg('<ellipse cx="60" cy="103" rx="47" ry="6" fill="#84945f" opacity=".2"/><path d="M26 71V100M94 71V100" stroke="#818b82" stroke-width="9" stroke-linecap="round"/><rect x="18" y="33" width="84" height="17" rx="5" fill="#d6a971"/><rect x="18" y="54" width="84" height="15" rx="4" fill="#bf8e57"/><rect x="13" y="73" width="94" height="12" rx="5" fill="#e2b986"/>'),
 slide:parkSvg('<path d="M31 100V29H60" fill="none" stroke="#a286bc" stroke-width="10" stroke-linecap="round"/><path d="M20 95L31 29M20 72H38M24 52H38" fill="none" stroke="#d8c5e6" stroke-width="6"/><path d="M58 29C58 63 75 86 101 94" fill="none" stroke="#65b6b1" stroke-width="19" stroke-linecap="round"/><path d="M58 29C58 63 75 86 101 94" fill="none" stroke="#a9d8c7" stroke-width="8" stroke-linecap="round"/><path d="M41 29L51 13L65 29Z" fill="#e8b05f"/>'),
 picnic:parkSvg('<path d="M20 59L29 101H91L100 59Z" fill="#d2a068"/><path d="M35 59C35 17 85 17 85 59" fill="none" stroke="#ac7d50" stroke-width="9"/><path d="M28 72H94M31 85H91M43 61L47 99M65 61V100M83 61L79 100" stroke="#edc592" stroke-width="4"/><path d="M20 57H101L88 73L72 57L59 74L45 58L30 76Z" fill="#edb0a5"/><path d="M40 56L48 67M64 56L72 67M85 56L93 64" stroke="#fff5e5" stroke-width="5"/>'),
 flag:parkSvg('<ellipse cx="60" cy="106" rx="30" ry="5" fill="#87976b" opacity=".2"/><path d="M42 102V15" stroke="#b69870" stroke-width="7" stroke-linecap="round"/><path d="M46 20Q66 7 80 20T105 20V59Q86 71 73 58T46 59Z" fill="#ad94cb"/><path d="M69 27L72 35L81 36L74 42L76 51L69 46L61 51L63 42L57 36L66 35Z" fill="#ffecbb"/>'),
};
export function parkArt(type,name=''){
  if(type==='sign')return `<span class="park-sign"><b>הַפָּארְק שֶׁל<br>${esc(name)}</b><i></i></span>`;
  if(decorations[type])return decorations[type];
  if(type==='pond')return '<span class="park-pond" aria-hidden="true">≈</span>';
  return art(type);
}
export function mountPark(root,{learner,stickers,name,speak,onHome}) {
  const events=new AbortController(),available=unlockedPark(stickers);let selected=available[0];
  const render=()=>{
    root.innerHTML=`<div class="journey-top"><button data-p="home" class="text-button">${uiIcon('home')} לְבֵית הַחֲבֵרִים</button><span>${learner.getCode()?learner.pending?'הַשִּׁנּוּיִים שְׁמוּרִים בַּמַּכְשִׁיר · מְחַכִּים לְחִבּוּר':learner.status==='synced'?'הַפָּארְק שָׁמוּר בָּאַלְבּוֹם הַמְּשֻׁתָּף':'הַפָּארְק שָׁמוּר בַּמַּכְשִׁיר':'הַפָּארְק שָׁמוּר בַּמַּכְשִׁיר הַזֶּה'}</span></div>
      <section class="park-heading"><div><span class="section-kicker">מְשַׂחֲקִים וּבוֹנִים בַּדִּמְיוֹן</span><h1 tabindex="-1">הַפָּארְק שֶׁל <bdi data-learning-text>${esc(name)}</bdi></h1><p>בּוֹחֲרִים קִשּׁוּט וְנוֹגְעִים בַּדֶּשֶׁא. נוֹגְעִים שׁוּב כְּדֵי לְהַחְלִיף.</p></div>${pup('tofi')}</section>
      <div class="puppy-park" role="group" aria-label="הפארק שלי · ארבעים מקומות לבנייה"><div class="park-sky">☀ <span>☁</span> ☁</div><div class="park-grid" dir="ltr">${Array.from({length:40},(_,cell)=>{const type=learner.park[cell]?.type;return `<button data-p="cell" data-cell="${cell}" aria-label="מקום ${cell+1}${type?` · ${names[type]}`:' פנוי'}">${type?parkArt(type,name):'<span>+</span>'}</button>`;}).join('')}</div><div class="park-friends">${pup('luli')}${pup('bobi')}${pup('tofi')}</div></div>
      <div class="park-tray" role="group" aria-label="קישוטים לבחירה">${Object.keys(names).map(type=>`<button data-p="select" data-type="${type}" aria-pressed="${selected===type}" ${available.includes(type)?'':'disabled'}>${parkArt(type,name)}<span>${names[type]}</span>${available.includes(type)?'':`<small>עוֹד ${Math.max(0,(Object.keys(names).indexOf(type)-2)*3-stickers)} מַדְבֵּקוֹת</small>`}</button>`).join('')}<button data-p="select" data-type="" aria-pressed="${selected===''}">${uiIcon('again')} מְפַנִּים מָקוֹם</button></div>
      <p class="parent-note">הַקִּשּׁוּטִים נִפְתָּחִים עִם הַמַּדְבֵּקוֹת. אֶפְשָׁר לִבְנוֹת כַּמָּה שֶׁרוֹצִים, בְּלִי לְבַזְבֵּז מַדְבֵּקוֹת.</p>`;
  };
  root.addEventListener('click',e=>{const b=e.target.closest('[data-p]');if(!b||b.disabled)return;if(b.dataset.p==='home'){onHome();return;}if(b.dataset.p==='select'){selected=b.dataset.type;render();return;}if(b.dataset.p==='cell'){learner.decorate(Number(b.dataset.cell),selected);render();}}, {signal:events.signal});
  render();speak('journey-park-intro');return {update:render,destroy:()=>events.abort()};
}
