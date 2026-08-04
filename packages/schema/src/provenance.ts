import type { Drawing } from './geometry.js';
import type { SymbolKind } from './taxonomy.js';

export type SourceId = 'bbk-babz-2025' | 'babz-svg-2025' | 'skk-2010' | 'org-profile';

/**
 * `verbatim`   — Geometrie entspricht der Referenz und ist per Fingerprint belegt
 * `derived`    — eigenständig konstruiert, fachlich an der Referenz orientiert
 * `legacy`     — aus der SKK-/DV-102-Systematik von 2010/2011
 * `organization-specific` — nur in einem Organisationsprofil gültig
 */
export type SourceStatus = 'verbatim' | 'derived' | 'legacy' | 'organization-specific';

export interface SourceReference {
  source: SourceId;
  section?: string;
  page?: number;
  /** Dateiname der Referenz. Die Datei selbst wird nie eingecheckt. */
  asset?: string;
  status: SourceStatus;
}

export type DepictionVariant = 'primary' | 'alternative';

export interface Depiction {
  variant: DepictionVariant;
  drawing: Drawing;
  sourceRefs: readonly SourceReference[];
}

export interface CatalogEntry {
  /** Stabile semantische ID, z. B. `base.formation` oder `capability.fire-fighting`. */
  id: string;
  title: string;
  kind: SymbolKind;
  /** Mindestens eine Darstellung; `primary` genau einmal. */
  depictions: readonly Depiction[];
  synonyms?: readonly string[];
  legacyIds?: readonly string[];
}

/**
 * Schlüssel des Coverage-Manifests. `sourceId` allein ist nicht eindeutig:
 * 4.1.6 existiert als Basisdarstellung und als Alternative.
 */
export function entryKey(sourceId: string, variant: DepictionVariant): string {
  return `${sourceId}#${variant}`;
}
