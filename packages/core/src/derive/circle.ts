import {
  DEFAULT_STROKE_WIDTH_MM,
  type BodyLabels,
  type BodyVariantId,
  type Primitive,
  type Style,
  type SymbolKind,
} from '@einsatzzeichen/schema';
import type { BoundsMm } from '../bounds.js';
import {
  ALPHABETIC_ASCENT_FRACTION,
  ALPHABETIC_DESCENT_FRACTION,
  ARIMO_CAP_HEIGHT_FRACTION,
} from '../render/text-policy.js';
import { noteDerivation } from './record.js';

/**
 * Abgeleitete Kreiskörper (Entscheidung des Eigentümers vom 2. Oktober 2026): Funktionsstelle
 * `post` (r 14 um (16|16)) und der 12-mm-Kreis `circle-12` mit seinen Varianten.
 *
 * Vermessen sind am Kreis wenige Lagen — F.3 (12-mm-Kreis, Kürzel oben links außerhalb), G.3.5
 * (gebänderter Kreis), N.2.3 (angehobener Kreis) und die Ortszeichen D.2.3 bis D.2.5 (mittiger
 * Lauf). Dieses Modul schließt die übrigen Lagen aus diesen Fassungen und vermerkt jede Ableitung
 * über `noteDerivation()`. Vermessene Specs erreichen keinen der Zweige, die eine Notiz schreiben.
 *
 * **Importgrenze.** `validate.ts` liest `CIRCLE_VARIANT_PAIRS`, `compose.ts` importiert
 * `validate.ts`, `base-symbols.ts` liest die Variantenkörper: dieses Modul darf deshalb nur Schema,
 * Hüllentypen, die Textpolitik und den Notizsammler importieren — nie Komposition, Validierung,
 * Profile oder Grundzeichen.
 */

/**
 * Die Art-/Variantenpaare an Kreiskörpern, die kein Original zeigt und die der Motor aus den
 * 12-mm-Fassungen ableitet. Körper (`POST_VARIANT_BODIES`, `POST_VARIANT_EXTRAS`) und Profile
 * (`layout/profiles.ts`) stehen für jedes Paar bereit; `body-variant-requires-measured-kind`
 * lässt sie zu, sobald die Körpervarianten-Ableitung sie aufnimmt.
 *
 * Die drei 12-mm-Paare `circle-12/raised-gable`, `circle-12/raised-circle-1mm` und
 * `circle-12/foot-band` sind vermessen (F.3.5, N.2.3, G.3.1 bis G.3.5) und stehen nicht hier.
 */
export const CIRCLE_VARIANT_PAIRS: readonly {
  readonly kind: SymbolKind;
  readonly bodyVariant: BodyVariantId;
}[] = Object.freeze([
  Object.freeze({ kind: 'post', bodyVariant: 'raised-gable' } as const),
  Object.freeze({ kind: 'post', bodyVariant: 'raised-circle-1mm' } as const),
  Object.freeze({ kind: 'post', bodyVariant: 'foot-band' } as const),
]);

/** Ob ein Paar eines der abgeleiteten Kreispaare ist. */
export function isDerivedCircleVariant(kind: SymbolKind, variant: BodyVariantId | undefined): boolean {
  return variant !== undefined &&
    CIRCLE_VARIANT_PAIRS.some((pair) => pair.kind === kind && pair.bodyVariant === variant);
}

const OUTLINE: Style = {
  fill: 'none',
  stroke: 'schwarz',
  strokeWidth: DEFAULT_STROKE_WIDTH_MM,
};

const SOLID: Style = { fill: 'schwarz', stroke: 'none' };

/** Vier Nachkommastellen wie die erzeugten Pfade in `base-symbols.ts`. */
function mm(value: number): number {
  return Number(value.toFixed(4));
}

/**
 * Ein Kreisbogen als Kubik von `fromRad` nach `toRad` (SVG-Winkel, y nach unten), ohne den
 * Startpunkt. Für Bögen bis 90° liegt die Näherung unter 0,0003 · r.
 */
