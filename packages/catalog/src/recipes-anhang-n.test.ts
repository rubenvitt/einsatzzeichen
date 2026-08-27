import { describe, expect, it } from 'vitest';
import { boundsOfMm, matchFingerprint, type BoundsMm } from '@einsatzzeichen/core';
import type { Primitive, SymbolSpec } from '@einsatzzeichen/schema';
import { fingerprintFor } from './fingerprint-index.js';
import { RECIPES, composeFromCatalog, type Recipe } from './recipes.js';

const expected = {
  'N.1.1': {
    title: 'Bergeräumpanzer Bundeswehr',
    referenceAsset: 'N.1.1_Bergeräumpanzer_Bundeswehr.svg',
    spec: {
      kind: 'vehicle-land',
      bodyVariant: 'inverted-hull-track',
      organization: 'bundeswehr',
      vehicleCategory: 'kettenfahrzeug',
      bodyMarks: ['land-horizontal-blade-bent-upright'],
    },
  },
  'N.1.2': {
    title: 'Transportfahrzeug kommunaler Bauhof, geländegängig',
    referenceAsset: 'N.1.2_Transportfahrzeug_kommunaler Bauhof_geländegängig.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'sonstige-gefahrenabwehr',
      vehicleCategory: 'kfz-kategorie-2',
      bodyMarks: ['ring-5mm-offset-down-3-5mm-eight-spokes'],
      labels: {
        accessibilityMode: 'neutral-zones',
        inBodyInk: 'schwarz',
        topLeftLines: ['Kipper,', '26 t'],
      },
    },
  },
  'N.1.3': {
    title: 'Einsatzfahrzeug Bundespolizei',
    referenceAsset: 'N.1.3_Einsatzfahrzeug_Bundespolizei.svg',
    spec: {
      kind: 'vehicle-land',
      organization: 'bundespolizei',
      vehicleCategory: 'kfz-kategorie-1',
      labels: {
        accessibilityMode: 'neutral-zones',
        inBodyInk: 'schwarz',
        center: 'BuPol',
        centerBaselineFromBodyBottomMm: 6.5,
      },
    },
  },
  'N.1.4': {
    title: 'Drehflügler Bundeswehr CH-53, Außentraglast 7 t',
    referenceAsset: 'N.1.4_Drehflügler_Bundeswehr_CH-53_Außentraglast 7t.svg',
    spec: {
      kind: 'vehicle-air',
      bodyVariant: 'raised-hull',
      organization: 'bundeswehr',
      bodyMarks: ['air-quartering-up-arrow-box'],
      labels: {
        accessibilityMode: 'neutral-zones',
        inBodyInk: 'schwarz',
        aboveLeft: 'CH-53',
        aboveLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: -1,
          anchorFromBodyLeftMm: -0.01,
        },
        bottomRight: '7',
        bottomRightMetrics: {
          capHeightMm: 2.750245,
          baselineFromBodyTopMm: 13.000087,
          anchorFromBodyLeftMm: 21.99,
          boxLeftFromBodyLeftMm: 19.24,
          boxWidthMm: 5.5,
        },
        surfaceBelowRight: 'BW',
      },
    },
  },
  'N.1.5': {
    title: 'Löschflugzeug Beauftragter Dritter, 5.000 l',
    referenceAsset: 'N.1.5_Löschflugzeug_Beauftragter Dritter_5.000l.svg',
    spec: {
      kind: 'vehicle-air',
      bodyVariant: 'fixed-wing-hull',
      organization: 'sonstige-gefahrenabwehr',
      bodyMarks: ['air-horizontal-left-chevron'],
      labels: {
        accessibilityMode: 'neutral-zones',
        inBodyInk: 'schwarz',
        topLeft: '5.000',
        topLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: 7,
          anchorFromBodyLeftMm: 5.99,
        },
      },
    },
  },
  'N.1.6': {
    title: 'Erkundungsflugzeug Feuerwehr Cessna 172',
    referenceAsset: 'N.1.6_Erkundungsflugzeug_Feuerwehr_Cessna 172.svg',
    spec: {
      kind: 'vehicle-air',
      bodyVariant: 'fixed-wing-hull',
      organization: 'feuerwehr',
      bodyMarks: ['air-rising-diagonal'],
      labels: {
        accessibilityMode: 'neutral-zones',
        aboveLeft: 'Cessna 172',
        aboveLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: -1,
          anchorFromBodyLeftMm: -0.01,
        },
      },
    },
  },
  'N.2.1': {
    title: 'Sammelraum Spontanhelfer',
    referenceAsset: 'N.2.1_Sammelraum_Spontanhelfer.svg',
    spec: {
      kind: 'circle-12',
      organization: 'zivile-einheiten',
      bodyMarks: ['spontaneous-helper-collection-arrow'],
    },
  },
  'N.2.2': {
    title: 'Kontaktstelle Spontanhelfer',
    referenceAsset: 'N.2.2_Kontaktstelle_Spontanhelfer.svg',
    spec: {
      kind: 'circle-12',
      organization: 'feuerwehr',
      bodyMarks: ['spontaneous-helper-contact-double-arrow'],
    },
  },
  'N.2.3': {
    title: 'Notfallinformationspunkt',
    referenceAsset: 'N.2.3_Notfallinformationspunkt.svg',
    spec: {
      kind: 'circle-12',
      bodyVariant: 'raised-circle-1mm',
      organization: 'zivile-einheiten',
      bodyMarks: ['circle-information-stem'],
      labels: {
        accessibilityMode: 'neutral-zones',
        surfaceBelowLeft: '291300',
        surfaceBelowRight: 'ZIV',
      },
    },
  },
} as const satisfies Record<string, Recipe>;

