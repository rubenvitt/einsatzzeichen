import {
  rasterDimensionsForWidth,
  renderCanvas,
  type RenderTheme,
} from '@einsatzzeichen/core';
import type { Drawing } from '@einsatzzeichen/schema';

/**
 * Rohes RGBA-Bild in der Form, die MapLibres `map.addImage` als Eingabe akzeptiert
 * (`{ width, height, data }`). Bewusst strukturell statt über `maplibre-gl` typisiert: das Paket
 * trägt keine Laufzeitabhängigkeit auf die Kartenbibliothek, damit es sich in jede
 * MapLibre-/Mapbox-GL-Version einhängen lässt, die diese Eingabeform versteht.
 */
export interface StyleImageData {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8ClampedArray;
}

/** Minimale Leinwand-Oberfläche: `HTMLCanvasElement` und `OffscreenCanvas` erfüllen sie beide. */
export interface CanvasLike {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasRenderingContext2D | null;
}

/**
 * Der Ausschnitt der MapLibre-`Map`, den dieses Paket braucht. Strukturell typisiert, damit Tests
 * und Aufrufer keine `maplibre-gl`-Instanz benötigen (siehe `StyleImageData`).
 */
export interface MapLike {
  hasImage(id: string): boolean;
  addImage(
    id: string,
    image: StyleImageData,
    options?: { pixelRatio?: number },
  ): void;
}

export interface SymbolImageOptions {
  /** Breite des Symbols in CSS-Pixeln; die Höhe folgt proportional der ViewBox. */
  readonly size: number;
  /**
   * Gerätepixel je CSS-Pixel (Standard 1). Das Raster wird entsprechend größer gezeichnet und
   * MapLibre über `addImage(..., { pixelRatio })` mitgeteilt, damit es das Bild auf HiDPI-Karten
   * scharf, aber in derselben CSS-Größe darstellt.
   */
  readonly pixelRatio?: number;
  /** Farbprofil der Ausgabe; ohne Angabe die Referenzpalette. */
  readonly theme?: RenderTheme;
  /**
   * Leinwandfabrik für Umgebungen ohne `OffscreenCanvas`/`document` (Node mit `@napi-rs/canvas`,
   * Tests). Ohne Angabe wird `OffscreenCanvas`, dann `document.createElement('canvas')` versucht.
   */
  readonly createCanvas?: (width: number, height: number) => CanvasLike;
}

/**
 * Löst die Rasterbreite in Gerätepixeln auf. `size × pixelRatio` muss ganzzahlig sein, weil ein
 * Bildpuffer keine Bruchteile von Pixeln kennt; stilles Runden würde die CSS-Größe verfälschen,
 * die MapLibre aus `width / pixelRatio` zurückrechnet. Die Ganzzahlprüfung des Produkts übernimmt
 * `rasterDimensionsForWidth` (core); hier werden nur die Faktoren vorab geprüft, damit die
 * Meldung den eigentlichen Verursacher benennt und keine Leinwand angelegt wird.
 */
function devicePixelWidth(size: number, pixelRatio: number): number {
  if (!Number.isFinite(size) || size <= 0) {
    throw new RangeError(
      `size muss endlich und positiv sein (ist ${String(size)}); ` +
        'size × pixelRatio muss eine ganze Zahl ergeben.',
    );
  }
  if (!Number.isFinite(pixelRatio) || pixelRatio <= 0) {
    throw new RangeError(
      `pixelRatio muss endlich und positiv sein (ist ${String(pixelRatio)}); ` +
        'size × pixelRatio muss eine ganze Zahl ergeben.',
    );
  }
  return size * pixelRatio;
}

/**
 * `OffscreenCanvas.getContext('2d')` liefert einen `OffscreenCanvasRenderingContext2D`, den
 * TypeScript nicht als `CanvasRenderingContext2D` durchlässt — obwohl `renderCanvas` nur die
 * gemeinsame Zeichenoberfläche (Transformationen, Pfade, Füllen/Streichen, `canvas.width/height`)
 * verwendet. Das Type-Predicate ersetzt einen Cast durch eine Laufzeitprüfung dieser Oberfläche;
 * ehrlicherweise ist der Fehlerzweig praktisch unerreichbar, weil jede Browserimplementierung
 * diese Methoden trägt — es ist ein Feigenblatt gegenüber `as`, kein echter Schutz. Derselbe
 * Grenzfall wie `looksLikeCanvasRenderingContext2D` in den Core-Tests.
 */
