"use strict";
/* ---------- Overzichtskaart ---------- */
const mini=$('mini'),mctx=mini.getContext('2d');let miniBase=null;
function buildMini(){
  const {W,H,ter,hp,obj}=world;mini.width=W;mini.height=H;
  const img=mctx.createImageData(W,H);
  for(let i=0;i<W*H;i++){const t=TCOL[ter[i]];let s=1+(i+W+1<W*H?(hp[i]-hp[i+W+1])*0.04:0);if(obj[i]===1)s*=0.75;
    img.data[i*4]=t[0]*s;img.data[i*4+1]=t[1]*s;img.data[i*4+2]=t[2]*s;img.data[i*4+3]=255}
  miniBase=document.createElement('canvas');miniBase.width=W;miniBase.height=H;const g=miniBase.getContext('2d');g.putImageData(img,0,0);
  for(const b of world.blds){const fp=BTYPES[b.type].fp;g.fillStyle=PCOL[b.p];g.fillRect(b.x+fp[0],b.y+fp[2],fp[1]-fp[0]+1,fp[3]-fp[2]+1)}
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
cv.addEventListener('pointerdown',ev=>{drag={x:ev.clientX,y:ev.clientY};cv.setPointerCapture(ev.pointerId);cv.classList.add('drag')});
cv.addEventListener('pointermove',ev=>{
  if(!world)return;
  const r=cv.getBoundingClientRect();
  if(drag){cam.x-=(ev.clientX-drag.x)/cam.z;cam.y-=(ev.clientY-drag.y)/cam.z;drag={x:ev.clientX,y:ev.clientY};clampCam()}
  const t=screenToTile(ev.clientX-r.left,ev.clientY-r.top),x=Math.floor(t.x),y=Math.floor(t.y);
  if(x>=0&&y>=0&&x<world.W&&y<world.H){
    hoverTile={x,y};const i=y*world.W+x,o=world.obj[i],b=world.bldAt[i];
    $('hover').textContent=`Tegel ${x}, ${y} · ${TNAME[world.ter[i]]} · hoogte ${world.hp[i].toFixed(0)}`+
      (b?` · ${BTYPES[world.blds[b-1].type].name} van speler ${world.blds[b-1].p+1} (${world.blds[b-1].occ?'bewoond':'leeg'})`:'')+
      (o===1?` · ${TREE_NAMES[world.tree[i]/3|0]}`:o===2?' · steen':o===3?' · struik':o===4?' · jonge boom':o===5?' · boomstronk':'')+(world.ore[i]?` · erts: ${ORE[world.ore[i]]}`:'')+
      (world.stk&&world.stk[i]?' · stapel: '+stackLabel(world.stk[i]-1):'');
    /* tooltip bij een stapel of gebouw; een stapel steekt boven zijn tegel uit, dus ook de tegel eronder telt */
    const st=world.stk,i2=i+world.W,s=st?(st[i]||(y+1<world.H?st[i2]:0))-1:-1;
    showTip(s>=0?stackLabel(s):b?`${BTYPES[world.blds[b-1].type].name} · speler ${world.blds[b-1].p+1}`+(S.eco?wantLabel(b-1):''):'',ev.clientX-r.left,ev.clientY-r.top);
  }else{hoverTile=null;showTip('')}
});
function showTip(t,x,y){const el=$('tip');if(!t){el.hidden=true;return}el.textContent=t;el.hidden=false;el.style.left=(x+14)+'px';el.style.top=(y+16)+'px'}
const endDrag=()=>{drag=null;cv.classList.remove('drag')};
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);
cv.addEventListener('pointerleave',()=>{hoverTile=null;showTip('')});
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
