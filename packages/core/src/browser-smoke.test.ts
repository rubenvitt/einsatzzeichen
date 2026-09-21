// @vitest-environment happy-dom
/**
 * Browser-Smoke für `@einsatzzeichen/core` (LFH-575).
 *
 * Was er schützt: `core` ist seit LFH-560 das Produkt und muss ohne Prüfpaket und ohne Node im
 * Browser laufen. Ausgangslage war ein Katalogindex, der über `fonts.ts` `node:url` zog und
 * deshalb in keinem Bundle für den Browser taugte. Zwei Prüfungen halten das fest:
 *
 * 1. **Importgraph (statisch).** Vom öffentlichen Index `src/index.ts` aus wird jeder erreichbare
 *    Quelltext gelesen und seine Importe über den TypeScript-Präprozessor bestimmt — keine
 *    Textsuche, die auch Kommentare wie „kein `node:fs`" in `rules/rule-catalog.ts` träfe. Kein
 *    Modul darf ein `node:`-Builtin (oder ein Builtin ohne Präfix) erreichen, keines das Prüfpaket
 *    `@einsatzzeichen/conformance`, und außer `@einsatzzeichen/schema` keine Fremdabhängigkeit.
 *    Statisch statt zur Laufzeit, weil die Testumgebung selbst Node ist: ein `node:`-Import würde
 *    hier klaglos laden und erst im Bundle eines Nutzers brechen. `import type` zählt mit — auch
 *    ein Typimport aus dem Prüfpaket kehrte die Paketrichtung um.
 * 2. **Rendern im DOM.** In einer happy-dom-Umgebung lädt der Test den öffentlichen Index, setzt
 *    ein echtes Zeichen allein aus dem zusammen, was `core` exportiert, rendert es als SVG und
 *    lässt den Browser-Parser (`DOMParser`) das Ergebnis lesen.
 */
import { builtinModules } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import ts from 'typescript';
import { describe, expect, test } from 'vitest';
import * as core from './index.js';

const coreSrc = dirname(fileURLToPath(import.meta.url));
const packagesDir = resolve(coreSrc, '../..');
const repoRoot = resolve(packagesDir, '..');

/** Einzige erlaubte Paketabhängigkeit von `core` (siehe `package.json`); ihr Graph zählt mit. */
const WORKSPACE_ENTRIES: Readonly<Record<string, string>> = {
  '@einsatzzeichen/schema': join(packagesDir, 'schema/src/index.ts'),
};

const NODE_BUILTINS = new Set(builtinModules);

interface ImportGraph {
  /** Erreichte Quelldateien, relativ zum Repository. */
  readonly files: readonly string[];
  /** Importe, die nicht erlaubt sind, als `datei → specifier`. */
  readonly violations: readonly string[];
}

function resolveRelative(fromFile: string, specifier: string): string {
  const target = resolve(dirname(fromFile), specifier);
  if (target.endsWith('.json')) return target;
  const candidates = [
    target.replace(/\.js$/, '.ts'),
    `${target}.ts`,
    join(target, 'index.ts'),
  ];
  const found = candidates.find((candidate) => existsSync(candidate));
  if (found === undefined) {
    throw new Error(`Import nicht auflösbar: ${specifier} aus ${relative(repoRoot, fromFile)}`);
  }
  return found;
}

function walkImportGraph(entry: string): ImportGraph {
  const seen = new Set<string>();
  const violations: string[] = [];
  const queue = [entry];
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    if (file.endsWith('.json')) continue;
    const info = ts.preProcessFile(readFileSync(file, 'utf8'), true, true);
    for (const { fileName: specifier } of info.importedFiles) {
      const where = `${relative(repoRoot, file)} → ${specifier}`;
      if (specifier.startsWith('.')) {
        queue.push(resolveRelative(file, specifier));
      } else if (specifier in WORKSPACE_ENTRIES) {
        queue.push(WORKSPACE_ENTRIES[specifier]!);
      } else if (specifier.startsWith('node:') || NODE_BUILTINS.has(specifier)) {
        violations.push(`${where} (Node-Builtin)`);
      } else if (specifier.startsWith('@einsatzzeichen/conformance')) {
        violations.push(`${where} (Prüfpaket)`);
      } else {
        violations.push(`${where} (Fremdabhängigkeit)`);
      }
    }
  }
  return { files: [...seen].map((file) => relative(repoRoot, file)).sort(), violations };
}

