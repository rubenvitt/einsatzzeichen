import { describe, expect, it } from 'vitest';
import type { BodyMarkId, SymbolKind, SymbolSpec } from '@einsatzzeichen/schema';
import { drawSymbol } from './default-ports.js';
import {
  ANHANG_C_BODY_MARK_CONTEXTS,
  measuredBodyMarkRenditions,
} from './geometry/body-marks-anhang-c/index.js';
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

const runtimeRoleDefinition = (overrides: Record<string, unknown> = {}) => {
  const expectedHead = overrides.expectedHead ?? 'strength';
  return {
    id: 'fire-service-platoon-commander',
    title: 'Zugführer der Feuerwehr',
    kind: 'person',
    expectedHead,
    expectedOrganization: 'feuerwehr',
    ...(expectedHead === 'strength' ? { expectedStrength: 'zug' } : {}),
    ...(expectedHead === 'administrative'
      ? { expectedAdministrativeLevel: 'kreis' }
      : {}),
    allowedBodyMarks: ['fire-fighting'],
    layout: {
      headTopMm: 1,
      body: { type: 'rect', role: 'body', x: 3, y: 5, width: 26, height: 26 },
      bodyAdditions: [],
      decorations: [],
      roleRuns: [],
    },
    ...overrides,
  };
};

function validateRuntime(
  spec: Record<string, unknown>,
  context: Record<string, unknown> = {},
): ReturnType<typeof validateSpec> {
  return Reflect.apply(validateSpec, undefined, [spec, context]);
}

