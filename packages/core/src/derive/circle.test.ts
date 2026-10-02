import { describe, expect, it } from 'vitest';
import {
  ORGANIZATION_IDS,
  type BodyVariantId,
  type Drawing,
  type Primitive,
  type SymbolKind,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { bodyLabelInk } from '../compose.js';
import { drawSymbol } from '../default-ports.js';
import { baseDrawing } from '../geometry/base-symbols.js';
import { ARIMO_TEXT_METRICS } from '../geometry/text-metrics.js';
import { hasVariantProfile, profileFor } from '../layout/profiles.js';
import { measureTextRun } from '../text-metrics.js';
import {
  CIRCLE_VARIANT_PAIRS,
  circleSegmentPath,
  placeCircleUnderHead,
} from './circle.js';

type TextRun = Extract<Primitive, { type: 'text' }>;

function flat(children: readonly Primitive[]): Primitive[] {
  return children.flatMap((child) => (child.type === 'group' ? [child, ...flat(child.children)] : [child]));
}

function labelRuns(drawing: Drawing): TextRun[] {
  return flat(drawing.children).filter(
    (child): child is TextRun => child.type === 'text' && child.role === 'label',
  );
}

function circleBody(drawing: Drawing): { cx: number; cy: number; r: number } {
  const body = drawing.children.find((child) => child.role === 'body');
  if (body?.type !== 'circle') throw new Error('Kreiskörper fehlt.');
  return body;
}

/** Alle vier Tintenecken eines Laufs liegen innerhalb der Kreisfläche (Innenkante des Strichs). */
function expectInkInsideCircle(run: TextRun, circle: { cx: number; cy: number; r: number }): void {
  const ink = measureTextRun(run, ARIMO_TEXT_METRICS);
  const top = run.y - ink.inkAscentMm;
  const bottom = run.y + ink.inkDescentMm;
  for (const [x, y] of [
    [ink.inkMinXMm, top],
    [ink.inkMaxXMm, top],
    [ink.inkMinXMm, bottom],
    [ink.inkMaxXMm, bottom],
  ] as const) {
    expect(Math.hypot(x - circle.cx, y - circle.cy), `${run.content} (${x}|${y})`).toBeLessThan(
      circle.r - 0.25,
    );
  }
}

describe('Schrifttinte auf Gelb (vermessene Korrektur, 02.10.2026)', () => {
  it('setzt Körperläufe auf Gelb schwarz wie alle 20 gelben Referenzen mit Typo', () => {
    expect(bodyLabelInk('gelb')).toBe('schwarz');
    expect(bodyLabelInk('weiss')).toBe('schwarz');
    expect(bodyLabelInk('rot')).toBe('weiss');
    expect(bodyLabelInk('gelb', 'weiss')).toBe('weiss');
  });

  it('zeichnet einen Lauf in der Führung-und-Leitung-Formation schwarz', () => {
    const drawing = drawSymbol({
      kind: 'formation',
      organization: 'fuehrung-leitung',
      labels: { center: 'TEL' },
    });
    expect(drawing.derivations).toBeUndefined();
    expect(labelRuns(drawing).map((run) => run.style?.fill)).toEqual(['schwarz']);
  });
});

describe('Mittiger Lauf am Kreis: Versalmitte auf der Kreismitte', () => {
  it('setzt den Normlauf an der Funktionsstelle auf cy + 4,87/2 statt 3,6 mm darunter', () => {
    const drawing = drawSymbol({ kind: 'post', labels: { center: 'LST' } });
    const [run] = labelRuns(drawing);
    expect(run?.y).toBeCloseTo(16 + 4.87 / 2, 6);
    expect(drawing.derivations).toContainEqual(expect.objectContaining({
      dimension: 'labels.center', basis: 'constructed',
    }));
  });

  it('folgt der Versalhöhe und trifft D.2.3/D.2.4 und D.2.5 auf ±0,65 mm', () => {
    const at = (spec: SymbolSpec) => labelRuns(drawSymbol(spec))[0]!.y;
    // D.2.3/D.2.4: Kreis (16|16), Grundlinie 19 bei Versalhöhe 7,3.
    expect(Math.abs(at({ kind: 'circle-12', labels: { center: 'M', centerCapHeightMm: 7.3 } }) - 19))
      .toBeLessThanOrEqual(0.65);
    // D.2.5: Kreis (16|18), Grundlinie 22.
    expect(Math.abs(at({
      kind: 'circle-12', bodyVariant: 'raised-gable', labels: { center: 'LtS', centerCapHeightMm: 7.3 },
    }) - 22)).toBeLessThanOrEqual(0.65);
  });

  it('übernimmt den vermessenen Override bytegleich und ohne Notiz', () => {
    const d25 = drawSymbol({
      kind: 'circle-12', bodyVariant: 'raised-gable', organization: 'fuehrung-leitung',
      labels: { center: 'LtS', centerCapHeightMm: 7.3, centerBaselineFromBodyBottomMm: 8 },
    });
    expect(labelRuns(d25)[0]?.y).toBe(22);
    expect(d25.derivations).toBeUndefined();
    const d23 = drawSymbol({
      kind: 'circle-12', organization: 'fuehrung-leitung',
      labels: { center: 'M', centerCapHeightMm: 7.3, centerBaselineFromBodyBottomMm: 9 },
    });
    expect(labelRuns(d23)[0]?.y).toBe(19);
  });
});

describe('Kürzel in den Ecken am Kreis', () => {
  const probe = drawSymbol({
    kind: 'post',
    organization: 'fuehrung-leitung',
    labels: { center: 'LST', bottomRight: 'UEL' },
  });

  it('setzt die Probe des Eigentümers mittig, mit Kürzel im Kreis, schwarz auf Gelb', () => {
    const [center, corner] = labelRuns(probe);
    expect(center?.content).toBe('LST');
    expect(corner?.content).toBe('UEL');
    expect([center?.style?.fill, corner?.style?.fill]).toEqual(['schwarz', 'schwarz']);
    expectInkInsideCircle(center!, circleBody(probe));
    expectInkInsideCircle(corner!, circleBody(probe));
    // Die Tinte des mittigen Laufs endet über der des Eckenlaufs.
    const centerInk = measureTextRun(center!, ARIMO_TEXT_METRICS);
    const cornerInk = measureTextRun(corner!, ARIMO_TEXT_METRICS);
    expect(center!.y + centerInk.inkDescentMm).toBeLessThan(corner!.y - cornerInk.inkAscentMm);
    // Die Boxen überlappen nicht, wie an der Formation.
    expect(center!.boxMm.yMm + center!.boxMm.heightMm).toBeLessThanOrEqual(corner!.boxMm.yMm);
  });

  it.each([
    ['post', undefined],
    ['circle-12', undefined],
    ['circle-12', 'raised-gable'],
    ['circle-12', 'raised-circle-1mm'],
    ['circle-12', 'foot-band'],
  ] as const)('hält alle drei Ecken an %s/%s in der Kreisfläche', (kind, bodyVariant) => {
    const both = drawSymbol({
      kind, ...(bodyVariant === undefined ? {} : { bodyVariant }),
      labels: { center: 'AB', bottomLeft: 'AB', bottomRight: 'AB' },
    });
    for (const run of labelRuns(both)) expectInkInsideCircle(run, circleBody(both));
    const single = drawSymbol({
      kind, ...(bodyVariant === undefined ? {} : { bodyVariant }),
      labels: { bottomRight: 'UEL' },
    });
    for (const run of labelRuns(single)) expectInkInsideCircle(run, circleBody(single));
    expect(single.derivations).toContainEqual(expect.objectContaining({ dimension: 'labels.corner' }));
  });

  it('setzt topLeft an der Funktionsstelle innen auf die Sehne', () => {
    const drawing = drawSymbol({ kind: 'post', labels: { topLeft: 'UHS', center: 'LST' } });
    for (const run of labelRuns(drawing)) expectInkInsideCircle(run, circleBody(drawing));
  });

  it('setzt topLeft am farbigen 12-mm-Kreis ohne Metriksatz an die F.3.3-Lage, schwarz', () => {
    const drawing = drawSymbol({ kind: 'circle-12', organization: 'feuerwehr', labels: { topLeft: 'UHS' } });
    const [run] = labelRuns(drawing);
    expect(run).toMatchObject({ x: 1.015316, y: 5.000254, style: { fill: 'schwarz' } });
    // An der vermessenen Fassung ist der F.3.3-Satz eine Profillage, keine Ableitung.
    expect(drawing.derivations).toBeUndefined();
  });
});

describe('Organisation am 12-mm-Kreis und an der reduzierten Hauskontur', () => {
  it.each([undefined, ...ORGANIZATION_IDS])('füllt Kreis und Hauskontur mit %s', (organization) => {
    for (const kind of ['circle-12', 'reduced-house'] as const) {
      const drawing = drawSymbol({
        kind, ...(organization === undefined ? {} : { organization }), labels: { center: 'AB' },
      });
      const body = drawing.children.find((child) => child.role === 'body');
      const fill = body?.style?.fill;
      expect(fill === undefined || fill === 'none' || typeof fill === 'string').toBe(true);
      const [run] = labelRuns(drawing);
      const bodyFill = fill === undefined || fill === 'none' ? 'weiss' : fill;
      expect(run?.style?.fill).toBe(bodyLabelInk(bodyFill as Parameters<typeof bodyLabelInk>[0]));
    }
  });
});

describe('Varianten an der Funktionsstelle (CIRCLE_VARIANT_PAIRS)', () => {
  it.each(CIRCLE_VARIANT_PAIRS.map((pair) => [pair.kind, pair.bodyVariant] as const))(
    'führt für %s/%s Körper, Profil und eine Fläche innerhalb der 32 mm',
    (kind: SymbolKind, variant: BodyVariantId) => {
      expect(hasVariantProfile(kind, variant)).toBe(true);
      expect(profileFor(kind, variant).id).toBe('circle-body');
      const drawing = baseDrawing(kind, variant);
      for (const child of drawing.children) {
        const b = boundsOfMm(child);
        expect(b.minX).toBeGreaterThanOrEqual(0);
        expect(b.minY).toBeGreaterThanOrEqual(0.5);
        expect(b.maxX).toBeLessThanOrEqual(32);
        expect(b.maxY).toBeLessThanOrEqual(31.5);
      }
    },
  );

  it('legt das Fußband der Funktionsstelle zwischen Sehne y 26 und Innenkante 29,75', () => {
    const band = baseDrawing('post', 'foot-band').children[1];
    expect(band?.type).toBe('path');
    const b = boundsOfMm(band!);
    expect(b.minY).toBeCloseTo(26, 4);
    expect(b.maxY).toBeCloseTo(29.75, 3);
    expect(b.maxX - b.minX).toBeCloseTo(2 * Math.sqrt(13.75 ** 2 - 100), 3);
  });

  it('baut die D.2.5-Kappe als Segment zwischen Außenkante 5,75 und Sehne 10', () => {
    // Das Piktogramm `control-center` (02-locations.ts) führt dieselbe Kappe auf drei Stellen:
    // 'M 6.724 10 H 25.277 C 22.95 7.302 19.564 5.75 16 5.75 C 12.436 5.75 9.05 7.302 6.724 10 Z'.
    expect(circleSegmentPath(16, 18, 12.25, 10, 'top')).toBe(
      'M 6.723 10 H 25.277 C 22.95 7.3015 19.5633 5.75 16 5.75 C 12.4367 5.75 9.05 7.3015 6.723 10 Z',
    );
  });
});

describe('Kopfzone über dem Kreis', () => {
  const circle = (cy: number, r: number): Primitive => ({ type: 'circle', role: 'body', cx: 16, cy, r });

  it('verschiebt den 12-mm-Kreis, solange Platz bis zur Unterkante 30 ist', () => {
    expect(placeCircleUnderHead(circle(16, 12), 4, 1)).toMatchObject({ cy: 17, r: 12 });
    expect(profileFor('circle-12').place(circle(16, 12), 5)).toMatchObject({ cy: 18, r: 12 });
  });

  it('hält an der Funktionsstelle die Unterkante und verkleinert von oben', () => {
    expect(profileFor('post').place(circle(16, 14), 4)).toMatchObject({ cy: 17.5, r: 12.5 });
    expect(profileFor('post').place(circle(16, 14), null)).toEqual(circle(16, 14));
  });

  it('lässt den angehobenen Kreis nicht in seine Oberflächenläufe rutschen', () => {
    const placed = profileFor('circle-12', 'raised-circle-1mm').place(circle(15, 12), 4);
    expect(boundsOfMm(placed).maxY).toBe(27);
  });
});

describe('Vermessene Kreisfassungen bleiben ohne Ableitungsnotiz', () => {
  it.each([
    { kind: 'circle-12', organization: 'hilfsorganisation', bodyMarks: ['medical-service'],
      labels: { topLeft: 'UHS', topLeftMetrics: { capHeightMm: 2.919225, baselineFromBodyTopMm: 1.000254, anchorFromBodyLeftMm: -2.984684 } } },
    { kind: 'circle-12', bodyVariant: 'foot-band', organization: 'bundeswehr', bodyMarks: ['fuels-consumables'],
      labels: { bottomCenter: 'Diesel', belowRight: 'Bw' } },
    { kind: 'reduced-house', organization: 'hilfsorganisation', bodyMarks: ['hospital'] },
    { kind: 'post' },
  ] as const)('%j', (spec) => {
    expect(drawSymbol(spec as SymbolSpec).derivations).toBeUndefined();
  });
});
