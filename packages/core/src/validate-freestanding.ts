import type {
  AnimalStateSpec,
  AnySpec,
  DepictionVariant,
  FreestandingSpec,
  LineSpec,
  PictogramId,
  PictogramSpec,
  StateId,
  StateSpec,
  WeatherSpec,
} from '@einsatzzeichen/schema';
import { stateValueGroup } from './blocks/state-groups.js';
import { LINE_GEOMETRY } from './geometry/parametric.js';
import { ALL_PICTOGRAMS } from './geometry/pictograms/index.js';
import { ANIMAL_STATES } from './geometry/pictograms/states/06-animals.js';
import { classifyWeather } from './geometry/weather.js';
import { STATE_HINT_LAYOUTS } from './layout/state-frames.js';
import { PLACES } from './places.js';
import type { ValidationIssue } from './validate.js';

/**
 * Prüfung der freistehenden Zeichen (LFH-577) — das Gegenstück zu `validateSpec` für die
 * freistehende Spec-Art: Pfeile 5.2, Linien und Grenzen aus Kapitel 2, Wetter 5.8.7,
 * Tierzustände 5.8.6 und seit LFH-798 die Einzeldarstellung eines Zustands aus 5.8 und jedes
 * übrigen Piktogramms aus dem Register.
 *
 * **Was hier geprüft wird und was nicht.** Hier stehen die Regeln der Systematik und die
 * entschiedenen Grenzen: welche Linie eine Stärke trägt, wo es eine zweite Darstellung gibt, wie
 * viele Wetterwerte ein Zeichen trägt. Jede Meldung hat eine Kennung aus
 * `FREESTANDING_RULE_IDS` und ist über `explainIssue` erklärbar.
 *
 * Nicht hier geprüft:
 *
 * - **Form und Wertevorrat** — das leistet `parseAnySpec`: eine Anbindung an einer Linie, ein
 *   unbekannter Pfeil, ein Verlauf mit einem Stützpunkt kommen gar nicht erst als Spec an.
 * - **Vermessungslücken** — eine Wetterkombination, die weder ein Original zeigt noch eine
 *   Entscheidung trägt (Sonne und Wind), oder eine Stärke außer dem Zug an 2.20. Das ist keine
 *   Regel, sondern ein Befund über die Quelle; seit dem 02.10.2026 zeichnet die Zeichnung sie
 *   abgeleitet und meldet sie in `Drawing.derivations`.
 *
 * **Warum `line-strength-mismatch` bleibt.** Die Stärke ist an 2.20 der Inhalt der Lücke selbst —
 * „Grenze mit taktischer Stärke“ heißt genau das. Die Grenzen 2.17 bis 2.19 tragen in derselben
 * Lücke ihr Kürzel (TEL, EA, UEA); eine Stärke dort ersetzte es und machte daraus eine 2.20. Die
 * Linien 2.14 bis 2.16 (Rettungsweg, Sperrstelle, Brandausbreitung) haben keine Lücke und keinen
 * Einheitenbezug. Eine Stärke an einer anderen Linie ist also kein unvermessener Fall, sondern ein
 * anderes Zeichen; eine 2.20 ohne Stärke wäre eine Lücke ohne Inhalt. Beides bleibt Systematik.
 * - **Geometrie des Verlaufs** — zu kurz für Pfeilköpfe oder Striche, aus der Zeichenfläche
 *   ragend, ein zu spitzer Knick am Doppelschaft. Das entscheidet erst die Zeichnung, mit einem
 *   gewöhnlichen Fehler.
 *
 * Die Kennungen stehen als Literale `rule: '…'` an ihrer Prüfstelle, wie in `validate.ts`:
 * `freestanding-rules.test.ts` liest sie per Quelltextscan und hält sie mit der Liste, dem
 * Katalog und den Erklärungen in Deckung.
 */
export function validateFreestandingSpec(spec: FreestandingSpec): ValidationIssue[] {
  switch (spec.kind) {
    case 'movement':
      // Kein Freiheitsgrad eines Pfeils verstößt gegen eine Regel: die Anbindung an einen Körper
      // hat die Spec-Art gar nicht (Entscheidung vom 29.09.2026), und der Verlauf ist Geometrie.
      return [];
    case 'line':
      return validateLine(spec);
    case 'weather':
      return validateWeather(spec);
    case 'animal-state':
      return validateAnimalState(spec);
    case 'state':
      return validateState(spec);
    case 'pictogram':
      return validatePictogram(spec);
  }
}

