import { describe, expect, it } from 'vitest';
import type { SymbolKind, SymbolSpec } from '@einsatzzeichen/schema';
import { validateSpec } from './validate.js';

const runtimeRoleRun = (overrides: Record<string, unknown> = {}) => ({
  content: 'TEL',
  anchorXMm: 16,
  baselineYMm: 18.5,
  sizeMm: 7,
  anchor: 'middle',
  boxMm: { xMm: 10, yMm: 13, widthMm: 12, heightMm: 6 },
  minRenderPx: 37,
  ink: 'schwarz',
  contrastBackground: 'body',
  ...overrides,
});

const runtimeRoleDefinition = (overrides: Record<string, unknown> = {}) => ({
  id: 'fire-service-platoon-commander',
  title: 'Zugführer der Feuerwehr',
  kind: 'person',
  expectedHead: 'strength',
  allowedBodyMarks: ['fire-fighting'],
  layout: {
    headTopMm: 1,
    body: { type: 'rect', role: 'body', x: 3, y: 5, width: 26, height: 26 },
    bodyAdditions: [],
    decorations: [],
    roleRuns: [],
  },
  ...overrides,
});

function validateRuntime(
  spec: Record<string, unknown>,
  context: Record<string, unknown> = {},
): ReturnType<typeof validateSpec> {
  return Reflect.apply(validateSpec, undefined, [spec, context]);
}

