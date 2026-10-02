import {
  DEFAULT_STROKE_WIDTH_MM,
  STATE_IDS,
  type ColorToken,
  type Drawing,
  type Primitive,
  type StateGroupId,
  type StateId,
  type SymbolSpec,
  type TendencyId,
  type ZoneBoundsMm,
} from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { baseDrawing } from '../geometry/base-symbols.js';
import { HEAD_GAP_MM } from '../layout/profiles.js';
import {
  BASE_AREA_32,
  CANVAS_32,
  PERSON_STATE_FRAMES,
  STATE_HINT_LAYOUTS,
  type StateCarrierFrameId,
  type StateHintId,
  type StateHintLayout,
} from '../layout/state-frames.js';
import {
  definitionOf,
  groupOf,
  hazardTriangle,
  hintMark,
  HINTS,
  mapPrimitive,
  mapStyle,
  personDrawing,
  PERSON_HINT_SHRINK,
  type Mapping,
  type PlacedStatePart,
  type StateCarrierInput,
  type StatePlacement,
  type StatePlacementBasis,
  type StatePlacementInput,
} from '../layout/state-placement.js';
import { noteDerivation } from './record.js';

/**
 * Zustände (5.8) und Tendenz (5.8.3) an Trägern, die keine Referenzdatei so zeigt
 * (Entscheidung des Eigentümers vom 02.10.2026: jede Kombination der Systematik wird gezeichnet,
 * Fehlendes aus der nächstliegenden vermessenen Fassung abgeleitet und gekennzeichnet).
 *
 * **Was übertragen wird, und woher.** Die Zeichnung jedes Zustands bleibt die vermessene aus
 * `geometry/pictograms/states`; abgeleitet ist nur ihre Lage:
 *
 * - **Trägerfassung mit weiteren Angaben.** Das Zeichen ohne Zustand wird vollständig
 *   komponiert (Organisation, Kopf, Läufe, Marken, Bezeichnung) und als Ganzes so abgebildet,
 *   wie der Zustand den Körper abbildet: bei 5.8.8 vom Personenkörper auf die Raute der
 *   Zustandsfassung (`PERSON_STATE_FRAMES`), neben einer Randlage verkleinert wie in
 *   `5.8.1_Beispiel 3`. Der Körper selbst ist danach die Raute bzw. das Dreieck der Zustandsfassung
 *   mit der Füllung des Zeichens.
 * - **Randlage links** (`state-margin`): die Hinweise „?" und „!" an jedem Träger wie an der
 *   Person (Achse 4,5 mm links der Trägerhülle, Strichfarbe des Trägers), die übrigen Werte aus
 *   5.8.1.5 bis 5.8.1.12, 5.8.2, 5.8.5 und 5.8.9 auf die Höhe der Hinweismarke verkleinert und
 *   mit demselben Abstand zum Träger. Mehrere Werte stehen untereinander, je Spalte zwei.
 * - **Randlage rechts** (`tendency-margin`): die Tendenz, gespiegelt zur Hinweis-Randlage.
 * - **Körperlage** (`body`): der Schadensgrad 5.8.4 auf dem Körper wie über dem Deichprofil in
 *   `L.8` und `L.9`, um die Körpermitte; die drei Stufen behalten ihr Größenverhältnis.
 *
 * Jede dieser Lagen meldet `noteDerivation()`; vermessene Zusammenstellungen nehmen diesen Weg
 * nicht (`measuredStatePlacement`).
 */

// ---------------------------------------------------------------------------------------------
// Abbildungen
// ---------------------------------------------------------------------------------------------

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

/** `outer ∘ inner`: erst `inner`, dann `outer`. Umfärbungen tragen Verknüpfungen nicht. */
function chain(outer: Mapping, inner: Mapping): Mapping {
  return {
    originX: inner.originX,
    originY: inner.originY,
    scale: inner.scale * outer.scale,
    toX: outer.toX + (inner.toX - outer.originX) * outer.scale,
    toY: outer.toY + (inner.toY - outer.originY) * outer.scale,
    strokeScale: inner.strokeScale * outer.strokeScale,
  };
}

function inverse(m: Mapping): Mapping {
  return {
    originX: m.toX,
    originY: m.toY,
    scale: 1 / m.scale,
    toX: m.originX,
    toY: m.originY,
    strokeScale: 1 / m.strokeScale,
  };
}

function translation(dxMm: number, dyMm: number): Mapping {
  return { originX: 0, originY: 0, scale: 1, toX: dxMm, toY: dyMm, strokeScale: 1 };
}

/** Bildet eine Hülle so ab, dass ihre Mitte auf die Mitte von `to` fällt, gleichmäßig skaliert. */
function hullToHull(from: ZoneBoundsMm, to: ZoneBoundsMm, strokeScale: number): Mapping {
  return {
    originX: (from.minX + from.maxX) / 2,
    originY: (from.minY + from.maxY) / 2,
    scale: (to.maxX - to.minX) / (from.maxX - from.minX),
    toX: (to.minX + to.maxX) / 2,
    toY: (to.minY + to.maxY) / 2,
    strokeScale,
  };
}

