# E-b — Visuelle QA aller zwölf Darstellungen

> Prüfprotokoll · 17. August 2026 · Branch `claude/lfh-441-e-b`

## 1. Methode

Wie bei E-a war eine **paarweise** Gegenüberstellung möglich und nötig: jedes der zwölf Zeichen ist
eine Komposition, die eine konkrete Referenzdatei reproduzieren soll. Referenz und Katalogausgabe
wurden in ein gemeinsames Wrapper-SVG gesetzt und **einmal** gerastert — links die BABZ-Datei,
rechts `composeFromCatalog` + `renderSvg`, dazwischen eine rote Trennlinie. Damit entsteht das
Vergleichsbild ohne Pixelmontage, und beide Seiten tragen dieselbe Skalierung.

Gerastert mit `@resvg/resvg-js` auf weißem Grund, Schriftbindung über `resvgFontOptions()`; jedes
Paar 900 px breit, also 433 px je Kachel. Alle zwölf Paare wurden einzeln angesehen.

**Die Kürzel selbst sind nicht Gegenstand dieses Protokolls.** Sie wurden in der Messphase vor der
ersten Zeile Kode aus einer eigenen Rasterung der zwölf Referenzdateien abgelesen — zwei
unabhängige Lesungen in verschiedener Reihenfolge und Rastergröße, dazu vier Geometriemessungen und
eine Kritik, die jede Abweichung an der Quelle aufgelöst hat. Jedes Kürzel liegt damit vierfach
belegt vor. Dieses Protokoll hält fest, was die Katalogausgabe daraus macht.

**Geprüfte Themes:** `reference` paarweise (alle zwölf). `accessible-light` und `print-monochrome`
über Kontaktbögen aller zwölf bei 256 px — für Anhang E keine Auslassung per Argument, denn Anhang E
malt mit `blau`, und `blau` ist in beiden Alternativthemes ein anderer Wert.

**Zusätzlich geprüft**, weil E-b die längsten Kürzel des Katalogs einführt: die Kleinrasterung von
E.1.26 (`Log-MW`) bei den echten Zielgrößen 16, 24, 32 und 48 px, danach pixelweise ohne
Interpolation vergrößert. Ein Kontaktbogen mit normierten Kacheln hätte diese Frage nicht
beantwortet, weil er jede Kachel gleich groß darstellt.

## 2. Die abgelesenen Kürzel und ihre Kopfzonen

| Abschnitt | Datei | Mitte | unten links | unten rechts | Kopfzone |
|---|---|---|---|---|---|
| E.1.17 | Fachzug Grundzeichen | `FZ-` | — | `THW` | Zug |
| E.1.18 | Fachzug Führung-Kommunikation | `FZ-FK` | — | `THW` | Zug |
| E.1.19 | Zugtrupp Fachzug Führung-Kommunikation | `FZ-FK` | — | `THW` | Trupp |
| E.1.20 | Fachgruppe Führungsunterstützung | `F` | — | `THW` | Gruppe |
| E.1.21 | Stab | `Stab` | — | `THW` | **keine** |
| E.1.22 | Fachgruppe Kommunikation Typ A | `K` | `A` | `THW` | Gruppe |
| E.1.23 | Fachzug Logistik | `FZ-Log` | — | `THW` | Zug |
| E.1.24 | Zugtrupp Fachzug Logistik | `FZ-Log` | — | `THW` | Trupp |
| E.1.25 | Fachgruppe Logistik-Verpflegung | `Log-V` | — | `THW` | Gruppe |
| E.1.26 | Fachgruppe Logistik Materialwirtschaft | `Log-MW` | — | `THW` | Gruppe |
| E.1.27 | Trupp Logistik-Materialerhaltung | `Log-M` | — | `THW` | Trupp |
| E.1.28 | Trupp Logistik-Verbrauchsgüterversorgung | `Log-VG` | — | `THW` | Trupp |

Anders als bei E-a trägt nur **ein** Zeichen eine Zusatzkennzeichnung unten links: E.1.22, das
einzige mit „Typ A" im Dateinamen. Der Strich in sieben der zwölf Kürzel ist U+002D; die
Hyphenklasse trifft den Referenzbalken auf 0,18 mm, der Halbgeviertstrich ist mit Faktor 2,0
ausgeschlossen, und zwischen U+002D, U+2010 und U+2011 ist die Wahl in Arimo bildgleich.

## 3. Was die Paarbilder bestätigt haben

- **Alle 25 Beschriftungsläufe erscheinen** — zwölf mittige, zwölf `THW`, ein `A`. Kein Zeichen ist
  leer, keines trägt einen Lauf zu viel oder zu wenig.
