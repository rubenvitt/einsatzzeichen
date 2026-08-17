# Anhang E zerfällt in zwei Hälften — E.1 ist baubar, E.2 ist blockiert

> Entscheidungsnotiz · 11. August 2026 · Zuschnitt für LFH-416

Die Aufgabe verlangt vor Beginn eine Slice-Spec, die den Schnitt begründet und die Zeichenzahl je
Teilslice nennt. Sie nennt die Trennung entlang E.1/E.2 als naheliegend, aber ungeprüft. Diese
Notiz prüft sie: **die Trennung stimmt, aber nicht aus dem Grund, aus dem sie naheliegt.** Nicht
„Einheiten gegen Fahrzeuge" trennt die 68 Zeichen, sondern die Verfügbarkeit ihrer Grundzeichen.

## 1. Was gemessen wurde

Die Körperform jedes Zeichens ist die äußere Form seiner Ebene `Flächige_Fülung` — der weiße Rand
des Grundzeichens, bevor Organisationsfarbe, Kopfzone und Marken darauf liegen. Sie wurde für alle
68 E-Dateien extrahiert, auf eine Nachkommastelle normiert und gegen die 14 Referenzdateien des
Kapitels 1 gehalten. Die Zahlen unten sind mit `grep` gegen `taktische-zeichen/` nachvollziehbar.

## 2. Der Befund: sieben Körperformen, zwei davon im Katalog

| Körperform | Zeichen | Grundzeichen | im Katalog |
|---|---|---|---|
| `1.1` Taktische Formation | 36 — E.1.1 bis E.1.36 | `formation` | **ja** |
| `1.7` Gebäude | 1 — E.1.37 | `building` | **ja** |
| `1.3` Landfahrzeug | 20 — E.2.1 bis E.2.21 ohne E.2.15 | `vehicle-land` | nein |
| Wasserfahrzeugrumpf | 5 — E.2.27 bis E.2.31 | `vehicle-water` | nein |
| Anhängerrumpf | 4 — E.2.22 bis E.2.25 | keins | nein |
| Wechselladerrumpf | 1 — E.2.15 | keins | nein |
| Hochkantrechteck | 1 — E.2.26 | keins | nein |
| **Summe** | **68** | | |

Belege:

```bash
cd taktische-zeichen
grep -l 'rect x="2.835" y="17.008" width="85.04" height="56.693"' E.*.svg | wc -l   # 36  Formation
grep -l 'v57.402h85.04V16.3' E.*.svg | wc -l                                        # 20  Landfahrzeug
grep -l 'h84.981c0,23.467'   E.*.svg | wc -l                                        #  5  Wasserfahrzeug
grep -l 'v57.402h76.536'     E.*.svg | wc -l                                        #  4  Anhänger
```

`E.1.37_Ortsverband.svg` trägt das Polygon aus `1.7_Gebäude.svg` zeichengleich. Der
Landfahrzeugrumpf der 20 E.2-Zeichen ist mit `1.3_Landfahrzeug.svg` identisch bis auf eine
Rundungsstelle (`45.355` gegen `45.354`) — dasselbe Muster, das schon bei `J.3.14`/`J.3.15` als
Scheinunterschied auftrat. Der Wasserfahrzeugrumpf entspricht `1.5_Wasserfahrzeug.svg` in der Form,
sitzt aber 1 mm höher und ist 0,02 mm schmaler; das ist Vermessungsarbeit im Teilslice, keine
zweite Form.

> **Nachtrag vom 17. August 2026 (Teilslice E-c, LFH-442).** „`E.1.37_Ortsverband.svg` trägt das
> Polygon aus `1.7_Gebäude.svg` zeichengleich" gilt **nur für die Füllebene** — dort ist der
> Punktezug byteidentisch, und `grep -l` darauf trifft genau zwei der 661 Dateien. Für die
> **Strichebene** stimmt es nicht: `1.7` führt dort drei Teilpfade (Außenkontur, Innenrechteck ab
> y 29,764 Einheiten, getrennt geschlossenes Dachdreieck mit Basis y 28,346) und zieht damit eine
> waagerechte Traufkante bei y 10,000…10,500 mm; E.1.37 führt zwei Teilpfade (Außenkontur,
> durchgehende Hauskontur mit Traufknick bei 28,798 Einheiten) und hat diese Kante nicht. Der
> Katalogkörper `BODIES.building` zeichnet ebenfalls keine Traufkante und folgt damit E.1.37, nicht
> `1.7`. Die Restdifferenz der Außenkontur (74,410 gegen 74,409 Einheiten = 0,00035 mm) ist
> dasselbe Rundungsrauschen, das diese Notiz für 1.3/E.2 dokumentiert. Diese Notiz hat die
> Körperform aus der **Füllebene** bestimmt (Abschnitt 1) — für ihre Aussage über den Zuschnitt
> ändert die Berichtigung nichts, für die Bauart von E.1.37 schon. Die Messung steht in
> [`2026-08-17-anhang-e-c.md`](./2026-08-17-anhang-e-c.md). Die Aussage bleibt stehen, damit
> sichtbar ist, dass sie zur Hälfte zu weit ging.

