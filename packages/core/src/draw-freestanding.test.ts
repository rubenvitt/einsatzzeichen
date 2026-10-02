import type { FreestandingSpec } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { drawSymbol } from './default-ports.js';
import {
  FREESTANDING_DEFAULT_CANVAS_MM,
  describeFreestandingSpec,
  drawAnySpec,
  drawFreestanding,
} from './draw-freestanding.js';
import { animalStateDrawing } from './geometry/animal-state.js';
import { lineDrawing, movementDrawing } from './geometry/parametric.js';
import { weatherDrawing } from './geometry/weather.js';
import { CompositionError } from './validate.js';

const ARROW_PATH = { points: [[2, 16], [30, 16]] } as const;
const LINE_PATH = { points: [[1, 16], [47, 16]] } as const;

describe('drawFreestanding', () => {
  it('zeichnet einen Pfeil wie movementDrawing, auf der Fläche der Referenz', () => {
    const drawn = drawFreestanding({ kind: 'movement', movement: 'directed-movement', path: ARROW_PATH });
    const direct = movementDrawing('directed-movement', { path: ARROW_PATH }, { width: 32, height: 32 });
    expect(drawn.viewBox).toEqual({ width: 32, height: 32 });
    expect(drawn.children).toEqual(direct.children);
  });

  it('zeichnet eine Linie wie lineDrawing, auf der Fläche der Referenz oder einer eigenen', () => {
    const spec: FreestandingSpec = { kind: 'line', line: 'boundary-with-strength', path: LINE_PATH, strength: 'zug' };
    const direct = lineDrawing('boundary-with-strength', { path: LINE_PATH, strength: 'zug' }, { width: 48, height: 32 });
    expect(drawFreestanding(spec).viewBox).toEqual({ width: 48, height: 32 });
    expect(drawFreestanding(spec).children).toEqual(direct.children);
    expect(drawFreestanding({ ...spec, canvasMm: { width: 60, height: 40 } }).viewBox).toEqual({ width: 60, height: 40 });
  });

  it('zeichnet Wetter und Tierzustand wie ihre Zeichenfunktionen', () => {
    const weather = { values: ['weather-cloudy', 'weather-snowing'], intensity: 'strong' } as const;
    expect(drawFreestanding({ kind: 'weather', ...weather }).children).toEqual(weatherDrawing(weather).children);
    const animal = { state: 'contaminated-animal', variant: 'alternative' } as const;
    expect(drawFreestanding({ kind: 'animal-state', ...animal }).children).toEqual(animalStateDrawing(animal).children);
  });

  it('nennt die Flächen der Referenz als Vorgabe', () => {
    expect(FREESTANDING_DEFAULT_CANVAS_MM).toEqual({ movement: { width: 32, height: 32 }, line: { width: 48, height: 32 } });
  });

  it('lehnt einen Regelverstoß als CompositionError mit Regel-ID ab, vor dem Zeichnen', () => {
    let caught: unknown;
    try {
      drawFreestanding({ kind: 'line', line: 'boundary-section', path: LINE_PATH, strength: 'zug' });
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(CompositionError);
    expect((caught as CompositionError).issues.map((issue) => issue.rule)).toEqual(['line-strength-mismatch']);
  });

  it('meldet eine Ableitung an der Zeichnung statt einer Vermessungslücke', () => {
    // Bis zum 02.10.2026 ein `NotMeasuredError`; seither ein konstruiertes Paar mit Notiz.
    const drawn = drawFreestanding({ kind: 'weather', values: ['weather-sunny', 'weather-windy'] });
    expect(drawn.derivations).toEqual([expect.objectContaining({ dimension: 'values', basis: 'constructed' })]);
    // Vermessene Zeichen bleiben ohne Feld.
    expect(drawFreestanding({ kind: 'weather', values: ['weather-sunny'] }).derivations).toBeUndefined();
  });

  it('erfindet keinen Titel und leitet die Beschreibung aus der Spec ab', () => {
    const spec: FreestandingSpec = { kind: 'animal-state', state: 'dead-animal' };
    const drawn = drawFreestanding(spec);
    expect(drawn.title).toBeUndefined();
    expect(drawn.description).toBe(describeFreestandingSpec(spec));
    expect(drawFreestanding(spec, { title: 'Totes Rind', description: 'eigene' })).toMatchObject({
      title: 'Totes Rind',
      description: 'eigene',
    });
  });
});

describe('describeFreestandingSpec', () => {
  it('beschreibt jede Art in Worten statt Kennungen', () => {
    expect(describeFreestandingSpec({ kind: 'movement', movement: 'directed-movement', path: ARROW_PATH })).toBe(
      'Pfeil: Gerichtete Bewegung',
    );
    expect(describeFreestandingSpec({ kind: 'line', line: 'boundary-with-strength', path: LINE_PATH, strength: 'zug' })).toBe(
      'Linie: Grenze mit taktischer Stärke, Stärke: Zug',
    );
    expect(describeFreestandingSpec({ kind: 'line', line: 'escape-route', path: LINE_PATH, variant: 'alternative' })).toBe(
      'Linie: Escape Route, zweite Darstellung',
    );
    expect(
      describeFreestandingSpec({ kind: 'weather', values: ['weather-cloudy', 'weather-snowing'], intensity: 'moderate' }),
    ).toBe('Wetter: Wolkig, Schneiend, Intensität: mittel');
    expect(describeFreestandingSpec({ kind: 'animal-state', state: 'contaminated-animal', variant: 'alternative' })).toBe(
      'Tierzustand: Kontaminiertes Tier, zweite Darstellung',
    );
  });
});

describe('drawAnySpec', () => {
  it('zeichnet eine SymbolSpec über drawSymbol und ein freistehendes Zeichen über drawFreestanding', () => {
    expect(drawAnySpec({ kind: 'formation', strength: 'gruppe' })).toEqual(drawSymbol({ kind: 'formation', strength: 'gruppe' }));
    const spec: FreestandingSpec = { kind: 'weather', values: ['weather-sunny'] };
    expect(drawAnySpec(spec)).toEqual(drawFreestanding(spec));
  });
});
