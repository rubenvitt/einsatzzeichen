import type { Length, Primitive } from './geometry.js';

/**
 * Eine Marke der Kopfzone, bezogen auf deren Oberkante — nicht auf das Zeichen als Ganzes.
 * `cyFromTopMm` ist der Abstand vom oberen Rand der Kopfzone zum Mittelpunkt der Marke.
 */
export interface HeadMark {
  cxMm: number;
  cyFromTopMm: number;
  rMm: number;
}

/**
 * Kopfzone eines Zeichens (Stärke, Verwaltungsstufe, …), relativ zu ihrer eigenen Oberkante.
 * Wo diese Oberkante absolut liegt, entscheidet `placeHead` aus `@einsatzzeichen/core` anhand
 * des Layoutprofils des Körpers — dieselbe `HeadShape` steht am Rechteckkörper 1 mm tiefer als
 * am gedrehten Quadrat. `HeadShape` selbst enthält deshalb nie absolute `cy`-Werte.
 *
 * In `schema` deklariert, nicht in `catalog` oder `core`: beide Pakete erzeugen bzw.
 * konsumieren `HeadShape`-Werte (`catalog` in `strengthHead`, `core` in der Komposition) und
 * hängen ohnehin von `schema` ab — eine zweite, strukturgleiche Deklaration wäre vermeidbare
 * Duplikation.
 */
export interface HeadShape {
  marks: readonly HeadMark[];
  heightMm: number;
}

/**
 * Kopfzone aus beliebigen, relativ zu ihrer Oberkante vermessenen Primitiven. Anders als
 * `HeadShape` legt sie keine Kreissemantik nahe; die absolute Platzierung bleibt Aufgabe des
 * Kompositionsmotors.
 */
export interface PrimitiveHeadShape {
  readonly heightMm: Length;
  readonly primitives: readonly Primitive[];
}

/** Separat vermessene Verwaltungsmarken, relativ zu ihrer Kopfzonen-Oberkante. */
export interface AdministrativeHeadShape {
  readonly box: {
    readonly xMm: Length;
    readonly yMm: Length;
    readonly widthMm: Length;
    readonly heightMm: Length;
  };
  readonly heightMm: Length;
  readonly primitives: readonly Primitive[];
}
