# Beslissingen

Logboek van ontwerpbeslissingen: wat is besloten, wanneer en waarom. Nieuwe beslissingen komen
onderaan. Datums tot en met 1 november 2026 komen uit de git-geschiedenis (de dag waarop de
beslissing in het spel of de README kwam); de beslissing zelf kan iets eerder genomen zijn.

| Datum | Besluit | Waarom |
| --- | --- | --- |
| 2026-10-30 | Eigen spel, geïnspireerd door het genre; geen teksten of beelden uit bestaande spellen, ook niet in parafrase. | Eigen werk, geen auteursrechtproblemen, en ruimte voor een eigen toon. |
| 2026-10-30 | Plain HTML, CSS en JavaScript, met een kleine PHP-API (SQLite) alleen voor maps en savegames. | Eenvoudig te hosten op de eigen server, geen bouwstap nodig. |
| 2026-10-31 | Geen magie en geen priesters. | De wereld moet geloofwaardig en nuchter blijven; harmonie komt uit zorg voor mens, dier en natuur, niet uit bovennatuurlijke krachten. |
| 2026-10-31 | **Veganistische wereld**: geen vis, vlees, jacht, visserij, veehouderij of slachterij. Voedsel van akkers, moestuinen en plukken. | Past bij de vreedzame toon; dieren leven vrij en tellen mee in de harmonie. |
| 2026-10-31 | **Armpje drukken in plaats van oorlog.** Geen wapens: de uitrustingsmaker maakt helm, schild en polsband als statusuitrusting. Kazerne heet krachthal, soldaat heet krachtpatser. | Pacifistische wereld: meningsverschillen worden beslecht zonder dat er iemand valt. De ijzer- en kolenketen blijft toch nodig. |
| 2026-10-31 | Een verliezer sterft niet: hij rust uit bij de heler van zijn groep en doet daarna weer mee. | Zelfde reden; verliezen kost tijd, geen levens. |
| 2026-10-31 | **Niveauregel** voor alle krachtpatsers, helers en muzikanten: niveau 1 een eenvoudig hoofddeksel, niveau 2 met een klein messing puntje of knopje, niveau 3 met een grote pluim of kam in spelerkleur. Bij de krachtpatser: kale helm, helm met messing punt, helm met kam. | Het niveau is in één oogopslag te zien, voor alle rollen op dezelfde manier. Zie de opmerking onder de tabel. |
| 2026-10-31 | Kruidenhuis voorlopig uit het spel; de heler is een rol die met zijn groep meetrekt, geen gebouw. | Helers horen bij de groep, zodat een verliezer zijn heler kan vinden waar die op dat moment is. |
| 2026-10-31 | **Solo tegen computerburen**, geen multiplayer. Computerburen volgen exact dezelfde regels en economie, zonder gratis goederen, draaien in een Web Worker en hebben een karakter. | Eén mens tegen eerlijke buren; dezelfde regels houden het spel begrijpelijk en de buren geloofwaardig. |
| 2026-10-31 | Eén opdrachtenwachtrij (`order()`) als enige weg om de simulatie te veranderen, voor mens en computer gelijk. | Deterministisch, eerlijk (gecontroleerd alsof de opdracht van een onbekende komt) en later bruikbaar voor savegames en herhalingen. |
| 2026-11-01 | **Tuin van Verbondenheid als einddoel** (eerder "tempel" genoemd): alle spelers bouwen samen op neutraal terrein; als de tuin af is, winnen ze samen. Daarnaast een modus *vrij spel* zonder tuin. | Samenwerking als kern van het spel, in plaats van één winnaar. |
| 2026-11-01 | Gebied komt alleen van bemande gebouwen: de burcht en wachttorens met een bewoner. Het oudste bemande gebouw houdt een tegel; een nieuwe toren neemt nooit land van een buur af. | Gebied moet je verdienen en onderhouden; geen landjepik door alleen te bouwen. |
| 2026-11-01 | Straal van het gebied: burcht 20, wachttoren 13 (eerst 20, toen 12). | Een toren is een stap vooruit, geen tweede burcht. Een nieuwe toren aan de rand voegt zo'n 240 tegels toe. |
| 2026-11-01 | Mijnwerkers eten elke maaltijd; hun lievelingskost is goed voor twee rondes, een andere maaltijd voor één. | Het startdorp (alleen brood) loopt niet vast, en een gaarkeuken of droogschuur loont toch. |
| 2026-11-01 | De waterput mag overal op gras staan, niet alleen bij water. | Eenvoud; water uit de grond is aannemelijk. |
| 2026-11-01 | Startvoorraad bij "normaal": 4 zeisen. | Genoeg voor de akkers van het startdorp. |
| 2026-11-01 | Opslaan en laden komt pas als het spel bijna klaar is (mijlpaal 13); tot die tijd vraagt de browser om bevestiging bij herladen of sluiten. | Dan kan de hele wereld in één keer mee, zonder het formaat steeds te moeten aanpassen. |
| 2026-11-01 | Meertalig: Nederlands (brontaal), Engels, Frans, Duits en Spaans. Nieuwe tekst die een speler ziet, gaat via `t()`. | Internationaal publiek; vertalen is goedkoper als de teksten vanaf nu al los staan. |
| 2026-11-01 | Een handleiding in de eigen toon, met tabellen en ketens uit de config en schermafbeeldingen uit het echte spel; wat nog niet bestaat krijgt *Komt eraan*. | De handleiding blijft kloppen met het spel, en is eerlijk over wat er nog niet is. |
| 2026-11-01 | **Territorium blijft na het afbreken van een toren**, maar is dan onbeschermd: valt het binnen de straal van een bemande toren van een ander, dan gaat dat stuk naar die buur (ook bij een toren die later bemand raakt). | Afbreken mag geen straf zijn, maar onbewaakt land is ook niet voor altijd van jou. |
| 2026-11-01 | Rook alleen uit bakkerij, gaarkeuken en smelterijen, en alleen terwijl ze werken. Geschilderde rookwolkjes in plaats van cirkels. | Verwarming is bij hardwerkende gebouwen niet nodig; rook laat zien dat een gebouw werkt. |
| 2026-11-01 | Krachtpatsers komen uit de krachthal en bemannen de torens (de tijdelijke wachter vervalt). Niveau 2 met een helm, niveau 3 met schild en polsband; de krachthal houdt een instelbare reserve aan. | Mijlpaal 6c. De getallen (2 per toren, reserve 2, 40 s opleiden, 60 s trainen) zijn een eerste voorstel. |
| 2026-11-01 | Projectdossier in `docs/` (Markdown, in git, niet via het web bereikbaar); de README verwijst ernaar. | Ontwerp, beslissingen en planning op één vaste plek, los van de technische README. |
| 2026-11-01 | **De adviseur** (eerst "Meester Wout"): één advies tegelijk, belangrijkste eerst, met afkoeltijd; drie uitdrukkingen (bezorgd bij waarschuwingen, nadenkend bij tips, tevreden bij complimenten); instelbaar (alles, alleen belangrijk, uit, en per soort "niet meer tonen"), nu bewaard in de browser. | Spelers helpen zonder te betuttelen; wat hij zegt, volgt uit de regels in de config, zodat het spel en zijn adviezen niet uit elkaar lopen. |
| 2026-11-01 | De adviseur maakt geen geluid. | Nog niet gevraagd; een belletje kan later, met een eigen instelling. |
| 2026-11-01 | De adviseur heet **Milo**, in alle talen. | Kort, vriendelijk en in het Nederlands, Engels, Frans, Duits en Spaans goed uit te spreken; één naam maakt hem herkenbaar. |
| 2026-11-01 | Harmonie (mijlpaal 7): meter 0–100 die traag naar een doel schuift; bronnen voederplaats (graan), dierenweide, bloemenweide en bos; gevolgen voor groei (±20%), nieuwe bewoners (±25%), duelkracht (±30%) en dieren bij ertsaders vanaf 75. | Een traag reagerende meter beloont volhouden boven kunstjes. De getallen zijn een eerste voorstel. |
| 2026-11-01 | Het spel heet **Terrana** (eerst "Kolonie"), in alle talen. De naam staat op één plek: `spel.naam` in `public/lang/nl.js`. De handleiding gebruikt hem al; het spel zelf, de README en de docs nog niet. | Nieuwe naam; op één plek, zodat een volgende wijziging één regel is. |

**Opmerking bij de niveauregel:** in eerdere notities stond voor de krachtpatser ook "kale helm,
helm met piek, hanenkam in spelerkleur", en in de opdracht voor de handleiding "kale helm, piek,
pluim". De 3D-modellen volgen de regel hierboven (messing punt, kam). Wil je pluim in plaats van
kam, dan moeten de modellen van niveau 3 opnieuw.
