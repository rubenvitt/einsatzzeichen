/** Grundzeichenart nach Kapitel 1 der BBK/BABZ-Empfehlung. */
export type SymbolKind =
  | 'formation'
  | 'person'
  | 'vehicle-land'
  | 'vehicle-air'
  | 'vehicle-water'
  | 'post'
  | 'building'
  | 'container'
  | 'area'
  | 'measure'
  | 'hazard'
  | 'point'
  | 'event'
  | 'spontaneous-helper';

/** Organisationen nach Kapitel 2. Bestimmen die Körperfarbe. */
export type OrganizationId =
  | 'feuerwehr'
  | 'thw'
  | 'fuehrung-leitung'
  | 'polizei'
  | 'bundeswehr'
  | 'sonstige-gefahrenabwehr'
  | 'zivile-einheiten'
  | 'hilfsorganisation';

/** Taktische Stärke nach Kapitel 5.4. Bestimmt die Kopfzone. */
export type StrengthId = 'trupp' | 'staffel' | 'gruppe' | 'zug';

/** Verwaltungsstufen nach Kapitel 5.7. */
export type AdminLevelId =
  | 'gemeinde'
  | 'kreis'
  | 'bezirk'
  | 'bundesland'
  | 'nationalstaat'
  | 'europaeische-union';

/** Fahrzeugkategorien nach Kapitel 5.1. */
export type VehicleCategoryId =
  | 'kfz-kategorie-1'
  | 'kfz-kategorie-2'
  | 'kfz-kategorie-3'
  | 'amphibienfahrzeug'
  | 'kettenfahrzeug'
  | 'schienenfahrzeug';

/**
 * Fähigkeiten nach Kapitel 4. Wächst je Unter-Slice, nicht vorauseilend: ein Literal ohne
 * Piktogramm wäre eine typsichere Behauptung über eine Fähigkeit, die der Katalog nicht zeichnen
 * kann. D.1 bringt die vollen 88.
 */
export type CapabilityId =
  | 'cbrn-protection'
  | 'cbrn-detection'
  | 'decontamination'
  | 'water-environmental-damage-control'
  | 'drinking-water-treatment'
  | 'radioactive-materials'
  | 'biological-materials'
  | 'chemical-materials'
  | 'care'
  | 'psychosocial-emergency-care'
  | 'pastoral-care'
  | 'temporary-accommodation-resting'
  | 'temporary-accommodation-seating'
  | 'fire-fighting'
  | 'service-water'
  | 'foam-agent'
  | 'solid-extinguishing-agent'
  | 'gaseous-extinguishing-agent'
  | 'respiratory-protection'
  | 'reconnaissance'
  | 'biological-location'
  | 'technical-location'
  | 'recovery'
  | 'rescue-portable-ladders'
  | 'rescue-aerial-ladder'
  | 'rescue-articulated-boom'
  | 'watercraft-operations'
  | 'mountain-rescue'
  | 'special-height-depth-rescue'
  | 'water-rescue';

/** Semantische Beschreibung eines Zeichens. Eingabe des Kompositionsmotors. */
export interface SymbolSpec {
  kind: SymbolKind;
  organization?: OrganizationId;
  strength?: StrengthId;
  administrativeLevel?: AdminLevelId;
  vehicleCategory?: VehicleCategoryId;
  capabilities?: readonly CapabilityId[];
  designation?: string;
}
