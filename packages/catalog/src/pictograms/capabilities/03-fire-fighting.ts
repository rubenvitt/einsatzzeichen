import { DEFAULT_STROKE_WIDTH_MM, type Primitive, type Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { strokeCapability as icon } from '../authoring.js';
import { defineCapability } from '../catalog-definition.js';

const STROKE: Style = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

/**
 * Piktogramme des Kapitels 4.3 (Fähigkeiten). Alle Geometrien sind eigenständige Konstruktionen
 * nach der Bildidee der Referenz; Maße und Koordinaten stammen nicht aus den Referenzdateien.
 */
export const FIRE_FIGHTING_PICTOGRAMS = deepFreeze([
  defineCapability({
    section: '4.3.1',
    id: 'fire-fighting',
    title: 'Brandbekämpfung',
    referenceAsset: '4.3.1_Brandbekämpfung.svg',
    // Zusicherung des Autors, vom Box-Gate gegen die Geometrie geprüft. Ohne Pfad-Primitive ist
    // die Hülle vollständig berechenbar, das Gate fordert deshalb Gleichheit statt Enthaltung.
    box: { xMm: 3, yMm: 9, widthMm: 23, heightMm: 14 },
    primitives: [line(3, 16, 26, 16), line(16, 16, 26, 9), line(16, 16, 26, 23)],
  }),
  defineCapability({
    section: '4.3.2',
    id: 'service-water',
    title: 'Löschwasser, Brauchwasser',
    referenceAsset: '4.3.2_Löschwasser Brauchwasser.svg',
    box: { xMm: 4, yMm: 12.5, widthMm: 24, heightMm: 5 },
    primitives: [
      {
        type: 'path',
        role: 'pictogram',
        // Eigenständige Konstruktion nach der Bildidee von 4.3.2: ein Wasserband aus zwei
        // Wellenbergen mit Tal in der Mitte, 1 mm dick, mittig auf dem unverschobenen Körper.
        // Oberkante von links nach rechts, Unterkante zurück, geschlossen — deshalb eine
        // gefüllte Fläche und kein Strich.
        //
        // Nur absolute M, C, V und Z. Bewusst keine Ellipsenbögen (`A`): ihre Parameter sind
        // keine Koordinaten, das Box-Gate könnte sie nicht prüfen. Alle Kontrollpunkte liegen
        // in der deklarierten Box; da eine Bezierkurve die konvexe Hülle ihrer Kontrollpunkte
        // nie verlässt, ist damit die ganze Kurve darin.
        d:
          'M 4 16.5 C 6 16.5 8 12.5 10 12.5 C 12 12.5 14 16.5 16 16.5 ' +
          'C 18 16.5 20 12.5 22 12.5 C 24 12.5 26 16.5 28 16.5 V 17.5 ' +
          'C 26 17.5 24 13.5 22 13.5 C 20 13.5 18 17.5 16 17.5 ' +
          'C 14 17.5 12 13.5 10 13.5 C 8 13.5 6 17.5 4 17.5 Z',
        style: { fill: 'schwarz', stroke: 'none' },
      },
    ],
  }),
  icon({ section: '4.3.3', id: 'foam-agent', title: 'Schaummittel',
    referenceAsset: '4.3.3_Schaummittel.svg', d: 'M 8 9 H 24 L 16 23 Z' }),
  icon({ section: '4.3.4', id: 'solid-extinguishing-agent', title: 'Sonderlöschmittel, fest',
    referenceAsset: '4.3.4_Sonderlöschmittel fest.svg', d: 'M 10 10 H 22 V 22 H 10 Z' }),
  icon({ section: '4.3.5', id: 'gaseous-extinguishing-agent', title: 'Sonderlöschmittel, gasförmig',
    referenceAsset: '4.3.5_Sonderlöschmittel gasförmig.svg',
    d: 'M 16 10 C 12 10 10 12 10 16 C 10 20 12 22 16 22 C 20 22 22 20 22 16 C 22 12 20 10 16 10 Z' }),
  icon({ section: '4.3.6', id: 'respiratory-protection', title: 'Atemschutz',
    referenceAsset: '4.3.6_Atemschutz.svg',
    d: 'M 13 8 H 19 Q 21 8 21 10 V 19 Q 21 22 18 22 H 14 Q 11 22 11 19 V 10 Q 11 8 13 8 Z M 16 22 V 24 M 14 24 H 18' }),
] as const);
