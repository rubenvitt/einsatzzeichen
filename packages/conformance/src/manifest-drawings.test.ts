import { describe, expect, it } from 'vitest';
import { BASE_SYMBOLS } from '@einsatzzeichen/core';
import { entryKey, type CoverageEntry } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { drawingForManifestEntry } from './manifest-drawings.js';

/*
 * Die gemeinsame Zeichnung je Manifestzeile für Fachreview-Werkzeug und Pixelvergleich. Der Kern
 * ist die Lückenlosigkeit — jede der 544 Zeilen bekommt ein Bild — und das Fail-closed-Verhalten:
 * eine Zeile ohne bildbare Zeichnung wirft mit Manifestschlüssel, statt still leer zu bleiben.
 */

const ENTRIES = COVERAGE_MANIFEST.entries as readonly CoverageEntry[];

function entryFor(key: string): CoverageEntry {
  const entry = ENTRIES.find((candidate) => entryKey(candidate.sourceId, candidate.variant) === key);
  if (entry === undefined) throw new Error(`Testzeile ${key} fehlt im Manifest.`);
  return entry;
}

function firstOf(coverage: CoverageEntry['coverage']): CoverageEntry {
  const entry = ENTRIES.find((candidate) => candidate.coverage === coverage);
  if (entry === undefined) throw new Error(`Keine Manifestzeile mit coverage "${coverage}".`);
  return entry;
}

describe('drawingForManifestEntry', () => {
  const results = ENTRIES.map((entry) => ({
    key: entryKey(entry.sourceId, entry.variant),
    entry,
    result: drawingForManifestEntry(entry),
  }));

  it('zeichnet alle 544 Manifestzeilen, jede mit viewBox und Inhalt', () => {
    expect(results).toHaveLength(544);
    for (const { key, result } of results) {
      expect(result.drawing.viewBox, `ohne viewBox: ${key}`).toBeDefined();
      expect(result.drawing.children.length, `leere Zeichnung: ${key}`).toBeGreaterThan(0);
    }
  });

  it('kennzeichnet genau die 19 nicht selbstständigen Elemente als Trägerzeichen', () => {
    const carriers = results.filter(({ result }) => result.carrierContext !== undefined);
    expect(carriers).toHaveLength(19);
    const hosts = carriers.map(({ result }) => result.carrierContext?.host);
    expect(hosts.filter((host) => host === 'formation')).toHaveLength(12);
    expect(hosts.filter((host) => host === 'vehicle-land')).toHaveLength(5);
    expect(hosts.filter((host) => host === 'trailer')).toHaveLength(2);
    for (const { entry, result } of carriers) {
      expect(entry.coverage).toBe('element');
      expect(result.carrierContext?.explanation).toContain('nicht Teil der geprüften Aussage');
    }
  });

  it('setzt die Anhängerfahrwerke an den Anhängerrumpf, nicht an das Landfahrzeug', () => {
    const trailers = results
      .filter(({ result }) => result.carrierContext?.host === 'trailer')
      .map(({ entry }) => entry.implementation)
      .sort();
    expect(trailers).toEqual([
      'vehicle-category.anhaenger-ein-rad',
      'vehicle-category.anhaenger-zwei-raeder',
    ]);
  });

  it('unterscheidet Piktogramme nach Variante: 4.1.6 primary und alternative sind zwei Bilder', () => {
    const primary = drawingForManifestEntry(entryFor('bbk-babz-2025:4.1.6#primary'));
    const alternative = drawingForManifestEntry(entryFor('bbk-babz-2025:4.1.6#alternative'));
    expect(primary.carrierContext).toBeUndefined();
    expect(alternative.carrierContext).toBeUndefined();
    expect(alternative.drawing.children).not.toEqual(primary.drawing.children);
  });

  it('gibt bei Katalogeinträgen eine Kopie heraus, keine Referenz auf den Katalog', () => {
    const entry = firstOf('catalog-entry');
    const catalogEntry = Object.values(BASE_SYMBOLS).find((item) => item.id === entry.implementation);
    const depiction = catalogEntry?.depictions.find((item) => item.variant === entry.variant);
    if (depiction === undefined) throw new Error(`Katalogeintrag zu ${entry.implementation} fehlt.`);
    const before = structuredClone(depiction.drawing);

    const { drawing } = drawingForManifestEntry(entry);
    expect(drawing).toEqual(depiction.drawing);
    expect(drawing).not.toBe(depiction.drawing);
    (drawing.children as unknown[]).length = 0;
    expect(depiction.drawing).toEqual(before);
  });

  describe('bricht mit Manifestschlüssel ab, wenn keine Zeichnung entsteht', () => {
    it('bei einem Katalogeintrag, den der Katalog nicht führt', () => {
      const entry = { ...firstOf('catalog-entry'), implementation: 'gibt-es-nicht' };
      const key = entryKey(entry.sourceId, entry.variant);
      expect(() => drawingForManifestEntry(entry)).toThrow(
        `Manifestzeile "${key}" nennt den Katalogeintrag "gibt-es-nicht"`,
      );
    });

    it('bei einer Rezeptzeile ohne das Präfix "recipe."', () => {
      const entry = { ...firstOf('composition-recipe'), implementation: 'C.1.1' };
      expect(() => drawingForManifestEntry(entry)).toThrow('beginnt nicht mit "recipe."');
    });

    it('bei einem Rezept, das der Katalog nicht führt', () => {
      const entry = { ...firstOf('composition-recipe'), implementation: 'recipe.gibt-es-nicht' };
      expect(() => drawingForManifestEntry(entry)).toThrow(
        'nennt das Rezept "gibt-es-nicht", das der Katalog nicht führt',
      );
    });

    it('bei einem Element, das weder Piktogramm noch Trägerelement ist', () => {
      const entry = { ...firstOf('element'), implementation: 'organization.gibt-es-nicht' };
      const key = entryKey(entry.sourceId, entry.variant);
      expect(() => drawingForManifestEntry(entry)).toThrow(
        `Manifestzeile "${key}": Element "organization.gibt-es-nicht" ist weder ein Piktogramm`,
      );
    });

    it('bei einer Coverage-Art außerhalb der Union', () => {
      const entry = {
        ...firstOf('element'),
        coverage: 'unbekannt',
      } as unknown as CoverageEntry;
      expect(() => drawingForManifestEntry(entry)).toThrow(
        'trägt die unbekannte Coverage-Art "unbekannt"',
      );
    });
  });
});
