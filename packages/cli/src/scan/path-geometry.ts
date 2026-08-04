import { TOLERANCE_UNITS } from '@einsatzzeichen/schema';

/** Alle Werte in SVG-Einheiten, so wie sie in der Referenzdatei stehen. */
export interface SubpathBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  /**
   * true, wenn dieser Teilpfad ein achsparalleles Rechteck ist: jedes Segment
   * (einschließlich des impliziten Schlusssegments von `Z`) ist waagerecht oder
   * senkrecht, UND die Menge der verschiedenen besuchten Punkte besteht genau aus den
   * vier Ecken seiner eigenen Hülle. Beide Bedingungen zusammen sind nötig — nur die
   * erste ließe Treppen- und L-Formen durch (alle Segmente achsparallel, aber mehr als
   * vier bzw. hüllenfremde Punkte), nur die zweite ließe gedrehte Quadrate durch (vier
   * Punkte, aber nicht die Hüllenecken).
   */
  isAxisAlignedRect: boolean;
}

export interface Ring {
  x: number;
  y: number;
  width: number;
  height: number;
  strokeWidth: number;
}

const RECTILINEAR = new Set(['M', 'm', 'L', 'l', 'H', 'h', 'V', 'v', 'Z', 'z']);

interface Cursor {
  x: number;
  y: number;
}

/** Laufende Hülle eines Teilpfads, unrundiert. Ergänzt beim Abschluss um `isAxisAlignedRect`. */
interface RunningBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Vergleicht zwei Koordinaten mit der projektweiten Toleranz aus `@einsatzzeichen/schema`
 * (0.01 SVG-Einheiten). Nötig, weil Referenzwerte auf drei Dezimalstellen exportiert sind
 * und relative Kommandos (`h`/`v`) ihr Ziel unabhängig von H/V- oder M-Koordinaten
 * berechnen — ein exakter Vergleich schlüge an diesem Exportrauschen fehl.
 */
function isClose(a: number, b: number): boolean {
  return Math.abs(a - b) <= TOLERANCE_UNITS;
}

function samePoint(a: Cursor, b: Cursor): boolean {
  return isClose(a.x, b.x) && isClose(a.y, b.y);
}

/** Ein Segment ist achsparallel, wenn sich nur x oder nur y ändert (oder gar nichts). */
function isAxisAlignedSegment(from: Cursor, to: Cursor): boolean {
  return isClose(from.x, to.x) || isClose(from.y, to.y);
}

function addDistinctPoint(points: Cursor[], point: Cursor): void {
  if (!points.some((p) => samePoint(p, point))) points.push({ x: point.x, y: point.y });
}

/**
 * Entscheidet, ob ein Teilpfad ein achsparalleles Rechteck ist. Siehe Doku an
 * `SubpathBounds.isAxisAlignedRect` für die Begründung der beiden Bedingungen.
 */
function isAxisAlignedRect(points: Cursor[], allSegmentsAligned: boolean, bounds: RunningBounds): boolean {
  if (!allSegmentsAligned) return false;

  const distinct: Cursor[] = [];
  for (const point of points) addDistinctPoint(distinct, point);
  if (distinct.length !== 4) return false;

  const corners: Cursor[] = [
    { x: bounds.minX, y: bounds.minY },
    { x: bounds.minX, y: bounds.maxY },
    { x: bounds.maxX, y: bounds.minY },
    { x: bounds.maxX, y: bounds.maxY },
  ];
  return corners.every((corner) => distinct.some((point) => samePoint(point, corner)));
}

/**
 * Zerlegt einen ausschließlich geradlinigen Pfad in die Bounding-Boxen seiner Teilpfade.
 * Gibt null zurück, sobald ein Kurven- oder Bogenkommando auftritt — solche Pfade sind
 * Piktogramme und werden nicht geometrisch verglichen.
 */
