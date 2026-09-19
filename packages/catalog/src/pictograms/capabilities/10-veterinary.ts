import { DEFAULT_STROKE_WIDTH_MM, type Point, type Primitive, type Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineCapability } from '../catalog-definition.js';

const STROKE: Style = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

function polyline(points: readonly Point[], closed = false): Primitive {
  return { type: 'polyline', role: 'pictogram', points, ...(closed ? { closed } : {}), style: STROKE };
}

function strokePath(d: string): Primitive {
  return { type: 'path', role: 'pictogram', d, style: STROKE };
}

const fmt = (value: number): string => String(Math.round(value * 1000) / 1000);

/**
 * Kreisbogen als absolute Kubiken (das Kommando-Gate lässt kein `A` zu), ab dem aktuellen
 * Punkt, der auf dem Bogenanfang liegen muss. Winkel in Grad in SVG-Richtung (y nach unten,
 * steigender Winkel = im Uhrzeigersinn); Teilbögen von höchstens 90° mit dem Standardhebel
 * 4/3 · tan(θ/4).
 */
function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const steps = Math.max(1, Math.ceil(Math.abs(toDeg - fromDeg) / 90));
  const step = ((toDeg - fromDeg) / steps) * (Math.PI / 180);
  const k = (4 / 3) * Math.tan(step / 4);
  let a = fromDeg * (Math.PI / 180);
  let d = '';
  for (let i = 0; i < steps; i++) {
    const b = a + step;
    d +=
      ` C ${fmt(cx + r * (Math.cos(a) - k * Math.sin(a)))} ${fmt(cy + r * (Math.sin(a) + k * Math.cos(a)))}` +
      ` ${fmt(cx + r * (Math.cos(b) + k * Math.sin(b)))} ${fmt(cy + r * (Math.sin(b) - k * Math.cos(b)))}` +
      ` ${fmt(cx + r * Math.cos(b))} ${fmt(cy + r * Math.sin(b))}`;
    a = b;
  }
  return d;
}

/**
 * Geschlossene, leicht eckige Ellipse aus vier Viertelbögen. Hebel 0,64 statt des Kreiswerts
 * 0,5523: an der Referenz abgelesen, der Rüssel ist dort voller als eine echte Ellipse.
 */
function ellipse(cx: number, cy: number, rx: number, ry: number): string {
  const k = 0.64;
  const [kx, ky] = [rx * k, ry * k];
  const p = (dx: number, dy: number): string => `${fmt(cx + dx)} ${fmt(cy + dy)}`;
  return (
    `M ${p(-rx, 0)} C ${p(-rx, -ky)} ${p(-kx, -ry)} ${p(0, -ry)}` +
    ` C ${p(kx, -ry)} ${p(rx, -ky)} ${p(rx, 0)}` +
    ` C ${p(rx, ky)} ${p(kx, ry)} ${p(0, ry)}` +
    ` C ${p(-kx, ry)} ${p(-rx, ky)} ${p(-rx, 0)} Z`
  );
}

/**
 * Äußerer Schnittpunkt zweier gleich großer Nachbarkreise einer Wolke: der vom Wolkenmittelpunkt
 * weiter entfernte der beiden Schnittpunkte.
 */
function outerIntersection(a: Point, b: Point, centers: readonly Point[], r: number): Point {
  const n = centers.length;
  const [mx, my] = centers.reduce(([sx, sy], [x, y]) => [sx + x / n, sy + y / n], [0, 0]);
  const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
  const dist = Math.hypot(dx, dy);
  const h = Math.sqrt(r * r - (dist / 2) ** 2);
  const [px, py] = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const first: Point = [px - (dy / dist) * h, py + (dx / dist) * h];
  const second: Point = [px + (dy / dist) * h, py - (dx / dist) * h];
  const away = ([x, y]: Point): number => Math.hypot(x - mx, y - my);
  return away(first) > away(second) ? first : second;
}

/** Winkel eines Punkts vom Kreismittelpunkt aus, in Grad in SVG-Richtung. */
function angleTo([cx, cy]: Point, [x, y]: Point): number {
  return (Math.atan2(y - cy, x - cx) * 180) / Math.PI;
}

