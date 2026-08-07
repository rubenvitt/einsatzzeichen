import { describe, expect, it } from 'vitest';
import { CAPABILITY_IDS } from '@einsatzzeichen/schema';
import { fingerprintFor } from '../fingerprint-index.js';
import { CAPABILITY_PICTOGRAMS } from './capabilities.js';
import { pictogram, pictogramVariantKey } from './index.js';

describe('Abschlussinventar Kapitel 4', () => {
  it('deklariert exakt 88 eindeutige Capability-IDs', () => {
    expect(CAPABILITY_IDS).toHaveLength(88);
    expect(new Set(CAPABILITY_IDS)).toHaveLength(88);
  });

  it('führt 92 Darstellungen mit 88 Primär- und vier Alternativvarianten', () => {
    expect(CAPABILITY_PICTOGRAMS).toHaveLength(92);
    expect(CAPABILITY_PICTOGRAMS.filter(({ variant }) => variant === 'primary')).toHaveLength(88);
    expect(CAPABILITY_PICTOGRAMS.filter(({ variant }) => variant === 'alternative')).toHaveLength(4);
  });

  it('deckt als Primärvarianten exakt die vollständige Taxonomie ab', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter(({ variant }) => variant === 'primary')
      .map(({ id }) => id.slice('capability.'.length))
      .sort();

    expect(actual).toEqual([...CAPABILITY_IDS].sort());
  });

  it('führt ausschließlich die vier belegten Alternativdarstellungen', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter(({ variant }) => variant === 'alternative')
      .map(({ section, referenceAsset }) => `${section}:${referenceAsset}`);

    expect(actual).toEqual([
      '4.1.6:4.1.6_Atomare Stoffe_Alternative.svg',
      '4.1.7:4.1.7_Biologische Stoffe_Alternative.svg',
      '4.1.8:4.1.8_Chemische Stoffe_Alternative.svg',
      '4.7.10:4.7.10_Heben von Lasten oder Personen_Alternative.svg',
    ]);
  });

  it('hat eindeutige Varianten-Schlüssel und löst jede Darstellung identisch auf', () => {
    const keys = CAPABILITY_PICTOGRAMS.map(pictogramVariantKey);
    expect(new Set(keys)).toHaveLength(92);

    for (const definition of CAPABILITY_PICTOGRAMS) {
      expect(pictogram(definition.id, definition.variant)).toBe(definition);
    }
  });

  it('belegt jede Darstellung mit passender Referenzdatei und Fingerprint', () => {
    for (const definition of CAPABILITY_PICTOGRAMS) {
      expect(definition.referenceAsset.startsWith(`${definition.section}_`)).toBe(true);
      expect(() => fingerprintFor(definition.referenceAsset)).not.toThrow();
    }
  });

  it('hält Titel über Varianten stabil und hat genau eine Primärvariante je Capability-ID', () => {
    for (const capabilityId of CAPABILITY_IDS) {
      const definitions = CAPABILITY_PICTOGRAMS.filter(
        ({ id }) => id === `capability.${capabilityId}`,
      );
      expect(definitions.filter(({ variant }) => variant === 'primary')).toHaveLength(1);
      expect(new Set(definitions.map(({ title }) => title))).toHaveLength(1);
    }
  });
});

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