function mapBounds(m: Mapping, b: ZoneBoundsMm): ZoneBoundsMm {
  return {
    minX: round3(m.toX + (b.minX - m.originX) * m.scale),
    minY: round3(m.toY + (b.minY - m.originY) * m.scale),
    maxX: round3(m.toX + (b.maxX - m.originX) * m.scale),
    maxY: round3(m.toY + (b.maxY - m.originY) * m.scale),
  };
}

/**
 * Bildet ein Primitiv samt Gruppen und Transformationen ab. Eine gleichmäßige Skalierung mit
 * Verschiebung vertauscht mit Drehung und Verschiebung, wenn man deren Bezugspunkte mitnimmt:
 * der Drehpunkt wird abgebildet, eine Verschiebung skaliert. Pfade mit anderen als den
 * absoluten Kommandos M, L, H, V, C, Q, Z wirft `mapPrimitive` sichtbar ab.
 */
export function mapDeep(m: Mapping, primitive: Primitive): Primitive {
  const { transform } = primitive;
  const mappedTransform =
    transform === undefined
      ? undefined
      : {
          ...(transform.rotate === undefined
            ? {}
            : {
                rotate: {
                  angle: transform.rotate.angle,
                  cx: round3(m.toX + (transform.rotate.cx - m.originX) * m.scale),
                  cy: round3(m.toY + (transform.rotate.cy - m.originY) * m.scale),
                },
              }),
          ...(transform.translate === undefined
            ? {}
            : {
                translate: {
                  dxMm: round3(transform.translate.dxMm * m.scale),
                  dyMm: round3(transform.translate.dyMm * m.scale),
                },
              }),
        };
  if (primitive.type === 'group') {
    const style = mapStyle(m, primitive.style);
    return {
      ...primitive,
      ...(style === undefined ? {} : { style }),
      ...(mappedTransform === undefined ? {} : { transform: mappedTransform }),
      children: primitive.children.map((child) => mapDeep(m, child)),
    };
  }
  const { transform: _dropped, ...plain } = primitive;
  const mapped = mapPrimitive(m, plain as Primitive);
  return mappedTransform === undefined ? mapped : { ...mapped, transform: mappedTransform };
}

// ---------------------------------------------------------------------------------------------
// Hüllen
// ---------------------------------------------------------------------------------------------

function union(bounds: readonly ZoneBoundsMm[]): ZoneBoundsMm {
  return bounds.reduce((a, b) => ({
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }));
}

/** Tintenhülle: Mittellinie plus halber Strich, wo ein Strich gezogen wird. */
function inkOf(primitives: readonly Primitive[]): ZoneBoundsMm {
  return union(
    primitives.map((primitive) => {
      const b = boundsOfMm(primitive);
      const stroke = primitive.style?.stroke;
      const half =
        primitive.type === 'group' || primitive.type === 'text' || stroke === undefined || stroke === 'none'
          ? 0
          : (primitive.style?.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM) / 2;
      return { minX: b.minX - half, minY: b.minY - half, maxX: b.maxX + half, maxY: b.maxY + half };
    }),
  );
}

const width = (b: ZoneBoundsMm): number => b.maxX - b.minX;
const height = (b: ZoneBoundsMm): number => b.maxY - b.minY;

// ---------------------------------------------------------------------------------------------
// Maße der Hinweis-Randlage, aus den vermessenen Daten gelesen
// ---------------------------------------------------------------------------------------------

interface MarginMeasures {
  /** Oberkante der Hinweismarke („?"-Scheitel samt Strich), 9,6 mm. */
  readonly topMm: number;
  /** Höhe der Hinweismarke an der Person, 9,6…20,5 mm. */
  readonly cellHeightMm: number;
  /** Abstand der Achse von „?" zur linken Trägerhülle, 4,5 mm (`hint-mark-axis`). */
  readonly axisOffsetMm: number;
  /** Versatz von „!" gegen „?", 1 mm (5.8.1.14_2 gegen 5.8.1.13_2). */
  readonly acuteShiftMm: number;
  /** Lichter Abstand der Markentinte zur Trägerhülle, 1,6 mm (Tinte bis 9,4, Raute ab 11). */
  readonly clearanceMm: number;
}

let marginMeasures: MarginMeasures | undefined;

function measures(): MarginMeasures {
  if (marginMeasures !== undefined) return marginMeasures;
  const layout = STATE_HINT_LAYOUTS.person;
  const ink = inkOf(hintMark('suspected-situation', layout));
  marginMeasures = {
    topMm: round3(ink.minY),
    cellHeightMm: round3(height(ink)),
    axisOffsetMm: layout.carrierHullMm.minX - layout.markAxisXMm['suspected-situation'],
    acuteShiftMm: layout.markAxisXMm['acute-situation'] - layout.markAxisXMm['suspected-situation'],
    clearanceMm: round3(layout.carrierHullMm.minX - ink.maxX),
  };
  return marginMeasures;
}

