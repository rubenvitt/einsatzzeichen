import { describe, expect, it } from 'vitest';
import {
  LINE_IDS,
  MOVEMENT_IDS,
  type Drawing,
  type LineId,
  type MovementId,
  type Point,
  type Primitive,
} from '@einsatzzeichen/schema';
import { boundsOfMm, strokeBoundsOfMm, type BoundsMm } from '../bounds.js';
import { NotMeasuredError } from '../not-measured.js';
import { renderSvg } from '../render/svg.js';
import { checkTextMetrics } from '../text-metrics.js';
import { ARIMO_TEXT_METRICS } from './text-metrics.js';
import {
  LINE_GEOMETRY,
  MOVEMENT_GEOMETRY,
  anchoredMovementPath,
  layoutDashes,
  lineDrawing,
  movementDrawing,
  pathLengthMm,
  resolvePathPoints,
} from './parametric.js';

/**
 * Gate der parametrisierten Bausteine (LFH-566): Verhalten auf frei gesetzten Verläufen. Dass die
 * Referenzverläufe die Referenz treffen, prüft `conformance/src/parametric-fixtures.test.ts` gegen
 * das Kennzahlenartefakt.
 */

const CANVAS_32 = { width: 32, height: 32 } as const;
const CANVAS_96 = { width: 96, height: 96 } as const;

const MEASURED_MOVEMENTS = MOVEMENT_IDS.filter((id) => MOVEMENT_GEOMETRY[id].status === 'measured');
const MEASURED_LINES = LINE_IDS.filter((id) => LINE_GEOMETRY[id].status === 'measured');
const BOUNDARIES: readonly LineId[] = ['boundary-command-area', 'boundary-section', 'boundary-subsection', 'boundary-with-strength'];
const CANVAS_128 = { width: 128, height: 32 } as const;

/** Ein gerader Verlauf der Länge `lengthMm` auf der Achse y 16, ab x 1. */
function straight(lengthMm: number) {
  return { points: [[1, 16], [1 + lengthMm, 16]] as [Point, Point] };
}

function hull(drawing: Drawing): BoundsMm {
  const all = drawing.children.map((child: Primitive) =>
    child.type === 'polyline' ? strokeBoundsOfMm(child) : boundsOfMm(child),
  );
  return {
    minX: Math.min(...all.map((b) => b.minX)),
    minY: Math.min(...all.map((b) => b.minY)),
    maxX: Math.max(...all.map((b) => b.maxX)),
    maxY: Math.max(...all.map((b) => b.maxY)),
  };
}

function pointsOf(drawing: Drawing): Point[][] {
  return drawing.children.flatMap((child) => (child.type === 'polyline' ? [[...child.points]] : []));
}

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function strengthFor(id: LineId) {
  return id === 'boundary-with-strength' ? { strength: 'zug' as const } : {};
}

describe('Verlauf', () => {
  it('löst Anfang, Richtung und Länge zu denselben Stützpunkten auf wie zwei Punkte', () => {
    const [start, end] = resolvePathPoints({ start: [2, 16], directionDeg: 0, lengthMm: 28 });
    expect(start).toEqual([2, 16]);
    expect(end?.[0]).toBeCloseTo(30, 12);
    expect(end?.[1]).toBeCloseTo(16, 12);
  });

  it('zählt die Richtung im Koordinatensystem der Zeichnung: 90° zeigt nach unten', () => {
    const [, end] = resolvePathPoints({ start: [16, 2], directionDeg: 90, lengthMm: 28 });
    expect(end?.[0]).toBeCloseTo(16, 12);
    expect(end?.[1]).toBeCloseTo(30, 12);
  });

  it('misst die Länge über alle Abschnitte', () => {
    expect(pathLengthMm([[0, 0], [3, 4], [3, 10]])).toBe(11);
  });

  it('lehnt einen Abschnitt ohne Länge und nicht endliche Stützpunkte ab', () => {
    expect(() => resolvePathPoints({ points: [[1, 1], [1, 1]] })).toThrow(/Vorgänger/);
    expect(() => resolvePathPoints({ points: [[1, 1], [Number.NaN, 1]] })).toThrow(/endliche/);
    expect(() => resolvePathPoints({ start: [1, 1], directionDeg: 0, lengthMm: 0 })).toThrow(/Vorgänger/);
  });
});

