# Harmonie

Harmonie (0–100 per speler) is het welzijn van een volk: hoe goed het zorgt voor mens, dier en natuur.
Mijlpaal 7; nog niet gebouwd. Hieronder wat er in de ontwerpnotities over staat.

## Mijlpaal 7 (uit de planning)

- Voederbakken met dierenverzorger, dierenweide, aangeplant bos en bloemenweides verhogen de harmonie;
  lege voederbakken en kaalslag verlagen haar.
- Dieren vermenigvuldigen bij gevulde voederbakken.
- Effecten op moed en kracht van krachtpatsers, groei van akkers en bomen en nieuwe kolonisten; bij hoge
  harmonie blijven dieren staan bij ertsaders (een hint waar erts zit).
- Een meter in het paneel.

## Bronnen

- Harmonie wordt een som van bijdragen per bron (voederbakken, wei, bos, bloemen, school, hunnebed),
  zodat nieuwe bronnen er los bij kunnen. Zie [school-en-hunnebed.md](school-en-hunnebed.md).
- Picknicken en knuffelen van vrije dragers kunnen een kleine bijdrage geven (config).
- Lawaaiige gebouwen (smidse, mijnen, zagerij) krijgen een eigenschap `noise` (straal); die vermindert
  het effect van het hunnebed en straks de harmonie.

## Zo werkt het nu (mijlpaal 7, `CFG.harmony`, js/harmony.js)

- Meter 0–100 per speler (`world.harm[p]` als 0..1). Elke `every` ticks (5 s) wordt het doel berekend:
  `start` (50) + de som van de bronnen; de meter schuift `step` (1) punt per keer naar het doel.
- Bronnen (`world.harmSrc[p]`), elk met een maximum aantal dat telt:
  - **voederplaats** (gebouw, beroep dierenverzorger): vult de bak met 1 graan voor 2 minuten; gevuld +6
    (beste 4 tellen), langer dan 1 minuut leeg −4;
  - **dierenweide** met een gevulde voederplaats binnen 8 tegels: +5 (beste 3); elke 3 minuten een jong
    (hert of konijn om de beurt) tot 6 dieren rond de wei;
  - **bloemenweide**: +3 (beste 5), kost 1 plank;
  - **bos**: 20 × (aandeel bos op het eigen gebied / aandeel bij de start − 1), begrensd tot −15..+10.
- Gevolgen, lineair rond 50: groeitijd van akkers en boompjes ±20%, tijd tot een nieuwe bewoner ±25%,
  duelkracht ±30% (`CFG.duel.harmony`), en vanaf 75 houden tot 3 dieren zich op bij ertsaders op het eigen
  gebied.
- Paneel Productie: balk met het doel als streepje en de bijdrage per bron. Adviseur: waarschuwing onder
  35, compliment vanaf 75, en een waarschuwing bij een lege voederplaats.
- Gemeten (Node, startdorp plus één voederplaats, dierenweide en bloemenweide): harmonie 50 → 64 in een
  paar minuten; zes jonge dieren in 25 minuten; het startdorp zelf hakt het bos iets dunner (−1).
- Nog niet: school en hunnebed als bron, picknicken en knuffelen, de toestand "ligt bij" voor dieren,
  geschilderde versies van de drie gebouwen.

## Nog in te vullen

- Hoe snel stijgt en daalt de harmonie, en hoeveel geeft elke bron?
- Wat gebeurt er bij heel lage harmonie (minder kinderen, langzamer werk, iets anders)?
- Hoe zie je de harmonie in de wereld zelf, naast de meter (bloemen, zingende vogels, kleur)?
- Telt het welzijn van de krachtpatsers mee (rust na duels, gevoed zijn)?
