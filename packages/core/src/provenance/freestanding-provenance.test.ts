import type { FreestandingSpec, SymbolSpec } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { drawFreestanding } from '../draw-freestanding.js';
import { pictogram } from '../geometry/pictograms/index.js';
import { anySpecProvenance, freestandingProvenance } from './freestanding-provenance.js';
import { symbolProvenance } from './symbol-provenance.js';

const ARROW_PATH = { points: [[2, 16], [30, 16]] } as const;

describe('freestandingProvenance() (LFH-798)', () => {
  it('nennt für einen Zustand die Kapiteldatei, wörtlich', () => {
    expect(freestandingProvenance({ kind: 'state', state: 'tactical-rescue' })).toEqual({
      status: 'verbatim',
      claim: 'reference-file',
      section: '5.8.1.1',
      referenceAsset: '5.8.1.1_Einsatztaktik_Retten.svg',
    });
    expect(freestandingProvenance({ kind: 'state', state: 'hazardous-substances', variant: 'alternative' })).toMatchObject({
      status: 'verbatim',
      referenceAsset: '5.8.1.7_Gefährliche Stoffe_Chlor.svg',
    });
  });

  it('nennt für ein Piktogramm die Kapiteldatei seines Raums', () => {
    expect(freestandingProvenance({ kind: 'pictogram', pictogram: 'comms.voice', variant: 'alternative' })).toEqual({
      status: 'verbatim',
      claim: 'reference-file',
      section: 'J.1.1',
      referenceAsset: 'J.1.1_Sprache_leitergebunden.svg',
    });
    expect(freestandingProvenance({ kind: 'pictogram', pictogram: 'leadership.command-post-in-operation' })).toMatchObject({
      status: 'verbatim',
      section: 'D.1.1',
    });
  });

  it('vermerkt an Kapitel 4, dass die freistehende Verwendung nicht belegt ist', () => {
    const provenance = freestandingProvenance({ kind: 'pictogram', pictogram: 'capability.radioactive-materials' });
    expect(provenance).toEqual({
      status: 'verbatim',
      claim: 'reference-file',
      section: '4.1.6',
      referenceAsset: pictogram('capability.radioactive-materials').referenceAsset,
      usage: 'freestanding-not-evidenced',
    });
    // Die übrigen Räume stehen als eigenständige Zeichen in der Referenz: kein Vermerk.
    expect(freestandingProvenance({ kind: 'pictogram', pictogram: 'damage.dyke-breach' })).not.toHaveProperty('usage');
    expect(freestandingProvenance({ kind: 'state', state: 'route-closed' })).not.toHaveProperty('usage');
  });

  it('führt das Tier ohne Zustand als abgeleitet (LLH-1343)', () => {
    expect(freestandingProvenance({ kind: 'animal-state' })).toEqual({ status: 'derived' });
    expect(drawFreestanding({ kind: 'animal-state' }).derivations).toHaveLength(1);
  });

  it('nennt für Tierzustand und einzelnen Wetterwert ihre Kapiteldatei', () => {
    expect(freestandingProvenance({ kind: 'animal-state', state: 'contaminated-animal', variant: 'alternative' })).toMatchObject({
      status: 'verbatim',
      referenceAsset: '5.8.6.2_kontaminiertes Tier_K.svg',
    });
    expect(freestandingProvenance({ kind: 'weather', values: ['weather-sunny'] })).toMatchObject({
      status: 'verbatim',
      section: '5.8.7.1',
      referenceAsset: '5.8.7.1_Sonnig.svg',
    });
  });

  it('nennt für den Schnee an der Wolke das Beispiel mit derselben Intensität, in jeder Reihenfolge', () => {
    for (const values of [['weather-cloudy', 'weather-snowing'], ['weather-snowing', 'weather-cloudy']] as const) {
      expect(freestandingProvenance({ kind: 'weather', values: [...values], intensity: 'strong' })).toEqual({
        status: 'verbatim',
        claim: 'reference-file',
        section: '5.8.7',
        referenceAsset: '5.8.7_Beispiel_Schneiend_stark.svg',
      });
    }
  });

  it('ist derived, wo die Zeichnung ableitet oder einen Verlauf zeichnet', () => {
    const derived: FreestandingSpec[] = [
      { kind: 'weather', values: ['weather-cloudy', 'weather-rainy'], intensity: 'weak' },
      { kind: 'weather', values: ['weather-sunny', 'weather-windy'] },
      { kind: 'weather', values: ['weather-cloudy', 'weather-snowing'] },
      { kind: 'movement', movement: 'directed-movement', path: ARROW_PATH },
      { kind: 'line', line: 'boundary-section', path: { points: [[1, 16], [47, 16]] } },
    ];
    for (const spec of derived) expect(freestandingProvenance(spec), JSON.stringify(spec)).toEqual({ status: 'derived' });
  });

  it('ist nie verbatim, wo die Zeichnung Ableitungsnotizen trägt', () => {
    const specs: FreestandingSpec[] = [
      { kind: 'weather', values: ['weather-cloudy', 'weather-rainy'], intensity: 'weak' },
      { kind: 'weather', values: ['weather-cloudy', 'weather-snowing'], intensity: 'weak' },
      { kind: 'weather', values: ['weather-hailing'] },
    ];
    for (const spec of specs) {
      const derived = drawFreestanding(spec).derivations !== undefined;
      expect(freestandingProvenance(spec).status === 'derived', JSON.stringify(spec)).toBe(derived);
    }
  });

  it('ist derived für eine Spec, die die Prüfung ablehnt — wie symbolProvenance für eine ungültige', () => {
    expect(freestandingProvenance({ kind: 'state', state: 'weather-sunny' })).toEqual({ status: 'derived' });
    expect(freestandingProvenance({ kind: 'pictogram', pictogram: 'leadership.control-center' })).toEqual({ status: 'derived' });
    expect(freestandingProvenance({ kind: 'state', state: 'tactical-attack', variant: 'alternative' })).toEqual({ status: 'derived' });
  });
});

describe('anySpecProvenance()', () => {
  it('fragt für eine SymbolSpec symbolProvenance', () => {
    const spec: SymbolSpec = { kind: 'formation', organization: 'fuehrung-leitung', functionRole: 'incident-command' };
    expect(anySpecProvenance(spec)).toEqual(symbolProvenance(spec));
    expect(anySpecProvenance({ kind: 'hazard' })).toEqual(symbolProvenance({ kind: 'hazard' }));
  });

  it('fragt für ein freistehendes Zeichen freestandingProvenance', () => {
    const spec: FreestandingSpec = { kind: 'pictogram', pictogram: 'wildfire.anchor-point' };
    expect(anySpecProvenance(spec)).toEqual(freestandingProvenance(spec));
  });
});
