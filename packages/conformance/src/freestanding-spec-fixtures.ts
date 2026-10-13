import { ALL_PICTOGRAMS, LEGACY_PICTOGRAMS, STATE_PICTOGRAMS, freestandingRedirect } from '@einsatzzeichen/core';
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

/**
 * Jede Kapiteldatei, die der freistehende Zustand zeichnet (LFH-798): jede Darstellung aus 5.8,
 * die keine andere Spec schon trägt (`freestandingRedirect`). Das sind 5.8.1 bis 5.8.5 und 5.8.9
 * ohne die zweiten Darstellungen der Hinweise (sie zeigt die Gefahr) und dazu die zweite
 * Darstellung von 5.8.8.6 (die Person zeichnet nur die erste). Die Bilder sind im Register gegen
 * das Kennzahlenartefakt gegatet (`pictograms/state-inventory.test.ts`); der Test hier verlangt,
 * dass die Spec genau sie zeichnet, und zählt die Dateien.
 */
export const STATE_SPEC_FIXTURES: readonly FreestandingSpecFixture[] = Object.freeze(
  STATE_PICTOGRAMS.map((definition) => {
    const state = definition.id.slice('state.'.length) as StateId;
    const spec: FreestandingSpec =
      definition.variant === 'primary' ? { kind: 'state', state } : { kind: 'state', state, variant: definition.variant };
    return { asset: definition.referenceAsset, spec };
  }).filter(({ spec }) => freestandingRedirect(spec) === undefined),
);

/**
 * Jede Kapiteldatei der übrigen Räume (Kapitel 4, J, K, L, M, D, I.5 und 3.6 bis 3.8), die das freistehende
 * Piktogramm zeichnet (LFH-834): alle Darstellungen außerhalb von 5.8, ohne die mit eigener Spec
 * (die Leitstelle D.2.5 zeichnet ihr Ort). Die Bilder sind in den Suiten ihrer Räume gegatet.
 */
export const PICTOGRAM_SPEC_FIXTURES: readonly FreestandingSpecFixture[] = Object.freeze(
  ALL_PICTOGRAMS.filter((definition) => !definition.id.startsWith('state.'))
    .map((definition) => {
      const spec: FreestandingSpec =
        definition.variant === 'primary'
          ? { kind: 'pictogram', pictogram: definition.id }
          : { kind: 'pictogram', pictogram: definition.id, variant: definition.variant };
      return { asset: definition.referenceAsset, spec };
    })
    .filter(({ spec }) => freestandingRedirect(spec) === undefined),
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
  ...PICTOGRAM_SPEC_FIXTURES,
]);

/**
 * Die Altzeichen aus DV 102 Kapitel 8 (ESZ-137) als freistehendes Piktogramm. Eigene Liste, weil
 * `FREESTANDING_SPEC_FIXTURES` nach Referenzdatei geschlüsselt ist und die Altquelle keine hat:
 * Beleg ist Abschnitt und Seite der DV 102.
 */
export interface LegacySpecFixture {
  readonly source: { readonly source: 'skk-2010'; readonly section: string; readonly page: number };
  readonly spec: FreestandingSpec;
}

export const LEGACY_SPEC_FIXTURES: readonly LegacySpecFixture[] = Object.freeze(
  LEGACY_PICTOGRAMS.map((definition): LegacySpecFixture => {
    const spec: FreestandingSpec =
      definition.variant === 'primary'
        ? { kind: 'pictogram', pictogram: definition.id }
        : { kind: 'pictogram', pictogram: definition.id, variant: definition.variant };
    return { source: { source: definition.source, section: definition.section, page: definition.page }, spec };
  }),
);
