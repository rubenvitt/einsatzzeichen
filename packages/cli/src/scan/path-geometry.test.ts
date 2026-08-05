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

/**
 * Dreieckspaar (Rechtwinkel-Dreiecke, zwei Katheten achsparallel, die Hypotenuse ist
 * jeweils exakt das Schlusssegment von `Z`). Das prüft gezielt, dass das implizite
 * Segment von `Z` zum Startpunkt mitbewertet wird — sonst rutscht genau diese Form durch,
 * weil ihre einzige schräge Kante nicht als explizites Kommando auftaucht.
 *
 * Außen (mm): A=(0,0) → B=(20,0) [H] → C=(20,15) [V] → Z schließt C→A schräg.
 * Innen (mm): D=(5,5) → E=(15,5) [H] → F=(15,10) [V] → Z schließt F→D schräg, liegt
 * vollständig innerhalb der Außenhülle (0..20 / 0..15 mm).
 */
const TRIANGLE_OUTER_MM = { ax: 0, ay: 0, bx: 20, cy: 15 };
const TRIANGLE_INNER_MM = { ax: 5, ay: 5, bx: 15, cy: 10 };

function triangleD(mm: { ax: number; ay: number; bx: number; cy: number }): string {
  const ax = mmToUnits(mm.ax);
  const ay = mmToUnits(mm.ay);
  const bx = mmToUnits(mm.bx);
  const cy = mmToUnits(mm.cy);
  return `M${ax},${ay}H${bx}V${cy}Z`;
}

const TRIANGLES = triangleD(TRIANGLE_OUTER_MM) + triangleD(TRIANGLE_INNER_MM);

/**
 * Treppen-/L-Form als Außenteilpfad, einfaches Rechteck als Innenteilpfad. Alle
 * Segmente der L-Form sind achsparallel (nur H/V/Z) — die Form scheitert also nicht an
 * der Achsparallelität einzelner Segmente, sondern daran, dass die besuchten Punkte
 * mehr sind als die vier Hüllenecken und eine Hüllenecke (20,20) nie besucht wird.
 *
 * Außen (mm), im Uhrzeigersinn: (0,0) → (0,20) [V] → (8,20) [H] → (8,8) [V] →
 * (20,8) [H] → (20,0) [V] → Z schließt (20,0)→(0,0) [horizontal]. Hülle: 0..20 / 0..20 mm,
 * Ecken (0,0) (0,20) (20,20) (20,0) — (20,20) wird nie besucht, sechs Punkte statt vier.
 * Innen (mm): einfaches Rechteck 2..6 / 2..6 mm, vollständig innerhalb der Außenhülle.
 */
const STAIRCASE_OUTER_MM = { minX: 0, minY: 0, stepX: 8, stepY: 8, maxX: 20, maxY: 20 };
const STAIRCASE_INNER_MM = { minX: 2, minY: 2, maxX: 6, maxY: 6 };

function staircaseD(mm: typeof STAIRCASE_OUTER_MM): string {
  const minX = mmToUnits(mm.minX);
  const minY = mmToUnits(mm.minY);
  const stepX = mmToUnits(mm.stepX);
  const stepY = mmToUnits(mm.stepY);
  const maxX = mmToUnits(mm.maxX);
  const maxY = mmToUnits(mm.maxY);
  return `M${minX},${minY}V${maxY}H${stepX}V${stepY}H${maxX}V${minY}Z`;
}

function rectD(mm: { minX: number; minY: number; maxX: number; maxY: number }): string {
  const minX = mmToUnits(mm.minX);
  const minY = mmToUnits(mm.minY);
  const maxX = mmToUnits(mm.maxX);
  const maxY = mmToUnits(mm.maxY);
  return `M${minX},${minY}H${maxX}V${maxY}H${minX}Z`;
}

const STAIRCASE_PAIR = staircaseD(STAIRCASE_OUTER_MM) + rectD(STAIRCASE_INNER_MM);

/**
 * Um 45° gedrehtes Quadratpaar, als zwei ineinanderliegende Rauten gezeichnet — genau
 * die Form, die ein Ringpfad für ein gedrehtes Quadrat (1.2 Person) annimmt. Jede Kante
 * verändert x und y gleichzeitig, ist also nie achsparallel; die Form scheitert damit
 * schon an der Segmentprüfung, nicht erst an der Punktmenge.
 *
 * Außen (mm), Zentrum (15,15), Halbdiagonale 15: (15,0) → (30,15) → (15,30) → (0,15) → Z.
 * Innen (mm), Zentrum (15,15), Halbdiagonale 10: (15,5) → (25,15) → (15,25) → (5,15) → Z,
 * liegt innerhalb der Außenhülle (0..30 / 0..30 mm).
 */
