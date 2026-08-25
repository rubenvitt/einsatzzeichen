import { describe, expect, it } from 'vitest';
import { TECHNICAL_BODY_MARK_IDS } from '@einsatzzeichen/schema';
import {
  describePictogram,
  describeSymbolSpec,
  TECHNICAL_BODY_MARK_LABELS,
} from './labels.js';
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

  it('nimmt gemessene Labelmetriken nicht in die Vorlesebeschreibung auf', () => {
    // Metriken sind Maßangaben und kein Text. Stünden sie in der Beschreibung, läse eine
    // Vorlesestimme Dezimalzahlen mitten im Kürzel vor.
    const description = describeSymbolSpec({
      kind: 'formation',
      organization: 'thw',
      labels: {
        center: 'MzGW Lbw',
        centerCapHeightMm: 3.4099,
        topLeft: 'BTKombi',
        topLeftMetrics: {
          capHeightMm: 2.191447,
          baselineFromBodyTopMm: 5.249923,
          anchorFromBodyLeftMm: 0.51423,
        },
      },
    });
    expect(description).toContain('Kürzel: MzGW Lbw');
    expect(description).toContain('Kürzel: BTKombi');
    expect(description).not.toContain('3.4099');
    expect(description).not.toContain('2.191447');
    expect(description).not.toContain('5.249923');
    expect(description).not.toContain('0.51423');
    expect(description).not.toMatch(/\d+\.\d+/);
  });

  it('liest die oberhalb liegende und die zweizeilige Fahrzeugbeschriftung vollständig vor', () => {
    expect(describeSymbolSpec({ kind: 'vehicle-air', labels: { aboveLeft: 'ITH' } }))
      .toContain('Kürzel oberhalb: ITH');
    expect(describeSymbolSpec({ kind: 'vehicle-land', labels: { topLeftLines: ['GW-San', '50'] } }))
      .toContain('Kürzel zweizeilig: GW-San / 50');
  });

  it('beschreibt jede technische Körpermarke aus einer erschöpfenden neutralen Metadatenmap', () => {
    expect(Object.keys(TECHNICAL_BODY_MARK_LABELS).sort()).toEqual(
      [...TECHNICAL_BODY_MARK_IDS].sort(),
    );
    expect(describeSymbolSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull',
      bodyMarks: ['air-winch-chevron-diamond'],
    })).toContain('Technische Körpermarke: Winschform aus Pfeilwinkel und Raute');
    expect(describeSymbolSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull',
      bodyMarks: ['air-winch-chevron-diamond'],
    })).not.toContain('Fachdienst:');
    expect(describeSymbolSpec({
      kind: 'vehicle-land',
      bodyMarks: ['ring-6mm-offset-down-3mm-four-way-stem'],
    })).toContain('Technische Körpermarke: Ring 6 mm mit Vierwegeform und unterem Gabelsteg');
    expect(describeSymbolSpec({
      kind: 'vehicle-land',
      bodyMarks: ['ring-5mm-offset-down-3mm-eight-spokes'],
    })).toContain('Technische Körpermarke: Ring 5 mm mit acht Speichen, 3 mm nach unten versetzt');
  });

  it('beschreibt ein eigenständiges Piktogramm aus seiner Definition', () => {
    expect(describePictogram(pictogram('capability.service-water'))).toBe(
      'Eigenständiges Piktogramm: Löschwasser, Brauchwasser.',
    );
  });
});
