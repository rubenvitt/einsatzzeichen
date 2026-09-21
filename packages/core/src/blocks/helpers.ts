import type {
  BlockBinding,
  BlockCategory,
  BlockCombinationBinding,
  BlockEntry,
  BlockId,
  BlockZone,
  SourceReference,
} from '@einsatzzeichen/schema';

/**
 * Referenzabschnitte als Herkunft. Der Status ist `derived` und nicht `verbatim`, aus demselben
 * Grund wie im Zonenmodell: `verbatim` verlangt einen Fingerprint, und ein Registereintrag trägt
 * keinen.
 */
export function babz(...sections: readonly string[]): readonly SourceReference[] {
  return sections.map((section) => ({
    source: 'babz-svg-2025' as const,
    section,
    status: 'derived' as const,
  }));
}

export function measured(
  definedAt: string,
  note: string,
  sourceRefs?: readonly SourceReference[],
): BlockBinding {
  return {
    status: 'measured',
    geometry: sourceRefs === undefined ? { definedAt, note } : { definedAt, note, sourceRefs },
  };
}

export function notMeasured(definedAt: string, reason: string): BlockBinding {
  return { status: 'not-measured', gap: { definedAt, reason } };
}

export function measuredAbsent(definedAt: string, reason: string): BlockBinding {
  return { status: 'measured-absent', gap: { definedAt, reason } };
}

export function block(
  category: BlockCategory,
  valueId: string,
  zone: BlockZone,
  binding: BlockBinding,
  combinationBinding?: BlockCombinationBinding,
): BlockEntry {
  const id = `${category}/${valueId}` as BlockId;
  return combinationBinding === undefined
    ? { id, category, valueId, zone, binding }
    : { id, category, valueId, zone, binding, combinationBinding };
}
