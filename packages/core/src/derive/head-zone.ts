import {
  DEFAULT_VIEWBOX_MM,
  type AdminLevelId,
  type AdministrativeHeadShape,
  type Primitive,
  type PrimitiveHeadShape,
  type SymbolSpec,
  type UnitGroupingId,
} from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { administrativeHead } from '../geometry/administrative-heads.js';
import {
  UNIT_GROUPING_III_PROPOSAL_CX_MM,
  unitGroupingHead,
} from '../geometry/unit-groupings.js';
import { HEAD_GAP_MM, HEAD_TOP_MARGIN_MM, placeHead, type LayoutProfile } from '../layout/profiles.js';
import { NotMeasuredError } from '../not-measured.js';
import { uniformAbout, type Affine } from './affine.js';
import { mapPathPoints } from './path-geometry.js';
import { noteDerivation } from './record.js';

/**
 * Die Kopfzone über dem Körper, abgeleitet für jede Körperform (Entscheidung des Eigentümers vom
 * 2. Oktober 2026): Verwaltungsstufe (5.7), Verband (5.5) und technische Kopfmarke stehen an
 * jedem Grundzeichen, über dem eine Kopfzone Platz findet, nicht mehr nur an der Formation.
 *
 * Vermessen bleibt, was ein Original zeigt; nur der Rest trägt eine Ableitungsnotiz:
 *
 * - die Verwaltungsköpfe Kreis, Nationalstaat und Europäische Union (`ADMINISTRATIVE_HEADS`) und
 *   Verband I/II (`UNIT_GROUPING_HEADS`) bleiben dort unverändert; Gemeinde, Bezirk, Bundesland
 *   und Verband III ergänzt dieses Modul als **abgeleitete** Fassungen, die der Standardport
 *   (`default-ports.ts`) nach den vermessenen befragt;
 * - die Lage der Kopfzone ist an der Formation (y 1…5) und an der Person (I.5.7, D.4.4, D.4.5:
 *   y 0…4 bzw. 0…9) belegt; jede andere Körperform erhält sie über `placeHeadZone`;
 * - Zusatzgeometrie (Fußband, Deichsel, L-Rahmen, Räder, Rumpfspitzen) folgt dem platzierten
 *   Körper, statt stehen zu bleiben (`placeBaseUnderHead`).
 */

// ---------------------------------------------------------------------------------------------
// Verwaltungsstufe: Gemeinde, Bezirk, Bundesland
// ---------------------------------------------------------------------------------------------

/**
 * Sternmitten der Kapiteldateien 5.7.1–5.7.5, in Millimetern der 32-mm-Grundfläche (1 mm =
 * 90,709/32 px), an den Originalen im Hauptcheckout nachgezählt (2. Oktober 2026): Gemeinde
 * 1 Stern (x 16), Kreis 2 (x 10/22), Bezirk 3 (x 10/16/22), Bundesland 4 (x 7/13/19/25),
 * Nationalstaat 5 (x 4/10/16/22/28). Die Kapiteldateien zeigen die Sterne vergrößert (6 mm hoch
 * statt 4 mm am Körper), wie die Stärken in 5.4.
 */
const CHAPTER_STAR_CX_MM: Readonly<Record<'gemeinde' | 'bezirk' | 'bundesland', readonly number[]>> = {
  gemeinde: [16],
  bezirk: [10, 16, 22],
  bundesland: [7, 13, 19, 25],
};

/** Kapiteldatei je abgeleiteter Stufe, für die Herkunftsangabe der Notiz. */
const CHAPTER_FILE: Readonly<Record<keyof typeof CHAPTER_STAR_CX_MM, string>> = {
  gemeinde: '5.7.1_Gemeinde',
  bezirk: '5.7.3_Bezirk',
  bundesland: '5.7.4_Bundesland',
};

/**
 * Am Körper rücken die Sterne um 5/6 der Kapitelteilung von der Mittelachse x 16 ab. Die zwei
 * vermessenen Köpfe belegen genau dieses Verhältnis: Kreis 10/22 → 11/21 (D.4.1), Nationalstaat
 * 4…28 → 6…26 (D.4.4). Gezählt wird mit ganzen Zahlen, damit 8,5 und 23,5 exakt bleiben.
 */
function bodyStarCxMm(chapterCxMm: number): number {
  return 16 + ((chapterCxMm - 16) * 5) / 6;
}

