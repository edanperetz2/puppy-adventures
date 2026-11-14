import { letterShape } from './letters.js';
import { uiIcon } from './art.js';
import { cleanInk, mountInkPad } from './ink-pad.js?v=2.3.3-dictation';
export { cleanInk };
export const WRITING_STEPS={trace:'עוֹקְבִים עַל הַקַּו',copy:'מַעְתִּיקִים לְיַד הַדֻּגְמָה',memory:'מְנַסִּים מֵהַזִּכָּרוֹן',paper:'כּוֹתְבִים עַל דַּף'};
export function mountFreeWriting(root,{letter,mode='copy',saved={},onSave=()=>{},onComplete=()=>{},speak=()=>{}}) {
  const events=new AbortController();let lines=cleanInk(saved.lines),hidden=mode==='memory'&&saved.hidden===true,done=saved.done===true,pad;
  const save=()=>onSave({lines,hidden,done});
  const canDraw = () => !done && (mode !== 'memory' || hidden);
  const updateFinish = () => { root.querySelector('[data-w="done"]').disabled = !canDraw() || mode !== 'paper' && !pad?.hasInk(); };
  function render(){pad?.destroy();root.innerHTML=`<p class="journey-instruction">${mode==='copy'?'נִסְתַּכֵּל בַּדֻּגְמָה וְנִכְתֹּב לְצִדָּהּ.':mode==='memory'?'נִסְתַּכֵּל בָּאוֹת. כְּשֶׁמוּכָנִים, נַסְתִּיר אוֹתָהּ וְנַנְסֶה לִכְתֹּב.':'נִקַּח דַּף וְעִפָּרוֹן וְנִכְתֹּב אֶת הָאוֹת.'}</p><div class="free-writing-model ${hidden?'model-hidden':''}">${hidden?'<span>?</span>':letterShape(letter)}</div>${mode==='memory'?`<button data-w="hide" class="secondary-button">${hidden?'מְצִיצִים בַּדֻּגְמָה':'מוּכָנִים! מַסְתִּירִים אֶת הַדֻּגְמָה'}</button>`:''}
    ${mode==='paper'?`<div class="paper-writing">${uiIcon('pencil')}<p>אֶפְשָׁר גַּם לִכְתֹּב אֶת הָאוֹת בַּשֵּׁם שֶׁלָּנוּ אוֹ בְּשֶׁלֶט לַפָּארְק.</p></div>`:`<svg class="free-writing-pad" viewBox="0 0 320 320" role="img" aria-label="משטח כתיבה חופשי"><rect width="320" height="320" rx="16" fill="#fffef9"/><path d="M15 65H305M15 160H305M15 260H305" stroke="#dededc" stroke-dasharray="6 7"/><g class="free-ink" fill="none" stroke="#7251a2" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"></g></svg>`}
    <div class="journey-controls">${true?`<button data-w="clear" class="secondary-button">${uiIcon('again')} ${mode==='paper'?'מְתַרְגְּלִים עוֹד פַּעַם':'דַּף חָדָשׁ'}</button>`:''}<button class="primary-button" data-w="done">${done?'הַתִּרְגּוּל נִשְׁמַר ✓':'סִיַּמְנוּ לְתַרְגֵּל'}</button></div><p class="parent-note" role="status">${done?'התמדה יפה! אפשר להסתכל יחד עם הורה על מה שכתבנו.':'זהו מרחב לתרגול. המשחק אינו בודק את צורת האות שצוירה.'}</p>`;
    const svg = root.querySelector('.free-writing-pad');
    if (svg) pad = mountInkPad(svg, { saved: lines, canDraw, onChange: ink => { lines = ink; updateFinish(); save(); } });
    updateFinish();
  }
  root.addEventListener('click',e=>{const b=e.target.closest('[data-w]');if(!b||b.disabled)return;if(b.dataset.w==='clear'){lines=[];done=false;save();render();}if(b.dataset.w==='hide'){hidden=!hidden;save();render();}if(b.dataset.w==='done'){done=true;save();onComplete(mode);render();speak('journey-practice');}},{signal:events.signal});
  render();return{destroy:()=>{events.abort();pad?.destroy();save();}};
}
