import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';

/** Minimales gültiges Zeichen: ein Körper-Rechteck mit Referenzstil, wie in core/svg.test.ts. */
export const formation: Drawing = {
  viewBox: DEFAULT_VIEWBOX_MM,
  title: 'Taktische Formation',
  children: [
    {
      type: 'rect',
      role: 'body',
      x: 1,
      y: 6,
      width: 30,
      height: 20,
      style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
    },
  ],
};
