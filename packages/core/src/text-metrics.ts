import type { Drawing, Primitive } from '@einsatzzeichen/schema';

/**
 * Allgemeines Textmetrik-Gate (LFH-410).
 *
 * `boxMm` ist bei Text eine **Zusicherung des Autors, keine Messung** (siehe Typkommentar in
 * geometry.ts): `boundsOfMm` gibt sie unverändert zurück, `checkViewBox` prüft sie gegen die
 * viewBox, `checkBox` gegen die Piktogrammbox — aber bis hierher prüfte kein Gate, ob der Lauf
 * überhaupt **in** die Box passt. Eine zu klein deklarierte Box fiel nur dort auf, wo der
 * Katalog rastert (`pictograms/text-ink.test.ts`, `fonts.test.ts`), also nur für die Zeichen, die
 * es gibt, und nur in `catalog`.
 *
 * Dieses Modul schließt die Lücke in `core`, ohne dass `core` eine Schrift kennt: die Laufweite
 * kommt über `TextMetrics` von außen (Injektionspräzedenz: `checkTextLegibility` nimmt die
 * Rendergrößen als Parameter, damit `core` die Katalogwerte nicht kennt). Die Vertikale braucht
 * keine Injektion — dafür stehen die gemessenen Arimo-Anteile in `text-policy.ts`
 * (`verticalTextBoxMm`).
 *
 * **Ungekernte Vorschubsumme, an den Enden auf die Tinte gekürzt.** Die Rechnung setzt die
 * Glyphen mit ihren Vorschüben (Advances) hintereinander und nimmt als Tinte je Glyphe ihre
 * horizontale Bounding-Box (`inkExtentEm`) — die linke Seitenbreite der ersten und die rechte der
 * letzten Glyphe zählen damit nicht als Tinte. Das ist keine Feinheit: die handvermessenen Boxen
 * des Katalogs (Funktionsrollenläufe, Piktogrammkürzel) sitzen an der Tinte der Referenz, und
 * die reine Vorschubsumme überschritte sie um 0,02–0,09 em je Seite („EL" bei 10,61 mm: Box
 * 12,10 mm, Vorschubsumme 12,98 mm, Tinte 11,75 mm — Messung vom 28. August 2026, 8 px/mm).
 *
 * **Kerning, wenn die Quelle es kennt.** Ohne Kerning ist die Summe in Arimo fast immer zu groß
 * (die Paare sind überwiegend negativ) — konservativ, aber nicht exakt: „GW Tauchen" (I.2.2,
 * 4,63 mm) läge ungekernt 0,52 mm rechts über seiner Box, gerastert endet es genau auf der
 * Boxkante; das Paar „Ta" trägt −227/2048 em. `kerningEm` ist deshalb Teil der Schnittstelle,
 * optional, weil ein Doppel ohne Paare auskommt. Ob die Rechnung die gerasterte Tinte
 * tatsächlich überdeckt, ist trotzdem eine **Messfrage** und wird im Katalog belegt
 * (`packages/catalog/src/text-metrics.test.ts`, Kalibrierung gegen dieselbe Rasterung wie
 * `footInkAgainstBox` in fonts.test.ts).
 *
 * **Toleranz: ein Rasterpixel bei 8 px/mm** (`BOX_TOLERANCE_MM`). Die handvermessenen Boxen
 * des Katalogs liegen an der Tinte der Referenz auf 0,01–0,05 mm; gegen die Arimo-Instanz
 * bleiben Reste bis 0,07 mm („DMO" bei 9 mm: Tinte bis 26,07, Box bis 26,00; „MLW IV Lbw":
 * 30,06 gegen 30,00 — Messung vom 28. August 2026). Die Rasterevidenz des Katalogs lässt genau
 * einen Pixel durch (fonts.test.ts: 0 px Toleranz bei 8 px/mm, ein Pixel deckt 0,125 mm;
 * text-ink.test.ts: 2 px bei 16 px/mm = 0,125 mm). Das Gate übernimmt diese Schwelle und ist
 * damit so streng wie die Rasterprüfung, nicht strenger und nicht schwächer — eine kleinere
 * Schwelle meldete Boxen, die jede Rasterprüfung belegt, eine größere wäre nicht mehr aus der
 * Evidenz hergeleitet.
 *
 * **Vertikal inhaltsabhängig, und nur bei `baseline: 'alphabetic'`.** Eine inhaltsunabhängige
 * Soll-Box aus `verticalTextBoxMm` (Oberlänge + Unterlänge + Diakritika-Zuschlag) wäre für die
 * handvermessenen Katalogboxen falsch: „TEL" reserviert zu Recht keine Unterlänge, und 62
 * Läufe des Bestands (D.1–D.4, comms, leadership) fielen durch, obwohl ihre Rasterprüfung
 * (`text-ink.test.ts`, 512 px) sie belegt. Stattdessen gilt die Tinte des tatsächlichen
 * Inhalts: größtes yMax und kleinstes yMin seiner Glyphen um die Grundlinie, die bei
 * `alphabetic` exakt auf `y` liegt. Bei `hanging` liegt die Grundlinie um die Hanging-Metrik der
 * Schrift unter `y`, und die steht nicht in der Tabelle (BASE-Tabelle fehlt Arimo; resvg leitet
 * den Wert intern ab) — dort wird bewusst nicht geprüft, die Fußzone deckt der Rasterbeleg in
 * fonts.test.ts. `middle` bleibt `unmeasured-baseline`.
 *
 * Auch vertikal gilt `BOX_TOLERANCE_MM`, nicht 1e-9: die handvermessenen Boxen enden an der
 * Grundlinie, runde Glyphen (O, C, x) überschießen sie aber um −20/2048 em — bei 7 mm 0,068 mm
 * („DMO"), bei 9 mm 0,088 mm („Fax"), bei 14 mm 0,137 mm („C", comms.telephone-exchange).
 * Exakt geprüft fielen sieben Läufe des Bestands, alle um diesen Überschuss oder um
 * Handvermessungsreste ≤ 0,05 mm („Bezeichnung" 0,046 mm, „L" 0,005 mm); mit der
 * Rasterpixel-Toleranz bleibt allein „C" bei 14 mm, um 0,012 mm darüber — ein echter, wenn auch
 * unsichtbarer Befund, den das Gate meldet, statt die Schwelle danach zu biegen.
 */

