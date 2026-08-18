import { unitsToMm } from '@einsatzzeichen/schema';
import {
  deriveRing,
  parsePathBounds,
  parseRectilinearPath,
  type PathBounds,
  type SubpathBounds,
} from './path-geometry.js';

/** Achsparallele Hülle in Millimetern, Drehung bereits eingerechnet. */
export interface BoundsMm {
  minXMm: number;
  minYMm: number;
  maxXMm: number;
  maxYMm: number;
}

/**
 * Nach Aussagekraft geordnet:
 * `ring`    — Mittellinie aus einem Außen-/Innenring-Paar, exakt
 * `bounds`  — Füllfläche (Polygon oder Füllpfad der Körperebene), exakt
 * `rect`    — Füllrechteck, gegebenenfalls gedreht
 * `circle`  — Füllkreis
 * `outline` — Außenkante eines Pfads mit mehr als zwei Teilpfaden, um halbe Strichstärke zu groß
 */
export type ShapeKind = 'ring' | 'bounds' | 'rect' | 'circle' | 'outline';

export interface FingerprintShape {
  kind: ShapeKind;
  boundsMm: BoundsMm;
  /** Nur bei `ring`: aus dem Ringabstand zurückgerechnete Strichstärke. */
  strokeWidthMm?: number;
  rotate?: number;
  fill?: string;
}

export interface Fingerprint {
  asset: string;
  viewBox: { width: number; height: number };
  layers: string[];
  fills: string[];
  shapes: FingerprintShape[];
  curvedPaths: number;
}

const LAYER_LABELS: Record<string, string> = {
  'Grundfläche': 'Grundfläche',
  'Flächige_Fülung': 'Flächige_Fülung',
  'Takt_Zeichen__x28_umgewandelt_x29_': 'Takt_Zeichen (umgewandelt)',
  'Takt._Zeichen__x28_Typo_x29_': 'Takt. Zeichen (Typo)',
};

/**
 * Die Ebene, die in der Referenz die **Körperfläche** trägt. Die übrigen drei Ebenen tragen die
 * transparente Grundfläche, die zu Flächen umgewandelte Strichzeichnung und die zu Kurven
 * umgewandelte Typografie — keine davon ist ein Körper.
 *
 * Der Extraktor arbeitete bis hierher ohne jede Ebenentrennung: alle Schleifen liefen über das
 * ganze Dokument. Für Rechtecke, Kreise, Polygone und geradlinige Pfade bleibt das so; nur der
 * neue Körperfüllpfad ist auf diese eine Ebene beschränkt, weil er sonst Glyphenkurven der
 * Typo-Ebene als Körper ausgäbe.
 */
const BODY_FILL_LAYER = 'Flächige_Fülung';

/** Inhalt der obersten `<g id="…">`-Ebene mit diesem Namen, samt Versatz im Dokument. */
function layerContent(svg: string, id: string): { text: string; offset: number } | null {
  const marks: Array<{ id: string; start: number; bodyStart: number }> = [];
  for (const match of svg.matchAll(/<g id="([^"]+)">/g)) {
    const name = match[1];
    if (name === undefined || match.index === undefined) continue;
    marks.push({ id: name, start: match.index, bodyStart: match.index + match[0].length });
  }
  for (let index = 0; index < marks.length; index += 1) {
    const mark = marks[index];
    if (mark === undefined || mark.id !== id) continue;
    const nextMark = marks[index + 1];
    const end = nextMark !== undefined ? nextMark.start : svg.lastIndexOf('</svg>');
    return { text: svg.slice(mark.bodyStart, end < 0 ? svg.length : end), offset: mark.bodyStart };
  }
  return null;
}

/** Hülle eines gefüllten Elements der Körperebene, in SVG-Einheiten. */
interface LayerShape {
  /** Versatz des Elements im Gesamtdokument — die Identität, an der die Pfadschleife wiedererkennt. */
  offset: number;
  bounds: PathBounds;
  /** Gekrümmter Pfad: der einzige Kandidat für den Körper (alles andere ist schon erfasst). */
  curvedPath: boolean;
  fill: string;
}

function containsAll(outer: PathBounds, shapes: readonly LayerShape[]): boolean {
  // Toleranz der Referenz (0,01 Einheiten): die Exportrundung setzt Innenkanten gelegentlich um
  // eine tausendstel Einheit über die Außenkante. Ohne sie fiele die Aussage an Rundungsrauschen.
  const slack = 0.01;
  return shapes.every(
    (shape) =>
      shape.bounds.minX >= outer.minX - slack &&
      shape.bounds.minY >= outer.minY - slack &&
      shape.bounds.maxX <= outer.maxX + slack &&
      shape.bounds.maxY <= outer.maxY + slack,
  );
}

