import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import { renderSvg } from '@einsatzzeichen/core';
import { PRINT_MONOCHROME_THEME } from '../render-themes.js';
import type { CatalogPictogramDefinition } from './catalog-definition.js';
import { pictogram } from './index.js';
import {
  ACTIVITY_STATES,
  DAMAGE_STATES,
  FIRE_STATES,
  STATE_PICTOGRAMS,
  TENDENCY_STATES,
} from './states/index.js';

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
  it('enthält exakt die ausgelieferten States in Kapitelreihenfolge', () => {
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
      [
        '5.8.2.3',
        'state.activity-significantly-increased-outage-up-to-75-percent',
        'primary',
        '5.8.2.3_deutlich erhöhte Aktivität_bis 75 Prozent Ausfall.svg',
      ],
      [
        '5.8.2.4',
        'state.activity-strongly-increased-total-outage',
        'primary',
        '5.8.2.4_Stark erhöhte Aktivität_Totalausfall.svg',
      ],
      ['5.8.3.1', 'state.tendency-rising', 'primary', '5.8.3.1_Tendenz steigend.svg'],
      ['5.8.3.2', 'state.tendency-unchanged', 'primary', '5.8.3.2_Tendenz unverändert.svg'],
      ['5.8.3.3', 'state.tendency-falling', 'primary', '5.8.3.3_Tendenz fallend.svg'],
      ['5.8.4.1', 'state.damaged', 'primary', '5.8.4.1_Angeschlagen.svg'],
      [
        '5.8.4.2',
        'state.partially-destroyed',
        'primary',
        '5.8.4.2_Teilzerstört.svg',
      ],
      ['5.8.4.3', 'state.destroyed', 'primary', '5.8.4.3_Total zerstört.svg'],
      ['5.8.5.1', 'state.incipient-fire', 'primary', '5.8.5.1_Entstehungsbrand.svg'],
      [
        '5.8.5.2',
        'state.developed-fire',
        'primary',
        '5.8.5.2_fortentwickelter Brand.svg',
      ],
      ['5.8.5.3', 'state.fully-developed-fire', 'primary', '5.8.5.3_Vollbrand.svg'],
    ] as const;

    expect(STATE_PICTOGRAMS.map(inventoryTuple)).toEqual(expected);
    expect(() => pictogram('state.tendency-rising')).not.toThrow();
    expect(() => pictogram('state.damaged')).not.toThrow();
    expect(() => pictogram('state.incipient-fire')).not.toThrow();
  });

  it('kodiert die Aktivitätsgrade geometrisch und im Monochromtheme unterscheidbar', () => {
    const outageSectorCounts = ACTIVITY_STATES.map((definition) =>
      definition.primitives.filter(
        (primitive) => primitive.type === 'path' && primitive.style?.fill === 'rot',
      ).length,
    );
    const monochromeSvgs = ACTIVITY_STATES.map(monochromeSvg);

    expect(outageSectorCounts).toEqual([1, 2, 3, 4]);
    expect(new Set(monochromeSvgs).size).toBe(4);
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
    expect(Object.isFrozen(DAMAGE_STATES)).toBe(true);
    expect(Object.isFrozen(FIRE_STATES)).toBe(true);
    expect(Object.isFrozen(STATE_PICTOGRAMS)).toBe(true);

    const mutableStates = STATE_PICTOGRAMS as unknown as CatalogPictogramDefinition[];
    expect(() => mutableStates.push(STATE_PICTOGRAMS[0]!)).toThrow(TypeError);
  });
});
