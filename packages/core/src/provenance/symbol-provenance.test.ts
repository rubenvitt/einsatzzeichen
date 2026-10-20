import type { SymbolSpec } from '@einsatzzeichen/schema';
import { describe, expect, it } from 'vitest';
import { PLACES } from '../places.js';
import { freestandingRedirect } from '../validate-freestanding.js';
import { symbolProvenance } from './symbol-provenance.js';

/*
 * core kennt die Rezepte nicht; die Specs stehen hier als Literale. Dass die Tabelle als Ganzes
 * dem Körpervergleich entspricht, belegt das Drift-Gate in conformance
 * (`verbatim-table-drift.test.ts`), dass jede Fixture verbatim ist,
 * `combination-provenance.test.ts`.
 */

/** D.1.4 Einsatzleitung im Einsatz. */
const INCIDENT_COMMAND: SymbolSpec = {
  kind: 'formation',
  organization: 'fuehrung-leitung',
  functionRole: 'incident-command',
};

/** I.1.9 Bootstrupp Wasserrettungszug. */
const BOAT_SQUAD: SymbolSpec = {
  kind: 'formation',
  organization: 'hilfsorganisation',
  strength: 'trupp',
  bodyMarks: ['water-rescue'],
  labels: { topLeft: 'Boot' },
};

describe('symbolProvenance()', () => {
  it('nennt für eine Fixture verbatim mit Beleg der Körperhülle, Fixture und Referenz', () => {
    expect(symbolProvenance(INCIDENT_COMMAND)).toEqual({
      status: 'verbatim',
      claim: 'body-hull',
      fixture: 'D.1.4',
      referenceAsset: 'D.1.4_Einsatzleitung im Einsatz.svg',
    });
  });

  it('hängt nicht an der Schlüsselreihenfolge der Spec', () => {
    const reordered: SymbolSpec = {
      labels: { topLeft: 'Boot' },
      bodyMarks: ['water-rescue'],
      strength: 'trupp',
      organization: 'hilfsorganisation',
      kind: 'formation',
    };
    expect(symbolProvenance(reordered)).toMatchObject({ status: 'verbatim', fixture: 'I.1.9' });
  });

  it('ist derived, sobald sich die Beschriftung von der Fixture unterscheidet', () => {
    expect(symbolProvenance(BOAT_SQUAD)).toMatchObject({ status: 'verbatim', fixture: 'I.1.9' });
    expect(symbolProvenance({ ...BOAT_SQUAD, labels: { topLeft: 'Kahn' } }))
      .toEqual({ status: 'derived' });
  });

  it('trägt keinen Reviewstand — der bleibt im Prüfpaket', () => {
    expect(symbolProvenance(INCIDENT_COMMAND)).not.toHaveProperty('review');
  });
});

describe('symbolProvenance() für Specs, die eine Kapiteldatei zeichnen (ESZ-136)', () => {
  it('nennt für die Person mit einem Zustand aus 5.8.8 Abschnitt und Referenzdatei', () => {
    expect(symbolProvenance({ kind: 'person', states: ['person-dead'] })).toEqual({
      status: 'verbatim',
      claim: 'reference-file',
      section: '5.8.8.7',
      referenceAsset: '5.8.8.7_Person Tot.svg',
    });
  });

  it('nennt für die Gefahr mit Hinweis die zweite Darstellung von 5.8.1.13', () => {
    expect(symbolProvenance({ kind: 'hazard', states: ['suspected-situation'] })).toEqual({
      status: 'verbatim',
      claim: 'reference-file',
      section: '5.8.1.13',
      referenceAsset: '5.8.1.13_Hinweis auf Vermutung_2.svg',
    });
  });

  it('ist für jedes Ziel der Kanonik verbatim, die Leitstelle mit Körperhülle', () => {
    expect(symbolProvenance({ kind: 'person', states: ['person-care-dependent'] })).toMatchObject({
      status: 'verbatim',
      claim: 'reference-file',
      section: '5.8.8.16',
    });
    const control = freestandingRedirect({ kind: 'pictogram', pictogram: 'leadership.control-center' });
    expect(control).toEqual(PLACES['control-center'].spec);
    expect(symbolProvenance(PLACES['control-center'].spec)).toEqual({
      status: 'verbatim',
      claim: 'body-hull',
      fixture: 'D.2.5',
      referenceAsset: 'D.2.5_Leitstelle.svg',
    });
  });

  it('bleibt derived für die abgeleiteten Orte und für zwei Zustände an einer Person', () => {
    expect(symbolProvenance(PLACES['incident-command'].spec)).toEqual({ status: 'derived' });
    expect(symbolProvenance({ kind: 'person', states: ['person-injured', 'person-contaminated'] }))
      .toEqual({ status: 'derived' });
  });
});
