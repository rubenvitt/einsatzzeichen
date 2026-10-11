import type { DepictionVariant, Drawing, PictogramId } from '@einsatzzeichen/schema';
import { pictogram } from './pictograms/index.js';

/**
 * Die Einzeldarstellung einer Kapiteldatei aus dem Piktogrammregister als Zeichnung (LFH-798):
 * Zeichenfläche, Primitive und Titel genau der Definition, die `pictogram(id, variant)` liefert.
 * Dasselbe Muster wie `animalStateDrawing`; die Geometrie ist in den Suiten des Registers gegen
 * das Kennzahlenartefakt gegatet, hier kommt nichts hinzu.
 *
 * Wirft wie `pictogram()`, wenn das Register die Variante nicht führt. Die freistehenden Arten
 * `state` und `pictogram` fangen das vorher als Regel ab (`state-variant-not-available`,
 * `pictogram-variant-not-available`).
 */
export function pictogramDrawing(id: PictogramId, variant: DepictionVariant = 'primary'): Drawing {
  const definition = pictogram(id, variant);
  return { viewBox: { ...definition.viewBox }, children: definition.primitives, title: definition.title };
}
