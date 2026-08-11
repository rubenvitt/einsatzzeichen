import type { Point, Primitive, Style } from '@einsatzzeichen/schema';
import type { PictogramContrastPair } from '../catalog-definition.js';

/**
 * 1 mm wie bei den Zuständen (`STATE_STROKE_WIDTH_MM`) und den IuK-Zeichen
 * (`COMMS_STROKE_WIDTH_MM`) — die Strichbreite aller freistehenden Zeichen des Katalogs.
 *
 * Die Referenz selbst zeichnet schmaler: ihre Konturen sind gefüllte Umrisspfade von 1,418
 * SVG-Einheiten Wandstärke, also 0,5 mm. Der Katalog verdoppelt das bewusst und einheitlich,
 * damit die Zeichen am unteren Ende des Mehrgrößen-Gates noch Striche und nicht Andeutungen
 * sind: bei 16 px auf 32 mm Kantenlänge trägt 0,5 mm gerade eine Viertelpixelbreite. Die
 * **Mittellinien** bleiben davon unberührt und liegen auf den gemessenen Referenzkoordinaten.
 */
export const DAMAGE_STROKE_WIDTH_MM = 1;

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

/**
 * Zerlegt eine kubische Kurve in `segments` gleich lange Stücke und gibt jedes zweite als
 * eigenen Pfad zurück — eine gestrichelte Linie aus echter Geometrie.
 *
 * Der Umweg ist nötig, weil `Style` keine Strichelung kennt: es trägt `fill`, `stroke`,
 * `strokeWidth` und `fillRule`, sonst nichts. Ein `strokeDasharray` daran wäre in keinem der
 * beiden Renderer angekommen — der erste Entwurf tat genau das und erzeugte eine durchgezogene
 * Linie, die kein Gate beanstandete und erst im Vergleichsbogen auffiel. Die Alternative wäre,
 * das Schema und beide Renderer um Strichelung zu erweitern; für ein einziges Zeichen wäre das
 * ein Mechanismusschritt in einem Slice, der reines Hinzufügen sein soll.
 *
 * Unterteilt wird nach De Casteljau, also exakt und ohne Näherung an der Kurvenform.
 */
export function dashedCubic(
  start: Point,
  control1: Point,
  control2: Point,
  end: Point,
  segments: number,
  style: Readonly<Style> = DAMAGE_BLACK_STROKE,
): Primitive[] {
  const round = (value: number): number => Math.round(value * 1000) / 1000;
  const axis = (index: 0 | 1): [number, number, number, number] => [
    start[index],
    control1[index],
    control2[index],
    end[index],
  ];
  const valueAt = (t: number, index: 0 | 1): number => {
    const [p0, p1, p2, p3] = axis(index);
    const u = 1 - t;
    return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
  };
  const slopeAt = (t: number, index: 0 | 1): number => {
    const [p0, p1, p2, p3] = axis(index);
    const u = 1 - t;
    return 3 * u * u * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t * t * (p3 - p2);
  };
  /**
   * Das Teilstück zwischen t0 und t1 als eigene kubische Kurve: Endpunkte auf der Kurve, innere
   * Kontrollpunkte ein Drittel der Parameterspanne entlang der jeweiligen Tangente.
   */
  const slice = (t0: number, t1: number): [Point, Point, Point, Point] => {
    const span = (t1 - t0) / 3;
    return [
      [valueAt(t0, 0), valueAt(t0, 1)],
      [valueAt(t0, 0) + slopeAt(t0, 0) * span, valueAt(t0, 1) + slopeAt(t0, 1) * span],
      [valueAt(t1, 0) - slopeAt(t1, 0) * span, valueAt(t1, 1) - slopeAt(t1, 1) * span],
      [valueAt(t1, 0), valueAt(t1, 1)],
    ];
  };
  const dashes: Primitive[] = [];
  for (let index = 0; index < segments; index += 2) {
    const [p0, c1, c2, p3] = slice(index / segments, (index + 1) / segments);
    dashes.push(
      damagePath(
        `M ${round(p0[0])} ${round(p0[1])} C ${round(c1[0])} ${round(c1[1])} ` +
          `${round(c2[0])} ${round(c2[1])} ${round(p3[0])} ${round(p3[1])}`,
        style,
      ),
    );
  }
  return dashes;
}

