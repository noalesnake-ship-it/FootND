'use strict';
const $=s=>document.querySelector(s);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angDiff=(a,b)=>{let d=b-a;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};

/* ============ DONNÉES ============ */
const RAR=[
 {n:'Commun',c:'#9aa7b5'},{n:'Rare',c:'#3fa9ff'},{n:'Épique',c:'#b44cff'},
 {n:'Légendaire',c:'#ffb21e'},{n:'Mythique',c:'#ff3d6e'}];
// st = [vitesse, tir, contrôle]
const SHOES=[
 {id:'classic',n:'Crampons Classiques',r:0,main:0xf2f2f2,acc:0x222222,st:[3,3,3]},
 {id:'rouille',n:'Baskets Rouillées',r:0,main:0xb5703a,acc:0x4a2a12,st:[4,2,3]},
 {id:'menthe',n:'Menthe Fraîche',r:0,main:0x58d6a0,acc:0xffffff,st:[3,4,3]},
 {id:'eclair',n:'Éclair Bleu',r:1,main:0x2f9bff,acc:0xffffff,st:[5,4,4]},
 {id:'citron',n:'Turbo Citron',r:1,main:0xffe92e,acc:0x222222,st:[6,3,4]},
 {id:'rosepop',n:'Rose Pop',r:1,main:0xff6fb5,acc:0xffffff,st:[4,5,4]},
 {id:'foudre',n:'Foudre Violette',r:2,main:0x9b3bff,acc:0xffe14d,st:[7,5,5]},
 {id:'rocket',n:'Rocket Magenta',r:2,main:0xff2fa0,acc:0x2a0a3a,st:[5,8,5]},
 {id:'glace',n:'Glace Polaire',r:2,main:0x9ff3ff,acc:0x2a7bd0,st:[6,6,7]},
 {id:'phenix',n:'Phénix Doré',r:3,main:0xffc21a,acc:0xff4a12,st:[8,7,7]},
 {id:'dragon',n:'Dragon Solaire',r:3,main:0xff4a12,acc:0xffd23a,st:[7,9,7]},
 {id:'galaxie',n:'Galaxie Infinie',r:4,main:0x2a1a7a,acc:0x66e0ff,st:[9,9,8]},
 {id:'neon',n:'Néon Mythique',r:4,main:0x15f5a0,acc:0xff2f8f,st:[10,8,9]},
];
/* ---- 987 chaussures générées (déterministes : mêmes ids et mêmes looks sur tous les appareils) → 1000 au total ---- */
(function genShoes(){
 let a=20261128;const rnd=()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
 const NM=['Tonnerre','Dragon','Faucon','Requin','Tigre','Loup','Cobra','Météore','Cyclone','Volcan','Titan','Spectre','Samouraï','Ninja','Pirate','Éclair','Blizzard','Typhon'];
 const NF=['Comète','Panthère','Tempête','Vipère','Aurore','Lame','Flamme','Étoile','Vague','Avalanche','Fusée','Légende','Tornade','Sirène','Orbite','Galaxie','Panique','Rafale'];
 const AJ=[['Rouge','Rouge'],['Doré','Dorée'],['Argenté','Argentée'],['Cosmique','Cosmique'],['Électrique','Électrique'],['Sauvage','Sauvage'],['Glacial','Glaciale'],['Ardent','Ardente'],['Fantôme','Fantôme'],['Turbo','Turbo'],['Ultra','Ultra'],['Royal','Royale'],['Mystique','Mystique'],['Furtif','Furtive'],['Radieux','Radieuse'],['Cobalt','Cobalt'],['Obsidienne','Obsidienne'],['Émeraude','Émeraude'],['Rubis','Rubis'],['Saphir','Saphir'],['Ivoire','Ivoire'],['Nocturne','Nocturne'],['Solaire','Solaire'],['Lunaire','Lunaire'],['Infernal','Infernale'],['Céleste','Céleste'],['Brutal','Brutale'],['Agile','Agile'],['Foudroyant','Foudroyante'],['Impérial','Impériale']];
 const used=new Set(SHOES.map(s=>s.n)),combos=[];
 NM.forEach(n=>AJ.forEach(j=>combos.push(n+' '+j[0])));NF.forEach(n=>AJ.forEach(j=>combos.push(n+' '+j[1])));
 for(let i=combos.length-1;i>0;i--){const j=(rnd()*(i+1))|0;[combos[i],combos[j]]=[combos[j],combos[i]]}
 const todo=combos.filter(n=>!used.has(n));
 const COUNT=[400,300,180,80,27],RANGE=[[8,10],[12,14],[16,19],[21,23],[26,28]];
 let k=0,id=1;const col=new THREE.Color();
 const hex=(h,sa,l)=>col.setHSL(h,sa,l).getHex();
 COUNT.forEach((cnt,r)=>{for(let i=0;i<cnt;i++,id++){
  const T=RANGE[r][0]+((rnd()*(RANGE[r][1]-RANGE[r][0]+1))|0);
  let st=[0,1,2].map(()=>clamp(Math.round(T/3+(rnd()-.5)*4),2,10));
  for(let g=0;g<30&&st.reduce((x,y)=>x+y,0)!==T;g++){const j=(rnd()*3)|0,d=st.reduce((x,y)=>x+y,0)<T?1:-1;st[j]=clamp(st[j]+d,2,10)}
  const h=rnd(),m=hex(h,.65+rnd()*.35,.42+rnd()*.16),q=rnd();
  const ac=q<.3?0xffffff:q<.5?0x1a1a2a:q<.8?hex((h+.5)%1,.9,.55):hex((h+.12+rnd()*.2)%1,1,.6);
  SHOES.push({id:'g'+String(id).padStart(3,'0'),n:todo[k++],r,main:m,acc:ac,st,v:(rnd()*8)|0});
 }});
})();
const SH=Object.fromEntries(SHOES.map(s=>[s.id,s]));
const BOXES={
 bronze:{n:'Coffre Bronze',cost:100,cur:'coins',odds:[70,24,5.5,.5,0],em:'📦'},
 or:{n:'Coffre Or',cost:300,cur:'coins',odds:[40,38,16,5.5,.5],em:'🎁'},
 mythique:{n:'Coffre Mythique',cost:60,cur:'gems',odds:[0,40,38,17,5],em:'💎'}};
/* ---- modes de jeu (hors ligne, contre les robots) ---- */
const MODES={
 classic:{n:'Classique',em:'⚽',t:120,goals:0,spd:1,dcd:1,pow:1,g:26,d:'Le match normal : 2 minutes, but en or en cas d\'égalité.'},
 sudden:{n:'Mort subite',em:'⚡',t:120,goals:1,spd:1,dcd:1,pow:1,g:26,d:'Le premier qui marque gagne. Un seul but décide de tout !'},
 race5:{n:'Premier à 5',em:'🏁',t:240,goals:5,spd:1,dcd:1,pow:1,g:26,d:'Premier à 5 buts, ou le plus de buts au bout de 4 minutes.'},
 turbo:{n:'Turbo',em:'🚀',t:90,goals:0,spd:1.35,dcd:.35,pow:1.15,g:26,d:'Tout le monde court plus vite et sprinte presque en continu.'},
 moon:{n:'Gravité lune',em:'🌙',t:120,goals:0,spd:1,dcd:1,pow:1.1,g:8,d:'Le ballon flotte longtemps dans les airs.'},
 power:{n:'Super tirs',em:'💥',t:90,goals:0,spd:1,dcd:1,pow:1.7,g:26,d:'Des frappes de feu : le ballon part comme un boulet.'},
 blitz:{n:'Blitz',em:'⏱️',t:45,goals:0,spd:1.15,dcd:.6,pow:1.1,g:26,d:'45 secondes seulement. Tout se joue vite !'},
 training:{n:'Entraînement',em:'🎯',t:3600,goals:0,spd:1,dcd:.5,pow:1,g:26,idle:1,d:'Les robots restent immobiles : travaille tes tirs, sans récompense.'},
 chaos:{n:'Chaos',em:'🌀',t:150,goals:0,spd:1,dcd:1,pow:1,g:26,chaos:1,d:'Toutes les 10 secondes, une règle change au hasard.'}};
const CHAOS=[
 {n:'🌙 GRAVITÉ LUNE',g:8},{n:'🚀 TURBO',spd:1.4,dcd:.35},{n:'🐌 RALENTI',spd:.7},{n:'💥 SUPER TIRS',pow:1.7},{n:'😐 NORMAL'},{n:'⚡ SPRINT À VOLONTÉ',dcd:.15}];
let modeSel='classic';try{const m=localStorage.getItem('kb_mode');if(MODES[m])modeSel=m}catch(e){}
let MODE=MODES.classic,MOD={spd:1,dcd:1,pow:1,g:26},chaosT=10;
function setMod(o){MOD={spd:o.spd||1,dcd:o.dcd||1,pow:o.pow||1,g:o.g||26}}
const UP_NEED=[1,2,3,4], UP_COST=[100,200,400,800];
const statMul=lv=>1+.08*(lv-1);

/* ============ SAUVEGARDE ============ */
const KEY='kickbrawl3d_v1';
let S=null;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
const defaultSave=()=>({coins:300,gems:20,owned:{classic:{lv:1,extra:0}},eq:'classic',boxes:{bronze:1,or:0,mythique:0},daily:0,w:0,l:0,d:0,g:0,v:0,bp:{xp:0,cl:{}},codes:{},size:3});
if(!S||!S.owned) S=defaultSave();
function fixSave(o){
 o.bp=o.bp||{xp:0,cl:{}};o.bp.cl=o.bp.cl||{};o.codes=o.codes||{};o.size=o.size||3;
 if(!o.st)o.st={m:(o.w||0)+(o.l||0)+(o.d||0),w:o.w||0,l:o.l||0,d:o.d||0,g:o.g||0};
 o.st=Object.assign({m:0,w:0,l:0,d:0,g:0,ga:0,sh:0,da:0,ht:0,sec:0,bws:0,cs:0,sp:0,mx:0},o.st);
 o.ws=o.ws||0;o.streak=Object.assign({n:0,max:0},o.streak||{});o.wheel=o.wheel||'';
 o.kit=Object.assign({b:null,c:null},o.kit||{});o.balls=o.balls||{};o.balls.own=o.balls.own||{classic:1};o.balls.eq=o.balls.eq||'classic';
 o.theme=o.theme||'day';o.diff=(o.diff==null?1:o.diff);o.fav=o.fav||{};o.pity=o.pity||0;
 o.set=Object.assign({snd:1,vib:1,shk:1,crowd:1,fps:0},o.set||{});o.miss=o.miss||{d:'',l:[]};o.ach=o.ach||{};
 return o}   // complète une ancienne sauvegarde (locale ou du compte)
fixSave(S);
const dayKey=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};
const hash32=t=>{let h=2166136261;for(let i=0;i<t.length;i++){h^=t.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0};
const eventMul=()=>{const d=new Date().getDay();return d===0||d===6?2:1};   // week-end : pièces ×2
const buzz=ms=>{if(S.set.vib&&navigator.vibrate){try{navigator.vibrate(ms)}catch(e){}}};
let onSave=null;
function save(){S.v=Math.max(Date.now(),(S.v||0)+1);try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}if(onSave)onSave()}

/* ============ AUDIO ============ */
let AC=null;
function unlockAudio(){try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}}
function tone(f,d,type,vol,slide,delay){try{if(!AC||!S.set.snd)return;const t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);g.gain.setValueAtTime(vol||.12,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
function cheer(){try{
 if(!AC||!S.set.snd||!S.set.crowd)return;
 const n=AC.sampleRate*2,b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1);
 const src=AC.createBufferSource();src.buffer=b;const f=AC.createBiquadFilter();f.type='bandpass';f.frequency.value=900;f.Q.value=.5;
 const g=AC.createGain();const t=AC.currentTime;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.22,t+.35);g.gain.exponentialRampToValueAtTime(.0001,t+2);
 src.connect(f);f.connect(g);g.connect(AC.destination);src.start(t);src.stop(t+2)}catch(e){}}
function sfx(k){
 if(k==='kick'){tone(180,.12,'triangle',.3,.4)}
 else if(k==='dash'){tone(300,.25,'sawtooth',.08,2.4)}
 else if(k==='hit'){tone(110,.15,'square',.12,.5)}
 else if(k==='goal'){[523,659,784,1046].forEach((f,i)=>tone(f,.28,'square',.12,1,i*.12))}
 else if(k==='whistle'){tone(1800,.35,'sine',.1,1.05)}
 else if(k==='tick'){tone(700,.08,'square',.08)}
 else if(k==='shake'){tone(120,.1,'square',.08,.8)}
 else if(k==='open'){[392,523,659,784,1046].forEach((f,i)=>tone(f,.3,'triangle',.15,1,i*.07))}
 else if(k==='win'){[523,659,784,659,784,1046].forEach((f,i)=>tone(f,.25,'square',.1,1,i*.13))}
 else if(k==='lose'){[392,330,262].forEach((f,i)=>tone(f,.3,'triangle',.12,1,i*.2))}
 else if(k==='ui'){tone(520,.07,'square',.07)}
 else if(k==='cheer'){cheer()}
}

/* ============ THREE : SCÈNE ============ */
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x6fc8ff);scene.fog=new THREE.Fog(0x6fc8ff,70,150);
const cam=new THREE.PerspectiveCamera(42,1,.5,300);
const hemi=new THREE.HemisphereLight(0xffffff,0x6a8a5a,1.0);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffffff,1.0);sun.position.set(-10,30,14);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-32,right:32,top:24,bottom:-24,near:1,far:80});
scene.add(sun);scene.add(sun.target);

const FW=20,FH=12,GW=4,GH=3.1,BR=.55,PR=.62;
const mat=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
function addBox(w,h,d,c,x,y,z,shadow){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);if(shadow!==false){m.castShadow=true;m.receiveShadow=true}scene.add(m);return m}

// sol + terrain
const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),mat(0x4a5d8a));ground.rotation.x=-Math.PI/2;ground.position.y=-.03;ground.receiveShadow=true;scene.add(ground);
const THEMES=[
 {id:'day',n:'Jour',em:'☀️',sky:0x6fc8ff,g1:'#3da83d',g2:'#49b949',ln:'rgba(255,255,255,.9)',ground:0x4a5d8a,hemi:1,sun:1},
 {id:'night',n:'Nuit',em:'🌙',sky:0x0b1236,g1:'#1d6b2e',g2:'#247a37',ln:'rgba(255,255,255,.9)',ground:0x161c3a,hemi:.5,sun:.45},
 {id:'snow',n:'Neige',em:'❄️',sky:0xcfe6ff,g1:'#e4f1ff',g2:'#d3e6f7',ln:'rgba(70,120,190,.95)',ground:0xaec4dd,hemi:1.1,sun:.9,wx:'snow'},
 {id:'rain',n:'Pluie',em:'🌧️',sky:0x7f8c9a,g1:'#2d7739',g2:'#348545',ln:'rgba(255,255,255,.85)',ground:0x3a4658,hemi:.75,sun:.5,wx:'rain'},
 {id:'desert',n:'Désert',em:'🏜️',sky:0xffc98a,g1:'#e2b66c',g2:'#d8a95a',ln:'rgba(120,60,10,.9)',ground:0xb98a4a,hemi:1.05,sun:1.1},
 {id:'neon',n:'Néon',em:'💜',sky:0x140a30,g1:'#1b1040',g2:'#24144f',ln:'rgba(0,255,208,.95)',ground:0x0a0620,hemi:.6,sun:.5}];
