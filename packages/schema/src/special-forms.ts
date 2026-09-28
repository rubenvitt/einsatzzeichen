import type { GrammarFinding } from './grammar-findings.js';
import type { SymbolKind } from './taxonomy.js';
import type { ZoneBinding, ZoneId } from './zones.js';

/**
 * Die Sonderformen aus Kapitel 3, Abschnitte 3.6 bis 3.9 (LFH-567).
 *
 * **Bewusst keine `SymbolKind`.** Eine Körperform in `SymbolKind` verlangt eine Zeichnung, ein
 * Layoutprofil und ein Zonenmodell, das `compose()` benutzt. Keine der vier Formen ist vermessen:
 * die Referenzdateien sind nicht eingecheckt, und das Kennzahlenartefakt führt für 3.6 und 3.9 nur
 * eine Hülle, für 3.7 und 3.8 gar keine Form. Die Sonderformen stehen deshalb **neben** den
 * Körperformen im Zonenmodell, mit derselben Zonenstruktur (`Record<ZoneId, ZoneBinding>`), aber
 * ohne Zugang zum Kompositionsmotor. Ob und wie sie `SymbolKind` werden, ist eine Frage an den
 * Eigentümer (`docs/decisions/2026-09-28-lfh-567-mehrfachfaehigkeiten-und-sonderformen.md` §5, Frage 7).
 */
export type SpecialFormId = 'drone' | 'two-wheeler' | 'motorized-two-wheeler' | 'temporary-fixed-structure';

/**
 * Welche Rolle eine Sonderform im Zeichen spielt:
 *
 * - `body-form` — eine eigene Körperform wie die Grundzeichen aus Kapitel 1.
 * - `mark` — eine Marke, die in oder an einer anderen Körperform steht.
 */
export type SpecialFormRole = 'body-form' | 'mark';

export interface SpecialForm {
  readonly id: SpecialFormId;
  /** Der Abschnitt aus Kapitel 3. */
  readonly section: `3.${6 | 7 | 8 | 9}`;
  readonly title: string;
  /** Die Referenzdatei des Abschnitts. */
  readonly asset: `${string}.svg`;
  /** Ob die Sonderform eine eigene Körperform oder eine Marke ist. */
  readonly role: GrammarFinding<SpecialFormRole>;
  /**
   * Die Körperform, der die Sonderform am nächsten steht, oder `null`, wenn keine. Sagt nichts
   * über Maße: eine verwandte Körperform liefert keine Zahl für die Sonderform.
   */
  readonly relatedKind: GrammarFinding<SymbolKind | null>;
  /** Die Zonen, vollständig wie in `BodyFormZones`. */
  readonly zones: Readonly<Record<ZoneId, ZoneBinding>>;
}
