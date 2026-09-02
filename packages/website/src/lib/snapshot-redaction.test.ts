import { describe, expect, it } from 'vitest';
import { withoutReferenceFilenames } from './snapshot-redaction.js';

/**
 * Aus `snapshot-build.test.ts` mitgezogen (LFH-503). Die Schwärzung ist die Zusage aus Spec §5.3
 * und hängt an nichts als am Muster — sie gehört neben ihr Modul und nicht zwischen die Prüfungen
 * des gebauten Snapshots.
 */
describe('withoutReferenceFilenames', () => {
  it('schwärzt Referenzdateinamen in Reviewnotizen sichtbar', () => {
    expect(
      withoutReferenceFilenames('geprüft gegen `4.1.3_Dekontaminieren.svg` am Rand'),
    ).toBe('geprüft gegen `[Referenzdatei]` am Rand');
    expect(() => withoutReferenceFilenames('unerkannt: .svg')).toThrow(/Schwärzung/);
  });

  it('erfasst auch einen Namen mit Leerzeichen und lässt Prosa ohne Dateinamen unberührt', () => {
    expect(
      withoutReferenceFilenames('Vorlage: `F.1.1_Medizinische Task Force.svg`, Seite 12'),
    ).toBe('Vorlage: `[Referenzdatei]`, Seite 12');
    expect(withoutReferenceFilenames('Fachlich geprüft, keine Abweichung.')).toBe(
      'Fachlich geprüft, keine Abweichung.',
    );
  });
});
