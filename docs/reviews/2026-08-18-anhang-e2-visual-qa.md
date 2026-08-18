# E.2 — Visuelle QA aller 30 eingetragenen Darstellungen

> Prüfprotokoll · 18. August 2026 · Branch `claude/lfh-443-445-anhang-e2` · Teilslices E-d
> (LFH-443), E-e (LFH-444), E-f (LFH-445)

## 1. Methode

Wie bei E-a bis E-c war eine **paarweise** Gegenüberstellung möglich und nötig: jedes Zeichen ist
eine Komposition, die eine konkrete Referenzdatei reproduzieren soll. Referenz und Katalogausgabe
wurden in ein gemeinsames Wrapper-SVG gesetzt und **einmal** gerastert — links die BABZ-Datei,
rechts `composeFromCatalog` + `renderSvg`, dazwischen eine rote Trennlinie. Beide Seiten liegen als
verschachteltes `<svg>` im Wrapper und nicht als `<image href="data:…">`; diesen Fallstrick
beschreibt das E-c-Protokoll, und er ist hier nicht wiederholt worden. Gerastert mit
`@resvg/resvg-js` auf weißem Grund, Schriftbindung über `resvgFontOptions()`; jedes Paar 900 px
breit, also 450 px je Kachel.

**Kalibriert wurde vor der ersten Beschreibung, und zwar an E.2.27** — nicht an einem beliebigen
Zeichen. E.2.27 trägt in der Katalogausgabe **genau einen** Textlauf, das blaue `THW` unterhalb des
Rumpfes. Erscheint es, sind Verschachtelung und Schriftbindung beide belegt; bliebe die Kachel
textlos, wäre der Fehler am ersten Bild aufgefallen und nicht am dreißigsten. Es erschien.

**Geprüft wurden 30 Paare, nicht 31.** E.2.6 ist nicht gebaut; es hat eine Referenzdatei, aber keine
Katalogausgabe und kann deshalb nicht gepaart werden. Es bekommt in Abschnitt 5 eine eigene
Gegenüberstellung mit seinen beiden Nachbarn — Referenz gegen Referenz.

**Alle Zahlen dieses Protokolls stammen aus eigenen Läufen.** Wo eine Zahl **nicht** aus einer
eigenen Messung stammt, steht es an Ort und Stelle: „Normwert der Quelle" für die Sollwerte des
Regelwerks, „aus der Bauphase" für Zahlen, die in `recipes-anhang-e.ts` oder
`coverage-manifest.ts` stehen und die dieses Protokoll nicht nachgemessen hat. Fünf eigene Quellen:

- **Detektor A — helle Tinte** (eigene Rasterung, 2048 px = 64 px/mm): eingeschlossene weiße
  Zusammenhangskomponenten **ohne** schwarzen Nachbarn. Der weiße Innenrand der Referenz liegt am
  schwarzen Umriss an und fällt damit heraus, die Glyphen liegen allein in der Farbfläche. Läufe
  entstehen durch Gruppierung über die Überlappung der y-Intervalle — ohne Fenster, damit der
  Detektor auf beiden Seiten derselbe ist. Er liefert zugleich die **Glyphenzahl** je Lauf.
- **Detektor B — farbige Tinte außerhalb des Körpers** (dieselbe Rasterung): blaue Komponenten,
  deren Oberkante unterhalb der Unterkante der größten blauen Komponente liegt. Detektor A liefert
  für die vierte Zone von E.2.27 bis E.2.31 **nichts** — dieser Lauf ist blau auf Weiß und steht
  außerhalb des Körpers. Wer dort nur mit A misst, liest „keine Tinte" und schreibt einen
  Fehlbefund. Beide Detektoren laufen auf beiden Seiten jedes Paares gleich.
- **Konturmessung** (2048 px): Hüllrechteck aller dunklen deckenden Bildpunkte, und für die
  Fahrwerkszone die spaltenweise Gruppierung der dunklen Tinte unterhalb der Körperunterkante.
- **die Zwischendarstellung selbst** (`composeFromCatalog`): Schriftgrade, `minRenderPx`, Boxen,
  Rollen und Farbtoken der Primitive.
- **eigene Rechnung mit `contrastRatio()`** aus `packages/core/src/a11y/contrast.ts` für die
  Kontrastwerte in Abschnitt 10.

**Geprüfte Themes:** `reference` paarweise (alle 30). `accessible-light` und `print-monochrome`
über Kontaktbögen aller 30 bei 256 px. Für E.2 ist das keine Formalie: der Anhang malt mit `blau`,
und `blau` ist in beiden Alternativthemes ein anderer Wert — in E-f zusätzlich als **Textfarbe**
außerhalb des Körpers, was es im ganzen Bestand vorher nicht gab.

**Zusätzlich geprüft:** die Kleinrasterung bei den echten Zielgrößen 16, 24, 32 und 48 px, danach
punktweise ohne Interpolation vergrößert (eigener Vergrößerer: jeder Bildpunkt wird ein Quadrat,
Nearest Neighbour ohne Zwischenstufe). Gemessen wurde nicht nur das längste Kürzel, sondern auch
die **Fahrwerkszone** — sie ist in E.2 der einzige Träger der Fahrzeugkategorie, und anders als
Text hat sie keine deklarierte Mindestgröße.

**Vier Gates, alle vier selbst gelaufen** (nicht aus den Bauberichten übernommen, die in zwei
Zahlen voneinander abweichen):

| Gate | eigener Lauf | Ergebnis |
|---|---|---|
| `pnpm typecheck` | `tsc --noEmit` | keine Ausgabe, Exitcode 0 |
| `pnpm test` | vitest | **59 Testdateien, 3510 Tests**, alle grün |
| `pnpm cli coverage` | | **357 Einträge**, 13 Quellen, **371 offene fachliche Reviews**, davon **67 im Bereich E**; Gate bestanden |
| `pnpm cli audit:reference` | | 661 Kennzahlensätze geschrieben; Datei vorher kopiert, danach `diff -q` — **byteidentisch**, also idempotent |

**Snapshots:** `git status --short --untracked-files=all -- packages/catalog/src/__snapshots__`
liefert **60 neue (`??`) und null geänderte (`M`)** Dateien — 30 Einzel- und 30
Mehrgrößen-Snapshots. `git diff --stat` auf dasselbe Verzeichnis ist leer. Die 37 E.1-Snapshots,
die 14 Grundzeichen und die 309 Mehrgrößen-Snapshots des Bestands sind unberührt; das ist die
lasttragende Hälfte der Aussage und sie ist gemessen, nicht behauptet.

**Manifest:** eigener Lauf über `COVERAGE_MANIFEST.entries` — **30 E.2-Zeilen**, alle mit
`testEvidence: body-fingerprint + svg-snapshot`, alle mit offenem fachlichem Review, und **genau
eine** mit `review.technical.status === 'deviation'`: E.2.26. Im gesamten Bestand sind es fünf
(E.1.17, E.1.19, E.1.24, E.1.31, E.2.26).

## 2. Die Kürzel, die Zonen und die Fahrwerke

