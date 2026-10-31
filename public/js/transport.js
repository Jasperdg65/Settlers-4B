"use strict";
/* ---------- Transport: centrale planner en dragers ----------
   Vraag: b.want[goed] (hoeveel gebouw b wil hebben), b.has (ligt er), b.coming (onderweg).
   De planner koppelt elke ontbrekende eenheid aan de dichtstbijzijnde stapel die beschikbaar is
   (bij een gebouw dat dat goed zelf niet vraagt) en geeft de opdracht aan de dichtstbijzijnde vrije drager.
   Een drager: vrij → wacht op route → naar de stapel → oppakken → wacht op route → naar de deur → neerleggen. */
const ST={IDLE:0,PATH_SRC:1,TO_SRC:2,PATH_DST:3,TO_DST:4};
const TR={rr:0,done:0,used:0};
const doorTile=b=>(b.y+1)*world.W+b.x;
const isStore=b=>b.type==='burcht'||b.type==='pakhuis';
function initTransport(){
  const n=S.n,want=CFG.temp.want;
  S.eco=1;S.st=new Uint8Array(n);S.carry=new Uint8Array(n);S.gd=new Uint8Array(n);S.src=new Int32Array(n);S.sb=new Int16Array(n);S.dst=new Int16Array(n);S.cm=new Uint8Array(n);
  S.pi=new Uint16Array(n);S.path=new Array(n).fill(null);
  for(const b of world.blds){b.want=new Uint8Array(GOODS.length);b.coming=new Uint8Array(GOODS.length);b.cool=0;
    const w=want[b.type];if(w)for(const k in w)b.want[GI[k]]=w[k]}
  TR.rr=0;TR.done=0;TR.used=0;tickNo=0;pathInit();
}
/* dichtstbijzijnde stapel van speler p met een vrij stuk van gd, niet bij een gebouw dat gd zelf vraagt */
function nearestSource(p,gd,bi,tx,ty){
  const {W}=world,bl=world.blds;let best=-1,bd=Infinity;
  for(let s=0;s<G.n;s++){
    if(G.good[s]!==gd||G.pl[s]!==p||G.cnt[s]<=G.res[s]||G.bld[s]===bi||bl[G.bld[s]].want[gd])continue;
    const t=G.tile[s],d=Math.hypot(t%W-tx,(t/W|0)-ty);if(d<bd){bd=d;best=s}
  }
  return best;
}
function nearestIdle(p,t){
  const W=world.W,X=t%W+0.5,Y=(t/W|0)+0.5;let best=-1,bd=Infinity;
  for(let i=0;i<S.n;i++){if(S.st[i]!==ST.IDLE||S.pl[i]!==p)continue;const d=Math.hypot(S.x[i]-X,S.y[i]-Y);if(d<bd){bd=d;best=i}}
  return best;
}
const tileOf=i=>(S.y[i]|0)*world.W+(S.x[i]|0);
function planTransport(){
  const bl=world.blds,nb=bl.length,P=world.starts.length,noIdle=new Uint8Array(P);let made=0;
  for(let k=0;k<nb&&made<CFG.carry.maxAssignPerRun;k++){
    const bi=(TR.rr+k)%nb,b=bl[bi];if(noIdle[b.p]||b.cool>tickNo)continue;
    for(let gd=0;gd<GOODS.length&&made<CFG.carry.maxAssignPerRun;gd++){
      let need=b.want[gd]-b.has[gd]-b.coming[gd];
      while(need>0&&made<CFG.carry.maxAssignPerRun){
        const s=nearestSource(b.p,gd,bi,b.x,b.y+1);if(s<0)break;
        const c=nearestIdle(b.p,G.tile[s]);if(c<0){noIdle[b.p]=1;break}
        G.res[s]++;b.coming[gd]++;need--;made++;
        S.st[c]=ST.PATH_SRC;S.cm[c]=1;S.gd[c]=gd;S.src[c]=s;S.dst[c]=bi;S.wait[c]=0;
        findPath(tileOf(c),G.tile[s],p=>gotPath(c,p));
      }
      if(noIdle[b.p])break;
    }
  }
  TR.rr=(TR.rr+1)%Math.max(1,nb);
}
function gotPath(c,p){
  const b=world.blds[S.dst[c]],gd=S.gd[c];
  if(!p){
    b.cool=tickNo+CFG.carry.retryTicks;
    if(S.st[c]===ST.PATH_SRC)G.res[S.src[c]]--;else{addGoods(S.sb[c],gd,1);S.carry[c]=0} // terugleggen bij de bron
    if(S.cm[c])b.coming[gd]--;S.cm[c]=0;
    S.st[c]=ST.IDLE;S.hx[c]=S.x[c];S.hy[c]=S.y[c];return;
  }
  S.path[c]=p;S.pi[c]=p.length>1?1:0;S.st[c]=S.st[c]===ST.PATH_SRC?ST.TO_SRC:ST.TO_DST;
}
function arrived(c){
  S.path[c]=null;const gd=S.gd[c],bi=S.dst[c],b=world.blds[bi];
  if(S.st[c]===ST.TO_SRC){
    const s=S.src[c];
    if(G.cnt[s]&&G.res[s]&&G.good[s]===gd){G.res[s]--;S.sb[c]=G.bld[s];takeOne(s);S.carry[c]=gd+1;
      S.wait[c]=CFG.carry.pickTicks;S.st[c]=ST.PATH_DST;findPath(tileOf(c),doorTile(b),p=>gotPath(c,p))}
    else{if(S.cm[c])b.coming[gd]--;S.cm[c]=0;S.st[c]=ST.IDLE}
    return;
  }
  /* bij de deur: neerleggen; past het niet, dan naar de dichtstbijzijnde opslag (of daar later opnieuw proberen) */
  if(!addGoods(bi,gd,1)){if(S.cm[c])b.coming[gd]--;S.cm[c]=0;S.carry[c]=0;TR.done++;
    S.st[c]=ST.IDLE;S.wait[c]=CFG.carry.dropTicks;S.hx[c]=S.x[c];S.hy[c]=S.y[c];return}
  if(!isStore(b)){if(S.cm[c])b.coming[gd]--;S.cm[c]=0;let best=-1,bd=Infinity;
    world.blds.forEach((o,oi)=>{if(o.p===b.p&&isStore(o)){const d=Math.hypot(o.x-b.x,o.y-b.y);if(d<bd){bd=d;best=oi}}});
    if(best>=0){S.dst[c]=best;S.st[c]=ST.PATH_DST;findPath(tileOf(c),doorTile(world.blds[best]),p=>gotPath(c,p));return}}
  S.wait[c]=CFG.carry.retryTicks;S.st[c]=ST.TO_DST; // opslag vol: blijven staan en straks opnieuw
}
function wander(i){
  const {W,H,walk}=world,R=CFG.carry.idleRadius,[w0,w1]=CFG.carry.idleWait;
  S.wait[i]=w0+(srand()*(w1-w0)|0);
  for(let t=0;t<6;t++){const a=srand()*6.283,d=srand()*R,X=S.hx[i]+Math.cos(a)*d,Y=S.hy[i]+Math.sin(a)*d;
    if(X>1&&Y>1&&X<W-2&&Y<H-2&&walk[(Y|0)*W+(X|0)]){S.tx[i]=X;S.ty[i]=Y;return}}
  S.tx[i]=S.x[i];S.ty[i]=S.y[i];
}
/* tijdelijk verbruik (CFG.temp): houdt de vraag gaande zolang er nog geen productie is */
function tempUse(){
  const use=CFG.temp.use.map(k=>GI[k]);
  world.blds.forEach((b,bi)=>{for(const gd of use)if(b.want[gd]&&b.has[gd]&&!isStore(b)){const s=freeUnitAt(bi,gd);if(s>=0){takeOne(s);TR.used++;break}}});
}
function tickCarriers(){
  if(tickNo%CFG.carry.plannerEvery===0)planTransport();
  if(tickNo%CFG.temp.useEvery===0)tempUse();
  pathTick();
  const {W,walk}=world,{x,y,px,py,tx,ty,sp,wait,dir,st}=S,n=S.n;
  for(let i=0;i<n;i++){
    px[i]=x[i];py[i]=y[i];
    if(wait[i]>0){wait[i]--;continue}
    const s=st[i];
    if(s===ST.PATH_SRC||s===ST.PATH_DST)continue;
    if(s===ST.IDLE){
      const dx=tx[i]-x[i],dy=ty[i]-y[i],d=Math.hypot(dx,dy);
      if(d<0.2){wander(i);continue}
      const m=Math.min(d,sp[i]*0.7),nx=x[i]+dx/d*m,ny=y[i]+dy/d*m;
      if(Math.abs(dx*2-dy)>0.05)dir[i]=dx*2-dy<0?1:0;
      if(walk[(ny|0)*W+(nx|0)]){x[i]=nx;y[i]=ny}else wander(i);
      continue;
    }
    /* route volgen: naar het midden van de volgende tegel, met een kleine vaste verschuiving per drager */
    const p=S.path[i];let k=S.pi[i];
    if(!p){arrived(i);continue}
    const t=p[k],jx=((i*37)%9)/9*0.4-0.2,jy=((i*53)%7)/7*0.4-0.2;
    const gx=t%W+0.5+jx,gy=(t/W|0)+0.5+jy,dx=gx-x[i],dy=gy-y[i],d=Math.hypot(dx,dy);
    const a=k?p[k-1]:t,len=a===t?1:(a%W!==t%W&&(a/W|0)!==(t/W|0)?1.41421356:1);
    const m=Math.min(d,sp[i]*len/(a===t?1:stepCost(a,t,len)));
    if(Math.abs(dx*2-dy)>0.05)dir[i]=dx*2-dy<0?1:0;
    if(d>1e-4){x[i]+=dx/d*m;y[i]+=dy/d*m}
    if(d-m<0.05){if(k+1<p.length)S.pi[i]=k+1;else arrived(i)}
  }
}
/* tooltip-tekst voor een gebouw: wat het vraagt en wat er onderweg is */
function wantLabel(bi){
  const b=world.blds[bi];if(!b.want)return '';const r=[];
  for(let gd=0;gd<GOODS.length;gd++)if(b.want[gd])r.push(`${GOODS[gd].n} ${b.has[gd]}/${b.want[gd]}`+(b.coming[gd]?` (+${b.coming[gd]} onderweg)`:''));
  return r.length?' · vraagt: '+r.join(', '):'';
}
function carrierStats(){let busy=0;for(let i=0;i<S.n;i++)if(S.st[i])busy++;return busy}
