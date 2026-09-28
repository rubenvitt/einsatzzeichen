# Bewegung (5.2), Linien und Grenzen (2.14–2.20) als parametrisierte Bausteine

> Stand: 28. September 2026
> Status: **Vorlage, Entscheidung des Eigentümers offen.** Vorbereitet zu LFH-566 (Initiative A,
> Zeichen-Grammatik, LFH-559). Umgesetzt ist, was das Kennzahlenartefakt belegt. Die offenen
> Fragen stehen in Abschnitt 5, jeweils mit Empfehlung.
> Bezug: `docs/decisions/2026-09-13-grammatik-motor-und-paketschnitt.md` (Scope),
> `docs/decisions/2026-09-20-zonenmodell-als-daten.md`,
> `docs/decisions/2026-09-28-lfh-565-kapitel-5-8-bausteine.md` (Frage 9)

## 1. Auftrag

Pfeile und Linien sollen parametrisierte Bausteine werden: 5.2.1 bis 5.2.6 und 2.14 bis 2.20.
Anders als bei allen bisherigen Bausteinen hat ihre Geometrie keine feste Ausdehnung. Richtung,
Länge, Stützpunkte und die Anbindung an ein Grundzeichen sind Parameter. Verlangt sind je Baustein
ein Parametersatz, eine Zone oder Anbindung und eine Regel. Das Spec-Feld gehört in die
API-Initiative (LFH-577). Die Ausgabekanäle ändern sich nicht, weil sie nur `Drawing` verarbeiten.

## 2. Was gebaut ist

- `packages/schema/src/parametric.ts`: die Typen. `MovementId` und `LineId` mit ihren
  Wertelisten, `PathParameters` als Verlauf, `MovementParameters` mit optionaler Anbindung,
  `LineParameters` mit optionaler Stärke, `ParametricBlock` für die Tabelle.
- `packages/core/src/geometry/parametric.ts`: `movementDrawing` und `lineDrawing` machen aus
  einem Verlauf eine `Drawing`. Die Querschnitte stehen in `MOVEMENT_GEOMETRY` und
  `LINE_GEOMETRY`: Kopftiefe, Strich, Lücke, Beschriftung, Marken. Dazu kommen
  `resolvePathPoints`, `pathLengthMm` und `layoutDashes`.
- `packages/core/src/blocks/parametric.ts`: `ARROW_BLOCKS` und `LINE_BLOCKS` im
  Bausteinregister, außerdem `PARAMETRIC_BLOCKS` mit Parametern, Geometrie, Trägern und dem
  Verhältnis zu Zustand und Tendenz. Jede Aussage ist `evidenced`, `proposed` oder `open`.
- Zonenmodell: neue Zone `movement-anchor` für den Anbindungspunkt am Körper. Sie ist an allen
  32 Körperfassungen als `not-measured` mit `scope: 'value'` geführt.
- `packages/core/src/rules/planned-parametric-rules.ts`: vier **vorgemerkte** Regeln (Abschnitt
  4). Sie stehen aus demselben Grund wie in LFH-565 nicht im Regelkatalog.
- `packages/conformance/src/parametric-fixtures.ts`: sieben Referenzdateien als Parametersätze.
  Das Gate `parametric-fixtures.test.ts` prüft sie gegen `fingerprints.json`.
- Die Kategorielücken `arrow` und `line` im Register sind geschlossen, `BLOCK_CATEGORY_GAPS` ist
  leer.

`compose.ts`, `validate.ts`, `layout/profiles.ts`, die Ausgabekanäle und das Referenzinventar
sind unverändert.

## 3. Was der Bestand belegt

Die Referenzdateien sind nicht eingecheckt. Abgelesen wurde deshalb am Kennzahlenartefakt. Das
Artefakt führt für jede Fläche ihre Hülle: bei umgewandelten Strichen die Hülle der Fläche, bei
Rechtecken das Rechteck, bei Kreisen den Kreis, bei geradlinigen Glyphen die Außenkontur.
Kurvenpfade erfasst es nicht.

