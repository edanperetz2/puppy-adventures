import { art, uiIcon } from './art.js';
import { trialRecording } from './trial-voice.js';
import { scienceGames } from './trial-science.js';
import { boatyardGames } from './trial-boatyard.js';
import { numberGames } from './trial-numbers.js';
import { theaterGames, mountTrialStudio } from './trial-theater.js';
import { escapeHtml } from './profiles.js';
import { mountDrag, mountTouchControls } from './drag.js';

export const TRIAL_AREAS = [
  { id:'science', title:'מַעְבֶּדֶת הַמַּדָּע', icon:'cup', games:scienceGames },
  { id:'boatyard', title:'בּוֹנוֹת סִירָה עִם לוּלִי', icon:'boat', games:boatyardGames },
  { id:'theater', title:'תֵּאַטְרוֹן הַחֲבֵרִים', icon:'door', games:theaterGames },
  { id:'numbers', title:'מִסְפָּרִים עִם חֲבֵרִים', icon:'apple', games:numberGames },
];
export const TRIAL_CUES = { hub:'מָה תִּרְצִי לְנַסּוֹת?', area:'בַּחֲרִי מִשְׂחָק.', finish:'סִיַּמְתְּ! כָּל הַכָּבוֹד!', retry:'נַסִּי שׁוּב.' };
const strip = text => text.normalize('NFD').replace(/[\u0591-\u05bd\u05bf-\u05c7]/gu,'').normalize('NFC');

