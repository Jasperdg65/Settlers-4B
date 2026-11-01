/* Nederlands: alles wat maak.js zelf aan tekst maakt (koppen, tabelkoppen, zinnen over gebouwen, schemalabels).
   Een nieuwe taal = een map naast deze (en/, fr/, …) met bron.html en een eigen teksten.js met dezelfde velden.
   Namen van gebouwen, goederen en beroepen komen niet hier vandaan maar uit public/lang/<taal>.js (via het spel). */
module.exports=H=>{
  const {CFG,naam,goed,lijst,getal}=H,kl=k=>goed(k).toLowerCase();
  const sec=t=>{const s=t/CFG.ticksPerSec;if(s<90)return `${getal(Math.round(s*10)/10)} seconden`;const m=s/60;return `${getal(Math.round(m*10)/10)} ${m===1?'minuut':'minuten'}`};
  const meer=(n,een,veel)=>`${getal(n)} ${n===1?een:veel}`;
  const GEWAS=['','graan','peulvruchten','groente'];
  return {
    locale:'nl-NL',en:'en',of:'of',sec,meer,
    kosten:t=>{const c=CFG.build.cost[t];return `${meer(c[0],'plank','planken')} en ${meer(c[1],'steen','stenen')}`},
    pagina:{titel:'Kolonie – handleiding',beschrijving:'Handleiding van Kolonie: een vreedzaam bouwspel over samenwerking, zorg en harmonie.',
      sub:'handleiding',zoek:'Zoeken in de handleiding…  ( / )',zoekLabel:'Zoeken in de handleiding',pdf:'PDF',spel:'Naar het spel',
      inhoud:'Inhoud',inhoudLabel:'Inhoudsopgave',ondertitel:'Handleiding voor vreedzame bouwers',bijgewerkt:d=>`Bijgewerkt op ${d}`,
      burcht:'De burcht',niets:'Niets gevonden. Probeer een ander woord.',groot:'Groot bekijken',taal:'Taal',voet:'Kolonie · handleiding'},
    hoofdstuk:n=>`Hoofdstuk ${n}`,bijlage:l=>`Bijlage ${l}`,komt:'Komt eraan',schotVolgt:k=>`Schermafbeelding volgt: ${k}`,
    kop:{gebouw:'Gebouw',planken:'Planken',stenen:'Stenen',wie:'Wie werkt er',wat:'Wat het doet',goed:'Goed',weinig:'Weinig',normaal:'Normaal',veel:'Veel',
      beroep:'Beroep',gereedschap:'Gereedschap',werktIn:'Werkt in',gemaakt:'Gemaakt door',nodig:'Nodig voor'},
    geen:'geen',bewoners:'bewoners',graverIn:'bouwplaatsen (egaliseren)',bouwerIn:'bouwplaatsen (bouwen)',nietBouwbaar:'kan niet gebouwd worden',
    startvoorraad:'startvoorraad',bouwen:'bouwen',gereedschapVan:j=>`gereedschap van de ${j.toLowerCase()}`,lievelingskost:'lievelingskost',
    krachtpatsers:'krachtpatsers [[komt:Uitrusting (helm, schild, polsband) voor krachtpatsers]]',
    keten:{bos:'Bos',boom:'boom',plant:'plant boompjes',steenblokken:'Steenblokken',steenblok:'steenblok',struik:'Bomen en struiken',vruchten:'vruchten',
      akker:'Akkers',oogst:'oogst',erts:'erts',ertsader:'Ertsader',voorraad:'Voorraad',aria:l=>`Productieketen: ${l}`},
    /* wat een gebouw doet, uit de config */
    functie(t){
      const pc=CFG.prod[t],r=CFG.territory[t];
      if(t==='burcht')return `Hoofdkwartier en grote opslag (${CFG.slots.burcht} stapelplekken). Geeft gebied in een straal van ${r} tegels.`;
      if(t==='pakhuis')return `Extra opslag met ${CFG.slots.pakhuis} stapelplekken, handig ver van de burcht.`;
      if(t==='woonhuis')return `Krijgt tot ${CFG.pop.house} nieuwe bewoners, elk voor één maaltijd: ${lijst(CFG.pop.food.map(kl),'of')}.`;
      if(t==='wachttoren')return `Geeft gebied in een straal van ${r} tegels, zolang er iemand in woont.`;
      if(t==='kazerne')return 'Traint kolonisten tot krachtpatsers. [[komt:Krachthal die krachtpatsers traint (mijlpaal 6c)]]';
      if(!pc)return '';
      if(pc.gather==='tree')return `Hakt bomen binnen ${pc.area} tegels en maakt er ${kl(pc.out)} van. Laat appelbomen staan voor de plukker.`;
      if(pc.gather==='stone')return `Hakt steen uit steenblokken binnen ${pc.area} tegels. Een blok is na ${CFG.nature.stoneUnits} stuks op.`;
      if(pc.gather==='plant')return `Plant boompjes binnen ${pc.area} tegels; na ${sec(CFG.nature.grow)} zijn het volwassen bomen.`;
      if(pc.gather==='farm')return `Zaait en oogst ${GEWAS[pc.crop]} op akkers binnen ${pc.area} tegels (rijp na ${sec(CFG.nature.crop[pc.crop])}).`;
      if(pc.gather==='pick')return `Plukt ${kl(pc.out)} en ${kl(pc.out2)} van bomen en struiken binnen ${pc.area} tegels.`;
      if(pc.mine)return `Haalt ${lijst(Object.keys(pc.out).map(kl))} uit de berg (binnen ${pc.area} tegels). De mijnwerker eet elke maaltijd, maar met zijn lievelingskost, ${kl(CFG.mineFood[t])}, werkt hij ${CFG.prod.mineFav} keer zo lang door.`;
      if(pc.recipes)return `Maakt ${lijst(Object.keys(pc.recipes).map(kl))}, telkens in ${sec(pc.ticks)}.`;
      const io=x=>lijst(Object.entries(x).map(([k,n])=>`${n>1?n+' × ':''}${kl(k)}`));
      return Object.keys(pc.in).length?`Maakt van ${io(pc.in)} ${io(pc.out)}, in ${sec(pc.ticks)}.`:`Maakt ${io(pc.out)}, elke ${sec(pc.ticks)}.`;
    },
  };
};
