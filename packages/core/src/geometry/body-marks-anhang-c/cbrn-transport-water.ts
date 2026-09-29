import { DEFAULT_STROKE_WIDTH_MM, type Primitive } from '@einsatzzeichen/schema';
import type { BoundsMm } from '../../bounds.js';
import type { AnhangCContext, MarkTable } from './shared.js';
import { c1Tongs, disc, stroke } from './shared.js';

/*
 * C.2.20 und C.2.23 bis C.2.26 samt Alternativen: CBRN-Schutz, Messen/Spüren, Dekontaminieren
 * (4.1.1 bis 4.1.3), Transportieren (4.7.19) und Wasserförderung (4.7.26) am Landfahrzeug
 * (LFH-786).
 *
 * Alle zehn Dateien stehen auf demselben Landfahrzeugkörper (Hülle 1 / 5,75 / 31 / 26, gewölbte
 * Deckkurve mit Scheitel y 8,0). Die Oberkante 5,75 ist nur der Sehnenpunkt dieser Kurve; alle
 * senkrechten Maße sind deshalb von der geraden Unterkante `bounds.maxY` aus gerechnet, alle
 * waagerechten von der Körpermitte x 16. Jede Fassung gilt für zwei wie für drei Räder: C.2.20,
 * C.2.23 und C.2.24 fahren auf zwei (x 3,75 / 28,25), C.2.25 und C.2.26 auf drei (zusätzlich
 * x 16); die Marken derselben Fähigkeit sind darüber nicht verschieden gemessen.
 */

function openPolyline(points: readonly (readonly [number, number])[]): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    closed: false,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

