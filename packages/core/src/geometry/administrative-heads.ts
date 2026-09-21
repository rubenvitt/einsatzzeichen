import type {
  AdminLevelId,
  AdministrativeHeadShape,
  Primitive,
} from '@einsatzzeichen/schema';
import { deepFreeze, type DeepReadonly } from './readonly-data.js';

function sixRayStar(cx: number, cy: number): Primitive[] {
  const common = {
    type: 'rect' as const,
    role: 'head' as const,
    style: { fill: 'schwarz' as const, stroke: 'none' as const },
  };
  return [
    { ...common, x: cx - 0.25, y: cy - 2, width: 0.5, height: 4 },
    {
      ...common,
      x: cx - 2,
      y: cy - 0.25,
      width: 4,
      height: 0.5,
      transform: { rotate: { angle: 30, cx, cy } },
    },
    {
      ...common,
      x: cx - 2,
      y: cy - 0.25,
      width: 4,
      height: 0.5,
      transform: { rotate: { angle: -30, cx, cy } },
    },
  ];
}

const KREIS: AdministrativeHeadShape = {
  box: { xMm: 9.143, yMm: 0, widthMm: 13.714, heightMm: 4 },
  heightMm: 4,
  primitives: [11, 21].flatMap((cx) => sixRayStar(cx, 2)),
};

const NATIONALSTAAT: AdministrativeHeadShape = {
  box: { xMm: 4.143, yMm: 0, widthMm: 23.714, heightMm: 4 },
  heightMm: 4,
  primitives: [6, 11, 16, 21, 26].flatMap((cx) => sixRayStar(cx, 2)),
};

const EUROPAEISCHE_UNION: AdministrativeHeadShape = {
  box: { xMm: 7.143, yMm: 0, widthMm: 17.714, heightMm: 9 },
  heightMm: 9,
  primitives: [
    ...[13.5, 18.5].flatMap((cx) => sixRayStar(cx, 2)),
    ...[9, 23].flatMap((cx) => sixRayStar(cx, 5)),
    ...[13.5, 18.5].flatMap((cx) => sixRayStar(cx, 7)),
  ],
};

export const ADMINISTRATIVE_HEADS: DeepReadonly<
  Partial<Record<AdminLevelId, AdministrativeHeadShape>>
> = deepFreeze({
  kreis: KREIS,
  nationalstaat: NATIONALSTAAT,
  'europaeische-union': EUROPAEISCHE_UNION,
});

export function administrativeHead(id: AdminLevelId): AdministrativeHeadShape | undefined {
  return ADMINISTRATIVE_HEADS[id];
}
