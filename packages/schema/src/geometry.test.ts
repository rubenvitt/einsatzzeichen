import { describe, expect, it } from 'vitest';
import {
  DEFAULT_STROKE_WIDTH_MM,
  DEFAULT_VIEWBOX_MM,
  PALETTE,
  type Drawing,
} from './geometry.js';

describe('geometry', () => {
  it('enthält alle in der Referenz vorkommenden Farben', () => {
    expect(PALETTE).toEqual({
      schwarz: '#000000',
      weiss: '#ffffff',
      rot: '#fa1919',
      blau: '#003296',
      gelb: '#fafa00',
      gruen: '#14a01e',
      hellgruen: '#64dc32',
      orange: '#fa8c00',
      braun: '#b4783c',
      grau: '#787878',
      hellgrau: '#bebebe',
      hellblau: '#3264fa',
    });
  });

  it('nutzt 0,5 mm Strichstärke und 32 mm Grundfläche als Vorgabe', () => {
    expect(DEFAULT_STROKE_WIDTH_MM).toBe(0.5);
    expect(DEFAULT_VIEWBOX_MM).toEqual({ width: 32, height: 32 });
  });

  it('beschreibt die Taktische Formation als Drawing', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'rect',
          role: 'body',
          x: 1,
          y: 6,
          width: 30,
          height: 20,
          style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
        },
      ],
    };
    expect(drawing.children).toHaveLength(1);
    expect(drawing.children[0]?.style?.strokeWidth).toBe(DEFAULT_STROKE_WIDTH_MM);
  });

  it('erlaubt ein gedrehtes Quadrat für die Person', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'rect',
          role: 'body',
          x: 16 - 10.6066,
          y: 16 - 10.6066,
          width: 21.2132,
          height: 21.2132,
          transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
          style: { fill: 'weiss', stroke: 'schwarz' },
        },
      ],
    };
    const first = drawing.children[0];
    expect(first?.transform?.rotate?.angle).toBe(45);
    expect(first?.transform?.rotate?.cx).toBe(DEFAULT_VIEWBOX_MM.width / 2);
  });
});
