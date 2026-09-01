import { useEffect, useMemo, useState } from 'react';
import { Einsatzzeichen } from '@einsatzzeichen/react';
import {
  sanitizeFacets,
  searchSymbols,
  type ExplorerFilters,
  type FacetGroup,
  type SymbolFacets,
} from '../../lib/explorer-search.js';
import {
  explorerFacetGroups,
  validFacetValues,
  type ExplorerFacetGroups,
} from '../../lib/explorer-facets.js';
import { useSnapshot, type SnapshotSelect } from '../../lib/snapshot-island.js';
import type { ReviewSummary, SymbolSummary } from '../../lib/snapshot.js';
import StatusPair, { statusMark } from '../StatusPair.js';

/**
 * Der Symbol Explorer (Spec §5.4).
 *
 * **Woher die Daten kommen (LFH-500).** Der Snapshot wird zur Laufzeit per `fetch` geholt
 * (`lib/snapshot-client.ts`), nicht mehr auf Modulebene importiert. Der frühere Aufruf von
 * `loadSnapshot()` zog dessen `import.meta.glob` und damit 1,3 MB JSON als eigenes Bündelstück in
 * jede Seite, die diese Insel mit `client:load` mountet. Aus `lib/snapshot.js` kommen hier deshalb
 * ausschließlich Typen (`import type`) — ein Wertimport von dort brächte die 1,3 MB zurück.
 * Der Katalog-Index bleibt ohnehin außen vor: der zöge `node:url` (Spec §5.2).
 *
 * Facetten-Werte kommen aus dem Snapshot selbst (nicht aus `builder.vocabulary`, das die
 * *erlaubten* Werte für den Builder führt): der Explorer soll nur zeigen, was tatsächlich
 * vorkommt, mit der echten Anzahl daneben. Zähl- und Validierungslogik (`facetOptions`,
 * `reviewStatusOptions`, `sanitizeFacets` in `lib/explorer-search.ts`) und die Ableitung der
 * sechs Gruppen (`lib/explorer-facets.ts`) liegen bewusst außerhalb dieser Datei: dort sind sie
 * ohne DOM/React testbar (Review 1: „Alle"-Zähler; Review 2: URL-Facetten validieren).
 */

/** Was der Explorer aus dem Snapshot braucht — mehr als das behält er nicht. */
interface ExplorerData {
  symbols: SymbolSummary[];
  groups: ExplorerFacetGroups;
}

/**
 * Auf Modulebene und nicht im Renderkörper: `useSnapshot` hat die Auswahl in den Abhängigkeiten
 * seines Effekts, eine bei jedem Render neu erzeugte Funktion löste also einen neuen Abruf aus.
 * Zugleich ist das die Stelle, an der die Facettengruppen **einmal** entstehen — genau das, was
 * bis LFH-500 der Modulebenen-Ausdruck über dem synchron geladenen Snapshot leistete.
 */
const selectExplorerData: SnapshotSelect<ExplorerData> = (snapshot) => ({
  symbols: snapshot.symbols,
  groups: explorerFacetGroups(
    snapshot.symbols,
    snapshot.builder,
    (axis, status) => statusMark(axis, { status }).shortLabel,
  ),
});

const EMPTY_FILTERS: ExplorerFilters = {
  q: '',
  org: '',
  kapitel: '',
  quelle: '',
  profil: '',
  technisch: '',
  fachlich: '',
};

const PARAM_KEYS: Record<keyof ExplorerFilters, string> = {
  q: 'q',
  org: 'org',
  kapitel: 'kapitel',
  quelle: 'quelle',
  profil: 'profil',
  technisch: 'technisch',
  fachlich: 'fachlich',
};

function filtersFromLocation(): ExplorerFilters {
  if (typeof window === 'undefined') return EMPTY_FILTERS;
  const params = new URLSearchParams(window.location.search);
  const next = { ...EMPTY_FILTERS };
  for (const key of Object.keys(PARAM_KEYS) as (keyof ExplorerFilters)[]) {
    next[key] = params.get(PARAM_KEYS[key]) ?? '';
  }
  return next;
}

function locationSearchFromFilters(filters: ExplorerFilters): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(PARAM_KEYS) as (keyof ExplorerFilters)[]) {
    if (filters[key] !== '') params.set(PARAM_KEYS[key], filters[key]);
  }
  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

function toFacets(filters: ExplorerFilters): SymbolFacets {
  const facets: SymbolFacets = {};
  if (filters.org !== '') facets.organization = filters.org;
  if (filters.kapitel !== '') facets.chapter = filters.kapitel;
  if (filters.quelle !== '') facets.sourceId = filters.quelle;
  if (filters.profil !== '') facets.profile = filters.profil;
  if (filters.technisch !== '') facets.technical = filters.technisch as ReviewSummary['status'];
  if (filters.fachlich !== '') facets.domain = filters.fachlich as ReviewSummary['status'];
  return facets;
}

