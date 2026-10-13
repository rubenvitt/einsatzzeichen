import type { GrammarFinding } from './grammar-findings.js';
import type { BodyVariantId, SymbolKind, TechnicalBodyMarkId } from './taxonomy.js';
import type { ZoneBinding, ZoneId } from './zones.js';

/**
 * Die Sonderformen aus Kapitel 3, Abschnitte 3.6 bis 3.9 (LFH-567).
 *
 * **Bewusst keine `SymbolKind`.** Eine Körperform in `SymbolKind` verlangt eine Zeichnung, ein
 * Layoutprofil und ein Zonenmodell, das `compose()` benutzt. Seit LFH-577 (29.09.2026) sind die
 * vier Formen an den Referenzdateien vermessen und gezeichnet (`core/src/geometry/special-form-bodies.ts`),
 * aber keine Referenzdatei setzt eine von ihnen als Körper mit Kopf, Fuß oder Beschriftung ein: die
 * Drohne erscheint nur als Innenzeichen, der Giebel aus 3.9 nur als Marke über einem Träger, die
 * Zweiräder gar nicht. Die Sonderformen stehen deshalb **neben** den Körperformen im Zonenmodell,
 * mit derselben Zonenstruktur (`Record<ZoneId, ZoneBinding>`), aber ohne Zugang zum
 * Kompositionsmotor. Ob und wie sie `SymbolKind` werden, ist eine Frage an den Eigentümer
 * (`docs/decisions/2026-09-28-lfh-567-mehrfachfaehigkeiten-und-sonderformen.md` §5, Frage 7, und
 * Nachtrag vom 29.09.2026).
 *
 * Seit ESZ-134 (13.10.2026) stehen 3.6 bis 3.8 als Einzelpiktogramm im Raum `special-form.*` und
 * damit freistehend auf der Lagekarte; die Drohne im Körper zeichnen die vermessenen Körpermarken
 * aus `DRONE_BODY_MARKS` (`docs/decisions/2026-10-13-esz-134-sonderformen-als-piktogramme.md`).
 */
export type SpecialFormId = 'drone' | 'two-wheeler' | 'motorized-two-wheeler' | 'temporary-fixed-structure';

/**
 * Die Sonderformen, die als Einzelpiktogramm im Raum `special-form.*` stehen (ESZ-134): 3.6 bis 3.8.
 * Freistehend erreichbar über `{ kind: 'pictogram', pictogram: 'special-form.<id>' }`.
 *
 * 3.9 fehlt bewusst: die Kapiteldatei zeigt den Giebel über einem Platzhalter für „irgendein
 * Grundzeichen". Allein gezeichnet wäre er ein Dach ohne Träger; am Körper ist er die Variante
 * `circle-12`/`raised-gable`.
 */
export const SPECIAL_FORM_PICTOGRAM_IDS = ['drone', 'two-wheeler', 'motorized-two-wheeler'] as const;

export type SpecialFormPictogramId = (typeof SPECIAL_FORM_PICTOGRAM_IDS)[number];

/** Wache zur Übersetzungszeit: jede Kennung des Piktogrammraums ist eine Sonderform. */
true satisfies (SpecialFormPictogramId extends SpecialFormId ? true : false);

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

/**
 * Eine Sonderform als Innenzeichen in einem anderen Körper, wie ein Original sie zeigt (ESZ-134).
 *
 * Die Spec dafür ist `{ kind, bodyVariant?, bodyMarks: [bodyMark] }`: die Marke ist eine
 * technische Körpermarke, vermessen an genau dieser Datei. Sie trägt keinen einheitlichen
 * Drohnen-Maßstab, denn die Originale widersprechen einem (LFH-567, Nachtrag 29.09.2026).
 */
export interface SpecialFormBodyMark {
  readonly form: SpecialFormId;
  /** Abschnitt des Originals, etwa `I.1.20`. */
  readonly section: string;
  readonly asset: `${string}.svg`;
  readonly kind: SymbolKind;
  readonly bodyVariant?: BodyVariantId;
  readonly bodyMark: TechnicalBodyMarkId;
  /** Was die Marke außer der Sonderform zeigt, in einem Satz. */
  readonly note: string;
}
