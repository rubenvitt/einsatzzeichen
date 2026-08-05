import type { DepictionVariant } from './provenance.js';
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
  fingerprintTest: boolean;
  snapshotTest: boolean;
  review: ReviewSet;
}

export interface CoverageManifest {
  baseline: 'bbk-babz-2025';
  /** Kapitel und Anhänge, die dieser Slice beansprucht. */
  scope: readonly string[];
  entries: readonly CoverageEntry[];
}
