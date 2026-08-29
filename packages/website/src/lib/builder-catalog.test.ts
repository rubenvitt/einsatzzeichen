import { describe, expect, it } from 'vitest';
import { matchesLine, searchCatalog } from './builder-catalog.js';
import type { ReviewSummary, SymbolSummary } from './snapshot.js';

/**
 * Feste Beispielsymbole statt des echten Snapshots — dieselbe Begründung wie in
 * `explorer-search.test.ts`: die Suchlogik soll unabhängig vom jeweiligen Datenstand belegt sein.
 */
function review(status: ReviewSummary['status']): ReviewSummary {
  return { status };
}

function makeSymbol(
  overrides: Partial<SymbolSummary> & Pick<SymbolSummary, 'id' | 'title'>,
): SymbolSummary {
  return {
    slug: overrides.id.toLowerCase(),
    kind: 'catalog-entry',
    spec: { kind: 'formation' },
    drawing: {} as SymbolSummary['drawing'],
    sourceId: 'bbk-babz-2025:E.1.1',
    variant: 'primary',
    source: { id: 'bbk-babz-2025', citation: 'Beispielquelle' },
    chapter: 'Anhang E.1',
    profile: 'default',
    synonyms: [],
    legacyIds: [],
    review: { technical: review('approved'), domain: review('pending') },
    evidence: [],
    ...overrides,
  };
}

const symbols: SymbolSummary[] = [
  makeSymbol({ id: 'recipe.E.1.1', title: 'Löschzug' }),
  makeSymbol({ id: 'recipe.E.1.2', title: 'Löschgruppe' }),
  makeSymbol({ id: 'recipe.F.2.1', title: 'Rettungswagen' }),
];

describe('searchCatalog', () => {
  it('findet über Titel und Kennung, mit Umlaut-Toleranz wie der Explorer', () => {
    expect(searchCatalog(symbols, 'loeschzug', 12).matches.map((s) => s.id)).toEqual([
      'recipe.E.1.1',
    ]);
    expect(searchCatalog(symbols, 'F.2.1', 12).matches.map((s) => s.title)).toEqual([
      'Rettungswagen',
    ]);
  });

  it('deckelt die Liste, meldet aber die volle Trefferzahl', () => {
    const result = searchCatalog(symbols, 'lösch', 1);
    expect(result.matches).toHaveLength(1);
    expect(result.total).toBe(2);
  });

  it('liefert bei leerer Suche den ganzen Katalog (gedeckelt)', () => {
    expect(searchCatalog(symbols, '', 2).total).toBe(3);
  });
});

describe('matchesLine', () => {
  it('unterscheidet keinen, einen, mehrere und abgeschnittene Treffer', () => {
    expect(matchesLine(0, 0)).toMatch(/Kein Zeichen/);
    expect(matchesLine(1, 1)).toBe('Ein Treffer.');
    expect(matchesLine(3, 3)).toBe('3 Treffer.');
    expect(matchesLine(20, 12)).toMatch(/ersten 12 von 20/);
  });
});
