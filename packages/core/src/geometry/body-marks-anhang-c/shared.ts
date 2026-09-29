import type { BoundsMm } from '../../bounds.js';
import {
  DEFAULT_STROKE_WIDTH_MM,
  type BodyMarkId,
  type BodyMarkRenditionId,
  type BodyVariantId,
  type Primitive,
  type SymbolKind,
  type VehicleCategoryId,
} from '@einsatzzeichen/schema';

/*
 * Gemeinsame Bausteine der Anhang-C-Körperfassungen (LFH-786). Maße an der Referenz abgelesen
 * (Umriss auf die Mittellinie zurückgerechnet, mm = pt × 32 / 90,709), Geometrie eigenständig
 * konstruiert.
 */

export type MarkBuild = (bounds: BoundsMm) => Primitive[];
export type MarkTable = Partial<Record<BodyMarkId, MarkBuild>>;

export function stroke(x1: number, y1: number, x2: number, y2: number): Primitive {
  return {
    type: 'line',
    role: 'pictogram',
    x1,
    y1,
    x2,
    y2,
    style: { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

export function disc(cx: number, cy: number, r: number): Primitive {
  return {
    type: 'circle',
    role: 'pictogram',
    cx,
    cy,
    r,
    style: { fill: 'schwarz', stroke: 'none' },
  };
}

/**
 * Die Zange der Anhang-C-Formationen C.1.7 (`cbrn-detection`) und C.1.8 (`decontamination`):
 * dasselbe Motiv wie `crossedSwabs` in `body-marks.ts`, aber mit eigenen Maßen und unter 45°
 * gekreuzt. Gemessen an `C.1.7_CBRN-Erkundungstrupp.svg` und
 * `C.1.8_Staffel Dekontamination  von Personal.svg`.
 *
 * Beide Dateien führen dieselbe Zange relativ zu ihrem Kreuzungspunkt; verschieden sind nur die
 * Lage des Kreuzungspunkts im Körper und die Schaftlänge:
 *
 * | Größe | C.1.7 | C.1.8 | hier gezeichnet |
 * |---|---|---|---|
 * | Kreuzungspunkt | (16,0\|15,5), Körpermitte − 0,5 | (16,0\|17,4965), Körpermitte − 1,5 | Aufrufer |
 * | Kopfradius | 2,2500 / 2,2497 | 2,2500 / 2,2497 | 2,25 |
 * | Kopfmittelpunkte relativ | (∓6,3226\|−3,5) / (±6,3216\|−3,5) | (∓6,3221\|−3,4962) / (±6,3219\|−3,4965) | (∓6,32\|−3,5) |
 * | Schaftenden relativ | (±6,4998\|+6,4999) | (±7,5\|+7,5), die Klammerecken | `reachMm` |
 * | Schaftneigung | 45° (dx/dy 0,9994) | 45° (dx/dy 0,9995) | 45° |
 *
 * Gegenüber der Einzeldarstellung 4.1.1 bis 4.1.3 (Köpfe r 3,75 mm, Schaftneigung dx/dy 0,71) ist
 * das keine Verkleinerung: der Kopf schrumpft auf 0,6, der Kopfabstand auf 0,74, und die Neigung
 * wechselt. Der Schaft endet wie dort am Lotfuß des gegenüberliegenden Kopfmittelpunkts. Der
 * Lotabstand misst in beiden Dateien 1,994 bis 1,996 mm gegen r − 0,25 = 2,0: die Außenkante des
 * Schafts endet 0,006 mm vor dem Kopfkreis. Gezeichnet ist der gemessene Kopfabstand 6,32, nicht
 * die exakt berührende 6,3284.
 */
export function c1Tongs(crossX: number, crossY: number, reachMm: number): Primitive[] {
  const headRadiusMm = 2.25;
  const headOffsetXMm = 6.32;
  const headOffsetYMm = 3.5;

  return [-1, 1].flatMap((side) => {
    // Gekreuzt: der Kopf links oben gehört zum Schaftende rechts unten.
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
 * Ein Körperkontext mit seiner Tabelle. Fehlende Felder heißen „nicht gesetzt“; `vehicleCategory`
 * steht nur dort, wo die Fassung je Fahrwerk verschieden gemessen ist, und `rendition` nur an
 * einer zweiten oder weiteren Fassung desselben Paars (`BODY_MARK_RENDITION_IDS`).
 */
export interface AnhangCContext {
  readonly kind: SymbolKind;
  readonly bodyVariant?: BodyVariantId;
  readonly vehicleCategory?: VehicleCategoryId;
  readonly rendition?: BodyMarkRenditionId;
  readonly marks: MarkTable;
}
