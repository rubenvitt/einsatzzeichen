import {
  ADMIN_LEVEL_LABELS,
  ALL_PICTOGRAMS,
  BODY_MARK_IDS,
  ORGANIZATION_LABELS,
  STRENGTH_LABELS,
  TECHNICAL_BODY_MARK_LABELS,
  TECHNICAL_HEAD_MARK_LABELS,
  VEHICLE_CATEGORY_LABELS,
  functionRole,
  pictogram,
  symbolKindLabel,
} from '@einsatzzeichen/catalog';
import {
  ADMIN_LEVEL_IDS,
  BODY_VARIANT_IDS,
  FUNCTION_ROLE_IDS,
  ORGANIZATION_IDS,
  PALETTE,
  STRENGTH_IDS,
  SYMBOL_KINDS,
  TECHNICAL_BODY_MARK_IDS,
  TECHNICAL_HEAD_MARK_IDS,
  VEHICLE_CATEGORY_IDS,
  type ColorToken,
} from '@einsatzzeichen/schema';
import { COLOR_WORDS } from './snapshot-colors.js';
import type { BuilderVocabulary } from './snapshot.js';

/**
 * Das Auswahlvokabular des Baukastens: je Achse des `SymbolSpec` die erlaubten Werte mit ihrer
 * deutschen Bezeichnung.
 *
 * Nicht zu verwechseln mit `builder-vocabulary.ts` nebenan — die Datei liest das fertige Vokabular
 * aus dem Snapshot und leitet daraus die Ansicht ab. Hier entsteht es, aus den Registern des
 * Katalogs. Die Trennung ist die zwischen Bauzeit (Node, voller Katalog) und Laufzeit (Browser,
 * nur der Snapshot); sie ist der Grund, aus dem die Insel nicht selbst im Katalog nachschlägt.
 */

function labelled(ids: readonly string[], label: (id: string) => string): { id: string; label: string }[] {
  return ids.map((id) => ({ id, label: label(id) }));
}

/** Piktogramm-IDs eines Namensraums mit ihrem deutschen Titel, aus dem Register statt aus einer Liste. */
function pictogramVocabulary(namespace: string): { id: string; label: string }[] {
  return ALL_PICTOGRAMS.filter(
    (definition) => definition.variant === 'primary' && definition.id.startsWith(`${namespace}.`),
  ).map((definition) => ({
    id: definition.id.slice(namespace.length + 1),
    label: definition.title,
  }));
}

const TECHNICAL_BODY_MARK_ID_SET = new Set<string>(TECHNICAL_BODY_MARK_IDS);

/**
 * Erlaubte Werte je `SymbolSpec`-Achse. Die Bezeichnungen kommen aus denselben Registern, die
 * `describeSymbolSpec` vorliest — eine zweite Liste in der Website liefe auseinander.
 *
 * `technicalFill` beschriftet seine Farbtoken über `COLOR_WORDS` — dieselbe Übersetzung, die auch
 * die Kontrastausnahme in Prosa setzt. Die Token selbst sind Bezeichner (`weiss`, `gruen`,
 * `funktionslauf-kontrast`) und haben in einem Auswahlfeld nichts verloren, das auch Menschen ohne
 * Technikbezug bedienen.
 *
 * `bodyVariant` bleibt die dokumentierte Ausnahme und trägt weiter seine ID: für die
 * Körpervarianten führt der Katalog kein Bezeichnungsregister, und eines hier zu erfinden hieße,
 * Bezeichnungen ohne Quelle zu behaupten.
 */
export function builderVocabulary(): BuilderVocabulary {
  return {
    kind: labelled(SYMBOL_KINDS, (id) => symbolKindLabel(id as (typeof SYMBOL_KINDS)[number])),
    organization: labelled(
      ORGANIZATION_IDS,
      (id) => ORGANIZATION_LABELS[id as (typeof ORGANIZATION_IDS)[number]],
    ),
    technicalFill: labelled(Object.keys(PALETTE), (id) => COLOR_WORDS[id as ColorToken]),
    strength: labelled(STRENGTH_IDS, (id) => STRENGTH_LABELS[id as (typeof STRENGTH_IDS)[number]]),
    administrativeLevel: labelled(
      ADMIN_LEVEL_IDS,
      (id) => ADMIN_LEVEL_LABELS[id as (typeof ADMIN_LEVEL_IDS)[number]],
    ),
    functionRole: labelled(
      FUNCTION_ROLE_IDS,
      (id) => functionRole(id as (typeof FUNCTION_ROLE_IDS)[number]).title,
    ),
    capabilities: pictogramVocabulary('capability'),
    bodyMarks: labelled(BODY_MARK_IDS, (id) =>
      TECHNICAL_BODY_MARK_ID_SET.has(id)
        ? TECHNICAL_BODY_MARK_LABELS[id as keyof typeof TECHNICAL_BODY_MARK_LABELS]
        : pictogram(`capability.${id}` as Parameters<typeof pictogram>[0]).title,
    ),
    states: pictogramVocabulary('state'),
    comms: pictogramVocabulary('comms'),
    damage: pictogramVocabulary('damage'),
    wildfire: pictogramVocabulary('wildfire'),
    vehicleCategory: labelled(
      VEHICLE_CATEGORY_IDS,
      (id) => VEHICLE_CATEGORY_LABELS[id as (typeof VEHICLE_CATEGORY_IDS)[number]],
    ),
    bodyVariant: labelled(BODY_VARIANT_IDS, (id) => id),
    technicalHeadMark: labelled(
      TECHNICAL_HEAD_MARK_IDS,
      (id) => TECHNICAL_HEAD_MARK_LABELS[id as (typeof TECHNICAL_HEAD_MARK_IDS)[number]],
    ),
  };
}
