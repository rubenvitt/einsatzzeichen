import { describe, expect, it } from 'vitest';
import {
  DEFAULT_VIEWBOX_MM,
  PALETTE,
  mmToUnits,
  type Drawing,
  type Primitive,
} from '@einsatzzeichen/schema';
import { renderCanvas } from './canvas.js';
import { formatUnits, renderSvg } from './svg.js';
import { contrastSurface, paintColor, type RenderTheme } from './theme.js';
import { ACCESSIBLE_LIGHT_THEME, DARK_THEME } from '../geometry/render-themes.js';

type Call = [string, ...unknown[]];

if (typeof globalThis.Path2D === 'undefined') {
  class Path2DStub {
    constructor(_d?: string) {}
  }
  // @ts-expect-error: Der Stub bildet nur den Konstruktor nach (wie in canvas.test.ts).
  globalThis.Path2D = Path2DStub;
}

function looksLikeCanvasRenderingContext2D(value: object): value is CanvasRenderingContext2D {
  return 'save' in value && 'restore' in value && 'fill' in value && 'stroke' in value;
}

/** Aufzeichner wie in canvas.test.ts; geprüft wird die Aufrufreihenfolge, nicht Pixel. */
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
    has() {
      return true;
    },
  };
  const candidate: object = new Proxy({}, handler);
  if (!looksLikeCanvasRenderingContext2D(candidate)) throw new Error('kein 2D-Kontext');
  return { ctx: candidate, calls };
}

const HALO_THEME: RenderTheme = {
  id: 'halo-test',
  palette: PALETTE,
  surface: '#141414',
  halo: { color: '#eeeeee', widthMm: 0.5 },
  surfaceMarkInk: { schwarz: '#ffffff' },
};

const u = (mm: number): string => formatUnits(mmToUnits(mm));

function drawingOf(...children: Primitive[]): Drawing {
  return { viewBox: DEFAULT_VIEWBOX_MM, children };
}

const emptyFormation = drawingOf({
  type: 'rect',
  role: 'body',
  x: 1,
  y: 6,
  width: 30,
  height: 20,
  style: { fill: 'none', stroke: 'schwarz', strokeWidth: 0.5 },
});

