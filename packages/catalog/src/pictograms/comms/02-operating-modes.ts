import { deepFreeze } from '../../readonly-data.js';
import { defineComms, type CatalogPictogramDefinition } from '../catalog-definition.js';
import { commsLine, CONNECTION_CONTRAST } from './authoring.js';

/**
 * Beide Zeichen sind eine waagerechte Verbindungslinie mit zwei offenen Pfeilspitzen. Der
 * einzige Bedeutungsunterschied ist die Richtung der Spitzen — geometrisch kodiert, nicht
 * farblich, und deshalb in `accessible-light` wie in `print-monochrome` gleichermaßen lesbar.
 *
 * Referenzbefund (visuell geprüft, nicht aus dem SVG übernommen): In `J.2.1_Wechselverkehr.svg`
 * liegen beide Spitzen an den äußeren Enden der Linie und zeigen nach außen — der Verkehr geht
 * abwechselnd in die eine oder andere Richtung hinaus. In `J.2.2_Gegenverkehr.svg` liegen beide
 * Spitzen weiter innen und zeigen zur Mitte hin aufeinander zu — der Verkehr läuft gleichzeitig
 * aus beiden Richtungen zusammen.
 */
export const OPERATING_MODE_COMMS = deepFreeze([
  defineComms({
    section: 'J.2.1',
    id: 'half-duplex-operation',
    title: 'Wechselverkehr',
    referenceAsset: 'J.2.1_Wechselverkehr.svg',
    box: { xMm: 1, yMm: 12, widthMm: 30, heightMm: 8 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsLine(1, 16, 31, 16),
      commsLine(11, 12, 7, 16),
      commsLine(11, 20, 7, 16),
      commsLine(21, 12, 25, 16),
      commsLine(21, 20, 25, 16),
    ],
  }),
  defineComms({
    section: 'J.2.2',
    id: 'duplex-operation',
    title: 'Gegenverkehr',
    referenceAsset: 'J.2.2_Gegenverkehr.svg',
    box: { xMm: 1, yMm: 12, widthMm: 30, heightMm: 8 },
    contrastPairs: CONNECTION_CONTRAST,
    primitives: [
      commsLine(1, 16, 31, 16),
      commsLine(7, 12, 11, 16),
      commsLine(7, 20, 11, 16),
      commsLine(25, 12, 21, 16),
      commsLine(25, 20, 21, 16),
    ],
  }),
] satisfies readonly CatalogPictogramDefinition[]);
