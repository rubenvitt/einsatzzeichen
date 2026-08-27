import {
  type Point,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';
import {
  defineWaterRescuePersonnel,
  type CatalogPictogramDefinition,
  type PictogramContrastPair,
} from '../catalog-definition.js';

const BLACK_FILL = Object.freeze({
  fill: 'schwarz',
  stroke: 'none',
} satisfies Style);

const WATER_RESCUE_CONTRAST = [
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'schwarze Führungs-, Wasser- und Innengeometrie auf dem weissen Rautenfeld',
  },
  {
    foreground: 'schwarz',
    background: 'surface',
    context: 'schwarze Aussenkontur und Kopfmarke auf der Ausgabeoberflaeche',
  },
] as const satisfies readonly [PictogramContrastPair, ...PictogramContrastPair[]];

const STANDARD_FIELD = [
  [16, 4.624547],
  [29.353824, 17.978],
  [16, 31.331489],
  [2.646529, 17.978],
] as const satisfies readonly Point[];

const ADVISOR_FIELD = [
  [16, 2.624304],
  [29.353471, 16],
  [16, 29.331599],
  [2.646529, 16],
] as const satisfies readonly Point[];

const STANDARD_CAP =
  'M 2.646529 17.978 L 16 4.624547 L 29.353824 17.978 L 16 31.331489 Z ' +
  'M 3.354 17.978 L 11.332 10 L 20.668 10 L 28.646 17.978 L 16 30.624 Z';

const ADVISOR_CAP =
  'M 2.646529 16 L 16 2.624304 L 29.353471 16 L 16 29.331599 Z ' +
  'M 16 3.332 L 20.418 7.75 L 20.918 8.25 L 28.646 16 L 16 28.624 ' +
  'L 3.354 16 L 11.081 8.25 L 11.582 7.75 Z';

/** Auf 32 mm skalierter, geschlossener 0,5-mm-Wellenpfad der Quelle. */
function sourceWave(startY: number): string {
  const y = (offset: number): number => Number((startY + offset).toFixed(3));
  return `M 13.177 ${y(0)} ` +
    `C 12.922 ${y(0.255)} 12.603 ${y(0.573)} 12 ${y(0.573)} ` +
    `V ${y(0.073)} ` +
    `C 12.397 ${y(0.073)} 12.585 ${y(-0.115)} 12.824 ${y(-0.354)} ` +
    `C 13.079 ${y(-0.609)} 13.398 ${y(-0.927)} 14.001 ${y(-0.927)} ` +
    `C 14.604 ${y(-0.927)} 14.923 ${y(-0.609)} 15.178 ${y(-0.354)} ` +
    `C 15.416 ${y(-0.115)} 15.605 ${y(0.073)} 16.002 ${y(0.073)} ` +
    `C 16.399 ${y(0.073)} 16.587 ${y(-0.115)} 16.825 ${y(-0.354)} ` +
    `C 17.08 ${y(-0.609)} 17.398 ${y(-0.927)} 18.002 ${y(-0.927)} ` +
    `C 18.606 ${y(-0.927)} 18.923 ${y(-0.609)} 19.178 ${y(-0.353)} ` +
    `C 19.416 ${y(-0.115)} 19.604 ${y(0.074)} 20 ${y(0.074)} ` +
    `V ${y(0.574)} ` +
    `C 19.397 ${y(0.574)} 19.079 ${y(0.256)} 18.824 ${y(0)} ` +
    `C 18.586 ${y(-0.238)} 18.398 ${y(-0.427)} 18.002 ${y(-0.427)} ` +
    `C 17.606 ${y(-0.427)} 17.417 ${y(-0.239)} 17.179 ${y(0)} ` +
    `C 16.924 ${y(0.255)} 16.606 ${y(0.573)} 16.002 ${y(0.573)} ` +
    `C 15.398 ${y(0.573)} 15.08 ${y(0.255)} 14.825 ${y(0)} ` +
    `C 14.587 ${y(-0.239)} 14.398 ${y(-0.427)} 14.001 ${y(-0.427)} ` +
    `C 13.604 ${y(-0.427)} 13.416 ${y(-0.239)} 13.177 ${y(0)} Z`;
}

const STANDARD_WAVES = [
  sourceWave(13.177),
  sourceWave(15.177),
] as const;

const ADVISOR_WAVES = [
  sourceWave(11.177),
  STANDARD_WAVES[0],
] as const;

