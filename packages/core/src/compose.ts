import {
  DEFAULT_STROKE_WIDTH_MM,
  DEFAULT_VIEWBOX_MM,
  type BodyVariantId,
  type BodyMarkId,
  type CapabilityId,
  type ChassisMark,
  type ChassisShape,
  type ColorToken,
  type Drawing,
  type HeadShape,
  type OrganizationId,
  type PictogramDefinition,
  type PictogramId,
  type Primitive,
  type StrengthId,
  type SymbolKind,
  type SymbolSpec,
  type VehicleCategoryId,
} from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from './bounds.js';
import { HEAD_GAP_MM, placeHead, profileFor } from './layout/profiles.js';
import {
  ARIMO_CAP_HEIGHT_FRACTION,
  MINIMUM_TEXT_RENDER_PX,
  verticalTextBoxMm,
} from './render/text-policy.js';
import { validateSpec } from './validate.js';

/**
 * Ob ein Körper ein Polyzug ist, den die Zeichnung **nicht** schließt. `closed` ist optional; die
 * Prüfung fragt deshalb nach `!== true` und nicht nach `=== false` — ein weggelassenes Feld ist
 * ein offener Polyzug.
 */
function isOpenPolyline(primitive: Primitive): boolean {
  return primitive.type === 'polyline' && primitive.closed !== true;
}

/** Senkrechte Mitte der Hülle eines Primitivs, in Millimetern. */
function centerYMm(primitive: Primitive): number {
  const bounds = boundsOfMm(primitive);
  return (bounds.minY + bounds.maxY) / 2;
}

/**
 * Schriftgrad der Fußzone. Gespiegelt aus derselben Rechnung wie `placeHead` — nicht neu
 * erfunden: die Kopfzone darf beim Rechteck-Körper (`defaultAnchorMm` 6) bis zu
 * `defaultAnchorMm - HEAD_GAP_MM - HEAD_TOP_MARGIN_MM` = 4 mm hoch werden, ohne den Körper zu
 * verschieben (siehe `placeHead`, `topMm = max(HEAD_TOP_MARGIN_MM, defaultAnchorMm - HEAD_GAP_MM
 * - headHeightMm)`). Dieselben 4 mm sind der gespiegelte Freiraum unterhalb der
 * Standard-Körperunterkante bis zum gespiegelten Rand (`viewBoxHeight - HEAD_TOP_MARGIN_MM`).
 *
 * Bewusst ein einziger, fixer Wert und keine Herleitung je `LayoutProfile.defaultAnchorMm`: für
 * `person` (1) und `post` (2) ginge dieselbe Formel auf null oder negativ. Ein bedingungsloses
 * Abschneiden auf 0 würde dort einen unsichtbaren `sizeMm: 0`-Text erzeugen — eine Fußzone, die
 * lautlos verschwindet, statt als Geometriebefund aufzufallen. Mit dem festen Wert produziert
 * `person`/`post` stattdessen eine Box, die über die viewBox hinausragt: ein `outside-viewbox`-
 * Befund im viewBox-Gate aus Task 5, wie jede andere zu große Geometrie — belegt in
 * `compose.test.ts`.
 *
 * Bei 4 mm Schriftgrad auf der 32-mm-Standard-viewBox erreicht `effectiveTextPx` erst ab 64 px
 * Rendergröße die Lesbarkeitsschwelle `MINIMUM_TEXT_RENDER_PX` (8 px): 16→2, 24→3, 32→4, 64→8,
 * 128→16, 256→32 px. Der Rückstand unter 64 px ist geometrisch erzwungen, nicht durch zu
 * vorsichtige Wahl entstanden — 4 mm ist der größte Schriftgrad, den der gespiegelte
 * Rand-plus-Abstand für den Rechteck-Körper zulässt, bevor die Fußzone selbst zum Gate-Befund
 * würde.
 */
const FOOT_TEXT_SIZE_MM = 4;

/**
 * Die drei Beschriftungszonen **im** Körper, vermessen an den 16 Referenzdateien E.1.1 bis
 * E.1.16 (11./12. August 2026). Diese 16 tragen dieselben Werte auf zwei Nachkommastellen — die
 * Zonen sind deshalb hier als Layoutregel formuliert und nicht 16-mal am einzelnen Zeichen
 * platziert. Bezugsrahmen ist die Hülle des **tatsächlich platzierten** Körpers, wie bei der
 * Fußzone: verschiebt eine Kopfzone den Körper, wandern die Beschriftungen mit.
 *
 * Geltungsbereich der Zahlen, seit dem Teilslice E-b (17. August 2026) genauer zu fassen: die
 * Regel stammt aus den 16 Dateien E.1.1 bis E.1.16, sie ist **keine** Aussage über E.1 insgesamt.
 * Von den zwölf E-b-Dateien E.1.17 bis E.1.28 weichen zehn ab, und nicht alle im selben Punkt:
 * E.1.19 und E.1.24 nur bei der Füllfläche (oben 10,0 statt 7,0 mm) und mit normgerechten
 * Grundlinien 18,0/24,0; E.1.18, E.1.20 und E.1.21 bei der Füllfläche (oben 9,5 mm) und der
 * mittigen Grundlinie (17,5); E.1.23 sowie E.1.25 bis E.1.28 bei beidem (unten 22,0 oder 22,5
 * statt 25,0 mm; mittig 14,5 bis 15,5 statt 18,0; `THW` 21,0 oder 21,5 statt 24,0). Nur E.1.17 und
 * E.1.22 tragen die Werte dieser Tabelle unverändert. Der Katalog bildet auch die abweichenden
 * Dateien auf die Werte dieser Tabelle ab — dieselbe Entscheidung, die E-a für E.1.6 und E.1.14
 * getroffen hat.
 *
 * | Zone | Referenzmessung (Körper 1/6 bis 31/26 mm) | Regel |
 * |---|---|---|
 * | Mitte | Grundlinie 18,00; Versalhöhe 4,87; Mitte x 16,00 — **keine waagerechte Randvermessung** | 8 mm über der Körperunterkante, waagerecht mittig; Box 1 mm von beiden Körperkanten (`CENTER_LABEL_BOX_MARGIN_MM`) |
 * | unten links | Grundlinie 24,00; Versalhöhe 2,92; linke Kante 3,03 | 2 mm über der Unterkante, 2 mm von der linken Kante (`LABEL_SIDE_MARGIN_MM`) |
 * | unten rechts | Grundlinie 24,00; Versalhöhe 2,92; rechte Kante 29,03 | 2 mm über der Unterkante, 2 mm von der rechten Kante (`LABEL_SIDE_MARGIN_MM`) |
 *
 * In der Tabelle stehen damit **zwei** waagerechte Margen, wo bis E-a eine stand, und sie
 * unterscheiden sich aus einem Grund: die 2 mm sind an den **unteren** Läufen gemessen (linke
 * Kante 3,03, rechte Kante 29,03). Für die Zone „Mitte" gibt es keine vergleichbare Messung — dort
 * sind nur Grundlinie, Versalhöhe und Mittenlage ablesbar, kein waagerechter Rand. Die 2 mm waren
 * für die mittige Box eine von den unteren Läufen übernommene Annahme; ihre vermessene Grenze ist
 * das weiße Innenfeld der Referenz, also 1 mm Marge und 28 mm Breite — belegt an dessen `rect`
 * (2/7 bis 30/25) und nicht aus dem Überstand zurückgerechnet.
 *
 * Die Referenz zieht ihre Ränder gegen dieses weiße Innenfeld, das 1 mm in den Körper eingerückt
 * ist (`rect` 2/7 bis 30/25 neben dem Körper 1/6 bis 31/26). Der Katalog kennt das Innenfeld als
 * eigene Fläche nicht — `base-symbols.ts` führt die Taktische Formation als **ein** Rechteck, das
 * der Kompositionsmotor mit der Organisationsfarbe füllt. Für die **Anker** der unteren Läufe sind
 * es gegen die Körperkante deshalb 2 mm statt 1 mm; der sichtbare Abstand ist derselbe wie in der
 * Referenz. Für die **Box** des mittigen Laufs gilt diese Übertragung seit E-b nicht mehr, siehe
 * `CENTER_LABEL_BOX_MARGIN_MM`.
 */