Die Spalte „Glyphen" führt **beide** Seiten, weil sie in diesem Slice die Hauptstütze der
Kürzelablesung ist: die Referenz führt ihre Buchstaben in Kurven umgewandelt und ohne `<text>`,
und Detektor A zählt sie auf beiden Seiten mit demselben Verfahren. **In allen 30 Zeichen stimmen
die Glyphenzahlen beider Seiten überein** — mittig wie unten rechts wie in der vierten Zone. Das
ist die dritte unabhängige Ablesung für die strittigen Fälle und die erste, die Referenz und
Katalog mit **einem** Verfahren gegeneinander stellt.

| Abschnitt | Mitte | Glyphen Ref/Kat | unten rechts | vierte Zone | Fahrwerk (gemessen) |
|---|---|---|---|---|---|
| E.2.1 | `PKW` | 3 / 3 | `THW` 3/3 | — | 2 Ringe |
| E.2.2 | `MTW` | 3 / 3 | `THW` 3/3 | — | 2 Ringe |
| E.2.3 | `GKW` | 3 / 3 | `THW` 3/3 | — | 3 Ringe, keine Balken |
| E.2.4 | `ATV` | 3 / 3 | `THW` 3/3 | — | 3 Ringe + 2 Balken |
| E.2.5 | `Stapler` | 7 / 7 | `THW` 3/3 | — | 2 Ringe |
| E.2.7 | `Telelader` | 9 / 9 | `THW` 3/3 | — | 3 Ringe + 2 Balken |
| E.2.8 | `Radlader` | 8 / 8 | `THW` 3/3 | — | 3 Ringe + 2 Balken |
| E.2.9 | `Bagger` | 6 / 6 | `THW` 3/3 | — | Stadion (Kette) |
| E.2.10 | `Bagger` | 6 / 6 | `THW` 3/3 | — | 3 Ringe, keine Balken |
| E.2.11 | `ERS` | 3 / 3 | `THW` 3/3 | — | 3 Ringe + 2 Balken |
| E.2.12 | `MzGW Lbw` | 7 / 7 | `THW` 3/3 | — | 3 Ringe, keine Balken |
| E.2.13 | `MLW IV Lbw` | 8 / 8 | `THW` 3/3 | — | 3 Ringe, keine Balken |
| E.2.14 | `MLW V` | 4 / 4 | `THW` 3/3 | — | 2 Ringe |
| E.2.15 | `LKW` | 3 / 3 | `THW` 3/3 | — | 2 Ringe |
| E.2.16 | `LKW Lkr` | 6 / 6 | `THW` 3/3 | — | 2 Ringe |
| E.2.17 | `LKW Lbw` | 6 / 6 | `THW` 3/3 | — | 2 Ringe |
| E.2.18 | `LKW-K` | 5 / 5 | `THW` 3/3 | — | 3 Ringe, keine Balken |
| E.2.19 | `FüKW` | 6 / 6 | `THW` 3/3 | — | 3 Ringe, keine Balken |
| E.2.20 | `FüKomKW` | 9 / 9 | `THW` 3/3 | — | 2 Ringe |
| E.2.21 | `MastKW` | 6 / 6 | `THW` 3/3 | — | 3 Ringe, keine Balken |
| E.2.22 | **keine** | — | `THW` 3/3 | — | 1 Ring + Deichsel |
| E.2.23 | `NEA` | 3 / 3 | `THW` 3/3 | — | 1 Ring + Deichsel |
| E.2.24 | `FüLa` | 6 / 6 | `THW` 3/3 | — | 2 Ringe + Deichsel |
| E.2.25 | `0,6 t` | 4 / 4 | `THW` 3/3 | — | 1 Ring + Deichsel |
| E.2.26 | `TW AA` | 4 / 4 | `THW` 3/3 | — | **keins** |
| E.2.27 | **keine** | — | **keine** | `THW` 3/3 | **keins** |
| E.2.28 | `kl Boot` | 6 / 6 | — | `THW` 3/3 | **keins** |
| E.2.29 | `MzB` | 3 / 3 | — | `THW` 3/3 | **keins** |
| E.2.30 | `MzAB` | 4 / 4 | — | `THW` 3/3 | **keins** |
| E.2.31 | `MzPt` | 4 / 4 | — | `THW` 3/3 | **keins** |

Drei Stützen, die über die reine Zählung hinausgehen und alle drei aus eigener Messung stammen:

- **`Bagger` und nicht „BRmG R" (E.2.9, E.2.10).** Detektor A zählt auf **beiden** Seiten sechs
  Glyphen mittig und drei unten rechts. „BRmG R" hätte fünf getinte Glyphen mittig. Im Paarbild
  ist das Wort auf beiden Kacheln lesbar dasselbe. Die aus der Gegenprüfung von LFH-424
  übergebene Spezifikation gibt die Datei nicht wieder; dies ist die dritte unabhängige Ablesung
  mit demselben Ergebnis, und die erste, die Referenz und Katalog nebeneinander zeigt.
- **`Telelader` und nicht „Teleskopstapler" (E.2.7).** Neun Glyphen auf beiden Seiten; das Wort
  des Dateinamens hätte vierzehn. Im Paarbild steht links wie rechts dasselbe Wort.
- **E.2.22 trägt keinen mittigen Lauf, E.2.27 gar keinen im Körper.** Detektor A findet in E.2.22
  auf beiden Seiten **einen** hellen Lauf (das `THW`) und in E.2.27 auf beiden Seiten **keinen**.
  Detektor B findet in E.2.27 auf beiden Seiten genau einen blauen Lauf unterhalb des Rumpfes. Ein
  Rezept mit mittigem Kürzel hätte in beiden Fällen etwas erfunden; die Referenz gibt es nicht her.

## 3. Was die 30 Paarbilder zeigen — E-d, die Landfahrzeuge

Zwei Befunde gelten für **alle** 30 Paare und werden deshalb hier einmal genannt und unten nicht
wiederholt:

- **Das weiße Innenfeld der Referenz fehlt durchgehend.** Jede Referenzdatei zieht zwischen
  schwarzem Umriss und farbiger Fläche einen weißen Rand; der Katalog führt den Körper als **eine**
  Fläche. Das ist auf allen 30 linken Kacheln zu sehen und auf keiner rechten. Seit E-a entschieden,
  keine Eigenschaft dieses Slice — die eigene Messung dazu steht in Abschnitt 11.
- **Die Katalogschrift ist breiter.** Gemessen über die 28 mittigen Läufe, die beide Seiten führen:
  zwischen **+4,6 %** (`kl Boot`) und **+28,6 %** (`ERS`), Median rund +9,5 %. Der `THW`-Lauf ist
  in den 25 Zeichen, die ihn im Körper führen, bis auf einen Bildpunkt gleich breit: Referenz
  **9,0156 mm** (24 von 25; E.2.24 9,0313), Katalog **9,5469 mm** (24 von 25; E.2.15 9,5313) —
  **+5,9 %**, dieselbe Zahl, die E-c für denselben Lauf gemessen hat. Anhang J hat
  den Referenzschnitt verworfen; das ist keine Abweichung dieses Slice.

**Die Körperkontur trifft überall.** Das Hüllrechteck aller dunklen Bildpunkte ist bei 64 px/mm in
**allen 30 Zeichen auf beiden Seiten bildpunktgleich** — maximale Differenz 0,0000 mm. Für die
Landfahrzeuge 0,7500 / 5,4063 / 31,2500 / 30,7500 mm, für E.2.15 mit seiner höheren Sehne
0,7500 / 5,6563 / 31,2500 / 30,7500, für die Anhänger 0,7500 / 5,3906 / 31,2500 / 30,7500 (die
0,75 links ist dort das Deichselende), für E.2.26 2,7500 / 1,7500 / 29,2500 / 30,2500 und für die
fünf Wasserfahrzeuge 0,7656 / 7,7500 / 31,2344 / 23,2344.

