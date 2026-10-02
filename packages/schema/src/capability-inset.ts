import type { GrammarFinding } from './grammar-findings.js';
import type { BodyMarkRenditionId } from './body-mark-renditions.js';
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
  /**
   * Gesetzt, wenn die Fassung eine zweite oder weitere Fassung desselben Paars ist
   * (`SymbolSpec.bodyMarkRenditions`, LFH-786). Ohne Kennung gilt die Grundfassung; mit Kennung
   * zählt die Form für sich, weil ihre Faktoren von der Grundfassung abweichen dürfen.
   */
  readonly rendition?: BodyMarkRenditionId;
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
 * Wie ein Kapitel-4-Piktogramm aus der Boxfassung (`capabilities`) in einen Körper kommt:
 *
 * - `measured-rendition-only` — nur über eine eigene, an der Referenz vermessene Körperfassung
 *   (`bodyMarks`); sonst fail-closed.
 * - `unscaled-if-fits` — die Einzeldarstellung unverändert, sofern sie in den Körper passt.
 * - `uniform-scale-to-box` — die Einzeldarstellung gleichmäßig in die Fähigkeitsbox skaliert, bei
 *   fester Strichstärke.
 * - `measured-rendition-else-unscaled-if-fits` — „A, wo die Referenz spricht; B, wo sie schweigt“
 *   (LFH-787): Hat das Paar aus Fähigkeit und Körperfassung eine vermessene Fassung, gilt
 *   `measured-rendition-only`, die Boxfassung ist dort also abgelehnt und das Piktogramm kommt
 *   über `bodyMarks`. Ohne vermessene Fassung gilt `unscaled-if-fits`.
 * - `measured-rendition-else-unscaled-if-fits-else-fitted` — seit dem 2. Oktober 2026 (Entscheidung
 *   „ableiten statt ablehnen“): Hat das Paar eine vermessene Fassung, zeichnet `compose()` sie
 *   (die Boxfähigkeit wird wie `bodyMarks` gezeichnet); sonst die Einzeldarstellung unverändert,
 *   wo sie nachweislich in den Körper passt, und sonst gleichmäßig ins Innenfeld eingepasst
 *   (`uniform-scale-to-box` an der Körperform, als Ableitung vermerkt). Abgelehnt wird nichts.
 */
export type CapabilityInsetPolicy =
  | 'measured-rendition-only'
  | 'unscaled-if-fits'
  | 'uniform-scale-to-box'
  | 'measured-rendition-else-unscaled-if-fits'
  | 'measured-rendition-else-unscaled-if-fits-else-fitted';

/**
 * Die Entscheidung, was für die Boxfassung gilt: an Paaren ohne vermessene Fassung und, seit
 * LFH-787, auch an Paaren mit einer. Sie ist kein Beleg und steht deshalb nicht als
 * `GrammarFinding`, sondern mit Datum, Entscheider und Fundort.
 */
export interface CapabilityInsetDecision {
  /** Die Regel, auf die der Katalog hinarbeitet. */
  readonly target: CapabilityInsetPolicy;
  /** Was bis dahin gilt und von `validateSpec` geprüft wird. */
  readonly inForce: CapabilityInsetPolicy;
  /**
   * Die Regelkennung, mit der `inForce` an Paaren ohne vermessene Fassung geprüft wird. Fehlt,
   * wenn `inForce` nichts ablehnt (`measured-rendition-else-unscaled-if-fits-else-fitted`).
   */
  readonly rule?: string;
  /**
   * Die Regelkennung, mit der `validateSpec` die Boxfassung an Paaren mit vermessener Fassung
   * ablehnt. Gesetzt, wenn `inForce` zwischen beiden Fällen unterscheidet
   * (`measured-rendition-else-unscaled-if-fits`).
   */
  readonly measuredRule?: string;
  /** ISO-Datum der Entscheidung. */
  readonly decidedOn: string;
  readonly decidedBy: string;
  /** Pfad der Entscheidungsnotiz unter `docs/decisions/`. */
  readonly decidedIn: string;
}

/** Die Regel des Innenfelds für Kapitel-4-Piktogramme, Aussage für Aussage mit Belegstand. */
export interface CapabilityInsetRule {
  /**
   * Die Körperfassung zeichnet ihre Striche mit 0,5 mm: sie wird kleiner, der Strich nicht. Bis
   * LFH-786 hieß die Aussage „behält die Strichstärke der Einzeldarstellung“; seit C.2.18 ist sie
   * so gefasst, weil 4.7.18 als einzige Einzeldarstellung mit 0,4 mm zeichnet und seine
   * Körperfassung trotzdem mit 0,5 mm.
   */
  readonly strokeWidthKept: GrammarFinding<CapabilityInsetClaim>;
  /** Es gibt einen Faktor, der alle Einzeldarstellungen in ihre Körperfassung überführt. */
  readonly commonScale: GrammarFinding<CapabilityInsetClaim>;
  /** Die Körperfassung entsteht, indem die Einzeldarstellung in die Fähigkeitsbox eingepasst wird. */
  readonly fitToBox: GrammarFinding<CapabilityInsetClaim>;
  /** Eine Einzeldarstellung, die in den Körper passt, wird unverändert eingesetzt. */
  readonly unscaledWhereFits: GrammarFinding<CapabilityInsetClaim>;
  /** Eine verkleinerte Fassung hat in jeder Körperform dieselbe Größe. */
  readonly reducedSizeBodyInvariant: GrammarFinding<CapabilityInsetClaim>;
  /**
   * Was für die Boxfassung gilt: an Paaren aus Fähigkeit und Körperform ohne vermessene Fassung
   * und, seit LFH-787, auch an Paaren mit einer.
   */
  readonly unmeasuredPairs: CapabilityInsetDecision;
}