function nRecipes(): Record<string, Recipe> {
  return Object.fromEntries(
    Object.entries<Recipe>(RECIPES).filter(([key]) => /^N\.(?:1\.[1-6]|2\.[1-3])$/.test(key)),
  );
}

function bodyBounds(section: keyof typeof expected): BoundsMm {
  const recipe = nRecipes()[section];
  if (recipe === undefined) throw new Error(`${section}: Rezept fehlt.`);
  const body = composeFromCatalog(recipe.spec, recipe.title).children.find(
    (primitive) => primitive.role === 'body',
  );
  if (body === undefined) throw new Error(`${section}: Körper fehlt.`);
  return boundsOfMm(body);
}

describe('Anhang N — Fahrzeuge weiterer Träger', () => {
  it('registriert genau N.1.1 bis N.1.6 und N.2.1 bis N.2.3 als primary-Rezepte', () => {
    expect(nRecipes()).toEqual(expected);
    const expectedKeys = [
      'N.1.1', 'N.1.2', 'N.1.3', 'N.1.4', 'N.1.5', 'N.1.6',
      'N.2.1', 'N.2.2', 'N.2.3',
    ];
    expect(Object.keys(nRecipes())).toEqual(expectedKeys);
    expect(Object.keys(RECIPES).filter((key) => key.startsWith('N.'))).toEqual(expectedKeys);
    // I-d/e/g/a/j ergänzen zusammen 18 I-Rezepte; der N-Slice bleibt bei neun.
    expect(Object.keys(RECIPES)).toHaveLength(216);
    expect(Object.keys(RECIPES).filter((key) => key.startsWith('N.') && key.includes('#'))).toEqual([]);
  });

  it('reproduziert für alle neun Originaldateien den gemessenen Körper-Fingerprint', () => {
    for (const [section, recipe] of Object.entries(nRecipes())) {
      const result = matchFingerprint(
        composeFromCatalog(recipe.spec, recipe.title),
        fingerprintFor(recipe.referenceAsset),
      );
      expect(result.problems, section).toEqual([]);
      expect(result.ok, section).toBe(true);
    }
  });

  it('trägt die fünf quellengetreuen Organisationsfüllungen ohne Umdeutung', () => {
    const expectedFill = {
      'N.1.1': 'braun',
      'N.1.2': 'orange',
      'N.1.3': 'hellgruen',
      'N.1.4': 'braun',
      'N.1.5': 'orange',
      'N.1.6': 'rot',
      'N.2.1': 'hellgrau',
      'N.2.2': 'rot',
      'N.2.3': 'hellgrau',
    } as const;
    for (const [section, fill] of Object.entries(expectedFill)) {
      const recipe = nRecipes()[section];
      expect(recipe, section).toBeDefined();
      if (recipe === undefined) continue;
      const body = composeFromCatalog(recipe.spec, recipe.title).children.find(
        (primitive) => primitive.role === 'body',
      );
      expect(body?.style?.fill, section).toBe(fill);
    }
  });

  it('verwendet genau die drei quellbestätigten Fahrwerke und keine geländegängig-Semantik', () => {
    const tracked = composeFromCatalog(expected['N.1.1'].spec, expected['N.1.1'].title).children
      .filter((primitive) => primitive.role === 'chassis');
    expect(tracked).toEqual([
      expect.objectContaining({
        type: 'rect', x: 2, y: 25.75, width: 28, height: 4.5, rx: 2.25,
      }),
    ]);

    const wheels = composeFromCatalog(expected['N.1.2'].spec, expected['N.1.2'].title).children
      .filter((primitive): primitive is Primitive & { type: 'circle' } =>
        primitive.role === 'chassis' && primitive.type === 'circle');
    expect(wheels.map(({ cx, cy, r }) => ({ cx, cy, r }))).toEqual([
      { cx: 3.75, cy: 28.25, r: 2.25 },
      { cx: 16, cy: 28.25, r: 2.25 },
      { cx: 28.25, cy: 28.25, r: 2.25 },
    ]);

    const bundespolizeiWheels = composeFromCatalog(
      expected['N.1.3'].spec,
      expected['N.1.3'].title,
    ).children.filter((primitive): primitive is Primitive & { type: 'circle' } =>
      primitive.role === 'chassis' && primitive.type === 'circle');
    expect(bundespolizeiWheels.map(({ cx, cy, r }) => ({ cx, cy, r }))).toEqual([
      { cx: 3.75, cy: 28.25, r: 2.25 },
      { cx: 28.25, cy: 28.25, r: 2.25 },
    ]);

    for (const section of Object.keys(expected).filter(
      (key) => !['N.1.1', 'N.1.2', 'N.1.3'].includes(key),
    )) {
      const recipe = expected[section as keyof typeof expected];
      expect(composeFromCatalog(recipe.spec, recipe.title).children.filter(
        (primitive) => primitive.role === 'chassis',
      ), section).toEqual([]);
    }
    expect(JSON.stringify(Object.values(expected).map((recipe) => recipe.spec))).not.toContain(
      'geländegängig',
    );
  });

  it('bindet Körperhüllen, Innenmarken und gemessene Textläufe an die Live-Komposition', () => {
    expect(bodyBounds('N.1.1')).toMatchObject({ minX: 1, minY: 6, maxX: 31, maxY: 25.75 });
    expect(bodyBounds('N.1.2')).toMatchObject({ minX: 1, minY: 5.75, maxX: 31, maxY: 26 });
    expect(bodyBounds('N.2.1')).toMatchObject({ minX: 4, minY: 4, maxX: 28, maxY: 28 });
    expect(bodyBounds('N.2.2')).toMatchObject({ minX: 4, minY: 4, maxX: 28, maxY: 28 });
    expect(bodyBounds('N.2.3')).toMatchObject({ minX: 4, minY: 3, maxX: 28, maxY: 27 });

    const expectedLabels: Record<string, readonly [string, number, number][]> = {
      'N.1.2': [['Kipper,', 2.5, 12.5], ['26 t', 2.5, 16.5]],
      'N.1.3': [['BuPol', 16, 19.5]],
      'N.1.4': [['CH-53', 1, 5], ['7', 23, 19], ['BW', 31, 29]],
      'N.1.5': [['5.000', 7, 13]],
      'N.1.6': [['Cessna 172', 1, 5]],
      'N.2.3': [['291300', 1, 31], ['ZIV', 31, 31]],
    };
    for (const [section, literals] of Object.entries(expectedLabels)) {
      const recipe = nRecipes()[section];
      expect(recipe, section).toBeDefined();
      if (recipe === undefined) continue;
      const labels = composeFromCatalog(recipe.spec, recipe.title).children.filter(
        (primitive): primitive is Primitive & { type: 'text' } =>
          primitive.role === 'label' && primitive.type === 'text',
      );
      expect(labels.map((label) => label.content), section).toEqual(
        literals.map(([content]) => content),
      );
      for (const [index, [, expectedX, expectedY]] of literals.entries()) {
        // Die vollständigen körperrelativen Metriksätze ergeben durch die vermessene SVG/mm-
        // Rundung kleine Sub-Hundertstel-Abweichungen (etwa 13,0001 statt 13 mm bei N.1.5).
        // Das Gate hält deshalb 0,01 mm fest, ohne Inhalt, Reihenfolge oder Boxen zu lockern.
        expect(labels[index]?.x, `${section}: x ${index}`).toBeCloseTo(expectedX, 2);
        expect(labels[index]?.y, `${section}: y ${index}`).toBeCloseTo(expectedY, 2);
      }
      expect(labels.map((label) => label.style?.fill), `${section}: Tinte`).toEqual(
        literals.map(() => 'schwarz'),
      );
    }

    const seven = composeFromCatalog(expected['N.1.4'].spec, expected['N.1.4'].title).children.find(
      (primitive): primitive is Primitive & { type: 'text' } =>
        primitive.role === 'label' && primitive.type === 'text' && primitive.content === '7',
    );
    expect(seven?.anchor).toBe('middle');
    expect(seven?.boxMm?.xMm).toBeCloseTo(20.25, 2);
    expect(seven?.boxMm?.widthMm).toBeCloseTo(5.5, 3);
  });

  it('erhält Trägertext in Titeln und vollständige zugängliche Beschreibungen', () => {
    expect(expected['N.1.2'].title).toContain('kommunaler Bauhof');
    expect(expected['N.1.5'].title).toContain('Beauftragter Dritter');
    const descriptions = {
      'N.1.2':
        'Grundzeichen: Landfahrzeug. Organisation: Sonstige Gefahrenabwehr. ' +
        'Fahrzeugkategorie: Kraftfahrzeugkategorie 2. Technische Körpermarke: Ring 5 mm mit ' +
        'acht Speichen, 3,5 mm nach unten versetzt. Beschriftung im Körper: Kipper, / 26 t.',
      'N.1.3':
        'Grundzeichen: Landfahrzeug. Organisation: Bundespolizei. Fahrzeugkategorie: ' +
        'Kraftfahrzeugkategorie 1. Beschriftung im Körper: BuPol.',
      'N.1.4':
        'Grundzeichen: Luftfahrzeug. Organisation: Bundeswehr. Technische Körpermarke: ' +
        'Luftfahrzeugteilung mit Aufwärtspfeil und Rechteck. Beschriftung im Körper: 7. ' +
        'Beschriftung oberhalb des Körpers: CH-53. Beschriftung auf der Ausgabeoberfläche: BW.',
      'N.1.5':
        'Grundzeichen: Luftfahrzeug. Organisation: Sonstige Gefahrenabwehr. Technische ' +
        'Körpermarke: Waagerechte Linie mit linksweisendem Winkel. Beschriftung im Körper: 5.000.',
      'N.1.6':
        'Grundzeichen: Luftfahrzeug. Organisation: Feuerwehr. Technische Körpermarke: ' +
        'Ansteigende Diagonale im Luftfahrzeugrumpf. Beschriftung oberhalb des Körpers: Cessna 172.',
      'N.2.3':
        'Grundzeichen: 12-mm-Kreis. Organisation: Zivile Einheiten. Technische Körpermarke: ' +
        'Gefüllter Punkt über gefülltem senkrechtem Stamm. Beschriftung auf der ' +
        'Ausgabeoberfläche: 291300. Beschriftung auf der Ausgabeoberfläche: ZIV.',
    } as const;
    for (const [section, recipe] of Object.entries(nRecipes())) {
      const drawing = composeFromCatalog(recipe.spec, recipe.title);
      expect(drawing.title, section).toBe(recipe.title);
      expect(drawing.description, section).toContain('Grundzeichen:');
      expect(drawing.description, section).toContain('Organisation:');
      const expectedDescription = descriptions[section as keyof typeof descriptions];
      if (expectedDescription !== undefined) {
        expect(drawing.description, section).toBe(expectedDescription);
        expect(drawing.description, section).not.toMatch(/Kürzel|Trägerkürzel/);
      }
    }
  });
});

