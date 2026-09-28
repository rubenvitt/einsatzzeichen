import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

import { anleitung, findMissingPackages, publishablePackageNames } from './check-registry.mjs';

/** Baut eine Fake-Registry, die nur die übergebenen Pakete kennt. */
const fakeRegistry = (bekannt, { status } = {}) => {
  /** @type {string[]} */
  const aufrufe = [];
  const fetchImpl = async (url) => {
    aufrufe.push(url);
    if (status) return new Response(null, { status });
    const name = decodeURIComponent(url.replace('https://registry.example/', ''));
    return new Response(bekannt.includes(name) ? '{}' : null, {
      status: bekannt.includes(name) ? 200 : 404,
    });
  };
  return { fetchImpl, aufrufe };
};

describe('findMissingPackages', () => {
  test('meldet Pakete, die die Registry mit 404 beantwortet', async () => {
    const { fetchImpl, aufrufe } = fakeRegistry(['@einsatzzeichen/core']);

    const ergebnis = await findMissingPackages({
      names: ['@einsatzzeichen/core', '@einsatzzeichen/conformance'],
      registry: 'https://registry.example/',
      fetchImpl,
    });

    expect(ergebnis).toEqual({ fehlend: ['@einsatzzeichen/conformance'], unklar: [] });
    expect(aufrufe).toContain('https://registry.example/@einsatzzeichen%2fconformance');
  });

  test('blockiert nicht bei Serverfehlern oder Netzproblemen', async () => {
    const { fetchImpl } = fakeRegistry([], { status: 503 });
    const kaputt = async () => {
      throw new Error('ECONNRESET');
    };

    const fuenfhundert = await findMissingPackages({
      names: ['@einsatzzeichen/core'],
      registry: 'https://registry.example',
      fetchImpl,
    });
    const netz = await findMissingPackages({
      names: ['@einsatzzeichen/core'],
      registry: 'https://registry.example',
      fetchImpl: kaputt,
    });

    expect(fuenfhundert).toEqual({
      fehlend: [],
      unklar: [{ name: '@einsatzzeichen/core', grund: 'HTTP 503' }],
    });
    expect(netz).toEqual({
      fehlend: [],
      unklar: [{ name: '@einsatzzeichen/core', grund: 'ECONNRESET' }],
    });
  });
});

describe('publishablePackageNames', () => {
  /** @type {string[]} */
  const angelegteVerzeichnisse = [];

  afterEach(() => {
    for (const verzeichnis of angelegteVerzeichnisse.splice(0)) {
      rmSync(verzeichnis, { recursive: true, force: true });
    }
  });

  test('liest die Paketnamen und lässt private Pakete aus', () => {
    const cwd = mkdtempSync(join(tmpdir(), 'einsatzzeichen-registry-'));
    angelegteVerzeichnisse.push(cwd);
    const pakete = [
      ['core', {}],
      ['conformance', {}],
      ['website', { private: true }],
    ];
    for (const [ordner, extra] of pakete) {
      mkdirSync(join(cwd, 'packages', ordner), { recursive: true });
      writeFileSync(
        join(cwd, 'packages', ordner, 'package.json'),
        JSON.stringify({ name: `@einsatzzeichen/${ordner}`, ...extra }),
      );
    }

    expect(publishablePackageNames(cwd)).toEqual([
      '@einsatzzeichen/conformance',
      '@einsatzzeichen/core',
    ]);
  });
});

describe('anleitung', () => {
  test('nennt Paket, Publish-Befehl und Trusted-Publisher-Einstellung', () => {
    const text = anleitung(['@einsatzzeichen/conformance']);

    expect(text).toContain('- @einsatzzeichen/conformance');
    expect(text).toContain('pnpm -r publish --access public --no-git-checks');
    expect(text).toContain('Workflow: release.yml');
  });
});
