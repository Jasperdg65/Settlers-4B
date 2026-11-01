"use strict";
/* ---------- Productie (mijlpaal 5) ----------
   CFG.prod zegt per gebouwtype wat het doet. Twee soorten:
   - buitenwerker (gather): de vakman loopt binnen zijn werkgebied (CFG.prod[type].area tegels rond de deur, op eigen
     grond) naar het dichtstbijzijnde doel, werkt daar, brengt het product naar zijn deur en rust dan binnen.
     tree = boom kappen (wordt een stronk), stone = steenblok bewerken (raakt op), plant = boompje planten (groeit uit),
     farm = rijpe akker oogsten of anders een nieuwe zaaien (world.crop = gewas, obj 6 groeit, 7 rijp),
     pick = fruit of noten plukken van appelboom, bessenstruik of hazelaar (world.pickT = wanneer er weer vruchten zijn).
   - werkplaats (in → out): de vakman verwerkt binnen wat er bij de deur ligt; de planner brengt de invoer (b.want).
   Wat een gebouw maakt en zelf niet vraagt, brengen dragers naar de opslag (transport.js). Elk gebouw houdt een
   toestand b.ps bij voor de tooltip en het paneel Productie. Natuur: boompjes groeien en stronken vergaan via
   wachtrijen op tijd (NAT), zodat er niet elke tick over de hele kaart gelopen hoeft te worden. */
let NAT=null;
function initProduction(){
  const {W,H,obj}=world,N=W*H,c=CFG.nature;
  world.res=new Uint8Array(N);world.rsv=new Uint8Array(N);world.oreRes=new Uint8Array(N);
  for(let i=0;i<N;i++)if(world.ore[i])world.oreRes[i]=CFG.prod.mineUnits;world.crop=new Uint8Array(N);world.pickT=new Uint32Array(N);world.made=world.starts.map(()=>new Uint32Array(GOODS.length));
  NAT={sap:[],sapH:0,stump:[],stumpH:0,crop:[],cropH:0};
  for(let i=0;i<N;i++){
    if(obj[i]===2)world.res[i]=c.stoneUnits;
    else if(obj[i]===4)NAT.sap.push([hash2(i,5)%c.grow,i]);        // boompjes van de kaartgenerator groeien op een willekeurig moment uit
    else if(obj[i]===5)NAT.stump.push([hash2(i,9)%c.stump,i]);
  }
  NAT.sap.sort((a,b)=>a[0]-b[0]);NAT.stump.sort((a,b)=>a[0]-b[0]);
  for(const b of world.blds){b.meals=0;b.pt=0;b.run=0;b.ps='';b.pend=null;b.alt=0;b.make='auto';b.rec=null;b.born=0}
}
/* natuur: elke CFG.nature.every ticks */
function tickNature(){
  const {obj,tree}=world;
  while(NAT.sapH<NAT.sap.length&&NAT.sap[NAT.sapH][0]<=tickNo){const i=NAT.sap[NAT.sapH++][1];
    if(obj[i]===4){obj[i]=1;tree[i]=(hash2(i,tickNo)%4)*3+hash2(i,3)%3}}   // eik, berk, den of beuk; appelbomen plant de plukker (5b)
  while(NAT.stumpH<NAT.stump.length&&NAT.stump[NAT.stumpH][0]<=tickNo){const i=NAT.stump[NAT.stumpH++][1];if(obj[i]===5)obj[i]=0}
  /* akkers: de wachtrij is per gewas niet op tijd gesorteerd (verschillende groeitijden), dus de rijpe vooraan eruit */
  while(NAT.cropH<NAT.crop.length&&NAT.crop[NAT.cropH][0]<=tickNo){const i=NAT.crop[NAT.cropH++][1];if(obj[i]===6)obj[i]=7}
  for(const k of ['sap','stump','crop'])if(NAT[k+'H']>512){NAT[k].splice(0,NAT[k+'H']);NAT[k+'H']=0}
}
/* past er nog een stuk van gd bij gebouw bi, terwijl er keep lege plekken overblijven? (een onvolle stapel van gd telt altijd) */
function roomFor(bi,gd,keep=0){const st=world.stk,M=CFG.stackMax;let e=0;
  for(const i of bldSlots(bi)){const s=st[i]-1;if(s<0)e++;else if(G.bld[s]===bi&&G.good[s]===gd&&G.cnt[s]<M)return true}return e>keep}
