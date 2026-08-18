import { describe, expect, it } from 'vitest';
import type { Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm, shiftY } from './bounds.js';

const rotate = { angle: 45, cx: 16, cy: 16 };

describe('shiftY — Drehung', () => {
  it('verschiebt ein unrotiertes rect um deltaMm', () => {
    const primitive: Primitive = { type: 'rect', x: 1, y: 6, width: 30, height: 20 };
    const shifted = shiftY(primitive, 3);
    expect(shifted.type).toBe('rect');
    if (shifted.type === 'rect') expect(shifted.y).toBe(9);
  });

  it('wirft für ein gedrehtes rect, statt das Rotationszentrum zurückzulassen', () => {
    const primitive: Primitive = { type: 'rect', x: 1, y: 1, width: 30, height: 30, transform: { rotate } };
    expect(() => shiftY(primitive, 3)).toThrow(/gedrehte Primitive/);
  });

  it('wirft für einen gedrehten circle', () => {
    const primitive: Primitive = { type: 'circle', cx: 16, cy: 16, r: 10, transform: { rotate } };
    expect(() => shiftY(primitive, 3)).toThrow(/gedrehte Primitive/);
  });

  it('wirft für eine gedrehte line', () => {
    const primitive: Primitive = {
      type: 'line',
      x1: 1,
      y1: 1,
      x2: 30,
      y2: 30,
      transform: { rotate },
    };
    expect(() => shiftY(primitive, 3)).toThrow(/gedrehte Primitive/);
  });

  it('wirft für eine gedrehte polyline', () => {
    const primitive: Primitive = {
      type: 'polyline',
      points: [
        [1, 1],
        [30, 30],
      ],
      transform: { rotate },
    };
    expect(() => shiftY(primitive, 3)).toThrow(/gedrehte Primitive/);
  });
});

describe('boundsOfMm — Text', () => {
  it('gibt für Text die deklarierte Fläche zurück, nicht die Glyphenhülle', () => {
    const bounds = boundsOfMm({
      type: 'text',
      content: 'HRT',
      x: 16,
      y: 20,
      sizeMm: 10,
      anchor: 'middle',
      baseline: 'alphabetic',
      boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
    });
    expect(bounds).toEqual({ minX: 6, minY: 12, maxX: 26, maxY: 22 });
  });

  it('lehnt eine Drehung an Text ab, statt die Box unrotiert zurückzugeben', () => {
    // rawBoundsOfMm gibt boxMm unverändert zurück (siehe bounds.ts), führt also keine
    // Drehung der Boxecken durch — die Renderer drehen aber sehr wohl (transformAttr
    // wertet transform.rotate für jedes Primitiv aus). Ohne diese Ablehnung wichen
    // Hülle und Rendering für ein gedrehtes Textprimitiv still voneinander ab, derselbe
    // Fehlermodus, den boundsOfMm für gedrehte Gruppen bereits ablehnt (siehe oben).
    const primitive: Primitive = {
      type: 'text',
      content: 'HRT',
      x: 16,
      y: 20,
      sizeMm: 10,
      anchor: 'middle',
      baseline: 'alphabetic',
      boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
      transform: { rotate },
    };
    expect(() => boundsOfMm(primitive)).toThrow(/Text/);
  });
});

describe('shiftY — Text', () => {
  it('verschiebt sowohl den Ankerpunkt als auch die deklarierte Box', () => {
    // Anders als bei Pfaden liegen bei Text alle Koordinaten strukturiert vor (x, y und
    // boxMm) — beide müssen mitwandern, sonst desynchronisiert die verschobene Glyphen-
    // position von der Box, gegen die die Gates prüfen.
    const primitive: Primitive = {
      type: 'text',
      content: 'HRT',
      x: 16,
      y: 20,
      sizeMm: 10,
      anchor: 'middle',
      baseline: 'alphabetic',
      boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
    };
    const shifted = shiftY(primitive, 3);
    expect(shifted.type).toBe('text');
    if (shifted.type !== 'text') throw new Error('unreachable');
    expect(shifted.y).toBe(23);
    expect(shifted.boxMm).toEqual({ xMm: 6, yMm: 15, widthMm: 20, heightMm: 10 });
  });

  it('wirft für gedrehten Text, statt das Rotationszentrum zurückzulassen', () => {
    const primitive: Primitive = {
      type: 'text',
      content: 'HRT',
      x: 16,
      y: 20,
      sizeMm: 10,
      anchor: 'middle',
      baseline: 'alphabetic',
      boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
      transform: { rotate },
    };
    expect(() => shiftY(primitive, 3)).toThrow(/gedrehte Primitive/);
  });
});