/**
 * Laufweitenquelle einer Schrift. `core` definiert nur die Schnittstelle; wer sie erfüllt, kennt
 * die konkrete Schriftdatei (im Katalog: `ARIMO_TEXT_METRICS` aus `assets/arimo-metrics.json`).
 */
export interface TextMetrics {
  /**
   * Vorschub (Advance) einer Glyphe in em — Font-Einheiten geteilt durch `unitsPerEm` — der
   * Default-Instanz der Schrift. `undefined` für Codepoints, die die Schrift nicht führt (Tofu):
   * kein `.notdef`-Vorschub als stiller Ersatz, der Aufrufer muss den Fall sehen.
   */
  advanceEm(codepoint: number): number | undefined;
  /**
   * Tintenausdehnung der Glyphe relativ zu ihrem Ursprung, in em: `[xMin, yMin, xMax, yMax]`
   * ihrer Bounding-Box, y nach **oben** positiv (Font-Konvention, nicht SVG). Glyphen ohne Kontur
   * (Leerzeichen) liefern `[0, 0, 0, 0]`; unbekannte Codepoints wie bei `advanceEm` `undefined`.
   */
  inkExtentEm(codepoint: number): readonly [number, number, number, number] | undefined;
  /**
   * Kerning des Paars (links, rechts) in em — die Korrektur des Vorschubs der linken Glyphe,
   * meist negativ. Optional: ein Doppel ohne Paare lässt es weg, und die Rechnung bleibt dann
   * (für negative Paare) konservativ. `0` oder `undefined` für Paare ohne Eintrag.
   */
  kerningEm?(left: number, right: number): number | undefined;
}

