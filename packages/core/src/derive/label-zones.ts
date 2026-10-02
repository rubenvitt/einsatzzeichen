import { DEFAULT_STROKE_WIDTH_MM, DEFAULT_VIEWBOX_MM, type BodyVariantId, type ColorToken, type Primitive, type SymbolKind, type SymbolSpec } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { FOOT_GAP_MM, profileFor, type LayoutProfile } from '../layout/profiles.js';
import { COMPOSE_ZONE_CONSTANTS } from '../layout/zones.js';
import { NotMeasuredError } from '../not-measured.js';
import { ARIMO_CAP_HEIGHT_FRACTION, verticalTextBoxMm } from '../render/text-policy.js';
import { innerSpanMm, outerSpanMm, outlineSegments } from './body-outline.js';
import { noteDerivation } from './record.js';

/**
 * Beschriftungszonen an Körperformen, an denen sie nicht vermessen sind (Entscheidung des
 * Eigentümers vom 2. Oktober 2026: zeichnen und als abgeleitet markieren, statt abzulehnen).
 *
 * **Was hier entsteht und was nicht.** Jede Zahl stammt aus einem vermessenen Profil — sie wird
 * dort über `profileFor()` gelesen und nicht abgeschrieben, damit Quelle und Übertragung nicht
 * auseinanderlaufen. Neu ist allein die Zuordnung, *welche* vermessene Fassung an welcher
 * Körperform gilt, und die Ausweichlage, wo die übertragene Lage nicht in den Körper oder nicht
 * auf die 32-mm-Fläche passt. Vermessene Profilwerte bleiben unberührt: gefüllt wird nur, was das
 * Profil nicht führt, und eine Notiz entsteht nur für eine Zone, die die Spec tatsächlich belegt.
 *
 * | Zone | Quelle | übertragen auf |
 * |---|---|---|
 * | `topLeft` | Formation F.1.1–F.1.11: 5,0 mm unter der Oberkante, Anker 1,5 mm | Rechteckkörper, Wasserrümpfe, Formkörper |
 * | `topLeft` | Landfahrzeug F.2.1–F.2.5: 6,75 mm | Anhänger- und Wechselladerrumpf |
 * | `topLeft` | Festflügel N.1.6: 7,0 mm, Anker 5,99 mm | Luftfahrzeugrümpfe ohne Metriksatz |
 * | `topLeftLines` | Landfahrzeug F.2.8-Satz: Zeilenabstand 4,0 mm, Versalhöhe 2,919 mm | alle, erste Zeile auf der `topLeft`-Lage |
 * | `bottomCenter` | Formation F.1.18/F.1.20: 2,0 mm über der Unterkante | alle; mit Fußband über dem Band (G.1.2) |
 * | `aboveLeft` | Festflügelprofil: 1 mm über der Oberkante, Anker −0,01 mm | alle außer der Raute |
 * | `aboveLeft` | abgesenkte Personraute I.5.2/I.5.3: −1,5 mm, Anker −2 mm | Raute |
 * | `belowRight` | angehobener Wasserrumpf E.2.27–E.2.31: 4,01 mm, Anker +0,5618 mm | alle; ohne Organisation schwarz wie G.3.5 |
 * | `surfaceBelow*` | angehobener Luftrumpf N.2.x: 8,01 mm, Anker ±0,01 mm (links gespiegelt) | Luftfahrzeugrümpfe |
 * | `surfaceBelow*` | 12-mm-Kreis mit 1-mm-Anhebung: 4,0 mm unter der Unterkante | alle übrigen, Anker wie am Luftrumpf |
 *
 * **Ausweichlage.** Läufe im Körper rücken von ihrer übertragenen Lage zur Körpermitte, bis sie
 * dort stehen, wo der Körper durchgehend breit genug ist — die Box reicht dann mindestens vom
 * Anker bis zur Körpermitte, wie die obere linke Viertelzone der Formation aus F-a. Belegt die
 * Spec den mittigen Lauf, bevorzugen sie eine Lage, die dessen Box nicht schneidet. Läufe außerhalb
 * des Körpers bleiben auf der 32-mm-Fläche und neben dem Körper; reicht der Platz dafür nicht,
 * wirft die Komposition — das ist eine Grenze der Fläche, keine Regel der Systematik.
 *
 * Kreiskörper (`post`, `circle-12` und seine Varianten, `reduced-house`) leitet dieses Modul
 * nicht ab; dort bleibt es bei den vermessenen Profilwerten.
 */

/** Die Läufe dieses Moduls stehen im Grad der unteren Zonen, wie an allen Quellen oben. */
const RUN_SIZE_MM = COMPOSE_ZONE_CONSTANTS.BOTTOM_LABEL_CAP_HEIGHT_MM / ARIMO_CAP_HEIGHT_FRACTION;
const RUN_CAP_MM = COMPOSE_ZONE_CONSTANTS.BOTTOM_LABEL_CAP_HEIGHT_MM;
const ANCHOR_MARGIN_MM = COMPOSE_ZONE_CONSTANTS.TOP_LEFT_LABEL_ANCHOR_FROM_BODY_LEFT_MM;
const SIDE_MARGIN_MM = COMPOSE_ZONE_CONSTANTS.LABEL_SIDE_MARGIN_MM;
const CENTER_BOX_MARGIN_MM = COMPOSE_ZONE_CONSTANTS.CENTER_LABEL_BOX_MARGIN_MM;
/**
 * Abstand eines Laufs außerhalb des Körpers zur Körperkontur, wenn er neben ihr ausweichen muss.
 * Übernommen vom Abstand der Fußzone (`FOOT_GAP_MM`), dem einzigen Abstand zwischen Körper und
 * Lauf auf der Ausgabeoberfläche, den der Katalog führt.
 */
