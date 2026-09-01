import { describe, expect, it } from 'vitest';
import {
  explorerFacetGroups,
  organizationLabels,
  validFacetValues,
} from './explorer-facets.js';
import type { BuilderVocabulary, ReviewSummary, SymbolSummary } from './snapshot.js';

/**
 * Feste Beispielsymbole statt Ausschnitten aus dem echten Snapshot — dieselbe Begründung wie in
 * `explorer-search.test.ts`: der Datenstand des Katalogs soll nicht darüber entscheiden, ob diese
 * Tests etwas beweisen. Geprüft wird die Ableitung (LFH-500), nicht der Katalog.
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
    source: { id: 'bbk-babz-2025', citation: 'BBK/BABZ 2025' },
    chapter: 'Anhang E.1',
    profile: 'default',
    synonyms: [],
    legacyIds: [],
    review: { technical: review('approved'), domain: review('pending') },
    evidence: [],
    ...overrides,
  };
}

const VOCABULARY: BuilderVocabulary = {
  organization: [
    { id: 'feuerwehr', label: 'Feuerwehr' },
    { id: 'thw', label: 'THW' },
  ],
};

const SYMBOLS: SymbolSummary[] = [
  makeSymbol({
    id: 'a',
    title: 'Löschzug',
    spec: { kind: 'formation', organization: 'feuerwehr' },
  }),
  makeSymbol({
    id: 'b',
    title: 'Bergungsgruppe',
    spec: { kind: 'formation', organization: 'thw' },
    chapter: 'Kapitel 4.6',
    profile: 'bos',
    source: { id: 'phjardas-tz', citation: 'taktische-zeichen (Vergleichsquelle)' },
    review: { technical: review('deviation'), domain: review('pending') },
  }),
  // Ohne Organisation: zählt in `total`, aber zu keiner Option (siehe `FacetGroup`).
  makeSymbol({ id: 'c', title: 'Grundzeichen' }),
];

/** Kurzfassung wie `statusMark(...).shortLabel`, ohne die React-Komponente zu ziehen. */
const statusLabel = (axis: 'technical' | 'domain', status: ReviewSummary['status']): string =>
  `${axis === 'technical' ? 'technisch' : 'fachlich'}:${status}`;

describe('organizationLabels', () => {
  it('bildet Kennung auf die deutsche Bezeichnung ab', () => {
    expect(organizationLabels(VOCABULARY).get('thw')).toBe('THW');
  });

  it('bleibt leer, wenn der Snapshot kein Organisationsvokabular trägt', () => {
    expect(organizationLabels({}).size).toBe(0);
  });
});

describe('explorerFacetGroups', () => {
  const groups = explorerFacetGroups(SYMBOLS, VOCABULARY, statusLabel);

  it('beschriftet Organisationen aus dem Vokabular, nicht mit der Kennung', () => {
    expect(groups.organization.options).toEqual([
      { value: 'feuerwehr', label: 'Feuerwehr', count: 1 },
      { value: 'thw', label: 'THW', count: 1 },
    ]);
  });

  it('zählt Symbole ohne Organisation in `total`, aber in keine Option', () => {
    expect(groups.organization.total).toBe(3);
    expect(groups.organization.options.reduce((sum, o) => sum + o.count, 0)).toBe(2);
  });

  it('beschriftet die Quelle mit ihrer Zitierform aus den Symbolen', () => {
    expect(groups.source.options).toContainEqual({
      value: 'phjardas-tz',
      label: 'taktische-zeichen (Vergleichsquelle)',
      count: 1,
    });
  });

  it('leitet Kapitel und Profil ohne Vokabular ab', () => {
    expect(groups.chapter.options.map((o) => o.value)).toEqual(['Anhang E.1', 'Kapitel 4.6']);
    expect(groups.profile.options.map((o) => o.value)).toEqual(['bos', 'default']);
  });

  it('reicht Achse und Status an die Statusbeschriftung durch', () => {
    expect(groups.technical.options.map((o) => o.label)).toContain('technisch:approved');
    expect(groups.domain.options).toEqual([
      { value: 'pending', label: 'fachlich:pending', count: 3 },
    ]);
  });

  /**
   * Ohne Organisationsvokabular fällt die Beschriftung auf die Kennung zurück, statt beim Lesen
   * einer fehlenden Liste zu werfen — der Snapshot kommt seit LFH-500 über die Leitung.
   */
  it('kommt ohne Vokabular aus und zeigt dann die Kennung', () => {
    const bare = explorerFacetGroups(SYMBOLS, {}, statusLabel);
    expect(bare.organization.options.map((o) => o.label)).toEqual(['feuerwehr', 'thw']);
  });
});

describe('validFacetValues', () => {
  it('gibt je URL-Feld genau die Werte, die eine Auswahlbox anbietet', () => {
    expect(validFacetValues(explorerFacetGroups(SYMBOLS, VOCABULARY, statusLabel))).toEqual({
      org: ['feuerwehr', 'thw'],
      kapitel: ['Anhang E.1', 'Kapitel 4.6'],
      // Sortiert nach Beschriftung, nicht nach Kennung: „BBK/BABZ 2025" vor „taktische-zeichen …".
      quelle: ['bbk-babz-2025', 'phjardas-tz'],
      profil: ['bos', 'default'],
      technisch: ['approved', 'deviation'],
      fachlich: ['pending'],
    });
  });

  it('lässt einen leeren Katalog nicht in undefinierte Listen laufen', () => {
    const empty = validFacetValues(explorerFacetGroups([], {}, statusLabel));
    expect(Object.values(empty).every((values) => values.length === 0)).toBe(true);
  });
});
