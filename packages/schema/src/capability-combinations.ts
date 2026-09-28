import type { GrammarFinding } from './grammar-findings.js';
import type { BodyMarkId, BodyVariantId, SymbolKind } from './taxonomy.js';

/**
 * Die zwei Darstellungen einer Fähigkeit im Zeichen, je mit eigenem Feld in `SymbolSpec`:
 *
 * - `flush` — randbündig über die Körperhülle (`bodyMarks`), wie Anhang D und F sie führen.
 * - `box` — das Kapitel-4-Piktogramm in seiner festen Box 4/8/24/16 mm (`capabilities`).
 */
export type CapabilityPresentation = 'flush' | 'box';

/**
 * Wie zwei oder mehr Fähigkeiten in einem Zeichen zueinander stehen. Die drei Möglichkeiten nennt
 * LFH-567:
 *
 * - `overlay` — jede Fähigkeit in ihrer Einzelfassung auf derselben Fläche, übereinander.
 * - `division` — die Fläche wird geteilt, jede Fähigkeit bekommt ein eigenes Feld.
 * - `reduction` — jede Fähigkeit wird verkleinert und steht neben den anderen.
 */
export type CapabilityArrangement = 'overlay' | 'division' | 'reduction';

/** Ob die Reihenfolge der Fähigkeiten das Bild ändert. */
export type CapabilityOrder = 'irrelevant' | 'significant';

/**
 * Eine Körperfassung, an der Originale zwei oder mehr Fähigkeiten in einem Zeichen tragen.
 * Gezählt werden nur `CapabilityId`s; rein technische Körpermarken (`TechnicalBodyMarkId`) daneben
 * machen eine Kombination nicht zur Mehrfachfähigkeit.
 */
export interface CapabilityCombinationForm {
  readonly kind: SymbolKind;
  /** Gesetzt, wenn die Fassung eine Variante ist (wie in `BodyFormZones`). */
  readonly variant?: BodyVariantId;
  /** Fixtures (Schlüssel in `GRAMMAR_FIXTURES`), die an dieser Fassung der Regel folgen. */
  readonly fixtures: readonly string[];
  /** Fixtures dieser Fassung, die als benannte Ausnahme abweichen. */
  readonly exceptions: readonly string[];
}

/**
 * Eine Kombination, in der eine Marke an anderer, eigens vermessener Stelle steht als allein.
 * Sie ist keine Regel: die Abweichungen laufen zwischen den Fixtures in verschiedene Richtungen
 * (siehe `docs/decisions/2026-09-28-lfh-567-mehrfachfaehigkeiten-und-sonderformen.md` §3.3).
 */
export interface CapabilityCombinationException {
  /** Schlüssel der Fixture in `GRAMMAR_FIXTURES`. */
  readonly fixture: string;
  readonly asset: `${string}.svg`;
  readonly kind: SymbolKind;
  readonly variant?: BodyVariantId;
  /** Die vollständige Markenmenge, an der die Ausnahme hängt, in Rezeptreihenfolge. */
  readonly marks: readonly BodyMarkId[];
  /** Die Marken, deren Zeichnung in dieser Menge von der Einzelfassung abweicht. */
  readonly overrides: readonly BodyMarkId[];
  /** Was abweicht, übernommen vom Fundort. */
  readonly note: string;
  /** Der Fundort der Kombinationsfassung. */
  readonly definedAt: string;
}

/** Die Regel für mehrere Fähigkeiten einer Darstellung. */
export interface CapabilityCombinationRule {
  readonly presentation: CapabilityPresentation;
  /** Das Feld in `SymbolSpec`, das die Fähigkeiten dieser Darstellung trägt. */
  readonly field: 'bodyMarks' | 'capabilities';
  /** Wie die Fähigkeiten zueinander stehen. */
  readonly arrangement: GrammarFinding<CapabilityArrangement>;
  /** Ob die Reihenfolge das Bild ändert. */
  readonly order: GrammarFinding<CapabilityOrder>;
  /** Die größte Zahl von Fähigkeiten, die ein Original in dieser Darstellung trägt. */
  readonly maxObserved: GrammarFinding<number>;
  /** Wie viele Fähigkeiten ein Zeichen in dieser Darstellung höchstens tragen darf. */
  readonly perSign: GrammarFinding<number>;
  /** Die Körperfassungen mit mehrfach belegtem Original. Leer heißt: keine. */
  readonly forms: readonly CapabilityCombinationForm[];
  /** Was an den übrigen Körperfassungen gilt. */
  readonly otherForms: GrammarFinding<CapabilityArrangement>;
  /** Kombinationen mit eigens vermessener Lage, als benannte Ausnahme. */
  readonly exceptions: readonly CapabilityCombinationException[];
  /**
   * Vorgemerkte Regelkennungen (`PLANNED_CAPABILITY_RULES`). Sie sind **nicht in Kraft**: ob sie
   * gelten, entscheidet der Eigentümer.
   */
  readonly plannedRules: readonly string[];
}