const PITCH={c:null,t:null};
function drawPitch(th){
 const W=1840,H=1040,k=40;let c=PITCH.c;
 if(!c){c=PITCH.c=document.createElement('canvas');c.width=W;c.height=H}
 const g=c.getContext('2d');
 for(let i=0;i<23;i++){g.fillStyle=i%2?th.g1:th.g2;g.fillRect(i*80,0,80,H)}
 const X=x=>(x+23)*k,Z=z=>(z+13)*k;
 g.strokeStyle=th.ln;g.lineWidth=7;
 g.strokeRect(X(-FW),Z(-FH),FW*2*k,FH*2*k);
 g.beginPath();g.moveTo(X(0),Z(-FH));g.lineTo(X(0),Z(FH));g.stroke();
 g.beginPath();g.arc(X(0),Z(0),3.5*k,0,7);g.stroke();
 g.fillStyle=th.ln;g.beginPath();g.arc(X(0),Z(0),.3*k,0,7);g.fill();
 [-1,1].forEach(s=>{g.strokeRect(s<0?X(-FW):X(FW-5),Z(-6),5*k,12*k);g.strokeRect(s<0?X(-FW):X(FW-2.5),Z(-3.5),2.5*k,7*k)});
 g.fillStyle='rgba(60,90,200,.35)';g.fillRect(X(-23),Z(-4),3*k,8*k);g.fillStyle='rgba(220,50,50,.35)';g.fillRect(X(20),Z(-4),3*k,8*k);
 if(!PITCH.t){
  const t=PITCH.t=new THREE.CanvasTexture(c);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
  const f=new THREE.Mesh(new THREE.PlaneGeometry(46,26),new THREE.MeshLambertMaterial({map:t}));f.rotation.x=-Math.PI/2;f.receiveShadow=true;scene.add(f);
 }else PITCH.t.needsUpdate=true;
}
drawPitch(THEMES[0]);
/* météo : neige / pluie */
const WX={pts:null,kind:null};
function setWeather(kind){
 if(WX.pts){scene.remove(WX.pts);WX.pts.geometry.dispose();WX.pts.material.dispose();WX.pts=null}
 WX.kind=kind||null;if(!kind)return;
 const n=kind==='snow'?380:320,a=new Float32Array(n*3);
 for(let i=0;i<n;i++){a[i*3]=(Math.random()-.5)*70;a[i*3+1]=Math.random()*24;a[i*3+2]=(Math.random()-.5)*50}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(a,3));
 WX.pts=new THREE.Points(g,new THREE.PointsMaterial({color:kind==='snow'?0xffffff:0xaed0ff,size:kind==='snow'?.28:.16,transparent:true,opacity:.9}));
 WX.pts.frustumCulled=false;scene.add(WX.pts);
}
function updWeather(dt){
 if(!WX.pts)return;const a=WX.pts.geometry.attributes.position.array,sp=WX.kind==='snow'?2.4:24,dr=WX.kind==='snow'?.6:-3;
 for(let i=0;i<a.length;i+=3){a[i+1]-=sp*dt;a[i]+=dr*dt;if(a[i+1]<0){a[i+1]=24;a[i]=(Math.random()-.5)*70}}
 WX.pts.geometry.attributes.position.needsUpdate=true;
}
function setTheme(id){
 const th=THEMES.find(t=>t.id===id)||THEMES[0];
 scene.background=new THREE.Color(th.sky);scene.fog.color.setHex(th.sky);
 ground.material.color.setHex(th.ground);hemi.intensity=th.hemi;sun.intensity=th.sun;
 drawPitch(th);setWeather(th.wx);
}
// murs
const nets=[];
const WC=0xe9ecf8;
addBox(42.6,1,1.2,WC,0,.5,-FH-.6);addBox(42.6,1,1.2,WC,0,.5,FH+.6);
[[-1,0x2f7bff],[1,0xff3b3b]].forEach(([s,col])=>{
 const zl=(FH+1.2-GW-.2);
 addBox(1.2,1.4,zl,col,s*(FW+.6),.7,-(GW+.2+zl/2));addBox(1.2,1.4,zl,col,s*(FW+.6),.7,(GW+.2+zl/2));
 // but : poteaux + barre + filet
 const pm=new THREE.MeshLambertMaterial({color:0xffffff});
 [-GW,GW].forEach(z=>{const p=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,GH,10),pm);p.position.set(s*FW,GH/2,z);p.castShadow=true;scene.add(p)});
 const bar=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,GW*2,10),pm);bar.rotation.x=Math.PI/2;bar.position.set(s*FW,GH,0);scene.add(bar);
 const net=new THREE.Mesh(new THREE.BoxGeometry(3,GH,GW*2,6,6,16),new THREE.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.4}));
 net.position.set(s*(FW+1.5),GH/2,0);scene.add(net);
 nets.push({m:net,s,orig:net.geometry.attributes.position.array.slice(),amp:0,t:0,ix:0,iy:0,iz:0});
 addBox(.3,GH+1,GW*2+1,col,s*(FW+3.1),(GH+1)/2,0);
});
// tribunes (instanced)
(function(){
 const n=4*46*2,im=new THREE.InstancedMesh(new THREE.BoxGeometry(.8,1.3,.8),new THREE.MeshLambertMaterial({color:0xffffff}),n);
 const pal=[0xff5252,0x4aa3ff,0xffd93a,0xffffff,0x7dff6a,0xff8cd0,0xb26bff].map(c=>new THREE.Color(c));
 const m4=new THREE.Matrix4();let i=0;
 for(const s of[-1,1])for(let r=0;r<4;r++)for(let x=-23;x<23;x++){
  m4.makeTranslation(x+.5,.7+r*.9,s*(FH+3+r*1.2));im.setMatrixAt(i,m4);im.setColorAt(i,pal[(Math.random()*pal.length)|0]);i++}
 im.count=i;scene.add(im);
 for(const s of[-1,1])for(let r=0;r<4;r++)addBox(46,.5+r*.9,1.1,0x3a3f6a,0,(.5+r*.9)/2-.05,s*(FH+2.6+r*1.2),false);
})();

/* ---- filets animés : onde amortie à l'impact ---- */
function rippleNet(side,x,y,z,k){
 const n=nets.find(q=>q.s===side);if(!n)return;
 n.ix=x-n.m.position.x;n.iy=y-n.m.position.y;n.iz=z;n.amp=Math.min(1.6,.5+k*.07);n.t=0;
}
function updNets(dt){
 for(const n of nets){
  if(n.amp<=0)continue;
  n.t+=dt;const pos=n.m.geometry.attributes.position,a=pos.array,o=n.orig;
  const done=n.t>2.6;
  for(let i=0;i<a.length;i+=3){
   if(done){a[i]=o[i];a[i+1]=o[i+1];a[i+2]=o[i+2];continue}
   const ox=o[i],oy=o[i+1],oz=o[i+2];
   const d=Math.hypot(ox-n.ix,oy-n.iy,oz-n.iz);
   const w=n.s>0?(ox+1.5)/3:(1.5-ox)/3;           // 0 sur la ligne de but, 1 au fond
   const f=n.amp*Math.exp(-d*.45)*Math.cos(d*2.2-n.t*17)*Math.exp(-n.t*2.3)*(.25+.75*w);
   a[i]=ox+f*n.s*.9;a[i+1]=oy+f*.18;a[i+2]=oz+f*.18*Math.sign(oz-n.iz||1);
  }
  pos.needsUpdate=true;if(done)n.amp=0;
 }
}

/* ============ MODÈLES ============ */
const OUT=new THREE.MeshBasicMaterial({color:0x14122e,side:THREE.BackSide});
function outline(m,s){const o=new THREE.Mesh(m.geometry,OUT);o.scale.setScalar(s);m.add(o)}
const G={toe:new THREE.SphereGeometry(.3,12,8),heel:new THREE.SphereGeometry(.28,12,8),sole:new THREE.BoxGeometry(1.1,.14,.5),stripe:new THREE.BoxGeometry(.45,.08,.04),stud:new THREE.CylinderGeometry(.05,.07,.1,6)};
const GX={cap:new THREE.SphereGeometry(.2,10,8),wing:new THREE.BoxGeometry(.5,.08,.52),flame:new THREE.BoxGeometry(.72,.05,.14)};
function mkShoe(main,acc,glow,v){
 const g=new THREE.Group();
 const mm=new THREE.MeshStandardMaterial({color:main,roughness:.45,metalness:.1,emissive:glow?main:0,emissiveIntensity:glow?.28:0});
 const am=new THREE.MeshStandardMaterial({color:acc,roughness:.55,emissive:glow?acc:0,emissiveIntensity:glow?.22:0});
 const sole=new THREE.Mesh(G.sole,am);sole.position.set(.04,.07,0);
 const toe=new THREE.Mesh(G.toe,mm);toe.scale.set(1.5,.8,.95);toe.position.set(.12,.32,0);
 const heel=new THREE.Mesh(G.heel,mm);heel.scale.set(1,1.15,.95);heel.position.set(-.3,.4,0);
 g.add(sole,toe,heel);
 [-1,1].forEach(s=>{const st=new THREE.Mesh(G.stripe,am);st.position.set(-.02,.36,s*.26);st.rotation.z=.25;g.add(st)});
 [[-.4,-.17],[-.4,.17],[.4,-.17],[.4,.17]].forEach(([x,z])=>{const st=new THREE.Mesh(G.stud,am);st.position.set(x,-.03,z);g.add(st)});
 v=v|0;   // variantes de forme (chaussures générées) : bit 1 = bout renforcé, 2 = aileron, 4 = flamme
 if(v&1){const m=new THREE.Mesh(GX.cap,am);m.scale.set(1,.8,1.25);m.position.set(.56,.3,0);g.add(m)}
 if(v&2){const m=new THREE.Mesh(GX.wing,am);m.position.set(-.64,.66,0);m.rotation.z=.2;g.add(m)}
 if(v&4){const m=new THREE.Mesh(GX.flame,am);m.position.set(.02,.64,0);g.add(m)}
 return g;
}
// miniatures 3D des chaussures
let thumbR=null;const thumbCache={};
function thumb(s){
 if(thumbCache[s.id])return thumbCache[s.id];
 try{
  if(!thumbR){thumbR=new THREE.WebGLRenderer({antialias:true,alpha:true,preserveDrawingBuffer:true});thumbR.setPixelRatio(1);thumbR.setSize(240,240)}
  const sc=new THREE.Scene();sc.add(new THREE.HemisphereLight(0xffffff,0x7788aa,1.5));
  const dl=new THREE.DirectionalLight(0xffffff,1.6);dl.position.set(3,5,4);sc.add(dl);
  const sh=mkShoe(s.main,s.acc,s.r>=3,s.v);sh.rotation.y=-.65;sh.scale.setScalar(1.3);sc.add(sh);
  const c=new THREE.PerspectiveCamera(30,1,.1,50);c.position.set(0,1.7,3.7);c.lookAt(0,.3,0);
  thumbR.render(sc,c);
  return thumbCache[s.id]=thumbR.domElement.toDataURL();
 }catch(e){return ''}
}

/* ============ JOUEURS / BALLE ============ */
const SKIN=[0xffd2a0,0xe8b080,0xc68642,0x8d5524];
const players=[];let human=null,myTeam=0;
function mkPlayer(team,idx){
 const g=new THREE.Group(),jc=team?0xff3b3b:0x2f7bff;
 const body=new THREE.Mesh(new THREE.CapsuleGeometry(.45,.5,4,10),mat(jc));body.position.y=1.0;body.castShadow=true;outline(body,1.12);
 const head=new THREE.Group();head.position.y=2.0;
 const hm=new THREE.Mesh(new THREE.SphereGeometry(.45,14,10),mat(SKIN[(team*3+idx)%4]));hm.castShadow=true;outline(hm,1.1);
 const cap=new THREE.Mesh(new THREE.SphereGeometry(.47,14,8,0,Math.PI*2,0,Math.PI/2),mat(jc===0xff3b3b?0xb01818:0x1850b8));cap.position.y=.05;
 const brim=new THREE.Mesh(new THREE.BoxGeometry(.4,.06,.5),cap.material);brim.position.set(.42,.08,0);
 const e1=new THREE.Mesh(new THREE.SphereGeometry(.07,8,6),new THREE.MeshBasicMaterial({color:0x111111})),e2=e1.clone();
 e1.position.set(.4,-.02,.16);e2.position.set(.4,-.02,-.16);
 head.add(hm,cap,brim,e1,e2);
 g.add(body,head);
 const p={team,idx,uid:null,remote:false,g,body,head,x:0,z:0,vx:0,vz:0,hd:0,stun:0,kick:0,dash:0,dashCd:0,shootCd:0,legT:0,ax:0,az:0,thinkT:0,
  spd:8.6,pow:20,ctl:3,shoes:null,sL:null,sR:null,celeb:0,rid:Math.random()*9};
 {
  const ring=new THREE.Mesh(new THREE.RingGeometry(.85,1.1,28),new THREE.MeshBasicMaterial({color:0xffe14d,side:THREE.DoubleSide,transparent:true,opacity:.9}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.04;g.add(ring);p.ring=ring;
  const ar=new THREE.Mesh(new THREE.ConeGeometry(.28,.5,3),new THREE.MeshBasicMaterial({color:0xffe14d}));ar.rotation.x=Math.PI;ar.position.y=3.1;g.add(ar);p.arrow=ar;
 }
 p.bodyM=body.material;p.capM=cap.material;p.jcBase=jc;p.capBase=jc===0xff3b3b?0xb01818:0x1850b8;
 applyShoe(p,SH.classic);
 scene.add(g);return p;
}
function applyShoe(p,s){
 if(p.sL){p.g.remove(p.sL);p.g.remove(p.sR)}
 const mk=()=>{const w=new THREE.Group();const sh=mkShoe(s.main,s.acc,s.r>=3,s.v);sh.scale.setScalar(.5);w.add(sh);p.g.add(w);return w};
 p.sL=mk();p.sR=mk();p.shoe=s;
}
for(let t=0;t<2;t++)for(let i=0;i<3;i++)players.push(mkPlayer(t,i));
human=players[0];
let SIZE=3;   // joueurs par équipe (1v1, 2v2, 3v3) : les joueurs en trop sont désactivés (p.off)
function setSize(n){SIZE=clamp(n|0,1,3);players.forEach(p=>{p.off=p.idx>=SIZE})}
function setStats(p,id,lv){const s=SH[id]||SH.classic,m=statMul(lv||1);p.spd=8.2+s.st[0]*m*.22;p.pow=16+s.st[1]*m*1.3;p.ctl=s.st[2]*m;applyShoe(p,s)}
const DIFF=[{n:'Facile',s:.85,p:.9,m:.6},{n:'Normal',s:1,p:1,m:1},{n:'Difficile',s:1.12,p:1.1,m:1.4},{n:'Légende',s:1.25,p:1.2,m:2}];
function setBot(p){const D=DIFF[S.diff]||DIFF[1];applyKit(p,false);p.remote=false;p.uid=null;p.rin=null;p.spd=8.5*D.s;p.pow=20*D.p;p.ctl=4;if(p.shoe!==SH.classic)applyShoe(p,SH.classic);setName(p,'')}
function applyKit(p,me){p.bodyM.color.setHex(me&&S.kit.b!=null?S.kit.b:p.jcBase);p.capM.color.setHex(me&&S.kit.c!=null?S.kit.c:p.capBase)}
function applyStats(){setStats(human,S.eq,S.owned[S.eq].lv);applyKit(human,!ONLINE)}
function setName(p,txt){
 if(p.tag){p.g.remove(p.tag);p.tag.material.map.dispose();p.tag.material.dispose();p.tag=null}
 if(!txt)return;
 const c=document.createElement('canvas');c.width=256;c.height=64;const g=c.getContext('2d');
 g.font='bold 34px Arial';g.textAlign='center';g.lineWidth=7;g.strokeStyle='#14122e';g.fillStyle='#fff';g.strokeText(txt,128,44);g.fillText(txt,128,44);
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),depthTest:false,transparent:true}));
 sp.scale.set(3,.75,1);sp.position.y=3.5;sp.renderOrder=5;p.g.add(sp);p.tag=sp;
}
players.forEach(p=>{if(p!==human)setBot(p)});

// balle
const ball={x:0,y:BR,z:0,vx:0,vy:0,vz:0};
const BALLS=[
 {id:'classic',n:'Classique',p:0,col:'#ffffff',pat:'#222222',tr:0},
 {id:'or',n:'Doré',p:500,col:'#ffcf33',pat:'#b8860b',tr:0xffd23a},
 {id:'neon',n:'Néon',p:800,col:'#15f5a0',pat:'#ff2f8f',tr:0x15f5a0},
 {id:'feu',n:'Boule de feu',p:1200,col:'#ff5a12',pat:'#ffd23a',tr:0xff6a1a},
 {id:'glace',n:'Glace',p:1200,col:'#9fecff',pat:'#2a7bd0',tr:0xbdf3ff},
 {id:'galaxie',n:'Galaxie',p:2500,col:'#2a1a7a',pat:'#66e0ff',tr:'rainbow'}];