const OUTSIDE_GAP_MM = FOOT_GAP_MM;
/**
 * Luft zwischen Schrift und Außenkante des Körperstrichs, wenn ein Lauf außerhalb des Körpers an
 * ihn heranrückt: Grundlinie über der Oberkante, Versalhöhe unter der Unterkante.
 */
const EDGE_CLEARANCE_MM = 0.05;
/** Schrittweite der Ausweichlage. */
const STEP_MM = 0.25;
/**
 * Abstand eines Laufs zur Kante der Grundfläche, wenn er neben eine Körperspitze in deren Ecke
 * ausweicht: die abgesenkte Personraute I.5.2/I.5.3 setzt ihren oberen Lauf auf x = 1 mm.
 */
const CORNER_INSET_MM = 1;
/** Kleinste Restbreite, für die eine Box überhaupt entsteht; darunter wirft die Komposition. */
const MIN_ROOM_MM = 0.5;
/**
 * Anker des `topLeft`-Laufs an N.1.6 (Festflügel, „5.000“): `anchorFromBodyLeftMm` des
 * vollständigen Metriksatzes in `conformance/src/recipes-anhang-n.ts`. Die Grundlinie steht als
 * `topLeftBaselineFromBodyTopMm` am Profil des Festflügels.
 */
const N16_TOP_LEFT_ANCHOR_FROM_BODY_LEFT_MM = 5.99;

type Family = 'rect' | 'f2-hull' | 'air-hull' | 'water-hull' | 'shaped' | 'diamond';

/** Welche vermessene Fassung an welcher Körperform gilt. `undefined`: Kreiskörper, nicht hier. */
function familyOf(kind: SymbolKind, variant: BodyVariantId | undefined): Family | undefined {
  switch (kind) {
    case 'post':
    case 'circle-12':
    case 'reduced-house':
      return undefined;
    case 'formation':
    case 'container':
    case 'upright-rectangle':
      return 'rect';
    case 'vehicle-land':
      // Der umgekehrte Rumpf aus N.1.1 hat eine gerade Oberkante wie das Rechteck.
      return variant === 'inverted-hull-track' ? 'rect' : 'f2-hull';
    case 'trailer':
    case 'swap-loader-vehicle':
      return 'f2-hull';
    case 'vehicle-air':
      return 'air-hull';
    case 'vehicle-water':
      return 'water-hull';
    case 'person':
      return 'diamond';
    case 'building':
    case 'area':
    case 'measure':
    case 'hazard':
    case 'point':
    case 'event':
    case 'spontaneous-helper':
      return 'shaped';
  }
}

export type DerivedZoneId =
  | 'topLeft'
  | 'topLeftLines'
  | 'aboveLeft'
  | 'bottomCenter'
  | 'belowRight'
  | 'surfaceBelowLeft'
  | 'surfaceBelowRight';

/** Absolute Lagen, die die Profilfelder nicht ausdrücken können (Anker und Boxkanten). */
export interface DerivedLabelBoxes {
  readonly topLeft?: { readonly anchorFromBodyLeftMm: number; readonly boxRightMm: number };
  readonly topLeftLines?: { readonly anchorFromBodyLeftMm: number; readonly boxRightMm: number };
  readonly aboveLeftBoxRightMm?: number;
  readonly bottomCenter?: { readonly anchorXMm: number; readonly boxLeftMm: number; readonly boxRightMm: number };
  readonly belowRightBoxLeftMm?: number;
  readonly surfaceLeftBoxRightMm?: number;
  readonly surfaceRightBoxLeftMm?: number;
}

export interface LabelZoneContext {
  readonly kind: SymbolKind;
  readonly variant: BodyVariantId | undefined;
  readonly profile: LayoutProfile;
  readonly labels: NonNullable<SymbolSpec['labels']>;
  /** Der platzierte Körper (nach Kopfzone), gegen den die Zonen gerechnet werden. */
  readonly body: Primitive;
  /** Zusatzgeometrie des Grundzeichens (Deichsel, Rahmen, Flügel, Räder, Fußband). */
  readonly extras: readonly Primitive[];
  /** Unterkante aller Primitive des Grundzeichens, wie `compose()` sie für das Fahrwerk rechnet. */
  readonly baseBottomMm: number;
  /** Füllfarbe der Organisation, `undefined` ohne Organisation. */
  readonly organizationFill: ColorToken | undefined;
}

export interface DerivedLabelZones {
  readonly profile: LayoutProfile;
  readonly boxes: DerivedLabelBoxes;
}

interface Block {
  /** Ausdehnung über der (ersten) Grundlinie. */
  readonly aboveMm: number;
  /** Ausdehnung unter der (letzten) Grundlinie, vom ersten Lauf aus gerechnet. */
  readonly belowMm: number;
}

