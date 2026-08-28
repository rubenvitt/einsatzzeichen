import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { ELEMENTS } from './elements.js';
import { referenceInventoryAssets } from './fingerprint-index.js';
import { RECIPES } from './recipes.js';

/**
 * Wohin eine Datei des Referenzinventars gehört. Genau eine Disposition je Datei:
 *
 * - `claimed` — eine Manifestzeile, ein Rezept oder ein Element nennt sie als Beleg.
 * - `out-of-scope` — ihr Abschnitt liegt außerhalb von `COVERAGE_MANIFEST.scope`. Wird
 *   **abgeleitet**, nie gelistet: eine Liste müsste bei jeder Umfangserweiterung gepflegt werden
 *   und liefe dann gegen den `scope` auseinander.
 * - `example` — eine Beispielanwendung der Baseline (5.8.1, 5.8.7, J.2.3), die kein eigenes
 *   Zeichen und keine eigene ID trägt. Sie bleibt bewusst ohne Manifestzeile: eine Zeile
 *   behauptete eine Umsetzung, die es fachlich nicht gibt.
 * - `overview-sheet` — ein Übersichtsblatt, das mehrere bereits einzeln belegte Zeichen
 *   zusammenstellt (`J_Bedienungszeichen.svg`, 80 × 32 mm).
 * - `deferred` — eine Datei im beanspruchten Umfang, deren Umsetzung fachlich zurückgestellt ist,
 *   mit Begründung und Entscheidungsnotiz. Das ist **kein** stilles Vergessen: das Gate meldet
 *   jede Datei, die hier nicht steht und auch sonst nirgends beansprucht ist.
 *
 * **Vorrang.** Eine explizit gelistete Disposition gewinnt gegen das abgeleitete
 * `out-of-scope`: `J_Bedienungszeichen.svg` liegt mit Präfix `J` außerhalb jedes Umfangspräfixes
 * und wäre still entschuldigt — es ist aber der Motivationsfall dieser Aufgabe und **muss**
 * als `overview-sheet` benannt sein. Eine Datei, die gelistet ist und zugleich außerhalb liegt,
 * ist deshalb kein Befund; sie zählt zu ihrer gelisteten Disposition. Ein Befund
 * (`ambiguous-disposition`) entsteht nur, wenn dieselbe Datei mehrfach gelistet ist.
 *
 * **Warum keine eigene Coverage-Art.** LFH-414 fragte, ob Beispiel- und Übersichtsposten eine
 * eigene `CoverageKind` brauchen. Nein: eine Manifestzeile ist ein Umsetzungsnachweis mit
 * Testevidenz und Review; ein Beispiel hat keine Umsetzung, ein Übersichtsblatt keine eigene.
 * Was fehlte, war nicht eine Zeichenart, sondern die Vollständigkeitsprüfung gegen das Inventar —
 * und die sitzt hier.
 */
export type InventoryDisposition = 'claimed' | 'out-of-scope' | 'example' | 'overview-sheet' | 'deferred';

export type ExclusionDisposition = Exclude<InventoryDisposition, 'claimed' | 'out-of-scope'>;

export interface InventoryExclusion {
  readonly asset: string;
  readonly disposition: ExclusionDisposition;
  /** Fachliche Begründung, Pflicht und nicht leer. */
  readonly reason: string;
  /**
   * Pfad der Entscheidungsnotiz unter `docs/decisions/`. Geprüft wird die Form, nicht die
   * Existenz der Datei: die Notiz eines laufenden Slices entsteht mit ihm, und das Gate darf
   * nicht davon abhängen, in welcher Reihenfolge Code und Notiz geschrieben werden.
   */
  readonly decidedIn: string;
}

const ANHANG_J_D3 = 'docs/decisions/2026-08-10-anhang-j-iuk-d3.md';
const KAPITEL_5_8_D2 = 'docs/decisions/2026-08-07-kapitel-5-8-zustaende-d2.md';
const LFH_403 = 'docs/decisions/2026-08-28-lfh-403-gates-und-werkzeuge.md';

const COLOR_SHEET_REASON =
  'Farbtafel aus Kapitel 2: die Datei zeigt eine Farbfläche ohne Zeichenkörper. Sie belegt einen ' +
  'Farbwert für Linien und Flächen der Lagedarstellung, kein Einzelzeichen des Symbolsystems; ob sie ' +
  'als Element (Farbtoken) mit Vermessung geführt wird, ist nicht entschieden.';
