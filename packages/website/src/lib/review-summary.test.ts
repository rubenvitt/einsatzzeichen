import { describe, expect, it } from 'vitest';
import {
  bulkApprovalClause,
  bulkDomainApproval,
  bulkDomainApprovalOfRows,
  reviewSummary,
  reviewSummaryOfRows,
  type Reviewed,
} from './review-summary.js';
import { buildSnapshot } from './snapshot-build.js';

// `buildSnapshot()` statt der ladenden Funktion aus `snapshot.js`: eine reine Funktion über den
// Katalog, ohne die generierte, gitignorete Datei zu lesen. In CI läuft `pnpm test` vor dem
// Website-`generate`, das die Datei erst erzeugt — die ladende Funktion würfe hier mit dem
// Hinweis, den `snapshot-load.test.ts` dediziert prüft. Einmal pro Datei gebaut statt je Test: der
// Aufbau ist deterministisch.
const snapshot = buildSnapshot();

function entry(technical: string, domain: string): Reviewed {
  return {
    review: {
      technical: { status: technical as 'approved' },
      domain: { status: domain as 'approved' },
    },
  };
}

/** Eine fachliche Freigabe mit Herkunft, wie `domain-reviews.ts` sie schreibt. */
function approvedBy(reviewer: string, date: string, note = 'Sammelfreigabe im Rahmen von LFH-429'): Reviewed {
  return {
    review: {
      technical: { status: 'approved' },
      domain: { status: 'approved', reviewer, date, note },
    },
  };
}

describe('reviewSummary', () => {
  it('zählt beide Achsen getrennt', () => {
    const totals = reviewSummary([
      entry('approved', 'pending'),
      entry('approved', 'approved'),
      entry('deviation', 'pending'),
    ]);

    expect(totals.technical).toEqual({ approved: 2, deviation: 1, pending: 0, total: 3 });
    expect(totals.domain).toEqual({ approved: 1, deviation: 0, pending: 2, total: 3 });
  });

  it('liefert für eine leere Menge Nullen statt undefined', () => {
    expect(reviewSummary([])).toEqual({
      technical: { approved: 0, deviation: 0, pending: 0, total: 0 },
      domain: { approved: 0, deviation: 0, pending: 0, total: 0 },
    });
  });

  it('summiert die drei Stände zur Gesamtzahl — sonst stimmt keine Differenz auf den Seiten', () => {
    const totals = reviewSummary(snapshot.symbols);
    for (const axis of [totals.technical, totals.domain]) {
      expect(axis.approved + axis.deviation + axis.pending).toBe(axis.total);
    }
  });

  it('zählt jedes Zeichen des Snapshots auf beiden Achsen genau einmal', () => {
    const totals = reviewSummary(snapshot.symbols);
    expect(totals.technical.total).toBe(snapshot.symbols.length);
    expect(totals.domain.total).toBe(snapshot.symbols.length);
  });

  it('zählt die Prüfliste, deren Marken direkt am Objekt hängen', () => {
    const totals = reviewSummaryOfRows(snapshot.coverage.matrix);
    expect(totals.technical.total).toBe(snapshot.coverage.matrix.length);
    expect(totals.domain.total).toBe(snapshot.coverage.matrix.length);
    // Die Prüfliste zählt mehr als die Zeichenseiten: Bausteine ohne eigene Seite stehen darin.
    expect(totals.domain.total).toBeGreaterThan(reviewSummary(snapshot.symbols).domain.total);
  });

  it('zählt eine Abweichung nicht als ausstehend', () => {
    // Der Fehler, den dieser Test verhindert: Seiten, die „übrige = gesamt − geprüft" rechnen und
    // das Ergebnis „steht noch aus" nennen. Eine dokumentierte Abweichung ist geprüft — sie steht
    // nicht aus, und `pending` muss sie deshalb nicht mitführen.
    const totals = reviewSummary([
      entry('approved', 'approved'),
      entry('approved', 'deviation'),
      entry('approved', 'deviation'),
    ]);
    expect(totals.domain).toEqual({ approved: 1, deviation: 2, pending: 0, total: 3 });
    expect(totals.domain.total - totals.domain.approved).toBe(2);
    expect(totals.domain.pending).toBe(0);
  });

  it('bricht bei einem unbekannten Status ab, statt ihn stillschweigend zu verlieren', () => {
    expect(() => reviewSummary([entry('approved', 'freigegeben')])).toThrow(/freigegeben/);
    expect(() => reviewSummary([entry('approved', 'freigegeben')])).toThrow(/domain/);
  });
});

/**
 * Die drei Stände, an denen die Seiten ihren Satz wählen. Die Verzweigung selbst steht nicht in
 * `review-summary.ts`, sondern neunmal in Prosa: `pages/index.astro`, `pages/zeichen/index.astro`,
 * `content/docs/docs/index.mdx`, `coverage.mdx`, `grundlage.mdx` und die vier Anleitungen fragen
 * alle dasselbe — `approved === 0` heißt „kein Zeichen ist fachlich freigegeben",
 * `approved === total` heißt „alle", dazwischen kommt der Satz mit Zahlen. Ein Vitest erreicht
 * diese Ausdrücke nicht; prüfbar ist die Zahl, die den Zweig auswählt, und die wird hier für jeden
 * der drei Stände einzeln festgehalten statt nur als Summe.
 *
 * Synthetisch und ausdrücklich nicht auf den echten Daten: heute trifft der erste Stand zu (der
 * Ledger führt 558 offene Fachreviews). Ihn festzunageln hieße, den Test beim ersten echten
 * Fachreview scheitern zu lassen — gegen genau diesen festgeschriebenen Tagesstand ist das Modul
 * gebaut.
 */
