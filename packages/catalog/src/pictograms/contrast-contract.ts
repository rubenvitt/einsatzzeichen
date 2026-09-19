import {
  colorFor,
  tokenizePath,
  type ContrastRequirement,
  type RenderTheme,
} from '@einsatzzeichen/core';
import {
  DEFAULT_STROKE_WIDTH_MM,
  type ColorToken,
  type Point,
  type Primitive,
  type Style,
} from '@einsatzzeichen/schema';
import { ORGANIZATION_COLORS } from '../organizations.js';
import { RENDER_THEMES } from '../render-themes.js';
import type { CatalogPictogramDefinition, PictogramContrastPair } from './catalog-definition.js';

/**
 * WCAG unterscheidet zwei Kontrastschwellen: 3:1 für grafische Objekte (Nichttext), 4.5:1 für
 * Fließtext. `MINIMUM_NON_TEXT_CONTRAST` trug diese Unterscheidung schon im Namen — die Konstante
 * für Text war nur noch nicht geschrieben.
 */
export const MINIMUM_NON_TEXT_CONTRAST = 3;
export const MINIMUM_TEXT_CONTRAST = 4.5;

/*
 * **Zwei Regeln, festgelegt am 19. September 2026** (Neukonstruktion nach dem Fachreview, siehe
 * docs/decisions/2026-09-19-masse-an-der-referenz-ablesen.md). Vorher galt: jede gemalte Farbe
 * ist Vordergrund, und malt eine Farbe irgendwo im Zeichen Text, gilt 4,5:1 für **alle** ihre
 * Paare. Beides war vorsichtig, solange Piktogramme nur aus schwarzen Strichen bestanden. Mit
 * echten Füllungen und echtem Text aus der Referenz meldete es Befunde, die es im Bild nicht gibt.
 *
 * 1. **Eine eingefasste Füllfläche ist kein Vordergrund.** Trägt ein Blatt eine Füllung und
 *    zugleich eine aktive Kontur in einer anderen Farbe, ist die sichtbare Grenze der Fläche die
 *    Kontur — wie beim weißen Körper mit schwarzem Rand. Die Kontur ist selbst eine gemalte Farbe
 *    und muss ihren Kontrast zur Umgebung erreichen; die Füllung dahinter braucht keinen zur
 *    Oberfläche. Ohne diese Regel wäre jede weiße Innenfläche ein 1:1-Befund gegen die weiße
 *    Ausgabeoberfläche (4.6.6 Krankenhaus, Warndreiecke 4.1.6 bis 4.1.8), und weiß auf orange
 *    rutschte still unter die E.2.6-Ausnahme, die für einen Beschriftungslauf entschieden ist.
 *    Die Regel gilt nur, wenn die Farbe **ausschließlich** so auftritt: malt dieselbe Farbe an
 *    anderer Stelle frei, bleibt sie Vordergrund.
 *
 * 2. **Die Textschwelle gilt dem Textelement und seinem tatsächlichen Hintergrund.** Der
 *    Hintergrund wird geometrisch bestimmt: an fünf Punkten der Autorenbox (Mitte und vier um ein
 *    Zehntel eingerückte Ecken) die oberste zuvor gemalte Füllfläche, sonst die Oberfläche bzw.
 *    der Körper. Nur Paare aus Textfarbe und einem dieser Hintergründe bekommen 4,5:1; dieselbe
 *    Farbe als 0,5-mm-Strich auf anderem Grund bleibt Nichttext mit 3:1. Die schwarze
 *    Sektorgrenze auf Rot in 5.8.2 ist kein Text, nur weil die Stufenziffer auf Weiß schwarz ist.
 *
 *    Fail-closed: Lässt sich der Hintergrund nicht bestimmen (gedrehte Gruppe, nicht lesbarer
 *    Pfad), gilt für diese Farbe die alte, strengere Regel. Und liegt Text auf einem Hintergrund,
 *    zu dem das Standalone-Zeichen kein Paar deklariert, erzeugt der Vertrag die Anforderung
 *    selbst, statt sie still zu übergehen.
 */

