import {
  COVERAGE_MANIFEST,
  FREESTANDING_SPEC_FIXTURES,
  PROFILES,
  type FreestandingSpecFixture,
} from '@einsatzzeichen/conformance';
import { drawAnySpec, freestandingRedirect, parametricBlock } from '@einsatzzeichen/core';
import {
  entryKey,
  isFreestandingSpec,
  type CoverageEntry,
  type Drawing,
  type FreestandingSpec,
  type StateId,
} from '@einsatzzeichen/schema';
import { slugForSymbolId } from './slug.js';
import { contrastExceptionForSection } from './snapshot-contrast.js';
import { withoutReferenceFilenames } from './snapshot-redaction.js';
import { reviewSetSummary } from './snapshot-review.js';
import { chapterForSection, chapterLabel, registryIdOf, sectionOf } from './snapshot-sections.js';
import { citationOf } from './snapshot-sources.js';
import type { SymbolSummary } from './snapshot.js';

/**
 * Die freistehenden Zeichen als Zeichen des Snapshots (ESZ-146): Pfeil, Linie, Wetter,
 * Tierzustand, Zustand und Piktogramm, jedes mit eigener Seite, PNG und Slug.
 *
 * **Zuschnitt** (`docs/decisions/2026-10-21-esz-146-freistehend-im-katalog.md`). Zwei Quellen,
 * beide aus dem Prüfpaket und keine von Hand gepflegt:
 *
 * - **Elementzeilen des Manifests**, die eine `FreestandingSpec` genau zeichnet. Welche das sind,
 *   sagt `FREESTANDING_SPEC_FIXTURES` (Referenzdatei → Spec, im Prüfpaket gegen die Zeichnung
 *   gegatet); dazu die zehn Wetterwerte aus 5.8.7, deren Zustandszeile `freestandingRedirect` an
 *   die Wetter-Spec weiterreicht. Name, Abschnitt, Profil und Prüfstand kommen aus der Zeile.
 *   Die Zustände, die eine `SymbolSpec` zeichnet (Person, Gefahr), und die Leitstelle D.2.5 (ein
 *   Ort) bleiben Elementzeilen ohne Seite.
 * - **Referenzdateien ohne Manifestzeile**: Pfeile 5.2, Linien 2.14 bis 2.20 und die vier
 *   Wetterbeispiele aus 5.8.7. Das Referenzinventar führt sie als zurückgestellt (LFH-566), also
 *   gibt es weder Manifestschlüssel noch Prüfstand; beide Achsen stehen auf `pending`, und die
 *   Zeichenseite sagt in einem eigenen Satz, warum.
 *
 * Die Altzeichen aus DV 102 (`LEGACY_SPEC_FIXTURES`) gehören nicht dazu: ihre Quelle ist nicht die
 * Baseline, und sie haben eine eigene Aufgabe (ESZ-137).
 */

const FIXTURE_SPEC_BY_ASSET = new Map<string, FreestandingSpec>(
  FREESTANDING_SPEC_FIXTURES.map((fixture) => [fixture.asset, fixture.spec]),
);

/**
 * Die `FreestandingSpec`, die genau das Bild einer Manifestzeile zeichnet — oder `undefined`,
 * wenn die Zeile kein freistehendes Zeichen ist.
 */
export function freestandingSpecForRow(row: CoverageEntry): FreestandingSpec | undefined {
  if (row.coverage !== 'element') return undefined;
  const fixture = FIXTURE_SPEC_BY_ASSET.get(row.referenceAsset);
  if (fixture !== undefined) return fixture;
  // Die Wetterwerte aus 5.8.7 sind Zustandszeilen, gezeichnet von der Wetter-Spec mit einem Wert.
  // `STATE_SPEC_FIXTURES` lässt sie deshalb aus; die Weiterleitung sagt, welche Spec sie zeichnet.
  if (!row.implementation.startsWith(STATE_PREFIX)) return undefined;
  const state = row.implementation.slice(STATE_PREFIX.length) as StateId;
  const redirect = freestandingRedirect(
    row.variant === 'primary' ? { kind: 'state', state } : { kind: 'state', state, variant: row.variant },
  );
  return redirect !== undefined && isFreestandingSpec(redirect) ? redirect : undefined;
}

