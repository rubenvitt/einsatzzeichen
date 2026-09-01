import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import {
  changedPublishablePackages,
  collectChangedPackages,
  isVersionOnlyDiff,
} from './changed-packages.mjs';

describe('isVersionOnlyDiff', () => {
  test('erkennt den reinen Versionsbump von set-version.mjs als belanglos', () => {
    const diff = [
      'diff --git a/packages/core/package.json b/packages/core/package.json',
      'index 1111111..2222222 100644',
      '--- a/packages/core/package.json',
      '+++ b/packages/core/package.json',
      '@@ -2 +2 @@',
      '-  "version": "1.0.2",',
      '+  "version": "1.0.3",',
    ].join('\n');

    expect(isVersionOnlyDiff(diff)).toBe(true);
  });

  test('wertet eine geänderte Abhängigkeit als echte Änderung', () => {
    const diff = [
      '--- a/packages/core/package.json',
      '+++ b/packages/core/package.json',
      '@@ -2 +2 @@',
      '-  "version": "1.0.2",',
      '+  "version": "1.0.3",',
      '@@ -30 +30 @@',
      '-    "@einsatzzeichen/schema": "workspace:*"',
      '+    "@einsatzzeichen/schema": "workspace:^"',
    ].join('\n');

    expect(isVersionOnlyDiff(diff)).toBe(false);
  });
});

describe('changedPublishablePackages', () => {
  const privatePackages = ['website'];

  test('meldet ein Paket mit geänderter Quelldatei', () => {
    const changes = [{ path: 'packages/core/src/render.ts' }];

    expect(changedPublishablePackages({ changes, privatePackages })).toEqual(['core']);
  });

  test('übergeht private Pakete', () => {
    const changes = [
      { path: 'packages/website/src/pages/index.astro' },
      { path: 'packages/website/package.json' },
    ];

    expect(changedPublishablePackages({ changes, privatePackages })).toEqual([]);
  });

  test('übergeht Dateien außerhalb von packages/', () => {
    const changes = [
      { path: 'docs/decisions/2026-09-01-irgendwas.md' },
      { path: '.github/workflows/release.yml' },
      { path: 'CHANGELOG.md' },
    ];

    expect(changedPublishablePackages({ changes, privatePackages })).toEqual([]);
  });

  test('übergeht package.json, die nur die Version bewegt', () => {
    const changes = [
      { path: 'packages/core/package.json', versionOnly: true },
      { path: 'packages/react/package.json', versionOnly: true },
    ];

    expect(changedPublishablePackages({ changes, privatePackages })).toEqual([]);
  });

  test('meldet ein Paket, dessen package.json über die Version hinaus abweicht', () => {
    const changes = [
      { path: 'packages/core/package.json', versionOnly: true },
      { path: 'packages/react/package.json', versionOnly: false },
    ];

    expect(changedPublishablePackages({ changes, privatePackages })).toEqual(['react']);
  });

  test('nennt jedes Paket genau einmal und sortiert', () => {
    const changes = [
      { path: 'packages/react/src/index.ts' },
      { path: 'packages/core/src/a.ts' },
      { path: 'packages/core/src/b.ts' },
    ];

    expect(changedPublishablePackages({ changes, privatePackages })).toEqual(['core', 'react']);
  });
});

describe('collectChangedPackages im echten Repository', () => {
  /** @type {string[]} */
  const angelegteVerzeichnisse = [];

  afterEach(() => {
    for (const verzeichnis of angelegteVerzeichnisse.splice(0)) {
      rmSync(verzeichnis, { recursive: true, force: true });
    }
  });

  const git = (cwd, ...args) =>
    execFileSync(
      'git',
      [
        '-c',
        'user.name=Test',
        '-c',
        'user.email=test@example.com',
        // Signierung aus: der globale Git-Stand der Entwicklungsmaschine darf das Fixture nicht
        // an einem fehlenden Schlüssel oder erzwungenen Tag-Kommentar scheitern lassen.
        '-c',
        'commit.gpgsign=false',
        '-c',
        'tag.gpgSign=false',
        '-c',
        'tag.forceSignAnnotated=false',
        ...args,
      ],
      {
        cwd,
        encoding: 'utf8',
      },
    );

  const schreibeManifest = (cwd, name, version, extra = {}) => {
    mkdirSync(join(cwd, 'packages', name, 'src'), { recursive: true });
    writeFileSync(
      join(cwd, 'packages', name, 'package.json'),
      `${JSON.stringify({ name: `@einsatzzeichen/${name}`, version, ...extra }, null, 2)}\n`,
    );
  };

  /** Legt ein Miniatur-Repo mit dem Paketzuschnitt des Workspaces an, getaggt auf v1.0.2. */
  const repoMitTag = () => {
    const cwd = mkdtempSync(join(tmpdir(), 'einsatzzeichen-release-'));
    angelegteVerzeichnisse.push(cwd);
    git(cwd, 'init', '--initial-branch=main');
    mkdirSync(join(cwd, 'docs'), { recursive: true });
    writeFileSync(join(cwd, 'docs', 'notiz.md'), 'alt\n');
    for (const name of ['core', 'react']) {
      schreibeManifest(cwd, name, '1.0.2');
      writeFileSync(join(cwd, 'packages', name, 'src', 'index.ts'), 'export const a = 1;\n');
    }
    schreibeManifest(cwd, 'website', '1.0.2', { private: true });
    writeFileSync(join(cwd, 'packages', 'website', 'src', 'index.ts'), 'export const b = 1;\n');
    git(cwd, 'add', '-A');
    git(cwd, 'commit', '-m', 'chore(release): 1.0.2');
    git(cwd, 'tag', 'v1.0.2');
    return cwd;
  };

  /** Bildet nach, was set-version.mjs vor dem Publish in jede package.json schreibt. */
  const versionsBump = (cwd, version) => {
    for (const name of ['core', 'react']) schreibeManifest(cwd, name, version);
    schreibeManifest(cwd, 'website', version, { private: true });
  };

  test('meldet nichts, wenn nur die Website und der Versionsbump abweichen', () => {
    const cwd = repoMitTag();
    writeFileSync(join(cwd, 'packages', 'website', 'src', 'index.ts'), 'export const b = 2;\n');
    versionsBump(cwd, '1.0.3');
    git(cwd, 'add', '-A');
    git(cwd, 'commit', '-m', 'chore(release): 1.0.3');

    expect(collectChangedPackages({ cwd, since: 'v1.0.2' })).toEqual([]);
  });

  test('meldet das Paket, dessen Quelle sich bewegt hat', () => {
    const cwd = repoMitTag();
    writeFileSync(join(cwd, 'packages', 'core', 'src', 'index.ts'), 'export const a = 2;\n');
    versionsBump(cwd, '1.0.3');
    git(cwd, 'add', '-A');
    git(cwd, 'commit', '-m', 'chore(release): 1.0.3');

    expect(collectChangedPackages({ cwd, since: 'v1.0.2' })).toEqual(['core']);
  });

  test('meldet ohne Vergleichspunkt alle publizierbaren Pakete (Erstrelease)', () => {
    const cwd = repoMitTag();

    expect(collectChangedPackages({ cwd, since: '' })).toEqual(['core', 'react']);
  });
});
