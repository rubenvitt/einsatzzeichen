import { describe, expect, it } from 'vitest';
import { reviewSummary, reviewSummaryOfRows, type Reviewed } from './review-summary.js';
import { loadSnapshot } from './snapshot.js';

function entry(technical: string, domain: string): Reviewed {
  return {
    review: {
      technical: { status: technical as 'approved' },
      domain: { status: domain as 'approved' },
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

  it('bricht bei einem unbekannten Status ab, statt ihn stillschweigend zu verlieren', () => {
    expect(() => reviewSummary([entry('approved', 'freigegeben')])).toThrow(/freigegeben/);
    expect(() => reviewSummary([entry('approved', 'freigegeben')])).toThrow(/domain/);
  });
});
