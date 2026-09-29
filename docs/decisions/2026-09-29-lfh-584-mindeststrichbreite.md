# LFH-584: Mindeststrichbreite je Ausgabegröße beim Rastern

> Stand: 29. September 2026
> Status: **umgesetzt als Renderer-Option, standardmäßig aus.** Katalogdaten und alle bestehenden
> Snapshots bleiben unverändert.
> Bezug: `docs/decisions/2026-09-19-masse-an-der-referenz-ablesen.md` §5.2 und §6

## 1. Anlass

Seit der Überarbeitung vom 19. September zeichnen die Piktogramme wie die Referenz mit 0,5 mm
Strichstärke. Fast alle Zeichen haben eine 32 mm breite ViewBox (524 von 525 Renderfällen, die
übrige ist 32 × 46 mm). Ein Strich von 0,5 mm ist damit bei 16 px Ausgabebreite 0,25 px breit, bei
24 px 0,375 px und bei 32 px 0,5 px. Die Kantenglättung verteilt so einen Strich als blassgraue Spur
über ein ganzes Pixel. §5.2 der Notiz vom 19. September hat festgelegt: Das ist ein Problem der
Rasterung, kein Geometriefehler. Die Daten bleiben referenztreu, die Renderer korrigieren.

Die Strichstärken im Bestand (aktive Striche aller 525 Renderfälle): 1 593 mal 0,5 mm, dazu
fünfmal 0,4 mm, zweimal 0,8 mm, viermal 1 mm oder 1,2 mm.

## 2. Entscheidung

1. **Option `minStrokeWidthPx`** an `renderSvg` und `renderCanvas`, standardmäßig aus. Ist sie
   gesetzt, wird jeder gestrichene Strich, der bei der gewählten Rastergröße schmaler als dieser
   Wert würde, auf ihn angehoben. Breitere Striche, Füllflächen, Text und Strichmuster bleiben
   unverändert. Ein Nullstrich bleibt unsichtbar.
2. **Eine Rechenstelle für beide Renderer:** `packages/core/src/render/min-stroke-width.ts`.
   Die Untergrenze wird in Millimeter der Zeichnung umgerechnet
   (`minStrokeWidthPx × viewBox.width / size`). Striche stehen in beiden Koordinatenräumen der
   Renderer in Millimetern: bei gewöhnlichen Formen vor der Umrechnung in SVG-Einheiten, bei Pfaden
   als Rohmaß unter `scale(…)`. Gruppen kennen nur Verschiebung und Drehung, keine Skalierung. Eine
   Grenze in Millimetern gilt deshalb auch in Piktogrammpfaden im tatsächlichen Pixelraum. SVG und
   Canvas rechnen dieselbe Zahl.
3. **Ohne `size` wirft die Option einen `RangeError`.** Ein frei skalierendes SVG hat keinen festen
   Pixelmaßstab. Stillschweigend nichts zu tun, hieße eine Korrektur zu versprechen, die nicht
   stattfindet.
4. **Empfohlener Wert: 1 px, für alle Größen derselbe** (`RASTER_MIN_STROKE_WIDTH_PX`). Eine Tabelle
   je Größe ist nicht nötig. Die feste Pixelzahl staffelt sich von selbst: 1 px entspricht bei
   16 px 2 mm, bei 24 px 1,33 mm, bei 32 px 1 mm und ab 64 px höchstens 0,5 mm. Ab 64 px ändert
   sie an 0,5-mm-Strichen nichts mehr, ab 128 px an keinem Zeichen des Katalogs (belegt, siehe 3.3).

## 3. Belege

Gemessen an allen 525 Renderfällen (`RENDER_CASES`), gerastert mit resvg und der Katalogschrift
(`resvgFontOptions()`), je Größe ohne Untergrenze und mit 0,5 / 0,75 / 1 / 1,25 / 1,5 px.
Belegbilder liegen nicht im Repository, nur diese Zahlen.

### 3.1 Tabelle 1: Deckung, Clipping, Innenflächen

- **Deckung:** mittlere Deckung eines Strichpixels (Alpha 0–1). Gerastert wurden dafür nur die
  Striche, ohne Füllungen und Text.
- **Strichfläche:** Strichtinte je Bildpixel, ebenfalls nur Striche.
- **Hellanteil:** Anteil der Pixel mit Leuchtdichte über 0,75 im vollständigen Zeichen auf Weiß.
  Das ist ein grobes Maß dafür, wie viel Innenfläche frei bleibt.
