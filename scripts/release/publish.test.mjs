import { execFileSync, spawnSync } from 'node:child_process';
import {
  chmodSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, test } from 'vitest';

const skriptordner = dirname(fileURLToPath(import.meta.url));

describe('publish.mjs', () => {
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
        '-c',
        'commit.gpgsign=false',
        '-c',
        'tag.gpgSign=false',
        '-c',
        'tag.forceSignAnnotated=false',
        ...args,
      ],
      { cwd, encoding: 'utf8' },
    );

  const schreibeManifest = (cwd, name, version, extra = {}) => {
    mkdirSync(join(cwd, 'packages', name, 'src'), { recursive: true });
    writeFileSync(
      join(cwd, 'packages', name, 'package.json'),
      `${JSON.stringify({ name: `@einsatzzeichen/${name}`, version, ...extra }, null, 2)}\n`,
    );
  };

  /**
   * Baut ein Miniatur-Repo mit den echten Release-Skripten und einem aufzeichnenden `pnpm`
   * im PATH — so lässt sich prüfen, ob überhaupt publiziert würde, ohne npm zu berühren.
   */
  const fixture = () => {
    const cwd = mkdtempSync(join(tmpdir(), 'einsatzzeichen-publish-'));
    angelegteVerzeichnisse.push(cwd);
    mkdirSync(join(cwd, 'scripts', 'release'), { recursive: true });
    for (const datei of ['publish.mjs', 'changed-packages.mjs']) {
      copyFileSync(join(skriptordner, datei), join(cwd, 'scripts', 'release', datei));
    }
    for (const name of ['core', 'react']) {
      schreibeManifest(cwd, name, '1.0.2');
      writeFileSync(join(cwd, 'packages', name, 'src', 'index.ts'), 'export const a = 1;\n');
    }
    schreibeManifest(cwd, 'website', '1.0.2', { private: true });
    writeFileSync(join(cwd, 'packages', 'website', 'src', 'index.ts'), 'export const b = 1;\n');
    git(cwd, 'init', '--initial-branch=main');
    git(cwd, 'add', '-A');
    git(cwd, 'commit', '-m', 'chore(release): 1.0.2');
    git(cwd, 'tag', 'v1.0.2');

    const bin = join(cwd, 'bin');
    mkdirSync(bin);
    const protokoll = join(cwd, 'pnpm-aufrufe.txt');
    writeFileSync(join(bin, 'pnpm'), `#!/bin/sh\necho "$@" >> ${JSON.stringify(protokoll)}\n`);
    chmodSync(join(bin, 'pnpm'), 0o755);

    return {
      cwd,
      bin,
      pnpmAufrufe: () => (existsSync(protokoll) ? readFileSync(protokoll, 'utf8').trim() : ''),
    };
  };

  const releaseCommit = (cwd, version) => {
    for (const name of ['core', 'react']) schreibeManifest(cwd, name, version);
    schreibeManifest(cwd, 'website', version, { private: true });
    git(cwd, 'add', '-A');
    git(cwd, 'commit', '-m', `chore(release): ${version}`);
  };

  const starte = ({ cwd, bin }, tag) =>
    spawnSync(process.execPath, [join(cwd, 'scripts', 'release', 'publish.mjs'), tag], {
      cwd,
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
    });

  test('publiziert nicht, wenn sich nur die private Website und die Versionen bewegt haben', () => {
    const repo = fixture();
    writeFileSync(join(repo.cwd, 'packages', 'website', 'src', 'index.ts'), 'export const b = 2;\n');
    releaseCommit(repo.cwd, '1.0.3');

    const lauf = starte(repo, 'v1.0.2');

    expect(lauf.status).toBe(0);
    expect(repo.pnpmAufrufe()).toBe('');
    expect(lauf.stdout).toContain('übersprungen');
  });

  test('publiziert den Workspace, wenn sich ein Paket bewegt hat', () => {
    const repo = fixture();
    writeFileSync(join(repo.cwd, 'packages', 'core', 'src', 'index.ts'), 'export const a = 2;\n');
    releaseCommit(repo.cwd, '1.0.3');

    const lauf = starte(repo, 'v1.0.2');

    expect(lauf.status).toBe(0);
    expect(repo.pnpmAufrufe()).toBe('-r publish --access public --no-git-checks --provenance');
    expect(lauf.stdout).toContain('core');
  });
});