### 3.1 Pfeile, 32 × 32 mm

| Datei | Hülle | Befund |
|---|---|---|
| 5.2.1 | 2 / 9,823 / 30,354 / 22,177 | Schaft ab x 2, Kopf 6 mm tief, Spitze bei 30 |
| 5.2.2 | 1,75 / 11,823 / 30,354 / 20,177 | Querstrich bei x 2, Kopf 4 mm tief; Länge des Querstrichs offen |
| 5.2.3 | 2 / 11,823 / 30,354 / 20,177 | Schaft ab x 2, Kopf 4 mm tief |
| 5.2.4 | 1,646 / 11,823 / 30,354 / 20,177 | Köpfe an beiden Enden, Spitzen bei 2 und 30 |
| 5.2.5 | 2 / 11,823 / 30,25 / 20,177 | Querstrich bei x 30, Kopf 4 mm halbe Breite; Lage des Kopfs offen |
| 5.2.6 | — | ein Kurvenpfad, nicht erfasst |

Der Kopf ist **rechtwinklig**, das heißt seine Tiefe ist gleich seiner halben Breite. Das folgt
aus zwei Zahlen. Die Spitze ragt 0,354 mm über das Ende hinaus. Das ist die Gehrung eines
0,5-mm-Strichs an einem 90°-Winkel (0,25 · √2). Die Schenkelenden liegen 0,177 mm außerhalb. Das
ist die Stumpfkappe eines 45°-Schenkels (0,25 · cos 45°). Nicht belegt ist, ob der Schaft bis zur
Spitze läuft: beide Aufbauten haben dieselbe Hülle.

### 3.2 Grenzen, 48 × 32 mm

| Datei | Striche | Lücke | In der Lücke |
|---|---|---|---|
| 2.17 | 1…17, 31…47 | 14 mm | T, E, L; Mitte 24,007 |
| 2.18 | 1…17, 31…47 | 14 mm | E, A |
| 2.19 | 1…16, 32…47 | 16 mm | Kurvenglyph, E, A |
| 2.20 | 1…18, 30…47 | 12 mm | drei Kreise, Radius 1, bei x 21, 24, 27 |

Alle Striche liegen bei y 15,75…16,25, also 0,5 mm auf der Achse y 16. Die Glyphen haben an allen
drei Dateien dieselbe Versalhöhe (13,531…17,914). Die Grundlinie liegt damit 1,914 mm unter der
Achse. Wie im übrigen Katalog ist der Schriftgrad aus der Versalhöhe gerechnet (6,371 mm Arimo).
Die Referenzschrift ist schmaler als Arimo: das E misst dort 2,56 mm, in Arimo 3,45 mm. Die
Beschriftung passt trotzdem in jede Lücke.

Zu **2.19**: Die zwei geradlinigen Glyphen haben auf 0,001 mm dieselbe Breite wie E und A in
2.18. Davor steht ein Kurvenpfad. Gelesen wird das als „UEA“ (Untereinsatzabschnitt), wobei das U
aus dem Dateinamen stammt und nicht vermessen ist.

Zu **2.20**: Drei Marken in einer Reihe sind nach 5.4 die Belegung des Zuges. Gebaut wird deshalb
nur der Zug. Jede andere Stärke meldet `NotMeasuredError`.

### 3.3 Flächen 2.14 bis 2.16

Jede Darstellung ist ein einziger gefüllter Kurvenpfad: grün (2.14, in zwei Darstellungen),
hellblau (2.15) oder rot (2.16). Belegt sind nur die Fläche 48 × 32 mm und die Farbe. Alle drei
bleiben Lücken.

### 3.4 Nachbau

