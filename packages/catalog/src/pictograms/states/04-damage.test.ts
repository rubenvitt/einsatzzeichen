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
  it('liefert die drei Abschnitte mit streng wachsender Schadensmarkenzahl', () => {
    expect(DAMAGE_STATES.map((definition) => definition.section)).toEqual([
      '5.8.4.1',
      '5.8.4.2',
      '5.8.4.3',
    ]);
    expect(DAMAGE_STATES.map((definition) => definition.primitives.length)).toEqual([1, 3, 5]);
    expect(DAMAGE_STATES.map((definition) => definition.box)).toEqual([
      { xMm: 9, yMm: 9, widthMm: 14, heightMm: 14 },
      { xMm: 6, yMm: 6, widthMm: 20, heightMm: 20 },
      { xMm: 4, yMm: 5, widthMm: 24, heightMm: 19 },
    ]);
  });

  it('kodiert jede Schadensmarke als eigenes rotes X statt als Farbwechsel', () => {
    for (const definition of DAMAGE_STATES) {
      for (const mark of definition.primitives) {
        if (mark.type !== 'group') throw new Error('Schadensmarke muss eine Gruppe sein.');
        expect(mark.role).toBe('pictogram');
        expect(mark.children).toHaveLength(2);
        for (const stroke of mark.children) {
          if (stroke.type !== 'line') throw new Error('X-Schenkel muss eine Linie sein.');
          expect(stroke.role).toBe('pictogram');
          expect(stroke.style).toEqual({ fill: 'none', stroke: 'rot', strokeWidth: 1.5 });
        }
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
