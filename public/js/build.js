"use strict";
/* ---------- Bouwen: plaatsen, egaliseren, bouwen, afbreken ----------
   b.st: 0 klaar, 1 bouwplaats wordt geëgaliseerd door gravers, 2 bouwers verwerken planken en steen.
   Tijdens het egaliseren is de bouwplaats beloopbaar (de gravers staan erop); daarna niet meer.
   Afgebroken gebouwen houden hun index (b.dead), zodat stapels en lopende opdrachten geldig blijven;
   wat er nog ligt, brengen dragers naar de opslag. */
const JOBS=[{n:'Drager'},{n:'Graver',tool:'schop'},{n:'Bouwer',tool:'hamer'}];
const canBuild=t=>t!=='burcht'&&!!CFG.build.cost[t];
function initBuild(){
  const {W,H}=world,own=world.own=new Uint8Array(W*H);world.sites=[];
  /* TIJDELIJK (CFG.territory): eigen gebied rond de burcht en de wachttorens van de start; wie eerst komt */
  for(const b of world.blds){const r=CFG.territory[b.type];if(!r||b.dead)continue;
    for(let y=Math.max(0,b.y-r);y<=Math.min(H-1,b.y+r);y++)for(let x=Math.max(0,b.x-r);x<=Math.min(W-1,b.x+r);x++)
      if(!own[y*W+x]&&Math.hypot(x-b.x,y-b.y)<=r)own[y*W+x]=b.p+1}
  for(const b of world.blds){b.wk=0;b.prog=1}
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
    if(b.prog>=1){b.st=0;b.prog=1;setTempWant(b);world.sites.splice(world.sites.indexOf(bi),1);invalidateTiles(b.reg);stockVer++}
    return true;
  }
  return false;
}
function demolish(bi){
  const b=world.blds[bi];if(!b||b.dead||b.type==='burcht')return false;
  const {W,ter,bldAt,bldAnchor,walk}=world,c=CFG.build.cost[b.type]||[0,0],used=b.st?b.used:c;
  fpTiles(b,i=>{bldAt[i]=0;walk[i]=ter[i]>=T.SAND&&ter[i]<=T.MOUNTAIN?1:0});bldAnchor[b.y*W+b.x]=0;world.walkVer++;
  if(b.st)world.sites.splice(world.sites.indexOf(bi),1);
  b.dead=1;b.st=0;b.occ=0;b.want.fill(0);
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
      if(busy)break; // er is al iemand onderweg naar gereedschap
      const s=nearestSource(b.p,GI[JOBS[kind].tool],bi,b.x,b.y);if(s<0)break;
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
  if(b.st===1)return ` · bouwplaats: egaliseren ${Math.round(100*(1-b.dig/b.dig0))}%`;
  if(b.st===2){const c=CFG.build.cost[b.type];return ` · in aanbouw ${b.used[0]+b.used[1]}/${c[0]+c[1]}`}
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
const BUILD={mode:null,type:null,ax:0,ay:0,why:'',hover:-1};
const buildPl=()=>+$('bldPl').value||0;
function drawBuildOverlay(v,blit){
  if(!BUILD.mode)return;const {W,H,own}=world,p=buildPl();
  /* TIJDELIJK tot mijlpaal 6: grens van het eigen gebied alleen tijdens bouwen/afbreken, als stippen */
  const yMin=Math.max(1,Math.floor(v.t/TH)-2),yMax=Math.min(H-2,Math.ceil((v.b+HP)/TH)+2);ctx.fillStyle=PCOL[p];
  for(let y=yMin;y<=yMax;y++){const xa=Math.max(1,Math.floor((v.l-H*TW/2+y*TW/2)/TW)-2),xb=Math.min(W-2,Math.ceil((v.r-H*TW/2+y*TW/2)/TW)+2);
    for(let x=xa;x<=xb;x++){const i=y*W+x;if(own[i]!==p+1)continue;if(own[i-1]===p+1&&own[i+1]===p+1&&own[i-W]===p+1&&own[i+W]===p+1)continue;
      ctx.fillRect(SX(x+0.5,y+0.5)-1,(y+0.5)*TH-hAt(x+0.5,y+0.5)-1,2,2)}}
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
    bt.onclick=()=>setBuildMode(BUILD.mode==='place'&&BUILD.type===type?null:'place',type);box.appendChild(bt)}
  setBuildMode(null);
}
function setBuildMode(mode,type=null){
  BUILD.mode=mode;BUILD.type=type;BUILD.why='';BUILD.hover=-1;
  for(const b of $('buildList').children)b.classList.toggle('on',mode==='place'&&b.dataset.type===type);
  $('demolish').classList.toggle('on',mode==='demolish');
  $('buildMsg').textContent=mode==='place'?`${BTYPES[type].name}: klik op de kaart om te plaatsen. Esc of rechtermuisknop stopt.`
    :mode==='demolish'?'Klik op een gebouw of bouwplaats van deze speler om af te breken. Esc of rechtermuisknop stopt.'
    :'Kies een gebouw. Gravers egaliseren eerst, dragers brengen planken en steen, bouwers maken het af.';
  cv.style.cursor=mode?'crosshair':'';
}
/* muis boven tegel (x,y) in bouwmodus: anker en reden bijwerken; geeft de tooltip-tekst */
function buildHover(x,y){
  const p=buildPl();
  if(BUILD.mode==='place'){BUILD.ax=x;BUILD.ay=y+1;BUILD.why=canPlace(BUILD.type,BUILD.ax,BUILD.ay,p);
    const c=CFG.build.cost[BUILD.type];return BUILD.why?'Kan niet: '+BUILD.why:`${BTYPES[BUILD.type].name} bouwen · ${c[0]} plank, ${c[1]} steen`}
  const bi=world.bldAt[y*world.W+x]-1,b=bi>=0?world.blds[bi]:null;BUILD.hover=-1;
  if(!b)return 'Geen gebouw';if(b.p!==p)return 'Van een andere speler';if(b.type==='burcht')return 'De burcht kan niet worden afgebroken';
  BUILD.hover=bi;const c=CFG.build.cost[b.type]||[0,0],u=b.st?b.used:c,r=CFG.build.refund;
  return `${BTYPES[b.type].name} afbreken · geeft ${Math.floor(u[0]*r)} plank, ${Math.floor(u[1]*r)} steen terug`;
}
function buildClick(){
  if(BUILD.mode==='place'&&!BUILD.why){placeSite(BUILD.type,BUILD.ax,BUILD.ay,buildPl());BUILD.why=canPlace(BUILD.type,BUILD.ax,BUILD.ay,buildPl())}
  else if(BUILD.mode==='demolish'&&BUILD.hover>=0){demolish(BUILD.hover);BUILD.hover=-1}
}
$('bldPl').onchange=buildBuildPanel;
$('demolish').onclick=()=>setBuildMode(BUILD.mode==='demolish'?null:'demolish');
