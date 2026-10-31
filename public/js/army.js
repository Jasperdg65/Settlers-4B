"use strict";
/* ---------- Krachtpatsers in het veld: lopen, opdrachten, selecteren (modus 'Duel-test', S.army) ----------
   Toestand per eenheid S.ast (AS): staan, wacht op route, lopen, zit aan de duel-tafel, duelleert, uitgeschakeld
   bij de heler. S.aim zegt wat er gebeurt bij aankomst (AIM). Verder S.fat (vermoeidheid 0..1), S.ko (uitgeschakeld),
   S.out (ticks tot hij weer meedoet), S.du (duel + 1, zie duel.js), S.fed (gevoed).
   Muis en toetsen veranderen de simulatie nooit direct: opdrachten gaan in ARMY.cmd en worden in de volgende tick
   uitgevoerd, zodat alles alleen van ticks en opdrachten afhangt (deterministisch; later ook bruikbaar voor netwerk).
   De selectie zelf is alleen weergave en hoort niet bij de simulatie. */
const AS={IDLE:0,PATH:1,WALK:2,SEAT:3,DUEL:4,OUT:5};
const AIM={IDLE:0,SEAT:1,HEAL:2};
const LVLNAME=['','junior','medior','senior'],INSTR=['','fluit','harp','doedelzak'];
const ARMY={p:0,sel:[],groups:[],cmd:[],last:'',won:[],tap:{k:-1,t:0},ping:null};
const SEL={box:null};
let drand=mulberry32(1);   // eigen toeval voor duels, los van de dieren (die gebruiken srand)    // sleeprechthoek in schermpixels [x0, y0, x1, y1]

/* dichtstbijzijnde beloopbare plek bij (X, Y), in een kleine spiraal */
function freeSpot(X,Y){
  const {W,H,walk}=world;
  for(let r=0;r<5;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const x=X+dx,y=Y+dy;if(x>1&&y>1&&x<W-2&&y<H-2&&walk[(y|0)*W+(x|0)])return [x,y];
  }
  return [X,Y];
}
/* open veld bij startplek s: het dichtstbijzijnde midden met (2rx+1) × (2ry+1) beloopbare tegels zonder boom, steen of gebouw
   (anders het beste dat er is), zodat tafels en figuren niet achter het dorp verdwijnen */
function openArea(s,rx,ry){
  const {W,H,walk,obj,bldAt}=world;let best=[s.cx+0.5,s.cy+8.5],bs=-1;
  for(let r=6;r<45;r++)for(let a=0;a<r*6;a++){
    const x=Math.round(s.cx+Math.cos(a/(r*6)*6.2832)*r),y=Math.round(s.cy+Math.sin(a/(r*6)*6.2832)*r);
    if(x-rx<2||y-ry<2||x+rx>W-3||y+ry>H-3)continue;
    let n=0;for(let yy=y-ry;yy<=y+ry;yy++)for(let xx=x-rx;xx<=x+rx;xx++){const i=yy*W+xx;if(walk[i]&&!obj[i]&&!bldAt[i])n++}
    if(n>bs){bs=n;best=[x+0.5,y+0.5];if(n===(2*rx+1)*(2*ry+1))return best}
  }
  return best;
}
/* testopstelling: per speler 1 en 2 krachtpatsers (CFG.duel.test.levels) in twee rijen tegenover elkaar, met een heler erachter,
   op een open veld bij burcht 1 */
