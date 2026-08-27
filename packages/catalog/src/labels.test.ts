import { describe, expect, it } from 'vitest';
import { TECHNICAL_BODY_MARK_IDS } from '@einsatzzeichen/schema';
import {
  describePictogram,
  describeSymbolSpec,
  TECHNICAL_BODY_MARK_LABELS,
} from './labels.js';
import { pictogram } from './pictograms/index.js';

describe('semantische Zeichenbeschreibungen', () => {
  it('benennt die Bundespolizei als eigene Organisation', () => {
    expect(describeSymbolSpec({ kind: 'vehicle-land', organization: 'bundespolizei' }))
      .toContain('Organisation: Bundespolizei');
  });

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

  it('liest einen einzelnen schwarzen Oberflächenlauf als ortsneutrale Zusatzangabe vor', () => {
    expect(describeSymbolSpec({
      kind: 'vehicle-air',
      labels: { surfaceBelowLeft: 'BW' },
    })).toBe('Grundzeichen: Luftfahrzeug. Zusatzangabe: BW.');
  });

  it('liest zwei schwarze Oberflächenläufe von links nach rechts vor', () => {
    expect(describeSymbolSpec({
      kind: 'circle-12',
      labels: { surfaceBelowLeft: '291300', surfaceBelowRight: 'ZIV' },
    })).toBe(
      'Grundzeichen: 12-mm-Kreis. Zusatzangabe: 291300. Zusatzangabe: ZIV.',
    );
  });

  it('lässt die bestehende Beschreibung ohne Oberflächenlauf byteidentisch', () => {
    expect(describeSymbolSpec({
      kind: 'vehicle-air',
      labels: { aboveLeft: 'ITH' },
    })).toBe('Grundzeichen: Luftfahrzeug. Kürzel oberhalb: ITH.');
  });

  it('bewahrt ohne Opt-in die Legacy-Bezeichnungen aller sichtbaren Zonen byteidentisch', () => {
    expect(describeSymbolSpec({
      kind: 'vehicle-land',
      labels: {
        topLeft: 'TL',
        center: 'C',
        bottomLeft: 'BL',
        bottomCenter: 'BC',
        bottomRight: 'BR',
        belowRight: 'BELOW',
        aboveLeft: 'ABOVE',
        topLeftLines: ['L1', 'L2'],
        surfaceBelowLeft: 'SL',
        surfaceBelowRight: 'SR',
      },
    })).toBe(
      'Grundzeichen: Landfahrzeug. Kürzel: TL. Kürzel: C. Zusatzkennzeichnung: BL. ' +
      'Zusatzkennzeichnung: BC. Trägerkürzel: BR. Trägerkürzel: BELOW. ' +
      'Kürzel oberhalb: ABOVE. Kürzel zweizeilig: L1 / L2. Zusatzangabe: SL. ' +
      'Zusatzangabe: SR.',
    );
  });

  it('beschreibt im neutralen Modus jede sichtbare Zone geometrisch statt als Kürzel', () => {
    const description = describeSymbolSpec({
      kind: 'vehicle-land',
      labels: {
        accessibilityMode: 'neutral-zones',
        inBodyInk: 'schwarz',
        topLeft: 'TL',
        center: 'C',
        centerCapHeightMm: 3.4,
        bottomLeft: 'BL',
        bottomCenter: 'BC',
        bottomRight: 'BR',
        belowRight: 'BELOW',
        aboveLeft: 'ABOVE',
        topLeftLines: ['L1', 'L2'],
        surfaceBelowLeft: 'SL',
        surfaceBelowRight: 'SR',
      },
    });
    expect(description).toBe(
      'Grundzeichen: Landfahrzeug. Beschriftung im Körper: TL. Beschriftung im Körper: C. ' +
      'Beschriftung im Körper: BL. Beschriftung im Körper: BC. Beschriftung im Körper: BR. ' +
      'Beschriftung unterhalb des Körpers: BELOW. Beschriftung oberhalb des Körpers: ABOVE. ' +
      'Beschriftung im Körper: L1 / L2. Beschriftung auf der Ausgabeoberfläche: SL. ' +
      'Beschriftung auf der Ausgabeoberfläche: SR.',
    );
    expect(description).not.toMatch(/Kürzel|Trägerkürzel|neutral-zones|accessibilityMode|3\.4/);
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
    expect(TECHNICAL_BODY_MARK_LABELS).toMatchObject({
      'circle-double-arrow-lower-v':
        'Senkrechter Stamm mit oberem Doppelpfeil und unterem V',
      'circle-information-stem':
        'Gefüllter Punkt über gefülltem senkrechtem Stamm',
      'circle-transport-diamond-arrows':
        'Raute mit zwei inneren Diagonalen, Anschlag und Rechtspfeil',
      'circle-transport-diamond-wheels-arrows':
        'Raute mit zwei Ringen, Anschlag und Rechtspfeil',
      'h-veterinary-decontamination':
        'Veterinär-V mit kompakter Tierdekontaminationsmarke unten links',
      'h-veterinary-slaughter':
        'Veterinär-V mit Schlacht- und Untersuchungsmarke unten links',
    });
    const task4TechnicalIds = [
      'ring-7mm-offset-down-1mm',
      'chevron-over-opposed-triangles',
      'ring-6-5mm-offset-down-2mm-with-roof',
      'top-center-rect-0-5x0-6mm',
      'air-winch-chevron-diamond',
      'ring-6mm-offset-down-3mm-four-way-stem',
      'ring-5mm-offset-down-3mm-eight-spokes',
      'circle-patient-staging-arrows',
      'circle-collection-arrow',
      'circle-staging-frame-arrow',
      'circle-staging-frame',
      'circle-staging-frame-quadrants-arrows',
      'circle-diamond-arrow',
      'circle-cross-ring',
    ] as const;
    const task5TechnicalIds = [
      'circle-double-arrow-lower-v',
      'circle-information-stem',
      'circle-transport-diamond-arrows',
      'circle-transport-diamond-wheels-arrows',
    ] as const;
    const lfh488TechnicalIds = [
      'circle-two-waves-diamond',
      'circle-diagonal-double-arrow-offset-bowl',
      'circle-wide-bowl',
    ] as const;
    const task1AnhangHTechnicalIds = [
      'h-veterinary-decontamination',
      'h-veterinary-slaughter',
    ] as const;
    const task1AnhangNTechnicalIds = [
      'land-horizontal-blade-bent-upright',
      'ring-5mm-offset-down-3-5mm-eight-spokes',
      'air-quartering-up-arrow-box',
      'air-horizontal-left-chevron',
      'air-rising-diagonal',
      'spontaneous-helper-collection-arrow',
      'spontaneous-helper-contact-double-arrow',
    ] as const;
    const task1AnhangITechnicalIds = [
      'trailer-water-rescue',
      'trailer-diving',
      'trailer-boat-hull',
    ] as const;
    const task2RoleTechnicalIds = [
      'formation-solid-cap-3mm',
      'formation-solid-cap-4mm-three-hole-row',
    ] as const;
    expect(TECHNICAL_BODY_MARK_IDS).toEqual([
      ...task4TechnicalIds,
      ...task5TechnicalIds,
      ...lfh488TechnicalIds,
      ...task2RoleTechnicalIds,
      ...task1AnhangHTechnicalIds,
      ...task1AnhangNTechnicalIds,
      ...task1AnhangITechnicalIds,
    ]);
    expect(TECHNICAL_BODY_MARK_LABELS as Record<string, string>).toMatchObject({
      'formation-solid-cap-3mm': 'Schwarze Formationskappe, 3 mm hoch',
      'formation-solid-cap-4mm-three-hole-row':
        'Schwarze Formationskappe, 4 mm hoch, mit drei Löchern in einer Reihe',
      'trailer-water-rescue': 'Doppelwelle mit Raute für Wasserrettung',
      'trailer-diving': 'Doppelwelle mit kleiner Raute',
      'trailer-boat-hull': 'Schwarzer Bootsrumpf mit weißem Innenraum',
    });
  });

  it('beschreibt die gemeinsame Anhängerwelle von I.2.6 ohne eine falsche Tauchen-Semantik', () => {
    const description = describeSymbolSpec({
      kind: 'trailer',
      organization: 'hilfsorganisation',
      bodyMarks: ['trailer-diving'],
      labels: { center: 'Strömungsrettung' },
    });
    expect(description).toContain('Technische Körpermarke: Doppelwelle mit kleiner Raute');
    expect(description).not.toContain('Tauchen');
  });

  it('beschreibt die drei technischen Körpermarken von LFH-488 ohne Fachsemantik', () => {
    expect(TECHNICAL_BODY_MARK_LABELS).toMatchObject({
      'circle-two-waves-diamond': 'Zwei Wellenlinien über einer Raute',
      'circle-diagonal-double-arrow-offset-bowl':
        'Diagonaler Doppelpfeil neben einer nach rechts versetzten Schale',
      'circle-wide-bowl': 'Breite Schale',
    });
  });

  it('beschreibt Funktion, Kopfart und alle sichtbaren Funktionsläufe', () => {
    const spec = {
      kind: 'person',
      organization: 'fuehrung-leitung',
      administrativeLevel: 'kreis',
      functionRole: 'technical-incident-commander',
    } as unknown as Parameters<typeof describeSymbolSpec>[0];
    const description = describeSymbolSpec(spec);
    expect(description).toContain('Funktion: Technischer Einsatzleiter');
    expect(description).toContain('Funktionskopf: Verwaltungsstufe');
    expect(description).toContain('Funktionskürzel: TEL');
    expect(description).toContain('Trägerkürzel: AW');
  });

  it('beschreibt ein eigenständiges Piktogramm aus seiner Definition', () => {
    expect(describePictogram(pictogram('capability.service-water'))).toBe(
      'Eigenständiges Piktogramm: Löschwasser, Brauchwasser.',
    );
  });
});