**E.2.1 `PKW`, E.2.2 `MTW`.** Deckkurve, zwei Radringe links und rechts, Kürzel mittig, `THW` unten
rechts. Beide Grundlinien treffen bildpunktgenau: mittig 18,0000 auf beiden Seiten, `THW` 24,0000
auf beiden Seiten. Die rechte Tintenkante des `THW` steht in der Referenz auf 29,0156 und im
Katalog auf 28,9844 mm — 0,0313 mm, zwei Bildpunkte.

**E.2.3 `GKW`.** Drei Radringe auf beiden Seiten, **ohne** Verbindungsbalken; die spaltenweise
Messung der Fahrwerkszone liefert links wie rechts drei getrennte Gruppen 1,25…6,25 / 13,50…18,50 /
25,75…30,75 mm. Genau diese Lücken trennen `kfz-kategorie-2` von `kfz-kategorie-3`.

**E.2.4 `ATV`.** Das erste Zeichen des Anhangs mit Verbindungsbalken: dieselben drei Ringe, aber die
Spaltenmessung liefert auf beiden Seiten **eine einzige** Gruppe 1,25…30,75 mm, weil die Balken die
Lücken schließen. Im Bild sind die beiden waagerechten Striche zwischen den Rädern auf beiden
Kacheln an derselben Stelle.

**E.2.5 `Stapler`.** Das erste ausgeschriebene Wort des Anhangs. Sieben Glyphen beidseitig,
Unterlänge des `p` auf beiden Seiten sichtbar (Referenz bis 19,4063, Katalog bis 19,4688 mm — ein
Bildpunkt Unterschied, der auf das runde Glyph und nicht auf die Zone geht).

**E.2.7 `Telelader`.** Verkleinerter Grad auf beiden Seiten sichtbar; das Wort füllt die Breite
fast aus. Referenztinte 4,1094…27,9063, Katalog 3,2188…28,8125 mm — der Katalog wächst um 1,80 mm
nach beiden Seiten und bleibt in der 2…30-mm-Box.

**E.2.8 `Radlader`.** Wie E.2.7, acht Glyphen. `BRmG` steht auf keiner der beiden Kacheln.

**E.2.9 `Bagger`, Kettenfahrzeug.** Das einzige Kettenfahrzeug des Anhangs. Statt Ringen steht
unter dem Körper ein Stadion; das eingeschlossene Weiß darin misst auf **beiden** Seiten
2,2500 / 26,2500 / 29,7500 / 30,2500 mm. Im Bild ist die abgerundete Wanne links wie rechts
deckungsgleich.

**E.2.10 `Bagger`, Radantrieb.** Hier gehen Bild und Referenz **sichtbar** auseinander, und es ist
der einzige Fall dieser Art im Slice: die Referenz setzt ihren Lauf nach links versetzt, der Katalog
mittig. Selbst gemessen: beide Läufe sind **exakt gleich breit** (Referenz 19,4531 mm in E.2.9 wie
in E.2.10), aber ihre Tintenmitte liegt bei E.2.9 auf 16,2422 und bei E.2.10 auf **15,4766 mm** —
**0,7656 mm** Unterschied bei identischem Wort und identischem Grad. Der Katalog setzt beide auf
16,2344. In der linken Kachel beginnt das `B` erkennbar weiter links und das rechte `r` endet
erkennbar früher als in der rechten. Die Quelle weicht hier von sich selbst ab; der Katalog folgt
der Mehrheit.

**E.2.11 `ERS`.** Drei Glyphen, drei Ringe mit Balken. Der relativ größte Schriftunterschied des
Slice: Referenz 10,6094, Katalog 13,6406 mm Tintenbreite (+28,6 %) — beide `S` und das `R` treffen
den Schnittunterschied, den E-c schon am `S` gemessen hatte.

**E.2.12 `MzGW Lbw`, E.2.13 `MLW IV Lbw`.** Die beiden am stärksten verkleinerten Läufe
(Schriftgrad 4,9564 mm aus der Zwischendarstellung gegen 7,0786 im Normfall). Beide sitzen auf
beiden Seiten auf derselben Grundlinie 18,0469 mm. E.2.13 ist der **breiteste Lauf des Slice** und
zugleich der engste Fall gegen seine Box: Katalogtinte 2,5469…29,8594 mm in einer Box von 2…30 mm —
**0,14 mm Luft an der rechten Kante**, gemessen. Die römische `IV` steht auf beiden Kacheln.

**E.2.14 `MLW V`.** Vier Glyphen, römisches `V`, Normgrad. Grundlinien 18,0000 und 24,0000 auf
beiden Seiten — das sauberste Paar des Blocks.

**E.2.15 `LKW`, Wechsellader.** Das aufwendigste Zeichen des Slice, und im Bild stimmt es: die
eigene Körperform mit ihrer höheren Sehne, der **L-Rahmen** als senkrechter Strich links und
waagerechter unten, und die zwei Räder. Alle drei stehen links wie rechts an derselben Stelle. Die
mittige Grundlinie steht auf **17,0000 mm auf beiden Seiten** — der Profilwert 7,5 mm über der
Körperunterkante trifft. Das `THW` steht beidseitig auf 22,5000 mm. **Ein Unterschied bleibt und
steht in keinem der beiden Bauberichte**: der mittige Lauf sitzt im Katalog 0,70 mm weiter rechts
als in der Referenz (Tintenmitte 17,0313 gegen 16,3281 mm). Siehe Abschnitt 9.

**E.2.16 `LKW Lkr`, E.2.17 `LKW Lbw`.** Beide verkleinert (Grad 6,3704 mm), beide auf ihren
Grundlinien deckungsgleich. E.2.17 ist der zweitbreiteste Katalogauf (26,7500 mm) und hat 0,36 mm
Luft zur Box.

**E.2.18 `LKW-K`.** Der Bindestrich steht auf beiden Kacheln mitten im Lauf und nicht als eigene
Zone. Normgrad, Grundlinien 18,0000 / 24,0000 beidseitig.

**E.2.19 `FüKW`.** Hier ist die **zurückgesetzte Farbfläche** der Referenz deutlich zu sehen: links
liegt zwischen dem oberen Rand des Körpers und dem Blau ein leeres weißes Band, rechts füllt das
Blau den ganzen Körper. Der Unterschied springt ins Auge und ist trotzdem kein Fehler — der Katalog
färbt den Körperpfad, und die Quelle weicht an fünf Stellen über zwei Kapitel von sich selbst ab.
Die Läufe selbst treffen beidseitig (13,6250…18,0625 mm).

**E.2.20 `FüKomKW`.** Zwei Unterschiede in einem Bild. Erstens dasselbe weiße Band wie bei E.2.19.
Zweitens steht die mittige Grundlinie der Referenz auf **17,5625** und die des Katalogs auf
**18,0469 mm** — **0,4844 mm** gemessen, im Paarbild als leichter Höhenversatz des Wortes erkennbar.
Der Katalog baut den Normwert 18,0; die Quelle steht hier allein gegen 19 andere Landfahrzeuge.

