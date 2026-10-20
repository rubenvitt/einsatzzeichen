import {
  STRENGTH_LABELS,
  checkAnySpec,
  parametricBlock,
  pictogram,
  referenceMovementSpec,
  type SpecCheck,
} from '@einsatzzeichen/core';
import {
  ANIMAL_STATE_IDS,
  FREESTANDING_KINDS,
  LINE_IDS,
  MOVEMENT_IDS,
  PICTOGRAM_IDS,
  STATE_IDS,
  STRENGTH_IDS,
  WEATHER_INTENSITIES,
  WEATHER_STATE_IDS,
  type Drawing,
  type FreestandingKind,
  type FreestandingSpec,
  type MovementId,
  type PathParameters,
  type PictogramId,
  type WeatherIntensity,
} from '@einsatzzeichen/schema';
import type { AllowedValue } from './builder-state.js';

/**
 * Der Baukasten-Modus „freistehend“ (ESZ-135): Pfeil, Linie, Wetter, Tierzustand, Zustand und
 * Piktogramm ohne Grundzeichen, als `FreestandingSpec` (LFH-577, LFH-798).
 *
 * Reine Funktionen wie in `builder-state.ts` und `builder-vocabulary.ts`; die Insel hält nur den
 * React-State. Die Werte und ihre Bezeichnungen kommen aus den Registern in `schema` und `core`,
 * nicht aus dem Snapshot: die freistehenden Arten haben dort kein Vokabular, und die Register
 * stecken ohnehin im Browserbündel, weil der Baukasten mit ihnen zeichnet.
 */

/** Die Arten in Alltagssprache, für Kacheln und den Sperrsatz. */
export const FREESTANDING_KIND_LABELS: Readonly<Record<FreestandingKind, string>> = Object.freeze({
  movement: 'Pfeil',
  line: 'Linie',
  weather: 'Wetter',
  'animal-state': 'Tierzustand',
  state: 'Zustand',
  pictogram: 'Piktogramm',
});

/** Ein Eintrag einer Auswahl; `group` ordnet ihn in einer langen Liste einem Abschnitt zu. */
export interface FreestandingOption {
  id: string;
  label: string;
  group?: string;
}

/** Ein Feld einer freistehenden Art, wie die Insel es darstellt. */
export interface FreestandingField {
  field: string;
  label: string;
  /** Die Sache als Substantiv, für den Satz, der einen gesperrten Wert begründet. */
  noun: string;
  /** `select`: ein Wert oder keiner; `list`: mehrere, mindestens einer (Wetter). */
  shape: 'select' | 'list';
  /** Wie der leere Eintrag heißt; ohne ihn ist das Feld Pflicht. */
  unsetLabel?: string;
  hint?: string;
  options: readonly FreestandingOption[];
}

/**
 * Die Verläufe, auf denen die Referenz Linien zeigt: gerade von x 1 bis x 47 auf der Achse y 16
 * (2.17 bis 2.19, `conformance/src/parametric-fixtures.ts`). Die geschwungenen Linien 2.14 bis
 * 2.16 stehen in der Referenz auf eigenen Verläufen; der Baukasten zeichnet alle Linien auf dem
 * geraden, damit der Wechsel zwischen ihnen nichts verschiebt. Den Verlauf selbst stellt der
 * Baukasten nicht ein; ein Link mit eigenem Verlauf behält ihn.
 */
const LINE_PATH: PathParameters = { points: [[1, 16], [47, 16]] };

/** Die Stärke, mit der die Referenz 2.20 zeigt; dort ist eine Stärke Pflicht. */
const LINE_STRENGTH_DEFAULT = 'zug';
const LINE_WITH_STRENGTH = 'boundary-with-strength';
/** Die einzige Linie mit zweiter Darstellung (2.14 Escape Route). */
const LINE_WITH_VARIANT = 'escape-route';

const INTENSITY_LABELS: Readonly<Record<WeatherIntensity, string>> = Object.freeze({
  weak: 'schwach',
  moderate: 'mittel',
  strong: 'stark',
  extreme: 'extrem',
});

/**
 * Die Räume des Piktogrammregisters als Abschnitte der Auswahl. Ein Raum ohne Eintrag hier steht
 * unter seiner Kennung; ein Test hält die Tabelle vollständig.
 */
