"use strict";
/* ---------- Grondtexturen (TEX_IMGS uit assets/manifest.json) ---------- */
const TEX={ready:false,bmp:{}};const TEXW=128;
const TKEY=['deep','shallow','sand','grass','grass','grass','rock','rock','rock'];
const TTINT=[null,null,null,null,'rgba(25,70,15,',  'rgba(205,180,70,','rgba(0,0,0,0)', 'rgba(35,28,22,','rgba(246,248,252,'];
const TTA=[0,0,0,0,0.24,0.32,0,0.2,0.88];
async function loadTextures(){try{
  // Alle zes nodig (aarde voor paden); ontbreekt er een, dan blijft de getekende grond
  const keys=['deep','shallow','sand','grass','rock','aarde'],bmp={};
  await Promise.all(keys.map(async k=>{const d=TEX_IMGS[k];if(!d)throw new Error('textuur '+k+' ontbreekt in manifest');bmp[k]=await createImageBitmap(await assetBlob(d))}));
  TEX.bmp=bmp;TEX.ready=true;chunks.clear()}catch(e){console.warn('texturen laden mislukt, getekende grond blijft',e)}}
function renderTexTiles(g,b,pats){
  const {W,H,hp,ter,e,wl}=world,N=W*H;
  const KEYS=['deep','shallow','sand','grass','rock'],KI=[0,1,2,3,3,3,4,4,4];
  const TT=[[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0],[25,70,15,0.24],[205,180,70,0.32],[0,0,0,0],[35,28,22,0.2],[246,248,252,0.88]];
  const lt=v=>{const x=v%W,y=v/W|0;const l=x>0?hp[v-1]:hp[v],r=x<W-1?hp[v+1]:hp[v],u=y>0?hp[v-W]:hp[v],d=y<H-1?hp[v+W]:hp[v];
    return Math.min(1.35,Math.max(0.6,1+(l-r)*0.012+(u-d)*0.022))};
  const dp=v=>ter[v]===T.DEEP?Math.max(0,Math.min(1,(wl-e[v])/0.12)):0;
  for(let y=b.y0;y<b.y1;y++)for(let x=b.x0;x<b.x1;x++){
    const vA=y*W+x,vB=vA+1,vC=vA+W,vD=vC+1,vs=[vA,vB,vC,vD];
    const P=[[SX(x,y),y*TH-hp[vA]],[SX(x+1,y),y*TH-hp[vB]],[SX(x,y+1),(y+1)*TH-hp[vC]],[SX(x+1,y+1),(y+1)*TH-hp[vD]]];
    const ks=vs.map(v=>KI[ter[v]]),ts=vs.map(v=>ter[v]),Ls=vs.map(lt),Ds=vs.map(dp);
    const mixed=ks[0]!==ks[1]||ks[0]!==ks[2]||ks[0]!==ks[3]||ts[0]!==ts[1]||ts[0]!==ts[2]||ts[0]!==ts[3];
    const n=mixed?3:2;
    const pt=(u,v)=>[P[0][0]*(1-u)*(1-v)+P[1][0]*u*(1-v)+P[2][0]*(1-u)*v+P[3][0]*u*v,P[0][1]*(1-u)*(1-v)+P[1][1]*u*(1-v)+P[2][1]*(1-u)*v+P[3][1]*u*v];
    for(let j=0;j<n;j++)for(let i=0;i<n;i++){
      const u0=i/n,u1=(i+1)/n,v0=j/n,v1=(j+1)/n,uc=(u0+u1)/2,vc=(v0+v1)/2;
      const w=[(1-uc)*(1-vc),uc*(1-vc),(1-uc)*vc,uc*vc];
      const a=pt(u0,v0),bq=pt(u1,v0),c=pt(u1,v1),d=pt(u0,v1);
      g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(bq[0],bq[1]);g.lineTo(c[0],c[1]);g.lineTo(d[0],d[1]);g.closePath();
      const kw=[0,0,0,0,0];for(let q=0;q<4;q++)kw[ks[q]]+=w[q];
      let base=0;for(let k=1;k<5;k++)if(kw[k]>kw[base])base=k;
      g.globalAlpha=1;g.fillStyle=g.strokeStyle=pats[KEYS[base]];g.lineWidth=0.6;g.fill();g.stroke();
      for(let k=0;k<5;k++)if(k!==base&&kw[k]>0.02){g.globalAlpha=Math.min(1,kw[k]/(kw[k]+kw[base])*1.15);g.fillStyle=pats[KEYS[k]];g.fill()}
      g.globalAlpha=1;
      let tr=0,tg=0,tb=0,ta=0;for(let q=0;q<4;q++){const t=TT[ts[q]];if(t[3]){const a2=t[3]*w[q];tr+=t[0]*a2;tg+=t[1]*a2;tb+=t[2]*a2;ta+=a2}}
      if(ta>0.005){g.fillStyle=`rgba(${tr/ta|0},${tg/ta|0},${tb/ta|0},${ta})`;g.fill()}
      const dd=Ds[0]*w[0]+Ds[1]*w[1]+Ds[2]*w[2]+Ds[3]*w[3];if(dd>0.01){g.fillStyle=`rgba(5,20,45,${dd*0.35})`;g.fill()}
      const water=(ks[0]<=1)+(ks[1]<=1)+(ks[2]<=1)+(ks[3]<=1);
      if(water<4){const l=Ls[0]*w[0]+Ls[1]*w[1]+Ls[2]*w[2]+Ls[3]*w[3];
        if(l<0.99){g.fillStyle=`rgba(20,15,10,${(1-l)*0.85})`;g.fill()}else if(l>1.01){g.fillStyle=`rgba(255,240,200,${(l-1)*0.5})`;g.fill()}}
    }
  }
  /* zandpaden als zachte lijnen */
  g.globalAlpha=1;g.lineCap='round';g.lineJoin='round';
  const x0=b.x0-3,x1=b.x1+3,y0=b.y0-3,y1=b.y1+3;
  for(const pl of world.pathLines){let hit=false;for(let k=0;k<pl.length;k+=2)if(pl[k]>x0&&pl[k]<x1&&pl[k+1]>y0&&pl[k+1]<y1){hit=true;break}
    if(!hit)continue;
    const draw=(lw,al)=>{g.globalAlpha=al;g.lineWidth=lw;g.strokeStyle=pats.aarde;g.beginPath();
      for(let k=0;k<pl.length;k+=2){const X=pl[k],Y=pl[k+1],sx=SX(X,Y),sy=Y*TH-hAt(X,Y);k?g.lineTo(sx,sy):g.moveTo(sx,sy)}g.stroke()};
    draw(9,0.35);draw(6,0.55);draw(3.5,0.6);}
  g.globalAlpha=1;
}
