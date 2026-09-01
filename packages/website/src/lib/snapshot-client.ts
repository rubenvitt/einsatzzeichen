import { assertSnapshot, type CatalogSnapshot } from './snapshot-schema.js';

/**
 * Der Katalog-Snapshot für den Browser (LFH-500). Bis dahin holten die Inseln ihn auf zwei Wegen,
 * die beide im Auslieferungsstand landeten: `Explorer` und `Builder` importierten `loadSnapshot()`
 * und zogen damit 1,3 MB JSON als `snapshot.*.js` ins Bündel; `CoverageMatrix` und `MapLibreLab`
 * bekamen ihre Zeilen als Prop und standen damit serialisiert im HTML (`/docs/coverage/` 1,75 MB).
 *
 * Beide Wege enden hier: `generate` legt den Snapshot nach `public/`, Astro liefert ihn
 * unverändert unter {@link SNAPSHOT_URL} aus, und die Inseln holen ihn zur Laufzeit. Der Snapshot
 * ist damit ein Dokument, das der Browser **einmal** lädt und für alle vier Inseln
 * wiederverwendet, statt es je Seite erneut im HTML mitzuschleppen.
 *
 * Die Struktur des Snapshots bleibt unverändert — ausdrückliches Nicht-Ziel von LFH-500.
 *
 * Geprüft wird mit `assertSnapshot()` aus `snapshot-schema.ts` und nicht aus `snapshot.ts`: an
 * letzterem hängt der eager `import.meta.glob` auf die 1,3-MB-JSON-Datei, und ein Wertimport von
 * dort zöge sie über diese Datei zurück in jedes Inselbündel — der Fehler, den dieser Task
 * behebt. Der Import unten muss deshalb auf `snapshot-schema.js` zeigen.
 */

/** Astro liefert alles unter `public/` an der Wurzel aus. */
export const SNAPSHOT_URL = '/catalog-snapshot.json';

const FAILED = 'Der Katalog-Snapshot konnte nicht geladen werden';

/**
 * Ein Ladeversuch für das ganze Dokument, geteilt über alle Inseln einer Seite: `/docs/coverage/`
 * mountet neben der Matrix noch weitere Inseln, und zwei gleichzeitige `fetch` auf dieselbe URL
 * wären zwei Übertragungen. Das Promise wird gemerkt, nicht das Ergebnis — schlägt der Abruf
 * fehl, ist der nächste Aufruf wieder ein echter Versuch statt eines gemerkten Fehlers.
 */
let pending: Promise<CatalogSnapshot> | undefined;

async function request(signal?: AbortSignal): Promise<CatalogSnapshot> {
  const response = await fetch(SNAPSHOT_URL, { signal });
  if (!response.ok) {
    throw new Error(`${FAILED}: ${response.status} ${response.statusText} (${SNAPSHOT_URL})`);
  }
  // `assertSnapshot` ist dieselbe Prüfung wie zur Bauzeit: eine halb geschriebene oder von einem
  // Proxy verfälschte Datei fällt hier auf, statt später als leere Liste durchzugehen.
  return assertSnapshot(await response.json());
}

/**
 * Holt den Snapshot und prüft ihn. Wirft mit Klartext, wenn der Abruf scheitert oder das Dokument
 * unbrauchbar ist — kein stiller Rückfall auf einen leeren Katalog, dieselbe Regel wie in
 * `loadSnapshot()`.
 *
 * `signal` reicht bis in den `fetch` durch, damit eine Insel, die vor dem Ende des Abrufs
 * abgeräumt wird, keinen Zustand mehr setzt. Ein Abbruch teilt sich den gemerkten Versuch mit
 * anderen Inseln nicht: bricht eine ab, wird der laufende Abruf verworfen und der nächste
 * Aufruf beginnt neu.
 */
export function fetchSnapshot(signal?: AbortSignal): Promise<CatalogSnapshot> {
  if (signal !== undefined) return request(signal);
  pending ??= request().catch((error: unknown) => {
    pending = undefined;
    throw error;
  });
  return pending;
}

/** Nur für Tests: den gemerkten Versuch vergessen, damit jeder Fall frisch beginnt. */
export function resetSnapshotCache(): void {
  pending = undefined;
}

/**
 * Die Meldung, die eine Insel anzeigt, wenn der Abruf scheitert. Als Funktion und nicht als
 * fester Text, damit der Grund (Netz weg, 404 nach halbem Deploy, kaputtes JSON) sichtbar bleibt
 * — die Inseln zeigen ihn wörtlich an, statt ihn zu „Fehler" zu glätten.
 */
export function snapshotErrorMessage(error: unknown): string {
  const detail = error instanceof Error ? error.message : String(error);
  return detail.startsWith(FAILED) ? detail : `${FAILED}: ${detail}`;
}
