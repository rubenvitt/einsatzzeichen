import { SOURCE_REGISTRY } from '@einsatzzeichen/catalog';
import { reviewSetSummary } from './snapshot-review.js';
import type { SourceSummary } from './snapshot.js';

/**
 * Das Quellenregister als Snapshot-Abschnitt.
 *
 * `citationOf` wird mitexportiert, obwohl nur `sourceSummaries()` es hier braucht: die Zeichen
 * (`snapshot-symbols.ts`) zitieren dieselben Quellen, und eine zweite Zusammensetzung aus
 * Herausgeber, Titel und Auflage wäre eine zweite Zitierform derselben Quelle auf derselben Seite.
 */

/**
 * Zitierform der Quelle. `SourceRecord` führt sie nicht als Feld; sie entsteht aus Herausgeber,
 * Titel und — wo vorhanden — Auflage. Bewusst ohne `scope`: dessen Prosa nennt bei der Baseline
 * das lokale Referenzverzeichnis.
 */
export function citationOf(id: string): string {
  const record = SOURCE_REGISTRY[id as keyof typeof SOURCE_REGISTRY];
  if (record === undefined) throw new Error(`Quelle "${id}" ist nicht registriert.`);
  return record.edition === undefined
    ? `${record.publisher}: ${record.title}`
    : `${record.publisher}: ${record.title} (${record.edition})`;
}

export function sourceSummaries(): SourceSummary[] {
  return Object.values(SOURCE_REGISTRY).map((record) => ({
    id: record.id,
    title: record.title,
    citation: citationOf(record.id),
    ...(record.url !== undefined ? { url: record.url } : {}),
    // Lizenzstand, nicht Reviewstand: `review` steht daneben im selben Objekt.
    status: record.licence.status,
    review: reviewSetSummary(record.review),
  }));
}
