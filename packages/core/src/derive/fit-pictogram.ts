import { DEFAULT_STROKE_WIDTH_MM, type Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { mapPrimitive, uniformAbout, unionBounds } from './affine.js';
import { inscribedRect, type BodyRegion } from './body-region.js';

/**
 * Einzeldarstellungen aus Kapitel 4 ins Innenfeld eines Körpers einpassen — die Ableitung für
 * jedes Paar aus Fähigkeit und Körperform, an dem die Referenz keine eigene Körperfassung zeigt
 * (Entscheidung vom 2. Oktober 2026; sie löst `capabilities-pictogram-overflows-body` ab).
 *
 * **Woraus die Zahlen stammen.**
 * - Gleichmäßig verkleinert, Strich 0,5 mm: so stehen die 44 verkleinerten Körperfassungen
 *   (`CAPABILITY_INSET_RULE.strokeWidthKept`, `commonScale`). Eine Einzeldarstellung mit
 *   0,4-mm-Strich (4.7.18) wird wie ihre Fassung im Rüstwagen mit 0,5 mm gezeichnet.
 * - Das Innenfeld ist das größte Rechteck mit dem Seitenverhältnis des Piktogramms in der freien
 *   Körperfläche, um den Faktor 0,8 verkleinert: Das ist das Verhältnis der Fähigkeitsbox
 *   24 × 16 mm zur Formation 30 × 20 mm in beiden Achsen. An der Formation ergibt die Ableitung
 *   also genau die Einpassung in die Box (`fitToBox`).
 * - Höchstens 0,93, der größte Faktor einer verkleinerten Fassung (I.1.9#alternative). Die
 *   Referenzspanne beginnt bei 0,30 (F.2.13); an kleinen Körpern kann die Einpassung darunter
 *   liegen, ein Überstand wäre schlimmer als ein kleines Zeichen.
 *
 * `fitToBox` ist als Regel *der Referenz* widerlegt: keine vermessene Fassung entsteht so. Als
 * Ableitung für Paare ohne Fassung ist sie die nächstliegende, und jede Zeichnung trägt den
 * Vermerk.
 */
export const CAPABILITY_FIT_INNER_FIELD_RATIO = 0.8;
export const CAPABILITY_FIT_MAX_SCALE = 0.93;
/** Abstand zwischen nebeneinander eingepassten Piktogrammen (Mittellinie zu Mittellinie der Hüllen). */
export const CAPABILITY_FIT_GAP_MM = 1;

function hullOf(primitives: readonly Primitive[]): BoundsMm {
  return unionBounds(primitives.map((primitive) => boundsOfMm(primitive)));
}

function shrinkAboutCenter(box: BoundsMm, ratio: number): BoundsMm {
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  const hw = ((box.maxX - box.minX) / 2) * ratio;
  const hh = ((box.maxY - box.minY) / 2) * ratio;
  return { minX: cx - hw, minY: cy - hh, maxX: cx + hw, maxY: cy + hh };
}

/**
 * Passt eine oder mehrere Einzeldarstellungen in das Innenfeld der Fläche `region` ein und gibt
 * je Darstellung die abgebildeten Primitive zurück, in derselben Reihenfolge.
 *
 * Mehrere stehen **nebeneinander** in einer Reihe mit gemeinsamem Faktor, jede senkrecht mittig.
 * Kein Original zeigt zwei Kapitel-4-Piktogramme in der Boxfassung
 * (`CAPABILITY_COMBINATION_RULES`, `box.arrangement` offen); deckungsgleich übereinander, wie der
 * Motor sie bis zum 2. Oktober 2026 setzte, wären sie unlesbar. Die Reihe ist deshalb konstruiert,
 * nicht übertragen.
 */
export function fitPictograms(
  sets: readonly (readonly Primitive[])[],
  region: BodyRegion,
): Primitive[][] {
  if (sets.length === 0) return [];
  const hulls = sets.map(hullOf);
  const widths = hulls.map((hull) => hull.maxX - hull.minX);
  const heights = hulls.map((hull) => hull.maxY - hull.minY);
  const totalWidth = widths.reduce((sum, width) => sum + width, 0);
  const maxHeight = Math.max(...heights);
  const field = shrinkAboutCenter(
    inscribedRect(region, totalWidth / maxHeight),
    CAPABILITY_FIT_INNER_FIELD_RATIO,
  );
  const gaps = CAPABILITY_FIT_GAP_MM * (sets.length - 1);
  const k = Math.min(
    (field.maxX - field.minX - gaps) / totalWidth,
    (field.maxY - field.minY) / maxHeight,
    CAPABILITY_FIT_MAX_SCALE,
  );
  const rowWidth = k * totalWidth + gaps;
  const cy = (field.minY + field.maxY) / 2;
  let left = (field.minX + field.maxX) / 2 - rowWidth / 2;
  return sets.map((primitives, index) => {
    const hull = hulls[index] as BoundsMm;
    const width = (widths[index] as number) * k;
    const map = uniformAbout(
      [(hull.minX + hull.maxX) / 2, (hull.minY + hull.maxY) / 2],
      [left + width / 2, cy],
      k,
    );
    left += width + CAPABILITY_FIT_GAP_MM;
    return primitives.map((primitive) =>
      mapPrimitive(map, primitive, { strokeWidthMm: DEFAULT_STROKE_WIDTH_MM }));
  });
}
