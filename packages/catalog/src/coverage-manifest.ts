import {
  entryKey,
  type CatalogEntry,
  type CoverageEntry,
  type CoverageManifest,
  type ReviewSet,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
import { RECIPES } from './recipes.js';

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
  // Task 13 hat alle drei Rezepte per matchFingerprint gegen die Referenz gegated,
  // mit Differenz 0 an allen Kanten — das Manifest bildet das ab, statt es zu untertreiben.
  fingerprintTest: true,
  snapshotTest: true,
  review: REVIEW,
}));

export const COVERAGE_MANIFEST: CoverageManifest = {
  baseline: 'bbk-babz-2025',
  // Kapitel 3 (sieben Referenzdateien) setzt dieser Slice nicht um; 5.1.1/5.7 sind entfallen
  // (Verwaltungsstufen/Fahrzeugkategorien: von 16 Referenzdateien nur 2 vermessbar, kein Konsument).
  scope: ['1', '2', '4.3.1', '5.4', 'C.1.1', 'C.1.2', 'D.3.7'],
  entries: [...catalogEntries, ...recipeEntries],
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
 * Prüft, ob jeder Manifest-Eintrag eine Referenzdatei nennt, ob die Schlüssel eindeutig sind
 * und ob jeder Katalogeintrag genau eine `primary`-Darstellung hat. Wird als CI-Gate ausgeführt.
 */
export function checkCoverage(): {
  missing: string[];
  duplicates: string[];
  invalidPrimary: string[];
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

  const invalidPrimary = findPrimaryViolations(Object.values(BASE_SYMBOLS));

  return { missing, duplicates, invalidPrimary };
}