export const PICTOGRAM_SPACE_LABELS: Readonly<Record<string, string>> = Object.freeze({
  capability: 'Fähigkeiten (Kapitel 4)',
  state: 'Zustände (Kapitel 5.8)',
  comms: 'Kommunikation (Anhang J)',
  damage: 'Schäden (Anhang K und L)',
  wildfire: 'Vegetationsbrand (Anhang M)',
  leadership: 'Führung (Anhang D)',
  'water-rescue-personnel': 'Wasserrettung (Anhang I.5)',
  'special-form': 'Sonderformen (3.6 bis 3.8)',
  site: 'Plätze',
});

function spaceOf(id: string): string {
  return id.slice(0, id.indexOf('.'));
}

function stateTitle(id: string): string {
  return pictogram(`state.${id}` as PictogramId).title;
}

function blockTitle(id: string): string {
  return parametricBlock(id)?.title ?? id;
}

const VARIANT_FIELD: FreestandingField = {
  field: 'variant',
  label: 'Darstellung',
  noun: 'Darstellung',
  shape: 'select',
  unsetLabel: 'Erste Darstellung',
  hint: 'Eine zweite Darstellung führt das Register nur bei einzelnen Zeichen.',
  options: [{ id: 'alternative', label: 'Zweite Darstellung' }],
};

/** Je Art die Felder, in der Reihenfolge, in der die Insel sie zeigt. */
export const FREESTANDING_FIELDS: Readonly<Record<FreestandingKind, readonly FreestandingField[]>> =
  Object.freeze({
    movement: [
      {
        field: 'movement',
        label: 'Pfeil (Kapitel 5.2)',
        noun: 'Pfeil',
        shape: 'select',
        options: MOVEMENT_IDS.map((id) => ({ id, label: blockTitle(`arrow/${id}`) })),
      },
    ],
    line: [
      {
        field: 'line',
        label: 'Linie oder Grenze (Kapitel 2)',
        noun: 'Linie',
        shape: 'select',
        options: LINE_IDS.map((id) => ({ id, label: blockTitle(`line/${id}`) })),
      },
      {
        field: 'strength',
        label: 'Stärke',
        noun: 'Stärke',
        shape: 'select',
        unsetLabel: '— nicht gesetzt —',
        hint: 'Nur an der Grenze mit taktischer Stärke, dort ist sie Pflicht.',
        options: STRENGTH_IDS.map((id) => ({ id, label: STRENGTH_LABELS[id] })),
      },
      VARIANT_FIELD,
    ],
    weather: [
      {
        field: 'values',
        label: 'Wetter (Kapitel 5.8.7)',
        noun: 'Wetterwert',
        shape: 'list',
        hint: 'Die Wolke trägt einen Niederschlag, etwa „Wolkig“ und „Schneiend“.',
        options: WEATHER_STATE_IDS.map((id) => ({ id, label: stateTitle(id) })),
      },
      {
        field: 'intensity',
        label: 'Intensität',
        noun: 'Intensität',
        shape: 'select',
        unsetLabel: '— nicht gesetzt —',
        hint: 'Nur an der Wolke mit Niederschlag.',
        options: WEATHER_INTENSITIES.map((id) => ({ id, label: INTENSITY_LABELS[id] })),
      },
    ],
    'animal-state': [
      {
        field: 'state',
        label: 'Tierzustand (Kapitel 5.8.6)',
        noun: 'Tierzustand',
        shape: 'select',
        options: ANIMAL_STATE_IDS.map((id) => ({ id, label: stateTitle(id) })),
      },
      VARIANT_FIELD,
    ],
    state: [
      {
        field: 'state',
        label: 'Zustand (Kapitel 5.8)',
        noun: 'Zustand',
        shape: 'select',
        hint: 'Wetter, Tier- und Personenzustände haben eine eigene Art; der Grund steht am Eintrag.',
        options: STATE_IDS.map((id) => ({ id, label: stateTitle(id) })),
      },
      VARIANT_FIELD,
    ],
    pictogram: [
      {
        field: 'pictogram',
        label: 'Piktogramm',
        noun: 'Piktogramm',
        shape: 'select',
        options: PICTOGRAM_IDS.map((id) => ({
          id,
          label: pictogram(id).title,
          group: PICTOGRAM_SPACE_LABELS[spaceOf(id)] ?? spaceOf(id),
        })),
      },
      VARIANT_FIELD,
    ],
  });

