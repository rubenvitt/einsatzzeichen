import { describe, expect, it } from 'vitest';
import type { Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import {
  affineBetween,
  fitIntoRoleBody,
  fitRunsVertically,
  mapPrimitive,
  roleBodyShape,
} from './function-role-fit.js';

const DIAMOND: Primitive = {
  type: 'rect', role: 'body', x: 16 - 13 / Math.SQRT2, y: 16 - 13 / Math.SQRT2,
  width: 13 * Math.SQRT2, height: 13 * Math.SQRT2,
  transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
};

describe('Umrechnung der Funktionsfassung', () => {
  it('legt eine Hülle mittig und seitentreu auf eine andere', () => {
    expect(affineBetween(
      { minX: 3, minY: 3, maxX: 29, maxY: 29 },
      { minX: 3, minY: 5, maxX: 29, maxY: 31 },
    )).toEqual({ scale: 1, dxMm: 0, dyMm: 2 });
    expect(affineBetween(
      { minX: 0, minY: 0, maxX: 10, maxY: 10 },
      { minX: 0, minY: 0, maxX: 5, maxY: 5 },
    )).toEqual({ scale: 0.5, dxMm: 0, dyMm: 0 });
  });

  it('rechnet Pfade je Kommando und Gruppenverschiebungen mit', () => {
    const path: Primitive = { type: 'path', d: 'M 0 0 H 10 V 10 C 1 2, 3 4, 5 6 Z' };
    expect(mapPrimitive(path, { scale: 2, dxMm: 1, dyMm: 0 })).toEqual({
      type: 'path', d: 'M 1 0 H 21 V 20 C 3 4 7 8 11 12 Z',
    });
    const group: Primitive = {
      type: 'group', transform: { translate: { dxMm: 0, dyMm: 3 } },
      children: [{ type: 'circle', cx: 1, cy: 1, r: 1 }],
    };
    expect(mapPrimitive(group, { scale: 2, dxMm: 0, dyMm: 0 })).toEqual({
      type: 'group', children: [{ type: 'circle', cx: 2, cy: 8, r: 2 }],
    });
  });

  it('erkennt die gedrehte Personraute', () => {
    expect(roleBodyShape(DIAMOND)).toMatchObject({ kind: 'diamond', cx: 16, cy: 16 });
  });
});

describe('Einpassen in den freien Bereich', () => {
  it('lässt freie Teile unverändert', () => {
    const part: Primitive = { type: 'circle', cx: 16, cy: 24, r: 1 };
    expect(fitIntoRoleBody([part], DIAMOND, [{ minX: 9, minY: 13, maxX: 23, maxY: 19 }]))
      .toEqual({ primitives: [part], moved: false });
  });

  it('verkleinert ein überdeckendes Teil in die Raute, ohne die Belegung zu treffen', () => {
    const part: Primitive = { type: 'rect', x: 6, y: 10, width: 20, height: 12 };
    const run = { minX: 9, minY: 13, maxX: 23, maxY: 19 };
    const fitted = fitIntoRoleBody([part], DIAMOND, [run]);
    expect(fitted.moved).toBe(true);
    const box = boundsOfMm(fitted.primitives[0]!);
    expect(box.maxY <= run.minY || box.minY >= run.maxY || box.maxX <= run.minX || box.minX >= run.maxX)
      .toBe(true);
    for (const [x, y] of [[box.minX, box.minY], [box.maxX, box.minY], [box.minX, box.maxY], [box.maxX, box.maxY]]) {
      expect(Math.abs(x! - 16) + Math.abs(y! - 16)).toBeLessThanOrEqual(13);
    }
  });

  it('schiebt Läufe erst und verkleinert sie nur, wenn der Platz nicht reicht', () => {
    const run = {
      content: 'X', anchorXMm: 16, baselineYMm: 24, sizeMm: 4, anchor: 'middle' as const,
      boxMm: { xMm: 10, yMm: 20, widthMm: 12, heightMm: 5 }, minRenderPx: 37,
      ink: 'schwarz' as const, contrastBackground: 'body' as const,
    };
    const shifted = fitRunsVertically([run], 9, 23);
    expect(shifted.runs[0]!.boxMm).toEqual({ xMm: 10, yMm: 18, widthMm: 12, heightMm: 5 });
    const scaled = fitRunsVertically([run], 20, 22.5);
    expect(scaled.runs[0]!.sizeMm).toBeCloseTo(2, 6);
    expect(scaled.runs[0]!.boxMm.yMm).toBeCloseTo(20, 6);
  });
});