const LABEL_SIDE_MARGIN_MM = 2;

/**
 * Anker des Laufs oben links gegen die linke Körperkante. **Zurückgerechnet und nicht abgelesen**:
 * die linke Tintenkante der Referenz hängt von der linken Seitenlage ihrer ersten Glyphe ab, und
 * die ist an einer in Kurven umgewandelten Schrift nicht ablesbar. Dieselben Läufe mit Anker
 * 3,0 mm gerastert (4096 px, 18. August 2026) und die Differenz abgezogen ergibt 2,524 mm für
 * `MTF`/`RettD`, 2,498 für `SEG` und 2,442 für `10` — vier der fünf F-a-Läufe auf 2,5 mm, also
 * 1,5 mm rechts der Körperkante 1,0.
 *
 * **Eine eigene Marge und keine Übernahme der 2 mm der unteren Zonen.** Die wären an derselben
 * Rasterung um 0,48 mm zu weit rechts; der Unterschied ist bei 30 mm Körperbreite sichtbar und
 * an fünf Läufen gleichgerichtet. Der Ausreißer ist `F.1.3` („5.000", zurückgerechnet 2,022) —
 * er steht als Befund an seiner Manifestzeile.
 */
const TOP_LEFT_LABEL_ANCHOR_FROM_BODY_LEFT_MM = 1.5;

/**
 * Die Grundlinie des mittigen Laufs, gerechnet gegen die **Unterkante** der Körperhülle. Bis zum
 * Teilslice E-c (17. August 2026) stand hier `minY + 12` gegen die Oberkante; an der Körperform
 * `formation` (Hülle 6…26 mm, Höhe 20 mm) sind „12 mm unter der Oberkante" und „8 mm über der
 * Unterkante" dieselbe Zahl, und 36 der 37 E.1-Dateien stehen auf dieser einen Form. Die Kante war
 * damit nie vermessen — sie war gewählt.
 *
 * **E.1.37 („Ortsverband") ist die erste Datei des Bestands, an der die beiden Lesarten
 * auseinandergehen**, und sie entscheidet an gemessenen Werten zugunsten der Unterkante. Der
 * Gebäudekörper reicht von 3 bis 26 mm; gegen `maxY` gerechnet treffen beide anderen Anker dieser
 * Datei exakt — `THW`-Grundlinie 23,9995 = maxY − 2 und Unterkante der Füllfläche 24,9999 =
 * maxY − 1 —, während `minY + 12` die mittige Grundlinie auf 15,000 mm setzte und damit um 4,0 mm
 * danebenlag (Referenz: 18,9999 mm). Die Box des Laufs verließ dort zusätzlich das Körperpolygon:
 * ihre Oberkante lag bei 8,9124 mm, ihre beiden oberen Ecken außerhalb von
 * [16,3] [1,10] [1,26] [31,26] [31,10] — der erste tatsächliche Fall der offenen Kante „nichts
 * prüft, ob eine Beschriftungsbox im Körper liegt". Mit `maxY − 8` sind es 18,000 mm, Boxoberkante
 * 11,9124 mm, und alle vier Boxecken liegen innen; ab y 10 mm führt das Polygon die volle Breite.
 *
 * **Das ist eine Umformulierung derselben Vermessung gegen die andere Hüllenkante, keine neue
 * Messung am Gebäudekörper.** Die verbleibende Differenz von 1,0 mm zur Referenz bleibt: E.1.37
 * setzt seine mittige Grundlinie auf 19,0 mm und führt damit als einzige der 37 Dateien einen
 * Grundlinienabstand von 5,0 mm, wo 30 von ihnen 6,0 mm führen. Der Katalog folgt der Mehrheit —
 * der Befund steht in `ANHANG_E_C_FILL_FINDINGS`.
 *
 * **Der Preis, benannt:** für die sechs bisher unbeschrifteten Körperformen ändert die Konstante
 * ihren Wert (`person` und `point` 13 → 23, `post` 14 → 22, `container` 16 → 20, `measure`
 * 16 → 21, `hazard` 15 → 20). Beide Werte sind dort unvermessen; es geht keine Messung verloren,
 * aber die Zahl ist eine andere. `compose.test.ts` hält die Konstante an `formation` **und** am
 * Gebäudekörper fest — nur die zweite Zeile fällt bei einer Rückkehr zur Oberkante.
 *
 * **Seit dem Teilslice E.2 ist es keine Konstante mehr, sondern eine Eigenschaft des
 * Körperprofils** (`LayoutProfile.centerBaselineFromBodyBottomMm`). Der Normwert 8 gilt
 * unverändert für alle Körperformen aus Kapitel 1; drei der fünf E.2-Körperformen tragen einen
 * anderen, an ihrer eigenen Referenzdatei gemessenen Wert. Die Tabelle mit allen vier Zahlen und
 * ihren Belegdateien steht am Feld selbst.
 */

/**
 * Eigene Marge der **Box** des mittigen Laufs gegen die Körperkante: 1 mm statt der 2 mm der
 * unteren Läufe, die Box läuft damit von 2 bis 30 mm und ist 28 mm breit. Betroffen ist
 * ausschließlich die zugesicherte Box — Lage und Anker des mittigen Laufs (`anchor: 'middle'` auf
 * der Körpermitte) bleiben unverändert, ebenso Anker und Boxen der beiden unteren Läufe. Deshalb
 * eine zweite Konstante und nicht ein gesenktes `LABEL_SIDE_MARGIN_MM`: das würde die vermessenen
 * unteren Anker 3,03/29,03 still mitverschieben.
 *
 * Der Anlass ist eine Messung an der **eigenen** Ausgabe (Teilslice E-b, 17. August 2026):
 * `Log-MW` (E.1.26) braucht in Arimo bei Schriftgrad 7,0786 mm **26,156 mm** Tinte, die bis dahin
 * zugesicherte Box war **26,000 mm** breit — 0,359 mm Überstand rechts, bei 2048 px und bei 256 px
 * reproduziert. Der Lauf passt auch perfekt zentriert nicht (0,078 mm je Seite), und der Überstand
 * ist strichunabhängig (gleich mit U+002D, U+2010 und U+2011). Die Referenz setzt denselben Lauf
 * mit 25,13 mm; die Ursache ist ausschließlich die Schriftwahl, nicht die Ablesung. Alle 22
 * anderen Läufe der zwölf E-b-Zeichen halten die alte Box ein, nächster Fall ist `Log-VG` mit
 * 23,297 mm.
 *
 * Die Kehrseite gehört in denselben Kommentar: der längste mittige Lauf der **Referenz** ist
 * `Log-MW` mit 25,13 mm. Die 28 mm sind damit eine **Hüllengrenze, keine Referenzlaufgrenze** —
 * sie lassen Läufe zu, die die Referenz nie setzt. Das sichtbar zu machen ist billiger, als es zu
 * verdecken: wer diese Box als Aussage darüber liest, wie breit die Referenz ihre Kürzel setzt,
 * liest sie falsch.
 *
 * Der verworfene Weg war, den Schriftgrad des Laufs auf 7,036 mm zu senken (26,000/26,156 ×
 * 7,0786). Er kollidiert mit der E-a-Linie „Schriftgrad ist aus der Versalhöhe abgeleitet, nicht
 * gewählt" (siehe `centerLabelSizeMm`).
 */
const CENTER_LABEL_BOX_MARGIN_MM = 1;

