import {
  DEFAULT_STROKE_WIDTH_MM,
  DEFAULT_VIEWBOX_MM,
  type CatalogEntry,
  type Drawing,
  type Primitive,
  type Style,
  type BodyVariantId,
  type SymbolKind,
} from '@einsatzzeichen/schema';

/** Umriss ohne Füllung. Organisationsfarben setzt der Kompositionsmotor. */
const OUTLINE: Style = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: DEFAULT_STROKE_WIDTH_MM,
};

/** Halbe Seitenlänge des gedrehten Quadrats bei 15 mm halber Diagonale. */
const PERSON_HALF_SIDE = (15 * Math.SQRT2) / 2;
/** Halbe Seitenlänge der I.5-Raute bei 13 mm halber Diagonale. */
const COMPACT_PERSON_HALF_SIDE = 13 / Math.SQRT2;

/**
 * Nachkommastellen der erzeugten Pfadkoordinaten (siehe `roundedPolygonPath`). Vier Stellen
 * begrenzen den Rundungsfehler auf 0,00005 mm = 0,00014 Einheiten, also zwei Größenordnungen
 * unter der Vergleichstoleranz von 0,01 Einheiten — und halten den `d`-String stabil, statt die
 * volle Gleitkommadarstellung in einen eingecheckten Snapshot zu schreiben.
 */
const PATH_DECIMALS = 4;

function round(value: number): number {
  return Number(value.toFixed(PATH_DECIMALS));
}

/**
 * Erzeugt den `d`-String eines geschlossenen Vielecks mit gerundeten Ecken. Je Ecke:
 * Tangentenabstand `t = r / tan(halber Innenwinkel)`, der Bogen als **eine** Kubik mit dem
 * Kontrolloffset `k = (4/3)·tan(Bogenwinkel/4)·r` entgegen der jeweiligen Kantenrichtung; die
 * Ecken sind durch Geraden verbunden.
 *
 * Bewusst abgeleitet statt als roher `d`-String eingetragen: belegt sind die zehn Ecken und die
 * zehn Radien von `1.9 Gebiet` (siehe dort), nicht die 629 Zeichen, die daraus folgen. Ein roher
 * String verbärge, welcher Teil die Messung ist und welcher ihre Konsequenz.
 */
function roundedPolygonPath(
  corners: readonly (readonly [number, number])[],
  radiiMm: readonly number[],
): string {
  const count = corners.length;
  const unit = (
    from: readonly [number, number],
    to: readonly [number, number],
  ): [number, number] => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const length = Math.hypot(dx, dy);
    return [dx / length, dy / length];
  };

  const arcs = corners.map((corner, index) => {
    const previous = corners[(index - 1 + count) % count] as readonly [number, number];
    const next = corners[(index + 1) % count] as readonly [number, number];
    const toPrevious = unit(corner, previous);
    const toNext = unit(corner, next);
    const interior = Math.acos(
      Math.max(-1, Math.min(1, toPrevious[0] * toNext[0] + toPrevious[1] * toNext[1])),
    );
    const radius = radiiMm[index] ?? 0;
    const tangent = radius / Math.tan(interior / 2);
    const control = (4 / 3) * Math.tan((Math.PI - interior) / 4) * radius;
    const start: [number, number] = [
      corner[0] + tangent * toPrevious[0],
      corner[1] + tangent * toPrevious[1],
    ];
    const end: [number, number] = [
      corner[0] + tangent * toNext[0],
      corner[1] + tangent * toNext[1],
    ];
    return {
      start,
      end,
      first: [start[0] - control * toPrevious[0], start[1] - control * toPrevious[1]] as const,
      second: [end[0] - control * toNext[0], end[1] - control * toNext[1]] as const,
    };
  });

  const first = arcs[0];
  if (first === undefined) throw new Error('roundedPolygonPath: mindestens eine Ecke nötig.');
  const parts: string[] = [`M ${round(first.start[0])} ${round(first.start[1])}`];
  arcs.forEach((arc, index) => {
    parts.push(
      `C ${round(arc.first[0])} ${round(arc.first[1])}, ` +
        `${round(arc.second[0])} ${round(arc.second[1])}, ` +
        `${round(arc.end[0])} ${round(arc.end[1])}`,
    );
    const next = arcs[(index + 1) % count];
    if (next !== undefined && index < count - 1) {
      parts.push(`L ${round(next.start[0])} ${round(next.start[1])}`);
    }
  });
  parts.push('Z');
  return parts.join(' ');
}

/**
 * Die zehn Ecken von `1.9 Gebiet` in Umlaufreihenfolge, in Millimetern. Rekonstruiert aus dem
 * Schnitt benachbarter Geradensegmente der Ebene `Flächige_Fülung` (eigene Vermessung,
 * 18. August 2026): keine der zwanzig Koordinaten liegt weiter als **0,00074 mm** von einem ganzen
 * Millimeter.
 *
 * Damit ist die Zeile „freie Kontur, keine glatten Entwurfsmaße, belegbar: nein" der Notiz vom
 * 5. August widerlegt. Ihre Extremazahlen `1,52/3,23/31/28,32` stimmen (nachgemessen
 * 1,5199/3,2298/30,9993/28,3237), sie sind nur **keine Entwurfsmaße**: sie liegen auf
 * Eckrundungen und nicht auf Ecken.
 */
const AREA_CORNERS = [
  [16, 24],
  [4, 29],
  [1, 23],
  [6, 18],
  [6, 8],
  [16, 3],
  [31, 6],
  [31, 13],
  [26, 15],
  [28, 26],
] as const;

/**
 * Die zehn Eckradien in derselben Reihenfolge, aus Ecke und Tangentenpunkten gerechnet. Alle zehn
 * liegen auf einem 0,6-mm-Raster. **Wie weit daneben, hängt vom Schätzer ab, und deshalb steht er
 * hier dazu:** rechnet man den Radius so, wie `roundedPolygonPath()` ihn setzt — aus dem
 * Tangentenabstand und dem halben Innenwinkel der Ecke —, liegt der größte Abstand zum Raster bei
 * **0,0003 mm**; über den Abstand des Bogenscheitels oder über eine Ausgleichsrechnung durch die
 * abgetasteten Bogenpunkte kommt man auf 0,0019 mm. Der erste Weg gilt, weil er derselbe ist, mit
 * dem der Katalog die Ecke anschließend baut.
 */
