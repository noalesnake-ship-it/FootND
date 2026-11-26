'use strict';
/* ============ COUCHE RÉSEAU ============
   Deux implémentations de la même interface :
   - makeSupabaseNet(cfg) : vrai multijoueur (Supabase : comptes, base de données, temps réel)
   - makeLocalNet()       : mode test, relie les onglets d'un même navigateur (BroadcastChannel)
   Interface : uid, ready, set(path,val), update(path,obj), remove(path), on(path,cb)->unsub, once(path), onDisc(path)
*/
function makeLocalNet(){
 const rid=()=>'L'+Math.random().toString(36).slice(2,9);
 let uid=null,pseudo=null;try{const u=JSON.parse(sessionStorage.getItem('kbuser')||'null');if(u){uid=u.uid;pseudo=u.pseudo}}catch(e){}
 let db={};const ls=[],disc=[];
 let bc=null;try{bc=new BroadcastChannel('kb-local-net')}catch(e){}
 const sp=p=>String(p).split('/').filter(Boolean);
 const clone=v=>v===undefined||v===null?null:JSON.parse(JSON.stringify(v));
 const get=p=>{let o=db;for(const k of sp(p)){if(o==null||typeof o!=='object')return null;o=o[k]}return o===undefined?null:o};
 function put(p,v){
  const ks=sp(p);if(!ks.length)return;
  let o=db;for(let i=0;i<ks.length-1;i++){if(o[ks[i]]==null||typeof o[ks[i]]!=='object')o[ks[i]]={};o=o[ks[i]]}
  if(v==null)delete o[ks[ks.length-1]];else o[ks[ks.length-1]]=v;
  for(let i=ks.length-1;i>=1;i--){let q=db;for(let j=0;j<i;j++)q=q[ks[j]];if(q&&typeof q==='object'&&!Array.isArray(q)&&Object.keys(q).length===0){let r=db;for(let j=0;j<i-1;j++)r=r[ks[j]];delete r[ks[i-1]]}else break}
 }
 const norm=p=>'/'+sp(p).join('/')+'/';
 function fire(p){const a=norm(p);for(const [lp,cb] of ls.slice()){const b=norm(lp);if(a.startsWith(b)||b.startsWith(a))setTimeout(()=>cb(clone(get(lp))),0)}}
 const n={kind:'local',uid,pseudo,ready:new Promise(r=>setTimeout(r,250))};
 const setUser=(u,p)=>{n.uid=u;n.pseudo=p;try{sessionStorage.setItem('kbuser',JSON.stringify({uid:u,pseudo:p}))}catch(e){}};
 n.signup=async(ps,pw)=>{const k='accounts/'+ps.toLowerCase();if(get(k))throw{code:'auth/email-already-in-use'};const u=rid();await n.set(k,{uid:u,pw:btoa(pw),n:ps});setUser(u,ps)};
 n.login=async(ps,pw)=>{const a=get('accounts/'+ps.toLowerCase());if(!a||a.pw!==btoa(pw))throw{code:'auth/invalid-credential'};setUser(a.uid,a.n)};
 n.logout=async()=>{n.uid=null;n.pseudo=null;try{sessionStorage.removeItem('kbuser')}catch(e){}};
 n.set=(p,v)=>{v=clone(v);put(p,v);try{bc&&bc.postMessage({o:'set',p,v})}catch(e){}fire(p);return Promise.resolve()};
 n.update=(p,obj)=>{for(const k in obj)n.set(p+'/'+k,obj[k]);return Promise.resolve()};
 n.remove=p=>n.set(p,null);
 n.on=(p,cb)=>{const e=[p,cb];ls.push(e);setTimeout(()=>cb(clone(get(p))),0);return()=>{const i=ls.indexOf(e);if(i>=0)ls.splice(i,1)}};
 n.once=p=>Promise.resolve(clone(get(p)));
 n.onDisc=p=>{disc.push(p)};
 n.onConnect=cb=>setTimeout(cb,0);
 if(bc){
  bc.onmessage=e=>{const m=e.data;
   if(m.o==='set'){put(m.p,m.v);fire(m.p)}
   else if(m.o==='hello'){bc.postMessage({o:'snap',db})}
   else if(m.o==='snap'&&Object.keys(db).length===0&&m.db&&Object.keys(m.db).length){db=m.db;ls.forEach(([lp,cb])=>setTimeout(()=>cb(clone(get(lp))),0))}};
  bc.postMessage({o:'hello'});
  addEventListener('pagehide',()=>{disc.forEach(p=>{try{bc.postMessage({o:'set',p,v:null})}catch(e){}})});
 }
 return n;
}

