import {
  ARIMO_TEXT_METRICS,
  administrativeHead,
  baseDrawing,
  bodyMark,
  compose,
  functionRole,
  innerField,
  measureCapabilityInset,
  organizationColor,
  pictogram,
  strengthHead,
  technicalHeadMark,
  vehicleChassis,
  type CapabilityInsetMeasurement,
  type CatalogPorts,
} from '@einsatzzeichen/core';
import {
  CAPABILITY_IDS,
  type BodyVariantId,
  type CapabilityId,
  type SymbolKind,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { GRAMMAR_FIXTURES } from './recipes.js';

/**
 * Die Messpunkte von LFH-587: jede Körperfassung eines Kapitel-4-Piktogramms, die eine Fixture
 * über `bodyMarks` zeichnet, gegen die Einzeldarstellung desselben Piktogramms.
 *
 * **Gemessen wird am Motor, mit genau dem Aufruf, den `compose()` macht.** Die Ports sind die des
 * Katalogs; nur `bodyMark` ist umwickelt und schreibt mit, was `compose()` für jede Marke mit
 * welchem Kontext und welcher Körperhülle anfordert. So braucht die Messung keine eigene
 * Nachbildung des Kontexts wie `capability-combination-fixtures.test.ts`, und sie kann von
 * `compose()` nicht abweichen.
 *
 * Die Körperfassungen selbst sind in PR #56 und davor an den Referenzdateien abgelesen. Diese
 * Messung liest sie nur aus dem Katalog zurück; die Referenzdateien liegen nicht im Repository.
 */
export interface CapabilityInsetEvidence {
  readonly fixture: string;
  readonly capability: CapabilityId;
  readonly kind: SymbolKind;
  readonly variant?: BodyVariantId;
  /** Ob die Fixture mehr als eine Körpermarke trägt. */
  readonly combination: boolean;
  readonly measurement: CapabilityInsetMeasurement;
}

const CAPABILITIES = new Set<string>(CAPABILITY_IDS);

function isCapability(id: string): id is CapabilityId {
  return CAPABILITIES.has(id);
}

function evidenceOf(fixture: string, spec: SymbolSpec): CapabilityInsetEvidence[] {
  const found: CapabilityInsetEvidence[] = [];
  const combination = (spec.bodyMarks?.length ?? 0) > 1;
  const ports: CatalogPorts = {
    baseDrawing,
    innerField,
    organizationColor,
    strengthHead,
    technicalHeadMark,
    functionRole,
    administrativeHead,
    vehicleChassis,
    pictogram,
    textMetrics: ARIMO_TEXT_METRICS,
    bodyMark: (id, context, bounds) => {
      const drawn = bodyMark(id, context, bounds);
      if (isCapability(id)) {
        found.push({
          fixture,
          capability: id,
          kind: context.kind,
          ...(context.bodyVariant === undefined ? {} : { variant: context.bodyVariant }),
          combination,
          measurement: measureCapabilityInset(
            drawn,
            pictogram(`capability.${id}`).primitives,
            bounds,
          ),
        });
      }
      return drawn;
    },
  };
  compose(spec, ports, {});
  return found;
}

/** Alle Messpunkte, in Fixture-Reihenfolge. */
export const CAPABILITY_INSET_EVIDENCE: readonly CapabilityInsetEvidence[] = Object.freeze(
  (Object.entries(GRAMMAR_FIXTURES) as [string, { spec: SymbolSpec }][])
    .filter(([, recipe]) => (recipe.spec.bodyMarks ?? []).some(isCapability))
    .flatMap(([fixture, recipe]) => evidenceOf(fixture, recipe.spec)),
);
