import {
  isFreestandingSpec,
  type AnySpec,
  type CanvasMm,
  type Drawing,
  type FreestandingSpec,
  type MovementId,
  type MovementSpec,
  type PictogramId,
  type WeatherIntensity,
} from '@einsatzzeichen/schema';
import { parametricBlock } from './blocks/parametric.js';
import { drawSymbol } from './default-ports.js';
import { collectDerivations } from './derive/record.js';
import { animalStateDrawing } from './geometry/animal-state.js';
import { STRENGTH_LABELS } from './geometry/labels.js';
import { lineDrawing, movementDrawing } from './geometry/parametric.js';
import { pictogram } from './geometry/pictograms/index.js';
import { pictogramDrawing } from './geometry/standalone-pictogram.js';
import { deepFreeze } from './geometry/readonly-data.js';
import { weatherDrawing } from './geometry/weather.js';
import { validateFreestandingSpec } from './validate-freestanding.js';
import { CompositionError } from './validate.js';

/**
 * Der Einstieg von der freistehenden Spec zur Zeichnung (LFH-577) — das Gegenstück zu
 * `drawSymbol` für Pfeile, Linien, Wetter, Tierzustände und Zustände, und `drawAnySpec` als
 * gemeinsamer Einstieg für beide Spec-Arten.
 *
 * Gezeichnet wird mit den vorhandenen Zeichenfunktionen (`movementDrawing`, `lineDrawing`,
 * `weatherDrawing`, `animalStateDrawing`, `pictogramDrawing`); hier kommen nur die Prüfung mit
 * Regelkennungen, die Vorgabe der Zeichenfläche und die Beschreibung für Screenreader dazu.
 */

/**
 * Die Zeichenflächen der Referenz: Pfeile stehen in 32 × 32 mm, Linien und Grenzen in 48 × 32 mm
 * (`conformance/src/parametric-fixtures.ts`, an den Dateien abgelesen). Wer einen längeren Verlauf
 * zeichnet, gibt eine eigene Fläche an (`canvasMm`).
 */
export const FREESTANDING_DEFAULT_CANVAS_MM: Readonly<{ movement: CanvasMm; line: CanvasMm }> = Object.freeze({
  movement: Object.freeze({ width: 32, height: 32 }),
  line: Object.freeze({ width: 48, height: 32 }),
});

/** Schaft ab x 2, Spitze bei x 30, auf der Achse y 16 (5.2.1 bis 5.2.5). */
const ARROW_REFERENCE_PATH = { points: [[2, 16], [30, 16]] } as const;

/**
 * Jeder Pfeil aus 5.2 so, wie ihn die Referenz zeigt (ESZ-139): auf dem Verlauf der Kapiteldatei
 * und in deren Fläche (`FREESTANDING_DEFAULT_CANVAS_MM.movement`). Bei 5.2.6 endet der Verlauf in
 * der Ringmitte bei x 26. Abgelesen an den Dateien, gegatet in
 * `conformance/src/parametric-fixtures.test.ts`.
 */
const REFERENCE_MOVEMENTS: Readonly<Record<MovementId, MovementSpec>> = deepFreeze({
  'direction-of-action': { kind: 'movement', movement: 'direction-of-action', path: ARROW_REFERENCE_PATH },
  'start-of-action': { kind: 'movement', movement: 'start-of-action', path: ARROW_REFERENCE_PATH },
  'directed-movement': { kind: 'movement', movement: 'directed-movement', path: ARROW_REFERENCE_PATH },
  'movement-both-directions': { kind: 'movement', movement: 'movement-both-directions', path: ARROW_REFERENCE_PATH },
  'end-of-movement': { kind: 'movement', movement: 'end-of-movement', path: ARROW_REFERENCE_PATH },
  gathering: { kind: 'movement', movement: 'gathering', path: { points: [[2, 16], [26, 16]] } },
} satisfies Record<MovementId, MovementSpec>);

