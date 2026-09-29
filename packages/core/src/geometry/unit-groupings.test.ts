import { describe, expect, it } from 'vitest';
import type { Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { technicalHeadMark } from './technical-head-marks.js';
import {
  UNIT_GROUPING_HEADS,
  UNIT_GROUPING_III_PROPOSAL_CX_MM,
  unitGroupingHead,
} from './unit-groupings.js';

/**
 * Gate der Verbandsmarken aus Kapitel 5.5 (LFH-577). Die Zahlen sind an den Referenzdateien
 * abgelesen (Stand 29.09.2026); der Kommentar in `unit-groupings.ts` nennt Datei und Wert.
 */

function bars(primitives: readonly Primitive[]): { x: number; y: number; w: number; h: number }[] {
  return primitives.map((primitive) => {
    const bounds = boundsOfMm(primitive);
    return {
      x: bounds.minX,
      y: bounds.minY,
      w: bounds.maxX - bounds.minX,
      h: bounds.maxY - bounds.minY,
    };
  });
}

describe('Verband am Körper', () => {
  it('Verband I: ein Balken 1,5 × 4 mm auf der Mittelachse x 16', () => {
    const head = unitGroupingHead('verband-i');
    expect(head).toBeDefined();
    expect(head!.heightMm).toBe(4);
    expect(bars(head!.primitives)).toEqual([{ x: 15.25, y: 0, w: 1.5, h: 4 }]);
  });

  it('Verband II: zwei Balken 1,5 × 4 mm mit den Mittelachsen x 12 und 20', () => {
    const head = unitGroupingHead('verband-ii');
    expect(head).toBeDefined();
    expect(head!.heightMm).toBe(4);
    expect(bars(head!.primitives)).toEqual([
      { x: 11.25, y: 0, w: 1.5, h: 4 },
      { x: 19.25, y: 0, w: 1.5, h: 4 },
    ]);
  });

  it('zeichnet schwarz gefüllte Rechtecke der Rolle head ohne Kontur', () => {
    for (const id of ['verband-i', 'verband-ii'] as const) {
      for (const primitive of unitGroupingHead(id)!.primitives) {
        expect(primitive.type, id).toBe('rect');
        expect(primitive.role, id).toBe('head');
        expect(primitive.style, id).toEqual({ fill: 'schwarz', stroke: 'none' });
      }
    }
  });

  it('ist dieselbe Zeichnung wie die technischen Kopfmarken an I.1.4 und E.1.31', () => {
    // Belegt an denselben Referenzdateien: der Balken von I.1.4/F.1.13/F.1.21 und die zwei Balken
    // von E.1.31/F.1.1/F.1.3. Weicht eine Seite ab, ist eine der beiden Messungen falsch.
    expect(unitGroupingHead('verband-i')).toEqual(technicalHeadMark('single-vertical-bar'));
    expect(unitGroupingHead('verband-ii')).toEqual(technicalHeadMark('double-vertical-bar'));
  });

  it('führt Verband III nicht als Geometrie: kein Original zeigt ihn am Körper', () => {
    expect(unitGroupingHead('verband-iii')).toBeUndefined();
    expect(Object.keys(UNIT_GROUPING_HEADS).sort()).toEqual(['verband-i', 'verband-ii']);
  });

  it('schlägt für Verband III die Vereinigung von I und II vor, wie 5.4.4 = 5.4.1 ∪ 5.4.3', () => {
    const union = [
      ...unitGroupingHead('verband-i')!.primitives,
      ...unitGroupingHead('verband-ii')!.primitives,
    ]
      .map((primitive) => {
        const bounds = boundsOfMm(primitive);
        return (bounds.minX + bounds.maxX) / 2;
      })
      .sort((a, b) => a - b);
    expect(UNIT_GROUPING_III_PROPOSAL_CX_MM).toEqual(union);
    expect(UNIT_GROUPING_III_PROPOSAL_CX_MM).toEqual([12, 16, 20]);
  });

  it('ist eingefroren', () => {
    expect(Object.isFrozen(UNIT_GROUPING_HEADS)).toBe(true);
    expect(Object.isFrozen(UNIT_GROUPING_HEADS['verband-i'])).toBe(true);
    expect(Object.isFrozen(UNIT_GROUPING_III_PROPOSAL_CX_MM)).toBe(true);
  });
});
