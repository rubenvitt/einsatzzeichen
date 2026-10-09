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
 * Fall tatsächlich ausgelöst wird. Seit LFH-568 gibt es dieses Gate: `conformance/src/rule-evidence.ts`
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
 * - `vehicle-category-requires-vehicle` war bis zum 02.10.2026 **enger** als die Systematik: die
 *   umgesetzte Menge waren die drei Körperformen mit vermessener Fahrwerkszone. Seit dem
 *   Eigentümerentscheid steht sie an allen fünf Fahrzeugarten (`VEHICLE_KINDS`). Übrig ist die
 *   Trägerbindung. Deshalb `'systematik'`. Welcher Fahrzeugkörper welche Kategorie trägt, regelt
 *   seit dem Fachreview vom 05.10.2026 `vehicle-category-requires-chassis-body`.
 * - `designation-not-blank` und `label-not-blank` sehen nach Datenhygiene aus, tragen aber eine
 *   Motorbegründung: ein leerer Lauf erzeugt ein Textprimitiv ohne Tinte, das jedes Gate besteht
 *   und im Bild fehlt. Deshalb `'engine'`.
 *
 * Die sieben `-not-measured`-Kennungen und alle „… requires measured …"-Kennungen sind
 * durchweg `'engine'`; das ist der erwartete Befund und zugleich der Kern des Grammatik-Umbaus:
 * heute lehnt der Motor **67 von 79** Kombinationen ab, weil eine Messung fehlt, und nur **12**,
 * weil die Systematik sie verbietet. Die vier fachlichen Regeln zu den Zuständen aus 5.8 sind mit
 * LFH-577 dazugekommen (Entscheidungen des Eigentümers vom 29. September 2026).
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
 * - `'website'` — die Begründung steht **nur** in der Leserinnenerklärung der Regel, nicht an der
 *   Prüfstelle. Der Wert heißt so, weil diese Erklärungen bis LFH-579 in
 *   `packages/website/src/lib/rule-explanations.ts` standen; seitdem liegen sie im Kern
 *   (`rules/rule-explanations.ts`), und die Website ist ihr Konsument. Der Prüfcode selbst
 *   wiederholt an diesen Stellen nur den Prüfausdruck in Worten („muss endlich und größer als
 *   null sein"). Diese Sätze sind hierher **von Hand gezogen**.
 *
 * Das ist die eigentliche Aussage dieses Feldes: **27 der 79 Beschreibungsregeln** (mit der
 * einen Kompositionsregel 28 Einträge) begründet allein die Erklärung, nicht die Prüfstelle.
 *
 * **Gegatet sind sie seit dem 21. September 2026**, seit LFH-579 im Kern: Die Erklärungen und
 * dieser Katalog liegen im selben Paket, und `rules/rule-explanations.test.ts` zieht genau die
 * Einträge mit `reasonSource: 'website'` aus diesem Katalog und nagelt die Erklärung, aus der ihr
 * Satz stammt, per Fingerabdruck fest. Wer die Erklärung umschreibt, wird dort aufgefordert, den
 * Satz hier zu prüfen. Wandert eine Begründung an die Prüfstelle, wechselt ihr Eintrag auf
 * `'core'` und fällt aus dem Gate — die Deckungsgleichheit beider Listen erzwingt derselbe Block.
 * (Bis LFH-579 stand das Gate in der Website, weil `core` `website` nicht importieren darf.)
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
 * Abgeglichen mit den 16 Wertachsen in `packages/conformance/src/rule-coverage.ts`. Unterschiede und
 * ihr Grund:
 *
 * - `kind` und `bodyVariant` der Achsenliste stehen hier als `'base-symbol'` und
 *   `'body-variant'` — die Regeln trennen beide deutlich.
 * - `'label'` hat **keine** Wertachse (Beschriftung ist freier Text, kein Werteraum), trägt aber
 *   29 der 50 Regeln (Stand 2. Oktober 2026). Ohne diese Dimension wäre der Katalog unbrauchbar.
 * - `'composition'` ist keine Dimension der Systematik, sondern die Einordnung für Regeln, deren
 *   Auflösung überhaupt kein einzelnes Feld benennt. Dasselbe Wort und derselbe Grund wie in
 *   `rule-explanations.ts`; bislang genau `head-zone-conflict`.
 * - `'movement'` (5.2), `'lines-and-boundaries'` (Kapitel 2), `'weather'` (5.8.7) und `'animal'`
 *   (5.8.6) haben keine Wertachse und kein Feld in `SymbolSpec`: seit LFH-577 beschreibt sie die
 *   freistehende Spec-Art (`FreestandingSpec`), geprüft von `validateFreestandingSpec`. Ihre
 *   Regeln stehen in `FREESTANDING_RULE_CATALOG`; die Pfeile tragen keine, das steht in
 *   `RULE_DIMENSION_GAPS`.
 * - `'unit-grouping'` (Verbände 5.5), `'state'` und `'tendency'` (5.8) haben seit LFH-577 je ein
 *   Feld in `SymbolSpec` (`unitGrouping`, `states`, `tendency`). Regeln trägt davon nur `'state'`;
 *   der Verband teilt die Kopfzonenregel `head-zone-conflict`, die Tendenz hat keinen belegten
 *   Träger. Was fehlt, steht in `RULE_DIMENSION_GAPS`.
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
  | 'weather'
  | 'animal'
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
  'weather',
  'animal',
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
 * Die 79 Regeln, die `validateSpec()` an der Beschreibung prüft — alphabetisch wie
 * `VALIDATION_RULE_IDS`, damit ein Vergleich der beiden Listen ohne Umsortieren lesbar bleibt.
 */
export const RULE_CATALOG: readonly RuleCatalogEntry[] = Object.freeze([
  entry(
    'above-left-label-head-conflict',
    'systematik',
    'label',
    'Der Lauf oberhalb links steht im Streifen über dem Körper, den die Kopfzone oder der Giebel belegt; eine Zone trägt einen Baustein, und über ihr endet die Grundfläche.',
    'core',
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
    'Anker und abgeleitete Textbox müssen in der Profilbox der Körperhülle und in der 32-mm-ViewBox liegen, sonst stünde Text außerhalb der Zeichenfläche.',
    'website',
  ),
  entry(
    'administrative-level-requires-carrier',
    'systematik',
    'administrative-level',
    'Trägerbindung: die Verwaltungsstufe sagt, auf welcher Ebene eine Führung, Behörde oder Stelle angesiedelt ist, und steht nur an Formation, Person, Stelle und Gebäude; Fahrzeug, Gefahr, Maßnahme oder Ereignis haben keine Verwaltungsebene (Fachreview vom 05.10.2026).',
    'core',
  ),
  entry(
    'below-body-zone-conflict',
    'systematik',
    'label',
    'Fahrwerk, Bezeichnung, Lauf unterhalb rechts und Oberflächenläufe teilen den Streifen unter dem Körper; je Seite trägt er einen Baustein, und unter ihm endet die Grundfläche.',
    'core',
  ),
  entry(
    'body-mark-rendition-not-measured',
    'engine',
    'body-marks',
    'Eine zweite Fassung derselben Körpermarke gibt es nur für die Marke, an der Anhang C sie zeichnet (LFH-786); an einem anderen Paar derselben Marke wird sie seit dem 2. Oktober 2026 übertragen. Eine Kennung, die für die Marke nirgends vermessen ist, oder eine Fassung ohne ihre Marke zeichnete still etwas anderes als verlangt.',
    'core',
    babz('C.2'),
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
    'systematik',
    'body-variant',
    'Eine Variante, die die Form einer bestimmten Art benennt (Rumpf, Flügel, Personraute, Kreis), gibt es an keiner anderen Art; übertragbare Varianten zeichnet der Katalog seit dem 02.10.2026 an jeder passenden Art, wo nötig abgeleitet.',
    'core',
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
    'bottom-right-metrics-within-body',
    'engine',
    'label',
    'Box, Anker und abgeleitete vertikale Schriftmetriken müssen in der Körperhülle liegen, sonst stünde der Lauf teilweise außerhalb des Körpers.',
    'website',
  ),
  entry(
    'center-anchor-override-requires-measured-trailer',
    'engine',
    'label',
    'Ein abweichender mittiger x-Anker ohne mittigen Lauf, ohne endlichen Wert oder außerhalb der Körperhülle hätte keine Lage, an der der Lauf stünde; die Liste vermessener Werte begrenzt ihn seit dem 2. Oktober 2026 nicht mehr.',
    'core',
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
    'Die aus Grundlinie und Versalhöhe abgeleitete Textbox muss vollständig in der Körperhülle liegen, sonst ragte der Lauf über den Körper hinaus.',
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
    'designation-not-blank',
    'engine',
    'label',
    'Ein leerer Lauf erzeugte ein Textprimitiv ohne Tinte, das jedes Gate besteht und im Bild fehlt.',
    'core',
  ),
  entry(
    'function-role-head-mismatch',
    'engine',
    'function-role',
    'Nennt der Titel einer Funktion ihre Kopfzone (Zug- und Gruppenführer, Führungsgruppe, Kreisbrandmeister, Kreisleitstelle, internationale Hilfsaktion), widerspräche eine andere oder fehlende Angabe der Funktion; die übrigen Leitungsrollen sind kopffrei.',
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
    'Nennt der Titel einer Funktion ihre Organisation (Zugführer der Feuerwehr, Kreisbrandmeister, Zugführer THW, Sanitäts- und Betreuungszugführer), widerspräche eine andere oder fehlende Organisation der Funktion; die Rollen der Führung und Leitung stehen in jeder Farbe.',
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
    'Stärke, Verwaltungsstufe, technische Kopfmarke und Verband belegen dieselbe Kopfzone, und eine Funktionsfassung bindet ihre Kopfzone selbst.',
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
    'inset-hull-requires-center-label-only',
    'engine',
    'body-variant',
    'Ein Labelobjekt mit unbekannten, geerbten, nicht aufzählbaren oder über Accessoren gelieferten Werten koppelte an der eingesenkten Hülle die geprüfte Datenansicht von der gezeichneten ab; die Zonen selbst sind seit dem 2. Oktober 2026 frei.',
    'core',
    babz('I.3'),
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
    'raised-gable-requires-stationary-kind',
    'systematik',
    'body-variant',
    'Der Giebel bedeutet „ortsfest“ und steht nur an Stelle, Formation, Gebäude, Container und den Fahrzeugkörpern mit Fahrgestell; an Person, Gefahr, Ereignis, Maßnahme, Gebiet und Punkt ist „ortsfest“ selbstverständlich oder sinnlos, an Luft- und Wasserfahrzeug widerspricht es der Art (Fachreview vom 05.10.2026).',
    'core',
    babz('3.9'),
  ),
  entry(
    'state-carrier-not-allowed',
    'systematik',
    'state',
    'Ein Personenzustand aus 5.8.8 sagt etwas über einen Menschen und gehört an die Person; an einem anderen Grundzeichen hätte er keine Bedeutung. Alle übrigen Zustände stehen an jedem Grundzeichen, ihre Lage ist dort abgeleitet (Entscheidung des Eigentümers vom 02.10.2026).',
    'core',
    babz('5.8.8'),
  ),
  entry(
    'state-group-limit-exceeded',
    'systematik',
    'state',
    'Zwei Stufen derselben Skala widersprechen sich; ein Zeichen trägt höchstens einen Personenzustand und je einen Wert aus 5.8.2, 5.8.4 und 5.8.5 (Entscheidung des Eigentümers vom 29.09.2026). Die Hinweise „?" und „!" sind keine Skala; sie schließen sich mit `state-hint-limit-exceeded` aus.',
    'core',
    babz('5.8.2, 5.8.4, 5.8.5, 5.8.8'),
  ),
  entry(
    'state-hint-limit-exceeded',
    'systematik',
    'state',
    'Dieselbe Sache ist nicht zugleich vermutet und akut; ein Zeichen trägt höchstens einen der Hinweise „?“ und „!“, wie höchstens eine Tendenz (Fachreview vom 05.10.2026).',
    'core',
    babz('5.8.1'),
  ),
  entry(
    'state-tactics-not-allowed',
    'systematik',
    'state',
    'Die Einsatztaktik 5.8.1.1 bis 5.8.1.4 ist ein eigenes Zeichen und steht an keinem Träger (Entscheidung des Eigentümers vom 29.09.2026).',
    'core',
    babz('5.8.1'),
  ),
  entry(
    'state-value-not-attachable',
    'systematik',
    'state',
    'Wetter und Tierzustand sind freistehende Zeichen, und eine Tendenz gehört nicht in die Zustandsliste; in der Liste der Zustände an einem Träger stünden sie an der falschen Stelle.',
    'core',
    babz('5.8.3, 5.8.6, 5.8.7'),
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
    'top-left-lines-exactly-two',
    'engine',
    'label',
    'Eine, drei oder mehr Zeilen hätten keine belegten Grundlinien.',
    'website',
  ),
  entry(
    'top-left-metrics-complete',
    'engine',
    'label',
    'Ein partielles Objekt würde unbelegte Profilwerte in eine gemessene Lage hineinmischen.',
    'core',
  ),
  entry(
    'top-left-metrics-require-top-left-label',
    'engine',
    'label',
    'Ohne nichtleeren Lauf würden alle drei Maße still verschluckt.',
    'core',
  ),
  entry(
    'top-left-metrics-within-body',
    'engine',
    'label',
    'Anker und abgeleitete vertikale Textbox müssen innerhalb der Körperhülle liegen.',
    'core',
  ),
  entry(
    'vehicle-category-requires-chassis-body',
    'systematik',
    'chassis',
    'Trägerbindung: die Kategorien aus 5.1 beschreiben das Fahrwerk eines Landfahrzeugs und stehen an Landfahrzeug, Anhänger und Wechsellader, am Wasserfahrzeug nur das Amphibienfahrzeug; am Luftfahrzeug sagen sie nichts (Fachreview vom 05.10.2026).',
    'core',
    babz('5.1'),
  ),
  entry(
    'vehicle-category-requires-vehicle',
    'systematik',
    'chassis',
    'Trägerbindung: die Fahrzeugkategorie beschreibt das Fahrwerk eines Fahrzeugs. Vermessen ist die Zone an Landfahrzeug, Anhängerrumpf und Wechselladerrumpf (25 von 31 E.2-Zeichen); welcher Fahrzeugkörper welche Kategorie trägt, regelt `vehicle-category-requires-chassis-body`.',
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
 * `unknown-glyph`, `text-too-tall`, `unmeasured-baseline`, `unsupported-font-style` in
 * `text-metrics.ts`): sie gehören zum Messgate `TextMetricsIssue` und erreichen nie ein
 * `ValidationIssue.rule` — `assertTextRunsFit` übersetzt die ersten drei in die sechs Kennungen
 * hier, die übrigen drei gar nicht.
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

/* --- Freistehende Zeichen ---------------------------------------------------------------- */

/**
 * Die Regeln der freistehenden Spec-Art (LFH-577): Linien und Grenzen aus Kapitel 2, Wetter aus
 * 5.8.7 und Tierzustand aus 5.8.6. `validateFreestandingSpec` löst sie aus, `FREESTANDING_RULE_IDS`
 * zählt sie; alphabetisch wie `RULE_CATALOG`.
 *
 * Ein eigener Katalog und kein Zuwachs von `RULE_CATALOG`, weil dessen Mengengleichheit mit
 * `VALIDATION_RULE_IDS` die Kernaussage „jede Regel der `SymbolSpec` hat eine Prüfstelle in
 * `validate.ts`" ist. Hier gilt dieselbe Aussage für `validate-freestanding.ts`, mit eigenem Gate
 * in `rule-catalog.test.ts`. `ruleCatalogEntry` und `explainIssue` fragen alle drei Kataloge.
 *
 * Die Pfeile aus 5.2 tragen keine Regel: ihre einzigen vorgemerkten Regeln sprechen über die
 * Anbindung an einen Körper, und die hat die Spec-Art nicht (`PLANNED_PARAMETRIC_RULES`).
 */
export const FREESTANDING_RULE_CATALOG: readonly RuleCatalogEntry[] = Object.freeze([
  entry(
    'animal-state-variant-not-available',
    'systematik',
    'animal',
    'Eine zweite Darstellung zeigt die Referenz unter den Tierzuständen nur beim kontaminierten Tier, mit dem Buchstaben K statt des Kontaminationszeichens; an den anderen gäbe es nichts, was sie zeichnete.',
    'core',
    babz('5.8.6.2'),
  ),
  entry(
    'line-strength-mismatch',
    'systematik',
    'lines-and-boundaries',
    'Die taktische Stärke gehört nur an 2.20 Grenze mit taktischer Stärke: dort füllt sie die Lücke zwischen den Strichen und ist Pflicht, an jeder anderen Linie hat sie keinen Platz.',
    'core',
    babz('2.20'),
    2,
  ),
  entry(
    'line-variant-not-available',
    'systematik',
    'lines-and-boundaries',
    'Eine zweite Darstellung zeigt die Referenz unter den Linien nur bei 2.14 Escape Route (Punkte und Pfeilköpfe im Wechsel); jede andere Linie hat genau eine.',
    'core',
    babz('2.14'),
  ),
  entry(
    'weather-intensity-without-precipitation',
    'systematik',
    'weather',
    'Die Intensität ist die Zahl der Niederschlagsmarken unter der Wolke (5.8.7_Beispiel_Schneiend); ein Wert allein oder ein Paar ohne Niederschlag an der Wolke hat nichts, was sie zählte.',
    'core',
    babz('5.8.7'),
  ),
  entry(
    'weather-value-duplicate',
    'engine',
    'weather',
    'Ein doppelter Wert beschreibt kein anderes Zeichen, sondern unterliefe die Grenze von zwei Werten, die verschiedene Werte zählt.',
    'core',
    // Kein Quellenbezug: über doppelte Werte sagt die Referenz nichts, die Regel ist Datenhygiene.
    null,
  ),
  entry(
    'weather-values-exceed-limit',
    'systematik',
    'weather',
    'Ein Wetterzeichen trägt höchstens die Wolke und einen Niederschlag; mehr Werte zeigt kein Original, und der Eigentümer hat die Grenze am 29. September 2026 so entschieden.',
    'core',
    babz('5.8.7'),
  ),
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
 * Eine Dimension darf **zugleich** Einträge und einen Lückeneintrag haben: `state` trägt vier
 * Regeln und ist trotzdem nur für wenige Zustände an einem Träger belegt. Verboten ist allein,
 * dass eine Dimension in **keiner** der beiden Listen vorkommt — das prüft der Test.
 */
export const RULE_DIMENSION_GAPS: readonly RuleDimensionGap[] = Object.freeze([
  Object.freeze({
    dimension: 'base-symbol',
    coverage: 'partial',
    chapter: 'Kapitel 1, 3.6–3.9, 5.1',
    note: 'Gegenstand keiner Regel, Bedingung in vielen: die Grundzeichenart tritt nur als Voraussetzung anderer Regeln auf. Welche Arten es überhaupt gibt, regelt die Typebene, nicht der Katalog. Die Sonderformen 3.6 bis 3.9 sind keine Arten: sie stehen als Einzeldarstellung ihrer Kapiteldatei neben dem Zonenmodell (`specialFormDrawing`, `SPECIAL_FORMS`, LFH-567/LFH-577), ohne Zonen und ohne Spec-Feld, weil kein Original sie an einem Körper zeigt.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'organization',
    coverage: 'none',
    chapter: 'Kapitel 2',
    note: 'Seit dem 2. Oktober 2026 ohne eigene Regel: Jede Organisation, auch keine (weiß), füllt jeden geschlossenen Körper; die Messsperren am 12-mm-Kreis und an der reduzierten Hauskontur sind gefallen (`derive/circle.ts`). Die Lauftinte folgt `bodyLabelInk()`. Bindungen an die Organisation stehen nur noch mittelbar in anderen Dimensionen (technische Füllung, Funktionsfassung, eingesenkte Hülle).',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'administrative-level',
    coverage: 'partial',
    chapter: '5.7',
    note: 'Eine Regel in Kraft: seit dem Fachreview vom 5. Oktober 2026 bindet `administrative-level-requires-carrier` die Stufe an Formation, Person, Stelle und Gebäude; die Kopfzone teilt sie mit Stärke, Verband und technischer Kopfmarke (`head-zone-conflict`). Vermessen sind die Köpfe Kreis, Nationalstaat und EU (D.3/D.4) an Formation und Person; Gemeinde, Bezirk und Bundesland und die Lage an Stelle und Gebäude zeichnet der Motor abgeleitet aus den Kapiteldateien 5.7.1, 5.7.3 und 5.7.4 (`derive/head-zone.ts`).',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'body-marks',
    coverage: 'partial',
    chapter: 'Kapitel 4, Anhang D und F',
    note: 'Körpermarken kommen sonst nur mittelbar vor — über die Funktionsfassung. Seit LFH-786 prüft `body-mark-rendition-not-measured` die Fassungskennungen (`bodyMarkRenditions`); seit dem 2. Oktober 2026 nur noch gegen das ganze Anhang-C-Register, an einem anderen Paar überträgt `bodyMark()` die Fassung. Eine eigene Regel, welche Marke an welcher Körperform sitzen darf, gibt es nicht: ohne vermessene Fassung am Paar überträgt `bodyMark()` die nächstliegende Fassung derselben Marke hüllenrelativ, und eine Fähigkeit ohne jede randbündige Fassung zeichnet es als eingepasste Einzeldarstellung, beides mit Ableitungsnotiz (`derive/body-marks.ts`). Wie mehrere Marken zusammen stehen, ist als Daten belegt (Überlagerung, `CAPABILITY_COMBINATION_RULES`, LFH-567), aber keine Prüfregel.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'capabilities',
    coverage: 'partial',
    chapter: 'Kapitel 4',
    note: 'Keine Regel mehr in Kraft (Entscheidung vom 2. Oktober 2026; LFH-787 „AB“ ist damit umgekehrt). Hat das Paar aus Fähigkeit und Körperform eine vermessene Fassung (`capabilityInsetForm`), zeichnet `compose()` die Boxfähigkeit in dieser Fassung wie `bodyMarks`; ohne Fassung bleibt die Einzeldarstellung unskaliert, wo sie nachweislich im Körper bleibt (`CAPABILITY_UNSCALED_FIT`), und wird sonst ins Innenfeld eingepasst, mit Ableitungsnotiz (`derive/capabilities.ts`). Die Lücke: keine vermessene Fassung entsteht durch Einpassen (`CAPABILITY_INSET_RULE.fitToBox`), die eingepasste Zeichnung ist eine Ableitung. Mehrere Boxfähigkeiten stehen nebeneinander im Innenfeld; kein Original belegt das, die Anordnung ist als offene Frage in `CAPABILITY_COMBINATION_RULES` geführt, zwei Regeln sind vorgemerkt (`PLANNED_CAPABILITY_RULES`, LFH-567).',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'unit-grouping',
    coverage: 'none',
    chapter: '5.5',
    note: 'Keine eigene Regel: seit LFH-577 trägt `SymbolSpec.unitGrouping` den Verband, und er teilt die Kopfzonenregel `head-zone-conflict` mit Stärke, Verwaltungsstufe und technischer Kopfmarke. Vermessen sind Verband I und II über der Taktischen Formation und Verband I an der Person (I.5.7); Verband III und jeder andere Körper mit Kopfzone werden seit dem 2. Oktober 2026 abgeleitet gezeichnet (`derive/head-zone.ts`).',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'state',
    coverage: 'partial',
    chapter: '5.8',
    note: 'Seit LFH-577 trägt `SymbolSpec.states` die Zustände, und fünf Regeln sind in Kraft (Träger, Grenze je Skala, höchstens ein Hinweis seit dem Fachreview vom 5. Oktober 2026, keine Taktik am Träger, freistehende Werte). Eine Lage zeigt die Referenz aber nur für einen Personenzustand an der Person und für die Hinweise „?" und „!" an Person und Gefahr; für 5.8.1.5 bis 5.8.1.12, 5.8.2, 5.8.4, 5.8.5 und 5.8.9 ist weder ein Träger belegt noch entschieden, und die Komposition meldet sie als nicht vermessen.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'tendency',
    coverage: 'none',
    chapter: '5.8',
    note: 'Keine Regel in Kraft: seit LFH-577 trägt `SymbolSpec.tendency` höchstens eine Tendenz (ein Einzelfeld, eine zweite lässt sich nicht beschreiben), aber kein Original zeigt eine Tendenz an einem Träger. Die Komposition meldet jede Tendenz als nicht vermessen; die Trägerregel bleibt vorgemerkt (`PLANNED_STATE_RULES`), bis ein Träger belegt oder entschieden ist.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'movement',
    coverage: 'none',
    chapter: '5.2',
    note: 'Keine Regel in Kraft. Seit LFH-577 beschreibt die freistehende Spec-Art einen Pfeil (`kind: "movement"`, Verlauf als Parameter), ohne Anbindung an einen Körper: der Anbindungspunkt, die Zone `movement-anchor`, ist nur an der Personenraute unten belegt (5.8.8.12 bis 5.8.8.14, `anchoredMovementPath`) und dort Teil des Personenzustands. Die beiden Regeln über die Anbindung bleiben vorgemerkt (`PLANNED_PARAMETRIC_RULES`); ein zu kurzer oder aus der Fläche ragender Verlauf ist ein gewöhnlicher Fehler der Zeichnung, keine Regel.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'lines-and-boundaries',
    coverage: 'partial',
    chapter: 'Kapitel 2',
    note: 'Seit LFH-577 prüft `validateFreestandingSpec` die Stärke (nur an 2.20) und die zweite Darstellung (nur an 2.14). Keine Regel ist der Verlauf selbst: ein zu kurzer oder aus der Fläche ragender Verlauf ist ein gewöhnlicher Fehler der Zeichnung, und eine Stärke außer dem Zug an 2.20 meldet sie als nicht vermessen. Die Anbindung an ein Grundzeichen erzwingt die Form (`RETIRED_PARAMETRIC_RULES`).',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'weather',
    coverage: 'partial',
    chapter: '5.8.7',
    note: 'Drei Regeln in Kraft (doppelter Wert, mehr als zwei Werte, Intensität ohne Niederschlag an der Wolke). Andere Paare als die Wolke mit einem Niederschlag, etwa Sonne und Wind, und ein Niederschlag an der Wolke ohne Intensität sind weder belegt noch entschieden: die Zeichnung meldet sie als nicht vermessen, keine Regel verbietet sie. Ob Wetter an einem Grundzeichen stehen darf, ist offen.',
  } satisfies RuleDimensionGap),
  Object.freeze({
    dimension: 'animal',
    coverage: 'partial',
    chapter: '5.8.6',
    note: 'Eine Regel in Kraft (zweite Darstellung nur beim kontaminierten Tier). Die freistehende Spec-Art trägt genau einen Tierzustand; ob ein Tier zugleich erkrankt und kontaminiert sein darf und ob der Tierzustand an einem Grundzeichen stehen darf, ist offen (`STATE_GROUPS`, Gruppe `animals`).',
  } satisfies RuleDimensionGap),
]);

/** Nachschlag über alle drei Kataloge; `undefined` statt Wurf, die Erklärungsschicht entscheidet. */
export function ruleCatalogEntry(id: string): RuleCatalogEntry | undefined {
  return RULE_CATALOG.find((rule) => rule.id === id) ??
    COMPOSITION_RULE_CATALOG.find((rule) => rule.id === id) ??
    FREESTANDING_RULE_CATALOG.find((rule) => rule.id === id);
}
