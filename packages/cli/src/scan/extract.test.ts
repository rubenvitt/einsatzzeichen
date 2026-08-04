import { describe, expect, it } from 'vitest';
import { mmToUnits } from '@einsatzzeichen/schema';
import { extractFingerprint } from './extract.js';

/**
 * Konstruierte Testeingaben — keine Koordinate und kein Pfaddatum stammt als Byte aus
 * einer Referenzdatei. Jede Zahl wird aus den in .superpowers/sdd/.../task-7-brief.md
 * genannten Millimeter-Sollwerten über `mmToUnits` in SVG-Einheiten umgerechnet, exakt
 * wie in `path-geometry.test.ts` (Task 6) vorgemacht. Die Herleitung jeder Zahl,
 * inklusive der `transform`-Gleichung für das gedrehte Quadrat, steht im Bericht
 * task-7a-report.md. Erlaubt und beibehalten sind nur die Layer-Kennungen (Format-
 * Magic-Numbers), die Palettenfarben aus @einsatzzeichen/schema und Dateinamen.
 */

const VIEWBOX_MM = 32;
const viewBoxUnits = mmToUnits(VIEWBOX_MM);

// ---- „1.1 Taktische Formation": Füllfläche + Doppelrahmen bei 0,5 mm Strichstärke ----
// Mittellinie x=1, y=6, w=30, h=20 mm — identisch zur Sollgeometrie aus
// path-geometry.test.ts (Task 6), da es sich um dieselbe Referenzfigur handelt.
const FILL_MM = { x: 1, y: 6, width: 30, height: 20 };
const STROKE_WIDTH_MM = 0.5;
const HALF_STROKE_MM = STROKE_WIDTH_MM / 2;
const MIDLINE_MM = {
  minX: FILL_MM.x,
  minY: FILL_MM.y,
  maxX: FILL_MM.x + FILL_MM.width,
  maxY: FILL_MM.y + FILL_MM.height,
};
const OUTER_MM = {
  minX: MIDLINE_MM.minX - HALF_STROKE_MM,
  minY: MIDLINE_MM.minY - HALF_STROKE_MM,
  maxX: MIDLINE_MM.maxX + HALF_STROKE_MM,
  maxY: MIDLINE_MM.maxY + HALF_STROKE_MM,
};
const INNER_MM = {
  minX: MIDLINE_MM.minX + HALF_STROKE_MM,
  minY: MIDLINE_MM.minY + HALF_STROKE_MM,
  maxX: MIDLINE_MM.maxX - HALF_STROKE_MM,
  maxY: MIDLINE_MM.maxY - HALF_STROKE_MM,
};

const fill = {
  x: mmToUnits(FILL_MM.x),
  y: mmToUnits(FILL_MM.y),
  width: mmToUnits(FILL_MM.width),
  height: mmToUnits(FILL_MM.height),
};
const outer = {
  minX: mmToUnits(OUTER_MM.minX),
  minY: mmToUnits(OUTER_MM.minY),
  maxX: mmToUnits(OUTER_MM.maxX),
  maxY: mmToUnits(OUTER_MM.maxY),
};
const inner = {
  minX: mmToUnits(INNER_MM.minX),
  minY: mmToUnits(INNER_MM.minY),
  maxX: mmToUnits(INNER_MM.maxX),
  maxY: mmToUnits(INNER_MM.maxY),
};
const outerWidth = mmToUnits(OUTER_MM.maxX - OUTER_MM.minX);
const outerHeight = mmToUnits(OUTER_MM.maxY - OUTER_MM.minY);
const innerWidth = mmToUnits(INNER_MM.maxX - INNER_MM.minX);
const innerHeight = mmToUnits(INNER_MM.maxY - INNER_MM.minY);

// Zwei Teilpfade, absolutes M, absolute H/V, relative h/v, je mit Z geschlossen —
// gleiches Kommandomuster wie in path-geometry.test.ts, damit der Tokenizer wie in
// der Referenz durchlaufen wird.
const FORMATION_FRAME_D =
  `M${outer.maxX},${outer.maxY}H${outer.minX}V${outer.minY}h${outerWidth}v${outerHeight}Z` +
  `M${inner.minX},${inner.maxY}h${innerWidth}V${inner.minY}H${inner.minX}v${innerHeight}Z`;

