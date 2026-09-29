import type { BoundsMm } from '../../bounds.js';
import { DEFAULT_STROKE_WIDTH_MM, type Primitive } from '@einsatzzeichen/schema';
import type { AnhangCContext, MarkTable } from './shared.js';
import { stroke } from './shared.js';

/*
 * C.2.14 bis C.2.17, C.2.27 und C.2.28 samt Alternativen: Drehleiter (4.5.3), Teleskopgelenkmast
 * (4.5.4), Kran (4.7.9) und Heben/Räumen (4.7.11) am Landfahrzeug (LFH-786).
 *
 * Alle vier Marken stehen in derselben Höhenlage: ihr Fuß endet 2 mm über der Körperunterkante
 * (y 24,0 bei Unterkante 26,0), ihre Oberkante liegt 13 mm darüber (y 11,0). Das gilt in allen
 * zwölf Dateien bis auf den Fuß der Leiter in C.2.16_Alternative (siehe dort). Waagerecht rechnen
 * die Fassungen von der Körpermitte (x 16,0) aus. Gemessen ist nur am Landfahrzeug mit 30 × 20,25
 * mm großer Hülle (x 1…31, Dach 5,75…8,0, Unterkante 26,0); am Rechnen aus der Hülle hängt keine
 * Behauptung über andere Körpergrößen.
 *
 * Strich überall 0,5 mm (`DEFAULT_STROKE_WIDTH_MM`), Enden stumpf. Rechte Winkel, die die Referenz
 * gegehrt zeichnet, sind aus Einzelstrichen gebaut, deren einer um die halbe Strichstärke übersteht:
 * der Renderer zeichnet Piktogrammecken rund.
 *
 * „Keine Verkleinerung“ heißt in den Fassungen unten: kein gleichmäßig verkleinertes Abbild der
 * Einzeldarstellung, weil ihre Teile verschieden stark schrumpfen. An der Hülle gemessen stuft
 * das Innenfeld-Gate aus LFH-587 alle Fassungen als `reduced` ein (Faktoren 0,41 bis 0,57,
 * Gleichmäßigkeit 0,02 bis 0,16).
 */

/** Halbe Strichstärke: so weit steht ein Strich über, der eine rechtwinklige Ecke schließt. */
const HALF_STROKE_MM = DEFAULT_STROKE_WIDTH_MM / 2;

/** Fuß- und Kopflinie aller vier Marken aus der Körperunterkante. */
function levels(bounds: BoundsMm): { cx: number; footY: number; topY: number } {
  const footY = bounds.maxY - 2;
  return { cx: (bounds.minX + bounds.maxX) / 2, footY, topY: footY - 13 };
}

/** Quadratischer Korb: Strichmitte `left`…`left + side` × `top`…`top + side`, Ecken eckig. */
function basket(left: number, top: number, side: number): Primitive[] {
  const right = left + side;
  const bottom = top + side;
  return [
    stroke(left - HALF_STROKE_MM, top, right + HALF_STROKE_MM, top),
    stroke(left - HALF_STROKE_MM, bottom, right + HALF_STROKE_MM, bottom),
    stroke(left, top, left, bottom),
    stroke(right, top, right, bottom),
  ];
}

function polyline(points: readonly (readonly [number, number])[]): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

/**
 * Unterer Halbkreis um (cx|cy) mit Radius r, von links (cx − r|cy) nach rechts (cx + r|cy), als
 * zwei kubische Viertelbögen mit dem Hebel 4/3 · tan(22,5°) · r (das Kommando-Gate lässt kein `A`
 * zu).
 */
