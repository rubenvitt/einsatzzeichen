import {
  ADMIN_LEVEL_LABELS,
  ALL_PICTOGRAMS,
  BASE_SYMBOLS,
  BODY_MARK_IDS,
  CONTRAST_EXCEPTIONS,
  COVERAGE_MANIFEST,
  ORGANIZATION_LABELS,
  RECIPES,
  SOURCE_REGISTRY,
  STRENGTH_LABELS,
  TECHNICAL_BODY_MARK_LABELS,
  TECHNICAL_HEAD_MARK_LABELS,
  VEHICLE_CATEGORY_LABELS,
  composeFromCatalog,
  functionRole,
  generativeReach,
  pictogram,
  referenceInventory,
  releaseBlockers,
  ruleCoverage,
  sortedDomainReviewOpenByArea,
  symbolKindLabel,
  validationRuleCoverage,
  type Recipe,
} from '@einsatzzeichen/catalog';
import { VALIDATION_RULE_IDS } from '@einsatzzeichen/core';
import {
  ADMIN_LEVEL_IDS,
  BODY_VARIANT_IDS,
  FUNCTION_ROLE_IDS,
  ORGANIZATION_IDS,
  PALETTE,
  STRENGTH_IDS,
  SYMBOL_KINDS,
  TECHNICAL_BODY_MARK_IDS,
  TECHNICAL_HEAD_MARK_IDS,
  VEHICLE_CATEGORY_IDS,
  entryKey,
  type CatalogEntry,
  type ColorToken,
  type CoverageEntry,
  type Depiction,
  type Review,
  type ReviewSet,
} from '@einsatzzeichen/schema';
import { slugForSymbolId } from './slug.js';
import type {
  BuilderVocabulary,
  CatalogSnapshot,
  CoverageAxis,
  CoverageSummary,
  MatrixRow,
  ReviewSummary,
  SourceSummary,
  SymbolSummary,
} from './snapshot.js';

/** Abschnittsnummer eines Manifestschlüssels: `bbk-babz-2025:E.1.1` → `E.1.1`. */
function sectionOf(sourceId: string): string {
  const separator = sourceId.indexOf(':');
  return separator === -1 ? sourceId : sourceId.slice(separator + 1);
}

/** Registrierte Quelle eines Manifestschlüssels: `bbk-babz-2025:E.1.1` → `bbk-babz-2025`. */
function registryIdOf(sourceId: string): string {
  const separator = sourceId.indexOf(':');
  return separator === -1 ? sourceId : sourceId.slice(0, separator);
}

/**
 * Lesbare Kapitelbezeichnung einer Abschnittsnummer. Die letzte Stelle fällt weg — sie bezeichnet
 * das einzelne Zeichen, nicht sein Kapitel: `4.6.4` → „Kapitel 4.6", `E.1.1` → „Anhang E.1",
 * `C.2.14` → „Anhang C.2", `1.1` → „Kapitel 1".
 *
 * Kein Rückfall auf einen Platzhalter: eine Abschnittsnummer, die weder mit einer Ziffer noch mit
 * einem Buchstaben beginnt, ist ein Datenfehler und bricht die Erzeugung ab (Spec §7).
 */
export function chapterForSection(section: string): string {
  const segments = section.split('.');
  const chapter = segments.length === 1 ? section : segments.slice(0, -1).join('.');
  if (/^[0-9]/.test(chapter)) return `Kapitel ${chapter}`;
  if (/^[A-Za-z]/.test(chapter)) return `Anhang ${chapter}`;
  throw new Error(
    `Aus der Abschnittsnummer "${section}" lässt sich keine Kapitelbezeichnung ableiten.`,
  );
}

/**
 * Referenzdateinamen in Prosa. Mehrere technische Reviewnotizen des Manifests zitieren die Datei,
 * gegen die sie geprüft haben — `4.1.3_Dekontaminieren.svg`, `F.1.1_Medizinische Task Force.svg`.
 * Der Name der Referenzdatei ist genau das, was die Website nicht ausliefern darf (Spec §5.3), und
 * die fachliche Aussage der Notiz hängt nicht an ihm.
 */
