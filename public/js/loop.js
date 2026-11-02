"use strict";
/* ---------- Hoofdlus ---------- */
let last=performance.now(),fpsAvg=0,drawAvg=0,showOres=false,hoverTile=null,tNow=0;
/* Meten: ?prof=1 toont ms per onderdeel (CPU-tijd van de tekenopdrachten; GPU-werk zie je in fps en frametijd).
   Toetsen 1, 2, 3 zetten de zoom. Om GPU-werk per onderdeel te vinden: G grond, N natuur, K kolonisten uit/aan,
   Q grondchunks met 'low' i.p.v. 'high' schalen; vergelijk de fps. */
const PROF=/[?&]prof=1/.test(location.search),PT={},PN={f:0,dt:0,dtMax:0,built:0};let profEl=null;
const PX={g:0,n:0,k:0,q:0};let gpuName='?';
if(PROF)try{const gl=document.createElement('canvas').getContext('webgl'),x=gl&&gl.getExtension('WEBGL_debug_renderer_info');gpuName=x?gl.getParameter(x.UNMASKED_RENDERER_WEBGL):gl?'(verborgen)':'geen WebGL'}catch(e){}
const pnow=()=>PROF?performance.now():0,pt=(k,t)=>{PT[k]=(PT[k]||0)+performance.now()-t};
function profReport(){
  if(!profEl){profEl=document.createElement('pre');profEl.style.cssText='position:fixed;right:8px;top:8px;z-index:99;margin:0;padding:8px 10px;background:rgba(0,0,0,.75);color:#fff;font:12px/1.4 monospace;pointer-events:none';document.body.appendChild(profEl)}
  const f=PN.f,m=k=>((PT[k]||0)/f).toFixed(2).padStart(7);
  const rows=[['grond (chunks tekenen)','grond'],['chunks bouwen','chunkbouw'],['water + erts','water'],['emmers vullen','emmers'],['objecten (natuur)','objecten'],['gebouwen','gebouwen'],['dieren','dieren'],['kolonisten','kolonisten'],['kolonisten (stippen)','stippen'],['draw totaal','draw'],['simulatie','sim']];
  PT.objecten=(PT.tegels||0)-(PT.gebouwen||0);
  profEl.textContent=`zoom ${cam.z.toFixed(2)} · dpr ${dpr} · ${S.n} kolonisten · ${cv.width}×${cv.height}\n`+
    `fps ${(1000*f/PN.dt).toFixed(1)} · frame gem ${(PN.dt/f).toFixed(1)} ms, max ${PN.dtMax.toFixed(1)} ms\n`+
    `GPU: ${gpuName}\n`+
    `uit: ${[PX.g&&'grond',PX.n&&'natuur',PX.k&&'kolonisten',PX.q&&'chunks low'].filter(Boolean).join(', ')||'–'}  (G N K Q)\n`+
    `chunks: ${chunks.size} in cache, ${PN.built} gebouwd\n`+rows.map(([n,k])=>n.padEnd(24)+m(k)+' ms').join('\n');
  for(const k in PT)PT[k]=0;PN.f=PN.dt=PN.dtMax=PN.built=0;
}
if(PROF)addEventListener('keydown',ev=>{const z={'1':1,'2':2,'3':3}[ev.key];if(ev.target.tagName==='INPUT')return;if(z){cam.z=z;clampCam()}
  const t={g:'g',n:'n',k:'k',q:'q'}[ev.key.toLowerCase()];if(t)PX[t]^=1});
