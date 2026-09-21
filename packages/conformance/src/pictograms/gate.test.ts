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
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS, baseDrawing } from '@einsatzzeichen/core';
import { COVERAGE_MANIFEST } from '../coverage-manifest.js';
import { deepFreeze } from '@einsatzzeichen/core';
import { RECIPES } from '../recipes.js';
import type { CatalogPictogramDefinition } from '@einsatzzeichen/core';
import * as catalogDefinitionExports from '@einsatzzeichen/core/src/geometry/pictograms/catalog-definition.js';
import { CAPABILITY_PICTOGRAMS } from '@einsatzzeichen/core/src/geometry/pictograms/capabilities.js';
import { ALL_PICTOGRAMS, pictogram, pictogramVariantKey } from '@einsatzzeichen/core';
import { STATE_PICTOGRAMS } from '@einsatzzeichen/core';

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

/**
 * Der Prüfkörper der **Einzeldarstellung**: das Rechteck ihrer eigenen ViewBox, ohne Kontur.
 *
 * Seit dem Fachreview vom 19. September 2026 gilt das für jede Definition, auch für die
 * Kapitel-4-Piktogramme mit `placement: in-body`. Sie sind deckungsgleich mit den
 * BABZ-Referenzen konstruiert, und die Referenz zeichnet sie als Einzeldarstellung auf der vollen
 * 32×32-mm-Fläche (docs/decisions/2026-09-19-masse-an-der-referenz-ablesen.md). Gegen den
 * Formationskörper (y 6 bis 26) geprüft, wäre die Referenz selbst ein Überstand.
 *
 * Ob ein Piktogramm in einen Körper passt, prüft der Kompositionstest unten, und zwar an den
 * Kompositionen, die es tatsächlich in einen Körper setzen. Die Placement-Deklaration
 * (`in-body` für `formation`) bleibt unverändert; nur der Prüfkontext der Einzeldarstellung
 * folgt der Referenz.
 */
function singleDepictionBodyFor(definition: CatalogPictogramDefinition): Primitive {
  return {
    type: 'rect',
    role: 'body',
    x: 0,
    y: 0,
    width: definition.viewBox.width,
    height: definition.viewBox.height,
  };
}

/**
 * Kompositionen, die ein Kapitel-4-Piktogramm in einen Körper setzen, ohne ein Rezept in
 * `RECIPES` zu sein.
 *
 * Stand 19. September 2026 setzt **kein** Katalogrezept ein Kapitel-4-Piktogramm per
 * `capabilities` in einen Körper: C.1.1 bis C.1.3 zeichnen die Brandbekämpfung über `bodyMarks`.
 * Die Mechanik `capabilities` → Piktogrammgruppe belegen nur die Testkompositionen in
 * `recipes.test.ts` („Piktogramm-Platzierung als Gruppe", „Pfad-Piktogramm in beiden
 * Layoutfällen"). Genau diese stehen hier ausdrücklich, damit der Kompositionstest nicht leer
 * durchläuft.
 *
 * Belegt ist die in-body-Tauglichkeit damit nur für `fire-fighting` und `service-water`. Für die
 * übrigen 90 Kapitel-4-Piktogramme ist sie **nicht** belegt, trotz ihrer Placement-Deklaration
 * `in-body`. Ein künftiges Rezept mit `spec.capabilities` fällt ohne Zutun in den Test (siehe
 * `COMPOSITION_CASES`) und wird rot, wenn sein Piktogramm übersteht.
 */
const CAPABILITY_TEST_COMPOSITIONS: ReadonlyArray<readonly [string, SymbolSpec]> = [
  [
    'Testkomposition Staffel + fire-fighting',
    { kind: 'formation', organization: 'feuerwehr', strength: 'staffel', capabilities: ['fire-fighting'] },
  ],
  [
    'Testkomposition Staffel + service-water',
    { kind: 'formation', organization: 'feuerwehr', strength: 'staffel', capabilities: ['service-water'] },
  ],
  [
    'Testkomposition Staffel + fire-fighting + service-water',
    {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      capabilities: ['fire-fighting', 'service-water'],
    },
  ],
];

