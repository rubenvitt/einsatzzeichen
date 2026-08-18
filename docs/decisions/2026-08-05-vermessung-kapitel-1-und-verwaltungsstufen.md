# Vermessung: die sechs fehlenden Grundzeichen, Kapitel 3 und die Verwaltungsstufen

> Entscheidungsnotiz · 5. August 2026 · Vermessung am lokalen Referenzbestand

## Zweck dieses Dokuments

Diese Notiz hält Messwerte fest, die **außerhalb** eines laufenden Slice entstanden sind: bei der
Vorbereitung eines Umsetzungsplans, der als Kandidat liegen geblieben ist
(`docs/superpowers/plans/2026-08-05-kennzahlenartefakt-und-formvergleich.md`, nicht freigegeben).

Die Zahlen sind trotzdem hier eingecheckt, weil sie zwei Fragen beantworten, die jeder
Katalogausbau erneut stellen wird — „warum fehlen sechs Grundzeichen" und „wie sind die
Verwaltungsstufen aufgebaut" — und weil eine Antwort, die nur in einem nicht freigegebenen Plan
oder im gitignorierten `.superpowers/` steht, verschwindet, sobald aufgeräumt wird. Dieselbe
Begründung wie bei `2026-08-04-einsatzzeichen-core-slice-messwerte-und-umfang.md`.

Alle Angaben sind **abgeleitete Kennzahlen** — Millimeterwerte, Hüllen, Strichstärken,
Dateinamen, Kommandobuchstaben. Keine Pfaddaten und keine Geometrie aus den Referenzdateien
selbst wurden übernommen oder eingecheckt (`taktische-zeichen/`, 661 SVGs, nie eingecheckt,
siehe `.gitignore`).

## 1. Der tragende Befund: Erfolgskriterium 1 ist nicht durch Vermessung schließbar

Die Slice-1-Spec verlangt in Abschnitt 9 für Kapitel 1–3 **Geometrietreue, maschinell per
Fingerprint geprüft**, und begründet das so:

> „Kapitel 1–3 sind Rechtecke, Kreise und Geraden auf einem Millimeterraster — exakt zu treffen
> ist dort billig."

Das trifft für die acht umgesetzten Grundzeichen zu. Für die restlichen und für den größten Teil
von Kapitel 3 ist es **sachlich falsch**. Nachgemessen:

| Datei | Was die Referenz zeichnet | belegbar? |
|---|---|---|
| `1.3 Landfahrzeug` | Rechteck, dessen Oberkante eine kubische Kurve ist: Ecken `(1\|5,75)`/`(31\|5,75)`, Scheitel `(16\|8)` | Hülle ja, Form nein |
| `1.4 Luftfahrzeug` | Kurvenkontur; Mittellinienhülle `1/8/31/23`, Strichstärke 0,5 | Hülle ja, Form nein |
| `1.5 Wasserfahrzeug` | Kurvenkontur; Mittellinienhülle `1/9/31/24`, Strichstärke 0,5 | Hülle ja, Form nein |
| `1.9 Gebiet` | freie Kontur; Extrema `1,52/3,23/31/28,322` — **keine glatten Entwurfsmaße** | **nein** |
| `1.14 Spontanhelfer` | achtpunktige Kurvenrosette; Mittellinienhülle `2/2/30/30`, Strichstärke 0,5 | Hülle ja, Form nein |
| `1.13 Ereignis` | in Fläche umgewandelter Strich, sechs Punkte | **ja** — siehe Abschnitt 2 |

„Hülle ja, Form nein" heißt: die Mittellinienhülle ist aus dem Außen-/Innenring-Paar sauber
ableitbar (bei `1.4`, `1.5`, `1.14` mit Strichstärke exakt 0,5 mm), aber **eine Hülle bestimmt
keine Form** — dieselbe Lehre wie bei Ruling 17 des Vorgänger-Slice. Wer diese Zeichen bauen
will, muss die Kurven selbst autorieren. Das ist zulässig (Spec-Abschnitt 9 sieht eigenständige
Geometrie für Kapitel 4/5 und die Anhänge ausdrücklich vor), aber es ist für **Kapitel 1** eine
Aufweichung der Treueentscheidung und braucht eine eigene Festlegung.

`1.9 Gebiet` fällt auch damit heraus: seine Extrema liegen nicht auf glatten Entwurfsmaßen, es
gibt also keinen Sollwert, gegen den eine eigene Zeichnung gegatet werden könnte.

