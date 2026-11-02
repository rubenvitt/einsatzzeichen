import type { SymbolSpec } from '@einsatzzeichen/schema';

/**
 * Sachgebiete der typischen Einsatzmittel. Der Schlüssel eines Eintrags beginnt mit dem Sachgebiet
 * (`sanitaet.ktw-typ-b`), damit er beim Lesen sagt, wohin er gehört, und Gruppen getrennt wachsen.
 */
export const TYPICAL_GROUP_IDS = Object.freeze([
  'sanitaet',
  'rettungsdienst',
  'betreuung',
  'versorgung',
  'fuehrung',
  'fachdienste',
  'feuerwehr',
  'thw',
] as const);

export type TypicalGroupId = (typeof TYPICAL_GROUP_IDS)[number];

export const TYPICAL_GROUP_TITLES: Readonly<Record<TypicalGroupId, string>> = Object.freeze({
  sanitaet: 'Sanitätsdienst',
  rettungsdienst: 'Rettungsdienst',
  betreuung: 'Betreuungsdienst',
  versorgung: 'Verpflegung, Logistik und Technik',
  fuehrung: 'Führung und IuK',
  fachdienste: 'Weitere Fachdienste',
  feuerwehr: 'Feuerwehr',
  thw: 'THW',
});

/**
 * Ein typisches Einsatzmittel, das die Baseline nicht als Beispiel führt: ein gängiges Fahrzeug,
 * eine Einheit oder eine Person aus der Praxis, zusammengesetzt aus den Bausteinen der Systematik.
 *
 * Anders als ein `Recipe` hat ein Eintrag **keine Referenzdatei**. Er ist kein Beleg des Motors,
 * sondern eine Vorbelegung für Anwendungen, die eine Auswahl brauchen (Fahrzeugliste, Plan,
 * Lagekarte). Die Zeichnung ist deshalb in der Regel abgeleitet (`Drawing.derivations`), und der
 * Eintrag nennt mit `pattern` die vermessenen Rezepte, deren Bauart er übernimmt.
 */
export interface TypicalSymbol {
  /** Ausgeschriebener Name, wie er in einer Auswahlliste stehen soll. */
  readonly title: string;
  /** Gängige Abkürzung, falls es eine gibt (`KTW-B`, `ELW 1`). */
  readonly abbreviation?: string;
  readonly group: TypicalGroupId;
  readonly spec: SymbolSpec;
  /**
   * Schlüssel aus `RECIPES` (auch `#alternative`), deren Bauart der Eintrag übernimmt: dieselbe
   * Körperform, Marke oder Lage des Kürzels. Mindestens einer; der Test prüft, dass es sie gibt.
   */
  readonly pattern: readonly string[];
  /** Fachlicher Bezug in einem Satz: Konzept, Norm oder Einsatzpraxis, aus der das Mittel stammt. */
  readonly context: string;
  /** Weitere Suchbegriffe, etwa Langformen oder regionale Bezeichnungen. */
  readonly aliases?: readonly string[];
}
