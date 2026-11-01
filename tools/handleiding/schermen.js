/* Schermafbeeldingen voor de handleiding uit het echte spel, in vaste scènes (vaste seed, vaste ticks, vaste camera),
   zodat ze na elke wijziging opnieuw te maken zijn (de adviseur staat uit, behalve in zijn eigen scène):  node tools/handleiding/schermen.js [--taal=nl] [scène ...]
   Het spel draait in de gekozen taal (?lang=), dus tooltips en panelen staan in die taal.
   Schrijft public/handleiding/img/<taal>/<scène>.jpg en de goederen-icoontjes public/handleiding/img/goed/<goed>.png. */
const fs=require('fs'),path=require('path');
const {startChrome,sleep}=require('./chrome.js');
const {PUB}=require('./spel.js');
const URL_=process.env.KOLONIE_URL||'https://doc.dgol.eu/settlers4b/';
const ARG=process.argv.slice(2),TAAL=(ARG.find(a=>a.startsWith('--taal='))||'--taal=nl').slice(7);
const OUT=path.join(PUB,'handleiding/img'),SHOT=path.join(OUT,TAAL);
const SEED='vathorst';

/* hulpjes die in de pagina draaien */
const PAGINA=String.raw`
window.HB={
  /* nieuwe wereld met vaste instellingen, economie, n ticks vooruit (synchroon, dus deterministisch) en dan op pauze */
  start(ticks){$('seed').value='${SEED}';$('size').value='256';$('shape').value='continent';$('players').value='4';
    $('water').value='0.3';$('mount').value='0.5';$('trees').value='0.6';$('mode').value='eco';$('stock').value='normaal';
    regenerate();startColonists();running=false;for(let k=0;k<ticks;k++)tick();return S.n},
  /* camera op tegel (x,y) van speler-relatieve plek */
  cam(x,y,z){cam.z=z;cam.x=SX(x,y);cam.y=y*TH-world.hp[(y|0)*world.W+(x|0)];return 1},
  /* schermpositie (CSS-pixels in het venster) van het midden van tegel (x,y) */
  scr(x,y){const r=cv.getBoundingClientRect(),hx=x+0.5,hy=y+0.5;return [r.left+vw/2+(SX(hx,hy)-cam.x)*cam.z, r.top+vh/2+(hy*TH-hAt(hx,hy)-cam.y)*cam.z]},
  canvas(){const r=cv.getBoundingClientRect();return [r.left,r.top,r.width,r.height]},
  /* beste plek voor een gebouw van speler 0: veel van 'want' (1 boom, 2 steen) binnen r tegels, dicht bij de burcht */
  plek(type,want,r){const s=world.starts[0];let best=null,bs=-1e9;
    for(let y=s.cy-18;y<=s.cy+18;y++)for(let x=s.cx-18;x<=s.cx+18;x++){if(canPlace(type,x,y,0))continue;let n=0;
      if(want)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const i=(y+dy)*world.W+x+dx;if(dx*dx+dy*dy<=r*r&&(world.obj[i]===Math.abs(want)||want<0&&world.obj[i]===4))n++}
      const sc=(want<0?-n*40:n*3)-Math.hypot(x-s.cx,y-s.cy);if(sc>bs){bs=sc;best=[x,y]}}
    return best},
  geladen(){return Object.values(CUSTOM).filter(c=>c.spr).length>=Object.keys(DEFAULT_IMGS).length&&Object.keys(DEFAULT_IMGS).length>0},
  goederen(){return GOODS.map((g,i)=>[g.k,goodSprite(i,4).c.toDataURL('image/png')])},
  /* de adviseur staat uit in alle scènes behalve zijn eigen (niet bewaard: alleen ADV.opt in het geheugen) */
  stil(){ADV.opt.mode='uit';advHide();return 1},
};HB.stil();1`;