/**
 * Die gefüllten Elemente der Körperebene, in Dokumentreihenfolge. Rechtecke und Kreise gehen mit
 * ihrer Achsenhülle ein, Polygone mit ihren Punkten, Pfade mit `parsePathBounds` — für die
 * Einschließungsprüfung zählt allein die Hülle.
 */
function bodyLayerShapes(svg: string): LayerShape[] {
  const layer = layerContent(svg, BODY_FILL_LAYER);
  if (layer === null) return [];
  const shapes: LayerShape[] = [];
  const push = (
    offset: number,
    bounds: PathBounds | null,
    curvedPath: boolean,
    fill: string | undefined,
  ): void => {
    if (bounds === null || fill === undefined || fill === 'none') return;
    shapes.push({ offset, bounds, curvedPath, fill: normalizeFill(fill) });
  };

  for (const match of layer.text.matchAll(/<(rect|circle|polygon|path)([^>]*)\/>/g)) {
    if (match.index === undefined) continue;
    const offset = layer.offset + match.index;
    const a = attrs(match[2] ?? '');
    switch (match[1]) {
      case 'rect': {
        const x = num(a['x']);
        const y = num(a['y']);
        push(
          offset,
          { minX: x, minY: y, maxX: x + num(a['width']), maxY: y + num(a['height']) },
          false,
          a['fill'],
        );
        break;
      }
      case 'circle': {
        const cx = num(a['cx']);
        const cy = num(a['cy']);
        const r = num(a['r']);
        push(offset, { minX: cx - r, minY: cy - r, maxX: cx + r, maxY: cy + r }, false, a['fill']);
        break;
      }
      case 'polygon': {
        const raw = (a['points'] ?? '').trim().split(/[\s,]+/).map(Number);
        const xs: number[] = [];
        const ys: number[] = [];
        for (let i = 0; i + 1 < raw.length; i += 2) {
          const x = raw[i];
          const y = raw[i + 1];
          if (x === undefined || y === undefined) continue;
          if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
          xs.push(x);
          ys.push(y);
        }
        if (xs.length === 0 || ys.length === 0) break;
        push(
          offset,
          {
            minX: Math.min(...xs),
            minY: Math.min(...ys),
            maxX: Math.max(...xs),
            maxY: Math.max(...ys),
          },
          false,
          a['fill'],
        );
        break;
      }
      case 'path': {
        const d = a['d'];
        if (d === undefined) break;
        push(offset, parsePathBounds(d), parseRectilinearPath(d) === null, a['fill']);
        break;
      }
    }
  }
  return shapes;
}

/**
 * Der Körperfüllpfad einer Referenzdatei: der **gekrümmte** gefüllte Pfad der Ebene
 * `Flächige_Fülung`, dessen Hülle alle übrigen gefüllten Formen derselben Ebene einschließt.
 *
 * **Warum Einschließung und nicht „der erste"** — obwohl beides im gesamten Bestand dasselbe
 * Ergebnis liefert (selbst gezählt: 151 der 661 Dateien führen einen gekrümmten Füllpfad, in
 * allen 151 ist der erste zugleich der einschließende, null Ausnahmen): `pickShape` in
 * `matchFingerprint` nimmt die **erste** Form ihrer Art, und die Organisationsfarbe liegt in
 * 27 dieser Dateien als zweiter, ebenfalls gekrümmter Füllpfad daneben (E.2.1: Körper
 * 1,0001/5,7503/31,0003/26,0004 gegen Farbfeld 2,0002/7,1138/30,0002/25,0007 mm — 1,36 mm
 * Unterschied). Eine Regel „der erste" wäre eine Aussage über die Exportreihenfolge des
 * Zeichenprogramms, die niemand geprüft hat; die Einschließung ist an der Zeichnung gemessen.
 *
 * **Warum `null` statt einer Notwahl**, wenn kein oder mehr als ein Pfad einschließt: dann sagt
 * das Artefakt weiterhin „keine vergleichbare Form", und `matchFingerprint` bricht mit genau
 * dieser Meldung ab. Das ist der laute Ausfall. Eine Notwahl wäre eine Körperaussage, für die es
 * keine Messung gibt.
 */
function bodyFillShape(svg: string): { offset: number; bounds: PathBounds; fill: string } | null {
  const shapes = bodyLayerShapes(svg);
  if (shapes.length === 0) return null;
  const enclosing = shapes.filter(
    (shape) =>
      shape.curvedPath &&
      containsAll(
        shape.bounds,
        shapes.filter((other) => other !== shape),
      ),
  );
  const [only] = enclosing;
  if (enclosing.length !== 1 || only === undefined) return null;
  return { offset: only.offset, bounds: only.bounds, fill: only.fill };
}

