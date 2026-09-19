import type { Point, Primitive, Style } from '@einsatzzeichen/schema';
import type { PictogramContrastPair } from '../catalog-definition.js';

/**
 * 0,5 mm — die Wandstärke der Referenzumrisse (1,417 pt bei 90,709 pt auf 32 mm). Alle Striche
 * der Anhänge K und L liegen mit ihrer Mittellinie auf den an der Referenz abgelesenen
 * Koordinaten; Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert.
 */
export const DAMAGE_STROKE_WIDTH_MM = 0.5;

/**
 * Anhang K kommt ohne eine einzige Füllangabe aus: alle 18 Dateien sind reines Schwarz auf der
 * Ausgabeoberfläche. Genau ein Paar, weil es keine zweite Farbnachbarschaft zu deklarieren gibt.
 */
export const DAMAGE_BLACK_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarze Schadensmarke auf Ausgabeoberfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

export const DAMAGE_BLACK_STROKE = Object.freeze({
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: DAMAGE_STROKE_WIDTH_MM,
} satisfies Style);

function copyStyle(style: Readonly<Style>): Style {
  return { ...style };
}

export function damagePath(d: string, style: Readonly<Style> = DAMAGE_BLACK_STROKE): Primitive {
  return { type: 'path', role: 'pictogram', d, style: copyStyle(style) };
}

export function damageLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  style: Readonly<Style> = DAMAGE_BLACK_STROKE,
): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: copyStyle(style) };
}

export function damagePolyline(
  points: readonly Point[],
  closed = false,
  style: Readonly<Style> = DAMAGE_BLACK_STROKE,
): Primitive {
  return { type: 'polyline', role: 'pictogram', points, closed, style: copyStyle(style) };
}

export const DAMAGE_BLACK_FILL = Object.freeze({
  fill: 'schwarz',
  stroke: 'none',
} satisfies Style);

/**
 * Die Beschriftung in L.10 — die einzige des Anhangs. Wie `commsText` setzt der Helfer
 * `role: 'pictogram'` und eine Füllung statt einer Kontur; `boxMm` und `minRenderPx` bleiben
 * Pflicht, weil beides bei Text eine Zusicherung des Autors ist und keine Messung.
 *
 * Die Vorgabefarbe ist **schwarz**, nicht rot. Begründung an der Verwendungsstelle in
 * `02-dyke.ts`: Rot verfehlt als Textfarbe die Schwelle von 4,5:1.
 */
export function damageText(
  content: string,
  options: {
    x: number;
    y: number;
    sizeMm: number;
    minRenderPx: number;
    anchor?: 'start' | 'middle' | 'end';
    baseline?: 'alphabetic' | 'middle' | 'hanging';
    style?: Readonly<Style>;
  },
): Primitive {
  return {
    type: 'text',
    role: 'pictogram',
    content,
    x: options.x,
    y: options.y,
    sizeMm: options.sizeMm,
    anchor: options.anchor ?? 'start',
    baseline: options.baseline ?? 'alphabetic',
    // Versalhöhe rund 0,72 der Schriftgrösse, Unterlängen rund 0,22 darunter; die Breite ist an
    // der Referenz abgenommen (die Ziffernfolge endet bei 9,7 mm).
    boxMm: {
      xMm: options.x,
      yMm: options.y - options.sizeMm * 0.72,
      widthMm: content.length * options.sizeMm * 0.62,
      heightMm: options.sizeMm * 0.94,
    },
    minRenderPx: options.minRenderPx,
    style: copyStyle(options.style ?? DAMAGE_BLACK_FILL),
  };
}

export function damageRect(
  x: number,
  y: number,
  width: number,
  height: number,
  style: Readonly<Style> = DAMAGE_BLACK_STROKE,
): Primitive {
  return { type: 'rect', role: 'pictogram', x, y, width, height, style: copyStyle(style) };
}

/**
 * Anhang L setzt eine rote Schadensmarke auf eine schwarze Deichfigur. Beide Nachbarschaften
 * werden deklariert: Rot grenzt an die Oberfläche **und** kreuzt die schwarze Deichlinie.
 */
