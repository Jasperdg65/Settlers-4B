"use strict";
/* ---------- Bouwen: plaatsen, egaliseren, bouwen, afbreken ----------
   b.st: 0 klaar, 1 bouwplaats wordt geëgaliseerd door gravers, 2 bouwers verwerken planken en steen.
   Tijdens het egaliseren is de bouwplaats beloopbaar (de gravers staan erop); daarna niet meer.
   Graver = beroep 1, bouwer = beroep 2 (CFG.jobs), gelijk aan b.st van de fase waarin ze werken.
   Afgebroken gebouwen houden hun index (b.dead), zodat stapels en lopende opdrachten geldig blijven;
   wat er nog ligt, brengen dragers naar de opslag. */
const canBuild=t=>t!=='burcht'&&!BTYPES[t].off&&!!CFG.build.cost[t];
function initBuild(){
  const {W,H}=world;world.own=new Uint8Array(W*H);world.sites=[];
  for(const b of world.blds){b.wk=0;b.prog=1}
  seatStartCrew();   // de torens van het startdorp zijn meteen bemand (crew.js)
  dealInit();        // afspraken over grond en relaties (deals.js)
  computeLand();harmInit();
}
/* Gebied (mijlpaal 6b, CFG.territory): elke tegel binnen de straal van een bemand gebouw hoort bij het oudste daarvan.
   De burcht is altijd bemand en gaat voor, daarna de torens op volgorde van bemannen (b.mt, dan index).
   Een nieuwe toren neemt dus nooit gedekt land van een buur af. Land dat geen toren meer dekt (de toren is afgebroken),
   blijft van zijn eigenaar, maar is onbeschermd: komt het binnen de straal van een bemande toren van een ander, dan is het van die.
   Gebouwen op land dat zo verloren gaat, blijven staan en werken door; er kan daar alleen niet meer gebouwd worden.
   Daarna gaan de afspraken over grond (world.deals, mijlpaal 8a) boven het gebied uit torens. */
