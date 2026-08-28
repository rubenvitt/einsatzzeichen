# Entscheidung: LFH-403 — Gates und Werkzeuge, Härtung vor dem Katalogausbau

Datum: 28. August 2026

Status: umgesetzt; technische Gates und Werkzeuge, keine fachliche Freigabe

Scope: Textmetrik-Gate in `core` (LFH-410), seitliche Fußzonen-Grenze zur Kompositionszeit
(LFH-411), Font-Subsetting (LFH-412), Coverage-Achsen Regelabdeckung und generative Reichweite
(LFH-413), Referenzinventar und die aufgelaufenen Rezept-/Conformance-Posten (LFH-414)

## Ausgangslage

Vorbild ist die Gate-Härtung vor D.1 (`2026-08-06-gate-haertung-vor-d1.md`). Die fünf
Subtasks hatten einen gemeinsamen Kern: Jedes bestehende Gate galt für den **heutigen Bestand**,
nicht für die **Form**.

1. `boxMm` eines Textprimitivs ist laut `geometry.ts` eine Zusicherung des Autors, keine Messung.
   `text-ink.test.ts` rastert die Piktogrammtexte des Katalogs und belegt die Zusicherung — für
   `ALL_PICTOGRAMS`, nicht für ein künftiges Textzeichen. Die Fußzone (`designation`) wurde von
   `validate.ts` nur auf „nicht leer“ geprüft; ein zu langes Wort lief aus dem Zeichen heraus.
2. `Arimo[wght].ttf` lag mit 496 268 Byte unsubsettet im Repository.
3. Die Slice-1-Spec (§7) nennt drei Coverage-Achsen; gebaut war eine (Zeichenabdeckung gegen den
   selbstdeklarierten `scope`). `uncoveredScope` prüft an einem Präfix nur, ob **eine** Zeile mit
   ihm beginnt — ein Abschnitt `J.2.3` ohne Eintrag war strukturell unsichtbar.
4. Elf Referenzposten waren in zwei Prosa-Absätzen an „eine spätere Rezept- und
   Conformance-Coverageaufgabe“ verwiesen. Gemessen gegen das Inventar (`fingerprints.json`,
   661 Dateien) war das Leck größer: **111 Dateien** beanspruchte niemand, 27 davon innerhalb des
   deklarierten Umfangs.

## Entscheidung

### Textmetrik: ein Gate, zwei Anschlusspunkte (LFH-410, LFH-411)

Die beiden Aufgaben brauchen dieselbe Antwort auf „wie kommt Schriftmetrik zu `core`, ohne dass
`core` die Schrift kennt“. Die Antwort ist ein **injizierter Metrikanbieter**, kein Parser und kein
Rasterer in `core`:

- `packages/core/src/text-metrics.ts` definiert `TextMetrics` (`advanceEm`, `inkExtentEm`,
  optional `kerningEm`) und `checkTextMetrics(drawing, metrics)`. Das Gate misst je Textlauf die
  Vorschubsumme mit Kerning und die **Tinte** (Vereinigung der Glyphen-Bounding-Boxen an den
  Stiftpositionen) und prüft sie gegen `boxMm`: `text-too-wide`, `text-outside-box`,
  `unknown-glyph` (fail-closed, kein `.notdef`-Ersatz), `unmeasured-baseline` (`middle`),
  `text-too-tall`. Vertikal wird nur bei `baseline: 'alphabetic'` inhaltsabhängig geprüft
  (größtes yMax und kleinstes yMin der Glyphen um die Grundlinie); bei `hanging` liegt die
  Grundlinie um eine Hanging-Metrik unter `y`, die nicht in der Tabelle steht — dort trägt der
  Rasterbeleg in `fonts.test.ts` die Aussage. Eine inhaltsunabhängige Soll-Box aus
  `verticalTextBoxMm` wäre für 62 handvermessene Katalogboxen falsch gewesen („TEL“ reserviert
  zu Recht keine Unterlänge) und wurde deshalb nicht als Regel eingeführt.
