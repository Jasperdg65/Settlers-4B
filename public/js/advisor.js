"use strict";
/* ---------- De adviseur (CFG.advisor) ----------
   Een raadgever rechtsonder die één advies tegelijk geeft, hoogste prioriteit eerst. Hij kijkt alleen naar de wereld en
   verandert niets aan de simulatie (dus geen opdrachten, niet deterministisch nodig); de klok is wel het tickgetal, zodat
   hij met het spel pauzeert. Regels: ADV_CHECK[k] geeft null of {bi | x,y, v: waarden voor de tekst}. Per regel in de config:
   soort (tip, waarschuwing, belangrijk, compliment), afkoeltijd in seconden en eigen drempels; prioriteit en uitdrukking
   volgen uit de soort (CFG.advisor.prio, .expr), tenzij de regel een eigen expr heeft. Tekst: t('adv.<k>', v).
   Instellingen (stand en "niet meer tonen" per regel) staan nu in localStorage, later per account. */
const ADV={el:null,cur:null,shown:0,next:{},since:{},done:new Set(),world:null,opt:{mode:'alles',muted:[]}};
for(const e of document.querySelectorAll('[data-t]'))e.textContent=t(e.dataset.t);   // vaste teksten in index.html
try{Object.assign(ADV.opt,JSON.parse(localStorage.getItem('kolonie.adviseur')||'{}'))}catch(e){}
const advSave=()=>{try{localStorage.setItem('kolonie.adviseur',JSON.stringify(ADV.opt))}catch(e){}};
const advSec=s=>s*CFG.ticksPerSec;
/* hoe lang geldt voorwaarde k voor ding id al (in ticks); verdwijnt de voorwaarde, dan begint het opnieuw */
function advLong(k,id,on){const key=k+'#'+id;if(!on){delete ADV.since[key];return 0}return tickNo-(ADV.since[key]??(ADV.since[key]=tickNo))}
const advMine=(p,f)=>world.blds.map((b,bi)=>[b,bi]).filter(([b])=>b.p===p&&!b.dead&&f(b));
const MEALS=['brood','stoofpot','notenmix'];
const ADV_CHECK={
  /* een voltooid werkgebouw staat al even zonder vakman, terwijl het gereedschap er wel is */
  vakman(p,R,tot){
    for(const [b,bi] of advMine(p,b=>!b.st&&BJOB[b.type]!==undefined)){const tool=CFG.jobs[BJOB[b.type]].tool;
      const w=advLong('vakman',bi,!b.occ&&!b.wkr&&(!tool||tot[GI[tool]]>0));
      if(w>advSec(R.wait))return {bi,v:{gebouw:BTYPES[b.type].name,sec:Math.round(w/CFG.ticksPerSec)},ch:'beroepen-en-gereedschap'}}
    return null},
  /* er is geen gereedschap meer voor een gebouw dat op een vakman wacht */
  gereedschap(p,R,tot){
    for(const [b,bi] of advMine(p,b=>!b.st&&!b.occ&&!b.wkr&&BJOB[b.type]!==undefined)){const j=CFG.jobs[BJOB[b.type]];
      if(j.tool&&!tot[GI[j.tool]])return {bi,v:{gebouw:BTYPES[b.type].name,tool:GOODS[GI[j.tool]].n.toLowerCase(),beroep:j.n.toLowerCase()},ch:'beroepen-en-gereedschap'}}
    return null},
  /* geen maaltijden meer, of bijna niet meer */
  voedselOp(p,R,tot){const n=MEALS.reduce((a,k)=>a+tot[GI[k]],0);return n?null:advFood(p)},
  voedselLaag(p,R,tot){const n=MEALS.reduce((a,k)=>a+tot[GI[k]],0);return n&&n<R.min?Object.assign(advFood(p),{v:{n}}):null},
  /* alle vrije dragers zijn al een tijd aan het sjouwen */
  dragers(p,R){let free=0,busy=0;for(let i=0;i<S.n;i++)if(S.pl[i]===p&&!S.job[i]&&!S.ins[i]){free++;if(S.st[i]!==ST.IDLE)busy++}
    const w=advLong('dragers',p,free>0&&busy===free);
    return w>advSec(R.wait)?{bi:advBurcht(p),v:{n:free},ch:'kolonisten-en-dragers'}:null},
  /* een bouwplaats vraagt planken of steen die er niet meer zijn */
  materiaal(p,R,tot){
    for(const [b,bi] of advMine(p,b=>b.st&&b.want))for(const k of ['plank','steen']){const gd=GI[k];
      if(b.want[gd]>b.has[gd]+b.coming[gd]&&!tot[gd])return {bi,v:{gebouw:BTYPES[b.type].name,goed:GOODS[gd].n.toLowerCase()},ch:'hout-en-steen'}}
    return null},
  /* een mijn vindt geen erts meer binnen zijn bereik */
  mijnLeeg(p){
    for(const [b,bi] of advMine(p,b=>!b.st&&b.occ&&CFG.prod[b.type]&&CFG.prod[b.type].mine))
      if(findOre(b,CFG.prod[b.type])<0)return {bi,v:{gebouw:BTYPES[b.type].name,erts:ORE[CFG.prod[b.type].mine]},ch:'mijnen-en-lievelingskost'};
    return null},
  /* een voltooide toren staat al even leeg */
  torenLeeg(p,R){
    for(const [b,bi] of advMine(p,b=>!b.st&&CFG.army.crew[b.type])){
      if(advLong('torenLeeg',bi,!b.occ&&!(b.otw>0))>advSec(R.wait))return {bi,v:{gebouw:BTYPES[b.type].name},ch:'de-krachthal'}}
    return null},
  /* complimenten bij mijlpalen: één keer per wereld */
  houtketen(p){return world.made[p][GI.plank]>0?{bi:advFirst(p,'zagerij'),v:{},ch:'je-eerste-houtketen'}:null},
  brood(p){return world.made[p][GI.brood]>0?{bi:advFirst(p,'bakkerij'),v:{},ch:'een-plantaardige-keuken'}:null},
  toren(p){const t=world.blds.findIndex(b=>b.p===p&&!b.dead&&CFG.army.crew[b.type]&&b.occ&&b.mt>0);return t>=0?{bi:t,v:{},ch:'torens-en-gebied'}:null},
};
const advFirst=(p,type)=>{const i=world.blds.findIndex(b=>b.p===p&&!b.dead&&b.type===type);return i>=0?i:advBurcht(p)};
const advBurcht=p=>world.blds.findIndex(b=>b.p===p&&b.type==='burcht');
function advFood(p){const i=world.blds.findIndex(b=>b.p===p&&!b.dead&&!b.st&&['bakkerij','gaarkeuken','droogschuur'].includes(b.type));
  return {bi:i>=0?i:advBurcht(p),v:{},ch:'een-plantaardige-keuken'}}

