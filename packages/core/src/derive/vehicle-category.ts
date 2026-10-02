import type { BodyVariantId, ChassisShape, Primitive, SymbolKind, VehicleCategoryId } from '@einsatzzeichen/schema';
import { DEFAULT_VIEWBOX_MM } from '@einsatzzeichen/schema';
import { boundsOfMm } from '../bounds.js';
import { baseDrawing } from '../geometry/base-symbols.js';
import { vehicleChassis } from '../geometry/vehicle-categories.js';
import { HEAD_TOP_MARGIN_MM, profileFor } from '../layout/profiles.js';
import { NotMeasuredError } from '../not-measured.js';
import { mapPrimitive } from './affine-map.js';
import { noteDerivation } from './record.js';

/**
 * Fahrzeugkategorie (Kapitel 5.1) an Körperformen, an denen die Referenz keine Fahrwerkszone
 * zeigt (Eigentümerentscheid vom 02.10.2026: zulassen, abgeleitet).
 *
 * **Was übertragen wird.** Die Fahrwerkszone ist an `5.1.1.1` bis `5.1.1.6` und an allen 25
 * E.2-Zeichen mit Fahrwerk als Regel vermessen: Sie hängt an der Unterkante des Grundzeichens,
 * also aller seiner Primitive, und trägt ihre Marken auf festen Radplätzen. Genau diese Regel gilt
 * an Wasser- und Luftfahrzeug weiter — `compose()` rechnet die Unterkante ohnehin über Körper und
 * Zusatzgeometrie. Am Halbkreisrumpf des Wasserfahrzeugs hängen die äußeren Räder damit frei unter
 * den Rumpfflanken: Die Radplätze sind an der Kfz-Breite vermessen, nicht an der Rumpfform.
 *
 * **Was neu konstruiert ist: die Ausweichlage unter dem Luftfahrzeug.** Der angehobene Rumpf
 * (F.2.6/F.2.7) und der Festflügelrumpf tragen ihre Zusatzgeometrie genau dort, wo am
 * Landfahrzeug das Fahrwerk sitzt (y ≈ 22,5 … 27,5). Statt sie still zu überlagern, hängt das
 * Fahrwerk unter der Zusatzgeometrie (die Unterkante des Grundzeichens schließt sie ein). Reicht
 * es dann über die Grundfläche hinaus, hebt sich das **ganze** Zeichen um den Überstand: Körper,
 * Zusatzgeometrie, Beschriftung und Fahrwerk wandern gemeinsam, ihre Lage zueinander bleibt.
 * Als Randabstand gilt unten derselbe Millimeter wie oben für die Kopfzone
 * (`HEAD_TOP_MARGIN_MM`); die vermessenen Fahrwerke der Landfahrzeuge enden bei 30,75 mm und
 * bleiben damit unberührt.
 */

/** Körperformen, an denen die Referenz eine Fahrwerkszone vermessen hat. */
const MEASURED_CHASSIS_KINDS: ReadonlySet<SymbolKind> = new Set<SymbolKind>([
  'vehicle-land',
  'trailer',
  'swap-loader-vehicle',
]);

/** Unterster zulässiger Rand des Fahrwerks: 1 mm über dem Rand der Grundfläche. */
const CHASSIS_BOTTOM_LIMIT_MM = DEFAULT_VIEWBOX_MM.height - HEAD_TOP_MARGIN_MM;

/**
 * Meldet die Fahrwerkszone an einer Körperform ohne vermessenes Fahrwerk als übertragen. An den
 * drei vermessenen Körperformen bleibt die Zeichnung ohne Notiz.
 */
export function noteChassisDerivation(kind: SymbolKind, variant: BodyVariantId | undefined): void {
  if (MEASURED_CHASSIS_KINDS.has(kind)) return;
  noteDerivation({
    dimension: 'vehicleCategory',
    part: `Fahrwerkszone an der Unterkante von "${kind}"${variant === undefined ? '' : ` / "${variant}"`}`,
    basis: 'transferred',
    from: '5.1.1.1–5.1.1.6 und E.2: Zone an der Unterkante des Grundzeichens, Radplätze 3,75/16/28,25 mm',
  });
}

