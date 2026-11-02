// Practice history is evidence of an activity, never a diagnosis or a score.
export const LEARNING_KEY = 'learning-state';
export const DAY = 86400000;
export const PARK_TYPES = ['tree','flower','bench','ball','pond','house','flag','slide','picnic','rainbow','rocket','sign'];
export const itemId = value => typeof value === 'string' && /^[a-z0-9:._-]{1,96}$/.test(value);
const domains = ['hebrew','english','letters','math','clock'];
export function cleanItem(value) {
  const n = key => Math.min(1000000, Math.max(0, Math.floor(Number(value?.[key]) || 0)));
  return { domain: domains.includes(value?.domain) ? value.domain : 'hebrew', seen:n('seen'), helped:n('helped'), independent:n('independent'), practice:n('practice'), first:nTime(value?.first), last:nTime(value?.last), success:nTime(value?.success), firstSuccess:nTime(value?.firstSuccess), days:[...new Set((Array.isArray(value?.days) ? value.days : []).filter(d=>/^\d{4}-\d{2}-\d{2}$/.test(d)))].sort().slice(-8), mode: /^[a-z-]{1,20}$/.test(value?.mode || '') ? value.mode : '' };
}
const nTime = n => Number.isSafeInteger(n) && n > 0 && n < 9999999999999 ? n : 0;
export function cleanItems(input) {
  return Object.fromEntries(Object.entries(input && typeof input === 'object' ? input : {}).filter(([id])=>itemId(id)).slice(0,2048).map(([id,value])=>[id,cleanItem(value)]));
}
export function applyObservation(items, event) {
  if (!itemId(event?.item) || !domains.includes(event.domain) || !['seen','helped','independent','practice'].includes(event.kind) || !nTime(event.at)) return items;
  if (!items[event.item] && Object.keys(items).length >= 2048) return items;
  const old = cleanItem(items[event.item]), at = event.at;
  const next = { ...old, domain:event.domain, ...(event.kind==='seen'?{}:{[event.kind]:Math.min(1000000,old[event.kind]+1)}), seen:Math.min(1000000,old.seen+(event.kind==='seen'||event.kind==='practice'||!old.seen?1:0)), first:old.first ? Math.min(old.first,at) : at, last:Math.max(old.last,at), mode:event.mode || old.mode };
  if (event.kind === 'independent') {
    next.firstSuccess = old.firstSuccess ? Math.min(old.firstSuccess,at) : at;
    next.success = Math.max(old.success,at);
    next.days = [...new Set([...old.days,new Date(at).toISOString().slice(0,10)])].sort().slice(-8);
  }
  return { ...items, [event.item]:next };
}
export function learningStage(item) {
  if (!item?.seen) return 'new';
  if (!item.practice && !item.independent && !item.helped) return 'seen';
  if (item.practice && !item.independent && !item.helped) return 'practice';
  if (!item.independent) return 'supported';
  return item.days.length >= 2 && item.success-item.firstSuccess >= 20*3600000 ? 'remembered' : 'independent';
}
export function reviewPriority(item, now=Date.now()) {
  if (!item?.seen) return 3;
  if (learningStage(item)==='practice') return 2;
  const interval = [1,2,4,7,14][Math.min(4,Math.max(0,item.days.length-1))]*DAY;
  return (now-item.last)/interval + (item.helped >= item.independent ? 2 : 0);
}
export function choosePractice(pool, items, key, count=10, now=Date.now(), rng=Math.random) {
  const ranked=pool.map(value=>({value,priority:reviewPriority(items[key(value)],now),tie:rng()})).sort((a,b)=>b.priority-a.priority || a.tie-b.tie);
  return ranked.slice(0,count).map(x=>x.value);
}
export function learningSummary(items, domain=null, now=Date.now()) {
  const entries=Object.entries(items).filter(([,v])=>!domain || v.domain===domain);
  return { seen:entries.length, supported:entries.filter(([,v])=>learningStage(v)==='supported').length, independent:entries.filter(([,v])=>learningStage(v)==='independent').length, remembered:entries.filter(([,v])=>learningStage(v)==='remembered').length, practice:entries.filter(([,v])=>learningStage(v)==='practice').length, review:entries.filter(([,v])=>learningStage(v)!=='practice'&&now-v.last>=DAY&&reviewPriority(v,now)>=1).sort((a,b)=>reviewPriority(b[1],now)-reviewPriority(a[1],now)).slice(0,4).map(([id])=>id) };
}
export function englishPairsReady(items) {
  const known=Object.entries(items).filter(([id,v])=>id.startsWith('english:single:') && v.independent>=2);
  return known.length>=8 && new Set(known.flatMap(([,v])=>v.days)).size>=2;
}
export function questionLearning(q) {
  if(q.type==='read')return {item:`read:${q.word.id}`,domain:'hebrew'};
  if(q.type==='listen')return {item:`english:single:${q.target.id}`,domain:'english'};
  if(q.type==='letter')return {item:`letter:${q.letter.language}:${q.letter.id}:recognition`,domain:'letters'};
  if(q.type==='clock')return {item:`clock:${q.time.hour}:${q.time.minute}`,domain:'clock'};
  if(q.type==='character')return {item:`character:${q.character.id}:${q.direction}`,domain:'hebrew'};
  return {item:`math:${q.type}:${q.a}:${q.b}`,domain:'math'};
}
export function cleanPark(input) {
  return Object.fromEntries(Object.entries(input || {}).filter(([cell,v])=>/^([0-9]|[12][0-9]|3[0-9])$/.test(cell) && (PARK_TYPES.includes(v?.type)||v?.type==='') && nTime(v.at) && /^[a-z0-9-]{1,64}$/.test(v.nonce||'')).map(([cell,v])=>[cell,{type:v.type,at:v.at,nonce:v.nonce}]));
}
export function mergePark(base, changes) {
  const next={...cleanPark(base)};
  for(const [cell,v] of Object.entries(cleanPark(changes))) {
    const old=next[cell]; if(!old || v.at>old.at || v.at===old.at && v.nonce>old.nonce)next[cell]=v;
  }
  return next;
}
export function unlockedPark(stickers) { return PARK_TYPES.slice(0,Math.min(PARK_TYPES.length,3+Math.floor(stickers/3))); }
