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
const SH=Object.fromEntries(SHOES.map(s=>[s.id,s]));
const BOXES={
 bronze:{n:'Coffre Bronze',cost:100,cur:'coins',odds:[70,24,5.5,.5,0],em:'📦'},
 or:{n:'Coffre Or',cost:300,cur:'coins',odds:[40,38,16,5.5,.5],em:'🎁'},
 mythique:{n:'Coffre Mythique',cost:60,cur:'gems',odds:[0,40,38,17,5],em:'💎'}};
const UP_NEED=[1,2,3,4], UP_COST=[100,200,400,800];
const statMul=lv=>1+.08*(lv-1);

/* ============ SAUVEGARDE ============ */
const KEY='kickbrawl3d_v1';
let S=null;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){}
const defaultSave=()=>({coins:300,gems:20,owned:{classic:{lv:1,extra:0}},eq:'classic',boxes:{bronze:1,or:0,mythique:0},daily:0,w:0,l:0,d:0,g:0,v:0});
if(!S||!S.owned) S=defaultSave();
let onSave=null;
function save(){S.v=Math.max(Date.now(),(S.v||0)+1);try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}if(onSave)onSave()}

/* ============ AUDIO ============ */
let AC=null;
function unlockAudio(){try{if(!AC)AC=new (window.AudioContext||window.webkitAudioContext)();if(AC.state==='suspended')AC.resume()}catch(e){}}
function tone(f,d,type,vol,slide,delay){try{if(!AC)return;const t=AC.currentTime+(delay||0),o=AC.createOscillator(),g=AC.createGain();o.type=type||'square';o.frequency.setValueAtTime(f,t);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(30,f*slide),t+d);g.gain.setValueAtTime(vol||.12,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d+.02)}catch(e){}}
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
}

/* ============ THREE : SCÈNE ============ */
const canvas=$('#c');
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();
scene.background=new THREE.Color(0x6fc8ff);scene.fog=new THREE.Fog(0x6fc8ff,70,150);
const cam=new THREE.PerspectiveCamera(42,1,.5,300);
scene.add(new THREE.HemisphereLight(0xffffff,0x6a8a5a,1.0));
const sun=new THREE.DirectionalLight(0xffffff,1.0);sun.position.set(-10,30,14);sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-32,right:32,top:24,bottom:-24,near:1,far:80});
scene.add(sun);scene.add(sun.target);

const FW=20,FH=12,GW=4,GH=3.1,BR=.55,PR=.62;
const mat=(c,o)=>new THREE.MeshLambertMaterial(Object.assign({color:c},o||{}));
function addBox(w,h,d,c,x,y,z,shadow){const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));m.position.set(x,y,z);if(shadow!==false){m.castShadow=true;m.receiveShadow=true}scene.add(m);return m}

