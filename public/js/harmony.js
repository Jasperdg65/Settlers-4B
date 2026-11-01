"use strict";
/* ---------- Harmonie (mijlpaal 7, CFG.harmony) ----------
   Per speler een meter van 0 tot 100 (world.harm[p] als 0..1, want de duelkracht rekent zo). Elke CFG.harmony.every ticks
   wordt het doel opnieuw berekend: start + de som van de bronnen (world.harmSrc[p]: voederplaatsen, lege voederplaatsen,
   dierenweides, bloemenweides, bos); de meter schuift daar met 'step' punten per keer naartoe, zodat hij traag reageert.
   Nieuwe bronnen (school, hunnebed) komen er als extra regel in harmSources bij.
   Gevolgen: duelkracht (duel.js), groei van akkers en boompjes en nieuwe bewoners (harmFactor), dieren die zich bij hoge
   harmonie ophouden bij ertsaders, en nieuwe dieren bij een gevulde voederplaats met een dierenweide ernaast.
   Alles hangt alleen van ticks en de wereld af (srand), dus deterministisch. */
const harmPct=p=>Math.round((world.harm?world.harm[p]:0.5)*100);
/* -1 (harmonie 0) .. 0 (50) .. +1 (100) */
const harmF=p=>world.harm?world.harm[p]*2-1:0;
/* vermenigvuldiger voor een duur: minder bij hoge harmonie (eff = effect bij 0 of 100) */
const harmDur=(p,eff)=>1-eff*harmF(p);
function harmInit(){
  const P=world.starts.length,C=CFG.harmony;
  world.harm=new Array(P).fill(C.start/100);world.harmT=new Array(P).fill(C.start);world.harmSrc=world.starts.map(()=>({}));
  world.forest0=forestShares();world.oreHint=world.starts.map(()=>[]);
}
/* aandeel bos (bomen en boompjes) op het eigen gebied, per speler */
function forestShares(){
  const P=world.starts.length,n=new Array(P).fill(0),f=new Array(P).fill(0),{own,obj}=world;
  for(let i=0;i<own.length;i++){const o=own[i];if(!o||o>P)continue;n[o-1]++;if(obj[i]===1||obj[i]===4)f[o-1]++}
  return n.map((k,p)=>k?f[p]/k:0);
}
/* de som van de 'max' grootste bijdragen (bijvoorbeeld de beste vier voederplaatsen) */
const topSum=(a,max)=>a.sort((x,y)=>y-x).slice(0,max).reduce((s,v)=>s+v,0);
const fedOk=b=>b.fedUntil>tickNo;
const nearFed=(b,p,r)=>world.blds.some(o=>o.p===p&&!o.dead&&!o.st&&o.type==='voederplaats'&&fedOk(o)&&Math.hypot(o.x-b.x,o.y-b.y)<=r);
function harmSources(p,share){
  const C=CFG.harmony,src={},mine=world.blds.filter(b=>b.p===p&&!b.dead&&!b.st);
  const feeders=mine.filter(b=>b.type==='voederplaats');
  src.voer=topSum(feeders.filter(fedOk).map(()=>C.voer.full),C.voer.max);
  src.leeg=feeders.filter(b=>b.fedUntil!==undefined&&!fedOk(b)&&tickNo-b.fedUntil>C.voer.grace).length*C.voer.empty;
  src.weide=topSum(mine.filter(b=>b.type==='dierenweide'&&nearFed(b,p,C.weide.r)).map(()=>C.weide.plus),C.weide.max);
  src.bloem=topSum(mine.filter(b=>b.type==='bloemenweide').map(()=>C.bloem.plus),C.bloem.max);
  const f0=world.forest0[p];src.bos=f0?Math.round(Math.max(C.bos.min,Math.min(C.bos.max,C.bos.k*(share/f0-1)))):0;
  return src;
}
function tickHarmony(){
  const C=CFG.harmony;if(!world.harm||tickNo%C.every)return;
  const shares=forestShares();
  for(let p=0;p<world.starts.length;p++){
    const src=harmSources(p,shares[p]),sum=Object.values(src).reduce((s,v)=>s+v,0);
    const goal=Math.max(0,Math.min(100,C.start+sum)),cur=world.harm[p]*100;
    world.harmSrc[p]=src;world.harmT[p]=goal;
    world.harm[p]=(cur<goal?Math.min(goal,cur+C.step):Math.max(goal,cur-C.step))/100;
    if(world.harm[p]*100>=C.ore.min&&tickNo%C.ore.every<C.every)oreHint(p);
  }
  breedAnimals();
}

