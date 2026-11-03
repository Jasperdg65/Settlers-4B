"use strict";
/* ---------- Opdrachten: de enige weg waarlangs een speler de simulatie verandert ----------
   Mens en computerbuur (later in een Web Worker) gebruiken dezelfde opdrachten: order({p, t, ...}) zet er een in de
   wachtrij en runOrders() voert ze op een tickgrens uit, in volgorde van binnenkomst (aan het begin van de volgende tick,
   of meteen als het spel pauzeert). Zo hangt alles alleen af van de seed en de opdrachten (deterministisch, en later
   bruikbaar voor een savegame of herhaling). Elke opdracht wordt gecontroleerd alsof hij van een onbekende komt:
   speler p moet eigenaar zijn en de regels gelden voor iedereen gelijk, zonder gratis goederen.
   Soorten nu: place {type, x, y}, demolish {b}, make {b, make} (wat een smidse maakt), keep {b, n} (reserve van een krachthal), area {b, x, y} (midden van het werkgebied, x null = terug bij de deur), move {ids, x, y}, duel {ids, j},
   propose {q, ask, give, goods} (grond ruilen, deals.js), accept {id} en reject {id} (antwoord op een tegenbod), grens {id} (grensduel na een afwijzing), answer {id, a: ja | meer | nee} (antwoord op een verzoek van een buur), band {b, n} (muzikanten van een krachthal), post {ids, b} (krachtpatsers naar een andere toren of krachthal), train {id} (gaat voor bij het trainen; crew.js). Later: handel, geschenk (docs/ontwerp/buren-en-diplomatie.md). */
const ORDERS=[];
function order(c){ORDERS.push(c)}
function runOrders(){for(let k=0;k<ORDERS.length;k++)runOrder(ORDERS[k]);ORDERS.length=0}
function runOrder(c){
  if(c.t==='place'){if(world.own&&!canPlace(c.type,c.x,c.y,c.p))placeSite(c.type,c.x,c.y,c.p)}
  else if(c.t==='demolish'){const b=world.blds[c.b];if(b&&b.p===c.p)demolish(c.b)}
  else if(c.t==='make'){const b=world.blds[c.b],pc=b&&CFG.prod[b.type];if(b&&b.p===c.p&&pc&&pc.recipes&&(c.make==='auto'||c.make in pc.recipes))b.make=c.make}
  else if(c.t==='area')setArea(c);
  else if(c.t==='keep'){const b=world.blds[c.b];if(b&&b.p===c.p&&b.type==='kazerne'&&CFG.army.hall.keeps.includes(c.n))cr(b).keep=c.n}
  else if(c.t==='band'){const b=world.blds[c.b];if(b&&b.p===c.p&&b.type==='kazerne'&&CFG.army.hall.bands.includes(c.n))cr(b).bandK=c.n}
  else if(c.t==='post'&&S.mv&&Array.isArray(c.ids))runPost(c);
  else if(c.t==='train'&&S.eco)runTrain(c);
  else if((c.t==='move'||c.t==='duel')&&S.army)runCmd(c);
  else if(c.t==='propose'&&world.offers)dealPropose(c);
  else if((c.t==='accept'||c.t==='reject')&&world.offers)dealAnswer(c,c.t==='accept');
  else if(c.t==='grens'&&world.offers&&S.ast)grensChallenge(c);
  else if(c.t==='answer'&&world.reqs)reqAnswer(c);
}
