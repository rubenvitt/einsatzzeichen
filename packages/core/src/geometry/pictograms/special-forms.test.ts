import { describe, expect, it } from 'vitest';
import {
  PICTOGRAM_IDS,
  SPECIAL_FORM_PICTOGRAM_IDS,
  type PictogramId,
  type SpecialFormPictogramId,
  type ZoneBoundsMm,
} from '@einsatzzeichen/schema';
import { drawFreestanding } from '../../draw-freestanding.js';
import { specialForm } from '../../layout/special-forms.js';
import { checkBox, checkCommands } from '../../pictogram-gate.js';
import { decodeAnySpecParam, encodeAnySpecParam, parseAnySpec, serializeAnySpec } from '../../spec-codec.js';
import { freestandingVocabulary } from '../../vocabulary.js';
import { specialFormDrawing } from '../special-form-bodies.js';
import { SPECIAL_FORM_PICTOGRAMS, pictogram } from './index.js';

/**
 * Die Sonderformen 3.6 bis 3.8 im Piktogrammraum `special-form.*` (ESZ-134). Gehalten wird, dass
 * der Raum keine zweite Geometriequelle ist: dieselben Primitive wie `specialFormDrawing`, dieselbe
 * Datei und dieselbe Hülle wie `SPECIAL_FORMS`.
 */

const HULL_MEASURE: Readonly<Record<SpecialFormPictogramId, string>> = {
  drone: 'reference-hull',
  'two-wheeler': 'ink-hull',
  'motorized-two-wheeler': 'ink-hull',
};

function bodyHull(id: SpecialFormPictogramId): ZoneBoundsMm {
  const body = specialForm(id).zones.body;
  if (body.status !== 'measured') throw new Error(`${id}: Körperzone nicht vermessen`);
  const measure = body.measures.find((candidate) => candidate.id === HULL_MEASURE[id]);
  if (measure?.kind !== 'bounds') throw new Error(`${id}: keine Hülle ${HULL_MEASURE[id]}`);
  return measure.boundsMm;
}

describe('Sonderformen als Piktogramm (ESZ-134)', () => {
  it('führt 3.6 bis 3.8 im Raum special-form.*, ohne 3.9', () => {
    expect(SPECIAL_FORM_PICTOGRAMS.map((definition) => [definition.section, definition.id])).toEqual([
      ['3.6', 'special-form.drone'],
      ['3.7', 'special-form.two-wheeler'],
      ['3.8', 'special-form.motorized-two-wheeler'],
    ]);
    expect(PICTOGRAM_IDS.filter((id) => id.startsWith('special-form.'))).toEqual(
      SPECIAL_FORM_PICTOGRAM_IDS.map((id) => `special-form.${id}`),
    );
    expect(() => pictogram('special-form.temporary-fixed-structure' as PictogramId)).toThrow(/Kein Piktogramm/u);
  });

  it.each(SPECIAL_FORM_PICTOGRAM_IDS)('%s: zeichnet die Kapiteldatei aus special-form-bodies.ts, nur als Piktogramm', (id) => {
    const definition = pictogram(`special-form.${id}`);
    const form = specialForm(id);
    expect(definition.title).toBe(form.title);
    expect(definition.referenceAsset).toBe(form.asset);
    expect(definition.section).toBe(form.section);
    expect(definition.viewBox).toEqual(specialFormDrawing(id).viewBox);
    expect(definition.primitives).toEqual(
      specialFormDrawing(id).children.map((primitive) => ({ ...primitive, role: 'pictogram' })),
    );
  });

  it.each(SPECIAL_FORM_PICTOGRAM_IDS)('%s: die Box ist die Hülle der Körperzone aus SPECIAL_FORMS', (id) => {
    const { box } = pictogram(`special-form.${id}`);
    const hull = bodyHull(id);
    expect({ minX: box.xMm, minY: box.yMm, maxX: box.xMm + box.widthMm, maxY: box.yMm + box.heightMm }).toEqual(hull);
    expect([...checkCommands(pictogram(`special-form.${id}`)), ...checkBox(pictogram(`special-form.${id}`))]).toEqual([]);
  });

  it.each(SPECIAL_FORM_PICTOGRAM_IDS)('%s: steht freistehend als Spec, serialisiert und gezeichnet', (id) => {
    const spec = { kind: 'pictogram', pictogram: `special-form.${id}` } as const;
    expect(parseAnySpec(serializeAnySpec(spec))).toEqual(spec);
    expect(decodeAnySpecParam(encodeAnySpecParam(spec))).toEqual(spec);
    const drawing = drawFreestanding(spec);
    expect(drawing.children).toEqual(pictogram(`special-form.${id}`).primitives);
    expect(drawing.description).toBe(`Sonderform: ${specialForm(id).title}`);
    expect(drawing.derivations).toBeUndefined();
  });

  it('bietet die drei im Vokabular des freistehenden Piktogramms an, ohne zweite Darstellung', () => {
    const options = freestandingVocabulary({ kind: 'pictogram', pictogram: 'special-form.drone' }, 'pictogram');
    const specialForms = options.filter((option) => option.value.startsWith('special-form.'));
    expect(specialForms.map((option) => [option.value, option.status])).toEqual([
      ['special-form.drone', 'allowed'],
      ['special-form.two-wheeler', 'allowed'],
      ['special-form.motorized-two-wheeler', 'allowed'],
    ]);
    const variants = freestandingVocabulary({ kind: 'pictogram', pictogram: 'special-form.drone' }, 'variant');
    expect(variants.find((option) => option.value === 'alternative')?.status).toBe('blocked');
  });
});