// sol + terrain
const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),mat(0x4a5d8a));ground.rotation.x=-Math.PI/2;ground.position.y=-.03;ground.receiveShadow=true;scene.add(ground);
(function(){
 const W=1840,H=1040,k=40,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d');
 for(let i=0;i<23;i++){g.fillStyle=i%2?'#3da83d':'#49b949';g.fillRect(i*80,0,80,H)}
 const X=x=>(x+23)*k,Z=z=>(z+13)*k;
 g.strokeStyle='rgba(255,255,255,.9)';g.lineWidth=7;
 g.strokeRect(X(-FW),Z(-FH),FW*2*k,FH*2*k);
 g.beginPath();g.moveTo(X(0),Z(-FH));g.lineTo(X(0),Z(FH));g.stroke();
 g.beginPath();g.arc(X(0),Z(0),3.5*k,0,7);g.stroke();
 g.fillStyle='#fff';g.beginPath();g.arc(X(0),Z(0),.3*k,0,7);g.fill();
 [-1,1].forEach(s=>{g.strokeRect(s<0?X(-FW):X(FW-5),Z(-6),5*k,12*k);g.strokeRect(s<0?X(-FW):X(FW-2.5),Z(-3.5),2.5*k,7*k)});
 g.fillStyle='rgba(60,90,200,.35)';g.fillRect(X(-23),Z(-4),3*k,8*k);g.fillStyle='rgba(220,50,50,.35)';g.fillRect(X(20),Z(-4),3*k,8*k);
 const t=new THREE.CanvasTexture(c);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());
 const f=new THREE.Mesh(new THREE.PlaneGeometry(46,26),new THREE.MeshLambertMaterial({map:t}));f.rotation.x=-Math.PI/2;f.receiveShadow=true;scene.add(f);
})();
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
function mkShoe(main,acc,glow){
 const g=new THREE.Group();
 const mm=new THREE.MeshStandardMaterial({color:main,roughness:.45,metalness:.1,emissive:glow?main:0,emissiveIntensity:glow?.28:0});
 const am=new THREE.MeshStandardMaterial({color:acc,roughness:.55,emissive:glow?acc:0,emissiveIntensity:glow?.22:0});
 const sole=new THREE.Mesh(G.sole,am);sole.position.set(.04,.07,0);
 const toe=new THREE.Mesh(G.toe,mm);toe.scale.set(1.5,.8,.95);toe.position.set(.12,.32,0);
 const heel=new THREE.Mesh(G.heel,mm);heel.scale.set(1,1.15,.95);heel.position.set(-.3,.4,0);
 g.add(sole,toe,heel);
 [-1,1].forEach(s=>{const st=new THREE.Mesh(G.stripe,am);st.position.set(-.02,.36,s*.26);st.rotation.z=.25;g.add(st)});
 [[-.4,-.17],[-.4,.17],[.4,-.17],[.4,.17]].forEach(([x,z])=>{const st=new THREE.Mesh(G.stud,am);st.position.set(x,-.03,z);g.add(st)});
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
  const sh=mkShoe(s.main,s.acc,s.r>=3);sh.rotation.y=-.65;sh.scale.setScalar(1.3);sc.add(sh);
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
 applyShoe(p,SH.classic);
 scene.add(g);return p;
}
function applyShoe(p,s){
 if(p.sL){p.g.remove(p.sL);p.g.remove(p.sR)}
 const mk=()=>{const w=new THREE.Group();const sh=mkShoe(s.main,s.acc,s.r>=3);sh.scale.setScalar(.5);w.add(sh);p.g.add(w);return w};
 p.sL=mk();p.sR=mk();p.shoe=s;
}
for(let t=0;t<2;t++)for(let i=0;i<3;i++)players.push(mkPlayer(t,i));
human=players[0];
function setStats(p,id,lv){const s=SH[id]||SH.classic,m=statMul(lv||1);p.spd=8.2+s.st[0]*m*.22;p.pow=16+s.st[1]*m*1.3;p.ctl=s.st[2]*m;applyShoe(p,s)}
function setBot(p){p.remote=false;p.uid=null;p.rin=null;p.spd=8.5;p.pow=20;p.ctl=4;if(p.shoe!==SH.classic)applyShoe(p,SH.classic);setName(p,'')}
function applyStats(){setStats(human,S.eq,S.owned[S.eq].lv)}
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
const ballMesh=(function(){
 const c=document.createElement('canvas');c.width=256;c.height=128;const g=c.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,256,128);g.fillStyle='#222';
 for(let i=0;i<8;i++)for(let j=0;j<3;j++){g.beginPath();const x=i*32+16+(j%2)*16,y=j*40+22;for(let k=0;k<5;k++){const a=k*Math.PI*2/5-Math.PI/2;g.lineTo(x+Math.cos(a)*11,y+Math.sin(a)*11)}g.fill()}
 const m=new THREE.Mesh(new THREE.SphereGeometry(BR,18,14),new THREE.MeshLambertMaterial({map:new THREE.CanvasTexture(c)}));
 m.castShadow=true;outline(m,1.1);scene.add(m);return m})();

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

