import { deepFreeze } from '../../readonly-data.js';
import type { Primitive } from '@einsatzzeichen/schema';
import { defineLegacyComms, type LegacyPictogramDefinition } from '../catalog-definition.js';
import { commsLine, COMMS_REFERENCE_STROKE, CONNECTION_CONTRAST } from './authoring.js';
import { connectionBar, wirelessZigzag } from './01-connections.js';

/**
 * Altzeichen aus der DLRG DV 102 von 2011 (SKK-Empfehlungen 2010, Quelle `skk-2010`), Kapitel 8,
 * Seite 27: 8.5 Fernschreiben und 8.6 Festbildübertragung, je „über Draht“ und „über Funk“.
 * Anhang J der Baseline hat beide nicht mehr (LFH-433-Scoping, §3.2: „die analogen Dienste sind
 * entfallen“). ESZ-137 nimmt sie auf, weil Bestandsdaten aus dem Lagekarten-Altpaket sie tragen.
 *
 * Die Formsprache ist dieselbe wie in J.1 (siehe `01-connections.ts`): oben die Marke, **was**
 * übertragen wird, darunter der Zickzack, **dass** es drahtlos geschieht. Über Funk ist deshalb
 * die erste Darstellung (`primary`), über Draht die zweite (`alternative`), wie bei J.1.1.
 *
 * **Vermessung.** Die DV 102 liegt als PDF vor, nicht als SVG. Abgelesen an der Vektorgrafik der
 * Seite 27 (Strichstärke 0,75 pt, alle Werte Strichmitten):
 *
 * - 8.4 Fernsprechen ist der Vorläufer von J.1.1 Sprache: ein waagerechter Strich, über Funk mit
 *   Zickzack darunter. 8.5 Fernschreiben ist **dasselbe Zeichen mit doppeltem Strich**:
 *   Strichlänge 48,13 pt, Abstand der beiden Striche 5,66 pt; Zickzack und Abstand zum unteren
 *   Strich sind dieselben wie in 8.4 (2,6 gegen 2,53 pt bis zur Zickzackkante).
 * - 8.6 Festbildübertragung ist ein Gitter aus je vier waagerechten und senkrechten Strichen, die
 *   an allen vier Seiten überstehen. Über Draht 22,65 pt im Quadrat, Teilung 4,72 bis 4,80 pt,
 *   Überstand 4,05 bis 4,32 pt. Über Funk kleiner, 19,82 pt im Quadrat, Teilung 4,13 bis 4,20 pt,
 *   Überstand 3,61 pt, mittig über dem Zickzack (34,73 pt breit), Abstand bis zur Zickzackkante
 *   2,24 pt.
 *
 * **Konstruktion.** Eigenständig im Hausstil von J.1, nicht geometrietreu zur Altquelle: Strich
 * 0,5 mm, Koordinaten auf 0,05 mm.
 *
 * - Fernschreiben baut auf J.1.1 auf: Balken (26 mm) und Zickzack liegen genau wie dort, der
 *   zweite Balken steht 3 mm über dem ersten (5,66 / 48,13 × 26 mm = 3,06 mm). Über Draht stehen
 *   beide Balken mittig um y = 16, wie der eine Balken von J.1.1 über Draht.
 * - Das Gitter über Funk ist am Zickzack gemessen (34,73 pt ≙ 24,5 mm Strichhülle des
 *   J.1-Zickzacks): Teilung 3 mm, Überstand 2,5 mm, Kantenlänge 14 mm, mittig über dem Zickzack.
 *   Abstand zum Zickzack 3 mm wie bei J.1.8 und J.1.10. Das Ganze steht mittig um y = 16.
 * - Das Gitter über Draht hält das Verhältnis der Vorlage zum Funkgitter (22,65 / 19,82 = 1,14):
 *   Teilung 3,5 mm, Überstand 3 mm, Kantenlänge 16,5 mm, mittig im Feld.
 */

const stroke = COMMS_REFERENCE_STROKE;

/** Abstand der beiden Fernschreibbalken (Strichmitten). */
const TELEPRINTER_BAR_GAP_MM = 3;

/**
 * Ein quadratisches Gitter aus je vier Strichen mit linker oberer Ecke (`xMm` | `yMm`): die
 * Striche liegen im Abstand `pitchMm`, der erste `overhangMm` nach der Kante, und laufen über die
 * ganze Kantenlänge. Waagerechte zuerst, wie in der Vorlage.
 */
function grid(xMm: number, yMm: number, pitchMm: number, overhangMm: number): Primitive[] {
  const sizeMm = 2 * overhangMm + 3 * pitchMm;
  const offsets = [0, 1, 2, 3].map((step) => overhangMm + step * pitchMm);
  return [
    ...offsets.map((offset) => commsLine(xMm, yMm + offset, xMm + sizeMm, yMm + offset, stroke)),
    ...offsets.map((offset) => commsLine(xMm + offset, yMm, xMm + offset, yMm + sizeMm, stroke)),
  ];
}

export const LEGACY_COMMS = deepFreeze([
  defineLegacyComms({
    section: '8.5',
    page: 27,
    id: 'teleprinter-transmission',
    title: 'Fernschreiben',
    box: { xMm: 3, yMm: 13 - TELEPRINTER_BAR_GAP_MM, widthMm: 26, heightMm: 11 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(13 - TELEPRINTER_BAR_GAP_MM), connectionBar(13), wirelessZigzag(17)],
  }),
  defineLegacyComms({
    section: '8.5',
    page: 27,
    id: 'teleprinter-transmission',
    variant: 'alternative',
    title: 'Fernschreiben',
    box: { xMm: 3, yMm: 14.5, widthMm: 26, heightMm: TELEPRINTER_BAR_GAP_MM },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(14.5), connectionBar(14.5 + TELEPRINTER_BAR_GAP_MM)],
  }),
  /** Gitter 9 … 23 × 5,5 … 19,5, Zickzack 22,5 … 26,5: zusammen 21 mm hoch, mittig um y = 16. */
  defineLegacyComms({
    section: '8.6',
    page: 27,
    id: 'still-image-transmission',
    title: 'Festbildübertragung',
    box: { xMm: 4, yMm: 5.5, widthMm: 24, heightMm: 21 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [...grid(9, 5.5, 3, 2.5), wirelessZigzag(22.5)],
  }),
  /** Gitter 7,75 … 24,25 in beiden Richtungen, mittig im Feld. */
  defineLegacyComms({
    section: '8.6',
    page: 27,
    id: 'still-image-transmission',
    variant: 'alternative',
    title: 'Festbildübertragung',
    box: { xMm: 7.75, yMm: 7.75, widthMm: 16.5, heightMm: 16.5 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [...grid(7.75, 7.75, 3.5, 3)],
  }),
] satisfies readonly LegacyPictogramDefinition[]);
