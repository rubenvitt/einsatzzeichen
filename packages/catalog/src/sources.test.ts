import { describe, expect, it } from 'vitest';
import type { SourceRecord } from '@einsatzzeichen/schema';
import { SOURCE_REGISTRY, isRegisteredSource } from './sources.js';

describe('Quellenregister', () => {
  it('führt elf Quellen', () => {
    expect(Object.keys(SOURCE_REGISTRY)).toHaveLength(11);
  });

  it('trägt an jeder Quelle den eigenen Schlüssel als id', () => {
    for (const [key, record] of Object.entries<SourceRecord>(SOURCE_REGISTRY)) {
      expect(record.id).toBe(key);
    }
  });

  it('nennt an jeder Quelle Titel, Herausgeber, Geltungsbereich und eine Nutzungsgrundlage', () => {
    for (const record of Object.values<SourceRecord>(SOURCE_REGISTRY)) {
      expect(record.title.length).toBeGreaterThan(0);
      expect(record.publisher.length).toBeGreaterThan(0);
      expect(record.scope.length).toBeGreaterThan(0);
      expect(record.licence.basis.length).toBeGreaterThan(0);
    }
  });

  it('nennt für jede beschaffbare Quelle eine URL und für keine nicht beschaffte eine lokale Ablage', () => {
    for (const record of Object.values<SourceRecord>(SOURCE_REGISTRY)) {
      if (record.acquisition === 'public-url') expect(record.url).toMatch(/^https:\/\//);
      if (record.acquisition === 'not-acquired') expect(record.geometryUse).toEqual(['none']);
    }
  });

  it('führt babz-svg-2025 als einzige Quelle mit abgeleiteten Kennzahlen und rekonstruierter Bildidee', () => {
    const measured = Object.values<SourceRecord>(SOURCE_REGISTRY).filter((r) =>
      r.geometryUse.includes('measured-metrics'),
    );
    expect(measured.map((r) => r.id)).toEqual(['babz-svg-2025']);
    expect(SOURCE_REGISTRY['babz-svg-2025'].geometryUse).toEqual([
      'measured-metrics',
      'reconstructed',
    ]);
  });

  it('führt die unklare Lizenzlage von babz-svg-2025 maschinenlesbar', () => {
    expect(SOURCE_REGISTRY['babz-svg-2025'].licence.status).toBe('unclear');
  });

  it('führt jede nicht beschaffte DIN-Norm als geklärt', () => {
    const standards = Object.values<SourceRecord>(SOURCE_REGISTRY).filter(
      (r) => r.kind === 'standard',
    );
    expect(standards).toHaveLength(4);
    for (const record of standards) {
      expect(record.acquisition).toBe('not-acquired');
      expect(record.licence.status).toBe('clarified');
    }
  });

  it('trägt an jeder Quelle beide Reviewrollen mit zurechenbarem technischem Review', () => {
    for (const record of Object.values<SourceRecord>(SOURCE_REGISTRY)) {
      expect(record.review.technical.status).toBe('approved');
      expect(record.review.technical.reviewer).toBe('rv');
      expect(record.review.technical.date).toBe('2026-08-05');
      expect(record.review.domain.status).toBe('pending');
    }
  });

  it('erkennt registrierte und nicht registrierte Quellen-IDs', () => {
    expect(isRegisteredSource('bbk-babz-2025')).toBe(true);
    expect(isRegisteredSource('org-profile')).toBe(false);
    expect(isRegisteredSource('')).toBe(false);
  });
});
