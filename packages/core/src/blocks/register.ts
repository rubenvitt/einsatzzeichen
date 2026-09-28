import type {
  BlockCategory,
  BlockCategoryGap,
  BlockEntry,
  BlockId,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOL_BLOCKS, CHASSIS_BLOCKS, COLOR_BLOCKS } from './base.js';
import {
  ADMINISTRATIVE_LEVEL_BLOCKS,
  STRENGTH_BLOCKS,
  TECHNICAL_HEAD_MARK_BLOCKS,
  UNIT_GROUPING_BLOCKS,
} from './head.js';
import { BODY_MARK_BLOCKS, CAPABILITY_BLOCKS, FUNCTION_ROLE_BLOCKS } from './marks.js';
import { ARROW_BLOCKS, LINE_BLOCKS } from './parametric.js';
import { STATE_BLOCKS, TENDENCY_BLOCKS } from './states.js';

/**
 * Das Bausteinregister (LFH-564). Es enthält die Bausteine der Grammatik ohne Kombinationsbezug,
 * als Daten und je Kategorie.
 *
 * **Es verschiebt keine Geometrie.** Die Zeichnungen liegen seit LFH-570 in `core/src/geometry/`,
 * und das Register importiert sie nicht. Deshalb zeigt jeder Eintrag mit `definedAt` auf den Fundort
 * seiner Zeichnung. Ob sich dieser Fundort zur Laufzeit wirklich zu Geometrie auflöst, prüfen die
 * Gates `core/src/blocks/*.test.ts` und `conformance/src/block-register/head.test.ts`. Spec:
 * `docs/superpowers/specs/2026-09-21-lfh-564-bausteinregister-design.md`.
 *
 * Der Typ ist `Record<BlockCategory, …>` und nicht `Partial`: Fehlt eine Kategorie, lehnt der
 * Compiler das ab. Eine Kategorie ohne Werte steht hier mit leerer Liste **und** in
 * `BLOCK_CATEGORY_GAPS`.
 */
export const BLOCK_REGISTER: Readonly<Record<BlockCategory, readonly BlockEntry[]>> = Object.freeze({
  'base-symbol': BASE_SYMBOL_BLOCKS,
  color: COLOR_BLOCKS,
  strength: STRENGTH_BLOCKS,
  'unit-grouping': UNIT_GROUPING_BLOCKS,
  'administrative-level': ADMINISTRATIVE_LEVEL_BLOCKS,
  'technical-head-mark': TECHNICAL_HEAD_MARK_BLOCKS,
  chassis: CHASSIS_BLOCKS,
  capability: CAPABILITY_BLOCKS,
  'body-mark': BODY_MARK_BLOCKS,
  'function-role': FUNCTION_ROLE_BLOCKS,
  state: STATE_BLOCKS,
  tendency: TENDENCY_BLOCKS,
  arrow: ARROW_BLOCKS,
  line: LINE_BLOCKS,
} satisfies Record<BlockCategory, readonly BlockEntry[]>);

/** Alle Kategorien in Registerreihenfolge. */
export const BLOCK_CATEGORIES: readonly BlockCategory[] = Object.freeze(
  Object.keys(BLOCK_REGISTER) as BlockCategory[],
);

/** Alle Einträge flach, in Registerreihenfolge. */
export const BLOCK_ENTRIES: readonly BlockEntry[] = Object.freeze(
  BLOCK_CATEGORIES.flatMap((category) => BLOCK_REGISTER[category]),
);

/**
 * Kategorien, für die das Schema noch keine Werte kennt. Seit LFH-566 ist die Liste leer: Pfeil
 * und Linie haben ihre Kennungen (`MOVEMENT_IDS`, `LINE_IDS`). Die Liste bleibt, damit eine neue
 * Kategorie ohne Werte hier erscheinen muss und nicht still leer bleibt.
 */
export const BLOCK_CATEGORY_GAPS: readonly BlockCategoryGap[] = Object.freeze([]);

/** Nachschlag über die Kennung, `undefined` statt Wurf. */
export function blockEntry(id: BlockId | string): BlockEntry | undefined {
  return BLOCK_ENTRIES.find((entry) => entry.id === id);
}

/** Ein Baustein ohne Zeichnung, flach ausgegeben für Gates und Berichte. */
export interface BlockGapEntry {
  readonly id: BlockId;
  readonly status: 'not-measured' | 'measured-absent';
}

/** Alle Bausteine ohne Zeichnung, sortiert. `register.test.ts` nagelt die Liste fest. */
export function blockGaps(): readonly BlockGapEntry[] {
  return BLOCK_ENTRIES.flatMap((entry) =>
    entry.binding.status === 'measured' ? [] : [{ id: entry.id, status: entry.binding.status }],
  ).sort((a, b) => a.id.localeCompare(b.id));
}
