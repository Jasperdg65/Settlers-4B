"use strict";
/* ---------- Grond ruilen (mijlpaal 8a, CFG.deal) ----------
   Grond wisselt alleen van eigenaar via een afspraak, nooit door verovering (docs/beslissingen.md, docs/ontwerp/grond-ruilen.md).
   Een speler tekent op de grond van één buur een stuk aan dat aan zijn eigen gebied grenst, en biedt eigen grond (die aan het
   gebied van de buur grenst) en/of goederen. De buur beslist met dealValue: wat de gevraagde grond hem waard is tegen wat hij
   krijgt, met een marge die afhangt van de relatie (world.rel). Is het bod net te laag, dan doet hij een tegenbod in goederen;
   de vrager neemt dat aan of wijst het af (opdrachten accept/reject).
   Een uitgevoerde ruil wordt een record in world.deals {p, q, t, tiles: [tegel, nieuwe eigenaar + 1, ...]}; computeLand past die
   toe na het gebied uit de torens, zodat afgesproken grond niet terugvalt. Grond met een gebouw, bouwplaats, ingang, stapelplek of
   stapel kan niet in een ruil, dus er gaat nooit iets verloren. Goederen gaan nu meteen van de opslag van de een naar de burcht
   van de ander (tijdelijk: in mijlpaal 10 brengt de handelaar ze met zijn handkar).
   Voorstellen staan in world.offers {id, p, q, ask, give, goods, extra, st, why, t}; st: aangenomen, tegenbod, afgewezen, gesloten.
   Alles loopt via order() en hangt alleen af van de wereld, dus deterministisch. */
function dealInit(){
  const P=world.starts.length;world.deals=[];world.offers=[];world.rel=new Float32Array(P*P);world.reqs=[];world.reqCool=new Uint32Array(P);
}
const relOf=(p,q)=>world.rel?world.rel[p*world.starts.length+q]:0;
function relAdd(p,q,v){const P=world.starts.length,r=Math.max(-100,Math.min(100,relOf(p,q)+v));world.rel[p*P+q]=world.rel[q*P+p]=r}
/* naam van het relatieniveau: de hoogste ondergrens uit CFG.deal.rel die nog gehaald wordt */
function relLevel(r){let n='gespannen';for(const [k,v] of Object.entries(CFG.deal.rel))if(r>=v)n=k;return n}
const homeOf=p=>world.blds.find(b=>b.p===p&&b.type==='burcht'&&!b.dead);

/* '' als tegel i (van speler o) in een ruil mag, anders de reden */
function dealTileWhy(i,o){
  const {own,bldAt,stk,slotAt,W}=world;
  if(own[i]!==o+1)return 'ander';
  if(bldAt[i])return t('ruil.nietGebouw');
  if(stk&&stk[i])return t('ruil.nietStapel');
  const s=slotAt?slotAt[i]-1:-1;if(s>=0&&!world.blds[s].dead)return t('ruil.nietStapel');
  for(const b of world.blds)if(!b.dead&&b.y+1<world.H&&i===(b.y+1)*W+b.x)return t('ruil.nietGebouw');   // ingang
  return '';
}
/* alleen de tegels die (via elkaar) aan het gebied van speler naar grenzen; de rest valt weg, zodat er geen losse eilandjes ontstaan.
   De volgorde is vanaf de grens (eerst de rand, dan de rij daarachter), zodat een te groot stuk aan de grenskant wordt ingekort. */
function connectedTo(tiles,naar){
  const {W,H,own}=world,set=new Set(tiles),ok=new Set(),q=[];
  for(const i of tiles){const x=i%W,y=i/W|0;
    if(x>0&&own[i-1]===naar+1||x<W-1&&own[i+1]===naar+1||y>0&&own[i-W]===naar+1||y<H-1&&own[i+W]===naar+1){ok.add(i);q.push(i)}}
  for(let k=0;k<q.length;k++){const i=q[k],x=i%W,y=i/W|0;
    for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,y>0?i-W:-1,y<H-1?i+W:-1])if(j>=0&&set.has(j)&&!ok.has(j)){ok.add(j);q.push(j)}}
  return q;
}