/* invoer van een werkplaats laat bij de deur één lege plek per product over, zodat het product altijd kwijt kan */
function inputRoom(bi,gd){const b=world.blds[bi],pc=CFG.prod[b.type];if(!pc||pc.gather||!allIn(b.type).includes(GOODS[gd].k))return true;
  return roomFor(bi,gd,outCount(b.type))}
/* vraag van een gebouw: de invoer van zijn werkplaats (woonhuizen en torens vragen voedsel vanaf mijlpaal 6) */
function setWant(b){
  b.want.fill(0);const pc=CFG.prod[b.type];
  if(b.type==='woonhuis'&&(b.born||0)<CFG.pop.house)for(const k of CFG.pop.food)b.want[GI[k]]=CFG.pop.stock;
  if(pc&&!pc.gather)for(const k of allIn(b.type))b.want[GI[k]]=pc.stock;
  if(pc&&pc.mine)for(const k of CFG.prod.mineMeals)if(k!==CFG.mineFood[b.type])b.want[GI[k]]=CFG.prod.mineOtherStock;
}
/* recepten van een werkplaats: [{k, in, out}]. Smidse en uitrustingsmaker hebben er meer. Een mijn heeft geen vaste invoer:
   zijn maaltijd regelt tryRecipe (mealFor), maar de maaltijden tellen wel als invoer (allIn) voor vraag en stapelplekken */
const RECIPES={};
function recipes(type){
  if(RECIPES[type])return RECIPES[type];const pc=CFG.prod[type];
  return RECIPES[type]=pc.recipes?Object.keys(pc.recipes).map(k=>({k,in:pc.recipes[k],out:{[k]:1}})):[{k:'',in:pc.mine?{}:pc.in,out:pc.out}];
}
const allIn=type=>[...new Set([...recipes(type).flatMap(r=>Object.keys(r.in)),...(CFG.prod[type].mine?CFG.prod.mineMeals:[])])];
const outCount=type=>Math.max(...recipes(type).map(r=>Object.keys(r.out).length));
const made=(b,gd,n)=>{world.made[b.p][gd]+=n};
/* voorraad per speler, hoogstens één keer per tick uitgerekend (voor de grens CFG.prod.enough) */
let prodTotT=-1,prodTot=[];
function enough(b,keys){
  if(prodTotT!==tickNo){prodTotT=tickNo;prodTot=[]}const t=prodTot[b.p]||(prodTot[b.p]=stockTotals(b.p));
  const lim=(CFG.prod[b.type]||{}).enough||CFG.prod.enough;   // een gebouwtype mag een eigen grens hebben
  for(const k of keys)if(t[GI[k]]<lim)return '';
  return 'genoeg '+keys.map(k=>GOODS[GI[k]].n.toLowerCase()).join(' en ')+' op voorraad';
}
function tickProduction(){
  if(tickNo%CFG.nature.every===0)tickNature();
  const bl=world.blds;
  for(let bi=0;bi<bl.length;bi++){
    const b=bl[bi],pc=CFG.prod[b.type];
    if(b.type==='woonhuis'&&!b.dead&&!b.st){tickHouse(b,bi);continue}
    if(!pc||b.dead||b.st)continue;
    if(!b.occ){b.ps='wacht op een vakman';continue}
    const c=b.wkr-1;if(c<0||S.st[c]!==ST.INSIDE)continue;          // buiten aan het werk, of onderweg naar buiten
    if(b.pend){for(const p of b.pend)p[1]=addGoods(bi,p[0],p[1]);b.pend=b.pend.some(p=>p[1])?b.pend:null;if(b.pend){b.ps='opslag bij de deur vol';continue}}
    if(b.pt>0){if(--b.pt===0&&b.run)finishBatch(b,bi,pc);continue}   // b.run: er loopt een ronde (anders is het rust of wachten)
    if(pc.gather)startGather(b,bi,pc,c);else startBatch(b,bi,pc);
  }
}
/* ---------- Werkplaats ---------- */
/* een ronde beginnen: het eerste recept (automatisch: het product waarvan de speler het minst heeft) waarvoor de invoer
   bij de deur ligt, het product kwijt kan en de speler er nog niet genoeg van heeft. Anders de reden van het eerste. */
