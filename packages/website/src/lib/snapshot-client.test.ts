import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  SNAPSHOT_URL,
  fetchSnapshot,
  resetSnapshotCache,
  snapshotErrorMessage,
} from './snapshot-client.js';

/**
 * Der Laufzeitweg des Snapshots (LFH-500). Geprüft wird gegen einen gestellten `fetch`, nicht
 * gegen die erzeugte Datei: die ist gitignored und in CI zum Zeitpunkt von `pnpm test` noch nicht
 * da — dieselbe Begründung, aus der `snapshot-load.test.ts` den bauzeitlichen Lader nicht
 * aufruft. Dessen Wächter dort verbietet den Aufruf in jeder anderen Testdatei; er liest den
 * Dateitext, deshalb steht der Name hier bewusst nicht ausgeschrieben.
 */

const VALID = {
  generatedAt: '2026-08-28T00:00:00.000Z',
  symbols: [{ id: 'base.formation', slug: 'base-formation' }],
};

function respondWith(body: unknown, init?: { ok?: boolean; status?: number; statusText?: string }) {
  const mock = vi.fn(async () => ({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? 'OK',
    json: async () => body,
  }));
  vi.stubGlobal('fetch', mock);
  return mock;
}

beforeEach(() => {
  resetSnapshotCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSnapshotCache();
});

it('holt den Snapshot von der öffentlichen Adresse', async () => {
  const mock = respondWith(VALID);
  await expect(fetchSnapshot()).resolves.toMatchObject({ generatedAt: VALID.generatedAt });
  expect(mock).toHaveBeenCalledWith(SNAPSHOT_URL, { signal: undefined });
});

it('liefert die Adresse unter der `public/` ausgeliefert wird', () => {
  expect(SNAPSHOT_URL).toBe('/catalog-snapshot.json');
});

it('nennt Status und Adresse, wenn der Abruf scheitert', async () => {
  respondWith(undefined, { ok: false, status: 404, statusText: 'Not Found' });
  await expect(fetchSnapshot()).rejects.toThrow(/404 Not Found/);
  await expect(fetchSnapshot()).rejects.toThrow(/catalog-snapshot\.json/);
});

it('wirft den `generate`-Hinweis, wenn das Dokument unbrauchbar ist', async () => {
  respondWith({ generatedAt: '2026-08-28T00:00:00.000Z', symbols: [] });
  await expect(fetchSnapshot()).rejects.toThrow(
    /pnpm --filter @einsatzzeichen\/website generate/,
  );
});

it('überträgt nur einmal, wenn zwei Inseln gleichzeitig laden', async () => {
  const mock = respondWith(VALID);
  const [first, second] = await Promise.all([fetchSnapshot(), fetchSnapshot()]);
  expect(mock).toHaveBeenCalledTimes(1);
  expect(first).toBe(second);
});

/**
 * Der gemerkte Versuch darf keinen Fehler festschreiben: sonst bliebe eine Seite nach einem
 * einzelnen Netzaussetzer für immer leer, obwohl ein zweiter Versuch getragen hätte.
 */
it('merkt sich einen Fehlschlag nicht', async () => {
  respondWith(undefined, { ok: false, status: 503, statusText: 'Service Unavailable' });
  await expect(fetchSnapshot()).rejects.toThrow(/503/);

  const retry = respondWith(VALID);
  await expect(fetchSnapshot()).resolves.toMatchObject({ generatedAt: VALID.generatedAt });
  expect(retry).toHaveBeenCalledTimes(1);
});

it('reicht ein Abbruchsignal an den Abruf durch', async () => {
  const mock = respondWith(VALID);
  const controller = new AbortController();
  await fetchSnapshot(controller.signal);
  expect(mock).toHaveBeenCalledWith(SNAPSHOT_URL, { signal: controller.signal });
});

it('glättet den Grund eines Fehlers nicht weg', () => {
  expect(snapshotErrorMessage(new Error('NetworkError'))).toMatch(/NetworkError/);
  expect(snapshotErrorMessage(new Error('NetworkError'))).toMatch(
    /^Der Katalog-Snapshot konnte nicht geladen werden/,
  );
});

it('verdoppelt den Vorspann nicht, wenn die Meldung ihn schon trägt', () => {
  const once = snapshotErrorMessage(
    new Error('Der Katalog-Snapshot konnte nicht geladen werden: 404 Not Found'),
  );
  expect(once.match(/Der Katalog-Snapshot konnte nicht geladen werden/g)).toHaveLength(1);
});
