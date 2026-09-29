# LFH-585: Messung von Arimo Italic und den Schriftkandidaten

> Stand: 29. September 2026
> Bezug: `docs/decisions/2026-09-29-lfh-585-ersatzschrift-und-kursiv.md` (Abschnitt 5 und 9),
> Entscheidung des Projektinhabers: Option B (Arimo bleibt, statische Stufe 500)
> Diese Notiz ändert keinen Code und keine Schriftdatei. Die Schriftdateien liegen nicht im
> Repository.

## Kurzfassung

- **Arimo Italic ist eine geneigte Arimo, keine eigenständige Kursive.** Die Buchstaben haben
  dieselben Konturen wie aufrecht und, zurückgeneigt, dieselben Breiten (Abweichung höchstens
  2 %). Im Bereich U+0020–U+00FF sind die Vorschübe gleich. Bei Stufe 500 weicht nur µ ab.
- **Die Neigung ist 11,0°, die Referenz neigt um 9,0°.** Laut `post.italicAngle` wären es 12°.
  An der Versalhöhe von D.1.1 (2,92 mm) macht der Unterschied 0,1 mm aus.
- **resvg wählt eine statische Datei „Arimo Medium Italic" zuverlässig.** Das ist mit
  Prüfsummen auf Pixelebene belegt. Normale, fette und mittlere aufrechte Läufe bleiben
  bit-gleich. Allerdings bekommt **jeder** kursive Lauf diese Datei, auch ein kursiv-fetter. Die
  variable Kursivdatei allein zeichnet resvg immer bei Stufe 400.
- **Vorschlag für D.1.1:**
  - eine statische Datei `Arimo-MediumItalic.ttf`, abgeleitet wie `Arimo-Bold.ttf`;
  - im Schema `fontStyle: 'italic'`, nur zusammen mit `fontWeight: 500` zulässig;
  - eine eigene Metrikdatei, weil die Unterschneidung anders ist als aufrecht.
- **Nebenbefund zu B:** „Bezeichnung" in Stufe 500 ragt bei heutiger Schriftgröße 0,58 mm über
  die rechte Kante seiner Box (Stand `b2a8697f`, Breite 24,3 mm) hinaus, kursiv 0,81 mm. Mit
  der Boxbreite 24,9 mm aus der laufenden Umsetzung von B passt der aufrechte Lauf knapp,
  der kursive ragt noch 0,21 mm hinaus. Außerdem kehrt nach dieser Schätzung **keiner** der
  verkleinerten Läufe mit B auf Referenzgröße zurück.
- **Option C würde die Referenz messbar besser treffen.** Die Laufweite je Lauf weicht dann
  im Median um 3,7–5,0 % ab statt um 10,7 % (ohne Breitenanpassung; mit einer eigens
  verschmälerten Instanz 2,6–2,8 %). Die x-Höhe weicht um +6 bis +7 % ab statt um +9,7 %.
  Zwei bis drei von drei Formmerkmalen stimmen, statt keinem. Schätzungsweise 11–14 von 17
  verkleinerten Läufen kämen auf Referenzgröße, statt keinem. Bei der Strichstärke gewinnt C
  nur 3 Punkte, weil B schon auf 3 % trifft. Die Streuung von Lauf zu Lauf bleibt gleich groß.
