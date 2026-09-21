import type { SourceReference } from '@einsatzzeichen/schema';

/**
 * Der Regelkatalog: welche Bausteine zusammen dürfen, als **Daten** statt als Kontrollfluss —
 * mit stabiler Kennung, Einordnung, Dimension, Begründung und Quellenbezug (LFH-563).
 *
 * ---------------------------------------------------------------------------------------------
 * **Warum der Katalog neben `VALIDATION_RULE_IDS` steht und nicht an dessen Stelle**
 *
 * Der naheliegende Umbau wäre gewesen, die Inline-Literale in `validate.ts` durch Katalogverweise
 * zu ersetzen (`rule: RULES.strengthRequiresUnit.id`). Das ist bewusst **nicht** geschehen, und
 * der Grund ist ein Gate, nicht Geschmack:
 *
 * `validation-rules.test.ts` prüft die Mengengleichheit von `VALIDATION_RULE_IDS` und den
 * tatsächlich geprüften Regeln per **Quelltextscan** auf `/rule: '([a-z0-9-]+)'/` in
 * `validate.ts`. Das ist das stärkste Gate des Pakets: „die Liste enthält genau das, was der
 * Quelltext prüft." Würden die Literale zu Katalogverweisen, fände der Scan **null** Kennungen,
 * beide Differenzmengen wären leer, und der Test bestünde fortan tautologisch — er prüfte
 * nichts mehr.
 *
 * Der Katalog tritt deshalb als **dritte, gegengeprüfte Sicht** daneben: `rule-catalog.test.ts`
 * nagelt die Mengengleichheit von Katalog und `VALIDATION_RULE_IDS` in beide Richtungen fest und
 * zählt zusätzlich die Auslösestellen je Kennung im Quelltext gegen das Feld `sites`.
 *
 * Die Umstellung von `validate.ts` selbst ist ein **späterer Slice**. Sie braucht dann einen
 * Ersatz für den Quelltextscan: ein Laufzeit-Gate, das belegt, dass jede Katalogregel von einem
 * Fall tatsächlich ausgelöst wird. Seit LFH-568 gibt es dieses Gate: `catalog/src/rule-evidence.ts`
 * führt je Regel einen auslösenden Fall oder eine benannte Lücke, und `rule-evidence.test.ts` löst
 * jeden Fall zur Laufzeit aus. Der Umbau von `validate.ts` bleibt trotzdem ein eigener Slice. Siehe
 * `docs/decisions/2026-09-20-regelkatalog-als-daten.md`.
 *
 * ---------------------------------------------------------------------------------------------
 * **Einordnung `kind`: fachliche Regel der Systematik vs. technische Grenze des Motors**
 *
 * Die Trennlinie, an der jeder Eintrag gemessen wurde:
 *
 * - `'systematik'` — eine Fachkundige mit der gedruckten Systematik in der Hand erkennt die Regel
 *   wieder, ohne diesen Quelltext zu kennen. Praktisch sind das zwei Familien: **Zonenkollision**
 *   (eine Zone trägt genau einen Baustein — Kopfzone, Fußstreifen, Körperfläche, Fahrwerkszone)
 *   und **Trägerbindung** (ein Baustein gehört fachlich nur an bestimmte Träger, etwa die Stärke
 *   an eine taktische Einheit).
 * - `'engine'` — die Ablehnung hängt an **diesem Motor**: an einer fehlenden Messung, einem
 *   fehlenden Profilwert oder einer nicht darstellbaren Zahl. Diese Regeln verschwinden oder
 *   verengen sich, sobald die Grammatik die fehlende Größe herleitet.
 *
 * Drei Einordnungen, die man auch anders treffen könnte, und warum sie so stehen:
 *
 * - Mehrere Zonenkollisionen formuliert `validate.ts` mit dem Zusatz „ohne vermessene
 *   Ausweichposition" (`chassis-foot-conflict`, `surface-label-foot-conflict`). Dieser Zusatz ist
 *   der Grund, warum der Motor **keine Ausweichlösung anbietet** — nicht der Grund der Ablehnung.
 *   Die Ablehnung selbst ist die Kollision, also fachlich. Deshalb `'systematik'`.
 * - `vehicle-category-requires-vehicle` klingt fachlich („Fahrzeugkategorie nur am Fahrzeug"), ist
 *   aber **enger** als die Systematik: die umgesetzte Menge sind die drei Körperformen, an denen
 *   eine Fahrwerkszone **vermessen** wurde (Kommentar an `CHASSIS_KINDS`: „Gemessen, nicht
 *   angenommen … 25 von 31"). Luft- und Wasserfahrzeug sind fachlich Fahrzeuge und fallen
 *   trotzdem heraus. Deshalb `'engine'`.
 * - `designation-not-blank` und `label-not-blank` sehen nach Datenhygiene aus, tragen aber eine
 *   Motorbegründung: ein leerer Lauf erzeugt ein Textprimitiv ohne Tinte, das jedes Gate besteht
 *   und im Bild fehlt. Deshalb `'engine'`.
 *
 * Die sechs `-not-measured`-Kennungen und alle „… requires measured …"-Kennungen sind
 * durchweg `'engine'`; das ist der erwartete Befund und zugleich der Kern des Grammatik-Umbaus:
 * heute lehnt der Motor **64 von 72** Kombinationen ab, weil eine Messung fehlt, und nur **8**,
 * weil die Systematik sie verbietet.
 *
 * ---------------------------------------------------------------------------------------------
 * **`reason` und `reasonSource`: warum es die Regel gibt — und wo das heute steht**
 *
 * `reason` ist die Begründung in einem Satz, aus dem Bestand gezogen und nicht erfunden. Sie
 * stammt aus einer von zwei Stellen, und `reasonSource` sagt aus welcher:
 *
 * - `'core'` — die Begründung steht in `packages/core` selbst: in der Meldung oder im Kommentar
 *   an der Prüfstelle in `validate.ts`, bei den Kompositionsregeln in `compose.ts` oder
 *   `text-metrics.ts`. Sie liegt damit neben dem Code, den sie erklärt.
 * - `'website'` — die Begründung steht **nur** in
 *   `packages/website/src/lib/rule-explanations.ts`. Der Kern selbst wiederholt an diesen Stellen
 *   nur den Prüfausdruck in Worten („muss endlich und größer als null sein"). Diese Sätze sind
 *   hierher **von Hand gezogen**.
 *
 * Das ist die eigentliche Aussage dieses Feldes: **27 der 72 Beschreibungsregeln** (mit der
 * einen Kompositionsregel 28 Einträge) begründet heute allein die Website.
 *
 * **Gegatet sind sie seit dem 21. September 2026.** Ein Gate in `core` ist unmöglich — `core`
 * darf `website` nicht importieren —, aber die Gegenrichtung ist erlaubt: In
 * `packages/website/src/lib/rule-explanations.test.ts` steht seit der Entscheidung zu Option 2
 * ein Block, der genau die Einträge mit `reasonSource: 'website'` aus diesem Katalog zieht und
 * die Erklärung, aus der ihr Satz stammt, per Fingerabdruck festnagelt. Wer die Erklärung
 * umschreibt, wird dort aufgefordert, den Satz hier zu prüfen. Wandert eine Begründung in den
 * Kern, wechselt ihr Eintrag auf `'core'` und fällt aus dem Gate — die Deckungsgleichheit beider
 * Listen erzwingt derselbe Block.
 *
 * `reason: null` heißt **Begründung nicht belegt** und ist der ausdrückliche Vermerk für den Fall,
 * dass weder Kern noch Website einen Grund nennen. Diese Liste ist derzeit **leer** und im Test
 * festgenagelt: der Bestand dokumentiert heute jede Regel irgendwo. Wächst sie, fällt das auf.
 *
 * ---------------------------------------------------------------------------------------------
 * **`source`: Herkunft über `SourceReference`, nicht über eine zweite Mechanik**
 *
 * Verwendet wird `SourceReference` aus `packages/schema/src/provenance.ts`. Der Status ist
 * durchweg `'derived'`: `'verbatim'` behauptet „Geometrie entspricht der Referenz und ist per
 * Fingerprint belegt", und eine Regel hat weder Geometrie noch Fingerprint. Ein Quellenbezug
 * steht nur dort, wo `validate.ts` an der Prüfstelle selbst einen Abschnitt nennt; sonst `null`.
 * Ein Eintrag mit Quelle, aber ohne Abschnitt, wäre eine Behauptung ohne Fundstelle.
 *
 * ---------------------------------------------------------------------------------------------
 * `core` bleibt ohne Fremd- und Node-Abhängigkeit: dieses Modul ist reine Daten, kein `node:fs`.
 */