**`BODIES` in [`packages/catalog/src/base-symbols.ts`](../../packages/catalog/src/base-symbols.ts)
trägt acht der 14 `SymbolKind`-Werte.** Es fehlen genau `vehicle-land`, `vehicle-air`,
`vehicle-water`, `area`, `event` und `spontaneous-helper` — die „sechs fehlenden Grundzeichen" aus
Posten 1 von LFH-424. Zwei davon braucht Anhang E.

## 3. Die Folge: der Schnitt ist eine Abhängigkeitsgrenze

**E.1 (37 Zeichen) ist vollständig auf heutigen Mechanismen baubar.** Formation und Gebäude stehen
im Katalog, die Kopfzonen der Stärkegrade sind vermessen — `strengths.ts` nennt `E.1.18` selbst als
eine seiner Belegdateien für `zug` —, und das Textprimitiv aus dem Slice vom 9. August trägt die
Kürzel. Alle 37 Zeichen sind typografisch: jedes trägt mindestens vier Glyphen, das Kürzel `THW`
steht in jedem als Fußzone.

**E.2 (31 Zeichen) ist auf keinem einzigen Zeichen baubar.** Es fehlen zwei Grundzeichen aus
Kapitel 1 und die Fahrwerksmarken aus Kapitel 5.1, die die Fahrzeugkategorie tragen. Die 20
Landfahrzeuge teilen sich **einen** Rumpf und unterscheiden sich in der Strichebene durch fünf
verschiedene Fahrwerke — das ist die Kategorie, nicht das Zeichen; zwei davon sind mit
`5.1.1.1_Kfz_Kategorie 1` und `5.1.1.2_Kfz_Kategorie 2` mengengleich (Abschnitt 6). Kapitel 5.1
liegt mit 23 Referenzdateien vollständig unabgedeckt vor, darunter
`5.1.1.8_Kraftfahrzeug_straßenfähig_Wechsellader.svg` und `5.1.2.1` bis `5.1.2.5` für die
Anhänger — also genau die Vorlagen für die beiden Sonderrümpfe der Tabelle oben.

Das deckt sich mit LFH-424 Posten 4, der die Fahrzeugkategorien ausdrücklich als Voraussetzung für
`C.2`/`E.2`/`N` benennt. **Die Abhängigkeit ist damit belegt, nicht vermutet.**

## 4. Der Zuschnitt: sechs Teilslices

Die Grenzen folgen der Kapitelreihenfolge, liegen aber dort, wo die Bauart wechselt.

### Sofort baubar

| Teilslice | Abschnitte | Zeichen | Bauart |
|---|---|---|---|
| **E-a** Bergungs- und Fachgruppen | E.1.1 – E.1.16 | 16 | Formation, Kopfzone, ein bis zwei Kürzel. Ausnahme: E.1.3 ohne Kopfzone. |
| **E-b** Züge, Zugtrupps, Logistik | E.1.17 – E.1.28 | 12 | Enthält die drei Zeichen mit Zusatzgeometrie (E.1.18, E.1.19, E.1.24) und E.1.21 ohne Kopfzone. |
| **E-c** Trupps, Teams, Ortsverband | E.1.29 – E.1.37 | 9 | Enthält als einziges Zeichen des Anhangs den Gebäudekörper (E.1.37). |

> **Nachtrag vom 17. August 2026 (Teilslice E-b, LFH-441).** Die Angabe „die drei Zeichen mit
> Zusatzgeometrie (E.1.18, E.1.19, E.1.24)" in der E-b-Zeile ist **für E.1.18 falsch**. Seine
> Strichebene trägt den Rahmenpfad, eine deckungsgleiche Rahmendublette (Differenz 0,001 Einheiten
> = 0,00035 mm) und eine gewöhnliche `zug`-Kopfreihe bei cy 9,921 — sonst nichts. Zusatzgeometrie
> tragen nur **E.1.19 und E.1.24**: je drei Marken r 1,5 mm bei cy 8,100 mm, zeichenidentisch mit
> der `zug`-Kopfreihe und um 4,600 mm nach unten versetzt. Diese Notiz hat die Zusatzgeometrie
> nicht vermessen, sondern aus dem Vorkommen von Zusatzpfaden geschlossen; die Messung steht in
> [`2026-08-17-anhang-e-b.md`](./2026-08-17-anhang-e-b.md). Die Aussage bleibt hier stehen, damit
> sichtbar ist, dass sie es war.

### Blockiert auf LFH-424

| Teilslice | Abschnitte | Zeichen | Fehlt vorher |
|---|---|---|---|
| **E-d** Landfahrzeuge | E.2.1 – E.2.21 | 21 | `vehicle-land`, Fahrwerksmarken aus 5.1.1 |
| **E-e** Anhänger und Sonderkörper | E.2.22 – E.2.26 | 5 | Anhängerrumpf (5.1.2), Wechselladerrumpf (5.1.1.8), Körperform von E.2.26 |
| **E-f** Wasserfahrzeuge | E.2.27 – E.2.31 | 5 | `vehicle-water` |

