import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEWBOX_MM,
  TOLERANCE_UNITS,
  mmToUnits,
  unitsToMm,
  type Drawing,
  type Primitive,
} from '@einsatzzeichen/schema';
import { boundsOfMm, strokeBoundsOfMm } from './bounds.js';
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
    // "Keine Ausdehnung" trägt seit dem Pfadzweig (LFH-424) nur noch die kinderlose Gruppe: sie
    // liefert strukturell (nicht anhand von Zahlenwerten) `undefined` und wird vor dem
    // Zusammenführen herausgefiltert — sonst ginge der Phantompunkt (0,0,0,0) über Math.min/
    // Math.max in die Geschwister-Hülle ein und minX/minY würden fälschlich 0.
    const bounds = boundsOfMm({
      type: 'group',
      children: [
        { type: 'group', children: [] },
        { type: 'rect', x: 5, y: 5, width: 10, height: 10 },
      ],
    });
    expect(bounds).toEqual({ minX: 5, minY: 5, maxX: 15, maxY: 15 });
  });

  it('führt einen Pfad unter Geschwistern mit seiner berechneten Hülle zusammen', () => {
    // Die Gegenprobe zur Zeile darüber: der Pfad ist jetzt vergleichbar und **soll** die Hülle
    // seiner Geschwister erweitern. Vor LFH-424 wäre das Ergebnis 5/5/15/15 gewesen.
    const bounds = boundsOfMm({
      type: 'group',
      children: [
        { type: 'path', d: 'M 0 0 L 1 1' },
        { type: 'rect', x: 5, y: 5, width: 10, height: 10 },
      ],
    });
    expect(bounds).toEqual({ minX: 0, minY: 0, maxX: 15, maxY: 15 });
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

  it('meldet, wenn die Hülle des body-Primitivs nicht bestimmbar ist, statt zu werfen', () => {
    // boundsOfMm lehnt eine gedrehte Gruppe per throw ab (siehe boundsOfMm-Tests oben).
    // matchFingerprint muss das in einen Befund übersetzen statt die Ausnahme durchzulassen —
    // sonst reißt ein einzelner nicht vergleichbarer Katalogeintrag den ganzen Testlauf ab.
    const rotatedGroupBody: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          role: 'body',
          transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
          children: [{ type: 'rect', x: 1, y: 6, width: 30, height: 20 }],
        },
      ],
    };
    const fingerprint = { asset: 'x.svg', shapes: [ring(1, 6, 31, 26)] };

    expect(() => matchFingerprint(rotatedGroupBody, fingerprint)).not.toThrow();

    const result = matchFingerprint(rotatedGroupBody, fingerprint);
    expect(result.ok).toBe(false);
    expect(result.problems[0]).toContain('Hülle');
    expect(result.problems[0]).toContain('body');
  });

  it('vergleicht ein Textprimitiv als body gegen seine deklarierte Box', () => {
    // matchFingerprint kennt keinen Textbegriff — findBody() greift ohnehin nur `role: 'body'`
    // ab (siehe Task-3-Bericht: fingerprint.ts verzweigt nur auf 'group' vs. Blatt und ist damit
    // unverändert korrekt). Was hier tatsächlich getestet wird, ist boundsOfMm über den Umweg
    // von matchFingerprint: erst mit der Textbehandlung in Schritt 4 liefert boundsOfMm die
    // deklarierte Box statt der leeren Hülle, und der Vergleich geht auf. Text als body ist
    // fachlich kein vorgesehener Fall (siehe pictogram-gate.ts) — dieser Test prüft den
    // Mechanismus, nicht eine reale Katalogkonfiguration.
    const textBody: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'text',
          role: 'body',
          content: 'HRT',
          x: 16,
          y: 20,
          sizeMm: 10,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 10 },
        },
      ],
    };
    const result = matchFingerprint(textBody, {
      asset: 'x.svg',
      shapes: [ring(6, 12, 26, 22)],
    });
    expect(result).toEqual({ ok: true, problems: [] });
  });
});

