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

/**
 * Kommandos, für die `parsePathBounds` eine Hülle bestimmen kann. `A`/`a` fehlen bewusst: der
 * Referenzbestand enthält keinen einzigen Bogen (gezählt über alle 661 Dateien und alle vier
 * Ebenen — vorkommende Kommandos sind `M H V Z L C S` und ihre relativen Formen), und eine
 * Bogenzerlegung, die nie an einer Referenzdatei läuft, wäre unbelegter Kode. Ein Bogen liefert
 * deshalb `null` und damit denselben lauten Ausfall wie ein unbekanntes Kommando.
 */
const BOUNDABLE = new Set([
  'M', 'm', 'L', 'l', 'H', 'h', 'V', 'v', 'C', 'c', 'S', 's', 'Q', 'q', 'T', 't', 'Z', 'z',
]);

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
        if (!Number.isFinite(cursor.x) || !Number.isFinite(cursor.y)) return null;
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
        if (!Number.isFinite(cursor.x) || !Number.isFinite(cursor.y)) return null;
        start.x = cursor.x;
        start.y = cursor.y;
        extend();
        addDistinctPoint(currentPoints, cursor);
        command = 'l';
        break;
      case 'L':
        cursor.x = next();
        cursor.y = next();
        if (!Number.isFinite(cursor.x) || !Number.isFinite(cursor.y)) return null;
        extend();
        trackSegment(before);
        break;
      case 'l':
        cursor.x += next();
        cursor.y += next();
        if (!Number.isFinite(cursor.x) || !Number.isFinite(cursor.y)) return null;
        extend();
        trackSegment(before);
        break;
      case 'H':
        cursor.x = next();
        if (!Number.isFinite(cursor.x)) return null;
        extend();
        trackSegment(before);
        break;
      case 'h':
        cursor.x += next();
        if (!Number.isFinite(cursor.x)) return null;
        extend();
        trackSegment(before);
        break;
      case 'V':
        cursor.y = next();
        if (!Number.isFinite(cursor.y)) return null;
        extend();
        trackSegment(before);
        break;
      case 'v':
        cursor.y += next();
        if (!Number.isFinite(cursor.y)) return null;
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

/** Hülle eines Pfads in SVG-Einheiten. Anders als `SubpathBounds` ohne Teilpfadzerlegung. */
export interface PathBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Nullstellen der Ableitung einer Kubik in **einer** Achse, auf das offene Intervall (0;1)
 * beschränkt. Die Endpunkte stehen ohnehin als Ankerpunkte in der Hülle; nur die inneren
 * Extrema fehlen ihr.
 *
 * Das ist der Unterschied zwischen einer analytischen Hülle und einer abgetasteten: eine
 * Abtastung verfehlt den Scheitel um einen Betrag, der von der Schrittweite abhängt und den
 * niemand angeben kann. Bei 1.4 Luftfahrzeug liegt der Scheitel exakt auf t = 0,5, bei den
 * Deckkurven der Landfahrzeuge nicht — dort trägt die Rechnung.
 */
function cubicExtremaParameters(p0: number, p1: number, p2: number, p3: number): number[] {
  const a = -p0 + 3 * p1 - 3 * p2 + p3;
  const b = 2 * (p0 - 2 * p1 + p2);
  const c = -p0 + p1;
  const result: number[] = [];
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) > 1e-12) result.push(-c / b);
  } else {
    const discriminant = b * b - 4 * a * c;
    if (discriminant >= 0) {
      const root = Math.sqrt(discriminant);
      result.push((-b + root) / (2 * a), (-b - root) / (2 * a));
    }
  }
  return result.filter((t) => t > 0 && t < 1);
}