**E.2.21 `MastKW`.** Der Mast ist auf keiner der beiden Kacheln gezeichnet; die Bedeutung hängt
allein am Kürzel. Drei Ringe ohne Balken, beidseitig gleich.

## 4. E-e und E-f im Bild

**E.2.22 `Anhänger Grundzeichen`.** Das einzige Zeichen des Anhangs **ohne** mittige Beschriftung —
auf beiden Kacheln steht nur das `THW`. Der Anhängerrumpf beginnt links bei x = 4 statt bei 1, die
**Deichsel** ragt als schmaler Rahmen nach links heraus, und darunter steht **ein** Ring in der
Mitte. Deichselloch links wie rechts 1,2500 / 14,7500 / 3,7500 / 15,2500 mm, Radloch links wie
rechts 15,5000 / 26,2500 / 19,5000 / 30,2500 mm — bildpunktgleich.

**E.2.23 `NEA`.** Der auffälligste Lageunterschied des Slice. Die Referenz bricht ihre Farbfläche
unten bei 22,5 mm ab und schiebt beide Läufe nach oben; der Katalog färbt den ganzen Körper und
setzt die Normlagen. Gemessen: mittige Grundlinie **16,5000 gegen 18,0000 mm** (1,5000 mm),
`THW`-Grundlinie **21,5000 gegen 24,0000 mm** (2,5000 mm). Im Bild steht links unter dem Blau ein
weißer Streifen, in dem das `THW` der Referenz teils zu liegen kommt, während es rechts auf Blau
steht. Dieselbe Einordnung wie E.1.6/E.1.14 aus E-a. Das Fahrwerk ist ein Ring — obwohl der
Dateiname „von LKW gezogen" sagt; links wie rechts an derselben Stelle.

**E.2.24 `FüLa`.** Zwei Räder auf beiden Seiten (Löcher 12,2500…16,2500 und 17,7500…21,7500 mm,
bildpunktgleich), Deichsel wie bei den anderen drei. Dazu wieder die zurückgesetzte Farbfläche der
Referenz, hier auf dem Anhängerrumpf — das weiße Band oben ist links deutlich zu sehen. Das
abschließende `a` ist auf beiden Kacheln ein Gemeinbuchstabe.

**E.2.25 `0,6 t`.** Das einzige Zeichen des Anhangs mit Ziffern, und das Komma ist auf beiden
Kacheln als Komma mit Unterlänge zu erkennen und nicht als Punkt. Gemessene Untergrenze der Tinte:
Referenz 19,0000, Katalog 18,9063 mm — die 0,09 mm gehen auf die Kommaform, nicht auf die Zone.

**E.2.26 `TW AA`.** Das einzige hochkante Zeichen und das einzige ohne jede Zone unterhalb des
Körpers. Beide Kacheln zeigen dasselbe stehende Rechteck; das Leerzeichen zwischen `TW` und `AA`
ist auf beiden zu sehen. **Der eine sichtbare Unterschied ist die deklarierte Abweichung**: das
`THW` der Referenz endet rechts bei 26,0156 mm, das des Katalogs bei 26,9844 mm — **0,9688 mm**
gemessen, im Bild als deutlicher Rechtsversatz des Kürzels erkennbar. Das ist die einzige Zeile des
Teilslice mit `review.technical.status: 'deviation'`, und sie ist im Bild genau so groß, wie die
Note sagt.

