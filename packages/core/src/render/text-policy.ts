/**
 * Renderpolitik für Text. Sie steht hier und nicht im Primitiv, weil sie für jeden Text
 * dieselbe ist: eine Schriftfamilie. Das Gewicht steht dagegen am Primitiv (`fontWeight`), weil
 * die Textmetrik je Lauf den passenden Schnitt wählen muss; welches Gewicht der Katalog setzt,
 * legt `CATALOG_TEXT_FONT_WEIGHT` unten fest.
 *
 * Einzige Quelle des Literals: `catalog`s `TEXT_FONT_FAMILY` (fonts.ts, für `resvgFontOptions()`)
 * bezieht seinen Wert von hier über den Reexport in core/src/index.ts, statt ihn zu wiederholen —
 * die Abhängigkeitsrichtung catalog → core ist bereits gegeben. Eine künftige Umbenennung der
 * Schriftfamilie kann so nicht mehr in den beiden Paketen auseinanderlaufen.
 */
export const TEXT_FONT_FAMILY_ATTR = 'Einsatzzeichen Sans';

/**
 * Das eine Schriftgewicht allen Katalogtexts: 500 („Medium"), LFH-585 Option B (entschieden am
 * 29. September 2026). Die Referenz setzt jeden Lauf in derselben Strichstärke, 0,156 ×
 * Versalhöhe; Einsatzzeichen Sans 500 trifft sie genau (400 liegt bei 0,117, 700 bei 0,211;
 * Notiz LFH-790 §10.4). Die frühere Aufteilung in normal und fett hatte in der Referenz kein
 * Gegenstück.
 *
 * Jede Stelle in core, die Katalogtext erzeugt (Kompositionsläufe samt Fußzone,
 * Piktogramm-Hilfen, Funktionsrollen), setzt dieses Gewicht ausdrücklich ans Primitiv. Eine
 * Prüfung im Katalog (`conformance/src/catalog-text-weight.test.ts`) hält fest, dass kein Lauf
 * ohne es bleibt. Einzige Ausnahme sind die Lückenbeschriftungen der Grenzlinien aus Kapitel 2
 * (`gapLabel` in `geometry/parametric.ts`): Dort misst die Referenz 0,126 × Versalhöhe, nahe an
 * der Stufe 400, und sie bleiben ohne Gewicht.
 * Gerastert wird es aus der statischen Instanz `EinsatzzeichenSans-Medium.ttf`; ihre Versalhöhe
 * gleicht der normalen (698/1000), `TEXT_CAP_HEIGHT_FRACTION` gilt unverändert.
 */
export const CATALOG_TEXT_FONT_WEIGHT = 500;

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
 * Koordinate — `viewBoxMm` auf `renderPx` abgebildet. Was die konkreten Glyphen der Schrift daraus
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
 * sechs Snapshotgrößen (16/24/32/64/128/256 px) gerastert (`resvgFontOptions()`) und angesehen,
 * zuerst mit Arimo, mit ESZ-114 erneut mit Einsatzzeichen Sans in Stufe 500. Bei 5,0 px effektivem
 * Schriftgrad (16-px-Render) verschwimmen die Buchstaben zu grauen Flächen ohne erkennbare Formen.
 * Bei 7,5 px (24-px-Render) waren in Arimo einzelne Buchstaben bei „HRT" mit Mühe zu erraten und
 * „VoIP" ein ununterscheidbarer Klecks; in Einsatzzeichen Sans sind alle drei zu lesen, aber weich,
 * „VoIP" am knappsten. Ab 10,0 px (32-px-Render) sind alle drei Kürzel scharf, schwarz und ohne
 * Zweifel lesbar. Die Schwelle liegt bewusst zwischen den beiden Messpunkten 7,5 und 10,0 px, nicht
 * auf einem von ihnen; die neue Schrift gibt keinen Anlass, sie zu senken.
 */
export const MINIMUM_TEXT_RENDER_PX = 8;