const LINE_SIGN_REASON =
  'Linien- bzw. Flächenzeichen der Lagedarstellung aus Kapitel 2 (Grenze, Riegel, Ausbreitung, ' +
  'Fluchtweg). Der Katalog führt keinen Linientyp; diese Zeichen sind nicht in der 32-mm-ViewBox ' +
  'komponierbar und bleiben bis zu einer eigenen Linienzeichen-Aufgabe zurückgestellt.';

function deferred(asset: string, reason: string): InventoryExclusion {
  return { asset, disposition: 'deferred', reason, decidedIn: LFH_403 };
}

function example(asset: string, reason: string, decidedIn: string): InventoryExclusion {
  return { asset, disposition: 'example', reason, decidedIn };
}

/**
 * Jede Datei des Referenzinventars, die im beanspruchten Umfang liegt, aber bewusst ohne
 * Manifestzeile bleibt — plus das eine Übersichtsblatt außerhalb jedes Präfixes. Die Liste ist
 * gegatet: ein Eintrag für eine Datei, die es nicht gibt oder die inzwischen beansprucht ist,
 * ist `stale-exclusion`; eine Datei im Umfang, die weder hier noch in einer Beanspruchung steht,
 * ist `unaccounted-reference`.
 */
export const INVENTORY_EXCLUSIONS: readonly InventoryExclusion[] = Object.freeze([
  {
    asset: 'J_Bedienungszeichen.svg',
    disposition: 'overview-sheet',
    reason:
      'Übersichtsblatt (80 × 32 mm) des Anhangs J, das die einzeln belegten Bedienungszeichen aus ' +
      'J.1 bis J.4 zusammenstellt; es trägt kein eigenes Zeichen und keine eigene ID.',
    decidedIn: ANHANG_J_D3,
  },
  example(
    'J.2.3._Beispiel Telefon.svg',
    'Beispielanwendung zu J.2.3 ohne eigene Comms-ID; in D.3 ausdrücklich an diese Aufgabe verwiesen.',
    ANHANG_J_D3,
  ),
  example(
    'J.2.3._Beispiel Wählbetrieb.svg',
    'Beispielanwendung zu J.2.3 ohne eigene Comms-ID; in D.3 ausdrücklich an diese Aufgabe verwiesen.',
    ANHANG_J_D3,
  ),
  ...['5.8.1_Beispiel 1.svg', '5.8.1_Beispiel 2.svg', '5.8.1_Beispiel 3.svg'].map((asset) =>
    example(
      asset,
      'Beispielanwendung zu 5.8.1 (Zustand am Zeichen), keine State-ID; in D.2 ausdrücklich an diese Aufgabe verwiesen.',
      KAPITEL_5_8_D2,
    ),
  ),
  ...[
    '5.8.7_Beispiel_Schneiend_extrem.svg',
    '5.8.7_Beispiel_Schneiend_mittel.svg',
    '5.8.7_Beispiel_Schneiend_schwach.svg',
    '5.8.7_Beispiel_Schneiend_stark.svg',
  ].map((asset) =>
    example(
      asset,
      'Beispielanwendung zu 5.8.7 (Intensitätsstufe), keine State-ID; in D.2 ausdrücklich an diese Aufgabe verwiesen.',
      KAPITEL_5_8_D2,
    ),
  ),
  deferred('2.9_Schwarz.svg', COLOR_SHEET_REASON),
  deferred('2.10_Blau.svg', COLOR_SHEET_REASON),
  deferred('2.11_Rot.svg', COLOR_SHEET_REASON),
  deferred('2.12_Gelb.svg', COLOR_SHEET_REASON),
  deferred('2.13_Grün.svg', COLOR_SHEET_REASON),
  deferred('2.14_Escape Route.svg', LINE_SIGN_REASON),
  deferred('2.14_Escape Route_2.svg', LINE_SIGN_REASON),
  deferred('2.15_Riegelstellung.svg', LINE_SIGN_REASON),
  deferred('2.16_Brandausbreitung.svg', LINE_SIGN_REASON),
  deferred('2.17_Grenze Einsatzraum TEL.svg', LINE_SIGN_REASON),
  deferred('2.18_Grenze Einsatzabschnitt.svg', LINE_SIGN_REASON),
  deferred('2.19_Grenze Unterabschnitt.svg', LINE_SIGN_REASON),
  deferred('2.20_Grenze mit taktischer Stärke.svg', LINE_SIGN_REASON),
  deferred(
    '5.1.1_Fahrzeug_ungeschützt.svg',
    'Kopfdatei des Abschnitts 5.1.1; die Fahrwerkszonen sind an den Einzeldateien 5.1.1.1 bis ' +
      '5.1.1.6 vermessen, ihr Inhalt selbst ist nicht gesondert vermessen und trägt keine eigene ID.',
  ),
  deferred(
    '5.1.1.4_Amphibienfahrzeug.svg',
    'Die Wellenlinie des Amphibienfahrzeugs ist nur als Strichhülle vermessen; `amphibienfahrzeug` ' +
      'bleibt ohne Fahrwerkselement, bis die Linie selbst vermessen ist.',
  ),
  deferred(
    '5.1.1.7_Kraftfahrzeug_aufgleisbar.svg',
    'Fahrwerksform „aufgleisbar" ist nicht vermessen; `VehicleCategoryId` führt sie nicht.',
  ),
  deferred(
    '5.1.1.8_Kraftfahrzeug_straßenfähig_Wechsellader.svg',
    'Wechsellader-Fahrwerk aus 5.1.1 ist nicht gegen diese Datei vermessen; die Art ' +
      '`swap-loader-vehicle` ist an Anhang E belegt, nicht an Kapitel 5.',
  ),
  deferred(
    '5.1.1.9_Kraftfahrzeug_straßenfähig_Wechselbehälter.svg',
    'Wechselbehälter-Fahrwerk aus 5.1.1 ist nicht vermessen; `VehicleCategoryId` führt es nicht.',
  ),
]);

