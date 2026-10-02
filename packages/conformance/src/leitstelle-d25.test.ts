import { describe, expect, it } from 'vitest';
import { PALETTE, type Primitive, type SymbolSpec } from '@einsatzzeichen/schema';
import { ARIMO_CAP_HEIGHT_FRACTION, matchFingerprint, pictogram } from '@einsatzzeichen/core';
import { comparableFingerprint } from './comparison-exceptions.js';
import { fingerprintFor } from './fingerprint-index.js';
import { composeFromCatalog } from './recipes.js';

/**
 * Die Leitstelle D.2.5 als `SymbolSpec` (2. Oktober 2026). Bis dahin gab es sie nur als
 * Piktogramm `leadership.control-center`; das Rezeptsystem führt D.2.5 weiter über dieses
 * Piktogramm (Manifest, Fachreview, Leadership-Inventar), deshalb steht der Vergleich hier als
 * eigener Fixture-Test und nicht als zweites Rezept derselben Referenz.
 *
 * Verglichen wird gegen das Kennwertartefakt der Referenz (`fingerprints.json`: Kreis (4|6)–(28|30)
 * gelb, „L“ von y 14,698 bis zur Grundlinie 22) und gegen die Geometrie des Piktogramms, das in
 * seiner eigenen Suite gegen dieselbe Referenz gegatet ist (Giebel, Kappe).
 */
const D25_SPEC: SymbolSpec = {
  kind: 'circle-12',
  bodyVariant: 'raised-gable',
  organization: 'fuehrung-leitung',
  bodyMarks: ['circle-solid-cap-4mm'],
  labels: { center: 'LtS', centerCapHeightMm: 7.3, centerBaselineFromBodyBottomMm: 8 },
};

const ASSET = 'D.2.5_Leitstelle.svg';

function numbers(d: string): number[] {
  return [...d.matchAll(/-?\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
}

describe('D.2.5 Leitstelle als SymbolSpec', () => {
  const drawing = composeFromCatalog(D25_SPEC, 'Leitstelle');
  const reference = pictogram('leadership.control-center');

  it('trifft die Körperhülle der Referenz', () => {
    const comparable = comparableFingerprint(fingerprintFor(ASSET));
    expect(matchFingerprint(drawing, comparable.fingerprint, comparable.options).ok).toBe(true);
  });

  it('füllt den Kreis in der gelben Referenzfarbe und schreibt schwarz', () => {
    const body = drawing.children.find((child) => child.role === 'body');
    expect(body?.style?.fill).toBe('gelb');
    expect(fingerprintFor(ASSET).fills).toContain(PALETTE.gelb);
    const run = drawing.children.find((child) => child.type === 'text');
    expect(run?.style?.fill).toBe('schwarz');
  });

  it('trägt Kreis, Giebel und Kappe wie das gegatete Piktogramm', () => {
    const circle = drawing.children.find((child) => child.role === 'body');
    expect(circle).toMatchObject({ type: 'circle', cx: 16, cy: 18, r: 12 });
    const gable = drawing.children.find((child) => child.role === 'bodyExtra');
    const roof = reference.primitives.find((child) => child.type === 'polyline');
    expect(gable?.type === 'polyline' && gable.points).toEqual(roof?.type === 'polyline' && roof.points);

    const cap = drawing.children.find(
      (child): child is Extract<Primitive, { type: 'path' }> => child.type === 'path',
    );
    const referenceCap = reference.primitives.find(
      (child): child is Extract<Primitive, { type: 'path' }> => child.type === 'path',
    );
    if (cap === undefined || referenceCap === undefined) throw new Error('Kappe fehlt.');
    const ours = numbers(cap.d);
    const theirs = numbers(referenceCap.d);
    expect(ours).toHaveLength(theirs.length);
    ours.forEach((value, index) => expect(Math.abs(value - theirs[index]!)).toBeLessThan(0.002));
  });

  it('setzt den Lauf auf die gemessene Grundlinie 22 mit Versalhöhe 7,30', () => {
    const run = drawing.children.find(
      (child): child is Extract<Primitive, { type: 'text' }> => child.type === 'text',
    );
    const letter = fingerprintFor(ASSET).shapes.find((shape) => shape.kind === 'outline');
    expect(run?.y).toBe(letter?.boundsMm.maxYMm);
    expect(run!.sizeMm * ARIMO_CAP_HEIGHT_FRACTION).toBeCloseTo(
      letter!.boundsMm.maxYMm - letter!.boundsMm.minYMm,
      2,
    );
  });

  it('ist vollständig vermessen: keine Ableitungsnotiz', () => {
    expect(drawing.derivations).toBeUndefined();
  });

  it('zeichnet die Probe des Eigentümers mit LST und UEL sauber, abgeleitet', () => {
    const probe = composeFromCatalog({
      ...D25_SPEC,
      labels: { center: 'LST', bottomRight: 'UEL' },
    });
    const runs = probe.children.filter(
      (child): child is Extract<Primitive, { type: 'text' }> => child.type === 'text',
    );
    expect(runs.map((run) => [run.content, run.style?.fill])).toEqual([
      ['LST', 'schwarz'],
      ['UEL', 'schwarz'],
    ]);
    expect(probe.derivations?.map((note) => note.dimension)).toEqual([
      'labels.center',
      'labels.corner',
    ]);
  });
});
