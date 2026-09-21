import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  findRepositoryPolicyViolations,
  readGitTrackedFiles,
  readRepositoryPolicyInput,
  verifyRepository,
  type RepositoryPolicyInput,
  type WorkspacePackageId,
} from './verify-repository.js';

const CLI_ENTRY = fileURLToPath(new URL('../index.ts', import.meta.url));
const REPOSITORY_ROOT = fileURLToPath(new URL('../../../../', import.meta.url));
const TSX_ENTRY = fileURLToPath(
  new URL('../../../../node_modules/tsx/dist/cli.mjs', import.meta.url),
);

function validPolicyInput(): RepositoryPolicyInput {
  return {
    manifests: [
      {
        id: 'cli',
        name: '@einsatzzeichen/cli',
        path: 'packages/cli/package.json',
        isPrivate: false,
        dependencies: {
          '@einsatzzeichen/conformance': 'workspace:*',
          '@einsatzzeichen/core': 'workspace:*',
          '@einsatzzeichen/schema': 'workspace:*',
        },
        malformedDependencySections: [],
      },
      {
        id: 'conformance',
        name: '@einsatzzeichen/conformance',
        path: 'packages/conformance/package.json',
        isPrivate: false,
        dependencies: {
          '@einsatzzeichen/core': 'workspace:*',
          '@einsatzzeichen/schema': 'workspace:*',
        },
        malformedDependencySections: [],
      },
      {
        id: 'core',
        name: '@einsatzzeichen/core',
        path: 'packages/core/package.json',
        isPrivate: false,
        dependencies: { '@einsatzzeichen/schema': 'workspace:*' },
        malformedDependencySections: [],
      },
      {
        id: 'schema',
        name: '@einsatzzeichen/schema',
        path: 'packages/schema/package.json',
        isPrivate: false,
        dependencies: {},
        malformedDependencySections: [],
      },
      ...(['react', 'web-component', 'maplibre', 'qgis'] as const).map((id) => ({
        id,
        name: `@einsatzzeichen/${id}`,
        path: `packages/${id}/package.json`,
        isPrivate: false,
        dependencies: {
          '@einsatzzeichen/core': 'workspace:*',
          '@einsatzzeichen/schema': 'workspace:*',
        },
        malformedDependencySections: [],
      })),
      {
        id: 'review',
        name: '@einsatzzeichen/review',
        path: 'packages/review/package.json',
        isPrivate: true,
        dependencies: {
          '@einsatzzeichen/conformance': 'workspace:*',
          '@einsatzzeichen/core': 'workspace:*',
          '@einsatzzeichen/schema': 'workspace:*',
        },
        malformedDependencySections: [],
      },
      {
        id: 'website',
        name: '@einsatzzeichen/website',
        path: 'packages/website/package.json',
        isPrivate: true,
        dependencies: {
          '@einsatzzeichen/conformance': 'workspace:*',
          '@einsatzzeichen/core': 'workspace:*',
          '@einsatzzeichen/maplibre': 'workspace:*',
          '@einsatzzeichen/qgis': 'workspace:*',
          '@einsatzzeichen/react': 'workspace:*',
          '@einsatzzeichen/schema': 'workspace:*',
          '@einsatzzeichen/web-component': 'workspace:*',
          astro: '7.2.9',
        },
        malformedDependencySections: [],
      },
    ],
    sourceFiles: [],
    sourceSymlinks: [],
    trackedFiles: [],
    gitignore: '/taktische-zeichen/\n/taktische-zeichen.zip\n',
    effectivelyIgnoredReferenceTargets: [
      'taktische-zeichen/',
      'taktische-zeichen.zip',
    ],
  };
}

function writeValidRepositoryFixture(root: string): void {
  for (const manifest of validPolicyInput().manifests) {
    const packageRoot = join(root, 'packages', manifest.id);
    mkdirSync(join(packageRoot, 'src'), { recursive: true });
    writeFileSync(
      join(packageRoot, 'package.json'),
      JSON.stringify({
        name: manifest.name,
        ...(manifest.isPrivate ? { private: true } : {}),
        dependencies: manifest.dependencies,
      }),
      'utf8',
    );
    writeFileSync(join(packageRoot, 'src/index.ts'), 'export {};\n', 'utf8');
  }
  writeFileSync(
    join(root, '.gitignore'),
    '/taktische-zeichen/\n/taktische-zeichen.zip\n',
    'utf8',
  );
}

