/**
 * Gates der Zeilenmenge. Der Kern ist die Vollständigkeit: 558 Träger, jeder Manifestschlüssel
 * genau einmal, und **jede** Manifestzeile mit einer Zeichnung. Eine Zeile ohne Bild wäre eine,
 * die der Reviewer blind entscheidet — das ist der Befund, wegen dessen dieses Werkzeug
 * überhaupt entsteht.
 */
import { describe, expect, it } from 'vitest';
import {
  COVERAGE_MANIFEST,
  DOMAIN_REVIEW_QUESTIONS,
  MANIFEST_DOMAIN_REVIEWS,
  PROFILES,
  SOURCE_REGISTRY,
  releaseBlockers,
  sortedDomainReviewOpenByArea,
} from '@einsatzzeichen/catalog';
import { entryKey, type TestEvidenceKind } from '@einsatzzeichen/schema';
import { carrierId } from '../contract.js';
import { EVIDENCE_KINDS, evidenceChip } from './evidence.js';
import { PROFILE_AREA, SOURCE_AREA, buildRows, manifestAreaOrder } from './rows.js';

const rows = buildRows();
const manifestRows = rows.filter((row) => row.kind === 'manifest');

describe('buildRows', () => {
  it('führt genau 558 Träger: 544 Manifestzeilen, 13 Quellen, ein Profil', () => {
    expect(rows).toHaveLength(558);
    expect(manifestRows).toHaveLength(COVERAGE_MANIFEST.entries.length);
    expect(rows.filter((row) => row.kind === 'source')).toHaveLength(
      Object.keys(SOURCE_REGISTRY).length,
    );
    expect(rows.filter((row) => row.kind === 'profile')).toHaveLength(
      Object.keys(PROFILES).length,
    );
  });

  it('nennt jeden Manifestschlüssel genau einmal', () => {
    const keys = manifestRows.map((row) => row.key);
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort()).toEqual(
      COVERAGE_MANIFEST.entries.map((entry) => entryKey(entry.sourceId, entry.variant)).sort(),
    );
  });

  it('vergibt eindeutige Kennungen über alle drei Ledger hinweg', () => {
    const ids = rows.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain(carrierId('source', 'phjardas-tz'));
    expect(ids).toContain(carrierId('profile', 'bund'));
  });

  it('gibt jeder Manifestzeile eine Zeichnung mit positiver viewBox', () => {
    for (const row of manifestRows) {
      expect(row.drawing, `Zeile ohne Zeichnung: ${row.key}`).toBeDefined();
      const viewBox = row.drawing?.viewBox;
      expect(viewBox?.width, `viewBox-Breite von ${row.key}`).toBeGreaterThan(0);
      expect(viewBox?.height, `viewBox-Höhe von ${row.key}`).toBeGreaterThan(0);
      expect(row.drawing?.children.length, `leere Zeichnung: ${row.key}`).toBeGreaterThan(0);
    }
  });

  it('verteilt die Zeichnungen auf die vier Fälle der Designnotiz', () => {
    const byCoverage = (kind: string) =>
      manifestRows.filter((row) => row.coverage === kind).length;
    expect(byCoverage('catalog-entry')).toBe(14);
    expect(byCoverage('composition-recipe')).toBe(242);
    expect(byCoverage('element')).toBe(288);
  });

  it('kennzeichnet genau die 19 nicht selbstständigen Elemente als Trägerzeichen', () => {
    const carriers = rows.filter((row) => row.carrierContext !== undefined);
    expect(carriers).toHaveLength(19);
    const hosts = carriers.map((row) => row.carrierContext?.host);
    expect(hosts.filter((host) => host === 'formation')).toHaveLength(12);
    expect(hosts.filter((host) => host === 'vehicle-land')).toHaveLength(7);
    // Acht Organisationsfarben, vier Stärkegrade, sieben Fahrzeugkategorien.
    const prefixes = carriers.map((row) => row.implementation?.split('.')[0]);
    expect(prefixes.filter((prefix) => prefix === 'organization')).toHaveLength(8);
    expect(prefixes.filter((prefix) => prefix === 'strength')).toHaveLength(4);
    expect(prefixes.filter((prefix) => prefix === 'vehicle-category')).toHaveLength(7);
    for (const carrier of carriers) {
      expect(carrier.carrierContext?.explanation).toContain('nicht Teil der geprüften Aussage');
    }
  });

  it('gibt Quellen und Profil Prosa statt einer Zeichnung', () => {
    for (const row of rows) {
      if (row.kind === 'manifest') continue;
      expect(row.drawing, `${row.id} trägt unerwartet eine Zeichnung`).toBeUndefined();
      expect(row.prose?.length, `${row.id} ohne Prosa`).toBeGreaterThan(0);
      for (const section of row.prose ?? []) {
        expect(section.heading.length).toBeGreaterThan(0);
        expect(section.body.length).toBeGreaterThan(0);
      }
    }
    const source = rows.find((row) => row.id === carrierId('source', 'phjardas-tz'));
    expect(source?.prose?.map((section) => section.heading)).toEqual([
      'Nutzungsgrundlage',
      'Beschaffungsstand',
      'Umgang mit der Geometrie',
    ]);
  });

  it('übernimmt die Fachfragen deckungsgleich aus dem Register', () => {
    const expected = new Map<string, string[]>();
    for (const question of DOMAIN_REVIEW_QUESTIONS) {
      for (const key of question.keys) {
        expected.set(key, [...(expected.get(key) ?? []), question.id]);
      }
    }
    let withQuestions = 0;
    for (const row of manifestRows) {
      const ids = row.questions.map((question) => question.id);
      expect(ids, `Fragen an ${row.key}`).toEqual(expected.get(row.key) ?? []);
      if (ids.length > 0) withQuestions += 1;
    }
    expect(withQuestions).toBe(expected.size);
    // Quellen und Profil haben im Register keinen Platz und dürfen keine Fragen erben.
    for (const row of rows) {
      if (row.kind !== 'manifest') expect(row.questions).toEqual([]);
    }
  });

  it('liest den Fachreviewstatus aus dem Ledger', () => {
    for (const row of manifestRows) {
      const ledger = (MANIFEST_DOMAIN_REVIEWS as Record<string, { status: string }>)[row.key];
      expect(row.domain.status, `Status von ${row.key}`).toBe(ledger?.status);
    }
  });

  it('erklärt jede im Manifest vorkommende Nachweisart', () => {
    const used = new Set<TestEvidenceKind>();
    for (const entry of COVERAGE_MANIFEST.entries) {
      for (const kind of entry.testEvidence) used.add(kind);
    }
    expect(used.size).toBeGreaterThan(0);
    for (const kind of used) {
      const chip = evidenceChip(kind);
      expect(chip.abbreviation.length).toBeGreaterThan(0);
      expect(chip.explanation.length).toBeGreaterThan(0);
    }
    // Vollständig in die andere Richtung: kein Kürzel ohne Nachweisart im Schema.
    expect(new Set(EVIDENCE_KINDS.map((kind) => evidenceChip(kind).abbreviation))).toEqual(
      new Set(['FP', 'GEO', 'RS', 'FARBE', 'KOPF', 'FW', 'PG']),
    );
  });

  it('weist eine unbekannte Nachweisart ab, statt sie ohne Kürzel anzuzeigen', () => {
    expect(() => evidenceChip('erfundener-nachweis' as TestEvidenceKind)).toThrow(
      /erfundener-nachweis/,
    );
  });
});

