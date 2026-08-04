import { describe, expect, it } from 'vitest';
import { matchFingerprint } from '@einsatzzeichen/core';
import { BASE_SYMBOLS } from './base-symbols.js';
import { fingerprintFor } from './fingerprint-index.js';

const REFERENCE = [
  ['formation', '1.1_Taktische Formation.svg'],
  ['person', '1.2_Person.svg'],
  ['post', '1.6_Funktionsstelle.svg'],
  ['building', '1.7_Gebäude.svg'],
  ['container', '1.8_Behälter Ressource Raum Funkgerät.svg'],
  ['measure', '1.10_Maßnahme.svg'],
  ['hazard', '1.11_Gefahr.svg'],
] as const satisfies ReadonlyArray<[keyof typeof BASE_SYMBOLS, string]>;

/**
 * Erzwingt zur Kompilierzeit, dass jede Art in `BASE_SYMBOLS` auch in `REFERENCE` vorkommt.
 * `ReadonlyArray<[keyof typeof BASE_SYMBOLS, string]>` prüft oben nur, dass jeder REFERENCE-
 * Eintrag ein gültiger Schlüssel ist — nicht, dass jeder Schlüssel referenziert wird. Ergänzt
 * jemand `BASE_SYMBOLS` um eine Art, ohne `REFERENCE` zu ergänzen, ist `ReferencedKind` nicht
 * mehr deckungsgleich mit `keyof typeof BASE_SYMBOLS`, und die Zuweisung unten wird zum
 * Typfehler ("Type 'false' does not satisfy the constraint 'true'").
 */
type ReferencedKind = (typeof REFERENCE)[number][0];
type Extends<Type, Constraint> = Type extends Constraint ? true : false;
type AssertTrue<Check extends true> = Check;
const referenceCoversAllBaseSymbols: AssertTrue<Extends<keyof typeof BASE_SYMBOLS, ReferencedKind>> =
  true;
void referenceCoversAllBaseSymbols;

/** Erste Depiction eines Katalogeintrags — wirft aussagekräftig statt eines rohen Laufzeitfehlers. */
function primaryDepiction(kind: (typeof REFERENCE)[number][0]) {
  const [depiction] = BASE_SYMBOLS[kind].depictions;
  if (depiction === undefined) {
    throw new Error(`${kind}: BASE_SYMBOLS enthält keine Depiction.`);
  }
  return depiction;
}

describe('Grundzeichen Kapitel 1', () => {
  it.each(REFERENCE)('trifft die Referenzgeometrie von %s', (kind, asset) => {
    // Geprüft wird die Geometrie des Katalogeintrags selbst (depictions[0].drawing), nicht der
    // Rückgabewert von baseDrawing() — beides deckt sich nur, solange entry() intern baseDrawing()
    // aufruft, und ein künftiger Eintrag mit inline gebauter Geometrie darf das nicht umgehen.
    const drawing = primaryDepiction(kind).drawing;
    const result = matchFingerprint(drawing, fingerprintFor(asset));
    expect(result.problems).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it.each(REFERENCE)('trägt Quellenbezug und Reviewstatus für %s', (kind, asset) => {
    const entry = BASE_SYMBOLS[kind];
    expect(entry.depictions).toHaveLength(1);
    const depiction = primaryDepiction(kind);
    expect(depiction.variant).toBe('primary');
    expect(depiction.sourceRefs.length).toBeGreaterThan(0);
    const [sourceRef] = depiction.sourceRefs;
    if (sourceRef === undefined) {
      throw new Error(`${kind}: Depiction enthält keinen Quellenbezug.`);
    }
    expect(sourceRef.source).toBe('babz-svg-2025');
    expect(sourceRef.status).toBe('verbatim');
    expect(sourceRef.asset).toBe(asset);
    expect(sourceRef.section).toBeTruthy();
  });

  it('markiert den Körper jedes Grundzeichens mit der Rolle body', () => {
    for (const [kind] of REFERENCE) {
      const body = primaryDepiction(kind).drawing.children.find((c) => c.role === 'body');
      expect(body, `${kind} hat kein body-Primitiv`).toBeDefined();
    }
  });
});
