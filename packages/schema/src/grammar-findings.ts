/**
 * Belegstand einer Aussage der Grammatik, die nicht aus einer Messung am eigenen Motor stammt,
 * sondern aus dem Bestand gelesen oder dem Eigentümer vorgelegt wird.
 *
 * Eingeführt mit den Zustandsgruppen (LFH-565) und seit LFH-567 auch von den Mehrfachfähigkeiten
 * und Sonderformen benutzt. `StateGroupFinding` ist seitdem ein Alias dieses Typs.
 */

/** Beleg im Quelltext: Datei und Zeilenbereich relativ zu `packages/`, wie im Bausteinregister. */
export interface GrammarSourceEvidence {
  readonly definedAt: string;
  readonly note: string;
}

/**
 * Beleg an einer Referenzdatei. Die Werte stammen aus dem eingecheckten Kennzahlenartefakt
 * (`conformance/src/fingerprints.json`) oder aus einem Rezept, das die Datei als Fixture führt,
 * nicht aus der Datei selbst; die Gates dazu stehen in `conformance`.
 */
export interface GrammarFixtureEvidence {
  readonly asset: `${string}.svg`;
  readonly note: string;
}

export type GrammarEvidence = GrammarSourceEvidence | GrammarFixtureEvidence;

/**
 * Stand einer Aussage. Drei Zustände wie bei `ZoneBinding` und `BlockBinding`, damit „nicht belegt"
 * nie als Nullwert erscheint:
 *
 * - `evidenced`: im Bestand belegt. `evidence` nennt die Stellen, `remaining` das, was der Beleg
 *   offen lässt.
 * - `proposed`: nicht belegt, aber empfohlen. Die Entscheidung des Eigentümers steht aus; `reason`
 *   begründet die Empfehlung.
 * - `open`: weder belegt noch empfohlen. `question` ist die Frage an den Eigentümer.
 */
export type GrammarFinding<T> =
  | {
      readonly status: 'evidenced';
      readonly value: T;
      readonly evidence: readonly [GrammarEvidence, ...GrammarEvidence[]];
      readonly remaining?: string;
    }
  | { readonly status: 'proposed'; readonly value: T; readonly reason: string }
  | { readonly status: 'open'; readonly question: string };
