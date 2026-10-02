import { describe, expect, it } from 'vitest';
import { ORGANIZATION_IDS, type Primitive } from '@einsatzzeichen/schema';
import { drawSymbol } from '../default-ports.js';
import { baseDrawing } from '../geometry/base-symbols.js';
import { organizationColor } from '../geometry/organizations.js';
import { renderSvg } from '../index.js';

/**
 * Organisation und technische Füllung am offenen Polyzug von `1.13 Ereignis`
 * (Eigentümerentscheid 02.10.2026: zulassen, abgeleitet). Die Farbe geht in den Strich; Lage und
 * Form des Hakens bleiben verbatim.
 */

const bodyOf = (children: readonly Primitive[]) => children.find((child) => child.role === 'body')!;
const reference = bodyOf(baseDrawing('event').children);

describe('Farbe am Ereignis (offener Polyzug)', () => {
  it('zeichnet jede Organisation als Strichfarbe, ohne den Haken zu schließen', () => {
    for (const organization of ORGANIZATION_IDS) {
      const drawing = drawSymbol({ kind: 'event', organization });
      const body = bodyOf(drawing.children);
      const color = organizationColor(organization);
      expect(body.type, organization).toBe('polyline');
      if (body.type !== 'polyline' || reference.type !== 'polyline') throw new Error('Polyzug erwartet');
      expect(body.closed, organization).not.toBe(true);
      expect(body.points, organization).toEqual(reference.points);
      expect(body.style, organization).toMatchObject({
        fill: 'none',
        // Weiß verschwände auf der weißen Oberfläche; die Hilfsorganisation bleibt schwarz wie
        // an jedem geschlossenen Körper, wo sie nur die Grundfüllung trägt.
        stroke: color === 'weiss' ? 'schwarz' : color,
        strokeWidth: reference.style?.strokeWidth,
        bodyStrokeDashToken: color,
      });
      expect(drawing.derivations, organization).toEqual([
        expect.objectContaining({ dimension: 'organization', basis: 'constructed' }),
      ]);
      // Keine Fläche im SVG: der Polyzug trägt fill="none".
      expect(renderSvg(drawing), organization).toMatch(/<polyline[^>]*fill="none"/);
    }
  });

  it('färbt mit einer technischen Füllung ebenso den Strich, ohne Organisationssignatur', () => {
    const drawing = drawSymbol({ kind: 'event', technicalFill: 'rot' });
    const body = bodyOf(drawing.children);
    expect(body.style).toMatchObject({ fill: 'none', stroke: 'rot' });
    expect(body.style?.bodyStrokeDashToken).toBeUndefined();
    expect(drawing.derivations?.[0]).toMatchObject({ dimension: 'technicalFill' });
  });

  it('setzt einen Lauf im Ereignis schwarz, weil keine Fläche hinter ihm liegt', () => {
    const drawing = drawSymbol({ kind: 'event', organization: 'feuerwehr', labels: { center: 'AB' } });
    const label = drawing.children.find((child) => child.role === 'label');
    expect(label?.style?.fill).toBe('schwarz');
  });

  it('lässt das Ereignis ohne Farbe unverändert und ohne Notiz', () => {
    const drawing = drawSymbol({ kind: 'event' });
    expect(bodyOf(drawing.children)).toEqual(reference);
    expect(drawing.derivations).toBeUndefined();
  });
});
