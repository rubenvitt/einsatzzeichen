import { describe, expect, it } from 'vitest';
import { isDataVersion } from '@einsatzzeichen/schema';
import { PROFILES, profileFor } from './profiles.js';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { erwarteZurechenbaresFachreview } from './test-support/domain-review.js';

describe('Profilregister', () => {
  it('führt den bundesweiten Kern als einziges Profil', () => {
    expect(Object.keys(PROFILES)).toEqual(['bund']);
  });

  it('gibt zu jeder ID den Datensatz mit derselben ID zurück', () => {
    expect(profileFor('bund').id).toBe('bund');
  });

  it('führt für jedes Profil eine gültige Datenversion und Kernprüfversion', () => {
    for (const record of Object.values(PROFILES)) {
      expect(isDataVersion(record.version)).toBe(true);
      expect(isDataVersion(record.verifiedAgainstCore)).toBe(true);
    }
  });

  it('setzt beim Kern Datenversion, Kernprüfversion und Manifestversion gleich', () => {
    const bund = profileFor('bund');
    expect(bund.version).toBe(bund.verifiedAgainstCore);
    expect(bund.version).toBe(COVERAGE_MANIFEST.coreVersion);
  });

  it('versioniert den um öffentliche LFH-490-Piktogramm-IDs erweiterten Kern synchron als 0.2.0', () => {
    expect(COVERAGE_MANIFEST.coreVersion).toBe('0.2.0');
    expect(profileFor('bund')).toMatchObject({
      version: '0.2.0',
      verifiedAgainstCore: '0.2.0',
    });
  });

  it('stützt den Kern auf die Baseline und die Referenzdateien', () => {
    expect(profileFor('bund').sources).toEqual(['bbk-babz-2025', 'babz-svg-2025']);
  });

  it('trägt am Profil beide Reviewrollen mit zurechenbarem fachlichem Review', () => {
    // Strukturaussage bleibt: beide Rollen sind vorhanden, das technische ist freigegeben und
    // von `rv` verantwortet. Beim Fachreview wird nur noch die Invariante geprüft — vorhanden,
    // und falls entschieden zurechenbar. Der frühere `toBe('pending')` hätte bei der ersten
    // Profilfreigabe durch das Fachreview-Werkzeug rot gemeldet, obwohl nichts kaputt wäre.
    const review = profileFor('bund').review;
    expect(review.technical.status).toBe('approved');
    expect(review.technical.reviewer).toBe('rv');
    erwarteZurechenbaresFachreview(review, 'profile:bund');
  });
});