/**
 * Je Komposition und eingesetztem Piktogramm ein Fall: das Piktogramm gegen den **realen**
 * Körper dieser Komposition, mit dessen Kontur (siehe `bodyOutlineHalfMm` in `core`). Die
 * Pikto-Tinte darf die Kontur überdecken, aber nicht über ihre Außenkante ragen — so wie die
 * Schenkel der Brandbekämpfung in C.1.2/C.1.3 exakt auf der Konturmitte enden.
 *
 * Geprüft wird gegen den unverschobenen Körper: compose() verschiebt Körper und Piktogrammgruppe
 * um dasselbe Delta (siehe `checkClipping`). Ein Körper ohne Flächenmodell lässt
 * `checkClipping` werfen, der Fall wird also rot statt still übersprungen.
 */
const COMPOSITION_CASES = [
  ...Object.entries(RECIPES)
    .map(([section, recipe]) => [section, recipe.spec as SymbolSpec] as const)
    .filter(([, spec]) => (spec.capabilities ?? []).length > 0),
  ...CAPABILITY_TEST_COMPOSITIONS,
].flatMap(([label, spec]) =>
  (spec.capabilities ?? []).map(
    (capability) =>
      [
        `${label}: capability.${capability} in ${spec.kind}`,
        pictogram(`capability.${capability}`),
        bodyOf(spec.kind as keyof typeof BASE_SYMBOLS),
      ] as const,
  ),
);

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

  // Die Einzeldarstellung folgt der Referenz auf ihrer ViewBox (32×32 mm für Kapitel 4), siehe
  // `singleDepictionBodyFor`. Ob ein Piktogramm in einen Körper passt, prüft der Kompositionstest
  // direkt darunter an den Kompositionen, die es tatsächlich einsetzen.
  it.each(ALL_PICTOGRAMS.map((definition) => [pictogramVariantKey(definition), definition] as const))(
    'besteht für %s das Clipping-Gate als Einzeldarstellung in der eigenen ViewBox',
    (_id, definition) => {
      expect(checkClipping(definition, singleDepictionBodyFor(definition))).toEqual([]);
    },
  );

  it('hat mindestens eine Komposition, die ein Piktogramm in einen Körper setzt', () => {
    // Ohne diese Zusicherung liefe der Kompositionstest unten bei leerer Liste trivial grün.
    expect(COMPOSITION_CASES.length).toBeGreaterThan(0);
    const pictograms = new Set(COMPOSITION_CASES.map(([, definition]) => definition.id));
    expect(pictograms).toEqual(new Set(['capability.fire-fighting', 'capability.service-water']));
  });

  // Ein künftiges Rezept, das ein überstehendes Piktogramm in einen Körper setzt, wird hier rot.
  it.each(COMPOSITION_CASES)(
    'besteht für %s das Clipping-Gate gegen den realen Körper samt Kontur',
    (_label, definition, body) => {
      expect(checkClipping(definition, body)).toEqual([]);
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
    expect(checkClipping(definition, singleDepictionBodyFor(definition))).toEqual([]);
  });

  it('lehnt standalone-Tinte außerhalb der 32×32-mm-ViewBox ab', () => {
    const definition = standaloneFixture({ xMm: 31, yMm: 31, widthMm: 2, heightMm: 2 });
    expect(checkClipping(definition, singleDepictionBodyFor(definition))).not.toEqual([]);
  });

  it('leitet den standalone-Clippingkörper aus der rechteckigen Definitions-ViewBox ab', () => {
    const definition = standaloneFixture(
      { xMm: 1, yMm: 42, widthMm: 3, heightMm: 3 },
      { width: 32, height: 46 },
    );
    expect(checkClipping(definition, singleDepictionBodyFor(definition))).toEqual([]);
  });

  it.each(BODY_CASES)('kann die reale Körperfläche von %s prüfen', (_kind, body) => {
    // Dieser Test belegt die technische Flächenmodell-Abdeckung, nicht die fachliche
    // Autorisierung jedes realen Piktogramms für jedes Grundzeichen.
    expect(checkClipping(CENTERED_TEST_PICTOGRAM, body)).toEqual([]);
  });
});
