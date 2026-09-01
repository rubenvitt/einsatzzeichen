import { describe, expect, it } from 'vitest';
import {
  BASE_SYMBOLS,
  CONTRAST_EXCEPTIONS,
  COVERAGE_MANIFEST,
  RECIPES,
  SOURCE_REGISTRY,
  checkCoverage,
  generativeReach,
  referenceInventory,
  releaseBlockers,
  ruleCoverage,
  validationRuleCoverage,
} from '@einsatzzeichen/catalog';
import { VALIDATION_RULE_IDS } from '@einsatzzeichen/core';
import { PALETTE } from '@einsatzzeichen/schema';
import { buildSnapshot } from './snapshot-build.js';

describe('buildSnapshot', () => {
  const snap = buildSnapshot(new Date('2026-08-28T00:00:00Z'));

  it('führt jedes Rezept genau einmal', () => {
    const recipeIds = snap.symbols
      .filter((symbol) => symbol.kind === 'composition-recipe')
      .map((symbol) => symbol.id)
      .sort();
    // Belegte Präfixkonvention: `coverage-manifest.ts` schreibt `implementation: `recipe.${key}``
    // mit dem unveränderten Rezeptschlüssel, Variantensuffix `#alternative` eingeschlossen.
    expect(recipeIds).toEqual(Object.keys(RECIPES).map((key) => `recipe.${key}`).sort());
  });

  it('führt jede Darstellung jedes Katalogeintrags genau einmal', () => {
    const entryIds = snap.symbols
      .filter((symbol) => symbol.kind === 'catalog-entry')
      .map((symbol) => symbol.id)
      .sort();
    const expected = Object.values(BASE_SYMBOLS)
      .flatMap((entry) =>
        entry.depictions.map((depiction) =>
          depiction.variant === 'primary' ? entry.id : `${entry.id}#${depiction.variant}`,
        ),
      )
      .sort();
    expect(entryIds).toEqual(expected);
  });

  it('vergibt eindeutige Slugs', () => {
    const slugs = snap.symbols.map((symbol) => symbol.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('trägt dieselben Zahlen wie das Coverage-Kommando', () => {
    expect(snap.coverage.entries).toBe(COVERAGE_MANIFEST.entries.length);
    expect(snap.coverage.sources).toBe(Object.keys(SOURCE_REGISTRY).length);
    expect(snap.baseline).toBe(COVERAGE_MANIFEST.baseline);
    expect(snap.coverage.coreVersion).toBe(COVERAGE_MANIFEST.coreVersion);
    expect(snap.coverage.scope).toEqual([...COVERAGE_MANIFEST.scope]);
    const blockers = releaseBlockers();
    expect(snap.coverage.blockers.length).toBeGreaterThanOrEqual(
      blockers.domainReviewOpen.length > 0 ? 1 : 0,
    );
    expect(snap.coverage.openDomainReviewsByArea.reduce((sum, area) => sum + area.count, 0)).toBe(
      blockers.domainReviewOpen.length,
    );
    expect(checkCoverage().missing).toEqual([]);
  });

  it('trägt die drei Achsen des Coverage-Kommandos mit deren Zahlen', () => {
    const [reference, rules, reach] = snap.coverage.axes;
    expect(snap.coverage.axes.map((axis) => axis.label)).toEqual([
      'Referenzabdeckung',
      'Regelabdeckung',
      'Generative Reichweite',
    ]);
    const inventory = referenceInventory();
    expect(reference?.value).toBe(inventory.claimed);
    expect(reference?.of).toBe(inventory.total);
    const axes = ruleCoverage();
    expect(rules?.value).toBe(axes.filter((axis) => axis.missing.length === 0).length);
    expect(rules?.of).toBe(axes.length);
    expect(rules?.detail).toContain(`${validationRuleCoverage().total} Validierungsregeln`);
    const generated = generativeReach();
    expect(reach?.value).toBe(generated.valid);
    expect(reach?.of).toBe(generated.enumerated);
  });

  it('ist bei gleicher Zeit deterministisch', () => {
    // Belegt zugleich, dass `generativeReach().durationMs` nirgends in den Snapshot gerät.
    const now = new Date('2026-08-28T00:00:00Z');
    expect(JSON.stringify(buildSnapshot(now))).toBe(JSON.stringify(buildSnapshot(now)));
  });

  it('hat für jede Manifestzeile eine Matrixzeile', () => {
    expect(snap.coverage.matrix.length).toBe(COVERAGE_MANIFEST.entries.length);
  });

  it('verknüpft jede Zeichenzeile der Matrix mit einem Slug', () => {
    const bySlug = new Map(snap.symbols.map((symbol) => [symbol.slug, symbol]));
    for (const row of snap.coverage.matrix) {
      if (row.coverage === 'element') {
        expect(row.slug).toBeUndefined();
      } else {
        expect(row.slug, row.key).toBeDefined();
        expect(bySlug.has(row.slug ?? '')).toBe(true);
      }
    }
  });

  it('führt alle Validierungsregeln und ein Builder-Vokabular', () => {
    expect(snap.ruleIds).toEqual([...VALIDATION_RULE_IDS]);
    expect(Object.keys(snap.builder).sort()).toEqual(
      [
        'administrativeLevel',
        'bodyMarks',
        'bodyVariant',
        'capabilities',
        'comms',
        'damage',
        'functionRole',
        'kind',
        'organization',
        'states',
        'strength',
        'technicalFill',
        'technicalHeadMark',
        'vehicleCategory',
        'wildfire',
      ].sort(),
    );
    for (const [field, values] of Object.entries(snap.builder)) {
      expect(values.length, field).toBeGreaterThan(0);
      for (const value of values) expect(value.label.length, `${field}/${value.id}`).toBeGreaterThan(0);
    }
  });

  it('trägt die abgeleitete Kapitelbezeichnung an jedem Zeichen', () => {
    const bySourceId = new Map(snap.symbols.map((symbol) => [symbol.sourceId, symbol]));
    expect(bySourceId.get('bbk-babz-2025:E.1.1')?.chapter).toBe('Anhang E.1');
    expect(bySourceId.get('bbk-babz-2025:1.1')?.chapter).toBe('Kapitel 1');
    for (const symbol of snap.symbols) expect(symbol.chapter).toMatch(/^(Kapitel|Anhang) /);
  });

  it('ist JSON-serialisierbar ohne Verlust', () => {
    expect(JSON.parse(JSON.stringify(snap))).toEqual(snap);
  });

  it('setzt generatedAt aus der übergebenen Zeit', () => {
    expect(snap.generatedAt).toBe('2026-08-28T00:00:00.000Z');
  });

  describe('Bezeichnungen im Baukastenvokabular', () => {
    it('beschriftet jede technische Füllung mit einem deutschen Wort statt mit ihrem Token', () => {
      const fills = snap.builder.technicalFill;
      expect(fills.length).toBe(Object.keys(PALETTE).length);
      for (const { id, label } of fills) {
        // Ein Bindestrich im Label heißt, dass der Bezeichner durchgereicht wurde
        // (`funktionslauf-kontrast`); ein Label gleich der ID heißt dasselbe für die übrigen.
        expect(label).not.toContain('-');
        expect(label).not.toBe(id);
        expect(label).toMatch(/^[A-ZÄÖÜ]/);
      }
    });

    it('lässt `bodyVariant` als dokumentierte Ausnahme bei seiner ID', () => {
      for (const { id, label } of snap.builder.bodyVariant) expect(label).toBe(id);
    });
  });

  describe('Kontrastausnahmen im Klartext', () => {
    // Die Zeichenkette steht auf drei Seiten: als Listenpunkt unter „Stand der Prüfung", als
    // Listenpunkt in der Druckanleitung und mitten im Satz auf der Zeichenseite hinter einem
    // Doppelpunkt. Deshalb wird sie hier wörtlich festgehalten und nicht nur auf Bestandteile
    // geprüft — eine Formulierung, die nur in der Liste funktioniert, fiele sonst erst im Satz auf.
    it('nennt Farben, Abschnitt, Datum und Entscheiderin in einem lesbaren Satzteil', () => {
      expect(snap.coverage.contrastExceptions).toEqual([
        'Weiß auf Orange, Abschnitt E.2.6 (entschieden am 18.08.2026, Projektinhaber)',
      ]);
    });

    it('hängt denselben Klartext an das betroffene Zeichen', () => {
      const affected = snap.symbols.filter((symbol) => symbol.contrastException !== undefined);
      expect(affected.map((symbol) => symbol.id)).toEqual(['recipe.E.2.6']);
      expect(affected[0]?.contrastException).toBe(snap.coverage.contrastExceptions[0]);
    });

    it('lässt kein Farbtoken und kein ISO-Datum in die Prosa durch', () => {
      for (const text of snap.coverage.contrastExceptions) {
        // `weiss`, `gruen`, `hellgruen` und Konsorten sind Bezeichner, keine deutschen Wörter.
        expect(text).not.toMatch(/\b(weiss|gruen|hellgruen|hellblau|hellgrau|schwarz|braun)\b/);
        expect(text).not.toMatch(/\d{4}-\d{2}-\d{2}/);
      }
    });

    it('übersetzt jedes Farbtoken des Schemas, damit kein „undefined" im Satz landet', () => {
      // Nicht die Tabelle `COLOR_WORDS` (die steht seit dem Schnitt exportiert in
      // `snapshot-colors.ts`), sondern die Zusage über die Daten: jede Ausnahme des Katalogs muss
      // vollständig übersetzt herauskommen.
      for (const exception of CONTRAST_EXCEPTIONS) {
        const text = snap.coverage.contrastExceptions.find((candidate) =>
          candidate.includes(exception.sections[0] ?? ''),
        );
        expect(text).toBeDefined();
        expect(text).not.toContain('undefined');
      }
    });
  });
});
