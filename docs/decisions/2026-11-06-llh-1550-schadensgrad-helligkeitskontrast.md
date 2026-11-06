# Schadensgrad auf dem Körper: Unterlegung nach Helligkeitskontrast

Stand: 06.11.2026

## Anlass

LLH-1513 hat den Schadensgrad (5.8.4) auf rot gefülltem Körper weiß unterlegt
(`2026-11-05-llh-1513-schadensgrad-auf-rotem-koerper.md`). Die Regel griff nur bei **gleicher**
Farbe. Offen blieb, dass sich die roten Diagonalen auch von anderen Füllungen nur im Farbton,
nicht in der Helligkeit absetzen. Im Lifeline Hub betrifft das die Ausmaße „gering“ (Grün) und
„groß“ (Orange). Für Menschen mit Rot-Grün-Schwäche und im Druckgrau sind die drei Stufen dort
schwer zu unterscheiden (LLH-1550).

## Befund

Helligkeitskontrast der Diagonalen (`rot`) gegen die Füllung, nach WCAG. Spalte „schwächstes“ ist
der kleinste Wert über alle ausgelieferten Themes (`RENDER_THEMES`; dark nutzt die Palette von
accessible-light).

| Füllung | reference | accessible-light | print-monochrome | schwächstes |
|---|---|---|---|---|
| rot | 1,00 | 1,00 | 1,00 | 1,00 |
| braun | 1,09 | 1,09 | 2,02 | 1,09 |
| grau | 1,10 | 1,10 | 1,11 | 1,10 |
| blau | 2,75 | 1,15 | 1,26 | 1,15 |
| gruen | 1,16 | 1,16 | 1,62 | 1,16 |
| hellblau | 1,20 | 1,20 | 1,45 | 1,20 |
| orange | 1,69 | 1,69 | 2,47 | 1,69 |
| hellgrau | 2,17 | 2,17 | 2,99 | 2,17 |
| hellgruen | 2,27 | 2,27 | 3,58 | 2,27 |
| gelb | 3,59 | 3,59 | 4,23 | 3,59 |
| schwarz | 5,22 | 5,22 | 3,66 | 3,66 |
| weiss | 4,02 | 4,02 | 5,74 | 4,02 |

Grün und Orange liegen weit unter dem Vertrag für Nicht-Text-Grafik
(`MINIMUM_NON_TEXT_CONTRAST`, 3 : 1), ebenso Blau (THW), Braun, Grau, Hellblau, Hellgrün und
Hellgrau. Nur Gelb, Weiß und Schwarz halten ihn in jedem Theme.

## Entscheidung

- **Die Unterlegung aus LLH-1513 gilt, sobald die Strichfarbe der Diagonalen gegen die Fläche unter
  ihnen in einem der ausgelieferten Themes unter 3 : 1 bleibt**, nicht mehr nur bei gleicher Farbe.
  Gestalt, Breite (0,5 mm je Seite), Malreihenfolge und die neu gezogene Kontur bleiben wie in
  LLH-1513.
- **Gemessen über alle Themes, nicht nur gegen die Referenz.** Die Ableitung kennt das spätere
  Theme nicht, die Geometrie ist für alle dieselbe. Blau hält in der Referenz 2,75 : 1, in
  accessible-light (`#4970d2`) aber nur 1,15 : 1. Gelb hält überall (mindestens 3,59 : 1) und
  bleibt deshalb unverändert.
- **Schwelle ist der bestehende Vertrag**, keine neue Zahl: dieselbe Grenze wie für Nicht-Text-
  Grafik gegen die Oberfläche (`DAMAGE_CONTRAST`) und für den offenen Polyzug (`open-body-tint.ts`).
- **Mit Unterlegung grenzt Rot an Weiß:** 4,02 : 1 in reference, accessible-light und dark,
  5,74 : 1 im Druckgrau. Damit ist das Akzeptanzkriterium (≥ 3 : 1 gegen den Untergrund der
  Diagonalen) auf Grün und Orange erfüllt.
- **Abwägung Kartenbild.** Mehr Weiß im Zeichen: Auf jeder farbigen Fläche außer Gelb steht der
  Schadensgrad jetzt als rot-weißes Gitter. Das ist auffälliger als vorher, aber ein Schadensgrad
  ist eine Aussage, die auffallen soll, und dieselbe Gestalt auf allen Füllungen liest sich
  einheitlicher als ein Wechsel zwischen „mit“ und „ohne“ je nach Ausmaß. Auf weißer Kartenfläche
  fällt das Weiß außerhalb des Körpers nicht auf, auf dunklem Grund wirkt es wie die Hinterlegung.
- **Strichelung der Organisation bleibt.** Die neu gezogene Kontur (`bodyExtra`) trägt den
  `bodyStrokeDashToken` des Körpers, die Renderer strichelten bisher aber nur `role: 'body'`. Die
  durchgezogene Wiederholung deckte so die Signatur zu. Bei Rot (Feuerwehr, Muster leer) fiel das
  nicht auf, mit Blau (THW), Grün (Polizei), Orange, Braun und Hellgrau ginge der nicht-farbliche
  Kanal verloren. SVG und Canvas stricheln deshalb auch `bodyExtra`, wenn es einen Schlüssel
  trägt (`render/body-dash.ts`). Andere Zusatzkonturen tragen keinen und bleiben durchgezogen.
- **Verworfen:**
  - *Nur Grün und Orange aufnehmen* (Liste statt Regel): Jede andere Füllung mit demselben Befund
    (THW-Blau, Braun, Grau) bliebe ohne Grund schwach, und eine neue Palette müsste die Liste
    nachziehen.
  - *Nur gegen die Referenz messen*: ließe Blau aus, das in accessible-light und im Druckgrau fast
    verschwindet.
  - *Gegenfarbe* (Diagonalen schwarz oder weiß): gibt die Farbe nach DV 102 auf, wie schon in
    LLH-1513 verworfen.

## Folgen

- Patch-Release. Zeichnungen mit Schadensgrad auf einem Körper, dessen Fläche unter den Diagonalen
  braun, grau, blau, grün, hellblau, orange, hellgrau oder hellgrün ist, bekommen die Unterlegung
  und die Zusatzkontur. Auf Weiß, Gelb und Schwarz bleiben sie bytegleich, auf Rot wie seit
  LLH-1513.
- Die Notiz `basis: 'constructed'` (Quelle `DAMAGE_CASING_SIDE_MM`) nennt die Füllung wie bisher.
- Lifeline Hub: Versionssprung von `@einsatzzeichen/*`, Ausmaß „gering“, „groß“ und „katastrophal“
  zeigen dann alle die Unterlegung, „mittel“ (Gelb) nicht.