/** Fachliche Regel der Systematik oder technische Grenze dieses Motors. Siehe Modulkommentar. */
export type RuleKind = 'systematik' | 'engine';

/**
 * Wann die Regel greift. `'spec'` prüft die Beschreibung, bevor etwas gezeichnet ist (das ist die
 * Menge aus `VALIDATION_RULE_IDS`). `'composition'` entsteht erst, wenn die Komposition den
 * Textlauf gesetzt und gegen seine Box gemessen hat — dafür braucht es Geometrie, die es zur
 * Prüfzeit noch nicht gibt.
 */
export type RulePhase = 'spec' | 'composition';

/**
 * Wo die Begründung im Bestand steht. `'website'` bedeutet: von Hand kopiert, ungegatet. Siehe
 * Modulkommentar.
 */
export type RuleReasonSource = 'core' | 'website';

/**
 * Die Dimensionen der Systematik, über die Regeln überhaupt sprechen können — geschlossene Union.
 *
 * Abgeglichen mit den 16 Wertachsen in `packages/catalog/src/rule-coverage.ts`. Unterschiede und
 * ihr Grund:
 *
 * - `kind` und `bodyVariant` der Achsenliste stehen hier als `'base-symbol'` und
 *   `'body-variant'` — die Regeln trennen beide deutlich.
 * - `'label'` hat **keine** Wertachse (Beschriftung ist freier Text, kein Werteraum), trägt aber
 *   44 der 72 Regeln. Ohne diese Dimension wäre der Katalog unbrauchbar.
 * - `'composition'` ist keine Dimension der Systematik, sondern die Einordnung für Regeln, deren
 *   Auflösung überhaupt kein einzelnes Feld benennt. Dasselbe Wort und derselbe Grund wie in
 *   `rule-explanations.ts`; bislang genau `head-zone-conflict`.
 * - `'unit-grouping'` (Verbände 5.5), `'state'` und `'tendency'` (5.8), `'movement'` (5.2) und
 *   `'lines-and-boundaries'` (Kapitel 2) haben **weder** eine Wertachse **noch** ein Feld in
 *   `SymbolSpec` — sie stehen hier, weil der Katalog sonst nicht sagen könnte, dass zu ihnen
 *   keine Regel existiert. Genau das steht in `RULE_DIMENSION_GAPS`.
 * - Die Piktogrammachsen `comms`, `damage`, `wildfire`, `leadership` und
 *   `water-rescue-personnel` fehlen bewusst: sie beschreiben eigenständige Piktogramme, die
 *   nicht in `SymbolSpec` stehen und an denen `validateSpec` nichts prüft.
 */
