"use strict";
/* ---------- Galerij en werkbank voor geschilderde gebouwen ---------- */
function thumb(s,w,h,scale){const c=document.createElement('canvas');const d=Math.min(2,devicePixelRatio||1);c.width=w*d;c.height=h*d;c.style.width=w+'px';c.style.height=h+'px';
  const g=c.getContext('2d');g.scale(d,d);const k=scale||Math.min((w-4)/s.w,(h-4)/s.h);g.drawImage(s.c,(w-s.w*k)/2,(h-s.h*k)/2,s.w*k,s.h*k);return c}
const DB={db:null,
  open(){return new Promise(res=>{try{const r=indexedDB.open('kolonie',1);r.onupgradeneeded=()=>r.result.createObjectStore('sprites');
    r.onsuccess=()=>{this.db=r.result;res()};r.onerror=()=>res()}catch(e){res()}})},
  put(k,v){try{this.db&&this.db.transaction('sprites','readwrite').objectStore('sprites').put(v,k)}catch(e){}},
  del(k){try{this.db&&this.db.transaction('sprites','readwrite').objectStore('sprites').delete(k)}catch(e){}},
  all(){return new Promise(res=>{if(!this.db)return res([]);const out=[];try{const rq=this.db.transaction('sprites').objectStore('sprites').openCursor();
    rq.onsuccess=()=>{const c=rq.result;if(c){out.push([c.key,c.value]);c.continue()}else res(out)};rq.onerror=()=>res(out)}catch(e){res(out)}})}};
async function setCustom(type,blob,opts){
  let bmp;try{bmp=await createImageBitmap(blob)}catch(e){$('cbMsg').textContent='Dit bestand kan niet als afbeelding worden gelezen. Gebruik PNG of WebP.';return}
  const base=bldSprite(type,0,PCOL);const prev=CUSTOM[type];
  CUSTOM[type]={bmp,blob,w:opts&&opts.w||prev&&prev.w||base.w*1.15,ax:opts&&opts.ax!=null?opts.ax:0.5,ay:opts&&opts.ay!=null?opts.ay:0.9};
  customSpr(type);saveCustom(type);buildGallery();refreshCustomUI();
}
function saveCustom(type){const c=CUSTOM[type];if(c)DB.put(type,{blob:c.blob,w:c.w,ax:c.ax,ay:c.ay})}
const SAPL=[],STUMP=[];
async function loadNature(){
  const mk=async k=>{const d=NATURE_IMGS[k];if(!d)return null;
    try{const bmp=await createImageBitmap(await assetBlob(d));const h=d.h,w=h*bmp.width/bmp.height;return {c:bmp,w,h,ax:w*d.ax,ay:h*d.ay}}
    catch(e){console.warn('natuur: '+k+' niet geladen, getekende versie blijft',e);return null}};
  const scaled=(s,f)=>s&&{c:s.c,w:s.w*f,h:s.h*f,ax:s.ax*f,ay:s.ay*f};
  const keys=['eik0','eik1','berk0','berk1','den0','den1','beuk0','beuk1','appel0','appel1','bes','hazel','varen','bloesem','rots0','rots1','rots2','rots3','kiem','jong','stronk'];
  const S={};(await Promise.all(keys.map(mk))).forEach((s,i)=>S[keys[i]]=s);
  // Per plek vervangen (index = variant*2 + gespiegeld); ontbreekt een afbeelding, dan blijft daar de getekende sprite
  const put=(arr,i,s)=>{if(s){arr[i*2]=s;arr[i*2+1]=flipped2(s)}};
  ['eik','berk','den','beuk','appel'].forEach((n,i)=>{const a=S[n+'0'],b=S[n+'1'];put(TREES,i*3,a);put(TREES,i*3+1,b);put(TREES,i*3+2,scaled(a,0.86))});
  ['rots0','rots1','rots2','rots3'].forEach((k,i)=>put(STONES,i,S[k]));
  const B=['bes','hazel','varen','bloesem'].map(k=>S[k]).filter(Boolean);
  if(B.length){BUSHES.length=0;for(const s of B)BUSHES.push(s,flipped2(s))}
  const ki=S.kiem||S.jong,jo=S.jong||S.kiem;if(ki)SAPL.push(ki,flipped2(ki),jo,flipped2(jo));
  if(S.stronk)STUMP.push(S.stronk,flipped2(S.stronk));
}
function flipped2(s){const c=document.createElement('canvas');c.width=s.c.width;c.height=s.c.height;const g=c.getContext('2d');g.translate(c.width,0);g.scale(-1,1);g.drawImage(s.c,0,0);
  return {c,w:s.w,h:s.h,ax:s.w-s.ax,ay:s.ay}}
async function loadCustom(){await DB.open();const seen=new Set();
  for(const [k,v] of await DB.all()){if(!BTYPES[k])continue;seen.add(k);if(!v||!v.blob)continue;
    try{CUSTOM[k]={bmp:await createImageBitmap(v.blob),blob:v.blob,w:v.w,ax:v.ax,ay:v.ay};customSpr(k)}catch(e){}}
  for(const [k,d] of Object.entries(DEFAULT_IMGS)){if(seen.has(k))continue;
    try{const blob=await assetBlob(d);CUSTOM[k]={bmp:await createImageBitmap(blob),blob,w:d.w,ax:d.ax,ay:d.ay,builtin:true};customSpr(k)}catch(e){}}}
