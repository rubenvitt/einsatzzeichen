import type { Point, Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineState, type CatalogPictogramDefinition } from '../catalog-definition.js';

/**
 * 5.8.7 Wetterzustände. Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert.
 * Alle Striche der Referenz sind 0,5 mm breit (1,417 pt); Wolke, Bedeckungskreis und
 * Thermometer tragen zusätzlich eine weiße Innenfläche (Ebene „Flächige Füllung").
 */
const WEATHER_STROKE_WIDTH_MM = 0.5;

const WEATHER_STROKE = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: WEATHER_STROKE_WIDTH_MM,
} as const satisfies Style;

const WEATHER_WHITE = {
  fill: 'weiss',
  stroke: 'schwarz',
  strokeWidth: WEATHER_STROKE_WIDTH_MM,
} as const satisfies Style;

const WEATHER_BLACK = {
  fill: 'schwarz',
  stroke: 'none',
} as const satisfies Style;

const BLACK_ON_SURFACE = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'schwarzes Wettermotiv auf Ausgabeoberfläche',
  },
] as const;

const BLACK_ON_WHITE_AND_SURFACE = [
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'schwarze Wetterkontur auf weißer Innenfläche',
  },
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'schwarze Wetterkontur auf Ausgabeoberfläche',
  },
] as const;

/** Auf 0,001 mm runden, damit berechnete Koordinaten lesbar und stabil bleiben. */
function mm(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function weatherLine(x1: number, y1: number, x2: number, y2: number): Primitive {
  return {
    type: 'line',
    role: 'pictogram',
    x1: mm(x1),
    y1: mm(y1),
    x2: mm(x2),
    y2: mm(y2),
    style: { ...WEATHER_STROKE },
  };
}

function weatherPolyline(points: readonly Point[]): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points: points.map(([x, y]) => [mm(x), mm(y)] as const),
    closed: false,
    style: { ...WEATHER_STROKE },
  };
}

function weatherCircle(cx: number, cy: number, r: number, style: Style = WEATHER_STROKE): Primitive {
  return { type: 'circle', role: 'pictogram', cx, cy, r, style: { ...style } };
}

function weatherPath(d: string, style: Style): Primitive {
  return { type: 'path', role: 'pictogram', d, style: { ...style } };
}

function pointOnCircle(cx: number, cy: number, r: number, angleDeg: number): Point {
  const angle = (angleDeg * Math.PI) / 180;
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

/**
 * Kreisbogen als Folge kubischer Bezierkurven (Henkellänge 4/3 · tan(Δ/4) · r). Winkel in Grad
 * im Bildschirmsinn (y nach unten, 0° = rechts, 90° = unten). Der Bogen wird an jedem Vielfachen
 * von 90° geteilt: so liegen alle Kontrollpunkte innerhalb der achsparallelen Kreishülle, und
 * das Box-Gate bleibt exakt. Liefert nur die `C`-Kommandos; der Startpunkt steht schon im Pfad.
 */
function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const direction = Math.sign(toDeg - fromDeg);
  const stops = [fromDeg];
  let next = direction > 0 ? Math.floor(fromDeg / 90) * 90 + 90 : Math.ceil(fromDeg / 90) * 90 - 90;
  while (direction > 0 ? next < toDeg - 1e-9 : next > toDeg + 1e-9) {
    stops.push(next);
    next += 90 * direction;
  }
  stops.push(toDeg);
  const commands: string[] = [];
  for (let index = 1; index < stops.length; index += 1) {
    const a = (stops[index - 1] * Math.PI) / 180;
    const b = (stops[index] * Math.PI) / 180;
    const handle = (4 / 3) * Math.tan((b - a) / 4) * r;
    const [x0, y0] = pointOnCircle(cx, cy, r, stops[index - 1]);
    const [x3, y3] = pointOnCircle(cx, cy, r, stops[index]);
    const x1 = x0 - handle * Math.sin(a);
    const y1 = y0 + handle * Math.cos(a);
    const x2 = x3 + handle * Math.sin(b);
    const y2 = y3 - handle * Math.cos(b);
    commands.push(`C ${mm(x1)} ${mm(y1)} ${mm(x2)} ${mm(y2)} ${mm(x3)} ${mm(y3)}`);
  }
  return commands.join(' ');
}

