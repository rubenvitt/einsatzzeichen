import type { SymbolSpec } from '@einsatzzeichen/schema';
import { specKey } from '../spec-key.js';
import { REFERENCE_FILE_TABLE, VERBATIM_TABLE } from './verbatim-table.generated.js';

/**
 * Herkunft eines Zeichens (LFH-581): `verbatim` oder `derived`.
 *
 * **Was `verbatim` hier heißt — und was nicht.** Zwei Belege, am Feld `claim` unterschieden:
 *
 * - `claim: 'body-hull'`: Die Spec ist, bis auf die Reihenfolge der Felder und der Einträge in
 *   `bodyMarks`/`capabilities` (siehe `specKey`), gleich einer Fixture des Prüfpakets, deren
 *   **Körperhülle** dem Original entspricht. Der zugrunde liegende Vergleich (`matchFingerprint`)
 *   prüft nur die vier Kanten des Körpers. Kopfzone, Piktogramme, Körpermarken und Beschriftung
 *   sind damit **nicht** belegt. Ein nacktes „verbatim“ würde mehr behaupten, als der Vergleich
 *   belegt.
 * - `claim: 'reference-file'` (ESZ-136): Die Spec zeichnet dieselbe Geometrie wie die
 *   Einzeldarstellung einer Kapiteldatei im Piktogrammregister, ohne abgeleiteten Teil. Das sind
 *   die kanonischen Specs der Personenzustände 5.8.8 und der Hinweise an der Gefahr (5.8.1.13/14,
 *   zweite Darstellung). Derselbe Beleg wie bei `freestandingProvenance`: Die Bilder des Registers
 *   sind in ihren Suiten gegen das Kennzahlenartefakt gegatet, die Gleichheit der Geometrie prüft
 *   das Prüfpaket beim Erzeugen der Tabelle.
 *
 * `derived` heißt: Der Motor setzt das Zeichen aus der Grammatik zusammen, ein Original dazu ist
 * nicht belegt. Es behauptet **keine** fachliche Freigabe.
 *
 * Einen Reviewstand trägt das Ergebnis bewusst nicht: Der fachliche Prüfstand lebt im Prüfpaket
 * und ist dort optional zuschaltbar (`combinationProvenance`, `provenanceReview` in
 * `@einsatzzeichen/conformance`).
 */
export type SymbolProvenance =
  | {
    readonly status: 'verbatim';
    /** Was belegt ist: die Körperhülle. */
    readonly claim: 'body-hull';
    /** Abschnittskennung der Fixture im Prüfpaket, etwa `D.1.4`. */
    readonly fixture: string;
    /** Dateiname des Originals, gegen das die Körperhülle verglichen ist. */
    readonly referenceAsset: string;
  }
  | {
    readonly status: 'verbatim';
    /** Was belegt ist: die Zeichnung ist die vermessene Darstellung dieser Referenzdatei. */
    readonly claim: 'reference-file';
    /** Abschnitt der Referenz, etwa `5.8.8.7` oder `5.8.1.13`. */
    readonly section: string;
    readonly referenceAsset: string;
  }
  | { readonly status: 'derived' };

type VerbatimProvenance = Extract<SymbolProvenance, { status: 'verbatim' }>;

let byKey: ReadonlyMap<string, VerbatimProvenance> | undefined;

/** Baut den Index beim ersten Aufruf aus den beiden generierten Tabellen. */
function index(): ReadonlyMap<string, VerbatimProvenance> {
  if (byKey !== undefined) return byKey;
  const built = new Map<string, VerbatimProvenance>();
  for (const [key, fixture, referenceAsset] of VERBATIM_TABLE) {
    built.set(key, Object.freeze({
      status: 'verbatim',
      claim: 'body-hull',
      fixture,
      referenceAsset,
    }));
  }
  // Der Generator hält beide Tabellen schlüsselfremd; eine Spec hat genau einen Beleg.
  for (const [key, section, referenceAsset] of REFERENCE_FILE_TABLE) {
    built.set(key, Object.freeze({
      status: 'verbatim',
      claim: 'reference-file',
      section,
      referenceAsset,
    }));
  }
  byKey = built;
  return built;
}

const DERIVED: SymbolProvenance = Object.freeze({ status: 'derived' });

/**
 * Herkunft einer Spec: `verbatim`, wenn ihr `specKey` dem einer Fixture mit bestandenem
 * Körpervergleich gleicht (`claim: 'body-hull'`, mit Fixture und Referenz) oder dem einer Spec, die
 * genau eine Kapiteldatei des Registers zeichnet (`claim: 'reference-file'`, mit Abschnitt und
 * Referenz); sonst `derived`. Siehe die Einschränkung am Typ `SymbolProvenance`. Die Spec wird nicht
 * validiert; eine ungültige Spec ist schlicht keine Fixture.
 */
export function symbolProvenance(spec: SymbolSpec): SymbolProvenance {
  return index().get(specKey(spec)) ?? DERIVED;
}