describe('Reihenfolge', () => {
  it('stellt die Bereiche in der Reihenfolge der Coverage-Zeile her, Quellen und Profil zuletzt', () => {
    const areas: string[] = [];
    for (const row of rows) {
      if (areas[areas.length - 1] !== row.area) areas.push(row.area);
    }
    // Jeder Bereich kommt als ein zusammenhängender Block vor.
    expect(new Set(areas).size).toBe(areas.length);
    expect(areas.slice(-2)).toEqual([SOURCE_AREA, PROFILE_AREA]);
    // Gegen die Coverage-Zeile geprüft und nicht gegen eine abgeschriebene Liste: sobald der
    // erste Bereich fachlich entschieden ist, ändert sich die Reihenfolge dort — und dann soll
    // sie sich hier mit ändern und nicht rot werden.
    const openOrder = sortedDomainReviewOpenByArea(
      releaseBlockers().domainReviewOpenByArea,
    ).map(([area]) => area);
    expect(areas.filter((area) => openOrder.includes(area))).toEqual(openOrder);
  });

  it('hält die Manifestreihenfolge innerhalb eines Bereichs', () => {
    const manifestKeys = COVERAGE_MANIFEST.entries.map((entry) =>
      entryKey(entry.sourceId, entry.variant),
    );
    const chapterFour = manifestRows.filter((row) => row.area === '4').map((row) => row.key);
    expect(chapterFour).toEqual(manifestKeys.filter((key) => chapterFour.includes(key)));
  });

  it('lässt einen vollständig entschiedenen Bereich nicht aus der Navigation fallen', () => {
    // `C` kommt in `openByArea` nicht vor — genau der Fall, den das echte Manifest heute nicht
    // hergibt, weil alle 558 Reviews offen sind.
    expect(manifestAreaOrder({ '4': 92, '1': 14 }, ['4', '1', 'C'])).toEqual(['4', '1', 'C']);
  });
});
