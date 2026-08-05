import type { CoverageEntry, CoverageManifest, ReviewSet } from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
import { resolveElement } from './elements.js';
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
