import type {
  AnimalStateSpec,
  FreestandingSpec,
  LineSpec,
  WeatherSpec,
} from '@einsatzzeichen/schema';
import { LINE_GEOMETRY } from './geometry/parametric.js';
import { ANIMAL_STATES } from './geometry/pictograms/states/06-animals.js';
import { classifyWeather } from './geometry/weather.js';
import type { ValidationIssue } from './validate.js';

/**
 * Prüfung der freistehenden Zeichen (LFH-577) — das Gegenstück zu `validateSpec` für die
 * freistehende Spec-Art: Pfeile 5.2, Linien und Grenzen aus Kapitel 2, Wetter 5.8.7 und
 * Tierzustände 5.8.6.
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
