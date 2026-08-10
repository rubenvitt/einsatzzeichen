import { deepFreeze } from '../../readonly-data.js';
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
] satisfies readonly CatalogPictogramDefinition[]);