/* --- Ausgangsspecs ------------------------------------------------------------------------ */

/** Die erste Spec aus der Liste, die zeichnet — die Ausgangsauswahl einer Art. */
function firstDrawable(candidates: readonly FreestandingSpec[]): FreestandingSpec {
  for (const candidate of candidates) {
    if (checkAnySpec(candidate).ok) return candidate;
  }
  throw new Error(`Keine Ausgangsauswahl für „${candidates[0]?.kind}“ zeichnet.`);
}

/**
 * Womit eine Art beginnt: der erste Wert ihres Registers, der ohne weitere Angabe zeichnet. Ein
 * Pfeil steht auf dem Verlauf seiner Referenz (`referenceMovementSpec`, ESZ-139), eine Linie auf
 * dem geraden Verlauf aus `LINE_PATH`. Bei Zustand und Piktogramm sind die ersten Werte des
 * Vorrats nicht immer zeichenbar (Kanonik, LFH-798); gewählt wird deshalb durch Probieren.
 */
export function defaultFreestandingSpec(kind: FreestandingKind): FreestandingSpec {
  switch (kind) {
    case 'movement':
      return referenceMovementSpec(MOVEMENT_IDS[0]!);
    case 'line':
      return firstDrawable(LINE_IDS.map((line) => ({ kind: 'line', line, path: LINE_PATH })));
    case 'weather':
      return { kind: 'weather', values: [WEATHER_STATE_IDS[0]!] };
    case 'animal-state':
      return { kind: 'animal-state', state: ANIMAL_STATE_IDS[0]! };
    case 'state':
      return firstDrawable(STATE_IDS.map((state) => ({ kind: 'state', state })));
    case 'pictogram':
      return firstDrawable(PICTOGRAM_IDS.map((id) => ({ kind: 'pictogram', pictogram: id })));
  }
}

/** Die Miniaturen der Kacheln: jede Art in ihrer Ausgangsauswahl. */
export function freestandingKindPreviews(): Map<FreestandingKind, Drawing | null> {
  return new Map(
    FREESTANDING_KINDS.map((kind) => {
      const result = checkAnySpec(defaultFreestandingSpec(kind));
      return [kind, result.ok ? result.drawing : null];
    }),
  );
}

/* --- Ändern ------------------------------------------------------------------------------- */

function samePath(a: PathParameters, b: PathParameters): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Ein Feld der freistehenden Spec setzen oder entfernen (`undefined` oder leere Liste).
 *
 * Mit dem Wert ziehen die Angaben nach, die an ihm hängen — sonst ließe sich ein Wert gar nicht
 * erst wählen:
 *
 * - **Pfeil:** steht der Verlauf auf der Referenz des bisherigen Pfeils, kommt der Verlauf der
 *   Referenz des neuen mit. „Sammeln“ (5.2.6) endet in der Ringmitte bei x 26; auf dem Verlauf
 *   der übrigen Pfeile ragte sein Ring aus der Fläche. Ein eigener Verlauf aus einem Link bleibt.
 * - **Linie:** 2.20 verlangt eine Stärke, jede andere Linie lehnt sie ab; die Stärke kommt mit
 *   der Referenz („Zug“) dazu und fällt beim Wechsel weg. Die zweite Darstellung gibt es nur an
 *   2.14 und fällt an jeder anderen Linie weg.
 * - **Wetter:** mindestens ein Wert. Eine leere Liste ändert nichts, statt eine Spec zu bauen,
 *   die kein Leser annimmt.
 */
