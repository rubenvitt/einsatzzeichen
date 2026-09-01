import {
  Component,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from 'react';
import { Einsatzzeichen } from '@einsatzzeichen/react';
import { renderSvg } from '@einsatzzeichen/core';
import type { ValidationIssue } from '@einsatzzeichen/core';
import { PALETTE, type ColorToken, type Drawing, type SymbolSpec } from '@einsatzzeichen/schema';
import { ORGANIZATION_COLORS } from '@einsatzzeichen/catalog/src/organizations.js';
import { codeSamplesFor, type CodeSamples } from '../../lib/code-samples.js';
import {
  decodeSpec,
  encodeSpec,
  evaluateSpec,
  issuesByField,
  reduceSpec,
  type AllowedValue,
  type BlockedValue,
} from '../../lib/builder-state.js';
import { matchesLine, searchCatalog } from '../../lib/builder-catalog.js';
import {
  kindPreviews,
  labelFor,
  optionsFor,
  probeFields,
} from '../../lib/builder-vocabulary.js';
import { useSnapshot, type SnapshotSelect } from '../../lib/snapshot-island.js';
import type { BuilderVocabulary, SymbolSummary } from '../../lib/snapshot.js';
import type { ExplainedIssue } from '../../lib/rule-explanations.js';
import StatusPair from '../StatusPair.js';

/**
 * Der Baukasten (Spec §5.4; die Route bleibt `/builder/`). Er setzt eine `SymbolSpec` zusammen,
 * komponiert sie im Browser und erklärt jede abgelehnte Kombination in Klarsprache statt nur die
 * Regelkennung zu zeigen.
 *
 * Aufbau als Werkstatt, nicht als Formularspalte: links die Auswahl in vier verständlichen
 * Gruppen, rechts (auf breiten Schirmen klebend) das Ergebnis — eine große Vorschau mit
 * Untergrund-Umschalter, Größenreihe und den Mitnahme-Aktionen (SVG, PNG, Link). Auf schmalen
 * Schirmen steht das Ergebnis über dem Formular, damit jede Änderung ohne Scrollen sichtbar ist.
 *
 * Die Auswahl bietet nur an, was zur aktuellen Zusammenstellung passt: `allowedValues()` probiert
 * jeden Wert einmal durch, und was nicht trägt, steht gesperrt da — sichtbar, mit dem Grund als
 * Tooltip beziehungsweise als Hinweiszeile bei den Kacheln. Ausgeblendet wird nichts: dass es den
 * Wert gibt und warum er gerade nicht geht, ist die eigentliche Auskunft.
 *
 * Drei Ergebniszustände, und jeder hat seine eigene Darstellung (Spec §7):
 * `ok` → Vorschau und Aktionen. `invalid` → gestrichelte Fläche plus erklärte Regelliste direkt
 * darunter. `crash` → sichtbarer Fehlerblock mit Meldung und Stack. Der Fehlerblock nimmt die
 * Insel **nicht** aus dem Betrieb: das Formular bleibt bedienbar, und ein Knopf nimmt die letzte
 * Änderung zurück. Ein Fehler beim Rendern selbst — den der Zustand nicht abfangen kann — landet
 * in der `ErrorBoundary` darunter.
 *
 * Die Daten kommen aus dem Snapshot (`snapshot.builder` für die erlaubten Werte,
 * `snapshot.symbols` für „Aus dem Katalog laden"), nie aus dem Katalog-Index: der zöge `node:url`
 * ins Browserbündel (Spec §5.2).
 *
 * **Und der Snapshot kommt zur Laufzeit (LFH-500).** Er wird per `fetch` geholt
 * (`lib/snapshot-client.ts`), nicht mehr auf Modulebene mit `loadSnapshot()` importiert: das zog
 * dessen `import.meta.glob` und damit 1,3 MB JSON in das Bündel jeder Seite, die diese Insel mit
 * `client:load` mountet. Aus `lib/snapshot.js` kommen hier deshalb ausschließlich Typen
 * (`import type`) — ein Wertimport von dort brächte die 1,3 MB zurück. Damit hat der Baukasten
 * drei weitere sichtbare Zustände vor dem Formular: laden, gescheitert, geladen (siehe `Builder`
 * am Dateiende). Das Vokabular reist ab hier als Argument beziehungsweise Prop; ein Modulzustand
 * dafür wäre die alte Abhängigkeit vom Ladezeitpunkt in neuer Form.
 */

/** Was der Baukasten aus dem Snapshot braucht — mehr als das behält er nicht. */
interface BuilderData {
  vocabulary: BuilderVocabulary;
  symbols: SymbolSummary[];
  /** Die Kachel-Miniaturen der Grundzeichenarten, einmal komponiert. */
  kindTiles: Map<string, Drawing | null>;
}

/**
 * Auf Modulebene und nicht im Renderkörper: `useSnapshot` hat die Auswahl in den Abhängigkeiten
 * seines Effekts, eine bei jedem Render neu erzeugte Funktion löste also einen neuen Abruf aus.
 * Zugleich ist das die Stelle, an der die Kachel-Miniaturen **einmal** komponiert werden — genau
 * das, was bis LFH-500 die Modulkonstante `KIND_PREVIEWS` über dem synchron geladenen Snapshot
 * leistete.
 */
const selectBuilderData: SnapshotSelect<BuilderData> = (snapshot) => ({
  vocabulary: snapshot.builder,
  symbols: snapshot.symbols,
  kindTiles: kindPreviews(snapshot.builder),
});

/** Startspec: das kleinste, was komponiert — eine taktische Formation ohne jede Zutat. */
const DEFAULT_SPEC: SymbolSpec = { kind: 'formation' };

const SPEC_PARAM = 'spec';

/** Entprellung des URL-Schreibens in Millisekunden — siehe `useEffect` unten. */
const URL_WRITE_DELAY_MS = 250;

/** Die Seite ohne Zusammenstellung in der Adresszeile — der Ausweg aus dem Fehlerblock. */
const CLEAN_PATH = '/builder/';

/** Kantenlänge des PNG-Downloads in Pixeln — groß genug für Folien und Dokumente. */
const PNG_SIZE = 512;

/** Mehr Treffer stünden nicht mehr unter dem Suchfeld, ohne selbst wieder Liste zu werden. */
const CATALOG_MATCH_LIMIT = 12;

interface FieldDefinition {
  field: keyof SymbolSpec;
  label: string;
  /**
   * Die Sache, um die es geht, als Substantiv — für den Satz, der einen gesperrten Wert
   * begründet („… ist als Körpermarke für die Grundzeichenart … nicht vermessen").
   */
  noun: string;
  /** Kurzer Hinweis unter dem Feld; nur dort, wo der Feldname allein irreführt. */
  hint?: string;
}

const KIND_FIELD: FieldDefinition = {
  field: 'kind',
  label: 'Grundzeichenart',
  noun: 'Grundzeichenart',
};

const ORGANIZATION_FIELD: FieldDefinition = {
  field: 'organization',
  label: 'Organisation',
  noun: 'Organisation',
};

/**
 * Die Auswahlfelder je Gruppe, innerhalb der Gruppe in der Reihenfolge, in der sie am Zeichen
 * von innen nach außen wirken: erst der Körper, dann seine Füllung, dann Kopf- und Fußzonen.
 *
 * Nur Achsen, die `SymbolSpec` wirklich führt. Der Snapshot bringt darüber hinaus die
 * Piktogrammregister `states`, `comms`, `damage` und `wildfire` mit — die sind Register, keine
 * Spec-Achsen (`taxonomy.ts`), und ein Formularfeld dafür behauptete ein Feld, das es nicht gibt.
 */
const BODY_SELECT_FIELDS: FieldDefinition[] = [
  { field: 'bodyVariant', label: 'Körpervariante', noun: 'Körpervariante' },
];

const CAPABILITY_SELECT_FIELDS: FieldDefinition[] = [
  {
    field: 'technicalFill',
    label: 'Technische Füllung',
    noun: 'technische Füllung',
    hint: 'Schließt eine Organisation aus — die Regel dazu steht bei der Vorschau, sobald beides gesetzt ist.',
  },
];

const COMMAND_SELECT_FIELDS: FieldDefinition[] = [
  { field: 'strength', label: 'Stärke', noun: 'Stärke' },
  { field: 'functionRole', label: 'Funktionsfassung', noun: 'Funktionsfassung' },
  { field: 'administrativeLevel', label: 'Verwaltungsstufe', noun: 'Verwaltungsstufe' },
  { field: 'technicalHeadMark', label: 'Technische Kopfmarke', noun: 'technische Kopfmarke' },
  { field: 'vehicleCategory', label: 'Fahrzeugkategorie', noun: 'Fahrzeugkategorie' },
];

const LIST_FIELDS: FieldDefinition[] = [
  {
    field: 'capabilities',
    label: 'Fähigkeiten (Piktogramme in der Standardbox)',
    noun: 'Fähigkeit',
  },
  {
    field: 'bodyMarks',
    label: 'Körpermarken (randbündig über die Körperfläche)',
    noun: 'Körpermarke',
  },
];

/** Alle Achsen, die durchprobiert werden — Kacheln, Auswahlfelder und Listen gemeinsam. */
const PROBED_FIELDS: FieldDefinition[] = [
  KIND_FIELD,
  ORGANIZATION_FIELD,
  ...BODY_SELECT_FIELDS,
  ...CAPABILITY_SELECT_FIELDS,
  ...COMMAND_SELECT_FIELDS,
  ...LIST_FIELDS,
];

/** Dieselbe Liste, nur die Feldnamen — das nimmt `probeFields()` entgegen. */
const PROBED_FIELD_NAMES: readonly (keyof SymbolSpec)[] = PROBED_FIELDS.map(
  (definition) => definition.field,
);

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

/**
 * Organisationsfarbe für den Farbfleck am Chip — aus `ORGANIZATION_COLORS` des Katalogs und der
 * `PALETTE` des Schemas, nie aus einer eigenen Zuordnung: die Farben gehören den Zeichen, und
 * ihre einzige Quelle ist der Katalog. `hilfsorganisation` ist quellengetreu weiß und braucht
 * deshalb den Rahmen, den der Chip ohnehin zeichnet.
 */
function organizationSwatch(id: string): string | undefined {
  const token = (ORGANIZATION_COLORS as Partial<Record<string, ColorToken>>)[id];
  return token === undefined ? undefined : PALETTE[token];
}

/**
 * Der Satz, der einen gesperrten Wert begründet — in Alltagssprache und mit den Bezeichnungen
 * aus dem Katalog, nicht mit seinen Kennungen.
 *
 * Die Rohmeldung des Katalogs (`Das Art-/Varianten-/Fähigkeitspaar formation/normal/hospital ist
 * nicht vermessen …`) steht bewusst **nicht** im Tooltip: sie trifft 39 von 64 Körpermarken, ist
 * also der Normalfall und nicht die Ausnahme, und sie spricht Kennungen, die auf dieser Seite
 * niemand nachschlagen kann. Sie bleibt in `blocked.detail` erhalten, falls sie später ein
 * Entwicklerabschnitt zeigen soll.
 *
 * **Woher der Unterschied zwischen fester Lücke und Kombinationslücke kommt.** Aus
 * `blocked.scope` und damit aus der Wurfstelle im Katalog — nicht aus einer Feldliste hier. Eine
 * solche Liste wäre eine zweite Fassung derselben Aussage über die Referenz, und sie liefe beim
 * nächsten vermessenen Zeichen still auseinander: das Amphibienfahrzeug ist heute die einzige
 * feste Lücke, und ob es das bleibt, entscheidet der Katalog und nicht die Website. Der Rat „oder
 * eine andere Grundzeichenart" gilt deshalb nur bei `'combination'`; bei `'value'` wäre er
 * falsch, weil ihn keine Art tragen kann.
 *
 * Exportiert allein für den Test daneben: die Fallunterscheidung ist die eigentliche Aussage
 * dieser Funktion, und sie ungeprüft zu lassen wäre der teurere Preis als die etwas größere
 * Oberfläche der Insel.
 */
export function blockedTooltip(
  definition: FieldDefinition,
  blocked: BlockedValue,
  valueLabel: string,
  kindLabel: string,
): string {
  if (blocked.because === 'rule') return blocked.explanation;
  if (definition.field === 'kind') {
    return (
      `Für „${valueLabel}" führt der Katalog mit der übrigen Auswahl keine vermessene Fassung. ` +
      'Nimm einen Teil der Auswahl zurück oder wähle eine andere Grundzeichenart.'
    );
  }
  if (blocked.scope === 'value') {
    return (
      `„${valueLabel}" ist als ${definition.noun} im Katalog nicht vermessen — an keiner ` +
      'Grundzeichenart. Wähle einen anderen Wert.'
    );
  }
  return (
    `„${valueLabel}" ist als ${definition.noun} für die Grundzeichenart „${kindLabel}" nicht ` +
    'vermessen. Wähle einen anderen Wert oder eine andere Grundzeichenart.'
  );
}

/**
 * Die Sperre eines Kandidaten, so wie sie **dargestellt** werden darf — `undefined` für den nach
 * der aktuellen Spec gesetzten Wert, egal was die Probe sagt.
 *
 * `allowedValues()` in `lib/builder-state.ts` sichert unter „Der gerade gesetzte Wert wird nie
 * gesperrt" zu, dass genau das nie vorkommt, und begründet es dort: ein gesperrter Eintrag, der
 * zugleich der ausgewählte ist, wird von Browsern verschieden dargestellt — und an einer Kachel
 * stünden `aria-pressed="true"` und `aria-disabled="true"` nebeneinander, für Vorlesehilfen ein
 * widersprüchlicher Zustand.
 *
 * Die Zusicherung gilt gegenüber der Spec, die hineingereicht wurde. Seit die Probe aufgeschoben
 * läuft (`probeSpec`, siehe `useDeferredValue` in `BuilderForm`), ist das nicht mehr dieselbe Spec,
 * aus der `value`/`values`/`selected` im Markup kommen. Bei einem Sprung, der mehrere Achsen auf
 * einmal setzt — `loadFromCatalog`, „Beispiel laden", der `spec`-Parameter im Mount-Effekt — war
 * der neue Wert in der vorigen Spec nicht gesetzt und kann dort gesperrt gewesen sein:
 * `{ kind: 'formation', strength: 'trupp' }` sperrt `vehicle-land` über `strength-requires-unit`,
 * und genau dorthin springt jedes Landfahrzeug aus dem Katalog.
 *
 * Durchgesetzt wird die Zusage deshalb dort, wo sie sichtbar wird, und gegen die **aktuelle** Spec.
 * Alle drei Bausteine gehen durch diese eine Stelle, damit sie nicht an drei Bedingungen im Markup
 * hängt, die einzeln verrutschen können.
 */
function displayedBlock(
  probe: Map<string, AllowedValue> | undefined,
  optionId: string,
  selected: boolean,
): BlockedValue | undefined {
  return selected ? undefined : probe?.get(optionId)?.blocked;
}

/**
 * Die `aria-describedby`-Liste aus den Teilen, die es gerade wirklich gibt. Ein fest verdrahteter
 * Verweis auf einen Hinweis, den `FieldIssueNote` gar nicht rendert, zeigte auf eine Kennung ohne
 * Element — Vorlesehilfen lesen dann nichts vor und sagen auch nicht, warum.
 */
function describedBy(...ids: readonly (string | undefined)[]): string | undefined {
  const present = ids.filter((id): id is string => id !== undefined);
  return present.length === 0 ? undefined : present.join(' ');
}

/* --- Bausteine ---------------------------------------------------------------------------- */

/**
 * Das Vokabular reist als Prop durch die Bausteine (LFH-500). Vorher lag es als Modulkonstante
 * daneben; seit der Snapshot zur Laufzeit kommt, gäbe es zum Zeitpunkt der Modulauswertung nichts
 * zu lesen.
 */
interface VocabularyProps {
  vocabulary: BuilderVocabulary;
}

/**
 * Der Hinweis am Feld, dessen **gesetzter** Wert in einer Regelmeldung vorkommt.
 *
 * Er sperrt nichts und setzt weder `disabled` noch `aria-invalid`: ungültig ist die Kombination
 * und nicht das Feld allein. Der Wortlaut sagt deshalb „steht in einer Regelmeldung" und nicht
 * „ist falsch" — bei einer Regel zwischen zwei Feldern (`technical-fill-organization-conflict`)
 * erscheint der Hinweis nur an der einen Seite, und „falsch" ließe die andere unverdächtig
 * aussehen. Die Zuordnung stammt aus `issuesByField()`; dort stehen auch ihre Grenzen.
 *
 * Genannt wird nur der Titel. Die Erklärung steht vollständig in der Regelliste unter der
 * Vorschau, und sie hier zu wiederholen machte aus einem Hinweis eine zweite Regelliste im
 * Formular.
 *
 * **Wo dieser Hinweis stehen muss: außerhalb des `<label>`.** Er hängt am Steuerelement allein
 * über `aria-describedby`. Lag er im `<label htmlFor>`, zählte sein Text nach der Berechnung des
 * zugänglichen Namens **in den Namen** — und derselbe Satz käme über `aria-describedby` ein
 * zweites Mal als Beschreibung. NVDA und VoiceOver lesen „Der gesetzte Wert steht in einer
 * Regelmeldung: …" dann zweimal hintereinander. Das Muster ist deshalb überall dasselbe: `<div
 * class="ez-builder__field">` als Hülle, `<label class="ez-builder__field-label" htmlFor>` als
 * Name, Hinweis und Notiz daneben und allein über `aria-describedby` verknüpft — so hielt es
 * `ListField` schon vorher, `SelectField` und das Beschriftungsfeld ziehen nach.
 */
function FieldIssueNote({ id, issues }: { id: string; issues: readonly ExplainedIssue[] }) {
  if (issues.length === 0) return null;
  const titles = issues.map((issue) => issue.title).join(' · ');
  return (
    <span className="ez-builder__field-issue" id={id}>
      {issues.length === 1
        ? 'Der gesetzte Wert steht in einer Regelmeldung: '
        : `Der gesetzte Wert steht in ${issues.length} Regelmeldungen: `}
      <strong>{titles}</strong>. Der ganze Wortlaut steht in der Regelliste unter der Vorschau.
    </span>
  );
}

interface SelectFieldProps extends VocabularyProps {
  definition: FieldDefinition;
  value: string;
  probe: Map<string, AllowedValue> | undefined;
  /** Regelmeldungen, die auf den gesetzten Wert dieses Feldes zeigen; leer ist der Normalfall. */
  issues?: readonly ExplainedIssue[];
  kindLabel: string;
  onChange: (value: string | undefined) => void;
}

function SelectField({
  vocabulary,
  definition,
  value,
  probe,
  issues = [],
  kindLabel,
  onChange,
}: SelectFieldProps) {
  const id = `ez-builder-${definition.field}`;
  const issueId = `${id}-issue`;
  const hintId = `${id}-hint`;
  const options = optionsFor(vocabulary, definition.field);
  // Hülle als `<div>`, Beschriftung als eigenes `<label htmlFor>` — das Muster von `ListField`,
  // die Begründung steht bei `FieldIssueNote`. Der Feldhinweis wandert damit ebenfalls aus dem
  // Namen heraus und braucht seinen eigenen `describedby`-Verweis; ohne ihn hinge er als Text
  // ohne Bezug im Formular.
  return (
    <div className="ez-builder__field">
      <label className="ez-builder__field-label" htmlFor={id}>
        {definition.label}
      </label>
      <select
        id={id}
        value={value}
        aria-describedby={describedBy(
          definition.hint === undefined ? undefined : hintId,
          issues.length === 0 ? undefined : issueId,
        )}
        onChange={(event) => onChange(event.target.value === '' ? undefined : event.target.value)}
      >
        <option value="">— nicht gesetzt —</option>
        {options.map((option) => {
          const blocked = displayedBlock(probe, option.id, option.id === value);
          return (
            <option
              key={option.id}
              value={option.id}
              disabled={blocked !== undefined}
              title={
                blocked === undefined
                  ? undefined
                  : blockedTooltip(definition, blocked, option.label, kindLabel)
              }
            >
              {blocked === undefined ? option.label : `${option.label} — geht hier nicht`}
            </option>
          );
        })}
      </select>
      {definition.hint === undefined ? null : (
        <span className="ez-builder__field-hint" id={hintId}>
          {definition.hint}
        </span>
      )}
      <FieldIssueNote id={issueId} issues={issues} />
    </div>
  );
}

interface ListFieldProps extends VocabularyProps {
  definition: FieldDefinition;
  values: readonly string[];
  probe: Map<string, AllowedValue> | undefined;
  issues?: readonly ExplainedIssue[];
  kindLabel: string;
  onChange: (values: string[]) => void;
}

/**
 * Mehrfachauswahl als „hinzufügen"-Liste plus abwählbare Marken. Ein `<select multiple>` über 88
 * Fähigkeiten wäre mit Strg-Klick zu bedienen und sonst nicht; hier reicht ein Klick je Richtung.
 */
function ListField({
  vocabulary,
  definition,
  values,
  probe,
  issues = [],
  kindLabel,
  onChange,
}: ListFieldProps) {
  const id = `ez-builder-${definition.field}`;
  const issueId = `${id}-issue`;
  const options = optionsFor(vocabulary, definition.field).filter(
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
        aria-describedby={issues.length === 0 ? undefined : issueId}
        onChange={(event) => {
          if (event.target.value !== '') onChange([...values, event.target.value]);
        }}
      >
        <option value="">— hinzufügen —</option>
        {options.map((option) => {
          // Der Filter über `options` nimmt die gesetzten Werte schon aus der Liste; die Zusage
          // aus `displayedBlock()` läuft hier trotzdem über dieselbe Stelle wie in den beiden
          // anderen Bausteinen, statt an dieser einen Filterzeile zu hängen.
          const blocked = displayedBlock(probe, option.id, values.includes(option.id));
          return (
            <option
              key={option.id}
              value={option.id}
              disabled={blocked !== undefined}
              title={
                blocked === undefined
                  ? undefined
                  : blockedTooltip(definition, blocked, option.label, kindLabel)
              }
            >
              {blocked === undefined ? option.label : `${option.label} — geht hier nicht`}
            </option>
          );
        })}
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
                <span>{labelFor(vocabulary, definition.field, value)}</span>
                <span aria-hidden="true">×</span>
                <span className="ez-builder__sr">entfernen</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <FieldIssueNote id={issueId} issues={issues} />
    </div>
  );
}

interface TileGroupProps extends VocabularyProps {
  definition: FieldDefinition;
  /** '' heißt „nicht gesetzt". */
  value: string;
  probe: Map<string, AllowedValue> | undefined;
  issues?: readonly ExplainedIssue[];
  kindLabel: string;
  onChange: (value: string | undefined) => void;
  /** Kachel zum Abwählen; fehlt beim Pflichtfeld `kind`. */
  unsetLabel?: string;
  renderIcon: (id: string) => ReactNode;
  variant: 'tile' | 'chip';
}

/**
 * Kachel-Auswahl für eine Achse. Gesperrte Kacheln bleiben sichtbar und **fokussierbar**:
 * `aria-disabled` statt `disabled`, weil ein totes `disabled` weder Fokus noch Klick annimmt —
 * dann käme der Grund der Sperre bei Tastatur- und Touch-Bedienung nie an. Klick oder Fokus auf
 * eine gesperrte Kachel schreibt den Grund in die Hinweiszeile unter dem Raster (zusätzlich zum
 * `title`-Tooltip für die Maus), ausgewählt wird dabei nichts.
 */
function TileGroup({
  vocabulary,
  definition,
  value,
  probe,
  issues = [],
  kindLabel,
  onChange,
  unsetLabel,
  renderIcon,
  variant,
}: TileGroupProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const labelId = `ez-builder-${definition.field}-label`;
  const noticeId = `ez-builder-${definition.field}-notice`;
  const issueId = `ez-builder-${definition.field}-issue`;
  const options = optionsFor(vocabulary, definition.field);

  // Ein stehen gebliebener Sperrgrund würde nach der nächsten Änderung etwas Falsches
  // behaupten — mit der neuen Probe ist er entweder überholt oder kommt beim nächsten
  // Fokus/Klick ohnehin frisch.
  useEffect(() => setNotice(null), [probe]);

  const base = variant === 'tile' ? 'ez-builder__tile' : 'ez-builder__orgchip';

  return (
    <div className="ez-builder__field ez-builder__field--wide">
      <span className="ez-builder__field-label" id={labelId}>
        {definition.label}
      </span>
      <div
        role="group"
        aria-labelledby={labelId}
        aria-describedby={issues.length === 0 ? undefined : issueId}
        className={variant === 'tile' ? 'ez-builder__tiles' : 'ez-builder__orgchips'}
      >
        {unsetLabel === undefined ? null : (
          <button
            type="button"
            className={value === '' ? `${base} ${base}--selected` : base}
            aria-pressed={value === ''}
            onClick={() => {
              setNotice(null);
              onChange(undefined);
            }}
          >
            {renderIcon('')}
            <span className={`${base}-label`}>{unsetLabel}</span>
          </button>
        )}
        {options.map((option) => {
          const selected = value === option.id;
          const blocked = displayedBlock(probe, option.id, selected);
          const reason =
            blocked === undefined
              ? undefined
              : blockedTooltip(definition, blocked, option.label, kindLabel);
          const classes = [base];
          if (selected) classes.push(`${base}--selected`);
          if (blocked !== undefined) classes.push(`${base}--blocked`);
          return (
            <button
              key={option.id}
              type="button"
              className={classes.join(' ')}
              aria-pressed={selected}
              aria-disabled={blocked !== undefined}
              aria-describedby={blocked === undefined ? undefined : noticeId}
              title={reason}
              onFocus={() => {
                if (reason !== undefined) setNotice(reason);
              }}
              onClick={() => {
                if (reason !== undefined) {
                  setNotice(reason);
                  return;
                }
                setNotice(null);
                onChange(option.id);
              }}
            >
              {renderIcon(option.id)}
              <span className={`${base}-label`}>{option.label}</span>
              {blocked === undefined ? null : (
                <span className="ez-builder__sr">— geht hier nicht: {reason}</span>
              )}
            </button>
          );
        })}
      </div>
      <FieldIssueNote id={issueId} issues={issues} />
      <p id={noticeId} className="ez-builder__tile-notice" role="status">
        {notice ?? ''}
      </p>
    </div>
  );
}

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
          // Kein stiller Fehlschlag: `navigator.clipboard` fehlt in unsicheren Kontexten ganz
          // (wirft dann synchron) und lehnt sonst ohne Recht ab. Beide Wege enden am Knopf.
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

/* --- Vorschau-Panel mit Mitnahme-Aktionen -------------------------------------------------- */

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
  // Nicht sofort widerrufen: der Klick löst den Download asynchron aus, und eine schon
  // widerrufene URL bräche ihn in manchen Browsern kommentarlos ab.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

interface PreviewPanelProps {
  outcome: BuilderOutcome;
  spec: SymbolSpec;
  /** Dateiname der Downloads: Slug des geladenen Zeichens oder der neutrale Vorgabename. */
  fileBase: string;
}

/**
 * Das Ergebnis-Panel: ein großes Zeichen auf Millimeterpapier, wahlweise auf Weiß (dem
 * Referenzuntergrund der Palette) oder auf Graphit, darunter die Größenreihe und die drei
 * Mitnahme-Aktionen. Trägt die Zusammenstellung nicht, zeigt die Fläche das ausdrücklich an,
 * statt eine veraltete Vorschau stehen zu lassen.
 *
 * Jeder Fehlschlag einer Aktion wird am Knopf gemeldet, nichts wird geschluckt (Spec §7) —
 * gerade die PNG-Kette (SVG → Image → Canvas → Blob) hat drei Stellen, an denen Browser still
 * scheitern können.
 */
function PreviewPanel({ outcome, spec, fileBase }: PreviewPanelProps) {
  const [background, setBackground] = useState<PreviewBackground>('light');
  const [note, setNote] = useState<ActionNote | null>(null);

  const fail = (error: unknown) =>
    setNote({
      tone: 'error',
      text: error instanceof Error ? error.message : String(error),
    });

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
      image.onerror = () =>
        fail(new Error('Der Browser konnte das Zeichen nicht als Bild laden (SVG→PNG).'));
      image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    } catch (error) {
      fail(error);
    }
  }

  const drawing = outcome.state === 'ok' ? outcome.drawing : null;

  return (
    <section className="ez-builder__panel" aria-label="Vorschau und Mitnahme">
      <div className="ez-builder__panel-head">
        <span className="ez-builder__field-label">Vorschau</span>
        <div
          className="ez-builder__toggle"
          role="group"
          aria-label="Untergrund der Vorschau"
        >
          <button
            type="button"
            className={
              background === 'light'
                ? 'ez-builder__toggle-button ez-builder__toggle-button--active'
                : 'ez-builder__toggle-button'
            }
            aria-pressed={background === 'light'}
            title="Weiß ist der Referenzuntergrund der Farbpalette"
            onClick={() => setBackground('light')}
          >
            Weiß
          </button>
          <button
            type="button"
            className={
              background === 'dark'
                ? 'ez-builder__toggle-button ez-builder__toggle-button--active'
                : 'ez-builder__toggle-button'
            }
            aria-pressed={background === 'dark'}
            onClick={() => setBackground('dark')}
          >
            Graphit
          </button>
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
          {outcome.state === 'invalid' ? (
            <p>
              Diese Kombination trägt nicht — die Gründe stehen direkt unter der Vorschau.
            </p>
          ) : (
            <p>
              Diese Zusammenstellung ließ sich nicht zeichnen — die Einzelheiten stehen direkt
              unter der Vorschau.
            </p>
          )}
        </div>
      )}

      <div className="ez-builder__panel-actions">
        <button
          type="button"
          className="ez-action ez-builder__panel-action"
          disabled={drawing === null}
          title={drawing === null ? 'Erst möglich, wenn die Zusammenstellung trägt.' : undefined}
          onClick={() => {
            if (drawing !== null) downloadSvg(drawing);
          }}
        >
          <strong>SVG herunterladen</strong>
        </button>
        <button
          type="button"
          className="ez-action ez-builder__panel-action"
          disabled={drawing === null}
          title={drawing === null ? 'Erst möglich, wenn die Zusammenstellung trägt.' : undefined}
          onClick={() => {
            if (drawing !== null) downloadPng(drawing);
          }}
        >
          <strong>PNG herunterladen</strong>
        </button>
        <CopyButton
          label="Link kopieren"
          text={() =>
            `${window.location.origin}${CLEAN_PATH}?${SPEC_PARAM}=${encodeSpec(spec)}`
          }
        />
      </div>
      {note === null ? null : (
        <p
          className={
            note.tone === 'error'
              ? 'ez-builder__panel-note ez-builder__panel-note--error'
              : 'ez-builder__panel-note'
          }
          role={note.tone === 'error' ? 'alert' : 'status'}
        >
          {note.text}
        </p>
      )}
    </section>
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
        <p className="ez-note__title">Der Baukasten ist beim Zeichnen abgebrochen</p>
        <p>
          Das ist ein Fehler im Baukasten, keine abgelehnte Kombination. Stand die
          Zusammenstellung in der Adresszeile, hilft Neuladen nicht — es brächte dieselbe zurück.
        </p>
        <p>
          <a className="ez-action" href={CLEAN_PATH}>
            <strong>Baukasten neu und leer öffnen</strong>
          </a>
        </p>
        <p>
          Kommt der Fehler wieder, hilft dem Projekt eine Meldung mit den technischen Einzelheiten
          unten.
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