function computeLand(skip=-1,own=world.own){
  const {W,H}=world,prev=world.own.slice();own.fill(0);
  const L=[];world.blds.forEach((b,bi)=>{if(bi!==skip&&CFG.territory[b.type]&&!b.dead&&!b.st&&(b.type==='burcht'||b.occ))L.push(bi)});
  const key=bi=>{const b=world.blds[bi];return b.type==='burcht'?-1:b.mt||0};
  L.sort((a,c)=>key(a)-key(c)||a-c);
  for(const bi of L){const b=world.blds[bi],r=CFG.territory[b.type];
    for(let y=Math.max(0,b.y-r);y<=Math.min(H-1,b.y+r);y++)for(let x=Math.max(0,b.x-r);x<=Math.min(W-1,b.x+r);x++)
      if(!own[y*W+x]&&Math.hypot(x-b.x,y-b.y)<=r)own[y*W+x]=b.p+1}
  applyDeals(own);
  for(let i=0;i<own.length;i++)if(!own[i])own[i]=prev[i];   // onbeschermd land blijft van wie het had
  if(own!==world.own)return own;
  world.landVer=(world.landVer||0)+1;if(typeof buildMini==='function'&&miniBase)buildMini();
}
/* tegels van de bouwplaats die geëgaliseerd worden (hoekpunten rond de voetafdruk, zoals de mapgenerator doet) */
function siteRegion(fp,ax,ay,fn){for(let dy=fp[2]-1;dy<=fp[3]+1;dy++)for(let dx=fp[0]-1;dx<=fp[1]+1;dx++)fn(ax+dx,ay+dy,dx>=fp[0]&&dx<=fp[1]&&dy>=fp[2]&&dy<=fp[3])}
/* '' als gebouw type met anker (ax,ay) hier mag voor speler p, anders de reden */
function canPlace(type,ax,ay,p){
  const {W,H,ter,obj,bldAt,hp,walk,own,stk}=world,fp=BTYPES[type].fp,mine=!!BTYPES[type].ore;
  if(ax+fp[0]-1<1||ay+fp[2]-1<1||ax+fp[1]+1>=W-1||ay+fp[3]+2>=H-1)return 'te dicht bij de rand';
  let mn=Infinity,mx=-Infinity,why='';
  for(let dy=fp[2]-1;dy<=fp[3]+2&&!why;dy++)for(let dx=fp[0]-1;dx<=fp[1]+1;dx++){
    const i=(ay+dy)*W+ax+dx,inFp=dx>=fp[0]&&dx<=fp[1]&&dy>=fp[2]&&dy<=fp[3],t=ter[i];
    if(own[i]!==p+1){why='buiten eigen gebied';break}
    if(bldAt[i]){why='bezet door een ander gebouw';break}
    if(inFp){
      if(mine?!(t===T.ROCKY||t===T.MOUNTAIN):!(t>=T.GRASS&&t<=T.DRY)){why=mine?'een mijn moet op rots of gebergte':'verkeerde ondergrond';break}
      if(obj[i]===1||obj[i]===2){why='er staat een boom of steen in de weg';break}
    }else if(!walk[i]){why='rondom moet het beloopbaar zijn';break}
    if(stk&&stk[i]&&(inFp||dx===0&&dy===fp[3]+1)){why='er liggen goederen in de weg';break}
    if(dy<=fp[3]+1){mn=Math.min(mn,hp[i]);mx=Math.max(mx,hp[i])}
  }
  if(why)return why;
  for(const b of world.blds){if(b.dead)continue;const dx=b.x-ax,dy=b.y+1-ay;if(dx>=fp[0]&&dx<=fp[1]&&dy>=fp[2]&&dy<=fp[3])return 'voor de ingang van een ander gebouw'}
  if(mx-mn>(mine?CFG.build.maxRiseMine:CFG.build.maxRise))return 'te steil';
  return '';
}
function placeSite(type,ax,ay,p){
  const {W,bldAt,bldAnchor,obj,hp}=world,fp=BTYPES[type].fp,bi=world.blds.length,reg=[],h0=[];
  siteRegion(fp,ax,ay,(x,y,inFp)=>{const i=y*W+x;reg.push(i);h0.push(hp[i]);if(inFp){bldAt[i]=bi+1;if(obj[i]>=3)obj[i]=0}});
  const ht=h0.reduce((a,v)=>a+v,0)/h0.length,dev=h0.reduce((a,v)=>a+Math.abs(v-ht),0);
  const dig=Math.ceil(CFG.build.digBase+dev/CFG.build.digPerUnit);
  const b={type,x:ax,y:ay,p,seed:hash2(ax,ay)%1000/1000,occ:0,st:1,reg:Int32Array.from(reg),h0:Float32Array.from(h0),ht,dig,dig0:dig,
    used:new Uint8Array(2),prog:0,wk:0,slots:null,has:new Uint16Array(GOODS.length),want:new Uint8Array(GOODS.length),coming:new Uint8Array(GOODS.length),cool:0};
  bldAnchor[ay*W+ax]=bi+1;world.blds.push(b);world.sites.push(bi);
  for(const o of world.blds)if(o.slots)o.slots=o.slots.filter(t=>!bldAt[t]); // stapelplekken onder de nieuwe voetafdruk vervallen
  invalidateTiles(b.reg);buildMini();stockVer++;return bi;
}
const fpTiles=(b,fn)=>{const fp=BTYPES[b.type].fp,W=world.W;for(let dy=fp[2];dy<=fp[3];dy++)for(let dx=fp[0];dx<=fp[1];dx++)fn((b.y+dy)*W+b.x+dx)};
function digStep(b){
  b.dig--;const f=1-b.dig/b.dig0,{hp}=world;
  for(let k=0;k<b.reg.length;k++)hp[b.reg[k]]=b.h0[k]+(b.ht-b.h0[k])*f;
  invalidateTiles(b.reg);
  if(b.dig>0)return;
  /* vlak: nu wordt de voetafdruk onbeloopbaar en komen de materialen */
  b.st=2;fpTiles(b,i=>world.walk[i]=0);world.walkVer++;
  const c=CFG.build.cost[b.type];b.want[GI.plank]=c[0];b.want[GI.steen]=c[1];stockVer++;
}
/* één plank of steen verwerken; false als er niets ligt */
function buildStep(b,bi){
  const c=CFG.build.cost[b.type];
  for(const [k,gd] of [[0,GI.plank],[1,GI.steen]]){
    if(b.used[k]>=c[k])continue;const s=freeUnitAt(bi,gd);if(s<0)continue;
    takeOne(s);b.used[k]++;b.want[gd]--;b.prog=(b.used[0]+b.used[1])/(c[0]+c[1]);
    if(b.prog>=1){b.st=0;b.prog=1;b.born=0;setWant(b);b.pt=0;b.run=0;b.ps='';b.make='auto';b.rec=null;world.sites.splice(world.sites.indexOf(bi),1);invalidateTiles(b.reg);stockVer++}
    return true;
  }
  return false;
}
function demolish(bi){
  const b=world.blds[bi];if(!b||b.dead||b.type==='burcht')return false;
  const {W,ter,bldAt,bldAnchor,walk}=world,c=CFG.build.cost[b.type]||[0,0],used=b.st?b.used:c;
  fpTiles(b,i=>{bldAt[i]=0;walk[i]=ter[i]>=T.SAND&&ter[i]<=T.MOUNTAIN?1:0});bldAnchor[b.y*W+b.x]=0;world.walkVer++;
  if(b.st)world.sites.splice(world.sites.indexOf(bi),1);
  releaseWorker(b);releaseCrew(b);b.dead=1;b.st=0;b.want.fill(0);if(CFG.territory[b.type])computeLand();
  addGoods(bi,GI.plank,Math.floor(used[0]*CFG.build.refund));addGoods(bi,GI.steen,Math.floor(used[1]*CFG.build.refund));
  const reg=[];siteRegion(BTYPES[b.type].fp,b.x,b.y,(x,y)=>reg.push(y*W+x));invalidateTiles(reg);buildMini();stockVer++;return true;
}
/* gravers en bouwers naar bouwplaatsen; zonder vrije werker haalt een vrije drager eerst het gereedschap */
function planWorkers(M){
  let made=0;const W=world.W;
  for(const bi of world.sites){
    const b=world.blds[bi],kind=b.st,max=kind===1?CFG.build.diggers:CFG.build.builders;
    if(b.cool>tickNo||kind===2&&!b.has[GI.plank]&&!b.has[GI.steen])continue;
    while(b.wk<max&&made<M){
      const c=nearestIdle(b.p,doorTile(b),kind);
      if(c>=0){sendWorker(c,bi);made++;continue}
      let busy=false;for(let i=0;i<S.n;i++)if(S.pl[i]===b.p&&S.jb[i]===kind&&(S.st[i]===ST.PATH_TOOL||S.st[i]===ST.TO_TOOL)){busy=true;break}
      if(busy||freeCarriers(b.p)<=CFG.carry.keepFree)break; // al iemand onderweg naar gereedschap, of te weinig vrije dragers
      const s=nearestSource(b.p,GI[CFG.jobs[kind].tool],bi,b.x,b.y);if(s<0)break;
      const r=nearestIdle(b.p,G.tile[s],0);if(r<0)break;
      G.res[s]++;S.gd[r]=G.good[s];S.src[r]=s;S.dst[r]=bi;S.jb[r]=kind;S.cm[r]=0;S.wait[r]=0;goPath(r,ST.PATH_TOOL,G.tile[s]);made++;break;
    }
  }
  return made;
}
function sendWorker(c,bi){
  const b=world.blds[bi],fp=BTYPES[b.type].fp,{W,walk,bldAt}=world,opts=[];
  b.wk++;S.dst[c]=bi;S.cm[c]=0;S.wait[c]=0;
  if(b.st===1)fpTiles(b,i=>opts.push(i)); // gravers op de bouwplaats
  else siteRegion(fp,b.x,b.y,(x,y,inFp)=>{const i=y*W+x;if(!inFp&&walk[i]&&!bldAt[i])opts.push(i)}); // bouwers eromheen
  goPath(c,ST.PATH_WORK,opts.length?opts[srand()*opts.length|0]:doorTile(b));
}
function siteWork(c){
  const bi=S.dst[c],b=world.blds[bi],kind=S.job[c];
  if(b.dead||b.st!==kind){b.wk--;toIdle(c);return}
  if(kind===1)digStep(b);else if(!buildStep(b,bi)){S.wait[c]=20;return} // wachten op materiaal
  if(b.st===kind)S.wait[c]=kind===1?CFG.build.digTicks:CFG.build.buildTicks;else{b.wk--;toIdle(c)}
}
function siteLabel(b){
  const pc=Math.round(100*siteProgress(b))+'%';
  if(b.st===1)return ` · bouwplaats ${pc}: egaliseren (${b.dig0-b.dig}/${b.dig0} beurten)`;
  if(b.st===2){const c=CFG.build.cost[b.type];return ` · in aanbouw ${pc}: ${b.used[0]+b.used[1]}/${c[0]+c[1]} verwerkt`}
  return '';
}
/* grondchunks met deze tegels opnieuw laten tekenen (de oude blijft zichtbaar tot de nieuwe klaar is) */
function invalidateTiles(list){
  const W=world.W,keys=new Set();
  for(const i of list){const x=i%W,y=i/W|0;for(const yy of [y-1,y])for(const xx of [x-1,x])if(xx>=0&&yy>=0)keys.add(Math.floor(yy/CH)*1000+Math.floor(xx/CH))}
  for(const k of keys)for(const r of [1,1.5]){const ch=chunks.get(k+r*1e6);if(ch)ch.stale=true}
}

