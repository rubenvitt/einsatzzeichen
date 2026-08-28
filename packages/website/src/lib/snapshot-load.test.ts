import { describe, expect, it } from 'vitest';
import { assertSnapshot } from './snapshot.js';

/**
 * `loadSnapshot()` selbst wird hier nicht aufgerufen: die erzeugte Datei ist gitignored und in CI
 * zum Zeitpunkt von `pnpm test` noch nicht da (der Workflow ruft `pnpm test` vor
 * `--filter website check`). Geprüft wird deshalb die Prüfung — und zwar mit `undefined`, also
 * genau dem, was `import.meta.glob` bei fehlender Datei liefert.
 */
describe('assertSnapshot', () => {
  const hint = /pnpm --filter @einsatzzeichen\/website generate/;

  it('nennt den generate-Hinweis, wenn die Datei fehlt', () => {
    expect(() => assertSnapshot(undefined)).toThrow(hint);
  });

  it('nennt den generate-Hinweis bei leerem oder unvollständigem Inhalt', () => {
    for (const broken of [null, {}, { generatedAt: '2026-08-28T00:00:00.000Z', symbols: [] }, { symbols: [{}] }]) {
      expect(() => assertSnapshot(broken), JSON.stringify(broken)).toThrow(hint);
    }
  });

  it('gibt einen vollständigen Snapshot unverändert zurück', () => {
    const snapshot = { generatedAt: '2026-08-28T00:00:00.000Z', symbols: [{ id: 'base.formation' }] };
    expect(assertSnapshot(snapshot)).toBe(snapshot);
  });
});