function block(sizeMm: number, extraBelowMm = 0): Block {
  const box = verticalTextBoxMm(0, sizeMm, 'alphabetic');
  return { aboveMm: -box.topMm, belowMm: box.topMm + box.heightMm + extraBelowMm };
}

/** Senkrechte Ausdehnung eines belegten Laufs. */
interface Band {
  readonly topMm: number;
  readonly bottomMm: number;
}

interface InBodyPlacement {
  /** Grundlinie relativ zur Körperkante, von der aus die Zone vermessen ist. */
  readonly offsetMm: number;
  /** Linke Boxkante relativ zur linken Hüllenkante, ohne Rundungsumweg über die absolute Lage. */
  readonly anchorFromBodyLeftMm: number;
  readonly leftMm: number;
  readonly rightMm: number;
  readonly shifted: boolean;
}

/**
 * Sucht die Lage eines Laufs (oder Zeilenblocks) im Körper, beginnend an der übertragenen Lage
 * `offsetMm` und schrittweise bis zur Körpermitte. Gewählt wird
 *
 * 1. die erste Lage, an der der Körper breit genug ist und die Bänder der übrigen belegten Läufe
 *    (`avoid`) frei bleiben;
 * 2. sonst die breiteste freie Lage — schmal, aber ohne Überschneidung; ob der Lauf hineinpasst,
 *    entscheidet dann `label-too-wide`;
 * 3. gibt es keine freie Lage im Körper, die übertragene Lage selbst, wie an den vermessenen
 *    F.2-Rümpfen, an denen oberer und mittiger Lauf dieselbe Höhe teilen;
 * 4. zuletzt die breiteste Lage überhaupt.
 *
 * „Breit genug“ heißt: die Box reicht mindestens vom Anker bis zur Körpermitte, wie die obere
 * linke Viertelzone der Formation aus F-a.
 */
function placeInBody(
  segments: ReturnType<typeof outlineSegments>,
  bounds: BoundsMm,
  edge: 'top' | 'bottom',
  offsetMm: number,
  run: Block,
  leftMarginMm: number,
  rightMarginMm: number,
  avoid: readonly Band[],
): InBodyPlacement | undefined {
  const minWidthMm = (bounds.maxX - bounds.minX) / 2 - ANCHOR_MARGIN_MM;
  const middleMm = (bounds.minY + bounds.maxY) / 2;
  const candidates: (InBodyPlacement & { readonly widthMm: number; readonly clear: boolean })[] = [];
  for (let shift = 0; ; shift += STEP_MM) {
    const baseline = edge === 'top'
      ? bounds.minY + offsetMm + shift
      : bounds.maxY - offsetMm - shift;
    const top = baseline - run.aboveMm;
    const bottom = baseline + run.belowMm;
    if (shift > 0 && (edge === 'top' ? top > middleMm : bottom < middleMm)) break;
    const span = innerSpanMm(segments, top, bottom);
    if (span === undefined) continue;
    // Unter einem Tausendstelmillimeter ist die Spanne die Hülle selbst (Abtastrauschen).
    const insetMm = span.minX - bounds.minX > 1e-3 ? span.minX - bounds.minX : 0;
    const rightInsetMm = bounds.maxX - span.maxX > 1e-3 ? bounds.maxX - span.maxX : 0;
    const leftMm = bounds.minX + insetMm + leftMarginMm;
    const rightMm = bounds.maxX - rightInsetMm - rightMarginMm;
    if (rightMm <= leftMm) continue;
    const clear = avoid.every((band) => edge === 'top' ? bottom <= band.topMm : top >= band.bottomMm);
    candidates.push({
      offsetMm: offsetMm + shift,
      anchorFromBodyLeftMm: insetMm + leftMarginMm,
      leftMm,
      rightMm,
      shifted: shift > 0 || insetMm > 0 || rightInsetMm > 0,
      widthMm: rightMm - leftMm,
      clear,
    });
  }
  const widest = (list: typeof candidates) =>
    list.reduce<(typeof candidates)[number] | undefined>(
      (best, next) => (best === undefined || next.widthMm > best.widthMm ? next : best),
      undefined,
    );
  return candidates.find((c) => c.clear && c.widthMm >= minWidthMm) ??
    widest(candidates.filter((c) => c.clear)) ??
    candidates.find((c) => !c.shifted) ??
    widest(candidates);
}

function noRoom(zone: DerivedZoneId, kind: SymbolKind, variant: BodyVariantId | undefined): never {
  throw new NotMeasuredError(
    `Die Zone "${zone}" findet an "${kind}${variant === undefined ? '' : `/${variant}`}" keinen ` +
      'Platz: übertragen läge sie außerhalb der 32-mm-Grundfläche, und neben dem Körper bleibt ' +
      'keine Restbreite. Das ist eine Grenze der Fläche, keine Regel der Systematik.',
    'combination',
  );
}

