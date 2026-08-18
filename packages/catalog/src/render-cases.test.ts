import { describe, expect, it } from 'vitest';
import { checkA11yMetadata, checkViewBox } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { pictogramRenderId } from './pictograms/index.js';
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
    const ids = RENDER_CASES.map((renderCase) => renderCase.id);
    // 338 seit dem Teilslice E.2: 308 nach LFH-424 plus die 30 gebauten Zeichen aus E.2.
    expect(ids).toHaveLength(338);
    // 3 Belegfälle des Kompositionsmotors (C.1.1, C.1.2, D.3.7) plus die 16 Zeichen aus E-a, die
    // zwölf aus E-b und die neun aus E-c — mit ihnen sind die 37 E.1-Abschnitte vollständig —,
    // dazu 20 aus E-d, fünf aus E-e und fünf aus E-f.
    expect(ids.filter((id) => id.startsWith('recipe.'))).toHaveLength(70);
    expect(ids.filter((id) => id.startsWith('recipe.E.1.'))).toHaveLength(37);
    // **30 und nicht 31.** E.2.6 ist als einziger Abschnitt des Anhangs nicht gebaut; die
    // Begründung steht in `ANHANG_E_D_UNGEBAUT`, die Zahlen in `a11y-contrast-gate.test.ts`.
    // Diese Zeile ist die Stelle, an der die Lücke auffällt, sobald jemand sie schließt.
    expect(ids.filter((id) => id.startsWith('recipe.E.2.'))).toHaveLength(30);
    expect(ids).not.toContain('recipe.E.2.6');
    expect(ids.filter((id) => id.startsWith('capability.'))).toHaveLength(92);
    expect(ids.filter((id) => id.startsWith('state.'))).toHaveLength(67);
    expect(ids.filter((id) => id.startsWith('comms.'))).toHaveLength(53);
    expect(ids.filter((id) => id.startsWith('damage.'))).toHaveLength(28);
    expect(ids.filter((id) => id.startsWith('wildfire.'))).toHaveLength(14);
    // Was übrig bleibt, sind die vierzehn Grundzeichen aus Kapitel 1 — die einzigen
    // Renderfälle ohne Artpräfix. Seit LFH-424 ist das Kapitel vollständig.
    expect(
      ids.filter(
        (id) =>
          !id.startsWith('recipe.') &&
          !id.startsWith('capability.') &&
          !id.startsWith('state.') &&
          !id.startsWith('comms.') &&
          !id.startsWith('damage.') &&
          !id.startsWith('wildfire.'),
      ),
    ).toHaveLength(14);
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