/**
 * Strichfaktor der Randlagenfiguren: die Hinweismarke ist die Figur aus 5.8.1.13 im Maßstab
 * 1 : 2, ihr Strich aber 0,8 statt 1,2 mm (Faktor 2/3, nicht 1/2). Übertragen auf jede andere
 * verkleinerte Figur in der Randlage.
 */
const MARGIN_STROKE_SCALE = 0.8 / 1.2;

/** Abstand, den ein auf die Fläche verkleinertes Zeichen oben und unten hält. */
const FIT_EDGE_MM = 0.05;

/** Mindestabstand der Tinte zum Rand der Zeichenfläche; darunter wächst die Fläche. */
const CANVAS_EDGE_MM = 1;

/** Zwei Zellen übereinander, mittig um y = 16 mit 1 mm Fuge. */
const STACK_GAP_MM = 1;

/** Die größte der drei Schadensstufen (5.8.4.3) spannt 28,28 mm; sie füllt höchstens die Körperhülle. */
const DAMAGE_REFERENCE = 'L.8_Schäden am Außendeich.svg';
const MARGIN_REFERENCE = '5.8.1_Beispiel 3.svg';

const MARGIN_GROUPS: readonly StateGroupId[] = ['tactics-hazards', 'activity', 'fire', 'access'];

// ---------------------------------------------------------------------------------------------
// Bausteine des Zeichens
// ---------------------------------------------------------------------------------------------

/** Ein Stück der Zeichnung: Träger (ohne `part`) oder ein platzierter Zustandsteil. */
interface Piece {
  readonly part?: Omit<PlacedStatePart, 'primitives'>;
  readonly primitives: readonly Primitive[];
}

function mapPieces(m: Mapping, pieces: readonly Piece[]): Piece[] {
  return pieces.map((piece) => ({ ...piece, primitives: piece.primitives.map((p) => mapDeep(m, p)) }));
}

function bodyOf(primitives: readonly Primitive[]): Primitive {
  const bodies = primitives.filter((primitive) => primitive.role === 'body');
  if (bodies.length !== 1) throw new Error(`Zustandsträger mit ${bodies.length} Körperprimitiven.`);
  return bodies[0] as Primitive;
}

/** Der Körper der Zustandsfassung mit Füllung und Organisationssignatur des Zeichens. */
function withBodyStyle(carrierBody: Primitive, plainBody: Primitive): Primitive {
  const fill = plainBody.style?.fill;
  const dash = plainBody.style?.bodyStrokeDashToken;
  return {
    ...carrierBody,
    role: 'body',
    style: {
      ...carrierBody.style,
      ...(fill === undefined || fill === 'none' ? {} : { fill }),
      ...(dash === undefined ? {} : { bodyStrokeDashToken: dash }),
    },
  };
}

function replaceBody(pieces: readonly Piece[], replace: (body: Primitive) => Primitive): Piece[] {
  return pieces.map((piece) =>
    piece.part !== undefined
      ? piece
      : { ...piece, primitives: piece.primitives.map((p) => (p.role === 'body' ? replace(p) : p)) },
  );
}

function carrierHull(pieces: readonly Piece[]): ZoneBoundsMm {
  return boundsOfMm(bodyOf(pieces.filter((piece) => piece.part === undefined).flatMap((piece) => piece.primitives)));
}

/** Waagerechte Ausdehnung aller Primitive, die das Band `top…bottom` schneiden. */
function bandExtent(pieces: readonly Piece[], top: number, bottom: number): { minX: number; maxX: number } {
  const hits = pieces
    .flatMap((piece) => piece.primitives)
    .map((primitive) => boundsOfMm(primitive))
    .filter((b) => b.maxY >= top && b.minY <= bottom);
  return {
    minX: Math.min(...hits.map((b) => b.minX)),
    maxX: Math.max(...hits.map((b) => b.maxX)),
  };
}

interface CarrierSign {
  readonly pieces: readonly Piece[];
  readonly frame: StateCarrierFrameId;
  readonly reference: `${string}.svg`;
}

