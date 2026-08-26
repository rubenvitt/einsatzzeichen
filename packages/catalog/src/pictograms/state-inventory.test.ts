import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEWBOX_MM,
  STATE_IDS,
  type ColorToken,
  type Drawing,
  type PictogramBox,
  type Primitive,
} from '@einsatzzeichen/schema';
import { paintTokensOf, renderSvg } from '@einsatzzeichen/core';
import { fingerprintFor } from '../fingerprint-index.js';
import { PRINT_MONOCHROME_THEME } from '../render-themes.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from './catalog-definition.js';
import { pictogram, pictogramRenderId, pictogramVariantKey } from './index.js';
import {
  ACCESS_STATES,
  ACTIVITY_STATES,
  ANIMAL_STATES,
  DAMAGE_STATES,
  FIRE_STATES,
  PERSON_STATES,
  STATE_PICTOGRAMS,
  TACTICS_HAZARDS_STATES,
  TENDENCY_STATES,
  WEATHER_STATES,
} from './states/index.js';

const EXPECTED_STATE_IDS = [
  'tactical-rescue',
  'tactical-attack',
  'tactical-defense',
  'tactical-retreat',
  'flooded-area',
  'water-ingress-hazard',
  'hazardous-substances',
  'radioactivity-hazard',
  'electrical-energy-hazard',
  'mineral-oil-hazard',
  'explosion-hazard',
  'explosive-ordnance-hazard',
  'suspected-situation',
  'acute-situation',
  'activity-slightly-increased-outage-up-to-25-percent',
  'activity-moderately-increased-outage-up-to-50-percent',
  'activity-significantly-increased-outage-up-to-75-percent',
  'activity-strongly-increased-total-outage',
  'tendency-rising',
  'tendency-unchanged',
  'tendency-falling',
  'damaged',
  'partially-destroyed',
  'destroyed',
  'incipient-fire',
  'developed-fire',
  'fully-developed-fire',
  'sick-animal',
  'contaminated-animal',
  'dead-animal',
  'weather-sunny',
  'weather-cloudy',
  'weather-cloud-cover-four-eighths',
  'weather-foggy',
  'weather-rainy',
  'weather-hailing',
  'weather-thunderstorm',
  'weather-snowing',
  'weather-temperature',
  'weather-windy',
  'person-uninjured',
  'person-affected',
  'person-injured',
  'person-injured-triage-category',
  'person-injured-transport-priority',
  'person-contaminated',
  'person-dead',
  'person-missing',
  'person-in-water-danger',
  'person-in-distress',
  'person-rescued',
  'person-to-be-transported',
  'person-in-transport',
  'person-transported',
  'person-needing-special-care',
  'person-care-dependent',
  'person-mobility-impaired',
  'route-closed',
  'one-way-traffic',
  'route-difficult-to-pass',
  'route-impassable',
] as const;

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
    viewBox: definition.viewBox,
    children: definition.primitives,
  };
  return renderSvg(drawing, { size: 64, theme: PRINT_MONOCHROME_THEME });
}

function expectDeepFrozen(value: unknown): void {
  if (value === null || typeof value !== 'object') return;
  expect(Object.isFrozen(value)).toBe(true);
  for (const child of Object.values(value)) expectDeepFrozen(child);
}

