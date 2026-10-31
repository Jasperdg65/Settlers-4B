"use strict";
/* ---------- Bediening ---------- */
const fmt={players:v=>v,water:v=>Math.round(v*100)+'%',mount:v=>Math.round(v*100)+'%',trees:v=>Math.round(v*100)+'%',count:v=>(+v).toLocaleString('nl-NL')};
for(const k in fmt){const el=$(k),out=$(k+'V');const u=()=>out.textContent=fmt[k](el.value);el.addEventListener('input',u);u()}
$('dice').onclick=()=>{const w=['eik','duin','veen','berk','klei','heide','fjord','kreek','polder','mergel'];$('seed').value=w[Math.random()*w.length|0]+'-'+(Math.random()*9000+1000|0)};
$('ores').onchange=ev=>showOres=ev.target.checked;
const mode=()=>$('mode').value;
const startColonists=()=>{if(mode()==='duel'){spawnDuelTest();world.stk=null;world.own=null;world.sites=null;G.n=0;$('nset').textContent=S.n;return}
  spawn(colonistTarget(),mode()==='eco');if(mode()==='eco'){initGoods();initBuild();buildStockPanel();buildBuildPanel()}else{world.stk=null;world.own=null;world.sites=null;G.n=0}};
const colonistTarget=()=>mode()==='eco'?world.starts.length*CFG.eco.colonistsPerPlayer:+$('count').value;
function regenerate(){
  document.body.dataset.mode=mode();
  $('hint').textContent=touchFirst?(mode()==='duel'?'Tik: selecteren, daarna tik: uitdagen of lopen · vasthouden en slepen: rechthoek · één vinger: schuiven · twee vingers: zoomen':'Eén vinger: schuiven · twee vingers: zoomen · tik: info'):
    mode()==='duel'?'Links slepen of klikken: selecteren · rechtsklik: uitdagen of lopen · rechts slepen om te schuiven · scrollen om te zoomen':'Slepen om te schuiven · scrollen of +/− om te zoomen · WASD/pijltjes';
  const o={seed:$('seed').value||'kolonie',size:+$('size').value,shape:$('shape').value,players:+$('players').value,
    water:+$('water').value,mount:+$('mount').value,trees:+$('trees').value};
  world=generate(o);chunks.clear();buildMini();
  $('genms').textContent=world.genMs.toFixed(0)+' ms';
  if(world.starts.length<o.players)$('hover').textContent=`Slechts ${world.starts.length} geschikte startplekken gevonden. Verlaag het waterniveau of het gebergte.`;
  const s=world.starts[0]||{cx:world.W/2,cy:world.H/2};centerOn(s.cx+0.5,s.cy-1);cam.z=2;
  spawnAnimals();startColonists();
  if(mode()==='duel'&&ARMY.at){centerOn(ARMY.at[0],ARMY.at[1]-1);cam.z=3;clampCam()}
  drawMini();
}
$('gen').onclick=regenerate;
$('start').onclick=()=>{if(!world)return;startColonists();running=true;acc=0;$('pause').textContent='Pauze'};
$('pause').onclick=()=>{running=!running;$('pause').textContent=running?'Pauze':'Verder'};
$('count').addEventListener('change',()=>{if(mode()==='stress')startColonists()});
$('mode').onchange=regenerate;
$('duelTest').onclick=()=>{$('mode').value='duel';regenerate();running=true;acc=0;$('pause').textContent='Pauze'};
$('armyPl').onchange=ev=>{ARMY.p=+ev.target.value;ARMY.sel=[]};
$('selNone').onclick=()=>{ARMY.sel=[]};
$('stock').onchange=()=>{if(world&&world.stk)startColonists()};

makeTrees();makeNature();makeCrops();makeAnimals();makeUnits(PCOL);
regenerate();running=true;
loadManifest().then(()=>{loadTextures();loadNature();loadUnits3D();loadCustom().then(()=>{buildGallery();refreshCustomUI()})});
requestAnimationFrame(frame);