function arcCubic(cx: number, cy: number, r: number, fromRad: number, toRad: number): string {
  const k = (4 / 3) * Math.tan((toRad - fromRad) / 4) * r;
  const x0 = cx + r * Math.cos(fromRad);
  const y0 = cy + r * Math.sin(fromRad);
  const x1 = cx + r * Math.cos(toRad);
  const y1 = cy + r * Math.sin(toRad);
  const c1x = x0 - k * Math.sin(fromRad);
  const c1y = y0 + k * Math.cos(fromRad);
  const c2x = x1 + k * Math.sin(toRad);
  const c2y = y1 - k * Math.cos(toRad);
  return `C ${mm(c1x)} ${mm(c1y)} ${mm(c2x)} ${mm(c2y)} ${mm(x1)} ${mm(y1)}`;
}

/**
 * Das Kreissegment zwischen einer waagerechten Sehne und dem Kreisrand, als gefüllter Pfad:
 * Sehne, dann zwei Bögen über den Scheitel. Dieselbe Bauart wie das Fußband von
 * `circle-12/foot-band` (base-symbols.ts) und die Kappe des Piktogramms `control-center`.
 */
export function circleSegmentPath(
  cx: number,
  cy: number,
  r: number,
  chordYMm: number,
  side: 'top' | 'bottom',
): string {
  const start = Math.asin((chordYMm - cy) / r);
  const apex = side === 'bottom' ? Math.PI / 2 : -Math.PI / 2;
  const end = side === 'bottom' ? Math.PI - start : -Math.PI - start;
  const half = Math.sqrt(r * r - (chordYMm - cy) ** 2);
  // Beide Bögen beginnen am rechten Sehnenende: `start` liegt dort für Ober- wie Unterseite.
  return `M ${mm(cx - half)} ${mm(chordYMm)} H ${mm(cx + half)} ` +
    `${arcCubic(cx, cy, r, start, apex)} ${arcCubic(cx, cy, r, apex, end)} Z`;
}

/* --- Variantenkörper an der Funktionsstelle --------------------------------------------- */

/** Giebel der ortsgebundenen Fassung, wie an F.3.5/F.3.14/I.4.1 (`circle-12/raised-gable`). */
const GABLE: Primitive = {
  type: 'polyline',
  role: 'bodyExtra',
  closed: false,
  points: [[3, 11], [16, 1], [29, 11]],
  style: OUTLINE,
};

/** Abstand der Fußbandsehne über der Körperunterkante: G.3.x, Sehne y 24 bei Unterkante 28. */
const FOOT_BAND_CHORD_ABOVE_BOTTOM_MM = 4;

/**
 * Die drei abgeleiteten Körper der Funktionsstelle (`CIRCLE_VARIANT_PAIRS`).
 *
 * - `raised-gable`: Der 14-mm-Kreis lässt über sich keinen Platz für den Giebel; mit Giebel
 *   (Scheitel y 1) und Unterkante 30 bleibt genau der abgesenkte 12-mm-Kreis aus F.3.5, (16|18)
 *   r 12. Der Kreis wird also auf die vermessene Fassung verkleinert, nicht der Giebel gestaucht.
 * - `raised-circle-1mm`: N.2.3 hebt den Kreis an, damit die Oberflächenläufe unter ihm auf
 *   Grundlinie 31 Platz finden. Am 14-mm-Kreis hieße „1 mm angehoben" Unterkante 29 und Läufe auf
 *   33, außerhalb der Fläche. Der Kreis behält deshalb die Oberkante 1 (die angehobene Oberkante
 *   der Funktionsstelle) und endet wie in N.2.3 auf 27: (16|14) r 13.
 * - `foot-band`: Der Kreis bleibt; das Band ist das Segment unter der Sehne 4 mm über der
 *   Unterkante wie an G.3.x, bis zur Innenkante des Strichs.
 */
export const POST_VARIANT_BODIES: Partial<Record<BodyVariantId, Primitive>> = Object.freeze({
  'raised-gable': { type: 'circle', role: 'body', cx: 16, cy: 18, r: 12, style: OUTLINE },
  'raised-circle-1mm': { type: 'circle', role: 'body', cx: 16, cy: 14, r: 13, style: OUTLINE },
  'foot-band': { type: 'circle', role: 'body', cx: 16, cy: 16, r: 14, style: OUTLINE },
});

export const POST_VARIANT_EXTRAS: Partial<Record<BodyVariantId, readonly Primitive[]>> =
  Object.freeze({
    'raised-gable': [GABLE],
    'foot-band': [
      {
        type: 'path',
        role: 'pictogram',
        d: circleSegmentPath(
          16,
          16,
          14 - DEFAULT_STROKE_WIDTH_MM / 2,
          30 - FOOT_BAND_CHORD_ABOVE_BOTTOM_MM,
          'bottom',
        ),
        style: SOLID,
      },
    ],
  });

