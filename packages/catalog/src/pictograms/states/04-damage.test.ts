import { describe, expect, it } from 'vitest';
import { checkBox, checkClipping, checkCommands } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM, type Primitive } from '@einsatzzeichen/schema';
import { DAMAGE_STATES } from './04-damage.js';

const VIEWBOX_BODY: Primitive = {
  type: 'rect',
  role: 'body',
  x: 0,
  y: 0,
  width: DEFAULT_VIEWBOX_MM.width,
  height: DEFAULT_VIEWBOX_MM.height,
};

describe('5.8.4 Schadensgrade', () => {
  it('liefert die drei Abschnitte mit streng wachsender Zahl roter Diagonalen', () => {
    expect(DAMAGE_STATES.map((definition) => definition.section)).toEqual([
      '5.8.4.1',
      '5.8.4.2',
      '5.8.4.3',
    ]);
    // Referenz: je Richtung 1, 2 bzw. 3 parallele Diagonalen (X, gedrehtes Doppelkreuz, Gitter).
    expect(DAMAGE_STATES.map((definition) => definition.primitives.length)).toEqual([2, 4, 6]);
    // Mittellinienhülle: halbe Diagonale 13/√2 mm, Scharabstand 7 mm senkrecht.
    const reach = [0, 1, 2].map((step) => 13 / Math.SQRT2 + (step * 3.5) / Math.SQRT2);
    DAMAGE_STATES.forEach((definition, index) => {
      expect(definition.box.xMm).toBeCloseTo(16 - reach[index]!, 9);
      expect(definition.box.yMm).toBeCloseTo(16 - reach[index]!, 9);
      expect(definition.box.widthMm).toBeCloseTo(2 * reach[index]!, 9);
      expect(definition.box.heightMm).toBeCloseTo(2 * reach[index]!, 9);
    });
  });

  it('zeichnet jede Diagonale als 26 mm lange rote 0,5-mm-Linie unter 45°', () => {
    for (const definition of DAMAGE_STATES) {
      for (const stroke of definition.primitives) {
        if (stroke.type !== 'line') throw new Error('Diagonale muss eine Linie sein.');
        expect(stroke.role).toBe('pictogram');
        expect(stroke.style).toEqual({ fill: 'none', stroke: 'rot', strokeWidth: 0.5 });
        expect(Math.abs(stroke.x2 - stroke.x1)).toBeCloseTo(26 / Math.SQRT2, 9);
        expect(Math.abs(stroke.y2 - stroke.y1)).toBeCloseTo(26 / Math.SQRT2, 9);
      }
      expect(definition.contrastPairs).toEqual([
        {
          foreground: 'rot',
          background: 'surface',
          context: 'rote Schadensmarken auf Ausgabeoberfläche',
        },
      ]);
    }
    expect(new Set(DAMAGE_STATES.map((item) => JSON.stringify(item.primitives))).size).toBe(3);
  });

  it('besteht Kommando, exakte Box und Standalone-Clipping vor Snapshots', () => {
    for (const definition of DAMAGE_STATES) {
      expect(checkCommands(definition)).toEqual([]);
      expect(checkBox(definition)).toEqual([]);
      expect(checkClipping(definition, VIEWBOX_BODY)).toEqual([]);
    }
  });
});