const AREA_RADII_MM = [4.8, 2.4, 2.4, 1.8, 2.4, 4.8, 2.4, 2.4, 1.2, 1.2] as const;

/**
 * Rechte Kante und damit **Drehpunkt** der waagerechten Streckung aller drei Deckkurvenkörper.
 * Kein Entwurfsmaß, sondern das Ergebnis der Messung: `1.3`, `5.1.2.1` und `E.2.15` teilen sich
 * diese Kante auf 0,0002 mm, und ihre Deckkurven gehen durch waagerechte Streckung **um sie**
 * ineinander über.
 */
const DECK_PIVOT_X_MM = 31;

/** Waagerechte Ausdehnung der unskalierten Deckkurve (`1.3`): von x 1 bis x 31. */
const DECK_REFERENCE_WIDTH_MM = 30;

/**
 * Die x-Werte der Deckkurve von `1.3 Landfahrzeug`, jeweils als **Abstand zur rechten Kante**
 * x = 31 — genau so gerechnet ist die Streckung eine Multiplikation. Bei `1.3` selbst (Faktor 1)
 * ergeben sie der Reihe nach 16, 10, 5, 1, 27 und 22 mm.
 *
 * Die Kurve läuft im `d`-String vom Scheitel nach links zur Kante und auf der rechten Seite von
 * der Kante zurück zum Scheitel; deshalb sind die beiden Seiten getrennt benannt und nicht aus
 * einer Spiegelung erzeugt. Gespiegelt wären sie erst nach der Rundung, und die Referenz führt
 * die beiden Seiten selbst mit 0,0004 mm Unterschied (7,0891 links gegen 7,0887 rechts).
 */
const DECK_OFFSETS_MM = {
  apex: 15,
  leftInnerControl: 21,
  leftOuterControl: 26,
  left: 30,
  rightOuterControl: 4,
  rightInnerControl: 9,
} as const;

/**
 * Die y-Werte der Deckkurve, als Abstand **unterhalb** ihrer Sehne. Gemessen an `1.3`
 * (Sehne 5,7499, Kontrollpunkte 7,0891/7,0887, Scheitel 7,9999/8,0003) und unabhängig
 * wiedergefunden an `5.1.2.1`/`E.2.22` (5,7503 → 7,0894/7,0887 → 8,0003) und an `E.2.15`
 * (6,0000 → 7,3392/7,3385 → 8,2501). Die drei Dateien tragen **dieselben** Abstände 0 / 1,339 /
 * 2,25 bei drei verschiedenen Sehnenlagen — das ist der Beleg dafür, dass die Kurve eine ist.
 */
const DECK_CONTROL_DROP_MM = 1.339;
const DECK_APEX_DROP_MM = 2.25;

/**
 * Ein Körper aus der Deckkurve von `1.3 Landfahrzeug`: oben die flache Doppelkubik, an den
 * Seiten senkrecht, unten waagerecht geschlossen.
 *
 * **Die Streckung ist gemessen und nicht gewählt.** Drei Referenzdateien tragen dieselbe Kurve in
 * drei Breiten, und der Faktor ist an jeder der sechs x-Koordinaten dieselbe Zahl (eigene
 * Vermessung, 18. August 2026, alle Werte in mm):
 *
 * | Datei | linke Kante | Faktor | Scheitel | innere Kontrollpunkte | äußere Kontrollpunkte |
 * |---|---|---|---|---|---|
 * | `1.3_Landfahrzeug.svg` | 0,9998 | 1,0 | 15,9999 | 9,9998 / 21,9999 | 4,9999 / 26,9998 |
 * | `5.1.2.1_Anhänger_allgemein.svg`, `E.2.22` | 3,9998 | 0,9 | 17,4999 | 12,0999 / 22,8999 | 7,5999 / 27,3999 |
 * | `E.2.15_Wechselladerfahrzeug…svg` | 2,5001 | 0,95 | 16,7499 | 11,0501 / 22,4501 | 6,2999 / 27,1999 |
 *
 * Gerechnet: 31 − 0,9 · (31 − 1) = 4,0 gegen gemessene 3,9998; 31 − 0,95 · (31 − 1) = 2,5 gegen
 * 2,5001. Größte Abweichung über alle achtzehn Werte: **0,0003 mm**.
 *
 * Bewusst abgeleitet statt dreimal als roher `d`-String eingetragen — dieselbe Begründung wie bei
 * `roundedPolygonPath`: belegt ist die Kurve und ihre Streckung, nicht die drei Zeichenketten,
 * die daraus folgen. Dass die Ableitung stimmt, hält `base-symbols.test.ts` fest: sie erzeugt
 * `vehicle-land` **zeichengenau** aus denselben Parametern.
 *
 * Die Sehnenlage und die Unterkante sind dagegen **keine** Ableitung: sie sind je Körper
 * gemessen und werden übergeben. Der Anhängerrumpf teilt sie mit `1.3` (5,75 / 26), der
 * Wechselladerrumpf nicht (6,0 / 24,5).
 */
function deckCurveBody(leftXMm: number, chordYMm: number, bottomYMm: number): string {
  const scale = (DECK_PIVOT_X_MM - leftXMm) / DECK_REFERENCE_WIDTH_MM;
  const x = (offsetMm: number): number => round(DECK_PIVOT_X_MM - scale * offsetMm);
  const apexX = x(DECK_OFFSETS_MM.apex);
  const leftX = x(DECK_OFFSETS_MM.left);
  const apexY = round(chordYMm + DECK_APEX_DROP_MM);
  const controlY = round(chordYMm + DECK_CONTROL_DROP_MM);
  const chord = round(chordYMm);
  const bottom = round(bottomYMm);
  return (
    `M ${apexX} ${apexY} ` +
    `C ${x(DECK_OFFSETS_MM.leftInnerControl)} ${apexY}, ` +
    `${x(DECK_OFFSETS_MM.leftOuterControl)} ${controlY}, ${leftX} ${chord} ` +
    `L ${leftX} ${bottom} L ${DECK_PIVOT_X_MM} ${bottom} L ${DECK_PIVOT_X_MM} ${chord} ` +
    `C ${x(DECK_OFFSETS_MM.rightOuterControl)} ${controlY}, ` +
    `${x(DECK_OFFSETS_MM.rightInnerControl)} ${apexY}, ${apexX} ${apexY} Z`
  );
}