const REFERENCE_FILENAME = /[A-Za-z0-9.]+_[^`"„“]*?\.svg/g;

/**
 * Ersetzt Referenzdateinamen durch eine sichtbare Marke statt sie stillschweigend zu entfernen.
 * Bleibt danach ein `.svg` stehen, bricht die Erzeugung ab: ein unerkanntes Muster soll auffallen
 * und nicht durchrutschen (Spec §7).
 */
export function withoutReferenceFilenames(text: string): string {
  const redacted = text.replace(REFERENCE_FILENAME, '[Referenzdatei]');
  if (redacted.includes('.svg')) {
    throw new Error(
      `Ein Referenzdateiname bleibt nach der Schwärzung stehen: "${redacted}". Das Muster in ` +
        '`REFERENCE_FILENAME` erfasst ihn nicht.',
    );
  }
  return redacted;
}

/** `Review` → `ReviewSummary`, Feld für Feld statt per Spread: der Snapshot trägt nur diese vier. */
function reviewSummary(review: Review): ReviewSummary {
  return {
    status: review.status,
    ...(review.reviewer !== undefined ? { reviewer: review.reviewer } : {}),
    ...(review.date !== undefined ? { date: review.date } : {}),
    ...(review.note !== undefined ? { note: withoutReferenceFilenames(review.note) } : {}),
  };
}

function reviewSetSummary(review: ReviewSet): { technical: ReviewSummary; domain: ReviewSummary } {
  return { technical: reviewSummary(review.technical), domain: reviewSummary(review.domain) };
}

/**
 * Zitierform der Quelle. `SourceRecord` führt sie nicht als Feld; sie entsteht aus Herausgeber,
 * Titel und — wo vorhanden — Auflage. Bewusst ohne `scope`: dessen Prosa nennt bei der Baseline
 * das lokale Referenzverzeichnis.
 */
function citationOf(id: string): string {
  const record = SOURCE_REGISTRY[id as keyof typeof SOURCE_REGISTRY];
  if (record === undefined) throw new Error(`Quelle "${id}" ist nicht registriert.`);
  return record.edition === undefined
    ? `${record.publisher}: ${record.title}`
    : `${record.publisher}: ${record.title} (${record.edition})`;
}

function sourceSummaries(): SourceSummary[] {
  return Object.values(SOURCE_REGISTRY).map((record) => ({
    id: record.id,
    title: record.title,
    citation: citationOf(record.id),
    ...(record.url !== undefined ? { url: record.url } : {}),
    // Lizenzstand, nicht Reviewstand: `review` steht daneben im selben Objekt.
    status: record.licence.status,
    review: reviewSetSummary(record.review),
  }));
}

/**
 * Farbnamen, wie sie auf der Website stehen dürfen. Die Tokens des Schemas sind Bezeichner
 * (`weiss`, `gruen`, `funktionslauf-kontrast`) — auf einer Seite, die auch Menschen ohne
 * Technikbezug lesen, hat ein Bezeichner nichts verloren.
 *
 * Der Typ nennt jeden Token einzeln, statt `Record<string, string>` zu sein: ein neuer Farbton im
 * Schema ist damit ein Übersetzungsfehler beim Bauen und nicht ein `undefined` mitten im Satz.
 * `surface` ist kein Farbtoken, sondern die Fläche, auf der ausgegeben wird — `background` lässt
 * beides zu.
 */
const COLOR_WORDS: Record<ColorToken | 'surface', string> = {
  schwarz: 'Schwarz',
  weiss: 'Weiß',
  rot: 'Rot',
  blau: 'Blau',
  gelb: 'Gelb',
  gruen: 'Grün',
  hellgruen: 'Hellgrün',
  orange: 'Orange',
  braun: 'Braun',
  grau: 'Grau',
  hellgrau: 'Hellgrau',
  hellblau: 'Hellblau',
  'funktionslauf-kontrast': 'Kontrastfarbe des Funktionslaufs',
  // Nur als Hintergrund möglich (`ContrastException.background`); daher der Dativ.
  surface: 'der Ausgabefläche',
};

/**
 * ISO-Datum als deutsches Datum. Bewusst eine eigene Zeile statt eines Imports aus
 * `components/StatusPair.tsx`: jene Datei ist eine React-Komponente und wird auch im Browser
 * gebündelt, dieser Baustein läuft nur in Node beim Erzeugen der Daten. Ein Datum, das nicht
 * ISO-förmig ist, bleibt unverändert stehen, statt zu `NaN.NaN.NaN` zu werden.
 */
function germanDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return match === null ? iso : `${match[3]}.${match[2]}.${match[1]}`;
}

/** „E.2.6" → „Abschnitt E.2.6"; mehrere → „Abschnitte E.2.6 und E.2.7". */
function sectionPhrase(sections: readonly string[]): string {
  if (sections.length === 0) return 'ohne Abschnittsangabe';
  if (sections.length === 1) return `Abschnitt ${sections[0]}`;
  const head = sections.slice(0, -1).join(', ');
  return `Abschnitte ${head} und ${sections[sections.length - 1]}`;
}

/**
 * Klartext einer Kontrastausnahme — ein Satzteil, der ohne Nacharbeit in eine Liste und hinter
 * einen Doppelpunkt passt: „Weiß auf Orange, Abschnitt E.2.6 (entschieden am 18.08.2026,
 * Projektinhaber)".
 *
 * Nicht der Wortlaut der Coverage-Ausgabe: die druckt Tokens und ISO-Daten für ein Terminal.
 * Die Zahlen und die Entscheidung sind dieselben, nur die Schreibweise ist die der Website. Wer
 * die Person hinter `decidedBy` in den Satz zieht, tut das in Klammern und ohne Präposition —
 * „durch Projektinhaber" wäre kein deutscher Satz, und der Wert ist frei belegbar.
 */
function contrastExceptionText(exception: (typeof CONTRAST_EXCEPTIONS)[number]): string {
  const foreground = COLOR_WORDS[exception.foreground];
  const background = COLOR_WORDS[exception.background];
  return (
    `${foreground} auf ${background}, ${sectionPhrase(exception.sections)} ` +
    `(entschieden am ${germanDate(exception.decidedOn)}, ${exception.decidedBy})`
  );
}

function contrastExceptionForSection(section: string): string | undefined {
  const exception = CONTRAST_EXCEPTIONS.find((candidate) => candidate.sections.includes(section));
  return exception === undefined ? undefined : contrastExceptionText(exception);
}

/**
 * Die drei Achsen aus §7 der Slice-1-Spezifikation — dieselben Funktionen und derselbe Wortlaut
 * wie in `packages/cli/src/commands/coverage.ts`. Die Website hängt nicht von `packages/cli` ab;
 * die Zahlen kommen deshalb aus dem Katalog, der Satzbau ist eine bewusste Dopplung der dortigen
 * Vorlage und keine zweite Rechnung.
 *
 * Ausdrücklich nicht übernommen: `inventory.unaccounted`, das die CLI als eigene Zeile druckt —
 * die Liste nennt Referenzdateinamen, und die haben im Snapshot nichts zu suchen (Spec §5.3);
 * die Zahl bleibt. `generativeReach().durationMs` bleibt ebenfalls draußen: eine Messzeit machte
 * den Snapshot bei jedem Lauf verschieden. `axis.missing` steht dagegen drin — das sind
 * Taxonomiewerte, keine Dateien.
 */
function coverageAxes(): CoverageAxis[] {
  const inventory = referenceInventory();
  const excluded = inventory.excludedByDisposition;
  const axes = ruleCoverage();
  const complete = axes.filter((axis) => axis.missing.length === 0);
  const gaps = axes.filter((axis) => axis.missing.length > 0);
  const rules = validationRuleCoverage();
  const reach = generativeReach();

  return [
    {
      label: 'Referenzabdeckung',
      value: inventory.claimed,
      of: inventory.total,
      detail:
        `${inventory.total - inventory.claimed} nicht — ${inventory.outOfScope} außerhalb des ` +
        `Umfangs, ${excluded.example} Beispielanwendungen, ${excluded['overview-sheet']} ` +
        `Übersichtsblatt, ${excluded.deferred} zurückgestellt, ${inventory.unaccounted.length} ` +
        'nicht zugeordnet',
    },
    {
      label: 'Regelabdeckung',
      value: complete.length,
      of: axes.length,
      detail:
        `${rules.total} Validierungsregeln (Testfall je Regel durch core-Test erzwungen)` +
        (gaps.length === 0
          ? ''
          : `; Achsen mit Lücke: ${gaps
              .map(
                (axis) =>
                  `${axis.id} ${axis.exercised.length}/${axis.values.length} ` +
                  `(${axis.missing.join(', ')})`,
              )
              .join('; ')}`),
    },
    {
      label: 'Generative Reichweite',
      value: reach.valid,
      of: reach.enumerated,
      detail:
        `${reach.valid} gültige Kompositionen aus kind × Körpervariante × Organisation × ` +
        `Kopfzone × Fahrwerk (${reach.enumerated} enumeriert), davon ${reach.referenced} in der ` +
        `Referenz belegt — ${reach.reachOnly} erzeugbar ohne Referenzbeleg, ` +
        `${reach.referencedOutsideReach.length} Rezeptsignaturen außerhalb der Stufe ` +
        '(dokumentiert, kein Gate); nicht enumeriert: ' +
        reach.notEnumerated
          .map((axis) =>
            axis.id === 'capabilities'
              ? `${axis.size} Fähigkeiten`
              : axis.id === 'bodyMarks'
                ? `${axis.size} Körpermarken`
                : axis.id === 'functionRole'
                  ? `${axis.size} Funktionsrollen`
                  : 'freie Bezeichnung',
          )
          .join(', '),
    },
  ];
}

/**
 * Die offenen Punkte aus `releaseBlockers()`, je Schlüssel eine Zeile. Nicht darin: die
 * Gate-Verstöße aus `checkCoverage().violations` — die sind Fehler des Katalogs und nicht offene
 * Punkte der Freigabe; ihre Detailtexte nennen zudem Referenzdateien.
 */
function blockerRows(): CoverageSummary['blockers'] {
  const blockers = releaseBlockers();
  const groups: Array<[kind: string, keys: readonly string[], detail: string]> = [
    ['manifest-review-offen', blockers.domainReviewOpen, 'Fachliches Review der Manifestzeile offen'],
    ['manifest-abweichung', blockers.domainReviewDeviations, 'Fachliches Review mit Abweichung'],
    ['quellen-review-offen', blockers.sourceDomainReviewOpen, 'Fachliches Review der Quelle offen'],
    ['quellen-abweichung', blockers.sourceDomainReviewDeviations, 'Fachliches Quellenreview mit Abweichung'],
    ['profil-review-offen', blockers.profileDomainReviewOpen, 'Fachliches Review des Profils offen'],
    ['profil-abweichung', blockers.profileDomainReviewDeviations, 'Fachliches Profilreview mit Abweichung'],
    ['ohne-testnachweis', blockers.withoutTestEvidence, 'Pflichtnachweisart fehlt'],
    ['umfang-ohne-eintrag', blockers.uncoveredScope, 'Kapitel im beanspruchten Umfang ohne Eintrag'],
  ];
  return groups.flatMap(([kind, keys, detail]) => keys.map((key) => ({ kind, key, detail })));
}

/** Bereich einer Abschnittsnummer: der Teil vor dem ersten Punkt — wie `blockersOf` ihn bildet. */
function areaOf(section: string): string {
  const dot = section.indexOf('.');
  return dot === -1 ? section : section.slice(0, dot);
}

function openDomainReviewsByArea(): CoverageSummary['openDomainReviewsByArea'] {
  const blockers = releaseBlockers();
  return sortedDomainReviewOpenByArea(blockers.domainReviewOpenByArea).map(([area, count]) => ({
    area,
    count,
    keys: blockers.domainReviewOpen.filter((key) => areaOf(sectionOf(key)) === area),
  }));
}

function labelled(ids: readonly string[], label: (id: string) => string): { id: string; label: string }[] {
  return ids.map((id) => ({ id, label: label(id) }));
}

/** Piktogramm-IDs eines Namensraums mit ihrem deutschen Titel, aus dem Register statt aus einer Liste. */
function pictogramVocabulary(namespace: string): { id: string; label: string }[] {
  return ALL_PICTOGRAMS.filter(
    (definition) => definition.variant === 'primary' && definition.id.startsWith(`${namespace}.`),
  ).map((definition) => ({
    id: definition.id.slice(namespace.length + 1),
    label: definition.title,
  }));
}

const TECHNICAL_BODY_MARK_ID_SET = new Set<string>(TECHNICAL_BODY_MARK_IDS);

/**
 * Erlaubte Werte je `SymbolSpec`-Achse. Die Bezeichnungen kommen aus denselben Registern, die
 * `describeSymbolSpec` vorliest — eine zweite Liste in der Website liefe auseinander.
 *
 * `technicalFill` und `bodyVariant` tragen ihre ID als Bezeichnung: die Farbtoken sind bereits
 * deutsche Wörter, und für die Körpervarianten führt der Katalog kein Bezeichnungsregister. Eines
 * hier zu erfinden hieße, Bezeichnungen ohne Quelle zu behaupten.
 */
function builderVocabulary(): BuilderVocabulary {
  return {
    kind: labelled(SYMBOL_KINDS, (id) => symbolKindLabel(id as (typeof SYMBOL_KINDS)[number])),
    organization: labelled(
      ORGANIZATION_IDS,
      (id) => ORGANIZATION_LABELS[id as (typeof ORGANIZATION_IDS)[number]],
    ),
    technicalFill: labelled(Object.keys(PALETTE), (id) => id),
    strength: labelled(STRENGTH_IDS, (id) => STRENGTH_LABELS[id as (typeof STRENGTH_IDS)[number]]),
    administrativeLevel: labelled(
      ADMIN_LEVEL_IDS,
      (id) => ADMIN_LEVEL_LABELS[id as (typeof ADMIN_LEVEL_IDS)[number]],
    ),
    functionRole: labelled(
      FUNCTION_ROLE_IDS,
      (id) => functionRole(id as (typeof FUNCTION_ROLE_IDS)[number]).title,
    ),
    capabilities: pictogramVocabulary('capability'),
    bodyMarks: labelled(BODY_MARK_IDS, (id) =>
      TECHNICAL_BODY_MARK_ID_SET.has(id)
        ? TECHNICAL_BODY_MARK_LABELS[id as keyof typeof TECHNICAL_BODY_MARK_LABELS]
        : pictogram(`capability.${id}` as Parameters<typeof pictogram>[0]).title,
    ),
    states: pictogramVocabulary('state'),
    comms: pictogramVocabulary('comms'),
    damage: pictogramVocabulary('damage'),
    wildfire: pictogramVocabulary('wildfire'),
    vehicleCategory: labelled(
      VEHICLE_CATEGORY_IDS,
      (id) => VEHICLE_CATEGORY_LABELS[id as (typeof VEHICLE_CATEGORY_IDS)[number]],
    ),
    bodyVariant: labelled(BODY_VARIANT_IDS, (id) => id),
    technicalHeadMark: labelled(
      TECHNICAL_HEAD_MARK_IDS,
      (id) => TECHNICAL_HEAD_MARK_LABELS[id as (typeof TECHNICAL_HEAD_MARK_IDS)[number]],
    ),
  };
}

const CATALOG_ENTRIES_BY_ID = new Map<string, CatalogEntry>(
  Object.values(BASE_SYMBOLS).map((entry) => [entry.id, entry]),
);

/**
 * Die semantische ID einer Katalogeintrag-Darstellung. Für die `primary`-Darstellung ist das die
 * ID des Eintrags selbst (Spec §5.3); eine zweite Darstellung hängt ihre Variante an, damit sie
 * einen eigenen Slug bekommt statt die erste zu überschreiben.
 */
function depictionId(entry: CatalogEntry, depiction: Depiction): string {
  return depiction.variant === 'primary' ? entry.id : `${entry.id}#${depiction.variant}`;
}