function cubicAt(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

/**
 * Hülle eines **beliebigen** Pfads, Kurven eingeschlossen — die Ergänzung zu
 * `parseRectilinearPath`, das bei der ersten Kurve `null` liefert und den Pfad damit
 * unvermessen lässt.
 *
 * Kubische Segmente gehen mit ihren **analytischen** Extrema ein (Nullstellen der
 * Ableitungsquadratik je Achse), quadratische verlustfrei in Kubiken überführt. Es wird nicht
 * abgetastet: eine Abtastung liefert eine Hülle, die um einen unbekannten Betrag zu klein ist,
 * und genau solche Zahlen darf dieses Projekt nicht in ein Kennwertartefakt schreiben.
 *
 * Geeicht am Körper von `1.9 Gebiet` (zwanzig echte Kurvenextrema): diese Rechnung liefert
 * 1,5201535819656435 / 3,2298000848139514 / 31 / 28,32344610585691 mm und ist damit
 * ziffernidentisch mit `boundsOfMm` aus `core` — zwei unabhängig geschriebene Implementierungen
 * auf demselben Ergebnis. Der Vergleich steht in `path-geometry.test.ts`.
 *
 * Liefert `null` bei einem Kommando außerhalb von `BOUNDABLE` (in der Praxis: einem Bogen) und
 * bei einem leeren Pfad.
 */
export function parsePathBounds(d: string): PathBounds | null {
  const tokens = d.match(/[A-Za-z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi);
  if (!tokens) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  let lastCubicControl: [number, number] | null = null;
  let lastQuadraticControl: [number, number] | null = null;
  let command = '';
  let index = 0;
  let sawPoint = false;

  const next = (): number => Number(tokens[index++]);
  const include = (px: number, py: number): void => {
    minX = Math.min(minX, px);
    maxX = Math.max(maxX, px);
    minY = Math.min(minY, py);
    maxY = Math.max(maxY, py);
    sawPoint = true;
  };
  const cubic = (x1: number, y1: number, x2: number, y2: number, tx: number, ty: number): void => {
    for (const t of cubicExtremaParameters(x, x1, x2, tx)) include(cubicAt(x, x1, x2, tx, t), y);
    for (const t of cubicExtremaParameters(y, y1, y2, ty)) include(x, cubicAt(y, y1, y2, ty, t));
    include(tx, ty);
  };

  while (index < tokens.length) {
    const token = tokens[index];
    if (token === undefined) break;
    if (/^[A-Za-z]$/.test(token)) {
      if (!BOUNDABLE.has(token)) return null;
      command = token;
      index += 1;
      if (command === 'Z' || command === 'z') {
        x = startX;
        y = startY;
        lastCubicControl = null;
        lastQuadraticControl = null;
      }
      continue;
    }

    switch (command) {
      case 'M':
      case 'm': {
        const relative = command === 'm';
        x = (relative ? x : 0) + next();
        y = (relative ? y : 0) + next();
        startX = x;
        startY = y;
        include(x, y);
        command = relative ? 'l' : 'L';
        lastCubicControl = null;
        lastQuadraticControl = null;
        break;
      }
      case 'L':
      case 'l': {
        const relative = command === 'l';
        x = (relative ? x : 0) + next();
        y = (relative ? y : 0) + next();
        include(x, y);
        lastCubicControl = null;
        lastQuadraticControl = null;
        break;
      }
      case 'H':
      case 'h': {
        x = (command === 'h' ? x : 0) + next();
        include(x, y);
        lastCubicControl = null;
        lastQuadraticControl = null;
        break;
      }
      case 'V':
      case 'v': {
        y = (command === 'v' ? y : 0) + next();
        include(x, y);
        lastCubicControl = null;
        lastQuadraticControl = null;
        break;
      }
      case 'C':
      case 'c': {
        const relative = command === 'c';
        const x1 = (relative ? x : 0) + next();
        const y1 = (relative ? y : 0) + next();
        const x2 = (relative ? x : 0) + next();
        const y2 = (relative ? y : 0) + next();
        const tx = (relative ? x : 0) + next();
        const ty = (relative ? y : 0) + next();
        cubic(x1, y1, x2, y2, tx, ty);
        x = tx;
        y = ty;
        lastCubicControl = [x2, y2];
        lastQuadraticControl = null;
        break;
      }
      case 'S':
      case 's': {
        const relative = command === 's';
        // Der erste Kontrollpunkt ist die Spiegelung des zweiten des Vorgängersegments am
        // aktuellen Punkt; ohne Kurvenvorgänger fällt er auf den aktuellen Punkt (SVG 1.1).
        const x1 = lastCubicControl ? 2 * x - lastCubicControl[0] : x;
        const y1 = lastCubicControl ? 2 * y - lastCubicControl[1] : y;
        const x2 = (relative ? x : 0) + next();
        const y2 = (relative ? y : 0) + next();
        const tx = (relative ? x : 0) + next();
        const ty = (relative ? y : 0) + next();
        cubic(x1, y1, x2, y2, tx, ty);
        x = tx;
        y = ty;
        lastCubicControl = [x2, y2];
        lastQuadraticControl = null;
        break;
      }
      case 'Q':
      case 'q':
      case 'T':
      case 't': {
        const relative = command === 'q' || command === 't';
        const smooth = command === 'T' || command === 't';
        let qx: number;
        let qy: number;
        if (smooth) {
          qx = lastQuadraticControl ? 2 * x - lastQuadraticControl[0] : x;
          qy = lastQuadraticControl ? 2 * y - lastQuadraticControl[1] : y;
        } else {
          qx = (relative ? x : 0) + next();
          qy = (relative ? y : 0) + next();
        }
        const tx = (relative ? x : 0) + next();
        const ty = (relative ? y : 0) + next();
        // Quadratisch nach kubisch, verlustfrei: die Kontrollpunkte liegen auf zwei Dritteln
        // der Strecke von den Endpunkten zum quadratischen Kontrollpunkt.
        cubic(
          x + (2 / 3) * (qx - x),
          y + (2 / 3) * (qy - y),
          tx + (2 / 3) * (qx - tx),
          ty + (2 / 3) * (qy - ty),
          tx,
          ty,
        );
        x = tx;
        y = ty;
        lastQuadraticControl = [qx, qy];
        lastCubicControl = null;
        break;
      }
      default:
        return null;
    }
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  }

  if (!sawPoint) return null;
  // **Ungerundet**, anders als `parseRectilinearPath`: dort sind die Werte Ankerkoordinaten aus
  // der Datei und drei Nachkommastellen geben sie exakt wieder; ein Kurvenextremum ist dagegen
  // eine gerechnete Zahl. Wer sie hier rundete, verlöre die Eichung gegen `boundsOfMm` an der
  // fünfzehnten Stelle — und damit den einzigen Beleg, dass zwei unabhängige Implementierungen
  // dasselbe rechnen. Gerundet wird beim Verbraucher (`extract.ts` auf drei Millimeterstellen).
  return { minX, minY, maxX, maxY };
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
