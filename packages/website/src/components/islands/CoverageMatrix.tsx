import { useMemo, useState } from 'react';
import { areaOfSourceId, filterMatrix, type MatrixFilter } from '../../lib/coverage-filter.js';
// Nur Typen: ein Wertimport aus `snapshot.ts` zöge dessen `import.meta.glob` auf die generierte
// JSON-Datei in dieses Bundle (Spec §5.2/§5.3 — Inseln importieren ihre Daten als Prop, nie den
// Snapshot selbst). `import type` wird beim Bauen entfernt.
import type { MatrixRow, ReviewSummary } from '../../lib/snapshot.js';
import StatusPair from '../StatusPair';

export interface CoverageMatrixProps {
  rows: MatrixRow[];
}

const ART_LABELS: Record<MatrixRow['coverage'], string> = {
  'catalog-entry': 'Katalogeintrag',
  'composition-recipe': 'zusammengesetztes Zeichen',
  element: 'Element',
};

const STATUS_LABELS: Record<ReviewSummary['status'], string> = {
  pending: 'noch nicht geprüft',
  approved: 'geprüft',
  deviation: 'mit Abweichung',
};

type ColumnKey = 'sourceId' | 'title' | 'implementation' | 'coverage' | 'profile' | 'status' | 'evidence';

interface Column {
  key: ColumnKey;
  label: string;
  value: (row: MatrixRow) => string;
}

// Eine Spalte für „technisch / fachlich": `StatusPair` (Spec §5.5, §5.6) rendert beide Marken in
// einer Komponente, wie im Brief für diese Insel verlangt — Spec §5.4 listet sie einzeln auf.
// Die Abweichung ist im Task-9-Report vermerkt.
const COLUMNS: readonly Column[] = [
  { key: 'sourceId', label: 'Quelle/Abschnitt', value: (row) => row.sourceId },
  { key: 'title', label: 'Titel', value: (row) => row.title },
  { key: 'implementation', label: 'Kennung im Katalog', value: (row) => row.implementation },
  { key: 'coverage', label: 'Art', value: (row) => ART_LABELS[row.coverage] ?? row.coverage },
  { key: 'profile', label: 'Profil', value: (row) => row.profile },
  {
    key: 'status',
    label: 'Status (technisch / fachlich)',
    value: (row) => `${row.technical.status}-${row.domain.status}`,
  },
  { key: 'evidence', label: 'Testnachweis', value: (row) => row.evidence.join(', ') },
];

interface SortState {
  key: ColumnKey;
  direction: 'asc' | 'desc';
}

const ALL = '__alle__';

function sortRows(rows: readonly MatrixRow[], sort: SortState): MatrixRow[] {
  const column = COLUMNS.find((candidate) => candidate.key === sort.key) ?? COLUMNS[0];
  const factor = sort.direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => column.value(a).localeCompare(column.value(b), 'de') * factor);
}

/**
 * Die Prüfliste („Manifestmatrix") mit Filter und Sortierung (Spec §5.4, Task 9). Die Filterlogik selbst ist die
 * reine Funktion `filterMatrix` aus `src/lib/coverage-filter.ts` — hier steht nur der React-State
 * darum: Filterwerte, Sortierspalte/-richtung, und die Ableitung der sichtbaren Zeilen daraus.
 */
export default function CoverageMatrix({ rows }: CoverageMatrixProps) {
  const [area, setArea] = useState<string>(ALL);
  const [technical, setTechnical] = useState<string>(ALL);
  const [domain, setDomain] = useState<string>(ALL);
  const [coverage, setCoverage] = useState<string>(ALL);
  const [sort, setSort] = useState<SortState>({ key: 'sourceId', direction: 'asc' });

  const areas = useMemo(() => {
    const set = new Set(rows.map((row) => areaOfSourceId(row.sourceId)));
    return [...set].sort((a, b) => a.localeCompare(b, 'de'));
  }, [rows]);

  const filter: MatrixFilter = useMemo(
    () => ({
      ...(area !== ALL ? { area } : {}),
      ...(technical !== ALL ? { technical: technical as ReviewSummary['status'] } : {}),
      ...(domain !== ALL ? { domain: domain as ReviewSummary['status'] } : {}),
      ...(coverage !== ALL ? { coverage } : {}),
    }),
    [area, technical, domain, coverage],
  );

  const visibleRows = useMemo(() => sortRows(filterMatrix(rows, filter), sort), [rows, filter, sort]);

  function toggleSort(key: ColumnKey): void {
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  }

  return (
    <div className="ez-coverage-matrix">
      <form className="ez-coverage-matrix__filters" aria-label="Prüfliste filtern">
        <label>
          Bereich
          <select value={area} onChange={(event) => setArea(event.target.value)}>
            <option value={ALL}>Alle</option>
            {areas.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status technisch
          <select value={technical} onChange={(event) => setTechnical(event.target.value)}>
            <option value={ALL}>Alle</option>
            {(Object.keys(STATUS_LABELS) as ReviewSummary['status'][]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Status fachlich
          <select value={domain} onChange={(event) => setDomain(event.target.value)}>
            <option value={ALL}>Alle</option>
            {(Object.keys(STATUS_LABELS) as ReviewSummary['status'][]).map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </label>
        <label>
          Art
          <select value={coverage} onChange={(event) => setCoverage(event.target.value)}>
            <option value={ALL}>Alle</option>
            {(Object.keys(ART_LABELS) as MatrixRow['coverage'][]).map((kind) => (
              <option key={kind} value={kind}>
                {ART_LABELS[kind]}
              </option>
            ))}
          </select>
        </label>
      </form>

      <p className="ez-coverage-matrix__count">
        {visibleRows.length} von {rows.length} Einträgen
      </p>

      <div className="ez-table-scroll">
        <table className="ez-table">
          <thead>
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.key} scope="col">
                  <button type="button" className="ez-coverage-matrix__sort" onClick={() => toggleSort(column.key)}>
                    {column.label}
                    {sort.key === column.key ? (sort.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => (
              <tr key={row.key}>
                <td className="ez-table__id">{row.sourceId}</td>
                <td>{row.slug !== undefined ? <a href={`/zeichen/${row.slug}/`}>{row.title}</a> : row.title}</td>
                <td className="ez-table__id">{row.implementation}</td>
                <td>{ART_LABELS[row.coverage] ?? row.coverage}</td>
                <td>{row.profile}</td>
                <td>
                  <StatusPair technical={row.technical} domain={row.domain} compact />
                </td>
                <td className="ez-table__id">{row.evidence.length > 0 ? row.evidence.join(', ') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        .ez-coverage-matrix__filters {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ez-space-4);
          margin-block-end: var(--ez-space-3);
        }
        .ez-coverage-matrix__filters label {
          display: flex;
          flex-direction: column;
          gap: var(--ez-space-1);
          font-size: var(--sl-text-sm);
        }
        .ez-coverage-matrix__count {
          font-size: var(--sl-text-sm);
          color: var(--sl-color-gray-3);
        }
        .ez-coverage-matrix__sort {
          background: none;
          border: none;
          font: inherit;
          font-weight: inherit;
          letter-spacing: inherit;
          text-transform: inherit;
          cursor: pointer;
          padding: 0;
          color: inherit;
          white-space: nowrap;
        }
      `}</style>
    </div>
  );
}
