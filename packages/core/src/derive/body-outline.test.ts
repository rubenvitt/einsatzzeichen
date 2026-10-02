import { describe, expect, it } from 'vitest';
import { innerSpanMm, outerSpanMm, outlineSegments } from './body-outline.js';

describe('Körperumriss: Breite im Streifen', () => {
  const rect = outlineSegments({ type: 'rect', x: 1, y: 6, width: 30, height: 20 });
  const diamond = outlineSegments({
    type: 'rect', x: 16 - 15 / Math.SQRT2, y: 16 - 15 / Math.SQRT2,
    width: 30 / Math.SQRT2, height: 30 / Math.SQRT2,
    transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
  });
  const hook = outlineSegments({ type: 'polyline', points: [[4, 7], [16, 25], [28, 7]] });

  it('liest am Rechteck die volle Breite, auch auf der Kante', () => {
    expect(innerSpanMm(rect, 6, 10)).toEqual({ minX: 1, maxX: 31 });
    expect(innerSpanMm(rect, 2, 10)).toBeUndefined();
  });

  it('nimmt an der Raute die engste Zeile des Streifens', () => {
    const span = innerSpanMm(diamond, 9, 12);
    expect(span?.minX).toBeCloseTo(8, 6);
    expect(span?.maxX).toBeCloseTo(24, 6);
  });

  it('liest am offenen Haken die Strecke zwischen den Schenkeln', () => {
    const span = innerSpanMm(hook, 10, 13);
    expect(span?.minX).toBeCloseTo(4 + (13 - 7) * (12 / 18), 6);
    expect(span?.maxX).toBeCloseTo(28 - (13 - 7) * (12 / 18), 6);
  });

  it('führt die äußerste Ausdehnung, wenn ein Lauf neben dem Körper stehen soll', () => {
    const span = outerSpanMm(diamond, 0, 4);
    expect(span?.minX).toBeCloseTo(13, 6);
    expect(span?.maxX).toBeCloseTo(19, 6);
    expect(outerSpanMm(rect, 27, 31)).toBeUndefined();
  });

  it('zerlegt Kubiken und Kreise in Sehnen nahe der Kurve', () => {
    const circle = outlineSegments({ type: 'circle', cx: 16, cy: 16, r: 12 });
    const span = innerSpanMm(circle, 15.99, 16.01);
    expect(span?.minX).toBeCloseTo(4, 1);
    expect(span?.maxX).toBeCloseTo(28, 1);
    // Halbkreis des Wasserrumpfs (`halfCircleBelowChord`): bei 5 mm Tiefe 14,14 mm Halbbreite.
    const bowl = outlineSegments({
      type: 'path',
      d: 'M 1 9 C 1 17.284 7.716 24 16 24 C 24.284 24 31 17.284 31 9 Z',
    });
    const bowlSpan = innerSpanMm(bowl, 13.99, 14.01);
    expect(bowlSpan?.minX).toBeCloseTo(16 - Math.sqrt(15 ** 2 - 5 ** 2), 1);
  });
});
