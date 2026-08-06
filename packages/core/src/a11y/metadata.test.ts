import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, type Drawing } from '@einsatzzeichen/schema';
import { checkA11yMetadata } from './metadata.js';

function drawing(metadata: Partial<Pick<Drawing, 'title' | 'description'>>): Drawing {
  return { viewBox: DEFAULT_VIEWBOX_MM, children: [], ...metadata };
}

describe('A11y-Metadaten-Gate', () => {
  it('akzeptiert nichtleeren Titel und Beschreibung', () => {
    expect(checkA11yMetadata(drawing({ title: 'Löschgruppe', description: 'Formation.' }))).toEqual(
      [],
    );
  });

  it('meldet fehlende und leere Felder gemeinsam', () => {
    expect(checkA11yMetadata(drawing({ title: '  ' }))).toEqual([
      { field: 'title', detail: 'Die Zeichnung benötigt einen nichtleeren Titel.' },
      {
        field: 'description',
        detail: 'Die Zeichnung benötigt eine nichtleere semantische Beschreibung.',
      },
    ]);
  });
});