export function reduceFreestanding(
  spec: FreestandingSpec,
  field: string,
  value: string | readonly string[] | undefined,
): FreestandingSpec {
  if (Array.isArray(value) && value.length === 0) return spec;
  const next: Record<string, unknown> = { ...spec };
  if (value === undefined || value === '') delete next[field];
  else next[field] = value;

  if (spec.kind === 'movement' && field === 'movement' && typeof value === 'string') {
    const before = referenceMovementSpec(spec.movement);
    if (spec.canvasMm === undefined && samePath(spec.path, before.path)) {
      next.path = referenceMovementSpec(value as MovementId).path;
    }
  }
  if (spec.kind === 'line' && field === 'line') {
    if (value === LINE_WITH_STRENGTH) next.strength ??= LINE_STRENGTH_DEFAULT;
    else delete next.strength;
    if (value !== LINE_WITH_VARIANT) delete next.variant;
  }
  return next as unknown as FreestandingSpec;
}

/* --- Welche Werte gerade zusammenpassen --------------------------------------------------- */

/** Ein Befund aus `checkAnySpec` in der Form, die die Insel liest (`AllowedValue`). */
function toAllowed(value: string, check: SpecCheck): AllowedValue {
  if (check.ok) {
    return (check.drawing.derivations?.length ?? 0) > 0
      ? { value, ok: true, issues: [], derived: true }
      : { value, ok: true, issues: [] };
  }
  if (check.reason === 'not-measured') {
    return {
      value,
      ok: false,
      issues: [],
      blocked: { because: 'not-measured', detail: check.message, scope: check.scope },
    };
  }
  const first = check.issues[0];
  const explanation =
    first !== undefined ? `${first.title}: ${first.explanation}` : 'Diese Kombination trägt nicht.';
  return { value, ok: false, issues: check.issues, blocked: { because: 'rule', explanation } };
}

/**
 * Probiert jeden Wert jedes Feldes der Art an der aktuellen Spec aus — Feldname → (Kennung →
 * Befund), dieselbe Form wie `probeFields()` für die `SymbolSpec`.
 *
 * **Warum `checkAnySpec` je Kandidat und nicht `freestandingVocabulary`.** Das Vokabular setzt
 * genau das eine Feld und lässt die übrige Spec stehen. Der Baukasten setzt beim Klick aber mehr
 * (`reduceFreestanding`: der Verlauf des Pfeils, die Stärke an 2.20). Geprüft wird deshalb die
 * Spec, die der Klick wirklich erzeugte, über `checkAnySpec` — denselben Weg, über den
 * `freestandingVocabulary` selbst zeichnet. Sonst stünde 2.20 gesperrt da, weil ihm die Stärke
 * fehlt, und „Sammeln“, weil sein Ring auf dem Verlauf der anderen Pfeile aus der Fläche ragt.
 *
 * Bei Listen (Wetter) wird angehängt; gefragt ist, ob sich der Wert **hinzufügen** lässt. Ein
 * Verlauf, den die Zeichnung für einen Kandidaten nicht tragen kann, ist weder Regel noch Lücke
 * (`checkAnySpec` wirft); der Kandidat steht dann mit `because: 'path'` gesperrt da, statt die
 * ganze Probe abzubrechen. Gemessen am 20.10.2026 (Node 22, tsx): alle Felder aller sechs Arten
 * zusammen rund 13 ms, das Piktogramm mit 260 Kandidaten rund 5 ms.
 */
export function probeFreestanding(spec: FreestandingSpec): Map<string, Map<string, AllowedValue>> {
  const byField = new Map<string, Map<string, AllowedValue>>();
  const current = spec as unknown as Record<string, unknown>;
  for (const definition of FREESTANDING_FIELDS[spec.kind]) {
    const results = new Map<string, AllowedValue>();
    const selected = current[definition.field];
    const list = Array.isArray(selected) ? (selected as readonly string[]) : [];
    for (const option of definition.options) {
      // Ein Listenwert, der schon gesetzt ist, wird nicht ein zweites Mal angehängt: sein Befund
      // ist der der Spec, wie sie ist.
      const value =
        definition.shape !== 'list'
          ? option.id
          : list.includes(option.id)
            ? list
            : [...list, option.id];
      const next = reduceFreestanding(spec, definition.field, value);
      try {
        results.set(option.id, toAllowed(option.id, checkAnySpec(next)));
      } catch (error) {
        results.set(option.id, {
          value: option.id,
          ok: false,
          issues: [],
          blocked: {
            because: 'path',
            detail: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }
    byField.set(definition.field, results);
  }
  return byField;
}