/* ---------- Waarde (vanuit speler p, die de grond heeft of krijgt) ---------- */
function oreCounts(p){const n=[0,0,0,0],{own,ore,oreRes}=world;for(let i=0;i<own.length;i++)if(own[i]===p+1&&ore[i]&&oreRes[i])n[ore[i]]++;return n}
function tileValue(i,p,ores,home){
  const V=CFG.deal.val,{W,obj,ter,ore,oreRes}=world,o=obj[i];let v=V.ter[ter[i]]||0;
  if(o===1)v+=V.tree;else if(o===4)v+=V.sapling;else if(o===3)v+=V.bush;else if(o>=6)v+=V.field;
  else if(o===2)v+=V.stone*(world.res?world.res[i]/CFG.nature.stoneUnits:1);
  if(ore[i]&&oreRes[i])v+=V.ore*oreRes[i]/CFG.prod.mineUnits*(ores[ore[i]]<V.oreScarce?V.oreNeed:1);
  if(home){const d=Math.hypot(i%W-home.x,(i/W|0)-home.y);v*=1+V.home*Math.max(0,1-d/V.homeR)}
  return v;
}
/* wat de tegels voor p waard zijn, en wat erop staat (voor de uitleg) */
function tilesValue(tiles,p){
  const ores=oreCounts(p),home=homeOf(p),{obj,ore,oreRes}=world,what={erts:0,bomen:0,akkers:0,thuis:0,schaars:0};let v=0;
  for(const i of tiles){v+=tileValue(i,p,ores,home);const o=obj[i];
    if(o===1||o===4)what.bomen++;if(o>=6)what.akkers++;
    if(ore[i]&&oreRes[i]){what.erts++;if(ores[ore[i]]<CFG.deal.val.oreScarce)what.schaars++}
    if(home&&Math.hypot(i%world.W-home.x,(i/world.W|0)-home.y)<CFG.deal.val.homeR/2)what.thuis++}
  return {v,what};
}
function goodsValue(goods,q){
  const C=CFG.deal,tot=stockTotals(q);let v=0;
  for(const k in goods){const n=goods[k];if(n>0&&C.goods[k])v+=n*C.goods[k]*(tot[GI[k]]<C.short?C.shortMul:1)}
  return v;
}
/* vrije stuks per goed van speler p (wat geen drager al komt halen) */
function freeGoods(p){const f=new Uint32Array(GOODS.length);for(let s=0;s<G.n;s++)if(G.cnt[s]&&G.pl[s]===p)f[G.good[s]]+=G.cnt[s]-G.res[s];return f}
/* het oordeel van buur q over een voorstel van p: aannemen, tegenbod (extra goederen) of afwijzen, met de reden */
function dealJudge(o){
  const C=CFG.deal,lose=tilesValue(o.ask,o.q),gain=o.give.length?tilesValue(o.give,o.q).v:0;
  const offer=gain+goodsValue(o.goods,o.q),need=lose.v*(C.margin-C.relMargin*relOf(o.p,o.q)/100);
  if(offer>=need)return {st:'aangenomen'};
  const why=lose.what.schaars?'erts':lose.what.erts*3>o.ask.length?'ertsVeel':lose.what.thuis*2>o.ask.length?'thuis':lose.what.akkers?'akkers':lose.what.bomen*3>o.ask.length?'bomen':'waarde';
  if(offer<need*C.counterAt)return {st:'afgewezen',why};
  /* tegenbod: het ontbrekende in het goed dat de vrager het meest heeft (en de buur waardeert) */
  const free=freeGoods(o.p),tot=stockTotals(o.q),miss=need-offer;
  const cand=Object.keys(C.goods).map(k=>{const per=C.goods[k]*(tot[GI[k]]<C.short?C.shortMul:1),n=Math.ceil(miss/per),
    have=free[GI[k]]-(o.goods[k]||0);return {k,n,ok:have>=n,have}}).filter(c=>c.ok).sort((a,b)=>b.have-a.have);
  if(!cand.length)return {st:'afgewezen',why};
  return {st:'tegenbod',why,extra:{[cand[0].k]:cand[0].n}};
}

