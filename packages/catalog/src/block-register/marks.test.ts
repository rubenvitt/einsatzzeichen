import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BLOCK_REGISTER } from '@einsatzzeichen/core';
import type {
  BlockCategory,
  BlockEntry,
  BodyMarkId,
  CapabilityId,
  FunctionRoleId,
} from '@einsatzzeichen/schema';
import { BODY_MARK_IDS } from '../body-marks.js';
import { functionRole } from '../function-roles.js';
import { pictogram } from '../pictograms/index.js';

/**
 * Laufzeit-Gate des Bausteinregisters für Fähigkeit, Körpermarke und Funktionsfassung (LFH-564).
 * `core` darf `catalog` nicht importieren. Deshalb prüft erst dieser Test, ob sich die Fundorte
 * des Registers wirklich zu Geometrie auflösen: `measured` muss auflösen, alles andere nicht.
 *
 * Körpermarken werden über `BODY_MARK_IDS` geprüft und nicht über `bodyMark()`: der Aufruf
 * verlangt je Marke Körperart, Variante und exakte Hülle. Diese hier zu wiederholen, machte den
 * Test zu einer zweiten Geometriedatenbank. `BODY_MARK_IDS` ist aus denselben Tabellen gefiltert,
 * die `bodyMark()` befragt.
 */

const packagesRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const CATEGORIES = ['capability', 'body-mark', 'function-role'] as const satisfies readonly BlockCategory[];

/** Die Katalogresolver je Kategorie. `pictogram()` und `functionRole()` werfen bei fehlender Definition. */
const RESOLVERS: Readonly<Record<(typeof CATEGORIES)[number], (valueId: string) => boolean>> = {
  capability: (valueId) =>
    pictogram(`capability.${valueId as CapabilityId}`, 'primary').primitives.length > 0,
  'body-mark': (valueId) => BODY_MARK_IDS.includes(valueId as BodyMarkId),
  'function-role': (valueId) => functionRole(valueId as FunctionRoleId).layout.body !== undefined,
};

function resolves(category: (typeof CATEGORIES)[number], entry: BlockEntry): boolean {
  try {
    return RESOLVERS[category](entry.valueId);
  } catch {
    return false;
  }
}

/** Die Zeilen eines Fundorts `pfad.ts:von–bis`, relativ zu `packages/`. */
function linesAt(place: string): string {
  const match = /^([a-z0-9/.-]+\.ts):(\d+)(?:–(\d+))?$/.exec(place);
  if (match === null) throw new Error(`${place}: kein Fundort`);
  const [, file, from, to] = match as unknown as [string, string, string, string | undefined];
  const lines = readFileSync(join(packagesRoot, file), 'utf8').split('\n');
  return lines.slice(Number(from) - 1, Number(to ?? from)).join('\n');
}

/** Wie die Definition am Fundort geschlüsselt ist. */
function definitionKey(entry: BlockEntry): RegExp {
  const id = entry.valueId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return entry.category === 'capability'
    ? new RegExp(`\\bid: '${id}'`)
    : new RegExp(`^\\s*(?:'${id}'|${id}):`, 'm');
}

describe.each(CATEGORIES)('Bausteinregister zur Laufzeit: %s', (category) => {
  const entries = BLOCK_REGISTER[category];

  it('ist befüllt', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it('löst jeden gemessenen Eintrag zu Geometrie auf und keinen ungemessenen', () => {
    const wrong = entries
      .filter((entry) => resolves(category, entry) !==(entry.binding.status === 'measured'))
      .map((entry) => `${entry.id}: ${entry.binding.status}`);
    expect(wrong).toEqual([]);
  });

  it('führt heute keinen Eintrag ohne Zeichnung', () => {
    // Alle Werte dieser drei Kategorien sind im Katalog gezeichnet. Kommt eine Lücke hinzu, muss
    // sie hier bewusst eingetragen werden, statt dass die Auflöseprüfung sie still mitträgt.
    expect(entries.filter((entry) => entry.binding.status !== 'measured').map((e) => e.id)).toEqual([]);
  });

  it('zeigt mit jedem Fundort auf die Definition selbst', () => {
    const drifted = entries.flatMap((entry) =>
      entry.binding.status === 'measured' &&
      !definitionKey(entry).test(linesAt(entry.binding.geometry.definedAt))
        ? [`${entry.id} → ${entry.binding.geometry.definedAt}`]
        : [],
    );
    expect(drifted).toEqual([]);
  });

  it('nennt die Regel jeder Kombinationsbindung an ihrem Fundort', () => {
    const missing = entries.flatMap((entry) => {
      const binding = entry.combinationBinding;
      if (binding === undefined) return [];
      return linesAt(binding.definedAt).includes(`'${binding.ruleId}'`)
        ? []
        : [`${entry.id} → ${binding.ruleId} @ ${binding.definedAt}`];
    });
    expect(missing).toEqual([]);
  });
});

describe('Bausteinregister zur Laufzeit: Kombinationsbindungen', () => {
  it('bindet jede Funktionsfassung und von den Körpermarken nur inset-hull-wheel-pair', () => {
    expect(BLOCK_REGISTER['function-role'].every((entry) => entry.combinationBinding !== undefined))
      .toBe(true);
    expect(
      BLOCK_REGISTER['body-mark']
        .filter((entry) => entry.combinationBinding !== undefined)
        .map((entry) => entry.id),
    ).toEqual(['body-mark/inset-hull-wheel-pair']);
    expect(BLOCK_REGISTER.capability.some((entry) => entry.combinationBinding !== undefined))
      .toBe(false);
  });
});