function viewRect(){const hw=vw/2/cam.z,hh=vh/2/cam.z;return {l:cam.x-hw,r:cam.x+hw,t:cam.y-hh,b:cam.y+hh}}
function frame(now){
  requestAnimationFrame(frame);
  const dt=Math.min(250,now-last);last=now;frameNo++;tNow=now;
  if(!world)return;
  if(running){
    acc+=dt*(+$('speed').value);
    let steps=0;const t0=performance.now();
    while(acc>=TICK&&steps<8){tick();acc-=TICK;steps++}
    if(PROF)pt('sim',t0);
    if(steps){simAvg=simAvg*0.9+((performance.now()-t0)/steps)*0.1}
    if(acc>TICK*8)acc=0;
  }else if(ORDERS.length)runOrders();   // gepauzeerd: opdrachten meteen uitvoeren (dezelfde tickgrens)
  keyPan(dt);
  const t1=performance.now();draw();
  drawAvg=drawAvg*0.9+(performance.now()-t1)*0.1;
  if(PROF){pt('draw',t1);PN.f++;PN.dt+=dt;PN.dtMax=Math.max(PN.dtMax,dt);if(PN.f>=60)profReport()}
  fpsAvg=fpsAvg*0.95+(1000/Math.max(1,dt))*0.05;
  if(frameNo%15===0){
    $('fps').textContent=fpsAvg.toFixed(0);
    $('simms').textContent=running?simAvg.toFixed(2)+' ms':'–';
    $('drawms').textContent=drawAvg.toFixed(1)+' ms';{const bl=world.blds.filter(b=>!b.dead);$('nocc').textContent=bl.filter(b=>b.occ).length+' van '+bl.length}
    if(S.eco){const c=carrierStats();$('nset').textContent=S.n.toLocaleString(LOC());$('ncarry').textContent=`${c[0]} van ${c[1]}`;
      $('njobs').textContent=jobCounts().map((n,j)=>j&&n[0]?`${CFG.jobs[j].n.toLowerCase()} ${n[0]}`+(n[1]?` (${n[1]} binnen)`:''):'').filter(Boolean).join(', ')||'–';$('ndone').textContent=TR.done+' · '+TR.used;
      $('npath').textContent=`${pathQueued()} · ${PF.cache.size}, ${Math.round(100*PF.hits/Math.max(1,PF.hits+PF.miss))}% hit`}
    if(S.army){$('nsel').textContent=ARMY.sel.length;$('nduel').textContent=DUELS.filter(Boolean).length;
      $('nwon').textContent=ARMY.won.slice(0,2).join(' – ');$('duelMsg').textContent=ARMY.last}
    drawMini();refreshStock();if(S.eco)refreshProduction();refreshHover();
  }
}
let rowU=new Int32Array(1),rowA=new Int32Array(1);
function drawPennant(x,y,pole,col,seed){
  if(pole){ctx.strokeStyle='#5a3b22';ctx.lineWidth=0.9;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-pole);ctx.stroke();
    ctx.fillStyle='#d9b45a';ctx.beginPath();ctx.arc(x,y-pole-0.5,0.8,0,6.283);ctx.fill();y-=pole-0.6}
  const L=10,H=4.2,t=tNow*0.007+seed*20,top=[],bot=[];
  for(let k=0;k<=8;k++){const u=k/8,wv=Math.sin(t-u*3.2)*u*1.3;top.push(x+u*L,y+wv+u*H*0.35);bot.push(x+u*L,y+H-u*H*0.55+wv)}
  ctx.beginPath();ctx.moveTo(top[0],top[1]);for(let k=2;k<top.length;k+=2)ctx.lineTo(top[k],top[k+1]);
  for(let k=bot.length-2;k>=0;k-=2)ctx.lineTo(bot[k],bot[k+1]);ctx.closePath();
  ctx.fillStyle=col;ctx.fill();ctx.strokeStyle='rgba(40,20,10,.45)';ctx.lineWidth=0.35;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.18)';ctx.beginPath();ctx.moveTo(top[0],top[1]);for(let k=2;k<top.length;k+=2)ctx.lineTo(top[k],top[k+1]+0.9);ctx.lineTo(x,y+1.2);ctx.closePath();ctx.fill()}