/**
 * Kreisbogenkonstante der Zwei-Kubiken-Näherung eines Halbkreises: K = 4(√2−1)/3. Sie steckt
 * bereits in den Kontrollpunkten von `1.4` und `1.5` (gemessene Offsets 8,2843 / 8,2842 bei
 * r = 15) und wird hier nur benannt, damit der zweite Wasserrumpf nicht als roher String
 * danebenstünde.
 */
const CIRCLE_CONTROL_FRACTION = (4 * (Math.SQRT2 - 1)) / 3;

/**
 * Halbkreis **unter** einer waagerechten Sehne, in der Zwei-Kubiken-Näherung — die Bauform von
 * `1.5 Wasserfahrzeug` und, mit anderen Zahlen, die der fünf E.2-Wasserfahrzeuge.
 *
 * `base-symbols.test.ts` hält fest, dass diese Ableitung den eingetragenen `d`-String von `1.5`
 * zeichengenau erzeugt — sonst wäre der zweite Rumpf aus einer Regel gebaut, die für den ersten
 * gar nicht gilt.
 */
function halfCircleBelowChord(cxMm: number, chordYMm: number, rMm: number): string {
  const control = round(rMm * CIRCLE_CONTROL_FRACTION);
  const left = round(cxMm - rMm);
  const right = round(cxMm + rMm);
  const chord = round(chordYMm);
  const apex = round(chordYMm + rMm);
  const controlY = round(chordYMm + control);
  return (
    `M ${left} ${chord} L ${right} ${chord} ` +
    `C ${right} ${controlY}, ${round(cxMm + control)} ${apex}, ${round(cxMm)} ${apex} ` +
    `C ${round(cxMm - control)} ${apex}, ${left} ${controlY}, ${left} ${chord} Z`
  );
}

/** Halbkreis oberhalb der Sehne; dieselbe Kubikregel wie beim Kapitel-1-Luftfahrzeug. */
function halfCircleAboveChord(cxMm: number, chordYMm: number, rMm: number): string {
  const control = round(rMm * CIRCLE_CONTROL_FRACTION);
  const left = round(cxMm - rMm);
  const right = round(cxMm + rMm);
  const chord = round(chordYMm);
  const apex = round(chordYMm - rMm);
  const controlY = round(chordYMm - control);
  return (
    `M ${right} ${chord} L ${left} ${chord} ` +
    `C ${left} ${controlY}, ${round(cxMm - control)} ${apex}, ${round(cxMm)} ${apex} ` +
    `C ${round(cxMm + control)} ${apex}, ${right} ${controlY}, ${right} ${chord} Z`
  );
}