/**
 * Die **vierte** Beschriftungszone: das Trägerkürzel **unterhalb** des Körpers, rechtsbündig, in
 * der Organisationsfarbe statt in Weiß. Belegt an den fünf Wasserfahrzeugen `E.2.27` bis
 * `E.2.31`, deren Typo-Ebene diesen Lauf byteidentisch führt (eigene Vermessung, 18. August 2026;
 * die fünf unterscheiden sich um höchstens 0,0003 mm an der T-Glyphe von `E.2.28`):
 *
 * | Größe | Messung |
 * |---|---|
 * | Tinte des Laufs | 22,5379 / 24,0806 / 31,5778 / 26,9998 mm |
 * | Füllung | `#003296` = `organizationColor('thw')` |
 * | Versalhöhe | 2,9192 mm — derselbe Grad wie die beiden unteren Zonen |
 * | Rumpfunterkante | 22,9898 mm, also 1,0908 mm über der Oberkante der Tinte |
 * | rechte Rumpfkante | 30,9894 mm, also 0,5884 mm links der rechten Tintenkante |
 *
 * **Gemessen ist die Tinte, nicht der Anker.** Fünf byteidentische Platzierungen lassen die
 * Grundlinie auf mindestens fünf Weisen lesen (32 − 5,0002; Rumpfunterkante + 4,0100;
 * I.3-Unterkante + 3,0099; 1.5-Unterkante + 2,9996; Standardlauf + 3,0000) und die rechte Kante
 * auf drei. **Alle erzeugen dasselbe Bild.** Der Katalog wählt die Lesart gegen die Hülle des
 * platzierten Körpers, weil das die einzige ist, die mit dem Körper mitwandert statt eine
 * absolute Stelle der Grundfläche zu behaupten — das ist eine **Entscheidung** und keine
 * Messung, und sie steht hier, damit der nächste Agent sie nicht für belegt hält.
 *
 * Der Schriftgrad ist **nicht** gewählt: die gemessene Versalhöhe 2,9192 ist der Wert der unteren
 * Zonen, der Lauf benutzt deshalb `BOTTOM_LABEL_SIZE_MM` unverändert. Gegenprobe an derselben
 * Vermessung: der `THW`-Lauf von `E.2.1` ist 9,0399 mm breit, der von `E.2.27` ebenfalls
 * 9,0399 mm — es ist derselbe Lauf im selben Grad, nur versetzt.
 *
 * **Der waagerechte Wert ist der Anker, nicht die Tintenkante** — und der Abstand zwischen beiden
 * ist an derselben Quelle gemessen, nicht geschätzt. In `E.2.1` steht derselbe `THW`-Lauf in der
 * Zone unten rechts: Körperkante 31,0003, Anker nach der Zonenregel 29,0003, gemessene rechte
 * Tintenkante 29,0269 — die Schrift der Referenz überragt ihren Anker also um 0,0266 mm. Für die
 * vierte Zone folgt daraus der Anker 31,5778 − 0,0266 = 31,5512 und damit der Überstand
 * 31,5512 − 30,9894 = 0,5618 mm über die Körperkante.
 *
 * Die eigene Ausgabe trifft die Zonenlage, **nicht** die Laufbreite: bei 4096 px gerastert liegt
 * die Tinte dieses Laufs auf 21,984…31,531 mm, die der Referenz auf 22,538…31,578. Der
 * Unterschied ist 0,499 mm Laufbreite (9,539 gegen 9,040 mm) und **kein** Zonenfehler — dieselbe
 * Arimo-Differenz, die schon der `Log-MW`-Befund aus E-b beziffert hat; die rechte Kante trifft
 * auf 0,047 mm. Gegenprobe an der bestehenden Zone: derselbe Lauf rendert dort 19,438…28,977 bei
 * einer Referenz von 19,987…29,027 — dieselbe Differenz an derselben Stelle.
 */
/** Versalhöhen der beiden Schriftgrade, gemessen an den 16 Dateien E.1.1 bis E.1.16 (Tabelle oben). */
const CENTER_LABEL_CAP_HEIGHT_MM = 4.87;
const BOTTOM_LABEL_CAP_HEIGHT_MM = 2.92;

/**
 * Aus der gemessenen Versalhöhe abgeleiteter Schriftgrad der unteren Zonen — 4,24 mm. Der Grad
 * des mittigen Laufs steht in `centerLabelSizeMm`, weil er je Zeichen gemessen sein kann. Der Umweg über
 * `ARIMO_CAP_HEIGHT_FRACTION` ist der Punkt: an der Referenz ist die Versalhöhe ablesbar, der
 * Schriftgrad nicht (die Kürzel liegen dort in Kurven umgewandelt vor). Ein direkt
 * hingeschriebener Schriftgrad wäre eine geratene Zahl, die zufällig ähnlich aussieht.
 *
 * Mitzuprüfen bei jeder Änderung dieser Schriftgrade: die senkrechte Luft ist knapp. Die
 * `Log`-Läufe aus E-b enden bei 19,469 mm gegen eine Boxunterkante von 19,501 mm — 0,032 mm bei
 * `ALPHABETIC_DESCENT_FRACTION` = 0,212. Waagerecht ist nach der Weitung auf 28 mm Platz, senkrecht
 * praktisch keiner.
 */
const BOTTOM_LABEL_SIZE_MM = BOTTOM_LABEL_CAP_HEIGHT_MM / ARIMO_CAP_HEIGHT_FRACTION;

/**
 * Schriftgrad des mittigen Laufs aus seiner **gemessenen** Versalhöhe. Ohne Angabe gilt der
 * Normwert `CENTER_LABEL_CAP_HEIGHT_MM`; damit bleibt jede Zeichnung, die keine eigene Höhe
 * führt, byteidentisch zu vorher.
 *
 * Der Umweg über `ARIMO_CAP_HEIGHT_FRACTION` ist derselbe wie oben und aus demselben Grund: an
 * der Referenz ist die Versalhöhe ablesbar, der Schriftgrad nicht — die Kürzel liegen dort in
 * Kurven umgewandelt vor.
 */
function centerLabelSizeMm(capHeightMm: number | undefined): number {
  return (capHeightMm ?? CENTER_LABEL_CAP_HEIGHT_MM) / ARIMO_CAP_HEIGHT_FRACTION;
}

/**
 * Untere Einsatzgrenze eines Beschriftungslaufs: die kleinste Rendergröße, bei der sein
 * effektiver Schriftgrad `MINIMUM_TEXT_RENDER_PX` erreicht. Gerechnet statt gewählt — bei
 * 7,08 mm sind das 37 px, bei 4,24 mm 61 px, auf der Snapshot-Leiter also erst 64 px für beide.
 *
 * Das ist keine Ausrede für zu kleine Schrift: die Größen stammen aus der Vermessung, nicht aus
 * einer Platzabwägung. Ein Zeichen, dessen Kürzel bei 32 px nicht mehr lesbar ist, trägt hier
 * eine dokumentierte Aussage darüber statt eines stillen Anspruchs auf jede Rendergröße.
 */
function minRenderPxFor(sizeMm: number, viewBoxWidthMm: number): number {
  return Math.ceil((MINIMUM_TEXT_RENDER_PX * viewBoxWidthMm) / sizeMm);
}

/**
 * Ein Beschriftungslauf im Körper. `boxMm` ist wie bei jedem Textprimitiv eine Zusicherung des
 * Autors, keine Messung — die waagerechte Ausdehnung ist deshalb bewusst eng gefasst: der
 * mittige Lauf bekommt die Körperbreite abzüglich zweimal `CENTER_LABEL_BOX_MARGIN_MM` (also das
 * vermessene Innenfeld, 28 mm), die beiden unteren je ihre Hälfte von ihrem Anker
 * (`LABEL_SIDE_MARGIN_MM`) bis zur Körpermitte. Damit ist „passt in seine Zone" eine prüfbare
 * Aussage — für den mittigen Lauf gegen das Innenfeld, für die unteren gegen ihre Ränder — und die
 * beiden unteren Läufe können sich nicht überlappen, ohne dass ein Gate es meldet
 * (Rasterprüfung in `fonts.test.ts`).
 */