function symbolForCatalogEntry(row: CoverageEntry): SymbolSummary {
  const entry = CATALOG_ENTRIES_BY_ID.get(row.implementation);
  if (entry === undefined) {
    throw new Error(
      `Manifestzeile "${entryKey(row.sourceId, row.variant)}" nennt den Katalogeintrag ` +
        `"${row.implementation}", den der Katalog nicht führt.`,
    );
  }
  const depiction = entry.depictions.find((candidate) => candidate.variant === row.variant);
  if (depiction === undefined) {
    throw new Error(
      `Katalogeintrag "${entry.id}" hat keine Darstellung "${row.variant}", die die ` +
        'Manifestzeile beansprucht.',
    );
  }
  const reference = depiction.sourceRefs[0];
  const section = sectionOf(row.sourceId);
  const contrastException = contrastExceptionForSection(section);
  const id = depictionId(entry, depiction);
  // Die gemessene Zeichnung der Darstellung, nicht `composeFromCatalog`: beide liefern dieselbe
  // Geometrie (geprüft), aber nur diese trägt die BABZ-Abschnittsangabe in der Beschreibung.
  // `spec` ist die Fassung, mit der der Builder dasselbe Zeichen wieder herstellt — ein
  // Grundzeichen ist genau seine Art.
  return {
    id,
    slug: slugForSymbolId(id),
    title: entry.title,
    kind: 'catalog-entry',
    spec: { kind: entry.kind },
    drawing: structuredClone(depiction.drawing) as SymbolSummary['drawing'],
    sourceId: row.sourceId,
    variant: row.variant,
    source: {
      id: reference?.source ?? registryIdOf(row.sourceId),
      citation: citationOf(reference?.source ?? registryIdOf(row.sourceId)),
      ...(reference?.page !== undefined ? { page: String(reference.page) } : {}),
    },
    chapter: chapterForSection(section),
    profile: row.profile,
    synonyms: [...(entry.synonyms ?? [])],
    legacyIds: [...(entry.legacyIds ?? [])],
    review: reviewSetSummary(row.review),
    evidence: [...row.testEvidence],
    ...(contrastException !== undefined ? { contrastException } : {}),
  };
}

