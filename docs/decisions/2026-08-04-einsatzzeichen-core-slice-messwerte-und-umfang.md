# Einsatzzeichen — Core-Slice: Umfangs- und Messentscheidungen

> Entscheidungsnotiz · Slice `2026-08-04-einsatzzeichen-core-slice` · Stand: Abschlussreview

## Zweck dieses Dokuments

Der Katalog dieses Slice deckt **8 von 14** Grundzeichen aus Kapitel 1 ab, kennt keine
Verwaltungsstufen- oder Fahrzeugkategorie-Kopfmarken, und einige Zahlen im Renderer (die
Drei-Plätze-Reihe der Stärkeangaben, die Verschiebung des Piktogramms mit dem Körper) sehen auf
den ersten Blick willkürlich aus. Sie sind es nicht — sie sind an der lokalen BABZ-Referenz
(`taktische-zeichen/`, 661 SVGs, **nie eingecheckt**, siehe `.gitignore`) vermessen.

Diese Provenienz lag bisher ausschließlich im Arbeitsverzeichnis `.superpowers/` — einem
Scratch-Bereich, der per `.gitignore` von der Versionierung ausgenommen ist. Räumt jemand dieses
Verzeichnis auf, verschwindet mit ihm die Begründung für jede Zahl unten. Dieses Dokument trägt
die Messwerte, die Belegdateien und die Begründung dauerhaft ins Repository — als Fachdokument
für jeden, der den Katalog fortsetzt, nicht als Sitzungsprotokoll.

Alle Referenzangaben sind **abgeleitete Kennzahlen** (Millimeterwerte, Dateinamen, Bildmaße) —
keine Pfaddaten und keine Geometrie aus den Referenzdateien selbst wurden übernommen oder
eingecheckt.

## 1. Warum sechs Grundzeichen fehlen

`BASE_SYMBOLS` (`packages/catalog/src/base-symbols.ts`) deckt 8 der 14 Grundzeichen aus Kapitel 1
ab (`formation`, `person`, `post`, `building`, `container`, `measure`, `hazard`, `point`). Sechs
fehlen, aus zwei verschiedenen Gründen:

**a) Fünf Grundzeichen sind mit dem heutigen Extraktionswerkzeug nicht vermessbar:**
`1.3 Landfahrzeug`, `1.4 Luftfahrzeug`, `1.5 Wasserfahrzeug`, `1.9 Gebiet`, `1.14 Spontanhelfer`.
Ihre Referenzdateien sind mit Kurven gezeichnet (`curvedPaths > 0`, leeres `shapes`-Array im
Fingerprint). Der naheliegende Fallback — die Form als `polyline` aus den in der
`audit:reference`-Ausgabe genannten Eckpunkten nachbilden — greift hier nicht: bei leerem
`shapes` nennt die Ausgabe keine Eckpunkte. Diese fünf Grundzeichen ohne belegte Geometrie in den
Katalog zu übernehmen hieße, sie zu erraten — das verstößt gegen die Projektlinie „an vermessener
Geometrie wird nie gedreht, um einen Test zu bestehen; unbelegte Geometrie kommt nicht in den
Katalog". Damit deckt der Slice 8 von 14 Grundzeichen ab, jedes belegt, statt 14, davon 5 geraten.

**b) `1.13 Ereignis` ist geometrisch rekonstruierbar, aber am heutigen Gate nicht belegbar.**
Die Referenzdatei zeichnet `1.13` nicht als Strich, sondern als eine zu einer Fläche
umgewandelte Kontur mit sechs Punkten:
`(16|25.451) (3.792|7.139) (4.208|6.862) (16|24.549) (27.791|6.862) (28.207|7.139)`.
Das sind **keine** Exportartefakte — paarweise gemittelt ergeben sie einen glatten Polyzug:
`(16|25.451)/(16|24.549) → (16|25)`, `(3.792|7.139)/(4.208|6.862) → (4|7)`,
`(27.791|6.862)/(28.207|7.139) → (28|7)`. `1.13 Ereignis` ist also der Polyzug
**(4|7) → (16|25) → (28|7)** bei 0,5 mm Strichstärke, und diese Mittelung ist exakt die Operation,
die `deriveRing` (siehe Abschnitt 3) für Ring-Paare bereits ausführt — Kennzahlenableitung, nicht
Kopieren von Referenzgeometrie.