/** Der vermessene Stern des Kreiskopfs (erste drei Primitive, Mitte x 11), verbatim übernommen. */
const KREIS_STAR_CX_MM = 11;
/** Halbe Breite des Sternrahmens: Kreisrahmen beginnt bei 9,143 mm vor der Sternmitte 11. */
const STAR_HALF_WIDTH_MM = 1.857;

function kreisStarAt(cxMm: number): Primitive[] {
  const kreis = administrativeHead('kreis');
  if (kreis === undefined) throw new Error('Der vermessene Kreiskopf fehlt.');
  return kreis.primitives.slice(0, 3).map((ray) => translateX(ray, cxMm - KREIS_STAR_CX_MM));
}

function translateX(primitive: Primitive, dxMm: number): Primitive {
  if (primitive.type !== 'rect') throw new Error('Der Sternstrahl ist ein Rechteck.');
  const rotate = primitive.transform?.rotate;
  return {
    ...primitive,
    x: primitive.x + dxMm,
    ...(rotate === undefined
      ? {}
      : { transform: { ...primitive.transform, rotate: { ...rotate, cx: rotate.cx + dxMm } } }),
  };
}

/**
 * Abgeleiteter Verwaltungskopf für die drei Stufen ohne vermessenen Kopf. Gibt für die
 * vermessenen Stufen `undefined`: die gehören `administrativeHead`.
 */
export function derivedAdministrativeHead(id: AdminLevelId): AdministrativeHeadShape | undefined {
  if (id !== 'gemeinde' && id !== 'bezirk' && id !== 'bundesland') return undefined;
  const xs = CHAPTER_STAR_CX_MM[id].map(bodyStarCxMm);
  noteDerivation({
    dimension: 'administrativeLevel',
    part: `Kopf "${id}": ${xs.length} Stern(e) auf x ${xs.join('/')} mm, y 0…4 mm`,
    basis: 'constructed',
    from:
      `${CHAPTER_FILE[id]} (Sternzahl und Teilung), am Körper 5/6 der Kapitelteilung wie Kreis ` +
      '(D.4.1) und Nationalstaat (D.4.4); Stern verbatim aus dem Kreiskopf',
  });
  const first = xs[0]!;
  const last = xs[xs.length - 1]!;
  return {
    box: {
      xMm: first - STAR_HALF_WIDTH_MM,
      yMm: 0,
      widthMm: last - first + 2 * STAR_HALF_WIDTH_MM,
      heightMm: 4,
    },
    heightMm: 4,
    primitives: xs.flatMap(kreisStarAt),
  };
}

/** Der Standardport: vermessener Kopf, sonst der abgeleitete. */
export function administrativeHeadOrDerived(id: AdminLevelId): AdministrativeHeadShape | undefined {
  return administrativeHead(id) ?? derivedAdministrativeHead(id);
}

// ---------------------------------------------------------------------------------------------
// Verband III
// ---------------------------------------------------------------------------------------------

/**
 * Verband III, abgeleitet aus dem Vorschlag `UNIT_GROUPING_III_PROPOSAL_CX_MM` (x 12/16/20): die
 * Vereinigung von Verband I (x 16) und II (x 12/20), so wie `5.5.3` in der Kapiteldatei die
 * Vereinigung von `5.5.1` und `5.5.2` ist. Der Balken ist verbatim der von Verband I.
 */
export function derivedUnitGroupingHead(id: UnitGroupingId): PrimitiveHeadShape | undefined {
  if (id !== 'verband-iii') return undefined;
  const verbandI = unitGroupingHead('verband-i');
  const bar = verbandI?.primitives[0];
  if (verbandI === undefined || bar === undefined || bar.type !== 'rect') {
    throw new Error('Der vermessene Balken von Verband I fehlt.');
  }
  noteDerivation({
    dimension: 'unitGrouping',
    part: `Verband III: drei Balken auf x ${UNIT_GROUPING_III_PROPOSAL_CX_MM.join('/')} mm`,
    basis: 'constructed',
    from:
      'UNIT_GROUPING_III_PROPOSAL_CX_MM: Vereinigung von Verband I und II wie 5.5.3 = 5.5.1 ∪ ' +
      '5.5.2; Balken verbatim aus Verband I',
  });
  return {
    heightMm: verbandI.heightMm,
    primitives: UNIT_GROUPING_III_PROPOSAL_CX_MM.map((cx) => ({
      ...bar,
      x: cx - bar.width / 2,
    })),
  };
}