/** Die mittige Box, wie `labelPrimitives` sie setzt — nur wenn die Spec den Lauf belegt. */
function centerBoxOf(
  labels: LabelZoneContext['labels'],
  profile: LayoutProfile,
  bounds: BoundsMm,
): { topMm: number; bottomMm: number } | undefined {
  if (labels.center === undefined) return undefined;
  const sizeMm = (labels.centerCapHeightMm ?? COMPOSE_ZONE_CONSTANTS.CENTER_LABEL_CAP_HEIGHT_MM) /
    ARIMO_CAP_HEIGHT_FRACTION;
  const baseline = bounds.maxY -
    (labels.centerBaselineFromBodyBottomMm ?? profile.centerBaselineFromBodyBottomMm);
  const box = verticalTextBoxMm(baseline, sizeMm, 'alphabetic');
  return { topMm: box.topMm, bottomMm: box.topMm + box.heightMm };
}

/** Höhe eines Fußbands an der Körperunterkante, `0` ohne Band. */
function footBandHeightMm(context: LabelZoneContext, bounds: BoundsMm): number {
  if (context.variant !== 'foot-band') return 0;
  const band = context.extras
    .map(boundsOfMm)
    .find((extra) => Math.abs(extra.maxY - bounds.maxY) < 0.01 && extra.minY > bounds.minY);
  return band === undefined ? 0 : band.maxY - band.minY;
}

function segmentsOf(primitives: readonly Primitive[]): ReturnType<typeof outlineSegments> {
  return primitives.flatMap((primitive) => {
    try {
      return [...outlineSegments(primitive)];
    } catch {
      // Gruppen und Linien ohne Fläche: ihre Hülle als Rechteck genügt als Hindernis.
      const b = boundsOfMm(primitive);
      return [...outlineSegments({ type: 'rect', x: b.minX, y: b.minY, width: b.maxX - b.minX, height: b.maxY - b.minY })];
    }
  });
}

/**
 * Lage eines Laufs unterhalb des Körpers: übertragen an `baselineMm`, höchstens so tief, dass die
 * Box auf der Fläche bleibt. Liegt dort Körper oder Zusatzgeometrie in der Hälfte des Laufs, rückt
 * er tiefer; reicht auch das nicht, endet seine Box vor dem Hindernis, und der Anker rückt in die
 * Ecke der Grundfläche (`CORNER_INSET_MM`).
 */
function placeBelow(
  obstacles: ReturnType<typeof outlineSegments>,
  bounds: BoundsMm,
  baselineMm: number,
  side: 'left' | 'right',
  anchorXMm: number,
  halfStrokeMm: number,
  allowShift = true,
): { baselineMm: number; anchorXMm: number; boxEdgeMm: number; shifted: boolean } | undefined {
  const run = block(RUN_SIZE_MM);
  const centerXMm = (bounds.minX + bounds.maxX) / 2;
  const lowest = DEFAULT_VIEWBOX_MM.height - run.belowMm;
  let edge: number | undefined;
  let baseline = Math.min(baselineMm, lowest);
  for (; ; baseline = Math.min(baseline + STEP_MM, lowest)) {
    const span = outerSpanMm(
      obstacles,
      baseline - RUN_CAP_MM - halfStrokeMm - EDGE_CLEARANCE_MM,
      baseline + run.belowMm,
    );
    edge = side === 'right'
      ? Math.max(centerXMm, span === undefined ? Number.NEGATIVE_INFINITY : span.maxX + OUTSIDE_GAP_MM)
      : Math.min(centerXMm, span === undefined ? Number.POSITIVE_INFINITY : span.minX - OUTSIDE_GAP_MM);
    const free = span === undefined || (side === 'right' ? span.maxX < centerXMm : span.minX > centerXMm);
    if (free || !allowShift || baseline >= lowest) break;
  }
  const cornered = edge !== centerXMm;
  const anchor = !cornered
    ? anchorXMm
    : side === 'right'
      ? DEFAULT_VIEWBOX_MM.width - CORNER_INSET_MM
      : CORNER_INSET_MM;
  const room = side === 'right' ? anchor - edge : edge - anchor;
  if (room < MIN_ROOM_MM) return undefined;
  return { baselineMm: baseline, anchorXMm: anchor, boxEdgeMm: edge, shifted: baseline !== baselineMm || cornered };
}

/**
 * Je-Spec-Maße (abweichende Grundlinie, Anker und Rand des mittigen Laufs, Metriksätze), die an
 * dieser Körperform nicht vermessen sind. Gezeichnet werden sie wie an den vermessenen Profilen;
 * die Lage stammt dann aus der Spec und der Mechanismus aus der Quelle, an der er vermessen ist.
 */