describe('strokeBoundsOfMm — Strichfläche eines Polyzugs', () => {
  const ereignis: Primitive = {
    type: 'polyline',
    role: 'body',
    closed: false,
    points: [
      [4, 7],
      [16, 25],
      [28, 7],
    ],
    style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
  };

  it('trifft die Strichhülle von 1.13 Ereignis auf 0,003 Einheiten', () => {
    // Erwartungswert aus dem eingecheckten Kennwertartefakt (1.13_Ereignis.svg, kind "bounds"),
    // nicht aus einer von Hand getippten Zahl.
    const bounds = strokeBoundsOfMm(ereignis);
    for (const [key, expected] of [
      ['minX', 3.792],
      ['minY', 6.862],
      ['maxX', 28.207],
      ['maxY', 25.451],
    ] as const) {
      const differenceUnits = Math.abs(mmToUnits(bounds[key]) - mmToUnits(expected));
      expect(differenceUnits, `${key}: ${bounds[key]} mm gegen ${expected} mm`).toBeLessThan(
        TOLERANCE_UNITS,
      );
    }
  });

  it('trifft die Strichhülle des geschlossenen Polyzugs 1.7 Gebäude', () => {
    const bounds = strokeBoundsOfMm({
      type: 'polyline',
      role: 'body',
      closed: true,
      points: [
        [16, 3],
        [1, 10],
        [1, 26],
        [31, 26],
        [31, 10],
      ],
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
    });
    for (const [key, expected] of [
      ['minX', 0.75],
      ['minY', 2.724],
      ['maxX', 31.25],
      ['maxY', 26.25],
    ] as const) {
      const differenceUnits = Math.abs(mmToUnits(bounds[key]) - mmToUnits(expected));
      expect(differenceUnits, `${key}: ${bounds[key]} mm gegen ${expected} mm`).toBeLessThan(
        TOLERANCE_UNITS,
      );
    }
  });

  it('unterscheidet den offenen vom geschlossenen Polyzug', () => {
    // Die Mittellinienhüllen sind identisch — genau deshalb hielt die Notiz vom 5. August fest,
    // kein Gate könne den Unterschied fangen. Für die Strichfläche gilt das nicht: die
    // Schlusskante bringt zwei weitere Gehrungen und verschiebt drei der vier Kanten.
    const open = strokeBoundsOfMm(ereignis);
    const closed = strokeBoundsOfMm({ ...ereignis, closed: true });
    expect(boundsOfMm(ereignis)).toEqual(boundsOfMm({ ...ereignis, closed: true }));
    expect(Math.abs(mmToUnits(open.minX) - mmToUnits(closed.minX))).toBeGreaterThan(0.7);
    expect(Math.abs(mmToUnits(open.maxX) - mmToUnits(closed.maxX))).toBeGreaterThan(0.7);
  });

  it('lehnt jede Primitivart ab, für die die Strichfläche nicht vermessen ist', () => {
    expect(() => strokeBoundsOfMm({ type: 'rect', x: 1, y: 6, width: 30, height: 20 })).toThrow(
      /nur für Polyzüge vermessen/,
    );
  });

  it('hält den Gegenfall 1.10 Maßnahme als Negativbefund fest', () => {
    // Der Grund, warum diese Funktion nicht pauschal über die Formklasse "outline" laufen darf:
    // 1.10 ist derselbe Polyzugtyp, die Referenz zeichnet ihn aber mit Fase und 1,0 mm Strich.
    // Mit Gehrung bei 0,5 mm liegt minY um mehr als 0,7 Einheiten neben dem Kennwert
    // 0,571/3,5/31,428/29,257.
    const bounds = strokeBoundsOfMm({
      type: 'polyline',
      role: 'body',
      closed: true,
      points: [
        [1, 4],
        [16, 29],
        [31, 4],
      ],
      style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
    });
    expect(Math.abs(mmToUnits(bounds.minY) - mmToUnits(3.5))).toBeGreaterThan(0.7);
  });
});

describe('matchFingerprint — bodyGeometry', () => {
  const ereignis: Drawing = {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [
      {
        type: 'polyline',
        role: 'body',
        closed: false,
        points: [
          [4, 7],
          [16, 25],
          [28, 7],
        ],
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
      },
    ],
  };
  const strichkennwert = {
    asset: '1.13_Ereignis.svg',
    shapes: [
      { kind: 'bounds', boundsMm: { minXMm: 3.792, minYMm: 6.862, maxXMm: 28.207, maxYMm: 25.451 } },
    ],
  };

  it('scheitert an allen vier Kanten, wenn die Mittellinie gegen einen Strichkennwert steht', () => {
    const result = matchFingerprint(ereignis, strichkennwert);
    expect(result.ok).toBe(false);
    expect(result.problems).toHaveLength(4);
  });

  it('besteht mit bodyGeometry "stroke-outline"', () => {
    const result = matchFingerprint(ereignis, strichkennwert, { bodyGeometry: 'stroke-outline' });
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('meldet den geschlossenen Polyzug gegen denselben Kennwert als Befund', () => {
    const closed: Drawing = {
      ...ereignis,
      children: ereignis.children.map((child) =>
        child.type === 'polyline' ? { ...child, closed: true } : child,
      ),
    };
    const result = matchFingerprint(closed, strichkennwert, { bodyGeometry: 'stroke-outline' });
    expect(result.ok).toBe(false);
  });
});
