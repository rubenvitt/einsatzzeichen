import type { FreestandingSpec } from '@einsatzzeichen/schema';
import { ANIMAL_STATE_FIXTURES, WEATHER_EXAMPLE_FIXTURES } from './freestanding-state-fixtures.js';
import { PARAMETRIC_FIXTURES, type ParametricFixture } from './parametric-fixtures.js';

/**
 * Jede Referenzdatei der freistehenden Zeichen als `FreestandingSpec` (LFH-577): die Pfeile und
 * Linien aus `PARAMETRIC_FIXTURES`, die Wetterbeispiele und Tierzustände aus
 * `freestanding-state-fixtures.ts`. Die Specs sind aus diesen Parametersätzen abgeleitet, nicht
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
]);
