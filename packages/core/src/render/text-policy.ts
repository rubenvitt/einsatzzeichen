/**
 * Renderpolitik für Text. Sie steht hier und nicht im Primitiv, weil sie für jeden Text
 * dieselbe ist: eine Schriftfamilie, kein gesetztes Gewicht. Ein nicht gesetztes Gewicht ist
 * eine Achse weniger, die einen Snapshot verschieben kann.
 */
export const TEXT_FONT_FAMILY_ATTR = 'Arimo';

/**
 * SVGs `dominant-baseline` kennt kein `middle` — der nächstliegende Wert heißt `central`.
 * Canvas' `textBaseline` kennt dagegen `middle` wörtlich. Beide Abbildungen leben hier, nicht
 * verstreut in den Renderern, weil sonst eine Änderung an einer Stelle in der anderen vergessen
 * werden könnte und SVG/Canvas für dasselbe Primitiv verschieden auflösten.
 */
const SVG_BASELINE_ATTR = {
  alphabetic: 'alphabetic',
  middle: 'central',
  hanging: 'hanging',
} as const;

const CANVAS_BASELINE_ATTR = {
  alphabetic: 'alphabetic',
  middle: 'middle',
  hanging: 'hanging',
} as const;

export type TextBaseline = keyof typeof SVG_BASELINE_ATTR;

export function baselineAttr(baseline: TextBaseline): string {
  return SVG_BASELINE_ATTR[baseline];
}

export function canvasBaseline(baseline: TextBaseline): CanvasTextBaseline {
  return CANVAS_BASELINE_ATTR[baseline];
}

/**
 * SVGs `text-anchor` nimmt `start`/`middle`/`end` wörtlich — dieselben Werte wie unser
 * `anchor`-Feld, deshalb keine eigene Abbildung dafür in svg.ts nötig. Canvas' `textAlign`
 * kennt dagegen kein `middle`, sondern `center`; `start`/`end` stimmen wieder überein.
 */
const CANVAS_ANCHOR_ATTR = {
  start: 'start',
  middle: 'center',
  end: 'end',
} as const;

export type TextAnchor = keyof typeof CANVAS_ANCHOR_ATTR;

export function canvasTextAlign(anchor: TextAnchor): CanvasTextAlign {
  return CANVAS_ANCHOR_ATTR[anchor];
}
