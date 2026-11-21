'use strict';
/* ============ MULTIJOUEUR : amis, salons, match en ligne ============
   Architecture : l'HÔTE du salon fait tourner la simulation (comme en solo).
   Les autres joueurs envoient leurs commandes (joystick + boutons) ~20x/s,
   l'hôte diffuse l'état du match ~15x/s, les clients interpolent + prédisent leur propre joueur.
*/
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ALPH='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const rcode=n=>Array.from({length:n},()=>ALPH[Math.random()*ALPH.length|0]).join('');
const r1=v=>Math.round(v*10)/10,r2=v=>Math.round(v*100)/100;

let NET=null,SOCP=null,ROOM=null;
const SOC={err:'',name:'',code:'',friends:{},users:{},pres:{},subs:{},ready:false};

function ensureSoc(){
 if(SOCP)return SOCP;
 SOCP=(async()=>{
  const cfg=window.KB_FIREBASE;
  NET=(cfg&&cfg.apiKey&&cfg.databaseURL)?makeFirebaseNet(cfg):makeLocalNet();
  await NET.ready;
  const uid=NET.uid;
  const u=await NET.once('users/'+uid);
  let code=u&&u.code;
  if(!code){for(let i=0;i<8;i++){const c=rcode(6);if(!(await NET.once('codes/'+c))){await NET.set('codes/'+c,uid);code=c;break}}}
  if(!S.name)S.name=(u&&u.n)||('Joueur'+(Math.random()*900+100|0));
  SOC.name=S.name;SOC.code=code;save();
  pushProfile();
  NET.onConnect(()=>{NET.set('presence/'+uid,{n:SOC.name,room:ROOM?ROOM.code:null});NET.onDisc('presence/'+uid)});
  NET.on('friends/'+uid,f=>{
   SOC.friends=f||{};
   for(const fid of Object.keys(SOC.friends)){if(SOC.subs[fid])continue;
    SOC.subs[fid]=[NET.on('users/'+fid,v=>{SOC.users[fid]=v;renderFriends()}),NET.on('presence/'+fid,v=>{SOC.pres[fid]=v;renderFriends();if(ROOM)renderLobby()})]}
   for(const fid of Object.keys(SOC.subs))if(!SOC.friends[fid]){SOC.subs[fid].forEach(x=>x());delete SOC.subs[fid];delete SOC.users[fid];delete SOC.pres[fid]}
   renderFriends();
  });
  NET.on('invites/'+uid,inv=>{if(!inv)return;for(const [from,v] of Object.entries(inv)){if(Date.now()-v.t>180000){NET.remove(`invites/${uid}/${from}`);continue}showInvite(from,v)}});
  SOC.ready=true;SOC.err='';renderFriends();
 })().catch(e=>{SOC.err=String(e&&e.message||e);SOCP=null;renderFriends();throw e});
 return SOCP;
}
function pushProfile(){if(!NET)return;NET.update('users/'+NET.uid,{n:SOC.name,code:SOC.code,shoe:S.eq,lv:S.owned[S.eq].lv});NET.update('presence/'+NET.uid,{n:SOC.name})}

