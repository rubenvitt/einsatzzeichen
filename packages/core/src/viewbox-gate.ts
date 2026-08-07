import {
  DEFAULT_STROKE_WIDTH_MM,
  mmToUnits,
  unitsEqual,
  type Drawing,
  type Point,
  type Primitive,
  type Style,
  type Transform,
} from '@einsatzzeichen/schema';
import { tokenizePath, type PathCommand } from './path-commands.js';
import { mergeStyle } from './render/style.js';

export type ViewBoxRule =
  | 'invalid-viewbox'
  | 'invalid-geometry'
  | 'path-syntax'
  | 'unsupported-transform'
  | 'outside-viewbox';

export interface ViewBoxIssue {
  rule: ViewBoxRule;
  primitive: string;
  detail: string;
}

interface Bounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function applyTransform([x, y]: Point, transform: Transform): Point {
  let nextX = x;
  let nextY = y;
  const rotate = transform.rotate;
  if (rotate !== undefined) {
    const radians = (rotate.angle * Math.PI) / 180;
    const dx = nextX - rotate.cx;
    const dy = nextY - rotate.cy;
    nextX = rotate.cx + dx * Math.cos(radians) - dy * Math.sin(radians);
    nextY = rotate.cy + dx * Math.sin(radians) + dy * Math.cos(radians);
  }
  const translate = transform.translate;
  if (translate !== undefined) {
    nextX += translate.dxMm;
    nextY += translate.dyMm;
  }
  return [nextX, nextY];
}

/** Lokales Blatt zuerst, danach die Transformationen seiner Elterngruppen. */
function transformed(point: Point, chain: readonly Transform[]): Point {
  return chain.reduce<Point>((current, transform) => applyTransform(current, transform), point);
}

function boundsOfPoints(points: readonly Point[], strokeWidthMm: number): Bounds | undefined {
  if (points.length === 0 || points.some(([x, y]) => !Number.isFinite(x) || !Number.isFinite(y))) {
    return undefined;
  }
  const halfStroke = strokeWidthMm / 2;
  return {
    minX: Math.min(...points.map(([x]) => x)) - halfStroke,
    minY: Math.min(...points.map(([, y]) => y)) - halfStroke,
    maxX: Math.max(...points.map(([x]) => x)) + halfStroke,
    maxY: Math.max(...points.map(([, y]) => y)) + halfStroke,
  };
}

function pathPoints(
  commands: readonly PathCommand[],
  issue: (rule: ViewBoxRule, detail: string) => void,
): Point[] {
  const points: Point[] = [];
  let current: Point | undefined;
  let subpathStart: Point | undefined;

  function pair(numbers: readonly number[], offset: number): Point | undefined {
    const x = numbers[offset];
    const y = numbers[offset + 1];
    return x === undefined || y === undefined ? undefined : [x, y];
  }

  for (const command of commands) {
    switch (command.command) {
      case 'M': {
        const point = pair(command.numbers, 0);
        if (point === undefined) break;
        current = point;
        subpathStart = point;
        points.push(point);
        break;
      }
      case 'L': {
        const point = pair(command.numbers, 0);
        if (current === undefined) {
          issue('path-syntax', 'L benötigt einen vorherigen aktuellen Punkt.');
          break;
        }
        if (point === undefined) break;
        current = point;
        points.push(point);
        break;
      }
      case 'H': {
        const x = command.numbers[0];
        if (current === undefined || x === undefined) {
          issue('path-syntax', 'H benötigt einen vorherigen aktuellen Punkt.');
          break;
        }
        current = [x, current[1]];
        points.push(current);
        break;
      }
      case 'V': {
        const y = command.numbers[0];
        if (current === undefined || y === undefined) {
          issue('path-syntax', 'V benötigt einen vorherigen aktuellen Punkt.');
          break;
        }
        current = [current[0], y];
        points.push(current);
        break;
      }
      case 'C': {
        if (current === undefined) {
          issue('path-syntax', 'C benötigt einen vorherigen aktuellen Punkt.');
          break;
        }
        const first = pair(command.numbers, 0);
        const second = pair(command.numbers, 2);
        const end = pair(command.numbers, 4);
        if (first !== undefined) points.push(first);
        if (second !== undefined) points.push(second);
        if (end !== undefined) {
          current = end;
          points.push(end);
        }
        break;
      }
      case 'Q': {
        if (current === undefined) {
          issue('path-syntax', 'Q benötigt einen vorherigen aktuellen Punkt.');
          break;
        }
        const control = pair(command.numbers, 0);
        const end = pair(command.numbers, 2);
        if (control !== undefined) points.push(control);
        if (end !== undefined) {
          current = end;
          points.push(end);
        }
        break;
      }
      case 'Z': {
        if (subpathStart === undefined) {
          issue('path-syntax', 'Z benötigt einen begonnenen Teilpfad.');
          break;
        }
        current = subpathStart;
        points.push(subpathStart);
        break;
      }
    }
  }
  return points;
}

function below(value: number, minimum: number): boolean {
  return value < minimum && !unitsEqual(mmToUnits(value), mmToUnits(minimum));
}

function above(value: number, maximum: number): boolean {
  return value > maximum && !unitsEqual(mmToUnits(value), mmToUnits(maximum));
}

/**
 * Prüft die tatsächlich autorisierte Geometrie gegen ihre viewBox. Pfade werden konservativ über
 * End- und Kontrollpunkte vermessen; eine Bézierkurve kann deren konvexe Hülle nicht verlassen.
 */
