"use strict";
/* ---------- Overzichtskaart ---------- */
const mini=$('mini'),mctx=mini.getContext('2d');let miniBase=null;
function buildMini(){
  const {W,H,ter,hp,obj}=world;mini.width=W;mini.height=H;
  const img=mctx.createImageData(W,H);
  for(let i=0;i<W*H;i++){const t=TCOL[ter[i]];let s=1+(i+W+1<W*H?(hp[i]-hp[i+W+1])*0.04:0);if(obj[i]===1)s*=0.75;
    img.data[i*4]=t[0]*s;img.data[i*4+1]=t[1]*s;img.data[i*4+2]=t[2]*s;img.data[i*4+3]=255}
  miniBase=document.createElement('canvas');miniBase.width=W;miniBase.height=H;const g=miniBase.getContext('2d');g.putImageData(img,0,0);
  for(const b of world.blds){if(b.dead)continue;const fp=BTYPES[b.type].fp;g.fillStyle=PCOL[b.p];g.fillRect(b.x+fp[0],b.y+fp[2],fp[1]-fp[0]+1,fp[3]-fp[2]+1)}
}
function screenToTile(mx,my){
  const {W,H,hp}=world;const wx=(mx-vw/2)/cam.z+cam.x,wy=(my-vh/2)/cam.z+cam.y;
  let y=wy/TH,x=0;
  for(let k=0;k<4;k++){x=(wx-H*TW/2+y*TW/2)/TW;const xi=Math.min(W-1,Math.max(0,Math.round(x))),yi=Math.min(H-1,Math.max(0,Math.round(y)));y=(wy+hp[yi*W+xi])/TH}
  x=(wx-H*TW/2+y*TW/2)/TW;return {x,y};
}
function drawMini(){
  if(!miniBase)return;const {W}=world;
  mctx.drawImage(miniBase,0,0);
  if(S.n){const {x,y,pl,ins}=S;let lp=-1;for(let i=0;i<S.n;i+=2){if(ins[i])continue;if(pl[i]!==lp){lp=pl[i];mctx.fillStyle=PCOL[lp]}mctx.fillRect(x[i]|0,y[i]|0,1,1)}}
  const cs=[[0,0],[vw,0],[vw,vh],[0,vh]].map(([a,b])=>screenToTile(a,b));
  mctx.strokeStyle='#fff';mctx.lineWidth=Math.max(1,W/180);mctx.beginPath();
  cs.forEach((c,k)=>k?mctx.lineTo(c.x,c.y):mctx.moveTo(c.x,c.y));mctx.closePath();mctx.stroke();
}
function centerOn(x,y){const {W,H,hp}=world;const xi=Math.min(W-1,Math.max(0,x|0)),yi=Math.min(H-1,Math.max(0,y|0));cam.x=SX(x,y);cam.y=y*TH-hp[yi*W+xi]}
function clampCam(){if(!world)return;const {W,H}=world;cam.x=Math.min(W*TW+H*TW/2+20,Math.max(-20,cam.x));cam.y=Math.min(H*TH+20,Math.max(-HP,cam.y))}
let miniDown=false;
const miniGo=ev=>{const r=mini.getBoundingClientRect();centerOn((ev.clientX-r.left)/r.width*world.W,(ev.clientY-r.top)/r.height*world.H);clampCam()};
mini.addEventListener('pointerdown',ev=>{if(!world)return;miniDown=true;mini.setPointerCapture(ev.pointerId);miniGo(ev)});
mini.addEventListener('pointermove',ev=>{if(miniDown)miniGo(ev)});
mini.addEventListener('pointerup',()=>miniDown=false);