export function parseRectilinearPath(d: string): SubpathBounds[] | null {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!tokens) return null;

  const subpaths: SubpathBounds[] = [];
  const cursor: Cursor = { x: 0, y: 0 };
  const start: Cursor = { x: 0, y: 0 };
  let current: RunningBounds | null = null;
  let currentPoints: Cursor[] = [];
  let currentAxisAligned = true;
  let command = '';
  let index = 0;

  const push = (): void => {
    if (current) {
      subpaths.push({
        minX: round(current.minX),
        minY: round(current.minY),
        maxX: round(current.maxX),
        maxY: round(current.maxY),
        isAxisAlignedRect: isAxisAlignedRect(currentPoints, currentAxisAligned, current),
      });
      current = null;
    }
    currentPoints = [];
    currentAxisAligned = true;
  };

  const extend = (): void => {
    if (!current) {
      current = { minX: cursor.x, minY: cursor.y, maxX: cursor.x, maxY: cursor.y };
      return;
    }
    current.minX = Math.min(current.minX, cursor.x);
    current.minY = Math.min(current.minY, cursor.y);
    current.maxX = Math.max(current.maxX, cursor.x);
    current.maxY = Math.max(current.maxY, cursor.y);
  };

  /** Zeichnet ein Segment vom bisherigen Cursor zum aktuellen nach, für die Rechteckprüfung. */
  const trackSegment = (from: Cursor): void => {
    if (!isAxisAlignedSegment(from, cursor)) currentAxisAligned = false;
    addDistinctPoint(currentPoints, cursor);
  };

  const next = (): number => Number(tokens[index++]);

  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) break;

    if (/^[A-Za-z]$/.test(token)) {
      if (!RECTILINEAR.has(token)) return null;
      command = token;
      index += 1;
      if (command === 'Z' || command === 'z') {
        const before: Cursor = { x: cursor.x, y: cursor.y };
        cursor.x = start.x;
        cursor.y = start.y;
        if (current) trackSegment(before);
        push();
      }
      continue;
    }

    const before: Cursor = { x: cursor.x, y: cursor.y };

    switch (command) {
      case 'M':
        push();
        cursor.x = next();
        cursor.y = next();
        start.x = cursor.x;
        start.y = cursor.y;
        extend();
        addDistinctPoint(currentPoints, cursor);
        command = 'L';
        break;
      case 'm':
        push();
        cursor.x += next();
        cursor.y += next();
        start.x = cursor.x;
        start.y = cursor.y;
        extend();
        addDistinctPoint(currentPoints, cursor);
        command = 'l';
        break;
      case 'L':
        cursor.x = next();
        cursor.y = next();
        extend();
        trackSegment(before);
        break;
      case 'l':
        cursor.x += next();
        cursor.y += next();
        extend();
        trackSegment(before);
        break;
      case 'H':
        cursor.x = next();
        extend();
        trackSegment(before);
        break;
      case 'h':
        cursor.x += next();
        extend();
        trackSegment(before);
        break;
      case 'V':
        cursor.y = next();
        extend();
        trackSegment(before);
        break;
      case 'v':
        cursor.y += next();
        extend();
        trackSegment(before);
        break;
      default:
        return null;
    }
  }

  push();
  return subpaths;
}

/**
 * Leitet aus einem Außen-/Innenring-Paar die Mittellinie und die Strichstärke zurück.
 * Beispiel 1.1: außen 86.457 breit, innen 83.622 — Differenz 2.835, also 1.4175 Strichstärke.
 *
 * Liefert nur dann ein Ergebnis, wenn beide Teilpfade achsparallele Rechtecke sind — nur
 * dafür ist „Mittellinie aus gemittelten Hüllen" überhaupt korrekt. Bei schrägen Kanten
 * (Dreiecke, gedrehte Quadrate) oder bei Treppen-/L-Formen sind die Innenkanten ungleich
 * weit eingerückt; ein gemitteltes Ergebnis sähe plausibel aus, wäre aber falsch.
 */
export function deriveRing(subpaths: SubpathBounds[]): Ring | null {
  if (subpaths.length !== 2) return null;
  const [outer, inner] = subpaths;
  if (!outer || !inner) return null;
  if (!outer.isAxisAlignedRect || !inner.isAxisAlignedRect) return null;

  const contains =
    inner.minX >= outer.minX &&
    inner.minY >= outer.minY &&
    inner.maxX <= outer.maxX &&
    inner.maxY <= outer.maxY;
  if (!contains) return null;

  const outerWidth = outer.maxX - outer.minX;
  const innerWidth = inner.maxX - inner.minX;
  const outerHeight = outer.maxY - outer.minY;
  const innerHeight = inner.maxY - inner.minY;

  return {
    x: (outer.minX + inner.minX) / 2,
    y: (outer.minY + inner.minY) / 2,
    width: (outerWidth + innerWidth) / 2,
    height: (outerHeight + innerHeight) / 2,
    strokeWidth: (outerWidth - innerWidth + (outerHeight - innerHeight)) / 4,
  };
}
