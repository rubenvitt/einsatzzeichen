import { describe, expect, it } from 'vitest';
import { REFERENCE_THEME, type RenderTheme } from '@einsatzzeichen/core';
import type { Drawing } from '@einsatzzeichen/schema';
import {
  addSymbolImage,
  createStyleImage,
  type CanvasLike,
  type MapLike,
  type StyleImageData,
} from './style-image.js';

type Call = [string, ...unknown[]];

/**
 * Prüft nur die Oberfläche, die `renderCanvas` (core) tatsächlich aufruft — genug, um den Proxy
 * ohne `as <Typ>` auf `CanvasRenderingContext2D` zu verengen, ohne eine vollständige (und damit
 * unehrliche) Nachbildung der Browser-Schnittstelle zu behaupten.
 */
function looksLikeCanvasRenderingContext2D(value: object): value is CanvasRenderingContext2D {
  return 'save' in value && 'restore' in value && 'fill' in value && 'getImageData' in value;
}

interface RecordingCanvas {
  canvas: CanvasLike;
  calls: Call[];
  /** Eigenschaftszuweisungen am Kontext (z. B. `fillStyle`), in Aufrufreihenfolge. */
  sets: Call[];
}

/**
 * Aufzeichnende Leinwand-Attrappe: Node hat keine Canvas-Implementierung, und wir prüfen hier
 * die Verdrahtung (Maße, Theme, Rückgabe), nicht gerasterte Pixel. `getImageData` liefert
 * daher einen Nullpuffer in genau den angeforderten Maßen — so wie es ein echter Kontext für
 * eine unbemalte Fläche auch täte.
 */
function recordingCanvas(options: { contextAvailable?: boolean } = {}): RecordingCanvas {
  const calls: Call[] = [];
  const sets: Call[] = [];
  const canvas: CanvasLike = {
    width: 0,
    height: 0,
    getContext(type: '2d') {
      calls.push(['getContext', type]);
      if (options.contextAvailable === false) return null;
      const handler: ProxyHandler<Record<string, unknown>> = {
        get(_target, prop: string | symbol) {
          if (prop === 'canvas') return canvas;
          if (prop === 'getImageData') {
            return (x: number, y: number, width: number, height: number) => {
              calls.push(['getImageData', x, y, width, height]);
              return { data: new Uint8ClampedArray(width * height * 4), width, height };
            };
          }
          return (...args: unknown[]) => {
            calls.push([String(prop), ...args]);
          };
        },
        set(_target, prop: string | symbol, value: unknown) {
          sets.push([String(prop), value]);
          return true;
        },
        has() {
          return true;
        },
      };
      const candidate: object = new Proxy({}, handler);
      if (!looksLikeCanvasRenderingContext2D(candidate)) {
        throw new Error(
          'recordingCanvas: Proxy erfüllt nicht die minimale CanvasRenderingContext2D-Oberfläche.',
        );
      }
      return candidate;
    },
  };
  return { canvas, calls, sets };
}

const DRAWING: Drawing = {
  viewBox: { width: 32, height: 32 },
  children: [
    {
      type: 'rect',
      role: 'body',
      x: 2,
      y: 2,
      width: 28,
      height: 28,
      style: { fill: 'rot', stroke: 'schwarz', strokeWidth: 0.5 },
    },
    { type: 'circle', role: 'pictogram', cx: 16, cy: 16, r: 6, style: { fill: 'weiss' } },
  ],
};

const TEST_THEME: RenderTheme = {
  ...REFERENCE_THEME,
  id: 'test',
  palette: { ...REFERENCE_THEME.palette, rot: '#123456' },
};