let cbType='woonhuis';
function refreshCustomUI(){
  const sel=$('cbType');if(!sel.options.length)for(const k of Object.keys(BTYPES)){if(BTYPES[k].off)continue;const o=document.createElement('option');o.value=k;o.textContent=BTYPES[k].name;sel.appendChild(o)}
  sel.value=cbType;const c=CUSTOM[cbType];
  for(const id of ['cbW','cbAx','cbAy','cbDel'])$(id).disabled=!c;
  if(c){$('cbW').value=Math.round(c.w);$('cbAx').value=c.ax;$('cbAy').value=c.ay}
  $('cbWV').textContent=c?Math.round(c.w)+' px':'–';$('cbAxV').textContent=c?Math.round(c.ax*100)+'%':'–';$('cbAyV').textContent=c?Math.round(c.ay*100)+'%':'–';
  $('cbMsg').textContent=c?'Eigen afbeelding actief. Stel grootte en ankerpunt af tot het gebouw goed op zijn plek staat.':'Nog de getekende versie. Kies of sleep een afbeelding om die te vervangen.';
}
function buildGallery(){
  const pu=$('people');pu.innerHTML='';
  const lv3=ROLE3D[2].map(k=>unit3DSprite(k));
  [[0,0,'Drager'],[0,2,'Draagster'],[1,0,'Bouwer'],[3,0,'Boog­schutter'],[4,1,'Heler']].forEach(([r,v,n])=>{
    const fig=document.createElement('figure');fig.appendChild(thumb(UNITS[r][v][0][0],44,54,2.2));
    const cap=document.createElement('figcaption');cap.textContent=n;fig.appendChild(cap);pu.appendChild(fig)});
  /* drager als 3D-poppetje: vrij en met kist */
  [['drager_leeg','Drager (3D)'],['drager_kist','Drager met kist']].forEach(([k,n])=>{const sp=unit3DSprite(k);if(!sp)return;
    const fig=document.createElement('figure');fig.appendChild(thumb(sp,44,54));const cap=document.createElement('figcaption');cap.textContent=n;fig.appendChild(cap);pu.appendChild(fig)});
  /* krachtpatser junior/medior/senior als 3D-poppetje (als de atlassen geladen zijn), plus controlestrook op spelgrootte */
  if(lv3.every(Boolean))lv3.forEach((sp,k)=>{const fig=document.createElement('figure');fig.appendChild(thumb(sp,44,54));
    const cap=document.createElement('figcaption');cap.textContent='Krachtpatser '+['junior','medior','senior'][k];fig.appendChild(cap);pu.appendChild(fig)});
  const pv=unit3DPreview(2),box=$('people3d');box.innerHTML='';if(pv){box.appendChild(pv);box.hidden=false}else box.hidden=true;
  /* beroepen van de economie */
  CFG.jobs.forEach((j,k)=>{if(!k)return;const fig=document.createElement('figure');fig.appendChild(thumb(jobSprite(k,0,0,0),44,54,2.2));
    const cap=document.createElement('figcaption');cap.textContent=j.n;fig.appendChild(cap);pu.appendChild(fig)});
  const gb=$('buildings');gb.innerHTML='';
  for(const k of Object.keys(BTYPES)){if(BTYPES[k].off)continue;
    const fig=document.createElement('figure');fig.tabIndex=0;fig.className='bfig'+(CUSTOM[k]?' custom':'')+(k===cbType?' sel':'');
    fig.title='Klik om te kiezen, of sleep een afbeelding hierheen';
    fig.appendChild(thumb(bldSprite(k,0,PCOL),74,62));
    const cap=document.createElement('figcaption');cap.textContent=BTYPES[k].name.replace(/ \(.*\)/,'');fig.appendChild(cap);
    const pick=()=>{cbType=k;refreshCustomUI();buildGallery()};
    fig.onclick=pick;fig.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();pick()}};
    fig.ondragover=ev=>{ev.preventDefault();fig.classList.add('over')};fig.ondragleave=()=>fig.classList.remove('over');
    fig.ondrop=ev=>{ev.preventDefault();fig.classList.remove('over');const f=ev.dataTransfer.files[0];if(f){cbType=k;setCustom(k,f)}};
    gb.appendChild(fig);
  }
}
$('cbType').onchange=ev=>{cbType=ev.target.value;refreshCustomUI();buildGallery()};
$('cbFile').onchange=ev=>{const f=ev.target.files[0];if(f)setCustom(cbType,f);ev.target.value=''};
for(const [id,key] of [['cbW','w'],['cbAx','ax'],['cbAy','ay']])$(id).addEventListener('input',ev=>{const c=CUSTOM[cbType];if(!c)return;
  c[key]=+ev.target.value;customSpr(cbType);refreshCustomUI()});
for(const id of ['cbW','cbAx','cbAy'])$(id).addEventListener('change',()=>{saveCustom(cbType);buildGallery()});
$('cbDel').onclick=()=>{delete CUSTOM[cbType];DB.put(cbType,{removed:true});buildGallery();refreshCustomUI()};
$('cbGo').onclick=()=>{if(!world)return;const b=world.blds.find(b=>b.type===cbType&&b.p===0)||world.blds.find(b=>b.type===cbType);
  if(b){centerOn(b.x+0.5,b.y-1);cam.z=3;clampCam()}};