/**
 * Der Pfeil als Punktzeichen (ESZ-139): die fertige Spec mit dem Verlauf der Referenz, für
 * Anwendungen, die einen Pfeil ohne eigenen Verlauf auf die Karte setzen — etwa „Sammeln“ (DV 102
 * 7.6, BABZ 5.2.6) oder „Sichten, Ordnen, Verteilen“ (DV 102 7.5, BABZ 5.2.4). Es ist eine
 * gewöhnliche `MovementSpec`: Kanonik, Serialisierung und Zeichnung sind dieselben wie für jeden
 * Pfeil. Die Rückgabe ist eingefroren.
 */
export function referenceMovementSpec(movement: MovementId): MovementSpec {
  return REFERENCE_MOVEMENTS[movement];
}

/** Titel und Beschreibung wie bei `drawSymbol`: nur, was der Aufrufer setzt oder die Spec sagt. */
export interface FreestandingDrawOptions {
  readonly title?: string;
  readonly description?: string;
}

const INTENSITY_LABELS: Readonly<Record<WeatherIntensity, string>> = {
  weak: 'schwach',
  moderate: 'mittel',
  strong: 'stark',
  extreme: 'extrem',
};

/** Der Raum einer Piktogrammkennung, der Teil vor dem ersten Punkt. */
type PictogramSpace = PictogramId extends infer Id ? (Id extends `${infer Space}.${string}` ? Space : never) : never;

/** Der Raum eines Piktogramms in Worten, wie er in der Beschreibung vor dem Titel steht. */
const PICTOGRAM_SPACE_LABELS: Readonly<Record<PictogramSpace, string>> = {
  capability: 'Fähigkeit',
  state: 'Zustand',
  comms: 'Kommunikation',
  damage: 'Schaden',
  wildfire: 'Vegetationsbrand',
  leadership: 'Führung',
  'water-rescue-personnel': 'Wasserrettung',
  'special-form': 'Sonderform',
  site: 'Platz',
};

function spaceLabel(id: PictogramId): string {
  return PICTOGRAM_SPACE_LABELS[id.slice(0, id.indexOf('.')) as PictogramSpace];
}

function blockTitle(id: string): string {
  const entry = parametricBlock(id);
  if (entry === undefined) throw new Error(`Kein Baustein ${id} im Register.`);
  return entry.title;
}

/**
 * Die Beschreibung eines freistehenden Zeichens für Screenreader, wie `describeSymbolSpec`: aus
 * der Spec und nicht aus der Geometrie, mit denselben Namen wie Bausteinregister und Piktogramme.
 * Der Verlauf steht nicht darin — Koordinaten vorzulesen wäre Rauschen.
 */
export function describeFreestandingSpec(spec: FreestandingSpec): string {
  switch (spec.kind) {
    case 'movement':
      return `Pfeil: ${blockTitle(`arrow/${spec.movement}`)}`;
    case 'line': {
      const parts = [`Linie: ${blockTitle(`line/${spec.line}`)}`];
      if (spec.strength !== undefined) parts.push(`Stärke: ${STRENGTH_LABELS[spec.strength]}`);
      if (spec.variant === 'alternative') parts.push('zweite Darstellung');
      return parts.join(', ');
    }
    case 'weather': {
      const parts = [`Wetter: ${spec.values.map((value) => pictogram(`state.${value}`).title).join(', ')}`];
      if (spec.intensity !== undefined) parts.push(`Intensität: ${INTENSITY_LABELS[spec.intensity]}`);
      return parts.join(', ');
    }
    case 'animal-state': {
      const parts = [`Tierzustand: ${pictogram(`state.${spec.state}`).title}`];
      if (spec.variant === 'alternative') parts.push('zweite Darstellung');
      return parts.join(', ');
    }
    case 'state': {
      const parts = [`Zustand: ${pictogram(`state.${spec.state}`).title}`];
      if (spec.variant === 'alternative') parts.push('zweite Darstellung');
      return parts.join(', ');
    }
    case 'pictogram': {
      const parts = [`${spaceLabel(spec.pictogram)}: ${pictogram(spec.pictogram).title}`];
      if (spec.variant === 'alternative') parts.push('zweite Darstellung');
      return parts.join(', ');
    }
  }
}