export type RuleDimension =
  | 'base-symbol'
  | 'body-variant'
  | 'organization'
  | 'technical-fill'
  | 'strength'
  | 'unit-grouping'
  | 'administrative-level'
  | 'technical-head-mark'
  | 'chassis'
  | 'capabilities'
  | 'body-marks'
  | 'function-role'
  | 'state'
  | 'tendency'
  | 'movement'
  | 'lines-and-boundaries'
  | 'label'
  | 'composition';

/**
 * Dieselben Werte zur Laufzeit. Der Test prüft damit, dass jede Dimension der Union in einem
 * Eintrag oder in der Lückenliste vorkommt — eine stille dritte Möglichkeit gibt es nicht.
 */
export const RULE_DIMENSIONS: readonly RuleDimension[] = Object.freeze([
  'base-symbol',
  'body-variant',
  'organization',
  'technical-fill',
  'strength',
  'unit-grouping',
  'administrative-level',
  'technical-head-mark',
  'chassis',
  'capabilities',
  'body-marks',
  'function-role',
  'state',
  'tendency',
  'movement',
  'lines-and-boundaries',
  'label',
  'composition',
] as const satisfies readonly RuleDimension[]);

export interface RuleCatalogEntry {
  /** Stabile Kennung, wortgleich mit `VALIDATION_RULE_IDS` beziehungsweise mit `compose.ts`. */
  readonly id: string;
  readonly kind: RuleKind;
  readonly dimension: RuleDimension;
  readonly phase: RulePhase;
  /** Warum es die Regel gibt, in einem Satz — oder `null`: Begründung nicht belegt. */
  readonly reason: string | null;
  /** Wo diese Begründung im Bestand steht; `null` genau dann, wenn `reason` `null` ist. */
  readonly reasonSource: RuleReasonSource | null;
  /** Quellenbezug, wo die Prüfstelle einen nennt — sonst `null`: kein Quellenbezug belegt. */
  readonly source: SourceReference | null;
  /**
   * Zahl der Auslösestellen im Quelltext. Drei Regeln werden an **zwei** Stellen ausgelöst; sie
   * bleiben trotzdem **ein** Eintrag, sonst bräche die Dublettenprüfung. Für `phase: 'spec'`
   * zählt der Test die Stellen in `validate.ts` gegen diesen Wert, damit eine künftige dritte
   * Stelle auffällt. Für `phase: 'composition'` ist der Wert **ungegatet**: dort erzeugt eine
   * einzige Anweisung über ihren Präfixparameter drei Kennungen zugleich, und eine Zählung im
   * Quelltext ergäbe keine Zuordnung zur einzelnen Kennung.
   */
  readonly sites: number;
}

/**
 * Quellenbezug auf die BABZ-Referenzdateien. Alle im Kern genannten Abschnitte (Anhänge D, E, F,
 * G, I) stammen aus dieser Quelle; `status: 'derived'` siehe Modulkommentar.
 */
function babz(section: string): SourceReference {
  return Object.freeze({ source: 'babz-svg-2025', section, status: 'derived' });
}

function entry(
  id: string,
  kind: RuleKind,
  dimension: RuleDimension,
  reason: string,
  reasonSource: RuleReasonSource,
  source: SourceReference | null = null,
  sites = 1,
): RuleCatalogEntry {
  return Object.freeze({
    id,
    kind,
    dimension,
    phase: 'spec',
    reason,
    reasonSource,
    source,
    sites,
  });
}

/**
 * Die 72 Regeln, die `validateSpec()` an der Beschreibung prüft — alphabetisch wie
 * `VALIDATION_RULE_IDS`, damit ein Vergleich der beiden Listen ohne Umsortieren lesbar bleibt.
 */
