# Kapitel 1 steht vollständig — und das Werkzeugargument vom 4. August war eine Aussage über den Extraktor

> Entscheidungsnotiz · 18. August 2026 · LFH-424, Restpunkte Grundlagen

## Zweck dieses Dokuments

LFH-424 holt fünf Posten nach, die die Entscheidungsnotiz vom 4. August 2026 bewusst aufgeschoben
hat. Vier davon sind gebaut — die sechs fehlenden Grundzeichen aus Kapitel 1, das Gate für
`1.13 Ereignis`, der Farbwert für `hilfsorganisation` und, entgegen dem Baubeschluss, die
Fahrwerkszone aus Kapitel 5.1. Zwei bleiben begründet offen: die Kopfmarken der Verwaltungsstufen
und das Kreiskörperprofil.

Diese Notiz hält fest, was aus dem Diff allein nicht ablesbar ist:

- je Posten, **was ihn am 4. August aufgeschoben hat, was sich seither geändert hat und wie er jetzt
  steht** — für die zwei offenen jeweils mit dem Zeichen, das ihn nicht braucht;
- wo die Notiz vom 4. August **recht hatte** und wo ihre Begründung nur eine Werkzeuggrenze war.
  Das ist der interessanteste Befund dieses Slice, und er hat sich bestätigt;
- die geprüften und **verworfenen** Wege beim 1.13-Gate und bei den Kopfmarken;
- die vollständige vermessene Geometrie der Verwaltungsstufen, damit der nächste Slice bei Zahlen
  anfängt statt bei einer Suche;
- und, ausdrücklich, wie weit Anhang E.2 nach diesem Stand ist — die Frage, an der die Reihenfolge
  des Tickets hing.

**Alle Zahlen dieser Notiz stammen aus Kommandos, die für sie selbst gelaufen sind.** Das Werkzeug
ist ein eigener Pfadparser in Python — eine zweite, unabhängig geschriebene Fassung neben der
TypeScript-Implementierung im Repo, mit analytischen Kubik-Extrema (Nullstellen der
Ableitungsquadratik je Achse), quadratischen Segmenten verlustfrei in Kubiken überführt, ohne
Abtastung für Hüllen, 1 mm = 72/25,4 Einheiten. Er ist **vor der ersten neuen Zahl** an drei
eingecheckten Kennwerten kalibriert worden:

| Datei | Formklasse | eingecheckt in `fingerprints.json` | eigene Messung |
|---|---|---|---|
| `1.7_Gebäude.svg` | `outline` | 0,75 / 2,724 / 31,25 / 26,25 | 0,7500 / 2,7241 / 31,2501 / 26,2502 |
| `1.10_Maßnahme.svg` | `outline` | 0,571 / 3,5 / 31,428 / 29,257 | 0,5711 / 3,5003 / 31,4283 / 29,2573 |
| `1.13_Ereignis.svg` | `bounds` | 3,792 / 6,862 / 28,207 / 25,451 | 3,7920 / 6,8615 / 28,2074 / 25,4508 |

Wo eine Zahl **nicht** aus einer eigenen Messung stammt, steht es an Ort und Stelle. Der Abschnitt
[Evidenz](#evidenz) nennt die Kommandos, der Abschnitt [Sichtprüfung](#sichtprüfung) die Bilder.

---

## 1. Die Prämisse des Tickets: das Werkzeugargument ist gefallen, die Beobachtung nicht

Die Notiz vom 4. August nennt zwei Gründe für den Aufschub, und beide sind Werkzeuggründe. Das
Ticket vermutet, sie trügen nicht mehr. **Sie tragen tatsächlich nicht mehr — aber nicht, weil die
Notiz falsch beobachtet hätte.**

**Die Beobachtung ist wörtlich richtig, und sie ist heute noch wahr.** `extract.ts` liefert für
einen Kurvenpfad keine Form und zählt stattdessen `curvedPaths` hoch. Selbst ausgelesen aus dem
eingecheckten `fingerprints.json`:

| Datei | `shapes` | `curvedPaths` | `fills` |
|---|---|---|---|
| `1.3_Landfahrzeug.svg` | **leer** | 2 | `["#ffffff"]` |
| `1.4_Luftfahrzeug.svg` | **leer** | 2 | `["#ffffff"]` |
| `1.5_Wasserfahrzeug.svg` | **leer** | 2 | `["#ffffff"]` |
| `1.9_Gebiet.svg` | **leer** | 2 | `["#ffffff"]` |
| `1.14_Spontanhelfer.svg` | **leer** | 1 | `[]` |

Für diese fünf nennt `audit:reference` bis heute keine Eckpunkte, genau wie die Notiz schreibt.
Wer am 4. August einen Fallback über die Ausgabe des Extraktors gesucht hat, hat ihn zu Recht
nicht gefunden.

**Die Schlussfolgerung trägt nicht**, und der Grund ist einer, den keine der beiden Notizen kannte:
die Ebene `Flächige_Fülung` der Referenzdateien trägt bei `1.3`, `1.4`, `1.5` und `1.9` **die
Mittellinie verbatim**. Sie ist nicht abgeleitet, nicht gemittelt, nicht rekonstruiert — sie steht
als Pfad in der Datei und ist nur für ein Werkzeug unsichtbar, das Kurven überspringt. Eigene
Messung mit dem Python-Parser:

| Datei | Hülle der Ebene `Flächige_Fülung` |
|---|---|
| `1.3_Landfahrzeug.svg` | 0,9998 / 5,7499 / 31,0000 / 26,0001 |
| `1.4_Luftfahrzeug.svg` | 1,0001 / 7,9999 / 31,0003 / 23,0001 |
| `1.5_Wasserfahrzeug.svg` | 1,0001 / 9,0001 / 31,0000 / 24,0002 |
| `1.9_Gebiet.svg` | 1,5199 / 3,2298 / 30,9993 / 28,3237 |

`1.13` und `1.14` führen als einzige des Kapitels **überhaupt keine Füllebene** — auch das eigens
nachgesehen, ihre Ebenenliste ist `Grundfläche` / `Takt_Zeichen (umgewandelt)`. Bei `1.14` trägt
stattdessen das Ringpaar: Außenkontur 1,7501 / 1,7498 / 30,2500 / 30,2500, Innenkontur 2,2500 /
2,2500 / 29,7497 / 29,7497, also Mittellinie 2 / 2 / 30 / 30 bei 0,5 mm Strich. Bei `1.13` trägt
das Umrisspolygon.

**Die richtige Formulierung wäre gewesen: nicht vom heutigen Extraktor vermessbar.** Das ist keine
Wortklauberei — der Unterschied entscheidet, ob man ein Ticket für den Katalog oder eines für das
Werkzeug schreibt. Die Notiz vom 5. August hat aus derselben Beobachtung „`1.9` belegbar: **nein**"
geschlossen und damit ein Zeichen für unbelegbar erklärt, dessen zehn Ecken auf ganzen Millimetern
liegen.

Was die Notiz vom 4. August dagegen **richtig** entschieden hat, und was hier ausdrücklich stehen
bleibt: acht belegte Grundzeichen statt vierzehn, davon fünf geraten. Diese Entscheidung war unter
ihrem Kenntnisstand die einzig zulässige, und sie ist der Grund, warum heute nichts zurückgedreht
werden musste.

---

## 2. Posten 1 — die sechs fehlenden Grundzeichen

**Urteil: gebaut, alle sechs mit vermessener Geometrie.** Kapitel 1 steht damit vollständig mit
allen vierzehn Abschnitten im Katalog.

### 2.1 Der Kernschritt zuerst: `boundsOfMm` rechnet Pfade

Vor jeder Änderung an `BASE_SYMBOLS` stand ein Schritt im Kern, und ohne ihn wären fünf der sechs
neuen Körper stille Fehler gewesen. `boundsOfMm` lieferte für `path` bis hierher `{0,0,0,0}`.
Seither rechnet der Zweig die Hülle **analytisch** — `tokenizePath` plus die Extrema jeder Kubik,
`Q` verlustfrei in eine Kubik überführt, keine Abtastung, kein zugesicherter Wert nach dem Vorbild
von `text`/`boxMm`. Der Unterschied ist nicht akademisch: eine zugesicherte Hülle ließe das
Fingerprint-Gate über einem falschen `d`-String grün werden.

Was der alte Zweig gekostet hätte, ist am Kompositionsmotor sichtbar und im Bau gemessen worden:
ein Kurvenkörper mit Bezeichnung setzte seine Fußzone auf `y = 1` mit `boxMm` 0 / 0,5 / 0 / 4,5 —
die Beschriftung stand oben im Nichts, und **kein Gate hat es gemeldet**. Diese Zahlen stammen aus
dem Bau und sind von mir nicht nachgestellt worden; nachgestellt ist das Ergebnis: `boundsOfMm`
liefert für alle sechs neuen Körper jetzt die Hülle, die unten in der Vergleichstabelle steht.

Zwei Tests sind dabei **umgeschrieben** und nicht gelöscht worden — `bounds.test.ts` und
`fingerprint.test.ts` sicherten zu, dass ein Pfad keine vergleichbare Ausdehnung hat, und sichern
jetzt die berechnete Hülle zu. `shiftY` lehnt Pfade weiter ab; das ist folgenlos, solange kein
Kurvenkörper eine Kopfzone trägt, und steht unter den offenen Kanten.

### 2.2 Was die Referenz zeichnet, und was der Katalog daraus macht

Die Hüllen sind das Schwächste, was man vergleichen kann — eine Hülle bestimmt keine Form, wie die
Notiz vom 5. August richtig schreibt. Deshalb steht hier beides: die Hülle **und** der punktweise
Abstand zwischen Referenzkurve und Katalogkurve.

| Grundzeichen | Referenz (eigene Messung) | Katalogkörper (`boundsOfMm`) | größter Abstand Kurve ↔ Kurve |
|---|---|---|---|
| 1.3 Landfahrzeug | 0,9998 / 5,7499 / 31,0000 / 26,0001 | 1,0000 / 5,7500 / 31,0000 / 26,0000 | **0,00032 mm** |
| 1.4 Luftfahrzeug | 1,0001 / 7,9999 / 31,0003 / 23,0001 | 1,0000 / 8,0000 / 31,0000 / 23,0000 | **0,00035 mm** |
| 1.5 Wasserfahrzeug | 1,0001 / 9,0001 / 31,0000 / 24,0002 | 1,0000 / 9,0000 / 31,0000 / 24,0000 | **0,00021 mm** |
| 1.9 Gebiet | 1,5199 / 3,2298 / 30,9993 / 28,3237 | 1,5202 / 3,2298 / 31,0000 / 28,3234 | **0,00083 mm** |
| 1.13 Ereignis | Mittellinie 4 / 7 / 28 / 25 | 4,0000 / 7,0000 / 28,0000 / 25,0000 | siehe 2.5 |
| 1.14 Spontanhelfer | Ringmittel 2 / 2 / 30 / 30 | 2,0000 / 2,0000 / 30,0000 / 30,0000 | siehe 2.4 |

Der „größte Abstand" ist beidseitig gerechnet (Referenzpunkte gegen die Katalogkurve **und**
umgekehrt, je rund 200 Stützstellen pro Segment). Der schlechteste Wert, 0,00083 mm bei `1.9`,
entspricht **0,0024 Einheiten** bei einer Exporttoleranz von 0,01. Die Katalogkurven liegen also
nicht nur in derselben Hülle, sie liegen auf der Referenzkurve.