function spawnDuelTest(){
  const P=world.starts.length,t=CFG.duel.test;S.eco=0;S.carry=null;S.army=1;
  drand=mulberry32(hashStr(world.seed+'#duel'));tickNo=0;
  DUELS.length=0;Object.assign(ARMY,{sel:[],groups:[],cmd:[],last:'',won:new Array(P).fill(0),ping:null});
  world.harm=new Array(P).fill(CFG.duel.harmonyStart);
  if(P<2){allocUnits(0);ARMY.last='Duel-test heeft twee spelers nodig.';return}
  const [cx,cy]=openArea(world.starts[0],Math.ceil(t.gap/2+5),3),list=[];ARMY.at=[cx,cy];
  for(let p=0;p<2;p++){const side=p?1:-1;
    t.levels.forEach((l,k)=>list.push([p,2,l,cx+side*(t.gap/2+(k%2)*1.1),cy+((k>>1)-1)*1.3]));
    list.push([p,4,t.healers[p],cx+side*(t.gap/2+3.4),cy]);
    t.musicians[p].forEach((l,k)=>list.push([p,5,l,cx+side*(t.gap/2+2.3),cy-1.9-k*1.1]))}
  allocUnits(list.length);
  for(const k of ['fat'])S[k]=new Float32Array(S.n);
  for(const k of ['ast','aim','ko','fed'])S[k]=new Uint8Array(S.n);
  S.out=new Uint16Array(S.n);S.du=new Int16Array(S.n);S.seq=new Uint16Array(S.n);S.pi=new Uint16Array(S.n);S.path=new Array(S.n).fill(null);
  list.forEach(([p,role,l,X,Y],i)=>{const [x,y]=freeSpot(X,Y);
    S.x[i]=S.px[i]=S.hx[i]=S.tx[i]=x;S.y[i]=S.py[i]=S.hy[i]=S.ty[i]=y;S.pl[i]=p;S.role[i]=role;S.lvl[i]=l;S.fed[i]=1;
    S.vr[i]=i%ROLES[role].vars;S.dir[i]=p?1:0;S.d8[i]=p?4:0});
  pathInit();
}
/* naar (X, Y) lopen; aim = wat er bij aankomst gebeurt. Een nieuwere opdracht maakt een oude route ongeldig (S.seq). */
function armyGo(i,X,Y,aim){
  const q=++S.seq[i];S.ast[i]=AS.PATH;S.aim[i]=aim;S.tx[i]=X;S.ty[i]=Y;S.path[i]=null;
  findPath(tileOf(i),(Y|0)*world.W+(X|0),p=>{if(S.seq[i]!==q)return;
    if(!p){if(aim===AIM.SEAT)cancelDuel(S.du[i]-1);else{S.tx[i]=S.x[i];S.ty[i]=S.y[i];arriveArmy(i)}return}
    S.path[i]=p;S.pi[i]=p.length>1?1:0;S.ast[i]=AS.WALK});
}
function armyStop(i){S.seq[i]++;S.path[i]=null;S.ast[i]=AS.IDLE}
function arriveArmy(i){
  S.path[i]=null;const a=S.aim[i];
  if(a===AIM.SEAT){S.ast[i]=AS.SEAT;const d=DUELS[S.du[i]-1];if(d)S.d8[i]=d.a===i?0:4}
  else if(a===AIM.HEAL){S.ast[i]=AS.OUT;S.out[i]=CFG.duel.outTicks}
  else S.ast[i]=AS.IDLE;
}
/* route volgen: tegelmiddens, het laatste stuk recht naar het doel */
function walkArmy(i){
  const p=S.path[i],W=world.W,k=S.pi[i],mid=p&&k<p.length-1;
  const gx=mid?p[k]%W+0.5:S.tx[i],gy=mid?(p[k]/W|0)+0.5:S.ty[i];
  const dx=gx-S.x[i],dy=gy-S.y[i],d=Math.hypot(dx,dy),m=Math.min(d,CFG.army.speed*(S.ko[i]?CFG.army.hurtSpeed:1));
  if(d>1e-4){S.x[i]+=dx/d*m;S.y[i]+=dy/d*m;if(Math.abs(dx*2-dy)>0.05)S.dir[i]=dx*2-dy<0?1:0}
  if(d-m<0.02){if(mid)S.pi[i]=k+1;else arriveArmy(i)}
}
function tickArmy(){
  for(const c of ARMY.cmd)runCmd(c);ARMY.cmd.length=0;
  pathTick();
  const c=CFG.duel;
  for(let i=0;i<S.n;i++){
    S.px[i]=S.x[i];S.py[i]=S.y[i];const st=S.ast[i];
    if(st===AS.WALK)walkArmy(i);
    else if(st===AS.OUT){if(S.out[i]>0){S.out[i]--;S.fat[i]=c.afterOut+(1-c.afterOut)*S.out[i]/c.outTicks}else{S.ko[i]=0;S.ast[i]=AS.IDLE;S.hx[i]=S.x[i];S.hy[i]=S.y[i]}}
    if(st!==AS.DUEL&&!S.ko[i]&&S.fat[i]>0)S.fat[i]=Math.max(0,S.fat[i]-c.rest);
  }
  tickDuels();
}
/* opdrachten: {t:'move', ids, x, y} in een opstelling rond (x, y); {t:'duel', ids, j}: de sterkste vrije uit ids daagt j uit */
function runCmd(c){
  const ids=c.ids.filter(i=>!S.ko[i]&&!S.du[i]&&S.ast[i]!==AS.OUT);if(!ids.length)return;
  if(c.t==='move'){
    const n=ids.length,cols=Math.ceil(Math.sqrt(n)),rows=Math.ceil(n/cols),sp=CFG.army.spacing;
    ids.forEach((i,k)=>{const [x,y]=freeSpot(c.x+(k%cols-(cols-1)/2)*sp,c.y+((k/cols|0)-(rows-1)/2)*sp);armyGo(i,x,y,AIM.IDLE)});
  }else if(c.t==='duel'){
    /* de sterkste uit de selectie gaat (bij gelijke kracht de dichtstbijzijnde), niet zomaar wie vooraan staat */
    const j=c.j,dist=i=>Math.hypot(S.x[i]-S.x[j],S.y[i]-S.y[j]),
      cand=ids.filter(i=>S.role[i]===2&&S.pl[i]!==S.pl[j]).sort((a,b)=>strength(b)-strength(a)||dist(a)-dist(b));
    if(!duelFree(j)){ARMY.last='Die krachtpatser is nu niet uit te dagen.';return}
    if(!cand.length){ARMY.last='Alleen krachtpatsers kunnen uitdagen.';return}
    for(const i of cand)if(challenge(i,j))return;
    ARMY.last='Geen plek voor een duel-tafel gevonden.';
  }
}