function mm(units: number): number {
  return Math.round(unitsToMm(units) * 1000) / 1000;
}

function normalizeFill(value: string): string {
  const short = /^#([0-9a-f])([0-9a-f])([0-9a-f])$/i.exec(value);
  if (short) return `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`.toLowerCase();
  return value.toLowerCase();
}

function attrs(fragment: string): Record<string, string> {
  const result: Record<string, string> = {};
  for (const match of fragment.matchAll(/([\w:-]+)="([^"]*)"/g)) {
    const [, key, value] = match;
    if (key !== undefined && value !== undefined) result[key] = value;
  }
  return result;
}

function num(value: string | undefined, fallback = 0): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/**
 * Wertet `translate(tx ty) rotate(a)` aus, wie es der Illustrator-Export für
 * gedrehte Quadrate erzeugt, und liefert den Mittelpunkt im Zielkoordinatensystem.
 */
function resolveRotation(
  transform: string | undefined,
  cx: number,
  cy: number,
): { angle: number; cx: number; cy: number } | null {
  if (!transform) return null;
  const rotate = /rotate\(\s*(-?[\d.]+)\s*\)/.exec(transform);
  if (!rotate?.[1]) return null;
  const angle = Number(rotate[1]);

  const translate = /translate\(\s*(-?[\d.]+)[\s,]+(-?[\d.]+)\s*\)/.exec(transform);
  const tx = num(translate?.[1]);
  const ty = num(translate?.[2]);

  const rad = (angle * Math.PI) / 180;
  const rx = cx * Math.cos(rad) - cy * Math.sin(rad);
  const ry = cx * Math.sin(rad) + cy * Math.cos(rad);

  return { angle, cx: rx + tx, cy: ry + ty };
}

function boundsFromPoints(points: ReadonlyArray<readonly [number, number]>): BoundsMm {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    minXMm: mm(Math.min(...xs)),
    minYMm: mm(Math.min(...ys)),
    maxXMm: mm(Math.max(...xs)),
    maxYMm: mm(Math.max(...ys)),
  };
}

/** Hülle eines gegebenenfalls gedrehten Rechtecks, in SVG-Einheiten hinein, in mm hinaus. */
function rectBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: { angle: number; cx: number; cy: number } | null,
): BoundsMm {
  const corners: Array<readonly [number, number]> = [
    [x, y],
    [x + width, y],
    [x + width, y + height],
    [x, y + height],
  ];
  if (!rotation) return boundsFromPoints(corners);

  const rad = (rotation.angle * Math.PI) / 180;
  return boundsFromPoints(
    corners.map(([px, py]) => {
      const dx = px - (x + width / 2);
      const dy = py - (y + height / 2);
      return [
        rotation.cx + dx * Math.cos(rad) - dy * Math.sin(rad),
        rotation.cy + dx * Math.sin(rad) + dy * Math.cos(rad),
      ] as const;
    }),
  );
}

function subpathBounds(subpaths: SubpathBounds[]): BoundsMm {
  return {
    minXMm: mm(Math.min(...subpaths.map((s) => s.minX))),
    minYMm: mm(Math.min(...subpaths.map((s) => s.minY))),
    maxXMm: mm(Math.max(...subpaths.map((s) => s.maxX))),
    maxYMm: mm(Math.max(...subpaths.map((s) => s.maxY))),
  };
}