export const RULE_CATALOG: readonly RuleCatalogEntry[] = Object.freeze([
  entry(
    'above-left-label-requires-measured-body',
    'engine',
    'label',
    'Die Grundlinie der Zone oberhalb links ist allein am Luftfahrzeug aus F.2.7 vermessen; für jede andere Art gibt es keine Messung, aus der ihre Lage folgte.',
    'core',
    babz('F.2.7'),
  ),
  entry(
    'above-left-metrics-complete',
    'engine',
    'label',
    'Ein halber Metriksatz mischte unbelegte Profilwerte in eine gemessene Lage.',
    'website',
  ),
  entry(
    'above-left-metrics-within-viewbox',
    'engine',
    'label',
    'Anker und abgeleitete Textbox müssen in der vermessenen Profilbox und in der 32-mm-ViewBox liegen, sonst stünde Text außerhalb der Zeichenfläche.',
    'website',
  ),
  entry(
    'administrative-level-not-measured',
    'engine',
    'administrative-level',
    'Die Abdeckung der Verwaltungsstufen ist bewusst partiell: nur die drei in D.3/D.4 vermessenen Köpfe sind belegt, Gemeinde, Bezirk und Bundesland bleiben fail-closed.',
    'core',
    babz('D.3/D.4'),
  ),
  entry(
    'below-right-label-requires-measured-body',
    'engine',
    'label',
    'Lage und Tinte der Zone unterhalb des Körpers hängen am Profil und sind nur an E.2.27 bis E.2.31 und an G.3.5 vermessen; an anderen Körperformen entstünde ein Lauf, den keine Referenzdatei zeigt und kein Gate meldete.',
    'core',
    babz('E.2.27–E.2.31, G.3.5'),
  ),
  entry(
    'below-right-label-requires-organization',
    'engine',
    'label',
    'Dieses Körperprofil führt die Zone in der Organisationsfarbe (#003296 an E.2.27 bis E.2.31); ohne Organisation hat sie keine gemessene Farbe.',
    'core',
    babz('E.2.27–E.2.31'),
  ),
  entry(
    'body-variant-foot-conflict',
    'systematik',
    'body-variant',
    'Die sichtbare Zusatzgeometrie dieser Körpervariante belegt den Streifen unterhalb des Körpers; eine Bezeichnung in der Fußzone würde sie überlagern oder die viewBox verlassen.',
    'core',
  ),
  entry(
    'body-variant-requires-measured-kind',
    'engine',
    'body-variant',
    'Varianten fallen weder auf eine andere Körperart noch auf deren Normalfassung zurück; belegt ist jede nur an den Arten, an denen sie vermessen wurde.',
    'core',
  ),
  entry(
    'bottom-center-label-requires-measured-body',
    'engine',
    'label',
    'Die Grundlinie unten mittig ist an der taktischen Formation (F.1.18/F.1.20) und am gebänderten 12-mm-Kreis (G.3.5) vermessen; für andere Arten gibt es keine Messung, aus der ihre Lage folgte.',
    'core',
    babz('F.1.18/F.1.20, G.3.5'),
  ),
  entry(
    'bottom-right-metrics-complete',
    'engine',
    'label',
    'Fehlt eines der fünf Maße, mischte die Komposition unbelegte Werte in eine gemessene Lage.',
    'website',
  ),
  entry(
    'bottom-right-metrics-require-bottom-right-label',
    'engine',
    'label',
    'Ohne nichtleeren Lauf würden Versalhöhe, Grundlinie, Anker und Box still verschluckt.',
    'core',
  ),
  entry(
    'bottom-right-metrics-require-measured-body',
    'engine',
    'label',
    'Ohne ein Körperprofil mit vollständig vermessener relativer Textbox gäbe es keine Hülle, gegen die die Box geprüft würde.',
    'website',
  ),
  entry(
    'bottom-right-metrics-within-body',
    'engine',
    'label',
    'Box, Anker und abgeleitete vertikale Schriftmetriken müssen in der vermessenen Körperhülle liegen, sonst stünde der Lauf teilweise außerhalb des Körpers.',
    'website',
  ),
  entry(
    'center-anchor-override-requires-measured-trailer',
    'engine',
    'label',
    'Ein abweichender mittiger x-Anker ist allein am vermessenen Anhängerprofil und nur mit dessen vollständigem gemessenen Anker belegt; ein freier Wert wäre keine Messung, sondern eine Schätzung.',
    'website',
  ),
  entry(
    'center-baseline-not-measured',
    'engine',
    'label',
    'Führt das Körperprofil eine Liste vermessener Abweichungen, sind Zwischenwerte an keiner Referenzdatei belegt.',
    'website',
  ),
  entry(
    'center-baseline-override-requires-measured-body',
    'engine',
    'label',
    'Nur Profile, die die Abweichung ausdrücklich erlauben, haben dafür eine Messung; die übrigen behalten ihren Wert, damit keine ungemessene Lage entsteht.',
    'website',
  ),
  entry(
    'center-baseline-positive',
    'engine',
    'label',
    'Null, negative Werte, NaN oder Infinity ergäben keine Lage im Körper.',
    'website',
  ),
  entry(
    'center-baseline-requires-center-label',
    'engine',
    'label',
    'Eine gemessene mittige Grundlinie ohne mittigen Lauf hätte keine Wirkung und würde still verschluckt.',
    'website',
  ),
  entry(
    'center-box-margin-non-negative',
    'engine',
    'label',
    'Negative Werte oder NaN ergäben keine Box, in der Text stehen könnte.',
    'website',
  ),
  entry(
    'center-box-margin-override-requires-measured-body',
    'engine',
    'label',
    'Ohne vermessene Körperhülle gäbe es keine Breite, gegen die der Rand geprüft würde.',
    'website',
  ),
  entry(
    'center-box-margin-requires-center-label',
    'engine',
    'label',
    'Ein individueller Rand ohne mittigen Lauf hätte keine Wirkung und würde still verschluckt.',
    'website',
  ),
  entry(
    'center-box-margin-within-body',
    'engine',
    'label',
    'Der Rand wird beidseitig abgezogen; bliebe keine positive Boxbreite übrig, entstünde eine Box ohne Fläche, in der kein Text stünde.',
    'website',
  ),
  entry(
    'center-cap-height-positive',
    'engine',
    'label',
    'Die Versalhöhe des mittigen Laufs ist eine Messung an der Referenzdatei und keine freie Größe.',
    'core',
  ),
  entry(
    'center-cap-height-requires-center-label',
    'engine',
    'label',
    'Eine Versalhöhe ohne mittigen Lauf hätte keine Wirkung — und eine Angabe ohne Wirkung ist genau der stille Ausfall, den die übrigen Zonenregeln abfangen.',
    'core',
  ),
  entry(
    'center-label-within-body',
    'engine',
    'label',
    'Die aus Grundlinie und Versalhöhe abgeleitete Textbox muss vollständig in der vermessenen Körperhülle liegen, sonst ragte der Lauf über den Körper hinaus.',
    'website',
  ),
  entry(
    'chassis-foot-conflict',
    'systematik',
    'chassis',
    'Fahrwerkszone und Fußzone überschneiden sich um 3,75 mm bei 4 mm Zonenhöhe; die Referenz beschriftet ihre Fahrzeuge stattdessen in den Körperzonen.',
    'core',
    babz('E.2'),
  ),
  entry(
    'circle-12-requires-hilfsorganisation',
    'engine',
    'organization',
    'Belegt ist entweder die weiße HiOrg-Fassung aus F.3 oder genau eine der farbigen technischen Art-, Varianten- und Markenfassungen; fehlende oder vertauschte Werte sind nicht belegt.',
    'core',
    babz('F.3'),
  ),
  entry(
    'circle-12-requires-organization',
    'systematik',
    'organization',
    'Der gebänderte 12-mm-Kreis verlangt die Organisationsfarbe seiner Körperfläche.',
    'core',
  ),
  entry(
    'circle-top-left-anchor-within-viewbox',
    'engine',
    'label',
    'Der relative Kreislabel-Anker darf außerhalb der Kreisfläche beginnen, seine absolute Lage muss aber in der 32-mm-ViewBox bleiben und die rechte Kante der deklarierten Textbox halten.',
    'core',
    babz('F.3'),
  ),
  entry(
    'circle-top-left-baseline-within-viewbox',
    'engine',
    'label',
    'Die relative Kreislabel-Grundlinie darf außerhalb der Kreisfläche liegen, die daraus berechnete Textbox muss aber vollständig in der 32-mm-ViewBox bleiben.',
    'core',
  ),
  entry(
    'circle-top-left-requires-metrics',
    'engine',
    'label',
    'Die beiden Kreisfassungen haben keinen allgemeinen Profildefault, aus dem sich die Lage des Laufs ergäbe.',
    'core',
  ),
  entry(
    'colored-circle-top-left-not-measured',
    'engine',
    'label',
    'Die exakt vermessenen farbigen Kreisverträge führen weder einen topLeft-Lauf noch die zugehörigen F.3-Metriken; die weißen Kreislabelverträge werden nicht vererbt.',
    'core',
    babz('F.3'),
  ),
  entry(
    'designation-not-blank',
    'engine',
    'label',
    'Ein leerer Lauf erzeugte ein Textprimitiv ohne Tinte, das jedes Gate besteht und im Bild fehlt.',
    'core',
  ),
  entry(
    'foot-band-head-requires-measured-strength',
    'engine',
    'strength',
    'Am gebänderten Formationskörper sind nur Trupp, Gruppe und Zug vermessen; die Staffel verschöbe den Körper, und wie das Fußband mitwandert, ist nicht belegt.',
    'core',
  ),
  entry(
    'function-role-body-mark-mismatch',
    'engine',
    'function-role',
    'Jede gemessene Funktionsfassung führt die Liste der zu ihr vermessenen Körpermarken; alles darüber hinaus ist an keiner Datei belegt.',
    'website',
  ),
  entry(
    'function-role-body-variant-not-measured',
    'engine',
    'function-role',
    'Körpervarianten sind mit gemessenen Funktionsfassungen nicht kombiniert belegt.',
    'core',
  ),
  entry(
    'function-role-capabilities-not-measured',
    'engine',
    'function-role',
    'Standard-Piktogramme sind mit gemessenen Funktionsfassungen nicht kombiniert belegt.',
    'core',
  ),
  entry(
    'function-role-head-mismatch',
    'engine',
    'function-role',
    'Die Kopfzone muss genau der Fassung entsprechen, die die Funktionsdefinition erwartet; eine abweichende oder zusätzliche Angabe ergäbe eine zu dieser Funktion nicht vermessene Kopfzone.',
    'website',
  ),
  entry(
    'function-role-label-metrics-required',
    'engine',
    'function-role',
    'Unvollständige oder einander überlagernde Funktionsläufe ergäben unsichtbaren oder ineinanderlaufenden Text.',
    'website',
  ),
  entry(
    'function-role-organization-mismatch',
    'engine',
    'function-role',
    'Jede gemessene Funktionsfassung ist an genau eine Organisation gebunden; eine andere oder fehlende Zuordnung ist für sie nicht vermessen.',
    'website',
  ),
  entry(
    'function-role-requires-measured-kind',
    'engine',
    'function-role',
    'Eine gemessene Funktion ist nur an Formation oder Person belegt, und jede einzelne Fassung zusätzlich nur an der Art, für die sie vermessen wurde.',
    'core',
    null,
    2,
  ),
  entry(
    'function-role-requires-measured-layout',
    'engine',
    'function-role',
    'Ohne die exakt aufgelöste Definition und ihren vollständigen, textfreien Geometrieplan gäbe es keine vermessene Zeichnung.',
    'core',
    null,
    2,
  ),
  entry(
    'head-zone-conflict',
    'systematik',
    'composition',
    'Stärke, Verwaltungsstufe und technische Kopfmarke belegen dieselbe Kopfzone, und eine Funktionsfassung bindet ihre Kopfzone selbst.',
    'core',
  ),
  entry(
    'in-body-ink-requires-in-body-label',
    'engine',
    'label',
    'Ein gemessener Tintenoverride verlangt mindestens einen nichtleeren Textlauf im Körper; oberhalb oder auf der Ausgabeoberfläche liegende Läufe verwenden eigene Tintenverträge.',
    'core',
  ),
  entry(
    'inset-hull-fire-fighting-requires-no-labels',
    'engine',
    'body-variant',
    'Der vermessene Feuerwehrvertrag der eingesenkten Wasserfahrzeughülle trägt keine Beschriftung.',
    'core',
  ),
  entry(
    'inset-hull-requires-center-label-only',
    'engine',
    'body-variant',
    'Der vollständige I.3-Vertrag belegt genau drei sichere Labelfelder; andere Felder oder ein Labelobjekt mit geerbten, nicht aufzählbaren oder über Accessoren gelieferten Werten koppelten die geprüfte Datenansicht von der gezeichneten ab.',
    'core',
    babz('I.3'),
  ),
  entry(
    'inset-hull-requires-measured-body-mark',
    'engine',
    'body-variant',
    'An der eingesenkten Hülle sind die Körpermarken nur als keine oder inset-hull-wheel-pair für die Hilfsorganisation und als fire-fighting für die Feuerwehr vermessen.',
    'core',
  ),
  entry(
    'inset-hull-requires-measured-organization',
    'engine',
    'body-variant',
    'Die eingesenkte Wasserfahrzeughülle ist allein als Hilfsorganisations- und als Feuerwehrfassung vermessen.',
    'core',
  ),
  entry(
    'label-not-blank',
    'engine',
    'label',
    'Ein leerer Lauf erzeugte ein Textprimitiv ohne Tinte, das jedes Gate besteht und im Bild fehlt.',
    'core',
    null,
    2,
  ),
  entry(
    'plain-wheel-pair-chassis-conflict',
    'systematik',
    'body-variant',
    'Die Variante zeichnet bereits zwei vermessene Radringe; eine Fahrzeugkategorie würde eine zweite, nicht belegte Fahrwerksgeometrie darüberlegen.',
    'core',
  ),
  entry(
    'reduced-house-requires-hilfsorganisation',
    'engine',
    'organization',
    'Die reduzierte Hauskontur ist in beiden F.3-Belegen ausschließlich als weiße HiOrg-Körperfläche vermessen.',
    'core',
    babz('F.3'),
  ),
  entry(
    'strength-requires-unit',
    'systematik',
    'strength',
    'Eine Stärkeangabe gehört fachlich an eine taktische Einheit; die übrigen Körperarten sind keine Einheit.',
    'core',
  ),
  entry(
    'surface-label-foot-conflict',
    'systematik',
    'label',
    'Bezeichnung und schwarze Oberflächenläufe belegen denselben Streifen unterhalb des Körpers, und eine vermessene Ausweichposition gibt es nicht.',
    'core',
  ),
  entry(
    'surface-label-requires-measured-body',
    'engine',
    'label',
    'Schwarze Oberflächenläufe stehen außerhalb des Körpers auf der Ausgabefläche; andere Profile haben für diese Zone keine gemessene Grundlinie.',
    'website',
  ),
  entry(
    'surface-left-label-requires-measured-anchor',
    'engine',
    'label',
    'Führt das Körperprofil nur den rechten Anker, bliebe die linke Lage geraten.',
    'website',
  ),
  entry(
    'surface-right-label-requires-measured-anchor',
    'engine',
    'label',
    'Führt das Körperprofil nur den linken Anker, bliebe die rechte Lage geraten.',
    'website',
  ),
  entry(
    'technical-fill-organization-conflict',
    'systematik',
    'technical-fill',
    'Die Körperfläche bekommt ihre Farbe entweder aus der Organisation oder aus dem technischen Token; nur die Organisation trägt dabei eine nicht-farbliche Kontursignatur.',
    'core',
  ),
  entry(
    'technical-fill-token-invalid',
    'engine',
    'technical-fill',
    'Freie Farbwerte gibt es nicht; sie umgingen die geprüften Kontrastverträge.',
    'website',
  ),
  entry(
    'technical-head-mark-not-measured',
    'engine',
    'technical-head-mark',
    'Jeder Wert außerhalb der beiden vermessenen Marken hätte keine belegte Geometrie.',
    'website',
  ),
  entry(
    'technical-head-mark-requires-normal-formation',
    'engine',
    'technical-head-mark',
    'Belegt sind die normale Formation (F.1.1, F.1.13, F.1.21, E.1.31, I.1.4) und die Formation mit Fußband (F.1.3); jede andere Art oder Variante bleibt fail-closed.',
    'core',
    babz('F.1'),
  ),
  entry(
    'top-left-anchor-within-body',
    'engine',
    'label',
    'Der Anker muss innerhalb der vermessenen Landfahrzeugbox liegen; größere Werte schöben den Text über die rechte Innenmarge hinaus.',
    'website',
    babz('F.2'),
  ),
  entry(
    'top-left-baseline-within-body',
    'engine',
    'label',
    'Die Grundlinie muss mindestens eine Versalhöhe unter der Körperoberkante und innerhalb der vermessenen Normalhülle des F.2-Landfahrzeugs liegen.',
    'core',
    babz('F.2'),
  ),
  entry(
    'top-left-cap-height-positive',
    'engine',
    'label',
    'Null oder negative Werte ergäben keinen sichtbaren Text.',
    'website',
  ),
  entry(
    'top-left-label-requires-measured-body',
    'engine',
    'label',
    'Andere Körperprofile führen keinen Wert und werden abgelehnt, statt still einen der beiden gemessenen zu erben; am Gebäudekörper führte schon der Formationsanker aus dem Polygon heraus.',
    'core',
    babz('F.2'),
  ),
  entry(
    'top-left-lines-exactly-two',
    'engine',
    'label',
    'Eine, drei oder mehr Zeilen hätten keine belegten Grundlinien.',
    'website',
  ),
  entry(
    'top-left-lines-require-measured-body',
    'engine',
    'label',
    'Die zweizeilige obere Beschriftungszone ist allein am Landfahrzeug aus F.2.8 vermessen; für andere Arten gibt es keine Messung, aus der ihre Lage folgte.',
    'core',
    babz('F.2.8'),
  ),
  entry(
    'top-left-metrics-complete',
    'engine',
    'label',
    'Ein partielles Objekt würde unbelegte Profilwerte in eine gemessene Lage hineinmischen.',
    'core',
  ),
  entry(
    'top-left-metrics-require-measured-vehicle-land',
    'engine',
    'label',
    'Individuelle topLeft-Metriken sind nur am normalen und gebänderten F.2-Landfahrzeug, an den beiden F.3-Kreisfassungen und am Festflügel-Luftfahrzeug vermessen; andere Arten und Varianten behalten ihre eigenen Profilwerte.',
    'core',
    babz('F.2, F.3'),
  ),
  entry(
    'top-left-metrics-require-top-left-label',
    'engine',
    'label',
    'Ohne nichtleeren Lauf würden alle drei Maße still verschluckt.',
    'core',
  ),
  entry(
    'top-left-metrics-required-by-profile',
    'engine',
    'label',
    'Dieses Körperprofil belegt den Lauf ausschließlich mit einem vollständigen quellenspezifischen Metriksatz; ein Profildefault wäre nur eine Teilmessung.',
    'core',
  ),
  entry(
    'top-left-metrics-within-body',
    'engine',
    'label',
    'Anker und abgeleitete vertikale Textbox müssen innerhalb der vermessenen Körperhülle liegen.',
    'core',
  ),
  entry(
    'vehicle-category-requires-vehicle',
    'engine',
    'chassis',
    'Gemessen, nicht angenommen: von den 31 Zeichen des Anhangs E.2 tragen 25 eine Fahrwerkszone, und nur Landfahrzeug, Anhängerrumpf und Wechselladerrumpf sind darunter.',
    'core',
    babz('E.2'),
  ),
]);

