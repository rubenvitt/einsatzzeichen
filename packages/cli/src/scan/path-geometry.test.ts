import { describe, expect, it } from 'vitest';
import { mmToUnits } from '@einsatzzeichen/schema';
import { deriveRing, parseRectilinearPath } from './path-geometry.js';

/**
 * Konstruierte Testeingabe für „1.1 Taktische Formation" — enthält keine Bytes aus der
 * Referenzdatei. Die Sollgeometrie ist die Mittellinie x=1, y=6, w=30, h=20 mm bei
 * 0,5 mm Strichstärke; der Außenring liegt eine halbe Strichstärke außerhalb der
 * Mittellinie, der Innenring eine halbe innerhalb. Die Millimeterwerte werden über
 * `mmToUnits` in SVG-Einheiten umgerechnet und die `d`-Zeichenkette daraus zusammengebaut.
 * Die Kommandomischung entspricht der Referenz (zwei Teilpfade, absolutes M, absolute
 * H/V, relative h/v, jeweils mit Z geschlossen), damit der Tokenizer vollständig geprüft wird.
 */
const STROKE_WIDTH_MM = 0.5;
const HALF_STROKE_MM = STROKE_WIDTH_MM / 2;
const MIDLINE_MM = { minX: 1, minY: 6, maxX: 1 + 30, maxY: 6 + 20 };
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

// Zwei Teilpfade, absolutes M, absolute H/V, relative h/v, jeweils mit Z geschlossen —
// wie im Doppelrahmen der Referenz.
const FORMATION =
  `M${outer.maxX},${outer.maxY}H${outer.minX}V${outer.minY}h${outerWidth}v${outerHeight}Z` +
  `M${inner.minX},${inner.maxY}h${innerWidth}V${inner.minY}H${inner.minX}v${innerHeight}Z`;

describe('parseRectilinearPath', () => {
  it('zerlegt einen Doppelrahmen in zwei Teilpfade', () => {
    const subpaths = parseRectilinearPath(FORMATION);
    expect(subpaths).toHaveLength(2);
    expect(subpaths?.[0]).toEqual({ minX: 2.126, minY: 16.299, maxX: 88.583, maxY: 74.409 });
    expect(subpaths?.[1]).toEqual({ minX: 3.543, minY: 17.717, maxX: 87.165, maxY: 72.992 });
  });

  it('verarbeitet relative Kommandos', () => {
    const subpaths = parseRectilinearPath('M10,10h20v10h-20Z');
    expect(subpaths?.[0]).toEqual({ minX: 10, minY: 10, maxX: 30, maxY: 20 });
  });

  it('gibt null zurück, sobald Kurven vorkommen', () => {
    expect(parseRectilinearPath('M10,10c1,1 2,2 3,3Z')).toBeNull();
    expect(parseRectilinearPath('M10,10A5,5 0 0 1 20,20Z')).toBeNull();
  });
});

describe('deriveRing', () => {
  it('rechnet Mittellinie und Strichstärke aus einem Ringpaar zurück', () => {
    const ring = deriveRing(parseRectilinearPath(FORMATION) ?? []);
    expect(ring?.x).toBeCloseTo(2.8345, 4);
    expect(ring?.y).toBeCloseTo(17.008, 4);
    expect(ring?.width).toBeCloseTo(85.0395, 4);
    expect(ring?.height).toBeCloseTo(56.6925, 4);
    expect(ring?.strokeWidth).toBeCloseTo(1.4175, 4);
  });

  it('gibt null zurück, wenn kein Ringpaar vorliegt', () => {
    expect(deriveRing([{ minX: 0, minY: 0, maxX: 10, maxY: 10 }])).toBeNull();
  });

  it('gibt null zurück, wenn der zweite Teilpfad nicht im ersten liegt', () => {
    expect(
      deriveRing([
        { minX: 0, minY: 0, maxX: 10, maxY: 10 },
        { minX: 20, minY: 20, maxX: 30, maxY: 30 },
      ]),
    ).toBeNull();
  });
});
