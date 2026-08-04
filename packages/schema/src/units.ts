/** SVG-Einheiten pro Millimeter bei 72 dpi. Grundlage des gesamten Koordinatensystems. */
export const UNITS_PER_MM = 72 / 25.4;

/**
 * Vergleichstoleranz in SVG-Einheiten. Die BABZ-Referenz enthält Exportrundungen
 * des Illustrator-Plugins (2.834 neben 2.835, 17.008 neben 17.009).
 */
export const TOLERANCE_UNITS = 0.01;

export function mmToUnits(mm: number): number {
  return mm * UNITS_PER_MM;
}

export function unitsToMm(units: number): number {
  return units / UNITS_PER_MM;
}

export function unitsEqual(a: number, b: number, tolerance: number = TOLERANCE_UNITS): boolean {
  return Math.abs(a - b) <= tolerance;
}
