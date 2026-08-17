# E-c — Visuelle QA aller neun Darstellungen

> Prüfprotokoll · 17. August 2026 · Branch `claude/lfh-442-e-c`

## 1. Methode

Wie bei E-a und E-b war eine **paarweise** Gegenüberstellung möglich und nötig: jedes der neun
Zeichen ist eine Komposition, die eine konkrete Referenzdatei reproduzieren soll. Referenz und
Katalogausgabe wurden in ein gemeinsames Wrapper-SVG gesetzt und **einmal** gerastert — links die
BABZ-Datei, rechts `composeFromCatalog` + `renderSvg`, dazwischen eine rote Trennlinie. Damit
entsteht das Vergleichsbild ohne Pixelmontage, und beide Seiten tragen dieselbe Skalierung.

Gerastert mit `@resvg/resvg-js` auf weißem Grund, Schriftbindung über `resvgFontOptions()`; jedes
Paar 900 px breit, also 450 px je Kachel. Alle neun Paare wurden einzeln angesehen.

**Ein Fallstrick der Einbettung, der beinahe ein leeres Protokoll erzeugt hätte:** die erste Fassung
des Wrappers hat beide Seiten als `<image href="data:image/svg+xml;base64,…">` eingesetzt. Die
Referenzkachel kam vollständig, die Katalogkachel **ohne jeden Text** — resvg rastert eingebettete
SVG-Bilder ohne die gebundene Schrift. Das Bild sah nicht kaputt aus, sondern wie ein Katalogzeichen
ohne Kürzel. Beide Seiten liegen deshalb als verschachteltes `<svg>` im Wrapper. Wer diesen Aufbau
wiederverwendet, muss ihn an einem Zeichen mit bekannter Beschriftung anschauen, bevor er neun Bilder
in Folge beschreibt.

**Alle Zahlen dieses Protokolls stammen aus eigenen Läufen**; wo eine Zahl **nicht** aus einer
eigenen Messung stammt — weil sie ein Normwert der Quelle ist oder aus der Bauphase kommt —, steht
es an Ort und Stelle (beides in Abschnitt 4). Drei Quellen:

- `norm37.mjs` (eigener Pfadparser über alle 37 E.1-Referenzdateien, keine Rasterung) — Füllfläche,
  Grundlinien, Formen und Teilpfade der Strichebene, Glyphen je Lauf.
- `tinte.ts` (eigene Rasterung, 2048 px = 64 px/mm) — Tintenhülle der weißen Beschriftungsläufe,
  für Referenz und Katalogausgabe mit **demselben** Verfahren: Zeilenprofil weißer Bildpunkte im
  Inneren der Körperfläche, zusammenhängende Zeilen bilden einen Lauf.
- die Zwischendarstellung selbst (`composeFromCatalog`) — Schriftgrade, Boxen, `minRenderPx`,
  Körperpolygon.

**Geprüfte Themes:** `reference` paarweise (alle neun). `accessible-light` und `print-monochrome`
über Kontaktbögen aller neun bei 256 px — für Anhang E keine Auslassung per Argument, denn Anhang E
malt mit `blau`, und `blau` ist in beiden Alternativthemes ein anderer Wert.

**Zusätzlich geprüft:** die Kleinrasterung des längsten Kürzels dieses Slice bei den echten
Zielgrößen 16, 24, 32 und 48 px, danach punktweise ohne Interpolation vergrößert (eigener
PNG-Schreiber, Nearest Neighbour). Ein Kontaktbogen hätte diese Frage nicht beantwortet, weil er
jede Kachel gleich groß darstellt.

## 2. Die Kürzel und ihre Kopfzonen

Die Spalte „Kopfzone" ist geteilt, weil Referenz und Katalog sich bei genau einem Zeichen
unterscheiden — bei E-b war das nicht nötig, dort trugen alle zwölf auf beiden Seiten dasselbe.