/* ---------- amis ---------- */
let friendsBuilt=false;
function renderFriends(){
 const t=$('#tabFriends');if(!t)return;
 if(!friendsBuilt){
  friendsBuilt=true;
  t.innerHTML=`<h3 class="stroke" style="text-align:center">AMIS & SALONS</h3>
  <div id="fStatus" style="text-align:center;font-size:13px;font-family:Arial,sans-serif;font-weight:bold;margin-bottom:8px"></div>
  <div class="fgrid">
   <div class="card"><div style="font-size:16px">Ton profil</div>
    <div class="frow"><input id="fName" maxlength="14" placeholder="Pseudo"><button class="btn small green" id="fNameOk">OK</button></div>
    <div style="font-size:14px;margin-top:6px">Ton code ami : <b id="fCode" style="font-size:22px;letter-spacing:3px;color:#ffd23a">······</b> <button class="btn small blue" id="fCopy">Copier</button></div></div>
   <div class="card"><div style="font-size:16px">Ajouter un ami</div>
    <div class="frow"><input id="fAdd" maxlength="6" placeholder="Code ami" style="text-transform:uppercase"><button class="btn small green" id="fAddOk">Ajouter</button></div></div>
   <div class="card"><div style="font-size:16px">Jouer en équipe</div>
    <div class="frow"><button class="btn small green" id="fCreate">Créer un salon</button></div>
    <div class="frow" style="margin-top:8px"><input id="fJoin" maxlength="5" placeholder="Code salon" style="text-transform:uppercase"><button class="btn small blue" id="fJoinOk">Rejoindre</button></div></div>
  </div>
  <div class="card" style="margin-top:10px"><div style="font-size:18px;margin-bottom:6px">Mes amis</div><div id="fList"></div></div>`;
  const need=async fn=>{try{await ensureSoc();await fn()}catch(e){toast('Réseau indisponible')}};
  $('#fNameOk').onclick=()=>need(()=>{const v=$('#fName').value.trim().slice(0,14);if(!v)return;S.name=SOC.name=v;save();pushProfile();toast('Pseudo enregistré')});
  $('#fCopy').onclick=()=>{try{navigator.clipboard.writeText(SOC.code);toast('Code copié !')}catch(e){toast('Code : '+SOC.code)}};
  $('#fAddOk').onclick=()=>need(()=>addFriend($('#fAdd').value));
  $('#fCreate').onclick=()=>need(createRoom);
  $('#fJoinOk').onclick=()=>need(()=>joinRoom($('#fJoin').value));
 }
 const st=$('#fStatus');
 if(SOC.err){st.textContent='⚠ '+SOC.err;st.style.color='#ff9a9a'}
 else if(!SOC.ready){st.textContent='Connexion…';st.style.color='#fff'}
 else if(NET.kind==='local'){st.textContent='🧪 Mode test local : ouvre le jeu dans 2 onglets du même navigateur (aucun serveur configuré)';st.style.color='#ffd23a'}
 else{st.textContent='🟢 Connecté';st.style.color='#7dff5a'}
 $('#fCode').textContent=SOC.code||'······';
 const ni=$('#fName');if(document.activeElement!==ni&&SOC.ready)ni.value=SOC.name;
 const L=$('#fList');if(!L)return;
 const ids=Object.keys(SOC.friends||{});
 if(!ids.length){L.innerHTML='<div style="opacity:.7;font-size:14px;font-family:Arial,sans-serif">Aucun ami pour l\'instant. Échange ton code avec un ami !</div>';return}
 L.innerHTML='';
 ids.sort((a,b)=>(SOC.pres[b]?1:0)-(SOC.pres[a]?1:0)).forEach(fid=>{
  const u=SOC.users[fid]||{},p=SOC.pres[fid];
  const status=!p?'⚪ Hors ligne':p.room?'🎮 Dans un salon':'🟢 En ligne';
  const row=document.createElement('div');row.className='frow friend';
  row.innerHTML=`<div style="flex:1"><div style="font-size:18px">${esc(u.n||'Ami')}</div><div style="font-size:12px;opacity:.85;font-family:Arial,sans-serif">${status}</div></div>`;
  if(p&&p.room&&(!ROOM||ROOM.code!==p.room)){const b=document.createElement('button');b.className='btn small green';b.textContent='Rejoindre';b.onclick=()=>joinRoom(p.room);row.appendChild(b)}
  if(p&&ROOM&&ROOM.code!==p.room){const b=document.createElement('button');b.className='btn small blue';b.textContent='Inviter';b.onclick=()=>invite(fid);row.appendChild(b)}
  const x=document.createElement('button');x.className='btn small grey';x.textContent='✖';x.onclick=()=>removeFriend(fid);row.appendChild(x);
  L.appendChild(row);
 });
}
async function addFriend(code){
 code=(code||'').trim().toUpperCase();if(code.length<4)return toast('Entre le code de ton ami');
 const fid=await NET.once('codes/'+code);
 if(!fid)return toast('Code inconnu');
 if(fid===NET.uid)return toast("C'est ton propre code !");
 await NET.set(`friends/${NET.uid}/${fid}`,true);await NET.set(`friends/${fid}/${NET.uid}`,true);
 $('#fAdd').value='';toast('Ami ajouté !');sfx('open');
}
async function removeFriend(fid){await NET.remove(`friends/${NET.uid}/${fid}`);await NET.remove(`friends/${fid}/${NET.uid}`)}
function invite(fid){if(!ROOM)return;NET.set(`invites/${fid}/${NET.uid}`,{n:SOC.name,room:ROOM.code,t:Date.now()});toast('Invitation envoyée !')}
function showInvite(from,v){
 const ov=$('#inviteov');if(!ov.classList.contains('hidden')&&ov.dataset.from===from)return;
 ov.dataset.from=from;ov.classList.remove('hidden');sfx('open');
 ov.innerHTML=`<div class="card modal"><div style="font-size:26px">🎮 ${esc(v.n)}</div><div style="margin:6px 0 12px">t'invite à jouer en équipe !</div><div style="display:flex;gap:10px;justify-content:center"><button class="btn green" id="ivOk">Rejoindre</button><button class="btn grey" id="ivNo">Refuser</button></div></div>`;
 const done=()=>{ov.classList.add('hidden');NET.remove(`invites/${NET.uid}/${from}`)};
 $('#ivOk').onclick=()=>{done();if(ROOM)onlineLeave();joinRoom(v.room)};
 $('#ivNo').onclick=done;
}

