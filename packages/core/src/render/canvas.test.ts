import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, PALETTE, mmToUnits, type Drawing } from '@einsatzzeichen/schema';
import { renderCanvas } from './canvas.js';
import { formatUnits, renderSvg } from './svg.js';
import type { RenderTheme } from './theme.js';

type Call = [string, ...unknown[]];

// Node stellt kein Path2D bereit — `drawPrimitive` (canvas.ts) übergibt es nur als Träger
// an ctx.fill/ctx.stroke, die hier ohnehin nur aufgezeichnet, nie gerastert werden. Ein
// leerer Stub genügt also, ohne dass wir eine echte Canvas-Umgebung (jsdom o.Ä.) hinzuziehen.
if (typeof globalThis.Path2D === 'undefined') {
  class Path2DStub {
    constructor(_d?: string) {}
  }
  // @ts-expect-error: Path2DStub bildet nur den Konstruktor nach, nicht die volle
  // CanvasPath-Schnittstelle, die das DOM-lib für Path2D erwartet.
  globalThis.Path2D = Path2DStub;
}

/**
 * Prüft nur die Oberfläche, die `drawPrimitive`/`tracePrimitive` (`canvas.ts`) tatsächlich
 * aufrufen — genug, um den Proxy unten ohne `as <Typ>` auf `CanvasRenderingContext2D` zu
 * verengen, ohne eine vollständige (und damit unehrliche) Nachbildung der Browser-Schnittstelle
 * zu behaupten. Derselbe Grenzfall wie bei `fingerprint-index.ts`: eine echte, wenn auch
 * unvollständige Laufzeitprüfung statt eines Casts.
 */
function looksLikeCanvasRenderingContext2D(value: object): value is CanvasRenderingContext2D {
  return 'save' in value && 'restore' in value && 'fill' in value && 'stroke' in value;
}

/** Minimaler Aufzeichner. Wir prüfen die Aufrufreihenfolge, nicht gerasterte Pixel. */
function recordingContext(): { ctx: CanvasRenderingContext2D; calls: Call[] } {
  const calls: Call[] = [];
  const handler: ProxyHandler<Record<string, unknown>> = {
    get(_target, prop: string | symbol) {
      if (prop === 'canvas') return { width: 0, height: 0 };
      return (...args: unknown[]) => {
        calls.push([String(prop), ...args]);
      };
    },
    set(_target, prop: string | symbol, value: unknown) {
      calls.push([`set:${String(prop)}`, value]);
      return true;
    },
    // Ohne eigenen `has`-Trap prüft `in` nur das leere Ziel `{}` und würde immer `false`
    // liefern — der `get`-Trap oben fängt zwar jeden Zugriff ab, aber nicht den `in`-Operator.
    has() {
      return true;
    },
  };
  const candidate: object = new Proxy({}, handler);
  if (!looksLikeCanvasRenderingContext2D(candidate)) {
    throw new Error(
      'recordingContext: Proxy erfüllt nicht die minimale CanvasRenderingContext2D-Oberfläche.',
    );
  }
  return { ctx: candidate, calls };
}

