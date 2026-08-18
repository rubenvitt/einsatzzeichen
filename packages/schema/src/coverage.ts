import type { ProfileId } from './profile.js';
import type { DepictionVariant, SourceId } from './provenance.js';
import type { ReviewSet } from './review.js';

/**
 * `element` bezeichnet ein Einzelelement, das keine eigene Zeichnung ist, aber eine an der
 * Referenz belegte Regel trägt: eine Organisationsfarbe, ein Stärkegrad, ein Piktogramm.
 */
export type CoverageKind = 'catalog-entry' | 'composition-recipe' | 'element';

/**
 * Maschineller Nachweis, der eine Manifestzeile tatsächlich absichert. Die Arten sind bewusst
 * fachlich enger als ein allgemeines `tested: boolean`: Nicht jede Implementierung besitzt einen
 * `body`, und nicht jedes Element ist eine eigenständig renderbare Zeichnung.
 */
export type TestEvidenceKind =
  | 'body-fingerprint'
  /**
   * Steht an die Stelle von `body-fingerprint`, wo das Kennwertartefakt **keine vergleichbare
   * Form** führt: der Extraktor legt für einen Kurvenpfad nichts ab (`shapes: []`), und
   * `matchFingerprint` bricht dann ab, bevor es den Körper überhaupt ansieht. Betroffen sind seit
   * LFH-424 die fünf Kurvenkörper aus Kapitel 1 (1.3, 1.4, 1.5, 1.9, 1.14). An seine Stelle tritt
   * ein an den vermessenen Zahlen festgenagelter Test — dasselbe Muster wie
   * `head-shape-regression`, das aus demselben Grund existiert (Kopfmarken tragen `role: 'head'`
   * und werden vom Fingerprint-Gate nie erfasst).
   *
   * Der Unterschied zu `body-fingerprint` ist kein Verfahrensdetail, sondern die Provenienz des
   * Erwartungswerts: dort steht er im eingecheckten Artefakt, hier in der Testdatei.
   */
  | 'body-geometry-regression'
  | 'svg-snapshot'
  | 'reference-fill'
  | 'head-shape-regression'
  /**
   * Das Gegenstück zu `head-shape-regression` für die Fahrwerkszone aus Kapitel 5.1. Aus
   * demselben Grund eine eigene Art und keine Wiederverwendung: `matchFingerprint` vergleicht
   * ausschließlich `role: 'body'` und sieht Marken mit `role: 'chassis'` nie — und eine
   * `ChassisShape` ist keine `HeadShape`, sie verankert an der Körperunterkante und kennt neben
   * dem Kreis auch das Stadion und den Verbindungsstrich. Zwei Arten unter einem Namen ließen
   * die Mengengleichheit „geprüfte Fälle = beanspruchte Zeilen" beide zugleich behaupten, ohne
   * dass eine der beiden Testsuiten sie allein einhalten müsste.
   */
  | 'chassis-shape-regression'
  | 'pictogram-contract';

export interface CoverageEntry {
  sourceId: string;
  variant: DepictionVariant;
  title: string;
  /** Semantische ID des umsetzenden Katalogeintrags oder Rezepts. */
  implementation: string;
  referenceAsset: string;
  coverage: CoverageKind;
  /**
   * Steht auch hier und nicht nur am Katalogeintrag: Rezepte und Elemente sind keine
   * `CatalogEntry`s, ihre Zugehörigkeit stünde sonst nirgends. Für Zeilen mit
   * `coverage: 'catalog-entry'` ist der Wert aus dem Katalogeintrag abgeleitet, und das
   * Coverage-Gate prüft die Gleichheit.
   */
  profile: ProfileId;
  /** Nachweisarten, deren Testfallmengen gegen das Manifest gegatet werden. */
  testEvidence: readonly TestEvidenceKind[];
  review: ReviewSet;
}

export interface CoverageManifest {
  /** Bezeichnet die Abschnittsnummerierung, aus der jeder `CoverageEntry.sourceId` sein Präfix zieht. */
  baseline: SourceId;
  /** Datenversion des bundesweiten Kernkatalogs, unabhängig von den npm-Paketversionen. */
  coreVersion: string;
  /** Kapitel und Anhänge, die dieser Slice beansprucht. */
  scope: readonly string[];
  entries: readonly CoverageEntry[];
}
