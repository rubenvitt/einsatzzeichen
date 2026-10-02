import { describe, expect, it } from 'vitest';
import type { Point, Primitive } from '@einsatzzeichen/schema';
import { drawFreestanding } from '../draw-freestanding.js';
import { validateFreestandingSpec } from '../validate-freestanding.js';

/**
 * Stärken an der Grenze 2.20 außer dem Zug (Eigentümerentscheid 02.10.2026: zulassen,
 * abgeleitet). Vermessen: drei Marken r 1 mm bei x 21 / 24 / 27 auf der Achse y 16, Lückenmitte 24.
 */

const PATH = { points: [[1, 16], [47, 16]] as [Point, Point] };
const circlesOf = (children: readonly Primitive[]) =>
  children.filter((child): child is Extract<Primitive, { type: 'circle' }> => child.type === 'circle');

describe('Grenze 2.20 mit taktischer Stärke', () => {
  it('lässt den vermessenen Zug unverändert und ohne Notiz', () => {
    const drawn = drawFreestanding({ kind: 'line', line: 'boundary-with-strength', path: PATH, strength: 'zug' });
    expect(circlesOf(drawn.children).map((c) => [c.cx, c.cy, c.r])).toEqual([[21, 16, 1], [24, 16, 1], [27, 16, 1]]);
    expect(drawn.derivations).toBeUndefined();
  });

  it('belegt die Reihenplätze wie die Kopfzone: Trupp in der Mitte, Gruppe außen', () => {
    const trupp = drawFreestanding({ kind: 'line', line: 'boundary-with-strength', path: PATH, strength: 'trupp' });
    expect(circlesOf(trupp.children).map((c) => [c.cx, c.cy, c.r])).toEqual([[24, 16, 1]]);
    const gruppe = drawFreestanding({ kind: 'line', line: 'boundary-with-strength', path: PATH, strength: 'gruppe' });
    expect(circlesOf(gruppe.children).map((c) => [c.cx, c.cy, c.r])).toEqual([[21, 16, 1], [27, 16, 1]]);
    for (const drawn of [trupp, gruppe]) {
      expect(drawn.derivations).toEqual([expect.objectContaining({ dimension: 'strength', basis: 'transferred' })]);
    }
  });

  it('stapelt die Staffel quer zum Verlauf, eine halbe Teilung zu jeder Seite', () => {
    const drawn = drawFreestanding({ kind: 'line', line: 'boundary-with-strength', path: PATH, strength: 'staffel' });
    const marks = circlesOf(drawn.children).map((c) => [c.cx, c.cy, c.r]);
    expect(marks).toEqual([[24, 17.5, 1], [24, 14.5, 1]]);
    // Senkrechter Verlauf: der Stapel liegt waagerecht.
    const vertical = drawFreestanding({
      kind: 'line', line: 'boundary-with-strength', path: { points: [[16, 1], [16, 47]] }, strength: 'staffel',
      canvasMm: { width: 32, height: 48 },
    });
    expect(circlesOf(vertical.children).map((c) => [c.cx, c.cy])).toEqual([[14.5, 24], [17.5, 24]]);
  });

  it('hält die Stärke an anderen Linien und die Pflicht an 2.20 als Systematik', () => {
    expect(validateFreestandingSpec({ kind: 'line', line: 'boundary-section', path: PATH, strength: 'zug' }).map((i) => i.rule))
      .toEqual(['line-strength-mismatch']);
    expect(validateFreestandingSpec({ kind: 'line', line: 'boundary-with-strength', path: PATH }).map((i) => i.rule))
      .toEqual(['line-strength-mismatch']);
  });
});
