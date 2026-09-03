/**
 * Die Evidenzkürzel des Reviewdossiers als Daten für die Oberfläche — Kürzel **und**
 * ausgeschriebene Erklärung.
 *
 * Warum die Erklärung mitläuft und nicht nur das Kürzel: „FP" allein liest sich für einen
 * Fachreviewer wie eine Freigabe. Sie ist keine. Jede Erklärung nennt deshalb ausdrücklich, was
 * der Nachweis **nicht** belegt; genau daran hängt die Entscheidung, die dieses Werkzeug
 * vorbereitet. Der Wortlaut folgt Abschnitt 3 der Übergabe vom 6. August 2026 und Abschnitt 1
 * der Übergabe vom 28. August 2026 (`docs/reviews/`).
 *
 * Die Abbildung ist über `Record<TestEvidenceKind, …>` **vollständig**: eine neue Nachweisart im
 * Schema bricht hier die Typprüfung, statt still ohne Kürzel durchzulaufen. `evidenceChip` wirft
 * zusätzlich zur Laufzeit — für Aufrufer, die eine Zeichenkette aus einem Manifest lesen.
 */
import type { TestEvidenceKind } from '@einsatzzeichen/schema';
import type { EvidenceChip } from '../contract.js';

const EVIDENCE_CHIPS: Record<TestEvidenceKind, EvidenceChip> = {
  'body-fingerprint': {
    kind: 'body-fingerprint',
    abbreviation: 'FP',
    explanation:
      'Körperhülle gegen die aus dem lokalen Referenz-SVG abgeleiteten Kennzahlen ' +
      '(`matchFingerprint`). Verglichen wird ausschließlich die Hülle des `body`-Primitivs, ' +
      'nicht das vollständige Bild.',
  },
  'body-geometry-regression': {
    kind: 'body-geometry-regression',
    abbreviation: 'GEO',
    explanation:
      'Körpergeometrie gegen in der Testdatei festgenagelte Messwerte — dort, wo das ' +
      'Kennwertartefakt keine vergleichbare Form führt. Bewusst kein FP: der Erwartungswert ' +
      'steht in der Testdatei und nicht im eingecheckten Artefakt.',
  },
  'svg-snapshot': {
    kind: 'svg-snapshot',
    abbreviation: 'RS',
    explanation:
      'Datei- und Mehrgrößen-Rastersnapshot der eigenen Ausgabe. Schützt vor Regressionen und ' +
      'ist kein autoritativer Vergleich gegen die Referenz.',
  },
  'reference-fill': {
    kind: 'reference-fill',
    abbreviation: 'FARBE',
    explanation:
      'Palettenwert gegen die im Referenzartefakt gefundene Füllfarbe. Belegt den Farbwert, ' +
      'nicht die fachliche Zuordnung der Farbe zu einer Organisation.',
  },
  'head-shape-regression': {
    kind: 'head-shape-regression',
    abbreviation: 'KOPF',
    explanation:
      'Programmatische Prüfung der vermessenen Kopfmarken; die zusätzlichen Belegdateien stehen ' +
      'im Elementregister. Belegt die Geometrie der Marke, nicht die einsatztaktische Bedeutung ' +
      'des Stärkegrades.',
  },
  'chassis-shape-regression': {
    kind: 'chassis-shape-regression',
    abbreviation: 'FW',
    explanation:
      'Programmatische Prüfung der vermessenen Fahrwerksmarken aus Kapitel 5.1. Bewusst kein ' +
      'KOPF: die Fahrwerkszone verankert an der Körperunterkante und wird vom Kopfgate nie ' +
      'erfasst. Belegt die Geometrie, nicht die Kategorienzuordnung.',
  },
  'pictogram-contract': {
    kind: 'pictogram-contract',
    abbreviation: 'PG',
    explanation:
      'Piktogramm besteht Kommando-, Box-, Clipping- und Snapshot-Gate. Bildidee und ' +
      'Verwechslungsfreiheit bleiben ungeprüft — genau sie sind Gegenstand des Fachreviews.',
  },
};

/**
 * Ein Chip zu einer Nachweisart. Fail-closed: eine unbekannte Art ist ein Fehler und kein
 * Rückfall auf ein leeres Kürzel — ein Chip ohne Erklärung wäre eine Behauptung ohne Herkunft.
 */
export function evidenceChip(kind: TestEvidenceKind): EvidenceChip {
  const chip = EVIDENCE_CHIPS[kind];
  if (chip === undefined) {
    throw new Error(`Keine Evidenzerklärung für die Nachweisart "${String(kind)}" hinterlegt.`);
  }
  return chip;
}

/**
 * Die Chips einer Manifestzeile, in Manifestreihenfolge und ohne Wiederholung. Doppelte Arten
 * sind im Manifest nicht vorgesehen; die Entdopplung ist billig und hält die Anzeige stabil,
 * falls eine Zeile eine Art zweimal führt.
 */
export function evidenceChips(kinds: readonly TestEvidenceKind[]): readonly EvidenceChip[] {
  const seen = new Set<TestEvidenceKind>();
  const chips: EvidenceChip[] = [];
  for (const kind of kinds) {
    if (seen.has(kind)) continue;
    seen.add(kind);
    chips.push(evidenceChip(kind));
  }
  return chips;
}

/** Alle hinterlegten Nachweisarten — für Tests und für die Legende der Oberfläche. */
export const EVIDENCE_KINDS: readonly TestEvidenceKind[] = Object.keys(
  EVIDENCE_CHIPS,
) as TestEvidenceKind[];
