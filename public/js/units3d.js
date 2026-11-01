"use strict";
/* ---------- 3D-poppetjes: spritesheets uit tools/render_sprites.py ----------
   manifest.units[sleutel] = {json, v}. De JSON noemt per maat (px = hoogte van het poppetje) de atlas, het masker
   en per beeld {anim, dir, i, x, y, w, h, ax, ay}. Richting 0 = oost (schermrechts), met de klok mee per 45°.
   Omkleuren: het masker (grijswaarde) zegt hoeveel spelerkleur een pixel krijgt; per speler en maat één keer
   uitgerekend, pas als het nodig is. ROLE3D koppelt een rol en niveau aan een model; zonder atlas blijft de tekening. */
let UNIT3D_IMGS={},DUEL3D_IMGS={},ANIMAL3D_IMGS={};const U3D={},D3D={},A3D={};
const UNIT3D_H=18;                 // hoogte van het poppetje (px-maat) in wereldeenheden, gelijk aan de getekende figuren
const ROLE3D={0:['drager_leeg','drager_leeg','drager_leeg'],          // rol Drager (stresstest): één model
  2:['krachtpatser_1','krachtpatser_2','krachtpatser_3'],              // rol Krachtpatser, niveau 1–3 (junior, medior, senior)
  4:['heler_1','heler_2','heler_3'],5:['muzikant_1','muzikant_2','muzikant_3']};   // heler en muzikant (fluit, harp, doedelzak)
/* economie: vrije drager zonder kist, drager met een goed met kist (het goed zelf tekent loop.js op punt 'hold') */
const CARRY3D={free:'drager_leeg',carry:'drager_kist'};
/* vakmensen: model 'ambacht_<beroep>' (bron/ambachten, met een eigen loopclip). Die laden pas als zo'n vakman voor het eerst
   getekend wordt (samen ruim 10 MB); tot dan, en voor beroepen zonder model, blijft het getekende figuurtje. */
const JOB3D_LOAD={};
function job3D(job){
  const key='ambacht_'+CFG.jobs[job].k;if(U3D[key])return key;
  if(UNIT3D_IMGS[key]&&!JOB3D_LOAD[key])JOB3D_LOAD[key]=loadSheets({[key]:UNIT3D_IMGS[key]},U3D,(F,f)=>put3(F,f.anim,f.dir,f.i,f),'3D-vakman');
  return null;
}
/* duel-sprites (manifest.duels): per maat F[niveau links][niveau rechts][stand 1–9]; zelfde schaal als de poppetjes */
async function loadSheets(imgs,out,index,what){
  await Promise.all(Object.entries(imgs).map(async([key,d])=>{try{
    const r=await fetch('assets/'+d.json+'?v='+d.v);if(!r.ok)throw new Error(d.json+': HTTP '+r.status);
    const meta=await r.json(),sizes=[];
    for(const s of meta.sizes){
      const [b,m]=await Promise.all([s.file,s.mask].map(f=>f?assetBlob({file:f,v:d.v}).then(createImageBitmap):null));   // dieren: geen masker
      const F={};for(const f of s.frames)index(F,f);
      sizes.push({px:s.px,base:b,mask:m,F,pc:[]});
    }
    sizes.sort((a,b)=>a.px-b.px);out[key]={meta,sizes};
  }catch(e){console.warn(what+' '+key+' laden mislukt, de tekening blijft',e)}}));
}
const put3=(F,a,b,c,f)=>(((F[a]||(F[a]=[]))[b]||(F[a][b]=[]))[c]=f);
async function loadUnits3D(){
  const now=Object.fromEntries(Object.entries(UNIT3D_IMGS).filter(([k])=>!k.startsWith('ambacht_')));   // vakmensen: later (job3D)
  await Promise.all([loadSheets(now,U3D,(F,f)=>put3(F,f.anim,f.dir,f.i,f),'3D-poppetje'),
    loadSheets(DUEL3D_IMGS,D3D,(F,f)=>put3(F,f.lvlL,f.lvlR,f.stand,f),'duel-sprite'),
    loadSheets(ANIMAL3D_IMGS,A3D,(F,f)=>put3(F,f.anim,f.dir,f.i,f),'3D-dier')]);
  if(Object.keys(U3D).length&&typeof buildGallery==='function'&&$('people').children.length)buildGallery();
}
/* atlas in de kleur van speler p */
function unit3DAtlas(sz,p){
  if(!sz.mask)return sz.base;if(sz.pc[p])return sz.pc[p];
  const w=sz.base.width,h=sz.base.height,c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(sz.mask,0,0);const mk=g.getImageData(0,0,w,h).data;
  g.clearRect(0,0,w,h);g.drawImage(sz.base,0,0);const im=g.getImageData(0,0,w,h),d=im.data;
  const n=parseInt(PCOL[p].slice(1),16),pr=(n>>16)/255,pg=(n>>8&255)/255,pb=(n&255)/255;
  for(let k=0;k<d.length;k+=4){const m=mk[k]/255;if(m<0.01)continue;d[k]*=1-m+m*pr;d[k+1]*=1-m+m*pg;d[k+2]*=1-m+m*pb}
  g.putImageData(im,0,0);return sz.pc[p]=c;
}
/* kleinste maat die op het scherm nog minstens zo groot is (zd = zoom × dpr) */
function unit3DSize(u,zd){const need=UNIT3D_H*zd;for(const s of u.sizes)if(s.px>=need)return s;return u.sizes[u.sizes.length-1]}
/* tekent beeld (anim, dir, i) van model key voor speler p met de voeten op (x, y); geeft {fr, k} terug
   (beeld uit de JSON en schaal atlas-px → wereld), of null als het model (nog) niet geladen is */
