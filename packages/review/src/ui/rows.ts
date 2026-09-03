/**
 * Die Reduzierlogik des Navigators als reine Funktionen. Bewusst außerhalb von React: Filter,
 * Blätterschritt und „nächste offene Zeile" sind die Regeln, an denen sich beim Abarbeiten von
 * 558 Zeilen Fehler zeigen — sie gehören in Tests und nicht in einen Komponentenrumpf.
 */
import type { AreaSummary, CarrierId, RowSummary } from '../contract';

export interface RowFilter {
  /** Freitext über Schlüssel, Titel und Implementierung. */
  search: string;
  /** Standardmäßig an: wer abarbeitet, will die offenen Zeilen sehen. */
  pendingOnly: boolean;
}

export const DEFAULT_FILTER: RowFilter = { search: '', pendingOnly: true };

/**
 * `RowSummary` trägt die Implementierungs-ID nicht — der Vertrag hält die Kurzfassung klein, es
 * sind 558 Stück. Die Suche bekommt sie deshalb aus den bereits geladenen Detailsätzen gereicht;
 * eine nie geöffnete Zeile bleibt über Schlüssel und Titel trotzdem auffindbar.
 */
export type ImplementationIndex = ReadonlyMap<CarrierId, string>;

export interface FilterOptions {
  implementations?: ImplementationIndex;
  /**
   * Die geöffnete Zeile bleibt sichtbar, auch wenn sie gerade freigegeben wurde und damit aus
   * „nur offene" herausfällt. Sonst verschwindet unter der Hand genau die Zeile, die man liest.
   */
  keepId?: CarrierId;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matchesSearch(
  row: RowSummary,
  search: string,
  implementations: ImplementationIndex = new Map(),
): boolean {
  const needle = normalize(search);
  if (needle === '') return true;
  const haystack = [row.label, row.title, implementations.get(row.id) ?? ''];
  return haystack.some((field) => field.toLowerCase().includes(needle));
}

export function filterRows(
  rows: readonly RowSummary[],
  filter: RowFilter,
  options: FilterOptions = {},
): RowSummary[] {
  const { implementations, keepId } = options;
  return rows.filter((row) => {
    if (row.id === keepId) return true;
    if (filter.pendingOnly && row.status !== 'pending') return false;
    return matchesSearch(row, filter.search, implementations);
  });
}

/** Zeilen je Bereich; die Reihenfolge der Bereiche gibt `AppState.areas` vor, nicht diese Karte. */
export function groupRowsByArea(rows: readonly RowSummary[]): Map<string, RowSummary[]> {
  const grouped = new Map<string, RowSummary[]>();
  for (const row of rows) {
    const bucket = grouped.get(row.area);
    if (bucket === undefined) grouped.set(row.area, [row]);
    else bucket.push(row);
  }
  return grouped;
}

/**
 * Ein Blätterschritt (`j`/`k`). Bewusst ohne Umlauf: am Listenende zu springen würde beim
 * schnellen Durchblättern unbemerkt an den Anfang zurückwerfen.
 */
export function stepRow(
  rows: readonly RowSummary[],
  currentId: CarrierId | undefined,
  delta: number,
): CarrierId | undefined {
  if (rows.length === 0) return undefined;
  const index = rows.findIndex((row) => row.id === currentId);
  if (index === -1) return rows[delta < 0 ? rows.length - 1 : 0].id;
  const next = Math.min(rows.length - 1, Math.max(0, index + delta));
  return rows[next].id;
}

/**
 * Die nächste offene Zeile nach dem Speichern. Hier ist der Umlauf richtig: wer eine Zeile in der
 * Mitte freigibt, soll danach die verbliebenen offenen davor bekommen und nicht ins Leere laufen.
 * Ist keine offene Zeile mehr da, kommt `undefined` zurück — die Oberfläche bleibt dann stehen und
 * sagt es, statt still irgendwohin zu springen.
 */
export function nextPendingRow(
  rows: readonly RowSummary[],
  currentId: CarrierId | undefined,
): CarrierId | undefined {
  if (rows.length === 0) return undefined;
  const index = rows.findIndex((row) => row.id === currentId);
  const start = index === -1 ? 0 : index + 1;
  for (let offset = 0; offset < rows.length; offset += 1) {
    const row = rows[(start + offset) % rows.length];
    if (row.id === currentId) continue;
    if (row.status === 'pending') return row.id;
  }
  return undefined;
}

export interface Progress {
  total: number;
  pending: number;
  approved: number;
  deviation: number;
  /** Freigegeben und abweichend zusammen: beides ist eine abgeschlossene Fachprüfung. */
  decided: number;
}

export function overallProgress(areas: readonly AreaSummary[]): Progress {
  const sum = areas.reduce<Progress>(
    (acc, area) => ({
      total: acc.total + area.total,
      pending: acc.pending + area.pending,
      approved: acc.approved + area.approved,
      deviation: acc.deviation + area.deviation,
      decided: acc.decided + area.approved + area.deviation,
    }),
    { total: 0, pending: 0, approved: 0, deviation: 0, decided: 0 },
  );
  return sum;
}
