"use strict";
/* ---------- Krachthal en bemanning (mijlpaal 6c, CFG.army) ----------
   Krachtpatsers zijn kolonisten met beroep krachtpatser (S.job = JI.krachtpatser) en niveau S.lvl: 0 = rekruut in opleiding, 1–3.
   De krachthal (gebouwsleutel kazerne) haalt vrije dragers binnen tot haar reserve (b.keep, in te stellen in het paneel Productie)
   vol is, leidt ze een voor een op tot niveau 1 en traint ze met uitrusting bij de deur naar een hoger niveau (CFG.army.up);
   de uitrusting wordt gedragen, dus verbruikt. Een wachttoren (CFG.army.crew) haalt zijn bemanning bij de dichtstbijzijnde
   krachtpatser: van buiten of uit de reserve van een krachthal. Een toren met minstens één krachtpatser binnen is bemand en
   geeft gebied (computeLand). b.crew = wie er binnen is, b.otw = wie er op weg naartoe is, b.trn = wie er nu traint. */
const isHall=b=>b.type==='kazerne';
const isCrewB=b=>isHall(b)||!!CFG.army.crew[b.type];
const crewCap=b=>isHall(b)?b.keep:CFG.army.crew[b.type]||0;
/* velden van een bemand gebouw (ook voor gebouwen die later geplaatst worden) */
function cr(b){if(!b.crew){b.crew=[];b.otw=0;b.trn=-1;b.keep=isHall(b)?CFG.army.hall.keep:0}return b}
/* dichtstbijzijnde opgeleide krachtpatser van speler p die een toren kan bemannen: vrij buiten, of in de reserve van een krachthal */
function nearestFighter(p,x,y){
  let best=-1,bd=Infinity;
  for(let i=0;i<S.n;i++){
    if(S.pl[i]!==p||S.job[i]!==JI.krachtpatser||!S.lvl[i])continue;
    if(S.ins[i]){const h=world.blds[S.dst[i]];if(!isHall(h)||h.trn===i)continue}else if(S.st[i]!==ST.IDLE)continue;
    const d=Math.hypot(S.x[i]-x,S.y[i]-y);if(d<bd){bd=d;best=i}
  }
  return best;
}
/* torens bemannen en krachthallen aanvullen (vanuit planTransport); geeft het aantal opdrachten */
function planCrew(M){
  const bl=world.blds;let made=0;
  for(let bi=0;bi<bl.length&&made<M;bi++){
    const b=bl[bi];if(b.dead||b.st||!isCrewB(b)||b.cool>tickNo)continue;cr(b);
    if(crewCap(b)-b.crew.length-b.otw<=0)continue;
    let c;
    if(isHall(b)){   // eerst een krachtpatser zonder thuis, anders een vrije drager als rekruut
      c=nearestIdle(b.p,doorTile(b),JI.krachtpatser);
      if(c<0){if(freeCarriers(b.p)<=CFG.carry.keepFree)continue;c=nearestIdle(b.p,doorTile(b),0);if(c<0)continue;S.job[c]=JI.krachtpatser;S.lvl[c]=0}
    }else{c=nearestFighter(b.p,b.x,b.y);if(c<0)continue}
    sendCrew(c,bi);made++;
  }
  return made;
}
function sendCrew(c,bi){
  if(S.ins[c])leaveCrew(c);
  const b=world.blds[bi];b.otw++;S.dst[c]=bi;S.wait[c]=0;goPath(c,ST.PATH_IN,doorTile(b));
}
/* uit het gebouw waar hij nu zit (S.dst) naar buiten, bij de deur */
function leaveCrew(c){
  const h=world.blds[S.dst[c]],k=h.crew.indexOf(c);if(k>=0)h.crew.splice(k,1);
  S.ins[c]=0;S.x[c]=S.px[c]=h.x+0.5;S.y[c]=S.py[c]=h.y+1.5;toIdle(c);
  if(!h.crew.length){h.occ=0;if(CFG.territory[h.type])computeLand()}
}
/* bij de deur (enterBuilding): naar binnen als er nog plaats is; een rekruut die nergens heen kan, is weer drager */
function enterCrew(c){
  const b=world.blds[S.dst[c]];b.otw=Math.max(0,b.otw-1);
  if(b.dead||b.st||b.crew.length>=crewCap(b)){if(!S.lvl[c])S.job[c]=0;toIdle(c);return}
  S.ins[c]=1;S.st[c]=ST.INSIDE;S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5;b.crew.push(c);
  if(!b.occ){b.occ=1;if(CFG.territory[b.type]){b.mt=tickNo;computeLand()}}   // eerste bewoner van een toren: gebied erbij
}
/* geen route naar het gebouw (gotPath) */
function crewFail(c,b){b.otw=Math.max(0,b.otw-1);if(!S.lvl[c])S.job[c]=0}
/* gebouw b wordt afgebroken: iedereen naar buiten; een rekruut verliest zijn opleiding en is weer drager */
function releaseCrew(b){
  if(!b.crew)return;
  for(const c of b.crew){S.ins[c]=0;S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5;toIdle(c);if(!S.lvl[c])S.job[c]=0}
  b.crew=[];b.trn=-1;b.run=0;
}
/* krachthal, elke tick: opleiden en trainen, een tegelijk */
function tickHall(b,bi){
  cr(b);const A=CFG.army;
  if(b.trn>=0){if(--b.pt>0)return;const c=b.trn;b.trn=-1;b.run=0;if(b.crew.includes(c))S.lvl[c]++}
  for(const c of b.crew)if(!S.lvl[c]){b.trn=c;b.pt=A.train;break}
  if(b.trn<0)for(const c of b.crew){
    const need=A.up[S.lvl[c]+1];if(!need)continue;
    const ss=Object.keys(need).map(k=>freeUnitAt(bi,GI[k]));if(ss.some(s=>s<0))continue;
    for(const s of ss){takeOne(s);TR.used++}b.trn=c;b.pt=A.upTicks;break;
  }
  b.run=b.trn>=0?1:0;
  /* vraag: uitrusting voor wie een niveau hoger kan, hoogstens hall.stock per stuk */
  b.want.fill(0);
  for(const c of b.crew){const need=A.up[S.lvl[c]+1];if(need&&c!==b.trn)for(const k in need)b.want[GI[k]]=Math.min(A.hall.stock,b.want[GI[k]]+need[k])}
  const tr=b.trn<0?'':S.lvl[b.trn]?t('hal.traint',{niveau:LVLNAME[S.lvl[b.trn]+1].toLowerCase()}):t('hal.leidtOp');
  b.ps=[t('hal.reserve',{n:b.crew.length,max:b.keep}),tr||(b.crew.length||b.otw?'':t('hal.wacht'))].filter(Boolean).join(' · ');
}
/* tooltip van een toren */
function crewLabel(b){
  if(!CFG.army.crew[b.type]||b.st||b.dead)return '';cr(b);
  const lv=[1,2,3].map(l=>b.crew.filter(c=>S.lvl[c]===l).length);
  return ' · '+t('toren.bemanning',{n:b.crew.length,max:crewCap(b)})+(b.crew.length?' ('+lv.map((n,l)=>n?n+'× '+LVLNAME[l+1].toLowerCase():'').filter(Boolean).join(', ')+')':'')+
    (b.otw?' · '+t('toren.onderweg',{n:b.otw}):'')+' · '+(b.occ?t('toren.gebied'):t('toren.geenGebied'));
}
/* startdorp: elke toren meteen bemand met army.startCrew krachtpatsers van niveau 1 */
function seatStartCrew(){
  world.blds.forEach((b,bi)=>{b.crew=null;cr(b);if(b.dead||!CFG.army.crew[b.type])return;   // eerst leeg: dezelfde kaart kan opnieuw beginnen
    for(let k=0;k<CFG.army.startCrew;k++){const c=nearestIdle(b.p,doorTile(b),0);if(c<0)return;S.job[c]=JI.krachtpatser;S.lvl[c]=1;b.otw++;S.dst[c]=bi;enterCrew(c)}});
}