Setzt man den Verlauf der Referenz als Parameter (Pfeile 2|16 → 30|16, Grenzen 1|16 → 47|16),
trifft die Zeichnung jede Hülle im Artefakt auf drei Nachkommastellen. Das prüft
`parametric-fixtures.test.ts`. Die Zeichenfläche der Grenzen rendert als `viewBox="0 0 136.063
90.709"`, das ist dieselbe wie in den Referenzdateien.

Weil die Primitive `role: 'pictogram'` tragen, gilt für sie der Strichvertrag der Piktogramme: die
Ausgabe hat runde statt gegehrter Ecken. Die gerenderte Pfeilspitze sitzt deshalb 0,104 mm vor der
Spitze der Referenz. Das IR selbst trifft die Referenz.

## 4. Parametersatz, Zone, Regel

| Baustein | Parameter | Zone | Geometrie | Träger | mit Zustand/Tendenz |
|---|---|---|---|---|---|
| 5.2.1, 5.2.3, 5.2.4 | Verlauf, Anbindung | `movement-anchor` | belegt | offen | offen |
| 5.2.2, 5.2.5, 5.2.6 | Verlauf, Anbindung | `movement-anchor` | offen | offen | offen |
| 2.14, 2.15, 2.16 | Verlauf | `freestanding` | offen | keiner (empfohlen) | keine (empfohlen) |
| 2.17, 2.18, 2.19 | Verlauf | `freestanding` | belegt | keiner (empfohlen) | keine (empfohlen) |
| 2.20 | Verlauf, Stärke | `freestanding` | belegt, nur Zug | keiner (empfohlen) | keine (empfohlen) |

**Verlauf.** Ein Verlauf besteht entweder aus Stützpunkten (mindestens zwei) oder aus Anfang,
Richtung und Länge. Die Richtung zählt im Koordinatensystem der Zeichnung: 0° zeigt nach rechts,
90° nach unten. Das ist keine Kompassrichtung. Die Zeichenfunktionen lehnen folgende Verläufe als
ungültige Eingabe ab: einen Verlauf ohne Länge, einen Verlauf, der kürzer ist als seine Köpfe
tief sind oder als zwei Striche und eine Lücke, und einen Verlauf, der aus der Zeichenfläche ragt.

**Anbindung.** Die Zone `movement-anchor` ist an keiner Körperform vermessen. Kein Original zeigt
einen Pfeil an einem Grundzeichen. Eine Anbindung meldet deshalb `NotMeasuredError`, statt eine
Lage zu raten.

**Vorgemerkte Regeln** (`PLANNED_PARAMETRIC_RULES`, in Kraft mit LFH-577):

| Kennung | Dimension | Inhalt |
|---|---|---|
| `movement-carrier-not-allowed` | movement | Ein Pfeil beginnt nur an zugelassenen Grundzeichen. |
| `movement-anchor-conflict` | movement | Ein Pfeil bindet nicht an einer Kante an, an der schon eine Zustands- oder Tendenzrandlage sitzt. |
| `line-anchor-not-allowed` | lines-and-boundaries | Linien und Grenzen binden an kein Grundzeichen an. |
| `line-strength-mismatch` | lines-and-boundaries | Die Stärke gehört nur an 2.20: dort Pflicht, sonst ein Fehler. |

## 5. Offene Fragen

Jede Empfehlung ist eine Empfehlung und keine Ablesung.

1. **Querstriche in 5.2.2 und 5.2.5.** Lage und Kopf sind belegt, die Länge der Querstriche nicht.
   *Empfehlung:* an den Referenzdateien ablesen. Solange das fehlt, bleiben beide Lücken. Eine Länge
   gleich der Kopfbreite (8 mm) wäre mit der Hülle vereinbar, wäre aber geraten.
2. **5.2.6 Sammeln und die Flächen 2.14 bis 2.16.** Alle vier bestehen aus Kurven. *Frage:* Wie
   folgen sie einem Verlauf? Läuft beim Sammeln mehr als ein Verlauf auf einen Punkt zu, und werden
   die Flächen entlang des Verlaufs gestreckt oder wiederholt? Das lässt sich nur an den Dateien
   klären.
