import { describe, expect, it } from 'vitest';
import type { SymbolSpec } from '@einsatzzeichen/schema';
import { validateSpec } from './validate.js';

describe('validateSpec', () => {
  it('akzeptiert eine Löschstaffel', () => {
    const spec: SymbolSpec = {
      kind: 'formation',
      organization: 'feuerwehr',
      strength: 'staffel',
      capabilities: ['fire-fighting'],
    };
    expect(validateSpec(spec)).toEqual([]);
  });

  it('lehnt eine Stärkeangabe an einer Gefahr ab', () => {
    const issues = validateSpec({ kind: 'hazard', strength: 'gruppe' });
    expect(issues.map((i) => i.rule)).toContain('strength-requires-unit');
  });

  it('lehnt eine Stärkeangabe an einem Gebäude ab', () => {
    const issues = validateSpec({ kind: 'building', strength: 'trupp' });
    expect(issues.map((i) => i.rule)).toContain('strength-requires-unit');
  });

  it('lehnt eine Fahrzeugkategorie an einer Formation ab', () => {
    const issues = validateSpec({ kind: 'formation', vehicleCategory: 'kettenfahrzeug' });
    expect(issues.map((i) => i.rule)).toContain('vehicle-category-requires-vehicle');
  });

  it('nimmt eine Fahrzeugkategorie am Landfahrzeug an', () => {
    // Seit LFH-424 zeichnet `compose()` die Fahrwerkszone. Vorher lehnte `validateSpec` diesen
    // Fall ab, damit die Angabe nicht still verschluckt wird.
    expect(validateSpec({ kind: 'vehicle-land', vehicleCategory: 'kfz-kategorie-1' })).toEqual([]);
  });

  it('lässt die oberhalb liegende F.2.7-Zone nur am Luftfahrzeug zu', () => {
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull', labels: { aboveLeft: 'ITH' },
    })).toEqual([]);
    expect(validateSpec({ kind: 'vehicle-air', labels: { aboveLeft: 'ITH' } })
      .map((issue) => issue.rule)).toContain('above-left-label-requires-measured-body');
    expect(validateSpec({ kind: 'formation', labels: { aboveLeft: 'ITH' } }).map((issue) => issue.rule))
      .toContain('above-left-label-requires-measured-body');
  });

  it('lässt die zweizeilige F.2.8-Zone nur am Landfahrzeug zu', () => {
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeftLines: ['GW-San', '50'] },
    }))
      .toEqual([]);
    expect(validateSpec({ kind: 'vehicle-land', labels: { topLeftLines: ['GW-San', '50'] } })
      .map((issue) => issue.rule)).toContain('top-left-lines-require-measured-body');
    expect(validateSpec({ kind: 'trailer', labels: { topLeftLines: ['GW-San', '50'] } })
      .map((issue) => issue.rule)).toContain('top-left-lines-require-measured-body');
  });

  it('bindet beide F.2-Sonderzonen an das exakte Art-/Variantenpaar', () => {
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'raised-hull',
      labels: { topLeftLines: ['GW-San', '50'] },
    }).map((issue) => issue.rule)).toContain('top-left-lines-require-measured-body');
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'plain-wheel-pair', labels: { aboveLeft: 'ITH' },
    }).map((issue) => issue.rule)).toContain('above-left-label-requires-measured-body');
  });

  it('lehnt überlagerte Fahrwerks- und Fußzonen an F.2-Körpervarianten ab', () => {
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair',
      vehicleCategory: 'kfz-kategorie-1',
    }).map((issue) => issue.rule)).toContain('plain-wheel-pair-chassis-conflict');
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', designation: 'Reserve',
    }).map((issue) => issue.rule)).toContain('body-variant-foot-conflict');
    expect(validateSpec({
      kind: 'vehicle-air', bodyVariant: 'raised-hull', designation: 'RTH',
    }).map((issue) => issue.rule)).toContain('body-variant-foot-conflict');
  });

  it('lehnt eine leere Einzelzeile der zweizeiligen Zone ab', () => {
    expect(validateSpec({ kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeftLines: ['GW-San', '  '] } })
      .map((issue) => issue.rule)).toContain('label-not-blank');
  });

  it('verlangt auch zur Laufzeit exakt zwei Zeilen statt zusätzliche still zu verlieren', () => {
    const invalid = ['GW-San', '50', 'Reserve'] as unknown as readonly [string, string];
    expect(validateSpec({
      kind: 'vehicle-land', bodyVariant: 'plain-wheel-pair', labels: { topLeftLines: invalid },
    }).map((issue) => issue.rule)).toContain('top-left-lines-exactly-two');
  });

  it.each(['vehicle-air', 'vehicle-water'] as const)(
    'lehnt eine Fahrzeugkategorie an "%s" ab',
    (kind) => {
      // Gemessen (18. August 2026): keine der drei Luftfahrzeugdateien 5.1.4.1 bis 5.1.4.3 und
      // keines der fünf Wasserfahrzeuge E.2.27 bis E.2.31 trägt eine Fahrwerkszone. „Fahrzeug"
      // war die Annahme, „Landfahrzeug" ist die Messung.
      const issues = validateSpec({ kind, vehicleCategory: 'kfz-kategorie-1' });
      expect(issues.map((i) => i.rule)).toEqual(['vehicle-category-requires-vehicle']);
    },
  );

  it('lehnt Fahrzeugkategorie und Bezeichnung gleichzeitig ab', () => {
    // Die Fahrwerkszone reicht 4,75 mm unter die Körperunterkante, die Fußzone beginnt 1 mm
    // darunter und ist 4 mm hoch — 3,75 mm Überschneidung. Kein Zeichen der Referenz trägt beides.
    const issues = validateSpec({
      kind: 'vehicle-land',
      vehicleCategory: 'kfz-kategorie-1',
      designation: 'MTW 1',
    });
    expect(issues.map((i) => i.rule)).toEqual(['chassis-foot-conflict']);
  });

  it('lässt eine Fahrzeugkategorie neben Beschriftungen im Körper zu', () => {
    // Anhang E.2 beschriftet seine Fahrzeuge ausschließlich in den Körperzonen — alle 26
    // Fahrwerksdateien tun das.
    expect(
      validateSpec({
        kind: 'vehicle-land',
        vehicleCategory: 'kfz-kategorie-1',
        labels: { bottomRight: 'THW' },
      }),
    ).toEqual([]);
  });

  it('lehnt eine Verwaltungsstufe ab, solange sie nichts zeichnet', () => {
    // Vorbestehender stiller Ausfall, nicht von LFH-424 erzeugt: bis hierher lieferte
    // `validateSpec` [] und `compose()` byteidentisches SVG mit und ohne das Feld.
    const issues = validateSpec({ kind: 'formation', administrativeLevel: 'kreis' });
    expect(issues.map((i) => i.rule)).toEqual(['administrative-level-not-implemented']);
  });

  it('lehnt Stärke und Verwaltungsstufe gleichzeitig ab', () => {
    const issues = validateSpec({
      kind: 'formation',
      strength: 'gruppe',
      administrativeLevel: 'kreis',
    });
    expect(issues.map((i) => i.rule)).toContain('head-zone-conflict');
  });

  it('lehnt eine leere Bezeichnung ab', () => {
    const issues = validateSpec({ kind: 'formation', designation: '   ' });
    expect(issues.map((i) => i.rule)).toContain('designation-not-blank');
  });

  it('nennt in jeder Meldung Regel und Begründung', () => {
    for (const issue of validateSpec({ kind: 'hazard', strength: 'gruppe' })) {
      expect(issue.rule).not.toBe('');
      expect(issue.message.length).toBeGreaterThan(10);
    }
  });
});
