import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from '@typescript/typescript6';
import { describe, expect, it } from 'vitest';

/**
 * Der Wächter für den Paketschnitt (LFH-560, LFH-573): **was im Browser läuft, bezieht Geometrie,
 * Renderer und Themes aus `@einsatzzeichen/core`, nicht aus dem Prüfpaket.** `conformance` liest
 * die Website nur beim Bauen — für den Snapshot (`scripts/generate-snapshot.ts`) und in
 * Astro-Seiten, deren Frontmatter nie ins Browserbündel kommt.
 *
 * Geprüft wird nicht nur die Insel selbst, sondern alles, was sie über relative Wertimporte
 * erreicht: ein Import aus `conformance` in einer Hilfsdatei landet genauso im Bündel wie einer in
 * der Insel. Typimporte zählen nicht, sie verschwinden beim Bauen.
 *
 * Gelesen wird mit dem TypeScript-Parser statt mit einem Muster: Beispielcode in Template-Strings
 * (wie in `code-samples.ts`) oder in Kommentaren kann `import … from '@einsatzzeichen/conformance'`
 * zeigen, und ein Zeilenmuster hielte das für einen echten Import.
 */

const ISLANDS_DIR = fileURLToPath(new URL('../components/islands/', import.meta.url));
const WEBSITE_DIR = fileURLToPath(new URL('../../', import.meta.url));

const CONFORMANCE = /^@einsatzzeichen\/conformance(\/|$)/;

/** Wertimporte und -reexporte einer Datei; `import type`/`export type` fallen heraus. */
function valueImports(text: string, fileName = 'datei.ts'): string[] {
  const source = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest, false);
  const specifiers: string[] = [];
  for (const statement of source.statements) {
    if (ts.isImportDeclaration(statement)) {
      const clause = statement.importClause;
      if (clause?.phaseModifier === ts.SyntaxKind.TypeKeyword) continue;
      const bindings = clause?.namedBindings;
      const onlyTypes =
        clause !== undefined &&
        clause.name === undefined &&
        bindings !== undefined &&
        ts.isNamedImports(bindings) &&
        bindings.elements.length > 0 &&
        bindings.elements.every((element) => element.isTypeOnly);
      if (onlyTypes) continue;
      if (ts.isStringLiteral(statement.moduleSpecifier)) specifiers.push(statement.moduleSpecifier.text);
    } else if (ts.isExportDeclaration(statement)) {
      if (statement.isTypeOnly) continue;
      const specifier = statement.moduleSpecifier;
      if (specifier !== undefined && ts.isStringLiteral(specifier)) specifiers.push(specifier.text);
    }
  }
  return specifiers;
}

/** `./x.js` auf die Quelldatei (`x.ts`, `x.tsx`) abbilden; Astro-Dateien und Assets fallen heraus. */
function resolveRelative(from: string, specifier: string): string | undefined {
  const base = resolve(dirname(from), specifier);
  const stem = base.replace(/\.(js|jsx|ts|tsx)$/, '');
  return [base, `${stem}.ts`, `${stem}.tsx`].find(
    (candidate) => /\.tsx?$/.test(candidate) && existsSync(candidate),
  );
}

function islandFiles(): string[] {
  return readdirSync(ISLANDS_DIR)
    .filter((name) => name.endsWith('.tsx'))
    .map((name) => join(ISLANDS_DIR, name));
}

/** Alle `conformance`-Wertimporte, die eine Insel über relative Wertimporte erreicht. */
function conformanceImportsReachableFrom(island: string): Array<{ file: string; specifier: string }> {
  const seen = new Set<string>();
  const pending = [island];
  const found: Array<{ file: string; specifier: string }> = [];
  while (pending.length > 0) {
    const file = pending.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const specifier of valueImports(readFileSync(file, 'utf-8'), file)) {
      if (CONFORMANCE.test(specifier)) {
        found.push({ file: relative(WEBSITE_DIR, file), specifier });
      } else if (specifier.startsWith('.')) {
        const target = resolveRelative(file, specifier);
        if (target !== undefined) pending.push(target);
      }
    }
  }
  return found;
}

it('keine Insel importiert selbst aus `@einsatzzeichen/conformance`', () => {
  const islands = islandFiles();
  expect(islands.length, 'Es wurde keine Insel gefunden — läuft der Wächter ins Leere?').toBeGreaterThan(0);

  const direct = islands.flatMap((island) =>
    valueImports(readFileSync(island, 'utf-8'), island)
      .filter((specifier) => CONFORMANCE.test(specifier))
      .map((specifier) => `${relative(WEBSITE_DIR, island)}: ${specifier}`),
  );
  expect(
    direct,
    'Geometrie, Renderer und Themes kommen aus `@einsatzzeichen/core`; Prüfdaten (Coverage, ' +
      'Reviews, Herkunft) aus dem Snapshot über `fetchSnapshot()`.',
  ).toEqual([]);
});

/**
 * Ohne Ausnahme seit LFH-580. Bis dahin durfte `builder-state.ts` `composeFromCatalog` über den
 * Subpfad `@einsatzzeichen/conformance/src/recipes.js` holen, weil `core` keine fertige Belegung der
 * `CatalogPorts` führte; seitdem zeichnet der Baukasten mit `drawSymbol()` aus `core`.
 */
it('was eine Insel lädt, importiert `conformance` nicht', () => {
  const offenders = islandFiles()
    .flatMap(conformanceImportsReachableFrom)
    .map((hit) => `${hit.file}: ${hit.specifier}`);
  expect(
    [...new Set(offenders)],
    'Diese Dateien liegen im Browserbündel einer Insel und ziehen das Prüfpaket mit. ' +
      'Geometrie und Renderer kommen aus `@einsatzzeichen/core`.',
  ).toEqual([]);
});

/** Gegenproben: der Wächter taugt nur, wenn er echte Importe findet und Scheinimporte übergeht. */
describe('valueImports', () => {
  it('findet Wertimporte und Reexporte', () => {
    const text = [
      "import { RECIPES } from '@einsatzzeichen/conformance';",
      "import * as c from '@einsatzzeichen/conformance/src/recipes.js';",
      "import { type Recipe, RECIPES as R } from '@einsatzzeichen/conformance';",
      "export { RECIPES } from '@einsatzzeichen/conformance';",
    ].join('\n');
    expect(valueImports(text)).toHaveLength(4);
  });

  it('übergeht Typimporte', () => {
    const text = [
      "import type { Recipe } from '@einsatzzeichen/conformance';",
      "import { type Recipe } from '@einsatzzeichen/conformance';",
      "export type { Recipe } from '@einsatzzeichen/conformance';",
    ].join('\n');
    expect(valueImports(text)).toEqual([]);
  });

  it('lässt sich von Beispielcode in einem Template-String und von Kommentaren nicht täuschen', () => {
    const text = [
      '// import { RECIPES } from \'@einsatzzeichen/conformance\';',
      'const sample = `import { composeFromCatalog } from \'@einsatzzeichen/conformance\';',
      "import { renderSvg } from '@einsatzzeichen/core';`;",
    ].join('\n');
    expect(valueImports(text)).toEqual([]);
  });
});
