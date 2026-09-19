import { deepFreeze } from '../../readonly-data.js';
import type { CommsId, Primitive } from '@einsatzzeichen/schema';
import { defineComms, type CatalogPictogramDefinition } from '../catalog-definition.js';
import {
  commsLine,
  commsPath,
  commsPolyline,
  commsRect,
  commsText,
  COMMS_REFERENCE_STROKE,
  COMMS_REFERENCE_WHITE_BODY,
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
 * J.1.3 trägt **nur** Balken und Kürzel, keinen Zickzack und keine Bögen. Die Betriebsart
 * ersetzt die Wellenform, sie ergänzt sie nicht.
 *
 * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: Alle Striche sind 0,5 mm
 * stark (1,417 pt in den BABZ-Dateien), alle Koordinaten sind Strichmitten, auf 0,05 mm
 * gerundet. Die Kürzel setzt die Projektschrift Arimo fett, wie die Referenz (siehe `label`).
 */

const stroke = COMMS_REFERENCE_STROKE;

/** Die Verbindung: ein waagerechter Balken, 26 mm breit, mittig (x = 3 … 29). */
function connectionBar(yMm: number, x1Mm = 3, x2Mm = 29) {
  return commsLine(x1Mm, yMm, x2Mm, yMm, stroke);
}

/**
 * Drahtlos: sechs Schrägen im 45°-Winkel zwischen x = 4 und x = 28, Zackenhöhe 4 mm. `topMm`
 * ist die Höhe der Enden und der beiden Innenspitzen, die Täler liegen 4 mm tiefer.
 */
function wirelessZigzag(topMm: number) {
  const bottomMm = topMm + 4;
  return commsPolyline(
    [
      [4, topMm],
      [8, bottomMm],
      [12, topMm],
      [16, bottomMm],
      [20, topMm],
      [24, bottomMm],
      [28, topMm],
    ],
    false,
    stroke,
  );
}

/**
 * Sprechfunk: zwei Halbkreise (r = 4 mm, Mittelpunkte auf x = 3 und x = 29), nach innen
 * gewölbt, dazwischen ein flacherer Zickzack (Täler 4 mm unter den Spitzen, Teilung 19/6 mm).
 * Die Enden des Zickzacks sitzen auf den Halbkreisen. `centerYMm` ist die Mitte der Halbkreise.
 *
 * Halbkreise als zwei kubische Viertelbögen (Henkellänge 0,5523 × r = 2,2 mm), weil das
 * Kommando-Gate keinen Bogenbefehl zulässt und ein `circle` den Vollkreis zeichnen würde.
 */
function radioArcs(centerYMm: number) {
  const top = centerYMm - 4;
  const bottom = centerYMm + 4;
  const peak = centerYMm - 2;
  const valley = centerYMm + 2;
  const endY = centerYMm - 2.3;
  return [
    commsPath(
      `M 3 ${top} C 5.2 ${top} 7 ${centerYMm - 2.2} 7 ${centerYMm} ` +
        `C 7 ${centerYMm + 2.2} 5.2 ${bottom} 3 ${bottom}`,
      stroke,
    ),
    commsPolyline(
      [
        [6.25, endY],
        [9.65, valley],
        [12.85, peak],
        [16, valley],
        [19.15, peak],
        [22.35, valley],
        [25.75, endY],
      ],
      false,
      stroke,
    ),
    commsPath(
      `M 29 ${top} C 26.8 ${top} 25 ${centerYMm - 2.2} 25 ${centerYMm} ` +
        `C 25 ${centerYMm + 2.2} 26.8 ${bottom} 29 ${bottom}`,
      stroke,
    ),
  ];
}

/**
 * Ein Kürzel, fett gesetzt wie in der Referenz. `sizeMm` ist der Schriftgrad; die Box ist die
 * Tintenfläche in Arimo Bold (Versalhöhe = 0,688 × Schriftgrad), mittig um `xMm`; `xMm` ist so
 * gesetzt, dass die Tintenmitte auf der Tintenmitte der Referenz liegt.
 * `minRenderPx: 64` unter 9 mm Schriftgrad, weil solche Läufe bei 32 px Rendergröße unter
 * `MINIMUM_TEXT_RENDER_PX` fallen.
 */
function label(
  content: string,
  xMm: number,
  baselineMm: number,
  sizeMm: number,
  boxWidthMm: number,
) {
  const heightMm = Math.ceil(sizeMm * 0.7 * 10) / 10;
  return commsText(content, {
    x: xMm,
    y: baselineMm,
    sizeMm,
    fontWeight: 700,
    boxMm: {
      xMm: xMm - boxWidthMm / 2,
      yMm: baselineMm - heightMm,
      widthMm: boxWidthMm,
      heightMm,
    },
    minRenderPx: sizeMm < 9 ? 64 : 32,
  });
}

/**
 * Schriftgrade. Die Referenzschrift läuft schmaler als Arimo Bold; jeder Grad liegt deshalb
 * zwischen dem Wert, der die Versalhöhe trifft, und dem, der die Laufbreite trifft:
 *
 * - Kürzel unter dem kurzen Balken (J.1.3/J.1.4): Versalhöhe 4,9 mm → 7,1;
 *   Breite 14,8 mm → 6,65.
 * - Große Betriebsart (J.1.5–J.1.7): Versalhöhe 7,3 mm → 10,6; Breite 22,2 mm → 10,0.
 * - Fax (J.1.9): Versalhöhe 7,3 mm → 10,6; Breite 13,7 mm → 8,3.
 * - SDS im Rahmen: Versalhöhe 4,9 mm → 7,1; Breite 11,2 mm → 5,65.
 */
const SMALL = 6.9;
const LARGE = 10.3;
const FAX = 9.4;
const SDS = 6.4;

/**
 * Die Satellitenschüssel: ein Viertelkreis mit Mittelpunkt (27 | 3) und r = 26 mm von (1 | 3)
 * nach (27 | 29), dazu der Strahl vom Mittelpunkt unter 45° bis an die Schale. Der Viertelkreis
 * ist ein kubischer Bogen mit Henkellänge 0,5523 × r = 14,35 mm. Was übertragen wird, steht
 * rechts daneben.
 */
function satelliteDish() {
  return [
    commsPath('M 1 3 C 1 17.35 12.65 29 27 29', stroke),
    commsLine(27, 3, 8.8, 21.2, stroke),
  ];
}

/**
 * Ein Übertragungspaar: dieselbe Marke einmal mit und einmal ohne Zickzack. Der Zickzack ist der
 * gesamte Unterschied zwischen drahtlos und leitergebunden, und beide Fassungen tragen laut
 * Katalogvertrag denselben Titel — die Variante allein trägt die Unterscheidung. Die
 * leitergebundene Fassung ist in der Referenz nicht nur ohne Zickzack, sondern auch senkrecht
 * neu zentriert; die Marke wird deshalb je Fassung eigens übergeben.
 */
function transmissionPair(
  section: `J.${string}`,
  id: CommsId,
  title: string,
  mark: readonly Primitive[],
  zigzagTopMm: number,
  wiredMark: readonly Primitive[],
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
      primitives: [...mark, wirelessZigzag(zigzagTopMm)],
    }),
    defineComms({
      section,
      id,
      variant: 'alternative',
      title,
      referenceAsset: wiredAsset,
      box: wiredBox,
      contrastPairs: CONNECTION_CONTRAST,
      primitives: [...wiredMark],
    }),
  ];
}

