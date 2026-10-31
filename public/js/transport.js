"use strict";
/* ---------- Transport: centrale planner, dragers en werkers ----------
   Vraag: b.want[goed] (hoeveel gebouw b wil hebben), b.has (ligt er), b.coming (onderweg).
   De planner koppelt elke ontbrekende eenheid aan de dichtstbijzijnde stapel die beschikbaar is en geeft
   de opdracht aan de dichtstbijzijnde vrije drager. Stapels bij afgebroken gebouwen gaan naar de opslag.
   Een drager: vrij → wacht op route → naar de stapel → oppakken → wacht op route → naar de deur → neerleggen.
   Beroepen (S.job, CFG.jobs): een vrije drager haalt eerst het gereedschap; gravers en bouwers werken daarna op
   bouwplaatsen (build.js), de andere vakmensen gaan hun gebouw in (jobs.js).
   Elke 'wacht op route'-toestand (PATH_*) is oneven en gaat bij een gevonden route naar de volgende (lopen). */
const ST={IDLE:0,PATH_SRC:1,TO_SRC:2,PATH_DST:3,TO_DST:4,PATH_TOOL:5,TO_TOOL:6,PATH_WORK:7,TO_WORK:8,WORK:9,INSIDE:10,PATH_IN:11,TO_IN:12,
  P_OUT:13,TO_OUT:14,P_HOME:15,TO_HOME:16,GATHER:18};   // buitenwerkers (production.js): naar het doel, terug, werken