/**
 * Die Personenraute der Zustandsfassung mit allem, was das Zeichen daneben trägt.
 *
 * `F` bildet den Personenkörper vor der Platzierung auf die Raute der Fassung ab, `P` ist die
 * Platzierung, die `compose()` am Körper vorgenommen hat (etwa unter einem Kopf). Die übrigen
 * Primitive des Zeichens wandern mit `F`; Raute und Marken des Zustands mit `F ∘ P ∘ F⁻¹`, also
 * so, wie `P` sie in der Fassung verschöbe. Ohne weitere Angaben ist `P` die Identität und die
 * Zeichnung aus 5.8.8 steht unverändert.
 *
 * Die Variante `compact-person-diamond-26mm-lowered-2mm` senkt die Fassung um bis zu 2 mm ab, wie
 * ihr Körper gegen die kompakte Raute abgesenkt ist — höchstens so weit, dass die Zeichnung in der
 * Fläche bleibt (die Wassergefahr 5.8.8.9 reicht schon bis y = 31,35).
 */
function personSign(
  plain: readonly Primitive[],
  unplacedBody: Primitive,
  value: StateId | undefined,
): CarrierSign {
  const drawing = personDrawing(value ?? 'person-uninjured');
  const frame = PERSON_STATE_FRAMES[drawing.frame];
  const plainBody = bodyOf(plain);
  const unplaced = boundsOfMm(unplacedBody);
  const placed = boundsOfMm(plainBody);
  const stateInk = inkOf([drawing.diamond, ...drawing.body, ...drawing.corners.flatMap((c) => c.primitives)]);
  const wantedDy = (unplaced.minY + unplaced.maxY) / 2 - CANVAS_32.height / 2;
  const dy = Math.max(0, Math.min(wantedDy, CANVAS_32.height - stateInk.maxY));
  const shift = translation(0, dy);
  const frameHull = mapBounds(shift, frame.hullMm);
  const toFrame = hullToHull(unplaced, frameHull, 1);
  const placement = hullToHull(unplaced, placed, 1);
  const inFrame = chain(chain(toFrame, placement), inverse(toFrame));
  const stateMap = chain(inFrame, shift);
  if (dy !== 0) {
    noteDerivation({
      dimension: 'states',
      part: `Rautenlage "${drawing.frame}" an der abgesenkten Personenfassung um ${round3(dy)} mm verschoben`,
      basis: 'transferred',
      from: frame.reference,
    });
  }
  const basis: StatePlacementBasis = 'transferred';
  const pieces: Piece[] = [];
  for (const child of plain) {
    if (child !== plainBody) {
      pieces.push({ primitives: [mapDeep(toFrame, child)] });
      continue;
    }
    pieces.push({ primitives: [withBodyStyle(mapDeep(stateMap, drawing.diamond), plainBody)] });
    if (value !== undefined && drawing.body.length > 0) {
      pieces.push({
        part: { value, group: 'persons', zone: 'body', basis, reference: drawing.reference },
        primitives: drawing.body.map((p) => mapDeep(stateMap, p)),
      });
    }
  }
  // Ein Kopf steht über der ganzen Zustandszeichnung, nicht nur über der Raute: die Wellen der
  // Wassergefahr (5.8.8.9) liegen dort, wo ihm `compose()` über dem Körper Platz gemacht hat.
  const stateTop = Math.min(
    ...[drawing.diamond, ...(value === undefined ? [] : drawing.body)].map(
      (p) => boundsOfMm(mapDeep(stateMap, p)).minY,
    ),
  );
  const heads = pieces.flatMap((piece) => piece.primitives).filter((p) => p.role === 'head');
  const headBottom = heads.length === 0 ? undefined : union(heads.map((p) => boundsOfMm(p))).maxY;
  const headLimit = stateTop - HEAD_GAP_MM * toFrame.scale;
  if (headBottom !== undefined && headBottom > headLimit + 0.01) {
    const lift = translation(0, round3(headLimit - headBottom));
    pieces.forEach((piece, index) => {
      if (piece.part === undefined && piece.primitives.some((p) => p.role === 'head')) {
        pieces[index] = { primitives: piece.primitives.map((p) => (p.role === 'head' ? mapDeep(lift, p) : p)) };
      }
    });
    noteDerivation({
      dimension: 'states',
      part: 'Kopf über die Zustandszeichnung gehoben',
      basis: 'constructed',
      from: 'HEAD_GAP_MM',
    });
  }
  if (value !== undefined) {
    for (const { corner, primitives } of drawing.corners) {
      pieces.push({
        part: { value, group: 'persons', zone: 'state-margin', corner, basis, reference: drawing.reference },
        primitives: primitives.map((p) => mapDeep(stateMap, p)),
      });
    }
  }
  return { pieces: fitBelowCanvasTop(pieces), frame: drawing.frame, reference: drawing.reference };
}

/**
 * Reicht das Zeichen über die Ober- oder Unterkante — ein Kopf über einer Zustandszeichnung, die
 * selbst bis y = 1 reicht (5.8.8.8, 5.8.8.12 bis 5.8.8.14), oder eine abgesenkte Fassung unter
 * einem Kopf —, wird es als Ganzes senkrecht in die Fläche verkleinert. Die Fußzeile zählt nicht mit: sie trägt
 * ihre Textbox bekannt über die Fläche hinaus.
 */