const STATE_PREFIX = 'state.';

/**
 * Die ID einer Elementzeile: die Implementierung der Zeile, bei der zweiten Darstellung mit
 * angehängter Variante — dieselbe Form wie bei den Katalogeinträgen (`base.x#alternative`). Die
 * Elementzeilen tragen die Variante nicht in `implementation`, anders als die Rezepte.
 */
function rowSymbolId(row: CoverageEntry): string {
  return row.variant === 'primary' ? row.implementation : `${row.implementation}#${row.variant}`;
}

/** Eine Elementzeile, die ein freistehendes Zeichen ist, als Zeichen des Snapshots. */
export function symbolForFreestandingRow(row: CoverageEntry, spec: FreestandingSpec): SymbolSummary {
  const section = sectionOf(row.sourceId);
  const registryId = registryIdOf(row.sourceId);
  const contrastException = contrastExceptionForSection(section);
  const id = rowSymbolId(row);
  return {
    id,
    slug: slugForSymbolId(id),
    title: row.title,
    kind: 'freestanding',
    spec: structuredClone(spec) as FreestandingSpec,
    drawing: drawingOf(spec, entryKey(row.sourceId, row.variant)),
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
 * Die Referenzdateien der freistehenden Zeichen, die keine Manifestzeile haben, in der Reihenfolge
 * von `FREESTANDING_SPEC_FIXTURES`.
 */
export function unlistedFreestandingFixtures(): FreestandingSpecFixture[] {
  const listed = new Set(COVERAGE_MANIFEST.entries.map((row) => row.referenceAsset));
  return FREESTANDING_SPEC_FIXTURES.filter((fixture) => !listed.has(fixture.asset));
}

/** Ein Beispiel der Vorlage („5.8.7_Beispiel_…“) steht unter seinem Abschnitt, nicht darüber. */
const EXAMPLE_MARK = '_Beispiel_';

/**
 * Ein freistehendes Zeichen ohne Manifestzeile. Der Abschnitt steht vorn im Namen der
 * Referenzdatei (`5.2.3_Gerichtete Bewegung.svg`); nur er geht in den Snapshot, der Dateiname nicht
 * (Spec §5.3).
 *
 * Name und ID kommen aus der Spec, nicht aus dem Dateinamen (`unlistedTitle`).
 */
export function symbolForUnlistedFreestanding(fixture: FreestandingSpecFixture): SymbolSummary {
  const separator = fixture.asset.indexOf('_');
  const section = separator === -1 ? '' : fixture.asset.slice(0, separator);
  if (!/^[0-9]+(\.[0-9]+)*$/.test(section)) {
    throw new Error(
      `Aus der Referenzdatei eines freistehenden Zeichens (${fixture.spec.kind}) lässt sich kein ` +
        'Abschnitt ablesen.',
    );
  }
  const registryId = COVERAGE_MANIFEST.baseline;
  const id = unlistedSymbolId(fixture.spec);
  const drawing = drawingOf(fixture.spec, id);
  const title = unlistedTitle(fixture.spec, drawing, id);
  const contrastException = contrastExceptionForSection(section);
  return {
    id,
    slug: slugForSymbolId(id),
    title,
    kind: 'freestanding',
    spec: structuredClone(fixture.spec) as FreestandingSpec,
    drawing,
    variant: 'variant' in fixture.spec && fixture.spec.variant !== undefined ? fixture.spec.variant : 'primary',
    source: { id: registryId, citation: citationOf(registryId) },
    chapter: fixture.asset.includes(EXAMPLE_MARK) ? chapterLabel(section) : chapterForSection(section),
    profile: baselineProfile(),
    synonyms: [],
    legacyIds: [],
    review: { technical: { status: 'pending' }, domain: { status: 'pending' } },
    evidence: [],
    ...(contrastException !== undefined ? { contrastException } : {}),
  };
}

/**
 * Der Name eines Zeichens ohne Manifestzeile. Pfeil und Linie heißen wie ihr Baustein — derselbe
 * Name wie in der Auswahl des Baukastens, ohne die Stärke, die 2.20 trägt, und ohne „zweite
 * Darstellung“: die Fassung steht auf der Seite an eigener Stelle, wie bei den Katalogeinträgen.
 * Ein Wetterbeispiel hat keinen Baustein; es heißt wie die Beschreibung, die `drawAnySpec`
 * vorliest, ohne die vorangestellte Art („Wetter: …“).
 */
function unlistedTitle(spec: FreestandingSpec, drawing: Drawing, id: string): string {
  const block =
    spec.kind === 'movement'
      ? parametricBlock(`arrow/${spec.movement}`)
      : spec.kind === 'line'
        ? parametricBlock(`line/${spec.line}`)
        : undefined;
  if (block !== undefined) return block.title;
  const description = drawing.description ?? '';
  const separator = description.indexOf(': ');
  const title = separator === -1 ? '' : description.slice(separator + 2);
  if (title === '') {
    throw new Error(`Das freistehende Zeichen "${id}" trägt keine Beschreibung, die es benennt.`);
  }
  return title;
}

/**
 * Das Profil, das sich auf die Baseline stützt. Ein Zeichen ohne Manifestzeile hat keine Zeile, die
 * ein Profil nennt; seine Quelle ist aber die Baseline, und genau ein Profil stützt sich auf sie.
 */
function baselineProfile(): string {
  const matching = Object.values(PROFILES).filter((profile) =>
    profile.sources.includes(COVERAGE_MANIFEST.baseline),
  );
  if (matching.length !== 1) {
    throw new Error(
      `Für die Baseline "${COVERAGE_MANIFEST.baseline}" gibt es ${matching.length} Profile statt ` +
        'genau eines; die Zeichen ohne Manifestzeile lassen sich keinem zuordnen.',
    );
  }
  return matching[0]!.id;
}

/**
 * Die semantische ID eines Zeichens ohne Manifestzeile: Art und Wert der Spec. Pfeil und Linie
 * nach ihrer Kennung (`movement.directed-movement`, `line.escape-route#alternative`), ein
 * Wetterbeispiel nach seinen Werten und seiner Intensität (`weather.cloudy-snowing-weak`).
 */
function unlistedSymbolId(spec: FreestandingSpec): string {
  switch (spec.kind) {
    case 'movement':
      return `movement.${spec.movement}`;
    case 'line':
      return spec.variant === undefined || spec.variant === 'primary'
        ? `line.${spec.line}`
        : `line.${spec.line}#${spec.variant}`;
    case 'weather': {
      const values = spec.values.map((value) => value.replace(/^weather-/, ''));
      return `weather.${[...values, ...(spec.intensity === undefined ? [] : [spec.intensity])].join('-')}`;
    }
    default:
      throw new Error(
        `Ein freistehendes Zeichen der Art "${spec.kind}" ohne Manifestzeile ist nicht vorgesehen: ` +
          'Zustände und Piktogramme stehen alle im Manifest.',
      );
  }
}

/**
 * Die Zeichnung über `drawAnySpec`, mit derselben Schwärzung der Ableitungsnotizen wie bei den
 * Orten: die Website liefert keine Referenzdateinamen aus (Spec §5.3).
 */
function drawingOf(spec: FreestandingSpec, label: string): Drawing {
  let drawing: Drawing;
  try {
    drawing = drawAnySpec(spec);
  } catch (error) {
    throw new Error(
      `Das freistehende Zeichen "${label}" lässt sich nicht zeichnen: ${(error as Error).message}`,
    );
  }
  if (drawing.derivations === undefined) return drawing;
  return {
    ...drawing,
    derivations: drawing.derivations.map((note) => ({
      ...note,
      part: withoutReferenceFilenames(note.part),
      from: withoutReferenceFilenames(note.from),
    })),
  };
}
