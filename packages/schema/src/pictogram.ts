import type { Length, Primitive } from './geometry.js';
import type { DepictionVariant } from './provenance.js';
import type { CapabilityId, CommsId, StateId } from './taxonomy.js';

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
 * Die fünf Piktogrammarten der Baseline haben je einen eigenen ID-Raum. Ein Wetterzeichen oder
 * ein Trümmerkegel ist keine Fähigkeit einer Einheit — sie unter `capability.` zu führen wäre
 * eine Falschaussage in der ID.
 *
 * Zwei der fünf Räume haben noch keine Literale und sind deshalb `never`. Sie stehen hier
 * trotzdem, weil sie der Vertrag sind, an dem D.4 anknüpft, ohne die Aufteilung je neu
 * zu entscheiden — und weil ein
 * `never`-Alias mit dieser Begründung ehrlicher ist als ein `string`, der jede ID durchlässt.
 */

/** Anhänge K und L: Bauwerksschäden, Deichverteidigung. Literale entstehen in D.4. */
export type DamageId = never;
/** Anhang M: Vegetationsbrand. Literale entstehen in D.4. */
export type WildfireId = never;

export type PictogramId =
  | `capability.${CapabilityId}`
  | `state.${StateId}`
  | `comms.${CommsId}`
  | `damage.${DamageId}`
  | `wildfire.${WildfireId}`;

/**
 * Ein Piktogramm ist Code: eine Folge von Primitiven in Millimetern mit deklarierter Hüllbox.
 * Kein Grafikprogramm, kein Vektorimport, keine Datei pro Zeichen.
 */
export interface PictogramDefinition {
  id: PictogramId;
  variant: DepictionVariant;
  /** Deutsche Bezeichnung der Referenz. Die ID bleibt englisch (wie `SymbolKind`, `PrimitiveRole`). */
  title: string;
  box: PictogramBox;
  primitives: readonly Primitive[];
}
