import { describe, expect, it } from 'vitest';
import { COMMS_IDS } from '@einsatzzeichen/schema';
import { entryKey } from '@einsatzzeichen/schema';
import { COMMS_PICTOGRAMS } from './comms/index.js';

/**
 * Das Inventar des Anhangs J als geschlossene Aussage — nach dem Muster von
 * `state-inventory.test.ts`. Die Einzeltests der Kapitelmodule prüfen Form und Kürzel; dieser
 * hier prüft, dass der Bestand **vollständig** ist und keine Zeile doppelt trägt.
 */

/** Die 48 Abschnitte des Anhangs in verbindlicher Kapitelreihenfolge. */
const SECTIONS = [
  ...Array.from({ length: 14 }, (_, i) => `J.1.${i + 1}`),
  'J.2.1',
  'J.2.2',
  ...Array.from({ length: 15 }, (_, i) => `J.3.${i + 1}`),
  ...Array.from({ length: 17 }, (_, i) => `J.4.${i + 1}`),
] as const;

/**
 * Genau diese fünf Abschnitte tragen eine zweite Darstellung. Sie stehen hier namentlich und
 * nicht als Zählwert, weil die Aussage „welche" mehr wert ist als „wie viele" — eine falsch
 * zugeordnete Variante bliebe bei einer reinen Zählung unsichtbar.
 */
const SECTIONS_WITH_ALTERNATIVE = ['J.1.1', 'J.1.8', 'J.1.9', 'J.1.10', 'J.1.11'] as const;

describe('Inventar des Anhangs J', () => {
  it('führt 48 Abschnitte in Kapitelreihenfolge', () => {
    const sections = [...new Set(COMMS_PICTOGRAMS.map((d) => d.section))];
    expect(sections).toEqual([...SECTIONS]);
  });

  it('führt 53 Darstellungen', () => {
    expect(COMMS_PICTOGRAMS).toHaveLength(53);
  });

  it('deckt jede ID des Taxonomieregisters genau einmal ab', () => {
    const ids = [...new Set(COMMS_PICTOGRAMS.map((d) => d.id.replace('comms.', '')))];
    expect(ids.sort()).toEqual([...COMMS_IDS].sort());
    expect(COMMS_IDS).toHaveLength(48);
  });

  it('vergibt jeden Ledger-Schlüssel genau einmal', () => {
    const keys = COMMS_PICTOGRAMS.map((d) => entryKey(`bbk-babz-2025:${d.section}`, d.variant));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('trägt eine alternative genau an den fünf Abschnitten, die eine haben', () => {
    const withAlternative = COMMS_PICTOGRAMS.filter((d) => d.variant === 'alternative').map(
      (d) => d.section,
    );
    expect(withAlternative).toEqual([...SECTIONS_WITH_ALTERNATIVE]);
  });

  it('bindet jede Darstellung an eine Belegdatei mit ihrem Abschnittspräfix', () => {
    for (const definition of COMMS_PICTOGRAMS) {
      expect(definition.referenceAsset, definition.section).toMatch(
        new RegExp(`^${definition.section.replace(/\./g, '\\.')}_`),
      );
    }
  });

  // Die leitergebundenen Fassungen sind an ihrem Dateinamen erkennbar. Der Test haelt fest, dass
  // Variante und Beleg zusammenpassen — eine alternative, die auf die drahtlose Datei zeigt,
  // waere ein Provenienzfehler und kein Formfehler.
  it('belegt jede alternative mit der leitergebundenen Datei', () => {
    for (const definition of COMMS_PICTOGRAMS) {
      const wired = definition.referenceAsset.includes('leitergebunden');
      expect(wired, `${definition.section}#${definition.variant}`).toBe(
        definition.variant === 'alternative',
      );
    }
  });

  it('führt jede Darstellung standalone mit mindestens einem Kontrastpaar', () => {
    for (const definition of COMMS_PICTOGRAMS) {
      expect(definition.placement.mode, definition.section).toBe('standalone');
      expect(definition.contrastPairs?.length ?? 0, definition.section).toBeGreaterThan(0);
    }
  });
});