/* ---------- Opdrachten (orders.js) ---------- */
function cleanGoods(g){const out={};for(const k in g||{})if(CFG.deal.goods[k]){const n=Math.floor(+g[k]);if(n>0)out[k]=n}return out}
function dealCheck(o){
  const C=CFG.deal,P=world.starts.length;
  if(!(o.q>=0&&o.q<P)||o.q===o.p||!o.ask.length)return t('ruil.leeg');
  if(o.ask.length>C.maxTiles||o.give.length>C.maxTiles)return t('ruil.teVeel',{max:C.maxTiles});
  for(const i of o.ask)if(dealTileWhy(i,o.q))return t('ruil.vraagMagNiet');
  for(const i of o.give)if(dealTileWhy(i,o.p))return t('ruil.biedMagNiet');
  if(connectedTo(o.ask,o.p).length!==o.ask.length||connectedTo(o.give,o.q).length!==o.give.length)return t('ruil.losStuk');
  const free=freeGoods(o.p),all={...o.goods};for(const k in o.extra||{})all[k]=(all[k]||0)+o.extra[k];
  for(const k in all)if(free[GI[k]]<all[k])return t('ruil.geenGoed',{goed:GOODS[GI[k]].n});
  if(!homeOf(o.q))return t('ruil.leeg');
  return '';
}
/* {p, t:'propose', q, ask:[tegels], give:[tegels], goods:{goed: aantal}} */
function dealPropose(c){
  const ask=[...new Set((c.ask||[]).map(i=>i|0))],give=[...new Set((c.give||[]).map(i=>i|0))].filter(i=>!ask.includes(i));
  const o={id:world.offers.length,p:c.p,q:c.q|0,ask,give,goods:cleanGoods(c.goods),extra:null,st:'',why:'',t:tickNo};
  world.offers.push(o);
  const why=dealCheck(o);if(why){o.st='ongeldig';o.why=why;dealUI();return}
  const j=dealJudge(o);o.st=j.st;o.why=j.why||'';o.extra=j.extra||null;
  if(o.st==='aangenomen')dealDo(o);
  dealUI();
}
function dealAnswer(c,yes){
  const o=world.offers[c.id|0];if(!o||o.p!==c.p||o.st!=='tegenbod')return;
  if(!yes||tickNo-o.t>CFG.deal.counterTicks){o.st='gesloten';dealUI();return}
  const why=dealCheck(o);if(why){o.st='ongeldig';o.why=why;dealUI();return}
  o.st='aangenomen';dealDo(o);dealUI();
}
/* goederen van p naar de burcht van q (opslag eerst), grond overschrijven, relatie omhoog */
function dealDo(o){
  const all={...o.goods};for(const k in o.extra||{})all[k]=(all[k]||0)+o.extra[k];
  const store=b=>b.type==='burcht'||b.type==='pakhuis',to=world.blds.indexOf(homeOf(o.q));
  for(const k in all){const gd=GI[k];let n=all[k];
    for(const pass of [true,false])for(let s=0;s<G.n&&n>0;s++){
      if(!G.cnt[s]||G.pl[s]!==o.p||G.good[s]!==gd||store(world.blds[G.bld[s]])!==pass)continue;
      while(n>0&&G.cnt[s]>G.res[s]){takeOne(s);n--}}
    let rest=addGoods(to,gd,all[k]-n);
    for(let bi=0;bi<world.blds.length&&rest>0;bi++){const b=world.blds[bi];if(b.p===o.q&&!b.dead&&!b.st&&b.type==='pakhuis')rest=addGoods(bi,gd,rest)}
    if(rest>0)addGoods(world.blds.indexOf(homeOf(o.p)),gd,rest);   // past nergens bij de buur: blijft bij de vrager
  }
  const tiles=[];for(const i of o.ask)tiles.push(i,o.p+1);for(const i of o.give)tiles.push(i,o.q+1);
  world.deals.push({p:o.p,q:o.q,t:tickNo,tiles});relAdd(o.p,o.q,CFG.deal.relDeal);
  computeLand();invalidateTiles([...o.ask,...o.give]);
}
/* in computeLand: afspraken gaan boven het gebied uit torens, in volgorde van sluiten */
function applyDeals(own){if(world.deals)for(const d of world.deals)for(let k=0;k<d.tiles.length;k+=2)own[d.tiles[k]]=d.tiles[k+1]}

/* ---------- Buren vragen zelf (mijlpaal 8b, CFG.deal.req) ----------
   world.reqs {id, q (vraagt), p (aan wie), tiles, goods, ore, st, t, more, end}; st: open, aangenomen, afgewezen, verlopen,
   ongeldig. In de Ruil-test (world.landTest) vragen ze om elk erts, ook als ze het zelf hebben, en al na first/4 ticks. more: 0 nog niet, 1 legt er wat bij, −1 wil niet meer geven. Alles gebeurt in de tick en zonder toeval, dus
   deterministisch; jouw antwoord is de opdracht answer {id, a: ja | meer | nee}. */
