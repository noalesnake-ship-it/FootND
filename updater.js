/* Mise à jour automatique : toutes les ~45 s (et à chaque retour sur l'appli), le jeu compare ses fichiers
   avec ceux du serveur GitHub Pages. Si tu as envoyé une nouvelle version, il se recharge tout seul
   (en attendant la fin du match si tu es en train de jouer). Tes sauvegardes ne sont pas touchées. */
(function(){
 'use strict';
 const base=location.href.split('#')[0].split('?')[0].replace(/[^/]*$/,'');
 const urls=[base+'index.html'];
 for(const sc of document.scripts){
  if(!sc.src)continue;const u=sc.src.split('?')[0];
  if(u.indexOf(base)!==0)continue;                       // seulement nos propres fichiers
  if(/three\.min\.js|supabase\.min\.js/.test(u))continue; // librairies lourdes qui ne changent pas
  if(urls.indexOf(u)<0)urls.push(u);
 }
 const known={};let busy=false,pending=false,timer=null;
 const H=t=>{let h=5381;for(let i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return (h>>>0).toString(36)};
 const get=(u,mode)=>fetch(mode==='cache'?u:u+(u.indexOf('?')<0?'?':'&')+'_='+Date.now(),{cache:mode==='cache'?'default':'no-store'}).then(r=>{if(!r.ok)throw new Error(r.status);return r.text()});
 let banner=null;
 function say(t){
  if(!banner){banner=document.createElement('div');banner.style.cssText='position:fixed;left:50%;bottom:14px;transform:translateX(-50%);z-index:9999;background:#14122e;color:#fff;border:3px solid #ffd23a;border-radius:16px;padding:8px 16px;font:16px Arial,sans-serif;pointer-events:none;text-align:center';document.body.appendChild(banner)}
  banner.textContent=t;banner.style.display=t?'block':'none';
 }
 const playing=()=>{try{return (typeof inMatch!=='undefined'&&inMatch)||(typeof ONLINE!=='undefined'&&ONLINE)||!document.getElementById('lobby').classList.contains('hidden')}catch(e){return false}};
 async function baseline(){
  const parts=[];
  for(const u of urls){try{const t=await get(u,'cache');known[u]=H(t);parts.push(known[u])}catch(e){}}
  window.KB_BUILD=H(parts.join('-')).slice(0,6).toUpperCase();
 }
 async function changed(){
  const diff=[];
  for(const u of urls){
   try{const t=await get(u,'net');const h=H(t);if(known[u]===undefined)known[u]=h;else if(known[u]!==h)diff.push(u)}catch(e){}
  }
  return diff;
 }
 async function apply(diff){
  if(playing()){pending=true;say('🔄 Mise à jour prête : elle s\'installera à la fin de ta partie');setTimeout(()=>{if(pending)check()},4000);return}
  // garde-fou contre une boucle de rechargement
  try{const g=JSON.parse(sessionStorage.getItem('kb_upd')||'{}');if(g.t&&Date.now()-g.t<20000&&g.n>=2){say('');return}
   sessionStorage.setItem('kb_upd',JSON.stringify({t:Date.now(),n:(g.t&&Date.now()-g.t<20000?g.n:0)+1}))}catch(e){}
  say('🔄 Mise à jour du jeu…');
  try{await Promise.all(urls.map(u=>fetch(u,{cache:'reload'}).then(r=>r.text())))}catch(e){}
  location.reload();
 }
 async function check(manual){
  if(busy)return;busy=true;
  try{
   const d=await changed();
   if(d.length){pending=false;await apply(d)}
   else{pending=false;if(!playing()&&banner)say('');if(manual&&typeof toast==='function')toast('✅ Le jeu est à jour')}
  }catch(e){if(manual&&typeof toast==='function')toast('Impossible de vérifier (pas de connexion ?)')}
  busy=false;
 }
 window.KB_CHECK=check;
 baseline().then(()=>{check();timer=setInterval(()=>{if(!document.hidden)check()},45000)});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden)check()});
 addEventListener('online',()=>check());
})();