/**
 * Abschnitte im beanspruchten Umfang, die in der Baseline **kein eigenes Zeichen** haben und
 * deshalb weder Manifestzeile noch Referenzdatei tragen. Heute nur J.2.3: der Abschnitt
 * besteht aus zwei Beispielanwendungen (oben als `example` ausgeschlossen) und hat keine Datei
 * `J.2.3_….svg`. `sectionsWithoutEntry` kann so einen Abschnitt nicht melden — es sieht nur
 * Dateien —, und `uncoveredScope` prüft nur Präfixe. Die Entscheidung „Abschnitt ohne
 * Zeicheneintrag" steht deshalb hier ausdrücklich; der Test hält fest, dass zu keinem dieser
 * Abschnitte eine nicht ausgeschlossene Inventardatei existiert.
 */
export const SECTIONS_WITHOUT_SIGN: readonly string[] = Object.freeze(['J.2.3']);

/**
 * Abschnittsnummer einer Referenzdatei: der Name bis zum ersten `_`. Das ist die Bauart des
 * Bestands (`5.4.2_Staffel.svg`), auf die sich schon `checkElementEntries` stützt. Zwei Ränder:
 * `J_Bedienungszeichen.svg` hat keinen Punkt (Abschnitt `J`), und `2.14_Escape Route_2.svg`
 * trägt einen zweiten Unterstrich im Namen, der nicht zur Nummer gehört. Ein abschließender
 * Punkt wie in `J.2.3._Beispiel Telefon.svg` oder `D.1.6._Unterabschnittsleitung im Einsatz.svg`
 * ist eine Eigenheit der Quelldateinamen und wird abgeschnitten — die Manifestzeile heißt
 * `D.1.6`, und der Vergleich muss beides als denselben Abschnitt lesen.
 */
export function sectionOfAsset(asset: string): string {
  const underscore = asset.indexOf('_');
  const section = underscore !== -1 ? asset.slice(0, underscore) : asset.replace(/\.svg$/, '');
  return section.endsWith('.') ? section.slice(0, -1) : section;
}

/** Dieselbe Präfixregel wie `uncoveredScope` in `coverage-gate.ts`: gleich oder Präfix mit Punkt. */
export function isSectionInScope(section: string, scope: readonly string[]): boolean {
  return scope.some((chapter) => section === chapter || section.startsWith(`${chapter}.`));
}

/**
 * Alle beanspruchten Referenzdateien aus **drei** Quellen. Das Manifest allein reicht nicht:
 * ein Rezept beansprucht seine Datei über `referenceAsset`, ohne dass die Manifestzeile eine
 * zweite Datei nennen könnte, und ein Element (Stärkegrad, Fahrwerk) belegt sich an mehreren
 * Dateien, von denen nur die namensgebende in der Manifestzeile steht. Erst die Vereinigung
 * sagt, welche Datei irgendwo als Beleg dient.
 */
