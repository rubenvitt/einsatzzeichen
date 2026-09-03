/**
 * Die Freigabefähigkeit eines Entwurfs. Die Regel selbst kommt aus `reviewIssues()` in `schema` —
 * derselben Funktion, die das Coverage-Gate benutzt. Hier steht nur die Übersetzung ihrer Codes in
 * deutsche Sätze und der Zuschnitt darauf, was in diesem Formular überhaupt behebbar ist. Es gibt
 * ausdrücklich kein zweites Regelwerk, das auseinanderlaufen könnte.
 */
import { reviewIssues } from '@einsatzzeichen/schema';
import type { ReviewIssue, ReviewIssueCode, ReviewRole } from '@einsatzzeichen/schema';
import type { QuestionCard, ReviewValue } from '../contract';
import type { Draft } from './drafts';

const ISSUE_TEXTS: Record<ReviewIssueCode, string> = {
  'missing-reviewer':
    'Es fehlt der Prüfer. Ein abgeschlossenes Review braucht eine namentlich zurechenbare Person.',
  'invalid-date': 'Das Datum fehlt oder ist kein gültiges ISO-Datum in der Form JJJJ-MM-TT.',
  'missing-domain-note':
    'Eine Freigabe braucht einen Befund in der Notiz: Semantik, visuelle Eindeutigkeit und Profilzuordnung.',
  'missing-deviation-note':
    'Eine Abweichung braucht eine konkrete Beschreibung der Abweichung und die Begründung, warum sie hingenommen wird.',
};

const ROLE_TEXTS: Record<ReviewRole, string> = {
  technical: 'Technisches Review',
  domain: 'Fachliches Review',
};

export function describeReviewIssue(issue: ReviewIssue): string {
  return `${ROLE_TEXTS[issue.role]}: ${ISSUE_TEXTS[issue.code]}`;
}

/** Der Entwurf als Reviewobjekt; leere Felder werden weggelassen und nicht als Leerstring gespeichert. */
export function draftToReviewValue(draft: Draft): ReviewValue {
  const note = draft.note.trim();
  const reviewer = draft.reviewer.trim();
  const date = draft.date.trim();
  return {
    status: draft.status,
    ...(reviewer === '' ? {} : { reviewer }),
    ...(date === '' ? {} : { date }),
    ...(note === '' ? {} : { note }),
  };
}

/**
 * Fragen, die der Befund nicht erwähnt. Der Prüfmaßstab der Übergabe ist eindeutig: „Eine
 * Freigabe, die eine registrierte Frage übergeht, ist unvollständig." Wir können nicht prüfen, ob
 * die Antwort gut ist — aber ob die ID überhaupt vorkommt. Deshalb ein Hinweis und keine Sperre:
 * eine mechanische Sperre würde zum Einfügen der ID ohne Antwort erziehen.
 */
export function unansweredQuestions(
  note: string,
  questions: readonly QuestionCard[],
): QuestionCard[] {
  const haystack = note.toLowerCase();
  return questions.filter((question) => !haystack.includes(question.id.toLowerCase()));
}

export interface DraftAssessment {
  /** Die rohen Meldungen aus `reviewIssues()`, für die Anzeige in der Befundtafel. */
  issues: readonly ReviewIssue[];
  /** Gründe, die das Speichern sperren — im Klartext, in der Reihenfolge der Anzeige. */
  blockers: readonly string[];
  /** Hinweise, die nicht sperren. */
  warnings: readonly string[];
  canSave: boolean;
}

export interface AssessInput {
  draft: Draft;
  /** Das technische Review der Zeile; fehlt es, gilt es als offen. */
  technical?: ReviewValue;
  questions: readonly QuestionCard[];
  /** Die Kennungen aus dem Reviewer-Register. Leer heißt: Schreiben ist generell gesperrt. */
  reviewerIds: readonly string[];
}

export function assessDraft(input: AssessInput): DraftAssessment {
  const { draft, technical, questions, reviewerIds } = input;
  const domain = draftToReviewValue(draft);
  const issues = reviewIssues({
    technical: technical ?? { status: 'pending' },
    domain,
  });

  const blockers: string[] = [];
  const warnings: string[] = [];

  if (reviewerIds.length === 0) {
    blockers.push(
      'Das Reviewer-Register ist leer. Ohne einen benannten Fachprüfer wird nichts geschrieben.',
    );
  } else if (draft.status !== 'pending' && domain.reviewer !== undefined) {
    if (!reviewerIds.includes(domain.reviewer)) {
      blockers.push(
        `Der Prüfer „${domain.reviewer}" steht nicht im Register. Wähle einen registrierten Prüfer oder lege ihn an.`,
      );
    }
  }

  for (const issue of issues) {
    // Nur fachliche Mängel sperren: ein Mangel am technischen Review ist in diesem Formular
    // nicht behebbar und würde die Zeile sonst dauerhaft blockieren.
    if (issue.role === 'domain') blockers.push(describeReviewIssue(issue));
    else warnings.push(describeReviewIssue(issue));
  }

  if (draft.status !== 'pending') {
    const open = unansweredQuestions(draft.note, questions);
    if (open.length > 0) {
      warnings.push(
        `Der Befund erwähnt ${open.length === 1 ? 'die Frage' : 'die Fragen'} ${open
          .map((question) => question.id)
          .join(', ')} nicht. Eine Entscheidung, die eine registrierte Frage übergeht, ist unvollständig.`,
      );
    }
  }

  return { issues, blockers, warnings, canSave: blockers.length === 0 };
}
