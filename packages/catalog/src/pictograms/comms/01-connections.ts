import { deepFreeze } from '../../readonly-data.js';
import type { CommsId, Primitive } from '@einsatzzeichen/schema';
import { defineComms, type CatalogPictogramDefinition } from '../catalog-definition.js';
import {
  commsLine,
  commsPath,
  commsPolyline,
  commsRect,
  commsText,
  COMMS_WHITE_BODY,
  CONNECTION_CONTRAST,
} from './authoring.js';

/**
 * Die Verbindungsarten aus J.1 bauen auf einer kleinen Formsprache auf, die sich am
 * Referenzbild ablesen lässt:
 *
 * - Der **waagerechte Balken** ist die Verbindung selbst. Er steht in jeder Darstellung außer
 *   den beiden SDS-Zeichen.
 * - Die **Zickzacklinie** darunter bedeutet drahtlos. Die leitergebundene Fassung eines Paares
 *   lässt genau sie weg — das ist der gesamte Unterschied zwischen `primary` und `alternative`.
 * - Die **Bögen** links und rechts des Zickzacks machen aus Sprache Sprechfunk; sie stehen auch
 *   in der Repeatermarke von J.3.5.
 * - Das **Kürzel** benennt die Betriebsart.
 *
 * Der Plan vom 8. August beschrieb J.1.3 als „wie J.1.2 mit DMO-Kennzeichnung". Das Bild zeigt
 * etwas anderes: J.1.3 trägt **nur** Balken und Kürzel, keinen Zickzack und keine Bögen. Die
 * Betriebsart ersetzt die Wellenform, sie ergänzt sie nicht.
 */

/** Die Verbindung: ein waagerechter Balken über der Wellenform. */
function connectionBar(yMm: number) {
  return commsLine(2, yMm, 30, yMm);
}

/** Drahtlos: drei Zacken. Ihr Fehlen ist die Aussage der leitergebundenen Fassung. */
function wirelessZigzag(topMm: number, bottomMm: number) {
  return commsPolyline([
    [4, topMm],
    [8, bottomMm],
    [12, topMm],
    [16, bottomMm],
    [20, topMm],
    [24, bottomMm],
    [28, topMm],
  ]);
}

/** Sprechfunk: derselbe Zickzack zwischen zwei nach außen offenen Bögen. */
function radioArcs(topMm: number, bottomMm: number) {
  return [
    commsPath(`M 5 ${topMm} Q 1.5 ${(topMm + bottomMm) / 2} 5 ${bottomMm}`),
    commsPolyline([
      [6, topMm],
      [10, bottomMm],
      [14, topMm],
      [18, bottomMm],
      [22, topMm],
      [26, bottomMm],
    ]),
    commsPath(`M 27 ${topMm} Q 30.5 ${(topMm + bottomMm) / 2} 27 ${bottomMm}`),
  ];
}

/**
 * Die Betriebsart als Kürzel. `minRenderPx: 64`, weil 7 mm Schriftgrad bei 32 px Rendergröße nur
 * 7,0 px effektiv ergeben — unter `MINIMUM_TEXT_RENDER_PX`.
 */
function modeLabel(content: string, baselineMm: number, boxTopMm: number) {
  return commsText(content, {
    x: 16,
    y: baselineMm,
    sizeMm: 7,
    boxMm: { xMm: 6, yMm: boxTopMm, widthMm: 20, heightMm: 7 },
    minRenderPx: 64,
  });
}

/**
 * Die Satellitenschüssel als Viertelkreis mit Strahl. Sie trägt keine eigene Aussage über den
 * Inhalt — den macht erst das, was rechts danebensteht.
 */
function satelliteDish() {
  return [commsPath('M 2 3 C 2 17 11 26 25 26'), commsLine(8.5, 19.5, 28, 4)];
}

/**
 * Ein Übertragungspaar: dieselbe Marke einmal mit und einmal ohne Zickzack. Der Zickzack ist der
 * gesamte Unterschied zwischen drahtlos und leitergebunden, und beide Fassungen tragen laut
 * Katalogvertrag denselben Titel — die Variante allein trägt die Unterscheidung.
 */
