import { VALIDATION_RULE_IDS, validateSpec } from '@einsatzzeichen/core';
import {
  ADMIN_LEVEL_IDS,
  BODY_VARIANT_IDS,
  CAPABILITY_IDS,
  COMMS_IDS,
  DAMAGE_IDS,
  FUNCTION_ROLE_IDS,
  LEADERSHIP_IDS,
  ORGANIZATION_IDS,
  STATE_IDS,
  STRENGTH_IDS,
  SYMBOL_KINDS,
  TECHNICAL_BODY_MARK_IDS,
  TECHNICAL_HEAD_MARK_IDS,
  VEHICLE_CATEGORY_IDS,
  WATER_RESCUE_PERSONNEL_IDS,
  WILDFIRE_IDS,
  type CatalogEntry,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
import type { ElementDescriptor } from './elements.js';
import { ELEMENTS } from './elements.js';
import { ALL_PICTOGRAMS } from './pictograms/index.js';
import type { CatalogPictogramDefinition } from './pictograms/catalog-definition.js';
import { RECIPES, composeFromCatalog, type Recipe } from './recipes.js';

/**
 * Eine Achse der Regelabdeckung: der Werteraum aus dem Schema gegen die Werte, die der Katalog
 * an einer Referenz belegt. `missing` ist die Differenz — Werte, die das Schema kennt, für die
 * aber weder ein Rezept noch ein Element noch ein Piktogramm existiert.
 *
 * Das ist die erste der drei Achsen aus §7 der Slice-1-Spezifikation („Regelabdeckung"), als
 * Metrik und nicht als Gate: ein fehlender Wert ist ein Befund über den Ausbaustand, kein
 * Fehler der vorhandenen Umsetzung.
 */
export interface RuleAxis {
  readonly id: string;
  readonly values: readonly string[];
  readonly exercised: readonly string[];
  readonly missing: readonly string[];
}

function axis(id: string, values: readonly string[], exercised: Iterable<string>): RuleAxis {
  const exercisedSet = new Set(exercised);
  return Object.freeze({
    id,
    values,
    exercised: values.filter((value) => exercisedSet.has(value)),
    missing: values.filter((value) => !exercisedSet.has(value)),
  });
}

/** `readonly string[]`-Sicht auf `readonly Ids[]`, damit die Achsen einheitlich typisiert sind. */
function ids(values: readonly string[]): readonly string[] {
  return values;
}

function elementValues(elements: readonly ElementDescriptor[], kind: ElementDescriptor['kind']): string[] {
  return elements
    .filter((element) => element.kind === kind)
    .map((element) => element.id.slice(kind.length + 1));
}

function pictogramValues(pictograms: readonly CatalogPictogramDefinition[], prefix: string): string[] {
  return pictograms
    .filter((pictogram) => pictogram.id.startsWith(`${prefix}.`))
    .map((pictogram) => pictogram.id.slice(prefix.length + 1));
}

/**
 * Regelabdeckung über alle Achsen von `SymbolSpec` und über die Piktogrammräume.
 *
 * Belegt („exercised") ist ein Wert, wenn er in `recipe.spec` eines Rezepts steht, ein
 * Katalogeintrag ihn als `kind` trägt (die Grundzeichen aus Kapitel 1 sind Referenzbelege
 * einer Art ohne Rezept) **oder** ein Element ihn trägt: Organisationen, Stärkegrade und Fahrwerkszonen sind eigene Manifestzeilen
 * mit eigenem Referenzbeleg (Kapitel 2, 5.4, 5.1.1), und ein Element belegt seinen Wert auch
 * dann, wenn kein Rezept ihn verwendet. Die Piktogrammräume (`state`, `comms`, `damage`,
 * `wildfire`, `leadership`, `water-rescue-personnel`) stehen bewusst **nicht** in `SymbolSpec`
 * (standalone Piktogramme) und werden deshalb gegen `ALL_PICTOGRAMS` gemessen, nicht gegen
 * Rezepte; `capability` läuft über beide Wege, weil eine Fähigkeit als Piktogramm existiert und
 * als `bodyMarks`-Wert in einem Rezept stehen kann.
 */
export function ruleCoverage(
  recipes: readonly Recipe[] = Object.values(RECIPES),
  elements: readonly ElementDescriptor[] = Object.values(ELEMENTS),
  pictograms: readonly CatalogPictogramDefinition[] = ALL_PICTOGRAMS,
  catalog: readonly CatalogEntry[] = Object.values(BASE_SYMBOLS),
): readonly RuleAxis[] {
  const specs = recipes.map((recipe) => recipe.spec);
  const bodyMarks = specs.flatMap((spec) => spec.bodyMarks ?? []);
  const defined = <T>(values: readonly (T | undefined)[]): T[] =>
    values.filter((value): value is T => value !== undefined);

  return Object.freeze([
    axis('kind', ids(SYMBOL_KINDS), [
      ...specs.map((spec) => spec.kind),
      ...catalog.map((entry) => entry.kind),
    ]),
    axis('bodyVariant', ids(BODY_VARIANT_IDS), defined(specs.map((spec) => spec.bodyVariant))),
    axis('organization', ids(ORGANIZATION_IDS), [
      ...defined(specs.map((spec) => spec.organization)),
      ...elementValues(elements, 'organization'),
    ]),
    axis('strength', ids(STRENGTH_IDS), [
      ...defined(specs.map((spec) => spec.strength)),
      ...elementValues(elements, 'strength'),
    ]),
    axis('technicalHeadMark', ids(TECHNICAL_HEAD_MARK_IDS), defined(specs.map((spec) => spec.technicalHeadMark))),
    axis('administrativeLevel', ids(ADMIN_LEVEL_IDS), defined(specs.map((spec) => spec.administrativeLevel))),
    axis('functionRole', ids(FUNCTION_ROLE_IDS), defined(specs.map((spec) => spec.functionRole))),
    axis('vehicleCategory', ids(VEHICLE_CATEGORY_IDS), [
      ...defined(specs.map((spec) => spec.vehicleCategory)),
      ...elementValues(elements, 'vehicle-category'),
    ]),
    axis('capabilities', ids(CAPABILITY_IDS), [
      ...specs.flatMap((spec) => spec.capabilities ?? []),
      ...bodyMarks,
      ...pictogramValues(pictograms, 'capability'),
    ]),
    axis('bodyMarks', ids(TECHNICAL_BODY_MARK_IDS), bodyMarks),
    axis('state', ids(STATE_IDS), pictogramValues(pictograms, 'state')),
    axis('comms', ids(COMMS_IDS), pictogramValues(pictograms, 'comms')),
    axis('damage', ids(DAMAGE_IDS), pictogramValues(pictograms, 'damage')),
    axis('wildfire', ids(WILDFIRE_IDS), pictogramValues(pictograms, 'wildfire')),
    axis('leadership', ids(LEADERSHIP_IDS), pictogramValues(pictograms, 'leadership')),
    axis(
      'water-rescue-personnel',
      ids(WATER_RESCUE_PERSONNEL_IDS),
      pictogramValues(pictograms, 'water-rescue-personnel'),
    ),
  ]);
}

/**
 * Zahl der Validierungsregeln in `core`. Es gibt bewusst **kein** zweites Feld „mit Testfall":
 * dass jede Regel einen Testfall hat, erzwingt `validation-rules.test.ts` in `core` als
 * Mengengleichheit — der Katalog müsste dafür Testdateien eines fremden Pakets lesen, und die
 * Aussage wäre dort nur eine Wiederholung. Die eine derzeit nicht auslösbare Regel steht dort
 * als benanntes Todo und ist im selben Test festgenagelt.
 */
export function validationRuleCoverage(): { total: number } {
  return { total: VALIDATION_RULE_IDS.length };
}

/**
 * Signatur der Stufe-1-Projektion: nur die fünf enumerierten Achsen. Zwei Specs mit gleicher
 * Signatur sind für die Reichweitenmessung dasselbe Zeichen, auch wenn sie sich in
 * Fähigkeiten, Marken, Rolle oder Beschriftung unterscheiden.
 */
export function reachSignature(spec: SymbolSpec): string {
  const head = spec.strength !== undefined
    ? `strength:${spec.strength}`
    : spec.technicalHeadMark !== undefined
      ? `technicalHeadMark:${spec.technicalHeadMark}`
      : spec.administrativeLevel !== undefined
        ? `administrativeLevel:${spec.administrativeLevel}`
        : '';
  return [spec.kind, spec.bodyVariant ?? '', spec.organization ?? '', head, spec.vehicleCategory ?? ''].join('|');
}

export interface GenerativeReach {
  /** Enumerierte Kombinationen: 19 × 11 × 10 × 12 × 9. */
  readonly enumerated: number;
  /** Bestehen `validateSpec` ohne Befund. */
  readonly validBySpec: number;
  /** Bestehen `validateSpec` **und** `composeFromCatalog` wirft nicht — die eigentliche Reichweite. */
  readonly valid: number;
  /** Unterschiedliche Stufe-1-Signaturen aus den Rezepten, die in `valid` liegen. */
  readonly referenced: number;
  /** `valid − referenced`: erzeugbar ohne Referenzbeleg. */
  readonly reachOnly: number;
  /** Rezeptsignaturen, die für sich allein nicht gültig sind (Rezept trägt tragende Zusatzfelder). */
  readonly referencedOutsideReach: readonly string[];
  /** Achsen, die Stufe 1 nicht enumeriert, mit ihrer Wertezahl — der Raum ist ohne sie unvollständig. */
  readonly notEnumerated: readonly { readonly id: string; readonly size: number }[];
  readonly durationMs: number;
}

/**
 * Generative Reichweite, Stufe 1: was der Motor aus den fünf Kernachsen von `SymbolSpec`
 * tatsächlich erzeugen kann — gemessen mit dem echten `validateSpec` **und** dem echten
 * `composeFromCatalog`, nicht mit einer Nachbildung der Regeln. Die Enumeration ist billig
 * (rund 150 ms für 225 720 Kombinationen, weil `validateSpec` die meisten früh ablehnt und nur
 * die gut 900 verbleibenden komponiert werden), deshalb keine Vorabreduktion des Raums.
 *
 * Dritte Achse aus §7 der Slice-1-Spezifikation: „dokumentiert, kein Gate". Absichtlich
 * **kein** Prozentwert: mit Fähigkeiten, Körpermarken, Funktionsrollen und freier Bezeichnung ist
 * der Raum unbeschränkt, und ein Anteil an einem unendlichen Raum wäre eine Zahl ohne Aussage.
 * `notEnumerated` nennt diese Achsen mit ihrer Wertezahl, damit die Grenze der Messung
 * mitgeliefert wird.
 *
 * Nur `composeFromCatalog`, keine eigenen Ports: der Portsatz gehört `recipes.ts`, und eine
 * Kopie hier liefe bei jeder Porterweiterung auseinander.
 */
export function generativeReach(recipes: readonly Recipe[] = Object.values(RECIPES)): GenerativeReach {
  const started = performance.now();
  const heads: readonly Partial<SymbolSpec>[] = [
    {},
    ...STRENGTH_IDS.map((strength) => ({ strength })),
    ...TECHNICAL_HEAD_MARK_IDS.map((technicalHeadMark) => ({ technicalHeadMark })),
    ...ADMIN_LEVEL_IDS.map((administrativeLevel) => ({ administrativeLevel })),
  ];
  const bodyVariants = [undefined, ...BODY_VARIANT_IDS];
  const organizations = [undefined, ...ORGANIZATION_IDS];
  const vehicleCategories = [undefined, ...VEHICLE_CATEGORY_IDS];

  let enumerated = 0;
  let validBySpec = 0;
  const valid = new Set<string>();
  for (const kind of SYMBOL_KINDS) {
    for (const bodyVariant of bodyVariants) {
      for (const organization of organizations) {
        for (const head of heads) {
          for (const vehicleCategory of vehicleCategories) {
            enumerated += 1;
            const spec: SymbolSpec = {
              kind,
              ...(bodyVariant !== undefined ? { bodyVariant } : {}),
              ...(organization !== undefined ? { organization } : {}),
              ...head,
              ...(vehicleCategory !== undefined ? { vehicleCategory } : {}),
            };
            if (validateSpec(spec).length > 0) continue;
            validBySpec += 1;
            try {
              composeFromCatalog(spec);
              valid.add(reachSignature(spec));
            } catch {
              // Der Motor lehnt ab, was `validateSpec` durchließ (z. B. nicht vermessenes
              // Fahrwerk): zählt nicht zur Reichweite, ist aber kein Fehler der Messung.
            }
          }
        }
      }
    }
  }

  const referencedSignatures = new Set(recipes.map((recipe) => reachSignature(recipe.spec)));
  const referenced = [...referencedSignatures].filter((signature) => valid.has(signature));
  const referencedOutsideReach = [...referencedSignatures].filter((signature) => !valid.has(signature)).sort();

  return Object.freeze({
    enumerated,
    validBySpec,
    valid: valid.size,
    referenced: referenced.length,
    reachOnly: valid.size - referenced.length,
    referencedOutsideReach,
    notEnumerated: Object.freeze([
      { id: 'capabilities', size: CAPABILITY_IDS.length },
      { id: 'bodyMarks', size: CAPABILITY_IDS.length + TECHNICAL_BODY_MARK_IDS.length },
      { id: 'functionRole', size: FUNCTION_ROLE_IDS.length },
      { id: 'designation', size: Number.POSITIVE_INFINITY },
    ]),
    durationMs: performance.now() - started,
  });
}