/* ---------- Supabase : comptes (pseudo + mot de passe), base clé/valeur, temps réel ---------- */
function makeSupabaseNet(cfg){
 const n={kind:'supabase',uid:null,pseudo:null};
 const mail=p=>p.toLowerCase()+'@kickbrawl.app';   // e-mail fictif : seul le pseudo est demandé au joueur
 const GRACE=cfg.grace||10000;                                  // tolérance avant de considérer un hôte / membre comme parti
 let sb=null,token=null;
 const sp=p=>String(p).split('/').filter(Boolean),key=p=>sp(p).join('/'),grpOf=p=>sp(p).slice(0,2).join('/');
 const isBC=s=>s[0]==='rooms'&&s.length>=3&&(s[2]==='s'||s[2]==='in');   // snapshots + entrées : Broadcast (rapide, sans base)
 const isPR=s=>s[0]==='presence';                                          // présence : Realtime Presence (auto-nettoyée)
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

 function mapErr(e){
  const c=String((e&&(e.code||e.error_code))||''),m=String((e&&e.message)||e||''),st=e&&e.status;
  let code=c;
  if(c==='user_already_exists'||/already (been )?registered/i.test(m))code='auth/email-already-in-use';
  else if(c==='invalid_credentials'||/invalid login/i.test(m))code='auth/invalid-credential';
  else if(c==='weak_password')code='auth/weak-password';
  else if(st===429||/rate.?limit/i.test(c+m))code='auth/too-many-requests';
  else if(c==='signup_disabled'||c==='email_provider_disabled')code='auth/operation-not-allowed';
  else if(c==='email_not_confirmed')code='auth/confirm-required';
  else if((e&&e.name)==='AuthRetryableFetchError'||/failed to fetch|network/i.test(m))code='auth/network-request-failed';
  return {code,message:m};
 }
 n.ready=(async()=>{
  if(!window.supabase||!window.supabase.createClient)throw new Error('Bibliothèque Supabase introuvable (supabase.js)');
  sb=window.supabase.createClient(cfg.url,cfg.key,{auth:{persistSession:true,autoRefreshToken:true},realtime:{params:{eventsPerSecond:40}}});
  n.sb=sb;
  sb.auth.onAuthStateChange((ev,s)=>{token=s?s.access_token:null});
  const {data}=await sb.auth.getSession();
  const u=data&&data.session&&data.session.user;
  if(u){token=data.session.access_token;n.uid=u.id;n.pseudo=(u.user_metadata&&u.user_metadata.pseudo)||(u.email||'').split('@')[0]}
 })();
 n.signup=async(ps,pw)=>{
  const {data,error}=await sb.auth.signUp({email:mail(ps),password:pw,options:{data:{pseudo:ps}}});
  if(error)throw mapErr(error);
  if(!data||!data.session)throw {code:'auth/confirm-required',message:'confirmation e-mail activée'};
  token=data.session.access_token;n.uid=data.user.id;n.pseudo=ps;
 };
 n.login=async(ps,pw)=>{
  const {data,error}=await sb.auth.signInWithPassword({email:mail(ps),password:pw});
  if(error)throw mapErr(error);
  token=data.session.access_token;n.uid=data.user.id;n.pseudo=(data.user.user_metadata&&data.user.user_metadata.pseudo)||ps;
 };
 n.logout=async()=>{
  try{await sb.removeAllChannels()}catch(e){}
  pch=null;pSub=false;pme={};pstate={};pls.clear();for(const k in chans)delete chans[k];for(const k in rch)delete rch[k];discs.clear();
  try{await sb.auth.signOut()}catch(e){}
  n.uid=null;n.pseudo=null;token=null;
 };

 /* ----- base clé/valeur (table kv) ----- */
 function leaves(b,v,out){
  if(v!==null&&typeof v==='object'&&!Array.isArray(v)){for(const k of Object.keys(v))leaves(b+'/'+k,v[k],out)}
  else if(v!==null&&v!==undefined)out.push({path:b,val:v});
  return out;
 }
 async function kvReplace(k,v){
  const lv=leaves(k,v,[]);
  lv.sort((a,b)=>(/\/host$/.test(b.path)?1:0)-(/\/host$/.test(a.path)?1:0));   // l'hôte d'abord : les règles de sécurité en dépendent
  const {error}=await sb.rpc('kv_replace',{prefix:k,leaves:lv});
  if(error)throw error;
 }
 function build(k,rows){
  let exact=null,any=false;const root={};
  for(const r of rows){
   if(r.path===k){exact=r.val;continue}
   if(!r.path.startsWith(k+'/'))continue;
   const rel=r.path.slice(k.length+1).split('/');let o=root;
   for(let i=0;i<rel.length-1;i++){if(o[rel[i]]===null||typeof o[rel[i]]!=='object')o[rel[i]]={};o=o[rel[i]]}
   o[rel[rel.length-1]]=r.val;any=true;
  }
  return any?root:exact;
 }
 async function kvGet(k){
  const [a,b]=await Promise.all([sb.from('kv').select('path,val').eq('path',k),sb.from('kv').select('path,val').like('path',k+'/%')]);
  if(a.error)throw a.error;if(b.error)throw b.error;
  return build(k,[...(a.data||[]),...(b.data||[])]);
 }
 const chans={};   // un canal temps réel par groupe (2 premiers segments du chemin)
 function subGrp(g,fn,onSub){
  let c=chans[g];
  if(!c){
   c={ls:new Set(),subbed:false};
   c.ch=sb.channel('kv:'+g).on('postgres_changes',{event:'*',schema:'public',table:'kv',filter:'grp=eq.'+g},pl=>{c.ls.forEach(l=>l.fn(pl))})
    .subscribe(st=>{if(st==='SUBSCRIBED'){c.subbed=true;c.ls.forEach(l=>l.onSub&&l.onSub())}});
   chans[g]=c;
  }
  const l={fn,onSub};c.ls.add(l);if(c.subbed&&onSub)setTimeout(onSub,0);
  return ()=>{c.ls.delete(l);if(!c.ls.size&&chans[g]===c){delete chans[g];try{sb.removeChannel(c.ch)}catch(e){}}};
 }

 /* ----- présence globale (amis en ligne) ----- */
 let pch=null,pSub=false,pme={},pstate={},psync=false;const pls=new Set();
 function ensurePres(){
  if(pch||!n.uid)return;
  pch=sb.channel('kb-presence',{config:{presence:{key:n.uid}}});
  pch.on('presence',{event:'sync'},()=>{
   psync=true;pstate={};const st=pch.presenceState();
   for(const id of Object.keys(st)){const arr=st[id]||[];const m=arr[arr.length-1];if(m){const o={...m};delete o.presence_ref;pstate[id]=o}}
   pls.forEach(f=>f());
  });
  pch.subscribe(s=>{if(s==='SUBSCRIBED'){pSub=true;if(Object.keys(pme).length)pch.track(pme)}});
 }
 function presSet(s,v,merge){
  if(s[1]!==n.uid||s.length>2)return Promise.resolve();
  ensurePres();
  if(v==null){pme={};if(pch&&pSub)try{pch.untrack()}catch(e){}return Promise.resolve()}
  pme=merge?{...pme,...v}:{...v};for(const k of Object.keys(pme))if(pme[k]==null)delete pme[k];
  if(pch&&pSub)return Promise.resolve(pch.track(pme)).catch(()=>{});
  return Promise.resolve();
 }

 /* ----- salons : canal Broadcast + présence par salon ----- */
 const rch={};
 function retain(code){
  let r=rch[code];
  if(!r){
   r={code,refs:0,ins:{},sl:new Set(),il:new Set(),hl:new Set(),pres:[],psync:false};
   r.ch=sb.channel('room:'+code,{config:{broadcast:{self:false,ack:false},presence:{key:n.uid||'anon'}}});
   r.ch.on('broadcast',{event:'s'},m=>{const v=m.payload&&m.payload.v;r.sl.forEach(f=>f(v))});
   r.ch.on('broadcast',{event:'i'},m=>{const p=m.payload||{};if(p.v==null)delete r.ins[p.u];else r.ins[p.u]=p.v;r.il.forEach(f=>f({...r.ins}))});
   r.ch.on('presence',{event:'sync'},()=>{r.psync=true;r.pres=Object.keys(r.ch.presenceState());r.hl.forEach(f=>f())});
   r.ch.subscribe(st=>{if(st==='SUBSCRIBED')r.ch.track({u:n.uid})});
   rch[code]=r;
  }
  r.refs++;return r;
 }
 function release(code){const r=rch[code];if(!r)return;if(--r.refs<=0){delete rch[code];try{sb.removeChannel(r.ch)}catch(e){}}}
 function bcSet(s,v){
  const r=rch[s[1]];if(!r)return Promise.resolve();
  if(s[2]==='s'){if(v!=null)r.ch.send({type:'broadcast',event:'s',payload:{v}});return Promise.resolve()}
  if(s.length===3){r.ins={};return Promise.resolve()}
  if(s.length===4){if(v==null)delete r.ins[s[3]];r.ch.send({type:'broadcast',event:'i',payload:{u:s[3],v:v==null?null:v}})}
  return Promise.resolve();
 }
 /* hôte / membres : valeurs de la base filtrées par la présence réelle dans le salon */
 function roomView(r,kind,cb){
  let raw=undefined,last='\u0000',tm=null,missSince=0;const miss={};
  const emit=v=>{if(!same(v,last)){last=v;cb(v)}};
  const run=()=>{
   clearTimeout(tm);if(raw===undefined)return;
   let wait=0;
   if(kind==='host'){
    let out=raw;
    if(raw&&raw!==n.uid&&r.psync&&!r.pres.includes(raw)){
     if(!missSince)missSince=Date.now();
     const left=GRACE-(Date.now()-missSince);
     if(left<=0)out=null;else wait=left+50;
    }else missSince=0;
    emit(out);
   }else{
    const out={};let any=false;const now=Date.now();
    for(const u of Object.keys(miss))if(!raw||!(u in raw))delete miss[u];
    for(const u of Object.keys(raw||{})){
     const present=u===n.uid||!r.psync||r.pres.includes(u);
     if(present)delete miss[u];else if(!miss[u])miss[u]=now;
     if(present||now-miss[u]<GRACE){out[u]=raw[u];any=true;if(!present)wait=Math.max(wait,GRACE-(now-miss[u])+50)}
    }
    emit(any?out:null);
   }
   if(wait>0)tm=setTimeout(run,wait);
  };
  r.hl.add(run);
  return {feed:v=>{raw=v;run()},stop:()=>{r.hl.delete(run);clearTimeout(tm)}};
 }

 /* ----- interface commune ----- */
 n.set=(p,v)=>{
  v=v===undefined?null:v;const s=sp(p);
  if(isBC(s))return bcSet(s,v);
  if(isPR(s))return presSet(s,v,false);
  return kvReplace(s.join('/'),v);
 };
 n.update=(p,o)=>{
  const s=sp(p);
  if(isPR(s))return presSet(s,o,true);
  return Promise.all(Object.keys(o).map(k=>n.set(p+'/'+k,o[k]))).then(()=>{});
 };
 n.remove=p=>n.set(p,null);
 n.once=async p=>{
  const s=sp(p);
  if(isBC(s)){const r=rch[s[1]];return s[2]==='in'&&r&&Object.keys(r.ins).length?{...r.ins}:null}
  if(isPR(s))return pstate[s[1]]||null;
  return kvGet(s.join('/'));
 };
 n.on=(p,cb)=>{
  const s=sp(p);let alive=true;
  if(isBC(s)){
   const r=retain(s[1]);
   if(s[2]==='s'){r.sl.add(cb);return()=>{r.sl.delete(cb);release(s[1])}}
   r.il.add(cb);setTimeout(()=>alive&&cb(Object.keys(r.ins).length?{...r.ins}:null),0);
   return()=>{alive=false;r.il.delete(cb);release(s[1])};
  }
  if(isPR(s)){
   ensurePres();const id=s[1];
   const f=()=>{if(alive)cb(pstate[id]||null)};
   pls.add(f);setTimeout(f,0);
   return()=>{alive=false;pls.delete(f)};
  }
  const k=s.join('/'),g=grpOf(p);
  let r=null,view=null;
  if(s[0]==='rooms'&&s[1]){r=retain(s[1]);if(s.length===3&&(s[2]==='host'||s[2]==='m'))view=roomView(r,s[2],cb)}
  const out=view?view.feed:v=>{if(alive)cb(v)};
  let busy=false,again=false;
  const refresh=async()=>{
   if(!alive)return;if(busy){again=true;return}
   busy=true;
   try{const v=await kvGet(k);if(alive)out(v)}catch(e){}
   busy=false;if(again){again=false;refresh()}
  };
  const un=subGrp(g,pl=>{
   const q=(pl.new&&pl.new.path)||(pl.old&&pl.old.path);
   if(!q||q===k||q.startsWith(k+'/')||k.startsWith(q+'/'))refresh();
  },refresh);
  refresh();
  return()=>{alive=false;un();if(view)view.stop();if(r)release(s[1])};
 };
 /* "à la déconnexion, supprime ce chemin" : suppression à la fermeture de la page (la présence, elle, est automatique) */
 const discs=new Set();
 n.onDisc=p=>{const s=sp(p);if(isBC(s)||isPR(s))return;discs.add(s.join('/'))};
 function flush(){
  if(!token)return;
  for(const k of discs){
   try{fetch(cfg.url+'/rest/v1/kv?or=(path.eq.'+k+',path.like.'+k+'/*)',{method:'DELETE',keepalive:true,headers:{apikey:cfg.key,Authorization:'Bearer '+token}})}catch(e){}
  }
 }
 try{
  addEventListener('pagehide',flush);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&pch&&pSub&&Object.keys(pme).length)try{pch.track(pme)}catch(e){}});
 }catch(e){}
 n.onConnect=cb=>{n.ready.then(()=>{if(n.uid)ensurePres();cb()}).catch(()=>{})};
 return n;
}
