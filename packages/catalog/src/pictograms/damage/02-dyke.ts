import { deepFreeze } from '../../readonly-data.js';
import { defineDamage, type CatalogPictogramDefinition } from '../catalog-definition.js';
import type { Point } from '@einsatzzeichen/schema';
import {
  DAMAGE_RED_STROKE,
  DYKE_CONTRAST,
  arrowHead,
  damageLine,
  damagePath,
  damageText,
  dashedCubic,
  dykeBase,
} from './authoring.js';

/**
 * Anhang L — Deichverteidigung. Zehn Zeichen, und alle zehn sind **dieselbe schwarze Deichfigur
 * mit einer roten Marke darauf**. Das ist die ganze Formsprache: die Figur sagt „Deich", die
 * Marke sagt, was ihm zustösst.
 *
 * Die rote Marke ist fast immer ein Pfeil, und seine Lage am Querschnitt ist die Aussage:
 *
 * - **über** der Krone hinweg — das Wasser läuft oben drüber (L.1, L.2)
 * - **durch** den Körper hindurch — es läuft mittendurch (L.3, L.4)
 * - **unter** dem Fuss hindurch und aufwärts — es unterspült (L.5, L.6)
 * - **abwärts** an der Binnenböschung — sie rutscht ab (L.7)
 *
 * Punktuell gegen flächig unterscheidet die Referenz durch die Länge: ein kurzer Pfeil an einer
 * Stelle (L.3, L.5) gegen einen langen, der den ganzen Querschnitt quert (L.4, L.6). L.8 und L.9
 * verlassen die Pfeilform — ein Kreuz für den Schaden, ein Kreuzmuster für den Bruch. L.10 ist
 * das einzige Zeichen des Anhangs mit einer Beschriftung.
 *
 * Die Deichfigur steht in `dykeBase()`; sie ist in allen zehn Referenzdateien koordinatengleich.
 */

/**
 * Der Bogen, der die Krone überspült — von der Vorlandseite über den Deich nach binnen.
 * L.1 und L.2 teilen ihn; sie unterscheiden sich allein darin, ob er gestrichelt ist.
 */
const OVERFLOW_ARC = {
  start: [2, 7.5],
  control1: [8, 1.5],
  control2: [21, 1.5],
  end: [27.4, 4.6],
} as const satisfies Record<string, Point>;

const OVERFLOW_ARC_D = 'M 2 7.5 C 8 1.5 21 1.5 27.4 4.6';

/** Derselbe Bogen gespiegelt: von binnen unter dem Deich hindurch zurück ins Vorland. */
const UNDERCUT_ARC_D = 'M 2 19.5 C 8 25.5 21 25.5 27.4 22.4';