const ballTexCache={};
function ballCanvas(b){
 const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');g.fillStyle=b.col;g.fillRect(0,0,256,128);g.fillStyle=b.pat;
 for(let i=0;i<8;i++)for(let j=0;j<3;j++){g.beginPath();const x=i*32+16+(j%2)*16,y=j*40+22;for(let k=0;k<5;k++){const a=k*Math.PI*2/5-Math.PI/2;g.lineTo(x+Math.cos(a)*11,y+Math.sin(a)*11)}g.fill()}
 if(b.id==='galaxie'){g.fillStyle='#fff';for(let i=0;i<40;i++){g.fillRect(Math.random()*256,Math.random()*128,2,2)}}
 return c}
const ballMesh=(function(){
 const m=new THREE.Mesh(new THREE.SphereGeometry(BR,18,14),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(ballCanvas(BALLS[0]))}));
 m.castShadow=true;outline(m,1.1);scene.add(m);return m})();
function setBallSkin(id){
 const b=BALLS.find(x=>x.id===id)||BALLS[0];
 if(!ballTexCache[b.id])ballTexCache[b.id]=new THREE.CanvasTexture(ballCanvas(b));
 ballMesh.material.map=ballTexCache[b.id];ballMesh.material.needsUpdate=true;
}
function ballTrail(){
 const b=BALLS.find(x=>x.id===S.balls.eq);if(!b||!b.tr)return;
 if(Math.hypot(ball.vx,ball.vz)<13||Math.random()<.4)return;
 const col=b.tr==='rainbow'?new THREE.Color().setHSL((performance.now()/500)%1,1,.6):b.tr;
 emit(ball.x,ball.y,ball.z,(Math.random()-.5)*.8,.4+Math.random(),(Math.random()-.5)*.8,col,.5,.45,0);
}

/* particules */
const PP=[],pgeo=new THREE.BoxGeometry(1,1,1);let pIdx=0;
for(let i=0;i<150;i++){const m=new THREE.Mesh(pgeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true}));m.visible=false;scene.add(m);PP.push({m,life:0,max:1,vx:0,vy:0,vz:0,g:0,sz:.2})}
function emit(x,y,z,vx,vy,vz,col,life,sz,g){const p=PP[pIdx++%PP.length];p.m.visible=true;p.m.position.set(x,y,z);p.m.material.color.set(col);p.vx=vx;p.vy=vy;p.vz=vz;p.life=p.max=life;p.g=g||0;p.sz=sz;p.m.rotation.set(Math.random()*3,Math.random()*3,0)}
function updParts(dt){for(const p of PP){if(!p.m.visible)continue;p.life-=dt;if(p.life<=0){p.m.visible=false;continue}p.vy-=p.g*dt;p.m.position.x+=p.vx*dt;p.m.position.y+=p.vy*dt;p.m.position.z+=p.vz*dt;p.m.scale.setScalar(p.sz*(p.life/p.max))}}
function confetti(team){const cols=team?[0xff3b3b,0xffd93a,0xffffff]:[0x2f7bff,0xffd93a,0xffffff];
 for(let i=0;i<70;i++)emit((team?FW:-FW)*.9+(Math.random()-.5)*4,2+Math.random()*2,(Math.random()-.5)*8,(Math.random()-.5)*14,8+Math.random()*10,(Math.random()-.5)*14,cols[i%3],1.8+Math.random(),.3,18)}

/* ============ ÉTAT DU MATCH ============ */
let ONLINE=null;
const isClient=()=>!!(ONLINE&&!ONLINE.host);
function evt(t,a,b){if(ONLINE&&ONLINE.host){ONLINE.evSeq++;ONLINE.evs.push([ONLINE.evSeq,t,Math.round(a*10)/10,Math.round(b*10)/10]);if(ONLINE.evs.length>10)ONLINE.evs.shift()}}
let state='menu',score=[0,0],timeLeft=120,ot=false,otT=0,stateT=0,cdT=0,paused=false,scorer=0,shake=0,lastGoalTeam=0,inMatch=false;
const inp={x:0,z:0,shoot:false,dash:false};
const MS={sh:[0,0],da:[0,0],ht:[0,0],tp:[0,0],last:-1,hs:0,hd:0,hh:0,sec:0};   // statistiques du match en cours
function msReset(){MS.sh=[0,0];MS.da=[0,0];MS.ht=[0,0];MS.tp=[0,0];MS.last=-1;MS.hs=MS.hd=MS.hh=0;MS.sec=0}

function resetPositions(){
 REC.length=0;
 players.forEach(p=>{const s=p.team?1:-1;p.x=s*(p.idx===0?5:10);p.z=[0,-5.5,5.5][p.idx];p.vx=p.vz=0;p.hd=p.team?Math.PI:0;p.stun=0;p.dash=0;p.kick=0;p.celeb=0;p.thinkT=0;p.ax=p.az=0});
 Object.assign(ball,{x:0,y:BR,z:0,vx:0,vy:0,vz:0,inNet:false});
}

function tryDash(p){
 if(p.dashCd>0||p.stun>0)return;p.dash=.45;p.dashCd=2.6*MOD.dcd;MS.da[p.team]++;if(p===human)MS.hd++;
 if(p===human)sfx('dash');else evt('d',p.x,p.z);
 for(let i=0;i<8;i++)emit(p.x,.3,p.z,(Math.random()-.5)*3-Math.cos(p.hd)*4,1+Math.random()*2,(Math.random()-.5)*3-Math.sin(p.hd)*4,0xffffff,.5,.35,0);
}
function doShoot(p){
 if(p.shootCd>0||p.stun>0)return;p.shootCd=.45;p.kick=.28;
 if(isClient())return;
 const d=Math.hypot(ball.x-p.x,ball.z-p.z);
 if(d<2.2+p.ctl*.04&&ball.y<2.4){
  const gxT=(p.team?-1:1)*FW,gzT=p===human||p.uid?0:(Math.random()-.5)*5;
  let dx=Math.cos(p.hd),dz=Math.sin(p.hd);
  const tx=gxT-p.x,tz=gzT-p.z,tl=Math.hypot(tx,tz)||1,df=Math.abs(angDiff(p.hd,Math.atan2(tz,tx)));
  if(df<(p.uid?.95:1.3)){const w=p.uid?.6:.9;dx=dx*(1-w)+tx/tl*w;dz=dz*(1-w)+tz/tl*w;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l}
  ball.vx=dx*p.pow*MOD.pow+p.vx*.25;ball.vz=dz*p.pow*MOD.pow+p.vz*.25;ball.vy=3+p.pow*MOD.pow*.1;ball.y=Math.max(ball.y,BR+.1);
  MS.sh[p.team]++;MS.last=p.team;if(p===human)MS.hs++;
  sfx('kick');shake=Math.max(shake,.25);evt('k',ball.x,ball.z);if(p===human)buzz(25);
  for(let i=0;i<6;i++)emit(ball.x,.5,ball.z,(Math.random()-.5)*4,2+Math.random()*3,(Math.random()-.5)*4,0xffffff,.4,.25,10);
 }
}

/* IA */
function ai(p,dt){
 if(MODE.idle){p.ax=p.az=0;return}
 const dir=p.team?-1:1,ownGX=-dir*FW,enGX=dir*FW;
 const mates=players.filter(q=>q.team===p.team&&!q.off);
 let ch=mates[0],bd=1e9;for(const q of mates){const d=Math.hypot(q.x-ball.x,q.z-ball.z)+(q.stun>0?5:0);if(d<bd){bd=d;ch=q}}
 const dball=Math.hypot(p.x-ball.x,p.z-ball.z);
 const ownHalf=(ball.x-ownGX)*dir<FW*.9;
 const chase=p===ch||(dball<4.5&&ownHalf&&!ch.human);
 let tx,tz,mag=1;
 if(chase){
  const gx=enGX-ball.x,gz=-ball.z,gl=Math.hypot(gx,gz)||1,ux=gx/gl,uz=gz/gl;
  const bx=p.x-ball.x,bz=p.z-ball.z;
  const behind=(bx*ux+bz*uz)<-.3;
  if(behind){tx=ball.x+ball.vx*.12;tz=ball.z+ball.vz*.12}
  else{const sd=(bx*-uz+bz*ux)>=0?1:-1;tx=ball.x-ux*2.7-uz*sd*2;tz=ball.z-uz*2.7+ux*sd*2;
   if(Math.abs(tx)>FW-1||Math.abs(tz)>FH-1){tx=ball.x;tz=ball.z}}
  const dGoal=Math.hypot(enGX-p.x,p.z);
  p.thinkT-=dt;
  if(behind&&dball<2&&p.shootCd<=0&&((dGoal<20&&Math.random()<dt*9)||(Math.abs(ball.x-ownGX)<9&&Math.random()<dt*9)))doShoot(p);
  if(dball>5&&p.dashCd<=0&&Math.random()<dt*.35)tryDash(p);
 }else if(p.idx%2===1){
  tx=ball.x-dir*5;tz=-ball.z*.5;mag=.85;
 }else{
  const f=clamp((ball.x*dir+FW)/(FW*2),0,1);tx=ownGX+dir*(4+f*8);tz=clamp(ball.z*.5,-4,4);mag=.8;
 }
 tx=clamp(tx,-FW+1,FW-1);tz=clamp(tz,-FH+1,FH-1);
 const dx=tx-p.x,dz=tz-p.z,dl=Math.hypot(dx,dz);
 if(dl<.4){p.ax=p.az=0}else{const m=Math.min(1,dl/1.2)*mag;p.ax=dx/dl*m;p.az=dz/dl*m}
}

/* déplacement d'un joueur (aussi utilisé pour la prédiction côté client) */
function movePlayer(p,ax,az,dt){
 let tv=Math.hypot(ax,az);
 if(p.dash>0&&tv<.1){ax=Math.cos(p.hd);az=Math.sin(p.hd);tv=1}
 if(tv>1){ax/=tv;az/=tv;tv=1}
 const sp=p.spd*MOD.spd*(p.dash>0?1.75:1);
 const dvx=ax*sp-p.vx,dvz=az*sp-p.vz,dl=Math.hypot(dvx,dvz);
 if(dl>0){const st=Math.min(dl,(p.dash>0?100:60)*dt);p.vx+=dvx/dl*st;p.vz+=dvz/dl*st}
 p.x=clamp(p.x+p.vx*dt,-FW+.6,FW-.6);p.z=clamp(p.z+p.vz*dt,-FH+.6,FH-.6);
 if(tv>.15)p.hd+=angDiff(p.hd,Math.atan2(az,ax))*Math.min(1,14*dt);
}
/* simulation */
function sim(dt,ctl){
 for(const p of players){
  if(p.off)continue;
  p.shootCd-=dt;p.dashCd-=dt;p.stun-=dt;p.kick-=dt;p.dash-=dt;
  let ax=0,az=0;
  if(!ctl&&p.remote&&p.rin){p.lsn=p.rin.sn;p.ldn=p.rin.dn}
  if(ctl&&p.stun<=0){
   if(p===human){ax=inp.x;az=inp.z;if(inp.dash){inp.dash=false;tryDash(p)}if(inp.shoot){inp.shoot=false;doShoot(p)}}
   else if(p.remote){const r=p.rin||{};ax=r.x||0;az=r.z||0;
    if(r.sn!==p.lsn){if(p.lsn!==undefined)doShoot(p);p.lsn=r.sn}
    if(r.dn!==p.ldn){if(p.ldn!==undefined)tryDash(p);p.ldn=r.dn}}
   else{ai(p,dt);ax=p.ax;az=p.az}
  }
  movePlayer(p,ax,az,dt);
 }
 // collisions joueurs
 for(let i=0;i<players.length;i++)for(let j=i+1;j<players.length;j++){
  const a=players[i],b=players[j];if(a.off||b.off)continue;let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
  if(d<PR*2&&d>.001){
   const nx=dx/d,nz=dz/d,ov=(PR*2-d)/2;a.x-=nx*ov;a.z-=nz*ov;b.x+=nx*ov;b.z+=nz*ov;
   if(a.team!==b.team){
    const hit=(x,y)=>{if(x.dash>0&&y.stun<=0&&y.dash<=0){y.stun=.8;MS.ht[x.team]++;if(x===human)MS.hh++;if(x===human||y===human)buzz(60);const k=x===a?1:-1;y.vx+=nx*k*14;y.vz+=nz*k*14;sfx('hit');shake=Math.max(shake,.4);evt('h',y.x,y.z);for(let q=0;q<8;q++)emit(y.x,1.2,y.z,(Math.random()-.5)*8,2+Math.random()*4,(Math.random()-.5)*8,0xffe14d,.5,.3,12)}};
    hit(a,b);hit(b,a);
   }
  }
 }
 // balle
 ball.vy-=MOD.g*dt;ball.y+=ball.vy*dt;
 if(ball.y<BR){ball.y=BR;ball.vy=ball.vy<-2.5?-ball.vy*.5:0}
 if(ball.y>9){ball.y=9;ball.vy=-Math.abs(ball.vy)*.3}
 const grounded=ball.y<BR+.05,damp=Math.exp(-(grounded?.9:.12)*dt-(Math.abs(ball.x)>FW?2.5*dt:0));
 ball.vx*=damp;ball.vz*=damp;
 let sp=Math.hypot(ball.vx,ball.vz);const cap=34*Math.max(1,MOD.pow);if(sp>cap){ball.vx*=cap/sp;ball.vz*=cap/sp}
 ball.x+=ball.vx*dt;ball.z+=ball.vz*dt;
 // joueurs <-> balle
 for(const p of players){
  if(p.off)continue;
  const dx=ball.x-p.x,dz=ball.z-p.z,d=Math.hypot(dx,dz),R=PR+BR;
  if(d<R&&ball.y<1.7&&d>.001){
   const nx=dx/d,nz=dz/d;MS.last=p.team;ball.x=p.x+nx*(R+.01);ball.z=p.z+nz*(R+.01);
   const vr=(ball.vx-p.vx)*nx+(ball.vz-p.vz)*nz;
   if(vr<0){const k=-vr*(1.1+p.ctl*.02);ball.vx+=nx*k;ball.vz+=nz*k}
   ball.vx+=(p.vx-ball.vx)*(.08+p.ctl*.012);ball.vz+=(p.vz-ball.vz)*(.08+p.ctl*.012);
  }
 }
 // anti-blocage : si la balle reste coincée (mêlée dans un coin), on la relance vers le centre
 if(state==='play'){
  ball.at=(ball.at||0)+dt;
  if(!ball.ax&&ball.ax!==0){ball.ax=ball.x;ball.az=ball.z}
  if(Math.hypot(ball.x-ball.ax,ball.z-ball.az)>3){ball.ax=ball.x;ball.az=ball.z;ball.at=0}
  else if(ball.at>2.5){ball.at=0;const l=Math.hypot(ball.x,ball.z)||1;ball.vx=-ball.x/l*12+(Math.random()-.5)*4;ball.vz=-ball.z/l*12+(Math.random()-.5)*4;ball.vy=6;ball.x-=ball.x/l*7;ball.z-=ball.z/l*7;ball.ax=ball.x;ball.az=ball.z}
 }
 // murs / buts
 // murs / buts : la balle n'entre dans le filet que si elle franchit la ligne ENTRE les poteaux
 {
  const ax=Math.abs(ball.x),sx=Math.sign(ball.x)||1;
  if(ball.inNet&&ax<FW-BR)ball.inNet=false;
  if(!ball.inNet&&ax>FW-BR){
   if(Math.abs(ball.z)<GW-.3&&ball.y<GH-.3)ball.inNet=true;                 // dans le but
   else{ball.x=sx*(FW-BR);ball.vx=-sx*Math.abs(ball.vx)*.7;                 // mur, coin ou poteau : rebond
    if(Math.abs(ball.z)>GW-.5&&Math.abs(ball.z)<GW+.5)ball.vz*=.8}
  }
  if(ball.inNet&&ax>FW){
   if(ax>FW+3-BR){ball.x=sx*(FW+3-BR);if(Math.abs(ball.vx)>3)rippleNet(sx,ball.x,ball.y,ball.z,Math.abs(ball.vx)*.4);ball.vx=-ball.vx*.25}
   if(Math.abs(ball.z)>GW-BR){ball.z=Math.sign(ball.z)*(GW-BR);ball.vz*=-.4}
   if(ball.y>GH-BR){ball.y=GH-BR;ball.vy=-Math.abs(ball.vy)*.3}
   if(state==='play'&&ax>FW+.3)onGoal(sx>0?0:1);
  }
  if(!ball.inNet&&Math.abs(ball.z)>FH-BR){const s=Math.sign(ball.z);ball.z=s*(FH-BR);ball.vz=-s*Math.abs(ball.vz)*.7}
 }
}

