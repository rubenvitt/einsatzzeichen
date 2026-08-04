import { describe, expect, it } from 'vitest';
import type { Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { HEAD_GAP_MM, HEAD_TOP_MARGIN_MM, placeHead, profileFor } from './profiles.js';

const rectBody: Primitive = { type: 'rect', role: 'body', x: 1, y: 6, width: 30, height: 20 };

const halfSide = (15 * Math.SQRT2) / 2;
const diamondBody: Primitive = {
  type: 'rect',
  role: 'body',
  x: 16 - halfSide,
  y: 16 - halfSide,
  width: halfSide * 2,
  height: halfSide * 2,
  transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
};

describe('Layoutprofile', () => {
  it('verwendet 1 mm Abstand und 1 mm oberen Rand', () => {
    expect(HEAD_GAP_MM).toBe(1);
    expect(HEAD_TOP_MARGIN_MM).toBe(1);
  });

  it('kennt den Standardanker jeder Körperform', () => {
    expect(profileFor('formation').defaultAnchorMm).toBe(6);
    expect(profileFor('person').defaultAnchorMm).toBe(1);
    expect(profileFor('post').defaultAnchorMm).toBe(2);
  });

  it('lässt den Körper ohne Kopfzone unverändert', () => {
    const placed = profileFor('formation').place(rectBody, null);
    expect(boundsOfMm(placed)).toEqual(boundsOfMm(rectBody));
  });

  it('setzt die Punktreihe über den Rechteckkörper, ohne ihn zu verschieben', () => {
    // E.1.18 / C.1.2: Reihe 3 mm hoch, oben bei 2 mm, unten bei 5 mm, Körper bleibt bei 6 mm.
    const head = placeHead(profileFor('formation'), 3);
    expect(head).toEqual({ topMm: 2, bottomMm: 5 });
    expect(boundsOfMm(profileFor('formation').place(rectBody, head.bottomMm)).minY).toBeCloseTo(6, 6);
  });

  it('schiebt den Rechteckkörper, wenn der Punktstapel nicht darüber passt', () => {
    // C.1.1 Löschstaffel: Stapel 7 mm hoch, oben bei 1 mm, unten bei 8 mm, Körper bei 9 mm.
    const head = placeHead(profileFor('formation'), 7);
    expect(head).toEqual({ topMm: 1, bottomMm: 8 });
    const bounds = boundsOfMm(profileFor('formation').place(rectBody, head.bottomMm));
    expect(bounds.minY).toBeCloseTo(9, 6);
    expect(bounds.maxY).toBeCloseTo(29, 6);
    expect(bounds.minX).toBeCloseTo(1, 6);
  });

  it('setzt dieselbe Punktreihe am gedrehten Quadrat 1 mm höher', () => {
    // D.3.7: Standardanker 1 mm, Reihe deshalb oben bei 1 mm statt bei 2 mm.
    const head = placeHead(profileFor('person'), 3);
    expect(head).toEqual({ topMm: 1, bottomMm: 4 });
  });

  it('verkleinert das gedrehte Quadrat von oben und hält die Unterkante', () => {
    const bounds = boundsOfMm(profileFor('person').place(diamondBody, 4));
    expect(bounds.minY).toBeCloseTo(5, 3);
    expect(bounds.maxY).toBeCloseTo(31, 3);
    expect(bounds.minX).toBeCloseTo(3, 3);
    expect(bounds.maxX).toBeCloseTo(29, 3);
  });

  it('ordnet jeder Grundzeichenart ein Profil zu', () => {
    expect(profileFor('formation').id).toBe('rect-body');
    expect(profileFor('person').id).toBe('rotated-square-body');
    expect(profileFor('post').id).toBe('circle-body');
  });
});
