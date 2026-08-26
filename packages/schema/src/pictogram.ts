import type { Drawing, Length, Primitive } from './geometry.js';
import type { DepictionVariant } from './provenance.js';
import type { CapabilityId, CommsId, DamageId, StateId, WildfireId } from './taxonomy.js';

/** Direkte Führungszeichen aus Anhang D, inkrementell je belegtem Teilslice. */
export const LEADERSHIP_IDS = [
  'command-post-in-operation',
] as const;

export type LeadershipId = (typeof LEADERSHIP_IDS)[number];

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
 * Die sechs Piktogrammarten der Baseline haben je einen eigenen ID-Raum. Ein Wetterzeichen oder
 * ein Trümmerkegel ist keine Fähigkeit einer Einheit — sie unter `capability.` zu führen wäre
 * eine Falschaussage in der ID.
 *
 * Seit D.4 tragen alle fünf Räume Literale. `DamageId` und `WildfireId` standen bis dahin als
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
  | `leadership.${LeadershipId}`;

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
