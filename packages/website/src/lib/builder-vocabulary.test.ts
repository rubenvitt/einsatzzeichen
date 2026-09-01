import { describe, expect, it } from 'vitest';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { kindPreviews, labelFor, optionsFor, probeFields } from './builder-vocabulary.js';
import type { BuilderVocabulary } from './snapshot.js';

/**
 * Ein von Hand gestelltes Vokabular statt `buildSnapshot().builder`: geprüft wird die Ableitung
 * aus dem Vokabular (LFH-500), nicht der Datenstand des Katalogs. Die *Werte* darin sind echte
 * Katalogkennungen, weil `kindPreviews` und `probeFields` tatsächlich komponieren — mit erfundenen
 * Kennungen prüften die Tests nur den Fehlerpfad.
 */
const VOCABULARY: BuilderVocabulary = {
  kind: [
    { id: 'formation', label: 'Taktische Formation' },
    // Komponiert ohne weitere Zutat nicht — der Fall, für den die Kachel einen Platzhalter zeigt.
    { id: 'reduced-house', label: 'Reduziertes Haus' },
  ],
  strength: [
    { id: 'gruppe', label: 'Gruppe' },
    { id: 'zug', label: 'Zug' },
  ],
};

describe('optionsFor', () => {
  it('gibt die Werte einer Achse', () => {
    expect(optionsFor(VOCABULARY, 'strength').map((entry) => entry.id)).toEqual([
      'gruppe',
      'zug',
    ]);
  });

  it('gibt eine leere Liste für eine Achse ohne Register', () => {
    expect(optionsFor(VOCABULARY, 'designation')).toEqual([]);
    expect(optionsFor({}, 'kind')).toEqual([]);
  });
});

describe('labelFor', () => {
  it('übersetzt eine Kennung in ihre Bezeichnung', () => {
    expect(labelFor(VOCABULARY, 'strength', 'zug')).toBe('Zug');
  });

  it('zeigt die Kennung, wenn das Vokabular sie nicht führt', () => {
    expect(labelFor(VOCABULARY, 'strength', 'verband')).toBe('verband');
    expect(labelFor({}, 'kind', 'formation')).toBe('formation');
  });
});

describe('kindPreviews', () => {
  const previews = kindPreviews(VOCABULARY);

  it('komponiert für jede Grundzeichenart einen Eintrag', () => {
    expect([...previews.keys()]).toEqual(['formation', 'reduced-house']);
  });

  it('liefert eine Zeichnung, wo die nackte Grundform trägt', () => {
    expect(previews.get('formation')?.children.length).toBeGreaterThan(0);
  });

  /** `null`, nicht ein geworfener Fehler: die Kachel zeigt dann einen Platzhalterrahmen. */
  it('liefert `null`, wo die nackte Grundform nicht trägt', () => {
    expect(previews.get('reduced-house')).toBeNull();
  });
});

describe('probeFields', () => {
  const spec: SymbolSpec = { kind: 'formation' };
  const probes = probeFields(VOCABULARY, spec, ['kind', 'strength']);

  it('legt je Feld eine Zuordnung Kennung → Befund an', () => {
    expect([...probes.keys()]).toEqual(['kind', 'strength']);
    expect([...(probes.get('strength') ?? new Map()).keys()]).toEqual(['gruppe', 'zug']);
  });

  it('meldet tragfähige Werte als nicht gesperrt', () => {
    expect(probes.get('strength')?.get('gruppe')?.blocked).toBeUndefined();
  });

  /**
   * Die Insel macht aus `blocked` den Satz im Tooltip. Geprüft wird deshalb, dass ein gesperrter
   * Wert überhaupt einen Grund trägt — welcher der beiden es ist, entscheidet der Katalog.
   */
  it('begründet einen gesperrten Wert, statt ihn nur wegzulassen', () => {
    const blocked = probes.get('kind')?.get('reduced-house')?.blocked;
    expect(blocked).toBeDefined();
    const reason = blocked?.because === 'rule' ? blocked.explanation : blocked?.detail;
    expect(reason?.length).toBeGreaterThan(0);
  });

  it('legt für eine Achse ohne Register eine leere Zuordnung an, statt zu werfen', () => {
    const bare = probeFields({}, spec, ['strength']);
    expect(bare.get('strength')?.size).toBe(0);
  });
});
