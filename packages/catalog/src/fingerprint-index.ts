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
