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

/** Raute mit Mittelpunkt (cx, cy) und halber Diagonale h, als geschlossener Linienzug. */
function diamond(cx: number, cy: number, h: number): Primitive {
  return polyline([[cx, cy - h], [cx + h, cy], [cx, cy + h], [cx - h, cy]], true);
}

/** Korb der Drehleiter und des Teleskopgelenkmasts: 9 × 9 mm, linke untere Ecke bei (20, 12). */
const CAGE: Primitive = {
  type: 'rect', role: 'pictogram', x: 20, y: 3, width: 9, height: 9, style: STROKE,
};

const fmt = (value: number): string => String(Math.round(value * 1000) / 1000);

/**
 * Kreisbogen als absolute Kubiken (das Kommando-Gate lässt kein `A` zu), ab dem aktuellen
 * Punkt, der auf dem Bogenanfang liegen muss. Winkel in Grad in SVG-Richtung (y nach unten,
 * steigender Winkel = im Uhrzeigersinn); Teilbögen von höchstens 90° mit dem Standardhebel
 * 4/3 · tan(θ/4).
 */
function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): string {
  const steps = Math.ceil(Math.abs(toDeg - fromDeg) / 90);
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
 * Welle aus zwei Bergen (Scheitel 4,3 mm auseinander, 1,5 mm hoch) mit Tal in der Mitte,
 * 8 mm breit; (x, y) ist der linke Fußpunkt. Wird für 4.5.5 viermal versetzt. Je Flanke eine
 * Kubik, Hebel an Referenz-Mittellinie angepasst (Abweichung < 0,05 mm).
 */
function smallWave(x: number, y: number): string {
  const p = (dx: number, dy: number): string => `${fmt(x + dx)} ${fmt(y + dy)}`;
  return (
    `M ${p(0, 0)} C ${p(0.85, -0.1)} ${p(0.9, -1.5)} ${p(1.85, -1.5)}` +
    ` C ${p(2.85, -1.5)} ${p(3, 0)} ${p(4, 0)}` +
    ` C ${p(5, 0)} ${p(5.15, -1.5)} ${p(6.15, -1.5)}` +
    ` C ${p(7.1, -1.5)} ${p(7.15, -0.1)} ${p(8, 0)}`
  );
}

/**
 * Große Welle für 4.5.8: von (5, y) über Berge bei x 10 und 22 (4 mm hoch) und das Tal bei
 * x 16 bis (27, y). Je Flanke eine Kubik, Hebel an der Referenz-Mittellinie angepasst
 * (Abweichung ≤ 0,1 mm).
 */
function largeWave(y: number): string {
  const p = (x: number, dy: number): string => `${fmt(x)} ${fmt(y + dy)}`;
  return (
    `M ${p(5, 0)} C ${p(6.85, -0.9)} ${p(7.05, -4)} ${p(10, -4)}` +
    ` C ${p(12.8, -4)} ${p(13.2, 0)} ${p(16, 0)}` +
    ` C ${p(18.8, 0)} ${p(19.2, -4)} ${p(22, -4)}` +
    ` C ${p(24.95, -4)} ${p(25.15, -0.9)} ${p(27, 0)}`
  );
}

/**
 * Piktogramme des Kapitels 4.5. Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert; alle Striche 0,5 mm.
 */
export const RESCUE_CAPABILITIES = deepFreeze([
  defineCapability({
    section: '4.5.1',
    id: 'recovery',
    title: 'Bergung',
    referenceAsset: '4.5.1_Bergung.svg',
    box: { xMm: 1, yMm: 13, widthMm: 30, heightMm: 10 },
    // Mulde: Halbkreis mit Radius 10 mm um (16, 13), links und rechts je ein 5 mm langer
    // waagerechter Ansatz auf Höhe des Mittelpunkts.
    primitives: [strokePath(`M 1 13 H 6${arc(16, 13, 10, 180, 0)} H 31`)],
  }),
  defineCapability({
    section: '4.5.2',
    id: 'rescue-portable-ladders',
    title: 'Retten aus Höhen und Tiefen mit tragbaren Leitern',
    referenceAsset: '4.5.2_Retten aus Höhen und Tiefen mit tragbaren Leitern.svg',
    box: { xMm: 7, yMm: 2, widthMm: 18, heightMm: 28 },
    // Leiter: zwei 28 mm lange Holme bei x 7 und 25, drei Sprossen bei y 7, 16 und 25.
    primitives: [
      line(7, 2, 7, 30),
      line(25, 2, 25, 30),
      line(7, 7, 25, 7),
      line(7, 16, 25, 16),
      line(7, 25, 25, 25),
    ],
  }),
  defineCapability({
    section: '4.5.3',
    id: 'rescue-aerial-ladder',
    title: 'Retten aus Höhen und Tiefen mit Drehleiter',
    referenceAsset: '4.5.3_Retten aus Höhen und Tiefen mit Drehleiter.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    // Leiterpark unter 45° von (3, 29) bis an die linke untere Ecke des Korbs.
    primitives: [line(3, 29, 20, 12), CAGE],
  }),
  defineCapability({
    section: '4.5.4',
    id: 'rescue-articulated-boom',
    title: 'Retten aus Höhen und Tiefen mit Teleskopgelenkmast',
    referenceAsset: '4.5.4_Retten aus Höhen und Tiefen mit Teleskopgelenkmast.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    // Zweigliedriger Mast: steiles Unterteil (3, 29) → Gelenk (9, 15), flaches Oberteil bis an
    // die linke untere Ecke des Korbs.
    primitives: [polyline([[3, 29], [9, 15], [20, 12]]), CAGE],
  }),
  defineCapability({
    section: '4.5.5',
    id: 'watercraft-operations',
    title: 'Einsatz von Wasserfahrzeugen',
    referenceAsset: '4.5.5_Einsatz von Wasserfahrzeugen.svg',
    box: { xMm: 1, yMm: 13.5, widthMm: 30.1, heightMm: 6 },
    // Boot als geschlossener Halbrumpf: Deck y 13,5 von x 10 bis 22, Kiel bei (16, 19,5).
    // Links und rechts davon je zwei kleine Wellen, 2,5 mm übereinander.
    primitives: [
      strokePath(
        'M 10 13.5 H 22 C 22 17.3 19.7 19.5 16 19.5 C 12.3 19.5 10 17.3 10 13.5 Z',
      ),
      strokePath(
        `${smallWave(1, 15.5)} ${smallWave(1, 18)} ${smallWave(23.1, 15.5)} ${smallWave(23.1, 18)}`,
      ),
    ],
  }),
  defineCapability({
    section: '4.5.6',
    id: 'mountain-rescue',
    title: 'Bergrettung',
    referenceAsset: '4.5.6_Bergrettung.svg',
    box: { xMm: 9.5, yMm: 2, widthMm: 13, heightMm: 28 },
    // Raute (halbe Diagonale 6,5 mm) um (16, 8,5), darunter ein gefüllter Berg: Spitze an der
    // unteren Rautenecke (16, 15), Fuß von x 10 bis 22 bei y 30.
    primitives: [
      diamond(16, 8.5, 6.5),
      {
        type: 'polyline',
        role: 'pictogram',
        points: [[16, 15], [22, 30], [10, 30]],
        closed: true,
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ],
  }),
  defineCapability({
    section: '4.5.7',
    id: 'special-height-depth-rescue',
    title: 'Spezielle Rettung aus Höhen und Tiefen',
    referenceAsset: '4.5.7_Spezielle Rettung aus Höhen und Tiefen.svg',
    box: { xMm: 9.5, yMm: 1, widthMm: 13, heightMm: 30 },
    // Raute (halbe Diagonale 6,5 mm) um die Mitte, darüber und darunter je ein Pfeil: 7 mm
    // Schaft, Spitze aus zwei 45°-Schenkeln von 3 mm Breite.
    primitives: [
      diamond(16, 16, 6.5),
      line(16, 1, 16, 8),
      polyline([[13, 4], [16, 1], [19, 4]]),
      line(16, 24, 16, 31),
      polyline([[13, 28], [16, 31], [19, 28]]),
    ],
  }),
  defineCapability({
    section: '4.5.8',
    id: 'water-rescue',
    title: 'Wasserrettung',
    referenceAsset: '4.5.8_Wasserrettung.svg',
    box: { xMm: 5, yMm: 3, widthMm: 22, heightMm: 27 },
    // Zwei große Wellen (Fußpunkte y 7 und 10) über einer Raute mit halber Diagonale 9 mm um
    // (16, 21).
    primitives: [strokePath(`${largeWave(7)} ${largeWave(10)}`), diamond(16, 21, 9)],
  }),
] as const);
