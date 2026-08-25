import { describe, expect, it } from 'vitest';
import { DEFAULT_VIEWBOX_MM, entryKey, type CatalogEntry } from '@einsatzzeichen/schema';
import { COVERAGE_MANIFEST } from './coverage-manifest.js';
import { checkCoverage, findPrimaryViolations, releaseBlockers } from './coverage-gate.js';
import { ALL_PICTOGRAMS, pictogramVariantKey } from './pictograms/index.js';

// Dieselbe Vorlage wie in `coverage-gate.test.ts`: beide Dateien brauchen einen Katalogeintrag
// mit einstellbarer Zahl von `primary`-Darstellungen, und ein gemeinsames Testmodul für eine
// einzige Vorlage wäre eine Abhängigkeit ohne Gegenwert.
function fixtureEntry(id: string, primaryCount: number): CatalogEntry {
  return {
    id,
    title: 'Test',
    kind: 'formation',
    profile: 'bund',
    depictions: Array.from({ length: primaryCount }, () => ({
      variant: 'primary' as const,
      drawing: { viewBox: DEFAULT_VIEWBOX_MM, children: [] },
      sourceRefs: [],
    })),
  };
}

describe('Coverage-Manifest', () => {
  it('exportiert Manifestmetadaten als tief readonly Typvertrag', () => {
    if (false) {
      // @ts-expect-error Das veröffentlichte Manifest ist unveränderlich.
      COVERAGE_MANIFEST.coreVersion = 'manipuliert';
      const entry = COVERAGE_MANIFEST.entries[0];
      // @ts-expect-error Auch eine einzelne Manifestzeile ist unveränderlich.
      entry.title = 'Manipuliert';
      // @ts-expect-error Auch verschachtelte Reviewdaten sind unveränderlich.
      entry.review.technical.status = 'pending';
    }
    expect(true).toBe(true);
  });

  it('friert Manifest, Zeilen und verschachtelte Metadaten tief ein', () => {
    const entry = COVERAGE_MANIFEST.entries[0];
    expect(Object.isFrozen(COVERAGE_MANIFEST)).toBe(true);
    expect(Object.isFrozen(COVERAGE_MANIFEST.scope)).toBe(true);
    expect(Object.isFrozen(COVERAGE_MANIFEST.entries)).toBe(true);
    expect(Object.isFrozen(entry)).toBe(true);
    expect(Object.isFrozen(entry.testEvidence)).toBe(true);
    expect(Object.isFrozen(entry.review)).toBe(true);
    expect(Object.isFrozen(entry.review.technical)).toBe(true);
  });

  it('weist Laufzeitmutationen an Manifestzeilen zurück', () => {
    const entry = COVERAGE_MANIFEST.entries[0];
    const originalTitle = entry.title;
    const titleWasSet = Reflect.set(entry, 'title', 'Manipuliert');
    const observedTitle = entry.title;
    if (titleWasSet) Reflect.set(entry, 'title', originalTitle);

    expect(titleWasSet).toBe(false);
    expect(observedTitle).toBe(originalTitle);
  });

  it('ist über Quellen-ID und Variante eindeutig keyfähig', () => {
    const keys = COVERAGE_MANIFEST.entries.map((e) => entryKey(e.sourceId, e.variant));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('enthält alle drei Eintragsarten', () => {
    const kinds = new Set(COVERAGE_MANIFEST.entries.map((e) => e.coverage));
    expect(kinds).toContain('catalog-entry');
    expect(kinds).toContain('composition-recipe');
    expect(kinds).toContain('element');
  });

  it('enthält exakt 383 Zeilen mit 273 Elementdarstellungen', () => {
    const elementRows = COVERAGE_MANIFEST.entries.filter((entry) => entry.coverage === 'element');
    const pictogramRows = elementRows.filter(
      (entry) =>
        entry.implementation.startsWith('capability.') ||
        entry.implementation.startsWith('state.') ||
        entry.implementation.startsWith('comms.') ||
        entry.implementation.startsWith('damage.') ||
        entry.implementation.startsWith('wildfire.'),
    );
    const counts = COVERAGE_MANIFEST.entries.reduce<Record<string, number>>((acc, e) => {
      acc[e.coverage] = (acc[e.coverage] ?? 0) + 1;
      return acc;
    }, {});
    expect(counts).toEqual({
      // Seit LFH-424 alle vierzehn Grundzeichen aus Kapitel 1 statt acht.
      'catalog-entry': 14,
      // 3 Belegfälle des Kompositionsmotors plus die 68 Zeichen aus Anhang E — 16 aus
      // Teilslice E-a, zwölf aus E-b und neun aus E-c (damit ist E.1 vollständig), 21 aus E-d,
      // fünf aus E-e und fünf aus E-f. **68 und damit vollständig** seit E.2.6 am 18. August 2026
      // nachgezogen wurde; die Lückenlosigkeit hält der Test „führt Anhang E lückenlos" unten
      // fest, und erst er trägt das `E` im `scope`. Dazu elf Zeilen aus F-a und 14 aus F-b:
      // F.1.3 sowie F.1.12 bis F.1.22 einschließlich der Alternativen von F.1.12 und F.1.15.
      // F-a umfasst zehn
      // Abschnitte, denn `F.1.11` führt als erster Abschnitt des Katalogs neben `primary` eine
      // `alternative` — die Zeile zählt einzeln, weil das Manifest Darstellungen zählt und nicht
      // Abschnitte, weil F.1.3 dort noch bewusst offen blieb; F-b baut es mit `foot-band`.
      'composition-recipe': 96,
      // 254 Piktogramme plus acht Organisationen (seit LFH-424 mit hilfsorganisation), vier
      // Stärkegrade und sieben Fahrwerkszonen — fünf Fahrzeugkategorien aus 5.1.1 und die beiden
      // Anhängerfahrwerke aus 5.1.2.4/5.1.2.5, die der Teilslice E.2 vermessen hat.
      // `amphibienfahrzeug` hat weiterhin keinen Eintrag, weil seine Wellenlinie nur als
      // Strichhülle vermessen ist.
      element: 273,
    });
    expect(COVERAGE_MANIFEST.entries).toHaveLength(383);
    expect(elementRows).toHaveLength(273);
    expect(pictogramRows).toHaveLength(254);
    expect(elementRows.filter((entry) => !pictogramRows.includes(entry))).toHaveLength(19);
  });

  it('führt Anhang E lückenlos und trägt damit das `E` im beanspruchten Umfang', () => {
    // **Der Test, ohne den das `E` im `scope` eine unwiderlegbare Behauptung wäre.**
    // `uncoveredScope` prüft an einem Präfix nur, ob **eine** Zeile mit ihm beginnt; `E` bestünde
    // also schon mit einer einzigen E.1-Zeile. Genau deshalb standen die Abschnitte bis zum
    // 18. August 2026 einzeln. Diese Zeile ersetzt 31 Umfangszeilen durch eine geprüfte Aussage.
    //
    // Abgeleitet aus den **Manifesteinträgen** und nicht aus `RECIPES`, weil der `scope` eine
    // Aussage über das Manifest ist und hier neben der Lückenlosigkeit auch `scope` und
    // `uncoveredScope` geprüft werden — beides gibt es in `RECIPES` nicht.
    //
    // Was diese Zeile ausdrücklich **nicht** ist: eine zweite, unabhängige Quelle. Die E-Zeilen
    // des Manifests entstehen aus `RECIPES`; ein Rezept ohne Manifestzeile ist strukturell
    // unmöglich, und die abgeleitete Abschnittsmenge ist deshalb mengengleich mit der aus
    // `RECIPES`. Der Schwestertest in `recipes.test.ts` ist Redundanz und keine Gegenprobe. Wer
    // eine echte zweite Quelle will, müsste gegen `taktische-zeichen/` zählen.
    const abschnitte = COVERAGE_MANIFEST.entries
      .map((entry) => entry.sourceId.slice(entry.sourceId.indexOf(':') + 1))
      .filter((section) => section.startsWith('E.'));
    const erwartet = [
      ...Array.from({ length: 37 }, (_, index) => `E.1.${index + 1}`),
      ...Array.from({ length: 31 }, (_, index) => `E.2.${index + 1}`),
    ];
    // Numerisch und nicht lexikografisch sortiert — `localeCompare` stellt `E.1.10` vor `E.1.2`
    // und machte jeden Fehlschlag unlesbar.
    const numerisch = (section: string) =>
      section.split('.').slice(1).map(Number).reduce((acc, part) => acc * 1000 + part, 0);
    expect([...abschnitte].sort((a, b) => numerisch(a) - numerisch(b))).toEqual(erwartet);
    expect(abschnitte).toHaveLength(68);
    expect(new Set(abschnitte).size).toBe(68);

    // Und der Umfang führt `E` genau einmal, ohne Rest aus der abschnittsweisen Zeit.
    expect(COVERAGE_MANIFEST.scope.filter((chapter) => chapter.startsWith('E'))).toEqual(['E']);
    expect(releaseBlockers().uncoveredScope).toEqual([]);
  });

  it('trägt für 1.14 die Geometrieregression statt eines Körper-Fingerprints', () => {
    // Sein Kennwertartefakt führt shapes: [] — matchFingerprint bricht ab, bevor es den Körper
    // ansieht. Eine Zeile mit `body-fingerprint` behauptete dort ein Gate, das nicht läuft.
    // 1.14 ist seit dem Teilslice E.2 der **einzige** solche Fall: als einzige Datei des
    // Kapitels neben 1.13 führt sie überhaupt keine Ebene `Flächige_Fülung`, es gibt also keine
    // Körperfläche zu erfassen. Das behebt kein Extraktorausbau.
    const bySection = (section: string) =>
      COVERAGE_MANIFEST.entries.find((entry) => entry.sourceId === `bbk-babz-2025:${section}`);
    expect(bySection('1.14')?.testEvidence).toEqual(['body-geometry-regression', 'svg-snapshot']);

    // Die vier Kurvenkörper 1.3, 1.4, 1.5 und 1.9 sind seit dem Extraktorausbau gegatet: ihre
    // Füllebene liefert `kind: 'bounds'`, matchFingerprint läuft und besteht. 1.13 war es schon
    // vorher — sein Artefakt führt die Strichhülle, verglichen mit `bodyGeometry:
    // 'stroke-outline'`.
    for (const section of ['1.3', '1.4', '1.5', '1.9', '1.13']) {
      expect(bySection(section)?.testEvidence, section).toEqual(['body-fingerprint', 'svg-snapshot']);
    }
  });

  /**
   * Die fünf Zeichen, deren **Umsetzung** von der Referenzdatei abweicht und die deshalb ein
   * technisches Review mit `status: 'deviation'` tragen: aus E-b E.1.17 (mittiges Kürzel der
   * Referenz 2,0009 mm links der Körpermitte) sowie E.1.19 und E.1.24 (drei Marken im Körper, die
   * der Katalog nicht abbildet), aus E-c E.1.31 (zwei senkrechte Balken an der Stelle der
   * Kopfzone, für die es keinen StrengthId gibt), aus E-e E.2.26 (Anker des THW-Laufs 1,0 mm
   * weiter rechts als in der Referenz). Die 28 Füllflächen-, Grundlinien- und Kürzelbefunde der
   * sechs Teilslices sind hier **nicht** aufgeführt: dort weicht die Quelle von sich selbst ab
   * und die Umsetzung folgt der Mehrheit der Quelle, ihr Review bleibt `approved` mit
   * Befundvermerk.
   *
   * **Dass 30 neue Zeilen nur eine einzige Abweichung hinzufügen, ist das Ergebnis der ersten
   * Bauphase dieses Slice** und keine Nachlässigkeit der zweiten: E.2.15 wäre ohne den L-Rahmen
   * als Zusatzprimitiv der zweite Fall nach dem Muster von E.1.19/E.1.24 gewesen.
   */
  // In der Reihenfolge des Manifests und nicht alphabetisch: die Rezeptzeilen entstehen aus
  // `RECIPES`, und dort steht Anhang F vor Anhang E. Der Test unten vergleicht die Liste als
  // Folge, damit eine still verschobene Zeile auffällt.
  const TECHNICAL_DEVIATIONS = [
    'bbk-babz-2025:F.1.1',
    'bbk-babz-2025:F.1.2',
    'bbk-babz-2025:F.1.3',
    'bbk-babz-2025:F.1.13',
    'bbk-babz-2025:F.1.21',
    'bbk-babz-2025:E.1.17',
    'bbk-babz-2025:E.1.19',
    'bbk-babz-2025:E.1.24',
    'bbk-babz-2025:E.1.31',
    'bbk-babz-2025:E.2.26',
  ];

  it('trägt für jeden Eintrag eine Referenzdatei und beide Reviewrollen', () => {
    // Die Zusage ist „kein Eintrag ohne zurechenbares technisches Review", nicht „jeder Eintrag
    // approved". Sie wird deshalb nicht auf eine Statusmenge aufgeweicht, sondern nennt die zehn
    // Abweichungen einzeln: jede andere Zeile muss `approved` sein, und die zehn genannten
    // müssen zusätzlich eine Notiz führen. Eine elfte `deviation` fällt hier auf, eine
    // weggefallenes ebenso.
    for (const entry of COVERAGE_MANIFEST.entries) {
      expect(entry.referenceAsset).toMatch(/\.svg$/);
      if (TECHNICAL_DEVIATIONS.includes(entry.sourceId)) {
        expect(entry.review.technical.status).toBe('deviation');
        expect(entry.review.technical.note?.trim()).not.toBe('');
        expect(entry.review.technical.note).toBeDefined();
      } else {
        expect(entry.review.technical.status).toBe('approved');
      }
      expect(entry.review.technical.reviewer).toBe('rv');
      expect(entry.review.domain.status).toBe('pending');
    }
  });

  it('führt genau zehn technische Abweichungen: fünf aus F, drei aus E-b und je eine aus E-c/E-e', () => {
    // Gegenrichtung des Tests oben: dort wird für bekannte Schlüssel `deviation` verlangt, hier,
    // dass es keine weiteren gibt. Ohne diese Hälfte bliebe eine still hinzugekommene Abweichung
    // an einer anderen Zeile unbemerkt, weil der `else`-Zweig sie nie zu sehen bekäme.
    //
    // F-a führt F.1.1 (Kopfbalken) und F.1.2 (Symmetrieabweichung). F-b ergänzt F.1.3, F.1.13
    // und F.1.21: jeweils unbegriffene Kopfbalken; die zentralen Innenformen von F.1.13/F.1.21
    // sind dagegen als rein geometrische TechnicalBodyMarkIds gebaut.
    const deviations = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.review.technical.status === 'deviation')
      .map((entry) => entry.sourceId);
    expect(deviations).toEqual(TECHNICAL_DEVIATIONS);
  });

  it('trägt für alle 14 F-b-Darstellungen das eigene Review vom 25. August', () => {
    const rows = COVERAGE_MANIFEST.entries.filter((entry) =>
      entry.sourceId === 'bbk-babz-2025:F.1.3' ||
      /^bbk-babz-2025:F\.1\.(1[2-9]|2[0-2])$/.test(entry.sourceId),
    );
    expect(rows).toHaveLength(14);
    for (const row of rows) {
      expect(row.review.technical.date).toBe('2026-08-25');
      expect(row.review.technical.note).toContain('finale Task-6-Kontaktbogen');
    }
  });

  it('meldet keine fehlenden, doppelten oder primary-verletzenden Einträge', () => {
    const { missing, duplicates, invalidPrimary, violations } = checkCoverage();
    expect({ missing, duplicates, invalidPrimary, violations }).toEqual({
      missing: [],
      duplicates: [],
      invalidPrimary: [],
      violations: [],
    });
  });

  it('hat keine Abweichungen, Evidenzlücken oder Scope-Lücken', () => {
    const blockers = releaseBlockers();
    expect(blockers.domainReviewDeviations).toEqual([]);
    expect(blockers.sourceDomainReviewDeviations).toEqual([]);
    expect(blockers.profileDomainReviewDeviations).toEqual([]);
    expect(blockers.withoutTestEvidence).toEqual([]);
    expect(blockers.uncoveredScope).toEqual([]);
  });

  it('nennt die BABZ-Empfehlungen als Baseline', () => {
    // `CoverageManifest.baseline` ist auf `SourceId` getippt, damit nur eine registrierte Quelle
    // dort stehen kann — welche, sagt der Typ nicht. `checkBaselinePrefix` prüft die Einträge
    // gegen genau diesen Wert und wäre allein selbstbezüglich: Baseline und Präfixe gemeinsam
    // umgestellt bliebe das Gate grün. Dieser Test hält den Wert fest.
    expect(COVERAGE_MANIFEST.baseline).toBe('bbk-babz-2025');
  });

  it('beansprucht nur den Umfang dieses Slice', () => {
    expect(COVERAGE_MANIFEST.scope).toEqual([
      '1',
      '2',
      '4',
      // `5.1.1` und nicht `5.1`: von Kapitel 5.1 sind allein die Fahrzeugkategorien aus 5.1.1
      // umgesetzt, und auch dort nicht alle — 5.1.1.4 (Amphibienfahrzeug), 5.1.1.7 bis 5.1.1.9
      // fehlen. `5.1` bestünde `uncoveredScope` trotzdem, weil jede 5.1.1.x-Zeile mit `5.1.`
      // beginnt.
      '5.1.1',
      '5.4',
      '5.8',
      'C.1.1',
      'C.1.2',
      'D.3.7',
      // Anhang E seit dem 18. August 2026 als **ein** `E` statt `E.1` plus 30 E.2-Einzelzeilen.
      // Die Zusammenziehung hängt nicht daran, dass sie kürzer ist, sondern daran, dass sie
      // widerlegbar wurde: `uncoveredScope` prüft an einem Präfix nur, ob **eine** Zeile mit ihm
      // beginnt, und `E` bestünde deshalb schon mit einer einzigen E.1-Zeile. Getragen wird die
      // Aussage vom Test „führt Anhang E lückenlos" weiter oben, der die 68 Abschnitte aus den
      // Manifesteinträgen ableitet. Bis E.2.6 fehlte, ließ sich dieser Test nicht schreiben.
      'E',
      'J.1',
      'J.2',
      'J.3',
      'J.4',
      'K',
      'L',
      'M',
    ]);
  });

  it('führt F.1 vollständig, ohne Anhang F vorzeitig zu beanspruchen', () => {
    const sections = COVERAGE_MANIFEST.entries
      .filter((entry) => entry.sourceId.startsWith('bbk-babz-2025:F.1.'))
      .map((entry) => entry.sourceId.slice('bbk-babz-2025:'.length).replace(/#.*$/, ''));
    expect(new Set(sections)).toEqual(new Set(Array.from({ length: 22 }, (_, index) => `F.1.${index + 1}`)));
    expect(COVERAGE_MANIFEST.scope).not.toContain('F');
  });

  it('meldet Katalogeinträge ohne genau eine primary-Darstellung', () => {
    const none = fixtureEntry('test.none', 0);
    const two = fixtureEntry('test.two', 2);
    const one = fixtureEntry('test.one', 1);

    expect(findPrimaryViolations([none, two, one])).toEqual(['test.none', 'test.two']);
  });
});

describe('Manifest-Einträge für Piktogramme', () => {
  it('bindet jede Piktogrammdefinition an genau eine Manifestzeile', () => {
    const definitionKeys = new Set(ALL_PICTOGRAMS.map(pictogramVariantKey));
    const rows = COVERAGE_MANIFEST.entries
      .filter((entry) => definitionKeys.has(entryKey(entry.implementation, entry.variant)))
      .map((entry) => entryKey(entry.implementation, entry.variant))
      .sort();
    expect(rows).toHaveLength(254);
    expect(rows).toEqual([...definitionKeys].sort());
  });

  it('leitet Abschnitt, Titel und Referenzdatei jeder Piktogrammzeile aus ihrer Definition ab', () => {
    for (const definition of ALL_PICTOGRAMS) {
      const entry = COVERAGE_MANIFEST.entries.find(
        (candidate) =>
          entryKey(candidate.implementation, candidate.variant) === pictogramVariantKey(definition),
      );
      expect(entry).toMatchObject({
        sourceId: `bbk-babz-2025:${definition.section}`,
        variant: definition.variant,
        title: definition.title,
        referenceAsset: definition.referenceAsset,
      });
    }
  });

  function entryFor(section: string) {
    return COVERAGE_MANIFEST.entries.find((entry) => entry.sourceId === `bbk-babz-2025:${section}`);
  }

  it('führt das vollständige Kapitel 4 im beanspruchten Umfang und 4.3.2 als Eintrag', () => {
    // Der Scope wächst nie vorauseilend: ein Kapitel im Scope ohne Eintrag ist ein
    // Release-Blocker, und die Erweiterung vor dem Inhalt erzeugt genau die Falschaussage,
    // die das Manifest verhindern soll.
    expect(COVERAGE_MANIFEST.scope).toContain('4');
    expect(entryFor('4.3.2')).toBeDefined();
  });

  it('gibt Piktogrammen Snapshot- und Vertragsnachweis statt eines Körper-Fingerprints', () => {
    for (const section of ['4.3.1', '4.3.2']) {
      const entry = entryFor(section);
      expect(entry?.coverage).toBe('element');
      // matchFingerprint vergleicht ausschließlich role: 'body' — für ein Piktogramm ist das
      // strukturell unerreichbar und kein Versäumnis.
      expect(entry?.testEvidence).toEqual(['svg-snapshot', 'pictogram-contract']);
    }
  });

  it('weist Organisationen und Stärken mit ihrer arteigenen Evidenz nach', () => {
    expect(entryFor('2.1')?.testEvidence).toEqual(['reference-fill']);
    expect(entryFor('5.4.1')?.testEvidence).toEqual(['head-shape-regression']);
  });

  it('begründet den technical-Status der Piktogramme an den vier Gates', () => {
    const entry = entryFor('4.3.2');
    expect(entry?.review.technical.status).toBe('approved');
    expect(entry?.review.technical.note).toContain('Box');
    expect(entry?.review.technical.note).toContain('Clipping');
    expect(entry?.review.technical.note).toContain('Mehrgrößen');
    expect(entry?.review.technical.note).toContain('viewBox');
    expect(entry?.review.domain.status).toBe('pending');
  });

  it('trennt den freigegebenen D.1-Review identisch vom freigegebenen State-Technikreview', () => {
    const capabilityRows = COVERAGE_MANIFEST.entries.filter((entry) =>
      entry.implementation.startsWith('capability.'),
    );
    const stateRows = COVERAGE_MANIFEST.entries.filter((entry) =>
      entry.implementation.startsWith('state.'),
    );
    const capabilityReview = capabilityRows[0]!.review.technical;
    const stateReview = stateRows[0]!.review.technical;

    expect(capabilityRows).toHaveLength(92);
    expect(stateRows).toHaveLength(67);
    expect(capabilityRows.every((entry) => entry.review.technical === capabilityReview)).toBe(true);
    expect(capabilityReview).toMatchObject({
      status: 'approved',
      date: '2026-08-06',
    });
    expect(stateRows.every((entry) => entry.review.technical === stateReview)).toBe(true);
    expect(stateReview).toEqual({
      status: 'approved',
      reviewer: 'rv',
      date: '2026-08-07',
      note:
        'Fingerprint-Gate für Piktogramme nicht anwendbar. Für Kapitel 5.8 bestehen Snapshot, ' +
        'Kommando, Box und Standalone-Clipping gegen die 32×32-mm-ViewBox sowie die globalen ' +
        'Mehrgrößen-, viewBox-, Metadaten- und expliziten Kontrast-Gates; die 67/67-Sichtprüfung ' +
        'ist in docs/reviews/2026-08-07-d2-visual-qa.md dokumentiert.',
    });
    expect(stateReview).not.toBe(capabilityReview);
  });
});
