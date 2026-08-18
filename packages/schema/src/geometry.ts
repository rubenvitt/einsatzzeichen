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

/**
 * Fachliche Rolle eines Primitivs. Steuert Fingerprint-Vergleich und Kompositionslogik.
 *
 * `label` trägt die Beschriftungen **im** Körper (Anhang E: Kürzel in der Mitte,
 * Organisations- und Zusatzkürzel unten) und ist damit von `foot` unterschieden, das den
 * Textlauf **unterhalb** des Körpers bezeichnet. Beide sind Text, aber nicht dieselbe Zone:
 * `foot` hängt außen an der Körperunterkante, `label` liegt innen auf der Körperfläche und
 * trägt deshalb auch eine andere Farbe (weiß auf der Organisationsfarbe statt schwarz auf der
 * Oberfläche). `innerField` bleibt weiterhin unbelegt — es bezeichnet die *Fläche* des
 * Innenfelds, nicht ihre Beschriftung.
 *
 * `chassis` trägt die Fahrwerksmarken aus Kapitel 5.1 (Räder, Kette, Verbindungsstrich). Es ist
 * **nicht** `head` und **nicht** `foot`: `head` verankert an der Oberkante seiner Zone, `foot`
 * bezeichnet den Textlauf unterhalb des Körpers. Die Fahrwerkszone hängt an der
 * Körper**unterkante** und ist Geometrie, kein Text — gemessen an `5.1.1.x`:
 * Körperunterkante 26,0004 mm, Markenmitte 28,2501 mm, Markenradius 2,2501 mm.
 */
export type PrimitiveRole =
  | 'body'
  | 'innerField'
  | 'head'
  | 'chassis'
  | 'foot'
  | 'label'
  | 'pictogram';

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
      /**
       * Untere Einsatzgrenze dieses Laufs: die kleinste Rendergröße, für die der Autor Lesbarkeit
       * beansprucht. **Pixel, nicht Millimeter** — das einzige Feld im IR, das keine Länge ist,
       * weil es keine Eigenschaft der Zeichnung beschreibt, sondern ihrer Ausgabe.
       *
       * Sie sitzt am Lauf und nicht an der Definition, weil ein Zeichen mehrere Läufe
       * verschiedener Größe tragen kann (J.3.15: „VoIP" bei ~4 mm neben einem Großglyph bei
       * ~10 mm) — eine Grenze je Zeichen zwänge beide auf den Wert des schwächeren Laufs.
       *
       * Kein Freibrief: oberhalb der Grenze gilt `MINIMUM_TEXT_RENDER_PX` unverändert. Nicht
       * gesetzt heißt „beansprucht Lesbarkeit in jeder Rendergröße".
       */
      minRenderPx?: number;
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