function validateLine(spec: LineSpec): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const geometry = LINE_GEOMETRY[spec.line];
  const cross = geometry.status === 'measured' ? geometry.crossSection : undefined;
  const takesStrength = cross?.kind === 'dashed' && cross.gap.kind === 'strength';
  if (takesStrength && spec.strength === undefined) {
    issues.push({
      rule: 'line-strength-mismatch',
      message: `${spec.line}: die Grenze mit taktischer Stärke (2.20) braucht eine Stärke.`,
    });
  }
  if (!takesStrength && spec.strength !== undefined) {
    issues.push({
      rule: 'line-strength-mismatch',
      message: `${spec.line}: Stärke "${spec.strength}" gehört nur an die Grenze mit taktischer Stärke (2.20).`,
    });
  }
  const hasAlternative = geometry.status === 'measured' && geometry.alternative !== undefined;
  if (spec.variant === 'alternative' && !hasAlternative) {
    issues.push({
      rule: 'line-variant-not-available',
      message: `${spec.line}: eine zweite Darstellung gibt es unter den Linien nur bei 2.14 Escape Route.`,
    });
  }
  return issues;
}

/**
 * Die Grenzen stehen als Datum in `WEATHER_CLOUD_PRECIPITATION`; `classifyWeather` liest sie und
 * nennt den Grund. Übersetzt wird mit je einem Literal, damit der Quelltextscan jede Kennung sieht.
 */
function validateWeather(spec: WeatherSpec): ValidationIssue[] {
  const verdict = classifyWeather(spec);
  if (verdict.kind !== 'invalid') return [];
  switch (verdict.reason) {
    case 'duplicate-value':
      return [{ rule: 'weather-value-duplicate', message: verdict.message }];
    case 'too-many-values':
      return [{ rule: 'weather-values-exceed-limit', message: verdict.message }];
    case 'intensity-without-precipitation-at-cloud':
      return [{ rule: 'weather-intensity-without-precipitation', message: verdict.message }];
  }
}

function validateAnimalState(spec: AnimalStateSpec): ValidationIssue[] {
  if (spec.variant !== 'alternative') return [];
  const drawn = ANIMAL_STATES.some(
    (definition) => definition.id === `state.${spec.state}` && definition.variant === 'alternative',
  );
  return drawn
    ? []
    : [{
        rule: 'animal-state-variant-not-available',
        message: `${spec.state}: eine zweite Darstellung gibt es unter den Tierzuständen nur beim kontaminierten Tier (5.8.6.2_kontaminiertes Tier_K).`,
      }];
}

/* --- Eine Spec je Bild (LFH-798) ---------------------------------------------------------- */

/** Ob das Register zu einer Kennung eine zweite Darstellung führt. */
function hasAlternative(id: PictogramId): boolean {
  return ALL_PICTOGRAMS.some((definition) => definition.id === id && definition.variant === 'alternative');
}

/**
 * Die Datei, die eine Darstellung aus dem Register zeichnet — `undefined`, wenn es die Variante
 * nicht gibt.
 */
function referenceAssetOf(id: PictogramId, variant: DepictionVariant): string | undefined {
  return ALL_PICTOGRAMS.find((definition) => definition.id === id && definition.variant === variant)?.referenceAsset;
}

/**
 * Die Spec, die das Bild eines Zustands schon trägt (Entscheidung des Eigentümers vom 10.10.2026,
 * Punkt 3): Tierzustand 5.8.6 → `animal-state`, Wetter 5.8.7 → `weather`, Personenzustand 5.8.8 →
 * die Person mit `states`. Die zweiten Darstellungen der Hinweise 5.8.1.13 und 5.8.1.14 zeigen das
 * Zeichen an der Gefahr; welche Dateien das sind, steht als Datum an der Hinweislage
 * (`STATE_HINT_LAYOUTS.hazard.reference`), nicht ein zweites Mal hier.
 */
function stateRedirect(spec: StateSpec): AnySpec | undefined {
  const variant = spec.variant ?? 'primary';
  switch (stateValueGroup(spec.state)) {
    case 'animals':
      return spec.variant === undefined
        ? { kind: 'animal-state', state: spec.state as AnimalStateSpec['state'] }
        : { kind: 'animal-state', state: spec.state as AnimalStateSpec['state'], variant: spec.variant };
    case 'weather':
      return { kind: 'weather', values: [spec.state as WeatherSpec['values'][number]] };
    case 'persons':
      return { kind: 'person', states: [spec.state] };
    default:
      break;
  }
  const hazardHints: Readonly<Record<string, string>> = STATE_HINT_LAYOUTS.hazard.reference;
  const asset = referenceAssetOf(`state.${spec.state}`, variant);
  if (asset !== undefined && hazardHints[spec.state] === asset) return { kind: 'hazard', states: [spec.state] };
  return undefined;
}