> **Nachtrag vom 18. August 2026 (LFH-424).** Die Tabelle dieses Abschnitts ist in jeder Zahl
> richtig und in ihrer Spalte „belegbar?" **widerlegt**. Alle sechs Grundzeichen stehen inzwischen
> im Katalog, jedes mit vermessener Geometrie. Der Grund, den keine der beiden Notizen kannte: die
> Ebene `Flächige_Fülung` trägt bei 1.3, 1.4, 1.5 und 1.9 die **Mittellinie verbatim** — sie war
> nur vom damaligen Extraktor nicht lesbar, der für einen Kurvenpfad `null` liefert.
>
> Insbesondere `1.9 Gebiet` ist ein Zehneck mit zehn Eckradien: die Extrema
> 1,5199/3,2298/30,9993/28,3237 liegen auf Eckrundungen und sind deshalb keine Entwurfsmaße. Die
> zehn Ecken liegen auf ganzen Millimetern, die zehn Radien auf einem 0,6-mm-Raster. Und
> „Form nein" für 1.4 und 1.5 ist ebenso widerlegt: es sind Halbkreise mit r = 15 um (16|23) bzw.
> (16|9) in der üblichen Zwei-Kubiken-Näherung. Belege in
> [`2026-08-18-grundlagen-restpunkte.md`](./2026-08-18-grundlagen-restpunkte.md), Abschnitte 1
> und 2.

### Kapitel 3 ebenso

| Datei | gemessene Form | glatte Entwurfsmaße? |
|---|---|---|
| `3.1 Fähigkeiten Einsatzführung` | `rect` `0,8/5,8/31,2/8,2` | nein |
| `3.2 Personen mit Sonderfunktionen` | `rect` `10/7,75/22/8,25` (Strich `y = 8`, `x` 10…22) | teilweise |
| `3.3 Fähigkeiten Versorgung/Entsorgung/Logistik` | `rect` `0,8/23,6/31,2/26` | nein |
| `3.6 Grundzeichen Drohne` | nur Hülle `4/10/28/22` | Hülle ja, Form nein |
| `3.7`, `3.8 Zweirad` | keine vermessbare Form (ein Pfad, Kurven) | nein |
| `3.9 temporär ortsfeste Strukturen` | nur Hülle `1,837/1,671/30,162/14,19` | nein |

