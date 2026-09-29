import type { CapabilityInsetTreatment, Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from '../bounds.js';

/**
 * Das Messverfahren für LFH-587: eine Körperfassung eines Kapitel-4-Piktogramms gegen seine
 * Einzeldarstellung. Es steht in `core`, damit Daten (`capability-inset.ts`) und Gate
 * (`conformance/src/capability-inset-fixtures.test.ts`) dieselbe Rechnung benutzen und keine der
 * beiden Seiten ihre eigene Lesart der Zahlen hat.
 *
 * **Gemessen wird die Mittellinienhülle**, nicht die Tintenhülle. Beide Fassungen zeichnen mit
 * 0,5 mm (das prüft das Gate eigens), der Strich trüge also auf beiden Seiten denselben Zuschlag
 * bei und verfälschte nur die Faktoren kleiner Marken.
 */

/** Toleranz, mit der eine Fassung als randbündig gilt; dieselbe wie `BODY_TOLERANCE_MM` der Körpermarken. */
export const CAPABILITY_INSET_FLUSH_TOLERANCE_MM = 0.01;

/**
 * Grenze zwischen `reduced` und `reshaped`: die relative Abweichung der beiden Faktoren,
 * `|sx − sy| / max(sx, sy)`.
 *
 * **Die Zahl ist aus einer Lücke der Messwerte gewählt, nicht vorab gesetzt.** Bis LFH-587 lag
 * die Abweichung der nicht randbündigen Fassungen entweder bei höchstens 0,22 (Wasserrettung am
 * Landfahrzeug, I.2.1) oder bei mindestens 0,37 (Zelt im Kreiskörper, F.3.13), und 0,3 stand in
 * dieser leeren Lücke. **Anhang C hat sie verkleinert (LFH-786):** die Technische Hilfeleistung im
 * Rüstwagen (C.2.18) liegt bei 0,28, die Wasserförderung im Schlauchwagen (C.2.26) auf 0,30 selbst.
 * Die Grenze bleibt 0,3; leer ist nur noch 0,30 bis 0,37. C.2.26 gilt mit `≤` als `reduced`, ohne
 * Rundung der Faktoren läge sein Wert bei 0,2987. Das Gate hält beide Ränder fest und wird rot,
 * sobald eine neue Fassung in die verbliebene Lücke fällt.
 */
export const CAPABILITY_INSET_REDUCED_UNIFORMITY_LIMIT = 0.3;

export interface CapabilityInsetMeasurement {
  readonly treatment: CapabilityInsetTreatment;
  /** Breitenfaktor, auf 0,01 gerundet. */
  readonly scaleX: number;
  /** Höhenfaktor, auf 0,01 gerundet. */
  readonly scaleY: number;
  /** `|sx − sy| / max(sx, sy)`, auf 0,01 gerundet. */
  readonly uniformity: number;
  /** Achse, auf der die Fassung von Körperkante zu Körperkante reicht. */
  readonly flushAxis: 'x' | 'y' | 'both' | 'none';
  /** Alle Strichstärken der Körperfassung, aufsteigend und ohne Dubletten. */
  readonly strokeWidthsMm: readonly number[];
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function hullOf(primitives: readonly Primitive[]): BoundsMm {
  if (primitives.length === 0) throw new Error('Leere Fassung: nichts zu vermessen.');
  return primitives.map((primitive) => boundsOfMm(primitive)).reduce((a, b) => ({
    minX: Math.min(a.minX, b.minX),
    minY: Math.min(a.minY, b.minY),
    maxX: Math.max(a.maxX, b.maxX),
    maxY: Math.max(a.maxY, b.maxY),
  }));
}

function leaves(primitive: Primitive): readonly Primitive[] {
  return primitive.type === 'group' ? primitive.children.flatMap(leaves) : [primitive];
}

/**
 * Vermisst die Körperfassung `inBody` einer Fähigkeit gegen ihre Einzeldarstellung `standalone`
 * am Körper mit der Hülle `body` (die Hülle, die `compose()` an `bodyMark()` gibt).
 */
export function measureCapabilityInset(
  inBody: readonly Primitive[],
  standalone: readonly Primitive[],
  body: BoundsMm,
): CapabilityInsetMeasurement {
  const mark = hullOf(inBody);
  const single = hullOf(standalone);
  const scaleX = round2((mark.maxX - mark.minX) / (single.maxX - single.minX));
  const scaleY = round2((mark.maxY - mark.minY) / (single.maxY - single.minY));
  const uniformity = round2(Math.abs(scaleX - scaleY) / Math.max(scaleX, scaleY));
  const near = (a: number, b: number): boolean =>
    Math.abs(a - b) <= CAPABILITY_INSET_FLUSH_TOLERANCE_MM;
  const flushX = near(mark.minX, body.minX) && near(mark.maxX, body.maxX);
  const flushY = near(mark.minY, body.minY) && near(mark.maxY, body.maxY);
  const flushAxis = flushX && flushY ? 'both' : flushX ? 'x' : flushY ? 'y' : 'none';
  const treatment: CapabilityInsetTreatment =
    flushAxis !== 'none'
      ? 'flush'
      : uniformity <= CAPABILITY_INSET_REDUCED_UNIFORMITY_LIMIT
        ? 'reduced'
        : 'reshaped';
  const strokeWidthsMm = [
    ...new Set(
      inBody
        .flatMap(leaves)
        .map((primitive) => primitive.style?.strokeWidth)
        .filter((width): width is number => width !== undefined),
    ),
  ].sort((a, b) => a - b);
  return { treatment, scaleX, scaleY, uniformity, flushAxis, strokeWidthsMm };
}