/* --- Zweite Klasse: Regeln, die erst beim Komponieren entstehen -------------------------- */

/**
 * Die sechs Kennungen aus `assertTextRunsFit()` in `packages/core/src/compose.ts` — **nicht** in
 * `VALIDATION_RULE_IDS`, weil sie zur Prüfzeit noch nicht entstehen können.
 *
 * `validateSpec()` prüft die Beschreibung, bevor irgendetwas gezeichnet ist. Diese sechs greifen
 * erst, wenn die Komposition den Textlauf gesetzt und seine Tinte gegen die Box gemessen hat —
 * sie brauchen Geometrie, die es vorher nicht gibt. Beide Mengen in einen Topf zu werfen, hieße
 * die Mengengleichheit gegen `VALIDATION_RULE_IDS` aufzugeben.
 *
 * Diese Trennung ist heute schon vorhanden, aber an der falschen Stelle: als
 * `COMPOSITION_EXPLANATIONS` in der Website. Hier steht sie im Kern, bei den Regeln selbst.
 *
 * Die Kennungen sind im Quelltext **keine Literale**, sondern Template-Literale aus drei Präfixen
 * (`designation`, `label`, `function-role-run`) und zwei Endungen (`-too-wide`, `-unknown-glyph`).
 * Der Test scannt genau diese beiden Bestandteile aus `compose.ts` und vergleicht ihr Kreuzprodukt
 * mit dieser Liste — nicht die Liste gegen sich selbst.
 *
 * Nicht enthalten sind die Kennungen von `textRunIssues` (`text-too-wide`, `text-outside-box`,
 * `unknown-glyph`, `text-too-tall`, `unmeasured-baseline` in `text-metrics.ts`): sie gehören zum
 * Messgate `TextMetricsIssue` und erreichen nie ein `ValidationIssue.rule` — `assertTextRunsFit`
 * übersetzt die ersten drei in die sechs Kennungen hier, die übrigen zwei gar nicht.
 */
