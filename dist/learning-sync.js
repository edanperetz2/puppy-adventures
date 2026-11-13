import { LEARNING_KEY, applyObservation, cleanItems, cleanPark, mergePark } from './learning.js';
import { normalizeCode } from './sync.js?v=2.2.2-six';
import { SyncRetry, rateLimitError } from './sync-retry.js';

const uuid = () => globalThis.crypto.randomUUID();
export class LearningStore {
  constructor({storage,config,getCode=()=>null,fetcher=globalThis.fetch.bind(globalThis),onChange=()=>{},now=Date.now,retryOptions={}}) {
    Object.assign(this,{storage,config,getCode,fetcher,onChange,now}); this.inflight=null; this.generation=0; this.status='local'; this.again=false;
    this.retry=new SyncRetry({...retryOptions,storage,key:`${LEARNING_KEY}-retry`});
    let saved; try{saved=JSON.parse(storage.getItem(LEARNING_KEY)||'null');}catch{/* Local play stays available. */}
    this.state={writer: /^[0-9a-f-]{36}$/i.test(saved?.writer||'')?saved.writer:uuid(), seq: Number.isSafeInteger(saved?.seq)?saved.seq:0, code:normalizeCode(saved?.code), remote:cleanItems(saved?.remote), pending:Array.isArray(saved?.pending)?saved.pending.filter(e=>Number.isSafeInteger(e.seq)&&e.seq>0).slice(0,20000):[], park:cleanPark(saved?.park), parkPending:cleanPark(saved?.parkPending), receipt:Number.isSafeInteger(saved?.receipt)?saved.receipt:0, receipts:Array.isArray(saved?.receipts)?saved.receipts.filter(id=>typeof id==='string'&&id.length<160).slice(-10000):[]};
  }
  get items(){const old=this.cache;if(old&&old.remote===this.state.remote&&old.seq===this.state.seq&&old.length===this.state.pending.length)return old.items;let items=this.state.remote;for(const e of this.state.pending)items=applyObservation(items,e);this.cache={remote:this.state.remote,seq:this.state.seq,length:this.state.pending.length,items};return items;}
  get park(){return mergePark(this.state.park,this.state.parkPending);}
  get pending(){return this.state.pending.length+Object.keys(this.state.parkPending).length;}
  persist(){try{this.storage.setItem(LEARNING_KEY,JSON.stringify(this.state));return true;}catch{this.status='storage-error';return false;}}
  notify(){this.onChange(this);}
  record(info,kind='independent',mode='') {
    if(info.eventId && this.state.receipts.includes(info.eventId))return;
    const event={...info,kind,mode,at:this.now(),seq:this.state.seq+1};
    if(applyObservation({},event)[event.item] && this.state.pending.length<20000){this.state.seq++;this.state.pending.push(event);if(info.eventId)this.state.receipts=[...this.state.receipts,info.eventId].slice(-10000);this.status=this.getCode()?'pending':'local';this.persist();this.notify();void this.flush();}
  }
  decorate(cell,type) {
    const patch=cleanPark({[cell]:{type,at:this.now(),nonce:uuid()}}); if(!Object.keys(patch).length)return;
    this.state.parkPending=mergePark(this.state.parkPending,patch);this.status=this.getCode()?'pending':'local';this.persist();this.notify();void this.flush();
  }
  reset(){this.generation++;this.retry.clear();this.again=false;this.state={writer:uuid(),seq:0,code:null,remote:{},pending:[],park:{},parkPending:{},receipt:0,receipts:[]};this.status='local';this.persist();this.notify();}
  flush(){
    const code=normalizeCode(this.getCode());
    if(!code){if(this.inflight)this.generation++;this.retry.clear();this.again=false;this.status='local';return Promise.resolve();}
    if(this.inflight){this.again=true;return this.inflight;}
    if(this.state.code && this.state.code!==code)this.reset();
    this.state.code=code;
    if(this.retry.blocked){
      this.status='throttled';const generation=this.generation;
      this.retry.schedule(()=>{if(generation===this.generation && normalizeCode(this.getCode())===code)void this.flush();});
      this.notify();return Promise.resolve();
    }
    const generation=this.generation, captured=this.state, events=captured.pending.slice(0,30), park={...captured.parkPending};
    this.inflight=(async()=>{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);this.status='syncing';this.notify();
      try{
        const response=await this.fetcher(`${this.config.url}/rest/v1/rpc/puppy_sync_learning`,{method:'POST',headers:{apikey:this.config.key,'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({access_code:code,writer_key:captured.writer,observations:events,park_changes:park})});
        const data=await response.json().catch(()=>null),limited=rateLimitError(response,data,this.retry.now());if(limited)throw limited;
        if(!response.ok || data?.version!==1 || !Number.isSafeInteger(data.ack))throw Error('sync_unavailable');
        if(generation!==this.generation || normalizeCode(this.getCode())!==code)return;
        captured.remote=cleanItems(data.items); captured.pending=captured.pending.filter(e=>e.seq>data.ack);captured.park=cleanPark(data.park);
        for(const [cell,v] of Object.entries(park))if(JSON.stringify(captured.parkPending[cell])===JSON.stringify(v))delete captured.parkPending[cell];
        this.retry.clear();captured.receipt=this.now();this.status=this.pending?'pending':'synced';this.persist();if(captured.pending.length)this.again=true;
      }catch(error){
        if(generation===this.generation && normalizeCode(this.getCode())===code){
          this.again=false;
          if(error.retryAfterMs){this.retry.pause(error);this.retry.schedule(()=>{if(generation===this.generation && normalizeCode(this.getCode())===code)void this.flush();});this.status='throttled';}
          else this.status=this.pending?'pending':'offline';
        }
      }
      finally{clearTimeout(timer);this.notify();}
    })().finally(()=>{this.inflight=null;if(this.again && this.getCode()){this.again=false;void this.flush();}});
    return this.inflight;
  }
}
