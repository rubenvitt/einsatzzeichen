import { deepFreeze } from '../../readonly-data.js';
import { defineWildfire, type CatalogPictogramDefinition } from '../catalog-definition.js';
import {
  WILDFIRE_BLACK_STROKE,
  WILDFIRE_BLUE_STROKE,
  WILDFIRE_RED_STROKE,
  flame,
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
 */

/**
 * Die Flamme der Dreieckszeichen — in drei Lagen, jede an ihrer Referenzdatei abgenommen. Sie
 * weicht der jeweiligen Zusatzmarke aus, statt sie zu schneiden:
 *
 * - `high` (M.5): gross, oberhalb der Bodenlinie bei y = 23
 * - `low` (M.7): dieselbe Grösse, 4 mm tiefer — über ihr liegt die Erdschicht bei y = 14
 * - `compact` (M.8 bis M.10): kleiner und höher, damit Stamm und Ausbreitungspfeil Platz haben
 *
 * Eine erste Fassung nahm für alle fünf Zeichen dieselbe Lage an. Das Ergebnis bestand jedes
 * Gate und zeigte im Kontaktbogen eine Flamme, durch die eine schwarze Linie lief.
 */
function triangleFlames(lage: 'high' | 'low' | 'compact'): ReturnType<typeof flame> {
  if (lage === 'high') return flame(14.75, 13.2, 20.75, 3.35, 2, WILDFIRE_RED_STROKE);
  if (lage === 'low') return flame(14.75, 17.2, 24.75, 3.35, 2, WILDFIRE_RED_STROKE);
  return flame(13.75, 11.2, 16.75, 2.37, 2, WILDFIRE_RED_STROKE);
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

const TRIANGLE_BOX = { xMm: 1.2, yMm: 3.2, widthMm: 29.6, heightMm: 24.7 } as const;
const SUPPLY_BOX = { xMm: 1.2, yMm: 4.1, widthMm: 29.6, heightMm: 24.7 } as const;
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
      // Der Ankerpunkt selbst: eine Linie, die sich zur Kreiskante hin gabelt — von hier aus
      // wird der Brand aufgerollt.
      wildfireLine(4.25, 16, 19.9, 16, WILDFIRE_BLACK_STROKE),
      wildfireLine(19.9, 16, 25.9, 10, WILDFIRE_BLACK_STROKE),
      wildfireLine(19.9, 16, 25.9, 22, WILDFIRE_BLACK_STROKE),
      // Die Richtung, in die aufgerollt wird.
      wildfireLine(10, 20.25, 10, 23.75, WILDFIRE_BLACK_STROKE),
      wildfireLine(10, 22, 23.35, 22, WILDFIRE_BLACK_STROKE),
      wildfirePolyline(
        [
          [21.7, 20.4],
          [23.35, 22],
          [21.7, 23.6],
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
    box: { xMm: 3.65, yMm: 3.65, widthMm: 24.7, heightMm: 24.7 },
    contrastPairs: PLACE_CONTRAST,
    primitives: [
      wildfirePolyline(
        [
          [16, 3.65],
          [28.35, 16],
          [16, 28.35],
          [3.65, 16],
        ],
        true,
        WILDFIRE_BLACK_STROKE,
      ),
      wildfireLine(10.6, 10, 21.4, 10, WILDFIRE_BLACK_STROKE),
      wildfireLine(21.7, 10.3, 10.2, 21.8, WILDFIRE_BLACK_STROKE),
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
      // Ein Schild — der einzige grüne Bestandteil des ganzen Anhangs.
      wildfirePath(
        'M 10 9.9 V 19.93 C 10 20.68 10.375 21.38 11 21.8 L 16 25.1 L 21 21.8 ' +
          'C 21.63 21.38 22 20.68 22 19.93 V 9.9 L 16 8.87 Z',
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
      // Im Kreis steht die Flamme allein und grösser als in den Dreieckszeichen.
      ...flame(18, 7.5, 23, 7, 1, WILDFIRE_RED_STROKE),
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
    box: { xMm: 1.2, yMm: 3.2, widthMm: 29.6, heightMm: 24.7 },
    contrastPairs: FIRE_CONTRAST,
    primitives: [
      ...wildfireTriangle('rot', 'up'),
      // Das Spotfeuer aus M.4 im Kleinen, in das Warndreieck gesetzt.
      wildfireCircle(16, 18.5, 5.5, WILDFIRE_RED_STROKE),
      ...flame(17.5, 15, 21.5, 3.2, 1, WILDFIRE_RED_STROKE),
      // Das Ausrufezeichen steht ausserhalb des Dreiecks — die akute Gefahr gilt der Lage,
      // nicht dem Zeichen.
      wildfireLine(3, 12.5, 3, 20, wildfireStroke('rot')),
      wildfireCircle(3, 23, 0.9, { fill: 'rot', stroke: 'none' }),
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
      wildfireLine(13, 25, 21.8, 16.2, WILDFIRE_BLACK_STROKE),
      wildfirePolyline(
        [
          [19.2, 16],
          [22, 16],
          [22, 18.8],
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
      wildfireLine(21.8, 16.2, 13, 25, WILDFIRE_BLACK_STROKE),
      wildfirePolyline(
        [
          [15.8, 25],
          [13, 25],
          [13, 22.2],
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
      ...waterSupply(8.5, 19, 24.4, 13.5, 7, 25, WILDFIRE_BLACK_STROKE),
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
      // Der Abwurf: eine Linie mit Spitze nach links und ein Doppelkeil als Luftfahrzeugmarke.
      wildfireLine(7, 10.5, 19.5, 10.5, WILDFIRE_BLUE_STROKE),
      wildfireLine(19.5, 10.5, 23, 7.5, WILDFIRE_BLUE_STROKE),
      wildfireLine(19.5, 10.5, 23, 13.5, WILDFIRE_BLUE_STROKE),
      wildfirePolyline(
        [
          [9.5, 8.2],
          [7, 10.5],
          [9.5, 12.8],
        ],
        false,
        WILDFIRE_BLUE_STROKE,
      ),
      wildfirePolyline(
        [
          [11, 15],
          [16, 17.4],
          [11, 19.8],
        ],
        true,
        { fill: 'hellblau', stroke: 'none' },
      ),
      wildfirePolyline(
        [
          [21, 15],
          [16, 17.4],
          [21, 19.8],
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
      ...waterSupply(11.5, 15, 23.6, 9.5, 7, 25, WILDFIRE_BLUE_STROKE),
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
      ...waterSupply(10.5, 13, 22.6, 8, 7, 25, WILDFIRE_BLUE_STROKE),
      // Das Fahrzeug: derselbe Förderweg wie M.13, nur zusätzlich mit einem Körper darunter.
      wildfireRect(13, 18, 6, 3.5, WILDFIRE_BLUE_STROKE),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
