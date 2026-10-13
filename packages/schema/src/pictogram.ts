import type { Drawing, Length, Primitive } from './geometry.js';
import type { DepictionVariant } from './provenance.js';
import {
  CAPABILITY_IDS,
  COMMS_IDS,
  DAMAGE_IDS,
  LEGACY_COMMS_IDS,
  STATE_IDS,
  WILDFIRE_IDS,
  type CapabilityId,
  type CommsId,
  type DamageId,
  type StateId,
  type WildfireId,
} from './taxonomy.js';
import { SPECIAL_FORM_PICTOGRAM_IDS, type SpecialFormPictogramId } from './special-forms.js';

/** Direkte Führungszeichen aus Anhang D, inkrementell je belegtem Teilslice. */
export const LEADERSHIP_IDS = [
  'command-post-in-operation',
  'staging-area',
  'staging-area-with-reporting-head',
  'reporting-head',
  'guide-post',
  'control-center',
  'helicopter-landing-zone',
  'helicopter-landing-site',
  'technical-advisor-thw',
  'red-cross-commissioner',
] as const;

export type LeadershipId = (typeof LEADERSHIP_IDS)[number];

/** Direkte Wasserrettungs-Personenpiktogramme aus I.5.4 bis I.5.8. */
export const WATER_RESCUE_PERSONNEL_IDS = [
  'team-leader',
  'group-leader',
  'platoon-leader',
  'formation-leader',
  'technical-advisor',
] as const;

export type WaterRescuePersonnelId = (typeof WATER_RESCUE_PERSONNEL_IDS)[number];

/**
 * Platzzeichen ohne Körper (ESZ-139): ein Platz, den die Altsystematik freistehend zeichnet, die
 * Baseline aber nur im Kreis. Heute genau ein Altzeichen, DLRG DV 102 von 2011 (Quelle
 * `skk-2010`) 10.3.23 Sammelplatz für Betroffene; die Baseline zeigt das Motiv nur als Körpermarke
 * im 12-mm-Kreis (F.3.12 Anlaufstelle für Betroffene). Ein eigener Raum, weil der Platz weder
 * Fähigkeit noch Führungszeichen ist (F.3.12: „keine eigenständige Capability“).
 */
export const LEGACY_SITE_IDS = ['affected-persons-assembly-point'] as const;

export type LegacySiteId = (typeof LEGACY_SITE_IDS)[number];

export type SiteId = LegacySiteId;

/**
 * Zugesicherte Hülle eines Piktogramms: linke obere Ecke und Maße in Millimetern.
 *
 * Nötig, weil `boundsOfMm` für Pfade nichts liefert — die Koordinaten eines Pfades liegen
 * unzerlegt im `d`-String. Die Box ist damit eine **Zusicherung des Autors**, keine berechnete
 * Größe, und genau darum prüfbedürftig: `pictogram-gate.ts` in `core` gibt ihr drei Gates.
 */
export interface PictogramBox {
  xMm: Length;
  yMm: Length;
  widthMm: Length;
  heightMm: Length;
}

/**
 * Die Piktogrammarten der Baseline haben je einen eigenen ID-Raum. Ein Wetterzeichen oder
 * ein Trümmerkegel ist keine Fähigkeit einer Einheit — sie unter `capability.` zu führen wäre
 * eine Falschaussage in der ID.
 *
 * Seit D.4 tragen auch `DamageId` und `WildfireId` Literale. Beide standen bis dahin als
 * `never` hier — als Vertrag, an dem D.4 anknüpfen konnte, ohne die Aufteilung neu zu
 * entscheiden. Genau so ist es gekommen: Das Auffüllen war reines Hinzufügen, die Aufteilung
 * blieb unberührt. Beide Aliasse leben jetzt in `taxonomy.ts` neben `CapabilityId`, `StateId`
 * und `CommsId`, wo die belegten ID-Listen stehen.
 */

export type PictogramId =
  | `capability.${CapabilityId}`
  | `state.${StateId}`
  | `comms.${CommsId}`
  | `damage.${DamageId}`
  | `wildfire.${WildfireId}`
  | `leadership.${LeadershipId}`
  | `water-rescue-personnel.${WaterRescuePersonnelId}`
  | `special-form.${SpecialFormPictogramId}`
  | `site.${SiteId}`;

/**
 * Jede Piktogrammkennung als Wert, Raum für Raum in der Reihenfolge von `PictogramId` und darin in
 * Kapitelreihenfolge (LFH-798). Der Wertevorrat der freistehenden Art `pictogram`; ob eine Kennung
 * dort zeichnet, entscheidet die Prüfung (`state.*` und die Leitstelle haben eine eigene Spec).
 * Die Altzeichen aus DV 102 Kapitel 8 (`LEGACY_COMMS_IDS`, ESZ-137) folgen auf Anhang J, die
 * Platzzeichen (`LEGACY_SITE_IDS`, ESZ-139) stehen nach den Sonderformen zuletzt.
 */
export const PICTOGRAM_IDS: readonly PictogramId[] = Object.freeze([
  ...CAPABILITY_IDS.map((id) => `capability.${id}` as const),
  ...STATE_IDS.map((id) => `state.${id}` as const),
  ...COMMS_IDS.map((id) => `comms.${id}` as const),
  ...LEGACY_COMMS_IDS.map((id) => `comms.${id}` as const),
  ...DAMAGE_IDS.map((id) => `damage.${id}` as const),
  ...WILDFIRE_IDS.map((id) => `wildfire.${id}` as const),
  ...LEADERSHIP_IDS.map((id) => `leadership.${id}` as const),
  ...WATER_RESCUE_PERSONNEL_IDS.map((id) => `water-rescue-personnel.${id}` as const),
  ...SPECIAL_FORM_PICTOGRAM_IDS.map((id) => `special-form.${id}` as const),
  ...LEGACY_SITE_IDS.map((id) => `site.${id}` as const),
]);

/**
 * Ein Piktogramm ist Code: eine Folge von Primitiven in Millimetern mit deklarierter Hüllbox.
 * Kein Grafikprogramm, kein Vektorimport, keine Datei pro Zeichen.
 */
export interface PictogramDefinition {
  id: PictogramId;
  variant: DepictionVariant;
  /** Deutsche Bezeichnung der Referenz. Die ID bleibt englisch (wie `SymbolKind`, `PrimitiveRole`). */
  title: string;
  /** Reale Zeichenfläche dieser direkten Piktogrammdefinition in Millimetern. */
  viewBox: Drawing['viewBox'];
  box: PictogramBox;
  primitives: readonly Primitive[];
}