export interface TextWidth {
  /** Summe der Vorschübe der **bekannten** Glyphen, in mm. Ohne unbekannte Glyphen vollständig. */
  widthMm: number;
  /** Zeichen, für die `metrics` keinen Vorschub kennt — leer, wenn die Breite verlässlich ist. */
  unknownCodepoints: string[];
}

/**
 * Ungekernte Breite eines Laufs: Summe der Vorschübe × Schriftgrad. Iteriert nach Codepoints
 * (`for…of`), nicht nach UTF-16-Einheiten — ein Zeichen außerhalb der BMP ist **eine** Glyphe.
 */
export function textWidthMm(content: string, sizeMm: number, metrics: TextMetrics): TextWidth {
  let em = 0;
  const unknownCodepoints: string[] = [];
  for (const { advanceEm, character } of glyphRun(content, metrics)) {
    if (advanceEm === undefined) {
      unknownCodepoints.push(character);
      continue;
    }
    em += advanceEm;
  }
  return { widthMm: em * sizeMm, unknownCodepoints };
}

interface GlyphStep {
  character: string;
  codepoint: number;
  /** Vorschub **einschließlich** Kerning zur folgenden Glyphe; `undefined` für Tofu. */
  advanceEm: number | undefined;
}

/**
 * Die Glyphenfolge eines Laufs mit ihren Vorschüben, Kerning zur jeweils nächsten bekannten
 * Glyphe eingerechnet. Ein Tofu unterbricht das Kerning auf beiden Seiten — für ein Paar mit
 * einer unbekannten Glyphe gibt es keinen Eintrag.
 */
function glyphRun(content: string, metrics: TextMetrics): GlyphStep[] {
  const steps: GlyphStep[] = [];
  for (const character of content) {
    const codepoint = character.codePointAt(0) ?? -1;
    steps.push({ character, codepoint, advanceEm: metrics.advanceEm(codepoint) });
  }
  if (metrics.kerningEm !== undefined) {
    for (let index = 0; index + 1 < steps.length; index++) {
      const left = steps[index];
      const right = steps[index + 1];
      if (left?.advanceEm === undefined || right?.advanceEm === undefined) continue;
      left.advanceEm += metrics.kerningEm(left.codepoint, right.codepoint) ?? 0;
    }
  }
  return steps;
}

type TextPrimitive = Extract<Primitive, { type: 'text' }>;

export interface TextRunMeasure extends TextWidth {
  /** Tintenbreite: von der linken Kante der ersten bis zur rechten Kante der letzten Kontur. */
  inkWidthMm: number;
  /** Linke Tintenkante, aus `anchor` um `x` gelegt. Ohne Tinte (nur Leerzeichen) gleich dem Ankerpunkt. */
  inkMinXMm: number;
  /** Rechte Tintenkante entsprechend. */
  inkMaxXMm: number;
  /** Tinte oberhalb der Grundlinie (größtes yMax), in mm — 0 ohne Tinte. */
  inkAscentMm: number;
  /** Tinte unterhalb der Grundlinie (−kleinstes yMin), in mm — 0 ohne Tinte. */
  inkDescentMm: number;
}

/**
 * Setzt die Glyphen mit ihren Vorschüben hintereinander und legt den Lauf nach `anchor` um `x`:
 * `start` beginnt bei `x`, `middle` zentriert die **Vorschubsumme**, `end` endet dort — dieselbe
 * Semantik wie SVGs `text-anchor` bzw. Canvas' `textAlign` (siehe `canvasTextAlign` in
 * text-policy.ts), die beide an der Vorschubsumme ausrichten, nicht an der Tinte. Die Tinte ist
 * dann die Vereinigung der Glyphen-Bounding-Boxen an ihren Stiftpositionen.
 *
 * Bei unbekannten Glyphen ist das Ergebnis unvollständig (`unknownCodepoints`); der Aufrufer
 * muss den Fall sehen, bevor er die Zahlen verwendet.
 */
