import { describe, expect, it } from 'vitest';
import { describePictogram, describeSymbolSpec } from './labels.js';
import { pictogram } from './pictograms/index.js';

describe('semantische Zeichenbeschreibungen', () => {
  it('beschreibt alle gesetzten Bestandteile einer Komposition', () => {
    expect(
      describeSymbolSpec({
        kind: 'formation',
        organization: 'feuerwehr',
        strength: 'staffel',
        capabilities: ['fire-fighting'],
        designation: 'Beispiel',
      }),
    ).toBe(
      'Grundzeichen: Taktische Formation. Organisation: Feuerwehr. Stärke: Staffel. ' +
        'Fähigkeit: Brandbekämpfung. Bezeichnung: Beispiel.',
    );
  });

  it('beschreibt ein eigenständiges Piktogramm aus seiner Definition', () => {
    expect(describePictogram(pictogram('capability.service-water'))).toBe(
      'Eigenständiges Piktogramm: Löschwasser, Brauchwasser.',
    );
  });
});