const STANDARD_INNER =
  'M 16 16.646 L 20.354 21 L 16 25.354 L 11.646 21 Z ' +
  'M 16 17.353 L 19.647 21 L 16 24.647 L 12.353 21 Z';

const ADVISOR_INNER =
  'M 16 14.646 L 20.354 19 L 16 23.354 L 11.646 19 Z ' +
  'M 16 15.353 L 19.647 19 L 16 22.647 L 12.353 19 Z';

/** Ausschliesslich die zwei vermessenen Körperlagen; keine Rollen- oder Staerkeachse. */
function waterRescueBody(advisor: boolean): readonly Primitive[] {
  const field = advisor ? ADVISOR_FIELD : STANDARD_FIELD;
  const cap = advisor ? ADVISOR_CAP : STANDARD_CAP;
  const waves = advisor ? ADVISOR_WAVES : STANDARD_WAVES;
  const inner = advisor ? ADVISOR_INNER : STANDARD_INNER;
  return [
    {
      type: 'polyline', role: 'pictogram', points: field, closed: true,
      style: { fill: 'weiss', stroke: 'none' },
    },
    {
      type: 'path', role: 'pictogram', d: cap,
      style: { ...BLACK_FILL, fillRule: 'evenodd' },
    },
    ...waves.map((d) => ({
      type: 'path' as const, role: 'pictogram' as const, d,
      style: { ...BLACK_FILL },
    })),
    {
      type: 'path', role: 'pictogram', d: inner,
      style: { ...BLACK_FILL, fillRule: 'evenodd' },
    },
  ];
}

function headCircle(cx: number): Primitive {
  return {
    type: 'circle', role: 'pictogram', cx, cy: 2.5, r: 1.5,
    style: { ...BLACK_FILL },
  };
}

export const WATER_RESCUE_PERSONNEL_PICTOGRAMS = [
  defineWaterRescuePersonnel({
    section: 'I.5.4',
    id: 'team-leader',
    title: 'Truppführer Wasserrettungstrupp',
    referenceAsset: 'I.5.4_Truppführer Wasserrettungstrupp.svg',
    box: { xMm: 2.646529, yMm: 1, widthMm: 26.707295, heightMm: 30.331489 },
    primitives: [...waterRescueBody(false), headCircle(16)],
    contrastPairs: WATER_RESCUE_CONTRAST,
  }),
  defineWaterRescuePersonnel({
    section: 'I.5.5',
    id: 'group-leader',
    title: 'Gruppenführer Wasserrettungsgruppe',
    referenceAsset: 'I.5.5_Gruppenführer Wasserrettungsgruppe.svg',
    box: { xMm: 2.646529, yMm: 1, widthMm: 26.707295, heightMm: 30.331489 },
    primitives: [...waterRescueBody(false), headCircle(11), headCircle(21)],
    contrastPairs: WATER_RESCUE_CONTRAST,
  }),
  defineWaterRescuePersonnel({
    section: 'I.5.6',
    id: 'platoon-leader',
    title: 'Zugführer Wasserrettungszug',
    referenceAsset: 'I.5.6_Zugführer Wasserrettungszug.svg',
    box: { xMm: 2.646529, yMm: 1, widthMm: 26.707295, heightMm: 30.331489 },
    primitives: [...waterRescueBody(false), headCircle(11), headCircle(16), headCircle(21)],
    contrastPairs: WATER_RESCUE_CONTRAST,
  }),
  defineWaterRescuePersonnel({
    section: 'I.5.7',
    id: 'formation-leader',
    title: 'Verbandsführer Wasserrettungsverband',
    referenceAsset: 'I.5.7_Verbandsführer Wasserrettungsverband.svg',
    box: { xMm: 2.646529, yMm: 0, widthMm: 26.707295, heightMm: 31.331489 },
    primitives: [
      ...waterRescueBody(false),
      {
        type: 'rect', role: 'pictogram', x: 15.25, y: 0, width: 1.5, height: 4,
        style: { ...BLACK_FILL },
      },
    ],
    contrastPairs: WATER_RESCUE_CONTRAST,
  }),
  defineWaterRescuePersonnel({
    section: 'I.5.8',
    id: 'technical-advisor',
    title: 'Fachberater Wasserrettung',
    referenceAsset: 'I.5.8_Fachberater Wasserrettung.svg',
    box: { xMm: 2.646529, yMm: 2.624304, widthMm: 26.706942, heightMm: 26.707295 },
    primitives: waterRescueBody(true),
    contrastPairs: WATER_RESCUE_CONTRAST,
  }),
] as const satisfies readonly CatalogPictogramDefinition[];