function resetPositions(){
 REC.length=0;
 players.forEach(p=>{const s=p.team?1:-1;p.x=s*(p.idx===0?5:10);p.z=[0,-5.5,5.5][p.idx];p.vx=p.vz=0;p.hd=p.team?Math.PI:0;p.stun=0;p.dash=0;p.kick=0;p.celeb=0;p.thinkT=0;p.ax=p.az=0});
 Object.assign(ball,{x:0,y:BR,z:0,vx:0,vy:0,vz:0,inNet:false});
}

function tryDash(p){
 if(p.dashCd>0||p.stun>0)return;p.dash=.45;p.dashCd=2.6;
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
  ball.vx=dx*p.pow+p.vx*.25;ball.vz=dz*p.pow+p.vz*.25;ball.vy=3+p.pow*.1;ball.y=Math.max(ball.y,BR+.1);
  sfx('kick');shake=Math.max(shake,.25);evt('k',ball.x,ball.z);
  for(let i=0;i<6;i++)emit(ball.x,.5,ball.z,(Math.random()-.5)*4,2+Math.random()*3,(Math.random()-.5)*4,0xffffff,.4,.25,10);
 }
}

/* IA */
function ai(p,dt){
 const dir=p.team?-1:1,ownGX=-dir*FW,enGX=dir*FW;
 const mates=players.filter(q=>q.team===p.team);
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
 const sp=p.spd*(p.dash>0?1.75:1);
 const dvx=ax*sp-p.vx,dvz=az*sp-p.vz,dl=Math.hypot(dvx,dvz);
 if(dl>0){const st=Math.min(dl,(p.dash>0?100:60)*dt);p.vx+=dvx/dl*st;p.vz+=dvz/dl*st}
 p.x=clamp(p.x+p.vx*dt,-FW+.6,FW-.6);p.z=clamp(p.z+p.vz*dt,-FH+.6,FH-.6);
 if(tv>.15)p.hd+=angDiff(p.hd,Math.atan2(az,ax))*Math.min(1,14*dt);
}
/* simulation */
function sim(dt,ctl){
 for(const p of players){
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
  const a=players[i],b=players[j];let dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
  if(d<PR*2&&d>.001){
   const nx=dx/d,nz=dz/d,ov=(PR*2-d)/2;a.x-=nx*ov;a.z-=nz*ov;b.x+=nx*ov;b.z+=nz*ov;
   if(a.team!==b.team){
    const hit=(x,y)=>{if(x.dash>0&&y.stun<=0&&y.dash<=0){y.stun=.8;const k=x===a?1:-1;y.vx+=nx*k*14;y.vz+=nz*k*14;sfx('hit');shake=Math.max(shake,.4);evt('h',y.x,y.z);for(let q=0;q<8;q++)emit(y.x,1.2,y.z,(Math.random()-.5)*8,2+Math.random()*4,(Math.random()-.5)*8,0xffe14d,.5,.3,12)}};
    hit(a,b);hit(b,a);
   }
  }
 }
 // balle
 ball.vy-=26*dt;ball.y+=ball.vy*dt;
 if(ball.y<BR){ball.y=BR;ball.vy=ball.vy<-2.5?-ball.vy*.5:0}
 if(ball.y>9){ball.y=9;ball.vy=-Math.abs(ball.vy)*.3}
 const grounded=ball.y<BR+.05,damp=Math.exp(-(grounded?.9:.12)*dt-(Math.abs(ball.x)>FW?2.5*dt:0));
 ball.vx*=damp;ball.vz*=damp;
 let sp=Math.hypot(ball.vx,ball.vz);if(sp>34){ball.vx*=34/sp;ball.vz*=34/sp}
 ball.x+=ball.vx*dt;ball.z+=ball.vz*dt;
 // joueurs <-> balle
 for(const p of players){
  const dx=ball.x-p.x,dz=ball.z-p.z,d=Math.hypot(dx,dz),R=PR+BR;
  if(d<R&&ball.y<1.7&&d>.001){
   const nx=dx/d,nz=dz/d;ball.x=p.x+nx*(R+.01);ball.z=p.z+nz*(R+.01);
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

function startMatch(){
 unlockAudio();
 $('#menu').classList.add('hidden');$('#hud').classList.remove('hidden');$('#lobby').classList.add('hidden');$('#endov').classList.add('hidden');
 players.forEach(p=>{p.g.visible=true});ballMesh.visible=true;
 score=[0,0];timeLeft=120;ot=false;otT=0;inMatch=true;resetPositions();updHUD();
 state='countdown';cdT=3.2;stateT=0;paused=false;sfx('whistle');lastCd=4;
 inp.x=inp.z=0;inp.shoot=inp.dash=false;checkRot();
}
let lastCd=4;
function onGoalFX(team){
 showBanner(team===myTeam?'BUT !!':'BUT ADVERSE','long',team===myTeam?'#6fc8ff':'#ff7a7a');
 sfx('goal');confetti(team);shake=1;
 rippleNet(team===0?1:-1,ball.x,ball.y,ball.z,Math.max(8,Math.hypot(ball.vx,ball.vz)));
 players.forEach(p=>{p.celeb=p.team===team?1:0});
 startRagdoll(team);
}
function onGoal(team){
 score[team]++;state='goal';stateT=0;updHUD();RP.done=false;
 onGoalFX(team);evt('g',team,0);
}
function endMatch(){state='end';stateT=0;inMatch=false;showResult()}
function showResult(){
 inMatch=false;
 const my=score[myTeam],th=score[1-myTeam];
 const w=my>th,d=my===th;
 let coins=0,gems=0,box=null;
 if(w){coins=60+my*10;gems=3;S.w++;const r=Math.random();box=r<.08?'or':r<.75?'bronze':null}
 else if(d){coins=30;S.d++;box=Math.random()<.25?'bronze':null}
 else{coins=15+my*5;S.l++;box=Math.random()<.15?'bronze':null}
 S.g+=my;S.coins+=coins;S.gems+=gems;if(box)S.boxes[box]++;save();
 sfx(w?'win':'lose');
 const t=w?'VICTOIRE !':d?'ÉGALITÉ':'DÉFAITE';const col=w?'#ffd23a':d?'#fff':'#ff7a7a';
 const e=$('#endov');e.classList.remove('hidden');
 const on=!!ONLINE;
 e.innerHTML=`<div class="card modal"><h3 class="stroke" style="font-size:50px;color:${col}">${t}</h3>
 <div class="res stroke" style="font-size:44px"><span style="color:#6fc8ff">${score[0]}</span> - <span style="color:#ff7a7a">${score[1]}</span></div>
 <div class="res"><div>🪙 +${coins}</div>${gems?`<div>💎 +${gems}</div>`:''}${box?`<div>${BOXES[box].em} ${BOXES[box].n}</div>`:''}</div>
 <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">${on?'<button class="btn green" id="againBtn">Retour au salon</button>':'<button class="btn green" id="againBtn">Rejouer</button><button class="btn blue" id="menuBtn">Menu</button>'}</div></div>`;
 $('#againBtn').onclick=()=>{e.classList.add('hidden');if(on)onlineBackToLobby();else startMatch()};
 const mb=$('#menuBtn');if(mb)mb.onclick=()=>{e.classList.add('hidden');toMenu()};
 renderAll();
}
function toMenu(){
 state='menu';inMatch=false;paused=false;$('#hud').classList.add('hidden');$('#pauseov').classList.add('hidden');$('#rot').classList.add('hidden');
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
  sim(dt,true);
  if(!ot){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;if(score[0]!==score[1]){endMatch()}else{ot=true;otT=30;showBanner('BUT EN OR !','long','#ffd23a')}}}
  else{otT-=dt;if(otT<=0)endMatch()}
  updHUD();
 }else if(state==='goal'){
  sim(dt,false);inp.shoot=inp.dash=false;
  if(stateT>GOAL_T){
   if(ot||(timeLeft<=0&&score[0]!==score[1]))endMatch();
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
 shake=Math.max(0,shake-dt*2.5);
 const sx=(Math.random()-.5)*shake*.7,sy=(Math.random()-.5)*shake*.5;
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

let last=performance.now();
function loop(t){
 requestAnimationFrame(loop);
 let dt=Math.min(.05,(t-last)/1000);last=t;
 pollPad();
 const rot=!$('#rot').classList.contains('hidden');
 const freeze=paused||(rot&&!ONLINE);
 if(!freeze){
  if(isClient())onlineClientUpdate(dt);else update(dt);
  updNets(dt);updParts(dt);
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
 if(!inMatch||jid!==null||e.clientX>innerWidth*.6)return;
 jid=e.pointerId;jox=e.clientX;joy0=e.clientY;touchEl.setPointerCapture(jid);
 joy.style.display='block';joy.style.left=jox+'px';joy.style.top=joy0+'px';knob.style.transform='';joyHint.style.display='none';
});
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
 let gp=null;for(const g of list){if(g&&g.connected){gp=g;break}}
 if(!gp){if(padOn){padOn=false;$('#joyHint').style.display=''}return}
 if(!padOn){padOn=true;$('#joyHint').style.display='none';toast('🎮 Manette connectée')}
 let x=gp.axes[0]||0,z=gp.axes[1]||0;
 if(padBtn(gp,14))x-=1;if(padBtn(gp,15))x+=1;if(padBtn(gp,12))z-=1;if(padBtn(gp,13))z+=1;
 let m=Math.hypot(x,z);if(m<.2){x=z=0;m=0}else if(m>1){x/=m;z/=m}
 if(m>0||padMoved){if(jid===null){inp.x=x;inp.z=z}padMoved=m>0}
 const down={shoot:padBtn(gp,0)||padBtn(gp,5)||padBtn(gp,7),dash:padBtn(gp,2)||padBtn(gp,1)||padBtn(gp,3)||padBtn(gp,4)||padBtn(gp,6),menu:padBtn(gp,9)||padBtn(gp,8)};
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
function dailyReady(){return Date.now()-S.daily>20*3600e3}
function renderHome(){
 const s=SH[S.eq],lv=S.owned[s.id].lv;
 $('#homeShoe').innerHTML=`<div style="font-size:14px;opacity:.8">TA CHAUSSURE</div><img src="${thumb(s)}" alt=""><div style="font-size:20px">${s.n}</div><div style="margin:4px 0">${rarChip(s.r)} <span class="rar" style="background:#14122e">Niv. ${lv}</span></div>${bars(s,lv)}`;
 const db=$('#dailyBtn');db.disabled=!dailyReady();db.textContent=dailyReady()?'🎁 Cadeau du jour':'🎁 Revenez plus tard';
 const row=$('#openRow');row.innerHTML='';
 Object.keys(BOXES).forEach(k=>{if(S.boxes[k]>0){const b=document.createElement('button');b.className='btn small green';b.textContent=`${BOXES[k].em} Ouvrir ${BOXES[k].n.replace('Coffre ','')} ×${S.boxes[k]}`;b.onclick=()=>openBox(k);row.appendChild(b)}});
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
}
function renderShoes(){
 const t=$('#tabShoes');
 const n=SHOES.filter(s=>S.owned[s.id]).length;
 t.innerHTML=`<h3 class="stroke" style="text-align:center">COLLECTION ${n}/${SHOES.length}</h3><div class="grid"></div>`;
 const grid=t.querySelector('.grid');
 SHOES.slice().sort((a,b)=>b.r-a.r).forEach(s=>{
  const o=S.owned[s.id],d=document.createElement('div');
  d.className='tile'+(o?'':' locked');d.style.setProperty('--rc',RAR[s.r].c);
  d.innerHTML=`<img src="${thumb(s)}" alt=""><div>${o?s.n:'???'}</div><div style="color:${RAR[s.r].c};font-size:12px">${RAR[s.r].n}</div>${o?`<span class="lv">Niv.${o.lv}</span>`:''}${S.eq===s.id?'<span class="eq">✅</span>':''}${o&&o.extra?`<span class="cp">+${o.extra}</span>`:''}`;
  d.onclick=()=>{sfx('ui');showDetail(s)};
  grid.appendChild(d);
 });
}
function showDetail(s){
 const o=S.owned[s.id],ov=$('#detail');ov.classList.remove('hidden');
 let act='';
 if(o){
  const eq=S.eq===s.id,maxed=o.lv>=5;
  const need=UP_NEED[o.lv-1],cost=Math.round(UP_COST[o.lv-1]*(1+s.r*.5));
  act=`<div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px">
   <button class="btn ${eq?'grey':'green'}" id="eqBtn" ${eq?'disabled':''}>${eq?'Équipée ✅':'Équiper'}</button>
   ${maxed?'<button class="btn grey" disabled>Niveau max</button>':`<button class="btn ${o.extra>=need&&S.coins>=cost?'blue':'grey'}" id="upBtn">⬆ Niv.${o.lv+1} · 🪙${cost} + ${need} doublon${need>1?'s':''} (${o.extra}/${need})</button>`}</div>`;
 }
 ov.innerHTML=`<div class="card modal" style="border-color:${RAR[s.r].c}"><img src="${thumb(s)}" style="${o?'':'filter:brightness(0) opacity(.5)'}"><div style="font-size:26px">${o?s.n:'Chaussure inconnue'}</div>${rarChip(s.r)} ${o?`<span class="rar" style="background:#14122e">Niv. ${o.lv}</span>`:''}<div style="margin:8px 0">${bars(s,o?o.lv:1)}</div>${o?'':'<div style="opacity:.8;margin:6px 0">Trouve-la dans les coffres !</div>'}${act}<div style="margin-top:12px"><button class="btn small grey" id="closeD">Fermer</button></div></div>`;
 $('#closeD').onclick=()=>ov.classList.add('hidden');
 const e=$('#eqBtn');if(e)e.onclick=()=>{S.eq=s.id;save();applyStats();sfx('ui');ov.classList.add('hidden');renderAll()};
 const u=$('#upBtn');if(u)u.onclick=()=>{
  const need=UP_NEED[o.lv-1],cost=Math.round(UP_COST[o.lv-1]*(1+s.r*.5));
  if(o.extra<need)return toast('Il manque des doublons !');if(S.coins<cost)return toast('Pas assez de pièces !');
  S.coins-=cost;o.extra-=need;o.lv++;save();applyStats();sfx('open');toast(`${s.n} → Niveau ${o.lv} !`);renderAll();showDetail(s);
 };
}
function renderAll(){setCur();renderHome();renderShop();renderShoes();if(typeof renderFriends==='function')renderFriends()}
document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>{
 sfx('ui');document.querySelectorAll('.nav button').forEach(x=>x.classList.toggle('on',x===b));
 ['Home','Shop','Shoes','Friends'].forEach(n=>$('#tab'+n).classList.toggle('hidden',n!==b.dataset.tab));
 $('#menu').classList.toggle('solid',b.dataset.tab!=='Home');
 renderAll();
});
$('#playBtn').onclick=()=>{unlockAudio();ONLINE=null;myTeam=0;human=players[0];players.forEach(p=>setBot(p));applyStats();startMatch()};
$('#dailyBtn').onclick=()=>{unlockAudio();if(!dailyReady())return;S.daily=Date.now();S.boxes.bronze++;S.coins+=50;S.gems+=2;save();sfx('open');toast('+1 Coffre Bronze, 🪙50, 💎2 !');renderAll()};

/* ============ OUVERTURE DE COFFRE ============ */
function rollBox(type){
 const odds=BOXES[type].odds,tot=odds.reduce((a,b)=>a+b,0);let r=Math.random()*tot,ri=0;
 for(;ri<5;ri++){if(r<odds[ri])break;r-=odds[ri]}
 ri=Math.min(ri,4);while(odds[ri]<=0)ri=(ri+1)%5;
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
applyStats();resetPositions();human.x=0;human.z=0;
resize();renderAll();
$('#loading').remove();
requestAnimationFrame(loop);
