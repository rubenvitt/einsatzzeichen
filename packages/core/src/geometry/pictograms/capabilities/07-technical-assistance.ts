import { DEFAULT_STROKE_WIDTH_MM, type Point, type Primitive, type Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineCapability } from '../catalog-definition.js';

/*
 * Piktogramme des Kapitels 4.7. Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert. Striche 0,5 mm (4.7.18: 0,4 mm wie in der Referenz), Flächen gefüllt ohne Strich.
 * Koordinaten in mm im 32 × 32-mm-Feld; Winkel in Grad in SVG-Richtung (y nach unten, steigender
 * Winkel = im Uhrzeigersinn).
 */

const STROKE: Style = { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM };
const THIN: Style = { fill: 'none', stroke: 'schwarz', strokeWidth: 0.4 };
const SOLID: Style = { fill: 'schwarz', stroke: 'none' };

const fmt = (value: number): string => String(Math.round(value * 1000) / 1000);
const pt = ([x, y]: Point): string => `${fmt(x)} ${fmt(y)}`;
const rad = (deg: number): number => (deg * Math.PI) / 180;

function line(x1: number, y1: number, x2: number, y2: number, style: Style = STROKE): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style };
}

function polyline(points: readonly Point[], closed = false, style: Style = STROKE): Primitive {
  return { type: 'polyline', role: 'pictogram', points, ...(closed ? { closed } : {}), style };
}

function path(d: string, style: Style = STROKE): Primitive {
  return { type: 'path', role: 'pictogram', d, style };
}

function circle(cx: number, cy: number, r: number, style: Style = STROKE): Primitive {
  return { type: 'circle', role: 'pictogram', cx, cy, r, style };
}

function rect(
  x: number, y: number, width: number, height: number, style: Style = STROKE, rx?: number,
): Primitive {
  return { type: 'rect', role: 'pictogram', x, y, width, height, ...(rx === undefined ? {} : { rx }), style };
}

/** Punkt auf dem Kreis um (cx, cy) mit Radius r unter dem Winkel deg. */
function onCircle(cx: number, cy: number, r: number, deg: number): Point {
  return [cx + r * Math.cos(rad(deg)), cy + r * Math.sin(rad(deg))];
}

/**
 * Kreisbogen als absolute Kubiken (das Kommando-Gate lässt kein `A` zu), ab dem aktuellen Punkt,
 * der auf dem Bogenanfang liegen muss. Teilbögen von höchstens 90° mit dem Hebel 4/3 · tan(θ/4).
 */
function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const steps = Math.max(1, Math.ceil(Math.abs(toDeg - fromDeg) / 90 - 1e-9));
  const step = (toDeg - fromDeg) / steps;
  const k = (4 / 3) * Math.tan(rad(step) / 4) * r;
  let d = '';
  for (let i = 0; i < steps; i += 1) {
    const a0 = rad(fromDeg + i * step);
    const a1 = rad(fromDeg + (i + 1) * step);
    const [x0, y0] = onCircle(cx, cy, r, fromDeg + i * step);
    const [x1, y1] = onCircle(cx, cy, r, fromDeg + (i + 1) * step);
    const c1: Point = [x0 - k * Math.sin(a0), y0 + k * Math.cos(a0)];
    const c2: Point = [x1 + k * Math.sin(a1), y1 - k * Math.cos(a1)];
    d += ` C ${pt(c1)} ${pt(c2)} ${pt([x1, y1])}`;
  }
  return d;
}

/**
 * Welle durch Scheitelpunkte mit waagerechter Tangente: je Halbwelle eine Kubik, deren Hebel
 * `lever` × Halbwellenbreite lang sind (0,5 trifft Wendepunkt und Wendesteigung der Referenz).
 */
function wave(points: readonly Point[], lever = 0.5): string {
  let d = `M ${pt(points[0]!)}`;
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1]!;
    const [x1, y1] = points[i]!;
    const h = (x1 - x0) * lever;
    d += ` C ${pt([x0 + h, y0])} ${pt([x1 - h, y1])} ${pt([x1, y1])}`;
  }
  return d;
}

