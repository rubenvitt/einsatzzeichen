import { deepFreeze } from '../../readonly-data.js';
import { defineComms, type CatalogPictogramDefinition } from '../catalog-definition.js';
import { commsLine, COMMS_REFERENCE_STROKE, CONNECTION_CONTRAST } from './authoring.js';

/**
 * Beide Zeichen sind eine waagerechte Verbindungslinie mit zwei offenen Pfeilspitzen. Der
 * einzige Bedeutungsunterschied ist die Richtung der Spitzen — geometrisch kodiert, nicht
 * farblich, und deshalb in `accessible-light` wie in `print-monochrome` gleichermaßen lesbar.
 *
 * In `J.2.1_Wechselverkehr.svg` liegen beide Spitzen nahe den äußeren Enden der Linie und
 * zeigen nach außen — der Verkehr geht abwechselnd in die eine oder andere Richtung hinaus. In
 * `J.2.2_Gegenverkehr.svg` liegen beide Spitzen weiter innen und zeigen zur Mitte hin aufeinander
 * zu — der Verkehr läuft gleichzeitig aus beiden Richtungen zusammen.
 *
 * Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: Strichstärke 0,5 mm.
 * Die Linie läuft auf y = 16 über die volle Breite; sie endet 0,25 mm vor dem Rand
 * (x = 0,25 … 31,75), weil das Clipping-Gate die halbe Strichstärke zur Box rechnet. Jede
 * Spitze besteht aus zwei Schenkeln unter 45° mit 4 mm Ausladung; die Spitzen liegen bei x = 3
 * und 29 (J.2.1) bzw. bei x = 8 und 24 (J.2.2).
 */

/** Eine offene Pfeilspitze: Spitze auf der Mittellinie, Schenkelenden um `dx` versetzt. */
function arrowHead(tipXMm: number, dx: 4 | -4) {
  return [
    commsLine(tipXMm + dx, 12, tipXMm, 16, COMMS_REFERENCE_STROKE),
    commsLine(tipXMm + dx, 20, tipXMm, 16, COMMS_REFERENCE_STROKE),
  ];
}

const shaft = () => commsLine(0.25, 16, 31.75, 16, COMMS_REFERENCE_STROKE);

export const OPERATING_MODE_COMMS = deepFreeze([
  defineComms({
    section: 'J.2.1',
    id: 'half-duplex-operation',
    title: 'Wechselverkehr',
    referenceAsset: 'J.2.1_Wechselverkehr.svg',
    box: { xMm: 0.25, yMm: 12, widthMm: 31.5, heightMm: 8 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [shaft(), ...arrowHead(3, 4), ...arrowHead(29, -4)],
  }),
  defineComms({
    section: 'J.2.2',
    id: 'duplex-operation',
    title: 'Gegenverkehr',
    referenceAsset: 'J.2.2_Gegenverkehr.svg',
    box: { xMm: 0.25, yMm: 12, widthMm: 31.5, heightMm: 8 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [shaft(), ...arrowHead(8, -4), ...arrowHead(24, 4)],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