function startBatch(b,bi,pc){
  let list=recipes(b.type);
  if(b.make&&b.make!=='auto')list=list.filter(r=>r.k===b.make);
  else if(list.length>1){enough(b,[]);const t=prodTot[b.p];list=list.slice().sort((x,y)=>t[GI[x.k]]-t[GI[y.k]])}
  let why='';
  for(const r of list){
    const w=tryRecipe(b,bi,pc,r);if(!w)return;if(!why)why=w;
  }
  b.ps=why;if(why.startsWith('genoeg'))b.pt=CFG.nature.every*5;
}
function tryRecipe(b,bi,pc,r){
  const full=enough(b,Object.keys(r.out));if(full)return full;
  let ore=-1,meal=null;if(pc.mine){ore=findOre(b,pc);if(ore<0)return 'geen '+ORE[pc.mine]+' meer in de buurt';
    if(!(b.meals>0)){meal=mealFor(b,bi);if(!meal)return 'wacht op een maaltijd (het liefst '+GOODS[GI[CFG.mineFood[b.type]]].n.toLowerCase()+')'}}
  const src=[];
  for(const k in r.in)for(let n=0;n<r.in[k];n++){const s=freeUnitAt(bi,GI[k]);if(s<0||src.includes(s)&&G.cnt[s]-G.res[s]<=src.filter(x=>x===s).length)return 'wacht op '+GOODS[GI[k]].n.toLowerCase();src.push(s)}
  for(const k in r.out)if(!roomFor(bi,GI[k]))return 'opslag bij de deur vol';
  for(const s of src)takeOne(s);TR.used+=src.length;
  if(meal){takeOne(meal[0]);TR.used++;b.meals=meal[1]}if(pc.mine)b.meals--;
  b.rec=r;b.ore=ore;b.pt=pc.ticks;b.run=1;b.ps=r.k&&recipes(b.type).length>1?'maakt '+GOODS[GI[r.k]].n.toLowerCase():'werkt';
  return '';
}
/* maaltijd voor de mijnwerker: eerst zijn lievelingskost (CFG.prod.mineFav rondes), anders een andere maaltijd (1 ronde) */
function mealFor(b,bi){
  const fav=CFG.mineFood[b.type];
  for(const k of [fav,...CFG.prod.mineMeals.filter(x=>x!==fav)]){const s=freeUnitAt(bi,GI[k]);if(s>=0)return [s,k===fav?CFG.prod.mineFav:1]}
  return null;
}
function finishBatch(b,bi,pc){
  b.run=0;const r=b.rec;if(!r)return;
  if(pc.mine&&world.oreRes[b.ore]>0)world.oreRes[b.ore]--;
  const left=[];for(const k in r.out){const gd=GI[k],n=addGoods(bi,gd,r.out[k]);made(b,gd,r.out[k]);if(n)left.push([gd,n])}
  b.pend=left.length?left:null;
}
/* dichtstbijzijnde ertstegel van de juiste soort met nog erts, binnen area tegels rond de mijn, of -1 */
function findOre(b,pc){
  const {W,H,ore,oreRes}=world,R=pc.area;let best=-1,bd=Infinity;
  for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const x=b.x+dx,y=b.y+dy;if(x<0||y<0||x>=W||y>=H)continue;const i=y*W+x,d=dx*dx+dy*dy;
    if(d<=R*R&&ore[i]===pc.mine&&oreRes[i]>0&&d<bd){bd=d;best=i}}
  return best;
}
/* ---------- Buitenwerker ---------- */
const GATHER_NONE={tree:'geen bomen in het werkgebied',stone:'geen steen in het werkgebied',plant:'geen plek om te planten',
  farm:'geen plek om te zaaien',pick:'niets te plukken in het werkgebied'};
function startGather(b,bi,pc,c){
  if(pc.out&&!roomFor(bi,GI[pc.out])||pc.out2&&!roomFor(bi,GI[pc.out2])){b.ps='opslag bij de deur vol';return}
  const full=pc.out&&enough(b,[pc.out,pc.out2].filter(Boolean));if(full){b.ps=full;b.pt=pc.rest*3;return}
  const t=findTarget(b,pc);
  if(t<0){b.ps=b.grow?'het gewas groeit nog':GATHER_NONE[pc.gather];b.pt=pc.rest;return}   // even wachten voor hij opnieuw zoekt
  world.rsv[t]=1;S.src[c]=t;b.ps='werkt';goPath(c,ST.P_OUT,t);          // hij blijft binnen tot de route er is
}
/* dichtstbijzijnde geschikte tegel in het werkgebied (ringen rond de deur), of -1. Een boer oogst eerst (rijpe akker van
   zijn gewas) en zaait anders; een plukker zoekt om en om fruit en noten (b.alt) en neemt anders wat er is. */
