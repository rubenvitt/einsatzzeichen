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
  it('baut die drei vermessenen Pfeile und meldet die übrigen als Lücke', () => {
    expect(MEASURED_MOVEMENTS).toEqual(['direction-of-action', 'directed-movement', 'movement-both-directions']);
    for (const id of MOVEMENT_IDS.filter((candidate) => !MEASURED_MOVEMENTS.includes(candidate))) {
      expect(() => movementDrawing(id, { path: { points: [[2, 16], [30, 16]] } }, CANVAS_32), id)
        .toThrow(NotMeasuredError);
    }
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
  });

  it('lehnt einen Verlauf ab, der aus der Zeichenfläche ragt', () => {
    expect(() => movementDrawing('directed-movement', { path: { points: [[2, 16], [31.8, 16]] } }, CANVAS_32))
      .toThrow(/Zeichenfläche/);
  });
});

describe('Linien und Grenzen aus Kapitel 2', () => {
  it('baut die vier vermessenen Grenzen und meldet die drei Flächen als Lücke', () => {
    expect(MEASURED_LINES).toEqual([
      'boundary-command-area',
      'boundary-section',
      'boundary-subsection',
      'boundary-with-strength',
    ]);
    for (const id of LINE_IDS.filter((candidate) => !MEASURED_LINES.includes(candidate))) {
      expect(() => lineDrawing(id, { path: { points: [[1, 16], [47, 16]] } }, CANVAS_96), id)
        .toThrow(NotMeasuredError);
    }
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
      if (geometry.status !== 'measured') continue;
      const { dashMm, gapMm } = geometry.crossSection;
      for (const lengthMm of [2 * dashMm + gapMm, 60, 90, 137.5]) {
        const { dashes, gapCenters } = layoutDashes(lengthMm, geometry.crossSection);
        expect(dashes.length, `${id} @ ${lengthMm}`).toBe(gapCenters.length + 1);
        expect(dashes[0]?.[0]).toBe(0);
        expect(dashes[dashes.length - 1]?.[1]).toBeCloseTo(lengthMm, 9);
        for (const [from, to] of dashes) expect(to - from).toBeGreaterThanOrEqual(dashMm - 1e-9);
        for (let i = 1; i < dashes.length; i++) {
          expect((dashes[i]?.[0] ?? 0) - (dashes[i - 1]?.[1] ?? 0)).toBeCloseTo(gapMm, 9);
        }
      }
      expect(() => layoutDashes(2 * dashMm + gapMm - 0.01, geometry.crossSection), id).toThrow(/mindestens/);
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
    for (const id of MEASURED_LINES.filter((candidate) => candidate !== 'boundary-with-strength')) {
      const drawing = lineDrawing(id, { path: { points: [[1, 16], [47, 16]] } }, { width: 48, height: 32 });
      expect(checkTextMetrics(drawing, ARIMO_TEXT_METRICS), id).toEqual([]);
    }
  });
});

describe('Ausgabe', () => {
  it('gibt jeden vermessenen Baustein als SVG aus', () => {
    for (const id of MEASURED_MOVEMENTS as MovementId[]) {
      const svg = renderSvg(movementDrawing(id, { path: { points: [[2, 16], [30, 16]] } }, CANVAS_32));
      expect(svg, id).toContain('<polyline');
    }
    for (const id of MEASURED_LINES) {
      const svg = renderSvg(
        lineDrawing(id, { path: { points: [[1, 16], [47, 16]] }, ...strengthFor(id) }, { width: 48, height: 32 }),
      );
      // 48 × 32 mm in Punkt, dieselbe Fläche wie die Referenzdateien 2.17 bis 2.20.
      expect(svg, id).toContain('viewBox="0 0 136.063 90.709"');
    }
  });
});
