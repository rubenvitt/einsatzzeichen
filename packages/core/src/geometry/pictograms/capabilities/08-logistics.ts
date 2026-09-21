import { DEFAULT_STROKE_WIDTH_MM, type Primitive, type Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineCapability } from '../catalog-definition.js';

/**
 * Piktogramme des Kapitels 4.8: Versorgung, Logistik und Infrastruktur.
 *
 * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: Die Referenzdateien sind
 * in Umrissflächen umgewandelt. Gezeichnet wird hier die Mittellinie jedes Strichs mit der
 * Referenz-Strichstärke 0,5 mm (1,417 pt); nur echte Flächen (Kamm in 4.8.4, Löffel in 4.8.14)
 * sind gefüllt. Koordinaten in mm, auf 0,05 mm gerundet.
 */

const STROKE: Style = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };
const FILL: Style = { fill: 'schwarz', stroke: 'none' };

type Pt = readonly [number, number];

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

function polyline(points: readonly Pt[], closed = false): Primitive {
  return { type: 'polyline', role: 'pictogram', points, ...(closed ? { closed } : {}), style: STROKE };
}

function stroked(d: string): Primitive {
  return { type: 'path', role: 'pictogram', d, style: STROKE };
}

function filledRect(x: number, y: number, width: number, height: number): Primitive {
  return { type: 'rect', role: 'pictogram', x, y, width, height, style: FILL };
}

const round = (value: number): number => {
  const rounded = Number(value.toFixed(3));
  return Object.is(rounded, -0) ? 0 : rounded;
};

/** Punkt auf dem Kreis um (cx, cy); Winkel in Grad, 0° = rechts, 90° = unten (SVG-Achsen). */
function onCircle(cx: number, cy: number, r: number, deg: number): Pt {
  const a = (deg * Math.PI) / 180;
  return [round(cx + r * Math.cos(a)), round(cy + r * Math.sin(a))];
}

/**
 * Kreisbogen als Folge kubischer Bezierkurven (nur absolute `C`), ohne Startpunkt. Geteilt an
 * jedem Vielfachen von 90°, damit die Extrempunkte des Kreises Segmentenden sind — so liegt die
 * vom Box-Gate berechnete Hülle genau auf dem Kreis.
 */
function arc(cx: number, cy: number, r: number, from: number, to: number): string {
  const dir = Math.sign(to - from);
  const cuts = [from];
  let next = dir > 0 ? Math.floor(from / 90) * 90 + 90 : Math.ceil(from / 90) * 90 - 90;
  while (dir * (to - next) > 1e-9) {
    cuts.push(next);
    next += dir * 90;
  }
  cuts.push(to);
  let d = '';
  for (let i = 0; i + 1 < cuts.length; i += 1) {
    const a0 = (cuts[i]! * Math.PI) / 180;
    const a1 = (cuts[i + 1]! * Math.PI) / 180;
    const k = (4 / 3) * Math.tan((a1 - a0) / 4) * r;
    const [x3, y3] = onCircle(cx, cy, r, cuts[i + 1]!);
    const c1 = [cx + r * Math.cos(a0) - k * Math.sin(a0), cy + r * Math.sin(a0) + k * Math.cos(a0)];
    const c2 = [cx + r * Math.cos(a1) + k * Math.sin(a1), cy + r * Math.sin(a1) - k * Math.cos(a1)];
    d += ` C ${round(c1[0]!)} ${round(c1[1]!)} ${round(c2[0]!)} ${round(c2[1]!)} ${x3} ${y3}`;
  }
  return d;
}

/**
 * Kochtopf-/Teller-Symbol von 4.8.13 und 4.8.14: Kreisring r = 12 mm mit keilförmigem Ausschnitt
 * nach rechts. Die Keilschenkel laufen vom Kreismittelpunkt zum Kreis; ihr Winkel ist über den
 * gemessenen Schenkelendpunkt (10,6 mm rechts, 5,65 mm über der Mitte) bestimmt.
 */
const MOUTH_DEG = (Math.atan2(5.65, 10.6) * 180) / Math.PI;
function plate(cx: number): string {
  const [ux, uy] = onCircle(cx, 16, 12, -MOUTH_DEG);
  return `M ${cx} 16 L ${ux} ${uy}${arc(cx, 16, 12, -MOUTH_DEG, MOUTH_DEG - 360)} Z`;
}