function manifestOf(input: RepositoryPolicyInput, id: WorkspacePackageId) {
  const manifest = input.manifests.find((candidate) => candidate.id === id);
  if (manifest === undefined) throw new Error(`Testfixture ohne ${id}-Manifest`);
  return manifest;
}

function internalEdges(input: RepositoryPolicyInput): Record<string, string[]> {
  return Object.fromEntries(
    input.manifests.map((manifest) => [
      manifest.id,
      Object.keys(manifest.dependencies)
        .filter((name) => name.startsWith('@einsatzzeichen/'))
        .sort(),
    ]),
  );
}

/**
 * Jede Kante, die das Zielbild `cli → conformance → core → schema`, Kanäle → core, verbietet.
 * Erlaubte Kanten stehen im Positivfall, der das echte Repository abbildet.
 */
const FORBIDDEN_EDGES: ReadonlyArray<readonly [WorkspacePackageId, WorkspacePackageId, string]> = [
  ['schema', 'core', 'schema hängt an keinem Workspace-Paket'],
  ['core', 'conformance', 'conformance ist das Prüfpaket'],
  ['core', 'react', 'core darf nur an schema hängen'],
  ['core', 'cli', 'core darf nur an schema hängen'],
  ['conformance', 'cli', 'conformance darf nur an core, schema hängen'],
  ['conformance', 'maplibre', 'conformance darf nur an core, schema hängen'],
  ['react', 'conformance', 'von den veröffentlichten Paketen hängt nur cli daran'],
  ['web-component', 'react', 'web-component darf nur an core, schema hängen'],
  ['qgis', 'cli', 'qgis darf nur an core, schema hängen'],
  ['cli', 'react', 'cli darf nur an conformance, core, schema hängen'],
  ['cli', 'web-component', 'cli darf nur an conformance, core, schema hängen'],
  ['cli', 'review', 'review ist privat und wird nicht veröffentlicht'],
  ['core', 'website', 'website ist privat und wird nicht veröffentlicht'],
  ['review', 'website', 'private Pakete hängen nicht aneinander'],
  ['website', 'review', 'private Pakete hängen nicht aneinander'],
  ['core', 'core', 'ein Paket bezieht sich nicht über seinen eigenen Paketnamen'],
];

