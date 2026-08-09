/** Alle Längen im IR sind Millimeter. Die Umrechnung geschieht ausschließlich im Renderer. */
export type Length = number;

export type Point = readonly [Length, Length];

export type ColorToken =
  | 'schwarz'
  | 'weiss'
  | 'rot'
  | 'blau'
  | 'gelb'
  | 'gruen'
  | 'hellgruen'
  | 'orange'
  | 'braun'
  | 'grau'
  | 'hellgrau'
  | 'hellblau';

/** Hexfarbe am Rendererrand. Das IR selbst trägt weiterhin ausschließlich semantische Tokens. */
export type RgbHex = `#${string}`;

/** Ein Theme muss jeden Farbtoken auflösen; partielle Paletten würden still auf Defaults fallen. */
export type ColorPalette = Readonly<Record<ColorToken, RgbHex>>;

/** Aus dem BABZ-Referenzbestand abgeleitete Organisations- und Signalfarben. */
export const PALETTE: ColorPalette = Object.freeze({
  schwarz: '#000000',
  weiss: '#ffffff',
  rot: '#fa1919',
  blau: '#003296',
  gelb: '#fafa00',
  gruen: '#14a01e',
  hellgruen: '#64dc32',
  orange: '#fa8c00',
  braun: '#b4783c',
  grau: '#787878',
  hellgrau: '#bebebe',
  hellblau: '#3264fa',
});

export const DEFAULT_STROKE_WIDTH_MM = 0.5;
export const DEFAULT_VIEWBOX_MM = { width: 32, height: 32 } as const;

/** Drehung um einen expliziten Mittelpunkt. Die Referenz zeichnet gedrehte Quadrate so. */
export interface Rotation {
  angle: number;
  cx: Length;
  cy: Length;
}

/**
 * Verschiebung in Millimetern. Ausschließlich an Gruppen belegt: an einem Primitiv, das zugleich
 * `rotate` trägt, hätte sie dasselbe Problem wie `shiftY` — sie träfe die Koordinate, nicht das
 * Rotationszentrum. Auf der Gruppe wirkt sie nach außen auf das fertige Ergebnis und ist damit
 * von der Drehung der Kinder unabhängig.
 */
export interface Translation {
  dxMm: Length;
  dyMm: Length;
}

export interface Transform {
  rotate?: Rotation;
  translate?: Translation;
}

/** Fachliche Rolle eines Primitivs. Steuert Fingerprint-Vergleich und Kompositionslogik. */
export type PrimitiveRole = 'body' | 'innerField' | 'head' | 'foot' | 'pictogram';

export interface Style {
  fill?: ColorToken | 'none';
  stroke?: ColorToken | 'none';
  strokeWidth?: Length;
  fillRule?: 'nonzero' | 'evenodd';
}

interface PrimitiveBase {
  style?: Style;
  transform?: Transform;
  role?: PrimitiveRole;
}

export type Primitive =
  | (PrimitiveBase & {
      type: 'rect';
      x: Length;
      y: Length;
      width: Length;
      height: Length;
      rx?: Length;
    })
  | (PrimitiveBase & { type: 'circle'; cx: Length; cy: Length; r: Length })
  | (PrimitiveBase & { type: 'line'; x1: Length; y1: Length; x2: Length; y2: Length })
  | (PrimitiveBase & { type: 'polyline'; points: readonly Point[]; closed?: boolean })
  | (PrimitiveBase & { type: 'path'; d: string })
  /**
   * Text. Die einzige Primitivart, deren Ausdehnung nicht berechenbar ist — sie hängt an
   * Fontmetrik, Schriftgrad und Laufweite. `boxMm` ist deshalb **keine Messung**, sondern eine
   * Zusicherung des Autors, in die der Text zu passen hat; `boundsOfMm` gibt sie unverändert
   * zurück, und die Gates prüfen gegen sie statt gegen die Glyphen.
   *
   * Die Schriftfamilie steht bewusst nicht hier: es gibt genau eine, und sie gehört in die
   * Renderpolitik, nicht in jedes Primitiv.
   */
  | (PrimitiveBase & {
      type: 'text';
      content: string;
      x: Length;
      y: Length;
      sizeMm: Length;
      anchor: 'start' | 'middle' | 'end';
      baseline: 'alphabetic' | 'middle' | 'hanging';
      boxMm: { xMm: Length; yMm: Length; widthMm: Length; heightMm: Length };
    })
  | (PrimitiveBase & { type: 'group'; children: readonly Primitive[] });

export interface Drawing {
  viewBox: { readonly width: Length; readonly height: Length };
  children: readonly Primitive[];
  /** Wird als <title> ausgegeben und für A11y verwendet. */
  title?: string;
  /** Wird als <desc> ausgegeben. */
  description?: string;
}
