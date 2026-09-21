import {
  DEFAULT_STROKE_WIDTH_MM,
  type ColorToken,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineCapability } from '../catalog-definition.js';

/*
 * Piktogramme des Kapitels 4.1 (CBRN). Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert (Umrechnung mm = pt × 32 / 90,709): Striche als Striche mit 0,5 mm Stärke
 * (Referenz 1,417 pt), Kreise als `circle`, Kreisbögen als Bézierkurven aus Mittelpunkt, Radius
 * und Winkeln.
 */

/** Strich der Referenz: 0,5 mm, ohne Füllung. */
function strokeStyle(color: ColorToken = 'schwarz'): Style {
  return { stroke: color, strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };
}
const STROKE = strokeStyle();
const SOLID: Style = { fill: 'schwarz', stroke: 'none' };

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

function disc(cx: number, cy: number, r: number): Primitive {
  return { type: 'circle', role: 'pictogram', cx, cy, r, style: SOLID };
}

function path(d: string, style: Style = STROKE): Primitive {
  return { type: 'path', role: 'pictogram', d, style };
}

const fmt = (value: number): string => String(Math.round(value * 1000) / 1000);

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

/**
 * Kreisbogen um (cx|cy) mit Radius r von `fromDeg` nach `toDeg` (SVG-Winkel: 0° = rechts,
 * 90° = unten) als Folge kubischer Bézierkurven zu höchstens 30°, Kontrollabstand
 * k = 4/3 · tan(Δ/4) · r. Liefert nur die `C`-Kommandos; der Startpunkt steht beim Aufrufer.
 */
function arcTo(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const steps = Math.max(1, Math.ceil(Math.abs(toDeg - fromDeg) / 30));
  const delta = (toDeg - fromDeg) / steps;
  const k = (4 / 3) * Math.tan((delta * Math.PI) / 720) * r;
  let d = '';
  for (let i = 0; i < steps; i += 1) {
    const a0 = fromDeg + i * delta;
    const a1 = a0 + delta;
    const [x0, y0] = polar(cx, cy, r, a0);
    const [x1, y1] = polar(cx, cy, r, a1);
    const r0 = (a0 * Math.PI) / 180;
    const r1 = (a1 * Math.PI) / 180;
    d +=
      ` C ${fmt(x0 - k * Math.sin(r0))} ${fmt(y0 + k * Math.cos(r0))}` +
      ` ${fmt(x1 + k * Math.sin(r1))} ${fmt(y1 - k * Math.cos(r1))} ${fmt(x1)} ${fmt(y1)}`;
  }
  return d;
}

/** Offener Kreisbogen als eigenständiger Pfad. */
function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const [x, y] = polar(cx, cy, r, fromDeg);
  return `M ${fmt(x)} ${fmt(y)}${arcTo(cx, cy, r, fromDeg, toDeg)}`;
}

/** Kreisringsektor um (cx|cy) zwischen Innen- und Außenradius, als geschlossene Fläche. */
function ringSector(
  cx: number, cy: number, inner: number, outer: number, fromDeg: number, toDeg: number,
): string {
  const [ix, iy] = polar(cx, cy, inner, fromDeg);
  const [ox, oy] = polar(cx, cy, outer, fromDeg);
  const [ex, ey] = polar(cx, cy, inner, toDeg);
  return (
    `M ${fmt(ix)} ${fmt(iy)} L ${fmt(ox)} ${fmt(oy)}${arcTo(cx, cy, outer, fromDeg, toDeg)}` +
    ` L ${fmt(ex)} ${fmt(ey)}${arcTo(cx, cy, inner, toDeg, fromDeg)} Z`
  );
}

/**
 * Gemeinsames Motiv von 4.1.1 bis 4.1.3: zwei gefüllte Kreise (r 3,75 mm um (7,5|8,5) und
 * (24,5|8,5)) und zwei gekreuzte Striche von (7|27) bzw. (25|27) nach oben. Jeder Strich endet
 * im Lotfußpunkt des gegenüberliegenden Kreismittelpunkts; seine Außenkante berührt den Kreis.
 */
const CROSSED_TONGS: readonly Primitive[] = [
  disc(7.5, 8.5, 3.75),
  disc(24.5, 8.5, 3.75),
  line(7, 27, 21.65, 6.47),
  line(25, 27, 10.35, 6.47),
];

/**
 * Gefahrendreieck der Alternativdarstellungen: gleichschenklig (1|28)–(16|3)–(31|28), rote
 * 0,5-mm-Kontur, weiß gefüllt.
 */
