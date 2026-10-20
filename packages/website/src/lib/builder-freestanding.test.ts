import { describe, expect, it } from 'vitest';
import { checkAnySpec, referenceMovementSpec, renderSvg } from '@einsatzzeichen/core';
import {
  FREESTANDING_KINDS,
  PICTOGRAM_IDS,
  type FreestandingSpec,
  type LineSpec,
  type MovementSpec,
} from '@einsatzzeichen/schema';
import {
  FREESTANDING_FIELDS,
  PICTOGRAM_SPACE_LABELS,
  defaultFreestandingSpec,
  freestandingKindPreviews,
  probeFreestanding,
  reduceFreestanding,
} from './builder-freestanding.js';
import { decodeAnySpec, encodeAnySpec, evaluateAnySpec } from './builder-state.js';

/** Zeichnet die Spec und wirft mit der Spec in der Meldung, wenn sie nicht trägt. */
function drawn(spec: FreestandingSpec) {
  const result = checkAnySpec(spec);
  if (!result.ok) throw new Error(`${JSON.stringify(spec)} zeichnet nicht: ${JSON.stringify(result)}`);
  return result.drawing;
}

describe('Ausgangsauswahl je Art (ESZ-135)', () => {
  it.each(FREESTANDING_KINDS)('„%s“ lässt sich bauen, exportieren und per Link teilen', (kind) => {
    const spec = defaultFreestandingSpec(kind);
    expect(spec.kind).toBe(kind);
    // Exportieren: dieselbe Kette wie „SVG herunterladen“ im Panel.
    expect(renderSvg(drawn(spec), { idPrefix: 'test' }).startsWith('<svg')).toBe(true);
    // Teilen: der Link liest genau diese Spec zurück.
    expect(decodeAnySpec(encodeAnySpec(spec))).toEqual(spec);
  });

  it('hat für jede Art eine Kachel-Miniatur', () => {
    const previews = freestandingKindPreviews();
    for (const kind of FREESTANDING_KINDS) expect(previews.get(kind), kind).not.toBeNull();
  });
});

describe('Jeder Wert jedes Feldes', () => {
  it('ist zeichenbar oder mit Regel und Erklärung gesperrt, nie ein Abbruch', () => {
    for (const kind of FREESTANDING_KINDS) {
      const spec = defaultFreestandingSpec(kind);
      const probes = probeFreestanding(spec);
      for (const definition of FREESTANDING_FIELDS[kind]) {
        const probe = probes.get(definition.field);
        expect(probe?.size, `${kind}.${definition.field}`).toBe(definition.options.length);
        for (const option of definition.options) {
          const entry = probe?.get(option.id);
          const where = `${kind}.${definition.field}=${option.id}`;
          if (entry?.ok === true) {
            const set = (spec as { values?: string[] }).values ?? [];
            const value =
              definition.shape !== 'list' ? option.id : set.includes(option.id) ? set : [...set, option.id];
            drawn(reduceFreestanding(spec, definition.field, value));
          } else {
            expect(entry?.blocked?.because, where).toBe('rule');
            expect(entry?.issues.length, where).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('macht jeden Pfeil und jede Linie wählbar, auch die mit eigenem Verlauf oder Pflichtstärke', () => {
    const movement = probeFreestanding(defaultFreestandingSpec('movement')).get('movement');
    expect([...(movement?.values() ?? [])].filter((entry) => !entry.ok)).toEqual([]);
    const line = probeFreestanding(defaultFreestandingSpec('line')).get('line');
    expect([...(line?.values() ?? [])].filter((entry) => !entry.ok)).toEqual([]);
  });

  it('bietet jedes Piktogramm des Registers an und ordnet es einem benannten Abschnitt zu', () => {
    const field = FREESTANDING_FIELDS.pictogram.find((definition) => definition.field === 'pictogram');
    expect(field?.options.map((option) => option.id)).toEqual([...PICTOGRAM_IDS]);
    const spaces = new Set(PICTOGRAM_IDS.map((id) => id.slice(0, id.indexOf('.'))));
    for (const space of spaces) expect(PICTOGRAM_SPACE_LABELS[space], space).toBeDefined();
  });

  it('sperrt einen Zustand im Piktogrammraum und nennt die kanonische Art', () => {
    const probe = probeFreestanding(defaultFreestandingSpec('pictogram')).get('pictogram');
    const entry = probe?.get('state.tactical-rescue');
    expect(entry?.ok).toBe(false);
    expect(entry?.issues[0]?.rule).toBe('pictogram-not-canonical');
  });
});

describe('reduceFreestanding()', () => {
  it('nimmt beim Pfeilwechsel den Verlauf der Referenz mit', () => {
    const start = referenceMovementSpec('directed-movement');
    const gathering = reduceFreestanding(start, 'movement', 'gathering') as MovementSpec;
    expect(gathering.path).toEqual(referenceMovementSpec('gathering').path);
    drawn(gathering);
    const back = reduceFreestanding(gathering, 'movement', 'directed-movement') as MovementSpec;
    expect(back).toEqual(start);
  });

  it('behält einen eigenen Verlauf aus einem Link', () => {
    const own: MovementSpec = {
      kind: 'movement',
      movement: 'directed-movement',
      path: { points: [[4, 16], [28, 16]] },
    };
    expect((reduceFreestanding(own, 'movement', 'start-of-action') as MovementSpec).path).toEqual(
      own.path,
    );
  });

  it('meldet einen Wert, den der eigene Verlauf nicht trägt, als Verlaufssperre', () => {
    // Bis x 30: der Ring von „Sammeln“ ragte bei diesem Verlauf aus der 32-mm-Fläche.
    const own: MovementSpec = {
      kind: 'movement',
      movement: 'directed-movement',
      path: { points: [[3, 16], [30, 16]] },
    };
    expect(probeFreestanding(own).get('movement')?.get('gathering')?.blocked?.because).toBe('path');
  });

  it('setzt an 2.20 die Stärke der Referenz und nimmt sie beim Wechsel wieder weg', () => {
    const start = defaultFreestandingSpec('line');
    const withStrength = reduceFreestanding(start, 'line', 'boundary-with-strength') as LineSpec;
    expect(withStrength.strength).toBe('zug');
    drawn(withStrength);
    const other = reduceFreestanding(withStrength, 'line', 'boundary-section') as LineSpec;
    expect('strength' in other).toBe(false);
    drawn(other);
  });

  it('nimmt die zweite Darstellung nur an 2.14 mit', () => {
    const escape = reduceFreestanding(defaultFreestandingSpec('line'), 'line', 'escape-route');
    const alternative = reduceFreestanding(escape, 'variant', 'alternative') as LineSpec;
    drawn(alternative);
    expect('variant' in reduceFreestanding(alternative, 'line', 'fire-spread')).toBe(false);
    expect('variant' in reduceFreestanding(alternative, 'variant', undefined)).toBe(false);
  });

  it('lässt das Wetter nie ohne Wert', () => {
    const sunny = defaultFreestandingSpec('weather');
    expect(reduceFreestanding(sunny, 'values', [])).toBe(sunny);
    const snowing = reduceFreestanding(
      reduceFreestanding(sunny, 'values', ['weather-cloudy', 'weather-snowing']),
      'intensity',
      'strong',
    );
    drawn(snowing);
  });
});

describe('evaluateAnySpec()', () => {
  it('erklärt eine abgelehnte freistehende Spec wie eine SymbolSpec', () => {
    const result = evaluateAnySpec({ kind: 'state', state: 'sick-animal' });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.unexplained).toEqual([]);
    expect(result.issues[0]?.rule).toBe('state-not-canonical');
  });
});