describe('Fähigkeitsinventar Kapitel 4.7', () => {
  it('bildet die 29 Darstellungen aus Technischer Hilfeleistung exakt ab', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter((definition) => definition.section.startsWith('4.7.'))
      .map(({ section, id, variant, referenceAsset }) => ({
        section,
        id,
        variant,
        referenceAsset,
      }));

    expect(actual).toEqual([
      { section: '4.7.1', id: 'capability.water-hazard-control', variant: 'primary', referenceAsset: '4.7.1_Abwehr von Wassergefahren.svg' },
      { section: '4.7.2', id: 'capability.excavation', variant: 'primary', referenceAsset: '4.7.2_Baggerarbeiten.svg' },
      { section: '4.7.3', id: 'capability.lighting', variant: 'primary', referenceAsset: '4.7.3_Beleuchten.svg' },
      { section: '4.7.4', id: 'capability.ventilation', variant: 'primary', referenceAsset: '4.7.4_Belüften.svg' },
      { section: '4.7.5', id: 'capability.air-extraction', variant: 'primary', referenceAsset: '4.7.5_Entlüften.svg' },
      { section: '4.7.6', id: 'capability.explosive-ordnance-clearance', variant: 'primary', referenceAsset: '4.7.6_Kampfmittelräumung.svg' },
      { section: '4.7.7', id: 'capability.hand-tools', variant: 'primary', referenceAsset: '4.7.7_Einsatz von Handwerkzeugen.svg' },
      { section: '4.7.8', id: 'capability.forklift-lifting', variant: 'primary', referenceAsset: '4.7.8_Hebearbeit mit Gabelstapler.svg' },
      { section: '4.7.9', id: 'capability.crane-lifting', variant: 'primary', referenceAsset: '4.7.9_Hebearbeit mit Kran.svg' },
      { section: '4.7.10', id: 'capability.lifting-loads-persons', variant: 'primary', referenceAsset: '4.7.10_Heben von Lasten oder Personen.svg' },
      { section: '4.7.10', id: 'capability.lifting-loads-persons', variant: 'alternative', referenceAsset: '4.7.10_Heben von Lasten oder Personen_Alternative.svg' },
      { section: '4.7.11', id: 'capability.lifting-clearing', variant: 'primary', referenceAsset: '4.7.11_Heben-Räumen.svg' },
      { section: '4.7.12', id: 'capability.remote-manipulation', variant: 'primary', referenceAsset: '4.7.12_Fernmanipulieren.svg' },
      { section: '4.7.13', id: 'capability.chainsaw', variant: 'primary', referenceAsset: '4.7.13_Motorsägearbeiten.svg' },
      { section: '4.7.14', id: 'capability.pumping', variant: 'primary', referenceAsset: '4.7.14_Pumpen.svg' },
      { section: '4.7.15', id: 'capability.mechanized-clearing', variant: 'primary', referenceAsset: '4.7.15_Räumarbeiten mit Maschine.svg' },
      { section: '4.7.16', id: 'capability.safety', variant: 'primary', referenceAsset: '4.7.16_Sicherheit.svg' },
      { section: '4.7.17', id: 'capability.blasting', variant: 'primary', referenceAsset: '4.7.17_Sprengen.svg' },
      { section: '4.7.18', id: 'capability.technical-assistance', variant: 'primary', referenceAsset: '4.7.18_Technische Hilfeleistung.svg' },
      { section: '4.7.19', id: 'capability.transport', variant: 'primary', referenceAsset: '4.7.19_Transportieren.svg' },
      { section: '4.7.20', id: 'capability.door-opening', variant: 'primary', referenceAsset: '4.7.20_Türöffnung.svg' },
      { section: '4.7.21', id: 'capability.overcoming-height-differences', variant: 'primary', referenceAsset: '4.7.21_Höhenunterschiede überwinden.svg' },
      { section: '4.7.22', id: 'capability.securing', variant: 'primary', referenceAsset: '4.7.22_Absicherung.svg' },
      { section: '4.7.23', id: 'capability.optical-warning', variant: 'primary', referenceAsset: '4.7.23_Warnen mit optischen Anzeigen.svg' },
      { section: '4.7.24', id: 'capability.loudspeaker-warning', variant: 'primary', referenceAsset: '4.7.24_Warnen mit Lautsprecherdurchsagen.svg' },
      { section: '4.7.25', id: 'capability.siren-warning', variant: 'primary', referenceAsset: '4.7.25_Warnen mit Sirenen.svg' },
      { section: '4.7.26', id: 'capability.water-conveyance', variant: 'primary', referenceAsset: '4.7.26_Wasserförderung.svg' },
      { section: '4.7.27', id: 'capability.water-retention', variant: 'primary', referenceAsset: '4.7.27_Wasserrückhaltung.svg' },
      { section: '4.7.28', id: 'capability.load-pulling', variant: 'primary', referenceAsset: '4.7.28_Ziehen von Lasten.svg' },
    ]);
  });
});