export function extractFingerprint(svg: string, asset: string): Fingerprint {
  const viewBoxMatch = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(svg);
  const viewBox = {
    width: num(viewBoxMatch?.[1], 0),
    height: num(viewBoxMatch?.[2], 0),
  };

  const layers: string[] = [];
  for (const match of svg.matchAll(/<g id="([^"]+)"/g)) {
    const raw = match[1];
    if (raw === undefined) continue;
    layers.push(LAYER_LABELS[raw] ?? raw);
  }

  const fills = new Set<string>();
  const shapes: FingerprintShape[] = [];
  let curvedPaths = 0;
  const bodyFill = bodyFillShape(svg);

  for (const match of svg.matchAll(/<rect([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    const width = num(a['width']);
    const height = num(a['height']);
    // Die Grundfläche ist ein transparentes Bounding-Rect und trägt keine Information.
    if (a['fill'] === 'none') continue;
    if (a['fill'] !== undefined) fills.add(normalizeFill(a['fill']));

    const x = num(a['x']);
    const y = num(a['y']);
    const rotation = resolveRotation(a['transform'], x + width / 2, y + height / 2);

    const shape: FingerprintShape = {
      kind: 'rect',
      boundsMm: rectBounds(x, y, width, height, rotation),
    };
    if (a['fill'] !== undefined) shape.fill = normalizeFill(a['fill']);
    if (rotation) shape.rotate = rotation.angle;
    shapes.push(shape);
  }

  for (const match of svg.matchAll(/<circle([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    if (a['fill'] !== undefined && a['fill'] !== 'none') fills.add(normalizeFill(a['fill']));
    const cx = num(a['cx']);
    const cy = num(a['cy']);
    const r = num(a['r']);
    const shape: FingerprintShape = {
      kind: 'circle',
      boundsMm: { minXMm: mm(cx - r), minYMm: mm(cy - r), maxXMm: mm(cx + r), maxYMm: mm(cy + r) },
    };
    if (a['fill'] !== undefined && a['fill'] !== 'none') shape.fill = normalizeFill(a['fill']);
    shapes.push(shape);
  }

  // Polygone tragen bei mehreren Grundzeichen die Füllfläche — 1.7 Gebäude etwa
  // hat gar kein Füllrechteck. Ohne diese Schleife bliebe der Fingerprint leer.
  for (const match of svg.matchAll(/<polygon([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    if (a['fill'] === 'none') continue;
    if (a['fill'] !== undefined) fills.add(normalizeFill(a['fill']));
    const raw = (a['points'] ?? '').trim().split(/[\s,]+/).map(Number);
    const points: Array<readonly [number, number]> = [];
    for (let i = 0; i + 1 < raw.length; i += 2) {
      const x = raw[i];
      const y = raw[i + 1];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      points.push([x, y] as const);
    }
    if (points.length === 0) continue;
    const shape: FingerprintShape = { kind: 'bounds', boundsMm: boundsFromPoints(points) };
    if (a['fill'] !== undefined) shape.fill = normalizeFill(a['fill']);
    shapes.push(shape);
  }

  for (const match of svg.matchAll(/<path([^>]*)\/>/g)) {
    const a = attrs(match[1] ?? '');
    if (a['fill'] !== undefined && a['fill'] !== 'none') fills.add(normalizeFill(a['fill']));
    const d = a['d'];
    if (d === undefined) continue;

    const subpaths = parseRectilinearPath(d);
    if (subpaths === null) {
      // `curvedPaths` zählt weiterhin genau die Kurvenpfade, für die **keine** Form abgelegt
      // wurde — der Körperfüllpfad ist seit dem Ausbau keiner davon mehr. Die Zahl bleibt damit
      // lesbar als „so viel Geometrie sieht das Artefakt nicht".
      if (bodyFill === null || match.index !== bodyFill.offset) curvedPaths += 1;
      continue;
    }
    if (subpaths.length === 0) continue;

    const ring = deriveRing(subpaths);
    if (ring) {
      shapes.push({
        kind: 'ring',
        boundsMm: {
          minXMm: mm(ring.x),
          minYMm: mm(ring.y),
          maxXMm: mm(ring.x + ring.width),
          maxYMm: mm(ring.y + ring.height),
        },
        strokeWidthMm: mm(ring.strokeWidth),
      });
      continue;
    }

    // Mehr als zwei Teilpfade (1.7 Gebäude: Außenring, Innenring, Dachlinie) oder
    // kein Ringpaar. Die Außenkante ist um eine halbe Strichstärke zu groß und
    // wird deshalb als schwächere Art `outline` geführt.
    shapes.push({ kind: 'outline', boundsMm: subpathBounds(subpaths) });
  }

  // Der Körper steht **an erster Stelle**: `pickShape` nimmt die erste Form ihrer Art, und der
  // Körperfüllpfad schließt jede andere Füllform seiner Ebene ein. Angehängt statt vorangestellt
  // stünde er in einer Datei mit zusätzlichem Füllpolygon hinter der eingeschlossenen Form.
  if (bodyFill !== null) {
    shapes.unshift({
      kind: 'bounds',
      boundsMm: {
        minXMm: mm(bodyFill.bounds.minX),
        minYMm: mm(bodyFill.bounds.minY),
        maxXMm: mm(bodyFill.bounds.maxX),
        maxYMm: mm(bodyFill.bounds.maxY),
      },
      fill: bodyFill.fill,
    });
  }

  return {
    asset,
    viewBox,
    layers,
    fills: [...fills].sort(),
    shapes,
    curvedPaths,
  };
}
