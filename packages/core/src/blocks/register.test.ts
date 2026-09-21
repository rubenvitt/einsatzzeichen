import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  ADMIN_LEVEL_IDS,
  BODY_VARIANT_IDS,
  CAPABILITY_IDS,
  FUNCTION_ROLE_IDS,
  ORGANIZATION_IDS,
  STATE_IDS,
  STRENGTH_IDS,
  SYMBOL_KINDS,
  TECHNICAL_BODY_MARK_IDS,
  TECHNICAL_HEAD_MARK_IDS,
  UNIT_GROUPING_IDS,
  VEHICLE_CATEGORY_IDS,
  type BlockCategory,
  type BlockEntry,
} from '@einsatzzeichen/schema';
import { UNDOCUMENTED_AT_SOURCE, ZONE_IDS } from '../layout/zones.js';
import { ruleCatalogEntry } from '../rules/rule-catalog.js';
import {
  BLOCK_CATEGORIES,
  BLOCK_CATEGORY_GAPS,
  BLOCK_ENTRIES,
  BLOCK_REGISTER,
  blockEntry,
  blockGaps,
} from './register.js';

const packagesRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const TENDENCY_IDS = STATE_IDS.filter((id) => id.startsWith('tendency-'));

/**
 * Die Werteliste je Kategorie. `base-symbol` ist ausgenommen: dort kommen zu den Körperformen
 * die Variantenzweige hinzu, geprüft in einem eigenen Test.
 */
const EXPECTED_VALUES: Readonly<Record<Exclude<BlockCategory, 'base-symbol'>, readonly string[]>> = {
  color: ORGANIZATION_IDS,
  strength: STRENGTH_IDS,
  'unit-grouping': UNIT_GROUPING_IDS,
  'administrative-level': ADMIN_LEVEL_IDS,
  'technical-head-mark': TECHNICAL_HEAD_MARK_IDS,
  chassis: VEHICLE_CATEGORY_IDS,
  capability: CAPABILITY_IDS,
  'body-mark': TECHNICAL_BODY_MARK_IDS,
  'function-role': FUNCTION_ROLE_IDS,
  state: STATE_IDS.filter((id) => !id.startsWith('tendency-')),
  tendency: TENDENCY_IDS,
  arrow: [],
  line: [],
};

function placesOf(entry: BlockEntry): readonly string[] {
  const places =
    entry.binding.status === 'measured'
      ? [entry.binding.geometry.definedAt]
      : [entry.binding.gap.definedAt];
  return entry.combinationBinding === undefined
    ? places
    : [...places, entry.combinationBinding.definedAt];
}

/** `pfad.ts:12` oder `pfad.ts:12–30`, relativ zu `packages/`. */
const PLACE = /^([a-z0-9/.-]+\.ts):(\d+)(?:–(\d+))?$/;

function checkPlace(place: string): string | undefined {
  const match = PLACE.exec(place);
  if (match === null) return `${place}: kein Fundort der Form pfad.ts:zeile[–zeile]`;
  const [, file, from, to] = match as unknown as [string, string, string, string | undefined];
  const path = join(packagesRoot, file);
  if (!existsSync(path)) return `${place}: Datei fehlt`;
  const lines = readFileSync(path, 'utf8').split('\n').length;
  const start = Number(from);
  const end = to === undefined ? start : Number(to);
  if (start < 1 || end < start || end > lines) return `${place}: Zeilenbereich außerhalb (${lines})`;
  return undefined;
}

describe('Bausteinregister: Aufbau', () => {
  it('führt alle 14 Kategorien', () => {
    expect(BLOCK_CATEGORIES).toHaveLength(14);
  });

  it('bildet jede Kennung aus Kategorie und Wert, eindeutig', () => {
    const ids = BLOCK_ENTRIES.map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const category of BLOCK_CATEGORIES) {
      for (const entry of BLOCK_REGISTER[category]) {
        expect(entry.category, entry.id).toBe(category);
        expect(entry.id).toBe(`${category}/${entry.valueId}`);
        expect(blockEntry(entry.id)).toBe(entry);
      }
    }
  });

  it('belegt jede Kategorie vollständig gegen ihre Werteliste im Schema', () => {
    for (const [category, values] of Object.entries(EXPECTED_VALUES)) {
      const actual = BLOCK_REGISTER[category as BlockCategory].map((entry) => entry.valueId);
      expect([...actual].sort(), category).toEqual([...values].sort());
    }
  });

  it('führt jede Körperform und nur bekannte Varianten als Grundzeichen', () => {
    const values = BLOCK_REGISTER['base-symbol'].map((entry) => entry.valueId);
    const kinds = values.filter((value) => !value.includes('/'));
    expect([...kinds].sort()).toEqual([...SYMBOL_KINDS].sort());
    for (const value of values.filter((v) => v.includes('/'))) {
      const [kind, variant] = value.split('/');
      expect(SYMBOL_KINDS, value).toContain(kind);
      expect(BODY_VARIANT_IDS, value).toContain(variant);
    }
  });

  it('setzt nur bekannte Zonen', () => {
    for (const entry of BLOCK_ENTRIES) {
      expect([...ZONE_IDS, 'freestanding'], entry.id).toContain(entry.zone);
    }
  });

  it('führt Kategorien ohne Werte als Kategorielücke und nur diese', () => {
    const empty = BLOCK_CATEGORIES.filter((category) => BLOCK_REGISTER[category].length === 0);
    expect(BLOCK_CATEGORY_GAPS.map((gap) => gap.category).sort()).toEqual([...empty].sort());
  });
});