/** Ein Blatt mit aufgelöstem Stil und der Verschiebung aller umschließenden Gruppen. */
interface Leaf {
  readonly primitive: Exclude<Primitive, { type: 'group' }>;
  readonly style: Style;
  readonly dx: number;
  readonly dy: number;
  /** Eine umschließende Gruppe dreht — dann ist die Lage des Blatts hier nicht auflösbar. */
  readonly rotatedGroup: boolean;
}

function leavesOf(primitives: readonly Primitive[]): readonly Leaf[] {
  const leaves: Leaf[] = [];
  const visit = (
    primitive: Primitive,
    inherited: Style,
    dx: number,
    dy: number,
    rotatedGroup: boolean,
  ): void => {
    // Dieselbe feldweise Vererbung wie `mergeStyle` in core: eigene Felder überschreiben.
    const style: Style = { ...inherited, ...primitive.style };
    if (primitive.type === 'group') {
      const translate = primitive.transform?.translate;
      for (const child of primitive.children) {
        visit(
          child,
          style,
          dx + (translate?.dxMm ?? 0),
          dy + (translate?.dyMm ?? 0),
          rotatedGroup || primitive.transform?.rotate !== undefined,
        );
      }
      return;
    }
    leaves.push({ primitive, style, dx, dy, rotatedGroup });
  };
  for (const primitive of primitives) visit(primitive, {}, 0, 0, false);
  return leaves;
}

function fillOf(leaf: Leaf): ColorToken | undefined {
  const fill = leaf.style.fill;
  return fill === undefined || fill === 'none' ? undefined : fill;
}

function strokeOf(leaf: Leaf): ColorToken | undefined {
  if (leaf.primitive.type === 'text') return undefined;
  const stroke = leaf.style.stroke;
  if (stroke === undefined || stroke === 'none') return undefined;
  return (leaf.style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM) > 0 ? stroke : undefined;
}

/** Regel 1: Füllung mit eigener, andersfarbiger aktiver Kontur. */
function isEnclosedFill(leaf: Leaf): boolean {
  const fill = fillOf(leaf);
  const stroke = strokeOf(leaf);
  return fill !== undefined && stroke !== undefined && stroke !== fill;
}

/** Punkt in die Koordinaten des Blatts zurückführen (Gruppenverschiebung, eigene Drehung). */
function toLeafCoordinates([x, y]: Point, leaf: Leaf): Point {
  let px = x - leaf.dx;
  let py = y - leaf.dy;
  const translate = leaf.primitive.transform?.translate;
  if (translate !== undefined) {
    px -= translate.dxMm;
    py -= translate.dyMm;
  }
  const rotate = leaf.primitive.transform?.rotate;
  if (rotate !== undefined) {
    const rad = (-rotate.angle * Math.PI) / 180;
    const ox = px - rotate.cx;
    const oy = py - rotate.cy;
    px = rotate.cx + ox * Math.cos(rad) - oy * Math.sin(rad);
    py = rotate.cy + ox * Math.sin(rad) + oy * Math.cos(rad);
  }
  return [px, py];
}