const FORMATION_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ${viewBoxUnits} ${viewBoxUnits}">
  <g id="Grundfläche"><rect x="0" y="0" width="${viewBoxUnits}" height="${viewBoxUnits}" fill="none"/></g>
  <g id="Flächige_Fülung"><rect x="${fill.x}" y="${fill.y}" width="${fill.width}" height="${fill.height}" fill="#fff"/></g>
  <g id="Takt_Zeichen__x28_umgewandelt_x29_">
    <path d="${FORMATION_FRAME_D}"/>
  </g>
</svg>`;

// ---- „D.3.7" (Rautenform): gedrehtes Quadrat, Stärkepunkt, ein Kurvenpfad ----
// Halbe Diagonale 13 mm, Mittelpunkt (16 | 18) mm, 45° — Seitenlänge 26 / √2 mm.
// Herleitung von tx/ty für `translate(tx ty) rotate(45)`: siehe Bericht.
const DIAMOND_SIDE_MM = 26 / Math.SQRT2;
const diamondSide = mmToUnits(DIAMOND_SIDE_MM);
const diamondTx = mmToUnits(16);
const diamondTy = mmToUnits(5);

const circle = { cx: mmToUnits(16), cy: mmToUnits(2.5), r: mmToUnits(1.5) };

const DIAMOND_SVG = `<svg viewBox="0 0 ${viewBoxUnits} ${viewBoxUnits}">
  <g id="Grundfläche"><rect x="0" y="0" width="${viewBoxUnits}" height="${viewBoxUnits}" fill="none"/></g>
  <g id="Flächige_Fülung">
    <rect x="0" y="0" width="${diamondSide}" height="${diamondSide}" transform="translate(${diamondTx} ${diamondTy}) rotate(45)" fill="#fa1919"/>
  </g>
  <g id="Takt_Zeichen__x28_umgewandelt_x29_">
    <circle cx="${circle.cx}" cy="${circle.cy}" r="${circle.r}"/>
    <path d="M0,0c1,1 2,2 3,3Z"/>
  </g>
