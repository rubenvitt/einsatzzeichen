import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { LOADING_STATE, snapshotState } from './snapshot-island.js';
import { resetSnapshotCache } from './snapshot-client.js';
import type { CatalogSnapshot } from './snapshot.js';

/**
 * Der Übergang vom Abruf zum sichtbaren Zustand einer Insel (LFH-500). Geprüft wird gegen einen
 * gestellten `fetch`, nicht gegen die erzeugte Datei — die ist gitignored und in CI zum Zeitpunkt
 * von `pnpm test` noch nicht da (dieselbe Begründung wie in `snapshot-client.test.ts`).
 *
 * Was hier steht, ist alles, was die Inseln an Logik haben: die Anzeige selbst liegt in `.tsx`,
 * und `.tsx` sammelt Vitest nicht ein. Deshalb ist `snapshotState` bewusst von `useSnapshot`
 * getrennt — der Hook ist danach nur noch `useState` plus `useEffect` um genau diese Funktion.
 */

const VALID = {
  generatedAt: '2026-08-28T00:00:00.000Z',
  symbols: [
    { id: 'base.formation', slug: 'base-formation', title: 'Trupp' },
    { id: 'base.unit', slug: 'base-unit', title: 'Einheit' },
  ],
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

/** Die Auswahl, wie eine Insel sie mitgibt: auf Modulebene, also über Renders hinweg stabil. */
const titles = (snapshot: CatalogSnapshot): string[] => snapshot.symbols.map((s) => s.title);

beforeEach(() => {
  resetSnapshotCache();
});

afterEach(() => {
  vi.unstubAllGlobals();
  resetSnapshotCache();
});

it('beginnt beim Laden', () => {
  expect(LOADING_STATE).toEqual({ status: 'loading' });
});

it('liefert nach dem Abruf genau das, was die Auswahl gewählt hat', async () => {
  respondWith(VALID);
  await expect(snapshotState(titles)).resolves.toEqual({
    status: 'ready',
    data: ['Trupp', 'Einheit'],
  });
});

/**
 * Die Auswahl darf nur einmal laufen: ihr Ergebnis wandert unverändert in den Zustand und behält
 * damit seine Objektidentität über alle folgenden Renders. Liefe sie im Renderkörper, entstünde
 * bei jedem Tastendruck ein neues Array — und jeder Effekt, der daran hängt, liefe erneut.
 */
it('wendet die Auswahl genau einmal an', async () => {
  respondWith(VALID);
  const select = vi.fn(titles);
  const first = await snapshotState(select);
  expect(select).toHaveBeenCalledTimes(1);
  const second = await snapshotState(select);
  expect(select).toHaveBeenCalledTimes(2);
  // Zwei Aufrufe sind zwei Zustände; innerhalb eines Aufrufs bleibt es bei einem Ergebnis.
  expect(first).not.toBe(second);
});

it('nennt beim Fehlschlag den Grund, statt ihn zu glätten', async () => {
  respondWith(undefined, { ok: false, status: 404, statusText: 'Not Found' });
  const state = await snapshotState(titles);
  expect(state).toMatchObject({ status: 'failed' });
  expect(state?.status === 'failed' ? state.message : '').toMatch(/404 Not Found/);
  expect(state?.status === 'failed' ? state.message : '').toMatch(/catalog-snapshot\.json/);
});

it('meldet einen unbrauchbaren Snapshot als Fehler, nicht als leere Liste', async () => {
  respondWith({ generatedAt: '2026-08-28T00:00:00.000Z', symbols: [] });
  const state = await snapshotState(titles);
  expect(state).toMatchObject({ status: 'failed' });
  expect(state?.status === 'failed' ? state.message : '').toMatch(
    /pnpm --filter @einsatzzeichen\/website generate/,
  );
});

/**
 * Ein Fehler in der Auswahl ist für die Leserin derselbe Fall wie ein kaputter Snapshot: sichtbar
 * mit Grund. Ohne das stünde eine Insel da, die nichts anzeigt und nichts sagt.
 */
it('meldet auch einen Fehler in der Auswahl mit Grund', async () => {
  respondWith(VALID);
  const state = await snapshotState(() => {
    throw new Error('Zeichnung fehlt');
  });
  expect(state?.status === 'failed' ? state.message : '').toMatch(/Zeichnung fehlt/);
});

/**
 * Abbruch ist kein Fehler. Die Insel wurde abgeräumt (`client:visible`, jemand blättert weiter) —
 * hier darf kein Zustand mehr entstehen, sonst zeigte eine Seite eine Fehlermeldung über einen
 * Abruf, den sie selbst gestoppt hat.
 */
it('liefert nach einem Abbruch keinen Zustand', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      async (_url: string, init?: { signal?: AbortSignal }) =>
        await new Promise((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => {
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    ),
  );
  const controller = new AbortController();
  const pending = snapshotState(titles, controller.signal);
  controller.abort();
  await expect(pending).resolves.toBeUndefined();
});
