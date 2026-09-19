import { DEFAULT_STROKE_WIDTH_MM } from '@einsatzzeichen/schema';
import { deepFreeze } from '../../readonly-data.js';
import { defineCapability } from '../catalog-definition.js';

export const INFORMATION_COMMUNICATIONS_CAPABILITIES = deepFreeze([
  defineCapability({
    section: '4.9.1',
    id: 'information-communications',
    title: 'Information und Kommunikation / Fernmeldewesen',
    referenceAsset: '4.9.1_Information und Kommunikation Fernmeldewesen.svg',
    box: { xMm: 2, yMm: 10, widthMm: 28, heightMm: 12 },
    primitives: [{
      // Blitzpfeil, Maße an der Referenz abgelesen, Geometrie eigenständig konstruiert: zwei
      // parallele Schrägen mit Steigung 10 : 14, verbunden durch einen 8 mm langen Senkrechten
      // bei x 16. Ein Strich von 0,5 mm.
      type: 'polyline',
      role: 'pictogram',
      points: [[2, 10], [16, 20], [16, 12], [30, 22]],
      style: { stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM, fill: 'none' },
    }],
  }),
] as const);
