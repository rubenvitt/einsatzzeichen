import { describe, expect, it } from 'vitest';
import type { AnySpec, FreestandingSpec, SymbolSpec } from '@einsatzzeichen/schema';
import {
  SpecParseError,
  canonicalAnySpec,
  decodeAnySpecParam,
  decodeSpecParam,
  encodeAnySpecParam,
  encodeSpecParam,
  parseAnySpec,
  parseSpec,
  serializeAnySpec,
  serializeSpec,
} from './spec-codec.js';

/** Fängt den erwarteten `SpecParseError`, damit Pfad und Meldung prüfbar sind. */
function parseError(input: unknown): SpecParseError {
  try {
    parseAnySpec(input);
  } catch (error) {
    if (error instanceof SpecParseError) return error;
    throw error;
  }
  throw new Error('parseAnySpec hat nicht abgelehnt.');
}

const movement: FreestandingSpec = {
  kind: 'movement',
  movement: 'directed-movement',
  path: { points: [[2, 16], [30, 16]] },
};

const EXAMPLES: readonly AnySpec[] = [
  { kind: 'formation', strength: 'gruppe', organization: 'feuerwehr' },
  movement,
  { kind: 'movement', movement: 'gathering', path: { start: [2, 16], directionDeg: 0, lengthMm: 24 }, canvasMm: { width: 40, height: 32 } },
  { kind: 'line', line: 'boundary-with-strength', path: { points: [[1, 16], [24, 10], [47, 16]] }, strength: 'zug' },
  { kind: 'line', line: 'escape-route', path: { points: [[1, 18], [23, 6], [47, 26]] }, variant: 'alternative' },
  { kind: 'weather', values: ['weather-snowing', 'weather-cloudy'], intensity: 'extreme' },
  { kind: 'animal-state', state: 'contaminated-animal', variant: 'alternative' },
];

describe('serializeAnySpec', () => {
  it('schreibt eine SymbolSpec genau wie serializeSpec', () => {
    const spec: SymbolSpec = { kind: 'formation', strength: 'gruppe' };
    expect(serializeAnySpec(spec)).toBe(serializeSpec(spec));
  });

  it('legt ein freistehendes Zeichen unter einen eigenen Schlüssel der Hülle, Schlüssel sortiert', () => {
    expect(serializeAnySpec(movement)).toBe(
      '{"v":1,"freestanding":{"kind":"movement","movement":"directed-movement","path":{"points":[[2,16],[30,16]]}}}',
    );
    expect(serializeAnySpec({ kind: 'weather', intensity: 'weak', values: ['weather-cloudy', 'weather-snowing'] })).toBe(
      '{"v":1,"freestanding":{"intensity":"weak","kind":"weather","values":["weather-cloudy","weather-snowing"]}}',
    );
  });

  it('übersteht die Rundreise über JSON und URL für jede Art', () => {
    for (const spec of EXAMPLES) {
      expect(parseAnySpec(serializeAnySpec(spec)), JSON.stringify(spec)).toEqual(canonicalAnySpec(spec));
      expect(decodeAnySpecParam(encodeAnySpecParam(spec)), JSON.stringify(spec)).toEqual(canonicalAnySpec(spec));
    }
  });

  it('schreibt nicht, was es nicht wieder läse', () => {
    expect(() => serializeAnySpec({ ...movement, path: { points: [[2, 16]] } } as unknown as AnySpec)).toThrow(SpecParseError);
  });
});

