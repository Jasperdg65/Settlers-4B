"use strict";
/* ---------- Productie (mijlpaal 5) ----------
   CFG.prod zegt per gebouwtype wat het doet. Twee soorten:
   - buitenwerker (gather): de vakman loopt binnen zijn werkgebied (CFG.prod[type].area tegels rond de deur, op eigen
     grond) naar het dichtstbijzijnde doel, werkt daar, brengt het product naar zijn deur en rust dan binnen.
     tree = boom kappen (wordt een stronk), stone = steenblok bewerken (raakt op), plant = boompje planten (groeit uit).
   - werkplaats (in → out): de vakman verwerkt binnen wat er bij de deur ligt; de planner brengt de invoer (b.want).
   Wat een gebouw maakt en zelf niet vraagt, brengen dragers naar de opslag (transport.js). Elk gebouw houdt een
   toestand b.ps bij voor de tooltip en het paneel Productie. Natuur: boompjes groeien en stronken vergaan via
   wachtrijen op tijd (NAT), zodat er niet elke tick over de hele kaart gelopen hoeft te worden. */
let NAT=null;
function initProduction(){
  const {W,H,obj}=world,N=W*H,c=CFG.nature;
  world.res=new Uint8Array(N);world.rsv=new Uint8Array(N);world.made=world.starts.map(()=>new Uint32Array(GOODS.length));
  NAT={sap:[],sapH:0,stump:[],stumpH:0};
  for(let i=0;i<N;i++){
    if(obj[i]===2)world.res[i]=c.stoneUnits;
    else if(obj[i]===4)NAT.sap.push([hash2(i,5)%c.grow,i]);        // boompjes van de kaartgenerator groeien op een willekeurig moment uit
    else if(obj[i]===5)NAT.stump.push([hash2(i,9)%c.stump,i]);
  }
  NAT.sap.sort((a,b)=>a[0]-b[0]);NAT.stump.sort((a,b)=>a[0]-b[0]);
  for(const b of world.blds){b.pt=0;b.ps='';b.pend=null}
  world.blds.forEach((b,bi)=>{if(!b.dead)bldSlots(bi)});           // stapelplekken vastleggen, zodat er niet op geplant wordt
}
/* natuur: elke CFG.nature.every ticks */
function tickNature(){
  const {obj,tree}=world;
  while(NAT.sapH<NAT.sap.length&&NAT.sap[NAT.sapH][0]<=tickNo){const i=NAT.sap[NAT.sapH++][1];
    if(obj[i]===4){obj[i]=1;tree[i]=(hash2(i,tickNo)%4)*3+hash2(i,3)%3}}   // eik, berk, den of beuk; appelbomen plant de plukker (5b)
  while(NAT.stumpH<NAT.stump.length&&NAT.stump[NAT.stumpH][0]<=tickNo){const i=NAT.stump[NAT.stumpH++][1];if(obj[i]===5)obj[i]=0}
  if(NAT.sapH>512){NAT.sap.splice(0,NAT.sapH);NAT.sapH=0}if(NAT.stumpH>512){NAT.stump.splice(0,NAT.stumpH);NAT.stumpH=0}
}
/* past er nog een stuk van gd bij gebouw bi? */
function roomFor(bi,gd){const st=world.stk,M=CFG.stackMax;for(const i of bldSlots(bi)){const s=st[i]-1;if(s<0||G.bld[s]===bi&&G.good[s]===gd&&G.cnt[s]<M)return true}return false}
/* vraag van een gebouw: tijdelijke vraag (CFG.temp) plus de invoer van zijn werkplaats */
function setWant(b){
  b.want.fill(0);const w=CFG.temp.want[b.type],pc=CFG.prod[b.type];
  if(w)for(const k in w)b.want[GI[k]]=w[k];
  if(pc&&pc.in)for(const k in pc.in)b.want[GI[k]]=pc.stock;
}
const made=(b,gd,n)=>{world.made[b.p][gd]+=n};
function tickProduction(){
  if(tickNo%CFG.nature.every===0)tickNature();
  const bl=world.blds;
  for(let bi=0;bi<bl.length;bi++){
    const b=bl[bi],pc=CFG.prod[b.type];if(!pc||b.dead||b.st)continue;
    if(!b.occ){b.ps='wacht op een vakman';continue}
    const c=b.wkr-1;if(c<0||S.st[c]!==ST.INSIDE)continue;          // buiten aan het werk, of onderweg naar buiten
    if(b.pend){for(const p of b.pend)p[1]=addGoods(bi,p[0],p[1]);b.pend=b.pend.some(p=>p[1])?b.pend:null;if(b.pend){b.ps='opslag bij de deur vol';continue}}
    if(b.pt>0){if(--b.pt===0&&pc.in)finishBatch(b,bi,pc);continue}
    if(pc.gather)startGather(b,bi,pc,c);else startBatch(b,bi,pc);
  }
}
/* ---------- Werkplaats ---------- */
function startBatch(b,bi,pc){
  const src=[];
  for(const k in pc.in)for(let n=0;n<pc.in[k];n++){const s=freeUnitAt(bi,GI[k]);if(s<0||src.includes(s)&&G.cnt[s]-G.res[s]<=src.filter(x=>x===s).length){b.ps='wacht op '+GOODS[GI[k]].n.toLowerCase();return}src.push(s)}
  for(const k in pc.out)if(!roomFor(bi,GI[k])){b.ps='opslag bij de deur vol';return}
  for(const s of src)takeOne(s);
  b.pt=pc.ticks;b.ps='werkt';
}
function finishBatch(b,bi,pc){
  const left=[];for(const k in pc.out){const gd=GI[k],r=addGoods(bi,gd,pc.out[k]);made(b,gd,pc.out[k]);if(r)left.push([gd,r])}
  b.pend=left.length?left:null;
}
/* ---------- Buitenwerker ---------- */
const GATHER_NONE={tree:'geen bomen in het werkgebied',stone:'geen steen in het werkgebied',plant:'geen plek om te planten'};
function startGather(b,bi,pc,c){
  if(pc.out&&!roomFor(bi,GI[pc.out])){b.ps='opslag bij de deur vol';return}
  const t=findTarget(b,pc);
  if(t<0){b.ps=GATHER_NONE[pc.gather];b.pt=pc.rest;return}             // even wachten voor hij opnieuw zoekt
  world.rsv[t]=1;S.src[c]=t;b.ps='werkt';goPath(c,ST.P_OUT,t);          // hij blijft binnen tot de route er is
}
/* dichtstbijzijnde geschikte tegel in het werkgebied (ringen rond de deur), of -1 */
function findTarget(b,pc){
  const {W,H,obj,own,rsv}=world,X=b.x,Y=b.y+1,R=pc.area,me=b.p+1;
  for(let r=0;r<=R;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r||dx*dx+dy*dy>R*R)continue;
    const x=X+dx,y=Y+dy;if(x<2||y<2||x>=W-2||y>=H-2)continue;const i=y*W+x;
    if(own[i]!==me||rsv[i]||!world.walk[i])continue;
    if(pc.gather==='tree'?obj[i]===1&&!pc.spare.includes(world.tree[i]/3|0):pc.gather==='stone'?obj[i]===2&&world.res[i]>0:canPlant(i))return i;
  }
  return -1;
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
/* klaar met werken op de doeltegel: kappen, hakken of planten, en dan naar huis */
function gatherDone(c){
  const b=world.blds[S.dst[c]],pc=CFG.prod[b.type],t=S.src[c],{obj}=world;world.rsv[t]=0;
  if(pc.gather==='tree'&&obj[t]===1){obj[t]=5;NAT.stump.push([tickNo+CFG.nature.stump,t]);S.carry[c]=GI[pc.out]+1}
  else if(pc.gather==='stone'&&obj[t]===2&&world.res[t]>0){if(!--world.res[t])obj[t]=0;S.carry[c]=GI[pc.out]+1}
  else if(pc.gather==='plant'&&canPlant(t)){obj[t]=4;NAT.sap.push([tickNo+CFG.nature.grow,t])}
  goPath(c,ST.P_HOME,doorTile(b));
}
/* thuis: product bij de deur neerleggen en naar binnen; is het gebouw weg, dan is hij een werkloze vakman */
function arriveHome(c){
  const bi=S.dst[c],b=world.blds[bi];S.path[c]=null;
  if(S.carry[c]){const gd=S.carry[c]-1,r=addGoods(bi,gd,1);if(!b.dead)made(b,gd,1);if(r)b.pend=[[gd,r]];S.carry[c]=0}
  if(b.dead||b.wkr!==c+1){toIdle(c);return}
  S.ins[c]=1;S.st[c]=ST.INSIDE;S.x[c]=S.px[c]=b.x+0.5;S.y[c]=S.py[c]=b.y+1.5;b.pt=CFG.prod[b.type].rest;
}
function prodLabel(b){return CFG.prod[b.type]&&!b.st&&!b.dead&&b.ps?' · '+b.ps:''}

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
  if(!world.made)return;const p=+$('stockPl').value||0,rows=[];
  for(const type in CFG.prod){
    const list=world.blds.filter(b=>b.type===type&&b.p===p&&!b.dead&&!b.st);if(!list.length)continue;
    const st={};for(const b of list){const s=b.occ?b.ps||'werkt':'wacht op een vakman';st[s]=(st[s]||0)+1}
    const pc=CFG.prod[type],outs=pc.out?(typeof pc.out==='string'?[pc.out]:Object.keys(pc.out)):[];
    const mk=outs.map(k=>`${world.made[p][GI[k]]} ${GOODS[GI[k]].n.toLowerCase()}`).join(', ');
    rows.push(`<div class="prow"><b>${BTYPES[type].name} ×${list.length}</b><span>${Object.entries(st).map(([s,n])=>(list.length>1?n+' ':'')+s).join(' · ')}</span>`+
      (mk?`<span class="pmade">gemaakt: ${mk}</span>`:'')+'</div>');
  }
  const html=rows.join('')||'<p class="note">Nog geen voltooide werkgebouwen.</p>';
  if(html!==prodShown){prodShown=html;$('prodList').innerHTML=html}
}
