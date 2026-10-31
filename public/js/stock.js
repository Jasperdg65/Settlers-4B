"use strict";
/* ---------- Voorraad: alle goederen liggen als stapels op de grond ----------
   Ook de voorraad van burcht en pakhuis: die ligt op hun stapelplekken. Eén stapel per tegel,
   world.stk[tegel] = stapelindex+1. Stapels in compacte arrays (G), max CFG.stackMax per stapel. */
const G={n:0};let stockVer=0;
function initGoods(){
  const {W,H}=world;world.stk=new Int32Array(W*H);
  const cap=1024;G.n=0;G.free=[];G.tile=new Int32Array(cap);G.good=new Uint8Array(cap);G.cnt=new Uint8Array(cap);G.pl=new Uint8Array(cap);G.bld=new Int16Array(cap);
  for(const b of world.blds)b.slots=null;
  const f=CFG.startFactor[$('stock').value]||1;
  world.blds.forEach((b,bi)=>{if(b.type==='burcht')for(const k in CFG.startStock)addGoods(bi,GI[k],Math.round(CFG.startStock[k]*f))});
  stockVer++;
}
function newStack(tile,gd,pl,bi){
  let s=G.free.length?G.free.pop():G.n++;
  if(s>=G.tile.length)for(const k of ['tile','good','cnt','pl','bld']){const a=new G[k].constructor(G[k].length*2);a.set(G[k]);G[k]=a}
  G.tile[s]=tile;G.good[s]=gd;G.cnt[s]=0;G.pl[s]=pl;G.bld[s]=bi;world.stk[tile]=s+1;return s;
}
/* stapelplekken: vrije, beloopbare tegels rond het gebouw, dichtst bij de deur eerst; ingang en paden blijven vrij */
function bldSlots(bi){
  const b=world.blds[bi];if(b.slots)return b.slots;
  const {W,H,walk,bldAt,obj,path}=world,fp=BTYPES[b.type].fp;
  const want=CFG.slots[b.type]||CFG.slots.anders,R=CFG.slotRadius[b.type]||CFG.slotRadius.anders,dx=b.x+0.5,dy=b.y+1.5,c=[];
  for(let y=b.y+fp[2]-R;y<=b.y+fp[3]+R;y++)for(let x=b.x+fp[0]-R;x<=b.x+fp[1]+R;x++){
    if(x<1||y<1||x>=W-1||y>=H-1)continue;const i=y*W+x;
    if(!walk[i]||bldAt[i]||obj[i]||path[i])continue;
    if(Math.abs(x-b.x)<=1&&y>=b.y+1&&y<=b.y+2)continue;
    c.push([Math.hypot(x+0.5-dx,y+0.5-dy),i]);
  }
  c.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  return b.slots=c.slice(0,want).map(v=>v[1]);
}
/* legt n stuks bij gebouw bi neer: eerst bij onvolle stapels van hetzelfde goed, dan op lege plekken; geeft terug wat niet paste */
function addGoods(bi,gd,n){
  const b=world.blds[bi],M=CFG.stackMax,st=world.stk,sl=bldSlots(bi);
  for(const i of sl){if(n<=0)break;const s=st[i]-1;if(s>=0&&G.bld[s]===bi&&G.good[s]===gd&&G.cnt[s]<M){const a=Math.min(M-G.cnt[s],n);G.cnt[s]+=a;n-=a}}
  for(const i of sl){if(n<=0)break;if(st[i])continue;const s=newStack(i,gd,b.p,bi),a=Math.min(M,n);G.cnt[s]=a;n-=a}
  stockVer++;return n;
}
function stockTotals(p){const t=new Uint32Array(GOODS.length);for(let s=0;s<G.n;s++)if(G.cnt[s]&&G.pl[s]===p)t[G.good[s]]+=G.cnt[s];return t}

/* ---------- Paneel 'Voorraad' ---------- */
let stockShown=-1,stockCells=null;
function buildStockPanel(){
  const sel=$('stockPl'),P=world.starts.length;sel.innerHTML='';
  for(let p=0;p<P;p++){const o=document.createElement('option');o.value=p;o.textContent='Speler '+(p+1);sel.appendChild(o)}
  const box=$('stockList');box.innerHTML='';stockCells=[];let gr='';
  GOODS.forEach((d,gd)=>{
    if(d.gr!==gr){gr=d.gr;const h=document.createElement('h3');h.textContent=gr;box.appendChild(h)}
    const row=document.createElement('div');row.className='srow';
    row.appendChild(thumb(goodSprite(gd,1),24,18,2.6));
    const n=document.createElement('span');n.textContent=d.n;row.appendChild(n);
    const v=document.createElement('span');v.className='sval';row.appendChild(v);
    box.appendChild(row);stockCells.push([row,v]);
  });
  stockShown=-1;refreshStock();
}
function refreshStock(){
  if(!stockCells||!world.stk)return;const p=+$('stockPl').value||0,key=stockVer*16+p;if(key===stockShown)return;stockShown=key;
  const t=stockTotals(p);$('stockPl').style.borderColor=PCOL[p];
  stockCells.forEach(([row,v],gd)=>{v.textContent=t[gd].toLocaleString('nl-NL');row.classList.toggle('zero',!t[gd])});
}
$('stockPl').onchange=refreshStock;
