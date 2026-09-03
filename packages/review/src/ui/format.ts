/**
 * Beschriftungen. Der Vertrag liefert Schlüsselwörter (`composition-recipe`, `deviation`), die
 * Oberfläche zeigt Sätze auf Deutsch. Die Übersetzung steht hier zentral, damit derselbe Begriff
 * im Navigator, in der Befundtafel und in der Hilfe nicht dreimal unterschiedlich heißt.
 */
import type { CoverageKind, DepictionVariant, ReviewStatus } from '@einsatzzeichen/schema';
import type { CarrierKind } from '../contract';

export const STATUS_ORDER: readonly ReviewStatus[] = ['pending', 'approved', 'deviation'];

const STATUS_LABELS: Record<ReviewStatus, string> = {
  pending: 'offen',
  approved: 'freigegeben',
  deviation: 'Abweichung',
};

export function statusLabel(status: ReviewStatus): string {
  return STATUS_LABELS[status];
}

const COVERAGE_LABELS: Record<CoverageKind, string> = {
  'catalog-entry': 'Katalogeintrag',
  'composition-recipe': 'Kompositionsrezept',
  element: 'Element',
};

export function coverageLabel(kind: CoverageKind): string {
  return COVERAGE_LABELS[kind];
}

const VARIANT_LABELS: Record<DepictionVariant, string> = {
  primary: 'Hauptdarstellung',
  alternative: 'Alternativdarstellung',
};

export function variantLabel(variant: DepictionVariant): string {
  return VARIANT_LABELS[variant];
}

const CARRIER_LABELS: Record<CarrierKind, string> = {
  manifest: 'Manifestzeile',
  source: 'Quelle',
  profile: 'Profil',
};

export function carrierKindLabel(kind: CarrierKind): string {
  return CARRIER_LABELS[kind];
}