/* ---------- Selecteren en opdrachten geven (alleen weergave en invoer) ---------- */
/* schermpositie (CSS-pixels) van de voeten van eenheid i */
function unitScreen(i){const {H}=world,X=S.x[i],Y=S.y[i];return [(X*TW-Y*TW/2+H*TW/2-cam.x)*cam.z+vw/2,(Y*TH-hAt(X,Y)-cam.y)*cam.z+vh/2]}
/* eenheid onder de muis (figuur ongeveer 10 × 19 wereldpixels boven de voeten, pad = extra marge in pixels voor een vinger),
   of −1; duelleerders zitten in de duel-sprite */
function pickUnit(mx,my,pad=0){
  let best=-1,bd=Infinity;const z=cam.z;
  for(let i=0;i<S.n;i++){if(S.ast[i]===AS.DUEL)continue;const [sx,sy]=unitScreen(i);
    if(Math.abs(mx-sx)>5*z+pad||my<sy-19*z-pad||my>sy+2*z+pad)continue;const d=Math.hypot(mx-sx,my-sy+9*z);if(d<bd){bd=d;best=i}}
  return best;
}
/* selecteerbaar: eigen krachtpatsers, helers en muzikanten (het leger trekt samen op) */
const ownKP=i=>S.role[i]>=2&&S.role[i]!==3&&S.pl[i]===ARMY.p;
const onScreen=([x,y])=>x>=0&&y>=0&&x<=vw&&y<=vh;
function armyClick(mx,my,shift){
  const u=pickUnit(mx,my);
  if(u<0||!ownKP(u)){if(!shift)ARMY.sel=[];return}
  /* Shift: alle eigen eenheden van dit type (rol en niveau) in beeld */
  if(shift){const l=S.lvl[u],ro=S.role[u];ARMY.sel=[];for(let i=0;i<S.n&&ARMY.sel.length<CFG.army.maxSelect;i++)if(ownKP(i)&&S.role[i]===ro&&S.lvl[i]===l&&S.ast[i]!==AS.DUEL&&onScreen(unitScreen(i)))ARMY.sel.push(i)}
  else ARMY.sel=[u];
}
function selectRect(b){
  const x0=Math.min(b[0],b[2]),x1=Math.max(b[0],b[2]),y0=Math.min(b[1],b[3]),y1=Math.max(b[1],b[3]),cx=(x0+x1)/2,cy=(y0+y1)/2,hit=[];
  for(let i=0;i<S.n;i++){if(!ownKP(i)||S.ast[i]===AS.DUEL)continue;const [sx,sy]=unitScreen(i),my=sy-9*cam.z;
    if(sx>=x0&&sx<=x1&&my>=y0&&my<=y1)hit.push([Math.hypot(sx-cx,my-cy),i])}
  ARMY.sel=hit.sort((a,b)=>a[0]-b[0]).slice(0,CFG.army.maxSelect).map(h=>h[1]);
}
/* rechtsklik: op een vijandelijke krachtpatser = uitdagen, anders = daarheen lopen */
function armyOrder(mx,my,pad=0){
  if(!ARMY.sel.length)return;const u=pickUnit(mx,my,pad),ids=ARMY.sel.slice();
  if(u>=0&&S.role[u]===2&&S.pl[u]!==ARMY.p){ARMY.cmd.push({t:'duel',ids,j:u});ARMY.ping={x:S.x[u],y:S.y[u],t:tNow,c:'#ffd27a'};return}
  const t=screenToTile(mx,my);if(t.x<1||t.y<1||t.x>world.W-2||t.y>world.H-2)return;
  ARMY.cmd.push({t:'move',ids,x:t.x,y:t.y});ARMY.ping={x:t.x,y:t.y,t:tNow,c:'#ffffff'};
}
/* groepen: Ctrl (of Alt/Cmd) + 1..9 slaat op, 1..9 selecteert, twee keer kort na elkaar centreert de camera */
addEventListener('keydown',ev=>{
  if(!S.army||ev.target.tagName==='INPUT'||ev.target.tagName==='SELECT')return;
  if(ev.key==='Escape'){ARMY.sel=[];return}
  const m=/^Digit([1-9])$/.exec(ev.code);if(!m)return;const g=+m[1];
  if(ev.ctrlKey||ev.altKey||ev.metaKey){ev.preventDefault();ARMY.groups[g]=ARMY.sel.slice();ARMY.last=`Groep ${g} opgeslagen (${ARMY.sel.length}).`;return}
  ARMY.sel=(ARMY.groups[g]||[]).slice();
  if(ARMY.tap.k===g&&performance.now()-ARMY.tap.t<CFG.army.groupTap&&ARMY.sel.length){
    let x=0,y=0;for(const i of ARMY.sel){x+=S.x[i];y+=S.y[i]}centerOn(x/ARMY.sel.length,y/ARMY.sel.length);clampCam()}
  ARMY.tap={k:g,t:performance.now()};
});
/* tooltip bij een eenheid */
function unitLabel(i){
  const ro=S.role[i],r=ROLES[ro].name+(ro>=2?' '+LVLNAME[S.lvl[i]]:'')+` · speler ${S.pl[i]+1}`;
  if(ro===5)return r+` · ${INSTR[S.lvl[i]]}, steunt eigen krachtpatsers binnen ${CFG.duel.music.range[S.lvl[i]]} tegels (+${Math.round(CFG.duel.music.bonus*100)}%)`;
  if(ro!==2)return r;
  return r+` · kracht ${strength(i).toFixed(2).replace('.',',')} · vermoeidheid ${Math.round(S.fat[i]*100)}%`+(S.fed[i]?' · gevoed':' · honger')+(musicFor(i)>=0?' · muziek':'')+
    (S.ko[i]?S.ast[i]===AS.OUT?` · uitgeschakeld, nog ${Math.ceil(S.out[i]/CFG.ticksPerSec)} s`:' · uitgeschakeld, op weg naar de heler':S.du[i]?' · op weg naar een duel':'');
}