- `CatalogPorts.textMetrics` ist Pflicht. `compose()` prüft nach der Konstruktion alle drei
  eigenen Texterzeuger — Fußzone, `labelPrimitive`-Läufe, Funktionsrollenläufe — und wirft bei
  Überlänge `CompositionError` mit `designation-too-wide`, `label-too-wide` oder
  `function-role-run-too-wide`. **Fehler, kein Umbruch, keine Verkleinerung:** Umbruch und
  Verkleinerung änderten Geometrie und damit 256 SVG-Snapshots und 526 Kontaktbögen; ein Fehler
  lässt Renderer und Snapshots unberührt und zwingt den Autor, das Zeichen zu entscheiden.
- Der Katalog liefert `ARIMO_TEXT_METRICS` aus `packages/catalog/assets/arimo-metrics.json`
  (Laufzeitvalidierung wie bei `fingerprints.json`). Die Datei ist ein Generat aus der Schriftdatei
  (siehe Subsetting) — Advances, Glyphboxen und GPOS-`kern`-Paare der Default-Instanz.

Kalibrierung gegen die Rasterprüfung bei 8 px/mm: Die reine Vorschubsumme überschritt die
handvermessenen Boxen um die Seitenbreiten der Randglyphen (31 + 7 Falschpositive); mit
Glyphboxen blieben sieben, sechs davon ≤ 0,07 mm Handvermessungsrauschen, einer („GW Tauchen“,
0,52 mm) das Kernpaar „Ta“ (−227/2048 em). Daraus folgen Kerning in der Rechnung und eine
dokumentierte Toleranz von **0,125 mm = 1 Rasterpixel bei 8 px/mm** — exakt die Schwelle, die die
bestehende Rasterevidenz ohnehin durchlässt. Vertikal gilt dieselbe Toleranz: exakt gerechnet
fielen sieben Läufe, alle durch den Überschuss runder Glyphen unter der Grundlinie
(−20/2048 em, 0,068–0,137 mm) oder Handvermessungsreste (≤ 0,046 mm). Ein einziger Lauf lag
darüber — das „C“ in `comms.telephone-exchange` bei 14 mm Schriftgrad, 0,012 mm über der
Toleranz; seine Autorenbox wurde um 0,15 mm nach unten korrigiert (kein Snapshot enthält
`boxMm`). Das ist der erste Fall, in dem das Gate eine Zusicherung gegen die Glyphen widerlegt
hat. Ergebnis: 0 von 511 Katalogläufen mit Befund, alle 525 Renderfälle passieren
`checkTextMetrics`; `composeFromCatalog` wirft für
„Wasserrettungszugführung“ und nimmt „Wasserrettung“ an. `text-ink.test.ts` bleibt als
Rasterbeleg des Katalogs daneben stehen.

### Font-Subsetting als eingechecktes, reproduzierbares Derivat (LFH-412)

Es gibt keine Build-Kette und CI hat kein Python; `pyftsubset`-Ausgabe ist zwischen
fontTools-Releases nicht byte-stabil. Deshalb ist das Subset kein Build-Schritt, sondern ein
Derivat mit Skript und Prüfgates:

- `scripts/font/subset-arimo.sh` lädt das Upstream-Original nach `out/font/`, prüft dessen SHA-256
  (`TEXT_FONT_SOURCE_SHA256`), subsettet mit fontTools 4.63.0 und exportiert die Metriktabelle
  (`scripts/font/export-metrics.py`). Die exakte Kommandozeile steht in `fonts.ts` und
  `assets/README.md`.
- Zeichenvorrat ist die **Decke**, nicht der Boden: `designation` ist ein freier String, deshalb
  Latin-1, Latin Extended-A/B, General Punctuation, `€`, `™`, `−`, U+FEFF, U+FFFD — nicht nur die
  heute gerenderten ASCII-Zeichen plus `öÖüÜ`.
- Die `wght`-Achse bleibt erhalten (kein Instanziieren): `visual-proof.ts` setzt
  `font-weight="700"`, und die Default-Instanz bleibt dadurch byteidentisch zur heutigen.
- Ergebnis: **496 268 → 82 756 Byte (−83,3 %)**, 645 Codepoints, alle Kopftabellen erhalten
  (`unitsPerEm` 2048, `hhea` 1854/−434, `sCapHeight` 1409 — die Werte, aus denen `text-policy.ts`
  seine Konstanten ableitet). Rasterung bit-identisch: keine der 256 SVG-Snapshots und 526
  Kontaktbögen änderte sich.