/**
 * Zuschlag für Großbuchstaben-Diakritika (Ä/Ö/Ü), die bei `baseline: 'hanging'` über die
 * deklarierte `boxMm`-Oberkante hinausragen — Befund aus Task 9 der Textprimitiv-Slice
 * (`outsideBoxCount: 24` für „Übung"). `dominant-baseline="hanging"` positioniert den
 * Ankerpunkt an der Hanging-Metrik der Schrift, die unterhalb der tatsächlichen
 * Diakritikaoberkante liegt: der Akzent auf Ü/Ö/Ä ragt darüber hinaus.
 *
 * **Gemessen** mit `scripts/font/measure-vertical.mts` (`resvgFontOptions()`, Ä/Ö/Ü, „Übung"
 * und „ÄÖÜ", `baseline: 'hanging'`, 4 mm und 10 mm Schriftgrad). Der Überstand ist relativ zu
 * `sizeMm`, nicht absolut:
 * - Arimo (bis ESZ-114): asymptotisch 11,3–11,4 %, bei der Auflösung der Rasterevidenz in
 *   `fonts.test.ts` (8 px/mm) bindend 12,5 % bei 4 mm. Daher der Wert.
 * - Einsatzzeichen Sans (ESZ-114): asymptotisch 7,3 % in 400 und 8,1 % in 500, bei 8 px/mm
 *   bindend 9,4 % (Ä bei 4 mm).
 *
 * Der Wert bleibt bei 12,5 %: Er deckt die neue Schrift mit Abstand, und ihn zu senken, würde
 * jede Fußzone um bis zu 0,12 mm verschieben, ohne dass eine Zeichnung davon profitiert. Bei der
 * bindenden Auflösung liegt die Boxoberkante deshalb heute rund 0,12 mm über der obersten
 * Ink-Zeile (bei 4 mm Schriftgrad). Eine künftige Schrift mit höheren Akzenten lässt die
 * Rasterprüfung in `fonts.test.ts` sofort anschlagen; `resvg-js` ist auf 2.6.2 gepinnt, die
 * Schriftdatei über `TEXT_FONT_SHA256`.
 */
export const DIACRITIC_HEADROOM_FRACTION = 0.125;

/**
 * Tinte oberhalb der Grundlinie bei `baseline: 'alphabetic'`, als Anteil von `sizeMm` — die
 * eigene Messreihe, die der `hanging`-Kommentar oben für diesen Fall verlangt. Die
 * Beschriftungszonen aus Anhang E sind an ihrer **Grundlinie** vermessen (18 mm bzw. 24 mm in
 * allen 16 E.1-Dateien des ersten Teilslice); `alphabetic` ist damit die Baseline, die die
 * Messung wörtlich wiedergibt, statt sie über eine zweite Metrik umzurechnen.
 *
 * **Gemessen für Einsatzzeichen Sans** mit `scripts/font/measure-vertical.mts`
 * (`resvgFontOptions()`, Grundlinie fest, Ink-Hülle über den Alphakanal), bei 7,08 mm und
 * 4,24 mm über „Öl", „ÄÖÜ", „Sp", „jgpqy", „Qj", „B" und „THW", in 400 und 500:
 * - Asymptotisch (128 px/mm): **0,893** in 400, **0,901** in 500, bindend „Öl" — der
 *   Umlautpunkt, nicht die Versalhöhe (0,698). Das Ö reicht 0,900 em hoch.
 * - Bei der Auflösung der Rasterevidenz in `fonts.test.ts` (256 px auf 32 mm = 8 px/mm):
 *   **0,9139** in beiden Stufen, „Öl" bei 4,24 mm. Das ist der bindende Wert.
 *
 * 0,92 rundet ihn auf die nächste saubere Stelle auf. Der Wert bleibt unterhalb des deklarierten
 * hhea-Ascenders (1,025) — die Box ist also enger als die Zeilenmetrik der Schrift und keine
 * bloße Übernahme ihrer Tabellenwerte. Mit Arimo lag er bei 0,86 (bindend 0,8563); die Umlaute
 * von Einsatzzeichen Sans stehen höher über der Versalhöhe.
 */
export const ALPHABETIC_ASCENT_FRACTION = 0.92;