function noteMetricTransfers(context: LabelZoneContext): void {
  const { kind, variant, labels, profile } = context;
  const topLeftMetricsMeasured =
    (kind === 'vehicle-land' && (variant === undefined || variant === 'foot-band')) ||
    (kind === 'vehicle-air' && variant === 'fixed-wing-hull') ||
    (kind === 'circle-12' && (variant === undefined || variant === 'raised-gable'));
  if (labels.topLeftMetrics !== undefined && !topLeftMetricsMeasured) {
    noteDerivation({
      dimension: 'labels.topLeftMetrics',
      part: 'Metriksatz oben links, gegen die Körperhülle geprüft',
      basis: 'transferred',
      from: 'Landfahrzeug F.2 und Festflügel N.1.6 (Metriksatz)',
    });
  }
  if (labels.aboveLeftMetrics !== undefined && profile.aboveLeftBaselineFromBodyTopMm === undefined) {
    noteDerivation({
      dimension: 'labels.aboveLeftMetrics',
      part: 'Metriksatz oberhalb links',
      basis: 'transferred',
      from: 'angehobener Luftrumpf N.2 (Metriksatz)',
    });
  }
  const baseline = labels.centerBaselineFromBodyBottomMm;
  if (
    baseline !== undefined &&
    (profile.allowsCenterBaselineOverride !== true ||
      (profile.measuredCenterBaselineOverridesMm !== undefined &&
        !profile.measuredCenterBaselineOverridesMm.includes(baseline)))
  ) {
    noteDerivation({
      dimension: 'labels.centerBaselineFromBodyBottomMm',
      part: 'abweichende mittige Grundlinie',
      basis: 'transferred',
      from: 'Grundlinien-Override am Anhänger I.2.5/I.2.6 und am Landfahrzeug',
    });
  }
  const anchor = labels.centerAnchorFromBodyLeftMm;
  if (
    anchor !== undefined &&
    (profile.allowsCenterAnchorOverride !== true ||
      !(profile.measuredCenterAnchorsFromBodyLeftMm ?? []).includes(anchor))
  ) {
    noteDerivation({
      dimension: 'labels.centerAnchorFromBodyLeftMm',
      part: 'abweichender mittiger Anker',
      basis: 'transferred',
      from: 'Anker-Override am Anhänger I.2.5 und am Landfahrzeug C.2.25',
    });
  }
  if (labels.centerBoxMarginMm !== undefined && profile.allowsCenterBoxMarginOverride !== true) {
    noteDerivation({
      dimension: 'labels.centerBoxMarginMm',
      part: 'Rand der mittigen Textbox',
      basis: 'transferred',
      from: 'Formation I.1.17/I.1.18',
    });
  }
  if (labels.bottomRightMetrics !== undefined && profile.bottomRightMetricsBounds === undefined) {
    noteDerivation({
      dimension: 'labels.bottomRightMetrics',
      part: 'Metriksatz unten rechts, gegen die Körperhülle geprüft',
      basis: 'transferred',
      from: 'angehobener Luftrumpf (vermessene Textbox)',
    });
  }
}

/**
 * Füllt die Beschriftungszonen, die das Profil an dieser Körperform nicht führt und die Spec
 * belegt. Vermessene Profilwerte bleiben unverändert; ohne belegte, unvermessene Zone kommt das
 * Profil unverändert zurück.
 */
