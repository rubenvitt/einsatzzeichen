import {
  DEFAULT_STROKE_WIDTH_MM,
  type CapabilityId,
  type PictogramDefinition,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';

const STROKE: Style = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

/**
 * Piktogramme des Kapitels 4 (Fähigkeiten). Alle Geometrien sind eigenständige Konstruktionen
 * nach der Bildidee der Referenz; Maße und Koordinaten stammen nicht aus den Referenzdateien.
 *
 * `Partial`, nicht total: `CapabilityId` wächst in D.1 auf 88 Literale, die Geometrien entstehen
 * aber je Unter-Slice. Ein totales `Record` erzwänge eine Vollständigkeit, die erst am Ende von
 * D.1 besteht — dasselbe Muster wie `ORGANIZATION_COLORS` und `BODIES`, mit derselben Regel:
 * kein Eintrag ohne Beleg, und der Zugriff auf eine Lücke wirft.
 */
export const CAPABILITY_PICTOGRAMS: Partial<
  Record<`capability.${CapabilityId}`, PictogramDefinition>
> = {
  'capability.fire-fighting': {
    id: 'capability.fire-fighting',
    title: 'Brandbekämpfung',
    // Zusicherung des Autors, vom Box-Gate gegen die Geometrie geprüft. Ohne Pfad-Primitive ist
    // die Hülle vollständig berechenbar, das Gate fordert deshalb Gleichheit statt Enthaltung.
    box: { xMm: 3, yMm: 9, widthMm: 23, heightMm: 14 },
    primitives: [line(3, 16, 26, 16), line(16, 16, 26, 9), line(16, 16, 26, 23)],
  },
};
