import type { DepictionVariant, LineId, MovementId, PathParameters, StrengthId } from '@einsatzzeichen/schema';

/**
 * Die Referenzdateien aus 5.2 und Kapitel 2 als Fixtures der parametrisierten Bausteine (LFH-566).
 *
 * Ein parametrisierter Baustein hat keine feste Ausdehnung, deshalb ist ein Original hier kein
 * fertiges Zeichen, sondern **ein Parametersatz**: der Verlauf, auf dem die Referenz den Baustein
 * zeigt, und die Zeichenfläche. Mit genau diesem Satz muss `movementDrawing` bzw. `lineDrawing` die
 * Referenz treffen. `parametric-fixtures.test.ts` hält das gegen das Kennzahlenartefakt fest.
 *
 * **Woher der Verlauf stammt.** Die Pfeile stehen in 32 × 32 mm auf der Achse y 16, Schaft ab x 2,
 * Spitze bei x 30 (5.2.1 bis 5.2.5); bei 5.2.6 endet der Verlauf in der Ringmitte bei x 26. Die
 * Grenzen stehen in 48 × 32 mm auf der Achse y 16, von x 1 bis 47 (2.17 bis 2.20). Beides ist an
 * den Hüllen im Artefakt und an den Dateien abgelesen.
 *
 * Die Linien 2.14 bis 2.16 laufen in der Referenz auf einer Kurve. Ihr Verlauf ist hier auf
 * Anfang, Ende und die Wendepunkte der Achse reduziert, an den Dateien abgelesen und auf 0,5 mm
 * gerundet; die Kurve selbst ist nicht nachgebaut. Das Kennzahlenartefakt erfasst Kurvenpfade
 * nicht, das Gate prüft dort Zeichenfläche und Farbe; Querschnitt und Wiederholung prüft
 * `core/src/geometry/parametric.test.ts` an den Bogenlängen der Referenz.
 *
 * Seit der Vermessung an den Referenzdateien (29.09.2026) hat jeder der 13 Bausteine eine
 * Zeichnung. `variant: 'alternative'` markiert die zweite Darstellung von 2.14.
 */
export type ParametricFixture =
  | {
      readonly asset: `${string}.svg`;
      readonly category: 'arrow';
      readonly valueId: MovementId;
      readonly canvasMm: { readonly width: number; readonly height: number };
      readonly path: PathParameters;
    }
  | {
      readonly asset: `${string}.svg`;
      readonly category: 'line';
      readonly valueId: LineId;
      readonly canvasMm: { readonly width: number; readonly height: number };
      readonly path: PathParameters;
      readonly strength?: StrengthId;
      readonly variant?: DepictionVariant;
    };

const ARROW_CANVAS = { width: 32, height: 32 } as const;
const ARROW_PATH: PathParameters = { points: [[2, 16], [30, 16]] };
const LINE_CANVAS = { width: 48, height: 32 } as const;
const LINE_PATH: PathParameters = { points: [[1, 16], [47, 16]] };

function arrow(asset: `${string}.svg`, valueId: MovementId): ParametricFixture {
  return { asset, category: 'arrow', valueId, canvasMm: ARROW_CANVAS, path: ARROW_PATH };
}

function line(asset: `${string}.svg`, valueId: LineId, strength?: StrengthId): ParametricFixture {
  return strength === undefined
    ? { asset, category: 'line', valueId, canvasMm: LINE_CANVAS, path: LINE_PATH }
    : { asset, category: 'line', valueId, canvasMm: LINE_CANVAS, path: LINE_PATH, strength };
}

function curved(
  asset: `${string}.svg`,
  valueId: LineId,
  points: readonly [readonly [number, number], readonly [number, number], ...(readonly [number, number])[]],
  variant?: DepictionVariant,
): ParametricFixture {
  const path: PathParameters = { points };
  return variant === undefined
    ? { asset, category: 'line', valueId, canvasMm: LINE_CANVAS, path }
    : { asset, category: 'line', valueId, canvasMm: LINE_CANVAS, path, variant };
}

export const PARAMETRIC_FIXTURES: readonly ParametricFixture[] = Object.freeze([
  arrow('5.2.1_Richtung des Vortragens einer Maßnahme.svg', 'direction-of-action'),
  arrow('5.2.2_Beginn einer Maßnahme.svg', 'start-of-action'),
  arrow('5.2.3_Gerichtete Bewegung.svg', 'directed-movement'),
  arrow('5.2.4_Bewegung in zwei Richtungen.svg', 'movement-both-directions'),
  arrow('5.2.5_Ende einer Bewegung.svg', 'end-of-movement'),
  // Ring um 26|16, Pfeil ab x 2: der Verlauf endet am Sammelpunkt.
  { asset: '5.2.6_Sammeln_Zusammenführen.svg', category: 'arrow', valueId: 'gathering', canvasMm: ARROW_CANVAS, path: { points: [[2, 16], [26, 16]] } },
  // Achse von 1|18 über den Scheitel 23|6 nach 47|26.
  curved('2.14_Escape Route.svg', 'escape-route', [[1, 18], [23, 6], [47, 26]]),
  // Achse von 1,5|19,5 über den Scheitel 18,5|6,5 nach 46,5|26.
  curved('2.14_Escape Route_2.svg', 'escape-route', [[1.5, 19.5], [18.5, 6.5], [46.5, 26]], 'alternative'),
  // Achse von 1|17 über 8|15 (Hochpunkt) und 25,5|22 (Tiefpunkt) nach 47|12.
  curved('2.15_Riegelstellung.svg', 'barrier-position', [[1, 17], [8, 15], [25.5, 22], [47, 12]]),
  // Achse von 1|17 über 28|5 (Hochpunkt) und 43|24 (Tiefpunkt) nach 47|23.
  curved('2.16_Brandausbreitung.svg', 'fire-spread', [[1, 17], [28, 5], [43, 24], [47, 23]]),
  line('2.17_Grenze Einsatzraum TEL.svg', 'boundary-command-area'),
  line('2.18_Grenze Einsatzabschnitt.svg', 'boundary-section'),
  line('2.19_Grenze Unterabschnitt.svg', 'boundary-subsection'),
  line('2.20_Grenze mit taktischer Stärke.svg', 'boundary-with-strength', 'zug'),
]);