const stepsFor = (game, variant) => variant ? game.variants[variant - 1] : game.steps;
function randomSeed() { return crypto.getRandomValues(new Uint32Array(1))[0]; }
export function newTrialRound(game, previous, seed = randomSeed()) {
  const count = 1 + (game.variants?.length || 0);
  const variant = count === 1 ? 0 : previous ? (previous.variant + 1 + seed % (count - 1)) % count : seed % count;
  return { version:1, seed, variant, answers:[], selected:null, finished:false };
}
export function restoreTrialRound(game, raw) {
  if (!raw || raw.version !== 1 || !Number.isSafeInteger(raw.seed) || raw.seed < 0 || raw.seed > 0xffffffff ||
    !Number.isInteger(raw.variant) || raw.variant < 0 || raw.variant > (game.variants?.length || 0) || !Array.isArray(raw.answers)) return null;
  const steps = stepsFor(game, raw.variant);
  const valid = (step, id) => step?.choices.some(choice => choice.id === id) && (!step.correct || step.correct.includes(id));
  if (raw.answers.length > steps.length || raw.answers.some((id,i)=>!valid(steps[i],id))) return null;
  if (raw.selected != null && !valid(steps[raw.answers.length],raw.selected)) return null;
  return { version:1, seed:raw.seed, variant:raw.variant, answers:[...raw.answers], selected:raw.selected ?? null, finished:raw.answers.length===steps.length };
}
export function trialChoices(choices, seed, index) {
  const result = [...choices];
  let state = (seed ^ Math.imul(index + 1, 2654435761)) >>> 0;
  for(let i=result.length-1;i>0;i--){
    state=(Math.imul(1664525,state)+1013904223)>>>0;
    const j=Math.floor(state / 4294967296 * (i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
const keyFor = (area,id) => 'puppy-trial-v1:'+area+':'+id;
export function clearTrialSaves(storage) {
  for(const area of TRIAL_AREAS) for(const game of area.games) storage.removeItem(keyFor(area.id,game.id));
}

export function mountTrialPath(root, {storage,route,nikud,motion,sound,enableSound,say,stop,home}) {
  const text = value => escapeHtml(nikud ? value : strip(value));
  let studio, draft, retry = '', lastLine = '', storageProblem = false;
  let area, game, soundEffect, speechSequence=0;
  const read = (areaId,gameId) => {
    try { return JSON.parse(storage.getItem(keyFor(areaId,gameId))); } catch { return null; }
  };
  function save(value){
    try { storage.setItem(keyFor(area.id,game.id),JSON.stringify(value)); storageProblem=false; return true; }
    catch { storageProblem=true; return false; }
  }
  function silenceEffect() { speechSequence++; soundEffect?.pause(); soundEffect=null; }
  function speak(line, effect) {
    silenceEffect(); lastLine=line;
    const sequence=speechSequence;
    const recording=trialRecording(line);
    const playback=say(area && !game && line===area.title ? [recording,trialRecording(TRIAL_CUES.area)] : recording);
    if(effect && sound())void Promise.resolve(playback).then(played=>{
      if(!played || sequence!==speechSequence || !sound() || document.hidden || document.querySelector('dialog[open]'))return;
      soundEffect=new Audio(effect);soundEffect.volume=.4;void soundEffect.play().catch(()=>{});
    });
    return playback;
  }
  function prompt(){ return stepsFor(game,draft.variant)[draft.answers.length]; }
  function result(step) { return typeof step.result === 'function' ? step.result(draft.selected,draft.answers) : step.result; }
  function focusHeading() { root.querySelector('h1')?.focus({preventScroll:true}); }
  function scrollUp() { window.scrollTo({top:0,behavior:'auto'}); focusHeading(); }
  const back = label => `<button type="button" class="text-button back-button" data-trial-back>${uiIcon('arrow')} ${text(label)}</button>`;
  const listen = (label,attr='data-action="replay"') => `<button type="button" class="circle-button trial-listen" ${attr} aria-label="${text(label)}">${uiIcon('sound')}</button>`;
  function heading(label) {
    return `<div class="trial-heading"><h1 tabindex="-1">${text(label)}</h1>${listen('שמיעה חוזרת')}</div>`;
  }
  function menuCard(id,title,icon,status='',areaId='') {
    const which=areaId?'area':'game';
    return `<div class="trial-card trial-color-${areaId||area.id}"><button class="trial-open" type="button" data-trial-${which}="${id}">
      <span class="trial-art" aria-hidden="true">${areaId ? areaPicture(areaId) : art(icon)}</span><span><strong>${text(title)}</strong>${status?`<small>${text(status)}</small>`:''}</span>${uiIcon('arrow')}</button>
      ${listen('שמיעה · '+title,'data-trial-name="'+id+'"')}</div>`;
  }
  function draw() {
    area=TRIAL_AREAS.find(item=>item.id===route.area);
    game=area?.games.find(item=>item.id===route.game);
    root.dataset.area=area?.id||'hub';
    if (!area) {
      root.innerHTML=back('לַבַּיִת')+heading('ניסיון')+`<div class="trial-grid">${TRIAL_AREAS.map(a=>menuCard(a.id,a.title,a.icon,'',a.id)).join('')}</div>`;
      lastLine=TRIAL_CUES.hub; return;
    }
    if (!game) {
      root.innerHTML=back('לַנִּסָּיוֹן')+heading(area.title)+`<div class="trial-grid">${area.games.map(g=>{
        const saved = !g.studio && restoreTrialRound(g,read(area.id,g.id));
        const status = saved?.finished ? 'שׁוּב מֵהַהַתְחָלָה' : saved ? `מַמְשִׁיכוֹת · ${saved.answers.length+1}/6` : '';
        return menuCard(g.id,g.title,g.icon,status);
      }).join('')}</div>`;
      lastLine=area.title;return;
    }
    if (game.studio) {
      studio=mountTrialStudio(root,{state:read(area.id,game.id)||{},save,say:speak,exit:()=>navigate(area.id),nikud,motion,sound,enableSound});
      return;
    }
    if(draft.finished) {
      root.innerHTML=back(area.title)+`<section class="trial-finish">${art(game.icon)}${heading(TRIAL_CUES.finish)}
      <button class="primary-button" data-trial-back>${text('לְעוֹד מִשְׂחָק')} ${uiIcon('arrow')}</button>
      <button class="secondary-button" data-trial-again>${uiIcon('again')} ${text('שׁוּב מֵהַהַתְחָלָה')}</button></section>`;
      lastLine=TRIAL_CUES.finish; return;
    }
    const step=prompt(), selected=draft.selected, index=draft.answers.length;
    const choices=trialChoices(step.choices,draft.seed,index);
    const scene=typeof step.scene==='function'?step.scene(draft.answers,selected,draft.seed):step.scene;
    const renderedScene = nikud ? scene : strip(scene);
    const feedback=selected ? result(step) : retry;
    root.innerHTML=back(area.title)+`<div class="trial-counter">${text(game.title)} · ${index+1}/6</div>${heading(step.prompt)}
      <section class="trial-stage">${renderedScene}</section>
      ${step.direct?'':`<div class="trial-options">${choices.map(c=>{
        const picture=c.art?.startsWith('<')?c.art:c.art?art(c.art):'';
        return `<button type="button" class="trial-choice${selected===c.id?' trial-selected':''}" data-trial-choice="${c.id}" aria-label="${text(c.ariaLabel||c.label)}" ${selected?'disabled':''}>
          ${picture?`<span class="trial-choice-art" aria-hidden="true">${picture}</span>`:''}${c.label?`<span>${text(c.label)}</span>`:''}</button>`;
      }).join('')}</div>`}
      <div class="trial-response"><p role="status">${feedback?text(feedback):''}</p>
      ${selected?`<button type="button" class="primary-button" data-trial-next>${text(index===5?'סִיַּמְתִּי':'מַמְשִׁיכוֹת')} ${uiIcon('arrow')}</button>`:''}</div>
      ${storageProblem?'<p role="status">השמירה במכשיר אינה זמינה כרגע.</p>':''}`;
    if(selected)root.querySelectorAll('[data-trial-choice]').forEach(el=>el.disabled=true);
    lastLine=feedback||step.prompt;
  }
  function cleanupStudio(){studio?.destroy(); studio=null;}
  function navigate(areaId=null,gameId=null,restart=false){
    cleanupStudio();silenceEffect();stop();retry='';
    Object.assign(route,{area:areaId,game:gameId});
    const target=TRIAL_AREAS.find(a=>a.id===areaId)?.games.find(g=>g.id===gameId);
    if(target&&!target.studio){
      const saved=restoreTrialRound(target,read(areaId,gameId));
      draft=saved&&!saved.finished&&!restart?saved:newTrialRound(target,saved);
      area=TRIAL_AREAS.find(a=>a.id===areaId);game=target;save(draft);
    }
    draw();scrollUp();
    if(!target?.studio)void speak(lastLine);
  }
  function choose(id) {
    if(!game || game.studio || draft.finished || draft.selected)return;
    const step=prompt();
    if(!step.choices.some(c=>c.id===id))return;
    if(step.correct&&!step.correct.includes(id)){
      retry=step.hint||TRIAL_CUES.retry;
      root.querySelector('.trial-response [role="status"]').textContent=nikud?retry:strip(retry);
      void speak(retry);return;
    }
    draft.selected=id;retry='';save(draft);draw();void speak(lastLine,step.soundEffect);
    root.querySelector('[data-trial-next]')?.focus({preventScroll:true});
  }
  const events=new AbortController();
  // Touch browsers can omit the first compatibility click following a drop.
  // Trigger the tapped control on release, and let keyboard/mouse clicks work normally.
  const touchControls=mountTouchControls(root,'button:not([data-trial-drag])',button=>button.click(),events.signal);
  root.addEventListener('click',event=>{
    if(touchControls.accepts(event))return;
    event.preventDefault();event.stopImmediatePropagation();
  },{capture:true,signal:events.signal});
  const allowClick=mountDrag(root,{
    sources:'button[data-trial-drag]',targets:'[data-trial-drop]',signal:events.signal,
    onDrop:(button,target)=>{
      if(!target.dataset.trialDrop || target.dataset.trialDrop===button.dataset.trialChoice)choose(button.dataset.trialChoice);
    },
    onTouchTap:button=>choose(button.dataset.trialChoice),
  });
  function click(event){
    const b=event.target.closest('button');
    if(!b||!root.contains(b)||b.disabled||!allowClick(event,b))return;
    if(b.hasAttribute('data-trial-back')) { if(game)navigate(area.id);else if(area)navigate();else home();return; }
    if(b.dataset.trialName){
      silenceEffect(); enableSound();
      const label=(area?area.games:TRIAL_AREAS).find(item=>item.id===b.dataset.trialName)?.title;
      if(label)void say(trialRecording(label));
    } else if(b.dataset.trialArea)navigate(b.dataset.trialArea);
    else if(b.dataset.trialGame)navigate(area.id,b.dataset.trialGame);
    else if(b.hasAttribute('data-trial-again'))navigate(area.id,game.id,true);
    else if(b.hasAttribute('data-trial-next')&&draft?.selected){
      draft.answers.push(draft.selected);draft.selected=null;draft.finished=draft.answers.length===6;retry='';
      save(draft);draw();scrollUp();void speak(lastLine);
    } else if(b.dataset.trialChoice)choose(b.dataset.trialChoice);
  }
  const active=TRIAL_AREAS.find(a=>a.id===route.area)?.games.find(g=>g.id===route.game);
  if(active&&!active.studio)draft=restoreTrialRound(active,read(route.area,active.id))||newTrialRound(active);
  root.addEventListener('click',click,{signal:events.signal});draw();
  return {
    replay() {
      if(studio)return studio.replay();
      if(game && !draft.finished && !draft.selected)return speak(prompt().prompt);
      return speak(lastLine);
    },
    pause(){silenceEffect();studio?.pause();},
    destroy(){silenceEffect();cleanupStudio();events.abort();},
  };
}

function areaPicture(id) {
  if (id==='boatyard' || id==='theater') return `<img alt="" src="./assets/${id==='boatyard'?'boatyard-harbor':'theater-stage'}.webp">`;
  if (id==='science') return '<span class="trial-tank-mini"><i></i><b></b></span>';
  return `<span class="trial-math-mini">${art('plate')}${art('apple')}${art('apple')}</span>`;
}
