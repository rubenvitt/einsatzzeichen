/**
 * Körpermarken an jeder Körperform (Entscheidung vom 2. Oktober 2026): die nächstliegende
 * vermessene Fassung derselben Marke hüllenrelativ übertragen, ohne jede randbündige Fassung die
 * eingepasste Einzeldarstellung (`derive/body-marks.ts`).
 */
import type { BodyMarkId, Point, Primitive, SymbolSpec } from '@einsatzzeichen/schema';
import { DEFAULT_STROKE_WIDTH_MM } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { boundsOfMm } from '../bounds.js';
import { drawSymbol } from '../default-ports.js';
import { bodyMark as measuredBodyMark } from '../geometry/body-marks.js';
import { bodyMark, bodyMarkRenditionsAnywhere, hasFlushRendition } from './body-marks.js';
import { bodyRegion, distanceToContour } from './body-region.js';

const marksOf = (spec: SymbolSpec): Primitive[] =>
  drawSymbol(spec).children.filter((child) => child.role === 'pictogram');

const lines = (primitives: readonly Primitive[]) =>
  primitives.filter((primitive): primitive is Primitive & { type: 'line' } => primitive.type === 'line');

describe('Übertragung innerhalb der Körperfamilie', () => {
  it('zieht das Zeltdach der Formation am Container von Ecke zu Ecke', () => {
    // Formation (F.1.4): (1|26) → (16|6) → (31|26), randbündig. Container 4/4/28/28.
    const spec: SymbolSpec = { kind: 'container', bodyMarks: ['care'] };
    expect(marksOf(spec)).toEqual([
      {
        type: 'polyline',
        role: 'pictogram',
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
        points: [[4, 28], [16, 4], [28, 28]],
      },
    ]);
    expect(drawSymbol(spec).derivations).toEqual([
      { dimension: 'bodyMarks', part: 'care an container/normal', basis: 'transferred', from: 'formation/normal' },
    ]);
  });

  it('überträgt die Fachdienstteilung vom Kreis 12 auf die Stelle (r 14)', () => {
    const [vertical, horizontal] = lines(marksOf({ kind: 'post', bodyMarks: ['medical-service'] }));
    expect(vertical).toMatchObject({ x1: 16, y1: 2, x2: 16, y2: 30 });
    expect(horizontal).toMatchObject({ x1: 2, y1: 16, x2: 30, y2: 16 });
  });

  it('skaliert die 26-mm-Personenfassung gleichmäßig auf die 30-mm-Raute', () => {
    // D.3.7: Waagerechte über die volle Breite, Raute halbe Diagonale 4 mm, 9 mm rechts der Mitte.
    const [stroke, diamond] = marksOf({ kind: 'person', bodyMarks: ['fire-fighting'] });
    expect(stroke).toMatchObject({ type: 'line', x1: 1, y1: 16, x2: 31, y2: 16 });
    const k = 30 / 26;
    expect(diamond).toMatchObject({ type: 'polyline', closed: true });
    const points = (diamond as Primitive & { type: 'polyline' }).points;
    expect(points[1]![0]).toBeCloseTo(16 + 13 * k, 2);
    expect(points[3]![0]).toBeCloseTo(16 + 5 * k, 2);
  });

  it('verschiebt eine Anhängermarke mit der verschobenen Anhängerhülle', () => {
    const measured = measuredBodyMark('trailer-diving' as BodyMarkId, { kind: 'trailer' }, {
      minX: 4, minY: 5.75, maxX: 31, maxY: 26,
    });
    const shifted = bodyMark('trailer-diving' as BodyMarkId, { kind: 'trailer' }, {
      minX: 5, minY: 6.75, maxX: 32, maxY: 27,
    });
    expect(shifted).toHaveLength(measured.length);
    shifted.forEach((primitive, index) => {
      const a = boundsOfMm(measured[index] as Primitive);
      const b = boundsOfMm(primitive);
      expect(b.minX - a.minX).toBeCloseTo(1, 2);
      expect(b.minY - a.minY).toBeCloseTo(1, 2);
      expect(b.maxX - b.minX).toBeCloseTo(a.maxX - a.minX, 2);
    });
  });

  it('überträgt am Fußband bis zur Oberkante des Bands', () => {
    // Formation mit Fußband: Band 23…26, die Drehleiter vom Landfahrzeug bleibt darüber.
    for (const primitive of marksOf({ kind: 'formation', bodyVariant: 'foot-band', bodyMarks: ['rescue-aerial-ladder'] })) {
      if (primitive.type === 'rect') continue; // das Fußband selbst
      expect(boundsOfMm(primitive).maxY).toBeLessThanOrEqual(23 + 1e-6);
    }
  });
});

