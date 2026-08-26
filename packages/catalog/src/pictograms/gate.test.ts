import { describe, expect, it } from 'vitest';
import {
  checkBox,
  checkClipping,
  checkCommands,
  checkTextLegibility,
  checkViewBox,
  rasterDimensionsForWidth,
} from '@einsatzzeichen/core';
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
import * as catalogDefinitionExports from './catalog-definition.js';
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

/**
 * Die Grundzeichen, für die `checkClipping` ein Flächenmodell hat: achsparallele oder gedrehte
 * Rechtecke, Kreise und **geschlossene konvexe** Polygone.
 *
 * Sechs der vierzehn fallen seit LFH-424 heraus, und zwar hart — `checkClipping` wirft für sie,
 * es scheitert nicht bloß:
 * - `event` ist ein **offener** Polyzug und schließt keine Körperfläche ein.
 * - `vehicle-land`, `vehicle-air`, `vehicle-water`, `area` und `spontaneous-helper` sind Pfade.
 *   Ein Polygonersatz löste das nicht: `area` (Zehneck mit Einbuchtung) und `spontaneous-helper`
 *   (Vierlappen) sind nicht konvex.
 *
 * Die Liste steht deshalb explizit und wird nicht aus `BASE_SYMBOLS` abgeleitet: eine Ableitung
 * über den Primitivtyp verschöbe die Aussage von „diese Körper sind geprüft" zu „geprüft ist, was
 * sich prüfen ließ", und ein künftiger Kurvenkörper fiele lautlos heraus.
 */
const CLIPPING_BODY_KINDS = [
  'formation',
  'person',
  'post',
  'building',
  'container',
  'measure',
  'hazard',
  'point',
] as const satisfies ReadonlyArray<keyof typeof BASE_SYMBOLS>;

const BODY_CASES = CLIPPING_BODY_KINDS.map((kind) => [kind, bodyOf(kind)] as const);

/** Kleine reale Box im gemeinsamen Zentrum der acht Körperflächen mit Flächenmodell. */
const CENTERED_TEST_PICTOGRAM: PictogramDefinition = {
  id: 'capability.fire-fighting',
  variant: 'primary',
  title: 'Zentrale Testbox',
  viewBox: DEFAULT_VIEWBOX_MM,
  box: { xMm: 14, yMm: 14, widthMm: 4, heightMm: 4 },
  primitives: [],
};

/**
 * Dieselben sechs Snapshotgrößen wie `multi-size-snapshots.test.ts:13`. `core` kennt die
 * Rendergrößenreihe bewusst nicht (siehe `checkTextLegibility`-Kommentar in `pictogram-gate.ts`)
 * — sie steht deshalb hier als eigener, katalogseitiger Wert und nicht als Import aus `core`.
 */
const RENDER_SIZES_PX = [16, 24, 32, 64, 128, 256] as const;

const LEADERSHIP_INPUT_FIXTURE = {
  section: 'D.1.1',
  id: 'command-post-in-operation',
  title: 'Befehlsstelle im Einsatz',
  referenceAsset: 'D.1.1_Befehlsstelle im Einsatz.svg',
  viewBox: { width: 32, height: 46 },
  box: { xMm: 1, yMm: 1, widthMm: 30, heightMm: 44 },
  primitives: [
    {
      type: 'rect', role: 'pictogram', x: 1, y: 1, width: 30, height: 44,
      style: { fill: 'gelb' },
    },
  ],
  contrastPairs: [
    { foreground: 'gelb', background: 'surface', context: 'Testfläche' },
  ],
};

function defineLeadershipAtRuntime(input: unknown): unknown {
  const candidate = Reflect.get(catalogDefinitionExports, 'defineLeadership');
  if (typeof candidate !== 'function') {
    throw new Error('defineLeadership fehlt im Katalogvertrag.');
  }
  return Reflect.apply(candidate, undefined, [input]);
}