describe('core — Importgraph des öffentlichen Index', () => {
  const graph = walkImportGraph(join(coreSrc, 'index.ts'));

  test('erreicht kein Node-Builtin, kein Prüfpaket und keine Fremdabhängigkeit', () => {
    expect(graph.violations).toEqual([]);
  });

  test('der Graph ist echt: er umfasst Geometrie, Renderer, Metrik-JSON und schema', () => {
    // Gegenprobe, dass die Auflösung nicht still bei `index.ts` stehen bleibt.
    expect(graph.files.length).toBeGreaterThan(100);
    expect(graph.files).toEqual(
      expect.arrayContaining([
        'packages/core/src/render/svg.ts',
        'packages/core/src/compose.ts',
        'packages/core/src/geometry/base-symbols.ts',
        'packages/core/src/geometry/pictograms/index.ts',
        'packages/core/src/assets/arimo-metrics.json',
        'packages/schema/src/index.ts',
      ]),
    );
    expect(graph.files.filter((file) => /\.test\.ts$|test-support\//.test(file))).toEqual([]);
  });

  test('die Prüfung selbst schlägt an: ein Modul mit node:-Import wird gemeldet', () => {
    // `rules/rule-catalog.ts` erwähnt `node:fs` nur im Kommentar — kein Befund.
    expect(walkImportGraph(join(coreSrc, 'rules/rule-catalog.ts')).violations).toEqual([]);
    // Ein Test aus `core`, der `node:fs` importiert, muss dagegen auffallen.
    expect(walkImportGraph(join(coreSrc, 'blocks/register.test.ts')).violations).toEqual(
      expect.arrayContaining([expect.stringMatching(/→ node:fs \(Node-Builtin\)$/)]),
    );
  });
});

describe('core — rendert im Browser ohne Prüfpaket', () => {
  test('die Umgebung ist ein DOM, nicht bloß Node', () => {
    expect(typeof window).toBe('object');
    expect(typeof DOMParser).toBe('function');
  });

  test('setzt ein echtes Zeichen aus den öffentlichen Exporten zusammen und rendert es als SVG', () => {
    // Die Ports sind dieselben, die `conformance/src/recipes.ts` verdrahtet — jeder einzelne ist
    // ein Export von `core`. Eine fertige Standardbelegung gibt es noch nicht (LFH-580).
    const ports: core.CatalogPorts = {
      baseDrawing: core.baseDrawing,
      innerField: core.innerField,
      bodyMark: core.bodyMark,
      organizationColor: core.organizationColor,
      strengthHead: core.strengthHead,
      technicalHeadMark: core.technicalHeadMark,
      functionRole: core.functionRole,
      administrativeHead: core.administrativeHead,
      vehicleChassis: core.vehicleChassis,
      pictogram: core.pictogram,
      textMetrics: core.ARIMO_TEXT_METRICS,
    };
    // Spezifikation von E.1.1 (Bergungsgruppe, THW) aus dem Rezeptbestand des Prüfpakets.
    const spec: SymbolSpec = {
      kind: 'formation',
      whiteInnerContour: true,
      organization: 'thw',
      strength: 'gruppe',
      labels: { center: 'B', bottomRight: 'THW' },
    };

    const drawing = core.compose(spec, ports, {
      title: 'Bergungsgruppe',
      descriptionFromSpec: core.describeSymbolSpec,
    });
    const svg = core.renderSvg(drawing, { size: 128 });

    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    expect(doc.querySelector('parsererror')).toBeNull();
    const root = doc.documentElement;
    expect(root.tagName.toLowerCase()).toBe('svg');
    // 32 mm Standard-viewBox, ausgegeben in Punkt (32 × 72 / 25,4).
    expect(root.getAttribute('viewBox')).toBe('0 0 90.709 90.709');
    const texts = Array.from(doc.querySelectorAll('text'), (node) => node.textContent);
    expect(texts).toEqual(expect.arrayContaining(['B', 'THW']));
    expect(doc.querySelector('title')?.textContent).toBe('Bergungsgruppe');
    expect(doc.querySelector('desc')?.textContent).toContain('Technisches Hilfswerk');
    // THW-Blau als Füllung: die Organisationsfarbe kam wirklich aus dem Port.
    expect(doc.querySelector('rect[fill="#003296"]')).not.toBeNull();
    // Körper plus Kopfmarken der Stärke `gruppe`: mehr als nur Text.
    expect(doc.querySelectorAll('rect, path, circle, line, polyline, polygon').length).toBeGreaterThan(2);
  });
});