describe('Übertragung in eine fremde Körperfamilie', () => {
  it('setzt die Fachdienstteilung an der Gefahr von Kante zu Kante', () => {
    const spec: SymbolSpec = { kind: 'hazard', bodyMarks: ['medical-service'] };
    const [vertical, horizontal] = lines(marksOf(spec));
    // Senkrechte von der Spitze (16|3) bis zur Grundlinie y 28.
    expect(vertical).toMatchObject({ x1: 16, y1: 3, x2: 16, y2: 28 });
    // Waagerechte endet beidseits auf den Schenkeln.
    const contour = bodyRegion('hazard', undefined).polygon;
    for (const end of [[horizontal!.x1, horizontal!.y1], [horizontal!.x2, horizontal!.y2]] as Point[]) {
      expect(distanceToContour(contour, end)).toBeLessThan(0.01);
    }
    expect(drawSymbol(spec).derivations?.[0]).toMatchObject({ from: 'formation/normal', basis: 'transferred' });
  });

  it('setzt die Teilung an der Raute der Maßnahme und am Kreis auf die Kontur', () => {
    for (const kind of ['measure', 'point', 'vehicle-water', 'vehicle-air', 'spontaneous-helper'] as const) {
      const contour = bodyRegion(kind, undefined).polygon;
      for (const line of lines(marksOf({ kind, bodyMarks: ['medical-service'] }))) {
        for (const end of [[line.x1, line.y1], [line.x2, line.y2]] as Point[]) {
          expect(distanceToContour(contour, end), kind).toBeLessThan(0.01);
        }
      }
    }
  });

  it('verzerrt eine Marke ohne Kantenberührung nicht', () => {
    // Die Winde aus F.2.6 berührt die Luftrumpfkante nicht: an der Formation gleichmäßig.
    const source = measuredBodyMark('air-winch-chevron-diamond' as BodyMarkId, { kind: 'vehicle-air', bodyVariant: 'raised-hull' }, {
      minX: 1.01, minY: 6, maxX: 30.9894, maxY: 20.9898,
    });
    const target = marksOf({ kind: 'formation', bodyMarks: ['air-winch-chevron-diamond' as BodyMarkId] });
    const ratio = (primitives: readonly Primitive[]) => {
      const hulls = primitives.map(boundsOfMm);
      const minX = Math.min(...hulls.map((h) => h.minX));
      const maxX = Math.max(...hulls.map((h) => h.maxX));
      const minY = Math.min(...hulls.map((h) => h.minY));
      const maxY = Math.max(...hulls.map((h) => h.maxY));
      return (maxX - minX) / (maxY - minY);
    };
    expect(ratio(target)).toBeCloseTo(ratio(source), 2);
  });

  it('überträgt eine Zweitfassung aus Anhang C an die Formation', () => {
    const spec: SymbolSpec = {
      kind: 'formation', bodyMarks: ['rescue-aerial-ladder'],
      bodyMarkRenditions: { 'rescue-aerial-ladder': 'shifted-right-6.5mm' },
    };
    expect(bodyMarkRenditionsAnywhere('rescue-aerial-ladder')).toContain('shifted-right-6.5mm');
    expect(drawSymbol(spec).derivations).toEqual([
      {
        dimension: 'bodyMarks',
        part: 'rescue-aerial-ladder an formation/normal',
        basis: 'transferred',
        from: 'vehicle-land/normal#shifted-right-6.5mm',
      },
    ]);
  });

  it('überträgt die Kombinationsfassung F.1.12#alternative mit an den Container', () => {
    const marks: BodyMarkId[] = ['patient-transport', 'physician', 'intensive-care'];
    const ring = marksOf({ kind: 'container', bodyMarks: marks })
      .find((primitive): primitive is Primitive & { type: 'circle' } => primitive.type === 'circle');
    // F.1.12#alternative: Ring r 5 statt 5,5; am Container mit dem kleineren Faktor 24/30.
    expect(ring?.r).toBeCloseTo(5 * 0.8, 3);
  });
});

describe('Fähigkeit ohne jede randbündige Fassung', () => {
  it('zeichnet die eingepasste Einzeldarstellung wie die Boxfassung', () => {
    expect(hasFlushRendition('respiratory-protection')).toBe(false);
    const viaBodyMarks = drawSymbol({ kind: 'vehicle-land', bodyMarks: ['respiratory-protection'] });
    const viaCapabilities = drawSymbol({ kind: 'vehicle-land', capabilities: ['respiratory-protection'] });
    const flatten = (primitives: readonly Primitive[]): Primitive[] =>
      primitives.flatMap((p) => (p.type === 'group' ? flatten(p.children) : [p]));
    expect(flatten(viaBodyMarks.children.filter((c) => c.role === 'pictogram')))
      .toEqual(flatten(viaCapabilities.children.filter((c) => c.role === 'pictogram')));
    expect(viaBodyMarks.derivations?.[0]).toMatchObject({
      dimension: 'bodyMarks',
      basis: 'transferred',
      from: 'Kapitel 4, capability.respiratory-protection',
    });
  });

  it('stellt mehrere solche Marken nebeneinander', () => {
    const row: BodyMarkId[] = ['respiratory-protection', 'lighting'];
    const hull = (id: BodyMarkId) => {
      const bounds = bodyMark(id, { kind: 'formation', bodyMarks: row }, { minX: 1, minY: 6, maxX: 31, maxY: 26 })
        .map(boundsOfMm);
      return { minX: Math.min(...bounds.map((b) => b.minX)), maxX: Math.max(...bounds.map((b) => b.maxX)) };
    };
    expect(hull('respiratory-protection').maxX).toBeLessThan(hull('lighting').minX);
  });

  it('wirft für eine Fassungskennung, die für die Marke nirgends vermessen ist', () => {
    expect(() => bodyMark('fire-fighting', { kind: 'formation', rendition: 'shifted-right-6.5mm' }, {
      minX: 1, minY: 6, maxX: 31, maxY: 26,
    })).toThrow(/nicht vermessen/);
  });
});