/* ---------- Tekenen: grondlaag van bouwplaatsen en het plaatsen ---------- */
function tileQuad(x,y,col,stroke){const {W,hp}=world,a=y*W+x;
  ctx.beginPath();ctx.moveTo(SX(x,y),y*TH-hp[a]);ctx.lineTo(SX(x+1,y),y*TH-hp[a+1]);ctx.lineTo(SX(x+1,y+1),(y+1)*TH-hp[a+W+1]);ctx.lineTo(SX(x,y+1),(y+1)*TH-hp[a+W]);ctx.closePath();
  if(col){ctx.fillStyle=col;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=0.6;ctx.stroke()}}
function drawSitesGround(v){
  const {hp}=world;
  for(const bi of world.sites){
    const b=world.blds[bi],fp=BTYPES[b.type].fp,cx=SX(b.x,b.y);if(cx<v.l-80||cx>v.r+80||b.y*TH<v.t-40||b.y*TH>v.b+HP+40)continue;
    const f=b.st===1?1-b.dig/b.dig0:1;
    fpTiles(b,i=>tileQuad(i%world.W,i/world.W|0,`rgba(128,92,58,${0.18+0.42*f})`));
    /* touw tussen vier paaltjes op de hoeken */
    const c=[[fp[0],fp[2]],[fp[1]+1,fp[2]],[fp[1]+1,fp[3]+1],[fp[0],fp[3]+1]].map(([dx,dy])=>{const x=b.x+dx,y=b.y+dy;return [SX(x,y),y*TH-hAt(x,y)]});
    ctx.strokeStyle='rgba(235,220,180,.9)';ctx.lineWidth=0.5;ctx.beginPath();c.forEach(([x,y],k)=>k?ctx.lineTo(x,y-2.4):ctx.moveTo(x,y-2.4));ctx.closePath();ctx.stroke();
    ctx.strokeStyle='#6b4a2b';ctx.lineWidth=0.9;ctx.beginPath();for(const [x,y] of c){ctx.moveTo(x,y);ctx.lineTo(x,y-3.6)}ctx.stroke();
  }
}
/* voortgangsmeter boven elke bouwplaats, bovenop alles: egaliseren telt als CFG.build.digShare van het geheel.
   Bruin = egaliseren, groen = bouwen; schop of hamer ernaast; vanaf zoom 1,5 ook het percentage */
