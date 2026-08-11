import {
  entryKey,
  type Review,
  type CoverageEntry,
  type CoverageManifest,
  type ReviewSet,
  type TestEvidenceKind,
} from '@einsatzzeichen/schema';
import { BASE_SYMBOLS } from './base-symbols.js';
import { manifestDomainReviewFor } from './domain-reviews.js';
import { resolveElement } from './elements.js';
import { ALL_PICTOGRAMS } from './pictograms/index.js';
import { deepFreeze, type DeepReadonly } from './readonly-data.js';
import { RECIPES } from './recipes.js';
import { ANHANG_E_A_FILL_DEFECTS, ANHANG_E_A_RECIPES } from './recipes-anhang-e.js';

/**
 * Migration nach Slice 2: `technical` ist für alle elf Einträge `approved`, weil das Kriterium
 * aus der Spec (Fingerprint- und Snapshot-Gate für diesen Eintrag grün) erfüllt ist —
 * Slice-1-Erfolgskriterien 1 und 2. `domain` bleibt offen: eine fachliche Prüfung durch eine
 * Person mit einsatztaktischer Fachkunde hat nicht stattgefunden, und das Modell verdeckt das nicht.
 */
const TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-05',
};

/**
 * Für Piktogramme ist der erste Teil des Slice-2-Kriteriums für `technical: approved`
 * — Fingerprint- und Snapshot-Gate grün — strukturell unerreichbar: `matchFingerprint` vergleicht
 * ausschließlich `role: 'body'`, und das Fingerprint-Gate ist auf Kapitel 1–3 beschränkt. An seine
 * Stelle treten vier lokale, piktogrammspezifische Bedingungen. Die globalen Mehrgrößen-,
 * viewBox-, Metadaten- und Kontrast-Gates kommen seit der Härtung vor D.1 hinzu. Die `note` hält
 * beide Ebenen getrennt fest, statt ein globales Gate als Eigenschaft eines einzelnen Elements
 * auszugeben — dasselbe Muster wie `SOURCE_REVIEW` in `sources.ts`.
 */
const PICTOGRAM_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-06',
  note:
    'Fingerprint-Gate für Piktogramme nicht anwendbar (matchFingerprint vergleicht nur ' +
    'role: body). Lokal treten vier grüne Gates an seine Stelle: Snapshot, Kommando, Box, ' +
    'Clipping. Zusätzlich bestehen die globalen Mehrgrößen-, viewBox-, Metadaten- und ' +
    'Kontrast-Gates des renderbaren Katalogbestands.',
};

const STATE_PICTOGRAM_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-07',
  note:
    'Fingerprint-Gate für Piktogramme nicht anwendbar. Für Kapitel 5.8 bestehen Snapshot, ' +
    'Kommando, Box und Standalone-Clipping gegen die 32×32-mm-ViewBox sowie die globalen ' +
    'Mehrgrößen-, viewBox-, Metadaten- und expliziten Kontrast-Gates; die 67/67-Sichtprüfung ' +
    'ist in docs/reviews/2026-08-07-d2-visual-qa.md dokumentiert.',
};

/**
 * Schadens- und Vegetationsbrandzeichen der Anhänge K, L und M. Dieselben lokalen Gates wie bei
 * den Zuständen und den IuK-Zeichen; die Note nennt zusätzlich die beiden Farbentscheidungen, die
 * D.4 treffen musste, damit sie nicht nur in der Entscheidungsnotiz stehen.
 */
const DAMAGE_PICTOGRAM_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-10',
  note:
    'Fingerprint-Gate für Piktogramme nicht anwendbar. Für K, L und M bestehen Snapshot, ' +
    'Kommando, Box und Standalone-Clipping gegen die 32×32-mm-ViewBox sowie die globalen ' +
    'Mehrgrößen-, viewBox-, Metadaten- und expliziten Kontrast-Gates. Zwei Farbbefunde sind ' +
    'behoben statt umgangen: die Ziffern in L.10 stehen schwarz statt rot (Rot verfehlt als ' +
    'Text 4,5:1), und hellblau trägt im Druckmonochrom #808080 statt #eeeeee (M.12 bis M.14 ' +
    'setzen blaue Geometrie ohne schwarze Kontur auf die Oberfläche). Die Sichtprüfung aller ' +
    '42 ist in docs/reviews/2026-08-10-d4-visual-qa.md dokumentiert.',
};

/** Technische und fachliche Rolle bleiben getrennt; das Fachreview ist je Manifestzeile einzeln. */
function reviewFor(
  sourceId: string,
  variant: CoverageEntry['variant'],
  technical: Review,
): ReviewSet {
  return {
    technical,
    domain: manifestDomainReviewFor(entryKey(sourceId, variant)),
  };
}

const DRAWING_EVIDENCE = [
  'body-fingerprint',
  'svg-snapshot',
] as const satisfies readonly TestEvidenceKind[];