function isDrawableContext2D(value: object): value is CanvasRenderingContext2D {
  return (
    'canvas' in value &&
    'save' in value &&
    'restore' in value &&
    'scale' in value &&
    'beginPath' in value &&
    'fill' in value &&
    'stroke' in value &&
    'fillText' in value &&
    'getImageData' in value
  );
}

function offscreenCanvasLike(offscreen: OffscreenCanvas): CanvasLike {
  return {
    get width() {
      return offscreen.width;
    },
    set width(value: number) {
      offscreen.width = value;
    },
    get height() {
      return offscreen.height;
    },
    set height(value: number) {
      offscreen.height = value;
    },
    getContext(type: '2d') {
      const ctx = offscreen.getContext(type);
      if (ctx === null) return null;
      if (!isDrawableContext2D(ctx)) {
        throw new Error(
          'OffscreenCanvas liefert einen 2D-Kontext ohne die von renderCanvas benötigte Oberfläche.',
        );
      }
      return ctx;
    },
  };
}

function defaultCreateCanvas(width: number, height: number): CanvasLike {
  if (typeof OffscreenCanvas !== 'undefined') {
    return offscreenCanvasLike(new OffscreenCanvas(width, height));
  }
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error(
    'Keine Leinwand verfügbar: weder OffscreenCanvas noch document sind definiert. ' +
      'Übergib `createCanvas` (z. B. aus @napi-rs/canvas oder node-canvas).',
  );
}

/**
 * Rastert eine Zeichnung als RGBA-Bild für `map.addImage`. Die Maße entstehen als
 * `rasterDimensionsForWidth(viewBox, size × pixelRatio)` — also erst multiplizieren, dann die Höhe
 * proportional aufrunden. Das ist pixelgenauer als `rasterDimensionsForWidth(viewBox, size) ×
 * pixelRatio`: bei nichtquadratischer ViewBox kann die Höhe der naiven Rechnung um 1 px abweichen,
 * weil dort bereits die CSS-Höhe aufgerundet und der Rundungsfehler mitskaliert würde. Dieselbe
 * Regel wie bei allen anderen Rasterausgaben, damit ein Symbol auf der Karte die Proportionen des
 * Katalogs behält.
 */
export function createStyleImage(drawing: Drawing, options: SymbolImageOptions): StyleImageData {
  const pixelRatio = options.pixelRatio ?? 1;
  const widthPx = devicePixelWidth(options.size, pixelRatio);
  const raster = rasterDimensionsForWidth(drawing.viewBox, widthPx);

  const createCanvas = options.createCanvas ?? defaultCreateCanvas;
  const canvas = createCanvas(raster.widthPx, raster.heightPx);
  const ctx = canvas.getContext('2d');
  if (ctx === null) {
    throw new Error(
      'Die Leinwand liefert keinen 2D-Kontext — ein Symbolbild kann nicht gezeichnet werden.',
    );
  }

  // `renderCanvas` setzt bei `size` selbst `ctx.canvas.width/height` auf dieselben Maße und
  // skaliert den Kontext; wir übergeben die Gerätepixelbreite, nicht die CSS-Breite.
  renderCanvas(drawing, ctx, { size: raster.widthPx, theme: options.theme });
  const imageData = ctx.getImageData(0, 0, raster.widthPx, raster.heightPx);

  return { width: raster.widthPx, height: raster.heightPx, data: imageData.data };
}

/**
 * Rastert die Zeichnung und registriert sie unter `id` im Stil der Karte. Eine bereits belegte ID
 * ist ein Fehler: MapLibre selbst würde `addImage` mit einer stillen Warnung übergehen, und der
 * Aufrufer sähe dann das alte Bild unter dem neuen Namen.
 */
export function addSymbolImage(
  map: MapLike,
  id: string,
  drawing: Drawing,
  options: SymbolImageOptions,
): StyleImageData {
  if (map.hasImage(id)) {
    throw new Error(
      `Die Karte hat bereits ein Bild mit der ID "${id}". ` +
        'Entferne es zuerst (map.removeImage) oder wähle eine andere ID.',
    );
  }
  const image = createStyleImage(drawing, options);
  map.addImage(id, image, { pixelRatio: options.pixelRatio ?? 1 });
  return image;
}
