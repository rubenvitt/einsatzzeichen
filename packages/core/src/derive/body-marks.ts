import {
  BODY_MARK_RENDITION_IDS,
  BODY_VARIANT_IDS,
  CAPABILITY_IDS,
  SYMBOL_KINDS,
  VEHICLE_CATEGORY_IDS,
  type BodyMarkId,
  type BodyMarkRenditionId,
  type BodyVariantId,
  type CapabilityId,
  type Point,
  type Primitive,
  type SymbolKind,
  type VehicleCategoryId,
} from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { baseDrawing } from '../geometry/base-symbols.js';
import { ANHANG_C_BODY_MARK_CONTEXTS } from '../geometry/body-marks-anhang-c/index.js';
import { BODY_MARK_IDS, bodyMark as measuredBodyMark } from '../geometry/body-marks.js';
import { pictogram } from '../geometry/pictograms/index.js';
import { NotMeasuredError } from '../not-measured.js';
import {
  affineKey,
  applyAffine,
  boxToBox,
  isUniform,
  mapPrimitive,
  uniformAbout,
  unionBounds,
  type Affine,
} from './affine.js';
import { bodyBoundsMm } from './body-bounds.js';
import {
  bodyRegion,
  distanceToContour,
  inscribedRect,
  insidePolygon,
  rayToContour,
  type BodyRegion,
} from './body-region.js';
import { fitPictograms } from './fit-pictogram.js';
import { noteDerivation } from './record.js';

/**
 * Randbündige Körpermarken an **jeder** Körperform (Entscheidung vom 2. Oktober 2026).
 *
 * `geometry/body-marks.ts` zeichnet jede Marke an den Paaren aus Körperform und Marke, an denen
 * die Referenz sie zeigt, und wirft sonst `NotMeasuredError`. Diese Datei fängt genau diesen Wurf
 * und leitet ab, statt abzulehnen:
 *
 * 1. **Die nächstliegende vermessene Fassung derselben Marke**, hüllenrelativ übertragen:
 *    - dieselbe Körperform an einer anderen Hülle (verschoben, verkleinert — die Anhängermarken
 *      an der verschobenen Anhängerhülle, die 26-mm-Personenfassungen an der 30-mm-Raute);
 *    - dieselbe Körperfamilie (Formation → Container und stehendes Rechteck, Landfahrzeug →
 *      Anhänger und Wechsellader, Kreis 12 → Stelle, reduziertes Haus → Gebäude): Fläche auf
 *      Fläche, je Achse mit eigenem Faktor, damit randbündige Teile wieder randbündig sind;
 *    - sonst eine andere Familie, vorzugsweise die Formation: die vermessene Fläche gleichmäßig in
 *      das größte Rechteck derselben Proportion in der Zielfläche (am Kreis und an der Raute das
 *      eingeschriebene Rechteck), und jede Linie, die in der Vorlage an der Körperkante endet,
 *      endet wieder an der Kontur des Zielkörpers (die Fachdienstteilung reicht so auch an Raute,
 *      Dreieck und Kreis von Kante zu Kante).
 *    Eine Marke ohne Berührung der Körperkante wird nie verzerrt: sie wird gleichmäßig um ihre
 *    Mitte verkleinert, die Mitte folgt der Fläche.
 * 2. **Gar keine randbündige Fassung** (61 Fähigkeiten, etwa Atemschutz oder die Tierarten): die
 *    Einzeldarstellung aus Kapitel 4, eingepasst ins Innenfeld wie bei `capabilities`
 *    (`fitPictograms`). Mehrere solche Marken stehen nebeneinander.
 *
 * Striche behalten 0,5 mm. Jede Ableitung trägt eine Notiz (`noteDerivation`); vermessene Paare
 * laufen unverändert durch und tragen keine.
 */

type BodyMarkContext = Parameters<typeof measuredBodyMark>[1];

type Family =
  | 'rect'
  | 'land'
  | 'land-inverted'
  | 'air'
  | 'water'
  | 'circle'
  | 'diamond'
  | 'house'
  | 'other';

/** Familienfolge für Vorlagen aus fremder Familie: zuerst die Formation, sie ist am dichtesten vermessen. */
const CROSS_FAMILY_ORDER: readonly Family[] = [
  'rect', 'land', 'circle', 'diamond', 'house', 'air', 'water', 'land-inverted', 'other',
];