const RECIPE_PREFIX = 'recipe.';

function symbolForRecipe(row: CoverageEntry): SymbolSummary {
  if (!row.implementation.startsWith(RECIPE_PREFIX)) {
    throw new Error(
      `Manifestzeile "${entryKey(row.sourceId, row.variant)}" trägt coverage ` +
        `"composition-recipe", aber die Implementierung "${row.implementation}" beginnt nicht ` +
        `mit "${RECIPE_PREFIX}".`,
    );
  }
  const key = row.implementation.slice(RECIPE_PREFIX.length);
  const recipe: Recipe | undefined = (RECIPES as Record<string, Recipe>)[key];
  if (recipe === undefined) {
    throw new Error(`Manifestzeile nennt das Rezept "${key}", das der Katalog nicht führt.`);
  }
  const section = sectionOf(row.sourceId);
  const contrastException = contrastExceptionForSection(section);
  const registryId = registryIdOf(row.sourceId);
  // Rezepte tragen keine `sourceRefs`; ihre Quelle ist die Baseline, aus deren Abschnittsnummer
  // der Manifestschlüssel gebildet ist. Deshalb auch keine Seitenangabe.
  return {
    id: row.implementation,
    slug: slugForSymbolId(row.implementation),
    title: recipe.title,
    kind: 'composition-recipe',
    spec: structuredClone(recipe.spec) as SymbolSummary['spec'],
    drawing: composeFromCatalog(recipe.spec, recipe.title),
    sourceId: row.sourceId,
    variant: row.variant,
    source: { id: registryId, citation: citationOf(registryId) },
    chapter: chapterForSection(section),
    profile: row.profile,
    synonyms: [],
    legacyIds: [],
    review: reviewSetSummary(row.review),
    evidence: [...row.testEvidence],
    ...(contrastException !== undefined ? { contrastException } : {}),
  };
}