/**
 * Rechteckwelle: waagerecht auf `highMm` bis `xs[1]`, senkrecht hinab auf `lowMm`, waagerecht
 * bis `xs[2]`, wieder hinauf und waagerecht bis `xs[3]`.
 */
function squareWave(xs: readonly [number, number, number, number], highMm: number, lowMm: number) {
  const [x0, x1, x2, x3] = xs;
  return commsPolyline(
    [
      [x0, highMm],
      [x1, highMm],
      [x1, lowMm],
      [x2, lowMm],
      [x2, highMm],
      [x3, highMm],
    ],
    false,
    stroke,
  );
}

/**
 * Livestream-Kamera mit Oberkante `topMm`: Gehäuse 20 × 16 mm (x = 10 … 30), links das Objektiv
 * als Trapez, dessen Schrägen unter 3 : 4 zur Gehäusekante laufen (Öffnung 4 mm am Gehäuse,
 * 16 mm außen bei x = 2).
 */
function camera(topMm: number) {
  return [
    commsRect(10, topMm, 20, 16, stroke),
    commsPolyline(
      [
        [10, topMm + 6],
        [2, topMm],
        [2, topMm + 16],
        [10, topMm + 10],
      ],
      false,
      stroke,
    ),
  ];
}

/** SDS-Rahmen: 14 × 8 mm, oben mittig, weiß gefüllt wie in der Referenz. */
/**
 * Kontrastpaare der SDS-Zeichen: zusätzlich zur Verbindungsmarke steht das Kürzel „SDS“ schwarz
 * auf der weißen Rahmenfläche. Ohne dieses Paar prüfte der Kontrastvertrag die Schrift nicht
 * gegen ihren tatsächlichen Hintergrund.
 */