const catalogEntries: CoverageEntry[] = Object.values(BASE_SYMBOLS).map((entry) => {
  // Die Zeile trägt `variant: 'primary'`, also muss sie auch aus der `primary`-Darstellung
  // abgeleitet sein — nicht aus der ersten. `depictions` ist ungeordnet; sobald ein Eintrag eine
  // `alternative` zuerst führt, käme Abschnitt und Belegdatei aus der Alternative.
  const ref = entry.depictions.find((d) => d.variant === 'primary')?.sourceRefs[0];
  const sourceId = `bbk-babz-2025:${ref?.section ?? ''}`;
  return {
    sourceId,
    variant: 'primary',
    title: entry.title,
    implementation: entry.id,
    referenceAsset: ref?.asset ?? '',
    coverage: 'catalog-entry',
    profile: 'bund',
    testEvidence: DRAWING_EVIDENCE,
    review: reviewFor(sourceId, 'primary', TECHNICAL_REVIEW),
  };
});

/**
 * Technisches Review der 16 Zeichen aus E-a. Eigener Eintrag statt des allgemeinen
 * `TECHNICAL_REVIEW`, weil sie als erste Kompositionen Beschriftungszonen im Körper tragen: das
 * Fingerprint-Gate erreicht davon nichts (`matchFingerprint` vergleicht ausschließlich
 * `role: 'body'`), an seine Stelle tritt für den Text die Rasterprüfung gegen die deklarierte
 * Box. Die Note hält beides getrennt fest — dasselbe Muster wie bei den Piktogrammreviews oben.
 */
const ANHANG_E_A_TECHNICAL_REVIEW: Review = {
  status: 'approved',
  reviewer: 'rv',
  date: '2026-08-12',
  note:
    'Körperhülle per matchFingerprint gegen die Referenz gegated (Differenz 0 an allen vier ' +
    'Kanten). Die Beschriftungszonen erreicht das Fingerprint-Gate nicht; für sie prüft die ' +
    'Rasterprüfung in fonts.test.ts die tatsächliche Tinte aller 16 Kürzelsätze gegen die ' +
    'deklarierte boxMm. Dazu die globalen Mehrgrößen-, viewBox-, Metadaten- und ' +
    'Kontrast-Gates; weisser Text auf der Organisationsfarbe steht als eigene 4,5:1-' +
    'Anforderung im A11y-Gate und hat blau in beiden Alternativthemes nachgezogen. Die ' +
    'Sichtprüfung aller 16 ist in docs/reviews/2026-08-12-e-a-visual-qa.md dokumentiert.',
};

/**
 * Zwei der 16 Referenzdateien tragen eine zu kurze blaue Füllfläche (siehe
 * `ANHANG_E_A_FILL_DEFECTS`). Der Katalog baut sie wie die 14 fehlerfreien; die Abweichung
 * gehört damit in ihre Manifestzeile und nicht nur in einen Quellkommentar.
 */
function technicalReviewFor(section: string): Review {
  if (!Object.hasOwn(ANHANG_E_A_RECIPES, section)) return TECHNICAL_REVIEW;
  const defect = ANHANG_E_A_FILL_DEFECTS[section];
  if (defect === undefined) return ANHANG_E_A_TECHNICAL_REVIEW;
  return {
    ...ANHANG_E_A_TECHNICAL_REVIEW,
    note: `${ANHANG_E_A_TECHNICAL_REVIEW.note ?? ''} Befund an der Referenzdatei: ${defect}`,
  };
}

const recipeEntries: CoverageEntry[] = Object.entries(RECIPES).map(([section, recipe]) => {
  const sourceId = `bbk-babz-2025:${section}`;
  return {
    sourceId,
    variant: 'primary',
    title: recipe.title,
    implementation: `recipe.${section}`,
    referenceAsset: recipe.referenceAsset,
    coverage: 'composition-recipe',
    profile: 'bund',
    // Task 13 hat alle drei Rezepte per matchFingerprint gegen die Referenz gegated,
    // mit Differenz 0 an allen Kanten — das Manifest bildet das ab, statt es zu untertreiben.
    // Für die 16 Zeichen aus E-a gilt dasselbe, geprüft in recipes.test.ts.
    testEvidence: DRAWING_EVIDENCE,
    review: reviewFor(sourceId, 'primary', technicalReviewFor(section)),
  };
});

/**
 * Abschnittsnummer je Element. Jedes Element braucht eine eigene Nummer, sonst kollidierten die
 * vier Stärkegrade auf `5.4` — der Manifestschlüssel bleibt `entryKey(sourceId, variant)`.
 * Alle elf Nummern sind aus den Dateinamen des Referenzbestands belegt, keine ist geschlossen.
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
};

/**
 * Elemente tragen die zu ihrer Datenform passende Evidenz statt zwei universelle Booleans:
 * Organisationsfarben werden gegen die Referenzfüllung geprüft, Stärkegrade als vollständige
 * `HeadShape`. Piktogramme werden unmittelbar unterhalb aus ihren Definitionen mit eigenen
 * SVG-Snapshots und ihrem Kommando-/Box-/Clipping-Vertrag abgeleitet.
 * Globale Mehrgrößen-, viewBox-, Metadaten- und Kontrast-Gates bleiben globale Aussagen und
 * werden nicht als Eigenschaft jeder einzelnen Manifestzeile ausgegeben.
 */