const formation: Drawing = {
  viewBox: DEFAULT_VIEWBOX_MM,
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

  it('löst dieselben Themefarben wie der SVG-Renderer auf', () => {
    const theme: RenderTheme = {
      id: 'test',
      palette: { ...PALETTE, weiss: '#eeeeee', schwarz: '#111111' },
      surface: '#ffffff',
    };
    const { ctx, calls } = recordingContext();
    renderCanvas(formation, ctx, { theme });
    expect(calls).toContainEqual(['set:fillStyle', '#eeeeee']);
    expect(calls).toContainEqual(['set:strokeStyle', '#111111']);
    expect(renderSvg(formation, { theme })).toContain('fill="#eeeeee"');
  });

  it('setzt dieselbe nicht-farbliche Körperkontur wie der SVG-Renderer', () => {
    const theme: RenderTheme = {
      id: 'test',
      palette: PALETTE,
      surface: '#ffffff',
      bodyStrokeDashes: { weiss: [2, 1] },
    };
    const { ctx, calls } = recordingContext();
    renderCanvas(formation, ctx, { theme });
    expect(calls).toContainEqual(['setLineDash', [mmToUnits(2), mmToUnits(1)]]);
    expect(renderSvg(formation, { theme })).toContain('stroke-dasharray=');
  });

  it('setzt für ein solid gerendertes Blatt Strichmuster und -offset explizit zurück', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(formation, ctx);
    expect(calls).toContainEqual(['setLineDash', []]);
    expect(calls).toContainEqual(['set:lineDashOffset', 0]);
  });

  it('setzt auch für einen solid gerenderten Pfad das Caller-Strichmuster zurück', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(
      {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          { type: 'path', d: 'M 4 16 L 28 16', style: { stroke: 'schwarz', strokeWidth: 0.5 } },
        ],
      },
      ctx,
    );
    expect(calls).toContainEqual(['setLineDash', []]);
    expect(calls).toContainEqual(['set:lineDashOffset', 0]);
  });

  it('vererbt die body-Rolle einer Gruppe an ihre Zeichenblätter', () => {
    const theme: RenderTheme = {
      id: 'test',
      palette: PALETTE,
      surface: '#ffffff',
      bodyStrokeDashes: { blau: [2, 1] },
    };
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          role: 'body',
          style: { fill: 'blau', stroke: 'schwarz', strokeWidth: 0.5 },
          children: [{ type: 'rect', x: 1, y: 6, width: 30, height: 20 }],
        },
      ],
    };
    const { ctx, calls } = recordingContext();
    renderCanvas(drawing, ctx, { theme });
    expect(calls).toContainEqual(['setLineDash', [mmToUnits(2), mmToUnits(1)]]);
    expect(renderSvg(drawing, { theme })).toContain('stroke-dasharray=');
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

  it('löst denselben Gruppenstil in SVG und Canvas auf — Füllung, Kontur und Strichstärke stimmen überein', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          style: { fill: 'blau', stroke: 'schwarz', strokeWidth: 0.7 },
          // Kein eigener Stil — Füllung, Kontur und Strichstärke müssen vollständig
          // von der Gruppe geerbt werden.
          children: [{ type: 'rect', x: 0, y: 0, width: 10, height: 10 }],
        },
      ],
    };

    // Zusicherung gilt dem Ergebnis (welche Werte das Kind effektiv trägt), nicht dem
    // Mechanismus (wo im Dokument das Attribut steht oder in welcher Reihenfolge
    // Aufrufe erfolgen) — beides bleibt Implementierungsdetail des jeweiligen Renderers.
    const svg = renderSvg(drawing);
    const rectTag = svg.match(/<rect[^>]*\/>/)?.[0];
    expect(rectTag).toMatch(/fill="#003296"/);
    expect(rectTag).toMatch(/stroke="#000000"/);
    expect(rectTag).toMatch(new RegExp(`stroke-width="${formatUnits(mmToUnits(0.7))}"`));

    const { ctx, calls } = recordingContext();
    renderCanvas(drawing, ctx);
    expect(calls).toContainEqual(['set:fillStyle', '#003296']);
    expect(calls).toContainEqual(['set:strokeStyle', '#000000']);
    const lineWidth = calls.find(([name]) => name === 'set:lineWidth');
    expect(lineWidth?.[1]).toBeCloseTo(mmToUnits(0.7), 9);
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

describe('renderCanvas — Primitiv ohne style (Fix-Runde 3)', () => {
  it('malt in SVG und Canvas dasselbe Nichts, wenn ein Primitiv gar keinen Stil trägt', () => {
    // Ohne explizite Vorgabe wäre dies die dritte Treuelücke zwischen den Renderern: SVGs
    // implizite Vorgabe für ein fehlendes fill-Attribut ist schwarz, Canvas füllt in diesem
    // Fall gar nicht (style?.fill !== undefined). Beide müssen "nichts füllen" liefern.
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [{ type: 'rect', x: 0, y: 0, width: 10, height: 10 }],
    };

    const svg = renderSvg(drawing);
    const rectTag = svg.match(/<rect[^>]*\/>/)?.[0];
    expect(rectTag).toContain('fill="none"');

    const { ctx, calls } = recordingContext();
    renderCanvas(drawing, ctx);
    const names = calls.map(([name]) => name);
    expect(names).not.toContain('fill');
  });
});