### 2.3 Die vier aus der Füllebene

**`1.3 Landfahrzeug`** — zwei Kubiken, deren Kontrollpunkte ich einzeln ausgelesen habe:
(9,9998 | 7,9999) und (4,9999 | 7,0891) links, (26,9998 | 7,0887) und (21,9999 | 8,0003) rechts,
Scheitel 15,9999 bei y 7,9999 bzw. 8,0003. Der Katalog mittelt das Spiegelpaar 7,0891 / 7,0887 zu
**7,089** und den Scheitel zu **8** — höchstens 0,0004 mm von der Messung, dieselbe Operation, die
`deriveRing` an Ringpaaren ausführt. Die 0,0004 mm Spiegelasymmetrie sind eine Exportrundungsstufe
der Quelle: ein Befund an der Quelle, kein `deviation` der Umsetzung.

**`1.4 Luftfahrzeug` und `1.5 Wasserfahrzeug`** — Halbkreise mit r = 15 um (16 | 23) bzw. (16 | 9),
gezeichnet in der üblichen Zwei-Kubiken-Näherung mit K = 4(√2−1)/3 = 0,552285. Der Modellwert ist
15·K = 8,2843, also Kontrolloffsets bei 23 − 8,2843 = **14,7157**, 16 ∓ 8,2843 = **7,7157** /
**24,2843** und 9 + 8,2843 = **17,2843**. Gemessen habe ich 14,7158 / 7,7160 / 24,2845 (1.4) und
17,2843 / 24,2842 / 7,7156 (1.5) — größte Abweichung **0,0003 mm**. Die Zeile „Form nein" der Notiz
vom 5. August ist damit widerlegt: die Form ist ein Halbkreis, und der ist durch Mittelpunkt und
Radius vollständig bestimmt.

**`1.9 Gebiet`** — hier liegt der interessanteste Messfehler der alten Notiz. Ihre Extremazahlen
stimmen (ich messe 1,5199 / 3,2298 / 30,9993 / 28,3237), aber sie **liegen auf Eckrundungen** und
sind deshalb gar keine Entwurfsmaße. Ich habe die zehn Ecken aus dem Schnitt benachbarter
Geradensegmente der Füllebene rekonstruiert und aus Ecke und Tangentenpunkt je den Eckradius
zurückgerechnet:

| Ecke (gemessen) | Abstand zum ganzen Millimeter | Radius (gemessen) | 0,6-mm-Raster |
|---|---|---|---|
| 16,0003 \| 24,0002 | 0,00026 | 4,7989 | 4,8 |
| 3,9996 \| 29,0003 | 0,00041 | 2,4002 | 2,4 |
| 0,9999 \| 23,0001 | 0,00011 | 2,4003 | 2,4 |
| 5,9993 \| 18,0001 | 0,00066 | 1,7997 | 1,8 |
| 5,9993 \| 8,0001 | 0,00066 | 2,4000 | 2,4 |
| 15,9993 \| 3,0002 | 0,00074 | 4,7995 | 4,8 |
| 30,9993 \| 6,0004 | 0,00071 | 2,4001 | 2,4 |
| 30,9993 \| 13,0005 | 0,00071 | 2,4003 | 2,4 |
| 25,9996 \| 15,0001 | 0,00038 | 1,1998 | 1,2 |
| 27,9997 \| 26,0001 | 0,00034 | 1,1998 | 1,2 |

Größte Eckabweichung **0,00074 mm = 0,0021 Einheiten**, größte Radiusabweichung **0,00109 mm =
0,0031 Einheiten**. `1.9` ist ein Zehneck mit zehn Eckradien auf einem 0,6-mm-Raster, und der
Katalog trägt genau das ein: zehn Ecken und zehn Radien, aus denen der `d`-String **abgeleitet**
wird. Das ist bewusst so und nicht als roher Pfad eingetragen — belegt sind die zwanzig Zahlen,
nicht die 629 Zeichen, die aus ihnen folgen.

Eine methodische Falle steckt in der Zählung: die Füllebene von `1.9` führt **21** Segmente, das
letzte davon 0,0005 mm lang — ein Schließungsartefakt des Exports. Wer es als Gerade mitzählt,
bekommt elf Ecken statt zehn, und zwei davon liegen 0,34 mm neben dem Millimeterraster. Erst nach
dem Verwerfen entarteter Segmente wird die Zahlenreihe oben sichtbar.

### 2.4 `1.14 Spontanhelfer` — das Verfahren gehört in die Notiz, nicht nur der Wert

Die Außenkontur ist ein geschlossener Zug aus **acht** Kubiken; je Lappen liegen drei
Segmentendpunkte **exakt** auf seinem Kreis. Der exakte Umkreis durch diese drei Punkte —
geschlossene Lösung, keine Anpassung — liefert für alle vier Lappen dasselbe:

| Lappen | Mitte | R außen | d | R Mittellinie | d + R |
|---|---|---|---|---|---|
| links | 9,49356 \| 15,99988 | 7,74343 | 6,50644 | 7,49343 | 13,99987 |
| oben | 15,99988 \| 9,49314 | 7,74336 | 6,50686 | 7,49336 | 14,00022 |
| rechts | 22,50662 \| 15,99988 | 7,74336 | 6,50662 | 7,49336 | 13,99999 |
| unten | 15,99988 \| 22,50662 | 7,74336 | 6,50662 | 7,49336 | 13,99999 |

**Warum das glatte Paar 6,5 / 7,5 ausgeschlossen ist**, selbst gerechnet: nimmt man es an, liegt
die Lappenmitte auf 6,5 vom Zeichenmittelpunkt und der Außenradius bei 7,75. Die drei gemessenen
Endpunkte haben von dieser angenommenen Mitte die Abstände 7,74439 / 7,75022 / 7,74439 (oberer
Lappen) — größter Fehler gegen 7,75 also **0,00565 mm = 0,0160 Einheiten**, über der Toleranz 0,01.
Beim exakten Umkreis sind es 0,0003 Einheiten.

**Und warum eine Ausgleichsrechnung die Frage prinzipiell nicht entscheiden kann:** die
Zwei-Kubiken-Näherung ist kein exakter Kreis. Ein Kreisfit über abgetastete Kurvenpunkte mittelt
über eine Kurve, die systematisch neben dem Kreis liegt; sein Rest ist von derselben Größenordnung
wie der Abstand zwischen den beiden Kandidaten. Nur die Segmentendpunkte tragen, weil nur sie
exakt auf dem Kreis liegen.

**Berichtigung am Baubeschluss.** Er führt für die Ausgleichsrechnung d = 6,4999 / R = 7,5068 und
nennt die Gehrungsspitze der Innenkontur (8,7884 | 8,7884) als zweiten, unabhängigen Beleg mit
0,0055 mm Trennschärfe. Der Bau hat beides nachgerechnet und **keines von beiden reproduzieren
können**: seine Anpassung landet bei 6,50575 / 7,49285, also nahe am exakten Wert, und beide
Modelle sagen die Gehrungsspitze auf 0,0002 mm gleich voraus. Diese zwei Gegenrechnungen sind aus
dem Bau übernommen und von mir nicht wiederholt. Was ich selbst nachgerechnet habe, ist das
Argument, das trägt — der Radiusfehler an den drei Segmentendpunkten oben. Der eingetragene Wert
bleibt unverändert; es ändert sich nur, welche Begründung man weitergeben darf.

Zur Kontrolle habe ich zusätzlich den Abstand der Katalogmittellinie zu beiden Referenzringen
gemessen: zur Innenkontur **0,24991 … 0,25372 mm**, also die halbe Strichstärke über den ganzen
Umlauf. Zur Außenkontur sind es 0,24640 … 0,31383 mm; der obere Wert steht an den vier Fugen
zwischen den Lappen, wo die Referenz ihre Außenkante glatt durchzieht, während die Mittellinie dort
einen Knick hat. Das ist eine Eigenschaft des Umrisses und keine Formabweichung — im Bild (siehe
Sichtprüfung) sind Referenz und Katalog an genau diesen Fugen deckungsgleich.

### 2.5 `1.13 Ereignis` — und die einzige Abweichung dieses Slice

Das `<polygon>` in `1.13_Ereignis.svg` trägt **sieben** Punktpaare, das erste steht am Ende ein
zweites Mal. Selbst ausgelesen, in Millimetern:

```
(15,9999|25,4508) (3,7920|7,1388) (4,2079|6,8615) (15,9999|24,5491) (27,7911|6,8615) (28,2074|7,1388)
```

Paarweise gemittelt: (3,99995 | 7,00015) · (15,9999 | 24,99995) · (27,99925 | 7,00015) — höchstens
**0,00075 mm = 0,0021 Einheiten** von den ganzen Millimetern. Der Katalog trägt den **offenen**
Polyzug (4 | 7) → (16 | 25) → (28 | 7) bei 0,5 mm Strich. Das ist die Rekonstruktion der Notiz vom
4. August, unabhängig nachgemessen und bestätigt.

**Die Abweichung ist keine Geometrie-, sondern eine Kompositionsabweichung.** `event` ist das erste
Grundzeichen, das `spec.organization` **nicht** annehmen darf. Selbst ausgeführt:

```
composeFromCatalog({ kind: 'event', organization: 'feuerwehr' })
→ WURF: Eine Organisationsfarbe an "event" ist nicht belegt: der Körper ist ein offener
  Polyzug, und eine Füllung schlösse ihn implizit zu einer Fläche, die die Referenz nicht zeichnet.
```

Der Grund ist eine Eigenschaft von SVG, nicht des Katalogs: ein gefüllter Polyzug wird implizit
geschlossen. Ohne den Wurf würde aus dem Haken ein **gefülltes rotes Dreieck**. Die Pixelzahlen
dazu (936 deckende Pixel mit Füllung gegen 142 ohne) stammen aus dem Bau; nachgeprüft habe ich den
Wurf selbst und die Gegenprobe an der Quelle: der Haken kommt im gesamten Referenzbestand genau
einmal vor, in `1.13` selbst. Es gibt also keinen Beleg für ein eingefärbtes Ereignis, und
`compose()` erfindet keinen.

---

## 3. Posten 2 — das 1.13-Gate: drei Wege, einer gewählt

**Urteil: gebaut. Der Mechanismus kauft in diesem Ticket genau eine Gateaussage, und das steht im
Quelltext.**