| Abschnitt | Datei | Mitte | Glyphen mittig | unten rechts | Kopfzone Referenz | Kopfzone Katalog |
|---|---|---|---|---|---|---|
| E.1.29 | Trupp Schwerer Transport | `TS` | 2 | `THW` | eine Marke | Trupp |
| E.1.30 | Media Team | `MT` | 2 | `THW` | zwei Marken | Gruppe |
| E.1.31 | System Bereitstellungsraum 500 | `SysBR` | 5 | `THW` | **zwei Balken** | **keine** (siehe 4.) |
| E.1.32 | Technischer Zug | `TZ` | 2 | `THW` | drei Marken | Zug |
| E.1.33 | Trupp Einsatzstellensicherung | `ESS` | 3 | `THW` | eine Marke | Trupp |
| E.1.34 | Trupp Mobiler Hochwasserpegel | `MHP` | 3 | `THW` | eine Marke | Trupp |
| E.1.35 | Trupp Unbemannte Luftfahrtsysteme | `UL` | 2 | `THW` | eine Marke | Trupp |
| E.1.36 | Virtual Operations Support Team | `VOST` | 4 | `THW` | drei Marken | Zug |
| E.1.37 | Ortsverband | `OV` | 2 | `THW` | keine | keine |

Die Buchstaben selbst sind in der Messphase vor der ersten Zeile Kode aus einer Rasterung der neun
Referenzdateien abgelesen worden; die Referenz führt sie in Kurven umgewandelt und ohne `<text>`.
Dieses Protokoll hat sie **ein weiteres Mal gelesen**, nämlich auf der linken Kachel der neun
Paarbilder, und kommt auf dieselben neun Läufe. Zwei Stützen dazu aus eigener Messung:

