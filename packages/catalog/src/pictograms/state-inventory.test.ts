import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import { renderSvg } from '@einsatzzeichen/core';
import { PRINT_MONOCHROME_THEME } from '../render-themes.js';
import type { CatalogPictogramDefinition } from './catalog-definition.js';
import { pictogram } from './index.js';
import { ACTIVITY_STATES, STATE_PICTOGRAMS, TENDENCY_STATES } from './states/index.js';

function inventoryTuple(definition: CatalogPictogramDefinition) {
  return [
    definition.section,
    definition.id,
    definition.variant,
    definition.referenceAsset,
  ] as const;
}

function monochromeSvg(definition: CatalogPictogramDefinition): string {
  const drawing: Drawing = {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: definition.primitives,
  };
  return renderSvg(drawing, { size: 64, theme: PRINT_MONOCHROME_THEME });
}

describe('State-Piktogramminventur', () => {
  it('enthält exakt die ausgelieferten Aktivitätsgrade und Tendenzen in Kapitelreihenfolge', () => {
    const expected = [
      [
        '5.8.2.1',
        'state.activity-slightly-increased-outage-up-to-25-percent',
        'primary',
        '5.8.2.1_geringfügig erhöhte Aktivität_bis 25 Prozent Ausfall.svg',
      ],
      [
        '5.8.2.2',
        'state.activity-moderately-increased-outage-up-to-50-percent',
        'primary',
        '5.8.2.2_moderat erhöhte Aktivität_bis 50 Prozent Ausfall.svg',
      ],
      ['5.8.3.1', 'state.tendency-rising', 'primary', '5.8.3.1_Tendenz steigend.svg'],
      ['5.8.3.2', 'state.tendency-unchanged', 'primary', '5.8.3.2_Tendenz unverändert.svg'],
      ['5.8.3.3', 'state.tendency-falling', 'primary', '5.8.3.3_Tendenz fallend.svg'],
    ] as const;

    expect(STATE_PICTOGRAMS.map(inventoryTuple)).toEqual(expected);
    expect(() => pictogram('state.tendency-rising')).not.toThrow();
  });

  it('kodiert die Aktivitätsgrade geometrisch und im Monochromtheme unterscheidbar', () => {
    const outageSectorCounts = ACTIVITY_STATES.map((definition) =>
      definition.primitives.filter(
        (primitive) => primitive.type === 'path' && primitive.style?.fill === 'rot',
      ).length,
    );
    const monochromeSvgs = ACTIVITY_STATES.map(monochromeSvg);

    expect(outageSectorCounts).toEqual([1, 2]);
    expect(new Set(monochromeSvgs).size).toBe(2);
  });

  it('hält die drei Richtungen geometrisch und im Monochromtheme unterscheidbar', () => {
    const serializedPrimitives = TENDENCY_STATES.map((definition) =>
      JSON.stringify(definition.primitives),
    );
    const monochromeSvgs = TENDENCY_STATES.map(monochromeSvg);

    expect(new Set(serializedPrimitives).size).toBe(3);
    expect(new Set(monochromeSvgs).size).toBe(3);
  });

  it('friert Familien- und Gesamtregister tief ein und weist Erweiterungen zur Laufzeit zurück', () => {
    expect(Object.isFrozen(ACTIVITY_STATES)).toBe(true);
    expect(Object.isFrozen(TENDENCY_STATES)).toBe(true);
    expect(Object.isFrozen(STATE_PICTOGRAMS)).toBe(true);

    const mutableStates = STATE_PICTOGRAMS as unknown as CatalogPictogramDefinition[];
    expect(() => mutableStates.push(STATE_PICTOGRAMS[0]!)).toThrow(TypeError);
  });
});
