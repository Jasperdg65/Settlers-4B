"use strict";
/* ---------- Krachthal en bemanning (mijlpaal 6c, CFG.army) ----------
   Krachtpatsers zijn kolonisten met beroep krachtpatser (S.job = JI.krachtpatser) en niveau S.lvl: 0 = rekruut in opleiding, 1–3.
   De krachthal (gebouwsleutel kazerne) haalt vrije dragers binnen tot haar reserve (b.keep, in te stellen in het paneel Productie)
   vol is, leidt ze een voor een op tot niveau 1 en traint ze met uitrusting bij de deur naar een hoger niveau (CFG.army.up);
   de uitrusting wordt gedragen, dus verbruikt. Een wachttoren (CFG.army.crew) haalt zijn bemanning bij de dichtstbijzijnde
   krachtpatser: van buiten of uit de reserve van een krachthal. Een toren met minstens één krachtpatser binnen is bemand en
   geeft gebied (computeLand). b.crew = wie er binnen is, b.otw = wie er op weg naartoe is, b.trn = wie er nu traint.
   Mijlpaal 8c: een krachthal houdt ook muzikanten (S.job = JI.muzikant) in b.band (b.bandK plaatsen, b.botw onderweg); ze worden
   opgeleid zoals een rekruut en lopen mee naar een grensduel. b.pri = wie als eerste een niveau hoger traint. */
