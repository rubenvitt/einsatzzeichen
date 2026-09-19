import { DEFAULT_STROKE_WIDTH_MM, type Primitive, type Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineCapability } from '../catalog-definition.js';

/** Strich der Referenz: 1,417 pt = 0,5 mm, schwarz, ohne Füllung. */
const STROKE: Style = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };
/** Vollfläche ohne Kontur. */
const SOLID: Style = { fill: 'schwarz', stroke: 'none' };

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

/**
 * Piktogramme des Kapitels 4.3 (Fähigkeiten). Maße an der Referenz abgelesen, Geometrie
 * eigenständig konstruiert: Striche als Striche mit 0,5 mm Stärke, Flächen als gefüllte
 * Rechtecke, Kreise und Polygone (Umrechnung mm = pt × 32 / 90,709).
 *
 * Ohne Pfad-Primitive ist die Hülle vollständig berechenbar; das Box-Gate fordert dann Gleichheit
 * von Box und Koordinatenhülle (ohne Strichbreiten-Aufschlag).
 */
export const FIRE_FIGHTING_PICTOGRAMS = deepFreeze([
  defineCapability({
    section: '4.3.1',
    id: 'fire-fighting',
    title: 'Brandbekämpfung',
    referenceAsset: '4.3.1_Brandbekämpfung.svg',
    box: { xMm: 1, yMm: 6, widthMm: 29, heightMm: 20 },
    // Waagerechter Balken von 1 bis 30 mm auf halber Höhe; zwei Schenkel ab der Mitte (16|16)
    // nach rechts oben und rechts unten, Steigung 10 : 12 (Kappenmitten bei (28|6) und (28|26)).
    primitives: [line(1, 16, 30, 16), line(16, 16, 28, 6), line(16, 16, 28, 26)],
  }),
  defineCapability({
    section: '4.3.2',
    id: 'service-water',
    title: 'Löschwasser, Brauchwasser',
    referenceAsset: '4.3.2_Löschwasser Brauchwasser.svg',
    box: { xMm: 1, yMm: 13, widthMm: 30, heightMm: 6 },
    primitives: [
      {
        type: 'path',
        role: 'pictogram',
        // Eine Welle als 0,5-mm-Strich: Start (1|19), Wellenberge bei (7,5|13) und (24,5|13),
        // Tal bei (16|19), Ende (31|19). Kontrollpunkte als Mittel der beiden Strichkanten der
        // Referenz abgelesen, symmetrisch zur Mittelachse x = 16 mm.
        d:
          'M 1 19 C 2.3 18.55 2.95 17.35 3.6 16.1 C 4.45 14.55 5.25 13 7.5 13 ' +
          'C 9.2 13 10.3 14.4 11.45 15.85 C 12.65 17.4 13.95 19 16 19 ' +
          'C 18.05 19 19.35 17.4 20.55 15.85 C 21.7 14.4 22.8 13 24.5 13 ' +
          'C 26.75 13 27.55 14.55 28.4 16.1 C 29.05 17.35 29.7 18.55 31 19',
        style: STROKE,
      },
    ],
  }),
  defineCapability({
    section: '4.3.3',
    id: 'foam-agent',
    title: 'Schaummittel',
    referenceAsset: '4.3.3_Schaummittel.svg',
    // Gefülltes, auf der Spitze stehendes Dreieck: Oberkante 8–24 mm bei y = 10, Spitze (16|23).
    box: { xMm: 8, yMm: 10, widthMm: 16, heightMm: 13 },
    primitives: [
      {
        type: 'polyline',
        role: 'pictogram',
        points: [[8, 10], [24, 10], [16, 23]],
        closed: true,
        style: SOLID,
      },
    ],
  }),
  defineCapability({
    section: '4.3.4',
    id: 'solid-extinguishing-agent',
    title: 'Sonderlöschmittel, fest',
    referenceAsset: '4.3.4_Sonderlöschmittel fest.svg',
    // Gefülltes Quadrat, 12 mm Kantenlänge, mittig (Referenz: 34,016 pt ab 28,346 pt).
    box: { xMm: 10, yMm: 10, widthMm: 12, heightMm: 12 },
    primitives: [
      { type: 'rect', role: 'pictogram', x: 10, y: 10, width: 12, height: 12, style: SOLID },
    ],
  }),
  defineCapability({
    section: '4.3.5',
    id: 'gaseous-extinguishing-agent',
    title: 'Sonderlöschmittel, gasförmig',
    referenceAsset: '4.3.5_Sonderlöschmittel gasförmig.svg',
    // Gefüllter Kreis, Radius 6,5 mm (Referenz: 18,425 pt), mittig.
    box: { xMm: 9.5, yMm: 9.5, widthMm: 13, heightMm: 13 },
    primitives: [{ type: 'circle', role: 'pictogram', cx: 16, cy: 16, r: 6.5, style: SOLID }],
  }),
  defineCapability({
    section: '4.3.6',
    id: 'respiratory-protection',
    title: 'Atemschutz',
    referenceAsset: '4.3.6_Atemschutz.svg',
    box: { xMm: 11, yMm: 2, widthMm: 10, heightMm: 28 },
    primitives: [
      {
        type: 'path',
        role: 'pictogram',
        // Maskenkörper als 0,5-mm-Strich: 10 × 22,5 mm (x 11–21, y 2–24,5), obere Ecken mit
        // 1 mm, untere mit 4 mm Radius (Viertelkreise als Bézierkurven, k = 0,5523).
        d:
          'M 12 2 H 20 C 20.552 2 21 2.448 21 3 V 20.5 C 21 22.709 19.209 24.5 17 24.5 ' +
          'H 15 C 12.791 24.5 11 22.709 11 20.5 V 3 C 11 2.448 11.448 2 12 2 Z',
        style: STROKE,
      },
      // Verbindung zum Filter und Filter als Kreis mit 2 mm Radius um (16|28).
      line(16, 24.5, 16, 26),
      { type: 'circle', role: 'pictogram', cx: 16, cy: 28, r: 2, style: STROKE },
    ],
  }),
] as const);