describe('die Stände, an denen die Seiten ihren Satz wählen', () => {
  it('keine Freigabe: approved bleibt 0, obwohl gezählt wurde', () => {
    // Der Unterschied zur leeren Menge ist der ganze Punkt: dort ist auch `total` 0, und ein Satz
    // über „kein Zeichen von 42" wäre etwas anderes als einer über gar keine Zeichen.
    const totals = reviewSummary([
      entry('approved', 'pending'),
      entry('approved', 'pending'),
      entry('approved', 'pending'),
    ]);
    expect(totals.domain).toEqual({ approved: 0, deviation: 0, pending: 3, total: 3 });
    expect(totals.domain.total).toBeGreaterThan(0);
  });

  it('alle freigegeben: approved trifft total genau', () => {
    const totals = reviewSummary([
      entry('approved', 'approved'),
      entry('approved', 'approved'),
      entry('approved', 'approved'),
    ]);
    expect(totals.domain).toEqual({ approved: 3, deviation: 0, pending: 0, total: 3 });
    expect(totals.domain.approved).toBe(totals.domain.total);
  });

  it('teils: approved liegt zwischen beiden Rändern', () => {
    // Eine Abweichung ist geprüft und trotzdem nicht freigegeben — sie darf den Satz „alle" nicht
    // auslösen. Die Aufteilung auf beide Achsen prüft weiter oben `zählt beide Achsen getrennt`.
    const totals = reviewSummary([
      entry('approved', 'approved'),
      entry('approved', 'deviation'),
      entry('approved', 'pending'),
    ]);
    expect(totals.domain).toEqual({ approved: 1, deviation: 1, pending: 1, total: 3 });
    expect(totals.domain.approved).toBeGreaterThan(0);
    expect(totals.domain.approved).toBeLessThan(totals.domain.total);
  });
});

describe('bulkDomainApproval', () => {
  it('nennt Prüfer und Datum, wenn alle Freigaben aus einer Sammelfreigabe stammen', () => {
    const approval = bulkDomainApproval([
      approvedBy('Ruben Vitt', '2026-08-28'),
      approvedBy('Ruben Vitt', '2026-08-28'),
    ]);
    expect(approval).toEqual({ reviewer: 'Ruben Vitt', date: '2026-08-28' });
  });

  it('schweigt bei zwei Prüfern oder zwei Daten', () => {
    expect(
      bulkDomainApproval([approvedBy('Ruben Vitt', '2026-08-28'), approvedBy('A. Andere', '2026-08-28')]),
    ).toBeUndefined();
    expect(
      bulkDomainApproval([approvedBy('Ruben Vitt', '2026-08-28'), approvedBy('Ruben Vitt', '2026-09-01')]),
    ).toBeUndefined();
  });

  it('schweigt, wenn eine Notiz die Freigabe nicht als Sammelfreigabe ausweist', () => {
    expect(
      bulkDomainApproval([
        approvedBy('Ruben Vitt', '2026-08-28'),
        approvedBy('Ruben Vitt', '2026-08-28', 'Einzeln geprüft am Referenzblatt.'),
      ]),
    ).toBeUndefined();
  });

  it('nennt eine einzelne Freigabe nicht Sammelfreigabe', () => {
    expect(bulkDomainApproval([approvedBy('Ruben Vitt', '2026-08-28')])).toBeUndefined();
  });

  it('schweigt ohne Prüfer oder ohne Datum', () => {
    expect(bulkDomainApproval([entry('approved', 'approved'), entry('approved', 'approved')])).toBeUndefined();
  });

  it('nennt für die echten Daten keine — Zeichen wie Prüfliste', () => {
    // Der Ledger führt heute 558 offene Fachreviews und keine einzige Freigabe. Beide Wege
    // müssen darüber dasselbe sagen: die Startseite zählt die Prüfliste, die Anleitungen zählen
    // die Zeichen, und ein Halbsatz, den nur eine der beiden Seiten zeigt, wäre der Fehler.
    const fromSymbols = bulkDomainApproval(snapshot.symbols);
    const fromRows = bulkDomainApprovalOfRows(snapshot.coverage.matrix);
    expect(fromSymbols).toBeUndefined();
    expect(fromRows).toEqual(fromSymbols);
  });
});

describe('bulkApprovalClause', () => {
  it('hängt Prüfer und deutsches Datum an', () => {
    expect(bulkApprovalClause({ reviewer: 'Ruben Vitt', date: '2026-08-28' })).toBe(
      ' — als Sammelfreigabe des Projektinhabers, Ruben Vitt, 28.08.2026',
    );
  });

  it('bleibt leer, wenn es keine Sammelfreigabe zu nennen gibt', () => {
    expect(bulkApprovalClause(undefined)).toBe('');
  });
});
