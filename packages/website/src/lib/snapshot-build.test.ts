import { describe, expect, it } from 'vitest';
import {
  COVERAGE_MANIFEST,
  FREESTANDING_SPEC_FIXTURES,
  RECIPES,
  SOURCE_REGISTRY,
  checkCoverage,
  generativeReach,
  referenceInventory,
  releaseBlockers,
  ruleCoverage,
  validationRuleCoverage,
} from '@einsatzzeichen/conformance';
import {
  BASE_SYMBOLS,
  BODY_VARIANT_LABELS,
  CONTRAST_EXCEPTIONS,
  PLACES,
} from '@einsatzzeichen/core';
import { VALIDATION_RULE_IDS } from '@einsatzzeichen/core';
import {
  BODY_VARIANT_IDS,
  TECHNICAL_FILL_TOKENS,
  entryKey,
  isFreestandingSpec,
} from '@einsatzzeichen/schema';
import { searchCatalog } from './builder-catalog.js';
import { buildSnapshot } from './snapshot-build.js';
import { freestandingSpecForRow, unlistedFreestandingFixtures } from './snapshot-freestanding.js';
import { DERIVED_PLACE_CHAPTER } from './symbol-kinds.js';

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

  describe('abgeleitete Orte (LFH-1116)', () => {
    const places = snap.symbols.filter((symbol) => symbol.kind === 'derived-place');
    const derived = Object.values(PLACES).filter((place) => place.source.basis === 'derived');

    it('führt jeden abgeleiteten Ort genau einmal, unter `place.<Kennung>`', () => {
      expect(places.map((symbol) => symbol.id).sort()).toEqual(
        derived.map((place) => `place.${place.id}`).sort(),
      );
      for (const place of derived) {
        const symbol = places.find((candidate) => candidate.id === `place.${place.id}`);
        expect(symbol?.title).toBe(place.title);
        expect(symbol?.spec).toEqual(place.spec);
      }
    });

    it('gibt der Leitstelle kein Duplikat: sie bleibt die Manifestzeile D.2.5', () => {
      const measured = Object.values(PLACES).filter((place) => place.source.basis === 'measured');
      expect(measured.map((place) => place.id)).toEqual(['control-center']);
      expect(snap.symbols.some((symbol) => symbol.id === 'place.control-center')).toBe(false);
      const rows = snap.coverage.matrix.filter((row) => row.sourceId === 'bbk-babz-2025:D.2.5');
      expect(rows.map((row) => row.title)).toEqual(['Leitstelle']);
      expect(snap.coverage.matrix.length).toBe(COVERAGE_MANIFEST.entries.length);
    });

    it('setzt an Stelle von Abschnitt, Quelle und Prüfstatus nur Belegtes', () => {
      for (const symbol of places) {
        expect(symbol.sourceId, symbol.id).toBeUndefined();
        expect(symbol.derivedFrom, symbol.id).toEqual({
          sourceId: 'bbk-babz-2025:D.2.5',
          title: 'Leitstelle',
          section: 'D.2.5',
          chapter: 'Anhang D.2',
        });
        expect(symbol.chapter).toBe(DERIVED_PLACE_CHAPTER);
        expect(symbol.source.id).toBe('bbk-babz-2025');
        expect(symbol.source.page).toBeUndefined();
        expect(symbol.review).toEqual({
          technical: { status: 'pending' },
          domain: { status: 'pending' },
        });
        expect(symbol.evidence).toEqual([]);
      }
    });

    it('trägt die Ortsnotiz in der Zeichnung, ohne Referenzdateinamen', () => {
      for (const symbol of places) {
        const notes = (symbol.drawing.derivations ?? []).filter((note) => note.dimension === 'place');
        expect(notes, symbol.id).toHaveLength(1);
        expect(notes[0]?.from).toBe('[Referenzdatei]');
        expect(JSON.stringify(symbol)).not.toMatch(/\.svg/);
      }
    });

    it('steht im Katalog des Baukastens', () => {
      const { matches } = searchCatalog(snap.symbols, 'Einsatzleitung (Ort)', 5);
      expect(matches.map((symbol) => symbol.id)).toContain('place.incident-command');
    });
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

  // Zwei vollständige Snapshots; seit dem 2. Oktober 2026 zählt die generative Reichweite darin
  // 22 644 statt 868 gültige Kompositionen, und unter Volllast reichen 5 s nicht mehr.
  it('ist bei gleicher Zeit deterministisch', { timeout: 30_000 }, () => {
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
      if (row.coverage === 'element' && row.slug === undefined) continue;
      expect(row.slug, row.key).toBeDefined();
      const symbol = bySlug.get(row.slug ?? '');
      expect(symbol, row.key).toBeDefined();
      expect(symbol?.sourceId).toBe(row.sourceId);
      expect(symbol?.variant).toBe(row.variant);
      if (row.coverage === 'element') expect(symbol?.kind, row.key).toBe('freestanding');
    }
  });

  describe('freistehende Zeichen (ESZ-146)', () => {
    const freestanding = snap.symbols.filter((symbol) => symbol.kind === 'freestanding');
    const listed = freestanding.filter((symbol) => symbol.sourceId !== undefined);
    const unlisted = freestanding.filter((symbol) => symbol.sourceId === undefined);

    it('macht jede Elementzeile, die eine freistehende Spec zeichnet, zu genau einem Zeichen', () => {
      const rows = COVERAGE_MANIFEST.entries.filter((row) => freestandingSpecForRow(row) !== undefined);
      expect(listed.map((symbol) => entryKey(symbol.sourceId ?? '', symbol.variant)).sort()).toEqual(
        rows.map((row) => entryKey(row.sourceId, row.variant)).sort(),
      );
      for (const row of rows) {
        const symbol = listed.find(
          (candidate) => candidate.sourceId === row.sourceId && candidate.variant === row.variant,
        );
        expect(symbol?.spec, row.sourceId).toEqual(freestandingSpecForRow(row));
        expect(symbol?.title).toBe(row.title);
        expect(symbol?.id).toBe(
          row.variant === 'primary' ? row.implementation : `${row.implementation}#${row.variant}`,
        );
        // Der Prüfstand ist der der Zeile — nichts wird für die Seite erfunden.
        expect(symbol?.review.technical.status).toBe(row.review.technical.status);
        expect(symbol?.review.domain.status).toBe(row.review.domain.status);
        const matrixRow = snap.coverage.matrix.find(
          (candidate) => candidate.sourceId === row.sourceId && candidate.variant === row.variant,
        );
        expect(matrixRow?.slug).toBe(symbol?.slug);
      }
    });

    it('führt jede Referenzdatei der freistehenden Zeichen als Zeichen', () => {
      const specs = freestanding.map((symbol) => JSON.stringify(symbol.spec));
      for (const fixture of FREESTANDING_SPEC_FIXTURES) {
        expect(specs, fixture.asset).toContain(JSON.stringify(fixture.spec));
      }
      for (const symbol of freestanding) expect(isFreestandingSpec(symbol.spec), symbol.id).toBe(true);
    });

    it('zeichnet die zehn Wetterwerte aus 5.8.7 als Wetter mit einem Wert', () => {
      const values = listed.filter((symbol) => symbol.sourceId?.startsWith('bbk-babz-2025:5.8.7.'));
      expect(values).toHaveLength(10);
      for (const symbol of values) {
        expect(symbol.spec.kind, symbol.id).toBe('weather');
        if (symbol.spec.kind === 'weather') expect(symbol.spec.values, symbol.id).toHaveLength(1);
      }
    });

    it('lässt Zustände anderer Specs und die Leitstelle ohne eigene Seite', () => {
      const withoutPage = snap.coverage.matrix
        .filter((row) => row.coverage === 'element' && row.slug === undefined)
        .map((row) => row.key);
      expect(withoutPage).toContain('bbk-babz-2025:D.2.5#primary');
      expect(withoutPage).toContain('bbk-babz-2025:5.8.8.1#primary');
      expect(withoutPage).toContain('bbk-babz-2025:5.8.1.13#alternative');
      expect(withoutPage).toContain('bbk-babz-2025:2.1#primary');
      expect(snap.symbols.some((symbol) => symbol.id === 'state.person-uninjured')).toBe(false);
    });

    it('führt Pfeile, Linien und Wetterbeispiele ohne Manifestzeile mit offenem Prüfstand', () => {
      expect(unlisted).toHaveLength(unlistedFreestandingFixtures().length);
      const kinds = unlisted.map((symbol) => symbol.spec.kind);
      expect(kinds.filter((kind) => kind === 'movement')).toHaveLength(6);
      expect(kinds.filter((kind) => kind === 'line')).toHaveLength(8);
      expect(kinds.filter((kind) => kind === 'weather')).toHaveLength(4);
      for (const symbol of unlisted) {
        expect(symbol.review, symbol.id).toEqual({
          technical: { status: 'pending' },
          domain: { status: 'pending' },
        });
        expect(symbol.evidence).toEqual([]);
        expect(symbol.derivedFrom).toBeUndefined();
        expect(symbol.source.id).toBe(COVERAGE_MANIFEST.baseline);
      }
      const byId = new Map(unlisted.map((symbol) => [symbol.id, symbol]));
      expect(byId.get('movement.directed-movement')?.chapter).toBe('Kapitel 5.2');
      expect(byId.get('line.boundary-with-strength')?.title).toBe('Grenze mit taktischer Stärke');
      expect(byId.get('line.escape-route#alternative')?.variant).toBe('alternative');
      // Die Beispiele stehen unter ihrem Abschnitt, neben den zehn Wetterwerten.
      expect(byId.get('weather.cloudy-snowing-weak')?.chapter).toBe('Kapitel 5.8.7');
    });

    it('liefert keinen Referenzdateinamen aus', () => {
      for (const symbol of freestanding) expect(JSON.stringify(symbol), symbol.id).not.toMatch(/\.svg/);
    });

    it('steht im Katalog des Baukastens', () => {
      const { matches } = searchCatalog(snap.symbols, 'Faxübertragung', 5);
      expect(matches.map((symbol) => symbol.id)).toContain('comms.fax-transmission');
    });
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
        'tendency',
        'unitGrouping',
        'vehicleCategory',
        'wildfire',
      ].sort(),
    );
    for (const [field, values] of Object.entries(snap.builder)) {
      expect(values.length, field).toBeGreaterThan(0);
      for (const value of values) expect(value.label.length, `${field}/${value.id}`).toBeGreaterThan(0);
    }
  });

  it('bietet die Tinten-Tokens nicht als technische Füllung an (LFH-990)', () => {
    const ids = snap.builder.technicalFill.map((value) => value.id);
    expect(ids).toEqual([...TECHNICAL_FILL_TOKENS]);
    expect(ids).not.toContain('funktionslauf-kontrast');
    expect(ids).not.toContain('koerperlauf-kontrast');
  });

  it('trägt die abgeleitete Kapitelbezeichnung an jedem Zeichen mit Manifestzeile', () => {
    const bySourceId = new Map(snap.symbols.map((symbol) => [symbol.sourceId, symbol]));
    expect(bySourceId.get('bbk-babz-2025:E.1.1')?.chapter).toBe('Anhang E.1');
    expect(bySourceId.get('bbk-babz-2025:1.1')?.chapter).toBe('Kapitel 1');
    expect(bySourceId.get('bbk-babz-2025:J.1.1')?.chapter).toBe('Anhang J.1');
    for (const symbol of snap.symbols) {
      if (symbol.kind === 'derived-place') expect(symbol.chapter).toBe(DERIVED_PLACE_CHAPTER);
      else expect(symbol.chapter).toMatch(/^(Kapitel|Anhang) /);
    }
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
      expect(fills.length).toBe(TECHNICAL_FILL_TOKENS.length);
      for (const { id, label } of fills) {
        // Ein Bindestrich im Label heißt, dass der Bezeichner durchgereicht wurde
        // (`funktionslauf-kontrast`); ein Label gleich der ID heißt dasselbe für die übrigen.
        expect(label).not.toContain('-');
        expect(label).not.toBe(id);
        expect(label).toMatch(/^[A-ZÄÖÜ]/);
      }
    });

    // Dieselben Bezeichnungen, die `describeSymbolSpec` vorliest: der Verband aus
    // `UNIT_GROUPING_LABELS`, Zustand und Tendenz mit dem Titel ihrer Zeichnung aus Kapitel 5.8.
    it('beschriftet Verband, Zustand und Tendenz wie die vorgelesene Beschreibung', () => {
      const label = (field: string, id: string) =>
        snap.builder[field]?.find((entry) => entry.id === id)?.label;
      expect(label('unitGrouping', 'verband-ii')).toBe('Verband II');
      expect(label('states', 'person-injured')).toBe('Person verletzt');
      expect(label('tendency', 'tendency-rising')).toBe('Tendenz steigend');
      expect(snap.builder.tendency?.map((entry) => entry.id)).toEqual([
        'tendency-rising',
        'tendency-unchanged',
        'tendency-falling',
      ]);
    });

    it('benennt jede Körpervariante mit ihrer Bezeichnung aus `core` statt mit der Kennung (LFH-989)', () => {
      const entries = snap.builder.bodyVariant ?? [];
      expect(entries.map((entry) => entry.id)).toEqual([...BODY_VARIANT_IDS]);
      for (const { id, label } of entries) {
        expect(label, id).toBe(BODY_VARIANT_LABELS[id as keyof typeof BODY_VARIANT_LABELS]);
        expect(label, id).not.toBe(id);
      }
      expect(entries.find((entry) => entry.id === 'raised-gable')?.label).toBe(
        'ortsgebunden (Giebel)',
      );
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
        'Rot auf Weiß, Abschnitte 4.1.6, 4.1.7, 4.1.8, 5.8.1.7, 5.8.1.8, 5.8.1.10 und 5.8.1.11 ' +
          '(entschieden am 19.09.2026, Koordinator (delegiert))',
        'Rot auf der Ausgabefläche, Abschnitt L.10 (entschieden am 19.09.2026, Koordinator (delegiert))',
        'Schwarz auf Rot, Abschnitt 4.2.2 (entschieden am 19.09.2026, Koordinator (delegiert))',
      ]);
    });

    it('hängt denselben Klartext an das betroffene Zeichen', () => {
      const affected = snap.symbols.filter((symbol) => symbol.contrastException !== undefined);
      const composed = affected.filter((symbol) => symbol.kind !== 'freestanding');
      expect(composed.map((symbol) => symbol.id)).toEqual(['recipe.E.2.6']);
      expect(composed[0]?.contrastException).toBe(snap.coverage.contrastExceptions[0]);
      // Seit ESZ-146 tragen auch die freistehenden Piktogramme der genannten Abschnitte ihre
      // Ausnahme: rot auf weiß ist an 4.1.6 dasselbe Bild, ob mit Grundzeichen oder ohne.
      const freestanding = affected.filter((symbol) => symbol.kind === 'freestanding');
      expect(freestanding.length).toBeGreaterThan(0);
      for (const symbol of freestanding) {
        const section = (symbol.sourceId ?? '').split(':')[1] ?? '';
        const exception = CONTRAST_EXCEPTIONS.findIndex((candidate) =>
          candidate.sections.some((entry) => entry === section),
        );
        expect(exception, symbol.id).toBeGreaterThanOrEqual(0);
        expect(symbol.contrastException).toBe(snap.coverage.contrastExceptions[exception]);
      }
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