const BODIES: Partial<Record<SymbolKind, Primitive>> = {
  formation: { type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20, style: OUTLINE },
  person: {
    type: 'rect',
    role: 'body',
    x: 16 - PERSON_HALF_SIDE,
    y: 16 - PERSON_HALF_SIDE,
    width: PERSON_HALF_SIDE * 2,
    height: PERSON_HALF_SIDE * 2,
    transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
    style: OUTLINE,
  },
  /**
   * `1.3 Landfahrzeug` — Rechteck, dessen Oberkante eine flache Doppelkubik ist. Gemessen an der
   * Ebene `Flächige_Fülung`, die hier die **Mittellinie verbatim** trägt (Hülle
   * 0,9998/5,7499/31,0000/26,0001; unabhängig bestätigt durch die Mittelung der Strichkonturen
   * 0,7497…1,2499 außen/innen).
   *
   * Zwei Rundungen gegen die Messung, beide unter 0,001 mm: das Spiegelpaar der zweiten
   * Kontrollpunkte 7,0891 (links) / 7,0887 (rechts) auf 7,089 und der Scheitel 7,9999 / 8,0003
   * auf 8. Das ist dieselbe Mittelung, die `deriveRing` an Ringpaaren ausführt — die 0,0004 mm
   * Spiegelasymmetrie sind eine Exportrundungsstufe der Quelle, kein Umsetzungsentscheid.
   */
  'vehicle-land': {
    type: 'path',
    role: 'body',
    d: deckCurveBody(1, 5.75, 26),
    style: OUTLINE,
  },
  /**
   * `1.4 Luftfahrzeug` — Halbkreis r = 15 um (16|23) über einer waagerechten Sehne, in der
   * üblichen Zwei-Kubiken-Näherung mit K = 4(√2−1)/3. Die Modellwerte 14,7157 / 7,7157 / 24,2843
   * treffen die gemessenen Kontrollpunkte 14,7158 / 7,7160 / 24,2845 auf höchstens 0,0003 mm.
   *
   * Damit ist das „Form nein" der Notiz vom 5. August widerlegt: nicht die Quelle war
   * unvermessbar, sondern der damalige Extraktor, der für einen Kurvenpfad `null` lieferte und
   * `curvedPaths` hochzählte, statt eine Form abzulegen. Seit dem Teilslice E.2 legt er die
   * Körperfläche der Ebene `Flächige_Fülung` als `kind: 'bounds'` ab, und dieser Körper ist am
   * Kennwertartefakt gegatet.
   */
  'vehicle-air': {
    type: 'path',
    role: 'body',
    d: 'M 31 23 L 1 23 C 1 14.7157, 7.7157 8, 16 8 C 24.2843 8, 31 14.7157, 31 23 Z',
    style: OUTLINE,
  },
  /**
   * `1.5 Wasserfahrzeug` — die gespiegelte Bauform von `1.4`: Halbkreis r = 15 um (16|9) unter
   * einer waagerechten Sehne. Gemessene Kontrolloffsets 17,2843 / 24,2842 / 7,7156 gegen die
   * Modellwerte 17,2843 / 24,2843 / 7,7157.
   *
   * **Nicht zu verwechseln mit den Wasserfahrzeugen aus E.2.27 bis E.2.31.** Die tragen die
   * Füllhülle 1,01/7,9999/30,9894/22,9898 und liegen damit 1,0 mm über diesem Grundzeichen —
   * zugleich zufällig auf der Hülle von `1.4 Luftfahrzeug`, obwohl es die entgegengesetzte
   * Halbkreisorientierung ist. Ein Gate, das nur Hüllen vergleicht, nähme dort die falsche Form an.
   */
  'vehicle-water': {
    type: 'path',
    role: 'body',
    d: halfCircleBelowChord(16, 9, 15),
    style: OUTLINE,
  },
  post: { type: 'circle', role: 'body', cx: 16, cy: 16, r: 14, style: OUTLINE },
  building: {
    type: 'polyline',
    role: 'body',
    closed: true,
    points: [
      [16, 3],
      [1, 10],
      [1, 26],
      [31, 26],
      [31, 10],
    ],
    style: OUTLINE,
  },
  container: { type: 'rect', role: 'body', x: 4, y: 4, width: 24, height: 24, style: OUTLINE },
  /**
   * `1.9 Gebiet` — Zehneck mit zehn Eckradien, abgeleitet aus `AREA_CORNERS` und `AREA_RADII_MM`
   * (siehe dort). Der erzeugte Pfad trifft die zwanzig gemessenen Tangentenpunkte der Referenz auf
   * höchstens **0,0008 mm = 0,0023 Einheiten**; seine Hülle ist 1,5202/3,2298/31,0000/28,3234
   * gegen die gemessene 1,5199/3,2298/30,9993/28,3237.
   */
  area: {
    type: 'path',
    role: 'body',
    d: roundedPolygonPath(AREA_CORNERS, AREA_RADII_MM),
    style: OUTLINE,
  },
  measure: {
    type: 'polyline',
    role: 'body',
    closed: true,
    points: [
      [1, 4],
      [16, 29],
      [31, 4],
    ],
    style: OUTLINE,
  },
  hazard: {
    type: 'polyline',
    role: 'body',
    closed: true,
    points: [
      [1, 28],
      [16, 3],
      [31, 28],
    ],
    style: OUTLINE,
  },
  point: {
    type: 'polyline',
    role: 'body',
    closed: true,
    points: [
      [8, 1],
      [8, 22],
      [16, 31],
      [24, 22],
      [24, 1],
    ],
    style: OUTLINE,
  },
  /**
   * `1.13 Ereignis` — der **offene** Polyzug (4|7) → (16|25) → (28|7). Die Referenz zeichnet ihn
   * als zu einer Fläche umgewandelten Strich mit sechs verschiedenen Punkten; paarweise gemittelt
   * ergeben sie die drei Ecken auf höchstens 0,0021 Einheiten genau.
   *
   * **Zweiter, unabhängiger Beleg** (eigene Rechnung, 18. August 2026): die analytische
   * Strichaufweitung dieses offenen Polyzugs bei 0,5 mm mit Gehrung und Stumpfkappen liefert
   * 3,7920/6,8613/28,2080/25,4507 und damit den eingecheckten Kennwert auf 0,0029 Einheiten. Ein
   * **geschlossener** Polyzug ergäbe 3,5329/6,7500/28,4671/25,4507 — 0,73 Einheiten daneben. Die
   * Offenheit ist damit gegatet und nicht nur am Snapshot geprüft (siehe `strokeBoundsOfMm` und
   * `matchFingerprint`, `bodyGeometry: 'stroke-outline'`).
   *
   * **Das einzige Grundzeichen, das keine Organisationsfarbe annehmen darf.** SVG schließt einen
   * gefüllten Polyzug implizit; aus dem Haken würde ein volles Dreieck (selbst gerastert: 936
   * statt 142 deckende Pixel bei 64 px). Der Haken kommt in genau einer der 661 Referenzdateien
   * vor — in `1.13` selbst —, es gibt also keinen Beleg für ein eingefärbtes Ereignis. `compose()`
   * wirft dafür.
   */
  event: {
    type: 'polyline',
    role: 'body',
    closed: false,
    points: [
      [4, 7],
      [16, 25],
      [28, 7],
    ],
    style: OUTLINE,
  },
  /**
   * `1.14 Spontanhelfer` — vier Kreisbögen (Vierlappen) um (16|16). Als einzige Datei des Kapitels
   * neben `1.13` führt sie **keine** Füllebene; die Mittellinie stammt deshalb aus dem Ringpaar
   * (außen 1,7501/1,7498/30,2500/30,2500, innen 2,2500/2,2500/29,7497/29,7497 → Mittellinie
   * 2/2/30/30 bei Strich 0,5).
   *
   * **Mittenabstand und Radius stammen aus dem exakten Umkreis durch die drei Segmentendpunkte je
   * Lappen — nicht aus einer Ausgleichsrechnung.** Alle vier Lappen liefern dasselbe: Mitten
   * (16|22,5066) (9,4936|16) (16|9,4931) (22,5066|16), Außenradius 7,7434, also d = 6,5066 und
   * Mittellinienradius R = 7,4934 mit d + R = 14,0000.
   *
   * **Das glatte Paar 6,5/7,5 ist ausgeschlossen**, und was es ausschließt, ist der Fugenpunkt der
   * Außenkontur: gemessen liegt er bei (8,3425|8,3425); das Modell 6,5066/7,4934 sagt 8,3426
   * voraus (0,0003 Einheiten), das Modell 6,5/7,5 sagt 8,3377 (0,0137 Einheiten — über der
   * Toleranz 0,01). Die Segmentendpunkte tragen dieses Argument, weil nur sie exakt auf dem Kreis
   * liegen, während die Zwei-Kubiken-Näherung der Referenz über die Bogenlänge um 0,0039 mm neben
   * ihm verläuft.
   *
   * **Eine Ausgleichsrechnung über abgetastete Kubiken ist dabei ausdrücklich keine Falle** — der
   * Baubeschluss hat das behauptet (d ≈ 6,4999 / R ≈ 7,5068, also fast das glatte Paar), und
   * weder der Bau noch die Gegenprüfung konnten es reproduzieren: beide landen bei ≈ 6,5057 /
   * 7,4928 und damit nahe am exakten Wert. Der eingetragene Wert bleibt davon unberührt; es ändert
   * sich nur, welche Begründung man weitergeben darf
   * (`docs/decisions/2026-08-18-grundlagen-restpunkte.md`, Abschnitt „Berichtigung am
   * Baubeschluss").
   */
  'spontaneous-helper': {
    type: 'path',
    role: 'body',
    d:
      'M 8.5644 8.5644 C 9.0329 4.8143, 12.2207 2, 16 2 C 19.7793 2, 22.9671 4.8143, ' +
      '23.4356 8.5644 C 27.1857 9.0329, 30 12.2207, 30 16 C 30 19.7793, 27.1857 22.9671, ' +
      '23.4356 23.4356 C 22.9671 27.1857, 19.7793 30, 16 30 C 12.2207 30, 9.0329 27.1857, ' +
      '8.5644 23.4356 C 4.8143 22.9671, 2 19.7793, 2 16 C 2 12.2207, 4.8143 9.0329, ' +
      '8.5644 8.5644 Z',
    style: OUTLINE,
  },
  /**
   * Anhängerrumpf — die Deckkurve von `1.3` waagerecht 0,9-fach um x = 31, bei unveränderter
   * Sehnenlage 5,75 und Unterkante 26. Gemessene Füllhülle 3,9998/5,7503/31,0000/26,0004 mm.
   *
   * **Der einzige der drei neuen Körper mit einem eigenen Quellabschnitt.** Sein Füllpfad kommt in
   * **17** der 661 Referenzdateien byteidentisch vor (selbst gezählt): 5.1.2.1, 5.1.2.4, 5.1.2.5,
   * C.2.29, C.2.30, E.2.22 bis E.2.25, F.2.9, F.2.15, G.2.2, G.2.3 und I.2.4 bis I.2.7. Die
   * Zuschnittsnotiz vom 11. August zählte vier, weil sie nur innerhalb von Anhang E gezählt hat.
   *
   * Die **Deichsel** gehört zum Zeichen und ist ein eigenes Primitiv (siehe `EXTRA_PRIMITIVES`) —
   * `5.1.2.1_Anhänger_allgemein.svg` führt sie ohne jedes Rad, ein Rumpf ohne sie wäre also keine
   * Darstellung dieses Abschnitts.
   */
  trailer: {
    type: 'path',
    role: 'body',
    d: deckCurveBody(4, 5.75, 26),
    style: OUTLINE,
  },
  /**
   * Rumpf des Wechselladerfahrzeugs `E.2.15` — die Deckkurve von `1.3` waagerecht 0,95-fach um
   * x = 31, mit **eigener** Sehnenlage 6,0 und Unterkante 24,5. Gemessene Füllhülle
   * 2,5001/6,0000/31,0000/24,5004 mm.
   *
   * **In genau einer der 661 Dateien** — und ausdrücklich **nicht** deckungsgleich mit
   * `5.1.1.8_Kraftfahrzeug_straßenfähig_Wechsellader.svg`, dessen Füllkörper 3,9998/6,0000/
   * 31,0000/24,9999 misst (selbst nachgemessen). Eine Körperform ist ein Wert in einem stehenden
   * Mechanismus und kein neuer Mechanismus; die Fallzahlregel des Projekts trifft sie nicht.
   *
   * Der **L-Rahmen** gehört zum Zeichen und ist ein eigenes Primitiv (siehe `EXTRA_PRIMITIVES`).
   * Er trägt zusätzlich die Fahrwerkszone: deren Oberkante liegt bei 26,0 und damit 1,5 mm unter
   * der Unterkante dieses Körpers.
   */
  'swap-loader-vehicle': {
    type: 'path',
    role: 'body',
    d: deckCurveBody(2.5, 6, 24.5),
    style: OUTLINE,
  },
  /**
   * Hochkantes Rechteck 26 × 28 mm von `E.2.26`. Mittellinie 3/2 bis 29/30 mm, gemessen aus dem
   * Ringpaar der Strichebene (außen 2,7499/1,7501/29,2502/30,2500, innen
   * 3,2501/2,2500/28,7503/29,7501 → Strich 0,5002) **und** unabhängig bestätigt durch die
   * Füllfläche, die hier die Mittellinie verbatim trägt (3,0001/2,0000/29,0001/30,0001). Beide
   * Mitten liegen auf 16,0.
   *
   * **`container` scheidet aus**, obwohl beides Rechtecke sind: der misst 4/4 bis 28/28, das
   * Fingerprint-Gate erwartet hier 3/2 bis 29/30 und meldete die Differenz laut. In genau einer
   * der 661 Dateien.
   */
  'upright-rectangle': {
    type: 'rect',
    role: 'body',
    x: 3,
    y: 2,
    width: 26,
    height: 28,
    style: OUTLINE,
  },
  /**
   * Eigenständiger Kreiskörper der 17 Zeichen F.3.1 bis F.3.14 und F.3.17 bis F.3.19. Das Ringpaar
   * der Quellstriche
   * misst außen r = 12,25 mm und innen r = 11,75 mm um (16|16), also die Mittellinie r = 12 mm.
   * `post` scheidet mit r = 14 mm aus und bleibt deshalb eine eigene Körperart.
   */
  'circle-12': {
    type: 'circle',
    role: 'body',
    cx: 16,
    cy: 16,
    r: 12,
    style: OUTLINE,
  },
  /**
   * Reduzierte Hauskontur aus F.3.15/F.3.16. Die fünf Eckpunkte sind die Mittellinie der
   * gemeinsamen Kontur. F.3.16s zusätzlich vermessene Outline ist nur deren Strichhülle und
   * deshalb ausdrücklich kein zweiter Körper und kein abweichender Fingerprint-Präzedenzfall.
   */
  'reduced-house': {
    type: 'polyline',
    role: 'body',
    closed: true,
    points: [[16, 4], [2, 10], [2, 26], [30, 26], [30, 10]],
    style: OUTLINE,
  },
};

