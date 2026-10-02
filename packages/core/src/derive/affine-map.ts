import type { Primitive, Transform } from '@einsatzzeichen/schema';
import { tokenizePath } from '../path-commands.js';

/**
 * Gleichmäßige Abbildung `p → p · scale + (dx | dy)` für fertige Primitive: das Werkzeug, mit dem
 * eine Ableitung eine vermessene Zeichnung an eine andere Stelle setzt oder verkleinert.
 *
 * **Strichstärken bleiben stehen.** Wo der Bestand eine Zeichnung verkleinert (die Marken an der
 * Wolke aus 5.8.7, die eingepassten Fähigkeiten), behält er den Strich von 0,5 mm; eine
 * Abbildung, die ihn mitskalierte, erzeugte eine Strichstärke, die keine Referenz zeigt.
 *
 * Pfade werden über `tokenizePath` abgebildet, also nur in den absoluten Kommandos der
 * Autorenkonvention. Ein Pfad außerhalb davon wirft, statt still verzerrt zu werden.
 */
export interface AffineMap {
  readonly scale: number;
  readonly dx: number;
  readonly dy: number;
}

const round4 = (value: number): number => Math.round(value * 10000) / 10000;

function mapX(m: AffineMap, x: number): number {
  return round4(x * m.scale + m.dx);
}

function mapY(m: AffineMap, y: number): number {
  return round4(y * m.scale + m.dy);
}

function mapPath(m: AffineMap, d: string): string {
  const { commands, problems } = tokenizePath(d);
  if (problems.length > 0) throw new Error(`Pfad nicht abbildbar: ${problems.join('; ')}`);
  return commands
    .map(({ command, numbers }) => {
      if (command === 'Z') return 'Z';
      if (command === 'H') return `H ${mapX(m, numbers[0] as number)}`;
      if (command === 'V') return `V ${mapY(m, numbers[0] as number)}`;
      const mapped = numbers.map((value, index) => (index % 2 === 0 ? mapX(m, value) : mapY(m, value)));
      return `${command} ${mapped.join(' ')}`;
    })
    .join(' ');
}

/**
 * Eine Drehung dreht um ihren eigenen Mittelpunkt; der wandert mit. Eine Verschiebung steht nur
 * an Gruppen und wird dort zusammengesetzt (siehe `mapPrimitive`).
 */
function mapRotation(m: AffineMap, transform: Transform | undefined): Transform | undefined {
  if (transform?.rotate === undefined) return transform;
  return {
    ...transform,
    rotate: { ...transform.rotate, cx: mapX(m, transform.rotate.cx), cy: mapY(m, transform.rotate.cy) },
  };
}

/** Bildet ein Primitiv ab; Gruppen samt ihrer Kinder. */
export function mapPrimitive(m: AffineMap, primitive: Primitive): Primitive {
  switch (primitive.type) {
    case 'group': {
      // Kindkoordinaten c liegen in der Gruppe um t verschoben: (c + t) · s + d = c · s + (t · s + d).
      // Die Kinder werden also nur skaliert, die Verschiebung sammelt sich an der Gruppe. Eine
      // Drehung an der Gruppe ist im Bestand nicht belegt und wird wie an jedem Primitiv behandelt.
      const translate = primitive.transform?.translate ?? { dxMm: 0, dyMm: 0 };
      const childMap: AffineMap = { scale: m.scale, dx: 0, dy: 0 };
      return {
        ...primitive,
        children: primitive.children.map((child) => mapPrimitive(childMap, child)),
        transform: {
          ...mapRotation(m, primitive.transform),
          translate: {
            dxMm: round4(translate.dxMm * m.scale + m.dx),
            dyMm: round4(translate.dyMm * m.scale + m.dy),
          },
        },
      };
    }
    case 'line':
      return {
        ...primitive,
        x1: mapX(m, primitive.x1),
        y1: mapY(m, primitive.y1),
        x2: mapX(m, primitive.x2),
        y2: mapY(m, primitive.y2),
      };
    case 'polyline':
      return { ...primitive, points: primitive.points.map(([x, y]) => [mapX(m, x), mapY(m, y)] as const) };
    case 'circle':
      return {
        ...primitive,
        cx: mapX(m, primitive.cx),
        cy: mapY(m, primitive.cy),
        r: round4(primitive.r * m.scale),
        ...(primitive.transform === undefined ? {} : { transform: mapRotation(m, primitive.transform) }),
      };
    case 'rect':
      return {
        ...primitive,
        x: mapX(m, primitive.x),
        y: mapY(m, primitive.y),
        width: round4(primitive.width * m.scale),
        height: round4(primitive.height * m.scale),
        ...(primitive.rx === undefined ? {} : { rx: round4(primitive.rx * m.scale) }),
        ...(primitive.transform === undefined ? {} : { transform: mapRotation(m, primitive.transform) }),
      };
    case 'path':
      return {
        ...primitive,
        d: mapPath(m, primitive.d),
        ...(primitive.transform === undefined ? {} : { transform: mapRotation(m, primitive.transform) }),
      };
    case 'text':
      return {
        ...primitive,
        x: mapX(m, primitive.x),
        y: mapY(m, primitive.y),
        sizeMm: round4(primitive.sizeMm * m.scale),
        boxMm: {
          xMm: mapX(m, primitive.boxMm.xMm),
          yMm: mapY(m, primitive.boxMm.yMm),
          widthMm: round4(primitive.boxMm.widthMm * m.scale),
          heightMm: round4(primitive.boxMm.heightMm * m.scale),
        },
        ...(primitive.minRenderPx === undefined || m.scale === 1
          ? {}
          : { minRenderPx: Math.ceil(primitive.minRenderPx / m.scale) }),
        ...(primitive.transform === undefined ? {} : { transform: mapRotation(m, primitive.transform) }),
      };
  }
}
