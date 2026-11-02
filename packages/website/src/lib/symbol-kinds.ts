import type { SymbolKind } from './snapshot-schema.js';

/**
 * Die fünf Arten, aus denen ein Zeichen der Website kommt, in Alltagssprache (LFH-1116, ESZ-146,
 * ESZ-147).
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
 * - `freestanding`: ohne Grundzeichen, als Pfeil, Linie, Wetter, Tierzustand, Zustand oder
 *   Piktogramm (`docs/decisions/2026-10-21-esz-146-freistehend-im-katalog.md`). Die Art sagt, wie
 *   das Zeichen gebaut ist, nicht ob es vermessen ist: das steht wie bei den anderen am Prüfstand.
 * - `typical`: ein typisches Einsatzmittel aus `TYPICAL_SYMBOLS` (ESZ-147), ein gängiges Fahrzeug,
 *   eine Einheit oder Person ohne Beispiel in der Vorlage, aus den Bausteinen der Systematik nach
 *   der Bauart vermessener Rezepte zusammengesetzt. Keine Referenzdatei, keine Manifestzeile.
 */
export const SYMBOL_KIND_LABELS: Readonly<Record<SymbolKind, string>> = Object.freeze({
  'catalog-entry': 'aus der Vorlage vermessen',
  'composition-recipe': 'aus Grundzeichen zusammengesetzt',
  'derived-place': 'abgeleitet aus der Leitstelle',
  freestanding: 'freistehend, ohne Grundzeichen',
  typical: 'typisches Einsatzmittel, ohne Vorlage zusammengesetzt',
});

/**
 * Die Kapitelbezeichnung der abgeleiteten Orte. Sie ersetzt den Abschnitt der Vorlage: im Kapitel
 * des Originals („Anhang D.2") stünden die Orte als Zeichen da, die die Vorlage führt.
 */
export const DERIVED_PLACE_CHAPTER = 'Abgeleitete Orte';

/**
 * Die Kapitel der typischen Einsatzmittel (ESZ-147): eine Gruppe je Sachgebiet, „Typische
 * Einsatzmittel: Sanitätsdienst". Wie bei den Orten ersetzt das Kapitel den Abschnitt der Vorlage,
 * den es für diese Zeichen nicht gibt.
 *
 * Nur das Präfix steht hier, nicht die Sachgebietstitel: dieses Modul läuft auch in der
 * Explorer-Insel, und `TYPICAL_GROUP_TITLES` käme aus dem Prüfpaket, das nicht ins Browserbündel
 * gehört. Den Titel setzt `symbolForTypical` zur Bauzeit ein.
 */
export const TYPICAL_CHAPTER_PREFIX = 'Typische Einsatzmittel: ';

export function typicalChapter(groupTitle: string): string {
  return `${TYPICAL_CHAPTER_PREFIX}${groupTitle}`;
}

export function isTypicalChapter(chapter: string): boolean {
  return chapter.startsWith(TYPICAL_CHAPTER_PREFIX);
}
