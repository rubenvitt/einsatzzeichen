import type { ProfileId } from './profile.js';
import type { DepictionVariant, SourceId } from './provenance.js';
import type { ReviewSet } from './review.js';

export type CoverageKind = 'catalog-entry' | 'composition-recipe';

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
  fingerprintTest: boolean;
  snapshotTest: boolean;
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
