import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { copyChangelog, hasVersionEntry } from './copy-changelog.mjs';

describe('hasVersionEntry', () => {
  const changelog = [
    '## [6.4.0](https://github.com/rubenvitt/einsatzzeichen/compare/v6.3.1...v6.4.0) (2026-10-14)',
    '',
    '### Katalog & Core',
    '',
    '## [6.3.1](https://github.com/rubenvitt/einsatzzeichen/compare/v6.3.0...v6.3.1) (2026-10-14)',
  ].join('\n');

  test('findet die Versionsüberschrift des konventionellen Generators', () => {
    expect(hasVersionEntry(changelog, '6.4.0')).toBe(true);
    expect(hasVersionEntry(changelog, '6.3.1')).toBe(true);
  });

  test('übersieht keine fehlende Version und nimmt den Punkt wörtlich', () => {
    expect(hasVersionEntry(changelog, '6.5.0')).toBe(false);
    expect(hasVersionEntry(changelog, '6x4x0')).toBe(false);
  });

  test('zählt eine Erwähnung im Fließtext nicht als Eintrag', () => {
    expect(hasVersionEntry('- seit [7.0.0] anders\n', '7.0.0')).toBe(false);
  });
});

describe('copyChangelog', () => {
  /** @type {string[]} */
  const angelegt = [];

  afterEach(() => {
    for (const verzeichnis of angelegt.splice(0)) rmSync(verzeichnis, { recursive: true, force: true });
  });

  const workspace = (changelog) => {
    const cwd = mkdtempSync(join(tmpdir(), 'einsatzzeichen-changelog-'));
    angelegt.push(cwd);
    writeFileSync(join(cwd, 'CHANGELOG.md'), changelog);
    for (const [name, extra] of [['core', {}], ['schema', {}], ['website', { private: true }]]) {
      mkdirSync(join(cwd, 'packages', name), { recursive: true });
      writeFileSync(
        join(cwd, 'packages', name, 'package.json'),
        JSON.stringify({ name: `@einsatzzeichen/${name}`, version: '2.0.0', ...extra }),
      );
    }
    return cwd;
  };

  test('kopiert das CHANGELOG in jedes publizierbare Paket, nicht in private', () => {
    const changelog = '## [2.0.0](https://example.com) (2026-10-18)\n\n- neu\n';
    const cwd = workspace(changelog);

    expect(copyChangelog({ cwd, version: '2.0.0' })).toEqual(['core', 'schema']);
    expect(readFileSync(join(cwd, 'packages', 'core', 'CHANGELOG.md'), 'utf8')).toBe(changelog);
    expect(readFileSync(join(cwd, 'packages', 'schema', 'CHANGELOG.md'), 'utf8')).toBe(changelog);
    expect(existsSync(join(cwd, 'packages', 'website', 'CHANGELOG.md'))).toBe(false);
  });

  test('bricht ab und kopiert nichts, wenn der Eintrag der Version fehlt', () => {
    const cwd = workspace('## [1.9.0](https://example.com) (2026-10-17)\n');

    expect(() => copyChangelog({ cwd, version: '2.0.0' })).toThrow(/keinen Eintrag für 2\.0\.0/);
    expect(existsSync(join(cwd, 'packages', 'core', 'CHANGELOG.md'))).toBe(false);
  });
});