const TR={rr:0,done:0,used:0};
const doorTile=b=>(b.y+1)*world.W+b.x;
const isStore=b=>(b.type==='burcht'||b.type==='pakhuis')&&!b.dead&&!b.st;
function initTransport(){
  const n=S.cap;
  S.eco=1;S.st=new Uint8Array(n);S.carry=new Uint8Array(n);S.gd=new Uint8Array(n);S.src=new Int32Array(n);S.sb=new Int16Array(n);S.dst=new Int16Array(n);S.cm=new Uint8Array(n);
  S.job=new Uint8Array(n);S.jb=new Uint8Array(n);S.pi=new Uint16Array(n);S.path=new Array(n).fill(null);
  for(const b of world.blds){b.want=new Uint8Array(GOODS.length);b.coming=new Uint8Array(GOODS.length);b.cool=0;b.wkr=0;setWant(b)}
  TR.rr=0;TR.done=0;TR.used=0;tickNo=0;pathInit();initProduction();
}
/* mag gebouw b goed gd halen bij gebouw o? Niet bij een gebouw dat het zelf vraagt, behalve een opslag voor een niet-opslag */
const canSource=(o,b,gd)=>!o.want[gd]||isStore(o)&&!isStore(b);
/* dichtstbijzijnde stapel van speler p met een vrij stuk van gd voor gebouw bi (tx,ty = waar het heen moet) */
function nearestSource(p,gd,bi,tx,ty){
  const {W}=world,bl=world.blds,b=bl[bi];let best=-1,bd=Infinity;
  for(let s=0;s<G.n;s++){
    if(G.good[s]!==gd||G.pl[s]!==p||G.cnt[s]<=G.res[s]||G.bld[s]===bi||!canSource(bl[G.bld[s]],b,gd))continue;
    const t=G.tile[s],d=Math.hypot(t%W-tx,(t/W|0)-ty);if(d<bd){bd=d;best=s}
  }
  return best;
}
/* dichtstbijzijnde vrije kolonist van speler p met beroep job */
function nearestIdle(p,t,job=0){
  const W=world.W,X=t%W+0.5,Y=(t/W|0)+0.5;let best=-1,bd=Infinity;
  for(let i=0;i<S.n;i++){if(S.st[i]!==ST.IDLE||S.pl[i]!==p||S.job[i]!==job)continue;const d=Math.hypot(S.x[i]-X,S.y[i]-Y);if(d<bd){bd=d;best=i}}
  return best;
}
/* dichtstbijzijnde gebouw van speler p (geen opslag) dat nog een stuk van gd vraagt, of -1 */
function nearestWanting(p,gd,x,y){let best=-1,bd=Infinity;world.blds.forEach((o,oi)=>{if(o.p===p&&!o.dead&&!isStore(o)&&o.want[gd]>o.has[gd]+o.coming[gd]){const d=Math.hypot(o.x-x,o.y-y);if(d<bd){bd=d;best=oi}}});return best}
/* dichtstbijzijnde opslag van speler p; met gd alleen een opslag waar nog een stuk van gd past */
function nearestStore(p,x,y,gd=-1){let best=-1,bd=Infinity;world.blds.forEach((o,oi)=>{if(o.p===p&&isStore(o)&&(gd<0||roomFor(oi,gd))){const d=Math.hypot(o.x-x,o.y-y);if(d<bd){bd=d;best=oi}}});return best}
const tileOf=i=>(S.y[i]|0)*world.W+(S.x[i]|0);
function goPath(c,st,to){S.st[c]=st;findPath(tileOf(c),to,p=>gotPath(c,p))}
function fetchGood(c,s,bi,gd,counted){G.res[s]++;if(counted)world.blds[bi].coming[gd]++;S.cm[c]=counted;S.gd[c]=gd;S.src[c]=s;S.dst[c]=bi;S.wait[c]=0;goPath(c,ST.PATH_SRC,G.tile[s])}
function planTransport(){
  const bl=world.blds,nb=bl.length,P=world.starts.length,M=CFG.carry.maxAssignPerRun,noIdle=new Uint8Array(P);
  let made=planWorkers(M);made+=planJobs(M-made);
  for(let k=0;k<nb&&made<M;k++){
    const bi=(TR.rr+k)%nb,b=bl[bi];if(b.dead||noIdle[b.p]||b.cool>tickNo)continue;
    for(let gd=0;gd<GOODS.length&&made<M;gd++){
      let need=b.want[gd]-b.has[gd]-b.coming[gd];if(need>0&&!b.st&&!inputRoom(bi,gd))continue;   // invoer past niet meer bij de deur
      while(need>0&&made<M){
        const s=nearestSource(b.p,gd,bi,b.x,b.y+1);if(s<0)break;
        const c=nearestIdle(b.p,G.tile[s]);if(c<0){noIdle[b.p]=1;break}
        fetchGood(c,s,bi,gd,1);need--;made++;
      }
      if(noIdle[b.p])break;
    }
  }
  /* naar de dichtstbijzijnde opslag: wat bij afgebroken gebouwen ligt, en wat een werkgebouw maakt en zelf niet vraagt */
  for(let s=0;s<G.n&&made<M;s++){
    const ob=bl[G.bld[s]];
    if(G.cnt[s]<=G.res[s]||noIdle[G.pl[s]]||!(ob.dead||CFG.prod[ob.type]&&!ob.st&&!ob.want[G.good[s]]))continue;
    const t=G.tile[s],W=world.W,o=nearestStore(G.pl[s],t%W,t/W|0,G.good[s]);if(o<0)continue;
    const c=nearestIdle(G.pl[s],t);if(c<0){noIdle[G.pl[s]]=1;continue}
    fetchGood(c,s,o,G.good[s],0);made++;
  }
  TR.rr=(TR.rr+1)%Math.max(1,nb);
}
function toIdle(c){S.st[c]=ST.IDLE;S.path[c]=null;S.hx[c]=S.x[c];S.hy[c]=S.y[c]}
function gotPath(c,p){
  const st=S.st[c],b=world.blds[S.dst[c]],gd=S.gd[c];
  if(!(st&1))return;                         // de opdracht is intussen vervallen (bijvoorbeeld gebouw afgebroken)
  if(st>=ST.P_OUT){prodPath(c,p);return}
  if(p){S.path[c]=p;S.pi[c]=p.length>1?1:0;S.st[c]=st+1;return}
  b.cool=tickNo+CFG.carry.retryTicks;
  if(st===ST.PATH_SRC||st===ST.PATH_TOOL)G.res[S.src[c]]--;
  else if(st===ST.PATH_DST){addGoods(S.sb[c],gd,1);S.carry[c]=0} // terugleggen bij de bron
  else if(st===ST.PATH_WORK)b.wk--;
  if(b.wkr===c+1)b.wkr=0; // was op weg om hier vakman te worden
  if(S.cm[c])b.coming[gd]--;S.cm[c]=0;toIdle(c);
}
function arrived(c){
  S.path[c]=null;const st=S.st[c],gd=S.gd[c],bi=S.dst[c],b=world.blds[bi];
  if(st===ST.TO_OUT){S.st[c]=ST.GATHER;S.wait[c]=CFG.prod[b.type].work;return}
  if(st===ST.TO_HOME){arriveHome(c);return}
  if(st===ST.TO_SRC||st===ST.TO_TOOL){
    const s=S.src[c],ok=G.cnt[s]&&G.res[s]&&G.good[s]===gd;
    if(ok){G.res[s]--;S.sb[c]=G.bld[s];takeOne(s);S.wait[c]=CFG.carry.pickTicks}
    if(st===ST.TO_TOOL){ // gereedschap opgepakt: nu vakman; wie voor een gebouw komt, loopt er meteen heen
      if(ok)S.job[c]=S.jb[c];
      if(ok&&b.wkr===c+1&&!b.dead)goPath(c,ST.PATH_IN,doorTile(b));else{if(b.wkr===c+1)b.wkr=0;toIdle(c)}
      return}
    if(ok){S.carry[c]=gd+1;goPath(c,ST.PATH_DST,doorTile(b))}
    else{if(S.cm[c])b.coming[gd]--;S.cm[c]=0;toIdle(c)}
    return;
  }
  if(st===ST.TO_WORK){S.st[c]=ST.WORK;S.wait[c]=1;return}
  if(st===ST.TO_IN){enterBuilding(c);return}
  /* bij de deur: neerleggen; past het niet (of is het gebouw weg), dan naar de dichtstbijzijnde opslag, of daar later opnieuw */
  if(!b.dead&&inputRoom(bi,gd)&&!addGoods(bi,gd,1)){if(S.cm[c])b.coming[gd]--;S.cm[c]=0;S.carry[c]=0;TR.done++;
    toIdle(c);S.wait[c]=CFG.carry.dropTicks;return}
  if(S.cm[c])b.coming[gd]--;S.cm[c]=0;
  /* past niet: eerst naar een gebouw dat dit goed vraagt, anders naar een opslag waar het wel past */
  const w=nearestWanting(b.p,gd,b.x,b.y);if(w>=0&&w!==bi){world.blds[w].coming[gd]++;S.cm[c]=1;S.dst[c]=w;goPath(c,ST.PATH_DST,doorTile(world.blds[w]));return}
  const o=nearestStore(b.p,b.x,b.y,gd);
  if(o>=0&&o!==bi){S.dst[c]=o;goPath(c,ST.PATH_DST,doorTile(world.blds[o]));return}
  S.wait[c]=CFG.carry.retryTicks;S.st[c]=ST.TO_DST; // alle opslag vol: blijven staan en straks opnieuw
}
function wander(i){
  const {W,H,walk}=world,R=CFG.carry.idleRadius,[w0,w1]=CFG.carry.idleWait;
  S.wait[i]=w0+(srand()*(w1-w0)|0);
  for(let t=0;t<6;t++){const a=srand()*6.283,d=srand()*R,X=S.hx[i]+Math.cos(a)*d,Y=S.hy[i]+Math.sin(a)*d;
    if(X>1&&Y>1&&X<W-2&&Y<H-2&&walk[(Y|0)*W+(X|0)]){S.tx[i]=X;S.ty[i]=Y;return}}
  S.tx[i]=S.x[i];S.ty[i]=S.y[i];
}
function tickCarriers(){
  if(tickNo%CFG.carry.plannerEvery===0)planTransport();
  tickProduction();
  pathTick();
  const {W,walk}=world,{x,y,px,py,tx,ty,sp,wait,dir,st}=S,n=S.n;
  for(let i=0;i<n;i++){
    const s=st[i];if(s===ST.INSIDE)continue;
    px[i]=x[i];py[i]=y[i];
    if(wait[i]>0){wait[i]--;continue}
    if(s===ST.WORK){siteWork(i);continue}
    if(s===ST.GATHER){gatherDone(i);continue}
    if(s&1)continue; // wacht op een route (PATH_*)
    if(s===ST.IDLE){
      const dx=tx[i]-x[i],dy=ty[i]-y[i],d=Math.hypot(dx,dy);
      if(d<0.2){wander(i);continue}
      const m=Math.min(d,sp[i]*0.7),nx=x[i]+dx/d*m,ny=y[i]+dy/d*m;
      if(Math.abs(dx*2-dy)>0.05)dir[i]=dx*2-dy<0?1:0;
      /* wie op een onbeloopbare tegel staat (net bebouwd), mag eraf lopen */
      if(walk[(ny|0)*W+(nx|0)]||!walk[(y[i]|0)*W+(x[i]|0)]){x[i]=nx;y[i]=ny}else wander(i);
      continue;
    }
    /* route volgen: naar het midden van de volgende tegel, met een kleine vaste verschuiving per kolonist */
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
/* tooltip-tekst voor een gebouw: bouwstand, wat het vraagt en wat er onderweg is */
function wantLabel(bi){
  const b=world.blds[bi];if(!b.want)return '';const r=[];
  for(let gd=0;gd<GOODS.length;gd++)if(b.want[gd])r.push(`${GOODS[gd].n} ${b.has[gd]}/${b.want[gd]}`+(b.coming[gd]?` (+${b.coming[gd]} onderweg)`:''));
  return siteLabel(b)+prodLabel(b)+(r.length?(b.st?' · nog nodig: ':' · vraagt: ')+r.join(', '):'');
}
function carrierStats(){let busy=0,free=0;for(let i=0;i<S.n;i++)if(!S.job[i]){free++;if(S.st[i])busy++}return [busy,free]}