/* ---------- Tekenen (in wereldcoördinaten, vanuit loop.js) ---------- */
const FITCOL=['#8e1f1f','#e8913a','#e8d14a','#5cb85c'];   // donkerrood, oranje, geel, groen
const fitColor=i=>S.ko[i]?FITCOL[0]:FITCOL[Math.min(3,((1-S.fat[i])*4)|0)];
const unitXY=(i,al)=>{const X=S.px[i]+(S.x[i]-S.px[i])*al,Y=S.py[i]+(S.y[i]-S.py[i])*al;return [X*TW-Y*TW/2+world.H*TW/2,Y*TH-hAt(X,Y)]};
/* onder de geselecteerden: een ovaal op de grond in de spelerkleur */
function drawArmyGround(al){
  if(!ARMY.sel.length)return;
  /* bereik van geselecteerde muzikanten: cirkel in tegels, op het scherm een ruit-ovaal */
  ctx.setLineDash([1.5,1.5]);ctx.lineWidth=0.6;ctx.strokeStyle='rgba(255,236,170,.75)';
  for(const i of ARMY.sel){if(S.role[i]!==5)continue;const R=CFG.duel.music.range[S.lvl[i]],X=S.px[i]+(S.x[i]-S.px[i])*al,Y=S.py[i]+(S.y[i]-S.py[i])*al;
    ctx.beginPath();for(let k=0;k<=48;k++){const a=k/48*6.2832,x=X+Math.cos(a)*R,y=Y+Math.sin(a)*R;
      const sx=x*TW-y*TW/2+world.H*TW/2,sy=y*TH-hAt(Math.min(world.W-2,Math.max(0,x)),Math.min(world.H-2,Math.max(0,y)));k?ctx.lineTo(sx,sy):ctx.moveTo(sx,sy)}ctx.stroke()}
  ctx.setLineDash([]);ctx.lineWidth=0.7;ctx.strokeStyle=PCOL[ARMY.p];ctx.fillStyle='rgba(255,255,255,.18)';
  for(const i of ARMY.sel){if(S.ast[i]===AS.DUEL)continue;const [x,y]=unitXY(i,al);ctx.beginPath();ctx.ellipse(x,y,4.6,2.1,0,0,6.2832);ctx.fill();ctx.stroke()}
}
/* duels in tegelrij y: de duel-sprite op de tafelplek (zonder atlas: de twee losse figuren) */
function drawDuelsRow(y,zd){
  let n=0;
  for(const d of DUELS){if(!d||!d.live||(d.y|0)!==y)continue;n++;
    const px=d.x*TW-d.y*TW/2+world.H*TW/2,py=d.y*TH-hAt(d.x,d.y),stand=1+Math.round((d.s+1)*4);
    if(!drawDuel3D('armdrukken',S.lvl[d.a],S.lvl[d.b],stand,S.pl[d.a],S.pl[d.b],px,py,zd)){
      const o=CFG.duel.seat*TW;drawUnit3D(ROLE3D[2][S.lvl[d.a]-1],'idle',0,0,S.pl[d.a],px-o,py,zd);drawUnit3D(ROLE3D[2][S.lvl[d.b]-1],'idle',4,0,S.pl[d.b],px+o,py,zd)}}
  return n;
}
/* boven alles: markering boven geselecteerden, krachtbalkjes boven de tafels, klikpunt */
function drawArmyTop(al){
  for(const i of ARMY.sel){if(S.ast[i]===AS.DUEL)continue;const [x,y]=unitXY(i,al);drawMarker(x,y-22,fitColor(i),S.lvl[i])}
  for(const d of DUELS){if(!d||!d.live)continue;
    const px=d.x*TW-d.y*TW/2+world.H*TW/2,py=d.y*TH-hAt(d.x,d.y)-25,w=16,h=2.2,f=(1-d.s)/2,x0=px-w/2;
    ctx.fillStyle='rgba(30,20,10,.55)';rrect(x0-0.7,py-0.7,w+1.4,h+1.4,1.4);ctx.fill();
    ctx.fillStyle=PCOL[S.pl[d.a]];ctx.fillRect(x0,py,w*f,h);ctx.fillStyle=PCOL[S.pl[d.b]];ctx.fillRect(x0+w*f,py,w*(1-f),h);
    ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x0,py,w,h*0.4);
    ctx.fillStyle='#f6ecd2';ctx.fillRect(px-0.2,py-0.8,0.4,h+1.6)}  // middenstreep
  const pg=ARMY.ping;if(pg){const a=(tNow-pg.t)/600;if(a>=1)ARMY.ping=null;else{
    const x=pg.x*TW-pg.y*TW/2+world.H*TW/2,y=pg.y*TH-hAt(pg.x,pg.y);ctx.globalAlpha=1-a;ctx.strokeStyle=pg.c;ctx.lineWidth=0.8;
    ctx.beginPath();ctx.ellipse(x,y,2+a*5,1+a*2.4,0,0,6.2832);ctx.stroke();ctx.globalAlpha=1}}
  const b=SEL.box;if(b&&Math.hypot(b[2]-b[0],b[3]-b[1])>=5){const w=(sx,sy)=>[(sx-vw/2)/cam.z+cam.x,(sy-vh/2)/cam.z+cam.y],[ax,ay]=w(b[0],b[1]),[bx,by]=w(b[2],b[3]);
    ctx.fillStyle='rgba(255,255,255,.12)';ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1/cam.z;ctx.fillRect(ax,ay,bx-ax,by-ay);ctx.strokeRect(ax,ay,bx-ax,by-ay)}
}
function rrect(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
/* markering: koperen stipjes voor het niveau boven een capsule in de gezondheidskleur (groen-geel-oranje-donkerrood) */
function drawMarker(x,y,col,lvl){
  rrect(x-4,y-1.2,8,2.4,1.2);ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='rgba(35,22,12,.85)';ctx.lineWidth=0.5;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.4)';ctx.fillRect(x-3,y-0.9,6,0.6);
  for(let k=0;k<lvl;k++){const dx=(k-(lvl-1)/2)*2.3;ctx.beginPath();ctx.arc(x+dx,y-3,0.85,0,6.2832);ctx.fillStyle='#e3be62';ctx.fill();ctx.strokeStyle='rgba(60,36,14,.9)';ctx.lineWidth=0.4;ctx.stroke()}
}
