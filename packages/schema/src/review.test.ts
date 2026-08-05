import { describe, expect, it } from 'vitest';
import { unattributedRoles, type ReviewSet } from './review.js';

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

  it('verlangt Zurechnung nur bei approved, nicht bei deviation oder pending', () => {
    const set: ReviewSet = { technical: { status: 'deviation' }, domain: { status: 'pending' } };
    expect(unattributedRoles(set)).toEqual([]);
  });
});