const isHall=b=>b.type==='kazerne';
const isCrewB=b=>isHall(b)||!!CFG.army.crew[b.type];
const crewCap=b=>isHall(b)?b.keep:CFG.army.crew[b.type]||0;
const isMus=c=>S.job[c]===JI.muzikant;
const isFolk=c=>S.job[c]===JI.krachtpatser||S.job[c]===JI.muzikant;
const members=(b,c)=>isMus(c)?b.band:b.crew;
/* velden van een bemand gebouw (ook voor gebouwen die later geplaatst worden) */
function cr(b){
  if(!b.crew){b.crew=[];b.otw=0;b.trn=-1;b.keep=isHall(b)?CFG.army.hall.keep:0}
  if(!b.band){b.band=[];b.botw=0;b.bandK=isHall(b)?CFG.army.hall.band:0;b.pri=-1}
  return b}
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
    /* een krachthal neemt eerst een krachtpatser of muzikant zonder thuis aan, anders een vrije drager als rekruut */
    const hire=job=>{let c=nearestIdle(b.p,doorTile(b),job);
      if(c<0){if(freeCarriers(b.p)<=CFG.carry.keepFree)return -1;c=nearestIdle(b.p,doorTile(b),0);if(c<0)return -1;S.job[c]=job;S.lvl[c]=0}
      return c};
    if(crewCap(b)-b.crew.length-b.otw>0){
      const c=isHall(b)?hire(JI.krachtpatser):nearestFighter(b.p,b.x,b.y);
      if(c>=0){sendCrew(c,bi);made++}
    }
    if(isHall(b)&&b.bandK-b.band.length-b.botw>0&&made<M){const c=hire(JI.muzikant);if(c>=0){sendCrew(c,bi);made++}}
  }
  return made;
}
function sendCrew(c,bi){
  if(S.ins[c])leaveCrew(c);
  const b=world.blds[bi];if(isMus(c))b.botw++;else b.otw++;S.dst[c]=bi;S.wait[c]=0;goPath(c,ST.PATH_IN,doorTile(b));
}
/* uit het gebouw waar hij nu zit (S.dst) naar buiten, bij de deur */
function leaveCrew(c){
  const h=world.blds[S.dst[c]],L=members(h,c),k=L.indexOf(c);if(k>=0)L.splice(k,1);
  S.ins[c]=0;S.x[c]=S.px[c]=h.x+0.5;S.y[c]=S.py[c]=h.y+1.5;toIdle(c);
  if(!h.crew.length&&h.occ){h.occ=0;if(CFG.territory[h.type])computeLand()}
}
/* bij de deur (enterBuilding): naar binnen als er nog plaats is; een rekruut die nergens heen kan, is weer drager */
function enterCrew(c){
  const b=cr(world.blds[S.dst[c]]),m=isMus(c);if(m)b.botw=Math.max(0,b.botw-1);else b.otw=Math.max(0,b.otw-1);
  if(b.dead||b.st||(m?b.band.length>=b.bandK:b.crew.length>=crewCap(b))){if(!S.lvl[c])S.job[c]=0;toIdle(c);return}
  S.ins[c]=1;S.st[c]=ST.INSIDE;S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5;members(b,c).push(c);
  if(m)return;
  if(!b.occ){b.occ=1;if(CFG.territory[b.type]){b.mt=tickNo;computeLand()}}   // eerste bewoner van een toren: gebied erbij
}
/* geen route naar het gebouw (gotPath) */
function crewFail(c,b){cr(b);if(isMus(c))b.botw=Math.max(0,b.botw-1);else b.otw=Math.max(0,b.otw-1);if(!S.lvl[c])S.job[c]=0}
/* gebouw b wordt afgebroken: iedereen naar buiten; een rekruut verliest zijn opleiding en is weer drager */
function releaseCrew(b){
  if(!b.crew)return;cr(b);
  for(const c of [...b.crew,...b.band]){if(S.st[c]===ST.FIELD)continue;   // buiten (grensduel, verplaatsen): ziet het bij aankomst
    S.ins[c]=0;S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5;toIdle(c);if(!S.lvl[c])S.job[c]=0}
  b.crew=[];b.band=[];b.trn=-1;b.pri=-1;b.run=0;
}
/* krachthal, elke tick: opleiden en trainen, een tegelijk */
function tickHall(b,bi){
  cr(b);const A=CFG.army;
  if(b.trn>=0){if(--b.pt>0)return;const c=b.trn;b.trn=-1;b.run=0;if(members(b,c).includes(c)){S.lvl[c]++;if(b.pri===c)b.pri=-1}}
  for(const c of [...b.crew,...b.band])if(!S.lvl[c]&&S.ins[c]){b.trn=c;b.pt=A.train;break}
  if(b.pri>=0&&!b.crew.includes(b.pri))b.pri=-1;
  if(b.trn<0)for(const c of b.pri>=0?[b.pri,...b.crew]:b.crew){   // wie voorgaat (b.pri) eerst
    const need=A.up[S.lvl[c]+1];if(!need||!S.ins[c])continue;
    const ss=Object.keys(need).map(k=>freeUnitAt(bi,GI[k]));if(ss.some(s=>s<0))continue;
    for(const s of ss){takeOne(s);TR.used++}b.trn=c;b.pt=A.upTicks;break;
  }
  b.run=b.trn>=0?1:0;
  /* vraag: uitrusting voor wie een niveau hoger kan, hoogstens hall.stock per stuk */
  b.want.fill(0);
  for(const c of b.crew){const need=A.up[S.lvl[c]+1];if(need&&c!==b.trn)for(const k in need)b.want[GI[k]]=Math.min(A.hall.stock,b.want[GI[k]]+need[k])}
  const tr=b.trn<0?'':isMus(b.trn)?t('hal.leidtMuzikantOp'):S.lvl[b.trn]?t('hal.traint',{niveau:LVLNAME[S.lvl[b.trn]+1].toLowerCase()}):t('hal.leidtOp');
  b.ps=[t('hal.reserve',{n:b.crew.length,max:b.keep}),b.bandK?t('hal.band',{n:b.band.length,max:b.bandK}):'',tr||(b.crew.length||b.otw?'':t('hal.wacht'))].filter(Boolean).join(' · ');
}
/* ---------- Buiten voor een grensduel (mijlpaal 8b, deals.js) ----------
   De krachtpatser loopt als eenheid uit army.js (S.ast, armyGo, walkArmy; S.st = ST.FIELD), maar blijft in b.crew staan: zijn
   toren blijft bemand, dus de grens verschuift niet terwijl hij weg is. Na het duel loopt hij terug (de verliezer eerst naar
   de burcht om bij te komen) en gaat weer naar binnen, uitgerust. Is zijn toren intussen afgebroken, dan is hij gewoon vrij. */
