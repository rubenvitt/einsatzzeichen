/**
 * Der Einstieg von der Spec zur Zeichnung ohne Prüfpaket (LFH-580).
 *
 * `compose()` bekommt seine Bausteine über `CatalogPorts` injiziert, damit der Motor nicht an eine
 * bestimmte Geometrie gebunden ist. Seit dem Paketschnitt (LFH-560) sind alle elf Ports ohnehin
 * öffentliche Exporte von `core` (seit LFH-577 dazu der optionale Verbandsport) — bis hierher musste sie trotzdem jeder Nutzer selbst verdrahten
 * oder dafür `composeFromCatalog()` aus `@einsatzzeichen/conformance` holen. Beides entfällt: die
 * Standardbelegung steht hier einmal, und `drawSymbol()` ist der eine Weg von der `SymbolSpec` zur
 * `Drawing`. `composeFromCatalog()` bleibt im Prüfpaket als Hülle darum.
 *
 * Die Bausteine kommen direkt aus ihren Modulen und nicht über `./index.js`, damit der Index diese
 * Datei ohne Importzyklus wieder exportieren kann.
 */
import type { Drawing, SymbolSpec } from '@einsatzzeichen/schema';
import { compose, type CatalogPorts, type ComposeOptions } from './compose.js';
import { administrativeHead } from './geometry/administrative-heads.js';
import { baseDrawing, innerField } from './geometry/base-symbols.js';
import { bodyMark } from './derive/body-marks.js';
import { functionRole } from './geometry/function-roles.js';
import { describeSymbolSpec } from './geometry/labels.js';
import { organizationColor } from './geometry/organizations.js';
import { pictogram } from './geometry/pictograms/index.js';
import { strengthHead } from './geometry/strengths.js';
import { technicalHeadMark } from './geometry/technical-head-marks.js';
import { unitGroupingHead } from './geometry/unit-groupings.js';
import { ARIMO_TEXT_METRICS } from './geometry/text-metrics.js';
import { vehicleChassis } from './geometry/vehicle-categories.js';

/**
 * Die Standardbelegung der Ports: die vermessene Geometrie aus `core` und die Arimo-Laufweiten.
 * Eingefroren, weil sie geteilt wird — ein Nutzer, der einen Port tauschen will, baut sich ein
 * eigenes Objekt (`{ ...DEFAULT_PORTS, organizationColor: … }`), statt die Belegung aller anderen
 * zu verändern.
 */
export const DEFAULT_PORTS: CatalogPorts = Object.freeze({
  baseDrawing,
  innerField,
  bodyMark,
  organizationColor,
  strengthHead,
  technicalHeadMark,
  unitGroupingHead,
  functionRole,
  administrativeHead,
  vehicleChassis,
  pictogram,
  textMetrics: ARIMO_TEXT_METRICS,
});

/**
 * Zeichnet eine `SymbolSpec` mit der Standardbelegung. Wirft wie `compose()` eine
 * `CompositionError`, wenn die Spec gegen eine Regel verstößt.
 *
 * Ohne eigene Angabe wird die Beschreibung aus der geprüften Spec abgeleitet
 * (`describeSymbolSpec`), damit jedes Zeichen einen zugänglichen Text trägt. Die Vorgabe greift
 * nur, wenn der Aufrufer weder `description` noch `descriptionFromSpec` setzt: `compose()` zieht
 * die Ableitung einer festen Beschreibung vor, eine blind gesetzte Vorgabe verdrängte also eine
 * ausdrücklich übergebene. Einen Titel erfindet `drawSymbol()` nicht — ohne `title` bleibt er
 * unbesetzt, wie bei `compose()`.
 */
export function drawSymbol(spec: SymbolSpec, options: ComposeOptions = {}): Drawing {
  const withDefaults = options.description === undefined && options.descriptionFromSpec === undefined
    ? { ...options, descriptionFromSpec: describeSymbolSpec }
    : options;
  return compose(spec, DEFAULT_PORTS, withDefaults);
}