const VARIANT_EXTRA_PRIMITIVES: Partial<
  Record<SymbolKind, Partial<Record<BodyVariantId, readonly Primitive[]>>>
> = {
  formation: {
    'foot-band': [
      {
        type: 'rect',
        role: 'pictogram',
        x: 1,
        y: 23,
        width: 30,
        height: 3,
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ],
  },
  'vehicle-air': {
    'raised-hull': [
      {
        type: 'polyline', role: 'bodyExtra', closed: true,
        points: [[9, 23], [16, 25], [9, 27]],
        style: { fill: 'schwarz', stroke: 'none' },
      },
      {
        type: 'polyline', role: 'bodyExtra', closed: true,
        points: [[23, 23], [16, 25], [23, 27]],
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ],
    'fixed-wing-hull': [
      {
        type: 'path',
        role: 'bodyExtra',
        d: 'M 24.2114 23.2109 C 23.4801 22.4796, 22.377 22.2669, 21.4259 22.6743 L 16 24.9995 L 21.4261 27.3251 C 22.3768 27.7326, 23.48 27.5202, 24.2116 26.7885 C 25.1997 25.8007, 25.1997 24.1988, 24.2116 23.211 Z',
        style: { fill: 'schwarz', stroke: 'none' },
      },
      {
        type: 'path',
        role: 'bodyExtra',
        d: 'M 7.7882 23.2109 C 6.8001 24.199, 6.8001 25.8006, 7.7882 26.7884 C 8.5195 27.5201, 9.6226 27.7324, 10.5737 27.325 L 16 24.9995 L 10.5739 22.6743 C 9.6232 22.2668, 8.52 22.4792, 7.7884 23.2109 Z',
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ],
  },
  'vehicle-land': {
    'foot-band': [
      {
        type: 'rect',
        role: 'pictogram',
        x: 1,
        y: 23,
        width: 30,
        height: 3,
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ],
    'plain-wheel-pair': [
      {
        type: 'circle', role: 'bodyExtra', cx: 3.75, cy: 28.25, r: 2.25,
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
      {
        type: 'circle', role: 'bodyExtra', cx: 28.25, cy: 28.25, r: 2.25,
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ],
  },
  trailer: {
    'foot-band': [
      {
        type: 'rect', role: 'pictogram', x: 4, y: 23, width: 27, height: 3,
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ],
  },
  'circle-12': {
    'foot-band': [
      {
        type: 'path',
        role: 'pictogram',
        d:
          'M 7.4048 24.0005 H 24.5954 C 22.479 26.5508 19.0883 27.7505 16 27.7505 ' +
          'C 12.9117 27.7505 9.5204 26.5508 7.4048 24.0005 Z',
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ],
    'raised-gable': [
      {
        type: 'polyline',
        role: 'bodyExtra',
        closed: false,
        points: [[3, 11], [16, 1], [29, 11]],
        style: OUTLINE,
      },
    ],
  },
};

/**
 * Weitere, in der Quelle belegte Zeichnungen desselben Grundzeichens.
 *
 * `vehicle-water` / `raised-hull` ist der Rumpf der fünf Wasserfahrzeuge `E.2.27` bis `E.2.31`.
 * Gemessene Füllhülle 1,0100/7,9999/30,9894/22,9898 mm — gegenüber `1.5_Wasserfahrzeug.svg`
 * (1,0001/9,0001/31,0000/24,0002) um 1,0002 mm angehoben und um den Faktor 0,999318 verkleinert
 * (Sehnenlänge 29,9794 gegen 29,9999 mm). Alle fünf Dateien tragen Füll- und Strichebene
 * byteidentisch.
 *
 * Die Konstruktion ist dieselbe wie bei `1.5`, nur mit anderen Zahlen: Mittelpunkt 15,9997,
 * Sehne 7,9999, Radius 14,9897. Größte Abweichung der erzeugten Stützpunkte von den gemessenen:
 * **0,0002 mm**.
 *
 * **Warum nicht `BODIES['vehicle-water']` ändern:** dieser Eintrag beansprucht
 * `1.5_Wasserfahrzeug.svg` als Belegdatei und ist seit dem Extraktorausbau selbst dagegen
 * gegatet; mit diesen Maßen fiele er um 2,8 Einheiten bei einer Toleranz von 0,01. Umgekehrt
 * fiele ein E.2-Rezept auf dem unveränderten `1.5`-Rumpf um dieselben 2,8 Einheiten. Die beiden
 * Zeichnungen schließen einander aus und müssen deshalb nebeneinander stehen.
 *
 * **Warum keine eigene `SymbolKind`:** es ist fachlich dasselbe Grundzeichen. 16 der 17
 * Halbkreisrümpfe des Bestands (fünf in E.2, elf in I.3) führen dieselbe verkleinerte Form; nur
 * die Sehnenlage trennt E.2 (7,9999) von I.3 (9,0001) — selbst nachgemessen an
 * `I.3.5_Mehrzweckboot.svg`, dessen Rumpf 1,0100/9,0001/30,9894/23,9899 misst.
 */
const VARIANT_BODIES: Partial<Record<SymbolKind, Partial<Record<BodyVariantId, Primitive>>>> = {
  person: {
    'compact-person-diamond-26mm': {
      type: 'rect',
      role: 'body',
      x: 16 - COMPACT_PERSON_HALF_SIDE,
      y: 16 - COMPACT_PERSON_HALF_SIDE,
      width: COMPACT_PERSON_HALF_SIDE * 2,
      height: COMPACT_PERSON_HALF_SIDE * 2,
      transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
      style: OUTLINE,
    },
    'compact-person-diamond-26mm-lowered-2mm': {
      type: 'rect',
      role: 'body',
      x: 16 - COMPACT_PERSON_HALF_SIDE,
      y: 18 - COMPACT_PERSON_HALF_SIDE,
      width: COMPACT_PERSON_HALF_SIDE * 2,
      height: COMPACT_PERSON_HALF_SIDE * 2,
      transform: { rotate: { angle: 45, cx: 16, cy: 18 } },
      style: OUTLINE,
    },
  },
  formation: {
    'foot-band': { type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20, style: OUTLINE },
  },
  trailer: {
    'foot-band': BODIES.trailer!,
  },
  'vehicle-water': {
    'raised-hull': {
      type: 'path',
      role: 'body',
      d: halfCircleBelowChord(15.9997, 7.9999, 14.9897),
      style: OUTLINE,
    },
    'inset-hull': {
      type: 'path',
      role: 'body',
      d: halfCircleBelowChord(15.9997, 9.0001, 14.9897),
      style: OUTLINE,
    },
  },
  'vehicle-air': {
    'raised-hull': {
      type: 'path',
      role: 'body',
      d: halfCircleAboveChord(15.9997, 20.9898, 14.9897),
      style: OUTLINE,
    },
    'fixed-wing-hull': {
      type: 'path',
      role: 'body',
      d: halfCircleAboveChord(15.9997, 20.9898, 14.9897),
      style: OUTLINE,
    },
  },
  'vehicle-land': {
    'foot-band': BODIES['vehicle-land']!,
    'plain-wheel-pair': BODIES['vehicle-land']!,
    'inverted-hull-track': {
      type: 'path',
      role: 'body',
      d: 'M 16 23.555 C 10 23.555, 5 24.443, 1 25.75 L 1 6 L 31 6 L 31 25.75 C 27 24.445, 22 23.556, 16 23.556 Z',
      style: OUTLINE,
    },
  },
  'circle-12': {
    'foot-band': BODIES['circle-12']!,
    /**
     * F.3.5/F.3.14: derselbe 12-mm-Kreis, zwei Millimeter abgesenkt. Der separat vermessene Giebel
     * steht in `VARIANT_EXTRA_PRIMITIVES`. Die Quellgeometrie ist mit J.3.2 identisch; dessen
     * bestehende Katalogfassung `stationBody(17, 11.5)` ist jedoch eine abweichende Approximation
     * und wird hier nicht als Vorlage wiederverwendet.
     */
    'raised-gable': {
      type: 'circle',
      role: 'body',
      cx: 16,
      cy: 18,
      r: 12,
      style: OUTLINE,
    },
    'raised-circle-1mm': {
      type: 'circle',
      role: 'body',
      cx: 16,
      cy: 15,
      r: 12,
      style: OUTLINE,
    },
  },
};

/**
 * Geometrie, die zum Grundzeichen gehört, aber nicht sein Körper ist. `compose()` trägt sie mit;
 * ohne sie verschwände sie still — und ein Anhänger ohne Deichsel wäre ein anderes Zeichen.
 *
 * **Deichsel** (`trailer`) — ein nach rechts offener Bügel, Strich 0,5 mm. Gemessen an
 * `E.2.22` und in `5.1.2.1` bis `5.1.2.5` zahlengleich wiedergefunden: Innenloch
 * 1,2499/14,7500/3,7500/15,2502 mm, Außenkontur 0,7500/14,2501 bis 3,7500/15,7501. Daraus die
 * Armmittellinien y 14,5001 und 15,5002 (hier 14,5 und 15,5), das linke Ende x 0,9999 (hier 1,0),
 * Strich 0,4999 und lichte Höhe 1,0002.
 *
 * Das **rechte Ende ist nicht direkt ablesbar** — dieselbe Lage wie bei `bars()` in
 * `vehicle-categories.ts`: die Referenz verschmilzt Deichsel und Körperkontur zu einer Fläche.
 * Gemessen ist das Band, in dem es liegen muss: der Körperstrich deckt bei diesen y-Werten
 * x 3,7498 bis 4,2498 (Mittellinie 3,9998, Strich 0,5). Der Katalog setzt es auf die
 * Bandmitte — also auf die linke Körpermittellinie 4,0. Jede Lage im Band erzeugt dasselbe Bild;
 * belegt ist das Bild, nicht der Endpunkt.
 *
 * **L-Rahmen** (`swap-loader-vehicle`) — ein offener Polyzug (1|6) → (1|26) → (31|26), Strich
 * 0,5 mm. Gemessen an **drei** Dateien, die ihn zahlengleich führen: `E.2.15`, `5.1.1.8` und
 * `5.1.1.9`. Seine Innenkontur misst in `E.2.15` 1,2499/6,2502/30,7499/25,7503 mit dem Knick auf
 * x 2,2500 und y 24,7505; die senkrechte Mittellinie folgt daraus als (0,7497 + 1,2499)/2 =
 * 0,9998, die waagerechte als (25,7503 + 26,2502)/2 = 26,0003.
 *
 * Auch seine **beiden freien Enden** liegen in einem gedeckten Band: oben deckt der
 * Körperstrich y 5,75 bis 6,25 (Sehne 6,0), rechts x 30,75 bis 31,25 (Körperkante 31,0). Der
 * Katalog setzt beide auf die Bandmitte — dieselbe Begründung wie bei der Deichsel.
 *
 * Der L-Rahmen trägt zusätzlich die **Fahrwerkszone**: seine Unterkante 26,0 ist deren Oberkante,
 * 1,5 mm unter der Körperunterkante 24,5. Siehe `compose()`.
 */
const EXTRA_PRIMITIVES: Partial<Record<SymbolKind, readonly Primitive[]>> = {
  trailer: [
    {
      type: 'polyline',
      role: 'bodyExtra',
      closed: false,
      points: [
        [4, 14.5],
        [1, 14.5],
        [1, 15.5],
        [4, 15.5],
      ],
      style: OUTLINE,
    },
  ],
  'swap-loader-vehicle': [
    {
      type: 'polyline',
      role: 'bodyExtra',
      closed: false,
      points: [
        [1, 6],
        [1, 26],
        [31, 26],
      ],
      style: OUTLINE,
    },
  ],
  'reduced-house': [
    {
      type: 'line',
      role: 'bodyExtra',
      x1: 2,
      y1: 10,
      x2: 30,
      y2: 10,
      style: OUTLINE,
    },
  ],
};

const TITLES: Partial<Record<SymbolKind, string>> = {
  trailer: 'Anhänger',
  'swap-loader-vehicle': 'Wechselladerfahrzeug',
  'upright-rectangle': 'Hochkantrechteck',
  'circle-12': '12-mm-Kreis',
  'reduced-house': 'Reduzierte Hauskontur',
  formation: 'Taktische Formation',
  person: 'Person',
  'vehicle-land': 'Landfahrzeug',
  'vehicle-air': 'Luftfahrzeug',
  'vehicle-water': 'Wasserfahrzeug',
  post: 'Funktionsstelle',
  building: 'Gebäude',
  container: 'Behälter, Ressource, Raum, Funkgerät',
  area: 'Gebiet',
  measure: 'Maßnahme',
  hazard: 'Gefahr',
  point: 'Konkreter Punkt',
  event: 'Ereignis',
  'spontaneous-helper': 'Spontanhelfer',
};

/**
 * Quellabschnitt je Grundzeichenart. **Nicht vollständig, und das ist die Aussage:** die beiden
 * Körperformen `swap-loader-vehicle` und `upright-rectangle` haben keinen eigenen Abschnitt —
 * ihre einzige Belegdatei ist das E.2-Zeichen selbst (je 1 von 661). Ein erfundener Abschnitt
 * wäre eine Quellenangabe, die die Quelle nicht macht; `entry()` wirft dafür, und beide stehen
 * deshalb nicht in `BASE_SYMBOLS`.
 */
const SECTIONS: Partial<Record<SymbolKind, { section: string; asset: string }>> = {
  trailer: { section: '5.1.2.1', asset: '5.1.2.1_Anhänger_allgemein.svg' },
  formation: { section: '1.1', asset: '1.1_Taktische Formation.svg' },
  person: { section: '1.2', asset: '1.2_Person.svg' },
  'vehicle-land': { section: '1.3', asset: '1.3_Landfahrzeug.svg' },
  'vehicle-air': { section: '1.4', asset: '1.4_Luftfahrzeug.svg' },
  'vehicle-water': { section: '1.5', asset: '1.5_Wasserfahrzeug.svg' },
  post: { section: '1.6', asset: '1.6_Funktionsstelle.svg' },
  building: { section: '1.7', asset: '1.7_Gebäude.svg' },
  container: { section: '1.8', asset: '1.8_Behälter Ressource Raum Funkgerät.svg' },
  area: { section: '1.9', asset: '1.9_Gebiet.svg' },
  measure: { section: '1.10', asset: '1.10_Maßnahme.svg' },
  hazard: { section: '1.11', asset: '1.11_Gefahr.svg' },
  point: { section: '1.12', asset: '1.12_Konkreter Punkt.svg' },
  event: { section: '1.13', asset: '1.13_Ereignis.svg' },
  'spontaneous-helper': { section: '1.14', asset: '1.14_Spontanhelfer.svg' },
};

/**
 * Die Zeichnung eines Grundzeichens. `variant` wählt eine zweite, in der Quelle belegte Zeichnung
 * derselben Art.
 *
 * **Eine unbekannte Variante wirft.** Ein stiller Rückfall auf die Kapitel-1-Zeichnung wäre genau
 * der Fehler, den dieser Teilslice beseitigt: ein E.2-Wasserfahrzeug auf dem Rumpf von `1.5`
 * liegt 1,0 mm zu tief und ist um 0,07 % zu groß, und **kein** Gate meldete das vor dem
 * Extraktorausbau.
 */
export function baseDrawing(kind: SymbolKind, variant?: BodyVariantId): Drawing {
  const body = variant === undefined ? BODIES[kind] : VARIANT_BODIES[kind]?.[variant];
  if (!body) {
    throw new Error(
      variant === undefined
        ? `Kein Grundzeichen für "${kind}" im Katalog.`
        : `Für "${kind}" ist keine Körpervariante "${variant}" belegt. Der Katalog fällt nicht ` +
          'auf die Zeichnung aus Kapitel 1 zurück: die wäre eine andere Geometrie, und die ' +
          'Verwechslung bliebe unsichtbar.',
    );
  }
  const title = TITLES[kind];
  const section = SECTIONS[kind]?.section;
  return {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [
      body,
      ...(EXTRA_PRIMITIVES[kind] ?? []),
      ...(variant === undefined ? [] : VARIANT_EXTRA_PRIMITIVES[kind]?.[variant] ?? []),
    ],
    ...(title !== undefined ? { title } : {}),
    ...(title !== undefined
      ? {
          description:
            section !== undefined
              ? `Grundzeichen: ${title}. BABZ-Abschnitt ${section}.`
              : `Körperform: ${title}. Ohne eigenen BABZ-Abschnitt.`,
        }
      : {}),
  };
}

function entry(kind: SymbolKind): CatalogEntry {
  const title = TITLES[kind];
  if (title === undefined) throw new Error(`Kein Titel für "${kind}".`);
  const meta = SECTIONS[kind];
  if (!meta) throw new Error(`Keine Quellenangabe für "${kind}".`);
  return {
    id: `base.${kind}`,
    title,
    kind,
    profile: 'bund',
    depictions: [
      {
        variant: 'primary',
        drawing: baseDrawing(kind),
        sourceRefs: [
          {
            source: 'babz-svg-2025',
            section: meta.section,
            asset: meta.asset,
            status: 'verbatim',
          },
        ],
      },
    ],
  };
}

/**
 * Alle vierzehn Grundzeichen aus Kapitel 1, in Abschnittsreihenfolge. Seit LFH-424 vollständig:
 * die sechs bis dahin fehlenden waren nicht unbelegbar, sondern nur mit dem damaligen Extraktor
 * nicht vermessbar (er legte für Kurvenpfade keine Form ab — `shapes: []` bei 1.3, 1.4, 1.5, 1.9
 * und 1.14). Vermessen sind sie mit einem eigenen Pfadparser mit analytischen Kubik-Extrema, wie
 * ihn der Teilslice E-c für die 37 E.1-Dateien gebaut hat; die Herkunft jeder Zahl steht am
 * jeweiligen Körper.
 *
 * **Der Teilslice E.2 hat denselben Parser in den Extraktor gezogen** (`parsePathBounds`). Seither
 * sind 1.3, 1.4, 1.5 und 1.9 zusätzlich am Kennwertartefakt gegatet; ungegatet bleibt allein
 * `1.14 Spontanhelfer`, dessen Referenzdatei überhaupt keine Füllebene führt.
 *
 * **Diese Sammlung ist das Register des Kapitels 1 und keine Liste aller Körperformen.** Die
 * Körperformen, die kein Kapitel-1-Grundzeichen sind — Anhängerrumpf, Wechselladerrumpf,
 * Hochkantrechteck und 12-mm-Kreis —, stehen in `BODIES` und tragen eigene Manifestzeilen; sie hier zu führen
 * verlangte einen Abschnitt aus Kapitel 1, den sie nicht haben.
 */
export const BASE_SYMBOLS = {
  formation: entry('formation'),
  person: entry('person'),
  'vehicle-land': entry('vehicle-land'),
  'vehicle-air': entry('vehicle-air'),
  'vehicle-water': entry('vehicle-water'),
  post: entry('post'),
  building: entry('building'),
  container: entry('container'),
  area: entry('area'),
  measure: entry('measure'),
  hazard: entry('hazard'),
  point: entry('point'),
  event: entry('event'),
  'spontaneous-helper': entry('spontaneous-helper'),
} as const satisfies Partial<Record<SymbolKind, CatalogEntry>>;
