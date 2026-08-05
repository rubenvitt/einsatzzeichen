import {
  entryKey,
  unattributedRoles,
  type CatalogEntry,
  type CoverageEntry,
  type CoverageManifest,
  type ReviewSet,
  type SourceId,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
import { resolveElement } from './elements.js';
import { RECIPES } from './recipes.js';
import { isRegisteredSource } from './sources.js';

/**
 * Migration nach Slice 2: `technical` ist für alle elf Einträge `approved`, weil das Kriterium
 * aus der Spec (Fingerprint- und Snapshot-Gate für diesen Eintrag grün) erfüllt ist —
 * Slice-1-Erfolgskriterien 1 und 2. `domain` bleibt offen: eine fachliche Prüfung durch eine
 * Person mit einsatztaktischer Fachkunde hat nicht stattgefunden, und das Modell verdeckt das nicht.
 */
const REVIEW: ReviewSet = {
  technical: { status: 'approved', reviewer: 'rv', date: '2026-08-05' },
  domain: { status: 'pending' },
};

const catalogEntries: CoverageEntry[] = Object.values(BASE_SYMBOLS).map((entry) => {
  const ref = entry.depictions[0]?.sourceRefs[0];
  return {
    sourceId: `bbk-babz-2025:${ref?.section ?? ''}`,
    variant: 'primary',
    title: entry.title,
    implementation: entry.id,
    referenceAsset: ref?.asset ?? '',
    coverage: 'catalog-entry',
    profile: 'bund',
    fingerprintTest: true,
    snapshotTest: true,
    review: REVIEW,
  };
});

const recipeEntries: CoverageEntry[] = Object.entries(RECIPES).map(([section, recipe]) => ({
  sourceId: `bbk-babz-2025:${section}`,
  variant: 'primary',
  title: recipe.title,
  implementation: `recipe.${section}`,
  referenceAsset: recipe.referenceAsset,
  coverage: 'composition-recipe',
  profile: 'bund',
  // Task 13 hat alle drei Rezepte per matchFingerprint gegen die Referenz gegated,
  // mit Differenz 0 an allen Kanten — das Manifest bildet das ab, statt es zu untertreiben.
  fingerprintTest: true,
  snapshotTest: true,
  review: REVIEW,
}));

/**
 * Abschnittsnummer je Element. Jedes Element braucht eine eigene Nummer, sonst kollidierten die
 * vier Stärkegrade auf `5.4` — der Manifestschlüssel bleibt `entryKey(sourceId, variant)`.
 * Alle zwölf Nummern sind aus den Dateinamen des Referenzbestands belegt, keine ist geschlossen.
 */
const ELEMENT_SECTIONS: Record<string, string> = {
  'organization.feuerwehr': '2.1',
  'organization.thw': '2.3',
  'organization.fuehrung-leitung': '2.4',
  'organization.polizei': '2.5',
  'organization.bundeswehr': '2.6',
  'organization.sonstige-gefahrenabwehr': '2.7',
  'organization.zivile-einheiten': '2.8',
  'strength.trupp': '5.4.1',
  'strength.staffel': '5.4.2',
  'strength.gruppe': '5.4.3',
  'strength.zug': '5.4.4',
  'capability.fire-fighting': '4.3.1',
};

/**
 * `fingerprintTest` und `snapshotTest` sind bei allen zwölf `false` und das ist kein Versäumnis:
 * das Fingerprint-Gate vergleicht ausschließlich `role: 'body'` und erfasst Kopfmarken nie
 * (Entscheidungsnotiz vom 4. August 2026, Abschnitt 5); Snapshots existieren nur für Grundzeichen
 * und Rezepte. Die Elemente sind stattdessen durch `organizations.test.ts`, `strengths.test.ts`
 * und `capabilities.test.ts` festgenagelt — das trägt `review.technical: approved`, aber das
 * Manifest bildet die Testarten ab, statt sie zu überzeichnen.
 */
const elementEntries: CoverageEntry[] = Object.entries(ELEMENT_SECTIONS).map(([id, section]) => {
  const descriptor = resolveElement(id);
  return {
    sourceId: `bbk-babz-2025:${section}`,
    variant: 'primary',
    title: descriptor.title,
    implementation: id,
    // Die namensgebende Datei. Das Gate prüft, dass sie in `referenceAssets` vorkommt.
    referenceAsset: descriptor.referenceAssets[0] ?? '',
    coverage: 'element',
    profile: 'bund',
    fingerprintTest: false,
    snapshotTest: false,
    review: REVIEW,
  };
});

export const COVERAGE_MANIFEST: CoverageManifest = {
  baseline: 'bbk-babz-2025',
  /**
   * Datenversion des Kerns, unabhängig von den npm-Paketversionen. Ein Profil kann sich ändern,
   * ohne den Kern zu berühren, und umgekehrt — über Paketversionen wäre das nur darstellbar,
   * wenn jedes Profil ein eigenes npm-Paket wäre.
   */
  coreVersion: '0.1.0',
  // Kapitel 3 (sieben Referenzdateien) setzt dieser Slice nicht um; 5.1.1/5.7 sind entfallen
  // (Verwaltungsstufen/Fahrzeugkategorien: von 16 Referenzdateien nur 2 vermessbar, kein Konsument).
  scope: ['1', '2', '4.3.1', '5.4', 'C.1.1', 'C.1.2', 'D.3.7'],
  entries: [...catalogEntries, ...recipeEntries, ...elementEntries],
};

/**
 * Katalogeinträge, die nicht genau eine `primary`-Darstellung haben. `CatalogEntry.depictions`
 * ist `readonly Depiction[]` — der Typ erzwingt die im Schema-Kommentar dokumentierte Invariante
 * ("Mindestens eine Darstellung; `primary` genau einmal") nicht. Leeres Array, zwei `primary`,
 * kein `primary` sind alle typkorrekt; die Prüfung sitzt deshalb hier, am Coverage-Gate.
 */
export function findPrimaryViolations(entries: readonly CatalogEntry[]): string[] {
  const violations: string[] = [];
  for (const entry of entries) {
    const primaryCount = entry.depictions.filter((d) => d.variant === 'primary').length;
    if (primaryCount !== 1) violations.push(entry.id);
  }
  return violations;
}

/**
 * Eine Verletzung einer der neun in Slice 2 hinzugekommenen Prüfungen. Eine gemeinsame Liste
 * statt neun einzelner Arrays: das CLI gibt sie einheitlich aus, und eine zehnte Prüfung kostet
 * keine Änderung an der Rückgabeform.
 */
export interface CoverageViolation {
  /** Kurzname der Prüfung, z. B. 'baseline-prefix'. */
  check: string;
  /** Manifestschlüssel, Katalog-ID oder Registerschlüssel — je nachdem, was geprüft wurde. */
  key: string;
  detail: string;
}

/**
 * Das Präfix jedes `sourceId` muss die Baseline sein — nicht irgendeine registrierte Quelle.
 * Das Präfix bezeichnet die Abschnittsnummerierung, und nur im Hauptdokument ist definiert,
 * dass `5.4.3` „Gruppe" bedeutet.
 */
export function checkBaselinePrefix(
  entries: readonly CoverageEntry[],
  baseline: SourceId,
): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    const separator = entry.sourceId.indexOf(':');
    const prefix = separator === -1 ? '' : entry.sourceId.slice(0, separator);
    if (prefix !== baseline) {
      violations.push({
        check: 'baseline-prefix',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Präfix "${prefix}" statt der Baseline "${baseline}".`,
      });
    }
  }
  return violations;
}

/**
 * Jede `primary`-Darstellung eines Katalogeintrags muss mindestens einen Quellenbezug auf eine
 * registrierte Quelle tragen. Das ist die zweite Hälfte der Provenienz: das Manifest-Präfix
 * nennt die Abschnittsnummerierung, dieser Bezug nennt, woraus die Kennzahlen abgeleitet sind.
 */
export function checkCatalogSourceRefs(entries: readonly CatalogEntry[]): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    const primary = entry.depictions.find((d) => d.variant === 'primary');
    const registered = primary?.sourceRefs.some((ref) => isRegisteredSource(ref.source)) ?? false;
    if (!registered) {
      violations.push({
        check: 'unregistered-source',
        key: entry.id,
        detail: 'Die primary-Darstellung nennt keine registrierte Quelle.',
      });
    }
  }
  return violations;
}

/**
 * Für Zeilen mit `coverage: 'catalog-entry'` ist der Manifestwert `profile` aus dem
 * Katalogeintrag abgeleitet — hier wird die Gleichheit geprüft. Für Rezepte und Elemente ist der
 * Manifestwert die einzige Angabe; dort gibt es nichts zu vergleichen.
 */
export function checkProfileAgreement(
  entries: readonly CoverageEntry[],
  catalog: readonly CatalogEntry[],
): CoverageViolation[] {
  const byId = new Map(catalog.map((entry) => [entry.id, entry]));
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    if (entry.coverage !== 'catalog-entry') continue;
    const target = byId.get(entry.implementation);
    if (target === undefined) {
      violations.push({
        check: 'profile-mismatch',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Kein Katalogeintrag "${entry.implementation}" — das Profil ist nicht ableitbar.`,
      });
      continue;
    }
    if (target.profile !== entry.profile) {
      violations.push({
        check: 'profile-mismatch',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Manifest nennt "${entry.profile}", der Katalogeintrag "${target.profile}".`,
      });
    }
  }
  return violations;
}

/** Kein `approved` ohne Reviewer und Datum, je Rolle. Ein Status ohne Zurechenbarkeit ist wertlos. */
export function checkReviewAttribution(entries: readonly CoverageEntry[]): CoverageViolation[] {
  const violations: CoverageViolation[] = [];
  for (const entry of entries) {
    for (const role of unattributedRoles(entry.review)) {
      violations.push({
        check: 'review-attribution',
        key: entryKey(entry.sourceId, entry.variant),
        detail: `Rolle "${role}": approved ohne Reviewer und Datum.`,
      });
    }
  }
  return violations;
}

/** Nur Ausgabe, kein Fehler: wäre sie einer, wäre CI ab dem ersten Tag dauerhaft rot. */
export function countOpenDomainReviews(entries: readonly CoverageEntry[]): number {
  return entries.filter((entry) => entry.review.domain.status !== 'approved').length;
}

/**
 * Das CI-Gate. Die vier Prüfungen aus Slice 1 (Referenzdatei vorhanden, eindeutige Schlüssel,
 * genau eine `primary`-Darstellung) bleiben in ihren eigenen Feldern; die in Slice 2
 * hinzugekommenen Prüfungen sammeln sich in `violations`.
 */
export function checkCoverage(): {
  missing: string[];
  duplicates: string[];
  invalidPrimary: string[];
  violations: CoverageViolation[];
  openDomainReviews: number;
} {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const missing: string[] = [];

  for (const entry of COVERAGE_MANIFEST.entries) {
    const key = entryKey(entry.sourceId, entry.variant);
    if (seen.has(key)) duplicates.push(key);
    seen.add(key);
    if (entry.referenceAsset === '' || entry.implementation === '') missing.push(key);
  }

  const catalog = Object.values(BASE_SYMBOLS);
  const invalidPrimary = findPrimaryViolations(catalog);

  const violations = [
    ...checkBaselinePrefix(COVERAGE_MANIFEST.entries, COVERAGE_MANIFEST.baseline),
    ...checkCatalogSourceRefs(catalog),
    ...checkProfileAgreement(COVERAGE_MANIFEST.entries, catalog),
    ...checkReviewAttribution(COVERAGE_MANIFEST.entries),
  ];

  return {
    missing,
    duplicates,
    invalidPrimary,
    violations,
    openDomainReviews: countOpenDomainReviews(COVERAGE_MANIFEST.entries),
  };
}