function ring(cx: number, cy: number, r: number): Primitive {
  return {
    type: 'circle',
    role: 'pictogram',
    cx,
    cy,
    r,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

/**
 * Die kleine Zange der Landfahrzeuge C.2.20, C.2.24 und C.2.25 (jeweils mit Lauf oben links):
 * dasselbe Motiv wie `c1Tongs`, aber mit eigenen Maßen. Gemessen an allen drei Dateien, die sie
 * bytegleich führen (Umriss auf die Mittellinie zurückgerechnet):
 *
 * | Größe | C.2.20 | C.2.24 | C.2.25 | hier gezeichnet |
 * |---|---|---|---|---|
 * | Kreuzungspunkt | (21,9998\|16,4972) | (21,9995\|16,4975) | (21,9995\|16,4972) | Aufrufer |
 * | Kopfradius | 1,7499 | 1,7499 | 1,7499 | 1,75 |
 * | Kopfmittelpunkte | (16,8832\|13,5) / (27,1165\|13,5) | (16,8828\|13,5) / (27,1162\|13,5) | wie C.2.24 | Kreuzung + (∓5,1167\|−3) |
 * | Schaftenden | (16,5\|22,0) / (27,5\|22,0) | wie C.2.20 | wie C.2.20 (Klammerecken) | Kreuzung + (±5,5\|+5,5) |
 * | Schaftneigung | 45° | 45° | 45° | 45° |
 *
 * Wie in `c1Tongs` endet der Schaft am Lotfuß des gegenüberliegenden Kopfmittelpunkts. Der
 * Lotabstand misst 1,4967 gegen r − 0,25 = 1,5: die Außenkante des Schafts endet 0,003 mm vor dem
 * Kopfkreis. Gezeichnet ist der gemessene Kopfabstand 5,1167, nicht die exakt berührende 5,1213.
 *
 * Gegenüber der Einzeldarstellung (Köpfe r 3,75, Schaftneigung dx/dy 0,71) ist das keine
 * Verkleinerung, und auch keine von `c1Tongs`: der Kopf misst 0,78 des C.1-Kopfs, der seitliche
 * Kopfabstand 0,81, der senkrechte 0,86 und die Schaftlänge 0,85.
 */
function smallTongs(crossX: number, crossY: number): Primitive[] {
  const headRadiusMm = 1.75;
  const headOffsetXMm = 5.1167;
  const headOffsetYMm = 3;
  const reachMm = 5.5;

  return [-1, 1].flatMap((side) => {
    const headXMm = crossX - side * headOffsetXMm;
    const headYMm = crossY - headOffsetYMm;
    const tipXMm = crossX + side * reachMm;
    const tipYMm = crossY + reachMm;

    const lengthMm = Math.hypot(crossX - tipXMm, crossY - tipYMm);
    const uX = (crossX - tipXMm) / lengthMm;
    const uY = (crossY - tipYMm) / lengthMm;
    const alongMm = (headXMm - tipXMm) * uX + (headYMm - tipYMm) * uY;

    return [
      stroke(tipXMm, tipYMm, tipXMm + alongMm * uX, tipYMm + alongMm * uY),
      disc(headXMm, headYMm, headRadiusMm),
    ];
  });
}

/**
 * Die beiden rechtwinkligen Klammern von 4.1.3 an den Schaftenden (`cornerY`, `crossX ± reach`),
 * gebaut wie in C.1.8: der senkrechte Schenkel reicht vom Eckpunkt `legMm` nach oben und 0,25 mm
 * darunter hinaus, der waagerechte beginnt 0,25 mm außerhalb und reicht `legMm` nach innen.
 */
function brackets(crossX: number, cornerY: number, reachMm: number, legMm: number): Primitive[] {
  return [-1, 1].flatMap((side) => {
    const cornerXMm = crossX + side * reachMm;
    return [
      stroke(cornerXMm, cornerY - legMm, cornerXMm, cornerY + 0.25),
      stroke(cornerXMm + side * 0.25, cornerY, cornerXMm - side * legMm, cornerY),
    ];
  });
}

/** Kreuzung der kleinen Zange: 6 mm rechts der Körpermitte, 9,5 mm über der Unterkante. */
function smallTongsCross(bounds: BoundsMm): readonly [number, number] {
  return [(bounds.minX + bounds.maxX) / 2 + 6, bounds.maxY - 9.5];
}

/** Kreuzung der großen, mittigen Zange (`c1Tongs`): Körpermitte, 9,5 mm über der Unterkante. */
function largeTongsCross(bounds: BoundsMm): readonly [number, number] {
  return [(bounds.minX + bounds.maxX) / 2, bounds.maxY - 9.5];
}

/**
 * Die Welle der Wasserförderung am Landfahrzeug, Tallinie `troughY`. Mittellinie aus C.2.26
 * rekonstruiert (Umrisskanten um ± 0,25 mm senkrecht versetzt und gegen die Kurve eingepasst,
 * größte Abweichung 0,016 mm): Enden (16 ∓ 11 | Tal), Scheitel (16 ∓ 6 | Tal − 3), Tal (16 | Tal).
 * Die Enden setzen mit der Steigung ∓0,5 an (aus der Stumpfkappe (4,8881|17,7761) →
 * (5,1117|18,2234)); der erste Knoten (16 ∓ 9,325 | Tal − 1,395) ist aus den Umrisskanten
 * (6,4900|16,4373) / (6,8601|16,7731) gemittelt, der Wendepunkt (16 ∓ 3 | Tal − 1,5) steht unter
 * 45°.
 *
 * Die Einzeldarstellung 4.7.26 hat dieselben x-Stellen (5 / 10 / 16 / 22 / 27), aber die Höhe 4
 * statt 3. Eine senkrechte Stauchung auf 0,75 trifft die Referenz trotzdem nur auf 0,077 mm
 * (die C.2.26-Welle ist neu gezeichnet, nicht gestaucht), deshalb steht die gemessene Kurve hier.
 */
function landRiverWave(cx: number, troughY: number): Primitive {
  // Linke Hälfte, relativ zu (Körpermitte | Tallinie), vom linken Ende zum Tal.
  const left: readonly (readonly [number, number])[] = [
    [-11, 0],
    [-10.225, -0.3875], [-9.695, -0.9875], [-9.325, -1.395],
    [-8.585, -2.21], [-7.9, -3], [-6, -3],
    [-4.5, -3], [-3.75, -2.25], [-3, -1.5],
    [-2.25, -0.75], [-1.5, 0], [0, 0],
  ];
  const right = left.slice(0, -1).reverse().map(([dx, dy]) => [-dx, dy] as const);
  const point = ([dx, dy]: readonly [number, number]): string =>
    `${+(cx + dx).toFixed(4)} ${+(troughY + dy).toFixed(4)}`;
  const all = [...left, ...right];
  let d = `M ${point(all[0]!)}`;
  for (let i = 1; i < all.length; i += 3) {
    d += ` C ${point(all[i]!)} ${point(all[i + 1]!)} ${point(all[i + 2]!)}`;
  }
  return {
    type: 'path',
    role: 'pictogram',
    d,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

/**
 * Wasserförderung am Landfahrzeug: Welle, Saugkorb r 1,5 um (x 6,5 | `lineY`), Förderleitung vom
 * Korbrand bis zur Spitze x 27 und offene Pfeilspitze mit Schenkeln `arrowLegMm` × `arrowLegMm`
 * unter 45°, Spitze auf Gehrung (Umrissspitze x 27,3536 = 27 + 0,25 · √2).
 */
function landWaterConveyance(
  bounds: BoundsMm,
  troughY: number,
  lineY: number,
  arrowLegMm: number,
): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2;
  const strainerXMm = cx - 9.5;
  const strainerRadiusMm = 1.5;
  const tipXMm = cx + 11;
  return [
    landRiverWave(cx, troughY),
    ring(strainerXMm, lineY, strainerRadiusMm),
    stroke(strainerXMm + strainerRadiusMm, lineY, tipXMm, lineY),
    openPolyline([
      [tipXMm - arrowLegMm, lineY - arrowLegMm],
      [tipXMm, lineY],
      [tipXMm - arrowLegMm, lineY + arrowLegMm],
    ]),
  ];
}

/** Landfahrzeug ohne Variante (30 × 20,25 mm, Hülle 1 / 5,75 / 31 / 26), Grundfassungen. */
const VEHICLE_LAND_MARKS: MarkTable = {
  /**
   * C.2.20: 4.1.1 ABC-/CBRN-Schutz neben dem Lauf „GW-G“, verkleinert und nach rechts gerückt:
   * die kleine Zange (`smallTongs`) kreuzt bei (22|16,5), 6 mm rechts der Körpermitte und 9,5 mm
   * über der Unterkante; ihre Schaftenden liegen 4 mm über der Unterkante. Die waagerechten und
   * senkrechten Fenster sowie der Querbalken der Einzeldarstellung fehlen.
   */
  'cbrn-protection': (bounds) => smallTongs(...smallTongsCross(bounds)),

  /**
   * C.2.24: 4.1.2 Messen, Spüren, Detektieren neben dem zweizeiligen Lauf „CBRN / ErkW“: die
   * kleine Zange wie in C.2.20 und ein Messstrich. Gemessen (Umriss auf die Mittellinie
   * zurückgerechnet): Stumpfkappe links (15,4322|18,0593) / (15,5666|18,5409), Mitte
   * (15,4994|18,3001) = Kreuzung + (−6,5|+1,8); Steigung aller vier Kanten −0,27917 bis −0,27925.
   *
   * Das rechte Ende liegt unter dem rechten Kopf und ist in der Referenz unsichtbar: die
   * Unterkante des Strichs läuft 1,7494 mm am Kopfmittelpunkt (27,1162|13,5) vorbei, streift also
   * den Kopfkreis r 1,75, und ihre letzte Ecke (27,6369|15,1708) liegt 1,7501 mm vom Mittelpunkt,
   * auf dem Kreis. Konstruiert ist genau diese Bedingung: der Strich läuft vom Anfangspunkt so am
   * rechten Kopf vorbei, dass seine Unterkante den Kopfkreis berührt (Mittellinie im Lotabstand
   * r − 0,25 = 1,5 mm, Steigung daraus −0,2792), und endet am Lotfuß des Kopfmittelpunkts. Seine
   * Endkappe reicht dort von 1,25 bis 1,75 mm vom Mittelpunkt und liegt damit vollständig in der
   * Scheibe; die Referenz endet 0,05 mm weiter auf demselben Strahl, ebenfalls verdeckt.
   *
   * In der Einzeldarstellung steigt der Messstrich von (1|18,5) nach (31|10,5) (Steigung −0,267),
   * in C.1.7 von Körperecke zu Körperecke; hier beginnt er links der Zange und endet am Kopf.
   */
  'cbrn-detection': (bounds) => {
    const [crossX, crossY] = smallTongsCross(bounds);
    const startX = crossX - 6.5;
    const startY = crossY + 1.8;
    const headX = crossX + 5.1167;
    const headY = crossY - 3;
    const offsetMm = 1.5;
    const toHeadX = headX - startX;
    const toHeadY = headY - startY;
    const distanceMm = Math.hypot(toHeadX, toHeadY);
    // Richtung zum Kopf um den Tangentenwinkel nach unten (+y) gedreht.
    const turn = Math.asin(offsetMm / distanceMm);
    const angle = Math.atan2(toHeadY, toHeadX) + turn;
    const alongMm = Math.sqrt(distanceMm ** 2 - offsetMm ** 2);
    return [
      ...smallTongs(crossX, crossY),
      stroke(
        startX,
        startY,
        startX + alongMm * Math.cos(angle),
        startY + alongMm * Math.sin(angle),
      ),
    ];
  },

  /**
   * C.2.25: 4.1.3 Dekontaminieren neben dem zweizeiligen Lauf „GW / Dekon“ und über dem „P“:
   * die kleine Zange wie in C.2.20, ihre Schaftenden (16,5|22) / (27,5|22) sind die Ecken der
   * beiden Klammern. Schenkel 3 mm (Referenz: senkrecht x 27,2495…27,7494, y 18,9998…22,2496;
   * waagerecht y 21,7497…22,2496, x 24,4993…27,7494; links spiegelbildlich), in C.1.8 dagegen 4
   * und in der Einzeldarstellung 6,25 × 5,75 mm.
   */
  decontamination: (bounds) => {
    const [crossX, crossY] = smallTongsCross(bounds);
    return [...smallTongs(crossX, crossY), ...brackets(crossX, crossY + 5.5, 5.5, 3)];
  },

  /**
   * C.2.23 und C.2.23#alternative: 4.7.19 Transportieren, in beiden Dateien bytegleich. Ring
   * r 5,5 um (16|17) — Körpermitte, 9 mm über der Unterkante — mit vier Durchmessern im
   * 45°-Raster (Referenz: Ring 11,25…22,75 × 10,2499…21,7497 außen; Speichen 0,5 mm, die
   * waagerechte auf y 16,7502…17,2501).
   *
   * Das ist die Einzeldarstellung (Ring r 14 um die Boxmitte) gleichmäßig auf 0,39 verkleinert,
   * aber mit der vollen Strichstärke 0,5 mm; eine skalierte Einzeldarstellung verdünnte den Strich
   * auf 0,2 mm. Deshalb eine eigene Fassung und keine Verkleinerung.
   */
  transport: (bounds) => {
    const cx = (bounds.minX + bounds.maxX) / 2;
    const cy = bounds.maxY - 9;
    const rMm = 5.5;
    const diagonalMm = rMm / Math.SQRT2;
    return [
      ring(cx, cy, rMm),
      stroke(cx - rMm, cy, cx + rMm, cy),
      stroke(cx, cy - rMm, cx, cy + rMm),
      stroke(cx - diagonalMm, cy - diagonalMm, cx + diagonalMm, cy + diagonalMm),
      stroke(cx + diagonalMm, cy - diagonalMm, cx - diagonalMm, cy + diagonalMm),
    ];
  },

  /**
   * C.2.26: 4.7.26 Wasserförderung unter dem Lauf „SW KatS“. Gemessen (Umriss auf die
   * Mittellinie zurückgerechnet):
   *
   * | Teil | Referenz | Mittellinie |
   * |---|---|---|
   * | Welle | Scheitel y 14,7499…15,2502, Tal y 17,7499…18,2498, Enden x 5 / 27 | Tal 8 mm über der Unterkante (`landRiverWave`) |
   * | Saugkorb | außen r 1,7503, innen r 1,2497 um (6,4999\|21,9997) | r 1,5 um (6,5\|22) |
   * | Leitung | y 21,7497…22,2493 | y 22, 4 mm über der Unterkante |
   * | Pfeilspitze | Gehrung (27,3536\|21,9995), Stumpfkappen um (25,0\|20,0) / (25,0\|24,0) | Spitze (27\|22), Schenkel 2 × 2 |
   *
   * Gegenüber der Einzeldarstellung (Welle 9…13, Korb r 2 um (6|20), Spitze x 28, Schenkel 3 × 3)
   * ist das keine Verkleinerung: die Welle behält ihre Breite und verliert ein Viertel ihrer Höhe,
   * der Korb schrumpft auf 0,75 und rückt 0,5 mm nach rechts, die Spitze 1 mm nach links, die
   * Schenkel schrumpfen auf 0,67.
   */
  'water-conveyance': (bounds) =>
    landWaterConveyance(bounds, bounds.maxY - 8, bounds.maxY - 4, 2),
};

/**
 * Zweite Fassung `centered-large-tongs`: die Alternativdarstellungen ohne Lauf. Die Zange steht
 * mittig und in der C.1-Größe (`c1Tongs`), weil kein Lauf links oben Platz beansprucht.
 */
const VEHICLE_LAND_CENTERED_LARGE_TONGS_MARKS: MarkTable = {
  /**
   * C.2.20#alternative: 4.1.1 mit der C.1-Zange,
   * Kreuzung (16|16,4962) — Körpermitte, 9,5 mm über der Unterkante —, Köpfe r 2,25 um
   * (9,6777|13,0) / (22,3216|13,0), Schaftenden (9,5|23,0) / (22,5|23,0), also
   * `c1Tongs(16, 16,5, 6,5)` wie in C.1.7.
   *
   * **Befund an der Quelle (C.2.24#alternative):** die Datei heißt „CBRN-Erkundungswagen“ und
   * ihre Hauptdarstellung zeigt 4.1.2 mit Messstrich, die Alternative zeigt aber 4.1.1 ohne
   * Messstrich, bildgleich mit C.2.20#alternative. Als Fixture ergäbe sie dieselbe Spec wie
   * C.2.20#alternative und keine Messung von 4.1.2; sie ist deshalb nicht aufgenommen, der Befund
   * steht in `docs/decisions/2026-09-29-lfh-786-kapitel-4-piktogramme-in-anhang-c.md`.
   */
  'cbrn-protection': (bounds) => {
    const [crossX, crossY] = largeTongsCross(bounds);
    return c1Tongs(crossX, crossY, 6.5);
  },

  /**
   * C.2.25#alternative: 4.1.3 mit der C.1-Zange wie C.2.20#alternative; die Schaftenden
   * (9,5|23) / (22,5|23) sind die Klammerecken. Schenkel 3 mm (Referenz: senkrecht
   * x 22,2500…22,7498, y 20,0…23,2497; waagerecht y 22,7498…23,2497, x 19,4997…22,7498).
   */
  decontamination: (bounds) => {
    const [crossX, crossY] = largeTongsCross(bounds);
    return [...c1Tongs(crossX, crossY, 6.5), ...brackets(crossX, crossY + 6.5, 6.5, 3)];
  },
};

/**
 * Zweite Fassung `raised-wave-3mm-arrow-3mm`: C.2.26#alternative ohne Lauf.
 */
const VEHICLE_LAND_RAISED_ARROW_MARKS: MarkTable = {
  /**
   * C.2.26#alternative: dieselbe Welle 3 mm höher (Tal y 15, Referenz 14,7760…15,2234 an den
   * Enden, Scheitel 11,7499…12,2498), Saugkorb und Leitung 2,5 mm höher (y 19,5, Referenz
   * 19,2500…19,7495, Korb außen ab y 17,7499) und die Pfeilschenkel 3 × 3 statt 2 × 2
   * (Stumpfkappen um (24,0|16,5) / (24,0|22,5), Gehrung (27,3532|19,4994)). Die Kennung sagt
   * „raised-3mm“ nach der Welle; die Leitung steigt nur um 2,5 mm.
   */
  'water-conveyance': (bounds) =>
    landWaterConveyance(bounds, bounds.maxY - 11, bounds.maxY - 6.5, 3),
};

export const CBRN_TRANSPORT_WATER_CONTEXTS: readonly AnhangCContext[] = [
  { kind: 'vehicle-land', marks: VEHICLE_LAND_MARKS },
  {
    kind: 'vehicle-land',
    rendition: 'centered-large-tongs',
    marks: VEHICLE_LAND_CENTERED_LARGE_TONGS_MARKS,
  },
  {
    kind: 'vehicle-land',
    rendition: 'raised-wave-3mm-arrow-3mm',
    marks: VEHICLE_LAND_RAISED_ARROW_MARKS,
  },
];
