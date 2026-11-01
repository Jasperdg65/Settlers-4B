# Economie

Hoe het dorp werkt: goederen, dragers, bouwen, beroepen, productie, voedsel, mijnen, bevolking en gebied.
Alle getallen staan in `public/js/config.js`; de stand per mijlpaal in [../roadmap.md](../roadmap.md). Krachthal en bemanning van torens: [krachtpatsers.md](krachtpatsers.md).

## Speelmodi

Modus *Economie* (standaard), *Stresstest* (de oude test met duizenden rondlopende
kolonisten, zonder goederen) of *Duel-test* (krachtpatsers en armpje drukken, zie hieronder). De simulatie loopt met `CFG.ticksPerSec` (20) ticks per seconde,
los van het tekenen.

## Basis (mijlpaal 1–4)

- **Goederen** (`GOODS` in `js/goods.js`): bouwmaterialen, voedsel, grondstoffen, metalen,
  gereedschap en uitrusting; elk met een eigen getekende sprite.
- **Stapels**: alles ligt als stapel op de grond, max `CFG.stackMax` (8) per stapel, één per tegel
  (`world.stk[tegel]` = stapel+1). Stapels staan in compacte arrays (`G.tile`, `G.good`, `G.cnt`,
  `G.pl`, `G.bld`). Ook de voorraad van burcht en pakhuis ligt zo, op hun stapelplekken
  (`bldSlots`: vrije tegels rond het gebouw, dichtst bij de deur; ingang en paden blijven vrij).
- **Startvoorraad** in de burcht: `CFG.startStock`, keuze Weinig/Normaal/Veel in het paneel.
- **Paneel Voorraad**: totaal per goed per speler, inclusief wat dragers onderweg vasthouden.
- **Dragers** (`js/transport.js`): in economiemodus zijn alle kolonisten vrije dragers zonder beroep;
  zonder opdracht lopen ze rond hun laatste plek. Een centrale planner (elke `CFG.carry.plannerEvery`
  ticks) kijkt per gebouw wat ontbreekt (`b.want − b.has − b.coming`), kiest de dichtstbijzijnde stapel
  met een vrij stuk (bij een gebouw dat dat goed zelf niet vraagt), reserveert het (`G.res`) en geeft
  de opdracht aan de dichtstbijzijnde vrije drager. Die haalt het, draagt het zichtbaar in zijn handen
  en legt het bij de deur neer; past het daar niet, dan gaat het naar de dichtstbijzijnde opslag.
- **Routes** (`js/path.js`): A* over de tegels in 8 richtingen, met kosten voor terrein, bomen,
  stenen, voetpaden en hoogteverschil (`CFG.path`). Zoekopdrachten staan in een wachtrij met een
  vast knopenbudget per tick, dus geen Web Worker nodig en de simulatie blijft deterministisch.
  Routes en 'onbereikbaar' gaan in een LRU-cache; `world.walkVer` verhogen maakt die leeg.
- **Bouwen** (`js/build.js`, getallen in `CFG.build`): kies een gebouw in het paneel Bouwen; op de
  kaart kleurt de voetafdruk groen of rood met de reden in de tooltip (eigen gebied, vlak genoeg,
  geen boom/steen/goederen, ondergrond: mijnen op rots of gebergte, de rest op gras). Esc of de
  rechtermuisknop stopt. Een bouwplaats doorloopt: gravers egaliseren (meer werk naarmate het hoogteverschil
  groter is, de grond verandert zichtbaar), dragers brengen planken en steen, bouwers verwerken ze en
  het gebouw verschijnt van onder naar boven. Gravers en bouwers zijn vrije dragers die eerst een schop
  of hamer uit de voorraad halen. Afbreken geeft de helft van het verwerkte materiaal terug; dat en wat er
  nog lag, brengen dragers naar de opslag. De burcht kan niet gebouwd of afgebroken worden.
  Afgebroken gebouwen blijven in `world.blds` staan met `dead`, zodat indexen geldig blijven.
- **Beroepen** (`CFG.jobs`, `js/jobs.js`): elk voltooid werkgebouw krijgt een vakman. Eerst een werkloze
  vakman met dat beroep, anders een vrije drager die het gereedschap uit de voorraad haalt (bijl, zaag,
  houweel, hamer, schop, zeis; molenaar, bakker, smelter en smid hebben niets nodig).
  Hij loopt naar de deur, gaat naar binnen en de vlag verschijnt. Er blijven altijd `CFG.carry.keepFree`
  vrije dragers per speler over. Bij afbreken komt de bewoner naar buiten en houdt zijn beroep.
  Uiterlijk (`JOBLOOK` in `js/units.js`): de vrije drager met hoed, schort en gereedschap of een
  kenmerkend goed in de hand; sprites worden pas gemaakt als ze nodig zijn (`jobSprite`).
- Eigen gebied (`CFG.territory`): straal rond de burcht en elke bemande wachttoren (zie Gebied, mijlpaal 6b).
- **Vraag**: alleen werkplaatsen en mijnen vragen goederen (hun invoer, `CFG.prod`); het tijdelijke
  verbruik (`CFG.temp`) is in mijlpaal 5c vervallen.