/** Offene Pfeilspitze: zwei Schenkel unter ±45° zur Richtung dirDeg, je `back` mm zurück. */
function arrowHead(tip: Point, dirDeg: number, back = 2): Primitive {
  const [ux, uy] = [Math.cos(rad(dirDeg)), Math.sin(rad(dirDeg))];
  const [tx, ty] = tip;
  return polyline([
    [tx - back * ux + back * uy, ty - back * uy - back * ux],
    tip,
    [tx - back * ux - back * uy, ty - back * uy + back * ux],
  ]);
}

/** Dreht einen Punkt um (cx, cy). */
function rotate([x, y]: Point, deg: number, cx = 16, cy = 16): Point {
  const [c, s] = [Math.cos(rad(deg)), Math.sin(rad(deg))];
  return [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c];
}

/**
 * Welle von 4.7.26 und 4.7.27: Scheitel bei y 9, Tal bei y 13; beide Enden setzen auf Talhöhe
 * (x 5 und 27) schräg an und laufen in die Scheitel.
 */
const RIVER_WAVE = path(
  `M 5 13 C 6.3 12.35 7.5 9 10 9${wave([[10, 9], [16, 13], [22, 9]]).slice('M 10 9'.length)}` +
    ' C 24.5 9 25.7 12.35 27 13',
);

/** Luftströme von 4.7.5: Bogenende bei r 8 mm unter 60° bzw. 300°, dann 5,9 mm Gerade unter ∓30°. */
const BEND_UP = onCircle(16.88, 6, 8, 60);
const BEND_DOWN = onCircle(16.88, 26, 8, 300);
const OUT_UP: Point = [BEND_UP[0] + 5.9 * Math.cos(rad(30)), BEND_UP[1] - 5.9 * Math.sin(rad(30))];
const OUT_DOWN: Point = [BEND_DOWN[0] + 5.9 * Math.cos(rad(30)), BEND_DOWN[1] + 5.9 * Math.sin(rad(30))];

/** Pfeilspitze nach oben bei (16, 2) von 4.7.10 und Alternative, Schenkel 4,1 mm zurück. */
const LIFT_ARROW = arrowHead([16, 2], -90, 4.1);

/** Schlauchabgang der Pumpe (4.7.14), unten: 2 mm radial, dann Bogen nach links, dann gerade. */
const HOSE: readonly Point[] = [[16, 24], [16, 26], [16, 27.1], [15.32, 28.22], [14.5, 28.5], [13, 29]];

function hose(deg: number): Primitive {
  const [p0, p1, c1, c2, p2, p3] = HOSE.map((p) => rotate(p, deg));
  return path(`M ${pt(p0!)} L ${pt(p1!)} C ${pt(c1!)} ${pt(c2!)} ${pt(p2!)} L ${pt(p3!)}`);
}

/** Löffelmittelpunkt des Baggers (4.7.2): 4 mm vom Gelenk (21, 8) unter 23,9°. */
const BUCKET = onCircle(21, 8, 4, 23.9);
/** Spatenblatt (4.7.7): Kreis r 3,375 um einen Punkt 4,2 mm hinter dem Blatthals auf der Stielachse. */
const SPADE_CENTER: Point = [23.8, 7.2];
const SPADE_R = 3.375;