/** Vermerkt einen abgeleiteten Variantenkörper an der laufenden Komposition. */
export function noteCircleVariantBody(kind: SymbolKind, variant: BodyVariantId | undefined): void {
  if (!isDerivedCircleVariant(kind, variant)) return;
  noteDerivation({
    dimension: 'bodyVariant',
    part: `Körper ${kind}/${variant}`,
    basis: 'transferred',
    from: variant === 'raised-gable'
      ? 'F.3.5 (abgesenkter 12-mm-Kreis mit Giebel)'
      : variant === 'raised-circle-1mm'
        ? 'N.2.3 (angehobener Kreis, Unterkante 27)'
        : 'G.3.x (Fußband als Kreissegment 4 mm über der Unterkante)',
  });
}

/* --- Kopfzone über dem Kreis ------------------------------------------------------------ */

/**
 * Tiefste Unterkante, bis zu der ein Kreis einer Kopfzone ausweicht: die der Funktionsstelle
 * (1.6, r 14 um (16|16)). Weiter unten bliebe kein Rand zur 32-mm-Fläche.
 */
export const CIRCLE_HEAD_BOTTOM_LIMIT_MM = 30;

/**
 * Setzt einen Kreiskörper unter eine Kopfzone. Kein Original zeigt das (gemessenes Negativ vom
 * 18. August 2026), die Lage ist also abgeleitet:
 *
 * - Der Kreis rückt zuerst nach unten, bis seine Oberkante `headBottomMm + gapMm` erreicht — wie
 *   der Rechteckkörper in C.1.1 (`rectBody().place`), Größe unverändert.
 * - Reicht der Platz bis `bottomLimitMm` nicht, hält er die Unterkante und verkleinert den Radius
 *   von oben — wie das gedrehte Quadrat in D.3.7 (`rotatedSquareProfile.place`).
 *
 * Am 12-mm-Kreis genügt meist das Verschieben (Oberkante 4, Unterkante 28); die Funktionsstelle
 * steht schon auf der Unterkante 30 und wird verkleinert.
 */
export function placeCircleUnderHead(
  body: Primitive,
  headBottomMm: number,
  gapMm: number,
  bottomLimitMm: number = CIRCLE_HEAD_BOTTOM_LIMIT_MM,
): Primitive {
  if (body.type !== 'circle') {
    throw new Error('Kreisprofil erwartet einen Kreis als Körper.');
  }
  const top = body.cy - body.r;
  const bottom = body.cy + body.r;
  const target = Math.max(top, headBottomMm + gapMm);
  if (target <= top) return body;
  const limit = Math.max(bottom, bottomLimitMm);
  const newBottom = Math.min(target + 2 * body.r, limit);
  const r = (newBottom - target) / 2;
  const shrinks = r < body.r;
  noteDerivation({
    dimension: 'head',
    part: shrinks
      ? 'Kreiskörper unter der Kopfzone verkleinert, Unterkante gehalten'
      : 'Kreiskörper unter die Kopfzone verschoben',
    basis: 'transferred',
    from: shrinks ? 'D.3.7 (gedrehtes Quadrat, von oben verkleinert)' : 'C.1.1 (Körper verschoben)',
  });
  return { ...body, cy: target + r, r };
}

/* --- Beschriftung am Kreis -------------------------------------------------------------- */

/** Versalhöhen der Norm (E.1.1 bis E.1.16), dieselben Zahlen wie in `compose.ts`. */
const CENTER_CAP_HEIGHT_MM = 4.87;
const CORNER_CAP_HEIGHT_MM = 2.92;

/**
 * Abstand der Eckenläufe unter der mittigen Normgrundlinie: an der Formation 18 → 24 mm
 * (E.1.1 bis E.1.16). Mit der Versalmitte des mittigen Laufs auf der Kreismitte liegt die Box des
 * Eckenlaufs damit wie an der Formation 0,85 mm unter der Box des mittigen Normlaufs.
 */
const CORNER_BELOW_CENTER_BASELINE_MM = 6;

