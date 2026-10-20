import type { BodyMarkId, BodyMarkRenditionId, BodyVariantId, SymbolKind } from '@einsatzzeichen/schema';

/**
 * Läufe, die eine Körpermarke selbst mitbringt (ESZ-132).
 *
 * Die Dekontamination unterscheidet Personal und Gerät nicht am Piktogramm: 4.1.3 hat keine
 * Fassung mit Zusatz. Die Referenz setzt den Buchstaben als mittigen Lauf in die Lücke zwischen
 * den beiden Klammern der Zange — „P“ in C.1.8 und C.2.25, „G“ in C.1.10, jeweils in der Ebene
 * „Takt. Zeichen (Typo)“. Die Marke ist dafür gebaut: in C.1.8 kreuzt die Zange 1,5 mm über der
 * Körpermitte, „damit darunter der mittige Lauf Platz hat“ (`body-marks-anhang-c/formation.ts`).
 *
 * Diese Tabelle hält die Lage dieses Laufs **an der Marke**, je vermessenem Paar. Trägt eine Spec
 * die Marke und einen mittigen Lauf ohne eigene Lage, steht der Lauf hier; an jedem anderen Körper
 * folgt er der übertragenen Marke (`derive/body-marks.ts`, `bodyMarkRun`).
 */
export interface MeasuredBodyMarkRun {
  /** Anker ab der linken Körperkante; fehlt er, steht der Lauf auf der Körpermitte. */
  readonly anchorFromBodyLeftMm?: number;
  readonly baselineFromBodyBottomMm: number;
  readonly capHeightMm: number;
}

interface RunEntry {
  readonly id: BodyMarkId;
  readonly kind: SymbolKind;
  readonly bodyVariant?: BodyVariantId;
  readonly rendition?: BodyMarkRenditionId;
  readonly run: MeasuredBodyMarkRun;
}

const RUNS: readonly RunEntry[] = Object.freeze([
  /**
   * C.1.8 „P“ und C.1.10 „G“: Grundlinie 3 mm über der Körperunterkante (C.1.8 y 26,0 bei
   * Unterkante 29,0; C.1.10 y 23,0 bei 26,0), Versalhöhe 4,8693 (C.1.8) bzw. 4,87 ohne Überhang
   * (C.1.10), beide auf der Körpermitte. Versalhöhe als Normgrad des mittigen Laufs, 4,87.
   */
  { id: 'decontamination', kind: 'formation', run: { baselineFromBodyBottomMm: 3, capHeightMm: 4.87 } },
  /**
   * C.2.25 „P“: das „P“ aus C.1.8 auf 0,5995 verkleinert, Grundlinie y 23,0 (3 mm über der
   * Unterkante 26), Anker 21,3 mm ab der linken Körperkante. Messung im Rezept
   * (`conformance/src/recipes-anhang-c/cbrn-transport-water.ts`).
   */
  {
    id: 'decontamination',
    kind: 'vehicle-land',
    run: { anchorFromBodyLeftMm: 21.3, baselineFromBodyBottomMm: 3, capHeightMm: 2.919225 },
  },
  /** C.2.25#alternative „P“ im Normgrad, Grundlinie 2 mm über der Unterkante, Anker 15,5 mm. */
  {
    id: 'decontamination',
    kind: 'vehicle-land',
    rendition: 'centered-large-tongs',
    run: { anchorFromBodyLeftMm: 15.5, baselineFromBodyBottomMm: 2, capHeightMm: 4.87 },
  },
]);

/**
 * Der vermessene Lauf dieser Marke an genau diesem Paar, oder `undefined`. Die Fassung muss
 * passen wie in `anhangCBodyMarkBuild`: ohne Kennung nur die Grundfassung.
 */
export function measuredBodyMarkRun(
  id: BodyMarkId,
  context: {
    readonly kind: SymbolKind;
    readonly bodyVariant?: BodyVariantId;
    readonly rendition?: BodyMarkRenditionId;
  },
): MeasuredBodyMarkRun | undefined {
  return RUNS.find((entry) =>
    entry.id === id &&
    entry.kind === context.kind &&
    entry.bodyVariant === context.bodyVariant &&
    entry.rendition === context.rendition)?.run;
}

/** Die Marken, die überhaupt einen eigenen Lauf führen. */
export const BODY_MARKS_WITH_RUN: readonly BodyMarkId[] = Object.freeze(
  [...new Set(RUNS.map((entry) => entry.id))],
);