## Productie (mijlpaal 5a, `js/production.js`, getallen in `CFG.prod` en `CFG.nature`)

- Buitenwerkers (houthakker, steenhouwer, bosbouwer) zoeken binnen hun werkgebied (`area` tegels rond
  de deur, alleen op eigen grond) het dichtstbijzijnde doel, lopen erheen, werken, brengen het product
  naar hun deur en rusten binnen. Een gekapte boom wordt een stronk die na `nature.stump` ticks
  verdwijnt; een geplant boompje is na `nature.grow` ticks (5 min) een boom; een steenblok geeft
  `nature.stoneUnits` steen. De houthakker laat appelbomen staan (voor de plukker, 5b).
- Werkplaatsen (zagerij: 1 boomstam → 2 planken) verwerken wat de dragers bij de deur leggen
  (`b.want`), als er plek is voor het product.
- Wat een werkgebouw maakt en zelf niet vraagt, brengen dragers naar de dichtstbijzijnde opslag;
  wie het nodig heeft, haalt het daar (of direct bij de maker).
- Stapelplekken zijn nu per gebouw exclusief (`world.slotAt`): een gebouw krijgt geen plek die al
  bij een ander gebouw hoort.
- Werkgebied: stippellijn bij het plaatsen en als de muis boven zo'n gebouw staat. Tooltip en het
  paneel 'Voorraad en productie' tonen per gebouw de toestand (werkt, wacht op boomstam, geen bomen
  in het werkgebied, opslag bij de deur vol, wacht op een vakman) en hoeveel er gemaakt is.
- Kaartgenerator: houthakker en steenhouwer van het startdorp staan waar de meeste bomen of
  steenblokken zijn, de bosbouwer zo dicht mogelijk bij een houthakker, en bij elke steenhouwer ligt
  een groepje van ongeveer 9 steenblokken.
- Met de huidige getallen maakt één startdorp ongeveer 8 boomstammen, 15 planken en 3 steen per
  minuut (Node-simulatie van 15 minuten, zonder voorraadgrens); het bos rond de houthakker blijft op peil.

## Voedsel (mijlpaal 5b)

- Akkers: de boer (boerderij, bonenakker) en de tuinier (moestuin) oogsten eerst een rijpe akker van
  hun gewas in het werkgebied en zaaien anders een nieuwe op vrije, vruchtbare grond (gras of
  weelderig). `world.crop` = gewas, `obj` 6 = groeit, 7 = rijp; groeitijd per gewas in
  `CFG.nature.crop`. Akkers zijn beloopbaar (`CFG.path.field`).
- Plukker: om en om fruit (appelboom, bessenstruik) en noten (hazelaar); een geplukte boom of struik
  heeft na `CFG.nature.regrow` ticks weer vruchten (`world.pickT`). De struiksoort hangt vast aan de
  tegel (`bushKind`), voor tekenen en plukken gelijk.
- Werkplaatsen: waterput (uit het niets), molen, bakkerij, gaarkeuken, droogschuur (`CFG.prod`).
- Voorraadgrens `CFG.prod.enough` (24): een werkgebouw stopt zolang de speler genoeg van zijn product
  heeft; dat scheelt dragers en opslagruimte. Melding "genoeg … op voorraad".
- Stapelplekken: werkgebouwen kiezen eerst, opslag daarna, en een werkgebouw mag een lege plek van
  een opslag overnemen; straal voor werkgebouwen `CFG.slotRadius.anders` (5). Een werkplaats houdt
  één plek per product vrij, anders kan hij vastlopen met alleen invoer bij de deur.
- Dragers kiezen een opslag waar het goed past; is die bij aankomst vol, dan brengen ze het naar een
  gebouw dat erom vraagt of naar een andere opslag (anders bleven ze wachten bij een volle opslag).
- Startaantal: 40 kolonisten per speler (`CFG.eco.colonistsPerPlayer`); in 5b tijdelijk 60, sinds 6a
  komen er meer uit woonhuizen.
- De nieuwe gebouwen zijn getekende versies (klein en eenvoudig); een geschilderde afbeelding kan
  via het paneel Gebouwen.

## Mijnen en metaal (mijlpaal 5c)

- Mijn: de mijnwerker eet elke maaltijd (`CFG.prod.mineMeals`), maar zijn lievelingskost (`CFG.mineFood`:
  kolenmijn brood, ijzermijn stoofpot, goudmijn fruit-notenmix) is goed voor `mineFav` (2) rondes, een
  andere maaltijd voor één. Hij vraagt `stock` van zijn lievelingskost en `mineOtherStock` (1) van de
  rest. Zo loopt het startdorp (alleen brood) niet vast, en loont een gaarkeuken of droogschuur toch
  (Node, startdorp, 30 min: 29 ijzer en 17 goud, eerst 0). Per ronde haalt hij één stuk erts uit de dichtstbijzijnde ertstegel van zijn soort
  binnen `area` tegels; elke ertstegel bevat `CFG.prod.mineUnits` (20) stuks (`world.oreRes`, ook in
  de tegelinfo). Zonder erts: "geen ijzer meer in de buurt".
