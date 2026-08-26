import { describe, expect, it } from 'vitest';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { validateSpec } from './validate.js';

describe('validateSpec', () => {
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
    expect(validateSpec({ kind: 'circle-12', bodyVariant: 'raised-circle-1mm' } as SymbolSpec))
      .toEqual([]);

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

  it('lehnt unbelegte Kreisvarianten ab', () => {
    const wrongVariant = {
      kind: 'circle-12', bodyVariant: 'foot-band', organization: 'hilfsorganisation',
    } as unknown as SymbolSpec;
    const gableOnPost = {
      kind: 'post', bodyVariant: 'raised-gable',
    } as unknown as SymbolSpec;
    expect(validateSpec(wrongVariant).map((issue) => issue.rule)).toContain(
      'body-variant-requires-measured-kind',
    );
    expect(validateSpec(gableOnPost).map((issue) => issue.rule)).toContain(
      'body-variant-requires-measured-kind',
    );
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

  it('lehnt eine Verwaltungsstufe ab, solange sie nichts zeichnet', () => {
    // Vorbestehender stiller Ausfall, nicht von LFH-424 erzeugt: bis hierher lieferte
    // `validateSpec` [] und `compose()` byteidentisches SVG mit und ohne das Feld.
    const issues = validateSpec({ kind: 'formation', administrativeLevel: 'kreis' });
    expect(issues.map((i) => i.rule)).toEqual(['administrative-level-not-implemented']);
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

  it('nennt in jeder Meldung Regel und Begründung', () => {
    for (const issue of validateSpec({ kind: 'hazard', strength: 'gruppe' })) {
      expect(issue.rule).not.toBe('');
      expect(issue.message.length).toBeGreaterThan(10);
    }
  });
});
