"use strict";
/* ---------- Weergave ---------- */
const cv=$('view'),ctx=cv.getContext('2d');
let dpr=1,vw=1,vh=1;
function resize(){const r=cv.getBoundingClientRect();dpr=Math.min(2,window.devicePixelRatio||1);vw=Math.max(1,r.width);vh=Math.max(1,r.height);cv.width=Math.round(vw*dpr);cv.height=Math.round(vh*dpr)}
new ResizeObserver(resize).observe(cv);resize();

let world=null,chunks=new Map(),frameNo=0;
const CHUNK_PX=24e6; // budget gecachte grondchunks in pixels (~96 MB); bij veel zichtbare chunks 1,5× wat in beeld is
const cam={x:0,y:0,z:1};
const SX=(x,y)=>x*TW-y*TW/2+world.H*TW/2;

function chunkBounds(cx,cy){
  const {W,H}=world;const x0=cx*CH,y0=cy*CH,x1=Math.min(W-1,x0+CH),y1=Math.min(H-1,y0+CH);
  return {x0,y0,x1,y1,left:SX(x0,y1)-TW,right:SX(x1,y0)+TW,top:y0*TH-HP-10,bottom:y1*TH+6};
}
function renderChunk(cx,cy,cres=1){
  const b=chunkBounds(cx,cy),{W,hp,ter,e,wl,bldAt,path}=world;
  const c=document.createElement('canvas');
  c.width=Math.ceil((b.right-b.left)*cres);c.height=Math.ceil((b.bottom-b.top)*cres);
  const g=c.getContext('2d');g.scale(cres,cres);g.translate(-b.left,-b.top);g.lineWidth=0.7;g.lineJoin='round';
  const pats=TEX.ready?{}:null;
  if(pats)for(const k in TEX.bmp){const bm=TEX.bmp[k],p=g.createPattern(bm,'repeat'),S=bm.width;p.setTransform(new DOMMatrix([TEXW/S,0,-TEXW/2/S,TEXW/2/S,world.H*TW/2,0]));pats[k]=p}
  if(pats){renderTexTiles(g,b,pats);}else
  for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){
    const a=y*W+x,bb=a+1,cc=a+W,dd=cc+1;
    const ax=SX(x,y),ay=y*TH-hp[a],by=y*TH-hp[bb],cy2=(y+1)*TH-hp[cc],dy=(y+1)*TH-hp[dd];
    let r=0,gg=0,bl=0;for(const k of [a,bb,cc,dd]){const t=TCOL[ter[k]];r+=t[0];gg+=t[1];bl+=t[2]}
    r/=4;gg/=4;bl/=4;
    if(bldAt[a]&&bldAt[dd]){r=r*0.55+176*0.45;gg=gg*0.55+150*0.45;bl=bl*0.55+104*0.45}
    const pn=path[a]+path[bb]+path[cc]+path[dd];if(pn){const k=Math.min(0.85,pn*0.24);r=r*(1-k)+192*k;gg=gg*(1-k)+160*k;bl=bl*(1-k)+108*k}
    let shd;
    if(ter[a]<=T.SHALLOW&&ter[dd]<=T.SHALLOW)shd=0.8+Math.max(0,(e[a]-(wl-0.12))/0.12)*0.3;
    else shd=Math.min(1.4,Math.max(0.55,1+(hp[a]-hp[dd])*0.045+(hp[cc]-hp[bb])*0.012));
    const j=((hash2(x,y)&15)-7.5)*1.4;
    const col=`rgb(${Math.min(255,r*shd+j)|0},${Math.min(255,gg*shd+j)|0},${Math.min(255,bl*shd+j*0.6)|0})`;
    g.fillStyle=col;g.strokeStyle=col;
    g.beginPath();g.moveTo(ax,ay);g.lineTo(ax+TW,by);g.lineTo(ax+TW/2,dy);g.lineTo(ax-TW/2,cy2);g.closePath();g.fill();g.stroke();
  }
  /* platte aankleding: graspollen, bloemen, riet, kiezels */
  for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){
    const i=y*W+x,t=ter[i];if(bldAt[i]||path[i])continue;if(TEX.ready&&t!==T.SAND&&t!==T.ROCKY&&t!==T.MOUNTAIN)continue;
    const h=hash2(x*3+1,y*5+2);
    for(let k=0;k<2;k++){
      const hh=hash2(h,k),fx=(hh&255)/255,fy=(hh>>>8&255)/255;
      const px=SX(x+fx,y+fy),py=(y+fy)*TH-hp[i]*(1-fx*0.5)-hp[i+1<world.W*world.H?i+1:i]*fx*0.5*0+0;
      const sel=(hh>>>16)%100;
      if((t===T.GRASS||t===T.LUSH)&&sel<35){
        g.strokeStyle=t===T.LUSH?'rgba(48,96,36,.75)':'rgba(70,118,44,.7)';g.lineWidth=0.6;g.beginPath();
        g.moveTo(px-1.2,py);g.lineTo(px-1.8,py-2.4);g.moveTo(px,py);g.lineTo(px,py-3);g.moveTo(px+1.2,py);g.lineTo(px+1.9,py-2.3);g.stroke();
      }else if((t===T.GRASS||t===T.LUSH)&&sel<45){
        const fc=['#f4e04a','#fbf8ef','#c86ad6','#e2493f','#7fb6ec'][(hh>>>24)%5];
        g.fillStyle='rgba(60,110,40,.8)';g.fillRect(px-0.3,py-1.6,0.6,1.6);
        g.fillStyle=fc;g.beginPath();g.arc(px,py-1.9,0.9,0,6.283);g.fill();
      }else if(t===T.DRY&&sel<30){
        g.strokeStyle='rgba(150,130,70,.8)';g.lineWidth=0.6;g.beginPath();g.moveTo(px-1,py);g.lineTo(px-1.6,py-2);g.moveTo(px,py);g.lineTo(px+0.3,py-2.6);g.moveTo(px+1,py);g.lineTo(px+1.7,py-1.9);g.stroke();
      }else if(t===T.SAND&&sel<40){
        let nearW=false;for(const n of [i-1,i+1,i-W,i+W])if(ter[n]<=T.SHALLOW)nearW=true;
        if(nearW){g.strokeStyle='#6f8a3c';g.lineWidth=0.5;g.beginPath();for(let r2=-1;r2<=1;r2++){g.moveTo(px+r2*1.1,py);g.lineTo(px+r2*1.6,py-4.5-(r2&1))}g.stroke();
          g.fillStyle='#6b4a2b';g.fillRect(px-0.2,py-5,0.9,1.8)}
        else{g.fillStyle='rgba(160,140,100,.6)';g.beginPath();g.arc(px,py-0.4,0.6,0,6.283);g.fill()}
      }else if((t===T.ROCKY||t===T.MOUNTAIN)&&sel<30){
        g.fillStyle=sel%2?'rgba(90,85,78,.6)':'rgba(190,184,172,.6)';g.beginPath();g.ellipse(px,py-0.4,1.1,0.6,0,0,6.283);g.fill();
      }
    }
  }
  return {c,left:b.left,top:b.top,used:frameNo,cres};
}