describe('Pfeile aus 5.2', () => {
  it('baut alle sechs Pfeile', () => {
    expect(MEASURED_MOVEMENTS).toEqual([...MOVEMENT_IDS]);
  });

  it('baut 5.2.1 mit zwei Schäften 2 mm neben der Achse, die im Kopf enden', () => {
    const drawing = movementDrawing('direction-of-action', { path: { points: [[2, 16], [30, 16]] } }, CANVAS_32);
    expect(pointsOf(drawing)).toEqual([
      [[2, 14], [28, 14]],
      [[2, 18], [28, 18]],
      [[24, 22], [30, 16], [24, 10]],
    ]);
  });

  it('baut 5.2.2 mit einem 8 mm langen Querstrich quer zum Anfang', () => {
    const drawing = movementDrawing('start-of-action', { path: { points: [[2, 16], [30, 16]] } }, CANVAS_32);
    expect(pointsOf(drawing)).toEqual([
      [[2, 16], [30, 16]],
      [[26, 20], [30, 16], [26, 12]],
      [[2, 12], [2, 20]],
    ]);
  });

  it('baut 5.2.5 mit Querstrich am Ende und der Kopfspitze 0,2 mm davor', () => {
    const drawing = movementDrawing('end-of-movement', { path: { points: [[2, 16], [30, 16]] } }, CANVAS_32);
    const points = pointsOf(drawing);
    expect(points[0]?.map(([x, y]) => [round3(x), round3(y)])).toEqual([[2, 16], [29.8, 16]]);
    expect(points[1]?.map(([x, y]) => [round3(x), round3(y)])).toEqual([[25.8, 20], [29.8, 16], [25.8, 12]]);
    expect(points[2]).toEqual([[30, 12], [30, 20]]);
  });

  it('baut 5.2.6 als Pfeil in einen Ring um das Verlaufsende', () => {
    const drawing = movementDrawing('gathering', { path: { points: [[2, 16], [26, 16]] } }, CANVAS_32);
    expect(pointsOf(drawing)).toEqual([
      [[2, 16], [21, 16]],
      [[17, 20], [21, 16], [17, 12]],
    ]);
    const ring = drawing.children.find((child) => child.type === 'circle');
    expect(ring).toMatchObject({ cx: 26, cy: 16, r: 4, style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 } });
  });

  it('führt die Schäfte von 5.2.1 parallel über einen rechtwinkligen Knick', () => {
    const drawing = movementDrawing(
      'direction-of-action',
      { path: { points: [[4, 4], [20, 4], [20, 30]] } },
      CANVAS_32,
    );
    const [left, right] = pointsOf(drawing).map((points) => points.map(([x, y]) => [round3(x), round3(y)]));
    // Links der Fahrtrichtung liegt außen, rechts innen: die Gehrung setzt den Knick auf 22|2 und 18|6.
    expect(left).toEqual([[4, 2], [22, 2], [22, 28]]);
    expect(right).toEqual([[4, 6], [18, 6], [18, 28]]);
  });

  it('lehnt bei 5.2.1 einen Knick ab, der spitzer als 45° ist', () => {
    expect(() =>
      movementDrawing('direction-of-action', { path: { points: [[4, 4], [28, 4], [8, 8]] } }, CANVAS_32),
    ).toThrow(/Knick/);
  });

  it('meldet jede Anbindung an ein Grundzeichen als Lücke der Zone movement-anchor', () => {
    for (const edge of ['body-top', 'body-bottom', 'body-left', 'body-right'] as const) {
      let error: unknown;
      try {
        movementDrawing('directed-movement', { path: { points: [[2, 16], [30, 16]] }, anchor: { edge } }, CANVAS_32);
      } catch (caught) {
        error = caught;
      }
      expect(error, edge).toBeInstanceOf(NotMeasuredError);
      expect((error as NotMeasuredError).scope).toBe('value');
      expect((error as Error).message).toContain('movement-anchor');
    }
  });

  it('dreht den Kopf mit dem Verlauf: dieselbe Hülle, um 90° gedreht', () => {
    const across = hull(movementDrawing('direction-of-action', { path: { points: [[2, 16], [30, 16]] } }, CANVAS_32));
    const down = hull(movementDrawing('direction-of-action', { path: { points: [[16, 2], [16, 30]] } }, CANVAS_32));
    expect(down.minX).toBeCloseTo(across.minY, 9);
    expect(down.maxX).toBeCloseTo(across.maxY, 9);
    expect(down.minY).toBeCloseTo(across.minX, 9);
    expect(down.maxY).toBeCloseTo(across.maxX, 9);
  });

  it('richtet den Kopf am letzten Abschnitt aus und führt den Schaft über jeden Knick', () => {
    const drawing = movementDrawing(
      'directed-movement',
      { path: { points: [[4, 4], [20, 4], [20, 28]] } },
      CANVAS_32,
    );
    const [shaft, head] = drawing.children;
    expect(shaft?.type === 'polyline' ? shaft.points : undefined).toEqual([[4, 4], [20, 4], [20, 28]]);
    // Der Kopf zeigt nach unten: Spitze auf dem letzten Punkt, Schenkel 4 mm darüber.
    expect(head?.type === 'polyline' ? head.points : undefined).toEqual([[16, 24], [20, 28], [24, 24]]);
  });

  it('lehnt einen Verlauf ab, der kürzer ist als seine Köpfe', () => {
    expect(() => movementDrawing('direction-of-action', { path: { points: [[2, 16], [8, 16]] } }, CANVAS_32))
      .toThrow(/Köpfe/);
    expect(() => movementDrawing('movement-both-directions', { path: { points: [[2, 16], [10, 16]] } }, CANVAS_32))
      .toThrow(/Köpfe/);
    expect(() => movementDrawing('movement-both-directions', { path: { points: [[2, 16], [10.5, 16]] } }, CANVAS_32))
      .not.toThrow();
    // 5.2.6: Kopf 4 mm, Ring 4 mm und 1 mm Luft vor dem Ring.
    expect(() => movementDrawing('gathering', { path: { points: [[2, 16], [11, 16]] } }, CANVAS_32)).toThrow(/Köpfe/);
  });

  it('lehnt einen Verlauf ab, der aus der Zeichenfläche ragt', () => {
    expect(() => movementDrawing('directed-movement', { path: { points: [[2, 16], [31.8, 16]] } }, CANVAS_32))
      .toThrow(/Zeichenfläche/);
  });
});

