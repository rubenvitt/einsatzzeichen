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
