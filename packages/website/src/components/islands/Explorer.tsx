import { useEffect, useMemo, useState } from 'react';
import { Einsatzzeichen } from '@einsatzzeichen/react';
import {
  facetOptions,
  reviewStatusOptions,
  sanitizeFacets,
  searchSymbols,
  type ExplorerFacetField,
  type ExplorerFilters,
  type FacetGroup,
  type SymbolFacets,
} from '../../lib/explorer-search.js';
import { loadSnapshot, type ReviewSummary, type SymbolSummary } from '../../lib/snapshot.js';
import StatusPair, { statusMark } from '../StatusPair.js';

/**
 * Der Symbol Explorer (Spec §5.4). Importiert den Katalog-Snapshot direkt (nicht den
 * Katalog-Index — der zieht `node:url`, Spec §5.2) über `loadSnapshot()`, das genau diesen
 * statischen JSON-Import kapselt und zusätzlich prüft, dass der Snapshot vollständig ist.
 *
 * Facetten-Werte kommen aus dem Snapshot selbst (nicht aus `builder.vocabulary`, das die
 * *erlaubten* Werte für den Builder führt): der Explorer soll nur zeigen, was tatsächlich
 * vorkommt, mit der echten Anzahl daneben. Zähl- und Validierungslogik (`facetOptions`,
 * `reviewStatusOptions`, `sanitizeFacets`) liegt bewusst in `lib/explorer-search.ts`: dort ist
 * sie ohne DOM/React testbar (Review 1: „Alle"-Zähler; Review 2: URL-Facetten validieren).
 */

const snapshot = loadSnapshot();
const ALL_SYMBOLS: SymbolSummary[] = snapshot.symbols;
const ORGANIZATION_LABELS = new Map(snapshot.builder.organization.map((entry) => [entry.id, entry.label]));

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

export default function Explorer() {
  const [filters, setFilters] = useState<ExplorerFilters>(EMPTY_FILTERS);

  const organizationGroup = useMemo(
    () => facetOptions(ALL_SYMBOLS, (s) => s.spec.organization, (id) => ORGANIZATION_LABELS.get(id) ?? id),
    [],
  );
  const chapterGroup = useMemo(() => facetOptions(ALL_SYMBOLS, (s) => s.chapter, (id) => id), []);
  const sourceGroup = useMemo(() => {
    const citations = new Map(ALL_SYMBOLS.map((s) => [s.source.id, s.source.citation]));
    return facetOptions(ALL_SYMBOLS, (s) => s.source.id, (id) => citations.get(id) ?? id);
  }, []);
  const profileGroup = useMemo(() => facetOptions(ALL_SYMBOLS, (s) => s.profile, (id) => id), []);
  const technicalGroup = useMemo(
    () => reviewStatusOptions(ALL_SYMBOLS, 'technical', (status) => statusMark('technical', { status }).shortLabel),
    [],
  );
  const domainGroup = useMemo(
    () => reviewStatusOptions(ALL_SYMBOLS, 'domain', (status) => statusMark('domain', { status }).shortLabel),
    [],
  );

  const validValues: Record<ExplorerFacetField, readonly string[]> = useMemo(
    () => ({
      org: organizationGroup.options.map((o) => o.value),
      kapitel: chapterGroup.options.map((o) => o.value),
      quelle: sourceGroup.options.map((o) => o.value),
      profil: profileGroup.options.map((o) => o.value),
      technisch: technicalGroup.options.map((o) => o.value),
      fachlich: domainGroup.options.map((o) => o.value),
    }),
    [organizationGroup, chapterGroup, sourceGroup, profileGroup, technicalGroup, domainGroup],
  );

  // Erst nach der Hydration die URL lesen: SSR und der erste Client-Render zeigen dieselbe,
  // ungefilterte Liste — sonst weicht das serverseitig gerenderte Markup vom ersten
  // Client-Render ab, sobald die URL Parameter trägt. Werte, die keine Auswahlbox anbietet
  // (veralteter oder von Hand geänderter Link, Review 2), werden dabei verworfen statt einen
  // unsichtbaren Filter zu setzen.
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

  const results = useMemo(() => searchSymbols(ALL_SYMBOLS, filters.q, toFacets(filters)), [filters]);

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
          group={organizationGroup}
          onChange={setField('org')}
        />
        <FacetField
          id="ez-explorer-kapitel"
          label="Kapitel/Anhang"
          value={filters.kapitel}
          group={chapterGroup}
          onChange={setField('kapitel')}
        />
        <FacetField
          id="ez-explorer-quelle"
          label="Quelle"
          value={filters.quelle}
          group={sourceGroup}
          onChange={setField('quelle')}
        />
        <FacetField
          id="ez-explorer-profil"
          label="Profil"
          value={filters.profil}
          group={profileGroup}
          onChange={setField('profil')}
        />
        <FacetField
          id="ez-explorer-technisch"
          label="Technisch"
          value={filters.technisch}
          group={technicalGroup}
          onChange={setField('technisch')}
        />
        <FacetField
          id="ez-explorer-fachlich"
          label="Fachlich"
          value={filters.fachlich}
          group={domainGroup}
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
