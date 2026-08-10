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
  'explosion-hazard',
  'explosive-ordnance-hazard',
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
  'weather-sunny',
  'weather-cloudy',
  'weather-cloud-cover-four-eighths',
  'weather-foggy',
  'weather-rainy',
  'weather-hailing',
  'weather-thunderstorm',
  'weather-snowing',
  'weather-temperature',
  'weather-windy',
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
  'route-closed',
  'one-way-traffic',
  'route-difficult-to-pass',
  'route-impassable',
] as const);

export type StateId = (typeof STATE_IDS)[number];

/** IuK-Zeichen nach Anhang J in verbindlicher Kapitelreihenfolge. */
export const COMMS_IDS = Object.freeze([
  'voice',
  'voice-radio',
  'voice-radio-dmo',
  'voice-radio-tmo',
  'sds-dmo',
  'sds-tmo',
  'voice-radio-dmo-repeater',
  'data-transmission',
  'fax-transmission',
  'image-transmission',
  'livestream-transmission',
  'satellite-voice',
  'satellite-data',
  'directional-radio',
  'half-duplex-operation',
  'duplex-operation',
  'telecom-device',
  'base-station',
  'mobile-base-station',
  'gateway',
  'repeater',
  'handheld-radio-terminal',
  'mobile-radio-terminal',
  'fixed-radio-terminal',
  'active-paging-radio-terminal',
  'antenna',
  'cable-construction',
  'radio',
  'transitions',
  'telephone-exchange',
  'telephone-exchange-voip',
  'router',
  'switch',
  'server',
  'access-point',
  'wan',
  'firewall',
  'printer',
  'connection-length',
  'pickup-point',
  'connection-point',
  'connection-crossing',
  'distributor',
  'distributor-with-surge-protection',
  'cable-temporary',
  'fiber-temporary',
  'network-cable-temporary',
  'twisted-pair-count',
] as const);

export type CommsId = (typeof COMMS_IDS)[number];

/**
 * Schadenszeichen nach den Anhängen K (Bauwerksschäden) und L (Deichverteidigung), in
 * verbindlicher Kapitelreihenfolge — erst K.1 bis K.18, dann L.1 bis L.10.
 *
 * **Zwei Anhänge, ein ID-Raum.** Das ist keine nachträgliche Zusammenlegung, sondern die
 * Aufteilung, die `pictogram.ts` seit D.0 als Vertrag führt: `DamageId` deckt K und L ab,
 * `WildfireId` allein M. Beide Anhänge beschreiben denselben Gegenstand — einen Schaden an einem
 * Bauwerk, den ein Erkundungstrupp in eine Lagekarte einträgt; ein Deich ist dabei nichts anderes
 * als ein sehr langes Bauwerk. Getrennte Räume hätten eine Grenze behauptet, die die Zeichen
 * selbst nicht ziehen.
 */
export const DAMAGE_IDS = Object.freeze([
  'room-blocked',
  'room-damaged',
  'half-room-damaged',
  'room-damaged-swallow-nest',
  'room-filled',
  'room-filled-fine-debris',
  'room-filled-layered',
  'room-filled-water',
  'slip-surface',
  'layering',
  'edge-debris',
  'upper-floors',
  'middle-floors',
  'lower-floors',
  'timber-beam-ceiling',
  'girder-ceiling',
  'solid-slab-ceiling',
  'vaulted-ceiling',
  'imminent-overflow',
  'overflow',
  'local-through-flow',
  'through-flow',
  'local-undercutting',
  'undercutting',
  'slope-slippage',
  'outer-dyke-damage',
  'dyke-breach',
  'seepage-line-marker',
] as const);

export type DamageId = (typeof DAMAGE_IDS)[number];

/** Vegetationsbrandzeichen nach Anhang M in verbindlicher Kapitelreihenfolge. */
export const WILDFIRE_IDS = Object.freeze([
  'anchor-point',
  'lookout',
  'safety-zone',
  'spot-fire',
  'ground-fire',
  'acute-spot-fire',
  'peat-ground-fire',
  'crown-fire',
  'fire-spread-uphill',
  'fire-spread-downhill',
  'water-extraction-point',
  'aerial-firefighting',
  'water-supply-operation',
  'water-supply-operation-vehicles',
] as const);

export type WildfireId = (typeof WILDFIRE_IDS)[number];

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