/* mag advies k nu getoond worden volgens de instellingen? */
function advAllowed(k){const R=CFG.advisor.rules[k],m=ADV.opt.mode;
  return m!=='uit'&&!ADV.opt.muted.includes(k)&&(m==='alles'||R.soort==='belangrijk')}
/* elke seconde: wat is nu het belangrijkste advies? */
function advisorTick(){
  if(!S.eco||!world||!world.made||!ADV.el)return;
  if(ADV.world!==world.made){ADV.world=world.made;ADV.done.clear();ADV.next={};ADV.since={};advHide()}   // nieuwe wereld
  const p=buildPl(),A=CFG.advisor,tot=stockTotals(p);
  if(ADV.cur&&(tickNo-ADV.shown>advSec(A.showSec)||!advAllowed(ADV.cur.k)))advHide();
  let best=null;
  for(const k in A.rules){const R=A.rules[k];
    if(R.soort==='compliment'&&ADV.done.has(k))continue;
    const r=ADV_CHECK[k](p,R,tot);if(!r)continue;
    if(!advAllowed(k)||(ADV.next[k]||0)>tickNo)continue;
    const pr=A.prio[R.soort];if(!best||pr>best.pr)best={k,pr,...r};
  }
  if(ADV.cur){const still=ADV_CHECK[ADV.cur.k]&&CFG.advisor.rules[ADV.cur.k].soort!=='compliment'?ADV_CHECK[ADV.cur.k](p,A.rules[ADV.cur.k],tot):1;
    if(!still){advHide();}else if(!best||best.pr<=ADV.cur.pr)return}   // het huidige advies blijft, tenzij er iets belangrijkers is
  if(best){if(CFG.advisor.rules[best.k].soort==='compliment')ADV.done.add(best.k);advShow(best)}   // een compliment komt één keer, maar pas als het getoond is
}
if(typeof setInterval==="function")setInterval(advisorTick,1000);   // niet in de Node-tests

