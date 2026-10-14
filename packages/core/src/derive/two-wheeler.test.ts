import { describe, expect, it } from 'vitest';
import { ORGANIZATION_IDS, PALETTE, type Primitive, type SymbolSpec } from '@einsatzzeichen/schema';
import { contrastRatio } from '../a11y/contrast.js';
import { drawSymbol } from '../default-ports.js';
import { baseDrawing } from '../geometry/base-symbols.js';
import { organizationColor } from '../geometry/organizations.js';
import { specialFormPrimitives, TWO_WHEELER_KINDS } from '../geometry/special-form-bodies.js';
import { renderSvg } from '../index.js';
import { NotMeasuredError } from '../not-measured.js';
import { CompositionError } from '../validate.js';

/**
 * Die Zweiräder 3.7/3.8 als Körperart (ESZ-142). Gezeichnet wird die Kapiteldatei; die
 * Organisationsfarbe geht wie am Ereignis in den Strich, Läufe stehen außen, und was im Körper
 * stünde, hat am offenen Pfad keinen Platz.
 */

const bodyOf = (children: readonly Primitive[]) => children.find((child) => child.role === 'body')!;

describe('Zweirad und Krad als Körperart', () => {
  it.each(TWO_WHEELER_KINDS)('zeichnet %s ohne weitere Felder genau wie die Kapiteldatei', (kind) => {
    const drawing = drawSymbol({ kind });
    expect(drawing.children).toEqual(specialFormPrimitives(kind));
    expect(baseDrawing(kind).children).toEqual(specialFormPrimitives(kind));
    expect(drawing.derivations ?? []).toEqual([]);
  });

  it.each(TWO_WHEELER_KINDS)('färbt an %s den Strich, nie eine Fläche', (kind) => {
    const reference = bodyOf(baseDrawing(kind).children);
    for (const organization of ORGANIZATION_IDS) {
      const drawing = drawSymbol({ kind, organization });
      const body = bodyOf(drawing.children);
      const color = organizationColor(organization);
      if (body.type !== 'path' || reference.type !== 'path') throw new Error('Pfad erwartet');
      expect(body.d, organization).toBe(reference.d);
      expect(body.style, organization).toMatchObject({
        fill: 'none',
        stroke: contrastRatio(PALETTE[color], '#ffffff') >= 3 ? color : 'schwarz',
        strokeWidth: reference.style?.strokeWidth,
        bodyStrokeDashToken: color,
      });
      expect(drawing.derivations, organization).toEqual([
        expect.objectContaining({ dimension: 'organization', basis: 'constructed' }),
      ]);
      expect(renderSvg(drawing), organization).toMatch(/<path[^>]*fill="none"/);
    }
  });

  it('setzt Läufe außen und meldet sie als abgeleitet', () => {
    const drawing = drawSymbol({
      kind: 'motorized-two-wheeler',
      organization: 'polizei',
      labels: { aboveLeft: 'Krad 1', belowRight: 'POL' },
    });
    const dimensions = (drawing.derivations ?? []).map((note) => note.dimension).sort();
    expect(dimensions).toEqual(['labels.aboveLeft', 'labels.belowRight', 'organization']);
    expect(drawing.children.filter((child) => child.type === 'text')).toHaveLength(2);
  });

  it.each<[string, Partial<SymbolSpec>]>([
    ['mittiger Lauf', { labels: { center: 'K' } }],
    ['Lauf oben links', { labels: { topLeft: 'K' } }],
    ['Lauf unten mittig', { labels: { bottomCenter: 'K' } }],
    ['Fähigkeit', { capabilities: ['cbrn-protection'] }],
    ['Körpermarke', { bodyMarks: ['fire-fighting'] }],
    ['weiße Innenkontur', { whiteInnerContour: true, organization: 'thw' }],
  ])('lehnt %s im Körper als Grenze der Form ab', (_name, fields) => {
    for (const kind of TWO_WHEELER_KINDS) {
      expect(() => drawSymbol({ kind, ...fields } as SymbolSpec), kind).toThrow(NotMeasuredError);
    }
  });

  it('lehnt eine Fahrzeugkategorie über die Fahrwerksregel ab: die Form zeigt das Rad selbst', () => {
    try {
      drawSymbol({ kind: 'motorized-two-wheeler', vehicleCategory: 'kfz-kategorie-1' });
      throw new Error('erwartet: CompositionError');
    } catch (error) {
      expect(error).toBeInstanceOf(CompositionError);
      expect((error as CompositionError).issues.map((issue) => issue.rule)).toEqual([
        'vehicle-category-requires-chassis-body',
      ]);
    }
  });
});