const elementEntries: CoverageEntry[] = Object.entries(ELEMENT_SECTIONS).map(([id, section]) => {
  const descriptor = resolveElement(id);
  const sourceId = `bbk-babz-2025:${section}`;
  const testEvidence: readonly TestEvidenceKind[] =
    descriptor.kind === 'organization'
      ? ['reference-fill']
      : descriptor.kind === 'strength'
        ? ['head-shape-regression']
        : ['svg-snapshot', 'pictogram-contract'];
  return {
    sourceId,
    variant: 'primary',
    title: descriptor.title,
    implementation: id,
    // Die namensgebende Datei. Das Gate prüft, dass sie in `referenceAssets` vorkommt und dass
    // ihr Name mit der Abschnittsnummer aus `sourceId` beginnt.
    referenceAsset: descriptor.referenceAssets[0] ?? '',
    coverage: 'element',
    profile: 'bund',
    testEvidence,
    review: reviewFor(sourceId, 'primary', TECHNICAL_REVIEW),
  };
});

const pictogramEntries: CoverageEntry[] = ALL_PICTOGRAMS.map((definition) => {
  const sourceId = `bbk-babz-2025:${definition.section}`;
  const technicalReview = definition.id.startsWith('state.')
    ? STATE_PICTOGRAM_TECHNICAL_REVIEW
    : definition.id.startsWith('damage.') || definition.id.startsWith('wildfire.')
      ? DAMAGE_PICTOGRAM_TECHNICAL_REVIEW
      : PICTOGRAM_TECHNICAL_REVIEW;
  return {
    sourceId,
    variant: definition.variant,
    title: definition.title,
    implementation: definition.id,
    referenceAsset: definition.referenceAsset,
    coverage: 'element',
    profile: 'bund',
    testEvidence: ['svg-snapshot', 'pictogram-contract'],
    review: reviewFor(sourceId, definition.variant, technicalReview),
  };
});

const COVERAGE_MANIFEST_DATA: CoverageManifest = {
  baseline: 'bbk-babz-2025',
  /**
   * Datenversion des Kerns, unabhängig von den npm-Paketversionen. Ein Profil kann sich ändern,
   * ohne den Kern zu berühren, und umgekehrt — über Paketversionen wäre das nur darstellbar,
   * wenn jedes Profil ein eigenes npm-Paket wäre.
   */
  coreVersion: '0.1.0',
  // Kapitel 3 (sieben Referenzdateien) setzt dieser Slice nicht um; 5.1.1/5.7 sind entfallen
  // (Verwaltungsstufen/Fahrzeugkategorien: von 16 Referenzdateien nur 2 vermessbar, kein Konsument).
  // K, L und M stehen einbuchstabig im Umfang, weil ihre Nummerierung flach ist: `K` deckt
  // K.1 bis K.18 ab, wo `J` vier Unterkapitel gebraucht hätte.
  // Anhang E steht abschnittsweise und **nicht** als `E.1`: der Teilslice E-a deckt 16 der 37
  // E.1-Abschnitte ab. `E.1` würde das Gate zwar bestehen — `uncoveredScope` prüft nur, ob zu
  // jedem beanspruchten Präfix mindestens eine Zeile existiert, nicht die Vollständigkeit —,
  // aber genau deshalb wäre es eine Behauptung, die kein Gate widerlegt. Dieselbe Wahl wie bei
  // C.1.1/C.1.2/D.3.7 (einzeln, weil Belegfälle) statt bei K/L/M (einbuchstabig, weil
  // vollständig). Wenn E-b und E-c gelandet sind, treten die 37 Zeilen an `E.1` zurück.
  scope: [
    '1',
    '2',
    '4',
    '5.4',
    '5.8',
    'C.1.1',
    'C.1.2',
    'D.3.7',
    'E.1.1',
    'E.1.2',
    'E.1.3',
    'E.1.4',
    'E.1.5',
    'E.1.6',
    'E.1.7',
    'E.1.8',
    'E.1.9',
    'E.1.10',
    'E.1.11',
    'E.1.12',
    'E.1.13',
    'E.1.14',
    'E.1.15',
    'E.1.16',
    'J.1',
    'J.2',
    'J.3',
    'J.4',
    'K',
    'L',
    'M',
  ],
  entries: [...catalogEntries, ...recipeEntries, ...elementEntries, ...pictogramEntries],
};

// Die Fachreviews sind bereits als unveränderliche Ledgerobjekte ausgewiesen. Alle übrigen
// Referenzen gehören diesem Modul; das direkte Einfrieren erhält deshalb den geprüften
// Identitätsvertrag zwischen Manifestzeile und Ledger ohne fremde Eingaben zu verändern.
export const COVERAGE_MANIFEST: DeepReadonly<CoverageManifest> = deepFreeze(COVERAGE_MANIFEST_DATA);