export function deriveLabelZones(context: LabelZoneContext): DerivedLabelZones {
  const { kind, variant, labels } = context;
  const measured = context.profile;
  noteMetricTransfers(context);
  const family = familyOf(kind, variant);
  if (family === undefined) return { profile: measured, boxes: {} };

  const bounds = boundsOfMm(context.body);
  const segments = outlineSegments(context.body);
  const obstacles = [...segments, ...segmentsOf(context.extras)];
  const halfStroke = (context.body.style?.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM) / 2;
  const centerBox = centerBoxOf(labels, measured, bounds);
  /** Die Bänder der belegten oberen Läufe, vermessen oder schon abgeleitet. */
  const topBands = (profile: LayoutProfile): Band[] => {
    const bands: Band[] = [];
    const topLeftBaseline = labels.topLeftMetrics?.baselineFromBodyTopMm ?? profile.topLeftBaselineFromBodyTopMm;
    if (labels.topLeft !== undefined && topLeftBaseline !== undefined) {
      const sizeMm = labels.topLeftMetrics === undefined
        ? RUN_SIZE_MM
        : labels.topLeftMetrics.capHeightMm / ARIMO_CAP_HEIGHT_FRACTION;
      const box = verticalTextBoxMm(bounds.minY + topLeftBaseline, sizeMm, 'alphabetic');
      bands.push({ topMm: box.topMm, bottomMm: box.topMm + box.heightMm });
    }
    if (labels.topLeftLines !== undefined && profile.topLeftLines !== undefined) {
      const [first, second] = profile.topLeftLines.baselinesFromBodyTopMm;
      const sizeMm = profile.topLeftLines.capHeightMm / ARIMO_CAP_HEIGHT_FRACTION;
      const top = verticalTextBoxMm(bounds.minY + first, sizeMm, 'alphabetic');
      const bottom = verticalTextBoxMm(bounds.minY + second, sizeMm, 'alphabetic');
      bands.push({ topMm: top.topMm, bottomMm: bottom.topMm + bottom.heightMm });
    }
    return bands;
  };
  const formation = profileFor('formation');
  const vehicleLand = profileFor('vehicle-land');
  const raisedAir = profileFor('vehicle-air', 'raised-hull');
  const derived: { -readonly [K in keyof LayoutProfile]?: LayoutProfile[K] } = {};
  const boxes: { -readonly [K in keyof DerivedLabelBoxes]?: DerivedLabelBoxes[K] } = {};
  const where = `${kind}${variant === undefined ? '' : `/${variant}`}`;

  const topOffsetMm = family === 'f2-hull'
    ? vehicleLand.topLeftBaselineFromBodyTopMm!
    : formation.topLeftBaselineFromBodyTopMm!;
  const topSource = family === 'f2-hull'
    ? 'Landfahrzeug F.2.1–F.2.5 (6,75 mm unter der Oberkante)'
    : 'Formation F.1.1–F.1.11 (5,0 mm unter der Oberkante, Anker 1,5 mm)';

  // --- topLeft --------------------------------------------------------------------------------
  const topLeftMetricsOnly = measured.requiresTopLeftMetrics === true;
  if (
    labels.topLeft !== undefined &&
    labels.topLeftMetrics !== undefined &&
    measured.topLeftBaselineFromBodyTopMm === undefined
  ) {
    // Mit vollständigem Metriksatz liest `labelPrimitives` die Lage aus der Spec; die Profilzahl
    // steht nur, damit die Zone als belegt gilt.
    derived.topLeftBaselineFromBodyTopMm = labels.topLeftMetrics.baselineFromBodyTopMm;
  }
  if (
    labels.topLeft !== undefined &&
    labels.topLeftMetrics === undefined &&
    (measured.topLeftBaselineFromBodyTopMm === undefined || topLeftMetricsOnly)
  ) {
    if (family === 'air-hull') {
      // Festflügel N.1.6: Grundlinie und Anker aus dem vollständigen Metriksatz, an allen drei
      // Luftfahrzeugrümpfen gleich (dieselbe 30 × 15-mm-Kuppel). Die Box endet am Rumpf.
      const baselineFromTop = profileFor('vehicle-air', 'fixed-wing-hull').topLeftBaselineFromBodyTopMm!;
      const run = block(RUN_SIZE_MM);
      const baseline = bounds.minY + baselineFromTop;
      const span = innerSpanMm(segments, baseline - run.aboveMm, baseline + run.belowMm);
      derived.topLeftBaselineFromBodyTopMm = baselineFromTop;
      boxes.topLeft = {
        anchorFromBodyLeftMm: N16_TOP_LEFT_ANCHOR_FROM_BODY_LEFT_MM,
        boxRightMm: (span?.maxX ?? bounds.maxX) - SIDE_MARGIN_MM,
      };
      noteDerivation({
        dimension: 'labels.topLeft',
        part: 'Grundlinie und Anker oben links ohne Metriksatz',
        basis: 'transferred',
        from: 'Festflügel N.1.6 (7,0 mm unter der Oberkante, Anker 5,99 mm)',
      });
    } else {
      const placed = placeInBody(
        segments, bounds, 'top', topOffsetMm, block(RUN_SIZE_MM), ANCHOR_MARGIN_MM, SIDE_MARGIN_MM,
        centerBox === undefined ? [] : [centerBox],
      );
      if (placed === undefined) noRoom('topLeft', kind, variant);
      derived.topLeftBaselineFromBodyTopMm = placed.offsetMm;
      boxes.topLeft = { anchorFromBodyLeftMm: placed.anchorFromBodyLeftMm, boxRightMm: placed.rightMm };
      noteDerivation({
        dimension: 'labels.topLeft',
        part: placed.shifted ? 'Lage oben links, in den Körper ausgewichen' : 'Lage oben links',
        basis: placed.shifted ? 'constructed' : 'transferred',
        from: topSource,
      });
    }
  }

  // --- topLeftLines ---------------------------------------------------------------------------
  if (labels.topLeftLines !== undefined && measured.topLeftLines === undefined) {
    const source = vehicleLand.topLeftLines!;
    const [first, second] = source.baselinesFromBodyTopMm;
    const spacingMm = second - first;
    const sizeMm = source.capHeightMm / ARIMO_CAP_HEIGHT_FRACTION;
    const firstOffsetMm = family === 'air-hull'
      ? profileFor('vehicle-air', 'fixed-wing-hull').topLeftBaselineFromBodyTopMm!
      : topOffsetMm;
    const placed = placeInBody(
      segments, bounds, 'top', firstOffsetMm, block(sizeMm, spacingMm), ANCHOR_MARGIN_MM,
      SIDE_MARGIN_MM, [],
    );
    if (placed === undefined) noRoom('topLeftLines', kind, variant);
    derived.topLeftLines = {
      baselinesFromBodyTopMm: [placed.offsetMm, placed.offsetMm + spacingMm],
      capHeightMm: source.capHeightMm,
    };
    boxes.topLeftLines = { anchorFromBodyLeftMm: placed.anchorFromBodyLeftMm, boxRightMm: placed.rightMm };
    noteDerivation({
      dimension: 'labels.topLeftLines',
      part: placed.shifted ? 'zweizeilige Zone oben links, in den Körper ausgewichen' : 'zweizeilige Zone oben links',
      basis: placed.shifted ? 'constructed' : 'transferred',
      from: `Landfahrzeug F.2-Zeilensatz (4,0 mm Abstand) auf der Lage aus ${topSource}`,
    });
  }

  // --- bottomCenter ---------------------------------------------------------------------------
  if (labels.bottomCenter !== undefined && measured.bottomCenterBaselineFromBodyBottomMm === undefined) {
    const bandMm = footBandHeightMm(context, bounds);
    const offsetMm = bandMm + formation.bottomCenterBaselineFromBodyBottomMm!;
    // Der untere Lauf weicht dem mittigen und den oberen Läufen aus.
    const above = [...(centerBox === undefined ? [] : [centerBox]), ...topBands({ ...measured, ...derived })];
    const placed = placeInBody(
      segments, bounds, 'bottom', offsetMm, block(RUN_SIZE_MM), CENTER_BOX_MARGIN_MM,
      CENTER_BOX_MARGIN_MM, above,
    );
    if (placed === undefined) noRoom('bottomCenter', kind, variant);
    derived.bottomCenterBaselineFromBodyBottomMm = placed.offsetMm;
    boxes.bottomCenter = {
      anchorXMm: (placed.leftMm + placed.rightMm) / 2,
      boxLeftMm: placed.leftMm,
      boxRightMm: placed.rightMm,
    };
    noteDerivation({
      dimension: 'labels.bottomCenter',
      part: placed.shifted
        ? 'Lage unten mittig, in den Körper ausgewichen'
        : bandMm > 0 ? 'Lage unten mittig über dem Fußband' : 'Lage unten mittig',
      basis: placed.shifted ? 'constructed' : 'transferred',
      from: bandMm > 0
        ? 'Formation F.1.18/F.1.20 (2,0 mm), über dem Band wie G.1.2'
        : 'Formation F.1.18/F.1.20 (2,0 mm über der Unterkante)',
    });
  }

  // --- aboveLeft ------------------------------------------------------------------------------
  if (labels.aboveLeft !== undefined && measured.aboveLeftBaselineFromBodyTopMm === undefined) {
    // Zwei Lagen sind am Luftrumpf vermessen: auf der Kuppelspitze (F.2.6/F.2.7) und 1 mm
    // darüber (Festflügelprofil). Übertragen wird die zweite: auf einen Körper mit durchgehender
    // Oberkante gesetzt, stünde die erste mit ihrer Grundlinie auf dem Strich.
    const source = family === 'diamond'
      ? profileFor('person', 'compact-person-diamond-26mm-lowered-2mm')
      : profileFor('vehicle-air', 'fixed-wing-hull');
    const run = block(RUN_SIZE_MM);
    const metrics = labels.aboveLeftMetrics;
    const nominalBaseline = bounds.minY + source.aboveLeftBaselineFromBodyTopMm!;
    const baseline = metrics === undefined ? Math.max(nominalBaseline, run.aboveMm) : nominalBaseline;
    const span = outerSpanMm(obstacles, baseline - RUN_CAP_MM, baseline + halfStroke + EDGE_CLEARANCE_MM);
    const nominalAnchor = Math.max(bounds.minX + source.aboveLeftAnchorFromBodyLeftMm!, 0);
    // Steht der Lauf neben der Körperspitze statt über dem Körper, rückt er in die Ecke.
    const anchorX = span === undefined ? nominalAnchor : CORNER_INSET_MM;
    const defaultRight = bounds.maxX - SIDE_MARGIN_MM;
    const boxRight = span === undefined ? defaultRight : Math.min(defaultRight, span.minX - OUTSIDE_GAP_MM);
    if (metrics === undefined && boxRight - anchorX < MIN_ROOM_MM) noRoom('aboveLeft', kind, variant);
    derived.aboveLeftBaselineFromBodyTopMm = baseline - bounds.minY;
    derived.aboveLeftAnchorFromBodyLeftMm = anchorX - bounds.minX;
    if (boxRight !== defaultRight) boxes.aboveLeftBoxRightMm = boxRight;
    if (metrics === undefined) {
      const shifted = baseline !== nominalBaseline || boxRight !== defaultRight;
      noteDerivation({
        dimension: 'labels.aboveLeft',
        part: shifted ? 'Lage oberhalb links, neben die Körperspitze ausgewichen' : 'Lage oberhalb links',
        basis: shifted ? 'constructed' : 'transferred',
        from: family === 'diamond'
          ? 'abgesenkte Personraute I.5.2/I.5.3 (−1,5 mm, Anker −2 mm)'
          : 'Festflügelprofil (1 mm über der Oberkante, Anker −0,01 mm)',
      });
    }
  }

  // --- belowRight -----------------------------------------------------------------------------
  if (labels.belowRight !== undefined) {
    if (measured.belowRight === undefined) {
      const source = profileFor('vehicle-water', 'raised-hull').belowRight!;
      const anchorX = Math.min(bounds.maxX + source.anchorFromBodyRightMm, DEFAULT_VIEWBOX_MM.width);
      const placed = placeBelow(
        obstacles, bounds, context.baseBottomMm + source.baselineFromBodyBottomMm, 'right', anchorX,
        halfStroke,
      );
      if (placed === undefined) noRoom('belowRight', kind, variant);
      // Die Organisationsfarbe steht auf der weißen Ausgabeoberfläche; Weiß (HiOrg) wäre dort
      // unsichtbar und wird wie ohne Organisation schwarz (G.3.5).
      const ink = context.organizationFill !== undefined && context.organizationFill !== 'weiss'
        ? 'organization'
        : 'black';
      derived.belowRight = {
        baselineFromBodyBottomMm: placed.baselineMm - bounds.maxY,
        anchorFromBodyRightMm: placed.anchorXMm - bounds.maxX,
        ink,
      };
      if (placed.boxEdgeMm !== (bounds.minX + bounds.maxX) / 2) boxes.belowRightBoxLeftMm = placed.boxEdgeMm;
      noteDerivation({
        dimension: 'labels.belowRight',
        part: placed.shifted ? 'Lage unterhalb rechts, neben den Körper ausgewichen' : 'Lage unterhalb rechts',
        basis: placed.shifted ? 'constructed' : 'transferred',
        from: 'angehobener Wasserrumpf E.2.27–E.2.31 (4,01 mm, Anker +0,5618 mm)' +
          (ink === 'black' ? ', Tinte schwarz wie G.3.5' : ''),
      });
    } else if (
      measured.belowRight.ink === 'organization' &&
      (context.organizationFill === undefined || context.organizationFill === 'weiss')
    ) {
      derived.belowRight = { ...measured.belowRight, ink: 'black' };
      noteDerivation({
        dimension: 'labels.belowRight',
        part: context.organizationFill === undefined
          ? 'Tinte unterhalb rechts ohne Organisation'
          : 'Tinte unterhalb rechts bei weißer Organisationsfarbe',
        basis: 'transferred',
        from: 'gebänderter 12-mm-Kreis G.3.5 (schwarz)',
      });
    }
  }

  // --- surfaceBelowLeft / surfaceBelowRight ---------------------------------------------------
  const surfaceZones = (['surfaceBelowLeft', 'surfaceBelowRight'] as const)
    .filter((zone) => labels[zone] !== undefined);
  const measuredSurface = measured.surfaceLabels;
  const missingSurface = surfaceZones.filter((zone) =>
    measuredSurface === undefined ||
    (zone === 'surfaceBelowLeft'
      ? measuredSurface.leftAnchorFromBodyLeftMm === undefined
      : measuredSurface.rightAnchorFromBodyRightMm === undefined));
  if (missingSurface.length > 0) {
    const air = raisedAir.surfaceLabels!;
    const nominalBaseline = measuredSurface !== undefined
      ? bounds.maxY + measuredSurface.baselineFromBodyBottomMm
      : family === 'air-hull'
        ? bounds.maxY + air.baselineFromBodyBottomMm
        : context.baseBottomMm + profileFor('circle-12', 'raised-circle-1mm').surfaceLabels!.baselineFromBodyBottomMm;
    const anchorOffsetMm = air.rightAnchorFromBodyRightMm!;
    const leftAnchor = Math.max(bounds.minX - anchorOffsetMm, 0);
    const rightAnchor = Math.min(bounds.maxX + anchorOffsetMm, DEFAULT_VIEWBOX_MM.width);
    const left = surfaceZones.includes('surfaceBelowLeft')
      ? placeBelow(obstacles, bounds, nominalBaseline, 'left', leftAnchor, halfStroke, measuredSurface === undefined)
      : undefined;
    const right = surfaceZones.includes('surfaceBelowRight')
      ? placeBelow(obstacles, bounds, nominalBaseline, 'right', rightAnchor, halfStroke, measuredSurface === undefined)
      : undefined;
    if (surfaceZones.includes('surfaceBelowLeft') && left === undefined) noRoom('surfaceBelowLeft', kind, variant);
    if (surfaceZones.includes('surfaceBelowRight') && right === undefined) noRoom('surfaceBelowRight', kind, variant);
    // Beide Läufe teilen eine Grundlinie (N.2.3, raised-circle-1mm): die tiefere gilt für beide.
    const baseline = Math.max(left?.baselineMm ?? Number.NEGATIVE_INFINITY, right?.baselineMm ?? Number.NEGATIVE_INFINITY);
    derived.surfaceLabels = {
      baselineFromBodyBottomMm: baseline - bounds.maxY,
      leftAnchorFromBodyLeftMm: measuredSurface?.leftAnchorFromBodyLeftMm ??
        (left?.anchorXMm ?? leftAnchor) - bounds.minX,
      rightAnchorFromBodyRightMm: measuredSurface?.rightAnchorFromBodyRightMm ??
        (right?.anchorXMm ?? rightAnchor) - bounds.maxX,
    };
    const centerXMm = (bounds.minX + bounds.maxX) / 2;
    if (left !== undefined && left.boxEdgeMm !== centerXMm) boxes.surfaceLeftBoxRightMm = left.boxEdgeMm;
    if (right !== undefined && right.boxEdgeMm !== centerXMm) boxes.surfaceRightBoxLeftMm = right.boxEdgeMm;
    for (const zone of missingSurface) {
      const placed = zone === 'surfaceBelowLeft' ? left : right;
      const shifted = placed?.shifted === true || placed?.baselineMm !== baseline;
      noteDerivation({
        dimension: `labels.${zone}`,
        part: shifted ? 'schwarzer Oberflächenlauf, neben den Körper ausgewichen' : 'schwarzer Oberflächenlauf',
        basis: shifted ? 'constructed' : 'transferred',
        from: measuredSurface !== undefined
          ? `Gegenanker gespiegelt (${where})`
          : family === 'air-hull'
            ? 'angehobener Luftrumpf N.2.x (8,01 mm, Anker ±0,01 mm)'
            : '12-mm-Kreis mit 1-mm-Anhebung (4,0 mm), Anker wie am angehobenen Luftrumpf (±0,01 mm)',
      });
    }
  }

  if (Object.keys(derived).length === 0 && Object.keys(boxes).length === 0) {
    return { profile: measured, boxes: {} };
  }
  return { profile: { ...measured, ...derived }, boxes };
}

