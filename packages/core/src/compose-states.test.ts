/**
 * Zustände aus Kapitel 5.8 an einem Zeichen (LFH-577): `compose()` legt `SymbolSpec.states` und
 * `tendency` über `placeStates()` an den Träger. Geprüft über `drawSymbol`, also mit der
 * Standardbelegung — die Zustandszeichnungen sind kein Port, sondern vermessene Daten in `core`.
 *
 * Gegen das Kennzahlenartefakt stehen dieselben Zusammenstellungen in
 * `conformance/src/state-spec-fixtures.test.ts`; `core` darf das Prüfpaket nicht importieren.
 */
import type { Drawing, Primitive, SymbolSpec } from '@einsatzzeichen/schema';
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

describe('compose() mit Zuständen — abgeleitet, wo die Referenz die Zusammenstellung nicht zeigt', () => {
  // Seit der Entscheidung vom 02.10.2026 zeichnet der Motor jede Zusammenstellung der Systematik;
  // Lagen und Maße der Ableitung prüft `derive/states.test.ts`, hier nur der öffentliche Weg.
  function derived(spec: SymbolSpec): Drawing {
    const drawing = drawSymbol(spec);
    expect(drawing.derivations?.length, JSON.stringify(spec)).toBeGreaterThan(0);
    expect(checkViewBox(drawing).filter((issue) => drawing.children[viewBoxIndex(issue.primitive)]?.role !== 'foot'), JSON.stringify(spec)).toEqual([]);
    body(drawing.children);
    return drawing;
  }

  test('zeichnet jede Tendenz rechts neben dem verkleinerten Träger', () => {
    const drawing = derived({ kind: 'person', tendency: 'tendency-rising' });
    expect(drawing.derivations?.some((note) => note.dimension === 'tendency')).toBe(true);
    expect(drawing.viewBox.width).toBeGreaterThan(32);
  });

  test('zeichnet Werte ohne Trägerbeleg in Randlage oder Körperlage', () => {
    for (const value of ['damaged', 'incipient-fire', 'route-closed', 'explosion-hazard'] as const) {
      const kind = value === 'explosion-hazard' ? 'person' : 'formation';
      derived({ kind, states: [value] });
    }
  });

  test('zeichnet einen Hinweis an der abgesenkten Raute der Wassergefahr', () => {
    derived({ kind: 'person', states: ['person-in-water-danger', 'acute-situation'] });
  });

  test('zeichnet den Personenzustand an der abgesenkten Personenfassung', () => {
    const drawing = derived({
      kind: 'person',
      bodyVariant: 'compact-person-diamond-26mm-lowered-2mm',
      states: ['person-injured'],
    });
    // Dieselbe Raute wie 5.8.8.3, um die 2 mm der Fassung abgesenkt.
    expect(boundsOfMm(body(drawing.children))).toEqual({ minX: 3, minY: 5, maxX: 29, maxY: 31 });
  });

  /**
   * Der Träger in seiner Zustandsfassung ersetzt den Körper; Farbe, Kopf, Fuß, Beschriftung und
   * Marken wandern mit ihm. Kein Original zeigt das — abgeleitet und gekennzeichnet.
   */
  test('zeichnet jede weitere Angabe neben einem Zustand mit', () => {
    const base = { kind: 'person', states: ['person-injured'] } as const satisfies SymbolSpec;
    for (const extra of [
      { organization: 'feuerwehr' },
      { technicalFill: 'rot' },
      { strength: 'trupp' },
      { designation: 'A' },
      { labels: { center: 'A' } },
      // Seit LFH-587 lehnt `validateSpec` Boxfähigkeiten ab, die an der Person nicht im Körper
      // bleiben (`capabilities-pictogram-overflows-body`); Schaummittel bleibt.
      { capabilities: ['foam-agent'] },
    ] satisfies Partial<SymbolSpec>[]) {
      const drawing = derived({ ...base, ...extra });
      expect(drawing.viewBox, JSON.stringify(extra)).toEqual({ width: 32, height: 32 });
    }
  });

  test('füllt die Raute des Personenzustands mit der Organisationsfarbe', () => {
    const drawing = derived({ kind: 'person', organization: 'thw', states: ['person-injured'] });
    expect(body(drawing.children).style).toMatchObject({ fill: 'blau', bodyStrokeDashToken: 'blau' });
    expect(boundsOfMm(body(drawing.children))).toEqual({ minX: 3, minY: 3, maxX: 29, maxY: 29 });
  });

  test('lässt die Körpermarke an der Person weiter an ihrer eigenen Lücke scheitern', () => {
    // Die Pflegemarke ist an der Person ohne Zustand nicht vermessen; das ist keine Lücke der
    // Zustände und wird hier nicht überdeckt.
    expect(() => drawSymbol({ kind: 'person', bodyMarks: ['care'] })).toThrow(NotMeasuredError);
    expect(() => drawSymbol({ kind: 'person', states: ['person-injured'], bodyMarks: ['care'] }))
      .toThrow(NotMeasuredError);
  });

  test('legt den Schadensgrad an der gefärbten Formation auf den Körper', () => {
    const drawing = derived({ kind: 'formation', organization: 'thw', states: ['damaged'] });
    expect(drawing.viewBox).toEqual({ width: 32, height: 32 });
  });

  test('zeichnet vermessene Zusammenstellungen ohne Ableitungsnotiz', () => {
    for (const spec of [
      { kind: 'person', states: ['person-injured'] },
      { kind: 'person', states: ['person-injured', 'suspected-situation'] },
      { kind: 'hazard', states: ['acute-situation'] },
    ] satisfies SymbolSpec[]) {
      expect(drawSymbol(spec).derivations, JSON.stringify(spec)).toBeUndefined();
    }
  });
});

function viewBoxIndex(path: string): number {
  const match = /^children\[(\d+)\]/u.exec(path);
  return match === null ? -1 : Number(match[1]);
}

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

  test('bietet am Formationskörper jeden Zustand außer Personenzustand und Taktik an, abgeleitet', () => {
    const options = vocabulary({ kind: 'formation' }, 'states');
    const allowed = options.filter((option) => option.status === 'allowed');
    expect(allowed.map((option) => option.value)).toContain('suspected-situation');
    expect(allowed.map((option) => option.value)).toContain('damaged');
    expect(allowed.map((option) => option.value)).not.toContain('person-injured');
    expect(allowed.map((option) => option.value)).not.toContain('tactical-attack');
    expect(allowed.every((option) => option.derived === true)).toBe(true);
  });
});
