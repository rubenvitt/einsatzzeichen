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

/** Fähigkeiten nach Kapitel 4 in verbindlicher Kapitelreihenfolge. */
export const CAPABILITY_IDS = Object.freeze([
  'cbrn-protection',
  'cbrn-detection',
  'decontamination',
  'water-environmental-damage-control',
  'drinking-water-treatment',
  'radioactive-materials',
  'biological-materials',
  'chemical-materials',
  'care',
  'psychosocial-emergency-care',
  'pastoral-care',
  'temporary-accommodation-resting',
  'temporary-accommodation-seating',
  'fire-fighting',
  'service-water',
  'foam-agent',
  'solid-extinguishing-agent',
  'gaseous-extinguishing-agent',
  'respiratory-protection',
  'reconnaissance',
  'biological-location',
  'technical-location',
  'recovery',
  'rescue-portable-ladders',
  'rescue-aerial-ladder',
  'rescue-articulated-boom',
  'watercraft-operations',
  'mountain-rescue',
  'special-height-depth-rescue',
  'water-rescue',
  'medical-service',
  'nursing',
  'intensive-care',
  'physician',
  'patient-transport',
  'hospital',
  'water-hazard-control',
  'excavation',
  'lighting',
  'ventilation',
  'air-extraction',
  'explosive-ordnance-clearance',
  'hand-tools',
  'forklift-lifting',
  'crane-lifting',
  'lifting-loads-persons',
  'lifting-clearing',
  'remote-manipulation',
  'chainsaw',
  'pumping',
  'mechanized-clearing',
  'safety',
  'blasting',
  'technical-assistance',
  'transport',
  'door-opening',
  'overcoming-height-differences',
  'securing',
  'optical-warning',
  'loudspeaker-warning',
  'siren-warning',
  'water-conveyance',
  'water-retention',
  'load-pulling',
  'container-resource',
  'fuels-consumables',
  'bridge',
  'temporary-bridge-construction',
  'waste-disposal',
  'maintenance',
  'sandbag',
  'sandbag-filling',
  'washing-facility',
  'toilet-facility',
  'power-supply',
  'drinking-water',
  'catering',
  'meal-preparation',
  'rapid-deployment-tent',
  'frame-tent',
  'information-communications',
  'veterinary',
  'slaughter-culling',
  'chicken',
  'horse',
  'cattle',
  'sheep',
  'pig',
] as const);

export type CapabilityId = (typeof CAPABILITY_IDS)[number];

/** Zustände nach Kapitel 5.8 in verbindlicher Kapitelreihenfolge. */
export const STATE_IDS = Object.freeze([
  'tactical-rescue',
  'tactical-attack',
  'tactical-defense',
  'tactical-retreat',
  'flooded-area',
  'water-ingress-hazard',
  'hazardous-substances',
  'radioactivity-hazard',
  'electrical-energy-hazard',
  'mineral-oil-hazard',
  'suspected-situation',
  'acute-situation',
  'activity-slightly-increased-outage-up-to-25-percent',
  'activity-moderately-increased-outage-up-to-50-percent',
  'activity-significantly-increased-outage-up-to-75-percent',
  'activity-strongly-increased-total-outage',
  'tendency-rising',
  'tendency-unchanged',
  'tendency-falling',
  'damaged',
  'partially-destroyed',
  'destroyed',
  'incipient-fire',
  'developed-fire',
  'fully-developed-fire',
  'sick-animal',
  'contaminated-animal',
  'dead-animal',
  'person-uninjured',
  'person-affected',
  'person-injured',
  'person-injured-triage-category',
  'person-injured-transport-priority',
  'person-contaminated',
  'person-dead',
  'person-missing',
  'person-in-water-danger',
  'person-in-distress',
  'person-rescued',
  'person-to-be-transported',
  'person-in-transport',
  'person-transported',
  'person-needing-special-care',
  'person-care-dependent',
  'person-mobility-impaired',
] as const);

export type StateId = (typeof STATE_IDS)[number];

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