**Konsequenz:** Erfolgskriterium 1 der Slice-1-Spec („Alle Grundelemente aus Kapitel 1–3 … bestehen
den Fingerprint-Gate") lässt sich mit Vermessung allein **nicht** erfüllen. Die Slice-3-Spec
behandelt Kapitel 3 folgerichtig als „kein Owner, Non-Scope".

## 2. `1.13 Ereignis` ist rekonstruierbar — per Clusterung, nicht per Punktreihenfolge

Die Entscheidungsnotiz zu Slice 1 (Abschnitt 1b) hält fest, `1.13` sei „mit dem heutigen Gate
nicht belegbar", weil sein Fingerprint als einzige Form die **Strich-Hülle**
`3,792/6,862/28,207/25,451` trägt und nicht die Mittellinienhülle `4/7/28/25`. Das war für den
damaligen Extraktor richtig. Mit einer zusätzlichen Kennzahlenart ist es lösbar:

Die sechs Umrisspunkte lassen sich zu drei Ecken zusammenfassen, indem man sie **clustert** und
je Cluster den Schwerpunkt nimmt. Gemessen, in Millimetern:

| Clusterschwelle | Cluster (Größen) | Zentren | kleinster Clusterabstand |
|---|---|---|---|
| 0,6 mm | 4 (1, 2, 1, 2) | — (Paarung fehlgeschlagen) | 0,902 mm |
| **1,0 mm** | **3 (2, 2, 2)** | **(16\|25) · (4\|7) · (27,999\|7)** | **21,633 mm** |
| 1,5 mm | 3 (2, 2, 2) | dieselben | 21,633 mm |
| 2,0 mm | 3 (2, 2, 2) | dieselben | 21,633 mm |

Bei 1,0 mm Schwelle liegen die Cluster **21-mal weiter auseinander als die Schwelle** — das
Ergebnis ist gegen die Schwellenwahl robust. `1.13 Ereignis` ist der **offene** Polyzug
**(4|7) → (16|25) → (28|7)** bei 0,5 mm Strichstärke, Hülle `4/7/28/25`.

**Warum das Ableitung und nicht Kopieren ist:** Es ist dieselbe Mittelung, die `deriveRing`
für Ringpaare bereits ausführt (Abschnitt 3 der Slice-1-Notiz). Die **Punktreihenfolge** im
Umriss trägt dabei nichts bei — sie hängt davon ab, an welcher Ecke der Illustrator-Export den
Pfad beginnt (bei `1.13` am Scheitel, nicht am Ende), und lässt sich nicht allgemein aus dem
Index ableiten. Deshalb Clusterung.

**Pflicht bei einer Umsetzung:** Der Polyzug ist **offen**. Ein geschlossener hätte dieselbe
Hülle *und* dieselben Ecken — kein Gate fängt den Unterschied. Er muss von Hand am Snapshot
geprüft werden.

**Korrektur zur Slice-1-Notiz:** Sie nennt für `1.13` die `minX`-Abweichung (0,590 Einheiten).
Die größere ist `maxY` mit rund 1,28 Einheiten. Die Schlussfolgerung dort bleibt richtig, die
Zahl war nur die kleinere von zwei.

> **Nachtrag vom 18. August 2026 (LFH-424).** Zwei Angaben dieses Abschnitts sind nachzuziehen.
>
> 1. **Es sind vier Kanten, nicht zwei.** Selbst ausgeführt: minX 0,5896 / minY 0,3912 /
>    maxX −0,5868 / maxY −1,2784 Einheiten. Beide Notizen nennen je eine und beide sind
>    unvollständig.
> 2. **Die Pflicht „muss von Hand am Snapshot geprüft werden" ist eingelöst — durch ein Gate.**
>    Der Satz „ein geschlossener hätte dieselbe Hülle *und* dieselben Ecken — kein Gate fängt den
>    Unterschied" gilt für **Mittellinien**vergleiche, nicht allgemein. Die analytische
>    Strichaufweitung des offenen Polyzugs liefert 3,7920/6,8613/28,2080/25,4507 und trifft den
>    eingecheckten Kennwert auf 0,0029 Einheiten; die des geschlossenen liefert
>    3,5329/6,7500/28,4671/25,4507 und liegt damit 0,73 Einheiten daneben.

## 3. Die Verwaltungsstufen `5.7` sind Sterne auf einer zentrierten Reihe

Vermessen an allen sechs Dateien. Die Marke ist immer gleich: **5,446 × 6 mm**, senkrechte Mitte
`cy = 16`. Der Grad bestimmt die x-Mitten:

| Datei | Grad | Marken (`cx`) |
|---|---|---|
| `5.7.1_Gemeinde.svg` | Gemeinde | `[16]` |
| `5.7.2_Kreis_Landkreis.svg` | Kreis / Landkreis | **`[10, 22]`** |
| `5.7.3_Bezirk.svg` | Bezirk | `[10, 16, 22]` |
| `5.7.4_Bundesland.svg` | Bundesland | `[7, 13, 19, 25]` |
| `5.7.5_Nationalstaat.svg` | Nationalstaat | `[4, 10, 16, 22, 28]` |
| `5.7.6_Europäische Union.svg` | Europäische Union | zweireihig, `cx` 7/13/13/19/19/25 — Reihenaufteilung noch zu vermessen |

**Das Modell:** eine um `x = 16` zentrierte Reihe mit **6 mm Abstand**. Das trifft `n = 1`, `3`,
`4` und `5` exakt. **`n = 2` ist die Ausnahme:** `[10, 22]` statt der zentrierten `[13, 19]` — die
Mitte bleibt frei und der Abstand ist 12 mm.

**Das ist dieselbe Ausnahme wie beim Stärkegrad `gruppe`** (Slice-1-Notiz, Abschnitt 5: `gruppe →
[11, 21]`, Mitte frei, statt der zentrierten `13,5/18,5`). Zwei unabhängige Zeichenfamilien, ein
gemeinsames Muster: **bei zwei Marken rücken sie nach außen.** Wer hier `row(n)` mit festem
Abstand annimmt, verfehlt `5.7.2` um 3 mm je Marke — rund 8,5 SVG-Einheiten bei einer Toleranz
von 0,01.

Die Marken sind **keine Rechtecke**, sondern sechsstrahlige Sterne aus gekreuzten Strichen
(`5.7.1` als Polygon mit 19 Punkten). Ein Rechteck-Test auf ihre Teilpfade ergibt **0 von n**.

> **Nachtrag vom 18. August 2026 (LFH-424).** Dieser Abschnitt ist in jeder Zahl richtig und in
> seiner **Überschrift** falsch: er vermisst nicht die Kopfmarke einer Verwaltungsstufe, sondern
> die **Eigendarstellung** 5.7.x — ein Zeichen ohne Körper, das sich zur Kopfzone verhält wie
> 5.4.1 bis 5.4.4 zur Stärkekopfzone.
>
> Die Kopfmarken stehen in acht Dateien, die diese Notiz nicht nennt: `D.3.1`, `D.3.3`, `D.3.4`
> und `D.4.1` bis `D.4.5`. Zwei der drei tragenden Zahlen sind dort andere — Markenhülle
> **3,7137 × 4,0001** statt 5,4458 × 6,0004, Teilung **5** statt 6, dazu Zonenoberkante y = 0
> statt `cy = 16`. Belegt sind nur n = 2 (`[11, 21]`), n = 5 (`[6, 11, 16, 21, 26]`) und n = 6
> (dreireihig); `gemeinde`, `bezirk` und `bundesland` haben in Kopfform **überhaupt keine
> Referenz**. Deshalb bleiben die Verwaltungsstufen auch nach LFH-424 offen, und `validateSpec`
> lehnt `spec.administrativeLevel` seither ab, statt sie still zu verschlucken.
>
> Zwei Verwechslungsbefunde gehören dazu: die Kopfmarken der Stufe `kreis` liegen auf denselben
> x-Werten wie der Stärkegrad `gruppe` und in einer überlappenden Zone (Unterschied nur die
> Markenform), und dieselbe 5.7-Sternform steht in den vier Dateien
> `5.8.7_Beispiel_Schneiend_*` als Schneefallstärke — dort bei cy 26,011 und mit Teilung 8.
> Vollständige Messwerte in
> [`2026-08-18-grundlagen-restpunkte.md`](./2026-08-18-grundlagen-restpunkte.md), Abschnitt 6.

## 4. Der Extraktionsbestand: zwei Zahlen, die vor jeder Planung nötig sind

**Kommando-Alphabet des gesamten Referenzbestands:** `C H L M S V Z c h l s v`. Also kubische
Kurven und Geraden — **kein `Q`, kein `T`, kein Bogenkommando `A`** (0 von 661 Dateien). Ein
Pfadparser für diesen Bestand braucht nur kubische Kurven; `A`/`Q`/`T` sollte er **ablehnen**
statt zu nähern, damit ein künftiges Referenz-Update auffällt.

**Wie viele Dateien welche Extraktor-Erweiterung freischaltet** — gemessen, nicht geschätzt:

| Erweiterung | Kandidaten nach Struktur | davon tatsächlich verwertbar |
|---|---|---|
| Hülle je Teilpfad statt Sammelhülle, mit Rechteck-Test | 44 | **6** |
| Bezier-exakte Hüllen für Kurvenpfade (Paar Füllpfad + Umrisspfad) | 9 | 4 mit glatten Werten (`1.4`, `1.5`, `5.8.7.2`, `J.4.5`) |

Die erste Zeile ist die wichtigere Warnung: **von 44 strukturellen Kandidaten sind nur 6
tatsächlich n achsparallele Rechtecke.** „Geradlinig" ist nicht „achsparallel" — genau der
Unterschied, an dem Ruling 16 des Vorgänger-Slice hing (91 von 150 Ringen falsch). Eine Planung,
die auf der Strukturzahl 44 aufbaut, plant 38 Dateien ein, die sie nicht bekommt.

## 5. Zwei kleinere Befunde am Bestand

**Erfolgskriterium 4 der Slice-1-Spec ist nicht erfüllt und war nirgends dokumentiert.** Es
verlangt: „Das Coverage-Manifest ist über `(sourceId, variant)` eindeutig keyfähig; alle **31**
Varianten-Dateien haben einen Slot." Die Schlüsselform gibt es (`entryKey`), die Slots nicht:
`COVERAGE_MANIFEST.entries` trägt 11 Einträge, **alle mit `variant: 'primary'`**. Im Unterschied
zu den übrigen Lücken des Vorgänger-Slice ist diese in keinem Dokument vermerkt. Gezählt: 31
Dateien mit Suffix `_Alternative.svg` oder `_2.svg` (28 bzw. 3).

**`noUncheckedIndexedAccess` und `exactOptionalPropertyTypes` kosten genau drei Fehler.** Gemessen
am Stand `a1d5add`: zwei in `packages/cli/src/scan/extract.ts` (Polygon-Punktschleife, die
vorhandene `Number.isFinite`-Wache greift nur zu spät) und einer in
`packages/schema/src/provenance.test.ts` (Indexzugriff auf `depictions`). Das Abschlussreview des
Vorgänger-Slice hat diese Nachrüstung als „billigste Typsicherheitsverbesserung, die zu haben
ist" empfohlen (Befund I-5); die Zahl belegt es.

## Quellenverweis

Die Task-Struktur, die auf diesen Messwerten aufbaut, liegt als **nicht freigegebener Kandidat**
in `docs/superpowers/plans/2026-08-05-kennzahlenartefakt-und-formvergleich.md`. Der Statuskasten
dort nennt die zwei Überschneidungen mit der laufenden Slice-Reihenfolge, die vor einer Freigabe
aufzulösen sind. **Dieses Dokument, nicht jener Plan, ist die dauerhafte Quelle für die Zahlen.**