/* ---------- voederplaats: de dierenverzorger vult de bak met graan ---------- */
function tickFeeder(b,bi){
  const V=CFG.harmony.voer;if(b.fedUntil===undefined)b.fedUntil=tickNo;
  b.want[GI[V.food]]=V.stock;
  if(!b.occ){b.ps=t('voer.wacht');return}
  if(b.fedUntil-tickNo<V.refill){const s=freeUnitAt(bi,GI[V.food]);if(s>=0){takeOne(s);TR.used++;b.fedUntil=Math.max(b.fedUntil,tickNo)+V.ticks}}
  b.ps=fedOk(b)?t('voer.vol',{min:Math.ceil((b.fedUntil-tickNo)/CFG.ticksPerSec/60)}):t('voer.leeg',{goed:GOODS[GI[V.food]].n.toLowerCase()});
}
/* tooltip van de weides */
function meadowLabel(b){
  if(b.st||b.dead)return '';const C=CFG.harmony;
  if(b.type==='bloemenweide')return ' · '+t('bloem.ps',{n:C.bloem.plus});
  if(b.type!=='dierenweide')return '';
  return ' · '+(nearFed(b,b.p,C.weide.r)?t('weide.vol',{n:animalsNear(b.x,b.y+1,C.weide.r)}):t('weide.geenVoer',{r:C.weide.r}));
}
function animalsNear(x,y,r){let n=0;for(let i=0;i<A.n;i++)if(!CFG.animals[A.type[i]].water&&Math.hypot(A.hx[i]-x,A.hy[i]-y)<=r)n++;return n}

/* ---------- dieren ---------- */
/* plek voor één dier meer: alle rijen groeien mee, de capaciteit verdubbelt (zoals growUnits) */
function growAnimals(){
  if(A.n<(A.cap||0))return A.n++;
  const cap=Math.max(16,(A.cap||A.n)*2);
  for(const k of Object.keys(A)){const a=A[k];if(ArrayBuffer.isView(a)&&a.length<cap){const b=new a.constructor(cap);b.set(a);A[k]=b}}
  A.cap=cap;return A.n++;
}
/* een gevulde voederplaats met een dierenweide in de buurt: af en toe een nieuw dier bij de wei, tot weide.cap */
function breedAnimals(){
  const W=CFG.harmony.weide,kinds=W.kinds.map(k=>CFG.animals.findIndex(a=>a.k===k)).filter(k=>k>=0);if(!kinds.length)return;
  world.blds.forEach(b=>{
    if(b.dead||b.st||b.type!=='dierenweide')return;
    if(!nearFed(b,b.p,W.r)){b.breedAt=0;return}
    if(!b.breedAt){b.breedAt=tickNo+W.breed;return}
    if(tickNo<b.breedAt||animalsNear(b.x,b.y+1,W.r)>=W.cap)return;
    b.breedAt=tickNo+W.breed;const X=b.x+0.5,Y=b.y+1.6,type=kinds[(b.bred=(b.bred||0)+1)%kinds.length];
    if(!animalOk(type,(Y|0)*world.W+(X|0)))return;
    const i=growAnimals();A.x[i]=A.px[i]=A.hx[i]=A.tx[i]=X;A.y[i]=A.py[i]=A.hy[i]=A.ty[i]=Y;A.type[i]=type;A.wait[i]=40;A.dir[i]=srand()<0.5?1:0;A.d8[i]=srand()*8|0;A.lie[i]=0;
    const nb=$('nanim');if(nb)nb.textContent=A.n.toLocaleString(LOC());
  });
}
/* hoge harmonie: een dier uit de buurt gaat zich ophouden bij een ertsader op het eigen gebied (een hint waar erts zit) */
function oreHint(p){
  const C=CFG.harmony.ore,{W,H,own,ore,oreRes}=world,list=world.oreHint[p];
  for(let k=list.length-1;k>=0;k--)if(list[k]>=A.n)list.splice(k,1);
  if(list.length>=C.max)return;
  const veins=[];for(let i=0;i<own.length;i++)if(own[i]===p+1&&ore[i]&&oreRes[i]>0)veins.push(i);if(!veins.length)return;
  const v=veins[srand()*veins.length|0],vx=v%W,vy=v/W|0;
  let spot=-1;for(let r=1;r<=C.margin&&spot<0;r++)for(let dy=-r;dy<=r&&spot<0;dy++)for(let dx=-r;dx<=r;dx++){const x=vx+dx,y=vy+dy;
    if(x>0&&y>0&&x<W-1&&y<H-1&&animalOk(0,y*W+x)){spot=y*W+x;break}}
  if(spot<0)return;
  let best=-1,bd=Infinity;for(let i=0;i<A.n;i++){if(CFG.animals[A.type[i]].water||list.includes(i)||world.oreHint.some(l=>l.includes(i)))continue;
    const d=Math.hypot(A.x[i]-vx,A.y[i]-vy);if(d<bd){bd=d;best=i}}
  if(best<0||bd>CFG.territory.burcht*2)return;
  A.hx[best]=A.tx[best]=spot%W+0.5;A.hy[best]=A.ty[best]=(spot/W|0)+0.5;A.wait[best]=0;list.push(best);
}