describe('Bausteinregister: Herkunft und benannte Ausnahmen', () => {
  it('zeigt mit jedem Fundort auf eine vorhandene Datei und gültige Zeilen', () => {
    const problems = [
      ...BLOCK_ENTRIES.flatMap(placesOf),
      ...BLOCK_CATEGORY_GAPS.map((gap) => gap.definedAt),
    ]
      .map(checkPlace)
      .filter((problem) => problem !== undefined);
    expect(problems).toEqual([]);
  });

  it('führt jede Kombinationsbindung mit einer Regel aus dem Regelkatalog', () => {
    for (const entry of BLOCK_ENTRIES) {
      if (entry.combinationBinding === undefined) continue;
      expect(ruleCatalogEntry(entry.combinationBinding.ruleId), entry.id).toBeDefined();
    }
  });

  it('begründet jede Lücke', () => {
    for (const entry of BLOCK_ENTRIES) {
      if (entry.binding.status === 'measured') {
        expect(entry.binding.geometry.note.trim(), entry.id).not.toBe('');
      } else {
        expect(entry.binding.gap.reason.trim(), entry.id).not.toBe('');
      }
    }
  });
});

describe('Bausteinregister: festgenagelter Stand', () => {
  it('zählt die Einträge je Kategorie', () => {
    const counts = Object.fromEntries(
      BLOCK_CATEGORIES.map((category) => [category, BLOCK_REGISTER[category].length]),
    );
    expect(counts).toEqual({
      'base-symbol': 33,
      color: 9,
      strength: 4,
      'unit-grouping': 3,
      'administrative-level': 6,
      'technical-head-mark': 2,
      chassis: 8,
      capability: 88,
      'body-mark': 44,
      'function-role': 25,
      state: 58,
      tendency: 3,
      arrow: 0,
      line: 0,
    });
  });

  it('nagelt die Bausteine ohne Zeichnung fest', () => {
    // Dieselben Lücken wie in der Wertabdeckung (`conformance/src/rule-coverage.ts`): drei
    // Verwaltungsstufen und das Amphibienfahrzeug. Dazu kommen die Verbände aus 5.5, die dort
    // keine Achse haben, weil `SymbolSpec` kein Feld für sie führt.
    expect(blockGaps()).toEqual([
      { id: 'administrative-level/bezirk', status: 'not-measured' },
      { id: 'administrative-level/bundesland', status: 'not-measured' },
      { id: 'administrative-level/gemeinde', status: 'not-measured' },
      { id: 'chassis/amphibienfahrzeug', status: 'not-measured' },
      { id: 'unit-grouping/verband-i', status: 'not-measured' },
      { id: 'unit-grouping/verband-ii', status: 'not-measured' },
      { id: 'unit-grouping/verband-iii', status: 'not-measured' },
    ]);
  });

  it('nagelt die Fundorte ohne Herkunftsaussage fest', () => {
    // Die Zeichnung liegt vor, aber am Fundort steht nicht, woher sie stammt. Das ist kein
    // Messfehler, sondern eine Dokumentationslücke. Sie soll nicht still wachsen.
    const undocumented = BLOCK_ENTRIES.filter(
      (entry) =>
        entry.binding.status === 'measured' &&
        entry.binding.geometry.note.startsWith(UNDOCUMENTED_AT_SOURCE),
    ).map((entry) => entry.id);
    const byCategory = Object.fromEntries(
      BLOCK_CATEGORIES.map((category) => [
        category,
        undocumented.filter((id) => id.startsWith(`${category}/`)).length,
      ]).filter(([, count]) => count !== 0),
    );
    expect(byCategory).toEqual({
      'base-symbol': 12,
      'administrative-level': 3,
      'technical-head-mark': 1,
      'body-mark': 8,
      'function-role': 25,
    });
  });
});
