import type { Point, Primitive, Style } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import {
  defineState,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';

/**
 * 5.8.8 Personenzustände. Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert.
 *
 * Grundform ist die Personenraute mit den Ecken (16 | 3), (29 | 16), (16 | 29), (3 | 16), also
 * 13 mm halbe Diagonale um die Zeichenmitte, mit weißer Fläche (Ebene „Flächige Füllung").
 * Alle Striche 0,5 mm (1,417 pt). Die Strichstärke steht hier ausdrücklich, statt sie aus einem
 * geteilten Helfer zu erben.
 */
const PERSON_STROKE = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: 0.5,
} as const satisfies Style;

const PERSON_DIAMOND_STYLE = {
  fill: 'weiss',
  stroke: 'schwarz',
  strokeWidth: 0.5,
} as const satisfies Style;

const PERSON_FILL = {
  fill: 'schwarz',
  stroke: 'none',
} as const satisfies Style;

const PERSON_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Zustandsmarke auf weißer Personenraute',
  },
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'Personendiamant und Zustandsmarke auf Ausgabeoberfläche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

function personLine(x1: number, y1: number, x2: number, y2: number): Primitive {
  return { type: 'line', role: 'pictogram', x1, y1, x2, y2, style: { ...PERSON_STROKE } };
}

function personPolyline(points: readonly Point[]): Primitive {
  return { type: 'polyline', role: 'pictogram', points, closed: false, style: { ...PERSON_STROKE } };
}

/** Raute um den Mittelpunkt (16 | cy) mit halber Diagonale `half`. */
function diamond(cy: number, half: number): Primitive {
  const points: readonly Point[] = [
    [16, cy - half],
    [16 + half, cy],
    [16, cy + half],
    [16 - half, cy],
  ];
  return {
    type: 'polyline',
    role: 'pictogram',
    points,
    closed: true,
    style: { ...PERSON_DIAMOND_STYLE },
  };
}

/** Standardraute um die Zeichenmitte. */
const personDiamond = (): Primitive => diamond(16, 13);

/** Verletzungsstrich: senkrechte Diagonale der Raute. */
const injuryMark = (): Primitive => personLine(16, 3, 16, 29);

/**
 * Kennbuchstaben in der Projektschrift: Versalhöhe 4,87 mm wie in der Referenz (Schriftgrad
 * 7,1 mm), Grundlinie y = 7 mm, zentriert auf die Mitte des Referenzlaufs. `minRenderPx: 64`,
 * weil 7,1 mm bei 32 px Rendergröße nur 7,1 px effektiv ergeben.
 */
function letters(content: string, centerX: number, box: { xMm: number; widthMm: number }): Primitive {
  return {
    type: 'text',
    role: 'pictogram',
    content,
    x: centerX,
    y: 7,
    sizeMm: 7.1,
    anchor: 'middle',
    baseline: 'alphabetic',
    boxMm: { xMm: box.xMm, yMm: 2, widthMm: box.widthMm, heightMm: 5 },
    minRenderPx: 64,
    style: { ...PERSON_FILL },
  };
}

function filledRect(x: number, y: number, width: number, height: number): Primitive {
  return { type: 'rect', role: 'pictogram', x, y, width, height, style: { ...PERSON_FILL } };
}

/**
 * Römische „II" der Sichtungskategorie. Die Referenz setzt sie als Serifenziffer, die die
 * serifenlose Projektschrift nicht hat; deshalb zwei gezeichnete Ziffern aus gefüllten
 * Rechtecken: Serifen 1,95 × 0,55 mm oben (y = 25,15) und unten (y = 29,45), Stamm 0,75 mm breit.
 * Die zweite Ziffer steht 2,6 mm rechts der ersten.
 */
function romanTwo(): readonly Primitive[] {
  return [0, 2.6].flatMap((dx) => [
    filledRect(round(2.55 + dx), 25.15, 1.95, 0.55),
    filledRect(round(3.15 + dx), 25.7, 0.75, 3.75),
    filledRect(round(2.55 + dx), 29.45, 1.95, 0.55),
  ]);
}

