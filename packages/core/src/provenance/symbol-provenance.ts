import type { SymbolSpec } from '@einsatzzeichen/schema';
import { specKey } from '../spec-key.js';
import { VERBATIM_TABLE } from './verbatim-table.generated.js';

/**
 * Herkunft eines Zeichens (LFH-581): `verbatim` oder `derived`.
 *
 * **Was `verbatim` hier heißt — und was nicht.** Die Spec ist, bis auf die Reihenfolge der Felder
 * und der Einträge in `bodyMarks`/`capabilities` (siehe `specKey`), gleich einer Fixture des
 * Prüfpakets, deren **Körperhülle** dem Original entspricht. Der zugrunde liegende Vergleich
 * (`matchFingerprint`) prüft nur die vier Kanten des Körpers. Kopfzone, Piktogramme, Körpermarken
 * und Beschriftung sind damit **nicht** belegt. Deshalb steht `claim: 'body-hull'` in jedem
 * `verbatim`-Ergebnis. Ein nacktes „verbatim“ würde mehr behaupten, als der Vergleich belegt.
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
    /** Was belegt ist: heute ausschließlich die Körperhülle. */
    readonly claim: 'body-hull';
    /** Abschnittskennung der Fixture im Prüfpaket, etwa `D.1.4`. */
    readonly fixture: string;
    /** Dateiname des Originals, gegen das die Körperhülle verglichen ist. */
    readonly referenceAsset: string;
  }
  | { readonly status: 'derived' };

type VerbatimProvenance = Extract<SymbolProvenance, { status: 'verbatim' }>;

let byKey: ReadonlyMap<string, VerbatimProvenance> | undefined;

/** Baut den Index beim ersten Aufruf aus der generierten Tabelle (241 Zeilen). */
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
  byKey = built;
  return built;
}

const DERIVED: SymbolProvenance = Object.freeze({ status: 'derived' });

/**
 * Herkunft einer Spec: `verbatim` (mit `claim: 'body-hull'`, Fixture und Referenz), wenn ihr
 * `specKey` dem einer Fixture mit bestandenem Körpervergleich gleicht, sonst `derived`. Siehe die
 * Einschränkung am Typ `SymbolProvenance`. Die Spec wird nicht validiert; eine ungültige Spec ist
 * schlicht keine Fixture.
 */
export function symbolProvenance(spec: SymbolSpec): SymbolProvenance {
  return index().get(specKey(spec)) ?? DERIVED;
}
