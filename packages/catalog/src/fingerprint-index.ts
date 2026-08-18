import type { FingerprintLike } from '@einsatzzeichen/core';
import fingerprints from './fingerprints.json' with { type: 'json' };

/**
 * Der JSON-Import ist eine Vertrauensgrenze zu einem **Generat** (`pnpm cli audit:reference`),
 * nicht zu TypeScript — der `with { type: 'json' }`-Typ ist eine Behauptung des Compilers, keine
 * Prüfung des tatsächlichen Dateiinhalts. Deshalb Laufzeitvalidierung statt `as FingerprintLike[]`.
 */
function isFingerprintLike(value: unknown): value is FingerprintLike {
  if (typeof value !== 'object' || value === null) return false;
  if (!('asset' in value) || !('shapes' in value)) return false;
  return typeof value.asset === 'string' && Array.isArray(value.shapes);
}

function assertFingerprints(value: unknown): FingerprintLike[] {
  if (!Array.isArray(value) || !value.every(isFingerprintLike)) {
    throw new Error(
      'packages/catalog/src/fingerprints.json hat nicht die erwartete Form (Array von ' +
        'Einträgen mit "asset": string und "shapes": Array). Mit "pnpm cli audit:reference" neu erzeugen.',
    );
  }
  return value;
}

const raw: unknown = fingerprints;
const index = new Map<string, FingerprintLike>(assertFingerprints(raw).map((fp) => [fp.asset, fp]));

/**
 * Ob das Kennwertartefakt zu dieser Datei **keine vergleichbare Form** führt (`shapes: []`). Der
 * Extraktor legt für einen Kurvenpfad nichts ab und zählt nur `curvedPaths` hoch; `matchFingerprint`
 * bricht dann mit „Keine vergleichbare Form in den Kennzahlen zu …" ab, bevor es den Körper
 * ansieht. Betroffen sind im Bestand vom 18. August 2026 unter anderem 1.3, 1.4, 1.5, 1.9 und 1.14.
 *
 * Eine **unbekannte** Datei liefert bewusst `false`: die Frage „trägt das Artefakt eine Form?" ist
 * für sie nicht beantwortet, und eine Lockerung der Nachweispflicht darf nicht daraus folgen, dass
 * ein Eintrag im Artefakt fehlt.
 */
export function referenceLacksComparableShape(asset: string): boolean {
  const found = index.get(asset);
  return found !== undefined && found.shapes.length === 0;
}

/** Wirft, wenn die Kennzahlen fehlen — dann wurde `pnpm cli audit:reference` nicht ausgeführt. */
export function fingerprintFor(asset: string): FingerprintLike {
  const found = index.get(asset);
  if (!found) {
    throw new Error(
      `Keine Kennzahlen zu "${asset}". Fehlt der Eintrag, mit "pnpm cli audit:reference" neu erzeugen.`,
    );
  }
  return found;
}
