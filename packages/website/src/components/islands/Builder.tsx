import {
  Component,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { Einsatzzeichen } from '@einsatzzeichen/react';
import type { Drawing, SymbolSpec } from '@einsatzzeichen/schema';
import type { ValidationIssue } from '@einsatzzeichen/core';
import { codeSamplesFor, type CodeSamples } from '../../lib/code-samples.js';
import { decodeSpec, encodeSpec, evaluateSpec, reduceSpec } from '../../lib/builder-state.js';
import { loadSnapshot, type SymbolSummary } from '../../lib/snapshot.js';
import type { ExplainedIssue } from '../../lib/rule-explanations.js';
import StatusPair from '../StatusPair.js';

/**
 * Der Builder (Spec §5.4). Er setzt eine `SymbolSpec` zusammen, komponiert sie im Browser und
 * erklärt jede abgelehnte Kombination in Klarsprache statt nur die Regelkennung zu zeigen.
 *
 * Drei Ergebniszustände, und jeder hat seine eigene Darstellung (Spec §7):
 * `ok` → Vorschau, JSON, Codebeispiele. `invalid` → erklärte Regelliste. `crash` → sichtbarer
 * Fehlerblock mit Meldung und Stack. Der Fehlerblock nimmt die Insel **nicht** aus dem Betrieb:
 * das Formular bleibt bedienbar, und ein Knopf nimmt die letzte Änderung zurück. Ein Fehler beim
 * Rendern selbst — den der Zustand nicht abfangen kann — landet in der `ErrorBoundary` darunter.
 *
 * Die Daten kommen aus dem Snapshot (`snapshot.builder` für die erlaubten Werte,
 * `snapshot.symbols` für „Aus dem Katalog laden"), nie aus dem Katalog-Index: der zöge `node:url`
 * ins Browserbündel (Spec §5.2).
 */

const snapshot = loadSnapshot();
const VOCABULARY = snapshot.builder;
const SYMBOLS: SymbolSummary[] = snapshot.symbols;

/** Startspec: das kleinste, was komponiert — eine taktische Formation ohne jede Zutat. */
const DEFAULT_SPEC: SymbolSpec = { kind: 'formation' };

const SPEC_PARAM = 'spec';

interface FieldDefinition {
  field: keyof SymbolSpec;
  label: string;
  /** Kurzer Hinweis unter dem Feld; nur dort, wo der Feldname allein irreführt. */
  hint?: string;
}

/**
 * Die Auswahlfelder in der Reihenfolge, in der sie am Zeichen von innen nach außen wirken:
 * erst der Körper, dann seine Füllung, dann Kopf- und Fußzonen.
 *
 * Nur Achsen, die `SymbolSpec` wirklich führt. Der Snapshot bringt darüber hinaus die
 * Piktogrammregister `states`, `comms`, `damage` und `wildfire` mit — die sind Register, keine
 * Spec-Achsen (`taxonomy.ts`), und ein Formularfeld dafür behauptete ein Feld, das es nicht gibt.
 */
const SELECT_FIELDS: FieldDefinition[] = [
  { field: 'kind', label: 'Grundzeichenart' },
  { field: 'bodyVariant', label: 'Körpervariante' },
  { field: 'organization', label: 'Organisation' },
  {
    field: 'technicalFill',
    label: 'Technische Füllung',
    hint: 'Schließt eine Organisation aus — die Regel dazu steht unten, sobald beides gesetzt ist.',
  },
  { field: 'strength', label: 'Stärke' },
  { field: 'functionRole', label: 'Funktionsfassung' },
  { field: 'administrativeLevel', label: 'Verwaltungsstufe' },
  { field: 'technicalHeadMark', label: 'Technische Kopfmarke' },
  { field: 'vehicleCategory', label: 'Fahrzeugkategorie' },
];

const LIST_FIELDS: FieldDefinition[] = [
  { field: 'capabilities', label: 'Fähigkeiten (Piktogramme in der Standardbox)' },
  { field: 'bodyMarks', label: 'Körpermarken (randbündig über die Körperfläche)' },
];

/** Die drei Ergebniszustände einer Spec, wie die Insel sie darstellt. */
type BuilderOutcome =
  | { state: 'ok'; drawing: Drawing }
  | { state: 'invalid'; issues: ExplainedIssue[]; unexplained: ValidationIssue[] }
  | { state: 'crash'; error: Error };

function outcomeOf(spec: SymbolSpec): BuilderOutcome {
  try {
    const result = evaluateSpec(spec);
    return result.ok
      ? { state: 'ok', drawing: result.drawing }
      : { state: 'invalid', issues: result.issues, unexplained: result.unexplained };
  } catch (error) {
    return { state: 'crash', error: error instanceof Error ? error : new Error(String(error)) };
  }
}

function labelFor(field: keyof SymbolSpec, id: string): string {
  return VOCABULARY[field]?.find((entry) => entry.id === id)?.label ?? id;
}

/* --- Bausteine ---------------------------------------------------------------------------- */

interface SelectFieldProps {
  definition: FieldDefinition;
  value: string;
  onChange: (value: string | undefined) => void;
}

function SelectField({ definition, value, onChange }: SelectFieldProps) {
  const id = `ez-builder-${definition.field}`;
  const options = VOCABULARY[definition.field] ?? [];
  const required = definition.field === 'kind';
  return (
    <label className="ez-builder__field" htmlFor={id}>
      <span className="ez-builder__field-label">{definition.label}</span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value === '' ? undefined : event.target.value)}
      >
        {required ? null : <option value="">— nicht gesetzt —</option>}
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {definition.hint === undefined ? null : (
        <span className="ez-builder__field-hint">{definition.hint}</span>
      )}
    </label>
  );
}