/* ---------- beeld ---------- */
function advShow(a){
  const R=CFG.advisor.rules[a.k],expr=R.expr||CFG.advisor.expr[R.soort];
  ADV.cur=a;ADV.shown=tickNo;ADV.next[a.k]=tickNo+advSec(R.cool||0);
  const el=ADV.el;el.dataset.soort=R.soort;
  el.querySelector('.adv-tekst').textContent=t('adv.'+a.k,a.v);
  el.querySelector('.adv-toon').hidden=a.bi===undefined&&a.x===undefined;
  for(const img of el.querySelectorAll('.adv-hoofd img'))img.classList.toggle('aan',img.dataset.expr===expr);
  el.hidden=false;requestAnimationFrame(()=>el.classList.add('open'));
}
function advHide(){
  ADV.cur=null;const el=ADV.el;if(!el||el.hidden)return;el.classList.remove('open');
  setTimeout(()=>{if(!ADV.cur)el.hidden=true},400);
}
/* camera naar het gebouw of de plek van het advies */
function advLook(){
  const a=ADV.cur;if(!a)return;const b=a.bi!==undefined&&a.bi>=0?world.blds[a.bi]:null,x=b?b.x+0.5:a.x,y=b?b.y+0.5:a.y;
  if(x===undefined)return;cam.x=SX(x,y);cam.y=y*TH-hAt(x,y);if(cam.z<1.5)cam.z=1.5;
}
function initAdvisor(){
  const el=ADV.el=$('adviseur'),U=UI_IMGS,url=(d,k)=>`assets/${d.file}_${k}x.webp?v=${d.v}`;
  if(!U.adviseur_rol)return;
  el.querySelector('.adv-naam').textContent=t('adv.naam');
  el.querySelector('.adv-rol').style.borderImageSource=`image-set(url("${url(U.adviseur_rol,1)}") 1x, url("${url(U.adviseur_rol,2)}") 2x)`;
  for(const img of el.querySelectorAll('.adv-hoofd img')){const d=U['adviseur_'+img.dataset.expr];
    img.src=url(d,1);img.srcset=`${url(d,1)} 1x, ${url(d,2)} 2x`;img.alt=t('adv.naam')+' ('+t('adv.expr.'+img.dataset.expr)+')'}
  el.querySelector('.adv-toon').onclick=advLook;
  el.querySelector('.adv-boek').onclick=()=>{if(ADV.cur)open('handleiding/#'+ADV.cur.ch,'_blank','noopener')};
  el.querySelector('.adv-ok').onclick=advHide;
  el.querySelector('.adv-stil').onclick=()=>{if(!ADV.cur)return;ADV.opt.muted.push(ADV.cur.k);advSave();advHide();advPanel()};
  advPanel();
}
/* paneel Adviseur in de zijbalk: stand en wat er stil staat */
function advPanel(){
  const sel=$('advMode');sel.value=ADV.opt.mode;
  const m=ADV.opt.muted.filter(k=>CFG.advisor.rules[k]);
  $('advMuted').textContent=m.length?t('adv.stilLijst',{lijst:m.map(k=>t('adv.soort.'+k)).join(', ')}):'';
  $('advUnmute').hidden=!m.length;
}
$('advMode').onchange=ev=>{ADV.opt.mode=ev.target.value;advSave();if(ADV.opt.mode==='uit')advHide()};
$('advUnmute').onclick=()=>{ADV.opt.muted=[];advSave();advPanel()};