function siteProgress(b){const d=CFG.build.digShare;return b.st===1?d*(1-b.dig/b.dig0):d+(1-d)*b.prog}
function drawSiteBars(v,blit){
  const k=Math.max(1,1.3/cam.z); // op kleine zoom niet onleesbaar klein
  for(const bi of world.sites){
    const b=world.blds[bi],s=bldSprite(b.type,b.p,PCOL),bx=SX(b.x,b.y),top=b.y*TH-world.hp[b.y*world.W+b.x]-s.ay-3*k;
    if(bx<v.l-40||bx>v.r+40||top<v.t-20||top>v.b+20)continue;
    const f=siteProgress(b),w=26*k,h=3.6*k,x0=bx-w/2+3*k,d=CFG.build.digShare;
    ctx.fillStyle='rgba(20,16,10,.7)';ctx.fillRect(x0-0.8*k,top-h-0.8*k,w+1.6*k,h+1.6*k);
    ctx.fillStyle='#a8743e';ctx.fillRect(x0,top-h,w*Math.min(f,d),h);
    if(f>d){ctx.fillStyle='#4fbf5a';ctx.fillRect(x0+w*d,top-h,w*(f-d),h)}
    ctx.fillStyle='rgba(255,255,255,.55)';ctx.fillRect(x0+w*d-0.25*k,top-h,0.5*k,h); // scheiding egaliseren | bouwen
    const ic=carrySprite(b.st===1?GI.schop:GI.hamer),sc=0.75*k;
    ctx.drawImage(ic.c,x0-1.5*k-ic.w*sc,top-h/2-ic.ay*sc,ic.w*sc,ic.h*sc);
    if(cam.z>=1.5){const lbl=Math.round(f*100)+'%'+(b.st===2&&!b.has[GI.plank]&&!b.has[GI.steen]&&b.prog<1?' · wacht op materiaal':'');
      ctx.font=`600 ${3.6*k}px "Source Sans 3",sans-serif`;ctx.textAlign='center';ctx.lineWidth=0.9*k;ctx.strokeStyle='rgba(20,16,10,.8)';
      ctx.strokeText(lbl,x0+w/2,top-h-1.6*k);ctx.fillStyle='#fff';ctx.fillText(lbl,x0+w/2,top-h-1.6*k);ctx.textAlign='start'}
  }
}
/* grens van elk gebied, altijd zichtbaar: per speler één pad langs de tegelranden waar het land van eigenaar wisselt,
   iets naar binnen (CFG.border.inset), zodat twee buren elk hun eigen lijn houden. Op de grond getekend, onder bomen en gebouwen. */
