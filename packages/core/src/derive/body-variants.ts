import {
  DEFAULT_STROKE_WIDTH_MM,
  type BodyVariantId,
  type DerivationNote,
  type Primitive,
  type Style,
  type SymbolKind,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { NotMeasuredError } from '../not-measured.js';
import { vehicleChassis } from '../geometry/vehicle-categories.js';
import { FOOT_BAND_HEIGHT_MM, isDerivedBodyVariant } from './body-variant-pairs.js';
import {
  axisRect,
  chainDistance,
  clipRingY,
  mapPath,
  offsetRing,
  outlineOf,
  ringPath,
  round,
  scalePrimitive,
  strokeChainsOf,
  type Scaling,
  type Vec,
} from './outline.js';

/**
 * Abgeleitete Körpervarianten: die Zeichnung eines Art×Variante-Paars, das kein Original zeigt,
 * aus der nächstliegenden vermessenen Fassung (siehe `body-variant-pairs.ts`).
 *
 * Pur über Primitiven: `base-symbols.ts` reicht Grundkörper, Zusatzgeometrie und die vermessenen
 * Vorlagen herein. So hängt diese Datei nicht am Katalog, und der Katalog lädt sie ohne Zyklus.
 */

/** Was `base-symbols.ts` an vermessenen Vorlagen hereinreicht. */
export interface VariantSources {
  /** Kapitel-1-Körper der Art (oder der eigenständigen Körperform). */
  readonly body: Primitive;
  /** Zusatzgeometrie der Art selbst: Deichsel, L-Rahmen, Traufe. */
  readonly kindExtras: readonly Primitive[];
  /** Der Giebel aus `circle-12/raised-gable` (F.3.5/F.3.14), unverändert. */
  readonly gable: Primitive;
  /** Der Abstand, den dieser Giebel zur Mittellinie des abgesenkten 12-mm-Kreises hält. */
  readonly gableClearanceMm: number;
  /** Der Kettenrumpf des Landfahrzeugs (`vehicle-land/inverted-hull-track`, N.1.1). */
  readonly invertedHullTrack: Primitive;
}

export interface DerivedVariant {
  readonly body: Primitive;
  /** Zusatzgeometrie in Zeichenreihenfolge: erst die der Art, dann die der Variante. */
  readonly extras: readonly Primitive[];
  /** Gesetzt, wenn der Körper samt Zusatzgeometrie verkleinert wurde (Giebel). */
  readonly scaling?: Scaling;
  readonly notes: readonly DerivationNote[];
}

const BAND_STYLE: Style = { fill: 'schwarz', stroke: 'none' };

function isBlackStroke(primitive: Primitive): boolean {
  const stroke = primitive.style?.stroke;
  return stroke === undefined || stroke === 'schwarz';
}

/**
 * Das Fußband einer beliebigen Körperform: der Schnitt der Körperfläche mit dem Streifen
 * [maxY − 3, maxY] an der Mittellinie — am Rechteck das Band der Formation, an der Raute ein
 * Dreieck, am Halbkreis ein Kreisabschnitt.
 *
 * An Körpern mit farbigem Strich (`1.10 Maßnahme` blau, `1.11 Gefahr` rot) schneidet das Band an
 * der Strichinnenkante statt an der Mittellinie: das Band liegt über dem Körper, und an der
 * Mittellinie deckte es die innere Strichhälfte schwarz zu. An schwarzem Strich ist beides
 * dasselbe Bild; dort gilt die Mittellinie wie an den vermessenen Bändern.
 */
export function footBand(body: Primitive): Primitive {
  const ring = outlineOf(body);
  const bottom = Math.max(...ring.map((point) => point[1]));
  const source = isBlackStroke(body)
    ? ring
    : offsetRing(ring, (body.style?.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM) / 2);
  const band = clipRingY(source, bottom - FOOT_BAND_HEIGHT_MM, 'below');
  const rect = axisRect(band);
  return rect !== undefined
    ? { type: 'rect', role: 'pictogram', ...rect, style: BAND_STYLE }
    : { type: 'path', role: 'pictogram', d: ringPath(band), style: BAND_STYLE };
}

/** Unterkante von Körper und Zusatzgeometrie — dort hängt die Fahrwerkszone. */
function baseBottomMm(body: Primitive, extras: readonly Primitive[]): number {
  return Math.max(
    ...outlineOf(body).map((point) => point[1]),
    ...extras.flatMap(strokeChainsOf).flat().map((point) => point[1]),
  );
}

/**
 * Das Radpaar von `plain-wheel-pair`, übertragen aus der vermessenen Zweiradfassung der Art.
 * Am Landfahrzeug ist die Variante deckungsgleich mit `kfz-kategorie-1` (Plätze 3,75 / 28,25,
 * Mitte 2,25 unter der Unterkante, r 2,25 — `body-variants.test.ts` hält das fest). Am Anhänger
 * ist die nächstliegende vermessene Zweiradfassung deshalb `anhaenger-zwei-raeder`
 * (14,25 / 19,75), am Wechsellader als Kraftfahrzeug wieder Kategorie 1, unter dem L-Rahmen.
 */
function wheelPair(kind: SymbolKind, bottomMm: number): Primitive[] {
  const category = kind === 'trailer' ? 'anhaenger-zwei-raeder' : 'kfz-kategorie-1';
  return vehicleChassis(category).marks.flatMap((mark): Primitive[] =>
    mark.type !== 'wheel'
      ? []
      : [{
          type: 'circle', role: 'bodyExtra', cx: mark.cxMm, cy: round(bottomMm + mark.cyFromTopMm), r: mark.rMm,
          style: { fill: 'none', stroke: 'schwarz', strokeWidth: DEFAULT_STROKE_WIDTH_MM },
        }]);
}

/** Lage der Deckkurve je Fahrzeugkörper: linke Kante, Sehne, Unterkante (siehe `deckCurveBody`). */
const DECK: Partial<Record<SymbolKind, { leftXMm: number; chordYMm: number; bottomYMm: number }>> = {
  'vehicle-land': { leftXMm: 1, chordYMm: 5.75, bottomYMm: 26 },
  trailer: { leftXMm: 4, chordYMm: 5.75, bottomYMm: 26 },
  'swap-loader-vehicle': { leftXMm: 2.5, chordYMm: 6, bottomYMm: 24.5 },
};

/**
 * Der Kettenrumpf an Anhänger und Wechsellader: der vermessene Kettenrumpf des Landfahrzeugs mit
 * demselben Mechanismus wie die Deckkurve übertragen — waagerecht um die rechte Kante x 31
 * gestreckt, die Fallhöhen der Kurve unverändert, Oberkante und Ecken mit ihren an N.1.1
 * gemessenen 0,25 mm Abstand zu Sehne und Unterkante der jeweiligen Deckkurve.
 */
function invertedHullTrack(kind: SymbolKind, land: Primitive): Primitive {
  const source = DECK['vehicle-land']!;
  const target = DECK[kind];
  if (target === undefined || land.type !== 'path') {
    throw new Error(`invertedHullTrack: kein Deckkurvenkörper für "${kind}".`);
  }
  const scale = (31 - target.leftXMm) / (31 - source.leftXMm);
  const middle = (source.chordYMm + source.bottomYMm) / 2;
  return {
    ...land,
    d: mapPath(
      land.d,
      (x) => 31 - scale * (31 - x),
      (y) => y < middle
        ? y + (target.chordYMm - source.chordYMm)
        : y + (target.bottomYMm - source.bottomYMm),
    ),
  };
}

/** Schrittweite der Verkleinerung unter dem Giebel. */
const GABLE_FIT_STEP = 0.0025;

/**
 * Der größte Faktor ≤ 1, mit dem Körper und Zusatzgeometrie — um die Mitte ihrer Unterkante
 * verkleinert — den vermessenen Giebelabstand halten. Die Unterkante bleibt stehen, damit
 * Fuß-, Fahrwerks- und untere Beschriftungszone dort bleiben, wo das Profil sie erwartet.
 */
function gableScaling(body: Primitive, kindExtras: readonly Primitive[], gable: Primitive, clearanceMm: number): Scaling {
  const ring = outlineOf(body);
  const chains: Vec[][] = [[...ring, ring[0]!], ...kindExtras.flatMap(strokeChainsOf)];
  const gableChains = strokeChainsOf(gable);
  const xs = ring.map((point) => point[0]);
  const originX = (Math.min(...xs) + Math.max(...xs)) / 2;
  const originY = Math.max(...chains.flat().map((point) => point[1]));
  for (let factor = 1; factor > 0.2; factor = round(factor - GABLE_FIT_STEP)) {
    const scaled = chains.map((chain) =>
      chain.map((p): Vec => [originX + factor * (p[0] - originX), originY + factor * (p[1] - originY)]));
    const fits = scaled.every((chain) =>
      gableChains.every((gableChain) => chainDistance(chain, gableChain) >= clearanceMm));
    if (fits) return { factor, originX: round(originX), originY: round(originY) };
  }
  throw new Error('gableScaling: kein Faktor hält den Giebelabstand.');
}

/**
 * Leitet die Zeichnung eines zugelassenen, nicht vermessenen Art×Variante-Paars ab. Wirft für
 * jedes andere Paar: Vermessene Paare stehen in `VARIANT_BODIES`, gesperrte sind Systematik.
 */
export function deriveBodyVariant(
  kind: SymbolKind,
  variant: BodyVariantId,
  sources: VariantSources,
): DerivedVariant {
  if (!isDerivedBodyVariant(kind, variant)) {
    throw new Error(`deriveBodyVariant: "${kind}" / "${variant}" ist kein abgeleitetes Paar.`);
  }
  const { body, kindExtras } = sources;
  switch (variant) {
    case 'foot-band':
      return {
        body,
        extras: [...kindExtras, footBand(body)],
        notes: [{
          dimension: 'bodyVariant',
          part: `Fußband an "${kind}": Schnitt der Körperfläche mit dem 3-mm-Streifen an der Unterkante`,
          basis: 'constructed',
          from: 'formation/foot-band (G.1.2: Band y 23…26 innen an der Unterkante 26)',
        }],
      };
    case 'plain-wheel-pair':
      return {
        body,
        extras: [...kindExtras, ...wheelPair(kind, baseBottomMm(body, kindExtras))],
        notes: [{
          dimension: 'bodyVariant',
          part: `Radpaar an "${kind}"`,
          basis: 'transferred',
          from: kind === 'trailer'
            ? 'Fahrzeugkategorie anhaenger-zwei-raeder (Radplätze 14,25 / 19,75)'
            : 'vehicle-land/plain-wheel-pair = Fahrzeugkategorie kfz-kategorie-1 (3,75 / 28,25)',
        }],
      };
    case 'inverted-hull-track':
      return {
        body: invertedHullTrack(kind, sources.invertedHullTrack),
        extras: kindExtras,
        notes: [{
          dimension: 'bodyVariant',
          part: `Kettenrumpf an "${kind}", waagerecht gestreckt wie die Deckkurve`,
          basis: 'transferred',
          from: 'vehicle-land/inverted-hull-track (N.1.1)',
        }],
      };
    case 'raised-gable': {
      const scaling = gableScaling(body, kindExtras, sources.gable, sources.gableClearanceMm);
      return {
        body: scalePrimitive(body, scaling),
        extras: [...kindExtras.map((extra) => scalePrimitive(extra, scaling)), sources.gable],
        scaling,
        notes: [{
          dimension: 'bodyVariant',
          part:
            `Giebel über "${kind}": Körper um ${round(scaling.factor * 100) / 100} verkleinert, ` +
            'Unterkante gehalten',
          basis: 'transferred',
          from:
            'circle-12/raised-gable (F.3.5/F.3.14): Giebel (3|11)–(16|1)–(29|11), ' +
            `Abstand ${round(sources.gableClearanceMm * 100) / 100} mm zum Körper`,
        }],
      };
    }
    default:
      throw new Error(`deriveBodyVariant: keine Ableitung für "${variant}".`);
  }
}

/**
 * Was an einem abgeleiteten Paar nicht mitgezeichnet werden kann, und deshalb als Lücke wirft
 * statt still falsch zu zeichnen.
 *
 * - **Giebel und Fahrzeugkategorie:** die Radplätze der Fahrwerkszone sind absolut vermessen
 *   (3,75 / 28,25 mm). Unter dem für den Giebel verkleinerten Körper stünden sie seitlich über.
 */
export function assertDerivedVariantComposable(spec: SymbolSpec): void {
  if (
    spec.bodyVariant === 'raised-gable' &&
    isDerivedBodyVariant(spec.kind, spec.bodyVariant) &&
    spec.vehicleCategory !== undefined
  ) {
    throw new NotMeasuredError(
      `Die Fahrwerkszone unter "${spec.kind}" mit Giebel ist nicht abgeleitet: ihre Radplätze ` +
        'sind absolut vermessen, der Körper ist für den Giebel verkleinert.',
      'combination',
    );
  }
}
