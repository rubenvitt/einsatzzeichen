import { describe, expect, it } from 'vitest';
import { checkA11yMetadata, checkViewBox } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { pictogramRenderId } from './pictograms/index.js';
import { STATE_PICTOGRAMS } from './pictograms/states/index.js';
import { RENDER_CASES } from './test-support/render-cases.js';

describe('vollständige Renderfallmenge', () => {
  it('bildet Piktogrammvarianten eindeutig auf Render-IDs ab', () => {
    expect(pictogramRenderId({ id: 'capability.fire-fighting', variant: 'primary' })).toBe(
      'capability.fire-fighting',
    );
    expect(pictogramRenderId({ id: 'capability.fire-fighting', variant: 'alternative' })).toBe(
      'capability.fire-fighting.alternative',
    );
  });

  it('ist nicht leer und über die Implementierungs-ID eindeutig', () => {
    const stateDepictions = STATE_PICTOGRAMS.length;
    const ids = RENDER_CASES.map((renderCase) => renderCase.id);
    expect(ids).toHaveLength(103 + stateDepictions);
    expect(ids.filter((id) => id.startsWith('recipe.'))).toHaveLength(3);
    expect(ids.filter((id) => id.startsWith('capability.'))).toHaveLength(92);
    expect(ids.filter((id) => id.startsWith('state.'))).toHaveLength(stateDepictions);
    expect(
      ids.filter(
        (id) =>
          !id.startsWith('recipe.') &&
          !id.startsWith('capability.') &&
          !id.startsWith('state.'),
      ),
    ).toHaveLength(8);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('entspricht exakt allen Manifest-Einträgen mit SVG-Snapshot-Nachweis', () => {
    const cases = RENDER_CASES.map((renderCase) => renderCase.id).sort();
    const claimed = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.testEvidence.includes('svg-snapshot'))
      .map((entry) => pictogramRenderId({ id: entry.implementation, variant: entry.variant }))
      .sort();
    expect(cases).toEqual(claimed);
  });

  it.each(RENDER_CASES)('$id trägt vollständige semantische Metadaten', ({ drawing }) => {
    expect(checkA11yMetadata(drawing)).toEqual([]);
  });

  it.each(RENDER_CASES)('$id verwendet die kanonische viewBox und clippt keine Geometrie', ({ drawing }) => {
    expect(drawing.viewBox).toEqual(DEFAULT_VIEWBOX_MM);
    expect(checkViewBox(drawing)).toEqual([]);
  });
});