function familyOf(kind: SymbolKind, variant: BodyVariantId | undefined): Family {
  switch (kind) {
    case 'formation':
    case 'container':
    case 'upright-rectangle':
      return 'rect';
    case 'vehicle-land':
      return variant === 'inverted-hull-track' ? 'land-inverted' : 'land';
    case 'trailer':
    case 'swap-loader-vehicle':
      return 'land';
    case 'vehicle-air':
      return 'air';
    case 'vehicle-water':
      return 'water';
    case 'circle-12':
    case 'post':
      return 'circle';
    case 'person':
      return 'diamond';
    case 'reduced-house':
    case 'building':
      return 'house';
    default:
      return 'other';
  }
}

interface SourcePair {
  readonly kind: SymbolKind;
  readonly bodyVariant?: BodyVariantId;
  readonly vehicleCategory?: VehicleCategoryId;
  readonly rendition?: BodyMarkRenditionId;
  /** Die Hülle, an der die Vorlage vermessen ist (stabil je Paar, siehe `sourceHull`). */
  readonly hull: BoundsMm;
}

/**
 * Die Personenfassungen aus D.3 (`PERSON_MARKS`) sind an der 26-mm-Raute vermessen, die
 * Grundzeichnung der Person misst 30 mm. Die Vorlage wird an der mittigen 26-mm-Hülle gezeichnet;
 * die Fassungen rechnen relativ zur Mitte.
 */
const PERSON_MEASURED_HULL: BoundsMm = Object.freeze({ minX: 3, minY: 3, maxX: 29, maxY: 29 });

const HULLS = new Map<string, BoundsMm>();

/** Ein und dasselbe Hüllenobjekt je Paar: manche Fassungen merken sich ihre Zeichnung je Hülle. */
function sourceHull(kind: SymbolKind, variant: BodyVariantId | undefined): BoundsMm {
  const key = `${kind}|${variant ?? ''}`;
  let hull = HULLS.get(key);
  if (hull === undefined) {
    hull = kind === 'person' && variant === undefined
      ? PERSON_MEASURED_HULL
      : Object.freeze({ ...bodyBoundsMm(kind, variant) });
    HULLS.set(key, hull);
  }
  return hull;
}

let bodies: readonly { kind: SymbolKind; bodyVariant?: BodyVariantId }[] | undefined;

/** Jede Körperform, die der Katalog zeichnet. */
function allBodies(): readonly { kind: SymbolKind; bodyVariant?: BodyVariantId }[] {
  if (bodies !== undefined) return bodies;
  const found: { kind: SymbolKind; bodyVariant?: BodyVariantId }[] = [];
  for (const kind of SYMBOL_KINDS) {
    for (const variant of [undefined, ...BODY_VARIANT_IDS]) {
      try {
        baseDrawing(kind, variant);
      } catch {
        continue;
      }
      found.push({ kind, ...(variant === undefined ? {} : { bodyVariant: variant }) });
    }
  }
  bodies = Object.freeze(found);
  return bodies;
}

function probe(id: BodyMarkId, source: SourcePair): boolean {
  try {
    measuredBodyMark(id, sourceContext(source), source.hull);
    return true;
  } catch (error) {
    if (error instanceof NotMeasuredError) return false;
    throw error;
  }
}

function sourceContext(source: SourcePair, bodyMarks?: readonly BodyMarkId[]): BodyMarkContext {
  return {
    kind: source.kind,
    ...(source.bodyVariant === undefined ? {} : { bodyVariant: source.bodyVariant }),
    ...(source.vehicleCategory === undefined ? {} : { vehicleCategory: source.vehicleCategory }),
    ...(source.rendition === undefined ? {} : { rendition: source.rendition }),
    ...(bodyMarks === undefined ? {} : { bodyMarks }),
  };
}

const SOURCES = new Map<BodyMarkId, readonly SourcePair[]>();

/** Alle vermessenen Paare der Grundfassung einer Marke, in Katalogreihenfolge. */
function measuredSources(id: BodyMarkId): readonly SourcePair[] {
  const cached = SOURCES.get(id);
  if (cached !== undefined) return cached;
  const found: SourcePair[] = [];
  for (const body of allBodies()) {
    const hull = sourceHull(body.kind, body.bodyVariant);
    const plain: SourcePair = { ...body, hull };
    if (probe(id, plain)) {
      found.push(plain);
      continue;
    }
    // Fassungen, die nur mit Fahrzeugkategorie vermessen sind (Wasserrettung I.2.1 bis I.2.3,
    // Anhang-C-Tabellen mit Kategorie).
    for (const vehicleCategory of VEHICLE_CATEGORY_IDS) {
      const withCategory: SourcePair = { ...body, vehicleCategory, hull };
      if (probe(id, withCategory)) found.push(withCategory);
    }
  }
  const frozen = Object.freeze(found);
  SOURCES.set(id, frozen);
  return frozen;
}