async function main(){
  const kies=ARG.filter(a=>!a.startsWith('--'));fs.mkdirSync(path.join(OUT,'goed'),{recursive:true});fs.mkdirSync(SHOT,{recursive:true});
  const B=await startChrome({port:9391,w:1400,h:900,scale:2});const {cmd,ev}=B;
  try{
    await cmd('Page.navigate',{url:URL_+'?lang='+TAAL+'&handleiding='+Date.now()});await sleep(4000);
    await ev(PAGINA);
    for(let k=0;k<60&&!(await ev('HB.geladen()'));k++)await sleep(500);
    const muis=async(x,y)=>{await cmd('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await sleep(400)};
    const weg=async()=>{await muis(5,890);await ev('hoverTile=null;showTip("");1')};
    const foto=async(naam,clip)=>{if(kies.length&&!kies.includes(naam))return;await sleep(900);
      const r=await cmd('Page.captureScreenshot',{format:'jpeg',quality:76,clip:{x:clip[0],y:clip[1],width:clip[2],height:clip[3],scale:1}});
      fs.writeFileSync(path.join(SHOT,naam+'.jpg'),Buffer.from(r.result.data,'base64'));console.log('  ',naam)};
    /* kaartuitsnede: het middelste deel van het speelveld */
    const kaart=async(w=980,h=600)=>{const [l,t,W,H]=await ev('HB.canvas()');return [Math.round(l+(W-w)/2),Math.round(t+(H-h)/2),w,h]};
    const zij=async(sel,h=880)=>ev(`(()=>{let e=document.querySelector('${sel}');e=e.closest('section')||e;if(e.tagName==='ASIDE')e.scrollTop=0;else e.scrollIntoView({block:'start'});
      const r=e.getBoundingClientRect();return [r.left,Math.max(0,r.top),r.width,Math.min(r.height,${h})]})()`);

    /* goederen-icoontjes (uit dezelfde tekenfunctie als in het spel) */
    if(!kies.length||kies.includes('goederen')){for(const [k,d] of await ev('HB.goederen()'))fs.writeFileSync(path.join(OUT,'goed',k+'.png'),Buffer.from(d.split(',')[1],'base64'));console.log('   goederen')}

    /* 1. het startdorp na een paar minuten */
    await ev('HB.start(20*60*3)');const s=await ev('[world.starts[0].cx,world.starts[0].cy]');
    await ev(`HB.cam(${s[0]+1},${s[1]+2},1.25)`);await weg();await foto('dorp',await kaart());

    /* 2. bouwen: houthakker aan de bosrand, groene voetafdruk met werkgebied en tooltip */
    const hh=await ev("HB.plek('houthakker',1,10)");
    await ev(`HB.cam(${hh[0]},${hh[1]},1.6);setBuildMode('place','houthakker');1`);
    let p=await ev(`HB.scr(${hh[0]},${hh[1]-1})`);await muis(p[0],p[1]);await foto('bouwen-ja',await kaart(900,560));
    /* buiten het eigen gebied: rood met reden */
    const bui=await ev(`(()=>{const s=world.starts[0];for(let r=21;r<40;r++)for(let a=0;a<64;a++){const x=Math.round(s.cx+Math.cos(a/64*6.283)*r),y=Math.round(s.cy+Math.sin(a/64*6.283)*r);
      if(x<3||y<3||x>=world.W-3||y>=world.H-3)continue;const i=y*world.W+x;if(!world.own[i]&&world.ter[i]===T.GRASS&&!world.obj[i]&&world.own[i-6]===1)return [x,y]}return null})()`);
    if(bui){await ev(`HB.cam(${bui[0]-3},${bui[1]},1.6);1`);p=await ev(`HB.scr(${bui[0]},${bui[1]-1})`);await muis(p[0],p[1]);await foto('bouwen-nee',await kaart(900,560))}
    await ev("setBuildMode(null);1");

    /* 3. bouwplaats: houthakker en zagerij plaatsen, even laten werken */
    const zg=await ev("HB.plek('zagerij',-1,4)");   // open plek, geen bomen ervoor
    await ev(`order({p:0,t:'place',type:'houthakker',x:${hh[0]},y:${hh[1]}});runOrders();order({p:0,t:'place',type:'zagerij',x:${zg[0]},y:${zg[1]}});runOrders();
      for(let k=0;k<20*40;k++)tick();1`);
    await ev(`HB.cam(${zg[0]},${zg[1]},2.2);1`);await weg();await foto('bouwplaats',await kaart(820,520));

    /* 4. de houtketen aan het werk: muis op de houthakker (werkgebied en status) */
    await ev(`for(let k=0;k<20*90;k++)tick();HB.cam(${hh[0]},${hh[1]+1},1.5);1`);
    p=await ev(`HB.scr(${hh[0]},${hh[1]-1})`);await muis(p[0],p[1]);await foto('houthakker',await kaart(900,560));

    /* 5. de grens van het gebied, van verder weg */
    await ev(`HB.cam(${s[0]+6},${s[1]+4},0.62);1`);await weg();await foto('grens',await kaart(1000,620));

    /* 6. panelen in de zijbalk */
    await foto('paneel-wereld',await zij('aside',640));
    await foto('paneel-bouwen',await zij('#buildList',620));
    await ev("refreshProduction&&refreshProduction();1");await sleep(1200);await foto('paneel-productie',await zij('#prodList',520));

    /* 7. ertsen in de bergen (vinkje 'Toon ertsen'), bij een mijn van speler 1 */
    const mi=await ev("(()=>{const b=world.blds.find(b=>b.p===0&&b.type==='ijzermijn')||world.blds.find(b=>b.p===0&&/mijn$/.test(b.type));return [b.x,b.y]})()");
    await ev(`showOres=true;$('ores').checked=true;HB.cam(${mi[0]},${mi[1]},1.6);1`);await weg();await foto('ertsen',await kaart(900,560));
    await ev("showOres=false;$('ores').checked=false;1");

    /* 7b. de adviseur: verder spelen tot hij een waarschuwing geeft; uitsnede rechtsonder in het speelveld */
    if(!kies.length||kies.includes('adviseur')){
      const k=await ev(`(()=>{ADV.opt.mode='alles';const s=world.starts[0];HB.cam(s.cx+3,s.cy+2,1.3);
        for(let n=0;n<900;n++){for(let k=0;k<20;k++)tick();advisorTick();if(ADV.cur&&CFG.advisor.rules[ADV.cur.k].soort==='waarschuwing')return ADV.cur.k}return null})()`);
      if(k){await weg();const [l,t,W,H]=await ev('HB.canvas()');await foto('adviseur',[Math.round(l+W-820),Math.round(t+H-470),820,470])}
      else console.log('   adviseur: geen waarschuwing gevonden');
      await ev('HB.stil()');
    }

    /* 8. de hele wereld van bovenaf (grondvlakken worden een paar per beeld gemaakt: even wachten) */
    if(!kies.length||kies.includes('wereld')){await ev(`HB.cam(world.W/2,world.H/2,0.21);1`);await weg();await sleep(9000);await foto('wereld',await kaart(1000,620))}

    /* 9. armpje drukken in de Duel-test: twee mediors van speler 1 en 2, een paar seconden bezig */
    const du=await ev(`(()=>{$('mode').value='duel';startColonists();running=false;
      const a=[],b=[];for(let i=0;i<S.n;i++)if(S.role[i]===2&&S.lvl[i]===2)(S.pl[i]===0?a:b).push(i);
      order({p:0,t:'duel',ids:[a[0]],j:b[0]});
      for(let k=0;k<20*20&&!DUELS.some(d=>d&&d.live);k++)tick();for(let k=0;k<20*4;k++)tick();
      ARMY.sel=[];for(let i=0;i<S.n;i++)if(S.pl[i]===0&&!S.du[i]&&S.role[i]>=2)ARMY.sel.push(i);
      const d=DUELS.find(Boolean);return d?[d.x,d.y]:null})()`);
    if(du){await ev(`HB.cam(${du[0]-1},${du[1]},3.4);1`);await weg();await foto('duel',await kaart(900,560))}

    if(B.fouten.length)console.log('JS-fouten in het spel:',B.fouten.slice(0,5));
  }finally{B.close()}
}
main().catch(e=>{console.error(e);process.exit(1)});
