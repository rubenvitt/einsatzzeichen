import { useEffect, useMemo, useState } from 'react';
import { Einsatzzeichen } from '@einsatzzeichen/react';
import { searchSymbols, type SymbolFacets } from '../../lib/explorer-search.js';
import { loadSnapshot, type ReviewSummary, type SymbolSummary } from '../../lib/snapshot.js';
import StatusPair, { statusMark } from '../StatusPair.js';

/**
 * Der Symbol Explorer (Spec §5.4). Importiert den Katalog-Snapshot direkt (nicht den
 * Katalog-Index — der zieht `node:url`, Spec §5.2) über `loadSnapshot()`, das genau diesen
 * statischen JSON-Import kapselt und zusätzlich prüft, dass der Snapshot vollständig ist.
 *
 * Facetten-Werte kommen aus dem Snapshot selbst (nicht aus `builder.vocabulary`, das die
 * *erlaubten* Werte für den Builder führt): der Explorer soll nur zeigen, was tatsächlich
 * vorkommt, mit der echten Anzahl daneben.
 */

const snapshot = loadSnapshot();
const ALL_SYMBOLS: SymbolSummary[] = snapshot.symbols;
const ORGANIZATION_LABELS = new Map(snapshot.builder.organization.map((entry) => [entry.id, entry.label]));

interface FilterState {
  q: string;
  org: string;
  kapitel: string;
  quelle: string;
  profil: string;
  technisch: string;
  fachlich: string;
}

const EMPTY_FILTERS: FilterState = {
  q: '',
  org: '',
  kapitel: '',
  quelle: '',
  profil: '',
  technisch: '',
  fachlich: '',
};

const PARAM_KEYS: Record<keyof FilterState, string> = {
  q: 'q',
  org: 'org',
  kapitel: 'kapitel',
  quelle: 'quelle',
  profil: 'profil',
  technisch: 'technisch',
  fachlich: 'fachlich',
};

function filtersFromLocation(): FilterState {
  if (typeof window === 'undefined') return EMPTY_FILTERS;
  const params = new URLSearchParams(window.location.search);
  const next = { ...EMPTY_FILTERS };
  for (const key of Object.keys(PARAM_KEYS) as (keyof FilterState)[]) {
    next[key] = params.get(PARAM_KEYS[key]) ?? '';
  }
  return next;
}

function locationSearchFromFilters(filters: FilterState): string {
  const params = new URLSearchParams();
  for (const key of Object.keys(PARAM_KEYS) as (keyof FilterState)[]) {
    if (filters[key] !== '') params.set(PARAM_KEYS[key], filters[key]);
  }
  const query = params.toString();
  return query === '' ? '' : `?${query}`;
}

function toFacets(filters: FilterState): SymbolFacets {
  const facets: SymbolFacets = {};
  if (filters.org !== '') facets.organization = filters.org;
  if (filters.kapitel !== '') facets.chapter = filters.kapitel;
  if (filters.quelle !== '') facets.sourceId = filters.quelle;
  if (filters.profil !== '') facets.profile = filters.profil;
  if (filters.technisch !== '') facets.technical = filters.technisch as ReviewSummary['status'];
  if (filters.fachlich !== '') facets.domain = filters.fachlich as ReviewSummary['status'];
  return facets;
}

interface FacetOption {
  value: string;
  label: string;
  count: number;
}

/** Facettenwerte mit Zähler, aus dem Snapshot abgeleitet und alphabetisch sortiert. */
function facetOptions(
  symbols: SymbolSummary[],
  selector: (symbol: SymbolSummary) => string | undefined,
  labelFor: (value: string) => string,
): FacetOption[] {
  const counts = new Map<string, number>();
  for (const symbol of symbols) {
    const value = selector(symbol);
    if (value === undefined || value === '') continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: labelFor(value), count }))
    .sort((a, b) => a.label.localeCompare(b.label, 'de'));
}

const REVIEW_STATUS_ORDER: ReviewSummary['status'][] = ['approved', 'deviation', 'pending'];

