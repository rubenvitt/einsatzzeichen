import { describe, expect, it } from 'vitest';
import { reviewIssues, unattributedRoles, type ReviewSet } from './review.js';

const approved = { status: 'approved', reviewer: 'rv', date: '2026-08-05' } as const;

describe('Reviewmodell', () => {
  it('meldet keine Rolle, wenn beide Rollen zurechenbar sind', () => {
    const set: ReviewSet = { technical: approved, domain: { status: 'pending' } };
    expect(unattributedRoles(set)).toEqual([]);
  });

  it('meldet die Rolle, deren approved keinen Reviewer trägt', () => {
    const set: ReviewSet = {
      technical: { status: 'approved', date: '2026-08-05' },
      domain: { status: 'pending' },
    };
    expect(unattributedRoles(set)).toEqual(['technical']);
  });

  it('meldet die Rolle, deren approved kein Datum trägt', () => {
    const set: ReviewSet = { technical: approved, domain: { status: 'approved', reviewer: 'rv' } };
    expect(unattributedRoles(set)).toEqual(['domain']);
  });

  it('meldet beide Rollen, wenn beide approved ohne Zurechnung sind', () => {
    const set: ReviewSet = { technical: { status: 'approved' }, domain: { status: 'approved' } };
    expect(unattributedRoles(set)).toEqual(['technical', 'domain']);
  });

  it('verlangt bei deviation dieselbe Zurechnung und zusätzlich eine Begründung', () => {
    const set: ReviewSet = { technical: { status: 'deviation' }, domain: { status: 'pending' } };
    expect(reviewIssues(set)).toEqual([
      { role: 'technical', code: 'missing-reviewer' },
      { role: 'technical', code: 'invalid-date' },
      { role: 'technical', code: 'missing-deviation-note' },
    ]);
    expect(unattributedRoles(set)).toEqual(['technical']);
  });

  it('lehnt leere Reviewer und kalendarisch ungültige ISO-Daten ab', () => {
    const set: ReviewSet = {
      technical: { status: 'approved', reviewer: '   ', date: '2026-02-30' },
      domain: { status: 'pending' },
    };
    expect(reviewIssues(set)).toEqual([
      { role: 'technical', code: 'missing-reviewer' },
      { role: 'technical', code: 'invalid-date' },
    ]);
  });

  it('akzeptiert eine zurechenbare und begründete Abweichung', () => {
    const set: ReviewSet = {
      technical: {
        status: 'deviation',
        reviewer: 'rv',
        date: '2026-08-06',
        note: 'Bewusste Abweichung.',
      },
      domain: { status: 'pending' },
    };
    expect(reviewIssues(set)).toEqual([]);
  });

  it('verlangt für eine fachliche Freigabe einen versionierbaren Befund', () => {
    const set: ReviewSet = {
      technical: approved,
      domain: { status: 'approved', reviewer: 'fachreview', date: '2026-08-06' },
    };
    expect(reviewIssues(set)).toEqual([{ role: 'domain', code: 'missing-domain-note' }]);
  });

  it('akzeptiert eine fachliche Freigabe mit Befundnotiz', () => {
    const set: ReviewSet = {
      technical: approved,
      domain: {
        status: 'approved',
        reviewer: 'fachreview',
        date: '2026-08-06',
        note: 'Geprüfter Stand und Protokoll: reviews/fachreview-1.md.',
      },
    };
    expect(reviewIssues(set)).toEqual([]);
  });
});
