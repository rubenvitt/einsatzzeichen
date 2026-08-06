import { describe, expect, it } from 'vitest';
import type { PictogramDefinition, Primitive } from '@einsatzzeichen/schema';
import { checkCommands } from './pictogram-gate.js';

/** Ein Piktogramm mit genau einem Pfad, Box und Titel unverändert — nur der `d`-String variiert. */
function withPath(d: string): PictogramDefinition {
  return {
    id: 'capability.fire-fighting',
    title: 'Testpiktogramm',
    box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
    primitives: [{ type: 'path', role: 'pictogram', d, style: { fill: 'schwarz', stroke: 'none' } }],
  };
}

describe('Kommando-Gate', () => {
  it('lässt die sieben zugelassenen absoluten Kommandos durch', () => {
    const issues = checkCommands(withPath('M 4 12 L 8 12 H 12 V 16 C 14 16 16 20 18 20 Q 20 20 22 16 Z'));
    expect(issues).toEqual([]);
  });

  it('lehnt ein relatives Kommando ab', () => {
    const issues = checkCommands(withPath('M 4 12 l 4 0'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.gate).toBe('command');
    expect(issues[0]?.pictogramId).toBe('capability.fire-fighting');
    expect(issues[0]?.detail).toContain('Relatives Kommando "l"');
  });

  it('lehnt A ab, weil seine Parameter keine Koordinaten sind', () => {
    // A rx ry rotation large-arc sweep x y: ein Schalter 0/1 besteht jede Box, eine Drehung 45
    // liest sich als 45 mm, und der Bogen kann weit außerhalb der geschriebenen Zahlen ausschlagen.
    const issues = checkCommands(withPath('M 4 12 A 2 2 0 0 1 8 16'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.detail).toContain('Unzulässiges Kommando "A"');
  });

  it('lehnt S ab, weil sein erster Kontrollpunkt implizit ist', () => {
    const issues = checkCommands(withPath('M 4 12 C 5 12 6 16 8 16 S 10 20 12 20'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.detail).toContain('Unzulässiges Kommando "S"');
  });

  it('lehnt T ab, aus demselben Grund wie S', () => {
    const issues = checkCommands(withPath('M 4 12 Q 6 12 8 16 T 12 16'));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.detail).toContain('Unzulässiges Kommando "T"');
  });

  it('prüft jeden Pfad einer Definition mit mehreren Primitiven', () => {
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Zwei Pfade',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [
        { type: 'path', role: 'pictogram', d: 'M 4 12 L 8 12' },
        { type: 'path', role: 'pictogram', d: 'm 4 12 l 8 0' },
      ],
    };
    // 'm' und 'l' sind zwei getrennte relative Kommandos, also zwei Befunde (siehe
    // tokenizePath('m 4 4 l 8 8') in path-commands.test.ts) — nicht einer je Pfad.
    expect(checkCommands(definition)).toHaveLength(2);
  });

  it('steigt in Gruppen ab', () => {
    const nested: Primitive = {
      type: 'group',
      children: [{ type: 'path', role: 'pictogram', d: 'M 4 12 A 2 2 0 0 1 8 16' }],
    };
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Pfad in Gruppe',
      box: { xMm: 4, yMm: 12, widthMm: 24, heightMm: 8 },
      primitives: [nested],
    };
    expect(checkCommands(definition)).toHaveLength(1);
  });

  it('meldet nichts für ein Piktogramm ohne Pfade', () => {
    const definition: PictogramDefinition = {
      id: 'capability.fire-fighting',
      title: 'Nur Linien',
      box: { xMm: 3, yMm: 9, widthMm: 23, heightMm: 14 },
      primitives: [{ type: 'line', role: 'pictogram', x1: 3, y1: 16, x2: 26, y2: 16 }],
    };
    expect(checkCommands(definition)).toEqual([]);
  });
});