function findTarget(b,pc){
  const {obj,crop}=world,g=pc.gather;b.grow=0;
  if(g==='farm'){
    const t=scanArea(b,pc,i=>obj[i]===7&&crop[i]===pc.crop);if(t>=0)return t;
    const s=scanArea(b,pc,canSow);if(s<0)b.grow=scanArea(b,pc,i=>obj[i]===6&&crop[i]===pc.crop)>=0;return s;
  }
  if(g==='pick'){const want=b.alt?1:0,f=i=>{const k=pickKind(i);return k>=0&&world.pickT[i]<=tickNo};
    const t=scanArea(b,pc,i=>f(i)&&pickKind(i)===want);return t>=0?t:scanArea(b,pc,f)}
  return scanArea(b,pc,g==='tree'?i=>obj[i]===1&&!pc.spare.includes(world.tree[i]/3|0):g==='stone'?i=>obj[i]===2&&world.res[i]>0:canPlant);
}
function scanArea(b,pc,ok){
  const {W,H,own,rsv,walk}=world,X=b.x,Y=b.y+1,R=pc.area,me=b.p+1;
  for(let r=0;r<=R;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r||dx*dx+dy*dy>R*R)continue;
    const x=X+dx,y=Y+dy;if(x<2||y<2||x>=W-2||y>=H-2)continue;const i=y*W+x;
    if(own[i]===me&&!rsv[i]&&walk[i]&&ok(i))return i;
  }
  return -1;
}
/* plukbaar: 0 = fruit (appelboom, bessenstruik), 1 = noten (hazelaar), -1 = niets */
function pickKind(i){const {obj,W}=world;if(obj[i]===1)return (world.tree[i]/3|0)===4?0:-1;if(obj[i]===3){const k=bushKind(i%W,i/W|0);return k===0?0:k===1?1:-1}return -1}
/* zaaien: vruchtbare grond (gras of weelderig), vrij, geen pad, stapel(plek) of plek vlak voor een gebouw */
function canSow(i){
  const {W,obj,ter,bldAt,path,stk,slotAt}=world;
  if(obj[i]||bldAt[i]||path[i]||stk[i]||slotAt[i]||bldAt[i-W]||ter[i]<T.GRASS||ter[i]>T.LUSH)return false;
  return !(bldAt[i-1]||bldAt[i+1]||bldAt[i+W]);
}
/* boompje planten: vrije grond (gras tot droog), geen pad, stapel, stapelplek of plek vlak voor een gebouw,
   en minder dan CFG.nature.plantNear bomen of boompjes er direct naast, zodat er doorgangen blijven */