/* ============ FLUX DU MATCH ============ */
const banner=$('#banner');
const ST=['menu','countdown','play','goal','end'];
const BLAST_T=2.8;        // onde de choc + ragdoll en 1re personne
const GOAL_T=8.7;         // durée totale de la phase but (ragdoll + ralenti)
const REC=[],REC_N=75,RP={active:false,done:false,t:0,sp:.5,bx:0,by:0,bz:0,px:null};let recAcc=0;
function showBanner(txt,cls,col){banner.textContent=txt;banner.style.color=col||'#fff';banner.className='stroke';void banner.offsetWidth;banner.className='stroke '+(cls||'show')}
function fmt(t){t=Math.max(0,Math.ceil(t));return Math.floor(t/60)+':'+String(t%60).padStart(2,'0')}
function updHUD(){$('#sB').textContent=score[0];$('#sR').textContent=score[1];const c=$('#clock');c.textContent=ot?'OR !':fmt(timeLeft);c.classList.toggle('ot',ot)}

function modeTag(){
 let t=$('#modeTag');
 if(!t){t=document.createElement('div');t.id='modeTag';t.className='stroke';t.style.cssText='position:absolute;top:58px;left:50%;transform:translateX(-50%);font-size:15px;pointer-events:none;white-space:nowrap;opacity:.95';$('#hud').appendChild(t)}
 t.textContent=MODE===MODES.classic?'':`${MODE.em} ${MODE.n}${MODE.goals?' · premier à '+MODE.goals:''}`;
}
function startMatch(){
 unlockAudio();
 $('#menu').classList.add('hidden');$('#hud').classList.remove('hidden');$('#lobby').classList.add('hidden');$('#endov').classList.add('hidden');
 players.forEach(p=>{p.g.visible=!p.off});ballMesh.visible=true;
 MODE=ONLINE?MODES.classic:(MODES[modeSel]||MODES.classic);setMod(MODE);chaosT=10;msReset();
 score=[0,0];timeLeft=MODE.t;ot=false;otT=0;inMatch=true;resetPositions();updHUD();modeTag();
 state='countdown';cdT=3.2;stateT=0;paused=false;sfx('whistle');lastCd=4;
 inp.x=inp.z=0;inp.shoot=inp.dash=false;checkRot();
}
let lastCd=4;
function onGoalFX(team){
 showBanner(team===myTeam?'BUT !!':'BUT ADVERSE','long',team===myTeam?'#6fc8ff':'#ff7a7a');
 sfx('goal');sfx('cheer');buzz(120);confetti(team);shake=1;
 rippleNet(team===0?1:-1,ball.x,ball.y,ball.z,Math.max(8,Math.hypot(ball.vx,ball.vz)));
 players.forEach(p=>{p.celeb=p.team===team?1:0});
 startRagdoll(team);
}
function onGoal(team){
 score[team]++;state='goal';stateT=0;updHUD();RP.done=false;
 onGoalFX(team);evt('g',team,0);
}
function endMatch(){state='end';stateT=0;inMatch=false;setMod(MODES.classic);showResult()}
function recordMatch(my,th,w,d){
 const t=S.st;t.m++;if(w)t.w++;else if(d)t.d++;else t.l++;t.g+=my;t.ga+=th;
 t.sh+=MS.hs;t.da+=MS.hd;t.ht+=MS.hh;t.sec+=Math.round(MS.sec);t.mx=Math.max(t.mx,my);
 if(th===0&&w)t.cs++;
 const sp=!ONLINE&&MODE!==MODES.classic;if(sp)t.sp++;
 missCheck();missAdd('m',1);if(w)missAdd('w',1);missAdd('g',my);missAdd('da',MS.hd);missAdd('sh',MS.hs);missAdd('ht',MS.hh);
 if(th===0&&w)missAdd('cs',1);if(sp)missAdd('sp',1);
}
function showResult(){
 inMatch=false;
 const my=score[myTeam],th=score[1-myTeam];
 const w=my>th,d=my===th,train=!ONLINE&&!!MODE.idle;
 let coins=0,gems=0,box=null;const notes=[];
 if(w){coins=60+my*10;gems=3;if(!train)S.w++;const r=Math.random();box=r<.08?'or':r<.75?'bronze':null}
 else if(d){coins=30;if(!train)S.d++;box=Math.random()<.25?'bronze':null}
 else{coins=15+my*5;if(!train)S.l++;box=Math.random()<.15?'bronze':null}
 if(train){coins=0;gems=0;box=null;notes.push('🎯 Entraînement : pas de récompense')}
 else{
  if(!ONLINE){const D=DIFF[S.diff]||DIFF[1];if(D.m!==1){coins=Math.round(coins*D.m);notes.push(`🎚️ Difficulté ${D.n} (×${D.m})`)}}
  if(eventMul()>1){coins*=2;notes.push('🔥 Week-end : pièces ×2 !')}
  if(w)S.ws++;else if(!d)S.ws=0;
  if(w&&S.ws>=2){const b=Math.min(S.ws-1,5)*20;coins+=b;notes.push(`🔥 Série de ${S.ws} victoires : +${b} 🪙`)}
  S.st.bws=Math.max(S.st.bws||0,S.ws);
  recordMatch(my,th,w,d);
 }
 const xp=train?0:(w?60:d?35:20)+my*10+(ONLINE?10:0),lv0=bpLevel();
 if(!train)S.g+=my;S.coins+=coins;S.gems+=gems;if(box)S.boxes[box]++;S.bp.xp=(S.bp.xp||0)+xp;const lv1=bpLevel();save();
 sfx(w?'win':'lose');
 const t=w?'VICTOIRE !':d?'ÉGALITÉ':'DÉFAITE';const col=w?'#ffd23a':d?'#fff':'#ff7a7a';
 let stats='';
 if(!ONLINE){
  const tot=(MS.tp[0]+MS.tp[1])||1,pc=Math.round(MS.tp[myTeam]/tot*100);
  const row=(n,a,b)=>`<div style="display:flex;justify-content:space-between;gap:16px;font-size:14px"><b style="color:#6fc8ff">${a}</b><span style="opacity:.85">${n}</span><b style="color:#ff7a7a">${b}</b></div>`;
  stats=`<div style="margin:8px auto;max-width:260px;border-top:2px solid rgba(255,255,255,.2);padding-top:6px;font-family:Arial,sans-serif">${row('Possession',pc+'%',(100-pc)+'%')}${row('Tirs',MS.sh[myTeam],MS.sh[1-myTeam])}${row('Sprints',MS.da[myTeam],MS.da[1-myTeam])}${row('Plaquages',MS.ht[myTeam],MS.ht[1-myTeam])}</div>`;
 }
 const e=$('#endov');e.classList.remove('hidden');
 const on=!!ONLINE;
 e.innerHTML=`<div class="card modal" style="max-height:94vh;overflow:auto"><h3 class="stroke" style="font-size:44px;color:${col}">${t}</h3>
 <div class="res stroke" style="font-size:40px"><span style="color:#6fc8ff">${score[0]}</span> - <span style="color:#ff7a7a">${score[1]}</span></div>
 <div class="res">${train?'':`<div>🪙 +${coins}</div>`}${gems?`<div>💎 +${gems}</div>`:''}${box?`<div>${BOXES[box].em} ${BOXES[box].n}</div>`:''}${train?'':`<div>⭐ +${xp} XP</div>`}${lv1>lv0?`<div>🏆 Palier ${lv1} du passe !</div>`:''}</div>
 ${notes.map(n=>`<div style="font-size:14px;color:#ffd23a">${n}</div>`).join('')}
 <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:6px">${on?'<button class="btn green" id="againBtn">Retour au salon</button>':'<button class="btn green" id="againBtn">Rejouer</button><button class="btn blue" id="menuBtn">Menu</button>'}</div>${stats}</div>`;
 $('#againBtn').onclick=()=>{e.classList.add('hidden');if(on)onlineBackToLobby();else startMatch()};
 const mb=$('#menuBtn');if(mb)mb.onclick=()=>{e.classList.add('hidden');toMenu()};
 renderAll();
}
function toMenu(){
 state='menu';inMatch=false;setMod(MODES.classic);MODE=MODES.classic;paused=false;$('#hud').classList.add('hidden');$('#pauseov').classList.add('hidden');$('#rot').classList.add('hidden');
 stopReplay();RP.done=false;stopRagdoll();
 ONLINE=null;myTeam=0;human=players[0];players.forEach(p=>setBot(p));
 $('#menu').classList.remove('hidden');resetPositions();players.forEach(p=>{p.g.visible=p===human});ballMesh.visible=false;
 human.x=0;human.z=0;applyStats();renderAll();
}

function update(dt){
 stateT+=dt;
 if(state==='countdown'){
  cdT-=dt;sim(dt,false);
  const n=Math.ceil(cdT-.2);
  if(n!==lastCd&&n>=1&&n<=3){lastCd=n;showBanner(String(n),'show');sfx('tick')}
  if(cdT<=.2&&state==='countdown'){state='play';stateT=0;showBanner('GO !','show','#7dff5a');sfx('whistle')}
 }else if(state==='play'){
  sim(dt,true);MS.sec+=dt;if(MS.last>=0)MS.tp[MS.last]+=dt;
  if(MODE.chaos&&!ot){chaosT-=dt;if(chaosT<=0){chaosT=10;const e=CHAOS[(Math.random()*CHAOS.length)|0];setMod(e);showBanner(e.n,'show','#ffd23a');sfx('whistle')}}
  if(!ot){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;if(score[0]!==score[1]){endMatch()}else{ot=true;otT=30;showBanner('BUT EN OR !','long','#ffd23a')}}}
  else{otT-=dt;if(otT<=0)endMatch()}
  updHUD();
 }else if(state==='goal'){
  sim(dt,false);inp.shoot=inp.dash=false;
  if(stateT>GOAL_T){
   if(ot||(timeLeft<=0&&score[0]!==score[1])||(MODE.goals&&Math.max(score[0],score[1])>=MODE.goals))endMatch();
   else{resetPositions();state='countdown';cdT=2.2;lastCd=4;stateT=0;sfx('whistle')}
  }
 }else if(state==='menu'){
  human.hd+=dt*.8;human.legT+=dt*2;
 }
}

/* ============ RALENTI DE BUT ============ */
const lerp=(a,b,f)=>a+(b-a)*f;
function recordFrame(){
 REC.push({b:[ball.x,ball.y,ball.z,ball.vx,ball.vz],p:players.map(p=>[p.x,p.z,p.hd,p.legT,Math.hypot(p.vx,p.vz),p.kick,p.dash,p.stun])});
 if(REC.length>REC_N)REC.shift();
}
function startReplay(){
 RP.active=true;RP.t=0;RP.px=null;banner.className='stroke';
 $('#hud').classList.add('replay');$('#rUI').classList.remove('hidden');
 const f=REC[0];RP.bx=f.b[0];RP.by=f.b[1];RP.bz=f.b[2];
 tone(220,.5,'sawtooth',.06,3);
}
function stopReplay(){
 if(!RP.active)return;RP.active=false;RP.done=true;
 $('#hud').classList.remove('replay');$('#rUI').classList.add('hidden');
}
function skipReplay(){
 if(!RP.active)return;stopReplay();
 if(!ONLINE)stateT=Math.max(stateT,GOAL_T-.4);   // solo : on enchaîne direct ; en ligne : le serveur garde le rythme
}
function replayApply(dt){
 RP.t+=dt*30*RP.sp;const n=REC.length;const i=Math.floor(RP.t);
 if(i>=n-1){stopReplay();return}
 const f=RP.t-i,A=REC[i],B=REC[i+1],now=performance.now()/1000;
 players.forEach((p,k)=>{const a=A.p[k],b=B.p[k];
  pose(p,lerp(a[0],b[0],f),lerp(a[1],b[1],f),a[2]+angDiff(a[2],b[2])*f,lerp(a[3],b[3],f),lerp(a[4],b[4],f),b[5],b[6],b[7],0)});
 const bx=lerp(A.b[0],B.b[0],f),by=lerp(A.b[1],B.b[1],f),bz=lerp(A.b[2],B.b[2],f);
 ballMesh.position.set(bx,by,bz);
 const bs=Math.hypot(B.b[3],B.b[4]);
 if(bs>.05){ballMesh.rotateOnWorldAxis(new THREE.Vector3(B.b[4],0,-B.b[3]).normalize(),bs/BR*dt*RP.sp)}
 if(RP.px!==null&&Math.abs(RP.px)<=FW+.3&&Math.abs(bx)>FW+.3&&Math.abs(bz)<GW)rippleNet(bx>0?1:-1,bx,by,bz,Math.hypot(B.b[3],B.b[4]));
 RP.px=bx;RP.bx=bx;RP.by=by;RP.bz=bz;
 $('#rprog').style.width=(RP.t/(n-1)*100)+'%';
}

/* ============ ONDE DE CHOC : tous les joueurs projetés en ragdoll, caméra 1re personne ============ */
const RG={active:false,t:0,st:[],fp:false,side:1,camQ:new THREE.Quaternion(),hasQ:false};
const shockRing=new THREE.Mesh(new THREE.RingGeometry(.92,1,48),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,side:THREE.DoubleSide,depthWrite:false}));
shockRing.rotation.x=-Math.PI/2;shockRing.visible=false;scene.add(shockRing);
const _v=new THREE.Vector3(),_v2=new THREE.Vector3(),_q=new THREE.Quaternion(),RCP=new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),-Math.PI/2);
function startRagdoll(team){
 const dirX=team===0?-1:1;                 // l'équipe 0 marque à +x : tout le monde part vers -x
 RG.side=-dirX;RG.active=true;RG.t=0;RG.fp=true;RG.hasQ=false;
 const g=22,T=1.25;
 RG.st=players.map(p=>{
  const tx=dirX*(FW-3-Math.random()*8),tz=clamp(p.z*.7+(Math.random()-.5)*8,-FH+2,FH-2);
  const s={com:new THREE.Vector3(p.x,1,p.z),v:new THREE.Vector3((tx-p.x)/T,g*T/2,(tz-p.z)/T),
   q:new THREE.Quaternion().setFromEuler(new THREE.Euler(0,-p.hd,0)),
   w:new THREE.Vector3((Math.random()-.5)*14,(Math.random()-.5)*8,(Math.random()-.5)*14),fl:Math.random()*6};
  if(s.w.length()<6)s.w.x+=8;return s;
 });
 human.body.visible=false;human.head.visible=false;if(human.tag)human.tag.visible=false;if(human.ring){human.ring.visible=false;human.arrow.visible=false}
 for(let i=0;i<40;i++){const a=Math.random()*6.28;emit(RG.side*FW,1,0,Math.cos(a)*10,3+Math.random()*6,Math.sin(a)*10,0xffffff,.8,.4,14)}
 tone(90,.8,'sawtooth',.22,.25);tone(220,.4,'square',.1,.3,.05);shake=1.2;
}
function stopRagdoll(){
 if(!RG.active)return;RG.active=false;RG.fp=false;shockRing.visible=false;
 human.body.visible=true;human.head.visible=true;if(human.tag)human.tag.visible=true;
 for(const p of players){p.g.quaternion.identity();p.g.rotation.set(0,0,0);p.head.rotation.set(0,0,0);p.sL.rotation.set(0,0,0);p.sR.rotation.set(0,0,0)}
}
function ragdollStep(dt){
 RG.t+=dt;
 for(const s of RG.st){
  s.v.y-=22*dt;s.com.addScaledVector(s.v,dt);
  if(s.com.y<.55){s.com.y=.55;if(s.v.y<-2){s.v.y=-s.v.y*.38;s.v.x*=.6;s.v.z*=.6;s.w.multiplyScalar(.75)}else s.v.y=0}
  if(s.com.y<.6){const f=Math.exp(-2.4*dt);s.v.x*=f;s.v.z*=f;s.w.multiplyScalar(Math.exp(-1.6*dt))}
  if(Math.abs(s.com.x)>FW-.6){s.com.x=Math.sign(s.com.x)*(FW-.6);s.v.x*=-.35}
  if(Math.abs(s.com.z)>FH-.6){s.com.z=Math.sign(s.com.z)*(FH-.6);s.v.z*=-.35}
  const a=s.w.length()*dt;if(a>1e-5){_q.setFromAxisAngle(_v.copy(s.w).normalize(),a);s.q.premultiply(_q);s.q.normalize()}
 }
 const k=Math.min(1,RG.t/.9);
 shockRing.visible=k<1;shockRing.position.set(RG.side*FW,.3,0);shockRing.scale.setScalar(1+k*34);shockRing.material.opacity=(1-k)*.8;
}
function poseRag(p,s,now){
 _v.set(0,-1,0).applyQuaternion(s.q);p.g.position.copy(s.com).add(_v);p.g.quaternion.copy(s.q);
 const f=Math.min(1,(Math.hypot(s.v.x,s.v.z)+s.w.length()*.4)/8);
 const fl=Math.sin(now*16+s.fl)*.6*f+Math.sin(now*9+s.fl)*.2*f;
 p.body.position.y=1;p.head.position.y=2;p.body.rotation.set(0,0,0);p.head.rotation.z=fl*.6;
 p.sL.position.set(.1,.1+fl*.5,-.3+fl*.3);p.sR.position.set(-.1,.1-fl*.5,.3-fl*.3);p.sL.rotation.z=fl;p.sR.rotation.z=-fl;
}
function ragdollCam(dt){
 const s=RG.st[players.indexOf(human)];if(!s)return;
 _v.set(0,2,0).applyQuaternion(s.q).add(human.g.position).add(_v2.set(.4,.05,0).applyQuaternion(s.q));
 cam.position.copy(_v);
 _q.copy(s.q).multiply(RCP);
 if(!RG.hasQ){RG.camQ.copy(_q);RG.hasQ=true}else RG.camQ.slerp(_q,Math.min(1,dt*7));
 cam.quaternion.copy(RG.camQ);
}