function drawingOf(spec: FreestandingSpec): Drawing {
  switch (spec.kind) {
    case 'movement':
      return movementDrawing(spec.movement, { path: spec.path }, spec.canvasMm ?? FREESTANDING_DEFAULT_CANVAS_MM.movement);
    case 'line':
      return lineDrawing(
        spec.line,
        {
          path: spec.path,
          ...(spec.strength === undefined ? {} : { strength: spec.strength }),
          ...(spec.variant === undefined ? {} : { variant: spec.variant }),
        },
        spec.canvasMm ?? FREESTANDING_DEFAULT_CANVAS_MM.line,
      );
    case 'weather':
      return weatherDrawing(spec.intensity === undefined ? { values: spec.values } : { values: spec.values, intensity: spec.intensity });
    case 'animal-state':
      return animalStateDrawing(spec.variant === undefined ? { state: spec.state } : { state: spec.state, variant: spec.variant });
    case 'state':
      return pictogramDrawing(`state.${spec.state}`, spec.variant);
    case 'pictogram':
      return pictogramDrawing(spec.pictogram, spec.variant);
  }
}

/**
 * Zeichnet eine freistehende Spec. Wie `drawSymbol`:
 *
 * - **Regelverstoß** → `CompositionError` mit den Meldungen aus `validateFreestandingSpec`, jede
 *   über `explainIssue` erklärbar. Geprüft wird vor dem Zeichnen.
 * - **Abgeleitet** → die Zeichnung trägt `derivations`: ein Wetterpaar ohne belegte Anordnung, eine
 *   Stärke außer dem Zug an 2.20, Regen, Hagel oder Gewitter an der Wolke (Eigentümerentscheide vom
 *   29.09. und 02.10.2026).
 * - **Verlauf, der nicht passt** (zu kurz, aus der Fläche ragend, zu spitzer Knick) → ein
 *   gewöhnliches `Error` aus der Zeichenfunktion.
 *
 * Ohne `title` bleibt der Titel unbesetzt; die Beschreibung kommt aus `describeFreestandingSpec`,
 * wenn der Aufrufer keine setzt. Die Titel, die die Zeichenfunktionen selbst tragen (bei Pfeilen
 * und Linien die Kennung), gehen damit nicht nach außen.
 */
export function drawFreestanding(spec: FreestandingSpec, options: FreestandingDrawOptions = {}): Drawing {
  const issues = validateFreestandingSpec(spec);
  if (issues.length > 0) throw new CompositionError(issues);
  // Abgeleitete Teile (Stärken an 2.20, Wetterpaare) melden sich wie bei `drawSymbol` über
  // `Drawing.derivations`; ohne Ableitung bleibt das Feld weg.
  const { viewBox, children, derivations } = collectDerivations(() => drawingOf(spec));
  return {
    viewBox,
    children,
    ...(options.title === undefined ? {} : { title: options.title }),
    description: options.description ?? describeFreestandingSpec(spec),
    ...(derivations === undefined ? {} : { derivations }),
  };
}

/**
 * Der gemeinsame Einstieg für beide Spec-Arten: eine `SymbolSpec` über `drawSymbol`, ein
 * freistehendes Zeichen über `drawFreestanding`. Unterschieden wird am Feld `kind`.
 */
export function drawAnySpec(spec: AnySpec, options: FreestandingDrawOptions = {}): Drawing {
  return isFreestandingSpec(spec) ? drawFreestanding(spec, options) : drawSymbol(spec, options);
}