export const DYKE_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Schwarze Deichfigur auf Ausgabeoberfläche',
  },
  {
    foreground: 'rot',
    background: 'surface',
    context: 'Rote Schadensmarke auf Ausgabeoberfläche',
  },
  {
    foreground: 'rot',
    background: 'schwarz',
    context: 'Rote Schadensmarke an der schwarzen Deichfigur',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

export const DAMAGE_RED_STROKE = Object.freeze({
  fill: 'none',
  stroke: 'rot',
  strokeWidth: DAMAGE_STROKE_WIDTH_MM,
} satisfies Style);

export const DAMAGE_RED_FILL = Object.freeze({
  fill: 'rot',
  stroke: 'none',
} satisfies Style);

/**
 * Die Deichfigur, die alle zehn L-Zeichen tragen — ein Querschnitt: flaches Vorland, Aussenböschung,
 * Krone, kurze Binnenböschung, höher liegendes Binnenland. Identisch in allen zehn Referenzdateien
 * und deshalb hier einmal, statt zehnmal abgeschrieben.
 */
export const DYKE_OUTLINE: readonly Point[] = Object.freeze([
  [2, 26],
  [10, 26],
  [17, 6],
  [23, 6],
  [25, 13],
  [31, 13],
] as const);

export function dykeBase(): Primitive {
  return damagePolyline(DYKE_OUTLINE);
}

/** Eine kubische Bézierkurve als Start, zwei Kontrollpunkte und Ende. */
export type Cubic = readonly [Point, Point, Point, Point];

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

function cubicAt(curve: Cubic, t: number): Point {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return [
    a * curve[0][0] + b * curve[1][0] + c * curve[2][0] + d * curve[3][0],
    a * curve[0][1] + b * curve[1][1] + c * curve[2][1] + d * curve[3][1],
  ];
}

function cubicSlope(curve: Cubic, t: number): Point {
  const u = 1 - t;
  const axis = (index: 0 | 1): number =>
    3 * u * u * (curve[1][index] - curve[0][index]) +
    6 * u * t * (curve[2][index] - curve[1][index]) +
    3 * t * t * (curve[3][index] - curve[2][index]);
  return [axis(0), axis(1)];
}

/**
 * Das Teilstück einer kubischen Kurve zwischen t0 und t1, selbst wieder kubisch: Endpunkte auf
 * der Kurve, innere Kontrollpunkte ein Drittel der Parameterspanne entlang der Tangente. Das
 * ist exakt, keine Näherung an der Kurvenform.
 */
function cubicSlice(curve: Cubic, t0: number, t1: number): Cubic {
  const span = (t1 - t0) / 3;
  const p0 = cubicAt(curve, t0);
  const p3 = cubicAt(curve, t1);
  const s0 = cubicSlope(curve, t0);
  const s1 = cubicSlope(curve, t1);
  return [
    p0,
    [p0[0] + s0[0] * span, p0[1] + s0[1] * span],
    [p3[0] - s1[0] * span, p3[1] - s1[1] * span],
    p3,
  ];
}

/** Eine zusammenhängende Kette kubischer Kurven als Pfadtext (nur absolute Kommandos). */
export function cubicChainD(chain: readonly Cubic[]): string {
  const [first] = chain;
  if (first === undefined) throw new Error('cubicChainD: leere Kette');
  let d = `M ${round3(first[0][0])} ${round3(first[0][1])}`;
  for (const [, c1, c2, end] of chain) {
    d +=
      ` C ${round3(c1[0])} ${round3(c1[1])} ${round3(c2[0])} ${round3(c2[1])}` +
      ` ${round3(end[0])} ${round3(end[1])}`;
  }
  return d;
}

/**
 * Strichelt eine Kette kubischer Kurven nach Bogenlänge: `dashMm` gezeichnet, `gapMm` frei,
 * beginnend am Anfang der Kette. Jeder Strich ist ein eigener Pfad aus exakt geteilten
 * Kurvenstücken.
 *
 * Der Umweg ist nötig, weil `Style` keine Strichelung kennt; ein `strokeDasharray` käme in
 * keinem der beiden Renderer an.
 */
export function dashedCubics(
  chain: readonly Cubic[],
  dashMm: number,
  gapMm: number,
  style: Readonly<Style>,
): Primitive[] {
  // Bogenlänge über eine feine Parametertabelle je Kurve.
  const steps = 200;
  const table: { curve: number; t: number; s: number }[] = [];
  let length = 0;
  chain.forEach((curve, index) => {
    let previous = cubicAt(curve, 0);
    if (index === 0) table.push({ curve: 0, t: 0, s: 0 });
    for (let step = 1; step <= steps; step += 1) {
      const t = step / steps;
      const point = cubicAt(curve, t);
      length += Math.hypot(point[0] - previous[0], point[1] - previous[1]);
      table.push({ curve: index, t, s: length });
      previous = point;
    }
  });
  const locate = (s: number): { curve: number; t: number } => {
    const found = table.find((entry) => entry.s >= s) ?? table[table.length - 1]!;
    return { curve: found.curve, t: found.t };
  };
  const dashes: Primitive[] = [];
  for (let start = 0; start < length; start += dashMm + gapMm) {
    const from = locate(start);
    const to = locate(Math.min(start + dashMm, length));
    const pieces: Cubic[] = [];
    for (let curve = from.curve; curve <= to.curve; curve += 1) {
      const t0 = curve === from.curve ? from.t : 0;
      const t1 = curve === to.curve ? to.t : 1;
      if (t1 > t0) pieces.push(cubicSlice(chain[curve]!, t0, t1));
    }
    if (pieces.length > 0) dashes.push(damagePath(cubicChainD(pieces), style));
  }
  return dashes;
}

/**
 * Pfadtext einer Welle zwischen `x1` und `x2`, wie die Referenz sie in K.6 und im Anhang M
 * zeichnet: Berge (y = yMid − amplitude) bei `crestX` und im Abstand `period`, Täler dazwischen.
 * Jede halbe Periode ist eine kubische Kurve mit waagerechten Tangenten an Berg und Tal und
 * Anfassern von einer Viertelperiode Länge — gemessen: so steil laufen die Referenzwellen durch
 * ihre Wendepunkte (steiler als eine Kosinuswelle gleicher Maße).
 *
 * Beginnt oder endet die Welle zwischen Berg und Tal, wird das angeschnittene Stück exakt
 * geteilt (`cubicSlice`).
 */
export function waveD(
  x1: number,
  x2: number,
  yMid: number,
  amplitude: number,
  period: number,
  crestX: number,
): string {
  const half = period / 2;
  const handle = period / 4;
  // Erster Extrempunkt links von x1 (Berg oder Tal), dann halbe Perioden bis über x2 hinaus.
  const firstIndex = Math.floor((x1 - crestX) / half + 1e-9);
  const extremeY = (index: number): number =>
    index % 2 === 0 ? yMid - amplitude : yMid + amplitude;
  const chain: Cubic[] = [];
  for (let index = firstIndex; crestX + index * half < x2 - 1e-9; index += 1) {
    const a = crestX + index * half;
    const b = a + half;
    const ya = extremeY(Math.abs(index));
    const yb = extremeY(Math.abs(index + 1));
    let curve: Cubic = [
      [a, ya],
      [a + handle, ya],
      [b - handle, yb],
      [b, yb],
    ];
    // Parameter t zu einer x-Koordinate: x(t) ist auf der Halbwelle streng monoton.
    const tAt = (x: number): number => {
      let low = 0;
      let high = 1;
      for (let step = 0; step < 50; step += 1) {
        const mid = (low + high) / 2;
        if (cubicAt(curve, mid)[0] < x) low = mid;
        else high = mid;
      }
      return (low + high) / 2;
    };
    const t0 = a < x1 ? tAt(x1) : 0;
    const t1 = b > x2 ? tAt(x2) : 1;
    if (t0 > 0 || t1 < 1) curve = cubicSlice(curve, t0, t1);
    chain.push(curve);
  }
  return cubicChainD(chain);
}

/**
 * Pfadtext einer glatten Kurve durch `points` (Catmull-Rom, als kubische Kurven geschrieben):
 * jede Tangente ist die halbe Sehne zwischen Vor- und Nachfolgepunkt, an den Enden die Sehne
 * zum einzigen Nachbarn.
 */
export function smoothCurveD(points: readonly Point[]): string {
  const chain: Cubic[] = [];
  for (let index = 0; index + 1 < points.length; index += 1) {
    const p0 = points[Math.max(0, index - 1)]!;
    const p1 = points[index]!;
    const p2 = points[index + 1]!;
    const p3 = points[Math.min(points.length - 1, index + 2)]!;
    chain.push([
      p1,
      [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6],
      [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6],
      p2,
    ]);
  }
  return cubicChainD(chain);
}

/**
 * Die Pfeilspitze des Anhangs L: ein gefülltes gleichseitiges Dreieck mit 5 mm Seitenlänge,
 * in allen sieben Pfeilzeichen (L.1 bis L.7) gleich. Spitze bei `tip`, ausgerichtet auf
 * `angleDeg` (0° zeigt nach rechts, positive Winkel nach unten).
 */
export const ARROW_HEAD_SIDE_MM = 5;
export const ARROW_HEAD_LENGTH_MM = (ARROW_HEAD_SIDE_MM * Math.sqrt(3)) / 2;

export function arrowHead(tipX: number, tipY: number, angleDeg: number): Primitive {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  // Basismitte liegt eine Dreieckshöhe hinter der Spitze, die Ecken je halbe Seite quer dazu.
  const baseX = tipX - cos * ARROW_HEAD_LENGTH_MM;
  const baseY = tipY - sin * ARROW_HEAD_LENGTH_MM;
  const offsetX = (-sin * ARROW_HEAD_SIDE_MM) / 2;
  const offsetY = (cos * ARROW_HEAD_SIDE_MM) / 2;
  return damagePolyline(
    [
      [round3(tipX), round3(tipY)],
      [round3(baseX + offsetX), round3(baseY + offsetY)],
      [round3(baseX - offsetX), round3(baseY - offsetY)],
    ],
    true,
    DAMAGE_RED_FILL,
  );
}

/** Die Basismitte der Pfeilspitze — dort endet der Schaft. */
export function arrowBase(tipX: number, tipY: number, angleDeg: number): Point {
  const rad = (angleDeg * Math.PI) / 180;
  return [
    round3(tipX - Math.cos(rad) * ARROW_HEAD_LENGTH_MM),
    round3(tipY - Math.sin(rad) * ARROW_HEAD_LENGTH_MM),
  ];
}

/**
 * Der Raum, den elf der achtzehn K-Zeichen teilen: ein Rechteck von 2/6 bis 30/26 mm. Alle vier
 * Kanten liegen auf ganzen Millimetern, weil die Referenz auf einem 0,5-mm-Raster gezeichnet ist
 * und die Mittellinien der 0,5 mm starken Umrisse genau dort zu liegen kommen.
 */
export const ROOM = Object.freeze({
  left: 2,
  top: 6,
  right: 30,
  bottom: 26,
  /** Der Füllstand in K.5 bis K.8 — die Trennlinie zwischen Trümmerraum und freiem Raum. */
  fillLine: 12,
});

/**
 * Die drei geschlossenen Seiten der Zeichen K.5 bis K.8: links, unten, rechts. Oben offen. In
 * K.6 enden die Wände an der Schuttwelle statt an der Deckenhöhe, deshalb die Wandhöhen als
 * Parameter.
 */
export function openRoom(leftTop: number = ROOM.top, rightTop: number = ROOM.top): Primitive {
  return damagePolyline([
    [ROOM.left, leftTop],
    [ROOM.left, ROOM.bottom],
    [ROOM.right, ROOM.bottom],
    [ROOM.right, rightTop],
  ]);
}