/**
 * Kontaminationszeichen: zwei volle Scheiben r = 1,75 mm in (22,5 | 2) und (30 | 2), dazu zwei
 * sich kreuzende Striche von y = 8 mm (x = 22,5 und 29,5) bis auf den 1,5-mm-Kreis der jeweils
 * gegenüberliegenden Scheibe, dort unter 45° nach innen oben.
 */
function contaminationMark(): readonly Primitive[] {
  const disc = (cx: number): Primitive => ({
    type: 'circle',
    role: 'pictogram',
    cx,
    cy: 2,
    r: 1.75,
    style: { ...PERSON_FILL },
  });
  const inset = 1.5 * Math.SQRT1_2;
  return [
    disc(22.5),
    disc(30),
    personLine(22.5, 8, round(30 - inset), round(2 - inset)),
    personLine(29.5, 8, round(22.5 + inset), round(2 - inset)),
  ];
}

/**
 * Welle über der Wasserraute: Berge bei x = 10 und 22, Tal bei x = 16, 4 mm Hub. Jede innere
 * Halbwelle ist eine kubische Kurve mit waagerechten Tangenten an Berg und Tal (Henkel 3 mm).
 * Die Enden laufen bei x = 5 und 27 auf Talhöhe aus; ihr äußerer Henkel zeigt flach
 * (Steigung 1 : 2) nach innen, der innere ist derselbe wie bei einer vollen Halbwelle.
 */
function wavePath(valleyY: number): string {
  const crestY = valleyY - 4;
  const rise = valleyY - 1;
  return [
    `M 5 ${valleyY}`,
    `C 7 ${rise} 7 ${crestY} 10 ${crestY}`,
    `C 13 ${crestY} 13 ${valleyY} 16 ${valleyY}`,
    `C 19 ${valleyY} 19 ${crestY} 22 ${crestY}`,
    `C 25 ${crestY} 25 ${rise} 27 ${valleyY}`,
  ].join(' ');
}

function wave(valleyY: number): Primitive {
  return { type: 'path', role: 'pictogram', d: wavePath(valleyY), style: { ...PERSON_STROKE } };
}

/**
 * Transportpfeil unter der hochgerückten Raute: Schaft y = 27 mm ab x = 3, Spitze (tipX | 27),
 * Kopfarme 4 mm zurück und 4 mm seitlich.
 */
function transportArrow(tipX: number): readonly Primitive[] {
  return [
    personLine(3, 27, 30, 27),
    personPolyline([
      [round(tipX - 4), 23],
      [tipX, 27],
      [round(tipX - 4), 31],
    ]),
  ];
}

/** Hochgerückte Raute der Transportzeichen: Mittelpunkt (16 | 14). */
const transportDiamond = (): Primitive => diamond(14, 13);

