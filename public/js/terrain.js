"use strict";
/* ---------- Basis: seeded random en ruis ---------- */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hashStr(s){let h=2166136261;for(let k=0;k<s.length;k++){h^=s.charCodeAt(k);h=Math.imul(h,16777619)}return h>>>0}
function hash2(x,y){let h=Math.imul(x,374761393)+Math.imul(y,668265263)|0;h=Math.imul(h^h>>>13,1274126177);return (h^h>>>16)>>>0}
function makeNoise(rand){
  const p=new Uint8Array(256);for(let i=0;i<256;i++)p[i]=i;
  for(let i=255;i>0;i--){const j=Math.floor(rand()*(i+1));const t=p[i];p[i]=p[j];p[j]=t}
  const perm=new Uint8Array(512);for(let i=0;i<512;i++)perm[i]=p[i&255];
  const GX=[1,-1,1,-1,1.41,-1.41,0,0],GY=[1,1,-1,-1,0,0,1.41,-1.41];
  const fade=t=>t*t*t*(t*(t*6-15)+10);
  return (x,y)=>{
    const X=Math.floor(x),Y=Math.floor(y),xf=x-X,yf=y-Y,xi=X&255,yi=Y&255;
    const g=(i,j,dx,dy)=>{const h=perm[perm[i]+j]&7;return GX[h]*dx+GY[h]*dy};
    const u=fade(xf),v=fade(yf);
    const a=g(xi,yi,xf,yf),b=g(xi+1,yi,xf-1,yf),c=g(xi,yi+1,xf,yf-1),d=g(xi+1,yi+1,xf-1,yf-1);
    const ab=a+(b-a)*u,cd=c+(d-c)*u;return ab+(cd-ab)*v;
  };
}
function fbm(n,x,y,oct){let s=0,a=1,f=1,norm=0;for(let i=0;i<oct;i++){s+=a*n(x*f,y*f);norm+=a;a*=0.5;f*=2.03}return s/norm}
const smooth=(a,b,v)=>{const t=Math.min(1,Math.max(0,(v-a)/(b-a)));return t*t*(3-2*t)};

/* ---------- Terrein ---------- */
const T={DEEP:0,SHALLOW:1,SAND:2,GRASS:3,LUSH:4,DRY:5,ROCKY:6,MOUNTAIN:7,SNOW:8};
const TNAME=['Diep water','Ondiep water','Strand','Gras','Weelderig gras','Droog gras','Rotsgrond','Gebergte','Sneeuw'];
const TCOL=[[42,88,128],[70,132,160],[224,202,146],[134,170,70],[100,148,58],[186,174,98],[156,142,118],[128,118,106],[238,240,242]];
const ORE=['geen','kolen','ijzer','goud','zwavel'];
const ORECOL=['','#222','#b8622f','#f2c230','#e8e05a'];
const PCOL=['#d33b3b','#2f6fd6','#e6b422','#3aa457','#9b4fc9','#e07a26','#22b0ad','#e05aa0'];
const TREE_NAMES=['eik','berk','den','beuk','appelboom'];
const TW=16,TH=8,HP=96,CH=32;
const VILLAGE=['ijzersmelterij','goudsmelterij','wapensmid','pakhuis','woonhuis','houthakker','bakkerij','molen','boerderij','smidse','woonhuis','zagerij','houthakker','bosbouwer','steenhouwer','kazerne','woonhuis','wachttoren','wachttoren'];

function quantile(arr,q){const c=Float32Array.from(arr).sort();return c[Math.min(c.length-1,Math.floor(q*c.length))]}

