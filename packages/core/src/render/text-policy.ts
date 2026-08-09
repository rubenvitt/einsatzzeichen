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

/**
 * Effektiver Schriftgrad eines Textprimitivs in Pixeln bei einer gegebenen Rendergröße. Reine
 * Rechnung, keine Fontmetrik: `sizeMm` skaliert im selben Verhältnis wie jede andere Millimeter-
 * Koordinate — `viewBoxMm` auf `renderPx` abgebildet. Was die konkreten Glyphen von Arimo daraus
 * machen (Kappenhöhe, Laufweite), beantwortet diese Funktion nicht; dafür bräuchte sie Zustand
 * und eine Fontbindung, die hier laut Aufgabenrahmen nicht hin darf.
 */
export function effectiveTextPx(sizeMm: number, renderPx: number, viewBoxMm: number): number {
  return (sizeMm / viewBoxMm) * renderPx;
}

/**
 * Ab diesem effektiven Schriftgrad bleibt ein drei- bis vierstelliges Großbuchstaben-Kürzel aus
 * Anhang J (z. B. „HRT", „FRT", „VoIP") lesbar. Kein berechneter, sondern ein **visuell geprüfter**
 * Wert — wie `MINIMUM_NON_TEXT_CONTRAST` eine dokumentierte Aussage, kein Magic Value:
 *
 * „HRT", „FRT" und „VoIP" wurden bei 10 mm Schriftgrad auf der 32-mm-Standard-viewBox in allen
 * sechs Snapshotgrößen (16/24/32/64/128/256 px) mit Arimo gerastert (`resvgFontOptions()`) und
 * angesehen. Bei 5,0 px effektivem Schriftgrad (16-px-Render) verschwimmen die Buchstaben zu
 * grauen Flächen ohne erkennbare Formen. Bei 7,5 px (24-px-Render) sind einzelne Buchstaben bei
 * „HRT" mit Mühe zu erraten, bei „VoIP" verschmelzen sie zu einem ununterscheidbaren Klecks — vier
 * schmale Zeichen brauchen mehr Fläche pro Buchstabe als drei. Ab 10,0 px (32-px-Render) sind alle
 * drei Kürzel scharf, schwarz und ohne Zweifel lesbar. Die Schwelle liegt bewusst zwischen den
 * beiden Messpunkten 7,5 und 10,0 px, nicht auf einem von ihnen.
 */
export const MINIMUM_TEXT_RENDER_PX = 8;
