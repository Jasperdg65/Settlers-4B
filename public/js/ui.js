"use strict";
/* ---------- Bediening ---------- */
const fmt={players:v=>v,water:v=>Math.round(v*100)+'%',mount:v=>Math.round(v*100)+'%',trees:v=>Math.round(v*100)+'%',count:v=>(+v).toLocaleString('nl-NL')};
for(const k in fmt){const el=$(k),out=$(k+'V');const u=()=>out.textContent=fmt[k](el.value);el.addEventListener('input',u);u()}
$('dice').onclick=()=>{const w=['eik','duin','veen','berk','klei','heide','fjord','kreek','polder','mergel'];$('seed').value=w[Math.random()*w.length|0]+'-'+(Math.random()*9000+1000|0)};
$('ores').onchange=ev=>showOres=ev.target.checked;
function regenerate(){
  const o={seed:$('seed').value||'kolonie',size:+$('size').value,shape:$('shape').value,players:+$('players').value,
    water:+$('water').value,mount:+$('mount').value,trees:+$('trees').value};
  world=generate(o);chunks.clear();buildMini();
  $('genms').textContent=world.genMs.toFixed(0)+' ms';
  if(world.starts.length<o.players)$('hover').textContent=`Slechts ${world.starts.length} geschikte startplekken gevonden. Verlaag het waterniveau of het gebergte.`;
  const s=world.starts[0]||{cx:world.W/2,cy:world.H/2};centerOn(s.cx+0.5,s.cy-1);cam.z=2;
  spawnAnimals();spawn(+$('count').value);
  drawMini();
}
$('gen').onclick=regenerate;
$('start').onclick=()=>{if(!world)return;spawn(+$('count').value);running=true;acc=0;$('pause').textContent='Pauze'};
$('pause').onclick=()=>{running=!running;$('pause').textContent=running?'Pauze':'Verder'};
$('count').addEventListener('change',()=>spawn(+$('count').value));

makeTrees();makeNature();makeAnimals();makeUnits(PCOL);
regenerate();running=true;
loadManifest().then(()=>{loadTextures();loadNature();loadCustom().then(()=>{buildGallery();refreshCustomUI()})});
requestAnimationFrame(frame);