Der eigentliche Grund, warum `1.13` trotzdem fehlt: **der Fingerprint zu `1.13` trägt als einzige
Form ein `bounds`, und das ist die Strich-Hülle** `3.792/6.862/28.207/25.451` — nicht die Hülle
der oben rekonstruierten Mittellinie (`4/7/28/25`). Ein Katalogeintrag mit der
Mittellinien-Hülle scheitert am Fingerprint-Gate um rund **0,59 Einheiten** bei einer Toleranz von
0,01. Mit dem heutigen Extraktionswerkzeug ist `1.13` also nicht gateable. Der spätere Fix für
fill-lose `<polygon>`-Elemente (die inzwischen korrekt als `outline` statt fälschlich als
`bounds` eingeordnet werden) macht `1.13` **nicht** automatisch gateable — dafür bräuchte
`extract.ts` eine neue Kennzahlenart „Strichmittellinie aus einem Umriss-Polygon", die es heute
nicht gibt. Das ist eine eigene Aufgabe für den nächsten Slice, kein Nebeneffekt eines
bestehenden Fixes.

## 2. Warum Verwaltungsstufen und Fahrzeugkategorien nicht umgesetzt sind

Von 16 Referenzdateien für Verwaltungsstufen (`5.7`) und Fahrzeugkategorien (`5.1.1`) sind nur
zwei überhaupt vermessbar: 9 der zehn `5.1.1`-Dateien haben ein leeres `shapes`-Array, 5 der
sechs `5.7`-Dateien tragen **nur** `outline` — eine Hülle, die um eine halbe Strichstärke zu groß
ist (rund 1,42 Einheiten Abweichung gegen 0,01 Toleranz).

Selbst mit vermessbarer Geometrie hätten `adminLevelHead` und `vehicleCategoryMarks` in diesem
Slice **keinen Konsumenten**: `CatalogPorts` (die Schnittstelle, über die `compose()` den Katalog
anspricht) kennt sie nicht, und `compose()` liest für die Kopfzone ausschließlich
`spec.strength`. Zwei Funktionen zu bauen, die nichts aufruft, ist ein YAGNI-Befund.

**Was umgesetzt ist:** Die Typen `AdminLevelId` und `VehicleCategoryId` existieren im Schema, und
die Validierungsregel `head-zone-conflict` (in `packages/core/src/validate.ts`) verhindert, dass
eine Verwaltungsstufe oder Fahrzeugkategorie gemeinsam mit einer Stärkeangabe spezifiziert wird.
**Was fehlt:** `packages/catalog/src/admin-levels.ts`, `packages/catalog/src/vehicle-categories.ts`
und ihre Kopfmarken-Konstruktion.

## 3. `deriveRing` gilt nur für achsparallele Rechtecke — warum 91 Ringe entfielen

`deriveRing` (`packages/cli/src/scan/path-geometry.ts`) rechnet aus einem Außen-/Innenring-Paar
die Mittellinie und die Strichstärke zurück, indem es die beiden achsparallelen Hüllen mittelt.
Das ergibt **nur bei achsparallelen Rechtecken** die tatsächliche Mittellinie. Bei schrägen
Kanten (Dreiecke, gedrehte Quadrate) oder bei Treppen-/L-Formen sind die Innenkanten ungleich
weit eingerückt — ein gemitteltes Ergebnis sieht plausibel aus, ist aber falsch.

Vor dem entsprechenden Fix erzeugte `deriveRing` für **jedes** Paar von genau zwei Teilpfaden ein
`ring`, unabhängig von der Form. Belegte Fehlklassifikationen im damaligen Artefakt:
- `1.10 Maßnahme` (Dreieck): fälschliches `ring` mit `strokeWidthMm: 1.213` statt der korrekten
  0,5 mm — eine Abweichung von 0,64 Einheiten bei 0,01 Toleranz. `PRECEDENCE` bevorzugt `ring` vor
  `bounds`, hätte also die korrekte Hülle verdeckt.
- `1.2 Person` (um 45° gedrehtes Quadrat): `ring` mit `strokeWidthMm: 0.707` statt 0,5 — die Hülle
  war zufällig richtig (weil symmetrisch), die Strichstärke schon falsch.

