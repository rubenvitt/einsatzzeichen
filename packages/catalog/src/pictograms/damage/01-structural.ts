import { deepFreeze } from '../../readonly-data.js';
import { defineDamage, type CatalogPictogramDefinition } from '../catalog-definition.js';
import {
  DAMAGE_BLACK_CONTRAST,
  ROOM,
  damageLine,
  damagePath,
  damagePolyline,
  damageRect,
  waveD,
  openRoom,
  smoothCurveD,
} from './authoring.js';

/**
 * Anhang K — Bauwerksschäden. Achtzehn Zeichen, die ein Erkundungstrupp in eine Lagekarte
 * einträgt: was ein verschütteter Raum enthält, wo eine Trümmerkante verläuft, welche Decke über
 * einem Hohlraum liegt.
 *
 * Die Formsprache hat drei Gruppen, und sie zu kennen erspart es, achtzehn Einzelfälle zu lesen:
 *
 * - **K.1 bis K.8 zeigen einen Raum** als Rechteck von 2/6 bis 30/26 mm. Ist er unbeschädigt,
 *   ist er geschlossen (K.1); ist er angeschlagen, durchschneidet ihn eine Diagonale (K.2, K.3);
 *   ist er ausgefüllt, fehlt ihm die Decke und eine Linie bei y = 12 markiert den Füllstand
 *   (K.5 bis K.8). Was den Raum füllt, steht über dieser Linie: nichts, eine gewellte
 *   Schuttkante, eine Schraffur, ein Wassertropfen.
 * - **K.9 bis K.11 zeigen Kanten und Flächen ohne Raum** — eine Rutschfläche, eine Schichtung,
 *   eine Trümmerböschung.
 * - **K.12 bis K.18 zeigen Geschosslagen und Deckenarten** an einer senkrechten bzw.
 *   waagerechten Bezugslinie. Hier ist die Position der Querlinie die ganze Aussage: oben, in
 *   der Mitte, unten.
 *
 * Alle achtzehn sind reines Schwarz. Anhang K ist der einzige der drei D.4-Anhänge, der ohne
 * eine einzige Füllangabe auskommt, und deshalb der einzige ohne Kontrastentscheidung.
 *
 * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: jede Koordinate ist die
 * Mittellinie der 0,5 mm starken Referenzumrisse, auf 0,05 mm gerundet.
 */

/**
 * Die Schuttoberkante in K.6: eine Welle (`waveD`) zwischen 6 mm (Berg) und 7,5 mm (Tal),
 * Wellenberge bei x = 3 mm und danach alle 6,45 mm — fünf Berge über die Raumbreite.
 */
const DEBRIS_WAVE = { yMid: 6.75, amplitude: 0.75, period: 6.45, crestX: 3 } as const;

/** Die Wände enden in K.6 an der Welle: beide Wandköpfe liegen auf 6,3 mm (abgelesen). */
const DEBRIS_WALL_TOP = 6.3;

/**
 * Die Trümmerböschung in K.11: an der Referenz abgelesene Stützpunkte der Mittellinie (etwa
 * alle 0,8 mm Bogenlänge), vom Überstand links oben (0,5/5,5) bis zur Bodenkante rechts
 * (30/26). Die Böschung fällt in unregelmäßigen Stufen aus flachen Absätzen und kurzen steilen
 * Abbrüchen; eine glatte Kurve (Catmull-Rom, `smoothCurveD`) verbindet die Punkte.
 */
