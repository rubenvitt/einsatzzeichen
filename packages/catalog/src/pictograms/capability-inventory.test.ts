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