function labelPrimitive(
  content: string,
  sizeMm: number,
  baselineYMm: number,
  anchor: 'start' | 'middle' | 'end',
  xMm: number,
  boxXMm: number,
  boxWidthMm: number,
  viewBoxWidthMm: number,
  fill: ColorToken = 'weiss',
): Primitive {
  const box = verticalTextBoxMm(baselineYMm, sizeMm, 'alphabetic');
  return {
    type: 'text',
    role: 'label',
    content,
    x: xMm,
    y: baselineYMm,
    sizeMm,
    anchor,
    baseline: 'alphabetic',
    boxMm: { xMm: boxXMm, yMm: box.topMm, widthMm: boxWidthMm, heightMm: box.heightMm },
    minRenderPx: minRenderPxFor(sizeMm, viewBoxWidthMm),
    style: { fill },
  };
}

/**
 * Schriftfarbe der Läufe **im** Körper: `schwarz` auf weisser Körperfläche, sonst `weiss`.
 *
 * **Bis Anhang F stand hier fest `weiss`**, mit der Begründung, alle 37 Zeichen aus E.1 setzten
 * ihre Kürzel weiss auf die gefüllte Fläche. Das stimmt für E und ist für F falsch: alle 66
 * F-Dateien führen die Füllung `#fff` und ihre Typo-Ebene **ohne** `fill`, also in Schwarz
 * (nachgesehen an allen zwölf Dateien aus F.1.1 bis F.1.11). Ein weisser Lauf auf weissem Körper
 * wäre unsichtbar — und zwar unbemerkt: das A11y-Gate prüft die Paare, die der Katalog anmeldet,
 * und ein Zeichen, das seinen eigenen Lauf verschluckt, meldet kein Paar an.
 *
 * **Nicht die Farbe mit dem besseren Kontrast, sondern die, die die Quelle setzt.** Eine
 * Kontrastableitung („von weiss und schwarz gewinnt das höhere Verhältnis") ist an der eigenen
 * Ausgabe widerlegt: sie kippte `E.2.6` von weiss auf schwarz (orange `#fa8c00` trägt gegen
 * schwarz 9,6 : 1 und gegen weiss 2,2 : 1). Die Referenz setzt dort trotzdem weiss, und der
 * Katalog führt das seit dem 18. August 2026 als **entschiedene Ausnahme** in
 * `CONTRAST_EXCEPTIONS`. Die Quelle optimiert ihre Schriftfarbe also nicht auf Lesbarkeit; sie
 * setzt weiss auf jede Organisationsfarbe und schwarz allein auf die weisse Fläche. Genau das
 * bildet diese Regel ab — eine Ableitung nach Kontrast hätte eine getroffene Entscheidung still
 * überschrieben.
 *
 * **Eine Ableitung und kein neues Feld am `SymbolSpec`.** Die Farbe ist an beiden Anhängen keine
 * Wahl der Zeichnung, sondern eine Folge der Körperfarbe; ein Feld hätte sie zu einer Angabe
 * gemacht, die 58 F-Rezepte mitschleppen müssten.
 *
 * **Exportiert, weil der Kontrastvertrag dieselbe Regel braucht.** Der Katalog leitet in
 * `labelContrastRequirements()` ab, welches Paar aus einer Beschriftung im Körper überhaupt
 * entsteht; träfe er die Farbwahl dort ein zweites Mal, könnten Zeichnung und Vertrag
 * auseinanderlaufen — genau der Fehler, den dieser Teilslice behoben hat (der Vertrag behauptete
 * `weiss`, während der Lauf schwarz gezeichnet wurde). Eine Funktion, zwei Aufrufer.
 */
export function bodyLabelInk(bodyFill: ColorToken): ColorToken {
  return bodyFill === 'weiss' ? 'schwarz' : 'weiss';
}

/**
 * Nur die beiden vermessenen F.3-Kreisfassungen tragen negative körperrelative Labelmaße.
 * Ihre sechs Dezimalstellen werden privat am exakten Art-/Variantenpaar normalisiert; das ist
 * keine öffentliche Profil- oder Stilsteuerung.
 */
function normalizesMeasuredCircleTopLeftCoordinates(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
): boolean {
  return kind === 'circle-12' && (variant === undefined || variant === 'raised-gable');
}

/**
 * Die Beschriftungszonen gegen die Hülle des platzierten Körpers gerechnet. Läufe **im** Körper
 * tragen die aus der Körperfüllung abgeleitete Tinte (`bodyLabelInk`). `aboveLeft` steht dagegen
 * schwarz auf der Ausgabeoberfläche, `belowRight` trägt dort die Organisationsfarbe. Alle drei
 * Nachbarschaften stehen im Kontrastvertrag des Katalogs.
 */
