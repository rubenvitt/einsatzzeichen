import { describe, expect, it } from 'vitest';
import { checkBox, checkClipping, checkCommands, checkTextLegibility } from '@einsatzzeichen/core';
import {
  DEFAULT_VIEWBOX_MM,
  entryKey,
  type PictogramBox,
  type PictogramDefinition,
  type Primitive,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS, baseDrawing } from '../base-symbols.js';
import { COVERAGE_MANIFEST } from '../coverage-manifest.js';
import { deepFreeze } from '../readonly-data.js';
import type { CatalogPictogramDefinition } from './catalog-definition.js';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';
import { ALL_PICTOGRAMS, pictogramVariantKey } from './index.js';
import { STATE_PICTOGRAMS } from './states/index.js';

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

/**
 * Dieselben sechs Snapshotgrößen wie `multi-size-snapshots.test.ts:13`. `core` kennt die
 * Rendergrößenreihe bewusst nicht (siehe `checkTextLegibility`-Kommentar in `pictogram-gate.ts`)
 * — sie steht deshalb hier als eigener, katalogseitiger Wert und nicht als Import aus `core`.
 */
const RENDER_SIZES_PX = [16, 24, 32, 64, 128, 256] as const;

const VIEWBOX_BODY: Primitive = {
  type: 'rect',
  role: 'body',
  x: 0,
  y: 0,
  width: DEFAULT_VIEWBOX_MM.width,
  height: DEFAULT_VIEWBOX_MM.height,
};

function clippingBodyFor(definition: CatalogPictogramDefinition): Primitive {
  return definition.placement.mode === 'in-body'
    ? bodyOf(definition.placement.bodyKind)
    : VIEWBOX_BODY;
}

function standaloneFixture(box: PictogramBox): CatalogPictogramDefinition {
  return deepFreeze({
    section: '4.fixture',
    id: 'capability.fire-fighting',
    variant: 'primary',
    title: 'Standalone-Testfixture',
    referenceAsset: 'fixture.svg',
    placement: { mode: 'standalone' } as const,
    contrastPairs: [
      { foreground: 'schwarz', background: 'surface', context: 'Testfixture' },
    ],
    box,
    primitives: [],
  });
}

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

  it('deklariert alle Kapitel-4-Definitionen als in-body für formation', () => {
    expect(CAPABILITY_PICTOGRAMS).toHaveLength(92);
    for (const definition of CAPABILITY_PICTOGRAMS) {
      expect(definition.placement).toEqual({ mode: 'in-body', bodyKind: 'formation' });
    }
  });

  it('deklariert alle State-Definitionen als eigenständige ViewBox-Piktogramme', () => {
    expect(STATE_PICTOGRAMS.length).toBeGreaterThan(0);
    for (const definition of STATE_PICTOGRAMS) {
      expect(definition.placement).toEqual({ mode: 'standalone' });
    }
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
    'besteht für %s das Clipping-Gate im deklarierten Platzierungskontext',
    (_id, definition) => {
      expect(checkClipping(definition, clippingBodyFor(definition))).toEqual([]);
    },
  );

  // Ohne diese Verdrahtung liefe checkTextLegibility außerhalb seines eigenen Unittests nie —
  // checkPictogram fasst nur Kommando-, Box- und Clipping-Gate zusammen (siehe dessen Kommentar
  // in pictogram-gate.ts), das Lesbarkeits-Gate ist bewusst kein vierter Baustein davon, weil es
  // die Rendergrößenreihe braucht, die core absichtlich nicht kennt. Heute trägt kein
  // ALL_PICTOGRAMS-Eintrag Text, der Test ist also grün, weil er nichts zu melden hat — nicht,
  // weil er nichts prüft. Sobald ein künftiges Textpiktogramm dazukommt, prüft genau dieser Lauf
  // es gegen alle sechs Snapshotgrößen.
  it.each(ALL_PICTOGRAMS.map((definition) => [pictogramVariantKey(definition), definition] as const))(
    'besteht für %s das Text-Legibility-Gate über alle sechs Rendergrößen',
    (_id, definition) => {
      expect(checkTextLegibility(definition, RENDER_SIZES_PX)).toEqual([]);
    },
  );

  it('akzeptiert standalone außerhalb der Formation, solange die sichtbare Box in der ViewBox liegt', () => {
    const definition = standaloneFixture({ xMm: 1, yMm: 1, widthMm: 3, heightMm: 3 });
    expect(checkClipping(definition, bodyOf('formation'))).not.toEqual([]);
    expect(checkClipping(definition, clippingBodyFor(definition))).toEqual([]);
  });

  it('lehnt standalone-Tinte außerhalb der 32×32-mm-ViewBox ab', () => {
    const definition = standaloneFixture({ xMm: 31, yMm: 31, widthMm: 2, heightMm: 2 });
    expect(checkClipping(definition, clippingBodyFor(definition))).not.toEqual([]);
  });

  it.each(BODY_CASES)('kann die reale Körperfläche von %s prüfen', (_kind, body) => {
    // Dieser Test belegt die technische Flächenmodell-Abdeckung, nicht die fachliche
    // Autorisierung jedes realen Piktogramms für jedes Grundzeichen.
    expect(checkClipping(CENTERED_TEST_PICTOGRAM, body)).toEqual([]);
  });
});
