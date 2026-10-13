import type { Primitive, SpecialFormPictogramId } from '@einsatzzeichen/schema';
import { specialForm } from '../../../layout/special-forms.js';
import { deepFreeze } from '../../readonly-data.js';
import { specialFormPrimitives } from '../../special-form-bodies.js';
import { defineSpecialForm, type CatalogPictogramDefinition } from '../catalog-definition.js';

/**
 * Die Sonderformen 3.6 Drohne, 3.7 Zweirad und 3.8 Zweirad motorgetrieben als Einzelpiktogramm
 * im Raum `special-form.*` (ESZ-134, Entscheidung vom 13.10.2026). Damit stehen sie freistehend
 * über `{ kind: 'pictogram', pictogram: 'special-form.<id>' }` auf der Lagekarte.
 *
 * Gezeichnet wird genau die Kapiteldatei aus `special-form-bodies.ts`, nur mit der Rolle
 * `pictogram` statt `body`: Maße, Pfade und Stil bleiben eine Quelle. Die Box ist die Tintenhülle
 * der Kapiteldatei, wie `SPECIAL_FORMS` sie in der Körperzone führt.
 *
 * 3.9 steht nicht im Raum: der Giebel ist eine Marke über einem Träger
 * (`SPECIAL_FORM_PICTOGRAM_IDS` in `schema`).
 */
const SECTIONS: Readonly<Record<SpecialFormPictogramId, `3.${6 | 7 | 8}`>> = {
  drone: '3.6',
  'two-wheeler': '3.7',
  'motorized-two-wheeler': '3.8',
};

/** Die Hüllen der Kapiteldateien: das Sechseck der Drohne, die Tintenhülle der Zweiräder. */
const BOXES = {
  drone: { xMm: 4, yMm: 10, widthMm: 24, heightMm: 12 },
  'two-wheeler': { xMm: 9.75, yMm: 3.75, widthMm: 12.5, heightMm: 24.25 },
  'motorized-two-wheeler': { xMm: 9.75, yMm: 3.75, widthMm: 12.5, heightMm: 24.25 },
} as const;

function asPictogram(primitive: Primitive): Primitive {
  return { ...primitive, role: 'pictogram' };
}

function define(id: SpecialFormPictogramId): CatalogPictogramDefinition {
  const form = specialForm(id);
  return defineSpecialForm({
    section: SECTIONS[id],
    id,
    title: form.title,
    referenceAsset: form.asset,
    box: BOXES[id],
    primitives: specialFormPrimitives(id).map(asPictogram),
    contrastPairs: [
      {
        foreground: 'schwarz',
        background: 'surface',
        context: id === 'drone' ? 'schwarz gefüllter Winkel auf der Ausgabeoberfläche' : 'schwarzer Strich auf der Ausgabeoberfläche',
      },
    ],
  });
}

export const SPECIAL_FORM_PICTOGRAMS: readonly CatalogPictogramDefinition[] = deepFreeze([
  define('drone'),
  define('two-wheeler'),
  define('motorized-two-wheeler'),
]);