/**
 * Versalhöhe von Einsatzzeichen Sans als Anteil des Schriftgrads. Aus der Schriftdatei selbst
 * gelesen (`OS/2.sCapHeight` 698 bei `head.unitsPerEm` 1000, gleich der Tinte von „H" in allen
 * vier Instanzen). Mit Arimo war es 1409/2048 = 0,688.
 *
 * Sie steht hier, weil die Referenzvermessung Zeichen **misst**, aber Schriftgrade **setzt**:
 * an den Referenzdateien ist die Versalhöhe eines Kürzels ablesbar, der Schriftgrad nicht (die
 * Glyphen liegen in Kurven umgewandelt vor, ohne Fontbindung). Ein Aufrufer rechnet mit dieser
 * Konstante von der gemessenen Größe auf die zu setzende um, statt einen Schriftgrad zu raten,
 * der zufällig ähnlich aussieht.
 */
export const TEXT_CAP_HEIGHT_FRACTION = 698 / 1000;

/**
 * Schriftgrad, dessen Versalhöhe `capHeightMm` misst. Für Läufe, deren Größe an der Referenz als
 * Versalhöhe abgelesen ist: Sie schreiben die gemessene Höhe hin, nicht einen Schriftgrad, der nur
 * für eine bestimmte Schrift stimmt. Seit ESZ-114 (Wechsel von Arimo auf Einsatzzeichen Sans) steht
 * jeder Piktogrammlauf so; ein Schriftwechsel ändert dann nur `TEXT_CAP_HEIGHT_FRACTION`.
 */
export function textSizeForCapHeightMm(capHeightMm: number): number {
  return capHeightMm / TEXT_CAP_HEIGHT_FRACTION;
}

/**
 * Tinte unterhalb der Grundlinie bei `baseline: 'alphabetic'`, als Anteil von `sizeMm`.
 * Dieselbe Messreihe wie `ALPHABETIC_ASCENT_FRACTION`. Für Einsatzzeichen Sans asymptotisch
 * **0,2108**, bei 8 px/mm **0,2064**, jeweils an „jgpqy" — die Unterlängen, nicht der
 * Rundungsüberstand.
 *
 * Der Wert stammt aus der Arimo-Messung (bindend 0,21186 an „Sp", aufgerundet 0,212) und bleibt:
 * Er deckt die neue Schrift, und ihn um 0,001 zu senken, verschöbe jede Beschriftungszone für
 * nichts. Der deklarierte hhea-Descender von Einsatzzeichen Sans (0,275) liegt deutlich darunter.
 */
export const ALPHABETIC_DESCENT_FRACTION = 0.212;

/**
 * Vertikale `boxMm`-Ausdehnung, die ein Textprimitiv braucht, um seine Tinte nicht
 * abzuschneiden — Gegenstück zur reinen `effectiveTextPx`-Rechnung oben, die absichtlich keine
 * Fontmetrik kennt. Diese Funktion kennt auch keine echte Fontmetrik, sondern nur die
 * gemessenen Anteile (`DIACRITIC_HEADROOM_FRACTION`, `ALPHABETIC_ASCENT_FRACTION`,
 * `ALPHABETIC_DESCENT_FRACTION`) und wendet sie an, statt sie an jeder Aufrufstelle einzeln zu
 * wiederholen.
 *
 * Zwei der drei Baselines sind gemessen: `hanging` (Fußzone, Slice vom 9. August 2026) und
 * `alphabetic` (Beschriftungszonen im Körper, Anhang E). `middle` bleibt ungemessen und wirft
 * weiterhin bewusst, statt eine ungeprüfte Zahl zu raten — die Central-Metrik der Schrift liegt
 * weder auf der Grundlinie noch auf der Hanging-Linie.
 */
export function verticalTextBoxMm(
  anchorYMm: number,
  sizeMm: number,
  baseline: TextBaseline,
): { topMm: number; heightMm: number } {
  if (baseline === 'hanging') {
    const headroomMm = sizeMm * DIACRITIC_HEADROOM_FRACTION;
    return { topMm: anchorYMm - headroomMm, heightMm: sizeMm + headroomMm };
  }
  if (baseline === 'alphabetic') {
    const ascentMm = sizeMm * ALPHABETIC_ASCENT_FRACTION;
    const descentMm = sizeMm * ALPHABETIC_DESCENT_FRACTION;
    return { topMm: anchorYMm - ascentMm, heightMm: ascentMm + descentMm };
  }
  throw new Error(
    `verticalTextBoxMm: keine gemessene Textmetrik für baseline "${baseline}" — ` +
      'erst messen (siehe die Anteils-Konstanten oben), bevor ein Aufrufer sie nutzt.',
  );
}
