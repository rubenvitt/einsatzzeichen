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

describe('boundsOfMm — Verschiebung von Gruppen', () => {
  it('verschiebt die Hülle einer Gruppe um dxMm und dyMm', () => {
    const group: Primitive = {
      type: 'group',
      transform: { translate: { dxMm: 2, dyMm: 3 } },
      children: [{ type: 'rect', x: 1, y: 6, width: 30, height: 20 }],
    };
    expect(boundsOfMm(group)).toEqual({ minX: 3, minY: 9, maxX: 33, maxY: 29 });
  });

  it('lässt eine Gruppe aus reinen Pfaden nicht vergleichbar, auch mit Verschiebung', () => {
    // Die Nichtvergleichbarkeit wird strukturell weitergereicht: eine Verschiebung darf aus
    // "keine Ausdehnung" nicht die Zahl 3 machen, sonst verfälschte eine Piktogramm-Gruppe
    // aus Pfaden die Hülle ihrer Geschwister.
    const group: Primitive = {
      type: 'group',
      transform: { translate: { dxMm: 0, dyMm: 3 } },
      children: [{ type: 'path', d: 'M 4 4 L 8 8' }],
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