/* ============ ANIMATIONS + CAMÉRA + RENDU ============ */
let camX=0,camZ=0,menuT=0,rcx=0,rcz=0;
function pose(p,x,z,hd,legT,sp,kickT,dashT,stunT,y){
 const now=performance.now()/1000;
 const bob=Math.abs(Math.sin(legT))*.1*Math.min(1,sp/8);
 if(stunT>0){y=0;p.body.rotation.x=Math.sin(now*30)*.15}else p.body.rotation.x=0;
 p.g.position.set(x,y,z);p.g.rotation.y=-hd;
 p.body.position.y=1.0+bob;p.head.position.y=2.0+bob;
 p.body.rotation.z=-.15*Math.min(1,sp/9)*(dashT>0?2:1);
 const sw=Math.sin(legT),lift=Math.max(0,Math.cos(legT));
 const kick=kickT>0?Math.sin((1-kickT/.28)*Math.PI):0;
 p.sL.position.set(sw*.4,.05+lift*.18*Math.min(1,sp/6),-.28);
 p.sR.position.set(-sw*.4+kick*.7,.05+(1-lift)*.18*Math.min(1,sp/6)+kick*.2,.28);
 p.sR.rotation.z=kick*.6;
 if(p.ring){const me=p===human&&state!=='menu';p.ring.visible=me;p.arrow.visible=me;p.ring.rotation.z=now*2;p.arrow.position.y=3.1+Math.sin(now*5)*.15;p.arrow.rotation.y=now*3}
}
function animate(dt){
 const now=performance.now()/1000;
 if(RG.active)ragdollStep(dt);
 for(const p of players){
  if(!p.g.visible)continue;
  if(RG.active){poseRag(p,RG.st[players.indexOf(p)],now);continue}
  const sp=Math.hypot(p.vx,p.vz);p.legT+=sp*dt*1.15;
  const y=p.celeb?Math.abs(Math.sin(now*9+p.rid))*.7:0;
  pose(p,p.x,p.z,p.hd,p.legT,sp,p.kick,p.dash,p.stun,y);
  // traînée des chaussures rares (joueurs humains)
  if((p===human||p.uid)&&p.shoe.r>=2&&sp>3&&state!=='menu'){
   p.trT=(p.trT||0)-dt;
   if(p.trT<=0){p.trT=p.shoe.r>=3?.03:.07;
    const col=p.shoe.r===4?new THREE.Color().setHSL((now*1.6)%1,1,.6):p.shoe.main;
    const sd=Math.sin(p.legT)>0?1:-1;
    emit(p.x-Math.cos(p.hd)*.3-Math.sin(p.hd)*.25*sd,.25,p.z-Math.sin(p.hd)*.3+Math.cos(p.hd)*.25*sd,(Math.random()-.5)*.8,.5+Math.random(),(Math.random()-.5)*.8,col,.55,p.shoe.r>=3?.3:.2,0)}
  }
 }
 ballMesh.position.set(ball.x,ball.y,ball.z);
 const bs=Math.hypot(ball.vx,ball.vz);
 if(bs>.05){const ax=new THREE.Vector3(ball.vz,0,-ball.vx).normalize();ballMesh.rotateOnWorldAxis(ax,bs/BR*dt)}
}
function updCam(dt){
 const wantFov=(RG.active&&RG.fp)?82:42;
 if(cam.fov!==wantFov){cam.fov=wantFov;cam.updateProjectionMatrix()}
 if(RG.active&&RG.fp&&state==='goal'){ragdollCam(dt);return}
 let aspect=innerWidth/innerHeight;
 const fov=cam.fov*Math.PI/180;
 if(state==='menu'){
  menuT+=dt;
  const tx=human.x,tz=human.z;
  cam.position.set(tx+1.6,3.2,tz+7.4);cam.lookAt(tx,1.4,tz);
  cam.position.x+=Math.sin(menuT*.4)*.8;return;
 }
 if(RP.active){   // caméra de retransmission : plus basse, suit la balle
  const k=Math.min(1,dt*3);rcx+=(clamp(RP.bx,-22,22)*.92-rcx)*k;rcz+=(RP.bz*.5-rcz)*k;
  cam.position.set(rcx,9.5,rcz+15.5);cam.lookAt(clamp(RP.bx,-23,23)*.97,.8,RP.bz*.6);return;
 }
 aspect=Math.max(aspect,1.3);
 const fx=clamp((human.x*.5+ball.x*.5),-9,9)*.9,fz=clamp((human.z*.5+ball.z*.5)*.55,-4,4);
 const k=Math.min(1,dt*4);camX+=(fx-camX)*k;camZ+=(fz-camZ)*k;rcx=camX;rcz=camZ;
 const dist=Math.max(21,36/(2*Math.tan(fov/2)*aspect));
 shake=Math.max(0,shake-dt*2.5);const shk=S.set.shk?shake:0;
 const sx=(Math.random()-.5)*shk*.7,sy=(Math.random()-.5)*shk*.5;
 cam.position.set(camX+sx,dist*.84+sy,camZ+dist*.54);cam.lookAt(camX,0,camZ);
}
function resize(){
 const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();checkRot();
}
function checkRot(){
 const portrait=innerHeight>innerWidth*1.05;
 $('#rot').classList.toggle('hidden',!(portrait&&inMatch));
}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));
document.addEventListener('visibilitychange',()=>{if(document.hidden&&inMatch&&!paused&&!ONLINE)setPause(true)});

let fpsN=0,fpsT=0,fpsEl=null;
function fpsTick(t){
 if(!S.set.fps){if(fpsEl){fpsEl.remove();fpsEl=null}return}
 if(!fpsEl){fpsEl=document.createElement('div');fpsEl.style.cssText='position:fixed;left:6px;bottom:4px;z-index:90;font:12px monospace;color:#7dff5a;background:rgba(0,0,0,.5);padding:1px 6px;border-radius:6px;pointer-events:none';document.body.appendChild(fpsEl)}
 fpsN++;if(t-fpsT>=500){fpsEl.textContent=Math.round(fpsN*1000/(t-fpsT))+' FPS';fpsN=0;fpsT=t}
}
let last=performance.now();
function loop(t){
 requestAnimationFrame(loop);
 let dt=Math.min(.05,(t-last)/1000);last=t;
 pollPad();fpsTick(t);
 const rot=!$('#rot').classList.contains('hidden');
 const freeze=paused||(rot&&!ONLINE);
 if(!freeze){
  if(isClient())onlineClientUpdate(dt);else update(dt);
  updNets(dt);updParts(dt);updWeather(dt);if(inMatch)ballTrail();
  // ralenti : démarre après la célébration, s'arrête quand on quitte la phase but
  if(state!=='goal'&&(RP.active||RP.done)){stopReplay();RP.done=false}
  if(RG.active&&(state!=='goal'||stateT>BLAST_T))stopRagdoll();
  $('#hud').classList.toggle('blast',RG.active);
  if(state==='goal'&&!RP.active&&!RP.done&&stateT>BLAST_T&&REC.length>15)startReplay();
  if(RP.active)replayApply(dt);else animate(dt);
  if(inMatch&&state==='play'){recAcc+=dt;while(recAcc>=1/30){recAcc-=1/30;recordFrame()}}
  if(ONLINE&&ONLINE.host)onlineHostTick(dt);
 }
 updCam(freeze?0:dt);
 const cd=clamp(human.dashCd/2.6,0,1);$('#bDash').style.setProperty('--cd',cd);
 renderer.render(scene,cam);
}

/* ============ CONTRÔLES ============ */
const touchEl=$('#touch'),joy=$('#joy'),joyHint=$('#joyHint'),knob=joy.firstElementChild;
let jid=null,jox=0,joy0=0;const JR=55;
touchEl.addEventListener('pointerdown',e=>{
 unlockAudio();
 // souris (PC) : clic gauche = tirer, clic droit = booster ; pas de joystick tactile
 if(e.pointerType==='mouse'){
  if(!inMatch)return;
  e.preventDefault();
  if(e.button===0){inp.shoot=true;setTimeout(()=>inp.shoot=false,250)}
  else if(e.button===2){inp.dash=true;setTimeout(()=>inp.dash=false,250)}
  return;
 }
 if(!inMatch||jid!==null||e.clientX>innerWidth*.6)return;
 jid=e.pointerId;jox=e.clientX;joy0=e.clientY;touchEl.setPointerCapture(jid);
 joy.style.display='block';joy.style.left=jox+'px';joy.style.top=joy0+'px';knob.style.transform='';joyHint.style.display='none';
});
touchEl.addEventListener('contextmenu',e=>e.preventDefault());
touchEl.addEventListener('pointermove',e=>{
 if(e.pointerId!==jid)return;
 let dx=e.clientX-jox,dy=e.clientY-joy0;const l=Math.hypot(dx,dy);
 if(l>JR){dx*=JR/l;dy*=JR/l}
 knob.style.transform=`translate(${dx}px,${dy}px)`;
 const m=Math.hypot(dx,dy)/JR;
 if(m<.15){inp.x=inp.z=0}else{inp.x=dx/JR;inp.z=dy/JR}
});
const endJoy=e=>{if(e.pointerId!==jid)return;jid=null;inp.x=inp.z=0;joy.style.display='none';joyHint.style.display='flex'};
touchEl.addEventListener('pointerup',endJoy);touchEl.addEventListener('pointercancel',endJoy);
function bindBtn(id,fn){const b=$(id);b.addEventListener('pointerdown',e=>{e.preventDefault();unlockAudio();b.classList.add('press');fn()});['pointerup','pointercancel','pointerleave'].forEach(ev=>b.addEventListener(ev,()=>b.classList.remove('press')))}
bindBtn('#bShoot',()=>{inp.shoot=true;setTimeout(()=>inp.shoot=false,250)});
bindBtn('#bDash',()=>{inp.dash=true;setTimeout(()=>inp.dash=false,250)});
const keys={};
addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();
 keys[e.key.toLowerCase()]=true;
 if(e.key===' '||e.key==='j')inp.shoot=true;
 if(e.key==='Shift'||e.key==='k')inp.dash=true;
 kb();
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false;kb()});
function kb(){if(jid!==null)return;const x=(keys.arrowright||keys.d?1:0)-(keys.arrowleft||keys.q||keys.a?1:0),z=(keys.arrowdown||keys.s?1:0)-(keys.arrowup||keys.z||keys.w?1:0);const l=Math.hypot(x,z)||1;inp.x=x/l;inp.z=z/l}
['gesturestart','gesturechange','dblclick'].forEach(ev=>document.addEventListener(ev,e=>e.preventDefault()));
document.addEventListener('touchmove',e=>{if(!e.target.closest('.tab,.modal'))e.preventDefault()},{passive:false});

/* ---- manette (Gamepad API : SteelSeries Nimbus, manettes MFi/Xbox/PS) ---- */
let padOn=false,padMoved=false,padPrev={};
function padBtn(gp,i){const b=gp.buttons[i];return !!(b&&(b.pressed||b.value>.5))}
function pollPad(){
 const list=navigator.getGamepads?navigator.getGamepads():[];
 const pads=[];for(const g of list){if(g&&g.connected)pads.push(g)}
 if(!pads.length){if(padOn){padOn=false;$('#joyHint').style.display=''}return}
 if(!padOn){padOn=true;$('#joyHint').style.display='none';toast('🎮 Manette connectée')}
 // plusieurs manettes (ex. deux Joy-Con séparés) : on fusionne tout, le stick le plus poussé gagne
 let x=0,z=0,best=-1;const down={shoot:false,dash:false,menu:false};
 for(const gp of pads){
  const nin=/nintendo|switch|joy-?con|pro controller|057e/i.test(gp.id||'');     // Nintendo : A est à droite, B en bas
  const B=i=>padBtn(gp,i);
  let px=gp.axes[0]||0,pz=gp.axes[1]||0;
  if(B(14))px-=1;if(B(15))px+=1;if(B(12))pz-=1;if(B(13))pz+=1;               // croix directionnelle (mapping standard)
  if(gp.axes.length>9&&gp.mapping!=='standard'){                              // croix en "chapeau" (Switch en mapping brut)
   const h=gp.axes[9];
   if(h>=-1.05&&h<=1.05){const k=Math.round((h+1)*3.5);const D=[[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]][k];if(D){px+=D[0];pz+=D[1]}}
  }
  const m=Math.hypot(px,pz);if(m>best){best=m;x=px;z=pz}
  const face=nin?{s:[1],d:[0,2,3]}:{s:[0],d:[1,2,3]};
  if(face.s.some(B)||B(5)||B(7))down.shoot=true;
  if(face.d.some(B)||B(4)||B(6))down.dash=true;
  if(B(9)||B(8))down.menu=true;
 }
 let m=Math.hypot(x,z);if(m<.2){x=z=0;m=0}else if(m>1){x/=m;z/=m}
 if(m>0||padMoved){if(jid===null){inp.x=x;inp.z=z}padMoved=m>0}
 const rise=k=>down[k]&&!padPrev[k];
 if(inMatch){
  if(rise('shoot'))inp.shoot=true;
  if(rise('dash'))inp.dash=true;
  if(rise('menu')){if(RP.active)skipReplay();else setPause(!$('#pauseov').classList.contains('hidden')?false:true)}
 }else if(rise('shoot')){
  const vis=id=>{const e=$(id);return e&&!e.classList.contains('hidden')};
  if(vis('#endov'))$('#againBtn').click();
  else if(state==='menu'&&vis('#menu')&&vis('#tabHome')&&!vis('#detail')&&!vis('#boxov')&&!vis('#lobby')&&!vis('#inviteov'))$('#playBtn').click();
 }
 padPrev=down;
}
function setPause(v){paused=v&&!ONLINE;$('#pauseov').classList.toggle('hidden',!v)}
$('#pauseBtn').onclick=()=>{unlockAudio();setPause(true)};
$('#resumeBtn').onclick=()=>setPause(false);
$('#quitBtn').onclick=()=>{setPause(false);if(ONLINE)onlineLeave();toMenu()};
$('#rSkip').addEventListener('pointerdown',e=>{e.stopPropagation();skipReplay()});

/* ============ MENUS ============ */
const toastEl=$('#toast');let toastT=0;
function toast(t){toastEl.textContent=t;toastEl.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>toastEl.classList.remove('on'),2200)}
const rarChip=r=>`<span class="rar" style="background:${RAR[r].c}">${RAR[r].n}</span>`;
function bars(s,lv){const m=statMul(lv),L=['Vitesse','Tir','Contrôle'];return s.st.map((v,i)=>{const val=v*m;return `<div class="sb"><span>${L[i]}</span><i><b style="width:${Math.min(100,val/13.5*100)}%;background:${RAR[s.r].c}"></b></i><em>${val.toFixed(1)}</em></div>`}).join('')}
function setCur(){$('#cCoins').textContent=S.coins;$('#cGems').textContent=S.gems;$('#rec').textContent=`${S.w} victoire${S.w>1?'s':''} · ${S.g} but${S.g>1?'s':''}`}