function fitBelowCanvasTop(pieces: readonly Piece[]): Piece[] {
  const drawn = pieces.flatMap((piece) => piece.primitives).filter((p) => p.role !== 'foot');
  const ink = inkOf(drawn);
  if (ink.minY >= 0 && ink.maxY <= CANVAS_32.height) return [...pieces];
  const top = Math.max(ink.minY, FIT_EDGE_MM);
  const bottom = Math.min(ink.maxY, CANVAS_32.height - FIT_EDGE_MM);
  const fit: Mapping = {
    originX: CANVAS_32.width / 2,
    originY: ink.minY,
    scale: (bottom - top) / (ink.maxY - ink.minY),
    toX: CANVAS_32.width / 2,
    toY: top,
    strokeScale: 1,
  };
  noteDerivation({
    dimension: 'states',
    part: 'Zeichen mit Kopf und Zustandszeichnung auf die Fläche verkleinert',
    basis: 'constructed',
    from: 'CANVAS_32',
  });
  return mapPieces(fit, pieces);
}

/** Schadensgrad 5.8.4 auf dem Körper, um dessen Mitte (L.8, L.9). */
function damagePiece(value: StateId, hull: ZoneBoundsMm): Piece {
  const definition = definitionOf(value, 'primary');
  const largest = union(definitionOf('destroyed', 'primary').primitives.map((p) => boundsOfMm(p)));
  const factor = Math.min(1, Math.min(width(hull), height(hull)) / width(largest));
  const m: Mapping = {
    originX: CANVAS_32.width / 2,
    originY: CANVAS_32.height / 2,
    scale: factor,
    toX: (hull.minX + hull.maxX) / 2,
    toY: (hull.minY + hull.maxY) / 2,
    strokeScale: 1,
  };
  noteDerivation({
    dimension: 'states',
    part: `Schadensgrad "${value}" auf der Körpermitte`,
    basis: 'transferred',
    from: DAMAGE_REFERENCE,
  });
  return {
    part: { value, group: 'damage', zone: 'body', basis: 'transferred', reference: DAMAGE_REFERENCE },
    primitives: definition.primitives.map((p) => mapDeep(m, p)),
  };
}

/** Die Strichfarbe des Trägers, die ein Hinweis übernimmt (`hint-mark-ink`). */
function carrierInk(body: Primitive): ColorToken {
  const stroke = body.style?.stroke;
  return stroke === undefined || stroke === 'none' ? 'schwarz' : stroke;
}

/** Eine Figur der Randlage, ohne Lage: Primitive samt Tintenhülle. */
interface MarginFigure {
  readonly value: StateId;
  readonly primitives: readonly Primitive[];
  readonly ink: ZoneBoundsMm;
  readonly reference: `${string}.svg`;
}

function hintFigure(hint: StateHintId, layout: StateHintLayout): MarginFigure {
  const primitives = hintMark(hint, layout);
  return { value: hint, primitives, ink: inkOf(primitives), reference: layout.reference[hint] };
}

/** Die Zeichnung eines Werts, auf die Höhe der Hinweismarke verkleinert. */
function scaledFigure(value: StateId): MarginFigure {
  const definition = definitionOf(value, 'primary');
  const midline = union(definition.primitives.map((p) => boundsOfMm(p)));
  const at = (scale: number): readonly Primitive[] => {
    const m: Mapping = {
      originX: midline.minX,
      originY: midline.minY,
      scale,
      toX: 0,
      toY: 0,
      strokeScale: MARGIN_STROKE_SCALE,
    };
    return definition.primitives.map((p) => mapDeep(m, p));
  };
  // Die Tinte soll genau die Hinweishöhe füllen; der Strich wächst nicht mit dem Maßstab, also
  // erst den Strichanteil messen und dann die Mittellinie auf den Rest bringen.
  const cell = measures().cellHeightMm;
  const first = at(cell / height(midline));
  const strokeShare = height(inkOf(first)) - height(midline) * (cell / height(midline));
  const primitives = at((cell - strokeShare) / height(midline));
  return { value, primitives, ink: inkOf(primitives), reference: definition.referenceAsset };
}

/** Verschiebt eine Figur so, dass ihre Tinte waagerecht um `centerX` und ab `top` steht. */
function placeFigure(figure: MarginFigure, centerX: number, top: number): readonly Primitive[] {
  const m = translation(
    centerX - (figure.ink.minX + figure.ink.maxX) / 2,
    top - figure.ink.minY,
  );
  return figure.primitives.map((p) => mapDeep(m, p));
}

function marginPart(
  figure: MarginFigure,
  zone: 'state-margin' | 'tendency-margin',
  primitives: readonly Primitive[],
): Piece {
  return {
    part: { value: figure.value, group: groupOf(figure.value), zone, basis: 'transferred', reference: figure.reference },
    primitives,
  };
}

