"use strict";
/* ---------- 3D-poppetjes: spritesheets uit tools/render_sprites.py ----------
   manifest.units[sleutel] = {json, v}. De JSON noemt per maat (px = hoogte van het poppetje) de atlas, het masker
   en per beeld {anim, dir, i, x, y, w, h, ax, ay}. Richting 0 = oost (schermrechts), met de klok mee per 45°.
   Omkleuren: het masker (grijswaarde) zegt hoeveel spelerkleur een pixel krijgt; per speler en maat één keer
   uitgerekend, pas als het nodig is. ROLE3D koppelt een rol en niveau aan een model; zonder atlas blijft de tekening. */
let UNIT3D_IMGS={};const U3D={};
const UNIT3D_H=18;                 // hoogte van het poppetje (px-maat) in wereldeenheden, gelijk aan de getekende figuren
const ROLE3D={2:['soldaat_1','soldaat_2','soldaat_3']}; // rol Soldaat, niveau 1–3
async function loadUnits3D(){
  await Promise.all(Object.entries(UNIT3D_IMGS).map(async([key,d])=>{try{
    const r=await fetch('assets/'+d.json+'?v='+d.v);if(!r.ok)throw new Error(d.json+': HTTP '+r.status);
    const meta=await r.json(),sizes=[];
    for(const s of meta.sizes){
      const [b,m]=await Promise.all([s.file,s.mask].map(f=>assetBlob({file:f,v:d.v}).then(createImageBitmap)));
      const F={};for(const f of s.frames)((F[f.anim]||(F[f.anim]=[]))[f.dir]||(F[f.anim][f.dir]=[]))[f.i]=f;
      sizes.push({px:s.px,base:b,mask:m,F,pc:[]});
    }
    sizes.sort((a,b)=>a.px-b.px);U3D[key]={meta,sizes};
  }catch(e){console.warn('3D-poppetje '+key+' laden mislukt, de tekening blijft',e)}}));
  if(Object.keys(U3D).length&&typeof buildGallery==='function'&&$('people').children.length)buildGallery();
}
/* atlas in de kleur van speler p */
function unit3DAtlas(sz,p){
  if(sz.pc[p])return sz.pc[p];
  const w=sz.base.width,h=sz.base.height,c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(sz.mask,0,0);const mk=g.getImageData(0,0,w,h).data;
  g.clearRect(0,0,w,h);g.drawImage(sz.base,0,0);const im=g.getImageData(0,0,w,h),d=im.data;
  const n=parseInt(PCOL[p].slice(1),16),pr=(n>>16)/255,pg=(n>>8&255)/255,pb=(n&255)/255;
  for(let k=0;k<d.length;k+=4){const m=mk[k]/255;if(m<0.01)continue;d[k]*=1-m+m*pr;d[k+1]*=1-m+m*pg;d[k+2]*=1-m+m*pb}
  g.putImageData(im,0,0);return sz.pc[p]=c;
}
/* kleinste maat die op het scherm nog minstens zo groot is (zd = zoom × dpr) */
function unit3DSize(u,zd){const need=UNIT3D_H*zd;for(const s of u.sizes)if(s.px>=need)return s;return u.sizes[u.sizes.length-1]}
/* tekent beeld (anim, dir, i) van model key voor speler p met de voeten op (x, y); false als het model (nog) niet geladen is */
function drawUnit3D(key,anim,dir,i,p,x,y,zd){
  const u=U3D[key];if(!u)return false;const sz=unit3DSize(u,zd),a=sz.F[anim]||sz.F.idle,fr=a[dir][i%a[dir].length],k=UNIT3D_H/sz.px;
  ctx.drawImage(unit3DAtlas(sz,p),fr.x,fr.y,fr.w,fr.h,x-fr.ax*k,y-fr.ay*k,fr.w*k,fr.h*k);return true;
}
/* richting 0–7 uit een stap (dx, dy) in tegels: schermrichting, met de diepte terug naar de grond (camera 30° → ×2) */
function dir8(dx,dy){const sx=dx*TW-dy*TW/2,sy=dy*TH;return Math.round(Math.atan2(2*sy,sx)/(Math.PI/4))&7}
/* losse sprite {c,w,h,ax,ay} van een model (naar de kijker, stilstaand) voor de galerij */
function unit3DSprite(key,p=0){
  const u=U3D[key];if(!u)return null;const sz=u.sizes[u.sizes.length-1],fr=sz.F.idle[2][0],c=document.createElement('canvas');
  c.width=fr.w;c.height=fr.h;c.getContext('2d').drawImage(unit3DAtlas(sz,p),fr.x,fr.y,fr.w,fr.h,0,0,fr.w,fr.h);
  const k=UNIT3D_H/sz.px;return {c,w:fr.w*k,h:fr.h*k,ax:fr.ax*k,ay:fr.ay*k};
}