const DEBRIS_SLOPE: readonly (readonly [number, number])[] = [
  [0.5, 5.5], [1.85, 6.6], [3.3, 7.15], [4.1, 7.45], [4.75, 7.75], [5.3, 8.3], [5.55, 8.8],
  [5.85, 9.3], [6.4, 9.85], [7.15, 10.05], [7.85, 9.95], [8.55, 9.8], [9.25, 10.05],
  [9.85, 10.5], [10.25, 10.9], [10.6, 11.25], [11.2, 11.75], [11.65, 12.35], [11.75, 13.15],
  [11.85, 13.95], [12.3, 14.6], [13.05, 14.85], [13.7, 14.75], [14.35, 14.7], [15.1, 14.95],
  [15.65, 15.5], [15.85, 16.1], [16.05, 16.7], [16.6, 17.3], [17.4, 17.35], [18.35, 16.95],
  [19.25, 16.5], [20.1, 16.6], [20.55, 17.2], [20.7, 17.95], [20.8, 18.7], [21.3, 19.3],
  [22.05, 19.5], [22.85, 19.3], [23.6, 19.05], [24.35, 19.25], [24.85, 19.85], [25, 20.55],
  [25.2, 21.25], [25.65, 21.85], [26.2, 22.4], [26.45, 23.05], [26.65, 23.65], [27.1, 24.25],
  [27.7, 24.55], [28.35, 24.75], [29.2, 25.05], [30, 26],
];

/** Die Rutschfläche in K.9: 20 mm hoch auf 19 mm breit (dieselbe Neigung wie K.7 und K.10). */
const SLIP_ANGLE_DX = 19;