**E.2.27 `Wasserfahrzeug allgemein`.** Der Halbkreisrumpf, und darunter rechts das blaue `THW` —
auf **beiden** Kacheln. Kein Kürzel im Körper, auf keiner der beiden Seiten. Die Prämisse dieses
Slice („das Kürzel steht weiß im Körper statt blau unter ihm") beschreibt damit die frühere
Katalogausgabe und nicht die Quelle; das Paarbild ist der direkte Beleg.

**E.2.28 `kl Boot`, E.2.29 `MzB`, E.2.30 `MzAB`, E.2.31 `MzPt`.** Alle vier tragen mittig ein weißes
Kürzel und unterhalb rechts das blaue `THW`. Die mittige Grundlinie steht bei E.2.29 und E.2.30 auf
16,0000 mm auf beiden Seiten, bei E.2.28 und E.2.31 auf 16,0781 gegen 16,0625 bzw. 16,0469 mm — ein
Bildpunkt, verursacht durch die runden Glyphen `o` und `t`. Die Oberlängen von `k` und `l` in
E.2.28 stehen auf beiden Kacheln über der Versalhöhe des `B`.

## 5. E.2.6 — das eine Zeichen, das dieser Slice nicht baut

E.2.6 hat keine Katalogausgabe und deshalb kein Paarbild. Es hat aber eine Referenzdatei, und die
trägt eine Behauptung, die dieses Protokoll unabhängig prüfen konnte. Gerastert wurden dafür drei
**Referenzkacheln** nebeneinander: E.2.5 (gebaut), E.2.6 (nicht gebaut) und E.2.4 (gebaut).

**Was zu sehen ist.** E.2.6 trägt einen **orangen** Körper mit weißem `Stapler` und weißem `THW` —
als einziges Zeichen des ganzen Anhangs. Sein Fahrwerk sind **drei Räder mit zwei
Verbindungsbalken**, nicht die zwei Räder von E.2.5; im Bild ist der Unterschied unübersehbar, und
E.2.6 steht in dieser Hinsicht neben E.2.4 und nicht neben E.2.5.

**Eigene Zählung als Stütze:** die Strichebene der Referenzdateien führt bei E.2.5 **vier**
Teilpfade, bei E.2.6 und E.2.4 je **sieben**. Die Füllebene von E.2.6 führt `#fff` und `#fa8c00`,
die der beiden anderen `#fff` und `#003296` — selbst aus den Dateien gelesen.

Damit ist die Vorgabe des Baubeschlusses („Fahrwerk und Beschriftung sind zeichengleich mit E.2.5")
in ihrer ersten Hälfte an der Datei widerlegt. Die Bauphase hat das bereits berichtigt und in
`ANHANG_E_D_UNGEBAUT` festgehalten; dieses Protokoll bestätigt die Berichtigung mit einer dritten,
unabhängigen Ablesung — und das ist hier mehr als Fleiß: zu E.2.6 gibt es kein Rezept, also erreicht
**kein Gate** diese Aussage, und der einzige Text, den es zu dem Zeichen gibt, ist die Notiz selbst.

**Warum es nicht gebaut ist**, ist keine Messfrage, und dieses Protokoll entscheidet sie nicht. Was
es beitragen kann, sind die Zahlen aus eigener Rechnung mit `contrastRatio()`: weiß auf orange
erreicht **2,3820:1** im Referenz- und im `accessible-light`-Theme und **2,3231:1** im Drucktheme,
gegen eine geforderte Textschwelle von 4,5:1. Im Bild ist das nachvollziehbar — das weiße `Stapler`
auf Orange steht sichtbar schwächer als dasselbe Wort auf Blau in der Kachel daneben.

## 6. Die drei neuen Körperformen und die Rumpfvariante

E.2 bringt vier Zeichnungen, die es im Bestand vorher nicht gab. Alle vier sind in ihren Paarbildern
angesehen und zusätzlich über die Konturmessung geprüft; das Ergebnis ist in allen vier Fällen
dasselbe und steht in Abschnitt 3: **das Hüllrechteck der dunklen Tinte ist bildpunktgleich.**

**Anhängerrumpf (`trailer`, E.2.22 bis E.2.25).** Im Bild dieselbe Deckkurve wie das Landfahrzeug,
aber schmaler — links bei x = 4 statt x = 1 —, und mit der Deichsel als eigenem Primitiv. Die
Deichsel ist der Fall, an dem sich „mitgetragen" von „still verschluckt" unterscheidet: sie ist
weder Körper noch Beschriftung, kein Fingerprint sieht sie, und ein Rezept ohne sie hätte jedes
Gate bestanden. Sie ist in allen vier Anhängern da, und ihr Innenloch misst auf beiden Seiten
1,2500 / 14,7500 / 3,7500 / 15,2500 mm.

**Wechselladerrumpf (`swap-loader-vehicle`, E.2.15).** Höhere Sehne (6,0 statt 5,75) und flachere
Unterkante (24,5 statt 26,0), dazu der L-Rahmen. Beides ist im Paarbild links wie rechts an
derselben Stelle. Der L-Rahmen ist wie die Deichsel ein `bodyExtra` — im Bild ein durchgehender
Winkel aus senkrechtem und waagerechtem Strich, der über die Körperkante hinausragt.

**Hochkantrechteck (`upright-rectangle`, E.2.26).** Das einzige stehende Format; im Paarbild ist die
Form auf beiden Seiten identisch, und der einzige Unterschied ist der Ankerversatz des `THW`
(Abschnitt 4).

**Angehobener Rumpf (`vehicle-water` mit `bodyVariant: 'raised-hull'`, E.2.27 bis E.2.31).** Die
Variante ist im Paarbild nicht als Variante zu erkennen — sie soll es auch nicht sein; sie soll die
Referenz treffen, und sie tut es. Was im Bild **sichtbar** ist, ist ihre Folge: unterhalb des
Rumpfes bleibt Platz, und in diesem Platz steht das blaue `THW`. Gemessen ist der Freiraum als
Abstand zwischen der **Außenkante des Konturstrichs** (23,2344 mm) und der Oberkante der blauen
Tinte (24,0781 mm), also **0,8437 mm** — auf beiden Seiten dieselben Werte. Der Rezeptkommentar
nennt für denselben Freiraum 1,0908 mm; das ist kein Widerspruch, sondern eine andere Kante: er
misst ab der **Füllkante** 22,9898 mm, dieses Protokoll ab der Außenkante des 0,5 mm breiten
Strichs.

## 7. Die Fahrwerkszone — sitzt sie, wo die Referenz sie hat?

Das ist die Frage, für die dieser Slice den Anker von der Körperunterkante auf die Unterkante des
**Grundzeichens** umgestellt hat, und sie lässt sich sauber beantworten. Gemessen wurde die dunkle
Tinte unterhalb der Körperunterkante, spaltenweise gruppiert, auf beiden Seiten mit demselben
Verfahren.

**Alle 30 Zeichen: die Fahrwerkszone ist zwischen Referenz und Katalog bildpunktgleich.** Die
25 Zeichen mit Fahrwerk führen sie alle im selben senkrechten Band mit Unterkante **30,7500 mm**;
die sechs ohne (E.2.26 bis E.2.31) führen auf **beiden** Seiten **nichts** unterhalb ihres Körpers.
Diese Negativkontrolle ist der Teil, der eine übereifrige Verankerung gemeldet hätte, und sie ist
sauber.

**Der entscheidende Fall ist E.2.15**, weil es das einzige Zeichen ist, bei dem Körperunterkante
(24,5) und Grundzeichenunterkante (26,0) auseinanderfallen. Gemessen an den Radlöchern:

| | linkes Rad | rechtes Rad |
|---|---|---|
| E.2.1 Referenz | 1,7500 / 26,2500 / 5,7500 / 30,2500 | 26,2500 / 26,2500 / 30,2500 / 30,2500 |
| E.2.1 Katalog | dieselben Werte | dieselben Werte |
| **E.2.15 Referenz** | **1,7500 / 26,2500 / 5,7500 / 30,2500** | **26,2500 / 26,2500 / 30,2500 / 30,2500** |
| **E.2.15 Katalog** | **dieselben Werte** | **dieselben Werte** |

E.2.15 hängt seine Räder also **genauso hoch** wie E.2.1, obwohl sein Körper 1,5 mm höher endet —
Radmitte in beiden Fällen 28,2500 mm aus eigener Messung. Hinge das Fahrwerk an der
Körperunterkante, säße es 1,5 mm tiefer, und die Referenzkachel würde es zeigen. Sie zeigt es
nicht. Der dritte Fall, die vier Anhänger, bestätigt dasselbe mit einer anderen Körperform und
einer zusätzlichen Zusatzgeometrie.

**Was die Fahrwerkszone im Bild trägt, und was das kostet:** in E.2 ist sie der **einzige** Träger
der Fahrzeugkategorie. Kein Zeichen des Blocks führt eine Kopfzone, keines eine Zone unten links;
`kfz-kategorie-2` und `kfz-kategorie-3` unterscheiden sich ausschließlich durch zwei waagerechte
Striche zwischen den Rädern. Was das bei kleinen Rendergrößen bedeutet, steht in Abschnitt 10.

## 8. Die vierte Beschriftungszone

Sie ist die einzige Zone des Bestands außerhalb des Körpers, und sie ist die einzige, die Detektor A
nicht sieht. Gemessen mit Detektor B, auf beiden Seiten gleich, in allen fünf Dateien mit
**identischem** Ergebnis:

| | linke Tintenkante | rechte Tintenkante | Oberkante | Grundlinie | Breite |
|---|---|---|---|---|---|
| Referenz (E.2.27–E.2.31) | 22,5469 | **31,5781** | **24,0781** | **27,0000** | 9,0313 |
| Katalog (E.2.27–E.2.31) | 21,9844 | **31,5313** | **24,0781** | **27,0000** | 9,5469 |

**Oberkante und Grundlinie treffen bildpunktgenau, die rechte Kante auf 0,0469 mm** — drei
Bildpunkte bei 64 px/mm. Die linke Kante trifft nicht, und das ist kein Zonenfehler, sondern
dieselbe Schriftbreite, die Abschnitt 3 für den `THW`-Lauf im Körper misst: +5,7 % hier gegen
+5,9 % dort, und weil der Lauf rechts verankert ist, wächst er nach links. Das ist konsistent und
belegt zugleich, dass es derselbe Lauf ist.

Bemerkenswert am Bild: die vierte Zone ragt **über die Körperkante hinaus**. Die rechte Tintenkante
steht auf 31,53 mm, die Kontur des Rumpfes endet bei 31,23 mm. Das ist in der Referenz genauso und
im Paarbild auf beiden Kacheln zu sehen; es ist die einzige Stelle des Anhangs, an der Beschriftung
den Körper waagerecht überragt.

## 9. Wo Bild und Referenz auseinandergehen

Sieben Stellen. Sechs davon sind in `recipes-anhang-e.ts` oder `coverage-manifest.ts` als Befund
oder Abweichung erklärt, eine ist neu.

| | was im Bild zu sehen ist | gemessen | Einordnung |
|---|---|---|---|
| alle 30 | weißes Innenfeld der Referenz fehlt | siehe Abschnitt 11 | seit E-a entschieden |
| E.2.10 | mittiger Lauf links versetzt statt mittig | Tintenmitte 15,4766 gegen 16,2344 mm | Befund, Quelle weicht von sich selbst ab |
| E.2.19, E.2.20, E.2.24 | weißes Band über der Farbfläche | Farbfläche der Referenz beginnt bei y = 10 | Befund, fünf Fälle über zwei Kapitel |
| E.2.20 | mittiger Lauf 0,5 mm höher | Grundlinie 17,5625 gegen 18,0469 mm | Befund, Katalog folgt der Mehrheit |
| E.2.23 | beide Läufe höher, weißer Streifen unten | 1,5000 mm mittig, 2,5000 mm beim `THW` | Befund, wie E.1.6/E.1.14 |
| E.2.26 | `THW` 1 mm weiter rechts | rechte Tintenkante 26,9844 gegen 26,0156 mm | **deklarierte Abweichung**, `deviation` im Manifest |
| **E.2.15, E.2.23, E.2.24, E.2.25** | **mittiger Lauf 0,4 bis 0,7 mm weiter rechts** | **siehe unten** | **neu, in keinem Baubericht** |

**Der neue Punkt.** Die Tintenmitte des mittigen Laufs stimmt zwischen Referenz und Katalog in
**23 der 28** Zeichen, die ihn beidseitig führen, auf **höchstens 0,102 mm** überein. Eines weicht
bekanntermaßen ab: E.2.10, dessen Referenzlauf 0,7578 mm links des Katalogs steht (Abschnitt 3).
Die restlichen **vier** weichen systematisch in
dieselbe Richtung ab, und es sind genau die vier Zeichen, deren **Körper nicht symmetrisch zu
x = 16 liegt**:

| Abschnitt | Körperform (Mitte) | Tintenmitte Referenz | Tintenmitte Katalog | Differenz |
|---|---|---|---|---|
| E.2.15 | Wechsellader (2,5…31, Mitte 16,75) | 16,3281 | 17,0313 | **+0,703** |
| E.2.23 | Anhänger (4…31, Mitte 17,5) | 17,3828 | 17,7813 | +0,399 |
| E.2.24 | Anhänger | 17,0938 | 17,7891 | **+0,695** |
| E.2.25 | Anhänger | 17,0547 | 17,6094 | +0,555 |

**Die Katalogseite ist dabei nicht erschlossen, sondern abgelesen:** `boxMm` aus der
Zwischendarstellung liefert für den mittigen Lauf die Boxmitte 16,0 bei den Landfahrzeugen, 16,75
bei E.2.15 und 17,5 bei den Anhängern — der Katalog setzt ihn auf die **Mitte des Körpers**, ohne
Rest.

**Die Referenzseite trägt dagegen keine zweite Regel, und das ist der eigentliche Befund.** Nur
E.2.15 lässt sich sauber lesen: seine Referenzmitte 16,3281 liegt mitten im Feld der 20
Landfahrzeuge (16,0938 bis 16,3750), sein Lauf steht also dort, wo er auch ohne die eigene
Körperform stünde. Die drei Anhänger tun das **nicht** — ihre Referenzmitten 17,3828 / 17,0938 /
17,0547 liegen rund 0,7 bis 1,0 mm **rechts** dieses Feldes und zugleich 0,12 bis 0,45 mm **links**
der Körpermitte 17,5 (17,5 − 17,3828 = 0,1172; − 17,0938 = 0,4062; − 17,0547 = 0,4453). Sie stehen zwischen den beiden denkbaren Ankern und stützen keinen von
beiden. Vier Fälle, vier Werte, kein Mechanismus — dieses Protokoll schlägt deshalb auch keinen vor.

**Dass die Differenz nicht der Schrift geschuldet ist, sagt dieselbe Messreihe.** Der Einwand liegt
nahe: zwei verschiedene Schnitte mit verschiedenen Seitenvorbreiten und Laufbreiten von +4,6 bis
+28,6 % lassen sich über ihre Tintenmitte nicht ohne weiteres vergleichen. Die Antwort ist die
Kontrollgruppe, die schon dasteht: in den **23** Zeichen, in denen beide Seiten auf **denselben**
Anker setzen, bleibt die Differenz der Tintenmitten bei **höchstens 0,102 mm**. Damit ist der
Beitrag der Schnittunterschiede empirisch nach oben abgeschätzt, und die 0,399 bis 0,703 mm der
vier Ausnahmen liegen um das Vier- bis Siebenfache darüber. Es ist ein Ankerversatz und kein
Schriftrauschen.

**Ein Befund und keine Fehlerbehauptung.** Er ist klein und im Paarbild nur bei genauem Hinsehen zu
bemerken. Festzuhalten ist: **kein Gate sieht diese
Differenz**, weil `labelInkAgainstBox` gegen die selbst deklarierte Box prüft und der Fingerprint
den Körper und nicht die Beschriftung vergleicht. Wer sie beheben will, hat es mit einer
Ankerfrage bei n = 4 zu tun — derselben Klasse wie E.2.26, das dafür eine `deviation` trägt.

## 10. Die Alternativthemes

**`accessible-light`** setzt den Körper auf `#4970d2` und die Kontur gestrichelt. Alle 30 Zeichen
sind im Kontaktbogen lesbar; kein Kürzel verschwindet, kein Fahrwerk wird unkenntlich, und die
Unterscheidung zwischen zwei, drei und keinem Rad bleibt bei 256 px erhalten. Die vier Anhänger
sind an ihrer Deichsel weiterhin sofort von den Landfahrzeugen zu trennen.

**`print-monochrome`** setzt den Körper auf `#767676`. Dasselbe Bild in Grau, mit einer Ausnahme,
die dieser Slice als erster erzeugt: **die vierte Zone ist grau auf Weiß**. Sie ist der einzige
Textlauf des gesamten Bestands, der nicht auf einer gefüllten Fläche steht, und im Bogen ist sie
sichtbar das blasseste Element. Sie hält trotzdem — eigene Rechnung mit `contrastRatio()`:

| Paarung | reference | accessible-light | print-monochrome |
|---|---|---|---|
| weiß auf `blau` (Beschriftung im Körper) | 11,0722 | 4,6341 | 4,5422 |
| **`blau` auf Oberfläche (vierte Zone)** | **11,0722** | **4,6341** | **4,5422** |
| weiß auf `orange` (E.2.6, nicht gebaut) | 2,3820 | 2,3820 | 2,3231 |

Der Drucktheme-Wert der vierten Zone liegt **0,0422 über der Schwelle von 4,5** — knapp einem
Prozent. Er hält, aber er hat keinen Spielraum: jede künftige Änderung an `#767676` fällt sofort
auf. `labelContrastRequirements()` liefert aus eigenem Lauf **zwei** Anforderungen, und die zweite
ist genau diese Paarung („Trägerkürzel unterhalb des Körpers, Organisation thw") — sie wird also
abgeleitet und nicht vergessen.

**Die gestrichelte Kontur an Ecken — E-c hat es vorhergesagt, hier tritt es ein.** E-c fand am
Gebäudekörper von E.1.37 eine Ecke, die in eine Strichlücke fällt, und hielt fest, dass das bei
weiteren Vielecken wiederkommt. Gemessen wurde deshalb für jede Körperform der **Abstand vom
Eckpunkt zur nächsten Konturtinte** (2048 px, beide Alternativthemes, identische Werte):

| Körperform | Ecke 1 | Ecke 2 | Ecke 3 | Ecke 4 |
|---|---|---|---|---|
| `vehicle-land` | 0,0110 | 0,0110 | 0,0110 | **0,4922** (unten rechts) |
| `swap-loader-vehicle` | 0,0110 | **0,5093** (Sehne rechts) | 0,0110 | 0,0110 |
| `trailer` | **0,2579** (Sehne links) | 0,0110 | **0,5235** (unten links) | 0,0110 |
| `upright-rectangle` | 0,0110 | 0,0110 | **0,5079** (unten links) | 0,0110 |
| `vehicle-water` / `raised-hull` | 0,0081 | 0,0081 | 0,0081 (Scheitel) | — |

**Jede der vier eckigen Körperformen hat mindestens eine Ecke ohne Konturtinte**, der
Anhängerrumpf zwei. Der Halbkreisrumpf ist als einziger an allen geprüften Punkten gedeckt. Das ist
kein Fehler der Umsetzung — eine Strichsignatur mit fester Teilung (`[2, 1.5]` mm) kann nicht
garantieren, dass jede Ecke auf einen Strich fällt, und die Füllfarbe hält die Kante auch in der
Lücke. Es ist aber jetzt **belegt statt vorhergesagt**, und es betrifft 30 von 30 Zeichen dieses
Slice in beiden Alternativthemes.

**Eine zweite Beobachtung aus denselben Bögen, die im Referenztheme nicht auffallen kann:** die
Strichsignatur gilt nur für `role: 'body'` — nachgelesen in `svg.ts` und im Bild bestätigt. Fahrwerk
(`role: 'chassis'`), Deichsel und L-Rahmen (`role: 'bodyExtra'`) bleiben **durchgezogen**, während
die Körperkontur direkt daneben gestrichelt ist. Die Referenz zeichnet alle mit demselben Strich.
E.2 ist der erste Slice, in dem es überhaupt Nicht-Körper-Striche gibt, an denen dieser Unterschied
sichtbar werden kann; im Bogen sieht man ihn bei E.2.15 besonders deutlich, wo der durchgezogene
L-Rahmen unmittelbar an der gestrichelten Körperkante liegt.

## 11. Kleinrasterung: Text und, neu, Fahrwerk

**Das längste Kürzel wurde gemessen und nicht übernommen** — E-c hat sich an dieser Stelle einmal
auf einen Rezeptkommentar verlassen und ist damit aufgelaufen. Gemessen an der Katalogtinte über
alle 28 mittigen Läufe:

| Kürzel | Katalogtinte | Referenztinte | Glyphen |
|---|---|---|---|
| `MLW IV Lbw` (E.2.13) | **27,3125 mm** | 25,5469 mm | 8 |
| `LKW Lbw` (E.2.17) | 26,7500 mm | 24,4375 mm | 6 |
| `Telelader` (E.2.7) | 25,5938 mm | 23,7969 mm | 9 |
| `Radlader` (E.2.8) / `MzGW Lbw` (E.2.12) | je 25,2031 mm | 22,6250 / 23,0000 mm | 8 / 7 |

Die Reihenfolge ist auf beiden Seiten dieselbe, und sie ist **nicht** die Reihenfolge der
Glyphenzahl: `Telelader` hat neun Glyphen und ist schmaler als `MLW IV Lbw` mit acht, weil dieses
im kleineren Grad gesetzt ist und trotzdem mehr Breite braucht. Geprüft wurde deshalb an E.2.13.

**`minRenderPx` wächst mit dem gemessenen Grad** — das ist die Frage, die sich erst in diesem Slice
stellen konnte, weil E.1 nur einen Grad kannte. Aus der Zwischendarstellung gelesen: 37 px beim
Normgrad (7,0786 mm), 41 px bei 6,3704 mm, 49 px bei 5,3071 mm und **52 px** bei 4,9564 mm
(E.2.12, E.2.13); der `THW`-Lauf trägt durchweg 61 px. Die Zusicherung ignoriert den
zeichenweisen Grad also nicht.

Gemessen am Bild, jede Größe einzeln gerastert und danach punktweise vergrößert:

| Zielgröße | `MLW IV Lbw` (deklariert 52 px) | `THW` (deklariert 61 px) |
|---|---|---|
| 16 px | nicht lesbar — ein Streifen heller Punkte ohne Buchstabenform | nicht lesbar |
| 24 px | nicht lesbar; Wortumriss erkennbar, Buchstaben nicht | nicht lesbar |
| 32 px | grenzwertig — wer das Kürzel kennt, erkennt es; `IV` und `Lbw` laufen ineinander | nicht lesbar |
| 48 px | klar lesbar | gerade lesbar |

Beide Zusicherungen halten und sind **konservativ**: der mittige Lauf ist bei 48 px klar lesbar, wo
52 px deklariert sind, und das `THW` gerade lesbar bei 48 px gegen deklarierte 61 px. Was der
deklarierte Wert ausschließt — 24 px und darunter — ist tatsächlich unlesbar. Die genauen Schwellen
sind damit **nicht** bestimmt; gerastert wurden 16, 24, 32 und 48 px und nicht 52 und 61. Zwischen
32 und 48 px liegt der Umschlag; wo genau, sagt dieses Protokoll nicht und rechnet es nicht aus.

**Neu in E.2 und von keiner Zusicherung gedeckt: das Fahrwerk.** Es trägt die Fahrzeugkategorie
allein, und es ist keine Schrift, also greift `minRenderPx` nicht. Gerastert und punktweise
vergrößert wurden E.2.1 (zwei Ringe), E.2.3 (drei Ringe ohne Balken), E.2.4 (drei Ringe mit
Balken), E.2.9 (Kette), E.2.22 (ein Ring plus Deichsel) und E.2.24 (zwei Ringe plus Deichsel):

| Zielgröße | Radzahl | Balken (`kfz-2` gegen `kfz-3`) | Deichsel |
|---|---|---|---|
| 16 px | nicht sicher zählbar — die Ringe verschmelzen zu grauen Flecken | **nicht unterscheidbar** | **verschwunden** |
| 24 px | zählbar | unterscheidbar, aber schwach | als Stummel erkennbar |
| 32 px | klar | klar — E.2.3 zeigt Lücken, E.2.4 ein durchgehendes Band | klar |
| 48 px | klar | klar | klar |

**Bei 16 px sind E.2.3 und E.2.4 im Bild nicht auseinanderzuhalten**, und ihr einziger Unterschied
ist die Fahrzeugkategorie. Das ist keine Abweichung von der Referenz — sie hat dasselbe Problem —
und kein Fehler der Umsetzung. Es ist eine Aussage über die kleinste sinnvolle Rendergröße dieses
Blocks, und sie steht heute nirgends: der Text von E.2.3 (`GKW`, deklariert 37 px) verspricht mehr
Kleinheit, als sein Fahrwerk trägt.

## 12. Die 37 Zeichen aus E.1 sind unberührt

Der Kernumbau dieses Slice greift tief — die mittige Grundlinie ist von einer Konstanten zu einer
Eigenschaft des Körperprofils geworden, der Kennwertextraktor erzeugt `fingerprints.json` neu, und
`compose()` trägt jetzt Nicht-Körper-Kinder mit. Dass sich am Bild der 37 E.1-Zeichen nichts
geändert hat, ist nicht behauptet, sondern belegt: `git diff --stat` auf
`packages/catalog/src/__snapshots__` ist **leer**, und `git status --untracked-files=all` auf
dasselbe Verzeichnis führt **60 neue und null geänderte** Dateien. Auch die 14 Grundzeichen und die
309 Mehrgrößen-Snapshots des Bestands stehen unverändert. Der Vorgabewert der Kappenhöhe steht
bewusst auf 4,87 und nicht auf den gemessenen 4,8694 mm; wer ihn je nachzieht, verschiebt 67
Snapshots auf einmal.

## 13. Zwei Beobachtungen ohne Befundcharakter — und eine Datei, die dort nicht hingehört

**Das weiße Innenfeld der Referenz, gemessen.** Es ist kein gleichmäßiger Versatz: an E.2.1 beginnt
der Körper bei y = 5,75 und die Farbfläche bei 7,11 mm — 1,36 mm —, während der Abstand in der
Mitte 1,0 mm beträgt. Ein Mechanismus „Körper um 1 mm einrücken" reproduzierte es also ohnehin
nicht. Die Zahlen stammen aus der Bauphase; dieses Protokoll hat sie im Bild wiedererkannt, aber
nicht nachgemessen.

**Der `THW`-Lauf steht in 21 der 25 Zeichen, die ihn im Körper führen, auf denselben vier Zahlen.**
Referenz 20,0000…29,0156 / Grundlinie 24,0000 mm, Katalog 19,4375…28,9844 / 24,0000 — in jedem
einzelnen dieser 21 Fälle identisch, ohne eine Abweichung. Die vier übrigen sind erklärt: E.2.15
(Grundlinie beidseitig 22,5000, weil der Körper höher endet), E.2.23 (2,5 mm Befund), E.2.24
(linke Referenzkante 19,9844 statt 20,0000 — ein Bildpunkt) und E.2.26 (1 mm waagerecht,
deklarierte Abweichung). Die fünf Wasserfahrzeuge führen ihn gar nicht im Körper. Diese
Gleichförmigkeit
ist die stärkste Einzelaussage der Messreihe: sie zeigt, dass Zonenregel und Ankerkante über fünf
verschiedene Körperformen hinweg dasselbe Ergebnis liefern.

**Eine unversionierte Datei im Arbeitsverzeichnis.** `git status --short --untracked-files=all`
führt zum Zeitpunkt dieser Prüfung außerhalb von `__snapshots__` und außerhalb von `docs/` einen
Eintrag, der dort nicht hingehört: `zaehl.tmp.ts` im Wurzelverzeichnis, vier
Zeilen, ein Wegwerfskript zum Zählen der Befundexporte. Der Baubericht der zweiten Phase hält an
dieser Stelle „unversionierte Dateien außerhalb von `__snapshots__`: 0" fest; **für den
Arbeitsbaum, wie er zum Zeitpunkt dieser Prüfung steht, gilt das nicht.** Wann und durch wen die
Datei entstanden ist, stellt dieses Protokoll nicht fest und kann es nicht — während der Prüfung
sind im selben Baum weitere Dateien erschienen. Die Datei ist harmlos — sie wird von nichts
importiert, und `pnpm typecheck`
läuft mit ihr durch —, aber die Projektregel sagt „Wegwerfskripte nur unter /tmp bzw. im
Scratchpad, nicht im Repo", und ein `git add -A` nähme sie mit. **Offen und zu entfernen**; dieses
Protokoll ändert keinen Kode und löscht sie deshalb nicht.

## 14. Reviewgrenze

Dieses Protokoll trifft **keine fachliche Aussage** über Anhang E. Es hält fest, was die
Katalogausgabe im Vergleich mit der Referenz zeigt. Bedeutung, Verwechslungsfreiheit und
einsatztaktische Eignung der 30 Zeichen bleiben — wie die 371 offenen fachlichen Reviews insgesamt,
davon 67 im Bereich E (eigener Lauf `pnpm cli coverage`) — einer entsprechend fachkundigen Person
vorbehalten.

Bei diesem Slice wiegt das schwerer als bei E-c, aus drei Gründen, die alle im Bild sichtbar
geworden sind: die fachliche Unterscheidung der 20 Landfahrzeuge liegt in Buchstabenkürzeln **und**
in der Zahl der Räder; fünf dieser Kürzel widersprechen ihrem Dateinamen (`Telelader` gegen
Teleskopstapler, `Radlader` und zweimal `Bagger` ohne BRmG, `LKW` gegen Wechselladerfahrzeug); und
drei der vier Anhänger tragen eine Radzahl, die ihr Namenszusatz nicht vorhersagt. Keine dieser
Fragen entscheidet eine Zeichnung.

**Sechs Punkte, keiner davon ein Fehler an einer Zeichnung:**

1. **Der mittige Lauf steht bei E.2.15, E.2.23, E.2.24 und E.2.25 um 0,40 bis 0,70 mm weiter rechts
   als in der Referenz** (Abschnitt 9) — bei den vier Zeichen, deren Körper nicht symmetrisch zu
   x = 16 liegt. Neu; in keinem der beiden Bauberichte, und kein Gate sieht es. Festgehalten, nicht
   behoben: der Katalog setzt nachweislich auf die Körpermitte, die Referenz aber auf keinen
   erkennbaren zweiten Anker — E.2.15 steht im Feld der Landfahrzeuge, die drei Anhänger stehen
   zwischen beiden Kandidaten. Vier Fälle, vier Werte, kein Mechanismus.
2. **`zaehl.tmp.ts` liegt unversioniert im Wurzelverzeichnis** (Abschnitt 13). Offen und zu
   entfernen; die Aussage des zweiten Bauberichts dazu ist an meinem eigenen `git status` widerlegt.
3. **Jede der vier eckigen Körperformen hat mindestens eine Ecke in einer Strichlücke** der
   Alternativthemes, der Anhängerrumpf zwei (Abschnitt 10). Die Vorhersage aus E-c ist eingetreten
   und jetzt beziffert. Festgehalten; sie wird bei jedem weiteren Vieleck wieder auftreten.
4. **Bei 16 px sind `kfz-kategorie-2` und `kfz-kategorie-3` im Bild nicht zu unterscheiden**
   (Abschnitt 11), und das Fahrwerk trägt in E.2 die Kategorie allein. `minRenderPx` deckt nur
   Text. Festgehalten als Aussage über die kleinste sinnvolle Rendergröße dieses Blocks.
5. **Die vierte Zone hält im Drucktheme mit 0,0422 Reserve** über der Schwelle 4,5 (Abschnitt 10).
   Kein Befund heute, aber ohne Spielraum für eine spätere Palettenänderung.
6. **E.2.6 fehlt**, und seine Fahrwerksangabe aus dem Baubeschluss ist an der Referenzdatei
   widerlegt (Abschnitt 5). Die Bauphase hat das bereits berichtigt; dieses Protokoll bestätigt es
   unabhängig. Solange kein Rezept existiert, erreicht diese Aussage kein Gate — sie hängt allein an
   der Notiz.

Anhang E steht damit bei **67 von 68** Abschnitten. LFH-444 (E-e) und LFH-445 (E-f) sind mit je 5
von 5 vollständig; LFH-443 (E-d) steht bei 20 von 21.