describe('renderCanvas — Verschiebung von Gruppen', () => {
  it('verschiebt in SVG-Einheiten innerhalb von save/restore', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(
      {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          {
            type: 'group',
            transform: { translate: { dxMm: 0, dyMm: 3 } },
            children: [{ type: 'rect', x: 1, y: 6, width: 30, height: 20, style: { fill: 'rot' } }],
          },
        ],
      },
      ctx,
    );
    const names = calls.map(([name]) => name);
    const translateIndex = names.indexOf('translate');
    expect(translateIndex).toBeGreaterThan(names.indexOf('save'));
    const translateCall = calls[translateIndex];
    expect(translateCall?.[1]).toBe(0);
    expect(translateCall?.[2]).toBeCloseTo(mmToUnits(3), 9);
    expect(names).toContain('restore');
  });

  it('verschiebt vor der Drehung, damit die Matrix zu SVGs translate-vor-rotate passt', () => {
    // Canvas-Transformationen wirken in Aufrufreihenfolge auf die CTM: translate zuerst
    // ergibt T·R und damit dieselbe Abbildung wie SVGs transform="translate(...) rotate(...)".
    // Nach der Drehung aufgerufen ergäbe es R·T — ein anderes Bild aus derselben IR.
    const { ctx, calls } = recordingContext();
    renderCanvas(
      {
        viewBox: DEFAULT_VIEWBOX_MM,
        children: [
          {
            type: 'group',
            transform: { translate: { dxMm: 1, dyMm: 2 }, rotate: { angle: 45, cx: 16, cy: 16 } },
            children: [{ type: 'rect', x: 0, y: 0, width: 4, height: 4, style: { fill: 'rot' } }],
          },
        ],
      },
      ctx,
    );
    const names = calls.map(([name]) => name);
    // Die Drehung ruft selbst zweimal translate auf (Zentrum hin und zurück) — der erste
    // translate-Aufruf muss die Gruppenverschiebung sein, nicht das Rotationszentrum.
    const firstTranslate = calls.find(([name]) => name === 'translate');
    expect(firstTranslate?.[1]).toBeCloseTo(mmToUnits(1), 9);
    expect(firstTranslate?.[2]).toBeCloseTo(mmToUnits(2), 9);
    expect(names.indexOf('translate')).toBeLessThan(names.indexOf('rotate'));
  });
});

describe('renderCanvas — Renderer-Parität bei translate (Spec-Erfolgskriterium 3)', () => {
  it('bildet dieselbe IR in SVG und Canvas auf dieselbe Verschiebung ab', () => {
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          role: 'pictogram',
          transform: { translate: { dxMm: 0, dyMm: 3 } },
          children: [
            { type: 'line', x1: 3, y1: 16, x2: 26, y2: 16, style: { stroke: 'schwarz', strokeWidth: 0.5 } },
          ],
        },
      ],
    };

    // Zusicherung gilt der Abbildung, nicht dem Mechanismus: beide Renderer müssen denselben
    // Millimeterwert auf denselben Einheitenwert bringen, egal ob als Attribut oder als Aufruf.
    const svg = renderSvg(drawing);
    expect(svg).toContain(`translate(0 ${formatUnits(mmToUnits(3))})`);

    const { ctx, calls } = recordingContext();
    renderCanvas(drawing, ctx);
    const translateCall = calls.find(([name]) => name === 'translate');
    expect(translateCall?.[1]).toBe(0);
    expect(translateCall?.[2]).toBeCloseTo(mmToUnits(3), 9);
  });

  it('verschiebt einen Pfad in beiden Renderern, ohne die Skalierung zu doppeln', () => {
    // Der kritische Fall: der Pfad trägt seine eigene scale(...)-Umrechnung. Die Verschiebung
    // sitzt eine Ebene darüber und darf nicht durch diese Skalierung laufen.
    const drawing: Drawing = {
      viewBox: DEFAULT_VIEWBOX_MM,
      children: [
        {
          type: 'group',
          role: 'pictogram',
          transform: { translate: { dxMm: 0, dyMm: 3 } },
          children: [{ type: 'path', d: 'M 4 16 L 28 16', style: { stroke: 'schwarz', strokeWidth: 0.5 } }],
        },
      ],
    };

    const svg = renderSvg(drawing);
    // Die Gruppe trägt die Verschiebung in Einheiten …
    expect(svg).toContain(`<g transform="translate(0 ${formatUnits(mmToUnits(3))})">`);
    // … der Pfad ausschließlich seine Skalierung, unverändert.
    const pathTag = svg.match(/<path[^>]*\/>/)?.[0];
    expect(pathTag).toContain('transform="scale(');
    expect(pathTag).not.toContain('translate(');

    const { ctx, calls } = recordingContext();
    renderCanvas(drawing, ctx);
    const names = calls.map(([name]) => name);
    // Canvas: die Verschiebung steht vor der Pfad-Skalierung.
    expect(names.indexOf('translate')).toBeLessThan(names.indexOf('scale'));
    const translateCall = calls.find(([name]) => name === 'translate');
    expect(translateCall?.[2]).toBeCloseTo(mmToUnits(3), 9);
  });
});