function angleDeg(cx: number, cy: number, [x, y]: Point): number {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
}

/** Oberer der beiden Schnittpunkte zweier Kreise (kleineres y). */
function upperIntersection(
  [ax, ay, ar]: readonly [number, number, number],
  [bx, by, br]: readonly [number, number, number],
): Point {
  const dx = bx - ax;
  const dy = by - ay;
  const d = Math.hypot(dx, dy);
  const along = (ar * ar - br * br + d * d) / (2 * d);
  const across = Math.sqrt(ar * ar - along * along);
  const mx = ax + (along * dx) / d;
  const my = ay + (along * dy) / d;
  const first: Point = [mx + (across * dy) / d, my - (across * dx) / d];
  const second: Point = [mx - (across * dy) / d, my + (across * dx) / d];
  return first[1] < second[1] ? first : second;
}

/**
 * Sonne: Kreis r = 7 mm mit weißer Fläche, Mittelpunkt wie in der Referenz 0,1 mm links der
 * Zeichenmitte (15,9 | 16). Acht Strahlen im 45°-Raster um (16 | 16), jeweils von r = 9 bis 14 mm.
 */
function sunPrimitives(): readonly Primitive[] {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
    const [x1, y1] = pointOnCircle(16, 16, 9, angle);
    const [x2, y2] = pointOnCircle(16, 16, 14, angle);
    return weatherLine(x1, y1, x2, y2);
  });
  return [weatherCircle(15.9, 16, 7, WEATHER_WHITE), ...rays];
}

/**
 * Wolke: Vereinigung dreier Kreise über einer gemeinsamen waagerechten Grundlinie y = 24 mm —
 * links (6 | 19) r = 5, Mitte (16 | 15) r = 9, rechts (25 | 18) r = 6. Links und rechts berührt
 * die Grundlinie die Kreise tangential; oben wechselt die Kontur an den Kreisschnittpunkten.
 */
function cloudPath(): string {
  const left = [6, 19, 5] as const;
  const middle = [16, 15, 9] as const;
  const right = [25, 18, 6] as const;
  const leftMiddle = upperIntersection(left, middle);
  const middleRight = upperIntersection(middle, right);
  let leftEnd = angleDeg(left[0], left[1], leftMiddle);
  if (leftEnd < 90) leftEnd += 360;
  let middleStart = angleDeg(middle[0], middle[1], leftMiddle);
  let middleEnd = angleDeg(middle[0], middle[1], middleRight);
  if (middleStart < 0) middleStart += 360;
  if (middleEnd < middleStart) middleEnd += 360;
  let rightStart = angleDeg(right[0], right[1], middleRight);
  if (rightStart < 0) rightStart += 360;
  return [
    'M 6 24',
    arc(...left, 90, leftEnd),
    arc(...middle, middleStart, middleEnd),
    arc(...right, rightStart, 450),
    'Z',
  ].join(' ');
}

/** Bedeckung 4/8: Kreis r = 14 mm um die Zeichenmitte, linke Hälfte schwarz gefüllt. */
function cloudCoverPrimitives(): readonly Primitive[] {
  return [
    weatherCircle(16, 16, 14, WEATHER_WHITE),
    weatherPath(`M 16 30 ${arc(16, 16, 14, 90, 270)} Z`, WEATHER_BLACK),
  ];
}

/**
 * Niederschlagsspur: Gerade von (x0 | 29) nach (x0 + 7 | 3), also 15° gegen die Senkrechte.
 * `span` liefert das Teilstück zwischen zwei Höhen auf dieser Geraden.
 */
function precipitationSpan(x0: number, fromY: number, toY: number): Primitive {
  const xAt = (y: number): number => x0 + (7 * (29 - y)) / 26;
  return weatherLine(xAt(fromY), fromY, xAt(toY), toY);
}

const PRECIPITATION_COLUMNS = [3, 12.5, 22] as const;
const TRACK_LENGTH_MM = Math.hypot(7, 26);

/** Höhe auf der Niederschlagsspur nach `s` mm Weg von unten. */
function yAlongTrack(s: number): number {
  return 29 - (26 * s) / TRACK_LENGTH_MM;
}