/* ---------- salons ---------- */
function roster(m){
 const out=[[],[]];
 Object.entries(m||{}).sort((a,b)=>((a[1].ts||0)-(b[1].ts||0))||(a[0]<b[0]?-1:1)).forEach(([u,v])=>{if(out[v.team])out[v.team].push(Object.assign({uid:u},v))});
 return out;
}
function myMember(){return {n:SOC.name,team:0,ts:Date.now(),shoe:S.eq,lv:S.owned[S.eq].lv}}
async function createRoom(){
 if(ROOM)return showLobby();
 let code;for(let i=0;i<8;i++){const c=rcode(5);if(!(await NET.once('rooms/'+c))){code=c;break}}
 if(!code)return toast('Erreur de création');
 const uid=NET.uid;
 await NET.set('rooms/'+code,{host:uid,st:'lobby',m:{[uid]:myMember()}});
 NET.onDisc('rooms/'+code);
 enterRoom(code,uid);
}
async function joinRoom(code){
 try{await ensureSoc()}catch(e){return toast('Réseau indisponible')}
 code=(code||'').trim().toUpperCase();if(!code)return toast('Entre un code de salon');
 if(ROOM&&ROOM.code===code)return showLobby();
 const r=await NET.once('rooms/'+code);
 if(!r)return toast('Salon introuvable');
 if(r.st==='play')return toast('Un match est déjà en cours');
 const R=roster(r.m);if(R[0].length+R[1].length>=6)return toast('Salon plein');
 let team=R[0].length<=R[1].length?0:1;if(R[team].length>=3)team=1-team;
 const m=myMember();m.team=team;
 if(ROOM)onlineLeave();
 await NET.set(`rooms/${code}/m/${NET.uid}`,m);
 NET.onDisc(`rooms/${code}/m/${NET.uid}`);NET.onDisc(`rooms/${code}/in/${NET.uid}`);
 enterRoom(code,r.host);
}
function enterRoom(code,host){
 ROOM={code,host,m:{},st:'lobby',un:[],hostSeen:false};
 NET.update('presence/'+NET.uid,{room:code});
 ROOM.un.push(NET.on(`rooms/${code}/host`,h=>{if(!ROOM||ROOM.code!==code)return;if(h==null){if(ROOM.hostSeen)roomClosed();return}ROOM.host=h;ROOM.hostSeen=true;renderLobby()}));
 ROOM.un.push(NET.on(`rooms/${code}/m`,m=>{if(!ROOM||ROOM.code!==code)return;ROOM.m=m||{};renderLobby();if(ONLINE&&ONLINE.host)hostSyncMembers()}));
 ROOM.un.push(NET.on(`rooms/${code}/st`,st=>{if(!ROOM||ROOM.code!==code)return;ROOM.st=st;onRoomState(st)}));
 $('#inviteov').classList.add('hidden');showLobby();
}
function showLobby(){$('#lobby').classList.remove('hidden');renderLobby()}
function roomClosed(){
 if(!ROOM)return;toast("Le salon a été fermé");
 ROOM.un.forEach(f=>f());if(ONLINE)ONLINE.un.forEach(f=>f());
 NET.update('presence/'+NET.uid,{room:null});
 ROOM=null;ONLINE=null;$('#lobby').classList.add('hidden');$('#endov').classList.add('hidden');toMenu();
}
function onlineLeave(){
 if(ONLINE)ONLINE.un.forEach(f=>f());
 if(ROOM){
  const code=ROOM.code;ROOM.un.forEach(f=>f());
  if(ROOM.host===NET.uid)NET.remove('rooms/'+code);
  else{NET.remove(`rooms/${code}/m/${NET.uid}`);NET.remove(`rooms/${code}/in/${NET.uid}`)}
  NET.update('presence/'+NET.uid,{room:null});
  ROOM=null;
 }
 ONLINE=null;$('#lobby').classList.add('hidden');
}
function renderLobby(){
 const L=$('#lobby');if(!ROOM||L.classList.contains('hidden'))return;
 const R=roster(ROOM.m),host=ROOM.host===NET.uid,uid=NET.uid;
 const slots=t=>[0,1,2].map(k=>{const u=R[t][k];return u?`<div class="slot full">${u.uid===uid?'⭐ ':''}${esc(u.n)}${u.uid===ROOM.host?' 👑':''}</div>`:'<div class="slot">🤖 Bot</div>'}).join('');
 const online=Object.keys(SOC.friends||{}).filter(f=>SOC.pres[f]&&SOC.pres[f].room!==ROOM.code);
 L.innerHTML=`<div class="topbar"><div class="logo stroke">SALON<small>Code : <b style="font-size:22px;letter-spacing:3px;color:#fff">${ROOM.code}</b></small></div><button class="btn small blue" id="lcCopy">Copier le code</button><button class="btn small red" id="lcQuit">Quitter</button></div>
 <div class="content" style="overflow:auto;padding:6px 14px"><div class="teams">
  ${[0,1].map(t=>`<div class="card team"><div class="stroke" style="font-size:22px;color:${t?'#ff8a8a':'#7cc8ff'}">${t?'ÉQUIPE ROUGE':'ÉQUIPE BLEUE'}</div>${slots(t)}<button class="btn small ${t?'red':'blue'}" data-t="${t}">Rejoindre cette équipe</button></div>`).join('')}</div>
  <div class="card" style="margin-top:10px"><div style="font-size:18px;margin-bottom:6px">Inviter un ami en ligne</div>${online.length?online.map(f=>`<div class="frow friend"><div style="flex:1;font-size:18px">${esc((SOC.users[f]||{}).n||'Ami')}</div><button class="btn small green" data-inv="${f}">Inviter</button></div>`).join(''):'<div style="opacity:.7;font-size:14px;font-family:Arial,sans-serif">Aucun ami disponible. Partage le code du salon !</div>'}</div></div>
 <div class="nav">${host?'<button class="on" id="lcStart">▶ LANCER LE MATCH</button>':'<button disabled style="opacity:.7">En attente de l\'hôte…</button>'}</div>`;
 $('#lcCopy').onclick=()=>{try{navigator.clipboard.writeText(ROOM.code);toast('Code copié !')}catch(e){toast('Code : '+ROOM.code)}};
 $('#lcQuit').onclick=()=>{onlineLeave();toMenu()};
 L.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{const t=+b.dataset.t,me=(ROOM.m||{})[uid];if(!me||me.team===t)return;if(R[t].length>=3)return toast('Équipe pleine');NET.update(`rooms/${ROOM.code}/m/${uid}`,{team:t,ts:Date.now()});sfx('ui')});
 L.querySelectorAll('[data-inv]').forEach(b=>b.onclick=()=>invite(b.dataset.inv));
 const st=$('#lcStart');if(st)st.onclick=hostStart;
}
function onRoomState(st){
 if(!ROOM||ROOM.host===NET.uid)return;
 if(st==='play'&&!ONLINE)startOnlineClient();
 else if(st==='lobby'&&ONLINE){ONLINE.un.forEach(f=>f());ONLINE=null;toMenu();showLobby()}
}