- **Die Kopfzonen stimmen Stück für Stück**: drei Marken bei E.1.17, E.1.18 und E.1.23, zwei bei
  E.1.20, E.1.22, E.1.25 und E.1.26, eine bei E.1.19, E.1.24, E.1.27 und E.1.28, keine bei E.1.21.
  Der Kontaktbogen zeigt alle zwölf zusammen und macht die Verteilung auf einen Blick prüfbar.
- **E.1.22 ist die genaueste Übereinstimmung des Blocks.** Es ist eine der zwei normgerechten
  Referenzdateien, und im Paarbild deckt sich jede der drei Zonen sichtbar — das mittige `K`
  zentriert, `A` links unten, `THW` rechts unten.
- **E.1.23 und E.1.24 bleiben unterscheidbar**, obwohl sie im Katalog dasselbe Kürzel `FZ-Log`
  tragen und die Innenreihe von E.1.24 nicht gebaut wird: drei Kopfmarken gegen eine ist im Bild
  eindeutig. Dasselbe gilt für E.1.18 gegen E.1.19. Ob das **fachlich** genügt, ist damit nicht
  gesagt und bleibt Fachreview.
- **Kein Kürzel verlässt seinen Körper.** Der kritische Fall ist E.1.26: `Log-MW` steht mit
  1,9 mm Abstand zu beiden Körperkanten (Tinte 2,922…29,078 mm bei Körper 1…31 mm), wo die Referenz
  2,4 mm frei lässt. Der Lauf ist sichtbar breiter als in der Referenz und bleibt mit Abstand
  innerhalb der Fläche.

**Kein echter Befund an den zwölf Zeichen.** Anders als bei D.4, wo acht Fehler sämtliche Gates
bestanden hatten, und anders als bei E-a, wo die Sichtprüfung zwei Referenzdefekte fand, hat dieses
Protokoll keinen Fehler an der Umsetzung gefunden. Die zehn Füllflächenbefunde dieses Slice sind in
der Messphase am SVG-Quelltext gefunden worden, nicht hier.

## 4. Die drei deklarierten Abweichungen — im Bild bestätigt

Diese drei sind **Beschluss, nicht Befund**. Sie tragen ein technisches `deviation`-Review mit
Begründung in `coverage-manifest.ts` und stehen in der Entscheidungsnotiz.

**E.1.19 und E.1.24** zeigen den Unterschied am deutlichsten. Die Referenz trägt eine Kopfmarke
über dem Rahmen und **drei weitere im Körper**, in einem weißen Streifen, den ihr oben um 3 mm
verkürztes Innenfeld freilässt. Die Katalogausgabe trägt die `trupp`-Kopfzone, das Kürzel und ein
normgerechtes Innenfeld — die Innenreihe und der weiße Streifen fehlen beide. Genau so angekündigt.

**E.1.17** war der einzige Punkt, an dem der erste Bildeindruck täuschte: `FZ-` wirkt in **beiden**
Kacheln linkslastig, und die angekündigten 2,0 mm Differenz sind im Paarbild nicht abzulesen. Der
Grund ist nicht die Lage, sondern der Bindestrich. `anchor: 'middle'` zentriert die Vorschubbreite,
und die Tinte eines Bindestrichs füllt seinen Vorschub nicht aus — ein auf `FZ-` endendes Kürzel
sieht deshalb auch bei exakter Zentrierung links aus. Nachgeprüft an der IR statt am Auge: der
mittige Lauf steht bei `x = 16` mit `anchor: middle`, das ist die Körpermitte von 1…31 mm. Die
Abweichung liegt also bei der Referenz, wie die Deviation-Note sagt, und der Katalog zentriert
korrekt. Zur Gegenprobe: bei E.1.20 (`F`) und E.1.22 (`K`) — einzelne Versalien ohne Bindestrich —
ist die Zentrierung im Bild unmittelbar sichtbar.

**Die zehn Füllflächenbefunde** sind in jedem betroffenen Paarbild als weißer Streifen der
Referenzseite zu sehen: oben bei E.1.18, E.1.20 und E.1.21, unten bei E.1.23, E.1.25, E.1.26,
E.1.27 und E.1.28, und bei E.1.19 und E.1.24 oben als der Streifen, in dem die Innenreihe steht.
Die Katalogseite ist in allen zehn Fällen vollflächig gefüllt und setzt die Beschriftung auf die
Grundlinien 18,0 und 24,0 mm — die Werte der 22 normgerechten E.1-Dateien.

## 5. Die Alternativthemes tragen

**`accessible-light`** setzt den Körper auf `#4970d2`. Weiße Schrift bleibt in allen zwölf Zeichen
lesbar, auch die kleineren `THW`- und `A`-Läufe; die schwarzen Kopfmarken bleiben vom Körper
unterschieden, und die gestrichelte Kontur des Themes trennt Körper und Oberfläche zusätzlich ohne
Farbe. Nichts verschwindet.