/** Pfad als Polygonzüge; Kurven mit 16 Stützpunkten je Segment. `undefined`: nicht lesbar. */
function pathPolygons(d: string): readonly (readonly Point[])[] | undefined {
  const { commands, problems } = tokenizePath(d);
  if (problems.length > 0) return undefined;
  const polygons: Point[][] = [];
  let current: Point[] = [];
  let cursor: Point = [0, 0];
  let start: Point = [0, 0];
  const steps = 16;
  for (const { command, numbers: n } of commands) {
    switch (command) {
      case 'M':
        if (current.length > 0) polygons.push(current);
        cursor = [n[0]!, n[1]!];
        start = cursor;
        current = [cursor];
        break;
      case 'L':
        cursor = [n[0]!, n[1]!];
        current.push(cursor);
        break;
      case 'H':
        cursor = [n[0]!, cursor[1]];
        current.push(cursor);
        break;
      case 'V':
        cursor = [cursor[0], n[0]!];
        current.push(cursor);
        break;
      case 'C': {
        const [x0, y0] = cursor;
        for (let i = 1; i <= steps; i += 1) {
          const t = i / steps;
          const u = 1 - t;
          current.push([
            u * u * u * x0 + 3 * u * u * t * n[0]! + 3 * u * t * t * n[2]! + t * t * t * n[4]!,
            u * u * u * y0 + 3 * u * u * t * n[1]! + 3 * u * t * t * n[3]! + t * t * t * n[5]!,
          ]);
        }
        cursor = [n[4]!, n[5]!];
        break;
      }
      case 'Q': {
        const [x0, y0] = cursor;
        for (let i = 1; i <= steps; i += 1) {
          const t = i / steps;
          const u = 1 - t;
          current.push([
            u * u * x0 + 2 * u * t * n[0]! + t * t * n[2]!,
            u * u * y0 + 2 * u * t * n[1]! + t * t * n[3]!,
          ]);
        }
        cursor = [n[2]!, n[3]!];
        break;
      }
      case 'Z':
        cursor = start;
        break;
    }
  }
  if (current.length > 0) polygons.push(current);
  return polygons;
}

/** Windungszahl eines Punkts über alle Teilpolygone (implizit geschlossen, wie SVG füllt). */
function windingNumber([px, py]: Point, polygons: readonly (readonly Point[])[]): number {
  let winding = 0;
  for (const polygon of polygons) {
    for (let i = 0; i < polygon.length; i += 1) {
      const [x1, y1] = polygon[i]!;
      const [x2, y2] = polygon[(i + 1) % polygon.length]!;
      const cross = (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1);
      if (y1 <= py && y2 > py && cross > 0) winding += 1;
      else if (y1 > py && y2 <= py && cross < 0) winding -= 1;
    }
  }
  return winding;
}

/** Liegt der Punkt in der gefüllten Fläche des Blatts? `undefined`: nicht bestimmbar. */
function fillContains(leaf: Leaf, point: Point): boolean | undefined {
  if (leaf.rotatedGroup) return undefined;
  const [x, y] = toLeafCoordinates(point, leaf);
  const primitive = leaf.primitive;
  switch (primitive.type) {
    case 'rect':
      return (
        x >= primitive.x && x <= primitive.x + primitive.width &&
        y >= primitive.y && y <= primitive.y + primitive.height
      );
    case 'circle':
      return Math.hypot(x - primitive.cx, y - primitive.cy) <= primitive.r;
    case 'polyline':
      // SVG füllt auch offene Polylinien, als wären sie geschlossen.
      return windingNumber([x, y], [primitive.points]) !== 0;
    case 'path': {
      const polygons = pathPolygons(primitive.d);
      if (polygons === undefined) return undefined;
      const winding = windingNumber([x, y], polygons);
      return leaf.style.fillRule === 'evenodd' ? winding % 2 !== 0 : winding !== 0;
    }
    case 'line':
    case 'text':
      return false;
  }
}

/**
 * Regel 2: tatsächliche Hintergründe je Textfarbe. `'surface'` steht für die Fläche unter dem
 * Piktogramm (Ausgabeoberfläche bzw. Körper). `undefined` je Farbe: nicht bestimmbar.
 */