export const STRUCTURAL_DAMAGE = deepFreeze([
  defineDamage({
    section: 'K.1',
    id: 'room-blocked',
    title: 'Raum versperrt',
    referenceAsset: 'K.1_Raum_versperrt.svg',
    box: { xMm: ROOM.left, yMm: ROOM.top, widthMm: 28, heightMm: 20 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [damageRect(ROOM.left, ROOM.top, 28, 20)],
  }),
  defineDamage({
    section: 'K.2',
    id: 'room-damaged',
    title: 'Raum angeschlagen',
    referenceAsset: 'K.2_Raum_angeschlagen.svg',
    // Die Diagonale steht an beiden Enden über den Raum hinaus — bis 31,5/14,5 mm. Die Box muss
    // ihr folgen, sonst meldet das Box-Gate einen Lauf ausserhalb der zugesicherten Hülle.
    box: { xMm: ROOM.left, yMm: 4.5, widthMm: 29.5, heightMm: 21.5 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [
      damageRect(ROOM.left, ROOM.top, 28, 20),
      // Schneidet die Deckenkante bei x = 23 und die rechte Wand bei y = 13.
      damageLine(21.5, 4.5, 31.5, 14.5),
    ],
  }),
  defineDamage({
    section: 'K.3',
    id: 'half-room-damaged',
    title: 'Halber Raum angeschlagen',
    referenceAsset: 'K.3_Halber Raum_angeschlagen.svg',
    box: { xMm: 0.5, yMm: 4.5, widthMm: 29.5, heightMm: 21.5 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [
      // Die Diagonale läuft durch die obere linke Raumecke und teilt den Raum in der Mitte der
      // Bodenkante — der halbe Raum. Ihr Überstand nach oben links liegt bei 0,5/4,5 mm.
      damageLine(0.5, 4.5, 22, ROOM.bottom),
      damageLine(ROOM.left, ROOM.top, ROOM.left, ROOM.bottom),
      damageLine(ROOM.left, ROOM.bottom, ROOM.right, ROOM.bottom),
    ],
  }),
  defineDamage({
    section: 'K.4',
    id: 'room-damaged-swallow-nest',
    title: 'Raum angeschlagen, Schwalbennest',
    referenceAsset: 'K.4_Raum_angeschlagen_Schwalbennest.svg',
    box: { xMm: ROOM.left, yMm: ROOM.top, widthMm: 28, heightMm: 20 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [
      // Decke und rechte Wand brechen je zur Hälfte ab: die Decke endet bei x = 16, die Wand
      // beginnt erst bei y = 16. Übrig bleibt die Ecke, die dem Zeichen den Namen gibt.
      damagePolyline([
        [16, ROOM.top],
        [ROOM.left, ROOM.top],
        [ROOM.left, ROOM.bottom],
        [ROOM.right, ROOM.bottom],
        [ROOM.right, 16],
      ]),
    ],
  }),
  defineDamage({
    section: 'K.5',
    id: 'room-filled',
    title: 'Raum ausgefüllt',
    referenceAsset: 'K.5_Raum_ausgefüllt.svg',
    box: { xMm: ROOM.left, yMm: ROOM.top, widthMm: 28, heightMm: 20 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [openRoom(), damageLine(ROOM.left, ROOM.fillLine, ROOM.right, ROOM.fillLine)],
  }),
  defineDamage({
    section: 'K.6',
    id: 'room-filled-fine-debris',
    title: 'Raum ausgefüllt, kleinbrockige Trümmer',
    referenceAsset: 'K.6_Raum_ausgefüllt_kleinbrockige Trümmer.svg',
    box: { xMm: ROOM.left, yMm: 6, widthMm: 28, heightMm: 20 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [
      // Die Wände reichen bis an die Welle heran, die den Raum oben abschließt.
      openRoom(DEBRIS_WALL_TOP, DEBRIS_WALL_TOP),
      damageLine(ROOM.left, ROOM.fillLine, ROOM.right, ROOM.fillLine),
      damagePath(
        waveD(
          ROOM.left,
          ROOM.right,
          DEBRIS_WAVE.yMid,
          DEBRIS_WAVE.amplitude,
          DEBRIS_WAVE.period,
          DEBRIS_WAVE.crestX,
        ),
      ),
    ],
  }),
  defineDamage({
    section: 'K.7',
    id: 'room-filled-layered',
    title: 'Raum ausgefüllt, Schichtung',
    referenceAsset: 'K.7_Raum_ausgefüllt_Schichtung.svg',
    box: { xMm: ROOM.left, yMm: ROOM.top, widthMm: 28, heightMm: 20 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [
      openRoom(),
      damageLine(ROOM.left, ROOM.fillLine, ROOM.right, ROOM.fillLine),
      // Vier Schichtlinien wie in K.10 (Fußpunkte 2, 5, 8, 11 mm, Kopfpunkte 21 bis 30 mm):
      // sie laufen durch den gefüllten Teil bis zur Deckenhöhe, die letzte genau in die rechte
      // obere Raumecke.
      ...[0, 3, 6, 9].map((offset) =>
        damageLine(ROOM.left + offset, ROOM.bottom, 21 + offset, ROOM.top),
      ),
    ],
  }),
  defineDamage({
    section: 'K.8',
    id: 'room-filled-water',
    title: 'Raum ausgefüllt, Wasser',
    referenceAsset: 'K.8_Raum_ausgefüllt_Wasser.svg',
    box: { xMm: ROOM.left, yMm: ROOM.top, widthMm: 28, heightMm: 20 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [
      openRoom(),
      damageLine(ROOM.left, ROOM.fillLine, ROOM.right, ROOM.fillLine),
      // Der Tropfen sitzt mittig auf der Füllstandslinie und zeigt mit der Spitze hinein.
      damagePolyline(
        [
          [12, 7],
          [20, 7],
          [16, ROOM.fillLine],
        ],
        true,
      ),
    ],
  }),
  defineDamage({
    section: 'K.9',
    id: 'slip-surface',
    title: 'Rutschfläche',
    referenceAsset: 'K.9_Rutschfläche.svg',
    box: { xMm: 6.5, yMm: ROOM.top, widthMm: SLIP_ANGLE_DX, heightMm: 20 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [damageLine(6.5, ROOM.bottom, 25.5, ROOM.top)],
  }),
  defineDamage({
    section: 'K.10',
    id: 'layering',
    title: 'Schichtung',
    referenceAsset: 'K.10_Schichtung.svg',
    box: { xMm: ROOM.left, yMm: ROOM.top, widthMm: 28, heightMm: 20 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    // Vier Rutschflächen übereinander, im Abstand von 3 mm — daher „Schichtung".
    primitives: [0, 3, 6, 9].map((offset) =>
      damageLine(ROOM.left + offset, ROOM.bottom, 21 + offset, ROOM.top),
    ),
  }),
  defineDamage({
    section: 'K.11',
    id: 'edge-debris',
    title: 'Randtrümmer',
    referenceAsset: 'K.11_Randtrümmer.svg',
    box: { xMm: 0.5, yMm: 5.5, widthMm: 29.5, heightMm: 20.5 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [
      // Wand und Boden; die Wand endet an der Böschung (bei y = 6,95 mm).
      damagePolyline([
        [ROOM.left, 6.95],
        [ROOM.left, ROOM.bottom],
        [ROOM.right, ROOM.bottom],
      ]),
      damagePath(smoothCurveD(DEBRIS_SLOPE)),
    ],
  }),
  defineDamage({
    section: 'K.12',
    id: 'upper-floors',
    title: 'Obere Geschosse',
    referenceAsset: 'K.12_Obere Geschosse.svg',
    box: { xMm: 6, yMm: 2, widthMm: 20, heightMm: 28 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    // Die Querlinie sitzt am oberen Ende der Bezugslinie: betroffen ist, was oben liegt.
    primitives: [damageLine(6, 2, 26, 2), damageLine(16, 2, 16, 30)],
  }),
  defineDamage({
    section: 'K.13',
    id: 'middle-floors',
    title: 'Mittlere Geschosse',
    referenceAsset: 'K.13_Mittlere Geschosse.svg',
    box: { xMm: 6, yMm: 2, widthMm: 20, heightMm: 28 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    // Zwei Querlinien grenzen die Mitte von oben und unten ab.
    primitives: [
      damageLine(16, 2, 16, 30),
      damageLine(6, 15, 26, 15),
      damageLine(6, 17, 26, 17),
    ],
  }),
  defineDamage({
    section: 'K.14',
    id: 'lower-floors',
    title: 'Untere Geschosse',
    referenceAsset: 'K.14_Untere Geschosse.svg',
    box: { xMm: 6, yMm: 2, widthMm: 20, heightMm: 28 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [damageLine(16, 2, 16, 30), damageLine(6, 30, 26, 30)],
  }),
  defineDamage({
    section: 'K.15',
    id: 'timber-beam-ceiling',
    title: 'Holzbalkendecke',
    referenceAsset: 'K.15_Holzbalkendecke.svg',
    box: { xMm: 2, yMm: 11, widthMm: 28, heightMm: 10 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    // Der Balken im Querschnitt: ein Quadrat auf der Deckenlinie.
    primitives: [damageLine(2, 16, 30, 16), damageRect(11, 11, 10, 10)],
  }),
  defineDamage({
    section: 'K.16',
    id: 'girder-ceiling',
    title: 'Trägerdecke',
    referenceAsset: 'K.16_Trägerdecke.svg',
    box: { xMm: 2, yMm: 11, widthMm: 28, heightMm: 10 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    // Der Doppel-T-Träger im Querschnitt: zwei Flansche und ein Steg auf der Deckenlinie.
    primitives: [
      damageLine(2, 16, 30, 16),
      damageLine(11, 11, 21, 11),
      damageLine(11, 21, 21, 21),
      damageLine(16, 11, 16, 21),
    ],
  }),
  defineDamage({
    section: 'K.17',
    id: 'solid-slab-ceiling',
    title: 'Vollplattendecke',
    referenceAsset: 'K.17_Vollplattendecke.svg',
    box: { xMm: 2, yMm: 11, widthMm: 28, heightMm: 5 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    // Die Platte hat keinen Querschnittskörper — nur eine zweite, kürzere Linie darüber.
    primitives: [damageLine(2, 16, 30, 16), damageLine(16, 11, 30, 11)],
  }),
  defineDamage({
    section: 'K.18',
    id: 'vaulted-ceiling',
    title: 'Gewölbedecke',
    referenceAsset: 'K.18_Gewölbedecke.svg',
    box: { xMm: 2, yMm: 8, widthMm: 28, heightMm: 18 },
    contrastPairs: DAMAGE_BLACK_CONTRAST,
    primitives: [
      damageLine(2, 16, 30, 16),
      // Der Gewölbebogen, symmetrisch um x = 16: von Kämpfer 4/26 über den Scheitel 16/8 nach
      // 28/26. Die Referenz zeichnet ihn als zwei kubische Segmente. Die hier eingetragenen
      // Kontrollpunkte sind die Mittellinie zwischen deren Aussen- und Innenkontur.
      damagePath('M 4 26 C 4 15.25 8.85 8 16 8 C 23.15 8 28 15.25 28 26'),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
