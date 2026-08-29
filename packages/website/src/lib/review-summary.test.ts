import { describe, expect, it } from 'vitest';
import {
  bulkApprovalClause,
  bulkDomainApproval,
  bulkDomainApprovalOfRows,
  reviewSummary,
  reviewSummaryOfRows,
  type Reviewed,
} from './review-summary.js';
import { loadSnapshot } from './snapshot.js';

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
    const totals = reviewSummary(loadSnapshot().symbols);
    for (const axis of [totals.technical, totals.domain]) {
      expect(axis.approved + axis.deviation + axis.pending).toBe(axis.total);
    }
  });

  it('zählt jedes Zeichen des Snapshots auf beiden Achsen genau einmal', () => {
    const snapshot = loadSnapshot();
    const totals = reviewSummary(snapshot.symbols);
    expect(totals.technical.total).toBe(snapshot.symbols.length);
    expect(totals.domain.total).toBe(snapshot.symbols.length);
  });

  it('zählt die Prüfliste, deren Marken direkt am Objekt hängen', () => {
    const snapshot = loadSnapshot();
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

  it('findet die Sammelfreigabe in den echten Daten — Zeichen wie Prüfliste', () => {
    const snapshot = loadSnapshot();
    const fromSymbols = bulkDomainApproval(snapshot.symbols);
    const fromRows = bulkDomainApprovalOfRows(snapshot.coverage.matrix);
    expect(fromSymbols).toBeDefined();
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