function fieldOut(c){
  const b=world.blds[S.dst[c]];S.ins[c]=0;S.st[c]=ST.FIELD;S.path[c]=null;S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5;
  S.ast[c]=AS.IDLE;S.ko[c]=0;S.du[c]=0;S.fed[c]=1;S.wait[c]=0;
}
function fieldGoHome(c){const b=world.blds[S.dst[c]];armyGo(c,b.x+0.5,b.y+1.5,AIM.HOME)}
function fieldHome(c){
  const b=world.blds[S.dst[c]];S.ast[c]=AS.IDLE;S.fat[c]=0;S.ko[c]=0;
  if(b&&!b.dead&&b.crew&&members(cr(b),c).includes(c)){S.ins[c]=1;S.st[c]=ST.INSIDE;S.path[c]=null;S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5}
  else toIdle(c);
}
/* elke tick vanuit tickCarriers, zoals tickArmy per eenheid */
function fieldStep(c){
  const D=CFG.duel,st=S.ast[c];
  if(st===AS.WALK)walkArmy(c);
  else if(st===AS.OUT){if(S.out[c]>0){S.out[c]--;S.fat[c]=D.afterOut+(1-D.afterOut)*S.out[c]/D.outTicks}else{S.ko[c]=0;fieldGoHome(c)}}
  else if(st===AS.IDLE&&!S.du[c])fieldGoHome(c);
  if(st!==AS.DUEL&&!S.ko[c]&&S.fat[c]>0)S.fat[c]=Math.max(0,S.fat[c]-D.rest);
}
/* ---------- Verplaatsen in het eigen dorp (mijlpaal 8c, opdracht post) ----------
   Een krachtpatser uit een toren of krachthal loopt naar een andere eigen toren of krachthal (S.mv = doel + 1, AIM.POST). Onderweg
   blijft hij bij zijn oude gebouw horen, zoals bij een grensduel, zodat een toren bemand blijft tot hij aankomt. Is het doel vol,
   dan ruilt hij met de zwakste daar (lager niveau), die naar het oude gebouw loopt. In een krachthal gaat hij voor bij het trainen. */
