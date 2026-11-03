"use strict";
/* ---------- Balans: alle getallen van de economie op één plek ----------
   Goedsleutels: zie GOODS in goods.js. Gebouwsleutels: zie BTYPES in buildings.js. */
const CFG={
  ticksPerSec:20,                // simulatie, los van het tekenen
  stackMax:8,                    // goederen per stapel
  /* stapelplekken per gebouw; burcht en pakhuis zijn opslag, de rest heeft een paar plekken bij de deur */
  slots:{burcht:40,pakhuis:32,anders:6},
  slotRadius:{burcht:9,pakhuis:7,anders:5},
  /* startvoorraad in de burcht, keuze 'Startvoorraad' vermenigvuldigt */
  startFactor:{weinig:0.5,normaal:1,veel:2},
  startStock:{
    boomstam:16,plank:40,steen:32,
    brood:12,stoofpot:8,notenmix:8,water:8,
    bijl:2,zaag:2,houweel:4,hamer:6,schop:4,zeis:4,
  },
  eco:{colonistsPerPlayer:40},   // kolonisten per speler bij de start in economiemodus; meer komen er uit woonhuizen (CFG.pop)
  /* routes (A*): kosten per stap = afstand × terrein × object × (voetpad) + hoogteverschil × up/down */
  path:{
    terrain:[0,0,1.25,1,1.05,1,1.9,2.6,0], // per terreinsoort T (diep, ondiep, strand, gras, weelderig, droog, rots, gebergte, sneeuw); 0 = niet beloopbaar
    tree:1.5,stone:2.2,bush:1.15,  // vermenigvuldiger op een tegel met boom, steenblok of struik
    field:1.1,                     // akker (gezaaid of rijp)
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
    keepFree:8,                    // zoveel vrije dragers per speler blijven er altijd over (niet omscholen tot vakman)
  },
  /* beroepen: volgorde = nummer in S.job (0 drager, 1 graver, 2 bouwer staan vast). Een vrije drager wordt vakman door
     het gereedschap uit de voorraad te halen; beroepen zonder gereedschap beginnen meteen. bld = gebouwen waarin hij werkt. */
  jobs:[
    {k:'drager',n:t('job.drager')},
    {k:'graver',n:t('job.graver'),tool:'schop'},
    {k:'bouwer',n:t('job.bouwer'),tool:'hamer'},
    {k:'houthakker',n:t('job.houthakker'),tool:'bijl',bld:['houthakker']},
    {k:'bosbouwer',n:t('job.bosbouwer'),tool:'schop',bld:['bosbouwer']},
    {k:'zager',n:t('job.zager'),tool:'zaag',bld:['zagerij']},
    {k:'steenhouwer',n:t('job.steenhouwer'),tool:'houweel',bld:['steenhouwer']},
    {k:'mijnwerker',n:t('job.mijnwerker'),tool:'houweel',bld:['kolenmijn','ijzermijn','goudmijn']},
    {k:'boer',n:t('job.boer'),tool:'zeis',bld:['boerderij','bonenakker']},
    {k:'tuinier',n:t('job.tuinier'),bld:['moestuin']},
    {k:'plukker',n:t('job.plukker'),bld:['plukkershut']},
    {k:'waterhaler',n:t('job.waterhaler'),bld:['waterput']},
    {k:'kok',n:t('job.kok'),bld:['gaarkeuken']},
    {k:'droger',n:t('job.droger'),bld:['droogschuur']},
    {k:'molenaar',n:t('job.molenaar'),bld:['molen']},
    {k:'bakker',n:t('job.bakker'),bld:['bakkerij']},
    {k:'smelter',n:t('job.smelter'),bld:['ijzersmelterij','goudsmelterij']},
    {k:'smid',n:t('job.smid'),bld:['smidse','wapensmid']},
    {k:'dierenverzorger',n:t('job.dierenverzorger'),bld:['voederplaats']},
    {k:'krachtpatser',n:t('job.krachtpatser')},   // opgeleid in de krachthal, bemant torens (crew.js, CFG.army)
    {k:'muzikant',n:t('job.muzikant')},           // opgeleid in de krachthal, loopt mee naar een grensduel (mijlpaal 8c)
  ],
  /* lievelingskost van mijnwerkers (de wereld is veganistisch). Een mijnwerker eet elke maaltijd uit prod.mineMeals, maar zijn
     lievelingskost is goed voor prod.mineFav rondes werk, een andere maaltijd voor één ronde (production.js, tryRecipe) */
  mineFood:{kolenmijn:'brood',steenmijn:'brood',ijzermijn:'stoofpot',zwavelmijn:'stoofpot',goudmijn:'notenmix'},
  /* bouwen: kosten [planken, steen]; de burcht kan niet gebouwd worden */
  build:{
    cost:{
      houthakker:[2,2],bosbouwer:[2,2],steenhouwer:[2,2],                        // kleine hut
      zagerij:[3,3],molen:[3,3],bakkerij:[3,3],boerderij:[3,3],                 // werkplaats
      bonenakker:[2,1],moestuin:[2,1],plukkershut:[2,1],waterput:[1,2],gaarkeuken:[3,3],droogschuur:[3,1],   // voedsel (5b)
      kolenmijn:[3,1],ijzermijn:[3,1],goudmijn:[3,1],                           // mijn
      ijzersmelterij:[4,5],goudsmelterij:[4,5],smidse:[4,5],wapensmid:[4,5],    // smelterij en smidse
      pakhuis:[3,3],woonhuis:[2,3],wachttoren:[2,3],kazerne:[4,5],
      voederplaats:[2,1],dierenweide:[3,0],bloemenweide:[1,0],                  // harmonie (7)
    },
    maxRise:9,maxRiseMine:26,      // max hoogteverschil op de bouwplaats (mijnen staan op rots of gebergte)
    digBase:2,digPerUnit:6,        // graafwerk in beurten: digBase + (som van alle hoogteverschillen tot het gemiddelde) / digPerUnit
    digTicks:30,buildTicks:50,     // ticks per graafbeurt / per verwerkte plank of steen
    diggers:2,builders:2,          // max per bouwplaats
    digShare:0.3,                  // deel van de voortgangsmeter voor het egaliseren
    refund:0.5,                    // afbreken geeft dit deel van het verwerkte materiaal terug (naar beneden afgerond)
  },
  /* bevolking (production.js, mijlpaal 6a): een voltooid woonhuis krijgt in de loop van de tijd tot 'house' bewoners;
     elke every ticks komt er één bij als er een stuk voedsel (food) bij de deur ligt, dat dan op is. Een nieuwe bewoner
     is een vrije drager. stock = hoeveel van elk voedsel het woonhuis bij de deur wil zolang het nog niet vol is. */
  pop:{house:6,every:900,food:['brood','stoofpot','notenmix'],stock:1},
  /* productie (production.js). Buitenwerkers (gather: tree, stone, plant) zoeken binnen area tegels rond hun deur (op eigen
     grond) het dichtstbijzijnde doel, werken daar work ticks, brengen out naar hun deur en rusten dan rest ticks binnen.
     spare: boomsoorten die de houthakker laat staan (4 = appelboom, voor de plukker in 5b).
     Werkplaatsen verwerken in ticks ticks de invoer 'in' tot 'out'; stock = hoeveel van elk invoergoed ze bij de deur willen. */
  prod:{
    enough:24,
    areaMove:2,                    // werkgebied verzetten: het midden mag tot areaMove × area tegels van de deur liggen
                     // een werkgebouw stopt zolang de speler minstens zoveel van zijn product heeft (scheelt dragers)
    houthakker:{gather:'tree',area:10,work:80,rest:60,out:'boomstam',spare:[4]},
    steenhouwer:{gather:'stone',area:10,work:100,rest:60,out:'steen'},
    bosbouwer:{gather:'plant',area:7,work:50,rest:80},
    zagerij:{in:{boomstam:1},out:{plank:2},ticks:160,stock:4},
    /* voedsel (5b). farm: oogst eerst een rijpe akker van zijn gewas (crop: 1 graan, 2 peulvruchten, 3 groente) in het
       werkgebied, anders zaait hij een nieuwe; de akker is na nature.crop[crop] ticks rijp. pick: plukt een appelboom of
       bessenstruik (fruit) of hazelaar (noten), om en om; daarna groeien er na nature.regrow ticks nieuwe vruchten aan. */
    boerderij:{gather:'farm',crop:1,area:6,work:60,rest:40,out:'graan'},
    bonenakker:{gather:'farm',crop:2,area:4,work:60,rest:40,out:'peulvruchten'},
    moestuin:{gather:'farm',crop:3,area:4,work:50,rest:40,out:'groente'},
    plukkershut:{gather:'pick',area:9,work:60,rest:40,out:'fruit',out2:'noten'},
    waterput:{in:{},out:{water:1},ticks:140,stock:0},
    molen:{in:{graan:1},out:{meel:1},ticks:120,stock:4},
    bakkerij:{in:{meel:1,water:1},out:{brood:2},ticks:200,stock:4},
    gaarkeuken:{in:{peulvruchten:1,groente:1,water:1},out:{stoofpot:2},ticks:200,stock:4},
    droogschuur:{in:{fruit:1,noten:1},out:{notenmix:2},ticks:200,stock:4},
    /* mijnen en metaal (5c). Een mijn (mine = ertssoort in world.ore: 1 kolen, 2 ijzer, 3 goud) eet per ronde één stuk
       lievelingskost (CFG.mineFood) en haalt één stuk erts uit de dichtstbijzijnde ertstegel binnen area tegels;
       elke ertstegel bevat mineUnits stuks. Smidse en uitrustingsmaker hebben recepten (product: invoer); automatisch maken
       ze het product waarvan de speler het minst heeft, of wat de speler kiest (opdracht 'make'). */
    mineUnits:20,
    mineMeals:['brood','stoofpot','notenmix'],   // wat een mijnwerker eet
    mineFav:2,                     // rondes werk per stuk lievelingskost (andere maaltijd: 1)
    mineOtherStock:1,              // zoveel van elke andere maaltijd wil een mijn bij de deur (van de lievelingskost: stock)
    kolenmijn:{mine:1,area:3,out:{kolen:1},ticks:200,stock:4},
    ijzermijn:{mine:2,area:3,out:{ijzererts:1},ticks:220,stock:4},
    goudmijn:{mine:3,area:3,out:{gouderts:1},ticks:260,stock:4},
    ijzersmelterij:{in:{ijzererts:1,kolen:1},out:{ijzer:1},ticks:240,stock:4},
    goudsmelterij:{in:{gouderts:1,kolen:1},out:{goud:1},ticks:240,stock:4},
    smidse:{recipes:{bijl:{ijzer:1,plank:1},zaag:{ijzer:1,plank:1},houweel:{ijzer:1,plank:1},hamer:{ijzer:1,plank:1},schop:{ijzer:1,plank:1},zeis:{ijzer:1,plank:1}},ticks:300,stock:4},
    wapensmid:{recipes:{helm:{ijzer:1},schild:{ijzer:1,plank:1},polsband:{ijzer:1,goud:1}},ticks:300,stock:4,enough:6},   // uitrusting: pas nodig vanaf mijlpaal 6, dus weinig
  },
  /* natuur (production.js): een geplant boompje is na grow ticks een boom, een stronk verdwijnt na stump ticks,
     een steenblok geeft stoneUnits stuks steen; plantNear: zoveel bomen of boompjes direct naast een plek (van de 4) en hij
     plant er niet meer; every = ticks tussen twee controles */
  nature:{grow:6000,stump:4000,stoneUnits:8,plantNear:2,every:20,
    crop:[0,3600,3000,2400],       // ticks tot een akker rijp is: graan, peulvruchten, groente
    regrow:3000},                  // ticks tot een geplukte boom of struik weer vruchten heeft
  /* wilde dieren (colonists.js); sleutel = 3D-model in manifest.animals. Aantal = min(max, beloopbaar land (of water) / per).
     keep: afstand tot een startplek bij het neerzetten; range: straal rond hun thuisplek; wait: [min, max] ticks stilstaan;
     rest: kans dat het daarbij gaat liggen of zitten, dan restWait ticks; rate: loopbeelden per 120 ms (huppen sneller) */
  animals:[
    {k:'hert',  per:700, max:260,keep:22,speed:0.06, range:10,wait:[40,200],rest:0.35,restWait:[200,500],rate:1},
    {k:'konijn',per:450, max:400,keep:15,speed:0.09, range:4, wait:[0,50],  rest:0.25,restWait:[100,300],rate:2},
    {k:'eend',  per:600, max:260,keep:0, speed:0.025,range:6, wait:[40,200],rest:0,   restWait:[0,0],    rate:0.5,water:1},
    {k:'vos',   per:1800,max:90, keep:22,speed:0.07, range:12,wait:[40,240],rest:0.4, restWait:[200,600],rate:1.2},
    {k:'vogel', per:900, max:200,keep:10,speed:0.05, range:3, wait:[20,120],rest:0.3, restWait:[100,300],rate:2},
  ],
  /* krachtpatsers: in het veld (lopen, selecteren in de duel-testmodus) en in krachthal en torens (verplaatsen in het dorp: crew.js) */
  army:{
    speed:0.075,                   // tegels per tick lopen
    hurtSpeed:0.6,                 // uitgeschakeld lopen gaat langzamer (factor)
    maxSelect:100,                 // max geselecteerd tegelijk
    spacing:0.8,                   // afstand in de opstelling bij een loopopdracht (tegels)
    groupTap:350,                  // ms: twee keer dezelfde groeptoets binnen deze tijd centreert de camera
    /* krachthal en bemanning (mijlpaal 6c, crew.js). crew = plaatsen per toren (bemand vanaf één); startCrew = krachtpatsers
       (niveau 1) per toren van het startdorp. Krachthal: houdt standaard hall.keep krachtpatsers in reserve (keuze uit hall.keeps
       in het paneel Productie), leidt een rekruut in train ticks op tot niveau 1 en traint in upTicks een niveau hoger met de
       uitrusting uit up (wordt gedragen, dus verbruikt); ze vraagt hoogstens hall.stock van elk stuk tegelijk. Rekruten zijn
       vrije dragers (carry.keepFree blijven over). Mijlpaal 8c: de hal houdt ook hall.band muzikanten (keuze uit hall.bands); ze
       worden in train ticks opgeleid en blijven niveau 1 (fluit). */
    crew:{wachttoren:2},startCrew:1,train:800,upTicks:1200,up:{2:{helm:1},3:{schild:1,polsband:1}},
    hall:{keep:2,keeps:[0,1,2,3,4,6,8,12],band:1,bands:[0,1,2],stock:2},
  },
  /* aanraakbediening (input.js): ms vasthouden voor een selectierechthoek, pixels bewegen voordat het slepen is,
     extra marge in pixels rond een figuur voor een vinger, ms dat de tooltip na een tik blijft staan */
  touch:{hold:350,slop:10,pick:14,tipMs:3000},
  /* armpje drukken (duel.js). Kracht = level[niveau] × (gevoed ? 1 : hungry) × (1 + harmony × (2 × harmoniemeter − 1))
     × (1 − fatigue × vermoeidheid). Per tick schuift de duelstand (−1 links wint … +1 rechts wint) met
     krachtverschil / krachtsom × push, plus een golvende toevalsterm v (v = v × keep + toeval × noise). */
  duel:{
    level:[0,1,1.45,2],            // basiskracht per niveau 1–3 (index 0 ongebruikt)
    hungry:0.75,                   // kracht als hij niet gevoed is
    harmony:0.3,                   // invloed van de harmoniemeter (0..1, 0,5 = neutraal): ±30%
    harmonyStart:0.5,              // harmoniemeter in de Duel-test (in de economie: CFG.harmony)
    fatigue:0.35,                  // krachtverlies bij volle vermoeidheid (een uitgeputte senior blijft iets sterker dan een frisse junior)
    push:0.04,keep:0.95,noise:0.01, // toeval alleen voor spanning bij bijna gelijke kracht: bij 15% meer kracht wint de sterkste
                                   // 9 op de 10 keer, bij 30% meer altijd; senior tegen junior duurt ~4 s, een gelijk duel ~23 s
    tire:0.0005,                   // vermoeidheid erbij per duel-tick (beide deelnemers)
    rest:0.0002,                   // herstel per tick als hij niet duelleert (van vol naar fris: ruim 4 minuten)
    winTire:0.1,                   // vermoeidheid erbij voor de winnaar na elk duel: wie vaak wint, wordt langzaam zwakker
    maxTicks:1200,                 // daarna wint wie op dat moment voorstaat
    meetTicks:600,                 // zo lang mogen beide over het lopen naar de tafel doen
    seat:0.34,                     // halve afstand tussen de deelnemers in tegels (past bij de duel-sprite)
    outTicks:600,                  // verliezer is zo lang uitgeschakeld, bij zijn heler
    /* muzikantensteun: een eigen muzikant binnen range[niveau] tegels (fluit, harp, doedelzak) maakt een krachtpatser
       bonus sterker; meerdere muzikanten tellen niet op. Uitgeschakelde of duelleerde muzikanten bestaan niet (ze duelleren niet). */
    music:{range:[0,3,5,8],bonus:0.15},
    afterOut:0.3,                  // vermoeidheid als hij weer meedoet
    /* testmodus 'Duel-test': per speler (1 en 2) krachtpatsers met deze niveaus, één heler en muzikanten (niveau per speler),
       op een open veld bij burcht 1; gap = afstand tussen de twee groepen in tegels */
    test:{levels:[1,2,3,1,2,3],gap:7,healers:[1,2],musicians:[[3],[1]]},
  },
  /* gebied (mijlpaal 6b): straal rond de burcht (altijd bemand) en elke bemande wachttoren */
  territory:{burcht:20,wachttoren:13},
  /* Ruil-test (knop onder Modus): elke tegel binnen deze straal hoort meteen bij de dichtstbijzijnde burcht (512 = de hele kaart) */
  landTest:{r:512},
  /* grond ruilen (mijlpaal 8a, deals.js). Een buur rekent per tegel een waarde: ter[terreinsoort] + wat erop staat (tree, sapling,
     bush, field, stone × wat er nog in zit) + ore × wat er nog in zit (× oreNeed als hij van dat erts minder dan oreScarce tegels op
     zijn eigen gebied heeft); dichtbij zijn burcht telt zwaarder: × (1 + home × (1 − afstand/homeR)).
     Goederen: waarde per stuk (goods), × shortMul als hij er minder dan short van heeft.
     Hij neemt aan als wat hij krijgt minstens margin − relMargin × relatie/100 keer zoveel waard is als wat hij afgeeft; vanaf
     counterAt van dat bedrag doet hij een tegenbod in goederen (uit goods, van wat de vrager het meest heeft), geldig counterTicks.
     Een ruil geeft beide relDeal relatiepunten (relatie −100..100, start 0); rel = ondergrens per relatieniveau.
     maxTiles = hoogstens zoveel tegels per kant van een voorstel.
     Buren vragen zelf (mijlpaal 8b, req): vanaf first ticks, elke every ticks, kijkt een buur die van een erts minder dan oreScarce
     tegels heeft of het binnen reach tegels van zijn grens op het gebied van speler to ligt. Dan vraagt hij een strook tot dat erts
     (hoogstens tiles tegels) en biedt goederen ter waarde van offer × wat de strook jou waard is (van elk goed hoogstens de helft van
     wat hij vrij heeft). Een verzoek geldt ttl ticks; daarna, of na je antwoord, vraagt die buur cool ticks niets. Meer vragen (één
     keer): more × de goederen, als de strook hem zelf zoveel waard is. to: tot mijlpaal 9 (één vaste speler) vragen ze alleen speler 1.
     Grensduel (duel): na een afwijzing kan de vrager uitdagen; dat kost beide relCost relatiepunten. meetTicks: zo lang mogen
     beide krachtpatsers over de weg naar de tafel op de grens doen. Van beide kanten loopt de dichtstbijzijnde muzikant uit een
     krachthal mee (mijlpaal 8c) en staat band = [opzij, naar voren] tegels van de stoel (vóór de tafel staan geen bomen: tableSpot); het duel begint als hij er is, of als
     meetTicks om is. */
  deal:{maxTiles:150,
    val:{ter:[0.1,0.15,0.3,0.5,0.6,0.4,0.3,0.25,0.1],tree:1,sapling:0.5,bush:0.3,field:1.5,stone:1,ore:4,oreNeed:2.5,oreScarce:6,home:2,homeR:16},
    goods:{boomstam:0.6,plank:1,steen:1,brood:1.4,stoofpot:1.6,notenmix:1.6,kolen:1.5,ijzer:3,goud:5},
    short:10,shortMul:1.5,
    margin:1.25,relMargin:0.2,counterAt:0.6,counterTicks:1200,
    relDeal:10,rel:{gespannen:-100,onbekend:0,kennis:15,vriend:45,bondgenoot:75},
    req:{to:0,first:2400,every:600,cool:6000,reach:8,tiles:30,offer:1.1,more:1.3,ttl:2400},
    duel:{relCost:15,meetTicks:2400,band:[1.3,0.9]}},
  /* harmonie (mijlpaal 7, harmony.js), in punten 0–100. Doel = start + bronnen; elke every ticks schuift de meter step punten.
     voer: een voederplaats met dierenverzorger vult de bak met 1 food (graan) voor ticks ticks en vult bij als er minder dan
       refill over is; gevuld geeft full punten (de beste max tellen), leeg langer dan grace ticks kost empty punten.
     weide: een dierenweide met een gevulde voederplaats binnen r tegels geeft plus (max tellen); elke breed ticks komt er een
       dier bij (kinds om de beurt) tot cap dieren rond de wei. bloem: plus per bloemenweide (max tellen).
     bos: k × (aandeel bos op je gebied / aandeel bij de start − 1), begrensd tot [min, max]: kaalslag kost, aanplant helpt.
     Gevolgen bij harmonie 0 of 100 (lineair, 50 = neutraal): groeitijd van akkers en boompjes ∓grow, tijd tot een nieuwe
       bewoner ∓pop. ore: vanaf min houden hoogstens max dieren zich op bij een ertsader op je gebied (elke every ticks één erbij).
     low/high: drempels voor de adviseur. */
  harmony:{start:50,every:100,step:1,
    voer:{food:'graan',ticks:2400,refill:600,stock:2,full:6,max:4,empty:-4,grace:1200},
    weide:{r:8,plus:5,max:3,breed:3600,cap:6,kinds:['hert','konijn']},
    bloem:{plus:3,max:5},
    bos:{k:20,min:-15,max:10},
    grow:0.2,pop:0.25,
    ore:{min:75,every:600,max:3,margin:4},
    low:35,high:75},
  /* de adviseur (advisor.js): één advies tegelijk, hoogste prio eerst; showSec = hoe lang een advies hoogstens blijft staan.
     Per regel: soort (tip, waarschuwing, belangrijk, compliment), cool = afkoeltijd in seconden voordat dezelfde regel weer mag,
     wait = hoe lang de voorwaarde al moet gelden (s), min = drempel; expr (tevreden, bezorgd, nadenkend) alleen als die afwijkt
     van de soort. "Alleen belangrijk" toont alleen de soort belangrijk. Complimenten komen één keer per wereld. */
  advisor:{showSec:45,prio:{compliment:1,tip:1,waarschuwing:2,belangrijk:3},
    expr:{tip:'nadenkend',waarschuwing:'bezorgd',belangrijk:'bezorgd',compliment:'tevreden'},
    rules:{
      voedselOp:{soort:'belangrijk',cool:180},
      materiaal:{soort:'belangrijk',cool:180},
      gereedschap:{soort:'waarschuwing',cool:180},
      voedselLaag:{soort:'waarschuwing',cool:300,min:6},
      mijnLeeg:{soort:'waarschuwing',cool:300},
      vakman:{soort:'tip',cool:180,wait:60},
      dragers:{soort:'tip',cool:300,wait:30},
      torenLeeg:{soort:'tip',cool:240,wait:60},
      voerLeeg:{soort:'waarschuwing',cool:300,wait:60},
      harmonieLaag:{soort:'waarschuwing',cool:600},
      verzoek:{soort:'belangrijk',cool:60},
      houtketen:{soort:'compliment'},brood:{soort:'compliment'},toren:{soort:'compliment'},harmonie:{soort:'compliment'},
    }},
  /* zichtbare grens: lijn in spelerkleur, inset = afstand tot de tegelrand (in tegels), breedte in beeldpunten op het scherm */
  border:{inset:0.14,width:2.2,minWidth:0.6,alpha:0.9},
  unloadWarnTicks:1200,   // na zoveel ticks (1 minuut) vraagt herladen of sluiten om bevestiging (ui.js)
  /* rook (loop.js), alleen bij bakkerij, gaarkeuken en smelterijen tijdens een batch: geschilderde wolkjes (assets/effects/rook.webp)
     elke every ms een nieuw pufje, frameMs per beeld, een volledig beeld w wereldpixels breed bij een getekend gebouw (geschilderde
     gebouwen: × breedte/refW). Zonder spriteblad: puffs cirkels per period ms. */
  smoke:{frameMs:90,every:480,w:28,alpha:0.95,puffs:3,period:2800,rise:16,circleAlpha:0.6,refW:40,
    fx:0.29},   // voet van de pluim in het beeld (gemeten, 0..1 van de breedte); het anker van het spriteblad (0,35) zette de rook links van de schoorsteen
  /* molenwieken (loop.js): arm = lengte van een wiek in wereldpixels bij schaal 1 (× sc of sail), turn = draaisnelheid in
     radialen per ms (0.0011 = een omwenteling in ruim 5,7 s). Geschilderde wieken: assets/effects/molenwieken_*.webp. */
  mill:{arm:15,turn:0.0011},
};
