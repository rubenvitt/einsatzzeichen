import { deepFreeze } from '../../readonly-data.js';
import type { Primitive } from '@einsatzzeichen/schema';
import { defineWildfire, type CatalogPictogramDefinition } from '../catalog-definition.js';
import {
  WILDFIRE_BLACK_STROKE,
  WILDFIRE_BLUE_STROKE,
  WILDFIRE_RED_STROKE,
  flames,
  waterSupply,
  wildfireCircle,
  wildfireContrast,
  wildfireDisc,
  wildfireLine,
  wildfirePath,
  wildfirePolyline,
  wildfireRect,
  wildfireStroke,
  wildfireTriangle,
} from './authoring.js';

/**
 * Anhang M — Vegetationsbrand. Vierzehn Zeichen, und anders als K und L ist dieser Anhang
 * **farbig codiert**. Die Trägerform sagt, worum es geht, die Farbe verstärkt es:
 *
 * - **schwarzer Kreis** — ein Ort in der Einsatzstelle (M.1 Ankerpunkt, M.11 Entnahmestelle)
 * - **schwarze Raute** — ein Posten (M.2 Lookout)
 * - **grüner Kreis** — ein sicherer Ort (M.3 Safetyzone)
 * - **roter Kreis, rotes Dreieck mit der Spitze nach oben** — ein Brandereignis (M.4 bis M.10)
 * - **blaues Dreieck mit der Spitze nach unten** — eine Maßnahme (M.12 bis M.14)
 *
 * Innerhalb der Brandzeichen unterscheidet die **Zusatzmarke** die Brandart, und ihre Lage ist
 * die Aussage: ein Strich unter der Flamme ist der Boden (M.5), derselbe Strich über ihr ist die
 * Erdschicht, unter der es brennt (M.7), ein senkrechter Strich daneben ist der Stamm, an dem
 * das Feuer in die Wipfel steigt (M.8). M.9 und M.10 tragen statt eines Strichs einen Pfeil:
 * die Richtung, in die sich der Brand ausbreitet.
 *
 * Alle Zusatzmarken sind **schwarz**, nicht rot — sie beschreiben das Gelände, nicht das Feuer.
 *
 * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: Koordinaten sind die
 * Mittellinien der 0,5 mm starken Referenzumrisse.
 */

/**
 * Die Doppelflamme der Dreieckszeichen — in drei Lagen, jede an ihrer Referenzdatei abgenommen.
 * Sie weicht der jeweiligen Zusatzmarke aus, statt sie zu schneiden:
 *
 * - `high` (M.5): zwei Flammen 4 × 9 mm ab 11/21, oberhalb der Bodenlinie bei y = 23
 * - `low` (M.7): dieselben 4 mm tiefer (ab 11/25) — über ihnen liegt die Erdschicht bei y = 14
 * - `compact` (M.8 bis M.10): zwei Flammen 3 × 7 mm ab 11/17, damit Stamm und
 *   Ausbreitungspfeil Platz haben
 */
function triangleFlames(lage: 'high' | 'low' | 'compact'): Primitive[] {
  if (lage === 'high') return flames(11, 21, 4, 9, 2, WILDFIRE_RED_STROKE);
  if (lage === 'low') return flames(11, 25, 4, 9, 2, WILDFIRE_RED_STROKE);
  return flames(11, 17, 3, 7, 2, WILDFIRE_RED_STROKE);
}

const FIRE_CONTRAST = wildfireContrast('rot', 'Rote Brandmarke');
const SUPPLY_CONTRAST = wildfireContrast('hellblau', 'Blaue Maßnahmenmarke');
const PLACE_CONTRAST = wildfireContrast('schwarz', 'Schwarze Ortsmarke');

/** Brandzeichen tragen zusätzlich eine schwarze Geländemarke auf der weissen Innenfläche. */
const FIRE_WITH_TERRAIN_CONTRAST = [
  ...FIRE_CONTRAST,
  {
    foreground: 'schwarz',
    background: 'weiss',
    context: 'Schwarze Geländemarke auf weisser Innenfläche',
  },
] as const;

const TRIANGLE_BOX = { xMm: 1, yMm: 3, widthMm: 30, heightMm: 25 } as const;
const SUPPLY_BOX = { xMm: 1, yMm: 4, widthMm: 30, heightMm: 25 } as const;
const DISC_BOX = { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 } as const;

