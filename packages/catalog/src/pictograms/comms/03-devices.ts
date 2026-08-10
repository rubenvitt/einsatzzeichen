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
  commsText,
  COMMS_WHITE_BODY,
} from './authoring.js';

const DEVICE_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Kontur des Gerätekörpers auf der Ausgabeoberfläche',
  },
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Kürzel auf dem Gerätekörper',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

/** Weißes Quadrat mit schwarzer Kontur — gemeinsamer Körper der J.3-Gerätezeichen. */
function deviceBody() {
  return commsRect(4, 4, 24, 24, COMMS_WHITE_BODY);
}

/** Die Hülle des Körpers. Die Kürzel liegen innerhalb und erweitern sie nicht. */
const DEVICE_BOX = { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 } as const;

/**
 * Ein dreistelliges Kürzel mittig im Körper. Grundlinie auf 20 mm: bei 10 mm Schriftgrad steht
 * die Kappenhöhe von Arimo (rund 7,2 mm) damit annähernd mittig in der Fläche 4 … 28.
 *
 * `minRenderPx: 32` folgt aus der Rechnung, nicht aus Geschmack: `10 / 32 * 24` sind 7,5 px
 * effektiver Schriftgrad bei 24 px Rendergröße und damit unter `MINIMUM_TEXT_RENDER_PX`; bei
 * 32 px sind es genau 10 px.
 */
function deviceLabel(content: string) {
  return commsText(content, {
    x: 16,
    y: 20,
    sizeMm: 10,
    boxMm: { xMm: 5, yMm: 12, widthMm: 22, heightMm: 10 },
    minRenderPx: 32,
  });
}

/** Weißer Kreis mit schwarzer Kontur — der Körper der beiden Basisstationen. */
function stationBody(cyMm: number, rMm: number) {
  return commsCircle(16, cyMm, rMm, COMMS_WHITE_BODY);
}

/**
 * Ein kleineres, zweizeilig verteiltes Kürzel: J.3.4 trägt zwei davon in gegenüberliegenden
 * Ecken, J.3.5 eines über seiner Wiederholermarke.
 *
 * `minRenderPx: 64` statt 32: bei 6,5 mm Schriftgrad sind es auf der 32-mm-viewBox nur 6,5 px
 * effektiv bei 32 px Rendergröße — unter `MINIMUM_TEXT_RENDER_PX`. Erst 64 px tragen (13,0 px).
 * Das ist der Grund, warum die Einsatzgrenze am Lauf sitzt und nicht am Zeichen.
 */
function smallLabel(
  content: string,
  xMm: number,
  baselineMm: number,
  boxMm: { xMm: number; yMm: number; widthMm: number; heightMm: number },
) {
  return commsText(content, {
    x: xMm,
    y: baselineMm,
    sizeMm: 6.5,
    boxMm,
    minRenderPx: 64,
  });
}

/**
 * Die Gerätezeichen aus J.3 unterscheiden sich vom Grundzeichen J.3.1 **durch ihr Kürzel**, nicht
 * durch Marken. Entfernt man aus den Referenzen die Glyphen, sind `J.3.6`, `J.3.7` und `J.3.8`
 * geometrisch identisch — dreimal dasselbe leere Quadrat. Ein früherer Anlauf hat hier Marken
 * erfunden und wurde deshalb zurückgerollt; belegt in
 * `docs/decisions/2026-08-09-anhang-j-ist-typografisch.md`.
 */
