import type { LineId, MovementId, PathParameters, StrengthId } from '@einsatzzeichen/schema';

/**
 * Die Referenzdateien aus 5.2 und Kapitel 2 als Fixtures der parametrisierten Bausteine (LFH-566).
 *
 * Ein parametrisierter Baustein hat keine feste Ausdehnung, deshalb ist ein Original hier kein
 * fertiges Zeichen, sondern **ein Parametersatz**: der Verlauf, auf dem die Referenz den Baustein
 * zeigt, und die Zeichenfläche. Mit genau diesem Satz muss `movementDrawing` bzw. `lineDrawing` die
 * Referenz treffen. `parametric-fixtures.test.ts` hält das gegen das Kennzahlenartefakt fest.
 *
 * **Woher der Verlauf stammt.** Die Pfeile stehen in 32 × 32 mm auf der Achse y 16, Schaft ab x 2,
 * Spitze bei x 30 (5.2.1, 5.2.3, 5.2.4). Die Grenzen stehen in 48 × 32 mm auf der Achse y 16, von
 * x 1 bis 47 (2.17 bis 2.20). Beides ist an den Hüllen im Artefakt abgelesen.
 *
 * Aufgeführt sind nur die Dateien, deren Baustein eine Zeichnung hat. Die übrigen sieben
 * (5.2.2, 5.2.5, 5.2.6, 2.14 in zwei Darstellungen, 2.15, 2.16) sind Lücken im Register, und das
 * Gate prüft dort, dass die Zeichenfunktion sie als Lücke meldet.
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

export const PARAMETRIC_FIXTURES: readonly ParametricFixture[] = Object.freeze([
  arrow('5.2.1_Richtung des Vortragens einer Maßnahme.svg', 'direction-of-action'),
  arrow('5.2.3_Gerichtete Bewegung.svg', 'directed-movement'),
  arrow('5.2.4_Bewegung in zwei Richtungen.svg', 'movement-both-directions'),
  line('2.17_Grenze Einsatzraum TEL.svg', 'boundary-command-area'),
  line('2.18_Grenze Einsatzabschnitt.svg', 'boundary-section'),
  line('2.19_Grenze Unterabschnitt.svg', 'boundary-subsection'),
  line('2.20_Grenze mit taktischer Stärke.svg', 'boundary-with-strength', 'zug'),
]);
