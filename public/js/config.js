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
};