**Der Fix:** `parseRectilinearPath` meldet je Teilpfad zusätzlich, ob er ein achsparalleles
Rechteck ist (jedes Segment achsparallel **und** genau vier verschiedene besuchte Punkte, die
exakt den Ecken der eigenen Hülle entsprechen — beide Bedingungen zusammen, weil die erste allein
Treppen-/L-Formen durchließe und die zweite allein gedrehte Quadrate). `deriveRing` liefert nur
noch dann ein `ring`, wenn **beide** Teilpfade eines Paars achsparallele Rechtecke sind; sonst
`null`, und die Form fällt auf `outline` zurück.

**Gemessene Wirkung:** Die Zahl der `ring`-Einträge im Referenzartefakt fiel von **150 auf 59** —
**91 entfielen**, alle mit einer Strichstärke deutlich neben den erwarteten 0,5 mm (**61 % der
ursprünglichen `ring`-Kennzahlen waren falsch**). Die verbliebenen 59 sind sauber bimodal: 52 mit
0,5 mm, 7 mit 1,188 mm (die `D.1.2`…`D.1.8`-Familie „… im Einsatz", durchgängig dieselbe Hülle
`1/7.375/31/26` — eine gemeinsame Vorlage mit breiterer Linie, kein Fehlklassifikat). Diese
Bimodalität ohne verstreute Zwischenwerte ist selbst ein Indiz, dass der Fix nichts Falsches
durchgelassen hat.

## 4. Organisationsfarben: sieben belegt, `hilfsorganisation` nicht

`ORGANIZATION_COLORS` (`packages/catalog/src/organizations.ts`) ist bewusst
`Partial<Record<OrganizationId, ColorToken>>`, nicht `Record<…>`: der Katalog erfindet keine
Farbe ohne Beleg. Vermessen aus den `2.*`-Dateien der Referenz:

| `OrganizationId` | Farbe | Referenzdatei |
|---|---|---|
| `feuerwehr` | rot `#fa1919` | `2.1_Feuerwehr.svg` |
| `thw` | blau `#003296` | `2.3_Technisches Hilfswerk.svg` |
| `fuehrung-leitung` | gelb `#fafa00` | `2.4_Führung Leitung.svg` |
| `polizei` | grün `#14a01e` | `2.5_Polizei.svg` |
| `bundeswehr` | braun `#b4783c` | `2.6_Bundeswehr.svg` |
| `sonstige-gefahrenabwehr` | orange `#fa8c00` | `2.7_Sonstige Gefahrenabwehr.svg` |
| `zivile-einheiten` | hellgrau `#bebebe` | `2.8_Zivile Einheiten.svg` |
| `hilfsorganisation` | **keine Referenzdatei** | — |

Alle sieben belegten Farben liegen bereits in der `PALETTE` — keine Palettenerweiterung war
nötig. (`2.3` trägt zusätzlich `weiss` als Innenfläche; maßgeblich für `organizationColor` ist
`blau`.) Für `hilfsorganisation` gibt es in Kapitel 2 der lokalen Referenz keine Datei;
`organizationColor('hilfsorganisation')` **wirft** statt eine Farbe zu erfinden — dasselbe Muster,
das `baseDrawing` für nicht belegte `SymbolKind`-Werte schon verwendet.

## 5. Das Drei-Plätze-Modell der Stärkereihe

Die naheliegende Annahme — eine Reihe von `n` Kopfmarken zentriert sich mit festem Abstand um die
Mittelachse — ist **falsch**. Die Referenz misst stattdessen: **die waagerechte Reihe hat drei
feste Plätze bei `cx = 11, 16, 21`; der Stärkegrad bestimmt, welche davon belegt sind:**

- `trupp` → `[16]` (nur die Mitte)
- `gruppe` → `[11, 21]` (die äußeren zwei — **die Mitte bleibt frei**)
- `zug` → `[11, 16, 21]` (alle drei)
- `staffel` → kein waagerechter Platz, sondern ein senkrechter Stapel bei `cx 16`,
  `cyFromTop 1,5` und `5,5`, Gesamthöhe 7 mm

Eine zentrierende `row(count)`-Funktion hätte für `gruppe` `cx 13,5 / 18,5` ergeben — **2,5 mm
daneben, rund 7 SVG-Einheiten Abweichung bei 0,01 Toleranz** — und hätte `gruppe` mit drei statt
zwei Punkten belegt.

**Das Modell ist an elf Referenzdateien vermessen**, mit einem eigens geschriebenen
Bezier-fähigen Parser (nötig, weil Illustrator benachbarte Kreise zu Pfaden zusammenführt und die
Zahl der `<circle>`-Elemente in der Referenz irreführt):