</svg>`;

/** Baut aus Millimeter-Punkten ein `M…L…L…[Z]`-Pfadsegment in SVG-Einheiten. */
function toPathSegment(pointsMm: ReadonlyArray<readonly [number, number]>, close: boolean): string {
  const [first, ...rest] = pointsMm;
  if (!first) return '';
  const moveTo = `M${mmToUnits(first[0])},${mmToUnits(first[1])}`;
  const lineTos = rest.map(([x, y]) => `L${mmToUnits(x)},${mmToUnits(y)}`).join('');
  return `${moveTo}${lineTos}${close ? 'Z' : ''}`;
}

describe('extractFingerprint', () => {
  it('liest viewBox, Layer und Farben', () => {
    const fp = extractFingerprint(FORMATION_SVG, '1.1_Taktische Formation.svg');
    expect(fp.asset).toBe('1.1_Taktische Formation.svg');
    expect(fp.viewBox).toEqual({ width: viewBoxUnits, height: viewBoxUnits });
    expect(fp.layers).toEqual(['Grundfläche', 'Flächige_Fülung', 'Takt_Zeichen (umgewandelt)']);
    expect(fp.fills).toEqual(['#ffffff']);
  });

  it('gibt die Füllfläche in Millimetern aus und ignoriert die Grundfläche', () => {
    const fp = extractFingerprint(FORMATION_SVG, 'x.svg');
    const rect = fp.shapes.find((s) => s.kind === 'rect');
    expect(rect?.boundsMm).toEqual({ minXMm: 1, minYMm: 6, maxXMm: 31, maxYMm: 26 });
  });

  it('leitet aus dem Doppelrahmen die Mittellinie in Millimetern ab', () => {
    const fp = extractFingerprint(FORMATION_SVG, 'x.svg');
    const ring = fp.shapes.find((s) => s.kind === 'ring');
    expect(ring?.boundsMm).toEqual({ minXMm: 1, minYMm: 6, maxXMm: 31, maxYMm: 26 });
    expect(ring?.strokeWidthMm).toBeCloseTo(0.5, 3);
  });

  it('dreht die Hülle eines rotierten Quadrats mit', () => {
    const fp = extractFingerprint(DIAMOND_SVG, 'D.3.7.svg');
    const rect = fp.shapes.find((s) => s.kind === 'rect');
    expect(rect?.rotate).toBe(45);
    // 18,385 mm Seite um (16 | 18) gedreht ergibt 13 mm halbe Diagonale.
    expect(rect?.boundsMm.minYMm).toBeCloseTo(5, 2);
    expect(rect?.boundsMm.maxYMm).toBeCloseTo(31, 2);
    expect(rect?.boundsMm.minXMm).toBeCloseTo(3, 2);
  });

  it('gibt Kreise als Hülle in Millimetern aus', () => {
    const fp = extractFingerprint(DIAMOND_SVG, 'D.3.7.svg');
    const circleShape = fp.shapes.find((s) => s.kind === 'circle');
    expect(circleShape?.boundsMm.minXMm).toBeCloseTo(14.5, 2);
    expect(circleShape?.boundsMm.maxXMm).toBeCloseTo(17.5, 2);
    expect(circleShape?.boundsMm.maxYMm).toBeCloseTo(4, 2);
  });

  it('zählt Pfade mit Kurven, ohne ihre Geometrie zu erfassen', () => {
    const fp = extractFingerprint(DIAMOND_SVG, 'D.3.7.svg');
    expect(fp.curvedPaths).toBe(1);
  });

  it('erfasst Polygone, damit 1.7 Gebäude nicht leer bleibt', () => {
    // Geschlossener Polyzug (16|3) (1|10) (1|26) (31|26) (31|10) mm.
    const points = ([
      [16, 3],
      [1, 10],
      [1, 26],
      [31, 26],
      [31, 10],
    ] as const)
      .map(([x, y]) => `${mmToUnits(x)} ${mmToUnits(y)}`)
      .join(' ');
    const svg = `<svg viewBox="0 0 ${viewBoxUnits} ${viewBoxUnits}">
      <g id="Flächige_Fülung">
        <polygon points="${points}" fill="#fff"/>
      </g>
    </svg>`;
    const shape = extractFingerprint(svg, '1.7_Gebäude.svg').shapes[0];
    expect(shape?.kind).toBe('bounds');
    expect(shape?.boundsMm).toEqual({ minXMm: 1, minYMm: 3, maxXMm: 31, maxYMm: 26 });
  });

  it('nimmt bei mehr als zwei Teilpfaden die äußerste Hülle', () => {
    // 1.7 Gebäude hat drei Teilpfade: Außenring, Innenring und die Dachlinie.
    // Außenring eine halbe Strichstärke (0,25 mm) außerhalb des Polyzugs, Innenring
    // eine halbe innerhalb; die Dachlinie ist die unversetzte Mittellinie des Dachs.
    const outerRing = [
      [16, 2.75],
      [0.75, 10],
      [0.75, 26.25],
      [31.25, 26.25],
      [31.25, 10],
    ] as const;
    const innerRing = [
      [16, 3.25],
      [1.25, 10],
      [1.25, 25.75],
      [30.75, 25.75],
      [30.75, 10],
    ] as const;
    const roofline = [
      [1, 10],
      [16, 3],
      [31, 10],
    ] as const;

    const d = `${toPathSegment(outerRing, true)}${toPathSegment(innerRing, true)}${toPathSegment(roofline, false)}`;

    const svg = `<svg viewBox="0 0 ${viewBoxUnits} ${viewBoxUnits}">
      <g id="Takt_Zeichen__x28_umgewandelt_x29_">
        <path d="${d}"/>
      </g>
    </svg>`;
    const shape = extractFingerprint(svg, '1.7_Gebäude.svg').shapes[0];
    // Außenkante, nicht Mittellinie — deshalb eine eigene, schwächere Art.
    expect(shape?.kind).toBe('outline');
    expect(shape?.boundsMm.minXMm).toBeCloseTo(0.75, 2);
    expect(shape?.boundsMm.maxYMm).toBeCloseTo(26.25, 2);
  });
});
