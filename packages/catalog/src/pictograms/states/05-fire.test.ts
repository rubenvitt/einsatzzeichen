import { describe, expect, it } from 'vitest';
import { checkBox, checkClipping, checkCommands } from '@einsatzzeichen/core';
import { DEFAULT_VIEWBOX_MM, type Primitive } from '@einsatzzeichen/schema';
import { FIRE_STATES } from './05-fire.js';

const VIEWBOX_BODY: Primitive = {
  type: 'rect',
  role: 'body',
  x: 0,
  y: 0,
  width: DEFAULT_VIEWBOX_MM.width,
  height: DEFAULT_VIEWBOX_MM.height,
};

describe('5.8.5 Brandphasen', () => {
  it('steigert Flammenzahl und belegte Breite gemeinsam', () => {
    expect(FIRE_STATES.map((definition) => definition.primitives.length)).toEqual([1, 2, 3]);
    expect(FIRE_STATES.map((definition) => definition.box.widthMm)).toEqual([8, 22, 26]);
    expect(FIRE_STATES.map((definition) => definition.section)).toEqual([
      '5.8.5.1',
      '5.8.5.2',
      '5.8.5.3',
    ]);
  });

  it('verwendet geschlossene rote Flammenkonturen mit sichtbarer Schrägkante', () => {
    for (const definition of FIRE_STATES) {
      for (const flame of definition.primitives) {
        if (flame.type !== 'polyline') throw new Error('Flamme muss eine Polylinie sein.');
        expect(flame.closed).toBe(true);
        expect(flame.points).toHaveLength(3);
        expect(flame.role).toBe('pictogram');
        expect(flame.style).toEqual({ fill: 'none', stroke: 'rot', strokeWidth: 1.3 });
      }
      expect(definition.contrastPairs).toEqual([
        {
          foreground: 'rot',
          background: 'surface',
          context: 'rote Flammenkontur auf Ausgabeoberfläche',
        },
      ]);
    }
    expect(new Set(FIRE_STATES.map((item) => JSON.stringify(item.primitives))).size).toBe(3);
  });

  it('besteht Kommando, exakte Box und Standalone-Clipping vor Snapshots', () => {
    for (const definition of FIRE_STATES) {
      expect(checkCommands(definition)).toEqual([]);
      expect(checkBox(definition)).toEqual([]);
      expect(checkClipping(definition, VIEWBOX_BODY)).toEqual([]);
    }
  });
});
