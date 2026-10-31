"use strict";
/* ---------- Kolonisten en dieren ---------- */
const S={n:0},A={n:0};
const TICK=1000/CFG.ticksPerSec;let running=false,acc=0,simAvg=0,tickNo=0;
let srand=mulberry32(1);
function hAt(X,Y){
  const {W,H,hp}=world;const x=Math.min(W-2,Math.max(0,X)),y=Math.min(H-2,Math.max(0,Y));
  const x0=x|0,y0=y|0,fx=x-x0,fy=y-y0,i=y0*W+x0;
  return (hp[i]*(1-fx)+hp[i+1]*fx)*(1-fy)+(hp[i+W]*(1-fx)+hp[i+W+1]*fx)*fy;
}
function canOcc(role,type){if(type==='burcht')return false;if(type==='kazerne'||type==='wachttoren')return role===2||role===3;
  if(type==='kruidenhuis')return role===4;return role<=1}
function pickTarget(i){
  const {W,H,walk,doors}=world;
  const ds=doors[S.pl[i]][S.role[i]];
  S.tb[i]=0;if(ds.length&&srand()<0.55){const d=ds[srand()*ds.length|0];S.tx[i]=d[0]+(srand()-0.5)*0.6;S.ty[i]=d[1]+srand()*0.6;S.tb[i]=d[2]+1;return}
  const R=4+srand()*(S.role[i]>=2?14:24);
  for(let t=0;t<8;t++){
    const a=srand()*6.283,d=srand()*R,X=S.hx[i]+Math.cos(a)*d,Y=S.hy[i]+Math.sin(a)*d;
    if(X>1&&Y>1&&X<W-2&&Y<H-2&&walk[(Y|0)*W+(X|0)]){S.tx[i]=X;S.ty[i]=Y;return}
  }
  S.tx[i]=S.hx[i];S.ty[i]=S.hy[i];
}
/* eco: economiemodus, iedereen is een vrije drager zonder beroep (zie transport.js); anders de stresstest */
/* de gedeelde rijen per eenheid; economie (transport.js) en duel-test (army.js) voegen er hun eigen bij */
function allocUnits(n){
  for(const k of ['x','y','px','py','tx','ty','hx','hy','sp'])S[k]=new Float32Array(n);
  S.wait=new Uint16Array(n);S.tb=new Int16Array(n);S.ins=new Uint8Array(n);S.pl=new Uint8Array(n);S.role=new Uint8Array(n);S.dir=new Uint8Array(n);S.vr=new Uint8Array(n);S.lvl=new Uint8Array(n);S.d8=new Uint8Array(n).fill(2);
  S.n=n;S.next=new Int32Array(n);
}
function spawn(total,eco){
  ORDERS.length=0;
  const P=world.starts.length;S.eco=0;S.army=0;S.carry=null;if(!P){S.n=0;return}
  const per=Math.floor(total/P),n=per*P,{W,walk}=world;
  srand=mulberry32(hashStr(world.seed+'#settlers'));
  allocUnits(n);for(const b of world.blds)b.occ=b.type==='burcht'?1:0;
  let i=0;
  for(let p=0;p<P;p++){const s=world.starts[p];const hx=s.cx+0.5,hy=s.cy+1.6;
    for(let j=0;j<per;j++,i++){
      let role=0;if(!eco){let rr=srand();for(let k=0;k<ROLES.length;k++){if(rr<ROLES[k].share){role=k;break}rr-=ROLES[k].share}}
      let X=hx,Y=hy;
      for(let t=0;t<30;t++){const a=srand()*6.283,d=2+srand()*11,xx=hx+Math.cos(a)*d,yy=hy+Math.sin(a)*d;if(walk[(yy|0)*W+(xx|0)]){X=xx;Y=yy;break}}
      S.x[i]=S.px[i]=X;S.y[i]=S.py[i]=Y;S.hx[i]=hx;S.hy[i]=hy;S.pl[i]=p;S.role[i]=role;S.lvl[i]=1+(i*7+p)%3;S.vr[i]=srand()*ROLES[role].vars|0;S.dir[i]=srand()<0.5?1:0;
      S.sp[i]=0.07+srand()*0.05;S.wait[i]=srand()*60|0;
      if(eco){S.hx[i]=X;S.hy[i]=Y;S.tx[i]=X;S.ty[i]=Y}else pickTarget(i);
    }
  }
  if(eco)initTransport();
  $('nset').textContent=n.toLocaleString('nl-NL');
}
function animalOk(type,i){const t=world.ter[i];return CFG.animals[type].water?t<=T.SHALLOW:(t>=T.SAND&&t<=T.DRY&&!world.bldAt[i])}
function spawnAnimals(){
  const {W,H,ter,starts}=world,r=mulberry32(hashStr(world.seed+'#dieren')),C=CFG.animals;
  let landN=0,waterN=0;for(const t of ter){if(t<=T.SHALLOW)waterN++;else if(t<=T.DRY)landN++}
  const want=C.map(a=>Math.min(a.max,(a.water?waterN:landN)/a.per|0)),n=want.reduce((s,v)=>s+v,0);
  for(const k of ['x','y','px','py','tx','ty','hx','hy'])A[k]=new Float32Array(n);
  A.type=new Uint8Array(n);A.wait=new Uint16Array(n);A.dir=new Uint8Array(n);A.d8=new Uint8Array(n);A.lie=new Uint8Array(n);A.next=new Int32Array(n);A.n=0;
  for(let type=0;type<C.length;type++)for(let k=0;k<want[type];k++){
    for(let t=0;t<60;t++){
      const x=1+r()*(W-3),y=1+r()*(H-3),i=(y|0)*W+(x|0);
      if(!animalOk(type,i))continue;
      if(C[type].keep&&starts.some(s=>Math.hypot(s.x-x,s.y-y)<C[type].keep))continue;
      const j=A.n++;A.x[j]=A.px[j]=A.hx[j]=A.tx[j]=x;A.y[j]=A.py[j]=A.hy[j]=A.ty[j]=y;A.type[j]=type;A.wait[j]=r()*100|0;A.dir[j]=r()<0.5?1:0;A.d8[j]=r()*8|0;break;
    }
  }
  $('nanim').textContent=A.n.toLocaleString('nl-NL');
}
function tick(){
  runOrders();tickNo++;
  const {W,walk,ter}=world,{x,y,px,py,tx,ty,sp,wait,dir}=S,n=S.n;
  if(S.eco)tickCarriers();
  else if(S.army)tickArmy();
  else for(let i=0;i<n;i++){
    px[i]=x[i];py[i]=y[i];
    if(wait[i]>0){wait[i]--;continue}
    const dx=tx[i]-x[i],dy=ty[i]-y[i],d=Math.hypot(dx,dy);
    if(d<0.25){const tb=S.tb[i];if(tb){const b=world.blds[tb-1];if(!b.occ&&canOcc(S.role[i],b.type)){b.occ=1;S.ins[i]=1;wait[i]=65535;continue}}wait[i]=10+(srand()*60|0);pickTarget(i);continue}
    const c=ter[(y[i]|0)*W+(x[i]|0)]>=T.ROCKY?1.9:1;
    const s=Math.min(d,sp[i]/c),nx=x[i]+dx/d*s,ny=y[i]+dy/d*s;
    const sdx=dx*2-dy;if(Math.abs(sdx)>0.05)dir[i]=sdx<0?1:0;
    if(walk[(ny|0)*W+(nx|0)]){x[i]=nx;y[i]=ny}
    else if(walk[(y[i]|0)*W+(nx|0)])x[i]=nx;
    else if(walk[(ny|0)*W+(x[i]|0)])y[i]=ny;
    else pickTarget(i);
  }
  for(let i=0;i<A.n;i++){
    A.px[i]=A.x[i];A.py[i]=A.y[i];
    if(A.wait[i]>0){A.wait[i]--;continue}
    const type=A.type[i],c=CFG.animals[type],dx=A.tx[i]-A.x[i],dy=A.ty[i]-A.y[i],d=Math.hypot(dx,dy);
    if(d<0.2){
      /* aangekomen: even stilstaan, of soms een tijd gaan liggen of zitten; daarna een nieuw doel rond de thuisplek */
      A.lie[i]=srand()<c.rest?1:0;const w=A.lie[i]?c.restWait:c.wait;A.wait[i]=w[0]+srand()*(w[1]-w[0])|0;
      for(let t=0;t<6;t++){const a=srand()*6.283,rr=srand()*c.range,X=A.hx[i]+Math.cos(a)*rr,Y=A.hy[i]+Math.sin(a)*rr;
        if(X>1&&Y>1&&X<world.W-2&&Y<world.H-2&&animalOk(type,(Y|0)*W+(X|0))){A.tx[i]=X;A.ty[i]=Y;break}}
      continue;
    }
    A.lie[i]=0;const s=Math.min(d,c.speed),nx=A.x[i]+dx/d*s,ny=A.y[i]+dy/d*s;
    const sdx=dx*2-dy;if(Math.abs(sdx)>0.05)A.dir[i]=sdx<0?1:0;
    if(animalOk(type,(ny|0)*W+(nx|0))){A.x[i]=nx;A.y[i]=ny}else{A.tx[i]=A.x[i];A.ty[i]=A.y[i]}
  }
}