describe('Repository-Policy — Paketgrenzen', () => {
  it('akzeptiert das Zielbild: cli → conformance → core → schema, Kanäle → core, private Werkzeuge → alles Veröffentlichte', () => {
    expect(findRepositoryPolicyViolations(validPolicyInput())).toEqual([]);
  });

  it(
    'bildet mit dem Positivfall die internen Kanten des echten Repositorys ab',
    { timeout: 30_000 },
    () => {
      const real = readRepositoryPolicyInput({
        root: REPOSITORY_ROOT,
        trackedFiles: [],
        effectivelyIgnoredReferenceTargets: ['taktische-zeichen/', 'taktische-zeichen.zip'],
      });
      expect(internalEdges(real)).toEqual(internalEdges(validPolicyInput()));
      expect(
        Object.fromEntries(real.manifests.map((manifest) => [manifest.id, manifest.isPrivate])),
      ).toEqual(
        Object.fromEntries(
          validPolicyInput().manifests.map((manifest) => [manifest.id, manifest.isPrivate]),
        ),
      );
    },
  );

  it.each(FORBIDDEN_EDGES)(
    'weist die verbotene Kante %s → %s im Paketmanifest mit Begründung zurück',
    (importer, target, reason) => {
      const input = validPolicyInput();
      manifestOf(input, importer).dependencies[`@einsatzzeichen/${target}`] = 'workspace:*';

      const violations = findRepositoryPolicyViolations(input);
      expect(violations).toEqual([
        expect.objectContaining({
          code: 'forbidden-internal-dependency',
          path: `packages/${importer}/package.json`,
          importer,
          target,
          specifier: `@einsatzzeichen/${target}`,
        }),
      ]);
      expect(violations[0]?.detail).toContain(`Verbotene Abhängigkeit ${importer} → ${target}`);
      expect(violations[0]?.detail).toContain(reason);
    },
  );

  it.each(FORBIDDEN_EDGES)(
    'weist die verbotene Kante %s → %s im Quelltext mit Begründung zurück',
    (importer, target, reason) => {
      const input = validPolicyInput();
      const path = `packages/${importer}/src/edge.ts`;
      input.sourceFiles.push({
        packageId: importer,
        path,
        source: `import '@einsatzzeichen/${target}';\n`,
      });

      const violations = findRepositoryPolicyViolations(input);
      expect(violations).toContainEqual(
        expect.objectContaining({
          code: 'forbidden-internal-import',
          path,
          importer,
          target,
          specifier: `@einsatzzeichen/${target}`,
        }),
      );
      const detail = violations.find((violation) => violation.path === path)?.detail ?? '';
      expect(detail).toContain(`Verbotener Import ${importer} → ${target}`);
      expect(detail).toContain(reason);
    },
  );

  it.each([
    ['review', true, false, 'muss "private": true setzen'],
    ['conformance', false, true, 'darf nicht "private": true setzen'],
  ] as const)(
    'bindet %s an seinen Veröffentlichungsstatus',
    (id, expectedPrivate, actualPrivate, message) => {
      const input = validPolicyInput();
      const manifest = manifestOf(input, id);
      expect(manifest.isPrivate).toBe(expectedPrivate);
      manifest.isPrivate = actualPrivate;

      expect(findRepositoryPolicyViolations(input)).toEqual([
        expect.objectContaining({
          code: 'unexpected-publish-status',
          path: `packages/${id}/package.json`,
          importer: id,
          detail: expect.stringContaining(message),
        }),
      ]);
    },
  );

  it('erkennt node:-Importe in core an der Importkante, nicht am Wort im Kommentar', () => {
    const input = validPolicyInput();
    input.sourceFiles.push(
      {
        packageId: 'core',
        path: 'packages/core/src/rules/comment.ts',
        source:
          '// Früher lag hier ein Zugriff über node:fs; import { readFileSync } from "node:fs";\n' +
          "export const note = 'node:fs';\n",
      },
      {
        packageId: 'core',
        path: 'packages/core/src/rules/comment.test.ts',
        source: "import { readFileSync } from 'node:fs';\n",
      },
    );
    expect(findRepositoryPolicyViolations(input)).toEqual([]);

    input.sourceFiles.push({
      packageId: 'core',
      path: 'packages/core/src/rules/io.ts',
      source: "export { readFileSync } from 'node:fs';\n",
    });
    expect(findRepositoryPolicyViolations(input)).toEqual([
      expect.objectContaining({
        code: 'forbidden-external-import',
        path: 'packages/core/src/rules/io.ts',
        importer: 'core',
        specifier: 'node:fs',
        detail: expect.stringContaining('Browser'),
      }),
    ]);
  });

  it('ordnet virtuelle Framework-Module wie astro:content dem deklarierten Framework zu', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'website',
      path: 'packages/website/src/content.config.ts',
      source: "import { defineCollection } from 'astro:content';\n",
    });
    expect(findRepositoryPolicyViolations(input)).toEqual([]);

    delete manifestOf(input, 'website').dependencies.astro;
    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'undeclared-external-import',
        path: 'packages/website/src/content.config.ts',
        importer: 'website',
        specifier: 'astro:content',
      }),
    );
  });

  it.each(['react', 'web-component', 'maplibre', 'qgis'] as const)(
    'weist eine Abhängigkeit und einen Import des Ausgabekanals %s auf conformance zurück',
    (packageId) => {
      const input = validPolicyInput();
      const manifest = input.manifests.find((candidate) => candidate.id === packageId);
      if (manifest === undefined) throw new Error(`Testfixture ohne ${packageId}-Manifest`);
      manifest.dependencies['@einsatzzeichen/conformance'] = 'workspace:*';
      input.sourceFiles.push({
        packageId,
        path: `packages/${packageId}/src/pull.ts`,
        source: "export { RECIPES } from '@einsatzzeichen/conformance';\n",
      });

      const violations = findRepositoryPolicyViolations(input);
      expect(violations).toContainEqual(
        expect.objectContaining({
          code: 'forbidden-internal-dependency',
          importer: packageId,
          target: 'conformance',
        }),
      );
      expect(violations).toContainEqual(
        expect.objectContaining({
          code: 'forbidden-internal-import',
          importer: packageId,
          target: 'conformance',
        }),
      );
    },
  );

  it('weist einen Import von conformance auf einen Ausgabekanal zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'conformance',
      path: 'packages/conformance/src/channel.ts',
      source: "export { qgisSymbolLibrary } from '@einsatzzeichen/qgis';\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'forbidden-internal-import',
        importer: 'conformance',
        target: 'qgis',
      }),
    );
  });

  it('weist einen Import zwischen zwei Ausgabekanälen zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'react',
      path: 'packages/react/src/sibling.ts',
      source: "export { createStyleImage } from '@einsatzzeichen/maplibre';\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'forbidden-internal-import',
        importer: 'react',
        target: 'maplibre',
      }),
    );
  });

  it('weist eine rückwärts gerichtete Workspace-Abhängigkeit von core auf conformance zurück', () => {
    const input = validPolicyInput();
    const core = input.manifests.find((manifest) => manifest.id === 'core');
    if (core === undefined) throw new Error('Testfixture ohne core-Manifest');
    core.dependencies['@einsatzzeichen/conformance'] = 'workspace:*';

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'forbidden-internal-dependency',
        path: 'packages/core/package.json',
        importer: 'core',
        target: 'conformance',
      }),
    );
  });

  it.each(['core', 'schema'] as const)(
    'weist eine externe Laufzeitabhängigkeit im dependency-freien Paket %s zurück',
    (packageId) => {
      const input = validPolicyInput();
      const manifest = input.manifests.find((candidate) => candidate.id === packageId);
      if (manifest === undefined) throw new Error(`Testfixture ohne ${packageId}-Manifest`);
      manifest.dependencies['left-pad'] = '1.3.0';

      expect(findRepositoryPolicyViolations(input)).toContainEqual(
        expect.objectContaining({
          code: 'forbidden-external-dependency',
          path: `packages/${packageId}/package.json`,
          importer: packageId,
          specifier: 'left-pad',
        }),
      );
    },
  );

  it('weist ein unbekanntes @einsatzzeichen-Paket bereits im Paketmanifest zurück', () => {
    const input = validPolicyInput();
    const cli = input.manifests.find((manifest) => manifest.id === 'cli');
    if (cli === undefined) throw new Error('Testfixture ohne cli-Manifest');
    cli.dependencies['@einsatzzeichen/unknown'] = 'workspace:*';

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'unknown-internal-dependency',
        path: 'packages/cli/package.json',
        importer: 'cli',
        specifier: '@einsatzzeichen/unknown',
      }),
    );
  });

  it('bindet jede feste Paketwurzel an ihren erwarteten @einsatzzeichen-Namen', () => {
    const input = validPolicyInput();
    const core = input.manifests.find((manifest) => manifest.id === 'core');
    if (core === undefined) throw new Error('Testfixture ohne core-Manifest');
    core.name = '@einsatzzeichen/renamed-core';

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'unexpected-package-name',
        path: 'packages/core/package.json',
        importer: 'core',
        specifier: '@einsatzzeichen/renamed-core',
      }),
    );
  });

  it('weist einen rückwärts gerichteten Quellcode-Import von core auf conformance zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'core',
      path: 'packages/core/src/reverse.ts',
      source: "import { catalogEntry } from '@einsatzzeichen/conformance';\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'forbidden-internal-import',
        path: 'packages/core/src/reverse.ts',
        importer: 'core',
        target: 'conformance',
        specifier: '@einsatzzeichen/conformance',
      }),
    );
  });

  it.each([
    ['Re-Export', "export { catalogEntry } from '@einsatzzeichen/conformance';\n"],
    ['dynamischen Import', "void import('@einsatzzeichen/conformance');\n"],
    [
      'Inline-Importtyp',
      "type Catalog = import('@einsatzzeichen/conformance').CatalogEntry;\n",
    ],
    ['dynamischen Template-Import', "void import(`@einsatzzeichen/conformance`);\n"],
    ['require-Aufruf', "const conformance = require('@einsatzzeichen/conformance');\n"],
    [
      'TypeScript-import-equals',
      "import conformance = require('@einsatzzeichen/conformance');\n",
    ],
  ])('erkennt auch einen rückwärts gerichteten %s', (_form, source) => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'core',
      path: 'packages/core/src/reverse.ts',
      source,
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'forbidden-internal-import',
        path: 'packages/core/src/reverse.ts',
        importer: 'core',
        target: 'conformance',
        specifier: '@einsatzzeichen/conformance',
      }),
    );
  });

  it('weist einen nicht statisch auflösbaren dynamischen Import fail-closed zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'cli',
      path: 'packages/cli/src/dynamic.ts',
      source:
        "const target = '@einsatzzeichen/conformance';\n" +
        'void import(target);\n',
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'unresolved-module-import',
        path: 'packages/cli/src/dynamic.ts',
        importer: 'cli',
      }),
    );
  });

  it('parst TSX-Quellen gemäß ihrer Dateiendung und erkennt Importe in JSX-Ausdrücken', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'core',
      path: 'packages/core/src/reverse.tsx',
      source:
        "export const view = <button>{import('@einsatzzeichen/conformance')}</button>;\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'forbidden-internal-import',
        path: 'packages/core/src/reverse.tsx',
        importer: 'core',
        target: 'conformance',
        specifier: '@einsatzzeichen/conformance',
      }),
    );
  });

  it('weist eine syntaktisch ungültige TypeScript-Quelle fail-closed zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'core',
      path: 'packages/core/src/malformed.ts',
      source: "import { catalogEntry } from '@einsatzzeichen/conformance\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'typescript-parse-error',
        path: 'packages/core/src/malformed.ts',
        importer: 'core',
      }),
    );
  });

  it('wertet Kommentare und Stringliterale mit Paketnamen nicht als Importkante', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'schema',
      path: 'packages/schema/src/note.ts',
      source:
        "// import '@einsatzzeichen/core'\n" +
        "export const note = \"@einsatzzeichen/core ist hier nur Dokumentation\";\n",
    });

    expect(findRepositoryPolicyViolations(input)).toEqual([]);
  });

  it('weist einen Import eines unbekannten @einsatzzeichen-Pakets fail-closed zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'cli',
      path: 'packages/cli/src/unknown.ts',
      source: "import '@einsatzzeichen/unknown';\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'unknown-internal-import',
        path: 'packages/cli/src/unknown.ts',
        importer: 'cli',
        specifier: '@einsatzzeichen/unknown',
      }),
    );
  });

  it('weist einen erlaubten, aber im Paketmanifest nicht deklarierten internen Import zurück', () => {
    const input = validPolicyInput();
    const conformance = input.manifests.find((manifest) => manifest.id === 'conformance');
    if (conformance === undefined) throw new Error('Testfixture ohne conformance-Manifest');
    delete conformance.dependencies['@einsatzzeichen/core'];
    input.sourceFiles.push({
      packageId: 'conformance',
      path: 'packages/conformance/src/undeclared.ts',
      source: "import { renderSvg } from '@einsatzzeichen/core';\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'undeclared-internal-import',
        path: 'packages/conformance/src/undeclared.ts',
        importer: 'conformance',
        target: 'core',
        specifier: '@einsatzzeichen/core',
      }),
    );
  });

  it.each([
    ['core', "import { readFileSync } from 'node:fs';\n"],
    ['schema', "import leftPad from 'left-pad';\n"],
  ] as const)('weist einen externen Produktionsimport im Paket %s zurück', (packageId, source) => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId,
      path: `packages/${packageId}/src/external.ts`,
      source,
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'forbidden-external-import',
        path: `packages/${packageId}/src/external.ts`,
        importer: packageId,
      }),
    );
  });

  it('weist einen nicht deklarierten externen Produktionsimport in cli zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'cli',
      path: 'packages/cli/src/compiler.ts',
      source: "import * as ts from 'typescript';\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'undeclared-external-import',
        path: 'packages/cli/src/compiler.ts',
        importer: 'cli',
        specifier: 'typescript',
      }),
    );
  });

  it('erlaubt Testwerkzeuge in core- und schema-Testdateien, ohne die Produktionsgrenze zu öffnen', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'core',
      path: 'packages/core/src/render/svg.test.ts',
      source: "import { expect, it } from 'vitest';\n",
    });

    expect(findRepositoryPolicyViolations(input)).not.toContainEqual(
      expect.objectContaining({
        code: 'forbidden-external-import',
        path: 'packages/core/src/render/svg.test.ts',
      }),
    );
  });

  it('weist einen relativen Import über eine Paketgrenze auch in erlaubter Abhängigkeitsrichtung zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'conformance',
      path: 'packages/conformance/src/nested/bypass.ts',
      source: "import { renderSvg } from '../../../core/src/index.js';\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'relative-cross-package-import',
        path: 'packages/conformance/src/nested/bypass.ts',
        importer: 'conformance',
        target: 'core',
        specifier: '../../../core/src/index.js',
      }),
    );
  });

  it('weist einen relativen Import aus dem eigenen Paketbaum heraus fail-closed zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'core',
      path: 'packages/core/src/nested/bypass.ts',
      source: "import '../../../../shared.js';\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'relative-import-escapes-package',
        path: 'packages/core/src/nested/bypass.ts',
        importer: 'core',
        specifier: '../../../../shared.js',
      }),
    );
  });
});