// ---------------------------------------------------------------------------------------------
// Einstieg
// ---------------------------------------------------------------------------------------------

export interface StateSignInput {
  readonly carrier: StateCarrierInput;
  /** Das fertige Zeichen ohne Zustand auf 32 × 32 mm, mit genau einem Körperprimitiv. */
  readonly plain: readonly Primitive[];
  /** Der Körper vor jeder Platzierung, wie das Grundzeichen ihn liefert. */
  readonly unplacedBody: Primitive;
  readonly states: readonly StateId[];
  readonly tendency?: TendencyId;
}

export interface StateSignLayout {
  readonly placement: StatePlacement;
  /** Alle Primitive in Malreihenfolge; genau eines trägt `role: 'body'`. */
  readonly children: readonly Primitive[];
}

const STATE_ORDER = new Map<StateId, number>(STATE_IDS.map((id, index) => [id, index]));
const byStateOrder = (a: StateId, b: StateId): number =>
  (STATE_ORDER.get(a) ?? 0) - (STATE_ORDER.get(b) ?? 0);

/**
 * Legt Zustände und Tendenz an ein fertiges Zeichen. Die Eingabe ist geprüft (`validateSpec`
 * bzw. `assertPlaceable` in `placeStates()`): kein Wetter, kein Tier, keine Taktik, höchstens ein
 * Personenzustand und der nur an der Person.
 */
