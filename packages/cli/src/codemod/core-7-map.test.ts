import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from '@typescript/typescript6';
import { describe, expect, it } from 'vitest';
import { CORE_7_MOVES, type Core7Subpath } from './core-7-map.js';

/*
 * ESZ-151: Die Tabelle des Codemods muss stimmen, sonst schreibt er Importe auf einen Subpfad, der
 * den Namen nicht hat. Geprüft mit dem Typprüfer, damit Typen mitzählen (zur Laufzeit gäbe es nur
 * die Werte).
 */
const CORE_SRC = resolve(dirname(fileURLToPath(import.meta.url)), '../../../core/src');
const ENTRIES: Readonly<Record<Core7Subpath, string>> = {
  '': 'index.ts',
  exact: 'exact.ts',
  blocks: 'blocks/index.ts',
  sketch: 'sketch/index.ts',
  gates: 'gates.ts',
};

function exportedNames(): Map<Core7Subpath, Set<string>> {
  const files = Object.values(ENTRIES).map((file) => join(CORE_SRC, file));
  const program = ts.createProgram(files, {
    module: ts.ModuleKind.NodeNext,
    moduleResolution: ts.ModuleResolutionKind.NodeNext,
    target: ts.ScriptTarget.ES2022,
    resolveJsonModule: true,
    noEmit: true,
    paths: { '@einsatzzeichen/schema': [resolve(CORE_SRC, '../../schema/src/index.ts')] },
  });
  const checker = program.getTypeChecker();
  const result = new Map<Core7Subpath, Set<string>>();
  for (const [subpath, file] of Object.entries(ENTRIES) as [Core7Subpath, string][]) {
    const source = program.getSourceFile(join(CORE_SRC, file))!;
    const symbol = checker.getSymbolAtLocation(source)!;
    result.set(subpath, new Set(checker.getExportsOfModule(symbol).map((entry) => entry.name)));
  }
  return result;
}

describe('Tabelle des Codemods für 7.0 (ESZ-151)', () => {
  const names = exportedNames();

  it('jeder Name steht an seinem Ziel', () => {
    const missing = Object.entries(CORE_7_MOVES)
      .filter(([name, subpath]) => !names.get(subpath)!.has(name))
      .map(([name, subpath]) => `${name} → ${subpath || 'Wurzel'}`);
    expect(missing).toEqual([]);
  });

  it('nennt die 412 Namen der 6.x-Wurzel, 61 davon bleiben', () => {
    const moves = Object.values(CORE_7_MOVES);
    expect(moves).toHaveLength(412);
    expect(moves.filter((subpath) => subpath === '')).toHaveLength(61);
  });

  it('was an der Wurzel bleibt, steht auch dort; was zieht, steht dort nicht mehr', () => {
    const root = names.get('')!;
    for (const [name, subpath] of Object.entries(CORE_7_MOVES)) {
      expect(root.has(name), name).toBe(subpath === '');
    }
  });

  it('die neue Wurzel hat nur einen Namen, den 6.x nicht an der Wurzel hatte: den Typ Drawing', () => {
    expect([...names.get('')!].filter((name) => !(name in CORE_7_MOVES))).toEqual(['Drawing']);
  });
});