function tickRequests(){
  const R=CFG.deal.req;if(!world.reqs||tickNo<(world.landTest?R.first/4:R.first)||tickNo%R.every)return;
  for(const r of world.reqs)if(r.st==="open"&&tickNo-r.t>=R.ttl){r.st='verlopen';r.end=tickNo;dealUI()}
  const p=world.human,P=world.starts.length;   // buren vragen de speler (mijlpaal 9a: vast speler 1)if(p>=P||!homeOf(p))return;
  for(let q=0;q<P;q++){
    if(q===p||!homeOf(q)||world.reqCool[q]>tickNo||world.reqs.some(r=>r.q===q&&r.st==='open'))continue;
    const r=reqPlan(q,p);if(!r)continue;
    world.reqs.push({id:world.reqs.length,q,p,...r,st:'open',t:tickNo,more:0,end:0});world.reqCool[q]=tickNo+R.cool;dealUI();
  }
}
/* een strook grond van p vanaf de grens van q tot het dichtstbijzijnde erts dat q mist, en de goederen die q ervoor biedt; of null */
function reqPlan(q,p){
  const C=CFG.deal,R=C.req,{W,own,ore,oreRes}=world,N=own.length,ores=oreCounts(q),miss=[1,2,3].filter(k=>world.landTest||ores[k]<C.val.oreScarce);   // Ruil-test: elk erts
  if(!miss.length)return null;
  /* breedte-eerst over de grond van p, vanaf de tegels die aan q grenzen, hoogstens reach tegels diep */
  const dist=new Int16Array(N).fill(-1),from=new Int32Array(N).fill(-1),Q=[],mine=i=>own[i]===p+1&&!dealTileWhy(i,p);
  for(let i=W;i<N-W;i++)if(mine(i)){const x=i%W;if(x>0&&own[i-1]===q+1||x<W-1&&own[i+1]===q+1||own[i-W]===q+1||own[i+W]===q+1){dist[i]=0;Q.push(i)}}
  let hit=-1;
  for(let k=0;k<Q.length;k++){const i=Q[k];if(ore[i]&&oreRes[i]&&miss.includes(ore[i])){hit=i;break}if(dist[i]>=R.reach)continue;
    const x=i%W;for(const j of [x>0?i-1:-1,x<W-1?i+1:-1,i-W,i+W])if(j>=W&&j<N-W&&dist[j]<0&&mine(j)){dist[j]=dist[i]+1;from[j]=i;Q.push(j)}}
  if(hit<0)return null;
  /* de weg van het erts naar de grens, dan het erts eromheen, dan een tegel breder langs de weg */
  const path=[];for(let i=hit;i>=0;i=from[i])path.push(i);
  const L=[...path];
  for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++)L.push(hit+dy*W+dx);
  for(const i of path)for(const j of [i-1,i+1,i-W,i+W])L.push(j);
  const tiles=connectedTo([...new Set(L)].filter(i=>i>=W&&i<N-W&&mine(i)).slice(0,R.tiles),q);
  if(!tiles.includes(hit))return null;
  /* bieden: wat de strook jou waard is × offer, in de goederen die hij het meest vrij heeft (van elk hoogstens de helft) */
  let rest=tilesValue(tiles,p).v*R.offer;const free=freeGoods(q),goods={};
  for(const k of Object.keys(C.goods).sort((a,b)=>free[GI[b]]-free[GI[a]]||(a<b?-1:1))){if(rest<=0)break;
    const per=goodsValue({[k]:1},p),n=Math.min(free[GI[k]]>>1,Math.ceil(rest/per));if(n>0){goods[k]=n;rest-=n*per}}
  return rest>0?null:{tiles,goods,ore:ore[hit]};
}
function reqAnswer(c){
  const r=world.reqs&&world.reqs[c.id|0];if(!r||r.p!==c.p||r.st!=='open')return;
  if(c.a==='nee'){r.st='afgewezen';r.end=tickNo;dealUI();return}
  if(c.a==='meer'){if(r.more)return;
    const goods={};for(const k in r.goods)goods[k]=Math.ceil(r.goods[k]*CFG.deal.req.more);
    const free=freeGoods(r.q),ok=Object.keys(goods).every(k=>free[GI[k]]>=goods[k])&&goodsValue(goods,r.q)<=tilesValue(r.tiles,r.q).v;
    if(ok)r.goods=goods;r.more=ok?1:-1;dealUI();return}
  if(c.a!=='ja')return;
  const o={p:r.q,q:r.p,ask:r.tiles,give:[],goods:r.goods,extra:null};r.end=tickNo;
  if(dealCheck(o)){r.st='ongeldig';dealUI();return}
  r.st='aangenomen';dealDo(o);dealUI();
}
const openReq=p=>world.reqs?world.reqs.findLast(r=>r.p===p&&r.st==='open'):null;

