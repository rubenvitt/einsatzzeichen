import type { Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineState, type CatalogPictogramDefinition } from '../catalog-definition.js';
import { STATE_STROKE_WIDTH_MM } from './authoring.js';

/**
 * Schadensgrade 5.8.4: rote Diagonalscharen, Maße an der Referenz abgelesen, Geometrie
 * eigenständig konstruiert.
 *
 * Jede Diagonale ist 26 mm lang (Endpunkte ±6,5·√2 mm vom Mittelpunkt 16/16 in beiden Achsen),
 * 0,5 mm stark, mit stumpfen Enden. Parallele Diagonalen liegen senkrecht gemessen 7 mm
 * auseinander. Der Schadensgrad ist die Zahl der Diagonalen je Richtung: 1 (ein X), 2 (ein
 * gedrehtes Doppelkreuz), 3 (ein gedrehtes Gitter mit vier Feldern).
 */
const DAMAGE_STROKE = {
  fill: 'none',
  stroke: 'rot',
  strokeWidth: STATE_STROKE_WIDTH_MM,
} as const satisfies Style;

const CENTER_MM = 16;
/** Halbe Diagonale je Achse: 13 mm halbe Länge unter 45°. */
const HALF_MM = 13 / Math.SQRT2;
/** Senkrechter Abstand paralleler Diagonalen. */
const SPACING_MM = 7;

const DAMAGE_CONTRAST = [
  {
    foreground: 'rot',
    background: 'surface',
    context: 'rote Schadensmarken auf Ausgabeoberfläche',
  },
] as const;

function damageLine(x1: number, y1: number, x2: number, y2: number): Primitive {
  return {
    type: 'line',
    role: 'pictogram',
    x1,
    y1,
    x2,
    y2,
    style: DAMAGE_STROKE,
  };
}

/**
 * `count` Diagonalen je Richtung, symmetrisch um die Mitte. Der senkrechte Versatz `o` verschiebt
 * die Mittellinie um o/√2 in x und y; eine fallende Diagonale („\") wandert dabei nach rechts
 * oben, eine steigende („/") nach rechts unten.
 */
function damageLattice(count: number): readonly Primitive[] {
  const offsets = Array.from(
    { length: count },
    (_, index) => ((index - (count - 1) / 2) * SPACING_MM) / Math.SQRT2,
  );
  const falling = offsets.map((shift) =>
    damageLine(
      CENTER_MM + shift - HALF_MM,
      CENTER_MM - shift - HALF_MM,
      CENTER_MM + shift + HALF_MM,
      CENTER_MM - shift + HALF_MM,
    ),
  );
  const rising = offsets.map((shift) =>
    damageLine(
      CENTER_MM + shift + HALF_MM,
      CENTER_MM + shift - HALF_MM,
      CENTER_MM + shift - HALF_MM,
      CENTER_MM + shift + HALF_MM,
    ),
  );
  return [...falling, ...rising];
}

/** Mittellinienhülle einer Schar aus `count` Diagonalen je Richtung. */
function latticeBox(count: number): {
  xMm: number;
  yMm: number;
  widthMm: number;
  heightMm: number;
} {
  const reach = HALF_MM + ((count - 1) / 2) * (SPACING_MM / Math.SQRT2);
  return {
    xMm: CENTER_MM - reach,
    yMm: CENTER_MM - reach,
    widthMm: 2 * reach,
    heightMm: 2 * reach,
  };
}

export const DAMAGE_STATES = deepFreeze([
  defineState({
    section: '5.8.4.1',
    id: 'damaged',
    title: 'Angeschlagen',
    referenceAsset: '5.8.4.1_Angeschlagen.svg',
    box: latticeBox(1),
    contrastPairs: DAMAGE_CONTRAST,
    primitives: damageLattice(1),
  }),
  defineState({
    section: '5.8.4.2',
    id: 'partially-destroyed',
    title: 'Teilzerstört',
    referenceAsset: '5.8.4.2_Teilzerstört.svg',
    box: latticeBox(2),
    contrastPairs: DAMAGE_CONTRAST,
    primitives: damageLattice(2),
  }),
  defineState({
    section: '5.8.4.3',
    id: 'destroyed',
    title: 'Total zerstört',
    referenceAsset: '5.8.4.3_Total zerstört.svg',
    box: latticeBox(3),
    contrastPairs: DAMAGE_CONTRAST,
    primitives: damageLattice(3),
  }),
] satisfies readonly CatalogPictogramDefinition[]);
