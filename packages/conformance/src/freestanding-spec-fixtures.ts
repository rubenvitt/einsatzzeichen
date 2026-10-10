import { STATE_PICTOGRAMS } from '@einsatzzeichen/core';
import type { FreestandingSpec, StateId } from '@einsatzzeichen/schema';
import { ANIMAL_STATE_FIXTURES, WEATHER_EXAMPLE_FIXTURES } from './freestanding-state-fixtures.js';
import { PARAMETRIC_FIXTURES, type ParametricFixture } from './parametric-fixtures.js';

/**
 * Jede Referenzdatei der freistehenden Zeichen als `FreestandingSpec` (LFH-577): die Pfeile und
 * Linien aus `PARAMETRIC_FIXTURES`, die Wetterbeispiele und Tierzustände aus
 * `freestanding-state-fixtures.ts`, die freistehenden Zustände aus dem Piktogrammregister
 * (`STATE_SPEC_FIXTURES`, LFH-798). Die Specs sind aus diesen Parametersätzen abgeleitet, nicht
 * zweimal aufgeschrieben; `freestanding-spec-fixtures.test.ts` zeichnet sie über
 * `drawFreestanding` und vergleicht mit der Zeichenfunktion.
 *
 * Eine Zeichenfläche steht in keiner Spec: die Flächen der Referenz sind die Vorgabe von
 * `drawFreestanding` (`FREESTANDING_DEFAULT_CANVAS_MM`), und der Test hält das fest.
 */
export interface FreestandingSpecFixture {
  readonly asset: `${string}.svg`;
  readonly spec: FreestandingSpec;
}

function specOfParametric(fixture: ParametricFixture): FreestandingSpec {
  if (fixture.category === 'arrow') return { kind: 'movement', movement: fixture.valueId, path: fixture.path };
  return {
    kind: 'line',
    line: fixture.valueId,
    path: fixture.path,
    ...(fixture.strength === undefined ? {} : { strength: fixture.strength }),
    ...(fixture.variant === undefined ? {} : { variant: fixture.variant }),
  };
}

/** Die Abschnitte, deren Zustände freistehend als `state` stehen (Entscheidung vom 10.10.2026). */
const FREESTANDING_STATE_SECTIONS = ['5.8.1.', '5.8.2.', '5.8.3.', '5.8.4.', '5.8.5.', '5.8.9.'] as const;

/**
 * Die zweiten Darstellungen der Hinweise zeigen das Zeichen an der Gefahr; sie gehören zu
 * `{ kind: 'hazard', states }` (`state-spec-fixtures.test.ts`), nicht hierher.
 */
const HINT_AT_HAZARD: ReadonlySet<string> = new Set([
  '5.8.1.13_Hinweis auf Vermutung_2.svg',
  '5.8.1.14_Hinweis auf akute Situation_2.svg',
]);

/**
 * Jede Kapiteldatei, die der freistehende Zustand zeichnet (LFH-798): die Einzeldarstellung aus
 * dem Register, je Variante. Die Bilder sind dort gegen das Kennzahlenartefakt gegatet
 * (`pictograms/state-inventory.test.ts`); der Test hier verlangt, dass die Spec genau sie zeichnet.
 */
export const STATE_SPEC_FIXTURES: readonly FreestandingSpecFixture[] = Object.freeze(
  STATE_PICTOGRAMS.filter(
    (definition) =>
      FREESTANDING_STATE_SECTIONS.some((section) => `${definition.section}.`.startsWith(section)) &&
      !HINT_AT_HAZARD.has(definition.referenceAsset),
  ).map((definition) => {
    const state = definition.id.slice('state.'.length) as StateId;
    const spec: FreestandingSpec =
      definition.variant === 'primary' ? { kind: 'state', state } : { kind: 'state', state, variant: definition.variant };
    return { asset: definition.referenceAsset, spec };
  }),
);

export const FREESTANDING_SPEC_FIXTURES: readonly FreestandingSpecFixture[] = Object.freeze([
  ...PARAMETRIC_FIXTURES.map((fixture) => ({ asset: fixture.asset, spec: specOfParametric(fixture) })),
  ...WEATHER_EXAMPLE_FIXTURES.map((fixture) => ({
    asset: fixture.asset,
    spec: { kind: 'weather', ...fixture.parameters } satisfies FreestandingSpec,
  })),
  ...ANIMAL_STATE_FIXTURES.map((fixture) => ({
    asset: fixture.asset,
    spec: { kind: 'animal-state', ...fixture.parameters } satisfies FreestandingSpec,
  })),
  ...STATE_SPEC_FIXTURES,
]);
