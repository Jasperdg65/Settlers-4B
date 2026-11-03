"use strict";
/* ---------- Computerburen bouwen hun dorp (mijlpaal 9a, CFG.ai) ----------
   De mens speelt world.human (speler 1, rood); elke andere kleur is een computerbuur. Elke CFG.ai.every ticks maakt aiSummary
   per buur een samenvatting van alleen zijn eigen dorp (voorraad, gebouwen, eigen grond, wie er vrij is) en het brein (ai.js)
   zegt wat hij wil bouwen en waarom. Het brein draait in een Web Worker; het antwoord komt een paar ms later binnen en wordt
   op de eerstvolgende tick een gewone opdracht place (orders.js), gecontroleerd zoals die van de speler, zonder gratis goederen.
   Zonder Worker, of met AI.sync (tests), rekent het meteen. De plek zoekt aiSpot hier: dat is kijken naar de eigen kaart,
   zoals een speler doet. AI.last[p] = laatste gedachte, voor het paneel Productie. */
const AI={on:true,sync:false,worker:null,gen:0,last:[],skip:[]};   // skip[p][type] = tick tot wanneer hij dat gebouw overslaat (geen plek)
try{if(typeof Worker==='function'){AI.worker=new Worker('js/ai-worker.js?v=8');
  AI.worker.onmessage=ev=>{const {id,p,r}=ev.data;if(id===AI.gen&&S.eco&&world.made)aiAct(p,r)}}}catch(e){AI.worker=null}
const isAI=p=>p!==world.human;
/* samenvatting voor het brein: alleen wat deze buur van zichzelf weet */
function aiSummary(p){
  const {own,obj}=world,me=p+1;let land=0,trees=0,stones=0;
  for(let i=0;i<own.length;i++)if(own[i]===me){land++;if(obj[i]===1)trees++;else if(obj[i]===2)stones++}
  const cnt={};let sites=0,buildings=0;
  for(const b of world.blds){if(b.p!==p||b.dead)continue;(cnt[b.type]=cnt[b.type]||[0,0])[b.st?1:0]++;if(b.st)sites++;else if(b.type!=='burcht')buildings++}
  const tot=stockTotals(p),stock={};GOODS.forEach((g,i)=>{if(tot[i])stock[g.k]=tot[i]});
  let crew=0;for(const b of world.blds)if(b.p===p&&!b.dead&&isHall(b)&&b.crew)crew+=b.crew.filter(c=>S.lvl[c]&&S.ins[c]&&b.trn!==c).length;
  const sk=AI.skip[p]||{};
  /* gereedschap per gebouwsoort, werkloze vakmensen per soort, gereedschap dat een wachtend gebouw mist, en wat de smidse maakt */
  const tool={},idle={},needTool=[];
  for(const type in BJOB){const tl=CFG.jobs[BJOB[type]].tool;if(tl)tool[type]=tl}
  for(let i=0;i<S.n;i++)if(S.pl[i]===p&&S.job[i]&&S.st[i]===ST.IDLE)for(const type in BJOB)if(BJOB[type]===S.job[i])idle[type]=(idle[type]||0)+1;
  for(const b of world.blds)if(b.p===p&&!b.dead&&!b.st&&!b.occ&&!b.wkr&&tool[b.type]&&!idle[b.type]&&!tot[GI[tool[b.type]]]&&!needTool.includes(tool[b.type]))needTool.push(tool[b.type]);
  const sm=world.blds.find(b=>b.p===p&&!b.dead&&!b.st&&b.type==='smidse');
  return {p,tool,idle,needTool,smidse:sm?sm.make||'auto':null,skip:Object.keys(sk).filter(k=>sk[k]>tickNo),cfg:CFG.ai,cost:CFG.build.cost,land,trees,stones,cnt,sites,buildings,stock,free:freeCarriers(p),crew,ore:oreCounts(p),harm:world.harm?world.harm[p]:0.5};
}
function aiTick(){
  const A=CFG.ai;if(!A.on||!AI.on||!world.made||tickNo<A.first||tickNo%A.every)return;
  for(let p=0;p<world.starts.length;p++){if(!isAI(p))continue;const s=aiSummary(p);
    if(AI.worker&&!AI.sync)AI.worker.postMessage({id:AI.gen,s});else aiAct(p,aiThink(s))}
}
/* antwoord van het brein: een plek zoeken en de opdracht geven */
function aiAct(p,r){
  AI.last[p]={...r,t:tickNo};
  if(r.maak)world.blds.forEach((b,bi)=>{if(b.p===p&&!b.dead&&b.type==='smidse')order({p,t:'make',b:bi,make:r.maak})});
  if(!r.bouw)return;
  const w=r.bouw,sp=aiSpot(p,w.type,w);
  if(!sp){AI.last[p]={wacht:'geenPlek',type:w.type,t:tickNo};(AI.skip[p]=AI.skip[p]||{})[w.type]=tickNo+CFG.ai.skipTicks;return}
  order({p,t:'place',type:w.type,x:sp[0],y:sp[1]});
}
/* beste plek voor gebouw type op eigen grond, of null. Per doel een score (bos: bomen in het werkgebied, steen: steenblokken,
   akker: vrij gras, erts: erts van die soort onder of naast de mijn, grens: niemands land binnen de torenstraal, dorp: dicht bij
   de burcht); de beste kandidaten worden met canPlace gecontroleerd, hoogstens CFG.ai.cand keer. */