E-a bis E-c ergeben 37, E-d bis E-f ergeben 31. **Die Reihenfolge innerhalb der baubaren Hälfte ist
frei** — alle 37 Zeichen stehen auf Mechanismen, die bereits stehen; keiner der drei Teilslices
erzeugt etwas, das ein anderer braucht.

## 5. Drei Entscheidungen, die der Zuschnitt trifft

**Typ A ist eine eigene ID, keine Variante.** Sieben Dateien tragen „Typ A" im Namen
(`E.1.9`, `E.1.10`, `E.1.11`, `E.1.12`, `E.1.15`, `E.1.16`, `E.1.22`); **kein Typ B existiert im
gesamten Referenzbestand** (`ls taktische-zeichen | grep -ci "typ b"` → 0). Es gibt damit keine
Variantenachse zu modellieren. `DepictionVariant` trägt Alternativdarstellungen *desselben*
Zeichens — eine Fachgruppe Typ B wäre eine andere Einheit, nicht eine andere Zeichnung derselben.
Das folgt der D.4-Linie: bei n = 1 (hier: n = 0) ist der Mechanismusausbau verfrüht. Sollte die
Baseline später Typ B nachliefern, ist das ein Hinzufügeschritt.

**Damit hängt Anhang E nicht an LFH-408.** Der Ledger-Schlüssel-Umbau adressiert Einträge, deren
Implementierungen sich nur durch die Variantenrolle unterscheiden. Anhang E erzeugt **68 IDs mit je
einer `primary`-Darstellung** und keine einzige `alternative` — die Schlüsselform trifft ihn nicht
härter als jede andere Zeile. Der Umbau bleibt richtig und dringend, ist aber für E keine
Vorbedingung, sondern eine Migration, die E gleich mitnimmt.

**Die Kürzel müssen am Bild abgelesen werden.** Alle Glyphen liegen als Pfade vor, in Kurven
umgewandelt; aus der Datei ist der Buchstabe nicht auslesbar. Der Weg ist derselbe wie bei D.3
(`docs/decisions/2026-08-09-anhang-j-ist-typografisch.md`): Kürzel aus dem Referenzbild ablesen,
Bedeutung aus dem Dateinamen belegen, beides in der Sichtprüfung gegenhalten. Jeder Teilslice-Task
plant diesen Schritt vor der ersten Zeile Kode ein.

## 6. Was offen bleibt

- **Körperform von E.2.26** (Trinkwasseraufbereitungsanlage, hochkantes Rechteck 26 × 28 mm) hat im
  gesamten Bestand keine zweite Verwendung und kein Kapitel-1-Vorbild. Zu klären in E-e.
- **Die Fahrwerkszuordnung ist zur Hälfte belegt und zur Hälfte offen.** Vergleicht man die
  Teilpfade der Strichebene jedes E.2-Landfahrzeugs mit denen von `1.3_Landfahrzeug.svg`, bleibt
  genau die Fahrwerksmarke übrig. Diese Restmenge ist bei sieben Zeichen **mengengleich** mit der
  von `5.1.1.1_Kfz_Kategorie 1` (E.2.1, E.2.2, E.2.5, E.2.14, E.2.16, E.2.17, E.2.20 — alle heißen
  „straßenfähig") und bei sieben weiteren mit der von `5.1.1.2_Kfz_Kategorie 2` (E.2.3, E.2.10,
  E.2.12, E.2.13, E.2.18, E.2.19, E.2.21).

  Aus dieser zweiten Gruppe heißen `E.2.12` und `E.2.13` „geländegängig", die übrigen
  „geländefähig" — bei identischer Marke. Die restlichen sieben Landfahrzeuge (E.2.4, E.2.6, E.2.7,
  E.2.8, E.2.9, E.2.11, E.2.15) sind mit **keiner** 5.1.1-Datei mengengleich; die fünf mit je
  sieben Teilpfaden zerfallen ihrerseits in zwei verschiedene Formen, wobei `E.2.11`
  („geländefähig") die Form von `E.2.6` und `E.2.8` („geländegängig") trägt. E-d klärt diese
  Zuordnung am Referenzbild, bevor die erste Marke entsteht — welche der beiden Angaben trägt, ist
  nicht aus den Dateinamen entscheidbar.
- **`hilfsorganisation` bleibt unberührt.** Anhang E braucht nur `blau` (THW) und `orange` — letzteres
  für `E.2.6`, das als einziges Zeichen des Anhangs `#fa8c00` führt. Beide Farben stehen in
  `organizations.ts`. Posten 3 von LFH-424 ist für E kein Blocker.

## 7. Reviewgrenze

Diese Notiz trifft **keine fachliche Aussage** über Anhang E. Sie stellt fest, welche Grundzeichen
seine Zeichen tragen und welche davon der Katalog hat. Bedeutung, Verwechslungsfreiheit und
einsatztaktische Eignung der 68 Zeichen sind davon unberührt und bleiben — wie die 290 bereits
offenen Fachreviews — einer entsprechend fachkundigen Person vorbehalten.