/** Rand der Eckenbox gegen die Kreismittellinie: der 1-mm-Rand der mittigen Box (E-b). */
const CORNER_BOX_MARGIN_MM = 1;

/**
 * Mittige Grundlinie am Kreis ohne vermessenen Override: die Versalmitte des Laufs liegt auf der
 * Kreismitte. Belegt an den Ortszeichen D.2.3/D.2.4 (Kreis um (16|16), Grundlinie 19, Versalhöhe
 * 7,3: Versalmitte 15,35, 0,65 mm über der Mitte) und D.2.5 (Kreis um (16|18), Grundlinie 22:
 * Versalmitte 18,35, 0,35 mm darunter). Keine einzelne Abstandszahl trifft beide Lagen; die
 * Versalmitte auf der Kreismitte trifft beide auf ±0,65 mm und folgt der Versalhöhe.
 *
 * Gerechnet gegen die Hülle des **platzierten** Körpers, damit der Lauf einer Kopfzone folgt.
 * Rückgabe wie das Profilfeld: Abstand der Grundlinie über der Körperunterkante.
 */
export function circleCenterBaselineFromBodyBottomMm(
  bodyBoundsMm: BoundsMm,
  capHeightMm: number,
): number {
  noteDerivation({
    dimension: 'labels.center',
    part: 'Grundlinie des mittigen Laufs am Kreis: Versalmitte auf der Kreismitte',
    basis: 'constructed',
    from: 'D.2.3/D.2.4/D.2.5 (Versalmitte ±0,65 mm an der Kreismitte)',
  });
  const cy = (bodyBoundsMm.minY + bodyBoundsMm.maxY) / 2;
  return bodyBoundsMm.maxY - (cy + capHeightMm / 2);
}

/**
 * Versalhöhe des großen mittigen Laufs an den Ortszeichen D.2.3 bis D.2.5: 7,3 mm. Nur in dieser
 * Höhe ist ein Lauf über der Norm (4,87 mm) an einem Original vermessen.
 */
export const LARGE_CENTER_CAP_HEIGHT_MM = 7.3;

/**
 * Vermessene Grundlinie des großen Laufs am unverkleinerten 12-mm-Kreis (Durchmesser 24 mm), als
 * Abstand über der Körperunterkante: 9 am glatten Kreis (D.2.3/D.2.4, Grundlinie 19 bei
 * Unterkante 28), 8 am angehobenen Giebel (D.2.5, Grundlinie 22 bei Unterkante 30). Verkleinert
 * ein Kopf den Kreis oder ist die Höhe eine andere, gibt es keine vermessene Lage: `undefined`,
 * und die Konstruktion über die Kreismitte gilt (LFH-992).
 */
export function measuredCircleCenterBaselineFromBodyBottomMm(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  bodyBoundsMm: BoundsMm,
  capHeightMm: number,
): number | undefined {
  if (kind !== 'circle-12' || capHeightMm !== LARGE_CENTER_CAP_HEIGHT_MM) return undefined;
  if (Math.abs(bodyBoundsMm.maxY - bodyBoundsMm.minY - 24) > 1e-6) return undefined;
  if (variant === undefined) return 9;
  if (variant === 'raised-gable') return 8;
  return undefined;
}

/** Lage eines Kürzels am Kreis: Anker, Grundlinie und die zugesicherte waagerechte Box. */
export interface CircleCornerRun {
  readonly anchorXMm: number;
  readonly baselineYMm: number;
  readonly boxXMm: number;
  readonly boxWidthMm: number;
}

export interface CircleCornerRuns {
  readonly bottomLeft?: CircleCornerRun;
  readonly bottomRight?: CircleCornerRun;
  /** Nur an Kreisen ohne vermessene Außenlage oben links (Funktionsstelle). */
  readonly topLeft?: CircleCornerRun;
}

/**
 * Ob der Lauf oben links am Kreis **außerhalb** der Kreisfläche steht, auf der Ausgabeoberfläche.
 * F.3.3/F.3.4 und F.3.5/F.3.14 setzen ihn dort; am 12-mm-Kreis und an der Giebelfassung der
 * Funktionsstelle (derselbe abgesenkte 12-mm-Kreis) bleibt diese Lage. Am 14-mm-Kreis ist links
 * oben kein Platz außerhalb; dort steht der Lauf innen auf der Sehne (`circleCornerRuns`).
 */