3. **Träger der Pfeile.** Kein Original zeigt einen Pfeil an einem Grundzeichen. *Empfehlung:*
   zunächst die taktische Formation und die drei Fahrzeuge (`formation`, `vehicle-land`,
   `vehicle-air`, `vehicle-water`) als Träger zulassen,
   Anbindung an der Körperkante in Pfeilrichtung, Anbindungspunkt in der Kantenmitte. Das muss an
   einer Lagekarte der Systematik belegt werden, bevor `movement-anchor` eine Zahl bekommt.
4. **Pfeil und Tendenz.** Die Tendenz aus 5.8.3 ist selbst ein Pfeil, aber in eigenem Rahmen.
   *Empfehlung:* beide an einem Zeichen zulassen, aber nicht an derselben Körperkante
   (`movement-anchor-conflict`). Offen ist, an welcher Kante die Tendenzrandlage liegt; das hängt an
   Frage 4 aus LFH-565.
5. **Wiederholung auf langen Grenzen.** Die Referenz zeigt eine Periode. *Vorschlag, umgesetzt:*
   Die Lücke behält ihre Länge, die Striche teilen sich den Rest gleich und werden nie kürzer als
   gemessen. Die Alternative wäre, die Striche fest zu lassen und am Ende zu kürzen.
6. **Beschriftung der Grenzen.** Ist „TEL“, „EA“ oder „UEA“ fester Teil des Zeichens, oder steht
   dort die Kennung des Abschnitts, etwa „EA 2“? Dreht sich die Schrift mit dem Verlauf mit?
   *Umgesetzt:* feste Beschriftung, aufrecht. *Empfehlung:* Beschriftung als optionalen Parameter
   mit diesem Vorgabewert führen. Die Lücke ist bei 2.17 und 2.18 14 mm breit; ein längerer Text
   braucht dann eine breitere Lücke.
7. **Stärke an 2.20.** *Frage:* Gilt für Trupp, Staffel und Gruppe die Reihenbelegung aus 5.4
   (Mitte; oben und unten; außen), mit Radius 1 und Abstand 3 mm wie beim Zug? *Empfehlung:* ja für
   Trupp und Gruppe, weil sie Teilmengen derselben Reihe sind. Die Staffel ist in 5.4 ein Stapel
   und hat an einer Linie keinen offensichtlichen Platz; sie bleibt offen.
8. **Zugang (5.8.9) als Zustand einer Linie.** Das ist Frage 9 aus LFH-565. *Befund:* Keine der
   Linien 2.14 bis 2.20 ist ein Verkehrsweg. Befahrbarkeit und Einbahnstraße sind deshalb kein
   Zustand dieser Linien. Die Frage bleibt für die Randlage am Grundzeichen offen.
9. **Farbe.** Die Grenzen sind schwarz, die Flächen 2.14 bis 2.16 farbig. *Frage:* Nehmen Grenzen
   eine Organisationsfarbe an, etwa die Grenze eines Feuerwehrabschnitts in Rot? Umgesetzt ist nur
   Schwarz.

## 6. Nicht Teil

- Das Spec-Feld für Pfeile und Linien und das Inkrafttreten der vier Regeln (LFH-577).
- Eine Manifestzeile für 2.17 bis 2.20. Im Referenzinventar stehen sie weiter als `deferred`, und
  5.2 liegt außerhalb des Umfangs. Wenn Abschnitt 5 entschieden ist, bekommen sie Zeilen.
- Die Vermessung von `movement-anchor`.
- Georeferenzierte Verläufe, also Koordinaten auf der Karte statt Millimeter auf der
  Zeichenfläche. Das ist Aufgabe des Kanals `maplibre`, nicht des Bausteins.
- Eine fachliche Freigabe. Keiner der 13 Bausteine hat ein Domain-Review.
