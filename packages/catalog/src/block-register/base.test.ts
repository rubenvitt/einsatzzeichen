import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { BLOCK_REGISTER, NotMeasuredError } from '@einsatzzeichen/core';
import {
  BODY_VARIANT_IDS,
  ORGANIZATION_IDS,
  SYMBOL_KINDS,
  VEHICLE_CATEGORY_IDS,
  type BlockEntry,
  type BodyVariantId,
  type OrganizationId,
  type SymbolKind,
  type VehicleCategoryId,
} from '@einsatzzeichen/schema';
import { baseDrawing } from '../base-symbols.js';
import { organizationColor } from '../organizations.js';
import { MEASURED_VEHICLE_CATEGORIES, vehicleChassis } from '../vehicle-categories.js';

/**
 * Laufzeit-Gate des Bausteinregisters für Grundzeichen, Farbe und Fahrwerk (LFH-564).
 *
 * `core` darf `catalog` nicht importieren. Das Register zeigt deshalb nur mit `definedAt` auf die
 * Zeichnung. Dieses Gate prüft von der Katalogseite zwei Dinge:
 *
 * 1. Der Messstand stimmt mit dem Resolver überein. `measured` muss sich auflösen, `not-measured`
 *    und `measured-absent` müssen mit `NotMeasuredError` scheitern. Umgekehrt muss jede Fassung,
 *    die der Resolver zeichnet, im Register stehen. Wird ein Wert neu vermessen, bricht der Test,
 *    bis das Register nachgezogen ist.
 * 2. Der Fundort stimmt mit dem Quelltext überein. Für jeden `measured`-Eintrag wird die
 *    Definition im Katalogmodul gesucht, und `definedAt` muss genau ihren Zeilenbereich nennen:
 *    vom Kommentar direkt darüber (falls vorhanden) bis zum Ende des Eintrags. Rutscht eine Zeile,
 *    fällt das auf.
 */

const packagesRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

function sourceLines(file: string): readonly string[] {
  return readFileSync(join(packagesRoot, file), 'utf8').split('\n');
}

function definedAtOf(entry: BlockEntry): string {
  return entry.binding.status === 'measured'
    ? entry.binding.geometry.definedAt
    : entry.binding.gap.definedAt;
}

/** Die Resolverantwort: `true` bei Geometrie, `false` bei `NotMeasuredError`, sonst Wurf. */
function resolves(resolve: () => unknown): boolean {
  try {
    resolve();
    return true;
  } catch (error) {
    if (error instanceof NotMeasuredError) return false;
    throw error;
  }
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Der Objektschlüssel, wie ihn der Quelltext schreibt: mit Anführungszeichen oder ohne. */
function keyPattern(key: string, indent: number): RegExp {
  return new RegExp(`^ {${indent}}(?:'${escape(key)}'|${escape(key)}): `);
}

function findLine(lines: readonly string[], pattern: RegExp, from = 0, to = lines.length): number {
  for (let index = from; index < to; index += 1) {
    if (pattern.test(lines[index] ?? '')) return index;
  }
  throw new Error(`Keine Zeile passt auf ${pattern} im Bereich ${from + 1}–${to}.`);
}

/**
 * Anfang des Fundorts: der JSDoc-Kommentar direkt über dem Schlüssel, falls vorhanden, sonst der
 * Schlüssel selbst. 0-basiert.
 */
function startWithComment(lines: readonly string[], keyIndex: number): number {
  if (!/\*\/\s*$/.test(lines[keyIndex - 1] ?? '')) return keyIndex;
  let index = keyIndex - 1;
  while (index > 0 && !/^\s*\/\*\*/.test(lines[index] ?? '')) index -= 1;
  return index;
}

/** Ende eines Objekteintrags: dieselbe Zeile, oder die schließende Klammer auf gleicher Einrückung. */
function endOfObjectEntry(lines: readonly string[], keyIndex: number, indent: number): number {
  if (!/\{\s*$/.test(lines[keyIndex] ?? '')) return keyIndex;
  return findLine(lines, new RegExp(`^ {${indent}}\\},?$`), keyIndex + 1);
}

function place(file: string, start: number, end: number): string {
  return start === end ? `${file}:${start + 1}` : `${file}:${start + 1}–${end + 1}`;
}

const BASE_FILE = 'catalog/src/base-symbols.ts';
const ORGANIZATION_FILE = 'catalog/src/organizations.ts';
const CHASSIS_FILE = 'catalog/src/vehicle-categories.ts';

/** Der Block eines `const NAME … = {` bis zu seinem `};`, 0-basiert. */
function constBlock(lines: readonly string[], name: string): readonly [number, number] {
  const start = findLine(lines, new RegExp(`^(?:export )?const ${name}\\b`));
  return [start, findLine(lines, /^\};?|^\} as const/, start + 1)];
}

