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
        dependencies: {
          '@einsatzzeichen/catalog': 'workspace:*',
          '@einsatzzeichen/core': 'workspace:*',
          '@einsatzzeichen/schema': 'workspace:*',
        },
        malformedDependencySections: [],
      },
      {
        id: 'catalog',
        name: '@einsatzzeichen/catalog',
        path: 'packages/catalog/package.json',
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
        dependencies: { '@einsatzzeichen/schema': 'workspace:*' },
        malformedDependencySections: [],
      },
      {
        id: 'schema',
        name: '@einsatzzeichen/schema',
        path: 'packages/schema/package.json',
        dependencies: {},
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
      JSON.stringify({ name: manifest.name, dependencies: manifest.dependencies }),
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

describe('Repository-Policy — Paketgrenzen', () => {
  it('weist eine rückwärts gerichtete Workspace-Abhängigkeit von core auf catalog zurück', () => {
    const input = validPolicyInput();
    const core = input.manifests.find((manifest) => manifest.id === 'core');
    if (core === undefined) throw new Error('Testfixture ohne core-Manifest');
    core.dependencies['@einsatzzeichen/catalog'] = 'workspace:*';

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'forbidden-internal-dependency',
        path: 'packages/core/package.json',
        importer: 'core',
        target: 'catalog',
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

  it('weist einen rückwärts gerichteten Quellcode-Import von core auf catalog zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'core',
      path: 'packages/core/src/reverse.ts',
      source: "import { catalogEntry } from '@einsatzzeichen/catalog';\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'forbidden-internal-import',
        path: 'packages/core/src/reverse.ts',
        importer: 'core',
        target: 'catalog',
        specifier: '@einsatzzeichen/catalog',
      }),
    );
  });

  it.each([
    ['Re-Export', "export { catalogEntry } from '@einsatzzeichen/catalog';\n"],
    ['dynamischen Import', "void import('@einsatzzeichen/catalog');\n"],
    [
      'Inline-Importtyp',
      "type Catalog = import('@einsatzzeichen/catalog').CatalogEntry;\n",
    ],
    ['dynamischen Template-Import', "void import(`@einsatzzeichen/catalog`);\n"],
    ['require-Aufruf', "const catalog = require('@einsatzzeichen/catalog');\n"],
    [
      'TypeScript-import-equals',
      "import catalog = require('@einsatzzeichen/catalog');\n",
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
        target: 'catalog',
        specifier: '@einsatzzeichen/catalog',
      }),
    );
  });

  it('weist einen nicht statisch auflösbaren dynamischen Import fail-closed zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'cli',
      path: 'packages/cli/src/dynamic.ts',
      source:
        "const target = '@einsatzzeichen/catalog';\n" +
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
        "export const view = <button>{import('@einsatzzeichen/catalog')}</button>;\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'forbidden-internal-import',
        path: 'packages/core/src/reverse.tsx',
        importer: 'core',
        target: 'catalog',
        specifier: '@einsatzzeichen/catalog',
      }),
    );
  });

  it('weist eine syntaktisch ungültige TypeScript-Quelle fail-closed zurück', () => {
    const input = validPolicyInput();
    input.sourceFiles.push({
      packageId: 'core',
      path: 'packages/core/src/malformed.ts',
      source: "import { catalogEntry } from '@einsatzzeichen/catalog\n",
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
    const catalog = input.manifests.find((manifest) => manifest.id === 'catalog');
    if (catalog === undefined) throw new Error('Testfixture ohne catalog-Manifest');
    delete catalog.dependencies['@einsatzzeichen/core'];
    input.sourceFiles.push({
      packageId: 'catalog',
      path: 'packages/catalog/src/undeclared.ts',
      source: "import { renderSvg } from '@einsatzzeichen/core';\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'undeclared-internal-import',
        path: 'packages/catalog/src/undeclared.ts',
        importer: 'catalog',
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
      packageId: 'catalog',
      path: 'packages/catalog/src/nested/bypass.ts',
      source: "import { renderSvg } from '../../../core/src/index.js';\n",
    });

    expect(findRepositoryPolicyViolations(input)).toContainEqual(
      expect.objectContaining({
        code: 'relative-cross-package-import',
        path: 'packages/catalog/src/nested/bypass.ts',
        importer: 'catalog',
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
          devDependencies: { '@einsatzzeichen/catalog': 'workspace:*' },
        }),
        'utf8',
      );
      writeFileSync(
        join(root, 'packages/core/src/reverse.ts'),
        "export { catalogEntry } from '@einsatzzeichen/catalog';\n",
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
            target: 'catalog',
          }),
          expect.objectContaining({
            code: 'forbidden-internal-import',
            importer: 'core',
            target: 'catalog',
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
      const symlinkPath = join(root, 'packages/core/src/catalog-link.ts');
      symlinkSync('../../catalog/src/index.ts', symlinkPath);
      execFileSync('git', ['add', 'packages/core/src/catalog-link.ts'], { cwd: root });

      expect(findRepositoryPolicyViolations(readRepositoryPolicyInput({ root }))).toContainEqual(
        expect.objectContaining({
          code: 'source-symlink',
          path: 'packages/core/src/catalog-link.ts',
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

  it('bricht mit allen Repository-Befunden ab, statt trotz Verletzung Erfolg auszugeben', () => {
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
  });

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