export const DEVICE_COMMS = deepFreeze([
  defineComms({
    section: 'J.3.1',
    id: 'telecom-device',
    title: 'Fernmeldegerät (Grundzeichen)',
    referenceAsset: 'J.3.1_Fernmeldegerät Grundzeichen.svg',
    box: DEVICE_BOX,
    contrastPairs: [DEVICE_CONTRAST[0]],
    primitives: [deviceBody()],
  }),
  /**
   * Ortsfeste Basisstation: Kreiskörper mit einer Giebelmarke darüber — die Marke steht für den
   * festen Standort und unterscheidet J.3.2 von der mobilen Fassung J.3.3. Die Referenz führt
   * hier **keinen** Quadratkörper wie die übrigen Gerätezeichen.
   */
  defineComms({
    section: 'J.3.2',
    id: 'base-station',
    title: 'Basisstation',
    referenceAsset: 'J.3.2_Basisstation.svg',
    box: { xMm: 3, yMm: 1, widthMm: 26, heightMm: 27.5 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      stationBody(17, 11.5),
      commsPolyline([
        [3, 11],
        [16, 1],
        [29, 11],
      ]),
      commsText('BS', {
        x: 16,
        y: 20.5,
        sizeMm: 10,
        boxMm: { xMm: 7, yMm: 12, widthMm: 18, heightMm: 10 },
        minRenderPx: 32,
      }),
    ],
  }),
  /** Mobile Basisstation: derselbe Kreis ohne Giebelmarke, das Kürzel trägt das kleine m. */
  defineComms({
    section: 'J.3.3',
    id: 'mobile-base-station',
    title: 'Mobile Basisstation',
    referenceAsset: 'J.3.3_Mobile Basisstation.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      stationBody(16, 12),
      commsText('mBS', {
        x: 16,
        y: 19,
        sizeMm: 8,
        boxMm: { xMm: 6, yMm: 12, widthMm: 20, heightMm: 8 },
        minRenderPx: 32,
      }),
    ],
  }),
  /**
   * Gateway: die Diagonale teilt den Körper in zwei Hälften, je eine Betriebsart. Sie ist echte
   * Geometrie der Referenz und keine erfundene Übergangsmarke — die beiden Kürzel benennen, was
   * ineinander übergeht.
   */
  defineComms({
    section: 'J.3.4',
    id: 'gateway',
    title: 'Gateway',
    referenceAsset: 'J.3.4_Gateway.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      commsLine(28, 4, 4, 28),
      smallLabel('TMO', 13, 12.5, { xMm: 5, yMm: 6, widthMm: 16, heightMm: 7 }),
      smallLabel('DMO', 19, 25, { xMm: 11, yMm: 18.5, widthMm: 16, heightMm: 7 }),
    ],
  }),
  /**
   * Repeater: das Kürzel nennt die Betriebsart, die Marke darunter das Wiederholen — ein
   * Zickzack zwischen zwei nach außen offenen Bögen, wie in der Referenz.
   */
  defineComms({
    section: 'J.3.5',
    id: 'repeater',
    title: 'Repeater',
    referenceAsset: 'J.3.5_Repeater.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      smallLabel('DMO', 16, 15, { xMm: 8, yMm: 8.5, widthMm: 16, heightMm: 7 }),
      // Zickzack zwischen zwei nach außen offenen Bögen. Die Bögen sind mit Q gesetzt, weil das
      // Kommando-Gate nur M L H V C Q Z zulässt — A wäre der naheliegende, aber verbotene Weg.
      commsPath('M 9 18 Q 6 21 9 24'),
      commsPolyline([
        [10, 18],
        [13, 24],
        [16, 18],
        [19, 24],
        [22, 18],
      ]),
      commsPath('M 23 18 Q 26 21 23 24'),
    ],
  }),
  defineComms({
    section: 'J.3.6',
    id: 'handheld-radio-terminal',
    title: 'Handheld Radio Terminal',
    referenceAsset: 'J.3.6_Handheld Radio Terminal.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [deviceBody(), deviceLabel('HRT')],
  }),
  defineComms({
    section: 'J.3.7',
    id: 'mobile-radio-terminal',
    title: 'Mobile Radio Terminal',
    referenceAsset: 'J.3.7_Mobile Radio Terminal.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [deviceBody(), deviceLabel('MRT')],
  }),
  defineComms({
    section: 'J.3.8',
    id: 'fixed-radio-terminal',
    title: 'Fixed Radio Terminal',
    referenceAsset: 'J.3.8_Fixed Radio Terminal.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [deviceBody(), deviceLabel('FRT')],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