function expectedBasePlace(valueId: string): string {
  const lines = sourceLines(BASE_FILE);
  const [kind, variant] = valueId.split('/') as [string, string | undefined];
  if (variant === undefined) {
    const [from, to] = constBlock(lines, 'BODIES');
    const key = findLine(lines, keyPattern(kind, 2), from, to);
    return place(BASE_FILE, startWithComment(lines, key), endOfObjectEntry(lines, key, 2));
  }
  const [from, to] = constBlock(lines, 'VARIANT_BODIES');
  const kindLine = findLine(lines, keyPattern(kind, 2), from, to);
  const kindEnd = endOfObjectEntry(lines, kindLine, 2);
  const key = findLine(lines, keyPattern(variant, 4), kindLine + 1, kindEnd);
  return place(BASE_FILE, startWithComment(lines, key), endOfObjectEntry(lines, key, 4));
}

function expectedColorPlace(valueId: string): string {
  const lines = sourceLines(ORGANIZATION_FILE);
  const [from, to] = constBlock(lines, 'ORGANIZATION_COLORS');
  const key = findLine(lines, keyPattern(valueId, 2), from, to);
  return place(ORGANIZATION_FILE, key, key);
}

/** Ein `case`-Zweig von `vehicleChassis()`: vom `case` bis zur ersten Anweisung, die mit `;` endet. */
function expectedChassisPlace(valueId: string): string {
  const lines = sourceLines(CHASSIS_FILE);
  const start = findLine(lines, new RegExp(`^ +case '${escape(valueId)}':$`));
  let end = start + 1;
  while (end < lines.length) {
    const line = (lines[end] ?? '').trim();
    if (!line.startsWith('//') && line.endsWith(';')) break;
    end += 1;
  }
  return place(CHASSIS_FILE, start, end);
}

function variantPairs(): readonly (readonly [SymbolKind, BodyVariantId])[] {
  return SYMBOL_KINDS.flatMap((kind) => BODY_VARIANT_IDS.map((variant) => [kind, variant] as const));
}

describe('Bausteinregister gegen Katalog: Grundzeichen', () => {
  const entries = BLOCK_REGISTER['base-symbol'];

  it('löst jeden Eintrag so auf, wie sein Messstand sagt', () => {
    for (const entry of entries) {
      const [kind, variant] = entry.valueId.split('/') as [SymbolKind, BodyVariantId | undefined];
      expect(resolves(() => baseDrawing(kind, variant)), entry.id).toBe(
        entry.binding.status === 'measured',
      );
    }
  });

  it('führt jede Variante, die der Katalog zeichnet, und keine andere', () => {
    const drawn = variantPairs()
      .filter(([kind, variant]) => resolves(() => baseDrawing(kind, variant)))
      .map(([kind, variant]) => `${kind}/${variant}`);
    const registered = entries
      .map((entry) => entry.valueId)
      .filter((value) => value.includes('/'));
    expect([...registered].sort()).toEqual([...drawn].sort());
  });

  it('zeigt mit jedem Fundort genau auf die Definition in BODIES oder VARIANT_BODIES', () => {
    for (const entry of entries) {
      if (entry.binding.status !== 'measured') continue;
      expect(entry.binding.geometry.definedAt, entry.id).toBe(expectedBasePlace(entry.valueId));
    }
  });
});

describe('Bausteinregister gegen Katalog: Farbe', () => {
  const entries = BLOCK_REGISTER.color;

  it('löst jeden Eintrag so auf, wie sein Messstand sagt', () => {
    for (const entry of entries) {
      // `organizationColor()` wirft bei einer Lücke heute einen einfachen `Error`, keinen
      // `NotMeasuredError`. Das Gate prüft deshalb Wurf gegen Nichtwurf.
      let resolved = true;
      try {
        organizationColor(entry.valueId as OrganizationId);
      } catch {
        resolved = false;
      }
      expect(resolved, entry.id).toBe(entry.binding.status === 'measured');
    }
  });

  it('führt jede Organisation', () => {
    expect(entries.map((entry) => entry.valueId).sort()).toEqual([...ORGANIZATION_IDS].sort());
  });

  it('zeigt mit jedem Fundort genau auf die Zeile in ORGANIZATION_COLORS', () => {
    for (const entry of entries) {
      if (entry.binding.status !== 'measured') continue;
      expect(entry.binding.geometry.definedAt, entry.id).toBe(expectedColorPlace(entry.valueId));
    }
  });
});

describe('Bausteinregister gegen Katalog: Fahrwerk', () => {
  const entries = BLOCK_REGISTER.chassis;

  it('löst jeden Eintrag so auf, wie sein Messstand sagt', () => {
    for (const entry of entries) {
      const id = entry.valueId as VehicleCategoryId;
      expect(resolves(() => vehicleChassis(id)), entry.id).toBe(
        entry.binding.status === 'measured',
      );
    }
  });

  it('deckt sich mit MEASURED_VEHICLE_CATEGORIES', () => {
    const measuredIds = entries
      .filter((entry) => entry.binding.status === 'measured')
      .map((entry) => entry.valueId);
    expect([...measuredIds].sort()).toEqual([...MEASURED_VEHICLE_CATEGORIES].sort());
    expect(entries.map((entry) => entry.valueId).sort()).toEqual([...VEHICLE_CATEGORY_IDS].sort());
  });

  it('zeigt mit jedem Fundort genau auf den case-Zweig von vehicleChassis()', () => {
    for (const entry of entries) {
      expect(definedAtOf(entry), entry.id).toBe(expectedChassisPlace(entry.valueId));
    }
  });
});
