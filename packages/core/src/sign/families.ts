import type { FreestandingKind, SymbolKind } from '@einsatzzeichen/schema';

/** Eine Familie von Zeichenarten für die erste Wahl in einer Oberfläche („Was ist es?“). */
export interface KindFamily {
  readonly id: KindFamilyId;
  readonly label: string;
  /** Kurz, was dazugehört, für die Kachel. */
  readonly hint: string;
  readonly kinds: readonly (SymbolKind | FreestandingKind)[];
}

export type KindFamilyId =
  | 'unit'
  | 'person'
  | 'vehicle'
  | 'place'
  | 'resource'
  | 'situation'
  | 'special'
  | 'freestanding';

/**
 * Die Zeichenarten in sieben Familien und den Sonderformen, in Auswahlreihenfolge (ESZ-149).
 * Jede Grundzeichenart und jede freistehende Art steht in genau einer Familie; das hält ein Test
 * fest. Reine Daten, damit Website und Anwendungen denselben Aufbau zeigen.
 */
export const KIND_FAMILIES: readonly KindFamily[] = Object.freeze([
  { id: 'unit', label: 'Einheit', hint: 'Trupp bis Verband', kinds: ['formation'] },
  { id: 'person', label: 'Person', hint: 'Einsatzkraft, Funktion, Spontanhelfende', kinds: ['person', 'spontaneous-helper'] },
  {
    id: 'vehicle',
    label: 'Fahrzeug',
    hint: 'Land, Luft, Wasser, Anhänger, Wechsellader',
    kinds: [
      'vehicle-land',
      'vehicle-air',
      'vehicle-water',
      'trailer',
      'two-wheeler',
      'motorized-two-wheeler',
      'swap-loader-vehicle',
      'roll-off-loader',
      'swap-container-carrier',
      'roll-off-trailer',
      'swap-container-trailer',
    ],
  },
  { id: 'place', label: 'Stelle und Gebäude', hint: 'Führungsstelle, Platz, Haus', kinds: ['post', 'circle-12', 'building', 'reduced-house'] },
  {
    id: 'resource',
    label: 'Behälter und Ressource',
    hint: 'Abrollbehälter, Wechselbehälter, Material',
    kinds: ['container', 'roll-off-container', 'swap-container', 'swap-body', 'wheeled-container'],
  },
  { id: 'situation', label: 'Lage', hint: 'Gefahr, Schaden, Maßnahme, Fläche', kinds: ['hazard', 'event', 'measure', 'area', 'point'] },
  { id: 'special', label: 'Sonderformen', hint: 'Bauformen ohne eigene Bedeutung', kinds: ['upright-rectangle'] },
  {
    id: 'freestanding',
    label: 'Freistehend',
    hint: 'Pfeil, Linie, Wetter, Zustand, Piktogramm',
    kinds: ['movement', 'line', 'weather', 'animal-state', 'state', 'pictogram'],
  },
] satisfies KindFamily[]);

/** Die Familie einer Art; jede Art hat genau eine. */
export function kindFamilyOf(kind: SymbolKind | FreestandingKind): KindFamily {
  const family = KIND_FAMILIES.find((candidate) => candidate.kinds.includes(kind));
  if (family === undefined) throw new RangeError(`„${kind}“ ist keine Zeichenart.`);
  return family;
}