/**
 * Wie weit das Zeichen steigen muss, damit das Fahrwerk 1 mm über dem unteren Rand endet; 0, wenn
 * es schon passt. `chassisTopMm` ist die absolute Oberkante der Zone, die Außenkante der Marken
 * liegt `heightMm` darunter (die Zonenhöhe schließt die halbe Strichbreite ein).
 */
export function chassisLiftMm(chassis: ChassisShape | null, chassisTopMm: number): number {
  if (chassis === null) return 0;
  const bottomMm = chassisTopMm + chassis.heightMm;
  const overhangMm = bottomMm - CHASSIS_BOTTOM_LIMIT_MM;
  // Gegen Rundungsrauschen der Zonenrechnung: unter einem Tausendstel Millimeter steigt nichts.
  return overhangMm > 1e-3 ? Math.round(overhangMm * 10000) / 10000 : 0;
}

/**
 * Hebt alle Primitive um `liftMm` an. Ohne Hub bleibt die Liste dieselbe — vermessene Zeichen
 * behalten ihre Gestalt bis aufs Objekt.
 */
export function liftForChassis(
  children: readonly Primitive[],
  liftMm: number,
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
): readonly Primitive[] {
  if (liftMm === 0) return children;
  noteDerivation({
    dimension: 'vehicleCategory',
    part:
      `Zeichen "${kind}"${variant === undefined ? '' : ` / "${variant}"`} um ` +
      `${String(liftMm).replace('.', ',')} mm angehoben, ` +
      'damit das Fahrwerk unter der Zusatzgeometrie in der Grundfläche bleibt',
    basis: 'constructed',
    from: `HEAD_TOP_MARGIN_MM: ${HEAD_TOP_MARGIN_MM} mm Randabstand zur Grundfläche, gespiegelt nach unten`,
  });
  return children.map((child) => mapPrimitive({ scale: 1, dx: 0, dy: -liftMm }, child));
}

/**
 * Der `d`-String einer Kurvenmarke (`ChassisMark` vom Typ `curve`) an der absoluten
 * Zonenoberkante `topMm`: Startpunkt, dann je drei Punkte einer Kubik.
 */
export function chassisCurvePath(points: readonly (readonly [number, number])[], topMm: number): string {
  const [start, ...rest] = points;
  if (start === undefined || rest.length === 0 || rest.length % 3 !== 0) {
    throw new Error('Kurvenmarke: Startpunkt und je drei Punkte einer Kubik erwartet.');
  }
  const at = ([x, y]: readonly [number, number]): string => `${x} ${Math.round((y + topMm) * 10000) / 10000}`;
  const cubics: string[] = [];
  for (let index = 0; index < rest.length; index += 3) {
    cubics.push(`C ${rest.slice(index, index + 3).map(at).join(', ')}`);
  }
  return `M ${at(start)} ${cubics.join(' ')}`;
}

/**
 * Der Hub, den `compose()` für diese Körperform mit Fahrwerk setzen wird — für die Prüfungen, die
 * absolute Lagen gegen die Grundfläche halten (`above-left-metrics-within-viewbox`). Fahrzeuge
 * tragen keine Kopfzone (`strength-requires-unit`), ihr Körper steht also unverschoben; die
 * Unterkante des Grundzeichens ist die der Katalogzeichnung. Eine nicht belegte Variante hat keine
 * Zeichnung und keinen Hub (die Ablehnung dafür kommt von ihrer eigenen Regel).
 */
export function chassisLiftForForm(
  kind: SymbolKind,
  variant: BodyVariantId | undefined,
  vehicleCategory: VehicleCategoryId | undefined,
): number {
  if (vehicleCategory === undefined) return 0;
  let children: readonly Primitive[];
  try {
    children = baseDrawing(kind, variant).children;
  } catch (error) {
    if (error instanceof NotMeasuredError) return 0;
    throw error;
  }
  const bottomMm = Math.max(...children.map((child) => boundsOfMm(child).maxY));
  const topMm = bottomMm + (profileFor(kind, variant).chassisTopBelowBaseBottomMm ?? 0);
  return chassisLiftMm(vehicleChassis(vehicleCategory), topMm);
}
