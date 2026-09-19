import { deepFreeze } from '../../readonly-data.js';
import { defineDamage, type CatalogPictogramDefinition } from '../catalog-definition.js';
import type { Point } from '@einsatzzeichen/schema';
import {
  DAMAGE_RED_FILL,
  DAMAGE_RED_STROKE,
  DYKE_CONTRAST,
  arrowBase,
  arrowHead,
  cubicChainD,
  damageLine,
  damagePath,
  damageText,
  dashedCubics,
  dykeBase,
  type Cubic,
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
 * Alle Pfeile tragen dieselbe gefüllte Spitze (`arrowHead`, gleichseitig, 5 mm), der Schaft
 * endet an ihrer Basismitte. Maße an der Referenz abgelesen, Geometrie eigenständig
 * konstruiert; Koordinaten sind Mittellinien der 0,5 mm starken Referenzumrisse.
 */

/**
 * Der Bogen, der die Krone überspült — von der Vorlandseite (2/7) über den Scheitel 16/3 bis
 * zur Basis der Pfeilspitze. L.1 und L.2 teilen ihn; sie unterscheiden sich allein darin, ob
 * er gestrichelt ist. Die Spitze sitzt bei 31,4/6,14 und ist um 18,6° nach unten geneigt.
 */
const OVERFLOW_TIP = [31.4, 6.14, 18.6] as const;
const OVERFLOW_ARC: readonly Cubic[] = [
  [
    [2, 7],
    [3.8, 5.8],
    [8.8, 3],
    [16, 3],
  ],
  [[16, 3], [19.8, 3], [23.5, 3.6], arrowBase(...OVERFLOW_TIP)],
];

/**
 * Derselbe Bogen an der Waagerechten y = 13 gespiegelt (y ↦ 26 − y): unter dem Deich hindurch.
 * Die Spiegelung ist an der Referenz nachgemessen — Start 2/19, Tiefpunkt 16/23, Spitze
 * 31,4/19,86.
 */
const mirror = ([x, y]: Point): Point => [x, 26 - y];
const UNDERCUT_TIP = [31.4, 19.86, -18.6] as const;
const UNDERCUT_ARC: readonly Cubic[] = OVERFLOW_ARC.map(
  ([a, b, c, d]) => [mirror(a), mirror(b), mirror(c), mirror(d)] as const,
);

/** L.3: waagerecht aus dem Deichkörper bis 24,5/11, dann unter −50° hinaus zur Spitze. */
const LOCAL_THROUGH_TIP = [29.3, 5.25, -50] as const;

/** L.4: waagerecht auf halber Kronenhöhe durch den ganzen Querschnitt, Spitze bei 31,6/10. */
const THROUGH_TIP = [31.6, 10, 0] as const;

/**
 * L.5: eine flache S-Kurve steigt vom Binnenfuß (26/19) über 27/15 auf; die Spitze zeigt steil
 * nach oben (−104°) und endet bei 27,15/7,5.
 */
const LOCAL_UNDERCUT_TIP = [27.15, 7.5, -104] as const;
const LOCAL_UNDERCUT_ARC: readonly Cubic[] = [
  [
    [26, 19],
    [25.5, 17],
    [26.25, 16],
    [27, 15],
  ],
  [[27, 15], [27.65, 14.1], [28.3, 13.25], arrowBase(...LOCAL_UNDERCUT_TIP)],
];

/**
 * L.7: ein Haken — von oberhalb der Krone (21/3) senkrecht hinab auf die Binnenböschung, unten
 * (21,75/10,6) umgebogen und schräg nach rechts oben hinaus; Spitze bei 30,08/8,15 unter −31°.
 */
const SLIPPAGE_TIP = [30.08, 8.15, -31] as const;
const SLIPPAGE_HOOK: readonly Cubic[] = [
  [
    [21, 3],
    [19.95, 6.65],
    [20.2, 9.45],
    [21.75, 10.6],
  ],
  [[21.75, 10.6], [22.8, 11.4], [24.45, 11.35], arrowBase(...SLIPPAGE_TIP)],
];

export const DYKE_DAMAGE = deepFreeze([
  defineDamage({
    section: 'L.1',
    id: 'imminent-overflow',
    title: 'Drohende Überspülung',
    referenceAsset: 'L.1_Drohende Überspülung.svg',
    box: { xMm: 2, yMm: 2.35, widthMm: 29.4, heightMm: 23.65 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Gestrichelt, weil die Überspülung noch nicht eingetreten ist — derselbe Bogen wie L.2,
      // nach Bogenlänge in 3-mm-Striche mit 2 mm Lücke zerlegt.
      ...dashedCubics(OVERFLOW_ARC, 3, 2, DAMAGE_RED_STROKE),
      arrowHead(...OVERFLOW_TIP),
    ],
  }),
  defineDamage({
    section: 'L.2',
    id: 'overflow',
    title: 'Überspülung',
    referenceAsset: 'L.2_Überspülung.svg',
    box: { xMm: 2, yMm: 2.35, widthMm: 29.4, heightMm: 23.65 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      damagePath(cubicChainD(OVERFLOW_ARC), DAMAGE_RED_STROKE),
      arrowHead(...OVERFLOW_TIP),
    ],
  }),
  defineDamage({
    section: 'L.3',
    id: 'local-through-flow',
    title: 'Punktuelle Durchspülung',
    referenceAsset: 'L.3_Punktuelle Durchspülung.svg',
    box: { xMm: 2, yMm: 5.25, widthMm: 29, heightMm: 20.75 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Kurz und nur an einer Stelle: waagerecht bis zur Binnenböschung, dann schräg hinaus.
      damageLine(20, 11, 24.5, 11, DAMAGE_RED_STROKE),
      damageLine(24.5, 11, ...arrowBase(...LOCAL_THROUGH_TIP), DAMAGE_RED_STROKE),
      arrowHead(...LOCAL_THROUGH_TIP),
    ],
  }),
  defineDamage({
    section: 'L.4',
    id: 'through-flow',
    title: 'Durchspülung',
    referenceAsset: 'L.4_Durchspülung.svg',
    box: { xMm: 2, yMm: 6, widthMm: 29.6, heightMm: 20 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Quert den ganzen Querschnitt auf halber Kronenhöhe — die flächige Durchspülung.
      damageLine(2, 10, ...arrowBase(...THROUGH_TIP), DAMAGE_RED_STROKE),
      arrowHead(...THROUGH_TIP),
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
      // Die S-Kurve steigt aus dem Deichfuß binnenseitig auf: Wasser findet einen Weg nach oben.
      damagePath(cubicChainD(LOCAL_UNDERCUT_ARC), DAMAGE_RED_STROKE),
      arrowHead(...LOCAL_UNDERCUT_TIP),
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
      damagePath(cubicChainD(UNDERCUT_ARC), DAMAGE_RED_STROKE),
      arrowHead(...UNDERCUT_TIP),
    ],
  }),
  defineDamage({
    section: 'L.7',
    id: 'slope-slippage',
    title: 'Böschungsabrutschung',
    referenceAsset: 'L.7_Böschungsabrutschung.svg',
    box: { xMm: 2, yMm: 3, widthMm: 29, heightMm: 23 },
    contrastPairs: DYKE_CONTRAST,
    primitives: [
      dykeBase(),
      // Von oben auf die Binnenböschung gehakt und seitlich hinaus: die Böschung rutscht ab.
      damagePath(cubicChainD(SLIPPAGE_HOOK), DAMAGE_RED_STROKE),
      arrowHead(...SLIPPAGE_TIP),
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
      // Der Prozentwert gehört zur Linie und ist wie in der Referenz rot (Arimo, 4 mm, Grundlinie
      // 8 mm). Rot erreicht als Textfarbe nur 4,02:1; die Kontrastausnahme ist zentral
      // geführt, wie bei den roten Beschriftungen in 5.8.1. „50 %" ist der Beispielwert der
      // Referenz, kein fester Bestandteil des Zeichens.
      damageText('50 %', { x: 2, y: 8, sizeMm: 4, minRenderPx: 48, style: DAMAGE_RED_FILL }),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