/** Regen: jede Spur gestrichelt, von unten 4,5 mm Strich und 3 mm Lücke im Wechsel. */
function rainPrimitives(): readonly Primitive[] {
  const dashes: ReadonlyArray<readonly [number, number]> = [
    [0, 4.5],
    [7.5, 12],
    [15, 19.5],
    [22.5, TRACK_LENGTH_MM],
  ];
  return PRECIPITATION_COLUMNS.flatMap((x0) =>
    dashes.map(([from, to]) => precipitationSpan(x0, yAlongTrack(from), yAlongTrack(to))),
  );
}

/**
 * Hagel: dieselben Spuren wie beim Regen, auf halber Höhe (y = 16 mm) sitzt ein Hagelkorn
 * (Kreis r = 2 mm). Unten 4,5 mm Strich und 3 mm Lücke, dann ein durchgehender Strich durch das
 * Korn bis y = 9,65 mm, oben nach 3 mm Lücke ein Strich ab y = 6,75 mm.
 */
function hailPrimitives(): readonly Primitive[] {
  const halfChord = (2 * 26) / TRACK_LENGTH_MM;
  return PRECIPITATION_COLUMNS.flatMap((x0) => [
    precipitationSpan(x0, 29, yAlongTrack(4.5)),
    precipitationSpan(x0, 21.75, 16 + halfChord),
    weatherCircle(x0 + 3.5, 16, 2),
    precipitationSpan(x0, 16 - halfChord, 9.65),
    precipitationSpan(x0, 6.75, 3),
  ]);
}

/**
 * Blitz: Zickzack (7,05 | 7,5) → (3,45 | 15,95) → (9,05 | 14,55) → (4,5 | 25,5), an der Spitze
 * ein offener Pfeilkopf mit den Armen nach (3,5 | 22,5) und (8 | 24,5). Die drei Blitze stehen
 * in der Referenz um 0, 9,5 und 19,5 mm versetzt.
 */
function lightning(dx: number): readonly Primitive[] {
  return [
    weatherPolyline([
      [7.05 + dx, 7.5],
      [3.45 + dx, 15.95],
      [9.05 + dx, 14.55],
      [4.5 + dx, 25.5],
    ]),
    weatherPolyline([
      [3.5 + dx, 22.5],
      [4.5 + dx, 25.5],
      [8 + dx, 24.5],
    ]),
  ];
}

/** Schneeflocke: drei Durchmesser (senkrecht und ±30° zur Waagerechten), Radius 4 mm. */
function snowflake(cx: number): readonly Primitive[] {
  return [90, 30, 150].map((angle) => {
    const [x1, y1] = pointOnCircle(cx, 16, 4, angle);
    const [x2, y2] = pointOnCircle(cx, 16, 4, angle + 180);
    return weatherLine(x1, y1, x2, y2);
  });
}

/**
 * Thermometer: Röhre 5 mm breit (x = 10 … 15) mit Halbkreiskappe um (12,5 | 5,5), unten eine
 * Kugel r = 5,5 mm um (12,5 | 23,5); Röhre und Kugel treffen sich dort, wo die Röhrenwände den
 * Kugelkreis schneiden. Rechts davon vier Skalenstriche von x = 18 bis 26 mm.
 */
function thermometerPath(): string {
  const joinY = mm(23.5 - Math.sqrt(5.5 * 5.5 - 2.5 * 2.5));
  const leftJoin = angleDeg(12.5, 23.5, [10, joinY]);
  const rightJoin = angleDeg(12.5, 23.5, [15, joinY]);
  return [
    `M 15 ${joinY}`,
    'L 15 5.5',
    arc(12.5, 5.5, 2.5, 0, -180),
    `L 10 ${joinY}`,
    arc(12.5, 23.5, 5.5, leftJoin + 360, rightJoin),
    'Z',
  ].join(' ');
}

