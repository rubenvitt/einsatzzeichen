import { describe, expect, it } from 'vitest';
import { areaOfSourceId, filterMatrix, type MatrixFilter } from './coverage-filter.js';
import type { MatrixRow, ReviewSummary } from './snapshot.js';

function review(status: ReviewSummary['status']): ReviewSummary {
  return { status };
}

function row(overrides: Partial<MatrixRow> & Pick<MatrixRow, 'key' | 'sourceId'>): MatrixRow {
  return {
    title: overrides.title ?? 'Titel',
    implementation: overrides.implementation ?? 'base.formation',
    coverage: overrides.coverage ?? 'catalog-entry',
    variant: overrides.variant ?? 'primary',
    profile: overrides.profile ?? 'bund',
    technical: overrides.technical ?? review('approved'),
    domain: overrides.domain ?? review('pending'),
    evidence: overrides.evidence ?? [],
    ...overrides,
  };
}

const rows: MatrixRow[] = [
  row({
    key: 'e-1-1',
    sourceId: 'bbk-babz-2025:E.1.1',
    title: 'Feuerwehr Gruppe',
    coverage: 'catalog-entry',
    technical: review('approved'),
    domain: review('pending'),
    slug: 'e-1-1',
  }),
  row({
    key: 'f-1-1',
    sourceId: 'bbk-babz-2025:F.1.1',
    title: 'Medizinische Task Force',
    coverage: 'composition-recipe',
    technical: review('approved'),
    domain: review('deviation'),
    slug: 'f-1-1',
  }),
  row({
    key: '4.6.4',
    sourceId: 'bbk-babz-2025:4.6.4',
    title: 'Organisationsfarbe',
    coverage: 'element',
    technical: review('approved'),
    domain: review('approved'),
    // Elemente haben keine Symbolseite — bewusst kein slug (Spec: MatrixRow.slug ist optional).
  }),
];

describe('areaOfSourceId', () => {
  it('bildet den Bereich vor dem ersten Punkt der Abschnittsnummer, wie areaOf in coverage-gate.ts', () => {
    expect(areaOfSourceId('bbk-babz-2025:E.1.1')).toBe('E');
    expect(areaOfSourceId('bbk-babz-2025:4.6.4')).toBe('4');
    expect(areaOfSourceId('bbk-babz-2025:1')).toBe('1');
  });
});

describe('filterMatrix', () => {
  it('liefert bei leerem Filter alle Zeilen unverändert', () => {
    const filter: MatrixFilter = {};
    expect(filterMatrix(rows, filter)).toEqual(rows);
  });

  it('filtert nach Bereich (Teil der Abschnittsnummer vor dem ersten Punkt)', () => {
    const filter: MatrixFilter = { area: 'E' };
    expect(filterMatrix(rows, filter).map((r) => r.key)).toEqual(['e-1-1']);
  });

  it('verknüpft technisch, fachlich und Art als UND, nicht als ODER', () => {
    const filter: MatrixFilter = { technical: 'approved', domain: 'approved', coverage: 'element' };
    expect(filterMatrix(rows, filter).map((r) => r.key)).toEqual(['4.6.4']);

    // Dieselben Einzelwerte, aber ohne coverage-Einschränkung: zwei Zeilen erfüllen
    // technical/domain approved+approved nicht — nur die Elementzeile tut es, das UND ist hier
    // an technical+domain allein schon selektiv genug, um die ODER-Verwechslung zu entlarven.
    const looser: MatrixFilter = { domain: 'deviation' };
    expect(filterMatrix(rows, looser).map((r) => r.key)).toEqual(['f-1-1']);
  });
});