/**
 * Der Snapshot. Rein: gleiche Eingabe, gleiche Ausgabe — die einzige Zeitangabe ist `now`.
 *
 * Ausgangspunkt ist das Coverage-Manifest und nicht der Katalog: es ist die Liste, gegen die das
 * Gate prüft. Ein Katalogeintrag ohne Manifestzeile bliebe damit unsichtbar — genau deshalb prüft
 * `snapshot-build.test.ts` die Gegenrichtung gegen `BASE_SYMBOLS` und `RECIPES`.
 */
export function buildSnapshot(now: Date = new Date()): CatalogSnapshot {
  const symbols: SymbolSummary[] = [];
  const matrix: MatrixRow[] = [];
  const slugs = new Map<string, string>();

  for (const row of COVERAGE_MANIFEST.entries) {
    const key = entryKey(row.sourceId, row.variant);
    let symbol: SymbolSummary | undefined;
    if (row.coverage === 'catalog-entry') symbol = symbolForCatalogEntry(row);
    else if (row.coverage === 'composition-recipe') symbol = symbolForRecipe(row);

    if (symbol !== undefined) {
      const taken = slugs.get(symbol.slug);
      if (taken !== undefined) {
        throw new Error(
          `Doppelter Slug "${symbol.slug}": "${taken}" und "${symbol.id}" ergeben denselben Pfad.`,
        );
      }
      slugs.set(symbol.slug, symbol.id);
      symbols.push(symbol);
    }

    matrix.push({
      key,
      sourceId: row.sourceId,
      variant: row.variant,
      title: row.title,
      implementation: row.implementation,
      ...(symbol !== undefined ? { slug: symbol.slug } : {}),
      coverage: row.coverage,
      profile: row.profile,
      technical: reviewSummary(row.review.technical),
      domain: reviewSummary(row.review.domain),
      evidence: [...row.testEvidence],
    });
  }

  return {
    generatedAt: now.toISOString(),
    baseline: COVERAGE_MANIFEST.baseline,
    coreVersion: COVERAGE_MANIFEST.coreVersion,
    symbols,
    sources: sourceSummaries(),
    coverage: {
      baseline: COVERAGE_MANIFEST.baseline,
      coreVersion: COVERAGE_MANIFEST.coreVersion,
      scope: [...COVERAGE_MANIFEST.scope],
      entries: COVERAGE_MANIFEST.entries.length,
      sources: Object.keys(SOURCE_REGISTRY).length,
      axes: coverageAxes(),
      blockers: blockerRows(),
      openDomainReviewsByArea: openDomainReviewsByArea(),
      contrastExceptions: CONTRAST_EXCEPTIONS.map(contrastExceptionText),
      matrix,
    },
    builder: builderVocabulary(),
    ruleIds: [...VALIDATION_RULE_IDS],
  };
}
