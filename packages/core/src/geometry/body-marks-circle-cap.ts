import { DEFAULT_STROKE_WIDTH_MM, type Primitive } from '@einsatzzeichen/schema';
import type { BoundsMm } from '../bounds.js';
import { circleSegmentPath } from '../derive/circle.js';
import { noteDerivation } from '../derive/record.js';

/**
 * Die schwarze Kreiskappe der Leitstelle D.2.5 als technische Körpermarke
 * (`circle-solid-cap-4mm`, 2. Oktober 2026).
 *
 * Gemessen an `D.2.5_Leitstelle.svg` (Einheiten × 32/90,709): Die Typo-Ebene der Kontur führt den
 * Kreisring (außen r 12,25, innen r 11,75 um (16|18)) und schließt die Innenfläche oberhalb der
 * Sehne y 28,347 Einheiten = 10,0 mm aus. Schwarz ist damit das Segment zwischen der
 * **Außenkante** des Rings (Scheitel y 5,75) und der Sehne 4 mm unter der Kreisoberkante der
 * Mittellinie (y 6). Das Segment beginnt an der Außenkante, damit es mit dem Körperstrich zu
 * einer Fläche verschmilzt wie in der Referenz.
 *
 * Gegen die Hülle gerechnet: Sehne `minY + 4`, Außenradius `r + Strich/2`. An der vermessenen
 * Hülle (4|6)–(28|30) ergibt das dieselbe Kappe wie das Piktogramm `control-center` auf
 * 0,001 mm.
 */
export const CIRCLE_CAP_CHORD_BELOW_TOP_MM = 4;

export function circleSolidCap4mm(bounds: BoundsMm): Primitive[] {
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const r = (bounds.maxX - bounds.minX) / 2;
  return [{
    type: 'path',
    role: 'pictogram',
    d: circleSegmentPath(
      cx,
      cy,
      r + DEFAULT_STROKE_WIDTH_MM / 2,
      bounds.minY + CIRCLE_CAP_CHORD_BELOW_TOP_MM,
      'top',
    ),
    style: { fill: 'schwarz', stroke: 'none' },
  }];
}

/**
 * Dieselbe Kappe an einer 12-mm-Kreisfassung ohne Giebel (normal, angehoben, gebändert): kein
 * Original zeigt sie dort, die Lage relativ zur Hülle ist von D.2.5 übertragen.
 */
export function transferredCircleSolidCap4mm(bounds: BoundsMm): Primitive[] {
  noteDerivation({
    dimension: 'bodyMarks',
    part: 'Kreiskappe circle-solid-cap-4mm an einer Kreisfassung ohne Giebel',
    basis: 'transferred',
    from: 'D.2.5 (Kappe zwischen Außenkante und Sehne 4 mm unter der Kreisoberkante)',
  });
  return circleSolidCap4mm(bounds);
}
