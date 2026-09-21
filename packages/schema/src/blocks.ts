import type { SourceReference } from './provenance.js';
import type { ZoneId } from './zones.js';

/**
 * Die Kategorien des Bausteinregisters. Die zwölf Begriffe stammen aus der Scope-Entscheidung
 * vom 13. September 2026 (`docs/decisions/2026-09-13-grammatik-motor-und-paketschnitt.md`,
 * Tabelle „Begriffe"): Grundzeichen, Farbe, Stärke, Verband, Verwaltungsstufe, Fahrwerk,
 * Fähigkeit, Funktionsfassung, Zustand, Tendenz, Pfeil, Linie.
 *
 * **Zwei Kategorien sind hinzugekommen: `technical-head-mark` und `body-mark`.** Beide sind heute
 * Felder von `SymbolSpec` und haben eine eigene Geometrie. Fehlten sie hier, wäre das Register
 * gegenüber der Spec unvollständig, und die Regelabdeckung (LFH-568) hätte Werte, zu denen es
 * keinen Baustein gibt.
 */
export type BlockCategory =
  | 'base-symbol'
  | 'color'
  | 'strength'
  | 'unit-grouping'
  | 'administrative-level'
  | 'technical-head-mark'
  | 'chassis'
  | 'capability'
  | 'body-mark'
  | 'function-role'
  | 'state'
  | 'tendency'
  | 'arrow'
  | 'line';

/**
 * Kennung eines Bausteins: Kategorie und Wert, getrennt durch `/`. Varianten der Grundzeichen
 * hängen die Variante als drittes Segment an (`base-symbol/vehicle-air/raised-hull`).
 */
export type BlockId = `${BlockCategory}/${string}`;

/**
 * Die Zielzone eines Bausteins, also der Ort, an dem die Grammatik ihn platziert.
 * `freestanding` steht für einen Baustein, der selbst ein Zeichen ist und nicht auf einem Körper
 * sitzt. Ob die Zone an einer Körperform vermessen ist, sagt das Zonenmodell. Das Register
 * wiederholt diese Aussage nicht.
 */
export type BlockZone = ZoneId | 'freestanding';

/**
 * Fundort der heutigen Zeichnung. Er ist gleich gebaut wie `ZoneProvenance`: das Register erfindet
 * keine Messung, sondern zeigt auf die Stelle, an der die Geometrie mit ihrer Herkunft steht.
 */
export interface BlockProvenance {
  /** Datei und Zeilenbereich relativ zu `packages/`, z. B. `core/src/geometry/strengths.ts:63–90`. */
  readonly definedAt: string;
  /** Die Herkunftsaussage des Fundorts, übernommen und nicht neu formuliert. */
  readonly note: string;
  /** Wird nur gesetzt, wenn der Fundort selbst einen Abschnitt der Referenz nennt. */
  readonly sourceRefs?: readonly SourceReference[];
}

/** Ein Baustein ohne Geometrie, mit Begründung und der Stelle, die die Lücke schon benennt. */
export interface BlockGap {
  readonly reason: string;
  readonly definedAt: string;
}

/**
 * Messstand eines Bausteins. Es gibt drei Zustände wie bei `ZoneBinding`:
 *
 * - `measured`: Eine Zeichnung liegt vor, `geometry` zeigt auf sie.
 * - `not-measured`: Der Wert ist bekannt, aber es gibt keine Zeichnung. Das ist eine Lücke und
 *   kein Nullwert.
 * - `measured-absent`: Es wurde nachgesehen, und die Referenz führt den Baustein nicht.
 */
export type BlockBinding =
  | { readonly status: 'measured'; readonly geometry: BlockProvenance }
  | { readonly status: 'not-measured'; readonly gap: BlockGap }
  | { readonly status: 'measured-absent'; readonly gap: BlockGap };

/**
 * Eine Kombinationsbindung, die der heutige Motor dem Baustein auferlegt, zum Beispiel die
 * Verwaltungsstufe, die nur zusammen mit einer Funktionsfassung gesetzt wird. Sie wird als
 * **benannte Ausnahme** geführt und nie als stiller Sonderpfad. `ruleId` muss im Regelkatalog
 * (`RULE_CATALOG` oder `COMPOSITION_RULE_CATALOG`) stehen.
 */
export interface BlockCombinationBinding {
  readonly ruleId: string;
  readonly definedAt: string;
  readonly reason: string;
}

/** Ein Eintrag des Bausteinregisters. */
export interface BlockEntry {
  readonly id: BlockId;
  readonly category: BlockCategory;
  /** Der Wert aus der Werteliste des Schemas, bei Varianten `<kind>/<variant>`. */
  readonly valueId: string;
  readonly zone: BlockZone;
  readonly binding: BlockBinding;
  readonly combinationBinding?: BlockCombinationBinding;
}

/**
 * Eine Kategorie, für die das Schema noch keine Werte kennt. Sie wird nicht mit erfundenen
 * Kennungen belegt, sondern bleibt als Lücke mit dem Ticket stehen, das sie schließt.
 */
export interface BlockCategoryGap {
  readonly category: BlockCategory;
  readonly reason: string;
  readonly definedAt: string;
  readonly ticket: string;
}