const WARNING_TRIANGLE: Primitive = {
  type: 'polyline',
  role: 'pictogram',
  points: [[1, 28], [16, 3], [31, 28]],
  closed: true,
  style: { fill: 'weiss', stroke: 'rot', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
};

/**
 * Kennbuchstabe im Gefahrendreieck: rot, fett, Grundlinie y = 24 mm, Versalhöhe ≈ 9,7 mm
 * (Referenz: 40,4–68,0 pt). `x` ist die an der Referenz abgelesene Mitte der Glyphe.
 */
function triangleLetter(content: string, x: number): Primitive {
  return {
    type: 'text',
    role: 'pictogram',
    content,
    x,
    y: 24,
    sizeMm: 14.15,
    anchor: 'middle',
    baseline: 'alphabetic',
    boxMm: { xMm: 10, yMm: 13.5, widthMm: 12, heightMm: 11 },
    minRenderPx: 24,
    fontWeight: 700,
    style: { fill: 'rot', stroke: 'none' },
  };
}

const TRIANGLE_BOX = { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 } as const;

/** Welle aus 4.1.4 mit Endpunkten bei (5|y) und (27|y), Wellenbergen 4 mm höher bei x = 10 und 22. */
function wave(y: number): string {
  const t = (dy: number): string => fmt(y + dy);
  return (
    `M 5 ${t(0)} C 5.8 ${t(-0.4)} 6.3 ${t(-1.1)} 6.75 ${t(-1.85)} ` +
    `C 7.5 ${t(-2.95)} 8.2 ${t(-4)} 10 ${t(-4)} C 11.5 ${t(-4)} 12.25 ${t(-3)} 13 ${t(-2)} ` +
    `C 13.75 ${t(-1)} 14.5 ${t(0)} 16 ${t(0)} C 17.5 ${t(0)} 18.25 ${t(-1)} 19 ${t(-2)} ` +
    `C 19.75 ${t(-3)} 20.5 ${t(-4)} 22 ${t(-4)} C 23.8 ${t(-4)} 24.5 ${t(-2.95)} 25.25 ${t(-1.85)} ` +
    `C 25.7 ${t(-1.1)} 26.2 ${t(-0.4)} 27 ${t(0)}`
  );
}

export const CBRN_CAPABILITIES = deepFreeze([
  defineCapability({
    section: '4.1.1',
    id: 'cbrn-protection',
    title: 'ABC-/CBRN-Schutz',
    referenceAsset: '4.1.1_ABC_CBRN-Schutz.svg',
    box: { xMm: 3.75, yMm: 4.75, widthMm: 24.5, heightMm: 22.25 },
    primitives: CROSSED_TONGS,
  }),
  defineCapability({
    section: '4.1.2',
    id: 'cbrn-detection',
    title: 'Messen, Spüren, Detektieren',
    referenceAsset: '4.1.2_Messen Spüren Detektieren.svg',
    box: { xMm: 1, yMm: 4.75, widthMm: 30, heightMm: 22.25 },
    // Motiv von 4.1.1, dazu ein ansteigender Messstrich von (1|18,5) nach (31|10,5).
    primitives: [...CROSSED_TONGS, line(1, 18.5, 31, 10.5)],
  }),
  defineCapability({
    section: '4.1.3',
    id: 'decontamination',
    title: 'Dekontaminieren',
    referenceAsset: '4.1.3_Dekontaminieren.svg',
    box: { xMm: 3.75, yMm: 4.75, widthMm: 24.5, heightMm: 22.5 },
    // Motiv von 4.1.1, die Strichenden in rechtwinkligen Klammern (Schenkel 6,25 × 5,75 mm).
    primitives: [
      ...CROSSED_TONGS,
      line(6.75, 21, 6.75, 27.25),
      line(6.5, 27, 12.25, 27),
      line(25.25, 21, 25.25, 27.25),
      line(25.5, 27, 19.75, 27),
    ],
  }),
  defineCapability({
    section: '4.1.4',
    id: 'water-environmental-damage-control',
    title: 'Umweltschädenbeseitigung auf Gewässern',
    referenceAsset: '4.1.4_Umweltschädenbeseitigung auf Gewässern.svg',
    box: { xMm: 4.75, yMm: 3.75, widthMm: 22.5, heightMm: 25.25 },
    primitives: [
      // Verkleinertes Motiv von 4.1.3: Kreise r 3,25 mm um (8|7) und (24|7), Striche von den
      // Klammerecken tangential an den gegenüberliegenden Kreis.
      disc(8, 7, 3.25),
      disc(24, 7, 3.25),
      line(8, 19, 21.87, 4.88),
      line(24, 19, 10.13, 4.88),
      line(7.9, 15, 7.9, 19.25),
      line(7.65, 19, 11.9, 19),
      line(24.1, 15, 24.1, 19.25),
      line(24.35, 19, 20.1, 19),
      // Zwei Wellen, 3 mm übereinander.
      path(wave(26)),
      path(wave(29)),
    ],
  }),
  defineCapability({
    section: '4.1.5',
    id: 'drinking-water-treatment',
    title: 'Trinkwasseraufbereitung',
    referenceAsset: '4.1.5_Trinkwasseraufbereitung.svg',
    box: { xMm: 1.8, yMm: 4.686, widthMm: 28.4, heightMm: 22.628 },
    primitives: [
      // Kreislaufpfeile: Bögen mit 16 mm Radius um (14|16) bzw. (18|16) über ±45°, am unteren
      // Ende je eine Pfeilspitze.
      path(arc(14, 16, 16, -45, 45)),
      path(arc(18, 16, 16, 225, 135)),
      { type: 'polyline', role: 'pictogram', points: [[24.75, 24.05], [25.3, 27.3], [28.6, 26.95]], style: STROKE },
      { type: 'polyline', role: 'pictogram', points: [[7.25, 24.05], [6.7, 27.3], [3.4, 26.95]], style: STROKE },
      // Wasserlinie: Wellenberge (10,5|10) und (21,5|10), Tal (16|13).
      path(
        'M 6.5 13 C 7.1 12.8 7.45 12.25 7.85 11.7 C 8.4 10.85 9 10 10.5 10 ' +
          'C 11.7 10 12.3 10.7 12.95 11.4 C 13.7 12.2 14.45 13 16 13 ' +
          'C 17.55 13 18.3 12.2 19.05 11.4 C 19.7 10.7 20.3 10 21.5 10 ' +
          'C 23 10 23.6 10.85 24.15 11.7 C 24.55 12.25 24.9 12.8 25.5 13',
      ),
      // Wasserhahn: Rohr y = 18 mm, Viertelbogen mit 2,9 mm Radius nach unten, Auslauf bis 22 mm.
      path('M 8 18 H 21.1 C 22.702 18 24 19.298 24 20.9 V 22'),
      // Ventil: Griff (18–21 mm) bei y = 16 mm, Spindel bei x = 19,5 mm bis y = 19 mm.
      line(18, 16, 21, 16),
      line(19.5, 16, 19.5, 19),
    ],
  }),
  defineCapability({
    section: '4.1.6',
    id: 'radioactive-materials',
    title: 'Atomare Stoffe',
    referenceAsset: '4.1.6_Atomare Stoffe.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    // Strahlenwarnzeichen: gefüllter Kern r 2,5 mm und drei Ringsektoren zu je 60° zwischen
    // 4,5 und 13 mm Radius, um (16|16), Sektoren bei 180–240°, 300–360° und 60–120°.
    primitives: [
      disc(16, 16, 2.5),
      path(ringSector(16, 16, 4.5, 13, 180, 240), SOLID),
      path(ringSector(16, 16, 4.5, 13, 300, 360), SOLID),
      path(ringSector(16, 16, 4.5, 13, 60, 120), SOLID),
    ],
  }),
  defineCapability({
    section: '4.1.6',
    id: 'radioactive-materials',
    variant: 'alternative',
    title: 'Atomare Stoffe',
    referenceAsset: '4.1.6_Atomare Stoffe_Alternative.svg',
    box: TRIANGLE_BOX,
    primitives: [WARNING_TRIANGLE, triangleLetter('A', 16.2)],
  }),
  defineCapability({
    section: '4.1.7',
    id: 'biological-materials',
    title: 'Biologische Stoffe',
    referenceAsset: '4.1.7_Biologische Stoffe.svg',
    box: { xMm: 1.8, yMm: 3, widthMm: 28.4, heightMm: 25.3 },
    // Drei Kreisbögen mit 8 mm Radius um (16|11), (10|20) und (22|20). Jeder ist nach außen
    // offen: Lücke von 48,4° um die Richtung vom Figurenmittelpunkt weg (−90°, 150°, 30°).
    primitives: [
      path(arc(16, 11, 8, -65.8, 245.8)),
      path(arc(10, 20, 8, 174.2, 485.8)),
      path(arc(22, 20, 8, 54.2, 365.8)),
    ],
  }),
  defineCapability({
    section: '4.1.7',
    id: 'biological-materials',
    variant: 'alternative',
    title: 'Biologische Stoffe',
    referenceAsset: '4.1.7_Biologische Stoffe_Alternative.svg',
    box: TRIANGLE_BOX,
    primitives: [WARNING_TRIANGLE, triangleLetter('B', 16.55)],
  }),
  defineCapability({
    section: '4.1.8',
    id: 'chemical-materials',
    title: 'Chemische Stoffe',
    referenceAsset: '4.1.8_Chemische Stoffe.svg',
    box: { xMm: 6, yMm: 3, widthMm: 20, heightMm: 26 },
    // Erlenmeyerkolben als 0,5-mm-Kontur: Hals x 12–20 mm ab y = 3, Schultern bei y = 19 mit
    // 1,1 mm Ausrundung, Flanken mit Steigung 5 : 3 bis zum Boden y = 29 (x 6–26).
    primitives: [
      path(
        'M 6 29 L 11.43 19.94 Q 12 19 12 17.9 V 3 H 20 V 17.9 Q 20 19 20.57 19.94 L 26 29 Z',
      ),
    ],
  }),
  defineCapability({
    section: '4.1.8',
    id: 'chemical-materials',
    variant: 'alternative',
    title: 'Chemische Stoffe',
    referenceAsset: '4.1.8_Chemische Stoffe_Alternative.svg',
    box: TRIANGLE_BOX,
    primitives: [WARNING_TRIANGLE, triangleLetter('C', 15.05)],
  }),
] as const);