function labelPrimitives(
  labels: NonNullable<SymbolSpec['labels']>,
  bodyBoundsMm: BoundsMm,
  viewBoxWidthMm: number,
  belowRightFill: ColorToken | null,
  bottomLabelBaselineFromBodyBottomMm: number,
  belowRight: {
    readonly baselineFromBodyBottomMm: number;
    readonly anchorFromBodyRightMm: number;
    readonly ink: 'organization' | 'black';
  } | undefined,
  centerBaselineFromBodyBottomMm: number,
  topLeftBaselineFromBodyTopMm: number | undefined,
  normalizeTopLeftCoordinatePrecision: boolean,
  aboveLeftBaselineFromBodyTopMm: number | undefined,
  aboveLeftAnchorFromBodyLeftMm: number | undefined,
  topLeftLines: {
    readonly baselinesFromBodyTopMm: readonly [number, number];
    readonly capHeightMm: number;
  } | undefined,
  bottomCenterBaselineFromBodyBottomMm: number | undefined,
  ink: ColorToken,
): Primitive[] {
  const centerXMm = (bodyBoundsMm.minX + bodyBoundsMm.maxX) / 2;
  // `leftMm`/`rightMm` sind die **Anker** der unteren Läufe und zugleich die Kanten ihrer Boxen.
  // Die Box des mittigen Laufs rechnet seit E-b mit der eigenen Marge — deshalb zwei Paare und
  // nicht ein umgerechnetes: sonst wanderten die vermessenen unteren Anker 3,03/29,03 mit.
  const leftMm = bodyBoundsMm.minX + LABEL_SIDE_MARGIN_MM;
  const rightMm = bodyBoundsMm.maxX - LABEL_SIDE_MARGIN_MM;
  const centerBoxLeftMm = bodyBoundsMm.minX + CENTER_LABEL_BOX_MARGIN_MM;
  const centerBoxRightMm = bodyBoundsMm.maxX - CENTER_LABEL_BOX_MARGIN_MM;
  const centerBaselineMm = bodyBoundsMm.maxY - centerBaselineFromBodyBottomMm;
  const bottomBaselineMm = bodyBoundsMm.maxY - bottomLabelBaselineFromBodyBottomMm;

  const primitives: Primitive[] = [];
  if (labels.center !== undefined) {
    primitives.push(
      labelPrimitive(
        labels.center,
        centerLabelSizeMm(labels.centerCapHeightMm),
        centerBaselineMm,
        'middle',
        centerXMm,
        centerBoxLeftMm,
        centerBoxRightMm - centerBoxLeftMm,
        viewBoxWidthMm,
        ink,
      ),
    );
  }
  if (labels.aboveLeft !== undefined) {
    if (
      aboveLeftBaselineFromBodyTopMm === undefined ||
      aboveLeftAnchorFromBodyLeftMm === undefined
    ) {
      throw new Error('Die Zone "aboveLeft" ist an dieser Körperform nicht vermessen.');
    }
    const anchorXMm = bodyBoundsMm.minX + aboveLeftAnchorFromBodyLeftMm;
    primitives.push(
      labelPrimitive(
        labels.aboveLeft,
        BOTTOM_LABEL_SIZE_MM,
        bodyBoundsMm.minY + aboveLeftBaselineFromBodyTopMm,
        'start',
        anchorXMm,
        anchorXMm,
        rightMm - anchorXMm,
        viewBoxWidthMm,
        'schwarz',
      ),
    );
  }
  if (labels.topLeft !== undefined) {
    if (topLeftBaselineFromBodyTopMm === undefined) {
      // Unerreichbar über `compose()` — `validateSpec` lehnt die Zone an jeder Körperform ohne
      // gemessene Grundlinie ab (`top-left-label-requires-measured-body`). Die Zeile hält die
      // Bedingung trotzdem am Ort ihrer Wirkung fest, wie beim Geschwisterfall `belowRight`.
      throw new Error(
        'Die Zone "topLeft" ist an dieser Körperform nicht vermessen. Eine Grundlinie führen ' +
          'nur die taktische Formation und die belegten F.2-Landfahrzeugprofile; andere ' +
          'Körperformen fallen nicht auf einen dieser Werte zurück.',
      );
    }
    const topLeftMetrics = labels.topLeftMetrics;
    const anchorRawMm = bodyBoundsMm.minX +
      (topLeftMetrics?.anchorFromBodyLeftMm ?? TOP_LEFT_LABEL_ANCHOR_FROM_BODY_LEFT_MM);
    const baselineRawMm = bodyBoundsMm.minY +
      (topLeftMetrics?.baselineFromBodyTopMm ?? topLeftBaselineFromBodyTopMm);
    // Die privat kind-/variantengebundenen F.3-Werte sind auf sechs Dezimalstellen vermessen.
    // Ihre negative
    // Relativkoordinate erzeugt bei binärer Addition sonst 1.0153159999999999 und damit eine
    // andere SVG-Koordinate als die gemessene absolute 1.015316. Andere Profile bleiben
    // bytegleich auf ihrem bisherigen Rechenweg.
    const anchorXMm = normalizeTopLeftCoordinatePrecision
      ? Number(anchorRawMm.toFixed(6))
      : anchorRawMm;
    const baselineYMm = normalizeTopLeftCoordinatePrecision
      ? Number(baselineRawMm.toFixed(6))
      : baselineRawMm;
    const sizeMm = topLeftMetrics === undefined
      ? BOTTOM_LABEL_SIZE_MM
      : topLeftMetrics.capHeightMm / ARIMO_CAP_HEIGHT_FRACTION;
    primitives.push(
      labelPrimitive(
        labels.topLeft,
        sizeMm,
        baselineYMm,
        'start',
        anchorXMm,
        anchorXMm,
        // F.1.12 führt „ÜMANV-S" sichtbar über die senkrechte Mittellinie hinaus. Der Anker
        // bleibt derselbe wie in F-a; die Box endet deshalb erst an der rechten Innenmarge des
        // Körpers. Eine Begrenzung auf das obere linke Viertel wäre seit F-b eine falsche
        // Clipping-Zusage, obwohl die Zone weiterhin durch ihren linken Anker benannt ist.
        rightMm - anchorXMm,
        viewBoxWidthMm,
        ink,
      ),
    );
  }
  if (labels.topLeftLines !== undefined) {
    if (topLeftLines === undefined) {
      throw new Error('Die Zone "topLeftLines" ist an dieser Körperform nicht vermessen.');
    }
    if (labels.topLeftLines.length !== 2) {
      throw new Error('Die Zone "topLeftLines" muss exakt zwei nichtleere Zeilen enthalten.');
    }
    const anchorXMm = bodyBoundsMm.minX + TOP_LEFT_LABEL_ANCHOR_FROM_BODY_LEFT_MM;
    const sizeMm = centerLabelSizeMm(topLeftLines.capHeightMm);
    for (const [index, content] of labels.topLeftLines.entries()) {
      const baseline = topLeftLines.baselinesFromBodyTopMm[index];
      if (baseline === undefined) {
        throw new Error('Unreachable: exakt zweizeilige Zone ohne vermessene Grundlinie.');
      }
      primitives.push(
        labelPrimitive(
          content,
          sizeMm,
          bodyBoundsMm.minY + baseline,
          'start',
          anchorXMm,
          anchorXMm,
          rightMm - anchorXMm,
          viewBoxWidthMm,
          ink,
        ),
      );
    }
  }
  if (labels.bottomLeft !== undefined) {
    primitives.push(
      labelPrimitive(
        labels.bottomLeft,
        BOTTOM_LABEL_SIZE_MM,
        bottomBaselineMm,
        'start',
        leftMm,
        leftMm,
        centerXMm - leftMm,
        viewBoxWidthMm,
        ink,
      ),
    );
  }
  if (labels.bottomCenter !== undefined) {
    if (bottomCenterBaselineFromBodyBottomMm === undefined) {
      throw new Error(
        'Die Zone "bottomCenter" ist an dieser Körperform nicht vermessen: ihre Grundlinie ' +
          'steht nur für die taktische Formation fest (2,0 mm über der Körperunterkante, ' +
          'gemessen an F.1.18 und F.1.20).',
      );
    }
    primitives.push(
      labelPrimitive(
        labels.bottomCenter,
        BOTTOM_LABEL_SIZE_MM,
        bodyBoundsMm.maxY - bottomCenterBaselineFromBodyBottomMm,
        'middle',
        centerXMm,
        centerBoxLeftMm,
        centerBoxRightMm - centerBoxLeftMm,
        viewBoxWidthMm,
        ink,
      ),
    );
  }
  if (labels.bottomRight !== undefined) {
    primitives.push(
      labelPrimitive(
        labels.bottomRight,
        BOTTOM_LABEL_SIZE_MM,
        bottomBaselineMm,
        'end',
        rightMm,
        centerXMm,
        rightMm - centerXMm,
        viewBoxWidthMm,
        ink,
      ),
    );
  }
  if (labels.belowRight !== undefined) {
    if (belowRight === undefined) {
      throw new Error('Die Zone "belowRight" ist an dieser Körperform nicht vermessen.');
    }
    if (belowRight.ink === 'organization' && belowRightFill === null) {
      // Unerreichbar über `compose()` — `validateSpec` lehnt die Zone ohne Organisation ab. Die
      // Zeile hält die Bedingung trotzdem am Ort ihrer Wirkung fest: die Zone ist in der
      // Organisationsfarbe gemessen, eine schwarze oder weiße Fassung von ihr ist es nicht.
      throw new Error(
        'Die Zone "belowRight" ist nur in der Organisationsfarbe belegt (#003296 an E.2.27 bis ' +
          'E.2.31); ohne Organisation gibt es keine Farbe, die sie tragen dürfte.',
      );
    }
    const anchorXMm = bodyBoundsMm.maxX + belowRight.anchorFromBodyRightMm;
    const baselineMm = bodyBoundsMm.maxY + belowRight.baselineFromBodyBottomMm;
    primitives.push(
      labelPrimitive(
        labels.belowRight,
        BOTTOM_LABEL_SIZE_MM,
        baselineMm,
        'end',
        anchorXMm,
        centerXMm,
        anchorXMm - centerXMm,
        viewBoxWidthMm,
        belowRight.ink === 'black' ? 'schwarz' : belowRightFill!,
      ),
    );
  }
  return primitives;
}

/** Zugriffe auf den Katalog. Als Ports übergeben, damit core nicht von catalog abhängt. */
export interface BodyMarkContext {
  readonly kind: SymbolKind;
  readonly bodyVariant?: BodyVariantId;
  readonly strength?: StrengthId;
  readonly occupiedLabelZones?: readonly ('bottomCenter' | 'bottomRight' | 'belowRight')[];
}

