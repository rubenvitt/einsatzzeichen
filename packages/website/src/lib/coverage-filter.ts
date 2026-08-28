import type { MatrixRow, ReviewSummary } from './snapshot.js';

/**
 * Bereich einer Abschnittsnummer aus `MatrixRow.sourceId` — der Teil vor dem ersten Punkt
 * (`bbk-babz-2025:E.1.1` → `E`, `bbk-babz-2025:4.6.4` → `4`). Dieselbe Bildung wie `areaOf` in
 * `packages/catalog/src/coverage-gate.ts`, mit der `openDomainReviewsByArea()` im Snapshot ihre
 * Bereiche bildet — die Matrixfilter-Insel darf `@einsatzzeichen/catalog` aber nicht importieren
 * (Spec §5.2), deshalb steht die Bildung hier noch einmal als reine Stringoperation auf einem
 * bereits im Snapshot vorhandenen Feld, nicht als zweite Berechnung eigener Zahlen.
 */
export function areaOfSourceId(sourceId: string): string {
  const colon = sourceId.indexOf(':');
  const section = colon === -1 ? sourceId : sourceId.slice(colon + 1);
  const dot = section.indexOf('.');
  return dot === -1 ? section : section.slice(0, dot);
}

/** Filter der Manifestmatrix (Spec §5.4). Jedes gesetzte Feld schränkt ein (UND-Verknüpfung). */
export interface MatrixFilter {
  area?: string;
  technical?: ReviewSummary['status'];
  domain?: ReviewSummary['status'];
  coverage?: MatrixRow['coverage'];
}

/** Reine Filterfunktion — keine Sortierung, kein State. Die Insel hält beides getrennt. */
export function filterMatrix(rows: readonly MatrixRow[], filter: MatrixFilter): MatrixRow[] {
  return rows.filter((row) => {
    if (filter.area !== undefined && areaOfSourceId(row.sourceId) !== filter.area) return false;
    if (filter.technical !== undefined && row.technical.status !== filter.technical) return false;
    if (filter.domain !== undefined && row.domain.status !== filter.domain) return false;
    if (filter.coverage !== undefined && row.coverage !== filter.coverage) return false;
    return true;
  });
}