/**
 * Führungszeichen mit eigener Kennung: je vermessenem Ort aus `PLACES` die Kapiteldatei, die er
 * zeichnet (heute genau die Leitstelle D.2.5). Über die Referenzdatei verknüpft, nicht über eine
 * zweite Liste: bekommt ein weiterer Ort ein Original, tritt sein Piktogramm hier von selbst ab.
 */
const PLACE_BY_ASSET: ReadonlyMap<string, AnySpec> = new Map(
  Object.values(PLACES).flatMap((entry) =>
    entry.source.basis === 'measured' ? [[entry.source.referenceAsset, entry.spec] as const] : [],
  ),
);

/**
 * Die Spec, die das Bild eines Piktogramms schon trägt (Entscheidung vom 10.10.2026, Punkt 3):
 * `state.*` die Art `state` — oder gleich deren eigene Weiterleitung —, ein Führungszeichen mit
 * eigener Kennung seine `SymbolSpec` (Ort).
 */
function pictogramRedirect(spec: PictogramSpec): AnySpec | undefined {
  if (spec.pictogram.startsWith('state.')) {
    const state: StateSpec = {
      kind: 'state',
      state: spec.pictogram.slice('state.'.length) as StateId,
      ...(spec.variant === undefined ? {} : { variant: spec.variant }),
    };
    return stateRedirect(state) ?? state;
  }
  const asset = referenceAssetOf(spec.pictogram, spec.variant ?? 'primary') ?? referenceAssetOf(spec.pictogram, 'primary');
  return asset === undefined ? undefined : PLACE_BY_ASSET.get(asset);
}

/**
 * Die Spec, die das Bild einer freistehenden Spec schon trägt, oder `undefined`, wenn die Spec
 * selbst die eine ist (LFH-798, „eine Spec je Bild“). Genau dann lehnt die Prüfung mit
 * `state-not-canonical` oder `pictogram-not-canonical` ab; die Meldung nennt dieselbe Spec. Wer
 * alte Daten überführt, schreibt sie damit um, statt die Meldung zu lesen.
 */
export function freestandingRedirect(spec: FreestandingSpec): AnySpec | undefined {
  switch (spec.kind) {
    case 'state':
      return stateRedirect(spec);
    case 'pictogram':
      return pictogramRedirect(spec);
    default:
      return undefined;
  }
}

/** Der Ort, dessen Spec eine Weiterleitung ist — für die Meldung. */
function placeOf(redirect: AnySpec): string | undefined {
  return Object.values(PLACES).find((entry) => entry.spec === redirect)?.id;
}

function validatePictogram(spec: PictogramSpec): ValidationIssue[] {
  const redirect = pictogramRedirect(spec);
  if (redirect !== undefined) {
    const place = placeOf(redirect);
    return [{
      rule: 'pictogram-not-canonical',
      message:
        `${spec.pictogram}: das Bild trägt schon eine eigene Spec, ${JSON.stringify(redirect)}` +
        (place === undefined ? '.' : ` (Ort „${place}“, drawPlace).`),
    }];
  }
  if (spec.variant === 'alternative' && !hasAlternative(spec.pictogram)) {
    return [{
      rule: 'pictogram-variant-not-available',
      message: `${spec.pictogram}: das Register führt zu diesem Piktogramm keine zweite Darstellung.`,
    }];
  }
  return [];
}

function validateState(spec: StateSpec): ValidationIssue[] {
  const redirect = stateRedirect(spec);
  if (redirect !== undefined) {
    return [{
      rule: 'state-not-canonical',
      message:
        `${spec.state}${spec.variant === 'alternative' ? ' (zweite Darstellung)' : ''}: das Bild trägt schon ` +
        `eine eigene Spec, ${JSON.stringify(redirect)}.`,
    }];
  }
  if (spec.variant === 'alternative' && !hasAlternative(`state.${spec.state}`)) {
    return [{
      rule: 'state-variant-not-available',
      message: `${spec.state}: das Register führt zu diesem Zustand keine zweite Darstellung.`,
    }];
  }
  return [];
}
