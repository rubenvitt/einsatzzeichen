import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, TOLERANCE_UNITS, unitsToMm, type Drawing } from '@einsatzzeichen/schema';
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

  it('rotiert einen Kreis um seinen Mittelpunkt ohne die Hülle aufzublähen', () => {
    // Vorher wurden die Ecken der unrotierten Hülle gedreht: Halbbreite 14,14 statt 10 bei r=10.
    const bounds = boundsOfMm({
      type: 'circle',
      cx: 16,
      cy: 16,
      r: 10,
      transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
    });
    expect(bounds).toEqual({ minX: 6, minY: 6, maxX: 26, maxY: 26 });
  });

  it('rotiert die Endpunkte einer Linie statt ihrer Hüllenecken', () => {
    // Die unrotierte Hülle einer Diagonale (0,0)-(10,10) hat die Ecken (10,0) und (0,10), die
    // gar nicht auf der Linie liegen. Werden die gedreht statt der echten Endpunkte, ergibt
    // sich ein viel zu breites Ergebnis (minX/maxX ±7,07 statt exakt 0).
    const bounds = boundsOfMm({
      type: 'line',
      x1: 0,
      y1: 0,
      x2: 10,
      y2: 10,
      transform: { rotate: { angle: 45, cx: 0, cy: 0 } },
    });
    expect(bounds.minX).toBeCloseTo(0, 3);
    expect(bounds.maxX).toBeCloseTo(0, 3);
    expect(bounds.minY).toBeCloseTo(0, 3);
    expect(bounds.maxY).toBeCloseTo(14.1421, 3);
  });

  it('rotiert alle Punkte eines Polyzugs statt der Hüllenecken', () => {
    // Die unrotierte Hülle von (0,0)/(10,0)/(0,10) hat die Ecke (10,10), die kein Punkt des
    // Polyzugs ist. Gedreht ergäbe das maxY≈14,14 statt der korrekten 7,07.
    const bounds = boundsOfMm({
      type: 'polyline',
      points: [
        [0, 0],
        [10, 0],
        [0, 10],
      ],
      transform: { rotate: { angle: 45, cx: 0, cy: 0 } },
    });
    expect(bounds.minX).toBeCloseTo(-7.0711, 3);
    expect(bounds.maxX).toBeCloseTo(7.0711, 3);
    expect(bounds.minY).toBeCloseTo(0, 3);
    expect(bounds.maxY).toBeCloseTo(7.0711, 3);
  });

  it('lehnt eine gedrehte Gruppe ab, statt ihre Hülle näherungsweise zu berechnen', () => {
    expect(() =>
      boundsOfMm({
        type: 'group',
        transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
        children: [{ type: 'rect', x: 1, y: 6, width: 30, height: 20 }],
      }),
    ).toThrow(/Drehung von Gruppen/);
  });

  it('lässt Kinder ohne eigene Ausdehnung die Hülle ihrer Geschwister nicht verfälschen', () => {
    // Zwei unabhängige Wege zu "keine Ausdehnung": eine leere Gruppe und ein Pfad. Beide
    // liefern strukturell (nicht anhand von Zahlenwerten) `undefined` und werden vor dem
    // Zusammenführen herausgefiltert — sonst ginge der Phantompunkt (0,0,0,0) über Math.min/
    // Math.max in die Geschwister-Hülle ein und minX/minY würden fälschlich 0.
    const bounds = boundsOfMm({
      type: 'group',
      children: [
        { type: 'group', children: [] },
        { type: 'path', d: 'M0 0 L1 1' },
        { type: 'rect', x: 5, y: 5, width: 10, height: 10 },
      ],
    });
    expect(bounds).toEqual({ minX: 5, minY: 5, maxX: 15, maxY: 15 });
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

  it('vergleicht in SVG-Einheiten statt in Millimetern', () => {
    // Die Einheiten-Toleranz (0,01 Einheiten) entspricht rund 0,003528 mm. Eine Abweichung
    // knapp darüber, aber deutlich unter 0,01 mm, bestünde einen (falschen) Vergleich in
    // Millimetern und muss trotzdem im (richtigen) Vergleich in Einheiten scheitern.
    const toleranceMm = unitsToMm(TOLERANCE_UNITS);
    const deltaMm = toleranceMm + 0.002;
    expect(deltaMm).toBeLessThan(0.01);
    expect(deltaMm).toBeGreaterThan(toleranceMm);

    const result = matchFingerprint(formation, {
      asset: 'x.svg',
      shapes: [ring(1, 6, 31 + deltaMm, 26)],
    });
    expect(result.ok).toBe(false);
  });
});