/* ============ PASSE DE COMBAT (gratuit) ============ */
const BP_N=30,BP_XP=100;   // 30 paliers, 100 XP par palier (un match rapporte ~30 à 100 XP)
const bpLevel=()=>Math.min(BP_N,Math.floor(((S.bp&&S.bp.xp)||0)/BP_XP));
function bpReward(i){
 if(i===10)return{t:'shoe',id:'foudre'};if(i===20)return{t:'shoe',id:'phenix'};if(i===30)return{t:'shoe',id:'neon'};
 if(i===5||i===15)return{t:'box',id:'or'};if(i===25)return{t:'box',id:'mythique'};
 if(i%5===3)return{t:'box',id:'bronze'};
 return i%2?{t:'coins',n:60+i*10}:{t:'gems',n:4+Math.floor(i/2)};
}
const bpTxt=r=>r.t==='shoe'?`👟 ${SH[r.id].n}`:r.t==='box'?`${BOXES[r.id].em} ${BOXES[r.id].n}`:r.t==='coins'?`🪙 ${r.n} pièces`:`💎 ${r.n} gemmes`;
function bpClaim(i){
 if(i>bpLevel()||S.bp.cl[i])return null;
 const r=bpReward(i);S.bp.cl[i]=1;
 if(r.t==='coins')S.coins+=r.n;else if(r.t==='gems')S.gems+=r.n;
 else if(r.t==='box')S.boxes[r.id]=(S.boxes[r.id]||0)+1;
 else if(S.owned[r.id])S.owned[r.id].extra++;else S.owned[r.id]={lv:1,extra:0};
 return r;
}
function renderPass(){
 const t=$('#tabPass');if(!t)return;
 const top=t.scrollTop,lv=bpLevel(),xp=S.bp.xp||0,into=lv>=BP_N?BP_XP:xp%BP_XP;
 const avail=[];for(let i=1;i<=lv;i++)if(!S.bp.cl[i])avail.push(i);
 t.innerHTML=`<h3 class="stroke" style="text-align:center">PASSE DE COMBAT</h3>
 <div class="card"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><div style="font-size:24px">🏆 Palier ${lv}/${BP_N}</div><button class="btn small ${avail.length?'green':'grey'}" id="bpAll" ${avail.length?'':'disabled'}>Tout réclamer (${avail.length})</button></div>
 <div style="height:16px;background:#0b0a2a;border:3px solid #14122e;border-radius:10px;margin:8px 0 4px;overflow:hidden"><div style="height:100%;width:${into/BP_XP*100}%;background:linear-gradient(#ffe14d,#ff9a1e)"></div></div>
 <div style="font-size:13px;opacity:.85;font-family:Arial,sans-serif">${lv>=BP_N?'Passe terminé, bravo !':`${into}/${BP_XP} XP avant le palier ${lv+1}`} · Chaque match rapporte de l'XP (victoire : plus).</div></div>
 <div id="bpList" style="margin-top:8px"></div>`;
 const L=t.querySelector('#bpList');
 for(let i=1;i<=BP_N;i++){
  const r=bpReward(i),done=!!S.bp.cl[i],can=i<=lv&&!done;
  const d=document.createElement('div');d.className='card frow';d.style.opacity=done?.55:1;
  if(r.t==='shoe')d.style.borderColor=RAR[SH[r.id].r].c;
  d.innerHTML=`<div style="width:44px;font-size:22px;text-align:center">${i}</div><div style="flex:1;font-size:19px">${bpTxt(r)}</div>${done?'<div style="font-size:22px">✅</div>':can?'<button class="btn small green">Réclamer</button>':`<div style="font-size:13px;opacity:.8">🔒 ${i*BP_XP-xp} XP</div>`}`;
  const b=d.querySelector('button');
  if(b)b.onclick=()=>{const g=bpClaim(i);if(g){save();sfx('open');toast('Reçu : '+bpTxt(g));renderAll()}};
  L.appendChild(d);
 }
 $('#bpAll').onclick=()=>{let n=0;for(let i=1;i<=lv;i++)if(bpClaim(i))n++;if(n){save();sfx('open');toast(`${n} récompense${n>1?'s':''} reçue${n>1?'s':''} !`);renderAll()}};
 t.scrollTop=top;
}

/* ============ CODES SECRETS ============ */
const CODES={snake:()=>{S.coins+=1000;S.gems+=1000;return '🪙 +1000 et 💎 +1000 !'}};
function redeem(txt){
 const c=(txt||'').trim().toLowerCase();if(!c)return toast('Entre un code');
 if(!CODES[c])return toast('Code invalide');
 if(S.codes[c])return toast('Code déjà utilisé sur ce compte');
 S.codes[c]=1;const m=CODES[c]();save();sfx('open');toast('Code activé ! '+m);renderAll();
}
function dailyReady(){return Date.now()-S.daily>20*3600e3}
function renderHome(){
 const s=SH[S.eq],lv=S.owned[s.id].lv;
 document.querySelectorAll('#modeRow button').forEach(b=>{b.className='btn small '+(+b.dataset.sz===S.size?'blue':'grey')});
 const M=MODES[modeSel];
 $('#modeTxt').textContent=`Match ${S.size} contre ${S.size} · ${M.goals?'premier à '+M.goals:fmt(M.t)}`;
 let mb=$('#modeBtn');
 if(!mb){mb=document.createElement('button');mb.id='modeBtn';mb.className='btn small';mb.onclick=()=>{sfx('ui');showModes()};$('#modeTxt').after(mb)}
 mb.className='btn small '+(modeSel==='classic'?'blue':'green');mb.textContent=`${M.em} Mode : ${M.n} ▾`;
 let ev=$('#evTxt');if(!ev){ev=document.createElement('div');ev.id='evTxt';ev.style.cssText='font-size:13px;color:#ffd23a;text-align:center;text-shadow:0 2px 0 #000;font-family:Arial,sans-serif;font-weight:bold';mb.after(ev)}
 ev.textContent=eventMul()>1?'🔥 Week-end : pièces ×2 !':'';
 $('#homeShoe').innerHTML=`<div style="font-size:14px;opacity:.8">TA CHAUSSURE</div><img src="${thumb(s)}" alt=""><div style="font-size:20px">${s.n}</div><div style="margin:4px 0">${rarChip(s.r)} <span class="rar" style="background:#14122e">Niv. ${lv}</span></div>${bars(s,lv)}`;
 const db=$('#dailyBtn');db.disabled=!dailyReady();db.textContent=dailyReady()?'🎁 Cadeau du jour':'🎁 Revenez plus tard';
 const row=$('#openRow');row.innerHTML='';
 Object.keys(BOXES).forEach(k=>{if(S.boxes[k]>0){const b=document.createElement('button');b.className='btn small green';b.textContent=`${BOXES[k].em} Ouvrir ${BOXES[k].n.replace('Coffre ','')} ×${S.boxes[k]}`;b.onclick=()=>openBox(k);row.appendChild(b)}});
}
/* ============ FONCTIONNALITÉS : missions, succès, roue, tenue, ballons, stades, réglages, profil ============ */
function modal(html,mount){
 const ov=$('#detail');ov.classList.remove('hidden');
 ov.innerHTML=`<div class="card modal" style="max-height:92vh;overflow:auto;min-width:min(86vw,440px);background:#1b1464">${html}<div style="margin-top:10px"><button class="btn small grey" id="closeD">Fermer</button></div></div>`;
 $('#closeD').onclick=()=>{ov.classList.add('hidden');renderAll()};if(mount)mount(ov);
}
function give(r){
 const t=[];if(r.c){S.coins+=r.c;t.push('🪙 +'+r.c)}if(r.g){S.gems+=r.g;t.push('💎 +'+r.g)}if(r.b){S.boxes[r.b]++;t.push(BOXES[r.b].em+' '+BOXES[r.b].n)}
 return t.join(' · ');
}
const rewTxt=r=>[r.c&&'🪙 '+r.c,r.g&&'💎 '+r.g,r.b&&BOXES[r.b].em+' '+BOXES[r.b].n].filter(Boolean).join(' · ');
const bar=(v,n,col)=>`<div style="height:10px;background:#0b0a2a;border:2px solid #14122e;border-radius:6px;overflow:hidden;margin:4px 0"><div style="height:100%;width:${Math.min(100,v/n*100)}%;background:${col||'#7dff5a'}"></div></div>`;

/* missions du jour */
const MT=[
 {id:'play',t:'Joue 3 matchs',n:3,k:'m',r:{c:60}},{id:'win',t:'Gagne 1 match',n:1,k:'w',r:{c:100}},{id:'win2',t:'Gagne 2 matchs',n:2,k:'w',r:{g:5}},
 {id:'goals',t:'Marque 5 buts',n:5,k:'g',r:{c:120}},{id:'goals2',t:'Marque 10 buts',n:10,k:'g',r:{g:6}},
 {id:'dash',t:'Fais 15 sprints',n:15,k:'da',r:{c:80}},{id:'shots',t:'Tire 20 fois',n:20,k:'sh',r:{c:80}},{id:'hit',t:'Plaque 6 adversaires',n:6,k:'ht',r:{c:90}},
 {id:'cs',t:'Gagne sans encaisser de but',n:1,k:'cs',r:{b:'bronze'}},{id:'sp',t:'Joue un mode spécial',n:1,k:'sp',r:{c:100}}];
function missCheck(){
 const d=dayKey();if(S.miss.d===d&&S.miss.l.length)return;
 let h=hash32('m'+d);const pool=MT.slice(),pick=[];
 while(pick.length<3){const i=h%pool.length;pick.push(pool.splice(i,1)[0]);h=Math.imul(h,1103515245)+12345>>>0}
 S.miss={d,l:pick.map(m=>({id:m.id,p:0,cl:0}))};
}
function missAdd(k,n){if(!n)return;missCheck();S.miss.l.forEach(m=>{const t=MT.find(x=>x.id===m.id);if(t&&t.k===k)m.p=Math.min(t.n,m.p+n)})}
const missReady=()=>{missCheck();return S.miss.l.filter(m=>!m.cl&&m.p>=MT.find(x=>x.id===m.id).n).length};

/* succès */
const cntOwned=()=>SHOES.filter(x=>S.owned[x.id]).length;
const ACH=[
 {id:'w1',t:'Première victoire',f:()=>S.st.w,n:1,r:{c:100}},{id:'w10',t:'10 victoires',f:()=>S.st.w,n:10,r:{g:10}},{id:'w50',t:'50 victoires',f:()=>S.st.w,n:50,r:{g:40}},
 {id:'m25',t:'Joue 25 matchs',f:()=>S.st.m,n:25,r:{c:300}},{id:'g25',t:'Marque 25 buts',f:()=>S.st.g,n:25,r:{c:200}},{id:'g100',t:'Marque 100 buts',f:()=>S.st.g,n:100,r:{g:30}},
 {id:'ws3',t:'3 victoires d\'affilée',f:()=>S.st.bws,n:3,r:{c:200}},{id:'ws7',t:'7 victoires d\'affilée',f:()=>S.st.bws,n:7,r:{g:25}},
 {id:'cs5',t:'5 matchs sans but encaissé',f:()=>S.st.cs,n:5,r:{g:15}},{id:'sh25',t:'Possède 25 chaussures',f:cntOwned,n:25,r:{c:500}},{id:'sh100',t:'Possède 100 chaussures',f:cntOwned,n:100,r:{g:60}},
 {id:'myth',t:'Obtiens une chaussure Mythique',f:()=>SHOES.filter(x=>x.r===4&&S.owned[x.id]).length,n:1,r:{g:30}},
 {id:'sp5',t:'5 matchs en mode spécial',f:()=>S.st.sp,n:5,r:{g:10}},{id:'bp10',t:'Palier 10 du passe',f:()=>bpLevel(),n:10,r:{c:300}},
 {id:'st7',t:'7 jours de connexion d\'affilée',f:()=>S.streak.max,n:7,r:{b:'or'}}];
const achReady=()=>ACH.filter(a=>!S.ach[a.id]&&a.f()>=a.n).length;

function showMissions(){
 missCheck();const n=Math.min(S.streak.n||0,7);
 const days=[1,2,3,4,5,6,7].map(i=>`<div style="flex:1;text-align:center;padding:4px 0;border-radius:8px;border:2px solid #14122e;background:${i<=n?'#2fa84a':'#0b0a2a'};font-size:12px">${i===7?'🎁':'🪙'}<br>J${i}</div>`).join('');
 modal(`<h3 class="stroke" style="font-size:28px">🎯 MISSIONS DU JOUR</h3>
 <div style="font-size:13px;opacity:.85;font-family:Arial,sans-serif">Série de connexion : ${S.streak.n||0} jour${(S.streak.n||0)>1?'s':''}</div><div style="display:flex;gap:4px;margin:6px 0 12px">${days}</div>
 ${S.miss.l.map((m,i)=>{const t=MT.find(x=>x.id===m.id),ok=m.p>=t.n;return `<div class="card" style="margin:8px 0;text-align:left"><div style="font-size:18px">${t.t}</div>${bar(m.p,t.n)}<div style="display:flex;justify-content:space-between;align-items:center;font-size:14px"><span>${m.p}/${t.n} · ${rewTxt(t.r)}</span>${m.cl?'<span style="color:#7dff5a">Réclamée ✅</span>':`<button class="btn small ${ok?'green':'grey'}" data-mi="${i}">Réclamer</button>`}</div></div>`}).join('')}
 <div style="font-size:12px;opacity:.7;font-family:Arial,sans-serif">De nouvelles missions chaque jour.</div>`,ov=>ov.querySelectorAll('[data-mi]').forEach(b=>b.onclick=()=>{
  const m=S.miss.l[+b.dataset.mi],t=MT.find(x=>x.id===m.id);if(m.cl||m.p<t.n)return toast('Pas encore terminée !');
  m.cl=1;toast(give(t.r));sfx('open');save();setCur();showMissions()}));
}
function showAchs(){
 modal(`<h3 class="stroke" style="font-size:28px">🏅 SUCCÈS ${Object.keys(S.ach).length}/${ACH.length}</h3>${ACH.map(a=>{const v=Math.min(a.f(),a.n),ok=a.f()>=a.n,cl=S.ach[a.id];return `<div class="card" style="margin:6px 0;text-align:left;opacity:${cl?.6:1}"><div style="font-size:17px">${a.t}</div>${bar(v,a.n,cl?'#ffd23a':'#7dff5a')}<div style="display:flex;justify-content:space-between;align-items:center;font-size:14px"><span>${v}/${a.n} · ${rewTxt(a.r)}</span>${cl?'<span>✅</span>':`<button class="btn small ${ok?'green':'grey'}" data-ai="${a.id}">Réclamer</button>`}</div></div>`}).join('')}`,
  ov=>ov.querySelectorAll('[data-ai]').forEach(b=>b.onclick=()=>{const a=ACH.find(x=>x.id===b.dataset.ai);if(S.ach[a.id]||a.f()<a.n)return toast('Pas encore débloqué !');S.ach[a.id]=1;toast(give(a.r));sfx('open');save();setCur();showAchs()}));
}