- **Glyphenzahl je Lauf** (`norm37.mjs`, Spalte „Glyphen"): 2/2/5/2/3/3/2/4/2 mittig, neunmal 3
  unten rechts. Das deckt sich Zeichen für Zeichen mit den abgelesenen Kürzeln. Für E.1.31 heißt
  das im Besonderen: fünf Glyphen mittig, so viele wie `SysBR` Buchstaben hat, und kein sechster
  Pfad, in dem eine Ziffer stecken könnte. Die 500 aus dem Dateinamen steht nicht im Bild, und ihr
  Fehlen im Kürzel ist damit keine Abweichung. (Dass im **gesamten** E.1 keine Ziffer vorkommt, ist
  eine Aussage der Messphase; dieses Protokoll hat die neun Dateien dieses Slice gezählt.)
- **Kopfzonen über Teilpfad-Buchführung** statt über die Abwesenheit eines Elementtyps. Der
  Rahmenpfad trägt zwei Teilpfade (Außen- und Innenkontur des Strichs); alles darüber hinaus ist
  Kopfzone. Gemessen: E.1.29 3 Teilpfade (2 + 1 Marke), E.1.30 4 (2 + 2), E.1.31 4 (2 + zwei
  Balken), E.1.32 5 (2 + 3), E.1.33/34/35 je 3 (2 + eine Marke, geführt als `<circle>` und nicht als
  Pfad), E.1.36 5 (2 + 3), **E.1.37 2 — nur der Rahmen, restlos erklärt, kein Rest für eine Marke.**
  Eine naive Prüfung „gibt es ein `<circle>`?" hätte E.1.33 bis E.1.35 fälschlich mit E.1.37 in eine
  Klasse gestellt.

## 3. Was die Paarbilder bestätigt haben

- **Alle 18 Beschriftungsläufe erscheinen** — neun mittige und neun `THW`. Kein Zeichen ist leer,
  keines trägt einen Lauf zu viel oder zu wenig. Dass die **Referenz** nicht mehr als diese zwei
  Läufe führt, steht nicht am Zeilenprofil (dessen Fenster ist je Datei so gewählt, dass es in der
  Füllfläche liegt, und kann darüber nichts sehen), sondern an `norm37.mjs`: es trennt die Läufe
  ohne Fenster über die Überlappung der y-Intervalle aller Glyphen der Typo-Ebene und liefert für
  jede der neun Dateien genau zwei Gruppen. Eine Zusatzkennzeichnung unten links kommt in E-c nicht
  vor.
- **Die Kopfzonen stimmen Stück für Stück**: eine Marke bei E.1.29, E.1.33, E.1.34 und E.1.35, zwei
  bei E.1.30, drei bei E.1.32 und E.1.36, keine bei E.1.37 — und bei E.1.31 die angekündigte Lücke
  gegen zwei Balken der Referenz. Der Kontaktbogen zeigt alle neun zusammen und macht die Verteilung
  auf einen Blick prüfbar.
- **Die sechs normgerechten Referenzdateien decken sich in der Lage der Beschriftung genau.**
  Gemessene Oberkante/Grundlinie des mittigen Laufs, Referenz gegen Katalog: E.1.30
  13,141…17,984 gegen 13,141…17,984 mm, E.1.32 ebenso, E.1.34 ebenso, E.1.33 13,047…18,063 gegen
  13,063…18,047 mm, E.1.35 13,141…18,063 gegen 13,141…18,047 mm, E.1.36 13,047…18,063 gegen
  13,063…18,047 mm. Die Reste von 0,016 mm sind ein Bildpunkt bei 64 px/mm, also die
  Rasterschwelle und keine Verschiebung.
- **Der `THW`-Lauf steht in allen neun auf derselben Grundlinie und an derselben rechten Kante.**
  Katalog 21,078…23,984 mm senkrecht und rechte Tintenkante 28,969 mm (Rasterung, 64 px/mm); die
  Referenz liegt in allen neun Dateien bei 29,027 mm (Pfadparser, 29,0269…29,0276). Die beiden
  Zahlen stammen aus **verschiedenen** Verfahren und stehen 0,058 mm auseinander, also rund
  3,7 Bildpunkte — deutlich mehr als die Rasterschwelle von einem Bildpunkt, mit der dieser
  Abschnitt die Reste von 0,016 mm oben erklärt. Diese Schwelle trägt hier also nicht, und woher
  die 0,058 mm im Einzelnen kommen, misst dieses Protokoll nicht; Abschnitt 9 hält für denselben
  Lauf fest, dass der Katalog ihn 5,9 % breiter setzt (9,531 gegen 9,000 mm) und dass er dabei nach
  links wächst, weil er rechts verankert ist. Für die geprüfte Frage genügt es: beide Ablesungen
  liegen weniger als 0,04 mm neben x = 29, `anchor: 'end'` bei x = 29 trifft die Referenz.
- **Kein Kürzel verlässt seinen Körper.** Der kritische Fall ist E.1.31: `SysBR` steht mit Tinte
  5,516…26,453 mm im Körper 1…31 mm und in der Beschriftungsbox 2…30 mm, hat also 3,5 mm Luft zu
  jeder Boxkante. Senkrecht ist es enger: die Unterlänge des `y` reicht bis 19,453 mm gegen eine
  Boxunterkante von 19,501 mm — 0,048 mm. Das ist gemessen, nicht gerechnet, und es bestätigt die
  Warnung im Kommentar von `compose.ts`, dass senkrecht praktisch kein Platz mehr ist.

## 4. Die eine deklarierte Abweichung und die drei Befunde — im Bild

**E.1.31, die Kopfzone.** Das ist **Beschluss, nicht Befund**; die Begründung trägt ein technisches
`deviation`-Review in `coverage-manifest.ts`. Im Paarbild ist es der auffälligste Unterschied des
Slice: die Referenz setzt über den Rahmen zwei schwarze senkrechte Balken, die Katalogseite lässt
den Platz leer. Das Zeichen bleibt dadurch von E.1.30, E.1.32 und E.1.36 unterscheidbar, weil sein
Kürzel mit fünf Glyphen das breiteste des Slice ist — aber es ist im Bild **nicht** von einem
Zeichen ohne Kopfzone zu unterscheiden, weil es genau das ist, was der Katalog zeichnet. Wer diese
Kachel ohne die Note liest, sieht ein Zeichen ohne Stärkegrad und kein Zeichen mit einem
unbenannten.

**Die drei Füllflächen- und Grundlinienbefunde** stehen als Datum in `ANHANG_E_C_FILL_FINDINGS`;
alle drei sind im Paarbild zu sehen, zwei davon deutlich, einer leise:

| | Referenz (gemessen) | Norm der Quelle | im Bild |
|---|---|---|---|
| E.1.29 | Fläche unten 22,4998 mm, mittig 14,4999, `THW` 21,5004 | 25,0 / 18,0 / 24,0 | weißer Streifen unter der blauen Fläche, Beschriftung sichtbar höher |
| E.1.31 | Fläche unten 22,0003 mm, mittig 15,0001, `THW` 21,0005 | 25,0 / 18,0 / 24,0 | dasselbe, Streifen noch etwas höher |
| E.1.37 | Fläche unten 24,9999 mm, mittig 18,9999, `THW` 23,9995 | 25,0 / 18,0 / 24,0 | **kein** Streifen; allein das `OV` steht 1 mm zu hoch |

**Die mittlere Spalte ist der Normwert der Quelle und keine Messung an der Katalogausgabe** — das
gehört auseinandergehalten, denn nur zwei ihrer drei Zahlen sind am Katalog überhaupt ablesbar. Die
beiden Grundlinien sind es und treffen: die Zwischendarstellung setzt den mittigen Lauf auf 18,0 mm
und den `THW`-Lauf auf 24,0 mm, und die Tintenmessung aus Abschnitt 3 bestätigt beide im Rahmen des
Rasters (18,047 und 23,984 mm). Die 25,0 mm sind es **nicht**: der Katalog zeichnet
den Körper als **eine** Fläche bis zu seiner Unterkante bei 26,0 mm — `formation` von 6,0, der
Gebäudekörper von E.1.37 von 3,0 an — und hat bei 25,0 mm gar keine Kante. Genau das hält
Abschnitt 9 als eigene Beobachtung fest. Die Katalogseite ist bei allen dreien gleich gebaut; der
Unterschied im Bild kommt allein von der Referenzseite.

An den Läufen selbst nachgemessen statt aus der Quelltextmessung übernommen: bei E.1.29 steht der
mittige Lauf der Referenz bei 9,547…14,563 mm und der des Katalogs bei 13,063…18,047 mm — 3,5 mm
Abstand; der `THW`-Lauf 18,594…21,484 gegen 21,078…23,984 mm — 2,5 mm. Die beiden Verschiebungen
sind **verschieden groß**, und genau das ist der Befund, den die verkürzte Fläche nicht erklärt (der
Grundlinienabstand der Referenz beträgt dort 7,0005 statt 6,0 mm). Bei E.1.31 sind beide
Verschiebungen gleich 3,0 mm, dort ist der Abstand mit 6,0004 mm normgerecht.

Der Grundlinienabstand über alle 37 E.1-Dateien, selbst gemessen: **30 führen 6,0 mm**, drei 6,5 mm
(E.1.18, E.1.20, E.1.21), drei 7,0 mm (E.1.27, E.1.28, E.1.29), eine 5,0 mm (E.1.37). Der Katalog
folgt der Mehrheit. Direkt normgerecht in allen vier Kennwerten sind 19 der 37 Dateien; die drei,
deren mittiger Lauf keine flachfüßige Glyphe führt (E.1.9, E.1.10, E.1.13), kommen über den
Bogenunterschnitt dazu — das ist eine Messung der Bauphase und nicht dieses Protokolls, ihre
Rohwerte stehen aber in meinem eigenen Lauf (18,0633 / 18,0848 / 18,0848 mm gegen 18,0).

## 5. E.1.37 — das einzige Zeichen des Anhangs auf einem anderen Grundzeichen

Alle 36 übrigen E.1-Zeichen stehen auf der Taktischen Formation; E.1.37 steht als einziges auf dem
Gebäudekörper. Das Paarbild wurde dafür zusätzlich groß gerastert (1520 px, 760 px je Kachel).

**Was auf der Referenzseite steht:** ein schwarzer Umriss, darin ein weißer Rand, darin die blaue
Füllung in **zwei** Teilen — ein Dachdreieck und darunter ein Rechteck, getrennt von einem weißen
Band in Höhe der Traufe. Das `OV` sitzt im Rechteck, `THW` rechts unten.

**Was auf der Katalogseite steht:** ein Polygon `[16,3] [1,10] [1,26] [31,26] [31,10]` als **eine**
blaue Fläche mit schwarzer Kontur. Kein weißer Rand, kein Traufband, keine Traufkante. Die fehlende
Traufkante ist dabei richtig und nicht ausgelassen, und das ist selbst nachgesehen: die Strichebene
von E.1.37 trägt **zwei** Teilpfade mit durchgehender Hauskontur (Traufknick bei 28,798 Einheiten),
die von `1.7_Gebäude.svg` dagegen **drei** — Außenkontur, Innenrechteck ab 29,764 und ein getrennt
geschlossenes Dachdreieck mit Basis 28,346, also eine waagerechte Traufkante bei 10,000…10,500 mm.
Der Katalogkörper folgt E.1.37 und nicht `1.7`. Die Füllebene ist umgekehrt zeichengleich: der
Punktezug der Hülle kommt in genau zwei der 661 Referenzdateien vor, in diesen beiden.

**Wie die Beschriftung im Polygon sitzt** — die eigentliche Frage dieses Abschnitts, weil E.1.37 der
erste Fall des Bestands ist, an dem sie überhaupt gestellt werden kann:

- Die Box des mittigen Laufs steht bei x 2…30 mm und y 11,912…19,501 mm. Ihre Oberkante liegt
  1,912 mm unter der Traufhöhe 10,0 mm, ab der das Polygon die volle Breite 1…31 mm führt; alle vier
  Boxecken liegen damit innerhalb der Fläche (eigene Punkt-in-Polygon-Prüfung gegen den Punktezug
  der Zwischendarstellung). Mit der alten Konstante — mittige Grundlinie 12 mm unter der
  **Ober**kante des Körpers, hier also 15,0 mm — hätte die Box bei 8,912 mm begonnen, und dort führt
  die linke Polygonkante erst bei x = 3,331 mm; dieselbe Prüfung meldet beide oberen Ecken als
  **außerhalb**. Im Bild wäre der Lauf in die Dachschräge gelaufen.
- Die Tinte hält mehr Abstand als die Box: `OV` steht bei 13,063…18,047 mm, also 3,06 mm unter der
  Traufhöhe, und waagerecht bei 11,234…21,047 mm — 9,8 mm breit in einer Fläche von 30 mm. Im
  großen Paarbild ist deutlich zu sehen, dass der Lauf frei im Rechteckteil des Hauses steht und
  die Dachschräge nirgends berührt.
- **Der Preis dafür ist sichtbar.** Die Referenz setzt ihr `OV` auf 18,9999 mm, der Katalog auf
  18,0 — im großen Paarbild steht das rechte `OV` erkennbar höher als das linke, um 1 mm, bei
  23,75 px/mm also gut 23 Bildpunkte. Das ist die einzige Stelle des Slice, an der der Katalog eine
  Referenz bewusst nicht trifft, ohne dass die Referenz selbst eine verkürzte Fläche zeigt: bei
  E.1.29 und E.1.31 führt das Auge der weiße Streifen, hier fehlt dieser Hinweis. Wer die beiden
  Kacheln ohne die Befundnote vergleicht, sieht einen Fehler und keine Entscheidung.

**Neu und erst an dieser Körperform prüfbar: die gestrichelte Kontur der Alternativthemes.** Beide
Themes setzen für `blau` die Signatur `[2, 1.5]` mm, und E.1.37 ist der erste Katalogkörper mit
schrägen Kanten und drei Ecken, der sie trägt. Angesehen bei 1024 px, ausschnittweise punktweise
vergrößert:

- **Firstpunkt (16, 3):** ein Strich läuft über die Spitze hinweg und endet erst auf der rechten
  Schräge. Die Ecke ist gezeichnet.
- **Rechter Traufknick (31, 10):** ein Strich beginnt genau in der Ecke und läuft die senkrechte
  Kante hinunter. Die Ecke ist gezeichnet.
- **Linker Traufknick (1, 10):** die Ecke fällt in eine **Lücke**. Der Strich der Dachschräge endet
  oberhalb, der nächste beginnt unterhalb auf der Senkrechten; die Ecke selbst trägt nur die Kante
  der Füllfläche.

Das ist kein Fehler der Umsetzung — eine Strichsignatur mit fester Teilung kann nicht garantieren,
dass jede Ecke eines Polygons auf einen Strich fällt, und die Zeichenfarbe hält den Umriss auch in
der Lücke. Es ist aber eine Eigenschaft, die bei rechteckigen Körpern nie auffiel und bei weiteren
Vielecken wieder auftreten wird. Beide Alternativthemes zeigen dasselbe Bild, weil beide dieselbe
Signatur führen.

## 6. Die Alternativthemes tragen

**`accessible-light`** setzt den Körper auf `#4970d2`. Alle 18 Läufe bleiben weiß und lesbar, auch
die kleineren `THW`; die schwarzen Kopfmarken bleiben vom Körper unterschieden, und die gestrichelte
Kontur trennt Körper und Oberfläche zusätzlich ohne Farbe. Nichts verschwindet. E.1.31 ist im Bogen
die einzige der acht Formationen mit leerem Kopfplatz — im Alternativtheme genauso wie im
Referenztheme —, und E.1.37 ist an seinem Umriss sofort von allen acht zu unterscheiden.

**`print-monochrome`** setzt den Körper auf `#767676`. Dasselbe Bild in Grau: alle 18 Läufe lesbar,
Kopfmarken schwarz und klar abgesetzt. Kein Zeichen wird durch den Grauwert unkenntlich, und keines
verliert seine Unterscheidung zum Nachbarn — E.1.30 (zwei Marken) gegen E.1.32 und E.1.36 (drei) und
E.1.29 gegen E.1.33 bis E.1.35 (je eine) stehen im Graubogen genauso getrennt wie im Referenztheme,
weil ihre Unterscheidung an den Kopfmarken und den Kürzeln hängt und nicht an der Farbe.

## 7. Kleinrasterung und die Ehrlichkeit von `minRenderPx`

**Zuerst ein Befund an der Bauunterlage.** Der Rezeptkommentar zu E.1.36 in
`recipes-anhang-e.ts` nennt `VOST` „das längste Kürzel dieses Teilslice mit vier Glyphen". Das ist
falsch: `SysBR` (E.1.31) führt **fünf** Glyphen, und an der Tinte gemessen ist es auch das breitere.
Katalogausgabe, mittiger Lauf, 2048 px:

| Kürzel | Tinte | Breite |
|---|---|---|
| `SysBR` (E.1.31) | 5,516…26,453 mm | **20,938 mm** |
| `VOST` (E.1.36) | 6,406…25,453 mm | 19,047 mm |
| `MHP` (E.1.34) | 8,719…23,469 mm | 14,750 mm |

Über alle 37 beschrifteten Rezepte gemessen bleibt `Log-MW` aus E-b mit 26,109 mm der breiteste
Lauf des Katalogs; `SysBR` folgt nach `Log-VG` (23,250 mm) und den beiden `FZ-Log` (je 21,750 mm)
an fünfter Stelle und ist der breiteste dieses Slice. Geprüft wurde deshalb an `SysBR`, mit `VOST`
zum Vergleich daneben. `SysBR` ist dabei auch der informativere Fall: es ist das einzige Kürzel des
Slice mit Kleinbuchstaben auf x-Höhe und einer Unterlänge, und die fallen vor den Versalien.

**Der falsche Satz steht zum Zeitpunkt dieses Protokolls unberichtigt im Kode.** Ihn zu ändern wäre
eine Änderung am Ergebnis des Baus und nicht an diesem Protokoll; die Berichtigung des Halbsatzes
„Außerdem das längste Kürzel dieses Teilslice mit vier Glyphen" im Rezeptkommentar zu E.1.36 in
`packages/catalog/src/recipes-anhang-e.ts` bleibt deshalb ausdrücklich offen und ist hier als
Aufgabe festgehalten, nicht als erledigt.

> **Nachtrag vom 18. August 2026 (Teilslice E-c, LFH-442).** Der Absatz darüber ist **überholt**:
> die Berichtigung ist noch in diesem Teilslice erfolgt. Der Rezeptkommentar zu E.1.36 in
> `packages/catalog/src/recipes-anhang-e.ts` liest inzwischen „Mit vier Glyphen das zweitlängste
> Kürzel dieses Teilslice — **nicht** das längste, wie hier zunächst stand" und führt `SysBR` mit
> fünf Glyphen und der breiteren Tinte als den längeren; die Entscheidungsnotiz
> [`2026-08-17-anhang-e-c.md`](../decisions/2026-08-17-anhang-e-c.md) führt die Berichtigung unter
> „Offene Kanten" als erledigt. Befund Nr. 1 dieses Protokolls ist damit **geschlossen**; offen
> bleibt allein, was Punkt 2 und 3 in Abschnitt 10 festhalten. Die ursprüngliche Aussage bleibt
> stehen, damit sichtbar ist, dass sie zum Zeitpunkt der Sichtprüfung galt — dieselbe Buchführung,
> die dieser Slice bei den drei fremden Notizen angewandt hat.

Aus der Zwischendarstellung gelesen, nicht übernommen: `minRenderPx` ist **37** für den mittigen
Lauf (Schriftgrad 7,0786 mm) und **61** für `THW` (4,2443 mm). Gemessen am Bild — jede Größe einzeln
gerastert und danach punktweise vergrößert:

| Zielgröße | `SysBR` | `VOST` | `THW` |
|---|---|---|---|
| 16 px | nicht lesbar | nicht lesbar | nicht lesbar |
| 24 px | nicht lesbar — fünf Striche ohne Buchstabenform | nur erkennbar, wenn man weiß, was steht | nicht lesbar |
| 32 px | lesbar, grenzwertig — `y` und `s` laufen ineinander | lesbar | nicht lesbar, `W` zerfällt |
| 48 px | klar lesbar | klar lesbar | gerade lesbar |

Beide Zusicherungen halten und sind **konservativ**: der mittige Lauf ist bereits bei 32 px lesbar,
wo 37 px deklariert sind, und `THW` bei 48 px, wo 61 px deklariert sind. Was der deklarierte Wert
ausschließt — 24 px und darunter — ist tatsächlich unlesbar.

Die genauen Schwellen, an denen die Lesbarkeit umschlägt, sind damit **nicht** bestimmt: gerastert
wurden 16, 24, 32 und 48 px, nicht 37 und 61. Für die Frage, ob die deklarierten Werte tragen,
genügt das — sie liegen beide auf der sicheren Seite der gemessenen Punkte. Zwischen 24 und 32 px
liegt der Umschlag; wo genau, sagt dieses Protokoll nicht, und es rechnet ihn auch nicht aus.

Nebenbefund derselben Reihe: die beiden Kürzel fallen **verschieden** aus. Bei 24 px zeigt `VOST`
noch Buchstabenformen, `SysBR` nicht mehr — dieselbe Rendergröße, derselbe Schriftgrad, aber
Kleinbuchstaben auf x-Höhe verlieren früher. Ein `minRenderPx`, das nur am Schriftgrad rechnet,
kennt diesen Unterschied nicht.

## 8. Die 28 Zeichen aus E-a und E-b sind unberührt

Der Kernschritt dieses Slice — die mittige Grundlinie rechnet gegen die Unterkante des Körpers
statt gegen seine Oberkante — wirkt auf **alle** mittigen Beschriftungsläufe, also auch auf die 28
aus E-a und E-b. Dass sich ihr Bild nicht geändert hat, ist nicht behauptet, sondern belegt: eigener
`git status` auf `packages/catalog/src/__snapshots__` führt **18 neue und null geänderte** Dateien —
die neun Einzel- und neun Mehrgrößen-Snapshots von E.1.29 bis E.1.37 und sonst nichts. An der
Taktischen Formation (Hülle 6…26 mm) liefern beide Rechenwege denselben Wert 18,0 mm.

## 9. Drei Beobachtungen, die keine Befunde sind

**Der Schriftschnitt der Referenz ist nicht Arimo, und in E-c ist gemessen, wo es am meisten
ausmacht.** Der mittige Lauf des Katalogs ist in allen neun Zeichen breiter als der der Referenz,
aber sehr ungleich: `MT` +3,1 %, `MHP` +5,4 %, `UL` +8,2 %, `TZ` +8,4 %, `OV` +11,3 %, `VOST`
+14,5 %, `TS` +20,3 %, `SysBR` +21,3 %, `ESS` +33,0 %. Die drei größten Werte tragen ein oder zwei
`S`; die kleinsten keins. Das `S` des Referenzschnitts ist also deutlich schmaler als das von Arimo.
Der `THW`-Lauf ist durchweg 5,9 % breiter (9,531 gegen 9,000 mm) und wächst dabei nach links, weil
er rechts verankert ist. Keine Abweichung dieses Slice: Anhang J hat den Referenzschnitt verworfen,
der Katalog setzt Arimo als einzige Schrift.

**Das weiße Innenfeld der Referenz fehlt weiterhin.** Jede der neun Referenzdateien zieht zwischen
schwarzem Rahmen und farbiger Fläche einen weißen Rand; bei E.1.37 kommt das 1 mm hohe Traufband
dazu. `base-symbols.ts` führt beide Körper als **eine** Fläche. Das ist in allen neun Paarbildern zu
sehen, ist aber keine Eigenschaft dieses Teilslice und trifft C.1.1/C.1.2 und die 28 Zeichen aus E-a
und E-b genauso.

**Zwei Einordnungen, die im Bild richtig aussehen und trotzdem offen sind.** E.1.30 („Media Team")
trägt zwei Kopfmarken und E.1.36 („Virtual Operations Support Team") drei; die Katalogseite
reproduziert beide genau, obwohl kein Stärkewort im Dateinamen steht. Geometrisch ist das
eindeutig gemessen, fachlich ist es ungeprüft — ob ein Media Team eine Gruppe und ein VOST ein Zug
ist, entscheidet keine Zeichnung. Ebenso ist die runde Versalie in `VOST` und `OV` als `O` gesetzt;
eine Negativkontrolle gegen eine Null gibt es im Bestand nicht, weil dort — nach der Messphase — in
E.1 keine Ziffer vorkommt. Im Paarbild sind beide Formen deckungsgleich mit dem `O` der Referenz,
was die Lesung stützt, sie aber nicht gegen eine Ziffer abgrenzt.

## 10. Reviewgrenze

Dieses Protokoll trifft **keine fachliche Aussage** über Anhang E. Es hält fest, was die
Katalogausgabe im Vergleich mit der Referenz zeigt. Bedeutung, Verwechslungsfreiheit und
einsatztaktische Eignung der neun Zeichen bleiben — wie die 327 offenen fachlichen Reviews
insgesamt, davon 37 im Bereich E (eigener Lauf `pnpm cli coverage`) — einer entsprechend
fachkundigen Person vorbehalten. Bei diesen neun wiegt das besonders: ihre gesamte fachliche
Unterscheidung liegt in Buchstabenkürzeln, die am Referenzbild abgelesen wurden, eines von ihnen
lässt eine Kopfzone der Referenz bewusst weg, und eines steht 1 mm über der Beschriftung seiner
Referenz.

**Anders als bei E-b endet dieses Protokoll nicht mit „kein Befund".** Gefunden wurden drei Dinge,
keines davon ein Fehler an einer Zeichnung:

1. Die falsche Aussage über das längste Kürzel im Rezeptkommentar zu E.1.36 (Abschnitt 7). **Offen
   und zu berichtigen** in `packages/catalog/src/recipes-anhang-e.ts`; dieses Protokoll ändert
   keinen Kode.
   *Nachtrag vom 18. August 2026: berichtigt, noch in diesem Teilslice — dieser Punkt ist
   geschlossen. Der Wortlaut steht im Nachtrag zu Abschnitt 7.*
2. Die im Bild sichtbare 1-mm-Differenz bei E.1.37, die sich nur über die Befundnote erklärt
   (Abschnitt 5). Festgehalten, nicht zu ändern — sie ist die beschlossene Folge davon, dass der
   Katalog der Mehrheit der Quelle folgt.
3. Die Lücke der gestrichelten Kontur am linken Traufknick von E.1.37 in beiden Alternativthemes
   (Abschnitt 5). Festgehalten; sie wird bei jedem weiteren Vieleck wieder auftreten.