function clippingBodyFor(definition: CatalogPictogramDefinition): Primitive {
  return definition.placement.mode === 'in-body'
    ? bodyOf(definition.placement.bodyKind)
    : {
        type: 'rect',
        role: 'body',
        x: 0,
        y: 0,
        width: definition.viewBox.width,
        height: definition.viewBox.height,
      };
}

function standaloneFixture(
  box: PictogramBox,
  viewBox: PictogramDefinition['viewBox'] = DEFAULT_VIEWBOX_MM,
): CatalogPictogramDefinition {
  return deepFreeze({
    section: '4.fixture',
    id: 'capability.fire-fighting',
    variant: 'primary',
    title: 'Standalone-Testfixture',
    referenceAsset: 'fixture.svg',
    placement: { mode: 'standalone' } as const,
    viewBox,
    contrastPairs: [
      { foreground: 'schwarz', background: 'surface', context: 'Testfixture' },
    ],
    box,
    primitives: [],
  });
}

describe('Piktogramm-Gates über den Katalogbestand', () => {
  it.each([
    ['fehlend', undefined],
    ['nicht endlich', { width: Number.NaN, height: 46 }],
    ['Breite null', { width: 0, height: 46 }],
    ['negative Höhe', { width: 32, height: -46 }],
  ])('lehnt eine %s Leadership-ViewBox mit stabilem Befund ab', (_label, viewBox) => {
    const input = { ...LEADERSHIP_INPUT_FIXTURE, viewBox };
    expect(() => defineLeadershipAtRuntime(input)).toThrow(/leadership-viewbox-required/);
  });

  it('lehnt sichtbare Leadership-Geometrie außerhalb der deklarierten ViewBox stabil ab', () => {
    const input = {
      ...LEADERSHIP_INPUT_FIXTURE,
      primitives: [{
        type: 'line', role: 'pictogram', x1: 1, y1: 1, x2: 31, y2: 46,
        style: { stroke: 'schwarz', strokeWidth: 0.5 },
      }],
    };
    expect(() => defineLeadershipAtRuntime(input)).toThrow(/leadership-outside-viewbox/);
  });

  it('bewahrt die vollständige D.1.1-Verbindung in 32×46 mm und würde sie in 32×32 abschneiden', () => {
    const definition = ALL_PICTOGRAMS.find(
      (candidate) => candidate.id === 'leadership.command-post-in-operation',
    );
    expect(definition).toBeDefined();
    if (definition === undefined) return;

    const drawing = { viewBox: definition.viewBox, children: definition.primitives };
    expect(checkViewBox(drawing)).toEqual([]);
    expect(checkViewBox({ ...drawing, viewBox: DEFAULT_VIEWBOX_MM })).toContainEqual(
      expect.objectContaining({ rule: 'outside-viewbox' }),
    );
    expect(RENDER_SIZES_PX.map((size) =>
      rasterDimensionsForWidth(definition.viewBox, size).heightPx,
    )).toEqual([23, 35, 46, 92, 184, 368]);
  });

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
  // die Rendergrößenreihe braucht, die core absichtlich nicht kennt. D.1.1 ist der erste reale
  // ALL_PICTOGRAMS-Eintrag mit Text; genau dieser Lauf prüft seinen Bezeichnungslauf gegen alle
  // sechs Snapshotgrößen.
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

  it('leitet den standalone-Clippingkörper aus der rechteckigen Definitions-ViewBox ab', () => {
    const definition = standaloneFixture(
      { xMm: 1, yMm: 42, widthMm: 3, heightMm: 3 },
      { width: 32, height: 46 },
    );
    expect(checkClipping(definition, clippingBodyFor(definition))).toEqual([]);
  });

  it.each(BODY_CASES)('kann die reale Körperfläche von %s prüfen', (_kind, body) => {
    // Dieser Test belegt die technische Flächenmodell-Abdeckung, nicht die fachliche
    // Autorisierung jedes realen Piktogramms für jedes Grundzeichen.
    expect(checkClipping(CENTERED_TEST_PICTOGRAM, body)).toEqual([]);
  });
});
