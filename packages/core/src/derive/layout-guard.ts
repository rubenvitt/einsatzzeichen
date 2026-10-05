import type { Drawing, Point, Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from '../bounds.js';
import { NotMeasuredError } from '../not-measured.js';
import { ARIMO_CAP_HEIGHT_FRACTION } from '../render/text-policy.js';
import { textWidthMm, type TextMetrics } from '../text-metrics.js';

/**
 * Letzte Prüfung einer **abgeleiteten** Zeichnung, bevor sie den Motor verlässt.
 *
 * Jede Ableitung für sich hält ihre Zone frei; erst im Zusammenspiel mehrerer Felder entstehen
 * Überschneidungen, die keine einzelne Ableitung sieht: Läufe auf einem Körper, den Kopf und
 * Giebel so weit verkleinern, dass sie an ihrer Untergrenze stehen (seit LFH-987 folgen sie dem
 * Körper, `run-scaling.ts`); ein Eckkürzel unter einem langen mittigen Lauf; ein Kopf, der über
 * die Fläche hinausragt. Gefunden hat sie ein Zensus über
 * Feldpaare (2. Oktober 2026). Eine Fehlzeichnung ist schlimmer als eine benannte Lücke, deshalb
 * wird hier abgelehnt und nicht verschoben: wohin ein Lauf ausweichen soll, entscheidet die
 * Ableitung seiner Zone, nicht diese Prüfung.
 *
 * Vermessene Zeichnungen (ohne `derivations`) prüft sie nicht: Sie folgen ihrem Original, auch
 * wo es sich selbst eng setzt.
 */
export function assertDerivedLayoutFits(drawing: Drawing, metrics: TextMetrics): Drawing {
  if (drawing.derivations === undefined || drawing.derivations.length === 0) return drawing;
  const problem = layoutProblem(drawing, metrics);
  if (problem === undefined) return drawing;
  throw new NotMeasuredError(
    `Diese Zusammenstellung findet abgeleitet keinen Platz: ${problem}. Kein Original zeigt sie, ` +
      'und eine Lage ohne Überschneidung lässt sich aus den vermessenen Fassungen nicht ableiten.',
    'combination',
  );
}

/** Toleranz für Berührungen: Strichhälften und gerundete Metriken. */
const TOUCH_MM = 0.15;
/** Toleranz für die Grenze der Zeichenfläche, wie im Zensus (halber Strich plus Rundung). */
const AREA_MM = 0.6;

type TextPrimitive = Extract<Primitive, { type: 'text' }>;

function layoutProblem(drawing: Drawing, metrics: TextMetrics): string | undefined {
  const children = drawing.children;
  const width = drawing.viewBox.width;
  const height = drawing.viewBox.height;

  for (const child of children) {
    // Die Fußzeile trägt ihre Textbox bekannt über die Fläche hinaus; das prüft das viewBox-Gate.
    if (child.role === 'foot') continue;
    const box = boundsOfMm(child);
    if (!Number.isFinite(box.minX)) continue;
    if (box.minX < -AREA_MM || box.minY < -AREA_MM || box.maxX > width + AREA_MM || box.maxY > height + AREA_MM) {
      return `${describe(child)} ragt über die Zeichenfläche`;
    }
  }

  const texts = children.filter(
    (child): child is TextPrimitive => child.type === 'text' && child.role !== 'foot',
  );
  const inks = texts.map((text) => ({ text, ink: inkBox(text, metrics) }));

  for (let i = 0; i < inks.length; i += 1) {
    for (let j = i + 1; j < inks.length; j += 1) {
      if (overlaps(inks[i]!.ink, inks[j]!.ink)) {
        return `die Läufe „${inks[i]!.text.content}“ und „${inks[j]!.text.content}“ überlappen`;
      }
    }
  }

  const heads = children.filter((child) => child.role === 'head');
  const extras = children.filter((child) => child.role === 'bodyExtra');
  const body = children.find((child) => child.role === 'body');
  const hull = body === undefined ? undefined : boundsOfMm(body);

  for (const { text, ink } of inks) {
    for (const head of heads) {
      if (overlaps(ink, boundsOfMm(head))) return `der Lauf „${text.content}“ liegt im Kopf`;
    }
    for (const extra of extras) {
      if (crossesExtra(ink, extra)) {
        return `der Lauf „${text.content}“ kreuzt die Zusatzgeometrie des Körpers`;
      }
    }
    // Ein Lauf, der im Körper steht, bleibt im Körper.
    if (hull !== undefined && inside(text.x, text.y, hull) && !within(ink, hull)) {
      return `der Lauf „${text.content}“ ist breiter oder höher als der Körper`;
    }
  }

  // Der Kopf gegen die Strecken der Zusatzgeometrie (Giebel). Gegen Körper und Piktogramme nicht
  // über deren Hülle: Raute und Kreis lassen ihre Ecken frei, und vermessene Köpfe stehen genau dort
  // (D.4.1: die Kreissterne neben der Rautenspitze, über den Dekorationen der Funktionsfassung).
  // Den Abstand zum Körper hält `placeHead`.
  for (const head of heads) {
    const headBox = boundsOfMm(head);
    for (const extra of extras) {
      if (crossesExtra(headBox, extra)) return 'der Kopf kreuzt die Zusatzgeometrie des Körpers';
    }
  }
  return undefined;
}

function inkBox(text: TextPrimitive, metrics: TextMetrics): BoundsMm {
  const widthMm = textWidthMm(text.content, text.sizeMm, metrics).widthMm;
  const anchor = text.anchor ?? 'start';
  const minX = anchor === 'middle' ? text.x - widthMm / 2 : anchor === 'end' ? text.x - widthMm : text.x;
  return {
    minX,
    minY: text.y - text.sizeMm * ARIMO_CAP_HEIGHT_FRACTION,
    maxX: minX + widthMm,
    maxY: text.y,
  };
}

function overlaps(left: BoundsMm, right: BoundsMm): boolean {
  return left.minX < right.maxX - TOUCH_MM && right.minX < left.maxX - TOUCH_MM &&
    left.minY < right.maxY - TOUCH_MM && right.minY < left.maxY - TOUCH_MM;
}

function within(inner: BoundsMm, outer: BoundsMm): boolean {
  return inner.minX >= outer.minX - TOUCH_MM && inner.maxX <= outer.maxX + TOUCH_MM &&
    inner.minY >= outer.minY - TOUCH_MM && inner.maxY <= outer.maxY + TOUCH_MM;
}

function inside(x: number, y: number, box: BoundsMm): boolean {
  return x > box.minX && x < box.maxX && y > box.minY && y < box.maxY;
}

/**
 * Linienzüge (Giebel, L-Rahmen, Deichsel) zählen mit ihren Strecken, nicht mit ihrer Hülle: unter
 * dem Giebel und im L-Rahmen ist Platz. Flächen (Band) zählen mit ihrer Hülle. Pfade bleiben aus,
 * ihre Hülle sagt über ihr Inneres nichts.
 */
function crossesExtra(ink: BoundsMm, extra: Primitive): boolean {
  if (extra.type === 'polyline') return polylineCrosses(ink, extra.points);
  if (extra.type === 'line') return segmentCrosses(ink, [extra.x1, extra.y1], [extra.x2, extra.y2]);
  if (extra.type === 'rect') return overlaps(ink, boundsOfMm(extra));
  return false;
}

function polylineCrosses(ink: BoundsMm, points: readonly Point[]): boolean {
  for (let i = 1; i < points.length; i += 1) {
    if (segmentCrosses(ink, points[i - 1]!, points[i]!)) return true;
  }
  return false;
}

/** Ob die Strecke das um die Berührungstoleranz verkleinerte Rechteck schneidet (Liang–Barsky). */
function segmentCrosses(box: BoundsMm, from: Point, to: Point): boolean {
  const minX = box.minX + TOUCH_MM;
  const maxX = box.maxX - TOUCH_MM;
  const minY = box.minY + TOUCH_MM;
  const maxY = box.maxY - TOUCH_MM;
  if (minX >= maxX || minY >= maxY) return false;
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  let t0 = 0;
  let t1 = 1;
  const clip = (p: number, q: number): boolean => {
    if (p === 0) return q >= 0;
    const r = q / p;
    if (p < 0) {
      if (r > t1) return false;
      if (r > t0) t0 = r;
    } else {
      if (r < t0) return false;
      if (r < t1) t1 = r;
    }
    return true;
  };
  return clip(-dx, from[0] - minX) && clip(dx, maxX - from[0]) &&
    clip(-dy, from[1] - minY) && clip(dy, maxY - from[1]) && t0 <= t1;
}

function describe(primitive: Primitive): string {
  if (primitive.type === 'text') return `der Lauf „${primitive.content}“`;
  if (primitive.role === 'head') return 'der Kopf';
  if (primitive.role === 'pictogram') return 'ein Piktogramm';
  return 'ein Teil der Zeichnung';
}