function reviewStatusOptions(
  symbols: SymbolSummary[],
  axis: 'technical' | 'domain',
): FacetOption[] {
  const counts = new Map<ReviewSummary['status'], number>();
  for (const symbol of symbols) {
    const status = symbol.review[axis].status;
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return REVIEW_STATUS_ORDER.filter((status) => (counts.get(status) ?? 0) > 0).map((status) => ({
    value: status,
    label: statusMark(axis, { status }).shortLabel,
    count: counts.get(status) ?? 0,
  }));
}

interface FacetFieldProps {
  id: string;
  label: string;
  value: string;
  options: FacetOption[];
  onChange: (value: string) => void;
}

function FacetField({ id, label, value, options, onChange }: FacetFieldProps) {
  return (
    <label className="ez-explorer__field" htmlFor={id}>
      <span className="ez-explorer__field-label">{label}</span>
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Alle ({options.reduce((sum, option) => sum + option.count, 0)})</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} ({option.count})
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Explorer() {
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);

  // Erst nach der Hydration die URL lesen: SSR und der erste Client-Render zeigen dieselbe,
  // ungefilterte Liste — sonst weicht das serverseitig gerenderte Markup vom ersten
  // Client-Render ab, sobald die URL Parameter trägt.
  useEffect(() => {
    setFilters(filtersFromLocation());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const search = locationSearchFromFilters(filters);
    const url = `${window.location.pathname}${search}${window.location.hash}`;
    window.history.replaceState(null, '', url);
  }, [filters]);

  const organizationOptions = useMemo(
    () => facetOptions(ALL_SYMBOLS, (s) => s.spec.organization, (id) => ORGANIZATION_LABELS.get(id) ?? id),
    [],
  );
  const chapterOptions = useMemo(
    () => facetOptions(ALL_SYMBOLS, (s) => s.chapter, (id) => id),
    [],
  );
  const sourceOptions = useMemo(() => {
    const citations = new Map(ALL_SYMBOLS.map((s) => [s.source.id, s.source.citation]));
    return facetOptions(ALL_SYMBOLS, (s) => s.source.id, (id) => citations.get(id) ?? id);
  }, []);
  const profileOptions = useMemo(
    () => facetOptions(ALL_SYMBOLS, (s) => s.profile, (id) => id),
    [],
  );
  const technicalOptions = useMemo(() => reviewStatusOptions(ALL_SYMBOLS, 'technical'), []);
  const domainOptions = useMemo(() => reviewStatusOptions(ALL_SYMBOLS, 'domain'), []);

  const results = useMemo(
    () => searchSymbols(ALL_SYMBOLS, filters.q, toFacets(filters)),
    [filters],
  );

  const hasActiveFilter =
    filters.q !== '' ||
    filters.org !== '' ||
    filters.kapitel !== '' ||
    filters.quelle !== '' ||
    filters.profil !== '' ||
    filters.technisch !== '' ||
    filters.fachlich !== '';

  function setField(key: keyof FilterState) {
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
            placeholder="Titel, Synonym, Legacy-Bezeichnung oder ID"
            onChange={(event) => setField('q')(event.target.value)}
          />
        </label>
        <FacetField
          id="ez-explorer-org"
          label="Organisation"
          value={filters.org}
          options={organizationOptions}
          onChange={setField('org')}
        />
        <FacetField
          id="ez-explorer-kapitel"
          label="Kapitel/Anhang"
          value={filters.kapitel}
          options={chapterOptions}
          onChange={setField('kapitel')}
        />
        <FacetField
          id="ez-explorer-quelle"
          label="Quelle"
          value={filters.quelle}
          options={sourceOptions}
          onChange={setField('quelle')}
        />
        <FacetField
          id="ez-explorer-profil"
          label="Profil"
          value={filters.profil}
          options={profileOptions}
          onChange={setField('profil')}
        />
        <FacetField
          id="ez-explorer-technisch"
          label="Technisch"
          value={filters.technisch}
          options={technicalOptions}
          onChange={setField('technisch')}
        />
        <FacetField
          id="ez-explorer-fachlich"
          label="Fachlich"
          value={filters.fachlich}
          options={domainOptions}
          onChange={setField('fachlich')}
        />
      </div>

      <p className="ez-explorer__count">
        {results.length} von {ALL_SYMBOLS.length} Zeichen
      </p>

      {results.length === 0 ? (
        <p className="ez-explorer__empty">
          Kein Treffer mit dieser Kombination aus Suche und Filtern.{' '}
          {hasActiveFilter ? (
            <button type="button" onClick={() => setFilters(EMPTY_FILTERS)}>
              Alle Filter lösen
            </button>
          ) : null}
        </p>
      ) : (
        <ul className="ez-explorer__grid">
          {results.map((symbol) => (
            <li key={symbol.id} className="ez-explorer__tile">
              <a href={`/zeichen/${symbol.slug}`}>
                <Einsatzzeichen drawing={symbol.drawing} size={64} />
                <span className="ez-explorer__tile-title">{symbol.title}</span>
              </a>
              <StatusPair technical={symbol.review.technical} domain={symbol.review.domain} compact />
            </li>
          ))}
        </ul>
      )}

      <style>{`
        .ez-explorer__controls {
          display: flex;
          flex-wrap: wrap;
          gap: 0.75rem 1rem;
          margin-bottom: 1rem;
        }
        .ez-explorer__field {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.85rem;
        }
        .ez-explorer__field--search {
          flex: 1 1 16rem;
        }
        .ez-explorer__field input,
        .ez-explorer__field select {
          font: inherit;
          padding: 0.4rem 0.5rem;
        }
        .ez-explorer__count {
          margin: 0 0 1rem;
          font-size: 0.9rem;
        }
        .ez-explorer__grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(9rem, 1fr));
          gap: 1rem;
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .ez-explorer__tile {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          text-align: center;
        }
        .ez-explorer__tile a {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.35rem;
          text-decoration: none;
          color: inherit;
        }
        .ez-explorer__tile svg {
          width: 64px;
          height: 64px;
        }
        .ez-explorer__tile-title {
          font-size: 0.8rem;
        }
      `}</style>
    </div>
  );
}
