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
  CONNECTION_CONTRAST,
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

/**
 * Das große „C" der beiden Fernsprechvermittlungen. Ein einzelner Großbuchstabe verträgt mehr
 * Schriftgrad als ein Kürzel — 14 mm füllen die Fläche unter dem Überstrich, wie in der Referenz.
 */
function exchangeLabel() {
  return commsText('C', {
    x: 16,
    y: 22,
    sizeMm: 14,
    boxMm: { xMm: 9, yMm: 11, widthMm: 14, heightMm: 11 },
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
  /**
   * Vierstelliges Kürzel: „APRT" braucht bei 10 mm mehr Breite, als der Körper hergibt. 8,5 mm
   * halten es innerhalb und tragen bei 32 px noch 8,5 px effektiv — knapp über
   * `MINIMUM_TEXT_RENDER_PX`, aber über der Schwelle.
   */
  defineComms({
    section: 'J.3.9',
    id: 'active-paging-radio-terminal',
    title: 'Active Paging Radio Terminal',
    referenceAsset: 'J.3.9_Active Paging Radio Terminal.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      commsText('APRT', {
        x: 16,
        y: 19.5,
        sizeMm: 8.5,
        // 23 mm statt 22: die Rasterprüfung in text-ink.test.ts meldete bei 22 zehn Pixel
        // außerhalb. Vier Zeichen brauchen fast die volle Körperbreite.
        boxMm: { xMm: 4.5, yMm: 12.5, widthMm: 23, heightMm: 8.5 },
        minRenderPx: 32,
      }),
    ],
  }),
  /** Antenne: Mast mit zwei nach oben gespreizten Schrägen. Kein Körper, kein Kürzel. */
  defineComms({
    section: 'J.3.10',
    id: 'antenna',
    title: 'Antenne',
    referenceAsset: 'J.3.10_Antenne.svg',
    box: { xMm: 6, yMm: 2, widthMm: 20, heightMm: 28 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [commsLine(16, 2, 16, 30), commsLine(16, 12, 6, 2), commsLine(16, 12, 26, 2)],
  }),
  /** Kabelbau: Mast mit einer nach oben offenen Schale. Der Bogen ist mit C gesetzt, nicht mit A. */
  defineComms({
    section: 'J.3.11',
    id: 'cable-construction',
    title: 'Kabelbau',
    referenceAsset: 'J.3.11_Kabelbau.svg',
    box: { xMm: 7, yMm: 2, widthMm: 18, heightMm: 28 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [commsPath('M 7 2 C 7 14 25 14 25 2'), commsLine(16, 11, 16, 30)],
  }),
  /** Funk: eine waagerechte Zickzacklinie ohne Körper. */
  defineComms({
    section: 'J.3.12',
    id: 'radio',
    title: 'Funk',
    referenceAsset: 'J.3.12_Funk.svg',
    box: { xMm: 2, yMm: 12, widthMm: 27, heightMm: 8 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsPolyline([
        [2, 12],
        [6.5, 20],
        [11, 12],
        [15.5, 20],
        [20, 12],
        [24.5, 20],
        [29, 12],
      ]),
    ],
  }),
  /**
   * Übergänge: ein liegendes Rechteck mit Diagonale — dieselbe Teilungsgeste wie im Gateway
   * J.3.4, hier ohne Kürzel, weil kein Betriebsartenpaar benannt wird.
   */
  defineComms({
    section: 'J.3.13',
    id: 'transitions',
    title: 'Übergänge',
    referenceAsset: 'J.3.13_Übergänge.svg',
    box: { xMm: 2, yMm: 6, widthMm: 28, heightMm: 20 },
    contrastPairs: DEVICE_CONTRAST,
    primitives: [commsRect(2, 6, 28, 20, COMMS_WHITE_BODY), commsLine(30, 6, 2, 26)],
  }),
  /**
   * Fernsprechvermittlung: ein großes „C" unter einem waagerechten Überstrich. Der Überstrich
   * liegt in der Referenz **außerhalb** der Typografiegruppe und ist deshalb eigene Geometrie —
   * eine Linie, kein Makron der Glyphe.
   */
  defineComms({
    section: 'J.3.14',
    id: 'telephone-exchange',
    title: 'Fernsprechvermittlung',
    referenceAsset: 'J.3.14_Fernsprechvermittlung.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [deviceBody(), commsLine(11, 10, 21, 10), exchangeLabel()],
  }),
  /**
   * Dieselbe Vermittlung als VoIP. Ohne das Wort unten links wäre dieses Zeichen von J.3.14 nicht
   * zu unterscheiden — die Referenzgeometrien sind bis auf Rundungsstellen identisch. Deshalb
   * trägt es zwei Läufe mit sehr verschiedenen Einsatzgrenzen: 32 px für das „C", 64 px für das
   * kleine „VoIP".
   */
  defineComms({
    section: 'J.3.15',
    id: 'telephone-exchange-voip',
    title: 'Fernsprechvermittlung VoIP',
    referenceAsset: 'J.3.15_Fernsprechvermittlung VoIP.svg',
    box: DEVICE_BOX,
    contrastPairs: DEVICE_CONTRAST,
    primitives: [
      deviceBody(),
      commsLine(11, 10, 21, 10),
      exchangeLabel(),
      commsText('VoIP', {
        x: 6,
        y: 26.5,
        sizeMm: 5,
        anchor: 'start',
        boxMm: { xMm: 5.5, yMm: 22.5, widthMm: 12, heightMm: 5 },
        minRenderPx: 64,
      }),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