/* ---------- Grensduel (mijlpaal 8b, CFG.deal.duel) ----------
   Na een afgewezen voorstel (of een afgewezen tegenbod) kan de vrager uitdagen. Van beide kanten komt de sterkste krachtpatser
   uit de toren die het dichtst bij de strook staat (zonder toren: uit de reserve van een krachthal); ze armdrukken aan een tafel
   op de grens (duel.js). Wint de vrager, dan wordt de strook een afspraak in world.deals, zonder goederen. Een uitdaging kost
   beide relatie. Een toren blijft bemand zolang zijn krachtpatser buiten is (crew.js: fieldOut, fieldHome).
   o.duel: bezig, gewonnen, verloren, mislukt, of waarom het niet kon (geenEigen, geenBuur, geenPlek, ongeldig). */
function grensFighter(s,X,Y){
  let best=-1,bd=Infinity,bs=-1;
  for(const b of world.blds){if(b.p!==s||b.dead||b.st||!b.crew||!isCrewB(b))continue;
    const d=Math.hypot(b.x-X,b.y-Y)+(isHall(b)?1e4:0);   // torens eerst
    for(const c of b.crew){if(!S.lvl[c]||!S.ins[c]||b.trn===c)continue;const k=strength(c);
      if(d<bd||d===bd&&k>bs){bd=d;bs=k;best=c}}}
  return best;
}
/* dichtstbijzijnde opgeleide muzikant van speler s in een krachthal (mijlpaal 8c), of −1 */
function grensBand(s,X,Y){
  let best=-1,bd=Infinity;
  for(const b of world.blds){if(b.p!==s||b.dead||b.st||!isHall(b)||!b.band)continue;const d=Math.hypot(b.x-X,b.y-Y);
    for(const c of b.band)if(S.lvl[c]&&S.ins[c]&&d<bd){bd=d;best=c}}
  return best;
}
function grensChallenge(c){
  const o=world.offers[c.id|0];if(!o||o.p!==c.p||o.duel||!(o.st==='afgewezen'||o.st==='gesloten'))return;
  const W=world.W,tiles=connectedTo(o.ask.filter(i=>world.own[i]===o.q+1&&!dealTileWhy(i,o.q)),o.p);
  if(!tiles.length){o.duel='ongeldig';dealUI();return}
  /* de tafel staat op de tegel van de strook die aan de vrager grenst, het dichtst bij het midden van de strook */
  let cx=0,cy=0;for(const i of tiles){cx+=i%W;cy+=i/W|0}cx/=tiles.length;cy/=tiles.length;
  const dm=i=>Math.hypot(i%W-cx,(i/W|0)-cy),edge=tiles.filter(i=>[i-1,i+1,i-W,i+W].some(j=>world.own[j]===o.p+1)).sort((a,b)=>dm(a)-dm(b)||a-b)[0];
  const ex=edge%W+0.5,ey=(edge/W|0)+0.5,fa=grensFighter(o.p,ex,ey),fb=grensFighter(o.q,ex,ey);
  if(fa<0){o.duel='geenEigen';dealUI();return}if(fb<0){o.duel='geenBuur';dealUI();return}
  const sp=tableSpot(ex,ey,true,12);if(!sp){o.duel='geenPlek';dealUI();return}
  fieldOut(fa);fieldOut(fb);
  const [a,b]=S.x[fa]-S.y[fa]/2<=S.x[fb]-S.y[fb]/2?[fa,fb]:[fb,fa];   // wie links staat, gaat links zitten
  const d={a,b,x:sp[0],y:sp[1],s:0,v:0,t:0,live:0,wait:0,meet:CFG.deal.duel.meetTicks,grens:o.id,band:[]};
  let k=DUELS.indexOf(null);if(k<0)k=DUELS.push(null)-1;DUELS[k]=d;S.du[a]=S.du[b]=k+1;
  armyGo(a,d.x-CFG.duel.seat,d.y,AIM.SEAT);armyGo(b,d.x+CFG.duel.seat,d.y,AIM.SEAT);
  /* van beide kanten loopt de dichtstbijzijnde muzikant mee en gaat schuin voor de stoel staan, waar geen bomen hem verbergen */
  const [bx,by]=CFG.deal.duel.band;
  for(const [u,side] of [[a,-1],[b,1]]){const m=grensBand(S.pl[u],ex,ey);if(m<0)continue;
    fieldOut(m);S.du[m]=k+1;d.band.push(m);const [x,y]=freeSpot(d.x+side*(CFG.duel.seat+bx),d.y+by);armyGo(m,x,y,AIM.IDLE)}
  o.duel='bezig';o.tiles=tiles;relAdd(o.p,o.q,-CFG.deal.duel.relCost);dealUI();
}
/* afloop (duel.js: endDuel, cancelDuel); win = winnaar, of −1 als het duel niet doorging */
function grensEnd(d,win){
  const o=world.offers[d.grens];if(!o)return;
  if(win<0)o.duel='mislukt';
  else if(S.pl[win]===o.p){
    const tiles=connectedTo(o.tiles.filter(i=>world.own[i]===o.q+1&&!dealTileWhy(i,o.q)),o.p);
    if(tiles.length){const L=[];for(const i of tiles)L.push(i,o.p+1);world.deals.push({p:o.p,q:o.q,t:tickNo,tiles:L,duel:1});computeLand();invalidateTiles(tiles)}
    o.duel='gewonnen';o.won=tiles.length;
  }else o.duel='verloren';
  dealUI();
}

