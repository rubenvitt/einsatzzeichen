import { expect, it } from 'vitest';
import { buildSnapshot } from './snapshot-build.js';

/**
 * Die Grenze aus Spec §5.3: der Snapshot ist das, was die Website ausliefert. Er darf keinen
 * Referenzdateinamen und keinen lokalen Pfad tragen — weder aus `CoverageEntry.referenceAsset`
 * noch aus einem `SourceReference.asset`.
 *
 * `taktische-zeichen/` steht mit Schrägstrich in der Liste und nicht als bloßer Name: das
 * Referenzverzeichnis heißt so, aber die registrierte Vergleichsquelle `phjardas-tz` heißt
 * ebenfalls so — sie ist ein öffentliches GitHub-Projekt und kein lokaler Pfad. Der zweite Test
 * unten hält genau diese Ausnahme fest, damit sie eine belegte Entscheidung bleibt und nicht
 * eine Lücke im Muster.
 */
const FORBIDDEN = [
  /taktische-zeichen\//i,
  /\bout\//,
  /^\/Users\//m,
  /^[A-Z]:\\/m,
  /referenceAsset/,
  /\.svg/,
];

it('der Snapshot enthält keine Referenzpfade oder -dateinamen', () => {
  const text = JSON.stringify(buildSnapshot());
  for (const pattern of FORBIDDEN) expect(text, String(pattern)).not.toMatch(pattern);
});

it('nennt `taktische-zeichen` ausschließlich als Name der öffentlichen Vergleichsquelle', () => {
  const snapshot = buildSnapshot();
  const elsewhere = JSON.stringify({ ...snapshot, sources: [] });
  expect(elsewhere).not.toMatch(/taktische-zeichen/i);

  for (const source of snapshot.sources) {
    if (!/taktische-zeichen/i.test(JSON.stringify(source))) continue;
    expect(source.id).toBe('phjardas-tz');
    expect(source.url).toBe('https://github.com/phjardas/taktische-zeichen');
  }
});
