import type {
  BodyMarkId,
  CapabilityId,
  PictogramDefinition,
  Primitive,
  SymbolSpec,
} from '@einsatzzeichen/schema';
import type { BoundsMm } from '../bounds.js';
import { CAPABILITY_UNSCALED_FIT, capabilityInsetForm } from '../blocks/capability-inset.js';
import { bodyRegion } from './body-region.js';
import { fitPictograms } from './fit-pictogram.js';
import { noteDerivation } from './record.js';

/**
 * Fähigkeiten in der Boxfassung (`SymbolSpec.capabilities`) an jeder Körperform. Drei Wege, je
 * Fähigkeit genau einer:
 *
 * 1. **Vermessene Körperfassung am Paar** (`capabilityInsetForm`): gezeichnet wie
 *    `bodyMarks: [x]`, verbatim und ohne Vermerk. Die Referenz zeigt das Piktogramm an diesem
 *    Paar in genau dieser Fassung; bis zum 2. Oktober 2026 lehnte `validateSpec` den Weg über
 *    `capabilities` ab (`capabilities-pictogram-has-measured-rendition`, LFH-787 „AB“) und
 *    verwies auf `bodyMarks`. Die Umleitung leistet jetzt der Motor.
 * 2. **Nachweislich unskaliert im Körper** (`CAPABILITY_UNSCALED_FIT`, genau eine Fähigkeit, keine
 *    Körpervariante, Körper in Grundgröße): unverändert wie bisher, die Gruppe folgt der
 *    Körpermitte.
 * 3. **Sonst**: die Einzeldarstellung eingepasst ins Innenfeld (`fitPictograms`), mit Vermerk.
 */

/** Die Fähigkeiten, die an diesem Paar eine vermessene Körperfassung haben (Weg 1). */
function inBodyCapabilities(spec: SymbolSpec): CapabilityId[] {
  return (spec.capabilities ?? []).filter(
    (id) => capabilityInsetForm(id, spec.kind, spec.bodyVariant) !== undefined,
  );
}

/**
 * Die Körpermarken, die `compose()` zeichnet: `bodyMarks` und dahinter die Fähigkeiten mit
 * vermessener Körperfassung, ohne Dublette. `undefined`, wenn es keine gibt — so bleibt der
 * Kontext jeder vermessenen Komposition unverändert.
 */
export function composedBodyMarks(spec: SymbolSpec): readonly BodyMarkId[] | undefined {
  const own = spec.bodyMarks ?? [];
  const moved = inBodyCapabilities(spec).filter((id) => !own.includes(id));
  if (moved.length === 0) return spec.bodyMarks;
  return [...own, ...moved];
}

/**
 * Die Boxpiktogramme einer Komposition (Wege 2 und 3) als eine Gruppe `role: 'pictogram'`.
 *
 * `placedBodyMm` ist die Hülle des platzierten Körpers, `shiftMm` die senkrechte Verschiebung
 * der Körpermitte gegenüber der Grundzeichnung. Die unskalierte Einzeldarstellung (Weg 2) trägt
 * diese Verschiebung wie bisher an der Gruppe (C.1.1: Piktogramm folgt dem verschobenen Körper);
 * eingepasste Darstellungen (Weg 3) sind schon an der platzierten Hülle gerechnet und stehen ohne
 * Verschiebung.
 */
export function capabilityPictograms(
  spec: SymbolSpec,
  /** Die Einzeldarstellung einer Fähigkeit (`CatalogPorts.pictogram` mit präfigierter ID). */
  pictogram: (id: CapabilityId) => PictogramDefinition,
  placedBodyMm: BoundsMm,
  shiftMm: number,
): Primitive[] {
  const inBody = inBodyCapabilities(spec);
  const box = (spec.capabilities ?? []).filter((id) => !inBody.includes(id));
  if (box.length === 0) return [];
  const group = (children: Primitive[]): Primitive[] => [
    {
      type: 'group',
      role: 'pictogram',
      transform: { translate: { dxMm: 0, dyMm: shiftMm } },
      children,
    },
  ];
  const fits = CAPABILITY_UNSCALED_FIT.find((entry) => entry.kind === spec.kind);
  // Belegt ist die unskalierte Einsetzbarkeit nur am Körper in Grundgröße. Verkleinert die
  // Komposition ihn (Raute unter einer Kopfzone), gilt der Nachweis nicht mehr: dann eingepasst.
  const baseHull = bodyRegion(spec.kind, spec.bodyVariant).hull;
  const fullSize =
    Math.abs((placedBodyMm.maxX - placedBodyMm.minX) - (baseHull.maxX - baseHull.minX)) <= 0.01 &&
    Math.abs((placedBodyMm.maxY - placedBodyMm.minY) - (baseHull.maxY - baseHull.minY)) <= 0.01;
  if (
    box.length === 1 &&
    spec.bodyVariant === undefined &&
    fullSize &&
    fits !== undefined &&
    fits.capabilities.includes(box[0] as CapabilityId)
  ) {
    return group([...pictogram(box[0] as CapabilityId).primitives]);
  }
  const region = bodyRegion(spec.kind, spec.bodyVariant, placedBodyMm);
  const fitted = fitPictograms(box.map((id) => pictogram(id).primitives), region);
  for (const id of box) {
    noteDerivation({
      dimension: 'capabilities',
      part: `Einzeldarstellung ${id} ins Innenfeld eingepasst`,
      basis: 'transferred',
      from: `Kapitel 4, capability.${id}`,
    });
  }
  if (box.length > 1) {
    noteDerivation({
      dimension: 'capabilities',
      part: `${box.length} Boxpiktogramme nebeneinander`,
      basis: 'constructed',
      from: 'Teilung des Innenfelds',
    });
  }
  return [{ type: 'group', role: 'pictogram', children: fitted.flat() }];
}