export const COMPOSITION_RULE_CATALOG: readonly RuleCatalogEntry[] = Object.freeze([
  Object.freeze({
    id: 'designation-too-wide',
    kind: 'engine',
    dimension: 'label',
    phase: 'composition',
    reason:
      'Ein zu langer Lauf wird gemeldet statt umbrochen oder verkleinert: beides änderte die Geometrie und träfe eine gestalterische Entscheidung, die die Vorschrift nicht trifft.',
    reasonSource: 'core',
    source: null,
    sites: 1,
  } satisfies RuleCatalogEntry),
  Object.freeze({
    id: 'designation-unknown-glyph',
    kind: 'engine',
    dimension: 'label',
    phase: 'composition',
    reason:
      'Unbekannte Glyphen machen Breite und Höhe unverlässlich — Befund statt Ersatzwert, denn ein geratener Wert wäre zu klein.',
    reasonSource: 'core',
    source: null,
    sites: 1,
  } satisfies RuleCatalogEntry),
  Object.freeze({
    id: 'function-role-run-too-wide',
    kind: 'engine',
    dimension: 'function-role',
    phase: 'composition',
    reason:
      'Der Lauf stammt aus der vermessenen Funktionsfassung im Katalog; passt er nicht in seine Box, ist das ein Befund über die Fassung und nicht über die Beschreibung.',
    reasonSource: 'website',
    source: null,
    sites: 1,
  } satisfies RuleCatalogEntry),
  Object.freeze({
    id: 'function-role-run-unknown-glyph',
    kind: 'engine',
    dimension: 'function-role',
    phase: 'composition',
    reason:
      'Unbekannte Glyphen machen Breite und Höhe unverlässlich — Befund statt Ersatzwert, denn ein geratener Wert wäre zu klein.',
    reasonSource: 'core',
    source: null,
    sites: 1,
  } satisfies RuleCatalogEntry),
  Object.freeze({
    id: 'label-too-wide',
    kind: 'engine',
    dimension: 'label',
    phase: 'composition',
    reason:
      'Ein zu langer Lauf wird gemeldet statt umbrochen oder verkleinert: beides änderte die Geometrie und träfe eine gestalterische Entscheidung, die die Vorschrift nicht trifft.',
    reasonSource: 'core',
    source: null,
    sites: 1,
  } satisfies RuleCatalogEntry),
  Object.freeze({
    id: 'label-unknown-glyph',
    kind: 'engine',
    dimension: 'label',
    phase: 'composition',
    reason:
      'Unbekannte Glyphen machen Breite und Höhe unverlässlich — Befund statt Ersatzwert, denn ein geratener Wert wäre zu klein.',
    reasonSource: 'core',
    source: null,
    sites: 1,
  } satisfies RuleCatalogEntry),
]);

