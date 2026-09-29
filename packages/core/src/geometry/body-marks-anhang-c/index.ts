import {
  BODY_MARK_RENDITION_IDS,
  type BodyMarkId,
  type BodyMarkRenditionId,
  type BodyVariantId,
  type SymbolKind,
  type VehicleCategoryId,
} from '@einsatzzeichen/schema';
import { ASSISTANCE_POWER_CONTEXTS } from './assistance-power.js';
import { CBRN_TRANSPORT_WATER_CONTEXTS } from './cbrn-transport-water.js';
import { FIRE_FIGHTING_CONTEXTS } from './fire-fighting.js';
import { FORMATION_CONTEXTS } from './formation.js';
import { HEIGHT_RESCUE_LIFTING_CONTEXTS } from './height-rescue-lifting.js';
import type { AnhangCContext, MarkBuild, MarkTable } from './shared.js';

/*
 * Körperfassungen der Kapitel-4-Piktogramme aus Anhang C (LFH-786).
 *
 * Eigenes Verzeichnis und nicht `body-marks.ts`: das Bausteinregister (`blocks/marks.ts`) und die
 * Kombinationsausnahmen führen Fundorte in `body-marks.ts` mit Zeilennummern. Jede Fassung, die
 * dort mitten in eine Tabelle käme, verschöbe alle späteren Fundorte. `bodyMark()` fragt diese
 * Tabellen deshalb zuerst und fällt sonst auf seine eigenen zurück. Jedes Paar aus Fähigkeit und
 * Körperfassung steht nur an einer der beiden Stellen; ein Paar, das hier ein bestehendes
 * überdeckte, änderte das Bild einer vorhandenen Fixture, und das melden die Snapshots.
 */

/** Alle Anhang-C-Tabellen mit ihrem Kontext. */
export const ANHANG_C_BODY_MARK_CONTEXTS: readonly AnhangCContext[] = Object.freeze([
  ...FORMATION_CONTEXTS,
  ...FIRE_FIGHTING_CONTEXTS,
  ...HEIGHT_RESCUE_LIFTING_CONTEXTS,
  ...CBRN_TRANSPORT_WATER_CONTEXTS,
  ...ASSISTANCE_POWER_CONTEXTS,
]);

/**
 * Die Anhang-C-Fassung für dieses Paar, oder `undefined`, wenn Anhang C sie nicht führt. Die
 * Fassung (`rendition`) muss genau passen: ohne Kennung gilt nur die Grundfassung, mit Kennung
 * nur die Fassung dieser Kennung.
 */
export function anhangCBodyMarkBuild(
  id: BodyMarkId,
  context: {
    readonly kind: SymbolKind;
    readonly bodyVariant?: BodyVariantId;
    readonly vehicleCategory?: VehicleCategoryId;
    readonly rendition?: BodyMarkRenditionId;
  },
): MarkBuild | undefined {
  for (const entry of ANHANG_C_BODY_MARK_CONTEXTS) {
    if (
      entry.kind === context.kind &&
      entry.bodyVariant === context.bodyVariant &&
      (entry.vehicleCategory === undefined || entry.vehicleCategory === context.vehicleCategory) &&
      entry.rendition === context.rendition &&
      Object.hasOwn(entry.marks, id)
    ) {
      return entry.marks[id];
    }
  }
  return undefined;
}

/**
 * Die an diesem Paar aus Marke und Körperfassung vermessenen Fassungskennungen, in der
 * Reihenfolge von `BODY_MARK_RENDITION_IDS`; leer, wenn das Paar nur seine Grundfassung führt.
 *
 * Für `validateSpec` (`body-mark-rendition-not-measured`): die Regel fragt dieselbe Suche wie
 * `anhangCBodyMarkBuild` und damit genau die Bedingung, unter der `bodyMark()` mit
 * `NotMeasuredError` wirft — der Kontext trägt dieselben Felder, die `compose()` durchreicht.
 */
export function measuredBodyMarkRenditions(
  id: BodyMarkId,
  context: {
    readonly kind: SymbolKind;
    readonly bodyVariant?: BodyVariantId;
    readonly vehicleCategory?: VehicleCategoryId;
  },
): readonly BodyMarkRenditionId[] {
  return BODY_MARK_RENDITION_IDS.filter(
    (rendition) => anhangCBodyMarkBuild(id, { ...context, rendition }) !== undefined,
  );
}

/** Die Tabellen allein, für die Frage „gibt es irgendeine Fassung dieser Kennung?“. */
export const ANHANG_C_BODY_MARK_TABLES: readonly MarkTable[] = Object.freeze(
  ANHANG_C_BODY_MARK_CONTEXTS.map((entry) => entry.marks),
);
