import { describe, expect, it } from 'vitest';
import { isDataVersion } from '@einsatzzeichen/schema';
import { PROFILES, profileFor } from './profiles.js';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';

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

  it('trägt am Profil beide Reviewrollen, das fachliche zurechenbar freigegeben', () => {
    const review = profileFor('bund').review;
    expect(review.technical.status).toBe('approved');
    expect(review.technical.reviewer).toBe('rv');
    expect(review.domain.status).toBe('approved');
    expect(review.domain.reviewer).toBe('Ruben Vitt');
    expect(review.domain.date).toBe('2026-08-28');
    expect(review.domain.note).toContain('Sammelfreigabe im Rahmen von LFH-429');
  });
});
