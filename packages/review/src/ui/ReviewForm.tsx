/**
 * Das Formular und die Meldungen darunter. Der Speichern-Knopf ist gesperrt, solange
 * `assessDraft()` etwas meldet — und der Grund steht im Klartext daneben. Eine gesperrte
 * Schaltfläche ohne Begründung wäre eine Sackgasse.
 */
import type { JSX } from 'react';
import type { ReviewStatus } from '@einsatzzeichen/schema';
import type { ReviewerRecord } from '../contract';
import type { Draft } from './drafts';
import { statusLabel, STATUS_ORDER } from './format';
import type { DraftAssessment } from './issues';

interface ReviewFormProps {
  draft: Draft;
  onDraft: (draft: Draft) => void;
  reviewers: readonly ReviewerRecord[];
  assessment: DraftAssessment;
  dirty: boolean;
  saving: boolean;
  saveError: string | null;
  onSave: () => void;
}

const STATUS_KEYS: Record<ReviewStatus, string> = {
  pending: '0',
  approved: 'a',
  deviation: 'w',
};

export function ReviewForm(props: ReviewFormProps): JSX.Element {
  const { draft, assessment } = props;
  const patch = (part: Partial<Draft>): void => props.onDraft({ ...draft, ...part });

  return (
    <section>
      <h2>Befund</h2>
      <div className="formular">
        <div className="statuswahl" role="group" aria-label="Status des fachlichen Reviews">
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              className={`statusknopf statusknopf--${status}`}
              aria-pressed={draft.status === status}
              onClick={() => patch({ status })}
            >
              {statusLabel(status)}
              <small>
                <kbd>{STATUS_KEYS[status]}</kbd>
              </small>
            </button>
          ))}
        </div>

        <label>
          Notiz — Befund, Bezugsstand, Antworten auf die Fragen
          <textarea
            value={draft.note}
            onChange={(event) => patch({ note: event.target.value })}
            placeholder="Semantik, visuelle Eindeutigkeit, Profilzuordnung; geprüfter Dokumentstand und SHA-256; bei Abweichung die Begründung."
          />
        </label>

        <label>
          Prüfer
          <select
            value={draft.reviewer}
            onChange={(event) => patch({ reviewer: event.target.value })}
          >
            <option value="">— bitte wählen —</option>
            {props.reviewers.map((reviewer) => (
              <option key={reviewer.id} value={reviewer.id}>
                {reviewer.name} ({reviewer.id}) — {reviewer.qualification}
              </option>
            ))}
          </select>
        </label>

        <label>
          Datum
          <input
            type="date"
            value={draft.date}
            onChange={(event) => patch({ date: event.target.value })}
          />
        </label>

        <button
          type="button"
          className="speichern"
          disabled={!assessment.canSave || props.saving}
          onClick={props.onSave}
        >
          {props.saving ? 'Wird geschrieben …' : 'In den Ledger schreiben'}
        </button>

        <p className="statuszeile">
          {props.dirty
            ? 'Entwurf weicht vom Ledger ab — lokal gesichert, aber noch nicht geschrieben.'
            : 'Entwurf entspricht dem Ledgerstand.'}
        </p>

        {props.saveError !== null ? (
          <p className="meldung meldung--sperre">Schreiben fehlgeschlagen: {props.saveError}</p>
        ) : null}

        {assessment.blockers.length > 0 || assessment.warnings.length > 0 ? (
          <ul className="meldungen">
            {assessment.blockers.map((text) => (
              <li key={text} className="meldung meldung--sperre">
                {text}
              </li>
            ))}
            {assessment.warnings.map((text) => (
              <li key={text} className="meldung">
                {text}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