**`print-monochrome`** setzt den Körper auf `#767676`. Dasselbe Bild in Grau: alle 25 Läufe lesbar,
Kopfmarken schwarz und klar abgesetzt. Kein Zeichen wird durch den Grauwert unkenntlich, und keines
verliert seine Unterscheidung zum Nachbarn — E.1.18 gegen E.1.19 und E.1.23 gegen E.1.24 stehen im
Graubogen genauso getrennt wie im Referenztheme, weil ihre Unterscheidung an den Kopfmarken hängt
und nicht an der Farbe.

## 6. Die Mehrgrößenreihe und die Ehrlichkeit von `minRenderPx`

E-b führt die längsten Kürzel des Katalogs ein, und über Kompositionen greift **kein**
Lesbarkeits-Gate (siehe offene Kanten). Geprüft wurde deshalb am längsten Lauf, E.1.26 `Log-MW`.

Deklariert: **37 px** für den mittigen Lauf, **61 px** für `THW`. Gemessen am Bild:

| Zielgröße | `Log-MW` | `THW` |
|---|---|---|
| 16 px | nicht lesbar | nicht lesbar |
| 24 px | nur erkennbar, wenn man weiß, was steht | nicht lesbar |
| 32 px | lesbar, grenzwertig — das `W` verschwimmt | nicht lesbar |
| 48 px | klar lesbar | gerade lesbar |

Beide Zusicherungen halten und sind **konservativ**: `Log-MW` ist bereits bei 32 px lesbar, wo 37 px
deklariert sind, und `THW` bei 48 px, wo 61 px deklariert sind. Was der deklarierte Wert ausschließt
— 24 px und darunter — ist tatsächlich unlesbar. Damit ist `minRenderPx` bei den längsten Kürzeln
des Bestands eine ehrliche Angabe und nicht eine übernommene.

Die genauen Schwellen, an denen die Lesbarkeit umschlägt, sind damit **nicht** bestimmt: gerastert
wurden 16, 24, 32 und 48 px, nicht 37 und 61. Für die Frage, ob die deklarierten Werte tragen,
genügt das — sie liegen beide auf der sicheren Seite der gemessenen Punkte.

## 7. Die sechzehn Zeichen aus E-a sind unberührt

Die Boxweitung dieses Slice wirkt auf **alle** mittigen Beschriftungsläufe, also auch auf die
sechzehn aus E-a. Dass sich ihr Bild nicht geändert hat, ist nicht behauptet, sondern belegt: von
den 24 neuen Snapshotdateien ist keine einzige eine Änderung an E.1.1 bis E.1.16 — `git status`
führt für den Snapshotordner **null** modifizierte Dateien. `boxMm` ist eine Zusicherung der IR und
wird nicht in den SVG-Text serialisiert; eine weitere Box ändert deshalb kein Bild.

## 8. Zwei Beobachtungen, die keine Befunde sind

**Der Schriftschnitt der Referenz ist nicht Arimo.** Bei `Stab` (E.1.21) und in den `Log`-Kürzeln
sind die Rundungen der Referenzglyphen sichtbar anders geschnitten als in der Katalogausgabe. Das
ist keine Abweichung dieses Slice: Anhang J hat den Referenzschnitt verworfen, der Katalog setzt
Arimo als einzige Schrift, und die Datei liegt mit geprüfter Prüfsumme im Repository. Die Folge
davon ist dieselbe, die die Boxweitung nötig gemacht hat — Arimo ist breiter.

**Das weiße Innenfeld der Referenz fehlt weiterhin.** Jede Referenzdatei zieht zwischen schwarzem
Rahmen und farbiger Fläche einen weißen Rand (`rect` 2/7 bis 30/25 neben dem Körper 1/6 bis
31/26); `base-symbols.ts` führt die Taktische Formation als **ein** Rechteck. Das ist in allen
zwölf Paarbildern zu sehen, ist aber keine Eigenschaft dieses Teilslice und trifft C.1.1/C.1.2 und
die sechzehn E-a-Zeichen genauso.

## 9. Reviewgrenze

Dieses Protokoll trifft **keine fachliche Aussage** über Anhang E. Es hält fest, was die
Katalogausgabe im Vergleich mit der Referenz zeigt. Bedeutung, Verwechslungsfreiheit und
einsatztaktische Eignung der zwölf Zeichen bleiben — wie die 318 offenen Fachreviews insgesamt —
einer entsprechend fachkundigen Person vorbehalten. Bei diesen zwölf wiegt das besonders: ihre
gesamte fachliche Unterscheidung liegt in Buchstabenkürzeln, die am Referenzbild abgelesen wurden,
und zwei von ihnen bilden ein Merkmal ihrer Referenz bewusst nicht ab.
