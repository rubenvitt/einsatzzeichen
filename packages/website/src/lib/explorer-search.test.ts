import { describe, expect, it } from 'vitest';
import { buildSnapshot } from './snapshot-build.js';
import {
  facetOptions,
  normalize,
  reviewStatusOptions,
  sanitizeFacets,
  searchSymbols,
  type ExplorerFilters,
} from './explorer-search.js';
import type { ReviewSummary, SymbolSummary } from './snapshot.js';

/**
 * Feste Beispielsymbole statt Ausschnitten aus dem echten Snapshot: der Katalog trägt aktuell
 * keine Synonyme oder Legacy-IDs und (spec-konform, AFKzV-Aussetzung) keinen fachlich
 * freigegebenen Eintrag — Tests, die auf `buildSnapshot()` nach genau diesen Fällen suchen,
 * wären hier leer und würden nichts beweisen. Diese Fixtures halten die Suchlogik unabhängig
 * vom jeweiligen Datenstand.
 */
function review(status: ReviewSummary['status']): ReviewSummary {
  return { status };
}

function makeSymbol(overrides: Partial<SymbolSummary> & Pick<SymbolSummary, 'id' | 'title'>): SymbolSummary {
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

const loeschzug = makeSymbol({
  id: 'base.formation',
  title: 'Löschzug',
  synonyms: ['LZ'],
  legacyIds: ['alt-loeschzug'],
  chapter: 'Anhang E.1',
  sourceId: 'bbk-babz-2025:E.1.1',
  profile: 'default',
  spec: { kind: 'formation', organization: 'feuerwehr' },
  review: { technical: review('approved'), domain: review('approved') },
});

const rettungswagen = makeSymbol({
  id: 'base.vehicle-rescue',
  title: 'Rettungswagen',
  synonyms: [],
  legacyIds: [],
  chapter: 'Anhang F.1',
  sourceId: 'bbk-babz-2025:F.1.1',
  source: { id: 'phjardas-tz', citation: 'Andere Quelle' },
  profile: 'ems',
  spec: { kind: 'vehicle-land', organization: 'thw' },
  review: { technical: review('deviation'), domain: review('pending') },
});

/** Grundzeichen ohne Organisationsbezug — belegt am echten Snapshot: 25 von 256 Symbolen. */
const grundzeichenOhneOrganisation = makeSymbol({
  id: 'base.formation-neutral',
  title: 'Formation ohne Organisation',
  chapter: 'Anhang E.1',
  source: { id: 'katalog-generisch', citation: 'Katalog, generisch' },
  profile: 'default',
  spec: { kind: 'formation' },
  review: { technical: review('approved'), domain: review('pending') },
});

const fixtures = [loeschzug, rettungswagen, grundzeichenOhneOrganisation];

describe('searchSymbols', () => {
  it('leere Suche zeigt alles', () => {
    expect(searchSymbols(fixtures, '', {}).length).toBe(fixtures.length);
    const { symbols } = buildSnapshot();
    expect(searchSymbols(symbols, '', {}).length).toBe(symbols.length);
  });

  it('findet über den Titel', () => {
    expect(searchSymbols(fixtures, 'Löschzug', {})).toEqual([loeschzug]);
  });

  it('findet über Synonym und Legacy-ID', () => {
    expect(searchSymbols(fixtures, 'LZ', {})).toContainEqual(loeschzug);
    expect(searchSymbols(fixtures, 'alt-loeschzug', {})).toContainEqual(loeschzug);
  });

  it('findet über die semantische ID', () => {
    expect(searchSymbols(fixtures, 'base.vehicle-rescue', {})).toEqual([rettungswagen]);
  });

  it('Umlaute sind egal', () => {
    const a = searchSymbols(fixtures, 'löschzug', {});
    const b = searchSymbols(fixtures, 'loeschzug', {});
    expect(a).toEqual(b);
    expect(a).toEqual([loeschzug]);
  });

  it('Facetten schneiden (organization, chapter, sourceId, profile, technical, domain)', () => {
    expect(searchSymbols(fixtures, '', { organization: 'feuerwehr' })).toEqual([loeschzug]);
    expect(searchSymbols(fixtures, '', { chapter: 'Anhang F.1' })).toEqual([rettungswagen]);
    expect(searchSymbols(fixtures, '', { sourceId: 'bbk-babz-2025' })).toEqual([loeschzug]);
    expect(searchSymbols(fixtures, '', { profile: 'ems' })).toEqual([rettungswagen]);
    expect(searchSymbols(fixtures, '', { technical: 'deviation' })).toEqual([rettungswagen]);
    expect(searchSymbols(fixtures, '', { domain: 'approved' })).toEqual([loeschzug]);
  });

  it('Facetten und Suche verknüpfen sich per UND', () => {
    expect(searchSymbols(fixtures, 'Löschzug', { profile: 'ems' })).toEqual([]);
    expect(searchSymbols(fixtures, 'Löschzug', { profile: 'default' })).toEqual([loeschzug]);
  });

  it('unbekannte Suche liefert ein leeres Ergebnis', () => {
    expect(searchSymbols(fixtures, 'xyzzy-kein-treffer-nirgendwo', {})).toEqual([]);
  });

  it('läuft gegen den echten Snapshot: technische Freigabe filtert korrekt', () => {
    const { symbols } = buildSnapshot();
    const approved = searchSymbols(symbols, '', { technical: 'approved' });
    expect(approved.length).toBeGreaterThan(0);
    for (const s of approved) expect(s.review.technical.status).toBe('approved');
  });
});

describe('normalize', () => {
  it('setzt auf Kleinschreibung und bildet Umlaute konsistent ab', () => {
    expect(normalize('Löschzug')).toBe(normalize('loeschzug'));
    expect(normalize('GROSS')).toBe(normalize('gross'));
    expect(normalize('Größe')).toBe(normalize('Groesse'));
  });
});

describe('facetOptions', () => {
  it('"Alle" zählt alle Symbole, auch die ohne Facettenwert', () => {
    // grundzeichenOhneOrganisation trägt kein `spec.organization` — genau der Fall, in dem die
    // Summe der Options-Zähler kleiner ist als die Gesamtzahl der Symbole (Fund aus Review 1).
    const group = facetOptions(fixtures, (s) => s.spec.organization, (id) => id);
    const summedOptionCounts = group.options.reduce((sum, option) => sum + option.count, 0);
    expect(group.total).toBe(fixtures.length);
    expect(summedOptionCounts).toBeLessThan(group.total);
    expect(summedOptionCounts).toBe(2); // loeschzug + rettungswagen, nicht grundzeichenOhneOrganisation
  });

  it('"Alle" entspricht der Summe, wenn jedes Symbol einen Wert trägt', () => {
    const group = facetOptions(fixtures, (s) => s.chapter, (id) => id);
    const summedOptionCounts = group.options.reduce((sum, option) => sum + option.count, 0);
    expect(summedOptionCounts).toBe(group.total);
  });

  it('läuft gegen den echten Snapshot: 25 von 256 Symbolen ohne Organisation', () => {
    const { symbols } = buildSnapshot();
    const group = facetOptions(symbols, (s) => s.spec.organization, (id) => id);
    const summedOptionCounts = group.options.reduce((sum, option) => sum + option.count, 0);
    expect(group.total).toBe(symbols.length);
    expect(group.total - summedOptionCounts).toBe(25);
  });
});

describe('reviewStatusOptions', () => {
  it('"Alle" entspricht der Gesamtzahl — jedes Symbol trägt einen Reviewstatus', () => {
    const group = reviewStatusOptions(fixtures, 'technical', (status) => status);
    expect(group.total).toBe(fixtures.length);
    expect(group.options.reduce((sum, option) => sum + option.count, 0)).toBe(fixtures.length);
  });

  it('führt nur tatsächlich vorkommende Status auf', () => {
    // Keines der Fixture-Symbole trägt `domain: 'deviation'`.
    const group = reviewStatusOptions(fixtures, 'domain', (status) => status);
    expect(group.options.map((o) => o.value)).not.toContain('deviation');
  });
});

describe('sanitizeFacets', () => {
  const validValues: Record<Exclude<keyof ExplorerFilters, 'q'>, readonly string[]> = {
    org: ['feuerwehr', 'thw'],
    kapitel: ['Anhang E.1', 'Anhang F.1'],
    quelle: ['bbk-babz-2025', 'phjardas-tz'],
    profil: ['default', 'ems'],
    technisch: ['approved', 'deviation'],
    fachlich: ['pending'],
  };

  it('lässt bekannte Werte und die Suche unangetastet', () => {
    const raw: ExplorerFilters = {
      q: 'löschzug',
      org: 'feuerwehr',
      kapitel: 'Anhang E.1',
      quelle: '',
      profil: '',
      technisch: '',
      fachlich: '',
    };
    expect(sanitizeFacets(raw, validValues)).toEqual(raw);
  });

  it('verwirft Werte, die keine Auswahlbox anbietet (z. B. aus einem veralteten Link)', () => {
    const raw: ExplorerFilters = {
      q: '',
      org: 'bogus-org',
      kapitel: 'Anhang E.1',
      quelle: '',
      profil: '',
      technisch: 'genehmigt',
      fachlich: '',
    };
    expect(sanitizeFacets(raw, validValues)).toEqual({
      q: '',
      org: '',
      kapitel: 'Anhang E.1',
      quelle: '',
      profil: '',
      technisch: '',
      fachlich: '',
    });
  });
});
