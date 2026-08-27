import { Resvg } from '@resvg/resvg-js';
import { describe, expect, it } from 'vitest';
import { boundsOfMm, renderSvg, type BoundsMm } from '@einsatzzeichen/core';
import {
  DEFAULT_VIEWBOX_MM,
  DEFAULT_STROKE_WIDTH_MM,
  type BodyMarkId,
  type BodyVariantId,
  type Primitive,
  type SymbolKind,
} from '@einsatzzeichen/schema';
import { BODY_MARK_IDS, bodyMark as bodyMarkWithContext } from './body-marks.js';

/**
 * Die einzige vermessene Körperhülle dieser Zeichnungen: das Rechteck 30 × 20 mm der taktischen
 * Formation (1/6 bis 31/26 mm, Mitte 16|16), wie `base-symbols.ts` es führt und wie die zwölf
 * Dateien aus F.1.1 bis F.1.11 es zeigen.
 */
const formationBodyMm: BoundsMm = { minX: 1, minY: 6, maxX: 31, maxY: 26 };
const landBodyMm: BoundsMm = { minX: 1, minY: 5.75, maxX: 31, maxY: 26 };
const airBodyMm: BoundsMm = { minX: 1, minY: 8, maxX: 31, maxY: 23 };
const raisedAirBodyMm: BoundsMm = { minX: 1.01, minY: 6, maxX: 30.99, maxY: 20.99 };
const trailerBodyMm: BoundsMm = { minX: 4, minY: 5.75, maxX: 31, maxY: 26 };
const circleBodyMm: BoundsMm = { minX: 4, minY: 4, maxX: 28, maxY: 28 };
const raisedCircleBodyMm: BoundsMm = { minX: 4, minY: 6, maxX: 28, maxY: 30 };
const reducedHouseBodyMm: BoundsMm = { minX: 2, minY: 4, maxX: 30, maxY: 26 };
const invertedLandBodyMm: BoundsMm = { minX: 1, minY: 6, maxX: 31, maxY: 25.75 };
const raisedCircleOneMmBodyMm: BoundsMm = { minX: 4, minY: 3, maxX: 28, maxY: 27 };
const compactPersonDiamondBodyMm: BoundsMm = { minX: 3, minY: 3, maxX: 29, maxY: 29 };
const loweredCompactPersonDiamondBodyMm: BoundsMm = { minX: 3, minY: 5, maxX: 29, maxY: 31 };
const bodyMark = (id: Parameters<typeof bodyMarkWithContext>[0], bounds: BoundsMm) =>
  bodyMarkWithContext(id, { kind: 'formation' }, bounds);

/** Der Strichstil, den `body-marks.ts` an jede Linie schreibt — Kontur, keine Füllung. */
const strokeStyle = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM } as const;

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: strokeStyle };
}

const outlineStyle = {
  fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM,
} as const;

