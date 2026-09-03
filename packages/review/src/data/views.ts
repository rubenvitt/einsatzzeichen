/**
 * Die Vertragssichten auf die 558 Zeilen: Navigatorliste, Bereichssummen, Nachbarschaft und
 * Detailansicht. Alle rein und alle aus derselben Zeilenmenge abgeleitet — es gibt keine zweite
 * Quelle, aus der eine Zählung stammen könnte, und damit auch nichts, was auseinanderlaufen kann.
 */
import type {
  AreaSummary,
  CarrierId,
  NeighbourRef,
  RowDetail,
  RowSummary,
} from '../contract.js';
import type { ReviewRow } from './rows.js';

/**
 * Höchstens zwölf Nachbarn. Der Streifen dient der Verwechslungsprüfung, und die funktioniert
 * nur, solange alle Zeichen nebeneinander sichtbar sind; `E.1` mit 37 Zeilen wäre ein Band zum
 * Scrollen und damit kein Vergleich mehr.
 */
const MAX_NEIGHBOURS = 12;

/** Die Kurzfassung für den Navigator — 558 Stück, deshalb ohne Zeichnung und ohne Prosa. */
export function rowSummaries(rows: readonly ReviewRow[]): readonly RowSummary[] {
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    label: row.label,
    title: row.title,
    area: row.area,
    status: row.domain.status,
    hasDrawing: row.drawing !== undefined,
    questionCount: row.questions.length,
  }));
}

/**
 * Bereichssummen in der Reihenfolge ihres ersten Auftretens in `rows` — die Reihenfolge, die
 * `buildRows` bereits hergestellt hat. Hier noch einmal zu sortieren hieße, eine zweite
 * Reihenfolge zu erfinden.
 */
export function areaSummaries(rows: readonly ReviewRow[]): readonly AreaSummary[] {
  const summaries = new Map<string, AreaSummary>();
  for (const row of rows) {
    const summary = summaries.get(row.area) ?? {
      area: row.area,
      total: 0,
      pending: 0,
      approved: 0,
      deviation: 0,
    };
    summary.total += 1;
    summary[row.domain.status] += 1;
    summaries.set(row.area, summary);
  }
  return [...summaries.values()];
}

/**
 * Das Abschnittspräfix einer Abschnittsnummer: alles bis auf das letzte Segment. `4.6.4` → `4.6`,
 * `1.1` → `1`. Eine Nummer ohne Punkt bleibt sie selbst; sie ist dann ihr eigenes Präfix.
 */
function sectionPrefix(section: string): string {
  const dot = section.lastIndexOf('.');
  return dot === -1 ? section : section.slice(0, dot);
}

/**
 * Die übrigen Zeichen desselben Abschnittspräfixes, für den direkten Nebeneinandervergleich.
 *
 * Nur Zeilen mit Zeichnung: ein Nachbar ohne Bild trägt zur Verwechslungsprüfung nichts bei.
 * Quellen- und Profilzeilen haben deshalb keine Nachbarn — sie sind keine Zeichen.
 */
export function neighboursOf(id: CarrierId, rows: readonly ReviewRow[]): readonly NeighbourRef[] {
  const row = rowById(id, rows);
  if (row.kind !== 'manifest' || row.section === '') return [];
  const prefix = sectionPrefix(row.section);
  const neighbours: NeighbourRef[] = [];
  for (const candidate of rows) {
    if (neighbours.length >= MAX_NEIGHBOURS) break;
    if (candidate.id === row.id) continue;
    if (candidate.kind !== 'manifest' || candidate.drawing === undefined) continue;
    if (candidate.section !== prefix && !candidate.section.startsWith(`${prefix}.`)) continue;
    neighbours.push({ id: candidate.id, label: candidate.label, title: candidate.title });
  }
  return neighbours;
}

/**
 * Die Detailansicht einer Zeile. `referenceAvailable` kommt von außen: ob
 * `taktische-zeichen/<referenceAsset>` tatsächlich liegt, weiß nur der Server — diese Schicht
 * fasst kein Dateisystem an und soll es auch nicht.
 */
export function rowDetail(
  id: CarrierId,
  rows: readonly ReviewRow[],
  referenceAvailable: boolean,
): RowDetail {
  const row = rowById(id, rows);
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    title: row.title,
    area: row.area,
    section: row.section,
    referenceAvailable,
    evidence: row.evidence,
    domain: row.domain,
    questions: row.questions,
    neighbours: neighboursOf(id, rows),
    ...(row.variant !== undefined ? { variant: row.variant } : {}),
    ...(row.implementation !== undefined ? { implementation: row.implementation } : {}),
    ...(row.coverage !== undefined ? { coverage: row.coverage } : {}),
    ...(row.profile !== undefined ? { profile: row.profile } : {}),
    ...(row.referenceAsset !== undefined ? { referenceAsset: row.referenceAsset } : {}),
    ...(row.technical !== undefined ? { technical: row.technical } : {}),
    ...(row.carrierContext !== undefined ? { carrierContext: row.carrierContext } : {}),
    ...(row.prose !== undefined ? { prose: row.prose } : {}),
  };
}

/**
 * Fail-closed: eine unbekannte Kennung ist ein Fehler und keine leere Ansicht. Eine leere Ansicht
 * sähe aus wie eine Zeile ohne Befund, und genau die will dieses Werkzeug ausschließen.
 */
export function rowById(id: CarrierId, rows: readonly ReviewRow[]): ReviewRow {
  const row = rows.find((candidate) => candidate.id === id);
  if (row === undefined) {
    throw new Error(`Keine Reviewzeile mit der Kennung "${id}".`);
  }
  return row;
}