function drawBorders(yMin,yMax,xr){
  const {W,H,own,hp}=world,c=CFG.border,a=c.inset,P=[];
  const pt=(x,y,cx,cy)=>{const sx=SX(x,y),sy=y*TH-hp[y*W+x];return [sx+(cx-sx)*a*2,sy+(cy-sy)*a*2]};
  for(let y=Math.max(0,yMin);y<=Math.min(H-2,yMax);y++){const [xa,xb]=xr(y);
    for(let x=Math.max(0,xa);x<=Math.min(W-2,xb);x++){const i=y*W+x,o=own[i];if(!o)continue;
      const l=x>0&&own[i-1]===o,r=own[i+1]===o,u=y>0&&own[i-W]===o,d=own[i+W]===o;if(l&&r&&u&&d)continue;
      const cx=SX(x+0.5,y+0.5),cy=(y+0.5)*TH-hAt(x+0.5,y+0.5),p=P[o]||(P[o]=new Path2D());
      const A=pt(x,y,cx,cy),B=pt(x+1,y,cx,cy),C=pt(x+1,y+1,cx,cy),D=pt(x,y+1,cx,cy);
      const seg=(m,n)=>{p.moveTo(m[0],m[1]);p.lineTo(n[0],n[1])};
      if(!u)seg(A,B);if(!r)seg(B,C);if(!d)seg(D,C);if(!l)seg(A,D)}}
  const w=Math.max(c.minWidth,c.width/cam.z);ctx.lineCap='round';ctx.globalAlpha=c.alpha;
  for(let o=1;o<P.length;o++){if(!P[o])continue;
    ctx.strokeStyle='rgba(20,14,8,.55)';ctx.lineWidth=w*1.9;ctx.stroke(P[o]);
    ctx.strokeStyle=PCOL[o-1];ctx.lineWidth=w;ctx.stroke(P[o])}
  ctx.globalAlpha=1;ctx.lineCap='butt';
}
const BUILD={mode:null,type:null,ax:0,ay:0,why:'',hover:-1};
const buildPl=()=>+$('bldPl').value||0;
function drawBuildOverlay(v,blit){
  if(!BUILD.mode)return;const {W,H}=world,p=buildPl();
  if(BUILD.mode==='place'&&BUILD.type){
    const fp=BTYPES[BUILD.type].fp,ok=!BUILD.why,{ax,ay}=BUILD;if(ax+fp[0]<0||ay+fp[2]<0||ax+fp[1]>=W-1||ay+fp[3]+1>=H-1)return;
    for(let dy=fp[2];dy<=fp[3];dy++)for(let dx=fp[0];dx<=fp[1];dx++)tileQuad(ax+dx,ay+dy,ok?'rgba(70,200,90,.45)':'rgba(220,60,50,.45)',ok?'#3ec25a':'#e0463c');
    tileQuad(ax,ay+fp[3]+1,null,ok?'#3ec25a':'#e0463c');
    ctx.globalAlpha=0.55;blit(bldSprite(BUILD.type,p,PCOL),SX(ax,ay),ay*TH-world.hp[ay*W+ax]);ctx.globalAlpha=1;
  }
  if(BUILD.mode==='demolish'&&BUILD.hover>=0){const b=world.blds[BUILD.hover];fpTiles(b,i=>tileQuad(i%W,i/W|0,'rgba(220,60,50,.5)','#e0463c'))}
}