function transmissionPair(
  section: `J.${string}`,
  id: CommsId,
  title: string,
  mark: readonly Primitive[],
  wiredAsset: `${string}.svg`,
  box: { xMm: number; yMm: number; widthMm: number; heightMm: number },
  wiredBox: { xMm: number; yMm: number; widthMm: number; heightMm: number },
): readonly CatalogPictogramDefinition[] {
  return [
    defineComms({
      section,
      id,
      title,
      referenceAsset: `${section}_${title}.svg`,
      box,
      contrastPairs: CONNECTION_CONTRAST,
      primitives: [...mark, wirelessZigzag(20, 26)],
    }),
    defineComms({
      section,
      id,
      variant: 'alternative',
      title,
      referenceAsset: wiredAsset,
      box: wiredBox,
      contrastPairs: CONNECTION_CONTRAST,
      primitives: [...mark],
    }),
  ];
}

export const CONNECTION_COMMS = deepFreeze([
  defineComms({
    section: 'J.1.1',
    id: 'voice',
    title: 'Sprache',
    referenceAsset: 'J.1.1_Sprache.svg',
    box: { xMm: 2, yMm: 12, widthMm: 28, heightMm: 10 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(12), wirelessZigzag(16, 22)],
  }),
  defineComms({
    section: 'J.1.1',
    id: 'voice',
    variant: 'alternative',
    title: 'Sprache',
    referenceAsset: 'J.1.1_Sprache_leitergebunden.svg',
    box: { xMm: 2, yMm: 12, widthMm: 28, heightMm: 0 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(12)],
  }),
  defineComms({
    section: 'J.1.2',
    id: 'voice-radio',
    title: 'Sprechfunk',
    referenceAsset: 'J.1.2_Sprechfunk.svg',
    box: { xMm: 1.5, yMm: 12, widthMm: 29, heightMm: 12 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(12), ...radioArcs(17, 24)],
  }),
  defineComms({
    section: 'J.1.3',
    id: 'voice-radio-dmo',
    title: 'Sprechfunk im DMO',
    referenceAsset: 'J.1.3_Sprechfunk im DMO.svg',
    box: { xMm: 2, yMm: 12, widthMm: 28, heightMm: 10 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(12), modeLabel('DMO', 22, 15)],
  }),
  defineComms({
    section: 'J.1.4',
    id: 'voice-radio-tmo',
    title: 'Sprechfunk im TMO',
    referenceAsset: 'J.1.4_Sprechfunk im TMO.svg',
    box: { xMm: 2, yMm: 12, widthMm: 28, heightMm: 10 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(12), modeLabel('TMO', 22, 15)],
  }),
  /**
   * SDS trägt keinen Verbindungsbalken, sondern einen Rahmen um das Kürzel — der Kurzdienst ist
   * kein Kanal, sondern eine Nachricht. Die Betriebsart steht darunter, größer.
   */
  defineComms({
    section: 'J.1.5',
    id: 'sds-dmo',
    title: 'SDS im DMO',
    referenceAsset: 'J.1.5_SDS im DMO.svg',
    box: { xMm: 6, yMm: 5, widthMm: 20, heightMm: 20 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsRect(9, 5, 14, 9, COMMS_WHITE_BODY),
      commsText('SDS', {
        x: 16,
        y: 12,
        sizeMm: 5.5,
        boxMm: { xMm: 10, yMm: 7, widthMm: 12, heightMm: 5.5 },
        minRenderPx: 64,
      }),
      commsText('DMO', {
        x: 16,
        y: 24,
        sizeMm: 9,
        boxMm: { xMm: 6, yMm: 16, widthMm: 20, heightMm: 9 },
        minRenderPx: 32,
      }),
    ],
  }),
  defineComms({
    section: 'J.1.6',
    id: 'sds-tmo',
    title: 'SDS im TMO',
    referenceAsset: 'J.1.6_SDS im TMO.svg',
    box: { xMm: 6, yMm: 5, widthMm: 20, heightMm: 20 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsRect(9, 5, 14, 9, COMMS_WHITE_BODY),
      commsText('SDS', {
        x: 16,
        y: 12,
        sizeMm: 5.5,
        boxMm: { xMm: 10, yMm: 7, widthMm: 12, heightMm: 5.5 },
        minRenderPx: 64,
      }),
      commsText('TMO', {
        x: 16,
        y: 24,
        sizeMm: 9,
        boxMm: { xMm: 6, yMm: 16, widthMm: 20, heightMm: 9 },
        minRenderPx: 32,
      }),
    ],
  }),
  /** Über Repeater: J.1.3 plus die Repeatermarke aus Bögen und Zickzack darunter. */
  defineComms({
    section: 'J.1.7',
    id: 'voice-radio-dmo-repeater',
    title: 'Sprechfunk im DMO über Repeater',
    referenceAsset: 'J.1.7_Sprechfunk im DMO_Repeater.svg',
    box: { xMm: 1.5, yMm: 7, widthMm: 29, heightMm: 19 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      connectionBar(7),
      commsText('DMO', {
        x: 16,
        y: 17,
        sizeMm: 8,
        boxMm: { xMm: 6, yMm: 10, widthMm: 20, heightMm: 8 },
        minRenderPx: 32,
      }),
      ...radioArcs(20, 26),
    ],
  }),
  /**
   * Ab J.1.8 trägt die Marke oben, **was** übertragen wird, und der Zickzack darunter, **dass**
   * es drahtlos geschieht. Die leitergebundene Fassung lässt genau den Zickzack weg — dieselbe
   * Regel wie bei J.1.1, jetzt viermal.
   */
  ...transmissionPair('J.1.8', 'data-transmission', 'Datenübertragung', [
    commsPolyline([
      [4, 8],
      [9, 8],
      [9, 16],
      [23, 16],
      [23, 8],
      [28, 8],
    ]),
  ], 'J.1.8_Datenübertragung_leitergebunden.svg', { xMm: 4, yMm: 8, widthMm: 24, heightMm: 18 }, { xMm: 4, yMm: 8, widthMm: 24, heightMm: 8 }),
  ...transmissionPair('J.1.9', 'fax-transmission', 'Faxübertragung', [
    commsText('Fax', {
      x: 16,
      y: 16,
      sizeMm: 9,
      boxMm: { xMm: 8, yMm: 7, widthMm: 16, heightMm: 9 },
      minRenderPx: 32,
    }),
  ], 'J.1.9_Faxübertragung_leitergebunden.svg', { xMm: 4, yMm: 7, widthMm: 24, heightMm: 19 }, { xMm: 8, yMm: 7, widthMm: 16, heightMm: 9 }),
  ...transmissionPair('J.1.10', 'image-transmission', 'Bildübertragung', [
    commsRect(4, 5, 24, 15, COMMS_WHITE_BODY, 2),
  ], 'J.1.10_ Bildübertragung_leitergebunden.svg', { xMm: 4, yMm: 5, widthMm: 24, heightMm: 21 }, { xMm: 4, yMm: 5, widthMm: 24, heightMm: 15 }),
  ...transmissionPair('J.1.11', 'livestream-transmission', 'Livestreamübertragung', [
    commsRect(11, 5, 17, 14, COMMS_WHITE_BODY),
    commsPolyline([
      [11, 9],
      [4, 4],
      [4, 20],
      [11, 15],
    ]),
  ], 'J.1.11_Livestreamübertragung_leitergebunden.svg', { xMm: 4, yMm: 4, widthMm: 24, heightMm: 22 }, { xMm: 4, yMm: 4, widthMm: 24, heightMm: 16 }),
  /**
   * Satellitenverbindung: die Schüssel als Viertelkreis, der Strahl als Diagonale. Was übertragen
   * wird, steht rechts daneben — eine gerade Linie für Sprache, eine Rechteckwelle für Daten.
   */
  defineComms({
    section: 'J.1.12',
    id: 'satellite-voice',
    title: 'Satellitenverbindung Sprache',
    referenceAsset: 'J.1.12_Satellitenverbindung_Sprache.svg',
    box: { xMm: 2, yMm: 3, widthMm: 28, heightMm: 25 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [...satelliteDish(), commsLine(19, 16, 30, 16)],
  }),
  defineComms({
    section: 'J.1.13',
    id: 'satellite-data',
    title: 'Satellitenverbindung Daten',
    referenceAsset: 'J.1.13_Satellitenverbindung_Daten.svg',
    box: { xMm: 2, yMm: 3, widthMm: 28, heightMm: 25 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      ...satelliteDish(),
      commsPolyline([
        [19, 14],
        [22, 14],
        [22, 19],
        [27, 19],
        [27, 14],
        [30, 14],
      ]),
    ],
  }),
  /**
   * Richtfunk: zwei gegenüberliegende Schalen. Der graue Erklärtext der Referenzdatei
   * („Information") ist Blattbeschriftung und kein Zeicheninhalt — er bleibt weg.
   */
  defineComms({
    section: 'J.1.14',
    id: 'directional-radio',
    title: 'Richtfunkverbindung',
    referenceAsset: 'J.1.14_Richtfunkverbindung.svg',
    box: { xMm: 3.5, yMm: 6, widthMm: 25, heightMm: 20 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsPath('M 6 6 C 3.5 10 3.5 22 6 26'),
      commsLine(4.5, 16, 12, 16),
      commsPath('M 26 6 C 28.5 10 28.5 22 26 26'),
      commsLine(20, 16, 27.5, 16),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
