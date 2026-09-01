import { useEffect, useState } from 'react';
import { fetchSnapshot, snapshotErrorMessage } from './snapshot-client.js';
import type { CatalogSnapshot } from './snapshot.js';

/**
 * Der Ladezustand einer Insel, die ihre Katalogdaten zur Laufzeit holt (LFH-500).
 *
 * Vor dem Umbau bekamen `CoverageMatrix` und `MapLibreLab` ihre Daten als Prop; Astro
 * serialisierte sie damit in das `props`-Attribut der `<astro-island>` und lieferte sie in jedem
 * Seitenabruf mit — bei `/docs/coverage/` allein 722 KB Nutzlast in einem 1,75 MB großen
 * Dokument. Jetzt holt jede Insel den Snapshot über `fetchSnapshot()`, und weil das ein Abruf im
 * Browser ist, gibt es drei sichtbare Zustände statt einem: laden, gescheitert, geladen.
 *
 * Diese Datei hält beides zusammen — den reinen Übergang (`snapshotState`, ohne React prüfbar)
 * und die dünne Hülle darum (`useSnapshot`). Die Trennung ist Absicht: Vitest sammelt nur
 * Dateien mit der Endung `.test.ts` unterhalb von `src` (siehe `test.include` in
 * `vitest.config.ts`), eine `.tsx`-Insel wird also nie ausgeführt. Was hier steht, ist deshalb
 * genau das, was sich ohne DOM prüfen lässt; in den Inseln bleibt nur die Anzeige.
 */

/**
 * Drei Zustände, kein vierter. Insbesondere gibt es kein „geladen, aber leer": ein unbrauchbarer
 * Snapshot ist ein Fehler mit Grund (`assertSnapshot`), kein stiller leerer Katalog — dieselbe
 * Regel wie in `loadSnapshot()`.
 */
export type SnapshotState<T> =
  | { readonly status: 'loading' }
  | { readonly status: 'failed'; readonly message: string }
  | { readonly status: 'ready'; readonly data: T };

/** Der Anfangszustand. Als Konstante, damit der erste Render kein neues Objekt erzeugt. */
export const LOADING_STATE: SnapshotState<never> = { status: 'loading' };

/**
 * Wählt aus dem Snapshot das aus, was eine Insel wirklich zeichnet — `snapshot.coverage.matrix`
 * bei der Prüfliste, `labSymbols(snapshot.symbols)` bei der Karte. Die Auswahl geschieht hier und
 * nicht in der Insel, damit das Ergebnis **einmal** entsteht und über alle folgenden Renders
 * dieselbe Objektidentität behält: eine Ableitung im Renderkörper erzeugte bei jedem Tastendruck
 * ein neues Array und ließe damit jeden Effekt erneut laufen, der daran hängt (in der Karte wäre
 * das das Neuzeichnen aller Marker).
 */
export type SnapshotSelect<T> = (snapshot: CatalogSnapshot) => T;

/**
 * Holt den Snapshot und macht daraus den Zustand, den die Insel anzeigt.
 *
 * Gibt `undefined` zurück, wenn der Abruf abgebrochen wurde — dann ist die Insel abgeräumt, und
 * es darf kein Zustand mehr gesetzt werden. Ein Abbruch ist ausdrücklich **kein** Fehlerzustand:
 * er ist das Ergebnis des Aufräumens, nicht ein Befund über den Snapshot.
 *
 * Die Auswahl (`select`) läuft innerhalb desselben `try`. Wirft sie, ist das für die Leserin
 * derselbe Fall wie ein kaputter Snapshot — sichtbar mit Grund, statt einer Insel, die nichts
 * anzeigt und nichts sagt.
 */
export async function snapshotState<T>(
  select: SnapshotSelect<T>,
  signal?: AbortSignal,
): Promise<SnapshotState<T> | undefined> {
  try {
    return { status: 'ready', data: select(await fetchSnapshot(signal)) };
  } catch (error) {
    if (signal?.aborted === true) return undefined;
    // `snapshotErrorMessage` behält den Grund (404, Netz weg, kaputtes JSON) im Text — die Inseln
    // zeigen ihn wörtlich, statt ihn zu „Fehler" zu glätten (Spec §7).
    return { status: 'failed', message: snapshotErrorMessage(error) };
  }
}

/**
 * Der Snapshot als React-Zustand. `select` muss eine stabile Referenz sein — in der Praxis eine
 * Funktion auf Modulebene der Insel; sie steht in den Abhängigkeiten des Effekts, eine bei jedem
 * Render neu erzeugte Funktion löste also einen neuen Abruf aus.
 *
 * Der `AbortController` im Cleanup ist kein Beiwerk: `client:visible` mountet die Insel beim
 * Sichtbarwerden, und wer schnell weiterblättert, räumt sie ab, während der Abruf noch läuft.
 * Ohne Abbruch setzte der aufgelöste `fetch` danach Zustand in eine Komponente, die es nicht mehr
 * gibt, und lüde die Datei zu Ende, obwohl niemand sie mehr sieht.
 */
export function useSnapshot<T>(select: SnapshotSelect<T>): SnapshotState<T> {
  const [state, setState] = useState<SnapshotState<T>>(LOADING_STATE);

  useEffect(() => {
    const controller = new AbortController();
    void snapshotState(select, controller.signal).then((next) => {
      if (next !== undefined) setState(next);
    });
    return () => {
      controller.abort();
    };
  }, [select]);

  return state;
}
