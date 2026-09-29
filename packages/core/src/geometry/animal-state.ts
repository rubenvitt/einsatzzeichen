import { DEFAULT_VIEWBOX_MM, type AnimalStateParameters, type Drawing } from '@einsatzzeichen/schema';
import { ANIMAL_STATES } from './pictograms/states/06-animals.js';

/**
 * Tierzustand aus 5.8.6 als freistehendes Zeichen (LFH-577). Maße an der Referenz abgelesen,
 * Geometrie eigenständig konstruiert (`pictograms/states/06-animals.ts`).
 *
 * Jede der vier Darstellungen zeichnet die **Tiersilhouette als Träger** mit: waagerechte Ohren von
 * x 2 bis 6 und 26 bis 30, dazwischen ein V mit Spitze auf x 16 (Umriss 5.8.6.1: 5,669…17,008 und
 * 73,701…85,04 pt bei y 11,339). Die Silhouette ist kein Grundzeichen und kommt in keiner anderen
 * Referenz ohne Zustand vor; ein Tierzustand ist deshalb kein Zustand an einem Grundzeichen, sondern
 * ein eigenes Zeichen. Der Zustand verändert den Träger: beim kontaminierten Tier rückt die
 * Silhouette 5 mm tiefer, damit das Kontaminationszeichen darüber Platz hat.
 *
 * Varianten: 5.8.6.2 hat eine zweite Darstellung mit dem Buchstaben K statt des Zeichens aus
 * Kreisen und Strichen (`5.8.6.2_kontaminiertes Tier_K`). Mehrere Zustände an einem Tier zeigt
 * kein Original; dass das kontaminierte Tier den Strich des erkrankten mitführt, ist ein Hinweis,
 * aber kein Beleg für eine Kombinationsregel.
 */
export function animalStateDrawing(parameters: AnimalStateParameters): Drawing {
  const variant = parameters.variant ?? 'primary';
  const definition = ANIMAL_STATES.find(
    (candidate) => candidate.id === `state.${parameters.state}` && candidate.variant === variant,
  );
  if (definition === undefined) {
    throw new Error(
      `${parameters.state}: eine zweite Darstellung gibt es nur beim kontaminierten Tier (5.8.6.2_kontaminiertes Tier_K).`,
    );
  }
  return { viewBox: { ...DEFAULT_VIEWBOX_MM }, children: definition.primitives, title: definition.title };
}