- **Clipping:** Die Zeichnung wurde mit 4 mm Rand in eine größere ViewBox gesetzt und im selben
  Maßstab gerastert. Gezählt sind Zeichen mit mehr als 0,05 Pixeln Tinte außerhalb des
  ursprünglichen Rahmens. In Klammern stehen die neun Zeichen, die schon heute bis an die
  Oberkante reichen (`MEASURED_TOP_EDGE_HEADS`).

| Größe | Untergrenze | Deckung | Strichfläche | Hellanteil | Clipping |
|---|---|---|---|---|---|
| 16 px | aus | 0,138 | 0,048 | 0,854 | 0 (0) |
| 16 px | 0,75 px | 0,401 | 0,139 | 0,630 | 1 (0) |
| 16 px | **1 px** | **0,526** | **0,182** | **0,616** | **2 (0)** |
| 16 px | 1,25 px | 0,633 | 0,253 | 0,571 | 122 (2) |
| 16 px | 1,5 px | 0,684 | 0,288 | 0,552 | 262 (3) |
| 24 px | aus | 0,200 | 0,048 | 0,795 | 0 (0) |
| 24 px | 0,75 px | 0,393 | 0,094 | 0,727 | 0 (0) |
| 24 px | **1 px** | **0,545** | **0,132** | **0,700** | **0 (0)** |
| 24 px | 1,25 px | 0,633 | 0,164 | 0,678 | 0 (0) |
| 24 px | 1,5 px | 0,634 | 0,202 | 0,638 | 10 (2) |
| 32 px | aus | 0,257 | 0,048 | 0,813 | 0 (0) |
| 32 px | 0,75 px | 0,382 | 0,071 | 0,739 | 0 (0) |
| 32 px | **1 px** | **0,497** | **0,100** | **0,728** | **0 (0)** |
| 32 px | 1,25 px | 0,592 | 0,124 | 0,704 | 0 (0) |

### 3.2 Warum 1 px und nicht mehr

- **Der Rand setzt die Obergrenze.** Zehn der 14 Grundzeichen führen ihre Körperkontur mit der
  Strichmitte 1 mm vom ViewBox-Rand: Formation, Fahrzeug (Land, Wasser, Luft), Person, Gebäude,
  Stelle, Fläche, Gefahr und Maßnahme. Nur Behälter und Ereignis (4 mm) sowie Posten und
  Spontanhelfer (2 mm) liegen weiter innen. Über alle 525 Renderfälle liegt der äußerste Strich in
  291 Fällen bei 1 mm, in 224 weiter innen. In zehn Fällen reicht er schon heute näher an den Rand
  (gemessen mit der Hüllenrechnung von `checkViewBox`, siehe unten). Bei 16 px reicht ein Strich
  von 1 px (2 mm) genau bis an den Rand. Mit 1,25 px (2,5 mm) ragt er 0,25 mm hinaus, also
  0,125 px. Die Zahl der Zeichen mit messbarer Tinte außerhalb springt dann von 2 auf 122. Dass es
  nicht alle 291 sind, liegt an der Kantenglättung: Ein Achtelpixel Überstand hinterlässt nicht an
  jeder Kante einen messbaren Grauwert, beschnitten ist die Kontur trotzdem. Die beiden Fälle bei
  1 px sind `damage.room-damaged` (0,12 Pixel Tinte außerhalb) und `state.contaminated-animal`
  (0,06 Pixel), zusammen 0,18 Pixel. Das ist Kantenglättung, kein sichtbarer Beschnitt.
- **Innenzeichnungen laufen darüber zu.** In der Sichtprüfung (achtfach vergrößert, 16/24/32 px)
  wird das Mauerwerk in `comms.firewall` bei 16 px und 1,25 px zu einer dunklen Fläche mit kleinen
  Lücken. Bei 1 px bleiben die Steine erkennbar.
- **Das geometrische Gate ist strenger als nötig.** `checkViewBox` misst jede Form als Hülle plus
  halbe Strichstärke in alle Richtungen. Mit 1 px meldet es bei 16 px zehn Zeichen außerhalb, bei
  24 px sechs und bei 32 px drei. Betroffen sind vor allem durchgehende waagerechte Linien mit
  stumpfen Enden (`comms.duplex-operation`, `comms.half-duplex-operation`) und Formen an der
  Oberkante (`state.dead-animal`). Die Rasterung zeigt dort keine Tinte außerhalb des Rahmens. Die
  Untergrenze ist eine Rasterkorrektur und läuft deshalb nicht durch dieses Gate. Ihr Maß ist die
  gemessene Tinte außerhalb des Rahmens.