describe('validateSpec', () => {
  it('lehnt technische Körperfüllung zusammen mit Organisationssemantik ab', () => {
    expect(validateRuntime({
      kind: 'person',
      organization: 'hilfsorganisation',
      technicalFill: 'weiss',
    }).map((issue) => issue.rule)).toContain('technical-fill-organization-conflict');
  });

  it('akzeptiert nur einen bekannten Farbtoken als technische Körperfüllung', () => {
    expect(validateRuntime({ kind: 'person', technicalFill: 'weiss' })).toEqual([]);
    expect(validateRuntime({ kind: 'person', technicalFill: 'white' })
      .map((issue) => issue.rule)).toContain('technical-fill-token-invalid');
  });

  it('lehnt die Tinten-Tokens als technische Körperfüllung ab (LFH-990)', () => {
    for (const technicalFill of ['funktionslauf-kontrast', 'koerperlauf-kontrast']) {
      expect(validateSpec({ kind: 'person', technicalFill } as SymbolSpec)
        .map((issue) => issue.rule), technicalFill).toContain('technical-fill-token-invalid');
    }
  });

  it('lässt die zwei I.5-Personrauten nur an person zu', () => {
    const variants = [
      'compact-person-diamond-26mm',
      'compact-person-diamond-26mm-lowered-2mm',
    ] as const;

    for (const bodyVariant of variants) {
      const personSpec = { kind: 'person', bodyVariant } as SymbolSpec;
      expect(() => validateSpec(personSpec), bodyVariant).not.toThrow();
      expect(validateSpec(personSpec)).toEqual([]);
      for (const kind of ['formation', 'vehicle-air', 'circle-12'] as const) {
        expect(validateSpec({ kind, bodyVariant } as SymbolSpec).map((issue) => issue.rule),
          `${kind}/${bodyVariant}`).toContain('body-variant-requires-measured-kind');
      }
    }

    expect(validateSpec({
      kind: 'person', bodyVariant: 'compact-person-diamond-26mm-lowered-2mm',
      labels: {
        aboveLeft: 'Taucher',
        aboveLeftMetrics: {
          capHeightMm: 2,
          baselineFromBodyTopMm: -1,
          anchorFromBodyLeftMm: -2,
        },
      },
    } as SymbolSpec)).toEqual([]);
  });

  it('lässt foot-band an jeder Art außer den Kreiskörpern von Agent A zu', () => {
    expect(validateSpec({ kind: 'formation', bodyVariant: 'foot-band' })).toEqual([]);
    expect(validateSpec({ kind: 'vehicle-land', bodyVariant: 'foot-band' })).toEqual([]);
    expect(validateSpec({ kind: 'trailer', bodyVariant: 'foot-band' })).toEqual([]);
    expect(validateSpec({
      kind: 'circle-12', bodyVariant: 'foot-band', organization: 'feuerwehr',
    })).toEqual([]);
    expect(validateSpec({
      kind: 'circle-12', bodyVariant: 'foot-band', organization: 'bundeswehr',
    })).toEqual([]);

    // Seit dem 02.10.2026 abgeleitet (derive/body-variant-pairs.ts): das Fußband ist ein
    // übertragbarer Modifikator und keine artgebundene Form.
    const derivedKinds: readonly SymbolKind[] = [
      'person',
      'vehicle-air',
      'vehicle-water',
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
    ];
    for (const kind of derivedKinds) {
      expect(validateSpec({ kind, bodyVariant: 'foot-band' }), kind).toEqual([]);
    }
    expect(validateSpec({
      kind: 'reduced-house', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
    })).toEqual([]);
    // Seit dem 2. Oktober 2026 trägt auch die Funktionsstelle das Fußband (`derive/circle.ts`),
    // und der gebänderte Kreis trägt ohne Organisation: weiße Fläche.
    expect(validateSpec({ kind: 'post', bodyVariant: 'foot-band' })).toEqual([]);
    expect(validateSpec({ kind: 'circle-12', bodyVariant: 'foot-band' })).toEqual([]);
  });

  it('verlangt für ein schwarzes belowRight-Profil keine Organisationsfarbe', () => {
    const rules = validateSpec({
      kind: 'circle-12', bodyVariant: 'foot-band', labels: { belowRight: 'Bw' },
    }).map((issue) => issue.rule);
    expect(rules).toEqual([]);
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
    // Seit dem 2. Oktober 2026 trägt jede Organisation den Kreis; die vertauschten Verträge sind
    // abgeleitete Füllungen und keine Ablehnung mehr.
    for (const spec of crossedNContracts) {
      expect(validateSpec(spec), JSON.stringify(spec)).toEqual([]);
    }
  });

  it('lässt am gebänderten Formationskörper jede Stärke zu (Staffel abgeleitet, Band folgt)', () => {
    // Seit dem 2. Oktober 2026 wandert das Fußband mit dem Körper (`derive/head-zone.ts`); die
    // Zeichnung prüft `derive/head-zone.test.ts`.
    for (const strength of ['trupp', 'staffel', 'gruppe', 'zug'] as const) {
      expect(validateSpec({ kind: 'formation', bodyVariant: 'foot-band', strength })).toEqual([]);
    }
  });

  it('akzeptiert eine Löschstaffel', () => {
    // C.1.1: die Brandbekämpfung in ihrer vermessenen Körperfassung, nicht in der Boxfassung.
    const spec: SymbolSpec = {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      bodyMarks: ['fire-fighting'],
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
    } as SymbolSpec)).toEqual([]);

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

  it('validiert die gemessenen Anhang-N- und I-g-Labelmetriken fail-closed', () => {
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

    // Seit dem 2. Oktober 2026 an jeder Körperform zulässig (abgeleitet, `derive/label-zones.ts`).
    expect(validateSpec({
      kind: 'formation', labels: { surfaceBelowLeft: 'X' },
    } as SymbolSpec)).toEqual([]);
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

    expect(validateSpec({
      kind: 'formation',
      labels: {
        center: 'Strömungsrettung',
        centerBaselineFromBodyBottomMm: 16,
        centerCapHeightMm: 2.5,
        centerBoxMarginMm: 0.5,
      },
    })).toEqual([]);

    expect(validateSpec({
      kind: 'formation', labels: { centerBoxMarginMm: 0.5 },
    } as SymbolSpec).map((issue) => issue.rule)).toContain(
      'center-box-margin-requires-center-label',
    );
    expect(validateSpec({
      kind: 'formation', labels: { center: 'X', centerBoxMarginMm: -0.1 },
    } as SymbolSpec).map((issue) => issue.rule)).toContain(
      'center-box-margin-non-negative',
    );
    expect(validateSpec({
      kind: 'formation', labels: { center: 'X', centerBoxMarginMm: 15 },
    } as SymbolSpec).map((issue) => issue.rule)).toContain(
      'center-box-margin-within-body',
    );
    // Rand und Grundlinie des mittigen Laufs gelten seit dem 2. Oktober 2026 an jeder
    // Körperhülle; die Grenze prüfen `center-box-margin-within-body` und
    // `center-label-within-body` gegen die (abgeleitete) Hülle.
    expect(validateSpec({
      kind: 'formation', bodyVariant: 'foot-band',
      labels: { center: 'X', centerBoxMarginMm: 0.5 },
    } as SymbolSpec)).toEqual([]);
    expect(validateSpec({
      kind: 'vehicle-land', labels: { center: 'X', centerBoxMarginMm: 0.5 },
    } as SymbolSpec)).toEqual([]);
    expect(validateSpec({
      kind: 'container', labels: { center: 'X', centerBoxMarginMm: 12 },
    } as SymbolSpec).map((issue) => issue.rule)).toContain('center-box-margin-within-body');

    for (const spec of [
      { kind: 'vehicle-air', labels: { center: 'X', centerBaselineFromBodyBottomMm: 6.5 } },
      {
        kind: 'vehicle-land', bodyVariant: 'foot-band',
        labels: { center: 'X', centerBaselineFromBodyBottomMm: 6.5 },
      },
      {
        kind: 'formation', bodyVariant: 'foot-band',
        labels: { center: 'X', centerBaselineFromBodyBottomMm: 6.5 },
      },
      {
        kind: 'vehicle-land', bodyVariant: 'inverted-hull-track',
        labels: { center: 'X', centerBaselineFromBodyBottomMm: 6.5 },
      },
    ] as SymbolSpec[]) {
      expect(validateSpec(spec), spec.kind).toEqual([]);
    }
    expect(validateSpec({
      kind: 'vehicle-air', labels: { center: 'X', centerBaselineFromBodyBottomMm: 15 },
    } as SymbolSpec).map((issue) => issue.rule)).toContain('center-label-within-body');

    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull',
      labels: { surfaceBelowLeft: 'X' },
    } as SymbolSpec)).toEqual([]);
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull',
      labels: { surfaceBelowRight: 'BW' },
    } as SymbolSpec)).toEqual([]);
  });

  it('lässt einen expliziten mittigen Linksanker an jeder Hülle zu, aber nur innerhalb', () => {
    const trailerAnchor = (kind: SymbolKind, anchor = 8.24) => ({
      kind,
      labels: { center: 'Tauchen', centerAnchorFromBodyLeftMm: anchor },
    }) as unknown as SymbolSpec;

    // Vermessen am Anhänger (I.2.5); seit dem 2. Oktober 2026 übertragen auf jede Körperhülle.
    expect(validateSpec(trailerAnchor('trailer'))).toEqual([]);
    expect(validateSpec(trailerAnchor('formation'))).toEqual([]);
    expect(validateSpec(trailerAnchor('trailer', 8.23))).toEqual([]);
    for (const spec of [
      trailerAnchor('trailer', 27.01),
      trailerAnchor('formation', -0.01),
      trailerAnchor('formation', Number.NaN),
      { kind: 'trailer', labels: { centerAnchorFromBodyLeftMm: 8.24 } } as SymbolSpec,
    ]) {
      expect(validateSpec(spec).map((issue) => issue.rule)).toContain(
        'center-anchor-override-requires-measured-trailer',
      );
    }
  });

  it('lässt am Landfahrzeug genau die zwei an C.2.25 vermessenen mittigen Anker zu (LFH-786)', () => {
    const main = {
      kind: 'vehicle-land', organization: 'feuerwehr',
      labels: {
        center: 'P', centerAnchorFromBodyLeftMm: 21.3, centerBaselineFromBodyBottomMm: 3,
        centerCapHeightMm: 2.919, inBodyInk: 'koerperlauf-kontrast',
      },
    } as SymbolSpec;
    const alternative = {
      kind: 'vehicle-land', organization: 'feuerwehr',
      labels: {
        center: 'P', centerAnchorFromBodyLeftMm: 15.5, centerBaselineFromBodyBottomMm: 2,
        inBodyInk: 'koerperlauf-kontrast',
      },
    } as SymbolSpec;
    expect(validateSpec(main)).toEqual([]);
    expect(validateSpec(alternative)).toEqual([]);

    const rules = (spec: SymbolSpec) => validateSpec(spec).map((issue) => issue.rule);
    // Zwischenwerte, der Anhängeranker am Landfahrzeug und die Varianten sind seit dem
    // 2. Oktober 2026 übertragen zulässig — innerhalb der Hülle.
    for (const spec of [
      { ...main, labels: { ...main.labels, centerAnchorFromBodyLeftMm: 21.41 } },
      { ...main, labels: { ...main.labels, centerAnchorFromBodyLeftMm: 8.24 } },
      { ...main, bodyVariant: 'plain-wheel-pair', labels: { center: 'P', centerAnchorFromBodyLeftMm: 21.3 } },
      { ...main, bodyVariant: 'foot-band', labels: { center: 'P', centerAnchorFromBodyLeftMm: 21.3 } },
      { kind: 'trailer', labels: { center: 'P', centerAnchorFromBodyLeftMm: 21.3 } },
    ] as SymbolSpec[]) {
      expect(rules(spec)).not.toContain('center-anchor-override-requires-measured-trailer');
    }
    expect(rules({ ...main, labels: { ...main.labels, centerAnchorFromBodyLeftMm: 30.01 } }))
      .toContain('center-anchor-override-requires-measured-trailer');
  });

  it('beschränkt Anhänger-Mittenbaselines auf die zwei vermessenen Werte', () => {
    for (const labels of [
      { center: 'Tauchen', centerBaselineFromBodyBottomMm: 14.5, centerCapHeightMm: 2.919 },
      {
        center: 'Strömungsrettung', centerBaselineFromBodyBottomMm: 14.327,
        centerCapHeightMm: 2.191447,
      },
    ]) {
      expect(validateSpec({ kind: 'trailer', labels } as SymbolSpec)).toEqual([]);
    }

    // Zwischenwerte sind seit dem 2. Oktober 2026 übertragen zulässig; die Hülle begrenzt sie.
    expect(validateSpec({
      kind: 'trailer',
      labels: { center: 'X', centerBaselineFromBodyBottomMm: 10, centerCapHeightMm: 2.191447 },
    } as SymbolSpec)).toEqual([]);
    expect(validateSpec({
      kind: 'trailer',
      labels: { center: 'X', centerBaselineFromBodyBottomMm: 19, centerCapHeightMm: 2.191447 },
    } as SymbolSpec).map((issue) => issue.rule)).toContain('center-label-within-body');
    expect(validateSpec({
      kind: 'vehicle-land',
      labels: { center: 'BuPol', centerBaselineFromBodyBottomMm: 6.5 },
    } as SymbolSpec)).toEqual([]);
  });

  it('lässt die oberhalb liegende F.2.7-Zone an jeder Körperform zu, nicht neben der Kopfzone', () => {
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { aboveLeft: 'ITH' },
    })).toEqual([]);
    expect(validateSpec({ kind: 'vehicle-air', labels: { aboveLeft: 'ITH' } })).toEqual([]);
    expect(validateSpec({ kind: 'formation', labels: { aboveLeft: 'ITH' } })).toEqual([]);
    for (const head of [
      { strength: 'zug' },
      { technicalHeadMark: 'double-vertical-bar' },
      { unitGrouping: 'ii' },
    ]) {
      expect(validateSpec({ kind: 'formation', ...head, labels: { aboveLeft: 'ITH' } } as SymbolSpec)
        .map((issue) => issue.rule)).toContain('above-left-label-head-conflict');
    }
  });

  it('lässt zweizeilige Läufe an den beiden separat vermessenen Landfahrzeugprofilen zu', () => {
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeftLines: ['GW-San', '50'] },
    }))
      .toEqual([]);
    expect(validateSpec({ kind: 'vehicle-land', labels: { topLeftLines: ['Kipper,', '26 t'] } }))
      .toEqual([]);
    expect(validateSpec({ kind: 'trailer', labels: { topLeftLines: ['GW-San', '50'] } }))
      .toEqual([]);
  });

  it('lässt den einzeiligen F.2-Fahrzeuglauf an normaler und foot-band-Hülle zu', () => {
    expect(validateSpec({
      kind: 'vehicle-land', labels: { topLeft: 'BTKombi' },
    })).toEqual([]);
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'foot-band', labels: { topLeft: 'GwBT' },
    })).toEqual([]);
    expect(validateSpec({ kind: 'trailer', labels: { topLeft: 'BT' } })).toEqual([]);
    expect(validateSpec({ kind: 'vehicle-air', labels: { topLeft: 'BT' } })).toEqual([]);
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

  it('lässt topLeft-Metriken an jeder Hülle zu, vermessen am normalen und gebänderten Landfahrzeug', () => {
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
      expect(validateSpec(spec)).toEqual([]);
    }
    expect(validateSpec(withRuntimeTopLeftMetrics('container', undefined, {
      ...topLeftMetrics, anchorFromBodyLeftMm: 23,
    })).map((issue) => issue.rule)).toContain('top-left-metrics-within-body');
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

  it('verlangt an beiden Kreisfassungen einen vollständigen topLeft-Metriksatz, falls einer steht', () => {
    // Ohne Satz übernimmt `compose()` seit dem 2. Oktober 2026 den F.3.3-Satz (`derive/circle.ts`).
    const withoutMetrics = {
      kind: 'circle-12', organization: 'hilfsorganisation', labels: { topLeft: 'UHS' },
    } as unknown as SymbolSpec;
    expect(validateSpec(withoutMetrics)).toEqual([]);
    expect(validateSpec(circleSpec(
      'raised-gable', '50', { capHeightMm: 2.749893 },
    )).map((issue) => issue.rule)).toContain('top-left-metrics-complete');
  });

  it('erlaubt das vermessene Kreisband und seit dem 2. Oktober 2026 den Giebel an der Funktionsstelle', () => {
    const measuredVariant = {
      kind: 'circle-12', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
    } as unknown as SymbolSpec;
    const gableOnPost = {
      kind: 'post', bodyVariant: 'raised-gable',
    } as unknown as SymbolSpec;
    expect(validateSpec(measuredVariant)).toEqual([]);
    expect(validateSpec(gableOnPost)).toEqual([]);
    // Eine Variante, die eine Form einer anderen Art benennt, bleibt gesperrt.
    expect(validateSpec({ kind: 'post', bodyVariant: 'inset-hull' } as unknown as SymbolSpec)
      .map((issue) => issue.rule)).toContain('body-variant-requires-measured-kind');
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
    expect(validateSpec({
      ...validInsetWatercraft,
      labels: { center: 'MzB', centerCapHeightMm: 3.4099 },
    })).toEqual([]);
  });

  it('akzeptiert genau die gemessenen I.3.4- und I.3.11-Organisations- und Markenverträge', () => {
    expect(validateSpec({
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation',
    })).toEqual([]);
    expect(validateSpec({
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'hilfsorganisation',
      bodyMarks: ['inset-hull-wheel-pair'],
    })).toEqual([]);
    expect(validateSpec({
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'feuerwehr',
      bodyMarks: ['fire-fighting'],
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
  ] as const)('lässt inset-hull mit %s zu (Füllung abgeleitet)', (_case, spec) => {
    // Eigentümerentscheid 02.10.2026: jede Organisation färbt den Rumpf wie an jedem anderen
    // geschlossenen Körper; die Zeichnung prüft derive/inset-hull-organization.test.ts.
    expect(validateSpec(spec)).toEqual([]);
  });

  it.each([
    ['Hilfsorganisation mit Feuerlöschmarke', {
      ...validInsetWatercraft, bodyMarks: ['fire-fighting'],
    }],
    ['Hilfsorganisation mit zwei Marken', {
      ...validInsetWatercraft, bodyMarks: ['inset-hull-wheel-pair', 'fire-fighting'],
    }],
    ['Feuerwehr ohne Marke', {
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'feuerwehr',
    }],
    ['Feuerwehr mit Radpaar', {
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'feuerwehr',
      bodyMarks: ['inset-hull-wheel-pair'],
    }],
  ] as const)('lässt inset-hull mit %s zu', (_case, spec: SymbolSpec) => {
    // Seit dem 2. Oktober 2026: `inset-hull-requires-measured-body-mark` ist entfallen. Beide
    // Marken sind an der eingesenkten Hülle vermessen (I.3.4, I.3.11), unabhängig von der
    // Organisation; jede andere überträgt `derive/body-marks.ts`.
    expect(validateSpec(spec)).toEqual([]);
    const drawing = drawSymbol(spec);
    const marks = drawing.children.filter((child) => child.role === 'pictogram');
    if ((spec.bodyMarks ?? []).length === 0) expect(marks).toEqual([]);
    else expect(marks.length).toBeGreaterThan(0);
    expect(drawing.derivations).toBeUndefined();
  });

  it('fordert die unbeschriftete Feuerwehrfassung und behält die generischen Mittellaufregeln', () => {
    // Seit dem 2. Oktober 2026 trägt auch die Feuerwehrfassung Läufe, wie die HiOrg-Fassung.
    expect(validateSpec({
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'feuerwehr',
      bodyMarks: ['fire-fighting'], labels: { center: 'LF' },
    })).toEqual([]);
    expect(validateSpec({
      ...validInsetWatercraft,
      labels: { centerCapHeightMm: 3.4099 },
    }).map((issue) => issue.rule)).toContain('center-cap-height-requires-center-label');
    expect(validateSpec({
      ...validInsetWatercraft,
      labels: { center: 'MzB', centerCapHeightMm: 0 },
    }).map((issue) => issue.rule)).toContain('center-cap-height-positive');
    // Seit dem 02.10.2026 trägt auch das Wasserfahrzeug eine (abgeleitete) Fahrwerkszone.
    expect(validateSpec({
      ...validInsetWatercraft,
      vehicleCategory: 'kfz-kategorie-1',
    }).map((issue) => issue.rule)).not.toContain('vehicle-category-requires-vehicle');
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
  ] as const)('lässt die abgeleitete inset-hull-Labelzone %s als Datenfeld zu', (_zone, spec) => {
    expect(validateSpec(spec).map((issue) => issue.rule)).not.toContain(
      'inset-hull-requires-center-label-only',
    );
  });

  it('lässt die inset-hull-Fußbezeichnung zu', () => {
    expect(validateSpec({ ...validInsetWatercraft, designation: 'MzB' })).toEqual([]);
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

  it('lässt die reduzierte Hauskontur mit jeder Organisation zu und lehnt Rumpfvarianten ab', () => {
    const reducedHouse = 'reduced-house' as SymbolSpec['kind'];
    expect(validateSpec({ kind: reducedHouse, organization: 'hilfsorganisation' })).toEqual([]);
    for (const organization of [undefined, 'thw'] as const) {
      expect(validateSpec({
        kind: reducedHouse,
        ...(organization === undefined ? {} : { organization }),
      })).toEqual([]);
    }
    // Der Giebel ist seit dem 02.10.2026 abgeleitet zulässig, ein Rumpf bleibt Systematik.
    expect(validateSpec({
      kind: reducedHouse, bodyVariant: 'raised-gable', organization: 'hilfsorganisation',
    })).toEqual([]);
    expect(validateSpec({
      kind: reducedHouse, bodyVariant: 'raised-hull', organization: 'hilfsorganisation',
    }).map((issue) => issue.rule)).toContain('body-variant-requires-measured-kind');
  });

  it('lässt den 12-mm-Kreis mit jeder und ohne Organisation zu (2. Oktober 2026)', () => {
    for (const spec of [
      { kind: 'circle-12', organization: 'feuerwehr' },
      { kind: 'circle-12' },
      { kind: 'circle-12', bodyVariant: 'raised-gable', organization: 'feuerwehr' },
    ] as unknown as SymbolSpec[]) {
      expect(validateSpec(spec), JSON.stringify(spec)).toEqual([]);
    }
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

  it('lehnt die F.2-Sonderzonen an fremden Art-/Variantenpaaren nur über die Variante ab', () => {
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'raised-hull',
      labels: { topLeftLines: ['GW-San', '50'] },
    }).map((issue) => issue.rule)).toEqual(['body-variant-requires-measured-kind']);
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'plain-wheel-pair', labels: { aboveLeft: 'ITH' },
    }).map((issue) => issue.rule)).toEqual(['body-variant-requires-measured-kind']);
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
    'lässt eine Fahrzeugkategorie an "%s" zu (Fahrwerkszone abgeleitet)',
    (kind) => {
      // Gemessen (18. August 2026): keine der drei Luftfahrzeugdateien 5.1.4.1 bis 5.1.4.3 und
      // keines der fünf Wasserfahrzeuge E.2.27 bis E.2.31 trägt eine Fahrwerkszone. Seit dem
      // Eigentümerentscheid vom 02.10.2026 ist das keine Sperre mehr; die Zeichnung prüft
      // derive/vehicle-category.test.ts.
      expect(validateSpec({ kind, vehicleCategory: 'kfz-kategorie-1' })).toEqual([]);
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

  it('akzeptiert eine Verwaltungsstufe mit und ohne Funktionsfassung', () => {
    const supportedSpec = {
      kind: 'person',
      organization: 'fuehrung-leitung',
      administrativeLevel: 'kreis',
      functionRole: 'technical-incident-commander',
    };
    const supportedRole = runtimeRoleDefinition({
      id: 'technical-incident-commander',
      title: 'Technischer Einsatzleiter',
      expectedHead: 'administrative',
      expectedOrganization: 'fuehrung-leitung',
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
    // Ohne Kopf im Port meldet erst `compose()` den Wert als nicht vermessen; eine Regel gibt es
    // dafür seit dem 2. Oktober 2026 nicht mehr.
    expect(validateRuntime(
      { kind: 'person', administrativeLevel: 'gemeinde' },
      { administrativeHead: undefined },
    )).toEqual([]);
  });

  it.each(['kreis', 'nationalstaat', 'europaeische-union'] as const)(
    'nimmt die Verwaltungsstufe %s auch ohne Funktionsrolle an',
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

      expect(issues).toEqual([]);
    },
  );

  it.each([
    // Der TEL nennt keine Ebene im Titel: der Stufenwechsel wird abgeleitet gezeichnet.
    ['technical-incident-commander', 'Technischer Einsatzleiter', false],
    // „Kreisleitstelle“ nennt den Kreis: eine andere Stufe widerspräche dem Namen.
    ['district-control-center-director', 'Leiter Kreisleitstelle', true],
  ] as const)('bindet die Verwaltungsrolle %s nur über ihren Titel an die Stufe', (
    id,
    title,
    bound,
  ) => {
    const functionRole = runtimeRoleDefinition({
      id,
      title,
      expectedHead: 'administrative',
      expectedOrganization: 'fuehrung-leitung',
      expectedAdministrativeLevel: 'kreis',
      allowedBodyMarks: [],
      layout: {
        headTopMm: 0,
        body: { type: 'rect', role: 'body', x: 3, y: 3, width: 26, height: 26 },
        bodyAdditions: [], decorations: [], roleRuns: [],
      },
    });
    const administrativeHead = {
      box: { xMm: 4.143, yMm: 0, widthMm: 23.714, heightMm: 4 },
      heightMm: 4,
      primitives: [],
    };

    const issues = validateRuntime(
      {
        kind: 'person',
        organization: 'fuehrung-leitung',
        administrativeLevel: 'nationalstaat',
        functionRole: id,
      },
      { functionRole, administrativeHead },
    );

    if (bound) {
      expect(issues.map((issue) => issue.rule)).toContain('function-role-head-mismatch');
    } else {
      expect(issues).toEqual([]);
    }
  });

  it('bindet eine Stärkerolle an den konkret vermessenen Stärkegrad', () => {
    const functionRole = runtimeRoleDefinition({ expectedStrength: 'zug' });

    const issues = validateRuntime(
      {
        kind: 'person',
        organization: 'feuerwehr',
        strength: 'gruppe',
        functionRole: 'fire-service-platoon-commander',
      },
      { functionRole },
    );

    expect(issues.map((issue) => issue.rule)).toContain('function-role-head-mismatch');
  });

  it.each([
    ['Stärkerolle ohne Stärkegrad',
      {
        kind: 'person', organization: 'feuerwehr', strength: 'zug',
        functionRole: 'fire-service-platoon-commander',
      },
      runtimeRoleDefinition({ expectedStrength: undefined }),
      {}],
    ['kopflose Rolle mit zusätzlichem Stärkegrad',
      {
        kind: 'person', organization: 'feuerwehr',
        functionRole: 'fire-service-platoon-commander',
      },
      runtimeRoleDefinition({
        expectedHead: 'none',
        expectedStrength: 'zug',
        layout: {
          body: { type: 'rect', role: 'body', x: 3, y: 3, width: 26, height: 26 },
          bodyAdditions: [], decorations: [], roleRuns: [],
        },
      }),
      {}],
    ['Verwaltungsrolle ohne konkrete Stufe',
      {
        kind: 'person',
        organization: 'fuehrung-leitung',
        administrativeLevel: 'kreis',
        functionRole: 'technical-incident-commander',
      },
      runtimeRoleDefinition({
        id: 'technical-incident-commander',
        expectedHead: 'administrative',
        expectedOrganization: 'fuehrung-leitung',
        expectedAdministrativeLevel: undefined,
        layout: {
          headTopMm: 0,
          body: { type: 'rect', role: 'body', x: 3, y: 3, width: 26, height: 26 },
          bodyAdditions: [], decorations: [], roleRuns: [],
        },
      }),
      {
        administrativeHead: {
          box: { xMm: 9.143, yMm: 0, widthMm: 13.714, heightMm: 4 },
          heightMm: 4,
          primitives: [],
        },
      }],
  ])('lehnt die runtime-malformed Kopfbindung %s fail-closed ab', (
    _case,
    spec,
    functionRole,
    context,
  ) => {
    const issues = validateRuntime(spec, { ...context, functionRole });

    expect(issues.map((issue) => issue.rule)).toContain('function-role-head-mismatch');
  });

  it.each([
    ['fehlende Organisation', undefined],
    ['falsche Organisation', 'hilfsorganisation'],
  ] as const)('bindet eine Rolle an ihre gemessene Organisation: %s', (_case, organization) => {
    const functionRole = runtimeRoleDefinition({
      id: 'technical-platoon-commander',
      expectedOrganization: 'thw',
    });
    const issues = validateRuntime(
      {
        kind: 'person',
        organization,
        strength: 'zug',
        functionRole: 'technical-platoon-commander',
      },
      { functionRole },
    );

    expect(issues.map((issue) => issue.rule)).toContain('function-role-organization-mismatch');
  });

  it.each([
    ['fehlender Organisationsbindung', undefined],
    ['unbekannter Organisationsbindung', 'unbekannte-organisation'],
  ])('lehnt eine runtime-malformed Rolle mit %s fail-closed ab', (_case, expectedOrganization) => {
    const functionRole = runtimeRoleDefinition({
      id: 'technical-platoon-commander',
      expectedOrganization,
    });
    const issues = validateRuntime(
      {
        kind: 'person',
        organization: 'thw',
        strength: 'zug',
        functionRole: 'technical-platoon-commander',
      },
      { functionRole },
    );

    expect(issues.map((issue) => issue.rule)).toContain('function-role-organization-mismatch');
  });

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

  it('lässt Variante, Piktogramm und weitere Körpermarke an einer Rolle zu (abgeleitet)', () => {
    // Seit dem 2. Oktober 2026 zeichnet der Rollenzweig sie abgeleitet (derive/function-roles.ts);
    // eine Variante, die die Art selbst nicht trägt, bleibt bei `body-variant-requires-measured-kind`.
    const context = { functionRole: runtimeRoleDefinition() };
    const base = {
      kind: 'person',
      organization: 'feuerwehr',
      functionRole: 'fire-service-platoon-commander',
      strength: 'zug',
    };
    expect(validateRuntime({ ...base, bodyVariant: 'raised-hull' }, context)
      .map((issue) => issue.rule)).toEqual(['body-variant-requires-measured-kind']);
    expect(validateRuntime({ ...base, bodyVariant: 'compact-person-diamond-26mm' }, context))
      .toEqual([]);
    expect(validateRuntime({ ...base, capabilities: ['fire-fighting'] }, context)).toEqual([]);
    expect(validateRuntime({ ...base, bodyMarks: ['care'] }, context)).toEqual([]);
  });

  it('verlangt vollständige sichtbare Rollenmetriken und getrennte Textboxen', () => {
    const spec = {
      kind: 'person',
      organization: 'feuerwehr',
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
      organization: 'feuerwehr',
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
      organization: 'feuerwehr',
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
        kind: 'person', organization: 'feuerwehr',
        functionRole: 'fire-service-platoon-commander', strength: 'zug',
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
        kind: 'person', organization: 'feuerwehr',
        functionRole: 'fire-service-platoon-commander', strength: 'zug',
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

  it('nimmt die technische Kopfmarke an jedem Grundzeichen an', () => {
    expect(validateSpec({
      kind: 'formation', technicalHeadMark: 'single-vertical-bar',
    })).toEqual([]);

    expect(validateRuntime({
      kind: 'formation', technicalHeadMark: 'triple-vertical-bar',
    }).map((issue) => issue.rule)).toContain('technical-head-mark-not-measured');

    // Seit dem Fachreview vom 19.09.2026 ist die Formation mit Fußband belegt (F.1.3).
    expect(validateSpec({
      kind: 'formation', bodyVariant: 'foot-band', technicalHeadMark: 'double-vertical-bar',
    })).toEqual([]);

    // Seit dem 2. Oktober 2026 nicht mehr an die Formation gebunden: die Balken tragen keinen
    // Fachbegriff, und die Kopfzone steht an jedem Grundzeichen (`derive/head-zone.ts`).
    for (const spec of [
      { kind: 'person', technicalHeadMark: 'single-vertical-bar' },
      { kind: 'vehicle-land', technicalHeadMark: 'double-vertical-bar' },
    ] satisfies SymbolSpec[]) {
      expect(validateSpec(spec), spec.kind).toEqual([]);
    }
  });

  it('behandelt jede Doppelbelegung der technischen Kopfzone als Konflikt', () => {
    const conflictingSpecs = [
      {
        kind: 'formation', strength: 'gruppe',
        technicalHeadMark: 'single-vertical-bar',
      },
      {
        kind: 'formation', administrativeLevel: 'kreis',
        technicalHeadMark: 'single-vertical-bar',
      },
      {
        kind: 'formation', functionRole: 'fire-service-platoon-commander',
        technicalHeadMark: 'single-vertical-bar',
      },
    ] satisfies SymbolSpec[];

    for (const spec of conflictingSpecs) {
      expect(validateSpec(spec).map((issue) => issue.rule)).toContain('head-zone-conflict');
    }
  });

  it('nimmt den Verband an der Formation an und zählt ihn als Belegung der Kopfzone (LFH-577)', () => {
    expect(validateSpec({ kind: 'formation', unitGrouping: 'verband-i' })).toEqual([]);
    expect(validateSpec({ kind: 'formation', bodyVariant: 'foot-band', unitGrouping: 'verband-ii' }))
      .toEqual([]);

    const conflictingSpecs = [
      { kind: 'formation', unitGrouping: 'verband-i', strength: 'gruppe' },
      { kind: 'formation', unitGrouping: 'verband-i', administrativeLevel: 'kreis' },
      { kind: 'formation', unitGrouping: 'verband-ii', technicalHeadMark: 'double-vertical-bar' },
      { kind: 'formation', unitGrouping: 'verband-i', functionRole: 'fire-service-platoon-commander' },
    ] satisfies SymbolSpec[];
    for (const spec of conflictingSpecs) {
      expect(validateSpec(spec).map((issue) => issue.rule), JSON.stringify(spec))
        .toContain('head-zone-conflict');
    }
  });

  describe('Zustände aus Kapitel 5.8 (LFH-577)', () => {
    const rules = (spec: SymbolSpec) => validateSpec(spec).map((issue) => issue.rule);

    it('nimmt die belegten Zusammenstellungen an', () => {
      expect(validateSpec({ kind: 'person', states: ['person-injured'] })).toEqual([]);
      expect(validateSpec({ kind: 'person', states: ['person-injured', 'suspected-situation'] }))
        .toEqual([]);
      expect(validateSpec({ kind: 'hazard', states: ['acute-situation'] })).toEqual([]);
      expect(validateSpec({ kind: 'person', states: [] })).toEqual([]);
    });

    it('lehnt Wetter, Tierzustand und Tendenz in states ab: sie gehören woandershin', () => {
      for (const value of ['weather-sunny', 'sick-animal', 'tendency-rising'] as const) {
        expect(rules({ kind: 'person', states: [value] }), value).toEqual(['state-value-not-attachable']);
      }
    });

    it('bindet nur den Personenzustand an die Person (stateCarriersOf)', () => {
      expect(rules({ kind: 'formation', states: ['person-injured'] })).toEqual(['state-carrier-not-allowed']);
      expect(rules({ kind: 'hazard', states: ['person-dead'] })).toEqual(['state-carrier-not-allowed']);
    });

    it('lässt Hinweise und Gefahrenhinweise an jedem Grundzeichen zu (seit 02.10.2026)', () => {
      expect(validateSpec({ kind: 'formation', states: ['suspected-situation'] })).toEqual([]);
      expect(validateSpec({ kind: 'vehicle-land', states: ['acute-situation'] })).toEqual([]);
      expect(validateSpec({ kind: 'building', states: ['explosion-hazard'] })).toEqual([]);
    });

    it('lässt die übrigen Werte an jedem Grundzeichen zu: die Lage leitet compose() ab', () => {
      expect(validateSpec({ kind: 'formation', states: ['damaged'] })).toEqual([]);
      expect(validateSpec({ kind: 'building', states: ['route-closed'] })).toEqual([]);
    });

    it('lässt „?" und „!" zugleich zu: der Hinweisteil ist keine Skala', () => {
      expect(validateSpec({ kind: 'person', states: ['suspected-situation', 'acute-situation'] })).toEqual([]);
    });

    it('lässt höchstens einen Personenzustand und einen Wert je Skala zu', () => {
      for (const states of [
        ['person-injured', 'person-dead'],
        ['damaged', 'destroyed'],
        ['incipient-fire', 'developed-fire'],
        [
          'activity-slightly-increased-outage-up-to-25-percent',
          'activity-strongly-increased-total-outage',
        ],
      ] as const) {
        const kind = states[0].startsWith('person') ? 'person' : 'formation';
        expect(rules({ kind, states }), states.join(' + ')).toEqual(['state-group-limit-exceeded']);
      }
    });

    it('meldet jede überfüllte Gruppe einzeln', () => {
      expect(rules({
        kind: 'formation',
        states: ['damaged', 'destroyed', 'incipient-fire', 'developed-fire', 'suspected-situation', 'acute-situation'],
      })).toEqual(['state-group-limit-exceeded', 'state-group-limit-exceeded']);
    });

    it('lässt keine Einsatztaktik an einem Träger zu', () => {
      for (const value of ['tactical-rescue', 'tactical-attack', 'tactical-defense', 'tactical-retreat'] as const) {
        expect(rules({ kind: 'person', states: [value] }), value).toEqual(['state-tactics-not-allowed']);
        // Kein zweiter Befund zum Träger: die Taktik steht an gar keinem Träger.
        expect(rules({ kind: 'formation', states: [value] }), value).toEqual(['state-tactics-not-allowed']);
      }
    });

    it('wirft nicht bei einer Zustandsliste außerhalb des Typs (Laufzeitfall)', () => {
      expect(() => validateRuntime({ kind: 'person', states: 'person-injured' })).not.toThrow();
      expect(() => validateRuntime({ kind: 'person', states: ['person-happy'] })).not.toThrow();
    });

    it('prüft die Tendenz nicht als Regel: ohne belegten Träger meldet compose() die Lücke', () => {
      expect(validateSpec({ kind: 'person', tendency: 'tendency-rising' })).toEqual([]);
    });
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

  it('bindet vollständige bottomRight-Metriken an den Lauf und an die Körperhülle', () => {
    expect(validateSpec(withBottomRightMetrics(bottomRightMetrics))).toEqual([]);
    expect(validateSpec(withBottomRightMetrics(bottomRightMetrics, null)).map(
      (issue) => issue.rule,
    )).toContain('bottom-right-metrics-require-bottom-right-label');
    // Ohne vermessene Textbox gilt seit dem 2. Oktober 2026 die Körperhülle.
    expect(validateSpec({
      kind: 'formation', labels: { bottomRight: '7', bottomRightMetrics },
    })).toEqual([]);
    expect(validateSpec(withBottomRightMetrics(
      bottomRightMetrics, '7', 'vehicle-air', 'fixed-wing-hull',
    ))).toEqual([]);
    expect(validateSpec({
      kind: 'container',
      labels: {
        bottomRight: '7',
        bottomRightMetrics: { ...bottomRightMetrics, boxLeftFromBodyLeftMm: 20, boxWidthMm: 5 },
      },
    }).map((issue) => issue.rule)).toContain('bottom-right-metrics-within-body');
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

describe('Boxfähigkeiten seit dem 2. Oktober 2026 (LFH-787 „AB“ umgekehrt)', () => {
  // `capabilities-pictogram-has-measured-rendition` und `capabilities-pictogram-overflows-body`
  // sind entfallen; was sie ablehnten, zeichnet `compose()` (Zeichentests in
  // `derive/capabilities.test.ts`).
  it('lehnt keine Boxfähigkeit an keiner Körperform mehr ab', () => {
    for (const spec of [
      { kind: 'formation', organization: 'feuerwehr', strength: 'staffel', capabilities: ['fire-fighting'] },
      { kind: 'formation', capabilities: ['blasting', 'service-water'] },
      { kind: 'formation', capabilities: ['medical-service', 'fire-fighting', 'blasting', 'service-water'] },
      { kind: 'vehicle-land', capabilities: ['foam-agent'] },
      { kind: 'vehicle-land', capabilities: ['fire-fighting'] },
      { kind: 'formation', bodyVariant: 'foot-band', capabilities: ['maintenance'] },
      { kind: 'formation', bodyVariant: 'foot-band', capabilities: ['fire-fighting'] },
    ] as SymbolSpec[]) {
      expect(validateSpec(spec), JSON.stringify(spec)).toEqual([]);
    }
  });
});

describe('body-mark-rendition-not-measured (LFH-786)', () => {
  const rendition = (spec: SymbolSpec) => validateSpec(spec)
    .filter((issue) => issue.rule === 'body-mark-rendition-not-measured');
  // Das erste Paar mit Fassung aus dem Register; die Familientabellen dürfen wachsen.
  const measured = ANHANG_C_BODY_MARK_CONTEXTS.find((entry) => entry.rendition !== undefined);
  const mark = Object.keys(measured?.marks ?? {})[0] as BodyMarkId | undefined;

  it('lässt eine Kennung an ihrem Anhang-C-Paar und an jedem anderen Paar derselben Marke zu', () => {
    expect(measured).toBeDefined();
    expect(mark).toBeDefined();
    if (measured?.rendition === undefined || mark === undefined) return;
    const spec = {
      kind: measured.kind,
      ...(measured.bodyVariant === undefined ? {} : { bodyVariant: measured.bodyVariant }),
      ...(measured.vehicleCategory === undefined ? {} : { vehicleCategory: measured.vehicleCategory }),
      bodyMarks: [mark],
      bodyMarkRenditions: { [mark]: measured.rendition },
    } as SymbolSpec;
    expect(rendition(spec)).toEqual([]);
    expect(measuredBodyMarkRenditions(mark, spec)).toContain(measured.rendition);

    // Dieselbe Kennung an einer anderen Körperform ist seit dem 2. Oktober 2026 zulässig:
    // `bodyMark()` überträgt die Fassung.
    const elsewhere = { ...spec, kind: 'formation', bodyVariant: undefined, vehicleCategory: undefined } as SymbolSpec;
    expect(rendition(elsewhere)).toEqual([]);
    expect(drawSymbol(elsewhere).derivations?.map((note) => note.from))
      .toContain(`${measured.kind}/${measured.bodyVariant ?? 'normal'}` +
        (measured.vehicleCategory === undefined ? '' : `/${measured.vehicleCategory}`) +
        `#${measured.rendition}`);
  });

  it('lehnt eine Kennung an einer Marke ab, die die Spec nicht zeichnet', () => {
    const issues = rendition({
      kind: 'formation', bodyMarks: ['fire-fighting'],
      bodyMarkRenditions: { 'rescue-aerial-ladder': 'shifted-right-6.5mm' },
    } as unknown as SymbolSpec);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.message).toContain('`bodyMarks`');
  });

  it('lehnt unbekannte Kennungen und eine Nicht-Objekt-Angabe ab', () => {
    expect(rendition({
      kind: 'formation', bodyMarks: ['fire-fighting'],
      bodyMarkRenditions: { 'fire-fighting': 'erfunden' },
    } as unknown as SymbolSpec)).toHaveLength(1);
    expect(rendition({
      kind: 'formation', bodyMarks: ['fire-fighting'], bodyMarkRenditions: ['shifted-left-4mm'],
    } as unknown as SymbolSpec)).toHaveLength(1);
  });

  it('liest nur eigene Schlüssel: geerbte Einträge wirken nicht', () => {
    const inherited = Object.create({ 'fire-fighting': 'erfunden' }) as Record<string, string>;
    expect(rendition({
      kind: 'formation', organization: 'feuerwehr', strength: 'staffel', bodyMarks: ['fire-fighting'],
      bodyMarkRenditions: inherited,
    } as unknown as SymbolSpec)).toEqual([]);
  });

  it('meldet vorab genau den Fall, in dem bodyMark() wirft', () => {
    // Die Evidenz aus rule-evidence.ts: eine Fassung, die Anhang C nur für die Drehleiter führt,
    // nicht für die Brandbekämpfung. `bodyMark()` würde hier `NotMeasuredError` werfen; die Regel
    // sagt es vorher.
    expect(rendition({
      kind: 'formation', organization: 'feuerwehr', strength: 'staffel',
      bodyMarks: ['fire-fighting'], bodyMarkRenditions: { 'fire-fighting': 'shifted-right-6.5mm' },
    } as SymbolSpec).map((issue) => issue.message)).toEqual([
      'Die Fassung "shifted-right-6.5mm" ist für "fire-fighting" nirgends vermessen; die Marke ' +
        'hat nur ihre Grundfassung.',
    ]);
  });
});
