import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, unitsToMm, type Drawing, type Primitive } from '@einsatzzeichen/schema';
import { checkViewBox } from './viewbox-gate.js';

function drawing(...children: Primitive[]): Drawing {
  return { viewBox: DEFAULT_VIEWBOX_MM, children };
}

describe('viewBox-Gate', () => {
  it('akzeptiert eine sichtbare Formation innerhalb der kanonischen viewBox', () => {
    expect(
      checkViewBox(
        drawing({
          type: 'rect',
          x: 1,
          y: 6,
          width: 30,
          height: 20,
          style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
        }),
      ),
    ).toEqual([]);
  });

  it('meldet nichtpositive und nichtendliche viewBox-Maße gemeinsam', () => {
    const issues = checkViewBox({ viewBox: { width: 0, height: Number.NaN }, children: [] });
    expect(issues.map((issue) => issue.rule)).toEqual(['invalid-viewbox', 'invalid-viewbox']);
  });

  it('berücksichtigt die halbe sichtbare Strichstärke', () => {
    const issues = checkViewBox(
      drawing({
        type: 'line',
        x1: 0,
        y1: 4,
        x2: 10,
        y2: 4,
        style: { stroke: 'schwarz', strokeWidth: 0.5 },
      }),
    );
    expect(issues[0]?.rule).toBe('outside-viewbox');
    expect(issues[0]?.detail).toContain('minX');
  });

  it('behandelt einen geerbten Nullstrich an der viewBox-Kante als unsichtbar', () => {
    expect(
      checkViewBox(
        drawing({
          type: 'group',
          style: { stroke: 'schwarz', strokeWidth: 0 },
          children: [
            { type: 'line', x1: 0, y1: 0, x2: 32, y2: 32 },
            { type: 'path', d: 'M 0 32 L 32 0' },
          ],
        }),
      ),
    ).toEqual([]);
  });

  it('wendet Gruppen-Translation und Rotation auf Kindgeometrie an', () => {
    const issues = checkViewBox(
      drawing({
        type: 'group',
        transform: { translate: { dxMm: 2, dyMm: 0 }, rotate: { angle: 90, cx: 0, cy: 0 } },
        children: [{ type: 'rect', x: 0, y: 0, width: 4, height: 4 }],
      }),
    );
    expect(issues[0]?.rule).toBe('outside-viewbox');
    expect(issues[0]?.detail).toContain('minX');
  });

  it('findet einen Kurvenkontrollpunkt außerhalb, obwohl die Endpunkte innen liegen', () => {
    const issues = checkViewBox(
      drawing({ type: 'path', d: 'M 4 4 C 8 40 24 40 28 4', style: { fill: 'schwarz' } }),
    );
    expect(issues[0]?.rule).toBe('outside-viewbox');
    expect(issues[0]?.detail).toContain('maxY');
  });

  it('liest H und V auf ihrer jeweiligen Achse', () => {
    expect(
      checkViewBox(drawing({ type: 'path', d: 'M 2 2 V 25 H 4 Z', style: { fill: 'schwarz' } })),
    ).toEqual([]);
  });

  it('meldet relative Pfade statt sie als leere Hülle grün zu lassen', () => {
    const issues = checkViewBox(drawing({ type: 'path', d: 'm 2 2 l 4 4' }));
    expect(issues.map((issue) => issue.rule)).toEqual(['path-syntax', 'path-syntax']);
  });

  it.each(['L 4 4', 'C 1 1 2 2 3 3', 'Q 1 1 2 2', 'Z'])(
    'meldet %s ohne begonnenen Teilpfad als Syntaxfehler',
    (d) => {
      const issues = checkViewBox(drawing({ type: 'path', d }));
      expect(issues.some((issue) => issue.rule === 'path-syntax')).toBe(true);
    },
  );

  it('meldet negative Rechteckmaße und Eckenradien', () => {
    const negativeWidth = checkViewBox(
      drawing({ type: 'rect', x: 4, y: 4, width: -2, height: 2 }),
    );
    const negativeRadius = checkViewBox(
      drawing({ type: 'rect', x: 4, y: 4, width: 2, height: 2, rx: -1 }),
    );
    expect(negativeWidth[0]?.rule).toBe('invalid-geometry');
    expect(negativeRadius[0]?.rule).toBe('invalid-geometry');
  });

  it('meldet eine negative Kreisstrichstärke', () => {
    const issues = checkViewBox(
      drawing({
        type: 'circle',
        cx: 8,
        cy: 8,
        r: 2,
        style: { stroke: 'schwarz', strokeWidth: -0.5 },
      }),
    );
    expect(issues[0]?.rule).toBe('invalid-geometry');
  });

  it('meldet ein nichtendliches Kreiszentrum', () => {
    const issues = checkViewBox(
      drawing({ type: 'circle', cx: Number.NaN, cy: 8, r: 2, style: { fill: 'rot' } }),
    );
    expect(issues[0]?.rule).toBe('invalid-geometry');
  });

  it('meldet fremde Pfadinterpunktion statt die übrige Hülle grün zu lassen', () => {
    const issues = checkViewBox(
      drawing({ type: 'path', d: 'M 1 1 ??? L 2 2', style: { fill: 'rot' } }),
    );
    expect(issues.some((issue) => issue.rule === 'path-syntax')).toBe(true);
  });

  it.each(['M,4 12 L 28 20', 'M 4,,12 L 28 20'])(
    'meldet den ungültigen Pfadseparator in %s genau einmal als Pfadsyntax-Befund',
    (d) => {
      const issues = checkViewBox(drawing({ type: 'path', d, style: { fill: 'rot' } }));
      expect(issues).toHaveLength(1);
      expect(issues[0]?.rule).toBe('path-syntax');
      expect(issues[0]?.detail).toContain('Unzulässiger Pfadseparator');
    },
  );

  it.each([
    ['U+00A0', '\u00a0'],
    ['U+2003', '\u2003'],
    ['U+2028', '\u2028'],
    ['U+000B', '\u000b'],
  ])('meldet Nicht-SVG-Whitespace %s genau einmal als Pfadsyntax-Befund', (_name, whitespace) => {
    const issues = checkViewBox(
      drawing({ type: 'path', d: `M 4${whitespace}12 L 28 20`, style: { fill: 'rot' } }),
    );
    expect(issues).toHaveLength(1);
    expect(issues[0]?.rule).toBe('path-syntax');
  });

  it.each(['', 'L 4 12', 'Z', 'M 4 12', 'M 4 12 Z', 'M 4 12 L 4 12'])(
    'meldet den nicht rendernden Pfad %j genau einmal als Pfadsyntax-Befund',
    (d) => {
      const issues = checkViewBox(drawing({ type: 'path', d, style: { fill: 'rot' } }));
      expect(issues).toHaveLength(1);
      expect(issues[0]?.rule).toBe('path-syntax');
    },
  );

  it('meldet bei Pfadsyntaxfehlern eine unabhängige aktive negative Strichstärke mit', () => {
    const issues = checkViewBox(
      drawing({
        type: 'path',
        d: 'M 4 12',
        style: { fill: 'none', stroke: 'schwarz', strokeWidth: -1 },
      }),
    );
    expect(issues.map((issue) => issue.rule)).toEqual(['path-syntax', 'invalid-geometry']);
    expect(issues[1]?.detail).toContain('Strichstärke');
  });

  it('meldet translate an einem Blatt als unbelegten IR-Fall', () => {
    const issues = checkViewBox(
      drawing({
        type: 'rect',
        x: 1,
        y: 1,
        width: 2,
        height: 2,
        transform: { translate: { dxMm: 1, dyMm: 1 } },
      }),
    );
    expect(issues.some((issue) => issue.rule === 'unsupported-transform')).toBe(true);
  });

  it('akzeptiert eine Exportrundung innerhalb der bestehenden Einheitentoleranz', () => {
    const withinTolerance = -unitsToMm(0.009);
    expect(
      checkViewBox(
        drawing({ type: 'rect', x: withinTolerance, y: 1, width: 2, height: 2, style: { fill: 'rot' } }),
      ),
    ).toEqual([]);
  });
});