export interface CatalogPorts {
  /**
   * Die Zeichnung des Grundzeichens — **alle** ihre Primitive, nicht nur der Körper. Neben ihm
   * kann sie Zusatzgeometrie führen (Deichsel, L-Rahmen); `compose()` trägt sie mit.
   *
   * `variant` wählt eine zweite, in der Quelle belegte Zeichnung derselben Art. Ein Wert, den die
   * Art nicht führt, muss werfen und darf nicht auf die Kapitel-1-Zeichnung zurückfallen.
   */
  baseDrawing(kind: SymbolKind, variant?: BodyVariantId): Drawing;
  organizationColor(id: OrganizationId): ColorToken;
  strengthHead(id: StrengthId): HeadShape;
  /**
   * Fahrwerkszone je Fahrzeugkategorie (Kapitel 5.1). Neben `strengthHead` und nicht in ihm: die
   * Kopfzone verankert an der Oberkante ihrer Zone, die Fahrwerkszone an der Körperunterkante,
   * und ihre Marken sind nicht auf Kreise beschränkt.
   */
  vehicleChassis(id: VehicleCategoryId): ChassisShape;
  /**
   * Liefert die volle Definition, nicht nur die Primitive: die deklarierte Box trägt die drei
   * Gates. Damit hat `PictogramDefinition` von Beginn an zwei Konsumenten und ist kein
   * vorbereitetes Feld.
   */
  pictogram(id: PictogramId): PictogramDefinition;
  /**
   * Die **randbündige** Fassung eines Fähigkeitszeichens, gerechnet gegen die Hülle des
   * platzierten Körpers — die Fachdienstteilung des Anhangs F und ihre Zusätze.
   *
   * Anders als `pictogram` liefert dieser Port fertige Primitive und keine Definition mit Box:
   * eine Box gibt es hier nicht, die Zeichnung **ist** die Körperfläche. Die Hülle geht deshalb
   * als Parameter hinein statt als Verschiebung hinterher — ein randbündiges Kreuz lässt sich
   * nicht aus einer festen Zeichnung schieben, es muss auf die tatsächliche Kante gerechnet
   * werden.
   *
   * Wirft für jede Fähigkeit ohne vermessene randbündige Fassung. Kein Rückfall auf die
   * Boxfassung: die beiden Zeichnungen unterscheiden sich in ihren Maßen und nicht nur in ihrer
   * Größe (Arztleiste 8 gegen 10 mm, Transportring r 5,5 gegen r 7,0).
   */
  bodyMark(
    id: BodyMarkId,
    context: BodyMarkContext,
    bodyBoundsMm: BoundsMm,
  ): readonly Primitive[];
}

export class CompositionError extends Error {
  constructor(readonly issues: ReturnType<typeof validateSpec>) {
    super(
      `Unzulässige Kombination:\n${issues.map((i) => `  [${i.rule}] ${i.message}`).join('\n')}`,
    );
    this.name = 'CompositionError';
  }
}

export interface ComposeOptions {
  /**
   * Titel des zusammengesetzten Zeichens. Überschreibt den Titel des Grundzeichens
   * (`baseDrawing`), der sonst — fachlich irreführend — in die Zeichnung übernommen würde:
   * eine Löschstaffel ist kein "Taktische Formation" mehr, sobald Stärke und Fähigkeit
   * sie zu einem eigenständigen Zeichen machen. Ohne Titel bleibt `Drawing.title` unbesetzt,
   * es entsteht kein leeres `<title>`.
   */
  title?: string;
  /** Semantische Beschreibung; wird wie der Titel vom Katalog geliefert, nie aus Geometrie geraten. */
  description?: string;
}

/**
 * `SymbolSpec.capabilities` trägt `CapabilityId` (`'fire-fighting'`), der Piktogrammraum trägt
 * präfigierte IDs (`'capability.fire-fighting'`). Die Abbildung steht hier an einer Stelle und
 * nicht an jedem Aufrufort. Kapitel 5.8 bleibt bewusst ein eigenständiger Piktogrammkatalog ohne
 * `SymbolSpec.states` und ohne Integration in `compose()`. Weitere ID-Räume erhalten erst dann
 * `SymbolSpec`-Felder, wenn ein realer Konsument fachlich freigegeben ist.
 */
function pictogramIdOf(id: CapabilityId): PictogramId {
  return `capability.${id}`;
}

/**
 * Setzt eine Fahrwerksmarke absolut. `topMm` ist die Oberkante der Zone, also die Unterkante der
 * Körperhülle — anders als bei der Kopfzone gibt es hier nichts zu verhandeln: der Körper weicht
 * dem Fahrwerk nicht aus, es hängt an ihm.
 *
 * Alle drei Formen tragen dieselbe Kontur wie der Körper (schwarzer Strich 0,5 mm, keine
 * Füllung). Das ist gemessen und nicht übernommen: die Radinnenflächen sind in jeder der 26
 * Fahrwerksdateien aus E.2 und in `5.1.1.1` bis `5.1.1.6` Löcher im Umriss, keine gefüllten
 * Scheiben — eine Füllung `weiss` sähe auf der Referenzfläche gleich aus und wäre in jedem
 * anderen Theme eine Behauptung.
 */
function chassisPrimitive(mark: ChassisMark, topMm: number): Primitive {
  // Strichbreite 0,5 mm, an jedem Ring- und Kettenpaar der Referenz gemessen (Außenkante 30,7502
  // gegen Innenkante 30,2500 bei Markenmitte 28,2501) — nicht vom Körper geerbt, auch wenn beide
  // heute denselben Wert tragen.
  const style = {
    fill: 'none',
    stroke: 'schwarz',
    strokeWidth: DEFAULT_STROKE_WIDTH_MM,
  } as const;
  const cyMm = topMm + mark.cyFromTopMm;
  switch (mark.type) {
    case 'wheel':
      return { type: 'circle', role: 'chassis', cx: mark.cxMm, cy: cyMm, r: mark.rMm, style };
    case 'track':
      // Ein Stadion ist ein Rechteck mit `rx` = halbe Höhe. Kein Pfad mit genäherten Halbkreisen:
      // `rx` ist im IR vorhanden und wird vom Renderer exakt gezeichnet, eine Kubik-Näherung wäre
      // eine vermeidbare Abweichung von der vermessenen Form.
      return {
        type: 'rect',
        role: 'chassis',
        x: mark.leftCxMm - mark.rMm,
        y: cyMm - mark.rMm,
        width: mark.rightCxMm - mark.leftCxMm + 2 * mark.rMm,
        height: 2 * mark.rMm,
        rx: mark.rMm,
        style,
      };
    case 'bar':
      return {
        type: 'line',
        role: 'chassis',
        x1: mark.fromXMm,
        y1: cyMm,
        x2: mark.toXMm,
        y2: cyMm,
        style,
      };
  }
}

/**
 * Fügt randbündige Marken als getrennte Gruppen zusammen. Eine Primitive-Referenz, die ein Port
 * bewusst in mehreren Gruppen wiederverwendet, bezeichnet dieselbe gemeinsame Schicht und wird
 * ab der zweiten Gruppe nicht erneut gezeichnet. Innerhalb einer Gruppe bleibt eine Wiederholung
 * erhalten; ebenso bleiben separat erzeugte, bloß strukturell gleiche Primitive erhalten. Damit
 * kann der Katalog gemeinsame Grundlinien idempotent komponieren, ohne echte Deckzeichnungen zu
 * verschlucken oder den Core an konkrete Marken-IDs zu koppeln.
 */
function composeBodyMarkPrimitives(groups: readonly (readonly Primitive[])[]): Primitive[] {
  const seenInPreviousGroups = new Set<Primitive>();
  const result: Primitive[] = [];

  for (const group of groups) {
    for (const primitive of group) {
      if (!seenInPreviousGroups.has(primitive)) result.push(primitive);
    }
    for (const primitive of group) seenInPreviousGroups.add(primitive);
  }

  return result;
}

