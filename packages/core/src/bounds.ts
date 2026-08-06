import type { Point, Primitive, Rotation } from '@einsatzzeichen/schema';

/** Achsparallele Hülle in Millimetern. */
export interface BoundsMm {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

const EMPTY_BOUNDS: BoundsMm = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

function rotatePoint([x, y]: Point, rotate: Rotation): Point {
  const rad = (rotate.angle * Math.PI) / 180;
  const dx = x - rotate.cx;
  const dy = y - rotate.cy;
  return [
    rotate.cx + dx * Math.cos(rad) - dy * Math.sin(rad),
    rotate.cy + dx * Math.sin(rad) + dy * Math.cos(rad),
  ];
}

function rotatePoints(points: readonly Point[], rotate: Rotation | undefined): readonly Point[] {
  return rotate ? points.map((point) => rotatePoint(point, rotate)) : points;
}

function fromPoints(points: readonly Point[]): BoundsMm {
  if (points.length === 0) {
    throw new Error('bounds: fromPoints() erwartet mindestens einen Punkt.');
  }
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

function merge(list: readonly BoundsMm[]): BoundsMm {
  if (list.length === 0) {
    throw new Error('bounds: merge() erwartet mindestens eine Hülle.');
  }
  return {
    minX: Math.min(...list.map((b) => b.minX)),
    minY: Math.min(...list.map((b) => b.minY)),
    maxX: Math.max(...list.map((b) => b.maxX)),
    maxY: Math.max(...list.map((b) => b.maxY)),
  };
}

/**
 * Hülle eines Primitivs in Millimetern, oder `undefined`, wenn das Primitiv keine vergleichbare
 * Ausdehnung hat (ein Pfad, oder eine Gruppe, die — auch verschachtelt — nur aus solchen
 * Primitiven besteht). `undefined` wird strukturell weitergereicht, nicht anhand der
 * resultierenden Zahlenwerte erkannt: so wird eine echte Null-Ausdehnung (z. B. ein entartetes
 * Rechteck der Breite 0 bei x=0) nie mit "keine Ausdehnung" verwechselt — nur der Primitivtyp
 * entscheidet, nie der berechnete Wert.
 *
 * Drehung wird auf die formdefinierenden Punkte jedes Primitivs angewendet, nicht auf die
 * Ecken seiner (unrotierten) achsparallelen Hülle — sonst wäre das Ergebnis nur für `rect`
 * exakt und für `circle`, `line` und `polyline` zu groß.
 *
 * Eine Gruppe mit `transform.translate` verschiebt die Hülle ihrer Kinder; ist diese nicht
 * vergleichbar, bleibt sie es auch nach der Verschiebung.
 */
function rawBoundsOfMm(primitive: Primitive): BoundsMm | undefined {
  const rotate = primitive.transform?.rotate;
  const translate = primitive.transform?.translate;
  if (translate && primitive.type !== 'group') {
    // Dasselbe Muster wie die Gruppendrehung unten: `translate` ist nur an Gruppen belegt
    // (compose() umschließt die Piktogramme mit genau einer). An einem Einzelprimitiv würde
    // diese Hüllberechnung es still ignorieren, während beide Renderer es anwenden — aus
    // derselben IR entstünden zwei verschiedene Aussagen. Deshalb explizit ablehnen.
    throw new Error(
      'boundsOfMm: transform.translate ist nur an Gruppen belegt, nicht an ' +
        `"${primitive.type}".`,
    );
  }

  switch (primitive.type) {
    case 'rect': {
      const points: Point[] = [
        [primitive.x, primitive.y],
        [primitive.x + primitive.width, primitive.y],
        [primitive.x + primitive.width, primitive.y + primitive.height],
        [primitive.x, primitive.y + primitive.height],
      ];
      return fromPoints(rotatePoints(points, rotate));
    }
    case 'circle': {
      const center: Point = rotate
        ? rotatePoint([primitive.cx, primitive.cy], rotate)
        : [primitive.cx, primitive.cy];
      const [cx, cy] = center;
      return {
        minX: cx - primitive.r,
        minY: cy - primitive.r,
        maxX: cx + primitive.r,
        maxY: cy + primitive.r,
      };
    }
    case 'line': {
      const points: Point[] = [
        [primitive.x1, primitive.y1],
        [primitive.x2, primitive.y2],
      ];
      return fromPoints(rotatePoints(points, rotate));
    }
    case 'polyline':
      return fromPoints(rotatePoints(primitive.points, rotate));
    case 'path':
      // Piktogramme werden nicht geometrisch verglichen — keine vergleichbare Ausdehnung.
      return undefined;
    case 'group': {
      if (rotate) {
        // Eine korrekte Hülle müsste die Drehung in die Geometrie jedes Kindes durchrechnen.
        // Das ist im aktuellen Referenzbestand kein belegter Fall (keine Gruppe trägt eine
        // eigene Drehung) — statt das still anzunähern, lehnen wir es explizit ab.
        throw new Error(
          'boundsOfMm: Drehung von Gruppen wird nicht unterstützt — dieser Fall ist im ' +
            'aktuellen Referenzbestand nicht belegt.',
        );
      }
      const childBounds = primitive.children
        .map(rawBoundsOfMm)
        .filter((bounds): bounds is BoundsMm => bounds !== undefined);
      if (childBounds.length === 0) return undefined;
      const merged = merge(childBounds);
      if (!translate) return merged;
      return {
        minX: merged.minX + translate.dxMm,
        minY: merged.minY + translate.dyMm,
        maxX: merged.maxX + translate.dxMm,
        maxY: merged.maxY + translate.dyMm,
      };
    }
  }
}

/**
 * Hülle eines Primitivs in Millimetern, inklusive Drehung.
 * Pfad-Primitive (und Gruppen, die — auch verschachtelt — nur solche enthalten) liefern die
 * leere Hülle {0,0,0,0} — Piktogramme werden nicht geometrisch verglichen. Eine leere Gruppe
 * unter Geschwistern verfälscht deren Hülle nicht: die Nichtvergleichbarkeit wird herausgefiltert,
 * bevor Geschwister zusammengeführt werden (siehe `rawBoundsOfMm`).
 */
export function boundsOfMm(primitive: Primitive): BoundsMm {
  return rawBoundsOfMm(primitive) ?? EMPTY_BOUNDS;
}

/**
 * Verschiebt ein Primitiv senkrecht um `deltaMm`, ohne seine Größe zu ändern. Verwendet sowohl
 * für die Körperplatzierung (`layout/profiles.ts`) als auch für Piktogramme, die der
 * Körpermitte folgen müssen (`compose.ts`) — eine Verschiebung entlang der y-Achse ist in
 * beiden Fällen dieselbe Operation auf derselben Primitivgeometrie.
 *
 * Pfad-Primitive haben keine strukturierte Punktgeometrie (ihre Koordinaten liegen im
 * `d`-String) und werden deshalb nicht verschoben, sondern lehnen explizit ab — ein still
 * falsch (nicht) verschobenes Pfad-Primitiv wäre schwerer zu bemerken als ein Fehler.
 */
export function shiftY(primitive: Primitive, deltaMm: number): Primitive {
  if (primitive.transform?.rotate && primitive.type !== 'group' && primitive.type !== 'path') {
    // Eine Verschiebung träfe nur die Koordinate, nicht das Rotationszentrum
    // (`transform.rotate.cx/cy`) — das Primitiv würde verschoben, aber weiterhin um das alte
    // Zentrum gedreht: still falsch. Genau wie der `path`-Zweig unten lehnen wir das deshalb
    // explizit ab, statt es anzunähern. `group` bleibt hier bewusst außen vor: eine gedrehte
    // Gruppe ist im aktuellen Referenzbestand kein belegter Fall (siehe `boundsOfMm`, das
    // Drehung von Gruppen ebenfalls ablehnt) und war nicht Teil dieses Befunds.
    throw new Error(
      'shiftY: gedrehte Primitive können nicht verschoben werden, ohne auch das ' +
        'Rotationszentrum (transform.rotate.cx/cy) zu verschieben.',
    );
  }

  switch (primitive.type) {
    case 'rect':
      return { ...primitive, y: primitive.y + deltaMm };
    case 'circle':
      return { ...primitive, cy: primitive.cy + deltaMm };
    case 'line':
      return { ...primitive, y1: primitive.y1 + deltaMm, y2: primitive.y2 + deltaMm };
    case 'polyline':
      return { ...primitive, points: primitive.points.map(([x, y]) => [x, y + deltaMm] as const) };
    case 'group':
      return { ...primitive, children: primitive.children.map((c) => shiftY(c, deltaMm)) };
    case 'path':
      throw new Error(
        'shiftY: Pfad-Primitive haben keine strukturierte Punktgeometrie und können nicht ' +
          'verschoben werden.',
      );
  }
}