describe('Anbindung eines Pfeils an die Personenraute (5.8.8.12 bis 5.8.8.14)', () => {
  // Die 26-mm-Raute um 2 mm angehoben, wie in 5.8.8.12 bis 5.8.8.14: Ecken bei 3|14, 16|1, 29|14, 16|27.
  const RAISED_DIAMOND = { minX: 3, minY: 1, maxX: 29, maxY: 27 } as const;

  it('legt den Verlauf auf die Linie durch die untere Ecke, vom linken Rand bis 1 mm hinter den rechten', () => {
    for (const id of ['start-of-action', 'directed-movement', 'end-of-movement'] as const) {
      expect(anchoredMovementPath(id, 'person', RAISED_DIAMOND, 'body-bottom'), id).toEqual({ points: [[3, 27], [30, 27]] });
    }
  });

  it('trifft mit diesem Verlauf die Hülle der Referenz 5.8.8.13 samt Raute', () => {
    const drawing = movementDrawing(
      'directed-movement',
      { path: anchoredMovementPath('directed-movement', 'person', RAISED_DIAMOND, 'body-bottom') },
      CANVAS_32,
    );
    const arrow = hull(drawing);
    // Kennzahlenartefakt 5.8.8.13: Außenkontur 2,647/0,647/30,354/31,177 (Raute und Pfeil zusammen).
    expect(arrow.maxX).toBeCloseTo(30.354, 3);
    expect(arrow.maxY).toBeCloseTo(31.177, 3);
    expect(arrow.minX).toBeCloseTo(3, 9);
  });

  it('meldet die Raute in anderer Größe als Lücke: belegt ist nur die 26-mm-Raute', () => {
    // 1.2 Person in voller Größe: 30-mm-Raute, Hülle 1…31.
    expect(() =>
      anchoredMovementPath('directed-movement', 'person', { minX: 1, minY: 1, maxX: 31, maxY: 31 }, 'body-bottom'),
    ).toThrow(NotMeasuredError);
  });

  it('meldet jede andere Kante, jeden anderen Träger und jeden anderen Pfeil als Lücke', () => {
    expect(() => anchoredMovementPath('directed-movement', 'person', RAISED_DIAMOND, 'body-top')).toThrow(NotMeasuredError);
    expect(() => anchoredMovementPath('directed-movement', 'formation', RAISED_DIAMOND, 'body-bottom')).toThrow(NotMeasuredError);
    for (const id of ['direction-of-action', 'movement-both-directions', 'gathering'] as const) {
      expect(() => anchoredMovementPath(id, 'person', RAISED_DIAMOND, 'body-bottom'), id).toThrow(NotMeasuredError);
    }
  });
});