/**
 * Äußere Umrisslinie einer Wolke aus gleich großen Kreisen, im Uhrzeigersinn aufgezählt:
 * je Kreis der Bogen zwischen den äußeren Schnittpunkten mit Vorgänger und Nachfolger.
 */
function cloudOutline(centers: readonly Point[], r: number): string {
  const n = centers.length;
  let d = '';
  centers.forEach((center, i) => {
    const start = outerIntersection(centers[(i + n - 1) % n]!, center, centers, r);
    const end = outerIntersection(center, centers[(i + 1) % n]!, centers, r);
    const from = angleTo(center, start);
    let to = angleTo(center, end);
    while (to <= from) to += 360;
    if (i === 0) d += `M ${fmt(start[0])} ${fmt(start[1])}`;
    d += arc(center[0], center[1], r, from, to);
  });
  return `${d} Z`;
}

/** Offener Bogen auf einem Kreis als eigener Unterpfad, Winkel in Grad in SVG-Richtung. */
function curl([cx, cy]: Point, r: number, fromDeg: number, toDeg: number): string {
  const a = fromDeg * (Math.PI / 180);
  return `M ${fmt(cx + r * Math.cos(a))} ${fmt(cy + r * Math.sin(a))}${arc(cx, cy, r, fromDeg, toDeg)}`;
}

/**
 * Das V des Veterinärwesens für die Tierzeichen 4.10.3–4.10.7: 4 mm lange Schultern bei y 5
 * (x 5–9 und 27–31), Spitze bei (18, 27,1).
 */
const SMALL_V = polyline([[5, 5], [9, 5], [18, 27.1], [27, 5], [31, 5]]);

/** Gemeinsame Box der Tierzeichen: V plus Tierfigur unten links. */
const ANIMAL_BOX = { xMm: 0.75, yMm: 5, widthMm: 30.25, heightMm: 23.5 } as const;

/** Schafwolle: acht Kreise mit Radius 2 mm im Uhrzeigersinn, oben beginnend. */
const SHEEP_CENTERS: readonly Point[] = [
  [4, 20], [7, 20], [10, 20], [11, 23], [10, 26], [7, 26], [4, 26], [3, 23],
];
const [WOOL_TOP_LEFT, , , WOOL_RIGHT, WOOL_BOTTOM_RIGHT, WOOL_BOTTOM, WOOL_BOTTOM_LEFT, WOOL_LEFT] =
  SHEEP_CENTERS as [Point, Point, Point, Point, Point, Point, Point, Point];
const WOOL_R = 2;
/** Winkel, unter dem die Umrisslinie den Kreis `on` am Nachbarn `other` verlässt. */
const woolJoint = (on: Point, other: Point): number =>
  angleTo(on, outerIntersection(on, other, SHEEP_CENTERS, WOOL_R));

/**
 * Piktogramme des Kapitels 4.10. Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert; alle Striche 0,5 mm.
 */
