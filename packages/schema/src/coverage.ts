import type { DepictionVariant } from './provenance.js';

export type CoverageKind = 'catalog-entry' | 'composition-recipe';

export type ReviewStatus = 'pending' | 'approved' | 'deviation';

export interface Review {
  status: ReviewStatus;
  reviewer?: string;
  /** ISO-Datum, z. B. "2026-08-04". */
  date?: string;
  note?: string;
}

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
  review: Review;
}

export interface CoverageManifest {
  baseline: 'bbk-babz-2025';
  /** Kapitel und Anhänge, die dieser Slice beansprucht. */
  scope: readonly string[];
  entries: readonly CoverageEntry[];
}
