# Krachtpatsers

Armpje drukken in plaats van oorlog: krachtpatsers, helers en muzikanten, de krachthal, de bemanning van torens
en (later) torens uitdagen en overnemen. Waarom zo: zie [../beslissingen.md](../beslissingen.md). De duel-sprite en de 3D-modellen: [../techniek/renderstraat.md](../techniek/renderstraat.md).

## Ontwerpnotitie: gevechten (nog niet bouwen)

- Het gevecht wordt een losse module (bijvoorbeeld `js/combat.js`) met één functie die een duel
  tussen twee eenheden afhandelt: kracht vergelijken, winnaar bepalen. Geen andere code beslist
  over winnen of verliezen.
- Het leger bestaat uit armdrukkers, helers en muzikanten die samen optrekken. Helers zijn een
  soort soldaat (geen gebouw): ze trekken mee met hun groep.
- De verliezer sterft niet: hij keert terug naar de heler van zijn groep (waar die op dat moment
  is) en is een tijd uitgeschakeld.
- Kracht hangt af van niveau (1–3), gevoed zijn en de harmoniemeter van zijn speler; de
  formule en alle getallen staan in de config.
- Gevolgen voor de opbouw van soldaten, kazerne en wapens (mijlpaal 6):
  - elke militaire eenheid heeft een soort (armdrukker, heler, muzikant), niveau, uitrusting,
    of hij gevoed is, zijn groep, zijn thuisplek (kazerne of toren) en een
    "uitgeschakeld tot"-tick, in compacte arrays zoals de andere kolonisten;
  - een groep (leger dat samen optrekt) is een eigen record met zijn leden, zodat een
    verliezer zijn heler kan vinden;
  - de krachthal (gebouwsleutel `kazerne`) traint kolonisten en levert alleen eenheden met die
    velden af; ze rekent zelf geen kracht uit.
- Geen wapens: de uitrustingsmaker (gebouwsleutel `wapensmid`) maakt van ijzer helmen, schilden
  en polsbanden, statusuitrusting voor hogere niveaus. De ijzer- en kolenketen blijft dus nodig.
- De krachtpatsers hebben geen wapen; voor het duel komt een eigen armdruk-sprite (mijlpaal 3).
- Muzikanten ondersteunen de kracht van hun groep binnen een bereik; hoe hoger hun niveau, hoe
  groter dat bereik (getallen in de config).

## Krachthal en bemanning (mijlpaal 6c, `CFG.army`, js/crew.js)

- Krachtpatsers zijn kolonisten met beroep `krachtpatser` en niveau `S.lvl` (0 = rekruut in opleiding,
  1–3). Een rekruut loopt nog als drager; vanaf niveau 1 het 3D-krachtpatsermodel van zijn niveau.
- Krachthal (`kazerne`): haalt vrije dragers binnen tot haar reserve (`b.keep`, standaard
  `army.hall.keep` = 2, keuze 0/2/4/8 in het paneel Productie, opdracht `keep`) vol is. Er blijven
  altijd `carry.keepFree` vrije dragers over. Ze leidt één tegelijk op (`train`, 40 s) tot niveau 1
  en traint daarna met uitrusting bij de deur een niveau hoger (`upTicks`, 60 s): helm → niveau 2,
  schild + polsband → niveau 3 (`army.up`). Uitrusting wordt gedragen, dus verbruikt; de hal vraagt
  hoogstens `hall.stock` van elk stuk.
- Wachttoren: `army.crew.wachttoren` = 2 plaatsen. Een toren haalt de dichtstbijzijnde opgeleide
  krachtpatser: vrij buiten of uit de reserve van een krachthal (niet wie daar net traint). Met
  minstens één bewoner is hij bemand en geeft hij gebied. Startdorp: `startCrew` = 1 junior per toren.
- Afbreken: wie binnen is komt naar buiten; een rekruut verliest zijn opleiding en is weer drager.
  Losse krachtpatsers gaan naar een krachthal met plek of naar een toren die er een zoekt.
- `b.crew` (wie binnen is), `b.otw` (onderweg), `b.trn` (wie traint). Nog niet: eten voor
  krachtpatsers, helers en muzikanten in het dorp, krachtpatsers zelf sturen, betere bemanning
  naar de rand verplaatsen.
- De krachthal staat als eerste in de lijst van het startdorp: hij is groot (5 × 3) en vond
  achteraan vaak geen vlakke plek meer.

## Duel-test (krachtpatsers, mijlpaal 4)

