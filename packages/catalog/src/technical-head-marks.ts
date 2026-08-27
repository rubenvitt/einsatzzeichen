import type {
  PrimitiveHeadShape,
  TechnicalHeadMarkId,
} from '@einsatzzeichen/schema';

const SINGLE_VERTICAL_BAR: PrimitiveHeadShape = {
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
};

/** Totaler Resolver der separat vermessenen technischen Kopfmarken. */
export function technicalHeadMark(id: TechnicalHeadMarkId): PrimitiveHeadShape {
  switch (id) {
    case 'single-vertical-bar':
      return SINGLE_VERTICAL_BAR;
    default:
      throw new Error(`Unbekannte technische Kopfmarke: ${String(id)}`);
  }
}