describe('bodyMark() — die technischen Innenzeichnungen des Anhangs N', () => {
  it('zeichnet die beiden getrennt vermessenen Landfahrzeugmarken', () => {
    expect(bodyMarkWithContext(
      'land-horizontal-blade-bent-upright' as BodyMarkId,
      { kind: 'vehicle-land', bodyVariant: 'inverted-hull-track' as BodyVariantId },
      invertedLandBodyMm,
    )).toEqual([
      line(6, 14.75, 20.75, 14.75),
      {
        type: 'polyline', role: 'pictogram',
        points: [[20.75, 9.5], [20.75, 18.5], [26, 19.5]],
        style: outlineStyle,
      },
    ]);

    const diagonal = 5 / Math.SQRT2;
    expect(bodyMarkWithContext(
      'ring-5mm-offset-down-3-5mm-eight-spokes' as BodyMarkId,
      { kind: 'vehicle-land' }, landBodyMm,
    )).toEqual([
      { type: 'circle', role: 'pictogram', cx: 16, cy: 19.5, r: 5, style: outlineStyle },
      line(11, 19.5, 21, 19.5),
      line(16, 14.5, 16, 24.5),
      line(16 - diagonal, 19.5 - diagonal, 16 + diagonal, 19.5 + diagonal),
      line(16 + diagonal, 19.5 - diagonal, 16 - diagonal, 19.5 + diagonal),
    ]);
  });

  it('zeichnet die drei getrennt vermessenen Luftfahrzeugmarken', () => {
    expect(bodyMarkWithContext(
      'air-quartering-up-arrow-box' as BodyMarkId,
      { kind: 'vehicle-air', bodyVariant: 'raised-hull' }, raisedAirBodyMm,
    )).toEqual([
      line(16, 6, 16, 20.99),
      line(2.74, 14, 29.26, 14),
      line(23, 14, 23, 9.5),
      { type: 'polyline', role: 'pictogram', points: [[21.5, 11], [23, 9.5], [24.5, 11]], style: outlineStyle },
      { type: 'rect', role: 'pictogram', x: 20.25, y: 15, width: 5.5, height: 5.5, style: outlineStyle },
    ]);
    expect(bodyMarkWithContext(
      'air-horizontal-left-chevron' as BodyMarkId,
      { kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull' as BodyVariantId }, raisedAirBodyMm,
    )).toEqual([
      line(7, 15, 25, 15),
      { type: 'polyline', role: 'pictogram', points: [[24, 11], [20, 15], [24, 19]], style: outlineStyle },
    ]);
    expect(bodyMarkWithContext(
      'air-rising-diagonal' as BodyMarkId,
      { kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull' as BodyVariantId }, raisedAirBodyMm,
    )).toEqual([line(2.07, 20.74, 24.96, 9.3)]);
  });

  it('zeichnet Sammelraum und Kontaktstelle ausschließlich auf dem normalen 12-mm-Kreis', () => {
    const clover = {
      type: 'path', role: 'pictogram',
      d: 'M 13 10 C 13 8.3431, 14.3431 7, 16 7 C 17.6569 7, 19 8.3431, 19 10 C 20.6569 10, 22 11.3431, 22 13 C 22 14.6569, 20.6569 16, 19 16 C 19 17.6569, 17.6569 19, 16 19 C 14.3431 19, 13 17.6569, 13 16 C 11.3431 16, 10 14.6569, 10 13 C 10 11.3431, 11.3431 10, 13 10 Z',
      style: outlineStyle,
    } as const;
    expect(bodyMarkWithContext(
      'spontaneous-helper-collection-arrow' as BodyMarkId,
      { kind: 'circle-12' }, circleBodyMm,
    )).toEqual([
      clover,
      { type: 'circle', role: 'pictogram', cx: 10.5, cy: 22, r: 1.5, style: outlineStyle },
      line(12, 22, 23, 22),
      { type: 'polyline', role: 'pictogram', points: [[21, 20], [23, 22], [21, 24]], style: outlineStyle },
    ]);
    expect(bodyMarkWithContext(
      'spontaneous-helper-contact-double-arrow' as BodyMarkId,
      { kind: 'circle-12' }, circleBodyMm,
    )).toEqual([
      clover,
      line(9, 22, 23, 22),
      { type: 'polyline', role: 'pictogram', points: [[11, 20], [9, 22], [11, 24]], style: outlineStyle },
      { type: 'polyline', role: 'pictogram', points: [[21, 20], [23, 22], [21, 24]], style: outlineStyle },
    ]);

    for (const id of [
      'spontaneous-helper-collection-arrow',
      'spontaneous-helper-contact-double-arrow',
    ] as BodyMarkId[]) {
      expect(() => bodyMarkWithContext(
        id,
        { kind: 'spontaneous-helper' },
        { minX: 2, minY: 2, maxX: 30, maxY: 30 },
      ), id).toThrow(/nicht vermessen/);
    }
  });

  it('verschiebt die bestehende Informationsmarke mit dem um 1 mm angehobenen Kreis', () => {
    expect(bodyMarkWithContext(
      'circle-information-stem',
      { kind: 'circle-12', bodyVariant: 'raised-circle-1mm' as BodyVariantId },
      raisedCircleOneMmBodyMm,
    )).toEqual([
      { type: 'circle', role: 'pictogram', cx: 16, cy: 9.5, r: 1.5, style: { fill: 'schwarz', stroke: 'none' } },
      { type: 'rect', role: 'pictogram', x: 15, y: 13, width: 2, height: 8, style: { fill: 'schwarz', stroke: 'none' } },
    ]);
  });

  it('bindet den angehobenen Kreis ausschließlich an die dort vermessene Informationsmarke', () => {
    for (const id of ['medical-service', 'care', 'circle-collection-arrow'] as BodyMarkId[]) {
      expect(() => bodyMarkWithContext(
        id,
        { kind: 'circle-12', bodyVariant: 'raised-circle-1mm' as BodyVariantId },
        raisedCircleOneMmBodyMm,
      ), id).toThrow(/nicht vermessen/);
    }
  });

  it('lehnt jede technische N-Marke außerhalb ihres vermessenen Kontexts ab', () => {
    expect(() => bodyMarkWithContext(
      'air-rising-diagonal' as BodyMarkId,
      { kind: 'vehicle-air', bodyVariant: 'raised-hull' }, raisedAirBodyMm,
    )).toThrow(/nicht vermessen/);
    expect(() => bodyMarkWithContext(
      'spontaneous-helper-contact-double-arrow' as BodyMarkId,
      { kind: 'formation' }, formationBodyMm,
    )).toThrow(/nicht vermessen/);
  });
});

describe('bodyMark() — die technische Innenzeichnung des Anhangs I.5', () => {
  const waterRescueMark = 'double-wave-inner-diamond-8mm' as BodyMarkId;
  const compactPersonDiamond = 'compact-person-diamond-26mm' as BodyVariantId;
  const loweredCompactPersonDiamond =
    'compact-person-diamond-26mm-lowered-2mm' as BodyVariantId;
  const filledWaveStyle = { fill: 'schwarz', stroke: 'none' } as const;

  it('registriert die doppelte Welle mit innerer 8-mm-Raute und bindet sie nur an die I.5-Rauten', () => {
    expect(BODY_MARK_IDS).toContain(waterRescueMark);
    expect(bodyMarkWithContext(
      waterRescueMark,
      { kind: 'person', bodyVariant: compactPersonDiamond },
      compactPersonDiamondBodyMm,
    )).toEqual([
      {
        type: 'path', role: 'pictogram',
        d: expect.stringMatching(/^M 19\.999955903 10\.750157096 /),
        style: filledWaveStyle,
      },
      {
        type: 'path', role: 'pictogram',
        d: expect.stringMatching(/^M 19\.999955903 12\.749694077 /),
        style: filledWaveStyle,
      },
      {
        type: 'polyline', role: 'pictogram', closed: true,
        points: [[16, 14.5], [20, 18.5], [16, 22.5], [12, 18.5]],
        style: outlineStyle,
      },
    ]);
    expect(bodyMarkWithContext(
      waterRescueMark,
      { kind: 'person', bodyVariant: loweredCompactPersonDiamond },
      loweredCompactPersonDiamondBodyMm,
    )).toEqual([
      {
        type: 'path', role: 'pictogram',
        d: expect.stringMatching(/^M 19\.999955903 12\.750157096 /),
        style: filledWaveStyle,
      },
      {
        type: 'path', role: 'pictogram',
        d: expect.stringMatching(/^M 19\.999955903 14\.749694077 /),
        style: filledWaveStyle,
      },
      {
        type: 'polyline', role: 'pictogram', closed: true,
        points: [[16, 16.5], [20, 20.5], [16, 24.5], [12, 20.5]],
        style: outlineStyle,
      },
    ]);
    expect(() => bodyMarkWithContext(
      waterRescueMark,
      { kind: 'person' },
      compactPersonDiamondBodyMm,
    )).toThrow(/nicht vermessen/);
    expect(() => bodyMarkWithContext(
      waterRescueMark,
      { kind: 'formation' },
      formationBodyMm,
    )).toThrow(/keine randbündige Fassung/);
  });

  it('emittiert die I.5-Wellen ausschließlich mit dem absoluten Pfad-Subset des Render-Gates', () => {
    for (const [bodyVariant, bounds] of [
      [compactPersonDiamond, compactPersonDiamondBodyMm],
      [loweredCompactPersonDiamond, loweredCompactPersonDiamondBodyMm],
    ] as const) {
      const waves = bodyMarkWithContext(
        waterRescueMark,
        { kind: 'person', bodyVariant },
        bounds,
      ).filter((primitive) => primitive.type === 'path');
      expect(waves).toHaveLength(2);
      for (const wave of waves) {
        expect(wave.d).toMatch(/^[MLHVCQZ0-9.,\s-]+$/);
        expect(wave.d).toContain('C');
        expect(wave.d).toContain('L');
      }
    }
  });
});

function cateringPath(cx: number, cy: number): Primitive {
  return {
    type: 'path',
    role: 'pictogram',
    d:
      `M ${cx} ${cy - 5} C ${cx - 2.75} ${cy - 5} ${cx - 5} ${cy - 2.75} ` +
      `${cx - 5} ${cy} C ${cx - 5} ${cy + 2.75} ${cx - 2.75} ${cy + 5} ${cx} ${cy + 5} ` +
      `C ${cx + 2} ${cy + 5} ${cx + 3.5} ${cy + 4} ${cx + 4.5} ${cy + 2.25} ` +
      `L ${cx} ${cy} L ${cx + 4.5} ${cy - 2.25} C ${cx + 3.5} ${cy - 4} ` +
      `${cx + 2} ${cy - 5} ${cx} ${cy - 5} Z`,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

function logisticsSpoonPath(cx: number): Primitive {
  return {
    type: 'path',
    role: 'pictogram',
    d:
      `M ${cx - 0.7} 12.86 C ${cx - 0.573} 12.953 ${cx - 0.5} 13.103 ${cx - 0.5} 13.26 ` +
      `V 19.5 C ${cx - 0.5} 19.776 ${cx - 0.276} 20 ${cx} 20 ` +
      `C ${cx + 0.276} 20 ${cx + 0.5} 19.776 ${cx + 0.5} 19.5 V 13.26 ` +
      `C ${cx + 0.5} 13.103 ${cx + 0.573} 12.953 ${cx + 0.7} 12.86 ` +
      `C ${cx + 1.164} 12.521 ${cx + 1.5} 12.139 ${cx + 1.5} 11.5 ` +
      `C ${cx + 1.5} 10.262 ${cx + 0.846} 9.5 ${cx} 9.5 ` +
      `C ${cx - 0.846} 9.5 ${cx - 1.5} 10.262 ${cx - 1.5} 11.5 ` +
      `C ${cx - 1.5} 12.139 ${cx - 1.164} 12.521 ${cx - 0.7} 12.86 Z`,
    style: { fill: 'schwarz', stroke: 'none' },
  };
}

function maintenancePath(cx: number, cy: number): Primitive {
  return {
    type: 'path',
    role: 'pictogram',
    d:
      `M ${cx - 9} ${cy - 3} C ${cx - 7.343} ${cy - 3} ${cx - 6} ${cy - 1.657} ${cx - 6} ${cy} ` +
      `H ${cx + 6} C ${cx + 6} ${cy - 1.657} ${cx + 7.343} ${cy - 3} ${cx + 9} ${cy - 3} ` +
      `M ${cx - 9} ${cy + 3} C ${cx - 7.343} ${cy + 3} ${cx - 6} ${cy + 1.657} ${cx - 6} ${cy} ` +
      `M ${cx + 6} ${cy} C ${cx + 6} ${cy + 1.657} ${cx + 7.343} ${cy + 3} ${cx + 9} ${cy + 3}`,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

function wasteDisposalMarks(): readonly Primitive[] {
  return [
    line(14, 7, 18, 7),
    line(10, 8, 22, 8),
    {
      type: 'path',
      role: 'pictogram',
      d: 'M 11.5 8 V 19 C 11.5 19.552 11.948 20 12.5 20 H 19.5 ' +
        'C 20.052 20 20.5 19.552 20.5 19 V 8',
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
    line(13.5, 10, 13.5, 18),
    line(16, 10, 16, 18),
    line(18.5, 10, 18.5, 18),
  ];
}

function fuelsPath(cx: number, topYMm: number, bottomYMm: number): Primitive {
  return {
    type: 'path',
    role: 'pictogram',
    d:
      `M ${cx - 5} ${topYMm} H ${cx + 5} L ${cx + 1.5} ${topYMm + 5} ` +
      `V ${bottomYMm} M ${cx - 1.5} ${bottomYMm} V ${topYMm + 5} L ${cx - 5} ${topYMm}`,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

function drinkingWaterMarks(): readonly Primitive[] {
  return [
    line(20, 11, 20, 16),
    line(18, 11, 22, 11),
    {
      type: 'path',
      role: 'pictogram',
      d: 'M 7 14 H 23 C 24.657 14 26 15.343 26 17 V 18',
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    },
  ];
}

function waterConveyancePath(): Primitive {
  return {
    type: 'path',
    role: 'pictogram',
    d:
      'M 5 16 C 7.125 16 8.375 12 10.5 12 C 12.625 12 13.875 16 16 16 ' +
      'C 18.125 16 19.375 12 21.5 12 C 23.625 12 24.875 16 27 16',
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

function powerSupplyMark(): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points: [
      [17.083, 13.387], [14.027, 19.394], [13.232, 17.406], [12.768, 17.592],
      [13.861, 20.324], [16.593, 19.231], [16.407, 18.767], [14.524, 19.52],
      [17.762, 13.152], [17.49, 12.794], [13.417, 13.612], [16.222, 8.113],
      [15.777, 7.886], [12.737, 13.846], [13.009, 14.205], [17.083, 13.387],
    ],
    style: { fill: 'schwarz', stroke: 'none' },
  };
}

/** Die Fachdienstteilung, die jede der vier Fassungen als erste beiden Primitive trägt. */
const quartering: readonly Primitive[] = [line(16, 6, 16, 26), line(1, 16, 31, 16)];

function outline(points: readonly (readonly [number, number])[], closed = false): Primitive {
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    ...(closed ? { closed: true } : {}),
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };
}

describe('bodyMark() — D.3-Funktionskoerper', () => {
  const standardPersonBodyMm: BoundsMm = { minX: 3, minY: 3, maxX: 29, maxY: 29 };
  const loweredPersonBodyMm: BoundsMm = { minX: 3, minY: 5, maxX: 29, maxY: 31 };
  const personMark = (id: BodyMarkId, bounds: BoundsMm) =>
    bodyMarkWithContext(id, { kind: 'person' }, bounds);

  it('zeichnet Brandbekaempfung auf dem abgesenkten D.3.7-Koerper', () => {
    expect(personMark('fire-fighting', loweredPersonBodyMm)).toEqual([
      line(3, 18, 29, 18),
      outline([[25, 14], [29, 18], [25, 22], [21, 18]], true),
    ]);
  });

  it('zeichnet Sanitaet auf dem abgesenkten D.3.9/D.3.10-Koerper', () => {
    expect(personMark('medical-service', loweredPersonBodyMm)).toEqual([
      line(16, 10, 16, 31),
      line(3, 18, 29, 18),
    ]);
  });

  it('kombiniert Sanitaet und Betreuung fuer D.3.10 ohne implizite Zusatzmarke', () => {
    expect([
      ...personMark('medical-service', loweredPersonBodyMm),
      ...personMark('care', loweredPersonBodyMm),
    ]).toEqual([
      line(16, 10, 16, 31),
      line(3, 18, 29, 18),
      outline([[9.5, 24.5], [16, 18], [22.5, 24.5]]),
    ]);
  });

  it('unterscheidet die Betreuungsmarke des abgesenkten Zugs vom Standardkoerper D.3.12', () => {
    expect(personMark('care', loweredPersonBodyMm)).toEqual([
      outline([[9.5, 24.5], [16, 18], [22.5, 24.5]]),
    ]);
    expect(personMark('care', standardPersonBodyMm)).toEqual([
      outline([[9.5, 22.5], [16, 16], [22.5, 22.5]]),
    ]);
  });
});

describe('bodyMark() — die Fachdienstteilung', () => {
  it('legt beide Arme auf die Mittellinien und bis an die Körperkanten', () => {
    // Gemessen an `F.1.11_Rettungsdienst allgemein.svg`: senkrechter Arm 15,75…16,25 mm um die
    // Mittellinie 16,0 über die **volle** Körperhöhe 6…26, waagerechter Arm ebenso um 16,0 über
    // die volle Körperbreite 1…31. Das ist der Unterschied zur Boxfassung aus Kapitel 4, deren
    // beide Arme auf 2…30 mm enden — die randbündige Fassung stößt an die Hülle.
    expect(bodyMark('medical-service', formationBodyMm)).toEqual(quartering);
  });
});

describe('bodyMark() — gebänderte Logistikkörper', () => {
  it('routet G.5 ohne Stärke und den Verpflegungszug auf dieselbe Logistikgeometrie', () => {
    for (const strength of [undefined, 'zug'] as const) {
      const context = {
        kind: 'formation' as const,
        bodyVariant: 'foot-band' as const,
        ...(strength === undefined ? {} : { strength }),
      };
      const [mark] = bodyMarkWithContext('catering', context, formationBodyMm);
      expect(mark).toEqual(cateringPath(16, 15));
      expect(boundsOfMm(mark!)).toEqual({ minX: 11, minY: 10, maxX: 20.5, maxY: 20 });
    }
  });

  it('bewahrt die bestehende F.1.17-Fassung ausschließlich für die Gruppe bytegleich', () => {
    const [mark] = bodyMarkWithContext(
      'catering',
      { kind: 'formation', bodyVariant: 'foot-band', strength: 'gruppe' },
      formationBodyMm,
    );
    expect(mark).toEqual(cateringPath(16, 16.5));
    expect(boundsOfMm(mark!)).toEqual({ minX: 11, minY: 11.5, maxX: 20.5, maxY: 21.5 });
  });

  it('verschiebt die Truppfassung nur mit belegter unterer rechter Labelzone', () => {
    const [mark] = bodyMarkWithContext(
      'catering', {
        kind: 'formation', bodyVariant: 'foot-band', strength: 'trupp',
        occupiedLabelZones: ['bottomRight'],
      }, formationBodyMm,
    );
    expect(mark).toEqual(cateringPath(16, 13));
    expect(boundsOfMm(mark!)).toEqual({ minX: 11, minY: 8, maxX: 20.5, maxY: 18 });

    for (const strength of ['trupp', 'staffel'] as const) {
      expect(() => bodyMarkWithContext(
        'catering', { kind: 'formation', bodyVariant: 'foot-band', strength }, formationBodyMm,
      )).toThrow(/nicht vermessen/);
    }
  });

  it('setzt Löffel und Schüssel an Formation und Kreis auf dieselben absoluten Messpositionen', () => {
    for (const [kind, bounds] of [
      ['formation', formationBodyMm],
      ['circle-12', circleBodyMm],
    ] as const) {
      const marks = bodyMarkWithContext(
        'meal-preparation', { kind, bodyVariant: 'foot-band' }, bounds,
      );
      expect(marks).toEqual([logisticsSpoonPath(11), cateringPath(19, 15)]);
      expect(boundsOfMm(marks[0]!)).toEqual({ minX: 9.5, minY: 9.5, maxX: 12.5, maxY: 20 });
      expect(boundsOfMm(marks[1]!)).toEqual({ minX: 14, minY: 10, maxX: 23.5, maxY: 20 });
    }
  });

  it('setzt Löffel und Schüssel am Anhänger auf dessen eigene nach rechts versetzte Messposition', () => {
    const marks = bodyMarkWithContext(
      'meal-preparation', { kind: 'trailer', bodyVariant: 'foot-band' }, trailerBodyMm,
    );
    expect(marks).toEqual([logisticsSpoonPath(12), cateringPath(20, 15)]);
    expect(boundsOfMm(marks[0]!)).toEqual({ minX: 10.5, minY: 9.5, maxX: 13.5, maxY: 20 });
    expect(boundsOfMm(marks[1]!)).toEqual({ minX: 15, minY: 10, maxX: 24.5, maxY: 20 });
    expect(() => bodyMarkWithContext('meal-preparation', { kind: 'trailer' }, trailerBodyMm))
      .toThrow(/nicht vermessen/);
  });

  it('zeichnet Instandhaltung als Mittellinie mit offenen Endbögen je Körperprofil', () => {
    for (const [context, bounds, expected] of [
      [{ kind: 'formation', bodyVariant: 'foot-band' }, formationBodyMm, maintenancePath(16, 15)],
      [{ kind: 'vehicle-land', bodyVariant: 'foot-band' }, landBodyMm, maintenancePath(16, 15)],
      [{ kind: 'trailer', bodyVariant: 'foot-band' }, trailerBodyMm, maintenancePath(17.5, 15)],
      [{ kind: 'circle-12', bodyVariant: 'foot-band' }, circleBodyMm, maintenancePath(16, 15.5)],
    ] as const) {
      const marks = bodyMarkWithContext('maintenance', context, bounds);
      expect(marks).toEqual([expected]);
      expect(boundsOfMm(marks[0]!)).toEqual({
        minX: (bounds.minX + bounds.maxX) / 2 - 9,
        minY: context.kind === 'circle-12' ? 12.5 : 12,
        maxX: (bounds.minX + bounds.maxX) / 2 + 9,
        maxY: context.kind === 'circle-12' ? 18.5 : 18,
      });
    }
    for (const [kind, bounds] of [
      ['vehicle-land', landBodyMm],
      ['trailer', trailerBodyMm],
    ] as const) {
      expect(() => bodyMarkWithContext('maintenance', { kind }, bounds)).toThrow(/nicht vermessen/);
    }
  });

  it('zeichnet Entsorgung vollständig mit Griff, Deckel, Behälter und drei Innenlinien', () => {
    const marks = bodyMarkWithContext(
      'waste-disposal', { kind: 'formation', bodyVariant: 'foot-band' }, formationBodyMm,
    );
    expect(marks).toEqual(wasteDisposalMarks());
    expect(boundsOfMm(marks[0]!)).toEqual({ minX: 14, minY: 7, maxX: 18, maxY: 7 });
    expect(boundsOfMm(marks[1]!)).toEqual({ minX: 10, minY: 8, maxX: 22, maxY: 8 });
    expect(boundsOfMm(marks[2]!)).toEqual({ minX: 11.5, minY: 8, maxX: 20.5, maxY: 20 });
    for (const context of [
      { kind: 'vehicle-land', bodyVariant: 'foot-band' },
      { kind: 'trailer', bodyVariant: 'foot-band' },
      { kind: 'circle-12', bodyVariant: 'foot-band' },
    ] as const) {
      expect(() => bodyMarkWithContext('waste-disposal', context, formationBodyMm))
        .toThrow(/nicht vermessen/);
    }
  });

  it('vermisst die vier übrigen Formationsmarken und hält Normalformationen fail-closed', () => {
    const cases = [
      ['fuels-consumables', [fuelsPath(16, 9, 21)], { minX: 11, minY: 9, maxX: 21, maxY: 21 }],
      ['drinking-water', drinkingWaterMarks(), { minX: 7, minY: 11, maxX: 26, maxY: 18 }],
      ['water-conveyance', [waterConveyancePath()], { minX: 5, minY: 12, maxX: 27, maxY: 16 }],
      ['power-supply', [powerSupplyMark()], { minX: 12.737, minY: 7.886, maxX: 17.762, maxY: 20.324 }],
    ] as const;
    for (const [id, expected, expectedBounds] of cases) {
      const marks = bodyMarkWithContext(
        id, { kind: 'formation', bodyVariant: 'foot-band' }, formationBodyMm,
      );
      expect(marks).toEqual(expected);
      const combinedBounds = marks.map(boundsOfMm).reduce((left, right) => ({
        minX: Math.min(left.minX, right.minX),
        minY: Math.min(left.minY, right.minY),
        maxX: Math.max(left.maxX, right.maxX),
        maxY: Math.max(left.maxY, right.maxY),
      }));
      expect(combinedBounds).toEqual(expectedBounds);
      expect(() => bodyMarkWithContext(id, { kind: 'formation' }, formationBodyMm))
        .toThrow(/nicht vermessen/);
    }
  });

  it('zeichnet Catering und beide Kraftstofflagen am gebänderten Kreis exakt', () => {
    const catering = bodyMarkWithContext(
      'catering', { kind: 'circle-12', bodyVariant: 'foot-band' }, circleBodyMm,
    );
    expect(catering).toEqual([cateringPath(16, 15)]);
    expect(boundsOfMm(catering[0]!)).toEqual({ minX: 11, minY: 10, maxX: 20.5, maxY: 20 });

    const normal = bodyMarkWithContext(
      'fuels-consumables', { kind: 'circle-12', bodyVariant: 'foot-band' }, circleBodyMm,
    );
    expect(normal).toEqual([fuelsPath(16, 9, 21)]);
    expect(boundsOfMm(normal[0]!)).toEqual({ minX: 11, minY: 9, maxX: 21, maxY: 21 });

    const labeled = bodyMarkWithContext(
      'fuels-consumables', {
        kind: 'circle-12', bodyVariant: 'foot-band', occupiedLabelZones: ['bottomCenter'],
      }, circleBodyMm,
    );
    expect(labeled).toEqual([fuelsPath(16, 7, 18)]);
    expect(boundsOfMm(labeled[0]!)).toEqual({ minX: 11, minY: 7, maxX: 21, maxY: 18 });

    for (const id of ['catering', 'meal-preparation', 'fuels-consumables', 'maintenance'] as const) {
      for (const bodyVariant of [undefined, 'raised-gable'] as const) {
        expect(() => bodyMarkWithContext(
          id,
          { kind: 'circle-12', ...(bodyVariant === undefined ? {} : { bodyVariant }) },
          bodyVariant === 'raised-gable' ? raisedCircleBodyMm : circleBodyMm,
        )).toThrow(/nicht vermessen/);
      }
    }
  });
});

describe('bodyMark() — Brandbekämpfung für C.1', () => {
  it('zeichnet Brandbekämpfung für C.1 randbündig ohne rechten Horizontalast', () => {
    expect(bodyMark('fire-fighting', formationBodyMm)).toEqual([
      line(1, 16, 21, 16),
      line(21, 16, 31, 6),
      line(21, 16, 31, 26),
    ]);
  });
});

describe('bodyMark() — H.1 Veterinärzug', () => {
  it('rekonstruiert das vollständige Veterinär-V aus den gepaarten Konturkanten', () => {
    // Die obere und untere Konturkante der Quelle liegen auf y = 8,75 bzw. 9,25 mm: ihre
    // Mittellinie ist y = 9 mm. An den schrägen Konturpaaren liegen die Knicke bei x = 10/22 mm;
    // x = 11/21 mm wären bereits Punkte auf den Schenkeln und keine Mittellinienknicke.
    expect(bodyMark('veterinary', formationBodyMm)).toEqual([{
      type: 'polyline',
      role: 'pictogram',
      points: [[7, 9], [10, 9], [16, 23.6], [22, 9], [25, 9]],
      style: {
        fill: 'none',
        stroke: 'schwarz',
        strokeWidth: DEFAULT_STROKE_WIDTH_MM,
      },
    }]);
  });
});

describe('bodyMark() — H.2 Tierdekontamination', () => {
  it('setzt das Veterinär-V auf die aus beiden Konturkanten gewonnenen Mittellinien', () => {
    const [veterinaryV] = bodyMark('h-veterinary-decontamination', formationBodyMm);
    expect(veterinaryV).toEqual({
      type: 'polyline',
      role: 'pictogram',
      points: [[9, 9], [12, 9], [18, 23.6], [24, 9], [27, 9]],
      style: {
        fill: 'none',
        stroke: 'schwarz',
        strokeWidth: DEFAULT_STROKE_WIDTH_MM,
      },
    });
  });

  it('hält die zwei kurzen kreuzenden Pfeildiagonalen kompakt links unten und vom Veterinär-V getrennt', () => {
    // Sichtbare H.2-Quelle: die zwei Punkte um (4,583|18) und (10,417|18) tragen nur zwei
    // kurze kreuzende Pfeildiagonalen in x = 3,75…11,25 und y = 16,75…23,25 mm. Sie reichen
    // nicht bis zum Veterinär-V, dessen linker Schenkel in dieser unteren Zone erst deutlich
    // rechts davon liegt. Die frühere globale compactX-Verschiebung erzeugte dagegen Diagonalen
    // bis x = 19,75 und ließ sie das V kreuzen.
    const marks = bodyMark('h-veterinary-decontamination', formationBodyMm);
    expect(marks.slice(1)).toEqual([
      {
        type: 'circle', role: 'pictogram', cx: 4.583, cy: 18, r: 1.25,
        style: { fill: 'schwarz', stroke: 'none' },
      },
      {
        type: 'circle', role: 'pictogram', cx: 10.417, cy: 18, r: 1.25,
        style: { fill: 'schwarz', stroke: 'none' },
      },
      {
        type: 'polyline', role: 'pictogram',
        points: [[5.818, 18.167], [10.75, 22.4]],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
      {
        type: 'polyline', role: 'pictogram',
        points: [[3.75, 20.75], [3.75, 23.25], [6, 23.25]],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
      {
        type: 'polyline', role: 'pictogram',
        points: [[9.182, 18.167], [4.25, 22.4]],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
      {
        type: 'polyline', role: 'pictogram',
        points: [[9, 23.25], [11.25, 23.25], [11.25, 20.75]],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ]);
  });
});

describe('bodyMark() — H.3 Schlacht- und Untersuchungsgruppe', () => {
  it('setzt das Veterinär-V auf dieselben vermessenen Mittellinien wie H.2', () => {
    const [veterinaryV] = bodyMark('h-veterinary-slaughter', formationBodyMm);
    expect(veterinaryV).toEqual({
      type: 'polyline',
      role: 'pictogram',
      points: [[9, 9], [12, 9], [18, 23.6], [24, 9], [27, 9]],
      style: {
        fill: 'none',
        stroke: 'schwarz',
        strokeWidth: DEFAULT_STROKE_WIDTH_MM,
      },
    });
  });

  it('zeichnet Balken und hohles Hängedreieck als eine verbundene schwarze Kontur', () => {
    // Der Quellenumriss hat einen 0,5-mm-Balken x = 3…15 auf y = 20,75…21,25 mm. Seine
    // Unterkante geht an x ≈ 5,475/6,525 unmittelbar in die Außenschultern des Dreiecks über;
    // nur das innere Dreieck (6|21,4)–(7,5|23,25)–(4,5|23,25) bleibt als Negativraum frei.
    // Zwei getrennte Strichprimitive erzeugen dagegen eine Lücke und verkleinern die Kontur auf
    // genau diesen inneren Negativraum.
    const marks = bodyMark('h-veterinary-slaughter', formationBodyMm);
    expect(marks.slice(1)).toEqual([{
      type: 'path',
      role: 'pictogram',
      d: 'M 3 20.75 H 15 V 21.25 H 6.525 L 8.25 23.36 V 23.75 H 3.75 V 23.36 L 5.475 21.25 H 3 Z M 6 21.4 L 7.5 23.25 H 4.5 Z',
      style: {
        fill: 'schwarz',
        fillRule: 'evenodd',
        stroke: 'none',
      },
    }]);
  });
});

describe('bodyMark() — die Zusätze je Fachdienst', () => {
  it('setzt die Arztleiste 8 mm breit auf 4 mm über der Körperunterkante', () => {
    // Gemessen an `F.1.7_Sanitätsgruppe_arztbesetzt.svg` (und gleichlautend an `F.1.1`): Leiste
    // 12,0…20,0 mm auf der Mittellinie y 22,0 (Strichband 21,75…22,25), also mittig zur
    // Körpermitte 16,0 und 4 mm über der Unterkante 26,0. Die Boxfassung von 4.6.4 trägt eine
    // **10 mm** breite Leiste auf y 24 — die beiden Zeichnungen sind nicht ineinander
    // umrechenbar, und dieser Test hält fest, welche der beiden hier gilt.
    expect(bodyMark('physician', formationBodyMm)).toEqual([...quartering, line(12, 22, 20, 22)]);
  });

  it('setzt den Intensivbalken 8 mm hoch auf die Mittellinie der rechten Körperhälfte', () => {
    // Gemessen an `F.1.10_Schnelleinsatzgruppe Rettungsdienst.svg` und
    // `F.1.11_Rettungsdienst allgemein_Alternative.svg`: Balken 12,0…20,0 mm auf der Mittellinie
    // x 23,5 (Strichband 23,25…23,75) — also mittig zur Körpermitte 16,0 und auf der halben
    // Strecke zwischen Mittellinie 16,0 und rechter Kante 31,0. Die Boxfassung von 4.6.3 setzt
    // ihn 10 mm hoch auf x 24.
    expect(bodyMark('intensive-care', formationBodyMm)).toEqual([
      ...quartering,
      line(23.5, 12, 23.5, 20),
    ]);
  });

  it('setzt den Transportring auf r 5,5 mm um die Körpermitte', () => {
    // Gemessen an `F.1.8_Patiententransportgruppe.svg`: die weißen Viertelfelder enden auf
    // r 5,75 mm um (16|16), die Tortenstücke im Ring beginnen auf r 5,2376 — Mittellinie r 5,5
    // bei 0,5 mm Strich. Die Boxfassung von 4.6.5 trägt r ≈ 7 mm.
    const marks = bodyMark('patient-transport', formationBodyMm);
    const ring = marks.find((primitive) => primitive.type === 'circle');
    expect(ring).toEqual({
      type: 'circle',
      role: 'pictogram',
      cx: 16,
      cy: 16,
      r: 5.5,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    });
  });

  it('führt die beiden Diagonalen des Transportrings unter ±45° als Durchmesser', () => {
    // Die acht Speichen der Referenzdatei sind vier Linien: die beiden Arme der Teilung und zwei
    // Diagonalen. Geprüft wird die **Aussage** — durch die Körpermitte, Steigung ±1, Endpunkte
    // auf dem Ring — und nicht der Dezimalwert 3,8891, der nur ihre Folge ist. Endeten die
    // Diagonalen kürzer oder länger als r 5,5, träten die Speichen nicht bündig aus dem Ring.
    const diagonals = bodyMark('patient-transport', formationBodyMm)
      .filter((primitive) => primitive.type === 'line')
      .slice(2);
    expect(diagonals).toHaveLength(2);

    const slopes: number[] = [];
    for (const diagonal of diagonals) {
      if (diagonal.type !== 'line') throw new Error('unreachable');
      // Mittig zur Körpermitte: die beiden Endpunkte spiegeln sich an (16|16).
      expect((diagonal.x1 + diagonal.x2) / 2).toBeCloseTo(16, 9);
      expect((diagonal.y1 + diagonal.y2) / 2).toBeCloseTo(16, 9);
      // Beide Endpunkte liegen auf dem Ring r 5,5 — die Diagonale ist sein Durchmesser.
      expect(Math.hypot(diagonal.x1 - 16, diagonal.y1 - 16)).toBeCloseTo(5.5, 9);
      expect(Math.hypot(diagonal.x2 - 16, diagonal.y2 - 16)).toBeCloseTo(5.5, 9);
      slopes.push((diagonal.y2 - diagonal.y1) / (diagonal.x2 - diagonal.x1));
    }
    // Je einmal +45° und einmal −45°, nicht zweimal dieselbe Richtung.
    expect(slopes.map((slope) => Math.round(slope)).sort()).toEqual([-1, 1]);
  });
});

describe('bodyMark() — die Zeltmarke der Betreuung', () => {
  /** Das Zelt aus F.1.4: von der linken unteren Körperecke über die Mitte der Oberkante zurück. */
  const tent: Primitive = {
    type: 'polyline',
    role: 'pictogram',
    points: [
      [1, 26],
      [16, 6],
      [31, 26],
    ],
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  };

  it('spannt den Polyzug von Ecke zu Ecke über die Mitte der Oberkante', () => {
    // 4.2.1 Betreuung, randbündig. Gemessen an `F.1.4_Einsatzeinheit.svg`: die beiden Schenkel
    // laufen in die **Körperecken** unten und in die **Mitte der Oberkante**, nicht in eine
    // eingerückte Box — dasselbe Randbündigkeitsmerkmal wie beim Kreuz, das die Kanten 1…31 und
    // 6…26 nimmt statt der 2…30 der Boxfassung. Ohne Füllung: das Zelt ist eine Kontur, keine
    // Fläche, und eine Füllung deckte die Teilung darunter ab.
    expect(bodyMark('care', formationBodyMm)).toEqual([tent]);
  });

  it('trifft mit dem linken Schenkel die beiden vermessenen Innenkanten des Strichbands', () => {
    // Die eigentliche Herleitung, nachgerechnet statt geglaubt. Die Referenz gibt nicht die
    // Mittellinie, sondern die Kanten des 0,5-mm-Strichbands: der linke Schenkel läuft durch
    // (1,5|25,75) und (9,0|15,75). Bei der Steigung dieses Schenkels (15 mm waagerecht auf 20 mm
    // senkrecht) entspricht ein halber Strich von 0,25 mm einem waagerechten Versatz von
    // 0,25 · sqrt(1 + 0,75²) = 0,3125 mm. Auf die Mittellinie zurückgerechnet sind die beiden
    // gemessenen Punkte damit (1,1875|25,75) und (8,6875|15,75) — und genau die liefert der
    // Polyzug von (1|26) nach (16|6).
    //
    // Wer die Zahlen aus dem Bild direkt als Mittellinie nähme, legte das Zelt 0,3125 mm nach
    // rechts und verfehlte beide unteren Ecken; genau davor warnt der Dateikopf.
    const [leg] = bodyMark('care', formationBodyMm);
    if (leg?.type !== 'polyline') throw new Error('bodyMark("care") liefert keinen Polyzug.');
    const [[x0, y0], [x1, y1]] = leg.points as [[number, number], [number, number]];
    const xAt = (yMm: number): number => x0 + ((x1 - x0) * (yMm - y0)) / (y1 - y0);
    const halfStrokeOffsetMm = 0.25 * Math.sqrt(1 + 0.75 ** 2);
    expect(halfStrokeOffsetMm).toBeCloseTo(0.3125, 9);
    expect(xAt(25.75) + halfStrokeOffsetMm).toBeCloseTo(1.5, 9);
    expect(xAt(15.75) + halfStrokeOffsetMm).toBeCloseTo(9.0, 9);
  });

  it('trägt die Fachdienstteilung nicht mit', () => {
    // **Die Aussage dieses Blocks.** `physician` und `intensive-care` bringen das Kreuz mit, weil
    // ihre Kapitel-4-Zeichen (4.6.4, 4.6.3) es führen; `care` (4.2.1) führt es nicht. Belegt an
    // der Referenz selbst: `F.1.3` zeigt das Zelt **ohne** Kreuz, `F.1.4` zeigt beide. Jede Marke
    // ist genau ihr Kapitel-4-Zeichen, randbündig — und nicht „was auf dem Bild sonst noch steht".
    //
    // Ohne diesen Test zöge der nächste Bearbeiter das Kreuz der Bequemlichkeit halber in die
    // Zeltmarke (drei der fünf Fassungen führen es, das lädt dazu ein) — und `F.1.3` bekäme still
    // ein Kreuz, das seine Referenzdatei nicht zeigt. Kein Gate meldete das: der Fingerprint
    // sieht nur `role: 'body'`.
    const care = bodyMark('care', formationBodyMm);
    expect(care).toHaveLength(1);
    expect(care.some((primitive) => primitive.type === 'line')).toBe(false);
  });

  it('ergibt mit der Teilung zusammen das Bild von F.1.4 — zwei Marken nebeneinander', () => {
    // Die Gegenprobe zur Zusicherung darüber: `F.1.4` entsteht als **Liste zweier Marken**
    // (`bodyMarks: ['medical-service', 'care']`) und nicht dadurch, dass eine die andere
    // enthielte. Beide Fassungen bleiben dabei unverändert die, die ihr eigener Test festhält.
    const combined = [
      ...bodyMark('medical-service', formationBodyMm),
      ...bodyMark('care', formationBodyMm),
    ];
    expect(combined).toEqual([...quartering, tent]);
  });
});

describe('bodyMark() — F.1.3-Mobilmodul', () => {
  it('zeichnet das vom F.1.4-Zelt getrennte Giebelprofil und das schwarze Fußband', () => {
    expect(bodyMarkWithContext('care', { kind: 'formation', bodyVariant: 'foot-band' }, formationBodyMm)).toEqual([
      {
        type: 'polyline', role: 'pictogram', points: [[1, 23], [16, 6], [31, 23]],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ]);
  });

  it('zeichnet das Ruhebett mit Pfosten, gewölbter Liegefläche und Mittellinie', () => {
    const marks = bodyMark('temporary-accommodation-resting', formationBodyMm);
    expect(marks).toEqual(expect.arrayContaining([
      line(11, 14.5, 11, 20), line(21, 14.5, 21, 20), line(11, 18.75, 21, 18.75),
    ]));
  });
});

describe('bodyMark() — reduzierte Verpflegungsmarke aus F.1.17', () => {
  const sourceContractMark = (): Primitive => {
    const marks = bodyMarkWithContext(
      'catering',
      { kind: 'formation', bodyVariant: 'foot-band', strength: 'gruppe' },
      formationBodyMm,
    );
    expect(marks).toHaveLength(1);
    return marks[0] as Primitive;
  };

  it('zeichnet die gemessene F.1.17-Kontur als schwarzen 0,5-mm-Umriss', () => {
    // Unabhängig aus den expandierten Quellkonturen zurückgerechnet: außen/innen liegen
    // oben bei y=11,25/11,75, unten bei y=21,75/21,25 und links bei x=10,75/11,25 mm.
    // Die Miterkanten der rechten Spitze liegen bei x≈20,80/20,12 um den Konstruktionsanker
    // x=20,5. Daraus folgen die Mittellinienbox (11|11,5)–(20,5|21,5) und (16|16,5) als Lage.
    const mark = sourceContractMark();

    expect(mark).toMatchObject({
      type: 'path',
      role: 'pictogram',
    });
    expect(mark.style).toEqual({
      fill: 'none',
      stroke: 'schwarz',
      strokeWidth: DEFAULT_STROKE_WIDTH_MM,
    });
    expect(boundsOfMm(mark)).toEqual({ minX: 11, minY: 11.5, maxX: 20.5, maxY: 21.5 });
  });

  it('lässt den Ringinnenraum weiß und setzt nur die gemessene Kontur schwarz', () => {
    const mark = sourceContractMark();
    const image = new Resvg(renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'rect', role: 'body', x: 0, y: 0,
          width: DEFAULT_VIEWBOX_MM.width, height: DEFAULT_VIEWBOX_MM.height,
          style: { fill: 'weiss' },
        },
        mark,
      ],
    }, { size: 2048 })).render();
    const pixels = image.pixels;
    const rgbaAtMm = (xMm: number, yMm: number): readonly number[] => {
      const pixelsPerMm = image.width / DEFAULT_VIEWBOX_MM.width;
      const x = Math.round(xMm * pixelsPerMm);
      const y = Math.round(yMm * pixelsPerMm);
      const offset = (y * image.width + x) * 4;
      return Array.from(pixels.slice(offset, offset + 4));
    };

    expect(rgbaAtMm(16, 14)).toEqual([255, 255, 255, 255]);
    expect(rgbaAtMm(16, 11.5)).toEqual([0, 0, 0, 255]);
    expect(rgbaAtMm(11, 16.5)).toEqual([0, 0, 0, 255]);
  });
});

describe('bodyMark() — rein geometrische technische Marken aus F.1', () => {
  it('setzt den F.1.13-Ring mit eigenem Mittelpunkt und Radius um die vorhandenen Marken', () => {
    expect(bodyMark('ring-7mm-offset-down-1mm', formationBodyMm)).toEqual([
      {
        type: 'circle',
        role: 'pictogram',
        cx: 16,
        cy: 17,
        r: 7,
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ]);
  });

  it('setzt die drei gefüllten F.1.16-Polygone auf ihre vermessenen Eckpunkte', () => {
    expect(bodyMark('chevron-over-opposed-triangles', formationBodyMm)).toEqual([
      {
        type: 'polyline',
        role: 'pictogram',
        points: [[16, 16], [8, 10], [8, 8.5], [16, 13], [24, 8.5], [24, 10]],
        closed: true,
        style: { fill: 'schwarz', stroke: 'none' },
      },
      {
        type: 'polyline',
        role: 'pictogram',
        points: [[16, 20], [8, 22.667], [8, 17.333]],
        closed: true,
        style: { fill: 'schwarz', stroke: 'none' },
      },
      {
        type: 'polyline',
        role: 'pictogram',
        points: [[16, 20], [24, 17.333], [24, 22.667]],
        closed: true,
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ]);
  });

  it('setzt F.1.21 als gemessenen Ring mit äußerem Dach und eingeschriebenem Dreieck', () => {
    expect(bodyMark('ring-6-5mm-offset-down-2mm-with-roof', formationBodyMm)).toEqual([
      {
        type: 'polyline',
        role: 'pictogram',
        points: [[7, 15], [16, 8], [25, 15]],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
      {
        type: 'circle',
        role: 'pictogram',
        cx: 16,
        cy: 18,
        r: 6.5,
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
      {
        type: 'polyline',
        role: 'pictogram',
        points: [[11.5, 22.5], [16, 11.5], [20.5, 22.5]],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ]);
  });

  it('lehnt technische IDs außerhalb der konkret vermessenen Formationsfassung ab', () => {
    expect(() => bodyMarkWithContext(
      'chevron-over-opposed-triangles',
      { kind: 'vehicle-land' },
      formationBodyMm,
    )).toThrow(/nicht vermessen/);
    expect(() => bodyMarkWithContext(
      'ring-7mm-offset-down-1mm',
      { kind: 'formation', bodyVariant: 'foot-band' },
      formationBodyMm,
    )).toThrow(/nicht vermessen/);
    expect(() => bodyMark('catering', formationBodyMm)).toThrow(/nicht vermessen/);
  });
});

describe('bodyMark() — die drei getrennt vermessenen Fahrzeugkörper aus F.2', () => {
  it('setzt die Landfahrzeugteilung auf Dachscheitel, Körpermittellinie und Seitenkanten', () => {
    expect(bodyMarkWithContext(
      'medical-service', { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair' }, landBodyMm,
    )).toEqual([
      line(16, 8, 16, 26),
      line(1, 16, 31, 16),
    ]);
  });

  it('setzt den Patiententransportring des Landfahrzeugs auf r 5 mm', () => {
    const marks = bodyMarkWithContext(
      'patient-transport', { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair' }, landBodyMm,
    );
    expect(marks).toContainEqual({
      type: 'circle',
      role: 'pictogram',
      cx: 16,
      cy: 16,
      r: 5,
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
    });
  });

  it('setzt die Luftfahrzeugteilung und die Arztleiste auf ihre eigenen Messwerte', () => {
    expect(bodyMarkWithContext(
      'physician',
      { kind: 'vehicle-air', bodyVariant: 'raised-hull' },
      raisedAirBodyMm,
    )).toEqual([
      line(16, 6, 16, 20.99),
      line(2.74, 14, 29.26, 14),
      line(12, 17.75, 20, 17.75),
    ]);
    expect(() => bodyMarkWithContext('physician', { kind: 'vehicle-air' }, airBodyMm))
      .toThrow(/nicht vermessen/);
  });

  it('setzt die Anhängerteilung mit eigenem Ring und ohne Diagonalen', () => {
    const marks = bodyMarkWithContext('medical-service', { kind: 'trailer' }, trailerBodyMm);
    expect(marks).toEqual([
      line(17.5, 8, 17.5, 26),
      line(4, 17, 31, 17),
      {
        type: 'circle',
        role: 'pictogram',
        cx: 17.5,
        cy: 17,
        r: 5.5,
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ]);
    expect(marks.filter((mark) => mark.type === 'line')).toHaveLength(2);
  });
});

describe('bodyMark() — die beiden Sondermarken aus F.2', () => {
  it('zeichnet F.2.2s ungeklärte Kopfmarke als neutrale technische Geometrie', () => {
    expect(bodyMarkWithContext(
      'top-center-rect-0-5x0-6mm',
      { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair' },
      landBodyMm,
    )).toEqual([
      {
        type: 'rect',
        role: 'pictogram',
        x: 15.75,
        y: 8.25,
        width: 0.5,
        height: 0.6,
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ]);
    expect(() => bodyMarkWithContext(
      'top-center-rect-0-5x0-6mm',
      { kind: 'formation' },
      formationBodyMm,
    )).toThrow(/nicht vermessen/);
  });

  it('zeichnet F.2.6s unbegriffene Winschform als neutrale technische Luftfahrzeugmarke', () => {
    const marks = bodyMarkWithContext(
      'air-winch-chevron-diamond',
      { kind: 'vehicle-air', bodyVariant: 'raised-hull' },
      raisedAirBodyMm,
    );
    expect(marks).toEqual([
      line(24, 9.65, 24, 15.9),
      {
        type: 'polyline',
        role: 'pictogram',
        points: [[21.82, 11.82], [24, 9.65], [26.18, 11.82]],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
      {
        type: 'polyline',
        role: 'pictogram',
        points: [[24, 15.9], [26.35, 18], [24, 19.65], [21.65, 18], [24, 15.9]],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ]);
    expect(BODY_MARK_IDS).toContain('air-winch-chevron-diamond');
    expect(BODY_MARK_IDS).not.toContain('lifting-loads-persons');
  });

  it('verschiebt F.2.6s Hebezeichen vollständig mit der bereits platzierten Luftfahrzeughülle', () => {
    const shifted: BoundsMm = { minX: 4.01, minY: 8, maxX: 33.99, maxY: 22.99 };
    expect(bodyMarkWithContext(
      'air-winch-chevron-diamond',
      { kind: 'vehicle-air', bodyVariant: 'raised-hull' },
      shifted,
    )).toEqual([
      line(27, 11.65, 27, 17.9),
      {
        type: 'polyline', role: 'pictogram',
        points: [[24.82, 13.82], [27, 11.65], [29.18, 13.82]],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
      {
        type: 'polyline', role: 'pictogram',
        points: [[27, 17.9], [29.35, 20], [27, 21.65], [24.65, 20], [27, 17.9]],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
      },
    ]);
  });
});

describe('bodyMark() — F.2.10 bis F.2.17 auf normalen, gebänderten und Anhängerkörpern', () => {
  const outlineStyle = {
    fill: 'none',
    stroke: 'schwarz',
    strokeWidth: DEFAULT_STROKE_WIDTH_MM,
  } as const;

  it('vermisst care separat am normalen und gebänderten Landfahrzeug sowie am Anhänger', () => {
    expect(bodyMarkWithContext('care', { kind: 'vehicle-land' }, landBodyMm)).toEqual([{
      type: 'polyline', role: 'pictogram',
      points: [[1, 26], [16, 8], [31, 26]],
      style: outlineStyle,
    }]);
    expect(bodyMarkWithContext(
      'care', { kind: 'vehicle-land', bodyVariant: 'foot-band' }, landBodyMm,
    )).toEqual([{
      type: 'polyline', role: 'pictogram',
      points: [[1, 23], [16, 8], [31, 23]],
      style: outlineStyle,
    }]);
    expect(bodyMarkWithContext('care', { kind: 'trailer' }, trailerBodyMm)).toEqual([{
      type: 'polyline', role: 'pictogram',
      points: [[4, 26], [17.5, 8], [31, 26]],
      style: outlineStyle,
    }]);
  });

  it('zeichnet F.2.11s Ring mit Vierwegeform unter einer neutralen technischen ID', () => {
    expect(bodyMarkWithContext(
      'ring-6mm-offset-down-3mm-four-way-stem', { kind: 'vehicle-land' }, landBodyMm,
    )).toEqual([
      {
        type: 'circle', role: 'pictogram', cx: 16, cy: 19, r: 6,
        style: outlineStyle,
      },
      line(12, 17, 20, 17),
      line(16, 15, 16, 23),
      {
        type: 'polyline', role: 'pictogram', points: [[14, 15], [12, 17], [14, 19]],
        style: outlineStyle,
      },
      {
        type: 'polyline', role: 'pictogram', points: [[18, 15], [20, 17], [18, 19]],
        style: outlineStyle,
      },
      {
        type: 'polyline', role: 'pictogram', points: [[14, 24], [16, 23], [18, 24]],
      style: outlineStyle,
      },
    ]);
    expect(() => bodyMarkWithContext(
      'ring-6mm-offset-down-3mm-four-way-stem',
      { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair' },
      landBodyMm,
    )).toThrow(/nicht vermessen/);
  });

  it('zeichnet F.2.16s nach unten versetzten Acht-Speichen-Ring getrennt vom Task-2-Ring', () => {
    const diagonal = 5 / Math.SQRT2;
    expect(bodyMarkWithContext(
      'ring-5mm-offset-down-3mm-eight-spokes', { kind: 'vehicle-land' }, landBodyMm,
    )).toEqual([
      {
        type: 'circle', role: 'pictogram', cx: 16, cy: 19, r: 5,
      style: outlineStyle,
      },
      line(11, 19, 21, 19),
      line(16, 14, 16, 24),
      line(16 - diagonal, 19 - diagonal, 16 + diagonal, 19 + diagonal),
      line(16 + diagonal, 19 - diagonal, 16 - diagonal, 19 + diagonal),
    ]);
    expect(() => bodyMarkWithContext(
      'ring-5mm-offset-down-3mm-eight-spokes',
      { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair' },
      landBodyMm,
    )).toThrow(/nicht vermessen/);
  });

  it('konstruiert mobile Küche und Trinkwasser nur an der vermessenen Fahrzeug-Fußbandfassung', () => {
    const meal = bodyMarkWithContext(
      'meal-preparation', { kind: 'vehicle-land', bodyVariant: 'foot-band' }, landBodyMm,
    );
    expect(meal).toHaveLength(2);
    const [spoon, bowl] = meal;
    if (spoon?.type !== 'path' || bowl?.type !== 'path') {
      throw new Error('Mobile Küche muss aus Löffelsilhouette und Schüsselpfad bestehen.');
    }
    expect(spoon.style).toEqual({ fill: 'schwarz', stroke: 'none' });
    expect(boundsOfMm(spoon)).toEqual({
      minX: 12.113991, minY: 14.2678, maxX: 13.88634, maxY: 21.60015,
    });
    expect(boundsOfMm(bowl)).toEqual({
      minX: 14.500171, minY: 14.500347, maxX: 21.068339, maxY: 21.500138,
    });
    expect(bowl.d).toBe(
      'M 21.068339 16.327377 ' +
      'C 20.454508 15.197434, 19.289464 14.500347, 18.000243 14.500347 ' +
      'C 16.070379 14.500347, 14.500171 16.070732, 14.500171 18.000419 ' +
      'C 14.500171 19.930106, 16.070379 21.500138, 18.000243 21.500138 ' +
      'C 19.269532 21.500138, 20.425404 20.819808, 21.045233 19.716853 ' +
      'L 18 18 Z',
    );
    expect(bowl.style).toEqual(outlineStyle);

    expect(bodyMarkWithContext(
      'drinking-water', { kind: 'vehicle-land', bodyVariant: 'foot-band' }, landBodyMm,
    )).toEqual([
      // Aus den Füllkanten der Quelle zurückgerechnete Mittellinien: Stamm 17,75…18,25,
      // Oberbalken 16,5…19,5 bei y 15,25…15,75 und Rohr 17,25…17,75. Der Bogen nutzt das
      // arithmetische Mittel seiner beiden Konturen. Die letzten 0,1 mm bilden die sichtbare
      // senkrechte Endkappe y 20,4…20,5 ab; sie dürfen nicht in einem zu kurzen Bogen verschwinden.
      line(18, 15.5, 18, 18.5),
      line(16.5, 15.5, 19.5, 15.5),
      {
        type: 'path', role: 'pictogram',
        d: 'M 11 17.5 L 19.1 17.5 C 20.995 17.5, 22 18.505, 22 20.4 L 22 20.5',
        style: outlineStyle,
      },
    ]);

    expect(() => bodyMarkWithContext('meal-preparation', { kind: 'vehicle-land' }, landBodyMm))
      .toThrow(/nicht vermessen/);
    expect(() => bodyMarkWithContext('drinking-water', { kind: 'formation' }, formationBodyMm))
      .toThrow(/nicht vermessen/);
  });

  it('verschiebt die neuen technischen Marken ausschließlich über die platzierte Hülle', () => {
    const shifted: BoundsMm = { minX: 4, minY: 7.75, maxX: 34, maxY: 28 };
    const marks = bodyMarkWithContext(
      'ring-6mm-offset-down-3mm-four-way-stem', { kind: 'vehicle-land' }, shifted,
    );
    expect(marks[0]).toMatchObject({ type: 'circle', cx: 19, cy: 21, r: 6 });
    expect(marks).toContainEqual(line(15, 19, 23, 19));
    expect(marks).toContainEqual(line(19, 17, 19, 25));
  });

  it('verschiebt auch Löffelsilhouette und 3,5-mm-Schüssel nur über die platzierte Hülle', () => {
    const shifted: BoundsMm = { minX: 4, minY: 7.75, maxX: 34, maxY: 28 };
    const [spoon, bowl] = bodyMarkWithContext(
      'meal-preparation', { kind: 'vehicle-land', bodyVariant: 'foot-band' }, shifted,
    );
    if (spoon === undefined || bowl === undefined) throw new Error('unreachable');
    expect(boundsOfMm(spoon)).toEqual({
      minX: 15.113991, minY: 16.2678, maxX: 16.88634, maxY: 23.60015,
    });
    const bowlBounds = boundsOfMm(bowl);
    expect(bowlBounds.minX).toBeCloseTo(17.500171, 9);
    expect(bowlBounds.minY).toBeCloseTo(16.500347, 9);
    expect(bowlBounds.maxX).toBeCloseTo(24.068339, 9);
    expect(bowlBounds.maxY).toBeCloseTo(23.500138, 9);
  });
});

describe('bodyMark() — der zusammengefasste Eintrag von F.1.2', () => {
  /**
   * `cbrn-protection` zeichnet drei Dinge in **einem** Eintrag: die Fachdienstteilung mit zwei
   * Fenstern, die Arztleiste und das Innenzeichen 4.1.1. Das ist keine vermeidbare Bündelung.
   * Die vier Fenstergrenzen folgen aus keiner der drei Einzelzeichnungen: die beiden Fenster sind
   * **verschieden groß** (waagerecht Mitte ± 6,0, senkrecht Mitte ± 2,0), und nur die eine der
   * beiden Grenzen richtet sich nach dem Innenzeichen — siehe die Zusicherung „nur eine der
   * beiden Fenstergrenzen folgt der Tinte" weiter unten. Ein Zeichen, das die drei Marken
   * nebeneinander in `bodyMarks` führte, könnte die Unterbrechung gar nicht ausdrücken: die
   * Teilung wüsste nichts vom Innenzeichen.
   */
  const marks = bodyMark('cbrn-protection', formationBodyMm);

  /** Die Abschnitte, die die Striche des Eintrags auf einer der beiden Mittellinien belegen. */
  function coveredOn(axis: 'horizontal' | 'vertical', atMm: number): number[][] {
    const segments: number[][] = [];
    for (const primitive of marks) {
      if (primitive.type !== 'line') continue;
      const { x1, y1, x2, y2 } = primitive;
      if (axis === 'horizontal' && y1 === atMm && y2 === atMm) {
        segments.push([Math.min(x1, x2), Math.max(x1, x2)]);
      }
      if (axis === 'vertical' && x1 === atMm && x2 === atMm) {
        segments.push([Math.min(y1, y2), Math.max(y1, y2)]);
      }
    }
    return segments.sort((a, b) => (a[0] as number) - (b[0] as number));
  }

  /** Die beiden Schäfte des Innenzeichens: die einzigen schrägen Striche des Eintrags. */
  const shafts = marks.filter(
    (primitive) => primitive.type === 'line' && primitive.x1 !== primitive.x2 && primitive.y1 !== primitive.y2,
  );
  /** Die beiden Köpfe: die einzigen **gefüllten** Kreise des Eintrags. */
  const heads = marks.filter(
    (primitive) => primitive.type === 'circle' && primitive.style?.fill === 'schwarz',
  );

  it('lässt das waagerechte Fenster 10…22 frei — Mitte ± 6,0 mm', () => {
    // Gemessen am Umriss der Ebene `Takt_Zeichen` von `F.1.2_Dekontaminationseinheit für
    // Verletzte.svg` (Strichbänder 15,75…16,25 um die Mittellinie 16,0): der waagerechte Arm
    // steht als **zwei** Stücke x 1…10 und x 22…31.
    //
    // Die Prüfung ist absichtlich als Belegung der ganzen Mittellinie formuliert und nicht als
    // Vergleich zweier Striche: sie sammelt **jeden** Strich des Eintrags, der auf y 16 liegt.
    // Ein später „vereinfachter" Eintrag, der wieder die durchgezogene Teilung nähme, fiele damit
    // auf — auch dann, wenn er sie zusätzlich zu den beiden Stücken zeichnete.
    expect(coveredOn('horizontal', 16)).toEqual([
      [1, 10],
      [22, 31],
    ]);
  });

  it('lässt das senkrechte Fenster 14…18 frei — Mitte ± 2,0 mm', () => {
    // Dieselbe Vermessung, andere Achse: der senkrechte Arm steht als y 6…14 und y 18…26. Die
    // beiden Fenster sind damit **verschieden groß**, 12,0 gegen 4,0 mm — der erste Grund, warum
    // dieser Eintrag die Teilung nicht von `quartering()` beziehen kann.
    expect(coveredOn('vertical', 16)).toEqual([
      [6, 14],
      [18, 26],
    ]);
    const [waagerecht, senkrecht] = [coveredOn('horizontal', 16), coveredOn('vertical', 16)];
    expect((waagerecht[1]?.[0] as number) - (waagerecht[0]?.[1] as number)).toBe(12);
    expect((senkrecht[1]?.[0] as number) - (senkrecht[0]?.[1] as number)).toBe(4);
  });

  it('richtet nur eine der beiden Fenstergrenzen nach der Tinte des Innenzeichens', () => {
    // **Der Kern der Sache — hier wird die Nicht-Ableitbarkeit prüfbar.** Wäre das Fenster eine
    // Aussparung um das Innenzeichen, müssten beide Grenzen in derselben Beziehung zu dessen
    // Tinte stehen. Sie tun es nicht:
    //
    // - waagerecht reicht die Tinte (die beiden Kopfkreise) von 10,5 bis 21,5; das Fenster
    //   10…22 steht auf beiden Seiten genau 0,5 mm — eine Strichbreite — **außerhalb** davon;
    // - senkrecht liegt das Fenster 14…18 **innerhalb** der Ausdehnung des Innenzeichens: dessen
    //   Kopfoberkanten stehen auf 12,25 und damit über dem Fenster, seine Schaftspitzen auf 20,0
    //   und damit darunter. Der Arm ist dort weiter zurückgenommen, als das Zeichen es verlangt.
    //
    // Aus der einen Regel folgt die andere also nicht. Genau deshalb sind die vier Zahlen an
    // F.1.2 gemessen und nicht aus dem Innenzeichen gerechnet — und genau deshalb steht alles
    // in einem Eintrag.
    expect(heads).toHaveLength(2);
    const headXs = heads.flatMap((head) =>
      head.type === 'circle' ? [head.cx - head.r, head.cx + head.r] : [],
    );
    expect(Math.min(...headXs)).toBeCloseTo(10.5, 9);
    expect(Math.max(...headXs)).toBeCloseTo(21.5, 9);
    // Das Fenster steht je eine Strichbreite außerhalb der waagerechten Tinte.
    expect(Math.min(...headXs) - 10).toBeCloseTo(0.5, 9);
    expect(22 - Math.max(...headXs)).toBeCloseTo(0.5, 9);

    // Senkrecht umgekehrt: das Innenzeichen ragt oben **und** unten über das Fenster hinaus.
    const headTopMm = Math.min(
      ...heads.flatMap((head) => (head.type === 'circle' ? [head.cy - head.r] : [])),
    );
    const shaftBottomMm = Math.max(
      ...shafts.flatMap((shaft) => (shaft.type === 'line' ? [shaft.y1, shaft.y2] : [])),
    );
    expect(headTopMm).toBeLessThan(14);
    expect(shaftBottomMm).toBeGreaterThan(18);
  });

  it('stellt das Innenzeichen genau in die beiden Fenster', () => {
    // Die Gegenprobe zu den drei Zusicherungen darüber: die Fenster sind kein Loch im Bild,
    // sondern der Platz des Innenzeichens. Beide Schäfte laufen durch die Körpermitte (16|16) —
    // den Punkt, den beide Fenster gemeinsam haben. Ohne diese Prüfung bliebe „das Fenster ist
    // frei" auch dann grün, wenn das Innenzeichen ganz fehlte.
    expect(shafts).toHaveLength(2);
    for (const shaft of shafts) {
      if (shaft.type !== 'line') throw new Error('unreachable');
      // Die Körpermitte liegt auf der Geraden des Schafts …
      const crossMm =
        (16 - shaft.x1) * (shaft.y2 - shaft.y1) - (16 - shaft.y1) * (shaft.x2 - shaft.x1);
      expect(crossMm).toBeCloseTo(0, 9);
      // … und zwischen seinen beiden Enden, nicht auf ihrer Verlängerung.
      expect(Math.min(shaft.x1, shaft.x2)).toBeLessThan(16);
      expect(Math.max(shaft.x1, shaft.x2)).toBeGreaterThan(16);
      expect(Math.min(shaft.y1, shaft.y2)).toBeLessThan(16);
      expect(Math.max(shaft.y1, shaft.y2)).toBeGreaterThan(16);
    }
    // Zwei ausgefüllte Köpfe, kein Umriss: die Referenz führt sie als Fläche.
    for (const head of heads) {
      expect(head.style).toMatchObject({ fill: 'schwarz', stroke: 'none' });
    }
  });

  it('trägt die Arztleiste mit — dieselbe wie bei `physician`', () => {
    // 8 mm breit auf der Mittellinie y 22,0, also x 12…20 und 4 mm über der Körperunterkante. An
    // dieser Datei nachgemessen und nicht aus F.1.7 übernommen — dass beide Zahlenpaare gleich
    // ausfallen, ist das Ergebnis und nicht die Annahme. Sie gehört in **diesen** Eintrag und
    // ist nicht daneben komponierbar: ein Zeichen mit `bodyMarks: ['physician', ...]` brächte
    // die durchgezogene Teilung mit und schlösse die beiden Fenster.
    const bar = line(12, 22, 20, 22);
    expect(marks).toContainEqual(bar);
    expect(bodyMark('physician', formationBodyMm)).toContainEqual(bar);
  });

  it('setzt die Teilung des Eintrags nicht aus der durchgezogenen zusammen', () => {
    // Die ausdrückliche Gegenprobe zur „Vereinfachung": keiner der beiden durchgezogenen Arme
    // aus `quartering()` steht im Eintrag. Ein Eintrag, der sie zusätzlich zu den vier Stücken
    // führte, sähe im Bild aus wie eine geschlossene Teilung — und die Fensterprüfungen oben
    // fielen darauf herein, wären sie als Vergleich einzelner Striche geschrieben.
    for (const arm of quartering) {
      expect(marks).not.toContainEqual(arm);
    }
  });
});

/**
 * Die beiden Würfe dieser Datei werden **an ihrer Prosa** erkannt und nicht an einem Regelkode —
 * anders als die Ablehnungen in `validateSpec` (`top-left-label-requires-measured-body` und
 * ihresgleichen), die als Kode geprüft gehören. Das ist Absicht und keine Nachlässigkeit: die
 * Würfe sind katalogseitig, und im Katalog trägt kein Wurf einen Kode — `organizationColor` und
 * `baseDrawing` werfen genauso in Prosa. Ein einzelner Kode allein in `body-marks.ts` wäre eine
 * neue Bauart mit n = 1. Wer die Meldungen umformuliert, passt hier die Muster mit an.
 */
describe('bodyMark() — was nicht fortgeschrieben wird', () => {
  it('wirft für jedes nicht vermessene Art-/Varianten-/Fähigkeitspaar', () => {
    expect(() => bodyMarkWithContext('medical-service', { kind: 'vehicle-land' }, landBodyMm))
      .toThrow(/nicht vermessen/);
    expect(() => bodyMarkWithContext(
      'medical-service', { kind: 'vehicle-land', bodyVariant: 'raised-hull' }, landBodyMm,
    )).toThrow(/nicht vermessen/);
    expect(() => bodyMarkWithContext(
      'physician', { kind: 'vehicle-air', bodyVariant: 'plain-wheel-pair' }, raisedAirBodyMm,
    )).toThrow(/nicht vermessen/);
    expect(() => bodyMarkWithContext(
      'medical-service', { kind: 'trailer', bodyVariant: 'plain-wheel-pair' }, trailerBodyMm,
    )).toThrow(/nicht vermessen/);
    expect(() =>
      bodyMarkWithContext('medical-service', { kind: 'vehicle-water' }, formationBodyMm),
    ).toThrow(/nicht vermessen/);
    expect(() =>
      bodyMarkWithContext('medical-service', { kind: 'formation', bodyVariant: 'raised-hull' }, formationBodyMm),
    ).toThrow(/nicht vermessen/);
    expect(() =>
      bodyMarkWithContext('medical-service', { kind: 'formation', bodyVariant: 'foot-band' }, formationBodyMm),
    ).toThrow(/nicht vermessen/);
    expect(() =>
      bodyMarkWithContext('fire-fighting', { kind: 'vehicle-land' }, landBodyMm),
    ).toThrow(/nicht vermessen/);
  });

  it('wirft für eine Fähigkeit ohne vermessene randbündige Fassung', () => {
    // `service-water` steht in `CAPABILITY_IDS` und hat ein Boxpiktogramm, aber keine an einer
    // F-Datei vermessene randbündige Fassung. Ein stiller Rückfall auf die Boxfassung wäre der
    // eigentliche Fehler: die beiden Zeichnungen unterscheiden sich in ihren **Maßen** (Kreuz
    // 2…30 gegen 1…31, Leiste 10 gegen 8 mm) und nicht nur in ihrer Größe — das Ergebnis sähe
    // plausibel aus und wäre an keiner Referenzdatei belegt.
    expect(() => bodyMark('service-water', formationBodyMm)).toThrow(
      /keine randbündige Fassung vermessen/,
    );
  });

  it('wirft für eine Hülle, die nicht zum gewählten Fahrzeugkörper passt', () => {
    expect(() =>
      bodyMarkWithContext(
        'medical-service',
        { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair' },
        formationBodyMm,
      ),
    ).toThrow(/30 × 20,25 mm/);
  });

  it('meldet die tatsächlichen Hüllenmaße im Wurf', () => {
    // Ohne die Zahlen im Text stünde der nächste Leser vor „passt nicht" ohne zu wissen, um
    // wie viel — bei 0,25 mm Unterschied ist das der ganze Befund.
    expect(() => bodyMarkWithContext(
      'medical-service',
      { kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair' },
      formationBodyMm,
    )).toThrow(
      /30\.000 × 20\.000 mm/,
    );
  });
});

describe('bodyMark() — F.3.1 bis F.3.19 auf Kreis und reduziertem Haus', () => {
  const circleKind = 'circle-12' as SymbolKind;
  const reducedHouseKind = 'reduced-house' as SymbolKind;
  const raisedGable = 'raised-gable' as BodyVariantId;
  const technical = (id: string) => id as BodyMarkId;
  const circleMark = (
    id: BodyMarkId,
    variant: BodyVariantId | undefined = undefined,
    bounds: BoundsMm = variant === raisedGable ? raisedCircleBodyMm : circleBodyMm,
  ) => bodyMarkWithContext(
    id,
    { kind: circleKind, ...(variant === undefined ? {} : { bodyVariant: variant }) },
    bounds,
  );
  const outline = (points: readonly (readonly [number, number])[], closed = false): Primitive => ({
    type: 'polyline', role: 'pictogram', points, closed,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  });
  const ring = (cx: number, cy: number, r: number): Primitive => ({
    type: 'circle', role: 'pictogram', cx, cy, r,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  });
  const path = (d: string): Primitive => ({
    type: 'path', role: 'pictogram', d,
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
  });
  const filledCircle = (cx: number, cy: number, r: number): Primitive => ({
    type: 'circle', role: 'pictogram', cx, cy, r,
    style: { fill: 'schwarz', stroke: 'none' },
  });
  const filledRect = (x: number, y: number, width: number, height: number): Primitive => ({
    type: 'rect', role: 'pictogram', x, y, width, height,
    style: { fill: 'schwarz', stroke: 'none' },
  });
  const alphaRmse = (leftSvg: string, rightSvg: string): number => {
    const left = new Resvg(leftSvg).render();
    const right = new Resvg(rightSvg).render();
    expect([left.width, left.height]).toEqual([right.width, right.height]);
    const leftPixels = left.pixels;
    const rightPixels = right.pixels;
    let squaredDifference = 0;
    for (let index = 3; index < leftPixels.length; index += 4) {
      const difference = ((leftPixels[index] ?? 0) - (rightPixels[index] ?? 0)) / 255;
      squaredDifference += difference * difference;
    }
    return Math.sqrt(squaredDifference / (left.width * left.height));
  };

  const normalQuartering = [line(16, 4, 16, 28), line(4, 16, 28, 16)];
  const raisedQuartering = [line(16, 6, 16, 30), line(4, 18, 28, 18)];

  it('vermisst Sanitätskreuz und Arztleiste getrennt für normal und raised-gable', () => {
    expect(circleMark('medical-service')).toEqual(normalQuartering);
    expect(circleMark('physician')).toEqual([
      ...normalQuartering, line(12, 22, 20, 22),
    ]);
    expect(circleMark('medical-service', raisedGable)).toEqual(raisedQuartering);
    expect(circleMark('physician', raisedGable)).toEqual([
      ...raisedQuartering, line(12, 24, 20, 24),
    ]);
  });

  it('zeichnet F.3.1/F.3.2 als geteilten Kreis mit dem oberen Doppelpfeil', () => {
    expect(circleMark(technical('circle-patient-staging-arrows'))).toEqual([
      ...normalQuartering,
      line(10, 10, 22, 10),
      outline([[13, 7], [10, 10], [13, 13]]),
      outline([[19, 7], [22, 10], [19, 13]]),
    ]);
  });

  it('zeichnet F.3.6 als Sammelpfeil mit eigenem Ring', () => {
    expect(circleMark(technical('circle-collection-arrow'))).toEqual([
      line(6, 16, 21, 16),
      outline([[18, 13], [21, 16], [18, 19]]),
      ring(23, 16, 2),
    ]);
  });

  it('zeichnet F.3.7 und F.3.8 mit ihren getrennt vermessenen Rahmen', () => {
    const upperFrame = path(
      'M 8 9.5 C 10 10.25, 13 11, 16 11 C 19 11, 22 10.25, 24 9.5 L 24 19 L 8 19 Z',
    );
    expect(circleMark(technical('circle-staging-frame-arrow'))).toEqual([
      upperFrame,
      line(8, 22, 20, 22),
      outline([[18, 20], [20, 22], [18, 24]]),
      ring(21.5, 22, 1.5),
    ]);
    expect(circleMark(technical('circle-staging-frame'))).toEqual([
      path('M 8 11 C 10 11.75, 13 12.5, 16 12.5 C 19 12.5, 22 11.75, 24 11 L 24 21 L 8 21 Z'),
    ]);
  });

  it('zeichnet F.3.9 als viergeteilten Rahmen mit unterem Doppelpfeil', () => {
    expect(circleMark(technical('circle-staging-frame-quadrants-arrows'))).toEqual([
      path('M 8 9.5 C 10 10.25, 13 11, 16 11 C 19 11, 22 10.25, 24 9.5 L 24 19 L 8 19 Z'),
      line(16, 11, 16, 19),
      line(8, 14.5, 24, 14.5),
      line(8, 22, 24, 22),
      outline([[10, 20], [8, 22], [10, 24]]),
      outline([[22, 20], [24, 22], [22, 24]]),
    ]);
  });

  it('zeichnet F.3.10 als Raute, Anschlag und Rechtspfeil statt Patiententransport', () => {
    expect(circleMark(technical('circle-diamond-arrow'))).toEqual([
      outline([[16, 6], [22.5, 12.5], [16, 19], [9.5, 12.5]], true),
      line(16, 6, 16, 19),
      line(9, 20, 9, 24),
      line(9, 22, 24, 22),
      outline([[22, 20], [24, 22], [22, 24]]),
    ]);
  });

  it('zeichnet F.3.11 als geteilten Kreis mit eigenem Kreuzring', () => {
    const diagonal = 5.5 / Math.SQRT2;
    expect(circleMark(technical('circle-cross-ring'))).toEqual([
      ...normalQuartering,
      ring(16, 16, 5.5),
      line(16 - diagonal, 16 - diagonal, 16 + diagonal, 16 + diagonal),
      line(16 + diagonal, 16 - diagonal, 16 - diagonal, 16 + diagonal),
    ]);
  });

  it('zeichnet F.3.12 als Stamm, oberen Doppelpfeil und unteres offenes V', () => {
    expect(circleMark(technical('circle-double-arrow-lower-v'))).toEqual([
      line(16, 4, 16, 22),
      line(9, 11, 23, 11),
      outline([[11.5, 8.5], [9, 11], [11.5, 13.5]]),
      outline([[20.5, 8.5], [23, 11], [20.5, 13.5]]),
      outline([[9, 25.75], [16, 22], [23, 25.75]]),
    ]);
  });

  it('zeichnet care bounds-relativ, aber nur in den beiden vermessenen Kreisfassungen', () => {
    expect(circleMark('care')).toEqual([outline([[8, 25], [16, 4], [24, 25]])]);
    expect(circleMark('care', raisedGable)).toEqual([outline([[8, 27], [16, 6], [24, 27]])]);
    const shifted = { minX: 5, minY: 5, maxX: 29, maxY: 29 };
    expect(circleMark('care', undefined, shifted)).toEqual([
      outline([[9, 26], [17, 5], [25, 26]]),
    ]);
  });

  it('zeichnet F.3.17 als gefüllten Informationspunkt und gefüllten Stamm', () => {
    expect(circleMark(technical('circle-information-stem'))).toEqual([
      filledCircle(16, 10.5, 1.5),
      filledRect(15, 14, 2, 8),
    ]);
  });

  it('verschiebt jede neue technische Kreisgeometrie vollständig mit ihrer 24-mm-Hülle', () => {
    const shifted = { minX: 5, minY: 5, maxX: 29, maxY: 29 };
    expect(circleMark(technical('circle-double-arrow-lower-v'), undefined, shifted)).toEqual([
      line(17, 5, 17, 23),
      line(10, 12, 24, 12),
      outline([[12.5, 9.5], [10, 12], [12.5, 14.5]]),
      outline([[21.5, 9.5], [24, 12], [21.5, 14.5]]),
      outline([[10, 26.75], [17, 23], [24, 26.75]]),
    ]);
    expect(circleMark(technical('circle-information-stem'), undefined, shifted)).toEqual([
      filledCircle(17, 11.5, 1.5),
      filledRect(16, 15, 2, 8),
    ]);
    expect(circleMark(technical('circle-transport-diamond-arrows'), undefined, shifted)).toEqual([
      outline([[17, 7], [23.5, 13.5], [17, 20], [10.5, 13.5]], true),
      line(10, 21, 10, 25),
      line(10, 23, 25, 23),
      outline([[23, 21], [25, 23], [23, 25]]),
      line(17, 7, 13, 20),
      line(17, 7, 21, 20),
    ]);
    expect(
      circleMark(technical('circle-transport-diamond-wheels-arrows'), undefined, shifted),
    ).toEqual([
      outline([[17, 7], [23.5, 13.5], [17, 20], [10.5, 13.5]], true),
      line(10, 21, 10, 25),
      line(10, 23, 25, 23),
      outline([[23, 21], [25, 23], [23, 25]]),
      ring(11.5, 18.5, 1.5),
      ring(22.5, 18.5, 1.5),
    ]);
  });

  it('teilt Raute und Unterpfeil mit F.3.10, ohne dessen Ausgabe zu verändern', () => {
    const shared = [
      outline([[16, 6], [22.5, 12.5], [16, 19], [9.5, 12.5]], true),
      line(9, 20, 9, 24),
      line(9, 22, 24, 22),
      outline([[22, 20], [24, 22], [22, 24]]),
    ];
    expect(circleMark(technical('circle-diamond-arrow'))).toEqual([
      shared[0], line(16, 6, 16, 19), ...shared.slice(1),
    ]);
    expect(circleMark(technical('circle-transport-diamond-arrows'))).toEqual([
      ...shared,
      line(16, 6, 12, 19),
      line(16, 6, 20, 19),
    ]);
  });

  it('zeichnet F.3.19 mit zwei Ringen und ausdrücklich ohne F.3.18-Diagonalen', () => {
    const marks = circleMark(technical('circle-transport-diamond-wheels-arrows'));
    expect(marks).toEqual([
      outline([[16, 6], [22.5, 12.5], [16, 19], [9.5, 12.5]], true),
      line(9, 20, 9, 24),
      line(9, 22, 24, 22),
      outline([[22, 20], [24, 22], [22, 24]]),
      ring(10.5, 17.5, 1.5),
      ring(21.5, 17.5, 1.5),
    ]);
    expect(marks).not.toContainEqual(line(16, 6, 12, 19));
    expect(marks).not.toContainEqual(line(16, 6, 20, 19));
  });

  it('baut Unterkunft und Krankenhaus ausschließlich gegen die reduced-house-Hülle', () => {
    expect(bodyMarkWithContext(
      'temporary-accommodation-resting', { kind: reducedHouseKind }, reducedHouseBodyMm,
    )).toEqual([
      line(6, 12, 6, 24),
      line(26, 12, 26, 24),
      path('M 6 19 C 6 15.708, 9.7 14, 16 14 C 22.3 14, 26 15.708, 26 19'),
      line(6, 20, 26, 20),
    ]);
    expect(bodyMarkWithContext(
      'hospital', { kind: reducedHouseKind }, reducedHouseBodyMm,
    )).toEqual([
      line(16, 10, 16, 26),
      line(9, 14, 9, 22),
      line(23, 14, 23, 22),
      line(2, 18, 30, 18),
    ]);
  });

  it('verschiebt beide Hausmarken vollständig mit ihrer 28 × 22-mm-Hülle', () => {
    const shiftedHouse = { minX: 3, minY: 5, maxX: 31, maxY: 27 };
    expect(bodyMarkWithContext(
      'temporary-accommodation-resting', { kind: reducedHouseKind }, shiftedHouse,
    )).toEqual([
      line(7, 13, 7, 25),
      line(27, 13, 27, 25),
      path('M 7 20 C 7 16.708, 10.7 15, 17 15 C 23.3 15, 27 16.708, 27 20'),
      line(7, 21, 27, 21),
    ]);
    expect(bodyMarkWithContext('hospital', { kind: reducedHouseKind }, shiftedHouse)).toEqual([
      line(17, 11, 17, 27),
      line(10, 15, 10, 23),
      line(24, 15, 24, 23),
      line(3, 19, 31, 19),
    ]);
  });

  it('trifft F.3.15s expandierte Originalkontur im unabhängigen Quellenraster', () => {
    const generated = renderSvg({
      viewBox: DEFAULT_VIEWBOX_MM,
      children: bodyMarkWithContext(
        'temporary-accommodation-resting', { kind: reducedHouseKind }, reducedHouseBodyMm,
      ),
    }, { size: 2048 });
    // Verbatim die beiden Marken-Subpfade aus `F.3.15_Unterkunft.svg`; die Hauskontur beginnt
    // erst beim folgenden `M4.96,27.45` und ist bewusst nicht Teil dieses Vergleichs.
    const source =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 90.709 90.709" ' +
      'width="2048" height="2048"><path fill="#000000" d="' +
      'M72.992,48.345c-2.635-4.699-9.749-9.368-27.638-9.368s-25.003,4.668-' +
      '27.638,9.368v-14.329h-1.417v34.016h1.417v-10.63h55.275v10.63h1.417v-34.016h-' +
      '1.417v14.329ZM72.992,55.985H17.717v-2.126c0-8.683,9.815-13.464,27.638-' +
      '13.464s27.638,4.782,27.638,13.464v2.126Z"/></svg>';
    expect(alphaRmse(generated, source)).toBeLessThan(0.006);
  });

  it('rechnet jede Kreismarke gegen die übergebene Hülle statt gegen absolute F.3-Koordinaten', () => {
    const shifted = { minX: 5, minY: 5, maxX: 29, maxY: 29 };
    expect(circleMark(technical('circle-collection-arrow'), undefined, shifted)).toEqual([
      line(7, 17, 22, 17),
      outline([[19, 14], [22, 17], [19, 20]]),
      ring(24, 17, 2),
    ]);
  });

  it('lehnt jede ungemessene Art-/Varianten-/Markenkombination ab', () => {
    for (const id of [
      'circle-patient-staging-arrows',
      'circle-collection-arrow',
      'circle-staging-frame-arrow',
      'circle-staging-frame',
      'circle-staging-frame-quadrants-arrows',
      'circle-diamond-arrow',
      'circle-cross-ring',
      'circle-double-arrow-lower-v',
      'circle-information-stem',
      'circle-transport-diamond-arrows',
      'circle-transport-diamond-wheels-arrows',
    ]) {
      expect(() => bodyMarkWithContext(
        technical(id), { kind: 'formation' }, formationBodyMm,
      ), id).toThrow(/nicht vermessen/);
      expect(() => bodyMarkWithContext(
        technical(id), { kind: 'post' }, circleBodyMm,
      ), id).toThrow(/nicht vermessen/);
    }
    expect(() => circleMark('medical-service', 'foot-band')).toThrow(/nicht vermessen/);
    expect(() => circleMark(technical('circle-collection-arrow'), raisedGable)).toThrow(
      /nicht vermessen/,
    );
    expect(() => circleMark(technical('circle-double-arrow-lower-v'), raisedGable)).toThrow(
      /nicht vermessen/,
    );
    expect(() => bodyMarkWithContext('care', { kind: reducedHouseKind }, reducedHouseBodyMm))
      .toThrow(/nicht vermessen/);
    expect(() => bodyMarkWithContext(
      'hospital', { kind: reducedHouseKind, bodyVariant: raisedGable }, reducedHouseBodyMm,
    )).toThrow(/nicht vermessen/);
    expect(() => bodyMarkWithContext(
      'hospital', { kind: 'building' }, reducedHouseBodyMm,
    )).toThrow(/nicht vermessen/);
  });
});

describe('BODY_MARK_IDS', () => {
  it('zeichnet die beiden D.1.9-Kappen als getrennt vermessene technische Marken', () => {
    const primary = Reflect.apply(bodyMarkWithContext, undefined, [
      'formation-solid-cap-3mm', { kind: 'formation' }, formationBodyMm,
    ]);
    expect(primary).toEqual([
      {
        type: 'rect', role: 'pictogram', x: 1, y: 6, width: 30, height: 3,
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ]);

    const alternative = Reflect.apply(bodyMarkWithContext, undefined, [
      'formation-solid-cap-4mm-three-hole-row', { kind: 'formation' }, formationBodyMm,
    ]);
    expect(alternative).toHaveLength(4);
    expect(alternative[0]).toMatchObject({
      type: 'rect', role: 'pictogram', x: 1, y: 6, width: 30, height: 4,
    });
    expect(alternative.slice(1)).toEqual([11, 16, 21].map((cx) => ({
      type: 'circle', role: 'pictogram', cx, cy: 7.75, r: 1.5,
      style: { fill: 'weiss', stroke: 'none' },
    })));
  });

  it('führt jede vermessene Fähigkeit und zeichnet alle nicht separat exakt geprüften IDs', () => {
    // Enthaltensein und nicht Gleichheit — und der Zuwachs hat die Bauart schon bestätigt: mit
    // `care` (F.1.4) kam ein fünfter vermessener Fachdienst dazu, ohne dass dieser Test dafür
    // rot werden musste. Was er festhält, ist die Zusicherung, dass jede aufgeführte Kennung
    // auch tatsächlich eine Zeichnung liefert — eine Kennung in der Liste, die im Aufruf wirft
    // oder nichts liefert, wäre ein Katalog, der eine Fassung anmeldet, die er nicht hat.
    for (const id of [
      'medical-service',
      'physician',
      'intensive-care',
      'patient-transport',
      'care',
    ]) {
      expect(BODY_MARK_IDS).toContain(id);
    }
    const task1LogisticsIds = new Set<BodyMarkId>([
      'fuels-consumables',
      'drinking-water',
      'water-conveyance',
      'power-supply',
      'catering',
      'meal-preparation',
      'maintenance',
      'waste-disposal',
    ]);
    for (const id of task1LogisticsIds) expect(BODY_MARK_IDS).toContain(id);
    for (const id of BODY_MARK_IDS) {
      // Sämtliche Task-1-Logistikrouten sind oben je Körperprofil mit exakten Primitiven,
      // Pfaden, Stilen, Bounds und negativen Nachbarkontexten abgesichert. Ein zusätzlicher
      // Existenzcheck würde diese stärkeren Verträge wieder zu `length > 0` verwässern.
      if (task1LogisticsIds.has(id)) continue;
      // Kein Mindestmaß von zwei Primitiven: `care` steht mit **einem** Polyzug ohne Teilung da,
      // und genau das ist an F.1.3 belegt (siehe den Block zur Zeltmarke oben).
      const invocation = id === 'air-winch-chevron-diamond'
          ? [{ kind: 'vehicle-air', bodyVariant: 'raised-hull' } as const, raisedAirBodyMm] as const
        : id === 'air-quartering-up-arrow-box'
          ? [{ kind: 'vehicle-air', bodyVariant: 'raised-hull' } as const, raisedAirBodyMm] as const
        : id === 'air-horizontal-left-chevron' || id === 'air-rising-diagonal'
          ? [{ kind: 'vehicle-air', bodyVariant: 'fixed-wing-hull' } as const, raisedAirBodyMm] as const
        : id === 'top-center-rect-0-5x0-6mm'
            ? [{ kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair' } as const, landBodyMm] as const
          : id === 'double-wave-inner-diamond-8mm'
            ? [{ kind: 'person', bodyVariant: 'compact-person-diamond-26mm' } as const,
              compactPersonDiamondBodyMm] as const
          : id === 'hospital'
            ? [{ kind: 'reduced-house' } as const, reducedHouseBodyMm] as const
            : id.startsWith('circle-')
              ? [{ kind: 'circle-12' } as const, circleBodyMm] as const
            : id.startsWith('spontaneous-helper-')
              ? [{ kind: 'circle-12' } as const, circleBodyMm] as const
            : id === 'land-horizontal-blade-bent-upright'
              ? [{ kind: 'vehicle-land', bodyVariant: 'inverted-hull-track' } as const, invertedLandBodyMm] as const
            : id === 'ring-6mm-offset-down-3mm-four-way-stem' ||
                id === 'ring-5mm-offset-down-3mm-eight-spokes' ||
                id === 'ring-5mm-offset-down-3-5mm-eight-spokes'
              ? [{ kind: 'vehicle-land' } as const, landBodyMm] as const
          : [{ kind: 'formation' } as const, formationBodyMm] as const;
      expect(bodyMarkWithContext(id, invocation[0], invocation[1]).length).toBeGreaterThanOrEqual(1);
    }
  });
});
