/** Alle Werte in SVG-Einheiten, so wie sie in der Referenzdatei stehen. */
export interface SubpathBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
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

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
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
  let current: SubpathBounds | null = null;
  let command = '';
  let index = 0;

  const push = (): void => {
    if (current) {
      subpaths.push({
        minX: round(current.minX),
        minY: round(current.minY),
        maxX: round(current.maxX),
        maxY: round(current.maxY),
      });
      current = null;
    }
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

  const next = (): number => Number(tokens[index++]);

  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) break;

    if (/^[A-Za-z]$/.test(token)) {
      if (!RECTILINEAR.has(token)) return null;
      command = token;
      index += 1;
      if (command === 'Z' || command === 'z') {
        cursor.x = start.x;
        cursor.y = start.y;
        push();
      }
      continue;
    }

    switch (command) {
      case 'M':
        push();
        cursor.x = next();
        cursor.y = next();
        start.x = cursor.x;
        start.y = cursor.y;
        extend();
        command = 'L';
        break;
      case 'm':
        push();
        cursor.x += next();
        cursor.y += next();
        start.x = cursor.x;
        start.y = cursor.y;
        extend();
        command = 'l';
        break;
      case 'L':
        cursor.x = next();
        cursor.y = next();
        extend();
        break;
      case 'l':
        cursor.x += next();
        cursor.y += next();
        extend();
        break;
      case 'H':
        cursor.x = next();
        extend();
        break;
      case 'h':
        cursor.x += next();
        extend();
        break;
      case 'V':
        cursor.y = next();
        extend();
        break;
      case 'v':
        cursor.y += next();
        extend();
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
 */
export function deriveRing(subpaths: SubpathBounds[]): Ring | null {
  if (subpaths.length !== 2) return null;
  const [outer, inner] = subpaths;
  if (!outer || !inner) return null;

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
