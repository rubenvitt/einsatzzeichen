import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import { renderCanvas } from './canvas.js';

type Call = [string, ...unknown[]];

/** Minimaler Aufzeichner. Wir prüfen die Aufrufreihenfolge, nicht gerasterte Pixel. */
function recordingContext(): { ctx: CanvasRenderingContext2D; calls: Call[] } {
  const calls: Call[] = [];
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string) {
      if (prop === 'canvas') return { width: 0, height: 0 };
      return (...args: unknown[]) => {
        calls.push([prop, ...args]);
      };
    },
    set(_target, prop: string, value: unknown) {
      calls.push([`set:${prop}`, value]);
      return true;
    },
  };
  const ctx = new Proxy({}, handler) as unknown as CanvasRenderingContext2D;
  return { ctx, calls };
}

const formation: Drawing = {
  viewBox: DEFAULT_VIEWBOX_MM,
  children: [
    {
      type: 'rect',
      x: 1,
      y: 6,
      width: 30,
      height: 20,
      style: { fill: 'weiss', stroke: 'schwarz', strokeWidth: 0.5 },
    },
  ],
};

describe('renderCanvas', () => {
  it('skaliert von Einheiten auf die Zielgröße', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(formation, ctx, { size: 64 });
    const scale = calls.find(([name]) => name === 'scale');
    expect(scale?.[1]).toBeCloseTo(64 / 90.70866141732283, 9);
  });

  it('füllt und umrandet ein Rechteck mit den aufgelösten Farben', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(formation, ctx);
    const names = calls.map(([name]) => name);
    expect(names).toContain('rect');
    expect(names).toContain('fill');
    expect(names).toContain('stroke');
    expect(calls).toContainEqual(['set:fillStyle', '#ffffff']);
    expect(calls).toContainEqual(['set:strokeStyle', '#000000']);
  });

  it('setzt die Strichstärke in SVG-Einheiten', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(formation, ctx);
    const lineWidth = calls.find(([name]) => name === 'set:lineWidth');
    expect(lineWidth?.[1]).toBeCloseTo(1.4173228346, 6);
  });

  it('kapselt eine Drehung in save/restore', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(
      {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          {
            type: 'circle',
            cx: 16,
            cy: 16,
            r: 14,
            transform: { rotate: { angle: 45, cx: 16, cy: 16 } },
            style: { fill: 'rot' },
          },
        ],
      },
      ctx,
    );
    const names = calls.map(([name]) => name);
    expect(names.filter((n) => n === 'save').length).toBeGreaterThanOrEqual(2);
    expect(names).toContain('rotate');
    expect(names).toContain('arc');
  });
});