export const TECHNICAL_ASSISTANCE_CAPABILITIES = deepFreeze([
  defineCapability({
    section: '4.7.1',
    id: 'water-hazard-control',
    title: 'Abwehr von Wassergefahren',
    referenceAsset: '4.7.1_Abwehr von Wassergefahren.svg',
    box: { xMm: 2, yMm: 6, widthMm: 29, heightMm: 20 },
    // Deich als Linienzug im 1-mm-Raster; zwei Wellen (Halbwellen 3,5 mm, Höhe 2 mm) von x 2 bis 16.
    primitives: [
      polyline([[2, 26], [13, 26], [20, 6], [26, 6], [28, 13], [31, 13]]),
      path(wave([[2, 13], [5.5, 11], [9, 13], [12.5, 11], [16, 13]])),
      path(wave([[2, 10], [5.5, 8], [9, 10], [12.5, 8], [16, 10]])),
    ],
  }),
  defineCapability({
    section: '4.7.2',
    id: 'excavation',
    title: 'Baggerarbeiten',
    referenceAsset: '4.7.2_Baggerarbeiten.svg',
    box: { xMm: 2, yMm: 4, widthMm: 27.21, heightMm: 22 },
    // Ausleger (2, 26) → (13, 4), rechtwinklig abknickender Stiel bis zum Gelenk (21, 8), daran der
    // Löffel als Halbkreis mit Radius 4 mm über die Oberseite.
    primitives: [
      path(`M 2 26 L 13 4 L 21 8${arc(BUCKET[0], BUCKET[1], 4, 203.9, 383.9)}`),
    ],
  }),
  defineCapability({
    section: '4.7.3',
    id: 'lighting',
    title: 'Beleuchten',
    referenceAsset: '4.7.3_Beleuchten.svg',
    box: { xMm: 10, yMm: 3, widthMm: 14, heightMm: 27 },
    // Mast x 10 von y 30 bis 8, Halbkreisbogen r 5 um (15, 8), Leuchte als Kreis r 4 um (20, 12).
    primitives: [
      path(`M 10 30 V 8${arc(15, 8, 5, 180, 360)}`),
      circle(20, 12, 4),
    ],
  }),
  defineCapability({
    section: '4.7.4',
    id: 'ventilation',
    title: 'Belüften',
    referenceAsset: '4.7.4_Belüften.svg',
    box: { xMm: 6, yMm: 2, widthMm: 20, heightMm: 28 },
    // Wand x 16 mit Öffnung zwischen y 11 und 21; zwei Luftströme laufen unter 30° zur Mitte
    // (Bogen r 8 mm) und waagerecht bei y 13 bzw. 19 nach rechts in Pfeilspitzen bei x 26.
    primitives: [
      line(16, 2, 16, 11),
      line(16, 21, 16, 30),
      path(`M 6 9 L ${pt(onCircle(15.1, 5, 8, 120))}${arc(15.1, 5, 8, 120, 90)} H 26`),
      path(`M 6 23 L ${pt(onCircle(15.1, 27, 8, 240))}${arc(15.1, 27, 8, 240, 270)} H 26`),
      arrowHead([26, 13], 0),
      arrowHead([26, 19], 0),
    ],
  }),
  defineCapability({
    section: '4.7.5',
    id: 'air-extraction',
    title: 'Entlüften',
    referenceAsset: '4.7.5_Entlüften.svg',
    box: { xMm: 6, yMm: 2, widthMm: 20.02, heightMm: 28 },
    // Wand x 16 mit Öffnung zwischen y 12 und 20; zwei Luftströme bei y 14 bzw. 18 laufen
    // waagerecht durch und biegen hinter der Wand (Bogen r 8 mm) unter 30° auseinander; die
    // Pfeilspitzen sind in der Referenz um 32° geneigt.
    primitives: [
      line(16, 2, 16, 12),
      line(16, 20, 16, 30),
      path(`M 6 14 H 16.88${arc(16.88, 6, 8, 90, 60)} L ${pt(OUT_UP)}`),
      path(`M 6 18 H 16.88${arc(16.88, 26, 8, 270, 300)} L ${pt(OUT_DOWN)}`),
      arrowHead(OUT_UP, -32),
      arrowHead(OUT_DOWN, 32),
    ],
  }),
  defineCapability({
    section: '4.7.6',
    id: 'explosive-ordnance-clearance',
    title: 'Kampfmittelräumung',
    referenceAsset: '4.7.6_Kampfmittelräumung.svg',
    box: { xMm: 4, yMm: 5, widthMm: 24, heightMm: 22 },
    // Ring r 11 mm und gefüllte Scheibe r 7 mm um (16, 16); zwei Zünderstäbe unter 45° von den
    // oberen Ecken auf (16, 17) zu, bis an den Ring.
    primitives: [
      circle(16, 16, 11),
      circle(16, 16, 7, SOLID),
      line(4, 5, 7.74, 8.74),
      line(28, 5, 24.26, 8.74),
    ],
  }),
  defineCapability({
    section: '4.7.7',
    id: 'hand-tools',
    title: 'Einsatz von Handwerkzeugen',
    referenceAsset: '4.7.7_Einsatz von Handwerkzeugen.svg',
    box: { xMm: 1.6, yMm: 3.49, widthMm: 25.91, heightMm: 22.51 },
    // Gekreuzte Axt und Spaten, Stiele unter 45° mit Kreuzung bei (16, 15).
    // Axt: Stiel (27, 26) → (5.9, 4.9), Nacken (8, 7) → (10, 5), gefülltes Blatt als Dreieck.
    // Spaten: Stiel (5, 26) → Blatthals (20.83, 10.17); Blatt gefüllt, Hals 7,6 mm breit, oben
    // Kreis r 3,375 mm, Flanken tangential.
    primitives: [
      line(27, 26, 5.9, 4.9),
      line(8, 7, 10, 5),
      polyline([[1.6, 7], [8, 7], [8, 13.4]], true, SOLID),
      line(5, 26, 20.83, 10.17),
      path(
        `M 18.13 7.48 L ${pt(onCircle(...SPADE_CENTER, SPADE_R, 230.5))}` +
          `${arc(...SPADE_CENTER, SPADE_R, 230.5, 399.5)} L 23.52 12.87 Z`,
        SOLID,
      ),
    ],
  }),
  defineCapability({
    section: '4.7.8',
    id: 'forklift-lifting',
    title: 'Hebearbeit mit Gabelstapler',
    referenceAsset: '4.7.8_Hebearbeit mit Gabelstapler.svg',
    box: { xMm: 9, yMm: 2, widthMm: 16, heightMm: 28 },
    // Hubmast x 9 von y 2 bis 30, Gabel als Winkel x 11 von y 2 bis 16 und y 16 bis x 25.
    primitives: [
      line(9, 2, 9, 30),
      polyline([[11, 2], [11, 16], [25, 16]]),
    ],
  }),
  defineCapability({
    section: '4.7.9',
    id: 'crane-lifting',
    title: 'Hebearbeit mit Kran',
    referenceAsset: '4.7.9_Hebearbeit mit Kran.svg',
    box: { xMm: 6, yMm: 2, widthMm: 20, heightMm: 28 },
    // Turm x 6 von y 30 bis 2, Ausleger y 2 bis x 18, Haken als Halbkreis r 4 mm um (22, 2).
    primitives: [path(`M 6 30 V 2 H 18${arc(22, 2, 4, 180, 0)}`)],
  }),
  defineCapability({
    section: '4.7.10',
    id: 'lifting-loads-persons',
    title: 'Heben von Lasten oder Personen',
    referenceAsset: '4.7.10_Heben von Lasten oder Personen.svg',
    box: { xMm: 8, yMm: 2, widthMm: 16, heightMm: 28 },
    // Raute mit halber Diagonale 8 mm um (16, 22); Pfeil nach oben von y 14 bis 2.
    primitives: [
      polyline([[16, 14], [24, 22], [16, 30], [8, 22]], true),
      line(16, 14, 16, 2),
      LIFT_ARROW,
    ],
  }),
  defineCapability({
    section: '4.7.10',
    id: 'lifting-loads-persons',
    variant: 'alternative',
    title: 'Heben von Lasten oder Personen',
    referenceAsset: '4.7.10_Heben von Lasten oder Personen_Alternative.svg',
    box: { xMm: 10, yMm: 2, widthMm: 12, heightMm: 27 },
    // Quadrat 12 × 12 mm ab (10, 17); Pfeil nach oben von y 17 bis 2.
    primitives: [
      rect(10, 17, 12, 12),
      line(16, 17, 16, 2),
      LIFT_ARROW,
    ],
  }),
  defineCapability({
    section: '4.7.11',
    id: 'lifting-clearing',
    title: 'Heben / Räumen',
    referenceAsset: '4.7.11_Heben-Räumen.svg',
    box: { xMm: 3, yMm: 2, widthMm: 28, heightMm: 27 },
    // Schräge (3, 29) → (20, 9) an den Mast x 20 (y 2 bis 13), Ausleger y 13 bis x 31.
    primitives: [
      line(3, 29, 20, 9),
      polyline([[20, 2], [20, 13], [31, 13]]),
    ],
  }),
  defineCapability({
    section: '4.7.12',
    id: 'remote-manipulation',
    title: 'Fernmanipulieren',
    referenceAsset: '4.7.12_Fernmanipulieren.svg',
    box: { xMm: 1, yMm: 8, widthMm: 29, heightMm: 16 },
    // Arm y 16 von x 1 bis 17, Greifer als rechtwinklige Zange mit Spitze (17, 16) und Backen
    // nach (30, 13) bzw. (30, 19).
    primitives: [
      line(1, 16, 17, 16),
      polyline([[30, 13], [25, 8], [17, 16], [25, 24], [30, 19]]),
    ],
  }),
  defineCapability({
    section: '4.7.13',
    id: 'chainsaw',
    title: 'Motorsägearbeiten',
    referenceAsset: '4.7.13_Motorsägearbeiten.svg',
    box: { xMm: 1, yMm: 11, widthMm: 30, heightMm: 10 },
    // Motorgehäuse 11 × 10 mm ab (3, 11) mit Eckradius 1,5 mm; Griff links 2 × 6 mm mit runden
    // Ecken; Schwert von x 14 bis zum Halbkreis r 4 mm um (27, 17), Unterkante fluchtet mit y 21.
    primitives: [
      rect(3, 11, 11, 10, STROKE, 1.5),
      path(`M 3 13 H 2.5${arc(2.5, 14.5, 1.5, 270, 180)} V 17.5${arc(2.5, 17.5, 1.5, 180, 90)} H 3`),
      path(`M 14 13 H 27${arc(27, 17, 4, 270, 450)} H 12.5`),
    ],
  }),
  defineCapability({
    section: '4.7.14',
    id: 'pumping',
    title: 'Pumpen',
    referenceAsset: '4.7.14_Pumpen.svg',
    box: { xMm: 2.705, yMm: 3.715, widthMm: 24.985, heightMm: 25.285 },
    // Pumpenrad als Kreis r 8 mm um (16, 16), fünf gleich gebogene Schlauchabgänge im 72°-Raster.
    primitives: [
      circle(16, 16, 8),
      ...[0, 72, 144, 216, 288].map(hose),
    ],
  }),
  defineCapability({
    section: '4.7.15',
    id: 'mechanized-clearing',
    title: 'Räumarbeiten mit Maschine',
    referenceAsset: '4.7.15_Räumarbeiten mit Maschine.svg',
    box: { xMm: 3, yMm: 10, widthMm: 26, heightMm: 12 },
    // Schubarm y 16 von x 3 bis 22, Schild x 22 von y 10 bis 21 mit Schneide nach (29, 22).
    primitives: [
      line(3, 16, 22, 16),
      polyline([[22, 10], [22, 21], [29, 22]]),
    ],
  }),
  defineCapability({
    section: '4.7.16',
    id: 'safety',
    title: 'Sicherheit',
    referenceAsset: '4.7.16_Sicherheit.svg',
    box: { xMm: 5, yMm: 3, widthMm: 22, heightMm: 26 },
    // Schild: Spitze (16, 3), Schultern (5, 5) und (27, 5), senkrechte Flanken bis y 19,44,
    // Bögen r 6 mm über 61,4° und Geraden zur Spitze unten (16, 29).
    primitives: [
      path(
        `M 16 3 L 5 5 V 19.44${arc(11, 19.44, 6, 180, 118.6)} L 16 29` +
          ` L ${pt(onCircle(21, 19.44, 6, 61.4))}${arc(21, 19.44, 6, 61.4, 0)} V 5 Z`,
      ),
    ],
  }),
  defineCapability({
    section: '4.7.17',
    id: 'blasting',
    title: 'Sprengen',
    referenceAsset: '4.7.17_Sprengen.svg',
    box: { xMm: 9.95, yMm: 4, widthMm: 12.1, heightMm: 24 },
    // Sprengladung als gefüllte Fläche: Oberkante y 4 von x 9,95 bis 22,05, gerade Flanken bis
    // y 17 (halbe Breite 5 mm), dann tangential in eine runde Spitze bei (16, 28).
    primitives: [
      path('M 9.95 4 H 22.05 L 21 17 C 20.4 24.6 19 28 16 28 C 13 28 11.6 24.6 11 17 Z', SOLID),
    ],
  }),
  defineCapability({
    section: '4.7.18',
    id: 'technical-assistance',
    title: 'Technische Hilfeleistung',
    referenceAsset: '4.7.18_Technische Hilfeleistung.svg',
    box: { xMm: 1, yMm: 12, widthMm: 29, heightMm: 8 },
    // Striche 0,4 mm. Gerät 14 × 8 mm ab (9, 12); links zwei Wellen (Scheitel bei x 1, 4,08 und
    // 7,44), die in das Gerät laufen; rechts zwei Strahlen nach (30, 12) und (30, 20).
    primitives: [
      rect(9, 12, 14, 8, THIN),
      path(`${wave([[1, 14], [4.08, 16], [7.44, 14]], 0.38)} C 8.1 14 8.6 14.5 9 15.3`, THIN),
      path(`${wave([[1, 16], [4.08, 18], [7.44, 16]], 0.38)} C 8.1 16 8.6 16.5 9 17.3`, THIN),
      line(23, 15, 30, 12, THIN),
      line(23, 17, 30, 20, THIN),
    ],
  }),
  defineCapability({
    section: '4.7.19',
    id: 'transport',
    title: 'Transportieren',
    referenceAsset: '4.7.19_Transportieren.svg',
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 28 },
    // Rad: Kreis r 14 mm um (16, 16) mit vier Durchmessern im 45°-Raster.
    primitives: [
      circle(16, 16, 14),
      ...[0, 45, 90, 135].map((deg) => {
        const [x1, y1] = onCircle(16, 16, 14, deg);
        const [x2, y2] = onCircle(16, 16, 14, deg + 180);
        return line(
          Math.round(x1 * 1000) / 1000, Math.round(y1 * 1000) / 1000,
          Math.round(x2 * 1000) / 1000, Math.round(y2 * 1000) / 1000,
        );
      }),
    ],
  }),
  defineCapability({
    section: '4.7.20',
    id: 'door-opening',
    title: 'Türöffnung',
    referenceAsset: '4.7.20_Türöffnung.svg',
    box: { xMm: 8, yMm: 2, widthMm: 16, heightMm: 28 },
    // Zarge (8, 2) → (24, 2) → (24, 26); aufgeschwenktes Türblatt als Parallelogramm
    // (8, 2), (21, 6), (21, 30), (8, 26).
    primitives: [
      polyline([[8, 2], [24, 2], [24, 26]]),
      polyline([[8, 2], [21, 6], [21, 30], [8, 26]], true),
    ],
  }),
  defineCapability({
    section: '4.7.21',
    id: 'overcoming-height-differences',
    title: 'Höhenunterschiede überwinden',
    referenceAsset: '4.7.21_Höhenunterschiede überwinden.svg',
    box: { xMm: 1, yMm: 6, widthMm: 30, heightMm: 20 },
    // Stufe: unten y 26 von x 1 bis 16, senkrecht x 16, oben y 6 bis x 31; an beiden Knicken
    // Pfeilspitzen (Schenkel 4 mm unter 45°) nach unten bzw. oben.
    primitives: [
      polyline([[1, 26], [16, 26], [16, 6], [31, 6]]),
      polyline([[12, 22], [16, 26], [20, 22]]),
      polyline([[12, 10], [16, 6], [20, 10]]),
    ],
  }),
  defineCapability({
    section: '4.7.22',
    id: 'securing',
    title: 'Absicherung',
    referenceAsset: '4.7.22_Absicherung.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    // Leitkegel: Grundlinie y 28 von x 4 bis 28, Flanken (6.83, 28) → (14, 4) symmetrisch zu
    // x 16, oben abgerundet; zwei Ringe mit Steigung 1 : 3.
    primitives: [
      line(4, 28, 28, 28),
      path('M 6.83 28 L 13.79 4.72 Q 14 4 14.74 4 H 17.26 Q 18 4 18.21 4.72 L 25.17 28'),
      line(10.75, 15, 20.35, 11.8),
      line(7.75, 25, 22.75, 20),
    ],
  }),
  defineCapability({
    section: '4.7.23',
    id: 'optical-warning',
    title: 'Warnen mit optischen Anzeigen',
    referenceAsset: '4.7.23_Warnen mit optischen Anzeigen.svg',
    box: { xMm: 2, yMm: 6, widthMm: 28, heightMm: 21 },
    // Anzeigetafel 28 × 18 mm ab (2, 6), Eckradius 1 mm; Ständer x 16 bis y 27, Fuß von x 12 bis
    // 20. Ausrufezeichen geometrisch: Balken 2 × 7 mm ab (15, 14), Punkt r 1,5 mm um (16, 10.5).
    primitives: [
      rect(2, 6, 28, 18, STROKE, 1),
      line(16, 24, 16, 27),
      line(12, 27, 20, 27),
      rect(15, 14, 2, 7, SOLID),
      circle(16, 10.5, 1.5, SOLID),
    ],
  }),
  defineCapability({
    section: '4.7.24',
    id: 'loudspeaker-warning',
    title: 'Warnen mit Lautsprecherdurchsagen',
    referenceAsset: '4.7.24_Warnen mit Lautsprecherdurchsagen.svg',
    box: { xMm: 2, yMm: 6, widthMm: 28, heightMm: 20 },
    // Magnet 2 × 10 mm ab (2, 11); Trichter von x 4 mit gerundetem Knick bis zur Schallwand
    // x 20 (y 6 bis 26);
    // drei Schallbögen um (17, 16) mit r 8, 10,5 und 13 mm.
    primitives: [
      rect(2, 11, 2, 10),
      path('M 4 11 H 5.3 Q 5.98 11 6.62 10.77 L 20 6 V 26 L 6.62 21.23 Q 5.98 21 5.3 21 H 4'),
      path(`M ${pt(onCircle(17, 16, 8, -38.7))}${arc(17, 16, 8, -38.7, 38.7)}`),
      path(`M ${pt(onCircle(17, 16, 10.5, -46))}${arc(17, 16, 10.5, -46, 46)}`),
      path(`M ${pt(onCircle(17, 16, 13, -50.3))}${arc(17, 16, 13, -50.3, 50.3)}`),
    ],
  }),
  defineCapability({
    section: '4.7.25',
    id: 'siren-warning',
    title: 'Warnen mit Sirenen',
    referenceAsset: '4.7.25_Warnen mit Sirenen.svg',
    box: { xMm: 5, yMm: 3, widthMm: 22, heightMm: 27 },
    // Sirenenkopf als Kuppel über der Grundlinie y 9 (x 5 bis 27, Scheitel (16, 3)); Mast x 16
    // bis y 30.
    primitives: [
      path('M 5 9 C 6.95 5.1 11 3 16 3 C 21 3 25.05 5.1 27 9 Z'),
      line(16, 9, 16, 30),
    ],
  }),
  defineCapability({
    section: '4.7.26',
    id: 'water-conveyance',
    title: 'Wasserförderung',
    referenceAsset: '4.7.26_Wasserförderung.svg',
    box: { xMm: 4, yMm: 9, widthMm: 24, heightMm: 14 },
    // Welle wie 4.7.27; darunter Saugkorb als Kreis r 2 mm um (6, 20) mit Förderleitung y 20
    // bis zur Pfeilspitze bei x 28.
    primitives: [
      RIVER_WAVE,
      circle(6, 20, 2),
      line(8, 20, 28, 20),
      arrowHead([28, 20], 0, 3),
    ],
  }),
  defineCapability({
    section: '4.7.27',
    id: 'water-retention',
    title: 'Wasserrückhaltung',
    referenceAsset: '4.7.27_Wasserrückhaltung.svg',
    box: { xMm: 3, yMm: 7, widthMm: 26, heightMm: 18 },
    // Welle (Scheitel y 9, Täler y 13, von x 5 bis 27) vor einer Sperre: Boden y 25 von x 3 bis
    // 29, Wand x 29 bis y 7.
    primitives: [
      RIVER_WAVE,
      polyline([[3, 25], [29, 25], [29, 7]]),
    ],
  }),
  defineCapability({
    section: '4.7.28',
    id: 'load-pulling',
    title: 'Ziehen von Lasten',
    referenceAsset: '4.7.28_Ziehen von Lasten.svg',
    box: { xMm: 3, yMm: 10, widthMm: 27, heightMm: 12 },
    // Last als Quadrat 12 × 12 mm ab (3, 10); Zugpfeil y 16 von x 15 bis zur Spitze bei x 30.
    primitives: [
      rect(3, 10, 12, 12),
      line(15, 16, 30, 16),
      arrowHead([30, 16], 0, 4.1),
    ],
  }),
] as const);