export function circleTopLeftOnSurface(kind: SymbolKind, variant: BodyVariantId | undefined): boolean {
  return kind === 'circle-12' || (kind === 'post' && variant === 'raised-gable');
}

/**
 * Tinte des Laufs oben links am Kreis, wenn er auf der Ausgabeoberfläche steht: schwarz wie an
 * F.3.3/F.3.5, unabhängig von der Kreisfläche. `undefined`, wo er im Kreis steht und der
 * Körpertinte folgt. Ein ausdrücklicher `inBodyInk`-Override geht beiden vor. Zeichnung (`compose()`) und Kontrastvertrag (`labelContrastRequirements`)
 * fragen beide hier, damit sie nicht auseinanderlaufen.
 */
export function circleTopLeftInk(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
): 'schwarz' | undefined {
  return circleTopLeftOnSurface(kind, variant) ? 'schwarz' : undefined;
}

/** Die vermessenen F.3-Metriksätze des Laufs oben links. */
const F3_3_TOP_LEFT_METRICS = Object.freeze({
  capHeightMm: 2.919225,
  baselineFromBodyTopMm: 1.000254,
  anchorFromBodyLeftMm: -2.984684,
});
const F3_5_TOP_LEFT_METRICS = Object.freeze({
  capHeightMm: 2.749893,
  baselineFromBodyTopMm: -0.999746,
  anchorFromBodyLeftMm: -2.974002,
});

/**
 * Der Metriksatz für einen topLeft-Lauf am Kreis ohne eigenen Satz. An den beiden vermessenen
 * F.3-Fassungen ist es deren Satz — er beschreibt die Lage an dieser Fassung, wie die
 * Profilgrundlinie der Formation die Lage jedes Laufs dort beschreibt; keine Notiz. An den übrigen
 * Kreisen mit Außenlage ist er übertragen und wird vermerkt.
 */
export function circleTopLeftMetrics(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
): NonNullable<BodyLabels['topLeftMetrics']> | undefined {
  if (!circleTopLeftOnSurface(kind, variant)) return undefined;
  const gable = variant === 'raised-gable';
  if (kind !== 'circle-12' || (variant !== undefined && !gable)) {
    noteDerivation({
      dimension: 'labels.topLeft',
      part: `Lauf oben links außerhalb des Kreises an ${kind}/${variant ?? 'normal'}`,
      basis: 'transferred',
      from: gable ? 'F.3.5 (Lauf „50“)' : 'F.3.3 (Lauf „UHS“)',
    });
  }
  return gable ? F3_5_TOP_LEFT_METRICS : F3_3_TOP_LEFT_METRICS;
}

const CORNER_SIZE_MM = CORNER_CAP_HEIGHT_MM / ARIMO_CAP_HEIGHT_FRACTION;
const CORNER_ASCENT_MM = CORNER_SIZE_MM * ALPHABETIC_ASCENT_FRACTION;
const CORNER_DESCENT_MM = CORNER_SIZE_MM * ALPHABETIC_DESCENT_FRACTION;
/** Abstand der unteren Eckengrundlinie unter der Kreismitte. */
const CORNER_OFFSET_MM = CENTER_CAP_HEIGHT_MM / 2 + CORNER_BELOW_CENTER_BASELINE_MM;

/**
 * Grundlinie des inneren Laufs oben links, gerechnet von der Kreisoberkante nach unten: die Box
 * des unteren Eckenlaufs an der Kreismitte gespiegelt. Für das Profilfeld
 * `topLeftBaselineFromBodyTopMm`, das die Zone als belegt ausweist.
 */
export function circleInnerTopLeftBaselineFromBodyTopMm(radiusMm: number): number {
  return radiusMm - CORNER_OFFSET_MM - CORNER_DESCENT_MM + CORNER_ASCENT_MM;
}