/* ---------- lancement d'un match ---------- */
function configPlayers(cfg,host){
 players.forEach(p=>setBot(p));
 for(const c of cfg){
  const p=players[c.t*3+c.k];if(!p)continue;
  p.uid=c.u;p.remote=host&&c.u!==NET.uid;p.rin=null;p.lsn=p.ldn=undefined;
  setStats(p,c.s,c.l);setName(p,c.u===NET.uid?'':c.n);
 }
 const me=cfg.find(c=>c.u===NET.uid);
 myTeam=me?me.t:0;human=players[(me?me.t:0)*3+(me?me.k:0)];
}
async function hostStart(){
 if(!ROOM||ROOM.host!==NET.uid)return;
 const R=roster(ROOM.m),cfg=[];
 [0,1].forEach(t=>R[t].slice(0,3).forEach((u,k)=>cfg.push({u:u.uid,t,k,n:u.n,s:u.shoe,l:u.lv})));
 const code=ROOM.code;
 await NET.remove(`rooms/${code}/in`);await NET.remove(`rooms/${code}/s`);
 await NET.set(`rooms/${code}/cfg`,JSON.stringify(cfg));
 configPlayers(cfg,true);
 ONLINE={host:true,code,evs:[],evSeq:0,acc:0,un:[]};
 ONLINE.un.push(NET.on(`rooms/${code}/in`,v=>{v=v||{};players.forEach(p=>{if(p.remote&&v[p.uid])p.rin=v[p.uid]})}));
 startMatch();
 await NET.set(`rooms/${code}/st`,'play');
}
function hostSyncMembers(){players.forEach(p=>{if(p.remote&&!(ROOM.m||{})[p.uid]){setBot(p)}})}
async function startOnlineClient(){
 if(!ROOM||ONLINE)return;
 const code=ROOM.code;ONLINE={host:false,code,buf:[],lastEv:null,sn:0,dn:0,cd:0,lastSend:0,lastIn:'',un:[]};
 const O=ONLINE;
 const raw=await NET.once(`rooms/${code}/cfg`);
 if(!raw||ONLINE!==O){return}
 configPlayers(JSON.parse(raw),false);
 O.un.push(NET.on(`rooms/${code}/s`,str=>{if(str&&ONLINE===O)onSnap(JSON.parse(str))}));
 $('#menu').classList.add('hidden');$('#lobby').classList.add('hidden');$('#endov').classList.add('hidden');$('#hud').classList.remove('hidden');
 players.forEach(p=>{p.g.visible=true});ballMesh.visible=true;
 score=[0,0];timeLeft=120;ot=false;inMatch=true;resetPositions();updHUD();
 state='countdown';stateT=0;lastCd=4;paused=false;inp.x=inp.z=0;inp.shoot=inp.dash=false;checkRot();
}
function onlineBackToLobby(){
 if(!ROOM){toMenu();return}
 if(ROOM.host===NET.uid){NET.update('rooms/'+ROOM.code,{st:'lobby'});NET.remove(`rooms/${ROOM.code}/s`);NET.remove(`rooms/${ROOM.code}/cfg`)}
 if(ONLINE)ONLINE.un.forEach(f=>f());
 ONLINE=null;toMenu();showLobby();
}

