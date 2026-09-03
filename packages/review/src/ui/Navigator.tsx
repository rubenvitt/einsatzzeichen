/**
 * Linke Spalte: Gesamtfortschritt, Bereiche in der Reihenfolge der Coverage-Zeile und die Zeilen
 * des aufgeklappten Bereichs. Die Reduzierlogik liegt in `rows.ts`; hier steht nur die Darstellung.
 */
import { useEffect, useRef } from 'react';
import type { JSX, RefObject } from 'react';
import type { AreaSummary, CarrierId, RowSummary } from '../contract';
import { renderUrl } from './api';
import { statusLabel } from './format';
import type { Progress, RowFilter } from './rows';

interface NavigatorProps {
  areas: readonly AreaSummary[];
  rowsByArea: ReadonlyMap<string, RowSummary[]>;
  progress: Progress;
  filter: RowFilter;
  onFilterChange: (filter: RowFilter) => void;
  openAreas: ReadonlySet<string>;
  onToggleArea: (area: string) => void;
  selectedId: CarrierId | undefined;
  onSelect: (id: CarrierId) => void;
  theme: string;
  searchRef: RefObject<HTMLInputElement | null>;
}

function Balken({ area }: { area: { total: number; approved: number; deviation: number } }): JSX.Element {
  const anteil = (value: number): string =>
    area.total === 0 ? '0%' : `${(value / area.total) * 100}%`;
  return (
    <div className="fortschritt">
      <div className="fortschritt__teil fortschritt__teil--freigegeben" style={{ width: anteil(area.approved) }} />
      <div className="fortschritt__teil fortschritt__teil--abweichend" style={{ width: anteil(area.deviation) }} />
    </div>
  );
}

export function Navigator(props: NavigatorProps): JSX.Element {
  const { areas, rowsByArea, progress, filter, onFilterChange, openAreas, selectedId } = props;

  // Beim Blättern mit j/k muss die gewählte Zeile sichtbar bleiben; bei 558 Zeilen liefe sie
  // sonst nach wenigen Anschlägen aus dem Bild.
  const currentRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: 'nearest' });
  }, [selectedId]);

  return (
    <nav className="spalte" aria-label="Reviewzeilen">
      <div className="navigator__kopf">
        <h1>
          {progress.decided} von {progress.total} fachlich entschieden
        </h1>
        <Balken area={progress} />
        <p className="statuszeile">
          {progress.pending} offen · {progress.approved} freigegeben · {progress.deviation}{' '}
          abweichend
        </p>
        <div className="suchzeile">
          <input
            ref={props.searchRef}
            type="search"
            placeholder="Suche: Schlüssel, Titel, Implementierung"
            aria-label="Zeilen durchsuchen"
            value={filter.search}
            onChange={(event) => onFilterChange({ ...filter, search: event.target.value })}
          />
          <label className="schalter">
            <input
              type="checkbox"
              checked={filter.pendingOnly}
              onChange={(event) => onFilterChange({ ...filter, pendingOnly: event.target.checked })}
            />
            nur offene Zeilen
          </label>
        </div>
      </div>

      {areas.map((area) => {
        const open = openAreas.has(area.area);
        const rows = rowsByArea.get(area.area) ?? [];
        return (
          <section key={area.area}>
            <button
              type="button"
              className="bereich__kopf"
              aria-expanded={open}
              onClick={() => props.onToggleArea(area.area)}
            >
              <span aria-hidden="true">{open ? '▾' : '▸'}</span>
              <span className="bereich__name">{area.area}</span>
              <span className="bereich__zahlen">
                {area.pending}/{area.total}
              </span>
              <span className="bereich__balken">
                <Balken area={area} />
              </span>
            </button>
            {open ? (
              rows.length === 0 ? (
                <p className="leer">Keine Zeile passt zum aktuellen Filter.</p>
              ) : (
                <ul className="zeilen">
                  {rows.map((row) => (
                    <li key={row.id}>
                      <button
                        type="button"
                        className="zeile"
                        ref={row.id === selectedId ? currentRef : null}
                        aria-current={row.id === selectedId}
                        onClick={() => props.onSelect(row.id)}
                      >
                        {row.hasDrawing ? (
                          <img
                            className="zeile__vorschau"
                            src={renderUrl(row.id, props.theme, 32)}
                            alt=""
                            loading="lazy"
                            width={28}
                            height={28}
                          />
                        ) : (
                          <span className="zeile__vorschau" aria-hidden="true" />
                        )}
                        <span className="zeile__text">
                          <span className="zeile__schluessel">{row.label}</span>
                          <span className="zeile__titel">{row.title}</span>
                        </span>
                        <span
                          className={`punkt punkt--${row.status}`}
                          title={`${statusLabel(row.status)}${
                            row.questionCount > 0 ? `, ${row.questionCount} offene Frage(n)` : ''
                          }`}
                        />
                      </button>
                    </li>
                  ))}
                </ul>
              )
            ) : null}
          </section>
        );
      })}
    </nav>
  );
}
