# Roadmap

Werkwijze: in mijlpalen, elk één commit, met een stop voor beoordeling na elke mijlpaal.

| Mijlpaal | Inhoud | Stand |
| --- | --- | --- |
| 1 | Goederen en opslag (stapels, paneel Voorraad) | klaar |
| 2 | Dragers en transport (planner, A*, routecache) | klaar |
| 3 | Bouwen (plaatsen, egaliseren, materiaal, afbreken) | klaar |
| 4 | Beroepen via gereedschap | klaar |
| 5a | Productiekern met hout en steen: houthakker, bosbouwer (boompjes groeien uit), zagerij, steenhouwer (steenblokken raken op), werkgebied per gebouw, afvoer van overschot naar de opslag, paneel Productie | klaar |
| 5b | Voedsel: boerderij (graan), bonenakker (peulvruchten), moestuin (groente) met akkers die groeien en rijpen; plukkershut (fruit van appelbomen en bessenstruiken, noten van hazelaars, groeien weer aan); waterput; molen (graan → meel), bakkerij (meel + water → brood), gaarkeuken (peulvruchten + groente + water → stoofpot), droogschuur (fruit + noten → fruit-notenmix) | klaar |
| 5c | Mijnen met lievelingskost (`CFG.mineFood`) en ertstegels die opraken, smelterijen, smidse (gereedschap), uitrustingsmaker (helm, schild, polsband: statusuitrusting voor hogere niveaus), keuze wat ze maken; tijdelijk verbruik vervalt | klaar |
| 6a | Bevolking: woonhuizen krijgen met voedsel tot 6 nieuwe bewoners (vrije dragers); start weer 40 kolonisten per speler | klaar |
| 6b | Gebied: zichtbare grens, gebied alleen van bemande torens (tijdelijk met een wachter) | klaar |
| 6c | Krachthal: leidt vrije dragers op tot krachtpatsers en traint ze met uitrusting naar niveau 2 en 3; reserve instelbaar; krachtpatsers bemannen de torens (de tijdelijke wachter vervalt) | klaar |
| 7 | Harmonie (0–100 per speler): voederbakken met dierenverzorger, dierenweide, aangeplant bos en bloemenweides verhogen; lege voederbakken en kaalslag verlagen. Dieren vermenigvuldigen bij gevulde voederbakken. Effecten op moed en kracht van soldaten, groei van akkers en bomen, nieuwe kolonisten, en bij hoge harmonie blijven dieren staan bij ertsaders. Meter in het paneel | klaar |
| 8a | Grond ruilen: een stuk grond van een buur aantekenen, eigen grond en goederen bieden; de buur beslist met een waardefunctie (erts, bomen, akkers, nabijheid van zijn burcht) en een marge per relatie, of doet een tegenbod. Afspraken in `world.deals` gaan boven het gebied uit torens. Eerste versie van de relatie (`world.rel`). Geen torenovername (zie beslissingen, [ontwerp/grond-ruilen.md](ontwerp/grond-ruilen.md)) | klaar |
| 8b | Buren vragen zelf om jouw grond als ze een erts missen dat net over de grens ligt (aannemen, één keer meer vragen, afwijzen); grensduel met armpje drukken na een afgewezen voorstel: de sterkste krachtpatser uit de dichtstbijzijnde toren van beide kanten, de winnaar krijgt de strook, een uitdaging kost relatie. Torens blijven bemand tijdens het duel | klaar |
| 8c | Krachtpatsers in het eigen dorp: verplaatsen tussen torens en krachthal (ruilen met de zwakste als een toren vol is), extra aannemen, zelf kiezen wie voorgaat bij trainen; muzikanten uit de krachthal lopen mee naar een grensduel en het duel wacht op ze. Geen aanmoedigen met muis of toetsenbord | klaar |
| 9a | Eén vaste speler (rood); de andere kleuren bouwen zelf hun dorp: brein in een Web Worker (`ai.js`) beslist wat en waarom, de simulatie zoekt de plek en geeft een gewone opdracht `place`. Hout en steen eerst, woonhuizen, eten, mijnen met eten voor mijnwerkers, torens naar erts, bos of steen, gereedschap via de smidse. Plan per buur zichtbaar in Productie | klaar |
| 9b | Karakter per buur (gul, zuinig, trots, voorzichtig …) en moeilijkheidsgraad; buren die zelf handel en hulp voorstellen | later |
| 10 | Handel: marktplaats, handelaar met handkar of bootje, ruilvenster, ruilverhouding volgens schaarste | later |
| 11 | Diplomatie: relatieniveau en geheugen per buur, geschenken, afspraken, samen mediteren, feesten en feesttoernooien, vrede met vaste grenzen | later |
| 12 | Hoofddoel: Tuin van verbondenheid op neutraal terrein (bouwfasen, bijdrage per speler, gezamenlijke winst; modus "vrij spel" zonder tuin) en natuurgebeurtenissen: droogte, strenge winter, overstroming | later |
| 13 | Opslaan en laden van de hele wereld (automatisch en handmatig, ook als bestand), pas als het spel bijna klaar is; tot die tijd vraagt de browser om bevestiging bij herladen of sluiten | later |
| 14 | Talen: alle teksten van het spel via `t()`, vertalingen Engels, Frans, Duits en Spaans (spel en handleiding), taalkeuze in het spel | later |

Bouwvolgorde na de economie (mijlpaal 5–7): eerst computerburen, dan handel, dan diplomatie, dan
de Tuin van verbondenheid met de natuurgebeurtenissen.

## Daarnaast

- De adviseur (klaar, 2026-11-01): regels in `CFG.advisor`, module `js/advisor.js`. Later: instellingen per account,
  meer regels (bijvoorbeeld harmonie, buren), een definitieve naam.
- Vakmensen in 3D (klaar: 17 loopmodellen uit `bron/ambachten/` en 11 werkhoudingen voor 8 beroepen uit `bron/modellen/`).
  Nog: werkanimatie (de houdingen staan stil), een model voor de dierenverzorger, en wat een vakman draagt op een
  vast punt in de hand.
- Krachtpatsers vrij over het veld sturen in het eigen dorp (nu alleen in de Duel-test; verplaatsen tussen gebouwen kan sinds 8c).
- Helers in het dorp, en muzikanten van niveau 2 en 3 (instrumenten als goed).
- Sprite-atlas voor kolonisten en dieren (prestaties, zie [techniek/architectuur.md](techniek/architectuur.md)).
- Alle "Komt eraan"-punten uit de handleiding staan in de README (automatisch bijgehouden).