function textBackgroundsOf(
  leaves: readonly Leaf[],
): ReadonlyMap<ColorToken, ReadonlySet<ColorToken | 'surface'> | undefined> {
  const result = new Map<ColorToken, Set<ColorToken | 'surface'> | undefined>();
  leaves.forEach((leaf, index) => {
    if (leaf.primitive.type !== 'text') return;
    const token = fillOf(leaf);
    if (token === undefined) return;
    if (!result.has(token)) result.set(token, new Set());
    const { xMm, yMm, widthMm, heightMm } = leaf.primitive.boxMm;
    const insetX = widthMm / 10;
    const insetY = heightMm / 10;
    const samples: Point[] = [
      [xMm + widthMm / 2, yMm + heightMm / 2],
      [xMm + insetX, yMm + insetY],
      [xMm + widthMm - insetX, yMm + insetY],
      [xMm + insetX, yMm + heightMm - insetY],
      [xMm + widthMm - insetX, yMm + heightMm - insetY],
    ].map(([x, y]) => [x + leaf.dx, y + leaf.dy] as Point);
    for (const sample of samples) {
      let background: ColorToken | 'surface' | undefined = 'surface';
      for (let below = index - 1; below >= 0; below -= 1) {
        const candidate = leaves[below]!;
        const fill = fillOf(candidate);
        if (fill === undefined) continue;
        const contains = fillContains(candidate, sample);
        if (contains === undefined) {
          background = undefined;
          break;
        }
        if (contains) {
          background = fill;
          break;
        }
      }
      const known = result.get(token);
      if (background === undefined || leaf.rotatedGroup) {
        result.set(token, undefined);
      } else {
        known?.add(background);
      }
    }
  });
  return result;
}

function strictest(requirements: readonly ContrastRequirement[]): ContrastRequirement[] {
  const byPair = new Map<string, ContrastRequirement>();
  for (const requirement of requirements) {
    const key = `${requirement.foreground}\u0000${requirement.background}`;
    const known = byPair.get(key);
    if (known === undefined || requirement.minimum > known.minimum) {
      byPair.set(key, known === undefined ? requirement : { ...known, minimum: requirement.minimum });
    }
  }
  return [...byPair.values()];
}

export function contrastRequirementsFor(
  definition: CatalogPictogramDefinition,
): readonly ContrastRequirement[] {
  const leaves = leavesOf(definition.primitives);
  const textBackgrounds = textBackgroundsOf(leaves);
  const isTextPair = (foreground: ColorToken, background: ColorToken | 'surface'): boolean => {
    if (!textBackgrounds.has(foreground)) return false;
    const backgrounds = textBackgrounds.get(foreground);
    // Nicht bestimmbar: die alte, strengere Regel für alle Paare dieser Farbe.
    return backgrounds === undefined || backgrounds.has(background);
  };

  if (definition.placement.mode === 'standalone') {
    if (!Array.isArray(definition.contrastPairs) || definition.contrastPairs.length === 0) {
      throw new Error(`Standalone-Piktogramm "${definition.id}" benötigt contrastPairs.`);
    }
    const declared: ContrastRequirement[] = definition.contrastPairs.map((pair) => ({
      ...pair,
      minimum: isTextPair(pair.foreground, pair.background)
        ? MINIMUM_TEXT_CONTRAST
        : MINIMUM_NON_TEXT_CONTRAST,
    }));
    // Text auf einem Hintergrund, zu dem kein Paar deklariert ist: die Anforderung entsteht
    // trotzdem. Eine fehlende Deklaration darf die Textprüfung nicht abschalten.
    const undeclared: ContrastRequirement[] = [];
    for (const [foreground, backgrounds] of textBackgrounds) {
      for (const background of backgrounds ?? []) {
        if (declared.some((pair) => pair.foreground === foreground && pair.background === background)) {
          continue;
        }
        undeclared.push({
          foreground,
          background,
          context: `${definition.id}: Text auf tatsächlichem Hintergrund, nicht als Paar deklariert`,
          minimum: MINIMUM_TEXT_CONTRAST,
        });
      }
    }
    return [...declared, ...undeclared];
  }

  // In-Body: Hintergrund ist die Oberfläche bzw. jede Organisationsfarbe (nur primary).
  const bodyBackgrounds: readonly { background: ColorToken | 'surface'; context: string }[] = [
    { background: 'surface', context: `${definition.id} ohne Organisationsfüllung` },
    ...(definition.variant === 'primary'
      ? Object.entries(ORGANIZATION_COLORS).map(([organization, background]) => ({
          background,
          context: `${definition.id} auf Organisation ${organization}`,
        }))
      : []),
  ];
  const result: ContrastRequirement[] = [];
  const pushAgainstBody = (foreground: ColorToken, minimum: number): void => {
    for (const { background, context } of bodyBackgrounds) {
      result.push({ foreground, background, context, minimum });
    }
  };
  for (const leaf of leaves) {
    const fill = fillOf(leaf);
    const stroke = strokeOf(leaf);
    if (leaf.primitive.type === 'text') {
      if (fill === undefined) continue;
      const backgrounds = textBackgrounds.get(fill);
      if (backgrounds === undefined) {
        pushAgainstBody(fill, MINIMUM_TEXT_CONTRAST);
        continue;
      }
      for (const background of backgrounds) {
        if (background === 'surface') {
          pushAgainstBody(fill, MINIMUM_TEXT_CONTRAST);
        } else {
          result.push({
            foreground: fill,
            background,
            context: `${definition.id}: Text auf Füllfläche ${background}`,
            minimum: MINIMUM_TEXT_CONTRAST,
          });
        }
      }
      continue;
    }
    if (stroke !== undefined) pushAgainstBody(stroke, MINIMUM_NON_TEXT_CONTRAST);
    if (fill !== undefined && !isEnclosedFill(leaf)) {
      pushAgainstBody(fill, MINIMUM_NON_TEXT_CONTRAST);
    }
  }
  return strictest(result);
}