export function measureTextRun(primitive: TextPrimitive, metrics: TextMetrics): TextRunMeasure {
  const width = textWidthMm(primitive.content, primitive.sizeMm, metrics);
  const offset =
    primitive.anchor === 'start' ? 0 : primitive.anchor === 'middle' ? width.widthMm / 2 : width.widthMm;
  const startXMm = primitive.x - offset;
  let penEm = 0;
  let inkMinEm = Number.POSITIVE_INFINITY;
  let inkMaxEm = Number.NEGATIVE_INFINITY;
  let ascentEm = 0;
  let descentEm = 0;
  for (const { advanceEm, codepoint } of glyphRun(primitive.content, metrics)) {
    const extent = metrics.inkExtentEm(codepoint);
    if (advanceEm === undefined || extent === undefined) continue;
    const [xMinEm, yMinEm, xMaxEm, yMaxEm] = extent;
    if (xMaxEm > xMinEm) {
      inkMinEm = Math.min(inkMinEm, penEm + xMinEm);
      inkMaxEm = Math.max(inkMaxEm, penEm + xMaxEm);
      ascentEm = Math.max(ascentEm, yMaxEm);
      descentEm = Math.max(descentEm, -yMinEm);
    }
    penEm += advanceEm;
  }
  if (!Number.isFinite(inkMinEm)) {
    inkMinEm = 0;
    inkMaxEm = 0;
  }
  return {
    ...width,
    inkWidthMm: (inkMaxEm - inkMinEm) * primitive.sizeMm,
    inkMinXMm: startXMm + inkMinEm * primitive.sizeMm,
    inkMaxXMm: startXMm + inkMaxEm * primitive.sizeMm,
    inkAscentMm: ascentEm * primitive.sizeMm,
    inkDescentMm: descentEm * primitive.sizeMm,
  };
}

export type TextMetricsRule =
  | 'unknown-glyph'
  | 'text-too-wide'
  | 'text-outside-box'
  | 'text-too-tall'
  | 'unmeasured-baseline';

/** Befundformat wie `ViewBoxIssue`: Regel, Primitivpfad, Klartext mit Zahlen. */
export interface TextMetricsIssue {
  rule: TextMetricsRule;
  primitive: string;
  detail: string;
}

/**
 * Wie weit die gerechnete Tinte über die Box hinausragen darf: ein Rasterpixel bei 8 px/mm,
 * die Auflösung der Rasterevidenz im Katalog (Herleitung im Modulkommentar oben). Kein
 * Spielraum für Geometrie — ein Lauf, der um mehr als das hinausragt, ist auch gerastert
 * außerhalb.
 */
export const BOX_TOLERANCE_MM = 0.125;


function formatMm(value: number): string {
  return `${Number(value.toFixed(3))} mm`;
}

function codepointLabel(character: string): string {
  const codepoint = character.codePointAt(0) ?? 0;
  return `"${character}" (U+${codepoint.toString(16).toUpperCase().padStart(4, '0')})`;
}

/**
 * Befunde eines einzelnen Laufs gegen seine eigene `boxMm`. Von `checkTextMetrics` für jede
 * Textprimitive aufgerufen und von `compose()` für die drei Läufe, die es selbst erzeugt
 * (Fußzone, Beschriftungen, Funktionsrollenläufe) — dieselbe Rechnung an beiden Stellen, damit
 * das Kompositions-Gate (LFH-411) und das allgemeine Gate (LFH-410) nicht auseinanderlaufen.
 */