/* ---------- Invoer ---------- */
let drag=null;
/* klik = indrukken en loslaten zonder (veel) te slepen; in bouwmodus plaatst of breekt dat af */
let downAt=null;
cv.addEventListener('contextmenu',ev=>{if(S.army||TOUCH.last){ev.preventDefault();return}if(BUILD.mode){ev.preventDefault();setBuildMode(null);refreshHover()}});
addEventListener('keydown',ev=>{if(ev.key==='Escape'&&BUILD.mode){setBuildMode(null);refreshHover()}});
cv.addEventListener('pointerup',ev=>{if(isTouch(ev))return;if(ev.button===0&&downAt&&Math.hypot(ev.clientX-downAt[0],ev.clientY-downAt[1])<5&&world&&world.own&&BUILD.mode){buildClick();refreshHover()}downAt=null});
/* duel-test (S.army): links slepen = selectierechthoek, links klikken = selecteren (Shift: hele niveau in beeld),
   rechts klikken = opdracht, rechts of middel slepen = schuiven (zie army.js) */
let downR=null;
const cvXY=ev=>{const r=cv.getBoundingClientRect();return [ev.clientX-r.left,ev.clientY-r.top]};
cv.addEventListener('pointerdown',ev=>{
  if(isTouch(ev)){touchDown(ev);return}
  TOUCH.last=false;
  if(S.army&&ev.button===0){const [x,y]=cvXY(ev);SEL.box=[x,y,x,y];cv.setPointerCapture(ev.pointerId);return}
  downR=ev.button===2?[ev.clientX,ev.clientY]:null;
  downAt=ev.button===0?[ev.clientX,ev.clientY]:null;drag={x:ev.clientX,y:ev.clientY};cv.setPointerCapture(ev.pointerId);cv.classList.add('drag')});
cv.addEventListener('pointerup',ev=>{
  if(isTouch(ev)){touchUp(ev);return}
  if(!S.army)return;const [x,y]=cvXY(ev);
  if(ev.button===0&&SEL.box){const b=SEL.box;SEL.box=null;if(Math.hypot(x-b[0],y-b[1])<5)armyClick(x,y,ev.shiftKey);else{b[2]=x;b[3]=y;selectRect(b)}}
  else if(ev.button===2&&downR&&Math.hypot(ev.clientX-downR[0],ev.clientY-downR[1])<5)armyOrder(x,y);
  downR=null});
/* muispositie onthouden, zodat tegelinfo en tooltip ook bijwerken als de muis stilstaat (zie refreshHover in loop.js) */
let mouseAt=null;
cv.addEventListener('pointermove',ev=>{
  if(!world)return;
  if(isTouch(ev)){touchMove(ev);return}
  const r=cv.getBoundingClientRect();
  if(SEL.box){SEL.box[2]=ev.clientX-r.left;SEL.box[3]=ev.clientY-r.top}
  if(drag){cam.x-=(ev.clientX-drag.x)/cam.z;cam.y-=(ev.clientY-drag.y)/cam.z;drag={x:ev.clientX,y:ev.clientY};clampCam()}
  mouseAt=[ev.clientX-r.left,ev.clientY-r.top];updateHover();
});
function refreshHover(){if(mouseAt&&world)updateHover()}
function updateHover(){
  const [mx,my]=mouseAt,t=screenToTile(mx,my),x=Math.floor(t.x),y=Math.floor(t.y);
  if(x>=0&&y>=0&&x<world.W&&y<world.H){
    hoverTile={x,y};const i=y*world.W+x,o=world.obj[i],b=world.bldAt[i];
    $('hover').textContent=`Tegel ${x}, ${y} · ${TNAME[world.ter[i]]} · hoogte ${world.hp[i].toFixed(0)}`+
      (b?` · ${BTYPES[world.blds[b-1].type].name} van speler ${world.blds[b-1].p+1} (${world.blds[b-1].occ?'bewoond':'leeg'})`:'')+
      (o===1?` · ${TREE_NAMES[world.tree[i]/3|0]}`:o===2?' · steenblok'+(world.res?` (nog ${world.res[i]} steen)`:''):o===3?' · '+['bessenstruik','hazelaar','varen','bloeiende struik'][bushKind(x,y)]:o===4?' · jonge boom':o===5?' · boomstronk':o>=6?` · akker: ${['graan','peulvruchten','groente'][world.crop[i]-1]} (${o===7?'rijp':'groeit'})`:'')+(world.ore[i]?` · erts: ${ORE[world.ore[i]]}`+(world.oreRes?` (nog ${world.oreRes[i]})`:''):'')+
      (world.stk&&world.stk[i]?' · stapel: '+stackLabel(world.stk[i]-1):'');
    /* tooltip bij een stapel of gebouw; een stapel steekt boven zijn tegel uit, dus ook de tegel eronder telt */
    const st=world.stk,i2=i+world.W,s=st?(st[i]||(y+1<world.H?st[i2]:0))-1:-1;
    if(world.own&&BUILD.mode){showTip(buildHover(x,y),mx,my);return}
    if(S.army){const u=pickUnit(mx,my);if(u>=0){showTip(unitLabel(u),mx,my);return}}
    showTip(s>=0?stackLabel(s):b?`${BTYPES[world.blds[b-1].type].name} · speler ${world.blds[b-1].p+1}`+(S.eco?wantLabel(b-1):''):'',mx,my);
  }else{hoverTile=null;showTip('')}
}
function showTip(t,x,y){const el=$('tip');if(!t){el.hidden=true;return}el.textContent=t;el.hidden=false;
  /* bij aanraken boven de vinger, anders rechtsonder de muis; niet buiten beeld */
  const up=TOUCH.last;el.style.left=Math.max(4,Math.min(vw-el.offsetWidth-4,up?x-el.offsetWidth/2:x+14))+'px';el.style.top=Math.max(4,up?y-el.offsetHeight-48:y+16)+'px'}