/* --- Lücken je Dimension ----------------------------------------------------------------- */

/** `'none'` — zu dieser Dimension gibt es keine Regel. `'partial'` — es gibt sie nur teilweise. */
export type RuleDimensionCoverage = 'none' | 'partial';

export interface RuleDimensionGap {
  readonly dimension: RuleDimension;
  readonly coverage: RuleDimensionCoverage;
  /** Abschnitt der Systematik, in dem die fehlende Dimension steht. */
  readonly chapter: string;
  readonly note: string;
}

/**
 * Die Lücken je Dimension — zählbar, nicht als Fließtext. Der Ergebnispunkt „Lücken je Dimension
 * benannt" aus LFH-563.
 *
 * Eine Dimension darf **zugleich** Einträge und einen Lückeneintrag haben: `administrative-level`
 * trägt eine Regel und ist trotzdem nur zu drei von sechs Stufen belegt. Verboten ist allein,
 * dass eine Dimension in **keiner** der beiden Listen vorkommt — das prüft der Test.
 */
export const RULE_DIMENSION_GAPS: readonly RuleDimensionGap[] = Object.freeze([
  Object.freeze({
    dimension: 'base-symbol',
    coverage: 'partial',
    chapter: 'Kapitel 1, 5.1',
    note: 'Gegenstand keiner Regel, Bedingung in vielen: die Grundzeichenart tritt nur als Voraussetzung anderer Regeln auf. Welche Arten es überhaupt gibt, regelt die Typebene, nicht der Katalog.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'administrative-level',
    coverage: 'partial',
    chapter: '5.7',
    note: 'Eine Regel, aber nur drei der sechs Stufen belegt (D.3/D.4). Gemeinde, Bezirk und Bundesland lehnt der Motor pauschal ab, statt eine Regel für sie zu führen.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'body-marks',
    coverage: 'partial',
    chapter: '3.6–3.9',
    note: 'Körpermarken kommen nur mittelbar vor — über die eingesenkte Hülle und über die Funktionsfassung. Eine eigene Regel, welche Marke an welcher Körperform sitzen darf, gibt es nicht.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'capabilities',
    coverage: 'none',
    chapter: '3.6–3.9',
    note: 'Keine Regel. Insbesondere Mehrfachfähigkeiten und Sonderformen sind ungeregelt: der Motor nimmt beliebig viele Fähigkeiten an, ohne zu prüfen, ob sie zusammen belegt sind.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'unit-grouping',
    coverage: 'none',
    chapter: '5.5',
    note: 'Keine Regel und kein Feld in `SymbolSpec`: Verbände oberhalb des Zuges sind im Motor nicht darstellbar.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'state',
    coverage: 'none',
    chapter: '5.8',
    note: 'Keine Regel und kein Feld in `SymbolSpec`. Zustände existieren heute nur als eigenständige Piktogramme im Katalog, nicht als Baustein an einem Zeichen.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'tendency',
    coverage: 'none',
    chapter: '5.8',
    note: 'Keine Regel und kein Feld in `SymbolSpec`; auch keine Wertachse in der Regelabdeckung.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'movement',
    coverage: 'none',
    chapter: '5.2',
    note: 'Keine Regel und kein Feld in `SymbolSpec`. Bewegung und Maßnahmen brauchen Richtung und Länge, für die es im Zonenmodell noch keinen Ort gibt.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'lines-and-boundaries',
    coverage: 'none',
    chapter: 'Kapitel 2',
    note: 'Keine Regel und kein Feld in `SymbolSpec`. Linien und Grenzen sind keine Zeichen auf der 32-mm-Grundfläche und sprengen das heutige Ausgabeformat.',
  } satisfies RuleDimensionGap),
]);

/** Nachschlag über beide Klassen; `undefined` statt Wurf, die Erklärungsschicht entscheidet. */
export function ruleCatalogEntry(id: string): RuleCatalogEntry | undefined {
  return RULE_CATALOG.find((rule) => rule.id === id) ??
    COMPOSITION_RULE_CATALOG.find((rule) => rule.id === id);
}