export function checkViewBox(drawing: Drawing): ViewBoxIssue[] {
  const issues: ViewBoxIssue[] = [];
  const width = drawing.viewBox.width;
  const height = drawing.viewBox.height;

  if (!Number.isFinite(width) || width <= 0) {
    issues.push({
      rule: 'invalid-viewbox',
      primitive: 'drawing',
      detail: `viewBox.width muss endlich und größer als 0 sein, ist aber ${width}.`,
    });
  }
  if (!Number.isFinite(height) || height <= 0) {
    issues.push({
      rule: 'invalid-viewbox',
      primitive: 'drawing',
      detail: `viewBox.height muss endlich und größer als 0 sein, ist aber ${height}.`,
    });
  }
  if (issues.length > 0) return issues;

  function visit(
    primitive: Primitive,
    path: string,
    ancestors: readonly Transform[],
    inheritedStyle?: Style,
  ): void {
    const issue = (rule: ViewBoxRule, detail: string): void => {
      issues.push({ rule, primitive: path, detail });
    };
    const style = mergeStyle(primitive.style, inheritedStyle);
    const local = primitive.transform;
    const chain = local === undefined ? ancestors : [local, ...ancestors];

    if (local?.translate !== undefined && primitive.type !== 'group') {
      issue(
        'unsupported-transform',
        `transform.translate ist nur an Gruppen belegt, nicht an "${primitive.type}".`,
      );
    }

    if (primitive.type === 'group') {
      primitive.children.forEach((child, index) =>
        visit(child, `${path}.children[${index}]`, chain, style),
      );
      return;
    }

    let points: Point[];
    if (primitive.type === 'rect') {
      if (
        !Number.isFinite(primitive.width) ||
        primitive.width < 0 ||
        !Number.isFinite(primitive.height) ||
        primitive.height < 0 ||
        (primitive.rx !== undefined && (!Number.isFinite(primitive.rx) || primitive.rx < 0))
      ) {
        issue(
          'invalid-geometry',
          'Rechteckbreite, -höhe und optionaler Eckenradius müssen endlich und nichtnegativ sein.',
        );
        return;
      }
      points = [
        [primitive.x, primitive.y],
        [primitive.x + primitive.width, primitive.y],
        [primitive.x + primitive.width, primitive.y + primitive.height],
        [primitive.x, primitive.y + primitive.height],
      ];
    } else if (primitive.type === 'circle') {
      const center = transformed([primitive.cx, primitive.cy], chain);
      const strokeWidth =
        style?.stroke !== undefined && style.stroke !== 'none'
          ? (style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM)
          : 0;
      if (
        !Number.isFinite(primitive.r) ||
        primitive.r < 0 ||
        !Number.isFinite(center[0]) ||
        !Number.isFinite(center[1]) ||
        !Number.isFinite(strokeWidth) ||
        strokeWidth < 0
      ) {
        issue(
          'invalid-geometry',
          'Kreiszentrum, Radius und Strichstärke müssen endlich; Radius und Strichstärke nichtnegativ sein.',
        );
        return;
      }
      const radius = primitive.r + strokeWidth / 2;
      const bounds: Bounds = {
        minX: center[0] - radius,
        minY: center[1] - radius,
        maxX: center[0] + radius,
        maxY: center[1] + radius,
      };
      checkBounds(bounds, issue);
      return;
    } else if (primitive.type === 'line') {
      points = [
        [primitive.x1, primitive.y1],
        [primitive.x2, primitive.y2],
      ];
    } else if (primitive.type === 'polyline') {
      points = [...primitive.points];
    } else {
      const tokenized = tokenizePath(primitive.d);
      for (const problem of tokenized.problems) issue('path-syntax', problem);
      if (tokenized.problems.length > 0) return;
      points = pathPoints(tokenized.commands, issue);
    }

    const strokeWidth =
      style?.stroke !== undefined && style.stroke !== 'none'
        ? (style.strokeWidth ?? DEFAULT_STROKE_WIDTH_MM)
        : 0;
    if (!Number.isFinite(strokeWidth) || strokeWidth < 0) {
      issue('invalid-geometry', `Strichstärke muss endlich und nichtnegativ sein, ist aber ${strokeWidth}.`);
      return;
    }
    const transformedPoints = points.map((point) => transformed(point, chain));
    const bounds = boundsOfPoints(transformedPoints, strokeWidth);
    if (bounds === undefined) {
      issue('invalid-geometry', 'Das Primitiv besitzt keine vollständig endliche Geometriehülle.');
      return;
    }
    checkBounds(bounds, issue);
  }

  function checkBounds(
    bounds: Bounds,
    issue: (rule: ViewBoxRule, detail: string) => void,
  ): void {
    const violations: string[] = [];
    if (below(bounds.minX, 0)) violations.push(`minX ${bounds.minX} mm < 0`);
    if (below(bounds.minY, 0)) violations.push(`minY ${bounds.minY} mm < 0`);
    if (above(bounds.maxX, width)) violations.push(`maxX ${bounds.maxX} mm > ${width}`);
    if (above(bounds.maxY, height)) violations.push(`maxY ${bounds.maxY} mm > ${height}`);
    if (violations.length > 0) {
      issue('outside-viewbox', `Sichtbare Hülle liegt außerhalb der viewBox: ${violations.join(', ')}.`);
    }
  }

  drawing.children.forEach((primitive, index) => visit(primitive, `children[${index}]`, []));
  return issues;
}