function canPlant(i){
  const {W,obj,ter,bldAt,path,stk,slotAt}=world;
  if(obj[i]||bldAt[i]||path[i]||stk[i]||slotAt[i]||bldAt[i-W]||ter[i]<T.GRASS||ter[i]>T.DRY)return false;
  let n=0;for(const j of [i-1,i+1,i-W,i+W]){if(bldAt[j])return false;if(obj[j]===1||obj[j]===4)n++}
  return n<CFG.nature.plantNear;
}
/* route naar buiten of naar huis (vanuit gotPath) */
function prodPath(c,p){
  const st=S.st[c],b=world.blds[S.dst[c]];
  if(st===ST.P_OUT){
    if(!p){world.rsv[S.src[c]]=0;S.st[c]=ST.INSIDE;b.pt=CFG.prod[b.type].rest;b.ps='werkgebied niet bereikbaar';return}
    S.ins[c]=0;S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5;
  }else if(!p){S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5;arriveHome(c);return} // geen weg terug: dan maar thuis
  S.path[c]=p;S.pi[c]=p.length>1?1:0;S.st[c]=st+1;
}
/* akker in de wachtrij op het moment dat hij rijp is (ingevoegd op tijd, want gewassen groeien verschillend snel) */
function addCrop(i,t){const q=NAT.crop;let k=q.length;while(k>NAT.cropH&&q[k-1][0]>t)k--;q.splice(k,0,[t,i])}
/* klaar met werken op de doeltegel: kappen, hakken of planten, en dan naar huis */
function gatherDone(c){
  const b=world.blds[S.dst[c]],pc=CFG.prod[b.type],t=S.src[c],{obj}=world;world.rsv[t]=0;
  if(pc.gather==='tree'&&obj[t]===1){obj[t]=5;NAT.stump.push([tickNo+CFG.nature.stump,t]);S.carry[c]=GI[pc.out]+1}
  else if(pc.gather==='stone'&&obj[t]===2&&world.res[t]>0){if(!--world.res[t])obj[t]=0;S.carry[c]=GI[pc.out]+1}
  else if(pc.gather==='plant'&&canPlant(t)){obj[t]=4;NAT.sap.push([tickNo+CFG.nature.grow,t])}
  else if(pc.gather==='farm'){
    if(obj[t]===7&&world.crop[t]===pc.crop){obj[t]=0;world.crop[t]=0;S.carry[c]=GI[pc.out]+1}            // oogsten
    else if(canSow(t)){obj[t]=6;world.crop[t]=pc.crop;addCrop(t,tickNo+CFG.nature.crop[pc.crop])}}       // zaaien
  else if(pc.gather==='pick'){const k=pickKind(t);
    if(k>=0&&world.pickT[t]<=tickNo){world.pickT[t]=tickNo+CFG.nature.regrow;S.carry[c]=GI[k?pc.out2:pc.out]+1;b.alt=k?0:1}}
  goPath(c,ST.P_HOME,doorTile(b));
}
/* thuis: product bij de deur neerleggen en naar binnen; is het gebouw weg, dan is hij een werkloze vakman */
function arriveHome(c){
  const bi=S.dst[c],b=world.blds[bi];S.path[c]=null;
  if(S.carry[c]){const gd=S.carry[c]-1,r=addGoods(bi,gd,1);if(!b.dead)made(b,gd,1);if(r)b.pend=[[gd,r]];S.carry[c]=0}
  if(b.dead||b.wkr!==c+1){toIdle(c);return}
  S.ins[c]=1;S.st[c]=ST.INSIDE;S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5;b.pt=CFG.prod[b.type].rest;
}
function prodLabel(b){return (CFG.prod[b.type]||b.type==='woonhuis')&&!b.st&&!b.dead&&b.ps?' · '+b.ps:''}

/* ---------- Bevolking: woonhuizen ---------- */
function tickHouse(b,bi){
  const c=CFG.pop;b.born=b.born||0;
  if(b.born>=c.house){b.ps=`${b.born}/${c.house} bewoners, vol`;return}
  if(b.pt>0){b.pt--;return}
  let s=-1;for(const k of c.food){s=freeUnitAt(bi,GI[k]);if(s>=0)break}
  if(s<0){b.ps=`${b.born}/${c.house} bewoners, wacht op voedsel`;return}
  takeOne(s);TR.used++;b.born++;b.occ=1;b.pt=c.every;bornAt(b);
  b.ps=`${b.born}/${c.house} bewoners`;if(b.born>=c.house)setWant(b);
}
/* een nieuwe vrije drager bij de deur van woonhuis b */
function bornAt(b){
  const i=growUnits(),X=b.x+0.5,Y=b.y+1.5;
  S.x[i]=S.px[i]=S.hx[i]=S.tx[i]=X;S.y[i]=S.py[i]=S.hy[i]=S.ty[i]=Y;S.pl[i]=b.p;S.role[i]=0;S.lvl[i]=1;S.vr[i]=srand()*ROLES[0].vars|0;
  S.dir[i]=srand()<0.5?1:0;S.sp[i]=0.07+srand()*0.05;S.wait[i]=20;S.ins[i]=0;S.st[i]=ST.IDLE;S.job[i]=0;S.carry[i]=0;S.path[i]=null;S.d8[i]=2;
}

