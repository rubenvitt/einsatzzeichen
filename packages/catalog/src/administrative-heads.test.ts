import { describe, expect, it } from 'vitest';
import type { AdminLevelId, Primitive } from '@einsatzzeichen/schema';
import { ADMINISTRATIVE_HEADS, administrativeHead } from './administrative-heads.js';

function leaves(primitives: readonly Primitive[]): Primitive[] {
  return primitives.flatMap((primitive) =>
    primitive.type === 'group' ? leaves(primitive.children) : [primitive]);
}

describe('administrativeHead()', () => {
  it('liefert nur die drei direkt in D.3/D.4 vermessenen Verwaltungskoepfe', () => {
    expect(Object.keys(ADMINISTRATIVE_HEADS)).toEqual([
      'kreis', 'nationalstaat', 'europaeische-union',
    ]);
    expect(administrativeHead('kreis')).toMatchObject({
      heightMm: 4, box: { xMm: 9.143, yMm: 0, widthMm: 13.714, heightMm: 4 },
    });
    expect(administrativeHead('nationalstaat')).toMatchObject({
      heightMm: 4, box: { xMm: 4.143, yMm: 0, widthMm: 23.714, heightMm: 4 },
    });
    expect(administrativeHead('europaeische-union')).toMatchObject({
      heightMm: 9, box: { xMm: 7.143, yMm: 0, widthMm: 17.714, heightMm: 9 },
    });
  });

  it('zeichnet 2, 5 und 6 Sechsstrahlsterne ausschliesslich als Kopfprimitive', () => {
    expect(administrativeHead('kreis')?.primitives).toHaveLength(6);
    expect(administrativeHead('nationalstaat')?.primitives).toHaveLength(15);
    expect(administrativeHead('europaeische-union')?.primitives).toHaveLength(18);
    for (const shape of Object.values(ADMINISTRATIVE_HEADS)) {
      expect(leaves(shape.primitives).every((primitive) => primitive.role === 'head')).toBe(true);
    }
  });

  it('lehnt die drei nicht vermessenen Stufen ohne Ableitung ab', () => {
    for (const id of ['gemeinde', 'bezirk', 'bundesland'] satisfies AdminLevelId[]) {
      expect(administrativeHead(id)).toBeUndefined();
    }
  });
});
