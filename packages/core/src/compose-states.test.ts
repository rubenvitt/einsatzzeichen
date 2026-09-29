/**
 * Zustände aus Kapitel 5.8 an einem Zeichen (LFH-577): `compose()` legt `SymbolSpec.states` und
 * `tendency` über `placeStates()` an den Träger. Geprüft über `drawSymbol`, also mit der
 * Standardbelegung — die Zustandszeichnungen sind kein Port, sondern vermessene Daten in `core`.
 *
 * Gegen das Kennzahlenartefakt stehen dieselben Zusammenstellungen in
 * `conformance/src/state-spec-fixtures.test.ts`; `core` darf das Prüfpaket nicht importieren.
 */
import type { Primitive, SymbolSpec } from '@einsatzzeichen/schema';
import { describe, expect, test } from 'vitest';
import { boundsOfMm } from './bounds.js';
import { drawSymbol } from './default-ports.js';
import { placeStates } from './layout/state-placement.js';
import { NotMeasuredError } from './not-measured.js';
import { checkViewBox } from './viewbox-gate.js';
import { checkSpec, vocabulary } from './vocabulary.js';

function body(children: readonly Primitive[]): Primitive {
  const found = children.filter((child) => child.role === 'body');
  expect(found).toHaveLength(1);
  return found[0] as Primitive;
}

function notMeasured(spec: SymbolSpec): NotMeasuredError {
  try {
    drawSymbol(spec);
  } catch (error) {
    if (error instanceof NotMeasuredError) return error;
    throw error;
  }
  throw new Error(`drawSymbol hat gezeichnet statt abzulehnen: ${JSON.stringify(spec)}`);
}

describe('compose() mit Zuständen', () => {
  test('ersetzt den Personenkörper durch die Raute des Personenzustands', () => {
    const drawing = drawSymbol({ kind: 'person', states: ['person-injured'] });
    expect(drawing.viewBox).toEqual({ width: 32, height: 32 });
    expect(boundsOfMm(body(drawing.children))).toEqual({ minX: 3, minY: 3, maxX: 29, maxY: 29 });
    const placement = placeStates({ carrier: { kind: 'person' }, states: ['person-injured'] });
    // Genau die Teile aus placeStates, in ihrer Reihenfolge; der Träger trägt die Rolle des Körpers.
    expect(drawing.children).toEqual([
      { ...placement.carrier?.primitives[0], role: 'body' },
      ...placement.parts.flatMap((part) => part.primitives),
    ]);
    expect(checkViewBox(drawing)).toEqual([]);
  });

  test('setzt einen Personenzustand in seiner angehobenen Rautenlage (5.8.8.12)', () => {
    const drawing = drawSymbol({ kind: 'person', states: ['person-to-be-transported'] });
    expect(boundsOfMm(body(drawing.children))).toEqual({ minX: 3, minY: 1, maxX: 29, maxY: 27 });
  });

  test('verbreitert die Fläche für den Hinweis an der Person auf 36 × 32 mm (5.8.1 Beispiel 3)', () => {
    const drawing = drawSymbol({ kind: 'person', states: ['person-injured', 'suspected-situation'] });
    expect(drawing.viewBox).toEqual({ width: 36, height: 32 });
    expect(boundsOfMm(body(drawing.children))).toEqual({ minX: 11, minY: 6, maxX: 31, maxY: 26 });
    expect(checkViewBox(drawing)).toEqual([]);
  });

  test('hängt die Reihenfolge der Zustände nicht an die Zeichnung', () => {
    expect(drawSymbol({ kind: 'person', states: ['suspected-situation', 'person-injured'] }).children)
      .toEqual(drawSymbol({ kind: 'person', states: ['person-injured', 'suspected-situation'] }).children);
  });

  test('setzt den Hinweis an der Gefahr neben das verkleinerte Dreieck (5.8.1.13_2, 5.8.1.14_2)', () => {
    for (const hint of ['suspected-situation', 'acute-situation'] as const) {
      const drawing = drawSymbol({ kind: 'hazard', states: [hint] });
      expect(drawing.viewBox, hint).toEqual({ width: 32, height: 32 });
      expect(boundsOfMm(body(drawing.children)), hint).toEqual({ minX: 7.5, minY: 6, maxX: 30.5, maxY: 25 });
    }
  });

  test('zeichnet ohne Zustände wie bisher, auch mit leerer Liste', () => {
    expect(drawSymbol({ kind: 'person', states: [] })).toEqual(drawSymbol({ kind: 'person' }));
  });

  test('beschreibt die Zustände in der vorgelesenen Beschreibung', () => {
    const drawing = drawSymbol({ kind: 'person', states: ['person-injured', 'suspected-situation'] });
    expect(drawing.description).toContain('Zustand: Person verletzt');
    expect(drawing.description).toContain('Zustand: Hinweis auf Vermutung');
  });
});

