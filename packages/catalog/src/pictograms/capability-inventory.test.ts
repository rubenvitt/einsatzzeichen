import { describe, expect, it } from 'vitest';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';

describe('Fähigkeitsinventar Kapitel 4.1', () => {
  it('bildet die elf Darstellungen aus ABC-/CBRN-Schutz exakt ab', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter((definition) => definition.section.startsWith('4.1.'))
      .map(({ section, id, variant, referenceAsset }) => ({
        section,
        id,
        variant,
        referenceAsset,
      }));

    expect(actual).toEqual([
      {
        section: '4.1.1',
        id: 'capability.cbrn-protection',
        variant: 'primary',
        referenceAsset: '4.1.1_ABC_CBRN-Schutz.svg',
      },
      {
        section: '4.1.2',
        id: 'capability.cbrn-detection',
        variant: 'primary',
        referenceAsset: '4.1.2_Messen Spüren Detektieren.svg',
      },
      {
        section: '4.1.3',
        id: 'capability.decontamination',
        variant: 'primary',
        referenceAsset: '4.1.3_Dekontaminieren.svg',
      },
      {
        section: '4.1.4',
        id: 'capability.water-environmental-damage-control',
        variant: 'primary',
        referenceAsset: '4.1.4_Umweltschädenbeseitigung auf Gewässern.svg',
      },
      {
        section: '4.1.5',
        id: 'capability.drinking-water-treatment',
        variant: 'primary',
        referenceAsset: '4.1.5_Trinkwasseraufbereitung.svg',
      },
      {
        section: '4.1.6',
        id: 'capability.radioactive-materials',
        variant: 'primary',
        referenceAsset: '4.1.6_Atomare Stoffe.svg',
      },
      {
        section: '4.1.6',
        id: 'capability.radioactive-materials',
        variant: 'alternative',
        referenceAsset: '4.1.6_Atomare Stoffe_Alternative.svg',
      },
      {
        section: '4.1.7',
        id: 'capability.biological-materials',
        variant: 'primary',
        referenceAsset: '4.1.7_Biologische Stoffe.svg',
      },
      {
        section: '4.1.7',
        id: 'capability.biological-materials',
        variant: 'alternative',
        referenceAsset: '4.1.7_Biologische Stoffe_Alternative.svg',
      },
      {
        section: '4.1.8',
        id: 'capability.chemical-materials',
        variant: 'primary',
        referenceAsset: '4.1.8_Chemische Stoffe.svg',
      },
      {
        section: '4.1.8',
        id: 'capability.chemical-materials',
        variant: 'alternative',
        referenceAsset: '4.1.8_Chemische Stoffe_Alternative.svg',
      },
    ]);
  });
});

describe('Fähigkeitsinventar Kapitel 4.2', () => {
  it('bildet die fünf Darstellungen aus Betreuung exakt ab', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter((definition) => definition.section.startsWith('4.2.'))
      .map(({ section, id, variant, referenceAsset }) => ({
        section,
        id,
        variant,
        referenceAsset,
      }));

    expect(actual).toEqual([
      {
        section: '4.2.1',
        id: 'capability.care',
        variant: 'primary',
        referenceAsset: '4.2.1_Betreuung Grundzeichne.svg',
      },
      {
        section: '4.2.2',
        id: 'capability.psychosocial-emergency-care',
        variant: 'primary',
        referenceAsset: '4.2.2_PSNV.svg',
      },
      {
        section: '4.2.3',
        id: 'capability.pastoral-care',
        variant: 'primary',
        referenceAsset: '4.2.3_Seelsorge.svg',
      },
      {
        section: '4.2.4',
        id: 'capability.temporary-accommodation-resting',
        variant: 'primary',
        referenceAsset: '4.2.4_Temporäre Unterbringung mit Ruhemöglichkeit.svg',
      },
      {
        section: '4.2.5',
        id: 'capability.temporary-accommodation-seating',
        variant: 'primary',
        referenceAsset: '4.2.5_Temporäre Unterbringung mit Sitzmöglichkeit.svg',
      },
    ]);
  });
});

