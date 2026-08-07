import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import { renderSvg } from '@einsatzzeichen/core';
import { PRINT_MONOCHROME_THEME } from '../render-themes.js';
import type { CatalogPictogramDefinition } from './catalog-definition.js';
import { pictogram, pictogramRenderId } from './index.js';
import {
  ACTIVITY_STATES,
  ANIMAL_STATES,
  DAMAGE_STATES,
  FIRE_STATES,
  PERSON_STATES,
  STATE_PICTOGRAMS,
  TACTICS_HAZARDS_STATES,
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
        '5.8.1.1',
        'state.tactical-rescue',
        'primary',
        '5.8.1.1_Einsatztaktik_Retten.svg',
      ],
      [
        '5.8.1.2',
        'state.tactical-attack',
        'primary',
        '5.8.1.2_Einsatztaktik_Angreifen.svg',
      ],
      [
        '5.8.1.3',
        'state.tactical-defense',
        'primary',
        '5.8.1.3_Einsatztaktik_Verteidigen.svg',
      ],
      [
        '5.8.1.4',
        'state.tactical-retreat',
        'primary',
        '5.8.1.4_Einsatztaktik_Rückzug.svg',
      ],
      [
        '5.8.1.5',
        'state.flooded-area',
        'primary',
        '5.8.1.5_Überschwemmtes Gebiet.svg',
      ],
      [
        '5.8.1.6',
        'state.water-ingress-hazard',
        'primary',
        '5.8.1.6_Gefahr durch Wassereinbruch.svg',
      ],
      [
        '5.8.1.7',
        'state.hazardous-substances',
        'primary',
        '5.8.1.7_Gefährliche Stoffe.svg',
      ],
      [
        '5.8.1.7',
        'state.hazardous-substances',
        'alternative',
        '5.8.1.7_Gefährliche Stoffe_Chlor.svg',
      ],
      [
        '5.8.1.13',
        'state.suspected-situation',
        'primary',
        '5.8.1.13_Hinweis auf Vermutung.svg',
      ],
      [
        '5.8.1.13',
        'state.suspected-situation',
        'alternative',
        '5.8.1.13_Hinweis auf Vermutung_2.svg',
      ],
      [
        '5.8.1.14',
        'state.acute-situation',
        'primary',
        '5.8.1.14_Hinweis auf akute Situation.svg',
      ],
      [
        '5.8.1.14',
        'state.acute-situation',
        'alternative',
        '5.8.1.14_Hinweis auf akute Situation_2.svg',
      ],
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
      ['5.8.6.1', 'state.sick-animal', 'primary', '5.8.6.1_erkranktes Tier.svg'],
      [
        '5.8.6.2',
        'state.contaminated-animal',
        'primary',
        '5.8.6.2_kontaminiertes Tier.svg',
      ],
      [
        '5.8.6.2',
        'state.contaminated-animal',
        'alternative',
        '5.8.6.2_kontaminiertes Tier_K.svg',
      ],
      ['5.8.6.3', 'state.dead-animal', 'primary', '5.8.6.3_Totes Tier.svg'],
      ['5.8.8.1', 'state.person-uninjured', 'primary', '5.8.8.1_Person Unverletz.svg'],
      ['5.8.8.2', 'state.person-affected', 'primary', '5.8.8.2_Person Betroffen.svg'],
      ['5.8.8.3', 'state.person-injured', 'primary', '5.8.8.3_Person Verletzt.svg'],
      [
        '5.8.8.4',
        'state.person-injured-triage-category',
        'primary',
        '5.8.8.4_Person Verletzt_Sichtungskategorie.svg',
      ],
      [
        '5.8.8.5',
        'state.person-injured-transport-priority',
        'primary',
        '5.8.8.5_Person Verletzt_Transportpriorität.svg',
      ],
      [
        '5.8.8.6',
        'state.person-contaminated',
        'primary',
        '5.8.8.6_Person Kontaminiert.svg',
      ],
      [
        '5.8.8.6',
        'state.person-contaminated',
        'alternative',
        '5.8.8.6_Person Kontaminiert_Alternative.svg',
      ],
      ['5.8.8.7', 'state.person-dead', 'primary', '5.8.8.7_Person Tot.svg'],
      ['5.8.8.8', 'state.person-missing', 'primary', '5.8.8.8_Person Vermisst.svg'],
      [
        '5.8.8.9',
        'state.person-in-water-danger',
        'primary',
        '5.8.8.9_Person in Wassergefahr.svg',
      ],
      [
        '5.8.8.10',
        'state.person-in-distress',
        'primary',
        '5.8.8.10_Person in Zwangslage.svg',
      ],
      [
        '5.8.8.11',
        'state.person-rescued',
        'primary',
        '5.8.8.11_Person gerettet.svg',
      ],
      [
        '5.8.8.12',
        'state.person-to-be-transported',
        'primary',
        '5.8.8.12_Person zu transportieren.svg',
      ],
      [
        '5.8.8.13',
        'state.person-in-transport',
        'primary',
        '5.8.8.13_Transport einer Person.svg',
      ],
      [
        '5.8.8.14',
        'state.person-transported',
        'primary',
        '5.8.8.14_Person transportiert.svg',
      ],
      [
        '5.8.8.15',
        'state.person-needing-special-care',
        'primary',
        '5.8.8.15_Person besonders betreuungsbedürftig.svg',
      ],
      [
        '5.8.8.16',
        'state.person-care-dependent',
        'primary',
        '5.8.8.16_Person pflegebedürftig.svg',
      ],
      [
        '5.8.8.17',
        'state.person-mobility-impaired',
        'primary',
        '5.8.8.17_Person mobilitätseingeschränkt.svg',
      ],
    ] as const;

    expect(STATE_PICTOGRAMS.map(inventoryTuple)).toEqual(expected);
    expect(() => pictogram('state.tactical-rescue')).not.toThrow();
    expect(() => pictogram('state.tactical-attack')).not.toThrow();
    expect(() => pictogram('state.tactical-defense')).not.toThrow();
    expect(() => pictogram('state.tactical-retreat')).not.toThrow();
    expect(() => pictogram('state.flooded-area')).not.toThrow();
    expect(() => pictogram('state.water-ingress-hazard')).not.toThrow();
    expect(() => pictogram('state.hazardous-substances')).not.toThrow();
    expect(() => pictogram('state.hazardous-substances', 'alternative')).not.toThrow();
    expect(() => pictogram('state.suspected-situation')).not.toThrow();
    expect(() => pictogram('state.acute-situation')).not.toThrow();
    expect(() => pictogram('state.tendency-rising')).not.toThrow();
    expect(() => pictogram('state.damaged')).not.toThrow();
    expect(() => pictogram('state.incipient-fire')).not.toThrow();
    expect(() => pictogram('state.sick-animal')).not.toThrow();
    expect(() => pictogram('state.contaminated-animal')).not.toThrow();
    expect(() => pictogram('state.contaminated-animal', 'alternative')).not.toThrow();
    expect(() => pictogram('state.dead-animal')).not.toThrow();
    expect(() => pictogram('state.person-uninjured')).not.toThrow();
    expect(() => pictogram('state.person-affected')).not.toThrow();
    expect(() => pictogram('state.person-injured')).not.toThrow();
    expect(() => pictogram('state.person-injured-triage-category')).not.toThrow();
    expect(() => pictogram('state.person-injured-transport-priority')).not.toThrow();
    expect(() => pictogram('state.person-contaminated')).not.toThrow();
    expect(() => pictogram('state.person-contaminated', 'alternative')).not.toThrow();
    expect(() => pictogram('state.person-dead')).not.toThrow();
    expect(() => pictogram('state.person-missing')).not.toThrow();
    expect(() => pictogram('state.person-in-water-danger')).not.toThrow();
    expect(() => pictogram('state.person-in-distress')).not.toThrow();
    expect(() => pictogram('state.person-rescued')).not.toThrow();
    expect(() => pictogram('state.person-to-be-transported')).not.toThrow();
    expect(() => pictogram('state.person-in-transport')).not.toThrow();
    expect(() => pictogram('state.person-transported')).not.toThrow();
    expect(() => pictogram('state.person-needing-special-care')).not.toThrow();
    expect(() => pictogram('state.person-care-dependent')).not.toThrow();
    expect(() => pictogram('state.person-mobility-impaired')).not.toThrow();
  });

  it('hält vorhandene Primär- und Alternativdarstellungen eindeutig und titelgleich', () => {
    const definitionsById = new Map<string, CatalogPictogramDefinition[]>();
    for (const definition of TACTICS_HAZARDS_STATES) {
      const definitions = definitionsById.get(definition.id) ?? [];
      definitions.push(definition);
      definitionsById.set(definition.id, definitions);
    }

    for (const definitions of definitionsById.values()) {
      if (definitions.length === 1) continue;
      expect(definitions.map(({ variant }) => variant).sort()).toEqual([
        'alternative',
        'primary',
      ]);
      expect(new Set(definitions.map(({ title }) => title)).size).toBe(1);
      expect(new Set(definitions.map(pictogramRenderId)).size).toBe(2);
    }
  });

  it('hält die außenliegenden P2-Marken in den exakten Autorenboxen', () => {
    const triage = PERSON_STATES.find(
      ({ id }) => id === 'state.person-injured-triage-category',
    );
    const transportPriority = PERSON_STATES.find(
      ({ id }) => id === 'state.person-injured-transport-priority',
    );

    expect(triage?.box).toEqual({ xMm: 1.5, yMm: 4, widthMm: 25.5, heightMm: 27 });
    expect(transportPriority?.box).toEqual({
      xMm: 5,
      yMm: 2.5,
      widthMm: 26,
      heightMm: 23.5,
    });
  });

  it('deklariert keine Personenzustandsprimitive als Fußzone', () => {
    for (const definition of PERSON_STATES) {
      for (const primitive of definition.primitives) {
        expect(primitive.role, `${definition.id}#${definition.variant}`).toBe('pictogram');
      }
    }
  });

  it('hält die beiden Kontaminationsdarstellungen titelgleich und renderseitig eindeutig', () => {
    const definitions = PERSON_STATES.filter(
      ({ id }) => id === 'state.person-contaminated',
    );

    expect(definitions.map(({ variant }) => variant)).toEqual(['primary', 'alternative']);
    expect([...new Set(definitions.map(({ title }) => title))]).toEqual([
      'Person kontaminiert',
    ]);
    expect(definitions.map(pictogramRenderId)).toEqual([
      'state.person-contaminated',
      'state.person-contaminated.alternative',
    ]);
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
    expect(Object.isFrozen(TACTICS_HAZARDS_STATES)).toBe(true);
    expect(Object.isFrozen(TENDENCY_STATES)).toBe(true);
    expect(Object.isFrozen(DAMAGE_STATES)).toBe(true);
    expect(Object.isFrozen(FIRE_STATES)).toBe(true);
    expect(Object.isFrozen(ANIMAL_STATES)).toBe(true);
    expect(Object.isFrozen(PERSON_STATES)).toBe(true);
    expect(Object.isFrozen(STATE_PICTOGRAMS)).toBe(true);

    const mutableStates = STATE_PICTOGRAMS as unknown as CatalogPictogramDefinition[];
    expect(() => mutableStates.push(STATE_PICTOGRAMS[0]!)).toThrow(TypeError);
  });
});
