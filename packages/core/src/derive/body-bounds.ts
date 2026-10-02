import type { BodyVariantId, SymbolKind } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { baseDrawing } from '../geometry/base-symbols.js';
import { profileFor } from '../layout/profiles.js';

/**
 * Die Körperhülle (Mittellinie des Körperstrichs) einer Art und Variante, für jede Körperform.
 *
 * Vermessen ist sie an zehn Profilen (`measuredBodyBoundsMm`); dort gilt der Messwert. An allen
 * anderen ist sie die Hülle des gezeichneten Körperprimitivs — geometrisch exakt, nur nicht
 * gegen ein Original geprüft. Wer an einer Körperform ohne Messung eine Zone oder Textbox
 * begrenzen will, nimmt diese Hülle, statt die Kombination abzulehnen.
 */
export function bodyBoundsMm(kind: SymbolKind, variant?: BodyVariantId): BoundsMm {
  const measured = profileFor(kind, variant).measuredBodyBoundsMm;
  if (measured !== undefined) return measured;
  const body = baseDrawing(kind, variant).children.find((child) => child.role === 'body');
  if (body === undefined) throw new Error(`Grundzeichen "${kind}" hat kein body-Primitiv.`);
  return boundsOfMm(body);
}

/** Ob die Hülle dieser Körperform an einem Original vermessen ist. */
export function bodyBoundsMeasured(kind: SymbolKind, variant?: BodyVariantId): boolean {
  return profileFor(kind, variant).measuredBodyBoundsMm !== undefined;
}