export interface ContrastPairProblem {
  readonly foreground: ColorToken;
  readonly background: ColorToken | 'surface';
  readonly context: string;
  /** Themes, in denen Vordergrund- und Hintergrundtoken auf dieselbe Farbe auflösen. */
  readonly themeIds: readonly string[];
}

/**
 * Meldet Kontrastpaare, deren Vordergrund- und Hintergrundtoken in mindestens einem Theme
 * dieselbe Farbe auflösen — etwa `weiss`/`surface`, die beide zu `#ffffff` werden. Das
 * Kontrastverhältnis wäre dann exakt 1:1, die Zusicherung damit unerfüllbar.
 *
 * `checkContrast` würde ein solches Paar zwar auch melden — als Ratio-1,0-Verstoß gegen die
 * Mindestschwelle. Das verschleiert aber die eigentliche Ursache: Es ist kein Renderingfehler,
 * den ein anderes Token oder Theme heilen könnte, sondern ein Autor, der zwei Bezeichner für
 * dieselbe Farbe deklariert und den Kontrastvertrag damit missverstanden hat. Diese Prüfung
 * meldet es als das, was es ist — einen Fehler am Vertrag selbst, nicht als Zahl, die man
 * ausrechnet und knapp verfehlt.
 *
 * Die Prüfung geht bewusst je Theme vor (nicht anhand der Tokennamen): ein monochromes Theme kann
 * zwei sonst unterschiedliche Farbtoken auf denselben Grauwert abbilden, ohne dass sie es in
 * jedem Theme tun — die Kollision ist dann eine Eigenschaft des Themes, nicht der Tokennamen.
 * `themes` ist parametrisiert, damit dieses theme-abhängige Verhalten unabhängig vom aktuellen
 * Bestand der Render-Themes testbar bleibt.
 */
export function contrastPairProblems(
  pairs: readonly PictogramContrastPair[],
  themes: readonly RenderTheme[] = Object.values(RENDER_THEMES),
): readonly ContrastPairProblem[] {
  const problems: ContrastPairProblem[] = [];
  for (const pair of pairs) {
    const collidingThemeIds = themes
      .filter((theme) => {
        const foreground = colorFor(theme, pair.foreground);
        const background =
          pair.background === 'surface' ? theme.surface : colorFor(theme, pair.background);
        return foreground === background;
      })
      .map((theme) => theme.id);
    if (collidingThemeIds.length > 0) {
      problems.push({ ...pair, themeIds: collidingThemeIds });
    }
  }
  return problems;
}