describe('validateSpec', () => {
  it('lässt foot-band ausschließlich an den vier vermessenen Logistikkörpern zu', () => {
    expect(validateSpec({ kind: 'formation', bodyVariant: 'foot-band' })).toEqual([]);
    expect(validateSpec({ kind: 'vehicle-land', bodyVariant: 'foot-band' })).toEqual([]);
    expect(validateSpec({ kind: 'trailer', bodyVariant: 'foot-band' })).toEqual([]);
    expect(validateSpec({
      kind: 'circle-12', bodyVariant: 'foot-band', organization: 'feuerwehr',
    })).toEqual([]);
    expect(validateSpec({
      kind: 'circle-12', bodyVariant: 'foot-band', organization: 'bundeswehr',
    })).toEqual([]);

    const forbiddenKinds: readonly SymbolKind[] = [
      'person',
      'vehicle-air',
      'vehicle-water',
      'post',
      'building',
      'container',
      'area',
      'measure',
      'hazard',
      'point',
      'event',
      'spontaneous-helper',
      'swap-loader-vehicle',
      'upright-rectangle',
      'reduced-house',
    ];
    for (const kind of forbiddenKinds) {
      expect(validateSpec({ kind, bodyVariant: 'foot-band' }).map((issue) => issue.rule), kind)
        .toContain('body-variant-requires-measured-kind');
    }
    expect(validateSpec({ kind: 'circle-12', bodyVariant: 'foot-band' })
      .map((issue) => issue.rule)).toContain('circle-12-requires-organization');
  });

  it('verlangt für ein schwarzes belowRight-Profil keine Organisationsfarbe', () => {
    const rules = validateSpec({
      kind: 'circle-12', bodyVariant: 'foot-band', labels: { belowRight: 'Bw' },
    }).map((issue) => issue.rule);
    expect(rules).not.toContain('below-right-label-requires-organization');
    expect(rules).toContain('circle-12-requires-organization');
  });

  it('trennt den offenen G-Kreisvertrag von den exakten farbigen N-Kreisverträgen', () => {
    for (const organization of ['feuerwehr', 'bundeswehr'] as const) {
      expect(validateSpec({
        kind: 'circle-12', bodyVariant: 'foot-band', organization,
      }), organization).toEqual([]);
    }

    const measuredNContracts: readonly SymbolSpec[] = [
      {
        kind: 'circle-12', organization: 'zivile-einheiten',
        bodyMarks: ['spontaneous-helper-collection-arrow'],
      },
      {
        kind: 'circle-12', organization: 'feuerwehr',
        bodyMarks: ['spontaneous-helper-contact-double-arrow'],
      },
      {
        kind: 'circle-12', bodyVariant: 'raised-circle-1mm',
        organization: 'zivile-einheiten', bodyMarks: ['circle-information-stem'],
      },
    ];
    for (const spec of measuredNContracts) {
      expect(validateSpec(spec), JSON.stringify(spec)).toEqual([]);
    }

    const crossedNContracts: readonly SymbolSpec[] = [
      {
        kind: 'circle-12', organization: 'feuerwehr',
        bodyMarks: ['spontaneous-helper-collection-arrow'],
      },
      {
        kind: 'circle-12', organization: 'zivile-einheiten',
        bodyMarks: ['spontaneous-helper-contact-double-arrow'],
      },
      {
        kind: 'circle-12', bodyVariant: 'raised-circle-1mm',
        organization: 'feuerwehr', bodyMarks: ['circle-information-stem'],
      },
    ];
    for (const spec of crossedNContracts) {
      expect(validateSpec(spec).map((issue) => issue.rule), JSON.stringify(spec)).toContain(
        'circle-12-requires-hilfsorganisation',
      );
    }
  });

  it('lässt am gebänderten Formationskörper nur die drei vermessenen Kopfzonen zu', () => {
    for (const strength of ['trupp', 'gruppe', 'zug'] as const) {
      expect(validateSpec({ kind: 'formation', bodyVariant: 'foot-band', strength })).toEqual([]);
    }
    expect(validateSpec({ kind: 'formation', bodyVariant: 'foot-band', strength: 'staffel' })
      .map((issue) => issue.rule)).toContain('foot-band-head-requires-measured-strength');
  });

  it('akzeptiert eine Löschstaffel', () => {
    const spec: SymbolSpec = {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      capabilities: ['fire-fighting'],
    };
    expect(validateSpec(spec)).toEqual([]);
  });

  it('lehnt eine Stärkeangabe an einer Gefahr ab', () => {
    const issues = validateSpec({ kind: 'hazard', strength: 'gruppe' });
    expect(issues.map((i) => i.rule)).toContain('strength-requires-unit');
  });

  it('lehnt eine Stärkeangabe an einem Gebäude ab', () => {
    const issues = validateSpec({ kind: 'building', strength: 'trupp' });
    expect(issues.map((i) => i.rule)).toContain('strength-requires-unit');
  });

  it('lehnt eine Fahrzeugkategorie an einer Formation ab', () => {
    const issues = validateSpec({ kind: 'formation', vehicleCategory: 'kettenfahrzeug' });
    expect(issues.map((i) => i.rule)).toContain('vehicle-category-requires-vehicle');
  });

  it('nimmt eine Fahrzeugkategorie am Landfahrzeug an', () => {
    // Seit LFH-424 zeichnet `compose()` die Fahrwerkszone. Vorher lehnte `validateSpec` diesen
    // Fall ab, damit die Angabe nicht still verschluckt wird.
    expect(validateSpec({ kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-1' })).toEqual([]);
  });

  it('lässt die drei Anhang-N-Körpervarianten nur an ihren vermessenen Arten zu', () => {
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'inverted-hull-track', vehicleCategory: 'kettenfahrzeug',
    } as SymbolSpec)).toEqual([]);
    expect(validateSpec({ kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull' } as SymbolSpec))
      .toEqual([]);
    expect(validateSpec({
      kind: 'circle-12', bodyVariant: 'raised-circle-1mm',
      organization: 'zivile-einheiten', bodyMarks: ['circle-information-stem'],
    } as SymbolSpec)).toEqual([]);
    expect(validateSpec({
      kind: 'circle-12', bodyVariant: 'raised-circle-1mm',
    } as SymbolSpec).map((issue) => issue.rule)).toContain(
      'circle-12-requires-hilfsorganisation',
    );

    for (const spec of [
      { kind: 'vehicle-air', bodyVariant: 'inverted-hull-track' },
      { kind: 'vehicle-land', bodyVariant: 'fixed-wing-hull' },
      { kind: 'formation', bodyVariant: 'raised-circle-1mm' },
    ] as unknown as SymbolSpec[]) {
      expect(validateSpec(spec).map((issue) => issue.rule)).toContain(
        'body-variant-requires-measured-kind',
      );
    }
  });

  it('validiert die generischen gemessenen Anhang-N-Labelmetriken fail-closed', () => {
    expect(validateSpec({
      kind: 'vehicle-land', labels: {
        center: 'BuPol', centerBaselineFromBodyBottomMm: 6.5,
        topLeftLines: ['Kipper,', '26 t'],
      },
    } as SymbolSpec)).toEqual([]);
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull', labels: {
        aboveLeft: 'Cessna 172',
        aboveLeftMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: -1,
          anchorFromBodyLeftMm: -0.01,
        },
      },
    } as SymbolSpec)).toEqual([]);
    expect(validateSpec({
      kind: 'circle-12', bodyVariant: 'raised-circle-1mm',
      organization: 'zivile-einheiten', bodyMarks: ['circle-information-stem'],
      labels: { surfaceBelowLeft: '291300', surfaceBelowRight: 'ZIV' },
    } as SymbolSpec)).toEqual([]);

    expect(validateSpec({
      kind: 'formation', labels: { surfaceBelowLeft: 'X' },
    } as SymbolSpec).map((issue) => issue.rule)).toContain(
      'surface-label-requires-measured-body',
    );
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull', labels: {
        aboveLeft: 'X', aboveLeftMetrics: { capHeightMm: Number.NaN },
      },
    } as unknown as SymbolSpec).map((issue) => issue.rule)).toContain(
      'above-left-metrics-complete',
    );
    expect(validateSpec({
      kind: 'vehicle-land', labels: { centerBaselineFromBodyBottomMm: 6.5 },
    } as SymbolSpec).map((issue) => issue.rule)).toContain(
      'center-baseline-requires-center-label',
    );

    for (const spec of [
      { kind: 'formation', labels: { center: 'X', centerBaselineFromBodyBottomMm: 6.5 } },
      { kind: 'vehicle-air', labels: { center: 'X', centerBaselineFromBodyBottomMm: 6.5 } },
      {
        kind: 'circle-12', bodyVariant: 'raised-circle-1mm',
        labels: { center: 'X', centerBaselineFromBodyBottomMm: 6.5 },
      },
      {
        kind: 'vehicle-land', bodyVariant: 'foot-band',
        labels: { center: 'X', centerBaselineFromBodyBottomMm: 6.5 },
      },
      {
        kind: 'vehicle-land', bodyVariant: 'inverted-hull-track',
        labels: { center: 'X', centerBaselineFromBodyBottomMm: 6.5 },
      },
    ] as SymbolSpec[]) {
      expect(validateSpec(spec).map((issue) => issue.rule), spec.kind).toContain(
        'center-baseline-override-requires-measured-body',
      );
    }

    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull',
      labels: { surfaceBelowLeft: 'X' },
    } as SymbolSpec).map((issue) => issue.rule)).toContain(
      'surface-left-label-requires-measured-anchor',
    );
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull',
      labels: { surfaceBelowRight: 'BW' },
    } as SymbolSpec)).toEqual([]);
  });

  it('lässt die oberhalb liegende F.2.7-Zone nur am Luftfahrzeug zu', () => {
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { aboveLeft: 'ITH' },
    })).toEqual([]);
    expect(validateSpec({ kind: 'vehicle-air', labels: { aboveLeft: 'ITH' } })
      .map((issue) => issue.rule)).toContain('above-left-label-requires-measured-body');
    expect(validateSpec({ kind: 'formation', labels: { aboveLeft: 'ITH' } }).map((issue) => issue.rule))
      .toContain('above-left-label-requires-measured-body');
  });

  it('lässt zweizeilige Läufe an den beiden separat vermessenen Landfahrzeugprofilen zu', () => {
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeftLines: ['GW-San', '50'] },
    }))
      .toEqual([]);
    expect(validateSpec({ kind: 'vehicle-land', labels: { topLeftLines: ['Kipper,', '26 t'] } }))
      .toEqual([]);
    expect(validateSpec({ kind: 'trailer', labels: { topLeftLines: ['GW-San', '50'] } })
      .map((issue) => issue.rule)).toContain('top-left-lines-require-measured-body');
  });

  it('lässt den einzeiligen F.2-Fahrzeuglauf an normaler und foot-band-Hülle zu', () => {
    expect(validateSpec({
      kind: 'vehicle-land', labels: { topLeft: 'BTKombi' },
    })).toEqual([]);
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'foot-band', labels: { topLeft: 'GwBT' },
    })).toEqual([]);
    expect(validateSpec({ kind: 'trailer', labels: { topLeft: 'BT' } })
      .map((issue) => issue.rule)).toContain('top-left-label-requires-measured-body');
    expect(validateSpec({ kind: 'vehicle-air', labels: { topLeft: 'BT' } })
      .map((issue) => issue.rule)).toContain('top-left-label-requires-measured-body');
  });

  const topLeftMetrics = {
    capHeightMm: 2.191447,
    baselineFromBodyTopMm: 5.249923,
    anchorFromBodyLeftMm: 0.51423,
  };

  function withRuntimeTopLeftMetrics(
    kind: SymbolSpec['kind'],
    bodyVariant: SymbolSpec['bodyVariant'],
    metrics: unknown,
    topLeft: string | undefined = 'BTKombi',
  ): SymbolSpec {
    return {
      kind,
      ...(bodyVariant === undefined ? {} : { bodyVariant }),
      labels: { topLeft, topLeftMetrics: metrics },
    } as unknown as SymbolSpec;
  }

  it('lässt gemessene topLeft-Metriken nur an normalem und gebändertem Landfahrzeug zu', () => {
    expect(validateSpec(withRuntimeTopLeftMetrics(
      'vehicle-land', undefined, topLeftMetrics,
    ))).toEqual([]);
    expect(validateSpec(withRuntimeTopLeftMetrics(
      'vehicle-land', 'foot-band', topLeftMetrics,
    ))).toEqual([]);

    for (const spec of [
      withRuntimeTopLeftMetrics('vehicle-land', 'plain-wheel-pair', topLeftMetrics),
      withRuntimeTopLeftMetrics('formation', undefined, topLeftMetrics),
      withRuntimeTopLeftMetrics('trailer', undefined, topLeftMetrics),
    ]) {
      expect(validateSpec(spec).map((issue) => issue.rule)).toContain(
        'top-left-metrics-require-measured-vehicle-land',
      );
    }
  });

  it('verlangt für topLeft-Metriken einen nichtleeren Lauf und alle drei Werte', () => {
    const withoutTopLeft = {
      kind: 'vehicle-land', labels: { topLeftMetrics },
    } as unknown as SymbolSpec;
    expect(validateSpec(withoutTopLeft).map((issue) => issue.rule)).toContain(
      'top-left-metrics-require-top-left-label',
    );
    expect(validateSpec(withRuntimeTopLeftMetrics(
      'vehicle-land', undefined, topLeftMetrics, '   ',
    )).map((issue) => issue.rule)).toContain('top-left-metrics-require-top-left-label');
    expect(validateSpec(withRuntimeTopLeftMetrics(
      'vehicle-land', undefined, { capHeightMm: 2.191447 },
    )).map((issue) => issue.rule)).toContain('top-left-metrics-complete');
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'lehnt die topLeft-Versalhöhe %s ab',
    (capHeightMm) => {
      expect(validateSpec(withRuntimeTopLeftMetrics(
        'vehicle-land', undefined, { ...topLeftMetrics, capHeightMm },
      )).map((issue) => issue.rule)).toContain('top-left-cap-height-positive');
    },
  );

  it.each([-1, 2, 20.26, Number.NaN, Number.POSITIVE_INFINITY])(
    'lehnt die topLeft-Grundlinie %s außerhalb der Landfahrzeughülle ab',
    (baselineFromBodyTopMm) => {
      expect(validateSpec(withRuntimeTopLeftMetrics(
        'vehicle-land', undefined, { ...topLeftMetrics, baselineFromBodyTopMm },
      )).map((issue) => issue.rule)).toContain('top-left-baseline-within-body');
    },
  );

  it.each([-0.01, 28.01, Number.NaN, Number.POSITIVE_INFINITY])(
    'lehnt den topLeft-Anker %s außerhalb der inneren Landfahrzeughülle ab',
    (anchorFromBodyLeftMm) => {
      expect(validateSpec(withRuntimeTopLeftMetrics(
        'vehicle-land', undefined, { ...topLeftMetrics, anchorFromBodyLeftMm },
      )).map((issue) => issue.rule)).toContain('top-left-anchor-within-body');
    },
  );

  const circleTopLeftMetrics = {
    capHeightMm: 2.919225,
    baselineFromBodyTopMm: 1.000254,
    anchorFromBodyLeftMm: -2.984684,
  };
  const raisedCircleTopLeftMetrics = {
    capHeightMm: 2.749893,
    baselineFromBodyTopMm: -0.999746,
    anchorFromBodyLeftMm: -2.974002,
  };

  function circleSpec(
    bodyVariant: 'raised-gable' | undefined,
    topLeft: string,
    metrics: unknown,
    organization: SymbolSpec['organization'] = 'hilfsorganisation',
  ): SymbolSpec {
    return {
      kind: 'circle-12',
      ...(bodyVariant === undefined ? {} : { bodyVariant }),
      organization,
      labels: { topLeft, topLeftMetrics: metrics },
    } as unknown as SymbolSpec;
  }

  it('akzeptiert die vollständigen UHS-, 50- und 500-Metriken nur an ihrer Kreisfassung', () => {
    expect(validateSpec(circleSpec(undefined, 'UHS', circleTopLeftMetrics))).toEqual([]);
    expect(validateSpec(circleSpec(
      'raised-gable', '50', raisedCircleTopLeftMetrics,
    ))).toEqual([]);
    expect(validateSpec(circleSpec(
      'raised-gable', '500', raisedCircleTopLeftMetrics,
    ))).toEqual([]);
  });

  it('verlangt an beiden Kreisfassungen immer einen vollständigen topLeft-Metriksatz', () => {
    const withoutMetrics = {
      kind: 'circle-12', organization: 'hilfsorganisation', labels: { topLeft: 'UHS' },
    } as unknown as SymbolSpec;
    expect(validateSpec(withoutMetrics).map((issue) => issue.rule)).toContain(
      'circle-top-left-requires-metrics',
    );
    expect(validateSpec(circleSpec(
      'raised-gable', '50', { capHeightMm: 2.749893 },
    )).map((issue) => issue.rule)).toContain('top-left-metrics-complete');
  });

  it('erlaubt das vermessene Kreisband, lehnt Varianten an unbelegten Arten aber ab', () => {
    const measuredVariant = {
      kind: 'circle-12', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
    } as unknown as SymbolSpec;
    const gableOnPost = {
      kind: 'post', bodyVariant: 'raised-gable',
    } as unknown as SymbolSpec;
    expect(validateSpec(measuredVariant)).toEqual([]);
    expect(validateSpec(gableOnPost).map((issue) => issue.rule)).toContain(
      'body-variant-requires-measured-kind',
    );
  });

  it('lässt inset-hull ausschließlich am Wasserfahrzeug zu', () => {
    const insetHull = 'inset-hull' as SymbolSpec['bodyVariant'];
    expect(validateSpec({ kind: 'vehicle-water', bodyVariant: insetHull })
      .map((issue) => issue.rule)).not.toContain('body-variant-requires-measured-kind');
    expect(validateSpec({ kind: 'vehicle-land', bodyVariant: insetHull })
      .map((issue) => issue.rule)).toContain('body-variant-requires-measured-kind');
  });

  const validInsetWatercraft = {
    kind: 'vehicle-water',
    bodyVariant: 'inset-hull',
    organization: 'hilfsorganisation',
    labels: { center: 'MzB' },
  } as const satisfies SymbolSpec;

  it('akzeptiert den vermessenen eingesenkten Wasserrumpf mit mittigem Lauf', () => {
    expect(validateSpec(validInsetWatercraft)).toEqual([]);
    expect(validateSpec({
      ...validInsetWatercraft,
      labels: { accessibilityMode: 'neutral-zones', center: 'MzB' },
    })).toEqual([]);
  });

  it('lehnt geerbte inset-hull-Renderingfelder trotz eigenem center ab', () => {
    class InheritedRenderingLabels implements NonNullable<SymbolSpec['labels']> {
      readonly center = 'MzB';

      get inBodyInk(): 'schwarz' {
        return 'schwarz';
      }

      get centerCapHeightMm(): number {
        return 3.4099;
      }
    }

    expect(validateSpec({
      ...validInsetWatercraft,
      labels: new InheritedRenderingLabels(),
    }).map((issue) => issue.rule)).toContain('inset-hull-requires-center-label-only');
  });

  it('akzeptiert inset-hull-Labels als null-prototype-Datenobjekt', () => {
    const labels: NonNullable<SymbolSpec['labels']> = Object.assign(Object.create(null), {
      accessibilityMode: 'neutral-zones' as const,
      center: 'MzB',
    });

    expect(validateSpec({ ...validInsetWatercraft, labels })).toEqual([]);
  });

  const accessorLabels: NonNullable<SymbolSpec['labels']> = Object.create(null);
  Object.defineProperty(accessorLabels, 'center', {
    configurable: true,
    enumerable: true,
    get: () => 'MzB',
  });
  const nonEnumerableLabels: NonNullable<SymbolSpec['labels']> = Object.create(null);
  Object.defineProperty(nonEnumerableLabels, 'center', {
    configurable: true,
    enumerable: false,
    value: 'MzB',
  });
  const symbolLabels: NonNullable<SymbolSpec['labels']> = {
    center: 'MzB',
    [Symbol('rendering-override')]: 'schwarz',
  };
  const foreignLabels = { center: 'MzB', futureRenderingOverride: 'schwarz' };
  const inheritedForeignLabels: NonNullable<SymbolSpec['labels']> = Object.assign(
    Object.create({ harmlessMetadata: true }),
    { center: 'MzB' },
  );

  it.each([
    ['Accessor-Feld', accessorLabels],
    ['nicht-enumerable-Feld', nonEnumerableLabels],
    ['Symbol-Feld', symbolLabels],
    ['fremdem Feld', foreignLabels],
    ['nichttrivialem Prototyp', inheritedForeignLabels],
  ] as const)('lehnt inset-hull-Labels mit %s ab', (_case, labels) => {
    expect(validateSpec({ ...validInsetWatercraft, labels }).map((issue) => issue.rule)).toContain(
      'inset-hull-requires-center-label-only',
    );
  });

  it.each([
    ['fehlender Organisation', {
      kind: 'vehicle-water', bodyVariant: 'inset-hull', labels: { center: 'MzB' },
    }],
    ['THW-Organisation', { ...validInsetWatercraft, organization: 'thw' }],
    ['Feuerwehr-Organisation', { ...validInsetWatercraft, organization: 'feuerwehr' }],
  ] as const)('lehnt inset-hull mit %s ab', (_case, spec) => {
    expect(validateSpec(spec).map((issue) => issue.rule)).toContain(
      'inset-hull-requires-hilfsorganisation',
    );
  });

  it.each([
    ['bottomLeft', { ...validInsetWatercraft, labels: { bottomLeft: 'BL' } }],
    ['bottomCenter', { ...validInsetWatercraft, labels: { bottomCenter: 'BC' } }],
    ['bottomRight', { ...validInsetWatercraft, labels: { bottomRight: 'BR' } }],
    ['topLeft', { ...validInsetWatercraft, labels: { topLeft: 'TL' } }],
    ['topLeftMetrics', {
      ...validInsetWatercraft,
      labels: {
        topLeftMetrics: {
          capHeightMm: 2.191447, baselineFromBodyTopMm: 5.249923, anchorFromBodyLeftMm: 0.51423,
        },
      },
    }],
    ['aboveLeft', { ...validInsetWatercraft, labels: { aboveLeft: 'AL' } }],
    ['aboveLeftMetrics', {
      ...validInsetWatercraft,
      labels: {
        aboveLeftMetrics: {
          capHeightMm: 2.919225, baselineFromBodyTopMm: -1, anchorFromBodyLeftMm: -0.01,
        },
      },
    }],
    ['topLeftLines', {
      ...validInsetWatercraft, labels: { topLeftLines: ['one', 'two'] },
    }],
    ['belowRight', { ...validInsetWatercraft, labels: { belowRight: 'BR' } }],
    ['inBodyInk', { ...validInsetWatercraft, labels: { inBodyInk: 'schwarz' } }],
    ['centerBaselineFromBodyBottomMm', {
      ...validInsetWatercraft,
      labels: { center: 'MzB', centerBaselineFromBodyBottomMm: 7.99 },
    }],
    ['centerCapHeightMm', {
      ...validInsetWatercraft, labels: { center: 'MzB', centerCapHeightMm: 3.4099 },
    }],
    ['bottomRightMetrics', {
      ...validInsetWatercraft,
      labels: {
        bottomRight: 'HiOrg',
        bottomRightMetrics: {
          capHeightMm: 2.919225,
          baselineFromBodyTopMm: 12,
          anchorFromBodyLeftMm: 24,
          boxLeftFromBodyLeftMm: 15,
          boxWidthMm: 15,
        },
      },
    }],
    ['surfaceBelowLeft', {
      ...validInsetWatercraft, labels: { surfaceBelowLeft: '291300' },
    }],
    ['surfaceBelowRight', {
      ...validInsetWatercraft, labels: { surfaceBelowRight: 'ZIV' },
    }],
  ] as const)('lehnt die ungemessene inset-hull-Labelzone %s ab', (_zone, spec) => {
    expect(validateSpec(spec).map((issue) => issue.rule)).toContain(
      'inset-hull-requires-center-label-only',
    );
  });

  it('lehnt die inset-hull-Fußbezeichnung als ungemessene Zone ab', () => {
    expect(validateSpec({ ...validInsetWatercraft, designation: 'MzB' }).map((issue) => issue.rule))
      .toContain('inset-hull-requires-center-label-only');
  });

  it('lässt inset-hull für spätere unbeschriftete Boote ohne Labels zu', () => {
    expect(validateSpec({
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation',
    })).toEqual([]);
  });

  it('lässt raised-hull-Wasserfahrzeuge unverändert', () => {
    expect(validateSpec({
      kind: 'vehicle-water', bodyVariant: 'raised-hull', organization: 'thw', labels: { center: 'MzB' },
    })).toEqual([]);
  });

  it('bindet reduced-house auch ohne Label an HiOrg und lehnt jede Variante ab', () => {
    const reducedHouse = 'reduced-house' as SymbolSpec['kind'];
    expect(validateSpec({ kind: reducedHouse, organization: 'hilfsorganisation' })).toEqual([]);
    for (const organization of [undefined, 'thw'] as const) {
      expect(validateSpec({
        kind: reducedHouse,
        ...(organization === undefined ? {} : { organization }),
      }).map((issue) => issue.rule)).toContain('reduced-house-requires-hilfsorganisation');
    }
    expect(validateSpec({
      kind: reducedHouse, bodyVariant: 'raised-gable', organization: 'hilfsorganisation',
    }).map((issue) => issue.rule)).toContain('body-variant-requires-measured-kind');
  });

  it('bindet jeden gemessenen 12-mm-Kreis auch ohne Label an die weiße HiOrg-Fläche', () => {
    const wrongOrganization = {
      kind: 'circle-12', organization: 'feuerwehr',
    } as unknown as SymbolSpec;
    const missingOrganization = {
      kind: 'circle-12',
    } as unknown as SymbolSpec;
    expect(validateSpec(wrongOrganization).map((issue) => issue.rule)).toContain(
      'circle-12-requires-hilfsorganisation',
    );
    expect(validateSpec(missingOrganization).map((issue) => issue.rule)).toContain(
      'circle-12-requires-hilfsorganisation',
    );
    expect(validateSpec({
      kind: 'circle-12', bodyVariant: 'raised-gable', organization: 'feuerwehr',
    } as unknown as SymbolSpec).map((issue) => issue.rule)).toContain(
      'circle-12-requires-hilfsorganisation',
    );
  });

  it('begrenzt negative Kreis-Metriken gegen die ViewBox statt gegen die Kreisfläche', () => {
    expect(validateSpec(circleSpec(undefined, 'UHS', {
      ...circleTopLeftMetrics, anchorFromBodyLeftMm: -4.01,
    })).map((issue) => issue.rule)).toContain('circle-top-left-anchor-within-viewbox');
    expect(validateSpec(circleSpec('raised-gable', '50', {
      ...raisedCircleTopLeftMetrics, baselineFromBodyTopMm: -6.01,
    })).map((issue) => issue.rule)).toContain('circle-top-left-baseline-within-viewbox');
    expect(validateSpec(circleSpec(undefined, 'UHS', {
      ...circleTopLeftMetrics, anchorFromBodyLeftMm: Number.NaN,
    })).map((issue) => issue.rule)).toContain('circle-top-left-anchor-within-viewbox');
    expect(validateSpec(circleSpec(undefined, 'UHS', {
      ...circleTopLeftMetrics, anchorFromBodyLeftMm: 22.01,
    })).map((issue) => issue.rule)).toContain('circle-top-left-anchor-within-viewbox');
  });

  it('bindet beide F.2-Sonderzonen an das exakte Art-/Variantenpaar', () => {
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'raised-hull',
      labels: { topLeftLines: ['GW-San', '50'] },
    }).map((issue) => issue.rule)).toContain('top-left-lines-require-measured-body');
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'plain-wheel-pair', labels: { aboveLeft: 'ITH' },
    }).map((issue) => issue.rule)).toContain('above-left-label-requires-measured-body');
  });

  it('lehnt überlagerte Fahrwerks- und Fußzonen an F.2-Körpervarianten ab', () => {
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair',
      vehicleCategory: 'kfz-kategorie-1',
    }).map((issue) => issue.rule)).toContain('plain-wheel-pair-chassis-conflict');
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', designation: 'Reserve',
    }).map((issue) => issue.rule)).toContain('body-variant-foot-conflict');
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull', designation: 'RTH',
    }).map((issue) => issue.rule)).toContain('body-variant-foot-conflict');
  });

  it('lehnt eine leere Einzelzeile der zweizeiligen Zone ab', () => {
    expect(validateSpec({ kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeftLines: ['GW-San', '  '] } })
      .map((issue) => issue.rule)).toContain('label-not-blank');
  });

  it('verlangt auch zur Laufzeit exakt zwei Zeilen statt zusätzliche still zu verlieren', () => {
    const invalid = ['GW-San', '50', 'Reserve'] as unknown as readonly [string, string];
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeftLines: invalid },
    }).map((issue) => issue.rule)).toContain('top-left-lines-exactly-two');
  });

  it.each(['vehicle-air', 'vehicle-water'] as const)(
    'lehnt eine Fahrzeugkategorie an "%s" ab',
    (kind) => {
      // Gemessen (18. August 2026): keine der drei Luftfahrzeugdateien 5.1.4.1 bis 5.1.4.3 und
      // keines der fünf Wasserfahrzeuge E.2.27 bis E.2.31 trägt eine Fahrwerkszone. „Fahrzeug"
      // war die Annahme, „Landfahrzeug" ist die Messung.
      const issues = validateSpec({ kind, vehicleCategory: 'kfz-kategorie-1' });
      expect(issues.map((i) => i.rule)).toEqual(['vehicle-category-requires-vehicle']);
    },
  );

  it('lehnt Fahrzeugkategorie und Bezeichnung gleichzeitig ab', () => {
    // Die Fahrwerkszone reicht 4,75 mm unter die Körperunterkante, die Fußzone beginnt 1 mm
    // darunter und ist 4 mm hoch — 3,75 mm Überschneidung. Kein Zeichen der Referenz trägt beides.
    const issues = validateSpec({
      kind: 'vehicle-land',
      vehicleCategory: 'kfz-kategorie-1',
      designation: 'MTW 1',
    });
    expect(issues.map((i) => i.rule)).toEqual(['chassis-foot-conflict']);
  });

  it('lässt eine Fahrzeugkategorie neben Beschriftungen im Körper zu', () => {
    // Anhang E.2 beschriftet seine Fahrzeuge ausschließlich in den Körperzonen — alle 26
    // Fahrwerksdateien tun das.
    expect(
      validateSpec({
        kind: 'vehicle-land',
        vehicleCategory: 'kfz-kategorie-1',
        labels: { bottomRight: 'THW' },
      }),
    ).toEqual([]);
  });

  it('akzeptiert ausschließlich eine aufgelöste, vermessene Verwaltungsstufe', () => {
    const supportedSpec = {
      kind: 'person',
      administrativeLevel: 'kreis',
      functionRole: 'technical-incident-commander',
    };
    const supportedRole = runtimeRoleDefinition({
      id: 'technical-incident-commander',
      title: 'Technischer Einsatzleiter',
      expectedHead: 'administrative',
      allowedBodyMarks: [],
    });
    const administrativeHead = {
      box: { xMm: 9.143, yMm: 0, widthMm: 13.714, heightMm: 4 },
      heightMm: 4,
      primitives: [],
    };

    expect(validateRuntime(supportedSpec, {
      functionRole: supportedRole,
      administrativeHead,
    })).toEqual([]);
    expect(validateRuntime(
      { kind: 'person', administrativeLevel: 'gemeinde' },
      { administrativeHead: undefined },
    ).map((issue) => issue.rule)).toContain('administrative-level-not-measured');
  });

  it.each(['kreis', 'nationalstaat', 'europaeische-union'] as const)(
    'lehnt die aufgelöste Verwaltungsstufe %s ohne gemessene Funktionsrolle ab',
    (administrativeLevel) => {
      const issues = validateRuntime(
        { kind: 'person', administrativeLevel },
        {
          administrativeHead: {
            box: { xMm: 0, yMm: 0, widthMm: 32, heightMm: 4 },
            heightMm: 4,
            primitives: [],
          },
        },
      );

      expect(issues.map((issue) => issue.rule)).toContain('administrative-level-not-measured');
    },
  );

  it('lehnt eine Rolle ab, wenn Art, Definition oder Kopf nicht zur Messung passen', () => {
    expect(validateRuntime(
      { kind: 'building', functionRole: 'fire-service-platoon-commander' },
      { functionRole: runtimeRoleDefinition() },
    ).map((issue) => issue.rule)).toContain('function-role-requires-measured-kind');
    expect(validateRuntime(
      { kind: 'person', functionRole: 'fire-service-platoon-commander', strength: 'zug' },
    ).map((issue) => issue.rule)).toContain('function-role-requires-measured-layout');
    expect(validateRuntime(
      { kind: 'person', functionRole: 'fire-service-platoon-commander' },
      { functionRole: runtimeRoleDefinition() },
    ).map((issue) => issue.rule)).toContain('function-role-head-mismatch');
    expect(validateRuntime(
      { kind: 'person', functionRole: 'fire-service-platoon-commander', strength: 'zug' },
      { functionRole: runtimeRoleDefinition({ id: 'incident-commander' }) },
    ).map((issue) => issue.rule)).toContain('function-role-requires-measured-layout');
  });

  it('schließt nicht vermessene Rollenachsen und Körpermarken fail-closed aus', () => {
    const context = { functionRole: runtimeRoleDefinition() };
    const base = {
      kind: 'person',
      functionRole: 'fire-service-platoon-commander',
      strength: 'zug',
    };
    expect(validateRuntime({ ...base, bodyVariant: 'raised-hull' }, context)
      .map((issue) => issue.rule)).toContain('function-role-body-variant-not-measured');
    expect(validateRuntime({ ...base, capabilities: ['fire-fighting'] }, context)
      .map((issue) => issue.rule)).toContain('function-role-capabilities-not-measured');
    expect(validateRuntime({ ...base, bodyMarks: ['care'] }, context)
      .map((issue) => issue.rule)).toContain('function-role-body-mark-mismatch');
  });

  it('verlangt vollständige sichtbare Rollenmetriken und getrennte Textboxen', () => {
    const spec = {
      kind: 'person',
      functionRole: 'fire-service-platoon-commander',
      strength: 'zug',
    };
    const invalidDefinitions = [
      runtimeRoleDefinition({
        layout: {
          headTopMm: 1,
          body: { type: 'rect', role: 'body', x: 3, y: 5, width: 26, height: 26 },
          bodyAdditions: [], decorations: [], roleRuns: [runtimeRoleRun({ content: '   ' })],
        },
      }),
      runtimeRoleDefinition({
        layout: {
          headTopMm: 1,
          body: { type: 'rect', role: 'body', x: 3, y: 5, width: 26, height: 26 },
          bodyAdditions: [], decorations: [],
          roleRuns: [runtimeRoleRun({ sizeMm: Number.NaN, minRenderPx: 0 })],
        },
      }),
      runtimeRoleDefinition({
        layout: {
          headTopMm: 1,
          body: { type: 'rect', role: 'body', x: 3, y: 5, width: 26, height: 26 },
          bodyAdditions: [], decorations: [], roleRuns: [runtimeRoleRun()],
          carrierRun: runtimeRoleRun({ content: 'AW' }),
        },
      }),
    ];
    for (const definition of invalidDefinitions) {
      expect(validateRuntime(spec, { functionRole: definition }).map((issue) => issue.rule))
        .toContain('function-role-label-metrics-required');
    }
  });

  it('akzeptiert den semantischen Kontrastlauf und bleibt für unbekanntes Ink fail-closed', () => {
    const spec = {
      kind: 'person',
      functionRole: 'fire-service-platoon-commander',
      strength: 'zug',
    };
    const definitionWithInk = (ink: string) => runtimeRoleDefinition({
      layout: {
        headTopMm: 1,
        body: { type: 'rect', role: 'body', x: 3, y: 5, width: 26, height: 26 },
        bodyAdditions: [],
        decorations: [],
        roleRuns: [runtimeRoleRun({ ink })],
      },
    });

    expect(validateRuntime(spec, {
      functionRole: definitionWithInk('funktionslauf-kontrast'),
    })).toEqual([]);
    expect(validateRuntime(spec, {
      functionRole: definitionWithInk('unbekanntes-ink'),
    }).map((issue) => issue.rule)).toContain('function-role-label-metrics-required');
  });

  it('lehnt unvollständige Layouts, falsche Kopfanker und versteckten Dekorationstext ab', () => {
    const spec = {
      kind: 'person',
      functionRole: 'fire-service-platoon-commander',
      strength: 'zug',
    };
    const withoutHeadTop = runtimeRoleDefinition({
      layout: {
        body: { type: 'rect', role: 'body', x: 3, y: 5, width: 26, height: 26 },
        bodyAdditions: [], decorations: [], roleRuns: [],
      },
    });
    expect(validateRuntime(spec, { functionRole: withoutHeadTop }).map((issue) => issue.rule))
      .toContain('function-role-head-mismatch');

    const hiddenText = runtimeRoleDefinition({
      layout: {
        headTopMm: 1,
        body: { type: 'rect', role: 'body', x: 3, y: 5, width: 26, height: 26 },
        bodyAdditions: [],
        decorations: [{
          type: 'text', content: 'versteckt', x: 16, y: 18, sizeMm: 4,
          anchor: 'middle', baseline: 'alphabetic',
          boxMm: { xMm: 10, yMm: 14, widthMm: 12, heightMm: 5 },
        }],
        roleRuns: [],
      },
    });
    expect(validateRuntime(spec, { functionRole: hiddenText }).map((issue) => issue.rule))
      .toContain('function-role-requires-measured-layout');
  });

  it.each([
    ['fehlendes Layout', runtimeRoleDefinition({ layout: undefined })],
    ['fehlende Rollenläufe', runtimeRoleDefinition({
      layout: {
        headTopMm: 1,
        body: { type: 'rect', role: 'body', x: 3, y: 5, width: 26, height: 26 },
        bodyAdditions: [], decorations: [],
      },
    })],
    ['nicht-arrayförmige Rollenläufe', runtimeRoleDefinition({
      layout: {
        headTopMm: 1,
        body: { type: 'rect', role: 'body', x: 3, y: 5, width: 26, height: 26 },
        bodyAdditions: [], decorations: [], roleRuns: {},
      },
    })],
  ])('meldet für %s stabil ein unvollständiges Rollenlayout', (_name, functionRole) => {
    const issues = validateRuntime(
      {
        kind: 'person', functionRole: 'fire-service-platoon-commander', strength: 'zug',
      },
      { functionRole },
    );

    expect(issues.map((issue) => issue.rule)).toContain('function-role-requires-measured-layout');
  });

  it('meldet einen malformed Rollenlauf mit der stabilen Metrikregel', () => {
    const functionRole = runtimeRoleDefinition({
      layout: {
        headTopMm: 1,
        body: { type: 'rect', role: 'body', x: 3, y: 5, width: 26, height: 26 },
        bodyAdditions: [], decorations: [], roleRuns: [null],
      },
    });

    const issues = validateRuntime(
      {
        kind: 'person', functionRole: 'fire-service-platoon-commander', strength: 'zug',
      },
      { functionRole },
    );

    expect(issues.map((issue) => issue.rule)).toContain('function-role-label-metrics-required');
  });

  it('lehnt Stärke und Verwaltungsstufe gleichzeitig ab', () => {
    const issues = validateSpec({
      kind: 'formation',
      strength: 'gruppe',
      administrativeLevel: 'kreis',
    });
    expect(issues.map((i) => i.rule)).toContain('head-zone-conflict');
  });

  it('lehnt eine leere Bezeichnung ab', () => {
    const issues = validateSpec({ kind: 'formation', designation: '   ' });
    expect(issues.map((i) => i.rule)).toContain('designation-not-blank');
  });

  it('bindet den Körperlabel-Tintenoverride an tatsächlich gesetzten Text im Körper', () => {
    expect(validateSpec({
      kind: 'formation', labels: { center: 'BuPol', inBodyInk: 'schwarz' },
    } as unknown as SymbolSpec)).toEqual([]);
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull',
      labels: { aboveLeft: 'CH-53', surfaceBelowRight: 'BW', inBodyInk: 'schwarz' },
    } as unknown as SymbolSpec).map((issue) => issue.rule)).toContain(
      'in-body-ink-requires-in-body-label',
    );
  });

  const bottomRightMetrics = {
    capHeightMm: 2.750245,
    baselineFromBodyTopMm: 13.000087,
    anchorFromBodyLeftMm: 21.99,
    boxLeftFromBodyLeftMm: 19.24,
    boxWidthMm: 5.5,
  };

  function withBottomRightMetrics(
    metrics: unknown,
    bottomRight: string | null = '7',
    kind: SymbolSpec['kind'] = 'vehicle-air',
    bodyVariant: SymbolSpec['bodyVariant'] = 'raised-hull',
  ): SymbolSpec {
    return {
      kind, bodyVariant,
      labels: {
        ...(bottomRight === null ? {} : { bottomRight }),
        bottomRightMetrics: metrics,
      },
    } as unknown as SymbolSpec;
  }

  it('bindet vollständige bottomRight-Metriken an das gemessene Körperprofil und den Lauf', () => {
    expect(validateSpec(withBottomRightMetrics(bottomRightMetrics))).toEqual([]);
    expect(validateSpec(withBottomRightMetrics(bottomRightMetrics, null)).map(
      (issue) => issue.rule,
    )).toContain('bottom-right-metrics-require-bottom-right-label');
    expect(validateSpec(withBottomRightMetrics(
      bottomRightMetrics, '7', 'formation', undefined,
    )).map((issue) => issue.rule)).toContain('bottom-right-metrics-require-measured-body');
    expect(validateSpec(withBottomRightMetrics(
      bottomRightMetrics, '7', 'vehicle-air', 'fixed-wing-hull',
    )).map((issue) => issue.rule)).toContain('bottom-right-metrics-require-measured-body');
  });

  it('lehnt unvollständige und außerhalb der Körperhülle liegende bottomRight-Metriken ab', () => {
    expect(validateSpec(withBottomRightMetrics({ capHeightMm: 2.750245 })).map(
      (issue) => issue.rule,
    )).toContain('bottom-right-metrics-complete');

    for (const metrics of [
      { ...bottomRightMetrics, capHeightMm: 0 },
      { ...bottomRightMetrics, baselineFromBodyTopMm: 3 },
      { ...bottomRightMetrics, anchorFromBodyLeftMm: 24.75 },
      { ...bottomRightMetrics, boxLeftFromBodyLeftMm: -0.01 },
      { ...bottomRightMetrics, boxWidthMm: 0 },
      { ...bottomRightMetrics, boxLeftFromBodyLeftMm: 25, boxWidthMm: 5.5 },
      {
        ...bottomRightMetrics,
        anchorFromBodyLeftMm: 27.2295,
        boxLeftFromBodyLeftMm: 24.4795,
        boxWidthMm: 5.5,
      },
      { ...bottomRightMetrics, anchorFromBodyLeftMm: Number.NaN },
    ]) {
      expect(validateSpec(withBottomRightMetrics(metrics)).map((issue) => issue.rule))
        .toContain('bottom-right-metrics-within-body');
    }
  });

  it('nennt in jeder Meldung Regel und Begründung', () => {
    for (const issue of validateSpec({ kind: 'hazard', strength: 'gruppe' })) {
      expect(issue.rule).not.toBe('');
      expect(issue.message.length).toBeGreaterThan(10);
    }
  });
});