- Gates in `fonts.test.ts`: Hash beider Dateien, Kopfwerte und `fvar` per DataView aus der TTF
  gelesen, Tofu-Prüfung des deutschen Prüfvorrats gegen die Signaturen von U+FFFD und `.notdef`,
  Abgleich der Metriktabelle mit der Datei. Der Name „Arimo“ bleibt: die OFL der Schrift
  deklariert keinen Reserved Font Name; der Modifikationshinweis steht in `sources.ts` und README.

### Referenzinventar statt Conformance-Achse (LFH-414)

Beispiel- und Übersichtsposten bekommen **keine eigene `CoverageKind`**: Eine Manifestzeile ist ein
Umsetzungsnachweis mit Testevidenz und Review; ein Beispiel hat keine Umsetzung, ein
Übersichtsblatt keine eigene. Was fehlte, war die Vollständigkeitsprüfung gegen das Inventar.

`packages/catalog/src/reference-inventory.ts` führt `INVENTORY_EXCLUSIONS` — je Datei
Disposition, Begründung und Entscheidungsnotiz als Pflichtfelder — und
`checkReferenceInventory()` im Coverage-Gate setzt die Mengengleichung
`Inventar (661) = beansprucht (550) ∪ außerhalb des Umfangs (83) ∪ Ausschlüsse (28)` durch.
Beansprucht ist die Union aus Manifest, `RECIPES.referenceAsset` und
`ElementDescriptor.referenceAssets`. Explizite Dispositionen haben Vorrang vor der aus `scope`
abgeleiteten Klasse „außerhalb“ — sonst wäre `J_Bedienungszeichen.svg` (Präfix `J`, kein
Scope-Treffer) still entschuldigt worden, die eine Datei, für die das Gate gebaut wurde.
Befunde: `unaccounted-reference` (der Gate gegen den fünften Posten), `stale-exclusion`,
`ambiguous-disposition`, `exclusion-without-reason`, `exclusion-without-decision`,
`claimed-asset-not-in-inventory`, `section-without-entry` (abschnittsgenau, schließt die
`uncoveredScope`-Blindstelle). Der dateilose Posten Abschnitt J.2.3 steht als
`SECTIONS_WITHOUT_SIGN` mit Test: im Umfang, nur ausgeschlossene Beispieldateien, keine Zeile.

Die 28 Ausschlüsse:

- `overview-sheet` (1): `J_Bedienungszeichen.svg` — Übersichtsblatt 80 × 32 mm
  (`2026-08-10-anhang-j-iuk-d3.md`, §9).
- `example` (9): `J.2.3._Beispiel Telefon.svg`, `J.2.3._Beispiel Wählbetrieb.svg`
  (`2026-08-10-anhang-j-iuk-d3.md`, §9); `5.8.1_Beispiel 1/2/3.svg`,
  `5.8.7_Beispiel_Schneiend_extrem/mittel/schwach/stark.svg` (`2026-08-07-kapitel-5-8-zustaende-d2.md`, §7).
- `deferred` (18), entschieden in dieser Notiz:
  - `2.9_Schwarz`, `2.10_Blau`, `2.11_Rot`, `2.12_Gelb`, `2.13_Grün`: Farbtafeln ohne
    Zeichenkörper; sie belegen Farbwerte für Linien und Flächen der Lagedarstellung. Ob sie als
    Element (Farbtoken) mit Vermessung geführt werden, ist nicht entschieden.
  - `2.14_Escape Route`, `2.14_Escape Route_2`, `2.15_Riegelstellung`, `2.16_Brandausbreitung`,
    `2.17`–`2.20_Grenze*`: Linien- und Flächenzeichen der Lagedarstellung. Der Katalog führt
    keinen Linientyp, und sie sind nicht in der 32-mm-ViewBox komponierbar; zurückgestellt bis zu
    einer eigenen Linienzeichen-Aufgabe.
  - `5.1.1_Fahrzeug_ungeschützt`: Kopfdatei des Abschnitts; die Fahrwerke sind an 5.1.1.1–5.1.1.6
    vermessen, der Inhalt selbst hat keine eigene ID.
  - `5.1.1.4_Amphibienfahrzeug`: Wellenlinie nur als Strichhülle vermessen (wie im
    Manifestkommentar); `5.1.1.7` (aufgleisbar) und `5.1.1.9` (Wechselbehälter): Fahrwerksform
    nicht vermessen, nicht in `VehicleCategoryId`; `5.1.1.8` (Wechsellader): nicht gegen diese
    Datei vermessen, `swap-loader-vehicle` ist an Anhang E belegt.