function aiSpot(p,type,w){
  const {W,H,own,obj,ter,ore,oreRes}=world,me=p+1,CS=4,CW=Math.ceil(W/CS),CH=Math.ceil(H/CS),A=CFG.ai;
  const home=world.blds.find(b=>b.type==='burcht'&&b.p===p);if(!home)return null;
  /* tellingen per vak van 4 × 4 tegels */
  const cell=new Float32Array(CW*CH),doel=w.doel,lack=new Set(w.ores||[]);
  for(let i=0;i<own.length;i++){const x=i%W,y=i/W|0,o=obj[i];let v=0;
    if(doel==='bos')v=own[i]===me&&o===1?1:0;
    else if(doel==='steen')v=own[i]===me&&o===2?1:0;
    else if(doel==='akker')v=own[i]===me&&!o&&ter[i]>=T.GRASS&&ter[i]<=T.DRY?1:0;
    else if(doel==='grens')v=!own[i]&&ter[i]>=T.SAND&&ter[i]<=T.MOUNTAIN?1+(ore[i]&&oreRes[i]&&lack.has(ore[i])?A.oreBonus:0)+(w.stone&&o===2?A.oreBonus:0):0;
    if(v)cell[(y/CS|0)*CW+(x/CS|0)]+=v}
  const R=doel==='grens'?CFG.territory.wachttoren:(CFG.prod[type]||{}).area||6;
  const around=(x,y)=>{let s=0;const r=Math.ceil(R/CS);const cx=x/CS|0,cy=y/CS|0;
    for(let j=Math.max(0,cy-r);j<=Math.min(CH-1,cy+r);j++)for(let k=Math.max(0,cx-r);k<=Math.min(CW-1,cx+r);k++)
      if(Math.hypot((k+0.5)*CS-x,(j+0.5)*CS-y)<=R)s+=cell[j*CW+k];return s};
  const cand=[];
  for(let y=4;y<H-4;y+=2)for(let x=4;x<W-4;x+=2){const i=y*W+x;if(own[i]!==me)continue;
    const d=Math.hypot(x-home.x,y-home.y);let sc;
    if(doel==='erts'){let n=0;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const j=(y+dy)*W+x+dx;if(ore[j]===w.ore&&oreRes[j])n++}if(!n)continue;sc=n*4-d*0.1}
    else if(doel==='dorp')sc=-d;
    else{const a=around(x,y+1);if(a<(doel==='grens'?A.minNew:1))continue;sc=a-d*(doel==='grens'?0:0.3)}
    cand.push([sc,x,y])}
  cand.sort((a,b)=>b[0]-a[0]||a[2]-b[2]||a[1]-b[1]);
  /* buitenwerkers: precies natellen wat er in het werkgebied rond de deur ligt (de vakken zijn maar een schatting) */
  const need=A.minAround[doel]||0,exact=(x,y)=>{let n=0;const r=Math.ceil(R);
    for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(dx*dx+dy*dy>R*R)continue;const X=x+dx,Y=y+1+dy;if(X<1||Y<1||X>=W-1||Y>=H-1)continue;const j=Y*W+X,o=obj[j];
      if(own[j]===me&&(doel==='bos'?o===1:doel==='steen'?o===2:!o&&ter[j]>=T.GRASS&&ter[j]<=T.DRY))n++}return n};
  for(let k=0;k<cand.length&&k<A.cand;k++){const [,x,y]=cand[k];for(const [dx,dy] of [[0,0],[1,0],[0,1],[1,1]])if(!canPlace(type,x+dx,y+dy,p)&&(!need||exact(x+dx,y+dy)>=need))return [x+dx,y+dy]}
  return null;
}
/* gedachte van buur p als tekst (paneel Productie) */
function aiText(p){
  const r=AI.last[p];if(!r)return t('ai.nog');
  const g=k=>k&&BTYPES[k]?BTYPES[k].name.toLowerCase():'';
  const mk=r.maak&&r.maak!=='auto'?' · '+t('ai.maak',{goed:GOODS[GI[r.maak]].n.toLowerCase()}):'';
  if(r.bouw)return t('ai.bouw',{gebouw:g(r.bouw.type),reden:t('ai.reden.'+r.bouw.reden)})+mk;
  return t('ai.wacht.'+r.wacht,{gebouw:g(r.type),goed:r.tl?GOODS[GI[r.tl]].n.toLowerCase():''})+mk;
}
if($('aiOn').addEventListener)$('aiOn').addEventListener('change',ev=>{AI.on=ev.target.checked});