/** Der Standardport: vermessener Verband, sonst der abgeleitete. */
export function unitGroupingHeadOrDerived(id: UnitGroupingId): PrimitiveHeadShape | undefined {
  return unitGroupingHead(id) ?? derivedUnitGroupingHead(id);
}

// ---------------------------------------------------------------------------------------------
// Lage der Kopfzone
// ---------------------------------------------------------------------------------------------

/**
 * Was die Kopfzone füllt: Stärkepunkte oder relative Kopfprimitive (Balken, Sterne). Die beiden
 * sitzen an der Person verschieden hoch, und beides ist vermessen: die Zugreihe in D.3.7 auf
 * y 1…4, der Verbandsbalken in I.5.7 und die Sterne in D.4.4/D.4.5 ab y 0.
 */
export type HeadZoneContent = 'strength' | 'primitive';

/**
 * Die Kopfzone über dem Körper.
 *
 * - **Person** (`rotated-square-body`): Balken und Sterne beginnen auf y 0 (I.5.7 Verband 0…4,
 *   D.4.4 Nationalstaat 0…4, D.4.5 Europäische Union 0…9); die Raute weicht dann 1 mm darunter
 *   aus. Die Stärke bleibt bei `placeHead` (D.3.7: y 1…4), sonst verschöbe sich die heute
 *   gezeichnete Staffel an der Person.
 * - **Rechteckkörper, deren Oberkante unter dem Standardanker (6 mm) liegt** (Luft- und
 *   Wasserfahrzeug, Ereignis): die Kopfzone hängt 1 mm über der tatsächlichen Oberkante, und der
 *   Körper bleibt stehen. Das ist die Regel aus `zones.ts` („so tief wie möglich, damit der Körper
 *   auf seinem Anker bleibt“), an der Oberkante der Körperform statt am Anker der Formation
 *   gelesen; `rectBody().place` höbe den Körper sonst um bis zu 3 mm an.
 * - alle übrigen: `placeHead` unverändert.
 */
export function placeHeadZone(
  profile: LayoutProfile,
  body: Primitive,
  heightMm: number,
  content: HeadZoneContent,
): { topMm: number; bottomMm: number } {
  if (content === 'primitive' && profile.id === 'rotated-square-body') {
    return { topMm: 0, bottomMm: heightMm };
  }
  if (profile.id === 'rect-body') {
    const bodyTopMm = boundsOfMm(body).minY;
    if (bodyTopMm > profile.defaultAnchorMm) {
      return placeHead({ ...profile, defaultAnchorMm: bodyTopMm }, heightMm);
    }
  }
  return placeHead(profile, heightMm);
}

/** Welches Feld die Kopfzone belegt, als Dimension der Notiz. */
export type HeadZoneDimension = 'strength' | 'technicalHeadMark' | 'unitGrouping' | 'administrativeLevel';

export function headZoneDimension(spec: SymbolSpec): HeadZoneDimension | undefined {
  if (spec.strength !== undefined) return 'strength';
  if (spec.technicalHeadMark !== undefined) return 'technicalHeadMark';
  if (spec.unitGrouping !== undefined) return 'unitGrouping';
  if (spec.administrativeLevel !== undefined) return 'administrativeLevel';
  return undefined;
}

/**
 * Ob die Lage dieser Kopfzone an diesem Körper an einem Original vermessen ist. Die Stärke zählt
 * hier nicht: sie steht seit jeher nur an Einheiten und wird von `strength-requires-unit`
 * begrenzt; ihre Lagen sind die bisherigen.
 */
function headPlacementMeasured(spec: SymbolSpec): boolean {
  const plainFormation =
    spec.kind === 'formation' && (spec.bodyVariant === undefined || spec.bodyVariant === 'foot-band');
  const plainPerson = spec.kind === 'person' && spec.bodyVariant === undefined;
  if (spec.strength !== undefined) return true;
  // F.1.1, F.1.13, F.1.21, E.1.31, I.1.4, C.1.6 (Formation), F.1.3 (Formation mit Fußband).
  if (spec.technicalHeadMark !== undefined) return plainFormation;
  if (spec.unitGrouping !== undefined) {
    if (spec.unitGrouping === 'verband-iii') return false;
    // I.5.7: Verband I an der Person, Balken y 0…4, Raute 5…31.
    return plainFormation || (plainPerson && spec.unitGrouping === 'verband-i');
  }
  if (spec.administrativeLevel !== undefined) {
    // D.4.4 und D.4.5: Kopf ab y 0, Raute mit der Spitze 1 mm darunter und Unterkante 31 — genau
    // die Lage, die `placeHeadZone` an der Person rechnet. Der Kreis in D.4.1 steht dagegen
    // neben der Rautenspitze, ohne die Raute zu verkleinern; das bildet die allgemeine Kopfzone
    // nicht ab.
    return plainPerson &&
      (spec.administrativeLevel === 'nationalstaat' || spec.administrativeLevel === 'europaeische-union');
  }
  return true;
}

