import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import { boundsOfMm } from './bounds.js';
import { matchFingerprint } from './fingerprint.js';

const formation: Drawing = {
  viewBox: DEFAULT_VIEWBOX_MM,
  children: [
    { type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20, style: { stroke: 'schwarz' } },
  ],
};

describe('boundsOfMm', () => {
  it('liefert die Hülle eines Rechtecks', () => {
    expect(boundsOfMm({ type: 'rect', x: 1, y: 6, width: 30, height: 20 })).toEqual({
      minX: 1,
      minY: 6,
      maxX: 31,
      maxY: 26,
    });
  });

  it('liefert die Hülle eines Kreises', () => {
    expect(boundsOfMm({ type: 'circle', cx: 16, cy: 16, r: 14 })).toEqual({
      minX: 2,
      minY: 2,
      maxX: 30,
      maxY: 30,
    });
  });

  it('berücksichtigt eine Drehung um den Mittelpunkt', () => {
    const bounds = boundsOfMm({
      type: 'rect',
      x: 16 - 10.6066,
      y: 16 - 10.6066,
      width: 21.2132,
      height: 21.2132,
      transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
    });
    expect(bounds.minX).toBeCloseTo(1, 3);
    expect(bounds.maxX).toBeCloseTo(31, 3);
  });
});

const ring = (minXMm: number, minYMm: number, maxXMm: number, maxYMm: number) => ({
  kind: 'ring',
  boundsMm: { minXMm, minYMm, maxXMm, maxYMm },
});

describe('matchFingerprint', () => {
  it('bestätigt eine übereinstimmende Körpergeometrie', () => {
    const result = matchFingerprint(formation, {
      asset: '1.1_Taktische Formation.svg',
      shapes: [ring(1, 6, 31, 26)],
    });
    expect(result).toEqual({ ok: true, problems: [] });
  });

  it('toleriert das Exportrauschen der Referenz', () => {
    const result = matchFingerprint(formation, {
      asset: 'x.svg',
      shapes: [ring(0.9997, 6.0003, 31, 26)],
    });
    expect(result.ok).toBe(true);
  });

  it('meldet eine Abweichung oberhalb der Toleranz mit Zahlen', () => {
    const result = matchFingerprint(formation, { asset: 'x.svg', shapes: [ring(2, 6, 31, 26)] });
    expect(result.ok).toBe(false);
    expect(result.problems[0]).toContain('minX');
    expect(result.problems[0]).toContain('2');
  });

  it('bevorzugt die Mittellinie vor der Außenkante', () => {
    const result = matchFingerprint(formation, {
      asset: 'x.svg',
      shapes: [
        { kind: 'outline', boundsMm: { minXMm: 0.75, minYMm: 5.75, maxXMm: 31.25, maxYMm: 26.25 } },
        ring(1, 6, 31, 26),
      ],
    });
    expect(result.ok).toBe(true);
  });

  it('meldet, wenn kein Primitiv mit der Rolle body vorhanden ist', () => {
    const result = matchFingerprint(
      { viewBox: DEFAULT_VIEWBOX_MM, children: [] },
      { asset: 'x.svg', shapes: [ring(1, 6, 31, 26)] },
    );
    expect(result.ok).toBe(false);
    expect(result.problems[0]).toContain('body');
  });
});
