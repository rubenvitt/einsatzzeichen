import type { Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineLegacySite, type LegacyPictogramDefinition } from '../catalog-definition.js';
import { CONNECTION_CONTRAST, COMMS_REFERENCE_STROKE, COMMS_REFERENCE_STROKE_WIDTH_MM } from '../comms/authoring.js';

/**
 * Altzeichen aus der DLRG DV 102 von 2011 (SKK-Empfehlungen 2010, Quelle `skk-2010`), Kapitel 10.3,
 * Seite 40: 10.3.23 Sammelplatz für Betroffene. Ein senkrechter Stamm, oben ein waagerechter
 * Doppelpfeil mit gefüllten Spitzen, unten ein flaches, nach unten offenes V; **ohne Kreis**. Die
 * Baseline führt dasselbe Motiv nur als Körpermarke im 12-mm-Kreis (F.3.12 Anlaufstelle für
 * Betroffene, `circle-double-arrow-lower-v`), mit offenen Spitzen und einem Stamm, der am Kreis
 * beginnt. Freistehend gibt es dort nichts; ESZ-139 nimmt das Zeichen auf, weil Bestandsdaten aus
 * dem Lagekarten-Altpaket es freistehend tragen.
 *
 * **Vermessung.** Abgelesen an der Vektorgrafik der Seite 40 (Strichstärke 0,75 pt, alle Werte
 * Strichmitten). Maßstab ist der Kreis des Nachbarzeichens 10.3.22 Sammelstelle (Mittenradius
 * 12,996 pt), der als 12-mm-Kreis der Baseline gilt (F.3.6 Sammelstelle allgemein):
 * 1 pt ≙ 0,9234 mm. Die Mitte des Felds ist die Zeilenmitte zwischen 10.3.22 und 10.3.24.
 *
 * - Stamm von 12,38 pt über der Zeilenmitte bis zum Scheitel des V, 6,43 pt darunter.
 * - Doppelpfeil 7,80 pt über der Zeilenmitte; Spitzen 8,97 pt links und rechts der Achse,
 *   Grundlinie der Spitzen 5,80 pt neben der Achse, halbe Höhe 1,83 pt.
 * - V-Schenkel 12,25 pt zur Seite und 5,44 pt nach unten (23,9° gegen die Waagerechte).
 *
 * **Konstruktion.** Eigenständig im Hausstil, nicht geometrietreu zur Altquelle: Strich 0,5 mm wie
 * die Striche der Baseline (die Quelle hat umgerechnet 0,69 mm), Koordinaten auf 0,05 mm. Die
 * Spitzen sind gefüllt und mit demselben Strich umrandet, wie in der Vorlage.
 */

const stroke = COMMS_REFERENCE_STROKE;

/** Gefüllte Spitze mit Kontur in Strichstärke, wie in der Vorlage. */
const SOLID_HEAD: Style = Object.freeze({
  fill: 'schwarz',
  stroke: 'schwarz',
  strokeWidth: COMMS_REFERENCE_STROKE_WIDTH_MM,
});

const AXIS_X_MM = 16;
const STEM_TOP_MM = 4.55;
const V_APEX_Y_MM = 21.95;
const V_END_Y_MM = 26.95;
const V_HALF_WIDTH_MM = 11.3;
const ARROW_Y_MM = 8.8;
const HEAD_TIP_OFFSET_MM = 8.3;
const HEAD_BASE_OFFSET_MM = 5.35;
const HEAD_HALF_HEIGHT_MM = 1.7;

/** Auf das Raster von 0,05 mm, damit Summen wie 8,8 − 1,7 keine Gleitkommareste tragen. */
function mm(value: number): number {
  return Math.round(value * 20) / 20;
}

function head(direction: -1 | 1): Primitive {
  const tip = mm(AXIS_X_MM + direction * HEAD_TIP_OFFSET_MM);
  const base = mm(AXIS_X_MM + direction * HEAD_BASE_OFFSET_MM);
  return {
    type: 'polyline',
    role: 'pictogram',
    points: [[tip, ARROW_Y_MM], [base, mm(ARROW_Y_MM - HEAD_HALF_HEIGHT_MM)], [base, mm(ARROW_Y_MM + HEAD_HALF_HEIGHT_MM)]],
    closed: true,
    style: { ...SOLID_HEAD },
  };
}

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: { ...stroke } };
}

export const LEGACY_SITES = deepFreeze([
  /** Stamm 4,55 … 21,95, Pfeile 7,7 … 24,3 bei y = 8,8, V bis 4,7 | 27,3 bei y = 26,95. */
  defineLegacySite({
    section: '10.3.23',
    page: 40,
    id: 'affected-persons-assembly-point',
    title: 'Sammelplatz für Betroffene',
    box: {
      xMm: mm(AXIS_X_MM - V_HALF_WIDTH_MM),
      yMm: STEM_TOP_MM,
      widthMm: mm(2 * V_HALF_WIDTH_MM),
      heightMm: mm(V_END_Y_MM - STEM_TOP_MM),
    },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      line(AXIS_X_MM, STEM_TOP_MM, AXIS_X_MM, V_APEX_Y_MM),
      line(mm(AXIS_X_MM - HEAD_BASE_OFFSET_MM), ARROW_Y_MM, mm(AXIS_X_MM + HEAD_BASE_OFFSET_MM), ARROW_Y_MM),
      head(-1),
      head(1),
      {
        type: 'polyline',
        role: 'pictogram',
        points: [
          [mm(AXIS_X_MM - V_HALF_WIDTH_MM), V_END_Y_MM],
          [AXIS_X_MM, V_APEX_Y_MM],
          [mm(AXIS_X_MM + V_HALF_WIDTH_MM), V_END_Y_MM],
        ],
        style: { ...stroke },
      },
    ],
  }),
] satisfies readonly LegacyPictogramDefinition[]);