export function layoutStateSign(input: StateSignInput): StateSignLayout {
  const { carrier, plain, unplacedBody, tendency } = input;
  const states = [...input.states].sort(byStateOrder);
  const personValue = states.find((value) => groupOf(value) === 'persons');
  const damage = states.filter((value) => groupOf(value) === 'damage');
  const left = states.filter((value) => MARGIN_GROUPS.includes(groupOf(value)));
  const needsMargin = left.length > 0 || tendency !== undefined;
  const plainBody = bodyOf(plain);

  // 1. Der Träger in seiner Zustandsfassung, noch auf der 32-mm-Fläche.
  let sign: CarrierSign =
    carrier.kind === 'person' && (personValue !== undefined || needsMargin)
      ? personSign(plain, unplacedBody, personValue)
      : {
          pieces: plain.map((primitive) => ({ primitives: [primitive] })),
          frame: 'body-in-place',
          reference: damage.length > 0 ? DAMAGE_REFERENCE : MARGIN_REFERENCE,
        };

  // 2. Schadensgrad auf dem Körper.
  for (const value of damage) {
    sign = { ...sign, pieces: [...sign.pieces, damagePiece(value, carrierHull(sign.pieces))] };
  }

  let canvas: { width: number; height: number } = { width: CANVAS_32.width, height: CANVAS_32.height };
  let baseArea: ZoneBoundsMm = BASE_AREA_32;
  let pieces: Piece[] = [...sign.pieces];
  let frame = sign.frame;
  let reference = sign.reference;

  // 3. Randlagen: Träger verkleinert, Marken links, Tendenz rechts.
  if (needsMargin) {
    const mirrored = left.length === 0;
    const isHazard = carrier.kind === 'hazard';
    if (isHazard) {
      const layout = STATE_HINT_LAYOUTS.hazard;
      const target = layout.carrierHullMm;
      const dx = mirrored ? CANVAS_32.width - (target.minX + target.maxX) : 0;
      const shrink = chain(
        translation(dx, 0),
        hullToHull(boundsOfMm(plainBody), target, PERSON_HINT_SHRINK.strokeScale),
      );
      pieces = replaceBody(mapPieces(shrink, pieces), () =>
        withBodyStyle(mapDeep(translation(dx, 0), hazardTriangle('suspected-situation')), plainBody),
      );
      frame = 'hazard-triangle-23mm-beside-hint';
      reference = layout.reference['suspected-situation'];
      canvas = { ...layout.canvasMm };
      baseArea = layout.baseAreaMm;
    } else {
      const person = STATE_HINT_LAYOUTS.person;
      const shrink: Mapping = mirrored
        ? { ...PERSON_HINT_SHRINK, toX: person.canvasMm.width - PERSON_HINT_SHRINK.toX }
        : PERSON_HINT_SHRINK;
      pieces = mapPieces(shrink, pieces);
      frame = carrier.kind === 'person' ? 'person-diamond-20mm-beside-hint' : 'body-beside-margin';
      reference = MARGIN_REFERENCE;
      canvas = { ...person.canvasMm };
      baseArea = mirrored
        ? { minX: 0, minY: 0, maxX: CANVAS_32.width, maxY: CANVAS_32.height }
        : person.baseAreaMm;
    }
    noteDerivation({
      dimension: tendency !== undefined && left.length === 0 ? 'tendency' : 'states',
      part: `Träger "${carrier.variant === undefined ? carrier.kind : `${carrier.kind}/${carrier.variant}`}" neben der Randlage verkleinert`,
      basis: 'transferred',
      from: isHazard ? STATE_HINT_LAYOUTS.hazard.reference['suspected-situation'] : MARGIN_REFERENCE,
    });

    const margin = measures();
    const hintLayout: StateHintLayout = isHazard
      ? STATE_HINT_LAYOUTS.hazard
      : { ...STATE_HINT_LAYOUTS.person, ink: carrierInk(plainBody) };
    const carrierPieces = [...pieces];
    const marginPieces: Piece[] = [];

    const onlyHint = left.length === 1 && HINTS.includes(left[0] as StateId) ? (left[0] as StateHintId) : undefined;
    if (onlyHint !== undefined) {
      // Ein einzelner Hinweis: die vermessene Lage, die Achse an der Trägerhülle.
      const figureTop = margin.topMm;
      const band = bandExtent(carrierPieces, figureTop, figureTop + margin.cellHeightMm);
      const axis = band.minX - margin.axisOffsetMm;
      const layout: StateHintLayout = isHazard
        ? hintLayout
        : {
            ...hintLayout,
            markAxisXMm: { 'suspected-situation': axis, 'acute-situation': axis + margin.acuteShiftMm },
          };
      const figure = hintFigure(onlyHint, layout);
      marginPieces.push(marginPart(figure, 'state-margin', figure.primitives));
      noteDerivation({
        dimension: 'states',
        part: `Hinweis "${onlyHint}" links neben dem Träger`,
        basis: 'transferred',
        from: figure.reference,
      });
    } else if (left.length > 0) {
      const figures = left.map((value) =>
        HINTS.includes(value) ? hintFigure(value as StateHintId, hintLayout) : scaledFigure(value),
      );
      const columns: MarginFigure[][] = [];
      for (let index = 0; index < figures.length; index += 2) columns.push(figures.slice(index, index + 2));
      const tops = (count: number): number[] =>
        count === 1
          ? [margin.topMm]
          : [
              CANVAS_32.height / 2 - STACK_GAP_MM / 2 - margin.cellHeightMm,
              CANVAS_32.height / 2 + STACK_GAP_MM / 2,
            ];
      const allTops = columns.flatMap((column) => tops(column.length));
      const bandTop = Math.min(...allTops);
      const bandBottom = Math.max(...allTops) + margin.cellHeightMm;
      let right = bandExtent(carrierPieces, bandTop, bandBottom).minX - margin.clearanceMm;
      for (const column of columns) {
        const columnWidth = Math.max(...column.map((figure) => width(figure.ink)));
        const centerX = right - columnWidth / 2;
        const columnTops = tops(column.length);
        column.forEach((figure, row) => {
          marginPieces.push(marginPart(figure, 'state-margin', placeFigure(figure, centerX, columnTops[row] as number)));
          noteDerivation({
            dimension: 'states',
            part: `Zustand "${figure.value}" in der Randlage links neben dem Träger`,
            basis: 'transferred',
            from: MARGIN_REFERENCE,
          });
        });
        right -= columnWidth + margin.clearanceMm;
      }
    }

    if (tendency !== undefined) {
      const figure = scaledFigure(tendency);
      const band = bandExtent(carrierPieces, margin.topMm, margin.topMm + margin.cellHeightMm);
      const leftEdge = band.maxX + margin.clearanceMm;
      marginPieces.push(
        marginPart(figure, 'tendency-margin', placeFigure(figure, leftEdge + width(figure.ink) / 2, margin.topMm)),
      );
      noteDerivation({
        dimension: 'tendency',
        part: `Tendenz "${tendency}" rechts neben dem Träger, gespiegelt zur Hinweis-Randlage`,
        basis: 'transferred',
        from: MARGIN_REFERENCE,
      });
    }

    pieces = [...carrierPieces, ...marginPieces];

    // Die Fläche wächst, wo eine Randlage über den Rand reichte.
    const ink = inkOf(marginPieces.flatMap((piece) => piece.primitives));
    const dx = ink.minX < CANVAS_EDGE_MM ? round3(CANVAS_EDGE_MM - ink.minX) : 0;
    if (dx > 0) {
      pieces = mapPieces(translation(dx, 0), pieces);
      baseArea = mapBounds(translation(dx, 0), baseArea);
    }
    canvas = {
      width: round3(Math.max(canvas.width + dx, ink.maxX + dx + CANVAS_EDGE_MM)),
      height: canvas.height,
    };
  }

  const children = withMinRenderPx(pieces.flatMap((piece) => piece.primitives), canvas.width);
  const carrierPrimitives = withMinRenderPx(
    pieces.filter((piece) => piece.part === undefined).flatMap((piece) => piece.primitives),
    canvas.width,
  );
  const body = bodyOf(carrierPrimitives);
  return {
    children,
    placement: {
      canvasMm: canvas,
      baseAreaMm: baseArea,
      carrier: {
        frame,
        primitives: [body, ...carrierPrimitives.filter((primitive) => primitive !== body)],
        hullMm: boundsOfMm(body),
        basis: 'transferred',
        reference,
      },
      parts: pieces.flatMap((piece) =>
        piece.part === undefined
          ? []
          : [{ ...piece.part, primitives: withMinRenderPx(piece.primitives, canvas.width) }],
      ),
    },
  };
}

