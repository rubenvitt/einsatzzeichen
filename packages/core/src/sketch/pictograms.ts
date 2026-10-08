import type { DepictionVariant, Drawing, PictogramBox, Primitive } from '@einsatzzeichen/schema';
import { DEFAULT_VIEWBOX_MM } from '@einsatzzeichen/schema';
import { deepFreeze, type DeepReadonly } from '../geometry/readonly-data.js';
import { SKETCH_STROKE, strokePolyline, textRun } from './geometry.js';

/**
 * Drei Zeichen der Verbindungsarten, die J.1 nicht führt (LFH-1033): Melder, sonstige und eine
 * Satellitenverbindung ohne Angabe, was übertragen wird. Sie stehen im Format des Katalogs
 * (32 × 32 mm, Strich 0,5 mm, `role: 'pictogram'`), aber **nicht** im Katalog: Es gibt zu ihnen
 * keine Referenzdatei. Gebaut aus der Formsprache von J.1 (Befund in `SKETCH_BLOCKS`).
 */

export const SKETCH_PICTOGRAM_IDS = ['sketch.messenger', 'sketch.other', 'sketch.satellite'] as const;
export type SketchPictogramId = (typeof SKETCH_PICTOGRAM_IDS)[number];

export type SketchPictogram = DeepReadonly<{
  id: SketchPictogramId;
  variant: DepictionVariant;
  title: string;
  viewBox: Drawing['viewBox'];
  box: PictogramBox;
  primitives: readonly Primitive[];
}>;

/** Drahtlos: sechs Schrägen zwischen x = 4 und x = 28, Zackenhöhe 4 mm (wie J.1, `wirelessZigzag`). */
function wirelessZigzag(topMm: number): Primitive {
  const bottom = topMm + 4;
  return strokePolyline([
    [4, topMm],
    [8, bottom],
    [12, topMm],
    [16, bottom],
    [20, topMm],
    [24, bottom],
    [28, topMm],
  ]);
}

/** Kürzel-Schriftgrad wie die kleinen Betriebsarten in J.1.3/J.1.4 (Versalhöhe 4,9 mm). */
const LABEL_MM = 7.1;

/**
 * Balken mit Kürzel darüber; drahtlos mit Zickzack darunter. Der Balken (x 3 … 29) ist der von
 * J.1.1, der Zickzack der von J.1.8–J.1.11; die leitergebundene Fassung lässt den Zickzack weg und
 * rückt um 3 mm nach unten, damit sie wie in J.1 senkrecht mittig steht.
 */
function abbreviated(content: string, variant: DepictionVariant): { box: PictogramBox; primitives: Primitive[] } {
  const barY = variant === 'primary' ? 16 : 19;
  const label = textRun({ content, x: 16, y: barY - 2.5, sizeMm: LABEL_MM, anchor: 'middle' });
  const bar: Primitive = { type: 'line', role: 'pictogram', x1: 3, y1: barY, x2: 29, y2: barY, style: { ...SKETCH_STROKE } };
  const primitives = [label, bar, ...(variant === 'primary' ? [wirelessZigzag(barY + 3)] : [])];
  const box = label.type === 'text' ? label.boxMm : { xMm: 3, yMm: barY, widthMm: 26, heightMm: 0 };
  const top = Math.min(box.yMm, barY);
  const bottom = variant === 'primary' ? barY + 7 : barY;
  const left = Math.min(3, box.xMm);
  const right = Math.max(29, box.xMm + box.widthMm);
  return { box: { xMm: left, yMm: top, widthMm: right - left, heightMm: bottom - top }, primitives };
}

/** Satellitenschale aus J.1.12/J.1.13 ohne den Inhalt rechts daneben. */
function satelliteDish(): Primitive[] {
  return [
    { type: 'path', role: 'pictogram', d: 'M 1 3 C 1 17.35 12.65 29 27 29', style: { ...SKETCH_STROKE } },
    { type: 'line', role: 'pictogram', x1: 27, y1: 3, x2: 8.8, y2: 21.2, style: { ...SKETCH_STROKE } },
  ];
}

const TITLES: Readonly<Record<SketchPictogramId, string>> = {
  'sketch.messenger': 'Verbindung über Melder',
  'sketch.other': 'Sonstige Verbindung',
  'sketch.satellite': 'Satellitenverbindung',
};

function build(id: SketchPictogramId, variant: DepictionVariant): SketchPictogram {
  let geometry: { box: PictogramBox; primitives: Primitive[] };
  switch (id) {
    case 'sketch.messenger':
      geometry = abbreviated('Melder', variant);
      break;
    case 'sketch.other':
      geometry = abbreviated('sonst.', variant);
      break;
    case 'sketch.satellite':
      if (variant !== 'primary') throw new Error('sketch.satellite hat nur eine Darstellung.');
      geometry = { box: { xMm: 1, yMm: 3, widthMm: 26, heightMm: 26 }, primitives: satelliteDish() };
      break;
  }
  return deepFreeze({
    id,
    variant,
    title: TITLES[id],
    viewBox: DEFAULT_VIEWBOX_MM,
    box: geometry.box,
    primitives: geometry.primitives,
  });
}

const CACHE = new Map<string, SketchPictogram>();

/**
 * Ein Zeichen der Kommunikationsskizze im Format von `pictogram()`. Melder und sonstige gibt es
 * drahtlos (`primary`, mit Zickzack) und leitergebunden (`alternative`), den Satelliten nur einmal.
 */
export function sketchPictogram(id: SketchPictogramId, variant: DepictionVariant = 'primary'): SketchPictogram {
  const key = `${id}#${variant}`;
  const cached = CACHE.get(key);
  if (cached !== undefined) return cached;
  const built = build(id, variant);
  CACHE.set(key, built);
  return built;
}

