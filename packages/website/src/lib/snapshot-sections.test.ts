import { describe, expect, it } from 'vitest';
import { areaOf, chapterForSection, registryIdOf, sectionOf } from './snapshot-sections.js';

/**
 * Aus `snapshot-build.test.ts` mitgezogen (LFH-503): die Kapitelableitung ist eine reine Funktion
 * über eine Zeichenkette und braucht den gebauten Snapshot nicht. Dass sie an jedem Zeichen
 * ankommt, prüft weiterhin der Test beim Orchestrator.
 */
describe('Manifestschlüssel', () => {
  it('leitet die Kapitelbezeichnung aus der Abschnittsnummer ab', () => {
    expect(chapterForSection('E.1.1')).toBe('Anhang E.1');
    expect(chapterForSection('4.6.4')).toBe('Kapitel 4.6');
    expect(chapterForSection('C.2.14')).toBe('Anhang C.2');
    expect(chapterForSection('1.1')).toBe('Kapitel 1');
    expect(() => chapterForSection('#')).toThrow(/Kapitelbezeichnung/);
  });

  it('trennt Quelle und Abschnitt am ersten Doppelpunkt', () => {
    expect(registryIdOf('bbk-babz-2025:E.1.1')).toBe('bbk-babz-2025');
    expect(sectionOf('bbk-babz-2025:E.1.1')).toBe('E.1.1');
    // Ohne Doppelpunkt bleibt der Schlüssel ganz — beide Funktionen liefern dasselbe zurück,
    // statt eine leere Zeichenkette in einen Zitat- oder Kapitelnamen zu tragen.
    expect(registryIdOf('E.1.1')).toBe('E.1.1');
    expect(sectionOf('E.1.1')).toBe('E.1.1');
  });

  it('nimmt als Bereich den Teil vor dem ersten Punkt', () => {
    expect(areaOf('E.1.1')).toBe('E');
    expect(areaOf('4.6.4')).toBe('4');
    expect(areaOf('7')).toBe('7');
  });
});