export const VETERINARY_CAPABILITIES = deepFreeze([
  defineCapability({
    section: '4.10.1',
    id: 'veterinary',
    title: 'Veterinärwesen',
    referenceAsset: '4.10.1_Veterinärwesen.svg',
    box: { xMm: 2, yMm: 4, widthMm: 28, heightMm: 25.1 },
    // Großes V: Schultern bei y 4 (x 2–6 und 26–30), Spitze bei (16, 29,1).
    primitives: [polyline([[2, 4], [6, 4], [16, 29.1], [26, 4], [30, 4]])],
  }),
  defineCapability({
    section: '4.10.2',
    id: 'slaughter-culling',
    title: 'Schlachten / Keulen',
    referenceAsset: '4.10.2_Schlachten_Keulen.svg',
    box: { xMm: 1, yMm: 14, widthMm: 30, heightMm: 6 },
    // Waagerechte über die volle Breite bei y 14, daran hängend ein offenes Dreieck mit Spitze
    // (8, 14) und Grundseite y 20 von x 3 bis 13.
    primitives: [line(1, 14, 31, 14), polyline([[8, 14], [13, 20], [3, 20]], true)],
  }),
  defineCapability({
    section: '4.10.3',
    id: 'chicken',
    title: 'Huhn',
    referenceAsset: '4.10.3_Huhn.svg',
    box: ANIMAL_BOX,
    // Hühnerkamm als Zickzack mit drei Zacken (Spitzen x 6, 8, 10), links Schnabel (2, 22),
    // rechts in einem Bogen zum Fuß bei (12, 27), links Hals nach (4, 27).
    primitives: [
      SMALL_V,
      strokePath(
        'M 12 27 C 12 25.1 11.65 23.2 11 21.5 L 10 18.9 L 9 21.05 L 8 17.95 L 7 20.05 ' +
          'L 6 17 L 4 21 L 2 22 L 4 23 L 4 27',
      ),
    ],
  }),
  defineCapability({
    section: '4.10.4',
    id: 'horse',
    title: 'Pferd',
    referenceAsset: '4.10.4_Pferd.svg',
    box: ANIMAL_BOX,
    // Hufeisen: Bogen x 2,5–10,5 mit Scheitel (6,5, 19), Schenkel bis y 27, dort je ein
    // 2,25 mm langer Stollen nach außen.
    primitives: [
      SMALL_V,
      strokePath(
        'M 4.1 27 C 3.05 25.5 2.5 23.95 2.5 22.5 C 2.5 20.35 4.05 19 6.5 19 ' +
          'C 8.95 19 10.5 20.35 10.5 22.5 C 10.5 23.95 9.95 25.5 8.9 27',
      ),
      line(2, 27, 4.25, 27),
      line(8.75, 27, 11, 27),
    ],
  }),
  defineCapability({
    section: '4.10.5',
    id: 'cattle',
    title: 'Rind',
    referenceAsset: '4.10.5_Rind.svg',
    box: ANIMAL_BOX,
    // Rinderkopf: zwei nach oben geschwungene Hörner (Spitzen (1, 19) und (12, 19)), dazwischen
    // ein symmetrisches Zickzack um x 6,5.
    primitives: [
      SMALL_V,
      strokePath(
        'M 1 19 C 1.2 20.15 1.6 20.8 2.3 21.25 L 3 25.2 L 4.4 21.8 L 5.4 26.2 L 6.5 22.3 ' +
          'L 7.6 26.2 L 8.6 21.8 L 10 25.2 L 10.7 21.25 C 11.4 20.8 11.8 20.15 12 19',
      ),
    ],
  }),
  defineCapability({
    section: '4.10.6',
    id: 'sheep',
    title: 'Schaf',
    referenceAsset: '4.10.6_Schaf.svg',
    box: ANIMAL_BOX,
    // Wollwolke aus acht Kreisen (Radius 2 mm) und drei Locken: Innenbögen, die an der
    // Umrisslinie ansetzen und frei im Inneren enden — oben links von der linken Kreisfuge bis
    // 45°, unten rechts von der rechten Kreisfuge bis 225°, unten vom linken Kreispunkt bis zur
    // Fuge mit dem Nachbarkreis.
    primitives: [
      SMALL_V,
      strokePath(
        `${cloudOutline(SHEEP_CENTERS, WOOL_R)} ` +
          `${curl(WOOL_TOP_LEFT, WOOL_R, 45, woolJoint(WOOL_TOP_LEFT, WOOL_LEFT))} ` +
          `${curl(WOOL_BOTTOM_RIGHT, WOOL_R, 225, 360 + woolJoint(WOOL_BOTTOM_RIGHT, WOOL_RIGHT))} ` +
          `${curl(WOOL_BOTTOM, WOOL_R, woolJoint(WOOL_BOTTOM, WOOL_BOTTOM_LEFT), 180)}`,
      ),
    ],
  }),
  defineCapability({
    section: '4.10.7',
    id: 'pig',
    title: 'Schwein',
    referenceAsset: '4.10.7_Schwein.svg',
    box: ANIMAL_BOX,
    // Schweinerüssel: Ellipse 12 × 8 mm um (7, 22) mit zwei Nasenlöchern (Radius 1,5 mm) bei
    // x 4,75 und 9,25.
    primitives: [
      SMALL_V,
      strokePath(ellipse(7, 22, 6, 4)),
      { type: 'circle', role: 'pictogram', cx: 4.75, cy: 22, r: 1.5, style: STROKE },
      { type: 'circle', role: 'pictogram', cx: 9.25, cy: 22, r: 1.5, style: STROKE },
    ],
  }),
] as const);