function swapOf(b,c){
  let best=-1;for(const x of b.crew)if(S.ins[x]&&b.trn!==x&&S.lvl[x]<S.lvl[c]&&(best<0||S.lvl[x]<S.lvl[best]))best=x;
  return best;
}
const isFull=b=>!isHall(b)&&b.crew.length+b.otw>=crewCap(b);
/* waarom krachtpatser c niet naar gebouw ti kan, of '' */
function postWhy(c,ti){
  const b=world.blds[ti];
  if(!(c>=0&&c<S.n)||S.job[c]!==JI.krachtpatser||!S.lvl[c]||!S.ins[c]||S.du[c])return 'wie';
  if(!b||b.dead||b.st||b.p!==S.pl[c]||!isCrewB(b))return 'doel';
  if(S.dst[c]===ti)return 'al';
  const h=cr(world.blds[S.dst[c]]);cr(b);
  if(h.trn===c)return 'traint';
  const full=isFull(b);if(full&&swapOf(b,c)<0)return 'vol';
  if(!isHall(h)&&!full&&!h.otw&&!h.crew.some(x=>x!==c&&S.ins[x]))return 'laatste';   // de toren zou leeg raken
  return '';
}
function runPost(c){
  for(const k of c.ids||[]){if(S.pl[k]!==c.p||postWhy(k,c.b))continue;
    const b=world.blds[c.b];b.otw++;S.mv[k]=c.b+1;fieldOut(k);armyGo(k,b.x+0.5,b.y+1.5,AIM.POST)}
}
/* aangekomen bij het doel (army.js: arriveArmy) */
function postArrive(c){
  const ti=S.mv[c]-1,b=world.blds[ti],hi=S.dst[c],h=world.blds[hi];S.mv[c]=0;S.ast[c]=AS.IDLE;
  if(b)b.otw=Math.max(0,b.otw-1);
  const back=()=>{if(h&&!h.dead&&h.crew.includes(c))fieldGoHome(c);else fieldHome(c)};
  if(!b||b.dead||b.st||Math.hypot(S.x[c]-b.x-0.5,S.y[c]-b.y-1.5)>2)return back();   // afgebroken, of geen route
  if(!isHall(b)&&b.crew.length>=crewCap(b)){
    const x=swapOf(b,c);if(x<0)return back();
    b.crew.splice(b.crew.indexOf(x),1);
    if(h&&!h.dead&&isCrewB(h)){h.crew.push(x);S.dst[x]=hi;fieldOut(x);S.x[x]=S.px[x]=b.x+0.5;S.y[x]=S.py[x]=b.y+1.5;armyGo(x,h.x+0.5,h.y+1.5,AIM.HOME)}
    else{S.dst[x]=ti;leaveCrew(x)}
  }
  const k=h&&h.crew?h.crew.indexOf(c):-1;if(k>=0)h.crew.splice(k,1);
  S.dst[c]=ti;b.crew.push(c);fieldHome(c);
  if(isHall(b)&&CFG.army.up[S.lvl[c]+1])b.pri=c;
  if(!b.occ){b.occ=1;if(CFG.territory[b.type]){b.mt=tickNo;computeLand()}}
  if(h&&!h.crew.length&&h.occ){h.occ=0;if(CFG.territory[h.type])computeLand()}
}

/* ---------- Bediening: paneel Krachtpatsers en de modus 'kp' op de kaart (alleen weergave en invoer) ----------
   Klik een eigen toren of krachthal: zijn krachtpatsers zijn gekozen (in de lijst weer uit te zetten). Klik daarna een ander eigen
   gebouw: ze lopen erheen (opdracht post). */
