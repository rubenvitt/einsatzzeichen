import { describe, expect, it } from 'vitest';
import type { QuestionCard } from '../contract';
import type { Draft } from './drafts';
import {
  assessDraft,
  describeReviewIssue,
  draftToReviewValue,
  unansweredQuestions,
} from './issues';

const REVIEWERS = ['rv'];

function draft(overrides: Partial<Draft> = {}): Draft {
  return {
    status: 'approved',
    note: 'Bedeutung, Eindeutigkeit und Profilzuordnung geprüft.',
    reviewer: 'rv',
    date: '2026-09-03',
    ...overrides,
  };
}

describe('describeReviewIssue', () => {
  it('übersetzt jeden Code in einen verständlichen Satz', () => {
    expect(describeReviewIssue({ role: 'domain', code: 'missing-reviewer' })).toBe(
      'Fachliches Review: Es fehlt der Prüfer. Ein abgeschlossenes Review braucht eine namentlich zurechenbare Person.',
    );
    expect(describeReviewIssue({ role: 'domain', code: 'invalid-date' })).toContain('JJJJ-MM-TT');
    expect(describeReviewIssue({ role: 'domain', code: 'missing-domain-note' })).toContain(
      'Befund',
    );
    expect(describeReviewIssue({ role: 'domain', code: 'missing-deviation-note' })).toContain(
      'Abweichung',
    );
    expect(describeReviewIssue({ role: 'technical', code: 'missing-reviewer' })).toMatch(
      /^Technisches Review: /,
    );
  });
});

describe('draftToReviewValue', () => {
  it('lässt leere Felder weg statt sie als Leerstring zu führen', () => {
    expect(draftToReviewValue(draft({ note: '   ', reviewer: '', date: '' }))).toEqual({
      status: 'approved',
    });
  });

  it('beschneidet Randleerzeichen', () => {
    expect(draftToReviewValue(draft({ note: '  Befund  ' })).note).toBe('Befund');
  });
});

describe('unansweredQuestions', () => {
  const questions: QuestionCard[] = [
    { id: 'Q-4-abgrenzung', question: 'Ist die Abgrenzung tragfähig?' },
    { id: 'Q-4-farbe', question: 'Stimmt die Farbzuordnung?' },
  ];

  it('meldet die Fragen, die der Befund nicht nennt', () => {
    expect(unansweredQuestions('Antwort zu Q-4-farbe: ja.', questions).map((q) => q.id)).toEqual([
      'Q-4-abgrenzung',
    ]);
  });

  it('erkennt die ID unabhängig von der Schreibweise', () => {
    expect(unansweredQuestions('q-4-ABGRENZUNG und Q-4-Farbe beantwortet', questions)).toEqual([]);
  });
});

describe('assessDraft', () => {
  it('gibt einen vollständigen Befund frei', () => {
    const result = assessDraft({ draft: draft(), questions: [], reviewerIds: REVIEWERS });
    expect(result.blockers).toEqual([]);
    expect(result.canSave).toBe(true);
  });

  it('sperrt eine Freigabe ohne Notiz und nennt den Grund im Klartext', () => {
    const result = assessDraft({
      draft: draft({ note: '' }),
      questions: [],
      reviewerIds: REVIEWERS,
    });
    expect(result.canSave).toBe(false);
    expect(result.blockers).toEqual([
      'Fachliches Review: Eine Freigabe braucht einen Befund in der Notiz: Semantik, visuelle Eindeutigkeit und Profilzuordnung.',
    ]);
  });

  it('sperrt eine Abweichung ohne Begründung und ein ungültiges Datum', () => {
    const result = assessDraft({
      draft: draft({ status: 'deviation', note: '', date: '03.09.2026' }),
      questions: [],
      reviewerIds: REVIEWERS,
    });
    expect(result.blockers).toHaveLength(2);
    expect(result.canSave).toBe(false);
  });

  it('sperrt generell, solange das Register leer ist', () => {
    const result = assessDraft({
      draft: draft({ status: 'pending', note: '', reviewer: '', date: '' }),
      questions: [],
      reviewerIds: [],
    });
    expect(result.canSave).toBe(false);
    expect(result.blockers[0]).toContain('Register ist leer');
  });

  it('sperrt einen Prüfer, der nicht im Register steht', () => {
    const result = assessDraft({ draft: draft({ reviewer: 'fremd' }), questions: [], reviewerIds: REVIEWERS });
    expect(result.canSave).toBe(false);
    expect(result.blockers[0]).toContain('steht nicht im Register');
  });

  it('lässt „offen" ohne Notiz und Datum zu — das ist keine abgeschlossene Prüfung', () => {
    const result = assessDraft({
      draft: draft({ status: 'pending', note: '', date: '' }),
      questions: [],
      reviewerIds: REVIEWERS,
    });
    expect(result.canSave).toBe(true);
  });

  it('warnt vor einem technischen Mangel, sperrt aber nicht — er ist hier nicht behebbar', () => {
    const result = assessDraft({
      draft: draft(),
      technical: { status: 'approved', date: '2026-08-01' },
      questions: [],
      reviewerIds: REVIEWERS,
    });
    expect(result.canSave).toBe(true);
    expect(result.warnings.some((text) => text.startsWith('Technisches Review:'))).toBe(true);
  });

  it('warnt vor einer Freigabe, die eine registrierte Frage übergeht', () => {
    const result = assessDraft({
      draft: draft(),
      questions: [{ id: 'Q-4-abgrenzung', question: 'Ist die Abgrenzung tragfähig?' }],
      reviewerIds: REVIEWERS,
    });
    expect(result.canSave).toBe(true);
    expect(result.warnings.join(' ')).toContain('Q-4-abgrenzung');
  });

  it('schweigt zu Fragen, solange die Zeile offen bleibt', () => {
    const result = assessDraft({
      draft: draft({ status: 'pending' }),
      questions: [{ id: 'Q-4-abgrenzung', question: 'Ist die Abgrenzung tragfähig?' }],
      reviewerIds: REVIEWERS,
    });
    expect(result.warnings).toEqual([]);
  });
});