/* duel-sprite: masker R = linker deelnemer (speler pL), G = rechter (speler pR); per maat en spelerpaar één keer omgekleurd */
function duel3DAtlas(sz,pL,pR){
  const key=pL*16+pR;if(sz.pc[key])return sz.pc[key];
  const w=sz.base.width,h=sz.base.height,c=document.createElement('canvas');c.width=w;c.height=h;
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(sz.mask,0,0);const mk=g.getImageData(0,0,w,h).data;
  g.clearRect(0,0,w,h);g.drawImage(sz.base,0,0);const im=g.getImageData(0,0,w,h),d=im.data;
  const rgb=p=>{const n=parseInt(PCOL[p].slice(1),16);return [(n>>16)/255,(n>>8&255)/255,(n&255)/255]},L=rgb(pL),R=rgb(pR);
  for(let k=0;k<d.length;k+=4){const a=mk[k]/255,b=mk[k+1]/255;if(a+b<0.01)continue;const o=1-a-b;
    d[k]*=o+a*L[0]+b*R[0];d[k+1]*=o+a*L[1]+b*R[1];d[k+2]*=o+a*L[2]+b*R[2]}
  g.putImageData(im,0,0);return sz.pc[key]=c;
}
/* tekent duel key met niveaus (lvlL, lvlR) in stand 1–9 met de tafel op (x, y); false als hij (nog) niet geladen is */
function drawDuel3D(key,lvlL,lvlR,stand,pL,pR,x,y,zd,g=ctx){
  const u=D3D[key];if(!u)return false;const sz=unit3DSize(u,zd),fr=sz.F[lvlL]&&sz.F[lvlL][lvlR]&&sz.F[lvlL][lvlR][stand];if(!fr)return false;
  const k=UNIT3D_H/sz.px;g.drawImage(duel3DAtlas(sz,pL,pR),fr.x,fr.y,fr.w,fr.h,x-fr.ax*k,y-fr.ay*k,fr.w*k,fr.h*k);return true;
}
function drawUnit3D(key,anim,dir,i,p,x,y,zd,g=ctx,src=U3D){
  const u=src[key];if(!u)return null;const sz=unit3DSize(u,zd),a=sz.F[anim]||sz.F.idle,fr=a[dir][i%a[dir].length],k=UNIT3D_H/sz.px;
  g.drawImage(unit3DAtlas(sz,p),fr.x,fr.y,fr.w,fr.h,x-fr.ax*k,y-fr.ay*k,fr.w*k,fr.h*k);return {fr,k};
}
/* richting 0–7 uit een stap (dx, dy) in tegels: schermrichting, met de diepte terug naar de grond (camera 30° → ×2) */
function dir8(dx,dy){const sx=dx*TW-dy*TW/2,sy=dy*TH;return Math.round(Math.atan2(2*sy,sx)/(Math.PI/4))&7}
/* controlebeeld op spelgrootte: per model in ROLE3D[role] een figuur in rood en een in blauw, op zoom 1 en 2 */
function unit3DPreview(role=2){
  const keys=ROLE3D[role];if(!keys.every(k=>U3D[k]))return null;const d=Math.min(2,devicePixelRatio||1),W=300,H=110;
  const c=document.createElement('canvas');c.width=W*d;c.height=H*d;c.style.width=W+'px';c.style.height=H+'px';
  const g=c.getContext('2d');g.scale(d,d);g.fillStyle='#86aa46';g.fillRect(0,0,W,H);g.imageSmoothingQuality='high';
  g.fillStyle='rgba(0,0,0,.55)';g.font='11px "Source Sans 3",sans-serif';g.fillText('zoom 1',4,12);g.fillText('zoom 2',4,58);
  for(const [z,y0,step] of [[1,44,22],[2,104,46]])keys.forEach((k,l)=>[0,1].forEach(p=>{
    const x=(z===1?52:40)+(l*2+p)*step;g.save();g.translate(x,y0);g.scale(z,z);drawUnit3D(k,'idle',2,0,p,0,0,z*d,g);g.restore()}));
  return c;
}
/* losse sprite {c,w,h,ax,ay} van een model (naar de kijker, stilstaand) voor de galerij */
function unit3DSprite(key,p=0){
  const u=U3D[key];if(!u)return null;const sz=u.sizes[u.sizes.length-1],fr=sz.F.idle[2][0],c=document.createElement('canvas');
  c.width=fr.w;c.height=fr.h;c.getContext('2d').drawImage(unit3DAtlas(sz,p),fr.x,fr.y,fr.w,fr.h,0,0,fr.w,fr.h);
  const k=UNIT3D_H/sz.px;return {c,w:fr.w*k,h:fr.h*k,ax:fr.ax*k,ay:fr.ay*k};
}
