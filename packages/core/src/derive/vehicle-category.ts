import type { BodyVariantId, SymbolKind } from '@einsatzzeichen/schema';
import { noteDerivation } from './record.js';

/**
 * Fahrzeugkategorie (Kapitel 5.1) an Körperformen, an denen die Referenz keine Fahrwerkszone
 * zeigt.
 *
 * **Wo sie steht.** Vermessen ist die Fahrwerkszone an `5.1.1.1` bis `5.1.1.6` und an allen 25
 * E.2-Zeichen mit Fahrwerk: Sie hängt an der Unterkante des Grundzeichens, also aller seiner
 * Primitive, und trägt ihre Marken auf festen Radplätzen. Vom 02.10.2026 an stand sie abgeleitet
 * auch an Wasser- und Luftfahrzeug; das Fachreview vom 05.10.2026 (LFH-1064) hat das am
 * Luftfahrzeug gesperrt und am Wasserfahrzeug auf das Amphibienfahrzeug (5.1.1.4) beschränkt
 * (`vehicle-category-requires-chassis-body` in `validate.ts`). Übertragen wird damit nur noch die
 * Zone des Amphibienfahrzeugs an den Wasserrumpf: Am Halbkreisrumpf hängen die äußeren Räder frei
 * unter den Rumpfflanken, weil die Radplätze an der Kfz-Breite vermessen sind.
 *
 * Mit dem Luftfahrzeug ist auch die Ausweichlage entfallen, die das ganze Zeichen anhob, wenn das
 * Fahrwerk unter der Zusatzgeometrie des Luftrumpfs aus der Grundfläche ragte: An keinem
 * zugelassenen Körper ragt es heraus (das Radpaar schließt `plain-wheel-pair-chassis-conflict`
 * aus).
 */

/** Körperformen, an denen die Referenz eine Fahrwerkszone vermessen hat. */
const MEASURED_CHASSIS_KINDS: ReadonlySet<SymbolKind> = new Set<SymbolKind>([
  'vehicle-land',
  'trailer',
  'swap-loader-vehicle',
]);

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