export function claimedReferenceAssets(): Set<string> {
  const claimed = new Set<string>();
  for (const entry of COVERAGE_MANIFEST.entries) claimed.add(entry.referenceAsset);
  for (const recipe of Object.values(RECIPES)) claimed.add(recipe.referenceAsset);
  for (const element of Object.values(ELEMENTS)) {
    for (const asset of element.referenceAssets) claimed.add(asset);
  }
  return claimed;
}

export interface ReferenceInventory {
  total: number;
  claimed: number;
  outOfScope: number;
  excludedByDisposition: Record<ExclusionDisposition, number>;
  /** Dateien im Umfang, die weder beansprucht noch ausgeschlossen sind — der „fünfte Posten". */
  unaccounted: string[];
  /** Ausschlüsse für Dateien, die es nicht gibt oder die inzwischen beansprucht sind. */
  staleExclusions: string[];
  /**
   * Abschnitte im Umfang mit mindestens einer nicht ausgeschlossenen Datei, aber ohne
   * Manifestzeile. `uncoveredScope` sieht so etwas nicht: es prüft je Kapitelpräfix nur, ob
   * **eine** Zeile damit beginnt. Ein Abschnitt wie J.2.3 mit null Zeilen ist dort unsichtbar.
   */
  sectionsWithoutEntry: string[];
}

function manifestSectionOf(sourceId: string): string {
  const separator = sourceId.indexOf(':');
  return separator === -1 ? sourceId : sourceId.slice(separator + 1);
}

/**
 * Der parametrisierte Kern, im Muster von `blockersOf`: alle Eingaben als Parameter, damit
 * sich Randfälle mit Fixtures nachstellen lassen.
 */
export function inventoryOf(
  inventory: readonly string[],
  claimedAssets: readonly string[] | ReadonlySet<string>,
  exclusions: readonly InventoryExclusion[],
  scope: readonly string[],
  manifestSections: readonly string[],
): ReferenceInventory {
  const inventorySet = new Set(inventory);
  const claimedSet = claimedAssets instanceof Set ? claimedAssets : new Set(claimedAssets);
  const exclusionByAsset = new Map(exclusions.map((exclusion) => [exclusion.asset, exclusion]));
  const sectionsWithEntry = new Set(manifestSections);

  const staleExclusions = exclusions
    .filter((exclusion) => !inventorySet.has(exclusion.asset) || claimedSet.has(exclusion.asset))
    .map((exclusion) => exclusion.asset);

  const excludedByDisposition: Record<ExclusionDisposition, number> = {
    example: 0,
    'overview-sheet': 0,
    deferred: 0,
  };
  let claimed = 0;
  let outOfScope = 0;
  const unaccounted: string[] = [];
  const sectionsWithoutEntry = new Set<string>();

  for (const asset of inventory) {
    const section = sectionOfAsset(asset);
    if (claimedSet.has(asset)) {
      claimed += 1;
      if (isSectionInScope(section, scope) && !sectionsWithEntry.has(section)) {
        sectionsWithoutEntry.add(section);
      }
      continue;
    }
    const exclusion = exclusionByAsset.get(asset);
    if (exclusion !== undefined) {
      excludedByDisposition[exclusion.disposition] += 1;
      continue;
    }
    if (!isSectionInScope(section, scope)) {
      outOfScope += 1;
      continue;
    }
    unaccounted.push(asset);
    if (!sectionsWithEntry.has(section)) sectionsWithoutEntry.add(section);
  }

  return {
    total: inventory.length,
    claimed,
    outOfScope,
    excludedByDisposition,
    unaccounted,
    staleExclusions,
    sectionsWithoutEntry: [...sectionsWithoutEntry].sort(),
  };
}

/** `inventoryOf` über den echten Bestand: Kennwertartefakt, Manifest, Rezepte, Elemente. */
export function referenceInventory(): ReferenceInventory {
  return inventoryOf(
    referenceInventoryAssets(),
    claimedReferenceAssets(),
    INVENTORY_EXCLUSIONS,
    COVERAGE_MANIFEST.scope,
    COVERAGE_MANIFEST.entries.map((entry) => manifestSectionOf(entry.sourceId)),
  );
}