describe('Anhang N — gemessene Labelmetriken bleiben fail-closed', () => {
  const fixedWingTopLeft = {
    kind: 'vehicle-air',
    bodyVariant: 'fixed-wing-hull',
    organization: 'sonstige-gefahrenabwehr',
    bodyMarks: ['air-horizontal-left-chevron'],
  } as const;

  function fixedWingWithMetrics(metrics?: unknown): SymbolSpec {
    return {
      ...fixedWingTopLeft,
      labels: {
        topLeft: '5.000',
        ...(metrics === undefined ? {} : { topLeftMetrics: metrics }),
      },
    } as unknown as SymbolSpec;
  }

  it('verlangt am Festflügelrumpf den vollständigen quellenspezifischen topLeft-Metriksatz', () => {
    expect(() => composeFromCatalog(fixedWingWithMetrics())).toThrow(
      /top-left-metrics-required-by-profile/,
    );
    expect(() => composeFromCatalog(fixedWingWithMetrics({ capHeightMm: 2.919225 }))).toThrow(
      /top-left-metrics-complete/,
    );
  });

  it.each([
    [
      'NaN-Grundlinie',
      { capHeightMm: 2.919225, baselineFromBodyTopMm: Number.NaN, anchorFromBodyLeftMm: 5.99 },
    ],
    [
      'unendlicher Anker',
      {
        capHeightMm: 2.919225,
        baselineFromBodyTopMm: 7,
        anchorFromBodyLeftMm: Number.POSITIVE_INFINITY,
      },
    ],
    [
      'Textbox oberhalb des Körpers',
      { capHeightMm: 2.919225, baselineFromBodyTopMm: 1, anchorFromBodyLeftMm: 5.99 },
    ],
    [
      'Anker links außerhalb des Körpers',
      { capHeightMm: 2.919225, baselineFromBodyTopMm: 7, anchorFromBodyLeftMm: -0.01 },
    ],
    [
      'Anker rechts außerhalb der deklarierten Körperbox',
      { capHeightMm: 2.919225, baselineFromBodyTopMm: 7, anchorFromBodyLeftMm: 28 },
    ],
  ] as const)('lehnt %s vor der Festflügel-Komposition ab', (_case, topLeftMetrics) => {
    expect(() => composeFromCatalog(fixedWingWithMetrics(topLeftMetrics))).toThrow(
      /top-left-metrics-within-body/,
    );
  });

  function raisedHullWithAboveMetrics(metrics: unknown): SymbolSpec {
    return {
      kind: 'vehicle-air',
      bodyVariant: 'raised-hull',
      organization: 'bundeswehr',
      bodyMarks: ['air-quartering-up-arrow-box'],
      labels: { aboveLeft: 'CH-53', aboveLeftMetrics: metrics },
    } as unknown as SymbolSpec;
  }

  it.each([
    ['partielles Objekt', { capHeightMm: 2.919225 }, 'above-left-metrics-complete'],
    [
      'NaN-Versalhöhe',
      { capHeightMm: Number.NaN, baselineFromBodyTopMm: -1, anchorFromBodyLeftMm: -0.01 },
      'above-left-metrics-complete',
    ],
    [
      'unendliche Grundlinie',
      {
        capHeightMm: 2.919225,
        baselineFromBodyTopMm: Number.POSITIVE_INFINITY,
        anchorFromBodyLeftMm: -0.01,
      },
      'above-left-metrics-complete',
    ],
    [
      'Textbox oberhalb der ViewBox',
      { capHeightMm: 2.919225, baselineFromBodyTopMm: -5, anchorFromBodyLeftMm: -0.01 },
      'above-left-metrics-within-viewbox',
    ],
    [
      'Anker links außerhalb der ViewBox',
      { capHeightMm: 2.919225, baselineFromBodyTopMm: -1, anchorFromBodyLeftMm: -1.02 },
      'above-left-metrics-within-viewbox',
    ],
    [
      'Anker rechts außerhalb der Profilbox',
      { capHeightMm: 2.919225, baselineFromBodyTopMm: -1, anchorFromBodyLeftMm: 28 },
      'above-left-metrics-within-viewbox',
    ],
  ] as const)('lehnt aboveLeft-%s vor der Komposition ab', (_case, metrics, rule) => {
    expect(() => composeFromCatalog(raisedHullWithAboveMetrics(metrics))).toThrow(
      new RegExp(rule),
    );
  });

  function landWithCenterBaseline(centerBaselineFromBodyBottomMm: number): SymbolSpec {
    return {
      kind: 'vehicle-land',
      organization: 'bundespolizei',
      vehicleCategory: 'kfz-kategorie-1',
      labels: { center: 'BuPol', centerBaselineFromBodyBottomMm },
    };
  }

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'lehnt die nichtpositive oder nichtendliche mittige Grundlinie %s vor der Komposition ab',
    (centerBaselineFromBodyBottomMm) => {
      expect(() => composeFromCatalog(landWithCenterBaseline(
        centerBaselineFromBodyBottomMm,
      ))).toThrow(/center-baseline-positive/);
    },
  );

  it.each([0.1, 100])(
    'lehnt die aus der Landfahrzeughülle laufende mittige Textbox bei Abstand %s ab',
    (centerBaselineFromBodyBottomMm) => {
      expect(() => composeFromCatalog(landWithCenterBaseline(
        centerBaselineFromBodyBottomMm,
      ))).toThrow(/center-label-within-body/);
    },
  );
});

