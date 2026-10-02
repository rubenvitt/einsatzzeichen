import type { Primitive, WeatherStateId } from '@einsatzzeichen/schema';
import { mapPrimitive } from './affine-map.js';
import { noteDerivation } from './record.js';

/**
 * Zwei Wetterwerte ohne belegte Anordnung (Eigentümerentscheid vom 02.10.2026: zulassen,
 * abgeleitet), etwa Sonne und Wind, Regen und Schnee ohne Wolke oder die Wolke mit einem
 * Niederschlag ohne Intensität.
 *
 * **Warum nebeneinander und nicht wie die Wolke mit Niederschlag.** Belegt ist nur ein Träger mit
 * Marken: die Wolke 3 mm angehoben, darunter eine bis vier verkleinerte Niederschlagsmarken, deren
 * **Anzahl** die Intensität ist (5.8.7, Beispiele Schneiend schwach bis extrem). Diese Anordnung
 * trägt eine Zählung, und ohne Intensität gibt es nichts zu zählen — jede Markenzahl behauptete
 * eine Stufe. Zwei Werte ohne Träger-Marken-Verhältnis (Sonne und Wind) haben gar kein Oben und
 * Unten. Übertragen wird deshalb, was beide Fassungen teilen: jeder Wert erscheint als seine
 * eigene, vermessene Einzeldarstellung, gleichmäßig verkleinert, mit unverändertem Strich von
 * 0,5 mm — wie die Marken an der Wolke, die ihren Strich ebenfalls behalten.
 *
 * Die beiden Einzeldarstellungen stehen auf halbe Größe verkleinert in der linken und rechten
 * Hälfte der 32-mm-Fläche, Mitten bei (8 | 16) und (24 | 16). Die Reihenfolge folgt dem Katalog
 * (`WEATHER_STATES`, also 5.8.7.1 bis 5.8.7.10), nicht der Eingabe: die Reihenfolge der Werte
 * zählt im Wetterzeichen nicht.
 */
const PAIR_SCALE = 0.5;
const PAIR_CENTERS_X_MM = [8, 24] as const;
const CENTER_MM = 16;

export interface WeatherPairPart {
  readonly id: WeatherStateId;
  readonly title: string;
  readonly primitives: readonly Primitive[];
}

/** Die Primitive des Paars; `parts` in Katalogreihenfolge. */
export function weatherPairPrimitives(parts: readonly [WeatherPairPart, WeatherPairPart]): Primitive[] {
  noteDerivation({
    dimension: 'values',
    part: `Wetterpaar ${parts[0].id} + ${parts[1].id} nebeneinander, je auf halbe Größe verkleinert`,
    basis: 'constructed',
    from: '5.8.7.1–5.8.7.10 (Einzeldarstellungen), Strich 0,5 mm wie an der Wolke mit Niederschlag',
  });
  return parts.flatMap((part, index) => {
    const map = {
      scale: PAIR_SCALE,
      dx: (PAIR_CENTERS_X_MM[index] as number) - CENTER_MM * PAIR_SCALE,
      dy: CENTER_MM - CENTER_MM * PAIR_SCALE,
    };
    return part.primitives.map((primitive) => mapPrimitive(map, primitive));
  });
}