### 3.3 Warum 1 px und nicht weniger, und warum nicht gestaffelt

- 0,75 px verdreifacht die Deckung bei 16 px (0,14 → 0,40), lässt die Striche bei 32 px aber
  sichtbar grau. 1 px bringt bei allen drei Größen eine mittlere Deckung um 0,5. Aus der
  blassgrauen Spur wird ein Strich.
- Eine Staffel mit 1,25 px bei 24 px wäre ohne Clipping möglich. Sie brächte dort 0,63 statt 0,55
  Deckung, kostet aber weitere Innenfläche (Hellanteil 0,678 statt 0,700). Der Gewinn ist klein,
  und eine Staffel wäre ein zweiter Wert, den jeder Aufrufer kennen müsste. Die feste Pixelzahl
  bleibt einfacher und gilt auch für Größen zwischen den Gate-Stufen.
- Ab 128 px ändert die Untergrenze an keinem der 525 Zeichen ein Byte (Test in
  `multi-size-snapshots.test.ts`). Bei 64 px hebt sie nur die fünf 0,4-mm-Striche auf 0,5 mm.

### 3.4 Was 1 px bei 16 px nicht löst

Ein 1-px-Strich, dessen Mitte auf einer Pixelkante liegt, verteilt sich auf zwei Pixel mit je
halber Deckung. Deshalb bleibt die mittlere Deckung bei 16 px um 0,5 und nicht nahe 1. Das ließe
sich nur durch Einrasten der Geometrie auf das Pixelraster beheben. Das wäre ein Eingriff in die
Lage, nicht in die Breite, und gehört nicht zu dieser Aufgabe.

## 4. Wo die Option wirkt

| Stelle | Rastert klein? | Entscheidung |
|---|---|---|
| `@einsatzzeichen/maplibre` (`createStyleImage`, `addSymbolImage`) | ja, Kartensymbole sind immer Rasterbilder | **standardmäßig an** mit 1 Gerätepixel; `minStrokeWidthPx: null` schaltet ab |
| `@einsatzzeichen/react` (`Einsatzzeichen`, `useEinsatzzeichenSvg`) | je nach Aufrufer | durchgereicht, aus |
| `@einsatzzeichen/web-component` | je nach Aufrufer | neues Attribut `min-stroke-width`, aus |
| QGIS-Bibliothek (`library.ts`) | QGIS rastert selbst aus Vektor-SVG ohne Pixelgröße | nicht anwendbar |
| Fachreview (`review`) | ja, 16 und 24 px sind Gate-Stufen | aus: das Review zeigt die Katalogausgabe |
| Website `zeichen/[slug].png.ts` | nein, 256 px | nicht nötig |
| Website-Miniaturen und Startseite | 64 px und größer | nicht nötig |
| CLI `export` | frei wählbar, schreibt Vektor-SVG | nicht aktiviert |

In maplibre gilt die Untergrenze in Gerätepixeln: `size × pixelRatio` ist die Breite, in der
gezeichnet wird. Ein 32-px-Symbol auf einem Bildschirm mit doppelter Pixeldichte wird mit
64 Gerätepixeln gezeichnet; die 0,5-mm-Striche bleiben dort unverändert.

## 5. Folgen

- Ohne Option erzeugen `renderSvg` und `renderCanvas` byteweise dieselbe Ausgabe wie vorher. Die
  526 Kontaktbögen und alle SVG-Snapshots bleiben unverändert. Der neue Beleg in
  `multi-size-snapshots.test.ts` schreibt keine Datei.
- **maplibre ändert sein Bild bei kleinen Symbolen.** Unter 64 Gerätepixeln Breite werden Striche
  kräftiger. Das ist eine sichtbare Verhaltensänderung des Pakets und gehört als Feature in die
  Release Notes.
- Die Web-Component beobachtet ein drittes Attribut. `OBSERVED_ATTRIBUTES` lautet jetzt
  `['size', 'id-prefix', 'min-stroke-width']`.

## 6. Was offen bleibt

- Im MapLibre-Labor der Website zeichnet der Symbol-Layer jetzt mit Untergrenze, die HTML-Marker
  nicht. Die Marker sind SVG im Browser, die Pixeldichte kennt erst der Browser. Ob die Marker eine
  Untergrenze in CSS-Pixeln bekommen, ist eine eigene Frage.
- Einrasten auf das Pixelraster (siehe 3.4).
- Ob das Fachreview die kleinen Stufen zusätzlich mit Untergrenze zeigen soll, entscheidet der
  Projektinhaber. Heute zeigt es nur die Katalogausgabe.