/** Notiert die Lage der Kopfzone, wenn kein Original sie an diesem Körper zeigt. */
export function noteHeadPlacement(spec: SymbolSpec, profile: LayoutProfile): void {
  const dimension = headZoneDimension(spec);
  if (dimension === undefined || headPlacementMeasured(spec)) return;
  noteDerivation({
    dimension,
    part: `Kopfzone über "${spec.kind}${spec.bodyVariant === undefined ? '' : `/${spec.bodyVariant}`}"`,
    basis: 'transferred',
    from:
      profile.id === 'rotated-square-body'
        ? 'Person: Kopf ab y 0, Raute 1 mm darunter (I.5.7, D.4.4)'
        : `Kopfzone der Formation (C.1.2, F.1.1: 1 mm über dem Körper) am Profil "${profile.id}"`,
  });
}

// ---------------------------------------------------------------------------------------------
// Körper und Zusatzgeometrie unter der Kopfzone
// ---------------------------------------------------------------------------------------------

/** Unterste Lage der Grundzeichnung: gespiegelt zum oberen Rand der Kopfzone (1 mm). */
const BASE_BOTTOM_LIMIT_MM = DEFAULT_VIEWBOX_MM.height - HEAD_TOP_MARGIN_MM;
const EPSILON_MM = 1e-6;

/**
 * Bildet ein Primitiv mit einer Ähnlichkeitsabbildung ab: Streckung um `k` mit Zentrum
 * (`ox`|`oy`), danach Verschiebung um (`dx`|`dy`). Eine gleichmäßige Streckung vertauscht mit
 * einer Drehung um das mitabgebildete Zentrum; gedrehte Rechtecke und Pfade bleiben damit exakt.
 */
function mapSimilar(
  primitive: Primitive,
  k: number,
  ox: number,
  oy: number,
  dx: number,
  dy: number,
): Primitive {
  const mx = (x: number): number => ox + (x - ox) * k + dx;
  const my = (y: number): number => oy + (y - oy) * k + dy;
  const rotate = primitive.transform?.rotate;
  if (primitive.transform?.translate !== undefined) {
    throw new Error('Kopfzone: ein verschobenes Primitiv der Grundzeichnung ist nicht abbildbar.');
  }
  const transform = rotate === undefined
    ? {}
    : { transform: { ...primitive.transform, rotate: { ...rotate, cx: mx(rotate.cx), cy: my(rotate.cy) } } };
  switch (primitive.type) {
    case 'rect':
      return {
        ...primitive,
        x: mx(primitive.x),
        y: my(primitive.y),
        width: primitive.width * k,
        height: primitive.height * k,
        ...(primitive.rx === undefined ? {} : { rx: primitive.rx * k }),
        ...transform,
      };
    case 'circle':
      return { ...primitive, cx: mx(primitive.cx), cy: my(primitive.cy), r: primitive.r * k, ...transform };
    case 'line':
      return {
        ...primitive,
        x1: mx(primitive.x1),
        y1: my(primitive.y1),
        x2: mx(primitive.x2),
        y2: my(primitive.y2),
        ...transform,
      };
    case 'polyline':
      return { ...primitive, points: primitive.points.map(([x, y]) => [mx(x), my(y)] as const), ...transform };
    case 'path':
      return { ...primitive, d: mapPathPoints(primitive.d, (x, y) => [mx(x), my(y)]), ...transform };
    case 'group':
      if (rotate !== undefined) throw new Error('Kopfzone: eine gedrehte Gruppe ist nicht abbildbar.');
      return { ...primitive, children: primitive.children.map((c) => mapSimilar(c, k, ox, oy, dx, dy)) };
    case 'text':
      throw new Error('Kopfzone: Text gehört nicht zur Grundzeichnung.');
  }
}

function centerX(bounds: BoundsMm): number {
  return (bounds.minX + bounds.maxX) / 2;
}