/* ---------- Paneel 'Bouwen' ---------- */
function buildBuildPanel(){
  const sel=$('bldPl'),P=world.starts.length,keep=sel.value;sel.innerHTML='';
  for(let p=0;p<P;p++){const o=document.createElement('option');o.value=p;o.textContent='Speler '+(p+1);sel.appendChild(o)}
  if(keep&&+keep<P)sel.value=keep;
  const box=$('buildList');box.innerHTML='';const p=buildPl();
  for(const type in BTYPES){if(!canBuild(type))continue;const c=CFG.build.cost[type];
    const bt=document.createElement('button');bt.className='bb';bt.dataset.type=type;bt.title=BTYPES[type].name;
    bt.appendChild(thumb(bldSprite(type,p,PCOL),56,42));
    const n=document.createElement('span');n.textContent=BTYPES[type].name.replace(/ \(.*\)/,'');bt.appendChild(n);
    const k=document.createElement('small');k.textContent=`${c[0]} plank · ${c[1]} steen`;bt.appendChild(k);
    const a=document.createElement('b');a.className='aantal';bt.appendChild(a);
    bt.onclick=()=>setBuildMode(BUILD.mode==='place'&&BUILD.type===type?null:'place',type);box.appendChild(bt)}
  setBuildMode(null);bldCountKey='';refreshBuildCounts();
}
/* rechtsboven in elk vakje: hoeveel van dat gebouw de speler heeft (klaar + in aanbouw); elke seconde bijgewerkt */
let bldCountKey='';
function refreshBuildCounts(){
  if(!world||!world.blds||!world.own)return;const p=buildPl(),n={},s={};
  for(const b of world.blds)if(b.p===p&&!b.dead){n[b.type]=(n[b.type]||0)+1;if(b.st)s[b.type]=(s[b.type]||0)+1}
  const key=p+JSON.stringify(n)+JSON.stringify(s);if(key===bldCountKey)return;bldCountKey=key;
  const L=$('buildList');if(!L.querySelectorAll)return;   // Node-tests
  for(const bt of L.querySelectorAll('.bb')){const ty=bt.dataset.type,a=bt.querySelector('.aantal');if(!a)continue;
    a.textContent=n[ty]||'';a.title=n[ty]?t('bouw.aantal',{klaar:n[ty]-(s[ty]||0),bouw:s[ty]||0}):''}
}
if(typeof setInterval==='function')setInterval(refreshBuildCounts,1000);   // niet in de Node-tests
function setBuildMode(mode,type=null){
  BUILD.mode=mode;BUILD.type=type;BUILD.why='';BUILD.hover=-1;
  if(mode!=='deal'&&DEAL.mode){DEAL.mode=null;DEAL.corner=-1;dealUI()}   // grond aantekenen (deals.js) stopt
  for(const b of $('buildList').children)b.classList.toggle('on',mode==='place'&&b.dataset.type===type);
  $('demolish').classList.toggle('on',mode==='demolish');
  $('buildMsg').textContent=mode==='deal'?'':mode==='place'?`${BTYPES[type].name}: klik op de kaart om te plaatsen. Esc of rechtermuisknop stopt.`
    :mode==='demolish'?'Klik op een gebouw of bouwplaats van deze speler om af te breken. Esc of rechtermuisknop stopt.'
    :'Kies een gebouw. Gravers egaliseren eerst, dragers brengen planken en steen, bouwers maken het af.';
  cv.style.cursor=mode?'crosshair':'';
}
/* muis boven tegel (x,y) in bouwmodus: anker en reden bijwerken; geeft de tooltip-tekst */
function buildHover(x,y){
  const p=buildPl();
  if(BUILD.mode==='deal')return dealHover(x,y);
  if(BUILD.mode==='place'){BUILD.ax=x;BUILD.ay=y+1;BUILD.why=canPlace(BUILD.type,BUILD.ax,BUILD.ay,p);
    const c=CFG.build.cost[BUILD.type];return BUILD.why?'Kan niet: '+BUILD.why:`${BTYPES[BUILD.type].name} bouwen · ${c[0]} plank, ${c[1]} steen`}
  const bi=world.bldAt[y*world.W+x]-1,b=bi>=0?world.blds[bi]:null;BUILD.hover=-1;
  if(!b)return 'Geen gebouw';if(b.p!==p)return 'Van een andere speler';if(b.type==='burcht')return 'De burcht kan niet worden afgebroken';
  BUILD.hover=bi;const c=CFG.build.cost[b.type]||[0,0],u=b.st?b.used:c,r=CFG.build.refund;
  return `${BTYPES[b.type].name} afbreken · geeft ${Math.floor(u[0]*r)} plank, ${Math.floor(u[1]*r)} steen terug`+landLoss(bi);
}
/* bij afbreken van een bemande toren: het land blijft, behalve wat binnen de straal van een toren van een ander valt */
function landLoss(bi){
  const b=world.blds[bi];if(!CFG.territory[b.type]||b.st||!b.occ)return '';
  const own=world.own,na=computeLand(bi,new Uint8Array(own.length)),me=b.p+1;let n=0;
  for(let i=0;i<own.length;i++)if(own[i]===me&&na[i]!==me)n++;if(!n)return t('gebied.blijft');
  const out=world.blds.filter((o,oi)=>oi!==bi&&o.p===b.p&&!o.dead&&na[o.y*world.W+o.x]!==me);
  return t('gebied.verlies',{n:getal(n)})+(out.length?t('gebied.buiten',{lijst:out.map(o=>BTYPES[o.type].name+(o.st?t('gebied.bouwplaats'):'')).join(', ')}):'');
}
/* klik in bouwmodus: als opdracht (orders.js), net zoals een computerbuur bouwt */
function buildClick(){
  if(BUILD.mode==='deal'){dealClick();return}
  if(BUILD.mode==='place'&&!BUILD.why){order({p:buildPl(),t:'place',type:BUILD.type,x:BUILD.ax,y:BUILD.ay});BUILD.why='wordt geplaatst'}
  else if(BUILD.mode==='demolish'&&BUILD.hover>=0){order({p:buildPl(),t:'demolish',b:BUILD.hover});BUILD.hover=-1}
}
$('bldPl').onchange=()=>{buildBuildPanel();dealClear()};
$('demolish').onclick=()=>setBuildMode(BUILD.mode==='demolish'?null:'demolish');