/* ---------- Paneel 'Buren' en het aantekenen op de kaart ----------
   Knop 'Grond vragen' of 'Grond bieden': twee klikken op de kaart = de hoeken van een rechthoek; de tegels daarin die mogen,
   komen erbij (zijn ze er allemaal al, dan gaan ze eraf). Loopt via BUILD.mode 'deal', zodat muis, aanraken, Esc en
   rechtermuisknop werken zoals bij bouwen. */
const DEAL={mode:null,corner:-1,at:-1,ask:[],give:[],q:-1,last:-1};
function dealMode(m){
  const on=DEAL.mode!==m&&m;setBuildMode(on?'deal':null);DEAL.mode=on?m:null;DEAL.corner=-1;dealUI();
}
function dealHover(x,y){
  const i=y*world.W+x,p=buildPl();DEAL.at=i;BUILD.hover=i;
  const o=world.own[i]-1,mine=DEAL.mode==='give';
  const owner=o<0?t('ruil.niemand'):o===p?t('ruil.jij'):t('ruil.speler',{n:o+1});
  const why=mine?(o===p?dealTileWhy(i,p):t('ruil.nietJouw')):(o===p?t('ruil.alJouw'):o<0?'':DEAL.q>=0&&o!==DEAL.q?t('ruil.eenBuur'):dealTileWhy(i,o));
  return (DEAL.corner<0?t('ruil.hoek1'):t('ruil.hoek2'))+' · '+owner+(why?' · '+why:'');
}
function dealClick(){
  if(DEAL.at<0)return;if(DEAL.corner<0){DEAL.corner=DEAL.at;dealUI();return}
  const W=world.W,a=DEAL.corner,b=DEAL.at,p=buildPl(),x0=Math.min(a%W,b%W),x1=Math.max(a%W,b%W),y0=Math.min(a/W|0,b/W|0),y1=Math.max(a/W|0,b/W|0);
  DEAL.corner=-1;const ask=DEAL.mode==='ask',L=ask?DEAL.ask:DEAL.give;
  let q=ask?DEAL.q:p;
  const rect=[];for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const i=y*W+x,o=world.own[i]-1;
    if(ask&&q<0&&o>=0&&o!==p)q=o;if(o===q&&q>=0&&!dealTileWhy(i,q))rect.push(i)}
  if(!rect.length){dealUI(t('ruil.niets'));return}
  if(ask)DEAL.q=q;
  const all=rect.every(i=>L.includes(i));let next=all?L.filter(i=>!rect.includes(i)):[...new Set([...L,...rect])];
  const before=next.length;next=connectedTo(next,ask?p:DEAL.q<0?-1:DEAL.q);
  let msg=next.length<before?t('ruil.losWeg',{n:before-next.length}):'';
  if(next.length>CFG.deal.maxTiles){next=next.slice(0,CFG.deal.maxTiles);msg=t('ruil.ingekort',{max:CFG.deal.maxTiles})}
  if(ask){DEAL.ask=next;if(!next.length){DEAL.q=-1;DEAL.give=[]}}else DEAL.give=next;
  dealUI(msg||undefined);
}
function dealClear(){DEAL.ask=[];DEAL.give=[];DEAL.q=-1;DEAL.corner=-1;for(const el of dealGoodsInputs())el.value=0;dealUI()}
const dealGoodsInputs=()=>$('dealGoods').querySelectorAll?[...$('dealGoods').querySelectorAll('input')]:[];
function dealGoodsPicked(){const g={};for(const el of dealGoodsInputs())if(+el.value>0)g[el.dataset.k]=+el.value;return g}
function dealSend(){
  if(!DEAL.ask.length||DEAL.q<0)return;const p=buildPl();
  DEAL.last=world.offers.length+ORDERS.filter(c=>c.t==='propose').length;   // id die dit voorstel krijgt
  order({p,t:'propose',q:DEAL.q,ask:DEAL.ask.slice(),give:DEAL.give.slice(),goods:dealGoodsPicked()});
  if(DEAL.mode)dealMode(null);$('dealMsg').textContent=t('ruil.verstuurd',{n:DEAL.q+1});
}
function buildDealPanel(){
  const box=$('dealGoods');box.innerHTML='';
  for(const k in CFG.deal.goods){const gd=GI[k],row=document.createElement('label');row.className='dgood';
    row.appendChild(thumb(goodSprite(gd,1),22,16,2.4));const n=document.createElement('span');n.textContent=GOODS[gd].n;row.appendChild(n);
    const inp=document.createElement('input');inp.type='number';inp.min=0;inp.step=1;inp.value=0;inp.dataset.k=k;inp.oninput=()=>dealUI();row.appendChild(inp);
    box.appendChild(row)}
  DEAL.ask=[];DEAL.give=[];DEAL.q=-1;DEAL.mode=null;DEAL.last=-1;dealUI();
}
/* samenvatting, antwoord van de buur en de knoppen; ook aangeroepen na het uitvoeren van een opdracht */
function dealUI(msg){
  if(typeof document==='undefined'||!world||!world.own||!$('dealSum'))return;
  const p=buildPl(),q=DEAL.q,sum=$('dealSum');
  $('dealAsk').classList.toggle('on',DEAL.mode==='ask');$('dealGive').classList.toggle('on',DEAL.mode==='give');
  $('dealGive').disabled=q<0;$('dealSend').disabled=!DEAL.ask.length;
  const free=freeGoods(p);for(const el of dealGoodsInputs()){el.max=free[GI[el.dataset.k]];if(+el.value>+el.max)el.value=el.max}
  $('dealRel').textContent=q<0?t('ruil.uitleg'):t('ruil.buur',{n:q+1,niveau:t('rel.'+relLevel(relOf(p,q))),rel:Math.round(relOf(p,q))});
  const what=(L,o)=>{if(!L.length)return '';const w=tilesValue(L,o).what,d=[];
    if(w.erts)d.push(t('ruil.metErts',{n:w.erts}));if(w.bomen)d.push(t('ruil.metBomen',{n:w.bomen}));if(w.akkers)d.push(t('ruil.metAkkers',{n:w.akkers}));
    return d.length?' ('+d.join(', ')+')':''};
  const g=dealGoodsPicked(),gs=Object.keys(g).map(k=>g[k]+' '+GOODS[GI[k]].n).join(', ');
  sum.textContent=!DEAL.ask.length?'':t('ruil.vraagt',{n:DEAL.ask.length,buur:q+1})+what(DEAL.ask,q)+'. '+
    (DEAL.give.length||gs?t('ruil.biedt',{wat:[DEAL.give.length?t('ruil.tegels',{n:DEAL.give.length})+what(DEAL.give,p):'',gs].filter(Boolean).join(' + ')}):t('ruil.biedtNiets'));
  const m=$('dealMsg');let ans=false;
  if(msg!==undefined)m.textContent=msg;
  else if(DEAL.mode)m.textContent=DEAL.corner<0?t('ruil.klik1',{wat:t(DEAL.mode==='ask'?'ruil.watVraag':'ruil.watBied')}):t('ruil.klik2');
  else{const o=world.offers&&world.offers[DEAL.last];
    if(o&&o.p===p){const n=o.q+1;
      if(o.st==='aangenomen'){m.textContent=t('ruil.ja',{n});if(DEAL.ask.length&&DEAL.ask.every(i=>world.own[i]===p+1)){DEAL.ask=[];DEAL.give=[];DEAL.q=-1;sum.textContent=''}}
      else if(o.st==='tegenbod'){const k=Object.keys(o.extra)[0];m.textContent=t('ruil.tegen',{n,wat:o.extra[k]+' '+GOODS[GI[k]].n})+' '+t('ruil.reden.'+o.why);ans=true}
      else if(o.st==='afgewezen')m.textContent=t('ruil.nee',{n})+' '+t('ruil.reden.'+o.why);
      else if(o.st==='ongeldig')m.textContent=t('ruil.kanNiet')+' '+o.why;
      else if(o.st==='gesloten')m.textContent=t('ruil.dicht',{n})}}
  $('dealAnswer').hidden=!ans;
  /* grensduel: na een afwijzing kun je uitdagen; daarna de stand van het duel */
  const o=world.offers&&world.offers[DEAL.last];let duel=false;
  if(o&&o.p===p&&!DEAL.mode&&msg===undefined){const n=o.q+1;
    if(!o.duel&&(o.st==='afgewezen'||o.st==='gesloten')){duel=true;$('dealDuel').title=t('grens.uitleg',{n,kost:CFG.deal.duel.relCost})}
    else if(o.duel){const d=DUELS.find(d=>d&&d.grens===o.id);
      m.textContent=t('grens.'+(o.duel==='bezig'&&d&&d.live?'live':o.duel),{n,tegels:o.won||0})}}
  $('dealDuelBox').hidden=!duel;
  reqUI(p);
}
/* verzoek van een buur: het nieuwste dat nog open is, of kort na afloop hoe het afliep */
function reqUI(p){
  const L=world.reqs||[],r=openReq(p)||L.findLast(r=>r.p===p&&r.end&&tickNo-r.end<CFG.deal.req.ttl/2),box=$('reqBox');
  box.hidden=!r;if(!r)return;const n=r.q+1;
  if(r.st!=='open'){$('reqText').textContent=t('verzoek.'+r.st,{n});$('reqBtns').hidden=true;return}
  const w=tilesValue(r.tiles,p).what,gs=Object.keys(r.goods).map(k=>r.goods[k]+' '+GOODS[GI[k]].n).join(', ');
  $('reqText').textContent=t('verzoek.tekst',{n,tegels:r.tiles.length,erts:ORE[r.ore],nErts:w.erts,goederen:gs})+
    (r.more>0?' '+t('verzoek.meerJa',{n}):r.more<0?' '+t('verzoek.meerNee',{n}):'')+' '+t('verzoek.tijd',{s:Math.max(0,Math.ceil((CFG.deal.req.ttl-(tickNo-r.t))/CFG.ticksPerSec))});
  $('reqBtns').hidden=false;$('reqMore').disabled=!!r.more;
}
/* aangetekende tegels: gevraagd in de kleur van de buur, geboden in de eigen kleur; de rechthoek in wording als lijn */
function drawDealOverlay(){
  const r=world.own&&openReq(buildPl());
  if(!world.own||!r&&!DEAL.ask.length&&!DEAL.give.length&&!DEAL.mode)return;const W=world.W,p=buildPl();
  const rgba=(c,a)=>{const n=parseInt(c.slice(1),16);return `rgba(${n>>16},${n>>8&255},${n&255},${a})`};
  if(r)for(const i of r.tiles)tileQuad(i%W,i/W|0,rgba(PCOL[r.q],0.3+0.15*Math.sin(tNow/300)),'rgba(255,200,90,.95)');   // verzoek van een buur: knippert zacht
  if(DEAL.q>=0)for(const i of DEAL.ask)tileQuad(i%W,i/W|0,rgba(PCOL[DEAL.q],0.45),'rgba(255,240,190,.9)');
  for(const i of DEAL.give)tileQuad(i%W,i/W|0,rgba(PCOL[p],0.45),'rgba(190,230,255,.9)');
  if(DEAL.mode&&DEAL.corner>=0&&DEAL.at>=0){const a=DEAL.corner,b=DEAL.at;
    for(let y=Math.min(a/W|0,b/W|0);y<=Math.max(a/W|0,b/W|0);y++)for(let x=Math.min(a%W,b%W);x<=Math.max(a%W,b%W);x++)tileQuad(x,y,'rgba(255,255,255,.12)',null)}
}
$('dealAsk').onclick=()=>dealMode('ask');
$('dealGive').onclick=()=>dealMode('give');
$('dealClear').onclick=dealClear;
$('dealSend').onclick=dealSend;
$('dealYes').onclick=()=>order({p:buildPl(),t:'accept',id:DEAL.last});
$('dealNo').onclick=()=>order({p:buildPl(),t:'reject',id:DEAL.last});
$('dealDuel').onclick=()=>order({p:buildPl(),t:'grens',id:DEAL.last});
const reqOrder=a=>{const r=openReq(buildPl());if(r)order({p:buildPl(),t:'answer',id:r.id,a})};
$('reqYes').onclick=()=>reqOrder('ja');$('reqMore').onclick=()=>reqOrder('meer');$('reqNo').onclick=()=>reqOrder('nee');
$('reqShow').onclick=()=>{const r=openReq(buildPl());if(!r)return;const W=world.W;let x=0,y=0;for(const i of r.tiles){x+=i%W;y+=i/W|0}
  centerOn(x/r.tiles.length+0.5,y/r.tiles.length+0.5);if(cam.z<1.5)cam.z=1.5;clampCam()};
