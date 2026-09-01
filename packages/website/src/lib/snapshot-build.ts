import { CONTRAST_EXCEPTIONS, COVERAGE_MANIFEST, SOURCE_REGISTRY } from '@einsatzzeichen/catalog';
import { VALIDATION_RULE_IDS } from '@einsatzzeichen/core';
import { entryKey } from '@einsatzzeichen/schema';
import { coverageAxes } from './snapshot-axes.js';
import { blockerRows, openDomainReviewsByArea } from './snapshot-blockers.js';
import { contrastExceptionText } from './snapshot-contrast.js';
import { toReviewSummary } from './snapshot-review.js';
import { sourceSummaries } from './snapshot-sources.js';
import { symbolForCatalogEntry, symbolForRecipe } from './snapshot-symbols.js';
import { builderVocabulary } from './snapshot-vocabulary.js';
import type { CatalogSnapshot, MatrixRow, SymbolSummary } from './snapshot.js';

/**
 * Nur noch die Orchestrierung: eine Manifestzeile nach der anderen, und am Ende der Snapshot.
 *
 * Was dabei gerechnet, übersetzt und geschwärzt wird, steht seit LFH-503 in den
 * `snapshot-*`-Modulen nebenan — vorher trug diese Datei neun Verantwortungen auf 554 Zeilen, von
 * der Kapitelableitung bis zum Baukastenvokabular. Der Schnitt läuft in eine Richtung: von den
 * Blättern (`snapshot-sections`, `snapshot-redaction`, `snapshot-colors`) über die Ableitungen bis
 * hierher, wo alles zusammenläuft und nichts mehr weitergereicht wird.
 *
 * `buildSnapshot()` bleibt an dieser Stelle und mit dieser Signatur: der Generator und vier Tests
 * importieren sie aus `snapshot-build.js`. Die beiden anderen ehemaligen Exporte sind mit ihrer
 * Verantwortung umgezogen — ein Re-Export von hier wäre eine Attrappe, die den Schnitt wieder
 * einebnet.
 */

/**
 * Der Snapshot. Rein: gleiche Eingabe, gleiche Ausgabe — die einzige Zeitangabe ist `now`.
 *
 * Ausgangspunkt ist das Coverage-Manifest und nicht der Katalog: es ist die Liste, gegen die das
 * Gate prüft. Ein Katalogeintrag ohne Manifestzeile bliebe damit unsichtbar — genau deshalb prüft
 * `snapshot-build.test.ts` die Gegenrichtung gegen `BASE_SYMBOLS` und `RECIPES`.
 */
export function buildSnapshot(now: Date = new Date()): CatalogSnapshot {
  const symbols: SymbolSummary[] = [];
  const matrix: MatrixRow[] = [];
  const slugs = new Map<string, string>();

  for (const row of COVERAGE_MANIFEST.entries) {
    const key = entryKey(row.sourceId, row.variant);
    let symbol: SymbolSummary | undefined;
    if (row.coverage === 'catalog-entry') symbol = symbolForCatalogEntry(row);
    else if (row.coverage === 'composition-recipe') symbol = symbolForRecipe(row);

    if (symbol !== undefined) {
      const taken = slugs.get(symbol.slug);
      if (taken !== undefined) {
        throw new Error(
          `Doppelter Slug "${symbol.slug}": "${taken}" und "${symbol.id}" ergeben denselben Pfad.`,
        );
      }
      slugs.set(symbol.slug, symbol.id);
      symbols.push(symbol);
    }

    matrix.push({
      key,
      sourceId: row.sourceId,
      variant: row.variant,
      title: row.title,
      implementation: row.implementation,
      ...(symbol !== undefined ? { slug: symbol.slug } : {}),
      coverage: row.coverage,
      profile: row.profile,
      technical: toReviewSummary(row.review.technical),
      domain: toReviewSummary(row.review.domain),
      evidence: [...row.testEvidence],
    });
  }

  return {
    generatedAt: now.toISOString(),
    baseline: COVERAGE_MANIFEST.baseline,
    coreVersion: COVERAGE_MANIFEST.coreVersion,
    symbols,
    sources: sourceSummaries(),
    coverage: {
      baseline: COVERAGE_MANIFEST.baseline,
      coreVersion: COVERAGE_MANIFEST.coreVersion,
      scope: [...COVERAGE_MANIFEST.scope],
      entries: COVERAGE_MANIFEST.entries.length,
      sources: Object.keys(SOURCE_REGISTRY).length,
      axes: coverageAxes(),
      blockers: blockerRows(),
      openDomainReviewsByArea: openDomainReviewsByArea(),
      contrastExceptions: CONTRAST_EXCEPTIONS.map(contrastExceptionText),
      matrix,
    },
    builder: builderVocabulary(),
    ruleIds: [...VALIDATION_RULE_IDS],
  };
}