describe('parseAnySpec', () => {
  it('liest die bisherigen Formen der SymbolSpec wie parseSpec', () => {
    const spec: SymbolSpec = { kind: 'vehicle-land', organization: 'thw' };
    expect(parseAnySpec(serializeSpec(spec))).toEqual(parseSpec(serializeSpec(spec)));
    expect(parseAnySpec(JSON.stringify(spec))).toEqual(spec);
    expect(decodeAnySpecParam(encodeSpecParam(spec))).toEqual(decodeSpecParam(encodeSpecParam(spec)));
  });

  it('liest ein freistehendes Zeichen auch ohne Hülle, am Feld kind erkannt', () => {
    expect(parseAnySpec({ kind: 'animal-state', state: 'dead-animal' })).toEqual({ kind: 'animal-state', state: 'dead-animal' });
  });

  it('lässt parseSpec ein freistehendes Zeichen weiter ablehnen (fail-closed)', () => {
    expect(() => parseSpec(serializeAnySpec(movement))).toThrow(/\$\.freestanding: unbekanntes Feld/);
    // Nackt scheitert es am ersten Feld, das die SymbolSpec nicht kennt — nie als Formation gedeutet.
    expect(() => parseSpec(movement)).toThrow(/\$\.movement: unbekanntes Feld/);
    expect(() => parseSpec({ kind: 'weather', values: ['weather-sunny'] })).toThrow(/\$\.values: unbekanntes Feld/);
  });

  it('lehnt eine Hülle mit beiden Schlüsseln ab', () => {
    const error = parseError({ v: 1, spec: { kind: 'formation' }, freestanding: movement });
    expect(error.path).toBe('$');
    expect(error.reason).toMatch(/entweder spec oder freestanding/);
  });

  it('lehnt eine Grundzeichenart unter freestanding und eine freistehende Art unter spec ab', () => {
    expect(parseError({ v: 1, freestanding: { kind: 'formation' } }).path).toBe('$.freestanding.kind');
    expect(parseError({ v: 1, spec: movement }).path).toBe('$.spec.movement');
    expect(parseError({ v: 1, spec: { kind: 'animal-state' } }).path).toBe('$.spec.kind');
    expect(parseError({ v: 1, freestanding: { kind: 'wetter' } }).reason).toMatch(/movement, line, weather, animal-state/);
  });

  it('lehnt unbekannte Felder je Art ab, auch eine Anbindung', () => {
    expect(parseError({ ...movement, anchor: { edge: 'body-bottom' } }).path).toBe('$.anchor');
    expect(parseError({ kind: 'line', line: 'boundary-section', path: movement.path, anchor: {} }).path).toBe('$.anchor');
    expect(parseError({ kind: 'weather', values: ['weather-sunny'], variant: 'alternative' }).path).toBe('$.variant');
  });

  it('verlangt die Pflichtfelder je Art', () => {
    expect(parseError({ kind: 'movement', path: movement.path }).path).toBe('$.movement');
    expect(parseError({ kind: 'line', line: 'boundary-section' }).path).toBe('$.path');
    expect(parseError({ kind: 'animal-state' }).path).toBe('$.state');
  });

  describe('Verlauf', () => {
    it('verlangt genau eine der beiden Schreibweisen', () => {
      const both = { ...movement, path: { points: [[2, 16], [30, 16]], start: [2, 16], directionDeg: 0, lengthMm: 10 } };
      expect(parseError(both).path).toBe('$.path');
      expect(parseError({ ...movement, path: {} }).path).toBe('$.path');
    });

    it('verlangt mindestens zwei Stützpunkte aus je zwei endlichen Zahlen', () => {
      expect(parseError({ ...movement, path: { points: [[2, 16]] } }).path).toBe('$.path.points');
      expect(parseError({ ...movement, path: { points: [[2, 16], [30]] } }).path).toBe('$.path.points[1]');
      expect(parseError({ ...movement, path: { points: [[2, 16], [Number.NaN, 16]] } }).path).toBe('$.path.points[1][0]');
    });

    it('verlangt Anfang, Richtung und eine positive Länge', () => {
      const straight = { start: [2, 16], directionDeg: 0, lengthMm: 10 };
      expect(parseError({ ...movement, path: { ...straight, lengthMm: 0 } }).path).toBe('$.path.lengthMm');
      expect(parseError({ ...movement, path: { ...straight, directionDeg: Number.POSITIVE_INFINITY } }).path).toBe('$.path.directionDeg');
      expect(parseError({ ...movement, path: { start: [2, 16], directionDeg: 0 } }).path).toBe('$.path.lengthMm');
    });
  });

  it('verlangt eine Zeichenfläche mit positiven, endlichen Maßen', () => {
    expect(parseError({ ...movement, canvasMm: { width: 0, height: 32 } }).path).toBe('$.canvasMm.width');
    expect(parseError({ ...movement, canvasMm: { width: 32 } }).path).toBe('$.canvasMm.height');
  });

  it('liest Wetter- und Tierwerte nur aus ihrem eigenen Vorrat', () => {
    expect(parseError({ kind: 'weather', values: [] }).path).toBe('$.values');
    expect(parseError({ kind: 'weather', values: ['weather-sunny', 'sick-animal'] }).path).toBe('$.values[1]');
    expect(parseError({ kind: 'weather', values: ['weather-sunny'], intensity: 'heftig' }).path).toBe('$.intensity');
    expect(parseError({ kind: 'animal-state', state: 'weather-sunny' }).path).toBe('$.state');
    expect(parseError({ kind: 'line', line: 'boundary-section', path: movement.path, strength: 'kompanie' }).path).toBe('$.strength');
  });

  it('prüft die Form, nicht die Regeln', () => {
    // Eine Stärke an der falschen Linie ist eine Regel (`line-strength-mismatch`), kein Formfehler.
    const spec: FreestandingSpec = { kind: 'line', line: 'boundary-section', path: movement.path, strength: 'zug' };
    expect(parseAnySpec(spec)).toEqual(spec);
  });

  it('liest die Hülle mit freestanding im Pfad', () => {
    expect(parseError({ v: 1, freestanding: { ...movement, path: { points: [[2, 16]] } } }).path).toBe('$.freestanding.path.points');
  });
});