export interface PlacedBase {
  readonly body: Primitive;
  readonly extras: readonly Primitive[];
  /** Die Platzierung des Profils (`profile.place`) als Ähnlichkeitsabbildung. */
  readonly place: Affine;
  /** Die Verkleinerung aus Schritt 3, falls die Grundzeichnung sonst die Fläche verließe. */
  readonly shrink?: Affine;
}

/** `profile.place` als Abbildung: dieselbe, mit der die Zusatzgeometrie dem Körper folgt. */
function placementOf(from: BoundsMm, to: BoundsMm): Affine {
  const k = (to.maxY - to.minY) / (from.maxY - from.minY);
  return uniformAbout([centerX(from), from.minY], [centerX(to), to.minY], k);
}

export interface PlaceBaseOptions {
  readonly spec: SymbolSpec;
  readonly profile: LayoutProfile;
  readonly body: Primitive;
  readonly extras: readonly Primitive[];
  readonly headBottomMm: number | null;
  /** Platz, den Fahrwerks- oder Fußzone unter der Grundzeichnung brauchen (0 ohne beide). */
  readonly reservedBelowMm: number;
}

/**
 * Setzt Körper **und** Zusatzgeometrie unter die Kopfzone.
 *
 * 1. Der Körper geht durch `profile.place` wie bisher.
 * 2. Die Zusatzgeometrie folgt ihm mit derselben Abbildung: verschoben um dasselbe Δy, verkleinert
 *    um denselben Faktor. Bis zum 2. Oktober 2026 warf `compose()` hier, außer am Fußband der
 *    Formation, wo das Band bei der Staffel stehen blieb und sich vom Körper löste.
 * 3. Reicht die Grundzeichnung danach unter die Grundfläche (Punkt, Spontanhelfer,
 *    Hochkantrechteck schon mit 4 mm, viele Körper mit dem 9-mm-Kopf der EU), wird sie um die
 *    Mitte ihrer Oberkante verkleinert, bis sie 1 mm über dem unteren Rand endet. Vorbild ist die
 *    Person (D.3.7): der Körper weicht der Kopfzone durch Verkleinern aus.
 *
 * Ohne Kopfzone und für alles, was heute gezeichnet wird, ändert sich nichts: die Formation mit
 * Staffel endet bei 29 mm, die Person hält ihre Unterkante 31.
 */
