/* Schermafbeeldingen voor de handleiding uit het echte spel, in vaste scènes (vaste seed, vaste ticks, vaste camera),
   zodat ze na elke wijziging opnieuw te maken zijn:  node tools/handleiding/schermen.js [scène ...]
   Schrijft public/handleiding/img/<scène>.jpg en de goederen-icoontjes public/handleiding/img/goed/<goed>.png. */
const fs=require('fs'),path=require('path');
const {startChrome,sleep}=require('./chrome.js');
const {PUB}=require('./spel.js');
const URL_=process.env.KOLONIE_URL||'https://doc.dgol.eu/settlers4b/';
const OUT=path.join(PUB,'handleiding/img');
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
};1`;

async function main(){
  const kies=process.argv.slice(2);fs.mkdirSync(path.join(OUT,'goed'),{recursive:true});
  const B=await startChrome({port:9391,w:1400,h:900,scale:2});const {cmd,ev}=B;
  try{
    await cmd('Page.navigate',{url:URL_+'?handleiding='+Date.now()});await sleep(4000);
    await ev(PAGINA);
    for(let k=0;k<60&&!(await ev('HB.geladen()'));k++)await sleep(500);
    const muis=async(x,y)=>{await cmd('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await sleep(400)};
    const weg=async()=>{await muis(5,890);await ev('hoverTile=null;showTip("");1')};
    const foto=async(naam,clip)=>{if(kies.length&&!kies.includes(naam))return;await sleep(900);
      const r=await cmd('Page.captureScreenshot',{format:'jpeg',quality:82,clip:{x:clip[0],y:clip[1],width:clip[2],height:clip[3],scale:1}});
      fs.writeFileSync(path.join(OUT,naam+'.jpg'),Buffer.from(r.result.data,'base64'));console.log('  ',naam)};
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

    if(B.fouten.length)console.log('JS-fouten in het spel:',B.fouten.slice(0,5));
  }finally{B.close()}
}
main().catch(e=>{console.error(e);process.exit(1)});