export const DYKE_DAMAGE = deepFreeze([
  defineDamage({
    section: 'L.1',
    id: 'imminent-overflow',
    title: 'Drohende Überspülung',
    referenceAsset: 'L.1_Drohende Überspülung.svg',
    box: { xMm: 2, yMm: 1.5, widthMm: 29.4, heightMm: 24.5 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Gestrichelt, weil die Überspülung noch nicht eingetreten ist — dieselbe Kurve wie L.2,
      // in neun Stücke zerlegt, von denen fünf gezeichnet werden.
      ...dashedCubic(
        OVERFLOW_ARC.start,
        OVERFLOW_ARC.control1,
        OVERFLOW_ARC.control2,
        OVERFLOW_ARC.end,
        9,
        DAMAGE_RED_STROKE,
      ),
      arrowHead(31.4, 6.1, 25),
    ],
  }),
  defineDamage({
    section: 'L.2',
    id: 'overflow',
    title: 'Überspülung',
    referenceAsset: 'L.2_Überspülung.svg',
    box: { xMm: 2, yMm: 1.5, widthMm: 29.4, heightMm: 24.5 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      damagePath(OVERFLOW_ARC_D, DAMAGE_RED_STROKE),
      arrowHead(31.4, 6.1, 25),
    ],
  }),
  defineDamage({
    section: 'L.3',
    id: 'local-through-flow',
    title: 'Punktuelle Durchspülung',
    referenceAsset: 'L.3_Punktuelle Durchspülung.svg',
    box: { xMm: 2, yMm: 5.2, widthMm: 29, heightMm: 20.8 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Kurz und nur an einer Stelle: waagerecht bis zur Binnenböschung, dann schräg hinaus.
      damageLine(19.8, 10.4, 24.2, 10.4, DAMAGE_RED_STROKE),
      damageLine(24.2, 10.4, 27.2, 7.4, DAMAGE_RED_STROKE),
      arrowHead(29.4, 5.2, -45),
    ],
  }),
  defineDamage({
    section: 'L.4',
    id: 'through-flow',
    title: 'Durchspülung',
    referenceAsset: 'L.4_Durchspülung.svg',
    box: { xMm: 2, yMm: 6, widthMm: 29.4, heightMm: 20 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Quert den ganzen Querschnitt auf halber Höhe — die flächige Durchspülung.
      damageLine(2, 10, 27.3, 10, DAMAGE_RED_STROKE),
      // Die Spitze endet bei 31,4 mm und nicht bei den 31,6 der Referenz: mit dem
      // Strichzuschlag der Hülle läge die Box-Ecke sonst bei 32,1 mm und damit ausserhalb der
      // 32-mm-ViewBox. Alle übrigen Pfeile des Anhangs enden ohnehin auf dieser Linie.
      arrowHead(31.4, 10, 0),
    ],
  }),
  defineDamage({
    section: 'L.5',
    id: 'local-undercutting',
    title: 'Punktuelle Unterspülung',
    referenceAsset: 'L.5_Punktuelle Unterspülung.svg',
    box: { xMm: 2, yMm: 6, widthMm: 29, heightMm: 20 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Die S-Kurve steigt aus dem Deichfuss binnenseitig auf: Wasser findet einen Weg nach oben.
      damagePath('M 26.4 18.6 C 24.6 16.4 27.4 15 27.1 12', DAMAGE_RED_STROKE),
      arrowHead(27.1, 7.5, -90),
    ],
  }),
  defineDamage({
    section: 'L.6',
    id: 'undercutting',
    title: 'Unterspülung',
    referenceAsset: 'L.6_Unterspülung.svg',
    box: { xMm: 2, yMm: 6, widthMm: 29.4, heightMm: 20 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      damagePath(UNDERCUT_ARC_D, DAMAGE_RED_STROKE),
      arrowHead(31.4, 19.9, -25),
    ],
  }),
  defineDamage({
    section: 'L.7',
    id: 'slope-slippage',
    title: 'Böschungsabrutschung',
    referenceAsset: 'L.7_Böschungsabrutschung.svg',
    box: { xMm: 2, yMm: 4.4, widthMm: 29, heightMm: 21.6 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Über die Krone gehakt und an der Binnenböschung nach unten: die Böschung rutscht ab.
      damagePath('M 21.5 4.4 C 25.5 5.5 26.5 9.5 25.5 11.5', DAMAGE_RED_STROKE),
      arrowHead(25.1, 14.5, 90),
    ],
  }),
  defineDamage({
    section: 'L.8',
    id: 'outer-dyke-damage',
    title: 'Schäden am Außendeich',
    referenceAsset: 'L.8_Schäden am Außendeich.svg',
    box: { xMm: 2, yMm: 6, widthMm: 29, heightMm: 20 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Ein Kreuz auf der Aussenböschung — dort, wo der Schaden sitzt, nicht am ganzen Deich.
      damageLine(9.25, 11.75, 17.75, 20.25, DAMAGE_RED_STROKE),
      damageLine(9.25, 20.25, 17.75, 11.75, DAMAGE_RED_STROKE),
    ],
  }),
  defineDamage({
    section: 'L.9',
    id: 'dyke-breach',
    title: 'Deichbruch',
    referenceAsset: 'L.9_Deichbruch.svg',
    box: { xMm: 2, yMm: 4.333, widthMm: 29, heightMm: 23.334 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Vier Diagonalen von je 26 mm, die sich zu einer Raute um die Deichmitte kreuzen. Nicht
      // ein Kreuz an einer Stelle wie in L.8, sondern ein Muster über den ganzen Querschnitt:
      // der Deich ist nicht beschädigt, er ist durch.
      damageLine(9.283, 4.333, 27.667, 22.717, DAMAGE_RED_STROKE),
      damageLine(4.333, 9.283, 22.717, 27.667, DAMAGE_RED_STROKE),
      damageLine(22.717, 4.333, 4.333, 22.717, DAMAGE_RED_STROKE),
      damageLine(27.667, 9.283, 9.283, 27.667, DAMAGE_RED_STROKE),
    ],
  }),
  defineDamage({
    section: 'L.10',
    id: 'seepage-line-marker',
    title: 'Angabe der Sickerlinie',
    referenceAsset: 'L.10_Angabe der Sickerlinie.svg',
    box: { xMm: 2, yMm: 5.12, widthMm: 29, heightMm: 20.88 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Die Sickerlinie: die Höhe, bis zu der das Wasser den Deichkörper durchdrungen hat.
      damageLine(2, 10, 31, 10, DAMAGE_RED_STROKE),
      // Der Prozentwert gehört zur Linie und ist in der Referenz rot. Er steht hier **schwarz**:
      // Rot erreicht auf der Ausgabeoberfläche 4,02:1 und verfehlt damit die Textschwelle von
      // 4,5:1, die für jeden Textlauf des Katalogs gilt. Alle übrigen Beschriftungen des
      // Katalogs sind ebenfalls schwarz — die Abweichung betrifft die Farbe, nicht die Aussage.
      // „50 %" ist dabei der Beispielwert der Referenz, kein fester Bestandteil des Zeichens.
      damageText('50 %', { x: 2, y: 8, sizeMm: 4, minRenderPx: 48 }),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