const KP={sel:[],from:-1,msg:''};
const kpPl=()=>buildPl();
function kpWhere(c){const b=world.blds[S.dst[c]];return b?BTYPES[b.type].name:''}
function kpHover(x,y){
  const p=kpPl(),bi=world.bldAt[y*world.W+x]-1,b=bi>=0?world.blds[bi]:null;BUILD.hover=-1;BUILD.why='';
  if(!b||b.p!==p||b.st||!isCrewB(b))return KP.sel.length?t('kp.kiesDoel'):t('kp.kiesGebouw');
  BUILD.hover=bi;
  if(!KP.sel.length||bi===KP.from)return t('kp.kies',{gebouw:BTYPES[b.type].name,n:cr(b).crew.filter(c=>S.ins[c]&&S.lvl[c]).length});
  const why=KP.sel.map(c=>postWhy(c,bi)).find(w=>w&&w!=='al');BUILD.why=KP.sel.every(c=>postWhy(c,bi))?why||'al':'';
  return BUILD.why?t('kp.niet.'+BUILD.why):t('kp.stuur',{n:KP.sel.filter(c=>!postWhy(c,bi)).length,gebouw:BTYPES[b.type].name});
}
function kpClick(){
  const bi=BUILD.hover;if(bi<0){KP.sel=[];KP.from=-1;kpUI();return}
  if(KP.sel.length&&bi!==KP.from){if(BUILD.why){KP.msg=t('kp.niet.'+BUILD.why);kpUI();return}
    const ids=KP.sel.filter(c=>!postWhy(c,bi));order({p:kpPl(),t:'post',ids,b:bi});
    KP.msg=t('kp.onderweg',{n:ids.length,gebouw:BTYPES[world.blds[bi].type].name});KP.sel=[];KP.from=-1;kpUI();return}
  const b=world.blds[bi];KP.from=bi;KP.sel=b.crew.filter(c=>S.ins[c]&&S.lvl[c]);KP.msg='';kpUI();
}
function kpUI(){
  if(!$('kpList').classList)return;   // Node-tests
  const p=kpPl(),halls=world.blds.filter(b=>isHall(b)&&b.p===p&&!b.dead&&!b.st).map(cr);
  $('kpMode').classList.toggle('on',BUILD.mode==='kp');
  for(const e of document.querySelectorAll('.kphall'))e.hidden=!halls.length;
  if(halls.length){const h=halls[0];$('kpKeep').value=String(h.keep);$('kpBand').value=String(h.bandK);
    $('kpHire').disabled=h.keep>=CFG.army.hall.keeps[CFG.army.hall.keeps.length-1]}
  KP.sel=KP.sel.filter(c=>S.ins[c]&&S.pl[c]===p&&S.job[c]===JI.krachtpatser);
  const rows=KP.sel.map(c=>{const b=world.blds[S.dst[c]],up=CFG.army.up[S.lvl[c]+1],first=b&&isHall(b)&&b.pri===c;
    return `<div class="kprow"><button class="kpx" data-c="${c}" title="${t('kp.uit')}">×</button><span>${LVLNAME[S.lvl[c]]} · ${t('kp.kracht',{n:strength(c).toFixed(2).replace('.',',')})} · ${kpWhere(c)}</span>`+
      (b&&isHall(b)&&up?`<button class="kpt" data-c="${c}"${first?' disabled':''}>${first?t('kp.gaatVoor'):t('kp.trainEerst')}</button>`:'')+'</div>'}).join('');
  $('kpList').innerHTML=rows;
  $('kpMsg').textContent=KP.msg||(BUILD.mode==='kp'?KP.sel.length?t('kp.uitleg2'):t('kp.uitleg'):'');
}
$('kpMode').onclick=()=>{setBuildMode(BUILD.mode==='kp'?null:'kp');KP.sel=[];KP.from=-1;KP.msg='';kpUI()};
$('kpList').onclick=ev=>{const e=ev.target,c=+e.dataset.c;if(!e.dataset.c)return;
  if(e.classList.contains('kpx'))KP.sel=KP.sel.filter(x=>x!==c);
  else if(e.classList.contains('kpt')){order({p:kpPl(),t:'train',id:c});KP.msg=t('kp.voorrang')}
  kpUI()};
const kpHalls=f=>{const p=kpPl();world.blds.forEach((b,bi)=>{if(isHall(b)&&b.p===p&&!b.dead)f(bi)})};
$('kpKeep').onchange=ev=>kpHalls(bi=>order({p:kpPl(),t:'keep',b:bi,n:+ev.target.value}));
$('kpBand').onchange=ev=>kpHalls(bi=>order({p:kpPl(),t:'band',b:bi,n:+ev.target.value}));
$('kpHire').onclick=()=>{const K=CFG.army.hall.keeps;kpHalls(bi=>{const b=cr(world.blds[bi]),n=K.find(n=>n>b.keep);if(n!==undefined)order({p:kpPl(),t:'keep',b:bi,n})});KP.msg=t('kp.aangenomen')};
$('kpKeep').innerHTML=CFG.army.hall.keeps.map(n=>`<option value="${n}">${n}</option>`).join('');
$('kpBand').innerHTML=CFG.army.hall.bands.map(n=>`<option value="${n}">${n}</option>`).join('');
/* opdracht train {id}: krachtpatser id gaat in zijn krachthal voor bij het trainen */
function runTrain(c){const i=c.id|0,b=world.blds[S.dst[i]];if(b&&isHall(b)&&b.p===c.p&&S.pl[i]===c.p&&cr(b).crew.includes(i)&&CFG.army.up[S.lvl[i]+1])b.pri=i}

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