function diamondD(mm: { cx: number; cy: number; r: number }): string {
  const top = { x: mmToUnits(mm.cx), y: mmToUnits(mm.cy - mm.r) };
  const right = { x: mmToUnits(mm.cx + mm.r), y: mmToUnits(mm.cy) };
  const bottom = { x: mmToUnits(mm.cx), y: mmToUnits(mm.cy + mm.r) };
  const left = { x: mmToUnits(mm.cx - mm.r), y: mmToUnits(mm.cy) };
  return `M${top.x},${top.y}L${right.x},${right.y}L${bottom.x},${bottom.y}L${left.x},${left.y}Z`;
}

const DIAMONDS = diamondD({ cx: 15, cy: 15, r: 15 }) + diamondD({ cx: 15, cy: 15, r: 10 });

describe('parseRectilinearPath', () => {
  it('zerlegt einen Doppelrahmen in zwei Teilpfade', () => {
    const subpaths = parseRectilinearPath(FORMATION);
    expect(subpaths).toHaveLength(2);
    expect(subpaths?.[0]).toEqual({
      minX: 2.126,
      minY: 16.299,
      maxX: 88.583,
      maxY: 74.409,
      isAxisAlignedRect: true,
    });
    expect(subpaths?.[1]).toEqual({
      minX: 3.543,
      minY: 17.717,
      maxX: 87.165,
      maxY: 72.992,
      isAxisAlignedRect: true,
    });
  });

  it('verarbeitet relative Kommandos', () => {
    const subpaths = parseRectilinearPath('M10,10h20v10h-20Z');
    expect(subpaths?.[0]).toEqual({ minX: 10, minY: 10, maxX: 30, maxY: 20, isAxisAlignedRect: true });
  });

  it('gibt null zurück, sobald Kurven vorkommen', () => {
    expect(parseRectilinearPath('M10,10c1,1 2,2 3,3Z')).toBeNull();
    expect(parseRectilinearPath('M10,10A5,5 0 0 1 20,20Z')).toBeNull();
  });

  it('erkennt ein Dreieck nicht als achsparalleles Rechteck (Schrägkante im Z-Schluss)', () => {
    const subpaths = parseRectilinearPath(TRIANGLES);
    expect(subpaths?.[0]?.isAxisAlignedRect).toBe(false);
    expect(subpaths?.[1]?.isAxisAlignedRect).toBe(false);
  });

  it('erkennt eine Treppen-/L-Form nicht als Rechteck, obwohl alle Segmente achsparallel sind', () => {
    const subpaths = parseRectilinearPath(STAIRCASE_PAIR);
    expect(subpaths?.[0]?.isAxisAlignedRect).toBe(false);
    // Der Innenteilpfad ist ein echtes Rechteck und bleibt davon unberührt.
    expect(subpaths?.[1]?.isAxisAlignedRect).toBe(true);
  });

  it('erkennt ein um 45° gedrehtes Quadrat nicht als achsparalleles Rechteck', () => {
    const subpaths = parseRectilinearPath(DIAMONDS);
    expect(subpaths?.[0]?.isAxisAlignedRect).toBe(false);
    expect(subpaths?.[1]?.isAxisAlignedRect).toBe(false);
  });

  it('gibt null zurück, statt NaN aus einem abgeschnittenen Pfad in die Hülle zu übernehmen', () => {
    // "M 5" bricht nach der x-Koordinate ab: next() liest über das Tokenende hinaus,
    // Number(undefined) ist NaN. Ohne Wache würde Math.abs(NaN) > TOLERANCE_UNITS
    // stillschweigend false sein — die kaputte Hülle bestünde jeden Vergleich.
    expect(parseRectilinearPath('M 5')).toBeNull();
    expect(parseRectilinearPath('M10,10L20')).toBeNull();
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
    expect(
      deriveRing([{ minX: 0, minY: 0, maxX: 10, maxY: 10, isAxisAlignedRect: true }]),
    ).toBeNull();
  });

  it('gibt null zurück, wenn der zweite Teilpfad nicht im ersten liegt', () => {
    expect(
      deriveRing([
        { minX: 0, minY: 0, maxX: 10, maxY: 10, isAxisAlignedRect: true },
        { minX: 20, minY: 20, maxX: 30, maxY: 30, isAxisAlignedRect: true },
      ]),
    ).toBeNull();
  });

  it('gibt null zurück für ein Dreieckspaar', () => {
    expect(deriveRing(parseRectilinearPath(TRIANGLES) ?? [])).toBeNull();
  });

  it('gibt null zurück für ein Paar mit einer Treppen-/L-Form', () => {
    expect(deriveRing(parseRectilinearPath(STAIRCASE_PAIR) ?? [])).toBeNull();
  });

  it('gibt null zurück für ein um 45° gedrehtes Quadratpaar', () => {
    expect(deriveRing(parseRectilinearPath(DIAMONDS) ?? [])).toBeNull();
  });
});