describe('Repository-Policy — lokaler Referenzbestand', () => {
  it('meldet jede im Git-Index liegende Referenzdatei und das Referenz-ZIP', () => {
    const input = validPolicyInput();
    input.trackedFiles.push(
      'taktische-zeichen/1.1_Taktische Formation.svg',
      'taktische-zeichen.zip',
    );

    expect(
      findRepositoryPolicyViolations(input)
        .filter((violation) => violation.code === 'tracked-reference-asset')
        .map((violation) => violation.path),
    ).toEqual(['taktische-zeichen.zip', 'taktische-zeichen/1.1_Taktische Formation.svg']);
  });

  it.each(['/taktische-zeichen/', '/taktische-zeichen.zip'])(
    'fordert die schützende Root-Regel %s in .gitignore',
    (requiredRule) => {
      const input = validPolicyInput();
      input.gitignore = input.gitignore
        .split('\n')
        .filter((line) => line !== requiredRule)
        .join('\n');

      expect(findRepositoryPolicyViolations(input)).toContainEqual(
        expect.objectContaining({
          code: 'missing-reference-ignore-rule',
          path: '.gitignore',
          specifier: requiredRule,
        }),
      );
    },
  );

  it('verwechselt ähnlich benannte Pfade außerhalb der beiden Rootziele nicht mit Referenzassets', () => {
    const input = validPolicyInput();
    input.trackedFiles.push(
      'archive/taktische-zeichen.zip',
      'taktische-zeichen-backup/example.svg',
    );

    expect(
      findRepositoryPolicyViolations(input).filter(
        (violation) => violation.code === 'tracked-reference-asset',
      ),
    ).toEqual([]);
  });
});