/**
 * Rechnet die Rendergrenze der Läufe auf die gewachsene Zeichenfläche um. Den Schriftgrad hat
 * `mapPrimitive` schon eingerechnet (Grenze ÷ Maßstab); hier kommt nur die Breite hinzu, denn die
 * Grenze gilt für die Breite der ganzen Fläche (`minRenderPxFor` in `compose.ts`). Umgerechnet statt
 * neu berechnet: manche Läufe tragen eine strengere, eigens gesetzte Grenze (die Zusatzkennungen
 * aus 5.8.8 etwa 64 px), die eine Neuberechnung unterböte.
 */
function withMinRenderPx(primitives: readonly Primitive[], viewBoxWidthMm: number): Primitive[] {
  const factor = viewBoxWidthMm / CANVAS_32.width;
  return primitives.map((primitive) => {
    if (primitive.type === 'group') {
      return { ...primitive, children: withMinRenderPx(primitive.children, viewBoxWidthMm) };
    }
    if (primitive.type !== 'text' || primitive.minRenderPx === undefined || factor === 1) return primitive;
    return { ...primitive, minRenderPx: Math.ceil(primitive.minRenderPx * factor) };
  });
}

/**
 * Abgeleitete Lage am bloßen Grundzeichen, für `placeStates()`: ohne weitere Angaben der Spec,
 * mit dem Körper aus `baseDrawing()`.
 */
export function deriveStatePlacement(input: StatePlacementInput): StatePlacement {
  const plain = baseDrawing(input.carrier.kind, input.carrier.variant).children;
  return layoutStateSign({
    carrier: input.carrier,
    plain,
    unplacedBody: bodyOf(plain),
    states: input.states,
    ...(input.tendency === undefined ? {} : { tendency: input.tendency }),
  }).placement;
}

// ---------------------------------------------------------------------------------------------
// Einhängepunkt für compose()
// ---------------------------------------------------------------------------------------------

/** Ob die Spec einen Zustand oder eine Tendenz trägt. */
export function carriesStates(spec: SymbolSpec): boolean {
  return (spec.states?.length ?? 0) > 0 || spec.tendency !== undefined;
}

/** Dieselbe Spec ohne Zustände und Tendenz. */
export function withoutStates(spec: SymbolSpec): SymbolSpec {
  const { states: _states, tendency: _tendency, ...plain } = spec;
  return plain;
}

/**
 * Die abgeleitete Zeichnung eines Zeichens mit Zuständen: `plain` ist dasselbe Zeichen ohne
 * Zustände, fertig komponiert. Titel und Beschreibung kommen von der vollständigen Spec.
 */
export function composeDerivedStates(
  spec: SymbolSpec,
  plain: Drawing,
  meta: { readonly title?: string; readonly description?: string },
): Drawing {
  const plainBody = bodyOf(plain.children);
  // Der Körper vor der Platzierung: aus dem Grundzeichen, außer eine Funktionsrolle bringt ihren
  // eigenen Körper mit — der steht unplatziert im Zeichen.
  const unplacedBody =
    spec.functionRole === undefined ? bodyOf(baseDrawing(spec.kind, spec.bodyVariant).children) : plainBody;
  const layout = layoutStateSign({
    carrier: { kind: spec.kind, ...(spec.bodyVariant === undefined ? {} : { variant: spec.bodyVariant }) },
    plain: plain.children,
    unplacedBody,
    states: spec.states ?? [],
    ...(spec.tendency === undefined ? {} : { tendency: spec.tendency }),
  });
  // Alles außer Grundform und Zuständen: was das Zeichen ohne Zustand trägt, wandert mit.
  const beside = (Object.keys(withoutStates(spec)) as (keyof SymbolSpec)[]).filter((key) => {
    if (key === 'kind' || key === 'bodyVariant') return false;
    const value = spec[key];
    return value !== undefined && !(Array.isArray(value) && value.length === 0);
  });
  if (beside.length > 0) {
    noteDerivation({
      dimension: 'states',
      part: `${beside.join(', ')} mit dem Träger in die Zustandsfassung abgebildet`,
      basis: 'transferred',
      from: layout.placement.carrier?.reference ?? MARGIN_REFERENCE,
    });
  }
  return {
    viewBox: { width: layout.placement.canvasMm.width, height: layout.placement.canvasMm.height },
    children: layout.children,
    ...(meta.title !== undefined ? { title: meta.title } : {}),
    ...(meta.description !== undefined ? { description: meta.description } : {}),
  };
}