/** Alle vermessenen Paare einer Zweitfassung (`bodyMarkRenditions`, Anhang C). */
function renditionSources(id: BodyMarkId, rendition: BodyMarkRenditionId): SourcePair[] {
  return ANHANG_C_BODY_MARK_CONTEXTS
    .filter((entry) => entry.rendition === rendition && Object.hasOwn(entry.marks, id))
    .map((entry) => ({
      kind: entry.kind,
      ...(entry.bodyVariant === undefined ? {} : { bodyVariant: entry.bodyVariant }),
      ...(entry.vehicleCategory === undefined ? {} : { vehicleCategory: entry.vehicleCategory }),
      rendition,
      hull: sourceHull(entry.kind, entry.bodyVariant),
    }));
}

/**
 * Die Fassungskennungen, die für diese Marke an irgendeinem Paar vermessen sind, in der
 * Reihenfolge von `BODY_MARK_RENDITION_IDS`. An jedem anderen Paar überträgt `bodyMark()` sie.
 */
export function bodyMarkRenditionsAnywhere(id: BodyMarkId): readonly BodyMarkRenditionId[] {
  return BODY_MARK_RENDITION_IDS.filter((rendition) => renditionSources(id, rendition).length > 0);
}

function hasFootBand(region: BodyRegion): boolean {
  return region.bounds.maxY < region.hull.maxY - 0.5;
}

/** Rang einer Vorlage für das Ziel; kleiner ist näher. */
function rank(source: SourcePair, target: BodyMarkContext): number {
  const sourceFamily = familyOf(source.kind, source.bodyVariant);
  const targetFamily = familyOf(target.kind, target.bodyVariant);
  const sameBody = source.kind === target.kind && source.bodyVariant === target.bodyVariant;
  const base = sameBody
    ? 0
    : sourceFamily === targetFamily
      ? 100 + (source.kind === target.kind ? 0 : 10)
      : 1000 + 100 * CROSS_FAMILY_ORDER.indexOf(sourceFamily);
  const bandPenalty = sameBody
    ? 0
    : hasFootBand(bodyRegion(source.kind, source.bodyVariant)) ===
        hasFootBand(bodyRegion(target.kind, target.bodyVariant))
      ? 0
      : 5;
  const categoryPenalty = source.vehicleCategory === target.vehicleCategory
    ? 0
    : source.vehicleCategory === undefined ? 1 : 3;
  return base + bandPenalty + categoryPenalty;
}

function nearest(sources: readonly SourcePair[], target: BodyMarkContext): SourcePair | undefined {
  let best: SourcePair | undefined;
  let bestRank = Number.POSITIVE_INFINITY;
  for (const source of sources) {
    const value = rank(source, target);
    if (value < bestRank) {
      best = source;
      bestRank = value;
    }
  }
  return best;
}

const FLUSH_TOLERANCE_MM = 0.05;

/** Die Punkte, an denen eine Marke die Körperkante berühren kann (keine Kontrollpunkte). */
function anchorPoints(primitive: Primitive): Point[] {
  switch (primitive.type) {
    case 'line':
      return [[primitive.x1, primitive.y1], [primitive.x2, primitive.y2]];
    case 'polyline':
      return [...primitive.points];
    case 'rect':
      return [
        [primitive.x, primitive.y],
        [primitive.x + primitive.width, primitive.y + primitive.height],
      ];
    case 'circle':
      return [
        [primitive.cx - primitive.r, primitive.cy],
        [primitive.cx + primitive.r, primitive.cy],
        [primitive.cx, primitive.cy - primitive.r],
        [primitive.cx, primitive.cy + primitive.r],
      ];
    case 'path': {
      const bounds = boundsOfMm(primitive);
      return [[bounds.minX, bounds.minY], [bounds.maxX, bounds.maxY]];
    }
    case 'group':
      return primitive.children.flatMap(anchorPoints);
    default:
      return [];
  }
}

function onContour(region: BodyRegion, point: Point): boolean {
  return distanceToContour(region.polygon, point) < FLUSH_TOLERANCE_MM;
}

const round3 = (value: number): number => Math.round(value * 1000) / 1000;

/**
 * Setzt einen Linienendpunkt, der in der Vorlage auf der Körperkante lag, wieder auf die Kante
 * des Zielkörpers: entlang der Linie verlängert oder gekürzt, vom Mittelpunkt der Linie aus.
 */
function snapEnd(target: BodyRegion, from: Point, end: Point): Point {
  if (!insidePolygon(target.polygon, from) || distanceToContour(target.polygon, from) < FLUSH_TOLERANCE_MM) {
    return end;
  }
  const hit = rayToContour(target.polygon, from, end);
  return hit === undefined ? end : [round3(hit[0]), round3(hit[1])];
}