describe('State-Piktogramminventur', () => {
  it('führt jede Bestandsdefinition mit der kanonischen 32×32-mm-ViewBox', () => {
    expect(STATE_PICTOGRAMS.every((definition) => definition.viewBox === DEFAULT_VIEWBOX_MM)).toBe(true);
  });

  it('hält exakt 61 eindeutige State-IDs in Kapitelreihenfolge fest', () => {
    expect(STATE_IDS).toEqual(EXPECTED_STATE_IDS);
    expect(STATE_IDS).toHaveLength(61);
    expect(new Set(STATE_IDS).size).toBe(61);
    expect(Object.isFrozen(STATE_IDS)).toBe(true);
  });

  it('schließt die neun Kapitelmodule mit exakt 61 Primär- und sechs Alternativdarstellungen', () => {
    expect([
      TACTICS_HAZARDS_STATES.length,
      ACTIVITY_STATES.length,
      TENDENCY_STATES.length,
      DAMAGE_STATES.length,
      FIRE_STATES.length,
      ANIMAL_STATES.length,
      WEATHER_STATES.length,
      PERSON_STATES.length,
      ACCESS_STATES.length,
    ]).toEqual([18, 4, 3, 3, 3, 4, 10, 18, 4]);
    expect(STATE_PICTOGRAMS).toHaveLength(67);
    expect(STATE_PICTOGRAMS.filter((item) => item.variant === 'primary')).toHaveLength(61);
    expect(STATE_PICTOGRAMS.filter((item) => item.variant === 'alternative')).toHaveLength(6);
    expect(STATE_PICTOGRAMS.every((item) => item.placement.mode === 'standalone')).toBe(true);

    const primaryIds = STATE_PICTOGRAMS
      .filter((item) => item.variant === 'primary')
      .map((item) => item.id.slice('state.'.length))
      .sort();
    expect(primaryIds).toEqual([...EXPECTED_STATE_IDS].sort());
  });

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
        '5.8.1.8',
        'state.radioactivity-hazard',
        'primary',
        '5.8.1.8_Gefahr durch Radioaktivität.svg',
      ],
      [
        '5.8.1.8',
        'state.radioactivity-hazard',
        'alternative',
        '5.8.1.8_Gefahr durch Radioaktivität _A.svg',
      ],
      [
        '5.8.1.9',
        'state.electrical-energy-hazard',
        'primary',
        '5.8.1.9_Gefahr durch elektrische Energie.svg',
      ],
      [
        '5.8.1.10',
        'state.mineral-oil-hazard',
        'primary',
        '5.8.1.10_Gefahr durch Mineralöl.svg',
      ],
      [
        '5.8.1.11',
        'state.explosion-hazard',
        'primary',
        '5.8.1.11_Gefahr durch Explosion.svg',
      ],
      [
        '5.8.1.12',
        'state.explosive-ordnance-hazard',
        'primary',
        '5.8.1.12_Gefahr durch explosionsfähige Kampfmittel.svg',
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
      ['5.8.7.1', 'state.weather-sunny', 'primary', '5.8.7.1_Sonnig.svg'],
      ['5.8.7.2', 'state.weather-cloudy', 'primary', '5.8.7.2_Wolkig.svg'],
      [
        '5.8.7.3',
        'state.weather-cloud-cover-four-eighths',
        'primary',
        '5.8.7.3_Bedeckung des Himmels 4 von 8.svg',
      ],
      ['5.8.7.4', 'state.weather-foggy', 'primary', '5.8.7.4_Nebelig.svg'],
      ['5.8.7.5', 'state.weather-rainy', 'primary', '5.8.7.5_Regnerisch.svg'],
      ['5.8.7.6', 'state.weather-hailing', 'primary', '5.8.7.6_Hagelnd.svg'],
      ['5.8.7.7', 'state.weather-thunderstorm', 'primary', '5.8.7.7_Gewittrig.svg'],
      ['5.8.7.8', 'state.weather-snowing', 'primary', '5.8.7.8_Schneiend.svg'],
      ['5.8.7.9', 'state.weather-temperature', 'primary', '5.8.7.9_Temperatur.svg'],
      ['5.8.7.10', 'state.weather-windy', 'primary', '5.8.7.10_Windig.svg'],
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
      ['5.8.9.1', 'state.route-closed', 'primary', '5.8.9.1_Gesperrt.svg'],
      [
        '5.8.9.2',
        'state.one-way-traffic',
        'primary',
        '5.8.9.2_Einbahnstraßenregelung.svg',
      ],
      [
        '5.8.9.3',
        'state.route-difficult-to-pass',
        'primary',
        '5.8.9.3_Schwierig befahrbar_Teilblockiert.svg',
      ],
      [
        '5.8.9.4',
        'state.route-impassable',
        'primary',
        '5.8.9.4_Unbefahrbar_Blockiert.svg',
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
    expect(() => pictogram('state.radioactivity-hazard')).not.toThrow();
    expect(() => pictogram('state.radioactivity-hazard', 'alternative')).not.toThrow();
    expect(() => pictogram('state.electrical-energy-hazard')).not.toThrow();
    expect(() => pictogram('state.mineral-oil-hazard')).not.toThrow();
    expect(() => pictogram('state.explosion-hazard')).not.toThrow();
    expect(() => pictogram('state.explosive-ordnance-hazard')).not.toThrow();
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

  it('führt exakt die sechs Alternativen und keine der sieben Beispielgrafiken im Register', () => {
    const alternativeAssets = [
      '5.8.1.7_Gefährliche Stoffe_Chlor.svg',
      '5.8.1.8_Gefahr durch Radioaktivität _A.svg',
      '5.8.1.13_Hinweis auf Vermutung_2.svg',
      '5.8.1.14_Hinweis auf akute Situation_2.svg',
      '5.8.6.2_kontaminiertes Tier_K.svg',
      '5.8.8.6_Person Kontaminiert_Alternative.svg',
    ] as const;
    const nonIdExamples = [
      '5.8.1_Beispiel 1.svg',
      '5.8.1_Beispiel 2.svg',
      '5.8.1_Beispiel 3.svg',
      '5.8.7_Beispiel_Schneiend_schwach.svg',
      '5.8.7_Beispiel_Schneiend_mittel.svg',
      '5.8.7_Beispiel_Schneiend_stark.svg',
      '5.8.7_Beispiel_Schneiend_extrem.svg',
    ] as const;

    const registeredAssets = new Set(STATE_PICTOGRAMS.map((item) => item.referenceAsset));
    expect(
      STATE_PICTOGRAMS.filter((item) => item.variant === 'alternative').map(
        (item) => item.referenceAsset,
      ),
    ).toEqual(alternativeAssets);
    for (const example of nonIdExamples) expect(registeredAssets).not.toContain(example);
    expect(STATE_IDS.some((id) => id.startsWith('weather-snowing-'))).toBe(false);
  });

  it('hält vorhandene Primär- und Alternativdarstellungen eindeutig und titelgleich', () => {
    const definitionsById = new Map<string, CatalogPictogramDefinition[]>();
    for (const definition of STATE_PICTOGRAMS) {
      const definitions = definitionsById.get(definition.id) ?? [];
      definitions.push(definition);
      definitionsById.set(definition.id, definitions);
    }

    for (const definitions of definitionsById.values()) {
      expect(definitions.filter(({ variant }) => variant === 'primary')).toHaveLength(1);
      expect(new Set(definitions.map(({ title }) => title)).size).toBe(1);
      expect(new Set(definitions.map(pictogramRenderId)).size).toBe(definitions.length);
    }
  });

  it('löst alle 67 eindeutigen Variantenschlüssel identisch aus dem globalen Register auf', () => {
    const keys = STATE_PICTOGRAMS.map(pictogramVariantKey);
    expect(new Set(keys).size).toBe(67);

    for (const definition of STATE_PICTOGRAMS) {
      expect(pictogram(definition.id, definition.variant)).toBe(definition);
      expectDeepFrozen(definition);
    }
  });

  it('belegt jedes atomare State-Asset im Kennzahlenartefakt und unter seinem Abschnitt', () => {
    for (const definition of STATE_PICTOGRAMS) {
      expect(definition.referenceAsset.startsWith(`${definition.section}_`)).toBe(true);
      expect(() => fingerprintFor(definition.referenceAsset)).not.toThrow();
    }
  });

  it('deklariert nichtleere Kontrastpaare für jeden tatsächlich malenden Farbtoken', () => {
    for (const definition of STATE_PICTOGRAMS) {
      if (definition.placement.mode !== 'standalone') {
        throw new Error(`${pictogramVariantKey(definition)} ist nicht standalone.`);
      }
      expect(definition.contrastPairs).toBeDefined();
      if (definition.contrastPairs === undefined) {
        throw new Error(`${pictogramVariantKey(definition)} deklariert keine contrastPairs.`);
      }
      expect(definition.contrastPairs.length).toBeGreaterThan(0);
      const declared = new Set(
        definition.contrastPairs.flatMap((pair) => [
          pair.foreground,
          ...(pair.background === 'surface' ? [] : [pair.background]),
        ]),
      );
      expect(
        [...paintTokensOf(definition.primitives)].filter((token) => !declared.has(token)),
        pictogramVariantKey(definition),
      ).toEqual([]);
    }
  });

  it('isoliert und friert alle veränderlichen Eingaben von defineState tief ein', () => {
    const box: PictogramBox = { xMm: 1, yMm: 2, widthMm: 3, heightMm: 4 };
    const primitives: Primitive[] = [
      {
        type: 'path',
        role: 'pictogram',
        d: 'M 1 1 H 2',
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: 1 },
      },
    ];
    const contrastPairs: [
      {
        foreground: ColorToken;
        background: ColorToken | 'surface';
        context: string;
      },
    ] = [
      {
        foreground: 'schwarz',
        background: 'surface',
        context: 'Testkontrast',
      },
    ];
    const definition = defineState({
      section: '5.8.1.1',
      id: 'tactical-rescue',
      title: 'Testzustand',
      referenceAsset: '5.8.1.1_Einsatztaktik_Retten.svg',
      box,
      primitives,
      contrastPairs: contrastPairs satisfies [PictogramContrastPair],
    });

    box.xMm = 9;
    primitives[0]!.style!.stroke = 'rot';
    contrastPairs[0].foreground = 'rot';

    expect(definition.box.xMm).toBe(1);
    expect(definition.primitives[0]?.style?.stroke).toBe('schwarz');
    expect(definition.contrastPairs?.[0].foreground).toBe('schwarz');
    expectDeepFrozen(definition);
    expect(() =>
      (definition.primitives as unknown as Primitive[]).push(primitives[0]!),
    ).toThrow(TypeError);
    expect(
      Reflect.set(
        definition.primitives[0]!.style as { stroke?: ColorToken },
        'stroke',
        'rot',
      ),
    ).toBe(false);
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
    expect(Object.isFrozen(WEATHER_STATES)).toBe(true);
    expect(Object.isFrozen(PERSON_STATES)).toBe(true);
    expect(Object.isFrozen(ACCESS_STATES)).toBe(true);
    expect(Object.isFrozen(STATE_PICTOGRAMS)).toBe(true);

    const mutableStates = STATE_PICTOGRAMS as unknown as CatalogPictogramDefinition[];
    expect(() => mutableStates.push(STATE_PICTOGRAMS[0]!)).toThrow(TypeError);
  });
});