Eine spätere Umsetzung eines dieser Posten macht den Ausschluss zu `stale-exclusion` — die Liste
kann nur bewusst schrumpfen, nicht still wachsen.

### Regelabdeckung und generative Reichweite als Metrik (LFH-413)

Beide Achsen sind **Metrik, kein Gate** (Spec §7: „dokumentiert, kein Gate“), ausgegeben in
`pnpm cli coverage` vor der Gate-Zeile:

- **Regelabdeckung** misst Wertabdeckung je Achse, abgeleitet aus dem Bestand statt gepflegt:
  16 Achsen (zehn `SymbolSpec`-Achsen aus `RECIPES`, `ELEMENTS` und Grundzeichen; sechs
  Piktogramm-ID-Räume gegen `ALL_PICTOGRAMS`). Die Nur-Typ-Unions bekommen in
  `schema/src/taxonomy-values.ts` Wertelisten, deren Vollständigkeit der Compiler über
  `Record<X, true>` erzwingt. Stand: **14/16 vollständig**; Lücken `administrativeLevel` 3/6
  (gemeinde, bezirk, bundesland — nur Kreis, Nationalstaat und EU sind als Kopf vermessen) und
  `vehicleCategory` 7/8 (amphibienfahrzeug).
- Die Validierungsregeln haben mit `VALIDATION_RULE_IDS` in `core` erstmals eine zentrale Liste:
  **72 distinkte Regeln** (75 `rule:`-Stellen; drei IDs sind doppelt vergeben). Ein Quelltextscan
  hält Liste und `validate.ts` in beide Richtungen mengengleich; ein zweiter Test verlangt für
  jede Regel einen auslösenden Testfall — neun fehlten und wurden ergänzt, eine
  (`surface-right-label-requires-measured-anchor`) ist aus einer `SymbolSpec` heute nicht
  auslösbar und steht als benanntes `it.todo`.
- **Generative Reichweite** wird nicht gegen den kartesischen Raum gerechnet (durch `designation`
  und reellwertige Label-Metriken formal unendlich), sondern als **Stufe 1** enumeriert:
  kind × Körpervariante × Organisation × Kopfzone (Stärke ⊕ technische Kopfmarke ⊕
  Verwaltungsstufe) × Fahrwerk, mit echtem `validateSpec` und `composeFromCatalog`. Stand:
  225 720 enumeriert, 963 bestehen die Validierung, **894** komponieren (69 lehnt erst der Motor
  ab), **67** davon in der Referenz belegt, **827** erzeugbar ohne Referenzbeleg; acht
  Rezeptsignaturen liegen außerhalb der Stufe 1 (bodyMark, functionRole, labels). Nicht
  enumeriert: 88 Fähigkeiten, 132 Körpermarken, 25 Funktionsrollen, freie Bezeichnung.

## Bewusst nicht gebaut

- Kein Fontparser und kein Rasterer in `core`; keine neue externe Abhängigkeit in einem Paket.
- Kein Umbruch und keine automatische Verkleinerung überlanger Bezeichnungen.
- Kein CI-Build-Schritt für das Subset; ein Neuaufbau mit anderer fontTools-Version kann einen
  anderen Hash liefern und zieht dann `fonts.ts`, README und Metriktabelle nach.
- Keine tabellarische vertikale Prüfung für `baseline: 'hanging'`.
- Keine vierte `CoverageKind`, keine JSON-Ausgabe des Coverage-Kommandos, kein Prozentwert der
  generativen Reichweite gegen einen unendlichen Nenner.
- Keine Umsetzung der 18 zurückgestellten Referenzdateien; keine Änderung an Katalogeinträgen,
  Rendergeometrien, Snapshots, Provenienzstatus oder fachlichen Reviews.

## Nachweis und Reviewgrenze

Der Nachweis (Vollgates, unabhängige Reviews, exakter PR-HEAD, Post-Merge-Verifikation des
effektiven Remote-`main`) wird im PR und in den ClickUp-Subtasks LFH-410–414 geführt. Diese
technische Härtung erteilt keine fachliche, normative oder lizenzrechtliche Freigabe; die
offenen fachlichen Reviews bleiben unverändert offen.