Knop *Duel-test* (of modus Duel-test): op een open veld bij burcht 1 staan per speler 1 en 2 zes
krachtpatsers (`CFG.duel.test.levels`), één heler en een muzikant (rood: doedelzak, blauw: fluit;
`CFG.duel.test.healers`, `musicians`). *Spelen als* kiest welke kant je bestuurt;
*Start* zet de opstelling opnieuw neer.

- Bediening: links slepen = selectierechthoek (max `CFG.army.maxSelect`, 100); klik = één;
  Shift+klik = alle eigen krachtpatsers van dat niveau in beeld; Ctrl+1..9 = groep opslaan (ook
  Alt/Cmd, want sommige browsers houden Ctrl+cijfer voor tabbladen); 1..9 = groep kiezen, twee keer
  kort na elkaar = camera erheen; rechtsklik op een vijandelijke krachtpatser = de sterkste vrije
  geselecteerde daagt hem uit (de melding noemt beider kracht); rechtsklik op de grond = lopen in opstelling; rechts slepen = schuiven;
  Esc = niets geselecteerd. Tooltip boven een krachtpatser: kracht, vermoeidheid, gevoed, uitgeschakeld.
- Aanraken (tablet, telefoon; `CFG.touch`): één vinger = schuiven, twee vingers = knijpend zoomen;
  tik op een eigen eenheid = erbij selecteren (nog eens = eruit); tik met een selectie op een vijandelijke
  krachtpatser = uitdagen, op de grond = lopen; vasthouden en slepen = selectierechthoek; vasthouden op
  een eenheid = alle van dat type in beeld; knop 'Niets geselecteerd'. Een tik toont ook de tooltip.
  In bouwmodus: eerste tik bekijkt de plek, tweede tik op dezelfde plek bouwt of breekt af.
- Opdrachten gaan via `order()` (`js/orders.js`) en worden in de volgende tick uitgevoerd; de
  selectie zelf is alleen weergave. De duels hebben een eigen toevalsgenerator (`drand`, seed van
  de wereld): dezelfde wereld met dezelfde opdrachten geeft dezelfde afloop.
- Duel (`js/duel.js`): beide lopen naar een stoel links en rechts van een tafelplek tussen hen in;
  zodra beide zitten, vervangt de duel-sprite de twee figuren. `duelStep` vergelijkt elke tick de
  kracht (niveau × gevoed × harmoniemeter × vermoeidheid, `CFG.duel`), met een golvende
  toevalsterm, en schuift de stand −1..+1; de sprite toont stand 1–9 en het balkje erboven
  schuift mee in beide spelerkleuren. Met de huidige getallen duurt een gelijk duel gemiddeld
  ongeveer 23 s; bij 15% meer kracht (bijvoorbeeld muziek) wint de sterkste 9 op de 10 keer, vanaf 30%
  meer altijd: een frisse senior verliest nooit van een junior (duurt ~4 s).
- Afloop: de winnaar loopt terug naar waar hij stond en krijgt er `winTire` (0,1) vermoeidheid bij,
  bovenop wat het duel zelf kostte; herstel in rust gaat langzaam (`rest`, van vol naar fris ruim
  4 minuten). Volle vermoeidheid kost 35% kracht: een uitgeputte senior wint nog van een junior, maar
  verliest van een frisse medior;
  de verliezer loopt doorschijnend en langzamer naar de dichtstbijzijnde eigen heler (zonder heler:
  de eigen burcht) en is daar `CFG.duel.outTicks` (30 s) uitgeschakeld.
- Markering boven geselecteerden: capsule in gezondheids-/vermoeidheidskleur (groen, geel,
  oranje, donkerrood = uitgeschakeld) met 1–3 koperen stipjes voor het niveau, en een ovaal in de
  spelerkleur op de grond.
- **Tijdelijk**: de harmoniemeter is vast (`CFG.duel.harmonyStart`, tot mijlpaal 7), iedereen in
  de test is gevoed, eenheden van de tegenstander doen niets uit zichzelf (geen terugvechten of
  uitdagen) en een eenheid onderweg naar een duel neemt geen loopopdracht aan.
- Heler en muzikant (rol 4 en 5, 3D per niveau): ook te selecteren en te verplaatsen, niet om te duelleren.
  **Muzikantensteun** (`CFG.duel.music`): een eigen muzikant binnen `range[niveau]` tegels (fluit 3,
  harp 5, doedelzak 8) maakt een krachtpatser `bonus` (15%) sterker; meerdere muzikanten tellen niet
  op. Een geselecteerde muzikant toont zijn bereik als stippellijn; de tooltip van een krachtpatser
  zegt 'muziek' als hij steun krijgt.

