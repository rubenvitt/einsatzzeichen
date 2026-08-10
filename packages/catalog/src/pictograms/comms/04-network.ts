import { deepFreeze } from '../../readonly-data.js';
import {
  defineComms,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';
import {
  commsCircle,
  commsLine,
  commsPath,
  commsPolyline,
  commsRect,
  COMMS_BLACK_FILL,
  COMMS_WHITE_BODY,
} from './authoring.js';

const NETWORK_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Kontur des Netzkörpers auf der Ausgabeoberfläche',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Marke auf dem Netzkörper',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const NETWORK_BOX = { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 } as const;

/** Weißes Quadrat mit schwarzer Kontur — der Körper der meisten Netzzeichen. */
function networkBody() {
  return commsRect(4, 4, 24, 24, COMMS_WHITE_BODY);
}

/** Eine gefüllte Pfeilspitze als geschlossene Polylinie. */
function arrowhead(points: readonly (readonly [number, number])[]) {
  return commsPolyline(points, true, COMMS_BLACK_FILL);
}

/**
 * Die Netz- und Gerätezeichen aus J.4.1 bis J.4.7. Anders als J.3 ist hier keine Darstellung
 * typografisch — jede trägt eine eigene Marke, und die Marken unterscheiden sich deutlich
 * genug, dass kein Kürzel nötig ist.
 */
export const NETWORK_COMMS = deepFreeze([
  /**
   * Router: Kreiskörper mit vier Pfeilen. Die senkrechten zeigen nach außen, die waagerechten
   * zur Mitte — die Richtung ist die Aussage, nicht die Zahl der Pfeile.
   */
  defineComms({
    section: 'J.4.1',
    id: 'router',
    title: 'Router',
    referenceAsset: 'J.4.1_Router.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      commsCircle(16, 16, 12, COMMS_WHITE_BODY),
      arrowhead([
        [12, 10],
        [16, 4.5],
        [20, 10],
      ]),
      commsLine(16, 10, 16, 16),
      arrowhead([
        [12, 22],
        [16, 27.5],
        [20, 22],
      ]),
      commsLine(16, 22, 16, 16),
      arrowhead([
        [10.5, 12],
        [16, 16],
        [10.5, 20],
      ]),
      commsLine(4.5, 16, 10.5, 16),
      arrowhead([
        [21.5, 12],
        [16, 16],
        [21.5, 20],
      ]),
      commsLine(27.5, 16, 21.5, 16),
    ],
  }),
  /** Switch: vier gegenläufige Pfeile im Quadrat — Wege, die sich kreuzen, ohne sich zu treffen. */
  defineComms({
    section: 'J.4.2',
    id: 'switch',
    title: 'Switch',
    referenceAsset: 'J.4.2_Switch.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      // Der Körper steht zuerst: er ist weiß gefüllt und würde jede Marke überdecken, die vor
      // ihm in der Liste steht.
      networkBody(),
      arrowhead([
        [11, 7],
        [11, 13],
        [6, 10],
      ]),
      commsLine(11, 10, 19, 10),
      arrowhead([
        [21, 11],
        [21, 17],
        [26, 14],
      ]),
      commsLine(13, 14, 21, 14),
      arrowhead([
        [11, 15],
        [11, 21],
        [6, 18],
      ]),
      commsLine(11, 18, 19, 18),
      arrowhead([
        [21, 19],
        [21, 25],
        [26, 22],
      ]),
      commsLine(13, 22, 21, 22),
    ],
  }),
  /** Server: vier gestapelte Riegel neben einer gefüllten Spitze. */
  defineComms({
    section: 'J.4.3',
    id: 'server',
    title: 'Server',
    referenceAsset: 'J.4.3_Server.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      networkBody(),
      commsRect(7, 7, 9, 3.5, COMMS_BLACK_FILL),
      commsRect(7, 12, 9, 3.5, COMMS_BLACK_FILL),
      commsRect(7, 17, 9, 3.5, COMMS_BLACK_FILL),
      commsRect(7, 22, 9, 3.5, COMMS_BLACK_FILL),
      arrowhead([
        [18, 6],
        [26, 16],
        [18, 26],
      ]),
    ],
  }),
  /** Access Point: drei aufsteigende Bögen über einem gefüllten Punkt. */
  defineComms({
    section: 'J.4.4',
    id: 'access-point',
    title: 'Access Point',
    referenceAsset: 'J.4.4_Access Point.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      networkBody(),
      commsPath('M 7 12 C 11 7 21 7 25 12'),
      commsPath('M 9.5 16 C 12.5 12.5 19.5 12.5 22.5 16'),
      commsPath('M 12 19.5 C 14 17.5 18 17.5 20 19.5'),
      commsCircle(16, 23, 2, COMMS_BLACK_FILL),
    ],
  }),
  /**
   * WAN: eine Wolke. Der einzige Körper des Anhangs, der weder Quadrat noch Kreis ist; sie wird
   * aus fünf Bögen gesetzt, weil das Kommando-Gate `A` nicht zulässt.
   */
  defineComms({
    section: 'J.4.5',
    id: 'wan',
    title: 'WAN',
    referenceAsset: 'J.4.5_WAN.svg',
    box: { xMm: 2, yMm: 6, widthMm: 28, heightMm: 20 },
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      commsPath(
        'M 9 23 C 4 23 2 20 2 16.5 C 2 13 4.5 11 8 11.5 ' +
          'C 9.5 7.5 13 6 16.5 6 C 20 6 23 8 24.5 11 ' +
          'C 28 11 30 14 30 17.5 C 30 21 27 23 24 23 ' +
          'C 22 25 19 25 17 23.5 C 15 25 11 25 9 23 Z',
        COMMS_WHITE_BODY,
      ),
    ],
  }),
  /** Firewall: ein Mauerwerk aus versetzten Ziegeln. */
  defineComms({
    section: 'J.4.6',
    id: 'firewall',
    title: 'Firewall',
    referenceAsset: 'J.4.6_Firewall.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      networkBody(),
      commsLine(4, 10, 28, 10),
      commsLine(4, 16, 28, 16),
      commsLine(4, 22, 28, 22),
      commsLine(10, 4, 10, 10),
      commsLine(20, 4, 20, 10),
      commsLine(15, 10, 15, 16),
      commsLine(25, 10, 25, 16),
      commsLine(10, 16, 10, 22),
      commsLine(20, 16, 20, 22),
      commsLine(15, 22, 15, 28),
      commsLine(25, 22, 25, 28),
    ],
  }),
  /** Drucker: das Gehäuse mit dem ausgeworfenen Blatt als Schräge darüber. */
  defineComms({
    section: 'J.4.7',
    id: 'printer',
    title: 'Drucker',
    referenceAsset: 'J.4.7_Drucker.svg',
    box: NETWORK_BOX,
    contrastPairs: NETWORK_CONTRAST,
    primitives: [
      networkBody(),
      commsRect(7, 13, 18, 11, COMMS_WHITE_BODY),
      commsLine(13, 13, 21, 7),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