const SDS_CONTRAST = [
  ...CONNECTION_CONTRAST,
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Kürzel SDS auf der weißen Rahmenfläche',
  },
] as const;

function sdsFrame() {
  return [
    commsRect(9, 6, 14, 8, COMMS_REFERENCE_WHITE_BODY),
    label('SDS', 16, 12.4, SDS, 14),
  ];
}

export const CONNECTION_COMMS = deepFreeze([
  defineComms({
    section: 'J.1.1',
    id: 'voice',
    title: 'Sprache',
    referenceAsset: 'J.1.1_Sprache.svg',
    box: { xMm: 3, yMm: 13, widthMm: 26, heightMm: 8 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(13), wirelessZigzag(17)],
  }),
  defineComms({
    section: 'J.1.1',
    id: 'voice',
    variant: 'alternative',
    title: 'Sprache',
    referenceAsset: 'J.1.1_Sprache_leitergebunden.svg',
    box: { xMm: 3, yMm: 16, widthMm: 26, heightMm: 0 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(16)],
  }),
  defineComms({
    section: 'J.1.2',
    id: 'voice-radio',
    title: 'Sprechfunk',
    referenceAsset: 'J.1.2_Sprechfunk.svg',
    box: { xMm: 3, yMm: 12, widthMm: 26, heightMm: 11 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(12), ...radioArcs(19)],
  }),
  /** DMO/TMO: ein kurzer Balken (16 mm) über dem Kürzel, Grundlinie bei y = 20. */
  defineComms({
    section: 'J.1.3',
    id: 'voice-radio-dmo',
    title: 'Sprechfunk im DMO',
    referenceAsset: 'J.1.3_Sprechfunk im DMO.svg',
    box: { xMm: 7.5, yMm: 13, widthMm: 17, heightMm: 7.5 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(13, 8, 24), label('DMO', 16.05, 20, SMALL, 16)],
  }),
  defineComms({
    section: 'J.1.4',
    id: 'voice-radio-tmo',
    title: 'Sprechfunk im TMO',
    referenceAsset: 'J.1.4_Sprechfunk im TMO.svg',
    box: { xMm: 7.5, yMm: 13, widthMm: 17, heightMm: 7.5 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(13, 8, 24), label('TMO', 16.2, 20, SMALL, 16)],
  }),
  /**
   * SDS trägt keinen Verbindungsbalken, sondern einen Rahmen um das Kürzel — der Kurzdienst ist
   * kein Kanal, sondern eine Nachricht. Die Betriebsart steht darunter, größer (Grundlinie 24).
   */
  defineComms({
    section: 'J.1.5',
    id: 'sds-dmo',
    title: 'SDS im DMO',
    referenceAsset: 'J.1.5_SDS im DMO.svg',
    box: { xMm: 4, yMm: 6, widthMm: 24, heightMm: 18.5 },
    contrastPairs: SDS_CONTRAST,
    primitives: [...sdsFrame(), label('DMO', 16.05, 24, LARGE, 23.5)],
  }),
  defineComms({
    section: 'J.1.6',
    id: 'sds-tmo',
    title: 'SDS im TMO',
    referenceAsset: 'J.1.6_SDS im TMO.svg',
    box: { xMm: 4, yMm: 6, widthMm: 24.5, heightMm: 18.5 },
    contrastPairs: SDS_CONTRAST,
    primitives: [...sdsFrame(), label('TMO', 16.2, 24, LARGE, 23.5)],
  }),
  /**
   * Über Repeater: Balken oben (y = 7), großes Kürzel (Grundlinie 17), darunter die
   * Repeatermarke aus Bögen und Zickzack (Mitte y = 23).
   */
  defineComms({
    section: 'J.1.7',
    id: 'voice-radio-dmo-repeater',
    title: 'Sprechfunk im DMO über Repeater',
    referenceAsset: 'J.1.7_Sprechfunk im DMO_Repeater.svg',
    box: { xMm: 3, yMm: 7, widthMm: 26, heightMm: 20 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [connectionBar(7), label('DMO', 16.05, 17, LARGE, 23.5), ...radioArcs(23)],
  }),
  /**
   * Ab J.1.8 trägt die Marke oben, **was** übertragen wird, und der Zickzack darunter, **dass**
   * es drahtlos geschieht. Die leitergebundene Fassung lässt genau den Zickzack weg — dieselbe
   * Regel wie bei J.1.1, jetzt viermal.
   *
   * Datenübertragung: eine Rechteckwelle. Drahtlos 24 mm breit mit 12 × 11 mm großer Senke,
   * leitergebunden auf 30 mm und eine 16 × 15 mm große Senke gestreckt.
   */
  ...transmissionPair(
    'J.1.8',
    'data-transmission',
    'Datenübertragung',
    [squareWave([4, 10, 22, 28], 8, 19)],
    22,
    [squareWave([1, 8, 24, 31], 8, 23)],
    'J.1.8_Datenübertragung_leitergebunden.svg',
    { xMm: 4, yMm: 8, widthMm: 24, heightMm: 18 },
    { xMm: 1, yMm: 8, widthMm: 30, heightMm: 15 },
  ),
  /** Fax: großes Kürzel, Grundlinie 17 (drahtlos) bzw. 20 (leitergebunden). */
  ...transmissionPair(
    'J.1.9',
    'fax-transmission',
    'Faxübertragung',
    [label('Fax', 16.3, 17, FAX, 16)],
    21,
    [label('Fax', 16.3, 20, FAX, 16)],
    'J.1.9_Faxübertragung_leitergebunden.svg',
    { xMm: 4, yMm: 9.5, widthMm: 24, heightMm: 15.5 },
    { xMm: 7.2, yMm: 12.5, widthMm: 18, heightMm: 7.5 },
  ),
  /** Bild: abgerundetes Rechteck 28 × 18 mm, Eckradius 1 mm, ungefüllt. */
  ...transmissionPair(
    'J.1.10',
    'image-transmission',
    'Bildübertragung',
    [commsRect(2, 4, 28, 18, stroke, 1)],
    25,
    [commsRect(2, 7, 28, 18, stroke, 1)],
    'J.1.10_ Bildübertragung_leitergebunden.svg',
    { xMm: 2, yMm: 4, widthMm: 28, heightMm: 25 },
    { xMm: 2, yMm: 7, widthMm: 28, heightMm: 18 },
  ),
  /** Livestream: Kamera mit Objektiv (siehe `camera`). */
  ...transmissionPair(
    'J.1.11',
    'livestream-transmission',
    'Livestreamübertragung',
    camera(5),
    25,
    camera(8),
    'J.1.11_Livestreamübertragung_leitergebunden.svg',
    { xMm: 2, yMm: 5, widthMm: 28, heightMm: 24 },
    { xMm: 2, yMm: 8, widthMm: 28, heightMm: 16 },
  ),
  /**
   * Satellitenverbindung: die Schüssel als Viertelkreis, der Strahl als Diagonale. Was übertragen
   * wird, steht rechts daneben — eine gerade Linie für Sprache, eine Rechteckwelle für Daten.
   */
  defineComms({
    section: 'J.1.12',
    id: 'satellite-voice',
    title: 'Satellitenverbindung Sprache',
    referenceAsset: 'J.1.12_Satellitenverbindung_Sprache.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 26 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [...satelliteDish(), commsLine(19, 16, 31, 16, stroke)],
  }),
  defineComms({
    section: 'J.1.13',
    id: 'satellite-data',
    title: 'Satellitenverbindung Daten',
    referenceAsset: 'J.1.13_Satellitenverbindung_Daten.svg',
    box: { xMm: 1, yMm: 3, widthMm: 30, heightMm: 26 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      ...satelliteDish(),
      commsPolyline(
        [
          [19, 16],
          [22, 16],
          [22, 22],
          [28, 22],
          [28, 16],
          [31, 16],
        ],
        false,
        stroke,
      ),
    ],
  }),
  /**
   * Richtfunk: zwei gegenüberliegende Schalen, jede ein Bogen von (26 | 8) über den Scheitel
   * (31 | 16) nach (26 | 24) bzw. gespiegelt. Die Schale ist voller als ein Kreisbogen durch
   * diese drei Punkte: am Scheitel senkrechte Henkel von 4 mm, an den Enden Henkel von
   * 3,05 × 1 mm. Von jeder Schale läuft eine 6 mm lange Waagerechte nach innen. Der graue
   * Platzhaltertext „Information" der Referenzdatei steht für den jeweiligen Inhalt und bleibt
   * weg.
   */
  defineComms({
    section: 'J.1.14',
    id: 'directional-radio',
    title: 'Richtfunkverbindung',
    referenceAsset: 'J.1.14_Richtfunkverbindung.svg',
    box: { xMm: 1, yMm: 8, widthMm: 30, heightMm: 16 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsPath('M 6 8 C 2.95 9 1 12 1 16 C 1 20 2.95 23 6 24', stroke),
      commsLine(1, 16, 7, 16, stroke),
      commsPath('M 26 8 C 29.05 9 31 12 31 16 C 31 20 29.05 23 26 24', stroke),
      commsLine(25, 16, 31, 16, stroke),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