describe('compose() mit Zuständen — was die Referenz nicht zeigt', () => {
  test('meldet jede Tendenz als nicht vermessenen Wert', () => {
    expect(notMeasured({ kind: 'person', tendency: 'tendency-rising' }).scope).toBe('value');
  });

  test('meldet Werte ohne Lage an einem Träger als nicht vermessenen Wert', () => {
    for (const value of ['damaged', 'incipient-fire', 'route-closed', 'explosion-hazard'] as const) {
      const kind = value === 'explosion-hazard' ? 'person' : 'formation';
      expect(notMeasured({ kind, states: [value] }).scope, value).toBe('value');
    }
  });

  test('meldet einen Hinweis an der abgesenkten Raute als nicht vermessene Kombination', () => {
    expect(notMeasured({ kind: 'person', states: ['person-in-water-danger', 'acute-situation'] }).scope)
      .toBe('combination');
  });

  test('meldet eine andere Personenfassung als nicht vermessene Kombination', () => {
    expect(notMeasured({
      kind: 'person',
      bodyVariant: 'compact-person-diamond-26mm-lowered-2mm',
      states: ['person-injured'],
    }).scope).toBe('combination');
  });

  /**
   * Der Träger in seiner Zustandsfassung ersetzt den Körper, und bei einem Hinweis an der Person
   * rückt die Grundfläche um 4 mm nach rechts. Wie Kopf, Fuß, Beschriftung, Farbe oder Marken
   * dann mitwandern, zeigt kein Original — abgelehnt statt geraten.
   */
  test('lehnt jede weitere Angabe neben einem Zustand als nicht vermessene Kombination ab', () => {
    const base = { kind: 'person', states: ['person-injured'] } as const satisfies SymbolSpec;
    for (const extra of [
      { organization: 'feuerwehr' },
      { technicalFill: 'rot' },
      { strength: 'trupp' },
      { designation: 'A' },
      { labels: { center: 'A' } },
      { capabilities: ['fire-fighting'] },
      { bodyMarks: ['care'] },
    ] satisfies Partial<SymbolSpec>[]) {
      const error = notMeasured({ ...base, ...extra });
      expect(error.scope, JSON.stringify(extra)).toBe('combination');
      expect(error.message, JSON.stringify(extra)).toContain(Object.keys(extra)[0] as string);
    }
  });

  test('meldet den Wert vor der Kombination: die weitergehende Aussage gewinnt', () => {
    expect(notMeasured({ kind: 'formation', organization: 'thw', states: ['damaged'] }).scope).toBe('value');
  });
});

describe('Zustände in checkSpec und vocabulary', () => {
  test('gibt Wetter in states als Regel zurück, nicht als Programmfehler', () => {
    const result = checkSpec({ kind: 'person', states: ['weather-sunny'] });
    expect(result.ok).toBe(false);
    expect(result.ok === false && result.reason === 'rule' ? result.issues.map((i) => i.rule) : [])
      .toEqual(['state-value-not-attachable']);
  });

  test('prüft jeden Zustand als Kandidaten, ohne zu werfen', () => {
    const options = vocabulary({ kind: 'person' }, 'states');
    const allowed = options.filter((option) => option.status === 'allowed').map((o) => o.value);
    expect(allowed).toContain('person-injured');
    expect(allowed).toContain('suspected-situation');
    expect(allowed).not.toContain('weather-sunny');
  });

  test('bietet am Formationskörper keinen Zustand an', () => {
    const options = vocabulary({ kind: 'formation' }, 'states');
    expect(options.filter((option) => option.status === 'allowed')).toEqual([]);
  });
});