/* roue de la chance */
const WHEEL=[{t:'🪙 50',c:50,w:30},{t:'💎 3',g:3,w:18},{t:'🪙 150',c:150,w:20},{t:'📦 Bronze',b:'bronze',w:12},{t:'🪙 300',c:300,w:8},{t:'💎 10',g:10,w:6},{t:'🎁 Or',b:'or',w:4},{t:'🪙 1000',c:1000,w:2}];
const WCOL=['#3b6cff','#ff4d6d','#27b85a','#ffb21e','#9b3bff','#17c3c3','#ff7a00','#e0e0e0'];
let wheelRot=0,wheelBusy=false;
const wheelFree=()=>S.wheel!==dayKey();
function showWheel(){
 const free=wheelFree();
 modal(`<h3 class="stroke" style="font-size:28px">🎡 ROUE DE LA CHANCE</h3>
 <div style="position:relative;width:190px;height:190px;margin:10px auto">
  <div style="position:absolute;left:50%;top:-12px;transform:translateX(-50%);font-size:30px;z-index:3">🔻</div>
  <div id="wheelD" style="width:190px;height:190px;border-radius:50%;border:5px solid #14122e;background:conic-gradient(${WHEEL.map((_,i)=>`${WCOL[i]} ${i*45}deg ${(i+1)*45}deg`).join(',')});transform:rotate(${wheelRot}deg);transition:transform 4s cubic-bezier(.12,.7,.15,1);position:relative">
   ${WHEEL.map((w,i)=>`<div style="position:absolute;left:50%;top:50%;transform:rotate(${i*45+22.5}deg) translateY(-68px) translateX(-50%);transform-origin:0 0;font-size:12px;color:#111;text-shadow:0 1px 0 #fff8;white-space:nowrap;font-family:Arial,sans-serif;font-weight:bold;text-align:center;width:70px;margin-left:0">${w.t}</div>`).join('')}
  </div></div>
 <button class="btn ${free?'green':(S.gems>=10?'blue':'grey')} big" id="spinBtn">${free?'Tourner (gratuit)':'Tourner · 💎 10'}</button>
 <div style="font-size:12px;opacity:.75;margin-top:6px;font-family:Arial,sans-serif">Un tour gratuit par jour.</div>`,ov=>{
  $('#spinBtn').onclick=()=>{
   if(wheelBusy)return;
   if(!wheelFree()){if(S.gems<10)return toast('Il te faut 10 💎 !');S.gems-=10}else S.wheel=dayKey();
   wheelBusy=true;save();setCur();sfx('shake');
   let tot=WHEEL.reduce((a,b)=>a+b.w,0),r=Math.random()*tot,idx=0;for(;idx<WHEEL.length-1;idx++){if(r<WHEEL[idx].w)break;r-=WHEEL[idx].w}
   wheelRot+=360*5+((360-(idx*45+22.5)-(wheelRot%360)+720)%360);
   $('#wheelD').style.transform=`rotate(${wheelRot}deg)`;
   setTimeout(()=>{wheelBusy=false;const w=WHEEL[idx];const tx=give(w);save();setCur();sfx('open');buzz(80);toast('🎡 '+tx);if(ov.querySelector('#spinBtn'))showWheel()},4300);
  };
 });
}

/* tenue */
const KITC=[0x2f7bff,0xff3b3b,0x2ecc40,0xffd23a,0xb44cff,0xff7a00,0xff6fb5,0x15f5a0,0x111111,0xffffff];
const hexc=n=>'#'+n.toString(16).padStart(6,'0');
function showKit(){
 const row=(k,lab)=>`<div style="margin:10px 0 4px;font-size:16px">${lab}</div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center">${KITC.map(c=>`<button data-k="${k}" data-c="${c}" style="width:38px;height:38px;border-radius:50%;border:4px solid ${S.kit[k]===c?'#ffd23a':'#14122e'};background:${hexc(c)}"></button>`).join('')}<button data-k="${k}" data-c="" class="btn small grey">Défaut</button></div>`;
 modal(`<h3 class="stroke" style="font-size:28px">👕 TA TENUE</h3>${row('b','Maillot')}${row('c','Casquette')}<div style="font-size:12px;opacity:.7;margin-top:8px;font-family:Arial,sans-serif">Visible en match contre les robots.</div>`,ov=>ov.querySelectorAll('[data-k]').forEach(b=>b.onclick=()=>{
  S.kit[b.dataset.k]=b.dataset.c===''?null:+b.dataset.c;save();applyKit(human,!ONLINE);sfx('ui');showKit()}));
}
/* ballons */
function showBalls(){
 modal(`<h3 class="stroke" style="font-size:28px">⚽ BALLONS</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px">${BALLS.map(b=>{
  const own=S.balls.own[b.id],eq=S.balls.eq===b.id;
  return `<div class="card" style="text-align:center;padding:8px"><div style="width:64px;height:64px;margin:0 auto;border-radius:50%;background:center/cover url(${ballCanvas(b).toDataURL()});border:3px solid #14122e;box-shadow:inset -8px -8px 14px rgba(0,0,0,.35)"></div><div style="margin:4px 0">${b.n}</div>${b.tr?'<div style="font-size:11px;opacity:.8">✨ traînée</div>':''}<button class="btn small ${eq?'grey':own?'green':(S.coins>=b.p?'blue':'grey')}" data-b="${b.id}">${eq?'Équipé ✅':own?'Équiper':'🪙 '+b.p}</button></div>`}).join('')}</div>`,
 ov=>ov.querySelectorAll('[data-b]').forEach(bt=>bt.onclick=()=>{
  const b=BALLS.find(x=>x.id===bt.dataset.b);
  if(!S.balls.own[b.id]){if(S.coins<b.p)return toast('Pas assez de pièces !');S.coins-=b.p;S.balls.own[b.id]=1;sfx('open')}
  S.balls.eq=b.id;setBallSkin(b.id);save();setCur();showBalls()}));
}
/* stades */
function showThemes(){
 modal(`<h3 class="stroke" style="font-size:28px">🏟️ STADES</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px">${THEMES.map(t=>`<button class="btn ${S.theme===t.id?'green':'grey'}" data-t="${t.id}" style="padding:10px"><div style="font-size:30px">${t.em}</div>${t.n}${S.theme===t.id?' ✅':''}</button>`).join('')}</div>`,
  ov=>ov.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{S.theme=b.dataset.t;setTheme(S.theme);save();sfx('ui');showThemes()}));
}
/* réglages */
function showSettings(){
 const tg=(k,t)=>`<button class="btn ${S.set[k]?'green':'grey'}" data-s="${k}" style="display:flex;justify-content:space-between;width:100%"><span>${t}</span><span>${S.set[k]?'OUI':'NON'}</span></button>`;
 modal(`<h3 class="stroke" style="font-size:28px">⚙️ RÉGLAGES</h3><div style="display:flex;flex-direction:column;gap:8px">${tg('snd','🔊 Sons')}${tg('crowd','👏 Ambiance de stade')}${tg('vib','📳 Vibrations')}${tg('shk','🎥 Secousses de caméra')}${tg('fps','📈 Compteur FPS')}</div>
 <div style="margin:12px 0 4px;font-size:16px">🎚️ Difficulté des robots</div><div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap">${DIFF.map((d,i)=>`<button class="btn small ${S.diff===i?'blue':'grey'}" data-d="${i}">${d.n}</button>`).join('')}</div>
 <div style="font-size:12px;opacity:.75;margin-top:6px;font-family:Arial,sans-serif">Plus c'est dur, plus tu gagnes de pièces (×${DIFF.map(d=>d.m).join(' / ×')}).</div>
 <div style="margin-top:12px;font-size:13px;opacity:.85;font-family:Arial,sans-serif">Version du jeu : ${window.KB_BUILD||'…'} · mises à jour automatiques</div><button class="btn small blue" id="updBtn" style="margin-top:4px">🔄 Chercher une mise à jour</button>`,ov=>{
  $('#updBtn').onclick=()=>{if(window.KB_CHECK)window.KB_CHECK(true);else toast('Mise à jour automatique indisponible ici')};
  ov.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{S.set[b.dataset.s]=S.set[b.dataset.s]?0:1;save();sfx('ui');showSettings()});
  ov.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{S.diff=+b.dataset.d;save();sfx('ui');players.forEach(p=>{if(p!==human&&!p.uid)setBot(p)});showSettings()});
 });
}
/* profil */
function showProfile(){
 const t=S.st,wr=t.m?Math.round(t.w/t.m*100):0,min=Math.round(t.sec/60);
 const cell=(l,v)=>`<div class="card" style="padding:6px;text-align:center"><div style="font-size:22px">${v}</div><div style="font-size:12px;opacity:.8;font-family:Arial,sans-serif">${l}</div></div>`;
 modal(`<h3 class="stroke" style="font-size:28px">📊 PROFIL</h3><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px">${cell('Matchs',t.m)}${cell('Victoires',t.w)}${cell('% victoires',wr+'%')}${cell('Buts marqués',t.g)}${cell('Buts encaissés',t.ga)}${cell('Sans encaisser',t.cs)}${cell('Tirs',t.sh)}${cell('Sprints',t.da)}${cell('Plaquages',t.hh===undefined?t.ht:t.ht)}${cell('Série en cours',S.ws)}${cell('Meilleure série',t.bws)}${cell('Record de buts',t.mx)}${cell('Chaussures',cntOwned()+'/'+SHOES.length)}${cell('Jours d\'affilée',S.streak.n||0)}${cell('Temps de jeu',min+' min')}</div>`);
}
function renderMore(){
 const t=$('#tabMore');if(!t)return;
 const mr=missReady(),ar=achReady(),wf=wheelFree();
 const B=(id,em,tx,badge)=>`<button class="btn blue" id="${id}" style="position:relative;padding:12px 8px;display:flex;flex-direction:column;align-items:center;gap:2px"><span style="font-size:32px">${em}</span><span style="font-size:17px">${tx}</span>${badge?`<span style="position:absolute;top:-6px;right:-6px;background:#ff3b3b;border:3px solid #14122e;border-radius:12px;min-width:22px;font-size:13px;padding:0 5px">${badge}</span>`:''}</button>`;
 t.innerHTML=`<h3 class="stroke" style="text-align:center">✨ PLUS</h3><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding-bottom:10px">
  ${B('mMiss','🎯','Missions',mr||'')}${B('mAch','🏅','Succès',ar||'')}${B('mWheel','🎡','Roue',wf?'1':'')}${B('mProf','📊','Profil','')}
  ${B('mKit','👕','Tenue','')}${B('mBall','⚽','Ballons','')}${B('mTheme','🏟️','Stades','')}${B('mTrain','🎯','Entraînement','')}${B('mSet','⚙️','Réglages','')}</div>`;
 const o=(id,f)=>{$('#'+id).onclick=()=>{sfx('ui');f()}};
 o('mMiss',showMissions);o('mAch',showAchs);o('mWheel',showWheel);o('mProf',showProfile);o('mKit',showKit);o('mBall',showBalls);o('mTheme',showThemes);o('mSet',showSettings);
 o('mTrain',()=>{const old=modeSel;modeSel='training';unlockAudio();ONLINE=null;myTeam=0;setSize(S.size);human=players[0];players.forEach(p=>setBot(p));applyStats();startMatch();modeSel=old});
 const nb=document.querySelector('.nav button[data-tab=More]');if(nb)nb.textContent='✨ Plus'+(mr+ar+(wf?1:0)>0?' 🔴':'');
}