export const WEATHER_STATES = deepFreeze([
  defineState({
    section: '5.8.7.1',
    id: 'weather-sunny',
    title: 'Sonnig',
    referenceAsset: '5.8.7.1_Sonnig.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 28 },
    contrastPairs: BLACK_ON_WHITE_AND_SURFACE,
    primitives: sunPrimitives(),
  }),
  defineState({
    section: '5.8.7.2',
    id: 'weather-cloudy',
    title: 'Wolkig',
    referenceAsset: '5.8.7.2_Wolkig.svg',
    box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 18 },
    contrastPairs: BLACK_ON_WHITE_AND_SURFACE,
    primitives: [weatherPath(cloudPath(), WEATHER_WHITE)],
  }),
  defineState({
    section: '5.8.7.3',
    id: 'weather-cloud-cover-four-eighths',
    title: 'Bedeckung des Himmels 4 von 8',
    referenceAsset: '5.8.7.3_Bedeckung des Himmels 4 von 8.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 28 },
    contrastPairs: BLACK_ON_WHITE_AND_SURFACE,
    primitives: cloudCoverPrimitives(),
  }),
  defineState({
    section: '5.8.7.4',
    id: 'weather-foggy',
    title: 'Nebelig',
    referenceAsset: '5.8.7.4_Nebelig.svg',
    box: { xMm: 2, yMm: 12, widthMm: 28, heightMm: 8 },
    contrastPairs: BLACK_ON_SURFACE,
    // Drei Nebelstriche von x = 2 bis 30 mm im Abstand von 4 mm.
    primitives: [weatherLine(2, 12, 30, 12), weatherLine(2, 16, 30, 16), weatherLine(2, 20, 30, 20)],
  }),
  defineState({
    section: '5.8.7.5',
    id: 'weather-rainy',
    title: 'Regnerisch',
    referenceAsset: '5.8.7.5_Regnerisch.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: BLACK_ON_SURFACE,
    primitives: rainPrimitives(),
  }),
  defineState({
    section: '5.8.7.6',
    id: 'weather-hailing',
    title: 'Hagelnd',
    referenceAsset: '5.8.7.6_Hagelnd.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: BLACK_ON_SURFACE,
    primitives: hailPrimitives(),
  }),
  defineState({
    section: '5.8.7.7',
    id: 'weather-thunderstorm',
    title: 'Gewittrig',
    referenceAsset: '5.8.7.7_Gewittrig.svg',
    box: { xMm: 3.45, yMm: 7.5, widthMm: 25.1, heightMm: 18 },
    contrastPairs: BLACK_ON_SURFACE,
    primitives: [...lightning(0), ...lightning(9.5), ...lightning(19.5)],
  }),
  defineState({
    section: '5.8.7.8',
    id: 'weather-snowing',
    title: 'Schneiend',
    referenceAsset: '5.8.7.8_Schneiend.svg',
    box: { xMm: 3.536, yMm: 12, widthMm: 24.928, heightMm: 8 },
    contrastPairs: BLACK_ON_SURFACE,
    // Drei Flocken im Abstand von 9 mm auf der Mittellinie y = 16 mm.
    primitives: [...snowflake(7), ...snowflake(16), ...snowflake(25)],
  }),
  defineState({
    section: '5.8.7.9',
    id: 'weather-temperature',
    title: 'Temperatur',
    referenceAsset: '5.8.7.9_Temperatur.svg',
    box: { xMm: 7, yMm: 3, widthMm: 19, heightMm: 26 },
    contrastPairs: BLACK_ON_WHITE_AND_SURFACE,
    primitives: [
      weatherPath(thermometerPath(), WEATHER_WHITE),
      ...[5, 9, 13, 17].map((y) => weatherLine(18, y, 26, y)),
    ],
  }),
  defineState({
    section: '5.8.7.10',
    id: 'weather-windy',
    title: 'Windig',
    referenceAsset: '5.8.7.10_Windig.svg',
    box: { xMm: 1, yMm: 12, widthMm: 29, heightMm: 8 },
    contrastPairs: BLACK_ON_SURFACE,
    // Windpfeil y = 16 mm mit Spitze (30 | 16) und Kopfarmen nach (26 | 12) und (26 | 20). Vier
    // Fiederstriche im Abstand von 4,5 mm steigen im Verhältnis 3 : 4 von y = 12 zum Schaft ab;
    // der erste bildet mit dem Schaft einen durchgehenden Linienzug.
    primitives: [
      weatherPolyline([[1, 12], [4, 16], [30, 16]]),
      weatherPolyline([[26, 12], [30, 16], [26, 20]]),
      weatherLine(5.5, 12, 8.5, 16),
      weatherLine(10, 12, 13, 16),
      weatherLine(14.5, 12, 17.5, 16),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