export const LOGISTICS_CAPABILITIES = deepFreeze([
  defineCapability({
    section: '4.8.1',
    id: 'container-resource',
    title: 'Behälter',
    referenceAsset: '4.8.1_Behälter.svg',
    // Oben offenes Quadrat, 24 × 24 mm, Mittellinie von (4, 4) bis (28, 28).
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    primitives: [polyline([[4, 4], [4, 28], [28, 28], [28, 4]])],
  }),
  defineCapability({
    section: '4.8.2',
    id: 'fuels-consumables',
    title: 'Betriebsstoffe / Verbrauchsgüter',
    referenceAsset: '4.8.2_Betriebsstoffe Verbrauchsgüter.svg',
    // Trichter: Oberkante y = 3 (x 5,8 bis 26,2), Schrägen zu den Knicken bei (11,4 | 20,6; 12,05),
    // dort weich in die senkrechten Rohrwände x = 12 und x = 20 übergehend, unten offen bei y = 29.
    box: { xMm: 5.8, yMm: 3, widthMm: 20.4, heightMm: 26 },
    primitives: [
      stroked(
        'M 12 29 V 14.15 C 12 13.4 11.8 12.65 11.4 12.05 L 5.8 3 H 26.2 ' +
          'L 20.6 12.05 C 20.2 12.65 20 13.4 20 14.15 V 29',
      ),
    ],
  }),
  defineCapability({
    section: '4.8.3',
    id: 'bridge',
    title: 'Brücke',
    referenceAsset: '4.8.3_Brücke.svg',
    // Zwei spiegelgleiche Brückenkanten: Fahrbahn 18 mm lang (x 7 bis 25) bei y = 13 bzw. 19,
    // Flügel 5 mm breit und 7 mm hoch nach außen.
    box: { xMm: 2, yMm: 6, widthMm: 28, heightMm: 20 },
    primitives: [
      polyline([[2, 6], [7, 13], [25, 13], [30, 6]]),
      polyline([[2, 26], [7, 19], [25, 19], [30, 26]]),
    ],
  }),
  defineCapability({
    section: '4.8.4',
    id: 'temporary-bridge-construction',
    title: 'Behelfsbrückenbau',
    referenceAsset: '4.8.4_Behelfsbrückenbau.svg',
    // Brückenkanten wie 4.8.3, aber flacher (Flügel 3 × 4 mm, Fahrbahnen y = 9 und y = 14);
    // darunter ein gefüllter Kamm: Rücken 12 × 2 mm, drei Zinken 2 × 5 mm.
    box: { xMm: 4, yMm: 5, widthMm: 24, heightMm: 22 },
    primitives: [
      polyline([[4, 5], [7, 9], [25, 9], [28, 5]]),
      polyline([[4, 18], [7, 14], [25, 14], [28, 18]]),
      filledRect(10, 20, 12, 2),
      filledRect(10, 22, 2, 5),
      filledRect(15, 22, 2, 5),
      filledRect(20, 22, 2, 5),
    ],
  }),
  defineCapability({
    section: '4.8.5',
    id: 'waste-disposal',
    title: 'Entsorgung',
    referenceAsset: '4.8.5_Entsorgung.svg',
    // Mülleimer: Wände x = 9 und x = 23, Boden y = 25 mit Eckradius 0,5 mm, Rand y = 8
    // (x 7 bis 25), Griff y = 6 (x 13 bis 20), drei Rillen x = 12, 16, 20 von y = 10 bis 23.
    box: { xMm: 7, yMm: 6, widthMm: 18, heightMm: 19 },
    primitives: [
      stroked(`M 9 8 V 24.5${arc(9.5, 24.5, 0.5, 180, 90)} H 22.5${arc(22.5, 24.5, 0.5, 90, 0)} V 8`),
      line(7, 8, 25, 8),
      line(13, 6, 20, 6),
      line(12, 10, 12, 23),
      line(16, 10, 16, 23),
      line(20, 10, 20, 23),
    ],
  }),
  defineCapability({
    section: '4.8.6',
    id: 'maintenance',
    title: 'Instandhaltung',
    referenceAsset: '4.8.6_Instandhaltung.svg',
    // Schraubenschlüssel: zwei Halbkreise r = 6 mm um (1, 16) und (31, 16), verbunden durch
    // den Steg y = 16 von x = 7 bis x = 25.
    box: { xMm: 1, yMm: 10, widthMm: 30, heightMm: 12 },
    primitives: [
      stroked(`M 1 10${arc(1, 16, 6, -90, 90)}`),
      stroked(`M 31 10${arc(31, 16, 6, -90, -270)}`),
      line(7, 16, 25, 16),
    ],
  }),
  defineCapability({
    section: '4.8.7',
    id: 'sandbag',
    title: 'Sandsack',
    referenceAsset: '4.8.7_Sandsack.svg',
    // Sack spiegelsymmetrisch zu x = 16: Schultern bei x = 7,95 / 24,05 (y = 10), Taille
    // x = 9 / 23 (y = 24), ausgestellter Fuß, Boden y = 30. Oben ein Knoten als Trapez
    // (Oberkante y = 2 von x 12,85 bis 19,15, unten 1,1 mm breit auf der Sackoberkante y = 4).
    box: { xMm: 7.85, yMm: 2, widthMm: 16.3, heightMm: 28 },
    primitives: [
      stroked(
        'M 17 4 H 15 C 10.15 4 7.95 5.9 7.95 10 C 7.95 11 8.25 14 8.5 17 C 8.75 20 9 23 9 24 ' +
          'C 9 25 8.5 27 8 28.5 C 7.85 28.95 7.85 29.35 8.05 29.6 C 8.2 29.85 8.55 30 9 30 ' +
          'H 23 C 23.45 30 23.8 29.85 23.95 29.6 C 24.15 29.35 24.15 28.95 24 28.5 ' +
          'C 23.5 27 23 25 23 24 C 23 23 23.25 20 23.5 17 C 23.75 14 24.05 11 24.05 10 ' +
          'C 24.05 5.9 21.85 4 17 4 Z',
      ),
      polyline([[12.85, 2], [19.15, 2], [16.45, 4], [15.55, 4]], true),
    ],
  }),
  defineCapability({
    section: '4.8.8',
    id: 'sandbag-filling',
    title: 'Sandsackbefüllung',
    referenceAsset: '4.8.8_Sandsackbefüllung.svg',
    // Trichter (Oberkante y = 2 von x 2 bis 30, 45°-Schrägen) über einem Quadrat 8 × 8 mm bei
    // (12, 12); seitliche Stützen x = 4 und x = 28 von y = 4 bis 28.
    box: { xMm: 2, yMm: 2, widthMm: 28, heightMm: 26 },
    primitives: [
      polyline([[2, 2], [30, 2], [20, 12], [12, 12]], true),
      { type: 'rect', role: 'pictogram', x: 12, y: 12, width: 8, height: 8, style: STROKE },
      line(4, 4, 4, 28),
      line(28, 4, 28, 28),
    ],
  }),
  defineCapability({
    section: '4.8.9',
    id: 'washing-facility',
    title: 'Sanitäre Einrichtung / Waschmöglichkeit',
    referenceAsset: '4.8.9_Sanitäre Einrichtung_Waschmöglichkeit.svg',
    // Dusche: Rohr x = 22 von y = 30 hoch, Bogen r = 5 mm um (17, 8) bis (12, 8); Brausekopf
    // als Halbkreis r = 4 mm um (12, 12) mit Grundlinie; drei Strahlen x = 9, 12, 15 (y 13,5–17).
    box: { xMm: 8, yMm: 3, widthMm: 14, heightMm: 27 },
    primitives: [
      stroked(`M 22 30 V 8${arc(17, 8, 5, 0, -180)}`),
      stroked(`M 8 12${arc(12, 12, 4, 180, 360)} Z`),
      line(9, 13.5, 9, 17),
      line(12, 13.5, 12, 17),
      line(15, 13.5, 15, 17),
    ],
  }),
  defineCapability({
    section: '4.8.10',
    id: 'toilet-facility',
    title: 'Sanitäre Einrichtung / WC',
    referenceAsset: '4.8.10_Sanitäre Einrichtung_WC.svg',
    // „WC" ist in der Referenz keine Schrift, sondern eine Linienzeichnung mit 0,5 mm Strich
    // (dünner als jeder Schnitt der Projektschrift): W aus vier Geraden über y 10 bis 22,
    // C als offener Bogen x 19 bis 26 mit Enden bei y = 12 und y = 20.
    box: { xMm: 5, yMm: 10, widthMm: 21, heightMm: 12 },
    primitives: [
      polyline([[5, 10], [7, 22], [11, 10], [15, 22], [17, 10]]),
      stroked(
        'M 26 12 C 25.5 10.7 24.4 10 23 10 C 20.3 10 19 11.85 19 16 ' +
          'C 19 20.15 20.3 22 23 22 C 24.4 22 25.5 21.3 26 20',
      ),
    ],
  }),
  defineCapability({
    section: '4.8.11',
    id: 'power-supply',
    title: 'Stromversorgung',
    referenceAsset: '4.8.11_Stromversorgung.svg',
    // Blitz als Zickzack (18, 1) → (9,9, 16,1) → (22,1, 13,9) → Spitze (13, 31), dort eine
    // Pfeilspitze mit den Schenkeln nach (12, 25) und (19, 28,5).
    box: { xMm: 9.9, yMm: 1, widthMm: 12.2, heightMm: 30 },
    primitives: [
      polyline([[18, 1], [9.9, 16.1], [22.1, 13.9], [13, 31]]),
      polyline([[12, 25], [13, 31], [19, 28.5]]),
    ],
  }),
  defineCapability({
    section: '4.8.12',
    id: 'drinking-water',
    title: 'Trinkwasser',
    referenceAsset: '4.8.12_Trinkwasser.svg',
    // Wasserhahn: Leitung y = 15 von x = 2, ab x = 24 nach unten gebogen bis (30, 22);
    // Ventilschaft x = 20 von y = 11 bis 18, Handrad y = 11 von x 17 bis 23.
    box: { xMm: 2, yMm: 11, widthMm: 28, heightMm: 11 },
    primitives: [
      stroked('M 2 15 H 24 C 26 15 27.5 15.55 28.55 16.65 C 29.5 17.7 30 19.15 30 21 V 22'),
      line(20, 11, 20, 18),
      line(17, 11, 23, 11),
    ],
  }),
  defineCapability({
    section: '4.8.13',
    id: 'catering',
    title: 'Verpflegung',
    referenceAsset: '4.8.13_Verpflegung.svg',
    // Kreis r = 12 mm um (16, 16) mit Keilausschnitt nach rechts (siehe `plate`).
    box: { xMm: 4, yMm: 4, widthMm: 22.6, heightMm: 24 },
    primitives: [stroked(plate(16))],
  }),
  defineCapability({
    section: '4.8.14',
    id: 'meal-preparation',
    title: 'Verpflegung / Zubereitung',
    referenceAsset: '4.8.14_Verpflegung_Zubereitung.svg',
    // Symbol von 4.8.13 um 4 mm nach rechts (Mitte (20, 16)); links ein gefüllter Löffel:
    // Laffe 6 mm breit (x 1 bis 7, y 4 bis rund 11), Stiel 2 mm breit bis y = 28, unten rund.
    box: { xMm: 1, yMm: 4, widthMm: 29.6, heightMm: 24 },
    primitives: [
      stroked(plate(20)),
      {
        type: 'path',
        role: 'pictogram',
        d:
          'M 4 4 C 5.75 4 7 5.55 7 8 C 7 9.2 6.35 10.15 5.45 10.75 C 5.2 10.9 5 11.25 5 11.55 ' +
          'V 27 C 5 27.55 4.55 28 4 28 C 3.45 28 3 27.55 3 27 V 11.55 C 3 11.25 2.8 10.9 2.55 10.75 ' +
          'C 1.65 10.15 1 9.2 1 8 C 1 5.55 2.25 4 4 4 Z',
        style: FILL,
      },
    ],
  }),
  defineCapability({
    section: '4.8.15',
    id: 'rapid-deployment-tent',
    title: 'Schnelleinsatzzelt',
    referenceAsset: '4.8.15_Schnelleinsatzzelt.svg',
    // Zeltprofil: Wände x = 4 und x = 28 von y = 28 bis 10, Dachschrägen 8 × 6 mm zum First
    // y = 4 (x 12 bis 20); unten offen.
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    primitives: [polyline([[4, 28], [4, 10], [12, 4], [20, 4], [28, 10], [28, 28]])],
  }),
  defineCapability({
    section: '4.8.16',
    id: 'frame-tent',
    title: 'Stangengerüstzelt',
    referenceAsset: '4.8.16_Stangengerüstzelt.svg',
    // Zwei gekreuzte Stangen von (2,95, 28) nach (19, 2) und von (29,05, 28) nach (13, 2);
    // Kreuzungspunkt (16, 6,85). Das Dreieck unterhalb ist mit der Grundlinie y = 28 geschlossen,
    // oberhalb stehen die Stangenenden frei.
    box: { xMm: 2.95, yMm: 2, widthMm: 26.1, heightMm: 26 },
    primitives: [
      polyline([[2.95, 28], [16, 6.85], [29.05, 28]], true),
      line(16, 6.85, 13, 2),
      line(16, 6.85, 19, 2),
    ],
  }),
] as const);