describe('Anhang N — belegte Ausgabezonen dürfen sich nicht überlagern', () => {
  it('lehnt die Fußzone am Festflügelrumpf statt einer unbelegten Umplatzierung ab', () => {
    expect(() => composeFromCatalog({
      kind: 'vehicle-air',
      bodyVariant: 'fixed-wing-hull',
      organization: 'feuerwehr',
      bodyMarks: ['air-rising-diagonal'],
      designation: 'Cessna 172',
    })).toThrow(/body-variant-foot-conflict/);
  });

  it.each([
    {
      kind: 'vehicle-air',
      bodyVariant: 'raised-hull',
      organization: 'bundeswehr',
      bodyMarks: ['air-quartering-up-arrow-box'],
      designation: 'CH-53',
      labels: { surfaceBelowRight: 'BW' },
    },
    {
      kind: 'circle-12',
      bodyVariant: 'raised-circle-1mm',
      organization: 'zivile-einheiten',
      bodyMarks: ['circle-information-stem'],
      designation: 'Notfallinformationspunkt',
      labels: { surfaceBelowLeft: '291300', surfaceBelowRight: 'ZIV' },
    },
  ] as const)('lehnt designation zusammen mit schwarzen Oberflächenläufen ab', (spec) => {
    expect(() => composeFromCatalog(spec as SymbolSpec)).toThrow(/surface-label-foot-conflict/);
  });
});