/* stookt gebouw b nu? Alleen tijdens een batch (b.run); zonder economie roken alle schoorstenen. */
function smoking(b){return !S.eco||!!(b.occ&&b.run)}
function draw(){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle='#24476f';ctx.fillRect(0,0,cv.width,cv.height);
  const z=cam.z*dpr;
  ctx.setTransform(z,0,0,z,cv.width/2-cam.x*z,cv.height/2-cam.y*z);
  ctx.imageSmoothingEnabled=TEX.ready||cam.z<1;const zd=cam.z*dpr,cres=!TEX.ready||zd<1.6?1:1.5;
  const v=viewRect(),{W,H,hp,ter,obj,tree,bldAnchor,blds,stk}=world;
  const ncx=Math.ceil((W-1)/CH),ncy=Math.ceil((H-1)/CH);
  let built=0,tp=pnow(),tb=0,vis=0;ctx.imageSmoothingQuality=PROF&&PX.q?'low':'high';
  for(let cy=0;cy<ncy;cy++)for(let cx=0;cx<ncx;cx++){
    const b=chunkBounds(cx,cy);
    if(b.right<v.l||b.left>v.r||b.bottom<v.t||b.top>v.b)continue;
    const key=cy*1000+cx+cres*1e6;let ch=chunks.get(key);
    /* verouderd (grond veranderd): opnieuw zodra er bouwruimte is, tot dan de oude tonen */
    if(!ch||ch.stale&&built<2){if(!ch&&built>=2&&chunks.size>0)continue;const tc=pnow(),old=ch;ch=renderChunk(cx,cy,cres);if(old){chunks.delete(key);old.c.width=0}
      if(PROF){tb+=performance.now()-tc;PN.built++}built++}
    else chunks.delete(key);
    chunks.set(key,ch);ch.used=frameNo;vis+=ch.c.width*ch.c.height;if(!(PROF&&PX.g))ctx.drawImage(ch.c,ch.left,ch.top,ch.c.width/ch.cres,ch.c.height/ch.cres);
  }
  /* LRU: de Map staat op volgorde van laatst gebruikt; ruim de oudste op tot de cache binnen het budget valt */
  let cpx=0;for(const c of chunks.values())cpx+=c.c.width*c.c.height;
  const cap=Math.max(CHUNK_PX,vis*1.5);
  for(const [k,c] of chunks){if(cpx<=cap||c.used===frameNo)break;chunks.delete(k);cpx-=c.c.width*c.c.height;c.c.width=0}
  ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
  if(PROF){pt('grond',tp);PT.grond-=tb;PT.chunkbouw=(PT.chunkbouw||0)+tb;tp=performance.now()}

  const yMin=Math.max(0,Math.floor(v.t/TH)-1),yMax=Math.min(H-1,Math.ceil((v.b+HP+90)/TH)+1);
  const xr=y=>[Math.max(0,Math.floor((v.l-H*TW/2+y*TW/2)/TW)-3),Math.min(W-1,Math.ceil((v.r-H*TW/2+y*TW/2)/TW)+3)];
  /* waterglinstering */
  ctx.strokeStyle='#fff';ctx.lineWidth=0.7;
  for(let y=yMin;y<=yMax;y++){const [xa,xb]=xr(y);for(let x=xa;x<=xb;x++){const i=y*W+x;if(ter[i]>T.SHALLOW)continue;const h=hash2(x,y);if(h%13)continue;
    const a=Math.pow(Math.max(0,Math.sin(tNow*0.0017+(h&1023))),6);if(a<0.05)continue;
    ctx.globalAlpha=a*0.75;const px=SX(x,y),py=y*TH;ctx.beginPath();ctx.moveTo(px-2,py);ctx.lineTo(px+2,py);ctx.stroke()}}
  ctx.globalAlpha=1;
  if(showOres)for(let y=yMin;y<=yMax;y++){const [xa,xb]=xr(y);for(let x=xa;x<=xb;x++){const i=y*W+x,o=world.ore[i];if(!o||(x+y)%2)continue;
    ctx.fillStyle=ORECOL[o];ctx.fillRect(SX(x,y)-1.6,y*TH-hp[i]-1.6,3.2,3.2)}}

  if(world.own)drawBorders(yMin,yMax,xr);
  if(world.sites)drawSitesGround(v);
  if(PROF){pt('water',tp);tp=performance.now()}
  /* eenheden en dieren per rij in emmers, voor juiste diepte */
  const detail=cam.z>=0.6,off=H*TW/2;
  if(rowU.length<H){rowU=new Int32Array(H);rowA=new Int32Array(H)}
  rowU.fill(-1,yMin,yMax+1);rowA.fill(-1,yMin,yMax+1);
  const al=running?Math.min(1,acc/TICK):1;
  if(S.n&&detail){const {x,y,px,py,next,ins}=S;
    for(let i=0;i<S.n;i++){if(ins[i])continue;const Y=py[i]+(y[i]-py[i])*al,r=Y|0;if(r<yMin||r>yMax)continue;
      const X=px[i]+(x[i]-px[i])*al,sx=X*TW-Y*TW/2+off;if(sx<v.l-8||sx>v.r+8)continue;next[i]=rowU[r];rowU[r]=i}}
  if(A.n){const {x,y,px,py,next}=A;
    for(let i=0;i<A.n;i++){const Y=py[i]+(y[i]-py[i])*al,r=Y|0;if(r<yMin||r>yMax)continue;
      const X=px[i]+(x[i]-px[i])*al,sx=X*TW-Y*TW/2+off;if(sx<v.l-12||sx>v.r+12)continue;next[i]=rowA[r];rowA[r]=i}}
  if(PROF)pt('emmers',tp);
  if(S.army)drawArmyGround(al);
  /* kleinste vooraf verkleinde versie die nog minstens zo breed is als op het scherm; 'high' alleen als er nog meer dan 2× verkleind (of vergroot) wordt */
  let q='high';
  const blit=(s,x,y)=>{
    if(s.m===undefined)spriteMips(s);
    const need=s.w*zd;let c=s.c;
    if(s.m&&s.m.length){const m=s.m;c=m[m.length-1];for(let k=0;k<m.length;k++)if(m[k].width>=need){c=m[k];break}}
    const r=c.width/need,qq=r<1||r>2?'high':'low';if(qq!==q){q=qq;ctx.imageSmoothingQuality=q}
    ctx.drawImage(c,x-s.ax,y-s.ay,s.w,s.h)};
  const animF=(tNow/120|0);
  for(let y=yMin;y<=yMax;y++){
    const [xa,xb]=xr(y);let tr=pnow();
    for(let x=xa;x<=xb;x++){
      const i=y*W+x,o=obj[i];
      if(bldAnchor[i]){const tg=pnow(),b=blds[bldAnchor[i]-1],s=bldSprite(b.type,b.p,PCOL),bx=SX(x,y),by=y*TH-hp[i];
        /* in aanbouw: schim van het gebouw, van onderen op zichtbaar naar voortgang */
        if(b.st){if(b.st===2){ctx.globalAlpha=0.22;blit(s,bx,by);ctx.globalAlpha=1;ctx.save();ctx.beginPath();ctx.rect(bx-s.ax-4,by-s.ay+s.h*(1-b.prog),s.w+8,s.h*b.prog+4);ctx.clip();blit(s,bx,by);ctx.restore();q=''}
          if(PROF)pt('gebouwen',tg);continue}
        blit(s,bx,by);
        const bt=BTYPES[b.type],sc=bt.sc,cust=s.custom;
        if(!cust&&bt.glow){const fl=0.55+0.25*Math.sin(tNow*0.013+b.seed*40)+0.15*Math.sin(tNow*0.031);
          const gx=bx+bt.glow[0]*sc,gy=by+bt.glow[1]*sc,gr=ctx.createRadialGradient(gx,gy,0,gx,gy,7*sc);
          gr.addColorStop(0,`rgba(255,190,80,${0.75*fl})`);gr.addColorStop(0.35,`rgba(255,120,40,${0.4*fl})`);gr.addColorStop(1,'rgba(255,100,30,0)');
          ctx.fillStyle=gr;ctx.beginPath();ctx.arc(gx,gy,7*sc,0,6.283);ctx.fill();
          ctx.fillStyle=`rgba(255,${200+fl*40|0},120,${0.9*fl})`;ctx.beginPath();ctx.ellipse(gx,gy+0.6*sc,1.4*sc,0.9*sc,0,0,6.283);ctx.fill()}
        const hubP=cust?(s.hub?[bx-s.ax+s.hub[0]*s.w,by-s.ay+s.hub[1]*s.h,s.sail]:null):(bt.hub?[bx+bt.hub[0]*sc,by+bt.hub[1]*sc,sc]:null);
        if(hubP&&SAILS){const M=CFG.mill,side=M.arm*hubP[2]*SAILS.view/SAILS.radius,need=side*cam.z*(devicePixelRatio||1);
          /* geschilderde wieken: draaistand uit het spriteblad (de standen beslaan een kwartslag), maat naar de zoom */
          const z=SAILS.sizes.find(s=>s.px>=need)||SAILS.sizes[SAILS.sizes.length-1],q=SAILS.turn*Math.PI/180;
          const f=Math.floor(((tNow*M.turn+b.seed*6)%q)/q*SAILS.frames)%SAILS.frames,p=z.px;
          ctx.drawImage(z.c,(f%SAILS.cols)*p,(f/SAILS.cols|0)*p,p,p,hubP[0]-side/2,hubP[1]-side/2,side,side)}
        else if(hubP){let sc=hubP[2];const hx=hubP[0],hy=hubP[1],ang=tNow*CFG.mill.turn+b.seed*6;
          ctx.save();ctx.translate(hx,hy);
          for(let k=0;k<4;k++){ctx.save();ctx.rotate(ang+k*Math.PI/2);
            ctx.strokeStyle='#5e4128';ctx.lineWidth=0.7*sc;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-CFG.mill.arm*sc);ctx.stroke();
            ctx.fillStyle='rgba(240,232,212,.95)';ctx.fillRect(0.4*sc,-14.5*sc,3*sc,11*sc);
            ctx.strokeStyle='#7d5a38';ctx.lineWidth=0.3*sc;ctx.strokeRect(0.4*sc,-14.5*sc,3*sc,11*sc);
            for(let q=1;q<4;q++){ctx.beginPath();ctx.moveTo(0.4*sc,(-14.5+q*2.75)*sc);ctx.lineTo(3.4*sc,(-14.5+q*2.75)*sc);ctx.stroke()}
            ctx.restore()}
          ctx.fillStyle='#4e3322';ctx.beginPath();ctx.arc(0,0,1*sc,0,6.283);ctx.fill();ctx.restore()}
        if(b.occ){let fx,fy,pole=0;
          if(s.flag){fx=bx-s.ax+s.flag[0]*s.w;fy=by-s.ay+s.flag[1]*s.h}
          else if(cust||b.type!=='burcht'&&b.type!=='kazerne'&&b.type!=='wachttoren'){fx=bx-s.ax+s.w*0.14;fy=by-s.ay+s.h*0.8;pole=15}
          if(fx!==undefined)drawPennant(fx,fy,pole,PCOL[b.p],b.seed)}
        const sm=cust?s.smoke:bt.smoke;if(sm&&detail&&smoking(b)){const C=CFG.smoke,sx=cust?bx-s.ax+sm[0]*s.w:bx+sm[0]*sc,sy=cust?by-s.ay+sm[1]*s.h:by+sm[1]*sc;
          const z=cust?s.w/C.refW:1;   // geschilderde gebouwen zijn groter: wolkjes schalen mee
          const R=SMOKE_SHEET;
          if(R){const n=R.cols*R.rows,live=Math.ceil(n*C.frameMs/C.every),t0=(tNow+b.seed*C.every*7)%C.every,dw=C.w*z*R.sw,dh=dw*R.fh/R.fw;
            ctx.globalAlpha=C.alpha;
            for(let k=0;k<live;k++){const f=Math.floor((t0+k*C.every)/C.frameMs);if(f>=n)continue;
              ctx.drawImage(R.c,(f%R.cols)*R.fw,Math.floor(f/R.cols)*R.fh,R.fw,R.fh,sx-R.fx*dw,sy-R.fy*dh,dw,dh)}}
          else for(let k=0;k<C.puffs;k++){const ph=((tNow/C.period)+k/C.puffs+b.seed)%1;ctx.globalAlpha=(1-ph)*C.circleAlpha*Math.min(1,ph*6);
            ctx.fillStyle='#ecebe6';ctx.beginPath();ctx.arc(sx+(ph*5+Math.sin(ph*6+b.seed*9)*1.2)*z,sy-ph*C.rise*z,(1.3+ph*3)*z,0,6.283);ctx.fill()}
          ctx.globalAlpha=1}
        if(PROF)pt('gebouwen',tg);
        continue}
      if(stk&&stk[i]&&detail){const s=stk[i]-1;if(G.cnt[s])blit(goodSprite(G.good[s],G.cnt[s]),SX(x+0.5,y+0.5),(y+0.5)*TH-hAt(x+0.5,y+0.5))}
      if(!o||PROF&&PX.n)continue;
      const h=hash2(x*7,y*13),px=SX(x,y)+((h&7)-3.5)*0.9,py=y*TH-hp[i]+((h>>>3&3)-1.5)*0.6;
      if(px<v.l-30||px>v.r+30)continue;
      if(o===1)blit(TREES[tree[i]*2+(h>>>6&1)],px,py);
      else if(o===2)blit(STONES[((h>>>7)%(ter[i]>=T.MOUNTAIN?8:6))],px,py);
      else if(o===3&&detail)blit(bushSprite(x,y),px,py);
      else if(o===4&&detail&&SAPL.length)blit(SAPL[(h>>>7)%4],px,py);
      else if(o===5&&detail&&STUMP.length)blit(STUMP[(h>>>7)%2],px,py);
      else if(o>=6&&detail&&world.crop)blit(CROPS[(world.crop[i]-1)*2+o-6],SX(x+0.5,y+0.5),(y+0.5)*TH-hAt(x+0.5,y+0.5));   // akker: groeiend of rijp
    }
    if(PROF){pt('tegels',tr);tr=performance.now()}
    for(let k=rowA[y];k>=0;k=A.next[k]){
      const Y=A.py[k]+(A.y[k]-A.py[k])*al,X=A.px[k]+(A.x[k]-A.px[k])*al,type=A.type[k];
      const moving=A.x[k]!==A.px[k]||A.y[k]!==A.py[k],ax=X*TW-Y*TW/2+off,ay=Y*TH-hAt(X,Y),c=CFG.animals[type];
      /* 3D-dier: lopen, liggen/zitten (A.lie) of staan; de eend deint altijd (loopbeelden langzaam) */
      if(A3D[c.k]){if(moving)A.d8[k]=dir8(A.x[k]-A.px[k],A.y[k]-A.py[k]);const sw=c.water;
        if(sw){ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=0.35;ctx.beginPath();ctx.ellipse(ax,ay+0.2,4.4,1.3,0,0,6.2832);ctx.stroke()}
        const an=moving||sw?'walk':A.lie[k]&&A3D[c.k].sizes[0].F.rest?'rest':'idle';
        drawUnit3D(c.k,an,A.d8[k],(tNow/120*c.rate|0)+k,0,ax,ay,zd,ctx,A3D);q='';continue}
      if(!ANIM[type])continue; // vos en vogel bestaan alleen in 3D
      const f=type===2?((tNow/700+k)|0)&1:moving?((animF>>(type===1?0:1))+k)&1:0;
      blit(ANIM[type][f*2+A.dir[k]],ax,ay);
    }
    if(PROF){pt('dieren',tr);tr=performance.now()}
    if(S.army&&DUELS.length&&drawDuelsRow(y,zd))q='';
    if(detail&&!(PROF&&PX.k))for(let k=rowU[y];k>=0;k=S.next[k]){
      if(S.army){if(S.ast[k]===AS.DUEL)continue;ctx.globalAlpha=S.ko[k]?0.6:1} // duelleerders zitten in de duel-sprite; uitgeschakeld = doorschijnend
      const Y=S.py[k]+(S.y[k]-S.py[k])*al,X=S.px[k]+(S.x[k]-S.px[k])*al;
      const moving=running&&(S.x[k]!==S.px[k]||S.y[k]!==S.py[k]||S.st&&(S.st[k]===ST.WORK||S.st[k]===ST.GATHER));
      const f=moving?(animF+k)&3:0;
      const ux=X*TW-Y*TW/2+off,uy=Y*TH-hAt(X,Y),fr=f*2+S.dir[k];
      if(S.carry){const c=S.carry[k],j=S.job[k],kp=j===JI.krachtpatser;
        /* krachtpatser: 3D-model van zijn niveau; een rekruut (niveau 0) loopt nog als drager */
        if(kp&&S.lvl[k]){if(moving)S.d8[k]=dir8(S.x[k]-S.px[k],S.y[k]-S.py[k]);if(drawUnit3D(ROLE3D[2][S.lvl[k]-1],moving?'walk':'idle',S.d8[k],animF+k,S.pl[k],ux,uy,zd)){q='';continue}}
        /* drager als 3D-poppetje: zonder of met kist; het goed ligt in de kist op punt 'hold' (recht van achteren niet zichtbaar) */
        if(!j||kp&&!S.lvl[k]){if(moving)S.d8[k]=dir8(S.x[k]-S.px[k],S.y[k]-S.py[k]);const d=S.d8[k];
          const r=drawUnit3D(c?CARRY3D.carry:CARRY3D.free,moving?'walk':'idle',d,animF+k,S.pl[k],ux,uy,zd);
          if(r){q='';if(c&&d!==6&&r.fr.pts){const h=r.fr.pts.hold;blit(carrySprite(c-1),ux+(h[0]-r.fr.ax)*r.k,uy+(h[1]-r.fr.ay)*r.k-1.2)}continue}}
        /* vakman: 3D-model van zijn beroep; aan het werk in zijn werkhouding (work3D), anders stil;
           wat hij naar huis brengt, draagt hij voor zijn borst */
        const wm=j&&!kp?work3D(k,j):null;
        if(wm&&drawUnit3D(wm,'idle',S.d8[k],0,S.pl[k],ux,uy,zd)){q='';continue}
        const jm=j&&!kp?job3D(j):null;
        if(jm){const walks=S.x[k]!==S.px[k]||S.y[k]!==S.py[k];if(walks)S.d8[k]=dir8(S.x[k]-S.px[k],S.y[k]-S.py[k]);
          const r=drawUnit3D(jm,running&&walks?'walk':'idle',S.d8[k],animF+k,S.pl[k],ux,uy,zd);
          if(r){q='';if(c&&S.d8[k]!==6)blit(carrySprite(c-1),ux+(S.dir[k]?-2.6:2.6),uy-UNIT3D_H*0.42);continue}}
        if(c){blit(UNITC[1][S.vr[k]][S.pl[k]][fr],ux,uy);blit(carrySprite(c-1),ux+(S.dir[k]?-3.5:3.5),uy-7.9)}
        else blit(j&&!(kp&&!S.lvl[k])?jobSprite(j,S.vr[k],S.pl[k],fr):UNITC[0][S.vr[k]][S.pl[k]][fr],ux,uy)}
      else{const m3=ROLE3D[S.role[k]];
        /* 3D-poppetje (rol met model en niveau): richting uit de beweging, anders de laatste; zonder atlas de tekening */
        if(m3){if(moving)S.d8[k]=dir8(S.x[k]-S.px[k],S.y[k]-S.py[k]);if(drawUnit3D(m3[S.lvl[k]-1],moving?'walk':'idle',S.d8[k],animF+k,S.pl[k],ux,uy,zd)){q='';continue}}
        blit(m3?UNITC[0][S.vr[k]][S.pl[k]][fr]:UNITS[S.role[k]][S.vr[k]][S.pl[k]][fr],ux,uy)} // krachtpatser: getekende figuur vervalt; tot de atlas er is een gewone kolonist
    }
    ctx.globalAlpha=1;if(PROF)pt('kolonisten',tr);
  }
  tp=pnow();
  if(S.n&&!detail){const {x,y,px,py,pl}=S;let lp=-1;
    for(let i=0;i<S.n;i++){const X=px[i]+(x[i]-px[i])*al,Y=py[i]+(y[i]-py[i])*al,sx=X*TW-Y*TW/2+off;if(sx<v.l||sx>v.r)continue;
      const sy=Y*TH-hAt(X,Y);if(sy<v.t||sy>v.b+10)continue;if(pl[i]!==lp){lp=pl[i];ctx.fillStyle=PCOL[lp]}ctx.fillRect(sx-1.5,sy-3,3,3)}}
  if(PROF)pt('stippen',tp);

  if(world.own){drawSiteBars(v,blit);drawBuildOverlay(v,blit);drawDealOverlay();drawWorkAreas()}
  if(S.army)drawArmyTop(al);
  if(hoverTile){
    const {x,y}=hoverTile;if(x<W-1&&y<H-1){const a=y*W+x;
      ctx.strokeStyle='rgba(255,255,255,.9)';ctx.lineWidth=1/cam.z;ctx.beginPath();
      ctx.moveTo(SX(x,y),y*TH-hp[a]);ctx.lineTo(SX(x+1,y),y*TH-hp[a+1]);
      ctx.lineTo(SX(x+1,y+1),(y+1)*TH-hp[a+W+1]);ctx.lineTo(SX(x,y+1),(y+1)*TH-hp[a+W]);ctx.closePath();ctx.stroke()}
  }
}
