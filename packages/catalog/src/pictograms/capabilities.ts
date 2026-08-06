import {
  DEFAULT_STROKE_WIDTH_MM,
  type CapabilityId,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';

const STROKE: Style = { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' };

function line(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: STROKE };
}

/**
 * Eigenständige Konstruktion nach der Bildidee von 4.3.1 Brandbekämpfung.
 * Geometrie und Maße stammen nicht aus der Referenzdatei.
 */
const PICTOGRAMS: Record<CapabilityId, Primitive[]> = {
  'fire-fighting': [line(3, 16, 26, 16), line(16, 16, 26, 9), line(16, 16, 26, 23)],
};

export function capabilityPictogram(id: CapabilityId): Primitive[] {
  return PICTOGRAMS[id];
}