- **Gut passende Kandidaten haben einen reservierten Namen:** IBM Plex Sans („Plex") trifft alle
  drei Formmerkmale, Source Sans 3 („Source") zwei. Ohne reservierten Namen passt nur Open Sans
  in der Breite, trifft aber nur das g. Fira Sans Medium ist 22 % zu kräftig.

## 1. Material und Methode

**Dateien.** Alle stammen aus dem Repository google/fonts, Zweig `main`, abgerufen am
29. September 2026. Der Kopf des Zweigs war Commit `23e54b51ddff` vom 24. September 2026. Die
Größen stimmen mit der Tabelle in Abschnitt 9 der Entscheidungsnotiz überein.

| Datei | Byte | SHA-256 |
|---|---|---|
| `ofl/arimo/Arimo-Italic[wght].ttf` | 543.196 | `a80fc54fd0233c1dfe298577c4d00f5ae81d5bb83510975e473c47e699b7f4ed` |
| `ofl/arimo/OFL.txt` | 4.384 | `11cce536cd2f3864d767003af5dcd739e2e15818cf2279b6175edeadd3960992` |
| `ofl/firasans/FiraSans-Medium.ttf` | 457.248 | `cbc1842cbed8c1d1146ba7c9db97d8f28c9bedfd25f41c5b0e1259ca48622328` |
| `ofl/firasans/FiraSans-MediumItalic.ttf` | 472.624 | `d892b7a6e874d839bc7e712b1d57cf64bcf8013ae143c3eab09e0fd9a0604411` |
| `ofl/firasans/OFL.txt` | 4.370 | `8f24842e9174beda18a556c2ae7d54f5dc444340c19a3a9ef77e23bca366adbd` |
| `ofl/opensans/OpenSans[wdth,wght].ttf` | 532.636 | `36643644f318a812aab2d2ed3bb98f8cf0872527f835fe9398d95fe6b9adb878` |
| `ofl/opensans/OpenSans-Italic[wdth,wght].ttf` | 583.992 | `fe269381e992f32e135801740998544d6235061e37c93ec067ad2be3edd5b17b` |
| `ofl/opensans/OFL.txt` | 4.389 | `fbbbcfef55318de350562559b671360de6d597112ecc5c73881b05092db89602` |
| `ofl/sourcesans3/SourceSans3[wght].ttf` | 646.340 | `042fe2cc0b933e328410d7acbd0aa6a1873dca5aef81875f4bc214b08825c7b9` |
| `ofl/sourcesans3/SourceSans3-Italic[wght].ttf` | 395.372 | `39e3ab05ccd7cb94907c31005bb5bec1d5432f0b096a2b782976e217a540eb6c` |
| `ofl/sourcesans3/OFL.txt` | 4.579 | `09746787287a289323b0ec3cff4d1a4a801331b82b7207c1e186f5d26619a392` |
| `ofl/ibmplexsans/IBMPlexSans[wdth,wght].ttf` | 537.244 | `3b031aa4216174205bd8471f88a49b91f093169e9e87bd5262242bc5967fe2e3` |
| `ofl/ibmplexsans/OFL.txt` | 4.456 | `7e6b2818edbd8f6a01ae80641cc8f16a51080d08fb4e532be3a0b6f74adb07da` |
| `ofl/ptsans/PT_Sans-Web-Regular.ttf` | 442.960 | `9cc831490532009bae2b3ce0d39c62adfc889060beb421593bfd9d2396d0f10a` |
| `ofl/ptsans/PT_Sans-Web-Bold.ttf` | 470.240 | `3128bd5ecf01816e59a23d54c57a7a6b14615b07db53ff277c77376010265b05` |
| `ofl/ptsans/OFL.txt` | 4.425 | `2758cf7a872827f39661cf8cc24188113c030447aefb5ca7145993650076ca8c` |
| `ofl/archivo/Archivo[wdth,wght].ttf` | 658.596 | `0e094a7d3c7c4c25cf1310c4b30014f1dae9332220b1c2c88f4fa996f0b05053` |
| `ofl/archivo/OFL.txt` | 4.388 | `108b4e57c9c796d3d38d0428ca7ee39de47ad93187302718d9b2d8864b9b716b` |

`ofl/arimo/OFL.txt` ist byte-gleich mit dem eingecheckten `Arimo-OFL.txt`. Arimo Italic trägt
dieselbe Versionsnummer wie die eingecheckte aufrechte Datei (1.341).

**Methode.** Sie ist dieselbe wie in Abschnitt 2 der Entscheidungsnotiz und gilt für jede
Schrift gleich, auch für Arimo:

- **Referenzmenge:** 132 verschiedene Läufe mit Großbuchstaben, 476 Buchstaben aus 120 Dateien.
  D.1.1 ist ausgenommen und wird getrennt gemessen.
- **Laufweite:** Jeder Lauf wird mit HarfBuzz (`hb-shape` 14.5) gesetzt, mit Unterschneidung.
  Gemessen wird die Tintenbreite. Beide Seiten werden auf die Versalhöhe bezogen, das heißt auf
  die Tintenhöhe des H.
- **Verhältnis:** Breite der Referenz geteilt durch Breite der Schrift. Werte unter 1 heißen: Die
  Schrift ist breiter.
- **Strichstärke:** eine waagerechte Messlinie bei 30 % der Versalhöhe, Median über
  H N E F L B D P R K T.
- **Gegenprobe:** Mit HarfBuzz ergibt Arimo 400 genau 0,906 und Arimo 700 genau 0,860. Das sind
  die Werte der Entscheidungsnotiz. Die Methode gibt die frühere Messung also wieder.

**Arimo-Stufen.** Sie wurden abgeleitet wie in `scripts/font/subset-arimo.sh`, aber im
Arbeitsverzeichnis der Messung und nicht im Repository:

- Arimo Italic wurde mit denselben `pyftsubset`-Argumenten auf eine Teilmenge reduziert.
- Die Stufe 500 wurde mit `instancer` (`updateFontNames=True`) aus dieser Teilmenge und aus dem
  eingecheckten `Arimo[wght].ttf` abgeleitet.
- Für alle vier Dateien lief `scripts/font/export-metrics.py`.
- Verwendet wurde fontTools 4.66, das Skript pinnt 4.63. Die Prüfsummen der abgeleiteten Dateien
  sind deshalb nur Anhaltspunkte, keine Pins.

## 2. Arimo Italic

### 2.1 Neigung

Gemessen wurde die Mittellinie eines Stamms in zwei Höhen: am B, am linken Stamm von h, n und i,
am rechten Stamm des u, dazu am l.

| | Neigung an den Glyphen | `post.italicAngle` |
|---|---|---|
| Referenz D.1.1 „Bezeichnung" | **9,0°** (B 8,97; i 9,06; h 9,03; n 8,99 und 9,00; u 8,93) | – |
| Arimo Italic 400 und 500 | **11,0°** (B, h, i, l 11,0; n 11,1–11,2; u 11,4–11,5) | −12,0° |
| Fira Sans Medium Italic | 8,0° | −8,0° |
| Source Sans 3 Italic 500 | 11,3° | −11,0° |
| Open Sans Italic 500 | 12,0° | −12,0° |

Arimo Italic neigt 2° stärker als die Referenz. An der Versalhöhe von D.1.1 (2,92 mm) versetzt
die Neigung die Oberkante eines Stamms um 0,57 mm, in der Referenz um 0,46 mm. Der Unterschied
beträgt **0,1 mm**.

### 2.2 Echte Kursive oder geneigte Aufrechte?

**Arimo Italic.** Zurückgeneigt um 11°, sind die Buchstaben höchstens 2 % breiter als in Arimo
500 aufrecht (B 1,014; e 1,012; a 1,019; alle anderen im Wort ±0,6 %). Alle haben dieselbe
Konturzahl. Arimo Italic ist eine geneigte Arimo mit kleinen optischen Korrekturen. Das g ist
in beiden Schnitten einstöckig.

**Referenz.** Um 9° zurückgeneigt, sind die kursiven Buchstaben im Median 3,4 % schmaler als
dieselben Buchstaben in aufrechten Läufen der Referenz. Beim e sind es 7 %, beim g 12 %. Das g
wechselt die Form: aufrecht ist es zweistöckig mit drei Konturen, kursiv einstöckig mit zwei
(Abschnitt 3.3). Die Referenz hat also eine echte Kursive, nur wenig schmaler als ihre Aufrechte.
Die Strichstärke senkrecht zum Stamm misst 0,143 der Versalhöhe (aufrecht 0,146).

Für D.1.1 heißt das: Das einstöckige g von Arimo Italic passt zufällig zur Referenz. Die
Kursivformen sonst (etwa e) kann Arimo nicht nachbilden.

### 2.3 Vorschübe, Unterschneidung, Tintenränder

Verglichen wurde mit den Metrikdateien aus `export-metrics.py`, jeweils gleiche Stufe gegen
gleiche Stufe.

| | Stufe 400 | Stufe 500 |
|---|---|---|
| Zeichen in der cmap (aufrecht / kursiv) | 645 / 645 | 645 / 645 |
| Vorschub verschieden | 54, **keins in U+0000–00FF** | 59, in U+0000–00FF **nur µ** (1196 → 1180) |
| Unterschneidungspaare aufrecht / kursiv | 108 / 103 | 109 / 111 |
| davon mit gleichem Wert | 31 | 15 |
| Glyphen mit Tinte links vor dem Vorschub (xMin < 0), aufrecht / kursiv | 47 / 131 | 51 / 132 |
| Glyphen mit Tinte rechts hinter dem Vorschub, aufrecht / kursiv | 60 / 266 | 85 / 271 |

Die abweichenden Vorschübe liegen in Latin Extended (ď, ľ, ĩ, ť, Ɓ …). Das bestätigt die
indirekte Aussage der Entscheidungsnotiz.

Die Unterschneidung ist dagegen eine andere. Die meisten Paare haben kursiv einen anderen Wert.
Ein kursiver Lauf braucht deshalb eine eigene Metrikdatei. Die aufrechte Datei reicht nicht.

Die stärksten Überhänge im Grundalphabet mit Umlauten und Ziffern:

- links das j mit −229 Einheiten, also 0,47 mm bei der Schriftgröße von D.1.1;
- rechts das f mit 177 Einheiten, also 0,37 mm.

### 2.4 „Bezeichnung" in D.1.1

Gemessen gegen Commit `b2a8697f`: Der Lauf beginnt bei x = 2,673 mm, linksbündig. Die
Schriftgröße ist 4,243 mm, die Box reicht von 2,673 bis 26,973 mm (Breite 24,3 mm). Die
Referenztinte liegt bei 2,673–24,017 mm. Die laufende Umsetzung von B hat die Box im
Arbeitsstand auf 24,9 mm verbreitert, also bis 27,573 mm. Die Tabelle nennt beide.

| Schnitt | Laufweite Referenz ÷ Schrift | Tinte links | Tinte rechts | über Box 24,3 mm | über Box 24,9 mm |
|---|---|---|---|---|---|
| Arimo 400 (heute) | 0,892 | 3,021 | 26,934 | – | – |
| Arimo 500 aufrecht | 0,869 | 3,000 | 27,551 | **0,58 mm** | – (0,02 mm Luft) |
| Arimo Italic 500 | 0,854 | 2,785 | 27,779 | **0,81 mm** | **0,21 mm** |
| Fira Sans Medium Italic (zum Vergleich) | 0,899 | – | – | – | – |

- **Die Box wird schon durch die Stufe 500 verletzt, nicht erst durch die Kursive.** Der Lauf
  besteht fast nur aus Kleinbuchstaben und wird in Stufe 500 um 2,5 % breiter. Im Median aller
  Läufe ist es knapp 1 %.
- **Am Laufende steht kein kursiver Überhang über den Vorschub hinaus.** Das g endet 0,05 mm vor
  dem Ende des Vorschubs, das B beginnt 0,11 mm hinter dem Anfang.
- **Senkrecht ändert sich nichts.** Oben und unten ist die Tinte in allen drei Schnitten gleich.

### 2.5 Wie resvg wählt

Getestet wurde `@resvg/resvg-js` 2.6.2 mit `loadSystemFonts: false`. Belegt ist die Wahl durch
eine SHA-256 über die Pixel. Das Ergebnis jedes Falls ist bit-gleich zum Bild, das die genannte
Datei **allein** ergibt.

| Dateien | ohne Angabe | `font-weight="500"` | `700` | `font-style="italic"` | italic + 500 | italic + 700 |
|---|---|---|---|---|---|---|
| heute (400 variabel + Bold) | 400 | 400 | Bold | 400 | 400 | Bold |
| + `Arimo-Medium.ttf` | 400 | Medium | Bold | 400 | Medium | Bold |
| + `Arimo-Medium.ttf` + `Arimo-MediumItalic.ttf` | 400 | Medium | Bold | **MediumItalic** | **MediumItalic** | **MediumItalic** |
| + `Arimo-Medium.ttf` + `Arimo-Italic[wght].ttf` (variabel) | 400 | Medium | Bold | Italic 400 | Italic 400 | Italic 400 |

Was die Tabelle zeigt:

- **Aufrechte Läufe bleiben unverändert.** Normale, mittlere und fette Läufe sind mit der
  Kursivdatei bit-gleich zum Stand ohne sie.
- **Jede kursive Anfrage bekommt die einzige kursive Datei**, auch italic + 700 und
  `font-style="oblique"`. Ein Browser würde italic + 700 fett nachzeichnen. Eine IR, die Kursiv
  mit anderen Stufen als 500 zuließe, ergäbe also wieder zwei verschiedene Bilder.
- **Ohne Kursivdatei bleibt der Lauf still aufrecht.** Es gibt weder Fehler noch künstliche
  Neigung.
- **Die variable Kursivdatei wertet resvg nicht aus.** Sie zeichnet immer die Stufe 400, wie bei
  der aufrechten Datei.

**Die Namen der abgeleiteten Datei:**

- Namenseintrag 1: „Arimo Medium", Eintrag 2: „Italic", Eintrag 16: „Arimo", Eintrag 17:
  „Medium Italic";
- `usWeightClass` 500, Kursiv-Bit in `fsSelection` gesetzt, `macStyle` 2.

resvg ordnet die Datei über Eintrag 16 der Familie „Arimo" zu. Der PostScript-Name (Eintrag 6)
lautet nach dem Ableiten `ArimoItalic-MediumItalic`. Er stammt aus der variablen Kursivdatei und
sollte auf `Arimo-MediumItalic` gesetzt werden, damit er zu `Arimo-Bold` passt.

### 2.6 Vorschlag für die Umsetzung (Kursiv in D.1.1)

- **Achse.** Arimo Italic hat nur die Achse `wght` (400–700). Eine Achse `ital` oder `slnt` gibt
  es nicht. Die Neigung ist fest (11°). Der kursive Schnitt ist eine eigene Datei, keine
  Achsenstellung.
- **Datei.**
  - Name: `packages/conformance/assets/Arimo-MediumItalic.ttf`, parallel zu `Arimo-Bold.ttf`
    und zum Medium der Option B.
  - Herleitung in `scripts/font/subset-arimo.sh`: `Arimo-Italic[wght].ttf` laden, gegen die
    Upstream-Prüfsumme `a80fc54f…f4ed` prüfen, mit denselben `pyftsubset`-Argumenten auf die
    Teilmenge reduzieren, mit `instancer` bei wght 500 und `updateFontNames=True` ableiten, den
    PostScript-Namen setzen, `recalcTimestamp = False`.
  - Die variable Kursivdatei nicht einchecken. resvg nutzt sie nicht (Abschnitt 2.5).
  - Größe der abgeleiteten Datei: 57.656 Byte.
- **Pinning.**
  - Eine zweite Upstream-Prüfsumme und eine Prüfsumme der abgeleiteten Datei in
    `packages/conformance/src/fonts.ts`.
  - Die Datei zusätzlich in `resvgFontOptions()`.
  - Lizenz: dieselbe OFL wie Arimo, kein reservierter Name. `Arimo-OFL.txt` deckt die Datei ab.
    Das README unter `packages/conformance/assets/` braucht einen weiteren Eintrag.
- **Metriken.** Eine eigene Datei, etwa `arimo-medium-italic-metrics.json`, erzeugt mit
  `export-metrics.py`, und ein Anbieter nach dem Muster von `TextMetrics.bold`. Die Tintenränder
  unterscheiden sich stark von den aufrechten (Abschnitt 2.3). Das Textmetrik-Gate muss die
  kursiven Tintenränder lesen, nicht die aufrechten.
- **Schema** (`packages/schema/src/geometry.ts`).
  - Ein neues Feld `fontStyle?: 'italic'`, nur zulässig zusammen mit `fontWeight: 500`, etwa als
    Vereinigung `{ fontWeight: 500; fontStyle: 'italic' }`.
  - Fehlt `fontStyle`, bleibt die Ausgabe bytegleich. Der Kommentar „kein `fontStyle`" entfällt.
  - Begründung wie beim bestehenden Kommentar zu `fontWeight`: resvg setzt jede kursive Anfrage
    mit der einen Kursivdatei, ein Browser nicht.
- **Renderer.**
  - SVG: `font-style="italic"` schreiben.
  - Canvas: den Stil in die Schriftangabe aufnehmen.
- **Browser.**
  - Ein zweites `@font-face` mit `font-style: italic; font-weight: 500`, das auf dieselbe
    statische Datei zeigt.
  - Das gilt für `packages/website/src/styles/theme.css` und für `embedTextFont` im
    Review-Server. Beide erklären heute nur `font-style: normal`.
  - Mit derselben Datei zeichnen Browser und resvg dieselben Umrisse.
- **D.1.1 selbst.** Die Box ist mit der Breite 24,3 mm schon für die Stufe 500 zu schmal. Mit
  der Breite 24,9 mm aus der laufenden Umsetzung von B passt der aufrechte Lauf, der kursive
  ragt noch 0,21 mm hinaus (Abschnitt 2.4). Es gibt zwei Wege:
  - Die Box wird auf mindestens 25,11 mm verbreitert. Rechts ist in der Referenz Platz: Die
    Referenztinte endet schon bei 24,0 mm.
  - Der Lauf wird um knapp 1 % kleiner.

  Den Ausschlag gibt ein Gate-Lauf.
- **Nicht empfohlen: Arimo 500 per `skewX(-9)` neigen.**
  - Das träfe den Winkel exakt, und die Laufweite (0,869) läge etwas näher an der Referenz als
    mit Arimo Italic (0,854). Eine neue Datei wäre nicht nötig.
  - Dagegen spricht: Es ist eine künstliche Neigung, die IR bräuchte eine Transformation am
    Textlauf, und das Gate müsste geschert rechnen.
  - Der Gewinn von 2° und 1,5 % Laufweite rechtfertigt das nicht.

## 3. Kandidaten

### 3.1 Lizenz und reservierter Name

Geprüft wurde der volle Text von `OFL.txt` auf „Reserved Font Name" und der Markenhinweis in der
Schriftdatei (Namenseintrag 7).

| Familie | Lizenz | Reservierter Name | Markenhinweis |
|---|---|---|---|
| Arimo | OFL 1.1 | keiner | „Arimo" (Google) |
| Fira Sans | OFL 1.1 | keiner | „Fira Sans" (Mozilla) |
| Open Sans | OFL 1.1 | keiner | „Open Sans" (Google) |
| Archivo | OFL 1.1 | keiner | „Archivo" (Omnibus-Type) |
| Source Sans 3 | OFL 1.1 | **„Source"** | „Source" (Adobe) |
| IBM Plex Sans | OFL 1.1 | **„Plex"** | „IBM Plex" (IBM) |
| PT Sans | OFL 1.1 | **„PT Sans", „ParaType"** | „PT Sans" (ParaType) |

Mit reserviertem Namen muss die abgeleitete Datei (Teilmenge, statische Stufe) umbenannt werden,
und mit ihr das `font-family` in jedem SVG. Ein Markenhinweis allein verlangt das nach der OFL
nicht. Wie bei Arimo auch ist der Name dann nur so zu verwenden, dass er die Schrift bezeichnet.

### 3.2 Messung

Gemessen wurde je Familie in der Stufe, deren Strichstärke der Referenz am nächsten kommt:

- **Variable Schriften:** die Stufe, bei der die Strichstärke 0,156 × Versalhöhe misst, dazu die
  nächste benannte Stufe.
- **Schriften mit Breitenachse:** zusätzlich die Breite, bei der die Laufweite im Median genau
  der Referenz entspricht. Diese Zeile ist durch ihre Konstruktion auf 1,000 geeicht. Für den
  Vergleich zählen dort die Streuung, die x-Höhe und die Formen.
- **Statische Dateien:** so, wie sie vorliegen.

Die Spalten:

- **|1−r|** ist der Median der Abweichung je Lauf, egal in welche Richtung.
- **Verkleinerte Läufe** ist eine Schätzung. Gezählt wird, ob der Lauf bei Referenz-Versalhöhe
  in die Tintenbreite passt, die Arimo heute an dieser Stelle belegt. Es sind 17 der 132
  verschiedenen Läufe. Ohne Zusammenfassen wortgleicher Läufe ergibt dieselbe Auswahl 21, die
  Zahl der Entscheidungsnotiz. Die Boxen haben teils mehr Platz. Die Zahl ist deshalb eine
  untere Grenze.
- **geeicht** heißt: Die Breitenachse ist so gestellt, dass der Median genau 1,000 ergibt.
  resvg braucht ohnehin eine statische Datei, eine solche Instanz ist also umsetzbar. Ihr
  Median ist aber kein unabhängiger Befund.

| Schrift und Stufe | Strichstärke ÷ Versalhöhe (Ref. 0,156) | Laufweite Median (p10–p90) | \|1−r\| | x-Höhe ÷ Versalhöhe (Ref. 0,700) | verkleinerte Läufe in voller Größe |
|---|---|---|---|---|---|
| **Arimo 500 (Option B)** | 0,160 | 0,893 (0,825–0,944) | 10,7 % | 0,768 | 0 von 17 |
| Fira Sans Medium (statisch) | 0,191 | 0,994 (0,913–1,053) | 3,9 % | 0,766 | 13 von 17 |
| Open Sans wght 566, wdth 100 | 0,156 | 0,955 (0,893–0,999) | 4,8 % | 0,756 | 10 von 17 |
| Open Sans wght 500, wdth 100 | 0,140 | 0,963 (0,905–1,008) | 4,2 % | 0,753 | 11 von 17 |
| Open Sans wght 566, wdth 95,3 (geeicht) | 0,154 | 1,000 (0,936–1,050) | 2,6 % | 0,756 | 14 von 17 |
| Source Sans 3 wght 513 | 0,156 | 0,984 (0,915–1,045) | 3,7 % | 0,747 | 13 von 17 |
| Source Sans 3 Medium 500 | 0,153 | 0,986 (0,917–1,047) | 3,8 % | 0,746 | 13 von 17 |
| IBM Plex Sans wght 487, wdth 100 | 0,156 | 0,950 (0,896–0,999) | 5,0 % | 0,744 | 11 von 17 |
| IBM Plex Sans Medium 500, wdth 100 | 0,162 | 0,947 (0,892–0,996) | 5,3 % | 0,745 | 11 von 17 |
| IBM Plex Sans wght 487, wdth 86,9 (geeicht) | 0,152 | 1,000 (0,943–1,051) | 2,8 % | 0,744 | 14 von 17 |
| Archivo wght 473, wdth 100 | 0,156 | 0,890 (0,824–0,945) | 11,0 % | 0,767 | 0 von 17 |
| Archivo wght 473, wdth 87 (geeicht) | 0,150 | 1,000 (0,933–1,054) | 3,3 % | 0,767 | 14 von 17 |
| PT Sans Regular (Web) | 0,119 | 1,033 (0,987–1,073) | 3,4 % | 0,714 | 16 von 17 |
| PT Sans Bold (Web) | 0,196 | 1,010 (0,968–1,048) | 2,8 % | 0,714 | 13 von 17 |

Open Sans hat keine benannte Stufe
500, die nächsten sind Regular (400) und SemiBold (600).

**Formmerkmale.** Automatisch gemessen und im Vergleichsbogen nachgesehen:

- **I mit Serifen:** Tintenbreite des I geteilt durch seinen Stamm. Referenz 2,58.
- **l mit Fuß:** Breite knapp über der Grundlinie geteilt durch die Stammbreite. Referenz 1,60.
- **g zweistöckig:** Referenz ja.

| Schrift | I mit Serifen | l mit Fuß | g zweistöckig | Treffer |
|---|---|---|---|---|
| Referenz | ja (2,58) | ja (1,60) | ja | – |
| Arimo | nein (1,00) | nein (1,00) | nein | 0 von 3 |
| Fira Sans | nein | ja (1,40) | ja | 2 von 3 |
| Open Sans | nein | nein | ja | 1 von 3 |
| Source Sans 3 | nein | ja (1,29) | ja | 2 von 3 |
| IBM Plex Sans | **ja (2,71)** | ja (1,43) | ja | **3 von 3** |
| Archivo | nein | nein | ja | 1 von 3 |
| PT Sans | nein | ja (1,65–2,22) | nein | 1 von 3 |

Beim g von Fira Sans zählt die Automatik zwei Konturen, weil die untere Schleife offen ist. Im
vergrößerten Bild ist das g zweistöckig. Das g von PT Sans ist im Bild einstöckig.

**Korrektur zur Entscheidungsnotiz, Abschnitt 3.5.** Das aufrechte g der Referenz ist
**zweistöckig**, nicht einstöckig. Alle sechs verschiedenen Vorkommen haben drei Konturen, und
das Bild bestätigt es. Einstöckig ist nur das kursive g in D.1.1.

**Kursive der Kandidaten** (für D.1.1, falls C):

- Fira Sans Medium Italic neigt um 8,0°. Die Referenz neigt um 9,0°.
- Source Sans 3 Italic neigt um 11,3°, Open Sans Italic um 12,0°.
- Für IBM Plex Sans und PT Sans liegt keine Kursivdatei vor. Wer eine der beiden wählt, braucht
  einen weiteren Download.

### 3.3 Einzelbefunde

- **Archivo** ist bei normaler Breite so breit wie Arimo (0,890). Erst mit wdth 87 passt die
  Laufweite. Die Formen sind so Arial-nah wie bei Arimo.
- **Fira Sans Medium** trifft die Laufweite ohne Anpassung, ist aber 22 % zu kräftig. Eine
  leichtere Stufe (Book, 450) lag nicht im Download.
- **PT Sans** (Web-Dateien) bestätigt die Stellvertreter der Entscheidungsnotiz:
  - Laufweite 1,033 und 1,010, lokal gemessen waren es 1,021 und 1,001;
  - keine mittlere Stufe, einstöckiges g.
- **x-Höhe:** Keine der Schriften trifft die Referenz (0,700), außer PT Sans (0,714). Die übrigen
  liegen 6–10 % darüber, Arimo mit 0,768 am höchsten.
- **Die Streuung je Lauf** (Abstand p10–p90) ist bei allen Schriften fast gleich, rund 0,11–0,13.
  Keine Familie trifft einzelne Wörter gleichmäßiger als Arimo. C beseitigt den systematischen
  Versatz, nicht die Streuung.

## 4. Nebenbefund zu Option B: die verkleinerten Läufe

Die Entscheidungsnotiz schätzt, dass etwa acht Läufe in Anhang J mit der Stufe 500 auf
Referenzgröße zurückkehren könnten. Die Messung stützt das nicht:

- **Bei Läufen aus Großbuchstaben ist Stufe 500 kaum schmaler als fett.** Bei „TMO", „DMO" und
  „VoIP" beträgt der Unterschied nur 0,5–1 %. Die Angabe „rund 4 % schmaler" ist der Median über
  alle Läufe, und der wird von Kleinbuchstaben bestimmt.
- **Kein Lauf passt in voller Größe.** In voller Referenzgröße wäre jeder der 17 Läufe in Stufe
  500 zwischen 1,8 % („VoIP") und 22 % („Ex") breiter als die Tinte heute.
- **Im Median erreichen die 17 Läufe 92,4 % der Referenzhöhe, heute sind es 93,7 %.** B ist im
  Median also leicht schlechter. 14 fette Läufe gewinnen je etwas Höhe. Drei normal gesetzte
  Läufe verlieren, weil die Stufe 500 sie breiter macht: „mBS" (J.3.3) von 86,2 auf 84,6 %,
  „LtS" (D.2.5) von 94,2 auf 91,3 %, „L" (D.2.4) von 94,2 auf 89,4 %.
- **Mehr bringen nur breitere Boxen.** Wo die Box mehr Platz lässt als die heutige Tinte, kann
  ein Lauf trotzdem wachsen. Das zeigt nur ein Gate-Lauf.

## 5. Fazit: Würde Option C die Referenz messbar besser treffen?

**Ja, deutlich in Laufweite, Formen und Größe, kaum in der Strichstärke.**

Verglichen werden Arimo 500 (Option B) und die beiden am besten passenden Familien, Source Sans 3
(wght 513) und IBM Plex Sans (wght 487), jeweils ohne Breitenanpassung. In Klammern steht Plex
mit geeichter Breite (wdth 86,9).

| Maß | B: Arimo 500 | C: Source Sans 3 / IBM Plex Sans (geeicht) | Gewinn durch C |
|---|---|---|---|
| Laufweite, Median der Abweichung je Lauf | 10,7 % | 3,7 % / 5,0 % (2,8 %) | 5,7–7,0 Punkte |
| Systematischer Versatz der Laufweite | 10,7 % zu breit | 1,6 % / 5,0 % zu breit (0 %) | 5,7–9,1 Punkte |
| Streuung je Lauf (p10–p90) | 0,119 | 0,130 / 0,103 (0,108) | keiner |
| Strichstärke | +3 % | 0 % / 0 % (−3 %) | 3 Punkte |
| x-Höhe | +9,7 % | +6,7 % / +6,3 % | 3 Punkte |
| Formmerkmale I, l, g | 0 von 3 | 2 von 3 / 3 von 3 | 2–3 Merkmale |
| Verkleinerte Läufe in voller Größe (Schätzung) | 0 von 17 | 13 / 11 (14) von 17 | 11–14 Läufe |
| Kursive für D.1.1, Neigung (Referenz 9°) | 11,0° | 11,3° / nicht geladen | keiner |

**In einem Satz:** C verbessert den Laufweitenfehler je Lauf um 5,7–7,0 Prozentpunkte (von
10,7 % auf 3,7–5,0 %, mit geeichter Breite auf 2,6–2,8 %) und die x-Höhe um 3 Punkte. Es trifft
zwei bis drei Formmerkmale statt keinem und bringt schätzungsweise 11–14 der 17 verkleinerten
Läufe auf Referenzgröße. Bei der Strichstärke bleibt der Gewinn bei 3 Punkten.

Die Kosten sind der volle Umbau aus Abschnitt 6 der Entscheidungsnotiz, dazu bei beiden
Familien eine Umbenennung wegen des reservierten Namens. Das ändert das `font-family` in jedem
ausgelieferten SVG. Ohne Umbenennung ginge nur Open Sans (wdth 95, 2,6 %), mit einem Formtreffer
von drei.

Das verschiebt die Empfehlung der Entscheidungsnotiz nicht grundsätzlich:

- B behebt die Strichstärke fast vollständig und billig.
- Was nach B bleibt (Laufweite, Formen, verkleinerte Läufe), kann nur C beheben.
- Wird C verfolgt, sind die Kandidaten nach dieser Messung IBM Plex Sans und Source Sans 3.
  Beide brauchen eine Umbenennung. Bei Plex fehlt noch die Kursivdatei.

## 6. Grenzen

- **Tinte statt Vorschub.** Gemessen ist die Tinte des Laufs, nicht der Vorschub. Kerning kommt
  aus HarfBuzz, also aus den Standard-Features jeder Schrift.
- **Die Zahl der verkleinerten Läufe** ist eine Schätzung gegen die heutige Tintenbreite, nicht
  gegen die Boxen.
- **Die Formmerkmale** gelten für die Standardglyphen. Alternativformen über Stilsätze sind nicht
  berücksichtigt.
- **Die Überschreitung der Box in D.1.1** ist aus den Metriken errechnet. Ob das Gate sie gleich
  bewertet, zeigt erst ein Gate-Lauf.
- **Die Messskripte** liegen außerhalb des Repositorys. Die Methode ist in Abschnitt 1
  beschrieben. Sie ist dieselbe wie in der Entscheidungsnotiz, ergänzt um HarfBuzz für die
  Unterschneidung aller Schriften.