| Grad | Belegdateien | Marken |
|---|---|---|
| `staffel` | `C.1.1_Löschstaffel.svg`, `C.1.8_Staffel Dekontamination von Personal.svg` | 2 senkrecht, `cx 16`, `cy 2,5`/`6,5` |
| `gruppe` | `C.1.2_Löschgruppe.svg`, `C.1.9_ABC-Erkundungsgruppe einer Feuerwehr.svg` | 2 waagerecht, `cx 11`/`21` |
| `zug` | `C.1.3_Löschzug einer Feuerwehr.svg`, `D.3.7_Zugführer der Feuerwehr.svg`, `E.1.18_Fachzug Führung-Kommunikation.svg`, `C.1.11_Gefahrstoffzug.svg` | 3 waagerecht, `cx 11`/`16`/`21` |
| `trupp` | `C.1.7_CBRN-Erkundungstrupp.svg`, `C.1.13_Flugdrohnentrupp Feuerwehr.svg`, `C.1.14_Drohnentrupp Feuerwehr.svg` | 1, `cx 16` |

(Alle Marken `r = 1,5`. Die eigenständigen Anzeigedarstellungen `5.4.1`–`5.4.4`, `r = 4`,
bestätigen dieselben Anzahlen unabhängig, sind aber selbst keine Kopfzonen.)

**Warum das ohne diese Vermessung unbemerkt geblieben wäre:** `matchFingerprint` vergleicht
ausschließlich das Primitiv mit `role: 'body'`. Kopfmarken tragen `role: 'head'` und werden vom
Fingerprint-Gate nie erfasst — eine falsche Reihengeometrie hätte also jedes automatische Gate
passiert. Deshalb tragen `strengths.test.ts` und `recipes.test.ts` eigene, an den `cx`-Werten
aus der Tabelle oben festgenagelte Zusicherungen, die diese Lücke schließen.

## 6. Die drei Kompositionsrezepte sind gegen die Referenz gegated

Die drei Rezepte (`C.1.1`, `C.1.2`, `D.3.7`) sind **nicht** nur gegen berechnete Werte getestet,
sondern per `matchFingerprint` gegen die Referenzdatei — die Fingerprints tragen je ein `rect`
mit der Körpergeometrie, das `PRECEDENCE` in `fingerprint.ts` auswählt:

| Rezept | Körper im Referenzartefakt | Layout-Vorhersage |
|---|---|---|
| `C.1.1_Löschstaffel.svg` | `rect` `1/9/31/29`, `fill #fa1919` | Stapel (Höhe 7) schiebt Körper von 6 auf 9 ✓ |
| `C.1.2_Löschgruppe.svg` | `rect` `1/6/31/26`, `fill #fa1919` | Reihe (Höhe 3) passt, Körper bleibt bei 6 ✓ |
| `D.3.7_Zugführer der Feuerwehr.svg` | `rect` `rot=45`, `3/5/29/31`, `fill #fa1919` | Spitze 5, Unterkante 31 ✓ |

Alle drei tragen `fills: ['#fa1919']` im Artefakt — eine unabhängige Bestätigung, dass
`feuerwehr → rot` korrekt ist (`matchFingerprint` selbst vergleicht nur Hüllen, keine Füllfarbe).

**Bekannte Grenze:** Die Kopfmarken sind in den Rezept-Referenzdateien größtenteils zu Pfaden
zusammengeführt (`curvedPaths: 1`) und deshalb über Fingerprints nicht erfassbar — die einzige
Ausnahme ist je ein separater `circle` in `C.1.1` (Hülle `14,5/5/17,5/8`, Mitte `16|6,5`) und
`C.1.2` (Hülle `19,5/2/22,5/5`, Mitte `21|3,5`), die unabhängig das Drei-Plätze-Modell aus
Abschnitt 5 bestätigen. Eine vollständige Gate-Abdeckung der Kopfmarken über Fingerprints ist
nicht möglich — deshalb der eigene Test aus Abschnitt 5.

## 7. Der Manifest-Scope und seine Grenze

`COVERAGE_MANIFEST.scope` (`packages/catalog/src/coverage-manifest.ts` über
`packages/schema`) ist:

```
['1', '2', '4.3.1', '5.4', 'C.1.1', 'C.1.2', 'D.3.7']
```