const endDrag=()=>{drag=null;cv.classList.remove('drag')};
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',ev=>{endDrag();if(isTouch(ev))touchUp(ev,true)});
cv.addEventListener('pointerleave',ev=>{if(isTouch(ev))return;hoverTile=null;mouseAt=null;showTip('')});

/* ---------- Aanraken (tablet, telefoon) ----------
   Eén vinger slepen = schuiven, twee vingers = knijpen om te zoomen (en samen schuiven), tikken = wat een klik doet:
   tegelinfo en tooltip tonen; in bouwmodus eerst tikken om te bekijken, nog eens op dezelfde plek om te plaatsen of af te breken.
   Duel-test: tik op een eigen eenheid = erbij selecteren (nog eens = eruit), tik met een selectie op een vijandelijke krachtpatser
   = uitdagen, ergens anders = daarheen lopen. Vasthouden en dan slepen = selectierechthoek; vasthouden op een eigen eenheid
   en loslaten = alle eigen eenheden van dat type in beeld (zoals Shift-klik). Getallen: CFG.touch. */
const TOUCH={pts:new Map(),start:null,moved:false,hold:false,timer:0,pinch:null,last:false,tipT:0,bld:null};
const isTouch=ev=>ev.pointerType==='touch'||ev.pointerType==='pen';
function touchDown(ev){
  TOUCH.last=true;cv.setPointerCapture(ev.pointerId);const p=cvXY(ev);TOUCH.pts.set(ev.pointerId,p);clearTimeout(TOUCH.timer);
  if(TOUCH.pts.size===1){TOUCH.start=p;TOUCH.moved=false;TOUCH.hold=false;TOUCH.pinch=null;
    if(S.army)TOUCH.timer=setTimeout(()=>{if(TOUCH.moved||TOUCH.pts.size!==1)return;TOUCH.hold=true;SEL.box=[p[0],p[1],p[0],p[1]];navigator.vibrate?.(15)},CFG.touch.hold)}
  else{TOUCH.moved=true;TOUCH.hold=false;SEL.box=null;TOUCH.pinch=pinchState()}
}
function pinchState(){const [a,b]=[...TOUCH.pts.values()];return {d:Math.hypot(a[0]-b[0],a[1]-b[1]),m:[(a[0]+b[0])/2,(a[1]+b[1])/2]}}
function touchMove(ev){
  const old=TOUCH.pts.get(ev.pointerId);if(!old)return;const p=cvXY(ev);TOUCH.pts.set(ev.pointerId,p);
  if(TOUCH.pts.size>=2){if(TOUCH.pts.size>2)return;const n=pinchState(),o=TOUCH.pinch||n;
    cam.x-=(n.m[0]-o.m[0])/cam.z;cam.y-=(n.m[1]-o.m[1])/cam.z;if(o.d>0&&n.d>0)zoomAt(n.d/o.d,n.m[0],n.m[1]);TOUCH.pinch=n;clampCam();return}
  if(!TOUCH.moved&&Math.hypot(p[0]-TOUCH.start[0],p[1]-TOUCH.start[1])>CFG.touch.slop)TOUCH.moved=true;
  if(TOUCH.hold&&SEL.box){SEL.box[2]=p[0];SEL.box[3]=p[1];return}
  if(TOUCH.moved){cam.x-=(p[0]-old[0])/cam.z;cam.y-=(p[1]-old[1])/cam.z;clampCam()}
}
function touchUp(ev,cancel){
  if(!TOUCH.pts.has(ev.pointerId))return;TOUCH.pts.delete(ev.pointerId);clearTimeout(TOUCH.timer);
  if(TOUCH.pts.size){TOUCH.pinch=TOUCH.pts.size===2?pinchState():null;return}   // vingers die overblijven schuiven verder
  const [x,y]=cvXY(ev),box=SEL.box;SEL.box=null;if(cancel||!world)return;
  if(TOUCH.hold){if(Math.hypot(box[2]-box[0],box[3]-box[1])>=CFG.touch.slop)selectRect(box);else armyClick(x,y,true);return}
  if(!TOUCH.moved)touchTap(x,y);
}
function touchTap(x,y){
  mouseAt=[x,y];updateHover();clearTimeout(TOUCH.tipT);TOUCH.tipT=setTimeout(()=>showTip(''),CFG.touch.tipMs);
  if(world.own&&BUILD.mode){const k=BUILD.mode+(BUILD.mode==='place'?BUILD.ax+','+BUILD.ay:BUILD.hover);
    if(TOUCH.bld===k){buildClick();refreshHover();TOUCH.bld=null}else TOUCH.bld=k;return}
  if(!S.army)return;
  const u=pickUnit(x,y,CFG.touch.pick);
  if(u>=0&&ownKP(u)){const k=ARMY.sel.indexOf(u);if(k>=0)ARMY.sel.splice(k,1);else if(ARMY.sel.length<CFG.army.maxSelect)ARMY.sel.push(u);return}
  armyOrder(x,y,CFG.touch.pick);
}
/* uitleg onderin: muis of aanraken */
const touchFirst=matchMedia('(pointer:coarse)').matches;
function zoomAt(f,mx,my){
  const wx=(mx-vw/2)/cam.z+cam.x,wy=(my-vh/2)/cam.z+cam.y;
  cam.z=Math.min(4,Math.max(0.3,cam.z*f));
  cam.x=wx-(mx-vw/2)/cam.z;cam.y=wy-(my-vh/2)/cam.z;clampCam();
}
cv.addEventListener('wheel',ev=>{ev.preventDefault();const r=cv.getBoundingClientRect();zoomAt(Math.exp(-ev.deltaY*0.0015),ev.clientX-r.left,ev.clientY-r.top)},{passive:false});
$('zin').onclick=()=>zoomAt(1.25,vw/2,vh/2);$('zout').onclick=()=>zoomAt(0.8,vw/2,vh/2);
const keys=new Set();
addEventListener('keydown',ev=>{if(ev.target.tagName==='INPUT'&&ev.target.type==='text')return;keys.add(ev.key.toLowerCase())});
addEventListener('keyup',ev=>keys.delete(ev.key.toLowerCase()));
function keyPan(dt){
  if(!keys.size)return;const s=dt*0.6/cam.z;
  if(keys.has('a')||keys.has('arrowleft'))cam.x-=s;if(keys.has('d')||keys.has('arrowright'))cam.x+=s;
  if(keys.has('w')||keys.has('arrowup'))cam.y-=s;if(keys.has('s')||keys.has('arrowdown'))cam.y+=s;clampCam();
}