/**
 * Kürzel in den Ecken **innerhalb** der Kreisfläche. Die Rechteckregel (Anker 2 mm von der
 * Körperkante, Grundlinie 2 mm über der Unterkante) setzte sie am Kreis in die Ecke der Hülle,
 * außerhalb der Kontur: an der Funktionsstelle auf (28|28), 17 mm von der Mitte.
 *
 * Abgeleitet aus der Formation, gegen den Kreis gerechnet:
 * - Grundlinie 6 mm unter der mittigen Normgrundlinie (Formation 18 → 24); mit der Versalmitte auf
 *   der Kreismitte also `cy + 4,87/2 + 6`. Oben links an der Funktionsstelle gespiegelt.
 * - Anker auf der Sehne: die äußere Ecke der Textbox (unten bzw. oben) liegt 1 mm innerhalb der
 *   Kreismittellinie — der Rand der mittigen Box.
 * - Box wie am Rechteck von der senkrechten Mittellinie bis zum Anker, solange die Gegenecke belegt
 *   ist; sonst über die ganze Sehne, damit ein dreistelliges Kürzel auch am 12-mm-Kreis passt.
 */
export function circleCornerRuns(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  bodyBoundsMm: BoundsMm,
  labels: BodyLabels,
): CircleCornerRuns {
  const cx = (bodyBoundsMm.minX + bodyBoundsMm.maxX) / 2;
  const cy = (bodyBoundsMm.minY + bodyBoundsMm.maxY) / 2;
  const r = (bodyBoundsMm.maxX - bodyBoundsMm.minX) / 2;
  const reach = r - CORNER_BOX_MARGIN_MM;
  // Die äußere Boxecke liegt oben wie unten gleich weit von der Kreismitte: Spiegelbild.
  const outerCornerDyMm = CORNER_OFFSET_MM + CORNER_DESCENT_MM;
  const half = Math.sqrt(Math.max(0, reach ** 2 - outerCornerDyMm ** 2));
  const lowerBaseline = cy + CORNER_OFFSET_MM;
  const upperBaseline = cy - r + circleInnerTopLeftBaselineFromBodyTopMm(r);
  const lowerHalf = half;
  const upperHalf = half;

  const runs: { -readonly [K in keyof CircleCornerRuns]: CircleCornerRun } = {};
  const note = (part: string) =>
    noteDerivation({
      dimension: 'labels.corner',
      part,
      basis: 'constructed',
      from: 'E.1.1–E.1.16 (Formation: Grundlinie 6 mm unter der mittigen, 1-mm-Boxrand), auf die Kreissehne gelegt',
    });
  if (labels.bottomLeft !== undefined) {
    note('Lauf unten links auf der Kreissehne');
    const left = cx - lowerHalf;
    runs.bottomLeft = {
      anchorXMm: left,
      baselineYMm: lowerBaseline,
      boxXMm: left,
      boxWidthMm: labels.bottomRight === undefined ? 2 * lowerHalf : lowerHalf,
    };
  }
  if (labels.bottomRight !== undefined && labels.bottomRightMetrics === undefined) {
    note('Lauf unten rechts auf der Kreissehne');
    const right = cx + lowerHalf;
    const boxLeft = labels.bottomLeft === undefined ? cx - lowerHalf : cx;
    runs.bottomRight = {
      anchorXMm: right,
      baselineYMm: lowerBaseline,
      boxXMm: boxLeft,
      boxWidthMm: right - boxLeft,
    };
  }
  // Unten mittig und rechts unterhalb sind nur am gebänderten 12-mm-Kreis vermessen (G.3.5); an
  // jeder anderen Kreisfassung stehen sie übertragen im Profil und werden hier vermerkt.
  const measuredBand = kind === 'circle-12' && variant === 'foot-band';
  if (labels.bottomCenter !== undefined && !measuredBand) {
    noteDerivation({
      dimension: 'labels.bottomCenter',
      part: `Lauf unten mittig an ${kind}/${variant ?? 'normal'}`,
      basis: 'transferred',
      from: 'G.3.5 („Diesel“ 6 mm über der Unterkante)',
    });
  }
  if (labels.belowRight !== undefined && !measuredBand) {
    noteDerivation({
      dimension: 'labels.belowRight',
      part: `Lauf rechts unterhalb an ${kind}/${variant ?? 'normal'}`,
      basis: 'transferred',
      from: 'G.3.5 („Bw“ 1 mm unter dem Kreis, Anker x 31)',
    });
  }
  if (labels.topLeft !== undefined && !circleTopLeftOnSurface(kind, variant)) {
    note('Lauf oben links auf der Kreissehne');
    const left = cx - upperHalf;
    runs.topLeft = {
      anchorXMm: left,
      baselineYMm: upperBaseline,
      boxXMm: left,
      boxWidthMm: 2 * upperHalf,
    };
  }
  return runs;
}