export const WILDFIRE_PICTOGRAMS = deepFreeze([
  defineWildfire({
    section: 'M.1',
    id: 'anchor-point',
    title: 'Ankerpunkt',
    referenceAsset: 'M.1_Ankerpunkt.svg',
    box: DISC_BOX,
    contrastPairs: PLACE_CONTRAST,
    primitives: [
      ...wildfireDisc('schwarz'),
      // Der Ankerpunkt: die Mittelachse von Kreiskante zu Kreiskante, bei 20/16 zusätzlich unter
      // 45° zur Kreiskante hin gegabelt — von hier aus wird der Brand aufgerollt.
      wildfireLine(4, 16, 28, 16, WILDFIRE_BLACK_STROKE),
      wildfireLine(20, 16, 26.25, 9.75, WILDFIRE_BLACK_STROKE),
      wildfireLine(20, 16, 26.25, 22.25, WILDFIRE_BLACK_STROKE),
      // Die Richtung, in die aufgerollt wird: ein Pfeil auf y = 22 mit Anschlagstrich bei x = 10.
      wildfireLine(10, 20, 10, 24, WILDFIRE_BLACK_STROKE),
      wildfireLine(10, 22, 22.6, 22, WILDFIRE_BLACK_STROKE),
      wildfirePolyline(
        [
          [21, 20],
          [23, 22],
          [21, 24],
        ],
        false,
        WILDFIRE_BLACK_STROKE,
      ),
    ],
  }),
  defineWildfire({
    section: 'M.2',
    id: 'lookout',
    title: 'Lookout',
    referenceAsset: 'M.2_Lookout.svg',
    box: { xMm: 4, yMm: 4, widthMm: 24, heightMm: 24 },
    contrastPairs: PLACE_CONTRAST,
    primitives: [
      // Die Raute: Ecken 12 mm um den Mittelpunkt 16/16.
      wildfirePolyline(
        [
          [16, 4],
          [28, 16],
          [16, 28],
          [4, 16],
        ],
        true,
        WILDFIRE_BLACK_STROKE,
      ),
      // Ein Z von Kante zu Kante: waagerecht auf y = 10, dann die Diagonale x + y = 32.
      wildfireLine(10, 10, 22, 10, WILDFIRE_BLACK_STROKE),
      wildfireLine(22, 10, 10, 22, WILDFIRE_BLACK_STROKE),
    ],
  }),
  defineWildfire({
    section: 'M.3',
    id: 'safety-zone',
    title: 'Safetyzone',
    referenceAsset: 'M.3_Safetyzone.svg',
    box: DISC_BOX,
    contrastPairs: wildfireContrast('gruen', 'Grüne Sicherheitsmarke'),
    primitives: [
      ...wildfireDisc('gruen'),
      // Ein Schild: Seiten bei x = 10 und 22, flacher Giebel mit First 16/9, unten gerundete
      // Ecken, die in die Spitze 16/25 auslaufen.
      wildfirePath(
        'M 10 10 V 19.95 C 10 20.6 10.35 21.2 10.9 21.6 L 16 25 L 21.1 21.6 ' +
          'C 21.65 21.2 22 20.6 22 19.95 V 10 L 16 9 Z',
        wildfireStroke('gruen'),
      ),
    ],
  }),
  defineWildfire({
    section: 'M.4',
    id: 'spot-fire',
    title: 'Spotfeuer',
    referenceAsset: 'M.4_Spotfeuer.svg',
    box: DISC_BOX,
    contrastPairs: FIRE_CONTRAST,
    primitives: [
      ...wildfireDisc('rot'),
      // Im Kreis steht die Flamme allein und grösser als in den Dreieckszeichen: 7 × 16 mm.
      ...flames(11, 23, 7, 16, 1, WILDFIRE_RED_STROKE),
    ],
  }),
  defineWildfire({
    section: 'M.5',
    id: 'ground-fire',
    title: 'Bodenfeuer',
    referenceAsset: 'M.5_Bodenfeuer.svg',
    box: TRIANGLE_BOX,
    contrastPairs: FIRE_WITH_TERRAIN_CONTRAST,
    primitives: [
      ...wildfireTriangle('rot', 'up'),
      ...triangleFlames('high'),
      // Der Boden liegt unter der Flamme: es brennt auf der Oberfläche.
      wildfireLine(8, 23, 24, 23, WILDFIRE_BLACK_STROKE),
    ],
  }),
  defineWildfire({
    section: 'M.6',
    id: 'acute-spot-fire',
    title: 'Akute Gefahr, Spotfeuer',
    referenceAsset: 'M.6_Akute Gefahr_Spotfeuer.svg',
    // Das Ausrufezeichen ragt mit seinem Punkt (x = 0,9 mm) links über das Dreieck hinaus.
    box: { xMm: 0.9, yMm: 3, widthMm: 30.1, heightMm: 25 },
    contrastPairs: FIRE_CONTRAST,
    primitives: [
      ...wildfireTriangle('rot', 'up'),
      // Das Spotfeuer aus M.4 im Kleinen: Kreis (Radius 6,5 mm um 16/18,5) mit Flamme 4 × 9 mm.
      wildfireCircle(16, 18.5, 6.5, WILDFIRE_RED_STROKE),
      ...flames(13.5, 22.5, 4, 9, 1, WILDFIRE_RED_STROKE),
      // Das Ausrufezeichen steht links neben dem Dreieck — die akute Gefahr gilt der Lage,
      // nicht dem Zeichen. Balken 0,8 × 8 mm, Punkt mit 0,6 mm Radius, beide gefüllt.
      wildfireRect(1.1, 10, 0.8, 8, { fill: 'rot', stroke: 'none' }),
      wildfireCircle(1.5, 20.05, 0.6, { fill: 'rot', stroke: 'none' }),
    ],
  }),
  defineWildfire({
    section: 'M.7',
    id: 'peat-ground-fire',
    title: 'Moorbrand, Erdfeuer',
    referenceAsset: 'M.7_Moorbrand_Erdfeuer.svg',
    box: TRIANGLE_BOX,
    contrastPairs: FIRE_WITH_TERRAIN_CONTRAST,
    primitives: [
      ...wildfireTriangle('rot', 'up'),
      ...triangleFlames('low'),
      // Derselbe Strich wie in M.5, nur über der Flamme: es brennt unter der Erdschicht.
      wildfireLine(9.35, 14, 22.6, 14, WILDFIRE_BLACK_STROKE),
    ],
  }),
  defineWildfire({
    section: 'M.8',
    id: 'crown-fire',
    title: 'Wipfelfeuer',
    referenceAsset: 'M.8_Wipfelfeuer.svg',
    box: TRIANGLE_BOX,
    contrastPairs: FIRE_WITH_TERRAIN_CONTRAST,
    primitives: [
      ...wildfireTriangle('rot', 'up'),
      ...triangleFlames('compact'),
      // Der Stamm, an dem das Feuer in die Krone steigt.
      wildfireLine(19, 11, 19, 26, WILDFIRE_BLACK_STROKE),
    ],
  }),
  defineWildfire({
    section: 'M.9',
    id: 'fire-spread-uphill',
    title: 'Brandereignis bergauf',
    referenceAsset: 'M.9_Brandereignis_bergauf.svg',
    box: TRIANGLE_BOX,
    contrastPairs: FIRE_WITH_TERRAIN_CONTRAST,
    primitives: [
      ...wildfireTriangle('rot', 'up'),
      ...triangleFlames('compact'),
      // Der Ausbreitungspfeil unter 45° hangaufwärts, offene Spitze mit 2,83 mm langen Schenkeln.
      wildfireLine(13, 25, 22, 16, WILDFIRE_BLACK_STROKE),
      wildfirePolyline(
        [
          [19.17, 16],
          [22, 16],
          [22, 18.83],
        ],
        false,
        WILDFIRE_BLACK_STROKE,
      ),
    ],
  }),
  defineWildfire({
    section: 'M.10',
    id: 'fire-spread-downhill',
    title: 'Brandereignis bergab',
    referenceAsset: 'M.10_Brandereignis_bergab.svg',
    box: TRIANGLE_BOX,
    contrastPairs: FIRE_WITH_TERRAIN_CONTRAST,
    primitives: [
      ...wildfireTriangle('rot', 'up'),
      ...triangleFlames('compact'),
      // Derselbe Pfeil wie in M.9, umgekehrt: der Brand läuft hangabwärts.
      wildfireLine(22, 16, 13, 25, WILDFIRE_BLACK_STROKE),
      wildfirePolyline(
        [
          [15.83, 25],
          [13, 25],
          [13, 22.17],
        ],
        false,
        WILDFIRE_BLACK_STROKE,
      ),
    ],
  }),
  defineWildfire({
    section: 'M.11',
    id: 'water-extraction-point',
    title: 'Wasserentnahmestelle',
    referenceAsset: 'M.11_Wasserentnahmestelle.svg',
    box: DISC_BOX,
    contrastPairs: PLACE_CONTRAST,
    primitives: [
      ...wildfireDisc('schwarz'),
      // Welle zwischen 11,5 und 14,5 mm, Pfeil auf y = 19 bis zur Spitze bei x = 25.
      ...waterSupply(8.5, 19, 25, 13, 1.5, WILDFIRE_BLACK_STROKE),
    ],
  }),
  defineWildfire({
    section: 'M.12',
    id: 'aerial-firefighting',
    title: 'Maßnahme: Luftgestützte Brandbekämpfung',
    referenceAsset: 'M.12_Maßnahme_Luftgestütze Brandbekämpfung.svg',
    box: SUPPLY_BOX,
    contrastPairs: SUPPLY_CONTRAST,
    primitives: [
      ...wildfireTriangle('hellblau', 'down'),
      // Die Abwurflinie auf y = 9 von 7 bis 25 mm, bei x = 20 unter 45° gegabelt.
      wildfireLine(7, 9, 25, 9, WILDFIRE_BLUE_STROKE),
      wildfireLine(20, 9, 24, 5, WILDFIRE_BLUE_STROKE),
      wildfireLine(20, 9, 24, 13, WILDFIRE_BLUE_STROKE),
      // Ein Doppelkeil als Luftfahrzeugmarke: zwei gefüllte Dreiecke, 5 mm lang und 3 mm hoch,
      // die sich mit den Spitzen in 16/15,5 berühren.
      wildfirePolyline(
        [
          [11, 14],
          [16, 15.5],
          [11, 17],
        ],
        true,
        { fill: 'hellblau', stroke: 'none' },
      ),
      wildfirePolyline(
        [
          [21, 14],
          [16, 15.5],
          [21, 17],
        ],
        true,
        { fill: 'hellblau', stroke: 'none' },
      ),
    ],
  }),
  defineWildfire({
    section: 'M.13',
    id: 'water-supply-operation',
    title: 'Maßnahme: Löschwasserförderung',
    referenceAsset: 'M.13_Maßnahme_Löschwasserförderung.svg',
    box: SUPPLY_BOX,
    contrastPairs: SUPPLY_CONTRAST,
    primitives: [
      ...wildfireTriangle('hellblau', 'down'),
      // Welle zwischen 7 und 10 mm, Pfeil auf y = 15 bis zur Spitze bei x = 22.
      ...waterSupply(11.5, 15, 22, 8.5, 1.5, WILDFIRE_BLUE_STROKE),
    ],
  }),
  defineWildfire({
    section: 'M.14',
    id: 'water-supply-operation-vehicles',
    title: 'Maßnahme: Löschwasserförderung mit Fahrzeugen',
    referenceAsset: 'M.14_Maßnahme_Löschwasserförderung mit Fahrzeugen.svg',
    box: SUPPLY_BOX,
    contrastPairs: SUPPLY_CONTRAST,
    primitives: [
      ...wildfireTriangle('hellblau', 'down'),
      // Flachere Welle (6 bis 8 mm), Pfeil auf y = 12 bis zur Spitze bei x = 23.
      ...waterSupply(10.5, 12, 23, 7, 1, WILDFIRE_BLUE_STROKE),
      // Das Fahrzeug: ein Kasten von 12 bis 20 mm Breite und bis y = 20, dessen Oberkante zur
      // Mitte hin um 0,5 mm durchhängt.
      wildfirePath('M 12 15 Q 16 16 20 15 L 20 20 L 12 20 Z', WILDFIRE_BLUE_STROKE),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