/* --- Die Insel ---------------------------------------------------------------------------- */

/**
 * Der Baukasten mit vorliegendem Snapshot. Als eigene Komponente unterhalb des Ladezustands, damit
 * kein Hook hier mit einem „vielleicht noch nicht da"-Fall rechnen muss: sie mountet erst, wenn
 * der Abruf durch ist, und der Snapshot wechselt danach nicht mehr.
 */
function BuilderForm({ vocabulary, symbols, kindTiles }: BuilderData) {
  const [spec, setSpec] = useState<SymbolSpec>(DEFAULT_SPEC);
  const [loadedId, setLoadedId] = useState<string>('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [catalogQuery, setCatalogQuery] = useState('');
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

  // Entprellt, weil jeder Tastenanschlag im Beschriftungsfeld die Spec ändert: Safari wirft
  // einen `SecurityError`, wenn `replaceState` öfter als rund hundertmal in dreißig Sekunden
  // läuft. Der Timer wird bei jeder Änderung und beim Abbau gelöscht, damit kein Schreibvorgang
  // nach dem Ende der Insel landet.
  useEffect(() => {
    if (!hydrated) return undefined;
    const timer = window.setTimeout(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        params.set(SPEC_PARAM, encodeSpec(spec));
        window.history.replaceState(
          null,
          '',
          `${window.location.pathname}?${params.toString()}${window.location.hash}`,
        );
      } catch {
        // Hier wird bewusst geschluckt, und nur hier: eine URL, die nicht mitgeschrieben wurde,
        // ist kein Fehler des Baukastens — das Formular, die Vorschau und die Codebeispiele
        // stimmen weiter. Wer das später in einen Fehlerblock verwandelt, meldet dem Leser ein
        // Problem, das er weder verursacht hat noch lösen kann.
      }
    }, URL_WRITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [spec, hydrated]);

  const outcome = useMemo(() => outcomeOf(spec), [spec]);

  /**
   * Welches Formularfeld eine Regelmeldung angeht — damit ein Befund am gesetzten Wert sichtbar
   * ist und nicht nur unten in der Regelliste steht.
   *
   * `outcome.unexplained` bleibt draußen: eine unerklärte Meldung trägt kein Feld, und einen Anker
   * für sie zu erfinden hieße, aus ihrer Kennung zu raten. Sie steht weiter in ihrem eigenen
   * Block. Die Grenzen der Zuordnung stehen bei `issuesByField()`.
   */
  const fieldIssues = useMemo(
    () =>
      outcome.state === 'invalid'
        ? issuesByField(outcome.issues, spec)
        : new Map<keyof SymbolSpec, ExplainedIssue[]>(),
    [outcome, spec],
  );

  /**
   * Was gerade zusammenpasst, für jedes Feld auf einmal — die Schleife selbst steht als
   * `probeFields()` in `lib/builder-vocabulary.ts`, wo sie ohne React geprüft ist.
   *
   * Die Vorgabe war, erst beim Öffnen eines Auswahlfeldes zu proben. Die Messung nimmt dem
   * Sparen den Anlass: alle elf Felder mit zusammen 247 Kandidaten brauchen 9,7 ms kalt und
   * 3,4 ms warm — das Zwanzigfache unter der Schwelle, ab der gespart werden sollte. Dafür
   * verschwindet ein Fehler, den das Sparen einbaute: ein Auswahlfeld öffnet sich beim Klick,
   * bevor React die Sperren nachgezogen hat, und zeigte beim ersten Öffnen die alte Liste.
   *
   * **Warum `useDeferredValue` und nicht ein engerer Memo-Schlüssel** (LFH-504). `designation` ist
   * das einzige freie Textfeld und schreibt bei jedem Tastenanschlag in die Spec; die Probe rechnet
   * damit bei jedem Tastenanschlag neu. Sie an einem Ausschnitt der Spec zu memoisieren wäre eine
   * Lüge über die Daten: gemessen am 01.09.2026 (Node 22, Vitest, `probeFields()` über
   * `buildSnapshot().builder`) ändern 157 der 247 Kandidaten ihren Befund, wenn die Beschriftung
   * von `LZ` auf `Sehr lange Beschriftung ohne Ende` wächst — die Probe liest `designation`
   * wirklich, und ein Schlüssel ohne sie zeigte veraltete Sperren.
   *
   * Verzögert wird deshalb die Dringlichkeit, nicht der Schlüssel. Die Probe ist die einzige teure
   * Ableitung und zugleich die einzige, die niemand sofort braucht — sie sperrt Werte, die gerade
   * *nicht* gewählt werden. Dieselbe Messung: je Tastenanschlag 6,72 ms im Mittel (4,62–8,59) für
   * die Probe gegen 0,01 ms für `outcome`, Codebeispiele und JSON zusammen. Über
   * `useDeferredValue` läuft die Probe in einem nachrangigen Render; tippt jemand weiter, verwirft
   * React den angefangenen Durchlauf und rechnet nur den letzten Stand.
   *
   * **Was ausdrücklich nicht verzögert wird:** `outcome`, Vorschau, Regelliste und die Hinweise am
   * Feld hängen weiter unmittelbar an `spec`. Die Auswahl und ihr Ergebnis laufen also nicht
   * hinterher — verzögert ist allein die Auskunft über die *anderen*, gerade nicht gewählten Werte.
   *
   * **Der Preis, damit ihn niemand später als Fehler meldet:** für die Dauer eines Renders gehören
   * die Sperren zur vorigen Spec. `TileGroup` weist einen Klick auf eine für gesperrt gehaltene
   * Kachel ab; eine veraltete Sperre könnte diesen Klick einmal zu Unrecht abweisen. Sie ändert
   * dabei nichts und schreibt nur die Hinweiszeile — der zweite Klick geht durch. Das ist der
   * bewusste Tausch gegen den Fehler zwei Absätze weiter oben, und deutlich kleiner als er.
   *
   * **Veraltet ist erlaubt, gemischt nicht.** Zwei Stellen halten das auseinander, und beide
   * gehören zu diesem Preis: `kindLabel` unten kommt aus `probeSpec`, damit Sperre und Begründung
   * dieselbe Spec meinen (sonst entstünde ein Satz, den keine der beiden Specs hergibt), und
   * `displayedBlock()` stellt den nach der **aktuellen** Spec gesetzten Wert nie als gesperrt dar
   * (sonst trüge er `disabled` beziehungsweise `aria-pressed="true"` neben `aria-disabled="true"`).
   *
   * **Verworfen:** das Beschriftungsfeld entprellen oder auf lokalem State führen und erst beim
   * Verlassen in die Spec schreiben. Das verzögerte Vorschau **und** Regelliste — also genau das,
   * wofür der Baukasten da ist.
   */
  const probeSpec = useDeferredValue(spec);
  const probes = useMemo(
    () => probeFields(vocabulary, probeSpec, PROBED_FIELD_NAMES),
    [vocabulary, probeSpec],
  );

  useEffect(() => {
    if (outcome.state !== 'crash') lastWorkingSpec.current = spec;
  }, [outcome, spec]);

  const loadedSymbol = useMemo(
    () => symbols.find((symbol) => symbol.id === loadedId),
    [symbols, loadedId],
  );
  const samples = useMemo(
    () => codeSamplesFor(spec, loadedId === '' ? 'builder-spec' : loadedId),
    [spec, loadedId],
  );
  const json = useMemo(() => JSON.stringify(spec, null, 2), [spec]);
  /**
   * Die Grundzeichenart für den Sperrsatz — aus `probeSpec` und **nicht** aus `spec`.
   *
   * `kindLabel` fließt ausschließlich in `blockedTooltip()`, also in den Satz, der eine Sperre
   * begründet; die Sperren selbst stammen aus `probes` und damit aus `probeSpec`. Aus `spec`
   * gelesen mischte der Satz im aufgeschobenen Render beide Specs: nach dem Wechsel „Person" →
   * „Taktische Formation" trüge die Körpermarke „ABC-/CBRN-Schutz" gesperrt den Satz „… ist als
   * Körpermarke für die Grundzeichenart „Taktische Formation" nicht vermessen" — gesperrt ist sie
   * unter „Person", unter „Taktische Formation" ist sie vermessen. Die Paarung kommt in keiner der
   * beiden Specs vor: der Satz wäre nicht veraltet, sondern erfunden. Über alle Achsen sind 890
   * solcher (Feld, Wert, Artwechsel)-Paare möglich, davon 146 an der Kachelgruppe `organization`,
   * wo der Satz zusätzlich im sr-only-Text landet.
   *
   * Aus `probeSpec` gehören Sperre und Begründung zusammen zur selben Spec — dann ist der Satz für
   * die Dauer eines Renders veraltet, und das ist der Preis, der beim `useDeferredValue` unten
   * ohnehin schon steht.
   */
  const kindLabel = labelFor(vocabulary, 'kind', probeSpec.kind);

  const catalogMatches = useMemo(
    () => searchCatalog(symbols, catalogQuery, CATALOG_MATCH_LIMIT),
    [symbols, catalogQuery],
  );

  function setField(field: keyof SymbolSpec, value: unknown) {
    setSpec((current) => reduceSpec(current, { field, value }));
    setLoadedId('');
  }

  function loadFromCatalog(id: string) {
    // Die leere Auswahl löst nur den Bezug zum Katalogeintrag; die Spec bleibt stehen, damit
    // niemand seine Arbeit verliert, weil er die Auswahl zurückstellt.
    if (id === '') {
      setLoadedId('');
      return;
    }
    const symbol = symbols.find((candidate) => candidate.id === id);
    if (symbol === undefined) return;
    setSpec(symbol.spec);
    setLoadedId(id);
    setUrlError(null);
    setCatalogQuery('');
  }

  function loadRandomExample() {
    const symbol = symbols[Math.floor(Math.random() * symbols.length)];
    if (symbol !== undefined) loadFromCatalog(symbol.id);
  }

  const listValues = (field: keyof SymbolSpec): readonly string[] => {
    const value = spec[field];
    return Array.isArray(value) ? (value as readonly string[]) : [];
  };

  return (
    <div className="ez-builder">
      {urlError === null ? null : (
        <div className="ez-note" role="alert">
          <p className="ez-note__title">Der Link trug keine lesbare Zusammenstellung</p>
          <p>{urlError}</p>
          <p>Der Baukasten steht deshalb auf seiner Ausgangsauswahl.</p>
        </div>
      )}

      <div className="ez-builder__layout">
        {/*
          Das Ergebnis steht im Markup vor dem Formular und rückt auf breiten Schirmen per Grid
          in die rechte Spalte: auf schmalen Schirmen ist so jede Änderung ohne Scrollen sichtbar,
          und die Lesereihenfolge für Screenreader bleibt „erst das Ergebnis, dann die Regler" —
          dieselbe Reihenfolge, in der die Seite sie zeigt.
        */}
        <aside className="ez-builder__result">
          <PreviewPanel
            outcome={outcome}
            spec={spec}
            fileBase={loadedSymbol?.slug ?? 'einsatzzeichen'}
          />

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
                  Dieses Zeichen ist an der Vorlage vermessen. Die Auswahl hier ist der Nachbau
                  dazu, und die Vorschau zeigt, was der Baukasten daraus zusammensetzt — das
                  kann von der gemessenen Zeichnung leicht abweichen. Maßgeblich ist die
                  Zeichnung auf der Seite des Zeichens.
                </p>
              ) : (
                <p>
                  Für dieses Zeichen führt der Katalog selbst eine Bauanleitung. Die Vorschau
                  entsteht aus genau dieser Anleitung — sie ist damit dasselbe Bild, keine
                  Annäherung.
                </p>
              )}
            </div>
          )}

          {outcome.state === 'invalid' ? (
            <section className="ez-builder__issues" aria-label="Verletzte Regeln">
              <h2 className="ez-builder__issues-title">
                {outcome.issues.length + outcome.unexplained.length === 1
                  ? 'Eine Regel steht dieser Kombination entgegen'
                  : `${outcome.issues.length + outcome.unexplained.length} Regeln stehen dieser Kombination entgegen`}
              </h2>
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
                  <p className="ez-note__title">Für diese Regel gibt es noch keine Erklärung</p>
                  <p>
                    Die Regel hat die Kombination abgelehnt, ihr Klartext fehlt aber noch. Statt
                    einen zu erfinden, steht hier die Meldung so, wie sie entstanden ist:
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
              <p className="ez-note__title">Diese Zusammenstellung ließ sich nicht zeichnen</p>
              <p>
                Für diese Zusammenstellung führt der Katalog keine vermessene Fassung. Das ist
                keine abgelehnte Kombination, sondern ein Abbruch mitten im Zeichnen. Im Wortlaut
                des Programms heißt das:
              </p>
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
              <button
                type="button"
                className="ez-action"
                onClick={() => setSpec(lastWorkingSpec.current)}
              >
                <strong>Letzte Änderung zurücknehmen</strong>
              </button>
            </div>
          ) : null}

          <div className="ez-note" role="note">
            <p className="ez-note__title">Nicht fachlich geprüft</p>
            <p>
              Eine Vorschau heißt nur: keine Regel verletzt. Fachlich geprüft sind allein die
              Zeichen im Katalog — deren Stand steht auf jeder Symbolseite.
            </p>
          </div>
        </aside>

        <div className="ez-builder__form">
          <fieldset className="ez-builder__group">
            <legend>Aus dem Katalog laden</legend>
            <p className="ez-builder__group-hint">
              Mit einem vorhandenen Zeichen starten und es abwandeln — oder leer beginnen.
            </p>
            <label className="ez-builder__field ez-builder__field--wide" htmlFor="ez-builder-search">
              <span className="ez-builder__field-label">Suche nach Name oder Kennung</span>
              <input
                id="ez-builder-search"
                type="search"
                placeholder="z. B. Löschzug oder E.1.1"
                value={catalogQuery}
                onChange={(event) => setCatalogQuery(event.target.value)}
              />
            </label>
            {catalogQuery.trim() === '' ? null : (
              <>
                <ul className="ez-builder__matches">
                  {catalogMatches.matches.map((symbol) => (
                    <li key={symbol.id}>
                      <button
                        type="button"
                        className="ez-builder__match"
                        onClick={() => loadFromCatalog(symbol.id)}
                      >
                        <span className="ez-builder__match-title">{symbol.title}</span>
                        <span className="ez-id">{symbol.id}</span>
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="ez-builder__field-hint" role="status">
                  {matchesLine(catalogMatches.total, catalogMatches.matches.length)}
                </p>
              </>
            )}
            <div className="ez-builder__group-actions">
              <button type="button" className="ez-action" onClick={loadRandomExample}>
                <strong>Beispiel laden</strong>
                <span>zufälliges Zeichen aus dem Katalog</span>
              </button>
              <button
                type="button"
                className="ez-action"
                onClick={() => {
                  setSpec(DEFAULT_SPEC);
                  setLoadedId('');
                  setUrlError(null);
                  setCatalogQuery('');
                }}
              >
                <strong>Zurücksetzen</strong>
                <span>zur leeren Ausgangsauswahl</span>
              </button>
            </div>
          </fieldset>

          <fieldset className="ez-builder__group">
            <legend>Grundform</legend>
            <p className="ez-builder__group-hint">
              Womit jedes Zeichen anfängt: die Art des Grundzeichens, seine Bauform und die
              Organisation, deren Farbe den Körper füllt.
            </p>
            <TileGroup
              vocabulary={vocabulary}
              definition={KIND_FIELD}
              value={spec.kind}
              probe={probes.get('kind')}
              issues={fieldIssues.get('kind')}
              kindLabel={kindLabel}
              onChange={(value) => setField('kind', value)}
              variant="tile"
              renderIcon={(id) => {
                const drawing = kindTiles.get(id) ?? null;
                return drawing === null ? (
                  <span className="ez-canvas ez-canvas--light ez-builder__tile-canvas">
                    <span className="ez-builder__tile-placeholder" aria-hidden="true" />
                  </span>
                ) : (
                  <span className="ez-canvas ez-canvas--light ez-builder__tile-canvas">
                    <Einsatzzeichen drawing={drawing} size={44} idPrefix={`ez-kind-${id}`} />
                  </span>
                );
              }}
            />
            {BODY_SELECT_FIELDS.map((definition) => (
              <SelectField
                vocabulary={vocabulary}
                key={definition.field}
                definition={definition}
                value={(spec[definition.field] as string | undefined) ?? ''}
                probe={probes.get(definition.field)}
                issues={fieldIssues.get(definition.field)}
                kindLabel={kindLabel}
                onChange={(value) => setField(definition.field, value)}
              />
            ))}
            <TileGroup
              vocabulary={vocabulary}
              definition={ORGANIZATION_FIELD}
              value={spec.organization ?? ''}
              probe={probes.get('organization')}
              issues={fieldIssues.get('organization')}
              kindLabel={kindLabel}
              onChange={(value) => setField('organization', value)}
              variant="chip"
              unsetLabel="ohne Organisation"
              renderIcon={(id) => {
                const color = id === '' ? undefined : organizationSwatch(id);
                return (
                  <span
                    className={
                      color === undefined
                        ? 'ez-builder__swatch ez-builder__swatch--none'
                        : 'ez-builder__swatch'
                    }
                    style={color === undefined ? undefined : { background: color }}
                    aria-hidden="true"
                  />
                );
              }}
            />
          </fieldset>

          <fieldset className="ez-builder__group">
            <legend>Was die Einheit kann</legend>
            <p className="ez-builder__group-hint">
              Piktogramme und Füllungen, die Aufgaben und Ausstattung am Zeichen zeigen.
            </p>
            {LIST_FIELDS.map((definition) => (
              <ListField
                vocabulary={vocabulary}
                key={definition.field}
                definition={definition}
                values={listValues(definition.field)}
                probe={probes.get(definition.field)}
                issues={fieldIssues.get(definition.field)}
                kindLabel={kindLabel}
                onChange={(values) => setField(definition.field, values)}
              />
            ))}
            {CAPABILITY_SELECT_FIELDS.map((definition) => (
              <SelectField
                vocabulary={vocabulary}
                key={definition.field}
                definition={definition}
                value={(spec[definition.field] as string | undefined) ?? ''}
                probe={probes.get(definition.field)}
                issues={fieldIssues.get(definition.field)}
                kindLabel={kindLabel}
                onChange={(value) => setField(definition.field, value)}
              />
            ))}
          </fieldset>

          <fieldset className="ez-builder__group">
            <legend>Führung und Größe</legend>
            <p className="ez-builder__group-hint">
              Kopf- und Randzeichen: wer führt, auf welcher Verwaltungsstufe, in welcher Stärke.
            </p>
            <div className="ez-builder__group-grid">
              {COMMAND_SELECT_FIELDS.map((definition) => (
                <SelectField
                  vocabulary={vocabulary}
                  key={definition.field}
                  definition={definition}
                  value={(spec[definition.field] as string | undefined) ?? ''}
                  probe={probes.get(definition.field)}
                  issues={fieldIssues.get(definition.field)}
                  kindLabel={kindLabel}
                  onChange={(value) => setField(definition.field, value)}
                />
              ))}
            </div>
          </fieldset>

          <fieldset className="ez-builder__group">
            <legend>Beschriftung</legend>
            <p className="ez-builder__group-hint">
              Das Kürzel in der Fußzone, unterhalb des Zeichens — etwa ein Rufname oder eine
              Einheitsbezeichnung.
            </p>
            {/*
              Dasselbe Muster wie in `SelectField` und `ListField`: Hülle als `<div>`, Beschriftung
              als eigenes `<label htmlFor>`, die Notiz daneben und allein über `aria-describedby`
              verknüpft. Läge sie im `<label>`, stünde ihr Satz im zugänglichen Namen des Feldes
              **und** ein zweites Mal in seiner Beschreibung; die Begründung steht bei
              `FieldIssueNote`.
            */}
            <div className="ez-builder__field ez-builder__field--wide">
              <label className="ez-builder__field-label" htmlFor="ez-builder-designation">
                Beschriftung (Fußzone)
              </label>
              <input
                id="ez-builder-designation"
                type="text"
                placeholder="z. B. LZ 1"
                value={spec.designation ?? ''}
                aria-describedby={
                  fieldIssues.has('designation') ? 'ez-builder-designation-issue' : undefined
                }
                onChange={(event) => setField('designation', event.target.value)}
              />
              <FieldIssueNote
                id="ez-builder-designation-issue"
                issues={fieldIssues.get('designation') ?? []}
              />
            </div>
          </fieldset>
        </div>
      </div>

      <details className="ez-builder__dev">
        <summary>Für Entwicklerinnen und Entwickler</summary>
        <div className="ez-builder__dev-body">
          <p className="ez-builder__field-hint">
            Ab hier stehen die Begriffe der Bibliothek. Wer das Zeichen nur bauen und mitnehmen
            will, ist mit den Knöpfen an der Vorschau fertig.
          </p>
          <p>
            Die Auswahlwerte kommen aus dem Katalog selbst, nicht aus einer zweiten Liste in der
            Website: <code>kind</code>, <code>bodyVariant</code>, <code>organization</code>,{' '}
            <code>technicalFill</code>, <code>strength</code>, <code>functionRole</code>,{' '}
            <code>administrativeLevel</code>, <code>technicalHeadMark</code>,{' '}
            <code>vehicleCategory</code>, <code>capabilities</code> und <code>bodyMarks</code>.
            Die Piktogrammregister <code>states</code>, <code>comms</code>, <code>damage</code>{' '}
            und <code>wildfire</code> haben kein Formularfeld, weil <code>SymbolSpec</code> keine
            solche Achse führt — ein Feld dafür behauptete eine Eingabe, die die Komposition
            nicht annimmt.
          </p>
          <p>
            Gültig oder nicht weiß im Projekt nur <code>compose()</code>, nachträglich. Die
            gesperrten Werte entstehen deshalb durch Probieren: <code>allowedValues()</code>{' '}
            komponiert jeden Kandidaten einmal — alle elf Felder mit zusammen 247 Kandidaten
            brauchen dafür 9,7 ms kalt und 3,4 ms warm. Weil jeder Tastenanschlag im
            Beschriftungsfeld die Spec ändert und die Probe die Beschriftung wirklich liest, läuft
            sie nachrangig (<code>useDeferredValue</code>): wer weitertippt, bekommt die Vorschau
            und die Regeln sofort, die Sperren einen Wimpernschlag später. Beim Laden eines
            Katalogeintrags ist die Spec die Rekonstruktion der vermessenen Darstellung; bei einem
            Kompositionsrezept ist sie selbst die Quelle des Bildes.
          </p>
          <section>
            <h3 className="ez-builder__dev-title">
              Die Zusammenstellung als JSON (<code>SymbolSpec</code>)
            </h3>
            <pre className="ez-builder__pre">
              <code>{json}</code>
            </pre>
            <CopyButton text={json} label="JSON kopieren" />
          </section>
          <section>
            <h3 className="ez-builder__dev-title">Codebeispiele</h3>
            <p className="ez-builder__field-hint">
              Die Beispiele importieren `composeFromCatalog` aus dem Paketindex — in Node ist das
              der richtige Weg. Nur im Browserbündel dieser Website geht der Import über den
              Subpfad.
            </p>
            <CodeTabs samples={samples} />
          </section>
        </div>
      </details>

      <style>{`
        .ez-builder__layout {
          display: grid;
          gap: var(--ez-space-6);
          align-items: start;
          margin-block: var(--ez-space-6);
        }
        .ez-builder__form {
          display: grid;
          gap: var(--ez-space-4);
          min-width: 0;
        }
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
          /*
           * Die Ergebnis-Spalte klebt unter der Kopfzeile und scrollt bei Überlänge in sich —
           * sonst schöbe eine lange Regelliste die Vorschau aus dem Bild, und genau die soll
           * beim Einstellen ständig sichtbar bleiben.
           */
          .ez-builder__result {
            position: sticky;
            inset-block-start: 4.5rem;
            max-height: calc(100vh - 5.5rem);
            overflow-y: auto;
            overscroll-behavior: contain;
            padding-inline-end: var(--ez-space-1);
          }
        }

        /* --- Formulargruppen --- */
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
        .ez-builder__group > legend {
          font-family: var(--ez-font-mono);
          font-size: var(--sl-text-2xs);
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--sl-color-gray-3);
          padding-inline: var(--ez-space-2);
          margin-inline-start: calc(-1 * var(--ez-space-2));
        }
        .ez-builder__group-hint {
          margin: 0;
          font-size: var(--sl-text-sm);
          color: var(--sl-color-gray-2);
          max-width: 52ch;
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
          font-size: var(--sl-text-2xs);
          color: var(--sl-color-gray-3);
          max-width: 34rem;
        }
        /*
         * Ein Befund, kein Beiwerk: dieselbe Größe wie der Hinweis darüber, aber die kräftigere
         * Textfarbe. Bewusst ohne Signalrot als einziges Merkmal — die Aussage trägt der Satz,
         * und der Wert ist nicht falsch, sondern kommt in einer Regelmeldung vor.
         */
        .ez-builder__field-issue {
          font-size: var(--sl-text-2xs);
          color: var(--sl-color-white);
          max-width: 34rem;
          border-inline-start: 2px solid var(--sl-color-hairline);
          padding-inline-start: var(--ez-space-2);
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
          min-width: 0;
        }
        /*
         * Auf Touch-Geräten mindestens 16px: iOS zoomt beim Fokussieren jedes Feldes unter
         * 16px automatisch hinein — die Viewport-Grenze im BaseLayout fängt das ab, diese Regel
         * behebt die Ursache auch dort, wo die Meta nicht gilt. Desktop behält den kompakten Satz.
         */
        @media (pointer: coarse) {
          .ez-builder__field input,
          .ez-builder__field select {
            font-size: max(var(--sl-text-base), 16px);
          }
        }

        /* --- Katalogsuche --- */
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
          align-items: baseline;
          justify-content: space-between;
          gap: var(--ez-space-3);
          padding: var(--ez-space-2) var(--ez-space-3);
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
          min-width: 0;
        }

        /* --- Kacheln (Grundzeichenart) --- */
        .ez-builder__tiles {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(7.25rem, 1fr));
          gap: var(--ez-space-2);
        }
        .ez-builder__tile {
          display: flex;
          flex-direction: column;
          align-items: stretch;
          /* Grid-Kinder schrumpfen sonst nicht unter ihr längstes Wort — „Wechselladerfahrzeug"
             sprengte die Spalte und lief in die Nachbarkachel. */
          min-width: 0;
          gap: var(--ez-space-2);
          padding: var(--ez-space-2);
          border: 1px solid var(--ez-line);
          border-radius: var(--ez-radius);
          background: transparent;
          color: var(--sl-color-gray-1);
          font: inherit;
          cursor: pointer;
          transition: border-color 120ms ease;
        }
        .ez-builder__tile:hover {
          border-color: var(--sl-color-accent);
        }
        .ez-builder__tile--selected {
          border-color: var(--sl-color-accent);
          box-shadow: inset 0 0 0 1px var(--sl-color-accent);
          color: var(--sl-color-white);
        }
        .ez-builder__tile--blocked {
          border-style: dashed;
          cursor: not-allowed;
          opacity: 0.55;
        }
        .ez-builder__tile--blocked:hover {
          border-color: var(--ez-line);
        }
        .ez-builder__tile-canvas {
          padding: var(--ez-space-2);
          min-height: 3.75rem;
          justify-content: center;
        }
        .ez-builder__tile-placeholder {
          width: 2.5rem;
          height: 2.5rem;
          border: 1px dashed currentColor;
          border-radius: var(--ez-radius);
          opacity: 0.5;
        }
        .ez-builder__tile-label {
          font-size: var(--sl-text-2xs);
          line-height: 1.35;
          text-align: center;
          hyphens: auto;
          overflow-wrap: anywhere;
        }
        .ez-builder__tile-notice {
          margin: 0;
          min-height: 1.2em;
          font-size: var(--sl-text-2xs);
          color: var(--sl-color-gray-2);
          max-width: 52ch;
        }

        /* --- Organisations-Chips --- */
        .ez-builder__orgchips {
          display: flex;
          flex-wrap: wrap;
          gap: var(--ez-space-2);
        }
        .ez-builder__orgchip {
          display: inline-flex;
          align-items: center;
          gap: 0.5em;
          padding: 0.3em 0.65em;
          border: 1px solid var(--ez-line);
          border-radius: var(--ez-radius);
          background: transparent;
          color: var(--sl-color-gray-1);
          font: inherit;
          font-size: var(--sl-text-sm);
          cursor: pointer;
          transition: border-color 120ms ease;
        }
        .ez-builder__orgchip:hover {
          border-color: var(--sl-color-accent);
        }
        .ez-builder__orgchip--selected {
          border-color: var(--sl-color-accent);
          box-shadow: inset 0 0 0 1px var(--sl-color-accent);
          color: var(--sl-color-white);
        }
        .ez-builder__orgchip--blocked {
          border-style: dashed;
          cursor: not-allowed;
          opacity: 0.55;
        }
        .ez-builder__orgchip--blocked:hover {
          border-color: var(--ez-line);
        }
        .ez-builder__swatch {
          flex: none;
          width: 0.85em;
          height: 0.85em;
          border: 1px solid var(--ez-line);
          border-radius: 1px;
        }
        .ez-builder__swatch--none {
          border-style: dashed;
          background: transparent;
        }

        /* --- Listen-Chips (Fähigkeiten, Körpermarken) --- */
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

        /* --- Ergebnis-Panel --- */
        .ez-builder__panel {
          display: grid;
          gap: var(--ez-space-3);
          padding: var(--ez-space-4);
          border: 1px solid var(--ez-line);
          border-radius: var(--ez-radius);
          background: var(--ez-surface);
        }
        .ez-builder__panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--ez-space-3);
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
          padding: var(--ez-space-6);
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
        .ez-builder__panel-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .ez-builder__panel-action:disabled:hover {
          border-color: var(--ez-line);
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

        /* --- Regelverstöße --- */
        .ez-builder__issues {
          display: grid;
          gap: var(--ez-space-3);
        }
        .ez-builder__issues-title {
          margin: 0;
          font-size: var(--sl-text-base);
          line-height: 1.3;
          letter-spacing: -0.018em;
          color: var(--sl-color-white);
        }
        .ez-builder__issue-list {
          list-style: none;
          display: grid;
          gap: var(--ez-space-3);
          margin: 0;
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
        .ez-builder__details > summary {
          cursor: pointer;
          font-family: var(--ez-font-mono);
          font-size: var(--sl-text-2xs);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--sl-color-gray-3);
        }
        /*
         * Eigene Grundgestaltung für pre-Blöcke: die Seite steht außerhalb von Starlight, dessen
         * Code-Stile hier also nicht greifen — ohne Rahmen und Grund liefe Code formlos in die
         * Karte hinein.
         */
        .ez-builder__pre {
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

        /* --- Entwicklerabschnitt --- */
        .ez-builder__dev {
          margin-block: var(--ez-space-8);
          border: 1px solid var(--ez-line);
          border-radius: var(--ez-radius);
          background: var(--ez-surface);
        }
        .ez-builder__dev > summary {
          cursor: pointer;
          padding: var(--ez-space-3) var(--ez-space-4);
          font-family: var(--ez-font-mono);
          font-size: var(--sl-text-sm);
          letter-spacing: 0.04em;
          color: var(--sl-color-white);
        }
        .ez-builder__dev-body {
          display: grid;
          gap: var(--ez-space-3);
          padding: var(--ez-space-4);
          border-block-start: 1px solid var(--ez-line);
          font-size: var(--sl-text-sm);
          color: var(--sl-color-gray-2);
        }
        .ez-builder__dev-body p {
          margin: 0;
          max-width: 72ch;
        }
        .ez-builder__dev-title {
          margin: 0 0 var(--ez-space-2);
          font-size: var(--sl-text-base);
          color: var(--sl-color-white);
          letter-spacing: -0.018em;
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
        .ez-builder summary:focus-visible,
        .ez-builder a:focus-visible {
          outline: 2px solid var(--sl-color-accent);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          .ez-builder__tile,
          .ez-builder__orgchip,
          .ez-builder__match {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}

/* --- Laden, Fehler, geladen ---------------------------------------------------------------- */

/**
 * Die Stile der beiden Vorzustände stehen hier und nicht im `<style>` von `BuilderForm`: dessen
 * Block wird gar nicht gerendert, solange das Formular noch nicht steht.
 */
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
      /* .ez-action ist in theme.css für Verweise gebaut; als Knopf braucht es die Grundwerte. */
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
 * Der Vorbau vor dem Formular (LFH-500): der Snapshot wird zur Laufzeit geholt, und bis er da ist,
 * gibt es kein Vokabular — ohne das hätte jedes Auswahlfeld null Optionen, was aussähe wie ein
 * leerer Katalog. Also drei Zustände statt einem. Abruf, Abbruch und Zustandsübergang stehen in
 * `lib/snapshot-island.ts` und sind dort geprüft; hier bleibt nur, wie die drei Zustände aussehen.
 *
 * Der Fehlerzustand nennt den Grund wörtlich, nicht als „Fehler": `fetch` unterscheidet einen
 * Netzausfall, eine 404 nach halb ausgerolltem Deploy und ein verfälschtes Dokument, und wer den
 * leeren Baukasten vor sich hat, kann mit dem geglätteten Wort nichts anfangen. Er lässt die Insel
 * auch nicht stumm zurück: der Knopf lädt die Seite neu, und weil `snapshot-client.ts` sich einen
 * Fehlschlag ausdrücklich nicht merkt, ist das ein echter zweiter Versuch. Die Zusammenstellung in
 * der Adresszeile überlebt das Neuladen — sie steht in der URL, nicht im Zustand der Insel.
 */
function BuilderGate() {
  const state = useSnapshot(selectBuilderData);

  if (state.status === 'failed') {
    return (
      <div className="ez-builder-gate">
        <div className="ez-note" role="alert">
          <p className="ez-note__title">Der Baukasten hat keinen Katalog bekommen</p>
          <p>
            Ohne ihn gibt es weder die erlaubten Werte für die Auswahl noch die Zeichen zum Laden.
            Der Grund ist dieser — nicht ein leerer Katalog:
          </p>
          <p className="ez-builder-gate__reason">{state.message}</p>
          <p>
            <button
              type="button"
              className="ez-action ez-builder-gate__retry"
              onClick={() => window.location.reload()}
            >
              <strong>Erneut versuchen</strong>
              <span>Seite neu laden</span>
            </button>
          </p>
          <p>
            Eine Zusammenstellung in der Adresszeile geht dabei nicht verloren: sie steht in der
            URL und wird gelesen, sobald der Katalog da ist.
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

  return (
    <BuilderForm
      vocabulary={state.data.vocabulary}
      symbols={state.data.symbols}
      kindTiles={state.data.kindTiles}
    />
  );
}

export default function Builder() {
  return (
    <ErrorBoundary>
      <BuilderGate />
    </ErrorBoundary>
  );
}