### 3.1 Was den Posten am 4. August blockiert hat

Der Kennwert zu `1.13` beschreibt die Hülle des zu einer Fläche umgewandelten **Strichs**, der
Katalogkörper die **Mittellinie**. Beides verglichen scheitert. Selbst ausgeführt mit
`matchFingerprint(baseDrawing('event'), fingerprintFor('1.13_Ereignis.svg'))`:

```
minX erwartet 3.792 mm, erhalten 4    (Differenz  0.5896 Einheiten)
minY erwartet 6.862 mm, erhalten 7    (Differenz  0.3912 Einheiten)
maxX erwartet 28.207 mm, erhalten 28  (Differenz -0.5868 Einheiten)
maxY erwartet 25.451 mm, erhalten 25  (Differenz -1.2784 Einheiten)
```

**Es scheitern alle vier Kanten, nicht eine.** Die Notiz vom 4. August nennt `minX` (0,590), der
Nachtrag vom 5. August korrigiert auf `maxY` (rund 1,28). Beide haben recht, beide sind
unvollständig.

### 3.2 Weg A — den Extraktor um eine Mittellinienklasse erweitern: verworfen

Er erzwingt die Neuerzeugung aller 661 Kennwerteinträge aus dem gitignorierten Referenzordner, wirft
die Provenienzfrage auf, ob abgeleitete Eckpunkte ins eingecheckte Artefakt dürfen — und liefert
die **schwächere** Aussage. Ein Mittellinienvergleich unterscheidet offen nicht von geschlossen;
genau das ist die Warnung, die die Notiz vom 5. August ausspricht („kein Gate fängt den
Unterschied"), und für Weg A gilt sie unverändert.

### 3.3 Weg C — kein Mechanismus, ein handgetippter Test: verworfen

Der Erwartungswert stünde dann als Zahl in einer Testdatei, von einem Menschen dorthin geschrieben.
Beim gewählten Weg stammt er aus `audit:reference` und ist eingecheckt. Das ist der einzige
belastbare Unterschied zwischen beiden Wegen, und er fällt zugunsten des Mechanismus, weil „jede
Zahl stammt aus einer Messung" genau das meint.

### 3.4 Weg B — strichbewusster Vergleich auf der Zeichnungsseite: gewählt

`strokeBoundsOfMm` rechnet die Strichhülle eines Polyzugs analytisch: Segmentrechtecke plus
Gehrungsspitzen an den Fugen, Stumpfkappen an den Enden, Breite aus `style.strokeWidth`.
`matchFingerprint` bekommt dafür die Option `bodyGeometry: 'centerline' | 'stroke-outline'` mit
`centerline` als Vorgabe.

Die Konstante ist vermessen, und zwar an **zwei** unabhängigen Fällen gegen eingecheckte Kennwerte.
Alle vier Zeilen unten habe ich mit meinem eigenen Python-Modell nachgerechnet, unabhängig von der
TypeScript-Fassung im Repo:

| Fall | Modell (eigene Rechnung) | eingecheckter Kennwert | größte Abweichung |
|---|---|---|---|
| `1.13` **offen**, Gehrung, Stumpfkappen, 0,5 mm | 3,7920 / 6,8613 / 28,2080 / 25,4507 | 3,792 / 6,862 / 28,207 / 25,451 | **0,0029 Einheiten** |
| `1.7 Gebäude` **geschlossen**, Gehrung, 0,5 mm | 0,7500 / 2,7241 / 31,2500 / 26,2500 | 0,75 / 2,724 / 31,25 / 26,25 | **0,0003 Einheiten** |
| `1.13` **geschlossen** (Gegenprobe) | 3,5329 / 6,7500 / 28,4671 / 25,4507 | — | **0,7374 Einheiten daneben** |
| `1.10 Maßnahme` geschlossen, Gehrung, 0,5 mm | 0,5585 / 3,7500 / 31,4415 / 29,4859 | 0,571 / 3,5 / 31,428 / 29,257 | **0,7087 Einheiten daneben** |

Die dritte Zeile berichtigt die Warnung der Notiz vom 5. August: **ein strichbewusster Vergleich
fängt den Unterschied zwischen offen und geschlossen sehr wohl**, um 0,73 Einheiten bei einer
Toleranz von 0,01. Die Warnung gilt für Mittellinienvergleiche und ist genau der Grund, Weg A nicht
zu wählen. Die Pflicht „muss von Hand am Snapshot geprüft werden" ist damit durch ein Gate abgelöst.

Die vierte Zeile ist der Grund für die erste von zwei Auflagen an diesem Mechanismus:

- **(a) Der Aufruf wird nicht aus der Formklasse abgeleitet.** Eine Funktion, die pauschal über
  alle `outline`-Kennwerte liefe, wäre für `1.10 Maßnahme` um 0,71 Einheiten falsch — der Bestand
  mischt die Fugenmodelle, `1.7` ist mit Gehrung bei 0,5 mm gezeichnet, `1.10` mit Fase bei 1,0 mm.
  Der Modus steht deshalb als eigene Spalte in der Belegtabelle von `base-symbols.test.ts`, je Zeile
  einzeln gesetzt, und der Gegenfall `1.10` steht als Negativtest im Repo.
- **(b) Der Mechanismus kauft in LFH-424 genau einen Gatefall.** Die fünf übrigen neuen Grundzeichen
  tragen leere `shapes` und können von ihm nicht bedient werden; die Kopfmarken tragen `role: 'head'`
  und werden von `matchFingerprint` nie verglichen. Die Zahl **1** steht im Quelltext, damit der
  Mechanismus nicht später als breiter Nutzen erinnert wird.

### 3.5 Was die fünf übrigen stattdessen belegt

Selbst ausgeführt: `matchFingerprint` bricht für `1.3`, `1.4`, `1.5`, `1.9` und `1.14` mit „Keine
vergleichbare Form in den Kennzahlen" ab, **bevor** es den Körper ansieht. Sie tragen deshalb im
Manifest nicht `body-fingerprint`, sondern die neue Nachweisart **`body-geometry-regression`** —
ein an den Zahlen festgenagelter Test plus Snapshot, nach dem Vorbild von `head-shape-regression`,
das aus demselben Grund existiert.

Die Unterscheidung wird dabei **am Artefakt** getroffen (`shapes.length === 0`) und nicht an einer
gepflegten Liste. Das ist der wichtigere Teil: ein späterer Extraktorausbau löst die Ausnahme von
selbst auf, statt eine Liste zu hinterlassen, die niemand mehr prüft. Selbst ausgelesen aus dem
Manifest — `bbk-babz-2025:1.3`, `:1.4`, `:1.5`, `:1.9` und `:1.14` tragen
`["body-geometry-regression","svg-snapshot"]`, `:1.13` trägt `["body-fingerprint","svg-snapshot"]`.

---

## 4. Posten 3 — `hilfsorganisation` hat eine Referenzdatei

**Urteil: gebaut. `ORGANIZATION_COLORS.hilfsorganisation = 'weiss'`.**

### 4.1 Was ihn aufgeschoben hat, und was daran falsch war

Drei Dokumente behaupten übereinstimmend, es gebe keine Referenz: die Notiz vom 4. August
(Abschnitt 4: „Für `hilfsorganisation` gibt es in Kapitel 2 der lokalen Referenz keine Datei"), der
Kommentar in `organizations.ts` und der Design-Spec vom 5. August („2.2 trägt einen generischen
Namen, aus dem keine Zuordnung folgt"). `organizationColor('hilfsorganisation')` warf.

**Die Datei ist `2.2_Organisationen.svg`, und ihr Name ist irreführend.** Drei unabhängige Belege,
alle selbst erhoben:

1. **Struktureller Zensus über alle 21 Dateien des Kapitels.** Genau **acht** tragen einen
   vollflächigen Fleck über 0 / 0 / 32 / 32 mm **und** eine Typo-Ebene: 2.1 (`#fa1919`),
   **2.2 (`#fff`)**, 2.3 (`#003296`), 2.4 (`#fafa00`), 2.5 (`#14a01e`), 2.6 (`#b4783c`),
   2.7 (`#fa8c00`), 2.8 (`#bebebe`). Die reinen Farbtafeln 2.9 bis 2.13 tragen einen Fleck, aber
   **keine** Typo-Ebene; die Grenz- und Linienzeichen 2.14 bis 2.20 tragen keinen Fleck. Acht
   Flecken für acht `OrganizationId`-Werte.
2. **Gerastert und mit dem Auge gelesen.** Im Kontaktbogen aus 2.1, 2.2, 2.3 und 2.8 liest die
   Typo-Ebene von 2.2 **„HiOrg"** — daneben „Fw" auf Rot, „THW" auf Blau und „ZIV" auf Grau. Das
   Bild ist unter [Sichtprüfung](#sichtprüfung) beschrieben.
3. **Das Kennwertartefakt trägt es bereits.** `fingerprints.json` führt für die Datei
   `fills: ["#ffffff"]` und eine `rect`-Form 0 / 0 / 32 / 32 mit `fill: "#ffffff"`. Der bestehende
   `COLORED`-Test greift damit ohne jeden neuen Mechanismus.

`PALETTE.weiss` ist bereits `#ffffff` — es gab keine Palettenerweiterung, nur einen fehlenden
Tabelleneintrag.

### 4.2 Die Gates, vorab gerechnet statt vermutet

Das Kontrastgate des Druckthemes fordert für je zwei Organisationen einen Helligkeitsabstand
> 0,045. Selbst gerechnet mit `relativeLuminance` über die acht Tokens:

| Token | Druckthema | Relativluminanz | Organisation |
|---|---|---|---|
| rot | `#666666` | 0,1329 | feuerwehr |
| blau | `#767676` | 0,1812 | thw |
| gruen | `#888888` | 0,2462 | polizei |
| braun | `#999999` | 0,3185 | bundeswehr |
| orange | `#aaaaaa` | 0,4020 | sonstige-gefahrenabwehr |
| hellgrau | `#bbbbbb` | 0,4969 | zivile-einheiten |
| gelb | `#dddddd` | 0,7231 | fuehrung-leitung |
| **weiss** | `#ffffff` | **1,0000** | **hilfsorganisation** |

Abstände: 0,0483 · 0,0650 · 0,0723 · 0,0834 · 0,0950 · 0,2261 · **0,2769**. Der kleinste bleibt
0,0483 zwischen rot und blau, der neue ist mit Abstand der größte. Das Gate ist unberührt; nötig
war allein eine achte Kontursignatur, `ORGANIZATION_BODY_DASHES.weiss = [1, 2]`, eindeutig gegen
die sieben bestehenden.

### 4.3 Der Vorbehalt, der dazugehört

`#ffffff` ist im Bestand zugleich die neutrale Grundfüllung. **Ein gerendertes Zeichen mit
`hilfsorganisation` ist von einem organisationslosen farblich nicht zu unterscheiden.** Das ist eine
Eigenschaft der Quelle und kein Umsetzungsfehler — und genau der Grund, warum die Kontursignatur
hier mehr trägt als bei den übrigen sieben. Sie ist allerdings in keinem Bild abgebildet; siehe
offene Kanten.

---

## 5. Posten 4a — die Fahrwerkszone: gebaut, entgegen dem Baubeschluss

**Urteil: gebaut. Der Baubeschluss sah „begründet offen" vor.**

### 5.1 Warum derselbe Grund für 4a fällt und für 4b hält

Der Baubeschluss lehnt beide Hälften von Posten 4 mit demselben ersten Grund ab: *kein
Katalogeintrag im beanspruchten Umfang braucht sie*. Dieser Grund ist **nicht symmetrisch**, und
das ist der Kern dieses Abschnitts.

Für die Verwaltungsstufen hält er (Abschnitt 6). Für die Fahrzeugkategorien fällt er, weil der
Konsument benannt und vermessen ist. Eigener Zensus über alle **31** E.2-Dateien, Suchmerkmal ein
Radinnenring der Hülle 4,0 × 4,0 mm mit Mittelpunkt auf y ≈ 28,25:

| Fahrwerk | Zahl | Dateien |
|---|---|---|
| zwei Räder (cx 3,7502 · 28,2499) | 8 | E.2.1, .2, .5, .14, .15, .16, .17, .20 |
| drei Räder (cx 3,7502 · 16,0001 · 28,2499) | 12 | E.2.3, .4, .6, .7, .8, .10, .11, .12, .13, .18, .19, .21 |
| Kette (Innenstadion 2,25 … 29,75) | 1 | E.2.9 |
| Anhängerfahrwerk (ein Rad 17,50 bzw. zwei 14,25 / 19,75) | 4 | E.2.22, .23, .24, .25 |
| **kein Fahrwerk** | **6** | E.2.26 und die fünf Wasserfahrzeuge E.2.27 … E.2.31 |

**25 der 31 E.2-Zeichen tragen ein Fahrwerk, 21 davon eines mit einer Fahrzeugkategorie.** Und es
ist dieselbe Zone, nicht eine ähnliche: die Radringe von `E.2.1` messen 1,7501 / 26,2502 / 5,7503 /
30,2500 und 26,2498 / 26,2502 / 30,2500 / 30,2500 — **zahlengleich** mit denen von `5.1.1.1`, auf
vier Nachkommastellen. Der Körper darunter ist derselbe: Füllhülle 1,0001 / 5,7503 / 31,0003 /
26,0004 gegen 0,9998 / 5,7503 / 31,0000 / 26,0004, also `vehicle-land` aus Posten 1.

Die zwei übrigen Gründe des Beschlusses waren Argumente gegen eine **bestimmte Bauform**, nicht
gegen das Bauen — und beide sind in der gewählten Form beantwortet:

- *„`HeadMark` verankert an der Zonenoberkante, die Marken an der Körperunterkante."* Richtig, und
  gemessen: Körperunterkante 26,0004, Markenmitte 28,2501. Die Folge ist ein eigener Typ
  `ChassisShape` neben `HeadShape`, kein Verzicht.
- *„Kategorie 2 und 3 teilen sich die Radplätze und fielen byteidentisch zusammen."* Richtig,
  solange man den Verbindungsstrich nicht modelliert. Als eigene Markenart `bar` unterscheidet er
  sie.

### 5.2 Die vermessene Geometrie

Alle Zahlen an `5.1.1.1`, `.2`, `.3`, `.5` und `.6` selbst gemessen, Angaben in Millimetern.

| Größe | Messung | Fundstelle |
|---|---|---|
| Körperunterkante (Mittellinie) | 26,0004 | Füllebene, in allen fünf gleich |
| Markenmitte | 28,2501 | Mitte des Radinnenrings 1,7501 … 5,7503 |
| Markenradius (Mittellinie) | 2,2501 | Innenring r 2,0001, Außenkante r 2,5001 |
| Zonenunterkante | 30,7502 | `maxY` der Umrissebene |
| Zonenhöhe | 4,7498 | Differenz der beiden |

Der Abstand Körperunterkante → Markenmitte ist **2,2497** und fällt mit dem Markenradius zusammen.
Das ist ein Befund an der Referenz, keine Regel: das Fahrwerk sitzt genau so tief, dass die
Radaußenkante die Innenkante des Körperstrichs berührt — deshalb zeigt das Bild keinen Bogen
innerhalb der Körperfläche.

| ID | Datei | gemessene Marken |
|---|---|---|
| `kfz-kategorie-1` | 5.1.1.1 | Räder cx 3,7502 · 28,2499 |
| `kfz-kategorie-2` | 5.1.1.2 | Räder cx 3,7502 · 16,0001 · 28,2499 |
| `kfz-kategorie-3` | 5.1.1.3 | dieselben drei **plus zwei** Verbindungsstriche |
| `kettenfahrzeug` | 5.1.1.5 | Innenstadion 2,2500 / 26,2502 / 29,7497 / 30,2500 → Endmitten 4,2500 · 27,7500 |
| `schienenfahrzeug` | 5.1.1.6 | Räder cx 3,7504 · 9,2505 · 22,7499 · 28,2501 |
| `amphibienfahrzeug` | 5.1.1.4 | zwei Räder wie Kategorie 1 **plus** eine Wellenlinie — siehe 5.4 |

Die Kettenenden liegen bei 4,25 / 27,75 und damit 0,5 mm weiter innen als die Radplätze 3,75 /
28,25 derselben Familie. Es gibt keine ableitbare Regel dafür; 3,75 / 28,25 bleibt eine gemessene
Zahl.

**Die vier Radplätze des Schienenfahrzeugs sind ein zweites Mal bestätigt, aber die Datei steht
trotzdem nicht in `referenceAssets`.** `5.1.1.7_Kraftfahrzeug_aufgleisbar.svg` führt selbst gemessen
**fünf** Räder: 3,7504 · 9,2505 · **16,0002** · 22,7499 · 28,2501, alle bei cy 28,2504 — also die
vier des Schienenfahrzeugs plus eines in der Mitte. Das bestätigt die vier, macht die Datei aber
nicht zur Darstellung eines Schienenfahrzeugs: ein aufgleisbares Kraftfahrzeug ist etwas anderes,
und `referenceAssets` liest wie „diese Datei stellt dieses Element dar". `schienenfahrzeug` bleibt
damit der einzige der fünf Einträge mit **einer** Belegstelle, und das ist die wahre Aussage über
den Bestand.

Eine Zahl daneben, die keine Regel trägt und deshalb als Zahl stehen bleibt: der Abstand innerhalb
eines Drehgestellpaars beträgt **5,5 mm** (3,7504 → 9,2505 und 22,7499 → 28,2501) — dieselben 5,5 mm
wie zwischen den zwei Rädern des Anhängers `5.1.2.5` (14,2501 / 19,7503), selbst nachgemessen. Zwei
Vorkommen derselben Zahl sind kein Muster; sie sind zwei Vorkommen.

### 5.3 Der Verbindungsstrich: das gemessene Band statt des gemessenen Endpunkts

Der Baubeschluss und die Liste der offenen Fragen führen die Endpunkte des Kategorie-3-Strichs als
„unterbestimmt, weil die Radringe sie verdecken". Das stimmt — aber die Unterbestimmtheit lässt
sich **beziffern**, und damit wird sie folgenlos. Selbst gemessen an der Umrissebene von `5.1.1.3`:

- Die Zwischenräume zwischen Körperunterkante und Strichoberkante messen **5,2433 … 14,5062** und
  **17,4932 … 26,7561** bei y 26,2502 … 28,0000. Es sind also **zwei** Striche, nicht einer.
- Die Radinnenfläche des **mittleren** Rads ist ein unverletzter Kreis (14,0000 / 26,2502 /
  18,0001 / 30,2500, sechs Segmente). Ein durchgehender Strich hätte sie durchstoßen.

Daraus folgt das Band, in dem ein Endpunkt liegen muss: mindestens 2,0 mm neben der Radmitte (sonst
durchstößt er die Innenfläche), höchstens 2,4875 mm (so weit reicht der Außenkreis r 2,5 auf Höhe
der Strichkante). **Das Band ist 0,49 mm breit, und jede Lage darin erzeugt dasselbe Bild.** Der
Katalog setzt die Ringmittellinie, also die Bandmitte; zwei Tests halten **beide Bandgrenzen** fest
und nicht nur die gewählte Lage. Belegt ist das Bild, nicht der Endpunkt, und genau so steht es da.

### 5.4 Was nicht gebaut ist: das Amphibienfahrzeug

`vehicleChassis('amphibienfahrzeug')` wirft — selbst ausgelöst. `5.1.1.4` trägt dieselben zwei
Radplätze wie Kategorie 1, dazu eine Wellenlinie, deren Strichhülle ich mit **7,4263 / 26,7000 /
24,5756 / 29,7998** messe. Nicht vermessen ist der Kurvenzug: aus einem Umrisspaar folgt kein
eindeutiger Kurvenzug, und eine plausibel aussehende Näherung wäre die Attrappe, die dieses Projekt
verbietet. Eine partielle Funktion mit begründetem Wurf ist hier das eingeführte Muster
(`organizationColor`, `circleBodyProfile.place`, die Ablehnung der Organisationsfarbe an `1.13`).

### 5.5 Zwei neue Ablehnungen, beide gemessen

Selbst ausgeführt:

```
validateSpec({kind:'vehicle-air',  vehicleCategory:'kfz-kategorie-1'})
→ vehicle-category-requires-vehicle: Eine Fahrzeugkategorie ist nur am Landfahrzeug belegt.
validateSpec({kind:'vehicle-land', vehicleCategory:'kfz-kategorie-1', designation:'AB'})
→ chassis-foot-conflict: Fahrzeugkategorie und Bezeichnung belegen beide den Streifen
  unterhalb des Körpers und schließen sich aus.
validateSpec({kind:'vehicle-land', vehicleCategory:'kfz-kategorie-1'})
→ []
```

Die erste verengt eine bestehende Regel, die bis hierher für alle drei Fahrzeugarten galt — eine
Annahme aus dem Wort „Fahrzeugkategorie". Gemessen trägt keine der drei Luftfahrzeugdateien
`5.1.4.1` bis `5.1.4.3` und keines der fünf E.2-Wasserfahrzeuge eine Fahrwerkszone. Die zweite folgt
aus der Zonenrechnung: das Fahrwerk reicht 4,75 mm unter den Körper, die Fußzone beginnt 1 mm
darunter und ist 4 mm hoch — 3,75 mm Überschneidung bei 4 mm Zonenhöhe. Kein Zeichen des Bestands
trägt beides; Anhang E.2 beschriftet seine Fahrzeuge **im** Körper, und das bleibt zulässig.

---

## 6. Posten 4b — die Verwaltungsstufen bleiben begründet offen

**Urteil: begründet offen. Das folgt dem Baubeschluss.**

**Welches Zeichen den Posten nicht braucht: alle 325 Manifestzeilen.** Eigener Zensus über alle 661
Referenzdateien, Suchmerkmal ein Subpfad der Hülle 3,7137 × 4,0001 mm. Genau **acht** Dateien tragen
eine solche Kopfmarke. Und das Manifest selbst ausgelesen: **es führt aus Bereich D genau eine
Zeile**, `bbk-babz-2025:D.3.7`, den Stärkefall — keiner der acht Träger kommt darin vor, weder als
Eintrag noch als Belegstelle. Eine `adminLevelHead`-Funktion hätte null Aufrufer.

### 6.1 Der zweite Grund ist der schwerere

**Drei der sechs Stufen haben in Kopfform überhaupt keine Referenz.** Selbst gemessen, alle acht
Träger mit ihren `cx` bei `cyFromTop`:

| Stufe | n | Träger | gemessene cx |
|---|---|---|---|
| `kreis` | 2 | D.3.1, D.3.3, D.3.4, D.4.1, D.4.2, D.4.3 | 11,0000…11,0001 · 21,0000…21,0003 (bei cy 2,0001…2,0002) |
| `nationalstaat` | 5 | D.4.4 | 6,0002 · 11,0001 · 16,0001 · 21,0000 · 25,9999 (bei cy 2,0001…2,0002) |
| `europaeische-union` | 6 | D.4.5 | 13,5003 · 18,4998 (cy 2,0001…2,0002); 8,9999 · 23,0002 (cy 5,0003 / 4,9999); 13,4999 · 18,4998 (cy 7,0002) |
| `gemeinde` | 1 | **keiner** | aus der Teilung 5 ableitbar (16), nicht vermessen |
| `bezirk` | 3 | **keiner** | aus der Teilung 5 ableitbar (11 · 16 · 21), nicht vermessen |
| `bundesland` | 4 | **keiner** | **offen** |

Für `bundesland` trägt auch keine Ableitung, und das ist an dem einen Fall prüfbar, an dem es
prüfbar ist: der einzige Kopfzonenfall mit gerader Markenzahl jenseits von zwei ist n = 6, und dort
liegen die äußeren Marken auf **16 ± 7,0** (8,9999 und 23,0002) statt der aus der 5-mm-Teilung
erwarteten 16 ± 7,5. Die Skalenregel, die n = 1 und n = 3 tragen würde, ist damit widerlegt.
`adminLevelHead` wäre keine totale Funktion über `AdminLevelId`, sondern müsste für eine Stufe
werfen und für zwei weitere einen Wert liefern, den keine Datei zeigt. Nach Projektlinie wird dafür
kein Mechanismus gebaut.

### 6.2 Der Widerspruch zur Notiz vom 5. August, aufgelöst

Abschnitt 3 jener Notiz ist **in jeder Zahl richtig und in seiner Überschrift falsch**: er vermisst
nicht die Kopfmarke einer Verwaltungsstufe, sondern die **Eigendarstellung** 5.7.x. Beide Familien
selbst nachgemessen:

| Merkmal | Kopfmarke (D.3/D.4) | Eigendarstellung (5.7.x) |
|---|---|---|
| Markenhülle | 3,7137 × 4,0001 | 5,4458 × 6,0004 |
| Teilung | 5 | 6 |
| senkrechte Lage | Zonenoberkante y = 0, `cyFromTop` 2 | `cy` = 16 (Mitte der Grundfläche) |
| Körper | ja | **keiner** |

Zwei der drei tragenden Zahlen sind andere. Die vollständigen Messwerte der Eigendarstellung, damit
sie nicht ein drittes Mal gesucht werden müssen: 5.7.1 → 16,0001; 5.7.2 → 10,0000 · 22,0001;
5.7.3 → 10,0000 · 16,0004 · 22,0001; 5.7.4 → 7,0000 · 13,0004 · 19,0001 · 25,0001; 5.7.5 → 4,0000 ·
10,0004 · 16,0001 · 22,0001 · 27,9998; 5.7.6 dreireihig → 13,0000 · 18,9997 (cy 12,5002), 7,0000 ·
24,9998 (cy 15,9999), 13,0000 · 18,9997 (cy 19,5003). Die Reihenaufteilung von 5.7.6, die die Notiz
vom 5. August offenließ, ist damit vermessen.

Die 5.7.x-Dateien verhalten sich zu den Kopfmarken wie 5.4.1 bis 5.4.4 zur Stärkekopfzone — und
genau diese Kategorie weist die Notiz vom 4. August selbst als „sind aber selbst keine Kopfzonen"
aus. Damit ist auch der Nachtrag vom 5. August für seinen eigenen Zweck falsch: es fehlte **nicht**
nur noch der Konsument in der Kopfzone von `compose()`. Beide Notizen haben acht Referenzdateien
übersehen, die es zu ihrem Zeitpunkt bereits gab.

### 6.3 Geprüfte und verworfene Wege

**Die Kopfmarke als `HeadShape` bauen: nicht möglich.** `HeadMark` ist `{ cxMm, cyFromTopMm, rMm }`
— selbst nachgelesen — und kann nur Kreise ausdrücken. Die Marke ist ein sechsstrahliger Stern aus
drei gekreuzten Strichen; drei gedrehte Rechtecke unter dem `OUTLINE`-Stil zeichneten die inneren
Kreuzungskanten mit.

**Die fehlenden drei Stufen aus der Teilung ableiten: verworfen**, siehe 6.1. Die einzige prüfbare
Skalierung widerlegt die Regel.

**Nur die drei belegten Stufen bauen und die übrigen werfen lassen: verworfen.** Das wäre ein
Mechanismus mit drei Werten und drei Löchern, ohne Aufrufer. Die Zahlen stehen stattdessen in dieser
Notiz, und das kostet nichts.

**Einen Typ bauen, der die Kollision von Stärkegrad und Verwaltungsstufe unmöglich macht:
gangbar, kauft aber nichts.** Eine unterscheidende Vereinigung auf `SymbolSpec` (etwa
`head?: { strength } | { administrativeLevel }`) wäre keine Attrappe — beide Zweige sind fachlich
belegt. Solange `administrativeLevel` aber ausnahmslos abgelehnt wird, ist der zweite Zweig
unerreichbar und `head-zone-conflict` bewacht ohnehin einen unerreichbaren Zustand. Der Umbau zöge
alle 40 Rezepte und die drei Belegfälle des Kompositionsmotors nach — und damit die Zusicherung,
dass dieser Slice keinen bestehenden Snapshot ändert. Der Preis ist real, der Gewinn null.
`head-zone-conflict` bleibt stehen, mit dem Hinweis im Quelltext, dass sie derzeit nie allein meldet.

### 6.4 Der stille Ausfall ist geschlossen

`validateSpec({kind:'formation', administrativeLevel:'kreis'})` lieferte bis hierher `[]`, und
`compose()` erzeugte byteidentisches SVG mit und ohne das Feld — die Angabe wurde still verschluckt.
Selbst ausgeführt, seit diesem Slice:

```
→ administrative-level-not-implemented: Eine Verwaltungsstufe wird noch nicht gezeichnet: die
  Kopfmarken aus D.3/D.4 sind für drei der sechs Stufen an der Referenz gar nicht belegt.
  Die Angabe würde still verschluckt.
```

**Provenienz, ausdrücklich:** dieser Ausfall ist **vorbestehend** und nicht von LFH-424 erzeugt. Der
Fahrzeugkategoriefall war ein anderer — er wurde erst dadurch erreichbar, dass `vehicle-land` in
`BASE_SYMBOLS` kam, und ist in demselben Slice geschlossen worden, der ihn erzeugt hat. Ein späterer
Leser soll nicht beide diesem Ticket zuschreiben.

### 6.5 Zwei Verwechslungsbefunde für jede künftige Gateentscheidung

**I — Kopfmarke gegen Stärkegrad.** Die Kopfmarken der Stufe `kreis` liegen auf cx 11,0000 /
21,0000 — denselben x-Werten wie der Stärkegrad `gruppe` —, und die senkrechten Zonen überlappen
(0 … 4 gegen 1 … 4). Unterschieden werden sie **allein durch die Markenform**: Kreis r 1,5 gegen
Stern L 4. Ein Gate, das nur Markenzahl und Markenlage prüft, verwechselt sie.

**II — Sternmarke gegen Schneefallstärke.** Dieselbe Sternform der Eigendarstellung (Hülle 5,4458 ×
6,0004) steht in vier weiteren Dateien, die mit Verwaltungsstufen nichts zu tun haben. Selbst
gemessen: `5.8.7_Beispiel_Schneiend_schwach` → 16,0004; `_mittel` → 12,0003 · 20,0002; `_stark` →
7,9999 · 16,0001 · 24,0002; `_extrem` → 4,0000 · 12,0004 · 19,9999 · 28,0001 — alle bei cy ≈ 26,011
und mit Teilung **8** statt 6. Es trennt sie ausschließlich die Zone, nicht die Form.

---

## 7. Posten 5 — das Kreiskörperprofil ist ein gemessenes Negativ

**Urteil: begründet offen. Das folgt dem Baubeschluss.**

**Welches Zeichen den Posten nicht braucht: keines der 661 Referenzzeichen.** Eigener Zensus, zwei
bewusst enge Merkmale:

- **109 Dateien** tragen eine Marke von 3 mm Mittelliniendurchmesser mit Mittelpunkt oberhalb
  y = 8 mm, also im Kopfzonenraster;
- **36 Dateien** tragen einen echten Kreiskörper: geschlossener Subpfad **nur aus Kubiken**,
  quadratische Hülle mit 22 bis 31 mm Kantenlänge, Kreisförmigkeit auf 0,05 mm geprüft;
- **die Schnittmenge ist leer.**

Die Kreisförmigkeitsprüfung ist der Punkt, an dem eine schlampigere Zählung kippt: ein gedrehtes
Quadrat hat dieselbe quadratische Hülle wie ein Kreis, und ohne diese Prüfung erschienen die
`D.3.x`-Zeichen mit Rautenkörper fälschlich in der Schnittmenge.

### 7.1 Eine Zahl, die dieser Slice selbst berichtigt

Der Wurftext von `circleBodyProfile.place()` nannte **80** Kopfmarkendateien. Ich zähle **109**, und
der Unterschied ist die Falle, die die E-c-Notiz für die Kopfmarken von E.1.33 bis E.1.35 schon
einmal benannt hat: **80** Dateien zeichnen ihre 3-mm-Marke als Pfad, **43** als
`<circle>`-Element, und **14** führen beide Formen — Vereinigung 80 + 43 − 14 = **109**. Wer nur
nach `<path>` sucht, sieht 80 und übersieht 29. Die
Schnittmenge bleibt in beiden Zählungen 0 — das Urteil ist unberührt —, aber die bestandsweite Zahl
war zu klein. Wurftext, Kommentar und Test sind auf 109 gezogen; das Kriterium steht jetzt im
Quelltext.

### 7.2 Beide Lesarten des Postens fallen auf „offen"

Der aufgeschobene Posten ist `circleBodyProfile` in `packages/core/src/layout/profiles.ts`, dessen
`place()` bewusst wirft — **nicht** ein zweites `ProfileId` in `packages/catalog/src/profiles.ts`.
Beide Lesarten sind beantwortet:

- **Als `place()`:** gemessenes Negativ, siehe oben. Der Wurf bleibt, aber er behauptet jetzt nicht
  mehr „ist nicht belegt", sondern nennt die Zählung. Ein gemessenes Negativ ist etwas anderes als
  ein Platzhalter, und der Text soll das sagen.
- **Als zweites Profil:** der Bestand enthält keine regionale Variante irgendeines Zeichens. Wo ein
  Kreis steht, ist er die Abschnittsentscheidung der Quelle (Funktionsstelle, Station,
  Basisstation) und nicht die Abweichung eines Trägers vom Bundesstandard. Ein `ProfileId
  'kreiskoerper'` wäre genau die Attrappe, die dieses Projekt verbietet — und ein Profileintrag
  kann heute ohnehin nichts überschreiben, `profiles.ts` sagt das ausdrücklich.

**Die Folge, die das Ticket nicht erwartet:** die Profil-Layering-Aufgabe verliert damit ihren
Kandidaten für das zweite Profil. Sie kann ihre Auflösungsreihenfolge an diesem Posten nicht prüfen
und braucht einen anderen. Das ist die eigentliche Nachricht dieses Urteils, nicht die Ablehnung
selbst.

### 7.3 Ein Nebenbefund derselben Zählung

Der Radienzensus der 36 Kreiskörper ergibt **32 mit r 12,25** und **sechs mit r 11,75** — Ringpaare
zur Mittellinie r 12,0 —, dazu zwei Dateien mit einem r-14-Kreis. Deren eine ist
`1.6_Funktionsstelle.svg`, die `post` deckt: ihr Ringpaar misst 1,7526 / 1,7522 / 30,2475 / 30,2475
außen und 2,2525 / 2,2525 / 29,7473 / 29,7473 innen, Mittellinienradius also **13,9975** um (16|16).
Die andere ist `5.8.7.3_Bedeckung des Himmels 4 von 8.svg` mit Außenradius 14,2399.

Ein aus `post` zusammengesetztes Zeichen läge damit gegen jede Referenzdatei mit Kreiskörper 2 mm
zu groß. Die Regel zwischen 12 und 14 ist nicht vermessen; es gibt keine Datei, die denselben
Zeicheninhalt einmal mit 14 und einmal mit 12 zeigt. Eigenes Ticket — ohne belegte Umrechnung wäre
jede Regel geraten.

---

## 8. Berichtigungen an älteren Notizen und am Baubeschluss

Alle selbst nachgeprüft. Die betroffenen Dokumente tragen datierte Nachträge; die falschen Sätze
bleiben dort sichtbar stehen.

**(a) Die Formklasse von `1.13`: das Ticket irrt, die Notiz vom 4. August nicht.** Die
Ticketformulierung schreibt, der Fingerprint trage „als einzige Klasse `outline`". Selbst
ausgelesen: `fingerprints.json` führt für `1.13_Ereignis.svg` genau **eine** Form mit
`kind: 'bounds'`, `fills: []`, `curvedPaths: 0`. Die Notiz vom 4. August schreibt an dieser Stelle
selbst „der Fingerprint zu `1.13` trägt als einzige Form ein `bounds`" — sie ist also richtig, und
eine Berichtigung, die ihr das Gegenteil zuschriebe, wäre selbst falsch.

**(b) Der angekündigte Extraktorfix wurde nie gebaut.** Die Notiz vom 4. August setzt in Klammern
voraus, fill-lose `<polygon>`-Elemente würden „inzwischen korrekt als `outline` statt fälschlich als
`bounds`" eingeordnet. Selbst gelesen, `packages/cli/src/scan/extract.ts`: die Polygonschleife
überspringt nur `fill === 'none'`; ein **fehlendes** `fill` fällt durch und bekommt `kind: 'bounds'`.
`1.13` trägt gar kein `fill`-Attribut. Ohne Wirkung auf die Gatebarkeit, weil es die einzige Form
der Datei ist — die Schlussfolgerung hält, ihre Begründung nicht.

**(c) Es scheitern alle vier Kanten, nicht eine.** Siehe 3.1. Notiz vom 4. August: `minX`; Nachtrag
vom 5. August: `maxY`. Gemessen: 0,5896 / 0,3912 / −0,5868 / −1,2784.

**(d) „Nicht vermessbar" war eine Aussage über den Extraktor.** Siehe Abschnitt 1. Die Spalte
„belegbar?" der Notiz vom 5. August ist für alle fünf widerlegt, „Form nein" für 1.3/1.4/1.5/1.14
ebenso, und „`1.9` belegbar: nein" am deutlichsten.

**(e) Offen gegen geschlossen ist gateable.** Siehe 3.4. Die Warnung der Notiz vom 5. August gilt für
Mittellinienvergleiche.

**(f) `head-zone-conflict` deckt `vehicleCategory` nicht ab.** Selbst gelesen: die Regel prüft
ausschließlich `spec.strength` gegen `spec.administrativeLevel`. Die Notiz vom 4. August schreibt
ihr die Fahrzeugkategorie zu. Ihre Begründung („belegen beide die Kopfzone") trüge dafür auch
geometrisch nicht — die Stärke sitzt oben, das Fahrwerk unten.

**(g) `hilfsorganisation` hat eine Referenzdatei.** Siehe Abschnitt 4. Betroffen sind die Notiz vom
4. August (Abschnitt 4), der frühere Kommentar in `organizations.ts`, der in `elements.ts` und der
Design-Spec vom 5. August.

**(h) Abschnitt 3 der Notiz vom 5. August vermisst die Eigendarstellung, nicht die Kopfmarke.**
Siehe 6.2.

**(i) Am Baubeschluss: die 1.9-Eckradien und die 1.14-Begründung.** Er gibt die Radienabweichung mit
0,0003 mm an; ich messe **0,00109 mm**. An der Einordnung ändert das nichts (0,0031 Einheiten bei
Toleranz 0,01), aber die Zahl war zu klein. Und seine zwei Belege gegen das glatte Paar 6,5/7,5
reproduzieren sich nicht — siehe 2.4.

---

## 9. Befunde an der Quelle

Daten, kein `deviation`-Status: hier weicht die Quelle von sich selbst ab, nicht die Umsetzung von
der Quelle. Alle sechs selbst gemessen.

1. **`1.3` ist nicht exakt spiegelsymmetrisch.** Kontrollpunkte 7,0891 links gegen 7,0887 rechts,
   Scheitel 7,9999 gegen 8,0003 — eine Exportrundungsstufe. Der Katalog mittelt.
2. **`E.2.27` bis `E.2.31` sind nicht das `vehicle-water` aus Kapitel 1.** Die fünf tragen die
   Füllhülle **1,0100 / 7,9999 / 30,9894 / 22,9898**, `1.5_Wasserfahrzeug.svg` trägt **1,0001 /
   9,0001 / 31,0000 / 24,0002** — 1,0 mm Versatz bei einer Toleranz von 0,01. Und die E.2-Hülle ist
   zufällig fast identisch mit der von `1.4_Luftfahrzeug.svg` (1,0001 / 7,9999 / 31,0003 / 23,0001)
   bei **entgegengesetzter** Halbkreisorientierung. Ein Gate, das nur Hüllen vergleicht, nähme hier
   die falsche Form an.
3. **`5.1.1.5 Kettenfahrzeug` zieht seine Stadionenden ein**: 4,25 / 27,75 statt der Radplätze
   3,75 / 28,25 derselben Familie.
4. **`5.1.2_Fahrzeug_geschützt` ist nicht die exakte Spiegelung von
   `5.1.1_Fahrzeug_ungeschützt`.** Gemessene Füllhüllen **1,0001 / 6,2502 / 31,0003 / 26,2502**
   gegen **0,9998 / 5,7503 / 31,0000 / 26,0004** — die flache Kante liegt 0,25 mm daneben, die
   gewölbte um dieselben 0,25 mm. Wer den geschützten Körper durch Spiegeln des ungeschützten
   erzeugte, verfehlte die Referenz um das Fünfundzwanzigfache der Toleranz.
5. **Der Bestand mischt die Fugenmodelle.** `1.7 Gebäude` ist mit Gehrung bei 0,5 mm gezeichnet,
   `1.10 Maßnahme` mit Fase bei 1,0 mm. Eine Strichhüllenrechnung über die Formklasse `outline`
   verfehlte `1.10` um 0,71 Einheiten.
6. **`E.2.23` widerspricht seinem eigenen Namen.** Die Datei heißt „Anhänger Netzersatzanlage, von
   LKW gezogen", trägt aber **ein** Rad bei cx 17,4999 — dieselbe Bauform wie `E.2.22` („Anhänger
   Grundzeichen") und `E.2.25` („von PKW gezogen"). Nur `E.2.24` trägt zwei Räder (14,2501 /
   19,7503).
7. **Der 0,6-mm-Radienraster von `1.9`.** Zehn Radien, alle auf Vielfachen von 0,6 mm, größte
   Abweichung 0,00109 mm — ein Entwurfsraster, das in keinem anderen Zeichen des Kapitels vorkommt.

---

## Evidenz

Alle Kommandos aus dem Repo-Root, Zweig `claude/lfh-424-grundlagen`, am 18. August 2026 selbst
gelaufen.

**Die vier Gates.**

- `pnpm typecheck` → `$ tsc --noEmit`, keine Ausgabe, Exitcode 0.
- `pnpm test` → **59 Testdateien / 3228 Tests grün**, keine übersprungenen.
- `pnpm cli coverage` → Exitcode 0:

```
Baseline:    bbk-babz-2025
Kernversion: 0.1.0 (Profil "bund": 0.1.0)
Umfang:      1, 2, 4, 5.1.1, 5.4, 5.8, C.1.1, C.1.2, D.3.7, E.1, J.1, J.2, J.3, J.4, K, L, M
Einträge:    325
Quellen:     13
Offene fachliche Reviews: 339 (325 Manifestreviews, 13 Quellenreviews, 1 Profilreview)
  Offene fachliche Reviews nach Bereich: 4: 92, 5: 76, J: 53, E: 37, K: 18, 1: 14, M: 14, L: 10, 2: 8, C: 2, D: 1
Coverage-Gate bestanden.
```

- `git diff --check` → keine Ausgabe, Exitcode 0.

**Die Baseline ist eigens gemessen, nicht aus einer Notiz übernommen.** Ich habe ein
`git worktree` auf `HEAD` (`bd45a68`) angelegt und dort dieselbe CLI laufen lassen:

```
Umfang:      1, 2, 4, 5.4, 5.8, C.1.1, C.1.2, D.3.7, E.1, J.1, J.2, J.3, J.4, K, L, M
Einträge:    313
Offene fachliche Reviews: 327 (313 Manifestreviews, 13 Quellenreviews, 1 Profilreview)
  … nach Bereich: 4: 92, 5: 71, J: 53, E: 37, K: 18, M: 14, L: 10, 1: 8, 2: 7, C: 2, D: 1
```

Der Vergleich: Einträge **313 → 325**, Reviews **327 → 339**, Bereich 1 **8 → 14** (die sechs
Grundzeichen), Bereich 2 **7 → 8** (`hilfsorganisation`), Bereich 5 **71 → 76** (die fünf
Fahrzeugkategorien), alle übrigen Bereiche unverändert. Der Umfang wächst um **eine** Zeile,
`5.1.1` — und ausdrücklich nicht um `5.1`, weil von Kapitel 5.1 allein die Fahrzeugkategorien
umgesetzt sind. Kapitel 1 und 2 standen schon als ganze Kapitel im Umfang; die sechs neuen
Grundzeichen füllen den Anspruch, sie erweitern ihn nicht.

**Snapshots.** `git status --porcelain packages/catalog/src/__snapshots__` → **zwölf neue Dateien
(`??`), null geänderte (`M`)**. Nachgezählt gegen `HEAD`: das Wurzelverzeichnis wächst von 48 auf
**54** SVG-Dateien, `multi-size/` von 303 auf **309**. **Kein bestehendes Zeichen ändert sein
Bild** — das ist die schärfste Kontrolle dieses Slice, und sie hält. Sie ist zugleich eine
Feststellung über eine Lücke: die Fahrwerkszone kommt in keinem eingecheckten Bild vor, weil kein
Katalogeintrag `vehicleCategory` setzt (siehe offene Kanten).

**Referenzvermessung.** Eigener Pfadparser in Python (`M/m L/l H/h V/v C/c S/s Q/q T/t Z/z`,
analytische Kubik-Extrema, keine Abtastung für Hüllen), kalibriert an den drei eingecheckten
Kennwerten oben. Damit gemessen: die Füllebenen und Umrissebenen von 1.3, 1.4, 1.5, 1.7, 1.9, 1.10,
1.13, 1.14 und 1.6; die Ebenen aller 21 Dateien aus Kapitel 2; die fünf Musterblätter 5.1.1.1 bis
5.1.1.6 samt 5.1.1.4; alle 31 E.2-Dateien; alle sechs 5.7.x; alle acht D.3/D.4-Träger; die vier
`5.8.7_Beispiel_Schneiend_*`; und ein Zensus über alle 661 Dateien für Posten 5.

**Formvergleich statt Hüllenvergleich.** Referenzkurve gegen Katalogkurve, beidseitig, je rund 200
Stützstellen pro Segment — Tabelle in 2.2. Größter Wert 0,00083 mm.

**Kernläufe.** `matchFingerprint` für `1.13` in beiden Modi (Ausgabe in 3.1; `stroke-outline` →
`ok=true`) und für die fünf ungegateten (je „Keine vergleichbare Form"). `validateSpec` und
`composeFromCatalog` für die vier Ablehnungen (Ausgaben in 2.5, 5.4, 5.5, 6.4). `boundsOfMm` und
`strokeBoundsOfMm` über alle sechs neuen Körper. `relativeLuminance` über die acht Organisationen.
`COVERAGE_MANIFEST` ausgelesen für die Nachweisarten der neuen Zeilen.

**Was nicht von mir gemessen ist**, und deshalb hier steht: die Pixelzahlen zum gefüllten
`1.13`-Dreieck (936 gegen 142), die Rasterprüfung mit Jaccard-Werten gegen die 5.1.1-Musterblätter,
die Zonenmessungen an `E.2.1` und `E.2.4` (Grundlinien 18,0000 und 24,0000), die
Kasa-Gegenrechnung zu `1.14` und die `boxMm`-Zahlen des alten Pfadzweigs. Sie stammen aus dem Bau.
Ich habe sie übernommen, wo sie ein Argument stützen, das anderweitig belegt ist, und sie sind an
Ort und Stelle als fremd gekennzeichnet.

---

## Sichtprüfung

Für diese Notiz sind **zwei** Bilder gerastert worden, beide mit `@resvg/resvg-js` und
Schriftbindung über `resvgFontOptions()` aus `packages/catalog/src/fonts.ts`.

### Die sechs neuen Grundzeichen, paarweise

Ein gemeinsames Wrapper-SVG, sechs Zeilen, links die Referenzdatei und rechts der eingecheckte
Snapshot, je 240 px Kachel, einmal gerastert. Zur Einzelbetrachtung ist jedes Paar zusätzlich mit
560 px Kachel angesehen worden. Was ich sehe, Paar für Paar:

**1.3 Landfahrzeug.** Beide Seiten zeigen ein liegendes Rechteck, dessen Oberkante in einer flachen,
symmetrischen Kurve nach unten durchhängt; an beiden oberen Ecken läuft die Kontur in eine feine
Spitze aus, weil die Kurve dort schräg auf die senkrechte Kante trifft. Die Referenz ist weiß
gefüllt, der Katalogkörper führt `fill: none` — auf weißem Grund ist das nicht zu sehen. Ich finde
keinen Unterschied in Lage, Durchhang oder Strichstärke.

**1.4 Luftfahrzeug.** Beide zeigen eine Halbkreiskuppe auf einer waagerechten Grundlinie. Der
Scheitel steht in beiden Bildern auf derselben Höhe, und die Kurve trifft die Grundlinie links wie
rechts senkrecht — der Übergang ist in beiden gleich glatt, ohne Knick.

**1.5 Wasserfahrzeug.** Dasselbe Bild gespiegelt: waagerechte Oberkante, darunter ein Halbkreis, der
nach unten ausbaucht. Beide Seiten deckungsgleich. Der Halbkreis ist sichtbar tiefer als die Kuppe
von 1.4 hoch ist — das ist der gemessene Unterschied der Mittelpunkte (16|9) gegen (16|23) bei
gleichem Radius, und er steht in beiden Spalten gleich.

**1.9 Gebiet.** Eine unregelmäßige, geschlossene Fläche mit zehn abgerundeten Ecken; unten rechts
springt die Kontur in einer schmalen Einbuchtung nach innen, links unten läuft sie in eine breite
Rundung aus. Ich habe die Zahl der Ecken und die Richtung jedes Knicks an beiden Seiten
durchgezählt: gleich. Auch die drei sichtbar engeren Rundungen (unten rechts zwei, links oben eine)
sitzen an denselben Stellen.

**1.13 Ereignis.** Beide zeigen einen **offenen Haken**: zwei Striche, die sich unten in einer
spitzen Kehle treffen und nach oben auseinanderlaufen. Die beiden oberen Enden sind stumpf
abgeschnitten, und der Schnitt steht in beiden Bildern schräg — senkrecht zur Strichrichtung, also
eine Stumpfkappe. **Nichts ist gefüllt.** Genau das ist der Fall, den `compose()` seit diesem Slice
verweigert, und im Bild ist zu sehen, warum: eine Füllung machte aus dem Haken ein Dreieck.

**1.14 Spontanhelfer.** Ein vierblättriger Kleeblattumriss, oben, unten, links und rechts je ein
Lappen. An den vier Fugen zwischen den Lappen sitzt eine feine, nach innen zeigende Spitze — die
Gehrung der Innenkontur. Sie ist auf beiden Seiten gleich lang und gleich scharf. Das war die
Stelle, an der die Messung 0,31 mm statt 0,25 mm zur Außenkontur ergibt, und sie ist im Bild
unauffällig, weil die Referenz dort genauso zeichnet.

**Ergebnis: in allen sechs Paaren finde ich keinen sichtbaren Unterschied.** Das deckt sich mit dem
gemessenen größten Kurvenabstand von 0,00083 mm.

### Das Musterbild der Fahrwerkszone

Der Baubeschluss verlangt ein Musterbild, wenn Kopfmarken gebaut wurden. Gebaut wurde stattdessen
die Fahrwerkszone — und für sie ist ein Bild **dringender** als für Kopfmarken, weil sie in keinem
eingecheckten Snapshot vorkommt. Fünf Zeilen, links die Referenzdatei `5.1.1.x`, rechts
`composeFromCatalog({ kind: 'vehicle-land', vehicleCategory: … })` frisch gerendert:

- **Kategorie 1** — zwei Kreise unter der linken und rechten unteren Körperecke, beide vollständig
  außerhalb der Körperfläche und die Körperunterkante genau berührend. Referenz und Katalog gleich.
- **Kategorie 2** — dieselben zwei plus ein dritter mittig. Die drei sitzen in beiden Spalten auf
  derselben Höhe und mit denselben Abständen.
- **Kategorie 3** — dieselben drei, verbunden durch zwei waagerechte Striche auf Höhe der
  Kreismitten. Die Striche laufen in beiden Bildern **unter** die Ringe und nicht durch sie
  hindurch; die Innenfläche des mittleren Rads bleibt in beiden ein unverletzter Kreis. Das ist die
  Bandmessung aus 5.3, im Bild bestätigt.
- **Kettenfahrzeug** — ein liegendes Stadion, also ein Rechteck mit halbkreisförmigen Enden. Die
  Enden sind auf beiden Seiten **rund**; das ist der Punkt, an dem ein verlorenes `rx` sofort zu
  sehen wäre.
- **Schienenfahrzeug** — zwei Paare zu je zwei Kreisen, außen bündig, innen eng zusammenstehend.
  Die Paarabstände stimmen in beiden Spalten überein.

Ich finde in allen fünf Zeilen keinen Formunterschied. Der pixelgenaue Abgleich mit Jaccard-Werten
stammt aus dem Bau und ist von mir nicht wiederholt worden; das Bild hier ist meine eigene Prüfung.

### Kapitel 2

Ein vierter Bogen zeigt 2.1, 2.2, 2.3 und 2.8 nebeneinander. Ich lese mit bloßem Auge: **„Fw"** auf
Rot, **„HiOrg"** auf Weiß, **„THW"** auf Blau, **„ZIV"** auf Grau. Das Kürzel auf 2.2 ist damit
gelesen und nicht erschlossen — die Grundlage von Posten 3.

**Das ist eine Eigenkontrolle und ersetzt kein Prüfprotokoll**: eine Größe, ein Theme, mit dem Auge
gelesen. Die Bilder liegen im Scratchpad und nicht im Repository, weil der Referenzordner
`taktische-zeichen/` nie eingecheckt wird — derselbe Grund, aus dem jeder Rasterabgleich dieses
Projekts außerhalb von CI läuft.

---

## Offene Kanten

### Neu aus diesem Slice

- **Die Fahrwerkszone erscheint in keinem eingecheckten gerenderten Artefakt — die größte Lücke
  dieses Slice.** Kein Katalogeintrag und kein Rezept setzt `vehicleCategory`; damit sieht kein
  Snapshot, kein Mehrgrößenfall, kein Themebogen und kein Kontrastgate jemals eine Marke mit
  `role: 'chassis'`. Die saubere Snapshotzeile in der Evidenz ist deshalb **keine** Deckung, sondern
  ihre Abwesenheit. Geschlossen ist die Lücke nur so weit, wie es ohne Katalogeintrag geht: drei
  Zusicherungen halten die **Rendererausgabe** je Markenart fest (Kreis, Rechteck mit `rx`, Linie).
  Sobald ein E.2-Zeichen in den Umfang kommt, schließt sie sich von selbst.
- **Sechs der vierzehn Grundzeichen sind für `checkClipping` unerreichbar.** Die fünf Pfadkörper und
  der offene Polyzug von `1.13` haben kein Flächenmodell — `checkClipping` unterstützt achsparallele
  oder gedrehte Rechtecke, Kreise und geschlossene **konvexe** Polygone, und `1.9` (Einbuchtung) wie
  `1.14` (Vierlappen) sind nicht konvex. Auf ihnen kann heute kein Piktogramm autorisiert werden,
  und nichts prüft, dass es niemand versucht. `BODY_CASES` nennt die acht prüfbaren jetzt
  ausdrücklich, damit ein künftiger Kurvenkörper nicht lautlos herausfällt.
- **`boundsOfMm` rechnet Pfade, `shiftY` lehnt sie weiter ab.** Für diesen Slice folgenlos: alle
  neuen Körper stehen auf `rectBodyProfile`, dessen `place()` `shiftY` nur bei einer Kopfzone ruft,
  und keiner der sechs trägt eine. Sobald ein Kurvenkörper eine Kopfzone bekommt, wirft die
  Platzierung — bewusst, aber die Kante rückt näher.
- **`ORGANIZATION_BODY_DASHES.weiss` ist deklariert, aber nirgends abgebildet.** Kein Katalogeintrag
  verwendet `hilfsorganisation`. Gedeckt ist die Signatur allein von der Eindeutigkeitszusicherung
  im Kontrastgate; ihre Lesbarkeit im Bild ist ungeprüft — und sie ist das einzige Merkmal, das ein
  Zeichen mit `hilfsorganisation` von einem organisationslosen unterscheidet.
- **Die Endpunkte des Kategorie-3-Verbindungsstrichs sind gewählt, nicht gemessen.** Das Band ist
  vermessen und 0,49 mm breit, die Lage darin ist die Bandmitte. Für das Bild folgenlos, für eine
  spätere Quellenrückfrage nicht.
- **Die Wellenlinie von `5.1.1.4`.** Strichhülle vermessen, Kurvenzug nicht.
  `vehicleChassis('amphibienfahrzeug')` wirft.
- **Die Verwechslungsbefunde aus 6.5.** Sie sind Anforderungen an ein Gate, das es noch nicht gibt.

### Weitergereicht, unverändert offen

- **Der Radiussprung des Kreiskörpers** (r 12 gegen r 14, siehe 7.3). Eigenes Ticket.
- **`5.1.1.8`, `5.1.1.9` und die Unterkapitel 5.1.2 bis 5.1.4** sind nicht vermessen, außer wo
  Posten 4a sie gebraucht hat (von `5.1.1.7` sind die fünf Radplätze vermessen, von `5.1.2`,
  `5.1.2.5` und `5.1.4.x` je das, was ein Befund oben braucht). Deshalb steht der Umfang bei `5.1.1`. `uncoveredScope` meldet eine
  Lücke **innerhalb** von 5.1.1 nicht — dass 5.1.1.4 fehlt, hält allein ein Test fest.
- **Die Zuordnung „Kategorie 1/2/3 = straßenfähig/geländefähig/geländegängig"** ist nicht vermessen,
  sondern aus der Mehrheit der E.2-Dateinamen abgeleitet, und vier der 31 E.2-Dateien widersprechen
  ihrem eigenen Namen. Fachliche Frage, keine Messfrage.
- **Die Ebene `Flächige_Fülung` als allgemeine Extraktorquelle.** Dass sie bei 1.3, 1.4, 1.5 und 1.9
  die Mittellinie verbatim trägt, ist gemessen. Dass sie das bei den übrigen Dateien mit `<path>` in
  dieser Ebene ebenso tut, ist eine Erwartung aus der Exportmechanik. Eigenes Ticket — mit der
  Warnung der Notiz vom 5. August, dass von 44 strukturellen Kandidaten nur 6 verwertbar waren.
- **Ein technisches `deviation` erscheint in keinem Release-Blocker.** `ReleaseBlockers` kennt
  ausschließlich `review.domain`. Die Frage richtet sich an das Reviewmodell, nicht an diesen Slice.

---

## Ausblick: was Anhang E.2 nach diesem Slice noch braucht

Die Ticketformulierung sagt: „Ohne Posten 4 ist kein einziges der 31 E.2-Zeichen baubar." Das
stimmt. Der Baubeschluss verschärft: „Auch **mit** Posten 4 wäre keines baubar." Das stimmt nicht
mehr — **20 der 31 sind nach diesem Stand als Komposition spezifizierbar**, und der Grund ist eine
Zahl, die im Beschluss fehlte: seine vier fehlenden Körperformen betreffen **dieselben elf**
Zeichen.

Die 20 stehen sämtlich auf `vehicle-land` und tragen eine der drei Kfz-Kategorien oder die Kette.
Die Aufteilung ist selbst gemessen — Kategorie 2 und 3 teilen dieselben drei Radplätze und werden
allein durch die zwei Verbindungsstriche getrennt, nachgewiesen an den Zwischenräumen der Hülle
9,2629 × 1,7498 mm bei y 26,2502 (`5.1.1.2` führt keinen, `5.1.1.3` zwei):

| Kategorie | Zahl | Zeichen |
|---|---|---|
| `kfz-kategorie-1` | 7 | E.2.1, .2, .5, .14, .16, .17, .20 |
| `kfz-kategorie-2` | 7 | E.2.3, .10, .12, .13, .18, .19, .21 |
| `kfz-kategorie-3` | 5 | E.2.4, .6, .7, .8, .11 |
| `kettenfahrzeug` | 1 | E.2.9 |

`E.2.15` trägt zwar die Fahrwerkszone der Kategorie 1, aber einen eigenen Körper und zählt deshalb
zu den elf offenen. Die Erreichbarkeit der 20 ist im Repo nachprüfbar: `E.2.1` ist als `Recipe`
formuliert und über `composeFromCatalog` gezeichnet.

**Woran die elf übrigen hängen.** Die vier Füllhüllen unten sind mit demselben Parser selbst
gemessen wie alles Übrige in dieser Notiz; fremd ist in diesem Abschnitt allein die Zonenfrage am
Ende:

| Fehlt | betroffen | gemessene Füllhülle |
|---|---|---|
| Anhängerkörper mit Deichsel | E.2.22 – E.2.25 (4) | 3,9998 / 5,7503 / 31,0000 / 26,0004 plus Deichsel |
| Wechselladerkörper | E.2.15 (1) | Aufbau 2,5001 / 6,0000 / 31,0000 / 24,5004 über einem eigenen Fahrzeugkörper |
| Rechteckkörper | E.2.26 (1) | 3,0000 / 1,9999 / 29,0001 / 29,9999 — kommt weder in Kapitel 1 noch in 5.1 vor |
| E.2-Wasserfahrzeugkörper | E.2.27 – E.2.31 (5) | 1,0100 / 7,9999 / 30,9894 / 22,9898 — **nicht** `vehicle-water`, siehe Befund 2 |

Dazu **zwei Taxonomie-IDs**: `VehicleCategoryId` kennt keinen Wert für die Anhängerfahrwerke. Ob
„von PKW gezogen" und „von LKW gezogen" überhaupt Fahrzeugkategorien im Sinne der Taxonomie sind
oder eine eigene Achse brauchen, ist eine fachliche Frage — und mit Befund 6 hat sie einen Fall, der
eine Vergabe heute zu einer Behauptung machte. Die Geometrie ist vermessen und steht oben; die IDs
werden **nicht** auf Vorrat vergeben.

Und **eine Zonenfrage**: die fünf Wasserfahrzeuge setzen ihr Trägerkürzel außerhalb des Körpers und
in Blau. Weder `label` (weiß, im Körper) noch `foot` (schwarz, mittig) deckt das. Diese Messung
stammt aus dem Bau und ist von mir nicht wiederholt.

**Die Fahrwerkszone selbst ist kein Blocker mehr.** Was E.2 in den Umfang bringt, ist eine
Entscheidung über 5.1.2 bis 5.1.4, die Vermessung der vier Körperformen, die fachliche Klärung der
Anhänger-IDs und eine Entscheidung zur vierten Beschriftungszone.

---

## Reviewgrenze

Diese Notiz trifft **keine fachliche Aussage**. Sie hält fest, wie die vierzehn Grundzeichen und
die fünf Fahrzeugkategorien gebaut sind und welche Entscheidungen dabei getroffen wurden.
Bedeutung, Verwechslungsfreiheit, Profilzuordnung und einsatztaktische Eignung bleiben — wie alle
339 offenen Reviews — einer entsprechend fachkundigen Person vorbehalten.

Bei diesem Slice wiegt das an vier Stellen schwerer als sonst:

- **`hilfsorganisation` ist an einem gelesenen Kürzel festgemacht.** Dass „HiOrg" für
  *Hilfsorganisation* steht, ist eine Lesart des Bildes; dass `2.2` trotz seines generischen
  Dateinamens **diese** Organisation meint, folgt aus der Vollständigkeit der Achterreihe und nicht
  aus einer Aussage der Quelle.
- **Die Zuordnung der drei Kfz-Kategorien zu straßenfähig/geländefähig/geländegängig ist nicht
  vermessen**, sondern aus Dateinamen abgeleitet, denen vier E.2-Dateien widersprechen.
- **`1.13` lässt ein Merkmal der Referenz bewusst unerreichbar**: es gibt keine Möglichkeit, ein
  Ereignis einzufärben. Ob das fachlich je gebraucht wird, entscheidet die Quelle nicht — sie zeigt
  nur, dass sie es nirgends tut.
- **Die zwei offenen Posten sind mit einem Negativ begründet.** „Kein Zeichen des Bestands braucht
  es" ist eine Aussage über den Bestand von heute, nicht über die Fachdomäne. Wer weiß, dass eine
  Verwaltungsstufe fachlich gebraucht wird, widerlegt damit nicht die Messung — aber er verschiebt
  das Urteil.
