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

  it('beschreibt das Trägerkürzel unterhalb des Körpers wie das im Körper', () => {
    // Die vierte Zone unterscheidet sich in Lage und Farbe, nicht in der Bedeutung. Für eine
    // Vorlesestimme ist das derselbe Sachverhalt — sonst verlöre E.2.27 seine einzige
    // fachliche Angabe, denn es trägt gar kein mittiges Kürzel.
    expect(
      describeSymbolSpec({
        kind: 'vehicle-water',
        bodyVariant: 'raised-hull',
        organization: 'thw',
        labels: { belowRight: 'THW' },
      }),
    ).toBe(
      'Grundzeichen: Wasserfahrzeug. Organisation: Technisches Hilfswerk. Trägerkürzel: THW.',
    );
  });

  it('nimmt die gemessene Versalhöhe nicht in die Vorlesebeschreibung auf', () => {
    // `centerCapHeightMm` ist eine Maßangabe und kein Text. Stünde sie in der Beschreibung,
    // läse eine Vorlesestimme „3.4099" mitten im Kürzel vor.
    const description = describeSymbolSpec({
      kind: 'formation',
      organization: 'thw',
      labels: { center: 'MzGW Lbw', centerCapHeightMm: 3.4099 },
    });
    expect(description).toContain('Kürzel: MzGW Lbw');
    expect(description).not.toContain('3.4099');
    expect(description).not.toMatch(/\d+\.\d+/);
  });

  it('beschreibt ein eigenständiges Piktogramm aus seiner Definition', () => {
    expect(describePictogram(pictogram('capability.service-water'))).toBe(
      'Eigenständiges Piktogramm: Löschwasser, Brauchwasser.',
    );
  });
});
