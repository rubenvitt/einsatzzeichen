import { describe, expect, it } from 'vitest';
import { checkBox, checkClipping, checkCommands } from '@einsatzzeichen/core';
import { entryKey, type PictogramDefinition, type Primitive } from '@einsatzzeichen/schema';
import { BASE_SYMBOLS, baseDrawing } from '../base-symbols.js';
import { COVERAGE_MANIFEST } from '../coverage-manifest.js';
import { ALL_PICTOGRAMS, pictogramVariantKey } from './index.js';

/**
 * Ein Körper aus dem realen Katalog. Das Gate liest weiterhin das Primitiv statt eines
 * `SymbolKind`, damit `core` nicht die Paketrichtung zu `catalog` umdrehen muss.
 */
function bodyOf(kind: keyof typeof BASE_SYMBOLS): Primitive {
  const body = baseDrawing(kind).children.find((child) => child.role === 'body');
  if (body === undefined) throw new Error(`Grundzeichen "${kind}" hat kein body-Primitiv.`);
  return body;
}

const BODY_CASES = (Object.keys(BASE_SYMBOLS) as Array<keyof typeof BASE_SYMBOLS>).map(
  (kind) => [kind, bodyOf(kind)] as const,
);

/** Kleine reale Box im gemeinsamen Zentrum aller acht heute katalogisierten Körperflächen. */
const CENTERED_TEST_PICTOGRAM: PictogramDefinition = {
  id: 'capability.fire-fighting',
  variant: 'primary',
  title: 'Zentrale Testbox',
  box: { xMm: 14, yMm: 14, widthMm: 4, heightMm: 4 },
  primitives: [],
};

describe('Piktogramm-Gates über den Katalogbestand', () => {
  it('bindet den Vertragsclaim exakt an die ausgeführten Piktogrammfälle', () => {
    const tested = ALL_PICTOGRAMS.map(pictogramVariantKey).sort();
    const claimed = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.testEvidence.includes('pictogram-contract'))
      .map((entry) => entryKey(entry.implementation, entry.variant))
      .sort();
    expect(tested).toEqual(claimed);
  });

  it('hat mindestens ein Piktogramm zu prüfen', () => {
    // Ohne diese Zusicherung wären die drei Tests unten bei leerem Bestand trivial grün.
    expect(ALL_PICTOGRAMS.length).toBeGreaterThan(0);
  });

  it.each(ALL_PICTOGRAMS.map((definition) => [pictogramVariantKey(definition), definition] as const))(
    'besteht für %s das Kommando-Gate',
    (_id, definition) => {
      expect(checkCommands(definition)).toEqual([]);
    },
  );

  it.each(ALL_PICTOGRAMS.map((definition) => [pictogramVariantKey(definition), definition] as const))(
    'besteht für %s das Box-Gate',
    (_id, definition) => {
      expect(checkBox(definition)).toEqual([]);
    },
  );

  it.each(ALL_PICTOGRAMS.map((definition) => [pictogramVariantKey(definition), definition] as const))(
    'besteht für %s das Clipping-Gate gegen die Taktische Formation',
    (_id, definition) => {
      // Die vorhandenen Kapitel-4-Geometrien sind fachlich weiterhin für `formation`
      // autorisiert. Ein kartesisches Produkt mit allen Körpern würde diese Aussage erfinden.
      expect(checkClipping(definition, bodyOf('formation'))).toEqual([]);
    },
  );

  it.each(BODY_CASES)('kann die reale Körperfläche von %s prüfen', (_kind, body) => {
    // Dieser Test belegt die technische Flächenmodell-Abdeckung, nicht die fachliche
    // Autorisierung jedes realen Piktogramms für jedes Grundzeichen.
    expect(checkClipping(CENTERED_TEST_PICTOGRAM, body)).toEqual([]);
  });
});
