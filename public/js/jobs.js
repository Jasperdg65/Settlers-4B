"use strict";
/* ---------- Beroepen: vakmensen voor voltooide werkgebouwen ----------
   CFG.jobs zegt per beroep welk gereedschap nodig is en in welke gebouwen het werkt.
   Per werkgebouw zonder bewoner zoekt de planner eerst een werkloze vakman met dat beroep, anders een vrije drager
   (er blijven er altijd CFG.carry.keepFree over). Die haalt eerst het gereedschap (S.job wordt dan het beroep),
   loopt naar de deur en gaat naar binnen: S.ins = 1, b.occ = 1 (vlag). b.wkr = kolonist+1 zodra hij onderweg is. */
const JI={},BJOB={};
CFG.jobs.forEach((j,i)=>{JI[j.k]=i;for(const t of j.bld||[])BJOB[t]=i});
function freeCarriers(p){let n=0;for(let i=0;i<S.n;i++)if(S.pl[i]===p&&!S.job[i]&&!S.ins[i])n++;return n}
function planJobs(M){
  const bl=world.blds,P=world.starts.length,free=[];let made=0;
  for(let p=0;p<P;p++)free[p]=freeCarriers(p);
  for(let bi=0;bi<bl.length&&made<M;bi++){
    const b=bl[bi],job=BJOB[b.type];
    if(job===undefined||b.dead||b.st||b.wkr||b.cool>tickNo)continue;
    const door=doorTile(b);
    /* 1. een werkloze vakman met dit beroep */
    const c=nearestIdle(b.p,door,job);
    if(c>=0){b.wkr=c+1;S.dst[c]=bi;S.wait[c]=0;goPath(c,ST.PATH_IN,door);made++;continue}
    if(free[b.p]<=CFG.carry.keepFree)continue;
    /* 2. een vrije drager, die zo nodig eerst het gereedschap haalt */
    const tool=CFG.jobs[job].tool;
    if(tool){
      const s=nearestSource(b.p,GI[tool],bi,b.x,b.y);if(s<0)continue;
      const r=nearestIdle(b.p,G.tile[s],0);if(r<0)continue;
      G.res[s]++;S.gd[r]=G.good[s];S.src[r]=s;S.dst[r]=bi;S.jb[r]=job;S.cm[r]=0;S.wait[r]=0;b.wkr=r+1;goPath(r,ST.PATH_TOOL,G.tile[s]);
    }else{
      const r=nearestIdle(b.p,door,0);if(r<0)continue;
      S.job[r]=job;S.dst[r]=bi;S.wait[r]=0;b.wkr=r+1;goPath(r,ST.PATH_IN,door);
    }
    free[b.p]--;made++;
  }
  return made;
}
/* bij de deur: naar binnen, als het gebouw er nog is en op hem wacht */
function enterBuilding(c){
  const b=world.blds[S.dst[c]];
  if(b.dead||b.st||b.wkr!==c+1){toIdle(c);return}
  S.ins[c]=1;S.st[c]=ST.INSIDE;b.occ=1;S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5;
  if(CFG.territory[b.type]){b.mt=tickNo;computeLand()}   // bemande toren: gebied erbij
}
/* gebouw b verdwijnt (afbreken): de bewoner komt naar buiten en is een werkloze vakman; wie onderweg is, ziet dat bij aankomst */
function releaseWorker(b){
  const c=b.wkr-1;b.wkr=0;b.occ=0;if(c<0)return;
  if(S.st[c]===ST.P_OUT)world.rsv[S.src[c]]=0;   // stond nog binnen te wachten op zijn route naar buiten
  if(S.ins[c]){S.ins[c]=0;S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5;toIdle(c)}
}
/* aantallen per beroep voor speler p (of alle spelers bij p < 0): [aantal, waarvan binnen] */
function jobCounts(p=-1){const n=CFG.jobs.map(()=>[0,0]);for(let i=0;i<S.n;i++)if(p<0||S.pl[i]===p){n[S.job[i]][0]++;if(S.ins[i])n[S.job[i]][1]++}return n}