export const PERSON_STATES = deepFreeze([
  defineState({
    section: '5.8.8.1',
    id: 'person-uninjured',
    title: 'Person unverletzt',
    referenceAsset: '5.8.8.1_Person Unverletz.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [personDiamond()],
  }),
  defineState({
    section: '5.8.8.2',
    id: 'person-affected',
    title: 'Person betroffen',
    referenceAsset: '5.8.8.2_Person Betroffen.svg',
    box: { xMm: 3, yMm: 2, widthMm: 26.5, heightMm: 27 },
    contrastPairs: PERSON_CONTRAST,
    // „B" rechts oben, Mitte des Referenzbuchstabens x = 27,1 mm.
    primitives: [personDiamond(), letters('B', 27.1, { xMm: 25, widthMm: 4.5 })],
  }),
  defineState({
    section: '5.8.8.3',
    id: 'person-injured',
    title: 'Person verletzt',
    referenceAsset: '5.8.8.3_Person Verletzt.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [personDiamond(), injuryMark()],
  }),
  defineState({
    section: '5.8.8.4',
    id: 'person-injured-triage-category',
    title: 'Person verletzt - Sichtungskategorie',
    referenceAsset: '5.8.8.4_Person Verletzt_Sichtungskategorie.svg',
    box: { xMm: 2.55, yMm: 3, widthMm: 26.45, heightMm: 27 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [personDiamond(), injuryMark(), ...romanTwo()],
  }),
  defineState({
    section: '5.8.8.5',
    id: 'person-injured-transport-priority',
    title: 'Person verletzt - Transportpriorität',
    referenceAsset: '5.8.8.5_Person Verletzt_Transportpriorität.svg',
    box: { xMm: 3, yMm: 2, widthMm: 27.5, heightMm: 27 },
    contrastPairs: PERSON_CONTRAST,
    // „TP" rechts oben, Mitte des Referenzlaufs x = 26 mm.
    primitives: [personDiamond(), injuryMark(), letters('TP', 26, { xMm: 21, widthMm: 9.5 })],
  }),
  defineState({
    section: '5.8.8.6',
    id: 'person-contaminated',
    title: 'Person kontaminiert',
    referenceAsset: '5.8.8.6_Person Kontaminiert.svg',
    box: { xMm: 3, yMm: 0.25, widthMm: 28.75, heightMm: 28.75 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [personDiamond(), injuryMark(), ...contaminationMark()],
  }),
  defineState({
    section: '5.8.8.6',
    id: 'person-contaminated',
    variant: 'alternative',
    title: 'Person kontaminiert',
    referenceAsset: '5.8.8.6_Person Kontaminiert_Alternative.svg',
    box: { xMm: 3, yMm: 2, widthMm: 27, heightMm: 27 },
    contrastPairs: PERSON_CONTRAST,
    // „K" rechts oben, Mitte des Referenzbuchstabens x = 27,3 mm.
    primitives: [personDiamond(), injuryMark(), letters('K', 27.3, { xMm: 25, widthMm: 5 })],
  }),
  defineState({
    section: '5.8.8.7',
    id: 'person-dead',
    title: 'Person tot',
    referenceAsset: '5.8.8.7_Person Tot.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: PERSON_CONTRAST,
    // Querbalken y = 10 mm von Rautenkante zu Rautenkante (x = 10 … 22).
    primitives: [personDiamond(), injuryMark(), personLine(10, 10, 22, 10)],
  }),
  defineState({
    section: '5.8.8.8',
    id: 'person-missing',
    title: 'Person vermisst',
    referenceAsset: '5.8.8.8_Person Vermisst.svg',
    box: { xMm: 1, yMm: 1, widthMm: 30, heightMm: 30 },
    contrastPairs: PERSON_CONTRAST,
    // Zwei Striche parallel zur linken oberen und rechten unteren Rautenkante, 2 mm außerhalb.
    primitives: [personDiamond(), personLine(1, 14, 14, 1), personLine(18, 31, 31, 18)],
  }),
  defineState({
    section: '5.8.8.9',
    id: 'person-in-water-danger',
    title: 'Person in Wassergefahr',
    referenceAsset: '5.8.8.9_Person in Wassergefahr.svg',
    box: { xMm: 5, yMm: 1, widthMm: 22, heightMm: 30 },
    contrastPairs: PERSON_CONTRAST,
    // Kleinere Raute (halbe Diagonale 10,5 mm) um (16 | 20,5), darüber zwei Wellen im Abstand
    // von 3 mm (Täler y = 5 und 8 mm).
    primitives: [diamond(20.5, 10.5), wave(5), wave(8)],
  }),
  defineState({
    section: '5.8.8.10',
    id: 'person-in-distress',
    title: 'Person in Zwangslage',
    referenceAsset: '5.8.8.10_Person in Zwangslage.svg',
    box: { xMm: 2, yMm: 3, widthMm: 28, heightMm: 26 },
    contrastPairs: PERSON_CONTRAST,
    // Waagerechter Strich durch die obere Rautenspitze, x = 2 … 30 mm.
    primitives: [personDiamond(), personLine(2, 3, 30, 3)],
  }),
  defineState({
    section: '5.8.8.11',
    id: 'person-rescued',
    title: 'Person gerettet',
    referenceAsset: '5.8.8.11_Person gerettet.svg',
    box: { xMm: 2, yMm: 3, widthMm: 28, heightMm: 26 },
    contrastPairs: PERSON_CONTRAST,
    // Waagerechter Strich durch die untere Rautenspitze, x = 2 … 30 mm.
    primitives: [personDiamond(), personLine(2, 29, 30, 29)],
  }),
  defineState({
    section: '5.8.8.12',
    id: 'person-to-be-transported',
    title: 'Person zu transportieren',
    referenceAsset: '5.8.8.12_Person zu transportieren.svg',
    box: { xMm: 3, yMm: 1, widthMm: 27, heightMm: 30 },
    contrastPairs: PERSON_CONTRAST,
    // Transportpfeil mit Startbalken bei x = 3 (y = 23 … 31 mm).
    primitives: [transportDiamond(), ...transportArrow(30), personLine(3, 23, 3, 31)],
  }),
  defineState({
    section: '5.8.8.13',
    id: 'person-in-transport',
    title: 'Transport einer Person',
    referenceAsset: '5.8.8.13_Transport einer Person.svg',
    box: { xMm: 3, yMm: 1, widthMm: 27, heightMm: 30 },
    contrastPairs: PERSON_CONTRAST,
    primitives: [transportDiamond(), ...transportArrow(30)],
  }),
  defineState({
    section: '5.8.8.14',
    id: 'person-transported',
    title: 'Person transportiert',
    referenceAsset: '5.8.8.14_Person transportiert.svg',
    box: { xMm: 3, yMm: 1, widthMm: 27, heightMm: 30 },
    contrastPairs: PERSON_CONTRAST,
    // Pfeilspitze 0,1 mm vor dem Zielbalken bei x = 30 (y = 23 … 31 mm).
    primitives: [transportDiamond(), ...transportArrow(29.9), personLine(30, 23, 30, 31)],
  }),
  defineState({
    section: '5.8.8.15',
    id: 'person-needing-special-care',
    title: 'Person besonders betreuungsbedürftig',
    referenceAsset: '5.8.8.15_Person besonders betreuungsbedürftig.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: PERSON_CONTRAST,
    // Zwei Striche von der oberen Rautenspitze nach (5 | 29) und (27 | 29).
    primitives: [personDiamond(), personLine(16, 3, 5, 29), personLine(16, 3, 27, 29)],
  }),
  defineState({
    section: '5.8.8.16',
    id: 'person-care-dependent',
    title: 'Person pflegebedürftig',
    referenceAsset: '5.8.8.16_Person pflegebedürftig.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: PERSON_CONTRAST,
    // Senkrechter Balken durch die linke Rautenspitze, y = 10 … 22 mm.
    primitives: [personDiamond(), personLine(3, 10, 3, 22)],
  }),
  defineState({
    section: '5.8.8.17',
    id: 'person-mobility-impaired',
    title: 'Person mobilitätseingeschränkt',
    referenceAsset: '5.8.8.17_Person mobilitätseingeschränkt.svg',
    box: { xMm: 3, yMm: 3, widthMm: 26, heightMm: 26 },
    contrastPairs: PERSON_CONTRAST,
    // Zwei Räder r = 2 mm in (7 | 27) und (25 | 27).
    primitives: [
      personDiamond(),
      { type: 'circle', role: 'pictogram', cx: 7, cy: 27, r: 2, style: { ...PERSON_STROKE } },
      { type: 'circle', role: 'pictogram', cx: 25, cy: 27, r: 2, style: { ...PERSON_STROKE } },
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
