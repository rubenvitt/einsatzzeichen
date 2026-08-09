/**
 * Renderpolitik für Text. Sie steht hier und nicht im Primitiv, weil sie für jeden Text
 * dieselbe ist: eine Schriftfamilie, kein gesetztes Gewicht. Ein nicht gesetztes Gewicht ist
 * eine Achse weniger, die einen Snapshot verschieben kann.
 *
 * Einzige Quelle des Literals: `catalog`s `TEXT_FONT_FAMILY` (fonts.ts, für `resvgFontOptions()`)
 * bezieht seinen Wert von hier über den Reexport in core/src/index.ts, statt ihn zu wiederholen —
 * die Abhängigkeitsrichtung catalog → core ist bereits gegeben. Eine künftige Umbenennung der
 * Schriftfamilie kann so nicht mehr in den beiden Paketen auseinanderlaufen.
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

/**
 * Zuschlag für Großbuchstaben-Diakritika (Ä/Ö/Ü), die bei `baseline: 'hanging'` über die
 * deklarierte `boxMm`-Oberkante hinausragen — Befund aus Task 9 der Textprimitiv-Slice
 * (`outsideBoxCount: 24` für „Übung"). `dominant-baseline="hanging"` positioniert den
 * Ankerpunkt an der Hanging-Metrik der Schrift, die bei Arimo unterhalb der tatsächlichen
 * Diakritikaoberkante liegt: der Akzent auf Ü/Ö/Ä ragt darüber hinaus.
 *
 * **Gemessen für Arimo** (`resvgFontOptions()`, einzelne Buchstaben Ä/Ö/Ü sowie „Übung",
 * `baseline: 'hanging'`), zwei Schriftgrade:
 * - Asymptotisch (hochauflösend gerastert, 1024–4096 px auf 32-mm-viewBox, damit
 *   Pixelraster-Rauschen herausgemittelt ist): der Überstand konvergiert auf **11,3–11,4 %**
 *   von `sizeMm`, für 4 mm wie für 10 mm gleichermaßen — der Wert ist relativ zu `sizeMm`,
 *   nicht absolut.
 * - Bei der Auflösung, mit der die Rasterevidenz in `fonts.test.ts` tatsächlich prüft
 *   (256 px auf 32-mm-viewBox = 8 px/mm) rundet das Pixelraster ungünstiger: bei 4 mm
 *   Schriftgrad braucht es exakt 0,5 mm (12,5 % von `sizeMm`) Zuschlag, damit kein Ink-Pixel
 *   mehr außerhalb der Box liegt — der 10-mm-Fall braucht bei derselben Auflösung nur 11,25 %.
 *   Der 4-mm-Fall ist damit der bindende, nicht der asymptotische Wert.
 *
 * Eine andere Schrift als Arimo hätte andere Akzenthöhen und bräuchte eine eigene Messung —
 * dieser Wert ist keine Konstante der Textprimitiv-Spezifikation, sondern eine Eigenschaft der
 * konkret eingebundenen Schriftdatei.
 *
 * Bei der bindenden Auflösung (4 mm, 8 px/mm) landet die neue Boxoberkante exakt auf der
 * obersten Ink-Zeile — null Pixel Spielraum, kein zusätzliches Polster. Das ist beabsichtigt und
 * kein Bug: `resvg-js` ist auf 2.6.2 gepinnt, die Schriftdatei über `TEXT_FONT_SHA256`, also
 * deterministisch. Eine künftige Schrift mit höheren Akzenten lässt die Rasterprüfung in
 * `fonts.test.ts` sofort wieder anschlagen (Task 4: "muss bei einem Schriftwechsel wieder
 * anschlagen") — genau das ist der Zweck, kein Grund, den Bruch vorsorglich höher zu setzen.
 */
export const DIACRITIC_HEADROOM_FRACTION = 0.125;

/**
 * Vertikale `boxMm`-Ausdehnung, die ein Textprimitiv braucht, um Diakritika über
 * Großbuchstaben nicht abzuschneiden — Gegenstück zur reinen `effectiveTextPx`-Rechnung oben,
 * die absichtlich keine Fontmetrik kennt. Diese Funktion kennt auch keine echte Fontmetrik,
 * sondern nur den einen gemessenen Zuschlag (`DIACRITIC_HEADROOM_FRACTION`) und wendet ihn an,
 * statt ihn an jeder Aufrufstelle einzeln zu wiederholen (aktuell nur `compose.ts`s Fußzone,
 * aber ein zweiter Aufrufer würde sonst denselben Bruch erneut hinschreiben müssen).
 *
 * Nur für `baseline: 'hanging'` gemessen und implementiert — der einzige Fall, den `compose.ts`
 * heute erzeugt. `alphabetic`/`middle` bräuchten eine eigene Messreihe (Kapitälchenhöhe bzw.
 * Über-/Unterlänge relativ zur Grundlinie sind andere Größen als der Hanging-Überstand) und
 * werfen deshalb bewusst, statt eine ungeprüfte Zahl zu raten.
 */
export function verticalTextBoxMm(
  anchorYMm: number,
  sizeMm: number,
  baseline: TextBaseline,
): { topMm: number; heightMm: number } {
  if (baseline !== 'hanging') {
    throw new Error(
      `verticalTextBoxMm: kein gemessener Diakritika-Zuschlag für baseline "${baseline}" — ` +
        'erst messen (siehe DIACRITIC_HEADROOM_FRACTION-Kommentar), bevor ein Aufrufer sie nutzt.',
    );
  }
  const headroomMm = sizeMm * DIACRITIC_HEADROOM_FRACTION;
  return { topMm: anchorYMm - headroomMm, heightMm: sizeMm + headroomMm };
}