describe('Linien und Grenzen aus Kapitel 2', () => {
  it('baut alle sieben Linien', () => {
    expect(MEASURED_LINES).toEqual([...LINE_IDS]);
  });

  it('verlangt die Stärke genau an 2.20 und baut nur den Zug', () => {
    const path = { points: [[1, 16], [47, 16]] as [Point, Point] };
    expect(() => lineDrawing('boundary-with-strength', { path }, CANVAS_96)).toThrow(/braucht eine Stärke/);
    expect(() => lineDrawing('boundary-section', { path, strength: 'zug' }, CANVAS_96)).toThrow(/nur die Grenze/);
    for (const strength of ['trupp', 'staffel', 'gruppe'] as const) {
      expect(() => lineDrawing('boundary-with-strength', { path, strength }, CANVAS_96), strength)
        .toThrow(NotMeasuredError);
    }
  });

  it('wiederholt das Muster auf einem langen Verlauf, ohne einen Strich zu kürzen', () => {
    for (const id of MEASURED_LINES) {
      const geometry = LINE_GEOMETRY[id];
      if (geometry.status !== 'measured' || geometry.crossSection.kind !== 'dashed') continue;
      const crossSection = geometry.crossSection;
      const { dashMm, gapMm } = crossSection;
      for (const lengthMm of [2 * dashMm + gapMm, 60, 90, 137.5]) {
        const { dashes, gapCenters } = layoutDashes(lengthMm, crossSection);
        expect(dashes.length, `${id} @ ${lengthMm}`).toBe(gapCenters.length + 1);
        expect(dashes[0]?.[0]).toBe(0);
        expect(dashes[dashes.length - 1]?.[1]).toBeCloseTo(lengthMm, 9);
        for (const [from, to] of dashes) expect(to - from).toBeGreaterThanOrEqual(dashMm - 1e-9);
        for (let i = 1; i < dashes.length; i++) {
          expect((dashes[i]?.[0] ?? 0) - (dashes[i - 1]?.[1] ?? 0)).toBeCloseTo(gapMm, 9);
        }
      }
      expect(() => layoutDashes(2 * dashMm + gapMm - 0.01, crossSection), id).toThrow(/mindestens/);
    }
  });

  it('folgt einem geknickten Verlauf: ein Strich über den Knick behält den Knickpunkt', () => {
    const drawing = lineDrawing('boundary-section', { path: { points: [[4, 4], [34, 4], [34, 50]] } }, CANVAS_96);
    const dashes = drawing.children.filter((child) => child.type === 'polyline');
    expect(dashes.some((dash) => dash.type === 'polyline' && dash.points.some(([x, y]) => x === 34 && y === 4)))
      .toBe(true);
  });

  it('legt die Marken der Stärke auf den Verlauf, auch wenn er schräg läuft', () => {
    const drawing = lineDrawing(
      'boundary-with-strength',
      { path: { start: [10, 10], directionDeg: 45, lengthMm: 46 }, strength: 'zug' },
      CANVAS_96,
    );
    const marks = drawing.children.filter((child) => child.type === 'circle');
    expect(marks).toHaveLength(3);
    for (const mark of marks) {
      if (mark.type !== 'circle') continue;
      expect(mark.cx - 10).toBeCloseTo(mark.cy - 10, 9);
    }
  });

  it('setzt die Beschriftung so, dass sie mit Arimo in ihre Box passt', () => {
    for (const id of BOUNDARIES.filter((candidate) => candidate !== 'boundary-with-strength')) {
      const drawing = lineDrawing(id, { path: { points: [[1, 16], [47, 16]] } }, { width: 48, height: 32 });
      expect(checkTextMetrics(drawing, ARIMO_TEXT_METRICS), id).toEqual([]);
    }
  });
});