describe('Hinterlegung für dunkle Flächen (ESZ-119)', () => {
  it('zeichnet ohne Hinterlegung bytegleich zum Theme ohne das Feld', () => {
    const { halo: _halo, surfaceMarkInk: _ink, ...plain } = HALO_THEME;
    expect(renderSvg(emptyFormation, { theme: plain })).toBe(
      renderSvg(emptyFormation, { theme: { ...plain, id: 'anders' } }),
    );
    expect(renderSvg(emptyFormation, { theme: plain })).not.toContain('#eeeeee');
  });

  it('legt zuerst die Silhouette und darüber die unveränderte Zeichnung', () => {
    const svg = renderSvg(emptyFormation, { theme: HALO_THEME });
    const rects = svg.match(/<rect [^>]*\/>/g) ?? [];
    expect(rects).toHaveLength(2);
    // Strich 0,5 mm plus je Seite 0,5 mm Hinterlegung; stumpfe Enden rund umrandet, Ecken wie die
    // Tinte gegehrt (SVG-Vorgabe, deshalb ohne Attribut).
    expect(rects[0]).toContain(
      `fill="none" stroke="#eeeeee" stroke-width="${u(1.5)}" stroke-linecap="round"/>`,
    );
    expect(rects[0]).not.toContain('stroke-linejoin');
    expect(rects[1]).toContain(`fill="none" stroke="#000000" stroke-width="${u(0.5)}"`);
  });

  it('füllt Flächen in der Hinterlegungsfarbe und umrandet Text mit doppelter Breite', () => {
    const svg = renderSvg(
      drawingOf(
        { type: 'circle', cx: 16, cy: 16, r: 4, style: { fill: 'rot', stroke: 'none' } },
        {
          type: 'text',
          role: 'label',
          content: 'AW',
          x: 16,
          y: 28,
          sizeMm: 3,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 12, yMm: 25, widthMm: 8, heightMm: 3 },
          style: { fill: 'schwarz' },
        },
      ),
      { theme: HALO_THEME },
    );
    expect(svg).toContain(
      `r="${u(4)}" fill="#eeeeee" stroke="#eeeeee" stroke-width="${u(1)}" stroke-linecap="round" ` +
        'stroke-linejoin="round"/>',
    );
    expect(svg).toMatch(
      new RegExp(`<text [^>]*fill="#eeeeee" stroke="#eeeeee" stroke-width="${u(1)}"[^>]*>AW</text>`),
    );
    // Der Lauf selbst bleibt schwarz und ungestrichen.
    expect(svg).toMatch(/<text [^>]*fill="#000000"(?![^>]*stroke)[^>]*>AW<\/text>/);
  });

  it('folgt der Gehrung der Tinte: gefast bleibt gefast, Piktogramme rund', () => {
    const svg = renderSvg(
      drawingOf(
        {
          type: 'polyline',
          points: [[4, 28], [16, 4], [28, 28]],
          closed: true,
          style: { fill: 'none', stroke: 'schwarz', strokeWidth: 1, strokeLinejoin: 'bevel' },
        },
        {
          type: 'polyline',
          role: 'pictogram',
          points: [[10, 20], [16, 10], [22, 20]],
          style: { fill: 'none', stroke: 'schwarz' },
        },
      ),
      { theme: HALO_THEME },
    );
    const polygons = svg.match(/<polygon [^>]*\/>/g) ?? [];
    const polylines = svg.match(/<polyline [^>]*\/>/g) ?? [];
    expect(polygons[0]).toContain('stroke-linejoin="bevel"');
    expect(polylines[0]).toContain('stroke-linejoin="round"');
  });

  it('zeichnet Kopfmarken und Fahrwerk in eigener Tinte und ohne Hinterlegung', () => {
    const svg = renderSvg(
      drawingOf(
        { type: 'circle', role: 'head', cx: 16, cy: 3, r: 1, style: { fill: 'schwarz' } },
        {
          type: 'circle',
          role: 'chassis',
          cx: 10,
          cy: 29,
          r: 2,
          style: { fill: 'none', stroke: 'schwarz' },
        },
        // Eine Farbe ohne Ersatz behält Palette und Hinterlegung.
        { type: 'circle', role: 'head', cx: 22, cy: 3, r: 1, style: { fill: 'rot' } },
      ),
      { theme: HALO_THEME },
    );
    const circles = svg.match(/<circle [^>]*\/>/g) ?? [];
    expect(circles).toEqual([
      expect.stringContaining('fill="#eeeeee" stroke="#eeeeee"'),
      expect.stringContaining('fill="#ffffff"'),
      expect.stringContaining('fill="none" stroke="#ffffff"'),
      expect.stringContaining(`fill="${PALETTE.rot}"`),
    ]);
    expect(circles[0]).toContain(`cx="${u(22)}"`);
    // Dieselbe Farbmarke im Körper bleibt Palette.
    expect(paintColor(HALO_THEME, 'schwarz', 'pictogram')).toBe('#000000');
    expect(paintColor(HALO_THEME, 'schwarz', 'head')).toBe('#ffffff');
  });

  it('hebt die Hinterlegung mit der Mindeststrichbreite an', () => {
    // 32 px auf 32 mm: 1 px ist 1 mm, also mehr als die 0,5 mm der Vorgabe.
    const svg = renderSvg(emptyFormation, { theme: HALO_THEME, size: 32, minStrokeWidthPx: 1 });
    const halo = (svg.match(/<rect [^>]*\/>/g) ?? [])[0];
    expect(halo).toContain(`stroke-width="${u(1 + 2 * 1)}"`);
  });

  it('zeichnet auf der Leinwand dieselbe Silhouette vor der Tinte', () => {
    const { ctx, calls } = recordingContext();
    renderCanvas(
      drawingOf(
        emptyFormation.children[0]!,
        {
          type: 'text',
          content: 'AW',
          x: 16,
          y: 28,
          sizeMm: 3,
          anchor: 'middle',
          baseline: 'alphabetic',
          boxMm: { xMm: 12, yMm: 25, widthMm: 8, heightMm: 3 },
          style: { fill: 'schwarz' },
        },
        { type: 'circle', role: 'head', cx: 16, cy: 3, r: 1, style: { fill: 'schwarz' } },
      ),
      ctx,
      { theme: HALO_THEME },
    );
    const strokes = calls.filter(([name]) => name === 'stroke' || name === 'strokeText');
    const widths = calls
      .filter(([name]) => name === 'set:lineWidth')
      .map(([, value]) => value);
    expect(strokes.map(([name]) => name)).toEqual(['stroke', 'strokeText', 'stroke']);
    expect(widths).toEqual([mmToUnits(1.5), mmToUnits(1), mmToUnits(0.5)]);
    const firstInk = calls.findIndex(
      ([name, value]) => name === 'set:strokeStyle' && value === '#000000',
    );
    const haloText = calls.findIndex(([name]) => name === 'strokeText');
    expect(haloText).toBeGreaterThan(-1);
    expect(haloText).toBeLessThan(firstInk);
    expect(calls).toContainEqual(['set:fillStyle', '#ffffff']);
  });

  it('rechnet Kontrast gegen die Oberfläche an der Hinterlegung', () => {
    expect(contrastSurface(HALO_THEME)).toBe('#eeeeee');
    expect(contrastSurface(DARK_THEME)).toBe(ACCESSIBLE_LIGHT_THEME.surface);
    expect(contrastSurface(ACCESSIBLE_LIGHT_THEME)).toBe('#ffffff');
  });

  it('lehnt eine ungültige Hinterlegung oder Ersatztinte vor jeder Ausgabe ab', () => {
    const broken = (patch: Partial<RenderTheme>): RenderTheme =>
      ({ ...HALO_THEME, ...patch }) as RenderTheme;
    expect(() => renderSvg(emptyFormation, {
      theme: broken({ halo: { color: '#fff', widthMm: 0.5 } }),
    })).toThrow('halo.color muss eine RGB-Hexfarbe');
    expect(() => renderSvg(emptyFormation, {
      theme: broken({ halo: { color: '#ffffff', widthMm: 0 } }),
    })).toThrow('halo.widthMm muss eine endliche Zahl größer als 0 sein');
    expect(() => renderSvg(emptyFormation, {
      theme: broken({ surfaceMarkInk: { unbekannt: '#ffffff' } as RenderTheme['surfaceMarkInk'] }),
    })).toThrow('surfaceMarkInk.unbekannt muss eine bekannte Farbmarke sein');
    expect(() => renderSvg(emptyFormation, {
      theme: broken({ surfaceMarkInk: { schwarz: 'weiß' as `#${string}` } }),
    })).toThrow('surfaceMarkInk.schwarz muss eine RGB-Hexfarbe');
  });
});