function lowerHalfCircle(cx: number, cy: number, r: number): Primitive {
  const k = (4 / 3) * Math.tan(Math.PI / 8) * r;
  const n = (valueMm: number): number => Number(valueMm.toFixed(4));
  return {
    type: 'path',
    role: 'pictogram',
    d:
      `M ${n(cx - r)} ${n(cy)} ` +
      `C ${n(cx - r)} ${n(cy + k)}, ${n(cx - k)} ${n(cy + r)}, ${n(cx)} ${n(cy + r)} ` +
      `C ${n(cx + k)} ${n(cy + r)}, ${n(cx + r)} ${n(cy + k)}, ${n(cx + r)} ${n(cy)}`,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

/**
 * Drehleiter (4.5.3): Leiter unter 45° vom Fuß bis an den Korb, Korb 4 × 4 mm.
 * `shiftXMm` verschiebt die ganze Marke, `ladderRaiseMm` hebt nur die Leiter an.
 */
function aerialLadder(bounds: BoundsMm, shiftXMm: number, ladderRaiseMm: number): Primitive[] {
  const { cx, footY, topY } = levels(bounds);
  const side = 4;
  const basketLeft = cx + 2.5 + shiftXMm;
  const footX = cx - 6.5 + shiftXMm;
  const ladderFootY = footY - ladderRaiseMm;
  // Unter 45° bis an die linke Korbseite: ohne Anhebung trifft sie genau die untere linke Ecke.
  const ladderTopY = ladderFootY - (basketLeft - footX);
  return [stroke(footX, ladderFootY, basketLeft, ladderTopY), ...basket(basketLeft, topY, side)];
}

/**
 * Teleskopgelenkmast (4.5.4): unterer Mast vom Fuß zum Gelenk, oberer Mast unter 18° an den
 * Korb, Korb 4 × 4 mm. `armShiftXMm` und `basketShiftXMm` verschieben Mast und Korb getrennt.
 */
function articulatedBoom(
  bounds: BoundsMm,
  armShiftXMm: number,
  basketShiftXMm: number,
): Primitive[] {
  const { cx, footY, topY } = levels(bounds);
  const side = 4;
  const basketLeft = cx + 4 + basketShiftXMm;
  const footX = cx - 6 + armShiftXMm;
  const jointX = cx - 2 + armShiftXMm;
  const jointY = footY - 7;
  // Der obere Mast endet an der Innenkante der linken Korbseite: so deckt der Korb sein stumpfes
  // Ende vollständig, und die Unterkante des Masts bleibt über der Unterkante des Korbs.
  const armEndX = basketLeft + HALF_STROKE_MM;
  const armEndY = jointY - (armEndX - jointX) * Math.tan((18 * Math.PI) / 180);
  return [
    polyline([
      [footX, footY],
      [jointX, jointY],
      [armEndX, armEndY],
    ]),
    ...basket(basketLeft, topY, side),
  ];
}

/**
 * Kran (4.7.9): Turm vom Fuß bis zur Oberkante, waagerechter Ausleger `jibMm` weit, Haken als
 * unterer Halbkreis r 2 mm, dessen linkes Ende am Auslegerende sitzt.
 */
function crane(bounds: BoundsMm, towerX: number, jibMm: number): Primitive[] {
  const { footY, topY } = levels(bounds);
  const hookRadiusMm = 2;
  const jibEndX = towerX + jibMm;
  return [
    stroke(towerX, footY, towerX, topY - HALF_STROKE_MM),
    stroke(towerX - HALF_STROKE_MM, topY, jibEndX + HALF_STROKE_MM, topY),
    lowerHalfCircle(jibEndX + hookRadiusMm, topY, hookRadiusMm),
  ];
}

/**
 * Heben/Räumen (4.7.11): Schräge unter 45° vom Fuß an den Mast, Mast von der Oberkante 6 mm nach
 * unten, Ausleger am Mastfuß 6 mm nach rechts.
 */
function liftingClearing(bounds: BoundsMm, shiftXMm: number): Primitive[] {
  const { cx, footY, topY } = levels(bounds);
  const footX = cx - 3 + shiftXMm;
  const mastX = cx + 7 + shiftXMm;
  const mastBottomY = topY + 6;
  return [
    stroke(footX, footY, mastX, footY - (mastX - footX)),
    stroke(mastX, topY, mastX, mastBottomY),
    stroke(mastX - HALF_STROKE_MM, mastBottomY, mastX + 6, mastBottomY),
  ];
}

/** Grundfassungen am Landfahrzeug. */
const VEHICLE_LAND_MARKS: MarkTable = {
  /**
   * C.2.14 bis C.2.16: Drehleiter (4.5.3) am Landfahrzeug, Hauptdarstellung. Die drei Dateien
   * zeichnen dieselbe Marke; sie gilt hier als Grundfassung.
   *
   * | Größe | C.2.14 (12/9) | C.2.15 (18/12) | C.2.16 (23/12) | hier |
   * |---|---|---|---|---|
   * | Leiterfuß, Mitte der Stumpfkante | (9,5000\|23,9998) | (9,5000\|23,9998) | (9,5000\|23,9998) | (Mitte − 6,5\|Unterkante − 2) |
   * | Leiterende | (18,5\|15,0), Ecke (18,6767\|15,1764) | wie C.2.14 | wie C.2.14 | untere linke Korbecke |
   * | Korb, Außen-/Innenkante | 18,2498…22,7498 × 10,7498…15,2498 / 18,7497…22,2500 × 11,2497…14,7499 | 18,2498…22,7498 / 18,7501…22,2500 | wie C.2.15 | Strichmitte 18,5…22,5 × 11…15 |
   *
   * Gegenüber der Einzeldarstellung 4.5.3 (Leiter (3\|29) → (20\|12), Korb 9 × 9 mm) ist das keine
   * Verkleinerung: der Korb schrumpft auf 4/9 = 0,44, die Leiter auf 9/17 = 0,53, und der Korb
   * sitzt nicht mehr bündig am Leiterende, sondern mit der Ecke darauf.
   */
  'rescue-aerial-ladder': (bounds) => aerialLadder(bounds, 0, 0),

  /**
   * C.2.17 (HAB): Teleskopgelenkmast (4.5.4) am Landfahrzeug. Unterer Mast (10\|24) → (14\|17),
   * oberer Mast unter 18° an den Korb 20…24 × 11…15.
   *
   * Gemessen an `C.2.17_Hubarbeitsbühne.svg`: Stumpfkante des Fußes (9,7828\|23,8759) /
   * (10,2168\|24,1239), Mitte (9,9998\|23,9999); Neigung des unteren Masts 7 : 4 (beide Kanten
   * dx/dy 0,5714); Gehrung am Gelenk (13,8306\|16,7922) / (14,1689\|17,2081), die Kantenmitte
   * schneidet x 14,0 bei y 17,0001; oberer Mast mit beiden Kanten dy/dx 0,32476 = tan 17,99°.
   * Er verschwindet im Korb, sein Ende ist nicht sichtbar: die Oberkante stößt bei
   * (19,7498\|14,8699) an die Außenkante der linken Korbseite, die Unterkante bei
   * (20,1975\|15,2502) an die Außenkante der Korbunterseite. Korb außen 19,7498…24,2499 ×
   * 10,7502…15,2502, innen 20,2501…23,7500 × 11,2497…14,7499.
   *
   * Gegenüber 4.5.4 (Fuß (3\|29), Gelenk (9\|15), Korb 20…29 × 3…12) ist das keine Verkleinerung:
   * der Korb schrumpft auf 0,44, der untere Mast auf 8,06/15,23 = 0,53, der obere auf
   * 6,31/11,33 = 0,56, und seine Neigung wechselt von 15,3° auf 18°.
   */
  'rescue-articulated-boom': (bounds) => articulatedBoom(bounds, 0, 0),

  /**
   * C.2.27 (FwK 30): Kran (4.7.9) am Landfahrzeug. Turm x 19 von y 24 bis zur Oberkante 11,
   * Ausleger y 11 bis x 23, Haken als unterer Halbkreis r 2 um (25\|11).
   *
   * Gemessen an `C.2.27_Feuerwehrkran 30.svg`: Turm 18,7501…19,2500 von y 23,9997 bis 10,7498;
   * Ausleger 10,7498…11,2497 bis zur Außenkante x 23,2501; Haken innen r 1,75 (23,2501\|10,9996)
   * → (25,0002\|12,7497) → (26,7500\|10,9996), außen r 2,25 (27,2499\|10,9996) → (24,9999\|13,2496)
   * → (22,7636\|11,2497), also Mitte (25\|11), Strichmitte r 2,0, rechtes Ende stumpf auf y 11.
   *
   * Gegenüber 4.7.9 (Turm 28 mm, Ausleger 12 mm, Haken r 4) ist das keine Verkleinerung: der Turm
   * schrumpft auf 13/28 = 0,46, der Ausleger auf 4/12 = 0,33, der Haken auf 0,5.
   */
  'crane-lifting': (bounds) => {
    const { cx } = levels(bounds);
    return crane(bounds, cx + 3, 4);
  },

  /**
   * C.2.28 (Telelader): Heben/Räumen (4.7.11) am Landfahrzeug. Schräge (13\|24) → (23\|14) unter
   * 45°, Mast x 23 von y 11 bis 17, Ausleger y 17 von x 23 bis 29.
   *
   * Gemessen an `C.2.28_Teleskoplader.svg`: Stumpfkante des Fußes (12,8234\|23,8230) /
   * (13,1769\|24,1765), Mitte (13,0\|24,0); die Schräge stößt bei (22,7502\|13,8966) /
   * (22,7498\|14,6035) an die linke Mastkante, ihre Mittellinie trifft x 22,75 bei y 14,25, also
   * den Mast bei (23\|14). Mast 22,7498…23,2501 von y 10,9999 bis 17,2501; Ausleger
   * 16,7502…17,2501 von x 22,7498 bis 29,0000.
   *
   * Gegenüber 4.7.11 (Schräge (3\|29) → (20\|9) mit Steigung 20 : 17, Mast 11 mm, Ausleger
   * 11 mm) ist das keine Verkleinerung: die Schräge steht unter 45° statt 49,6°, Mast und
   * Ausleger schrumpfen auf 6/11 = 0,55, die Schräge auf 14,1/26,2 = 0,54, und sie trifft den
   * Mast 3 mm über seinem Fuß statt 4 mm.
   */
  'lifting-clearing': (bounds) => liftingClearing(bounds, 0),
};

export const HEIGHT_RESCUE_LIFTING_CONTEXTS: readonly AnhangCContext[] = [
  { kind: 'vehicle-land', marks: VEHICLE_LAND_MARKS },
  {
    kind: 'vehicle-land',
    rendition: 'shifted-right-6.5mm',
    marks: {
      /**
       * C.2.14_Alternative (DLAK 12/9) und C.2.15_Alternative (DLAK 18/12): die Grundfassung um
       * 6,5 mm nach rechts, weil der längere Lauf den Platz links braucht. Leiterfuß (16\|24),
       * Korb 25…29 × 11…15; die rechte Korbseite steht damit 2 mm vor der rechten Körperkante.
       *
       * | Größe | C.2.14_Alternative | C.2.15_Alternative | hier |
       * |---|---|---|---|
       * | Leiterfuß, Stumpfkante | (15,8231\|23,8230) / (16,1766\|24,1765) | wie C.2.14_Alt. | (16\|24) |
       * | Leiterende, Unterkante | (25,1032\|15,2498) | wie C.2.14_Alt. | untere linke Korbecke (25\|15) |
       * | Korb außen / innen | 24,7497…29,2498 × 10,7498…15,2498 / 25,2496…28,7499 × 11,2497…14,7499 | 24,7497…29,2498 / 25,2500…28,7499 | Strichmitte 25…29 × 11…15 |
       *
       * Eine reine Verschiebung: Leiter und Korb sind punktgleich mit der Grundfassung
       * + 6,5 mm (Abweichung ≤ 0,0004 mm).
       */
      'rescue-aerial-ladder': (bounds) => aerialLadder(bounds, 6.5, 0),
    },
  },
  {
    kind: 'vehicle-land',
    rendition: 'shifted-right-6.5mm-ladder-raised-1mm',
    marks: {
      /**
       * C.2.16_Alternative (DLAK 23/12): wie `shifted-right-6.5mm`, aber **nur die Leiter** liegt
       * 1 mm höher; der Korb bleibt bei 25…29 × 11…15. Die Leiter trifft deshalb nicht die
       * untere linke Korbecke, sondern die linke Korbseite 1 mm darüber.
       *
       * Gemessen an `C.2.16_Automatikdrehleiter_23-12_Alternative.svg`: Stumpfkante des Fußes
       * (15,8231\|22,8232) / (16,1766\|23,1767), Mitte (16,0\|23,0); die Leiter stößt bei
       * (24,7497\|13,8962) / (24,7497\|14,6035) an die Außenkante der linken Korbseite, ihre
       * Mittellinie also bei (24,75\|14,25) und die Korbseite bei (25\|14). Korb außen
       * 24,7497…29,2498 × 10,7498…15,2502, innen 25,2500…28,7499 × 11,2497…14,7499 — gleich
       * C.2.15_Alternative bis auf 0,0004 mm.
       *
       * Gezeichnet wie die Referenz. Ob die angehobene Leiter gewollt ist, sagt die Quelle nicht:
       * C.2.15_Alternative trägt denselben Lauf bis auf eine Ziffer und zeichnet die Leiter wie
       * C.2.14_Alternative. Der Befund steht am Rezept.
       */
      'rescue-aerial-ladder': (bounds) => aerialLadder(bounds, 6.5, 1),
    },
  },
  {
    kind: 'vehicle-land',
    rendition: 'shifted-left-1mm',
    marks: {
      /**
       * C.2.17_Alternative (TGM): der Korb 1,0 mm, der Mast 0,924 mm weiter links als in der
       * Grundfassung; Neigungen und Längen bleiben.
       *
       * | Größe | C.2.17 | C.2.17_Alternative | Versatz |
       * |---|---|---|---|
       * | Fuß, Stumpfkante | (9,7828\|23,8759) / (10,2168\|24,1239) | (8,8589\|23,8759) / (9,2928\|24,1239) | −0,9239 / −0,9240 |
       * | Gehrung am Gelenk | (13,8306\|16,7922) / (14,1689\|17,2081) | (12,9067\|16,7922) / (13,2450\|17,2081) | −0,9239 |
       * | Unterkante oberer Mast am Korb | (20,1975\|15,2502) | (19,2736\|15,2502) | −0,9239 |
       * | Korb außen | 19,7498…24,2499 | 18,7497…23,2497 | −1,0001 / −1,0002 |
       *
       * Gezeichnet ist der gemessene Mastversatz 0,924, nicht 1,0: 0,076 mm Unterschied lägen am
       * Fuß frei sichtbar neben der Referenz. Der obere Mast endet wie in der Grundfassung an der
       * Innenkante der linken Korbseite und wird dadurch 0,076 mm länger; das verdeckt der Korb.
       */
      'rescue-articulated-boom': (bounds) => articulatedBoom(bounds, -0.924, -1),
    },
  },
  {
    kind: 'vehicle-land',
    rendition: 'shifted-left-7mm-jib-5mm',
    marks: {
      /**
       * C.2.27_Alternative („30“): Turm 7 mm weiter links bei x 12, Ausleger 5 statt 4 mm bis
       * x 17, Haken r 2 um (19\|11). Der Haken steht damit nur 6 mm links der Grundfassung.
       *
       * Gemessen an `C.2.27_Feuerwehrkran 30_Alternative.svg`: Turm 11,7499…12,2498 von
       * y 23,9997 bis 10,7498; Ausleger 10,7498…11,2497 bis zur Außenkante x 17,2501; Haken innen
       * (17,2501\|10,9996) → (18,9998\|12,7497) → (20,7500\|10,9996), außen (21,2498\|10,9996) →
       * (18,9998\|13,2496) → (16,7636\|11,2497).
       */
      'crane-lifting': (bounds) => {
        const { cx } = levels(bounds);
        return crane(bounds, cx - 4, 5);
      },
    },
  },
  {
    kind: 'vehicle-land',
    rendition: 'shifted-left-4mm',
    marks: {
      /**
       * C.2.28_Alternative (ohne Lauf): die Grundfassung um 4 mm nach links. Schräge
       * (9\|24) → (19\|14), Mast x 19 von y 11 bis 17, Ausleger y 17 bis x 25.
       *
       * Gemessen an `C.2.28_Teleskoplader_Alternative.svg`: Stumpfkante des Fußes
       * (8,8229\|23,8233) / (9,1764\|24,1768); Mast 18,7497…19,2496 von y 10,9999 bis 17,2501;
       * Ausleger 16,7502…17,2501 bis x 24,9999 — punktgleich mit C.2.28 − 4,0 mm (Abweichung
       * ≤ 0,0005 mm).
       */
      'lifting-clearing': (bounds) => liftingClearing(bounds, -4),
    },
  },
];