describe('Linien mit Marken: 2.14 bis 2.16', () => {
  function marksOf(drawing: Drawing) {
    const [stroke, ...marks] = drawing.children;
    return { stroke, marks };
  }

  it('zeichnet den Verlauf als 0,5-mm-Strich in der Farbe der Referenz', () => {
    const colors = { 'escape-route': 'gruen', 'barrier-position': 'hellblau', 'fire-spread': 'rot' } as const;
    for (const [id, color] of Object.entries(colors) as [LineId, string][]) {
      const { stroke, marks } = marksOf(lineDrawing(id, { path: straight(52) }, CANVAS_128));
      expect(stroke, id).toMatchObject({ type: 'polyline', points: [[1, 16], [53, 16]], style: { fill: 'none', stroke: color, strokeWidth: 0.5 } });
      for (const mark of marks) {
        const style = mark.style ?? {};
        expect(style.fill === color || style.stroke === color, id).toBe(true);
      }
    }
  });

  it('wiederholt die Marken mit fester Teilung, mittig, mindestens 3 mm vom Ende: die Anzahlen der Referenz', () => {
    // Bogenlängen der Referenzverläufe, an den Dateien gemessen, und die Anzahl ihrer Marken.
    const cases: readonly [LineId, 'primary' | 'alternative', number, number][] = [
      ['escape-route', 'primary', 60.36, 7],
      ['escape-route', 'alternative', 58.7, 5],
      ['barrier-position', 'primary', 52.11, 12],
      ['fire-spread', 'primary', 61.83, 14],
    ];
    for (const [id, variant, length, count] of cases) {
      const drawing = lineDrawing(id, { path: straight(length), variant }, CANVAS_128);
      const anchors = drawing.children.slice(1).filter((child) => child.type !== 'polyline' || id !== 'escape-route');
      expect(anchors, `${id} ${variant}`).toHaveLength(count);
    }
  });

  it('setzt die Marken symmetrisch mit der gemessenen Teilung', () => {
    const drawing = lineDrawing('barrier-position', { path: straight(52.11) }, CANVAS_128);
    const bases = drawing.children.slice(1).map((tick) => (tick.type === 'polyline' ? (tick.points[0] as Point)[0] - 1 : Number.NaN));
    expect(bases[1]! - bases[0]!).toBeCloseTo(4, 9);
    expect(bases[0]!).toBeCloseTo(52.11 - bases[bases.length - 1]!, 9);
  });

  it('setzt die Querstriche von 2.15 und 2.16 links der Fahrtrichtung, 2,25 mm von der Achse', () => {
    for (const id of ['barrier-position', 'fire-spread'] as const) {
      const right = lineDrawing(id, { path: straight(20) }, CANVAS_128);
      for (const tick of right.children.slice(1)) {
        if (tick.type !== 'polyline') throw new Error('Querstrich erwartet');
        const [[x0, y0], [x1, y1]] = tick.points as [Point, Point];
        expect(x1).toBeCloseTo(x0, 9);
        expect(y0).toBe(16);
        // Fahrtrichtung nach rechts, links davon ist oben.
        expect(y1).toBeCloseTo(13.75, 9);
      }
      // Umgekehrter Verlauf: die Striche wechseln die Seite.
      const left = lineDrawing(id, { path: { points: [[21, 16], [1, 16]] } }, CANVAS_128);
      const tick = left.children[1];
      expect(tick?.type === 'polyline' ? tick.points[1]?.[1] : undefined).toBeCloseTo(18.25, 9);
    }
  });

  it('zeichnet 2.14 mit gefüllten Punkten von 1,5 mm Radius auf dem Verlauf', () => {
    const drawing = lineDrawing('escape-route', { path: straight(60.36) }, CANVAS_128);
    for (const dot of drawing.children.slice(1)) {
      expect(dot).toMatchObject({ type: 'circle', cy: 16, r: 1.5, style: { fill: 'gruen' } });
    }
  });

  it('zeichnet die zweite Darstellung von 2.14 mit Pfeilköpfen zwischen den Punkten in Fahrtrichtung', () => {
    const drawing = lineDrawing('escape-route', { path: straight(58.7), variant: 'alternative' }, CANVAS_128);
    const dots = drawing.children.filter((child) => child.type === 'circle');
    const heads = drawing.children.slice(1).filter((child) => child.type === 'polyline');
    expect(dots).toHaveLength(5);
    expect(heads).toHaveLength(4);
    const cx = dots.map((dot) => (dot.type === 'circle' ? dot.cx : Number.NaN));
    for (const [i, head] of heads.entries()) {
      if (head.type !== 'polyline') continue;
      const [a, tip, b] = head.points as [Point, Point, Point];
      const arm = 3 * Math.SQRT1_2;
      // Kopf rechtwinklig, Schenkel 3 mm, mittig zwischen zwei Punkten, Spitze in Fahrtrichtung.
      expect(tip[0] - arm / 2).toBeCloseTo((cx[i]! + cx[i + 1]!) / 2, 9);
      expect(a[0]).toBeCloseTo(tip[0] - arm, 9);
      expect(b[0]).toBeCloseTo(tip[0] - arm, 9);
      expect(Math.abs(a[1] - b[1])).toBeCloseTo(2 * arm, 9);
    }
  });

  it('führt die zweite Darstellung nur an 2.14 und lehnt zu kurze Verläufe ab', () => {
    expect(() => lineDrawing('fire-spread', { path: straight(30), variant: 'alternative' }, CANVAS_128)).toThrow(/Darstellung/);
    expect(() => lineDrawing('boundary-section', { path: straight(46), variant: 'alternative' }, CANVAS_128)).toThrow(/Darstellung/);
    expect(() => lineDrawing('fire-spread', { path: straight(5.9) }, CANVAS_128)).toThrow(/kurz/);
    expect(() => lineDrawing('escape-route', { path: straight(17.9), variant: 'alternative' }, CANVAS_128)).toThrow(/kurz/);
  });
});

describe('Ausgabe', () => {
  it('gibt jeden vermessenen Baustein als SVG aus', () => {
    for (const id of MEASURED_MOVEMENTS as MovementId[]) {
      const end: Point = id === 'gathering' ? [26, 16] : [30, 16];
      const svg = renderSvg(movementDrawing(id, { path: { points: [[2, 16], end] } }, CANVAS_32));
      expect(svg, id).toContain('<polyline');
    }
    for (const id of BOUNDARIES) {
      const svg = renderSvg(
        lineDrawing(id, { path: { points: [[1, 16], [47, 16]] }, ...strengthFor(id) }, { width: 48, height: 32 }),
      );
      // 48 × 32 mm in Punkt, dieselbe Fläche wie die Referenzdateien 2.17 bis 2.20.
      expect(svg, id).toContain('viewBox="0 0 136.063 90.709"');
    }
  });
});
