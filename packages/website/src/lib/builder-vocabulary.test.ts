import { describe, expect, it } from 'vitest';
import { SPEC_FIELD_VALUES, VOCABULARY_FIELDS, checkSpec } from '@einsatzzeichen/core';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import {
  kindPreviews,
  labelFor,
  optionsFor,
  probeFields,
  unmeasuredField,
} from './builder-vocabulary.js';
import type { AllowedValue } from './builder-state.js';
import { builderVocabulary } from './snapshot-vocabulary.js';
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
    // Komponiert nackt (seit dem 2. Oktober 2026 auch ohne Organisation), sperrt aber neben einer
    // Stärke: `strength-requires-unit`.
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

describe('builderVocabulary() gegen den Wertevorrat aus core', () => {
  /**
   * Die Auswahllisten entstehen zur Bauzeit aus den Registern des Katalogs, die Probe rechnet in
   * `core` gegen `SPEC_FIELD_VALUES` — und lehnt einen Kandidaten außerhalb davon mit einem
   * `RangeError` ab. Liefen beide auseinander, bräche der Baukasten beim ersten Render.
   */
  it('bietet je Feld nur Werte aus dem Vorrat an', () => {
    const vocabulary = builderVocabulary();
    for (const field of VOCABULARY_FIELDS) {
      const domain = new Set<string>(SPEC_FIELD_VALUES[field].values);
      for (const entry of optionsFor(vocabulary, field)) {
        expect(domain.has(entry.id), `${field}: ${entry.id}`).toBe(true);
      }
    }
  });

  /**
   * Die Gegenrichtung: jedes Feld mit aufzählbarem Vorrat hat auch eine Auswahlliste. Bekommt
   * `SymbolSpec` ein neues Feld (LFH-577: Verband, Zustände, Tendenz), stünde es im Baukasten
   * sonst ohne Werte da — und `probeFields` probierte still gar nichts.
   */
  it('führt für jedes aufzählbare Feld eine Auswahlliste', () => {
    const vocabulary = builderVocabulary();
    for (const field of VOCABULARY_FIELDS) {
      expect(optionsFor(vocabulary, field).length, field).toBeGreaterThan(0);
    }
  });
});

describe('kindPreviews', () => {
  const previews = kindPreviews(VOCABULARY);

  it('zeigt dieselbe Zeichnung wie checkSpec aus core', () => {
    const result = checkSpec({ kind: 'formation' });
    expect(result.ok && previews.get('formation')).toEqual(result.ok && result.drawing);
  });

  it('komponiert für jede Grundzeichenart einen Eintrag', () => {
    expect([...previews.keys()]).toEqual(['formation', 'reduced-house']);
  });

  it('liefert eine Zeichnung, wo die nackte Grundform trägt', () => {
    expect(previews.get('formation')?.children.length).toBeGreaterThan(0);
  });

  /** `null`, nicht ein geworfener Fehler: die Kachel zeigt dann einen Platzhalterrahmen. */
  it('liefert `null`, wo die nackte Grundform nicht trägt', () => {
    // Seit dem 2. Oktober 2026 trägt jede nackte Grundzeichenart. Den Platzhalter zeigt die Kachel
    // nur noch für eine Kennung, die der Katalog nicht kennt (etwa aus einem älteren Snapshot).
    const unknown = kindPreviews({ kind: [{ id: 'gibt-es-nicht', label: 'Unbekannt' }] });
    expect(unknown.get('gibt-es-nicht')).toBeNull();
  });
});

describe('probeFields', () => {
  const spec: SymbolSpec = { kind: 'formation', strength: 'gruppe' };
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

describe('unmeasuredField', () => {
  const vocabulary = builderVocabulary();

  /**
   * Meldet `core` jeden Wert eines Feldes als nicht vermessen mit `scope: 'value'`, gibt es im
   * Feld keinen anderen Wert, zu dem sich raten ließe — genau das soll die Insel erkennen, ohne
   * das Feld beim Namen zu kennen. Bis zum 02.10.2026 war die Tendenz dieses Feld; seitdem wird
   * sie abgeleitet gezeichnet, und die Probe steht hier von Hand, damit sie nicht an einer Lücke
   * hängt, die der Motor gerade schließt.
   */
  it('erkennt ein Feld, in dem sich kein einziger Wert zeichnen lässt', () => {
    const gap = (value: string): [string, AllowedValue] => [
      value,
      { value, ok: false, issues: [], blocked: { because: 'not-measured', detail: 'Lücke', scope: 'value' } },
    ];
    const probe = new Map([gap('a'), gap('b'), gap('c')]);
    expect(unmeasuredField(probe)).toBe(true);
    // Eine Lücke mit `scope: 'combination'` trägt eine andere Grundform — dann gibt es etwas zu raten.
    probe.set('d', { value: 'd', ok: false, issues: [], blocked: { because: 'not-measured', detail: 'Lücke', scope: 'combination' } });
    expect(unmeasuredField(probe)).toBe(false);
  });

  it('meldet die Tendenz nicht mehr: sie ist seit dem 02.10.2026 an jedem Träger gezeichnet', () => {
    const probes = probeFields(vocabulary, { kind: 'person' }, ['tendency']);
    expect(unmeasuredField(probes.get('tendency'))).toBe(false);
  });

  it('meldet ein Feld mit wenigstens einem zeichenbaren Wert nicht', () => {
    // Verband III ist nicht vermessen, I und II an der Formation schon.
    const probes = probeFields(vocabulary, { kind: 'formation' }, ['unitGrouping']);
    expect(probes.get('unitGrouping')?.get('verband-iii')?.blocked?.because).toBe('not-measured');
    expect(unmeasuredField(probes.get('unitGrouping'))).toBe(false);
  });

  it('meldet ein Feld ohne Probe oder ohne Werte nicht', () => {
    expect(unmeasuredField(undefined)).toBe(false);
    expect(unmeasuredField(new Map())).toBe(false);
  });
});
