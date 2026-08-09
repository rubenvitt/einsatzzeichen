import type { Drawing } from './geometry.js';
import type { ProfileId } from './profile.js';
import type { SymbolKind } from './taxonomy.js';

/**
 * Die registrierten Quellen. Die Werte werden hier deklariert, nicht aus `SOURCE_REGISTRY`
 * abgeleitet: `schema` darf nicht von `catalog` abhängen. Die Gegenrichtung — kein Literal ohne
 * Registereintrag — erzwingt `satisfies Record<SourceId, SourceRecord>` in `catalog/src/sources.ts`.
 */
export type SourceId =
  | 'bbk-babz-2025'
  | 'babz-svg-2025'
  | 'babz-hinweise-2024'
  | 'skk-2010'
  | 'fwdv-100'
  | 'fwdv-800'
  | 'thw-einheiten'
  | 'phjardas-tz'
  | 'din-14033'
  | 'din-13050'
  | 'din-14034-6'
  | 'din-14095'
  | 'arimo-ofl';

/**
 * `verbatim`   — Geometrie entspricht der Referenz und ist per Fingerprint belegt
 * `derived`    — eigenständig konstruiert, fachlich an der Referenz orientiert
 * `legacy`     — aus der SKK-/DV-102-Systematik von 2010/2011
 *
 * `'organization-specific'` ist entfallen: die Profilzugehörigkeit hängt am Katalogeintrag
 * (`CatalogEntry.profile`), nicht am Quellenbezug.
 */
export type SourceStatus = 'verbatim' | 'derived' | 'legacy';

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
  /**
   * Profilzugehörigkeit. Pflichtfeld, nicht optional: bei einem optionalen Feld wäre
   * „kein Profil angegeben" von „gehört zum Kern" nicht unterscheidbar, und die Regel
   * „kein Profileintrag landet unbemerkt im Kern" damit nicht prüfbar.
   */
  profile: ProfileId;
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