describe('Repository-Policy — Repository-Adapter', () => {
  it('liest alle Dependency-Abschnitte und TypeScript-Quellen aus einem Repository', () => {
    const root = mkdtempSync(join(tmpdir(), 'einsatzzeichen-policy-'));
    try {
      writeValidRepositoryFixture(root);
      const coreManifest = validPolicyInput().manifests.find(
        (manifest) => manifest.id === 'core',
      );
      if (coreManifest === undefined) throw new Error('Testfixture ohne core-Manifest');
      writeFileSync(
        join(root, 'packages/core/package.json'),
        JSON.stringify({
          name: coreManifest.name,
          dependencies: coreManifest.dependencies,
          devDependencies: { '@einsatzzeichen/conformance': 'workspace:*' },
        }),
        'utf8',
      );
      writeFileSync(
        join(root, 'packages/core/src/reverse.ts'),
        "export { catalogEntry } from '@einsatzzeichen/conformance';\n",
        'utf8',
      );

      const violations = findRepositoryPolicyViolations(
        readRepositoryPolicyInput({
          root,
          trackedFiles: [],
          effectivelyIgnoredReferenceTargets: [
            'taktische-zeichen/',
            'taktische-zeichen.zip',
          ],
        }),
      );

      expect(violations).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            code: 'forbidden-internal-dependency',
            importer: 'core',
            target: 'conformance',
          }),
          expect.objectContaining({
            code: 'forbidden-internal-import',
            importer: 'core',
            target: 'conformance',
          }),
        ]),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('verwirft einen nicht-stringförmigen Dependency-Wert, statt ihn beim Einlesen zu verlieren', () => {
    const root = mkdtempSync(join(tmpdir(), 'einsatzzeichen-malformed-manifest-'));
    try {
      writeValidRepositoryFixture(root);
      writeFileSync(
        join(root, 'packages/core/package.json'),
        JSON.stringify({
          name: '@einsatzzeichen/core',
          dependencies: { '@einsatzzeichen/schema': null },
        }),
        'utf8',
      );

      const input = readRepositoryPolicyInput({
        root,
        trackedFiles: [],
        effectivelyIgnoredReferenceTargets: ['taktische-zeichen/', 'taktische-zeichen.zip'],
      });
      expect(findRepositoryPolicyViolations(input)).toContainEqual(
        expect.objectContaining({
          code: 'malformed-dependency-version',
          path: 'packages/core/package.json',
          importer: 'core',
          specifier: '@einsatzzeichen/schema',
        }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('weist einen strukturell ungültigen Dependency-Abschnitt fail-closed zurück', () => {
    const root = mkdtempSync(join(tmpdir(), 'einsatzzeichen-malformed-section-'));
    try {
      writeValidRepositoryFixture(root);
      writeFileSync(
        join(root, 'packages/core/package.json'),
        JSON.stringify({ name: '@einsatzzeichen/core', dependencies: null }),
        'utf8',
      );

      const input = readRepositoryPolicyInput({
        root,
        trackedFiles: [],
        effectivelyIgnoredReferenceTargets: ['taktische-zeichen/', 'taktische-zeichen.zip'],
      });
      expect(findRepositoryPolicyViolations(input)).toContainEqual(
        expect.objectContaining({
          code: 'malformed-dependency-section',
          path: 'packages/core/package.json',
          importer: 'core',
          specifier: 'dependencies',
        }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('liest nur den NUL-getrennten Git-Index und lässt lokale ignorierte Originale unangetastet', () => {
    const root = mkdtempSync(join(tmpdir(), 'einsatzzeichen-git-index-'));
    try {
      execFileSync('git', ['init', '--quiet'], { cwd: root });
      writeFileSync(
        join(root, '.gitignore'),
        '/taktische-zeichen/\n/taktische-zeichen.zip\n',
        'utf8',
      );
      mkdirSync(join(root, 'taktische-zeichen'));
      writeFileSync(join(root, 'taktische-zeichen/local.svg'), '<svg/>', 'utf8');
      writeFileSync(join(root, 'normal\nname.txt'), 'tracked', 'utf8');
      execFileSync('git', ['add', '.gitignore', 'normal\nname.txt'], { cwd: root });

      expect(readGitTrackedFiles(root)).toEqual(['.gitignore', 'normal\nname.txt']);

      writeFileSync(join(root, 'taktische-zeichen.zip'), 'local', 'utf8');
      execFileSync(
        'git',
        ['add', '--force', 'taktische-zeichen/local.svg', 'taktische-zeichen.zip'],
        { cwd: root },
      );
      expect(readGitTrackedFiles(root)).toEqual([
        '.gitignore',
        'normal\nname.txt',
        'taktische-zeichen.zip',
        'taktische-zeichen/local.svg',
      ]);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('weist einen eingecheckten Symlink unter einer Paketquelle fail-closed zurück', () => {
    const root = mkdtempSync(join(tmpdir(), 'einsatzzeichen-source-symlink-'));
    try {
      writeValidRepositoryFixture(root);
      execFileSync('git', ['init', '--quiet'], { cwd: root });
      const symlinkPath = join(root, 'packages/core/src/conformance-link.ts');
      symlinkSync('../../conformance/src/index.ts', symlinkPath);
      execFileSync('git', ['add', 'packages/core/src/conformance-link.ts'], { cwd: root });

      expect(findRepositoryPolicyViolations(readRepositoryPolicyInput({ root }))).toContainEqual(
        expect.objectContaining({
          code: 'source-symlink',
          path: 'packages/core/src/conformance-link.ts',
          importer: 'core',
        }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it.each([
    ['!/taktische-zeichen.zip', 'taktische-zeichen.zip'],
    ['!/taktische-zeichen/', 'taktische-zeichen/'],
  ])(
    'erkennt, wenn eine spätere Negationsregel %s den Referenzschutz für %s aufhebt',
    (negation, target) => {
      const root = mkdtempSync(join(tmpdir(), 'einsatzzeichen-ignore-negation-'));
      try {
        writeValidRepositoryFixture(root);
        execFileSync('git', ['init', '--quiet'], { cwd: root });
        writeFileSync(
          join(root, '.gitignore'),
          `/taktische-zeichen/\n/taktische-zeichen.zip\n${negation}\n`,
          'utf8',
        );

        expect(
          findRepositoryPolicyViolations(readRepositoryPolicyInput({ root })),
        ).toContainEqual(
          expect.objectContaining({
            code: 'ineffective-reference-ignore-rule',
            path: '.gitignore',
            specifier: target,
          }),
        );
      } finally {
        rmSync(root, { recursive: true, force: true });
      }
    },
  );

  it('lässt einen aufgehobenen Ordnerschutz nicht durch ein erneut ignoriertes Canary passieren', () => {
    const root = mkdtempSync(join(tmpdir(), 'einsatzzeichen-ignore-canary-bypass-'));
    try {
      writeValidRepositoryFixture(root);
      execFileSync('git', ['init', '--quiet'], { cwd: root });
      writeFileSync(
        join(root, '.gitignore'),
        '/taktische-zeichen/\n' +
          '!/taktische-zeichen/\n' +
          '/taktische-zeichen/.repository-policy-probe.svg\n' +
          '/taktische-zeichen.zip\n',
        'utf8',
      );

      expect(findRepositoryPolicyViolations(readRepositoryPolicyInput({ root }))).toContainEqual(
        expect.objectContaining({
          code: 'ineffective-reference-ignore-rule',
          path: '.gitignore',
          specifier: 'taktische-zeichen/',
        }),
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('ist als erfolgreiches verify:repository-Kommando über den echten CLI-Einstieg erreichbar', () => {
    const result = spawnSync(process.execPath, [TSX_ENTRY, CLI_ENTRY, 'verify:repository'], {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8',
    });

    expect(result.status, result.stderr).toBe(0);
    expect(result.stderr).toBe('');
    expect(result.stdout).toContain('Repository-Gate bestanden.');
  });

  // Dieser Fall liest das echte Repository, das seit LFH-405 acht statt vier Pakete umfasst;
  // unter Last lief er in die Vitest-Vorgabe von 5 s. Der Timeout steht bewusst hier, nicht global.
  it(
    'bricht mit allen Repository-Befunden ab, statt trotz Verletzung Erfolg auszugeben',
    { timeout: 30_000 },
    () => {
      let thrown: unknown;
      try {
        verifyRepository({
          root: REPOSITORY_ROOT,
          trackedFiles: ['taktische-zeichen.zip', 'taktische-zeichen/local.svg'],
        });
      } catch (error) {
        thrown = error;
      }

      expect(thrown).toBeInstanceOf(Error);
      if (!(thrown instanceof Error)) throw new Error('Repository-Gate warf keinen Error');
      expect(thrown.message).toContain('[tracked-reference-asset] taktische-zeichen.zip');
      expect(thrown.message).toContain(
        '[tracked-reference-asset] taktische-zeichen/local.svg',
      );
    },
  );

  it('liefert bei einem echten CLI-Verstoß Status 1 und eine Befundliste ohne Stacktrace', () => {
    const root = mkdtempSync(join(tmpdir(), 'einsatzzeichen-cli-policy-'));
    try {
      writeValidRepositoryFixture(root);
      execFileSync('git', ['init', '--quiet'], { cwd: root });
      mkdirSync(join(root, 'taktische-zeichen'));
      writeFileSync(join(root, 'taktische-zeichen/local.svg'), '<svg/>', 'utf8');
      writeFileSync(join(root, 'taktische-zeichen.zip'), 'local', 'utf8');
      execFileSync(
        'git',
        ['add', '--force', 'taktische-zeichen/local.svg', 'taktische-zeichen.zip'],
        { cwd: root },
      );

      const result = spawnSync(process.execPath, [TSX_ENTRY, CLI_ENTRY, 'verify:repository'], {
        cwd: root,
        encoding: 'utf8',
      });

      expect(result.status).toBe(1);
      expect(result.stdout).toBe('');
      expect(result.stderr).toContain('[tracked-reference-asset] taktische-zeichen.zip');
      expect(result.stderr).toContain(
        '[tracked-reference-asset] taktische-zeichen/local.svg',
      );
      expect(result.stderr).not.toContain('at verifyRepository');
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
