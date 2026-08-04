import { describe, expect, it } from 'vitest';
import { boundsOfMm, CompositionError, matchFingerprint } from '@einsatzzeichen/core';
import { fingerprintFor } from './fingerprint-index.js';
import { RECIPES, composeFromCatalog } from './recipes.js';

describe('Kompositionsrezepte', () => {
  it('erzeugt die Löschstaffel mit Körper bei 9 mm', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.1'].spec);
    const body = drawing.children.find((c) => c.role === 'body');
    expect(body).toBeDefined();
    expect(boundsOfMm(body!).minY).toBeCloseTo(9, 6);
    expect(body?.style?.fill).toBe('rot');
  });

  it('reproduziert die Referenz C.1.1 (Löschstaffel)', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.1'].spec);
    const result = matchFingerprint(drawing, fingerprintFor(RECIPES['C.1.1'].referenceAsset));
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('erzeugt die Löschgruppe mit Körper bei 6 mm', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.2'].spec);
    const body = drawing.children.find((c) => c.role === 'body');
    expect(boundsOfMm(body!).minY).toBeCloseTo(6, 6);
  });

  it('reproduziert die Referenz C.1.2 (Löschgruppe)', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.2'].spec);
    const result = matchFingerprint(drawing, fingerprintFor(RECIPES['C.1.2'].referenceAsset));
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('unterscheidet Löschstaffel und Löschgruppe nur in der Stärke', () => {
    const { strength: _a, ...staffel } = RECIPES['C.1.1'].spec;
    const { strength: _b, ...gruppe } = RECIPES['C.1.2'].spec;
    expect(staffel).toEqual(gruppe);
  });

  it('erzeugt den Zugführer mit Spitze bei 5 mm und Unterkante bei 31 mm', () => {
    const drawing = composeFromCatalog(RECIPES['D.3.7'].spec);
    const body = drawing.children.find((c) => c.role === 'body');
    const bounds = boundsOfMm(body!);
    expect(bounds.minY).toBeCloseTo(5, 3);
    expect(bounds.maxY).toBeCloseTo(31, 3);
  });

  it('reproduziert die Referenz D.3.7 (Zugführer der Feuerwehr)', () => {
    const drawing = composeFromCatalog(RECIPES['D.3.7'].spec);
    const result = matchFingerprint(drawing, fingerprintFor(RECIPES['D.3.7'].referenceAsset));
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('setzt die Stärkepunkte als eigene Primitive mit der Rolle head', () => {
    const drawing = composeFromCatalog(RECIPES['C.1.1'].spec);
    expect(drawing.children.filter((c) => c.role === 'head')).toHaveLength(2);
  });

  it('lehnt eine unzulässige Kombination mit erklärendem Fehler ab', () => {
    expect(() => composeFromCatalog({ kind: 'hazard', strength: 'gruppe' })).toThrow(
      CompositionError,
    );
  });
});