describe('boundsOfMm — Pfade', () => {
  it('nimmt bei einer Kubik das analytische Extremum und nicht die Kontrollpunkthülle', () => {
    // Halbkreis r = 15 um (16|23) in der üblichen Zwei-Kubiken-Näherung, also die Bauform von
    // 1.4_Luftfahrzeug. Der tiefste Punkt der Kurve liegt bei y = 8; die Kontrollpunkte liegen
    // ebenfalls auf 8, der Scheitel wird also nicht durch sie, sondern durch die Nullstelle der
    // Ableitung gefunden. Waagerecht ist der Unterschied sichtbar: die Kontrollpunkthülle wäre
    // 1…31 nur zufällig richtig, geprüft wird gegen den Endpunkt.
    const bounds = boundsOfMm({
      type: 'path',
      d: 'M 31 23 L 1 23 C 1 14.7157, 7.7157 8, 16 8 C 24.2843 8, 31 14.7157, 31 23 Z',
    });
    expect(bounds.minX).toBeCloseTo(1, 10);
    expect(bounds.minY).toBeCloseTo(8, 10);
    expect(bounds.maxX).toBeCloseTo(31, 10);
    expect(bounds.maxY).toBeCloseTo(23, 10);
  });

  it('findet ein Extremum, das zwischen den Endpunkten liegt', () => {
    // Beide Endpunkte auf y = 0, beide Kontrollpunkte auf y = 12: das Maximum der Kurve liegt
    // bei t = 0,5 und damit auf 9 — genau die Zahl, die eine Kontrollpunkthülle (12) und eine
    // Endpunkthülle (0) beide verfehlen.
    const bounds = boundsOfMm({ type: 'path', d: 'M 0 0 C 4 12, 8 12, 12 0' });
    expect(bounds.maxY).toBeCloseTo(9, 10);
    expect(bounds.minY).toBeCloseTo(0, 10);
  });

  it('überführt Q verlustfrei in eine Kubik', () => {
    // Quadratische Bezierkurve mit Scheitel bei t = 0,5: (0+2·8+0)/4 = 4.
    const bounds = boundsOfMm({ type: 'path', d: 'M 0 0 Q 6 8, 12 0' });
    expect(bounds.maxY).toBeCloseTo(4, 10);
  });

  it('führt H, V und Z auf den Unterpfadanfang zurück', () => {
    const bounds = boundsOfMm({ type: 'path', d: 'M 2 3 H 10 V 9 Z' });
    expect(bounds).toEqual({ minX: 2, minY: 3, maxX: 10, maxY: 9 });
  });

  it('dreht die formdefinierenden Pfadpunkte, nicht die Ecken der unrotierten Hülle', () => {
    const bounds = boundsOfMm({
      type: 'path',
      d: 'M 0 0 L 10 0',
      transform: { rotate: { angle: 90, cx: 0, cy: 0 } },
    });
    expect(bounds.minX).toBeCloseTo(0, 10);
    expect(bounds.maxX).toBeCloseTo(0, 10);
    expect(bounds.maxY).toBeCloseTo(10, 10);
  });

  it('wirft bei nicht zerlegbaren Pfaddaten, statt eine zu kleine Hülle zu liefern', () => {
    // Ein relatives Kommando wird von tokenizePath abgelehnt; seine Zahlen fallen dabei weg.
    // Eine Hülle über den Rest wäre kleiner als die gezeichnete Form und niemandem aufgefallen.
    expect(() => boundsOfMm({ type: 'path', d: 'M 0 0 l 10 10' })).toThrow(/nicht zerlegbar/);
  });
});

describe('boundsOfMm — Verschiebung von Gruppen', () => {
  it('verschiebt die Hülle einer Gruppe um dxMm und dyMm', () => {
    const group: Primitive = {
      type: 'group',
      transform: { translate: { dxMm: 2, dyMm: 3 } },
      children: [{ type: 'rect', x: 1, y: 6, width: 30, height: 20 }],
    };
    expect(boundsOfMm(group)).toEqual({ minX: 3, minY: 9, maxX: 33, maxY: 29 });
  });

  it('verschiebt die berechnete Hülle einer Gruppe aus reinen Pfaden', () => {
    // Bis LFH-424 sicherte dieser Fall das Gegenteil zu: ein Pfad galt als "keine vergleichbare
    // Ausdehnung", und die Gruppe lieferte {0,0,0,0}. Seit die Kurvenkörper aus Kapitel 1 im
    // Katalog stehen, ist die Pfadhülle berechnet — die Verschiebung wirkt deshalb auf eine
    // Zahl und nicht mehr auf eine Nichtaussage.
    const group: Primitive = {
      type: 'group',
      transform: { translate: { dxMm: 0, dyMm: 3 } },
      children: [{ type: 'path', d: 'M 4 4 L 8 8' }],
    };
    expect(boundsOfMm(group)).toEqual({ minX: 4, minY: 7, maxX: 8, maxY: 11 });
  });

  it('lässt eine Gruppe ohne Kinder nicht vergleichbar, auch mit Verschiebung', () => {
    // Die Nichtvergleichbarkeit wird strukturell weitergereicht: eine Verschiebung darf aus
    // "keine Ausdehnung" nicht die Zahl 3 machen. Nach dem Pfadzweig ist die kinderlose Gruppe
    // der einzige verbliebene Träger dieses Falls — deshalb steht er hier weiter.
    const group: Primitive = {
      type: 'group',
      transform: { translate: { dxMm: 0, dyMm: 3 } },
      children: [{ type: 'group', children: [] }],
    };
    expect(boundsOfMm(group)).toEqual({ minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });

  it('lehnt eine Verschiebung an einem Primitiv ab, das keine Gruppe ist', () => {
    const shifted: Primitive = {
      type: 'rect',
      x: 1,
      y: 6,
      width: 30,
      height: 20,
      transform: { translate: { dxMm: 0, dyMm: 3 } },
    };
    expect(() => boundsOfMm(shifted)).toThrow(/nur an Gruppen/);
  });
});