- Smelterijen: erts + kolen → ijzer of goud. Kolen is de knelpunt-grondstof (beide smelterijen).
- Smidse en uitrustingsmaker werken met recepten (`recipes`: product → invoer). Automatisch maken ze
  het product waarvan de speler het minst heeft; in het paneel Productie kies je een vast product
  (opdracht `make` via `order()`, dus ook bruikbaar voor computerburen). Smidse: bijl, zaag, houweel,
  hamer, schop, zeis (ijzer + plank). Uitrustingsmaker: helm (ijzer), schild (ijzer + plank),
  polsband (ijzer + goud), met een eigen voorraadgrens van 6 (`enough`), want uitrusting is pas
  vanaf mijlpaal 6 nodig.
- Het tijdelijke verbruik (`CFG.temp`) is weg: alle voedsel wordt nu gemaakt en door de mijnen
  gegeten. Woonhuizen en torens gaan eten in mijlpaal 6. "Verbruikt" in de meting telt nu wat
  werkplaatsen en mijnen verwerken.
- Gemeten (Node, 30 minuten, startdorp plus gaarkeuken, droogschuur, moestuin, bonenakker en
  plukkershut): 84 kolen, 97 ijzererts, 73 ijzer, 9 van elk gereedschap, 6 van elke uitrusting.

## Bevolking (mijlpaal 6a, `CFG.pop`)

- Een voltooid woonhuis krijgt in de loop van de tijd tot `house` (6) bewoners. Elke `every` ticks
  komt er één bij als er een stuk voedsel (brood, stoofpot of fruit-notenmix) bij de deur ligt; dat
  stuk is dan op. De nieuwe bewoner is een vrije drager bij de deur. Is het huis vol, dan vraagt het
  geen voedsel meer.
- De rijen per eenheid (`S`) groeien mee (`growUnits`, capaciteit verdubbelt), zodat er tijdens het
  spel kolonisten bij kunnen komen.
- Paneel Productie: "Woonhuis ×3 · 12 van 18 nieuwe bewoners · 1 wacht op voedsel"; de meting
  "Kolonisten" telt mee.
- Gemeten (Node): speler 1 groeit van 40 naar 58 kolonisten zodra er voedsel is (3 woonhuizen).

## Gebied (mijlpaal 6b, `CFG.territory`, `CFG.border`)

- Gebied komt alleen van bemande gebouwen: de burcht (altijd bemand) en wachttorens met een
  bewoner. `computeLand` (js/build.js) rekent `world.own` opnieuw uit zodra een toren bemand raakt of
  verdwijnt: elke tegel hoort bij het oudste bemande gebouw dat hem in zijn straal heeft (burcht
  eerst, dan torens op volgorde van bemannen, `b.mt`). Een nieuwe toren neemt dus nooit land van een
  buur af. Land dat geen bemand gebouw meer dekt (de toren is afgebroken), blijft van zijn eigenaar
  maar is onbeschermd: valt het binnen de straal van een bemande toren van een ander, dan is het
  van die (ook bij een toren die later bemand raakt).
- Bemanning: sinds 6c door krachtpatsers (zie hieronder). De torens van het startdorp zijn meteen
  bemand.
- Straal: burcht 20, wachttoren 13 (`CFG.territory`), zodat een toren een stap vooruit is en geen tweede burcht.
  Een startgebied is zo'n 1.500 tegels; een nieuwe toren aan de rand voegt er rond de 240 toe.
- Gebouwen op land dat verloren gaat blijven staan en werken door; er kan daar alleen niet meer
  gebouwd worden. Ook een bouwplaats wordt afgebouwd: een toren die zo buiten de grens klaarkomt,
  geeft na bemanning het gebied terug.
- Afbreken van een bemande toren: de tooltip zegt vooraf of het gebied blijft, of hoeveel tegels naar
  een buur gaan en welke eigen gebouwen of bouwplaatsen dan buiten de grens komen (`landLoss`).
- De grens is altijd zichtbaar: een lijn in spelerkleur op de grond (onder bomen en gebouwen),
  iets naar binnen, zodat twee buren elk hun eigen lijn houden; ook op het minikaartje. Tooltip
  van een toren: bemand of onbemand; paneel Productie: "Wachttoren ×3 · 2 bemand · gebied 2.722 tegels".
- Mijnen van het startdorp staan bij voorkeur binnen het gebied, en altijd met erts binnen het
  bereik van de mijnwerker (`CFG.prod[mijn].area`, dezelfde telling als `findOre`). Ligt het erts
  niet binnen het gebied, dan staat de mijn buiten de grens; dragers komen er gewoon (routes kijken
  niet naar gebied), dus voedsel en erts gaan heen en weer (in 12 testkaarten 39 van de 139 mijnen, vooral goudmijnen).