describe('Fähigkeitsinventar Kapitel 4.8', () => {
  it('bildet die 16 Darstellungen aus Versorgung, Logistik und Infrastruktur exakt ab', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter((definition) => definition.section.startsWith('4.8.'))
      .map(({ section, id, variant, referenceAsset }) => ({
        section,
        id,
        variant,
        referenceAsset,
      }));

    expect(actual).toEqual([
      { section: '4.8.1', id: 'capability.container-resource', variant: 'primary', referenceAsset: '4.8.1_Behälter.svg' },
      { section: '4.8.2', id: 'capability.fuels-consumables', variant: 'primary', referenceAsset: '4.8.2_Betriebsstoffe Verbrauchsgüter.svg' },
      { section: '4.8.3', id: 'capability.bridge', variant: 'primary', referenceAsset: '4.8.3_Brücke.svg' },
      { section: '4.8.4', id: 'capability.temporary-bridge-construction', variant: 'primary', referenceAsset: '4.8.4_Behelfsbrückenbau.svg' },
      { section: '4.8.5', id: 'capability.waste-disposal', variant: 'primary', referenceAsset: '4.8.5_Entsorgung.svg' },
      { section: '4.8.6', id: 'capability.maintenance', variant: 'primary', referenceAsset: '4.8.6_Instandhaltung.svg' },
      { section: '4.8.7', id: 'capability.sandbag', variant: 'primary', referenceAsset: '4.8.7_Sandsack.svg' },
      { section: '4.8.8', id: 'capability.sandbag-filling', variant: 'primary', referenceAsset: '4.8.8_Sandsackbefüllung.svg' },
      { section: '4.8.9', id: 'capability.washing-facility', variant: 'primary', referenceAsset: '4.8.9_Sanitäre Einrichtung_Waschmöglichkeit.svg' },
      { section: '4.8.10', id: 'capability.toilet-facility', variant: 'primary', referenceAsset: '4.8.10_Sanitäre Einrichtung_WC.svg' },
      { section: '4.8.11', id: 'capability.power-supply', variant: 'primary', referenceAsset: '4.8.11_Stromversorgung.svg' },
      { section: '4.8.12', id: 'capability.drinking-water', variant: 'primary', referenceAsset: '4.8.12_Trinkwasser.svg' },
      { section: '4.8.13', id: 'capability.catering', variant: 'primary', referenceAsset: '4.8.13_Verpflegung.svg' },
      { section: '4.8.14', id: 'capability.meal-preparation', variant: 'primary', referenceAsset: '4.8.14_Verpflegung_Zubereitung.svg' },
      { section: '4.8.15', id: 'capability.rapid-deployment-tent', variant: 'primary', referenceAsset: '4.8.15_Schnelleinsatzzelt.svg' },
      { section: '4.8.16', id: 'capability.frame-tent', variant: 'primary', referenceAsset: '4.8.16_Stangengerüstzelt.svg' },
    ]);
  });
});

describe('Fähigkeitsinventar Kapitel 4.9', () => {
  it('bildet die Darstellung aus Information und Kommunikation exakt ab', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter((definition) => definition.section.startsWith('4.9.'))
      .map(({ section, id, variant, referenceAsset }) => ({
        section,
        id,
        variant,
        referenceAsset,
      }));

    expect(actual).toEqual([
      {
        section: '4.9.1',
        id: 'capability.information-communications',
        variant: 'primary',
        referenceAsset: '4.9.1_Information und Kommunikation Fernmeldewesen.svg',
      },
    ]);
  });
});

describe('Fähigkeitsinventar Kapitel 4.10', () => {
  it('bildet die sieben Darstellungen aus Veterinärwesen exakt ab', () => {
    const actual = CAPABILITY_PICTOGRAMS
      .filter((definition) => definition.section.startsWith('4.10.'))
      .map(({ section, id, variant, referenceAsset }) => ({
        section,
        id,
        variant,
        referenceAsset,
      }));

    expect(actual).toEqual([
      { section: '4.10.1', id: 'capability.veterinary', variant: 'primary', referenceAsset: '4.10.1_Veterinärwesen.svg' },
      { section: '4.10.2', id: 'capability.slaughter-culling', variant: 'primary', referenceAsset: '4.10.2_Schlachten_Keulen.svg' },
      { section: '4.10.3', id: 'capability.chicken', variant: 'primary', referenceAsset: '4.10.3_Huhn.svg' },
      { section: '4.10.4', id: 'capability.horse', variant: 'primary', referenceAsset: '4.10.4_Pferd.svg' },
      { section: '4.10.5', id: 'capability.cattle', variant: 'primary', referenceAsset: '4.10.5_Rind.svg' },
      { section: '4.10.6', id: 'capability.sheep', variant: 'primary', referenceAsset: '4.10.6_Schaf.svg' },
      { section: '4.10.7', id: 'capability.pig', variant: 'primary', referenceAsset: '4.10.7_Schwein.svg' },
    ]);
  });
});
