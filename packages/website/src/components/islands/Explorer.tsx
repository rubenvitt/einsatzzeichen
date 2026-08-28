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
              <a className="ez-card" href={`/zeichen/${symbol.slug}`}>
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