export function textRunIssues(
  primitive: TextPrimitive,
  metrics: TextMetrics,
): Omit<TextMetricsIssue, 'primitive'>[] {
  const issues: Omit<TextMetricsIssue, 'primitive'>[] = [];
  const { xMm, yMm, widthMm, heightMm } = primitive.boxMm;
  const content = `"${primitive.content}"`;

  // `verticalTextBoxMm` wirft für `middle`; hier wird daraus ein Befund, kein Abbruch, damit ein
  // Gate über 525 Fälle nicht am ersten hängen bleibt.
  if (primitive.baseline === 'middle') {
    issues.push({
      rule: 'unmeasured-baseline',
      detail:
        `Lauf ${content}: baseline "middle" ist für die eingebundene Schrift nicht vermessen ` +
        '(siehe verticalTextBoxMm in text-policy.ts); die vertikale Box ist damit nicht prüfbar.',
    });
  }

  // Unbekannte Glyphen machen Breite und Höhe unverlässlich — Befund statt Ersatzwert, und die
  // Maßprüfungen entfallen für diesen Lauf (sie wären zu klein).
  const measure = measureTextRun(primitive, metrics);
  if (measure.unknownCodepoints.length > 0) {
    issues.push({
      rule: 'unknown-glyph',
      detail:
        `Lauf ${content} enthält Zeichen ohne Vorschub in der eingebundenen Schrift: ` +
        `${measure.unknownCodepoints.map(codepointLabel).join(', ')}.`,
    });
    return issues;
  }
  // Vertikal: Tinte des Inhalts um die Grundlinie, mit derselben Rasterpixel-Toleranz wie
  // horizontal — siehe Modulkommentar, warum nur `alphabetic` und warum nicht exakt.
  if (primitive.baseline === 'alphabetic') {
    const inkTopMm = primitive.y - measure.inkAscentMm;
    const inkBottomMm = primitive.y + measure.inkDescentMm;
    if (inkTopMm < yMm - BOX_TOLERANCE_MM || inkBottomMm > yMm + heightMm + BOX_TOLERANCE_MM) {
      issues.push({
        rule: 'text-too-tall',
        detail:
          `Lauf ${content} trägt Tinte von ${formatMm(inkTopMm)} bis ${formatMm(inkBottomMm)} ` +
          `(Grundlinie ${formatMm(primitive.y)}, ${formatMm(primitive.sizeMm)} Schriftgrad), ` +
          `die Box deckt ${formatMm(yMm)}…${formatMm(yMm + heightMm)}.`,
      });
    }
  }
  if (measure.inkWidthMm > widthMm + BOX_TOLERANCE_MM) {
    issues.push({
      rule: 'text-too-wide',
      detail:
        `Lauf ${content} misst ${formatMm(measure.inkWidthMm)} Tinte (ungekernt, Vorschubsumme ` +
        `${formatMm(measure.widthMm)}, bei ${formatMm(primitive.sizeMm)} Schriftgrad), ` +
        `die Box ist ${formatMm(widthMm)} breit.`,
    });
  } else if (
    measure.inkMinXMm < xMm - BOX_TOLERANCE_MM ||
    measure.inkMaxXMm > xMm + widthMm + BOX_TOLERANCE_MM
  ) {
    issues.push({
      rule: 'text-outside-box',
      detail:
        `Lauf ${content} (${formatMm(measure.inkWidthMm)} Tinte, anchor "${primitive.anchor}" bei ` +
        `x = ${formatMm(primitive.x)}) liegt bei ${formatMm(measure.inkMinXMm)}…` +
        `${formatMm(measure.inkMaxXMm)}, die Box deckt ${formatMm(xMm)}…${formatMm(xMm + widthMm)}.`,
    });
  }
  return issues;
}

/**
 * Prüft jeden Textlauf einer Zeichnung gegen seine `boxMm`, rekursiv durch Gruppen.
 *
 * Transformationen werden bewusst **nicht** angewendet: Lauf und Box stehen im selben lokalen
 * Koordinatensystem, und eine starre Transformation (translate, rotate) ändert ihr Verhältnis
 * nicht. Wo die Box am Ende auf dem Bildschirm liegt, prüft `checkViewBox` (dreht die Ecken mit)
 * — dieses Gate prüft nur, ob der Lauf in die Box passt.
 */
export function checkTextMetrics(drawing: Drawing, metrics: TextMetrics): TextMetricsIssue[] {
  const issues: TextMetricsIssue[] = [];
  function visit(primitive: Primitive, path: string): void {
    if (primitive.type === 'group') {
      primitive.children.forEach((child, index) => visit(child, `${path}.children[${index}]`));
      return;
    }
    if (primitive.type !== 'text') return;
    const label = primitive.role === undefined ? path : `${path} (${primitive.role})`;
    for (const issue of textRunIssues(primitive, metrics)) {
      issues.push({ ...issue, primitive: label });
    }
  }
  drawing.children.forEach((primitive, index) => visit(primitive, `children[${index}]`));
  return issues;
}
