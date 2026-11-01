# Kaartgenerator

Elke wereld wordt ter plekke gemaakt uit een naam (de seed). Dezelfde seed met dezelfde instellingen
geeft altijd precies dezelfde wereld. Code: `public/js/terrain.js`.

## Instellingen (nu)

| Instelling | Waarden |
| --- | --- |
| Seed | vrije naam; de dobbelsteen kiest een willekeurige |
| Grootte | 128, 192, 256, 320 of 384 tegels in het vierkant |
| Landvorm | continent, eilanden, binnenland met meren |
| Spelers | 2 tot 8 startplekken, elk met startdorp en kleur |
| Waterniveau, gebergte, bosdichtheid | schuiven (0–100%) |
| Startvoorraad | weinig, normaal of veel (`CFG.startStock`, `CFG.startFactor`) |

Terrein: diep en ondiep water, strand, gras, weelderig gras, droog gras, rotsgrond, gebergte en
sneeuw. Gebouwen staan op gras, mijnen op rots en gebergte. Ertsaders (kolen, ijzer, goud) liggen in
de bergen.

## Startdorp

- Per speler een burcht met daaromheen een vaste lijst gebouwen (`VILLAGE` in `terrain.js`): eerst de
  krachthal (groot, anders vaak geen vlakke plek meer), dan smelterijen, uitrustingsmaker, pakhuis,
  woonhuizen, houthakkers, bakkerij, molen, boerderij, waterput, smidse, zagerij, bosbouwer,
  steenhouwer en twee wachttorens (op 11–17 tegels afstand).
- Houthakker en steenhouwer staan waar de meeste bomen of steenblokken zijn, de bosbouwer zo dicht
  mogelijk bij een houthakker, en bij elke steenhouwer ligt een groepje van ongeveer 9 steenblokken.
- Mijnen (kolen, ijzer, goud) staan bij voorkeur binnen het gebied, en altijd met erts binnen het
  bereik van de mijnwerker.
- Voetpaden lopen van de burcht naar de gebouwen van het startdorp.

## Gepland (uit de notitie over het hoofddoel)

- Kaartgenerator: een schuif **onderlinge afhankelijkheid** verdeelt grondstoffen bewust ongelijk
  over de spelers (de een heeft veel steen, de ander ijzer of vruchtbare grond), zodat handel nodig is.
- Neutraal terrein in het midden of tussen de startplekken (in `world.own` een eigen waarde, nooit te
  claimen); de grondstofverdeling per startplek komt uit een instelling `interdep` (0 = eerlijk,
  1 = sterk ongelijk) die de ertsaders, steen, bos en vruchtbare grond per speler weegt.
  Deterministisch uit de seed.
- Spelmodus als wereldinstelling (`world.goal`: tuin of vrij), gekozen bij het genereren.
- Een kaarteditor; de API (`api/maps.php`) bewaart nu de generatorinstellingen en is voorbereid op
  editordata.

## Nog in te vullen

- Moeten startplekken eerlijk zijn (gelijke afstand tot water, bos en erts), of mag de seed dat bepalen?
- Hoe groot is het neutrale terrein voor de tuin, en waar ligt het bij eilanden?
- Wat moet een kaarteditor kunnen?
