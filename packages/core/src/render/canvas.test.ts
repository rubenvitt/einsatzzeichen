import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, mmToUnits, type Drawing } from '@einsatzzeichen/schema';
import { renderCanvas } from './canvas.js';
import { formatUnits, renderSvg } from './svg.js';

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

describe('renderCanvas — Gruppenstil-Vererbung', () => {
  it('vererbt den Gruppenstil an ein Kind ohne eigenen Stil', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(
      {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          {
            type: 'group',
            style: { fill: 'blau', stroke: 'schwarz', strokeWidth: 0.5 },
            children: [{ type: 'circle', cx: 16, cy: 16, r: 10 }],
          },
        ],
      },
      ctx,
    );
    const names = calls.map(([name]) => name);
    expect(names).toContain('arc');
    expect(names).toContain('fill');
    expect(names).toContain('stroke');
    expect(calls).toContainEqual(['set:fillStyle', '#003296']);
    expect(calls).toContainEqual(['set:strokeStyle', '#000000']);
  });

  it('überschreibt nur die vom Kind selbst gesetzten Stilfelder, geerbte Felder bleiben erhalten', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(
      {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          {
            type: 'group',
            style: { fill: 'blau', stroke: 'schwarz', strokeWidth: 0.5 },
            children: [
              {
                type: 'circle',
                cx: 16,
                cy: 16,
                r: 10,
                // Setzt nur den Stroke selbst; der Fill muss von der Gruppe geerbt werden.
                style: { stroke: 'rot' },
              },
            ],
          },
        ],
      },
      ctx,
    );
    // Fill kommt von der Gruppe (nicht vom Kind überschrieben).
    expect(calls).toContainEqual(['set:fillStyle', '#003296']);
    // Stroke ist das eigene Feld des Kindes, überschreibt die Gruppe.
    expect(calls).toContainEqual(['set:strokeStyle', '#fa1919']);
  });

  it('löst denselben Gruppenstil auf wie SVG — dort über CSS-Kaskade, hier explizit', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          style: { fill: 'blau', stroke: 'schwarz', strokeWidth: 0.5 },
          children: [{ type: 'rect', x: 0, y: 0, width: 10, height: 10 }],
        },
      ],
    };

    // SVG setzt den Stil auf das <g>-Element und verlässt sich auf die CSS-Kaskade:
    // das <rect> trägt selbst kein fill/stroke-Attribut.
    const svg = renderSvg(drawing);
    expect(svg).toContain('<g fill="#003296" stroke="#000000" stroke-width="1.417">');
    const rectTag = svg.match(/<rect[^>]*\/>/)?.[0];
    expect(rectTag).not.toMatch(/fill=/);
    expect(rectTag).not.toMatch(/stroke=/);

    // Canvas kennt keine Kaskade und muss den geerbten Stil deshalb explizit auf das
    // Kind anwenden — mit demselben Ergebnis.
    const { ctx, calls } = recordingContext();
    renderCanvas(drawing, ctx);
    expect(calls).toContainEqual(['set:fillStyle', '#003296']);
    expect(calls).toContainEqual(['set:strokeStyle', '#000000']);
  });
});

describe('renderCanvas — fillRule', () => {
  it('füllt mit nonzero, wenn keine fillRule gesetzt ist', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(
      {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          {
            type: 'polyline',
            closed: true,
            points: [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
            ],
            style: { fill: 'gelb' },
          },
        ],
      },
      ctx,
    );
    const fillCall = calls.find(([name]) => name === 'fill');
    expect(fillCall).toEqual(['fill', 'nonzero']);
  });

  it('gibt eine gesetzte fillRule an fill() weiter', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(
      {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          {
            type: 'polyline',
            closed: true,
            points: [
              [0, 0],
              [10, 0],
              [10, 10],
              [0, 10],
            ],
            style: { fill: 'gelb', fillRule: 'evenodd' },
          },
        ],
      },
      ctx,
    );
    const fillCall = calls.find(([name]) => name === 'fill');
    expect(fillCall).toEqual(['fill', 'evenodd']);
  });
});

describe('renderCanvas — geerbte Strichstärke (Fix-Runde 2)', () => {
  it('reicht eine geerbte Strichstärke als dieselbe Millimeterangabe an SVG und Canvas weiter', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          style: { stroke: 'schwarz', strokeWidth: 0.7 },
          // Kein eigener strokeWidth — muss von der Gruppe geerbt werden.
          children: [{ type: 'circle', cx: 16, cy: 16, r: 10, style: { fill: 'gelb' } }],
        },
      ],
    };

    // SVG: das Kind löst den geerbten Millimeterwert selbst über u() auf, ohne Umweg über
    // eine bereits in Einheiten umgerechnete <g>-Kaskade — deshalb keine Doppel-Skalierung.
    const svg = renderSvg(drawing);
    expect(svg).toContain(`stroke-width="${formatUnits(mmToUnits(0.7))}"`);

    // Canvas: derselbe geerbte Millimeterwert, über mmToUnits umgerechnet.
    const { ctx, calls } = recordingContext();
    renderCanvas(drawing, ctx);
    const lineWidth = calls.find(([name]) => name === 'set:lineWidth');
    expect(lineWidth?.[1]).toBeCloseTo(mmToUnits(0.7), 9);
  });

  it('lässt ein Kind mit stroke: "none" unter einer umrandeten Gruppe ungestrichelt', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          style: { stroke: 'schwarz', strokeWidth: 0.5 },
          children: [
            {
              type: 'circle',
              cx: 16,
              cy: 16,
              r: 10,
              // Überschreibt den geerbten Stroke ausdrücklich mit 'none'.
              style: { fill: 'gelb', stroke: 'none' },
            },
          ],
        },
      ],
    };

    // SVG: das Kind gibt selbst stroke="none" aus (kein stroke-width danach) und
    // überschreibt damit den geerbten Stroke der Gruppe.
    const svg = renderSvg(drawing);
    const circleTag = svg.match(/<circle[^>]*\/>/)?.[0];
    expect(circleTag).toContain('stroke="none"');
    expect(circleTag).not.toContain('stroke-width');

    // Canvas: kein stroke()-Aufruf für dieses Kind.
    const { ctx, calls } = recordingContext();
    renderCanvas(drawing, ctx);
    const names = calls.map(([name]) => name);
    expect(names).not.toContain('stroke');
  });
});