function snapToContour(
  original: Primitive,
  mapped: Primitive,
  source: BodyRegion,
  target: BodyRegion,
): Primitive {
  if (original.type === 'line' && mapped.type === 'line') {
    const mid: Point = [(mapped.x1 + mapped.x2) / 2, (mapped.y1 + mapped.y2) / 2];
    const [x1, y1] = onContour(source, [original.x1, original.y1])
      ? snapEnd(target, mid, [mapped.x1, mapped.y1])
      : [mapped.x1, mapped.y1];
    const [x2, y2] = onContour(source, [original.x2, original.y2])
      ? snapEnd(target, mid, [mapped.x2, mapped.y2])
      : [mapped.x2, mapped.y2];
    return { ...mapped, x1, y1, x2, y2 };
  }
  if (
    original.type === 'polyline' && mapped.type === 'polyline' && original.closed !== true &&
    mapped.points.length >= 2
  ) {
    const points = [...mapped.points];
    const last = points.length - 1;
    const midOf = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    if (onContour(source, original.points[0] as Point)) {
      points[0] = snapEnd(target, midOf(points[0] as Point, points[1] as Point), points[0] as Point);
    }
    if (onContour(source, original.points[last] as Point)) {
      points[last] = snapEnd(
        target,
        midOf(points[last - 1] as Point, points[last] as Point),
        points[last] as Point,
      );
    }
    return { ...mapped, points };
  }
  return mapped;
}

const MAPPED = new WeakMap<Primitive, Map<string, Primitive>>();

/**
 * Dieselbe Vorlage, dieselbe Abbildung, dasselbe Primitiv: ein Teil, den die Vorlage für mehrere
 * Marken teilt (die Fachdienstteilung am Kreis und am Landfahrzeug), bleibt ein geteiltes Objekt —
 * `compose()` zeichnet ihn dann nur einmal (`composeBodyMarkPrimitives`).
 */
function mapShared(
  map: Affine,
  primitive: Primitive,
  key: string,
  build: () => Primitive,
): Primitive {
  let byKey = MAPPED.get(primitive);
  if (byKey === undefined) {
    byKey = new Map();
    MAPPED.set(primitive, byKey);
  }
  const fullKey = `${affineKey(map)}|${key}`;
  let mapped = byKey.get(fullKey);
  if (mapped === undefined) {
    mapped = build();
    byKey.set(fullKey, mapped);
  }
  return mapped;
}

function label(kind: SymbolKind, variant: BodyVariantId | undefined): string {
  return `${kind}/${variant ?? 'normal'}`;
}

function transfer(
  id: BodyMarkId,
  source: SourcePair,
  context: BodyMarkContext,
  bodyBoundsMm: BoundsMm,
): readonly Primitive[] {
  const primitives = measuredBodyMark(id, sourceContext(source, context.bodyMarks), source.hull);
  const sourceRegion = bodyRegion(source.kind, source.bodyVariant, source.hull);
  const targetRegion = bodyRegion(context.kind, context.bodyVariant, bodyBoundsMm);
  const sameFamily =
    familyOf(source.kind, source.bodyVariant) === familyOf(context.kind, context.bodyVariant);
  const sameBody = source.kind === context.kind && source.bodyVariant === context.bodyVariant;
  // Eine Marke, die an ihrer Vorlage über die Körperfläche hinausragt (das Radpaar der
  // eingesenkten Hülle hängt unter dem Rumpf, I.3), überträgt sich an einen anderen Körper mit
  // ihrer ganzen Ausdehnung in dessen Fläche: der Überstand ist eine Eigenschaft der Vorlage,
  // nicht des Zielkörpers.
  const markHull = primitives.length === 0
    ? sourceRegion.bounds
    : unionBounds(primitives.map((primitive) => boundsOfMm(primitive)));
  const sourceArea = sameBody ? sourceRegion.bounds : unionBounds([sourceRegion.bounds, markHull]);
  const hullMap = sameFamily
    ? boxToBox(sourceArea, targetRegion.bounds)
    : boxToBox(
        sourceArea,
        inscribedRect(
          targetRegion,
          (sourceArea.maxX - sourceArea.minX) / (sourceArea.maxY - sourceArea.minY),
        ),
      );
  const flush = primitives.some((primitive) =>
    anchorPoints(primitive).some((point) => onContour(sourceRegion, point)));
  let map = hullMap;
  if (!flush && !isUniform(hullMap) && primitives.length > 0) {
    const center: Point = [(markHull.minX + markHull.maxX) / 2, (markHull.minY + markHull.maxY) / 2];
    map = uniformAbout(center, applyAffine(hullMap, center), Math.min(hullMap.sx, hullMap.sy));
  }
  const snapKey = flush ? targetRegion.key : '';
  const result = primitives.map((primitive) =>
    mapShared(map, primitive, `${sourceRegion.key}>${snapKey}`, () => {
      const mapped = mapPrimitive(map, primitive);
      return flush ? snapToContour(primitive, mapped, sourceRegion, targetRegion) : mapped;
    }));
  noteDerivation({
    dimension: 'bodyMarks',
    part: `${id} an ${label(context.kind, context.bodyVariant)}`,
    basis: 'transferred',
    from:
      label(source.kind, source.bodyVariant) +
      (source.vehicleCategory === undefined ? '' : `/${source.vehicleCategory}`) +
      (source.rendition === undefined ? '' : `#${source.rendition}`),
  });
  return result;
}