function showModes(){
 const ov=$('#detail');ov.classList.remove('hidden');
 ov.innerHTML=`<div class="card modal" style="max-height:88vh;overflow:auto"><div style="font-size:26px" class="stroke">CHOISIS TON MODE</div><div style="display:flex;flex-direction:column;gap:8px;margin:10px 0">${Object.entries(MODES).map(([k,m])=>`<button class="btn ${k===modeSel?'green':'grey'}" data-m="${k}" style="text-align:left;display:block;width:100%"><div style="font-size:20px">${m.em} ${m.n}</div><div style="font-size:13px;opacity:.9;font-family:Arial,sans-serif;font-weight:normal">${m.d}</div></button>`).join('')}</div><div style="font-size:12px;opacity:.7;font-family:Arial,sans-serif;margin-bottom:8px">Les modes spéciaux se jouent contre les robots. Les salons en ligne restent en mode Classique.</div><button class="btn small grey" id="closeD">Fermer</button></div>`;
 $('#closeD').onclick=()=>ov.classList.add('hidden');
 ov.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{modeSel=b.dataset.m;try{localStorage.setItem('kb_mode',modeSel)}catch(e){}sfx('ui');ov.classList.add('hidden');renderHome()});
}
function renderShop(){
 const t=$('#tabShop');
 t.innerHTML='<h3 class="stroke" style="text-align:center">BOUTIQUE</h3><div class="boxes"></div><div style="text-align:center;font-size:13px;margin-top:12px;opacity:.8;font-family:Arial,sans-serif">Gagne des 🪙 et 💎 en jouant. Aucun achat réel : tout est gagné en jeu.</div>';
 const wrap=t.querySelector('.boxes');
 Object.entries(BOXES).forEach(([k,b])=>{
  const names=['Commun','Rare','Épique','Légendaire','Mythique'];
  const odds=b.odds.map((o,i)=>o>0?`<span style="color:${RAR[i].c}">${names[i]} ${o}%</span>`:'').filter(Boolean).join(' · ');
  const can=b.cur==='coins'?S.coins>=b.cost:S.gems>=b.cost;
  const d=document.createElement('div');d.className='card boxCard';
  d.innerHTML=`<div class="em">${b.em}</div><div style="font-size:22px">${b.n}</div><small>${odds}</small><button class="btn ${can?'green':'grey'}">${b.cur==='coins'?'🪙':'💎'} ${b.cost}</button>`;
  d.querySelector('button').onclick=()=>{
   if(b.cur==='coins'){if(S.coins<b.cost)return toast('Pas assez de pièces !');S.coins-=b.cost}
   else{if(S.gems<b.cost)return toast('Pas assez de gemmes !');S.gems-=b.cost}
   S.boxes[k]++;save();setCur();openBox(k);
  };
  wrap.appendChild(d);
 });
 const dl=dealShoe(),dp=SHOE_PRICE[dl.r],dn=priceOf(dl);
 const dc=document.createElement('div');dc.className='card';dc.style.cssText='margin-top:12px;display:flex;align-items:center;gap:12px;border-color:#ff7a00';
 dc.innerHTML=`<img src="${thumb(dl)}" style="width:84px;height:84px;object-fit:contain"><div style="flex:1;text-align:left"><div class="stroke" style="color:#ff9a3a;font-size:18px">🔥 OFFRE DU JOUR −50%</div><div style="font-size:20px">${dl.n}</div><div style="color:${RAR[dl.r].c};font-size:13px">${RAR[dl.r].n}</div></div>${S.owned[dl.id]?'<div style="color:#7dff5a">Possédée ✅</div>':`<button class="btn ${S[dn.c]>=dn.n?'green':'grey'}" id="dealBtn"><s style="opacity:.6;font-size:13px">${dp.n}</s> ${dn.c==='coins'?'🪙':'💎'} ${dn.n}</button>`}`;
 t.appendChild(dc);const db=$('#dealBtn');if(db)db.onclick=()=>buyShoe(dl);
 const pt=document.createElement('div');pt.style.cssText='text-align:center;font-size:13px;margin-top:8px;opacity:.9;font-family:Arial,sans-serif';pt.textContent=`🍀 Chance : un coffre Légendaire (ou mieux) est garanti dans ${Math.max(1,14-(S.pity||0))} ouverture${14-(S.pity||0)>1?'s':''}.`;t.appendChild(pt);
 const sh=document.createElement('div');sh.innerHTML='<h3 class="stroke" style="text-align:center;margin:18px 0 0">👟 BOUTIQUE DE CHAUSSURES · '+SHOES.length+'</h3><div style="text-align:center;font-size:13px;opacity:.8;font-family:Arial,sans-serif">Achète directement la chaussure que tu veux.</div><div id="shopShoes"></div>';
 t.appendChild(sh);shoeBrowser($('#shopShoes'),SB.shop,true);
 const cc=document.createElement('div');cc.className='card';cc.style.marginTop='12px';
 cc.innerHTML='<div style="font-size:18px">🔑 Code secret</div><div class="frow"><input id="codeIn" maxlength="20" placeholder="Entre un code" autocapitalize="off" autocorrect="off" autocomplete="off"><button class="btn small green" id="codeOk">Valider</button></div>';
 t.appendChild(cc);
 const ci=$('#codeIn');ci.value=codeTxt;ci.oninput=()=>{codeTxt=ci.value};
 ci.onkeydown=e=>{if(e.key==='Enter')$('#codeOk').click()};
 $('#codeOk').onclick=()=>{const v=ci.value;codeTxt='';redeem(v)};
}
let codeTxt='';
/* ---- navigateur de chaussures : filtres + pages (1000 chaussures) ---- */
const PAGE_N=24,SB={shoes:{r:-1,own:0,pg:0},shop:{r:-1,own:0,pg:0}};
const SHOE_PRICE=[{c:'coins',n:150},{c:'coins',n:400},{c:'coins',n:1000},{c:'gems',n:120},{c:'gems',n:300}];
const dealC={d:'',s:null};
function dealShoe(){const d=dayKey();if(dealC.d!==d){const h=hash32('deal'+d);let x=SHOES[5];for(let i=0;i<60;i++){const y=SHOES[(h+i*7919)%SHOES.length];if(y.r>=1){x=y;break}}dealC.d=d;dealC.s=x}return dealC.s}
const priceOf=s=>{const b=SHOE_PRICE[s.r];return dealShoe().id===s.id?{c:b.c,n:Math.ceil(b.n/2)}:b};
const priceTxt=s=>(priceOf(s).c==='coins'?'🪙 ':'💎 ')+priceOf(s).n;
const REC_V=[10,30,80,200,500];
const shoeScore=x=>{const o=S.owned[x.id];return x.st.reduce((a,b)=>a+b,0)*statMul(o?o.lv:1)};
function bestShoe(){let b=null;SHOES.forEach(x=>{if(S.owned[x.id]&&(!b||shoeScore(x)>shoeScore(b)||(shoeScore(x)===shoeScore(b)&&x.r>b.r)))b=x});return b}
function buyShoe(s){
 if(S.owned[s.id])return toast('Tu l\'as déjà !');
 const pr=priceOf(s);
 if(S[pr.c]<pr.n)return toast(pr.c==='coins'?'Pas assez de pièces !':'Pas assez de gemmes !');
 S[pr.c]-=pr.n;S.owned[s.id]={lv:1,extra:0};save();sfx('open');toast(`${s.n} achetée !`);renderAll();
}
function shoeBrowser(host,st,shop){
 const draw=()=>shoeBrowser(host,st,shop);
 st.q=st.q||'';st.sort=st.sort||'rar';
 const q=st.q.trim().toLowerCase();
 let list=SHOES.map((x,i)=>[x,i]).filter(([x])=>(st.r<0||x.r===st.r)&&(st.own===0||(st.own===3?!!S.fav[x.id]:(st.own===1)===!!S.owned[x.id]))&&(!q||x.n.toLowerCase().includes(q)));
 const key={rar:x=>shop?x.r:-x.r,vit:x=>-x.st[0],tir:x=>-x.st[1],ctl:x=>-x.st[2],tot:x=>-x.st.reduce((a,b)=>a+b,0),prix:x=>priceOf(x).c==='gems'?priceOf(x).n*5:priceOf(x).n}[st.sort]||(x=>0);
 list.sort((a,b)=>(key(a[0])-key(b[0]))||(shop?a[0].r-b[0].r:b[0].r-a[0].r)||a[1]-b[1]);list=list.map(x=>x[0]);
 const pages=Math.max(1,Math.ceil(list.length/PAGE_N));st.pg=clamp(st.pg,0,pages-1);
 host.innerHTML='';
 const bar=document.createElement('div');bar.style.cssText='display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:6px 0';
 const chip=(txt,on,col,fn)=>{const b=document.createElement('button');b.className='btn small '+(on?'blue':'grey');b.textContent=txt;if(on&&col)b.style.background=col;b.onclick=()=>{sfx('ui');fn();draw()};bar.appendChild(b)};
 chip('Toutes',st.r<0,null,()=>{st.r=-1;st.pg=0});
 RAR.forEach((r,i)=>chip(r.n,st.r===i,r.c,()=>{st.r=i;st.pg=0}));
 const bar2=document.createElement('div');bar2.style.cssText='display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:0 0 6px';
 [['Tout',0],['Possédées',1],['Manquantes',2],['⭐ Favoris',3]].forEach(([t,v])=>{const b=document.createElement('button');b.className='btn small '+(st.own===v?'green':'grey');b.textContent=t;b.onclick=()=>{sfx('ui');st.own=v;st.pg=0;draw()};bar2.appendChild(b)});
 const bar3=document.createElement('div');bar3.style.cssText='display:flex;gap:6px;flex-wrap:wrap;justify-content:center;align-items:center;margin:0 0 8px';
 const inp=document.createElement('input');inp.type='search';inp.placeholder='🔎 Chercher un nom…';inp.value=st.q;inp.maxLength=24;inp.style.cssText='font:inherit;font-size:16px;padding:5px 10px;border-radius:12px;border:3px solid #14122e;background:#0b0a2a;color:#fff;width:190px';
 let tm=null;inp.oninput=()=>{st.q=inp.value;st.pg=0;st.f=1;clearTimeout(tm);tm=setTimeout(draw,300)};
 const sel=document.createElement('select');sel.style.cssText='font:inherit;font-size:15px;padding:5px 8px;border-radius:12px;border:3px solid #14122e;background:#0b0a2a;color:#fff';
 [['rar','Tri : rareté'],['vit','Tri : vitesse'],['tir','Tri : tir'],['ctl','Tri : contrôle'],['tot','Tri : total']].concat(shop?[['prix','Tri : prix']]:[]).forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;if(st.sort===v)o.selected=true;sel.appendChild(o)});
 sel.onchange=()=>{st.sort=sel.value;st.pg=0;draw()};
 bar3.append(inp,sel);
 host.append(bar,bar2,bar3);
 const grid=document.createElement('div');grid.className='grid';host.appendChild(grid);
 list.slice(st.pg*PAGE_N,(st.pg+1)*PAGE_N).forEach(x=>{
  const o=S.owned[x.id],d=document.createElement('div'),hide=!shop&&!o;
  d.className='tile'+(hide?' locked':'');d.style.setProperty('--rc',RAR[x.r].c);
  const dl=shop&&!o&&dealShoe().id===x.id;
  d.innerHTML=`<img src="${thumb(x)}" alt=""><div>${hide?'???':x.n}</div><div style="color:${RAR[x.r].c};font-size:12px">${RAR[x.r].n}</div>${o?`<span class="lv">Niv.${o.lv}</span>`:''}${S.eq===x.id?'<span class="eq">✅</span>':S.fav[x.id]?'<span class="eq">⭐</span>':''}${o&&o.extra?`<span class="cp">+${o.extra}</span>`:''}${shop?(o?'<div style="font-size:12px;color:#7dff5a;margin-top:2px">Possédée ✅</div>':`<button class="btn small ${S[priceOf(x).c]>=priceOf(x).n?'green':'grey'}" style="margin-top:3px;font-size:13px;padding:3px 8px">${dl?'🔥 ':''}${priceTxt(x)}</button>`):''}`;
  d.onclick=ev=>{if(shop&&!o&&ev.target.tagName==='BUTTON'){buyShoe(x);return}sfx('ui');showDetail(x,shop)};
  grid.appendChild(d);
 });
 if(!list.length){const e=document.createElement('div');e.style.cssText='text-align:center;opacity:.8;padding:20px';e.textContent='Aucune chaussure ici.';grid.replaceWith(e)}
 const pg=document.createElement('div');pg.style.cssText='display:flex;gap:12px;align-items:center;justify-content:center;margin:6px 0 12px';
 pg.innerHTML=`<button class="btn small blue" ${st.pg?'':'disabled'}>◀</button><span style="font-size:15px">Page ${st.pg+1} / ${pages} · ${list.length} chaussures</span><button class="btn small blue" ${st.pg<pages-1?'':'disabled'}>▶</button>`;
 const [pb,,nb]=pg.children;pb.onclick=()=>{st.pg--;sfx('ui');draw()};nb.onclick=()=>{st.pg++;sfx('ui');draw()};
 host.appendChild(pg);
 if(st.f){st.f=0;inp.focus();try{inp.setSelectionRange(inp.value.length,inp.value.length)}catch(e){}}
}
function renderShoes(){
 const t=$('#tabShoes');
 const n=SHOES.filter(s=>S.owned[s.id]).length;
 t.innerHTML=`<h3 class="stroke" style="text-align:center">COLLECTION ${n}/${SHOES.length}</h3><div style="text-align:center"><button class="btn small blue" id="bestBtn">⭐ Équiper la meilleure</button></div><div id="shoeHost"></div>`;
 $('#bestBtn').onclick=()=>{const b=bestShoe();if(!b)return;S.eq=b.id;save();applyStats();sfx('ui');toast(`${b.n} équipée !`);renderAll()};
 shoeBrowser($('#shoeHost'),SB.shoes,false);
}
function showDetail(s,shop){
 const o=S.owned[s.id],ov=$('#detail');ov.classList.remove('hidden');
 let act='';
 const rev=!!(o||shop);
 if(o){
  const eq=S.eq===s.id,maxed=o.lv>=5;
  const need=UP_NEED[o.lv-1],cost=Math.round(UP_COST[o.lv-1]*(1+s.r*.5));
  act=`<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px">
   <button class="btn ${eq?'grey':'green'}" id="eqBtn" ${eq?'disabled':''}>${eq?'Équipée ✅':'Équiper'}</button>
   ${maxed?'<button class="btn grey" disabled>Niveau max</button>':`<button class="btn ${o.extra>=need&&S.coins>=cost?'blue':'grey'}" id="upBtn">⬆ Niv.${o.lv+1} · 🪙${cost} + ${need} doublon${need>1?'s':''} (${o.extra}/${need})</button>`}</div>`;
 }
 ov.innerHTML=`<div class="card modal" style="border-color:${RAR[s.r].c}"><img src="${thumb(s)}" style="${rev?'':'filter:brightness(0) opacity(.5)'}"><div style="font-size:26px">${rev?s.n:'Chaussure inconnue'}</div>${rarChip(s.r)} ${o?`<span class="rar" style="background:#14122e">Niv. ${o.lv}</span>`:''}<div style="margin:8px 0">${bars(s,o?o.lv:1)}</div>${o?'':'<div style="opacity:.8;margin:6px 0">Trouve-la dans les coffres ou à la boutique !</div>'}${o?'':`<button class="btn ${S[priceOf(s).c]>=priceOf(s).n?'green':'grey'}" id="buyBtn">Acheter · ${priceTxt(s)}</button>`}${act}<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:8px"><button class="btn small ${S.fav[s.id]?'blue':'grey'}" id="favBtn">${S.fav[s.id]?'⭐ Favori':'☆ Favori'}</button>${o&&o.extra>0?`<button class="btn small grey" id="recBtn">♻️ Recycler (+${REC_V[s.r]} 🪙)</button>`:''}</div><div style="margin-top:12px"><button class="btn small grey" id="closeD">Fermer</button></div></div>`;
 $('#closeD').onclick=()=>ov.classList.add('hidden');
 const fv=$('#favBtn');if(fv)fv.onclick=()=>{if(S.fav[s.id])delete S.fav[s.id];else S.fav[s.id]=1;save();sfx('ui');showDetail(s,shop)};
 const rc=$('#recBtn');if(rc)rc.onclick=()=>{if(!o||o.extra<1)return;o.extra--;S.coins+=REC_V[s.r];save();sfx('open');toast(`♻️ +${REC_V[s.r]} 🪙`);renderAll();showDetail(s,shop)};
 const by=$('#buyBtn');if(by)by.onclick=()=>{buyShoe(s);if(S.owned[s.id])showDetail(s,shop)};
 const e=$('#eqBtn');if(e)e.onclick=()=>{S.eq=s.id;save();applyStats();sfx('ui');ov.classList.add('hidden');renderAll()};
 const u=$('#upBtn');if(u)u.onclick=()=>{
  const need=UP_NEED[o.lv-1],cost=Math.round(UP_COST[o.lv-1]*(1+s.r*.5));
  if(o.extra<need)return toast('Il manque des doublons !');if(S.coins<cost)return toast('Pas assez de pièces !');
  S.coins-=cost;o.extra-=need;o.lv++;save();applyStats();sfx('open');toast(`${s.n} → Niveau ${o.lv} !`);renderAll();showDetail(s);
 };
}
function renderAll(){setCur();renderHome();renderShop();renderPass();renderShoes();renderMore();if(typeof renderFriends==='function')renderFriends()}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>{
 sfx('ui');document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('on',x===b));
 ['Home','Shop','Shoes','Pass','Friends','More'].forEach(n=>$('#tab'+n).classList.toggle('hidden',n!==b.dataset.tab));
 $('#menu').classList.toggle('solid',b.dataset.tab!=='Home');
 renderAll();
});
document.querySelectorAll('#modeRow button').forEach(b=>b.onclick=()=>{S.size=+b.dataset.sz;save();sfx('ui');renderHome()});
$('#playBtn').onclick=()=>{unlockAudio();ONLINE=null;myTeam=0;setSize(S.size);human=players[0];players.forEach(p=>setBot(p));applyStats();startMatch()};
$('#dailyBtn').onclick=()=>{
 unlockAudio();if(!dailyReady())return;
 const cont=Date.now()-S.daily<=48*3600e3;S.streak.n=cont?(S.streak.n||0)+1:1;S.streak.max=Math.max(S.streak.max||0,S.streak.n);
 const bonus=20*Math.min(S.streak.n,7);S.daily=Date.now();S.boxes.bronze++;S.coins+=50+bonus;S.gems+=2;
 let tx=`+1 Coffre Bronze, 🪙${50+bonus}, 💎2 · jour ${S.streak.n}`;if(S.streak.n%7===0){S.boxes.or++;tx+=' · 🎁 +1 Coffre Or !'}
 save();sfx('open');toast(tx);renderAll()};

/* ============ OUVERTURE DE COFFRE ============ */
function rollBox(type){
 const odds=BOXES[type].odds,tot=odds.reduce((a,b)=>a+b,0);let r=Math.random()*tot,ri=0;
 for(;ri<5;ri++){if(r<odds[ri])break;r-=odds[ri]}
 ri=Math.min(ri,4);if((S.pity||0)>=14)ri=Math.max(ri,3);while(odds[ri]<=0)ri=(ri+1)%5;
 if(ri>=3)S.pity=0;else S.pity=(S.pity||0)+1;
 const pool=SHOES.filter(s=>s.r===ri);return pool[(Math.random()*pool.length)|0];
}
let boxBusy=false;
function openBox(type){
 unlockAudio();
 if(S.boxes[type]<1||boxBusy)return;
 boxBusy=true;S.boxes[type]--;
 const shoe=rollBox(type),isNew=!S.owned[shoe.id];
 if(isNew)S.owned[shoe.id]={lv:1,extra:0};else S.owned[shoe.id].extra++;
 save();
 const ov=$('#boxov'),chest=$('#chest'),txt=$('#chestTxt'),rv=$('#reveal');
 ov.classList.remove('hidden');ov.style.setProperty('--glow','#3b2bb0');
 chest.textContent=BOXES[type].em;chest.className='';chest.style.display='';txt.style.display='';txt.textContent='Touche le coffre !';rv.classList.add('hidden');
 let tapped=false;
 chest.onclick=()=>{
  if(tapped)return;tapped=true;chest.className='shake';txt.textContent='…';
  ov.style.setProperty('--glow',RAR[shoe.r].c);
  let n=0;const iv=setInterval(()=>{sfx('shake');if(++n>=7){clearInterval(iv);reveal()}},130);
 };
 function reveal(){
  const fl=$('#flash');fl.className='';void fl.offsetWidth;fl.className='go';sfx('open');
  chest.style.display='none';txt.style.display='none';
  const col=RAR[shoe.r].c;
  rv.classList.remove('hidden');rv.style.cssText=`--rc:${col}`;
  rv.innerHTML=`<div class="card" style="border-color:${col};text-align:center"><div class="stroke" style="font-size:30px;color:${col}">${RAR[shoe.r].n.toUpperCase()}</div><img src="${thumb(shoe)}" alt=""><div style="font-size:26px">${shoe.n}</div><div class="stroke" style="color:${isNew?'#7dff5a':'#ffd23a'};font-size:22px;margin:4px 0">${isNew?'NOUVEAU !':'Doublon ! +1 exemplaire'}</div>${bars(shoe,S.owned[shoe.id].lv)}<div style="display:flex;gap:10px;justify-content:center;margin-top:10px;flex-wrap:wrap"><button class="btn green" id="contBtn">Continuer</button>${isNew?'<button class="btn blue" id="eqNow">Équiper</button>':''}</div></div>`;
  for(let i=0;i<16;i++){const c=document.createElement('div');const a=Math.random()*6.28,d=80+Math.random()*160;c.style.cssText=`position:fixed;left:50%;top:45%;width:10px;height:10px;background:${col};border-radius:2px;z-index:55;pointer-events:none;transition:all .9s cubic-bezier(.1,.8,.3,1);opacity:1`;ov.appendChild(c);requestAnimationFrame(()=>{c.style.transform=`translate(${Math.cos(a)*d}px,${Math.sin(a)*d}px) rotate(${Math.random()*720}deg)`;c.style.opacity='0'});setTimeout(()=>c.remove(),1000)}
  $('#contBtn').onclick=close;
  const q=$('#eqNow');if(q)q.onclick=()=>{S.eq=shoe.id;save();applyStats();close()};
 }
 function close(){ov.classList.add('hidden');boxBusy=false;renderAll()}
}

/* ============ DÉMARRAGE ============ */
players.forEach(p=>{p.g.visible=p===human});ballMesh.visible=false;
applyStats();setTheme(S.theme);setBallSkin(S.balls.eq);resetPositions();human.x=0;human.z=0;
resize();renderAll();
$('#loading').remove();
requestAnimationFrame(loop);
