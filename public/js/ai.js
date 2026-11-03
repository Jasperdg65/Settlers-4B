"use strict";
/* ---------- Brein van een computerbuur (mijlpaal 9a) ----------
   Puur rekenwerk zonder wereld, DOM of teksten: aiThink(s) krijgt een samenvatting van alleen het eigen dorp van één buur
   (neighbours.js: aiSummary) en geeft wat hij wil bouwen, met een reden als sleutel (de tekst maakt de hoofdthread: ai.reden.*).
   Draait in een Web Worker (ai-worker.js); zonder Worker (en in tests) roept neighbours.js het rechtstreeks aan.
   Waar het gebouw komt, zoekt de hoofdthread (aiSpot), net zoals een speler op de kaart kijkt; het blijft een gewone opdracht
   place, gecontroleerd zoals die van de speler. Volgorde van de regels = wat hij het eerst wil. */
function aiThink(s){
  const C=s.cfg,n=k=>(s.cnt[k]||[0,0])[0]+(s.cnt[k]||[0,0])[1],st=k=>s.stock[k]||0;
  /* gereedschap: staat een eigen gebouw zonder vakman omdat het gereedschap op is, dan maakt de smidse dat eerst; daarna weer
     automatisch. Dit kan ook terwijl er gebouwd wordt. */
  const r=think(),tl=s.needTool[0]||r.tl||null;   // ook voor een gebouw dat hij wil bouwen maar waar geen gereedschap voor is
  const maak=!s.smidse?null:tl?(s.smidse===tl?null:tl):(s.smidse!=='auto'?'auto':null);
  if(maak)r.maak=maak;return r;
  function think(){
  if(s.sites>=C.maxSites)return {wacht:'bouwt'};
  const want=[];
  const add=(type,doel,reden,extra)=>want.push({type,doel,reden,...extra});
  /* hout en steen: zonder planken en steen gebeurt er niets */
  if(n('houthakker')<2&&s.trees>=C.minTrees)add('houthakker','bos','hout');
  if(n('zagerij')<1)add('zagerij','dorp','planken');
  if(n('steenhouwer')<1&&s.stones>=C.minStones&&!s.skip.includes('steenhouwer'))add('steenhouwer','steen','steen');
  /* geen steenhouwer en daar geen plek voor: eerst een toren richting steen (steen telt mee bij het zoeken, aiSpot) */
  else if(n('steenhouwer')<1&&s.crew>0&&(s.cnt.wachttoren||[0,0])[1]<1&&n('wachttoren')<C.maxTowers)add('wachttoren','grens','steen',{stone:1,ores:[]});
  if(n('bosbouwer')<Math.ceil(n('houthakker')/2))add('bosbouwer','bos','bos');
  if(st('plank')<C.lowPlank&&n('houthakker')<C.maxWood&&s.trees>=C.minTrees*2){add('houthakker','bos','weinigPlank');if(n('zagerij')<n('houthakker')/2)add('zagerij','dorp','weinigPlank')}
  if(st('steen')<C.richStone&&n('steenhouwer')<2&&s.stones>=C.minStones*3)add('steenhouwer','steen','weinigSteen');
  /* bewoners: genoeg vrije dragers */
  if(s.free<C.minFree&&n('woonhuis')<C.maxHouses)add('woonhuis','dorp','dragers');
  /* voedsel voor de woonhuizen */
  for(const k of ['waterput','boerderij','molen','bakkerij'])if(n(k)<1)add(k,k==='boerderij'?'akker':'dorp','brood');
  /* erts op eigen grond: mijnen, en eten voor de mijnwerkers */
  if(s.ore[1]&&n('kolenmijn')<1)add('kolenmijn','erts','kolen',{ore:1});
  if(s.ore[2]&&n('ijzermijn')<1&&n('kolenmijn'))add('ijzermijn','erts','ijzer',{ore:2});
  if(s.ore[3]&&n('goudmijn')<1&&n('ijzermijn'))add('goudmijn','erts','goud',{ore:3});
  const mines=n('kolenmijn')+n('ijzermijn')+n('goudmijn');
  /* mijnwerkers eten brood, stoofpot of notenmix: met een mijn komt er een tweede keuken bij (bonen, groente, gaarkeuken),
     en een tweede bakkerij als er weinig maaltijden liggen */
  const meals=st('brood')+st('stoofpot')+st('notenmix');
  if(mines>=1){for(const k of ['bonenakker','moestuin'])if(n(k)<1)add(k,'akker','mijnwerkers');if(n('gaarkeuken')<1&&n('bonenakker')&&n('moestuin'))add('gaarkeuken','dorp','mijnwerkers');
    if(meals<C.lowFood){if(n('boerderij')<2)add('boerderij','akker','mijnwerkers');if(n('bakkerij')<2&&n('boerderij')>=2)add('bakkerij','dorp','mijnwerkers')}}
  /* gebied: een toren aan de grens als er iets ontbreekt (erts, bos, steen) of het land vol raakt */
  const lacks=[1,2,3].filter(k=>!s.ore[k]),full=s.buildings>=s.land/C.landPer;
  if((lacks.length||s.trees<C.minTrees*2||s.stones<C.minStones*3||full)&&s.crew>0&&(s.cnt.wachttoren||[0,0])[1]<1&&n('wachttoren')<C.maxTowers)
    add('wachttoren','grens',lacks.length?'erts':full?'ruimte':'grond',{ores:lacks});
  /* harmonie */
  if(s.harm<C.lowHarm&&n('voederplaats')<1)add('voederplaats','dorp','harmonie');
  if(s.harm<C.lowHarm&&n('bloemenweide')<C.maxFlowers)add('bloemenweide','dorp','harmonie');
  if(s.buildings>C.perStore*(n('pakhuis')+1))add('pakhuis','dorp','opslag');
  /* groeien als er genoeg bouwmateriaal ligt: meer bewoners, en meer land */
  if(st('plank')>=C.richPlank&&st('steen')>=C.richStone){
    if(n('woonhuis')<C.maxHouses)add('woonhuis','dorp','groei');
    if(s.crew>0&&(s.cnt.wachttoren||[0,0])[1]<1&&n('wachttoren')<C.maxTowers)add('wachttoren','grens','ruimte',{ores:lacks})}
  /* het eerste dat te betalen is (bouwmateriaal blijft over voor wat al in aanbouw is); waar hij net geen plek voor vond, slaat
     hij een tijd over (s.skip) */
  /* zonder gereedschap voor de vakman (en zonder werkloze vakman) heeft een nieuw gebouw geen zin */
  const noTool=w=>{const tl=s.tool[w.type];return tl&&!st(tl)&&!s.idle[w.type]};
  /* onmisbaar (hout en steen) gaat voor: zolang zo'n gebouw ontbreekt, blijft er bouwmateriaal voor apart liggen */
  const vital=want.filter(w=>(w.reden==='hout'||w.reden==='planken'||w.reden==='steen'||w.reden==='gereedschap')&&!noTool(w)&&!s.skip.includes(w.type)),res=[0,0];
  for(const w of vital){const c=s.cost[w.type];if(c){res[0]+=c[0];res[1]+=c[1]}}
  /* tl: gereedschap voor het belangrijkste gebouw dat hij wil maar nu niet kan bemannen (de smidse maakt het, zie boven) */
  const blocked=want.find(noTool),tl=blocked?s.tool[blocked.type]:null,out=r=>(tl&&(r.tl=tl),r);
  /* gereedschap op en geen smidse: eerst een smidse (vooraan, met bouwmateriaal apart) */
  if((blocked||s.needTool.length)&&!n('smidse')){const w={type:'smidse',doel:'dorp',reden:'gereedschap'};want.unshift(w);vital.unshift(w);const c=s.cost.smidse;if(c){res[0]+=c[0];res[1]+=c[1]}}
  for(const w of want){if(s.skip.includes(w.type)||noTool(w))continue;const c=s.cost[w.type];if(!c)continue;
    const v=vital.includes(w),rp=v?0:res[0],rs=v?0:res[1];
    if(st('plank')>=c[0]+rp+C.keepPlank*s.sites&&st('steen')>=c[1]+rs+C.keepStone*s.sites)return out({bouw:w});
    if(w.reden==='hout'||w.reden==='planken')return out({wacht:'materiaal',type:w.type});}   // eerst hout: niet iets anders van de planken bouwen
  const left=want.filter(w=>!s.skip.includes(w.type));
  if(blocked&&left[0]===blocked)return out({wacht:'gereedschap',type:blocked.type});
  return out(left.length?{wacht:'materiaal',type:left[0].type}:{wacht:'tevreden'});
  }
}
if(typeof module!=='undefined')module.exports={aiThink};
