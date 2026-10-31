"use strict";
/* ---------- Balans: alle getallen van de economie op één plek ----------
   Goedsleutels: zie GOODS in goods.js. Gebouwsleutels: zie BTYPES in buildings.js. */
const CFG={
  ticksPerSec:20,                // simulatie, los van het tekenen
  stackMax:8,                    // goederen per stapel
  /* stapelplekken per gebouw; burcht en pakhuis zijn opslag, de rest heeft een paar plekken bij de deur */
  slots:{burcht:40,pakhuis:32,anders:4},
  slotRadius:{burcht:9,pakhuis:7,anders:3},
  /* startvoorraad in de burcht, keuze 'Startvoorraad' vermenigvuldigt */
  startFactor:{weinig:0.5,normaal:1,veel:2},
  startStock:{
    boomstam:16,plank:40,steen:32,
    brood:12,vis:8,vlees:8,water:8,
    bijl:2,zaag:2,houweel:3,hamer:6,schop:4,zeis:2,hengel:2,
  },
  eco:{colonistsPerPlayer:40},   // kolonisten per speler bij de start in economiemodus
  /* routes (A*): kosten per stap = afstand × terrein × object × (voetpad) + hoogteverschil × up/down */
  path:{
    terrain:[0,0,1.25,1,1.05,1,1.9,2.6,0], // per terreinsoort T (diep, ondiep, strand, gras, weelderig, droog, rots, gebergte, sneeuw); 0 = niet beloopbaar
    tree:1.5,stone:2.2,bush:1.15,  // vermenigvuldiger op een tegel met boom, steenblok of struik
    footpath:0.9,                  // bestaande voetpaden lopen iets makkelijker (geen wegenbouw nodig)
    up:0.12,down:0.04,             // extra kosten per hoogte-eenheid omhoog / omlaag
    budget:6000,                   // A*-knopen per tick, verdeeld over de zoekopdrachten in de wachtrij
    maxNodes:60000,                // per zoekopdracht; daarna geldt de route als onbereikbaar
    cacheMax:3000,                 // routes in de LRU-cache
  },
  /* dragers: vrije kolonisten zonder beroep */
  carry:{
    plannerEvery:10,               // ticks tussen twee rondes van de planner
    maxAssignPerRun:16,            // opdrachten per ronde
    pickTicks:8,dropTicks:8,       // bukken bij oppakken en neerleggen
    idleRadius:4,idleWait:[20,90], // vrij rondlopen: straal rond de laatste plek en wachttijd in ticks
    retryTicks:200,                // pauze voor een gebouw als een route onbereikbaar bleek
  },
  /* TIJDELIJK tot mijlpaal 3–5: vraag per gebouwtype, zodat er al vervoerd wordt zonder productie.
     Elk gebouw verbruikt elke useEvery ticks één stuk van de goederen in 'use'. */
  temp:{
    want:{
      pakhuis:{plank:8,steen:8,brood:4},zagerij:{boomstam:6},houthakker:{bijl:1},steenhouwer:{houweel:1},
      bosbouwer:{schop:1},bakkerij:{water:4},boerderij:{zeis:1},woonhuis:{brood:2},wachttoren:{brood:1},
      kolenmijn:{brood:2,houweel:1},ijzermijn:{vlees:2},goudmijn:{vis:2},
    },
    use:['boomstam','water','brood','vis','vlees'],useEvery:600,
  },
};