function generate(o){
  const t0=performance.now();
  const W=o.size,H=o.size,N=W*H;
  const rand=mulberry32(hashStr(o.seed+'|'+o.size+'|'+o.shape+'|'+o.players));
  const nB=makeNoise(rand),nM=makeNoise(rand),nR=makeNoise(rand),nW=makeNoise(rand),nO=makeNoise(rand),nT=makeNoise(rand),nS=makeNoise(rand);
  const f=(o.shape==='eilanden'?7:4.2)/W;
  const e=new Float32Array(N),mt=new Float32Array(N),ms=new Float32Array(N);
  const thr=0.22-o.mount*0.42;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
    const i=y*W+x;
    let v=fbm(nB,x*f,y*f,5);
    const dx=x/(W-1)*2-1,dy=y/(H-1)*2-1,d=Math.hypot(dx,dy)/Math.SQRT2;
    if(o.shape==='continent')v=v+0.22-1.2*d*d*d;
    else if(o.shape==='eilanden')v=v+0.05-0.7*d*d;
    else v=v+0.35*Math.pow(d,4)+0.1;
    const mask=o.mount<=0?0:smooth(thr,thr+0.18,fbm(nM,x*f*0.9+11.3,y*f*0.9-4.1,3));
    const r=1-Math.abs(fbm(nR,x*f*2.6+3.7,y*f*2.6+8.2,4))*2.2;
    const m=mask*Math.max(0,r)*Math.max(0,r);
    mt[i]=m;v+=m*0.6;e[i]=v;
    ms[i]=fbm(nW,x*f*1.4+50,y*f*1.4-20,4);
  }
  let mn=1e9,mx=-1e9,wn=1e9,wx=-1e9;
  for(let i=0;i<N;i++){if(e[i]<mn)mn=e[i];if(e[i]>mx)mx=e[i];if(ms[i]<wn)wn=ms[i];if(ms[i]>wx)wx=ms[i]}
  for(let i=0;i<N;i++){e[i]=(e[i]-mn)/(mx-mn);ms[i]=(ms[i]-wn)/(wx-wn)}
  const wl=quantile(e,o.water);
  const ter=new Uint8Array(N),hp=new Float32Array(N),obj=new Uint8Array(N),ore=new Uint8Array(N),walk=new Uint8Array(N);
  const tree=new Uint8Array(N),bldAt=new Int16Array(N),bldAnchor=new Int16Array(N),path=new Uint8Array(N);
  const classify=i=>{
    const v=e[i];
    if(v<wl-0.05)return T.DEEP;
    if(v<wl)return T.SHALLOW;
    if(v<wl+0.012&&mt[i]<0.3)return T.SAND;
    if(mt[i]>0.48)return v>0.9?T.SNOW:T.MOUNTAIN;
    if(mt[i]>0.3)return T.ROCKY;
    return ms[i]>0.64?T.LUSH:ms[i]<0.3?T.DRY:T.GRASS;
  };
  const height=i=>e[i]<wl?0:Math.pow((e[i]-wl)/(1-wl),1.55)*HP;
  for(let i=0;i<N;i++){ter[i]=classify(i);hp[i]=height(i)}

  /* Bomen (soort per bosje), struiken, stenen, ertsen */
  const pickSpecies=(i,x,y)=>{
    const s=fbm(nS,x*0.05,y*0.05,2)*0.9+0.5+(rand()-0.5)*0.3,t=ter[i];
    if(mt[i]>0.12||hp[i]>HP*0.32)return s<0.35?1:2;
    if(t===T.DRY)return s<0.45?3:s<0.7?0:4;
    if(t===T.LUSH)return s<0.5?0:s<0.8?1:2;
    return s<0.4?0:s<0.6?1:s<0.85?3:4;
  };
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){
    const i=y*W+x,t=ter[i];
    if(t===T.GRASS||t===T.LUSH||t===T.DRY){
      const forest=smooth(0.42,0.78,fbm(nT,x*0.045,y*0.045,3)*0.6+0.5+(ms[i]-0.5)*0.5);
      const p=o.trees*forest*(t===T.DRY?0.35:t===T.LUSH?1:0.8);
      if(rand()<p*0.95){obj[i]=1;tree[i]=pickSpecies(i,x,y)*3+(hash2(x,y)%3)}
      else if(rand()<0.012+forest*0.05*o.trees)obj[i]=3;
      else if(rand()<0.004)obj[i]=2;
    }else if(t===T.ROCKY){if(rand()<0.09)obj[i]=2;else if(rand()<0.03){obj[i]=1;tree[i]=6+(hash2(x,y)%3)}}
    else if(t===T.MOUNTAIN){if(rand()<0.025)obj[i]=2}
    if(t===T.ROCKY||t===T.MOUNTAIN||t===T.SNOW){
      let best=0,bv=0;const lim=[0,0.16,0.16,0.27,0.22];
      for(let k=1;k<=4;k++){const v=fbm(nO,x*0.07+k*91.7,y*0.07-k*47.3,3);if(v>lim[k]&&v-lim[k]>bv){bv=v-lim[k];best=k}}
      ore[i]=best;
    }
  }

  /* Startposities */
  const land=t=>t>=T.SAND&&t<=T.DRY;
  const cand=[];const margin=Math.max(14,Math.floor(W*0.06));
  for(let k=0;k<7000;k++){
    const x=margin+Math.floor(rand()*(W-2*margin)),y=margin+Math.floor(rand()*(H-2*margin)),i=y*W+x;
    if(!(ter[i]===T.GRASS||ter[i]===T.LUSH||ter[i]===T.DRY))continue;
    let ok=true;
    for(let a=0;a<16&&ok;a++)for(const r of [3,6]){
      const xx=Math.round(x+Math.cos(a/16*6.283)*r),yy=Math.round(y+Math.sin(a/16*6.283)*r),j=yy*W+xx;
      if(!land(ter[j])||Math.abs(e[j]-e[i])>0.07){ok=false;break}
    }
    if(!ok)continue;
    let sc=0;
    for(let s=0;s<50;s++){const a=rand()*6.283,r=6+rand()*16;const j=Math.round(y+Math.sin(a)*r)*W+Math.round(x+Math.cos(a)*r);if(j>=0&&j<N){if(obj[j]===1)sc+=1;if(ter[j]===T.ROCKY||ter[j]===T.MOUNTAIN)sc+=0.6;if(land(ter[j]))sc+=0.3}}
    for(let s=0;s<30;s++){const a=rand()*6.283,r=16+rand()*20;const j=Math.round(y+Math.sin(a)*r)*W+Math.round(x+Math.cos(a)*r);if(j>=0&&j<N&&(ter[j]===T.MOUNTAIN||ter[j]===T.ROCKY))sc+=0.5}
    cand.push({x,y,sc});
  }
  const starts=[];
  if(cand.length){
    cand.sort((a,b)=>b.sc-a.sc);
    const top=cand.slice(0,Math.max(1,Math.floor(cand.length*0.25)));
    starts.push(top[Math.floor(rand()*top.length)]);
    const maxSc=cand[0].sc||1;
    while(starts.length<o.players){
      let best=null,bv=-1;
      for(const c of cand){
        let md=1e9;for(const s of starts)md=Math.min(md,Math.hypot(c.x-s.x,c.y-s.y));
        const v=md*(0.75+0.25*c.sc/maxSc);
        if(v>bv){bv=v;best=c}
      }
      if(!best||bv<18)break;
      starts.push(best);
    }
  }
  for(const s of starts){
    const ce=e[s.y*W+s.x];
    for(let dy=-10;dy<=10;dy++)for(let dx=-10;dx<=10;dx++){
      const d=Math.hypot(dx,dy);if(d>10)continue;
      const x=s.x+dx,y=s.y+dy;if(x<0||y<0||x>=W||y>=H)continue;
      const i=y*W+x;if(e[i]<wl+0.01)continue;
      const w=smooth(10,6,d);e[i]=e[i]*(1-w)+ce*w;
      if(d<=8&&ter[i]>=T.ROCKY&&mt[i]<0.6)ter[i]=T.GRASS;
      if(d<=6)obj[i]=0;
      hp[i]=height(i);
    }
  }

  /* Dorpen */
  const blds=[];
  const fits=(type,ax,ay,force)=>{
    const fp=BTYPES[type].fp,ae=e[ay*W+ax];
    for(let dy=fp[2]-1;dy<=fp[3]+2;dy++)for(let dx=fp[0]-1;dx<=fp[1]+1;dx++){
      const x=ax+dx,y=ay+dy;if(x<1||y<1||x>=W-1||y>=H-1)return false;
      const i=y*W+x;if(bldAt[i])return false;
      if(force)continue;
      if(!land(ter[i])||ter[i]===T.SAND&&dy<=fp[3]||Math.abs(e[i]-ae)>0.05)return false;
    }
    return true;
  };
  const place=(type,ax,ay,p)=>{
    const fp=BTYPES[type].fp,ai=ay*W+ax,ae=e[ai],idx=blds.length+1;
    for(let dy=fp[2]-1;dy<=fp[3]+1;dy++)for(let dx=fp[0]-1;dx<=fp[1]+1;dx++){
      const x=ax+dx,y=ay+dy,i=y*W+x;
      e[i]=ae;hp[i]=height(i);obj[i]=0;
      if(dx>=fp[0]&&dx<=fp[1]&&dy>=fp[2]&&dy<=fp[3])bldAt[i]=idx;
    }
    bldAnchor[ai]=idx;
    blds.push({type,x:ax,y:ay,p,seed:hash2(ax,ay)%1000/1000,occ:type==='burcht'?1:0});
  };
  starts.forEach((s,p)=>{
    let ok=false;
    for(let t=0;t<40&&!ok;t++){const ax=s.x+(t?Math.round((rand()-0.5)*4):0),ay=s.y+2+(t?Math.round((rand()-0.5)*4):0);if(fits('burcht',ax,ay,false)){place('burcht',ax,ay,p);s.cx=ax;s.cy=ay;ok=true}}
    if(!ok){place('burcht',s.x,s.y+2,p);s.cx=s.x;s.cy=s.y+2}
    for(const type of VILLAGE){
      const [r0,r1]=type==='wachttoren'?[11,17]:type==='pakhuis'?[5,9]:[6,14];
      for(let t=0;t<260;t++){
        const a=rand()*6.283,r=r0+rand()*(r1-r0),ax=Math.round(s.cx+Math.cos(a)*r),ay=Math.round(s.cy+Math.sin(a)*r);
        if(fits(type,ax,ay,false)){place(type,ax,ay,p);break}
      }
    }
    for(const type of ['kolenmijn','ijzermijn','goudmijn']){const want=BTYPES[type].ore,fp=BTYPES[type].fp;let best=null,bd=1e9;
      for(let t=0;t<2500;t++){const a=rand()*6.283,r=7+rand()*32,ax=Math.round(s.cx+Math.cos(a)*r),ay=Math.round(s.cy+Math.sin(a)*r);
        if(ax<3||ay<4||ax>=W-3||ay>=H-3)continue;let ok=true,hit=0;const ae=e[ay*W+ax];
        for(let dy=fp[2]-1;dy<=fp[3]+1&&ok;dy++)for(let dx=fp[0]-1;dx<=fp[1]+1;dx++){const i=(ay+dy)*W+ax+dx;
          if(bldAt[i]||ter[i]<=T.SAND||ter[i]===T.SNOW||Math.abs(e[i]-ae)>0.14){ok=false;break}if(ore[i]===want)hit++}
        if(!ok)continue;let near=hit;if(!near)for(let k=0;k<24;k++){const i=(ay-4+(k/6|0)*2)*W+ax-5+(k%6)*2;if(i>=0&&i<N&&ore[i]===want)near+=0.3}
        if(!near)continue;const d=r-near*2;if(d<bd){bd=d;best=[ax,ay]}}
      if(best)place(type,best[0],best[1],p)}
  });
  const pathLines=[];
  for(const b of blds){if(b.type==='burcht')continue;const s=starts[b.p];
    const x=b.x+0.5,y=b.y+1.5,tx=s.cx+0.5,ty=s.cy+1.5,d=Math.hypot(tx-x,ty-y),n=Math.ceil(d*2);const pl=[];pathLines.push(pl);
    for(let k=0;k<=n;k++){const t=k/n,wob=Math.sin(t*Math.PI)*Math.sin(b.seed*20)*2.2;
      const px=x+(tx-x)*t+wob*0.5,py=y+(ty-y)*t-wob*0.3,i=(py|0)*W+(px|0);pl.push(px,py);
      if(i>=0&&i<N&&ter[i]>=T.SAND&&!bldAt[i]){path[i]=1;obj[i]=0}}}
  for(const b of blds){if(b.type!=='houthakker'&&b.type!=='bosbouwer')continue;
    for(let k=0;k<(b.type==='bosbouwer'?16:10);k++){const a=rand()*6.283,r=3+rand()*6,x=Math.round(b.x+Math.cos(a)*r),y=Math.round(b.y+Math.sin(a)*r),i=y*W+x;
      if(x>0&&y>0&&x<W-1&&y<H-1&&!bldAt[i]&&!path[i]&&ter[i]>=T.GRASS&&ter[i]<=T.DRY&&obj[i]!==1)obj[i]=b.type==='bosbouwer'?4:5}}
  for(let i=0;i<N;i++){if(obj[i]===0&&(ter[i]===T.GRASS||ter[i]===T.LUSH)&&!bldAt[i]&&!path[i]){const h=hash2(i,77)%1000;if(h<4)obj[i]=4;else if(h<6)obj[i]=5}}
  for(let i=0;i<N;i++)walk[i]=(ter[i]>=T.SAND&&ter[i]<=T.MOUNTAIN&&!bldAt[i])?1:0;
  /* deuren per speler per rol */
  const doors=starts.map(()=>ROLES.map(()=>[]));
  for(const b of blds)ROLES.forEach((r,ri)=>{if(r.bld.includes(b.type))doors[b.p][ri].push([b.x+0.5,b.y+1.5,blds.indexOf(b)])});
  return {W,H,e,hp,ter,obj,ore,walk,ms,wl,starts,tree,bldAt,bldAnchor,blds,doors,path,pathLines,genMs:performance.now()-t0,seed:o.seed};
}
