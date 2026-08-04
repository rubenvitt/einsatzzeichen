import type { FingerprintLike } from '@einsatzzeichen/core';
import fingerprints from './fingerprints.json' with { type: 'json' };

const index = new Map<string, FingerprintLike>(
  (fingerprints as FingerprintLike[]).map((fp) => [fp.asset, fp]),
);

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