describe('Fähigkeitsinventar Kapitel 4.3', () => {
  it('bildet die sechs Darstellungen aus Brandbekämpfung exakt ab', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter((definition) => definition.section.startsWith('4.3.'))
      .map(({ section, id, variant, referenceAsset }) => ({
        section,
        id,
        variant,
        referenceAsset,
      }));

    expect(actual).toEqual([
      {
        section: '4.3.1',
        id: 'capability.fire-fighting',
        variant: 'primary',
        referenceAsset: '4.3.1_Brandbekämpfung.svg',
      },
      {
        section: '4.3.2',
        id: 'capability.service-water',
        variant: 'primary',
        referenceAsset: '4.3.2_Löschwasser Brauchwasser.svg',
      },
      {
        section: '4.3.3',
        id: 'capability.foam-agent',
        variant: 'primary',
        referenceAsset: '4.3.3_Schaummittel.svg',
      },
      {
        section: '4.3.4',
        id: 'capability.solid-extinguishing-agent',
        variant: 'primary',
        referenceAsset: '4.3.4_Sonderlöschmittel fest.svg',
      },
      {
        section: '4.3.5',
        id: 'capability.gaseous-extinguishing-agent',
        variant: 'primary',
        referenceAsset: '4.3.5_Sonderlöschmittel gasförmig.svg',
      },
      {
        section: '4.3.6',
        id: 'capability.respiratory-protection',
        variant: 'primary',
        referenceAsset: '4.3.6_Atemschutz.svg',
      },
    ]);
  });
});

describe('Fähigkeitsinventar Kapitel 4.4', () => {
  it('bildet die drei Darstellungen aus Erkundung und Ortung exakt ab', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter((definition) => definition.section.startsWith('4.4.'))
      .map(({ section, id, variant, referenceAsset }) => ({
        section,
        id,
        variant,
        referenceAsset,
      }));

    expect(actual).toEqual([
      {
        section: '4.4.1',
        id: 'capability.reconnaissance',
        variant: 'primary',
        referenceAsset: '4.4.1_Erkunden.svg',
      },
      {
        section: '4.4.2',
        id: 'capability.biological-location',
        variant: 'primary',
        referenceAsset: '4.4.2_Orten biologisch.svg',
      },
      {
        section: '4.4.3',
        id: 'capability.technical-location',
        variant: 'primary',
        referenceAsset: '4.4.3_Orten technisch.svg',
      },
    ]);
  });
});

describe('Fähigkeitsinventar Kapitel 4.5', () => {
  it('bildet die acht Darstellungen aus Retten und Bergen exakt ab', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter((definition) => definition.section.startsWith('4.5.'))
      .map(({ section, id, variant, referenceAsset }) => ({
        section,
        id,
        variant,
        referenceAsset,
      }));

    expect(actual).toEqual([
      { section: '4.5.1', id: 'capability.recovery', variant: 'primary', referenceAsset: '4.5.1_Bergung.svg' },
      { section: '4.5.2', id: 'capability.rescue-portable-ladders', variant: 'primary', referenceAsset: '4.5.2_Retten aus Höhen und Tiefen mit tragbaren Leitern.svg' },
      { section: '4.5.3', id: 'capability.rescue-aerial-ladder', variant: 'primary', referenceAsset: '4.5.3_Retten aus Höhen und Tiefen mit Drehleiter.svg' },
      { section: '4.5.4', id: 'capability.rescue-articulated-boom', variant: 'primary', referenceAsset: '4.5.4_Retten aus Höhen und Tiefen mit Teleskopgelenkmast.svg' },
      { section: '4.5.5', id: 'capability.watercraft-operations', variant: 'primary', referenceAsset: '4.5.5_Einsatz von Wasserfahrzeugen.svg' },
      { section: '4.5.6', id: 'capability.mountain-rescue', variant: 'primary', referenceAsset: '4.5.6_Bergrettung.svg' },
      { section: '4.5.7', id: 'capability.special-height-depth-rescue', variant: 'primary', referenceAsset: '4.5.7_Spezielle Rettung aus Höhen und Tiefen.svg' },
      { section: '4.5.8', id: 'capability.water-rescue', variant: 'primary', referenceAsset: '4.5.8_Wasserrettung.svg' },
    ]);
  });
});

describe('Fähigkeitsinventar Kapitel 4.6', () => {
  it('bildet die sechs Darstellungen aus Sanitäts- und Rettungswesen exakt ab', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter((definition) => definition.section.startsWith('4.6.'))
      .map(({ section, id, variant, referenceAsset }) => ({
        section,
        id,
        variant,
        referenceAsset,
      }));

    expect(actual).toEqual([
      { section: '4.6.1', id: 'capability.medical-service', variant: 'primary', referenceAsset: '4.6.1_Sanität Grundzeichen.svg' },
      { section: '4.6.2', id: 'capability.nursing', variant: 'primary', referenceAsset: '4.6.2_Pflege.svg' },
      { section: '4.6.3', id: 'capability.intensive-care', variant: 'primary', referenceAsset: '4.6.3_Rettungswesen_Intensivmedizin.svg' },
      { section: '4.6.4', id: 'capability.physician', variant: 'primary', referenceAsset: '4.6.4_Arztwesen.svg' },
      { section: '4.6.5', id: 'capability.patient-transport', variant: 'primary', referenceAsset: '4.6.5_Patiententransport.svg' },
      { section: '4.6.6', id: 'capability.hospital', variant: 'primary', referenceAsset: '4.6.6_Krankenhaus.svg' },
    ]);
  });
});
