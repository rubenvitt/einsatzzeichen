import type { SymbolKind } from './snapshot-schema.js';

/**
 * Die drei Arten, aus denen ein Zeichen der Website kommt, in Alltagssprache (LFH-1116).
 *
 * Bis LFH-1116 standen die zwei Beschriftungen nur im Kopf der Zeichenseite. Mit der dritten Art
 * braucht sie auch die Art-Facette des Explorers, und zwei Tabellen derselben Wörter liefen
 * auseinander, sobald eine davon nachgezogen würde.
 *
 * - `catalog-entry`: an der Vorlage vermessen; gezeigt wird die gemessene Darstellung.
 * - `composition-recipe`: aus Grundzeichen nach einem Abschnitt der Vorlage zusammengesetzt.
 * - `derived-place`: ein Ort mit eigener Kennung, für den es keine Vorlage gibt. Körper, Giebel,
 *   Kappe und Schriftlauf stammen von der vermessenen Leitstelle D.2.5
 *   (`docs/decisions/2026-10-09-lfh-1116-orte-im-katalog.md`).
 */
export const SYMBOL_KIND_LABELS: Readonly<Record<SymbolKind, string>> = Object.freeze({
  'catalog-entry': 'aus der Vorlage vermessen',
  'composition-recipe': 'aus Grundzeichen zusammengesetzt',
  'derived-place': 'abgeleitet aus der Leitstelle',
});

/**
 * Die Kapitelbezeichnung der abgeleiteten Orte. Sie ersetzt den Abschnitt der Vorlage: im Kapitel
 * des Originals („Anhang D.2") stünden die Orte als Zeichen da, die die Vorlage führt.
 */
export const DERIVED_PLACE_CHAPTER = 'Abgeleitete Orte';