interface ListFieldProps {
  definition: FieldDefinition;
  values: readonly string[];
  onChange: (values: string[]) => void;
}

/**
 * Mehrfachauswahl als „hinzufügen"-Liste plus abwählbare Marken. Ein `<select multiple>` über 88
 * Fähigkeiten wäre mit Strg-Klick zu bedienen und sonst nicht; hier reicht ein Klick je Richtung.
 */
function ListField({ definition, values, onChange }: ListFieldProps) {
  const id = `ez-builder-${definition.field}`;
  const options = (VOCABULARY[definition.field] ?? []).filter(
    (option) => !values.includes(option.id),
  );
  return (
    <div className="ez-builder__field ez-builder__field--wide">
      <label className="ez-builder__field-label" htmlFor={id}>
        {definition.label}
      </label>
      <select
        id={id}
        value=""
        onChange={(event) => {
          if (event.target.value !== '') onChange([...values, event.target.value]);
        }}
      >
        <option value="">— hinzufügen —</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      {values.length === 0 ? null : (
        <ul className="ez-builder__chips">
          {values.map((value) => (
            <li key={value}>
              <button
                type="button"
                className="ez-builder__chip"
                onClick={() => onChange(values.filter((entry) => entry !== value))}
              >
                <span>{labelFor(definition.field, value)}</span>
                <span aria-hidden="true">×</span>
                <span className="ez-builder__sr">entfernen</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface CopyButtonProps {
  text: string;
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
          // Kein stiller Fehlschlag: `navigator.clipboard` fehlt in unsicheren Kontexten ganz
          // (wirft dann synchron) und lehnt sonst ohne Recht ab. Beide Wege enden am Knopf.
          const failed = (error: unknown) =>
            setNote(`nicht kopiert: ${error instanceof Error ? error.message : String(error)}`);
          try {
            void navigator.clipboard.writeText(text).then(() => setNote('kopiert'), failed);
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
            className={
              active === tab.key ? 'ez-builder__tab ez-builder__tab--active' : 'ez-builder__tab'
            }
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        role="tabpanel"
        id={`ez-builder-panel-${active}`}
        aria-labelledby={`ez-builder-tab-${active}`}
      >
        <pre className="ez-builder__pre">
          <code>{samples[active]}</code>
        </pre>
        <CopyButton text={samples[active]} label="Beispiel kopieren" />
      </div>
    </div>
  );
}

const PREVIEW_SIZES = [32, 64, 128];

function Preview({ drawing }: { drawing: Drawing }) {
  return (
    <div className="ez-builder__previews">
      {(['light', 'dark'] as const).map((background) => (
        <div key={background} className="ez-builder__preview-row">
          <span className="ez-builder__field-label">
            {background === 'light' ? 'Auf Weiß (Referenzuntergrund)' : 'Auf Graphit'}
          </span>
          <div className="ez-canvas-pair">
            {PREVIEW_SIZES.map((size) => (
              <figure key={size} className={`ez-canvas ez-canvas--${background}`}>
                <Einsatzzeichen
                  drawing={drawing}
                  size={size}
                  idPrefix={`ez-builder-${background}-${size}`}
                />
                <figcaption className="ez-builder__size">{size} px</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* --- Fehlerblock für Renderfehler --------------------------------------------------------- */

interface BoundaryState {
  error: Error | null;
  stack: string | null;
}

/**
 * Fängt Fehler aus dem Rendern selbst. Was `evaluateSpec` wirft, fängt die Insel schon vorher —
 * hier landet, was danach schiefgeht (etwa `renderSvg` an einer Zeichnung, die komponiert, aber
 * nicht rendert). Verschluckt wird nichts: Meldung, Name und Stack stehen sichtbar auf der Seite.
 */
class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  override state: BoundaryState = { error: null, stack: null };

  static getDerivedStateFromError(error: unknown): BoundaryState {
    return {
      error: error instanceof Error ? error : new Error(String(error)),
      stack: null,
    };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    this.setState({
      error: error instanceof Error ? error : new Error(String(error)),
      stack: info.componentStack ?? null,
    });
  }

  override render(): ReactNode {
    const { error, stack } = this.state;
    if (error === null) return this.props.children;
    return (
      <div className="ez-note" role="alert">
        <p className="ez-note__title">Der Builder ist beim Zeichnen abgebrochen</p>
        <p>
          Das ist ein Fehler im Builder, keine abgelehnte Kombination. Lade die Seite neu; wenn er
          wiederkommt, gehört die Meldung unten in eine Fehlermeldung zum Projekt.
        </p>
        <pre className="ez-builder__pre">
          <code>
            {error.name}: {error.message}
            {error.stack === undefined ? '' : `\n\n${error.stack}`}
            {stack === null ? '' : `\n\nKomponenten:${stack}`}
          </code>
        </pre>
      </div>
    );
  }
}

/* --- Die Insel ---------------------------------------------------------------------------- */

function BuilderForm() {
  const [spec, setSpec] = useState<SymbolSpec>(DEFAULT_SPEC);
  const [loadedId, setLoadedId] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const lastWorkingSpec = useRef<SymbolSpec>(DEFAULT_SPEC);

  // Erst nach der Hydration die URL lesen: SSR und erster Client-Render zeigen dieselbe
  // Startspec, sonst weicht das Markup ab, sobald die URL einen `spec`-Parameter trägt.
  useEffect(() => {
    setHydrated(true);
    const param = new URLSearchParams(window.location.search).get(SPEC_PARAM);
    if (param === null || param === '') return;
    try {
      setSpec(decodeSpec(param));
    } catch (error) {
      setUrlError(error instanceof Error ? error.message : String(error));
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    params.set(SPEC_PARAM, encodeSpec(spec));
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}?${params.toString()}${window.location.hash}`,
    );
  }, [spec, hydrated]);

  const outcome = useMemo(() => outcomeOf(spec), [spec]);

  useEffect(() => {
    if (outcome.state !== 'crash') lastWorkingSpec.current = spec;
  }, [outcome, spec]);

  const loadedSymbol = useMemo(
    () => SYMBOLS.find((symbol) => symbol.id === loadedId),
    [loadedId],
  );
  const samples = useMemo(
    () => codeSamplesFor(spec, loadedId === '' ? 'builder-spec' : loadedId),
    [spec, loadedId],
  );
  const json = useMemo(() => JSON.stringify(spec, null, 2), [spec]);

  function setField(field: keyof SymbolSpec, value: unknown) {
    setSpec((current) => reduceSpec(current, { field, value }));
    setLoadedId('');
  }

  function loadFromCatalog(id: string) {
    // Die leere Auswahl löst nur den Bezug zum Katalogeintrag; die Spec bleibt stehen, damit
    // niemand seine Arbeit verliert, weil er das Auswahlfeld zurückstellt.
    if (id === '') {
      setLoadedId('');
      return;
    }
    const symbol = SYMBOLS.find((candidate) => candidate.id === id);
    if (symbol === undefined) return;
    setSpec(symbol.spec);
    setLoadedId(id);
    setUrlError(null);
  }

  const listValues = (field: keyof SymbolSpec): readonly string[] => {
    const value = spec[field];
    return Array.isArray(value) ? (value as readonly string[]) : [];
  };

  return (
    <div className="ez-builder">
      <div className="ez-note" role="note">
        <p className="ez-note__title">Ein Zeichen aus dem Builder ist nicht fachlich geprüft</p>
        <p>
          Grün heißt hier: die Komposition hat keine Regel verletzt. Es heißt nicht, dass die
          Bedeutungskombination fachlich belegt ist — ein fachliches Review gibt es nur für die
          Zeichen im Katalog, und deren Stand steht auf jeder Symbolseite.
        </p>
      </div>

      {urlError === null ? null : (
        <div className="ez-note" role="alert">
          <p className="ez-note__title">Der Link trug keine lesbare Spec</p>
          <p>{urlError}</p>
          <p>Der Builder steht deshalb auf der Startspec.</p>
        </div>
      )}

      <div className="ez-builder__controls">
        <div className="ez-builder__field ez-builder__field--wide">
          <label className="ez-builder__field-label" htmlFor="ez-builder-load">
            Aus dem Katalog laden
          </label>
          <select
            id="ez-builder-load"
            value={loadedId}
            onChange={(event) => loadFromCatalog(event.target.value)}
          >
            <option value="">— eigene Spec —</option>
            {SYMBOLS.map((symbol) => (
              <option key={symbol.id} value={symbol.id}>
                {symbol.id} · {symbol.title}
              </option>
            ))}
          </select>
        </div>
        {SELECT_FIELDS.map((definition) => (
          <SelectField
            key={definition.field}
            definition={definition}
            value={(spec[definition.field] as string | undefined) ?? ''}
            onChange={(value) => setField(definition.field, value)}
          />
        ))}
        <label className="ez-builder__field ez-builder__field--wide" htmlFor="ez-builder-designation">
          <span className="ez-builder__field-label">Beschriftung (Fußzone)</span>
          <input
            id="ez-builder-designation"
            type="text"
            value={spec.designation ?? ''}
            onChange={(event) => setField('designation', event.target.value)}
          />
        </label>
        {LIST_FIELDS.map((definition) => (
          <ListField
            key={definition.field}
            definition={definition}
            values={listValues(definition.field)}
            onChange={(values) => setField(definition.field, values)}
          />
        ))}
      </div>

      <div className="ez-builder__actions">
        <button
          type="button"
          className="ez-action"
          onClick={() => {
            setSpec(DEFAULT_SPEC);
            setLoadedId('');
            setUrlError(null);
          }}
        >
          <strong>Auf die Startspec zurücksetzen</strong>
        </button>
      </div>

      {loadedSymbol === undefined ? null : (
        <div className="ez-note" role="note">
          <p className="ez-note__title">
            Geladen: {loadedSymbol.title} <span className="ez-id">{loadedSymbol.id}</span>
          </p>
          <StatusPair
            technical={loadedSymbol.review.technical}
            domain={loadedSymbol.review.domain}
          />
          {loadedSymbol.kind === 'catalog-entry' ? (
            <p>
              Das ist ein Katalogeintrag. Seine Zeichnung im Katalog stammt aus der vermessenen
              Darstellung; die Spec hier ist dazu die Rekonstruktion. Die Vorschau unten zeigt, was
              die Komposition aus dieser Spec macht — das kann von der Katalogzeichnung abweichen.
              Maßgeblich ist die Zeichnung auf der Symbolseite.
            </p>
          ) : (
            <p>
              Das ist ein Kompositionsrezept. Die Vorschau unten entsteht aus derselben Spec, die
              der Katalog führt — sie ist damit dasselbe Bild, nicht eine Annäherung.
            </p>
          )}
        </div>
      )}

      {outcome.state === 'ok' ? <Preview drawing={outcome.drawing} /> : null}

      {outcome.state === 'invalid' ? (
        <section className="ez-builder__issues">
          <h3>
            {outcome.issues.length + outcome.unexplained.length === 1
              ? 'Eine Regel steht dieser Kombination entgegen'
              : `${outcome.issues.length + outcome.unexplained.length} Regeln stehen dieser Kombination entgegen`}
          </h3>
          <ul className="ez-builder__issue-list">
            {outcome.issues.map((issue, index) => (
              <li key={`${issue.rule}-${index}`} className="ez-card ez-builder__issue">
                <p className="ez-card__title">{issue.title}</p>
                <p className="ez-card__text">{issue.explanation}</p>
                <p className="ez-builder__issue-message">{issue.message}</p>
                <p className="ez-id">{issue.rule}</p>
              </li>
            ))}
          </ul>
          {outcome.unexplained.length === 0 ? null : (
            <div className="ez-note" role="alert">
              <p className="ez-note__title">Zu diesen Regeln fehlt die Erklärung</p>
              <p>
                Der Kern meldet eine Regel, die `src/lib/rule-explanations.ts` nicht führt. Statt
                eine Erklärung zu erfinden, steht hier die Meldung im Original:
              </p>
              <ul>
                {outcome.unexplained.map((issue, index) => (
                  <li key={`${issue.rule}-${index}`}>
                    <span className="ez-id">{issue.rule}</span> — {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      ) : null}

      {outcome.state === 'crash' ? (
        <div className="ez-note" role="alert">
          <p className="ez-note__title">Diese Spec ließ sich nicht komponieren</p>
          <p>
            Das ist keine abgelehnte Kombination, sondern ein Abbruch im Katalog — meist eine
            Kennung, für die es keine vermessene Fassung gibt. Die Meldung steht im Original:
          </p>
          <pre className="ez-builder__pre">
            <code>
              {outcome.error.name}: {outcome.error.message}
              {outcome.error.stack === undefined ? '' : `\n\n${outcome.error.stack}`}
            </code>
          </pre>
          <button
            type="button"
            className="ez-action"
            onClick={() => setSpec(lastWorkingSpec.current)}
          >
            <strong>Letzte Änderung zurücknehmen</strong>
          </button>
        </div>
      ) : null}

      <section className="ez-builder__json">
        <h3>SymbolSpec</h3>
        <pre className="ez-builder__pre">
          <code>{json}</code>
        </pre>
        <CopyButton text={json} label="JSON kopieren" />
      </section>

      <section>
        <h3>Codebeispiele</h3>
        <p className="ez-builder__field-hint">
          Die Beispiele importieren `composeFromCatalog` aus dem Paketindex — in Node ist das der
          richtige Weg. Nur im Browserbündel dieser Website geht der Import über den Subpfad.
        </p>
        <CodeTabs samples={samples} />
      </section>

      <style>{`
        .ez-builder__controls {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ez-space-3) var(--ez-space-4);
          margin-block: var(--ez-space-6) var(--ez-space-4);
        }
        .ez-builder__field {
          display: flex;
          flex-direction: column;
          gap: var(--ez-space-1);
          min-width: 12rem;
        }
        .ez-builder__field--wide {
          flex: 1 1 22rem;
        }
        .ez-builder__field-label {
          font-family: var(--ez-font-mono);
          font-size: var(--sl-text-2xs);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--sl-color-gray-3);
        }
        .ez-builder__field-hint {
          font-size: var(--sl-text-2xs);
          color: var(--sl-color-gray-3);
          max-width: 34rem;
        }
        .ez-builder__field input,
        .ez-builder__field select {
          font: inherit;
          font-size: var(--sl-text-sm);
          padding: var(--ez-space-2) var(--ez-space-3);
          border: 1px solid var(--sl-color-hairline);
          border-radius: var(--ez-radius);
          background: transparent;
          color: var(--sl-color-white);
        }
        .ez-builder__field input:focus-visible,
        .ez-builder__field select:focus-visible {
          outline: 2px solid var(--sl-color-accent);
          outline-offset: 2px;
        }
        .ez-builder__chips {
          list-style: none;
          display: flex;
          flex-wrap: wrap;
          gap: var(--ez-space-2);
          margin: var(--ez-space-2) 0 0;
          padding: 0;
        }
        .ez-builder__chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4em;
          padding: 0.2em 0.55em;
          border: 1px solid var(--sl-color-gray-4);
          border-radius: var(--ez-radius);
          background: transparent;
          color: var(--sl-color-gray-2);
          font-family: var(--ez-font-mono);
          font-size: var(--sl-text-2xs);
          cursor: pointer;
        }
        .ez-builder__chip:hover,
        .ez-builder__chip:focus-visible {
          border-color: var(--sl-color-accent);
          color: var(--sl-color-white);
        }
        .ez-builder__sr {
          position: absolute;
          width: 1px;
          height: 1px;
          overflow: hidden;
          clip-path: inset(50%);
          white-space: nowrap;
        }
        .ez-builder__actions {
          margin-block-end: var(--ez-space-6);
        }
        .ez-builder__previews {
          display: grid;
          gap: var(--ez-space-4);
          margin-block-end: var(--ez-space-6);
        }
        .ez-builder__preview-row {
          display: flex;
          flex-direction: column;
          gap: var(--ez-space-2);
        }
        .ez-builder__previews figure {
          flex-direction: column;
          gap: var(--ez-space-2);
          margin: 0;
        }
        .ez-builder__size {
          font-family: var(--ez-font-mono);
          font-size: var(--sl-text-2xs);
          font-variant-numeric: tabular-nums;
          color: currentColor;
          opacity: 0.7;
        }
        .ez-builder__issue-list {
          list-style: none;
          display: grid;
          gap: var(--ez-space-3);
          margin: 0 0 var(--ez-space-6);
          padding: 0;
        }
        .ez-builder__issue {
          display: block;
        }
        .ez-builder__issue-message {
          font-family: var(--ez-font-mono);
          font-size: var(--sl-text-2xs);
          color: var(--sl-color-gray-2);
          margin-block: var(--ez-space-2) var(--ez-space-1);
        }
        .ez-builder__pre {
          max-height: 26rem;
          overflow: auto;
          font-size: var(--sl-text-xs);
        }
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
      `}</style>
    </div>
  );
}

export default function Builder() {
  return (
    <ErrorBoundary>
      <BuilderForm />
    </ErrorBoundary>
  );
}