interface FacetFieldProps {
  id: string;
  label: string;
  value: string;
  group: FacetGroup;
  onChange: (value: string) => void;
}

/** „Alle" zeigt `group.total` — die Gesamtzahl der Symbole, nicht die Summe der Options-Zähler (Review 1). */
function FacetField({ id, label, value, group, onChange }: FacetFieldProps) {
  return (
    <label className="ez-explorer__field" htmlFor={id}>
      <span className="ez-explorer__field-label">{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Alle ({group.total})</option>
        {group.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
    </label>
  );
}

/**
 * Der Explorer mit vorliegendem Snapshot. Als eigene Komponente unterhalb des Ladezustands, damit
 * kein Hook hier mit einem „vielleicht noch nicht da"-Fall rechnen muss: sie mountet erst, wenn
 * der Abruf durch ist, und der Snapshot wechselt danach nicht mehr.
 */
function ExplorerView({ symbols: allSymbols, groups }: ExplorerData) {
  const [filters, setFilters] = useState<ExplorerFilters>(EMPTY_FILTERS);

  const validValues = useMemo(() => validFacetValues(groups), [groups]);

  // Die URL erst beim Mounten lesen: SSR und der erste Client-Render zeigen den Ladezustand, und
  // sobald die Liste steht, sind die gültigen Facettenwerte bekannt. Werte, die keine Auswahlbox
  // anbietet (veralteter oder von Hand geänderter Link, Review 2), werden dabei verworfen statt
  // einen unsichtbaren Filter zu setzen.
  useEffect(() => {
    setFilters(sanitizeFacets(filtersFromLocation(), validValues));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = locationSearchFromFilters(filters);
    const url = `${window.location.pathname}${search}${window.location.hash}`;
    window.history.replaceState(null, '', url);
  }, [filters]);

  const results = useMemo(
    () => searchSymbols(allSymbols, filters.q, toFacets(filters)),
    [allSymbols, filters],
  );

  const hasActiveFilter =
    filters.q !== '' ||
    filters.org !== '' ||
    filters.kapitel !== '' ||
    filters.quelle !== '' ||
    filters.profil !== '' ||
    filters.technisch !== '' ||
    filters.fachlich !== '';

  function setField(key: keyof ExplorerFilters) {
    return (value: string) => setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <div className="ez-explorer">
      <div className="ez-explorer__controls">
        <label className="ez-explorer__field ez-explorer__field--search" htmlFor="ez-explorer-q">
          <span className="ez-explorer__field-label">Suche</span>
          <input
            id="ez-explorer-q"
            type="search"
            value={filters.q}
            placeholder="Name, andere Bezeichnung, frühere Kennung"
            onChange={(event) => setField('q')(event.target.value)}
          />
        </label>
        <FacetField
          id="ez-explorer-org"
          label="Organisation"
          value={filters.org}
          group={groups.organization}
          onChange={setField('org')}
        />
        <FacetField
          id="ez-explorer-kapitel"
          label="Kapitel/Anhang"
          value={filters.kapitel}
          group={groups.chapter}
          onChange={setField('kapitel')}
        />
        <FacetField
          id="ez-explorer-quelle"
          label="Quelle"
          value={filters.quelle}
          group={groups.source}
          onChange={setField('quelle')}
        />
        <FacetField
          id="ez-explorer-profil"
          label="Profil"
          value={filters.profil}
          group={groups.profile}
          onChange={setField('profil')}
        />
        <FacetField
          id="ez-explorer-technisch"
          label="Technisch"
          value={filters.technisch}
          group={groups.technical}
          onChange={setField('technisch')}
        />
        <FacetField
          id="ez-explorer-fachlich"
          label="Fachlich"
          value={filters.fachlich}
          group={groups.domain}
          onChange={setField('fachlich')}
        />
      </div>

      <p className="ez-explorer__count">
        {results.length} von {allSymbols.length} Zeichen
      </p>

      {results.length === 0 ? (
        <div className="ez-note">
          <p className="ez-note__title">Kein Treffer</p>
          <p>Kein Treffer mit dieser Kombination aus Suche und Filtern.</p>
          {hasActiveFilter ? (
            <button type="button" className="ez-action" onClick={() => setFilters(EMPTY_FILTERS)}>
              <strong>Alle Filter lösen</strong>
            </button>
          ) : null}
        </div>
      ) : (
        <ul className="ez-grid ez-grid--4">
          {results.map((symbol) => (
            <li key={symbol.id}>
              <a className="ez-card" href={`/zeichen/${symbol.slug}/`}>
                <span className="ez-canvas ez-canvas--light">
                  <Einsatzzeichen drawing={symbol.drawing} size={64} />
                </span>
                <span className="ez-card__title">{symbol.title}</span>
                <StatusPair technical={symbol.review.technical} domain={symbol.review.domain} compact />
              </a>
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .ez-explorer__controls {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ez-space-3) var(--ez-space-4);
          margin-block-end: var(--ez-space-6);
        }
        .ez-explorer__field {
          display: flex;
          flex-direction: column;
          gap: var(--ez-space-1);
        }
        .ez-explorer__field-label {
          font-family: var(--ez-font-mono);
          font-size: var(--sl-text-2xs);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--sl-color-gray-3);
        }
        .ez-explorer__field--search {
          flex: 1 1 16rem;
        }
        .ez-explorer__field input,
        .ez-explorer__field select {
          font: inherit;
          font-size: var(--sl-text-sm);
          padding: var(--ez-space-2) var(--ez-space-3);
          border: 1px solid var(--sl-color-hairline);
          border-radius: var(--ez-radius);
          background: transparent;
          color: var(--sl-color-white);
        }
        .ez-explorer__field input:focus-visible,
        .ez-explorer__field select:focus-visible {
          outline: 2px solid var(--sl-color-accent);
          outline-offset: 2px;
        }
        .ez-explorer__count {
          margin: 0 0 var(--ez-space-4);
          font-family: var(--ez-font-mono);
          font-variant-numeric: tabular-nums;
          font-size: var(--sl-text-sm);
          color: var(--sl-color-gray-2);
        }
        .ez-explorer .ez-card__title {
          font-size: var(--sl-text-sm);
        }
        .ez-explorer .ez-card {
          align-items: center;
          text-align: center;
        }
      `}</style>
    </div>
  );
}

/* --- Laden, Fehler, geladen ---------------------------------------------------------------- */

/**
 * Die Stile der beiden Vorzustände stehen hier und nicht im `<style>` von `ExplorerView`: dessen
 * Block wird gar nicht gerendert, solange die Liste noch nicht steht.
 */
function GateStyle() {
  return (
    <style>{`
      .ez-explorer-gate__loading {
        margin-block: var(--ez-space-6);
        font-family: var(--ez-font-mono);
        font-size: var(--sl-text-sm);
        color: var(--sl-color-gray-2);
      }
      .ez-explorer-gate__reason {
        font-family: var(--ez-font-mono);
        font-size: var(--sl-text-2xs);
        color: var(--sl-color-white);
        overflow-wrap: anywhere;
      }
      /* .ez-action ist in theme.css für Verweise gebaut; als Knopf braucht es die Grundwerte. */
      button.ez-explorer-gate__retry {
        font: inherit;
        background: transparent;
        color: var(--sl-color-white);
        cursor: pointer;
        text-align: start;
      }
    `}</style>
  );
}

/**
 * Die Insel holt den Snapshot zur Laufzeit (LFH-500) und hat damit drei sichtbare Zustände statt
 * einem: laden, gescheitert, geladen. Abruf, Abbruch und Zustandsübergang stehen in
 * `lib/snapshot-island.ts` und sind dort geprüft; hier bleibt nur, wie die drei Zustände aussehen.
 *
 * Der Fehlerzustand nennt den Grund wörtlich — `fetch` unterscheidet einen Netzausfall, eine 404
 * nach halb ausgerolltem Deploy und ein verfälschtes Dokument, und wer die leere Seite vor sich
 * hat, kann mit „Fehler" nichts anfangen. Er lässt die Insel auch nicht stumm zurück: der Knopf
 * lädt die Seite neu, und weil `snapshot-client.ts` sich einen Fehlschlag ausdrücklich nicht
 * merkt, ist das ein echter zweiter Versuch.
 */
export default function Explorer() {
  const state = useSnapshot(selectExplorerData);

  if (state.status === 'failed') {
    return (
      <div className="ez-explorer-gate">
        <div className="ez-note" role="alert">
          <p className="ez-note__title">Der Explorer hat keine Zeichen bekommen</p>
          <p>
            Die Liste bleibt leer, und zwar aus diesem Grund — nicht, weil der Katalog leer wäre:
          </p>
          <p className="ez-explorer-gate__reason">{state.message}</p>
          <p>
            <button
              type="button"
              className="ez-action ez-explorer-gate__retry"
              onClick={() => window.location.reload()}
            >
              <strong>Erneut versuchen</strong>
              <span>Seite neu laden</span>
            </button>
          </p>
        </div>
        <GateStyle />
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="ez-explorer-gate">
        <p className="ez-explorer-gate__loading" role="status">
          Der Katalog wird geladen …
        </p>
        <GateStyle />
      </div>
    );
  }

  return <ExplorerView symbols={state.data.symbols} groups={state.data.groups} />;
}
