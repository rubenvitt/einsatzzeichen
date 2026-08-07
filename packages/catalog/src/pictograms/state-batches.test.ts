import { describe, expect, it } from 'vitest';
import { pictogramVariantKey } from './index.js';
import { STATE_PICTOGRAMS } from './states/index.js';

const DELIVERED_BATCHES = [
  {
    batch: 'S0',
    keys: [
      'state.tendency-rising#primary',
      'state.tendency-unchanged#primary',
      'state.tendency-falling#primary',
    ],
  },
  {
    batch: 'A1',
    keys: [
      'state.activity-slightly-increased-outage-up-to-25-percent#primary',
      'state.activity-moderately-increased-outage-up-to-50-percent#primary',
    ],
  },
  {
    batch: 'A2',
    keys: [
      'state.activity-significantly-increased-outage-up-to-75-percent#primary',
      'state.activity-strongly-increased-total-outage#primary',
    ],
  },
  {
    batch: 'D1',
    keys: [
      'state.damaged#primary',
      'state.partially-destroyed#primary',
      'state.destroyed#primary',
    ],
  },
  {
    batch: 'F1',
    keys: [
      'state.incipient-fire#primary',
      'state.developed-fire#primary',
      'state.fully-developed-fire#primary',
    ],
  },
  {
    batch: 'H1',
    keys: [
      'state.suspected-situation#primary',
      'state.suspected-situation#alternative',
    ],
  },
  {
    batch: 'H2',
    keys: [
      'state.acute-situation#primary',
      'state.acute-situation#alternative',
    ],
  },
  {
    batch: 'E1',
    keys: ['state.tactical-rescue#primary', 'state.tactical-attack#primary'],
  },
  {
    batch: 'E2',
    keys: ['state.tactical-defense#primary', 'state.tactical-retreat#primary'],
  },
  {
    batch: 'G1',
    keys: ['state.flooded-area#primary', 'state.water-ingress-hazard#primary'],
  },
  {
    batch: 'G2',
    keys: [
      'state.hazardous-substances#primary',
      'state.hazardous-substances#alternative',
    ],
  },
  {
    batch: 'G3',
    keys: [
      'state.radioactivity-hazard#primary',
      'state.radioactivity-hazard#alternative',
    ],
  },
  {
    batch: 'G4',
    keys: ['state.electrical-energy-hazard#primary', 'state.mineral-oil-hazard#primary'],
  },
  {
    batch: 'G5',
    keys: ['state.explosion-hazard#primary', 'state.explosive-ordnance-hazard#primary'],
  },
  {
    batch: 'T1',
    keys: [
      'state.sick-animal#primary',
      'state.contaminated-animal#primary',
    ],
  },
  {
    batch: 'T2',
    keys: [
      'state.contaminated-animal#alternative',
      'state.dead-animal#primary',
    ],
  },
  {
    batch: 'P1',
    keys: [
      'state.person-uninjured#primary',
      'state.person-affected#primary',
      'state.person-injured#primary',
    ],
  },
  {
    batch: 'P2',
    keys: [
      'state.person-injured-triage-category#primary',
      'state.person-injured-transport-priority#primary',
    ],
  },
  {
    batch: 'P3',
    keys: [
      'state.person-contaminated#primary',
      'state.person-contaminated#alternative',
    ],
  },
  {
    batch: 'P4',
    keys: [
      'state.person-dead#primary',
      'state.person-missing#primary',
      'state.person-in-water-danger#primary',
    ],
  },
  {
    batch: 'P5',
    keys: [
      'state.person-in-distress#primary',
      'state.person-rescued#primary',
      'state.person-to-be-transported#primary',
    ],
  },
  {
    batch: 'P6',
    keys: [
      'state.person-in-transport#primary',
      'state.person-transported#primary',
      'state.person-needing-special-care#primary',
    ],
  },
  {
    batch: 'P7',
    keys: [
      'state.person-care-dependent#primary',
      'state.person-mobility-impaired#primary',
    ],
  },
  {
    batch: 'W1',
    keys: [
      'state.weather-sunny#primary',
      'state.weather-cloudy#primary',
      'state.weather-cloud-cover-four-eighths#primary',
    ],
  },
  {
    batch: 'W2',
    keys: [
      'state.weather-foggy#primary',
      'state.weather-rainy#primary',
      'state.weather-hailing#primary',
    ],
  },
  {
    batch: 'W3',
    keys: [
      'state.weather-thunderstorm#primary',
      'state.weather-snowing#primary',
    ],
  },
  {
    batch: 'W4',
    keys: [
      'state.weather-temperature#primary',
      'state.weather-windy#primary',
    ],
  },
  {
    batch: 'V1',
    keys: [
      'state.route-closed#primary',
      'state.one-way-traffic#primary',
    ],
  },
  {
    batch: 'V2',
    keys: [
      'state.route-difficult-to-pass#primary',
      'state.route-impassable#primary',
    ],
  },
] as const;

describe('DELIVERED_BATCHES', () => {
  it('entspricht ohne doppelte Schlüssel exakt den ausgelieferten State-Darstellungen', () => {
    const batches = DELIVERED_BATCHES.map(({ batch }) => batch);
    const expectedKeys = DELIVERED_BATCHES.flatMap(({ keys }) => keys);
    const actualKeys = STATE_PICTOGRAMS.map(pictogramVariantKey);

    expect(new Set(batches).size).toBe(batches.length);
    expect(new Set(expectedKeys).size).toBe(expectedKeys.length);
    expect(new Set(actualKeys).size).toBe(actualKeys.length);
    expect([...actualKeys].sort()).toEqual([...expectedKeys].sort());
  });
});