describe('createStyleImage', () => {
  it('liefert Rastermaße aus Größe × pixelRatio und einen passend großen RGBA-Puffer', () => {
    const recorder = recordingCanvas();
    const image = createStyleImage(DRAWING, {
      size: 32,
      pixelRatio: 2,
      createCanvas: () => recorder.canvas,
    });

    expect(image.width).toBe(64);
    expect(image.height).toBe(64);
    expect(image.data).toBeInstanceOf(Uint8ClampedArray);
    expect(image.data.length).toBe(64 * 64 * 4);
    expect(recorder.calls).toContainEqual(['getImageData', 0, 0, 64, 64]);
  });

  it('übergibt die angeforderten Maße an createCanvas und lässt renderCanvas die Fläche setzen', () => {
    const recorder = recordingCanvas();
    const requested: Array<[number, number]> = [];
    createStyleImage(DRAWING, {
      size: 16,
      createCanvas: (width, height) => {
        requested.push([width, height]);
        return recorder.canvas;
      },
    });

    expect(requested).toEqual([[16, 16]]);
    expect(recorder.canvas.width).toBe(16);
    expect(recorder.canvas.height).toBe(16);
  });

  it('rundet die Höhe bei nichtquadratischer ViewBox proportional auf', () => {
    const recorder = recordingCanvas();
    const image = createStyleImage(
      { ...DRAWING, viewBox: { width: 32, height: 20 } },
      { size: 25, createCanvas: () => recorder.canvas },
    );

    expect(image.width).toBe(25);
    // 25 × 20 / 32 = 15,625 → aufgerundet, damit kein Rand abgeschnitten wird.
    expect(image.height).toBe(16);
    expect(image.data.length).toBe(25 * 16 * 4);
  });

  it('reicht das Theme an renderCanvas durch (nachweisbar über die Füllfarbe)', () => {
    const recorder = recordingCanvas();
    createStyleImage(DRAWING, { size: 32, theme: TEST_THEME, createCanvas: () => recorder.canvas });

    expect(recorder.sets).toContainEqual(['fillStyle', '#123456']);
    expect(recorder.sets).not.toContainEqual(['fillStyle', REFERENCE_THEME.palette.rot]);
  });

  it('verwendet ohne Theme die Referenzpalette', () => {
    const recorder = recordingCanvas();
    createStyleImage(DRAWING, { size: 32, createCanvas: () => recorder.canvas });

    expect(recorder.sets).toContainEqual(['fillStyle', REFERENCE_THEME.palette.rot]);
  });

  it.each([
    { size: 0 },
    { size: 1.5 },
    { size: Number.NaN },
    { size: -8 },
    { size: 5, pixelRatio: 0.3 },
    { size: 32, pixelRatio: 0 },
    { size: 32, pixelRatio: Number.POSITIVE_INFINITY },
  ])('wirft bei ungültigen Rastermaßen (%o), ohne eine Leinwand anzulegen', (options) => {
    let created = 0;
    expect(() =>
      createStyleImage(DRAWING, {
        ...options,
        createCanvas: () => {
          created += 1;
          return recordingCanvas().canvas;
        },
      }),
    ).toThrow(/ganze Zahl/u);
    expect(created).toBe(0);
  });

  it('akzeptiert eine nichtganzzahlige size, wenn size × pixelRatio ganzzahlig ist', () => {
    const image = createStyleImage(DRAWING, {
      size: 1.5,
      pixelRatio: 2,
      createCanvas: () => recordingCanvas().canvas,
    });
    expect(image.width).toBe(3);
  });

  it('wirft mit klarer Meldung, wenn keine Leinwand verfügbar ist', () => {
    // In Node gibt es weder OffscreenCanvas noch document; der Fehler muss das benennen.
    expect(typeof globalThis.OffscreenCanvas).toBe('undefined');
    expect(typeof globalThis.document).toBe('undefined');
    expect(() => createStyleImage(DRAWING, { size: 32 })).toThrow(
      /Keine Leinwand verfügbar.*createCanvas/u,
    );
  });

  it('wirft, wenn die Leinwand keinen 2D-Kontext liefert', () => {
    const recorder = recordingCanvas({ contextAvailable: false });
    expect(() =>
      createStyleImage(DRAWING, { size: 32, createCanvas: () => recorder.canvas }),
    ).toThrow(/2D-Kontext/u);
  });
});

describe('addSymbolImage', () => {
  interface RecordingMap extends MapLike {
    added: Array<[string, StyleImageData, { pixelRatio?: number; sdf?: boolean } | undefined]>;
  }

  function recordingMap(existing: readonly string[] = []): RecordingMap {
    const ids = new Set(existing);
    const map: RecordingMap = {
      added: [],
      hasImage: (id) => ids.has(id),
      addImage(id, image, options) {
        ids.add(id);
        map.added.push([id, image, options]);
      },
    };
    return map;
  }

  it('registriert das Bild unter der ID mit pixelRatio und gibt es zurück', () => {
    const map = recordingMap();
    const recorder = recordingCanvas();
    const image = addSymbolImage(map, 'drk-rtw', DRAWING, {
      size: 32,
      pixelRatio: 2,
      createCanvas: () => recorder.canvas,
    });

    expect(map.added).toHaveLength(1);
    const [id, added, options] = map.added[0]!;
    expect(id).toBe('drk-rtw');
    expect(added).toBe(image);
    expect(options).toEqual({ pixelRatio: 2 });
    expect(image.width).toBe(64);
  });

  it('meldet pixelRatio 1, wenn keines angegeben ist', () => {
    const map = recordingMap();
    addSymbolImage(map, 'drk-rtw', DRAWING, {
      size: 32,
      createCanvas: () => recordingCanvas().canvas,
    });

    expect(map.added[0]![2]).toEqual({ pixelRatio: 1 });
  });

  it('wirft bei doppelter ID, ohne addImage aufzurufen', () => {
    const map = recordingMap(['drk-rtw']);
    expect(() =>
      addSymbolImage(map, 'drk-rtw', DRAWING, {
        size: 32,
        createCanvas: () => recordingCanvas().canvas,
      }),
    ).toThrow(/drk-rtw/u);
    expect(map.added).toHaveLength(0);
  });
});
