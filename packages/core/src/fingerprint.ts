import { TOLERANCE_UNITS, mmToUnits, type Drawing, type Primitive } from '@einsatzzeichen/schema';
import { boundsOfMm, type BoundsMm } from './bounds.js';

// Kein Re-Export von boundsOfMm/BoundsMm: der Paket-Index exportiert bereits ./bounds.js,
// ein zweiter Pfad erzeugte einen mehrdeutigen Export.

export interface FingerprintShapeLike {
  kind: string;
  boundsMm: { minXMm: number; minYMm: number; maxXMm: number; maxYMm: number };
}

export interface FingerprintLike {
  asset: string;
  shapes: readonly FingerprintShapeLike[];
  /** Normalisierte Hexwerte der Füllfarben. Wird in Task 10 für die Organisationen genutzt. */
  fills?: readonly string[];
}

export interface FingerprintResult {
  ok: boolean;
  problems: string[];
}

/**
 * Aussagekraft der Formarten, absteigend. `ring` ist eine echte Mittellinie,
 * `outline` liegt um eine halbe Strichstärke daneben und wird nur genommen,
 * wenn nichts Besseres da ist.
 */
const PRECEDENCE = ['ring', 'bounds', 'rect', 'circle', 'outline'];

function pickShape(shapes: readonly FingerprintShapeLike[]): FingerprintShapeLike | null {
  for (const kind of PRECEDENCE) {
    const found = shapes.find((shape) => shape.kind === kind);
    if (found) return found;
  }
  return shapes[0] ?? null;
}

function boundsOfShape(shape: FingerprintShapeLike): BoundsMm {
  return {
    minX: shape.boundsMm.minXMm,
    minY: shape.boundsMm.minYMm,
    maxX: shape.boundsMm.maxXMm,
    maxY: shape.boundsMm.maxYMm,
  };
}

function findBody(children: readonly Primitive[]): Primitive | null {
  for (const child of children) {
    if (child.role === 'body') return child;
    if (child.type === 'group') {
      const nested = findBody(child.children);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * Vergleicht die Körpergeometrie einer Zeichnung mit den aus der Referenz abgeleiteten
 * Kennzahlen. Verglichen wird in SVG-Einheiten mit der Exporttoleranz von 0,01.
 */
export function matchFingerprint(
  drawing: Drawing,
  fingerprint: FingerprintLike,
): FingerprintResult {
  const problems: string[] = [];

  const body = findBody(drawing.children);
  if (!body) {
    return {
      ok: false,
      problems: [`Kein Primitiv mit role "body" in der Zeichnung zu ${fingerprint.asset}.`],
    };
  }

  const picked = pickShape(fingerprint.shapes);
  if (!picked) {
    return {
      ok: false,
      problems: [`Keine vergleichbare Form in den Kennzahlen zu ${fingerprint.asset}.`],
    };
  }

  let actual: BoundsMm;
  try {
    actual = boundsOfMm(body);
  } catch (error) {
    // Gezielt nur den dokumentierten Fehlermodus von boundsOfMm auffangen (z. B. eine gedrehte
    // Gruppe als body, die boundsOfMm bewusst ablehnt statt ihre Hülle zu nähern) und in einen
    // Befund übersetzen — ein einzelner nicht vergleichbarer Katalogeintrag soll den Testlauf
    // nicht mit einer unbehandelten Ausnahme abreißen. Jeder andere Fehler ist ein echter
    // Programmierfehler und wird weitergeworfen, nicht verschluckt.
    if (error instanceof Error && error.message.includes('Drehung von Gruppen')) {
      return {
        ok: false,
        problems: [
          `${fingerprint.asset}: Hülle des body-Primitivs nicht bestimmbar (${error.message})`,
        ],
      };
    }
    throw error;
  }

  const reference = boundsOfShape(picked);
  const keys: Array<keyof BoundsMm> = ['minX', 'minY', 'maxX', 'maxY'];

  for (const key of keys) {
    const expectedUnits = mmToUnits(reference[key]);
    const actualUnits = mmToUnits(actual[key]);
    if (Math.abs(expectedUnits - actualUnits) > TOLERANCE_UNITS) {
      problems.push(
        `${fingerprint.asset}: ${key} erwartet ${reference[key]} mm, erhalten ${actual[key]} mm ` +
          `(Differenz ${(actualUnits - expectedUnits).toFixed(4)} Einheiten).`,
      );
    }
  }

  return { ok: problems.length === 0, problems };
}