/* ---------- Werkgebied tekenen: bij het plaatsen en als de muis boven zo'n gebouw staat ---------- */
function drawWorkArea(X,Y,R,col){
  const {W,H}=world;ctx.setLineDash([1.5,1.5]);ctx.lineWidth=0.7;ctx.strokeStyle=col;ctx.beginPath();
  for(let k=0;k<=64;k++){const a=k/64*6.2832,x=Math.min(W-2,Math.max(0,X+Math.cos(a)*R)),y=Math.min(H-2,Math.max(0,Y+Math.sin(a)*R));
    const sx=SX(x,y),sy=y*TH-hAt(x,y);k?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy)}
  ctx.stroke();ctx.setLineDash([]);
}
function drawWorkAreas(){
  if(!world.own)return;let type=null,X=0,Y=0;
  if(BUILD.mode==='place'&&BUILD.type){type=BUILD.type;X=BUILD.ax+0.5;Y=BUILD.ay+1.5}
  else if(hoverTile){const bi=world.bldAt[hoverTile.y*world.W+hoverTile.x]-1;if(bi>=0){const b=world.blds[bi];type=b.type;X=b.x+0.5;Y=b.y+1.5}}
  const pc=type&&CFG.prod[type];if(pc&&pc.area)drawWorkArea(X,Y,pc.area,'rgba(255,236,170,.85)');
}

/* ---------- Paneel 'Productie' (speler uit de keuze bij Voorraad) ---------- */
let prodShown='';
function refreshProduction(){
  if(!world.made||document.activeElement&&document.activeElement.closest&&document.activeElement.closest('#prodList'))return;   // niet verversen terwijl een keuzelijst open is
  const p=+$('stockPl').value||0,rows=[];
  const houses=world.blds.filter(b=>b.type==='woonhuis'&&b.p===p&&!b.dead&&!b.st);
  if(houses.length){const n=houses.reduce((a,b)=>a+(b.born||0),0),hungry=houses.filter(b=>(b.born||0)<CFG.pop.house&&/voedsel/.test(b.ps)).length;
    rows.push(`<div class="prow"><b>Woonhuis ×${houses.length}</b><span>${n} van ${houses.length*CFG.pop.house} nieuwe bewoners`+(hungry?` · ${hungry} wacht op voedsel`:'')+'</span></div>')}
  const towers=world.blds.filter(b=>b.type==='wachttoren'&&b.p===p&&!b.dead&&!b.st);
  if(towers.length){const m=towers.filter(b=>b.occ).length,own=world.own;let n=0;if(own)for(let i=0;i<own.length;i++)if(own[i]===p+1)n++;
    rows.push(`<div class="prow"><b>Wachttoren ×${towers.length}</b><span>${m} bemand`+(m<towers.length?` · ${towers.length-m} wacht op een wachter`:'')+` · gebied ${n.toLocaleString('nl-NL')} tegels</span></div>`)}
  for(const type in CFG.prod){
    const list=world.blds.filter(b=>b.type===type&&b.p===p&&!b.dead&&!b.st);if(!list.length)continue;
    const st={};for(const b of list){const s=b.occ?b.ps||'werkt':'wacht op een vakman';st[s]=(st[s]||0)+1}
    const pc=CFG.prod[type],outs=pc.gather?[pc.out,pc.out2].filter(Boolean):[...new Set(recipes(type).flatMap(r=>Object.keys(r.out)))];
    const mk=outs.map(k=>`${world.made[p][GI[k]]} ${GOODS[GI[k]].n.toLowerCase()}`).join(', ');
    /* smidse en uitrustingsmaker: keuze wat ze maken (geldt voor al die gebouwen van deze speler, als opdracht) */
    const sel=pc.recipes?`<label class="pmake">maakt <select data-type="${type}"><option value="auto">automatisch (wat het minst is)</option>`+
      Object.keys(pc.recipes).map(k=>`<option value="${k}"${list[0].make===k?' selected':''}>${GOODS[GI[k]].n.toLowerCase()}</option>`).join('')+'</select></label>':'';
    rows.push(`<div class="prow"><b>${BTYPES[type].name} ×${list.length}</b><span>${Object.entries(st).map(([s,n])=>(list.length>1?n+' ':'')+s).join(' · ')}</span>`+
      (mk?`<span class="pmade">gemaakt: ${mk}</span>`:'')+sel+'</div>');
  }
  const html=rows.join('')||'<p class="note">Nog geen voltooide werkgebouwen.</p>';
  if(html!==prodShown){prodShown=html;$('prodList').innerHTML=html}
}
$('prodList').addEventListener('change',ev=>{const t=ev.target.dataset.type;if(!t)return;const p=+$('stockPl').value||0;
  world.blds.forEach((b,bi)=>{if(b.type===t&&b.p===p&&!b.dead)order({p,t:'make',b:bi,make:ev.target.value})})});
