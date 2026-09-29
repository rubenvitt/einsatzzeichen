import type { GrammarFinding } from './grammar-findings.js';
import type { BodyVariantId, CapabilityId, SymbolKind } from './taxonomy.js';

/**
 * Wie die Fassung eines Kapitel-4-Piktogramms **im Körper** zu seiner Einzeldarstellung auf der
 * 32 × 32-mm-Fläche steht (LFH-587). Die drei Werte sind aus den Körperfassungen des Bestands
 * gemessen, nicht vorab gesetzt:
 *
 * - `flush` — randbündig: die Fassung reicht auf mindestens einer Achse genau von Körperkante zu
 *   Körperkante. Sie ist auf die Hülle umgeformt, nicht skaliert (Kreuz, Zelt, Brandbekämpfung).
 * - `reduced` — freistehend und annähernd gleichmäßig verkleinert: die Faktoren in x und y liegen
 *   nahe beieinander (Verpflegung, Betriebsstoffe, Instandsetzung).
 * - `reshaped` — freistehend, aber ungleichmäßig: die Fassung ist eine eigene Zeichnung mit
 *   anderen Proportionen als die Einzeldarstellung (Zelt im Kreis, Welle der Wasserförderung).
 */
export type CapabilityInsetTreatment = 'flush' | 'reduced' | 'reshaped';

/** Spanne eines Faktors über die regelgemäßen Fixtures einer Körperfassung. */
export interface CapabilityInsetScale {
  readonly min: number;
  readonly max: number;
}

/**
 * Eine an der Referenz vermessene Körperfassung eines Kapitel-4-Piktogramms: Fähigkeit und
 * Körperform, mit der gemessenen Behandlung und den Faktoren der Mittellinienhülle gegenüber der
 * Einzeldarstellung.
 */
export interface CapabilityInsetForm {
  readonly capability: CapabilityId;
  readonly kind: SymbolKind;
  /** Gesetzt, wenn die Fassung eine Variante ist (wie in `BodyFormZones`). */
  readonly variant?: BodyVariantId;
  readonly treatment: CapabilityInsetTreatment;
  /** Breite der Körperfassung durch Breite der Einzeldarstellung, auf 0,01 gerundet. */
  readonly scaleX: CapabilityInsetScale;
  /** Höhe der Körperfassung durch Höhe der Einzeldarstellung, auf 0,01 gerundet. */
  readonly scaleY: CapabilityInsetScale;
  /** Fixtures (Schlüssel in `GRAMMAR_FIXTURES`), an denen die Fassung so gemessen ist. */
  readonly fixtures: readonly string[];
  /**
   * Fixtures dieser Körperfassung, in denen die Marke als benannte Kombinationsausnahme
   * (`CAPABILITY_COMBINATION_EXCEPTIONS`, LFH-567) anders behandelt ist. Sie zählen nicht zu den
   * Faktoren.
   */
  readonly exceptions: readonly string[];
}

/** Ob eine Aussage über das Einsetzen im Bestand trägt oder von ihm widerlegt ist. */
export type CapabilityInsetClaim = 'holds' | 'refuted';

/**
 * Wie ein Kapitel-4-Piktogramm in einen Körper kommt, für den keine Körperfassung vermessen ist:
 *
 * - `measured-rendition-only` — nur über eine eigene, an der Referenz vermessene Körperfassung
 *   (`bodyMarks`); sonst fail-closed.
 * - `unscaled-if-fits` — die Einzeldarstellung unverändert, sofern sie in den Körper passt.
 * - `uniform-scale-to-box` — die Einzeldarstellung gleichmäßig in die Fähigkeitsbox skaliert, bei
 *   fester Strichstärke.
 */
export type CapabilityInsetPolicy =
  | 'measured-rendition-only'
  | 'unscaled-if-fits'
  | 'uniform-scale-to-box';

/** Die Regel des Innenfelds für Kapitel-4-Piktogramme, Aussage für Aussage mit Belegstand. */
export interface CapabilityInsetRule {
  /** Die Körperfassung behält die Strichstärke der Einzeldarstellung. */
  readonly strokeWidthKept: GrammarFinding<CapabilityInsetClaim>;
  /** Es gibt einen Faktor, der alle Einzeldarstellungen in ihre Körperfassung überführt. */
  readonly commonScale: GrammarFinding<CapabilityInsetClaim>;
  /** Die Körperfassung entsteht, indem die Einzeldarstellung in die Fähigkeitsbox eingepasst wird. */
  readonly fitToBox: GrammarFinding<CapabilityInsetClaim>;
  /** Eine Einzeldarstellung, die in den Körper passt, wird unverändert eingesetzt. */
  readonly unscaledWhereFits: GrammarFinding<CapabilityInsetClaim>;
  /** Eine verkleinerte Fassung hat in jeder Körperform dieselbe Größe. */
  readonly reducedSizeBodyInvariant: GrammarFinding<CapabilityInsetClaim>;
  /** Was für Paare aus Fähigkeit und Körperform ohne vermessene Fassung gilt. */
  readonly unmeasuredPairs: GrammarFinding<CapabilityInsetPolicy>;
}
