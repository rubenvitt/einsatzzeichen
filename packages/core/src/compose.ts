import {
  DEFAULT_VIEWBOX_MM,
  type CapabilityId,
  type ColorToken,
  type Drawing,
  type HeadShape,
  type OrganizationId,
  type Primitive,
  type StrengthId,
  type SymbolKind,
  type SymbolSpec,
} from '@einsatzzeichen/schema';
import { boundsOfMm, shiftY } from './bounds.js';
import { placeHead, profileFor } from './layout/profiles.js';
import { validateSpec } from './validate.js';

/** Senkrechte Mitte der Hülle eines Primitivs, in Millimetern. */
function centerYMm(primitive: Primitive): number {
  const bounds = boundsOfMm(primitive);
  return (bounds.minY + bounds.maxY) / 2;
}

/** Zugriffe auf den Katalog. Als Ports übergeben, damit core nicht von catalog abhängt. */
export interface CatalogPorts {
  baseDrawing(kind: SymbolKind): Drawing;
  organizationColor(id: OrganizationId): ColorToken;
  strengthHead(id: StrengthId): HeadShape;
  capabilityPictogram(id: CapabilityId): Primitive[];
}

export class CompositionError extends Error {
  constructor(readonly issues: ReturnType<typeof validateSpec>) {
    super(
      `Unzulässige Kombination:\n${issues.map((i) => `  [${i.rule}] ${i.message}`).join('\n')}`,
    );
    this.name = 'CompositionError';
  }
}

export function compose(spec: SymbolSpec, catalog: CatalogPorts): Drawing {
  const issues = validateSpec(spec);
  if (issues.length > 0) throw new CompositionError(issues);

  const base = catalog.baseDrawing(spec.kind);
  const body = base.children.find((child) => child.role === 'body');
  if (!body) throw new Error(`Grundzeichen "${spec.kind}" hat kein body-Primitiv.`);

  const profile = profileFor(spec.kind);
  const headShape = spec.strength !== undefined ? catalog.strengthHead(spec.strength) : null;

  // Dieselbe Kopfzone sitzt je nach Körperform unterschiedlich hoch — deshalb
  // rechnet erst placeHead die relativen Marken in absolute Koordinaten um.
  const headBox = headShape ? placeHead(profile, headShape.heightMm) : null;
  const headPrimitives: Primitive[] =
    headShape && headBox
      ? headShape.marks.map((mark) => ({
          type: 'circle',
          role: 'head',
          cx: mark.cxMm,
          cy: headBox.topMm + mark.cyFromTopMm,
          r: mark.rMm,
          style: { fill: 'schwarz' },
        }))
      : [];

  const placedBody = profile.place(body, headBox?.bottomMm ?? null);

  const filled: Primitive =
    spec.organization !== undefined
      ? {
          ...placedBody,
          style: { ...placedBody.style, fill: catalog.organizationColor(spec.organization) },
        }
      : placedBody;

  // Piktogramme sind auf den unverschobenen Körper hin entworfen (Mitte bei 16 mm). Der
  // Kompositionsmotor kann den Körper senkrecht verschieben oder verkleinern, um Platz für die
  // Kopfzone zu schaffen — das Piktogramm muss dieser Körpermitte folgen, sonst sitzt es an der
  // absoluten Referenzstelle statt an der tatsächlichen Körpermitte. Die Referenz belegt das:
  // C.1.1 (Stapel, Körper verschoben) verschiebt das Piktogramm um dieselben 3 mm, C.1.2
  // (Reihe, Körper unverschoben) lässt es unverändert.
  const pictogramShiftMm = centerYMm(placedBody) - centerYMm(body);
  const pictograms = (spec.capabilities ?? [])
    .flatMap((id) => catalog.capabilityPictogram(id))
    .map((primitive) => shiftY(primitive, pictogramShiftMm));

  return {
    viewBox: DEFAULT_VIEWBOX_MM,
    children: [...headPrimitives, filled, ...pictograms],
    ...(base.title !== undefined ? { title: base.title } : {}),
  };
}