## Volgende stap: torens veroveren en gebied bij verovering (nog niet bouwen)

- Bemanning: een toren (en burcht/krachthal) houdt een lijst bewoners bij (krachtpatsers en een
  heler), met een maximum per gebouwtype in de config; bewoners zitten binnen (`S.ins`) en hebben
  het gebouw als thuisplek, zodat de winnaar daarheen terugloopt en een verliezer zijn heler vindt.
- Aanvallen: rechtsklik op een vijandelijke toren met een selectie = opdracht 'aanvallen'. Een
  verdediger komt naar buiten en neemt de uitdaging aan (via dezelfde `challenge`); per aanvaller
  één duel tegelijk, de rest wacht in de buurt. Daarvoor is een kleine verdedigings-AI nodig
  (wie komt eruit, wanneer gaat hij weer naar binnen).
- Verovering: een toren zonder bewoners die niet uitgeschakeld zijn, wordt overgenomen door de
  eerste aanvaller die de deur bereikt: `b.p` wordt de nieuwe speler, de aanvaller gaat naar binnen,
  de vlag wisselt van kleur (sprite-cache per speler), en verliezers van de oude eigenaar gaan naar
  hun eigen dichtstbijzijnde heler of burcht.
- Gebied: `computeLand` (mijlpaal 6b) rekent `world.own` al uit de bemande gebouwen (oudste bemande
  eerst) en tekent de grens opnieuw. Bij verovering wisselt alleen `b.p` en `b.mt`; nog te bepalen:
  wat er gebeurt met bouwplaatsen en stapels op verloren grond (afbreken of overnemen, config).
- Opslag: aanvallen en overnames lopen via de opdrachtenwachtrij, zodat ze deterministisch
  blijven en in een savegame of replay passen.

## Ontwerpregel: niveaus (voor alle militaire en ondersteunende rollen)

| Niveau | Hoofddeksel |
| --- | --- |
| 1 | eenvoudig hoofddeksel zonder versiering |
| 2 | hetzelfde hoofddeksel met een klein messing puntje of knopje bovenop |
| 3 | grote pluim of kam in spelerkleur (materiaal `TEAM_Crest`) |

| Rol | Hoofddeksel | Niveau 2 | Niveau 3 | Verder |
| --- | --- | --- | --- | --- |
| Krachtpatser (armdrukker) | helm | messing puntje | kam in spelerkleur | |
| Muzikant | vilten muts of baret | messing speld | grote veer | instrument: 1 fluit, 2 harp, 3 doedelzak |
| Heler | kap | messing voorhoofdsring | bladerkrans met lint in spelerkleur | |

- Selectiemarkering van een eenheid: naast de gezondheidskleur 1–3 stipjes voor het niveau.
- De wereld is pacifistisch: de rol Soldaat heet Krachtpatser (junior/medior/senior = niveau
  1/2/3: kale helm, helm met piek, hanenkam in spelerkleur). De soldaat-GLB's met zwaard en de
  getekende soldaat worden voor deze rol niet meer gebruikt (bron blijft in `bron/modellen/`).
- Nieuwe 3D-modellen voor muzikant en heler: per niveau een eigen GLB (zoals de soldaten),
  `TEAM_Crest` alleen op niveau 3; de renderstraat kleurt dat vanzelf in spelerkleur.

## Uit het hoofddoel: grensgeschillen en toernooien

- **Krachtpatsers**: grensgeschillen en feesttoernooien worden met armpje drukken beslecht, via de
  bestaande duelmodule. Een toernooi verbetert de relatie.
- Duelmodule: een duel krijgt een soort (`veld`, `grens`, `toernooi`). `endDuel` geeft de afloop
  door aan wie het duel aanvroeg, en de gevolgen per soort staan in de config: in het veld
  uitgeschakeld bij de heler, in een toernooi alleen wat vermoeidheid en een relatiebonus, bij
  een grensgeschil gaat de betwiste strook naar de winnaar.

## Open vragen

- Eten krachtpatsers (in torens en krachthal), en zo ja wat? Nu zijn ze altijd gevoed.
- Moeten de beste krachtpatsers naar de torens aan de grens, of blijft het "dichtstbijzijnde eerst"?
- Wanneer komen helers en muzikanten in het dorp, en waar wonen ze?
- Wat gebeurt er met bouwplaatsen en stapels op land dat bij een overname verloren gaat?
