import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { BlockEntry, PictogramId } from '@einsatzzeichen/schema';
import { BLOCK_REGISTER } from '@einsatzzeichen/core';
import { pictogram } from '../pictograms/index.js';
import { STATE_PICTOGRAMS } from '../pictograms/states/index.js';

/**
 * Laufzeit-Gate des Bausteinregisters für Zustand und Tendenz (LFH-564). `core` darf `catalog`
 * nicht importieren; deshalb prüft erst dieser Test, dass der Messstand im Register zum Katalog
 * passt. Wird ein Zustand neu gezeichnet, verschoben oder entfernt, muss das Register nachziehen.
 */

const packagesRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const ENTRIES: readonly BlockEntry[] = [...BLOCK_REGISTER.state, ...BLOCK_REGISTER.tendency];

function depictionsOf(valueId: string) {
  return STATE_PICTOGRAMS.filter((definition) => definition.id === `state.${valueId}`);
}

function primaryOf(valueId: string) {
  return depictionsOf(valueId).find((definition) => definition.variant === 'primary');
}

/** Liest den Zeilenbereich eines Fundorts `pfad.ts:von–bis` relativ zu `packages/`. */
function linesAt(place: string): string {
  const match = /^([a-z0-9/.-]+\.ts):(\d+)(?:–(\d+))?$/.exec(place);
  if (match === null) throw new Error(`${place}: kein Fundort der Form pfad.ts:zeile[–zeile]`);
  const [, file, from, to] = match as unknown as [string, string, string, string | undefined];
  const start = Number(from);
  const end = to === undefined ? start : Number(to);
  return readFileSync(join(packagesRoot, file), 'utf8')
    .split('\n')
    .slice(start - 1, end)
    .join('\n');
}

describe('Bausteinregister: Zustand und Tendenz gegen den Katalog', () => {
  it('führt Zustände und Tendenzen', () => {
    expect(BLOCK_REGISTER.state.length).toBeGreaterThan(0);
    expect(BLOCK_REGISTER.tendency.length).toBeGreaterThan(0);
  });

  it('löst jeden measured-Eintrag zu einer Zustandsdarstellung auf und keinen anderen', () => {
    for (const entry of ENTRIES) {
      if (entry.binding.status === 'measured') {
        expect(depictionsOf(entry.valueId).length, entry.id).toBeGreaterThan(0);
        const id = `state.${entry.valueId}` as PictogramId;
        expect(pictogram(id).primitives.length, entry.id).toBeGreaterThan(0);
      } else {
        expect(depictionsOf(entry.valueId), entry.id).toEqual([]);
      }
    }
  });

  it('führt jede Zustandskennung des Katalogs im Register', () => {
    const registered = new Set(ENTRIES.map((entry) => `state.${entry.valueId}`));
    const catalogued = new Set(STATE_PICTOGRAMS.map((definition) => definition.id));
    expect([...catalogued].filter((id) => !registered.has(id))).toEqual([]);
  });

  it('zeigt mit definedAt auf den defineState-Aufruf der Primärdarstellung', () => {
    for (const entry of ENTRIES) {
      if (entry.binding.status !== 'measured') continue;
      const text = linesAt(entry.binding.geometry.definedAt);
      expect(text, entry.id).toContain('defineState({');
      expect(text, entry.id).toContain(`id: '${entry.valueId}',`);
      // Genau ein Aufruf, und zwar der ohne `variant` — also die Primärdarstellung.
      expect(text.match(/defineState\(\{/g), entry.id).toHaveLength(1);
      expect(text, entry.id).not.toContain('variant:');
    }
  });

  it('übernimmt den Abschnitt des Katalogeintrags als sourceRefs', () => {
    for (const entry of ENTRIES) {
      if (entry.binding.status !== 'measured') continue;
      const sections = (entry.binding.geometry.sourceRefs ?? []).map((ref) => ref.section);
      expect(sections, entry.id).toEqual([primaryOf(entry.valueId)?.section]);
    }
  });
});