describe('Anhang N — farbige Kreisverträge erben keine weißen F.3-Labelmetriken', () => {
  const f3NormalMetrics = {
    capHeightMm: 2.919225,
    baselineFromBodyTopMm: 1.000254,
    anchorFromBodyLeftMm: -2.984684,
  };

  it.each([
    {
      kind: 'circle-12',
      organization: 'zivile-einheiten',
      bodyMarks: ['spontaneous-helper-collection-arrow'],
      labels: { topLeft: 'UHS', topLeftMetrics: f3NormalMetrics },
    },
    {
      kind: 'circle-12',
      organization: 'feuerwehr',
      bodyMarks: ['spontaneous-helper-contact-double-arrow'],
      labels: { topLeft: 'UHS', topLeftMetrics: f3NormalMetrics },
    },
    {
      kind: 'circle-12',
      bodyVariant: 'raised-circle-1mm',
      organization: 'zivile-einheiten',
      bodyMarks: ['circle-information-stem'],
      labels: { topLeft: 'UHS', topLeftMetrics: f3NormalMetrics },
    },
    {
      kind: 'circle-12',
      organization: 'zivile-einheiten',
      bodyMarks: ['spontaneous-helper-collection-arrow'],
      labels: { topLeftMetrics: f3NormalMetrics },
    },
  ] as const)('lehnt topLeft und topLeftMetrics am exakten farbigen Kreisvertrag ab', (spec) => {
    expect(() => composeFromCatalog(spec as unknown as SymbolSpec)).toThrow(
      /colored-circle-top-left-not-measured/,
    );
  });

  it('erhält die realen weißen HiOrg-Kreislabels in normaler und raised-gable-Fassung', () => {
    expect(() => composeFromCatalog(RECIPES['F.3.3'].spec, RECIPES['F.3.3'].title)).not.toThrow();
    expect(() => composeFromCatalog(RECIPES['F.3.5'].spec, RECIPES['F.3.5'].title)).not.toThrow();
  });
});
