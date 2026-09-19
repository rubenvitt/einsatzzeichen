import type {
  PrimitiveHeadShape,
  TechnicalHeadMarkId,
} from '@einsatzzeichen/schema';
import { deepFreeze, type DeepReadonly } from './readonly-data.js';

const SINGLE_VERTICAL_BAR: DeepReadonly<PrimitiveHeadShape> = deepFreeze({
  heightMm: 4,
  primitives: [{
    type: 'rect',
    role: 'head',
    x: 15.25,
    y: 0,
    width: 1.5,
    height: 4,
    style: { fill: 'schwarz', stroke: 'none' },
  }],
});

/**
 * Zwei senkrechte Balken 1,5 × 4 mm mit den Mittelachsen x 12 und 20 mm. Maße an der Referenz
 * abgelesen, Geometrie eigenständig konstruiert: E.1.31 („System Bereitstellungsraum 500") führt
 * die Balken bei x 11,25…12,75 und 19,25…20,75 mm, y 1…5 mm; dieselben Balken stehen in F.1.1 und
 * F.1.3. Die Kopfzone ist wie bei `single-vertical-bar` 4 mm hoch und schließt 1 mm über dem
 * Formationskörper ab. Die Marke trägt bewusst keinen Stärkebegriff (siehe `strengths.ts`).
 */
const DOUBLE_VERTICAL_BAR: DeepReadonly<PrimitiveHeadShape> = deepFreeze({
  heightMm: 4,
  primitives: [11.25, 19.25].map((x) => ({
    type: 'rect' as const,
    role: 'head' as const,
    x,
    y: 0,
    width: 1.5,
    height: 4,
    style: { fill: 'schwarz' as const, stroke: 'none' as const },
  })),
});

/** Totaler Resolver der separat vermessenen technischen Kopfmarken. */
export function technicalHeadMark(id: TechnicalHeadMarkId): PrimitiveHeadShape {
  switch (id) {
    case 'single-vertical-bar':
      return SINGLE_VERTICAL_BAR;
    case 'double-vertical-bar':
      return DOUBLE_VERTICAL_BAR;
    default:
      throw new Error(`Unbekannte technische Kopfmarke: ${String(id)}`);
  }
}
