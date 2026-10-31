"use strict";
/* ---------- Routes: A* over het tegelraster ----------
   8 richtingen (schuin alleen als beide rechte buren beloopbaar zijn), kosten per stap zie CFG.path.
   Zoekopdrachten staan in een wachtrij en krijgen samen een vast aantal knopen per tick (CFG.path.budget):
   zwaar rekenwerk wordt over ticks verdeeld en de uitkomst hangt alleen af van de ticks, dus deterministisch.
   Gevonden routes (en 'onbereikbaar') gaan in een LRU-cache op (van, naar); world.walkVer verhogen leegt die. */
const PF={q:[],qh:0,cur:null,cache:new Map(),ver:0,hits:0,miss:0,nodes:0};
let pfG,pfPar,pfSeen,pfDone,pfStamp=0,hpN=new Int32Array(4096),hpF=new Float32Array(4096),hpLen=0;
const PDX=[1,-1,0,0,1,1,-1,-1],PDY=[0,0,1,-1,1,-1,1,-1];
function pathInit(){
  const N=world.W*world.H,c=CFG.path;
  pfG=new Float32Array(N);pfPar=new Int32Array(N);pfSeen=new Uint32Array(N);pfDone=new Uint32Array(N);pfStamp=0;
  world.walkVer=world.walkVer|0;Object.assign(PF,{q:[],qh:0,cur:null,ver:world.walkVer,hits:0,miss:0,nodes:0});PF.cache.clear();
  PF.tc=Float32Array.from(c.terrain);PF.oc=Float32Array.from([1,c.tree,c.stone,c.bush,1,1]);
  let m=Infinity;for(const v of c.terrain)if(v>0)m=Math.min(m,v);PF.minC=m*Math.min(1,c.footpath);
}
/* kosten van tegel a naar buurtegel b (d = 1 of √2) */
function stepCost(a,b,d){
  const {ter,obj,path,hp}=world,dh=hp[b]-hp[a];
  return d*PF.tc[ter[b]]*PF.oc[obj[b]]*(path[b]?CFG.path.footpath:1)+(dh>0?dh*CFG.path.up:-dh*CFG.path.down);
}
/* route van tegel 'from' naar tegel 'to'; cb(Int32Array van tegels from..to, of null) volgt in deze of een latere tick */
function findPath(from,to,cb){
  if(PF.ver!==world.walkVer){PF.cache.clear();PF.ver=world.walkVer}
  const key=from*world.W*world.H+to,c=PF.cache.get(key);
  if(c!==undefined){PF.cache.delete(key);PF.cache.set(key,c);PF.hits++;cb(c);return}
  PF.miss++;PF.q.push({from,to,key,cb,n:0});
}
function hpush(n,f){
  if(hpLen===hpN.length){const a=new Int32Array(hpLen*2),b=new Float32Array(hpLen*2);a.set(hpN);b.set(hpF);hpN=a;hpF=b}
  let k=hpLen++;while(k){const p=(k-1)>>1;if(hpF[p]<=f)break;hpN[k]=hpN[p];hpF[k]=hpF[p];k=p}hpN[k]=n;hpF[k]=f;
}
function hpop(){
  const top=hpN[0],n=hpN[--hpLen],f=hpF[hpLen];let k=0;
  for(;;){let c=2*k+1;if(c>=hpLen)break;if(c+1<hpLen&&hpF[c+1]<hpF[c])c++;if(hpF[c]>=f)break;hpN[k]=hpN[c];hpF[k]=hpF[c];k=c}
  hpN[k]=n;hpF[k]=f;return top;
}
function pfH(a,b){const W=world.W,dx=Math.abs(a%W-b%W),dy=Math.abs((a/W|0)-(b/W|0));return (Math.max(dx,dy)+0.41421356*Math.min(dx,dy))*PF.minC}
function pfStart(s){pfStamp++;hpLen=0;pfSeen[s.from]=pfStamp;pfG[s.from]=0;pfPar[s.from]=-1;hpush(s.from,pfH(s.from,s.to))}
function pfFinish(s,path){
  PF.cache.set(s.key,path);while(PF.cache.size>CFG.path.cacheMax)PF.cache.delete(PF.cache.keys().next().value);
  PF.cur=null;s.cb(path);
}
/* zoekt verder aan s tot het budget op is; geeft het resterende budget terug */
function pfStep(s,budget){
  const {W,H,walk}=world,to=s.to,max=CFG.path.maxNodes;
  while(budget>0){
    if(!hpLen||s.n>=max){pfFinish(s,null);return budget}
    const a=hpop();if(pfDone[a]===pfStamp)continue;pfDone[a]=pfStamp;budget--;s.n++;PF.nodes++;
    if(a===to){let k=0;for(let t=a;t>=0;t=pfPar[t])k++;const p=new Int32Array(k);for(let t=a;t>=0;t=pfPar[t])p[--k]=t;pfFinish(s,p);return budget}
    const ax=a%W,ay=a/W|0,ga=pfG[a];
    for(let k=0;k<8;k++){
      const x=ax+PDX[k],y=ay+PDY[k];if(x<0||y<0||x>=W||y>=H)continue;
      const b=y*W+x;if(!walk[b]||pfDone[b]===pfStamp)continue;
      if(k>=4&&!(walk[ay*W+x]&&walk[y*W+ax]))continue;
      const g=ga+stepCost(a,b,k>=4?1.41421356:1);
      if(pfSeen[b]===pfStamp&&pfG[b]<=g)continue;
      pfSeen[b]=pfStamp;pfG[b]=g;pfPar[b]=a;hpush(b,g+pfH(b,to));
    }
  }
  return 0;
}
/* één tick routewerk */
function pathTick(){
  let budget=CFG.path.budget;
  while(budget>0){
    if(!PF.cur){
      if(PF.qh>=PF.q.length){PF.q.length=0;PF.qh=0;return}
      const s=PF.q[PF.qh++],c=PF.cache.get(s.key);
      if(c!==undefined){PF.hits++;s.cb(c);continue} // intussen door een eerdere zoekopdracht gevonden
      PF.cur=s;pfStart(s);
    }
    budget=pfStep(PF.cur,budget);
  }
}
const pathQueued=()=>PF.q.length-PF.qh+(PF.cur?1:0);
