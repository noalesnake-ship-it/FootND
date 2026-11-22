'use strict';
/* ============ COUCHE RÉSEAU ============
   Deux implémentations de la même interface :
   - makeFirebaseNet(cfg) : vrai multijoueur (Firebase Realtime Database + auth anonyme)
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

function makeFirebaseNet(cfg){
 const load=src=>new Promise((res,rej)=>{const s=document.createElement('script');s.src=src;s.onload=res;s.onerror=()=>rej(new Error('Impossible de charger Firebase (connexion ?)'));document.head.appendChild(s)});
 const n={kind:'firebase',uid:null,pseudo:null};
 const mail=p=>p.toLowerCase()+'@kickbrawl.app';   // e-mail fictif : seul le pseudo est demandé au joueur
 n.ready=(async()=>{
  const b='https://www.gstatic.com/firebasejs/10.12.2/';
  await load(b+'firebase-app-compat.js');
  await Promise.all([load(b+'firebase-auth-compat.js'),load(b+'firebase-database-compat.js')]);
  firebase.initializeApp(cfg);
  n.auth=firebase.auth();n.db=firebase.database();
  const user=await new Promise(res=>{const un=n.auth.onAuthStateChanged(u=>{un();res(u)})});
  if(user){n.uid=user.uid;n.pseudo=user.displayName||(user.email||'').split('@')[0]}
 })();
 n.signup=async(ps,pw)=>{const c=await n.auth.createUserWithEmailAndPassword(mail(ps),pw);try{await c.user.updateProfile({displayName:ps})}catch(e){}n.uid=c.user.uid;n.pseudo=ps};
 n.login=async(ps,pw)=>{const c=await n.auth.signInWithEmailAndPassword(mail(ps),pw);n.uid=c.user.uid;n.pseudo=c.user.displayName||ps};
 n.logout=()=>n.auth.signOut();
 const nz=v=>v===undefined?null:v;
 n.set=(p,v)=>n.db.ref(p).set(nz(v));
 n.update=(p,o)=>n.db.ref(p).update(o);
 n.remove=p=>n.db.ref(p).remove();
 n.on=(p,cb)=>{const r=n.db.ref(p);const h=r.on('value',s=>cb(s.val()));return()=>r.off('value',h)};
 n.once=p=>n.db.ref(p).get().then(s=>s.val());
 n.onDisc=p=>{n.db.ref(p).onDisconnect().remove()};
 n.onConnect=cb=>{n.db.ref('.info/connected').on('value',s=>{if(s.val())cb()})};
 return n;
}
