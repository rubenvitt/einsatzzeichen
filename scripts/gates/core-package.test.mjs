// Regeln des Größen-Gates für `@einsatzzeichen/core` (LFH-575), ohne Build geprüft: das Gate
// selbst misst in CI nach `pnpm build` (siehe `core-package.mjs`); hier steht nur, dass seine
// Regeln die Fehler erkennen, für die es da ist.
import { gzipSync } from 'node:zlib';
import { describe, expect, test } from 'vitest';

import { checkCorePackage, LIMITS, readTarEntries } from './core-package.mjs';

/** Ein Publish-Umfang, der alle Grenzen einhält: 250 Module à 20 KB plus Pflichteinträge. */
const healthy = () => ({
  packedBytes: 420_000,
  entries: [
    { path: 'package/package.json', size: 1_000 },
    { path: 'package/README.md', size: 1_000 },
    { path: 'package/LICENSE', size: 1_000 },
    { path: 'package/dist/index.js', size: 1_000 },
    { path: 'package/dist/index.d.ts', size: 1_000 },
    { path: 'package/dist/assets/arimo-metrics.json', size: 78_000 },
    ...Array.from({ length: 250 }, (_, i) => ({ path: `package/dist/m${i}.js`, size: 20_000 })),
  ],
});

describe('checkCorePackage', () => {
  test('ein gesunder Umfang besteht', () => {
    expect(checkCorePackage(healthy())).toEqual([]);
  });

  test('Prüfdaten fallen auf, auch wenn sie klein sind', () => {
    const pack = healthy();
    pack.entries.push(
      { path: 'package/dist/geometry/__snapshots__/a.svg', size: 10 },
      { path: 'package/dist/compose.test.js', size: 10 },
      { path: 'package/dist/assets/Arimo.ttf', size: 10 },
      { path: 'package/dist/fingerprints.json', size: 10 },
      { path: 'package/dist/recipes.yaml', size: 10 },
    );
    const findings = checkCorePackage(pack);
    expect(findings).toHaveLength(5);
    expect(findings.join('\n')).toMatch(/__snapshots__.*Snapshot-Ordner/);
    expect(findings.join('\n')).toMatch(/compose\.test\.js.*Testdatei/);
    expect(findings.join('\n')).toMatch(/Arimo\.ttf.*Schriftdatei/);
    expect(findings.join('\n')).toMatch(/fingerprints\.json.*Fingerprint/);
    expect(findings.join('\n')).toMatch(/Positivliste: .*recipes\.yaml/);
  });

  test('eine in ein Modul verpackte fingerprints.json reißt die entpackte Obergrenze', () => {
    // Auf den Messwert vom 21.09.2026 (6 060 107 B) auffüllen, dann die 503 954 B der Datei dazu.
    const pack = healthy();
    const measured = 6_060_107 - pack.entries.reduce((sum, e) => sum + e.size, 0);
    pack.entries.push({ path: 'package/dist/pad.js', size: measured });
    expect(checkCorePackage(pack)).toEqual([]);
    pack.entries.push({ path: 'package/dist/fingerprint-data.js', size: 503_954 });
    expect(LIMITS.maxUnpackedBytes).toBeLessThan(6_060_107 + 503_954);
    expect(checkCorePackage(pack)).toEqual([expect.stringMatching(/^Entpackt .* über der Obergrenze/)]);
  });

  test('ein fehlender dist fällt über die Untergrenzen auf, nicht still durch', () => {
    const findings = checkCorePackage({
      packedBytes: 1_400,
      entries: [
        { path: 'package/package.json', size: 1_000 },
        { path: 'package/README.md', size: 1_000 },
        { path: 'package/LICENSE', size: 1_000 },
      ],
    });
    expect(findings).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^Tarball .* unter der Untergrenze/),
        expect.stringMatching(/^Entpackt .* unter der Untergrenze/),
        expect.stringMatching(/Einträge, erwartet mindestens/),
        'Pflichteintrag fehlt: package/dist/index.js',
      ]),
    );
  });
});

describe('readTarEntries', () => {
  /** Baut einen ustar-Eintrag; lange Namen über einen PAX-Kopf wie bei `pnpm pack`. */
  const header = (name, size, type) => {
    const block = Buffer.alloc(512);
    block.write(name.slice(0, 100), 0, 'utf8');
    block.write(size.toString(8).padStart(11, '0'), 124, 'utf8');
    block.write(type, 156, 'utf8');
    return block;
  };
  const body = (content) => {
    const buffer = Buffer.from(content, 'utf8');
    return Buffer.concat([buffer, Buffer.alloc((512 - (buffer.length % 512)) % 512)]);
  };

  test('liest Namen, Größen und PAX-Langnamen', () => {
    const longName = `package/dist/${'x'.repeat(120)}.d.ts`;
    const record = `path=${longName}\n`;
    const paxRecord = `${record.length + String(record.length).length + 2} ${record}`;
    const tar = Buffer.concat([
      header('package/package.json', 5, '0'),
      body('{"a":'),
      header('PaxHeader', Buffer.byteLength(paxRecord), 'x'),
      body(paxRecord),
      header(longName, 3, '0'),
      body('abc'),
      Buffer.alloc(1024),
    ]);
    expect(readTarEntries(gzipSync(tar))).toEqual([
      { path: 'package/package.json', size: 5 },
      { path: longName, size: 3 },
    ]);
  });
});
