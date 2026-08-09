import type { SourceId } from './provenance.js';
import type { ReviewSet } from './review.js';

/**
 * `baseline`            — der projektintern festgelegte Referenzstand für Coverage und Vergleiche;
 *                         keine Aussage über normative Geltung oder den Status als Dienstvorschrift
 * `reference-assets`    — Grafikdateien zur Baseline
 * `guidance`            — begleitende Hinweise zur Baseline
 * `legacy`              — ältere Systematik, für Aliasnamen und Migrationshinweise
 * `operational-rule`    — operatives Regelwerk mit Terminologie und Führungslogik
 * `standard`            — angrenzende Norm, nicht mit der DV-102-Systematik zu vermischen
 * `open-source-corpus`  — frei lizenzierter Fremdbestand *taktischer Zeichen*, zum Vergleich der
 *                         Bildideen (z. B. `phjardas-tz`)
 * `typeface`            — eine Schrift ist ein Werkzeug der Darstellung, keine Zeichenquelle: sie
 *                         trägt keine taktische Bedeutung, braucht aber dieselbe Lizenz- und
 *                         Herkunftsprüfung wie jede andere Fremdquelle
 */
export type SourceKind =
  | 'baseline'
  | 'reference-assets'
  | 'guidance'
  | 'legacy'
  | 'operational-rule'
  | 'standard'
  | 'open-source-corpus'
  | 'typeface';

/** Beschaffungsstand. Trennt „nicht beschafft" von „beschafft und ungenutzt". */
export type Acquisition = 'local' | 'public-url' | 'not-acquired';

/**
 * Umgang mit der Geometrie der Quelle. `'compared-only'` heißt: die Bildideen wurden gelesen und
 * gegen den Bestand gehalten, aber keine Koordinate übernommen — auch dort nicht, wo die Lizenz
 * es erlaubt hätte.
 */
export type GeometryUse = 'measured-metrics' | 'reconstructed' | 'compared-only' | 'none';

export type LicenceStatus = 'clarified' | 'unclear';

export interface Licence {
  /** Nutzungsgrundlage in einem Satz, prüfbar formuliert. */
  basis: string;
  status: LicenceStatus;
  note?: string;
}

export interface SourceRecord {
  id: SourceId;
  kind: SourceKind;
  title: string;
  publisher: string;
  /** Auflage oder Ausgabedatum, z. B. "1. Auflage 2011" oder "2017-04". */
  edition?: string;
  url?: string;
  /** Fachlicher Geltungsbereich in einem Satz. */
  scope: string;
  acquisition: Acquisition;
  /**
   * Mehrwertig: aus derselben Quelle können Kennzahlen abgeleitet und Bildideen rekonstruiert
   * werden. `babz-svg-2025` trägt beides — ein Einzelwert würde eine der Nutzungen verschweigen.
   */
  geometryUse: readonly GeometryUse[];
  licence: Licence;
  review: ReviewSet;
}