/* ---------- hôte : diffusion de l'état ---------- */
function onlineHostTick(dt){
 const O=ONLINE;O.acc+=dt;if(O.acc<.066)return;O.acc=0;
 const snap={st:ST.indexOf(state),sc:score,tl:r1(timeLeft),ot:ot?1:0,cd:r2(cdT),
  b:[r2(ball.x),r2(ball.y),r2(ball.z),r1(ball.vx),r1(ball.vz)],
  p:players.map(p=>[r2(p.x),r2(p.z),r2(p.hd),r1(p.vx),r1(p.vz),(p.stun>0?1:0)|(p.dash>0?2:0)|(p.kick>0?4:0)]),
  e:O.evs};
 NET.set(`rooms/${O.code}/s`,JSON.stringify(snap));
}

/* ---------- client : réception, interpolation, prédiction ---------- */
function onSnap(s){
 const O=ONLINE;if(!O)return;
 O.buf.push({at:performance.now(),s});if(O.buf.length>30)O.buf.shift();
 const prev=state;state=ST[s.st]||'play';score=s.sc;timeLeft=s.tl;ot=!!s.ot;O.cd=s.cd;
 if(state!==prev){
  stateT=0;
  if(state==='countdown'){REC.length=0;lastCd=4;players.forEach(p=>{p.celeb=0})}
  if(prev==='goal'&&state!=='goal')players.forEach(p=>{p.celeb=0});
  if(state==='play'&&prev==='countdown'){showBanner('GO !','show','#7dff5a');sfx('whistle')}
  if(state==='end'&&prev!=='end'){endClientMatch()}
 }
 const evs=s.e||[];
 if(O.lastEv===null)O.lastEv=evs.length?evs[evs.length-1][0]:0;
 for(const e of evs){if(e[0]>O.lastEv){O.lastEv=e[0];playEvent(e)}}
 updHUD();
}
function endClientMatch(){inMatch=false;showResult()}
function playEvent(e){
 const t=e[1],a=e[2],b=e[3];
 if(t==='k'){sfx('kick');shake=Math.max(shake,.25);for(let i=0;i<6;i++)emit(a,.5,b,(Math.random()-.5)*4,2+Math.random()*3,(Math.random()-.5)*4,0xffffff,.4,.25,10)}
 else if(t==='h'){sfx('hit');shake=Math.max(shake,.4);for(let q=0;q<8;q++)emit(a,1.2,b,(Math.random()-.5)*8,2+Math.random()*4,(Math.random()-.5)*8,0xffe14d,.5,.3,12)}
 else if(t==='d'){tone(300,.2,'sawtooth',.04,2)}
 else if(t==='g'){onGoalFX(a)}
}
function sendIn(force){
 const O=ONLINE,now=performance.now();
 const v={x:r2(inp.x),z:r2(inp.z),sn:O.sn,dn:O.dn},k=JSON.stringify(v);
 if(!force){if(now-O.lastSend<50)return;if(k===O.lastIn&&now-O.lastSend<500)return}
 O.lastIn=k;O.lastSend=now;NET.set(`rooms/${O.code}/in/${NET.uid}`,v);
}
function onlineClientUpdate(dt){
 const O=ONLINE;stateT+=dt;
 const me=human;
 me.shootCd-=dt;me.dashCd-=dt;me.kick-=dt;me.dash-=dt;
 const live=state==='play';
 if(inp.shoot){inp.shoot=false;if(live&&me.shootCd<=0){O.sn++;doShoot(me);sendIn(true)}}
 if(inp.dash){inp.dash=false;if(live&&me.dashCd<=0){O.dn++;tryDash(me);sendIn(true)}}
 // décompte
 if(state==='countdown'){const n=Math.ceil(O.cd-.2);if(n!==lastCd&&n>=1&&n<=3){lastCd=n;showBanner(String(n),'show');sfx('tick')}}
 // interpolation de l'état reçu (affichage décalé de ~110 ms)
 const b=O.buf;
 if(b.length){
  const rt=performance.now()-110;let A=b[0],B=b[0];
  for(let j=b.length-1;j>=0;j--){if(b[j].at<=rt){A=b[j];B=b[j+1]||b[j];break}}
  const f=A===B?0:clamp((rt-A.at)/(B.at-A.at),0,1);
  players.forEach((p,k)=>{
   const a=A.s.p[k],c=B.s.p[k];if(!a||!c)return;
   const jump=Math.hypot(a[0]-c[0],a[1]-c[1])>6,ff=jump?1:f;
   const x=lerp(a[0],c[0],ff),z=lerp(a[1],c[1],ff);
   const fl=c[5];
   if(p===me){
    // prédiction locale + recalage doux sur la position de l'hôte
    if(live)movePlayer(p,inp.x,inp.z,dt);else{p.vx*=.8;p.vz*=.8}
    const ex=x-p.x,ez=z-p.z,err=Math.hypot(ex,ez),moving=Math.hypot(inp.x,inp.z)>.1;
    if(err>3.5||jump||!live){p.x=x;p.z=z;p.vx=c[3];p.vz=c[4]}
    else if(!moving&&err>.05){const k=Math.min(1,dt*6);p.x+=ex*k;p.z+=ez*k}
    else if(err>1.6){const k=Math.min(1,dt*1.2);p.x+=ex*k;p.z+=ez*k}
    if(fl&1)p.stun=.3;else p.stun=0;
   }else{
    p.x=x;p.z=z;p.hd=a[2]+angDiff(a[2],c[2])*ff;p.vx=c[3];p.vz=c[4];
    p.stun=fl&1?.3:0;p.dash=fl&2?.2:0;
    if((fl&4)&&!p._kf)p.kick=.28;p._kf=!!(fl&4);p.kick-=dt;
   }
  });
  const ba=A.s.b,bb=B.s.b,bj=Math.hypot(ba[0]-bb[0],ba[2]-bb[2])>6,bf=bj?1:f;
  ball.x=lerp(ba[0],bb[0],bf);ball.y=lerp(ba[1],bb[1],bf);ball.z=lerp(ba[2],bb[2],bf);ball.vx=bb[3];ball.vz=bb[4];
 }
 sendIn(false);
}

setTimeout(()=>ensureSoc().catch(()=>{}),1200);
renderFriends();
