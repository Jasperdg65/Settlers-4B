"use strict";
/* ---------- Voorraad: alle goederen liggen als stapels op de grond ----------
   Ook de voorraad van burcht en pakhuis: die ligt op hun stapelplekken. Eén stapel per tegel,
   world.stk[tegel] = stapelindex+1. Stapels in compacte arrays (G), max CFG.stackMax per stapel.
   G.res = stuks die een drager al komt halen; b.has[goed] = wat bij gebouw b op de grond ligt. */
const G={n:0};let stockVer=0;
function initGoods(){
  const {W,H}=world;world.stk=new Int32Array(W*H);world.slotAt=new Int16Array(W*H);
  const cap=1024;G.n=0;G.free=[];G.tile=new Int32Array(cap);G.good=new Uint8Array(cap);G.cnt=new Uint8Array(cap);G.pl=new Uint8Array(cap);G.bld=new Int16Array(cap);G.res=new Uint8Array(cap);
  for(const b of world.blds){b.slots=null;b.has=new Uint16Array(GOODS.length)}
  /* eerst de werkgebouwen hun stapelplekken laten kiezen, dan pas de opslag (burcht en pakhuis hebben een grote straal) */
  world.blds.forEach((b,bi)=>{if(!b.dead&&b.type!=='burcht'&&b.type!=='pakhuis')bldSlots(bi)});
  const f=CFG.startFactor[$('stock').value]||1;
  world.blds.forEach((b,bi)=>{if(b.type==='burcht')for(const k in CFG.startStock)addGoods(bi,GI[k],Math.round(CFG.startStock[k]*f))});
  stockVer++;
}
function newStack(tile,gd,pl,bi){
  let s=G.free.length?G.free.pop():G.n++;
  if(s>=G.tile.length)for(const k of ['tile','good','cnt','pl','bld','res']){const a=new G[k].constructor(G[k].length*2);a.set(G[k]);G[k]=a}
  G.tile[s]=tile;G.good[s]=gd;G.cnt[s]=0;G.res[s]=0;G.pl[s]=pl;G.bld[s]=bi;world.stk[tile]=s+1;return s;
}
/* stapelplekken: vrije, beloopbare tegels vóór en naast het gebouw (rijen erachter vallen weg achter het plaatje),
   dichtst bij de deur eerst; ingang en paden blijven vrij. Elke plek hoort bij één gebouw (world.slotAt = gebouw + 1);
   een werkgebouw mag een lege plek van een opslag overnemen, zodat het nooit zonder plekken komt te zitten. */
function bldSlots(bi){
  const b=world.blds[bi];if(b.slots)return b.slots;
  const {W,H,walk,bldAt,obj,path}=world,fp=BTYPES[b.type].fp;
  const sa=world.slotAt||(world.slotAt=new Int16Array(W*H)),bl=world.blds,mine=b.type!=='burcht'&&b.type!=='pakhuis';
  const taken=i=>{const o=sa[i]-1;return o>=0&&o!==bi&&!(mine&&!bl[o].dead&&(bl[o].type==='burcht'||bl[o].type==='pakhuis')&&!(world.stk&&world.stk[i]))};
  const want=CFG.slots[b.type]||CFG.slots.anders,R=CFG.slotRadius[b.type]||CFG.slotRadius.anders,dx=b.x+0.5,dy=b.y+1.5,c=[];
  for(let y=b.y+1;y<=b.y+fp[3]+R;y++)for(let x=b.x+fp[0]-R;x<=b.x+fp[1]+R;x++){
    if(x<1||y<1||x>=W-1||y>=H-1)continue;const i=y*W+x;
    if(!walk[i]||bldAt[i]||obj[i]||path[i]||taken(i))continue;   // ook geen stapelplek van een ander gebouw
    if(Math.abs(x-b.x)<=1&&y>=b.y+1&&y<=b.y+2)continue;
    c.push([Math.hypot(x+0.5-dx,y+0.5-dy),i]);
  }
  c.sort((p,q)=>p[0]-q[0]||p[1]-q[1]);
  b.slots=c.slice(0,want).map(v=>v[1]);
  for(const i of b.slots){const o=sa[i]-1;if(o>=0&&o!==bi&&bl[o].slots)bl[o].slots=bl[o].slots.filter(t=>t!==i);sa[i]=bi+1}
  return b.slots;
}
/* legt n stuks bij gebouw bi neer: eerst bij onvolle stapels van hetzelfde goed, dan op lege plekken; geeft terug wat niet paste */
function addGoods(bi,gd,n){
  const b=world.blds[bi],M=CFG.stackMax,st=world.stk,sl=bldSlots(bi);
  for(const i of sl){if(n<=0)break;const s=st[i]-1;if(s>=0&&G.bld[s]===bi&&G.good[s]===gd&&G.cnt[s]<M){const a=Math.min(M-G.cnt[s],n);G.cnt[s]+=a;b.has[gd]+=a;n-=a}}
  for(const i of sl){if(n<=0)break;if(st[i])continue;const s=newStack(i,gd,b.p,bi),a=Math.min(M,n);G.cnt[s]=a;b.has[gd]+=a;n-=a}
  stockVer++;return n;
}
/* één stuk van stapel s wegnemen; een lege stapel geeft zijn tegel vrij */
function takeOne(s){
  const b=world.blds[G.bld[s]];G.cnt[s]--;b.has[G.good[s]]--;stockVer++;
  if(!G.cnt[s]){world.stk[G.tile[s]]=0;G.res[s]=0;G.free.push(s)}
}
/* een stuk van goed gd bij gebouw bi dat niemand komt halen, of -1 */
function freeUnitAt(bi,gd){const st=world.stk;for(const i of bldSlots(bi)){const s=st[i]-1;if(s>=0&&G.bld[s]===bi&&G.good[s]===gd&&G.cnt[s]>G.res[s])return s}return -1}
function stackLabel(s){const b=world.blds[G.bld[s]];return `${G.cnt[s]}× ${GOODS[G.good[s]].n} · ${BTYPES[b.type].name.replace(/ \(.*\)/,'')}${b.dead?' (afgebroken)':b.st?' (bouwplaats)':''}, speler ${G.pl[s]+1}`}
/* totaal per goed voor speler p: stapels plus wat dragers onderweg vasthouden */
function stockTotals(p){const t=new Uint32Array(GOODS.length);for(let s=0;s<G.n;s++)if(G.cnt[s]&&G.pl[s]===p)t[G.good[s]]+=G.cnt[s];
  if(S.carry)for(let i=0;i<S.n;i++)if(S.carry[i]&&S.pl[i]===p)t[S.carry[i]-1]++;return t}

/* ---------- Paneel 'Voorraad' ---------- */
let stockShown=-1,stockCells=null;
function buildStockPanel(){
  const sel=$('stockPl'),P=world.starts.length;sel.innerHTML='';
  for(let p=0;p<P;p++){const o=document.createElement('option');o.value=p;o.textContent='Speler '+(p+1);sel.appendChild(o)}
  const box=$('stockList');box.innerHTML='';stockCells=[];let gr='';
  GOODS.forEach((d,gd)=>{
    if(d.gr!==gr){gr=d.gr;const h=document.createElement('h3');h.textContent=d.grn;box.appendChild(h)}
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
  stockCells.forEach(([row,v],gd)=>{v.textContent=t[gd].toLocaleString(LOC());row.classList.toggle('zero',!t[gd])});
}
$('stockPl').onchange=refreshStock;
