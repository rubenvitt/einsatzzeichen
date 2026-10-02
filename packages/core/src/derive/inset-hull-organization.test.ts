import { describe, expect, it } from 'vitest';
import { ORGANIZATION_IDS, type Primitive } from '@einsatzzeichen/schema';
import { drawSymbol } from '../default-ports.js';
import { baseDrawing } from '../geometry/base-symbols.js';
import { organizationColor } from '../geometry/organizations.js';

/**
 * Organisation am Einsatzbootrumpf (`vehicle-water` / `inset-hull`). Vermessen sind die
 * Hilfsorganisation und die Feuerwehr; jede andere Organisation und das Boot ohne Organisation
 * färbt der Motor wie jeden geschlossenen Körper (Eigentümerentscheid 02.10.2026).
 */

const bodyOf = (children: readonly Primitive[]) => children.find((child) => child.role === 'body')!;
const hull = bodyOf(baseDrawing('vehicle-water', 'inset-hull').children);

describe('Organisation am eingesenkten Rumpf', () => {
  it('füllt den unveränderten Rumpf in jeder Organisationsfarbe', () => {
    for (const organization of ORGANIZATION_IDS) {
      if (organization === 'feuerwehr') continue; // vermessen nur mit Feuerlöschmarke
      const drawing = drawSymbol({ kind: 'vehicle-water', bodyVariant: 'inset-hull', organization, labels: { center: 'MzB' } });
      const body = bodyOf(drawing.children);
      expect(body.type === 'path' && hull.type === 'path' ? body.d : null, organization).toBe(
        hull.type === 'path' ? hull.d : undefined,
      );
      expect(body.style?.fill, organization).toBe(organizationColor(organization));
      const notes = drawing.derivations ?? [];
      if (organization === 'hilfsorganisation') {
        expect(notes, organization).toEqual([]);
      } else {
        expect(notes, organization).toEqual([
          expect.objectContaining({ dimension: 'organization', basis: 'transferred' }),
        ]);
      }
    }
  });

  it('zeichnet das Boot ohne Organisation ungefüllt und markiert es als abgeleitet', () => {
    const drawing = drawSymbol({ kind: 'vehicle-water', bodyVariant: 'inset-hull' });
    expect(bodyOf(drawing.children).style).toEqual(hull.style);
    expect(drawing.derivations).toEqual([expect.objectContaining({ dimension: 'organization' })]);
  });

  it('lässt die vermessene Feuerwehrfassung ohne Notiz', () => {
    const drawing = drawSymbol({
      kind: 'vehicle-water', bodyVariant: 'inset-hull', organization: 'feuerwehr', bodyMarks: ['fire-fighting'],
    });
    expect(drawing.derivations).toBeUndefined();
  });
});
