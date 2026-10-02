import type { FunctionRoleTextRun, Point, Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { NotMeasuredError } from '../not-measured.js';
import { tokenizePath } from '../path-commands.js';

/**
 * Gleichmäßige Streckung um den Ursprung mit anschließender Verschiebung: p ↦ k·p + d.
 *
 * Mehr braucht die Ableitung an der Funktionsfassung nicht. Eine Funktionsfassung wird auf einen
 * anderen Körper derselben Gestalt umgerechnet (Raute auf Raute, Rechteck auf Rechteck), und ein
 * Piktogramm wird in einen freien Bereich eingepasst; beides erhält die Seitenverhältnisse. Eine
 * Scherung oder ungleiche Streckung entstellte Läufe und Piktogramme und ist deshalb nicht
 * vorgesehen.
 */
export interface UniformAffine {
  readonly scale: number;
  readonly dxMm: number;
  readonly dyMm: number;
}

export const IDENTITY_AFFINE: UniformAffine = { scale: 1, dxMm: 0, dyMm: 0 };

export function isIdentityAffine(affine: UniformAffine): boolean {
  return affine.scale === 1 && affine.dxMm === 0 && affine.dyMm === 0;
}

/** Sechs Nachkommastellen: genug für Messwerte auf 0,0001 mm, ohne Gleitkommarauschen. */
function round(value: number): number {
  return Math.round(value * 1e6) / 1e6;
}

function mapX(affine: UniformAffine, x: number): number {
  return round(affine.scale * x + affine.dxMm);
}

function mapY(affine: UniformAffine, y: number): number {
  return round(affine.scale * y + affine.dyMm);
}

function mapLength(affine: UniformAffine, length: number): number {
  return round(affine.scale * length);
}

function mapPoint(affine: UniformAffine, [x, y]: Point): Point {
  return [mapX(affine, x), mapY(affine, y)];
}

/** Die Abbildung, die `from` mittig und seitentreu auf `to` legt (größtmöglich, ohne Überstand). */
export function affineBetween(from: BoundsMm, to: BoundsMm): UniformAffine {
  const fromWidth = from.maxX - from.minX;
  const fromHeight = from.maxY - from.minY;
  const scale = Math.min(
    (to.maxX - to.minX) / fromWidth,
    (to.maxY - to.minY) / fromHeight,
  );
  const fromCenterX = (from.minX + from.maxX) / 2;
  const fromCenterY = (from.minY + from.maxY) / 2;
  const toCenterX = (to.minX + to.maxX) / 2;
  const toCenterY = (to.minY + to.maxY) / 2;
  // Auf genau 1 gerundet, damit eine reine Verschiebung keine Streckung um 1 ± ε trägt.
  const exactScale = Math.abs(scale - 1) < 1e-9 ? 1 : scale;
  return {
    scale: exactScale,
    dxMm: round(toCenterX - exactScale * fromCenterX),
    dyMm: round(toCenterY - exactScale * fromCenterY),
  };
}

function mapPathData(affine: UniformAffine, d: string): string {
  const { commands, problems } = tokenizePath(d);
  if (problems.length > 0) {
    throw new Error(`Pfad lässt sich nicht umrechnen: ${problems.join('; ')}`);
  }
  return commands
    .map(({ command, numbers }) => {
      const mapped = numbers.map((value, index) => {
        if (command === 'H') return mapX(affine, value);
        if (command === 'V') return mapY(affine, value);
        return index % 2 === 0 ? mapX(affine, value) : mapY(affine, value);
      });
      return mapped.length === 0 ? command : `${command} ${mapped.join(' ')}`;
    })
    .join(' ');
}

/**
 * Rechnet ein Primitiv um. Strichstärken bleiben, wie sie sind: der Katalog zeichnet jeden Strich
 * mit 0,5 mm, auch an verkleinerten Fassungen. Eine Gruppenverschiebung wird in die Kinder
 * eingerechnet, damit das Ergebnis keine verschachtelte Transformation mehr trägt.
 */
export function mapPrimitive(primitive: Primitive, affine: UniformAffine): Primitive {
  if (isIdentityAffine(affine)) return primitive;
  const rotate = primitive.transform?.rotate;
  const transform = rotate === undefined
    ? undefined
    : { rotate: { ...rotate, cx: mapX(affine, rotate.cx), cy: mapY(affine, rotate.cy) } };
  const withTransform = <T extends Primitive>(mapped: T): T => {
    const { transform: _ignored, ...rest } = mapped;
    return (transform === undefined ? rest : { ...rest, transform }) as T;
  };
  switch (primitive.type) {
    case 'rect':
      return withTransform({
        ...primitive,
        x: mapX(affine, primitive.x),
        y: mapY(affine, primitive.y),
        width: mapLength(affine, primitive.width),
        height: mapLength(affine, primitive.height),
        ...(primitive.rx === undefined ? {} : { rx: mapLength(affine, primitive.rx) }),
      });
    case 'circle':
      return withTransform({
        ...primitive,
        cx: mapX(affine, primitive.cx),
        cy: mapY(affine, primitive.cy),
        r: mapLength(affine, primitive.r),
      });
    case 'line':
      return withTransform({
        ...primitive,
        x1: mapX(affine, primitive.x1),
        y1: mapY(affine, primitive.y1),
        x2: mapX(affine, primitive.x2),
        y2: mapY(affine, primitive.y2),
      });
    case 'polyline':
      return withTransform({
        ...primitive,
        points: primitive.points.map((point) => mapPoint(affine, point)),
      });
    case 'path':
      return withTransform({ ...primitive, d: mapPathData(affine, primitive.d) });
    case 'text':
      return withTransform({
        ...primitive,
        x: mapX(affine, primitive.x),
        y: mapY(affine, primitive.y),
        sizeMm: mapLength(affine, primitive.sizeMm),
        boxMm: {
          xMm: mapX(affine, primitive.boxMm.xMm),
          yMm: mapY(affine, primitive.boxMm.yMm),
          widthMm: mapLength(affine, primitive.boxMm.widthMm),
          heightMm: mapLength(affine, primitive.boxMm.heightMm),
        },
      });
    case 'group': {
      if (rotate !== undefined) {
        throw new Error('Gedrehte Gruppen lassen sich nicht umrechnen.');
      }
      const translate = primitive.transform?.translate;
      // Erst die eigene Verschiebung der Gruppe, dann die Abbildung: k·(p + t) + d.
      const inner: UniformAffine = translate === undefined
        ? affine
        : {
            scale: affine.scale,
            dxMm: affine.dxMm + affine.scale * translate.dxMm,
            dyMm: affine.dyMm + affine.scale * translate.dyMm,
          };
      const { transform: _ignored, ...rest } = primitive;
      return {
        ...rest,
        children: primitive.children.map((child) =>
          isIdentityAffine(inner) ? child : mapPrimitive(child, inner)),
      };
    }
  }
}

export function mapRoleRun(run: FunctionRoleTextRun, affine: UniformAffine): FunctionRoleTextRun {
  if (isIdentityAffine(affine)) return run;
  return {
    ...run,
    anchorXMm: mapX(affine, run.anchorXMm),
    baselineYMm: mapY(affine, run.baselineYMm),
    sizeMm: mapLength(affine, run.sizeMm),
    boxMm: {
      xMm: mapX(affine, run.boxMm.xMm),
      yMm: mapY(affine, run.boxMm.yMm),
      widthMm: mapLength(affine, run.boxMm.widthMm),
      heightMm: mapLength(affine, run.boxMm.heightMm),
    },
  };
}

export function runBounds(run: FunctionRoleTextRun): BoundsMm {
  return {
    minX: run.boxMm.xMm,
    minY: run.boxMm.yMm,
    maxX: run.boxMm.xMm + run.boxMm.widthMm,
    maxY: run.boxMm.yMm + run.boxMm.heightMm,
  };
}

export function unionBounds(boxes: readonly BoundsMm[]): BoundsMm | undefined {
  if (boxes.length === 0) return undefined;
  return boxes.reduce((union, box) => ({
    minX: Math.min(union.minX, box.minX),
    minY: Math.min(union.minY, box.minY),
    maxX: Math.max(union.maxX, box.maxX),
    maxY: Math.max(union.maxY, box.maxY),
  }));
}

export function boundsIntersect(left: BoundsMm, right: BoundsMm): boolean {
  return left.minX < right.maxX && right.minX < left.maxX &&
    left.minY < right.maxY && right.minY < left.maxY;
}

/** Hülle einer Primitivliste; leere Gruppen zählen nicht. */
export function primitivesBounds(primitives: readonly Primitive[]): BoundsMm | undefined {
  return unionBounds(
    primitives
      .map((primitive) => boundsOfMm(primitive))
      .filter((box) => box.maxX > box.minX || box.maxY > box.minY),
  );
}

/**
 * Die Körperform, in die eingepasst wird: ein achsparalleles Rechteck oder die um 45° gedrehte
 * Raute der Person. Andere Formen trägt eine Funktionsfassung nicht; sie fallen auf ihre Hülle
 * zurück, was für ein Rechteck exakt und für jede andere Form eine sichere Obergrenze ist, weil
 * die Läufe der Fassung ohnehin in dieser Hülle stehen.
 */
export type RoleBodyShape =
  | { readonly kind: 'rect'; readonly bounds: BoundsMm }
  | { readonly kind: 'diamond'; readonly cx: number; readonly cy: number; readonly halfDiagonal: number };

export function roleBodyShape(body: Primitive): RoleBodyShape {
  const bounds = boundsOfMm(body);
  const rotate = body.transform?.rotate;
  if (body.type === 'rect' && rotate !== undefined && Math.abs(rotate.angle % 90) === 45 &&
    Math.abs(body.width - body.height) < 1e-6) {
    return {
      kind: 'diamond',
      cx: (bounds.minX + bounds.maxX) / 2,
      cy: (bounds.minY + bounds.maxY) / 2,
      halfDiagonal: (bounds.maxX - bounds.minX) / 2,
    };
  }
  return { kind: 'rect', bounds };
}

/** Abstand eingepasster Teile zur Körperkontur und zu belegten Flächen. */
export const FIT_MARGIN_MM = 0.75;

function clamp(value: number, low: number, high: number): number {
  return Math.min(Math.max(value, low), high);
}

/**
 * Größte Streckung k ≤ 1, mit der ein Kasten der Größe width × height in `region` und im Körper
 * liegt; dazu seine Mitte. `undefined`, wenn nichts Sichtbares hineinpasst.
 */
function largestFit(
  shape: RoleBodyShape,
  region: BoundsMm,
  width: number,
  height: number,
): { scale: number; cx: number; cy: number } | undefined {
  const preferX = shape.kind === 'diamond' ? shape.cx : (shape.bounds.minX + shape.bounds.maxX) / 2;
  const preferY = shape.kind === 'diamond' ? shape.cy : (shape.bounds.minY + shape.bounds.maxY) / 2;
  const inner: BoundsMm = shape.kind === 'rect'
    ? {
        minX: Math.max(region.minX, shape.bounds.minX + FIT_MARGIN_MM),
        minY: Math.max(region.minY, shape.bounds.minY + FIT_MARGIN_MM),
        maxX: Math.min(region.maxX, shape.bounds.maxX - FIT_MARGIN_MM),
        maxY: Math.min(region.maxY, shape.bounds.maxY - FIT_MARGIN_MM),
      }
    : region;
  const place = (scale: number) => {
    const halfW = (scale * width) / 2;
    const halfH = (scale * height) / 2;
    if (inner.maxX - inner.minX < 2 * halfW || inner.maxY - inner.minY < 2 * halfH) return undefined;
    const cx = clamp(preferX, inner.minX + halfW, inner.maxX - halfW);
    const cy = clamp(preferY, inner.minY + halfH, inner.maxY - halfH);
    if (shape.kind === 'diamond') {
      // Ein achsparalleler Kasten liegt in der Raute, wenn seine äußerste Ecke es tut.
      const reach = Math.abs(cx - shape.cx) + halfW + Math.abs(cy - shape.cy) + halfH;
      if (reach > shape.halfDiagonal - FIT_MARGIN_MM * Math.SQRT2) return undefined;
    }
    return { scale, cx, cy };
  };
  const full = place(1);
  if (full !== undefined) return full;
  let low = 0;
  let high = 1;
  for (let step = 0; step < 40; step += 1) {
    const middle = (low + high) / 2;
    if (place(middle) === undefined) high = middle;
    else low = middle;
  }
  return low > 0.05 ? place(low) : undefined;
}

/**
 * Die freien Bereiche des Körpers neben den belegten Flächen (Läufe, Kappe, Balken, Fußband):
 * je ein Streifen über, unter, links und rechts der Vereinigung aller Belegungen innerhalb der
 * Körperhülle — und, ohne Belegung, die Hülle selbst.
 */
function freeRegions(shape: RoleBodyShape, occupied: readonly BoundsMm[]): BoundsMm[] {
  const hull: BoundsMm = shape.kind === 'rect'
    ? shape.bounds
    : {
        minX: shape.cx - shape.halfDiagonal,
        minY: shape.cy - shape.halfDiagonal,
        maxX: shape.cx + shape.halfDiagonal,
        maxY: shape.cy + shape.halfDiagonal,
      };
  if (occupied.length === 0) return [hull];
  const sorted = [...occupied].sort((a, b) => a.minY - b.minY);
  const regions: BoundsMm[] = [];
  // Waagerechte Streifen zwischen den Belegungen, von oben nach unten.
  let top = hull.minY;
  for (const box of sorted) {
    if (box.minY - FIT_MARGIN_MM > top) {
      regions.push({ minX: hull.minX, minY: top, maxX: hull.maxX, maxY: box.minY - FIT_MARGIN_MM });
    }
    top = Math.max(top, box.maxY + FIT_MARGIN_MM);
  }
  if (top < hull.maxY) regions.push({ minX: hull.minX, minY: top, maxX: hull.maxX, maxY: hull.maxY });
  // Senkrechte Streifen links und rechts jeder Belegung, auf deren Höhe begrenzt durch die
  // nächsten Belegungen darüber und darunter.
  for (const box of sorted) {
    const above = sorted.filter((other) => other !== box && other.maxY <= box.minY);
    const below = sorted.filter((other) => other !== box && other.minY >= box.maxY);
    const minY = Math.max(hull.minY, ...above.map((other) => other.maxY + FIT_MARGIN_MM));
    const maxY = Math.min(hull.maxY, ...below.map((other) => other.minY - FIT_MARGIN_MM));
    const besides = sorted.filter((other) =>
      other !== box && other.maxY > minY && other.minY < maxY);
    const leftLimit = Math.max(
      hull.minX,
      ...besides.filter((other) => other.maxX <= box.minX).map((other) => other.maxX + FIT_MARGIN_MM),
    );
    const rightLimit = Math.min(
      hull.maxX,
      ...besides.filter((other) => other.minX >= box.maxX).map((other) => other.minX - FIT_MARGIN_MM),
    );
    if (box.minX - FIT_MARGIN_MM > leftLimit && maxY > minY) {
      regions.push({ minX: leftLimit, minY, maxX: box.minX - FIT_MARGIN_MM, maxY });
    }
    if (box.maxX + FIT_MARGIN_MM < rightLimit && maxY > minY) {
      regions.push({ minX: box.maxX + FIT_MARGIN_MM, minY, maxX: rightLimit, maxY });
    }
  }
  return regions.filter((region) => !occupied.some((box) => boundsIntersect(region, box)));
}

function insideShape(shape: RoleBodyShape, box: BoundsMm): boolean {
  if (shape.kind === 'rect') {
    return box.minX >= shape.bounds.minX && box.minY >= shape.bounds.minY &&
      box.maxX <= shape.bounds.maxX && box.maxY <= shape.bounds.maxY;
  }
  return [[box.minX, box.minY], [box.maxX, box.minY], [box.minX, box.maxY], [box.maxX, box.maxY]]
    .every(([x, y]) => Math.abs(x! - shape.cx) + Math.abs(y! - shape.cy) <= shape.halfDiagonal);
}

export interface FittedParts {
  readonly primitives: readonly Primitive[];
  /** `false`, wenn die Teile unverändert frei im Körper lagen. */
  readonly moved: boolean;
}

/**
 * Passt Piktogramme oder Körpermarken in den freien Bereich einer Funktionsfassung ein.
 *
 * Liegen sie schon frei im Körper — ohne Überschneidung mit einer Belegung —, bleiben sie
 * unverändert. Sonst werden sie als Ganzes gleichmäßig verkleinert (nie vergrößert) und in den
 * größten freien Bereich gelegt. Die Läufe der Fassung sind ihr Inhalt; ihnen weicht das
 * Piktogramm, nicht umgekehrt. Ohne jeden freien Bereich bleibt die Kombination eine Lücke
 * (`NotMeasuredError`): ein Piktogramm, das nur noch als Punkt passte, wäre keine Zeichnung.
 */
export function fitIntoRoleBody(
  parts: readonly Primitive[],
  body: Primitive,
  occupied: readonly BoundsMm[],
): FittedParts {
  const bounds = primitivesBounds(parts);
  if (bounds === undefined) return { primitives: parts, moved: false };
  const shape = roleBodyShape(body);
  const collides = occupied.some((box) => boundsIntersect(box, bounds));
  if (!collides && insideShape(shape, bounds)) return { primitives: parts, moved: false };

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  let best: { scale: number; cx: number; cy: number } | undefined;
  for (const region of freeRegions(shape, occupied)) {
    const fit = largestFit(shape, region, width, height);
    if (fit !== undefined && (best === undefined || fit.scale > best.scale)) best = fit;
  }
  if (best === undefined) {
    throw new NotMeasuredError(
      'Die Funktionsfassung lässt neben Läufen, Kappe und Marken keinen freien Bereich für das ' +
        'Piktogramm; ein bis zur Unkenntlichkeit verkleinertes Piktogramm wird nicht gezeichnet.',
      'combination',
    );
  }
  const centerX = (bounds.minX + bounds.maxX) / 2;
  const centerY = (bounds.minY + bounds.maxY) / 2;
  const affine: UniformAffine = {
    scale: best.scale,
    dxMm: best.cx - best.scale * centerX,
    dyMm: best.cy - best.scale * centerY,
  };
  return { primitives: parts.map((part) => mapPrimitive(part, affine)), moved: true };
}

/**
 * Passt die Läufe einer Funktionsfassung als Gruppe in den senkrechten Bereich zwischen
 * `topMm` und `bottomMm` ein: erst verschieben, nur wenn das nicht reicht, verkleinern.
 */
export function fitRunsVertically(
  runs: readonly FunctionRoleTextRun[],
  topMm: number,
  bottomMm: number,
): { runs: readonly FunctionRoleTextRun[]; moved: boolean } {
  const union = unionBounds(runs.map(runBounds));
  if (union === undefined || (union.minY >= topMm && union.maxY <= bottomMm)) {
    return { runs, moved: false };
  }
  const available = bottomMm - topMm;
  const height = union.maxY - union.minY;
  const scale = height <= available ? 1 : available / height;
  const centerX = (union.minX + union.maxX) / 2;
  const scaledTop = union.minY + (height - scale * height) / 2;
  // Nach der Streckung um die Mitte: so wenig verschieben wie möglich.
  const scaledBottom = scaledTop + scale * height;
  const shift = scaledTop < topMm ? topMm - scaledTop : scaledBottom > bottomMm ? bottomMm - scaledBottom : 0;
  const centerY = (union.minY + union.maxY) / 2;
  const affine: UniformAffine = {
    scale,
    dxMm: centerX - scale * centerX,
    dyMm: centerY - scale * centerY + shift,
  };
  return { runs: runs.map((run) => mapRoleRun(run, affine)), moved: true };
}