export function placeBaseUnderHead(options: PlaceBaseOptions): PlacedBase {
  const { spec, profile, body, extras } = options;
  if (options.headBottomMm === null) {
    const placedAlone = profile.place(body, null);
    return { body: placedAlone, extras, place: placementOf(boundsOfMm(body), boundsOfMm(placedAlone)) };
  }
  // Ragt Zusatzgeometrie über den Körper hinaus (der Giebel über dem Kreis), muss die ganze
  // Grundzeichnung unter den Kopf, nicht nur der Körper: der Kopfabstand gilt ab ihrer Oberkante.
  const overhangMm = Math.max(
    0,
    boundsOfMm(body).minY -
      extras.reduce((top, extra) => Math.min(top, boundsOfMm(extra).minY), Number.POSITIVE_INFINITY),
  );
  const headBottomMm = options.headBottomMm + overhangMm;
  const placed = profile.place(body, headBottomMm);

  const from = boundsOfMm(body);
  const to = boundsOfMm(placed);
  const k = (to.maxY - to.minY) / (from.maxY - from.minY);
  const moved = Math.abs(k - 1) > EPSILON_MM || Math.abs(to.minY - from.minY) > EPSILON_MM;
  const dimension = headZoneDimension(spec) ?? 'strength';
  const followed = moved
    ? extras.map((extra) =>
        mapSimilar(extra, k, centerX(from), from.minY, centerX(to) - centerX(from), to.minY - from.minY))
    : extras;
  if (moved && extras.length > 0) {
    noteDerivation({
      dimension,
      part: `Zusatzgeometrie (${extras.map((extra) => extra.role ?? extra.type).join(', ')}) folgt dem Körper`,
      basis: 'transferred',
      from: `Körperplatzierung des Profils "${profile.id}" (place)`,
    });
  }

  const limitMm = BASE_BOTTOM_LIMIT_MM - options.reservedBelowMm;
  const baseBottomMm = [placed, ...followed].reduce(
    (bottom, primitive) => Math.max(bottom, boundsOfMm(primitive).maxY),
    to.maxY,
  );
  const place = placementOf(from, to);
  if (baseBottomMm <= limitMm + EPSILON_MM) return { body: placed, extras: followed, place };

  const topMm = to.minY;
  if (topMm < headBottomMm + HEAD_GAP_MM - EPSILON_MM || limitMm - topMm <= 0) {
    throw new Error('Kopfzone: die Grundzeichnung findet unter dem Kopf keinen Platz.');
  }
  // Innenfeld und Boxpiktogramme folgen in `compose()` nur der Körpermitte, nicht einer
  // Verkleinerung; am verkleinerten Körper verfehlten sie ihn still.
  if (spec.whiteInnerContour === true) {
    throw new NotMeasuredError(
      'Eine weiße Innenkontur an einem Körper, den die Kopfzone verkleinert, ist nicht abgeleitet: ' +
        'das Innenfeld folgt dem Körper nur verschoben, nicht verkleinert.',
      'combination',
    );
  }
  if ((spec.capabilities ?? []).length > 0) {
    throw new NotMeasuredError(
      'Ein Fähigkeitspiktogramm an einem Körper, den die Kopfzone verkleinert, ist nicht ' +
        'abgeleitet: das Piktogramm folgt dem Körper nur verschoben, nicht verkleinert.',
      'combination',
    );
  }
  const shrink = (limitMm - topMm) / (baseBottomMm - topMm);
  const ox = centerX(to);
  noteDerivation({
    dimension,
    part:
      `Grundzeichnung "${spec.kind}${spec.bodyVariant === undefined ? '' : `/${spec.bodyVariant}`}" ` +
      `um die Mitte der Oberkante auf ${Math.round(shrink * 1000) / 10} % verkleinert`,
    basis: 'transferred',
    from: 'Person (D.3.7): der Körper weicht der Kopfzone durch Verkleinern aus',
  });
  return {
    body: mapSimilar(placed, shrink, ox, topMm, 0, 0),
    extras: followed.map((extra) => mapSimilar(extra, shrink, ox, topMm, 0, 0)),
    place,
    shrink: uniformAbout([ox, topMm], [ox, topMm], shrink),
  };
}

/**
 * Zonenkollision der abgeleiteten Köpfe mit Läufen über dem Körper. Seit die Kopfzone an jedem
 * Grundzeichen steht, trifft sie den Lauf oberhalb links (`aboveLeft`) am angehobenen Luftrumpf,
 * am Flächenflugzeug und an der abgesenkten kompakten Personraute: beide belegen y 0…6. Kein
 * Original zeigt beides; statt Sterne oder Balken in den Text zu setzen, meldet das die
 * Kombination als nicht vermessen. Die Stärke bleibt bei ihrem bisherigen Verhalten.
 */
export function assertHeadClearOfRuns(
  spec: SymbolSpec,
  headPrimitives: readonly Primitive[],
  runs: readonly Primitive[],
): void {
  if (spec.strength !== undefined || headPrimitives.length === 0) return;
  const heads = headPrimitives.map(boundsOfMm);
  for (const run of runs) {
    const box = boundsOfMm(run);
    const hit = heads.some(
      (head) =>
        head.minX < box.maxX && box.minX < head.maxX && head.minY < box.maxY && box.minY < head.maxY,
    );
    if (hit) {
      throw new NotMeasuredError(
        `Die Kopfzone über "${spec.kind}${spec.bodyVariant === undefined ? '' : `/${spec.bodyVariant}`}" ` +
          'überschneidet einen Beschriftungslauf: kein Original zeigt beide zusammen, und wohin ' +
          'einer von beiden ausweicht, ist nicht abgeleitet.',
        'combination',
      );
    }
  }
}

/**
 * Der Verwaltungskopf einer Spec. Fehlt er im Port, wirft das statt die Stufe still wegzulassen
 * — der stille Fehler, den `administrative-level-not-measured` bis zum 2. Oktober 2026 nur
 * verdeckte (ein eigener Portsatz kann partiell sein).
 */
export function requireAdministrativeHead(
  spec: SymbolSpec,
  head: AdministrativeHeadShape | undefined,
): AdministrativeHeadShape | null {
  if (spec.administrativeLevel === undefined) return null;
  if (head === undefined) {
    throw new NotMeasuredError(
      `Der Katalog liefert keinen Kopf für die Verwaltungsstufe "${spec.administrativeLevel}".`,
      'value',
    );
  }
  return head;
}