function isCapability(id: BodyMarkId): id is CapabilityId {
  return (CAPABILITY_IDS as readonly string[]).includes(id);
}

const FLUSH_IDS = new Set<BodyMarkId>(BODY_MARK_IDS);

/** Ob eine Marke irgendwo eine randbündige Fassung hat. */
export function hasFlushRendition(id: BodyMarkId): boolean {
  return FLUSH_IDS.has(id);
}

/**
 * Eine Fähigkeit ohne jede randbündige Fassung: die Einzeldarstellung eingepasst. Stehen in
 * derselben Komposition weitere solche Fähigkeiten, teilen sie sich das Innenfeld; diese Marke
 * bekommt ihren Platz in der Reihe (`context.bodyMarks`, Spec-Reihenfolge).
 */
function fittedStandalone(
  id: CapabilityId,
  context: BodyMarkContext,
  bodyBoundsMm: BoundsMm,
): readonly Primitive[] {
  const row = (context.bodyMarks ?? [id]).filter(
    (mark): mark is CapabilityId => isCapability(mark) && !hasFlushRendition(mark),
  );
  const ids = row.includes(id) ? row : [id];
  const region = bodyRegion(context.kind, context.bodyVariant, bodyBoundsMm);
  const fitted = fitPictograms(ids.map((mark) => pictogram(`capability.${mark}`).primitives), region);
  noteDerivation({
    dimension: 'bodyMarks',
    part: `${id} an ${label(context.kind, context.bodyVariant)} ohne randbündige Fassung, Einzeldarstellung eingepasst`,
    basis: 'transferred',
    from: `Kapitel 4, capability.${id}`,
  });
  return fitted[ids.indexOf(id)] as Primitive[];
}

function derive(
  id: BodyMarkId,
  context: BodyMarkContext,
  bodyBoundsMm: BoundsMm,
  cause: NotMeasuredError,
): readonly Primitive[] {
  if (context.rendition !== undefined) {
    const source = nearest(renditionSources(id, context.rendition), context);
    // Eine Fassungskennung, die für diese Marke nirgends vermessen ist, ist keine Lücke, sondern
    // eine falsche Angabe; `validateSpec` meldet sie (`body-mark-rendition-not-measured`).
    if (source === undefined) throw cause;
    return transfer(id, source, context, bodyBoundsMm);
  }
  if (hasFlushRendition(id)) {
    const source = nearest(measuredSources(id), context);
    if (source !== undefined) return transfer(id, source, context, bodyBoundsMm);
  }
  if (isCapability(id)) return fittedStandalone(id, context, bodyBoundsMm);
  throw cause;
}

/**
 * Die randbündige Fassung einer Körpermarke an der Hülle `bodyBoundsMm` — vermessen, wo die
 * Referenz das Paar zeigt, sonst abgeleitet (siehe oben). Ersetzt als Port und als Export
 * `bodyMark()` aus `geometry/body-marks.ts`; die vermessene Fassung bleibt dort unverändert.
 *
 * Es wirft nur noch, was keine Vermessungslücke ist: eine Fassungskennung, die für diese Marke
 * nirgends vermessen ist, eine Körpervariante, die der Katalog nicht zeichnet, und nicht endliche
 * Hüllengrenzen.
 */
export function bodyMark(
  id: BodyMarkId,
  context: BodyMarkContext,
  bodyBoundsMm: BoundsMm,
): readonly Primitive[] {
  try {
    return measuredBodyMark(id, context, bodyBoundsMm);
  } catch (error) {
    if (!(error instanceof NotMeasuredError)) throw error;
    return derive(id, context, bodyBoundsMm, error);
  }
}