export function compose(spec: SymbolSpec, catalog: CatalogPorts, options: ComposeOptions = {}): Drawing {
  const issues = validateSpec(spec);
  if (issues.length > 0) throw new CompositionError(issues);

  const base = catalog.baseDrawing(spec.kind, spec.bodyVariant);
  const body = base.children.find((child) => child.role === 'body');
  if (!body) throw new Error(`Grundzeichen "${spec.kind}" hat kein body-Primitiv.`);
  // Zusatzgeometrie des Grundzeichens — Deichsel, L-Rahmen. Bis zum Teilslice E.2 nahm
  // `compose()` allein den Körper und ließ alles andere **stillschweigend** fallen: ein Anhänger
  // hätte seine Deichsel verloren, ohne dass ein Gate es meldet. Genau diese Bauart verbietet
  // dieses Projekt.
  const extras = base.children.filter((child) => child !== body);

  const profile = profileFor(spec.kind, spec.bodyVariant);
  const headShape = spec.strength !== undefined ? catalog.strengthHead(spec.strength) : null;

  // Dieselbe Kopfzone sitzt je nach Körperform unterschiedlich hoch — deshalb
  // rechnet erst placeHead die relativen Marken in absolute Koordinaten um.
  const headBox = headShape ? placeHead(profile, headShape.heightMm) : null;
  const headPrimitives: Primitive[] =
    headShape && headBox
      ? headShape.marks.map((mark) => ({
          type: 'circle',
          role: 'head',
          cx: mark.cxMm,
          cy: headBox.topMm + mark.cyFromTopMm,
          r: mark.rMm,
          style: { fill: 'schwarz' },
        }))
      : [];

  const placedBody = profile.place(body, headBox?.bottomMm ?? null);

  // Belegte Ausnahmen: F.1.17 sowie die drei vermessenen G-Köpfe `trupp`, `gruppe` und `zug`
  // führen `foot-band` zusammen mit einer Kopfzone. Die Kopfzone verschiebt den Formationskörper
  // nicht; Band und Hülle bleiben auf y 23…26. Andere Stärken werden daraus nicht fortgeschrieben.
  const isMeasuredFootBandWithHead =
    spec.kind === 'formation' &&
    spec.bodyVariant === 'foot-band' &&
    spec.strength !== undefined;
  if (extras.length > 0 && headBox !== null && !isMeasuredFootBandWithHead) {
    // Wie Zusatzgeometrie einer Kopfzone ausweicht, ist **nicht** belegt: kein Zeichen des
    // Referenzbestands trägt beides. Der Anhang E.2 führt überhaupt keine Kopfzone (an allen 31
    // Dateien nachgesehen), und `validateSpec` lehnt eine Stärkeangabe an diesen Körperformen
    // ohnehin ab. Werfen statt raten — ein mitgeschobener L-Rahmen wäre eine erfundene Geometrie.
    throw new Error(
      `Das Grundzeichen "${spec.kind}" führt Zusatzgeometrie, und wie die einer Kopfzone ` +
        'ausweicht, ist an der Referenz nicht belegt: kein Zeichen des Bestands trägt beides.',
    );
  }

  if (spec.organization !== undefined && isOpenPolyline(placedBody)) {
    // SVG (und `canvas.ts` genauso) schließt einen gefüllten Polyzug implizit: aus dem Haken von
    // `1.13 Ereignis` würde ein volles Dreieck. Selbst gerastert (18. August 2026): derselbe
    // Polyzug mit `fill: 'rot'` deckt 936 Pixel bei 64 px Kantenlänge statt der 142 des reinen
    // Strichs, und (16|14) mm liegt mit #fa1919 mitten in einer Fläche, die die Zeichnung nicht
    // hat.
    //
    // Der Katalog erfindet diese Fläche nicht. Gegenprobe an der Quelle: der Haken kommt in genau
    // **einer** der 661 Referenzdateien vor — in `1.13` selbst (Suche über seine Punktfolge, ein
    // Treffer); kein zusammengesetztes Zeichen des Bestands trägt ihn eingefärbt. Es gibt also
    // keinen Beleg für ein organisationsgefärbtes Ereignis. Werfen statt raten, dasselbe Muster
    // wie `organizationColor` und `circleBodyProfile.place`.
    throw new Error(
      `Eine Organisationsfarbe an "${spec.kind}" ist nicht belegt: der Körper ist ein offener ` +
        'Polyzug, und eine Füllung schlösse ihn implizit zu einer Fläche, die die Referenz nicht ' +
        'zeichnet.',
    );
  }

  const filled: Primitive =
    spec.organization !== undefined
      ? {
          ...placedBody,
          style: { ...placedBody.style, fill: catalog.organizationColor(spec.organization) },
        }
      : placedBody;

  // Piktogramme sind auf den unverschobenen Körper hin entworfen (Mitte bei 16 mm). Der
  // Kompositionsmotor kann den Körper senkrecht verschieben oder verkleinern, um Platz für die
  // Kopfzone zu schaffen — das Piktogramm muss dieser Körpermitte folgen, sonst sitzt es an der
  // absoluten Referenzstelle statt an der tatsächlichen Körpermitte. Die Referenz belegt das:
  // C.1.1 (Stapel, Körper verschoben) verschiebt das Piktogramm um dieselben 3 mm, C.1.2
  // (Reihe, Körper unverschoben) lässt es unverändert.
  //
  // Die Verschiebung sitzt an genau einer Gruppe und nicht an jedem Primitiv: ein Pfad trägt
  // seine Koordinaten unzerlegt im `d`-String und kann nicht primitivweise verschoben werden
  // (`shiftY` lehnt das ausdrücklich ab). Auf der Gruppe wirkt die Verschiebung nach außen auf
  // das fertige Ergebnis und ist damit von einer Drehung der Kinder unabhängig.
  const pictogramShiftMm = centerYMm(placedBody) - centerYMm(body);
  const pictogramPrimitives = (spec.capabilities ?? []).flatMap(
    (id) => catalog.pictogram(pictogramIdOf(id)).primitives,
  );
  const pictograms: Primitive[] =
    pictogramPrimitives.length > 0
      ? [
          {
            type: 'group',
            role: 'pictogram',
            transform: { translate: { dxMm: 0, dyMm: pictogramShiftMm } },
            children: pictogramPrimitives,
          },
        ]
      : [];

  // Fußzone: dieselbe Spiegelung wie oben bei `pictogramShiftMm` — an der tatsächlich platzierten
  // Körperhülle (`placedBody`), nicht an der unverschobenen Standardgeometrie. Anders als die
  // Kopfzone (deren `headBox` unabhängig vom Körper berechnet wird, weil der Körper ihr erst noch
  // ausweichen muss) konkurriert die Fußzone mit nichts um denselben Platz — sie hängt sich an die
  // Unterkante des Körpers, wo immer die nach einer eventuellen Kopfzonen-Verschiebung liegt. Das
  // hält Kopf- und Fußzone auch dann überschneidungsfrei, wenn ein Zeichen künftig beides trägt.
  const bodyBoundsMm = boundsOfMm(placedBody);

  /**
   * Unterkante des **Grundzeichens**, also aller seiner Primitive — nicht die des Körpers. Für
   * dreizehn der vierzehn Grundzeichen sind das dieselbe Zahl; für den Wechselladerrumpf nicht,
   * und dort entscheidet sie das Bild.
   *
   * Gemessen an **drei** Dateien mit abweichender Körperunterkante (eigene Vermessung,
   * 18. August 2026): `E.2.15` (Körper bis 24,5004), `5.1.1.8` (bis 24,9999) und `5.1.1.9` (bis
   * 24,9999) hängen ihre Räder alle drei auf Zonenoberkante 26,0 — dieselbe Zahl wie die
   * Unterkante ihres L-Rahmens. Der **Versatz** zur Körperunterkante ist damit widerlegt (1,5 /
   * 1,0005 / 1,0005 — keine Konstante); die Zonenoberkante ist belegt (26,0 in allen 25
   * E.2-Zeichen mit Fahrwerk). Ohne diese Formulierung säße das Fahrwerk von `E.2.15` auf 26,75
   * statt 28,2504 — 1,5 mm daneben, und kein Gate meldete es.
   */
  const baseBottomMm = [placedBody, ...extras].reduce(
    (bottom, primitive) => Math.max(bottom, boundsOfMm(primitive).maxY),
    bodyBoundsMm.maxY,
  );

  // Fahrwerkszone: hängt an der Unterkante der **platzierten** Körperhülle, wie die Fußzone auch.
  // Anders als die Kopfzone verhandelt sie nichts — der Körper weicht ihr nicht aus. Gemessen an
  // `5.1.1.1` bis `5.1.1.6` und an allen 25 E.2-Zeichen mit Fahrwerk: Körperunterkante 26,0004 mm,
  // Markenmitte 28,2501 mm, Unterkante der Zone 30,7502 mm. Sie bleibt damit innerhalb der
  // 32-mm-Grundfläche; `validateSpec` hält sie von der Fußzone frei, mit der sie sich sonst
  // überschnitte.
  const chassisShape: ChassisShape | null =
    spec.vehicleCategory !== undefined ? catalog.vehicleChassis(spec.vehicleCategory) : null;
  const chassisPrimitives: Primitive[] =
    chassisShape?.marks.map((mark) => chassisPrimitive(mark, baseBottomMm)) ?? [];

  const footTopMm = bodyBoundsMm.maxY + HEAD_GAP_MM;
  // `boxMm` ist bei Text eine Zusicherung des Autors, keine Messung (siehe Primitive-Kommentar
  // in geometry.ts) — sie muss deshalb selbst den Diakritika-Überstand einkalkulieren, den kein
  // Gate mehr erkennt. `verticalTextBoxMm` liefert die dafür nötige Ober­kante/Höhe aus Anker,
  // Schriftgrad und `baseline` (Task-9-Befund, siehe DIACRITIC_HEADROOM_FRACTION in
  // text-policy.ts). Nur die Oberkante wandert nach oben, die Unterkante bleibt bei
  // `footTopMm + FOOT_TEXT_SIZE_MM`: Unterlängen passen dort bereits ohne Zuschlag (siehe
  // Rasterevidenz in fonts.test.ts), ein zusätzlicher Zuschlag nach unten würde die Box nur
  // unnötig weiter Richtung viewBox-Rand wachsen lassen.
  const footBoxMm = verticalTextBoxMm(footTopMm, FOOT_TEXT_SIZE_MM, 'hanging');
  const footPrimitives: Primitive[] =
    spec.designation !== undefined
      ? [
          {
            type: 'text',
            role: 'foot',
            content: spec.designation,
            x: (bodyBoundsMm.minX + bodyBoundsMm.maxX) / 2,
            y: footTopMm,
            sizeMm: FOOT_TEXT_SIZE_MM,
            anchor: 'middle',
            baseline: 'hanging',
            boxMm: {
              xMm: bodyBoundsMm.minX,
              yMm: footBoxMm.topMm,
              widthMm: bodyBoundsMm.maxX - bodyBoundsMm.minX,
              heightMm: footBoxMm.heightMm,
            },
            style: { fill: 'schwarz' },
          },
        ]
      : [];

  // Beschriftungen liegen **auf** dem Körper und stehen deshalb nach ihm in der Kinderliste;
  // die Fußzone dahinter, weil sie unterhalb von ihm liegt und mit ihm nicht konkurriert.
  // Die Körperfüllung, wie sie am Körperprimitiv steht — nicht die Organisationsfarbe: ein
  // Zeichen ohne Organisation trägt die Grundfüllung des Grundzeichens, und auch auf ihr steht
  // die Beschriftung.
  // `'none'` und „kein Stil" fallen auf `weiss`: der Lauf steht dann auf der Ausgabeoberfläche,
  // und die ist in allen drei Themes weiss.
  const declaredFill = filled.style?.fill;
  const bodyFill: ColorToken =
    spec.organization !== undefined
      ? catalog.organizationColor(spec.organization)
      : declaredFill === undefined || declaredFill === 'none'
        ? 'weiss'
        : declaredFill;

  // Randbündige Fachdienstzeichen: gegen die Hülle des **platzierten** Körpers gerechnet, nicht
  // gegen die Standardgeometrie. Deshalb ohne die Verschiebung, die die Boxpiktogramme brauchen —
  // sie sind bereits an der richtigen Stelle gerechnet.
  const bodyMarkPrimitives = composeBodyMarkPrimitives(
    (spec.bodyMarks ?? []).map((id) =>
      catalog.bodyMark(id, {
        kind: spec.kind,
        bodyVariant: spec.bodyVariant,
        ...(spec.strength === undefined ? {} : { strength: spec.strength }),
        ...(
          spec.labels === undefined
            ? {}
            : (() => {
                const occupiedLabelZones = (['bottomCenter', 'bottomRight', 'belowRight'] as const)
                  .filter((zone) => spec.labels?.[zone] !== undefined);
                return occupiedLabelZones.length === 0 ? {} : { occupiedLabelZones };
              })()
        ),
      }, bodyBoundsMm)),
  );

  const labels = spec.labels !== undefined
    ? labelPrimitives(
        spec.labels,
        bodyBoundsMm,
        DEFAULT_VIEWBOX_MM.width,
        spec.organization !== undefined ? catalog.organizationColor(spec.organization) : null,
        profile.bottomLabelBaselineFromBodyBottomMm,
        profile.belowRight,
        profile.centerBaselineFromBodyBottomMm,
        profile.topLeftBaselineFromBodyTopMm,
        normalizesMeasuredCircleTopLeftCoordinates(spec.kind, spec.bodyVariant),
        profile.aboveLeftBaselineFromBodyTopMm,
        profile.aboveLeftAnchorFromBodyLeftMm,
        profile.topLeftLines,
        profile.bottomCenterBaselineFromBodyBottomMm,
        bodyLabelInk(bodyFill),
      )
    : [];

  // Das Fahrwerk steht **nach** dem gefüllten Körper: seine Marken ragen 0,25 mm in dessen
  // Strichband hinein (Radaußenkante 25,75 mm gegen Körperunterkante 26,0 bei Strich 0,5), und
  // dort deckt der Körperstrich sie ab. Umgekehrt zeichnete eine Organisationsfüllung über die
  // Radkontur. Die Referenz zeigt beides als eine verschmolzene Kontur; die Reihenfolge ist die
  // einzige Stelle, an der die Zerlegung in Primitive das nachbilden kann.
  return {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [
      ...headPrimitives,
      filled,
      // Zusatzgeometrie **nach** dem gefüllten Körper, aus demselben Grund wie das Fahrwerk: die
      // Deichsel endet innerhalb des Körperstrichs (rechtes Ende auf der Körpermittellinie 4,0),
      // und eine Organisationsfüllung zeichnete darüber. Sie nimmt die Farbe selbst nicht an —
      // `role: 'bodyExtra'` schließt das im Renderer aus.
      ...extras,
      ...chassisPrimitives,
      ...pictograms,
      // Die randbündigen Fachdienstzeichen stehen **nach** den Boxpiktogrammen und **vor** den
      // Beschriftungen: sie liegen auf der Körperfläche wie diese, und die Kürzel liegen auf
      // ihnen (Anhang F setzt „MTF" über das obere linke Viertel der Teilung).
      ...bodyMarkPrimitives,
      ...labels,
      ...footPrimitives,
    ],
    ...(options.title !== undefined ? { title: options.title } : {}),
    ...(options.description !== undefined ? { description: options.description } : {}),
  };
}