/**
 * Eine gefüllte Pfeilspitze an `tip`, ausgerichtet auf `angleDeg` (0° zeigt nach rechts). Die
 * Referenz zeichnet sie in allen sechs Pfeilzeichen des Anhangs L gleich gross: rund 4,5 mm lang
 * und 3 mm breit.
 */
export function arrowHead(
  tipX: number,
  tipY: number,
  angleDeg: number,
  lengthMm = 4.5,
  widthMm = 3,
): Primitive {
  const rad = (angleDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const round = (value: number): number => Math.round(value * 1000) / 1000;
  // Basismitte liegt `lengthMm` hinter der Spitze, die beiden Flügel je `widthMm`/2 quer dazu.
  const baseX = tipX - cos * lengthMm;
  const baseY = tipY - sin * lengthMm;
  const offsetX = (-sin * widthMm) / 2;
  const offsetY = (cos * widthMm) / 2;
  return damagePolyline(
    [
      [round(tipX), round(tipY)],
      [round(baseX + offsetX), round(baseY + offsetY)],
      [round(baseX - offsetX), round(baseY - offsetY)],
    ],
    true,
    DAMAGE_RED_FILL,
  );
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

/** Die drei geschlossenen Seiten der Zeichen K.5 bis K.8: links, unten, rechts. Oben offen. */
export function openRoom(): Primitive {
  return damagePolyline([
    [ROOM.left, ROOM.top],
    [ROOM.left, ROOM.bottom],
    [ROOM.right, ROOM.bottom],
    [ROOM.right, ROOM.top],
  ]);
}

/**
 * Eine Girlande aus `count` nach oben gewölbten Bögen zwischen `x1` und `x2`. Die Referenz
 * zeichnet die Trümmeroberkante in K.6 und die Trümmerböschung in K.11 als unregelmäßig
 * gewellte Linie mit über hundert Bézier-Segmenten. Diese Unregelmäßigkeit trägt keine
 * Bedeutung — sie sagt „Schutt“, nicht „diese Schuttform“. Der Katalog bildet deshalb eine
 * gleichmäßige Welle, deterministisch aus Anzahl und Amplitude berechnet, statt hundert
 * gemessene Stützpunkte zu übernehmen, die niemand nachprüfen könnte.
 */
export function garland(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  count: number,
  amplitudeMm: number,
): Primitive {
  const stepX = (x2 - x1) / count;
  const stepY = (y2 - y1) / count;
  const round = (value: number): number => Math.round(value * 1000) / 1000;
  // Ausschliesslich absolute Kommandos: `tokenizePath` in `core` kennt M, L, H, V, C, Q und Z.
  // Eine relative Schreibweise wäre kein Stilfehler, sondern ein Befund im Kommando-Gate.
  let d = `M ${round(x1)} ${round(y1)}`;
  for (let index = 0; index < count; index += 1) {
    const startX = x1 + stepX * index;
    const startY = y1 + stepY * index;
    // Der Kontrollpunkt sitzt mittig über der Sehne; senkrecht zu ihr ausgelenkt wäre für die
    // flachen Winkel dieser beiden Zeichen ein Unterschied unterhalb der Strichbreite.
    const controlX = startX + stepX / 2;
    const controlY = startY + stepY / 2 - amplitudeMm;
    d += ` Q ${round(controlX)} ${round(controlY)} ${round(startX + stepX)} ${round(startY + stepY)}`;
  }
  return damagePath(d);
}