Gegenüber einem ursprünglich weiter gefassten Anspruch entfallen bewusst:
- **`'3'`** — der Slice setzt aus Kapitel 3 (Fähigkeiten Einsatzführung, Versorgung/Entsorgung/
  Logistik, Drohnen, Zweirad, temporär ortsfeste Strukturen — sieben Referenzdateien) **nichts**
  um. Das Kapitel zu beanspruchen, ohne etwas davon zu exportieren, wäre eine Falschaussage genau
  in dem Artefakt, das Falschaussagen verhindern soll.
- **`'5.1.1'`** und **`'5.7'`** — entfallen, siehe Abschnitt 2 (Fahrzeugkategorien,
  Verwaltungsstufen: nicht umgesetzt).

Was den verbleibenden Scope trägt: `'1'` acht Grundzeichen mit Fingerprint-Gate als
Manifest-Einträge; `'2'` sieben Organisationsfarben, je einzeln gegen `fills` im Artefakt belegt
(eigener Test, siehe Abschnitt 4); `'4.3.1'` das Piktogramm Brandbekämpfung, eigenständig
konstruiert mit glatten Millimeterwerten, nicht aus der Referenz übernommen; `'5.4'` die vier
Stärkegrade (Abschnitt 5); `'C.1.1'`, `'C.1.2'`, `'D.3.7'` die drei Rezepte (Abschnitt 6), als
Manifest-Einträge geführt.

**Bekannte Grenze:** Die `entries` des Manifests modellieren nur Katalogeinträge und Rezepte
(`CoverageKind = 'catalog-entry' | 'composition-recipe'`). Die Abdeckung von `'2'`, `'4.3.1'` und
`'5.4'` steckt in deren eigenen Testdateien, nicht in eigenen Manifest-Einträgen. Das
abzubilden bräuchte eine weitere `CoverageKind` und damit eine Schemaänderung — bewusst nicht in
diesem Slice umgesetzt.

## 8. Das Piktogramm folgt der Körpermitte

`compose()` (`packages/core/src/compose.ts`) kann den Körper eines zusammengesetzten Zeichens
senkrecht verschieben (Kopfzone schafft Platz) oder verkleinern (gedrehtes Quadrat). Ein
Piktogramm, das an einer festen Referenzstelle bliebe, während sich der Körper darunter bewegt,
säße an der falschen Stelle.

**Vermessen an den fünf geraden Teilpfaden der beiden Rezeptdateien mit Piktogramm:**

| Datei | Körper (Hülle Y) | Körpermitte | Piktogrammlinie |
|---|---|---|---|
| `C.1.2_Löschgruppe.svg` | 6…26 | 16 | `y = 16` |
| `C.1.1_Löschstaffel.svg` | 9…29 | 19 | `y = 19` |

Die Referenz verschiebt das Piktogramm also **exakt um dieselben 3 mm**, um die der Stapel
(`C.1.1`) den Körper nach unten schiebt — die tragfähige Bezugsgröße ist die **Körpermitte**, nicht
die Oberkante: bei `D.3.7` (Körper wird verkleinert statt verschoben) wandert die Oberkante von 1
auf 5, die Mitte aber nur von 16 auf 18 — eine Regel über die Oberkante wäre dort falsch gewesen.

`compose()` berechnet deshalb `pictogramShiftMm = centerYMm(placedBody) - centerYMm(body)` und
verschiebt jedes Piktogramm-Primitiv um diesen Betrag (`shiftY`, `packages/core/src/bounds.ts`).
Weil `matchFingerprint` nur `role: 'body'` vergleicht und diese Verschiebung nie über das
Fingerprint-Gate abgesichert wäre, trägt `recipes.test.ts` einen eigenen, an den obigen Werten
festgenagelten Test (`y = 16` für `C.1.2`, `y = 19` für `C.1.1`).

## Quellenverweis

Die vollständige Herleitung inklusive Diskussion verworfener Alternativen stand im
Session-Ledger `.superpowers/sdd/2026-08-04-einsatzzeichen-core-slice/progress.md` (Rulings 12,
16–22, Stand dieses Slice). Dieser Pfad liegt unter dem per `.gitignore` ausgenommenen
`.superpowers/`-Scratch-Verzeichnis und kann jederzeit aufgeräumt worden oder nicht mehr vorhanden
sein — **dieses Dokument hier, nicht der Ledger, ist die dauerhafte, eingecheckte Quelle** für die
Teile, die den Katalog inhaltlich tragen.
