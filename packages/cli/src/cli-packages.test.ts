import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ts from 'typescript';
import { describe, expect, it } from 'vitest';

/*
 * LFH-572: Prüfbefehle hängen an `@einsatzzeichen/conformance`, der Export an `@einsatzzeichen/core`.
 * Der Test liest die Importe statisch und hält fest, welche Quelldatei der CLI das Prüfpaket
 * importieren darf.
 */

const SRC = dirname(fileURLToPath(import.meta.url));
const CONFORMANCE = '@einsatzzeichen/conformance';

/** Gehören LFH-574 (Repository-Gate) und werden hier nicht vermessen. */
const FOREIGN = /^commands\/(verify-repository[^/]*|repository-policy)\.ts$/;

/** Quelldateien, die `conformance` importieren dürfen — Prüfbefehle und die Rezeptkante des Exports. */
const CONFORMANCE_IMPORTERS = [
  'commands/coverage.ts',
  'commands/export-recipes.ts',
  'commands/review-dossier.ts',
  'commands/visual-proof.ts',
];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') ? [path] : [];
  });
}

function importsOf(file: string): string[] {
  return ts
    .preProcessFile(readFileSync(file, 'utf8'), true, true)
    .importedFiles.map((ref) => ref.fileName);
}

/** Alle Dateien, die von `entry` über relative Importe erreichbar sind, samt `entry`. */
function relativeClosure(entry: string): string[] {
  const seen = new Set<string>();
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const specifier of importsOf(file)) {
      if (specifier.startsWith('.')) {
        queue.push(resolve(dirname(file), specifier.replace(/\.js$/, '.ts')));
      }
    }
  }
  return [...seen];
}

const rel = (file: string): string => relative(SRC, file).split('\\').join('/');

describe('CLI-Befehle nach Paket (LFH-572)', () => {
  it('nur Prüfbefehle und die Rezeptkante des Exports importieren conformance', () => {
    const importers = sourceFiles(SRC)
      .filter((file) => !FOREIGN.test(rel(file)))
      .filter((file) => importsOf(file).includes(CONFORMANCE))
      .map(rel)
      .sort();

    expect(importers).toEqual(CONFORMANCE_IMPORTERS);
  });

  it('export.ts bezieht Geometrie und Renderer aus core, nicht aus conformance', () => {
    const packages = importsOf(join(SRC, 'commands/export.ts')).filter((s) =>
      s.startsWith('@einsatzzeichen/'),
    );

    expect(new Set(packages)).toEqual(new Set(['@einsatzzeichen/core']));
  });

  it('im Exportpfad erreicht nur export-recipes.ts das Prüfpaket', () => {
    const reaching = relativeClosure(join(SRC, 'commands/export.ts'))
      .filter((file) => importsOf(file).includes(CONFORMANCE))
      .map(rel);

    expect(reaching).toEqual(['commands/export-recipes.ts']);
  });
});
