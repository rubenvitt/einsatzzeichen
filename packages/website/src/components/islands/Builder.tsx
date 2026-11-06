import {
  Component,
  useDeferredValue,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { Einsatzzeichen } from '@einsatzzeichen/react';
import {
  draw,
  fromExact,
  parse,
  renderSvg,
  type Choice,
  type Drawn,
  type Omission,
} from '@einsatzzeichen/core';
import { SpecParseError } from '@einsatzzeichen/core/exact';
import { ORGANIZATION_COLORS, pictogramDrawing } from '@einsatzzeichen/core/blocks';
import {
  PALETTE,
  type BodySign,
  type ColorToken,
  type Drawing,
  type FreestandingKind,
  type FreestandingSpec,
  type PictogramId,
  type Sign,
  type SymbolKind,
} from '@einsatzzeichen/schema';
import { exactCodeSampleFor, signCodeSamplesFor, type CodeSamples } from '../../lib/code-samples.js';
import { matchesLine, searchCatalog } from '../../lib/builder-catalog.js';
import {
  FREESTANDING_FIELDS,
  defaultFreestandingSpec,
  probeFreestanding,
  reduceFreestanding,
} from '../../lib/builder-freestanding.js';
import {
  DEFAULT_SIGN,
  FIDELITY_LABELS,
  KIND_FAMILIES,
  OPEN_TEXT_ZONES,
  TEXT_ZONES,
  changeKind,
  choiceSearchable,
  choicesMatch,
  decodeSign,
  encodeSign,
  familyOf,
  groupChoices,
  isBodySign,
  kindLabel,
  omissionLine,
  omittedKeys,
  probeSign,
  probeTasks,
  searchChoices,
  searchTasks,
  sectionVisible,
  setCenterSize,
  setSingle,
  setText,
  setTopLeftLines,
  splitChoices,
  textOf,
  toggleList,
  valueLabel,
  type ProbedField,
  type SignProbe,
} from '../../lib/builder-sign.js';
import { useSnapshot, type SnapshotSelect } from '../../lib/snapshot-island.js';
import type { SymbolSummary } from '../../lib/snapshot.js';
import StatusPair from '../StatusPair.js';

/**
 * Der Baukasten (Route `/builder/`) auf der **Beschreibung** (ESZ-150). Er setzt eine `Sign`
 * zusammen, zeichnet sie mit `draw()` aus `core` und zeigt den Bauplan nur im Expertenteil.
 *
 * Aufbau von der Absicht zum Zeichen (Konzept ESZ-148, Abschnitt 4):
 *
 * 1. **Suche zuerst.** Treffer aus Rezepten, typischen Einsatzmitteln und freistehenden Zeichen;
 *    ein Treffer lädt die Beschreibung (`fromExact`), nicht den Bauplan.
 * 2. **Was ist es?** Die Familien aus `KIND_FAMILIES` statt 29 Arten und eines Modus-Schalters;
 *    innerhalb der Familie die Arten.
 * 3. **Nur passende Abschnitte.** Ein Abschnitt erscheint, wenn wenigstens ein Wert zur übrigen
 *    Beschreibung passt (`choices()`) oder einer gesetzt ist. Werte, die hier nicht passen, stehen
 *    eingeklappt mit Grund unter der Liste, statt jeden gesperrt in die Auswahl zu stellen.
 * 4. **Vorschau mit Status.** `draw()` zeichnet immer; `fidelity` sagt vermessen, abgeleitet oder
 *    vereinfacht, und was fehlt, steht mit Grund darunter.
 * 5. **Experte.** Die Beschreibung als JSON zum Bearbeiten (nimmt auch einen Bauplan an) und der
 *    aufgelöste Bauplan. Hier bleibt jede Möglichkeit des alten Baukastens erreichbar.
 *
 * Gespeichert wird im Link die Absicht (`{"v":2,"sign":…}`); alte Links mit Bauplan
 * (`{"v":1,…}` und rohe Specs) liest `decodeSign` weiter.
 *
 * Der Katalog kommt zur Laufzeit (LFH-500): aus `lib/snapshot.js` stehen hier nur Typen, ein
 * Wertimport zöge 1,3 MB JSON ins Bündel.
 */

/** Was der Baukasten aus dem Snapshot braucht. */
interface BuilderData {
  symbols: SymbolSummary[];
}

/** Auf Modulebene: eine je Render neue Auswahl löste in `useSnapshot` einen neuen Abruf aus. */
const selectBuilderData: SnapshotSelect<BuilderData> = (snapshot) => ({ symbols: snapshot.symbols });

const SPEC_PARAM = 'spec';
/** Entprellung des URL-Schreibens; Safari wirft bei zu vielen `replaceState` in kurzer Zeit. */
const URL_WRITE_DELAY_MS = 250;
const CLEAN_PATH = '/builder/';
const PNG_SIZE = 512;
const CATALOG_MATCH_LIMIT = 12;
/** So viele Fachaufgaben stehen ohne „alle zeigen“ als Kachel da. */
const TASK_LIMIT = 24;

/* --- Ergebnis ---------------------------------------------------------------------------- */

type BuilderOutcome = { state: 'ok'; drawn: Drawn } | { state: 'crash'; error: Error };

/**
 * `draw` wirft nie wegen einer Regel oder einer Vermessungslücke. Was trotzdem fliegt, ist ein
 * Fehler im Programm; er bleibt sichtbar, statt eine leere Vorschau zu hinterlassen.
 */
function outcomeOf(sign: Sign): BuilderOutcome {
  try {
    return { state: 'ok', drawn: draw(sign) };
  } catch (error) {
    return { state: 'crash', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

/* --- Miniaturen -------------------------------------------------------------------------- */

const kindPreviewCache = new Map<string, Drawing>();

/** Die nackte Art als Miniatur, einmal gezeichnet; freistehende Arten in ihrer Ausgangsauswahl. */
function kindPreview(kind: SymbolKind | FreestandingKind): Drawing {
  let drawing = kindPreviewCache.get(kind);
  if (drawing === undefined) {
    const freestanding = (FREESTANDING_FIELDS as Partial<Record<string, unknown>>)[kind] !== undefined;
    drawing = draw(freestanding ? defaultFreestandingSpec(kind as FreestandingKind) : { kind: kind as SymbolKind }).drawing;
    kindPreviewCache.set(kind, drawing);
  }
  return drawing;
}

const taskIconCache = new Map<string, Drawing | null>();

/** Das Piktogramm einer Fachaufgabe für die Kachel; `null`, wenn das Register keins führt. */
function taskIcon(task: string): Drawing | null {
  if (!taskIconCache.has(task)) {
    try {
      taskIconCache.set(task, pictogramDrawing(`capability.${task}` as PictogramId));
    } catch {
      taskIconCache.set(task, null);
    }
  }
  return taskIconCache.get(task) ?? null;
}

/** Farbe für den Farbfleck: Organisationsfarbe aus `core`, Farbe ohne Organisation aus der Palette. */
function swatchOf(field: 'organization' | 'color', id: string): string | undefined {
  if (field === 'color') return (PALETTE as Partial<Record<string, string>>)[id];
  const token = (ORGANIZATION_COLORS as Partial<Record<string, ColorToken>>)[id];
  return token === undefined ? undefined : PALETTE[token];
}

/* --- Auswahl über der aktuellen Beschreibung --------------------------------------------- */

/**
 * Die Probe läuft aufgeschoben (`useDeferredValue`) und kann für einen Render zur vorigen
 * Beschreibung gehören. Was gesetzt ist, kommt deshalb immer aus der aktuellen: ein gerade
 * gewählter Wert erscheint sofort gewählt, und der Befund der übrigen zieht einen Render später nach.
 */
function withSelection(entries: readonly Choice[] | undefined, current: readonly string[]): Choice[] {
  const known = new Set((entries ?? []).map((entry) => entry.value));
  const merged = (entries ?? []).map((entry) => ({ ...entry, selected: current.includes(entry.value) }));
  return merged.concat(
    current.filter((value) => !known.has(value)).map((value) => ({ value, label: value, selected: true, status: 'derived' as const })),
  );
}

function selectedOf(sign: BodySign, field: ProbedField | 'tasks'): string[] {
  const value = (sign as unknown as Record<string, unknown>)[field];
  if (Array.isArray(value)) return value as string[];
  return typeof value === 'string' ? [value] : [];
}

/* --- Bausteine --------------------------------------------------------------------------- */

/** Werte, die hier nicht passen: eingeklappt, mit Grund. */
function BlockedList({ entries }: { entries: readonly Choice[] }) {
  if (entries.length === 0) return null;
  return (
    <details className="ez-builder__blocked">
      <summary>
        {entries.length === 1 ? 'Ein weiterer passt hier nicht' : `${entries.length} weitere passen hier nicht`}
      </summary>
      <ul>
        {entries.map((entry) => (
          <li key={entry.value}>
            <strong>{entry.label}</strong> — {entry.why ?? 'Nicht zeichenbar.'}
          </li>
        ))}
      </ul>
    </details>
  );
}

interface ChoiceSearch {
  query: string;
  setQuery: (query: string) => void;
  /** Ob die Auswahl lang genug für ein Suchfeld ist. */
  searchable: boolean;
  /** Die Werte zur Suche, gesetzte immer dabei; ohne Suchfeld alle. */
  shown: readonly Choice[];
  /** Die Suche trifft keinen Wert, auch keinen gesetzten. */
  empty: boolean;
}

/**
 * Suche über einer langen Auswahl (ESZ-152), wie bei den Fachaufgaben: gefiltert werden die
 * passenden Werte und die eingeklappte Liste darunter gleichermaßen.
 */
function useChoiceSearch(entries: readonly Choice[]): ChoiceSearch {
  const [query, setQuery] = useState('');
  const searchable = choiceSearchable(entries);
  const shown = useMemo(() => (searchable ? searchChoices(entries, query) : entries), [searchable, entries, query]);
  const empty = searchable && !choicesMatch(entries, query);
  return { query, setQuery, searchable, shown, empty };
}

/**
 * Das Suchfeld zu `useChoiceSearch`; ohne lange Auswahl nichts. Die Beschriftung lässt eine
 * Quellenangabe in Klammern weg („Zustand (Kapitel 5.8)“ sucht als „Zustand suchen“). `quiet`
 * steht unter einer Knopfgruppe, die ihre Beschriftung schon trägt: dort nennt der Platzhalter das
 * Feld, und die Beschriftung bleibt für Screenreader.
 */
function ChoiceSearchField({ label, search, quiet = false }: { label: string; search: ChoiceSearch; quiet?: boolean }) {
  const id = useId();
  if (!search.searchable) return null;
  const name = `${label.replace(/\s*\(.*\)$/, '')} suchen`;
  return (
    <>
      <label className="ez-builder__field ez-builder__choice-search" htmlFor={id}>
        <span className={quiet ? 'ez-builder__field-label ez-builder__sr' : 'ez-builder__field-label'}>{name}</span>
        <input
          id={id}
          type="search"
          placeholder={quiet ? name : undefined}
          value={search.query}
          onChange={(event) => search.setQuery(event.target.value)}
        />
      </label>
      {/* Steht immer, damit ein Screenreader die Änderung ansagt und nicht einen neuen Knoten. */}
      <p className={search.empty ? 'ez-builder__field-hint' : 'ez-builder__field-hint ez-builder__sr'} role="status">
        {search.empty ? 'Nichts passt zu dieser Suche.' : null}
      </p>
    </>
  );
}

/** Kurze Marke an einem gesetzten Wert, den `draw` weglassen musste. */
function MissingMark({ show }: { show: boolean }) {
  return show ? <span className="ez-builder__missing">nicht im Bild</span> : null;
}

interface ChipsProps {
  label: string;
  entries: readonly Choice[];
  /** Mehrfachauswahl: ein Klick schaltet um. Sonst setzt ein Klick, ein zweiter nimmt zurück. */
  onPick: (value: string) => void;
  /** Eigene Taste „ohne“; fehlt sie, nimmt ein Klick auf den gesetzten Wert ihn zurück. */
  unset?: { label: string; onPick: () => void };
  missing: (value: string) => boolean;
  icon?: (value: string) => ReactNode;
  /** Abschnitte innerhalb der Gruppe (Zustandsgruppen, Kopfarten). */
  grouped?: boolean;
  variant?: 'chip' | 'segment';
}

/**
 * Eine Gruppe von Knöpfen über einer Auswahl aus `choices()`: oben was passt, darunter
 * eingeklappt, was hier nicht passt. Ein Knopf trägt `aria-pressed`; ein abgeleiteter Wert ist
 * wählbar und unterscheidet sich nur im Tooltip.
 */
function Chips({ label, entries, onPick, unset, missing, icon, grouped = false, variant = 'chip' }: ChipsProps) {
  const labelId = useId();
  const search = useChoiceSearch(entries);
  const { fitting, blocked } = splitChoices(search.shown);
  const anySelected = fitting.some((entry) => entry.selected);
  const button = (entry: Choice) => (
    <button
      key={entry.value}
      type="button"
      className={entry.selected ? `ez-builder__chip-option ez-builder__chip-option--on` : 'ez-builder__chip-option'}
      aria-pressed={entry.selected}
      title={entry.status === 'derived' ? 'Aus vermessenen Teilen abgeleitet' : undefined}
      onClick={() => onPick(entry.value)}
    >
      {icon?.(entry.value)}
      <span>{entry.label}</span>
      <MissingMark show={entry.selected && missing(entry.value)} />
    </button>
  );
  const rowClass = variant === 'segment' ? 'ez-builder__segments' : 'ez-builder__chip-row';
  return (
    <div className="ez-builder__chips-field">
      <span className="ez-builder__field-label" id={labelId}>
        {label}
      </span>
      <ChoiceSearchField label={label} search={search} quiet />
      {grouped ? (
        <div role="group" aria-labelledby={labelId} className="ez-builder__chip-groups">
          {unset === undefined ? null : (
            <div className={rowClass}>
              <button
                type="button"
                className={anySelected ? 'ez-builder__chip-option' : 'ez-builder__chip-option ez-builder__chip-option--on'}
                aria-pressed={!anySelected}
                onClick={unset.onPick}
              >
                {unset.label}
              </button>
            </div>
          )}
          {groupChoices(fitting).map(({ group, entries: inGroup }) => (
            <div key={group ?? '-'} className="ez-builder__chip-group">
              {group === undefined ? null : <span className="ez-builder__chip-group-label">{group}</span>}
              <div className={rowClass}>{inGroup.map(button)}</div>
            </div>
          ))}
        </div>
      ) : (
        <div role="group" aria-labelledby={labelId} className={rowClass}>
          {unset === undefined ? null : (
            <button
              type="button"
              className={anySelected ? 'ez-builder__chip-option' : 'ez-builder__chip-option ez-builder__chip-option--on'}
              aria-pressed={!anySelected}
              onClick={unset.onPick}
            >
              {icon?.('')}
              <span>{unset.label}</span>
            </button>
          )}
          {fitting.map(button)}
        </div>
      )}
      <BlockedList entries={blocked} />
    </div>
  );
}

function Swatch({ color }: { color: string | undefined }) {
  return (
    <span
      className={color === undefined ? 'ez-builder__swatch ez-builder__swatch--none' : 'ez-builder__swatch'}
      style={color === undefined ? undefined : { background: color }}
      aria-hidden="true"
    />
  );
}

function Section({ title, children, summary }: { title: string; children: ReactNode; summary?: string }) {
  const headingId = useId();
  return (
    <section className="ez-builder__group" aria-labelledby={headingId}>
      <h2 className="ez-builder__group-title" id={headingId}>
        {title}
        {summary === undefined || summary === '' ? null : <span className="ez-builder__group-summary">{summary}</span>}
      </h2>
      {children}
    </section>
  );
}

function MiniDrawing({ drawing, size, prefix }: { drawing: Drawing | null; size: number; prefix: string }) {
  return (
    <span className="ez-canvas ez-canvas--light ez-builder__mini-canvas" style={{ width: size + 8, height: size + 8 }}>
      {drawing === null ? (
        <span className="ez-builder__tile-placeholder" aria-hidden="true" />
      ) : (
        <Einsatzzeichen drawing={drawing} size={size} idPrefix={prefix} />
      )}
    </span>
  );
}

/* --- Suche ------------------------------------------------------------------------------- */

interface SearchProps {
  symbols: SymbolSummary[];
  query: string;
  onQuery: (query: string) => void;
  onLoad: (id: string) => void;
  onRandom: () => void;
  onReset: () => void;
}

function SearchSection({ symbols, query, onQuery, onLoad, onRandom, onReset }: SearchProps) {
  const matches = useMemo(() => searchCatalog(symbols, query, CATALOG_MATCH_LIMIT), [symbols, query]);
  return (
    <section className="ez-builder__group ez-builder__search" aria-labelledby="ez-builder-search-label">
      <label className="ez-builder__search-label" id="ez-builder-search-label" htmlFor="ez-builder-search">
        Was willst du zeichnen?
      </label>
      <input
        id="ez-builder-search"
        type="search"
        placeholder="z. B. RTW, Bergungsgruppe, Löschzug, E.1.1"
        value={query}
        onChange={(event) => onQuery(event.target.value)}
      />
      {query.trim() === '' ? (
        <div className="ez-builder__group-actions">
          <button type="button" className="ez-action" onClick={onRandom}>
            <strong>Beispiel laden</strong>
          </button>
          <button type="button" className="ez-action" onClick={onReset}>
            <strong>Neu beginnen</strong>
          </button>
        </div>
      ) : (
        <>
          <ul className="ez-builder__matches">
            {matches.matches.map((symbol) => (
              <li key={symbol.id}>
                <button type="button" className="ez-builder__match" onClick={() => onLoad(symbol.id)}>
                  <MiniDrawing drawing={symbol.drawing} size={36} prefix={`ez-hit-${symbol.slug}`} />
                  <span className="ez-builder__match-title">{symbol.title}</span>
                  <span className="ez-id">{symbol.id}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="ez-builder__field-hint" role="status">
            {matchesLine(matches.total, matches.matches.length)}
          </p>
        </>
      )}
    </section>
  );
}

/* --- Was ist es? ------------------------------------------------------------------------- */

function FamilySection({ sign, onKind }: { sign: Sign; onKind: (kind: SymbolKind | FreestandingKind) => void }) {
  const family = familyOf(sign);
  return (
    <Section title="Was ist es?">
      <div className="ez-builder__families" role="group" aria-label="Familie">
        {KIND_FAMILIES.map((candidate) => {
          const on = candidate.id === family.id;
          const first = candidate.kinds[0]!;
          return (
            <button
              key={candidate.id}
              type="button"
              className={on ? 'ez-builder__family ez-builder__family--on' : 'ez-builder__family'}
              aria-pressed={on}
              onClick={() => {
                if (!on) onKind(first);
              }}
            >
              <MiniDrawing drawing={kindPreview(first)} size={40} prefix={`ez-family-${candidate.id}`} />
              <span className="ez-builder__family-text">
                <span className="ez-builder__family-label">{candidate.label}</span>
                <span className="ez-builder__family-hint">{candidate.hint}</span>
              </span>
            </button>
          );
        })}
      </div>
      {family.kinds.length > 1 ? (
        <div className="ez-builder__chip-row" role="group" aria-label={`Art: ${family.label}`}>
          {family.kinds.map((kind) => {
            const on = kind === sign.kind;
            return (
              <button
                key={kind}
                type="button"
                className={on ? 'ez-builder__chip-option ez-builder__chip-option--on' : 'ez-builder__chip-option'}
                aria-pressed={on}
                onClick={() => onKind(kind)}
              >
                <MiniDrawing drawing={kindPreview(kind)} size={24} prefix={`ez-kind-${kind}`} />
                <span>{kindLabel(kind)}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </Section>
  );
}

/* --- Fachaufgaben ------------------------------------------------------------------------ */

interface TaskSectionProps {
  sign: BodySign;
  /** Die Beschreibung der aufgeschobenen Probe. */
  probeTarget: BodySign;
  missing: (value: string) => boolean;
  onToggle: (task: string) => void;
}

/**
 * Fachaufgaben als Suche mit Piktogrammkacheln. Keine Wahl zwischen Box und randbündig: die
 * Fassung wählt `resolve` (vermessen vor abgeleitet, randbündig vor Box). Befragt werden nur die
 * sichtbaren Kacheln — alle rund 90 kosten beim ersten Mal je Art mehrere hundert Millisekunden.
 */
function TaskSection({ sign, probeTarget, missing, onToggle }: TaskSectionProps) {
  const [query, setQuery] = useState('');
  const [all, setAll] = useState(false);
  // Über einen Schlüssel, nicht über das Feld: `sign.tasks ?? []` wäre in jedem Render eine neue
  // Liste, und die Probe der Kacheln liefe bei jedem Tastenanschlag in einem anderen Feld neu.
  const selectedKey = (sign.tasks ?? []).join('|');
  const selected = useMemo(() => (selectedKey === '' ? [] : selectedKey.split('|')), [selectedKey]);
  const results = useMemo(() => searchTasks(query).filter((option) => !selected.includes(option.value)), [query, selected]);
  const shown = useMemo(() => (all ? results : results.slice(0, TASK_LIMIT)), [all, results]);
  const candidates = useMemo(() => shown.map((option) => option.value), [shown]);
  const deferredCandidates = useDeferredValue(candidates);
  const probe = useMemo(() => probeTasks(probeTarget, deferredCandidates), [probeTarget, deferredCandidates]);
  const byValue = new Map(probe.map((entry) => [entry.value, entry]));
  const fitting = shown.filter((option) => byValue.get(option.value)?.status !== 'blocked');
  const blocked = shown
    .map((option) => byValue.get(option.value))
    .filter((entry): entry is Choice => entry !== undefined && entry.status === 'blocked');

  return (
    <Section title="Fachaufgaben" summary={selected.map((task) => valueLabel('tasks', task)).join(', ')}>
      {selected.length === 0 ? null : (
        <ul className="ez-builder__chips" aria-label="Gewählte Fachaufgaben">
          {selected.map((task) => (
            <li key={task}>
              <button type="button" className="ez-builder__chip" onClick={() => onToggle(task)}>
                <span>{valueLabel('tasks', task)}</span>
                <MissingMark show={missing(task)} />
                <span aria-hidden="true">×</span>
                <span className="ez-builder__sr">entfernen</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <label className="ez-builder__field" htmlFor="ez-builder-task-search">
        <span className="ez-builder__field-label">Fachaufgabe suchen</span>
        <input
          id="ez-builder-task-search"
          type="search"
          placeholder="z. B. Sanität, Bergung, Verpflegung"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="ez-builder__task-tiles" role="group" aria-label="Fachaufgabe hinzufügen">
        {fitting.map((option) => (
          <button
            key={option.value}
            type="button"
            className="ez-builder__task"
            title={byValue.get(option.value)?.status === 'derived' ? 'Aus vermessenen Teilen abgeleitet' : undefined}
            onClick={() => onToggle(option.value)}
          >
            <MiniDrawing drawing={taskIcon(option.value)} size={36} prefix={`ez-task-${option.value}`} />
            <span>{option.label}</span>
          </button>
        ))}
      </div>
      {results.length > TASK_LIMIT ? (
        <button type="button" className="ez-builder__more" onClick={() => setAll(!all)}>
          {all ? 'Weniger zeigen' : `Alle ${results.length} zeigen`}
        </button>
      ) : null}
      {results.length === 0 ? <p className="ez-builder__field-hint">Keine Fachaufgabe passt zu dieser Suche.</p> : null}
      <BlockedList entries={blocked} />
    </Section>
  );
}

/* --- Text -------------------------------------------------------------------------------- */

function TextSection({ sign, onChange }: { sign: BodySign; onChange: (sign: BodySign) => void }) {
  const lines = sign.text?.topLeftLines;
  const extraSet = TEXT_ZONES.slice(OPEN_TEXT_ZONES).some(({ zone }) => textOf(sign, zone) !== '') || lines !== undefined;
  const field = ({ zone, label }: (typeof TEXT_ZONES)[number]) => (
    <div className="ez-builder__field" key={zone}>
      <label className="ez-builder__field-label" htmlFor={`ez-builder-text-${zone}`}>
        {label}
      </label>
      <input
        id={`ez-builder-text-${zone}`}
        type="text"
        value={textOf(sign, zone)}
        onChange={(event) => onChange(setText(sign, zone, event.target.value))}
      />
    </div>
  );
  return (
    <Section title="Text">
      <div className="ez-builder__group-grid">
        {TEXT_ZONES.slice(0, OPEN_TEXT_ZONES).map(field)}
        <div className="ez-builder__field">
          <label className="ez-builder__field-label" htmlFor="ez-builder-text-centerSize">
            Größe in der Mitte
          </label>
          <select
            id="ez-builder-text-centerSize"
            value={sign.text?.centerSize ?? 'normal'}
            disabled={textOf(sign, 'center') === ''}
            onChange={(event) => onChange(setCenterSize(sign, event.target.value === 'large' ? 'large' : 'normal'))}
          >
            <option value="normal">Normal</option>
            <option value="large">Groß</option>
          </select>
        </div>
      </div>
      <details className="ez-builder__details" open={extraSet}>
        <summary>Weitere Textstellen</summary>
        <div className="ez-builder__group-grid">
          {TEXT_ZONES.slice(OPEN_TEXT_ZONES).map(field)}
          <div className="ez-builder__field">
            <label className="ez-builder__field-label" htmlFor="ez-builder-text-topLeftLines-0">
              Oben links, erste Zeile
            </label>
            <input
              id="ez-builder-text-topLeftLines-0"
              type="text"
              value={lines?.[0] ?? ''}
              onChange={(event) => onChange(setTopLeftLines(sign, event.target.value, lines?.[1] ?? ''))}
            />
          </div>
          <div className="ez-builder__field">
            <label className="ez-builder__field-label" htmlFor="ez-builder-text-topLeftLines-1">
              Oben links, zweite Zeile
            </label>
            <input
              id="ez-builder-text-topLeftLines-1"
              type="text"
              value={lines?.[1] ?? ''}
              onChange={(event) => onChange(setTopLeftLines(sign, lines?.[0] ?? '', event.target.value))}
            />
          </div>
        </div>
      </details>
    </Section>
  );
}

/* --- Zeichen mit Körper ------------------------------------------------------------------ */

interface BodySectionsProps {
  sign: BodySign;
  probeTarget: BodySign;
  probe: SignProbe | undefined;
  omitted: readonly Omission[];
  onChange: (sign: BodySign) => void;
}

function BodySections({ sign, probeTarget, probe, omitted, onChange }: BodySectionsProps) {
  const missingKeys = omittedKeys(omitted);
  const missingIn = (field: string) => (value: string) => missingKeys.has(`${field}:${value}`);
  const entries = (field: ProbedField) => withSelection(probe?.get(field), selectedOf(sign, field));
  const visible = (field: ProbedField) => sectionVisible(entries(field));
  const single = (field: Exclude<ProbedField, 'states'>) => (value: string) =>
    onChange(setSingle(sign, field, selectedOf(sign, field).includes(value) ? undefined : value));
  const summary = (field: ProbedField) => selectedOf(sign, field).map((value) => valueLabel(field, value)).join(', ');

  const colorEntries = entries('color');
  return (
    <>
      <Section title="Organisation" summary={summary('organization') || summary('color')}>
        <Chips
          label="Organisation"
          entries={entries('organization')}
          onPick={(value) => onChange(setSingle(sign, 'organization', value))}
          unset={{
            label: 'ohne',
            onPick: () => onChange(setSingle(setSingle(sign, 'organization', undefined), 'color', undefined)),
          }}
          missing={missingIn('organization')}
          icon={(value) => <Swatch color={value === '' ? undefined : swatchOf('organization', value)} />}
        />
        {sectionVisible(colorEntries) ? (
          <details className="ez-builder__details" open={sign.color !== undefined}>
            <summary>Farbe ohne Organisation</summary>
            <Chips
              label="Farbe"
              entries={colorEntries}
              onPick={single('color')}
              missing={missingIn('color')}
              icon={(value) => <Swatch color={swatchOf('color', value)} />}
            />
          </details>
        ) : null}
      </Section>

      <TaskSection
        sign={sign}
        probeTarget={probeTarget}
        missing={missingIn('tasks')}
        onToggle={(task) => onChange(toggleList(sign, 'tasks', task))}
      />

      {visible('head') ? (
        <Section title="Größe und Ebene" summary={summary('head')}>
          <Chips
            label="Kopf"
            entries={entries('head')}
            grouped
            variant="segment"
            onPick={(value) => onChange(setSingle(sign, 'head', value))}
            unset={{ label: 'ohne', onPick: () => onChange(setSingle(sign, 'head', undefined)) }}
            missing={missingIn('head')}
          />
        </Section>
      ) : null}

      {visible('role') ? (
        <Section title="Funktion" summary={summary('role')}>
          <RoleSelect sign={sign} entries={entries('role')} onChange={onChange} missing={missingIn('role')} />
        </Section>
      ) : null}

      {visible('chassis') ? (
        <Section title="Fahrwerk" summary={summary('chassis')}>
          <Chips label="Fahrwerk" entries={entries('chassis')} onPick={single('chassis')} missing={missingIn('chassis')} />
        </Section>
      ) : null}

      {visible('variant') ? (
        <Section title="Darstellung" summary={summary('variant')}>
          <Chips
            label="Zweite Zeichnung"
            entries={entries('variant')}
            onPick={single('variant')}
            unset={{ label: 'Erste Zeichnung', onPick: () => onChange(setSingle(sign, 'variant', undefined)) }}
            missing={missingIn('variant')}
          />
        </Section>
      ) : null}

      {visible('states') ? (
        <Section title="Zustand" summary={summary('states')}>
          <Chips
            label="Zustand"
            entries={entries('states')}
            grouped
            onPick={(value) => onChange(toggleList(sign, 'states', value))}
            missing={missingIn('states')}
          />
        </Section>
      ) : null}

      <TextSection sign={sign} onChange={onChange} />
    </>
  );
}

/** Funktionsfassungen sind viele und lang benannt; eine Auswahlliste statt Knöpfen. */
function RoleSelect({
  sign,
  entries,
  onChange,
  missing,
}: {
  sign: BodySign;
  entries: readonly Choice[];
  onChange: (sign: BodySign) => void;
  missing: (value: string) => boolean;
}) {
  const search = useChoiceSearch(entries);
  const { fitting, blocked } = splitChoices(search.shown);
  return (
    <div className="ez-builder__field">
      <ChoiceSearchField label="Funktion" search={search} />
      <label className="ez-builder__field-label" htmlFor="ez-builder-role">
        Funktionsfassung
      </label>
      <select
        id="ez-builder-role"
        value={sign.role ?? ''}
        onChange={(event) => onChange(setSingle(sign, 'role', event.target.value === '' ? undefined : event.target.value))}
      >
        <option value="">ohne</option>
        {fitting.map((entry) => (
          <option key={entry.value} value={entry.value}>
            {entry.label}
          </option>
        ))}
      </select>
      {sign.role !== undefined && missing(sign.role) ? <MissingMark show /> : null}
      <BlockedList entries={blocked} />
    </div>
  );
}

/* --- Freistehende Zeichen ---------------------------------------------------------------- */

/**
 * Die Felder einer freistehenden Art aus `FREESTANDING_FIELDS`, über dieselben Bausteine. Ein
 * Feld mit vielen Werten (Piktogramm, Zustand) bekommt eine Auswahlliste, die übrigen Knöpfe.
 * Den Verlauf von Pfeil und Linie stellt der Baukasten nicht ein; ein Link behält einen eigenen.
 */
function FreestandingSections({ spec, onChange }: { spec: FreestandingSpec; onChange: (spec: FreestandingSpec) => void }) {
  const probes = useMemo(() => probeFreestanding(spec), [spec]);
  const current = spec as unknown as Record<string, unknown>;
  return (
    <>
      {FREESTANDING_FIELDS[spec.kind].map((definition) => {
        const entries = probes.get(definition.field) ?? [];
        const value = current[definition.field];
        if (definition.shape === 'list') {
          const values = Array.isArray(value) ? (value as string[]) : [];
          return (
            <Section key={definition.field} title={definition.label}>
              <Chips
                label={definition.label}
                entries={entries}
                grouped
                missing={() => false}
                onPick={(picked) => {
                  const next = values.includes(picked) ? values.filter((entry) => entry !== picked) : [...values, picked];
                  onChange(reduceFreestanding(spec, definition.field, next));
                }}
              />
            </Section>
          );
        }
        if (definition.options.length > 16) {
          return (
            <Section key={definition.field} title={definition.label}>
              <FreestandingSelect
                field={definition.field}
                label={definition.label}
                unsetLabel={definition.unsetLabel}
                entries={entries}
                value={typeof value === 'string' ? value : ''}
                onPick={(picked) => onChange(reduceFreestanding(spec, definition.field, picked))}
              />
            </Section>
          );
        }
        return (
          <Section key={definition.field} title={definition.label}>
            <Chips
              label={definition.label}
              entries={entries}
              missing={() => false}
              onPick={(picked) => {
                if (picked === value && definition.unsetLabel === undefined) return;
                onChange(reduceFreestanding(spec, definition.field, picked === value ? undefined : picked));
              }}
              {...(definition.unsetLabel === undefined
                ? {}
                : { unset: { label: definition.unsetLabel, onPick: () => onChange(reduceFreestanding(spec, definition.field, undefined)) } })}
            />
          </Section>
        );
      })}
    </>
  );
}

interface FreestandingSelectProps {
  field: string;
  label: string;
  unsetLabel: string | undefined;
  entries: readonly Choice[];
  value: string;
  onPick: (value: string | undefined) => void;
}

/** Ein Feld mit vielen Werten als Auswahlliste, in Gruppen, mit Suche darüber. */
function FreestandingSelect({ field, label, unsetLabel, entries, value, onPick }: FreestandingSelectProps) {
  const search = useChoiceSearch(entries);
  const { fitting, blocked } = splitChoices(search.shown);
  return (
    <div className="ez-builder__field">
      <ChoiceSearchField label={label} search={search} />
      <label className="ez-builder__field-label" htmlFor={`ez-builder-fs-${field}`}>
        {label}
      </label>
      <select
        id={`ez-builder-fs-${field}`}
        value={value}
        onChange={(event) => onPick(event.target.value === '' ? undefined : event.target.value)}
      >
        {unsetLabel === undefined ? null : <option value="">{unsetLabel}</option>}
        {groupChoices(fitting).map(({ group, entries: inGroup }) =>
          group === undefined ? (
            inGroup.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))
          ) : (
            <optgroup key={group} label={group}>
              {inGroup.map((entry) => (
                <option key={entry.value} value={entry.value}>
                  {entry.label}
                </option>
              ))}
            </optgroup>
          ),
        )}
      </select>
      <BlockedList entries={blocked} />
    </div>
  );
}

/* --- Experte ----------------------------------------------------------------------------- */

/**
 * Der Bauplan im Expertenteil (Konzept 4.1, Punkt 5). Oben die Beschreibung als JSON zum
 * Bearbeiten — sie nimmt auch einen Bauplan an (`SymbolSpec`, `FreestandingSpec` oder eine Hülle
 * `{"v":1|2,…}`), den `parse` über `fromExact` zur Beschreibung macht. Technische Körpermarken,
 * Fassungen und Messwerte stehen dort unter `exact`. Darunter der aufgelöste Bauplan, wie `draw`
 * ihn gezeichnet hat.
 */
function ExpertSection({ sign, drawn, onChange }: { sign: Sign; drawn: Drawn | null; onChange: (sign: Sign) => void }) {
  const signJson = useMemo(() => JSON.stringify(sign, null, 2), [sign]);
  const [draft, setDraft] = useState(signJson);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setDraft(signJson);
    setError(null);
  }, [signJson]);
  const exactJson = drawn === null ? '' : JSON.stringify(drawn.exact, null, 2);

  function apply() {
    let first: unknown;
    try {
      onChange(parse(`{"v":2,"sign":${draft}}`));
      return;
    } catch (caught) {
      first = caught;
    }
    try {
      onChange(parse(draft));
    } catch {
      setError(first instanceof SpecParseError ? `${first.path}: ${first.reason}` : String(first));
    }
  }

  return (
    <details className="ez-builder__expert">
      <summary>Bauplan (Experte)</summary>
      <div className="ez-builder__expert-body">
        <div className="ez-builder__field">
          <label className="ez-builder__field-label" htmlFor="ez-builder-expert-sign">
            Beschreibung oder Bauplan als JSON
          </label>
          <textarea
            id="ez-builder-expert-sign"
            className="ez-builder__json"
            spellCheck={false}
            rows={Math.min(24, Math.max(6, draft.split('\n').length + 1))}
            value={draft}
            aria-describedby={error === null ? undefined : 'ez-builder-expert-error'}
            onChange={(event) => setDraft(event.target.value)}
          />
          {error === null ? null : (
            <p className="ez-builder__field-issue" id="ez-builder-expert-error" role="alert">
              {error}
            </p>
          )}
          <div className="ez-builder__group-actions">
            <button type="button" className="ez-action" disabled={draft === signJson} onClick={apply}>
              <strong>Übernehmen</strong>
            </button>
            <CopyButton text={signJson} label="Beschreibung kopieren" />
          </div>
        </div>
        {drawn === null ? null : (
          <div className="ez-builder__field">
            <span className="ez-builder__field-label">Aufgelöster Bauplan</span>
            <pre className="ez-builder__pre">
              <code>{exactCodeSampleFor(drawn.exact)}</code>
            </pre>
            <CopyButton text={exactJson} label="Bauplan kopieren" />
          </div>
        )}
      </div>
    </details>
  );
}

/* --- Kopieren und Codebeispiele ---------------------------------------------------------- */

interface CopyButtonProps {
  /** Als Funktion, wenn der Text erst im Browser entsteht (etwa aus `window.location`). */
  text: string | (() => string);
  label: string;
}

function CopyButton({ text, label }: CopyButtonProps) {
  const [note, setNote] = useState<string | null>(null);
  return (
    <span className="ez-builder__copy">
      <button
        type="button"
        className="ez-action ez-builder__copy-button"
        onClick={() => {
          // `navigator.clipboard` fehlt in unsicheren Kontexten ganz und lehnt sonst ohne Recht ab;
          // beide Wege enden sichtbar am Knopf.
          const failed = (error: unknown) =>
            setNote(`nicht kopiert: ${error instanceof Error ? error.message : String(error)}`);
          try {
            const value = typeof text === 'function' ? text() : text;
            void navigator.clipboard.writeText(value).then(() => setNote('kopiert'), failed);
          } catch (error) {
            failed(error);
          }
        }}
      >
        <strong>{label}</strong>
      </button>
      {note === null ? null : (
        <span className="ez-builder__copy-note" role="status">
          {note}
        </span>
      )}
    </span>
  );
}

const CODE_TABS: { key: keyof CodeSamples; label: string }[] = [
  { key: 'typescript', label: 'TypeScript' },
  { key: 'react', label: 'React' },
  { key: 'webComponent', label: 'Web Component' },
  { key: 'maplibre', label: 'MapLibre' },
];

function CodeTabs({ samples }: { samples: CodeSamples }) {
  const [active, setActive] = useState<keyof CodeSamples>('typescript');
  return (
    <div className="ez-builder__code">
      <div className="ez-builder__tabs" role="tablist" aria-label="Codebeispiele">
        {CODE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            id={`ez-builder-tab-${tab.key}`}
            aria-selected={active === tab.key}
            aria-controls={`ez-builder-panel-${tab.key}`}
            className={active === tab.key ? 'ez-builder__tab ez-builder__tab--active' : 'ez-builder__tab'}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`ez-builder-panel-${active}`} aria-labelledby={`ez-builder-tab-${active}`}>
        <pre className="ez-builder__pre">
          <code>{samples[active]}</code>
        </pre>
        <CopyButton text={samples[active]} label="Beispiel kopieren" />
      </div>
    </div>
  );
}

/* --- Vorschau ---------------------------------------------------------------------------- */

const PREVIEW_SIZES = [32, 64, 128];

type PreviewBackground = 'light' | 'dark';

interface ActionNote {
  tone: 'ok' | 'error';
  text: string;
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  // Nicht sofort widerrufen: der Download startet asynchron.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Die abgeleiteten Teile einer Zeichnung, jeder nur einmal, in der Reihenfolge der Zeichnung. */
function derivationParts(drawing: Drawing): string[] {
  return [...new Set((drawing.derivations ?? []).map((note) => note.part))];
}

/** Status unter der Vorschau: was fehlt (vereinfacht) und welche Teile abgeleitet sind. */
function StatusNote({ drawn }: { drawn: Drawn }) {
  if (drawn.fidelity === 'simplified') {
    return (
      <div className="ez-note ez-builder__omitted" role="note">
        <p className="ez-note__title">Nicht im Bild</p>
        <ul>
          {drawn.omitted.map((omission, index) => {
            const line = omissionLine(omission);
            return (
              <li key={index}>
                <strong>{line.what}</strong> — {line.why}
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  const parts = derivationParts(drawn.drawing);
  if (drawn.fidelity !== 'derived' || parts.length === 0) return null;
  return (
    <details className="ez-note ez-builder__details ez-builder__derived">
      <summary>{parts.length === 1 ? 'Ein abgeleiteter Teil' : `${parts.length} abgeleitete Teile`}</summary>
      <ul className="ez-builder__derived-list">
        {parts.map((part, index) => (
          <li key={index}>{part}</li>
        ))}
      </ul>
    </details>
  );
}

interface PreviewPanelProps {
  outcome: BuilderOutcome;
  sign: Sign;
  fileBase: string;
}

/**
 * Das Ergebnis: großes Zeichen auf Weiß oder Graphit, der Status aus `draw`, die Größenreihe und
 * die Mitnahme-Aktionen. Jeder Fehlschlag einer Aktion steht am Knopf; die PNG-Kette (SVG → Image
 * → Canvas → Blob) hat drei Stellen, an denen Browser still scheitern können.
 */
function PreviewPanel({ outcome, sign, fileBase }: PreviewPanelProps) {
  const [background, setBackground] = useState<PreviewBackground>('light');
  const [note, setNote] = useState<ActionNote | null>(null);

  const fail = (error: unknown) => setNote({ tone: 'error', text: error instanceof Error ? error.message : String(error) });

  function downloadSvg(drawing: Drawing) {
    try {
      const svg = renderSvg(drawing, { idPrefix: 'ez-download' });
      downloadBlob(new Blob([svg], { type: 'image/svg+xml' }), `${fileBase}.svg`);
      setNote({ tone: 'ok', text: `${fileBase}.svg gespeichert` });
    } catch (error) {
      fail(error);
    }
  }

  function downloadPng(drawing: Drawing) {
    try {
      const svg = renderSvg(drawing, { size: PNG_SIZE, idPrefix: 'ez-download-png' });
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth > 0 ? image.naturalWidth : PNG_SIZE;
          canvas.height = image.naturalHeight > 0 ? image.naturalHeight : PNG_SIZE;
          const context = canvas.getContext('2d');
          if (context === null) throw new Error('Der Browser gab keinen Canvas-Kontext her.');
          context.drawImage(image, 0, 0);
          canvas.toBlob((blob) => {
            if (blob === null) {
              fail(new Error('Der Browser hat aus der Zeichnung kein PNG erzeugt (toBlob).'));
              return;
            }
            downloadBlob(blob, `${fileBase}.png`);
            setNote({ tone: 'ok', text: `${fileBase}.png gespeichert (${PNG_SIZE} px)` });
          }, 'image/png');
        } catch (error) {
          fail(error);
        }
      };
      image.onerror = () => fail(new Error('Der Browser konnte das Zeichen nicht als Bild laden (SVG→PNG).'));
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    } catch (error) {
      fail(error);
    }
  }

  const drawn = outcome.state === 'ok' ? outcome.drawn : null;
  const drawing = drawn?.drawing ?? null;

  return (
    <section className="ez-builder__panel" aria-label="Vorschau und Mitnahme">
      <div className="ez-builder__panel-head">
        <span className="ez-builder__field-label">Vorschau</span>
        {drawn === null ? null : (
          <span className={`ez-builder__fidelity ez-builder__fidelity--${drawn.fidelity}`} role="status">
            {FIDELITY_LABELS[drawn.fidelity]}
          </span>
        )}
        <div className="ez-builder__toggle" role="group" aria-label="Untergrund der Vorschau">
          {(
            [
              ['light', 'Weiß'],
              ['dark', 'Graphit'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={background === id ? 'ez-builder__toggle-button ez-builder__toggle-button--active' : 'ez-builder__toggle-button'}
              aria-pressed={background === id}
              onClick={() => setBackground(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {drawing !== null ? (
        <>
          <div className={`ez-canvas ez-canvas--${background} ez-builder__stage`}>
            <Einsatzzeichen drawing={drawing} idPrefix="ez-builder-stage" />
          </div>
          <div className="ez-builder__sizes">
            {PREVIEW_SIZES.map((size) => (
              <figure key={size} className={`ez-canvas ez-canvas--${background} ez-builder__mini`}>
                <Einsatzzeichen drawing={drawing} size={size} idPrefix={`ez-builder-s${size}`} />
                <figcaption className="ez-builder__size">{size} px</figcaption>
              </figure>
            ))}
          </div>
        </>
      ) : (
        <div className="ez-builder__stage ez-builder__stage--void" role="status">
          <p>Nicht zeichenbar — Einzelheiten unter der Vorschau.</p>
        </div>
      )}

      <div className="ez-builder__panel-actions">
        <button
          type="button"
          className="ez-action ez-builder__panel-action"
          disabled={drawing === null}
          onClick={() => {
            if (drawing !== null) downloadSvg(drawing);
          }}
        >
          <strong>SVG</strong>
        </button>
        <button
          type="button"
          className="ez-action ez-builder__panel-action"
          disabled={drawing === null}
          onClick={() => {
            if (drawing !== null) downloadPng(drawing);
          }}
        >
          <strong>PNG</strong>
        </button>
        <CopyButton label="Link kopieren" text={() => `${window.location.origin}${CLEAN_PATH}?${SPEC_PARAM}=${encodeSign(sign)}`} />
      </div>
      {note === null ? null : (
        <p
          className={note.tone === 'error' ? 'ez-builder__panel-note ez-builder__panel-note--error' : 'ez-builder__panel-note'}
          role={note.tone === 'error' ? 'alert' : 'status'}
        >
          {note.text}
        </p>
      )}
    </section>
  );
}

/* --- Fehlerblock für Renderfehler -------------------------------------------------------- */

interface BoundaryState {
  error: Error | null;
  stack: string | null;
}

/**
 * Fängt Fehler aus dem Rendern selbst. Verschluckt wird nichts: Meldung, Name und Stack stehen
 * sichtbar auf der Seite, dazu der Weg zum leeren Baukasten.
 */
class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  override state: BoundaryState = { error: null, stack: null };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return { error: error instanceof Error ? error : new Error(String(error)), stack: null };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    this.setState({ error: error instanceof Error ? error : new Error(String(error)), stack: info.componentStack ?? null });
  }

  override render(): ReactNode {
    const { error, stack } = this.state;
    if (error === null) return this.props.children;
    return (
      <div className="ez-note" role="alert">
        <p className="ez-note__title">Der Baukasten ist beim Zeichnen abgebrochen</p>
        <p>
          <a className="ez-action" href={CLEAN_PATH}>
            <strong>Baukasten neu und leer öffnen</strong>
          </a>
        </p>
        <details className="ez-builder__details">
          <summary>Technische Einzelheiten</summary>
          <pre className="ez-builder__pre">
            <code>
              {error.name}: {error.message}
              {error.stack === undefined ? '' : `\n\n${error.stack}`}
              {stack === null ? '' : `\n\nKomponenten:${stack}`}
            </code>
          </pre>
        </details>
      </div>
    );
  }
}

/* --- Ein unlesbarer Link ----------------------------------------------------------------- */

function linkErrorOf(error: unknown): string {
  if (error instanceof SpecParseError) return `${error.path}: ${error.reason}`;
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/* --- Geladenes Katalogzeichen ------------------------------------------------------------ */

function LoadedNote({ symbol }: { symbol: SymbolSummary }) {
  return (
    <div className="ez-note" role="note">
      <p className="ez-note__title">
        Geladen: {symbol.title} <span className="ez-id">{symbol.id}</span>
      </p>
      <StatusPair technical={symbol.review.technical} domain={symbol.review.domain} />
      {symbol.kind === 'catalog-entry' ? (
        <p>An der Vorlage vermessen; maßgeblich ist die Zeichnung auf der Seite des Zeichens.</p>
      ) : symbol.kind === 'typical' ? (
        <p>
          Typisches Einsatzmittel ohne Original, gebaut nach{' '}
          {(symbol.typical?.patterns ?? []).map((pattern) => `„${pattern.title}“ (${pattern.section})`).join(', ')}.
        </p>
      ) : symbol.kind === 'derived-place' ? (
        <p>Ort ohne eigenes Original, abgeleitet aus {symbol.derivedFrom?.title ?? 'der Leitstelle'}.</p>
      ) : null}
      <p>
        <a href={`/zeichen/${symbol.slug}/`}>Seite des Zeichens</a>
      </p>
    </div>
  );
}

/* --- Die Insel --------------------------------------------------------------------------- */

function BuilderForm({ symbols }: BuilderData) {
  const [sign, setSignState] = useState<Sign>(DEFAULT_SIGN);
  const [loadedId, setLoadedId] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [query, setQuery] = useState('');
  const lastWorking = useRef<Sign>(DEFAULT_SIGN);

  /** Jede Änderung aus dem Formular löst den Bezug zum geladenen Katalogzeichen. */
  function setSign(next: Sign) {
    setSignState(next);
    setLoadedId('');
    setUrlError(null);
  }

  // Erst nach der Hydration die URL lesen: SSR und erster Client-Render zeigen dasselbe Zeichen.
  useEffect(() => {
    setHydrated(true);
    const param = new URLSearchParams(window.location.search).get(SPEC_PARAM);
    if (param === null || param === '') return;
    try {
      setSignState(decodeSign(param));
    } catch (error) {
      setUrlError(linkErrorOf(error));
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return undefined;
    const timer = window.setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        params.set(SPEC_PARAM, encodeSign(sign));
        window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}${window.location.hash}`);
      } catch {
        // Bewusst geschluckt, und nur hier: eine nicht mitgeschriebene Adresszeile ist kein Fehler
        // des Zeichens; Vorschau, Formular und Code stimmen weiter.
      }
    }, URL_WRITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [sign, hydrated]);

  const outcome = useMemo(() => outcomeOf(sign), [sign]);
  useEffect(() => {
    if (outcome.state === 'ok') lastWorking.current = sign;
  }, [outcome, sign]);

  /**
   * Die Probe (`choices()` über sieben Felder) ist die einzige teure Ableitung und die einzige,
   * die niemand sofort braucht. Sie läuft deshalb aufgeschoben: Vorschau und Status folgen jedem
   * Tastenanschlag sofort, der Befund der übrigen Werte einen Render später.
   */
  const deferred = useDeferredValue(sign);
  const probeTarget: BodySign | undefined = isBodySign(deferred) ? deferred : isBodySign(sign) ? sign : undefined;
  const probe = useMemo(() => (probeTarget === undefined ? undefined : probeSign(probeTarget)), [probeTarget]);

  const loadedSymbol = useMemo(() => symbols.find((candidate) => candidate.id === loadedId), [symbols, loadedId]);
  const samples = useMemo(
    () => (loadedSymbol === undefined ? signCodeSamplesFor(sign, 'builder') : signCodeSamplesFor(sign, loadedSymbol.id)),
    [sign, loadedSymbol],
  );

  function loadFromCatalog(id: string) {
    const symbol = symbols.find((candidate) => candidate.id === id);
    if (symbol === undefined) return;
    setSignState(fromExact(symbol.spec));
    setLoadedId(id);
    setUrlError(null);
    setQuery('');
  }

  const drawn = outcome.state === 'ok' ? outcome.drawn : null;

  return (
    <div className="ez-builder">
      {urlError === null ? null : (
        <div className="ez-note" role="alert">
          <p className="ez-note__title">Der Link trug kein lesbares Zeichen</p>
          <details className="ez-builder__details">
            <summary>Technische Einzelheiten</summary>
            <pre className="ez-builder__pre">
              <code>{urlError}</code>
            </pre>
          </details>
        </div>
      )}

      <div className="ez-builder__layout">
        {/*
          Das Ergebnis steht im Markup vor dem Formular und rückt auf breiten Schirmen per Grid nach
          rechts: auf schmalen Schirmen ist jede Änderung ohne Scrollen sichtbar.
        */}
        <aside className="ez-builder__result">
          <PreviewPanel outcome={outcome} sign={sign} fileBase={loadedSymbol?.slug ?? 'einsatzzeichen'} />
          {drawn === null ? null : <StatusNote drawn={drawn} />}
          {outcome.state === 'crash' ? (
            <div className="ez-note" role="alert">
              <p className="ez-note__title">Dieses Zeichen ließ sich nicht zeichnen</p>
              <p className="ez-builder__issue-message">{outcome.error.message}</p>
              <details className="ez-builder__details">
                <summary>Technische Einzelheiten</summary>
                <pre className="ez-builder__pre">
                  <code>
                    {outcome.error.name}: {outcome.error.message}
                    {outcome.error.stack === undefined ? '' : `\n\n${outcome.error.stack}`}
                  </code>
                </pre>
              </details>
              <button type="button" className="ez-action" onClick={() => setSignState(lastWorking.current)}>
                <strong>Letzte Änderung zurücknehmen</strong>
              </button>
            </div>
          ) : null}
          {loadedSymbol === undefined ? null : <LoadedNote symbol={loadedSymbol} />}
          <section className="ez-builder__panel" aria-label="Code">
            <span className="ez-builder__field-label">Code</span>
            <CodeTabs samples={samples} />
          </section>
        </aside>

        <div className="ez-builder__form">
          <SearchSection
            symbols={symbols}
            query={query}
            onQuery={setQuery}
            onLoad={loadFromCatalog}
            onRandom={() => {
              const symbol = symbols[Math.floor(Math.random() * symbols.length)];
              if (symbol !== undefined) loadFromCatalog(symbol.id);
            }}
            onReset={() => {
              setSign(DEFAULT_SIGN);
              setQuery('');
            }}
          />
          <FamilySection sign={sign} onKind={(kind) => setSign(changeKind(sign, kind))} />
          {isBodySign(sign) ? (
            <BodySections
              sign={sign}
              probeTarget={probeTarget ?? sign}
              probe={probe}
              omitted={drawn?.omitted ?? []}
              onChange={setSign}
            />
          ) : (
            <FreestandingSections spec={sign} onChange={setSign} />
          )}
          <ExpertSection sign={sign} drawn={drawn} onChange={setSign} />
        </div>
      </div>

      <BuilderStyle />
    </div>
  );
}

/* --- Laden, Fehler, geladen -------------------------------------------------------------- */

function GateStyle() {
  return (
    <style>{`
      .ez-builder-gate__loading {
        margin-block: var(--ez-space-6);
        font-family: var(--ez-font-mono);
        font-size: var(--sl-text-sm);
        color: var(--sl-color-gray-2);
      }
      .ez-builder-gate__reason {
        font-family: var(--ez-font-mono);
        font-size: var(--sl-text-2xs);
        color: var(--sl-color-white);
        overflow-wrap: anywhere;
      }
      button.ez-builder-gate__retry {
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
 * Der Vorbau vor dem Formular (LFH-500): der Katalog kommt zur Laufzeit. Der Fehlerzustand nennt
 * den Grund wörtlich; der Knopf lädt neu, und das Zeichen in der Adresszeile überlebt das.
 */
function BuilderGate() {
  const state = useSnapshot(selectBuilderData);

  if (state.status === 'failed') {
    return (
      <div className="ez-builder-gate">
        <div className="ez-note" role="alert">
          <p className="ez-note__title">Der Baukasten hat keinen Katalog bekommen</p>
          <p className="ez-builder-gate__reason">{state.message}</p>
          <p>
            <button type="button" className="ez-action ez-builder-gate__retry" onClick={() => window.location.reload()}>
              <strong>Erneut versuchen</strong>
            </button>
          </p>
        </div>
        <GateStyle />
      </div>
    );
  }

  if (state.status === 'loading') {
    return (
      <div className="ez-builder-gate">
        <p className="ez-builder-gate__loading" role="status">
          Der Katalog wird geladen …
        </p>
        <GateStyle />
      </div>
    );
  }

  return <BuilderForm symbols={state.data.symbols} />;
}

export default function Builder() {
  return (
    <ErrorBoundary>
      <BuilderGate />
    </ErrorBoundary>
  );
}

/* --- Stile ------------------------------------------------------------------------------- */

function BuilderStyle() {
  return <style>{BUILDER_CSS}</style>;
}

const BUILDER_CSS = `
.ez-builder__layout {
  display: grid;
  gap: var(--ez-space-6);
  align-items: start;
  margin-block: var(--ez-space-6);
}
.ez-builder__form,
.ez-builder__result {
  display: grid;
  gap: var(--ez-space-4);
  min-width: 0;
}
.ez-builder__result .ez-note {
  margin-block: 0;
}
@media (min-width: 64rem) {
  .ez-builder__layout {
    grid-template-columns: minmax(0, 1fr) clamp(22rem, 36vw, 30rem);
  }
  .ez-builder__form {
    order: -1;
  }
  /* Die Vorschau klebt und scrollt bei Überlänge in sich: sie soll beim Einstellen sichtbar bleiben. */
  .ez-builder__result {
    position: sticky;
    inset-block-start: 4.5rem;
    max-height: calc(100vh - 5.5rem);
    overflow-y: auto;
    overscroll-behavior: contain;
    padding-inline-end: var(--ez-space-1);
  }
}

/* --- Abschnitte --- */
.ez-builder__group {
  margin: 0;
  padding: var(--ez-space-4);
  border: 1px solid var(--ez-line);
  border-radius: var(--ez-radius);
  background: var(--ez-surface);
  display: grid;
  gap: var(--ez-space-3);
  min-width: 0;
}
.ez-builder__group-title {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--ez-space-1) var(--ez-space-3);
  font-size: var(--sl-text-base);
  line-height: 1.3;
  letter-spacing: -0.018em;
  color: var(--sl-color-white);
}
.ez-builder__group-summary {
  font-size: var(--sl-text-sm);
  font-weight: 400;
  letter-spacing: 0;
  color: var(--sl-color-gray-2);
}
.ez-builder__group-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(13rem, 1fr));
  gap: var(--ez-space-3) var(--ez-space-4);
}
.ez-builder__group-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ez-space-3);
  align-items: center;
}
.ez-builder__field {
  display: flex;
  flex-direction: column;
  gap: var(--ez-space-1);
  min-width: 0;
}
.ez-builder__field-label {
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-2xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sl-color-gray-3);
}
.ez-builder__field-hint {
  margin: 0;
  font-size: var(--sl-text-2xs);
  color: var(--sl-color-gray-3);
  max-width: 34rem;
}
.ez-builder__field-issue {
  margin: 0;
  font-size: var(--sl-text-2xs);
  color: var(--sl-color-white);
  max-width: 34rem;
  border-inline-start: 2px solid var(--sl-color-accent);
  padding-inline-start: var(--ez-space-2);
}
.ez-builder input,
.ez-builder select,
.ez-builder textarea {
  font: inherit;
  font-size: var(--sl-text-sm);
  padding: var(--ez-space-2) var(--ez-space-3);
  border: 1px solid var(--sl-color-hairline);
  border-radius: var(--ez-radius);
  background: transparent;
  color: var(--sl-color-white);
  min-width: 0;
}
.ez-builder select option,
.ez-builder select optgroup {
  background: var(--sl-color-black);
  color: var(--sl-color-white);
}
/* Auf Touch-Geräten mindestens 16px, sonst zoomt iOS beim Fokussieren hinein. */
@media (pointer: coarse) {
  .ez-builder input,
  .ez-builder select,
  .ez-builder textarea {
    font-size: max(var(--sl-text-base), 16px);
  }
}

/* --- Suche --- */
.ez-builder__search-label {
  font-size: var(--sl-text-lg);
  font-weight: 600;
  color: var(--sl-color-white);
}
.ez-builder__search input {
  font-size: var(--sl-text-base);
  padding: var(--ez-space-3);
  min-height: 3rem;
}
.ez-builder__matches {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: var(--ez-space-1);
}
.ez-builder__match {
  width: 100%;
  display: flex;
  align-items: center;
  gap: var(--ez-space-3);
  padding: var(--ez-space-1) var(--ez-space-3) var(--ez-space-1) var(--ez-space-1);
  border: 1px solid var(--ez-line);
  border-radius: var(--ez-radius);
  background: transparent;
  color: var(--sl-color-white);
  font: inherit;
  font-size: var(--sl-text-sm);
  text-align: start;
  cursor: pointer;
  transition: border-color 120ms ease;
}
.ez-builder__match:hover {
  border-color: var(--sl-color-accent);
}
.ez-builder__match-title {
  flex: 1;
  min-width: 0;
}

/* --- Familien --- */
.ez-builder__families {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(12rem, 1fr));
  gap: var(--ez-space-2);
}
.ez-builder__family {
  display: flex;
  align-items: center;
  gap: var(--ez-space-3);
  min-width: 0;
  min-height: 3.5rem;
  padding: var(--ez-space-2);
  border: 1px solid var(--ez-line);
  border-radius: var(--ez-radius);
  background: transparent;
  color: var(--sl-color-gray-1);
  font: inherit;
  text-align: start;
  cursor: pointer;
  transition: border-color 120ms ease;
}
.ez-builder__family:hover {
  border-color: var(--sl-color-accent);
}
.ez-builder__family--on {
  border-color: var(--sl-color-accent);
  box-shadow: inset 0 0 0 1px var(--sl-color-accent);
  color: var(--sl-color-white);
}
.ez-builder__family-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.ez-builder__family-label {
  font-weight: 600;
  font-size: var(--sl-text-sm);
}
.ez-builder__family-hint {
  font-size: var(--sl-text-2xs);
  color: var(--sl-color-gray-3);
  overflow-wrap: anywhere;
}
.ez-builder__mini-canvas {
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--ez-radius);
  padding: 4px;
  box-sizing: border-box;
}
.ez-builder__tile-placeholder {
  width: 70%;
  height: 70%;
  border: 1px dashed currentColor;
  border-radius: var(--ez-radius);
  opacity: 0.5;
}

/* --- Knöpfe einer Auswahl --- */
.ez-builder__chips-field {
  display: grid;
  gap: var(--ez-space-2);
  min-width: 0;
}
.ez-builder__chip-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ez-space-2);
}
.ez-builder__chip-groups {
  display: grid;
  gap: var(--ez-space-3);
}
.ez-builder__chip-group {
  display: grid;
  gap: var(--ez-space-1);
}
.ez-builder__chip-group-label {
  font-size: var(--sl-text-2xs);
  color: var(--sl-color-gray-3);
}
.ez-builder__chip-option {
  display: inline-flex;
  align-items: center;
  gap: 0.5em;
  min-height: 2.75rem;
  padding: 0.3em 0.75em;
  border: 1px solid var(--ez-line);
  border-radius: var(--ez-radius);
  background: transparent;
  color: var(--sl-color-gray-1);
  font: inherit;
  font-size: var(--sl-text-sm);
  text-align: start;
  cursor: pointer;
  transition: border-color 120ms ease;
}
.ez-builder__chip-option:hover {
  border-color: var(--sl-color-accent);
}
.ez-builder__chip-option--on {
  border-color: var(--sl-color-accent);
  box-shadow: inset 0 0 0 1px var(--sl-color-accent);
  color: var(--sl-color-white);
}
.ez-builder__segments {
  display: flex;
  flex-wrap: wrap;
  width: fit-content;
  max-width: 100%;
  border: 1px solid var(--ez-line);
  border-radius: var(--ez-radius);
  overflow: hidden;
}
.ez-builder__segments .ez-builder__chip-option {
  border: 0;
  border-radius: 0;
  border-inline-end: 1px solid var(--ez-line);
}
.ez-builder__segments .ez-builder__chip-option:last-child {
  border-inline-end: 0;
}
.ez-builder__segments .ez-builder__chip-option--on {
  background: var(--sl-color-accent);
  color: var(--sl-color-black);
  box-shadow: none;
}
.ez-builder__swatch {
  flex: none;
  width: 0.95em;
  height: 0.95em;
  border: 1px solid var(--sl-color-gray-3);
  border-radius: 2px;
}
.ez-builder__swatch--none {
  border-style: dashed;
  background: transparent;
}
.ez-builder__missing {
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-2xs);
  letter-spacing: 0.04em;
  padding: 0 0.4em;
  border: 1px dashed var(--sl-color-gray-3);
  border-radius: var(--ez-radius);
  color: var(--sl-color-gray-2);
}
.ez-builder__blocked > summary,
.ez-builder__details > summary,
.ez-builder__more {
  cursor: pointer;
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-2xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sl-color-gray-3);
}
.ez-builder__more {
  justify-self: start;
  padding: 0;
  border: 0;
  background: transparent;
  text-decoration: underline;
}
.ez-builder__blocked ul {
  margin: var(--ez-space-2) 0 0;
  padding-inline-start: 1.2em;
  font-size: var(--sl-text-2xs);
  color: var(--sl-color-gray-2);
  display: grid;
  gap: var(--ez-space-1);
}
.ez-builder__details[open] > summary {
  margin-block-end: var(--ez-space-3);
}

/* --- Fachaufgaben --- */
.ez-builder__task-tiles {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(8.5rem, 1fr));
  gap: var(--ez-space-2);
}
.ez-builder__task {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--ez-space-1);
  min-width: 0;
  padding: var(--ez-space-2);
  border: 1px solid var(--ez-line);
  border-radius: var(--ez-radius);
  background: transparent;
  color: var(--sl-color-gray-1);
  font: inherit;
  font-size: var(--sl-text-2xs);
  line-height: 1.35;
  text-align: center;
  hyphens: auto;
  overflow-wrap: anywhere;
  cursor: pointer;
  transition: border-color 120ms ease;
}
.ez-builder__task:hover {
  border-color: var(--sl-color-accent);
}
.ez-builder__chips {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: var(--ez-space-2);
  margin: 0;
  padding: 0;
}
.ez-builder__chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4em;
  min-height: 2.25rem;
  padding: 0.2em 0.6em;
  border: 1px solid var(--sl-color-accent);
  border-radius: var(--ez-radius);
  background: transparent;
  color: var(--sl-color-white);
  font: inherit;
  font-size: var(--sl-text-sm);
  cursor: pointer;
}
.ez-builder__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

/* --- Experte --- */
.ez-builder__expert {
  border: 1px dashed var(--sl-color-gray-4);
  border-radius: var(--ez-radius);
  background: var(--ez-surface);
}
.ez-builder__expert > summary {
  cursor: pointer;
  padding: var(--ez-space-3) var(--ez-space-4);
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-sm);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--sl-color-white);
}
.ez-builder__expert-body {
  display: grid;
  gap: var(--ez-space-4);
  padding: var(--ez-space-4);
  border-block-start: 1px solid var(--ez-line);
}
.ez-builder__json {
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-xs);
  line-height: 1.5;
  resize: vertical;
  background: var(--sl-color-black);
}

/* --- Ergebnis --- */
.ez-builder__panel {
  display: grid;
  gap: var(--ez-space-3);
  padding: var(--ez-space-4);
  border: 1px solid var(--ez-line);
  border-radius: var(--ez-radius);
  background: var(--ez-surface);
  min-width: 0;
}
.ez-builder__panel-head {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ez-space-2) var(--ez-space-3);
}
.ez-builder__panel-head .ez-builder__toggle {
  margin-inline-start: auto;
}
.ez-builder__fidelity {
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-2xs);
  letter-spacing: 0.04em;
  padding: 0.2em 0.6em;
  border-radius: var(--ez-radius);
  border: 1px solid currentColor;
}
.ez-builder__fidelity--measured {
  color: hsl(140, 45%, 62%);
}
.ez-builder__fidelity--derived {
  color: hsl(32, 85%, 64%);
}
.ez-builder__fidelity--simplified {
  color: hsl(212, 80%, 72%);
  border-style: dashed;
}
:root[data-theme='light'] .ez-builder__fidelity--measured {
  color: hsl(140, 60%, 24%);
}
:root[data-theme='light'] .ez-builder__fidelity--derived {
  color: hsl(24, 80%, 32%);
}
:root[data-theme='light'] .ez-builder__fidelity--simplified {
  color: hsl(220, 70%, 36%);
}
.ez-builder__omitted ul {
  margin: 0;
  padding-inline-start: 1.2em;
  font-size: var(--sl-text-sm);
  display: grid;
  gap: var(--ez-space-1);
}
.ez-builder__toggle {
  display: inline-flex;
  gap: var(--ez-space-1);
}
.ez-builder__toggle-button {
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-2xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.35em 0.7em;
  border: 1px solid var(--sl-color-hairline);
  border-radius: var(--ez-radius);
  background: transparent;
  color: var(--sl-color-gray-2);
  cursor: pointer;
}
.ez-builder__toggle-button:hover,
.ez-builder__toggle-button--active {
  border-color: var(--sl-color-accent);
  color: var(--sl-color-white);
}
.ez-builder__stage {
  min-height: 15rem;
  padding: var(--ez-space-6);
}
.ez-builder__stage svg {
  width: min(100%, 19rem);
}
.ez-builder__stage--void {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed var(--ez-line);
  border-radius: var(--ez-radius);
  text-align: center;
}
.ez-builder__stage--void p {
  margin: 0;
  font-size: var(--sl-text-sm);
  color: var(--sl-color-gray-2);
  max-width: 28ch;
}
.ez-builder__sizes {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--ez-space-2);
}
.ez-builder__mini {
  flex-direction: column;
  gap: var(--ez-space-2);
  margin: 0;
  padding: var(--ez-space-3);
}
.ez-builder__size {
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-2xs);
  font-variant-numeric: tabular-nums;
  color: currentColor;
  opacity: 0.7;
}
.ez-builder__panel-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ez-space-2);
  align-items: center;
}
/* .ez-action ist in theme.css für Verweise gebaut; als Knopf braucht es die Grundwerte. */
.ez-builder button.ez-action {
  font: inherit;
  background: transparent;
  color: var(--sl-color-white);
  cursor: pointer;
  text-align: start;
}
.ez-builder button.ez-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ez-builder__panel-note {
  margin: 0;
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-2xs);
  color: var(--sl-color-gray-3);
}
.ez-builder__panel-note--error {
  color: var(--sl-color-white);
  border-inline-start: 3px solid var(--sl-color-accent);
  padding-inline-start: var(--ez-space-2);
}
.ez-builder__issue-message {
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-2xs);
  color: var(--sl-color-gray-2);
  margin-block: var(--ez-space-2) var(--ez-space-1);
}
.ez-builder__derived-list {
  margin: 0;
  padding-inline-start: 1.2em;
  font-size: var(--sl-text-2xs);
  color: var(--sl-color-gray-2);
}
/* Die Seite steht außerhalb von Starlight; Code bekommt deshalb eigene Grundwerte. */
/* Ein Rasterkind wächst sonst mit der längsten Codezeile über das Panel hinaus. */
.ez-builder__code,
.ez-builder__code > [role='tabpanel'] {
  min-width: 0;
}
.ez-builder__pre {
  max-width: 100%;
  max-height: 26rem;
  overflow: auto;
  font-size: var(--sl-text-xs);
  font-family: var(--ez-font-mono);
  margin: 0 0 var(--ez-space-2);
  padding: var(--ez-space-3);
  border: 1px solid var(--ez-line);
  border-radius: var(--ez-radius);
  background: var(--sl-color-black);
  color: var(--sl-color-white);
}

/* --- Codebeispiele --- */
.ez-builder__tabs {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ez-space-2);
  margin-block-end: var(--ez-space-2);
}
.ez-builder__tab {
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-2xs);
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 0.35em 0.7em;
  border: 1px solid var(--sl-color-hairline);
  border-radius: var(--ez-radius);
  background: transparent;
  color: var(--sl-color-gray-2);
  cursor: pointer;
}
.ez-builder__tab--active {
  border-color: var(--sl-color-accent);
  color: var(--sl-color-white);
}
.ez-builder__copy {
  display: inline-flex;
  align-items: center;
  gap: var(--ez-space-3);
}
.ez-builder__copy-note {
  font-family: var(--ez-font-mono);
  font-size: var(--sl-text-2xs);
  color: var(--sl-color-gray-3);
}

/* --- Fokus und Bewegung --- */
.ez-builder button:focus-visible,
.ez-builder select:focus-visible,
.ez-builder input:focus-visible,
.ez-builder textarea:focus-visible,
.ez-builder summary:focus-visible,
.ez-builder a:focus-visible {
  outline: 2px solid var(--sl-color-accent);
  outline-offset: 2px;
}
@media (prefers-reduced-motion: reduce) {
  .ez-builder__family,
  .ez-builder__chip-option,
  .ez-builder__task,
  .ez-builder__match {
    transition: none;
  }
}
`;
